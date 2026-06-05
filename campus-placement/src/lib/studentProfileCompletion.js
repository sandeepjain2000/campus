/**
 * Minimum academic profile fields required before students can browse placements.
 */

function present(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function validCgpa(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/**
 * @param {Record<string, unknown> | null | undefined} row — student_profiles + users.phone join
 * @returns {{ profileComplete: boolean, missingLabels: string[] }}
 */
export function evaluateStudentProfileForBrowse(row) {
  const missingLabels = [];
  if (!row) {
    return {
      profileComplete: false,
      missingLabels: ['Roll number', 'Phone number', 'Branch', 'Course / department', 'CGPA'],
    };
  }

  if (!present(row.roll_number)) missingLabels.push('Roll number');
  if (!present(row.phone) && !present(row.user_phone)) missingLabels.push('Phone number');
  if (!present(row.branch)) missingLabels.push('Branch');
  if (!present(row.department) && !present(row.course)) missingLabels.push('Course / department');
  if (!validCgpa(row.cgpa)) missingLabels.push('CGPA');

  return { profileComplete: missingLabels.length === 0, missingLabels };
}
