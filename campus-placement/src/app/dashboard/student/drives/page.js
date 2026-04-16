'use client';
import { useState, useEffect } from 'react';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';

// Generate some dynamic dates relative to today
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const past = new Date(today); past.setDate(today.getDate() - 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

const mockDrives = [
  { id: 1, company: 'TechCorp Solutions', role: 'Software Development Engineer', date: '2026-09-15', type: 'on_campus', salary: '₹12L - ₹18L PA', status: 'scheduled', branch: ['CSE', 'IT'], cgpa: 7.0, vacancies: 15, registered: 45, deadline: tomorrow.toISOString() },
  { id: 2, company: 'GlobalSoft Technologies', role: 'Full Stack Developer', date: '2026-09-22', type: 'virtual', salary: '₹10L - ₹15L PA', status: 'approved', branch: ['CSE', 'IT', 'ECE'], cgpa: 6.5, vacancies: 10, registered: 32, deadline: past.toISOString() },
  { id: 3, company: 'Infosys Limited', role: 'Systems Engineer', date: '2026-10-05', type: 'on_campus', salary: '8L - ₹10L PA', status: 'scheduled', branch: ['CSE', 'ECE', 'ME', 'EE'], cgpa: 6.0, vacancies: 50, registered: 0, deadline: nextWeek.toISOString() },
  { id: 4, company: 'DataVerse Analytics', role: 'Data Analyst', date: '2026-10-12', type: 'virtual', salary: '₹9L - ₹14L PA', status: 'approved', branch: ['CSE', 'IT', 'Math'], cgpa: 7.5, vacancies: 8, registered: 15, deadline: null },
];

function getTimeLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return '< 1h left';
}

export default function StudentDrivesPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [now, setNow] = useState(Date.now());
  
  const [applyingTo, setApplyingTo] = useState(null); // stores drive object
  const [locationPref, setLocationPref] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const openApplyModal = (drive) => {
    setApplyingTo(drive);
    setLocationPref('');
  };

  const confirmApply = async () => {
    if (!applyingTo) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drive_id: applyingTo.id,
          location_preference: locationPref
        })
      });
      if (res.ok) {
        alert('Application submitted successfully!');
      } else {
        alert('Failed to submit application');
      }
    } catch (e) {
      alert('Network error during application');
    } finally {
      setIsSubmitting(false);
      setApplyingTo(null);
    }
  };

  const filteredDrives = mockDrives.filter(d => {
    if (search && !d.company.toLowerCase().includes(search.toLowerCase()) && !d.role.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && d.type !== filterType) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎯 Placement Drives</h1>
          <p>Browse and apply to upcoming campus placement drives</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="table-search" style={{ flex: '1', maxWidth: '350px' }}>
            <input className="form-input" placeholder="🔍 Search by company or role..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="on_campus">On-Campus</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="approved">Approved</option>
          </select>
          <div className="text-sm text-secondary">{filteredDrives.length} drives found</div>
        </div>
      </div>

      {/* Drive Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredDrives.map(drive => {
          const isExpired = drive.deadline ? new Date(drive.deadline) < now : false;
          const timeLeft = getTimeLeft(drive.deadline);
          
          return (
            <div key={drive.id} className={`card card-hover ${isExpired ? 'card-disabled' : ''}`} style={{ cursor: isExpired ? 'default' : 'pointer', opacity: isExpired ? 0.75 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{drive.company}</h3>
                    <span className={`badge badge-${getStatusColor(drive.status)}`}>{formatStatus(drive.status)}</span>
                  </div>
                  <p className="text-sm text-secondary">{drive.role}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className={`btn ${isExpired ? 'btn-outline' : 'btn-primary'} btn-sm`}
                    disabled={isExpired}
                    onClick={() => openApplyModal(drive)}
                  >
                    {isExpired ? 'Application Closed' : 'Apply Now'}
                  </button>
                  {timeLeft && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isExpired ? 'var(--danger-500)' : 'var(--warning-600)' }}>
                      🕒 {isExpired ? 'Deadline Passed' : `Ends in ${timeLeft}`}
                    </div>
                  )}
                </div>
              </div>
              <div className="drive-info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="drive-info-item">
                  <div className="drive-info-label">Date</div>
                  <div className="drive-info-value">{formatDate(drive.date)}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Package</div>
                  <div className="drive-info-value">{drive.salary}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Type</div>
                  <div className="drive-info-value">
                    <span className={`badge badge-${drive.type === 'virtual' ? 'blue' : drive.type === 'hybrid' ? 'amber' : 'indigo'}`}>
                      {drive.type === 'virtual' ? '🌐 Virtual' : drive.type === 'hybrid' ? '🔄 Hybrid' : '🏛️ On-Campus'}
                    </span>
                  </div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Min CGPA</div>
                  <div className="drive-info-value">{drive.cgpa}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Vacancies</div>
                  <div className="drive-info-value">{drive.vacancies}</div>
                </div>
                <div className="drive-info-item">
                  <div className="drive-info-label">Registered</div>
                  <div className="drive-info-value">{drive.registered} students</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {drive.branch.map(b => <span key={b} className="badge badge-gray">{b}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {applyingTo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Apply to {applyingTo.company}
            </h3>
            <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Before completing your application for <strong>{applyingTo.role}</strong>, please provide your preferred work location if the company has multiple offices.
            </p>
            <div className="form-group">
              <label className="form-label">Preferred Location (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="E.g. Bangalore, Remote, Any" 
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setApplyingTo(null)} disabled={isSubmitting}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmApply} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

