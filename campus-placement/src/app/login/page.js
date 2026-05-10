'use client';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { getDashboardPath } from '@/lib/utils';
import { DEMO_LOGINS, DEMO_SEED_PASSWORD, isDemoLoginsEnabled, SEEDED_EMPLOYER_CREDENTIALS } from '@/lib/demoLogins';
import { ArrowRight, ChevronDown, ChevronUp, KeyRound, GraduationCap, Building2, School, ShieldCheck, Users, Eye, EyeOff } from 'lucide-react';

/** Match `/demo-accounts` three-column grouping: Students | Employers | (Super + College admins). */
const DEMO_GROUP_META = {
  student: {
    label: 'Students',
    icon: GraduationCap,
    color: 'var(--primary-700)',
    bg: 'var(--primary-50)',
    border: 'var(--primary-200)',
  },
  employer: {
    label: 'Employers',
    icon: Building2,
    color: 'var(--success-700)',
    bg: 'var(--success-50)',
    border: 'var(--success-200)',
  },
  admin: {
    label: 'College Admins',
    icon: School,
    color: 'var(--warning-700)',
    bg: 'var(--warning-50)',
    border: 'var(--warning-200)',
  },
  superadmin: {
    label: 'Super Admins',
    icon: ShieldCheck,
    color: 'var(--danger-700)',
    bg: 'var(--danger-50)',
    border: 'var(--danger-200)',
  },
  dummy: {
    label: 'Coming Soon',
    icon: Users,
    color: 'var(--text-tertiary)',
    bg: 'var(--bg-secondary)',
    border: 'var(--border-default)',
  },
};

function getGroupKey(demo) {
  if (demo.isDummy) return 'dummy';
  if (demo.icon === '🎓') return 'student';
  if (demo.icon === '🏢') return 'employer';
  if (demo.icon === '⚙️') return 'superadmin';
  if (demo.icon === '🏫') return 'admin';
  return 'admin';
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}><div className="skeleton" style={{ width: 220, height: 28 }} /></div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceLogin = searchParams.get('force') === '1';
  const { status, data: session } = useSession();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredBanner, setRegisteredBanner] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const signingOut = useRef(false);
  const toast = useToast();
  const uniqueDemoLogins = useMemo(() => {
    const seen = new Set();
    const merged = [...DEMO_LOGINS, ...SEEDED_EMPLOYER_CREDENTIALS];
    return merged.filter((d) => {
      const key = String(d?.email || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = new URLSearchParams(window.location.search).get('email');
    if (email) {
      setFormData((prev) => ({
        ...prev,
        email: email,
        password: DEMO_SEED_PASSWORD,
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('registered');
    if (q === 'pending-platform') {
      setRegisteredBanner(
        'Registration received. Your account will be activated after platform approval — watch your inbox for email confirmation.',
      );
    } else if (q === 'true') {
      setRegisteredBanner('Account created. You can sign in below.');
    }
  }, []);

  // If ?force=1, sign out existing session so the user can switch accounts
  useEffect(() => {
    if (forceLogin && status === 'authenticated' && !signingOut.current) {
      signingOut.current = true;
      signOut({ redirect: false }).then(() => {
        signingOut.current = false;
      });
    }
  }, [forceLogin, status]);

  useEffect(() => {
    if (forceLogin) return; // don't auto-redirect when force login
    if (status !== 'authenticated' || !session?.user?.role) return;
    router.replace(getDashboardPath(session.user.role));
  }, [status, session, router, forceLogin]);

  if (!forceLogin && (status === 'loading' || status === 'authenticated')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="skeleton" style={{ width: 220, height: 28 }} />
      </div>
    );
  }

  const showDemoLogins = isDemoLoginsEnabled();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        const res = await fetch('/api/auth/session');
        const sess = await res.json();
        const role = sess?.user?.role;
        const path = getDashboardPath(role);
        if (typeof window !== 'undefined') {
          window.location.replace(`${window.location.origin}${path}`);
        } else {
          router.replace(path);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredential = (demo) => {
    if (demo.isDummy) {
      toast.info("Placement Committee is coming soon. It's currently in design.");
      return;
    }
    setError('');
    setFormData({ email: demo.email, password: DEMO_SEED_PASSWORD });
    setShowCredentials(false);
    toast.info('Credentials auto-filled — click Sign In.');
  };

  const demosByGroup = useMemo(() => {
    const buckets = { student: [], employer: [], admin: [], superadmin: [], dummy: [] };
    for (const d of uniqueDemoLogins) {
      const k = getGroupKey(d);
      if (buckets[k]) buckets[k].push(d);
    }
    return buckets;
  }, [uniqueDemoLogins]);

  /** One card — same structure as a column on `/demo-accounts`. */
  const renderDemoListCard = (groupKey) => {
    const items = demosByGroup[groupKey] || [];
    if (items.length === 0) return null;
    const meta = DEMO_GROUP_META[groupKey];
    const Icon = meta.icon;
    return (
      <div
        key={groupKey}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          minWidth: 0,
        }}
      >
        <div
          style={{
            background: meta.bg,
            borderBottom: `1px solid ${meta.border}`,
            padding: '0.5rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: meta.color,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
          }}
        >
          <Icon size={13} aria-hidden />
          {meta.label} ({items.length})
        </div>
        <div>
          {items.map((demo, i) => (
            <div
              key={demo.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.6rem',
                borderBottom: i < items.length - 1 ? '1px solid var(--border-default)' : 'none',
                background: 'var(--bg-primary)',
                gap: '0.4rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: demo.isDummy ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {demo.label}
                  {demo.name ? (
                    <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> · {demo.name}</span>
                  ) : null}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'monospace',
                    marginTop: '0.06rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {demo.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fillCredential(demo)}
                disabled={demo.isDummy}
                style={{
                  flexShrink: 0,
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${demo.isDummy ? 'var(--border-default)' : meta.border}`,
                  background: demo.isDummy ? 'var(--bg-secondary)' : meta.bg,
                  color: demo.isDummy ? 'var(--text-tertiary)' : meta.color,
                  cursor: demo.isDummy ? 'not-allowed' : 'pointer',
                }}
              >
                {demo.isDummy ? 'Soon' : 'Use →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      <div style={{ width: '100%', maxWidth: showCredentials && showDemoLogins ? 'min(960px, 100%)' : '420px', transition: 'max-width 0.2s ease' }}>
        
        {/* Modern Centered Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', height: '2.5rem', width: '2.5rem', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', backgroundColor: 'var(--primary-600)', color: '#ffffff', fontWeight: 'bold', fontSize: '1.125rem', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
              P
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>PlacementHub</span>
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Sign in to your account to continue</p>
        </div>

        {/* Auth Card */}
        <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-default)' }}>
          
          {registeredBanner && !error && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--success-50)', border: '1px solid var(--success-100)', borderRadius: 'var(--radius-md)', color: 'var(--success-700)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {registeredBanner}
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-50)', border: '1px solid var(--danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--danger-700)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {showDemoLogins && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-default)' }}>
              <button
                type="button"
                id="view-credentials-btn"
                onClick={() => setShowCredentials((v) => !v)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  background: showCredentials ? 'var(--primary-50)' : 'var(--bg-secondary)',
                  border: `1px solid ${showCredentials ? 'var(--primary-300)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: showCredentials ? 'var(--primary-700)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={15} />
                  Demo accounts
                </span>
                {showCredentials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showCredentials && (
                <div
                  style={{
                    marginTop: '0.625rem',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.875rem',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-default)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    Same layout as <strong>View all system accounts</strong> — password:{' '}
                    <code
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        background: 'var(--bg-primary)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 4,
                      }}
                    >
                      {DEMO_SEED_PASSWORD}
                    </code>
                  </div>

                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-primary)',
                    }}
                  >
                    <div
                      className="login-demo-accounts-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '0.75rem',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {renderDemoListCard('student')}
                        {renderDemoListCard('dummy')}
                      </div>
                      <div style={{ minWidth: 0 }}>{renderDemoListCard('employer')}</div>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {renderDemoListCard('superadmin')}
                        {renderDemoListCard('admin')}
                      </div>
                    </div>
                  </div>
                  <style>{`
                    @media (max-width: 720px) {
                      .login-demo-accounts-grid {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">Password</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingRight: '2.4rem' }}
                required
              />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="btn btn-ghost btn-sm"
                  style={{
                    position: 'absolute',
                    right: '0.45rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    minWidth: 28,
                    width: 28,
                    height: 28,
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.625rem', fontSize: '1rem', justifyContent: 'center' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)' }}>
            <Link
              href="/demo-accounts"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} />
                View all system accounts
              </span>
              <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </div>

      </div>
    </div>
  );
}
