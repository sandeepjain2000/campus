'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_InternshipResults from './dt_InternshipResults';
import mb_InternshipResults from './mb_InternshipResults';

export default function CollegeInternshipResultsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_InternshipResults />}
      mobileView={<mb_InternshipResults />}
    />
  );
}
