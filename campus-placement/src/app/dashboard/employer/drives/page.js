'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { Target, Plus, Video, Building2, Calendar, Users, Filter } from 'lucide-react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const emptyForm = {
  title: '',
  driveType: 'on_campus',
  driveDate: '',
  venue: '',
  description: '',
  ctcBreakup: '',
};

export default function EmployerDrivesPage() {
  const { addToast } = useToast();
  const [activeCampus, setActiveCampus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Restore last selected campus from sessionStorage (optional filter only)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('activeCampus');
      setActiveCampus(raw ? JSON.parse(raw) : null);
    } catch {
      setActiveCampus(null);
    }
  }, []);

  // Always fetch ALL drives; optionally narrow by campus
  const swrKey = activeCampus?.id
    ? `/api/employer/drives?campusId=${activeCampus.id}`
    : '/api/employer/drives';
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, { revalidateOnFocus: true });

  // Campus list for filter pills
  const { data: campusData } = useSWR('/api/employer/campuses', fetcher, { revalidateOnFocus: false });
  const approvedCampuses = (campusData?.colleges || []).filter((c) => c.approval_status === 'approved');

  const drives = Array.isArray(data?.drives) ? data.drives : [];

  const submitDrive = useCallback(async () => {
    if (!activeCampus?.id) {
      addToast('Select a campus filter first, or choose a campus from the campus directory.', 'warning');
      return;
    }
    if (!form.title.trim()) {
      addToast('Drive title is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeCampus.id,
          title: form.title.trim(),
          description: form.description,
          driveType: form.driveType,
          driveDate: form.driveDate || null,
          venue: form.venue,
          ctcBreakup: form.ctcBreakup,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error || 'Request failed', 'error');
        return;
      }
      addToast('Drive saved. College admins were notified.', 'success');
      setShowModal(false);
      setForm(emptyForm);
      mutate();
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [activeCampus, form, addToast, mutate]);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem',
        color: 'white', overflow: 'hidden', marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1.5rem',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '5%', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 60%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={28} />
            Placement Drives
            {drives.length > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.65rem', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                {drives.length} total
              </span>
            )}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>
            All placement drives across your campus partnerships — past, active, and upcoming.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ExportCsvSplitButton
            mode="dual"
            filenameBase="employer_placement_drives"
            currentCount={drives.length}
            fullCount={drives.length}
            getRows={() => ({
              headers: ['id', 'college', 'title', 'date', 'drive_type', 'status', 'venue', 'registered_count', 'ctc_breakup'],
              rows: drives.map((d) => [
                d.id, d.college ?? '', d.role ?? '',
                d.date ?? '', d.type ?? '', d.status ?? '',
                d.venue ?? '', String(d.registered ?? ''),
                d.ctc_breakup ?? d.ctcBreakup ?? '',
              ]),
            })}
          />
          <button
            className="btn"
            type="button"
            onClick={() => setShowModal(true)}
            style={{ background: 'white', color: 'var(--primary-800)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, padding: '0.75rem 1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            <Plus size={16} /> Request Drive
          </button>
        </div>
      </div>

      {/* ── Campus filter pills (optional) ── */}
      {approvedCampuses.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Filter size={12} /> Campus
          </span>
          <button
            onClick={() => setActiveCampus(null)}
            style={{
              padding: '0.35rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s ease',
              background: !activeCampus ? 'var(--primary-600)' : 'var(--bg-secondary)',
              color: !activeCampus ? 'white' : 'var(--text-secondary)',
              boxShadow: !activeCampus ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
            }}
          >All campuses</button>
          {approvedCampuses.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCampus(c)}
              style={{
                padding: '0.35rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s ease',
                background: activeCampus?.id === c.id ? 'var(--primary-600)' : 'var(--bg-secondary)',
                color: activeCampus?.id === c.id ? 'white' : 'var(--text-secondary)',
                boxShadow: activeCampus?.id === c.id ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
              }}
            >{c.name}</button>
          ))}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: '1.5rem' }}>
              <div className="skeleton" style={{ height: '1.2rem', width: '45%', borderRadius: '6px', marginBottom: '0.6rem' }} />
              <div className="skeleton" style={{ height: '0.9rem', width: '65%', borderRadius: '6px', marginBottom: '1.25rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="skeleton" style={{ height: '3rem', borderRadius: '8px' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Drive list ── */}
      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {drives.map((drive) => (
            <div key={drive.id} className="card card-hover" style={{ border: '1px solid var(--border-default)', padding: '1.5rem' }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <EntityLogo name={drive.college} size="sm" shape="rounded" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{drive.college}</h3>
                      <span className={`badge badge-${getStatusColor(drive.status)} badge-dot`}>{formatStatus(drive.status)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{drive.role}</p>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem', marginTop: '1.1rem', paddingTop: '1.1rem',
                borderTop: '1px solid var(--border-default)',
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={11} /> Date
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {drive.date ? formatDate(drive.date) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>Type</div>
                  <span className={`badge badge-${drive.type === 'virtual' ? 'blue' : 'indigo'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {drive.type === 'virtual'
                      ? <><Video size={11} /> Virtual</>
                      : <><Building2 size={11} /> {drive.type === 'hybrid' ? 'Hybrid' : 'On-Campus'}</>}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>Venue</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: drive.venue?.trim() ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {drive.venue?.trim() || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={11} /> Registered
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {drive.registered ?? 0} students
                  </div>
                </div>
              </div>

              {/* CTC breakup (internal) */}
              {(drive.ctc_breakup || drive.ctcBreakup) && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-default)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                    CTC breakup (internal)
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {drive.ctc_breakup || drive.ctcBreakup}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Not shown to the college in the dashboard.
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {drives.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border-default)',
            }}>
              <div style={{ background: 'var(--primary-50)', width: '68px', height: '68px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Target size={30} style={{ color: 'var(--primary-500)' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No placement drives found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                {activeCampus
                  ? `No drives found for ${activeCampus.name}. Switch to "All campuses" or request a new drive.`
                  : 'No drives have been scheduled yet. Request a placement drive with one of your approved partner campuses.'}
              </p>
              <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
                Request New Drive
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Request Drive Modal ── */}
      {showModal && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="req-drive-title">
            <div className="modal-header">
              <h2 className="modal-title" id="req-drive-title">Request placement drive</h2>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Campus selector inside modal */}
              <div className="form-group">
                <label className="form-label">Campus <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-select"
                  value={activeCampus?.id || ''}
                  onChange={(e) => {
                    const found = approvedCampuses.find((c) => c.id === e.target.value);
                    setActiveCampus(found || null);
                  }}
                >
                  <option value="">— Select a campus —</option>
                  {approvedCampuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="form-hint">Only approved campus partnerships are shown.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Drive title <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. SDE — Phase 2" />
              </div>
              <div className="form-group">
                <label className="form-label">Drive type</label>
                <select className="form-select" value={form.driveType} onChange={(e) => setForm((p) => ({ ...p, driveType: e.target.value }))}>
                  <option value="on_campus">On campus</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="off_campus">Off campus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Drive Date <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" type="date" min={new Date().toISOString().split('T')[0]} value={form.driveDate} onChange={(e) => setForm((p) => ({ ...p, driveDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <input className="form-input" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue (optional — add when known)" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes for placement office</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">CTC breakup (optional)</label>
                <textarea className="form-textarea" rows={3} value={form.ctcBreakup} onChange={(e) => setForm((p) => ({ ...p, ctcBreakup: e.target.value }))} placeholder="e.g. fixed + variable split, joining bonus, RSUs — for your records only" />
                <span className="form-hint">Stored on this drive for your team. Not shown on the college dashboard.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitDrive} disabled={submitting}>
                {submitting ? 'Saving…' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
