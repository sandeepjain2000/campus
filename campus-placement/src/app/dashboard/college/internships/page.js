'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopInternships from './DesktopInternships';
import MobileInternships from './MobileInternships';

export default function CollegeInternshipsPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopInternships />}
      mobileView={<MobileInternships />}
    />
  );
}
