'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { validateEmployerDriveDate } from '@/lib/apiInputValidation';
import { FIELD_IDS } from '@/lib/inputConstraints';
import PageLoading from '@/components/PageLoading';
import { formatStatus } from '@/lib/utils';

const fetcher = (url) => fetch(url).then((r) => r.json());

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function EmployerEditDrivePage() {
  const router = useRouter();
  const params = useParams();
  const driveId = params?.id;
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    driveType: 'on_campus',
    driveDate: '',
    venue: '',
    description: '',
    ctcBreakup: '',
  });

  const { data, error, isLoading } = useSWR(
    driveId ? `/api/employer/drives/${driveId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const drive = data?.drive;

  useEffect(() => {
    if (!drive) return;
    setForm({
      title: drive.role || '',
      driveType: drive.type || 'on_campus',
      driveDate: toDateInputValue(drive.date),
      venue: drive.venue || '',
      description: drive.description || '',
      ctcBreakup: drive.ctc_breakup || '',
    });
  }, [drive]);

  const saveDrive = useCallback(async (e) => {
    e.preventDefault();
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
      const res = await fetch(`/api/employer/drives/${driveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        addToast(json.error || 'Update failed', 'error');
        return;
      }
      addToast('Drive updated. The campus was notified.', 'success');
      router.push('/dashboard/employer/drives');
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [driveId, form, addToast, router]);

  if (isLoading) {
    return <PageLoading message="Loading drive details…" />;
  }

  if (error || !drive) {
    return (
      <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
        <Link href="/dashboard/employer/drives" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to Placement Drives
        </Link>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {error?.message || 'This drive could not be loaded.'}
          </p>
          <Link href="/dashboard/employer/drives" className="btn btn-secondary">Return to drives</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/dashboard/employer/drives"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', paddingLeft: 0 }}
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
            <Pencil size={22} />
          </span>
          Edit placement drive
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: 560 }}>
          Update drive details for <strong>{drive.college}</strong>. Campus cannot be changed after submission.
          {drive.status ? ` Current status: ${formatStatus(drive.status)}.` : ''}
        </p>
      </div>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 720 }}>
        <form onSubmit={saveDrive} style={{ display: 'grid', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Campus</label>
            <input className="form-input" value={drive.college || ''} readOnly disabled />
            <span className="form-hint">Campus is fixed for this drive request.</span>
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
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <Link href="/dashboard/employer/drives" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
