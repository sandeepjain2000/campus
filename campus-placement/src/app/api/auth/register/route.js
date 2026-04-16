import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, transaction } from '@/lib/db';
import { validateRegistration } from '@/lib/validators';
import { slugify } from '@/lib/utils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { role, firstName, lastName, email, password, phone } = body;

    // Validate
    const validation = validateRegistration({ email, password, firstName, role });
    if (!validation.isValid) {
      return NextResponse.json({ error: Object.values(validation.errors)[0] }, { status: 400 });
    }

    // Check if email exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await transaction(async (client) => {
      let tenantId = null;

      // For college admin, create a new tenant
      if (role === 'college_admin') {
        const collegeName = body.collegeFullName || `${firstName}'s College`;
        const slug = slugify(collegeName) + '-' + Date.now().toString(36);
        const tenantResult = await client.query(
          `INSERT INTO tenants (name, slug, city, state, email) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [collegeName, slug, body.city || '', body.state || '', email]
        );
        tenantId = tenantResult.rows[0].id;

        // Create default college settings
        await client.query(
          `INSERT INTO college_settings (tenant_id) VALUES ($1)`,
          [tenantId]
        );
      }

      // For students, they need a tenant_id (college). For now, assign to first college or null
      if (role === 'student') {
        const college = await client.query('SELECT id FROM tenants WHERE type = $1 LIMIT 1', ['college']);
        if (college.rows.length > 0) {
          tenantId = college.rows[0].id;
        }
      }

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name, phone, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, role`,
        [tenantId, email, passwordHash, role, firstName, lastName || '', phone || '', role === 'super_admin']
      );

      const user = userResult.rows[0];

      // Create role-specific profile
      if (role === 'student') {
        await client.query(
          `INSERT INTO student_profiles (user_id, tenant_id, roll_number, department, batch_year, graduation_year)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, tenantId, body.rollNumber || '', body.department || '', 
           parseInt(body.batchYear) || new Date().getFullYear(), 
           (parseInt(body.batchYear) || new Date().getFullYear()) + 4]
        );
      }

      if (role === 'employer') {
        const companySlug = slugify(body.companyName || firstName) + '-' + Date.now().toString(36);
        await client.query(
          `INSERT INTO employer_profiles (user_id, company_name, company_slug, industry, website)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, body.companyName || `${firstName}'s Company`, companySlug, body.industry || '', body.companyWebsite || '']
        );
      }

      return user;
    });

    return NextResponse.json({ 
      message: 'Account created successfully', 
      user: { id: result.id, email: result.email, role: result.role } 
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
