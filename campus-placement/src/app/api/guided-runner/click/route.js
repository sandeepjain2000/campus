import { NextResponse } from 'next/server';
import { isGuidedRunnerFeatureEnabled } from '@/lib/guidedRunnerConfig';
import { acknowledgeGuidedClickInDb, getGuidedState } from '@/lib/guidedRunnerDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST() {
  if (!isGuidedRunnerFeatureEnabled()) {
    return NextResponse.json({ error: 'Guided testing API disabled in this environment.' }, { status: 403 });
  }
  try {
    const result = acknowledgeGuidedClickInDb();
    return NextResponse.json({
      ok: result.ok,
      waitGen: result.waitGen,
      reason: result.reason || null,
      alreadyAcked: result.alreadyAcked || false,
      ...getGuidedState(),
    });
  } catch (e) {
    console.error('POST /api/guided-runner/click', e);
    return NextResponse.json({ ok: false, error: e.message || 'Failed to record click' }, { status: 500 });
  }
}
