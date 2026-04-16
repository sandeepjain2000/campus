'use client';
import { useCallback, useMemo, useState } from 'react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

const STAFF_DIRECTORY = [
  { id: 'st-1', name: 'Dr. Meera Krishnan', role: 'TPO Faculty' },
  { id: 'st-2', name: 'Prof. Sanjay Nair', role: 'CSE Dept Coordinator' },
  { id: 'st-3', name: 'Ms. Ananya Bose', role: 'Placement Office' },
  { id: 'st-4', name: 'Dr. Vikram Sethi', role: 'Infrastructure & Logistics' },
];

const mockDrivesSeed = [
  { id: 1, company: 'TechCorp Solutions', role: 'SDE', date: '2026-09-15', type: 'on_campus', status: 'scheduled', registered: 45, selected: 0, venue: 'Placement Hall A', staffIds: ['st-1', 'st-3'], jobPostingTitle: 'SDE — Campus 2026', jobPostingUrl: '/dashboard/employer/jobs' },
  { id: 2, company: 'GlobalSoft Technologies', role: 'Full Stack Dev', date: '2026-09-22', type: 'virtual', status: 'approved', registered: 32, selected: 0, venue: 'Online', staffIds: ['st-2'], jobPostingTitle: '', jobPostingUrl: '' },
  { id: 3, company: 'Infosys Limited', role: 'Systems Engineer', date: '2026-10-05', type: 'on_campus', status: 'requested', registered: 0, selected: 0, venue: 'Main Auditorium', staffIds: [], jobPostingTitle: 'Systems Engineer — linked JD', jobPostingUrl: '/dashboard/employer/jobs' },
  { id: 4, company: 'DataVerse Analytics', role: 'Data Analyst', date: '2026-09-01', type: 'virtual', status: 'completed', registered: 40, selected: 5, venue: 'Online', staffIds: ['st-1', 'st-4'], jobPostingTitle: '', jobPostingUrl: '' },
];

function staffById(id) {
  return STAFF_DIRECTORY.find((s) => s.id === id);
}

export default function CollegeDrivesPage() {
  const { addToast } = useToast();
  const [drives, setDrives] = useState(mockDrivesSeed);
  const [downloading, setDownloading] = useState(null);
  const [view, setView] = useState('list');
  const [expandedId, setExpandedId] = useState(null);

  const attachStaff = (driveId, staffId) => {
    if (!staffId) return;
    setDrives((prev) =>
      prev.map((d) => (d.id === driveId && !d.staffIds.includes(staffId) ? { ...d, staffIds: [...d.staffIds, staffId] } : d)),
    );
  };

  const removeStaff = (driveId, staffId) => {
    setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, staffIds: d.staffIds.filter((id) => id !== staffId) } : d)));
  };

  const addOptionsForDrive = useMemo(() => {
    const map = {};
    for (const d of drives) {
      map[d.id] = STAFF_DIRECTORY.filter((s) => !d.staffIds.includes(s.id));
    }
    return map;
  }, [drives]);

  const calItems = useMemo(
    () =>
      drives.map((d) => ({
        id: d.id,
        date: d.date,
        title: d.company,
        time: '',
        meta: `${formatStatus(d.status)} · ${d.role}`,
      })),
    [drives],
  );

  const getDrivesCsv = useCallback(
    (_scope) => ({
      headers: ['Company', 'Role', 'Date', 'Type', 'Status', 'Venue', 'Registered', 'Selected', 'Job_posting', 'Staff_count'],
      rows: drives.map((d) => [
        d.company,
        d.role,
        d.date,
        d.type,
        d.status,
        d.venue,
        String(d.registered),
        String(d.selected),
        d.jobPostingTitle || '',
        String(d.staffIds.length),
      ]),
    }),
    [drives],
  );

  const handleDownloadReport = async (drive) => {
    setDownloading(drive.id);
    try {
      const res = await fetch(`/api/college/drives/${drive.id}/report`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `Post_Drive_Report_${drive.company.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      addToast(`Report generated for ${drive.company}.`, 'info');
    } catch (e) {
      addToast('Error generating report: ' + e.message, 'warning');
    } finally {
      setDownloading(null);
    }
  };

  const approveDrive = (id) => {
    setDrives((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved', registered: d.registered || 12 } : d)));
    addToast('Drive approved (demo).', 'info');
  };

  const rejectDrive = (id) => {
    setDrives((prev) => prev.filter((d) => d.id !== id));
    addToast('Drive request removed (demo).', 'info');
  };

  const scheduleNewDrive = () => {
    const name = typeof window !== 'undefined' ? window.prompt('Company name for new drive (demo):', 'Acme Corp') : 'Acme Corp';
    if (!name) return;
    const id = Date.now();
    setDrives((prev) => [
      {
        id,
        company: name,
        role: 'Graduate Engineer',
        date: new Date().toISOString().slice(0, 10),
        type: 'on_campus',
        status: 'scheduled',
        registered: 0,
        selected: 0,
        venue: 'TBD',
        staffIds: [],
        jobPostingTitle: '',
        jobPostingUrl: '',
      },
      ...prev,
    ]);
    addToast('Drive added to list (demo).', 'info');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎯 Placement Drives</h1>
          <p>Schedule and manage all placement drives</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton filenameBase="college_placement_drives" currentCount={drives.length} fullCount={drives.length} getRows={getDrivesCsv} />
          <div className="view-toggle" role="group" aria-label="Drive list or calendar">
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              Calendar
            </button>
          </div>
          <button className="btn btn-primary" type="button" onClick={scheduleNewDrive}>
            + Schedule Drive
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <EmployerCalendarGrid items={calItems} initialYear={2026} initialMonth={7} />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {drives.map((drive) => (
          <div key={drive.id} className="card card-hover" id={`drive-${drive.id}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <EntityLogo name={drive.company} size="md" shape="rounded" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{drive.company}</h3>
                    <span className={`badge badge-${getStatusColor(drive.status)} badge-dot`}>{formatStatus(drive.status)}</span>
                  </div>
                  <p className="text-sm text-secondary">{drive.role}</p>
                  {drive.jobPostingTitle ? (
                    <p className="text-xs" style={{ marginTop: '0.35rem' }}>
                      <span className="text-tertiary">Linked job posting: </span>
                      <a href={drive.jobPostingUrl || '#'} style={{ fontWeight: 600, color: 'var(--text-link)' }}>
                        {drive.jobPostingTitle}
                      </a>
                      <span className="text-tertiary"> (optional)</span>
                    </p>
                  ) : (
                    <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                      No job posting linked (optional).
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {drive.status === 'requested' && (
                  <>
                    <button className="btn btn-success btn-sm" type="button" onClick={() => approveDrive(drive.id)}>
                      ✅ Approve
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => rejectDrive(drive.id)}>
                      ❌ Reject
                    </button>
                  </>
                )}
                {drive.status === 'completed' && (
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleDownloadReport(drive)} disabled={downloading === drive.id}>
                    {downloading === drive.id ? 'Generating...' : '📥 Generate Report'}
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => setExpandedId((id) => (id === drive.id ? null : drive.id))}
                >
                  {expandedId === drive.id ? 'Hide details ↑' : 'View details →'}
                </button>
              </div>
            </div>
            <div className="drive-info-grid" style={{ marginTop: '0.75rem' }}>
              <div className="drive-info-item">
                <div className="drive-info-label">Date</div>
                <div className="drive-info-value">{formatDate(drive.date)}</div>
              </div>
              <div className="drive-info-item">
                <div className="drive-info-label">Type</div>
                <div className="drive-info-value">
                  <span className={`badge badge-${drive.type === 'virtual' ? 'blue' : 'indigo'}`}>{drive.type === 'virtual' ? '🌐 Virtual' : '🏛️ On-Campus'}</span>
                </div>
              </div>
              <div className="drive-info-item">
                <div className="drive-info-label">Venue</div>
                <div className="drive-info-value">{drive.venue}</div>
              </div>
              <div className="drive-info-item">
                <div className="drive-info-label">Registered</div>
                <div className="drive-info-value">{drive.registered}</div>
              </div>
              <div className="drive-info-item">
                <div className="drive-info-label">Selected</div>
                <div className="drive-info-value">{drive.selected}</div>
              </div>
            </div>

            {expandedId === drive.id && (
              <div className="text-sm text-secondary" style={{ marginTop: '0.75rem' }}>
                Drive logistics, slot confirmations, and employer comms can be attached here in a full implementation.
              </div>
            )}

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              <div className="text-sm font-semibold" style={{ marginBottom: '0.5rem' }}>
                Staff attached to drive
              </div>
              <p className="text-xs text-tertiary" style={{ margin: '0 0 0.65rem' }}>
                Coordinators and faculty points-of-contact visible to students and employers for this drive.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {drive.staffIds.length === 0 && <span className="text-sm text-secondary">No staff linked yet.</span>}
                {drive.staffIds.map((sid) => {
                  const s = staffById(sid);
                  if (!s) return null;
                  return (
                    <span key={sid} className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', paddingRight: '0.35rem' }}>
                      {s.name}
                      <span className="text-xs" style={{ opacity: 0.85 }}>
                        ({s.role})
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0 0.25rem', minHeight: 'auto', fontSize: '0.875rem', lineHeight: 1 }}
                        aria-label={`Remove ${s.name}`}
                        onClick={() => removeStaff(drive.id, sid)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: 220, fontSize: '0.8125rem' }}
                  value=""
                  onChange={(e) => {
                    attachStaff(drive.id, e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Add staff…</option>
                  {addOptionsForDrive[drive.id]?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
