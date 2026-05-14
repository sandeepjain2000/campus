'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Calendar from './dt_Calendar';
import mb_Calendar from './mb_Calendar';

export default function CollegeCalendarPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Calendar />}
      mobileView={<mb_Calendar />}
    />
  );
}
