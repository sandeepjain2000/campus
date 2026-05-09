'use client';

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
import { GraduationCap, Search, Download, Upload, X, CheckCircle2 } from 'lucide-react';

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

export default function CollegeStudentsPage() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [internshipStatusFilter, setInternshipStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState(null);
  const [importBusy, setImportBusy] = useState(false);

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
    if (internshipStatusFilter && s.internshipStatus !== internshipStatusFilter) return false;
    if (specializationFilter && s.specialization !== specializationFilter) return false;
    if (semesterFilter && s.semester !== semesterFilter) return false;
    if (skillFilter && !s.skills.some((skill) => skill.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    return true;
  }), [students, search, deptFilter, jobStatusFilter, internshipStatusFilter, specializationFilter, semesterFilter, skillFilter]);

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
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const check = validateStudentCsvHeaders(headers);
      if (!check.ok) { addToast(check.error, 'error'); return; }
      const { idx } = check;
      const imported = []; const errors = [];
      rows.forEach((cells, i) => {
        const r = parseStudentRow(cells, idx, i + 2);
        if (!r.ok) errors.push(r.error);
        else imported.push(r.student);
      });
      if (errors.length) { addToast(errors.slice(0, 5).join(' · '), 'error'); if (errors.length > 5) addToast(`…and ${errors.length - 5} more issues`, 'warning'); return; }
      if (imported.length === 0) { addToast('No data rows found in CSV', 'warning'); return; }
      const byRollInFile = new Map();
      for (const row of imported) byRollInFile.set(normalizeStudentRollKey(row.roll), row);
      const uniqueImported = Array.from(byRollInFile.values());
      const dups = imported.length - uniqueImported.length;
      setStudents((prev) => mergeImportedStudents(prev, uniqueImported));
      addToast(dups > 0 ? `Updated ${uniqueImported.length} unique roll(s); ${dups} duplicate(s) used last value` : `Imported ${uniqueImported.length} row(s)`, dups > 0 ? 'warning' : 'success');
    } catch { addToast('Could not read CSV file', 'error'); }
    finally { setImportBusy(false); }
  }, [addToast]);

  const hasFilters = search || deptFilter || jobStatusFilter || internshipStatusFilter || specializationFilter || semesterFilter || skillFilter;
  const clearFilters = () => { setSearch(''); setDeptFilter(''); setJobStatusFilter(''); setInternshipStatusFilter(''); setSpecializationFilter(''); setSemesterFilter(''); setSkillFilter(''); };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={28} /> Manage Students
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            AY <strong style={{ color: 'white' }}>{CURRENT_ACADEMIC_YEAR}</strong> · Semester <strong style={{ color: 'white' }}>{CURRENT_SEMESTER}</strong> · {students.length} students enrolled
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={downloadTemplate} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} /> Template
          </button>
          <ExportCsvSplitButton filenameBase="students" currentCount={filtered.length} fullCount={students.length} getRows={getStudentCsv} />
          <ImportCsvSplitButton onFileSelected={onImportFile} busy={importBusy} />
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input className="form-input" placeholder="Search by name or roll…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <input className="form-input" placeholder="Filter by skill…" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} style={{ flex: '0 1 180px' }} />
          <select className="form-select" style={{ width: 'auto' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {uniqueDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
            <option value="">All Specializations</option>
            {uniqueSpecializations.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {uniqueSemesters.map((sem) => <option key={sem} value={sem}>{`Semester ${sem}`}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value)}>
            <option value="">All Job Statuses</option>
            <option value="unplaced">Unplaced</option>
            <option value="placed">Placed</option>
            <option value="opted_out">Opted out</option>
            <option value="higher_studies">Higher studies</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={internshipStatusFilter} onChange={(e) => setInternshipStatusFilter(e.target.value)}>
            <option value="">All Internship Statuses</option>
            <option value="none">None</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
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
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ width: 50, paddingLeft: '1.5rem' }}>#</th>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Sem</th>
                  <th>CGPA</th>
                  <th>Job Status</th>
                  <th>Internship</th>
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
                      <td style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>{s.roll}</td>
                      <td style={{ fontSize: '0.9rem' }}>{s.dept}</td>
                      <td><span className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>{s.specialization}</span></td>
                      <td style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)' }}>{s.semester || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: s.cgpa >= 8 ? 'var(--success-600)' : s.cgpa >= 6 ? 'var(--text-primary)' : 'var(--warning-600)' }}>
                          {s.cgpa ?? '—'}
                        </span>
                      </td>
                      <td><span className={`badge badge-${getStatusColor(s.jobStatus)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(s.jobStatus)}</span></td>
                      <td><span className={`badge badge-${getStatusColor(s.internshipStatus)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(s.internshipStatus)}</span></td>
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
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setDetailStudent(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="student-detail-title" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
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
