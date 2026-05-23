'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate as swrMutate } from 'swr';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { getInitials, getRoleDisplayName } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import SessionAdBanner from '@/components/SessionAdBanner';
import PageLoading from '@/components/PageLoading';
import {
  menuConfig,
  ROLE_HOME_PATHS,
  NAV_SECTION_STORAGE_KEY,
  findSectionIdByPath,
  isSidebarItemActive,
  isSidebarItemActiveInMenu,
  isRoleDashboardHome,
} from '@/config/dashboardMenu';
import NotificationDropdown from '@/components/NotificationDropdown';
import DevScreenTag from '@/components/DevScreenTag';
import ScreenSearchBar from '@/components/ScreenSearchBar';
import DocumentationHelpWidget from '@/components/DocumentationHelpWidget';
import { Menu, Mail, Home, PanelLeft, PanelLeftClose } from 'lucide-react';
import { getAcademicYearOptions, getCurrentAcademicYear } from '@/lib/academicYear';
import { writeActiveAcademicYearContext } from '@/lib/collegeAcademicYearContext';

const settingsFetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load settings');
  return json;
};

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const collapsed =
        localStorage.getItem('placementhub_sidebar_collapsed') === '1' ||
        localStorage.getItem('placementhub_sidebar_hidden') === '1';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarCollapsed(collapsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('placementhub_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);
  const [employerCampusLabel, setEmployerCampusLabel] = useState(null);
  const [academicYearOverride, setAcademicYearOverride] = useState(null);
  const { data: collegeSettings } = useSWR(
    session?.user?.role === 'college_admin' ? '/api/college/settings' : null,
    settingsFetcher,
  );
  const { data: academicYearsBundle } = useSWR(
    session?.user?.role === 'college_admin' ? '/api/college/academic-years' : null,
    settingsFetcher,
  );
  const fallbackAcademicYearOptions = getAcademicYearOptions(getCurrentAcademicYear(), 3);
  const academicYearOptions = useMemo(() => {
    if (session?.user?.role !== 'college_admin') return fallbackAcademicYearOptions;
    const fromTenant = Array.isArray(academicYearsBundle?.years)
      ? academicYearsBundle.years.map((y) => y.label).filter(Boolean)
      : [];
    if (fromTenant.length) return fromTenant;
    const fromServer = Array.isArray(collegeSettings?.academicYearsWithData)
      ? collegeSettings.academicYearsWithData.filter((v) => typeof v === 'string' && v.trim())
      : [];
    return fromServer.length ? fromServer : fallbackAcademicYearOptions;
  }, [
    academicYearsBundle?.years,
    collegeSettings?.academicYearsWithData,
    fallbackAcademicYearOptions,
    session?.user?.role,
  ]);

  const systemDefaultAcademicYear = useMemo(() => {
    const fromTenantCalendar = academicYearsBundle?.current?.label?.trim();
    if (fromTenantCalendar) return fromTenantCalendar;
    return getCurrentAcademicYear();
  }, [academicYearsBundle?.current?.label]);

  const academicYear = useMemo(() => {
    if (academicYearOverride != null && academicYearOverride !== '') return academicYearOverride;
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('activeAcademicYear')?.trim();
        if (saved && academicYearOptions.includes(saved)) return saved;
      } catch {
        /* ignore */
      }
    }
    return systemDefaultAcademicYear;
  }, [academicYearOverride, academicYearOptions, systemDefaultAcademicYear]);

  useEffect(() => {
    try {
      sessionStorage.setItem('activeAcademicYear', academicYear);
      const match = academicYearsBundle?.years?.find((y) => y.label === academicYear);
      writeActiveAcademicYearContext({
        id: match?.id || null,
        label: academicYear,
      });
    } catch {
      /* ignore */
    }
  }, [academicYear, academicYearsBundle?.years]);

  useEffect(() => {
    if (session?.user?.role !== 'employer') return;
    const readCampus = () => {
      try {
        const raw = sessionStorage.getItem('activeCampus');
        setEmployerCampusLabel(raw ? JSON.parse(raw).name : null);
      } catch {
        setEmployerCampusLabel(null);
      }
    };
    readCampus();
    window.addEventListener('placementhub-active-campus', readCampus);
    return () => window.removeEventListener('placementhub-active-campus', readCampus);
  }, [session?.user?.role]);

  useEffect(() => {
    if (!session?.user?.role) return;
    const menu = menuConfig[session.user.role] || menuConfig.student;
    const id = findSectionIdByPath(menu, pathname);
    if (id) {
      try {
        sessionStorage.setItem(NAV_SECTION_STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
    }
  }, [pathname, session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <PageLoading message="Signing you in…" delayMs={0} />;
  }

  if (!session) return null;

  const role = session.user.role;
  const menu = menuConfig[role] || menuConfig.student;
  const sectionId = findSectionIdByPath(menu, pathname);
  const activeSection = menu.sections.find((s) => s.id === sectionId) || menu.sections[0];
  const homePath = ROLE_HOME_PATHS[role] || ROLE_HOME_PATHS.student;
  const isHub = isRoleDashboardHome(pathname, role);
  /** Super admin: show every workspace link in the sidebar (not only the current section). */
  const showFullSidebarNav = role === 'super_admin';

  const studentVerifyBanner =
    role === 'student' && session.user.studentPlacementVerified === false ? (
      <div
        className="card banner-verify-pending"
        style={{
          margin: isHub ? '1rem auto 0' : '0 0 1rem',
          maxWidth: isHub ? '56rem' : undefined,
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
        }}
      >
        Your college has not verified your student profile yet. You can use the portal, but some placement steps may stay blocked until an administrator
        approves you from the <strong>Students</strong> screen.
      </div>
    ) : null;

  if (isHub) {
    return (
      <>
        {studentVerifyBanner}
        {children}
      </>
    );
  }

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
        aria-expanded={!sidebarCollapsed}
      >
        <div className="sidebar-toolbar">
          <Link href={homePath} className="sidebar-logo">
            <div className="sidebar-logo-icon">P</div>
            <span className="sidebar-logo-label">PlacementHub</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-icon sidebar-collapse-toggle"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {sidebarCollapsed ? <PanelLeft size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            href={homePath}
            className={`sidebar-link ${pathname === homePath ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
            aria-current={pathname === homePath ? 'page' : undefined}
            title="Home"
          >
            <span className="sidebar-link-icon">
              <Home size={18} aria-hidden="true" />
            </span>
            <span className="sidebar-link-label">Home</span>
          </Link>
          {showFullSidebarNav ? (
            menu.sections.map((section) => (
              <div key={section.id}>
                <div className="sidebar-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isSidebarItemActiveInMenu(item.href, menu, pathname) ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isSidebarItemActiveInMenu(item.href, menu, pathname) ? 'page' : undefined}
                    title={item.label}
                  >
                    <span className="sidebar-link-icon">
                      <item.icon size={18} aria-hidden="true" />
                    </span>
                    <span className="sidebar-link-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))
          ) : (
            <>
              <div className="sidebar-section-title">{activeSection.title}</div>
              {activeSection.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isSidebarItemActive(item.href, activeSection, pathname) ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isSidebarItemActive(item.href, activeSection, pathname) ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="sidebar-link-icon">
                    <item.icon size={18} aria-hidden="true" />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
            {(role === 'employer' || role === 'college_admin') ? (
              <EntityLogo
                name={session.user.tenantName || session.user.name}
                logoUrl={session.user.brandLogoUrl || null}
                size="sm"
                shape="rounded"
              />
            ) : (
              <div className="avatar avatar-md">
                {getInitials(session.user.name)}
              </div>
            )}
            <div className="sidebar-footer-meta" style={{ flex: 1, minWidth: 0 }}>
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

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn btn-ghost btn-icon dashboard-mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>

            <div
              style={{
                marginLeft: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                minWidth: 0,
                flex: '1 1 auto',
              }}
            >
              <Link
                href={homePath}
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, flexShrink: 0 }}
                title="Full workspace menu"
              >
                <Home size={16} aria-hidden="true" /> Home
              </Link>
              <div className="topbar-divider-mobile-hide" style={{ width: '1px', height: '24px', background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, maxWidth: 'min(100%, 22rem)' }}>
                <div className="avatar avatar-sm" style={{ width: '32px', height: '32px', fontSize: '0.875rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EntityLogo
                    name={role === 'super_admin' ? 'PlacementHub' : (session.user.tenantName || session.user.name)}
                    logoUrl={role === 'super_admin' ? session.user.avatar || null : session.user.brandLogoUrl || null}
                    size="sm"
                    shape="rounded"
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {role === 'super_admin'
                      ? 'PlacementHub SuperAdmin'
                      : (collegeSettings?.institution?.collegeName || '').trim() ||
                        session.user.tenantName ||
                        session.user.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {role === 'employer' ? 'Corporate Partner' : role === 'student' ? 'Student Portal' : 'College Administration'}
                  </p>
                </div>
              </div>

              {role === 'college_admin' && (
                <>
                  <div className="topbar-divider-mobile-hide" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }} />
                  <div className="topbar-academic-year-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Academic Year:</span>
                    <select
                      className="form-input"
                      aria-label="Academic Year"
                      style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      value={academicYear}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setAcademicYearOverride(v);
                        try {
                          const match = academicYearsBundle?.years?.find((y) => y.label === v);
                          writeActiveAcademicYearContext({ id: match?.id || null, label: v });
                          const res = await fetch('/api/college/settings/placement-season', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ placementSeasonLabel: v }),
                          });
                          if (res.ok) await swrMutate('/api/college/settings');
                        } catch {
                          /* ignore */
                        }
                      }}
                    >
                      {academicYearOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}


            </div>
          </div>

          <div className="topbar-right" style={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
            <ScreenSearchBar />
            <DevScreenTag />
            {role === 'student' && (
              <Link
                href="/dashboard/student/reminders"
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                title="Reminders & email preview"
              >
                <Mail size={16} aria-hidden="true" /> Email
              </Link>
            )}
            <ThemeToggleButton />

            <NotificationDropdown />

            <div className="dropdown" style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => signOut({ callbackUrl: '/login?force=1' })}
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="page-content">
          {studentVerifyBanner}
          {children}
        </main>
        <SessionAdBanner />
        <DocumentationHelpWidget />
      </div>

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
