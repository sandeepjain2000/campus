'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

/**
 * Prototype shell — wire to placement applications API / shared views before production.
 */
export default function CollegeApplicationsPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={22} aria-hidden /> Applications
          </h1>
          <p className="text-secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem' }}>
            Review and manage student applications across drives (prototype — data wiring TBD).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          This section is reserved for a consolidated <strong>college-side applications</strong> view (filters by drive,
          company, department). Until then, use{' '}
          <Link href="/dashboard/college/students">Students</Link> and{' '}
          <Link href="/dashboard/college/drives">Placement Drives</Link> for related workflows.
        </p>
      </div>
    </div>
  );
}
