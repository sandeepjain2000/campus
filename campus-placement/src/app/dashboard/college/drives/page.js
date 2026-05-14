'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopDrives from './DesktopDrives';
import mb_Drives from './mb_Drives';

export default function CollegeDrivesPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopDrives />}
      mobileView={<mb_Drives />}
    />
  );
}
