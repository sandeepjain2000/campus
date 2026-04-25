'use client';

import { useEffect, useState } from 'react';
import {
  IconTwitter,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
} from '@/components/wireframe/SocialWireframeToolkit';

function LabelWithIcon({ Icon, children }) {
  return (
    <span className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ flexShrink: 0, opacity: 0.85, display: 'inline-flex' }} aria-hidden>
        <Icon size={16} />
      </span>
      {children}
    </span>
  );
}

export default function CollegeSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    website: '',
    websiteApi: '',
    social: { twitter: '', facebook: '', instagram: '', linkedin: '' },
    institution: { collegeName: '', email: '', phone: '' },
    address: { address: '', city: '', state: '', pincode: '' },
    accreditation: { body: '', naacGrade: 'A++', nirfRank: '' },
    placementOfficer: { name: '', email: '', designation: 'Training & Placement Officer' },
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/college/settings');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load settings');
        if (!mounted) return;
        setForm({
          website: json.website || '',
          websiteApi: json.websiteApi || '',
          social: json.social || { twitter: '', facebook: '', instagram: '', linkedin: '' },
          institution: json.institution || { collegeName: '', email: '', phone: '' },
          address: json.address || { address: '', city: '', state: '', pincode: '' },
          accreditation: json.accreditation || { body: '', naacGrade: 'A++', nirfRank: '' },
          placementOfficer: json.placementOfficer || { name: '', email: '', designation: 'Training & Placement Officer' },
        });
      } catch (e) {
        if (!mounted) return;
        setMessage(e.message || 'Failed to load settings');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setRoot = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setNested = (root, key, value) =>
    setForm((prev) => ({ ...prev, [root]: { ...prev[root], [key]: value } }));

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/college/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save settings');
      setMessage('Settings saved successfully.');
    } catch (e) {
      setMessage(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn college-settings-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🔧 College Settings</h1>
          <p>Manage your institution&apos;s profile and preferences</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving || loading}>
          {saving ? 'Saving...' : '💾 Save'}
        </button>
      </div>

      {message ? (
        <div className="wireframe-banner" style={{ marginBottom: '1.5rem' }} role="note">
          <span className="badge badge-gray" style={{ flexShrink: 0 }}>Status</span>
          <div>{message}</div>
        </div>
      ) : null}

      <div className="grid grid-2">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title">🌐 Website &amp; social profile URLs</h3>
            <span className="badge badge-green">Live</span>
          </div>
          <p className="text-sm text-secondary" style={{ marginTop: 0 }}>
            Public website, optional API root for integrations, and official college accounts on X (Twitter), Facebook, Instagram, and LinkedIn.
          </p>
          <div className="grid grid-2" style={{ gap: '1rem 1.5rem' }}>
            <div className="form-group college-settings-inline">
              <label className="form-label">Public website URL</label>
              <input className="form-input" type="url" placeholder="https://www.college.edu" value={form.website} onChange={(e) => setRoot('website', e.target.value)} />
            </div>
            <div className="form-group college-settings-inline">
              <label className="form-label">Website API base URL</label>
              <div className="college-settings-field-grow">
                <input className="form-input" type="url" placeholder="https://api.college.edu/v1" value={form.websiteApi} onChange={(e) => setRoot('websiteApi', e.target.value)} />
                <p className="text-xs text-tertiary" style={{ margin: 0 }}>
                  Optional — for CMS, events API, or automation.
                </p>
              </div>
            </div>
            <div className="form-group college-settings-inline">
              <LabelWithIcon Icon={IconTwitter}>Twitter / X URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://twitter.com/your_college or https://x.com/your_college" value={form.social.twitter} onChange={(e) => setNested('social', 'twitter', e.target.value)} />
            </div>
            <div className="form-group college-settings-inline">
              <LabelWithIcon Icon={IconFacebook}>Facebook URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://facebook.com/your.college" value={form.social.facebook} onChange={(e) => setNested('social', 'facebook', e.target.value)} />
            </div>
            <div className="form-group college-settings-inline">
              <LabelWithIcon Icon={IconInstagram}>Instagram URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://instagram.com/your_college" value={form.social.instagram} onChange={(e) => setNested('social', 'instagram', e.target.value)} />
            </div>
            <div className="form-group college-settings-inline">
              <LabelWithIcon Icon={IconLinkedIn}>LinkedIn URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://linkedin.com/school/your-college" value={form.social.linkedin} onChange={(e) => setNested('social', 'linkedin', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏫 Institution Details</h3>
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">College Name</label>
            <input className="form-input" value={form.institution.collegeName} onChange={(e) => setNested('institution', 'collegeName', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.institution.email} onChange={(e) => setNested('institution', 'email', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.institution.phone} onChange={(e) => setNested('institution', 'phone', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📍 Address</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={form.address.address} onChange={(e) => setNested('address', 'address', e.target.value)} rows={3} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">City</label>
            <input className="form-input" value={form.address.city} onChange={(e) => setNested('address', 'city', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">State</label>
            <input className="form-input" value={form.address.state} onChange={(e) => setNested('address', 'state', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Pincode</label>
            <input className="form-input" value={form.address.pincode} onChange={(e) => setNested('address', 'pincode', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Accreditation</h3>
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Accreditation Body</label>
            <input className="form-input" value={form.accreditation.body} onChange={(e) => setNested('accreditation', 'body', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">NAAC Grade</label>
            <select className="form-select" value={form.accreditation.naacGrade} onChange={(e) => setNested('accreditation', 'naacGrade', e.target.value)}>
              <option>A++</option>
              <option>A+</option>
              <option>A</option>
              <option>B++</option>
              <option>B+</option>
              <option>B</option>
            </select>
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">NIRF Rank</label>
            <input className="form-input" type="number" value={form.accreditation.nirfRank} onChange={(e) => setNested('accreditation', 'nirfRank', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👤 Placement Officer</h3>
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.placementOfficer.name} onChange={(e) => setNested('placementOfficer', 'name', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.placementOfficer.email} onChange={(e) => setNested('placementOfficer', 'email', e.target.value)} />
          </div>
          <div className="form-group college-settings-inline">
            <label className="form-label">Designation</label>
            <input className="form-input" value={form.placementOfficer.designation} onChange={(e) => setNested('placementOfficer', 'designation', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
