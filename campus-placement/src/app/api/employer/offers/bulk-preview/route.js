import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { countDriveSelectionOfferStats, assertEmployerOwnsDrive } from '@/lib/bulkOfferGenerate';
import { withApiHandlers } from '@/lib/platformErrorRoute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEmployerId(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const r = await query(`SELECT id FROM employer_profiles WHERE user_id = $1 LIMIT 1`, [userId]);
  return r.rows[0]?.id || null;
}

async function __platform_GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const employerId = await getEmployerId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const driveId = new URL(request.url).searchParams.get('driveId')?.trim();
    if (!driveId) return NextResponse.json({ error: 'driveId is required' }, { status: 400 });

    const drive = await assertEmployerOwnsDrive(employerId, driveId);
    if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

    const stats = await countDriveSelectionOfferStats({ employerId, driveId });

    return NextResponse.json({
      drive: { id: drive.id, title: drive.title, tenantId: drive.tenant_id },
      selectedCount: stats.selectedCount,
      offersExistingCount: stats.offersExistingCount,
      readyToGenerateCount: stats.readyToGenerateCount,
      pendingStudents: stats.withoutOffer.map((r) => ({
        applicationId: r.application_id,
        studentName: r.student_name,
        collegeName: r.college_name,
      })),
    });
  } catch (error) {
    console.error('GET /api/employer/offers/bulk-preview', error);
    return NextResponse.json({ error: 'Failed to load bulk offer preview' }, { status: 500 });
  }
}

const handlers = withApiHandlers({ GET: __platform_GET }, { context: 'api_employer_offers_bulk_preview' });
export const GET = handlers.GET;
