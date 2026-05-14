'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Reports from './dt_Reports';
import mb_Reports from './mb_Reports';

export default function CollegeReportsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Reports />}
      mobileView={<mb_Reports />}
    />
  );
}
