import { AND_APP_NOT_DELETED, AND_DRIVE_NOT_DELETED, AND_JP_NOT_DELETED, AND_PA_NOT_DELETED } from '@/lib/softDeleteSql';
import { SP_ACTIVE_CLAUSE } from '@/lib/studentProfileActive';

/** Live applicant count for a placement drive (matches employer applications list). */
export const DRIVE_APPLICANT_COUNT_SUBQUERY = `
  (SELECT COUNT(*)::int
   FROM applications a
   INNER JOIN student_profiles sp ON sp.id = a.student_id AND ${SP_ACTIVE_CLAUSE}
   WHERE a.drive_id = d.id
     ${AND_APP_NOT_DELETED})`;

/** Per job posting: program applicants only (independent of placement drives). */
export const JOB_APPLICANT_COUNT_SUBQUERY = `
  (SELECT COUNT(*)::int
   FROM program_applications pa
   INNER JOIN student_profiles sp ON sp.id = pa.student_id AND ${SP_ACTIVE_CLAUSE}
   WHERE pa.job_id = jp.id
     AND pa.status <> 'withdrawn'
     ${AND_PA_NOT_DELETED})`;
