'use client';
import { useState } from 'react';
import { GraduationCap, Plus, Users, IndianRupee, Activity, FileText, Settings } from 'lucide-react';

const mockInternships = [
  { id: 1, title: 'Summer SDE Intern', college: 'IIT Mumbai', stipend: '₹60,000/mo', duration: '2 Months', status: 'Active', cardClass: '', iconClass: 'indigo' },
  { id: 2, title: 'Data Science Intern', college: 'NIT Trichy', stipend: '₹45,000/mo', duration: '6 Months', status: 'Hiring', cardClass: 'green', iconClass: 'green' },
  { id: 3, title: 'Product Design Intern', college: 'BITS Pilani', stipend: '₹35,000/mo', duration: '3 Months', status: 'Completed', cardClass: 'amber', iconClass: 'amber' },
];

function statusBadgeClass(status) {
  if (status === 'Completed') return 'badge-gray';
  if (status === 'Hiring') return 'badge-success';
  return 'badge-primary';
}

export default function EmployerInternshipsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={28} className="text-secondary" strokeWidth={1.5} /> Internship Programs
          </h1>
          <p className="text-secondary">Hire and manage student interns across different campuses</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Post Internship
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Post New Internship</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <div className="grid grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Target Campuses <span className="required">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked /> Delhi Technological University (DTU)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> Netaji Subhas University of Technology (NSUT)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> IIT Bombay
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> NIT Trichy
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Internship Title <span className="required">*</span></label>
              <input className="form-input" placeholder="e.g., Summer Data Intern" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration <span className="required">*</span></label>
              <select className="form-select">
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stipend (Monthly)</label>
              <input className="form-input" type="number" placeholder="₹ 40,000" />
            </div>
            <div className="form-group">
              <label className="form-label">No. of Openings</label>
              <input className="form-input" type="number" placeholder="5" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowForm(false)}>Publish Internship</button>
          </div>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stats-card">
          <div className="stats-card-icon indigo"><Users size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">28</div>
          <div className="stats-card-label">Current Interns</div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon green"><IndianRupee size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">₹42k</div>
          <div className="stats-card-label">Avg Stipend</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-icon amber"><Activity size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">62%</div>
          <div className="stats-card-label">Conversion Rate</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {mockInternships.map((intern) => (
          <div key={intern.id} className={`stats-card stats-card--oneline ${intern.cardClass}`.trim()}>
            <div className={`stats-card-icon ${intern.iconClass}`}>
              <GraduationCap size={22} strokeWidth={1.5} />
            </div>
            <p className="stats-card-oneline-text">
              <strong>{intern.title}</strong>
              {' · '}
              {intern.college} · {intern.stipend} · {intern.duration} ·{' '}
              <span className={`badge ${statusBadgeClass(intern.status)} badge-dot`}>{intern.status}</span>
            </p>
            <div className="stats-card-oneline-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                <FileText size={14} style={{ marginRight: '0.25rem' }} /> Details
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                <Settings size={14} style={{ marginRight: '0.25rem' }} /> Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="text-sm text-secondary">
          Showing 1 to {mockInternships.length} of {mockInternships.length} entries
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="btn btn-outline btn-sm" disabled>Previous</button>
          <button className="btn btn-primary btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>1</button>
          <button className="btn btn-outline btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
