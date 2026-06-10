'use client';

import { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { FileUp, RotateCcw, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { formatDate, formatCurrency, formatStatus, getStatusColor } from '@/lib/utils';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { EMPLOYER_OFFERS_ALL_STUDENTS_CSV_FILENAME } from '@/lib/offersAssessmentStarterCsv';
import { downloadCsvFromApi } from '@/lib/downloadCsvFromApi';
import { useToast } from '@/components/ToastProvider';
import ValidatedNumberInput from '@/components/form/ValidatedNumberInput';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { FIELD_IDS } from '@/lib/inputConstraints';
import { validateEmployerOfferPayload } from '@/lib/apiInputValidation';
import EmployerListFormLayout from '@/components/employer/EmployerListFormLayout';

const emptyOfferForm = {
  studentId: '',
  driveId: '',
  jobTitle: '',
  salary: '',
  location: '',
  joiningDate: '',
  deadlineAt: '',
};

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
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');
  const [editId, setEditId] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [form, setForm] = useState(emptyOfferForm);
  const [editForm, setEditForm] = useState({
    driveId: '',
    jobTitle: '',
    salary: '',
    location: '',
    joiningDate: '',
    deadlineAt: '',
  });

  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const students = Array.isArray(optionsData?.students) ? optionsData.students : [];
  const drives = Array.isArray(optionsData?.drives) ? optionsData.drives : [];

  const filteredOffers = useMemo(() => {
    const result = offers.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = [o.student_name, o.college_name, o.job_title, o.location].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortOption === 'date_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortOption === 'date_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortOption === 'salary_desc') return (Number(b.salary) || 0) - (Number(a.salary) || 0);
      if (sortOption === 'name_asc') return (a.student_name || '').localeCompare(b.student_name || '');
      return 0;
    });
  }, [offers, search, statusFilter, sortOption]);

  const submitCreateOffer = async () => {
    if (!form.studentId || !form.jobTitle.trim()) {
      addToast('Student and job title are required.', 'warning');
      return;
    }
    const offerErr = validateEmployerOfferPayload({
      salary: form.salary,
      deadline: form.deadlineAt,
      joiningDate: form.joiningDate,
    });
    if (offerErr) {
      addToast(offerErr, 'warning');
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
      setForm(emptyOfferForm);
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

  const reopenOffer = async (id) => {
    if (!confirm('Reopen this offer as pending? Clears acceptance / decline timestamps so the student can respond again.')) {
      return;
    }
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to reopen offer');
      await mutate();
      addToast('Offer set back to pending.', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to reopen offer', 'error');
    }
  };

  const openEdit = (offer) => {
    setEditId(offer.id);
    setShowCreate(false);
    setViewRow(null);
    setEditForm({
      driveId: offer.drive_id || '',
      jobTitle: offer.job_title || '',
      salary: offer.salary != null ? String(offer.salary) : '',
      location: offer.location || '',
      joiningDate: offer.joining_date ? String(offer.joining_date).slice(0, 10) : '',
      deadlineAt: offer.deadline_at ? String(offer.deadline_at).slice(0, 10) : '',
    });
  };

  const submitEditOffer = async () => {
    if (!editId) return;
    const offerErr = validateEmployerOfferPayload({
      salary: editForm.salary,
      deadline: editForm.deadlineAt,
      joiningDate: editForm.joiningDate,
    });
    if (offerErr) {
      addToast(offerErr, 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          driveId: editForm.driveId || null,
          jobTitle: editForm.jobTitle.trim(),
          salary: Number(editForm.salary || 0),
          location: editForm.location.trim() || null,
          joiningDate: editForm.joiningDate || null,
          deadlineAt: editForm.deadlineAt ? new Date(`${editForm.deadlineAt}T23:59:59`).toISOString() : null,
          syncReportedCompanyFromProfile: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to update offer');
      setEditId(null);
      await mutate();
      addToast('Offer updated.', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to update offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer row permanently?')) return;
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to delete offer');
      if (editId === id) setEditId(null);
      if (viewRow?.id === id) setViewRow(null);
      await mutate();
      addToast('Offer removed.', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to delete offer', 'error');
    }
  };

  const downloadAssessmentStarter = async () => {
    try {
      await downloadCsvFromApi('/api/employer/offers/assessment-starter', EMPLOYER_OFFERS_ALL_STUDENTS_CSV_FILENAME);
      addToast('CSV lists all master-list students on every approved campus. Add job titles, then import.', 'success');
    } catch (e) {
      addToast(e.message || 'Download failed', 'error');
    }
  };

  const getOffersCsv = useCallback((_scope) => {
    const list = _scope === 'current' ? filteredOffers : offers;
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
  }, [offers, filteredOffers]);

  if (isLoading) {
    return <div className="skeleton skeleton-card" style={{ height: 260, margin: '2rem' }} />;
  }

  if (error) {
    return (
      <div className="animate-fadeIn" style={{ padding: '2rem', color: 'var(--danger-600)' }}>
        <p>{error.message || 'Could not load offers.'}</p>
        <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>
          Confirm you are signed in as an employer, then reload or contact support if this continues.
        </p>
      </div>
    );
  }

  const acceptedCount = offers.filter((offer) => offer.status === 'accepted').length;
  const pendingCount = offers.filter((offer) => offer.status === 'pending').length;
  const declinedCount = offers.filter((offer) => ['rejected', 'declined'].includes(offer.status)).length;

  const closeCreateForm = () => {
    setShowCreate(false);
    setForm(emptyOfferForm);
  };

  const closeEditForm = () => setEditId(null);

  if (showCreate) {
    return (
      <EmployerListFormLayout
        title="Create offer"
        subtitle="Creates a pending offer the student can accept or decline on My Offers."
        onBack={closeCreateForm}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" disabled={submitting} onClick={closeCreateForm}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submitCreateOffer} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Offer'}
            </button>
          </div>
        }
      >
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
            <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_OFFER_SALARY} value={form.salary} onChange={(v) => setForm((p) => ({ ...p, salary: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Joining date</label>
            <ValidatedDateInput fieldId={FIELD_IDS.EMPLOYER_OFFER_JOINING} context={{ deadline: form.deadlineAt }} value={form.joiningDate} onChange={(v) => setForm((p) => ({ ...p, joiningDate: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Response deadline</label>
            <ValidatedDateInput fieldId={FIELD_IDS.EMPLOYER_OFFER_DEADLINE} value={form.deadlineAt} onChange={(v) => setForm((p) => ({ ...p, deadlineAt: v }))} />
          </div>
        </div>
      </EmployerListFormLayout>
    );
  }

  if (editId) {
    return (
      <EmployerListFormLayout
        title="Edit offer"
        subtitle="Updates terms for this row. Use Reopen to pending on the list to roll back status."
        onBack={closeEditForm}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={submitEditOffer} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeEditForm} disabled={submitting}>
              Cancel
            </button>
          </div>
        }
      >
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Drive (optional)</label>
            <select className="form-select" value={editForm.driveId} onChange={(e) => setEditForm((p) => ({ ...p, driveId: e.target.value }))}>
              <option value="">Not linked</option>
              {drives.map((d) => (
                <option key={d.id} value={d.id}>{d.title} {d.drive_date ? `(${formatDate(d.drive_date)})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Job title</label>
            <input className="form-input" value={editForm.jobTitle} onChange={(e) => setEditForm((p) => ({ ...p, jobTitle: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Salary (INR annual)</label>
            <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_OFFER_SALARY} value={editForm.salary} onChange={(v) => setEditForm((p) => ({ ...p, salary: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Joining date</label>
            <ValidatedDateInput fieldId={FIELD_IDS.EMPLOYER_OFFER_JOINING} context={{ deadline: editForm.deadlineAt }} value={editForm.joiningDate} onChange={(v) => setEditForm((p) => ({ ...p, joiningDate: v }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Response deadline</label>
            <ValidatedDateInput fieldId={FIELD_IDS.EMPLOYER_OFFER_DEADLINE} value={editForm.deadlineAt} onChange={(v) => setEditForm((p) => ({ ...p, deadlineAt: v }))} />
          </div>
        </div>
      </EmployerListFormLayout>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileUp size={22} strokeWidth={1.75} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
            Offers
          </h1>
          <p className="text-secondary" style={{ margin: '0.25rem 0 0', lineHeight: 1.55 }}>
            Manage offers extended to candidates. CSV import defaults to <strong>accepted</strong>. Use{' '}
            <strong>Create Offer</strong> for <strong>pending</strong> rows students accept on <strong>My Offers</strong>.{' '}
            <Link href="/dashboard/employer/offers-upload" className="link-inline" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              <FileUp size={14} style={{ verticalAlign: '-0.125em', marginRight: '0.2rem' }} aria-hidden />
              Import offers from CSV
            </Link>
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={downloadAssessmentStarter}>
            Download Template
          </button>
          <ExportCsvSplitButton
            filenameBase="placement_offers"
            currentCount={filteredOffers.length}
            fullCount={offers.length}
            getRows={getOffersCsv}
          />
          <StandardTableIconAction
            action="add"
            variant="primary"
            onClick={() => {
              setShowCreate(true);
              setEditId(null);
            }}
          />
        </div>
      </div>

      <div className="directive-panel" role="region" aria-label="Offer acceptance">
        <p className="directive-panel__title">Pending vs accepted</p>
        <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
          <strong>Pending</strong> — created here (or <code>status=pending</code> in CSV); students <strong>accept or decline</strong>{' '}
          on <strong>Dashboard → My Offers</strong>. <strong>Accepted</strong> — use CSV import (default) when the hire is already confirmed outside the app.
        </p>
      </div>

      <div className="directive-panel" role="region" aria-label="One row per student">
        <p className="directive-panel__title">Why several rows can look the same</p>
        <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
          Each row is <strong>one student</strong>. If five students received the same package, you will see <strong>five lines</strong> — that is expected.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stats-card green">
          <div className="stats-card-icon green"><CheckCircle size={22} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{acceptedCount}</div>
          <div className="stats-card-label">Accepted</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-icon amber"><Clock size={22} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{pendingCount}</div>
          <div className="stats-card-label">Pending</div>
        </div>
        <div className="stats-card rose">
          <div className="stats-card-icon rose"><XCircle size={22} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{declinedCount}</div>
          <div className="stats-card-label">Declined</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            placeholder="Search student, college, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="rejected">Rejected</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
        <select className="form-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="salary_desc">Highest Salary</option>
          <option value="name_asc">Name (A-Z)</option>
        </select>
        <span className="text-sm text-secondary">{filteredOffers.length} of {offers.length} offers</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>College</th><th>Role</th><th>Salary</th><th>Location</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredOffers.length > 0 ? (
              filteredOffers.map(offer => (
                <tr key={offer.id}>
                  <td className="font-semibold">{offer.student_name || '—'}</td>
                  <td className="text-sm">{offer.college_name || '—'}</td>
                  <td>{offer.job_title || '—'}</td>
                  <td className="font-bold">{formatCurrency(Number(offer.salary) || 0)}</td>
                  <td>{offer.location || '—'}</td>
                  <td className="text-sm">{offer.deadline_at ? formatDate(offer.deadline_at) : '—'}</td>
                  <td><span className={`badge badge-${getStatusColor(offer.status)} badge-dot`}>{formatStatus(offer.status || 'unknown')}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                      <StandardTableIconAction
                        action="view"
                        showLabel={false}
                        onClick={() => {
                          setViewRow(offer);
                        }}
                      />
                      <StandardTableIconAction
                        action="edit"
                        showLabel={false}
                        onClick={() => openEdit(offer)}
                      />
                      {['accepted', 'rejected', 'revoked', 'expired'].includes(offer.status) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Restore pending offer"
                          aria-label="Restore pending offer"
                          onClick={() => reopenOffer(offer.id)}
                        >
                          <RotateCcw size={16} strokeWidth={2} aria-hidden />
                        </button>
                      )}
                      {offer.status === 'pending' && (
                        <StandardTableIconAction
                          action="archive"
                          variant="danger"
                          showLabel={false}
                          onClick={() => revokeOffer(offer.id)}
                        />
                      )}
                      <StandardTableIconAction
                        action="delete"
                        variant="danger"
                        showLabel={false}
                        onClick={() => deleteOffer(offer.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
            {offers.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '3rem 1rem' }}>
                  <div className="empty-state-container" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ background: 'var(--primary-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <FileUp size={32} className="text-primary-600" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No offers uploaded yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                      Download the template, fill in the details, and import your first batch of offers.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <button type="button" className="btn btn-secondary" onClick={downloadAssessmentStarter}>
                        Download Template
                      </button>
                      <Link href="/dashboard/employer/offers-upload" className="btn btn-primary">
                        Import CSV
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewRow && (
        <div className="card" style={{ marginTop: '1rem', border: '1px solid var(--border)', position: 'sticky', bottom: '1rem', zIndex: 2 }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <h3 className="card-title">Offer detail</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewRow(null)}>Close</button>
          </div>
          <div className="text-sm" style={{ lineHeight: 1.7 }}>
            <div><strong>Student:</strong> {viewRow.student_name}</div>
            <div><strong>College:</strong> {viewRow.college_name || '—'}</div>
            <div><strong>Role:</strong> {viewRow.job_title || '—'}</div>
            <div><strong>Salary:</strong> {formatCurrency(Number(viewRow.salary) || 0)}</div>
            <div><strong>Location:</strong> {viewRow.location || '—'}</div>
            <div><strong>Joining:</strong> {viewRow.joining_date ? formatDate(viewRow.joining_date) : '—'}</div>
            <div><strong>Deadline:</strong> {viewRow.deadline_at ? formatDate(viewRow.deadline_at) : '—'}</div>
            <div><strong>Status:</strong> {formatStatus(viewRow.status)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
