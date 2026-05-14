'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_HiringAssessment from './dt_HiringAssessment';
import mb_HiringAssessment from './mb_HiringAssessment';

export default function CollegeHiringAssessmentPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_HiringAssessment />}
      mobileView={<mb_HiringAssessment />}
    />
  );
}
