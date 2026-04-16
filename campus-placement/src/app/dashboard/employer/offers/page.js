'use client';

import { useCallback } from 'react';
import { formatDate, formatCurrency, formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';

const mockOffers = [
  { id: 1, student: 'Kavya Reddy', college: 'IIT Mumbai', role: 'SDE', salary: 1500000, location: 'Bangalore', status: 'accepted', deadline: '2026-09-25', createdAt: '2026-09-18' },
  { id: 2, student: 'Sneha Iyer', college: 'IIT Mumbai', role: 'SDE', salary: 1600000, location: 'Hyderabad', status: 'pending', deadline: '2026-09-28', createdAt: '2026-09-21' },
  { id: 3, student: 'Priya Nair', college: 'NIT Trichy', role: 'Full Stack Dev', salary: 1200000, location: 'Pune', status: 'rejected', deadline: '2026-09-20', createdAt: '2026-09-13' },
];

export default function EmployerOffersPage() {
  const getOffersCsv = useCallback((_scope) => {
    const list = mockOffers;
    const headers = ['Student', 'College', 'Role', 'Salary_INR', 'Salary_display', 'Location', 'Deadline', 'Status', 'Created'];
    const rows = list.map((o) => [
      o.student,
      o.college,
      o.role,
      String(o.salary),
      formatCurrency(o.salary),
      o.location,
      o.deadline,
      o.status,
      o.createdAt,
    ]);
    return { headers, rows };
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📨 Offers</h1>
          <p>Manage offers extended to candidates</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase="placement_offers"
            currentCount={mockOffers.length}
            fullCount={mockOffers.length}
            getRows={getOffersCsv}
          />
          <button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>+ Create Offer</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stats-card green"><div className="stats-card-icon green">✅</div><div className="stats-card-value">3</div><div className="stats-card-label">Accepted</div></div>
        <div className="stats-card amber"><div className="stats-card-icon amber">⏳</div><div className="stats-card-value">2</div><div className="stats-card-label">Pending</div></div>
        <div className="stats-card rose"><div className="stats-card-icon rose">❌</div><div className="stats-card-value">1</div><div className="stats-card-label">Declined</div></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>College</th><th>Role</th><th>Salary</th><th>Location</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {mockOffers.map(offer => (
              <tr key={offer.id}>
                <td className="font-semibold">{offer.student}</td>
                <td className="text-sm">{offer.college}</td>
                <td>{offer.role}</td>
                <td className="font-bold">{formatCurrency(offer.salary)}</td>
                <td>{offer.location}</td>
                <td className="text-sm">{formatDate(offer.deadline)}</td>
                <td><span className={`badge badge-${getStatusColor(offer.status)} badge-dot`}>{formatStatus(offer.status)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>View</button>
                    {offer.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Revoke</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
