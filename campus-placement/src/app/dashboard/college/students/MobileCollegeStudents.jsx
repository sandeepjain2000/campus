'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { CheckCircle2, UserPlus } from 'lucide-react';
import StudentListFiltersPanel from './StudentListFiltersPanel';
import { useStudentListFilters } from './useStudentListFilters';
import MobileHeader from '@/components/mobile/MobileHeader';
import {
  academicYearQueryString,
  readActiveAcademicYearContext,
} from '@/lib/collegeAcademicYearContext';

export default function MobileCollegeStudents() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const reloadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = academicYearQueryString(readActiveAcademicYearContext());
      const res = await fetch(`/api/college/students${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load students');
      setStudents(Array.isArray(json) ? json : json.students || []);
    } catch (error) {
      addToast(error.message || 'Failed to load students', 'error');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { reloadStudents(); }, [reloadStudents]);

  useEffect(() => {
    const onYear = () => { reloadStudents(); };
    window.addEventListener('placementhub-academic-year', onYear);
    return () => window.removeEventListener('placementhub-academic-year', onYear);
  }, [reloadStudents]);

  const {
    search,
    setSearch,
    deptFilters,
    setDeptFilters,
    degreeFilters,
    setDegreeFilters,
    jobStatusFilters,
    setJobStatusFilters,
    sortBy,
    setSortBy,
    sortOpen,
    setSortOpen,
    departmentOptions,
    degreeOptions,
    filtered,
    hasFilters,
    clearFilters,
  } = useStudentListFilters(students);

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

      <StudentListFiltersPanel
        search={search}
        setSearch={setSearch}
        deptFilters={deptFilters}
        setDeptFilters={setDeptFilters}
        degreeFilters={degreeFilters}
        setDegreeFilters={setDegreeFilters}
        jobStatusFilters={jobStatusFilters}
        setJobStatusFilters={setJobStatusFilters}
        departmentOptions={departmentOptions}
        degreeOptions={degreeOptions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOpen={sortOpen}
        setSortOpen={setSortOpen}
        hasFilters={hasFilters}
        clearFilters={clearFilters}
        filteredCount={filtered.length}
        totalCount={students.length}
      />

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
                <Link
                  href={`/dashboard/college/students/${s.id}`}
                  key={s.id}
                  style={{
                    display: 'block',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'var(--bg-elevated)',
                    marginBottom: '0.75rem',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--primary-300)', flexShrink: 0 }}>
                        {initials || 'S'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-700)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>{s.systemId || s.roll}</div>
                      {s.degreePursued ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.degreePursued}</div>
                      ) : null}
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
                </Link>
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


      </div>
    </>
  );
}
