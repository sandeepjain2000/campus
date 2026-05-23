import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { transaction, query } from '@/lib/db';
import { hash } from 'bcryptjs';
import { parseCsvLine } from '@/lib/csvParse';
import { validateStudentCsvHeaders } from '@/lib/collegeStudentsCsv';
import { sendMail, STUDENT_WELCOME_SUBJECT, studentWelcomeEmailBody } from '@/lib/mailer';
import {
  assertEmailAvailable,
  formatEmailDifferentTenantMessage,
  formatEmailInUseMessage,
} from '@/lib/userEmail';
import {
  validateStudentCgpa,
  parseStudentFullName,
  resolveStudentRollNumber,
  validateStudentBranchField,
} from '@/lib/validators';
import { reconcileBatchFields } from '@/lib/studentBatch';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId || session.user.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    const allLines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (allLines.length < 2) return NextResponse.json({ error: 'File is empty' }, { status: 400 });

    const headerRow = parseCsvLine(allLines[0]);
    const headerCheck = validateStudentCsvHeaders(headerRow);
    if (!headerCheck.ok) {
      return NextResponse.json(
        {
          error: headerCheck.error,
          hint: 'Download the import template from Students and match its column headers exactly.',
        },
        { status: 400 },
      );
    }
    const idx = headerCheck.idx;
    const expectedColCount = headerRow.length;
    const getIdx = (name) => idx[String(name).trim().toLowerCase()];

    const nameIdx = getIdx('name');
    const emailIdx = getIdx('email');
    const rollIdx = getIdx('roll');
    const deptIdx = getIdx('department');
    const specIdx = getIdx('specialization');
    const cgpaIdx = getIdx('cgpa');
    const verifiedIdx = getIdx('verified');
    const genderIdx = getIdx('gender');
    const jobIdx = getIdx('job status');
    const catIdx = getIdx('diversity category');
    const batchIdx = getIdx('batch');
    const admissionIdx = getIdx('admission year');
    const gradIdx = getIdx('graduation year');
    const legacyBatchYearIdx = getIdx('batch year');

    const results = await transaction(async (client) => {
      let processed = 0;
      const errors = [];
      const credentials = [];

      const shortRes = await client.query('SELECT short_code FROM tenants WHERE id = $1', [tenantId]);
      const shortCode = shortRes.rows[0]?.short_code || '';

      for (let i = 1; i < allLines.length; i++) {
        const cells = parseCsvLine(allLines[i]);
        if (cells.every((c) => !String(c || '').trim())) continue;
        if (cells.length < 3 || cells.length < Math.min(expectedColCount, 8)) {
          errors.push(`Row ${i + 1}: Too few columns — use the official import template.`);
          continue;
        }

        const email = cells[emailIdx]?.toLowerCase();
        const name = cells[nameIdx];
        const rollRaw = cells[rollIdx];

        if (!email || !name || !rollRaw) {
          const msg = `Row ${i + 1}: Missing name/email/roll (name='${name}', email='${email}', roll='${rollRaw}')`;
          console.warn('[BulkUpload]', msg);
          errors.push(msg);
          continue;
        }

        const nameParsed = parseStudentFullName(name);
        if (nameParsed.error) {
          errors.push(`Row ${i + 1}: ${nameParsed.error}`);
          continue;
        }

        const rollResolved = resolveStudentRollNumber(rollRaw, shortCode);
        if (rollResolved.error) {
          errors.push(`Row ${i + 1}: ${rollResolved.error}`);
          continue;
        }
        const roll = rollResolved.rollNumber;
        const rowSystemId = rollResolved.systemId;

        try {
          const { firstName, lastName, fullName } = nameParsed;

          // 1. Roll No is the visible system primary key within a tenant.
          //    Look up by (tenant_id + roll_number) first — then validate Name & Email match.
          const existingByRoll = await client.query(
            `SELECT u.id, u.tenant_id, u.email, u.first_name, u.last_name, sp.roll_number
             FROM student_profiles sp
             JOIN users u ON u.id = sp.user_id
             WHERE sp.tenant_id = $1 AND LOWER(sp.roll_number) = LOWER($2)
             LIMIT 1`,
            [tenantId, roll]
          );

          let userId;

          if (existingByRoll.rows.length) {
            const ex = existingByRoll.rows[0];

            // Primary field: Name must match (case-insensitive)
            const existingName = [ex.first_name, ex.last_name].filter(Boolean).join(' ');
            if (existingName.toLowerCase() !== fullName.toLowerCase()) {
              throw new Error(
                `Roll No "${roll}" already belongs to "${existingName}" — Name cannot be changed via import. ` +
                `To update placement results, keep Name and Email unchanged.`
              );
            }

            // Primary field: Email must match
            if (ex.email.toLowerCase() !== email.toLowerCase()) {
              throw new Error(
                `Roll No "${roll}" is linked to email "${ex.email}" — Email cannot be changed via import. ` +
                `Use the correct email for this student.`
              );
            }

            userId = ex.id;
            // Name, email, roll are all confirmed matching — safe to update non-primary fields
            await client.query(
              'UPDATE users SET role = $1, is_active = true, updated_at = NOW() WHERE id = $2',
              ['student', userId]
            );
            console.log(`[BulkUpload] Row ${i+1}: Roll No "${roll}" matched — updating non-primary fields for ${email}`);
          } else {
            try {
              await assertEmailAvailable(client, email, { tenantId });
            } catch (e) {
              if (e.message === 'EMAIL_DIFFERENT_TENANT') {
                throw new Error(formatEmailDifferentTenantMessage(email));
              }
              if (e.message === 'EMAIL_EXISTS') {
                throw new Error(formatEmailInUseMessage(e.existing, { email }));
              }
              throw e;
            }

            // Genuinely new student — create account
            const tempPass = randomBytes(10).toString('hex');
            const passHash = await hash(tempPass, 10);
            const newUser = await client.query(
              `INSERT INTO users (tenant_id, email, communication_email, password_hash, role, first_name, last_name, is_verified, is_active, email_verified_at)
               VALUES ($1, $2, $2, $3, 'student', $4, $5, true, true, NOW()) RETURNING id`,
              [tenantId, email, passHash, firstName || 'Student', lastName]
            );
            userId = newUser.rows[0].id;
            credentials.push({
              email,
              tempPass,
              firstName: firstName || 'Student',
              systemId: rowSystemId,
            });
            console.log(`[BulkUpload] Row ${i+1}: New student created — Roll No "${roll}", email "${email}" (id=${userId})`);
          }

          // 2. Student Profile — only non-primary fields updated on conflict
          const cgpaRaw = cgpaIdx >= 0 ? String(cells[cgpaIdx] ?? '').trim() : '';
          const cgpaErr = validateStudentCgpa(cgpaRaw, { required: cgpaIdx >= 0 });
          if (cgpaErr) {
            throw new Error(`Row ${i + 1}: ${cgpaErr}`);
          }
          const cgpa = cgpaRaw ? parseFloat(cgpaRaw) : 8;
          const isVerified = ['yes', 'y', 'true', '1'].includes(cells[verifiedIdx]?.toLowerCase());
          const dept = cells[deptIdx] || '';
          const branch = cells[specIdx] || '';
          const branchErr = validateStudentBranchField(branch) || validateStudentBranchField(dept, { label: 'Department' });
          if (branchErr) {
            throw new Error(`Row ${i + 1}: ${branchErr}`);
          }
          const gender = cells[genderIdx] || '';
          const jobStatus = cells[jobIdx]?.toLowerCase().replace(/\s+/g, '_') || 'unplaced';
          const category = cells[catIdx] || 'General';

          const batchReconciled = reconcileBatchFields({
            batch: batchIdx >= 0 ? cells[batchIdx] : '',
            batch_year:
              admissionIdx >= 0
                ? cells[admissionIdx]
                : legacyBatchYearIdx >= 0
                  ? cells[legacyBatchYearIdx]
                  : '',
            graduation_year: gradIdx >= 0 ? cells[gradIdx] : '',
          });

          const validStatuses = ['unplaced', 'placed', 'opted_out', 'higher_studies'];
          const finalStatus = validStatuses.includes(jobStatus) ? jobStatus : 'unplaced';
          if (!validStatuses.includes(jobStatus)) {
            console.warn(`[BulkUpload] Row ${i+1}: Invalid job status '${jobStatus}', defaulting to 'unplaced'`);
          }

          const auxProfile = JSON.stringify({
            batchLabel: batchReconciled.joiningAcademicYear || batchReconciled.batchLabel || '',
            joiningAcademicYear: batchReconciled.joiningAcademicYear || batchReconciled.batchLabel || '',
          });

          await client.query(
            `INSERT INTO student_profiles (
              user_id, tenant_id, roll_number, department, branch, cgpa, gender, category,
              placement_status, is_verified, batch_year, graduation_year, joining_academic_year, aux_profile
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
            ON CONFLICT (user_id) DO UPDATE SET
              -- roll_number is a primary field: NOT updated on conflict
              department = EXCLUDED.department,
              branch = EXCLUDED.branch,
              cgpa = EXCLUDED.cgpa,
              gender = EXCLUDED.gender,
              category = EXCLUDED.category,
              placement_status = EXCLUDED.placement_status,
              is_verified = EXCLUDED.is_verified,
              batch_year = COALESCE(EXCLUDED.batch_year, student_profiles.batch_year),
              graduation_year = COALESCE(EXCLUDED.graduation_year, student_profiles.graduation_year),
              joining_academic_year = COALESCE(EXCLUDED.joining_academic_year, student_profiles.joining_academic_year),
              aux_profile = COALESCE(student_profiles.aux_profile, '{}'::jsonb) || EXCLUDED.aux_profile,
              archived_at = NULL,
              archived_by = NULL,
              updated_at = NOW()`,
            [
              userId,
              tenantId,
              roll,
              dept,
              branch,
              cgpa,
              gender,
              category,
              finalStatus,
              isVerified,
              batchReconciled.batchYear,
              batchReconciled.graduationYear,
              batchReconciled.joiningAcademicYear || batchReconciled.batchLabel || null,
              auxProfile,
            ],
          );

          console.log(`[BulkUpload] Row ${i+1}: ✅ Student profile saved for ${email} (roll=${roll}, dept=${dept})`);
          processed++;
        } catch (e) {
          const msg = `Row ${i + 1} (${email}): ${e.message}`;
          console.error('[BulkUpload] Row error:', msg);
          errors.push(msg);
        }
      }
      console.log(`[BulkUpload] Transaction complete: ${processed} processed, ${errors.length} errors`);
      return { processed, errors, credentials };
    });

    for (const c of results.credentials) {
      try {
        await sendMail({
          to: c.email,
          subject: STUDENT_WELCOME_SUBJECT,
          text: studentWelcomeEmailBody({
            firstName: c.firstName,
            email: c.email,
            tempPass: c.tempPass,
            systemId: c.systemId,
          }),
        });
      } catch (mailErr) {
        console.error('[BulkUpload] Welcome email failed:', c.email, mailErr.message);
      }
    }

    // Trigger Notifications (wrapped in try-catch to prevent 500 on failure)
    try {
      const adminEmail = session.user.communication_email || session.user.email;
      const emailSubject = `Student Import Complete — ${results.processed} success`;
      const emailText = `Hello,\n\nYour student import for ${results.processed} students has been processed.\n` +
              (results.errors.length ? `\nErrors found:\n${results.errors.join('\n')}` : '\nNo errors encountered.') +
              ` \n\nThank you,\nPlacementHub Team`;

      // 1. Record in Notifications Table FIRST
      await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, 'info', false, NOW())`,
        [session.user.id, emailSubject, emailText]
      );

      // 2. Record in Audit Logs for permanent history
      await query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          session.user.id, 
          tenantId, 
          'student_bulk_import', 
          'student_profile', 
          JSON.stringify({ 
            count: results.processed, 
            errorCount: results.errors.length,
            summary: emailSubject 
          })
        ]
      );

      // 3. Finally, try to send the email
      await sendMail({
        to: adminEmail,
        subject: emailSubject,
        text: emailText
      });
    } catch (notifyError) {
      console.error('Notification/Audit error after bulk upload:', notifyError);
    }

    const response = {
      success: true,
      message: `Successfully processed ${results.processed} student(s)${
        results.errors.length ? ` with ${results.errors.length} error(s)` : ''
      }`,
      processed: results.processed,
      errors: results.errors.length ? results.errors : undefined,
      newUserCredentials: results.credentials.length ? results.credentials : undefined,
    };
    console.log('[BulkUpload] Response:', { processed: results.processed, errors: results.errors });
    return NextResponse.json(response);

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
