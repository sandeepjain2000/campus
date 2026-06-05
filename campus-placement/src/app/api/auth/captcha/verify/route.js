import { NextResponse } from 'next/server';
import { verifyLoginCaptcha } from '@/lib/simpleCaptcha';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const captchaToken = String(body.captchaToken || '').trim();
    const captchaAnswer = body.captchaAnswer;

    if (!captchaToken) {
      return NextResponse.json(
        { ok: false, error: 'Verification expired. Refresh the question and try again.' },
        { status: 400 },
      );
    }

    if (String(captchaAnswer ?? '').trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Enter the verification answer.' },
        { status: 400 },
      );
    }

    if (!verifyLoginCaptcha(captchaToken, captchaAnswer)) {
      return NextResponse.json(
        { ok: false, error: 'Incorrect answer or expired question. Use a new question and try again.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/auth/captcha/verify', e);
    return NextResponse.json(
      { ok: false, error: 'Could not verify. Please try again.' },
      { status: 500 },
    );
  }
}
