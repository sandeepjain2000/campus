'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { Search, X, CheckCircle2, UserPlus } from 'lucide-react';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function MobileCollegeStudents() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (detailStudent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [detailStudent]);

  const reloadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/college/students');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load students');
      setStudents(Array.isArray(json) ? json : []);
    } catch (error) {
      addToast(error.message || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { reloadStudents(); }, [reloadStudents]);

  const setStudentVerified = useCallback(async (profileId, approve) => {
    try {
      const res = await fetch('/api/college/students/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentProfileId: profileId, approve }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      addToast(approve ? 'Student verified.' : 'Verification cleared.', 'success');
      setStudents((prev) => prev.map((s) => (s.id === profileId ? { ...s, verified: approve } : s)));
      setDetailStudent((d) => (d && d.id === profileId ? { ...d, verified: approve } : d));
    } catch (e) {
      addToast(e.message || 'Failed', 'error');
    }
  }, [addToast]);

  const filtered = useMemo(() => students.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.roll.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && s.dept !== deptFilter) return false;
    if (jobStatusFilter && s.jobStatus !== jobStatusFilter) return false;
    return true;
  }), [students, search, deptFilter, jobStatusFilter]);

  const uniqueDepartments = useMemo(() => Array.from(new Set(students.map((s) => s.dept).filter(Boolean))), [students]);

  const hasFilters = search || deptFilter || jobStatusFilter;
  const clearFilters = () => { setSearch(''); setDeptFilter(''); setJobStatusFilter(''); };

  return (
    <>
      <MobileHeader title="Students" />
      <div className="animate-fadeIn" style={{ padding: '1rem', paddingBottom: '5rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            {filtered.length} of {students.length} enrolled
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href="/dashboard/college/students/add"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={14} /> Add
            </Link>
          </div>
        </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input className="form-input" placeholder="Search by name or roll…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {uniqueDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value)}>
            <option value="">All Job Statuses</option>
            <option value="unplaced">Unplaced</option>
            <option value="placed">Placed</option>
            <option value="opted_out">Opted out</option>
            <option value="higher_studies">Higher studies</option>
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--danger-600)' }}>
              <X size={14} /> Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {filtered.length} of {students.length}
          </span>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      )}

      {!isLoading && (
        <>


          {/* Mobile view cards */}
          <div className="mobile-cards">
            {filtered.map((s) => {
              const initials = s.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={s.id} style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1rem', background: 'var(--bg-elevated)', marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => setDetailStudent(s)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--primary-300)', flexShrink: 0 }}>
                        {initials || 'S'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>{s.systemId || s.roll}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: s.cgpa >= 8 ? 'var(--success-600)' : s.cgpa >= 6 ? 'var(--text-primary)' : 'var(--warning-600)' }}>{s.cgpa ?? '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${getStatusColor(s.jobStatus)} badge-dot`} style={{ fontSize: '0.75rem' }}>Job: {formatStatus(s.jobStatus)}</span>
                    {s.verified
                      ? <span className="badge badge-green" style={{ fontSize: '0.75rem' }}><CheckCircle2 size={12} style={{ marginRight: 4 }} /> Verified</span>
                      : <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>Unverified</span>}
                  </div>
                </div>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No students found</div>
                <div style={{ fontSize: '0.85rem' }}>Try adjusting filters</div>
              </div>
            )}
          </div>
          

        </>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="modal-overlay" role="presentation" style={{ overflowY: 'auto', alignItems: 'flex-start' }} onClick={(e) => { if (e.target === e.currentTarget) setDetailStudent(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="student-detail-title" style={{ borderRadius: 'var(--radius-xl)', margin: 'auto' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, var(--primary-900), var(--primary-700))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {detailStudent.photo ? (
                  <img src={detailStudent.photo} alt="" width={56} height={56} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.3)' }}>
                    {detailStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 id="student-detail-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{detailStudent.name}</h2>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem', fontFamily: 'monospace' }}>{detailStudent.roll}</div>
                </div>
              </div>
              <button type="button" onClick={() => setDetailStudent(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {[
                  { label: 'System ID', value: detailStudent.systemId },
                  { label: 'Roll No.', value: detailStudent.roll },
                  { label: 'Login email', value: detailStudent.email },
                  {
                    label: 'Communication email',
                    value: (detailStudent.communicationEmail && String(detailStudent.communicationEmail).trim()) || detailStudent.email,
                  },
                  { label: 'Department', value: detailStudent.dept },
                  { label: 'Specialization', value: detailStudent.specialization },
                  { label: 'CGPA', value: detailStudent.cgpa },
                  { label: 'Semester', value: detailStudent.semester },
                  { label: 'Academic Year', value: detailStudent.academicYear },
                  { label: 'Gender', value: detailStudent.gender },
                  { label: 'Disability Status', value: detailStudent.disabilityStatus },
                  { label: 'Diversity Category', value: detailStudent.diversityCategory },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value || '—'}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {detailStudent.skills.length ? detailStudent.skills.map(sk => (
                      <span key={sk} className="badge badge-indigo" style={{ fontSize: '0.8rem' }}>{sk}</span>
                    )) : <span className="text-tertiary text-sm">No skills listed.</span>}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Job Status</div>
                  <span className={`badge badge-${getStatusColor(detailStudent.jobStatus)} badge-dot`}>{formatStatus(detailStudent.jobStatus)}</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Internship Status</div>
                  <span className={`badge badge-${getStatusColor(detailStudent.internshipStatus)} badge-dot`}>{formatStatus(detailStudent.internshipStatus)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 2rem', borderTop: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
              {detailStudent.verified ? (
                <button type="button" className="btn btn-ghost" onClick={() => setStudentVerified(detailStudent.id, false)}>Clear Verification</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setStudentVerified(detailStudent.id, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Approve & Verify Student
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setDetailStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
