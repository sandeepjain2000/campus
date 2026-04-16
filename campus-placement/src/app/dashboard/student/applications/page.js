'use client';
import { useState } from 'react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';

const mockApplications = [
  { id: 1, company: 'TechCorp Solutions', role: 'SDE', status: 'shortlisted', currentRound: 'Coding Round', rounds: ['Aptitude ✅', 'Coding 🔄', 'Technical Interview', 'HR Interview'], appliedAt: '2026-09-08', driveDate: '2026-09-15' },
  { id: 2, company: 'GlobalSoft Technologies', role: 'Full Stack Dev', status: 'applied', currentRound: 'Pending Review', rounds: ['Coding Assessment', 'Technical Interview', 'HR'], appliedAt: '2026-09-11', driveDate: '2026-09-22' },
  { id: 3, company: 'DataVerse Analytics', role: 'Data Analyst', status: 'rejected', currentRound: 'Aptitude Test', rounds: ['Aptitude ❌'], appliedAt: '2026-08-20', driveDate: '2026-09-01' },
  { id: 4, company: 'CloudNine Systems', role: 'DevOps Engineer', status: 'selected', currentRound: 'All rounds cleared', rounds: ['Coding ✅', 'System Design ✅', 'HR ✅'], appliedAt: '2026-08-15', driveDate: '2026-08-25' },
];

export default function StudentApplicationsPage() {
  const [filter, setFilter] = useState('');

  const filtered = mockApplications.filter(a => !filter || a.status === filter);

  const statusCounts = {
    all: mockApplications.length,
    applied: mockApplications.filter(a => a.status === 'applied').length,
    shortlisted: mockApplications.filter(a => a.status === 'shortlisted').length,
    selected: mockApplications.filter(a => a.status === 'selected').length,
    rejected: mockApplications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📝 My Applications</h1>
          <p>Track the status of all your placement applications</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs">
        <button className={`tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All ({statusCounts.all})</button>
        <button className={`tab ${filter === 'applied' ? 'active' : ''}`} onClick={() => setFilter('applied')}>Applied ({statusCounts.applied})</button>
        <button className={`tab ${filter === 'shortlisted' ? 'active' : ''}`} onClick={() => setFilter('shortlisted')}>Shortlisted ({statusCounts.shortlisted})</button>
        <button className={`tab ${filter === 'selected' ? 'active' : ''}`} onClick={() => setFilter('selected')}>Selected ({statusCounts.selected})</button>
        <button className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected ({statusCounts.rejected})</button>
      </div>

      {/* Application Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(app => (
          <div key={app.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <EntityLogo name={app.company} size="md" shape="rounded" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{app.company}</h3>
                    <span className={`badge badge-${getStatusColor(app.status)} badge-dot`}>{formatStatus(app.status)}</span>
                  </div>
                  <p className="text-sm text-secondary" style={{ marginTop: '0.125rem' }}>{app.role}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-tertiary">Applied on</div>
                <div className="text-sm font-semibold">{formatDate(app.appliedAt)}</div>
              </div>
            </div>
            
            {/* Rounds Progress */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
              <div className="text-xs font-semibold text-secondary" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Round Progress
              </div>
              <div className="steps">
                {app.rounds.map((round, i) => {
                  const isCompleted = round.includes('✅');
                  const isCurrent = round.includes('🔄');
                  const isFailed = round.includes('❌');
                  return (
                    <div key={i} className={`step ${isCompleted ? 'completed' : isCurrent ? 'active' : ''}`}>
                      <div className="step-number" style={isFailed ? { background: 'var(--danger-500)', color: 'white' } : {}}>
                        {isCompleted ? '✓' : isFailed ? '✗' : i + 1}
                      </div>
                      <span className="step-label">{round.replace(/[✅🔄❌]/g, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span className="text-sm text-tertiary">Drive Date: {formatDate(app.driveDate)}</span>
              {app.status === 'applied' && (
                <button className="btn btn-danger btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Withdraw</button>
              )}
              {app.status === 'selected' && (
                <span className="badge badge-green" style={{ padding: '0.375rem 1rem' }}>🎉 Offer Available</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
