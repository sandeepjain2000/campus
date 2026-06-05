'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  GraduationCap,
  Building2,
  School,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { appendClientDebugLog } from '@/lib/clientDebugLog';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import DevScreenTag from '@/components/DevScreenTag';

export default function LandingPage() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '?';
  const buildTimeIso = process.env.NEXT_PUBLIC_BUILD_TIME || '';
  const gitSha = process.env.NEXT_PUBLIC_APP_GIT_SHA || '';
  const deployId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || '';
  const [marketingUrl, setMarketingUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.marketingWebsiteUrl) setMarketingUrl(String(d.marketingWebsiteUrl));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    appendClientDebugLog({
      source: 'landing',
      action: 'view',
      version: appVersion,
      buildTime: buildTimeIso || null,
      gitSha: gitSha || null,
      deploymentId: deployId || null,
    });
  }, [appVersion, buildTimeIso, gitSha, deployId]);

  /** Same-tab navigation so browser Back returns to the landing page. */
  function MarketingNavLink({ internalHref, children, alwaysInternal = false, ...rest }) {
    const useBuiltIn = alwaysInternal || internalHref === '/features';
    if (marketingUrl && !useBuiltIn) {
      return (
        <a href={marketingUrl} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={internalHref} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Demo Email Banner */}
      <div style={{ backgroundColor: 'var(--primary-50)', borderBottom: '1px solid var(--primary-200)', padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-primary)', zIndex: 60, position: 'relative' }}>
        <strong>Demo Emails:</strong> All System emails can be checked on this disposable mail id: <strong>placementhub@yopmail.com</strong> at{' '}
        <a href="https://yopmail.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600, color: 'var(--primary-900)' }}>https://yopmail.com/</a>
        {' · '}
        <Link href="/developer" prefetch={false} style={{ fontWeight: 700, color: 'var(--primary-900)', textDecoration: 'underline' }}>Developer</Link>
        {' · '}
        <Link href="/data-entry" prefetch={false} style={{ fontWeight: 700, color: 'var(--primary-900)', textDecoration: 'underline' }}>Data</Link>
      </div>

      {/* Bottom-left: email workflows only */}
      <div
        data-ph-demo-stack
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'auto',
          maxWidth: '12rem',
        }}
      >
        <div data-ph-runner-slot aria-hidden="true" style={{ display: 'none' }} />
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.25rem', marginBottom: '0.35rem' }}>
            Demo Tools
          </div>
          <Link
            href="/email-notifications"
            prefetch={false}
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Mail size={14} aria-hidden /> Email workflows
          </Link>
        </div>
      </div>

      {/* Top Navbar */}
      <header style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', height: '2.5rem', width: '2.5rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', backgroundColor: 'var(--primary-600)', color: '#ffffff', fontWeight: 'bold', fontSize: '1.125rem', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
              P
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1, letterSpacing: '-0.025em' }}>PlacementHub</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }} aria-label="Primary">
              <MarketingNavLink internalHref="/features" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Features</MarketingNavLink>
              <MarketingNavLink internalHref="/about" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>About</MarketingNavLink>
              <MarketingNavLink internalHref="/contact" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact</MarketingNavLink>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <DevScreenTag />
              <ThemeToggleButton />
              <Link href="/register" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Register
              </Link>
              <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle Light Theme Background Elements */}
          <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px', height: '400px', background: 'radial-gradient(ellipse at top, var(--primary-50) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
          
          <div style={{ maxWidth: '48rem', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', border: '1px solid var(--primary-200)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem' }}>
              <Rocket size={16} /> India&apos;s #1 Campus Recruitment Platform
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Transform Your <br />
              <span style={{ color: 'var(--primary-600)' }}>Campus Placements</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '42rem', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
              Connect students, employers, and colleges on a single intelligent platform. 
              Streamline drives, automate hiring pipelines, and track every offer in real-time.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1.125rem', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))', border: 'none' }}>
                Get Started Free <ArrowRight size={18} />
              </Link>
              <MarketingNavLink internalHref="/features" className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}>
                Explore Features
              </MarketingNavLink>
            </div>
          </div>

          <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '5rem auto 0 auto', paddingTop: '3rem', borderTop: '1px solid var(--border-default)' }}>
            {[
              { label: 'Colleges', value: '500+', color: 'var(--primary-600)' },
              { label: 'Students Placed', value: '10K+', color: '#0EA5E9' },
              { label: 'Employers', value: '200+', color: 'var(--primary-600)' },
              { label: 'Avg. Package', value: '₹12L', color: '#10B981' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.025em' }}>{stat.value}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '6rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 4rem auto' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
              Everything You Need for <span style={{ color: 'var(--primary-600)' }}>Seamless Placements</span>
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
              From drive scheduling to offer management — one platform to rule them all.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {[
              {
                icon: GraduationCap,
                title: 'Student Portal',
                desc: 'Complete profile management, resume builder, skill tracking, document uploads, and one-click applications.',
              },
              {
                icon: Building2,
                title: 'Employer Dashboard',
                desc: 'Post jobs, set eligibility criteria, schedule drives, manage hiring pipelines, and publish offers.',
              },
              {
                icon: School,
                title: 'College Management',
                desc: 'Verify students, configure placement rules, manage calendars, approve employers, and generate reports.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                desc: 'Placement rates, salary trends, department-wise stats, employer reliability scores, and year-over-year comparisons.',
              },
              {
                icon: CalendarDays,
                title: 'Smart Scheduling',
                desc: 'Calendar integration, conflict detection, academic blocking, buffer days, and facility booking.',
              },
              {
                icon: ShieldCheck,
                title: 'Multi-Tenant & Secure',
                desc: 'Complete data isolation, role-based access, audit logs, and enterprise-grade security for every college.',
              },
            ].map((feature) => (
              <div key={feature.title} style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', padding: '2rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.25rem', display: 'inline-flex', height: '3.5rem', width: '3.5rem', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                  <feature.icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{feature.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
          <div className="gradient-banner" style={{ borderRadius: 'var(--radius-2xl)', border: 'none', padding: '4rem 2rem', maxWidth: '56rem', margin: '0 auto', boxShadow: 'var(--shadow-xl)' }}>
            <h2 className="gradient-banner-title" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
              Ready to Transform Placements?
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--banner-fg-muted)', marginBottom: '2.5rem', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto' }}>
              Join 500+ colleges already using PlacementHub to drive better outcomes.
            </p>
            <Link href="/register" className="btn gradient-banner-solid-btn" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', fontWeight: 700, borderRadius: 'var(--radius-lg)' }}>
              Start Your Free Trial
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', height: '1.5rem', width: '1.5rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem', backgroundColor: 'var(--primary-600)', color: '#ffffff', fontSize: '0.75rem' }}>P</div>
              PlacementHub
            </div>
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }} aria-label="Footer">
              <MarketingNavLink internalHref="/features" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Features</MarketingNavLink>
              <MarketingNavLink internalHref="/about" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>About</MarketingNavLink>
              <MarketingNavLink internalHref="/contact" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact</MarketingNavLink>
              <Link href="/register" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Register</Link>
              <Link href="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sign in</Link>
              <Link href="/developer" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Developer</Link>
            </nav>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>© 2026 PlacementHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
