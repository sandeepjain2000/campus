import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={16} aria-hidden /> Home
          </Link>
          <Link href="/login" className="btn btn-secondary btn-sm">
            Sign in
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem', lineHeight: 1.15 }}>
          About PlacementHub
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
          PlacementHub exists to reduce friction between training and hiring: fewer lost emails, fewer conflicting spreadsheets, and clearer handoffs from committee to student to recruiter.
        </p>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
          We focus on Indian campus placement realities — multi-year batches, NAAC and internal checks, drive calendars that respect exams, and employers who need predictable communication channels.
        </p>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          The product is built for production use: tenant-aware data, exportable audit trails, and UI patterns that stay legible during high-stress placement weeks.
        </p>
      </main>
    </div>
  );
}
