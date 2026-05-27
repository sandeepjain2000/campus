'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import { COMMON_SORT_OPTIONS, STATUS_FILTER_OPTIONS, statusActiveFilterFn } from '@/lib/tableQueryPresets';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';
import AdminRecordModal from '@/components/admin/AdminRecordModal';
import CompanyNameLink from '@/components/CompanyNameLink';
import { useToast } from '@/components/ToastProvider';

function collegeToForm(c) {
  return {
    name: c?.name || '',
    city: c?.city || '',
    state: c?.state || '',
    pincode: c?.pincode || '',
    website: c?.website || '',
    email: c?.email || '',
    phone: c?.phone || '',
    naac: c?.naac || '',
    nirfRank: c?.nirfRank != null ? String(c.nirfRank) : '',
    active: c?.active !== false,
  };
}

function DetailRow({ label, children }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div className="text-xs font-semibold text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="text-sm" style={{ marginTop: '0.15rem' }}>
        {children}
      </div>
    </div>
  );
}

export default function AdminCollegesPage() {
  const { addToast } = useToast();
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [panelMode, setPanelMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(collegeToForm(null));
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadColleges = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/colleges');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load colleges');
      setColleges(Array.isArray(json.colleges) ? json.colleges : []);
      setListError('');
    } catch (e) {
      setListError(e.message || 'Failed to load colleges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered: displayColleges,
    filteredCount,
    totalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(colleges, {
    getSearchText: (c) => [c.name, c.city, c.naac].filter(Boolean).join(' '),
    filterFn: statusActiveFilterFn,
    sortOptions: COMMON_SORT_OPTIONS,
  });

  const closePanel = () => {
    setPanelMode(null);
    setSelectedId(null);
    setDetail(null);
    setPanelError('');
  };

  const openPanel = async (id, mode) => {
    setSelectedId(id);
    setPanelMode(mode);
    setPanelLoading(true);
    setPanelError('');
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/colleges/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load college');
      setDetail(json.college);
      if (mode === 'edit') setForm(collegeToForm(json.college));
    } catch (e) {
      setPanelError(e.message || 'Failed to load college');
    } finally {
      setPanelLoading(false);
    }
  };

  const saveCollege = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/colleges/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          website: form.website,
          email: form.email,
          phone: form.phone,
          naac: form.naac,
          nirfRank: form.nirfRank,
          active: form.active,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save college');
      addToast('College updated', 'success');
      setDetail(json.college);
      setColleges((prev) =>
        prev.map((c) =>
          c.id === json.college.id
            ? {
                ...c,
                name: json.college.name,
                city: json.college.city || '—',
                naac: json.college.naac || '—',
                students: json.college.students,
                placed: json.college.placed,
                active: json.college.active,
              }
            : c,
        ),
      );
      setPanelMode('view');
    } catch (e) {
      addToast(e.message || 'Failed to save college', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExportRows = () => {
    const headers = ['College', 'City', 'NAAC', 'Students', 'Placed', 'Rate', 'Status'];
    const rows = colleges.map((c) => [
      c.name,
      c.city,
      c.naac,
      String(c.students),
      String(c.placed),
      c.students > 0 ? `${Math.round((c.placed / c.students) * 100)}%` : '0%',
      c.active ? 'Active' : 'Inactive',
    ]);
    return { headers, rows };
  };

  const selectedName = detail?.name || colleges.find((c) => c.id === selectedId)?.name || 'College';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏫 Manage Colleges</h1>
          <p>All registered colleges on the platform</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ExportCsvSplitButton
            filenameBase="admin_colleges"
            currentCount={displayColleges.length}
            fullCount={colleges.length}
            getRows={getExportRows}
          />
          <Link className="btn btn-secondary" href="/dashboard/admin/pending-registrations">
            Onboard colleges & employers
          </Link>
          <Link className="btn btn-primary" href="/dashboard/admin/colleges/add">
            + Add College
          </Link>
        </div>
      </div>

      {!isLoading && totalCount > 0 ? (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search college, city, or NAAC…"
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={STATUS_FILTER_OPTIONS}
          filterLabel="Status"
          sort={sort}
          onSortChange={setSort}
          sortOptions={COMMON_SORT_OPTIONS}
          filteredCount={filteredCount}
          totalCount={totalCount}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      ) : null}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>College</th>
              <th>City</th>
              <th>NAAC</th>
              <th>Students</th>
              <th>Placed</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayColleges.length === 0 && totalCount > 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-secondary">
                  No colleges match your search or filters.
                </td>
              </tr>
            ) : null}
            {displayColleges.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold">{c.name}</td>
                <td>{c.city}</td>
                <td>
                  <span className="badge badge-indigo">{c.naac}</span>
                </td>
                <td>{c.students}</td>
                <td>{c.placed}</td>
                <td className="font-bold">{c.students > 0 ? Math.round((c.placed / c.students) * 100) : 0}%</td>
                <td>
                  <span className={`badge badge-dot ${c.active ? 'badge-green' : 'badge-gray'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <StandardTableIconAction action="view" onClick={() => openPanel(c.id, 'view')} />
                    <StandardTableIconAction action="edit" onClick={() => openPanel(c.id, 'edit')} />
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && totalCount === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-secondary">
                  {listError || 'No colleges found.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminRecordModal
        title={selectedName}
        mode={panelMode}
        loading={panelLoading}
        saving={saving}
        error={panelError}
        onClose={closePanel}
        onSave={saveCollege}
        footer={
          panelMode === 'view' && detail && !panelLoading && !panelError ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setForm(collegeToForm(detail));
                setPanelMode('edit');
              }}
            >
              Edit college
            </button>
          ) : null
        }
      >
        {panelMode === 'view' && detail ? (
          <div className="text-sm" style={{ lineHeight: 1.6 }}>
            <DetailRow label="College name">{detail.name}</DetailRow>
            <DetailRow label="Location">
              {[detail.city, detail.state].filter(Boolean).join(', ') || '—'}
              {detail.pincode ? ` · ${detail.pincode}` : ''}
            </DetailRow>
            <DetailRow label="Website">
              {detail.website ? <CompanyNameLink name={detail.name} website={detail.website} /> : '—'}
            </DetailRow>
            <DetailRow label="Contact email">{detail.email || '—'}</DetailRow>
            <DetailRow label="Phone">{detail.phone || '—'}</DetailRow>
            <DetailRow label="NAAC">{detail.naac || '—'}</DetailRow>
            <DetailRow label="NIRF rank">{detail.nirfRank != null ? detail.nirfRank : '—'}</DetailRow>
            <DetailRow label="Students / placed">
              {detail.students} students · {detail.placed} placed
            </DetailRow>
            <DetailRow label="Status">{detail.active ? 'Active' : 'Inactive'}</DetailRow>
            <DetailRow label="Primary admin">
              {detail.adminName ? `${detail.adminName} · ` : ''}
              {detail.adminEmail || '—'}
            </DetailRow>
            <DetailRow label="Slug">
              <span className="font-mono text-xs">{detail.slug}</span>
            </DetailRow>
          </div>
        ) : null}

        {panelMode === 'edit' && detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">College name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input className="form-input" value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">NAAC grade</label>
                <input className="form-input" value={form.naac} onChange={(e) => setForm((p) => ({ ...p, naac: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">NIRF rank</label>
                <input className="form-input" type="number" min="1" value={form.nirfRank} onChange={(e) => setForm((p) => ({ ...p, nirfRank: e.target.value }))} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
              <span className="text-sm">College is active on the platform</span>
            </label>
          </div>
        ) : null}
      </AdminRecordModal>
    </div>
  );
}
