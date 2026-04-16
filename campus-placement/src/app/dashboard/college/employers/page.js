'use client';
import { useState } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import EntityLogo from '@/components/EntityLogo';

const baseCompanies = [
  { name: 'Google', industry: 'IT', type: 'MNC', logo: '🌐' },
  { name: 'TechCorp Solutions', industry: 'IT', type: 'MNC', logo: '💻' },
  { name: 'Infosys Limited', industry: 'IT', type: 'MNC', logo: '🏢' },
  { name: 'DataVerse Analytics', industry: 'Analytics', type: 'Startup', logo: '📊' },
  { name: 'ShadyCorp Inc', industry: 'IT', type: 'Private', logo: '🕵️' },
  { name: 'Microsoft India', industry: 'Software', type: 'MNC', logo: '🪟' },
  { name: 'Amazon', industry: 'E-commerce', type: 'MNC', logo: '📦' },
  { name: 'TCS', industry: 'IT Consulting', type: 'MNC', logo: '🏛️' },
  { name: 'Wipro', industry: 'IT Consulting', type: 'MNC', logo: '🌐' },
  { name: 'FinTech StartupX', industry: 'Finance', type: 'Startup', logo: '💳' },
  { name: 'AutoMobile Corp', industry: 'Manufacturing', type: 'Private', logo: '🚗' },
];

const initialEmployers = baseCompanies.map((c, i) => ({
  id: 100 + i,
  name: c.name,
  industry: c.industry,
  type: c.type,
  hires: Math.floor(Math.random() * 50),
  drives: Math.floor(Math.random() * 5),
  rating: Number((Math.random() * 2 + 3).toFixed(1)),
  status: i === 4 ? 'blacklisted' : Math.random() > 0.3 ? 'approved' : 'pending',
  logo: c.logo
}));

export default function CollegeEmployersPage() {
  const [employers, setEmployers] = useState(initialEmployers);
  const [processingId, setProcessingId] = useState(null);
  const [pocModal, setPocModal] = useState(null);

  const handleRevoke = async (employerId) => {
    if (!confirm('Are you sure you want to block/revoke access for this employer?')) return;
    
    setProcessingId(employerId);
    try {
      const res = await fetch('/api/college/employers/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employer_id: employerId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setEmployers(employers.map(emp => emp.id === employerId ? { ...emp, status: 'blacklisted' } : emp));
        alert('Employer access revoked successfully.');
      } else {
        alert(data.error || 'Failed to revoke employer access.');
      }
    } catch (err) {
      alert('Network error while revoking access.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏢 Manage Employers</h1>
          <p>Approve, track, and manage employer relationships</p>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Sr No.</th>
              <th>Company</th>
              <th>Industry</th>
              <th>Type</th>
              <th>Past Hires</th>
              <th>Drives</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  <div style={{ color: 'var(--text-secondary)' }}>No employers found</div>
                </td>
              </tr>
            ) : employers.map((emp, index) => (
              <tr key={emp.id}>
                <td style={{ color: 'var(--text-tertiary)' }}>{index + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <EntityLogo name={emp.name} size="sm" shape="rounded" />
                    <span className="font-semibold">{emp.name}</span>
                  </div>
                </td>
                <td>{emp.industry}</td>
                <td><span className="badge badge-gray">{emp.type}</span></td>
                <td>{emp.hires}</td>
                <td>{emp.drives}</td>
                <td>{'⭐'.repeat(Math.round(emp.rating))} <span className="text-sm text-tertiary">{emp.rating || '—'}</span></td>
                <td><span className={`badge badge-${getStatusColor(emp.status)} badge-dot`}>{formatStatus(emp.status)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>View</button>
                    {emp.status === 'pending' && <Link href="/dashboard/college/employers/requests" className="btn btn-success btn-sm">Review</Link>}
                    {emp.status === 'approved' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setPocModal(emp)}>POCs</button>
                    )}
                    {emp.status === 'approved' && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--danger-500)' }}
                        onClick={() => handleRevoke(emp.id)}
                        disabled={processingId === emp.id}
                      >
                        {processingId === emp.id ? 'Blocking...' : 'Block'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Mockup */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Showing 1 to {employers.length} of {employers.length} entries
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn-outline btn-sm" disabled>Previous</button>
            <button className="btn btn-primary btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>1</button>
            <button className="btn btn-outline btn-sm" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* POC Assignment Modal */}
      {pocModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fadeIn" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Nominate Coordination POCs</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.5rem' }}>Assign College Staff and Placement Committee members to coordinate with <strong>{pocModal.name}</strong>.</p>
            
            <div className="form-group">
              <label className="form-label">College Staff Nominees</label>
              <select className="form-select" multiple style={{ height: '80px' }}>
                <option value="s1">Dr. Sharma (Computer Science)</option>
                <option value="s2">Prof. Reddy (Electronics)</option>
                <option value="s3">Ms. Iyer (Placement Officer)</option>
              </select>
              <p className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>Hold Ctrl/Cmd to select multiple staff.</p>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Placement Committee Student Nominees</label>
              <select className="form-select" multiple style={{ height: '80px' }}>
                <option value="c1">Rohan Patel (CSE Year 4)</option>
                <option value="c2">Amit Kumar (ME Year 4)</option>
                <option value="c3">Sneha Iyer (IT Year 3)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setPocModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('POCs assigned successfully!'); setPocModal(null); }}>Save Nominations</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
