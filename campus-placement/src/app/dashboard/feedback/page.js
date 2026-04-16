'use client';
import { useMemo, useState } from 'react';

const initialItems = [
  { id: 1, title: 'Add drive-wise shortlist export', category: 'Feature Request', status: 'Planned', description: 'Need CSV filtered by company and round.', createdBy: 'College Admin' },
  { id: 2, title: 'Login error message is unclear', category: 'Bug Report', status: 'Under Review', description: 'Users see generic invalid login message for expired credentials.', createdBy: 'Student' },
  { id: 3, title: 'Great improvement in student filters', category: 'General Feedback', status: 'Submitted', description: 'Specialization and diversity fields helped shortlisting.', createdBy: 'Employer' },
];

const categories = ['Feature Request', 'Bug Report', 'General Feedback'];

export default function FeedbackPage() {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Feature Request');

  const counts = useMemo(() => {
    return {
      submitted: items.filter((i) => i.status === 'Submitted').length,
      review: items.filter((i) => i.status === 'Under Review').length,
      planned: items.filter((i) => i.status === 'Planned').length,
    };
  }, [items]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const newItem = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'Submitted',
      createdBy: 'Current User',
    };
    setItems((prev) => [newItem, ...prev]);
    setTitle('');
    setDescription('');
    setCategory('Feature Request');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🧭 Product Feedback Loop</h1>
          <p>Submit Feature Requests, Bug Reports, and General Feedback for continuous improvement.</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <div className="stats-card"><div className="stats-card-value">{counts.submitted}</div><div className="stats-card-label">Submitted</div></div>
        <div className="stats-card amber"><div className="stats-card-value">{counts.review}</div><div className="stats-card-label">Under Review</div></div>
        <div className="stats-card green"><div className="stats-card-value">{counts.planned}</div><div className="stats-card-label">Planned</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Submit Feedback</h3></div>
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="form-input" placeholder="Describe your request or issue..." rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="btn btn-primary" type="submit">Submit</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Public Board</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item) => (
              <div key={item.id} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div className="font-semibold">{item.title}</div>
                  <span className={`badge ${item.status === 'Planned' ? 'badge-green' : item.status === 'Under Review' ? 'badge-amber' : 'badge-gray'}`}>{item.status}</span>
                </div>
                <div className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>{item.description}</div>
                <div className="text-xs text-tertiary" style={{ marginTop: '0.5rem' }}>{item.category} • {item.createdBy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
