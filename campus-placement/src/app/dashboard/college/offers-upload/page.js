'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DtCollegeOffersUpload from './dt_OffersUpload';
import MbCollegeOffersUpload from './mb_OffersUpload';

export default function CollegeOffersUploadPage() {
  return (
    <ResponsiveWrapper
      desktopView={<DtCollegeOffersUpload />}
      mobileView={<MbCollegeOffersUpload />}
    />
  );
}
