import { NextResponse } from 'next/server';
import { loadPublicJobPosting } from '@/lib/publicJobPosting';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const jobId = params?.id;
    const job = await loadPublicJobPosting(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found or not publicly available' }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (e) {
    console.error('GET /api/public/jobs/[id]', e);
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 });
  }
}
