'use client';
import { useState } from 'react';
import useSWR, { mutate as swrMutate } from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import CompanyNameLink from '@/components/CompanyNameLink';
import PageError from '@/components/PageError';
import PageLoading from '@/components/PageLoading';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import StudentOfferRespondActions from '@/components/student/StudentOfferRespondActions';
import { findPendingOfferForApplication } from '@/lib/offerStatusNormalize';
import { ClipboardList, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use, useMemo } from 'react';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import { COMPANY_SORT_OPTIONS, applicationSearchText } from '@/lib/tableQueryPresets';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load applications');
  }
  return res.json();
};

function roundLabel(item) {
  if (item.status === 'selected') return 'All rounds cleared';
  if (item.status === 'rejected') return 'Not qualified';
  if (Number(item.currentRound) > 0) return `Round ${item.currentRound}`;
  return 'Pending review';
}

const VALID_TYPES = ['jobs', 'internships', 'projects', 'mentorship', 'hackathons', 'drives'];

const TYPE_META = {
  drives: {
    title: 'Drive',
    browseHref: '/dashboard/student/drives',
    browseText: 'Browse Drives',
    emptyMessage:
      "You haven't applied to any placement drives yet. Start exploring active drives and apply to kickstart your career!",
  },
  jobs: {
    title: 'Job',
    browseHref: '/dashboard/student/jobs',
    browseText: 'Browse Jobs',
    emptyMessage: "You haven't applied to any jobs yet. Browse published jobs for your campus and apply.",
  },
  internships: {
    title: 'Internship',
    browseHref: '/dashboard/student/internships',
    browseText: 'Browse Internships',
    emptyMessage: "You haven't applied to any internships yet. Start exploring available internships and apply!",
  },
  projects: {
    title: 'Project',
    browseHref: '/dashboard/student/projects',
    browseText: 'Browse Projects',
    emptyMessage: "You haven't applied to any short projects yet. Browse projects for your campus and apply.",
  },
  hackathons: {
    title: 'Hackathon',
    browseHref: '/dashboard/student/hackathons',
    browseText: 'Browse Hackathons',
    emptyMessage: "You haven't applied to any hackathons yet. Browse hackathons for your campus and apply.",
  },
  mentorship: {
    title: 'Mentorship',
    browseHref: '/dashboard/student/internships',
    browseText: 'Browse Programs',
    emptyMessage: "You haven't applied to any mentorship programs yet.",
  },
};

const WITHDRAW_REAPPLY_NOTICE =
  'If you withdraw, you can apply again from Browse Drives while the drive stays open. If you wait 2 or more days, your college or the company may have closed applications — re-apply may no longer be possible. Continue with withdrawal?';

export default function StudentApplicationsPage({ params }) {
  const unwrappedParams = use(params);
  const type = unwrappedParams.type;

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const { addToast } = useToast();
  const [statusTab, setStatusTab] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const apiEndpoint = type === 'drives' ? '/api/student/applications' : '/api/student/program-applications';
  const { data, error, isLoading, mutate } = useSWR(apiEndpoint, fetcher);
  const {
    data: offers,
    mutate: mutateOffers,
  } = useSWR('/api/student/offers', async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load offers');
    return json;
  });
  const allApplications = (data?.items || []).map(item => ({
    ...item,
    company: item.company || item.companyName,
    role: item.role || item.title,
    driveDate: item.driveDate || null,
  }));

  const appTypeOf = (app) => {
    if (type === 'drives' && app.drive_id) return 'drive';

    const kind = String(app?.jobType || '').toLowerCase();
    if (kind === 'internship') return 'internship';
    if (kind === 'short_project') return 'project';
    if (kind === 'mentorship') return 'mentorship';
    if (kind === 'hackathon') return 'hackathon';
    if (kind === 'guest_faculty') return 'guest';
    return 'job';
  };

  const typeMatcher = {
    jobs: 'job',
    internships: 'internship',
    projects: 'project',
    mentorship: 'mentorship',
    hackathons: 'hackathon',
    drives: 'drive'
  }[type];

  const typeApplications = useMemo(() => {
    return allApplications.filter(a => appTypeOf(a) === typeMatcher);
  }, [allApplications, typeMatcher]);

  const tabFiltered = useMemo(
    () => typeApplications.filter((a) => !statusTab || a.status === statusTab),
    [typeApplications, statusTab],
  );

  const {
    search,
    setSearch,
    sort,
    setSort,
    filtered: displayApplications,
    filteredCount,
    totalCount: tabTotalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(tabFiltered, {
    getSearchText: applicationSearchText,
    sortOptions: COMPANY_SORT_OPTIONS,
    defaultSort: 'company_asc',
  });

  const statusCounts = {
    all: typeApplications.length,
    applied: typeApplications.filter((a) => a.status === 'applied').length,
    shortlisted: typeApplications.filter((a) => a.status === 'shortlisted').length,
    selected: typeApplications.filter((a) => a.status === 'selected').length,
    rejected: typeApplications.filter((a) => a.status === 'rejected').length,
  };

  const handleWithdraw = async (applicationId) => {
    if (typeof window !== 'undefined' && !window.confirm(WITHDRAW_REAPPLY_NOTICE)) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      const cancelEndpoint = type === 'drives' ? '/api/student/applications/cancel' : '/api/student/program-applications/cancel';
      const res = await fetch(cancelEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to withdraw application');
      addToast('Application withdrawn successfully.', 'success');
      setSelectedApp(null);
      await mutate();
      if (type === 'drives') {
        await swrMutate('/api/student/drives');
      }
    } catch (e) {
      addToast(e.message || 'Failed to withdraw application', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const buildCsvRows = (scope) => {
    const dataset = scope === 'full' ? typeApplications : displayApplications;
    const headers = ['Company', 'Role', 'Status', 'Current Stage', 'Applied Date'];
    if (type === 'jobs') headers.push('Drive Date');
    const rows = dataset.map((app) => {
      const row = [
        app.company,
        app.role,
        app.status,
        roundLabel(app),
        formatDate(app.appliedAt),
      ];
      if (type === 'jobs') row.push(formatDate(app.driveDate));
      return row;
    });
    return { headers, rows };
  };

  if (error) return <PageError error={error} />;

  const meta = TYPE_META[type] || TYPE_META.drives;

  const pendingOfferForSelected = useMemo(() => {
    if (!selectedApp || selectedApp.status !== 'selected') return null;
    return findPendingOfferForApplication(offers, selectedApp, { type });
  }, [offers, selectedApp, type]);
  const pageTitle = meta.title;
  const browseHref = meta.browseHref;
  const browseText = meta.browseText;
  const emptyMessage = meta.emptyMessage;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={28} /> My {type === 'hackathons' ? 'Hackathons' : `${pageTitle} Applications`}
          </h1>
          <p>Track the status of your {type === 'hackathons' ? 'hackathon' : type} applications</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <a href={browseHref} className="btn btn-secondary">
            {browseText}
          </a>
          <ExportCsvSplitButton
            filenameBase={`${type}_applications`}
            currentCount={displayApplications.length}
            fullCount={typeApplications.length}
            getRows={buildCsvRows}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs">
        <button className={`tab ${statusTab === '' ? 'active' : ''}`} onClick={() => setStatusTab('')}>All ({statusCounts.all})</button>
        <button className={`tab ${statusTab === 'applied' ? 'active' : ''}`} onClick={() => setStatusTab('applied')}>Applied ({statusCounts.applied})</button>
        <button className={`tab ${statusTab === 'shortlisted' ? 'active' : ''}`} onClick={() => setStatusTab('shortlisted')}>Shortlisted ({statusCounts.shortlisted})</button>
        <button className={`tab ${statusTab === 'selected' ? 'active' : ''}`} onClick={() => setStatusTab('selected')}>Selected ({statusCounts.selected})</button>
        <button className={`tab ${statusTab === 'rejected' ? 'active' : ''}`} onClick={() => setStatusTab('rejected')}>Rejected ({statusCounts.rejected})</button>
      </div>

      {/* Tabular Applications */}
      <div style={{ marginTop: '1.5rem' }}>
        {isLoading && <PageLoading message="Loading applications…" inline />}

        {!isLoading && tabTotalCount > 0 && (
          <DataTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search company, role, or status…"
            sort={sort}
            onSortChange={setSort}
            sortOptions={COMPANY_SORT_OPTIONS}
            filteredCount={filteredCount}
            totalCount={tabTotalCount}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        )}

        {!isLoading && tabTotalCount > 0 && (
          <div className="card card-table-shell">
            <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1rem' }}>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Applied On</th>
                  {type === 'jobs' && <th>Drive Date</th>}
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayApplications.length === 0 ? (
                  <tr>
                    <td colSpan={type === 'jobs' ? 7 : 6} className="text-center text-secondary">
                      No applications match your search.
                    </td>
                  </tr>
                ) : null}
                {displayApplications.map(app => (
                  <tr key={app.id}>
                    <td style={{ paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EntityLogo name={app.company} size="sm" shape="rounded" />
                        <CompanyNameLink name={app.company} website={app.website} className="font-semibold" />
                      </div>
                    </td>
                    <td className="text-sm">{app.role}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(app.status)} badge-dot`}>{formatStatus(app.status)}</span>
                    </td>
                    <td className="text-sm">{roundLabel(app)}</td>
                    <td className="text-sm">{formatDate(app.appliedAt)}</td>
                    {type === 'jobs' && <td className="text-sm">{formatDate(app.driveDate)}</td>}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedApp(app)}
                          title="View details"
                        >
                          <Eye size={14} /> View
                        </button>
                        {app.status === 'applied' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={withdrawingId === app.id}
                            onClick={() => handleWithdraw(app.id)}
                          >
                            {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
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

        {!isLoading && tabTotalCount === 0 && (
          <div className="empty-state-container" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ background: 'var(--primary-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>📝</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {statusTab === '' ? `No ${type} applications yet` : `No ${statusTab} applications`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {statusTab === '' 
                ? emptyMessage 
                : `You don't have any applications in the '${statusTab}' stage at the moment.`}
            </p>
            {statusTab === '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <a href={browseHref} className="btn btn-primary">
                  {browseText}
                </a>
              </div>
            )}
            {statusTab !== '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setStatusTab('')}
                  >
                    View All
                  </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selectedApp && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="animate-fadeIn"
            style={{
              width: '480px', maxWidth: '95vw', height: '100vh',
              background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)',
              overflow: 'auto', padding: '2rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <EntityLogo name={selectedApp.company} size="lg" shape="rounded" />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    <CompanyNameLink name={selectedApp.company} website={selectedApp.website} />
                  </h2>
                  <p className="text-sm text-secondary" style={{ margin: '0.125rem 0 0 0' }}>{selectedApp.role}</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedApp(null)} title="Close">
                <X size={16} />
              </button>
            </div>

            {/* Status */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span className={`badge badge-${getStatusColor(selectedApp.status)} badge-dot`} style={{ fontSize: '0.85rem', padding: '0.375rem 0.75rem' }}>
                {formatStatus(selectedApp.status)}
              </span>
              {selectedApp.status === 'selected' && (
                <span className="badge badge-green" style={{ padding: '0.375rem 1rem', marginLeft: '0.5rem' }}>Offer stage</span>
              )}
            </div>

            {selectedApp.status === 'selected' && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--success-200)',
                  background: 'var(--success-50)',
                }}
              >
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--success-800)' }}>
                  Formal offer — accept or decline
                </p>
                {pendingOfferForSelected ? (
                  <StudentOfferRespondActions
                    offer={pendingOfferForSelected}
                    compact
                    onUpdated={async () => {
                      await mutateOffers();
                      await mutate();
                    }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    No pending offer is linked to this application yet. When your college or employer creates one with status{' '}
                    <strong>pending</strong>, accept and decline buttons will appear here and on{' '}
                    <Link href="/dashboard/student/offers" style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                      My Offers
                    </Link>
                    .
                  </p>
                )}
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Applies to placement offers (jobs, drives, internships, hackathons, and similar) once your college or employer publishes a{' '}
                  <strong>pending</strong> offer. You can also respond from{' '}
                  <Link href="/dashboard/student/offers" style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                    My Offers
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Details grid */}
            <div
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '1rem', padding: '1.25rem',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Stage</div>
                <div className="text-sm font-semibold">{roundLabel(selectedApp)}</div>
              </div>
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Applied On</div>
                <div className="text-sm font-semibold">{formatDate(selectedApp.appliedAt)}</div>
              </div>
              {type === 'jobs' && selectedApp.driveDate && (
                <div>
                  <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Drive Date</div>
                  <div className="text-sm font-semibold">{formatDate(selectedApp.driveDate)}</div>
                </div>
              )}
              {selectedApp.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Notes</div>
                  <div className="text-sm">{selectedApp.notes}</div>
                </div>
              )}
            </div>

            {/* Withdraw */}
            {selectedApp.status === 'applied' && (
              <button
                className="btn btn-danger"
                style={{ width: '100%' }}
                disabled={withdrawingId === selectedApp.id}
                onClick={() => handleWithdraw(selectedApp.id)}
              >
                {withdrawingId === selectedApp.id ? 'Withdrawing...' : 'Withdraw Application'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
