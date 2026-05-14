'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Applications from './dt_Applications';
import mb_Applications from './mb_Applications';

export default function CollegeApplicationsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Applications />}
      mobileView={<mb_Applications />}
    />
  );
}
