'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopJobs from './DesktopJobs';
import mb_Jobs from './mb_Jobs';

export default function CollegeJobsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<DesktopJobs />}
      mobileView={<mb_Jobs />}
    />
  );
}
