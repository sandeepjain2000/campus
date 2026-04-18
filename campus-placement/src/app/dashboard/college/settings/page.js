'use client';

import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🔧 College Settings</h1>
          <p>Manage your institution&apos;s profile and preferences</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
          💾 Save
        </button>
      </div>

      <div className="wireframe-banner" style={{ marginBottom: '1.5rem' }} role="note">
        <span className="badge badge-gray" style={{ flexShrink: 0 }}>Wireframe</span>
        <div>
          <strong>Form fields below are static in this demo.</strong>
          {' '}
          Website, website API, and social URLs are not saved to a server until you wire persistence. Scroll down or expand your window — all fields are in the first large card.
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title">🌐 Website &amp; social profile URLs</h3>
            <span className="badge badge-gray">Wireframe</span>
          </div>
          <p className="text-sm text-secondary" style={{ marginTop: 0 }}>
            Public website, optional API root for integrations, and official college accounts on X (Twitter), Facebook, Instagram, and LinkedIn.
          </p>
          <div className="grid grid-2" style={{ gap: '1rem 1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Public website URL</label>
              <input className="form-input" type="url" placeholder="https://www.college.edu" defaultValue="https://iitm.edu" />
            </div>
            <div className="form-group">
              <label className="form-label">Website API base URL</label>
              <input className="form-input" type="url" placeholder="https://api.college.edu/v1" defaultValue="" />
              <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                Optional — for CMS, events API, or automation (not connected in this build).
              </p>
            </div>
            <div className="form-group">
              <LabelWithIcon Icon={IconTwitter}>Twitter / X URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://twitter.com/your_college or https://x.com/your_college" defaultValue="" />
            </div>
            <div className="form-group">
              <LabelWithIcon Icon={IconFacebook}>Facebook URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://facebook.com/your.college" defaultValue="" />
            </div>
            <div className="form-group">
              <LabelWithIcon Icon={IconInstagram}>Instagram URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://instagram.com/your_college" defaultValue="" />
            </div>
            <div className="form-group">
              <LabelWithIcon Icon={IconLinkedIn}>LinkedIn URL</LabelWithIcon>
              <input className="form-input" type="url" placeholder="https://linkedin.com/school/your-college" defaultValue="" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏫 Institution Details</h3>
          </div>
          <div className="form-group">
            <label className="form-label">College Name</label>
            <input className="form-input" defaultValue={session?.user?.tenantName || 'Indian Institute of Technology, Mumbai'} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" defaultValue="placement@iitm.edu" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" defaultValue="+91 22 2572 2545" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📍 Address</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" defaultValue="IIT Mumbai, Powai, Mumbai" rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" defaultValue="Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" defaultValue="Maharashtra" />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-input" defaultValue="400076" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Accreditation</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Accreditation Body</label>
            <input className="form-input" defaultValue="AICTE" />
          </div>
          <div className="form-group">
            <label className="form-label">NAAC Grade</label>
            <select className="form-select" defaultValue="A++">
              <option>A++</option>
              <option>A+</option>
              <option>A</option>
              <option>B++</option>
              <option>B+</option>
              <option>B</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">NIRF Rank</label>
            <input className="form-input" type="number" defaultValue={3} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👤 Placement Officer</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" defaultValue={session?.user?.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" defaultValue={session?.user?.email} />
          </div>
          <div className="form-group">
            <label className="form-label">Designation</label>
            <input className="form-input" defaultValue="Training & Placement Officer" />
          </div>
        </div>
      </div>
    </div>
  );
}
