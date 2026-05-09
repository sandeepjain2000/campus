'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import EntityLogo from '@/components/EntityLogo';
import { Search, Plus, ChevronDown, X, Eye, Trash2, Building2 } from 'lucide-react';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load');
  if (!data.colleges || !Array.isArray(data.colleges)) throw new Error(data.error || 'Invalid response');
  return data;
};

const STATUS_CONFIG = {
  approved:      { label: 'Approved',      color: 'var(--success-700)', bg: 'var(--success-50)', border: 'var(--success-200)', dot: 'var(--success-500)' },
  pending:       { label: 'Pending',       color: 'var(--warning-700)', bg: 'var(--warning-50)', border: 'var(--warning-200)', dot: 'var(--warning-500)' },
  rejected:      { label: 'Rejected',      color: 'var(--danger-700)', bg: 'var(--danger-50)', border: 'var(--danger-200)', dot: 'var(--danger-500)' },
  blacklisted:   { label: 'Blacklisted',   color: 'var(--danger-900)', bg: 'var(--danger-100)', border: 'var(--danger-300)', dot: 'var(--danger-700)' },
  null:          { label: 'Available',     color: 'var(--primary-700)', bg: 'var(--primary-50)', border: 'var(--primary-200)', dot: 'var(--primary-500)' },
};

function normalizeApprovalStatus(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  return ['approved','pending','rejected','blacklisted'].includes(s) ? s : null;
}
function canRequestTieUp(status) {
  const s = normalizeApprovalStatus(status);
  return s === null || s === 'rejected' || s === 'blacklisted';
}
function statusRank(s) {
  const n = normalizeApprovalStatus(s);
  if (n === 'approved') return 0;
  if (n === 'pending') return 1;
  if (n == null) return 2;
  return 3;
}

function CollegeCombobox({ options, selectedId, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const selected = options.find(o => o.id === selectedId);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = useMemo(() => {
    if (!q) return options.slice(0, 60);
    const lq = q.toLowerCase();
    return options.filter(o => (o.name||'').toLowerCase().includes(lq) || (o.city||'').toLowerCase().includes(lq)).slice(0, 60);
  }, [options, q]);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 240, flex: 1 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.65rem 1rem', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)',
          cursor: 'pointer', fontSize: '0.95rem', color: selected ? 'var(--text-primary)' : 'var(--text-tertiary)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}
      >
        <Search size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? 500 : 400 }}>
          {selected ? selected.name : placeholder}
        </span>
        {selectedId ? (
          <div 
            onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ padding: '0.25rem', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
          >
            <X size={14} style={{ flexShrink: 0 }} />
          </div>
        ) : (
          <ChevronDown size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
        )}
      </div>
      {open && (
        <div className="animate-fadeIn" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)',
          maxHeight: 300, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Type to search colleges..."
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem', background: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              onClick={() => { onChange(''); setOpen(false); setQ(''); }}
              style={{ padding: '0.75rem 1rem', fontSize: '0.95rem', color: 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 500 }}
            >All campuses</div>
            {filtered.map(o => (
              <div key={o.id}
                onClick={() => { onChange(o.id); setOpen(false); setQ(''); }}
                style={{
                  padding: '0.75rem 1rem', fontSize: '0.95rem', cursor: 'pointer',
                  background: o.id === selectedId ? 'var(--primary-50)' : 'transparent',
                  color: 'var(--text-primary)',
                  display: 'flex', flexDirection: 'column', gap: '0.1rem'
                }}
                onMouseEnter={e => { if (o.id !== selectedId) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (o.id !== selectedId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontWeight: o.id === selectedId ? 600 : 500, color: o.id === selectedId ? 'var(--primary-700)' : 'var(--text-primary)' }}>{o.name}</div>
                {o.city && <div style={{ fontSize: '0.8rem', color: o.id === selectedId ? 'var(--primary-600)' : 'var(--text-tertiary)' }}>{o.city}</div>}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>No results found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SelectCampusPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR('/api/employer/campuses', fetcher);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('status');
  const [focusCampusId, setFocusCampusId] = useState('');
  const [requesting, setRequesting] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const rawColleges = data?.colleges;
  const colleges = useMemo(() => rawColleges ?? [], [rawColleges]);
  const counts = useMemo(() => ({
    total: colleges.length,
    approved: colleges.filter(c => normalizeApprovalStatus(c.approval_status) === 'approved').length,
    pending: colleges.filter(c => normalizeApprovalStatus(c.approval_status) === 'pending').length,
    available: colleges.filter(c => canRequestTieUp(c.approval_status)).length,
  }), [colleges]);

  const campusOptions = useMemo(() => [...colleges].sort((a,b) => (a.name||'').localeCompare(b.name||'')), [colleges]);

  const handleSelectCampus = (college) => {
    if (normalizeApprovalStatus(college.approval_status) !== 'approved') return;
    const payload = JSON.stringify({ id: college.id, name: college.name, slug: college.slug, city: college.city, state: college.state });
    sessionStorage.setItem('activeCampus', payload);
    try { localStorage.setItem('activeCampus', payload); } catch { /**/ }
    try { window.dispatchEvent(new Event('placementhub-active-campus')); } catch { /**/ }
    router.replace('/dashboard/employer');
  };

  const handleRequestAccess = async (college) => {
    setRequesting(college.id);
    try {
      const res = await fetch('/api/employer/campuses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collegeId: college.id }) });
      const json = await res.json();
      if (res.ok) { showToast(json.alreadyPending ? json.message || 'Already pending' : json.message || `Requested for ${college.name}`, json.alreadyPending ? 'error' : 'success'); mutate(); }
      else showToast(json.error || 'Request failed', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setRequesting(null); }
  };

  const handleRevokeAccess = async (college) => {
    if (!confirm(`Cancel your partnership with ${college.name}?`)) return;
    setRevoking(college.id);
    try {
      const res = await fetch('/api/college/employers/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_tenant_id: college.id }) });
      const json = await res.json();
      if (res.ok) {
        showToast(`Partnership with ${college.name} cancelled`);
        try {
          const active = JSON.parse(sessionStorage.getItem('activeCampus') || '{}');
          if (active?.id === college.id) {
            sessionStorage.removeItem('activeCampus');
            localStorage.removeItem('activeCampus');
          }
        } catch {
          sessionStorage.removeItem('activeCampus');
          try { localStorage.removeItem('activeCampus'); } catch { /**/ }
        }
        mutate();
      } else showToast(json.error || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setRevoking(null); }
  };

  const displayRows = useMemo(() => {
    let list = colleges.filter(c => {
      if (focusCampusId) return c.id === focusCampusId;
      const matchSearch = !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.city||'').toLowerCase().includes(search.toLowerCase());
      const status = normalizeApprovalStatus(c.approval_status);
      const matchStatus = filterStatus === 'all' || status === filterStatus || (filterStatus === 'not_requested' && status === null);
      return matchSearch && matchStatus;
    });
    return [...list].sort((a, b) => {
      if (sortOption === 'status') { const d = statusRank(a.approval_status) - statusRank(b.approval_status); return d !== 0 ? d : (a.name||'').localeCompare(b.name||''); }
      if (sortOption === 'name_asc') return (a.name||'').localeCompare(b.name||'');
      if (sortOption === 'name_desc') return (b.name||'').localeCompare(a.name||'');
      if (sortOption === 'students_desc') return (b.total_students||0) - (a.total_students||0);
      return 0;
    });
  }, [colleges, search, filterStatus, sortOption, focusCampusId]);

  const statusPills = [
    { key: 'all', label: 'All Campuses' },
    { key: 'approved', label: 'Approved' },
    { key: 'pending', label: 'Pending' },
    { key: 'not_requested', label: 'Available' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Toast */}
      {toast && (
        <div className="animate-slideUp" style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: '0.95rem',
          background: toast.type === 'error' ? 'var(--danger-50)' : 'var(--success-50)',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger-200)' : 'var(--success-200)'}`,
          color: toast.type === 'error' ? 'var(--danger-700)' : 'var(--success-700)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          {toast.type === 'error' ? <X size={18} /> : <Eye size={18} />} {toast.msg}
        </div>
      )}

      {/* High-Fidelity Glassmorphic Hero Banner */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: 'white',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Decorative Elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={28} /> Campus Partnerships
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            {isLoading ? 'Loading campus directory...' : `${counts.total} colleges in directory · ${counts.approved} approved · ${counts.pending} pending`}
          </p>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn" type="button" onClick={() => router.push('/dashboard/employer/select-campus/create')} style={{ background: 'white', color: 'var(--primary-800)', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '1.05rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Request Tie-up
          </button>
        </div>
      </div>

      {/* Pill-based Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {statusPills.map((t) => {
          const isActive = filterStatus === t.key;
          let count = '';
          if (!isLoading) {
            if (t.key === 'approved') count = counts.approved;
            if (t.key === 'pending') count = counts.pending;
            if (t.key === 'not_requested') count = counts.available;
            if (t.key === 'all') count = counts.total;
          }
          return (
            <button
              key={t.key}
              onClick={() => setFilterStatus(t.key)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--primary-600)' : 'var(--bg-secondary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {t.label} {count !== '' && <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Search and Sort Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--border-default)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text" className="form-input" placeholder="Search by name or city…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.65rem', paddingBottom: '0.65rem', fontSize: '0.95rem' }}
          />
        </div>

        <CollegeCombobox options={campusOptions} selectedId={focusCampusId} onChange={setFocusCampusId} placeholder="Focus on specific campus…" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sort By:</span>
          <select className="form-select" style={{ width: 'auto', padding: '0.65rem 2rem 0.65rem 1rem', fontSize: '0.95rem', fontWeight: 500 }} value={sortOption} onChange={e => setSortOption(e.target.value)}>
            <option value="status">Approval Status</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="students_desc">Student Count (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading && <div className="skeleton skeleton-card" style={{ height: 400 }} />}
      {error && <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger-600)', fontWeight: 600 }}>{error.message}</div>}

      {!isLoading && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ width: 40, paddingLeft: '1.5rem' }}>#</th>
                  <th>College Name</th>
                  <th>Location</th>
                  <th>Contact Details</th>
                  <th>Accreditation</th>
                  <th style={{ textAlign: 'right' }}>Students</th>
                  <th style={{ textAlign: 'right' }}>Placement</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
                      <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No colleges found</div>
                      <div>Try adjusting your filters or search query.</div>
                      <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => { setSearch(''); setFilterStatus('all'); setFocusCampusId(''); }}>
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : displayRows.map((c, i) => {
                  const status = normalizeApprovalStatus(c.approval_status);
                  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.null;
                  const placementPct = c.total_students > 0 ? Math.round((Number(c.placed_students||0) / Number(c.total_students)) * 100) : null;
                  const isApproved = status === 'approved';
                  const isPending = status === 'pending';
                  const showRequest = canRequestTieUp(c.approval_status);
                  const accParts = [
                    c.accreditation ? String(c.accreditation) : null,
                    c.naac_grade ? `NAAC ${c.naac_grade}` : null,
                    c.nirf_rank ? `NIRF #${c.nirf_rank}` : null,
                  ].filter(Boolean);

                  return (
                    <tr key={c.id} style={{ transition: 'background 0.2s', ':hover': { background: 'var(--bg-secondary)' } }}>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', paddingLeft: '1.5rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <EntityLogo name={c.name} website={c.website} size="md" shape="rounded" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.name}</div>
                            {c.website && (
                              <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer"
                                style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}
                                className="hover:text-primary-600"
                              >
                                {c.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <div>
                          {c.email ? (
                            <a href={`mailto:${c.email}`} style={{ color: 'var(--text-link)', textDecoration: 'none' }} title={`Email ${c.name}`}>
                              {c.email}
                            </a>
                          ) : '—'}
                        </div>
                        <div>
                          {c.phone ? (
                            <a href={`tel:${String(c.phone).replace(/\s+/g, '')}`} style={{ color: 'var(--text-link)', textDecoration: 'none' }} title={`Call ${c.name}`}>
                              {c.phone}
                            </a>
                          ) : '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {accParts.length ? accParts.join(' · ') : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{c.total_students ?? 0}</td>
                      <td style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 500, color: placementPct != null && placementPct >= 70 ? 'var(--success-600)' : 'var(--text-primary)' }}>
                        {placementPct != null ? `${placementPct}%` : '—'}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.75rem', borderRadius: '999px',
                          fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }}></div>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ paddingRight: '1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {isApproved && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.4rem', border: '1px solid var(--border-default)', color: 'var(--primary-600)' }}
                                onClick={() => router.push(`/dashboard/employer/select-campus/${c.id}`)}
                                title={`View details for ${c.name}`}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.4rem', border: '1px solid var(--border-default)', color: 'var(--danger-600)' }}
                                onClick={() => handleRevokeAccess(c)}
                                disabled={revoking === c.id}
                                title={`Revoke tie-up with ${c.name}`}
                              >
                                {revoking === c.id ? '…' : <Trash2 size={16} />}
                              </button>
                            </>
                          )}
                          {showRequest && (
                            <button className="btn btn-primary btn-sm" disabled={requesting === c.id} onClick={() => handleRequestAccess(c)}>
                              {requesting === c.id ? 'Requesting…' : 'Request Tie-up'}
                            </button>
                          )}
                          {isPending && <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600, padding: '0.4rem 0.5rem' }}>Awaiting Approval</span>}
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
    </div>
  );
}
