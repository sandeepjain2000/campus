'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Discussions from './dt_Discussions';
import mb_Discussions from './mb_Discussions';

export default function CollegeDiscussionsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Discussions />}
      mobileView={<mb_Discussions />}
    />
  );
}
