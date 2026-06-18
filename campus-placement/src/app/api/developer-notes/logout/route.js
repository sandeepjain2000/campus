import { NextResponse } from 'next/server';
import { DEV_NOTES_COOKIE, devNotesCookieOptions } from '@/lib/developerNotesAuth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEV_NOTES_COOKIE, '', { ...devNotesCookieOptions(), maxAge: 0 });
  return response;
}
