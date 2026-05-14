'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Overview from './dt_Overview';
import mb_Overview from './mb_Overview';

export default function CollegeOverviewPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Overview />}
      mobileView={<mb_Overview />}
    />
  );
}
