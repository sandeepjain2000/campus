'use client';

import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import ValidatedNumberInput from '@/components/form/ValidatedNumberInput';
import CurrencyAmountInput from '@/components/form/CurrencyAmountInput';
import { DriveFormSection, driveFormCompactField, driveFormFullRow } from '@/components/employer/DriveFormSection';
import { FIELD_IDS } from '@/lib/inputConstraints';
import { PLACEMENT_DRIVE_JOB_TYPE_LABELS } from '@/lib/placementDriveJobFields';

/**
 * Shared job/role/eligibility/compensation fields for placement drive request & edit forms.
 * @param {{ form: Record<string, string>; setForm: (fn: (p: Record<string, string>) => Record<string, string>) => void }} props
 */
export default function PlacementDriveJobFormSections({ form, setForm }) {
  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <>
      <DriveFormSection
        title="Role & openings"
        description="Campus role type, headcount, and skills — formerly captured on a linked job posting."
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Role type</label>
          <select
            className="form-select"
            value={form.jobType}
            onChange={(e) => setField('jobType', e.target.value)}
          >
            {Object.entries(PLACEMENT_DRIVE_JOB_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Openings</label>
          <ValidatedNumberInput
            fieldId={FIELD_IDS.EMPLOYER_VACANCIES}
            value={form.vacancies}
            onChange={(v) => setField('vacancies', v)}
            placeholder="10"
          />
          <span className="form-hint">Optional. Defaults to 100 if left blank.</span>
        </div>
        <div className="form-group" style={driveFormFullRow}>
          <label className="form-label">Skills (comma-separated)</label>
          <input
            className="form-input"
            value={form.skillsRequired}
            onChange={(e) => setField('skillsRequired', e.target.value)}
            placeholder="React, Python, SQL, System design"
          />
        </div>
        <div className="form-group" style={driveFormFullRow}>
          <label className="form-label">Work locations</label>
          <input
            className="form-input"
            value={form.locations}
            onChange={(e) => setField('locations', e.target.value)}
            placeholder="Bangalore, Hyderabad — or leave blank"
          />
          <span className="form-hint">Where hired students will work (separate from drive venue).</span>
        </div>
      </DriveFormSection>

      <DriveFormSection
        title="Job description"
        description="Role summary, responsibilities, and expectations. Shown to students and the placement office once approved."
      >
        <div className="form-group" style={driveFormFullRow}>
          <label className="form-label">Job description</label>
          <textarea
            className="form-textarea"
            rows={6}
            value={form.jobDescription}
            onChange={(e) => setField('jobDescription', e.target.value)}
            placeholder="Describe the role, responsibilities, tech stack, and what you expect from candidates…"
          />
        </div>
        <div className="form-group" style={driveFormFullRow}>
          <label className="form-label">Additional information for students</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={form.additionalInfo}
            onChange={(e) => setField('additionalInfo', e.target.value)}
            placeholder="PPO hint, bond terms summary, or other details students should know"
          />
        </div>
      </DriveFormSection>

      <DriveFormSection
        title="Eligibility"
        description="Criteria for student registration. Enforced when students apply."
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Minimum CGPA</label>
          <ValidatedNumberInput
            fieldId={FIELD_IDS.EMPLOYER_MIN_CGPA}
            step="0.1"
            value={form.minCgpa}
            onChange={(v) => setField('minCgpa', v)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Eligible branches</label>
          <input
            className="form-input"
            value={form.eligibleBranches}
            onChange={(e) => setField('eligibleBranches', e.target.value)}
            placeholder="CSE, ECE, IT — or All for every branch"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Max active backlogs</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="1"
            placeholder="Leave blank for no limit"
            value={form.maxBacklogs}
            onChange={(e) => setField('maxBacklogs', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Batch year</label>
          <input
            className="form-input"
            type="number"
            min="2000"
            max="2100"
            step="1"
            placeholder="e.g. 2025"
            value={form.batchYear}
            onChange={(e) => setField('batchYear', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Min 10th %</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="60"
            value={form.minTenthPct}
            onChange={(e) => setField('minTenthPct', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Min 12th %</label>
          <input
            className="form-input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="60"
            value={form.minTwelfthPct}
            onChange={(e) => setField('minTwelfthPct', e.target.value)}
          />
        </div>
        <div className="form-group" style={driveFormCompactField}>
          <label className="form-label">Application deadline</label>
          <ValidatedDateInput
            fieldId={FIELD_IDS.EMPLOYER_DRIVE_DATE}
            value={form.applicationDeadline ? form.applicationDeadline.slice(0, 10) : ''}
            onChange={(v) => setField('applicationDeadline', v ? `${v}T23:59:59` : '')}
          />
          <span className="form-hint">Optional. Students cannot apply after this date.</span>
        </div>
      </DriveFormSection>

      <DriveFormSection
        title="Compensation"
        description="CTC band is shown to students. Internal breakup is for your records only."
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Min CTC (annual INR)</label>
          <CurrencyAmountInput
            fieldId={FIELD_IDS.EMPLOYER_SALARY_MIN}
            value={form.salaryMin}
            onChange={(v) => setField('salaryMin', v)}
            placeholder="800000"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Max CTC (annual INR)</label>
          <CurrencyAmountInput
            fieldId={FIELD_IDS.EMPLOYER_SALARY_MAX}
            context={{ salaryMin: form.salaryMin }}
            value={form.salaryMax}
            onChange={(v) => setField('salaryMax', v)}
            placeholder="1500000"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Offered CTC (internal record, optional)</label>
          <CurrencyAmountInput
            fieldId={FIELD_IDS.EMPLOYER_SALARY_MIN}
            value={form.packageCtc}
            onChange={(v) => setField('packageCtc', v)}
            placeholder="1200000"
          />
        </div>
        <div className="form-group" style={driveFormFullRow}>
          <label className="form-label">CTC breakup details (internal)</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={form.ctcBreakup}
            onChange={(e) => setField('ctcBreakup', e.target.value)}
            placeholder="Fixed + variable split, joining bonus, RSUs — not shown on the college dashboard"
          />
        </div>
      </DriveFormSection>
    </>
  );
}
