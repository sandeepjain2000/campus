'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Terminal, Copy, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import DevScreenTag from '@/components/DevScreenTag';
import DemoDataTester from '@/components/demo/DemoDataTester';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import UseCasesTable from '@/components/developer/UseCasesTable';
import {
  DEVELOPER_PAGE_META,
  DEVELOPER_PAGE_TOC,
  QUICK_START_STEPS,
  GUIDED_PLAYBOOKS,
  USE_CASE_FLOWS,
  USE_CASES_MORE_NOTES,
  LOGIN_PAGE_LINKS,
  RUNNER_PANEL_STEPS,
  SCREEN_TAG_STATES,
  SCREEN_TAG_ARMED_CLICKS,
  SCREEN_TAG_STUCK_TIPS,
  SESSION_MARKER_NOTES,
  INTERNSHIP_E2E_ROLES,
  DEMO_LOGINS,
  DEMO_PASSWORD,
  RUNNER_CHANGE_ALERTS,
  EMAIL_DEMO_NOTES,
  CLEANUP_OVERVIEW,
  CLEANUP_COMMANDS,
  RESTORE_AFTER_CLEANUP,
  LEGACY_RUNNER_COMMANDS,
  DATABASE_SCHEMA_NOTES,
  RELATED_DOCS,
} from '@/content/developerNotes';

function CopyBlock({ text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <div className="dev-notes-code-wrap">
      <code className="dev-notes-code">{text}</code>
      <button type="button" className="btn btn-ghost btn-sm dev-notes-copy" onClick={onCopy} aria-label="Copy command">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="dev-notes-section">
      <h2 className="dev-notes-section-title">{title}</h2>
      {children}
    </section>
  );
}

function resolveDemoFocusFromHash(hash) {
  const id = String(hash || '').replace(/^#/, '');
  if (id === 'demo-purge' || id === 'purge') return 'purge';
  if (id === 'demo-apis') return 'apis';
  return null;
}

export default function DeveloperPage() {
  const [demoFocus, setDemoFocus] = useState('apis');

  useEffect(() => {
    const applyHash = () => {
      const focus = resolveDemoFocusFromHash(window.location.hash);
      if (focus) setDemoFocus(focus);
      const id = window.location.hash.replace(/^#/, '');
      if (id === 'demo-apis' || id === 'demo-purge' || id === 'purge') {
        const targetId = id === 'demo-apis' ? 'demo-apis' : 'demo-purge';
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <div className="dev-notes-page">
      <div style={{ position: 'fixed', top: '0.65rem', right: '0.75rem', zIndex: 100000 }}>
        <DevScreenTag />
      </div>
      <header className="dev-notes-header">
        <div className="dev-notes-header-inner">
          <Link href="/" className="dev-notes-back">
            <ArrowLeft size={16} aria-hidden /> Landing
          </Link>
          <div className="dev-notes-header-actions">
            <ThemeToggleButton />
            <a href="#demo-apis" className="btn btn-secondary btn-sm">
              Demo APIs
            </a>
          </div>
        </div>
      </header>

      <main className="dev-notes-main">
        <div className="dev-notes-hero">
          <div className="dev-notes-hero-icon" aria-hidden>
            <BookOpen size={28} strokeWidth={1.5} />
          </div>
          <h1>{DEVELOPER_PAGE_META.title}</h1>
          
          <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991B1B', fontSize: '1rem' }}>Test Login Page</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#7F1D1D' }}>
              <Link href="/login" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Old Login Page (Demo Accounts)</Link> — Use this for internal testing.
              {' · '}
              <Link href="/sign-in" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>New Sign In Page</Link>
            </p>
          </div>

          <p className="dev-notes-kicker">{DEVELOPER_PAGE_META.notesTitle}</p>
          <p className="dev-notes-lead">{DEVELOPER_PAGE_META.subtitle}</p>
          <p className="dev-notes-meta">
            App folder: <code>{DEVELOPER_PAGE_META.repoPath}</code> · Terminal:{' '}
            <code>{DEVELOPER_PAGE_META.terminalHelp}</code>
          </p>
        </div>

        <nav id="toc" className="dev-notes-toc-card" aria-labelledby="dev-notes-toc-heading">
          <h2 id="dev-notes-toc-heading" className="dev-notes-toc-title">
            Table of contents
          </h2>
          <ol className="dev-notes-toc-list">
            {DEVELOPER_PAGE_TOC.map((item, index) => (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="dev-notes-toc-link">
                    <span className="dev-notes-toc-num">{index + 1}</span>
                    <span className="dev-notes-toc-text">
                      <span className="dev-notes-toc-label">{item.label}</span>
                      {item.hint ? <span className="dev-notes-toc-hint">{item.hint}</span> : null}
                    </span>
                  </Link>
                ) : (
                  <a href={`#${item.id}`} className="dev-notes-toc-link">
                    <span className="dev-notes-toc-num">{index + 1}</span>
                    <span className="dev-notes-toc-text">
                      <span className="dev-notes-toc-label">{item.label}</span>
                      {item.hint ? <span className="dev-notes-toc-hint">{item.hint}</span> : null}
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <Section id="quick-start" title="Three commands">
          <ol className="dev-notes-steps">
            {QUICK_START_STEPS.map((row) => (
              <li key={row.step}>
                <span className="dev-notes-step-num">{row.step}</span>
                <div>
                  <CopyBlock text={row.command} />
                  <p className="dev-notes-detail">{row.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="playbooks" title="Guided playbooks (partial flows)">
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>When you want to test…</th>
                  <th>Command</th>
                  <th>Focus</th>
                </tr>
              </thead>
              <tbody>
                {GUIDED_PLAYBOOKS.map((row) => (
                  <tr key={row.command}>
                    <td>{row.goal}</td>
                    <td>
                      <code className="dev-notes-inline-code">{row.command}</code>
                    </td>
                    <td className="dev-notes-muted">{row.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="use-cases" title="Use cases (step-by-step)">
          <UseCasesTable
            flows={USE_CASE_FLOWS}
            intro="Five end-to-end flows across employer, college, and student roles. Match these to guided playbooks and manual QA."
          />
          <p style={{ margin: '1.25rem 0 0' }}>
            <Link href={USE_CASES_MORE_NOTES.href} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              {USE_CASES_MORE_NOTES.label}
            </Link>
          </p>
          <p className="dev-notes-muted" style={{ margin: '1rem 0 0', fontSize: '0.875rem' }}>
            QA login:{' '}
            <Link href={LOGIN_PAGE_LINKS.oldWithDemoAccounts} style={{ fontWeight: 600 }}>
              Old Login Page (Demo accounts)
            </Link>
            {' · '}
            <Link href={LOGIN_PAGE_LINKS.newSignIn} style={{ fontWeight: 600 }}>New Sign In Page</Link>
          </p>
        </Section>

        <Section id="runner-alerts" title="Runner alerts (recent UI changes)">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            Update guided focus-area steps and manual tests when these change. Rebuild routes after menu edits:{' '}
            <code className="dev-notes-inline-code">npm run qa:sync-routes</code>
          </p>
          {RUNNER_CHANGE_ALERTS.map((block) => (
            <div key={block.date} className="dev-notes-callout" style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>
                {block.date}
                {block.title ? ` — ${block.title}` : ''}
              </p>
              <ul className="dev-notes-bullets" style={{ margin: 0 }}>
                {block.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section id="email-demo" title="Email &amp; demo mail">
          <ul className="dev-notes-bullets">
            {EMAIL_DEMO_NOTES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>

        <Section id="e2e-roles" title="Internship full cycle (by role)">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            One command runs all roles in order: <code className="dev-notes-inline-code">npm run test:guided:playbook-e2e</code>
            . Password for every account: <code className="dev-notes-inline-code">{DEMO_PASSWORD}</code>.
          </p>
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>What happens</th>
                  <th>Login</th>
                </tr>
              </thead>
              <tbody>
                {INTERNSHIP_E2E_ROLES.map((row) => (
                  <tr key={`${row.role}-${row.account}`}>
                    <td>
                      <strong>{row.role}</strong>
                    </td>
                    <td>{row.steps}</td>
                    <td>
                      <code className="dev-notes-inline-code">{row.account}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="panel" title="How the Next button works">
          <ol className="dev-notes-ordered">
            {RUNNER_PANEL_STEPS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <p className="dev-notes-callout">
            <Terminal size={16} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />
            Steps do <strong>not</strong> auto-run. Read each step in the <strong>terminal</strong>, then click{' '}
            <strong>S-xx</strong> — screen tag top-right turns blue when a test step is ready; click it (or Alt+Enter).
          </p>
        </Section>

        <Section id="screen-tag" title="Screen tag states">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            The screen tag (S-xx, LANDING, or LOGIN) in the top-right is your <strong>Next</strong> control during guided
            tests — not a normal app button. When it is blinking/pulsing, it is armed and waiting for you.
          </p>
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Look</th>
                  <th>State</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                {SCREEN_TAG_STATES.map((row) => (
                  <tr key={row.state}>
                    <td>
                      <span className={`dev-notes-tag-preview ${row.previewClass}`} aria-hidden>
                        S-xx
                      </span>
                      <span className="dev-notes-muted" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8125rem' }}>
                        {row.look}
                      </span>
                    </td>
                    <td>
                      <strong>{row.state}</strong>
                    </td>
                    <td>{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="dev-notes-subtitle">One click per step</h3>
          <ol className="dev-notes-ordered">
            {SCREEN_TAG_ARMED_CLICKS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>

          <h3 className="dev-notes-subtitle">What to do if it still feels stuck</h3>
          <ul className="dev-notes-bullets">
            {SCREEN_TAG_STUCK_TIPS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>

        <Section id="marker" title="Session marker (links publish → apply)">
          <ul className="dev-notes-bullets">
            {SESSION_MARKER_NOTES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Section>

        <Section id="logins" title="Demo logins">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            Password for all: <code className="dev-notes-inline-code">{DEMO_PASSWORD}</code>
          </p>
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_LOGINS.map((row) => (
                  <tr key={row.email}>
                    <td>{row.role}</td>
                    <td>
                      <code className="dev-notes-inline-code">{row.email}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="demo-apis" title="Demo APIs &amp; cleanup">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            Seed sandbox data, restore tie-ups, soft-delete test rows, or bulk-delete jobs and internships. Password{' '}
            <code className="dev-notes-inline-code">Admin@123</code> · demo users{' '}
            <code className="dev-notes-inline-code">@placementhub.test</code>. Full-page copy also at{' '}
            <Link href="/data-entry">/data-entry</Link>.
          </p>
          <div className="dev-notes-demo-panel">
            <DemoDataTester variant="embed" compactHeader hideHeader focusSection={demoFocus} />
          </div>
        </Section>

        {/* Legacy anchors */}
        <span id="purge" className="dev-notes-anchor" aria-hidden />
        <Section id="cleanup" title="Clean up &amp; restore test data">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            {CLEANUP_OVERVIEW} Use the <a href="#demo-apis">Demo APIs</a> section above or the commands below from the app
            folder.
          </p>

          <h3 className="dev-notes-subtitle">Wipe &amp; selective cleanup</h3>
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Command</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {CLEANUP_COMMANDS.map((row) => (
                  <tr key={row.command}>
                    <td>
                      <strong>{row.title}</strong>
                      <p className="dev-notes-detail" style={{ margin: '0.35rem 0 0' }}>
                        {row.detail}
                      </p>
                      {row.alt ? (
                        <p className="dev-notes-muted" style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem' }}>
                          Alt: <code className="dev-notes-inline-code">{row.alt}</code>
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <CopyBlock text={row.command} />
                    </td>
                    <td className="dev-notes-muted">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 id="restore" className="dev-notes-subtitle">
            Restore after cleanup
          </h3>
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            Run these after <code className="dev-notes-inline-code">npm run db:clear-placement</code> so employers can
            publish again.
          </p>
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Command</th>
                </tr>
              </thead>
              <tbody>
                {RESTORE_AFTER_CLEANUP.map((row) => (
                  <tr key={row.command}>
                    <td>
                      <strong>{row.title}</strong>
                      <p className="dev-notes-detail" style={{ margin: '0.35rem 0 0' }}>
                        {row.detail}
                      </p>
                      {row.alt ? (
                        <p className="dev-notes-muted" style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem' }}>
                          Alt: <code className="dev-notes-inline-code">{row.alt}</code>
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <code className="dev-notes-inline-code">{row.command}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="dev-notes-callout">
            Interactive tools are in <a href="#demo-apis">Demo APIs &amp; cleanup</a> above. Same UI at{' '}
            <Link href="/data-entry">/data-entry</Link>.
          </p>
        </Section>

        <Section id="legacy" title="Legacy runner modes">
          <div className="dev-notes-table-wrap">
            <table className="dev-notes-table">
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Use when</th>
                </tr>
              </thead>
              <tbody>
                {LEGACY_RUNNER_COMMANDS.map((row) => (
                  <tr key={row.command}>
                    <td>
                      <code className="dev-notes-inline-code">{row.command}</code>
                    </td>
                    <td className="dev-notes-muted">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="database-schema" title="Database schema & relationships">
          <p className="dev-notes-detail" style={{ marginTop: 0 }}>
            Per-table columns and foreign keys from the live database, plus a domain relationship overview (two
            application paths, campus tie-ups, assessment chain).
          </p>
          <p style={{ margin: '0 0 1rem' }}>
            <Link href={DATABASE_SCHEMA_NOTES.href} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Open database schema
            </Link>
          </p>
          <p className="dev-notes-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
            Repo: <code className="dev-notes-inline-code">{DATABASE_SCHEMA_NOTES.repoPath}</code> · Refresh:{' '}
            <code className="dev-notes-inline-code">{DATABASE_SCHEMA_NOTES.regenerateCommand}</code>
          </p>
        </Section>

        <Section id="related" title="Related files in the repo">
          <ul className="dev-notes-bullets">
            {RELATED_DOCS.map((doc) => (
              <li key={doc.path}>
                <strong>
                  {doc.href ? (
                    <Link href={doc.href} style={{ color: 'inherit' }}>
                      {doc.label}
                    </Link>
                  ) : (
                    doc.label
                  )}
                </strong>{' '}
                — <code className="dev-notes-inline-code">{doc.path}</code>
                {doc.hint ? <span className="dev-notes-muted"> ({doc.hint})</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      </main>

      <style jsx global>{`
        .dev-notes-page {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .dev-notes-header {
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-primary);
        }
        .dev-notes-header-inner {
          max-width: 52rem;
          margin: 0 auto;
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .dev-notes-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-decoration: none;
        }
        .dev-notes-back:hover {
          color: var(--primary-600);
        }
        .dev-notes-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .dev-notes-main {
          max-width: 52rem;
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
        }
        .dev-notes-hero {
          margin-bottom: 1.25rem;
          padding-bottom: 0;
          border-bottom: none;
        }
        .dev-notes-hero-icon {
          width: 3rem;
          height: 3rem;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-600);
          margin-bottom: 1rem;
        }
        .dev-notes-hero h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 0.25rem;
        }
        .dev-notes-kicker {
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--primary-600);
          margin: 0 0 0.65rem;
        }
        .dev-notes-lead {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0 0 0.75rem;
        }
        .dev-notes-meta {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          margin: 0;
        }
        .dev-notes-toc-card {
          margin-bottom: 2rem;
          padding: 1.1rem 1.25rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }
        .dev-notes-toc-title {
          margin: 0 0 0.85rem;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
        }
        .dev-notes-toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.35rem;
        }
        @media (min-width: 40rem) {
          .dev-notes-toc-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 1.5rem;
          }
        }
        .dev-notes-toc-link {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.45rem 0.5rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s ease;
        }
        .dev-notes-toc-link:hover,
        .dev-notes-toc-link:focus-visible {
          background: var(--bg-primary);
          outline: none;
        }
        .dev-notes-toc-link:hover .dev-notes-toc-label,
        .dev-notes-toc-link:focus-visible .dev-notes-toc-label {
          color: var(--primary-700);
          text-decoration: underline;
        }
        .dev-notes-toc-num {
          flex-shrink: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 800;
          color: var(--primary-700);
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          border-radius: 999px;
        }
        .dev-notes-toc-text {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .dev-notes-toc-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .dev-notes-toc-hint {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-tertiary);
          line-height: 1.35;
        }
        .dev-notes-anchor {
          display: block;
          position: relative;
          top: -4rem;
          visibility: hidden;
          pointer-events: none;
        }
        .dev-notes-section {
          margin-bottom: 2.25rem;
        }
        .dev-notes-section-title {
          font-size: 1.125rem;
          font-weight: 800;
          margin: 0 0 1rem;
          letter-spacing: -0.01em;
        }
        .dev-notes-subtitle {
          font-size: 0.9375rem;
          font-weight: 700;
          margin: 1.35rem 0 0.5rem;
          color: var(--text-primary);
        }
        .dev-notes-tag-preview {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.45rem;
          border-radius: var(--radius-sm);
          min-width: 2.75rem;
        }
        .dev-notes-tag-preview--armed {
          color: #fff;
          background: #2563eb;
          border: 2px solid #fbbf24;
          box-shadow: 0 0 0 1px #1d4ed8;
        }
        .dev-notes-tag-preview--idle {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
        }
        .dev-notes-tag-preview--running {
          color: #fff;
          background: #2563eb;
          border: 2px solid #fbbf24;
          opacity: 0.65;
        }
        .dev-notes-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 1rem;
        }
        .dev-notes-steps li {
          display: grid;
          grid-template-columns: 2rem 1fr;
          gap: 0.75rem;
          align-items: start;
        }
        .dev-notes-step-num {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: var(--primary-50);
          color: var(--primary-700);
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-200);
        }
        .dev-notes-code-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.65rem 0.85rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
        }
        .dev-notes-code {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.8125rem;
          color: var(--text-primary);
          flex: 1;
          min-width: 0;
          word-break: break-all;
        }
        .dev-notes-copy {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .dev-notes-detail {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.35rem 0 0;
          line-height: 1.5;
        }
        .dev-notes-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }
        .dev-notes-table-wrap--wide {
          margin-top: 0.5rem;
        }
        .dev-notes-table--use-cases th[scope='row'] {
          min-width: 11rem;
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: none;
          letter-spacing: normal;
          color: var(--text-primary);
          background: var(--bg-primary);
        }
        .dev-notes-table--use-cases td {
          min-width: 9.5rem;
          font-size: 0.8125rem;
          line-height: 1.45;
        }
        .dev-notes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .dev-notes-table th,
        .dev-notes-table td {
          padding: 0.65rem 0.85rem;
          text-align: left;
          border-bottom: 1px solid var(--border-default);
          vertical-align: top;
        }
        .dev-notes-table th {
          background: var(--bg-secondary);
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-tertiary);
        }
        .dev-notes-table tr:last-child td {
          border-bottom: none;
        }
        .dev-notes-inline-code {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.8125rem;
          background: var(--bg-secondary);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }
        .dev-notes-muted {
          color: var(--text-secondary);
        }
        .dev-notes-ordered,
        .dev-notes-bullets {
          margin: 0;
          padding-left: 1.25rem;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .dev-notes-ordered li,
        .dev-notes-bullets li {
          margin-bottom: 0.35rem;
        }
        .dev-notes-demo-panel {
          margin-top: 1rem;
          max-width: 100%;
          overflow-x: auto;
        }
        .dev-notes-demo-panel .demo-tester-page--embed {
          padding: 0;
        }
        .dev-notes-demo-panel .demo-tester-wrap {
          max-width: none;
        }
        .dev-notes-callout {
          margin: 1rem 0 0;
          padding: 0.85rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          line-height: 1.55;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
