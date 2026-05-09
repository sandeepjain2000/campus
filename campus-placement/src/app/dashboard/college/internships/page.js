'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { GraduationCap, Building2, IndianRupee, BookOpen, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const fetcher = (url) => fetch(url).then((r) => r.json());

function stipendLabel(min, max) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && Number(min) === Number(max)) {
    return `${formatCurrency(Number(min))}/mo`;
  }
  if (min != null && max != null) {
    return `${formatCurrency(Number(min))} – ${formatCurrency(Number(max))}/mo`;
  }
  if (min != null) return `${formatCurrency(Number(min))}/mo`;
  return `${formatCurrency(Number(max))}/mo`;
}

export default function CollegeInternshipsPage() {
  const { data, error, isLoading } = useSWR('/api/college/internships', fetcher);

  const list = Array.isArray(data?.internships) ? data.internships : [];

  const stats = useMemo(() => {
    const n = list.length;
    let sum = 0;
    let count = 0;
    list.forEach((row) => {
      const a = row.salary_min != null ? Number(row.salary_min) : null;
      const b = row.salary_max != null ? Number(row.salary_max) : null;
      if (a != null && b != null) {
        sum += (a + b) / 2;
        count += 1;
      } else if (a != null) {
        sum += a;
        count += 1;
      } else if (b != null) {
        sum += b;
        count += 1;
      }
    });
    return {
      count: n,
      avgStipend: count ? Math.round(sum / count) : null,
      openings: list.reduce((s, r) => s + (parseInt(r.vacancies, 10) || 0), 0),
    };
  }, [list]);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <GraduationCap size={28} /> Internships & Programs
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0, position: 'relative', zIndex: 1 }}>Published internships, short projects, and hackathons for which your campus was selected.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Posted Listings', value: isLoading ? '…' : stats.count, icon: GraduationCap, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
          { label: 'Avg Monthly Stipend', value: stats.avgStipend != null ? formatCurrency(stats.avgStipend) : '—', icon: IndianRupee, color: 'var(--success-600)', bg: 'rgba(5,150,105,0.08)' },
          { label: 'Total Openings', value: isLoading ? '…' : stats.openings, icon: Building2, color: 'var(--warning-600)', bg: 'rgba(217,119,6,0.08)' },
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

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger-500)', marginBottom: '1rem' }}>
          <p className="text-sm">Could not load internships. Ensure you are signed in as a college admin and the database is configured.</p>
        </div>
      )}

      {isLoading && <p className="text-sm text-secondary">Loading…</p>}

      {!isLoading && !error && list.length === 0 && (
        <div className="card">
          <p className="text-secondary" style={{ margin: 0 }}>
            No published listings for your campus yet. Partners must publish from Internships or Projects and include your college. Ensure migration <span className="font-mono text-xs">006</span> (visibility table) is applied.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {list.map((row) => (
          <div key={row.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{row.title}</h3>
                  {row.job_type && row.job_type !== 'internship' ? (
                    <span className="badge badge-amber badge-dot">{row.job_type === 'hackathon' ? 'Hackathon' : 'Short project'}</span>
                  ) : (
                    <span className="badge badge-indigo badge-dot">Internship</span>
                  )}
                  <span className="badge badge-gray badge-dot">{row.company_name}</span>
                </div>
                <p className="text-sm text-secondary" style={{ margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                  {(row.description || '').slice(0, 280)}
                  {(row.description || '').length > 280 ? '…' : ''}
                </p>
                <div className="text-sm text-secondary" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <IndianRupee size={14} aria-hidden /> Stipend: {stipendLabel(row.salary_min, row.salary_max)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={14} aria-hidden /> Min CGPA: {row.min_cgpa != null ? Number(row.min_cgpa) : '—'}
                  </span>
                  <span>Openings: {row.vacancies ?? '—'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} aria-hidden /> Posted {row.created_at ? formatDate(row.created_at) : '—'}
                  </span>
                </div>
                {row.skills_required?.length ? (
                  <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {row.skills_required.map((s) => (
                      <span key={s} className="badge badge-gray">{s}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              {row.website ? (
                <a
                  href={row.website.startsWith('http') ? row.website : `https://${row.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Company site
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
