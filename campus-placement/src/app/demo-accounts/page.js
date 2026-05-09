import { query } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Building2, School, ShieldCheck } from 'lucide-react';
import { DEMO_SEED_PASSWORD } from '@/lib/demoLogins';

export const dynamic = 'force-dynamic';

export default async function DemoAccountsPage() {
  const result = await query(`
    SELECT 
      u.id, u.email, u.role, u.first_name, u.last_name,
      t.name as college_name,
      ep.company_name
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    LEFT JOIN employer_profiles ep ON u.id = ep.user_id
    WHERE u.is_active = true
    ORDER BY u.role, u.email
  `);

  const users = result.rows;

  const groups = [
    { key: 'student', label: 'Students', icon: GraduationCap, bg: 'var(--primary-50)', color: 'var(--primary-700)', border: 'var(--primary-200)' },
    { key: 'employer', label: 'Employers', icon: Building2, bg: 'var(--success-50)', color: 'var(--success-700)', border: 'var(--success-200)' },
    { key: 'college_admin', label: 'College Admins', icon: School, bg: 'var(--warning-50)', color: 'var(--warning-700)', border: 'var(--warning-200)' },
    { key: 'super_admin', label: 'Super Admins', icon: ShieldCheck, bg: 'var(--danger-50)', color: 'var(--danger-700)', border: 'var(--danger-200)' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
              System Accounts
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Complete list of all active users in the database for demonstration and testing. All accounts share the same password.
            </p>
          </div>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>Universal Password:</strong> <code style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.4rem', borderRadius: 4, fontWeight: 700, color: 'var(--text-primary)' }}>{DEMO_SEED_PASSWORD}</code>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Click on any account to go back to the login page with the email auto-filled.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groups.map(group => {
            const Icon = group.icon;
            const groupUsers = users.filter(u => u.role === group.key);
            
            if (groupUsers.length === 0) return null;
            
            return (
              <div key={group.key} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ background: group.bg, borderBottom: `1px solid ${group.border}`, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: group.color, fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase', fontSize: '0.8125rem' }}>
                  <Icon size={16} />
                  {group.label} ({groupUsers.length})
                </div>
                <div>
                  {groupUsers.map((user, i) => (
                    <Link
                      key={user.email}
                      href={`/login?email=${encodeURIComponent(user.email)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: i < groupUsers.length - 1 ? '1px solid var(--border-default)' : 'none',
                        textDecoration: 'none',
                        transition: 'background-color 0.15s',
                        cursor: 'pointer'
                      }}
                      className="hover-bg-secondary"
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {user.first_name} {user.last_name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {group.key === 'student' && user.college_name && <span>{user.college_name}</span>}
                          {group.key === 'employer' && user.company_name && <span>{user.company_name}</span>}
                          {group.key === 'college_admin' && user.college_name && <span>{user.college_name}</span>}
                          {group.key === 'super_admin' && <span>Platform Administrator</span>}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {user.email}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-secondary:hover { background-color: var(--bg-secondary); }
      `}} />
    </div>
  );
}
