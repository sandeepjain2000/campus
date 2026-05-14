'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Interviews from './dt_Interviews';
import mb_Interviews from './mb_Interviews';

export default function CollegeInterviewsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Interviews />}
      mobileView={<mb_Interviews />}
    />
  );
}
