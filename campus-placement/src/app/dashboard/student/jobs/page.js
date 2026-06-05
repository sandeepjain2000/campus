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
import { Briefcase } from 'lucide-react';
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import EntityLogo from '@/components/EntityLogo';
import CompanyNameLink from '@/components/CompanyNameLink';
import StudentApplyResumeBanner from '@/components/StudentApplyResumeBanner';
import StudentBrowsePrerequisitePanel from '@/components/student/StudentBrowsePrerequisitePanel';
import StudentOpportunityDetailModal from '@/components/student/StudentOpportunityDetailModal';
import StudentOpportunityApplyButton from '@/components/student/StudentOpportunityApplyButton';
import PageLoading from '@/components/PageLoading';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';
import {
  globalApplyBlockedReason,
  resolveApplyBlockReason,
} from '@/lib/getApplyBlockReason';
import { buildStudentApplyContext, programOpportunityFromRow } from '@/lib/studentApplyContext';

async function fetcher(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function StudentJobsPage() {
  const { addToast } = useToast();
  const [selectedRow, setSelectedRow] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const { data, error, isLoading, mutate } = useSWR('/api/student/program-opportunities?kind=job', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 0,
  });

  const items = data?.items || [];
  const placementLocked = data?.placementLocked === true;
  const applyBlockedReason = data?.applyBlockedReason || '';
  const currentStudent = buildStudentApplyContext(data);
  const canApply = data?.canApply !== false;
  const globalBlockedReason = globalApplyBlockedReason(canApply, applyBlockedReason);
  const canBrowseListings = data?.canBrowseListings !== false;
  const browseGateProps = {
    canBrowseListings,
    browseGateTitle: data?.browseGateTitle,
    browseGateMessage: data?.browseGateMessage,
    profileComplete: data?.profileComplete !== false,
    hasResume: data?.hasResume !== false,
    profileMissingLabels: data?.profileMissingLabels || [],
  };

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
    const row = items.find((i) => i.id === jobId);
    const blockReason = row
      ? resolveApplyBlockReason(programOpportunityFromRow(row), currentStudent, { globalBlockedReason })
      : null;
    if (blockReason) return;

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
            <Briefcase size={28} className="text-secondary" strokeWidth={1.5} />
            Browse Jobs
          </h1>
          <p className="text-secondary">
            Published jobs visible to your college. Apply directly from here.
          </p>
        </div>
        <div className="page-header-actions">
          {canBrowseListings ? (
            <span className="badge badge-blue" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {totalCount} job{totalCount !== 1 ? 's' : ''} available
            </span>
          ) : null}
        </div>
      </div>

      {isLoading && <PageLoading message="Loading jobs…" inline />}
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

      {!isLoading && !error && (
      <StudentBrowsePrerequisitePanel {...browseGateProps}>
      <StudentApplyResumeBanner
        canApply={canApply}
        placementLocked={placementLocked}
        applyBlockedReason={applyBlockedReason}
      />

      {canBrowseListings && !error && totalCount === 0 && (
        <div className="empty-state-container" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ background: 'var(--primary-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Briefcase size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No jobs available</h3>
          <p className="text-secondary" style={{ margin: 0 }}>
            No published jobs for your campus right now. When an employer publishes one and selects your college, it will appear here.
          </p>
        </div>
      )}

      {canBrowseListings && totalCount > 0 && (
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
      {canBrowseListings && totalCount > 0 && (
        <div className="card card-table-shell">
          <div className="table-container">
          <table className="data-table student-opportunities-table">
            <colgroup>
              <col className="student-opportunities-col-company" />
              <col className="student-opportunities-col-role" />
              <col className="student-opportunities-col-stipend" />
              <col className="student-opportunities-col-cgpa" />
              <col className="student-opportunities-col-openings" />
              <col className="student-opportunities-col-deadline" />
              <col className="student-opportunities-col-status" />
              <col className="student-opportunities-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th className="student-opportunities-col-company" style={{ paddingLeft: '1rem' }}>Company</th>
                <th className="student-opportunities-col-role">Role</th>
                <th className="student-opportunities-col-stipend">Salary</th>
                <th className="student-opportunities-col-cgpa">CGPA</th>
                <th className="student-opportunities-col-openings">Openings</th>
                <th className="student-opportunities-col-deadline">Deadline</th>
                <th className="student-opportunities-col-status">Status</th>
                <th className="student-opportunities-col-actions" style={{ textAlign: 'right', paddingRight: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-secondary">
                    No jobs match your search or filters.
                  </td>
                </tr>
              ) : null}
              {displayItems.map((row) => {
                const salaryText =
                  row.salaryMin != null || row.salaryMax != null
                    ? `${formatCurrency(row.salaryMin || row.salaryMax)}${
                        row.salaryMax != null && row.salaryMin != null && Number(row.salaryMax) !== Number(row.salaryMin)
                          ? ` – ${formatCurrency(row.salaryMax)}`
                          : ''
                      } /mo`
                    : '—';
                return (
                <tr key={row.id}>
                  <td className="student-opportunities-col-company" style={{ paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <EntityLogo name={row.companyName} size="sm" shape="rounded" />
                      <span className="cell-truncate font-semibold" title={row.companyName || undefined}>
                        <CompanyNameLink name={row.companyName} website={row.website} />
                      </span>
                    </div>
                  </td>
                  <td className="cell-truncate" title={row.title || undefined}>{row.title}</td>
                  <td className="text-sm cell-truncate" title={salaryText !== '—' ? salaryText : undefined}>
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
                  <td className="text-sm cell-truncate" title={row.applicationDeadline ? formatDate(row.applicationDeadline) : undefined}>
                    {row.applicationDeadline ? formatDate(row.applicationDeadline) : '—'}
                  </td>
                  <td>
                    {row.hasApplied ? (
                      <span className={`badge badge-${getStatusColor(row.applicationStatus)} badge-dot`}>
                        {formatStatus(row.applicationStatus)}
                      </span>
                    ) : (
                      <span className="badge badge-gray">Open</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <StandardTableIconAction action="view" showLabel={false} onClick={() => setSelectedRow(row)} />
                      {!row.hasApplied && (
                        <StudentOpportunityApplyButton
                          row={row}
                          currentStudent={currentStudent}
                          globalBlockedReason={globalBlockedReason}
                          applyingId={applyingId}
                          onApply={apply}
                          onShowEligibility={setSelectedRow}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {selectedRow ? (
        <StudentOpportunityDetailModal
          row={selectedRow}
          kind="job"
          onClose={() => setSelectedRow(null)}
          onApply={apply}
          applyingId={applyingId}
          currentStudent={currentStudent}
          canApply={canApply}
          applyBlockedReason={applyBlockedReason}
        />
      ) : null}
      </StudentBrowsePrerequisitePanel>
      )}
    </div>
  );
}
