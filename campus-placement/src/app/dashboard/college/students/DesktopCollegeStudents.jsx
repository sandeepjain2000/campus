'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { ImportCsvSplitButton } from '@/components/import/ImportCsvSplitButton';
import { parseCsv, downloadCsvFromRows } from '@/lib/csvExport';
import {
  CURRENT_ACADEMIC_YEAR, CURRENT_SEMESTER, STUDENT_CSV_HEADERS,
  studentToCsvRow, studentCsvTemplateExampleRow, validateStudentCsvHeaders,
  parseStudentRow, normalizeStudentRollKey,
} from '@/lib/collegeStudentsCsv';
import { useToast } from '@/components/ToastProvider';
import { GraduationCap, Search, Download, X, CheckCircle2, UserPlus } from 'lucide-react';

function mergeImportedStudents(prev, imported) {
  const byRoll = new Map(prev.map((s) => [normalizeStudentRollKey(s.roll), { ...s, skills: [...s.skills] }]));
  let maxId = prev.reduce((m, s) => Math.max(m, s.id), 0);
  for (const u of imported) {
    const key = normalizeStudentRollKey(u.roll);
    if (byRoll.has(key)) {
      const ex = byRoll.get(key);
      byRoll.set(key, { ...ex, ...u, id: ex.id, skills: [...u.skills] });
    } else {
      maxId += 1;
      byRoll.set(key, { ...u, id: maxId, skills: [...u.skills] });
    }
  }
  return Array.from(byRoll.values());
}

export default function DesktopCollegeStudents() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState(null);
  const [importBusy, setImportBusy] = useState(false);

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

  const getStudentCsv = useCallback((scope) => {
    const list = scope === 'current' ? filtered : students;
    return { headers: [...STUDENT_CSV_HEADERS], rows: list.map((s) => studentToCsvRow(s)) };
  }, [filtered, students]);

  const uniqueSpecializations = useMemo(() => Array.from(new Set(students.map((s) => s.specialization))), [students]);
  const uniqueDepartments = useMemo(() => Array.from(new Set(students.map((s) => s.dept).filter(Boolean))), [students]);
  const uniqueSemesters = useMemo(() => Array.from(new Set(students.map((s) => s.semester).filter(Boolean))), [students]);

  const downloadTemplate = useCallback(() => {
    downloadCsvFromRows('students_import_template', [...STUDENT_CSV_HEADERS], [studentCsvTemplateExampleRow()]);
  }, []);

  const onImportFile = useCallback(async (file) => {
    setImportBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/college/students/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        const error = new Error(json.error || 'Import failed');
        error.details = json.details;
        error.stack = json.stack;
        throw error;
      }

      const processed = json.message || `Successfully processed students`;
      addToast(processed, 'success');
      
      if (json.errors?.length) {
        addToast(`${json.errors.length} rows had issues.`, 'warning', 10000, { rowErrors: json.errors });
      }

      // Refresh data from server
      await reloadStudents();
    } catch (err) {
      addToast(err.message || 'Could not process CSV file', 'error', 5000, err.details ? { 
        details: err.details,
        stack: err.stack,
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      } : null);
    } finally {
      setImportBusy(false);
    }
  }, [addToast, reloadStudents]);

  const hasFilters = search || deptFilter || jobStatusFilter;
  const clearFilters = () => { setSearch(''); setDeptFilter(''); setJobStatusFilter(''); };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>

      {/* Page Header — v0 standard */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            Students
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            AY {CURRENT_ACADEMIC_YEAR} · Semester {CURRENT_SEMESTER} · {students.length} enrolled
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-default)', fontSize: '0.85rem' }}>
            <Download size={14} /> Template
          </button>
          <ExportCsvSplitButton filenameBase="students" currentCount={filtered.length} fullCount={students.length} getRows={getStudentCsv} />
          <ImportCsvSplitButton onFileSelected={onImportFile} busy={importBusy} />
          <Link
            href="/dashboard/college/students/add"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <UserPlus size={15} /> Add Student
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
          <div className="desktop-table card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ width: 50, paddingLeft: '1.5rem' }}>#</th>
                    <th>System ID</th>
                    <th>Student</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Job Status</th>
                    <th style={{ paddingRight: '1.5rem' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, index) => {
                    const initials = s.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={s.id} role="button" tabIndex={0} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => setDetailStudent(s)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailStudent(s); } }}
                      >
                        <td style={{ color: 'var(--text-tertiary)', paddingLeft: '1.5rem', fontSize: '0.85rem' }}>{index + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {s.photo ? (
                              <img src={s.photo} alt={s.name} width={34} height={34} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }} />
                            ) : (
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--primary-300)', flexShrink: 0 }}>
                                {initials || 'S'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{s.skills.slice(0, 2).join(', ')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono, monospace)' }}>
                          <span style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)', borderRadius: '4px', padding: '0.15rem 0.5rem', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{s.systemId || s.roll}</span>
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>{s.dept}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: s.cgpa >= 8 ? 'var(--success-600)' : s.cgpa >= 6 ? 'var(--text-primary)' : 'var(--warning-600)' }}>
                            {s.cgpa ?? '—'}
                          </span>
                        </td>
                        <td><span className={`badge badge-${getStatusColor(s.jobStatus)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(s.jobStatus)}</span></td>
                        <td style={{ paddingRight: '1.5rem' }}>
                          {s.verified
                            ? <span className="badge badge-green" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Verified</span>
                            : <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>Pending</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
                        <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No students found</div>
                        <div>Try adjusting your filters or import a student CSV.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
  );
}
