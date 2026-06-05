const {
  assertEmployerMaySetJobStatus,
  getStudentOpportunityListCache,
  invalidateStudentOpportunityListCache,
  publishedCoreFieldsChanged,
  setStudentOpportunityListCache,
} = require('@/lib/jobPostingPublishState');

const { studentListedJobPostingSql } = require('@/lib/studentOpportunityQuery');

describe('jobPostingPublishState', () => {
  beforeEach(() => {
    invalidateStudentOpportunityListCache();
  });

  it('rejects published → draft transitions', () => {
    expect(() => assertEmployerMaySetJobStatus('published', 'draft')).toThrow(/cannot be moved back to draft/i);
  });

  it('allows draft → published transitions', () => {
    expect(() => assertEmployerMaySetJobStatus('draft', 'published')).not.toThrow();
  });

  it('detects core field changes on published postings', () => {
    const existing = {
      title: 'Engineer',
      job_type: 'internship',
      salary_min: 10000,
      salary_max: 20000,
      min_cgpa: 7,
      vacancies: 2,
      skills_required: ['Java'],
    };
    expect(
      publishedCoreFieldsChanged(existing, { title: 'Lead Engineer' }, ['Java']),
    ).toBe(true);
    expect(
      publishedCoreFieldsChanged(
        existing,
        { description: 'Updated notes only', additionalInfo: 'Parking provided' },
        ['Java'],
      ),
    ).toBe(false);
  });

  it('invalidateStudentOpportunityListCache clears cached student lists', () => {
    setStudentOpportunityListCache(['tenant-a'], 'internship', { items: [{ id: 'job-1' }] });
    expect(getStudentOpportunityListCache(['tenant-a'], 'internship')?.payload?.items).toHaveLength(1);
    invalidateStudentOpportunityListCache();
    expect(getStudentOpportunityListCache(['tenant-a'], 'internship')).toBeNull();
  });
});

describe('studentListedJobPostingSql', () => {
  it('filters on status = published', () => {
    expect(studentListedJobPostingSql('jp')).toBe("jp.status = 'published'");
    expect(studentListedJobPostingSql()).toContain("= 'published'");
  });
});
