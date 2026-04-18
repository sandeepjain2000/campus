'use client';
import { useMemo, useState } from 'react';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { formatDate } from '@/lib/utils';

const myInterviews = [
  {
    id: 1,
    company: 'TCS',
    round: 'Technical Round 1',
    date: '2026-10-01',
    time: '10:30 AM',
    mode: 'Virtual',
    location: 'Microsoft Teams — link on dashboard',
    status: 'Scheduled',
  },
  {
    id: 2,
    company: 'Infosys',
    round: 'HR Round',
    date: '2026-10-02',
    time: '03:00 PM',
    mode: 'On-Campus',
    location: 'CRC Interview Room 204 · Block B',
    status: 'Scheduled',
  },
  {
    id: 3,
    company: 'TechCorp',
    round: 'Coding Interview',
    date: '2026-09-26',
    time: '11:00 AM',
    mode: 'Virtual',
    location: 'HackerRank + Google Meet',
    status: 'Completed',
  },
  {
    id: 4,
    company: 'MegaHire Consortium',
    round: 'Panel — systems',
    date: '2026-10-24',
    time: '09:00 AM',
    mode: 'Off-Campus',
    location: 'Manyata Tech Park, Bengaluru — Gate 3, Tower A, 5th floor',
    status: 'Scheduled',
  },
];

export default function StudentInterviewsPage() {
  const [view, setView] = useState('list');

  const calItems = useMemo(
    () =>
      myInterviews.map((i) => ({
        id: i.id,
        date: i.date,
        title: `${i.company} — ${i.round}`,
        time: i.time,
        meta: `${i.mode} · ${i.location}`,
      })),
    [],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>👨‍🎓 My Interviews</h1>
          <p>Track date, time, company, and interview status.</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle" role="group" aria-label="Interview view">
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              Calendar
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <EmployerCalendarGrid items={calItems} initialYear={2026} initialMonth={8} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Round</th>
                <th>Date</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Location / venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myInterviews.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold">{i.company}</td>
                  <td>{i.round}</td>
                  <td>{formatDate(i.date)}</td>
                  <td>{i.time}</td>
                  <td>{i.mode}</td>
                  <td className="text-sm" style={{ maxWidth: '280px' }}>
                    {i.location}
                  </td>
                  <td>
                    <span className={`badge ${i.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>{i.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
