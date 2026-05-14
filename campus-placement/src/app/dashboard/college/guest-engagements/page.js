'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_GuestEngagements from './dt_GuestEngagements';
import mb_GuestEngagements from './mb_GuestEngagements';

export default function CollegeGuestEngagementsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_GuestEngagements />}
      mobileView={<mb_GuestEngagements />}
    />
  );
}
