'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { HIRING_ROUNDS } from '@/lib/demoHiringAssessment';

export default function CollegeHiringAssessmentPage() {
  const [rows, setRows] = useState([]);

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

  const summary = useMemo(() => {
    return HIRING_ROUNDS.map((r) => ({
      id: r.id,
      name: r.name,
      count: rows.filter((row) => row.rounds[r.id]?.status && row.rounds[r.id].status !== '—').length,
    }));
  }, [rows]);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📋 Hiring Assessment (read-only)</h1>
          <p>
            Aggregated round outcomes shared by employers for reporting. Editing happens on the company side; exports here feed{' '}
            <Link href="/dashboard/college/reports" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
              Reports &amp; analytics
            </Link>
            .
          </p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton filenameBase="hiring_assessment_college_view" currentCount={rows.length} fullCount={rows.length} getRows={getCsv} />
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
        {summary.map((s) => (
          <div key={s.id} className="stats-card">
            <div className="stats-card-value">{s.count}</div>
            <div className="stats-card-label">{s.name}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Campus</th>
                {HIRING_ROUNDS.map((r) => (
                  <th key={r.id}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roll}>
                  <td className="font-semibold">{row.student}</td>
                  <td className="text-sm font-mono">{row.roll}</td>
                  <td className="text-sm">{row.campus}</td>
                  {HIRING_ROUNDS.map((r) => {
                    const c = row.rounds[r.id];
                    return (
                      <td key={r.id} className="text-sm">
                        <div className="font-semibold">{c.status}</div>
                        <div className="text-xs text-tertiary">{c.detail}</div>
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
