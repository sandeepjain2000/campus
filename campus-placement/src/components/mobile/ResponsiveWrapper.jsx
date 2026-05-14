'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

// Read the viewport synchronously before first paint to avoid
// mounting the wrong component (desktop vs mobile) and wasting a fetch cycle.
function getIsMobileSync() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function ResponsiveWrapper({ desktopView, mobileView }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // useLayoutEffect runs synchronously after DOM paint — reads the real
  // viewport width before any child component has a chance to fetch data.
  useLayoutEffect(() => {
    setIsMobile(getIsMobileSync());
    setMounted(true);

    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // On the server / before hydration — show a neutral placeholder so neither
  // component mounts and triggers a premature data fetch.
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }} />;
  }

  return isMobile ? mobileView : desktopView;
}
