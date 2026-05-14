'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Settings from './dt_Settings';
import mb_Settings from './mb_Settings';

export default function CollegeSettingsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Settings />}
      mobileView={<mb_Settings />}
    />
  );
}
