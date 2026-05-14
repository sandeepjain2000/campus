'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_MessageTemplates from './dt_MessageTemplates';
import mb_MessageTemplates from './mb_MessageTemplates';

export default function CollegeMessageTemplatesPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_MessageTemplates />}
      mobileView={<mb_MessageTemplates />}
    />
  );
}
