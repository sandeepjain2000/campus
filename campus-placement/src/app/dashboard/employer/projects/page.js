'use client';
import { FolderGit2, Plus, Edit, UsersRound } from 'lucide-react';

const mockProjects = [
  { id: 1, title: 'AI-Driven Resume Parser', type: 'Short Project', specialization: 'NLP · LLMs', students: 3, duration: '4 weeks', status: 'In Progress' },
  { id: 2, title: 'Smart Campus Navigation', type: 'Hackathon Project', specialization: 'Mobile · Maps', students: 4, duration: '48 hours', status: 'Completed' },
  { id: 3, title: 'Blockchain for Academic Verif', type: 'Research Project', specialization: 'Distributed systems', students: 2, duration: '12 weeks', status: 'Open' },
];

export default function EmployerProjectsPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderGit2 size={28} className="text-secondary" strokeWidth={1.5} /> Project Engagement
          </h1>
          <p className="text-secondary">Manage short projects and hackathon engagements with colleges</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
            <Plus size={16} /> Post New Project
          </button>
        </div>
      </div>

      <div className="employer-stats-strip" aria-label="Project summary">
        <span>
          <strong>12</strong> active projects
        </span>
        <span>
          <strong>45</strong> student partners
        </span>
        <span>
          <strong>8</strong> completed this year
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {mockProjects.map((proj) => (
          <div key={proj.id} className="employer-project-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
              <span className="font-semibold text-primary" style={{ minWidth: 0 }}>
                {proj.title}
              </span>
              <span className="employer-project-row-meta">
                {proj.type} · <span className="badge badge-indigo">{proj.specialization}</span> · {proj.students} students · {proj.duration} ·{' '}
                <span className={`badge ${proj.status === 'Completed' ? 'badge-success' : proj.status === 'Open' ? 'badge-primary' : 'badge-warning'} badge-dot`}>{proj.status}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                <Edit size={14} style={{ marginRight: '0.25rem' }} /> Edit
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                <UsersRound size={14} style={{ marginRight: '0.25rem' }} /> Team
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
