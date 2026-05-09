'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import { useToast } from '@/components/ToastProvider';
import ConfirmDialog from '@/components/ConfirmDialog';
import { labelEmployerCompanyType } from '@/lib/employerCompanyTypeLabels';
import { Building2, Globe, Users, Shield, Star, ExternalLink, X } from 'lucide-react';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load');
  if (data?.employers && Array.isArray(data.employers)) return data;
  if (Array.isArray(data)) return { employers: data, staffDirectory: [] };
  throw new Error(data.error || 'Invalid response');
};

export default function CollegeEmployersPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/college/employers', fetcher);
  const [processingId, setProcessingId] = useState(null);
  const [pocModal, setPocModal] = useState(null);
  const [pocStaffSelection, setPocStaffSelection] = useState([]);
  const [pocSaving, setPocSaving] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const { addToast } = useToast();

  const list = data?.employers || [];
  const staffDirectory = data?.staffDirectory || [];

  useEffect(() => {
    if (!pocModal) { setPocStaffSelection([]); return; }
    const ids = pocModal.coordination_poc_user_ids;
    setPocStaffSelection(Array.isArray(ids) ? ids.map((id) => String(id)) : []);
  }, [pocModal]);

  const handleRevoke = async (employerId) => {
    setProcessingId(employerId);
    try {
      const res = await fetch('/api/college/employers/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employer_id: employerId }) });
      const data = await res.json();
      if (res.ok) { await mutate(); addToast('Employer access blocked.', 'success'); }
      else addToast(data.error || 'Failed to block employer.', 'error');
    } catch { addToast('Network error while blocking access.', 'error'); }
    finally { setProcessingId(null); }
  };

  if (isLoading) return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }} />
      <div className="skeleton skeleton-card" style={{ height: 300 }} />
    </div>
  );

  if (error) return (
    <div className="animate-fadeIn" style={{ padding: '2rem' }}>
      <div className="card" style={{ borderColor: 'var(--danger-200)', background: 'var(--danger-50)', padding: '1.5rem' }}>
        <p style={{ color: 'var(--danger-700)', fontWeight: 600, margin: '0 0 0.5rem' }}>{error.message || 'Could not load employers.'}</p>
        <p className="text-sm text-secondary" style={{ margin: 0 }}>Confirm you are signed in as a college admin, then try again.</p>
      </div>
    </div>
  );

  const pendingCount = list.filter(e => e.status === 'pending').length;

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
            <Building2 size={28} /> Manage Employers
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {list.length} employer{list.length !== 1 ? 's' : ''} with tie-up records
            {pendingCount > 0 && <span style={{ marginLeft: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>{pendingCount} pending</span>}
          </p>
        </div>
        {pendingCount > 0 && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/dashboard/college/employers/requests" className="btn" style={{ background: 'white', color: 'var(--primary-800)', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              Review Pending Requests →
            </Link>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
          <Building2 size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No employer tie-ups yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            When an employer requests access to your campus, they will show up here.<br />
            <Link href="/dashboard/college/employers/requests" style={{ fontWeight: 600, color: 'var(--primary-600)' }}>Review pending requests →</Link>
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ width: 50, paddingLeft: '1.5rem' }}>#</th>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Past Hires</th>
                  <th style={{ textAlign: 'right' }}>Drives</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Campus POC</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((emp, index) => {
                  const rating = emp.reliability_score != null ? Number(emp.reliability_score) : null;
                  const stars = rating != null && !Number.isNaN(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0;
                  const pocNames = (emp.coordination_poc_user_ids || []).map((uid) => staffDirectory.find((s) => String(s.id) === String(uid))?.name).filter(Boolean);
                  return (
                    <tr key={emp.approval_id}>
                      <td style={{ color: 'var(--text-tertiary)', paddingLeft: '1.5rem', fontSize: '0.85rem' }}>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <EntityLogo name={emp.name} website={emp.website} size="sm" shape="rounded" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{emp.name}</div>
                            {emp.website && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{emp.website.replace(/^https?:\/\//, '')}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{emp.industry || '—'}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{labelEmployerCompanyType(emp.company_type)}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{emp.past_hires ?? 0}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{emp.drives_count ?? 0}</td>
                      <td>
                        {stars > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Star size={14} style={{ color: 'var(--warning-500)', fill: 'var(--warning-500)' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rating.toFixed(1)}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>—</span>}
                      </td>
                      <td><span className={`badge badge-${getStatusColor(emp.status)} badge-dot`} style={{ fontSize: '0.75rem' }}>{formatStatus(emp.status)}</span></td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '12rem' }}>
                        {pocNames.length ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={13} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                            {pocNames.join(', ')}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {emp.website ? (
                            <a href={emp.website.startsWith('http') ? emp.website : `https://${emp.website}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', border: '1px solid var(--border-default)' }} title="Visit website">
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                          {emp.status === 'pending' && <Link href="/dashboard/college/employers/requests" className="btn btn-primary btn-sm">Review</Link>}
                          {emp.status === 'approved' && (
                            <>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPocModal(emp)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Users size={14} /> POCs
                              </button>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-600)', border: '1px solid var(--border-default)', padding: '0.4rem' }} onClick={() => setRevokeTarget({ id: emp.employer_id, name: emp.name })} disabled={processingId === emp.employer_id} title="Block employer">
                                {processingId === emp.employer_id ? '…' : <X size={14} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POC Modal */}
      {pocModal && (
        <div className="modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setPocModal(null); }}>
          <div className="modal" role="dialog" aria-modal="true" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', maxWidth: 520 }}>
            <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, var(--primary-900), var(--primary-700))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>Assign Campus POCs</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Coordinating with <strong style={{ color: 'white' }}>{pocModal.name}</strong></p>
              </div>
              <button type="button" onClick={() => setPocModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.5rem 2rem' }}>
              <div className="form-group">
                <label className="form-label">Select College Staff</label>
                {staffDirectory.length === 0 ? (
                  <p className="text-sm text-secondary">No placement coordinators found. Add college admin accounts for your team first.</p>
                ) : (
                  <select className="form-select" multiple style={{ height: `${Math.min(220, 36 + staffDirectory.length * 28)}px` }} value={pocStaffSelection} onChange={(e) => setPocStaffSelection(Array.from(e.target.selectedOptions).map((o) => o.value))}>
                    {staffDirectory.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                  </select>
                )}
                <p className="text-xs text-tertiary" style={{ marginTop: '0.4rem' }}>Hold Ctrl/Cmd to select multiple staff members.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.25rem 2rem', borderTop: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPocModal(null)} disabled={pocSaving}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={pocSaving || staffDirectory.length === 0} onClick={async () => {
                setPocSaving(true);
                try {
                  const res = await fetch(`/api/college/employers/${pocModal.employer_id}/poc`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffUserIds: pocStaffSelection }) });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) { addToast(json.error || 'Could not save POC assignment.', 'error'); return; }
                  await mutate(); addToast('Campus POCs saved.', 'success'); setPocModal(null);
                } catch { addToast('Network error while saving.', 'error'); }
                finally { setPocSaving(false); }
              }}>
                <Shield size={16} /> {pocSaving ? 'Saving…' : 'Save POCs'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Block employer access?"
        message={revokeTarget ? `${revokeTarget.name} will lose access to this campus until re-approved.` : ''}
        confirmLabel="Block employer"
        onCancel={() => setRevokeTarget(null)}
        onConfirm={async () => { if (!revokeTarget) return; const targetId = revokeTarget.id; setRevokeTarget(null); await handleRevoke(targetId); }}
        loading={Boolean(revokeTarget && processingId === revokeTarget.id)}
      />
    </div>
  );
}
