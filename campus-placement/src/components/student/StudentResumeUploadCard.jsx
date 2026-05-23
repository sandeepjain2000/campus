'use client';

import Link from 'next/link';
import { STUDENT_DOCUMENT_ACCEPT_ATTR } from '@/lib/studentDocumentUpload';

/**
 * Always-visible résumé upload on the student profile (not gated by edit mode or tab).
 */
export default function StudentResumeUploadCard({
  resumeViewUrl = '',
  resumeLabel = 'View résumé',
  cvUploading = false,
  onCvChange,
}) {
  const hasResume = Boolean(resumeViewUrl);

  return (
    <section
      className="card profile-resume-card"
      aria-labelledby="profile-resume-heading"
      style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
          <h3 id="profile-resume-heading" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
            Résumé / CV
          </h3>
          <p className="text-sm text-secondary" style={{ margin: '0.35rem 0 0', lineHeight: 1.5 }}>
            {hasResume
              ? 'This is your primary CV — employers and your college see this file when you apply.'
              : 'Upload your primary CV here. Employers use this file when you apply to drives.'}
          </p>
          <p className="text-xs text-tertiary" style={{ margin: '0.35rem 0 0' }}>
            To keep extra versions (not shown to employers yet), use{' '}
            <Link href="/dashboard/student/documents" style={{ fontWeight: 600 }}>
              My documents → Additional CVs
            </Link>
            .
          </p>
          {hasResume ? (
            <p className="text-sm" style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>
              <span aria-hidden="true">📄 </span>
              {resumeLabel}
            </p>
          ) : (
            <p
              className="text-xs"
              style={{
                margin: '0.5rem 0 0',
                color: 'var(--warning-700, #b45309)',
                fontWeight: 600,
              }}
            >
              No résumé uploaded yet
            </p>
          )}
          <p className="text-xs text-tertiary" style={{ margin: '0.25rem 0 0' }}>
            PDF or Word, up to 5 MB
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {hasResume ? (
            <a
              href={resumeViewUrl || '/api/student/resume/view'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              View résumé
            </a>
          ) : null}
          <label
            className={`btn btn-primary btn-sm${cvUploading ? ' disabled' : ''}`}
            style={{
              cursor: cvUploading ? 'wait' : 'pointer',
              margin: 0,
              opacity: cvUploading ? 0.85 : 1,
            }}
            aria-label={cvUploading ? 'Uploading résumé' : hasResume ? 'Replace résumé' : 'Upload résumé'}
          >
            {cvUploading ? 'Uploading…' : hasResume ? 'Replace résumé' : 'Upload résumé'}
            <input
              type="file"
              accept={STUDENT_DOCUMENT_ACCEPT_ATTR}
              hidden
              disabled={cvUploading}
              onChange={onCvChange}
            />
          </label>
          <Link href="/dashboard/student/documents" className="btn btn-ghost btn-sm">
            All documents
          </Link>
        </div>
      </div>
    </section>
  );
}
