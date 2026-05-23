'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import PageError from '@/components/PageError';

/**
 * @param {{
 *   message?: string;
 *   variant?: 'default' | 'skeleton-dashboard' | 'skeleton-card';
 *   inline?: boolean;
 *   delayMs?: number;
 *   className?: string;
 * }} props
 */
export default function PageLoading({
  message = 'Loading screen…',
  variant = 'default',
  inline = false,
  delayMs = 300,
  className = '',
}) {
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  if (!visible) return null;

  const rootClass = [
    'page-loading',
    inline ? 'page-loading--inline' : 'page-loading--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <p className="page-loading-message">
        <Loader2 size={18} className="page-loading-spinner" aria-hidden="true" />
        <span>{message}</span>
      </p>
      {variant === 'skeleton-dashboard' ? (
        <div className="page-loading-skeleton" aria-hidden="true">
          <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }} />
          <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: 120 }} />
            ))}
          </div>
          <div className="grid grid-2">
            <div className="skeleton skeleton-card" style={{ height: 280 }} />
            <div className="skeleton skeleton-card" style={{ height: 280 }} />
          </div>
        </div>
      ) : null}
      {variant === 'skeleton-card' ? (
        <div className="page-loading-skeleton" aria-hidden="true">
          <div className="skeleton skeleton-card" style={{ height: 200 }} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Gate page content behind loading / error states.
 */
export function DataPageStatus({
  isLoading,
  error,
  loadingMessage = 'Loading screen…',
  loadingVariant = 'default',
  children,
}) {
  if (error) return <PageError error={error} />;
  if (isLoading) {
    return <PageLoading message={loadingMessage} variant={loadingVariant} />;
  }
  return children;
}
