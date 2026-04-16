'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState({
    department: 'Computer Science',
    branch: 'Computer Science & Engineering',
    rollNumber: 'CS2021001',
    batchYear: 2021,
    graduationYear: 2025,
    cgpa: 8.72,
    tenthPercentage: 94.5,
    twelfthPercentage: 91.2,
    gender: 'Male',
    phone: '+91 98765 43210',
    linkedin: 'https://linkedin.com/in/arjunverma',
    github: 'https://github.com/arjunverma',
    bio: 'Passionate about AI/ML and full-stack development. Looking for challenging opportunities in technology.',
    skills: ['Python', 'JavaScript', 'React', 'Machine Learning', 'SQL', 'Node.js', 'Docker'],
    expectedSalaryMin: 1200000,
    expectedSalaryMax: 1800000,
    preferredLocations: ['Bangalore', 'Hyderabad', 'Pune'],
    willingToRelocate: true,
  });

  const handleSave = () => {
    setEditing(false);
    // API call will go here
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
  };

  return (
    <div className="animate-fadeIn">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials(session?.user?.name)}
        </div>
        <div className="profile-info" style={{ position: 'relative', zIndex: 1 }}>
          <h2>{session?.user?.name}</h2>
          <p>{profile.branch} | Batch {profile.batchYear}</p>
          <div className="profile-meta">
            <div className="profile-meta-item">🎓 {profile.rollNumber}</div>
            <div className="profile-meta-item">📊 CGPA: {profile.cgpa}</div>
            <div className="profile-meta-item">📧 {session?.user?.email}</div>
            <div className="profile-meta-item">📱 {profile.phone}</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 1 }}>
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Academic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎓 Academic Information</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item">
              <div className="drive-info-label">Department</div>
              <div className="drive-info-value">{profile.department}</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Branch</div>
              <div className="drive-info-value">{profile.branch}</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">CGPA</div>
              <div className="drive-info-value" style={{ color: profile.cgpa >= 8 ? 'var(--success-600)' : 'var(--text-primary)' }}>
                {profile.cgpa} / 10
              </div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">10th %</div>
              <div className="drive-info-value">{profile.tenthPercentage}%</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">12th %</div>
              <div className="drive-info-value">{profile.twelfthPercentage}%</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Graduation Year</div>
              <div className="drive-info-value">{profile.graduationYear}</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💡 Skills</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.skills.map((skill, i) => (
              <span key={i} className="badge badge-indigo" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {skill}
                {editing && (
                  <button onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.7, fontSize: '0.75rem' }}>✕</button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <form onSubmit={handleAddSkill} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                className="form-input" 
                placeholder="Type skill & press Enter..." 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)}
                style={{ flex: 1, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm">Add</button>
            </form>
          )}
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎯 Placement Preferences</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item">
              <div className="drive-info-label">Expected Salary</div>
              <div className="drive-info-value">₹12L - ₹18L PA</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Preferred Locations</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {profile.preferredLocations.map((loc, i) => (
                  <span key={i} className="badge badge-blue">{loc}</span>
                ))}
              </div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Willing to Relocate</div>
              <div className="drive-info-value">{profile.willingToRelocate ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔗 External Links</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>🔗</span>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem' }}>
                LinkedIn Profile
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>💻</span>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem' }}>
                GitHub Profile
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">📝 About Me</h3>
        </div>
        {editing ? (
          <div>
            <textarea 
              className="form-textarea" 
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              rows={4}
            />
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ lineHeight: 1.7 }}>{profile.bio}</p>
        )}
      </div>
    </div>
  );
}
