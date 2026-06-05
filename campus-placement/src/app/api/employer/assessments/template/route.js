import { NextResponse } from 'next/server';
import {
  ASSESSMENT_UPLOAD_TEMPLATE_FILENAME,
  buildAssessmentUploadStarterCsv,
  defaultHiringResultCells,
} from '@/lib/assessmentUploadStarterCsv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Sample structure — prefer /api/employer/assessments/export for real data. */
export async function GET() {
  const sample = [
    {
      system_id: 'CAMPUS-ROLL-001',
      college_roll_no: 'ROLL-001',
      placement_drive_id: '',
      job_id: '',
      tenant_id: '',
      candidate_name: 'Example Student',
      ...defaultHiringResultCells(null),
    },
  ];
  const csv = `\uFEFF${buildAssessmentUploadStarterCsv(sample)}`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ASSESSMENT_UPLOAD_TEMPLATE_FILENAME}"`,
    },
  });
}
