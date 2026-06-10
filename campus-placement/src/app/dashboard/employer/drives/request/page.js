'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Target } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { validateEmployerDriveDate } from '@/lib/apiInputValidation';
import { buildDriveCtcBreakup } from '@/lib/amountInWords';
import { FIELD_IDS, validateFieldOrError } from '@/lib/inputConstraints';
import { parsePlacementDriveJobPayload, emptyPlacementDriveForm, placementDriveFormToApiBody } from '@/lib/placementDriveJobFields';
import { formatCurrency } from '@/lib/utils';
import { DriveFormSection, driveFormCompactField, driveFormFullRow } from '@/components/employer/DriveFormSection';
import PlacementDriveJobFormSections from '@/components/employer/PlacementDriveJobFormSections';
import { useEmployerPostingCampuses } from '@/hooks/useEmployerPostingCampuses';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function EmployerRequestDrivePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [campusId, setCampusId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyPlacementDriveForm);

  const { data: campusData } = useSWR('/api/employer/campuses', fetcher, { revalidateOnFocus: false });
  const approvedCampuses = useEmployerPostingCampuses(campusData, 'drives');

  const submitDrive = useCallback(async (e) => {
    e.preventDefault();
    if (!campusId) {
      addToast('Select a campus for this drive.', 'warning');
      return;
    }
    const titleErr = validateFieldOrError(FIELD_IDS.COMMON_TITLE, form.title, { label: 'Drive title' });
    if (titleErr) {
      addToast(titleErr, 'error');
      return;
    }
    const driveDateErr = validateEmployerDriveDate(form.driveDate);
    if (driveDateErr) {
      addToast(driveDateErr, 'warning');
      return;
    }
    const ctcBreakup = buildDriveCtcBreakup(form.packageCtc, form.ctcBreakup, formatCurrency);
    const apiBody = placementDriveFormToApiBody(form, { ctcBreakup });
    const jobParsed = parsePlacementDriveJobPayload(apiBody);
    if (jobParsed.error) {
      addToast(jobParsed.error, 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: campusId, ...apiBody }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.userMessage || json.error || 'Request failed', 'error');
        return;
      }
      addToast('Drive saved. College admins were notified.', 'success');
      router.push('/dashboard/employer/drives');
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [campusId, form, addToast, router]);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            href="/dashboard/employer/drives"
            className="btn btn-ghost btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: '0.75rem',
              paddingLeft: 0,
            }}
          >
            <ArrowLeft size={16} />
            Back to Placement Drives
          </Link>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.35rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'flex',
                padding: '0.35rem',
                background: 'var(--primary-50)',
                borderRadius: '8px',
                color: 'var(--primary-600)',
              }}
            >
              <Target size={22} />
            </span>
            Request placement drive
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Submit a drive request with full role details — no separate job posting required. The placement office will review before students can register.
          </p>
        </div>
      </div>

      {approvedCampuses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-default)',
            background: 'var(--bg-secondary)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            You need at least one approved campus partnership before requesting a drive.
          </p>
          <Link href="/dashboard/employer/select-campus" className="btn btn-primary">
            Find campus partners
          </Link>
        </div>
      ) : (
        <form onSubmit={submitDrive} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
          <DriveFormSection
            title="Drive details"
            description="Campus, schedule, and logistics for this placement drive request."
            first
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Campus <span style={{ color: 'red' }}>*</span></label>
              <select
                className="form-select"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
              >
                <option value="">— Select a campus —</option>
                {approvedCampuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="form-hint">Only approved campus partnerships are shown.</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Drive title <span style={{ color: 'red' }}>*</span></label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. SDE — Phase 2"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Drive type</label>
              <select
                className="form-select"
                value={form.driveType}
                onChange={(e) => setForm((p) => ({ ...p, driveType: e.target.value }))}
              >
                <option value="on_campus">On campus</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
                <option value="off_campus">Off campus</option>
              </select>
            </div>
            <div className="form-group" style={driveFormCompactField}>
              <label className="form-label">Drive Date <span style={{ color: 'red' }}>*</span></label>
              <ValidatedDateInput
                fieldId={FIELD_IDS.EMPLOYER_DRIVE_DATE}
                value={form.driveDate}
                onChange={(v) => setForm((p) => ({ ...p, driveDate: v }))}
              />
            </div>
            <div className="form-group" style={driveFormFullRow}>
              <label className="form-label">Venue</label>
              <input
                className="form-input"
                value={form.venue}
                onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                placeholder="Venue (optional — add when known)"
              />
            </div>
            <div className="form-group" style={driveFormFullRow}>
              <label className="form-label">Notes for placement office</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.placementNotes}
                onChange={(e) => setForm((p) => ({ ...p, placementNotes: e.target.value }))}
                placeholder="Scheduling constraints, contact person, or internal context for the TPO team"
              />
              <span className="form-hint">Optional. For the placement office when reviewing your request — not shown to students.</span>
            </div>
          </DriveFormSection>

          <PlacementDriveJobFormSections form={form} setForm={setForm} />

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Submit request'}
            </button>
            <Link href="/dashboard/employer/drives" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
