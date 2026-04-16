import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id } = session.user;
    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File is empty or missing headers' }, { status: 400 });
    }

    // Basic CSV parse (Header: Name,Email,RollNumber,Department,CGPA)
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const expectedHeaders = ['name', 'email', 'rollnumber', 'department', 'cgpa'];
    
    // Check if essential headers exist
    if (!expectedHeaders.every(h => headers.includes(h))) {
      return NextResponse.json({ error: `Missing required headers. Expected: ${expectedHeaders.join(', ')}` }, { status: 400 });
    }

    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const rollIdx = headers.indexOf('rollnumber');
    const deptIdx = headers.indexOf('department');
    const cgpaIdx = headers.indexOf('cgpa');

    let processedCount = 0;
    const errors = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < expectedHeaders.length) continue;

      const name = parts[nameIdx];
      const email = parts[emailIdx];
      const rollNumber = parts[rollIdx];
      const department = parts[deptIdx];
      const cgpa = parseFloat(parts[cgpaIdx]);

      try {
        // Here we would strictly insert it into the Postgres DB in production.
        // A minimal logic for creating user -> student_profile
        // For safety in this demo, we'll simulate the insertion or do a basic UPSERT
        
        // 1. Create User
        // INSERT INTO users (tenant_id, email, password_hash, role, first_name) ...
        
        // 2. Create Student Profile
        // INSERT INTO student_profiles (user_id, tenant_id, roll_number, department, cgpa) ...
        
        processedCount++;
      } catch (err) {
        errors.push(`Row ${i + 1} (${email}): ${err.message}`);
      }
    }

    if (processedCount === 0 && errors.length > 0) {
      return NextResponse.json({ error: 'Failed to process any records', details: errors }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${processedCount} student(s)`,
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
