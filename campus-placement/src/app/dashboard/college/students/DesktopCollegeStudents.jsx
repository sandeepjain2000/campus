'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { ImportCsvSplitButton } from '@/components/import/ImportCsvSplitButton';
import { downloadCsvFromRows } from '@/lib/csvExport';
import {
  CURRENT_ACADEMIC_YEAR, CURRENT_SEMESTER, STUDENT_CSV_HEADERS,
  studentToCsvRow, studentCsvTemplateExampleRow,
} from '@/lib/collegeStudentsCsv';
import { useToast } from '@/components/ToastProvider';
import { GraduationCap, Search, Download, X, CheckCircle2, CircleAlert, UserPlus } from 'lucide-react';
import StudentDetailModal, { getCompletedSectionCount } from './StudentDetailModal';

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

  const uniqueDepartments = useMemo(() => Array.from(new Set(students.map((s) => s.dept).filter(Boolean))), [students]);

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
                    <th>Student</th>
                    <th>Email</th>
                    <th>Comm. email</th>
                    <th>System ID</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Sections</th>
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
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{s.email || '—'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                          {(s.communicationEmail && String(s.communicationEmail).trim()) || s.email || '—'}
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
                        <td>
                          <span className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>
                            {getCompletedSectionCount(s)}/{s.sectionCompletion?.total || 6}
                          </span>
                        </td>
                        <td><span className={`badge badge-${getStatusColor(s.jobStatus)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(s.jobStatus)}</span></td>
                        <td style={{ paddingRight: '1.5rem' }}>
                          {s.verified
                            ? <span className="badge badge-green" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Verified</span>
                            : <span className="badge badge-amber" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CircleAlert size={12} /> Pending</span>}
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

      <StudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
        onVerify={setStudentVerified}
      />

    </div>
  );
}
