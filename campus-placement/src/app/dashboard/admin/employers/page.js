'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import {
  COMMON_SORT_OPTIONS,
  EMPLOYER_VERIFIED_FILTER_OPTIONS,
  employerVerifiedFilterFn,
} from '@/lib/tableQueryPresets';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';
import AdminRecordModal from '@/components/admin/AdminRecordModal';
import CompanyNameLink from '@/components/CompanyNameLink';
import { useToast } from '@/components/ToastProvider';

function employerToForm(e) {
  return {
    name: e?.name || '',
    industry: e?.industry || '',
    website: e?.website || '',
    headquarters: e?.headquarters || '',
    contactPerson: e?.contactPerson || '',
    contactEmail: e?.contactEmail || '',
    contactPhone: e?.contactPhone || '',
    verified: Boolean(e?.verified),
    blacklisted: Boolean(e?.blacklisted),
    blacklistReason: e?.blacklistReason || '',
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

export default function AdminEmployersPage() {
  const { addToast } = useToast();
  const [employers, setEmployers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [panelMode, setPanelMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(employerToForm(null));
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEmployers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/employers');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load employers');
      setEmployers(Array.isArray(json.employers) ? json.employers : []);
      setListError('');
    } catch (e) {
      setListError(e.message || 'Failed to load employers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployers();
  }, [loadEmployers]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered: displayEmployers,
    filteredCount,
    totalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(employers, {
    getSearchText: (e) => [e.name, e.industry].filter(Boolean).join(' '),
    filterFn: employerVerifiedFilterFn,
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
      const res = await fetch(`/api/admin/employers/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load employer');
      setDetail(json.employer);
      if (mode === 'edit') setForm(employerToForm(json.employer));
    } catch (e) {
      setPanelError(e.message || 'Failed to load employer');
    } finally {
      setPanelLoading(false);
    }
  };

  const saveEmployer = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employers/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save employer');
      addToast('Employer updated', 'success');
      setDetail(json.employer);
      setEmployers((prev) =>
        prev.map((e) =>
          e.id === json.employer.id
            ? {
                ...e,
                name: json.employer.name,
                website: json.employer.website,
                industry: json.employer.industry || '—',
                verified: json.employer.verified,
                blacklisted: json.employer.blacklisted,
              }
            : e,
        ),
      );
      setPanelMode('view');
    } catch (e) {
      addToast(e.message || 'Failed to save employer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExportRows = () => {
    const headers = ['Company', 'Industry', 'Total Hires', 'Verified'];
    const rowsList = employers.map((e) => [
      e.name,
      e.industry,
      String(e.hires),
      e.verified ? 'Yes' : 'No',
    ]);
    return { headers, rows: rowsList };
  };

  const selectedName = detail?.name || employers.find((e) => e.id === selectedId)?.name || 'Employer';

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏢 Manage Employers</h1>
          <p>All registered employers on the platform</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Link className="btn btn-secondary" href="/dashboard/admin/pending-registrations">
            Onboard colleges & employers
          </Link>
          <ExportCsvSplitButton
            filenameBase="admin_employers"
            currentCount={displayEmployers.length}
            fullCount={employers.length}
            getRows={getExportRows}
          />
        </div>
      </div>

      {!isLoading && totalCount > 0 ? (
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search company or industry…"
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={EMPLOYER_VERIFIED_FILTER_OPTIONS}
          filterLabel="Verification"
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
              <th>Company</th>
              <th>Industry</th>
              <th>Total Hires</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayEmployers.length === 0 && totalCount > 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary">
                  No employers match your search or filters.
                </td>
              </tr>
            ) : null}
            {displayEmployers.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold">
                  <CompanyNameLink name={e.name} website={e.website} />
                </td>
                <td>{e.industry}</td>
                <td>{e.hires}</td>
                <td>
                  {e.blacklisted ? (
                    <span className="badge badge-red">Blocked</span>
                  ) : e.verified ? (
                    <span className="badge badge-green">✅ Verified</span>
                  ) : (
                    <span className="badge badge-amber">Pending</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <StandardTableIconAction action="view" onClick={() => openPanel(e.id, 'view')} />
                    <StandardTableIconAction action="edit" onClick={() => openPanel(e.id, 'edit')} />
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && totalCount === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary">
                  {listError || 'No employers found.'}
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
        onSave={saveEmployer}
        footer={
          panelMode === 'view' && detail && !panelLoading && !panelError ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setForm(employerToForm(detail));
                setPanelMode('edit');
              }}
            >
              Edit employer
            </button>
          ) : null
        }
      >
        {panelMode === 'view' && detail ? (
          <div className="text-sm" style={{ lineHeight: 1.6 }}>
            <DetailRow label="Company">
              <CompanyNameLink name={detail.name} website={detail.website} />
            </DetailRow>
            <DetailRow label="Industry">{detail.industry || '—'}</DetailRow>
            <DetailRow label="Headquarters">{detail.headquarters || '—'}</DetailRow>
            <DetailRow label="Contact">{detail.contactPerson || '—'}</DetailRow>
            <DetailRow label="Contact email">{detail.contactEmail || '—'}</DetailRow>
            <DetailRow label="Contact phone">{detail.contactPhone || '—'}</DetailRow>
            <DetailRow label="Account login">{detail.accountEmail || '—'}</DetailRow>
            <DetailRow label="Account holder">{detail.accountName || '—'}</DetailRow>
            <DetailRow label="Total hires">{detail.hires}</DetailRow>
            <DetailRow label="Verified">{detail.verified ? 'Yes' : 'No'}</DetailRow>
            <DetailRow label="Blocked">{detail.blacklisted ? detail.blacklistReason || 'Yes' : 'No'}</DetailRow>
            <DetailRow label="Account status">{detail.accountActive ? 'Active' : 'Inactive'}</DetailRow>
          </div>
        ) : null}

        {panelMode === 'edit' && detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Company name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="form-group">
              <label className="form-label">Headquarters</label>
              <input className="form-input" value={form.headquarters} onChange={(e) => setForm((p) => ({ ...p, headquarters: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact person</label>
              <input className="form-input" value={form.contactPerson} onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact email</label>
              <input className="form-input" type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact phone</label>
              <input className="form-input" value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm((p) => ({ ...p, verified: e.target.checked }))} />
              <span className="text-sm">Mark as verified employer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.blacklisted} onChange={(e) => setForm((p) => ({ ...p, blacklisted: e.target.checked }))} />
              <span className="text-sm">Block employer from campus access</span>
            </label>
            {form.blacklisted ? (
              <div className="form-group">
                <label className="form-label">Block reason</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.blacklistReason}
                  onChange={(e) => setForm((p) => ({ ...p, blacklistReason: e.target.value }))}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminRecordModal>
    </div>
  );
}
