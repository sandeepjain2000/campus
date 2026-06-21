import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getEmployerProfileId } from '@/lib/employerApplicationAccess';
import { isAuthoritativeResumeUrl } from '@/lib/studentResumeUrl';
import { formatStudentSystemId } from '@/lib/studentSystemId';
import { notifyStudentSelection } from '@/lib/studentSelectionNotify';
import {



  AND_APP_NOT_DELETED,
  AND_DRIVE_NOT_DELETED,
  AND_JP_NOT_DELETED,
  AND_PA_NOT_DELETED,
} from '@/lib/softDeleteSql';
import { SP_ACTIVE_CLAUSE } from '@/lib/studentProfileActive';
import {
  dedupeEmployerApplicationItems,
  employerMayUpdateApplicationStatus,
  normalizeEmployerApplicationStatus,
} from '@/lib/employerApplicationList';
import {
  assertEmployerMayConfirmStudent,
  fcfsTrackFromApplicationsTab,
  getCampusFcfsClaim,
} from '@/lib/campusFcfsSelection';
import { sqlJobAcademicYearFilter } from '@/lib/employerAcademicYear';
import { resolveTenantAcademicYear } from '@/lib/resolveAcademicYearFromRequest';
import { respondPlatformError , withApiHandlers } from '@/lib/platformErrorRoute';
import { PLATFORM_ERROR_CONTEXT } from '@/lib/platformErrorContext';
const JOB_POSTING_TYPES_SQL = `AND jp.job_type NOT IN ('internship', 'short_project', 'hackathon')`;

export const dynamic = 'force-dynamic';
export const revalidate = 0;



/** @param {import('pg').QueryResultRow} row */
function mapRow(row) {
  const first = row.first_name || '';
  const last = row.last_name || '';
  const hasResume = Boolean(row.resume_document_id || isAuthoritativeResumeUrl(row.resume_url));
  return {
    id: row.id,
    sourceKind: row.source_kind,
    status: normalizeEmployerApplicationStatus(row.application_status ?? row.status),
    appliedAt: row.applied_at,
    currentRound: row.current_round,
    jobId: row.job_id || null,
    studentProfileId: row.student_id,
    studentName: `${first} ${last}`.trim() || row.email || 'Student',
    email: row.email,
    rollNumber: row.roll_number || '',
    systemId: formatStudentSystemId(row.short_code, row.roll_number),
    collegeName: row.college_name || '—',
    branch: row.branch || row.department || '—',
    cgpa: row.cgpa != null ? Number(row.cgpa) : null,
    hasResume,
    resumeUrl: hasResume ? `/api/employer/applications/resume?studentId=${encodeURIComponent(row.student_id)}` : null,
    resumeFileName: row.resume_document_name || null,
    documentCount: Number(row.document_count) || 0,
    openingTitle: row.opening_title || '—',
    jobType: row.job_type || null,
    driveId: row.drive_id,
    notes: row.notes || null,
    tenantId: row.tenant_id || null,
  };
}

async function filterItemsByFcfs(items, tab, employerId) {
  const track = fcfsTrackFromApplicationsTab(tab);
  if (!track || !employerId) return items;

  const out = [];
  for (const item of items) {
    if (!item.tenantId || !item.studentProfileId) {
      out.push(item);
      continue;
    }
    const claim = await getCampusFcfsClaim(item.tenantId, item.studentProfileId, track);
    if (claim && String(claim.employerId) !== String(employerId)) {
      continue;
    }
    out.push(item);
  }
  return out;
}

/**
 * GET ?tab=drives|jobs|internships|projects
 * Drives = placement drive applications. Jobs / internships / projects = program_applications.
 */
async function __platform_GET(request) {
  let session = null;
  let employerId = null;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const tabParam = (searchParams.get('tab') || 'drives').toLowerCase();
    const tab =
      tabParam === 'jobs' || tabParam === 'internships' || tabParam === 'projects' ? tabParam : 'drives';
    const driveIdFilter = String(searchParams.get('driveId') || '').trim();
    const jobIdFilter = String(searchParams.get('jobId') || '').trim();
    const campusId = String(searchParams.get('campusId') || '').trim() || null;

    let academicYearId = null;
    if (campusId) {
      try {
        // Optional campus scope only — do not block the list on tie-up status (matches drives tab).
        const ay = await resolveTenantAcademicYear(campusId, searchParams);
        academicYearId = ay.year?.id || null;
      } catch (ayErr) {
        if (ayErr?.statusCode === 400) {
          return NextResponse.json({ error: ayErr.message }, { status: ayErr.statusCode });
        }
        throw ayErr;
      }
    }

    const scopeParams = [employerId];
    let drivesDriveIdx = null;
    let jobsJobIdx = null;
    let internshipsJobIdx = null;
    let projectsJobIdx = null;
    let campusIdx = null;
    let yearIdx = null;

    if (driveIdFilter) {
      scopeParams.push(driveIdFilter);
      drivesDriveIdx = scopeParams.length;
    }
    if (jobIdFilter) {
      scopeParams.push(jobIdFilter);
      jobsJobIdx = scopeParams.length;
      internshipsJobIdx = scopeParams.length;
      projectsJobIdx = scopeParams.length;
    }
    if (campusId) {
      scopeParams.push(campusId);
      campusIdx = scopeParams.length;
    }
    if (academicYearId) {
      scopeParams.push(academicYearId);
      yearIdx = scopeParams.length;
    }

    const driveCampusSql = campusIdx ? ` AND d.tenant_id = $${campusIdx}::uuid` : '';
    // Placement drive applicants match the drives list: campus scope only (no academic-year or tie-up gate).
    const jobVisSql = campusIdx
      ? ` INNER JOIN job_posting_visibility jpv_scope ON jpv_scope.job_id = jp.id AND jpv_scope.tenant_id = $${campusIdx}::uuid`
      : '';
    const programCampusSql = campusIdx ? ` AND sp.tenant_id = $${campusIdx}::uuid` : '';
    const jobYearSql = yearIdx ? sqlJobAcademicYearFilter('jp', yearIdx) : '';

    const countsSql = `
      SELECT
        (SELECT COUNT(*)::int FROM applications a
         INNER JOIN placement_drives d ON d.id = a.drive_id
         INNER JOIN student_profiles sp ON sp.id = a.student_id AND ${SP_ACTIVE_CLAUSE}
         WHERE d.employer_id = $1::uuid
           AND a.status <> 'withdrawn'
           ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}
           ${drivesDriveIdx ? `AND d.id = $${drivesDriveIdx}::uuid` : ''}${driveCampusSql}) AS drives,
        (SELECT COUNT(*)::int FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN student_profiles sp ON sp.id = pa.student_id AND ${SP_ACTIVE_CLAUSE}
         WHERE jp.employer_id = $1::uuid
           ${JOB_POSTING_TYPES_SQL}
           AND pa.status <> 'withdrawn'
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${jobsJobIdx ? `AND jp.id = $${jobsJobIdx}::uuid` : ''}${programCampusSql}${jobYearSql}) AS jobs,
        (SELECT COUNT(*)::int FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN student_profiles sp ON sp.id = pa.student_id AND ${SP_ACTIVE_CLAUSE}
         WHERE jp.employer_id = $1::uuid AND jp.job_type = 'internship'
           AND pa.status <> 'withdrawn'
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${internshipsJobIdx ? `AND jp.id = $${internshipsJobIdx}::uuid` : ''}${programCampusSql}${jobYearSql}) AS internships,
        (SELECT COUNT(*)::int FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN student_profiles sp ON sp.id = pa.student_id AND ${SP_ACTIVE_CLAUSE}
         WHERE jp.employer_id = $1::uuid AND jp.job_type IN ('short_project', 'hackathon')
           AND pa.status <> 'withdrawn'
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${projectsJobIdx ? `AND jp.id = $${projectsJobIdx}::uuid` : ''}${programCampusSql}${jobYearSql}) AS projects
    `;
    const countsRes = await query(countsSql, scopeParams);
    const counts = countsRes.rows[0] || { drives: 0, jobs: 0, internships: 0, projects: 0 };

    const resumeLateral = `LEFT JOIN LATERAL (
           SELECT sd.id, sd.document_name, sd.file_url
           FROM student_documents sd
           WHERE sd.student_id = sp.id
             AND sd.document_type = 'resume'
           ORDER BY sd.uploaded_at DESC
           LIMIT 1
         ) resume_doc ON TRUE`;

    let itemsRes;
    const driveItemFilterSql = `${drivesDriveIdx ? `AND d.id = $${drivesDriveIdx}::uuid` : ''}${driveCampusSql}`;
    const jobItemFilterSql = (jobIdx) =>
      `${jobIdx ? `AND jp.id = $${jobIdx}::uuid` : ''}${jobYearSql}`;

    if (tab === 'drives') {
      itemsRes = await query(
        `SELECT
           a.id,
           'drive' AS source_kind,
           a.status AS application_status,
           a.applied_at,
           a.current_round,
           sp.id AS student_id,
           sp.tenant_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
           t.short_code,
           sp.roll_number,
           sp.branch,
           sp.department,
           sp.cgpa,
           sp.resume_url,
           resume_doc.id AS resume_document_id,
           resume_doc.document_name AS resume_document_name,
           resume_doc.file_url AS resume_document_url,
           (SELECT COUNT(*)::int FROM student_documents sd_all WHERE sd_all.student_id = sp.id) AS document_count,
           d.title AS opening_title,
           'placement_drive'::text AS job_type,
           d.id AS drive_id,
           NULL::uuid AS job_id,
           NULL::text AS notes
         FROM applications a
         INNER JOIN placement_drives d ON d.id = a.drive_id
         INNER JOIN employer_profiles ep ON ep.id = d.employer_id
         INNER JOIN student_profiles sp ON sp.id = a.student_id
         INNER JOIN users u ON u.id = sp.user_id
         LEFT JOIN tenants t ON t.id = sp.tenant_id
         ${resumeLateral}
         WHERE ep.id = $1::uuid
           AND ${SP_ACTIVE_CLAUSE}
           ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}
           ${driveItemFilterSql}
         ORDER BY a.applied_at DESC`,
        scopeParams,
      );
    } else if (tab === 'jobs') {
      itemsRes = await query(
        `SELECT
           pa.id,
           'program' AS source_kind,
           pa.status AS application_status,
           pa.applied_at,
           NULL::int AS current_round,
           sp.id AS student_id,
           sp.tenant_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
           t.short_code,
           sp.roll_number,
           sp.branch,
           sp.department,
           sp.cgpa,
           sp.resume_url,
           resume_doc.id AS resume_document_id,
           resume_doc.document_name AS resume_document_name,
           resume_doc.file_url AS resume_document_url,
           (SELECT COUNT(*)::int FROM student_documents sd_all WHERE sd_all.student_id = sp.id) AS document_count,
           jp.title AS opening_title,
           jp.job_type::text AS job_type,
           NULL::uuid AS drive_id,
           pa.job_id,
           pa.notes
         FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
         INNER JOIN student_profiles sp ON sp.id = pa.student_id
         INNER JOIN users u ON u.id = sp.user_id
         LEFT JOIN tenants t ON t.id = sp.tenant_id
         ${resumeLateral}
         WHERE ep.id = $1::uuid
           ${JOB_POSTING_TYPES_SQL}
           AND ${SP_ACTIVE_CLAUSE}
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${jobItemFilterSql(jobsJobIdx)}${programCampusSql}
         ORDER BY pa.applied_at DESC`,
        scopeParams,
      );
    } else if (tab === 'internships') {
      itemsRes = await query(
        `SELECT
           pa.id,
           'program' AS source_kind,
           pa.status AS application_status,
           pa.applied_at,
           NULL::int AS current_round,
           sp.id AS student_id,
           sp.tenant_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
           t.short_code,
           sp.roll_number,
           sp.branch,
           sp.department,
           sp.cgpa,
           sp.resume_url,
           resume_doc.id AS resume_document_id,
           resume_doc.document_name AS resume_document_name,
           resume_doc.file_url AS resume_document_url,
           (SELECT COUNT(*)::int FROM student_documents sd_all WHERE sd_all.student_id = sp.id) AS document_count,
           jp.title AS opening_title,
           jp.job_type::text AS job_type,
           NULL::uuid AS drive_id,
           pa.job_id,
           pa.notes
         FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
         INNER JOIN student_profiles sp ON sp.id = pa.student_id
         INNER JOIN users u ON u.id = sp.user_id
         LEFT JOIN tenants t ON t.id = sp.tenant_id
         LEFT JOIN LATERAL (
           SELECT sd.id, sd.document_name, sd.file_url
           FROM student_documents sd
           WHERE sd.student_id = sp.id
             AND sd.document_type = 'resume'
           ORDER BY sd.uploaded_at DESC
           LIMIT 1
         ) resume_doc ON TRUE
         WHERE ep.id = $1::uuid AND jp.job_type = 'internship'
           AND ${SP_ACTIVE_CLAUSE}
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${jobItemFilterSql(internshipsJobIdx)}${programCampusSql}
         ORDER BY pa.applied_at DESC`,
        scopeParams,
      );
    } else {
      itemsRes = await query(
        `SELECT
           pa.id,
           'program' AS source_kind,
           pa.status AS application_status,
           pa.applied_at,
           NULL::int AS current_round,
           sp.id AS student_id,
           sp.tenant_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
           t.short_code,
           sp.roll_number,
           sp.branch,
           sp.department,
           sp.cgpa,
           sp.resume_url,
           resume_doc.id AS resume_document_id,
           resume_doc.document_name AS resume_document_name,
           resume_doc.file_url AS resume_document_url,
           (SELECT COUNT(*)::int FROM student_documents sd_all WHERE sd_all.student_id = sp.id) AS document_count,
           jp.title AS opening_title,
           jp.job_type::text AS job_type,
           NULL::uuid AS drive_id,
           pa.job_id,
           pa.notes
         FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         ${jobVisSql}
         INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
         INNER JOIN student_profiles sp ON sp.id = pa.student_id
         INNER JOIN users u ON u.id = sp.user_id
         LEFT JOIN tenants t ON t.id = sp.tenant_id
         LEFT JOIN LATERAL (
           SELECT sd.id, sd.document_name, sd.file_url
           FROM student_documents sd
           WHERE sd.student_id = sp.id
             AND sd.document_type = 'resume'
           ORDER BY sd.uploaded_at DESC
           LIMIT 1
         ) resume_doc ON TRUE
         WHERE ep.id = $1::uuid AND jp.job_type IN ('short_project', 'hackathon')
           AND ${SP_ACTIVE_CLAUSE}
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
           ${jobItemFilterSql(projectsJobIdx)}${programCampusSql}
         ORDER BY pa.applied_at DESC`,
        scopeParams,
      );
    }

    let items = dedupeEmployerApplicationItems(itemsRes.rows.map(mapRow));
    items = await filterItemsByFcfs(items, tab, employerId);

    return NextResponse.json({
      tab,
      driveId: driveIdFilter || null,
      jobId: jobIdFilter || null,
      counts: {
        drives: Number(counts.drives) || 0,
        jobs: Number(counts.jobs) || 0,
        internships: Number(counts.internships) || 0,
        projects: Number(counts.projects) || 0,
      },
      items,
    });
  } catch (e) {
    return respondPlatformError(e, {
      context: PLATFORM_ERROR_CONTEXT.EMPLOYER_APPLICATION_LIST,
      request,
      sessionUser: session?.user,
      employerId: employerId || null,
      defaultMessage: 'Failed to load applications',
      logLabel: 'GET /api/employer/applications',
    });
  }
}

async function __platform_PATCH(request) {
  let session = null;
  let employerId = null;
  let body = {};
  try {
    session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || '').trim();
    const sourceKind = String(body?.sourceKind || '').trim().toLowerCase();
    const nextStatus = String(body?.status || '').trim().toLowerCase();
    const allowed = new Set(['applied', 'shortlisted', 'in_progress', 'selected', 'rejected', 'on_hold']);
    if (!applicationId || !['drive', 'program'].includes(sourceKind) || !allowed.has(nextStatus)) {
      return NextResponse.json({ error: 'applicationId, sourceKind and valid status are required' }, { status: 400 });
    }

    const currentRes =
      sourceKind === 'drive'
        ? await query(
            `SELECT a.status
             FROM applications a
             INNER JOIN placement_drives d ON d.id = a.drive_id
             WHERE a.id = $1::uuid AND d.employer_id = $2::uuid
               ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}
             LIMIT 1`,
            [applicationId, employerId],
          )
        : await query(
            `SELECT pa.status
             FROM program_applications pa
             INNER JOIN job_postings jp ON jp.id = pa.job_id
             WHERE pa.id = $1::uuid AND jp.employer_id = $2::uuid
               ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
             LIMIT 1`,
            [applicationId, employerId],
          );

    const currentStatus = currentRes.rows[0]?.status;
    if (!currentRes.rows[0]) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const mayUpdate = employerMayUpdateApplicationStatus(currentStatus, nextStatus);
    if (!mayUpdate.ok) {
      return NextResponse.json({ error: mayUpdate.error }, { status: 409 });
    }

    let metaResultRow = null;
    let studentProfileId = null;
    if (nextStatus === 'selected') {
      let track = 'placement';
      let tenantId = null;

      if (sourceKind === 'drive') {
        const meta = await query(
          `SELECT sp.tenant_id, sp.id AS student_id, d.id AS drive_id, d.title AS drive_title, d.employer_id, ep.company_name, u.first_name, COALESCE(u.communication_email, u.email) AS email, u.id AS student_user_id
           FROM applications a
           INNER JOIN student_profiles sp ON sp.id = a.student_id
           INNER JOIN users u ON u.id = sp.user_id
           INNER JOIN placement_drives d ON d.id = a.drive_id
           INNER JOIN employer_profiles ep ON ep.id = d.employer_id
           WHERE a.id = $1::uuid AND d.employer_id = $2::uuid
           LIMIT 1`,
          [applicationId, employerId],
        );
        metaResultRow = meta.rows[0];
        tenantId = metaResultRow?.tenant_id;
        studentProfileId = metaResultRow?.student_id;
        track = 'placement';
      } else {
        const meta = await query(
          `SELECT sp.tenant_id, sp.id AS student_id, jp.job_type, jp.id AS job_id, jp.title AS job_title, jp.employer_id, ep.company_name, u.first_name, COALESCE(u.communication_email, u.email) AS email, u.id AS student_user_id, jp.salary_max, jp.locations
           FROM program_applications pa
           INNER JOIN student_profiles sp ON sp.id = pa.student_id
           INNER JOIN users u ON u.id = sp.user_id
           INNER JOIN job_postings jp ON jp.id = pa.job_id
           INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
           WHERE pa.id = $1::uuid AND jp.employer_id = $2::uuid
           LIMIT 1`,
          [applicationId, employerId],
        );
        metaResultRow = meta.rows[0];
        tenantId = metaResultRow?.tenant_id;
        studentProfileId = metaResultRow?.student_id;
        const jt = String(metaResultRow?.job_type || '').toLowerCase();
        track = jt === 'internship' ? 'internship' : 'jobs';
      }

      if (tenantId && studentProfileId) {
        const fcfs = await assertEmployerMayConfirmStudent({
          tenantId,
          studentProfileId,
          track,
          employerId,
        });
        if (!fcfs.ok) {
          return NextResponse.json({ error: fcfs.error }, { status: 409 });
        }
      }
    }

    let updatedRes;
    if (sourceKind === 'drive') {
      updatedRes = await query(
        `UPDATE applications a
         SET status = $1, updated_at = NOW()
         FROM placement_drives d
         WHERE a.id = $2::uuid
           AND d.id = a.drive_id
           AND d.employer_id = $3::uuid
           ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}
         RETURNING a.id, a.status`,
        [nextStatus, applicationId, employerId],
      );
    } else {
      updatedRes = await query(
        `UPDATE program_applications pa
         SET status = $1, updated_at = NOW()
         FROM job_postings jp
         WHERE pa.id = $2::uuid
           AND jp.id = pa.job_id
           AND jp.employer_id = $3::uuid
           ${AND_PA_NOT_DELETED} ${AND_JP_NOT_DELETED}
         RETURNING pa.id, pa.status, pa.job_id`,
        [nextStatus, applicationId, employerId],
      );
    }

    if (!updatedRes.rows[0]) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updatedRow = updatedRes.rows[0];

    if (nextStatus === 'selected' && metaResultRow) {
      const studentUserId = metaResultRow.student_user_id;
      const email = metaResultRow.email;
      const firstName = metaResultRow.first_name;
      const companyName = metaResultRow.company_name;
      const roleTitle = sourceKind === 'drive' ? metaResultRow.drive_title : metaResultRow.job_title;

      // 1. Notify student of selection (email + in-app)
      const programType =
        sourceKind === 'drive'
          ? 'drives'
          : String(metaResultRow?.job_type || 'internship').toLowerCase() === 'internship'
            ? 'internships'
            : 'jobs';

      await notifyStudentSelection({
        studentUserId,
        email,
        firstName,
        companyName,
        roleTitle,
        sourceKind,
        programType,
      });
    }

    if (sourceKind === 'drive') {
      return NextResponse.json({ application: updatedRow });
    }
    return NextResponse.json({
      application: {
        ...updatedRow,
        status: normalizeEmployerApplicationStatus(updatedRow.status),
      },
    });
  } catch (e) {
    return respondPlatformError(e, {
      context: PLATFORM_ERROR_CONTEXT.EMPLOYER_APPLICATION_UPDATE,
      request,
      sessionUser: session?.user,
      employerId: employerId || null,
      requestBody: body,
      defaultMessage: 'Failed to update application status',
      logLabel: 'PATCH /api/employer/applications',
    });
  }
}


const __platformApiHandlers = withApiHandlers({
  GET: __platform_GET,
  PATCH: __platform_PATCH,
}, { context: 'api_employer_applications' });
export const GET = __platformApiHandlers.GET;
export const PATCH = __platformApiHandlers.PATCH;
