'use client';

import { Eye, Pencil, Trash2, Archive, Plus, CheckCircle, XCircle, Download, Mail, Users, FileText, Settings } from 'lucide-react';

const META = {
  view: { label: 'View', Icon: Eye },
  edit: { label: 'Edit', Icon: Pencil },
  delete: { label: 'Delete', Icon: Trash2 },
  archive: { label: 'Archive', Icon: Archive },
  add: { label: 'Add', Icon: Plus },
  approve: { label: 'Approve for campus', Icon: CheckCircle },
  reject: { label: 'Reject', Icon: XCircle },
  download: { label: 'Download', Icon: Download },
  email: { label: 'Email', Icon: Mail },
  sync: { label: 'Sync', Icon: Users },
  details: { label: 'Details', Icon: FileText },
  manage: { label: 'Manage', Icon: Settings },
};

/**
 * @param {object} props
 * @param {'view'|'edit'|'delete'|'archive'|'add'|'approve'|'reject'|'download'|'email'|'sync'|'details'|'manage'} props.action
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {'secondary'|'danger'|'primary'|'ghost'} [props.variant]
 * @param {boolean} [props.showLabel] — when false, icon-only (title + aria-label still the canonical verb).
 * @param {string} [props.className]
 * @param {import('react').CSSProperties} [props.style]
 * @param {string} [props.tooltip] — overrides title and aria-label (e.g. "Coming soon" on disabled actions).
 */
export function StandardTableIconAction({
  action,
  onClick,
  disabled,
  variant = 'secondary',
  showLabel = false,
  className = '',
  style,
  tooltip,
}) {
  const def = META[action];
  if (!def) return null;
  const { label, Icon } = def;
  const tip = tooltip ?? label;
  const aria = tooltip ? `${label} — ${tooltip}` : label;
  const variantClass =
    variant === 'danger'
      ? 'btn-danger'
      : variant === 'primary'
        ? 'btn-primary'
        : variant === 'ghost'
          ? 'btn-ghost'
          : 'btn-secondary';
  const layout = showLabel ? 'btn-sm' : 'btn-icon btn-sm';
  return (
    <button
      type="button"
      className={`btn ${variantClass} ${layout} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? '0.35rem' : undefined,
        ...style,
      }}
      onClick={onClick ?? (() => {})}
      disabled={disabled}
      title={tip}
      aria-label={aria}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
