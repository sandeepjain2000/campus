import { NextResponse } from 'next/server';
import { isDemoDataApiEnabled, demoDataDisabledResponse } from '@/lib/demoDataAccess';
import { createDemoJobs } from '@/lib/demoDataFactory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;






export async function POST(request) {
  if (!isDemoDataApiEnabled()) return demoDataDisabledResponse();
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = body?.tenantId ? String(body.tenantId).trim() : undefined;
    const count = body?.count != null ? Number(body.count) : 2;
    const payload = await createDemoJobs({ tenantId, count });
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  } catch (e) {
    console.error('POST /api/demo/create-jobs', e);
    return NextResponse.json({ ok: false, error: e.message || 'Failed to create jobs' }, { status: 500 });
  }
}
