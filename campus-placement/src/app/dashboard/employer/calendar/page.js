'use client';
import { useCallback, useState } from 'react';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { formatDate } from '@/lib/utils';

const seedEvents = [
  { id: 1, title: 'Pre-placement Talk - IITM', date: '2026-10-04', time: '11:00 AM', type: 'Event', mode: 'Hybrid' },
  { id: 2, title: 'Round 1 Interviews - TCS', date: '2026-10-05', time: '10:00 AM', type: 'Interview', mode: 'Virtual' },
  { id: 3, title: 'Offer Release - NIT Trichy', date: '2026-10-06', time: '05:00 PM', type: 'Milestone', mode: 'Online' },
];

export default function EmployerCalendarPage() {
  const [events] = useState(seedEvents);
  const [view, setView] = useState('list');

  const getCalendarCsv = useCallback(
    (_scope) => ({
      headers: ['Title', 'Date', 'Time', 'Type', 'Mode'],
      rows: events.map((e) => [e.title, e.date, e.time, e.type, e.mode]),
    }),
    [events],
  );

  const calItems = events.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    time: e.time,
    meta: `${e.type} · ${e.mode}`,
  }));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📅 Employer Events Calendar</h1>
          <p>Manage company events, interviews, and milestones.</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase="employer_events"
            currentCount={events.length}
            fullCount={events.length}
            getRows={getCalendarCsv}
          />
          <button className="btn btn-primary">+ Add Event</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>
            View
          </span>
          <div className="view-toggle" role="group" aria-label="View mode">
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              Calendar
            </button>
          </div>
          <span className="text-sm text-secondary" style={{ marginLeft: 'auto' }}>
            {events.length} events
          </span>
        </div>
      </div>

      {view === 'calendar' ? (
        <EmployerCalendarGrid items={calItems} initialYear={2026} initialMonth={9} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="font-semibold">{e.title}</td>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.time}</td>
                  <td>
                    <span className="badge badge-blue">{e.type}</span>
                  </td>
                  <td>{e.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
