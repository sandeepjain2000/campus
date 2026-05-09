'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import PageError from '@/components/PageError';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { ClipboardList, Eye, X } from 'lucide-react';
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

const VALID_TYPES = ['jobs', 'internships', 'projects', 'mentorship', 'hackathons', 'drives'];

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
  const [selectedApp, setSelectedApp] = useState(null);
  const apiEndpoint = type === 'drives' ? '/api/student/applications' : '/api/student/program-applications';
  const { data, error, isLoading, mutate } = useSWR(apiEndpoint, fetcher);
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
      const cancelEndpoint = ['internships', 'projects', 'mentorship', 'hackathons'].includes(type) ? '/api/student/program-applications/cancel' : '/api/student/applications/cancel';
      const res = await fetch(cancelEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to withdraw application');
      addToast('Application withdrawn successfully.', 'success');
      setSelectedApp(null);
      mutate();
    } catch (e) {
      addToast(e.message || 'Failed to withdraw application', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  const buildCsvRows = (scope) => {
    const dataset = scope === 'full' ? typeApplications : filtered;
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

  const pageTitle = type.charAt(0).toUpperCase() + type.slice(1);
  const browseHref = type === 'internships' ? '/dashboard/student/internships' : type === 'projects' ? '/dashboard/student/projects' : '/dashboard/student/drives';
  const browseText = type === 'internships' ? 'Browse Internships' : type === 'projects' ? 'Browse Projects' : 'Browse Active Drives';
  const emptyMessage = type === 'internships' ? "You haven't applied to any internships yet. Start exploring available internships and apply!" : type === 'projects' ? "You haven't applied to any projects yet. Start exploring available projects and apply!" : "You haven't applied to any placement drives yet. Start exploring active drives and apply to kickstart your career!";

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={28} /> My {pageTitle} Applications
          </h1>
          <p>Track the status of your {type} applications</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <a href={browseHref} className="btn btn-secondary">
            {browseText}
          </a>
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

      {/* Tabular Applications */}
      <div style={{ marginTop: '1.5rem' }}>
        {isLoading && (
          <div className="card">
            <div className="text-sm text-secondary">Loading applications…</div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table" style={{ width: '100%' }}>
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
                {filtered.map(app => (
                  <tr key={app.id}>
                    <td style={{ paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EntityLogo name={app.company} size="sm" shape="rounded" />
                        <span className="font-semibold">{app.company}</span>
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
        )}

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
                ? emptyMessage 
                : `You don't have any applications in the '${filter}' stage at the moment.`}
            </p>
            {filter === '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <a href={browseHref} className="btn btn-primary">
                  {browseText}
                </a>
              </div>
            )}
            {filter !== '' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setFilter('')}
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedApp.company}</h2>
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
                <span className="badge badge-green" style={{ padding: '0.375rem 1rem', marginLeft: '0.5rem' }}>🎉 Offer Available</span>
              )}
            </div>

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
