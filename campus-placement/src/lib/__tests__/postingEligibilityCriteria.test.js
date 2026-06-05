const {
  evaluateBacklogEligibility,
  evaluateBatchYearEligibility,
  evaluateBranchEligibility,
  evaluateApplicationDeadlineEligibility,
} = require('../postingEligibilityCriteria');

describe('postingEligibilityCriteria', () => {
  it('blocks when backlogs exceed max', () => {
    expect(evaluateBacklogEligibility(2, 3).eligible).toBe(false);
  });

  it('allows when backlogs within max', () => {
    expect(evaluateBacklogEligibility(2, 1).eligible).toBe(true);
  });

  it('blocks when batch year mismatches', () => {
    expect(evaluateBatchYearEligibility(2025, 2024).eligible).toBe(false);
  });

  it('blocks when branch not in list', () => {
    const r = evaluateBranchEligibility(['CSE'], 'ECE', '');
    expect(r.eligible).toBe(false);
  });

  it('allows all-branches sentinel', () => {
    expect(evaluateBranchEligibility(['All'], 'ECE', '').eligible).toBe(true);
  });

  it('blocks after application deadline', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(evaluateApplicationDeadlineEligibility(past.toISOString()).eligible).toBe(false);
  });
});
