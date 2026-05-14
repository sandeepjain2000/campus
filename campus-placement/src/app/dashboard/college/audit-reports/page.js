'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_AuditReports from './dt_AuditReports';
import mb_AuditReports from './mb_AuditReports';

export default function CollegeAuditReportsPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_AuditReports />}
      mobileView={<mb_AuditReports />}
    />
  );
}
