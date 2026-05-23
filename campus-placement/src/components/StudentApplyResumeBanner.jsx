import Link from 'next/link';

/**
 * Shown when the student cannot apply (no authoritative CV on profile/documents).
 * @param {{ canApply?: boolean }} props — omit or true hides the banner
 */
export default function StudentApplyResumeBanner({ canApply }) {
  if (canApply !== false) return null;

  return (
    <div
      className="card"
      role="status"
      style={{
        marginBottom: '1.5rem',
        borderColor: 'var(--warning-500)',
        background: 'var(--warning-50, rgba(234, 179, 8, 0.08))',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.9375rem' }}>
        <strong>CV required.</strong> You cannot apply to drives, jobs, internships, or projects until your primary CV is
        uploaded.{' '}
        <Link href="/dashboard/student/profile" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
          Profile → Résumé / CV
        </Link>
        {' · '}
        <Link href="/dashboard/student/documents" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
          Documents
        </Link>
      </p>
    </div>
  );
}
