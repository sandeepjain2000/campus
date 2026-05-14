'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import dt_Rules from './dt_Rules';
import mb_Rules from './mb_Rules';

export default function CollegeRulesPage() {
  return (
    <ResponsiveWrapper
      desktopView={<dt_Rules />}
      mobileView={<mb_Rules />}
    />
  );
}
