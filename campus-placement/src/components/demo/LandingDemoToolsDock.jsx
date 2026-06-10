'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Mail, Trash2, X } from 'lucide-react';
import DemoDataTester from '@/components/demo/DemoDataTester';

const dockBtnStyle = {
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
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
};

export default function LandingDemoToolsDock() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSection, setPanelSection] = useState('apis');

  const openPanel = useCallback((section) => {
    setPanelSection(section);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [panelOpen, closePanel]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'apis' || demo === 'cleanup' || demo === 'purge') {
      openPanel(demo === 'apis' ? 'apis' : 'purge');
    }
  }, [openPanel]);

  return (
    <>
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
          maxWidth: '13.5rem',
        }}
      >
        <div data-ph-runner-slot aria-hidden="true" style={{ display: 'none' }} />
        <nav aria-label="Demo tools" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button type="button" style={dockBtnStyle} onClick={() => openPanel('apis')} title="Seed demo data via APIs">
              <Database size={14} aria-hidden /> Demo APIs
            </button>
            <button type="button" style={dockBtnStyle} onClick={() => openPanel('purge')} title="Purge demo test data">
              <Trash2 size={14} aria-hidden /> Cleanup (purge)
            </button>
            <Link href="/email-notifications" prefetch={false} style={dockBtnStyle}>
              <Mail size={14} aria-hidden /> Email workflows
            </Link>
        </nav>
      </div>

      {panelOpen ? (
        <div className="landing-demo-overlay" role="presentation" onClick={closePanel} />
      ) : null}

      <aside
        className={`landing-demo-drawer${panelOpen ? ' is-open' : ''}`}
        aria-hidden={!panelOpen}
        aria-label="Demo APIs and cleanup"
      >
        <div className="landing-demo-drawer-head">
          <div>
            <h2>{panelSection === 'purge' ? 'Demo cleanup' : 'Demo APIs'}</h2>
            <p>Seed sandbox data or purge test records without leaving the landing page.</p>
          </div>
          <button type="button" className="landing-demo-drawer-close" onClick={closePanel} aria-label="Close demo panel">
            <X size={18} />
          </button>
        </div>
        <div className="landing-demo-drawer-tabs" role="tablist" aria-label="Demo panel sections">
          <button
            type="button"
            role="tab"
            aria-selected={panelSection === 'apis'}
            className={panelSection === 'apis' ? 'is-active' : ''}
            onClick={() => setPanelSection('apis')}
          >
            APIs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panelSection === 'purge'}
            className={panelSection === 'purge' ? 'is-active' : ''}
            onClick={() => setPanelSection('purge')}
          >
            Cleanup
          </button>
          <Link href="/data-entry" className="landing-demo-drawer-fullpage" onClick={closePanel}>
            Open full page
          </Link>
        </div>
        <div className="landing-demo-drawer-body">
          <DemoDataTester variant="embed" focusSection={panelSection} compactHeader />
        </div>
      </aside>

      <style jsx>{`
        .landing-demo-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: rgba(15, 23, 42, 0.45);
        }
        .landing-demo-drawer {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 100001;
          width: min(920px, 100vw);
          height: 100vh;
          background: var(--bg-secondary);
          border-left: 1px solid var(--border-default);
          box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.22s ease;
          pointer-events: none;
        }
        .landing-demo-drawer.is-open {
          transform: translateX(0);
          pointer-events: auto;
        }
        .landing-demo-drawer-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.15rem 0.65rem;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-primary);
        }
        .landing-demo-drawer-head h2 {
          margin: 0 0 0.25rem;
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .landing-demo-drawer-head p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .landing-demo-drawer-close {
          border: 1px solid var(--border-default);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .landing-demo-drawer-tabs {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.55rem 1rem;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-primary);
        }
        .landing-demo-drawer-tabs button {
          border: 1px solid var(--border-default);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 0.35rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .landing-demo-drawer-tabs button.is-active {
          background: var(--primary-50);
          border-color: var(--primary-200);
          color: var(--primary-800);
        }
        .landing-demo-drawer-fullpage {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary-700);
          text-decoration: none;
        }
        .landing-demo-drawer-body {
          flex: 1;
          overflow: auto;
          padding: 0.85rem 1rem 1.5rem;
        }
      `}</style>
    </>
  );
}
