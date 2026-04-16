'use client';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';

const mockEmails = [
  { id: 1, sender: 'Placement Cell - Logistics', subject: 'Room Booking Confirmed: Main Auditorium', snippet: 'Your request for Main Auditorium for Day 0 has been confirmed...', time: '10:45 AM', read: false },
  { id: 2, sender: 'System Notifications', subject: 'New Application Received', snippet: 'A student has just applied for Software Development Engineer role.', time: '09:30 AM', read: true },
  { id: 3, sender: 'Placement Committee', subject: 'POC Assignment for Google India', snippet: 'You have been assigned as the Point of Contact for Google India.', time: 'Yesterday', read: true },
  { id: 4, sender: 'Placement Portal', subject: 'Action Required: Deadline Approaching', snippet: 'Reminder: The offer deadline for 3 students expires tomorrow.', time: 'Aug 14', read: true }
];

export default function AlertsEmailPage() {
  const [emails, setEmails] = useState(mockEmails);
  const [openEmailId, setOpenEmailId] = useState(null);

  const handleOpen = (id) => {
    setOpenEmailId(openEmailId === id ? null : id);
    setEmails(emails.map(e => e.id === id ? { ...e, read: true } : e));
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div className="page-header-left">
          <h1>📨 Inbox & Alerts</h1>
          <p>System notifications, event coordination, and alerts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Compose Mock Alert</button>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar Menu */}
        <div style={{ width: '250px', borderRight: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)' }}>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 600 }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            📥 Inbox <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>1</span>
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            ⭐ Starred
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            📤 Sent
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            🗑️ Trash
          </button>
        </div>

        {/* Center Inbox List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {emails.map(email => (
            <div key={email.id} style={{ borderBottom: '1px solid var(--border)' }}>
              
              <div 
                className="hover-bg-secondary"
                onClick={() => handleOpen(email.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer',
                  background: !email.read ? 'white' : 'var(--bg-secondary)',
                  fontWeight: !email.read ? 700 : 400
                }}
              >
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                  <input type="checkbox" onClick={e => e.stopPropagation()} />
                </div>
                <div style={{ width: '40px', display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  ⭐
                </div>
                <div style={{ flex: '0 0 200px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {email.sender}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{email.subject}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {email.snippet}
                  </span>
                </div>
                <div style={{ flex: '0 0 80px', textAlign: 'right', fontSize: '0.8rem', color: !email.read ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  {email.time}
                </div>
              </div>

              {/* Email Expansion Area */}
              {openEmailId === email.id && (
                <div style={{ padding: '2rem 4rem', background: 'var(--card-bg)', borderBottom: '2px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{email.subject}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Reply</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Forward</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="avatar">{getInitials(email.sender)}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{email.sender} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>&lt;alerts@placementhub.edu&gt;</span></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>to me, ccf-admin</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{email.time}</div>
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {email.snippet}{'\n\n'}
                    Log into your dashboard to take action on this alert.
                    {'\n\n'}
                    -- {'\n'}
                    PlacementHub Auto-Mailer
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
