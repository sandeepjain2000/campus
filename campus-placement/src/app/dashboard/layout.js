'use client';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ToastProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider';
import { getInitials, getRoleDisplayName } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import {
  LayoutDashboard, User, Bell, Target, FileEdit, Award, FileText,
  Building2, GraduationCap, FolderDot, Briefcase, ClipboardList, Send, Gem, MessageSquare,
  Building, Calendar, Settings, TrendingUp, Users, Moon, Sun, Menu, HelpCircle, ListChecks,
} from 'lucide-react';

const getActiveCampusName = () => {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('activeCampus') : null;
    return raw ? JSON.parse(raw).name : 'Select Campus';
  } catch {
    return 'Select Campus';
  }
};

const menuConfig = {
  student: {
    title: 'Student',
    sections: [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
          { label: 'My Profile', href: '/dashboard/student/profile', icon: User },
          { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
        ]
      },
      {
        title: 'Placements',
        items: [
          { label: 'Browse Drives', href: '/dashboard/student/drives', icon: Target },
          { label: 'My Applications', href: '/dashboard/student/applications', icon: FileEdit },
          { label: 'My Interviews', href: '/dashboard/student/interviews', icon: Calendar },
          { label: 'My Offers', href: '/dashboard/student/offers', icon: Award },
          { label: 'Clarifications', href: '/dashboard/student/clarifications', icon: HelpCircle },
        ]
      },
      {
        title: 'Profile',
        items: [
          { label: 'Documents', href: '/dashboard/student/documents', icon: FileText },
          { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
        ]
      }
    ]
  },
  employer: {
    title: 'Employer',
    sections: [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard/employer', icon: LayoutDashboard },
          { label: 'Company Profile', href: '/dashboard/employer/profile', icon: Building2 },
          { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
        ]
      },
      {
        title: 'Recruitment',
        items: [
          { label: 'Internships', href: '/dashboard/employer/internships', icon: GraduationCap },
          { label: 'Projects', href: '/dashboard/employer/projects', icon: FolderDot },
          { label: 'Job Postings', href: '/dashboard/employer/jobs', icon: Briefcase },
          { label: 'Placement Drives', href: '/dashboard/employer/drives', icon: Target },
          { label: 'Interview Scheduling', href: '/dashboard/employer/interviews', icon: Calendar },
          { label: 'Hiring Assessment', href: '/dashboard/employer/hiring-assessment', icon: ListChecks },
          { label: 'Events Calendar', href: '/dashboard/employer/calendar', icon: Calendar },
          { label: 'Applications', href: '/dashboard/employer/applications', icon: ClipboardList },
          { label: 'Offers', href: '/dashboard/employer/offers', icon: Send },
          { label: 'Sponsorships', href: '/dashboard/employer/sponsorships', icon: Gem },
          { label: 'Clarifications & discussions', href: '/dashboard/employer/discussions', icon: HelpCircle },
          { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
        ]
      }
    ]
  },
  college_admin: {
    title: 'College Admin',
    sections: [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard/college', icon: LayoutDashboard },
          { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
        ]
      },
      {
        title: 'Management',
        items: [
          { label: 'Students', href: '/dashboard/college/students', icon: GraduationCap },
          { label: 'Employers', href: '/dashboard/college/employers', icon: Building2 },
          { label: 'Placement Drives', href: '/dashboard/college/drives', icon: Target },
          { label: 'Interview Scheduling', href: '/dashboard/college/interviews', icon: Calendar },
          { label: 'Hiring Assessment', href: '/dashboard/college/hiring-assessment', icon: ListChecks },
          { label: 'Internships', href: '/dashboard/college/internships', icon: Calendar },
          { label: 'Sponsorships', href: '/dashboard/college/sponsorships', icon: Gem },
          { label: 'Clarifications (publish)', href: '/dashboard/college/clarifications', icon: HelpCircle },
          { label: 'Discussions', href: '/dashboard/college/discussions', icon: MessageSquare },
          { label: 'Infrastructure', href: '/dashboard/college/infrastructure', icon: Building },
          { label: 'Calendar', href: '/dashboard/college/calendar', icon: Calendar },
        ]
      },
      {
        title: 'Configuration',
        items: [
          { label: 'Placement Rules', href: '/dashboard/college/rules', icon: Settings },
          { label: 'Reports', href: '/dashboard/college/reports', icon: TrendingUp },
          { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
          { label: 'Settings', href: '/dashboard/college/settings', icon: Settings },
        ]
      }
    ]
  },
  super_admin: {
    title: 'Super Admin',
    sections: [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        ]
      },
      {
        title: 'Platform',
        items: [
          { label: 'Colleges', href: '/dashboard/admin/colleges', icon: Building },
          { label: 'Employers', href: '/dashboard/admin/employers', icon: Building2 },
          { label: 'Users', href: '/dashboard/admin/users', icon: Users },
          { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
          { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
        ]
      }
    ]
  }
};

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (!session) return null;

  const role = session.user.role;
  const menu = menuConfig[role] || menuConfig.student;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          <span>PlacementHub</span>
        </Link>

        <nav className="sidebar-nav">
          {menu.sections.map((section, i) => (
            <div key={i}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <span className="sidebar-link-icon">
                    <item.icon size={18} aria-hidden="true" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
            {(role === 'employer' || role === 'college_admin') ? (
              <EntityLogo
                name={session.user.tenantName || session.user.name}
                size="sm"
                shape="rounded"
              />
            ) : (
              <div className="avatar avatar-md">
                {getInitials(session.user.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {getRoleDisplayName(role)}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="btn btn-ghost btn-icon" 
              style={{ display: 'none' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              id="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <style jsx>{`
              @media (max-width: 768px) {
                #mobile-menu-toggle { display: flex !important; }
              }
            `}</style>
            
            {/* Dynamic Header Identity */}
            <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', fontSize: '0.875rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EntityLogo
                    name={role === 'super_admin' ? 'PlacementHub' : (session.user.tenantName || session.user.name)}
                    size="sm"
                    shape="rounded"
                  />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                    {role === 'super_admin' ? 'PlacementHub SuperAdmin' : session.user.tenantName || session.user.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {role === 'employer' ? 'Corporate Partner' : role === 'student' ? 'Student Portal' : 'College Administration'}
                  </p>
                </div>
              </div>

              {role === 'college_admin' && (
                <>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Session:</span>
                    <select 
                      className="form-input" 
                      style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      defaultValue="2025-26"
                    >
                      <option>2024-25</option>
                      <option>2025-26</option>
                      <option>2026-27</option>
                    </select>
                  </div>
                </>
              )}
              
              {role === 'employer' && typeof window !== 'undefined' && sessionStorage.getItem('activeCampus') && (
                <>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Campus:</span>
                    <Link href="/dashboard/employer/select-campus" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.25rem 0.75rem', borderRadius: '4px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: 'none',
                      fontWeight: 500
                    }}>
                      {getActiveCampusName()}
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>▼</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="topbar-right">
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            </button>

            <div className="dropdown" style={{ position: 'relative' }}>
              <button 
                className="btn btn-ghost btn-icon notification-bell" 
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
              >
                <Bell size={18} aria-hidden="true" />
                <span className="notification-dot" />
              </button>

              {notifOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Notifications</h4>
                    <button className="btn btn-ghost btn-sm" onClick={() => addToast('All notifications marked as read (demo).', 'info')}>Mark all read</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon stats-card-icon green" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>🎯</div>
                      <div className="notification-content">
                        <div className="notification-title">Google Campus Drive Approved</div>
                        <div className="notification-message">The placement cell has approved the incoming 2026 drive.</div>
                        <div className="notification-time">2 hours ago</div>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon stats-card-icon blue" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>🧑‍💻</div>
                      <div className="notification-content">
                        <div className="notification-title">New Application Received</div>
                        <div className="notification-message">Rohan Patel applied for Software Development Engineer.</div>
                        <div className="notification-time">4 hours ago</div>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-icon stats-card-icon amber" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>⚠️</div>
                      <div className="notification-content">
                        <div className="notification-title">Offer Deadline Approaching</div>
                        <div className="notification-message">2 outstanding offers expire in 24 hours.</div>
                        <div className="notification-time">1 day ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown" style={{ position: 'relative' }}>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="page-content">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
