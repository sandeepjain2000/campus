const {
  validateEmployerJobPayload,
  EMPLOYER_STIPEND_JOB_TYPES,
  employerCompensationFieldIds,
} = require('@/lib/apiInputValidation');
const { FIELD_IDS } = require('@/lib/inputConstraints');
const { resolveEmployerMinCgpaForSubmit } = require('@/lib/employerJobDisplay');
const { validateAndResolveEmployerJobSubmit } = require('@/lib/employerJobSubmitValidation');

describe('employer min CGPA validation', () => {
  const base = {
    salaryMin: null,
    salaryMax: null,
    vacancies: 1,
    jobType: 'internship',
  };

  it('rejects CGPA of 0 on create payload (API rules)', () => {
    expect(validateEmployerJobPayload({ ...base, minCgpa: 0 })).toMatch(
      /greater than 0 and at most 10/i,
    );
    expect(validateEmployerJobPayload({ ...base, minCgpa: '0' })).toMatch(
      /greater than 0 and at most 10/i,
    );
  });

  it('allows empty min CGPA (optional field)', () => {
    expect(validateEmployerJobPayload({ ...base, minCgpa: '' })).toBeNull();
    expect(validateEmployerJobPayload({ ...base, minCgpa: null })).toBeNull();
  });

  it('resolveEmployerMinCgpaForSubmit rejects 0 and does not silently store null', () => {
    const zero = resolveEmployerMinCgpaForSubmit(0);
    expect(zero.error).toMatch(/greater than 0 and at most 10/i);
    expect(zero.value).toBeNull();

    const valid = resolveEmployerMinCgpaForSubmit('7.5');
    expect(valid.error).toBeNull();
    expect(valid.value).toBe(7.5);
  });

  it('uses stipend field rules for program job types (create and edit parity)', () => {
    for (const jobType of ['internship', 'short_project', 'hackathon']) {
      expect(EMPLOYER_STIPEND_JOB_TYPES.has(jobType)).toBe(true);
      const { minId, maxId } = employerCompensationFieldIds(jobType);
      expect(minId).toBe(FIELD_IDS.EMPLOYER_STIPEND_MIN);
      expect(maxId).toBe(FIELD_IDS.EMPLOYER_STIPEND_MAX);
    }
    const fullTime = employerCompensationFieldIds('full_time');
    expect(fullTime.minId).toBe(FIELD_IDS.EMPLOYER_SALARY_MIN);
    expect(fullTime.maxId).toBe(FIELD_IDS.EMPLOYER_SALARY_MAX);
  });

  it('validateAndResolveEmployerJobSubmit rejects invalid CGPA like API and edit flows', () => {
    const bad = validateAndResolveEmployerJobSubmit({
      ...base,
      minCgpa: 0,
      jobType: 'short_project',
    });
    expect(bad.error).toMatch(/greater than 0 and at most 10/i);
    expect(bad.minCgpa).toBeNull();

    const good = validateAndResolveEmployerJobSubmit({
      ...base,
      minCgpa: '8',
      jobType: 'hackathon',
    });
    expect(good.error).toBeNull();
    expect(good.minCgpa).toBe(8);
  });
});
