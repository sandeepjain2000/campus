'use client';

import useSWR from 'swr';
import { ClipboardList, Search, Building2, GraduationCap } from 'lucide-react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { useState, useMemo } from 'react';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load applications');
  return json;
};

export default function CollegeApplicationsPage() {
  const { data, isLoading, error } = useSWR('/api/college/applications', fetcher);
  const applications = Array.isArray(data?.applications) ? data.applications : [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => applications.filter(a => {
    const matchSearch = !search || [a.student_name, a.roll_number, a.department, a.company_name, a.drive_title].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  }), [applications, search, statusFilter]);

  const statuses = useMemo(() => [...new Set(applications.map(a => a.status).filter(Boolean))], [applications]);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <ClipboardList size={28} /> Student Applications
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0, position: 'relative', zIndex: 1 }}>
          {isLoading ? 'Loading…' : `${applications.length} total applications across all drives`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--border-default)' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input className="form-input" placeholder="Search student, roll, company, drive…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-select" style={{ width: 'auto', padding: '0.65rem 2rem 0.65rem 1rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{filtered.length} of {applications.length}</span>
      </div>

      {isLoading && <div className="skeleton skeleton-card" style={{ height: 300 }} />}
      {error && <div className="card" style={{ padding: '1.5rem', background: 'var(--danger-50)', border: '1px solid var(--danger-200)' }}><p style={{ margin: 0, color: 'var(--danger-700)', fontWeight: 600 }}>{error.message}</p></div>}

      {!isLoading && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ paddingLeft: '1.5rem' }}>Student</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Company</th>
                  <th>Drive</th>
                  <th>Status</th>
                  <th style={{ paddingRight: '1.5rem' }}>Applied</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const initials = (a.student_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={a.id}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, border: '1px solid var(--primary-300)' }}>{initials}</div>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{a.student_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.roll_number || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <GraduationCap size={13} style={{ flexShrink: 0 }} /> {a.department || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
                          <Building2 size={13} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} /> {a.company_name || '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.drive_title || '—'}</td>
                      <td><span className={`badge badge-${getStatusColor(a.status)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(a.status)}</span></td>
                      <td style={{ paddingRight: '1.5rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{a.applied_at ? formatDate(a.applied_at) : '—'}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <ClipboardList size={40} style={{ margin: '0 auto 1rem', opacity: 0.25 }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No applications found</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Students apply to drives from their dashboards.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
