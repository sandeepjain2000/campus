'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_EnrollmentKey from './dt_EnrollmentKey';
import mb_EnrollmentKey from './mb_EnrollmentKey';

export default function CollegeEnrollmentKeyPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_EnrollmentKey />}
      mobileView={<mb_EnrollmentKey />}
    />
  );
}
