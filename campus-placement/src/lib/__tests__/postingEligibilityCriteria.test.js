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

  it('does not block on branch text while matching is disabled', () => {
    expect(evaluateBranchEligibility(['CSE'], 'ECE', '').eligible).toBe(true);
    expect(evaluateBranchEligibility(['Computer Science & Engineering'], 'CSE', '').eligible).toBe(true);
  });

  it('blocks after application deadline', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(evaluateApplicationDeadlineEligibility(past.toISOString()).eligible).toBe(false);
  });
});
