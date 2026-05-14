'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useToast } from '@/components/ToastProvider';
import { formatDate } from '@/lib/utils';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load');
  return data;
};

/**
 * CSV upload form for Assessment uploads (used inside a modal on the main page).
 */
export function AssessmentCsvUploadForm({ onUploaded }) {
  const { addToast } = useToast();
  const [targetType, setTargetType] = useState('drive');
  const [driveId, setDriveId] = useState('');
  const [jobId, setJobId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [file, setFile] = useState(null);
  const [rounds, setRounds] = useState(['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5']);
  const [submitting, setSubmitting] = useState(false);

  const { data: drivesData } = useSWR('/api/employer/drives', fetcher);
  const { data: jobsData } = useSWR('/api/employer/jobs', fetcher);

  const drives = Array.isArray(drivesData?.drives) ? drivesData.drives : [];
  const jobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];
  const selectedDrive = useMemo(() => drives.find((d) => d.id === driveId), [drives, driveId]);

  const setRoundAt = (index, value) => {
    setRounds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const downloadTemplate = () => {
    window.location.href = '/api/employer/assessments/template';
  };

  const onUpload = async () => {
    if (!file) {
      addToast('Please select a CSV file first.', 'warning');
      return;
    }
    const lowerName = String(file.name || '').toLowerCase();
    if (!lowerName.endsWith('.csv')) {
      addToast('Please upload a .csv file.', 'warning');
      return;
    }
    if (targetType === 'job' && !jobId) {
      addToast('Select a job.', 'warning');
      return;
    }
    if (targetType === 'job' && !tenantId.trim()) {
      addToast('Tenant ID is required for job-level upload.', 'warning');
      return;
    }
    if (rounds.some((r) => !String(r || '').trim())) {
      addToast('Please provide names for all 5 rounds.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (targetType === 'drive' && driveId) form.append('driveId', driveId);
      if (targetType === 'job') {
        form.append('jobId', jobId);
        form.append('tenantId', tenantId.trim());
      }
      rounds.forEach((r, i) => form.append(`round_${i + 1}_name`, r || `Round ${i + 1}`));

      const res = await fetch('/api/employer/assessments/upload', {
        method: 'POST',
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      addToast('Assessment CSV uploaded.', 'success');
      if (typeof onUploaded === 'function') onUploaded(json);
    } catch (e) {
      addToast(e.message || 'Upload failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p className="text-sm text-secondary" style={{ margin: 0 }}>
        <button type="button" className="btn btn-ghost btn-sm" style={{ padding: 0, height: 'auto', verticalAlign: 'baseline' }} onClick={downloadTemplate}>
          Download the template
        </button>{' '}
        if you are unsure about columns.
      </p>

      <div className="grid grid-3">
        <div className="form-group">
          <label className="form-label">Target</label>
          <select className="form-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="drive">Placement Drive</option>
            <option value="job">Job</option>
          </select>
          <p className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>
            Only placement drives/jobs are supported. Internships/projects are blocked.
          </p>
        </div>

        {targetType === 'drive' ? (
          <div className="form-group">
            <label className="form-label">Drive</label>
            <select className="form-select" value={driveId} onChange={(e) => { setDriveId(e.target.value); setTenantId(''); }}>
              <option value="">Select drive</option>
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {(d.role || d.title || d.college || 'Drive') + (d.date ? ` (${formatDate(d.date)})` : '')}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Job</label>
            <select className="form-select" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">Select job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">CSV file</label>
          <input className="form-input" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>
            Key must be <strong>college_roll_no</strong>. Template includes <strong>placement_drive_id</strong> (optional
            if you choose the drive above; required on every row if you leave the dropdown empty). Use the same UUID for
            all rows. Column <strong>remarks</strong> (last column) is optional — panel notes, up to 4000 characters. Students
            outside the college master list are rejected.
          </p>
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--border-subtle, #e5e7eb)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          background: 'var(--surface-subtle, #f9fafb)',
        }}
      >
        <p className="text-sm font-semibold" style={{ margin: '0 0 0.75rem' }}>
          Round display names ↔ CSV columns
        </p>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Your label (shown in View / edit)</th>
                <th style={{ width: '58%' }}>Column in spreadsheet</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>{`Round ${i + 1} name`}</label>
                    <input
                      className="form-input"
                      value={rounds[i]}
                      onChange={(e) => setRoundAt(i, e.target.value)}
                    />
                  </td>
                  <td style={{ verticalAlign: 'bottom', paddingBottom: '0.5rem' }}>
                    <div className="font-mono text-sm" style={{ fontWeight: 600 }}>{`round_${i + 1}`}</div>
                    <div className="text-xs text-tertiary">{`Round ${i + 1}`}</div>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <span className="form-label">{targetType === 'job' ? 'Tenant ID (required for job)' : 'Tenant context'}</span>
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  {targetType === 'job' ? (
                    <input className="form-input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="College tenant UUID" />
                  ) : (
                    <input className="form-input" disabled value={selectedDrive?.tenant_id || 'Auto from selected drive'} />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
        System columns are <code>round_1</code>…<code>round_5</code> plus optional <code>remarks</code>. Round names above are display labels only. After upload, open{' '}
        <strong>View / edit</strong> on the full Assessment uploads page — the grid’s rightmost column is <strong>Remarks</strong> (same field).
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={submitting} onClick={onUpload}>
          {submitting ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>
    </div>
  );
}
