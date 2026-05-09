'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { formatStatus } from '@/lib/utils';

const KIND_LABEL = {
  guest_faculty: 'Guest faculty',
  guest_lecture: 'Guest lecture / session',
};

export default function CollegeGuestEngagementsPage() {
  const { addToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    kind: 'guest_lecture',
    title: '',
    summary: '',
    requirements: '',
    timeHint: '',
    publishNow: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/college/engagement-listings');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setListings(Array.isArray(json.listings) ? json.listings : []);
    } catch (e) {
      addToast(e.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/college/engagement-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: form.kind,
          title: form.title,
          summary: form.summary,
          requirements: form.requirements,
          timeHint: form.timeHint,
          status: form.publishNow ? 'published' : 'draft',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      addToast('Listing saved', 'success');
      setForm({
        kind: 'guest_lecture',
        title: '',
        summary: '',
        requirements: '',
        timeHint: '',
        publishNow: false,
      });
      await load();
    } catch (e2) {
      addToast(e2.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/college/engagement-listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      await load();
    } catch (e) {
      addToast(e.message || 'Failed', 'error');
    }
  };

  const filteredListings = listings.filter((L) => {
    if (kindFilter && L.kind !== kindFilter) return false;
    if (statusFilter && L.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(L.title || '').toLowerCase().includes(q) ||
      String(L.summary || '').toLowerCase().includes(q) ||
      String(L.requirements || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Guest Faculty & Lectures</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>Published posts are visible to employer partners across the platform.</p>
        </div>
        <Link href="/dashboard/college/overview" className="btn" style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
          Overview
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>New listing</h2>
        <form onSubmit={create} style={{ display: 'grid', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
            >
              <option value="guest_lecture">{KIND_LABEL.guest_lecture}</option>
              <option value="guest_faculty">{KIND_LABEL.guest_faculty}</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Summary</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Requirements / expertise needed</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Preferred timing</label>
            <input
              className="form-input"
              placeholder="e.g. March 2026, weekday mornings"
              value={form.timeHint}
              onChange={(e) => setForm({ ...form, timeHint: e.target.value })}
            />
          </div>
          <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm({ ...form, publishNow: e.target.checked })}
            />
            Publish immediately (visible to companies)
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start' }}>
            {saving ? 'Saving…' : 'Save listing'}
          </button>
        </form>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <input
            className="form-input"
            style={{ width: 260 }}
            placeholder="Filter by title/summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input" style={{ width: 220 }} value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="guest_lecture">{KIND_LABEL.guest_lecture}</option>
            <option value="guest_faculty">{KIND_LABEL.guest_faculty}</option>
          </select>
          <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-secondary">
                  Loading…
                </td>
              </tr>
            ) : (
              filteredListings.map((L) => (
                <tr key={L.id}>
                  <td className="font-semibold">{L.title}</td>
                  <td>{KIND_LABEL[L.kind] || L.kind}</td>
                  <td>
                    <span className={`badge badge-${L.status === 'published' ? 'green' : L.status === 'draft' ? 'amber' : 'gray'}`}>
                      {formatStatus(L.status)}
                    </span>
                  </td>
                  <td className="text-sm text-secondary">
                    {L.updated_at ? new Date(L.updated_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {L.status !== 'published' ? (
                      <button type="button" className="btn btn-success btn-sm" onClick={() => setStatus(L.id, 'published')}>
                        Publish
                      </button>
                    ) : null}
                    {L.status === 'published' ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => setStatus(L.id, 'closed')}
                      >
                        Close
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
            {!loading && filteredListings.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary">
                  No listings yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
