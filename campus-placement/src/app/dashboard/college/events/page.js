'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Events from './dt_Events';
import mb_Events from './mb_Events';

export default function CollegeEventsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Events />}
      mobileView={<mb_Events />}
    />
  );
}
