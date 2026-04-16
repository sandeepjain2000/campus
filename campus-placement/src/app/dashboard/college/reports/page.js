'use client';

import { useMemo, useState } from 'react';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { formatDate } from '@/lib/utils';

const DEPT_PLACEMENT = [
  { dept: 'CSE', pct: 91, placed: 145, total: 160 },
  { dept: 'ECE', pct: 75, placed: 98, total: 130 },
  { dept: 'IT', pct: 82, placed: 73, total: 89 },
  { dept: 'ME', pct: 54, placed: 65, total: 120 },
  { dept: 'EE', pct: 55, placed: 55, total: 100 },
  { dept: 'Civil', pct: 36, placed: 32, total: 90 },
];

const SALARY_DIST = [
  { range: '< ₹5 LPA', count: 45, pct: 9 },
  { range: '₹5-10 LPA', count: 180, pct: 38 },
  { range: '₹10-15 LPA', count: 150, pct: 31 },
  { range: '₹15-25 LPA', count: 78, pct: 16 },
  { range: '₹25+ LPA', count: 25, pct: 5 },
];

const TOP_RECRUITERS = [
  { name: 'Infosys', hires: 120, ctc: '₹8.5L' },
  { name: 'TechCorp', hires: 45, ctc: '₹15L' },
  { name: 'GlobalSoft', hires: 28, ctc: '₹12L' },
  { name: 'Microsoft', hires: 15, ctc: '₹35L' },
  { name: 'Google', hires: 8, ctc: '₹42L' },
];

const YOY = [
  { metric: 'Placement %', prev: '67%', curr: '72%', change: '+5%', up: true },
  { metric: 'Avg Package', prev: '₹11.4L', curr: '₹12.4L', change: '+8.7%', up: true },
  { metric: 'Highest Package', prev: '₹40L', curr: '₹45L', change: '+12.5%', up: true },
  { metric: 'Companies', prev: '38', curr: '45', change: '+18.4%', up: true },
  { metric: 'Total Offers', prev: '455', curr: '523', change: '+14.9%', up: true },
];

/** One row per student × company event — attendance and pipeline outcome */
const STUDENT_COMPANY_EVENTS = [
  { student: 'Arjun Verma', roll: 'CS21001', dept: 'CSE', company: 'TCS', eventType: 'Pre-placement talk', eventDate: '2026-09-18', attended: 'Yes', outcome: '—' },
  { student: 'Arjun Verma', roll: 'CS21001', dept: 'CSE', company: 'TCS', eventType: 'Aptitude screening', eventDate: '2026-09-19', attended: 'Yes', outcome: 'Passed' },
  { student: 'Arjun Verma', roll: 'CS21001', dept: 'CSE', company: 'TCS', eventType: 'Technical interview R1', eventDate: '2026-10-01', attended: 'Yes', outcome: 'Shortlisted' },
  { student: 'Sneha Iyer', roll: 'CS21044', dept: 'CSE', company: 'TCS', eventType: 'Pre-placement talk', eventDate: '2026-09-18', attended: 'Yes', outcome: '—' },
  { student: 'Sneha Iyer', roll: 'CS21044', dept: 'CSE', company: 'TCS', eventType: 'Aptitude screening', eventDate: '2026-09-19', attended: 'No', outcome: 'Absent' },
  { student: 'Sneha Iyer', roll: 'CS21044', dept: 'CSE', company: 'Infosys', eventType: 'Hackathon', eventDate: '2026-09-25', attended: 'Yes', outcome: 'Top 10' },
  { student: 'Sneha Iyer', roll: 'CS21044', dept: 'CSE', company: 'Infosys', eventType: 'Technical interview', eventDate: '2026-10-02', attended: 'Yes', outcome: 'Offer (PPO)' },
  { student: 'Rohan Patel', roll: 'EC21009', dept: 'ECE', company: 'TechCorp', eventType: 'Company orientation', eventDate: '2026-09-10', attended: 'Yes', outcome: '—' },
  { student: 'Rohan Patel', roll: 'EC21009', dept: 'ECE', company: 'TechCorp', eventType: 'Coding test', eventDate: '2026-09-12', attended: 'Yes', outcome: 'Passed' },
  { student: 'Rohan Patel', roll: 'EC21009', dept: 'ECE', company: 'TechCorp', eventType: 'Panel interview', eventDate: '2026-09-28', attended: 'Yes', outcome: 'Rejected' },
  { student: 'Kavya Reddy', roll: 'CS21088', dept: 'CSE', company: 'Microsoft', eventType: 'Resume shortlist', eventDate: '2026-08-30', attended: 'N/A', outcome: 'Shortlisted' },
  { student: 'Kavya Reddy', roll: 'CS21088', dept: 'CSE', company: 'Microsoft', eventType: 'On-site interviews', eventDate: '2026-09-15', attended: 'Yes', outcome: 'Offer' },
  { student: 'Amit Sharma', roll: 'ME21002', dept: 'ME', company: 'L&T', eventType: 'GD + Technical', eventDate: '2026-09-05', attended: 'Yes', outcome: 'Waitlisted' },
];

export default function CollegeReportsPage() {
  const [studentReportSearch, setStudentReportSearch] = useState('');
  const [studentReportCompany, setStudentReportCompany] = useState('');

  const studentEventCompanies = useMemo(
    () => Array.from(new Set(STUDENT_COMPANY_EVENTS.map((r) => r.company))).sort(),
    [],
  );

  const filteredStudentEvents = useMemo(() => {
    const q = studentReportSearch.trim().toLowerCase();
    return STUDENT_COMPANY_EVENTS.filter((r) => {
      if (studentReportCompany && r.company !== studentReportCompany) return false;
      if (!q) return true;
      return (
        r.student.toLowerCase().includes(q) ||
        r.roll.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.outcome.toLowerCase().includes(q)
      );
    });
  }, [studentReportSearch, studentReportCompany]);

  const reportExports = useMemo(
    () => [
      {
        id: 'dept',
        label: 'Department-wise placement',
        filename: 'reports_department_placement',
        rowCount: DEPT_PLACEMENT.length,
        getRows: () => ({
          headers: ['Department', 'Placement_pct', 'Placed', 'Total'],
          rows: DEPT_PLACEMENT.map((d) => [
            d.dept,
            String(d.pct),
            String(d.placed),
            String(d.total),
          ]),
        }),
      },
      {
        id: 'salary',
        label: 'Salary distribution',
        filename: 'reports_salary_distribution',
        rowCount: SALARY_DIST.length,
        getRows: () => ({
          headers: ['Range', 'Students', 'Pct'],
          rows: SALARY_DIST.map((d) => [d.range, String(d.count), String(d.pct)]),
        }),
      },
      {
        id: 'recruiters',
        label: 'Top recruiters',
        filename: 'reports_top_recruiters',
        rowCount: TOP_RECRUITERS.length,
        getRows: () => ({
          headers: ['Rank', 'Company', 'Hires', 'Avg_CTC'],
          rows: TOP_RECRUITERS.map((c, i) => [
            String(i + 1),
            c.name,
            String(c.hires),
            c.ctc,
          ]),
        }),
      },
      {
        id: 'yoy',
        label: 'Year-over-year comparison',
        filename: 'reports_yoy_comparison',
        rowCount: YOY.length,
        getRows: () => ({
          headers: ['Metric', 'Year_2024_25', 'Year_2025_26', 'Change'],
          rows: YOY.map((r) => [r.metric, r.prev, r.curr, r.change]),
        }),
      },
      {
        id: 'student_events',
        label: 'Student–company events & outcomes',
        filename: 'reports_student_company_events',
        rowCount: STUDENT_COMPANY_EVENTS.length,
        getRows: () => ({
          headers: ['Student', 'Roll', 'Dept', 'Company', 'Event', 'Event_date', 'Attended', 'Outcome'],
          rows: STUDENT_COMPANY_EVENTS.map((r) => [
            r.student,
            r.roll,
            r.dept,
            r.company,
            r.eventType,
            r.eventDate,
            r.attended,
            r.outcome,
          ]),
        }),
      },
    ],
    []
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📈 Reports & Analytics</h1>
          <p>Comprehensive placement analytics and reports</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton mode="multi" exportMenus={reportExports} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stats-card"><div className="stats-card-icon green">📊</div><div className="stats-card-value">72%</div><div className="stats-card-label">Placement Rate</div><div className="stats-card-change up">↑ 5% vs last year</div></div>
        <div className="stats-card green"><div className="stats-card-icon green">💰</div><div className="stats-card-value">₹12.4L</div><div className="stats-card-label">Average Package</div></div>
        <div className="stats-card amber"><div className="stats-card-icon amber">📈</div><div className="stats-card-value">₹45L</div><div className="stats-card-label">Highest Package</div></div>
        <div className="stats-card blue"><div className="stats-card-icon blue">🏢</div><div className="stats-card-value">45</div><div className="stats-card-label">Companies Visited</div></div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">👤 Student-level: company events & results</h3>
          <p className="text-sm text-secondary" style={{ margin: '0.25rem 0 0', fontWeight: 400 }}>
            Who attended which company touchpoints (talks, tests, interviews) and the recorded outcome for that step.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            className="form-input"
            placeholder="Search student, roll, company, event, outcome…"
            value={studentReportSearch}
            onChange={(e) => setStudentReportSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <select className="form-select" style={{ width: 'auto', minWidth: 200 }} value={studentReportCompany} onChange={(e) => setStudentReportCompany(e.target.value)}>
            <option value="">All companies</option>
            {studentEventCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-sm text-secondary">{filteredStudentEvents.length} rows</span>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Dept</th>
                <th>Company</th>
                <th>Event</th>
                <th>Date</th>
                <th>Attended</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudentEvents.map((r, idx) => (
                <tr key={`${r.roll}-${r.company}-${r.eventType}-${idx}`}>
                  <td className="font-semibold">{r.student}</td>
                  <td className="text-sm font-mono">{r.roll}</td>
                  <td>{r.dept}</td>
                  <td>{r.company}</td>
                  <td>{r.eventType}</td>
                  <td>{formatDate(r.eventDate)}</td>
                  <td>
                    <span className={`badge ${r.attended === 'Yes' ? 'badge-success' : r.attended === 'No' ? 'badge-gray' : 'badge-indigo'}`}>{r.attended}</span>
                  </td>
                  <td className="text-sm">{r.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Branch-wise Placement Chart */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Department-wise Placement Rate</h3></div>
          {DEPT_PLACEMENT.map(d => (
            <div key={d.dept} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span className="text-sm font-semibold">{d.dept}</span>
                <span className="text-sm">{d.placed}/{d.total} ({d.pct}%)</span>
              </div>
              <div className="progress-bar"><div className={`progress-fill ${d.pct >= 80 ? 'green' : d.pct >= 50 ? '' : 'red'}`} style={{ width: `${d.pct}%` }} /></div>
            </div>
          ))}
        </div>

        {/* Salary Distribution */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Salary Distribution</h3></div>
          {SALARY_DIST.map(d => (
            <div key={d.range} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span className="text-sm font-semibold">{d.range}</span>
                <span className="text-sm">{d.count} students ({d.pct}%)</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${d.pct * 2.5}%` }} /></div>
            </div>
          ))}
        </div>

        {/* Top Recruiters */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏆 Top Recruiters</h3></div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Company</th><th>Hires</th><th>Avg CTC</th></tr></thead>
              <tbody>
                {TOP_RECRUITERS.map((c, i) => (
                  <tr key={c.name}><td className="font-bold">{i+1}</td><td className="font-semibold">{c.name}</td><td>{c.hires}</td><td className="font-bold">{c.ctc}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Year-over-Year */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">📊 Year-over-Year Comparison</h3></div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>Metric</th><th>2024-25</th><th>2025-26</th><th>Change</th></tr></thead>
              <tbody>
                {YOY.map(r => (
                  <tr key={r.metric}><td className="font-semibold">{r.metric}</td><td>{r.prev}</td><td className="font-bold">{r.curr}</td>
                    <td><span className={`stats-card-change ${r.up ? 'up' : 'down'}`}>{r.up ? '↑' : '↓'} {r.change}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
