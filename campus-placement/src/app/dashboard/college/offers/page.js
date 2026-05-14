'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Offers from './dt_Offers';
import mb_Offers from './mb_Offers';

export default function CollegeOffersPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Offers />}
      mobileView={<mb_Offers />}
    />
  );
}
