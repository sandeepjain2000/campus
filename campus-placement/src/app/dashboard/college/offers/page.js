'use client';
import useSWR from 'swr';
import { Send } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load offers');
  return json;
};

export default function CollegeOffersPage() {
  const { data, error, isLoading } = useSWR('/api/college/offers', fetcher);
  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const summary = data?.summary || { total: 0, accepted: 0, pending: 0, avgSalary: 0 };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={22} aria-hidden /> Offers
          </h1>
          <p className="text-secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem' }}>
            Campus-wide offer roll-ups with live status, salary, and company details.
          </p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <div className="stats-card"><div className="stats-card-label">Total Offers</div><div className="stats-card-value">{summary.total}</div></div>
        <div className="stats-card green"><div className="stats-card-label">Accepted</div><div className="stats-card-value">{summary.accepted}</div></div>
        <div className="stats-card amber"><div className="stats-card-label">Pending</div><div className="stats-card-value">{summary.pending}</div></div>
        <div className="stats-card blue"><div className="stats-card-label">Avg Accepted Salary</div><div className="stats-card-value">{summary.avgSalary ? formatCurrency(summary.avgSalary) : '—'}</div></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Company</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Location</th>
              <th>Status</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="font-semibold">{offer.student_name}</td>
                <td>{offer.company_name || '—'}</td>
                <td>{offer.job_title || '—'}</td>
                <td>{offer.salary ? formatCurrency(Number(offer.salary)) : '—'}</td>
                <td>{offer.location || '—'}</td>
                <td><span className="badge badge-indigo">{offer.status}</span></td>
                <td>{offer.deadline ? formatDate(offer.deadline) : '—'}</td>
              </tr>
            ))}
            {!isLoading && offers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary">
                  {error?.message || 'No offers available for this campus.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
