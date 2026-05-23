'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getDashboardPath } from '@/lib/utils';
import PageLoading from '@/components/PageLoading';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role) {
      router.replace(getDashboardPath(session.user.role));
    }
  }, [session, router]);

  return <PageLoading message="Opening your dashboard…" delayMs={0} />;
}
