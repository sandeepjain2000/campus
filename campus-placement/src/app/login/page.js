'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EntityLogo from '@/components/EntityLogo';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filledFrom, setFilledFrom] = useState(''); // tracks which card was clicked
  const toast = useToast();

  const DEMO_PASSWORD = 'Admin@123';

  const demoLogins = [
    { label: 'Student (IITM)', email: 'arjun.verma@iitm.edu', icon: '🎓', name: 'IIT Madras' },
    { label: 'Student (NITT)', email: 'sneha.rao@nitt.edu', icon: '🎓', name: 'NIT Trichy' },
    { label: 'Student (BITS)', email: 'rohan.mehta@bits.edu', icon: '🎓', name: 'BITS Pilani' },
    { label: 'Employer (TechCorp)', email: 'hr@techcorp.com', icon: '🏢', name: 'TechCorp Solutions' },
    { label: 'Employer (Infosys)', email: 'hr@infosys.com', icon: '🏢', name: 'Infosys Limited' },
    { label: 'Admin (IITM)', email: 'admin@iitm.edu', icon: '🏫', name: 'IIT Madras' },
    { label: 'Admin (NITT)', email: 'admin@nitt.edu', icon: '🏫', name: 'NIT Trichy' },
    { label: 'Super Admin', email: 'admin@placementhub.com', icon: '⚙️', name: 'PlacementHub' },
    { label: 'Placement Committee', email: 'committee@iitm.edu', icon: '🤝', isDummy: true, name: 'IIT Madras' },
  ];

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
        setError('Invalid email or password. Please try again.');
      } else {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        const role = session?.user?.role;
        const paths = {
          super_admin: '/dashboard/admin',
          college_admin: '/dashboard/college',
          employer: '/dashboard/employer',
          student: '/dashboard/student',
        };
        router.push(paths[role] || '/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Card click: only populate the form fields (user then clicks Sign In)
  const handleDemoCardClick = (demo) => {
    if (demo.isDummy) {
      toast.info("Placement Committee is coming soon. It's currently in design.");
      return;
    }
    setError('');
    setFilledFrom(demo.email);
    setFormData({ email: demo.email, password: DEMO_PASSWORD });
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card animate-slideUp">
          <Link href="/" className="auth-logo">
            <div className="sidebar-logo-icon">P</div>
            PlacementHub
          </Link>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-50)',
              border: '1px solid var(--danger-100)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--danger-600)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {filledFrom && !error && (
            <div style={{
              padding: '0.6rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-lg)',
              color: '#166534',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              ✅ Credentials filled — click <strong>Sign In</strong> to continue
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFilledFrom(''); }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFilledFrom(''); }}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider">or try a demo account</div>

          {/* Demo disclaimer */}
          <div style={{
            background: 'linear-gradient(135deg, #fef9c3, #fef3c7)',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: '0.6rem 0.9rem',
            fontSize: '0.75rem',
            color: '#92400e',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem',
          }}>
            <span>💡</span>
            <span>
              <strong>Demo mode:</strong> Click any card below to auto-fill credentials into the login form, then click <strong>Sign In</strong>.
            </span>
          </div>

          <div className="role-select-grid">
            {demoLogins.map((demo) => {
              const isSelected = filledFrom === demo.email;
              return (
                <button
                  key={demo.email}
                  className="role-card"
                  onClick={() => handleDemoCardClick(demo)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    outline: isSelected ? '2px solid var(--primary-500)' : 'none',
                    background: isSelected ? 'var(--primary-50)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <EntityLogo name={demo.name} size="xs" shape="rounded" />
                    <span className="role-card-name" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                      {demo.label}
                      {isSelected && <span style={{ color: 'var(--primary-500)', marginLeft: '0.3rem' }}>✓</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--gray-500)', wordBreak: 'break-all' }}>
                      📧 {demo.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--gray-500)' }}>
                      🔑 Auto-fills credentials
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="auth-footer">
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
