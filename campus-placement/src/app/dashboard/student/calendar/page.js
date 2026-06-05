'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { List, CalendarDays, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseEventYmd(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!iso) return null;
  return { y: +iso[1], mo: +iso[2], d: +iso[3] };
}

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load calendar');
  return json;
};

export default function StudentPlacementCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('month'); // list, week, month, year

  const { data, isLoading } = useSWR('/api/student/calendar', fetcher);
  const events = useMemo(() => (Array.isArray(data?.events) ? data.events : []), [data]);

  const goPrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else if (viewMode === 'year') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const goNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else if (viewMode === 'year') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const goToday = () => setCurrentDate(new Date());

  // --- Date Math Helpers ---
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  // For Month View
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = new Date(y, m, 1).getDay();
  const monthCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(d);

  // For Week View
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Events filtered for Day
  const getEventsForDate = (dateObj) => {
    return events.filter((e) => {
      const ymd = parseEventYmd(e.date);
      if (!ymd) return false;
      return ymd.y === dateObj.getFullYear() && ymd.mo === dateObj.getMonth() + 1 && ymd.d === dateObj.getDate();
    });
  };

  const today = new Date();
  const isToday = (dateObj) =>
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate();

  // Title for current view
  let viewTitle = '';
  if (viewMode === 'month') {
    viewTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (viewMode === 'week') {
    const endOfWeek = new Date(weekDays[6]);
    viewTitle = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (viewMode === 'year') {
    viewTitle = y.toString();
  }

  // Common styling for event pills
  const renderEventPill = (ev, i) => (
    <div key={i} className={`calendar-event ${ev.type === 'off_campus' ? 'drive' : ev.type || 'drive'}`} title={ev.title}>
      {ev.title}
    </div>
  );

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} style={{ color: 'var(--primary-500)' }} />
            Placement Calendar
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            See when companies visit, deadlines land, and off-campus venues are scheduled.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
          {[
            { id: 'list', label: 'List', icon: List },
            { id: 'week', label: 'Week', icon: CalendarDays },
            { id: 'month', label: 'Month', icon: CalendarIcon },
            { id: 'year', label: 'Year', icon: LayoutGrid }
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
                background: viewMode === v.id ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === v.id ? 600 : 500, fontSize: '0.85rem',
                boxShadow: viewMode === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <v.icon size={14} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Navigation Header */}
        {viewMode !== 'list' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={goPrev} style={{ padding: '0.4rem' }}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={goNext} style={{ padding: '0.4rem' }}>
                <ChevronRight size={18} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={goToday} style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                Today
              </button>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{viewTitle}</h3>
            <div style={{ width: '100px' }}>{/* spacing balancer */}</div>
          </div>
        )}

        {/* --- LIST VIEW --- */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-default)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Events</h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{events.length} total</div>
            </div>
            {isLoading ? (
              <div className="text-secondary text-sm">Loading...</div>
            ) : events.length === 0 ? (
              <div className="text-secondary text-sm" style={{ padding: '2rem 0', textAlign: 'center' }}>No upcoming events found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {events.sort((a,b) => new Date(a.date) - new Date(b.date)).map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
                    <div style={{ minWidth: '100px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                        {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      {new Date(ev.date).getFullYear() !== today.getFullYear() && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(ev.date).getFullYear()}</div>
                      )}
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-default)', alignSelf: 'stretch' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>{ev.title}</h4>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge badge-${ev.type === 'virtual' ? 'blue' : 'indigo'} badge-dot`} style={{ fontSize: '0.75rem' }}>
                          {ev.type === 'virtual' ? 'Virtual' : 'On-Campus'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {ev.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- WEEK VIEW --- */}
        {viewMode === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
            {weekDays.map((dateObj, i) => {
              const dayEvents = getEventsForDate(dateObj);
              const isCurDay = isToday(dateObj);
              return (
                <div key={i} style={{ background: isCurDay ? 'var(--primary-50)' : 'var(--bg-primary)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{DAYS[dateObj.getDay()]}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: isCurDay ? 700 : 500, color: isCurDay ? 'var(--primary-600)' : 'var(--text-primary)' }}>
                      {dateObj.getDate()}
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {dayEvents.map(renderEventPill)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- MONTH VIEW --- */}
        {viewMode === 'month' && (
          <div className="calendar-grid">
            {DAYS.map((d) => (
              <div key={d} className="calendar-header-cell">
                {d}
              </div>
            ))}
            {monthCells.map((day, i) => {
              const curDateObj = day ? new Date(y, m, day) : null;
              const dayEvents = curDateObj ? getEventsForDate(curDateObj) : [];
              const isCurDay = curDateObj ? isToday(curDateObj) : false;
              return (
                <div key={i} className={`calendar-cell ${!day ? 'other-month' : ''} ${isCurDay ? 'today' : ''}`}>
                  {day && (
                    <>
                      <div className="calendar-date">{day}</div>
                      {dayEvents.map(renderEventPill)}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- YEAR VIEW --- */}
        {viewMode === 'year' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 12 }).map((_, moIndex) => {
              const daysInThisMonth = new Date(y, moIndex + 1, 0).getDate();
              const firstDayOfThisMonth = new Date(y, moIndex, 1).getDay();
              const miniCells = [];
              for (let i = 0; i < firstDayOfThisMonth; i++) miniCells.push(null);
              for (let d = 1; d <= daysInThisMonth; d++) miniCells.push(d);

              return (
                <div key={moIndex} style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '1rem', background: 'var(--bg-secondary)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                    {MONTHS_SHORT[moIndex]}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                    {['S','M','T','W','T','F','S'].map((dl, i) => (
                      <div key={i} style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{dl}</div>
                    ))}
                    {miniCells.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const curDateObj = new Date(y, moIndex, day);
                      const hasEvent = getEventsForDate(curDateObj).length > 0;
                      const isCurDay = isToday(curDateObj);
                      return (
                        <div key={i} style={{
                          aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: isCurDay ? 700 : 500,
                          borderRadius: '50%',
                          background: isCurDay ? 'var(--primary-500)' : hasEvent ? 'var(--primary-100)' : 'transparent',
                          color: isCurDay ? 'white' : hasEvent ? 'var(--primary-700)' : 'var(--text-secondary)',
                          cursor: hasEvent ? 'pointer' : 'default',
                        }} title={hasEvent ? `${getEventsForDate(curDateObj).length} event(s)` : ''}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-sm text-secondary" style={{ marginTop: '1rem' }}>
        Tip: Use <strong>Browse drives</strong> to apply to upcoming events. This calendar is a read-only snapshot for planning.
      </p>
    </div>
  );
}
