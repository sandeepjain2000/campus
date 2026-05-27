'use client';

import { useState } from 'react';
import useSWR from 'swr';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import {
  COMPANY_SORT_OPTIONS,
  STUDENT_OPPORTUNITY_FILTER_OPTIONS,
  opportunityFilterFn,
  opportunitySearchText,
} from '@/lib/tableQueryPresets';
import { GraduationCap, Eye, X, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import EntityLogo from '@/components/EntityLogo';
import CompanyNameLink from '@/components/CompanyNameLink';
import StudentApplyResumeBanner from '@/components/StudentApplyResumeBanner';
import PageLoading from '@/components/PageLoading';

async function fetcher(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function StudentInternshipsPage() {
  const { addToast } = useToast();
  const [selectedRow, setSelectedRow] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const { data, error, isLoading, mutate } = useSWR('/api/student/program-opportunities?kind=internship', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 0,
  });

  const items = data?.items || [];
  const canApply = data?.canApply !== false;

  const {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered: displayItems,
    filteredCount,
    totalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(items, {
    getSearchText: opportunitySearchText,
    filterFn: opportunityFilterFn,
    sortOptions: COMPANY_SORT_OPTIONS,
    defaultSort: 'company_asc',
  });

  const apply = async (jobId, title) => {
    if (!canApply) {
      addToast('Upload your primary CV on your profile before applying.', 'warning');
      return;
    }
    setApplyingId(jobId);
    try {
      const res = await fetch('/api/student/program-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(json.error || 'Could not apply', 'error');
        return;
      }
      addToast(`Applied to ${title}`, 'success');
      mutate();
    } catch {
      addToast('Network error', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={28} className="text-secondary" strokeWidth={1.5} />
            Browse Internships
          </h1>
          <p className="text-secondary">
            Published internships visible to your college. Apply directly from here.
          </p>
        </div>
        <div className="page-header-actions">
          <span className="badge badge-blue" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {totalCount} internship{totalCount !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      <StudentApplyResumeBanner canApply={canApply} />

      {isLoading && <PageLoading message="Loading internships…" inline />}
      {error && (
        <div className="card" style={{ borderColor: 'var(--danger-500)' }}>
          <p className="text-sm" style={{ margin: 0 }}>
            {error.message}
            {/job_posting_visibility|program_applications|member_tenant_id|does not exist/i.test(error.message) ? (
              <>
                {' '}
                Run <code className="text-xs">006_job_visibility_program_applications.sql</code> (adds{' '}
                <code className="text-xs">member_tenant_id</code> + visibility tables) or{' '}
                <code className="text-xs">004_group_tenants_student_affiliation.sql</code>, then reload.
              </>
            ) : null}
          </p>
        </div>
      )}

      {!isLoading && !error && totalCount === 0 && (
        <div className="empty-state-container" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ background: 'var(--primary-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <GraduationCap size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No internships available</h3>
          <p className="text-secondary" style={{ margin: 0 }}>
            No published internships for your campus right now. When an employer publishes one and selects your college, it will appear here.
          </p>
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search company, role, or status…"
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={STUDENT_OPPORTUNITY_FILTER_OPTIONS}
          filterLabel="Status"
          sort={sort}
          onSortChange={setSort}
          sortOptions={COMPANY_SORT_OPTIONS}
          filteredCount={filteredCount}
          totalCount={totalCount}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      )}

      {/* ── Tabular list ── */}
      {!isLoading && totalCount > 0 && (
        <div className="card card-table-shell">
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1rem' }}>Company</th>
                <th>Role</th>
                <th>Stipend</th>
                <th>CGPA</th>
                <th>Openings</th>
                <th>Deadline</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-secondary">
                    No internships match your search or filters.
                  </td>
                </tr>
              ) : null}
              {displayItems.map((row) => (
                <tr key={row.id}>
                  <td style={{ paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <EntityLogo name={row.companyName} size="sm" shape="rounded" />
                      <CompanyNameLink name={row.companyName} website={row.website} className="font-semibold" />
                    </div>
                  </td>
                  <td>{row.title}</td>
                  <td className="text-sm">
                    {row.salaryMin != null || row.salaryMax != null ? (
                      <>
                        {formatCurrency(row.salaryMin || row.salaryMax)}
                        {row.salaryMax != null && row.salaryMin != null && Number(row.salaryMax) !== Number(row.salaryMin)
                          ? ` – ${formatCurrency(row.salaryMax)}`
                          : ''}
                        <span className="text-tertiary"> /mo</span>
                      </>
                    ) : '—'}
                  </td>
                  <td className="text-sm">{row.minCgpa != null ? row.minCgpa : '—'}</td>
                  <td className="text-sm">{row.vacancies ?? '—'}</td>
                  <td className="text-sm">{row.applicationDeadline ? formatDate(row.applicationDeadline) : '—'}</td>
                  <td>
                    {row.hasApplied ? (
                      <span className={`badge badge-${getStatusColor(row.applicationStatus)} badge-dot`}>
                        {formatStatus(row.applicationStatus)}
                      </span>
                    ) : (
                      <span className="badge badge-gray">Open</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedRow(row)}
                        title="View details"
                      >
                        <Eye size={14} /> View
                      </button>
                      {!row.hasApplied && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!canApply || applyingId === row.id}
                          onClick={() => apply(row.id, row.title)}
                        >
                          {applyingId === row.id ? 'Applying…' : canApply ? 'Apply' : 'CV required'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── Detail drawer / modal ── */}
      {selectedRow && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="animate-fadeIn"
            style={{
              width: '520px', maxWidth: '95vw', height: '100vh',
              background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)',
              overflow: 'auto', padding: '2rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <EntityLogo name={selectedRow.companyName} size="lg" shape="rounded" />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedRow.title}</h2>
                  <p className="text-sm text-secondary" style={{ margin: '0.125rem 0 0 0' }}>
                    <CompanyNameLink name={selectedRow.companyName} website={selectedRow.website} />
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRow(null)} title="Close">
                <X size={16} />
              </button>
            </div>

            {/* Status badge */}
            <div style={{ marginBottom: '1.25rem' }}>
              {selectedRow.hasApplied ? (
                <span className={`badge badge-${getStatusColor(selectedRow.applicationStatus)} badge-dot`} style={{ fontSize: '0.85rem', padding: '0.375rem 0.75rem' }}>
                  {formatStatus(selectedRow.applicationStatus)}
                </span>
              ) : (
                <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '0.375rem 0.75rem' }}>Open for applications</span>
              )}
            </div>

            {/* Key details grid */}
            <div
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '1rem', padding: '1.25rem',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Stipend</div>
                <div className="text-sm font-semibold">
                  {selectedRow.salaryMin != null || selectedRow.salaryMax != null ? (
                    <>
                      {formatCurrency(selectedRow.salaryMin || selectedRow.salaryMax)}
                      {selectedRow.salaryMax != null && selectedRow.salaryMin != null && Number(selectedRow.salaryMax) !== Number(selectedRow.salaryMin)
                        ? ` – ${formatCurrency(selectedRow.salaryMax)}`
                        : ''}{' '}
                      / mo
                    </>
                  ) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Min CGPA</div>
                <div className="text-sm font-semibold">{selectedRow.minCgpa ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Openings</div>
                <div className="text-sm font-semibold">{selectedRow.vacancies ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Deadline</div>
                <div className="text-sm font-semibold">{selectedRow.applicationDeadline ? formatDate(selectedRow.applicationDeadline) : '—'}</div>
              </div>
            </div>

            {/* Skills */}
            {selectedRow.skillsRequired?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Skills Required</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selectedRow.skillsRequired.map((s) => (
                    <span key={s} className="badge badge-gray">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedRow.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Description</div>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                  {selectedRow.description}
                </p>
              </div>
            )}

            {/* Apply button */}
            {!selectedRow.hasApplied && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!canApply || applyingId === selectedRow.id}
                onClick={() => apply(selectedRow.id, selectedRow.title)}
              >
                {applyingId === selectedRow.id ? 'Applying…' : canApply ? 'Apply to this Internship' : 'Upload CV to apply'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
