import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getEmployerProfileId } from '@/lib/employerApplicationAccess';
import { isAuthoritativeResumeUrl } from '@/lib/studentResumeUrl';

export const dynamic = 'force-dynamic';

/** @param {import('pg').QueryResultRow} row */
function mapRow(row) {
  const first = row.first_name || '';
  const last = row.last_name || '';
  const hasResume = Boolean(row.resume_document_id || isAuthoritativeResumeUrl(row.resume_url));
  return {
    id: row.id,
    sourceKind: row.source_kind,
    status: row.status,
    appliedAt: row.applied_at,
    currentRound: row.current_round,
    studentProfileId: row.student_id,
    studentName: `${first} ${last}`.trim() || row.email || 'Student',
    email: row.email,
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
  };
}

/**
 * GET ?tab=jobs|internships|projects
 * Jobs = drive applications (applications table). Internships / projects = program_applications.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    const employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const tabParam = (searchParams.get('tab') || 'jobs').toLowerCase();
    const tab = tabParam === 'internships' || tabParam === 'projects' ? tabParam : 'jobs';
    const driveIdFilter = String(searchParams.get('driveId') || '').trim();

    const countsSql = `
      SELECT
        (SELECT COUNT(*)::int FROM applications a
         INNER JOIN placement_drives d ON d.id = a.drive_id
         WHERE d.employer_id = $1::uuid) AS jobs,
        (SELECT COUNT(*)::int FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         WHERE jp.employer_id = $1::uuid AND jp.job_type = 'internship') AS internships,
        (SELECT COUNT(*)::int FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
         WHERE jp.employer_id = $1::uuid AND jp.job_type IN ('short_project', 'hackathon')) AS projects
    `;
    const countsRes = await query(countsSql, [employerId]);
    const counts = countsRes.rows[0] || { jobs: 0, internships: 0, projects: 0 };

    let itemsRes;
    if (tab === 'jobs') {
      itemsRes = await query(
        `SELECT
           a.id,
           'drive' AS source_kind,
           a.status,
           a.applied_at,
           a.current_round,
           sp.id AS student_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
           sp.branch,
           sp.department,
           sp.cgpa,
           sp.resume_url,
           resume_doc.id AS resume_document_id,
           resume_doc.document_name AS resume_document_name,
           resume_doc.file_url AS resume_document_url,
           (SELECT COUNT(*)::int FROM student_documents sd_all WHERE sd_all.student_id = sp.id) AS document_count,
           COALESCE(jp.title, d.title) AS opening_title,
           COALESCE(jp.job_type::text, 'placement_drive') AS job_type,
           d.id AS drive_id,
           NULL::text AS notes
         FROM applications a
         INNER JOIN placement_drives d ON d.id = a.drive_id
         INNER JOIN employer_profiles ep ON ep.id = d.employer_id
         INNER JOIN student_profiles sp ON sp.id = a.student_id
         INNER JOIN users u ON u.id = sp.user_id
         LEFT JOIN tenants t ON t.id = sp.tenant_id
         LEFT JOIN job_postings jp ON jp.id = COALESCE(a.job_id, d.job_id)
         LEFT JOIN LATERAL (
           SELECT sd.id, sd.document_name, sd.file_url
           FROM student_documents sd
           WHERE sd.student_id = sp.id
             AND sd.document_type = 'resume'
           ORDER BY sd.uploaded_at DESC
           LIMIT 1
         ) resume_doc ON TRUE
         WHERE ep.id = $1::uuid
           AND sp.archived_at IS NULL
           ${driveIdFilter ? 'AND d.id = $2::uuid' : ''}
         ORDER BY a.applied_at DESC`,
        driveIdFilter ? [employerId, driveIdFilter] : [employerId],
      );
    } else if (tab === 'internships') {
      itemsRes = await query(
        `SELECT
           pa.id,
           'program' AS source_kind,
           pa.status,
           pa.applied_at,
           NULL::int AS current_round,
           sp.id AS student_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
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
           pa.notes
         FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
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
         WHERE ep.id = $1::uuid AND jp.job_type = 'internship' AND sp.archived_at IS NULL
         ORDER BY pa.applied_at DESC`,
        [employerId],
      );
    } else {
      itemsRes = await query(
        `SELECT
           pa.id,
           'program' AS source_kind,
           pa.status,
           pa.applied_at,
           NULL::int AS current_round,
           sp.id AS student_id,
           u.first_name,
           u.last_name,
           u.email,
           t.name AS college_name,
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
           pa.notes
         FROM program_applications pa
         INNER JOIN job_postings jp ON jp.id = pa.job_id
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
         WHERE ep.id = $1::uuid AND jp.job_type IN ('short_project', 'hackathon') AND sp.archived_at IS NULL
         ORDER BY pa.applied_at DESC`,
        [employerId],
      );
    }

    return NextResponse.json({
      tab,
      counts: {
        jobs: Number(counts.jobs) || 0,
        internships: Number(counts.internships) || 0,
        projects: Number(counts.projects) || 0,
      },
      items: itemsRes.rows.map(mapRow),
    });
  } catch (e) {
    console.error('GET /api/employer/applications', e);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    const employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || '').trim();
    const sourceKind = String(body?.sourceKind || '').trim().toLowerCase();
    const nextStatus = String(body?.status || '').trim().toLowerCase();
    const allowed = new Set(['applied', 'shortlisted', 'in_progress', 'selected', 'rejected', 'on_hold']);
    if (!applicationId || !['drive', 'program'].includes(sourceKind) || !allowed.has(nextStatus)) {
      return NextResponse.json({ error: 'applicationId, sourceKind and valid status are required' }, { status: 400 });
    }

    if (sourceKind === 'drive') {
      const updated = await query(
        `UPDATE applications a
         SET status = $1, updated_at = NOW()
         FROM placement_drives d
         WHERE a.id = $2::uuid
           AND d.id = a.drive_id
           AND d.employer_id = $3::uuid
         RETURNING a.id, a.status`,
        [nextStatus, applicationId, employerId],
      );
      if (!updated.rows[0]) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      return NextResponse.json({ application: updated.rows[0] });
    }

    const updated = await query(
      `UPDATE program_applications pa
       SET status = $1, updated_at = NOW()
       FROM job_postings jp
       WHERE pa.id = $2::uuid
         AND jp.id = pa.job_id
         AND jp.employer_id = $3::uuid
       RETURNING pa.id, pa.status`,
      [nextStatus, applicationId, employerId],
    );
    if (!updated.rows[0]) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application: updated.rows[0] });
  } catch (e) {
    console.error('PATCH /api/employer/applications', e);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
