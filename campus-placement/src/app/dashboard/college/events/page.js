'use client';

import Link from 'next/link';
import { PartyPopper, CalendarDays } from 'lucide-react';

/**
 * Placeholder — can merge with Calendar or pull a dedicated events feed later.
 */
export default function CollegeEventsPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PartyPopper size={22} aria-hidden /> Events
          </h1>
          <p className="text-secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem' }}>
            Talks, pre-placement sessions, and campus events (prototype).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <CalendarDays size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} aria-hidden />
          <span>
            In this build, scheduling is shown on{' '}
            <Link href="/dashboard/college/calendar">Calendar</Link>. You can later merge “Events” into that view or add a
            dedicated feed here without changing the menu labels.
          </span>
        </p>
      </div>
    </div>
  );
}
