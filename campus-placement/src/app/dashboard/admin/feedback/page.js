'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { formatDate } from '@/lib/utils';
import PageError from '@/components/PageError';

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load feedback');
  return res.json();
});

const STATUSES = ['Submitted', 'Under Review', 'Planned', 'Closed'];

export default function AdminFeedbackInboxPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/feedback', fetcher);

  const items = data?.items || [];

  const counts = useMemo(() => ({
    submitted: items.filter((i) => i.status === 'Submitted').length,
    review: items.filter((i) => i.status === 'Under Review').length,
    planned: items.filter((i) => i.status === 'Planned').length,
    closed: items.filter((i) => i.status === 'Closed').length,
  }), [items]);

  const updateStatus = async (id, status) => {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Update failed');
      return;
    }
    mutate();
  };

  if (error) return <PageError error={error} />;

  if (isLoading || !data) {
    return (
      <div>
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📥 Feedback inbox</h1>
          <p>Every submission from students, employers, and college admins across the platform.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <div className="stats-card">
          <div className="stats-card-value">{counts.submitted}</div>
          <div className="stats-card-label">Submitted</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-value">{counts.review}</div>
          <div className="stats-card-label">Under review</div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-value">{counts.planned}</div>
          <div className="stats-card-label">Planned</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{counts.closed}</div>
          <div className="stats-card-label">Closed</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All entries ({items.length})</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Title</th>
                <th>Category</th>
                <th>From</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="text-sm">{formatDate(row.created_at)}</td>
                  <td>
                    <div className="font-semibold">{row.title}</div>
                    <div className="text-sm text-secondary" style={{ maxWidth: 420, marginTop: '0.25rem', lineHeight: 1.45 }}>
                      {row.description}
                    </div>
                  </td>
                  <td>{row.category}</td>
                  <td className="text-sm">
                    {(row.user_name && row.user_name.trim()) || row.user_email || '—'}
                    {row.user_email ? (
                      <div className="text-xs text-tertiary">{row.user_email}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className="badge badge-gray">{row.user_role || '—'}</span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ minWidth: '140px' }}
                      value={row.status}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="text-sm text-secondary" style={{ padding: '1rem' }}>
            No feedback yet — or the <code>platform_feedback</code> table is not created. Run <code>db/migrations/002_platform_feedback.sql</code>.
          </p>
        )}
      </div>
    </div>
  );
}
