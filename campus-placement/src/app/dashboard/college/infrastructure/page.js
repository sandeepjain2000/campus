'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Infrastructure from './dt_Infrastructure';
import mb_Infrastructure from './mb_Infrastructure';

export default function CollegeInfrastructurePage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Infrastructure />}
      mobileView={<mb_Infrastructure />}
    />
  );
}
