'use client';
import { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import MobileHeader from '@/components/mobile/MobileHeader';
import CompanyNameLink from '@/components/CompanyNameLink';
import { useToast } from '@/components/ToastProvider';
import { CalendarDays, Download, Plus, Users, Clock, IndianRupee, Building2, FileText } from 'lucide-react';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load internships');
  return data;
};

export default function mb_InternshipResults() {
  const { addToast } = useToast();
  const { data, error, isLoading } = useSWR('/api/college/internships', fetcher);
  const internships = Array.isArray(data?.internships) ? data.internships : [];
  
  const showNotReady = (label) => addToast(`${label} is coming soon.`, 'info');

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

  return (
    <>
      <MobileHeader 
        title="Internship Results" 
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/dashboard/college/internships" className="btn btn-primary btn-sm">
              <Plus size={16} /> Add
            </Link>
          </div>
        }
      />
      <div className="animate-fadeIn" style={{ padding: '1rem 1rem 5rem 1rem' }}>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="skeleton" style={{ height: 80, borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: 80, borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: 80, borderRadius: '12px' }} />
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '1rem', color: 'var(--danger-600)', textAlign: 'center', marginBottom: '1.25rem' }}>
            <p style={{ margin: 0 }}>{error.message || 'Could not load internship results.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Total', value: stats.totalInterns, icon: Users, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
              { label: 'Published', value: stats.ongoing, icon: Clock, color: 'var(--success-600)', bg: 'var(--success-50)' },
              { label: 'Avg Stipend', value: stats.avgStipendLabel, icon: IndianRupee, color: 'var(--warning-600)', bg: 'var(--warning-50)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '0.4rem', borderRadius: '50%', background: bg, color }}><Icon size={16} /></div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 500 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Opportunities</h3>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: '12px' }} />)}
          </div>
        ) : internships.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CalendarDays size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <div style={{ fontWeight: 600 }}>No internship results found</div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add your first internship to start tracking.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {internships.map((intern) => {
              const min = Number(intern.salary_min);
              const max = Number(intern.salary_max);
              const stipendStr = (min || max) 
                ? `${min ? `₹${Math.round(min/1000)}k` : ''} ${max ? `- ₹${Math.round(max/1000)}k` : ''}`
                : 'Not specified';

              return (
                <div key={intern.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{intern.title || 'Untitled Role'}</div>
                    <span className={`badge ${intern.status === 'published' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                      {intern.status || 'draft'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Building2 size={14} style={{ opacity: 0.7 }} />
                    <CompanyNameLink name={intern.company_name || 'Unknown Company'} website={intern.website} style={{ fontWeight: 500 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Stipend / mo</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stipendStr}</span>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => showNotReady('View agreement')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                      <FileText size={12} style={{ marginRight: '0.25rem' }} /> Agreement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
