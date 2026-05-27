'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import DataTableToolbar from '@/components/DataTableToolbar';
import { useDataTableQuery } from '@/hooks/useDataTableQuery';
import { COMMON_SORT_OPTIONS } from '@/lib/tableQueryPresets';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { AssessmentCsvUploadForm } from '@/components/employer/AssessmentSpreadsheetUploadPanel';
import { isUuid } from '@/lib/tenantContext';
import { toCsvIsoDate } from '@/lib/csvExport';
import { swrFetcher } from '@/lib/fetchJson';

function EmployerAssessmentUploadsContent() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState(null);
  const [showAllUploadErrors, setShowAllUploadErrors] = useState(false);
  const [editorUploadId, setEditorUploadId] = useState(null);
  const [draftRows, setDraftRows] = useState([]);
  const [savingRows, setSavingRows] = useState(false);
  const [addRoll, setAddRoll] = useState('');
  const [addRemarks, setAddRemarks] = useState('');
  const [addingRow, setAddingRow] = useState(false);

  const { data: uploadsData, mutate: mutateUploads, error, isLoading } = useSWR('/api/employer/assessments?limit=20', swrFetcher);
  const {
    data: detailData,
    mutate: mutateDetail,
    isLoading: detailLoading,
    error: detailError,
  } = useSWR(editorUploadId ? `/api/employer/assessments/${editorUploadId}` : null, swrFetcher, {
    revalidateOnFocus: false,
  });

  const rowsSig = useMemo(() => {
    if (!editorUploadId || !detailData?.upload?.id || detailData.upload.id !== editorUploadId || !Array.isArray(detailData.rows)) {
      return '';
    }
    return `${detailData.rows.length}:${detailData.rows.map((r) => r.id).join('|')}`;
  }, [editorUploadId, detailData?.upload?.id, detailData?.rows]);

  useEffect(() => {
    if (!editorUploadId) {
      setDraftRows([]);
      return;
    }
    if (!detailData?.upload?.id || detailData.upload.id !== editorUploadId) {
      setDraftRows([]);
      return;
    }
    if (!Array.isArray(detailData.rows)) return;
    setDraftRows(detailData.rows.map((r) => ({ ...r })));
  }, [editorUploadId, rowsSig, detailData?.upload?.id, detailData?.rows]);

  useEffect(() => {
    const edit = searchParams.get('edit');
    if (edit && isUuid(edit)) {
      setEditorUploadId(edit);
      setAddRoll('');
      setAddRemarks('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      setUploadModalOpen(true);
      router.replace('/dashboard/employer/assessment-uploads', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!uploadModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setUploadModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [uploadModalOpen]);

  const {
    data: auditData,
    error: auditError,
    isLoading: auditLoading,
    mutate: mutateAudit,
  } = useSWR(editorUploadId ? `/api/employer/assessments/${editorUploadId}/audit` : null, swrFetcher, {
    revalidateOnFocus: false,
  });
  const auditEntries = auditData?.entries || [];

  const roundLabels = useMemo(() => {
    const roundsMeta = Array.isArray(detailData?.rounds) ? detailData.rounds : [];
    return [1, 2, 3, 4, 5].map((n) => {
      const hit = roundsMeta.find((x) => Number(x.round_no) === n);
      return hit?.round_label || `Round ${n}`;
    });
  }, [detailData]);

  const patchDraft = (rowId, field, value) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    );
  };

  const saveDraftRows = async () => {
    if (!editorUploadId || draftRows.length === 0) {
      addToast('Nothing to save.', 'warning');
      return;
    }
    setSavingRows(true);
    try {
      const res = await fetch(`/api/employer/assessments/${editorUploadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: draftRows.map((r) => ({
            id: r.id,
            round_1_result: r.round_1_result,
            round_2_result: r.round_2_result,
            round_3_result: r.round_3_result,
            round_4_result: r.round_4_result,
            round_5_result: r.round_5_result,
            remarks: r.remarks,
            candidate_name: r.candidate_name,
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      addToast('Assessment rows saved.', 'success');
      await mutateDetail();
      await mutateUploads();
      await mutateAudit();
    } catch (e) {
      addToast(e.message || 'Save failed', 'error');
    } finally {
      setSavingRows(false);
    }
  };

  const addManualRow = async () => {
    if (!editorUploadId || !addRoll.trim()) {
      addToast('Enter a college roll number.', 'warning');
      return;
    }
    setAddingRow(true);
    try {
      const res = await fetch(`/api/employer/assessments/${editorUploadId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college_roll_no: addRoll.trim(),
          remarks: addRemarks.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not add row');
      addToast(json.created ? 'Student added to this upload.' : 'Student updated in this upload.', 'success');
      setAddRoll('');
      setAddRemarks('');
      await mutateDetail();
      await mutateUploads();
      await mutateAudit();
    } catch (e) {
      addToast(e.message || 'Could not add row', 'error');
    } finally {
      setAddingRow(false);
    }
  };

  const uploads = uploadsData?.uploads || [];
  const {
    search,
    setSearch,
    sort,
    setSort,
    filtered: displayUploads,
    filteredCount,
    totalCount: uploadsTotalCount,
    hasActiveFilters,
    clearFilters,
  } = useDataTableQuery(uploads, {
    getSearchText: (u) => [u.original_file_name, u.drive_id, u.job_id, u.id].filter(Boolean).join(' '),
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: 'date_desc',
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🧪 Assessment Uploads</h1>
          <p>
            <strong>CSV is the primary path:</strong> upload once, then use <strong>View / edit</strong> below to fix typos or adjust outcomes.
            Unsure where things live? See{' '}
            <Link href="/dashboard/employer/assessment-summary" style={{ fontWeight: 600 }}>
              Assessment map
            </Link>
            .{' '}
            <Link href="/dashboard/employer/hiring-assessment" style={{ fontWeight: 600 }}>
              Hiring Assessment
            </Link>{' '}
            is a read-only campus view of these same upload rows (summary + export only).
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <ExportCsvSplitButton
            mode="dual"
            filenameBase="employer_assessment_uploads"
            currentCount={displayUploads.length}
            fullCount={uploads.length}
            getRows={() => ({
              headers: ['id', 'created_at', 'target', 'original_file_name', 'total_rows', 'accepted_rows', 'rejected_rows'],
              rows: uploads.map((u) => [
                u.id,
                toCsvIsoDate(u.created_at),
                u.drive_id ? `drive:${u.drive_id}` : `job:${u.job_id || ''}`,
                u.original_file_name ?? '',
                String(u.total_rows ?? ''),
                String(u.accepted_rows ?? ''),
                String(u.rejected_rows ?? ''),
              ]),
            })}
          />
          <button className="btn btn-secondary" type="button" onClick={() => { window.location.href = '/api/employer/assessments/template'; }}>Download Template</button>
        </div>
      </div>

      <div className="directive-panel" role="region" aria-label="How to use assessment uploads">
        <p className="directive-panel__title">What to do (in order)</p>
        <ol className="directive-steps">
          <li>
            <strong>Click “Open upload &amp; column mapping”</strong> below — in the dialog, choose <strong>drive or job</strong>, set <strong>round display names</strong> next to each{' '}
            <code>round_1</code>…<code>round_5</code> column, attach the CSV, then upload.
          </li>
          <li>
            <strong>Check the upload summary</strong> — accepted vs rejected rows. Fix the sheet and upload again if something failed.
          </li>
          <li>
            <strong>In Upload history, click “View / edit”</strong> — change any result, then <strong>Save changes</strong>. Adding one extra student by roll at the bottom is <strong>optional</strong>.
          </li>
        </ol>
        <p className="directive-hint">
          <Link href="/dashboard/employer/hiring-assessment">Hiring Assessment</Link> mirrors this data per campus for reporting; it does not accept edits — keep
          changing results here.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
          1 · Upload spreadsheet &amp; column mapping
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '0.75rem' }}>
          The <strong>round mapping</strong> table (your labels ↔ <code>round_1</code>…<code>round_5</code>), tenant line, and CSV file picker are in the dialog — this keeps the main page uncluttered.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
          Open upload &amp; column mapping
        </button>
      </div>

      {lastUploadResult && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">Latest upload summary</h3>
          <p>
            Total: <strong>{lastUploadResult.totalRows}</strong> | Accepted: <strong>{lastUploadResult.acceptedRows}</strong> | Rejected:{' '}
            <strong>{lastUploadResult.rejectedRows}</strong>
          </p>
          {Array.isArray(lastUploadResult.errors) && lastUploadResult.errors.length > 0 && (
            <div className="text-sm text-secondary" style={{ marginTop: '0.5rem', maxHeight: 160, overflowY: 'auto' }}>
              {(showAllUploadErrors ? lastUploadResult.errors : lastUploadResult.errors.slice(0, 20)).map((e) => (
                <div key={e}>• {e}</div>
              ))}
              {lastUploadResult.errors.length > 20 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setShowAllUploadErrors((v) => !v)}
                >
                  {showAllUploadErrors ? 'Show less' : `Show all ${lastUploadResult.errors.length} errors`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {uploadModalOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-upload-dialog-title"
            className="card"
            style={{
              maxWidth: 'min(100%, 52rem)',
              width: '100%',
              marginTop: '2vh',
              marginBottom: '2vh',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <h2 id="assessment-upload-dialog-title" className="card-title" style={{ margin: 0 }}>
                1 · Upload spreadsheet &amp; column mapping
              </h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploadModalOpen(false)} aria-label="Close">
                Close
              </button>
            </div>
            <AssessmentCsvUploadForm
              onUploaded={async (json) => {
                setLastUploadResult(json);
                setShowAllUploadErrors(false);
                setUploadModalOpen(false);
                await mutateUploads();
                if (json?.uploadId && isUuid(json.uploadId)) {
                  setEditorUploadId(json.uploadId);
                  setAddRoll('');
                  setAddRemarks('');
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
          2 · Upload history
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
          After a file lands here, use <strong>View / edit</strong> on the right to open the grid — that is the only place to change round results (Hiring Assessment is read-only).
        </p>
        {error && <p style={{ color: 'var(--danger-600)' }}>{error.message}</p>}
        {isLoading ? (
          <div className="skeleton skeleton-card" style={{ height: 180 }} />
        ) : (
          <>
            {uploadsTotalCount > 0 ? (
              <DataTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search file name or target…"
                sort={sort}
                onSortChange={setSort}
                sortOptions={COMMON_SORT_OPTIONS}
                filteredCount={filteredCount}
                totalCount={uploadsTotalCount}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
                style={{ marginBottom: '1rem' }}
              />
            ) : null}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Target</th>
                  <th>File</th>
                  <th>Total</th>
                  <th>Accepted</th>
                  <th>Rejected</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayUploads.length === 0 && uploadsTotalCount > 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary">
                      No uploads match your search.
                    </td>
                  </tr>
                ) : null}
                {displayUploads.map((u) => (
                  <tr key={u.id}>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                    <td>{u.drive_id ? `Drive (${String(u.drive_id).slice(0, 8)}...)` : `Job (${String(u.job_id).slice(0, 8)}...)`}</td>
                    <td>{u.original_file_name}</td>
                    <td>{u.total_rows}</td>
                    <td>{u.accepted_rows}</td>
                    <td>{u.rejected_rows}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditorUploadId(u.id);
                          setAddRoll('');
                          setAddRemarks('');
                        }}
                      >
                        {editorUploadId === u.id ? 'Editing…' : 'View / edit'}
                      </button>
                    </td>
                  </tr>
                ))}
                {uploadsTotalCount === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No uploads yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {editorUploadId && (
        <>
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 className="card-title">3 · Results for this upload — edit &amp; save</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditorUploadId(null)}>
                Close editor
              </button>
              <button type="button" className="btn btn-primary" disabled={savingRows || draftRows.length === 0} onClick={saveDraftRows}>
                {savingRows ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
          {detailError && <p style={{ color: 'var(--danger-600)' }}>{detailError.message}</p>}
          {detailLoading ? (
            <div className="skeleton skeleton-card" style={{ height: 200 }} />
          ) : (
            <>
              <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
                Edit round outcomes below; use the <strong>Remarks</strong> column (far right) for notes — or set <strong>remarks</strong> in your CSV before upload.
                You can add one student by roll at the bottom (optional).
              </p>
              <div className="table-container" style={{ overflowX: 'auto', border: 'none' }}>
                <table className="data-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Account name</th>
                      <th>Candidate (override)</th>
                      {roundLabels.map((label, i) => (
                        <th key={i}>{label}</th>
                      ))}
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftRows.map((r) => (
                      <tr key={r.id}>
                        <td className="font-mono text-sm">{r.roll_number}</td>
                        <td className="text-sm">{r.account_name || '—'}</td>
                        <td>
                          <input
                            className="form-input"
                            style={{ minWidth: 120, fontSize: '0.8rem' }}
                            value={r.candidate_name || ''}
                            onChange={(e) => patchDraft(r.id, 'candidate_name', e.target.value)}
                            placeholder="Optional"
                          />
                        </td>
                        {['round_1_result', 'round_2_result', 'round_3_result', 'round_4_result', 'round_5_result'].map((field) => (
                          <td key={field}>
                            <input
                              className="form-input"
                              style={{ minWidth: 88, fontSize: '0.8rem' }}
                              value={r[field] || ''}
                              onChange={(e) => patchDraft(r.id, field, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>
                          <textarea
                            className="form-input"
                            style={{ minWidth: 160, fontSize: '0.8rem', minHeight: 48 }}
                            value={r.remarks || ''}
                            onChange={(e) => patchDraft(r.id, 'remarks', e.target.value)}
                            rows={2}
                          />
                        </td>
                      </tr>
                    ))}
                    {draftRows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center text-secondary">
                          No accepted rows for this upload yet. Use optional add-by-roll below, or re-upload a CSV with valid rolls.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle, #e5e7eb)' }}>
                <h4 className="text-sm font-semibold" style={{ marginBottom: '0.5rem' }}>
                  Optional: add one student by roll
                </h4>
                <p className="text-xs text-tertiary" style={{ marginBottom: '0.5rem' }}>
                  Same rules as CSV: roll must exist on this upload’s campus. If the student is already in this upload, their row is updated.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: 220 }}
                      placeholder="College roll no."
                      value={addRoll}
                      onChange={(e) => setAddRoll(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" disabled={addingRow} onClick={addManualRow}>
                      {addingRow ? 'Adding…' : 'Add to upload'}
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    style={{ minHeight: 56, fontSize: '0.875rem' }}
                    placeholder="Optional remarks for this student (same as CSV remarks column)"
                    value={addRemarks}
                    onChange={(e) => setAddRemarks(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 className="card-title" style={{ marginBottom: '0.35rem' }}>
            4 · Activity log (audit)
          </h3>
          <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
            CSV uploads, saves from this grid, and manual row adds are recorded here. Campus administrators can see the same events under{' '}
            <strong>Audit Reports</strong> (filter by action <code>ASSESS_CSV</code>, <code>ASSESS_SAVE</code>, or <code>ASSESS_ADD</code>; entity type{' '}
            <code>employer_assessment</code>).
          </p>
          {auditError && <p style={{ color: 'var(--danger-600)' }}>{auditError.message}</p>}
          {auditLoading ? (
            <div className="skeleton skeleton-card" style={{ height: 140 }} />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Summary</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((e) => (
                    <tr key={e.id}>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</td>
                      <td><code className="text-sm">{e.action}</code></td>
                      <td className="text-sm">{e.summary}</td>
                      <td className="text-sm">{(e.actor_name && e.actor_name.trim()) || e.actor_email || '—'}</td>
                    </tr>
                  ))}
                  {auditEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No activity logged yet for this upload.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default function EmployerAssessmentUploadsPage() {
  return (
    <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: 320, marginTop: '1rem' }} />}>
      <EmployerAssessmentUploadsContent />
    </Suspense>
  );
}
