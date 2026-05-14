'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { getInitials, timeAgo } from '@/lib/utils';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
  return data;
};

async function invalidateAllNotificationCaches(mutate, globalMutate) {
  await mutate();
  await globalMutate((k) => typeof k === 'string' && k.startsWith('/api/notifications'));
}

export default function AlertsEmailPage() {
  const { addToast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  const [mailbox, setMailbox] = useState('inbox');
  const swrKey = `/api/notifications?mailbox=${encodeURIComponent(mailbox)}`;
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher);
  const emails = useMemo(
    () =>
      Array.isArray(data?.notifications)
        ? data.notifications.map((n) => ({
            id: n.id,
            sender: n.type ? `System ${n.type}` : 'Placement Portal',
            subject: n.title || 'Notification',
            snippet: n.message || '',
            time: timeAgo(n.created_at),
            read: Boolean(n.is_read),
          }))
        : [],
    [data],
  );
  const [openEmailId, setOpenEmailId] = useState(null);

  const moveToTrash = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashIds: [id] }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not move to trash');
      setOpenEmailId((cur) => (cur === id ? null : cur));
      addToast('Moved to Trash.', 'success');
      await invalidateAllNotificationCaches(mutate, globalMutate);
    } catch (e) {
      addToast(e.message || 'Could not move to trash.', 'warning');
    }
  };

  const restoreFromTrash = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoreIds: [id] }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not restore');
      setOpenEmailId((cur) => (cur === id ? null : cur));
      addToast('Restored to Inbox.', 'success');
      await invalidateAllNotificationCaches(mutate, globalMutate);
    } catch (e) {
      addToast(e.message || 'Could not restore.', 'warning');
    }
  };

  const deleteForever = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not delete');
      setOpenEmailId((cur) => (cur === id ? null : cur));
      addToast('Alert deleted permanently.', 'success');
      await invalidateAllNotificationCaches(mutate, globalMutate);
    } catch (e) {
      addToast(e.message || 'Could not delete.', 'warning');
    }
  };

  const emptyTrash = async () => {
    if (!window.confirm('Permanently delete all alerts in Trash? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emptyTrash: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not empty trash');
      setOpenEmailId(null);
      addToast('Trash emptied.', 'success');
      await invalidateAllNotificationCaches(mutate, globalMutate);
    } catch (e) {
      addToast(e.message || 'Could not empty trash.', 'warning');
    }
  };

  const handleOpen = async (id) => {
    setOpenEmailId(openEmailId === id ? null : id);
    if (mailbox !== 'inbox') return;
    const row = emails.find((e) => e.id === id);
    if (row?.read) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        await invalidateAllNotificationCaches(mutate, globalMutate);
      }
    } catch {
      // Keep drawer behavior even if marking as read fails.
    }
  };

  if (isLoading) {
    return <div className="skeleton skeleton-card" style={{ height: 240, margin: '2rem' }} />;
  }

  if (error) {
    return (
      <div className="animate-fadeIn" style={{ padding: '2rem', color: 'var(--danger-600)' }}>
        <p>{error.message || 'Could not load inbox alerts.'}</p>
      </div>
    );
  }

  return (
    <div
      className="animate-fadeIn alerts-inbox-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
        maxHeight: 'calc(100dvh - var(--topbar-height) - 3rem)',
      }}
    >
      <div className="page-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div className="page-header-left">
          <h1>📨 Inbox & Alerts</h1>
          <p>
            {mailbox === 'inbox'
              ? 'System notifications, event coordination, and alerts.'
              : 'Alerts in Trash are removed from your inbox. Restore or delete them permanently.'}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {mailbox === 'trash' && emails.length > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={emptyTrash}>
              Empty trash
            </button>
          ) : null}
          <button className="btn btn-primary" disabled title="Coming soon">
            Compose Alert
          </button>
        </div>
      </div>

      <div
        className="card alerts-inbox-card"
        style={{
          flex: 1,
          minHeight: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        <div
          className="alerts-inbox-nav"
          style={{
            width: 'min(250px, 36vw)',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'var(--bg-secondary)',
            overflowY: 'auto',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              justifyContent: 'flex-start',
              background: mailbox === 'inbox' ? 'var(--primary-100)' : undefined,
              color: mailbox === 'inbox' ? 'var(--primary-700)' : 'var(--text-secondary)',
              fontWeight: mailbox === 'inbox' ? 600 : 400,
            }}
            onClick={() => {
              setMailbox('inbox');
              setOpenEmailId(null);
            }}
          >
            📥 Inbox{' '}
            <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
              {Number(data?.unreadCount || 0)}
            </span>
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} disabled title="Coming soon">
            ⭐ Starred
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} disabled title="Coming soon">
            📤 Sent
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              justifyContent: 'flex-start',
              background: mailbox === 'trash' ? 'var(--primary-100)' : undefined,
              color: mailbox === 'trash' ? 'var(--primary-700)' : 'var(--text-secondary)',
              fontWeight: mailbox === 'trash' ? 600 : 400,
            }}
            onClick={() => {
              setMailbox('trash');
              setOpenEmailId(null);
            }}
          >
            🗑️ Trash
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {emails.map((email) => (
            <div key={email.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                className="hover-bg-secondary"
                onClick={() => handleOpen(email.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  background: mailbox === 'inbox' && !email.read ? 'white' : 'var(--bg-secondary)',
                  fontWeight: mailbox === 'inbox' && !email.read ? 700 : 400,
                }}
              >
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  <input type="checkbox" onClick={(e) => e.stopPropagation()} aria-label="Select (coming soon)" />
                </div>
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>⭐</div>
                <div style={{ flex: '1 1 140px', minWidth: '120px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{email.sender}</div>
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{email.subject}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {email.snippet}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  {mailbox === 'inbox' ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label="Move to trash"
                      title="Move to trash"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveToTrash(email.id);
                      }}
                    >
                      <Trash2 size={18} strokeWidth={2} aria-hidden />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Restore to inbox"
                        title="Restore to inbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreFromTrash(email.id);
                        }}
                      >
                        <RotateCcw size={18} strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Delete permanently"
                        title="Delete permanently"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Permanently delete this alert?')) deleteForever(email.id);
                        }}
                      >
                        <Trash2 size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </>
                  )}
                </div>
                <div
                  style={{
                    flex: '0 0 80px',
                    textAlign: 'right',
                    fontSize: '0.8rem',
                    color: mailbox === 'inbox' && !email.read ? 'var(--primary-600)' : 'var(--text-secondary)',
                  }}
                >
                  {email.time}
                </div>
              </div>

              {openEmailId === email.id && (
                <div style={{ padding: '2rem 4rem', background: 'var(--card-bg)', borderBottom: '2px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{email.subject}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {mailbox === 'inbox' ? (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveToTrash(email.id)}>
                          Move to trash
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => restoreFromTrash(email.id)}>
                            Restore to inbox
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (window.confirm('Permanently delete this alert?')) deleteForever(email.id);
                            }}
                          >
                            Delete permanently
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="avatar">{getInitials(email.sender)}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {email.sender}
                        {data?.notificationSenderEmail ? (
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                            {' '}
                            &lt;{data.notificationSenderEmail}&gt;
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> (in-app notification)</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>to me</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{email.time}</div>
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {email.snippet}
                    {'\n\n'}
                    Log into your dashboard to take action on this alert.
                    {'\n\n'}
                    --{'\n'}
                    PlacementHub Auto-Mailer
                  </div>
                </div>
              )}
            </div>
          ))}
          {emails.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
              {mailbox === 'trash' ? 'Trash is empty.' : 'No alerts yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
