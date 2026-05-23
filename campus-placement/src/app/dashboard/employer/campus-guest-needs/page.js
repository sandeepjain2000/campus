'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { Eye, Send, X } from 'lucide-react';

const KIND_LABEL = {
  guest_faculty: 'Guest faculty',
  guest_lecture: 'Guest lecture / session',
};

function truncate(s, n) {
  if (s == null || s === '') return '—';
  const t = String(s);
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export default function EmployerCampusGuestNeedsPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  /** @type {'' | 'pending' | 'sent' | 'unavailable'} */
  const [confirmationFilter, setConfirmationFilter] = useState('');
  /** @type {'' | 'guest_faculty' | 'guest_lecture'} */
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/employer/engagement-listings');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setRows(Array.isArray(json.listings) ? json.listings : []);
    } catch (e) {
      setError(e.message || 'Failed');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (viewItem || confirmItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewItem, confirmItem]);

  /** @param {typeof rows[0]} item */
  const confirmationStatus = (item) => {
    if (item.confirmationSentAt) return 'sent';
    if (!item.canConfirm) return 'unavailable';
    return 'pending';
  };

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (typeFilter && item.kind !== typeFilter) return false;
      if (!confirmationFilter) return true;
      return confirmationStatus(item) === confirmationFilter;
    });
  }, [rows, confirmationFilter, typeFilter]);

  const openConfirm = async (item) => {
    setConfirmItem(item);
    setMailTo('');
    setMailSubject('');
    setMailBody('');
    setDraftLoading(true);
    try {
      const res = await fetch(`/api/employer/engagement-listings/${item.id}/confirmation-draft`);
      const json = await res.json();
      if (res.status === 409) {
        addToast(json.error || 'Already sent', 'info');
        setConfirmItem(null);
        await load();
        return;
      }
      if (!res.ok) throw new Error(json?.error || 'Could not load draft');
      setMailTo(json.toEmail || '');
      setMailSubject(json.subject || '');
      setMailBody(json.body || '');
    } catch (e) {
      addToast(e.message || 'Failed', 'error');
      setConfirmItem(null);
    } finally {
      setDraftLoading(false);
    }
  };

  const sendConfirmation = async () => {
    if (!confirmItem) return;
    setSending(true);
    try {
      const res = await fetch(`/api/employer/engagement-listings/${confirmItem.id}/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: mailSubject, body: mailBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Send failed');
      addToast(`Email sent to ${json.toEmail || mailTo}.`, 'success');
      setConfirmItem(null);
      await load();
    } catch (e) {
      addToast(e.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const modalBackdrop = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  };

  const modalPanel = {
    background: 'var(--bg-elevated)',
    borderRadius: '12px',
    maxWidth: 560,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    border: '1px solid var(--border-default)',
  };

  const confirmPanel = {
    ...modalPanel,
    maxWidth: 640,
  };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Campus guest needs</h1>
          <p>Colleges publish guest faculty and lecture requirements here. Confirm interest to email the college directly.</p>
        </div>
        <Link href="/dashboard/employer/overview" className="btn btn-secondary btn-sm">
          Overview
        </Link>
      </div>

      {error ? (
        <p className="text-secondary">{error}</p>
      ) : loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : (
        <>
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-secondary" style={{ whiteSpace: 'nowrap' }}>Confirmation</span>
              <select
                className="form-select"
                style={{ minWidth: 200 }}
                value={confirmationFilter}
                onChange={(e) => setConfirmationFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Ready to confirm</option>
                <option value="sent">Sent</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
            <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-secondary" style={{ whiteSpace: 'nowrap' }}>Type</span>
              <select
                className="form-select"
                style={{ minWidth: 200 }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                <option value="guest_lecture">{KIND_LABEL.guest_lecture}</option>
                <option value="guest_faculty">{KIND_LABEL.guest_faculty}</option>
              </select>
            </label>
            <span className="text-xs text-secondary" style={{ marginLeft: 'auto' }}>
              Showing {filteredRows.length} of {rows.length}
            </span>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>College</th>
                <th>Type</th>
                <th>Title</th>
                <th>Summary</th>
                <th>Timing</th>
                <th>Posted</th>
                <th>Confirmation</th>
                <th style={{ width: 1 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => {
                const sent = Boolean(item.confirmationSentAt);
                const canSend = item.canConfirm && !sent;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-semibold">{item.college?.name || '—'}</div>
                      <div className="text-xs text-secondary">
                        {[item.college?.city, item.college?.state].filter(Boolean).join(', ') || ''}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-indigo">{KIND_LABEL[item.kind] || item.kind}</span>
                    </td>
                    <td className="font-medium">{item.title}</td>
                    <td className="text-sm text-secondary" style={{ maxWidth: 220 }}>
                      {truncate(item.summary, 100)}
                    </td>
                    <td className="text-sm">{truncate(item.timeHint, 40)}</td>
                    <td className="text-sm text-secondary">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {sent ? (
                        <span className="badge badge-green">
                          Sent {new Date(item.confirmationSentAt).toLocaleDateString()}
                        </span>
                      ) : !item.canConfirm ? (
                        <span className="badge badge-gray" title="College has no contact email on file">
                          Unavailable
                        </span>
                      ) : (
                        <span className="text-secondary text-sm">—</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setViewItem(item)}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        disabled={!canSend}
                        title={
                          sent
                            ? 'Already confirmed'
                            : !item.canConfirm
                              ? 'College contact email missing'
                              : 'Send confirmation email'
                        }
                        onClick={() => void openConfirm(item)}
                      >
                        <Send size={14} /> Confirm
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-secondary">
                    No published campus needs right now.
                  </td>
                </tr>
              ) : null}
              {rows.length > 0 && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-secondary">
                    No listings match your filters. Try &quot;All&quot; or a different status.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </>
      )}

      {viewItem ? (
        <div style={modalBackdrop} role="presentation" onClick={() => setViewItem(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-view-title"
            style={{ ...modalPanel, padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  {viewItem.college?.name}
                  {viewItem.college?.city ? ` · ${viewItem.college.city}` : ''}
                </p>
                <h2 id="guest-view-title" style={{ fontSize: '1.15rem', margin: '0.35rem 0' }}>
                  {viewItem.title}
                </h2>
                <span className="badge badge-indigo">{KIND_LABEL[viewItem.kind] || viewItem.kind}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setViewItem(null)}>
                <X size={18} />
              </button>
            </div>
            {viewItem.summary ? (
              <p style={{ marginTop: '1rem' }}>{viewItem.summary}</p>
            ) : null}
            {viewItem.requirements ? (
              <div style={{ marginTop: '0.75rem' }}>
                <strong className="text-sm">Requirements</strong>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                  {viewItem.requirements}
                </p>
              </div>
            ) : null}
            {viewItem.timeHint ? (
              <p className="text-sm text-secondary" style={{ marginTop: '0.75rem' }}>
                <strong>Timing:</strong> {viewItem.timeHint}
              </p>
            ) : null}
            <p className="text-xs text-secondary" style={{ marginTop: '1rem' }}>
              Posted {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>
      ) : null}

      {confirmItem ? (
        <div style={modalBackdrop} role="presentation" onClick={() => !sending && setConfirmItem(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-confirm-title"
            style={{ ...confirmPanel, padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h2 id="guest-confirm-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                  Send confirmation email
                </h2>
                <p className="text-sm text-secondary" style={{ margin: '0.35rem 0 0' }}>
                  {confirmItem.college?.name} — {confirmItem.title}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Close"
                disabled={sending}
                onClick={() => setConfirmItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            {draftLoading ? (
              <p className="text-secondary" style={{ marginTop: '1rem' }}>
                Loading template…
              </p>
            ) : (
              <>
                <p className="text-sm" style={{ marginTop: '1rem' }}>
                  <strong>To:</strong>{' '}
                  <code style={{ fontSize: '0.85rem' }}>{mailTo}</code>
                </p>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Subject</label>
                  <input
                    className="form-input"
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input"
                    rows={14}
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    disabled={sending}
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Subject and body use your employer template (Communication templates) or the platform default. Edit
                  before sending.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" disabled={sending} onClick={() => void sendConfirmation()}>
                    {sending ? 'Sending…' : 'Send email'}
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={sending} onClick={() => setConfirmItem(null)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
