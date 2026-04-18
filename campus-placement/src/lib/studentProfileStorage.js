/**
 * Client-side persistence for student profile (demo / pre-DB).
 * Keyed by user email so refreshes keep edits until API backs the shape.
 */

export function profileStorageKey(email) {
  if (!email) return null;
  return `ph_student_profile:${email.toLowerCase()}`;
}

export function appliedDrivesStorageKey(email) {
  if (!email) return null;
  return `ph_student_applied_drives:${email.toLowerCase()}`;
}

export function defaultStudentProfile(sessionUser) {
  const email = sessionUser?.email || '';
  return {
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    rollNumber: 'CS2021001',
    batchYear: 2021,
    graduationYear: 2025,
    cgpa: 8.72,
    tenthPercentage: 94.5,
    twelfthPercentage: 91.2,
    gender: 'Male',
    collegeEmail: email,
    personalEmail: '',
    phones: [{ label: 'Primary', value: '+91 98765 43210' }],
    emails: [
      { label: 'College', value: email },
      { label: 'Personal', value: '' },
    ],
    bio: 'Passionate about AI/ML and full-stack development. Looking for challenging opportunities in technology.',
    skills: ['Python', 'JavaScript', 'React', 'Machine Learning', 'SQL', 'Node.js', 'Docker'],
    expectedSalaryMin: 1200000,
    expectedSalaryMax: 1800000,
    preferredLocations: 'Bangalore, Hyderabad, Pune',
    willingToRelocate: true,
    /** @type {{ id: string, kind: string, url: string, title: string, description: string }[]} */
    profileLinks: [
      { id: 'l1', kind: 'linkedin', url: 'https://linkedin.com/in/arjunverma', title: 'LinkedIn', description: 'Professional experience and recommendations.' },
      { id: 'l2', kind: 'github', url: 'https://github.com/arjunverma', title: 'GitHub', description: 'Repos: ML course projects, full-stack apps, competitive programming.' },
    ],
    avatarDataUrl: '',
    avatarName: '',
    cvFileName: '',
    cvDataUrl: '',
  };
}

export function loadStudentProfile(email, sessionUser) {
  const key = profileStorageKey(email);
  if (!key || typeof window === 'undefined') return defaultStudentProfile(sessionUser);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultStudentProfile(sessionUser);
    const parsed = JSON.parse(raw);
    return { ...defaultStudentProfile(sessionUser), ...parsed };
  } catch {
    return defaultStudentProfile(sessionUser);
  }
}

export function saveStudentProfile(email, profile) {
  const key = profileStorageKey(email);
  if (!key || typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(profile));
}

export function loadAppliedDriveIds(email) {
  const key = appliedDrivesStorageKey(email);
  if (!key || typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveAppliedDriveIds(email, idsSet) {
  const key = appliedDrivesStorageKey(email);
  if (!key || typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify([...idsSet]));
}
