'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { HIRING_ROUNDS } from '@/lib/demoHiringAssessment';

export default function EmployerHiringAssessmentPage() {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/hiring-assessment');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load hiring assessment');
        if (!mounted) return;
        setRows(Array.isArray(json.rows) ? json.rows : []);
      } catch {
        if (!mounted) return;
        setRows([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getCsv = useCallback(
    (_scope) => ({
      headers: ['Student', 'Roll', 'Campus', 'Aptitude_status', 'Aptitude_detail', 'GD_status', 'GD_detail', 'Interviews_status', 'Interviews_detail'],
      rows: rows.map((r) => [
        r.student,
        r.roll,
        r.campus,
        r.rounds.aptitude.status,
        r.rounds.aptitude.detail,
        r.rounds.gd.status,
        r.rounds.gd.detail,
        r.rounds.interviews.status,
        r.rounds.interviews.detail,
      ]),
    }),
    [rows],
  );

  const setRound = (index, roundId, status, detail) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              rounds: {
                ...row.rounds,
                [roundId]: { status, detail: detail ?? row.rounds[roundId].detail },
              },
            }
          : row,
      ),
    );
  };

  const roundSummaries = useMemo(() => {
    return HIRING_ROUNDS.map((r) => ({
      ...r,
      done: rows.filter((row) => row.rounds[r.id]?.status && row.rounds[r.id].status !== '—').length,
    }));
  }, [rows]);

  const saveRows = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/hiring-assessment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📋 Hiring Assessment</h1>
          <p>
            Structured outcomes across pipeline stages. Round names are currently <strong>fixed in this build</strong> (Aptitude, Group Discussion, Interviews); in
            production companies define their own stages. This data is designed to <strong>feed reports and dashboards</strong>.
          </p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton filenameBase="hiring_assessment" currentCount={rows.length} fullCount={rows.length} getRows={getCsv} />
          <button className="btn btn-primary" type="button" onClick={saveRows} disabled={saving}>
            {saving ? 'Saving...' : 'Save updates'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="text-sm text-secondary" style={{ margin: 0 }}>
          Interview <strong>scheduling</strong> stays under{' '}
          <Link href="/dashboard/employer/interviews" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
            Interview Scheduling
          </Link>
          . Use Hiring Assessment for <strong>round-level results</strong> only.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
        {roundSummaries.map((r) => (
          <div key={r.id} className="stats-card">
            <div className="stats-card-value">{r.done}</div>
            <div className="stats-card-label">{r.name}</div>
            <div className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>
              {r.short} · current counts
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Candidate matrix</h3>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Campus</th>
                {HIRING_ROUNDS.map((r) => (
                  <th key={r.id}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.roll}>
                  <td className="font-semibold">{row.student}</td>
                  <td className="text-sm font-mono">{row.roll}</td>
                  <td className="text-sm">{row.campus}</td>
                  {HIRING_ROUNDS.map((r) => {
                    const cell = row.rounds[r.id];
                    return (
                      <td key={r.id}>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.35rem', marginBottom: '0.25rem' }}
                          value={cell.status}
                          onChange={(e) => setRound(idx, r.id, e.target.value, cell.detail)}
                        >
                          <option>Qualified</option>
                          <option>Waitlisted</option>
                          <option>Not invited</option>
                          <option>Shortlisted</option>
                          <option>Rejected</option>
                          <option>Offer</option>
                          <option>—</option>
                        </select>
                        <input
                          className="form-input"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.35rem' }}
                          value={cell.detail}
                          onChange={(e) => setRound(idx, r.id, cell.status, e.target.value)}
                          placeholder="Score / note"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3 + HIRING_ROUNDS.length} className="text-center text-secondary">
                    No hiring assessment records available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
