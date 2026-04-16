'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { formatDate, formatStatus, getStatusColor, formatCurrency } from '@/lib/utils';

const placementDrives = [
  { id: '', name: '— Not linked —' },
  { id: 'drv-1', name: 'Campus 2026 · IIT Mumbai (Phase 1)' },
  { id: 'drv-2', name: 'Campus 2026 · NIT Trichy' },
  { id: 'drv-3', name: 'Off-campus requisitions · PAN India' },
];

const mockJobs = [
  { id: 1, title: 'Software Development Engineer', keywords: 'React, TypeScript, Node.js, AWS, REST APIs', type: 'full_time', salaryMin: 1200000, salaryMax: 1800000, status: 'published', vacancies: 15, applications: 45, branches: ['CSE', 'IT'], cgpa: 7.0, createdAt: '2026-08-20', placementDriveId: 'drv-1' },
  { id: 2, title: 'Data Science Intern', keywords: 'Python, SQL, ML fundamentals, Jupyter', type: 'internship', salaryMin: 60000, salaryMax: 80000, status: 'published', vacancies: 5, applications: 22, branches: ['CSE', 'Math'], cgpa: 8.0, createdAt: '2026-08-25', placementDriveId: '' },
  { id: 3, title: 'Product Manager', keywords: 'Roadmapping, Stakeholder management, SQL, Analytics', type: 'full_time', salaryMin: 2000000, salaryMax: 2800000, status: 'draft', vacancies: 3, applications: 0, branches: ['MBA', 'CSE'], cgpa: 7.5, createdAt: '2026-09-05', placementDriveId: 'drv-3' },
  { id: 4, title: 'Frontend Developer', keywords: 'React, CSS, Web performance, Accessibility', type: 'full_time', salaryMin: 1000000, salaryMax: 1500000, status: 'closed', vacancies: 10, applications: 67, branches: ['CSE', 'IT'], cgpa: 6.5, createdAt: '2026-07-15', placementDriveId: 'drv-2' },
];

function driveLabel(id) {
  const d = placementDrives.find((x) => x.id === id);
  return d?.name || '';
}

const TYPE_LABELS = {
  full_time: 'Full-time',
  internship: 'Internship',
  contract: 'Contract',
  ppo: 'PPO',
};

function buildAutoSections({ title, keywords, type, salaryMin, salaryMax, cgpa, vacancies }) {
  const kw = keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const typeLabel = TYPE_LABELS[type] || type;
  const role =
    title.trim().length > 0
      ? `We are hiring a ${title} (${typeLabel}) to own delivery across discovery, implementation, code review, testing, and production support. You will collaborate with product, design, and platform teams to ship reliable user-facing experiences.`
      : 'Enter a job title to generate a role summary.';

  const qualifications =
    cgpa != null && String(cgpa).length
      ? `B.Tech / M.Tech / dual degree (or equivalent) in relevant disciplines; minimum CGPA ${cgpa} on a 10-point scale unless waived by campus policy. Strong problem-solving, communication, and teamwork.`
      : 'B.Tech / M.Tech / dual degree (or equivalent) in relevant disciplines; strong academic record and campus placement eligibility.';

  const skills =
    kw.length > 0
      ? `Core skills we expect: ${kw.join(', ')}. Demonstrable projects, internships, or open-source contributions in these areas are a plus.`
      : 'Add comma-separated keywords above to auto-fill expected skills (e.g. React, Python, SQL).';

  const sm = salaryMin === '' || salaryMin == null ? null : Number(salaryMin);
  const sx = salaryMax === '' || salaryMax == null ? null : Number(salaryMax);
  const compensation =
    sm != null && !Number.isNaN(sm) && sx != null && !Number.isNaN(sx)
      ? `Compensation band: ${formatCurrency(sm)} – ${formatCurrency(sx)} CTC per annum (structure and components per company policy and campus norms). ${vacancies ? `Open headcount: ${vacancies}.` : ''}`
      : 'Set min/max annual compensation (and vacancies) to auto-fill this section.';

  const location =
    type === 'internship'
      ? 'Location: India — internship base as per business unit (hybrid / office days communicated before offer).'
      : 'Location: India — primary hubs Bengaluru / Hyderabad / Pune with hybrid flexibility unless the role is tagged fully remote by HR.';

  return { role, qualifications, skills, compensation, location };
}

function composeJobDescription(sections) {
  return [
    '— Job description (auto-generated from title, keywords, and compensation; edit freely) —',
    '',
    'ROLE',
    sections.role,
    '',
    'QUALIFICATIONS',
    sections.qualifications,
    '',
    'SKILLS',
    sections.skills,
    '',
    'COMPENSATION',
    sections.compensation,
    '',
    'LOCATION',
    sections.location,
  ].join('\n');
}

const emptyForm = {
  title: '',
  keywords: '',
  type: 'full_time',
  salaryMin: '',
  salaryMax: '',
  cgpa: '',
  vacancies: '',
  placementDriveId: '',
  description: '',
};

export default function EmployerJobsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(emptyForm);

  const filtered = mockJobs.filter((j) => !filter || j.status === filter);

  const autoSections = useMemo(() => buildAutoSections(form), [form]);

  useEffect(() => {
    if (!showForm) return;
    setForm((prev) => ({
      ...prev,
      description: composeJobDescription(buildAutoSections(prev)),
    }));
  }, [showForm, form.title, form.keywords, form.type, form.salaryMin, form.salaryMax, form.cgpa, form.vacancies]);

  const openCreate = () => {
    setEditingJob(null);
    setForm({ ...emptyForm, type: 'full_time' });
    setShowForm(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      keywords: job.keywords || '',
      type: job.type,
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      cgpa: job.cgpa ?? '',
      vacancies: job.vacancies ?? '',
      placementDriveId: job.placementDriveId ?? '',
      description: '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingJob(null);
    setForm(emptyForm);
  };

  const setField = useCallback((key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>💼 Job Postings</h1>
          <p>Create and manage your job postings for campus recruitment</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => (showForm ? closeForm() : openCreate())}>
          {showForm ? 'Close form' : '+ Create Job Posting'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">{editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}</h3>
            <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
              ✕ Close
            </button>
          </div>
          <div className="grid grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Target Campuses <span className="required">*</span></label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem',
                  background: 'var(--bg-secondary)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked /> Delhi Technological University (DTU)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> Netaji Subhas University of Technology (NSUT)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> IIT Bombay
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" /> NIT Trichy
                </label>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Keywords (comma-separated)</label>
              <input
                className="form-input"
                placeholder="e.g. React, TypeScript, AWS, System design"
                value={form.keywords}
                onChange={(e) => setField('keywords', e.target.value)}
              />
              <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                Used with the job title to auto-fill <strong>Role</strong>, <strong>Skills</strong>, and the <strong>Job description</strong> below.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Placement drive (optional)</label>
              <select className="form-select" value={form.placementDriveId} onChange={(e) => setField('placementDriveId', e.target.value)}>
                {placementDrives.map((d) => (
                  <option key={d.id || 'none'} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Job Title <span className="required">*</span>
              </label>
              <input className="form-input" placeholder="e.g., Software Development Engineer" value={form.title} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Job Type <span className="required">*</span></label>
              <select className="form-select" value={form.type} onChange={(e) => setField('type', e.target.value)}>
                <option value="full_time">Full Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="ppo">PPO</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Min Salary (Annual)</label>
              <input className="form-input" type="number" placeholder="₹ 800,000" value={form.salaryMin} onChange={(e) => setField('salaryMin', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Salary (Annual)</label>
              <input className="form-input" type="number" placeholder="₹ 1,500,000" value={form.salaryMax} onChange={(e) => setField('salaryMax', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Min CGPA</label>
              <input className="form-input" type="number" step="0.1" min="0" max="10" placeholder="6.0" value={form.cgpa} onChange={(e) => setField('cgpa', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Vacancies</label>
              <input className="form-input" type="number" placeholder="10" value={form.vacancies} onChange={(e) => setField('vacancies', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Auto-filled sections</label>
              <p className="text-xs text-secondary" style={{ margin: '0 0 0.5rem' }}>
                Updates when you change title, keywords, CGPA, compensation, vacancies, or job type.
              </p>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {[
                  { k: 'Role', v: autoSections.role },
                  { k: 'Qualifications', v: autoSections.qualifications },
                  { k: 'Skills', v: autoSections.skills },
                  { k: 'Compensation', v: autoSections.compensation },
                  { k: 'Location', v: autoSections.location },
                ].map((block) => (
                  <div
                    key={block.k}
                    style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div className="text-xs font-bold text-tertiary" style={{ letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                      {block.k}
                    </div>
                    <div className="text-sm" style={{ lineHeight: 1.5 }}>
                      {block.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Job description</label>
              <textarea
                className="form-textarea"
                rows={14}
                placeholder="Description is generated from the fields above…"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" type="button" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
              Save as Draft
            </button>
            <button className="btn btn-primary" type="button" onClick={closeForm}>
              {editingJob ? 'Update Job' : 'Publish Job'}
            </button>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>
          All ({mockJobs.length})
        </button>
        <button className={`tab ${filter === 'published' ? 'active' : ''}`} onClick={() => setFilter('published')}>
          Published
        </button>
        <button className={`tab ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>
          Drafts
        </button>
        <button className={`tab ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>
          Closed
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((job) => (
          <div key={job.id} className="card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{job.title}</h3>
                  <span className={`badge badge-${getStatusColor(job.status)}`}>{formatStatus(job.status)}</span>
                  <span className="badge badge-gray">{formatStatus(job.type)}</span>
                  {job.placementDriveId ? (
                    <span className="badge badge-indigo" title={driveLabel(job.placementDriveId)}>
                      Drive: {driveLabel(job.placementDriveId).replace(/^— Not linked —$/, '—')}
                    </span>
                  ) : (
                    <span className="badge badge-gray">No drive linked</span>
                  )}
                </div>
                {job.keywords ? (
                  <p className="text-xs text-secondary" style={{ margin: '0.25rem 0 0' }}>
                    <span className="text-tertiary">Keywords:</span> {job.keywords}
                  </p>
                ) : null}
                <div className="text-sm text-secondary" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span>
                    💰 {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                  </span>
                  <span>👥 {job.vacancies} vacancies</span>
                  <span>📝 {job.applications} applications</span>
                  <span>🎓 Min CGPA: {job.cgpa}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(job);
                  }}
                >
                  Edit
                </button>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                  View Pipeline
                </button>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {job.branches.map((b) => (
                <span key={b} className="badge badge-indigo">
                  {b}
                </span>
              ))}
              <span className="text-xs text-tertiary" style={{ marginLeft: 'auto' }}>
                Created {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
