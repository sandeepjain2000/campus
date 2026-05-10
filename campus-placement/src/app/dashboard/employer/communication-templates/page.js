'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { Mail, ArrowLeft, Eye, Pencil, Trash2, X } from 'lucide-react';
import {
  EDITABLE_SYSTEM_EMAIL_TEMPLATE_KEYS,
  SYSTEM_EMAIL_TEMPLATE_META,
} from '@/lib/systemEmailTemplates';

const TEMPLATE_ROWS = EDITABLE_SYSTEM_EMAIL_TEMPLATE_KEYS.map((id) => {
  const meta = SYSTEM_EMAIL_TEMPLATE_META[id];
  return {
    id,
    name: meta?.title || id,
    scope: 'Platform',
    summary: meta?.summary || '',
    placeholders: meta?.placeholders || [],
  };
});

export default function EmployerCommunicationTemplatesPage() {
  const { addToast } = useToast();
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    if (viewRow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewRow]);

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

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="page-header-left">
          <Link
            href="/dashboard/employer/overview"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} />
            Overview
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={22} className="text-primary" aria-hidden />
            Email templates
          </h1>
          <p>
            Platform-managed templates. Use <strong>View</strong> for placeholders and details; editing and deletion are
            limited to PlacementHub administrators.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Scope</th>
              <th>Summary</th>
              <th style={{ width: 1 }} aria-label="Actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {TEMPLATE_ROWS.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.name}</td>
                <td>
                  <span className="badge badge-indigo">{row.scope}</span>
                </td>
                <td className="text-sm text-secondary" style={{ maxWidth: 320 }}>
                  {row.summary}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`View ${row.name}`}
                    title="View details"
                    onClick={() => setViewRow(row)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`Edit ${row.name}`}
                    title="Edit template"
                    onClick={() =>
                      addToast(
                        'Only Super Admins can edit platform templates. Ask your PlacementHub administrator, or use Admin → Communication & Support → Email templates.',
                        'info',
                      )
                    }
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`Delete ${row.name}`}
                    title="Delete template"
                    onClick={() => addToast('System templates cannot be deleted.', 'info')}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewRow ? (
        <div style={modalBackdrop} role="presentation" onClick={() => setViewRow(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tpl-view-title"
            style={{ ...modalPanel, padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  {viewRow.scope}
                </p>
                <h2 id="tpl-view-title" style={{ fontSize: '1.1rem', margin: '0.35rem 0 0' }}>
                  {viewRow.name}
                </h2>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setViewRow(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p className="text-sm text-secondary" style={{ marginTop: 0 }}>
                {viewRow.summary}
              </p>
              <p className="text-sm" style={{ marginBottom: '0.35rem' }}>
                Only <strong>Super Admin</strong> users can change the stored wording (sidebar:{' '}
                <strong>Communication &amp; Support</strong> → <strong>Email templates</strong>).
              </p>
              <p className="text-sm font-medium" style={{ marginBottom: '0.35rem' }}>
                Placeholders (double curly braces in the template)
              </p>
              <code
                className="text-xs"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {viewRow.placeholders.map((p) => `{{${p}}}`).join('  ')}
              </code>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
