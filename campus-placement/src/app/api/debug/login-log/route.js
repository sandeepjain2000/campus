/** @no-platform-error-wrap — login debug ingest; manual try/catch to avoid recursion */
import { NextResponse } from 'next/server';
import { writePlatformErrorLog } from '@/lib/platformErrorLog';
import { PLATFORM_ERROR_CONTEXT } from '@/lib/platformErrorContext';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint — no auth required (called from login page before session exists).
 * Accepts a structured debug trace from the browser and persists it to platform_error_logs.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { steps, email, userAgent, sessionId } = body;

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'steps array is required' }, { status: 400 });
    }

    // Sanitize email - never log passwords
    const safeEmail = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 200) : null;

    const xff = request.headers.get('x-forwarded-for');
    const ipAddress = xff ? xff.split(',')[0].trim().slice(0, 45) : request.headers.get('x-real-ip') || null;

    const details = {
      source: 'login_debug_browser',
      email: safeEmail,
      sessionId: typeof sessionId === 'string' ? sessionId.slice(0, 64) : null,
      userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : null,
      steps: steps.slice(0, 50).map((s) => ({
        t: s.t,
        event: typeof s.event === 'string' ? s.event.slice(0, 200) : String(s.event || ''),
        data: s.data ?? null,
      })),
    };

    // Determine overall outcome from last step
    const lastStep = steps[steps.length - 1];
    const failed = lastStep?.event?.toLowerCase().includes('fail') ||
                   lastStep?.event?.toLowerCase().includes('error') ||
                   lastStep?.data?.ok === false;

    const logId = await writePlatformErrorLog({
      context: PLATFORM_ERROR_CONTEXT.LOGIN_DEBUG,
      error: new Error(`Login debug trace: ${failed ? 'FAILED' : 'succeeded'} for ${safeEmail || 'unknown'}`),
      statusCode: failed ? 401 : 200,
      severity: failed ? 'warning' : 'info',
      userMessage: `Login debug trace for ${safeEmail || 'unknown'} — ${failed ? 'FAILED' : 'succeeded'}`,
      ipAddress,
      details,
    });

    return NextResponse.json({ ok: true, logId });
  } catch (err) {
    console.error('POST /api/debug/login-log', err);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}
