'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import TagPicker from '@/components/TagPicker';

export const ADD_STUDENT_DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Biotechnology', 'Mathematics', 'Physics', 'Data Science',
  'Information Technology', 'Electronics & Communication', 'Other',
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const STATUSES = [
  { value: 'unplaced', label: 'Unplaced' },
  { value: 'placed', label: 'Placed' },
  { value: 'opted_out', label: 'Opted Out' },
  { value: 'higher_studies', label: 'Higher Studies' },
];

const initialForm = () => ({
  name: '',
  email: '',
  roll_number: '',
  department: '',
  branch: '',
  gender: '',
  category: 'General',
  cgpa: '',
  placement_status: 'unplaced',
  skills: [],
});

/**
 * Shared add-student form (POST /api/college/students).
 * @param {{ active: boolean, onSuccess: (json: object) => void, onCancel: () => void, bodyPadding?: string }} props
 */
export default function AddStudentForm({ active, onSuccess, onCancel, bodyPadding = '1.5rem' }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    if (active) {
      setForm(initialForm());
      setErrors({});
      setServerError('');
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [active]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format.';
    if (!form.roll_number.trim()) e.roll_number = 'Roll No is required.';
    if (!form.department.trim()) e.department = 'Department is required.';
    if (form.cgpa && (Number.isNaN(Number(form.cgpa)) || Number(form.cgpa) < 0 || Number(form.cgpa) > 10)) {
      e.cgpa = 'CGPA must be between 0 and 10.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/college/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Failed to add student.');
        return;
      }
      onSuccess(json);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: bodyPadding }}>
        {serverError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
            padding: '0.875rem 1rem', marginBottom: '1.25rem', color: '#dc2626',
            fontSize: '0.875rem', fontWeight: 500,
          }}
          >
            {serverError}
          </div>
        )}

        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem' }}>
          <legend style={{
            fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
          }}
          >
            Identity (Primary Fields)
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name *</label>
              <input
                ref={nameRef}
                className={`form-input${errors.name ? ' input-error' : ''}`}
                type="text"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Roll No *</label>
              <input
                className={`form-input${errors.roll_number ? ' input-error' : ''}`}
                type="text"
                placeholder="e.g. CS2021001"
                value={form.roll_number}
                onChange={(e) => set('roll_number', e.target.value)}
              />
              {errors.roll_number && <p className="form-error">{errors.roll_number}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className={`form-input${errors.email ? ' input-error' : ''}`}
                type="email"
                placeholder="e.g. priya@iitm.ac.in"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem' }}>
          <legend style={{
            fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
          }}
          >
            Academic Details
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Department *</label>
              <select
                className={`form-select${errors.department ? ' input-error' : ''}`}
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
              >
                <option value="">Select department…</option>
                {ADD_STUDENT_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="form-error">{errors.department}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Specialization / Branch</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. AI & ML"
                value={form.branch}
                onChange={(e) => set('branch', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CGPA</label>
              <input
                className={`form-input${errors.cgpa ? ' input-error' : ''}`}
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.5"
                value={form.cgpa}
                onChange={(e) => set('cgpa', e.target.value)}
              />
              {errors.cgpa && <p className="form-error">{errors.cgpa}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem' }}>
          <legend style={{
            fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
          }}
          >
            Demographics & Status
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select…</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Placement Status</label>
              <select
                className="form-select"
                value={form.placement_status}
                onChange={(e) => set('placement_status', e.target.value)}
              >
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{
            fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
          }}
          >
            Skills
          </legend>
          <div className="form-group">
            <TagPicker
              tags={form.skills}
              onChange={(val) => set('skills', val)}
              placeholder="Type a skill and press Enter…"
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
              Press Enter or comma to add each skill.
            </p>
          </div>
        </fieldset>
      </div>

      <div style={{
        padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)',
        display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
        flexShrink: 0, background: 'var(--bg-secondary)',
      }}
      >
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 130 }}>
          {submitting
            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Adding…</>
            : <><Plus size={15} /> Add Student</>}
        </button>
      </div>

      <style>{`
        .form-error { color: #dc2626; font-size: 0.75rem; margin: 0.25rem 0 0; }
        .input-error { border-color: #fca5a5 !important; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
      </style>
    </form>
  );
}
