'use client';

import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Drive & deadline oriented events for students (demo data). */
const events = [
  { date: 15, title: 'TechCorp — PPT + test', type: 'drive' },
  { date: 16, title: 'Infosys — Application deadline', type: 'deadline' },
  { date: 22, title: 'GlobalSoft — Virtual drive', type: 'drive' },
  { date: 24, title: 'TCS — Off-campus venue (Chennai)', type: 'off_campus' },
  { date: 26, title: 'Dussehra — no drives', type: 'holiday' },
];

export default function StudentPlacementCalendarPage() {
  const [currentMonth] = useState(new Date(2026, 8));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📅 Placement calendar</h1>
          <p>See when companies visit, deadlines land, and off-campus venues are scheduled (same view style as the college calendar).</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => alert('Month navigation — wire to state in a later iteration.')}>
            ← Prev
          </button>
          <h3 className="card-title">{monthName}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => alert('Month navigation — wire to state in a later iteration.')}>
            Next →
          </button>
        </div>

        <div className="calendar-grid">
          {DAYS.map((d) => (
            <div key={d} className="calendar-header-cell">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            const dayEvents = day ? events.filter((e) => e.date === day) : [];
            const isToday = day === 13;
            return (
              <div key={i} className={`calendar-cell ${!day ? 'other-month' : ''} ${isToday ? 'today' : ''}`}>
                {day && (
                  <>
                    <div className="calendar-date">{day}</div>
                    {dayEvents.map((ev, j) => (
                      <div key={j} className={`calendar-event ${ev.type === 'off_campus' ? 'drive' : ev.type}`} title={ev.title}>
                        {ev.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-secondary" style={{ marginTop: '1rem' }}>
        Tip: Use <strong>Browse drives</strong> to filter by date range and apply; this calendar is a read-only snapshot for planning.
      </p>
    </div>
  );
}
