'use client';

import ResponsiveWrapper from '@/components/mobile/ResponsiveWrapper';
import DesktopCollegeStudents from './DesktopCollegeStudents';
import mb_CollegeStudents from './mb_CollegeStudents';

export default function CollegeStudentsPage() {
  return (
    <ResponsiveWrapper 
      desktopView={<DesktopCollegeStudents />}
      mobileView={<mb_CollegeStudents />}
    />
  );
}
