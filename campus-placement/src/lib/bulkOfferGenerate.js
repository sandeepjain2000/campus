import { query } from '@/lib/db';
import { buildRenderedOfferLetter } from '@/lib/offerTemplateRender';
import { refreshOfferLatestFlagsForStudent } from '@/lib/offersLatestFlag';
import { notifyStudentFormalOffer } from '@/lib/studentFormalOfferNotify';
import { AND_APP_NOT_DELETED, AND_DRIVE_NOT_DELETED, AND_OFFER_NOT_DELETED } from '@/lib/softDeleteSql';
import { SP_ACTIVE_CLAUSE } from '@/lib/studentProfileActive';
import { toDateOnlyString } from '@/lib/dateOnly';

const SELECTED_SQL = `LOWER(TRIM(a.status)) = 'selected'`;

/**
 * Selected drive applicants without an offer row for this employer+drive.
 */
export async function listSelectedWithoutOffer({ employerId, driveId }) {
  const res = await query(
    `SELECT
       a.id AS application_id,
       sp.id AS student_id,
       sp.tenant_id,
       TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS student_name,
       u.first_name,
       COALESCE(NULLIF(TRIM(u.communication_email), ''), u.email) AS email,
       u.id AS user_id,
       t.name AS college_name,
       d.title AS drive_title,
       ep.company_name
     FROM applications a
     INNER JOIN placement_drives d ON d.id = a.drive_id
     INNER JOIN employer_profiles ep ON ep.id = d.employer_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id AND ${SP_ACTIVE_CLAUSE}
     INNER JOIN users u ON u.id = sp.user_id
     LEFT JOIN tenants t ON t.id = sp.tenant_id
     WHERE d.id = $1::uuid
       AND d.employer_id = $2::uuid
       AND ${SELECTED_SQL}
       ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}
       AND NOT EXISTS (
         SELECT 1 FROM offers o
         WHERE o.student_id = sp.id
           AND o.drive_id = d.id
           AND o.employer_id = $2::uuid
           ${AND_OFFER_NOT_DELETED}
       )
     ORDER BY u.first_name ASC, u.last_name ASC`,
    [driveId, employerId],
  );
  return res.rows;
}

export async function countDriveSelectionOfferStats({ employerId, driveId }) {
  const withoutOffer = await listSelectedWithoutOffer({ employerId, driveId });

  const [selectedRes, offeredRes] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS n
       FROM applications a
       INNER JOIN placement_drives d ON d.id = a.drive_id
       WHERE d.id = $1::uuid AND d.employer_id = $2::uuid
         AND ${SELECTED_SQL} ${AND_APP_NOT_DELETED} ${AND_DRIVE_NOT_DELETED}`,
      [driveId, employerId],
    ),
    query(
      `SELECT COUNT(*)::int AS n
       FROM offers o
       WHERE o.drive_id = $1::uuid AND o.employer_id = $2::uuid ${AND_OFFER_NOT_DELETED}`,
      [driveId, employerId],
    ),
  ]);

  return {
    selectedCount: selectedRes.rows[0]?.n ?? 0,
    offersExistingCount: offeredRes.rows[0]?.n ?? 0,
    readyToGenerateCount: withoutOffer.length,
    withoutOffer,
  };
}

export async function loadEmployerOfferTemplate(templateId, employerId) {
  const res = await query(
    `SELECT id, employer_id, name, job_title, salary, location, joining_date, response_deadline, body_template, is_active
     FROM employer_offer_templates
     WHERE id = $1::uuid AND employer_id = $2::uuid AND is_active = true
     LIMIT 1`,
    [templateId, employerId],
  );
  return res.rows[0] || null;
}

export async function assertEmployerOwnsDrive(employerId, driveId) {
  const res = await query(
    `SELECT d.id, d.title, d.tenant_id, ep.company_name
     FROM placement_drives d
     INNER JOIN employer_profiles ep ON ep.id = d.employer_id
     WHERE d.id = $1::uuid AND d.employer_id = $2::uuid ${AND_DRIVE_NOT_DELETED}
     LIMIT 1`,
    [driveId, employerId],
  );
  return res.rows[0] || null;
}

/**
 * Create pending offers + emails for selected students missing offers. Safe to re-run.
 * @returns {Promise<{ created: number; emailed: number; skipped: number; offerIds: string[] }>}
 */
export async function generateOffersFromSelections({ employerId, driveId, templateId }) {
  const drive = await assertEmployerOwnsDrive(employerId, driveId);
  if (!drive) {
    const err = new Error('DRIVE_NOT_FOUND');
    throw err;
  }

  const template = await loadEmployerOfferTemplate(templateId, employerId);
  if (!template) {
    const err = new Error('TEMPLATE_NOT_FOUND');
    throw err;
  }

  const rows = await listSelectedWithoutOffer({ employerId, driveId });
  const offerIds = [];
  let emailed = 0;

  const deadlineIso = template.response_deadline
    ? new Date(`${toDateOnlyString(template.response_deadline)}T23:59:59`).toISOString()
    : null;
  const joiningDate = template.joining_date ? toDateOnlyString(template.joining_date) : null;

  for (const row of rows) {
    const renderedLetter = buildRenderedOfferLetter({
      template,
      studentName: row.student_name,
      companyName: row.company_name,
      collegeName: row.college_name,
    });

    let insertRes;
    try {
      insertRes = await query(
        `INSERT INTO offers (
           student_id, drive_id, employer_id, application_id, job_title, salary, location,
           status, joining_date, deadline, salary_currency, offer_template_id, rendered_letter_html
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, 'INR', $10, $11)
         RETURNING id`,
        [
          row.student_id,
          driveId,
          employerId,
          row.application_id,
          template.job_title,
          Number(template.salary) || 0,
          template.location || null,
          joiningDate,
          deadlineIso,
          template.id,
          renderedLetter,
        ],
      );
    } catch (e) {
      if (e?.code === '42703') {
        insertRes = await query(
          `INSERT INTO offers (
             student_id, drive_id, employer_id, application_id, job_title, salary, location,
             status, joining_date, deadline, salary_currency
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, 'INR')
           RETURNING id`,
          [
            row.student_id,
            driveId,
            employerId,
            row.application_id,
            template.job_title,
            Number(template.salary) || 0,
            template.location || null,
            joiningDate,
            deadlineIso,
          ],
        );
      } else {
        throw e;
      }
    }

    const offerId = String(insertRes.rows[0].id);
    offerIds.push(offerId);
    await refreshOfferLatestFlagsForStudent(row.student_id);

    try {
      await notifyStudentFormalOffer({
        studentUserId: String(row.user_id),
        email: String(row.email || ''),
        firstName: row.first_name,
        companyName: String(row.company_name || 'Company'),
        roleTitle: String(template.job_title || 'Role'),
        salary: Number(template.salary) || 0,
        deadline: deadlineIso,
        offerId,
        renderedLetterHtml: renderedLetter,
      });
      emailed += 1;
    } catch (mailErr) {
      console.error('Bulk offer email failed for', offerId, mailErr);
    }
  }

  return {
    created: offerIds.length,
    emailed,
    skipped: 0,
    offerIds,
    driveTitle: drive.title,
    templateName: template.name,
  };
}
