'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Briefcase, Building2, IndianRupee, BookOpen, Calendar, LayoutGrid, List } from 'lucide-react';
import { formatCurrency, formatDate, formatStatus } from '@/lib/utils';
import { useCollegeAcademicYearApiPath } from '@/lib/collegeAcademicYearContext';
import CompanyNameLink from '@/components/CompanyNameLink';
import PostingEligibilitySection from '@/components/student/PostingEligibilitySection';
import PageLoading from '@/components/PageLoading';

const fetcher = (url) => fetch(url).then((r) => r.json());

function salaryLabel(min, max) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && Number(min) === Number(max)) {
    return `${formatCurrency(Number(min))}/yr`;
  }
  if (min != null && max != null) {
    return `${formatCurrency(Number(min))} - ${formatCurrency(Number(max))}/yr`;
  }
  if (min != null) return `From ${formatCurrency(Number(min))}/yr`;
  return `Up to ${formatCurrency(Number(max))}/yr`;
}

export default function DesktopJobs() {
  const [viewMode, setViewMode] = useState('card');
  const jobsPath = useCollegeAcademicYearApiPath('/api/college/jobs');
  const { data, error, isLoading } = useSWR(jobsPath, fetcher);
  const list = useMemo(() => (Array.isArray(data?.jobs) ? data.jobs : []), [data]);

  const stats = useMemo(() => {
    const n = list.length;
    let sum = 0;
    let count = 0;
    list.forEach((row) => {
      const a = row.salary_min != null ? Number(row.salary_min) : null;
      const b = row.salary_max != null ? Number(row.salary_max) : null;
      if (a != null && b != null) {
        sum += (a + b) / 2;
        count += 1;
      } else if (a != null) {
        sum += a;
        count += 1;
      } else if (b != null) {
        sum += b;
        count += 1;
      }
    });
    return {
      count: n,
      avgSalary: count ? Math.round(sum / count) : null,
      openings: list.reduce((s, r) => s + (parseInt(r.vacancies, 10) || 0), 0),
    };
  }, [list]);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            Jobs
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Published job openings for which your campus was selected by approved employer partners.
          </p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Published Jobs', value: isLoading ? '...' : stats.count, icon: Briefcase, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { label: 'Avg Salary', value: stats.avgSalary != null ? formatCurrency(stats.avgSalary) : '—', icon: IndianRupee, color: 'var(--success-600)', bg: 'rgba(5,150,105,0.08)' },
          { label: 'Total Openings', value: isLoading ? '...' : stats.openings, icon: Building2, color: 'var(--warning-600)', bg: 'rgba(217,119,6,0.08)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: bg, color }}><Icon size={20} strokeWidth={2} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger-500)', marginBottom: '1rem' }}>
          <p className="text-sm">Could not load jobs. Ensure you are signed in as a college admin and the database is configured.</p>
        </div>
      )}

      {isLoading && <PageLoading message="Loading jobs…" inline />}

      {!isLoading && !error && list.length === 0 && (
        <div className="card">
          <p className="text-secondary" style={{ margin: 0 }}>
            No published jobs for your campus yet. Employers must publish a job and include your college in campus visibility.
          </p>
        </div>
      )}

      {!isLoading && !error && list.length > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span className="badge badge-gray" style={{ fontSize: '0.85rem' }}>
            {list.length} {list.length === 1 ? 'job' : 'jobs'}
          </span>
          <div
            role="group"
            aria-label="View mode"
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              padding: '3px',
              gap: '2px',
              border: '1px solid var(--border-default)',
            }}
          >
            {[
              { mode: 'card', icon: LayoutGrid, label: 'Card view' },
              { mode: 'list', icon: List, label: 'List view' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'background 0.15s ease, color 0.15s ease',
                  background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                  color: viewMode === mode ? 'var(--primary-600)' : 'var(--text-tertiary)',
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={15} aria-hidden />
                {mode === 'card' ? 'Cards' : 'List'}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {viewMode === 'list' && !isLoading && !error && list.length > 0 ? (
        <div className="card card-table-shell" style={{ border: '1px solid var(--border-default)', padding: 0 }}>
          <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
            <table className="data-table college-applications-table college-jobs-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th className="college-jobs-col-title" style={{ paddingLeft: '1.25rem' }}>
                    Job Title
                  </th>
                  <th className="college-jobs-col-company">Company</th>
                  <th className="college-jobs-col-type">Type</th>
                  <th className="college-jobs-col-salary">Salary</th>
                  <th className="college-jobs-col-cgpa">CGPA</th>
                  <th className="college-jobs-col-openings">Openings</th>
                  <th className="college-jobs-col-posted" style={{ paddingRight: '1.25rem' }}>
                    Posted
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td className="college-jobs-col-title" style={{ paddingLeft: '1.25rem' }}>
                      <div className="font-semibold text-sm cell-truncate" title={row.title}>
                        {row.title}
                      </div>
                      {row.skills_required?.length ? (
                        <div className="text-xs text-tertiary cell-truncate" title={row.skills_required.join(', ')}>
                          {row.skills_required.slice(0, 3).join(', ')}
                          {row.skills_required.length > 3 ? '…' : ''}
                        </div>
                      ) : null}
                    </td>
                    <td className="text-sm college-jobs-col-company">
                      <CompanyNameLink name={row.company_name} website={row.website} />
                    </td>
                    <td className="college-jobs-col-type">
                      <span className="badge badge-indigo badge-dot">{formatStatus(row.job_type)}</span>
                    </td>
                    <td className="text-sm college-jobs-col-salary">{salaryLabel(row.salary_min, row.salary_max)}</td>
                    <td className="text-sm college-jobs-col-cgpa">{row.min_cgpa != null ? Number(row.min_cgpa) : '—'}</td>
                    <td className="text-sm college-jobs-col-openings">{row.vacancies ?? '—'}</td>
                    <td className="text-sm text-secondary college-jobs-col-posted" style={{ paddingRight: '1.25rem' }}>
                      {row.created_at ? formatDate(row.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {viewMode === 'card' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {list.map((row) => (
          <div key={row.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{row.title}</h3>
                  <span className="badge badge-indigo badge-dot">{formatStatus(row.job_type)}</span>
                  <span className="badge badge-gray badge-dot">
                    <CompanyNameLink name={row.company_name} website={row.website} />
                  </span>
                </div>
                <p className="text-sm text-secondary" style={{ margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                  {(row.description || '').slice(0, 300)}
                  {(row.description || '').length > 300 ? '...' : ''}
                </p>
                <div className="text-sm text-secondary" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <IndianRupee size={14} aria-hidden /> Salary: {salaryLabel(row.salary_min, row.salary_max)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={14} aria-hidden /> Min CGPA: {row.min_cgpa != null ? Number(row.min_cgpa) : '—'}
                  </span>
                  <span>Openings: {row.vacancies ?? '—'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} aria-hidden /> Posted {row.created_at ? formatDate(row.created_at) : '—'}
                  </span>
                </div>
                {row.eligible_branches?.length ? (
                  <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {row.eligible_branches.map((branch) => (
                      <span key={branch} className="badge badge-blue">{branch}</span>
                    ))}
                  </div>
                ) : null}
                {row.skills_required?.length ? (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {row.skills_required.map((skill) => (
                      <span key={skill} className="badge badge-gray">{skill}</span>
                    ))}
                  </div>
                ) : null}
                <div style={{ marginTop: '1rem' }}>
                  <PostingEligibilitySection
                    opportunity={{
                      minCgpa: row.min_cgpa != null ? Number(row.min_cgpa) : null,
                      status: 'published',
                    }}
                    audience="college"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : null}
    </div>
  );
}
