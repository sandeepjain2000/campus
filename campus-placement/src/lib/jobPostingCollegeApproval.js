import { notifyStudentsOfTenant } from '@/lib/notificationService';

/** SQL fragment — visibility row approved by college for this campus. */
export const JPV_COLLEGE_APPROVED = "jpv.college_status = 'approved'";

/**
 * Notify students after college approves a published listing for their campus.
 * @param {import('pg').PoolClient | null} client
 * @param {{ tenantId: string, title: string, jobType: string, companyName: string }} params
 */
export async function notifyStudentsListingApproved(client, { tenantId, title, jobType, companyName }) {
  const jt = String(jobType || '').toLowerCase();
  if (jt === 'internship') {
    await notifyStudentsOfTenant(
      tenantId,
      {
        title: `New internship: ${title}`,
        message: `${companyName} posted an internship. Open Internships under Placements to apply.`,
        type: 'drive',
        link: '/dashboard/student/internships',
      },
      client,
    );
    return;
  }
  if (jt === 'short_project' || jt === 'hackathon') {
    const link = jt === 'hackathon' ? '/dashboard/student/hackathons' : '/dashboard/student/projects';
    await notifyStudentsOfTenant(
      tenantId,
      {
        title: `New ${jt === 'hackathon' ? 'hackathon' : 'project'}: ${title}`,
        message: `${companyName} posted a ${String(jt).replace(/_/g, ' ')}. Browse under Placements to apply.`,
        type: 'info',
        link,
      },
      client,
    );
    return;
  }
  if (jt === 'full_time' || jt === 'part_time' || jt === 'contract' || jt === 'ppo') {
    await notifyStudentsOfTenant(
      tenantId,
      {
        title: `New job: ${title}`,
        message: `${companyName} posted a job opening. Open Jobs under Placements to apply.`,
        type: 'info',
        link: '/dashboard/student/jobs',
      },
      client,
    );
  }
}
