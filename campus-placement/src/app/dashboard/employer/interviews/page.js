'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { formatDate } from '@/lib/utils';
import { getInitialCalendarCursorFromIsoDates } from '@/lib/calendarInitialCursor';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';
import { CalendarCheck } from 'lucide-react';

const campusesFetcher = (url) =>
  fetch(url, { credentials: 'include' }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to load campuses');
    return json;
  });

function persistActiveCampus(campus) {
  if (!campus?.id) {
    sessionStorage.removeItem('activeCampus');
    try {
      localStorage.removeItem('activeCampus');
    } catch {
      /**/
    }
    return;
  }
  const payload = JSON.stringify({
    id: campus.id,
    name: campus.name,
    city: campus.city || '',
  });
  sessionStorage.setItem('activeCampus', payload);
  try {
    localStorage.setItem('activeCampus', payload);
  } catch {
    /**/
  }
}

function readStoredCampusId() {
  try {
    const stored = sessionStorage.getItem('activeCampus');
    if (!stored) return '';
    const campus = JSON.parse(stored);
    return campus?.id ? String(campus.id) : '';
  } catch {
    sessionStorage.removeItem('activeCampus');
    return '';
  }
}

function formatTimeDisplay(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const am = h < 12;
  const hr = h % 12 || 12;
  const mm = String(m || 0).padStart(2, '0');
  return `${hr}:${mm} ${am ? 'AM' : 'PM'}`;
}

export default function EmployerInterviewsPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [view, setView] = useState('list');
  const [form, setForm] = useState({
    round: 'Round 1 - DSA',
    date: '',
    time: '',
    assigned: 0,
    mode: 'Virtual',
    panelNames: '',
  });

  const { data: campusData, isLoading: campusesLoading } = useSWR(
    '/api/employer/campuses',
    campusesFetcher,
    { revalidateOnFocus: false },
  );

  const approvedCampuses = useMemo(
    () =>
      (campusData?.colleges || []).filter(
        (c) => String(c.approval_status || '').toLowerCase() === 'approved',
      ),
    [campusData],
  );

  const selectedCampus = useMemo(
    () => approvedCampuses.find((c) => c.id === selectedCampusId) || null,
    [approvedCampuses, selectedCampusId],
  );

  useEffect(() => {
    if (!approvedCampuses.length) {
      setSelectedCampusId('');
      return;
    }
    setSelectedCampusId((prev) => {
      if (prev && approvedCampuses.some((c) => c.id === prev)) return prev;
      const storedId = readStoredCampusId();
      if (storedId && approvedCampuses.some((c) => c.id === storedId)) return storedId;
      return approvedCampuses[0].id;
    });
  }, [approvedCampuses]);

  useEffect(() => {
    if (selectedCampus) persistActiveCampus(selectedCampus);
  }, [selectedCampus]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!selectedCampusId) {
        setRows([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/employer/interviews?campusId=${encodeURIComponent(selectedCampusId)}`,
          { credentials: 'include' },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load interview plan');
        if (!mounted) return;
        setRows(Array.isArray(json.rows) ? json.rows : []);
      } catch (e) {
        if (!mounted) return;
        setRows([]);
        addToast(e.message || 'Failed to load interview plan', 'error');
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedCampusId, addToast]);

  const handleCampusChange = (campusId) => {
    setSelectedCampusId(campusId);
    const campus = approvedCampuses.find((c) => c.id === campusId);
    if (campus) persistActiveCampus(campus);
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !selectedCampusId) {
      addToast('Select a college, date, and time.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/employer/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campusId: selectedCampusId,
          campus: selectedCampus?.name || '',
          round: form.round,
          date: form.date,
          time: form.time,
          assigned: Number(form.assigned) || 0,
          mode: form.mode,
          panelNames: form.panelNames,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save interview slot');
      setRows(Array.isArray(json.rows) ? json.rows : []);
      setForm((p) => ({ ...p, date: '', time: '', assigned: 0, panelNames: '' }));
      addToast('Interview slot added.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save interview slot', 'error');
    }
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

  const calendarCursor = useMemo(
    () => getInitialCalendarCursorFromIsoDates(rows.map((r) => r.date)),
    [rows],
  );

  const getScheduleCsv = useCallback(
    (_scope) => ({
      headers: ['Campus', 'Round', 'Date', 'Time', 'Mode', 'Assigned', 'Panel_names'],
      rows: rows.map((r) => [
        r.campus,
        r.round,
        r.date,
        r.time,
        r.mode,
        String(r.assigned),
        r.panelNames || '',
      ]),
    }),
    [rows],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={22} strokeWidth={1.75} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
            Interview Scheduling
          </h1>
          <p className="text-secondary" style={{ margin: 0 }}>
            Create multi-round interview slots and assign shortlisted students.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/employer/hiring-assessment" className="btn btn-secondary">
            Hiring Assessment →
          </Link>
          <ExportCsvSplitButton
            filenameBase="employer_interview_schedule"
            currentCount={rows.length}
            fullCount={rows.length}
            getRows={getScheduleCsv}
          />
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

      <div
        className="card"
        style={{ marginBottom: '1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-sm text-secondary" style={{ margin: 0 }}>
          Round results from your CSV uploads are edited under Assessment uploads;{' '}
          <Link href="/dashboard/employer/hiring-assessment" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
            Hiring Assessment
          </Link>{' '}
          is a read-only campus summary and export of that same data.
        </p>
      </div>

      {!campusesLoading && approvedCampuses.length === 0 && (
        <div
          className="card"
          style={{ marginBottom: '1rem', background: 'var(--warning-50)', border: '1px solid var(--warning-200)' }}
        >
          <p className="text-sm" style={{ margin: 0, color: 'var(--text-primary)' }}>
            <strong>No approved college partnerships yet.</strong> Request campus access before scheduling interviews.{' '}
            <Link
              href="/dashboard/employer/select-campus"
              className="btn btn-primary btn-sm"
              style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
            >
              Manage campuses
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Create Slot</h3>
          </div>
          <form
            onSubmit={create}
            style={{
              display: 'grid',
              gap: '0.65rem',
              opacity: selectedCampusId ? 1 : 0.55,
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="interview-campus-select">
                College / campus
              </label>
              <select
                id="interview-campus-select"
                className="form-select"
                value={selectedCampusId}
                disabled={campusesLoading || approvedCampuses.length === 0}
                onChange={(e) => handleCampusChange(e.target.value)}
                required
              >
                {approvedCampuses.length === 0 ? (
                  <option value="">{campusesLoading ? 'Loading colleges…' : 'No approved colleges'}</option>
                ) : (
                  approvedCampuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.city ? ` (${c.city})` : ''}
                    </option>
                  ))
                )}
              </select>
              <span className="form-hint">Only approved campus partnerships are listed.</span>
            </div>
            <input
              className="form-input"
              placeholder="Round name"
              value={form.round}
              onChange={(e) => setForm((p) => ({ ...p, round: e.target.value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                className="form-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
              />
              <input
                className="form-input"
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                required
              />
            </div>
            <input
              className="form-input"
              type="number"
              min={0}
              placeholder="Assigned students"
              value={form.assigned}
              onChange={(e) => setForm((p) => ({ ...p, assigned: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Interviewer / panel names (optional)"
              value={form.panelNames}
              onChange={(e) => setForm((p) => ({ ...p, panelNames: e.target.value }))}
            />
            <select
              className="form-select"
              value={form.mode}
              onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
            >
              <option>Virtual</option>
              <option>On-Campus</option>
              <option>Hybrid</option>
            </select>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!selectedCampusId || approvedCampuses.length === 0}
              title={
                !selectedCampusId || approvedCampuses.length === 0
                  ? 'Select an approved college partnership first'
                  : 'Save interview slot'
              }
            >
              Add Interview Slot
            </button>
          </form>
        </div>

        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <h3 className="card-title">Interview Plan</h3>
            <span className="text-sm text-secondary">
              {selectedCampus ? selectedCampus.name : 'No college selected'} · {rows.length} slots
            </span>
          </div>
          {view === 'calendar' ? (
            <EmployerCalendarGrid
              items={calItems}
              initialYear={calendarCursor.initialYear}
              initialMonth={calendarCursor.initialMonth}
            />
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {!selectedCampusId ? (
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  Select a college to view its interview schedule.
                </p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  No interview slots for this college yet.
                </p>
              ) : (
                rows.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.7rem',
                    }}
                  >
                    <div className="font-semibold">
                      {r.campus} • {r.round}
                    </div>
                    <div className="text-sm text-secondary">
                      {formatDate(r.date)} • {formatTimeDisplay(r.time)} • {r.mode}
                    </div>
                    {r.panelNames ? <div className="text-xs text-tertiary">{r.panelNames}</div> : null}
                    <div className="text-xs text-tertiary">{r.assigned} assigned students</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
