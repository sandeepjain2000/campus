/**
 * Dashboard routes per role (from src/config/dashboardMenu.js).
 * Used by blank-screens.spec.js — keep in sync when menu changes.
 */

const SHARED = [
  { label: 'Alerts', href: '/dashboard/alerts' },
  { label: 'Feedback', href: '/dashboard/feedback' },
  { label: 'My data export', href: '/dashboard/my-exports' },
];

function dedupe(routes) {
  const seen = new Set();
  return routes.filter((r) => {
    if (seen.has(r.href)) return false;
    seen.add(r.href);
    return true;
  });
}

const collegeAdminRoutes = dedupe([
  { label: 'Hub', href: '/dashboard/college', hub: true },
  { label: 'Dashboard', href: '/dashboard/college/overview' },
  { label: 'Getting Started', href: '/dashboard/college/getting-started' },
  { label: 'Employers', href: '/dashboard/college/employers' },
  { label: 'Employer Partnership Requests', href: '/dashboard/college/employers/requests' },
  { label: 'Sponsorships', href: '/dashboard/college/sponsorships' },
  { label: 'Jobs', href: '/dashboard/college/jobs' },
  { label: 'Placement Drives', href: '/dashboard/college/drives' },
  { label: 'Internships', href: '/dashboard/college/internships' },
  { label: 'Internship Results', href: '/dashboard/college/internship-results' },
  { label: 'Students', href: '/dashboard/college/students' },
  { label: 'Add student', href: '/dashboard/college/students/add' },
  { label: 'Applications', href: '/dashboard/college/applications' },
  { label: 'Offers', href: '/dashboard/college/offers' },
  { label: 'Upload offers (CSV)', href: '/dashboard/college/offers-upload' },
  { label: 'Hiring Assessment', href: '/dashboard/college/hiring-assessment' },
  { label: 'Interview Scheduling', href: '/dashboard/college/interviews' },
  { label: 'Clarifications', href: '/dashboard/college/clarifications' },
  { label: 'Discussions', href: '/dashboard/college/discussions' },
  { label: 'Message templates', href: '/dashboard/college/message-templates' },
  { label: 'Calendar', href: '/dashboard/college/calendar' },
  { label: 'Events', href: '/dashboard/college/events' },
  { label: 'Guest faculty & lectures', href: '/dashboard/college/guest-engagements' },
  { label: 'Enrollment key', href: '/dashboard/college/enrollment-key' },
  { label: 'Placement Rules', href: '/dashboard/college/rules' },
  { label: 'Academic years', href: '/dashboard/college/academic-years' },
  { label: 'Infrastructure', href: '/dashboard/college/infrastructure' },
  { label: 'Settings', href: '/dashboard/college/settings' },
  { label: 'Reports', href: '/dashboard/college/reports' },
  { label: 'Audit reports', href: '/dashboard/college/audit-reports' },
  ...SHARED,
]);

const studentRoutes = dedupe([
  { label: 'Hub', href: '/dashboard/student', hub: true },
  { label: 'Dashboard', href: '/dashboard/student/overview' },
  { label: 'Getting Started', href: '/dashboard/student/getting-started' },
  { label: 'Browse Drives', href: '/dashboard/student/drives' },
  { label: 'Browse Jobs', href: '/dashboard/student/jobs' },
  { label: 'Browse Internships', href: '/dashboard/student/internships' },
  { label: 'Browse Projects', href: '/dashboard/student/projects' },
  { label: 'Placement calendar', href: '/dashboard/student/calendar' },
  { label: 'My Interviews', href: '/dashboard/student/interviews' },
  { label: 'My Offers', href: '/dashboard/student/offers' },
  { label: 'My Drives', href: '/dashboard/student/applications/drives' },
  { label: 'My Jobs', href: '/dashboard/student/applications/jobs' },
  { label: 'My Internships', href: '/dashboard/student/applications/internships' },
  { label: 'My Projects', href: '/dashboard/student/applications/projects' },
  { label: 'My Hackathons', href: '/dashboard/student/applications/hackathons' },
  { label: 'Clarifications', href: '/dashboard/student/clarifications' },
  { label: 'My Profile', href: '/dashboard/student/profile' },
  { label: 'Documents', href: '/dashboard/student/documents' },
  ...SHARED,
]);

const employerRoutes = dedupe([
  { label: 'Hub', href: '/dashboard/employer', hub: true },
  { label: 'Dashboard', href: '/dashboard/employer/overview' },
  { label: 'Getting Started', href: '/dashboard/employer/getting-started' },
  { label: 'Campus Partnerships', href: '/dashboard/employer/select-campus' },
  { label: 'Company Profile', href: '/dashboard/employer/profile' },
  { label: 'Sponsorships', href: '/dashboard/employer/sponsorships' },
  { label: 'Campus guest needs', href: '/dashboard/employer/campus-guest-needs' },
  { label: 'Internships', href: '/dashboard/employer/internships' },
  { label: 'Projects', href: '/dashboard/employer/projects' },
  { label: 'Job Postings', href: '/dashboard/employer/jobs' },
  { label: 'Placement Drives', href: '/dashboard/employer/drives' },
  { label: 'Hiring Assessment', href: '/dashboard/employer/hiring-assessment' },
  { label: 'Assessment uploads', href: '/dashboard/employer/assessment-uploads' },
  { label: 'Interview Scheduling', href: '/dashboard/employer/interviews' },
  { label: 'Events Calendar', href: '/dashboard/employer/calendar' },
  { label: 'Assessment map', href: '/dashboard/employer/assessment-summary' },
  { label: 'Applications', href: '/dashboard/employer/applications' },
  { label: 'Offers', href: '/dashboard/employer/offers' },
  { label: 'Upload offers (CSV)', href: '/dashboard/employer/offers-upload' },
  { label: 'Clarifications', href: '/dashboard/employer/clarifications' },
  { label: 'Discussions', href: '/dashboard/employer/discussions' },
  { label: 'Email templates', href: '/dashboard/employer/communication-templates' },
  ...SHARED,
]);

const superAdminRoutes = dedupe([
  { label: 'Hub', href: '/dashboard/admin', hub: true },
  { label: 'Dashboard', href: '/dashboard/admin/overview' },
  { label: 'Getting Started', href: '/dashboard/admin/getting-started' },
  { label: 'Colleges', href: '/dashboard/admin/colleges' },
  { label: 'Employers', href: '/dashboard/admin/employers' },
  { label: 'Users', href: '/dashboard/admin/users' },
  { label: 'Archived students', href: '/dashboard/admin/archived-students' },
  { label: 'Email templates', href: '/dashboard/admin/email-templates' },
  { label: 'Pending registrations', href: '/dashboard/admin/pending-registrations' },
  { label: 'Feedback inbox', href: '/dashboard/admin/feedback' },
  { label: 'Audit reports', href: '/dashboard/admin/audit-reports' },
  { label: 'Settings', href: '/dashboard/admin/settings' },
  { label: 'My data export', href: '/dashboard/my-exports' },
]);

module.exports = {
  DEMO_LOGINS: {
    student: 'arjun.verma@iitm.edu',
    employer: 'hr@techcorp.com',
    college_admin: 'admin@iitm.edu',
    super_admin: 'admin@placementhub.com',
  },
  ROLE_HOME: {
    student: /\/dashboard\/student/,
    employer: /\/dashboard\/employer/,
    college_admin: /\/dashboard\/college/,
    super_admin: /\/dashboard\/admin/,
  },
  ROUTES_BY_ROLE: {
    student: studentRoutes,
    employer: employerRoutes,
    college_admin: collegeAdminRoutes,
    super_admin: superAdminRoutes,
  },
};
