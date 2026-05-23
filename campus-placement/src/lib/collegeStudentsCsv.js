import { parseJoiningBatch, reconcileBatchFields } from '@/lib/studentBatch';
import { defaultAdmissionBatchYear } from '@/lib/admissionBatchYear';
import { formatProfileSectionsCell } from '@/lib/studentProfileSections';
import { validateStudentCgpa } from '@/lib/validators';

/** Display + template defaults (import falls back when cells are blank). */
export const CURRENT_ACADEMIC_YEAR = '2025-26';
export const CURRENT_SEMESTER = '6';
/** Joining batch = intake year (YYYY). */
export const CURRENT_JOINING_BATCH = defaultAdmissionBatchYear();
export const CURRENT_ADMISSION_YEAR = defaultAdmissionBatchYear();
export const CURRENT_GRADUATION_YEAR = '2026';

/** Columns required for roster CSV import (batch columns are optional for older templates). */
export const STUDENT_CSV_REQUIRED_HEADERS = [
  'Academic Year',
  'Semester',
  'Name',
  'Roll',
  'Email',
  'Department',
  'Specialization',
  'Gender',
  'Disability Status',
  'Diversity Category',
  'Skills',
  'CGPA',
  'Job Status',
  'Internship Status',
  'Verified',
  'Sections',
  'Photo URL',
];

export const STUDENT_CSV_HEADERS = [
  'Academic Year',
  'Semester',
  'Batch',
  'Admission Year',
  'Graduation Year',
  'Name',
  'Roll',
  'Email',
  'Department',
  'Specialization',
  'Gender',
  'Disability Status',
  'Diversity Category',
  'Skills',
  'CGPA',
  'Job Status',
  'Internship Status',
  'Verified',
  'Sections',
  'Photo URL',
];

const JOB = ['unplaced', 'placed', 'opted_out', 'higher_studies'];
const INTERN = ['none', 'ongoing', 'completed'];

function normKey(h) {
  return String(h ?? '').trim().toLowerCase();
}

/** Match import / roster rows by roll (trim + case-insensitive). */
export function normalizeStudentRollKey(roll) {
  return String(roll ?? '').trim().toLowerCase();
}

export function buildHeaderIndex(headers) {
  const idx = {};
  headers.forEach((h, i) => {
    const k = normKey(h);
    if (k) idx[k] = i;
  });
  return idx;
}

export function validateStudentCsvHeaders(headers) {
  const idx = buildHeaderIndex(headers);
  const missing = STUDENT_CSV_REQUIRED_HEADERS.filter((col) => idx[normKey(col)] === undefined);
  if (missing.length) {
    return { ok: false, error: `Missing columns: ${missing.join(', ')}` };
  }
  return { ok: true, idx };
}

function parseVerified(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(v)) return true;
  if (['no', 'n', 'false', '0', ''].includes(v)) return false;
  return null;
}

export function normalizeJobStatus(raw) {
  let t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (t === 'higherstudies') t = 'higher_studies';
  if (t === 'optedout') t = 'opted_out';
  if (JOB.includes(t)) return t;
  return null;
}

export function normalizeInternshipStatus(raw) {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (INTERN.includes(t)) return t;
  return null;
}

export function studentToCsvRow(s) {
  return STUDENT_CSV_HEADERS.map((h) => {
    if (h === 'Skills') return (s.skills || []).join('; ');
    if (h === 'Verified') return s.verified ? 'Yes' : 'No';
    if (h === 'CGPA') return String(s.cgpa ?? '');
    const map = {
      'Academic Year': s.academicYear,
      Semester: s.semester,
      Batch: s.batch || s.joiningAcademicYear || '',
      'Admission Year': s.batchYear != null ? String(s.batchYear) : '',
      'Graduation Year': s.graduationYear != null ? String(s.graduationYear) : '',
      Name: s.name,
      Roll: s.systemId || s.roll,
      Email: s.email,
      Department: s.dept,
      Specialization: s.specialization,
      Gender: s.gender,
      'Disability Status': s.disabilityStatus,
      'Diversity Category': s.diversityCategory,
      'Job Status': s.jobStatus,
      'Internship Status': s.internshipStatus,
      Sections: formatProfileSectionsCell(s),
      'Photo URL': s.photo,
    };
    return String(map[h] ?? '');
  });
}

export function studentCsvTemplateExampleRow() {
  return [
    CURRENT_ACADEMIC_YEAR,
    CURRENT_SEMESTER,
    CURRENT_JOINING_BATCH,
    CURRENT_ADMISSION_YEAR,
    CURRENT_GRADUATION_YEAR,
    'Sample Student',
    'CS2021001',
    'student@example.com',
    'Computer Science',
    'AI & ML',
    'Female',
    'None',
    'General',
    'Python; React',
    '8.50',
    'unplaced',
    'none',
    'No',
    '3/6',
    'https://i.pravatar.cc/64?img=1',
  ];
}

/**
 * @param {string[]} cells
 * @param {Record<string, number>} idx — normalized header → column index
 * @param {number} line — 1-based data line in file (for errors)
 */
export function parseStudentRow(cells, idx, line) {
  const g = (name) => {
    const i = idx[normKey(name)];
    return i === undefined ? '' : String(cells[i] ?? '').trim();
  };

  const name = g('Name');
  const roll = g('Roll');
  const email = g('Email').toLowerCase();
  if (!name) return { ok: false, error: `Line ${line}: Name is required` };
  if (!roll) return { ok: false, error: `Line ${line}: Roll is required` };
  if (!email || !email.includes('@')) return { ok: false, error: `Line ${line}: Valid Email is required` };

  const skillsRaw = g('Skills');
  const skills = skillsRaw
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);

  const cgpaRaw = g('CGPA');
  let cgpa;
  if (cgpaRaw === '') {
    cgpa = 8;
  } else {
    const cgpaErr = validateStudentCgpa(cgpaRaw);
    if (cgpaErr) {
      return { ok: false, error: `Line ${line}: ${cgpaErr}` };
    }
    cgpa = Number(cgpaRaw);
  }

  const verified = parseVerified(g('Verified'));
  if (verified === null) {
    return { ok: false, error: `Line ${line}: Verified must be Yes or No` };
  }

  const jobStatus = normalizeJobStatus(g('Job Status'));
  if (!jobStatus) {
    return {
      ok: false,
      error: `Line ${line}: Job Status must be one of: ${JOB.join(', ')}`,
    };
  }

  const internshipStatus = normalizeInternshipStatus(g('Internship Status'));
  if (!internshipStatus) {
    return {
      ok: false,
      error: `Line ${line}: Internship Status must be one of: ${INTERN.join(', ')}`,
    };
  }

  const semester = g('Semester');
  if (semester && !/^[1-8]$/.test(semester)) {
    return { ok: false, error: `Line ${line}: Semester must be 1–8` };
  }

  const batchReconciled = reconcileBatchFields({
    batch: g('Batch'),
    batch_year: g('Admission Year'),
    graduation_year: g('Graduation Year'),
  });
  if (batchReconciled.error) {
    return { ok: false, error: `Line ${line}: ${batchReconciled.error}` };
  }
  if (g('Batch')) {
    const check = parseJoiningBatch(g('Batch'));
    if (!check.ok) return { ok: false, error: `Line ${line}: ${check.error}` };
  }
  if (g('Admission Year') && batchReconciled.batchYear == null) {
    return { ok: false, error: `Line ${line}: Admission Year must be a 4-digit year` };
  }
  if (g('Graduation Year') && batchReconciled.graduationYear == null) {
    return { ok: false, error: `Line ${line}: Graduation Year must be a 4-digit year` };
  }
  if (
    batchReconciled.batchYear &&
    batchReconciled.graduationYear &&
    batchReconciled.graduationYear < batchReconciled.batchYear
  ) {
    return { ok: false, error: `Line ${line}: Graduation Year must be on or after Admission Year` };
  }

  return {
    ok: true,
    student: {
      academicYear: g('Academic Year') || CURRENT_ACADEMIC_YEAR,
      semester: semester || CURRENT_SEMESTER,
      batch: batchReconciled.joiningAcademicYear || batchReconciled.batchLabel,
      joiningAcademicYear: batchReconciled.joiningAcademicYear,
      batchYear: batchReconciled.batchYear,
      graduationYear: batchReconciled.graduationYear,
      name,
      roll,
      email,
      dept: g('Department'),
      specialization: g('Specialization'),
      gender: g('Gender'),
      disabilityStatus: g('Disability Status') || 'None',
      diversityCategory: g('Diversity Category') || 'General',
      skills,
      cgpa,
      jobStatus,
      internshipStatus,
      verified,
      photo: g('Photo URL') || `https://i.pravatar.cc/64?u=${encodeURIComponent(roll)}`,
    },
  };
}
