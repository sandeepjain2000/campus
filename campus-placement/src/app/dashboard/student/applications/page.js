import { redirect } from 'next/navigation';

/**
 * /dashboard/student/applications → redirect to Jobs by default.
 * The "My Applications" hub now uses per-type pages.
 */
export default function StudentApplicationsRedirect() {
  redirect('/dashboard/student/applications/jobs');
}
