'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';
import { getCollegeStatusMeta } from './internshipRowUtils';

export default function InternshipListingActions({
  row,
  busy,
  onApprove,
  onReject,
  onView,
  align = 'end',
  showView = true,
}) {
  const status = String(row.college_status || 'pending').toLowerCase();
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const campusMeta = getCollegeStatusMeta(row.college_status);

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '0.35rem',
        alignItems: 'center',
        justifyContent: align === 'start' ? 'flex-start' : 'flex-end',
        flexWrap: 'wrap',
      }}
    >
      {isApproved ? (
        <span
          className={`badge ${campusMeta.badge} badge-dot`}
          style={{ fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
        >
          <CheckCircle size={13} aria-hidden style={{ marginRight: '0.25rem' }} />
          Approved for students
        </span>
      ) : null}
      {isPending ? (
        <>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => onApprove(row.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <CheckCircle size={14} aria-hidden />
            {busy ? 'Approving…' : 'Approve for campus'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => onReject(row.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'var(--danger-600)',
              border: '1px solid var(--danger-200)',
            }}
          >
            <XCircle size={14} aria-hidden />
            Reject
          </button>
        </>
      ) : isRejected ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => onApprove(row.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <CheckCircle size={14} aria-hidden />
          {busy ? 'Approving…' : 'Approve for campus'}
        </button>
      ) : null}
      {showView ? (
        <StandardTableIconAction action="view" showLabel={false} onClick={() => onView(row)} />
      ) : null}
    </div>
  );
}
