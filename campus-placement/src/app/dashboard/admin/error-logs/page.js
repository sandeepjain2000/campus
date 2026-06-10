'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Copy, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import PageError from '@/components/PageError';
import AdminRecordModal from '@/components/admin/AdminRecordModal';
import { useToast } from '@/components/ToastProvider';

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || 'Failed to load error logs');
  return json;
};

const CONTEXT_LABELS = {
  employer_drive_create: 'Employer — create drive',
};

function contextLabel(value) {
  return CONTEXT_LABELS[value] || value || '—';
}

function summaryLine(row) {
  return row.user_message || row.error_message || '—';
}

function formatFullErrorLog(row) {
  const payload = {
    id: row.id,
    created_at: row.created_at,
    severity: row.severity,
    context: row.context,
    status_code: row.status_code,
    error_code: row.error_code,
    user_message: row.user_message,
    error_message: row.error_message,
    ip_address: row.ip_address,
    user_email: row.user_email,
    user_name: row.user_name,
    company_name: row.company_name,
    tenant_name: row.tenant_name,
    details: row.details || {},
  };
  return JSON.stringify(payload, null, 2);
}

export default function AdminErrorLogsPage() {
  const { addToast } = useToast();
  const [contextFilter, setContextFilter] = useState('');
  const query = contextFilter ? `?context=${encodeURIComponent(contextFilter)}` : '';
  const { data, error, isLoading } = useSWR(`/api/admin/error-logs${query}`, fetcher, {
    revalidateOnFocus: false,
  });

  const logs = data?.logs || [];
  const [selected, setSelected] = useState(null);

  const contextOptions = useMemo(() => {
    const fromApi = data?.contexts || [];
    const fromRows = [...new Set(logs.map((l) => l.context).filter(Boolean))];
    return [...new Set([...fromApi, ...fromRows])].sort();
  }, [data?.contexts, logs]);

  const copyFullLog = async () => {
    if (!selected) return;
    const text = formatFullErrorLog(selected);
    try {
      await navigator.clipboard.writeText(text);
      addToast('Full log copied to clipboard', 'success');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        addToast('Full log copied to clipboard', 'success');
      } catch {
        addToast('Could not copy to clipboard', 'error');
      }
    }
  };

  if (error) {
    return <PageError message={error.message} />;
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={22} className="text-primary-600" aria-hidden="true" />
            Platform error logs
          </h1>
          <p className="text-secondary text-sm" style={{ margin: '0.35rem 0 0', maxWidth: '42rem', lineHeight: 1.55 }}>
            Full technical details for failed operations (e.g. placement drive requests). Employers see a short message and reference code; open a row here for stack traces and request payloads.
          </p>
        </div>
        <div className="form-group" style={{ margin: 0, minWidth: '14rem' }}>
          <label className="form-label">Context</label>
          <select className="form-select" value={contextFilter} onChange={(e) => setContextFilter(e.target.value)}>
            <option value="">All contexts</option>
            {contextOptions.map((c) => (
              <option key={c} value={c}>{contextLabel(c)}</option>
            ))}
          </select>
        </div>
      </div>

      {data?.migrationRequired ? (
        <div className="card" style={{ borderColor: 'var(--warning-300, #fcd34d)', marginBottom: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {data.error || 'Run migration 083_platform_error_logs.sql to enable error logging.'}
          </p>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 220, margin: '1rem' }} />
        ) : logs.length === 0 ? (
          <p className="text-secondary" style={{ padding: '1.5rem', margin: 0 }}>
            No error logs recorded yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Context</th>
                  <th>User</th>
                  <th>Campus / company</th>
                  <th>Status</th>
                  <th>Summary</th>
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td className="text-sm">{formatDate(row.created_at)}</td>
                    <td className="text-sm">{contextLabel(row.context)}</td>
                    <td className="text-sm">
                      <div>{row.user_name || '—'}</div>
                      <div className="text-xs text-tertiary">{row.user_email || '—'}</div>
                    </td>
                    <td className="text-sm">
                      <div>{row.company_name || '—'}</div>
                      <div className="text-xs text-tertiary">{row.tenant_name || '—'}</div>
                    </td>
                    <td>
                      <span className={`badge ${row.status_code >= 500 ? 'badge-red' : 'badge-gray'}`}>
                        {row.status_code ?? '—'}
                      </span>
                      {row.error_code ? (
                        <div className="text-xs text-tertiary" style={{ marginTop: '0.2rem' }}>{row.error_code}</div>
                      ) : null}
                    </td>
                    <td className="text-sm" style={{ maxWidth: 280 }}>
                      {summaryLine(row)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="View full log"
                        onClick={() => setSelected(row)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminRecordModal
        title="Error log details"
        mode={selected ? 'view' : null}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <button type="button" className="btn btn-secondary" onClick={() => void copyFullLog()}>
              <Copy size={15} aria-hidden="true" style={{ marginRight: '0.35rem' }} />
              Copy full log
            </button>
          ) : null
        }
      >
        {selected ? (
          <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase' }}>Log ID</div>
              <div className="font-mono text-xs">{selected.id}</div>
            </div>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase' }}>User-facing message</div>
              <div>{selected.user_message || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase' }}>Error message</div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selected.error_message}</div>
            </div>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase' }}>IP address</div>
              <div>{selected.ip_address || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', marginBottom: '0.35rem' }}>Details (JSON)</div>
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  overflow: 'auto',
                  maxHeight: '40vh',
                  fontSize: '0.75rem',
                  lineHeight: 1.45,
                }}
              >
                {JSON.stringify(selected.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </AdminRecordModal>
    </div>
  );
}
