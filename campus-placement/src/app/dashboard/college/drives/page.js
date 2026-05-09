'use client';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import { EmployerCalendarGrid } from '@/components/employer/EmployerCalendarGrid';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';
import { SOCIAL_PLATFORM_ORDER } from '@/components/SocialIcons';
import { Target, CheckCircle, XCircle, Download, Video, Building2, ChevronDown, ChevronUp, LayoutList, CalendarDays, X } from 'lucide-react';

export default function CollegeDrivesPage() {
  const { addToast } = useToast();
  const [drives, setDrives] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [view, setView] = useState('list');
  const [expandedId, setExpandedId] = useState(null);
  const [facebookPageShare, setFacebookPageShare] = useState(false);
  const [postingFacebookId, setPostingFacebookId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadDrives = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/college/drives');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load drives');
        if (!mounted) return;
        setStaffDirectory(Array.isArray(json.staffDirectory) ? json.staffDirectory : []);
        setFacebookPageShare(Boolean(json.integrations?.facebookPageShare));
        setDrives((json.drives || []).map((d) => ({
          ...d, date: d.date ? String(d.date).slice(0, 10) : '',
          registered: Number(d.registered || 0), selected: Number(d.selected || 0),
          staffIds: [], jobPostingTitle: '', jobPostingUrl: '',
          socialShared: Array.isArray(d.social_shared) ? d.social_shared : [],
        })));
      } catch (error) {
        if (!mounted) return;
        addToast(error.message || 'Failed to load drives', 'error');
        setDrives([]);
      } finally { if (mounted) setIsLoading(false); }
    };
    loadDrives();
    return () => { mounted = false; };
  }, [addToast]);

  const attachStaff = (driveId, staffId) => {
    if (!staffId) return;
    setDrives((prev) => prev.map((d) => (d.id === driveId && !d.staffIds.includes(staffId) ? { ...d, staffIds: [...d.staffIds, staffId] } : d)));
  };
  const removeStaff = (driveId, staffId) => {
    setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, staffIds: d.staffIds.filter((id) => id !== staffId) } : d)));
  };

  const addOptionsForDrive = useMemo(() => {
    const map = {};
    for (const d of drives) map[d.id] = staffDirectory.filter((s) => !d.staffIds.includes(s.id));
    return map;
  }, [drives, staffDirectory]);

  const calItems = useMemo(() => drives.map((d) => ({ id: d.id, date: d.date, title: d.company, time: '', meta: `${formatStatus(d.status)} · ${d.role}` })), [drives]);

  const getDrivesCsv = useCallback((_scope) => ({
    headers: ['Company', 'Role', 'Date', 'Type', 'Status', 'Venue', 'Registered', 'Selected'],
    rows: drives.map((d) => [d.company, d.role, d.date, d.type, d.status, d.venue, String(d.registered), String(d.selected)]),
  }), [drives]);

  const handleDownloadReport = async (drive) => {
    setDownloading(drive.id);
    try {
      const res = await fetch(`/api/college/drives/${drive.id}/report`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `Post_Drive_Report_${drive.company.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(a); a.click(); a.remove();
      addToast(`Report generated for ${drive.company}.`, 'info');
    } catch (e) { addToast('Error: ' + e.message, 'warning'); }
    finally { setDownloading(null); }
  };

  const approveDrive = async (id) => {
    setActionBusyId(id);
    try {
      const res = await fetch('/api/college/drives', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driveId: id, action: 'approve' }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to approve drive');
      setDrives((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)));
      addToast('Drive approved.', 'success');
    } catch (error) { addToast(error.message, 'error'); }
    finally { setActionBusyId(null); }
  };

  const rejectDrive = async (id) => {
    setActionBusyId(id);
    try {
      const res = await fetch('/api/college/drives', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driveId: id, action: 'reject' }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to reject drive');
      setDrives((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'cancelled' } : d)));
      addToast('Drive rejected.', 'info');
    } catch (error) { addToast(error.message, 'error'); }
    finally { setActionBusyId(null); }
  };

  const toggleDriveSocialShare = async (driveId, platformId) => {
    const drive = drives.find((d) => d.id === driveId);
    if (!drive) return;
    const list = drive.socialShared || [];
    const has = list.includes(platformId);
    const socialShared = has ? list.filter((p) => p !== platformId) : [...list, platformId];
    setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, socialShared } : d)));
    try {
      const res = await fetch(`/api/college/drives/${driveId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ socialShared }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, socialShared: list } : d))); addToast(json.error || 'Could not save.', 'error'); }
      else addToast('Share flags saved.', 'success');
    } catch (e) { setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, socialShared: list } : d))); addToast(e.message, 'error'); }
  };

  const postDriveToFacebookPage = async (drive) => {
    setPostingFacebookId(drive.id);
    try {
      const res = await fetch(`/api/college/drives/${drive.id}/facebook-post`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { addToast(json.error || 'Facebook post failed.', 'error'); return; }
      addToast(`Posted to Facebook Page (id: ${json.postId}).`, 'success');
    } catch (e) { addToast(e.message, 'error'); }
    finally { setPostingFacebookId(null); }
  };

  const pendingCount = drives.filter(d => d.status === 'requested').length;

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={28} /> Placement Drives
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {drives.length} drives · {pendingCount > 0 && <span style={{ fontWeight: 700 }}>{pendingCount} awaiting approval</span>}
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
            {[{ id: 'list', icon: LayoutList, label: 'List' }, { id: 'calendar', icon: CalendarDays, label: 'Calendar' }].map(({ id, icon: Icon, label }) => (
              <button key={id} type="button" onClick={() => setView(id)} style={{ padding: '0.6rem 1.1rem', background: view === id ? 'rgba(255,255,255,0.25)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: view === id ? 700 : 500, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', backdropFilter: view === id ? 'blur(4px)' : 'none' }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <ExportCsvSplitButton filenameBase="college_placement_drives" currentCount={drives.length} fullCount={drives.length} getRows={getDrivesCsv} />
        </div>
      </div>

      {isLoading && <div className="skeleton skeleton-card" style={{ height: 300 }} />}

      {!isLoading && view === 'calendar' && <EmployerCalendarGrid items={calItems} initialYear={2026} initialMonth={7} />}

      {!isLoading && view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {drives.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Target size={48} style={{ opacity: 0.25, margin: '0 auto 1rem' }} />
              <p className="text-secondary" style={{ margin: 0 }}>No drives found. Employers can request a placement drive from their dashboard.</p>
            </div>
          )}
          {drives.map((drive) => {
            const isExpanded = expandedId === drive.id;
            return (
              <div key={drive.id} className="card" id={`drive-${drive.id}`} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                {/* Drive Header */}
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 260px', minWidth: 0 }}>
                    <EntityLogo name={drive.company} size="md" shape="rounded" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{drive.company}</h3>
                        <span className={`badge badge-${getStatusColor(drive.status)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(drive.status)}</span>
                        <span className={`badge badge-${drive.type === 'virtual' ? 'blue' : 'indigo'}`} style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {drive.type === 'virtual' ? <><Video size={11} /> Virtual</> : <><Building2 size={11} /> On-Campus</>}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{drive.role}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {drive.status === 'requested' && (
                      <>
                        <button className="btn btn-primary btn-sm" type="button" onClick={() => approveDrive(drive.id)} disabled={actionBusyId === drive.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle size={14} /> {actionBusyId === drive.id ? 'Approving…' : 'Approve'}
                        </button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => rejectDrive(drive.id)} disabled={actionBusyId === drive.id} style={{ color: 'var(--danger-600)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-default)' }}>
                          <XCircle size={14} /> {actionBusyId === drive.id ? 'Rejecting…' : 'Reject'}
                        </button>
                      </>
                    )}
                    {drive.status === 'completed' && (
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleDownloadReport(drive)} disabled={downloading === drive.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Download size={14} /> {downloading === drive.id ? 'Generating…' : 'Report'}
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setExpandedId(id => id === drive.id ? null : drive.id)} style={{ border: '1px solid var(--border-default)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {isExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Details</>}
                    </button>
                  </div>
                </div>

                {/* Drive Quick Stats */}
                <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border-default)', borderBottom: isExpanded ? '1px solid var(--border-default)' : 'none' }}>
                  {[
                    { label: 'Date', value: formatDate(drive.date) },
                    { label: 'Venue', value: drive.venue || '—' },
                    { label: 'Registered', value: drive.registered },
                    { label: 'Selected', value: drive.selected },
                  ].map(({ label, value }, idx, arr) => (
                    <div key={label} style={{ flex: 1, padding: '0.875rem 1.25rem', borderRight: idx < arr.length - 1 ? '1px solid var(--border-default)' : 'none', background: 'var(--bg-secondary)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Expanded: Staff + Social */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Staff Attached to Drive</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        {drive.staffIds.length === 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No staff linked yet.</span>}
                        {drive.staffIds.map((sid) => {
                          const s = staffDirectory.find((staff) => staff.id === sid);
                          if (!s) return null;
                          return (
                            <span key={sid} className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem 0.35rem 0.75rem' }}>
                              {s.name} <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({s.role})</span>
                              <button type="button" onClick={() => removeStaff(drive.id, sid)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'inherit', display: 'flex', alignItems: 'center' }} aria-label={`Remove ${s.name}`}><X size={12} /></button>
                            </span>
                          );
                        })}
                        <select className="form-select" style={{ width: 'auto', minWidth: 200, fontSize: '0.85rem' }} value="" onChange={(e) => { attachStaff(drive.id, e.target.value); e.target.value = ''; }}>
                          <option value="">+ Add staff…</option>
                          {addOptionsForDrive[drive.id]?.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Social Channels</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {SOCIAL_PLATFORM_ORDER.map(({ id, label, Icon }) => {
                          const shared = (drive.socialShared || []).includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleDriveSocialShare(drive.id, id)} title={`${label}${shared ? ' — marked shared' : ' — click to mark shared'}`} aria-pressed={shared} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: `1px solid ${shared ? 'var(--primary-400)' : 'var(--border-default)'}`, background: shared ? 'var(--primary-50)' : 'var(--bg-primary)', color: shared ? 'var(--primary-600)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={16} />
                            </button>
                          );
                        })}
                        {facebookPageShare && (
                          <button type="button" className="btn btn-secondary btn-sm" disabled={postingFacebookId === drive.id} onClick={() => postDriveToFacebookPage(drive)}>
                            {postingFacebookId === drive.id ? 'Posting…' : 'Post to FB Page'}
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                        {facebookPageShare ? 'Highlighted channels are planned. "Post to FB Page" sends a live post.' : 'No live posting enabled · highlighted = saved on this drive.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
