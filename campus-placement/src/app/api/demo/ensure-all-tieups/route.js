import { NextResponse } from 'next/server';
import { isDemoDataApiEnabled, demoDataDisabledResponse } from '@/lib/demoDataAccess';
import { ensureEmployerTieUpBootstrap } from '@/lib/employerTieUpBootstrap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** POST { scope?: 'demo' | 'all' } — restore approved campus–employer tie-ups. */
export async function POST(request) {
  if (!isDemoDataApiEnabled()) return demoDataDisabledResponse();
  try {
    const body = await request.json().catch(() => ({}));
    const scope = body?.scope === 'all' ? 'all' : 'demo';
    const payload = await ensureEmployerTieUpBootstrap({ scope });
    return NextResponse.json({
      ok: payload.ok !== false,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  } catch (e) {
    console.error('POST /api/demo/ensure-all-tieups', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Failed to restore tie-ups' },
      { status: 500 },
    );
  }
}
