import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get student profile ID
    const studentQuery = await query(`SELECT id FROM student_profiles WHERE user_id = $1`, [userId]);
    const studentId = studentQuery.rows[0]?.id;

    if (!studentId) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });

    // Fetch offers
    const offersResult = await query(`
      SELECT o.id, ep.company_name as company, o.job_title as role,
             o.salary, o.salary_currency as currency, o.location, o.joining_date as "joiningDate",
             o.status, o.deadline, o.created_at as "createdAt", o.accepted_at as "acceptedAt"
      FROM offers o
      JOIN employer_profiles ep ON o.employer_id = ep.id
      WHERE o.student_id = $1
      ORDER BY o.created_at DESC
    `, [studentId]);

    // Check for expired pending offers and auto-update them
    const now = new Date();
    const updatedOffers = [];

    for (let offer of offersResult.rows) {
      if (offer.status === 'pending' && offer.deadline && new Date(offer.deadline) < now) {
        // Auto-expire
        offer.status = 'expired';
        try {
          await query(`UPDATE offers SET status = 'expired' WHERE id = $1`, [offer.id]);
        } catch (e) {
          console.error('Failed to update expired status:', e);
        }
      }
      updatedOffers.push(offer);
    }

    return NextResponse.json(updatedOffers);

  } catch (error) {
    console.error('Failed to load student offers:', error);
    return NextResponse.json(
      { error: 'Failed to load student offers' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const studentQuery = await query(`SELECT id FROM student_profiles WHERE user_id = $1`, [userId]);
    const studentId = studentQuery.rows[0]?.id;
    if (!studentId) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });

    const body = await request.json();
    const id = String(body?.id || '').trim();
    const action = String(body?.action || '').trim();
    if (!id || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'id and valid action are required' }, { status: 400 });
    }

    const nextStatus = action === 'accept' ? 'accepted' : 'declined';
    const result = await query(
      `UPDATE offers
       SET status = $1,
           accepted_at = CASE WHEN $1 = 'accepted' THEN NOW() ELSE accepted_at END,
           updated_at = NOW()
       WHERE id = $2 AND student_id = $3 AND status = 'pending'
       RETURNING id, status`,
      [nextStatus, id, studentId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Offer not found or not pending' }, { status: 404 });
    }

    return NextResponse.json({ offer: result.rows[0] });
  } catch (error) {
    console.error('Failed to update student offer:', error);
    return NextResponse.json({ error: 'Failed to update offer status' }, { status: 500 });
  }
}
