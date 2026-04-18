'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { getInitials } from '@/lib/utils';
import {
  defaultStudentProfile,
  loadStudentProfile,
  saveStudentProfile,
} from '@/lib/studentProfileStorage';

const LINK_KINDS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'website', label: 'Website' },
  { value: 'project', label: 'Project / portfolio' },
  { value: 'other', label: 'Other' },
];

function newLinkId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `l-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const email = session?.user?.email || '';
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState(() => defaultStudentProfile(session?.user));

  useEffect(() => {
    if (!email) return;
    setProfile(loadStudentProfile(email, session?.user));
  }, [email, session?.user]);

  const persist = useCallback(
    (next) => {
      setProfile(next);
      if (email) saveStudentProfile(email, next);
    },
    [email]
  );

  const handleSave = () => {
    saveStudentProfile(email, profile);
    setEditing(false);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      persist({ ...profile, skills: [...profile.skills, newSkill.trim()] });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    persist({ ...profile, skills: profile.skills.filter((s) => s !== skillToRemove) });
  };

  const addProfileLink = () => {
    persist({
      ...profile,
      profileLinks: [
        ...profile.profileLinks,
        { id: newLinkId(), kind: 'website', url: '', title: '', description: '' },
      ],
    });
  };

  const updateLink = (id, patch) => {
    persist({
      ...profile,
      profileLinks: profile.profileLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeLink = (id) => {
    persist({ ...profile, profileLinks: profile.profileLinks.filter((l) => l.id !== id) });
  };

  const addPhone = () => {
    persist({
      ...profile,
      phones: [...(profile.phones || []), { label: 'Other', value: '' }],
    });
  };

  const updatePhone = (index, patch) => {
    const phones = [...(profile.phones || [])];
    phones[index] = { ...phones[index], ...patch };
    persist({ ...profile, phones });
  };

  const removePhone = (index) => {
    const phones = [...(profile.phones || [])];
    phones.splice(index, 1);
    persist({ ...profile, phones: phones.length ? phones : [{ label: 'Primary', value: '' }] });
  };

  const addEmailRow = () => {
    persist({
      ...profile,
      emails: [...(profile.emails || []), { label: 'Other', value: '' }],
    });
  };

  const updateEmailRow = (index, patch) => {
    const emails = [...(profile.emails || [])];
    emails[index] = { ...emails[index], ...patch };
    persist({ ...profile, emails });
  };

  const removeEmailRow = (index) => {
    const emails = [...(profile.emails || [])];
    emails.splice(index, 1);
    persist({
      ...profile,
      emails: emails.length ? emails : [{ label: 'College', value: email }],
    });
  };

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string' && dataUrl.length > 1_200_000) {
        alert('Image is too large to store in the browser demo. Choose a smaller file (under ~900KB).');
        return;
      }
      persist({ ...profile, avatarDataUrl: typeof dataUrl === 'string' ? dataUrl : '', avatarName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const onCvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    persist({ ...profile, cvFileName: file.name, cvDataUrl: '' });
  };

  const displayPhones = profile.phones?.length ? profile.phones : [{ label: 'Primary', value: profile.phone || '' }];
  const displayEmails = profile.emails?.length
    ? profile.emails
    : [
        { label: 'College', value: profile.collegeEmail || email },
        { label: 'Personal', value: profile.personalEmail || '' },
      ];

  const locList = (profile.preferredLocations || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="animate-fadeIn">
      <div className="profile-header">
        <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0, background: 'var(--bg-tertiary)' }}>
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(session?.user?.name)
          )}
        </div>
        <div className="profile-info" style={{ position: 'relative', zIndex: 1 }}>
          <h2>{session?.user?.name}</h2>
          <p>
            {profile.branch} | Batch {profile.batchYear}
          </p>
          <div className="profile-meta">
            <div className="profile-meta-item">🎓 {profile.rollNumber}</div>
            <div className="profile-meta-item">📊 CGPA: {profile.cgpa}</div>
            {displayEmails
              .filter((x) => x.value)
              .map((x, i) => (
                <div key={i} className="profile-meta-item">
                  📧 {x.label}: {x.value}
                </div>
              ))}
            {displayPhones
              .filter((x) => x.value)
              .slice(0, 2)
              .map((x, i) => (
                <div key={i} className="profile-meta-item">
                  📱 {x.label}: {x.value}
                </div>
              ))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          {editing && (
            <>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                📷 Photo
                <input type="file" accept="image/*" hidden onChange={onAvatarChange} />
              </label>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                📄 CV / Resume
                <input type="file" accept=".pdf,.doc,.docx" hidden onChange={onCvChange} />
              </label>
            </>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (editing) {
                setProfile(loadStudentProfile(email, session?.user));
                setEditing(false);
              } else setEditing(true);
            }}
          >
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {profile.cvFileName && (
        <p className="text-sm text-secondary" style={{ margin: '-0.5rem 0 1rem' }}>
          Résumé on file: <strong>{profile.cvFileName}</strong> (stored locally in this demo)
        </p>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎓 Academic Information</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item">
              <div className="drive-info-label">Department</div>
              {editing ? (
                <input className="form-input" value={profile.department} onChange={(e) => persist({ ...profile, department: e.target.value })} />
              ) : (
                <div className="drive-info-value">{profile.department}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Branch / Specialisation</div>
              {editing ? (
                <input className="form-input" value={profile.branch} onChange={(e) => persist({ ...profile, branch: e.target.value })} />
              ) : (
                <div className="drive-info-value">{profile.branch}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Roll number</div>
              <div className="drive-info-value" title="Assigned by your college">
                {profile.rollNumber}
                <span className="text-xs text-tertiary" style={{ display: 'block', marginTop: '0.25rem' }}>
                  Set by placement office — not editable
                </span>
              </div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">CGPA</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={profile.cgpa}
                  onChange={(e) => persist({ ...profile, cgpa: parseFloat(e.target.value) || 0 })}
                />
              ) : (
                <div className="drive-info-value" style={{ color: profile.cgpa >= 8 ? 'var(--success-600)' : 'var(--text-primary)' }}>
                  {profile.cgpa} / 10
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">10th %</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={profile.tenthPercentage}
                  onChange={(e) => persist({ ...profile, tenthPercentage: parseFloat(e.target.value) || 0 })}
                />
              ) : (
                <div className="drive-info-value">{profile.tenthPercentage}%</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">12th %</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={profile.twelfthPercentage}
                  onChange={(e) => persist({ ...profile, twelfthPercentage: parseFloat(e.target.value) || 0 })}
                />
              ) : (
                <div className="drive-info-value">{profile.twelfthPercentage}%</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Graduation year</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  value={profile.graduationYear}
                  onChange={(e) => persist({ ...profile, graduationYear: parseInt(e.target.value, 10) || 0 })}
                />
              ) : (
                <div className="drive-info-value">{profile.graduationYear}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Gender</div>
              {editing ? (
                <select className="form-select" value={profile.gender} onChange={(e) => persist({ ...profile, gender: e.target.value })}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              ) : (
                <div className="drive-info-value">{profile.gender}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📇 Contact</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Email addresses
              </div>
              {displayEmails.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  {editing ? (
                    <>
                      <input
                        className="form-input"
                        style={{ maxWidth: '120px' }}
                        placeholder="Label"
                        value={row.label}
                        onChange={(e) => updateEmailRow(i, { label: e.target.value })}
                      />
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        type="email"
                        placeholder="email@example.com"
                        value={row.value}
                        onChange={(e) => updateEmailRow(i, { value: e.target.value })}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEmailRow(i)} aria-label="Remove email">
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-sm">
                      <strong>{row.label}:</strong> {row.value || '—'}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addEmailRow}>
                  + Add email
                </button>
              )}
            </div>
            <div>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Mobile numbers
              </div>
              {displayPhones.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  {editing ? (
                    <>
                      <input
                        className="form-input"
                        style={{ maxWidth: '120px' }}
                        placeholder="Label"
                        value={row.label}
                        onChange={(e) => updatePhone(i, { label: e.target.value })}
                      />
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="+91 …"
                        value={row.value}
                        onChange={(e) => updatePhone(i, { value: e.target.value })}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePhone(i)} aria-label="Remove phone">
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-sm">
                      <strong>{row.label}:</strong> {row.value || '—'}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addPhone}>
                  + Add number
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💡 Skills</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.skills.map((skill, i) => (
              <span
                key={i}
                className="badge badge-indigo"
                style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {skill}
                {editing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 0.7, fontSize: '0.75rem' }}
                  >
                    ✕
                  </button>
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
              <button type="submit" className="btn btn-secondary btn-sm">
                Add
              </button>
            </form>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎯 Placement preferences</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="drive-info-label">Expected salary (₹ / year)</div>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Min"
                    value={profile.expectedSalaryMin}
                    onChange={(e) => persist({ ...profile, expectedSalaryMin: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Max"
                    value={profile.expectedSalaryMax}
                    onChange={(e) => persist({ ...profile, expectedSalaryMax: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ) : (
                <div className="drive-info-value">
                  ₹{(profile.expectedSalaryMin / 100000).toFixed(1)}L – ₹{(profile.expectedSalaryMax / 100000).toFixed(1)}L PA
                </div>
              )}
            </div>
            <div className="drive-info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="drive-info-label">Preferred locations (comma-separated)</div>
              {editing ? (
                <input
                  className="form-input"
                  value={profile.preferredLocations}
                  onChange={(e) => persist({ ...profile, preferredLocations: e.target.value })}
                  placeholder="Bangalore, Hyderabad, Remote…"
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {locList.map((loc, i) => (
                    <span key={i} className="badge badge-blue">
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Willing to relocate</div>
              {editing ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profile.willingToRelocate}
                    onChange={(e) => persist({ ...profile, willingToRelocate: e.target.checked })}
                  />
                  Yes
                </label>
              ) : (
                <div className="drive-info-value">{profile.willingToRelocate ? '✅ Yes' : '❌ No'}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title">🔗 Profiles, projects & websites</h3>
            {editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addProfileLink}>
                + Add link
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profile.profileLinks.length === 0 && <p className="text-sm text-secondary">No links yet. Add LinkedIn, GitHub, a general site, or a demo project.</p>}
            {profile.profileLinks.map((link) => (
              <div key={link.id} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                {editing ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label className="form-label text-xs">Type</label>
                        <select className="form-select" value={link.kind} onChange={(e) => updateLink(link.id, { kind: e.target.value })}>
                          {LINK_KINDS.map((k) => (
                            <option key={k.value} value={k.value}>
                              {k.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-xs">Title / label</label>
                        <input className="form-input" value={link.title} onChange={(e) => updateLink(link.id, { title: e.target.value })} placeholder="e.g. My GitHub" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label text-xs">URL</label>
                        <input className="form-input" value={link.url} onChange={(e) => updateLink(link.id, { url: e.target.value })} placeholder="https://…" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label text-xs">Description</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={link.description}
                          onChange={(e) => updateLink(link.id, { description: e.target.value })}
                          placeholder="What’s on this profile or in this repo? Key projects, stack, etc."
                        />
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLink(link.id)}>
                      Remove link
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div className="text-xs font-bold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {LINK_KINDS.find((k) => k.value === link.kind)?.label || link.kind}
                        </div>
                        <a href={link.url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {link.title || link.url || 'Untitled'}
                        </a>
                        {link.description && <p className="text-sm text-secondary" style={{ margin: '0.35rem 0 0', lineHeight: 1.5 }}>{link.description}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">📝 About me</h3>
        </div>
        {editing ? (
          <div>
            <textarea className="form-textarea" value={profile.bio} onChange={(e) => persist({ ...profile, bio: e.target.value })} rows={4} />
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setProfile(loadStudentProfile(email, session?.user));
                  setEditing(false);
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ lineHeight: 1.7 }}>
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
