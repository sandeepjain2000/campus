'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Clarifications from './dt_Clarifications';
import mb_Clarifications from './mb_Clarifications';

export default function CollegeClarificationsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Clarifications />}
      mobileView={<mb_Clarifications />}
    />
  );
}
