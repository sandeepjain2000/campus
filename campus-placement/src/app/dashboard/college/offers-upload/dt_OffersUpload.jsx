'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FileUp, Send } from 'lucide-react';
import { downloadCollegeOffersTemplate } from '@/lib/collegeOffersCsvTemplate';
import { COLLEGE_OFFERS_ALL_STUDENTS_CSV_FILENAME } from '@/lib/offersAssessmentStarterCsv';
import { downloadCsvFromApi } from '@/lib/downloadCsvFromApi';
import { useToast } from '@/components/ToastProvider';

function summarizeCsvErrors(errors) {
  const list = Array.isArray(errors) ? errors : [];
  if (!list.length) return '';
  const groups = new Map();
  for (const e of list) {
    const msg = String(e?.message || 'Unknown error').trim();
    const line = Number(e?.line || 0);
    if (!groups.has(msg)) groups.set(msg, []);
    groups.get(msg).push(line);
  }
  const top = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([msg, lines]) => {
      const preview = lines.slice(0, 3).filter((n) => Number.isFinite(n) && n > 0).join(', ');
      return `${msg} (${lines.length} row${lines.length > 1 ? 's' : ''}${preview ? `, lines: ${preview}` : ''})`;
    });
  return top.join(' | ');
}

export default function CollegeOffersUploadPage() {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const downloadAssessmentStarter = async () => {
    try {
      await downloadCsvFromApi('/api/college/offers/assessment-starter', COLLEGE_OFFERS_ALL_STUDENTS_CSV_FILENAME);
      addToast('Every campus master-list student is included (company from newest assessment when present).', 'success');
    } catch (e) {
      addToast(e.message || 'Download failed', 'error');
    }
  };

  const onUploadCsv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/college/offers/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      const { accepted, errors } = json;
      addToast(
        `Imported ${accepted} row(s).${errors?.length ? ` ${errors.length} issue(s) — see below.` : ''}`,
        accepted ? 'success' : 'warning',
      );
      if (errors?.length) {
        addToast(summarizeCsvErrors(errors), 'error');
      }
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileUp size={28} /> Upload Offers (CSV)
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Bulk-import offers for students on your master list. For the full table and manual edits, open{' '}
            <Link href="/dashboard/college/offers" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>Offers</Link>.
          </p>
        </div>
        <Link href="/dashboard/college/offers" className="btn" style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Send size={16} /> View All Offers
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ marginBottom: '0.75rem' }}>
          Step 1 — Download template
        </h2>
        <p className="text-sm text-secondary" style={{ marginBottom: '1rem', lineHeight: 1.55 }}>
          Columns: <code>roll_number</code>, <code>company_name</code>, <code>job_title</code>, plus optional salary, location, deadline, status.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={downloadCollegeOffersTemplate}>
            Blank template
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadAssessmentStarter}>
            Download Template (All students)
          </button>
        </div>
        <p className="text-xs text-tertiary" style={{ margin: '0.75rem 0 0', lineHeight: 1.5 }}>
          Includes <strong>every</strong> student on your <Link href="/dashboard/college/students">master list</Link> with a roll. <code>company_name</code> is filled from
          the <Link href="/dashboard/college/hiring-assessment">newest assessment upload</Link> when that student appears there; otherwise leave blank and enter manually.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ marginBottom: '0.75rem' }}>
          Step 2 — Upload filled CSV
        </h2>
        <p className="text-sm text-secondary" style={{ marginBottom: '1rem', lineHeight: 1.55 }}>
          Each <strong>roll number</strong> must exist on your <Link href="/dashboard/college/students">Students</Link> screen.
        </p>
        <label className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', margin: 0 }}>
          {uploading ? 'Importing…' : 'Choose CSV file'}
          <input type="file" accept=".csv,text/csv" hidden disabled={uploading} onChange={onUploadCsv} />
        </label>
      </div>

      <div className="directive-panel" role="region" aria-label="Offer import rules">
        <p className="directive-panel__title">After import</p>
        <p className="text-sm text-secondary" style={{ margin: 0, lineHeight: 1.55 }}>
          Students see pending rows on <strong>My Offers</strong> and can accept or decline. Optional status in CSV: pending, accepted, rejected, expired, revoked
          (defaults to pending).
        </p>
      </div>
    </div>
  );
}
