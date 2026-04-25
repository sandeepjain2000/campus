'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { CalendarDays, Download, Plus, Users, Clock, IndianRupee, FileText } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load internships');
  return data;
};

export default function CollegeInternshipResultsPage() {
  const { addToast } = useToast();
  const { data, error, isLoading } = useSWR('/api/college/internships', fetcher);
  const internships = Array.isArray(data?.internships) ? data.internships : [];

  const showNotReady = (label) => {
    addToast(`${label} is not available yet in this build.`, 'info');
  };

  const stats = useMemo(() => {
    const totalInterns = internships.length;
    const ongoing = internships.filter((intern) => intern.status === 'published').length;
    const stipendValues = internships
      .map((intern) => {
        const min = Number(intern.salary_min) || 0;
        const max = Number(intern.salary_max) || 0;
        return max > 0 ? (min + max) / 2 : min;
      })
      .filter((v) => Number.isFinite(v) && v > 0);

    const avgStipend = stipendValues.length
      ? Math.round(stipendValues.reduce((sum, v) => sum + v, 0) / stipendValues.length)
      : 0;

    const avgStipendLabel = avgStipend > 0 ? `₹${Math.round(avgStipend / 1000)}k` : '—';
    return { totalInterns, ongoing, avgStipendLabel };
  }, [internships]);

  if (isLoading) {
    return <div className="skeleton skeleton-card" style={{ height: 220, margin: '2rem' }} />;
  }

  if (error) {
    return (
      <div className="animate-fadeIn" style={{ padding: '2rem', color: 'var(--danger-600)' }}>
        <p>{error.message || 'Could not load internship results.'}</p>
        <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>
          Check college admin access and database connectivity, then reload.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarDays size={28} className="text-secondary" strokeWidth={1.5} /> Internship results
          </h1>
          <p className="text-secondary">Track live internship postings available to your campus.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => showNotReady('Export report')}>
            <Download size={16} /> Export Report
          </button>
          <button type="button" className="btn btn-primary" onClick={() => showNotReady('Link new offer')}>
            <Plus size={16} /> Link New Offer
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stats-card">
          <div className="stats-card-icon indigo"><Users size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.totalInterns}</div>
          <div className="stats-card-label">Total Interns</div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon green"><Clock size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.ongoing}</div>
          <div className="stats-card-label">Ongoing</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-icon amber"><IndianRupee size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.avgStipendLabel}</div>
          <div className="stats-card-label">Avg Stipend</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Internship Role</th>
              <th>Company</th>
              <th>Stipend (Monthly)</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {internships.map((intern) => (
              <tr key={intern.id}>
                <td className="font-semibold">{intern.title || '—'}</td>
                <td className="text-primary">{intern.company_name || '—'}</td>
                <td>
                  {(Number(intern.salary_min) || Number(intern.salary_max))
                    ? `${Number(intern.salary_min) ? `₹${Math.round(Number(intern.salary_min) / 1000)}k` : '—'} - ${Number(intern.salary_max) ? `₹${Math.round(Number(intern.salary_max) / 1000)}k` : '—'}`
                    : '—'}
                </td>
                <td>{intern.job_type || 'internship'}</td>
                <td>
                  <span className={`badge ${intern.status === 'published' ? 'badge-success' : 'badge-primary'} badge-dot`}>
                    {intern.status || 'draft'}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => showNotReady('View agreement')}>
                    <FileText size={14} style={{ marginRight: '0.25rem' }} /> View Agreement
                  </button>
                </td>
              </tr>
            ))}
            {internships.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No internship records available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
