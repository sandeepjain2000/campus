'use client';
import { useState, useCallback } from 'react';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const events = [
  { date: 15, title: 'TechCorp Drive', type: 'drive' },
  { date: 18, title: 'Mid-Term Exams', type: 'exam' },
  { date: 19, title: 'Mid-Term Exams', type: 'exam' },
  { date: 20, title: 'Mid-Term Exams', type: 'exam' },
  { date: 22, title: 'GlobalSoft Drive', type: 'drive' },
  { date: 26, title: 'Dussehra Holiday', type: 'holiday' },
];

export default function CollegeCalendarPage() {
  const { addToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8)); // September 2026

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const cells = [];
  
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const showNotReady = (label) => {
    addToast(`${label} is not available yet in this build.`, 'info');
  };

  const getScheduleCsv = useCallback(
    (_scope) => {
      const headers = ['Month', 'Day', 'Title', 'Type'];
      const rows = events.map((ev) => [
        monthName,
        String(ev.date),
        ev.title,
        ev.type,
      ]);
      return { headers, rows };
    },
    [monthName]
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left"><h1>📅 Placement Calendar</h1><p>Manage academic and placement schedules</p></div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase="interview_schedule"
            currentCount={events.length}
            fullCount={events.length}
            getRows={getScheduleCsv}
          />
          <button className="btn btn-secondary" onClick={() => showNotReady('Add event')}>+ Add Event</button>
          <button className="btn btn-secondary" onClick={() => showNotReady('Block dates')}>+ Block Dates</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(-1)}>← Prev</button>
          <h3 className="card-title">{monthName}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => shiftMonth(1)}>Next →</button>
        </div>

        <div className="calendar-grid">
          {DAYS.map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
          {cells.map((day, i) => {
            const dayEvents = day ? events.filter(e => e.date === day) : [];
            const isToday = day === 13;
            return (
              <div key={i} className={`calendar-cell ${!day ? 'other-month' : ''} ${isToday ? 'today' : ''}`}>
                {day && (
                  <>
                    <div className="calendar-date">{day}</div>
                    {dayEvents.map((ev, j) => (
                      <div key={j} className={`calendar-event ${ev.type}`}>{ev.title}</div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary-100)' }} />
            Placement Drive
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger-100)' }} />
            Exam
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success-100)' }} />
            Holiday
          </div>
        </div>
      </div>
    </div>
  );
}
