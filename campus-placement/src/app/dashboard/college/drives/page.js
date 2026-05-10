'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopDrives from './DesktopDrives';
import MobileDrives from './MobileDrives';

export default function CollegeDrivesPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopDrives />}
      mobileView={<MobileDrives />}
    />
  );
}
