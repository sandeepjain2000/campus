'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import PageError from '@/components/PageError';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { ClipboardList } from 'lucide-react';
import { notFound } from 'next/navigation';

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

const VALID_TYPES = ['jobs', 'internships', 'projects', 'mentorship', 'hackathons'];

import { use } from 'react';

export default function StudentApplicationsPage({ params }) {
  const unwrappedParams = use(params);
  const type = unwrappedParams.type;

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const { addToast } = useToast();
  const [filter, setFilter] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);
  const { data, error, isLoading, mutate } = useSWR('/api/student/applications', fetcher);
  const allApplications = data?.items || [];

  const appTypeOf = (app) => {
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
    hackathons: 'hackathon'
  }[type];

  const typeApplications = useMemo(() => {
    return allApplications.filter(a => appTypeOf(a) === typeMatcher);
  }, [allApplications, typeMatcher]);

  const filtered = useMemo(
    () =>
      typeApplications.filter((a) => {
        if (filter && a.status !== filter) return false;
        return true;
      }),
    [typeApplications, filter],
  );

  const statusCounts = {
    all: typeApplications.length,
    applied: typeApplications.filter((a) => a.status === 'applied').length,
    shortlisted: typeApplications.filter((a) => a.status === 'shortlisted').length,
    selected: typeApplications.filter((a) => a.status === 'selected').length,
    rejected: typeApplications.filter((a) => a.status === 'rejected').length,
  };

  const handleWithdraw = async (applicationId) => {
    setWithdrawingId(applicationId);
    try {
      const res = await fetch('/api/student/applications/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to withdraw application');
      addToast('Application withdrawn successfully.', 'success');
      mutate();
    } catch (e) {
      addToast(e.message || 'Failed to withdraw application', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const buildCsvRows = (scope) => {
    const dataset = scope === 'full' ? typeApplications : filtered;
    const headers = ['Company', 'Role', 'Status', 'Current Stage', 'Drive Date', 'Applied Date'];
    const rows = dataset.map((app) => [
      app.company,
      app.role,
      app.status,
      roundLabel(app),
      formatDate(app.driveDate),
      formatDate(app.appliedAt)
    ]);
    return { headers, rows };
  };

  if (error) return <PageError error={error} />;

  const pageTitle = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={28} /> My {pageTitle} Applications
          </h1>
          <p>Track the status of your {type} applications</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase={`${type}_applications`}
            currentCount={filtered.length}
            fullCount={typeApplications.length}
            getRows={buildCsvRows}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs">
        <button className={`tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All ({statusCounts.all})</button>
        <button className={`tab ${filter === 'applied' ? 'active' : ''}`} onClick={() => setFilter('applied')}>Applied ({statusCounts.applied})</button>
        <button className={`tab ${filter === 'shortlisted' ? 'active' : ''}`} onClick={() => setFilter('shortlisted')}>Shortlisted ({statusCounts.shortlisted})</button>
        <button className={`tab ${filter === 'selected' ? 'active' : ''}`} onClick={() => setFilter('selected')}>Selected ({statusCounts.selected})</button>
        <button className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({statusCounts.rejected})</button>
      </div>

      {/* Application Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {isLoading && (
          <div className="card">
            <div className="text-sm text-secondary">Loading applications…</div>
          </div>
        )}
        {filtered.map(app => (
          <div key={app.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <EntityLogo name={app.company} size="md" shape="rounded" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{app.company}</h3>
                    <span className={`badge badge-${getStatusColor(app.status)} badge-dot`}>{formatStatus(app.status)}</span>
                  </div>
                  <p className="text-sm text-secondary" style={{ marginTop: '0.125rem' }}>{app.role}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-tertiary">Applied on</div>
                <div className="text-sm font-semibold">{formatDate(app.appliedAt)}</div>
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
              <div className="text-xs font-semibold text-secondary" style={{ marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current stage
              </div>
              <div className="text-sm" style={{ fontWeight: 600 }}>
                {roundLabel(app)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span className="text-sm text-tertiary">Drive Date: {formatDate(app.driveDate)}</span>
              {app.status === 'applied' && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={withdrawingId === app.id}
                  onClick={() => handleWithdraw(app.id)}
                >
                  {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                </button>
              )}
              {app.status === 'selected' && (
                <span className="badge badge-green" style={{ padding: '0.375rem 1rem' }}>🎉 Offer Available</span>
              )}
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="empty-state-container" style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ background: 'var(--primary-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>📝</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {filter === '' ? `No ${type} applications yet` : `No ${filter} applications`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {filter === '' 
                ? "You haven't applied to any placement drives yet. Start exploring active drives and apply to kickstart your career!" 
                : `You don't have any applications in the '${filter}' stage at the moment.`}
            </p>
            {filter === '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <a href="/dashboard/student/drives" className="btn btn-primary">
                  Browse Active Drives
                </a>
              </div>
            )}
            {filter !== '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setFilter('');
                    }}
                  >
                    View All
                  </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
