'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { FileUp, Send } from 'lucide-react';
import { formatDate, formatCurrency, formatStatus, getStatusColor } from '@/lib/utils';
import { downloadCollegeOffersTemplate } from '@/lib/collegeOffersCsvTemplate';
import { COLLEGE_OFFERS_ALL_STUDENTS_CSV_FILENAME } from '@/lib/offersAssessmentStarterCsv';
import { downloadCsvFromApi } from '@/lib/downloadCsvFromApi';
import { useToast } from '@/components/ToastProvider';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load');
  return json;
};

const STATUS_OPTIONS = ['pending', 'accepted', 'rejected', 'expired', 'revoked'];

export default function CollegeOffersPage() {
  const { addToast } = useToast();
  const { data, error, isLoading, mutate } = useSWR('/api/college/offers', fetcher);
  const { data: studentsRaw } = useSWR('/api/college/students', fetcher);

  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const summary = data?.summary || { total: 0, accepted: 0, pending: 0, rejected: 0, avgSalary: 0 };
  const students = useMemo(
    () =>
      Array.isArray(studentsRaw)
        ? studentsRaw.map((s) => ({ id: s.id, label: `${s.name || '—'} (${s.roll || 'no roll'})` }))
        : [],
    [studentsRaw],
  );

  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [form, setForm] = useState({
    studentId: '',
    reportedCompanyName: '',
    jobTitle: '',
    salary: '',
    location: '',
    deadline: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  const editingRow = useMemo(() => offers.find((o) => o.id === editId), [offers, editId]);

  const resetForm = () => {
    setForm({
      studentId: '',
      reportedCompanyName: '',
      jobTitle: '',
      salary: '',
      location: '',
      deadline: '',
      status: 'pending',
    });
  };

  const downloadAssessmentStarter = async () => {
    try {
      await downloadCsvFromApi('/api/college/offers/assessment-starter', COLLEGE_OFFERS_ALL_STUDENTS_CSV_FILENAME);
      addToast('CSV lists all campus master-list students (company from newest assessment when present). Add job details, then upload.', 'success');
    } catch (err) {
      addToast(err.message || 'Download failed', 'error');
    }
  };

  const onUploadCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/college/offers/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      const { accepted, errors } = json;
      addToast(`Imported ${accepted} row(s).${errors?.length ? ` ${errors.length} issue(s) — see below.` : ''}`, accepted ? 'success' : 'warning');
      if (errors?.length) {
        console.warn('CSV import issues', errors);
        addToast(errors.slice(0, 3).map((x) => `Line ${x.line}: ${x.message}`).join(' · '), 'error');
      }
      await mutate();
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const submitAdd = async () => {
    if (!form.studentId || !form.reportedCompanyName.trim() || !form.jobTitle.trim()) {
      addToast('Student, company name, and job title are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/college/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          reportedCompanyName: form.reportedCompanyName.trim(),
          jobTitle: form.jobTitle.trim(),
          salary: Number(form.salary || 0),
          location: form.location.trim() || null,
          deadline: form.deadline || null,
          status: form.status,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Save failed');
      addToast('Offer added.', 'success');
      setShowAdd(false);
      resetForm();
      await mutate();
    } catch (err) {
      addToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      studentId: row.student_id || '',
      reportedCompanyName: row.company_name || '',
      jobTitle: row.job_title || '',
      salary: row.salary != null ? String(row.salary) : '',
      location: row.location || '',
      deadline: row.deadline ? String(row.deadline).slice(0, 10) : '',
      status: row.status || 'pending',
    });
  };

  const submitEdit = async () => {
    if (!editId) return;
    if (!form.reportedCompanyName.trim() || !form.jobTitle.trim()) {
      addToast('Company name and job title are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/college/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          reportedCompanyName: form.reportedCompanyName.trim(),
          jobTitle: form.jobTitle.trim(),
          salary: Number(form.salary || 0),
          location: form.location.trim() || null,
          deadline: form.deadline || null,
          status: form.status,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      addToast('Offer updated.', 'success');
      setEditId(null);
      resetForm();
      await mutate();
    } catch (err) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeOffer = async (id) => {
    if (!confirm('Delete this offer row?')) return;
    try {
      const res = await fetch('/api/college/offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      addToast('Offer removed.', 'success');
      await mutate();
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const closeModals = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setViewRow(null);
    resetForm();
  }, []);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {error && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--danger-300)', background: 'var(--danger-50)', padding: '1.25rem' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--danger-700)' }}>Could not load offers</p>
          <p className="text-sm" style={{ margin: '0.5rem 0 0', color: 'var(--danger-600)' }}>{error.message || 'Unknown error'}</p>
        </div>
      )}

      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Send size={28} /> Placement Offers
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Record offers — on-platform or via email. Import CSV or add manually.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={downloadCollegeOffersTemplate} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileUp size={16} /> Template
          </button>
          <button type="button" className="btn" onClick={downloadAssessmentStarter} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileUp size={16} /> All Students
          </button>
          <label className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', cursor: uploading ? 'wait' : 'pointer', margin: 0 }}>
            {uploading ? 'Importing…' : 'Upload CSV'}
            <input type="file" accept=".csv,text/csv" hidden disabled={uploading} onChange={onUploadCsv} />
          </label>
          <StandardTableIconAction
            action="add"
            variant="secondary"
            onClick={() => {
              resetForm();
              setShowAdd(true);
              setEditId(null);
            }}
            style={{
              background: 'white',
              color: 'var(--primary-800)',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
          Import offers from CSV
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1rem', lineHeight: 1.55 }}>
          Download the template, fill one row per offer (roll numbers must exist under <strong>Students</strong>), then upload. Same actions are in the page header.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={downloadCollegeOffersTemplate}>
            Blank template
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadAssessmentStarter}>
            Download Template (All students)
          </button>
          <label className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', margin: 0 }}>
            {uploading ? 'Importing…' : 'Choose CSV file to import'}
            <input type="file" accept=".csv,text/csv" hidden disabled={uploading} onChange={onUploadCsv} />
          </label>
        </div>
      </div>

      <div className="directive-panel" role="region" aria-label="Offer import rules" style={{ marginBottom: '1rem' }}>
        <p className="directive-panel__title">Validation (not tied to assessments)</p>
        <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
          Each row must match a student in your <strong>master student list</strong> (roll number on your Students screen). We do <strong>not</strong> require that the
          student appeared in employer assessment CSVs. Assessment outcomes are irrelevant for this screen — you can log offers even when everything happened over
          email. Optional <strong>status</strong> in CSV: pending, accepted, rejected, expired, revoked (defaults to pending).
        </p>
      </div>

      <div className="directive-panel" role="region" aria-label="Student acceptance" style={{ marginBottom: '1rem' }}>
        <p className="directive-panel__title">When students use the app</p>
        <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
          If the student signs in, they can accept or decline <strong>pending</strong> rows on <strong>My Offers</strong>; status then syncs here. You can also set
          status manually when you already know the outcome (e.g. accepted from email). To roll back a mistaken status, open <strong>Edit</strong>, set{' '}
          <strong>Status</strong> to <strong>pending</strong> again, and save — or use <strong>Delete</strong> to remove a row (an older revision may become current
          automatically).
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Offers', value: summary.total, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { label: 'Accepted', value: summary.accepted, color: 'var(--success-600)', bg: 'rgba(5,150,105,0.08)' },
          { label: 'Pending', value: summary.pending, color: 'var(--warning-600)', bg: 'rgba(217,119,6,0.08)' },
          { label: 'Rejected / Declined', value: summary.rejected ?? 0, color: 'var(--danger-600)', bg: 'rgba(220,38,38,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '0.5rem' }}>{value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Accepted Salary (INR)</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-600)' }}>{summary.avgSalary ? formatCurrency(summary.avgSalary) : '—'}</div>
      </div>

      {(showAdd || editId) && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{editId ? 'Edit offer' : 'Add offer'}</h3>
          {!editId && (
            <div className="form-group">
              <label className="form-label">Student (master list)</label>
              <select
                className="form-select"
                value={form.studentId}
                onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Company name (text)</label>
              <input
                className="form-input"
                value={form.reportedCompanyName}
                onChange={(e) => setForm((p) => ({ ...p, reportedCompanyName: e.target.value }))}
                placeholder="As shared with the student / email"
                disabled={Boolean(editId && editingRow?.linked_employer)}
              />
              {editId && editingRow?.linked_employer ? (
                <p className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>
                  Company comes from the employer account for this row; edit other fields as needed.
                </p>
              ) : null}
            </div>
            <div className="form-group">
              <label className="form-label">Role / job title</label>
              <input
                className="form-input"
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salary (INR annual)</label>
              <input
                className="form-input"
                type="number"
                value={form.salary}
                onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Response deadline</label>
              <input
                className="form-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {formatStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={editId ? submitEdit : submitAdd}>
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeModals}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>College</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Location</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="font-semibold">
                  {offer.student_name}
                  {offer.roll_number ? <div className="text-xs text-tertiary font-mono">{offer.roll_number}</div> : null}
                </td>
                <td>{offer.college_name || '—'}</td>
                <td>{offer.job_title || '—'}</td>
                <td>{offer.salary ? formatCurrency(Number(offer.salary)) : '—'}</td>
                <td>{offer.location || '—'}</td>
                <td>{offer.deadline ? formatDate(offer.deadline) : '—'}</td>
                <td>
                  <span className={`badge badge-${getStatusColor(offer.status)} badge-dot`}>{formatStatus(offer.status)}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <StandardTableIconAction action="view" onClick={() => setViewRow(offer)} />
                    <StandardTableIconAction
                      action="edit"
                      onClick={() => {
                        setShowAdd(false);
                        openEdit(offer);
                      }}
                    />
                    <StandardTableIconAction action="delete" variant="danger" onClick={() => removeOffer(offer.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && offers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-secondary">
                  {error?.message || 'No offers yet. Add manually or import CSV.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {viewRow && (
        <div
          className="card"
          style={{
            marginTop: '1rem',
            border: '1px solid var(--border)',
            position: 'sticky',
            bottom: '1rem',
            zIndex: 2,
          }}
        >
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <h3 className="card-title">Offer detail</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewRow(null)}>
              Close
            </button>
          </div>
          <div className="text-sm" style={{ lineHeight: 1.7 }}>
            <div>
              <strong>Student:</strong> {viewRow.student_name} ({viewRow.roll_number || '—'})
            </div>
            <div>
              <strong>College:</strong> {viewRow.college_name}
            </div>
            <div>
              <strong>Company:</strong> {viewRow.company_name || '—'}
            </div>
            <div>
              <strong>Role:</strong> {viewRow.job_title || '—'}
            </div>
            <div>
              <strong>Salary:</strong> {viewRow.salary ? formatCurrency(Number(viewRow.salary)) : '—'}
            </div>
            <div>
              <strong>Location:</strong> {viewRow.location || '—'}
            </div>
            <div>
              <strong>Deadline:</strong> {viewRow.deadline ? formatDate(viewRow.deadline) : '—'}
            </div>
            <div>
              <strong>Status:</strong> {formatStatus(viewRow.status)}
            </div>
            <div className="text-xs text-tertiary" style={{ marginTop: '0.5rem' }}>
              Linked employer account: {viewRow.linked_employer ? 'yes' : 'no (college-reported text company)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
