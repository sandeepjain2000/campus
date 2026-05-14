'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopInternships from './DesktopInternships';
import mb_Internships from './mb_Internships';

export default function CollegeInternshipsPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopInternships />}
      mobileView={<mb_Internships />}
    />
  );
}
