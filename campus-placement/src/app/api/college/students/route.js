import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { sendMail, STUDENT_WELCOME_SUBJECT, studentWelcomeEmailBody } from '@/lib/mailer';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

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
        sp.user_id,
        sp.roll_number,
        sp.enrollment_number,
        sp.department,
        sp.branch,
        sp.batch_year,
        sp.graduation_year,
        sp.cgpa,
        sp.tenth_percentage,
        sp.twelfth_percentage,
        sp.diploma_percentage,
        sp.backlogs_active,
        sp.backlogs_history,
        sp.placement_status,
        sp.is_verified,
        sp.verified_at,
        sp.gender,
        sp.date_of_birth,
        sp.category,
        sp.linkedin_url,
        sp.github_url,
        sp.portfolio_url,
        sp.expected_salary_min,
        sp.expected_salary_max,
        sp.preferred_locations,
        sp.willing_to_relocate,
        sp.resume_url,
        sp.bio,
        sp.aux_profile,
        u.first_name,
        u.last_name,
        u.email,
        u.communication_email,
        u.phone,
        u.avatar_url,
        t.short_code,
        t.name AS institution_name,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'name', ss.skill_name,
              'proficiency', ss.proficiency
            )
            ORDER BY ss.created_at ASC
          )
          FROM student_skills ss
          WHERE ss.student_id = sp.id
        ), '[]'::json) AS skills_detail,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'institution', se.institution,
              'degree', se.degree,
              'fieldOfStudy', se.field_of_study,
              'startYear', se.start_year,
              'endYear', se.end_year,
              'grade', se.grade,
              'description', se.description
            )
            ORDER BY se.start_year DESC NULLS LAST, se.created_at DESC
          )
          FROM student_education se
          WHERE se.student_id = sp.id
        ), '[]'::json) AS education_records,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'title', pr.title,
              'description', pr.description,
              'techStack', pr.tech_stack,
              'projectUrl', pr.project_url,
              'githubUrl', pr.github_url,
              'startDate', pr.start_date,
              'endDate', pr.end_date
            )
            ORDER BY COALESCE(pr.end_date, pr.start_date) DESC NULLS LAST, pr.created_at DESC
          )
          FROM student_projects pr
          WHERE pr.student_id = sp.id
        ), '[]'::json) AS projects,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'type', sd.document_type,
              'name', sd.document_name,
              'url', sd.file_url,
              'fileSize', sd.file_size,
              'verified', sd.is_verified,
              'uploadedAt', sd.uploaded_at
            )
            ORDER BY sd.uploaded_at DESC
          )
          FROM student_documents sd
          WHERE sd.student_id = sp.id
        ), '[]'::json) AS documents
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      JOIN tenants t ON t.id = sp.tenant_id
      WHERE sp.tenant_id = $1
      ORDER BY u.first_name ASC, u.last_name ASC`,
      [tenantId]
    );

    const rows = students.rows.map((row) => {
      const shortCode = row.short_code || '';
      const rollNo = row.roll_number || '';
      const systemId = shortCode && rollNo ? `${shortCode}-${rollNo}` : rollNo;
      const aux = asObject(row.aux_profile);
      const skillsDetail = asArray(row.skills_detail);
      const educationRecords = asArray(row.education_records);
      const projects = asArray(row.projects);
      const documents = asArray(row.documents);
      const languages = asArray(aux.languages);
      const subjects = asArray(aux.subjects);
      const workExperience = asArray(aux.workExperience);
      const responsibilities = asArray(aux.responsibilities);
      const accomplishments = asArray(aux.accomplishments);
      const volunteering = asArray(aux.volunteering);
      const extracurriculars = asArray(aux.extracurriculars);
      const profileLinks = asArray(aux.profileLinks);
      const preferredLocations = asArray(row.preferred_locations);
      const completedSections = [
        row.email || row.phone || row.bio,
        educationRecords.length || row.cgpa || row.tenth_percentage || row.twelfth_percentage,
        skillsDetail.length || languages.length || subjects.length,
        projects.length,
        documents.length || row.resume_url,
        workExperience.length || responsibilities.length || accomplishments.length || volunteering.length || extracurriculars.length,
      ].filter(Boolean).length;

      return {
        id: row.id,
        userId: row.user_id,
        systemId,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        email: row.email || '',
        communicationEmail: row.communication_email || '',
        phone: row.phone || '',
        photo: row.avatar_url || null,
        roll: rollNo,
        enrollmentNumber: row.enrollment_number || '',
        dept: row.department || '',
        specialization: row.branch || '',
        semester: '',
        batchYear: row.batch_year,
        graduationYear: row.graduation_year,
        academicYear: row.batch_year && row.graduation_year ? `${row.batch_year}-${row.graduation_year}` : '',
        cgpa: row.cgpa !== null ? Number(row.cgpa) : null,
        tenthPercentage: row.tenth_percentage !== null ? Number(row.tenth_percentage) : null,
        twelfthPercentage: row.twelfth_percentage !== null ? Number(row.twelfth_percentage) : null,
        diplomaPercentage: row.diploma_percentage !== null ? Number(row.diploma_percentage) : null,
        backlogsActive: row.backlogs_active ?? 0,
        backlogsHistory: row.backlogs_history ?? 0,
        jobStatus: row.placement_status || 'unplaced',
        internshipStatus: 'none',
        verified: Boolean(row.is_verified),
        verifiedAt: row.verified_at,
        skills: skillsDetail.map((skill) => skill.name).filter(Boolean),
        skillsDetail,
        gender: row.gender || '—',
        dateOfBirth: row.date_of_birth,
        disabilityStatus: '—',
        diversityCategory: row.category || '—',
        bio: row.bio || '',
        linkedinUrl: row.linkedin_url || '',
        githubUrl: row.github_url || '',
        portfolioUrl: row.portfolio_url || '',
        expectedSalaryMin: row.expected_salary_min !== null ? Number(row.expected_salary_min) : null,
        expectedSalaryMax: row.expected_salary_max !== null ? Number(row.expected_salary_max) : null,
        preferredLocations,
        willingToRelocate: row.willing_to_relocate !== false,
        resumeUrl: row.resume_url || '',
        sectionCompletion: {
          completed: completedSections,
          total: 6,
        },
        sections: {
          basic: {
            institutionName: row.institution_name || '',
            email: row.email || '',
            communicationEmail: row.communication_email || '',
            phone: row.phone || '',
            profileLinks,
          },
          education: {
            records: educationRecords,
            scores: [
              { label: 'CGPA', value: row.cgpa !== null ? Number(row.cgpa) : null },
              { label: 'Class X', value: row.tenth_percentage !== null ? Number(row.tenth_percentage) : null },
              { label: 'Class XII', value: row.twelfth_percentage !== null ? Number(row.twelfth_percentage) : null },
              { label: 'Diploma', value: row.diploma_percentage !== null ? Number(row.diploma_percentage) : null },
            ],
            backlogs: {
              active: row.backlogs_active ?? 0,
              total: row.backlogs_history ?? 0,
            },
          },
          skills: {
            skills: skillsDetail,
            languages,
            subjects,
          },
          projects,
          documents: {
            resumeUrl: row.resume_url || '',
            documents,
          },
          activities: {
            workExperience,
            responsibilities,
            accomplishments,
            volunteering,
            extracurriculars,
          },
        },
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
          `INSERT INTO users (tenant_id, email, communication_email, password_hash, role, first_name, last_name, is_verified, is_active, email_verified_at)
           VALUES ($1, $2, $2, $3, 'student', $4, $5, true, true, NOW()) RETURNING id`,
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
