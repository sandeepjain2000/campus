'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopEmployers from './DesktopEmployers';
import MobileEmployers from './MobileEmployers';

export default function CollegeEmployersPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopEmployers />}
      mobileView={<MobileEmployers />}
    />
  );
}
