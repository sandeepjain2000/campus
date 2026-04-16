'use client';
import { useSession } from 'next-auth/react';

export default function CollegeSettingsPage() {
  const { data: session } = useSession();
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><div className="page-header-left"><h1>🔧 College Settings</h1><p>Manage your institution&apos;s profile and preferences</p></div><button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>💾 Save</button></div>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏫 Institution Details</h3></div>
          <div className="form-group"><label className="form-label">College Name</label><input className="form-input" defaultValue={session?.user?.tenantName || 'Indian Institute of Technology, Mumbai'} /></div>
          <div className="form-group"><label className="form-label">Website</label><input className="form-input" defaultValue="https://iitm.edu" /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue="placement@iitm.edu" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue="+91 22 2572 2545" /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📍 Address</h3></div>
          <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" defaultValue="IIT Mumbai, Powai, Mumbai" rows={3} /></div>
          <div className="form-group"><label className="form-label">City</label><input className="form-input" defaultValue="Mumbai" /></div>
          <div className="form-group"><label className="form-label">State</label><input className="form-input" defaultValue="Maharashtra" /></div>
          <div className="form-group"><label className="form-label">Pincode</label><input className="form-input" defaultValue="400076" /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">🏆 Accreditation</h3></div>
          <div className="form-group"><label className="form-label">Accreditation Body</label><input className="form-input" defaultValue="AICTE" /></div>
          <div className="form-group"><label className="form-label">NAAC Grade</label><select className="form-select" defaultValue="A++"><option>A++</option><option>A+</option><option>A</option><option>B++</option><option>B+</option><option>B</option></select></div>
          <div className="form-group"><label className="form-label">NIRF Rank</label><input className="form-input" type="number" defaultValue={3} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">👤 Placement Officer</h3></div>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" defaultValue={session?.user?.name} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue={session?.user?.email} /></div>
          <div className="form-group"><label className="form-label">Designation</label><input className="form-input" defaultValue="Training & Placement Officer" /></div>
        </div>
      </div>
    </div>
  );
}
