import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    let progress = {
      isComplete: false,
      steps: [],
      dismissed: false
    };

    if (role === 'student') {
      // Step 1: Complete Academic Profile
      // Step 2: Upload Resume
      const profileRes = await query(
        `SELECT id, cgpa, resume_url FROM student_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      const profile = profileRes.rows[0];
      
      const hasCgpa = profile && profile.cgpa !== null && profile.cgpa > 0;
      const hasResume = profile && profile.resume_url !== null && profile.resume_url.trim() !== '';

      // Step 3: Apply to First Job
      let hasApplications = false;
      if (profile) {
        const appsRes = await query(
          `SELECT 1 FROM applications WHERE student_id = $1 LIMIT 1`,
          [profile.id]
        );
        hasApplications = appsRes.rowCount > 0;
      }

      progress.steps = [
        { id: 'academic', title: 'Complete Academic Profile', completed: !!hasCgpa, href: '/dashboard/student/profile' },
        { id: 'resume', title: 'Upload Resume', completed: !!hasResume, href: '/dashboard/student/documents' },
        { id: 'apply', title: 'Apply to First Job', completed: !!hasApplications, href: '/dashboard/student/jobs' },
      ];
      
      progress.isComplete = progress.steps.every(s => s.completed);

    } else if (role === 'employer') {
      // Step 1: Complete Company Profile
      const profileRes = await query(
        `SELECT id, company_name, website FROM employer_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      const profile = profileRes.rows[0];
      const hasProfile = profile && profile.company_name && profile.website;

      // Step 2: Create Placement Drive
      let hasDrives = false;
      if (profile) {
        const drivesRes = await query(
          `SELECT 1 FROM placement_drives WHERE employer_id = $1 LIMIT 1`,
          [profile.id]
        );
        hasDrives = drivesRes.rowCount > 0;
      }

      // Step 3: Upload Offer Letters
      let hasOffers = false;
      if (profile) {
        const offersRes = await query(
          `SELECT 1 FROM offers WHERE employer_id = $1 LIMIT 1`,
          [profile.id]
        );
        hasOffers = offersRes.rowCount > 0;
      }

      progress.steps = [
        { id: 'profile', title: 'Complete Company Profile', completed: !!hasProfile, href: '/dashboard/employer/profile' },
        { id: 'drive', title: 'Create Placement Drive', completed: !!hasDrives, href: '/dashboard/employer/drives' },
        { id: 'offers', title: 'Upload Offer Letters', completed: !!hasOffers, href: '/dashboard/employer/offers' },
      ];

      progress.isComplete = progress.steps.every(s => s.completed);
    } else if (role === 'college_admin') {
      // Basic static steps for college admin
      progress.steps = [
        { id: 'settings', title: 'Configure Campus Settings', completed: false, href: '/dashboard/college/settings' },
        { id: 'employers', title: 'Review Employer Requests', completed: false, href: '/dashboard/college/employers/requests' },
        { id: 'students', title: 'Invite Students', completed: false, href: '/dashboard/college/students' },
      ];
      progress.isComplete = false;
    } else {
      // Basic static steps for super admin
      progress.steps = [
        {
          id: 'colleges',
          title: 'Onboard New Colleges',
          completed: false,
          href: '/dashboard/admin/pending-registrations',
        },
        { id: 'employers', title: 'Verify Employers', completed: false, href: '/dashboard/admin/employers' },
        { id: 'settings', title: 'Platform Settings', completed: false, href: '/dashboard/admin/settings' },
      ];
      progress.isComplete = false;
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Failed to load onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to load onboarding progress' },
      { status: 500 }
    );
  }
}
