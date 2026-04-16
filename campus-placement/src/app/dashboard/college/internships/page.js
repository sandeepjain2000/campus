'use client';
import { useState } from 'react';
import { CalendarDays, Download, Plus, Users, Clock, IndianRupee, FileText } from 'lucide-react';

const mockInternships = [
  { id: 1, student: 'Arjun Verma', company: 'Google', stipend: '₹1.0L/mo', duration: '2 Months', status: 'In Progress' },
  { id: 2, student: 'Sneha Iyer', company: 'Microsoft', stipend: '₹80k/mo', duration: '2 Months', status: 'Hiring' },
  { id: 3, student: 'Rohan Patel', company: 'Amazon', stipend: '₹90k/mo', duration: '6 Months', status: 'Completed' },
];

export default function CollegeInternshipsPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarDays size={28} className="text-secondary" strokeWidth={1.5} /> Internship Tracking
          </h1>
          <p className="text-secondary">Track student internship offers and academic credits</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            <Download size={16} /> Export Report
          </button>
          <button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
            <Plus size={16} /> Link New Offer
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stats-card">
          <div className="stats-card-icon indigo"><Users size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">152</div>
          <div className="stats-card-label">Total Interns</div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon green"><Clock size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">84</div>
          <div className="stats-card-label">Ongoing</div>
        </div>
        <div className="stats-card amber">
          <div className="stats-card-icon amber"><IndianRupee size={24} strokeWidth={1.5} /></div>
          <div className="stats-card-value">₹55k</div>
          <div className="stats-card-label">Avg Stipend</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Company</th>
              <th>Stipend</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockInternships.map(intern => (
              <tr key={intern.id}>
                <td className="font-semibold">{intern.student}</td>
                <td className="text-primary">{intern.company}</td>
                <td>{intern.stipend}</td>
                <td>{intern.duration}</td>
                <td>
                  <span className={`badge ${intern.status === 'Completed' ? 'badge-success' : 'badge-primary'} badge-dot`}>
                    {intern.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>
                    <FileText size={14} style={{ marginRight: '0.25rem' }} /> View Agreement
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
