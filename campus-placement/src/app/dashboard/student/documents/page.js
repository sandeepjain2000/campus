'use client';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';

const mockDocuments = [
  { id: 1, name: 'Resume_Arjun_Verma_2026.pdf', type: 'resume', size: '245 KB', verified: true, uploadedAt: '2026-08-15' },
  { id: 2, name: 'Aadhaar_Card.pdf', type: 'id_proof', size: '1.2 MB', verified: true, uploadedAt: '2026-08-10' },
  { id: 3, name: '10th_Marksheet.pdf', type: 'academic', size: '890 KB', verified: true, uploadedAt: '2026-08-10' },
  { id: 4, name: '12th_Marksheet.pdf', type: 'academic', size: '920 KB', verified: false, uploadedAt: '2026-08-12' },
  { id: 5, name: 'BTech_Semester_7_Marksheet.pdf', type: 'academic', size: '1.1 MB', verified: false, uploadedAt: '2026-09-01' },
  { id: 6, name: 'AWS_Cloud_Practitioner_Certificate.pdf', type: 'certificate', size: '340 KB', verified: true, uploadedAt: '2026-07-20' },
];

export default function StudentDocumentsPage() {
  const [showUpload, setShowUpload] = useState(false);

  const docTypes = {
    resume: { label: 'Resume', icon: '📄', color: 'indigo' },
    id_proof: { label: 'ID Proof', icon: '🪪', color: 'blue' },
    academic: { label: 'Academic', icon: '🎓', color: 'green' },
    certificate: { label: 'Certificate', icon: '🏆', color: 'amber' },
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📄 My Documents</h1>
          <p>Upload and manage your placement documents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>+ Upload Document</button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px dashed var(--primary-300)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
            <h3>Drag & Drop or Click to Upload</h3>
            <p className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>Supported: PDF, JPG, PNG (Max 5MB)</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <select className="form-select" style={{ width: 'auto' }}>
                <option value="">Document Type</option>
                <option value="resume">Resume</option>
                <option value="id_proof">ID Proof</option>
                <option value="academic">Academic Marksheet</option>
                <option value="certificate">Certificate</option>
              </select>
              <button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Browse Files</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Grid */}
      <div className="grid grid-3">
        {mockDocuments.map(doc => {
          const dtype = docTypes[doc.type] || docTypes.academic;
          return (
            <div key={doc.id} className="card card-hover" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className={`stats-card-icon ${dtype.color}`} style={{ width: 40, height: 40, fontSize: '1.125rem' }}>
                  {dtype.icon}
                </div>
                <span className={`badge badge-${doc.verified ? 'green' : 'amber'}`}>
                  {doc.verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem', wordBreak: 'break-word' }}>{doc.name}</h4>
              <div className="text-xs text-tertiary" style={{ marginBottom: '0.75rem' }}>
                {dtype.label} • {doc.size} • {formatDate(doc.uploadedAt)}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>👁️ View</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>📥 Download</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
