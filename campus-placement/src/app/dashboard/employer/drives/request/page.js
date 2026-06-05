'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Target } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { validateEmployerDriveDate } from '@/lib/apiInputValidation';
import { FIELD_IDS } from '@/lib/inputConstraints';

const fetcher = (url) => fetch(url).then((r) => r.json());

const emptyForm = {
  title: '',
  driveType: 'on_campus',
  driveDate: '',
  venue: '',
  description: '',
  ctcBreakup: '',
};

export default function EmployerRequestDrivePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [campusId, setCampusId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: campusData } = useSWR('/api/employer/campuses', fetcher, { revalidateOnFocus: false });
  const approvedCampuses = (campusData?.colleges || []).filter((c) => c.approval_status === 'approved');

  const submitDrive = useCallback(async (e) => {
    e.preventDefault();
    if (!campusId) {
      addToast('Select a campus for this drive.', 'warning');
      return;
    }
    if (!form.title.trim()) {
      addToast('Drive title is required', 'error');
      return;
    }
    const driveDateErr = validateEmployerDriveDate(form.driveDate);
    if (driveDateErr) {
      addToast(driveDateErr, 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: campusId,
          title: form.title.trim(),
          description: form.description,
          driveType: form.driveType,
          driveDate: form.driveDate || null,
          venue: form.venue,
          ctcBreakup: form.ctcBreakup,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error || 'Request failed', 'error');
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
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: 560 }}>
            Submit a drive request to an approved campus partner. The placement office will review and approve before students can register.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 720 }}>
        {approvedCampuses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You need at least one approved campus partnership before requesting a drive.
            </p>
            <Link href="/dashboard/employer/select-campus" className="btn btn-primary">
              Find campus partners
            </Link>
          </div>
        ) : (
          <form onSubmit={submitDrive} style={{ display: 'grid', gap: '0.75rem' }}>
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Drive Date <span style={{ color: 'red' }}>*</span></label>
              <ValidatedDateInput
                fieldId={FIELD_IDS.EMPLOYER_DRIVE_DATE}
                value={form.driveDate}
                onChange={(v) => setForm((p) => ({ ...p, driveDate: v }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Venue</label>
              <input
                className="form-input"
                value={form.venue}
                onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                placeholder="Venue (optional — add when known)"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes for placement office</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CTC breakup (optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.ctcBreakup}
                onChange={(e) => setForm((p) => ({ ...p, ctcBreakup: e.target.value }))}
                placeholder="e.g. fixed + variable split, joining bonus, RSUs — for your records only"
              />
              <span className="form-hint">Stored on this drive for your team. Not shown on the college dashboard.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
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
    </div>
  );
}
