'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopCollegeStudents from './DesktopCollegeStudents';
import MobileCollegeStudents from './MobileCollegeStudents';

export default function CollegeStudentsPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopCollegeStudents />}
      mobileView={<MobileCollegeStudents />}
    />
  );
}
