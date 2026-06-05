import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { restoreCollegeStudentProfile } from '@/lib/collegeStudentArchive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;




export async function POST(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: profileId } = await params;
    if (!profileId) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 });
    }

    const result = await restoreCollegeStudentProfile({
      profileId,
      adminUserId: session.user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student restored. They can sign in again and appear in college lists, drives, and jobs.',
    });
  } catch (error) {
    console.error('POST /api/admin/archived-students/[id]/restore', error);
    return NextResponse.json({ error: 'Failed to restore student' }, { status: 500 });
  }
}
