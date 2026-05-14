'use client';
import Link from 'next/link';
import { useState } from 'react';
import MobileHeader from '@/components/mobile/MobileHeader';
import { FileUp, Send, Download, FileText, CheckCircle2 } from 'lucide-react';
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

export default function mb_OffersUpload() {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const downloadAssessmentStarter = async () => {
    try {
      await downloadCsvFromApi('/api/college/offers/assessment-starter', COLLEGE_OFFERS_ALL_STUDENTS_CSV_FILENAME);
      addToast('Template downloaded successfully.', 'success');
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
    <>
      <MobileHeader 
        title="Upload Offers" 
        action={
          <Link href="/dashboard/college/offers" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', color: 'var(--primary-600)' }}>
            <Send size={18} />
          </Link>
        }
      />
      
      <div className="animate-fadeIn" style={{ padding: '1rem 1rem 5rem 1rem' }}>
        
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FileUp size={24} />
          </div>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', fontWeight: 700 }}>Bulk Import Offers</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Upload a CSV to quickly add offers for students on your master list.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>1</div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Download Template</h3>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Required columns: <code style={{ fontSize: '0.75rem' }}>roll_number</code>, <code style={{ fontSize: '0.75rem' }}>company_name</code>, <code style={{ fontSize: '0.75rem' }}>job_title</code>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={downloadCollegeOffersTemplate} style={{ width: '100%', justifyContent: 'center' }}>
              <FileText size={16} style={{ marginRight: '0.5rem' }} /> Blank Template
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadAssessmentStarter} style={{ width: '100%', justifyContent: 'center' }}>
              <Download size={16} style={{ marginRight: '0.5rem' }} /> Pre-filled with all Students
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>2</div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Upload Filled CSV</h3>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ensure all roll numbers exist on your Students list before importing.
          </p>

          <label className="btn btn-primary" style={{ display: 'flex', width: '100%', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer' }}>
            <FileUp size={16} style={{ marginRight: '0.5rem' }} /> {uploading ? 'Importing...' : 'Select CSV File'}
            <input type="file" accept=".csv,text/csv" hidden disabled={uploading} onChange={onUploadCsv} />
          </label>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success-600)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>What happens next?</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Students will see pending offers on their dashboard where they can accept or decline. You can set the status in the CSV manually (pending, accepted, rejected) if they've already decided.
          </p>
        </div>

      </div>
    </>
  );
}
