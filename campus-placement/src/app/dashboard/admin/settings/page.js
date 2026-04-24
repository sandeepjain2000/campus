'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';

const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Asia/Singapore',
  'Asia/Tokyo',
];

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [sessionTimeoutValue, setSessionTimeoutValue] = useState(24);
  const [sessionTimeoutUnit, setSessionTimeoutUnit] = useState('hours');
  const [rememberDeviceValue, setRememberDeviceValue] = useState(14);
  const [rememberDeviceUnit, setRememberDeviceUnit] = useState('days');

  const timezones = useMemo(() => {
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      try {
        const list = Intl.supportedValuesOf('timeZone');
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {
        // ignore and use fallback
      }
    }
    return FALLBACK_TIMEZONES;
  }, []);

  const saveSettings = () => {
    addToast(
      `Saved (prototype): timezone ${timezone}, session timeout ${sessionTimeoutValue} ${sessionTimeoutUnit}, trusted-device window ${rememberDeviceValue} ${rememberDeviceUnit}.`,
      'info',
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>⚙️ Platform Settings</h1>
          <p>Global configuration for PlacementHub</p>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>💾 Save</button>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">🌐 General</h3></div>
          <div className="form-group"><label className="form-label">Platform Name</label><input className="form-input" defaultValue="PlacementHub" /></div>
          <div className="form-group"><label className="form-label">Support Email</label><input className="form-input" defaultValue="support@placementhub.com" /></div>
          <div className="form-group">
            <label className="form-label">Default Timezone</label>
            <select className="form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">🔐 Security</h3></div>
          <div className="form-group"><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Require email verification</label></div>
          <div className="form-group"><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" /> Enable Two-Factor Auth</label></div>
          <div className="form-group">
            <label className="form-label">Session timeout</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                type="number"
                min={1}
                value={sessionTimeoutValue}
                onChange={(e) => setSessionTimeoutValue(Number(e.target.value || 1))}
              />
              <select
                className="form-select"
                value={sessionTimeoutUnit}
                onChange={(e) => setSessionTimeoutUnit(e.target.value)}
                style={{ maxWidth: 160 }}
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
              Prototype meaning: max signed-in session age before forced login.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Trusted device window (for future 2FA)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                type="number"
                min={1}
                value={rememberDeviceValue}
                onChange={(e) => setRememberDeviceValue(Number(e.target.value || 1))}
              />
              <select
                className="form-select"
                value={rememberDeviceUnit}
                onChange={(e) => setRememberDeviceUnit(e.target.value)}
                style={{ maxWidth: 160 }}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
              This will control when a known device should require 2FA again (future behavior).
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📧 Email Configuration</h3></div>
          <div className="form-group"><label className="form-label">SMTP Host</label><input className="form-input" placeholder="smtp.gmail.com" /></div>
          <div className="form-group"><label className="form-label">SMTP Port</label><input className="form-input" type="number" defaultValue={587} /></div>
          <div className="form-group"><label className="form-label">From Email</label><input className="form-input" placeholder="noreply@placementhub.com" /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📦 Storage</h3></div>
          <div className="form-group"><label className="form-label">Storage Provider</label><select className="form-select"><option>Local Filesystem</option><option>AWS S3</option><option>Supabase Storage</option></select></div>
          <div className="form-group"><label className="form-label">Max Upload Size (MB)</label><input className="form-input" type="number" defaultValue={5} /></div>
        </div>
      </div>
    </div>
  );
}
