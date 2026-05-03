'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { filterScreensForRole } from '@/config/screenRegistry';

export default function ScreenSearchBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [aiMatches, setAiMatches] = useState([]);
  const wrapRef = useRef(null);

  const localMatches = useMemo(() => {
    if (!role) return [];
    return filterScreensForRole(role, q, 30);
  }, [role, q]);

  const runAi = useCallback(async () => {
    if (!q.trim()) return;
    setAiLoading(true);
    setAiNote('');
    setAiMatches([]);
    try {
      const res = await fetch('/api/screens/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiNote(data.error || 'AI search failed');
        return;
      }
      if (!data.openaiConfigured) {
        setAiNote('Add OPENAI_API_KEY on the server for smart matching.');
        return;
      }
      const matches = Array.isArray(data.matches) ? data.matches : [];
      setAiMatches(matches);
      setAiNote(matches.length ? 'Smart matches (click to open):' : 'No smart matches — try different words.');
    } catch {
      setAiNote('AI search failed');
    } finally {
      setAiLoading(false);
    }
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (status === 'loading' || !role) return null;

  return (
    <div className="screen-search-bar" ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Find a screen"
      >
        <Search size={16} aria-hidden /> Screens
      </button>
      {open && (
        <div
          className="card screen-search-popover"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: 'min(420px, 92vw)',
            zIndex: 80,
            padding: '0.75rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          }}
        >
          <label className="form-label" style={{ marginBottom: '0.35rem' }}>
            Search screens ({role.replace(/_/g, ' ')})
          </label>
          <input
            className="form-input"
            autoFocus
            placeholder="e.g. assessment upload, drives, audit…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAiMatches([]);
              setAiNote('');
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={aiLoading || !q.trim()} onClick={runAi}>
              <Sparkles size={14} style={{ marginRight: 4 }} aria-hidden />
              {aiLoading ? '…' : 'Smart match (AI)'}
            </button>
            {aiNote && <span className="text-xs text-secondary" style={{ flex: '1 1 100%' }}>{aiNote}</span>}
          </div>
          <div style={{ marginTop: '0.65rem', maxHeight: 280, overflowY: 'auto' }}>
            {aiMatches.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0 0 0.75rem', padding: 0, display: 'grid', gap: '0.35rem' }}>
                {aiMatches.map((s) => (
                  <li key={`ai-${s.href}`}>
                    <Link
                      href={s.href}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'block',
                        padding: '0.45rem 0.5rem',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--accent-500)',
                        background: 'color-mix(in srgb, var(--accent-500) 12%, transparent)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.label}</div>
                      <div className="text-xs text-tertiary">
                        {s.section} · <code>{s.screenId}</code>
                      </div>
                      <div className="text-xs text-secondary">{s.href}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {localMatches.length > 0 && (
              <>
                <div className="text-xs text-tertiary" style={{ marginBottom: '0.35rem' }}>
                  Keyword matches
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 0.5rem', padding: 0, display: 'grid', gap: '0.35rem' }}>
                  {localMatches.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="screen-search-hit"
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.45rem 0.5rem',
                          borderRadius: 6,
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          background: pathname === s.href ? 'var(--bg-secondary)' : 'transparent',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.label}</div>
                        <div className="text-xs text-tertiary">
                          {s.section} · <code>{s.screenId}</code>
                        </div>
                        <div className="text-xs text-secondary">{s.href}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {localMatches.length === 0 && aiMatches.length === 0 && (
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                {q.trim() ? 'No keyword matches — try Smart match if OPENAI_API_KEY is set.' : 'Type to filter your screens.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
