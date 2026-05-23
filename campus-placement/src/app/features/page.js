import Link from 'next/link';
import { ArrowLeft, GraduationCap, Building2, School, BarChart3, CalendarDays, ShieldCheck } from 'lucide-react';
export const dynamic = 'force-dynamic';

const items = [
  { icon: GraduationCap, title: 'Student portal', desc: 'Profiles, documents, applications, and offer tracking in one workspace.' },
  { icon: Building2, title: 'Employer tools', desc: 'Jobs, drives, assessments, and campus coordination with clear audit trails.' },
  { icon: School, title: 'College operations', desc: 'Rules, calendars, approvals, and reporting tuned for placement committees.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Placement velocity, salary bands, and department-level outcomes you can act on.' },
  { icon: CalendarDays, title: 'Scheduling', desc: 'Blocking windows, venue capacity, and drive sequencing without spreadsheet chaos.' },
  { icon: ShieldCheck, title: 'Governance', desc: 'Tenant isolation, roles, exports, and review-friendly logs for accountable teams.' },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={16} aria-hidden /> Home
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Product
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem', lineHeight: 1.15 }}>
          Features built for real placement cycles
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '42rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          PlacementHub connects students, employers, and colleges with workflows that match how drives actually run — not a generic ATS bolted onto campus life.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
          {items.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '1rem',
                padding: '1.25rem 1.35rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
              }}
            >
              <span style={{ display: 'flex', width: '2.75rem', height: '2.75rem', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--primary-600)', border: '1px solid var(--border-default)' }}>
                <Icon size={22} aria-hidden />
              </span>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem' }}>{title}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
