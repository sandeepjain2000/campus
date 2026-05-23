'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function LoginCaptchaField({ token, answer, onTokenChange, onAnswerChange, disabled = false }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/captcha', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuestion('Verification unavailable — refresh the page');
        onTokenChange('');
        return;
      }
      setQuestion(data.question || 'Answer the question below');
      onTokenChange(data.token || '');
      onAnswerChange('');
    } catch {
      setQuestion('Verification unavailable — refresh the page');
      onTokenChange('');
    } finally {
      setLoading(false);
    }
  }, [onAnswerChange, onTokenChange]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  return (
    <div
      className="form-group"
      style={{
        marginBottom: '1.25rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <label className="form-label" htmlFor="login-captcha" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} aria-hidden="true" />
          Verification
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={loadChallenge}
          disabled={disabled || loading}
          aria-label="New verification question"
          title="New question"
          style={{ padding: '0.25rem 0.5rem', minHeight: 0 }}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="text-sm text-secondary" style={{ margin: '0 0 0.5rem', lineHeight: 1.4 }}>
        {loading ? 'Loading question…' : question}
      </p>
      <input
        id="login-captcha"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="form-input"
        placeholder="Your answer"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value.replace(/[^\d-]/g, ''))}
        disabled={disabled || loading || !token}
        required
        aria-required="true"
      />
    </div>
  );
}
