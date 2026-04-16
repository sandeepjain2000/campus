'use client';

export default function AdminSettingsPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><div className="page-header-left"><h1>⚙️ Platform Settings</h1><p>Global configuration for PlacementHub</p></div><button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>💾 Save</button></div>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">🌐 General</h3></div>
          <div className="form-group"><label className="form-label">Platform Name</label><input className="form-input" defaultValue="PlacementHub" /></div>
          <div className="form-group"><label className="form-label">Support Email</label><input className="form-input" defaultValue="support@placementhub.com" /></div>
          <div className="form-group"><label className="form-label">Default Timezone</label><select className="form-select"><option>Asia/Kolkata (IST)</option></select></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">🔐 Security</h3></div>
          <div className="form-group"><label className="form-label" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><input type="checkbox" defaultChecked /> Require email verification</label></div>
          <div className="form-group"><label className="form-label" style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><input type="checkbox" /> Enable Two-Factor Auth</label></div>
          <div className="form-group"><label className="form-label">Session Timeout (hours)</label><input className="form-input" type="number" defaultValue={24} /></div>
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
