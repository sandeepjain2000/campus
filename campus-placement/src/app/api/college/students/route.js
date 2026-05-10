import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { sendMail, STUDENT_WELCOME_SUBJECT, studentWelcomeEmailBody } from '@/lib/mailer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenant_id ?? session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const students = await query(
      `SELECT
        sp.id,
        sp.roll_number,
        sp.department,
        sp.branch,
        sp.cgpa,
        sp.placement_status,
        sp.is_verified,
        sp.gender,
        sp.category,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        t.short_code,
        COALESCE(
          ARRAY_AGG(DISTINCT ss.skill_name) FILTER (WHERE ss.skill_name IS NOT NULL),
          ARRAY[]::text[]
        ) AS skills
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      JOIN tenants t ON t.id = sp.tenant_id
      LEFT JOIN student_skills ss ON ss.student_id = sp.id
      WHERE sp.tenant_id = $1
      GROUP BY
        sp.id, sp.roll_number, sp.department, sp.branch, sp.cgpa, sp.placement_status,
        sp.is_verified, sp.gender, sp.category, u.first_name, u.last_name, u.email, u.avatar_url, t.short_code
      ORDER BY u.first_name ASC, u.last_name ASC`,
      [tenantId]
    );

    const rows = students.rows.map((row) => {
      const shortCode = row.short_code || '';
      const rollNo = row.roll_number || '';
      const systemId = shortCode && rollNo ? `${shortCode}-${rollNo}` : rollNo;
      return {
        id: row.id,
        systemId,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        email: row.email || '',
        photo: row.avatar_url || null,
        roll: rollNo,
        dept: row.department || '',
        specialization: row.branch || '',
        semester: '',
        cgpa: row.cgpa !== null ? Number(row.cgpa) : null,
        jobStatus: row.placement_status || 'unplaced',
        internshipStatus: 'none',
        verified: Boolean(row.is_verified),
        skills: Array.isArray(row.skills) ? row.skills : [],
        gender: row.gender || '—',
        disabilityStatus: '—',
        diversityCategory: row.category || '—',
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to load college students:', error);
    return NextResponse.json(
      { error: 'Failed to load college students' },
      { status: 500 }
    );
  }
}

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

    const body = await req.json();
    const { name, email, roll_number, department, branch, gender, category, cgpa, placement_status, skills } = body;

    // Required field validation
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    if (!roll_number?.trim()) return NextResponse.json({ error: 'Roll No is required.' }, { status: 400 });
    if (!department?.trim()) return NextResponse.json({ error: 'Department is required.' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRoll = roll_number.trim();
    const [firstName, ...lastParts] = name.trim().split(/\s+/);
    const lastName = lastParts.join(' ') || null;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const validStatuses = ['unplaced', 'placed', 'opted_out', 'higher_studies'];
    const finalStatus = validStatuses.includes(placement_status) ? placement_status : 'unplaced';
    const cgpaNum = cgpa ? parseFloat(cgpa) : null;
    const skillsArr = Array.isArray(skills) ? skills.filter(Boolean) : [];

    const { studentId, systemId, tempPass, isNew } = await transaction(async (client) => {
      // 1. Check by Roll No within tenant
      const byRoll = await client.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, sp.id as profile_id
         FROM student_profiles sp
         JOIN users u ON u.id = sp.user_id
         WHERE sp.tenant_id = $1 AND LOWER(sp.roll_number) = LOWER($2)
         LIMIT 1`,
        [tenantId, normalizedRoll]
      );

      let userId, profileId;
      let generatedPass = null;
      let isNewStudent = false;

      if (byRoll.rows.length) {
        const ex = byRoll.rows[0];
        const existingName = [ex.first_name, ex.last_name].filter(Boolean).join(' ');

        // Primary field check: Name
        if (existingName.toLowerCase() !== fullName.toLowerCase()) {
          throw new Error(
            `Roll No "${normalizedRoll}" already belongs to "${existingName}". Name cannot be changed.`
          );
        }
        // Primary field check: Email
        if (ex.email.toLowerCase() !== normalizedEmail) {
          throw new Error(
            `Roll No "${normalizedRoll}" is linked to email "${ex.email}". Email cannot be changed.`
          );
        }
        userId = ex.id;
        profileId = ex.profile_id;
      } else {
        // Check email cross-roll conflict
        const byEmail = await client.query(
          `SELECT u.id, u.tenant_id, sp.roll_number
           FROM users u
           LEFT JOIN student_profiles sp ON sp.user_id = u.id
           WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
          [normalizedEmail]
        );

        if (byEmail.rows.length) {
          const ex = byEmail.rows[0];
          if (String(ex.tenant_id) !== String(tenantId)) {
            throw new Error(`Email "${normalizedEmail}" is already registered at a different institution.`);
          }
          throw new Error(
            `Email "${normalizedEmail}" already exists with Roll No "${ex.roll_number}". Use a different email.`
          );
        }

        // New student — create user
        generatedPass = randomBytes(10).toString('hex');
        const passHash = await hash(generatedPass, 10);
        const newUser = await client.query(
          `INSERT INTO users (tenant_id, email, communication_email, password_hash, role, first_name, last_name, is_verified, is_active)
           VALUES ($1, $2, $2, $3, 'student', $4, $5, true, true) RETURNING id`,
          [tenantId, normalizedEmail, passHash, firstName, lastName]
        );
        userId = newUser.rows[0].id;
        isNewStudent = true;
      }

      // 2. Upsert student_profile
      const upsert = await client.query(
        `INSERT INTO student_profiles (user_id, tenant_id, roll_number, department, branch, cgpa, gender, category, placement_status, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (user_id) DO UPDATE SET
           department = EXCLUDED.department,
           branch = EXCLUDED.branch,
           cgpa = EXCLUDED.cgpa,
           gender = EXCLUDED.gender,
           category = EXCLUDED.category,
           placement_status = EXCLUDED.placement_status,
           updated_at = NOW()
         RETURNING id`,
        [userId, tenantId, normalizedRoll, department.trim(), branch?.trim() || null, cgpaNum, gender?.trim() || null, category?.trim() || 'General', finalStatus]
      );
      profileId = upsert.rows[0].id;

      // 3. Replace skills
      await client.query('DELETE FROM student_skills WHERE student_id = $1', [profileId]);
      for (const skill of skillsArr) {
        await client.query(
          'INSERT INTO student_skills (student_id, skill_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profileId, skill.trim()]
        );
      }

      // 4. Get short_code for systemId
      const tenantRes = await client.query('SELECT short_code FROM tenants WHERE id = $1', [tenantId]);
      const shortCode = tenantRes.rows[0]?.short_code || '';
      const sysId = shortCode ? `${shortCode}-${normalizedRoll}` : normalizedRoll;

      return { studentId: profileId, systemId: sysId, tempPass: generatedPass, isNew: isNewStudent };
    });

    // Send welcome email to student if new (same template as CSV bulk import)
    if (isNew && tempPass) {
      try {
        await sendMail({
          to: normalizedEmail,
          subject: STUDENT_WELCOME_SUBJECT,
          text: studentWelcomeEmailBody({
            firstName,
            email: normalizedEmail,
            tempPass,
            systemId,
          }),
        });
      } catch (mailErr) {
        console.error('[AddStudent] Welcome email failed:', mailErr.message);
      }
    }

    // Audit log
    try {
      await query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, new_values, created_at)
         VALUES ($1, $2, $3, 'student_profile', $4, NOW())`,
        [
          session.user.id,
          tenantId,
          isNew ? 'student_add_form' : 'student_update_form',
          JSON.stringify({ roll_number: normalizedRoll, email: normalizedEmail, systemId }),
        ]
      );
    } catch (auditErr) {
      console.error('[AddStudent] Audit log failed:', auditErr.message);
    }

    return NextResponse.json({
      success: true,
      message: isNew
        ? `Student added. Welcome email sent to ${normalizedEmail}.`
        : `Student profile updated for Roll No "${normalizedRoll}".`,
      studentId,
      systemId,
      isNew,
    });
  } catch (error) {
    console.error('[AddStudent] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
