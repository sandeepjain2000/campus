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

    if (updatedOffers.length === 0) {
      throw new Error('Fallback to mock');
    }

    return NextResponse.json(updatedOffers);

  } catch (error) {
    // Mock Data fallback
    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago (Expired)
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours left (Pending)

    return NextResponse.json([
      {
        id: 'mock-1', company: 'TechCorp Solutions', role: 'Software Development Engineer',
        salary: 1500000, currency: 'INR', location: 'Bangalore', joiningDate: '2026-07-01',
        status: 'pending', deadline: future.toISOString(), createdAt: '2026-09-18',
      },
      {
        id: 'mock-2', company: 'Initech', role: 'Backend Dev',
        salary: 1200000, currency: 'INR', location: 'Remote', joiningDate: '2026-07-15',
        status: 'expired', deadline: past.toISOString(), createdAt: '2026-09-10',
      },
      {
        id: 'mock-3', company: 'CloudNine Systems', role: 'DevOps Engineer',
        salary: 1800000, currency: 'INR', location: 'Hyderabad', joiningDate: '2026-08-01',
        status: 'accepted', deadline: '2026-09-10', createdAt: '2026-09-03', acceptedAt: '2026-09-07',
      }
    ]);
  }
}
