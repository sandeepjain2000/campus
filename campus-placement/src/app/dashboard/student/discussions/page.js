'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated Route — clarifications moved to `/dashboard/student/clarifications`. */
export default function StudentDiscussionsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/student/clarifications');
  }, [router]);
  return (
    <div className="animate-fadeIn" style={{ padding: '2rem' }}>
      <p className="text-secondary">Redirecting to Clarifications…</p>
    </div>
  );
}
