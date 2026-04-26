'use client';

import { usePathname } from 'next/navigation';
import { getDevScreenId } from '@/config/devScreenIds';

function showDevScreenTag() {
  return (
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_DEV_SCREEN_IDS === 'true'
  );
}

export default function DevScreenTag() {
  const pathname = usePathname();
  const id = getDevScreenId(pathname);
  if (!showDevScreenTag() || !id) return null;
  return (
    <span
      className="dev-screen-id-tag"
      title={`Dev reference: ${id} — ${pathname}`}
      aria-label={`Development screen id ${id}`}
    >
      {id}
    </span>
  );
}
