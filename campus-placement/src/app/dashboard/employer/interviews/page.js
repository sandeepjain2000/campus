'use client';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { formatDate } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

function formatTimeDisplay(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const am = h < 12;
  const hr = h % 12 || 12;
  const mm = String(m || 0).padStart(2, '0');
  return `${hr}:${mm} ${am ? 'AM' : 'PM'}`;
}

const seedPlan = [
  { id: 1, campus: 'IIT Madras', round: 'Round 1 - DSA', date: '2026-10-07', time: '10:00', assigned: 18, mode: 'Virtual', panelNames: 'Panel: A. Rao, B. Sen' },
  { id: 2, campus: 'NIT Trichy', round: 'Round 2 - System Design', date: '2026-10-08', time: '13:00', assigned: 9, mode: 'On-Campus', panelNames: '' },
];

export default function EmployerInterviewsPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState(seedPlan);
  const [view, setView] = useState('list');
  const [form, setForm] = useState({
    campus: 'IIT Madras',
    round: 'Round 1 - DSA',
    date: '',
    time: '',
    assigned: 0,
    mode: 'Virtual',
    panelNames: '',
  });

  const create = (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return;
    setRows((prev) => [{ id: Date.now(), ...form, assigned: Number(form.assigned) || 0 }, ...prev]);
    setForm((p) => ({ ...p, date: '', time: '', assigned: 0, panelNames: '' }));
    addToast('Interview slot added (demo).', 'info');
  };

  const calItems = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        date: r.date,
        title: `${r.campus} — ${r.round}`,
        time: formatTimeDisplay(r.time),
        meta: `${r.mode} · ${r.assigned} students`,
      })),
    [rows],
  );

  const getScheduleCsv = useCallback(
    (_scope) => ({
      headers: ['Campus', 'Round', 'Date', 'Time', 'Mode', 'Assigned', 'Panel_names'],
      rows: rows.map((r) => [r.campus, r.round, r.date, r.time, r.mode, String(r.assigned), r.panelNames || '']),
    }),
    [rows],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎯 Interview Scheduling</h1>
          <p>Create multi-round interview slots and assign shortlisted students.</p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/employer/hiring-assessment" className="btn btn-secondary">
            Hiring Assessment →
          </Link>
          <ExportCsvSplitButton filenameBase="employer_interview_schedule" currentCount={rows.length} fullCount={rows.length} getRows={getScheduleCsv} />
          <div className="view-toggle" role="group" aria-label="Interview plan view">
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary-500)' }}>
        <p className="text-sm text-secondary" style={{ margin: 0 }}>
          Round-level scores and pipeline outcomes (Aptitude, GD, Interviews) live in the separate{' '}
          <Link href="/dashboard/employer/hiring-assessment" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
            Hiring Assessment
          </Link>{' '}
          module for dashboards and reporting.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Create Slot</h3>
          </div>
          <form onSubmit={create} style={{ display: 'grid', gap: '0.65rem' }}>
            <input className="form-input" placeholder="Campus" value={form.campus} onChange={(e) => setForm((p) => ({ ...p, campus: e.target.value }))} />
            <input className="form-input" placeholder="Round name" value={form.round} onChange={(e) => setForm((p) => ({ ...p, round: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              <input className="form-input" type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
            </div>
            <input className="form-input" type="number" min={0} placeholder="Assigned students" value={form.assigned} onChange={(e) => setForm((p) => ({ ...p, assigned: e.target.value }))} />
            <input className="form-input" placeholder="Interviewer / panel names (optional)" value={form.panelNames} onChange={(e) => setForm((p) => ({ ...p, panelNames: e.target.value }))} />
            <select className="form-select" value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}>
              <option>Virtual</option>
              <option>On-Campus</option>
              <option>Hybrid</option>
            </select>
            <button className="btn btn-primary" type="submit">
              Add Interview Slot
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 className="card-title">Interview Plan</h3>
            <span className="text-sm text-secondary">{rows.length} slots</span>
          </div>
          {view === 'calendar' ? (
            <EmployerCalendarGrid items={calItems} initialYear={2026} initialMonth={9} />
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {rows.map((r) => (
                <div key={r.id} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.7rem' }}>
                  <div className="font-semibold">
                    {r.campus} • {r.round}
                  </div>
                  <div className="text-sm text-secondary">
                    {formatDate(r.date)} • {formatTimeDisplay(r.time)} • {r.mode}
                  </div>
                  {r.panelNames ? <div className="text-xs text-tertiary">{r.panelNames}</div> : null}
                  <div className="text-xs text-tertiary">{r.assigned} assigned students</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
