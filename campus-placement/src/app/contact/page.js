import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={16} aria-hidden /> Home
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Register
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem', lineHeight: 1.15 }}>
          Contact
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
          For demos, partnerships, or campus onboarding, reach the PlacementHub team using the channel your institution already uses with us. If you are a student, please contact your placement office first — they control enrollment and verification on the platform.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
          }}
        >
          <Mail size={20} style={{ flexShrink: 0, marginTop: '0.15rem', color: 'var(--primary-600)' }} aria-hidden />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Email</div>
            <a href="mailto:support@placementhub.app" style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
              support@placementhub.app
            </a>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Replace this address with your production support inbox in deployment configuration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
