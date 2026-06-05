'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import { COMPANY_SORT_OPTIONS } from '@/lib/tableQueryPresets';
import Link from 'next/link';
import { CalendarDays, Download, Plus, Users, Clock, IndianRupee, FileText } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import CompanyNameLink from '@/components/CompanyNameLink';

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
  const {
    search,
    setSearch,
    sort,
    setSort,
    filtered: displayInternships,
    filteredCount,
    totalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(internships, {
    getSearchText: (intern) => [intern.title, intern.company_name, intern.job_type, intern.status].filter(Boolean).join(' '),
    sortOptions: COMPANY_SORT_OPTIONS,
    defaultSort: 'company_asc',
  });
  const showNotReady = (label) => addToast(`${label} is coming soon.`, 'info');

  const exportCsv = () => {
    const header = ['Role', 'Company', 'Salary Min', 'Salary Max', 'Type', 'Status'];
    const rows = internships.map((intern) => [
      intern.title || '',
      intern.company_name || '',
      String(intern.salary_min || ''),
      String(intern.salary_max || ''),
      intern.job_type || '',
      intern.status || '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college_internship_results.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addToast('Internship results exported.', 'success');
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
          Confirm college admin access, then reload or contact support if this continues.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'var(--banner-gradient)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarDays size={28} /> Internship Results
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>Track internship opportunities and outcomes available to your campus.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={exportCsv} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <Link href="/dashboard/college/internships" className="btn banner-cta-solid" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Add Internship
          </Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Listings', value: stats.totalInterns, icon: Users, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { label: 'Published', value: stats.ongoing, icon: Clock, color: 'var(--success-600)', bg: 'rgba(5,150,105,0.08)' },
          { label: 'Avg Stipend', value: stats.avgStipendLabel, icon: IndianRupee, color: 'var(--warning-600)', bg: 'rgba(217,119,6,0.08)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: bg, color }}><Icon size={20} strokeWidth={2} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {totalCount > 0 ? (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search role, company, or status…"
          sort={sort}
          onSortChange={setSort}
          sortOptions={COMPANY_SORT_OPTIONS}
          filteredCount={filteredCount}
          totalCount={totalCount}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      ) : null}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Internship Role</th>
              <th>Company</th>
              <th>Stipend (Monthly)</th>
              <th>Type</th>
              <th>Status</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {displayInternships.length === 0 && totalCount > 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary">
                  No internships match your search.
                </td>
              </tr>
            ) : null}
            {displayInternships.map((intern) => (
              <tr key={intern.id}>
                <td className="font-semibold">{intern.title || '—'}</td>
                <td>
                  <CompanyNameLink name={intern.company_name} website={intern.website} />
                </td>
                <td>
                  {(Number(intern.salary_min) || Number(intern.salary_max))
                    ? `${Number(intern.salary_min) ? `₹${Math.round(Number(intern.salary_min) / 1000)}k` : '—'} - ${Number(intern.salary_max) ? `₹${Math.round(Number(intern.salary_max) / 1000)}k` : '—'}`
                    : '—'}
                </td>
                <td>{intern.job_type || 'internship'}</td>
                <td>
                  <span className={`badge ${intern.status === 'published' ? 'badge-success' : 'badge-primary'} badge-dot`}>
                    {String(intern.status || 'draft').charAt(0).toUpperCase() + String(intern.status || 'draft').slice(1)}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => showNotReady('View agreement')}>
                    <FileText size={14} style={{ marginRight: '0.25rem' }} /> View Agreement
                  </button>
                </td>
              </tr>
            ))}
            {totalCount === 0 && (
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
