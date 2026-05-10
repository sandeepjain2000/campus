'use client';

import { useMemo, useState } from 'react';
import useSWR, { mutate as mutateByKey } from 'swr';
import { formatDate, formatFeedbackRole } from '@/lib/utils';
import PageError from '@/components/PageError';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 500;

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to load feedback');
  return res.json();
});

const STATUSES = ['Submitted', 'Under Review', 'Planned', 'Closed'];

export default function AdminFeedbackInboxPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const listKey = `/api/feedback?page=${page}&pageSize=${PAGE_SIZE}`;
  const exportKey = `/api/feedback?page=1&pageSize=${EXPORT_PAGE_SIZE}`;

  const { data, error, isLoading, mutate } = useSWR(listKey, fetcher);
  const { data: exportData } = useSWR(exportKey, fetcher, { revalidateOnFocus: false });

  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadData, setThreadData] = useState(null);

  const items = data?.items || [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusCounts = data?.statusCounts;

  const counts = useMemo(() => ({
    submitted: statusCounts?.Submitted ?? 0,
    review: statusCounts?.['Under Review'] ?? 0,
    planned: statusCounts?.Planned ?? 0,
    closed: statusCounts?.Closed ?? 0,
  }), [statusCounts]);

  const refreshLists = () => {
    mutate();
    mutateByKey(exportKey);
  };

  const updateStatus = async (id, status) => {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      addToast(j.error || 'Update failed', 'warning');
      return;
    }
    refreshLists();
  };

  const openThread = async (id) => {
    setSelectedId(id);
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/feedback/${id}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(body.error || 'Could not load feedback thread', 'warning');
        return;
      }
      setThreadData(body);
    } catch {
      addToast('Network error while loading thread', 'warning');
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`/api/feedback/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(body.error || 'Reply failed', 'warning');
        return;
      }
      setReplyText('');
      addToast('Reply posted.', 'info');
      await Promise.all([refreshLists(), openThread(selectedId)]);
    } catch {
      addToast('Network error while posting reply', 'warning');
    } finally {
      setReplyLoading(false);
    }
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

  const buildExportRows = (rows) => {
    const headers = ['When', 'Title', 'Category', 'From', 'Organization', 'Role', 'Replies', 'Status'];
    const rowsList = rows.map((row) => [
      formatDate(row.created_at),
      row.title,
      row.category,
      (row.user_name && row.user_name.trim()) || row.user_email || '—',
      row.organization_name || '—',
      formatFeedbackRole(row.user_role),
      String(row.reply_count || 0),
      row.status,
    ]);
    return { headers, rows: rowsList };
  };

  const getExportRows = (scope) => {
    if (scope === 'full') {
      const rows = exportData?.items || items;
      return buildExportRows(rows);
    }
    return buildExportRows(items);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📥 Feedback inbox</h1>
          <p>Every submission from students, employers, and college admins across the platform.</p>
        </div>
        <ExportCsvSplitButton
          filenameBase="admin_feedback"
          currentCount={items.length}
          fullCount={total}
          getRows={getExportRows}
        />
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
          <h3 className="card-title">
            All entries ({total}
            {total > 0 ? ` · page ${page} of ${totalPages}` : ''}
            )
          </h3>
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
                <th>Replies</th>
                <th>Status</th>
                <th>Discussion</th>
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
                    <div>{(row.user_name && row.user_name.trim()) || '—'}</div>
                    {row.user_email ? (
                      <div className="text-xs text-tertiary">{row.user_email}</div>
                    ) : null}
                    <div className="text-xs text-secondary" style={{ marginTop: '0.2rem' }}>
                      {row.organization_name || '—'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{formatFeedbackRole(row.user_role)}</span>
                  </td>
                  <td>
                    {Number(row.reply_count || 0) > 0 ? (
                      <span className="badge badge-green">{row.reply_count} replied</span>
                    ) : (
                      <span className="badge badge-gray">No reply</span>
                    )}
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
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openThread(row.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <span className="text-sm text-secondary">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {items.length === 0 && (
          <p className="text-sm text-secondary" style={{ padding: '1rem' }}>
            No feedback yet — or the <code>platform_feedback</code> table is not created. Run <code>db/migrations/002_platform_feedback.sql</code>.
          </p>
        )}
      </div>

      {selectedId && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-header">
            <h3 className="card-title">Feedback discussion track</h3>
          </div>
          {threadLoading && <p className="text-sm text-secondary">Loading thread…</p>}
          {!threadLoading && threadData?.item && (
            <>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div>
                    <div className="font-semibold">{threadData.item.title}</div>
                    <div className="text-sm text-secondary">{threadData.item.description}</div>
                    {threadData.item.organization_name ? (
                      <div className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                        {threadData.item.organization_name}
                        {' · '}
                        {formatFeedbackRole(threadData.item.user_role)}
                      </div>
                    ) : null}
                  </div>
                  <span className="badge badge-amber">{threadData.item.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {(threadData.replies || []).map((r) => (
                  <div key={r.id} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.75rem' }}>
                    <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{r.message}</div>
                    <div className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                      {(r.author_name && r.author_name.trim()) || r.author_email || 'Super Admin'} · {formatDate(r.created_at)}
                    </div>
                  </div>
                ))}
                {(threadData.replies || []).length === 0 && (
                  <p className="text-sm text-secondary">No replies yet. Send the first response.</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Reply as Super Admin</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Type your reply to the feedback submitter..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={sendReply}
                  disabled={replyLoading || !replyText.trim()}
                >
                  {replyLoading ? 'Sending…' : 'Reply'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
