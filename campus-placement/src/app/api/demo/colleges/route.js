import { NextResponse } from 'next/server';
import { isDemoDataApiEnabled, demoDataDisabledResponse } from '@/lib/demoDataAccess';
import { listDemoColleges } from '@/lib/demoDataFactory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;






export async function GET() {
  if (!isDemoDataApiEnabled()) return demoDataDisabledResponse();
  try {
    const colleges = await listDemoColleges();
    return NextResponse.json({ colleges });
  } catch (e) {
    console.error('GET /api/demo/colleges', e);
    return NextResponse.json({ error: 'Failed to load colleges' }, { status: 500 });
  }
}
