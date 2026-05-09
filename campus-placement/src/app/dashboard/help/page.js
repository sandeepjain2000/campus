'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  Book,
  Shield,
  Briefcase,
  GraduationCap,
  Building2,
  LayoutDashboard,
  KeyRound,
  LifeBuoy,
  Bell,
  Download,
  MessageSquare,
  Workflow,
  ChevronRight,
} from 'lucide-react';

function DocScreenshot({ src, alt, caption }) {
  return (
    <figure style={{ margin: '1.5rem 0 0' }}>
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-inset)',
          lineHeight: 0,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={675}
          sizes="(max-width: 900px) 100vw, min(880px, 90vw)"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
      {caption ? (
        <figcaption
          style={{
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-tertiary)',
            lineHeight: 1.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const SECTIONS = [
  {
    id: 'platform-basics',
    title: 'Platform basics',
    icon: <Book className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'what-is-placementhub',
        title: 'What is PlacementHub?',
        content: `PlacementHub is a campus placement and engagement platform. It connects students, college placement teams (TPOs), and employers on one system: job postings and drives, applications, interviews, offers, clarifications, calendars, and reporting.\n\nYour experience depends on your role: students see drives and applications; employers manage hiring and campus partnerships; college admins run the placement season; super admins operate the whole tenant.`,
      },
      {
        id: 'roles-overview',
        title: 'Roles at a glance',
        content: `Student — apply to drives, manage profile and documents, view interviews and offers, read published clarifications, join discussions where enabled.\n\nEmployer — maintain company profile, request campus tie-ups, post jobs and drives, run assessments and interviews, manage offers.\n\nCollege admin — approve employers and students, publish drives visibility, manage enrollment keys, interviews, clarifications, campus calendar, rules, and reports.\n\nSuper admin — onboard colleges and employers, approve pending registrations, manage users, platform settings, and audit visibility.`,
      },
      {
        id: 'navigation',
        title: 'Navigation, home, and sidebar',
        content: `After sign-in you land on your role home (student / employer / college / admin hub). Use the sidebar to move between sections; on smaller screens, open the menu from the top bar.\n\nThe full-screen hub lists every destination in grouped columns. Your last-used section is remembered. Use the in-dashboard search (where available) to jump to a screen by name.`,
      },
      {
        id: 'alerts-exports-feedback',
        title: 'Alerts, exports, and feedback',
        content: `Alerts — central inbox for notifications (bell). Check regularly for deadlines and status changes.\n\nMy data export — request downloadable exports of your data where the product supports it (GDPR-style self-service).\n\nFeedback — send product feedback from the Feedback entry in your menu; college and super-admin teams may have separate inboxes for triage.`,
      },
    ],
  },
  {
    id: 'use-case-flows',
    title: 'Use case flows',
    icon: <Workflow className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'flow-student',
        title: 'Student — typical placement journey',
        content: `Goal: get verified, discover opportunities, apply, interview, and respond to offers within your college’s rules.\n\n1. Register (or sign in) with your institute email and the campus enrollment key from the placement office.\n2. Complete My Profile and upload Documents (resume, proofs). Wait for college verification if required.\n3. Browse Drives and use filters (mode, status, month/year). Add interesting drives to your mental shortlist via the Placement calendar.\n4. Apply before each drive’s deadline. Track everything under My Applications.\n5. Watch Alerts for interview slots and updates. Open My Interviews when schedules go live.\n6. Read Clarifications for official company Q&A from your TPO. Use Discussions only where your college enables them.\n7. When you receive an offer, open My Offers and follow your institute’s acceptance / decline process.\n\nTip: if something is blocked, check profile verification and eligibility (CGPA, branch) before contacting support.`,
      },
      {
        id: 'flow-employer',
        title: 'Employer — hire on a campus',
        content: `Goal: be approved on the right campuses, publish roles, run selection, and close offers.\n\n1. Complete Company Profile (logo, description, contacts) so colleges and students trust your brand.\n2. Under Campus Partnerships, request tie-ups with target institutes. Track Approved vs Pending; follow up with the TPO if needed.\n3. When working on more than one campus, pick the Active campus so jobs and drives target the correct audience.\n4. Create Job Postings with clear eligibility (branches, CGPA, batch). Schedule Placement Drives (mode, venue, dates) and link them to roles.\n5. Run your process: Hiring Assessment, Interview Scheduling, and review Applications / assessment uploads as agreed with the college.\n6. Record outcomes under Offers (or bulk upload if your deployment allows). Coordinate Sponsorships or guest sessions if you use those modules.\n7. Respond to Clarification batches and join Discussions when the college publishes threads.\n\nTip: no campus unlocked usually means partnership is still pending — resolve that before expecting student applications.`,
      },
      {
        id: 'flow-college',
        title: 'College admin (TPO) — run the season',
        content: `Goal: keep employers and students aligned, enforce rules, and maintain a fair, auditable season.\n\n1. Set season context in Settings (placement season label, branding, policies your product exposes).\n2. Manage Employers: approve or reject partnership requests before companies run drives on your campus.\n3. Publish or curate Placement Drives / Internships visibility as your process requires. Keep the Enrollment key secure; rotate it if it leaks.\n4. Verify Students from the Students screen so eligible candidates are not blocked by the “pending approval” state.\n5. Operate selection support: Hiring Assessment visibility, Interview Scheduling coordination, and monitoring Applications / Offers (including CSV uploads if used).\n6. Publish Clarifications (batched Q&A to companies) and moderate Discussions where enabled.\n7. Use Calendar, Events, and Guest faculty / lectures to communicate visit days and engagement.\n8. Enforce Placement Rules and use Reports / Audit reports for compliance and leadership reviews.\n\nTip: treat the enrollment key like a password — only share through official channels.`,
      },
      {
        id: 'flow-super-admin',
        title: 'Super admin — operate the platform',
        content: `Goal: onboard organizations, keep accounts healthy, and maintain global configuration.\n\n1. Monitor the Dashboard for cross-tenant health and backlog.\n2. Maintain Colleges and Employers records as your commercial or pilot process requires.\n3. Work Pending registrations: activate college and employer accounts that require platform approval before first login.\n4. Support Users (search, fixes, lockouts) and triage the Feedback inbox.\n5. Review Audit reports when investigating incidents or compliance questions.\n6. Adjust Settings for SMTP, storage, feature flags, and other global parameters.\n\nTip: changes here affect every tenant — document major setting updates for your ops team.`,
      },
      {
        id: 'flow-cross-role',
        title: 'How the roles connect (one season story)',
        content: `This is a simplified “everyone in one flow” view:\n\nSuper admin enables a new college and employer on the platform → College admin shares the enrollment key with students and approves the employer partnership → Employer posts jobs and schedules a drive for that campus → Students apply and move through interviews → College admin and employer coordinate slots and clarifications → Offers are recorded and college rules (e.g. offer limits) apply → Reports close the loop for leadership.\n\nYour deployment may skip steps (e.g. auto-approved employers) or add steps (extra assessments). Use the role-specific flows above as the source of truth for day-to-day work.`,
      },
    ],
  },
  {
    id: 'students',
    title: 'Students',
    icon: <GraduationCap className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'student-profile',
        title: 'Profile, verification, and documents',
        content: `Complete My Profile with accurate academics, contact details, and links. Your college may require verification before certain placement steps; until then you may see a banner — contact your TPO if you are stuck.\n\nDocuments — upload resumes, certificates, and ID proofs. Follow any naming guidance from your institute. Replace files when you update your resume.`,
      },
      {
        id: 'student-drives-apps',
        title: 'Drives, calendar, applications, interviews, offers',
        content: `Browse Drives — filter by mode (on-campus / virtual / hybrid / off-campus), status, and date (including month–year). Apply before the deadline where the drive is open.\n\nPlacement calendar — see drive-related dates in a calendar view.\n\nMy Applications — track status from applied through shortlisting and selection.\n\nMy Interviews — follow schedules your college or employer publishes.\n\nMy Offers — review and act on offers according to your college rules.`,
        screenshot: {
          src: '/help/help-student-drives.png',
          alt: 'Illustration of a student Browse Drives screen with filters and company drive cards',
          caption: 'Illustrative UI: Browse Drives with search, date filters, and drive cards (your live screen may differ slightly).',
        },
      },
      {
        id: 'student-programs-comms',
        title: 'Internships, projects, clarifications, discussions',
        content: `Internships & Projects — explore structured programs your college or employers expose.\n\nClarifications — read official Q&A batches published by your placement committee for companies (not a private chat).\n\nDiscussions — participate in moderated threads where your college enables them.`,
      },
      {
        id: 'student-misc',
        title: 'Alerts, exports, and tips',
        content: `Use Alerts for time-sensitive messages. Use My data export if you need a copy of your data.\n\nTip: keep your phone and department consistent with institute records to avoid mismatches during shortlisting.`,
      },
    ],
  },
  {
    id: 'employers',
    title: 'Employers',
    icon: <Briefcase className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'employer-profile-campus',
        title: 'Company profile and campus partnerships',
        content: `Company Profile — logo, description, and contacts build trust with colleges and candidates.\n\nCampus Partnerships — request tie-ups with institutes. Until a college approves you, some campus-scoped actions may be limited. Pick an active campus when working across multiple partnerships (session selection).\n\nEvents Calendar — align on visit days and shared milestones.`,
        screenshot: {
          src: '/help/help-employer-partnerships.png',
          alt: 'Illustration of employer Campus Partnerships table with status and request actions',
          caption: 'Illustrative UI: Campus Partnerships — request tie-ups and track approved / pending colleges.',
        },
      },
      {
        id: 'employer-jobs-drives',
        title: 'Jobs, drives, internships, and projects',
        content: `Job Postings — create roles with compensation bands, skills, and eligibility (branches, CGPA, batch).\n\nPlacement Drives — schedule drives linked to jobs; set mode and venue details.\n\nInternships & Projects — publish student programs separate from full-time drives where configured.`,
      },
      {
        id: 'employer-pipeline',
        title: 'Assessments, interviews, applications, offers',
        content: `Hiring Assessment — configure or review assessment steps agreed with the college.\n\nInterview Scheduling — propose or confirm slots; students see updates on their side.\n\nApplications — review the candidate pipeline with filters.\n\nAssessment map & uploads — consolidate assessment artifacts where your process uses file uploads.\n\nOffers — record outcomes; use CSV upload only if your deployment enables bulk offer import for your account.`,
      },
      {
        id: 'employer-engagement',
        title: 'Sponsorships, guest needs, discussions',
        content: `Sponsorships — manage sponsorship opportunities you offer campuses.\n\nCampus guest needs — coordinate lectures or guest sessions.\n\nClarifications & Discussions — answer official clarification batches and join discussions as your college enables.`,
      },
    ],
  },
  {
    id: 'college-admins',
    title: 'College admins (TPO)',
    icon: <Building2 className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'college-overview-settings',
        title: 'Dashboard, settings, and employers',
        content: `Dashboard — snapshot of season activity, pending work, and key metrics.\n\nSettings — placement season label, branding, timezone, and policies your product exposes.\n\nEmployers — directory of companies; use Partnership Requests to approve or reject employer tie-up requests before they run drives at your campus.`,
      },
      {
        id: 'college-drives-students',
        title: 'Drives, students, enrollment, applications, offers',
        content: `Placement Drives & Internships — curate what runs on campus; align internship results where tracked.\n\nStudents — verify student profiles, fix data issues, and enforce placement rules.\n\nEnrollment key — rotate or copy the campus enrollment key students use at registration; treat it like a secret.\n\nApplications & Offers — monitor pipeline health; use offers screens and CSV upload if enabled for your institute.`,
        screenshot: {
          src: '/help/help-college-students.png',
          alt: 'Illustration of college admin Students list with verification and roll numbers',
          caption: 'Illustrative UI: Students — verify profiles and keep enrollment data aligned with your records.',
        },
      },
      {
        id: 'college-selection-comms',
        title: 'Assessments, interviews, clarifications, discussions',
        content: `Hiring Assessment — operational view of employer assessments for your campus.\n\nInterview Scheduling — coordinate panels and slots with employers.\n\nClarifications (publish) — batch student questions for employers and publish official answers.\n\nDiscussions — moderate employer–student discussion spaces.`,
      },
      {
        id: 'college-engagement-admin',
        title: 'Calendar, events, guest faculty, rules, reports',
        content: `Calendar & Events — publish campus placement and engagement events.\n\nGuest faculty & lectures — track guest engagements tied to placement.\n\nPlacement Rules — CGPA thresholds, offer limits, and season constraints.\n\nInfrastructure — rooms, labs, or logistics your placement office tracks.\n\nReports & Audit reports — export operational and compliance views where available.`,
      },
    ],
  },
  {
    id: 'super-admin',
    title: 'Super admin',
    icon: <Shield className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'admin-scope',
        title: 'Platform operations',
        content: `Super admins manage the multi-tenant platform: colleges, employers, and users across the system.\n\nDashboard — cross-tenant overview.\n\nColleges & Employers — create or maintain org records as your deployment requires.\n\nPending registrations — activate or reject college and employer signups that require platform approval.\n\nUsers — search and support account issues.\n\nFeedback inbox — triage product and support feedback.\n\nAudit reports — access audit trails where enabled.\n\nSettings — global SMTP, storage, feature flags, and other platform parameters.`,
        screenshot: {
          src: '/help/help-super-admin.png',
          alt: 'Illustration of super admin platform overview with sidebar navigation',
          caption: 'Illustrative UI: Platform administration — colleges, registrations, users, and settings.',
        },
      },
    ],
  },
  {
    id: 'accounts-security',
    title: 'Accounts & registration',
    icon: <KeyRound className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'student-registration',
        title: 'Student registration (campus key)',
        content: `Students join with the campus enrollment key from the placement office — not a roll number. Keys are long opaque values; paste them exactly (spaces are usually ignored).\n\nYou will also enter department, roll number, and batch year as your college defines them. If registration fails, confirm the key is current and that your email is not already registered.`,
      },
      {
        id: 'employer-college-signup',
        title: 'Employer and new college signup',
        content: `Some deployments require platform approval for new employers or new colleges. You may be able to sign in only after a super admin activates the account. Watch for email or TPO communication.`,
      },
      {
        id: 'sessions',
        title: 'Sessions and sign-out',
        content: `Sessions expire after a period of inactivity for security. Sign out on shared computers. If you change role or permissions, sign in again to refresh your session.`,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <LifeBuoy className="w-5 h-5" aria-hidden />,
    items: [
      {
        id: 'common-issues',
        title: 'Common issues',
        content: `Cannot apply to a drive — check deadlines, eligibility (CGPA / branch), drive status, and whether your profile is verified.\n\nEmployer: no campus — complete partnership approval and select an active campus.\n\nMissing data — refresh the page; if the API failed, try again later. Persistent errors may indicate maintenance or configuration.\n\nStill stuck — use Feedback from your dashboard or contact your placement office / platform support with your role, page URL, and approximate time of the issue.`,
      },
    ],
  },
];

export default function HelpDocument() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.toLowerCase().trim();
  const filteredSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.screenshot?.caption && item.screenshot.caption.toLowerCase().includes(q)) ||
        (item.screenshot?.alt && item.screenshot.alt.toLowerCase().includes(q))
      );
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="animate-fadeIn" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '0 0 4rem' }}>
      {/* Hero Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--primary-900), var(--primary-700))',
          padding: '4rem 2rem 5rem',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '-3rem',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'white',
              margin: '0 0 1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            Help & Documentation
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '720px',
              margin: '0 auto 2rem',
              lineHeight: 1.55,
              fontWeight: 500,
            }}
          >
            Guides for every role: students, employers, college placement teams, and platform administrators. Find answers on navigation, workflows, and operations.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Bell size={16} /> Alerts</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Download size={16} /> Exports</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MessageSquare size={16} /> Feedback</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><LayoutDashboard size={16} /> Role hub</span>
          </div>

          <div
            style={{
              position: 'relative',
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              borderRadius: '999px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
            }}
          >
            <Search
              size={24}
              style={{ color: 'var(--primary-600)', marginLeft: '0.5rem' }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search all topics, articles, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search documentation"
              style={{
                width: '100%',
                padding: '1rem',
                border: 'none',
                background: 'transparent',
                fontSize: '1.1rem',
                outline: 'none',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Sidebar Navigation */}
          <div
            style={{
              width: 'min(100%, 280px)',
              flexShrink: 0,
              position: 'sticky',
              top: '2rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem 1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                margin: '0 0 1rem 1rem',
              }}
            >
              Table of Contents
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id && !searchQuery;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection(section.id);
                        setSearchQuery('');
                      }}
                      className="transition-all"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        background: isActive ? 'var(--primary-50)' : 'transparent',
                        color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: isActive ? 'var(--primary-600)' : 'var(--text-tertiary)' }}>{section.icon}</span>
                        {section.title}
                      </div>
                      {isActive && <ChevronRight size={16} className="text-primary-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, minWidth: 'min(100%, 320px)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filteredSections.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '5rem 2rem',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--border-default)',
                }}
              >
                <Search size={48} className="text-tertiary" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No results found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                  We couldn't find any documentation matching &quot;<strong>{searchQuery}</strong>&quot;.
                </p>
              </div>
            ) : (
              filteredSections.map((section) => {
                if (!searchQuery && section.id !== activeSection) return null;
                return (
                  <div key={section.id} className="animate-slideUp">
                    <h2
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: '0 0 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <div style={{ padding: '0.5rem', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: 'var(--radius-md)' }}>
                        {section.icon}
                      </div>
                      {section.title}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className="card"
                          style={{
                            padding: '2rem',
                            borderLeft: '4px solid transparent',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderLeftColor = 'var(--primary-500)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderLeftColor = 'transparent'}
                        >
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>{item.title}</h3>
                          <div
                            style={{
                              fontSize: '1rem',
                              lineHeight: 1.7,
                              color: 'var(--text-secondary)',
                              margin: 0,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {/* Simple bold parser for numbers or steps if needed, otherwise just output content */}
                            {item.content.split('\n').map((line, i) => (
                              <p key={i} style={{ margin: '0 0 0.75rem', display: line ? 'block' : 'none' }}>
                                {line.match(/^[0-9]+\./) || line.startsWith('Tip:') || line.startsWith('Goal:') ? (
                                  <strong>{line.split(':')[0]}:</strong>
                                ) : null}
                                {line.match(/^[0-9]+\./) || line.startsWith('Tip:') || line.startsWith('Goal:') ? line.substring(line.indexOf(':') + 1) : line}
                              </p>
                            ))}
                          </div>
                          {item.screenshot ? (
                            <DocScreenshot
                              src={item.screenshot.src}
                              alt={item.screenshot.alt}
                              caption={item.screenshot.caption}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
