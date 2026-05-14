'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Sponsorships from './dt_Sponsorships';
import mb_Sponsorships from './mb_Sponsorships';

export default function CollegeSponsorshipsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Sponsorships />}
      mobileView={<mb_Sponsorships />}
    />
  );
}
