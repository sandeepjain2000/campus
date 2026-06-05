'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate as swrMutate } from 'swr';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import MonthYearPicker from '@/components/MonthYearPicker';
import CompanyNameLink from '@/components/CompanyNameLink';
import StudentApplyResumeBanner from '@/components/StudentApplyResumeBanner';
import StudentBrowsePrerequisitePanel from '@/components/student/StudentBrowsePrerequisitePanel';
import PostingEligibilitySection from '@/components/student/PostingEligibilitySection';
import StudentApplyEligibilityControls from '@/components/student/StudentApplyEligibilityControls';
import PageLoading from '@/components/PageLoading';
import {
  globalApplyBlockedReason,
  resolveApplyBlockReason,
} from '@/lib/getApplyBlockReason';
import { buildStudentApplyContext, programOpportunityFromRow } from '@/lib/studentApplyContext';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { FIELD_IDS } from '@/lib/inputConstraints';

function getTimeLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return '< 1h left';
}

function driveTypeLabel(type) {
  if (type === 'virtual') return '🌐 Virtual';
  if (type === 'off_campus') return '🏙️ Off-campus';
  if (type === 'hybrid') return '🔄 Hybrid';
  return '🏛️ On-campus';
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Parse drive date to calendar components (local noon anchor for date-only strings). */
function parseDriveYmd(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const y = +iso[1];
    const mo = +iso[2];
    const d = +iso[3];
    return { y, mo, d, monthKey: `${y}-${String(mo).padStart(2, '0')}` };
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const x = new Date(t);
  const y = x.getFullYear();
  const mo = x.getMonth() + 1;
  const d = x.getDate();
  return { y, mo, d, monthKey: `${y}-${String(mo).padStart(2, '0')}` };
}

function startOfDayFromDriveRaw(raw) {
  const ymd = parseDriveYmd(raw);
  if (!ymd) return null;
  return startOfDay(new Date(ymd.y, ymd.mo - 1, ymd.d, 12, 0, 0, 0));
}

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to fetch data');
  }
  return res.json();
};

export default function StudentDrivesPage() {
  const { addToast } = useToast();
  const { data: drivesData, error: drivesError, isLoading: drivesLoading } = useSWR('/api/student/drives', fetcher);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [now, setNow] = useState(Date.now());
  const [applyingTo, setApplyingTo] = useState(null);
  const [locationPref, setLocationPref] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const drives = useMemo(() => {
    return Array.isArray(drivesData?.drives) ? drivesData.drives : [];
  }, [drivesData]);

  const canApply = drivesData?.canApply !== false;
  const globalBlockedReason = globalApplyBlockedReason(canApply, applyBlockedReason);
  const canBrowseListings = drivesData?.canBrowseListings !== false;
  const browseGateProps = {
    canBrowseListings,
    browseGateTitle: drivesData?.browseGateTitle,
    browseGateMessage: drivesData?.browseGateMessage,
    profileComplete: drivesData?.profileComplete !== false,
    hasResume: drivesData?.hasResume !== false,
    profileMissingLabels: drivesData?.profileMissingLabels || [],
  };
  const placementLocked = drivesData?.placementLocked === true;
  const applyBlockedReason = drivesData?.applyBlockedReason || '';
  const currentStudent = buildStudentApplyContext(drivesData);
  const driveOpenStatuses = ['approved', 'scheduled'];

  function driveOpportunity(drive) {
    return programOpportunityFromRow(drive);
  }

  const monthBounds = useMemo(() => {
    const y = new Date().getFullYear();
    return { minYear: y - 1, maxYear: y + 2 };
  }, []);

  const filteredDrives = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const monthActive = datePreset !== 'range' && Boolean(monthFilter);
    return drives.filter((d) => {
      if (search && !d.company.toLowerCase().includes(search.toLowerCase()) && !d.role.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && d.type !== filterType) return false;
      if (filterStatus && d.status !== filterStatus) return false;

      const driveDay = startOfDayFromDriveRaw(d.date);
      if (!driveDay) return false;

      if (monthActive) {
        const ymd = parseDriveYmd(d.date);
        if (!ymd || ymd.monthKey !== monthFilter) return false;
      }

      if (datePreset === 'past' && driveDay >= todayStart) return false;
      if (datePreset === 'future' && driveDay < todayStart) return false;

      if (datePreset === 'range') {
        if (rangeFrom) {
          const from = startOfDay(new Date(rangeFrom + 'T12:00:00'));
          if (driveDay < from) return false;
        }
        if (rangeTo) {
          const to = startOfDay(new Date(rangeTo + 'T12:00:00'));
          if (driveDay > to) return false;
        }
      }

      return true;
    });
  }, [drives, search, filterType, filterStatus, datePreset, monthFilter, rangeFrom, rangeTo]);

  const openApplyModal = (drive) => {
    if (drive.applied) return;
    const blockReason = resolveApplyBlockReason(driveOpportunity(drive), currentStudent, {
      openStatuses: driveOpenStatuses,
      globalBlockedReason,
    });
    if (blockReason) return;
    setApplyingTo(drive);
    setLocationPref('');
  };

  const confirmApply = async () => {
    if (!applyingTo) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_id: applyingTo.id,
          location_preference: locationPref,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || data.success) {
        await swrMutate('/api/student/drives');
        await swrMutate('/api/student/applications');
        addToast(`Applied to ${applyingTo.company}. Good luck!`, 'info');
      } else {
        addToast(data.error || 'Could not record application. Try again.', 'warning');
      }
    } catch {
      addToast('Network error — application may not be saved.', 'warning');
    } finally {
      setIsSubmitting(false);
      setApplyingTo(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎯 Placement Drives</h1>
          <p>Browse on-campus, virtual, and off-campus drives — filter by date and apply when open.</p>
        </div>
      </div>

      {drivesError && (
        <div className="card" style={{ color: 'var(--danger-600)' }}>
          <p>{drivesError.message || 'Could not load drives.'}</p>
        </div>
      )}

      {drivesLoading && <PageLoading message="Loading placement drives…" variant="skeleton-card" inline />}

      {!drivesLoading && !drivesError && (
      <StudentBrowsePrerequisitePanel {...browseGateProps}>
      <StudentApplyResumeBanner
        canApply={canApply}
        placementLocked={placementLocked}
        applyBlockedReason={applyBlockedReason}
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="table-search" style={{ flex: '1', minWidth: '220px', maxWidth: '360px' }}>
              <input className="form-input" placeholder="🔍 Search company or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All modes</option>
              <option value="on_campus">On-campus</option>
              <option value="virtual">Virtual</option>
              <option value="off_campus">Off-campus</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              columnGap: '1.5rem',
              rowGap: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                flex: '0 0 auto',
                minWidth: '10rem',
              }}
            >
              <label className="form-label text-xs" htmlFor="drive-when-preset">
                When
              </label>
              <select
                id="drive-when-preset"
                className="form-select"
                style={{ minWidth: '11rem', width: '100%' }}
                value={datePreset}
                onChange={(e) => {
                  const v = e.target.value;
                  setDatePreset(v);
                  if (v === 'range') setMonthFilter('');
                }}
              >
                <option value="">Any date</option>
                <option value="future">Upcoming only</option>
                <option value="past">Past drives</option>
                <option value="range">Custom range…</option>
              </select>
            </div>
            {datePreset === 'range' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: '0 0 auto' }}>
                  <label className="form-label text-xs" htmlFor="drive-range-from">
                    From
                  </label>
                  <ValidatedDateInput
                    id="drive-range-from"
                    fieldId={FIELD_IDS.DATE_RANGE_FROM}
                    context={{ dateTo: rangeTo, maxSpanYears: 5 }}
                    value={rangeFrom}
                    onChange={setRangeFrom}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: '0 0 auto' }}>
                  <label className="form-label text-xs" htmlFor="drive-range-to">
                    To
                  </label>
                  <ValidatedDateInput
                    id="drive-range-to"
                    fieldId={FIELD_IDS.DATE_RANGE_TO}
                    context={{ dateFrom: rangeFrom, maxSpanYears: 5 }}
                    value={rangeTo}
                    onChange={setRangeTo}
                  />
                </div>
              </>
            )}
            {datePreset !== 'range' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  flex: '0 1 16rem',
                  minWidth: 'min(100%, 12rem)',
                  maxWidth: '20rem',
                }}
              >
                <label className="form-label text-xs" htmlFor="drive-month-year-picker">
                  Month &amp; year
                </label>
                <MonthYearPicker
                  id="drive-month-year-picker"
                  value={monthFilter}
                  onChange={setMonthFilter}
                  minYear={monthBounds.minYear}
                  maxYear={monthBounds.maxYear}
                />
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                flex: '0 0 auto',
                minWidth: 'fit-content',
                marginLeft: 'auto',
                justifyContent: 'flex-end',
              }}
            >
              <span className="form-label text-xs" style={{ visibility: 'hidden' }} aria-hidden="true">
                &nbsp;
              </span>
              <div
                className="text-sm text-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '2.5rem',
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredDrives.length} drives match
              </div>
            </div>
          </div>
        </div>
      </div>

      {canBrowseListings && filteredDrives.length === 0 && (
        <div className="card">
          <p className="text-secondary">No drives found for your current filters.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredDrives.map((drive) => {
          const isExpired = drive.deadline ? new Date(drive.deadline) < now : false;
          const timeLeft = getTimeLeft(drive.deadline);
          const activeApplication = Boolean(drive.applied);
          const st = drive.applicationStatus ? String(drive.applicationStatus).toLowerCase() : '';
          const isWithdrawnFinal = st === 'withdrawn';
          const isRejected = st === 'rejected';
          const hasPriorApplication = isWithdrawnFinal || isRejected;
          const blockReason =
            !isExpired && !hasPriorApplication && !activeApplication
              ? resolveApplyBlockReason(driveOpportunity(drive), currentStudent, {
                  openStatuses: driveOpenStatuses,
                  globalBlockedReason,
                })
              : null;

          return (
            <div
              key={drive.id}
              className={`card card-hover ${isExpired && !activeApplication ? 'card-disabled' : ''}`}
              style={{ cursor: 'default', opacity: isExpired && !activeApplication ? 0.75 : 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                      <CompanyNameLink name={drive.company} website={drive.website} />
                    </h3>
                    <span className={`badge badge-${getStatusColor(drive.status)}`}>{formatStatus(drive.status)}</span>
                  </div>
                  <p className="text-sm text-secondary">{drive.role}</p>
                  <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                    📍 {drive.venue}
                    {drive.offCampusCity ? ` · ${drive.offCampusCity}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {activeApplication ? (
                    <span className="badge badge-green">Applied</span>
                  ) : isExpired ? (
                    <button type="button" className="btn btn-outline btn-sm" disabled aria-disabled="true">
                      Closed
                    </button>
                  ) : hasPriorApplication ? (
                    <button type="button" className="btn btn-outline btn-sm" disabled aria-disabled="true">
                      {isWithdrawnFinal ? 'Withdrawn (final)' : 'Rejected'}
                    </button>
                  ) : (
                    <StudentApplyEligibilityControls
                      opportunity={driveOpportunity(drive)}
                      student={currentStudent}
                      applyLabel="Apply now"
                      blockReason={blockReason}
                      globalBlockedReason={globalBlockedReason}
                      openStatuses={driveOpenStatuses}
                      size="sm"
                      onApply={() => openApplyModal(drive)}
                    />
                  )}
                  {timeLeft && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isExpired ? 'var(--danger-500)' : 'var(--warning-600)' }}>
                      🕒 {isExpired ? 'Deadline passed' : `Ends in ${timeLeft}`}
                    </div>
                  )}
                </div>
              </div>
              <div className="drive-info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="drive-info-item">
                  <div className="drive-info-label">Date</div>
                  <div className="drive-info-value">{formatDate(drive.date)}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Package</div>
                  <div className="drive-info-value">{drive.salary}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Mode</div>
                  <div className="drive-info-value">
                    <span className={`badge badge-${drive.type === 'virtual' ? 'blue' : drive.type === 'off_campus' ? 'amber' : drive.type === 'hybrid' ? 'amber' : 'indigo'}`}>
                      {driveTypeLabel(drive.type)}
                    </span>
                  </div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Min CGPA</div>
                  <div className="drive-info-value">{drive.cgpa}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Vacancies</div>
                  <div className="drive-info-value">{drive.vacancies}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Registered</div>
                  <div className="drive-info-value">{drive.registered} students</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {drive.branch.map((b) => (
                  <span key={b} className="badge badge-gray">
                    {b}
                  </span>
                ))}
              </div>
              {!activeApplication && !isExpired && !hasPriorApplication ? (
                <div style={{ marginTop: '1rem' }}>
                  <PostingEligibilitySection
                    opportunity={driveOpportunity(drive)}
                    student={currentStudent}
                    audience="student"
                    openStatuses={driveOpenStatuses}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      </StudentBrowsePrerequisitePanel>
      )}

      {applyingTo && (() => {
        const confirmBlockReason = resolveApplyBlockReason(driveOpportunity(applyingTo), currentStudent, {
          openStatuses: driveOpenStatuses,
          globalBlockedReason,
        });
        return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              {(() => {
                const st = applyingTo.applicationStatus ? String(applyingTo.applicationStatus).toLowerCase() : '';
                return `Apply to ${applyingTo.company}`;
              })()}
            </h3>
            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Confirm application for <strong>{applyingTo.role}</strong>. You can note a location preference if the role has multiple bases.
            </p>
            <PostingEligibilitySection
              opportunity={driveOpportunity(applyingTo)}
              student={currentStudent}
              audience="student"
              openStatuses={driveOpenStatuses}
            />
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Preferred location (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="E.g. Bangalore, Remote, Any"
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setApplyingTo(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmApply}
                disabled={isSubmitting || Boolean(confirmBlockReason)}
                aria-disabled={isSubmitting || confirmBlockReason ? 'true' : undefined}
                title={confirmBlockReason || undefined}
              >
                {isSubmitting ? 'Submitting…' : 'Confirm application'}
              </button>
            </div>
            {confirmBlockReason ? (
              <p className="text-sm" style={{ marginTop: '0.75rem', color: 'var(--warning-700, #b45309)' }}>
                {confirmBlockReason}
              </p>
            ) : null}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
