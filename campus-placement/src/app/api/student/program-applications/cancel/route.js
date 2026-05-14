import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const { application_id, withdrawal_reason } = await req.json();

    if (!application_id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    // Identify the student and the application
    const appQuery = await query(`
      SELECT pa.id
      FROM program_applications pa
      JOIN student_profiles sp ON pa.student_id = sp.id
      WHERE pa.id = $1::uuid AND sp.user_id = $2::uuid
    `, [application_id, userId]);

    if (appQuery.rowCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Withdraw the application
    await query(`
      UPDATE program_applications 
      SET status = 'withdrawn', notes = COALESCE(notes, '') || '\nWithdrawal Reason: ' || $1::text, updated_at = NOW()
      WHERE id = $2::uuid
    `, [withdrawal_reason || 'Student cancelled', application_id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Cancel Program Application Error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    );
  }
}
