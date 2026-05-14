'use client';
import { useState, useCallback, useMemo } from 'react';
import MobileHeader from '@/components/mobile/MobileHeader';
import { useToast } from '@/components/ToastProvider';
import useSWR from 'swr';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load events');
  return json;
};

export default function mb_Calendar() {
  const { addToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8)); // September 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 13));
  const [showForm, setShowForm] = useState(false);
  const { data, error, mutate, isLoading } = useSWR('/api/college/events', fetcher);

  const events = useMemo(
    () => (Array.isArray(data?.events) ? data.events : []).map((e) => ({
      id: e.id,
      title: e.title,
      type: e.event_type,
      startDate: e.start_date ? new Date(e.start_date) : null,
      endDate: e.end_date ? new Date(e.end_date) : null,
    })),
    [data]
  );

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const cells = [];
  
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const isSameDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const isSameMonth = useCallback((date) => {
    return date && date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
    return events.filter(e => isSameDate(e.startDate, selectedDate));
  }, [events, selectedDate]);

  const getEventMeta = (type) => {
    if (type === 'placement_drive') return { color: 'var(--primary-600)', bg: 'var(--primary-50)', icon: <Briefcase size={14}/>, label: 'Placement' };
    if (type === 'exam') return { color: 'var(--danger-600)', bg: 'var(--danger-50)', icon: <GraduationCap size={14}/>, label: 'Exam' };
    if (type === 'holiday') return { color: 'var(--success-600)', bg: 'var(--success-50)', icon: <Building2 size={14}/>, label: 'Holiday' };
    return { color: 'var(--text-secondary)', bg: 'var(--bg-secondary)', icon: <CalendarIcon size={14}/>, label: 'Other' };
  };

  const createCalendarEntry = async ({ title, eventType, startDate, endDate, isBlocking }) => {
    const res = await fetch('/api/college/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, eventType, startDate, endDate, isBlocking }),
    });
    if (!res.ok) throw new Error('Failed to save event');
  };

  const addEvent = async () => {
    try {
      const title = window.prompt('Event title');
      if (!title) return;
      const type = window.prompt('Type (placement_drive / exam / holiday / other)', 'placement_drive');
      const startStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
      await createCalendarEntry({ title, eventType: type, startDate: startStr, endDate: startStr, isBlocking: false });
      await mutate();
      addToast('Event added', 'success');
    } catch (e) {
      addToast(e.message || 'Failed to add event', 'error');
    }
  };

  return (
    <>
      <MobileHeader 
        title="Calendar" 
        action={
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Add
          </button>
        }
      />
      <div className="animate-fadeIn" style={{ padding: '1rem 1rem 5rem 1rem' }}>
        
        {showForm && (
          <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--primary-300)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => { addEvent(); setShowForm(false); }} style={{ justifyContent: 'flex-start' }}>
                <Plus size={16} /> Add Event to Selected Date
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)} style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-200)', justifyContent: 'flex-start' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{monthName}</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }} onClick={() => shiftMonth(-1)}><ChevronLeft size={20} /></button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }} onClick={() => shiftMonth(1)}><ChevronRight size={20} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {cells.map((dateObj, i) => {
              if (!dateObj) return <div key={i} />;
              
              const isSelected = isSameDate(dateObj, selectedDate);
              const dayEvents = events.filter(e => isSameDate(e.startDate, dateObj));
              const hasDrive = dayEvents.some(e => e.type === 'placement_drive');
              const hasExam = dayEvents.some(e => e.type === 'exam');
              
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(dateObj)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: 'none',
                    background: isSelected ? 'var(--primary-600)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {dateObj.getDate()}
                  
                  {dayEvents.length > 0 && !isSelected && (
                    <div style={{ position: 'absolute', bottom: '4px', display: 'flex', gap: '2px' }}>
                      {hasDrive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary-500)' }} />}
                      {hasExam && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--danger-500)' }} />}
                      {!hasDrive && !hasExam && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success-500)' }} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
            {formatDate(selectedDate)}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton" style={{ height: 60, borderRadius: '8px' }} />
          </div>
        ) : selectedDayEvents.length === 0 ? (
          <div className="card" style={{ padding: '2rem 1rem', textAlign: 'center', borderStyle: 'dashed' }}>
            <CalendarIcon size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No events scheduled for this day</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectedDayEvents.map(e => {
              const meta = getEventMeta(e.type);
              return (
                <div key={e.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{e.title}</div>
                    <div style={{ fontSize: '0.75rem', color: meta.color, fontWeight: 500, marginTop: '0.15rem' }}>{meta.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
