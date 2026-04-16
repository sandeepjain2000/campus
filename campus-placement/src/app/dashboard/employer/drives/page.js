'use client';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';

const mockDrives = [
  { id: 1, college: 'IIT Mumbai', role: 'SDE', date: '2026-09-15', type: 'on_campus', status: 'scheduled', registered: 45, venue: 'Placement Hall A' },
  { id: 2, college: 'NIT Trichy', role: 'Full Stack Dev', date: '2026-09-22', type: 'virtual', status: 'approved', registered: 32, venue: 'Online (Zoom)' },
  { id: 3, college: 'BITS Pilani', role: 'SDE', date: '2026-10-10', type: 'on_campus', status: 'requested', registered: 0, venue: 'TBD' },
];

export default function EmployerDrivesPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎯 My Drives</h1>
          <p>Track your campus placement drives</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>+ Request New Drive</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mockDrives.map(drive => (
          <div key={drive.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <EntityLogo name={drive.college} size="sm" shape="rounded" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{drive.college}</h3>
                    <span className={`badge badge-${getStatusColor(drive.status)} badge-dot`}>{formatStatus(drive.status)}</span>
                  </div>
                  <p className="text-sm text-secondary">{drive.role}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>View Details →</button>
            </div>
            <div className="drive-info-grid" style={{ marginTop: '0.75rem' }}>
              <div className="drive-info-item"><div className="drive-info-label">Date</div><div className="drive-info-value">{formatDate(drive.date)}</div></div>
              <div className="drive-info-item"><div className="drive-info-label">Type</div><div className="drive-info-value"><span className={`badge badge-${drive.type === 'virtual' ? 'blue' : 'indigo'}`}>{drive.type === 'virtual' ? '🌐 Virtual' : '🏛️ On-Campus'}</span></div></div>
              <div className="drive-info-item"><div className="drive-info-label">Venue</div><div className="drive-info-value">{drive.venue}</div></div>
              <div className="drive-info-item"><div className="drive-info-label">Registered</div><div className="drive-info-value">{drive.registered} students</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
