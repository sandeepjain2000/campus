import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateOffersFromSelections } from '@/lib/bulkOfferGenerate';
import { withApiHandlers } from '@/lib/platformErrorRoute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEmployerId(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const r = await query(`SELECT id FROM employer_profiles WHERE user_id = $1 LIMIT 1`, [userId]);
  return r.rows[0]?.id || null;
}

async function __platform_POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const employerId = await getEmployerId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json();
    const driveId = String(body?.driveId || body?.drive_id || '').trim();
    const templateId = String(body?.templateId || body?.template_id || '').trim();

    if (!driveId || !templateId) {
      return NextResponse.json({ error: 'driveId and templateId are required' }, { status: 400 });
    }

    const result = await generateOffersFromSelections({ employerId, driveId, templateId });

    return NextResponse.json({
      message:
        result.created > 0
          ? `Generated ${result.created} offer(s) and sent ${result.emailed} email(s).`
          : 'No new selections without offers — run again after marking more students as selected.',
      ...result,
    });
  } catch (error) {
    if (error?.message === 'DRIVE_NOT_FOUND') {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return NextResponse.json({ error: 'Offer template not found' }, { status: 404 });
    }
    console.error('POST /api/employer/offers/bulk-generate', error);
    return NextResponse.json({ error: 'Failed to generate offers' }, { status: 500 });
  }
}

const handlers = withApiHandlers({ POST: __platform_POST }, { context: 'api_employer_offers_bulk_generate' });
export const POST = handlers.POST;
