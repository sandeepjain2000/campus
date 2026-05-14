import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { isUuid } from '@/lib/tenantContext';
import { writeEmployerAssessmentAudit } from '@/lib/employerAssessmentAudit';

async function getEmployerProfileId(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const res = await query(`SELECT id FROM employer_profiles WHERE user_id = $1::uuid LIMIT 1`, [userId]);
  return res.rows[0]?.id || null;
}

async function assertOwnsUpload(employerId, uploadId) {
  const r = await query(
    `SELECT id, tenant_id, drive_id, job_id, original_file_name, total_rows, accepted_rows, rejected_rows, created_at
     FROM employer_assessment_uploads
     WHERE id = $1::uuid AND employer_id = $2::uuid
     LIMIT 1`,
    [uploadId, employerId],
  );
  return r.rows[0] || null;
}

/** GET — upload metadata, round labels, and accepted rows (for view/edit after CSV). */
export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { uploadId } = await params;
    if (!uploadId || !isUuid(uploadId)) {
      return NextResponse.json({ error: 'Invalid upload id' }, { status: 400 });
    }
    const employerId = await getEmployerProfileId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const upload = await assertOwnsUpload(employerId, uploadId);
    if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 });

    const rounds = await query(
      `SELECT round_no, round_label FROM employer_assessment_rounds WHERE upload_id = $1::uuid ORDER BY round_no ASC`,
      [uploadId],
    );
    const rowsRes = await query(
      `SELECT
         ear.id,
         ear.roll_number,
         ear.candidate_name,
         ear.round_1_result,
         ear.round_2_result,
         ear.round_3_result,
         ear.round_4_result,
         ear.round_5_result,
         ear.remarks,
         ear.is_unregistered_student,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS account_name
       FROM employer_assessment_rows ear
       JOIN student_profiles sp ON sp.id = ear.student_profile_id
       JOIN users u ON u.id = sp.user_id
       WHERE ear.upload_id = $1::uuid
       ORDER BY ear.roll_number ASC NULLS LAST, ear.created_at ASC`,
      [uploadId],
    );

    return NextResponse.json({
      upload,
      rounds: rounds.rows,
      rows: rowsRes.rows,
    });
  } catch (e) {
    console.error('GET /api/employer/assessments/[uploadId]', e);
    return NextResponse.json({ error: 'Failed to load assessment upload' }, { status: 500 });
  }
}

function trimText(v, maxLen) {
  const s = v == null ? '' : String(v);
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

/** PATCH — batch-update round cells / remarks / candidate_name for rows in this upload. */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { uploadId } = await params;
    if (!uploadId || !isUuid(uploadId)) {
      return NextResponse.json({ error: 'Invalid upload id' }, { status: 400 });
    }
    const employerId = await getEmployerProfileId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const upload = await assertOwnsUpload(employerId, uploadId);
    if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rowsIn = Array.isArray(body?.rows) ? body.rows : null;
    if (!rowsIn || rowsIn.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 });
    }
    if (rowsIn.length > 500) {
      return NextResponse.json({ error: 'At most 500 rows per save' }, { status: 400 });
    }

    const byRowId = new Map();
    for (const r of rowsIn) {
      const rowId = String(r?.id || '').trim();
      if (rowId && isUuid(rowId)) byRowId.set(rowId, r);
    }
    const rowIds = [...byRowId.keys()];
    if (rowIds.length === 0) {
      return NextResponse.json({ error: 'No valid row ids' }, { status: 400 });
    }

    const ROW_FIELDS = [
      'round_1_result',
      'round_2_result',
      'round_3_result',
      'round_4_result',
      'round_5_result',
      'remarks',
      'candidate_name',
    ];

    await transaction(async (client) => {
      const prevRes = await client.query(
        `SELECT id, roll_number, round_1_result, round_2_result, round_3_result, round_4_result, round_5_result, remarks, candidate_name
         FROM employer_assessment_rows
         WHERE upload_id = $1::uuid AND id = ANY($2::uuid[])`,
        [uploadId, rowIds],
      );
      const prevById = new Map(prevRes.rows.map((row) => [row.id, row]));

      const changes = [];
      for (const [rowId, r] of byRowId) {
        const old = prevById.get(rowId);
        if (!old) continue;

        const own = await client.query(
          `SELECT ear.id
           FROM employer_assessment_rows ear
           JOIN employer_assessment_uploads u ON u.id = ear.upload_id
           WHERE ear.id = $1::uuid AND ear.upload_id = $2::uuid AND u.employer_id = $3::uuid
           LIMIT 1`,
          [rowId, uploadId, employerId],
        );
        if (!own.rows.length) continue;

        const next = {
          round_1_result: trimText(r.round_1_result, 2000),
          round_2_result: trimText(r.round_2_result, 2000),
          round_3_result: trimText(r.round_3_result, 2000),
          round_4_result: trimText(r.round_4_result, 2000),
          round_5_result: trimText(r.round_5_result, 2000),
          remarks: trimText(r.remarks, 4000) || null,
          candidate_name: trimText(r.candidate_name, 255) || null,
        };

        const before = {};
        const after = {};
        let touched = false;
        for (const f of ROW_FIELDS) {
          const o = old[f] == null ? '' : String(old[f]);
          const n = next[f] == null ? '' : String(next[f]);
          if (o !== n) {
            touched = true;
            before[f] = old[f];
            after[f] = next[f];
          }
        }

        await client.query(
          `UPDATE employer_assessment_rows
           SET round_1_result = $1,
               round_2_result = $2,
               round_3_result = $3,
               round_4_result = $4,
               round_5_result = $5,
               remarks = $6,
               candidate_name = $7
           WHERE id = $8::uuid`,
          [
            next.round_1_result,
            next.round_2_result,
            next.round_3_result,
            next.round_4_result,
            next.round_5_result,
            next.remarks,
            next.candidate_name,
            rowId,
          ],
        );

        if (touched) {
          changes.push({ rowId, roll_number: old.roll_number, before, after });
        }
      }

      if (changes.length > 0) {
        const MAX_LOG = 80;
        const logged = changes.slice(0, MAX_LOG);
        await writeEmployerAssessmentAudit(client, {
          tenantId: upload.tenant_id,
          userId: session.user.id || null,
          uploadId,
          kind: 'rows_save',
          summary: `Saved edits to ${changes.length} assessment row(s)`,
          details: {
            changed_row_count: changes.length,
            changes: logged,
            changes_truncated: changes.length > MAX_LOG,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/employer/assessments/[uploadId]', e);
    return NextResponse.json({ error: 'Failed to save assessment rows' }, { status: 500 });
  }
}
