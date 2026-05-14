'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_OffersUpload from './dt_OffersUpload';
import mb_OffersUpload from './mb_OffersUpload';

export default function CollegeOffersUploadPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_OffersUpload />}
      mobileView={<mb_OffersUpload />}
    />
  );
}
