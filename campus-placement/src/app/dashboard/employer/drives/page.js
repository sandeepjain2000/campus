'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { Target, Plus, Video, Building2, Calendar, Users, ChevronDown, Check, ClipboardList, LayoutGrid, List, Search, X, Ban, Pencil } from 'lucide-react';
import PageLoading from '@/components/PageLoading';

const fetcher = (url) => fetch(url).then((r) => r.json());

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'requested', label: 'Awaiting approval' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { id: '', label: 'All types' },
  { id: 'on_campus', label: 'On campus' },
  { id: 'virtual', label: 'Virtual' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'off_campus', label: 'Off campus' },
];

const DATE_OPTIONS = [
  { id: '', label: 'Any date' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'no_date', label: 'No date set' },
];

const REGISTRATION_OPTIONS = [
  { id: '', label: 'Any registrations' },
  { id: 'with', label: 'With applicants' },
  { id: 'without', label: 'No applicants yet' },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function matchesStatusFilter(status, filter) {
  if (!filter) return true;
  if (filter === 'active') return ['approved', 'scheduled', 'in_progress'].includes(status);
  return status === filter;
}

function matchesDateFilter(dateStr, filter) {
  if (!filter) return true;
  if (filter === 'no_date') return !dateStr;
  if (!dateStr) return false;
  const driveDay = new Date(dateStr);
  driveDay.setHours(0, 0, 0, 0);
  const today = startOfToday();
  if (filter === 'upcoming') return driveDay >= today;
  if (filter === 'past') return driveDay < today;
  return true;
}

function matchesSearch(drive, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [drive.college, drive.role, drive.venue].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

function DriveTypeBadge({ type }) {
  return (
    <span className={`badge badge-${type === 'virtual' ? 'blue' : 'indigo'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
      {type === 'virtual'
        ? <><Video size={11} /> Virtual</>
        : type === 'hybrid'
          ? <><Building2 size={11} /> Hybrid</>
          : type === 'off_campus'
            ? <><Building2 size={11} /> Off campus</>
            : <><Building2 size={11} /> On-Campus</>}
    </span>
  );
}

function canReviewApplicants(drive) {
  return (drive.registered ?? 0) > 0 && drive.status !== 'requested' && drive.status !== 'rejected';
}

function canCancelDrive(drive) {
  return ['requested', 'approved', 'scheduled', 'in_progress'].includes(drive.status);
}

function canEditDrive(drive) {
  return canCancelDrive(drive);
}

function cancelDriveLabel(drive) {
  return drive.status === 'requested' ? 'Withdraw request' : 'Cancel drive';
}

export default function EmployerDrivesPage() {
  const { addToast } = useToast();
  // selectedCampusIds: Set of campus IDs checked; empty = all
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const dropdownRef = useRef(null);

  // Campus list
  const { data: campusData } = useSWR('/api/employer/campuses', fetcher, { revalidateOnFocus: false });
  const approvedCampuses = (campusData?.colleges || []).filter((c) => c.approval_status === 'approved');

  // Build SWR key — no filter if none/all selected
  const swrKey = (() => {
    if (selectedIds.size === 0 || selectedIds.size === approvedCampuses.length) {
      return '/api/employer/drives';
    }
    const params = [...selectedIds].map((id) => `campusId=${id}`).join('&');
    return `/api/employer/drives?${params}`;
  })();

  const { data, isLoading, mutate } = useSWR(swrKey, fetcher, { revalidateOnFocus: true });
  const allDrives = Array.isArray(data?.drives) ? data.drives : [];

  const statusCounts = useMemo(() => {
    const counts = { '': allDrives.length, requested: 0, active: 0, completed: 0, cancelled: 0 };
    for (const d of allDrives) {
      if (d.status === 'requested') counts.requested += 1;
      else if (['approved', 'scheduled', 'in_progress'].includes(d.status)) counts.active += 1;
      else if (d.status === 'completed') counts.completed += 1;
      else if (d.status === 'cancelled') counts.cancelled += 1;
    }
    return counts;
  }, [allDrives]);

  const filteredDrives = useMemo(() => {
    return allDrives.filter((drive) => {
      if (!matchesStatusFilter(drive.status, statusFilter)) return false;
      if (typeFilter && drive.type !== typeFilter) return false;
      if (!matchesDateFilter(drive.date, dateFilter)) return false;
      if (registrationFilter === 'with' && !(drive.registered > 0)) return false;
      if (registrationFilter === 'without' && (drive.registered ?? 0) > 0) return false;
      if (!matchesSearch(drive, searchQuery)) return false;
      return true;
    });
  }, [allDrives, statusFilter, typeFilter, dateFilter, registrationFilter, searchQuery]);

  const campusFilterActive = selectedIds.size > 0 && selectedIds.size < approvedCampuses.length;
  const hasActiveFilters = Boolean(
    statusFilter || typeFilter || dateFilter || registrationFilter || searchQuery.trim() || campusFilterActive,
  );

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setTypeFilter('');
    setDateFilter('');
    setRegistrationFilter('');
    setSearchQuery('');
    setSelectedIds(new Set());
  }, []);

  const cancelDrive = useCallback(async (drive) => {
    const registered = drive.registered ?? 0;
    const confirmMsg = drive.status === 'requested'
      ? `Withdraw the drive request "${drive.role}" at ${drive.college}?`
      : registered > 0
        ? `Cancel "${drive.role}" at ${drive.college}? ${registered} student(s) have registered — the campus will be notified.`
        : `Cancel "${drive.role}" at ${drive.college}? The campus will be notified.`;
    if (!confirm(confirmMsg)) return;

    setCancellingId(drive.id);
    try {
      const res = await fetch('/api/employer/drives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId: drive.id, action: 'cancel' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to cancel drive');
      addToast(
        drive.status === 'requested' ? 'Drive request withdrawn.' : 'Placement drive cancelled.',
        'success',
      );
      mutate();
    } catch (e) {
      addToast(e.message || 'Failed to cancel drive', 'error');
    } finally {
      setCancellingId(null);
    }
  }, [addToast, mutate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCampus = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filterLabel = selectedIds.size === 0 || selectedIds.size === approvedCampuses.length
    ? 'All campuses'
    : selectedIds.size === 1
      ? approvedCampuses.find((c) => selectedIds.has(c.id))?.name ?? '1 campus'
      : `${selectedIds.size} campuses`;



  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative',
        background: 'var(--banner-gradient)',
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
            {allDrives.length > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.65rem', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                {filteredDrives.length !== allDrives.length
                  ? `${filteredDrives.length} of ${allDrives.length}`
                  : `${allDrives.length} total`}
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
            currentCount={filteredDrives.length}
            fullCount={allDrives.length}
            getRows={(scope) => {
              const rows = scope === 'full' ? allDrives : filteredDrives;
              return {
                headers: ['id', 'college', 'title', 'date', 'drive_type', 'status', 'venue', 'registered_count', 'ctc_breakup'],
                rows: rows.map((d) => [
                  d.id, d.college ?? '', d.role ?? '',
                  d.date ?? '', d.type ?? '', d.status ?? '',
                  d.venue ?? '', String(d.registered ?? ''),
                  d.ctc_breakup ?? d.ctcBreakup ?? '',
                ]),
              };
            }}
          />
          <Link
            href="/dashboard/employer/drives/request"
            className="btn banner-cta-solid"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.5rem' }}
          >
            <Plus size={16} /> Request Drive
          </Link>
        </div>
      </div>

      {/* ── Filters + view toggle ── */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 220px', minWidth: 200 }}>
            <label className="form-label" htmlFor="drive-search">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                id="drive-search"
                className="form-input"
                placeholder="Campus, title, or venue…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 1 160px', minWidth: 140 }}>
            <label className="form-label" htmlFor="drive-type-filter">Drive type</label>
            <select id="drive-type-filter" className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.id || 'all'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 1 150px', minWidth: 130 }}>
            <label className="form-label" htmlFor="drive-date-filter">Date</label>
            <select id="drive-date-filter" className="form-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              {DATE_OPTIONS.map((o) => (
                <option key={o.id || 'all'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 1 180px', minWidth: 160 }}>
            <label className="form-label" htmlFor="drive-registration-filter">Registrations</label>
            <select id="drive-registration-filter" className="form-select" value={registrationFilter} onChange={(e) => setRegistrationFilter(e.target.value)}>
              {REGISTRATION_OPTIONS.map((o) => (
                <option key={o.id || 'all'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          {approvedCampuses.length > 0 && (
            <div className="form-group" style={{ marginBottom: 0, flex: '0 1 220px', minWidth: 180 }}>
              <label className="form-label">Campus</label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((p) => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                    padding: '0.55rem 0.85rem', borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    background: campusFilterActive ? 'var(--primary-50)' : 'var(--bg-primary)',
                    color: campusFilterActive ? 'var(--primary-700)' : 'var(--text-primary)',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    transition: 'all 0.15s ease', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filterLabel}</span>
                  <ChevronDown size={15} style={{ flexShrink: 0, transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                    borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '0.5rem', zIndex: 50, minWidth: '240px',
                  }}>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                        background: 'transparent', cursor: 'pointer', borderRadius: '6px',
                        fontSize: '0.875rem', fontWeight: 600,
                        color: selectedIds.size === 0 ? 'var(--primary-600)' : 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedIds.size === 0 && <Check size={14} />}
                      </span>
                      All campuses
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-default)', margin: '0.25rem 0' }} />
                    {approvedCampuses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCampus(c.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                          background: selectedIds.has(c.id) ? 'var(--primary-50)' : 'transparent',
                          cursor: 'pointer', borderRadius: '6px',
                          fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
                          color: selectedIds.has(c.id) ? 'var(--primary-700)' : 'var(--text-primary)',
                        }}
                      >
                        <span style={{
                          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                          border: `2px solid ${selectedIds.has(c.id) ? 'var(--primary-500)' : 'var(--border-default)'}`,
                          background: selectedIds.has(c.id) ? 'var(--primary-500)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.12s ease',
                        }}>
                          {selectedIds.has(c.id) && <Check size={10} color="white" strokeWidth={3} />}
                        </span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-end' }}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease-out',
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? 'var(--primary-600)' : 'var(--bg-secondary)',
                  color: statusFilter === tab.id ? 'white' : 'var(--text-secondary)',
                  boxShadow: statusFilter === tab.id ? '0 4px 10px rgba(79, 70, 229, 0.18)' : 'none',
                }}
              >
                {tab.label}
                <span style={{ marginLeft: '0.35rem', opacity: statusFilter === tab.id ? 0.9 : 0.65 }}>
                  ({statusCounts[tab.id] ?? 0})
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {filteredDrives.length} shown
            </span>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid var(--border-default)' }}>
              {[{ mode: 'list', icon: List, label: 'List view' }, { mode: 'card', icon: LayoutGrid, label: 'Card view' }].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    transition: 'all 0.15s ease',
                    background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                    color: viewMode === mode ? 'var(--primary-600)' : 'var(--text-tertiary)',
                    boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Icon size={15} />
                  {mode === 'list' ? 'List' : 'Cards'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ── Loading skeletons ── */}
      {isLoading && (
        <>
          <PageLoading message="Loading placement drives…" inline delayMs={0} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} aria-hidden="true">
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
        </>
      )}

      {/* ── Drive list ── */}
      {!isLoading && viewMode === 'list' && filteredDrives.length > 0 && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 0.9fr 0.75fr 0.85fr 1fr 0.7fr auto', gap: 0, background: 'var(--bg-secondary)', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-default)' }}>
            {['Campus', 'Drive title', 'Date', 'Type', 'Status', 'Venue', 'Registered', ''].map((h) => (
              <span key={h || 'actions'} style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>
          {filteredDrives.map((drive, idx) => (
            <div
              key={drive.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.4fr 0.9fr 0.75fr 0.85fr 1fr 0.7fr auto',
                gap: 0,
                alignItems: 'center',
                padding: '0.9rem 1.25rem',
                borderBottom: idx < filteredDrives.length - 1 ? '1px solid var(--border-default)' : 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, paddingRight: '0.75rem' }}>
                <EntityLogo name={drive.college} size="sm" shape="rounded" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {drive.college}
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '0.75rem' }}>
                {drive.role}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {drive.date ? formatDate(drive.date) : '—'}
              </span>
              <DriveTypeBadge type={drive.type} />
              <span className={`badge badge-${getStatusColor(drive.status)} badge-dot`} style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', width: 'fit-content' }}>
                {formatStatus(drive.status)}
              </span>
              <span style={{ fontSize: '0.82rem', color: drive.venue?.trim() ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '0.5rem' }}>
                {drive.venue?.trim() || '—'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                <Users size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                {drive.registered ?? 0}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                {canReviewApplicants(drive) && (
                  <Link
                    href={`/dashboard/employer/applications?tab=drives&driveId=${encodeURIComponent(drive.id)}`}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    <ClipboardList size={13} aria-hidden />
                    Review
                  </Link>
                )}
                {canEditDrive(drive) && (
                  <Link
                    href={`/dashboard/employer/drives/edit/${drive.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    <Pencil size={13} aria-hidden />
                    Edit
                  </Link>
                )}
                {canCancelDrive(drive) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={cancellingId === drive.id}
                    onClick={() => cancelDrive(drive)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', color: 'var(--danger-600)' }}
                  >
                    <Ban size={13} aria-hidden />
                    {cancellingId === drive.id ? 'Cancelling…' : (drive.status === 'requested' ? 'Withdraw' : 'Cancel')}
                  </button>
                )}
                {!canReviewApplicants(drive) && !canEditDrive(drive) && !canCancelDrive(drive) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && viewMode === 'card' && filteredDrives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDrives.map((drive) => (
            <div key={drive.id} className="card card-hover" style={{ border: '1px solid var(--border-default)', padding: '1.5rem' }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {canReviewApplicants(drive) && (
                    <Link
                      href={`/dashboard/employer/applications?tab=drives&driveId=${encodeURIComponent(drive.id)}`}
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <ClipboardList size={14} aria-hidden />
                      Review applicants
                    </Link>
                  )}
                  {canEditDrive(drive) && (
                    <Link
                      href={`/dashboard/employer/drives/edit/${drive.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Pencil size={14} aria-hidden />
                      Edit
                    </Link>
                  )}
                  {canCancelDrive(drive) && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={cancellingId === drive.id}
                      onClick={() => cancelDrive(drive)}
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger-600)' }}
                    >
                      <Ban size={14} aria-hidden />
                      {cancellingId === drive.id ? 'Cancelling…' : cancelDriveLabel(drive)}
                    </button>
                  )}
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
                  <DriveTypeBadge type={drive.type} />
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
        </div>
      )}

      {!isLoading && filteredDrives.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-default)',
        }}>
          <div style={{ background: 'var(--primary-50)', width: '68px', height: '68px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Target size={30} style={{ color: 'var(--primary-500)' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {allDrives.length === 0 ? 'No placement drives found' : 'No drives match your filters'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            {allDrives.length === 0
              ? (campusFilterActive
                ? `No drives found for the selected campus${selectedIds.size > 1 ? 'es' : ''}. Try a different filter or request a new drive.`
                : 'No drives scheduled yet. Request a placement drive with one of your approved partner campuses.')
              : 'Try adjusting search, status, date, or campus filters to see more results.'}
          </p>
          {allDrives.length === 0 ? (
            <Link href="/dashboard/employer/drives/request" className="btn btn-primary">
              Request New Drive
            </Link>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

    </div>
  );
}
