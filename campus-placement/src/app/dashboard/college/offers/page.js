'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';

/**
 * Prototype shell — offer tracking / compliance views for production.
 */
export default function CollegeOffersPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={22} aria-hidden /> Offers
          </h1>
          <p className="text-secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem' }}>
            Campus-wide offer roll-ups and policy checks (prototype — data wiring TBD).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          Future: summary of accepted offers, deadlines, and placement-office rules. For now, cross-check with{' '}
          <Link href="/dashboard/college/reports">Reports</Link> and student-facing offer flows when implemented.
        </p>
      </div>
    </div>
  );
}
