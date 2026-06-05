'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { markBrowserSessionActive, SESSION_BROWSER_MARKER_KEY } from '@/lib/sessionPolicy';

/**
 * Stale persistent cookies: sessionStorage is empty but NextAuth still has a session → sign out.
 * Legitimate sign-in sets the marker on the login page before navigation.
 */
export default function SessionLifetimeGuard({ children }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      try {
        sessionStorage.removeItem(SESSION_BROWSER_MARKER_KEY);
      } catch {
        /* ignore */
      }
      return;
    }

    if (status !== 'authenticated') return;

    let marker = null;
    try {
      marker = sessionStorage.getItem(SESSION_BROWSER_MARKER_KEY);
    } catch {
      /* ignore */
    }

    if (marker === '1') return;

    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(SESSION_BROWSER_MARKER_KEY) === '1') return;
      } catch {
        /* ignore */
      }
      void signOut({ redirect: false });
    }, 750);

    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      markBrowserSessionActive();
    }
  }, [status]);

  return children;
}
