'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_CONFIG = {
  approved: { label: 'Approved', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
  pending:  { label: 'Pending Approval', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
  blacklisted: { label: 'Blacklisted', color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca', icon: '🚫' },
  null:     { label: 'Not Requested', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '➕' },
};

export default function SelectCampusPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR('/api/employer/campuses', fetcher);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [requesting, setRequesting] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectCampus = (college) => {
    if (college.approval_status !== 'approved') return;
    // Store selection in sessionStorage
    sessionStorage.setItem('activeCampus', JSON.stringify({
      id: college.id,
      name: college.name,
      slug: college.slug,
      city: college.city,
      state: college.state,
    }));
    router.push('/dashboard/employer');
  };

  const handleRequestAccess = async (college) => {
    setRequesting(college.id);
    try {
      const res = await fetch('/api/employer/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId: college.id }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Access requested for ${college.name}`);
        mutate();
      } else {
        showToast(json.error || 'Request failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setRequesting(null);
    }
  };

  const handleRevokeAccess = async (college) => {
    if (!confirm(`Are you sure you want to cancel your partnership with ${college.name}?`)) return;
    setRevoking(college.id);
    try {
      const res = await fetch('/api/college/employers/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_tenant_id: college.id })
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Partnership with ${college.name} cancelled`);
        // clear from storage if active
        const active = JSON.parse(sessionStorage.getItem('activeCampus') || '{}');
        if (active.id === college.id) {
          sessionStorage.removeItem('activeCampus');
        }
        mutate();
      } else {
        showToast(json.error || 'Failed to cancel partnership', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setRevoking(null);
    }
  };

  const colleges = data?.colleges || [];
  const states = [...new Set(colleges.map(c => c.state).filter(Boolean))].sort();

  const filtered = colleges.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === 'all' || c.state === filterState;
    return matchSearch && matchState;
  });

  const approved = filtered.filter(c => c.approval_status === 'approved');
  const others = filtered.filter(c => c.approval_status !== 'approved');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem',
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#dc2626' : '#16a34a',
          borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          fontWeight: 500, fontSize: '0.875rem',
        }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: '#fff',
            }}>🏫</div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Select a Campus</h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Welcome, {session?.user?.tenantName || session?.user?.name}! Choose a college to manage your campus recruitment.
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {!isLoading && (
          <div style={{
            display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total Colleges', value: colleges.length, color: 'var(--primary-500)' },
              { label: 'Approved Access', value: colleges.filter(c => c.approval_status === 'approved').length, color: '#16a34a' },
              { label: 'Pending', value: colleges.filter(c => c.approval_status === 'pending').length, color: '#d97706' },
              { label: 'Not Requested', value: colleges.filter(c => !c.approval_status).length, color: 'var(--text-tertiary)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-secondary)', borderRadius: '0.75rem',
                padding: '0.75rem 1.25rem', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '0.1rem',
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="🔍 Search by college name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-input"
            style={{ width: '180px' }}
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
          >
            <option value="all">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '200px' }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger-600)' }}>
            ❌ Failed to load colleges. Please refresh.
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Approved campuses first */}
            {approved.length > 0 && (
              <>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.75rem' }}>
                  ✅ Your Approved Campuses ({approved.length})
                </h2>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem', marginBottom: '2rem',
                }}>
                  {approved.map(c => <CampusCard key={c.id} college={c} onSelect={handleSelectCampus} onRequest={handleRequestAccess} requesting={requesting} onRevoke={handleRevokeAccess} revoking={revoking} />)}
                </div>
              </>
            )}

            {/* Other colleges */}
            {others.length > 0 && (
              <>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  🏫 Other Colleges ({others.length})
                </h2>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem',
                }}>
                  {others.map(c => <CampusCard key={c.id} college={c} onSelect={handleSelectCampus} onRequest={handleRequestAccess} requesting={requesting} onRevoke={handleRevokeAccess} revoking={revoking} />)}
                </div>
              </>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No colleges match your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CampusCard({ college, onSelect, onRequest, requesting, onRevoke, revoking }) {
  const status = college.approval_status || null;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[null];
  const placementPct = college.total_students > 0
    ? Math.round((college.placed_students / college.total_students) * 100)
    : 0;
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRequesting = requesting === college.id;
  const isRevoking = revoking === college.id;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${isApproved ? '#bbf7d0' : 'var(--border)'}`,
      borderRadius: '1rem',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'all 0.2s ease',
      boxShadow: isApproved ? '0 0 0 2px #bbf7d0' : 'none',
    }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem',
          }}>🏫</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{college.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {[college.city, college.state].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '999px',
          fontSize: '0.68rem', fontWeight: 600,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          whiteSpace: 'nowrap',
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {college.naac_grade && (
          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', fontSize: '0.68rem', fontWeight: 600 }}>
            NAAC {college.naac_grade}
          </span>
        )}
        {college.nirf_rank && (
          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', fontSize: '0.68rem', fontWeight: 600 }}>
            NIRF #{college.nirf_rank}
          </span>
        )}
        {college.accreditation && (
          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', fontSize: '0.68rem' }}>
            {college.accreditation}
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {[
          { label: 'Students', value: college.total_students || 0 },
          { label: 'Placement', value: `${placementPct}%` },
          { label: 'Avg CGPA', value: college.avg_cgpa || '—' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-tertiary)', borderRadius: '0.5rem',
            padding: '0.5rem', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {isApproved && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={() => onSelect(college)}
          >
            Enter Campus →
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, borderColor: 'var(--danger-200)', color: 'var(--danger-600)' }}
            onClick={() => onRevoke(college)}
            disabled={isRevoking}
          >
            {isRevoking ? 'Canceling...' : 'Cancel'}
          </button>
        </div>
      )}
      {!isApproved && !isPending && (
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginTop: '0.25rem' }}
          disabled={isRequesting}
          onClick={() => onRequest(college)}
        >
          {isRequesting ? 'Requesting...' : '➕ Request Access'}
        </button>
      )}
      {isPending && (
        <div style={{
          textAlign: 'center', padding: '0.6rem',
          background: '#fffbeb', borderRadius: '0.5rem',
          fontSize: '0.78rem', color: '#92400e', fontWeight: 500,
        }}>
          ⏳ Awaiting college approval
        </div>
      )}
    </div>
  );
}
