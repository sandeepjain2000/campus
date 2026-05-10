'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useEffect, useState } from 'react';

export default function ResponsiveWrapper({ desktopView, mobileView }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // To prevent hydration mismatch, we render desktop view initially on the server,
  // or return null until mounted on the client.
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }} />; 
  }

  return isMobile ? mobileView : desktopView;
}
