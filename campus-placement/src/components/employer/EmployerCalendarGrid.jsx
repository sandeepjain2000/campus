'use client';

import { useMemo, useState, useEffect } from 'react';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getEventColor(type) {
  if (type === 'completed') return { bg: 'var(--green-100)', text: 'var(--green-700)', border: 'var(--green-200)' };
  if (type === 'approved') return { bg: 'var(--blue-100)', text: 'var(--blue-700)', border: 'var(--blue-200)' };
  return { bg: 'var(--gray-100)', text: 'var(--gray-700)', border: 'var(--gray-200)' };
}

/** @param {{ id: string|number, date: string, title: string, time?: string, meta?: string, type?: string }} items */
export function EmployerCalendarGrid({ items, initialYear, initialMonth, viewMode = 'month', onCursorChange, onChangeView }) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => ({
    y: initialYear ?? now.getFullYear(),
    m: initialMonth ?? now.getMonth(),
    d: now.getDate()
  }));

  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      setCursor(c => ({ ...c, y: initialYear, m: initialMonth }));
    }
  }, [initialYear, initialMonth]);

  const updateCursor = (ny, nm, nd = 1) => {
    setCursor({ y: ny, m: nm, d: nd });
    if (onCursorChange) onCursorChange(ny, nm);
  };

  const byDay = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = (it.date || '').slice(0, 10);
      if (!k || k.length < 10) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    return map;
  }, [items]);

  const { y, m, d } = cursor;

  const prev = () => {
    if (viewMode === 'year') {
      updateCursor(y - 1, m, d);
    } else if (viewMode === 'week') {
      const current = new Date(y, m, d);
      current.setDate(current.getDate() - 7);
      updateCursor(current.getFullYear(), current.getMonth(), current.getDate());
    } else {
      let nm = m - 1;
      let ny = y;
      if (nm < 0) {
        nm = 11;
        ny -= 1;
      }
      updateCursor(ny, nm, d);
    }
  };

  const next = () => {
    if (viewMode === 'year') {
      updateCursor(y + 1, m, d);
    } else if (viewMode === 'week') {
      const current = new Date(y, m, d);
      current.setDate(current.getDate() + 7);
      updateCursor(current.getFullYear(), current.getMonth(), current.getDate());
    } else {
      let nm = m + 1;
      let ny = y;
      if (nm > 11) {
        nm = 0;
        ny += 1;
      }
      updateCursor(ny, nm, d);
    }
  };

  const today = new Date();
  const isToday = (dy, dm, dd) => today.getFullYear() === dy && today.getMonth() === dm && today.getDate() === dd;

  // --- RENDER MONTH VIEW ---
  const renderMonthView = () => {
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startPad; i += 1) {
      cells.push({ type: 'pad', key: `pad-${i}` });
    }
    for (let dNum = 1; dNum <= daysInMonth; dNum += 1) {
      cells.push({ type: 'day', d: dNum, key: `day-${dNum}` });
    }

    return (
      <div style={{ background: 'var(--bg-surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
          {weekdays.map((w) => (
            <div key={w} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {w}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)', background: 'var(--border-default)', gap: '1px' }}>
          {cells.map((cell) =>
            cell.type === 'pad' ? (
              <div key={cell.key} style={{ background: 'var(--bg-inset)', opacity: 0.5 }} aria-hidden="true" />
            ) : (
              <div
                key={cell.key}
                onClick={() => {
                  updateCursor(y, m, cell.d);
                  if (onChangeView) onChangeView('week');
                }}
                className="group"
                style={{ 
                  background: isToday(y, m, cell.d) ? 'var(--primary-50)' : 'var(--bg-surface)', 
                  padding: '0.5rem', 
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (!isToday(y, m, cell.d)) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseOut={(e) => {
                  if (!isToday(y, m, cell.d)) e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '28px', 
                  height: '28px',
                  borderRadius: '50%',
                  fontSize: '0.875rem',
                  fontWeight: isToday(y, m, cell.d) ? 700 : 500,
                  color: isToday(y, m, cell.d) ? 'white' : 'var(--text-primary)',
                  background: isToday(y, m, cell.d) ? 'var(--primary-600)' : 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  {cell.d}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(byDay.get(`${y}-${pad2(m + 1)}-${pad2(cell.d)}`) || []).slice(0, 3).map((ev) => {
                    const colors = getEventColor(ev.type);
                    return (
                      <div
                        key={ev.id}
                        title={[ev.time, ev.meta, ev.title].filter(Boolean).join(' · ')}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.4rem',
                          borderRadius: '4px',
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {ev.time ? <span style={{ opacity: 0.7, marginRight: '0.2rem' }}>{ev.time}</span> : null}
                        {ev.title}
                      </div>
                    );
                  })}
                  {(byDay.get(`${y}-${pad2(m + 1)}-${pad2(cell.d)}`)?.length || 0) > 3 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', paddingLeft: '0.25rem', fontWeight: 600 }}>
                      + {(byDay.get(`${y}-${pad2(m + 1)}-${pad2(cell.d)}`).length) - 3} more
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  };

  // --- RENDER WEEK VIEW ---
  const renderWeekView = () => {
    const startOfWeek = getWeekStart(new Date(y, m, d));
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      cells.push(current);
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-default)', minHeight: '500px' }}>
        {cells.map((date, idx) => {
          const cy = date.getFullYear();
          const cm = date.getMonth();
          const cd = date.getDate();
          const isCurrToday = isToday(cy, cm, cd);
          return (
            <div key={idx} style={{ background: isCurrToday ? 'var(--primary-50)' : 'var(--bg-surface)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: isCurrToday ? '2px solid var(--primary-500)' : '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: isCurrToday ? 'var(--primary-600)' : 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>{weekdays[date.getDay()]}</span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: isCurrToday ? 700 : 500,
                  color: isCurrToday ? 'var(--primary-700)' : 'var(--text-primary)'
                }}>{cd}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(byDay.get(`${cy}-${pad2(cm + 1)}-${pad2(cd)}`) || []).map((ev) => {
                  const colors = getEventColor(ev.type);
                  return (
                    <div
                      key={ev.id}
                      style={{ 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        background: colors.bg,
                        borderLeft: `3px solid ${colors.border}`,
                        color: colors.text,
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={[ev.time, ev.meta, ev.title].filter(Boolean).join(' · ')}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>{ev.time || 'All Day'}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '4px' }}>{ev.title}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{ev.meta}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- RENDER YEAR VIEW ---
  const renderYearView = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', padding: '1.5rem', background: 'var(--bg-inset)' }}>
        {months.map((monthName, idx) => {
          const first = new Date(y, idx, 1);
          const startPad = first.getDay();
          const daysInMonth = new Date(y, idx + 1, 0).getDate();
          
          let eventCount = 0;
          for (let dNum = 1; dNum <= daysInMonth; dNum++) {
             if (byDay.has(`${y}-${pad2(idx + 1)}-${pad2(dNum)}`)) {
               eventCount += byDay.get(`${y}-${pad2(idx + 1)}-${pad2(dNum)}`).length;
             }
          }

          return (
            <div 
              key={monthName} 
              className="card animate-fadeIn" 
              style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all 0.2s', border: '1px solid transparent' }}
              onClick={() => {
                updateCursor(y, idx, 1);
                if (onChangeView) onChangeView('month');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'var(--primary-200)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 700 }}>
                {monthName}
                {eventCount > 0 && (
                  <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                    {eventCount} events
                  </span>
                )}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {weekdays.map(w => <div key={w} style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{w.charAt(0)}</div>)}
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dNum = i + 1;
                  const hasEvents = byDay.has(`${y}-${pad2(idx + 1)}-${pad2(dNum)}`);
                  const isCurrToday = isToday(y, idx, dNum);
                  return (
                    <div 
                      key={dNum} 
                      style={{ 
                        padding: '6px 0', 
                        borderRadius: '4px',
                        background: isCurrToday ? 'var(--primary-600)' : hasEvents ? 'var(--primary-100)' : 'transparent',
                        color: isCurrToday ? 'white' : hasEvents ? 'var(--primary-700)' : 'inherit',
                        fontWeight: (hasEvents || isCurrToday) ? 700 : 500,
                        position: 'relative'
                      }}
                    >
                      {dNum}
                      {hasEvents && !isCurrToday && (
                        <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '3px', height: '3px', borderRadius: '50%', background: 'var(--primary-600)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Resolve Label based on View
  let label = '';
  if (viewMode === 'year') {
    label = `${y}`;
  } else if (viewMode === 'week') {
    const startOfWeek = getWeekStart(new Date(y, m, d));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    label = `${startOfWeek.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    label = `${months[m]} ${y}`;
  }

  return (
    <div style={{ background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={prev} 
            aria-label="Previous"
            style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)' }}
          >
            ← Prev
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => updateCursor(today.getFullYear(), today.getMonth(), today.getDate())}
            style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)' }}
          >
            Today
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={next} 
            aria-label="Next"
            style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)' }}
          >
            Next →
          </button>
        </div>
      </div>
      
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'year' && renderYearView()}
    </div>
  );
}
