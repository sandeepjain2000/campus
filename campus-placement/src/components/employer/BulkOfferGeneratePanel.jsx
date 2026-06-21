'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { formatDate } from '@/lib/utils';
import { OFFER_TEMPLATE_PLACEHOLDERS } from '@/lib/offerTemplateRender';
import ValidatedNumberInput from '@/components/form/ValidatedNumberInput';
import ValidatedDateInput from '@/components/form/ValidatedDateInput';
import { FIELD_IDS } from '@/lib/inputConstraints';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Request failed');
  return json;
};

export default function BulkOfferGeneratePanel({ drives, templates, onGenerated }) {
  const { addToast } = useToast();
  const [driveId, setDriveId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);

  const previewKey = driveId ? `/api/employer/offers/bulk-preview?driveId=${encodeURIComponent(driveId)}` : null;
  const { data: preview, isLoading: previewLoading, mutate: refreshPreview } = useSWR(previewKey, fetcher);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId],
  );

  const runGenerate = async () => {
    if (!driveId || !templateId) {
      addToast('Choose a placement drive and an offer template.', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/employer/offers/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId, templateId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Generate failed');
      addToast(json.message || 'Offers generated.', json.created > 0 ? 'success' : 'info');
      await refreshPreview();
      if (onGenerated) await onGenerated();
    } catch (e) {
      addToast(e.message || 'Generate failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-200)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700 }}>Generate offers from selections</h3>
          <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55, maxWidth: '52rem' }}>
            After students are marked <strong>selected</strong> on a drive, pick a saved template and run generate. Only
            selections <strong>without an offer yet</strong> are processed — safe to click again when new selections arrive.
            Same CTC and dates for everyone (fixed in the template).
          </p>
        </div>
        <Link href="/dashboard/employer/offer-templates" className="btn btn-secondary btn-sm">
          Manage templates
        </Link>
      </div>

      <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Placement drive</label>
          <select className="form-select" value={driveId} onChange={(e) => setDriveId(e.target.value)}>
            <option value="">Select drive</option>
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
                {d.drive_date ? ` · ${formatDate(d.drive_date)}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Offer template</label>
          <select className="form-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Select template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.jobTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {previewLoading && driveId ? (
        <p className="text-sm text-secondary">Checking selections…</p>
      ) : null}

      {preview && driveId ? (
        <div
          style={{
            padding: '0.875rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          <strong>{preview.drive?.title}</strong>
          <div style={{ marginTop: '0.35rem' }}>
            Selected: <strong>{preview.selectedCount}</strong> · Offers already created:{' '}
            <strong>{preview.offersExistingCount}</strong> ·{' '}
            <span style={{ color: 'var(--primary-700)' }}>
              Ready to generate now: <strong>{preview.readyToGenerateCount}</strong>
            </span>
          </div>
          {preview.readyToGenerateCount > 0 && preview.pendingStudents?.length ? (
            <p className="text-xs text-tertiary" style={{ margin: '0.5rem 0 0' }}>
              Includes:{' '}
              {preview.pendingStudents
                .slice(0, 5)
                .map((s) => s.studentName)
                .join(', ')}
              {preview.pendingStudents.length > 5 ? ` +${preview.pendingStudents.length - 5} more` : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      {selectedTemplate ? (
        <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
          Template CTC is fixed at <strong>₹{Number(selectedTemplate.salary || 0).toLocaleString('en-IN')}</strong> annual
          for every generated offer.
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn-primary"
        disabled={generating || !driveId || !templateId || !templates.length}
        onClick={runGenerate}
      >
        {generating ? 'Generating…' : 'Generate offers & send emails'}
      </button>
    </div>
  );
}

export { OFFER_TEMPLATE_PLACEHOLDERS };
