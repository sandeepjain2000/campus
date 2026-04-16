'use client';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';

export default function EmployerProfilePage() {
  const [editing, setEditing] = useState(false);
  const profile = {
    companyName: 'TechCorp Solutions',
    industry: 'Information Technology',
    companyType: 'MNC',
    companySize: '10,000+',
    founded: 2005,
    website: 'https://techcorp.com',
    headquarters: 'Bangalore, India',
    locations: ['Bangalore', 'Hyderabad', 'Mumbai', 'Pune'],
    description: 'Leading global technology solutions provider specializing in AI, cloud computing, and enterprise software. We build products used by millions across 50+ countries.',
    contactPerson: 'Anita Desai',
    contactEmail: 'hr@techcorp.com',
    contactPhone: '+91 98765 43210',
    totalHires: 245,
    reliabilityScore: 4.5,
  };

  return (
    <div className="animate-fadeIn">
      <div className="profile-header" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
        <div className="profile-avatar" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EntityLogo
            name={profile.companyName}
            website={profile.website}
            size="xl"
            shape="rounded"
          />
        </div>
        <div className="profile-info" style={{ position: 'relative', zIndex: 1 }}>
          <h2>{profile.companyName}</h2>
          <p>{profile.industry} • {profile.companyType} • Founded {profile.founded}</p>
          <div className="profile-meta">
            <div className="profile-meta-item">📍 {profile.headquarters}</div>
            <div className="profile-meta-item">👥 {profile.companySize} employees</div>
            <div className="profile-meta-item">⭐ {profile.reliabilityScore}/5 Rating</div>
            <div className="profile-meta-item">🎓 {profile.totalHires} Total Hires</div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)} style={{ position: 'relative', zIndex: 1 }}>
          {editing ? '✕ Cancel' : '✏️ Edit'}
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏢 Company Details</h3></div>
          <div className="drive-info-grid">
            <div className="drive-info-item"><div className="drive-info-label">Industry</div><div className="drive-info-value">{profile.industry}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Type</div><div className="drive-info-value">{profile.companyType}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Size</div><div className="drive-info-value">{profile.companySize}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Founded</div><div className="drive-info-value">{profile.founded}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Website</div><div className="drive-info-value"><a href={profile.website}>{profile.website}</a></div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">📞 Contact Information</h3></div>
          <div className="drive-info-grid">
            <div className="drive-info-item"><div className="drive-info-label">Contact Person</div><div className="drive-info-value">{profile.contactPerson}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Email</div><div className="drive-info-value">{profile.contactEmail}</div></div>
            <div className="drive-info-item"><div className="drive-info-label">Phone</div><div className="drive-info-value">{profile.contactPhone}</div></div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><h3 className="card-title">📍 Office Locations</h3></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.locations.map((loc, i) => (
              <span key={i} className="badge badge-blue" style={{ padding: '0.375rem 1rem', fontSize: '0.8125rem' }}>📍 {loc}</span>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><h3 className="card-title">📝 About</h3></div>
          <p className="text-sm" style={{ lineHeight: 1.7 }}>{profile.description}</p>
        </div>
      </div>
    </div>
  );
}
