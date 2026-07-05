'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { CV_LABEL_MAX_LENGTH } from '@/lib/studentCvShared';

/**
 * Loads active CVs and runs apply with cvId when needed.
 * @param {{ onApply: (cvId: string | null) => Promise<void>, onError?: (msg: string) => void }} opts
 */
export function useStudentCvApply({ onApply, onError }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [loading, setLoading] = useState(false);

  const runApplyFlow = useCallback(async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/student/cv-list');
      if (res.status === 404) {
        res = await fetch('/api/student/cvs');
      }
      const json = await res.json().catch(() => ({}));
      // 503 = migration not applied; 404 = route missing on stale deploy — apply API still resolves CV
      if (res.status === 503 || res.status === 404) {
        await onApply(null);
        return;
      }
      if (!res.ok) {
        onError?.(json.error || 'Could not load your CVs');
        return;
      }
      const items = Array.isArray(json.items) ? json.items.filter((c) => !c.archivedAt) : [];
      const verificationRequired = Boolean(json.cvVerification?.required);
      const eligible = verificationRequired
        ? items.filter((c) => c.isVerified)
        : items;
      if (!items.length) {
        if (json.legacyResumeAvailable) {
          await onApply(null);
          return;
        }
        onError?.('Upload a labelled CV before applying.');
        return;
      }
      if (verificationRequired && !eligible.length) {
        onError?.('Your college requires a verified CV before applying to drives and internships.');
        return;
      }
      if (eligible.length === 1) {
        await onApply(eligible[0].id);
        return;
      }
      const defaultCv = eligible.find((c) => c.isDefault);
      setCvs(eligible);
      setSelectedCvId(defaultCv?.id || eligible[0].id);
      setPickerOpen(true);
    } finally {
      setLoading(false);
    }
  }, [onApply, onError]);

  const confirmPicker = useCallback(async () => {
    if (!selectedCvId) {
      onError?.('Choose which CV to submit.');
      return;
    }
    setPickerOpen(false);
    setLoading(true);
    try {
      await onApply(selectedCvId);
    } finally {
      setLoading(false);
    }
  }, [onApply, onError, selectedCvId]);

  const pickerModal = pickerOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '1rem',
      }}
      onClick={() => setPickerOpen(false)}
    >
      <div
        className="card"
        style={{ maxWidth: 420, width: '100%', padding: '1.25rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Choose CV for this application</h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Employers see your CV label only — not the original file name.
        </p>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
          {cvs.map((cv) => (
            <label
              key={cv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                border: `1px solid ${selectedCvId === cv.id ? 'var(--primary-400)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="cv-picker"
                checked={selectedCvId === cv.id}
                onChange={() => setSelectedCvId(cv.id)}
              />
              <span>
                {cv.label}
                {cv.isDefault ? (
                  <span className="badge badge-green" style={{ marginLeft: 6 }}>
                    Default
                  </span>
                ) : null}
                {cv.isVerified ? (
                  <span className="badge badge-green" style={{ marginLeft: 6 }}>
                    Verified
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={confirmPicker}>
            Submit application
          </button>
          <Link href="/dashboard/student/my-cvs" className="btn btn-secondary">
            Manage CVs
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return { runApplyFlow, pickerModal, applying: loading };
}

/**
 * Shared apply flow for program opportunities (internships, jobs, projects, hackathons).
 */
export function useProgramApplicationWithCv({ addToast, mutate, fetchApply = fetch }) {
  const applyTargetRef = useRef(null);
  const [applyingId, setApplyingId] = useState(null);

  const { runApplyFlow, pickerModal, applying: cvFlowLoading } = useStudentCvApply({
    onApply: async (cvId) => {
      const target = applyTargetRef.current;
      if (!target) return;
      setApplyingId(target.jobId);
      try {
        const body = { jobId: target.jobId };
        if (cvId) body.cvId = cvId;
        const res = await fetchApply('/api/student/program-applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          addToast(json.error || 'Could not apply', 'error');
          return;
        }
        addToast(`Applied to ${target.title}`, 'success');
        mutate?.();
      } catch {
        addToast('Network error', 'error');
      } finally {
        setApplyingId(null);
        applyTargetRef.current = null;
      }
    },
    onError: (msg) => addToast(msg, 'error'),
  });

  const startApply = useCallback(
    (jobId, title) => {
      applyTargetRef.current = { jobId, title };
      runApplyFlow();
    },
    [runApplyFlow],
  );

  const activeApplyingId = applyingId || (cvFlowLoading ? applyTargetRef.current?.jobId : null);

  return { startApply, applyingId: activeApplyingId, pickerModal };
}

export function CvLabelInput({ label, onChange, disabled }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="form-label">
        CV label <span style={{ color: 'var(--danger-600)' }}>*</span>
      </span>
      <input
        className="form-input"
        value={label}
        maxLength={CV_LABEL_MAX_LENGTH}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Product resume"
      />
      <span className="text-xs text-secondary">
        {label.length}/{CV_LABEL_MAX_LENGTH} — shown to employers instead of the file name
      </span>
    </label>
  );
}
