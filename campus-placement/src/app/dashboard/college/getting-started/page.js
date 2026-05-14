'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_GettingStarted from './dt_GettingStarted';
import mb_GettingStarted from './mb_GettingStarted';

export default function CollegeGettingStartedPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_GettingStarted />}
      mobileView={<mb_GettingStarted />}
    />
  );
}
