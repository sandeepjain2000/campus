'use client';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';

// Mock Infrastructure Assets
const assets = [
  { id: 'R1', name: 'Main Auditorium', capacity: 1500, type: 'Event Hall' },
  { id: 'R2', name: 'Computer Lab 1', capacity: 60, type: 'Lab' },
  { id: 'R3', name: 'Computer Lab 2', capacity: 60, type: 'Lab' },
  { id: 'R4', name: 'Conference Room A', capacity: 20, type: 'Meeting Room' },
];

// Mock Existing Bookings
const initialBookings = [
  { id: 1, roomId: 'R1', roomName: 'Main Auditorium', date: '2026-08-20', startTime: '09:00', endTime: '18:00', company: 'Google India', description: 'Day 0 Pre-Placement Talk and Inauguration' },
  { id: 2, roomId: 'R2', roomName: 'Computer Lab 1', date: '2026-08-21', startTime: '10:00', endTime: '13:00', company: 'Microsoft', description: 'Online Coding Assessment for SDE' },
];

export default function CollegeInfrastructurePage() {
  const [bookings, setBookings] = useState(initialBookings);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');

  const checkOverlap = (rId, d, start, end) => {
    return bookings.some(b => {
      if (b.roomId === rId && b.date === d) {
        // Checking overlap in time: New starts before Old ends AND New ends after Old starts
        return (start < b.endTime && end > b.startTime);
      }
      return false;
    });
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (!roomId || !date || !startTime || !endTime || !company) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    if (checkOverlap(roomId, date, startTime, endTime)) {
      setErrorMsg('CLASH DETECTED: This room is already booked during the requested timeframe.');
      return;
    }

    const roomInfo = assets.find(a => a.id === roomId);

    const newBooking = {
      id: Date.now(),
      roomId,
      roomName: roomInfo?.name || 'Unknown Room',
      date,
      startTime,
      endTime,
      company,
      description
    };

    setBookings([...bookings, newBooking].sort((a,b) => new Date(a.date) - new Date(b.date)));
    setShowForm(false);
    setErrorMsg('');
    // Reset
    setRoomId(''); setDate(''); setStartTime(''); setEndTime(''); setCompany(''); setDescription('');
  };

  const handleCancel = (id) => {
    if(confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏛️ Infrastructure & Logistics</h1>
          <p>Book rooms, labs, and auditoriums against specific corporate events.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Creation' : '+ New Booking'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-500)' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Create Infrastructure Booking</h3>
          {errorMsg && <div className="badge badge-amber" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', justifyContent: 'center' }}>⚠️ {errorMsg}</div>}
          
          <form className="grid grid-2" onSubmit={handleBooking}>
            <div className="form-group">
              <label className="form-label">Select Resource <span className="required">*</span></label>
              <select className="form-select" value={roomId} onChange={e => setRoomId(e.target.value)}>
                <option value="" disabled>-- Select a Room/Lab --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} (Capacity: {a.capacity})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Corporate / Event Name <span className="required">*</span></label>
              <input className="form-input" placeholder="e.g. Google India Drive" value={company} onChange={e => setCompany(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="form-group">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Start Time <span className="required">*</span></label>
                  <input className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">End Time <span className="required">*</span></label>
                  <input className="form-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description / Remarks</label>
              <input className="form-input" placeholder="e.g. Need 2 projectors, specific internet access..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Reserve Resource</button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings Calendar / List */}
      <div className="card">
        <h3 className="card-title">Existing Bookings Schedule</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {bookings.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
              <div style={{ flex: '0 0 120px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatDate(b.date)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>{b.startTime} - {b.endTime}</div>
              </div>
              
              <div style={{ flex: 1, paddingLeft: '1.5rem', borderLeft: '3px solid var(--primary-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{b.company}</span>
                  <span className="badge badge-indigo">{b.roomName}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{b.description}</div>
              </div>

              <div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-600)' }} onClick={() => handleCancel(b.id)}>
                  ✕ Cancel Booking
                </button>
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No upcoming bookings scheduled.</p>}
        </div>
      </div>
    </div>
  );
}
