'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { formatDate, formatCurrency, formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load offers');
  return data;
};

export default function EmployerOffersPage() {
  const { addToast } = useToast();
  const { data, error, isLoading, mutate } = useSWR('/api/employer/offers', fetcher);
  const { data: optionsData } = useSWR('/api/employer/offers/options', fetcher);
  const offers = data?.offers || [];
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    driveId: '',
    jobTitle: '',
    salary: '',
    location: '',
    joiningDate: '',
    deadlineAt: '',
  });

  const showNotReady = (label) => {
    addToast(`${label} is not available yet in this build.`, 'info');
  };

  const students = Array.isArray(optionsData?.students) ? optionsData.students : [];
  const drives = Array.isArray(optionsData?.drives) ? optionsData.drives : [];

  const submitCreateOffer = async () => {
    if (!form.studentId || !form.jobTitle.trim()) {
      addToast('Student and job title are required.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salary: Number(form.salary || 0),
          deadlineAt: form.deadlineAt ? new Date(`${form.deadlineAt}T23:59:59`).toISOString() : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to create offer');
      setShowCreate(false);
      setForm({ studentId: '', driveId: '', jobTitle: '', salary: '', location: '', joiningDate: '', deadlineAt: '' });
      await mutate();
      addToast('Offer created successfully.', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to create offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeOffer = async (id) => {
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'revoked' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to revoke offer');
      await mutate();
      addToast('Offer revoked.', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to revoke offer', 'error');
    }
  };

  const getOffersCsv = useCallback((_scope) => {
    const list = offers;
    const headers = ['Student', 'College', 'Role', 'Salary_INR', 'Salary_display', 'Location', 'Deadline', 'Status', 'Created'];
    const rows = list.map((o) => [
      o.student_name || '—',
      o.college_name || '—',
      o.job_title || '—',
      String(Number(o.salary) || 0),
      formatCurrency(Number(o.salary) || 0),
      o.location || '—',
      o.deadline_at || '',
      o.status || '',
      o.created_at || '',
    ]);
    return { headers, rows };
  }, [offers]);

  if (isLoading) {
    return <div className="skeleton skeleton-card" style={{ height: 260, margin: '2rem' }} />;
  }

  if (error) {
    return (
      <div className="animate-fadeIn" style={{ padding: '2rem', color: 'var(--danger-600)' }}>
        <p>{error.message || 'Could not load offers.'}</p>
        <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>
          Check employer login and database connectivity, then reload.
        </p>
      </div>
    );
  }

  const acceptedCount = offers.filter((offer) => offer.status === 'accepted').length;
  const pendingCount = offers.filter((offer) => offer.status === 'pending').length;
  const declinedCount = offers.filter((offer) => ['rejected', 'declined'].includes(offer.status)).length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📨 Offers</h1>
          <p>Manage offers extended to candidates</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase="placement_offers"
            currentCount={offers.length}
            fullCount={offers.length}
            getRows={getOffersCsv}
          />
          <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Close Form' : '+ Create Offer'}</button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Student</label>
              <select className="form-select" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.collegeName ? ` — ${s.collegeName}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Drive (optional)</label>
              <select className="form-select" value={form.driveId} onChange={(e) => setForm((p) => ({ ...p, driveId: e.target.value }))}>
                <option value="">Not linked</option>
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>{d.title} {d.drive_date ? `(${formatDate(d.drive_date)})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job title</label>
              <input className="form-input" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Salary (INR annual)</label>
              <input className="form-input" type="number" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Joining date</label>
              <input className="form-input" type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Response deadline</label>
              <input className="form-input" type="date" value={form.deadlineAt} onChange={(e) => setForm((p) => ({ ...p, deadlineAt: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button className="btn btn-primary" onClick={submitCreateOffer} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stats-card green"><div className="stats-card-icon green">✅</div><div className="stats-card-value">{acceptedCount}</div><div className="stats-card-label">Accepted</div></div>
        <div className="stats-card amber"><div className="stats-card-icon amber">⏳</div><div className="stats-card-value">{pendingCount}</div><div className="stats-card-label">Pending</div></div>
        <div className="stats-card rose"><div className="stats-card-icon rose">❌</div><div className="stats-card-value">{declinedCount}</div><div className="stats-card-label">Declined</div></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>College</th><th>Role</th><th>Salary</th><th>Location</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {offers.map(offer => (
              <tr key={offer.id}>
                <td className="font-semibold">{offer.student_name || '—'}</td>
                <td className="text-sm">{offer.college_name || '—'}</td>
                <td>{offer.job_title || '—'}</td>
                <td className="font-bold">{formatCurrency(Number(offer.salary) || 0)}</td>
                <td>{offer.location || '—'}</td>
                <td className="text-sm">{offer.deadline_at ? formatDate(offer.deadline_at) : '—'}</td>
                <td><span className={`badge badge-${getStatusColor(offer.status)} badge-dot`}>{formatStatus(offer.status || 'unknown')}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => showNotReady('View offer')}>View</button>
                    {offer.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => revokeOffer(offer.id)}>Revoke</button>}
                  </div>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No offers found for your employer account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
