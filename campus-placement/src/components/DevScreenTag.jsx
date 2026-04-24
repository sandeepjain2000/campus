'use client';

import { usePathname } from 'next/navigation';
import { getDevScreenId } from '@/config/devScreenIds';

export default function DevScreenTag() {
  const pathname = usePathname();
  const id = getDevScreenId(pathname);
  if (!id) return null;
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
