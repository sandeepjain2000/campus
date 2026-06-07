'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import { COMMON_SORT_OPTIONS, FILTER_ALL } from '@/lib/tableQueryPresets';
import {
  GraduationCap, Plus, Users, IndianRupee, Activity, FileText, Settings,
  LayoutGrid, List, Ban, ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import ValidatedNumberInput from '@/components/form/ValidatedNumberInput';
import CurrencyAmountInput from '@/components/form/CurrencyAmountInput';
import { FIELD_IDS } from '@/lib/inputConstraints';
import { buildDefaultTenantSelection } from '@/lib/defaultTestCampus';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { toCsvIsoDate } from '@/lib/csvExport';
import { formatEmployerMinCgpa, normalizeEmployerMinCgpa } from '@/lib/employerJobDisplay';
import { validateAndResolveEmployerJobSubmit } from '@/lib/employerJobSubmitValidation';
import EmployerCampusTargetPicker from '@/components/employer/EmployerCampusTargetPicker';

async function swrFetcher(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function buildDescription(durationMonths, notes) {
  const lines = [`Duration: ${durationMonths} months.`];
  if (notes?.trim()) {
    lines.push('', notes.trim());
  }
  return lines.join('\n');
}

function parseInternshipDescription(description) {
  const text = String(description || '').trim();
  const match = text.match(/^Duration:\s*(\d+)\s*months\.?\s*(?:\n\n([\s\S]*))?$/i);
  if (match) {
    return {
      durationMonths: match[1] || '6',
      notes: (match[2] || '').trim(),
    };
  }
  return { durationMonths: '6', notes: text };
}

export default function EmployerInternshipsPage() {
  const { addToast } = useToast();
  const { data: campusData } = useSWR('/api/employer/campuses', swrFetcher, { revalidateOnFocus: true });
  const {
    data: jobData,
    error: jobsError,
    isLoading: jobsLoading,
    mutate: mutateInternships,
  } = useSWR('/api/employer/jobs?jobType=internship', swrFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [durationMonths, setDurationMonths] = useState('6');
  const [stipend, setStipend] = useState('');
  const [stipendMax, setStipendMax] = useState('');
  const [vacancies, setVacancies] = useState('5');
  const [minCgpa, setMinCgpa] = useState('');
  const [keywords, setKeywords] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTenantIds, setSelectedTenantIds] = useState({});
  const [campusSyncJobId, setCampusSyncJobId] = useState(null);
  const [campusSyncSelection, setCampusSyncSelection] = useState({});
  const [campusSyncSubmitting, setCampusSyncSubmitting] = useState(false);
  const [detailInternship, setDetailInternship] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [viewMode, setViewMode] = useState('card');

  const approvedCampuses = useMemo(
    () => (campusData?.colleges || []).filter((c) => c.approval_status === 'approved'),
    [campusData],
  );

  const internships = Array.isArray(jobData?.jobs) ? jobData.jobs : [];
  const internshipStatusFilterOptions = useMemo(
    () => [
      FILTER_ALL,
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
      { value: 'closed', label: 'Closed' },
    ],
    [],
  );
  const {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered: displayInternships,
    filteredCount,
    totalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(internships, {
    getSearchText: (intern) => [intern.title, intern.keywords, intern.status].filter(Boolean).join(' '),
    filterFn: (row, f) => !f || String(row.status || '') === f,
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: 'date_desc',
  });

  const resetFormFields = useCallback(() => {
    setTitle('');
    setDurationMonths('6');
    setStipend('');
    setStipendMax('');
    setVacancies('5');
    setMinCgpa('');
    setKeywords('');
    setNotes('');
    setEditingId(null);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetFormFields();
  }, [resetFormFields]);

  const openForm = () => {
    resetFormFields();
    setSelectedTenantIds(buildDefaultTenantSelection(approvedCampuses));
    setShowForm(true);
  };

  const openDetails = useCallback((intern) => {
    setDetailInternship(intern);
  }, []);

  const openManage = useCallback(
    (intern) => {
      const parsed = parseInternshipDescription(intern.description || '');
      setEditingId(intern.id);
      setTitle(intern.title || '');
      setDurationMonths(parsed.durationMonths);
      setStipend(intern.salaryMin ?? '');
      setStipendMax(intern.salaryMax ?? '');
      setVacancies(String(intern.vacancies ?? '5'));
      const cgpaVal = normalizeEmployerMinCgpa(intern.minCgpa ?? intern.cgpa);
      setMinCgpa(cgpaVal != null ? String(cgpaVal) : '');
      setKeywords(intern.keywords || '');
      setNotes(parsed.notes);
      setSelectedTenantIds(buildDefaultTenantSelection(approvedCampuses, intern.tenantIds));
      setShowForm(true);
      setDetailInternship(null);
      requestAnimationFrame(() => {
        document.getElementById('internship-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [approvedCampuses],
  );

  const closePublishedInternship = useCallback(
    async (intern) => {
      if (!intern?.id) return;
      setClosingId(intern.id);
      try {
        const res = await fetch('/api/employer/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'close', id: intern.id }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          addToast(json.error || 'Could not close internship', 'error');
          return;
        }
        addToast('Internship closed. It remains listed under Closed for your records.', 'success');
        setDetailInternship(null);
        if (editingId === intern.id) closeForm();
        await mutateInternships();
      } catch {
        addToast('Network error', 'error');
      } finally {
        setClosingId(null);
      }
    },
    [addToast, mutateInternships, editingId, closeForm],
  );

  const stats = useMemo(() => {
    const n = internships.length;
    let sum = 0;
    let count = 0;
    internships.filter((j) => j.status === 'published').forEach((j) => {
      const a = j.salaryMin != null ? Number(j.salaryMin) : null;
      const b = j.salaryMax != null ? Number(j.salaryMax) : null;
      if (a != null && b != null) {
        sum += (a + b) / 2;
        count += 1;
      } else if (a != null) {
        sum += a;
        count += 1;
      } else if (b != null) {
        sum += b;
        count += 1;
      }
    });
    return {
      count: n,
      published: internships.filter((j) => j.status === 'published').length,
      avgStipend: count ? Math.round(sum / count) : null,
    };
  }, [internships]);

  const editingInternship = useMemo(
    () => (editingId ? internships.find((i) => i.id === editingId) : null),
    [editingId, internships],
  );

  const saveInternship = useCallback(async () => {
    if (!title.trim()) {
      addToast('Internship title is required', 'error');
      return;
    }
    const isEditing = !!editingId;
    const tenantIds = Object.entries(selectedTenantIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!tenantIds.length) {
      addToast('Select at least one approved campus.', 'warning');
      return;
    }
    const validated = validateAndResolveEmployerJobSubmit({
      salaryMin: stipend,
      salaryMax: stipendMax,
      minCgpa,
      vacancies,
      jobType: 'internship',
    });
    if (validated.error) {
      addToast(validated.error, 'warning');
      return;
    }
    const sm = stipend === '' ? null : Number(stipend);
    const sx = stipendMax === '' ? null : Number(stipendMax);

    setSubmitting(true);
    try {
      const description = buildDescription(durationMonths, notes);
      const payload = {
        title: title.trim(),
        description,
        jobType: 'internship',
        status: isEditing ? editingInternship?.status || 'published' : 'published',
        salaryMin: sm,
        salaryMax: sx != null && !Number.isNaN(sx) ? sx : sm,
        minCgpa: validated.minCgpa,
        vacancies: vacancies === '' ? 1 : vacancies,
        keywords,
      };
      if (isEditing) {
        payload.id = editingId;
        payload.tenantIds = tenantIds;
      } else {
        payload.tenantIds = tenantIds;
      }

      const res = await fetch('/api/employer/jobs', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error || (isEditing ? 'Could not save changes' : 'Could not publish'), 'error');
        return;
      }
      addToast(
        isEditing
          ? 'Internship updated.'
          : 'Internship published to the database. Partner colleges and students were notified.',
        'success',
      );
      closeForm();
      await mutateInternships();
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [
    title,
    selectedTenantIds,
    stipend,
    stipendMax,
    durationMonths,
    notes,
    minCgpa,
    vacancies,
    keywords,
    editingId,
    editingInternship,
    addToast,
    mutateInternships,
    closeForm,
  ]);

  const openCampusSync = useCallback(
    (jobId) => {
      const intern = internships.find((i) => i.id === jobId);
      setCampusSyncSelection(buildDefaultTenantSelection(approvedCampuses, intern?.tenantIds));
      setCampusSyncJobId(jobId);
    },
    [approvedCampuses, internships],
  );

  const submitCampusSync = useCallback(async () => {
    if (!campusSyncJobId) return;
    const tenantIds = Object.entries(campusSyncSelection)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!tenantIds.length) {
      addToast('Select at least one approved campus.', 'warning');
      return;
    }
    setCampusSyncSubmitting(true);
    try {
      const res = await fetch('/api/employer/jobs/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: campusSyncJobId, tenantIds }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(json.error || 'Could not sync campuses', 'error');
        return;
      }
      const msg =
        json.inserted > 0
          ? `Campus visibility updated (${json.inserted} new). College and students can refresh.`
          : json.skippedNotApproved > 0
            ? 'No new visibility rows (check tie-ups are approved for selected campuses).'
            : 'Visibility already present for those campuses.';
      addToast(msg, json.inserted > 0 ? 'success' : 'info');
      setCampusSyncJobId(null);
    } catch {
      addToast('Network error', 'error');
    } finally {
      setCampusSyncSubmitting(false);
    }
  }, [campusSyncJobId, campusSyncSelection, addToast]);

  const getInternshipsCsv = useCallback(
    (scope) => {
      const list = scope === 'current' ? displayInternships : internships;
      return {
        headers: [
          'id',
          'title',
          'keywords',
          'stipend_min_inr',
          'stipend_max_inr',
          'min_cgpa',
          'openings',
          'status',
          'posted_at',
          'duration_months',
          'campus_tenant_ids',
        ],
        rows: list.map((intern) => {
          const parsed = parseInternshipDescription(intern.description || '');
          const cgpaVal = normalizeEmployerMinCgpa(intern.minCgpa ?? intern.cgpa);
          return [
            intern.id,
            intern.title ?? '',
            intern.keywords ?? '',
            intern.salaryMin != null ? String(intern.salaryMin) : '',
            intern.salaryMax != null ? String(intern.salaryMax) : '',
            cgpaVal != null ? String(cgpaVal) : '',
            intern.vacancies != null ? String(intern.vacancies) : '',
            intern.status ?? '',
            intern.createdAt ? toCsvIsoDate(intern.createdAt) : '',
            parsed.durationMonths ?? '',
            Array.isArray(intern.tenantIds) ? intern.tenantIds.join(';') : '',
          ];
        }),
      };
    },
    [displayInternships, internships],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={28} className="text-secondary" strokeWidth={1.5} /> Internship Programs
          </h1>
          <p className="text-secondary">
            Post internships to <span className="font-mono text-xs">job_postings</span> (same pipeline as Job Postings). Stipend fields are stored as monthly INR.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {totalCount > 0 ? (
            <ExportCsvSplitButton
              mode="dual"
              filenameBase="employer_internships"
              currentCount={filteredCount}
              fullCount={totalCount}
              getRows={getInternshipsCsv}
            />
          ) : null}
          <button type="button" className="btn btn-primary" onClick={() => (showForm ? closeForm() : openForm())}>
            <Plus size={16} /> {showForm ? 'Close form' : 'Post Internship'}
          </button>
        </div>
      </div>

      {showForm && (
        <div id="internship-form" className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">{editingId ? 'Edit Internship' : 'Post New Internship'}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>
              ✕ Close
            </button>
          </div>
          {editingId ? (
            <p className="text-sm text-secondary" style={{ marginTop: 0, marginBottom: '1rem' }}>
              Campus visibility is unchanged here. Use <strong>Sync</strong> on a published row to add campuses.
            </p>
          ) : null}
          <div className="grid grid-2">
            {!editingId ? (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <EmployerCampusTargetPicker
                campuses={approvedCampuses}
                selection={selectedTenantIds}
                onSelectionChange={setSelectedTenantIds}
                label="Target campuses (approved)"
                required
                emptyMessage="No approved campuses. Request access from the campus directory first."
              />
            </div>
            ) : null}
            <div className="form-group">
              <label className="form-label">Internship Title <span className="required">*</span></label>
              <input className="form-input" placeholder="e.g., Summer Data Intern" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration <span className="required">*</span></label>
              <select className="form-select" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stipend / month (min, INR)</label>
              <CurrencyAmountInput
                fieldId={FIELD_IDS.EMPLOYER_STIPEND_MIN}
                placeholder="40000"
                value={stipend}
                onChange={setStipend}
                wordsSuffix="Rupees per month"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stipend / month (max, optional)</label>
              <CurrencyAmountInput
                fieldId={FIELD_IDS.EMPLOYER_STIPEND_MAX}
                context={{ salaryMin: stipend }}
                placeholder="Same as min if empty"
                value={stipendMax}
                onChange={setStipendMax}
                wordsSuffix="Rupees per month"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Openings</label>
              <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_VACANCIES} value={vacancies} onChange={setVacancies} />
            </div>
            <div className="form-group">
              <label className="form-label">Min CGPA</label>
              <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_MIN_CGPA} step="0.1" value={minCgpa} onChange={setMinCgpa} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Skills (comma-separated)</label>
              <input className="form-input" placeholder="Python, SQL, ML" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Additional notes</label>
              <textarea className="form-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Eligibility, location, PPO hint…" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {editingId && editingInternship?.status === 'published' ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={submitting || closingId === editingId}
                onClick={() => void closePublishedInternship(editingInternship)}
              >
                {closingId === editingId ? 'Closing…' : 'Close posting'}
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
              <button type="button" className="btn btn-secondary" disabled={submitting} onClick={closeForm}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={submitting} onClick={saveInternship}>
                {submitting ? (editingId ? 'Saving…' : 'Publishing…') : editingId ? 'Save changes' : 'Publish Internship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {jobsError && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--danger-500)' }}>
          <p className="text-sm" style={{ margin: 0 }}>
            Could not load internships: {jobsError.message}. Check login and database configuration.
          </p>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stats-card">
          <div className="stats-card-icon indigo"><Users size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.published}</div>
          <div className="stats-card-label">Published internships</div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon green"><IndianRupee size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.avgStipend != null ? formatCurrency(stats.avgStipend) : '—'}</div>
          <div className="stats-card-label">Avg monthly stipend</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-icon amber"><Activity size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">{stats.count}</div>
          <div className="stats-card-label">All internship records</div>
        </div>
      </div>

      {jobsLoading && <p className="text-sm text-secondary">Loading internships…</p>}
      {!jobsLoading && !jobsError && internships.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px dashed var(--border-default)' }}>
          <GraduationCap size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem', opacity: 0.35 }} />
          <p className="text-sm text-secondary" style={{ margin: 0 }}>No internship postings yet. Publish one above.</p>
        </div>
      )}
      {!jobsLoading && !jobsError && totalCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <DataTableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search title or keywords…"
              filter={filter}
              onFilterChange={setFilter}
              filterOptions={internshipStatusFilterOptions}
              filterLabel="Status"
              sort={sort}
              onSortChange={setSort}
              sortOptions={COMMON_SORT_OPTIONS}
              filteredCount={filteredCount}
              totalCount={totalCount}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid var(--border-default)', flexShrink: 0 }}>
            {[{ mode: 'card', icon: LayoutGrid, label: 'Card view' }, { mode: 'list', icon: List, label: 'List view' }].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                  color: viewMode === mode ? 'var(--primary-600)' : 'var(--text-tertiary)',
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={15} aria-hidden />
                {mode === 'card' ? 'Cards' : 'List'}
              </button>
            ))}
          </div>
        </div>
      )}
      {!jobsLoading && !jobsError && totalCount > 0 && viewMode === 'card' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {displayInternships.map((intern) => (
            <InternshipCard
              key={String(intern.id)}
              intern={intern}
              closingId={closingId}
              onCampusSync={openCampusSync}
              onDetails={openDetails}
              onManage={openManage}
              onClosePosting={closePublishedInternship}
            />
          ))}
          {displayInternships.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)' }}>
              <GraduationCap size={48} className="text-tertiary" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No internships match</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your search or status filter.</p>
            </div>
          )}
        </div>
      )}
      {!jobsLoading && !jobsError && totalCount > 0 && viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 880 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ paddingLeft: '1.25rem' }}>Title</th>
                  <th>Stipend / month</th>
                  <th>Min CGPA</th>
                  <th>Openings</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem', width: 1 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayInternships.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary">
                      No internships match your search or filters.
                    </td>
                  </tr>
                ) : null}
                {displayInternships.map((intern) => (
                  <tr key={String(intern.id)}>
                    <td style={{ paddingLeft: '1.25rem', maxWidth: 280 }}>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{intern.title}</div>
                      {intern.keywords ? (
                        <div className="text-xs text-tertiary" style={{ marginTop: '0.2rem' }}>{intern.keywords}</div>
                      ) : null}
                    </td>
                    <td className="text-sm">{stipendLabel(intern.salaryMin, intern.salaryMax)}</td>
                    <td className="text-sm">{formatEmployerMinCgpa(intern.minCgpa ?? intern.cgpa)}</td>
                    <td className="text-sm">{intern.vacancies ?? '—'}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(intern.status)} badge-dot`}>{formatStatus(intern.status)}</span>
                    </td>
                    <td className="text-sm text-secondary">{intern.createdAt ? formatDate(intern.createdAt) : '—'}</td>
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem', whiteSpace: 'nowrap' }}>
                      {intern.status === 'published' && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openCampusSync(intern.id)}>
                          <Users size={14} style={{ marginRight: '0.25rem' }} /> Sync
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openDetails(intern)}>
                        <FileText size={14} style={{ marginRight: '0.25rem' }} /> Details
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openManage(intern)}>
                        <Settings size={14} style={{ marginRight: '0.25rem' }} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="text-sm text-secondary">
          {internships.length} internship posting{internships.length === 1 ? '' : 's'} from your company
        </div>
      </div>

      {detailInternship ? (
        <InternshipDetailDialog
          internship={detailInternship}
          closingId={closingId}
          onClose={() => setDetailInternship(null)}
          onManage={openManage}
          onClosePosting={closePublishedInternship}
        />
      ) : null}

      {campusSyncJobId && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-header">
            <h3 className="card-title">Campus visibility for students &amp; college</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCampusSyncJobId(null)}>
              ✕ Close
            </button>
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: '0.75rem' }}>
            If this internship is published but does not appear on the college or student dashboards, add visibility rows for the
            campuses that should see it (approved tie-up required).
          </p>
          <EmployerCampusTargetPicker
            campuses={approvedCampuses}
            selection={campusSyncSelection}
            onSelectionChange={setCampusSyncSelection}
            compact
            emptyMessage="No approved campuses."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" disabled={campusSyncSubmitting} onClick={() => setCampusSyncJobId(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={campusSyncSubmitting} onClick={submitCampusSync}>
              {campusSyncSubmitting ? 'Saving…' : 'Save visibility'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InternshipCard({
  intern,
  closingId,
  onCampusSync,
  onDetails,
  onManage,
  onClosePosting,
}) {
  const parsed = parseInternshipDescription(intern.description || '');
  const apps = Number(intern.applications) || 0;

  return (
    <div
      className="card card-hover"
      style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', border: '1px solid var(--border-default)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
            {intern.title}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className={`badge badge-${getStatusColor(intern.status)}`} style={{ padding: '0.2rem 0.5rem' }}>
              {formatStatus(intern.status)}
            </span>
            <span className="badge badge-gray" style={{ padding: '0.2rem 0.5rem' }}>
              {parsed.durationMonths} mo
            </span>
          </div>
        </div>
        <div style={{ background: 'var(--success-50)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <GraduationCap size={20} className="text-success-700" />
        </div>
      </div>
      {intern.keywords ? (
        <p className="text-xs" style={{ margin: '0 0 1rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          <span className="font-semibold text-tertiary">Skills:</span> {intern.keywords}
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: 'auto',
          padding: '1rem 0',
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <IndianRupee size={14} style={{ color: 'var(--text-tertiary)' }} />
            {stipendLabel(intern.salaryMin, intern.salaryMax)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
            {intern.vacancies ?? '—'} openings
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <GraduationCap size={14} style={{ color: 'var(--text-tertiary)' }} />
            Min CGPA: {formatEmployerMinCgpa(intern.minCgpa ?? intern.cgpa)}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--primary-700)',
              fontWeight: 600,
              background: 'var(--primary-50)',
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              width: 'fit-content',
            }}
          >
            <FileText size={14} aria-hidden />
            {apps} App{apps === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem' }} onClick={() => onManage(intern)}>
            Manage
          </button>
          <a
            className="btn btn-primary"
            href={`/dashboard/employer/applications?tab=internships&jobId=${intern.id}`}
            style={{ flex: 1, padding: '0.6rem', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            Pipeline <ArrowRight size={14} aria-hidden />
          </a>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }} onClick={() => onDetails(intern)}>
            Details
          </button>
          {intern.status === 'published' && (
            <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }} onClick={() => onCampusSync(intern.id)}>
              <Users size={14} style={{ marginRight: '0.25rem' }} aria-hidden />
              Sync campuses
            </button>
          )}
        </div>
        {intern.status === 'published' && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
            disabled={closingId === intern.id}
            onClick={() => void onClosePosting(intern)}
          >
            <Ban size={16} aria-hidden />
            {closingId === intern.id ? 'Closing…' : 'Close posting'}
          </button>
        )}
      </div>
      <div className="text-xs text-tertiary" style={{ textAlign: 'center', marginTop: '1rem' }}>
        Posted {intern.createdAt ? formatDate(intern.createdAt) : '—'}
      </div>
    </div>
  );
}

function InternshipDetailDialog({ internship, closingId, onClose, onManage, onClosePosting }) {
  const parsed = parseInternshipDescription(internship.description || '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="internship-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <button
        type="button"
        aria-label="Close details"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer' }}
        onClick={onClose}
      />
      <div
        className="card animate-slideUp"
        style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}
      >
        <div className="card-header">
          <h3 id="internship-detail-title" className="card-title">{internship.title}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <DetailRow label="Status">
            <span className={`badge badge-${getStatusColor(internship.status)} badge-dot`}>{formatStatus(internship.status)}</span>
          </DetailRow>
          <DetailRow label="Stipend / month">{stipendLabel(internship.salaryMin, internship.salaryMax)}</DetailRow>
          <DetailRow label="Duration">{parsed.durationMonths} months</DetailRow>
          <DetailRow label="Min CGPA">{formatEmployerMinCgpa(internship.minCgpa ?? internship.cgpa)}</DetailRow>
          <DetailRow label="Openings">{internship.vacancies ?? '—'}</DetailRow>
          <DetailRow label="Posted">{internship.createdAt ? formatDate(internship.createdAt) : '—'}</DetailRow>
          {internship.keywords ? <DetailRow label="Skills">{internship.keywords}</DetailRow> : null}
          {parsed.notes ? <DetailRow label="Notes">{parsed.notes}</DetailRow> : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {internship.status === 'published' ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={closingId === internship.id}
              onClick={() => void onClosePosting(internship)}
            >
              {closingId === internship.id ? 'Closing…' : 'Close posting'}
            </button>
          ) : null}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onManage(internship)}>
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'start' }}>
      <span className="text-xs font-semibold text-tertiary" style={{ paddingTop: '0.15rem' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function stipendLabel(min, max) {
  if (min == null && max == null) return 'Stipend TBD';
  if (min != null && max != null && Number(min) === Number(max)) {
    return `${formatCurrency(Number(min))}/mo`;
  }
  if (min != null && max != null) {
    return `${formatCurrency(Number(min))}–${formatCurrency(Number(max))}/mo`;
  }
  if (min != null) return `${formatCurrency(Number(min))}/mo`;
  return `${formatCurrency(Number(max))}/mo`;
}
