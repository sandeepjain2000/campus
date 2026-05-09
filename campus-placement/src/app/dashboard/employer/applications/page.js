'use client';

import { useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import { Briefcase, ClipboardList, FolderDot, GraduationCap, Search, Building2, FileText } from 'lucide-react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

const TABS = [
  { id: 'jobs', label: 'Jobs', shortLabel: 'Jobs', icon: Briefcase, desc: 'Applications to your placement drives (full-time, PPO, etc.).' },
  { id: 'internships', label: 'Internships', shortLabel: 'Internships', icon: GraduationCap, desc: 'Students who applied to your published internship postings.' },
  { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: FolderDot, desc: 'Short projects and hackathons students applied to.' },
];

const STATUS_PILLS = [
  { key: '', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'selected', label: 'Selected' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'on_hold', label: 'On Hold' },
];

async function fetcher(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function jobTypeLabel(t) {
  if (!t || t === 'placement_drive') return 'Drive';
  return String(t).replace(/_/g, ' ');
}

export default function EmployerApplicationsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('jobs');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');

  const { data, error, isLoading, mutate } = useSWR(`/api/employer/applications?tab=${tab}`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 0,
  });

  const items = data?.items || [];
  const counts = data?.counts || { jobs: 0, internships: 0, projects: 0 };

  const filtered = useMemo(() => {
    const result = items.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = [a.studentName, a.email, a.collegeName, a.openingTitle, a.branch].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortOption === 'date_desc') return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
      if (sortOption === 'date_asc') return new Date(a.appliedAt || 0) - new Date(b.appliedAt || 0);
      if (sortOption === 'cgpa_desc') return (Number(b.cgpa) || 0) - (Number(a.cgpa) || 0);
      if (sortOption === 'name_asc') return (a.studentName || '').localeCompare(b.studentName || '');
      return 0;
    });
  }, [items, statusFilter, search, sortOption]);

  const tabMeta = TABS.find((t) => t.id === tab) || TABS[0];

  const getApplicationsCsv = useCallback(
    (scope) => {
      const list = scope === 'current' ? filtered : items;
      const headers = ['Student', 'Email', 'College', 'Branch', 'CGPA', 'Opening', 'Type', 'Status', 'Applied', 'Source'];
      const rows = list.map((a) => [
        a.studentName,
        a.email,
        a.collegeName,
        a.branch,
        a.cgpa != null ? String(a.cgpa) : '',
        a.openingTitle,
        jobTypeLabel(a.jobType),
        a.status,
        a.appliedAt ? formatDate(a.appliedAt) : '',
        a.sourceKind === 'drive' ? 'Placement drive' : 'Program',
      ]);
      return { headers, rows };
    },
    [filtered, items],
  );

  const openResume = (url) => {
    if (!url) { addToast('No resume on file for this student.', 'info'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const updateStatus = async (app, status) => {
    try {
      const res = await fetch('/api/employer/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id, sourceKind: app.sourceKind, status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to update status');
      await mutate();
      addToast(`Application marked as ${formatStatus(status)}.`, 'success');
    } catch (e) {
      addToast(e.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* High-Fidelity Glassmorphic Hero Banner */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: 'white',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={28} /> Applications Pipeline
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {tabMeta.desc}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <ExportCsvSplitButton
            filenameBase={`employer-applications-${tab}`}
            currentCount={filtered.length}
            fullCount={items.length}
            getRows={getApplicationsCsv}
          />
        </div>
      </div>

      {/* Type Tabs - pill style */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const n = counts[t.id] ?? 0;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setStatusFilter(''); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.5rem',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--primary-600)' : 'var(--bg-secondary)',
                color: active ? 'white' : 'var(--text-secondary)',
                boxShadow: active ? '0 4px 10px rgba(79, 70, 229, 0.25)' : 'none',
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
              {t.shortLabel}
              <span style={{ opacity: 0.85, fontSize: '0.8rem', background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-primary)', borderRadius: '999px', padding: '0.1rem 0.4rem', fontWeight: 700, color: active ? 'white' : 'var(--text-tertiary)' }}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--danger-200)', background: 'var(--danger-50)', padding: '1.25rem 1.5rem' }}>
          <p className="text-sm" style={{ margin: 0, color: 'var(--danger-700)', fontWeight: 500 }}>{error.message}</p>
        </div>
      )}

      {/* Toolbar Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--border-default)' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            placeholder="Search by name, email, college, or opening…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.65rem', paddingBottom: '0.65rem', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sort:</span>
          <select className="form-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ width: 'auto', padding: '0.65rem 2rem 0.65rem 1rem', fontSize: '0.95rem', fontWeight: 500 }}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="cgpa_desc">Highest CGPA</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', fontWeight: 600, marginLeft: 'auto' }}>
          {filtered.length} of {items.length} shown
        </span>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {STATUS_PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setStatusFilter(p.key)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: statusFilter === p.key ? '1.5px solid var(--primary-400)' : '1.5px solid var(--border-default)',
              background: statusFilter === p.key ? 'var(--primary-50)' : 'var(--bg-primary)',
              color: statusFilter === p.key ? 'var(--primary-700)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No applications yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Students apply from placement drives (Jobs) or from Internships / Projects.<br />
            Post a job to start receiving applications.
          </p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ paddingLeft: '1.5rem' }}>Student</th>
                  <th>College</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Opening</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const appName = String(app?.studentName || 'Student').trim() || 'Student';
                  const initials = appName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={`${app.sourceKind}-${app.id}`}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className="avatar avatar-sm"
                            style={{
                              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                              color: 'var(--primary-700)',
                              fontWeight: 700, fontSize: '0.75rem',
                              border: '1px solid var(--primary-300)'
                            }}
                          >
                            {initials || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{app.studentName}</div>
                            <div className="text-xs text-tertiary">{app.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <Building2 size={13} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                          {app.collegeName}
                        </div>
                      </td>
                      <td className="text-sm text-secondary">{app.branch || '—'}</td>
                      <td>
                        {app.cgpa != null ? (
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{app.cgpa}</span>
                        ) : '—'}
                      </td>
                      <td style={{ maxWidth: 220, fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{app.openingTitle}</div>
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{jobTypeLabel(app.jobType)}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(app.status)} badge-dot`} style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                          {formatStatus(app.status)}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">{app.appliedAt ? formatDate(app.appliedAt) : '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openResume(app.resumeUrl, app.studentName)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={14} /> Resume
                          </button>
                          {(app.status === 'applied' || app.status === 'on_hold') && (
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateStatus(app, 'shortlisted')}>
                              Shortlist
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
