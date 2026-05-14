/**
 * Input validation helpers for the Campus Placement platform
 */

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email || '').trim());
}

/** Letters (Unicode), spaces, apostrophes, periods, hyphens — for person names. */
export function validatePersonName(name, { required = true, label = 'Name' } = {}) {
  const s = String(name || '').trim();
  if (!s) return required ? `${label} is required` : '';
  if (s.length < 2) return `${label} must be at least 2 characters`;
  if (s.length > 100) return `${label} is too long`;
  if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(s)) {
    return `${label} may only contain letters, spaces, apostrophes, periods, and hyphens`;
  }
  if (/\d/.test(s)) return `${label} cannot contain numbers`;
  return '';
}

/** Admission / batch start year (e.g. UG batch of 2024). */
export function validateBatchYear(yearStr, { required = false } = {}) {
  const raw = String(yearStr ?? '').trim();
  if (!raw) return required ? 'Batch year is required' : '';
  const y = parseInt(raw, 10);
  if (!/^\d{4}$/.test(raw) || Number.isNaN(y)) return 'Enter batch year as a 4-digit year (e.g. 2024)';
  const now = new Date().getFullYear();
  const min = now - 12;
  const max = now + 8;
  if (y < min || y > max) return `Batch year must be between ${min} and ${max}`;
  return '';
}

export function validatePassword(password) {
  // Min 8 chars, at least one uppercase, one lowercase, one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
}

/** E.164: leading +, country code, 8–15 digits total (spaces/dashes stripped). */
export function validatePhone(phone) {
  if (phone == null || String(phone).trim() === '') return true;
  const compact = String(phone).replace(/[\s-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact);
}

export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateCGPA(cgpa) {
  const num = parseFloat(cgpa);
  return !isNaN(num) && num >= 0 && num <= 10;
}

export function validatePercentage(pct) {
  const num = parseFloat(pct);
  return !isNaN(num) && num >= 0 && num <= 100;
}

export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

export function validateRequired(obj, fields) {
  const missing = [];
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
}

export function validateRegistration(data) {
  const errors = {};

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  if (!data.password || !validatePassword(data.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
  }
  const fnErr = validatePersonName(data.firstName, { required: true, label: 'First name' });
  if (fnErr) errors.firstName = fnErr;
  const lnErr = validatePersonName(data.lastName, { required: false, label: 'Last name' });
  if (lnErr) errors.lastName = lnErr;
  if (!data.role || !['student', 'employer', 'college_admin'].includes(data.role)) {
    errors.role = 'Valid role is required';
  }

  if (data.role === 'student') {
    const key =
      typeof data.campusBindingToken === 'string'
        ? data.campusBindingToken.trim().replace(/\s+/g, '')
        : '';
    if (key.length < 15) {
      errors.campusBindingToken =
        'Campus enrollment key is too short — paste the full code from your placement office';
    }
    const deptId = typeof data.departmentId === 'string' ? data.departmentId.trim() : '';
    const deptText = typeof data.department === 'string' ? data.department.trim() : '';
    if (!deptId && (!deptText || deptText.length < 2)) {
      errors.department = 'Please select a department';
    }
    const byErr = validateBatchYear(data.batchYear, { required: true });
    if (byErr) errors.batchYear = byErr;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateJobPosting(data) {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Job title is required (min 3 characters)';
  }
  if (!data.job_type || !['full_time', 'internship', 'contract', 'ppo'].includes(data.job_type)) {
    errors.job_type = 'Valid job type is required';
  }
  if (data.salary_min && data.salary_max && parseFloat(data.salary_min) > parseFloat(data.salary_max)) {
    errors.salary = 'Minimum salary cannot exceed maximum salary';
  }
  if (data.min_cgpa && !validateCGPA(data.min_cgpa)) {
    errors.min_cgpa = 'CGPA must be between 0 and 10';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
