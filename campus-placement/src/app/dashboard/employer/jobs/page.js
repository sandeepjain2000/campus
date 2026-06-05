'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { formatDate, formatStatus, getStatusColor, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { Briefcase, Plus, DollarSign, Users, FileText, GraduationCap, ArrowRight, X, Building2, AlignLeft, CheckCircle2, Ban, LayoutGrid, List } from 'lucide-react';
import ValidatedNumberInput from '@/components/form/ValidatedNumberInput';
import { FIELD_IDS } from '@/lib/inputConstraints';
import { buildDefaultTenantSelection } from '@/lib/defaultTestCampus';
import { formatEmployerMinCgpa, normalizeEmployerMinCgpa } from '@/lib/employerJobDisplay';
import { validateAndResolveEmployerJobSubmit } from '@/lib/employerJobSubmitValidation';
import EmployerCampusTargetPicker from '@/components/employer/EmployerCampusTargetPicker';

const fetcher = (url) => fetch(url).then((r) => r.json());

const TYPE_LABELS = {
  full_time: 'Full-time',
  internship: 'Internship',
  contract: 'Contract',
  ppo: 'PPO',
};

function buildAutoSections({ title, keywords, type, salaryMin, salaryMax, cgpa, vacancies, headquarters }) {
  const kw = keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const typeLabel = TYPE_LABELS[type] || type;
  const role =
    title.trim().length > 0
      ? `We are hiring a ${title} (${typeLabel}) to own delivery across discovery, implementation, code review, testing, and production support. You will collaborate with product, design, and platform teams to ship reliable user-facing experiences.`
      : 'Enter a job title to generate a role summary.';

  const cgpaMin = normalizeEmployerMinCgpa(cgpa);
  const qualifications =
    cgpaMin != null
      ? `B.Tech / M.Tech / dual degree (or equivalent) in relevant disciplines; minimum CGPA ${cgpaMin} on a 10-point scale unless waived by campus policy. Strong problem-solving, communication, and teamwork.`
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

  const hq = headquarters != null ? String(headquarters).trim() : '';
  const location = hq
    ? `Location: anchored at ${hq}. Hybrid, office, or remote arrangements follow company policy and are confirmed during hiring.`
    : type === 'internship'
      ? 'Location: add your company headquarters under Employer Profile to auto-fill this line, or edit manually (internship base / hybrid details).'
      : 'Location: add your company headquarters under Employer Profile to auto-fill this line, or edit manually to match where this role is based.';

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
  description: '',
};

export default function EmployerJobsPage() {
  const { addToast } = useToast();
  const { data: jobData, mutate: mutateJobs } = useSWR('/api/employer/jobs', fetcher, { revalidateOnFocus: true });
  const { data: campusData } = useSWR('/api/employer/campuses', fetcher, { revalidateOnFocus: true });
  const { data: profileData } = useSWR('/api/employer/profile', fetcher, { revalidateOnFocus: true });

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [selectedTenantIds, setSelectedTenantIds] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [closingJobId, setClosingJobId] = useState(null);
  const [viewMode, setViewMode] = useState('card');

  const jobsList = Array.isArray(jobData?.jobs) ? jobData.jobs : [];
  const approvedCampuses = useMemo(
    () => (campusData?.colleges || []).filter((c) => c.approval_status === 'approved'),
    [campusData],
  );

  const filtered = jobsList.filter((j) => !filter || j.status === filter);

  const tabCounts = useMemo(
    () => ({
      all: jobsList.length,
      published: jobsList.filter((j) => j.status === 'published').length,
      draft: jobsList.filter((j) => j.status === 'draft').length,
      closed: jobsList.filter((j) => j.status === 'closed').length,
    }),
    [jobsList],
  );

  const profileHeadquarters = profileData?.profile?.headquarters;

  const autoSections = useMemo(
    () => buildAutoSections({ ...form, headquarters: profileHeadquarters }),
    [form, profileHeadquarters],
  );

  useEffect(() => {
    if (!showModal) return;
    setForm((prev) => ({
      ...prev,
      description: composeJobDescription(buildAutoSections({ ...prev, headquarters: profileHeadquarters })),
    }));
  }, [showModal, form.title, form.keywords, form.type, form.salaryMin, form.salaryMax, form.cgpa, form.vacancies, profileHeadquarters]);

  const openCreate = () => {
    setEditingJob(null);
    setForm({ ...emptyForm, type: 'full_time' });
    setSelectedTenantIds(buildDefaultTenantSelection(approvedCampuses));
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      keywords: job.keywords || '',
      type: job.type,
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      cgpa: normalizeEmployerMinCgpa(job.minCgpa ?? job.cgpa) ?? '',
      vacancies: job.vacancies ?? '',
      description: job.description || '',
    });
    setSelectedTenantIds(buildDefaultTenantSelection(approvedCampuses, job.tenantIds));
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const resetTenantSelection = useCallback(() => {
    setSelectedTenantIds(buildDefaultTenantSelection(approvedCampuses));
  }, [approvedCampuses]);

  const closeModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setForm({ ...emptyForm });
    resetTenantSelection();
    document.body.style.overflow = '';
  };

  const setField = useCallback((key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  const submitJob = async (asDraft) => {
    if (!form.title.trim()) {
      addToast('Job title is required', 'error');
      return;
    }
    const tenantIds = Object.entries(selectedTenantIds)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!asDraft && !tenantIds.length) {
      addToast('Select at least one approved campus so notifications are created for that college.', 'warning');
      return;
    }
    const validated = validateAndResolveEmployerJobSubmit({
      salaryMin: form.salaryMin,
      salaryMax: form.salaryMax,
      minCgpa: form.cgpa,
      vacancies: form.vacancies,
      jobType: form.type,
    });
    if (validated.error) {
      addToast(validated.error, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/jobs', {
        method: editingJob ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob?.id,
          title: form.title.trim(),
          description: form.description,
          jobType: form.type,
          status: asDraft ? 'draft' : 'published',
          salaryMin: form.salaryMin,
          salaryMax: form.salaryMax,
          minCgpa: validated.minCgpa,
          vacancies: form.vacancies,
          keywords: form.keywords,
          tenantIds: asDraft ? [] : tenantIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error || 'Save failed', 'error');
        return;
      }
      addToast(
        editingJob
          ? 'Job updated successfully.'
          : asDraft
            ? 'Draft saved to the database (no alerts sent).'
            : 'Job published. College admins were notified one-by-one; internship posts also notify students per campus.',
        'success',
      );
      closeModal();
      mutateJobs();
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const closePublishedJob = async (job) => {
    if (!job?.id) return;
    setClosingJobId(job.id);
    try {
      const res = await fetch('/api/employer/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', id: job.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(json.error || 'Could not close job', 'error');
        return;
      }
      addToast('Job posting closed. It will stay visible under Closed for your records.', 'success');
      mutateJobs();
    } catch {
      addToast('Network error', 'error');
    } finally {
      setClosingJobId(null);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* High-Fidelity Glassmorphic Hero Banner */}
      <div 
        style={{
          position: 'relative',
          background: 'var(--banner-gradient)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: 'white',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Decorative Elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Job Postings
            {jobsList.length > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                {jobsList.length} Total
              </span>
            )}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            Publish jobs to notify college admins and attract candidates across your campus partnerships.
          </p>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn banner-cta-solid" type="button" onClick={openCreate} style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Create Job
          </button>
        </div>
      </div>

      {/* Filter Tabs + View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { id: '', label: `All Jobs (${tabCounts.all})` },
            { id: 'published', label: `Published (${tabCounts.published})` },
            { id: 'draft', label: `Drafts (${tabCounts.draft})` },
            { id: 'closed', label: `Closed (${tabCounts.closed})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: filter === t.id ? 'var(--primary-600)' : 'var(--bg-secondary)',
                color: filter === t.id ? 'white' : 'var(--text-secondary)',
                boxShadow: filter === t.id ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid var(--border-default)' }}>
          {[{ mode: 'card', icon: LayoutGrid, label: 'Card view' }, { mode: 'list', icon: List, label: 'List view' }].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              title={label}
              aria-label={label}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.85rem', borderRadius: '7px', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                transition: 'all 0.15s ease',
                background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === mode ? 'var(--primary-600)' : 'var(--text-tertiary)',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon size={15} />
              <span style={{ display: 'none' }}>{label}</span>
              {mode === 'card' ? 'Cards' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card View ── */}
      {viewMode === 'card' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((job) => (
            <div key={job.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>{job.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className={`badge badge-${getStatusColor(job.status)}`} style={{ padding: '0.2rem 0.5rem' }}>{formatStatus(job.status)}</span>
                    <span className="badge badge-gray" style={{ padding: '0.2rem 0.5rem' }}>{formatStatus(job.type)}</span>
                  </div>
                </div>
                <div style={{ background: 'var(--primary-50)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Briefcase size={20} className="text-primary-600" />
                </div>
              </div>
              {job.keywords ? (
                <p className="text-xs" style={{ margin: '0 0 1rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  <span className="font-semibold text-tertiary">Keywords:</span> {job.keywords}
                </p>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', padding: '1rem 0', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <DollarSign size={14} style={{ color: 'var(--text-tertiary)' }} />
                    {job.salaryMin != null && job.salaryMax != null ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}` : 'Salary TBD'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                    {job.vacancies} vacancies
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <GraduationCap size={14} style={{ color: 'var(--text-tertiary)' }} />
                    Min CGPA: {formatEmployerMinCgpa(job.minCgpa ?? job.cgpa)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600, background: 'var(--primary-50)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
                    <FileText size={14} />
                    {job.applications} Apps
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem' }} onClick={(e) => { e.stopPropagation(); handleEdit(job); }}>Edit Job</button>
                  <a className="btn btn-primary" href={`/dashboard/employer/applications?tab=jobs&jobId=${job.id}`} style={{ flex: 1, padding: '0.6rem', textAlign: 'center' }}>View Pipeline</a>
                </div>
                {job.status === 'published' && (
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }} disabled={closingJobId === job.id} onClick={(e) => { e.stopPropagation(); void closePublishedJob(job); }}>
                    <Ban size={16} aria-hidden />{closingJobId === job.id ? 'Closing…' : 'Close posting'}
                  </button>
                )}
              </div>
              <div className="text-xs text-tertiary" style={{ textAlign: 'center', marginTop: '1rem' }}>Created {job.createdAt ? formatDate(job.createdAt) : '—'}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)' }}>
              <Briefcase size={48} className="text-tertiary" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Jobs Found</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>There are no job postings matching the current filter.</p>
            </div>
          )}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.7fr 1.1fr 0.6fr 0.6fr 0.5fr auto', gap: '0', background: 'var(--bg-secondary)', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-default)' }}>
            {['Job Title', 'Type', 'Status', 'Salary', 'Vacancies', 'CGPA', 'Apps', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Briefcase size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block', color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>No jobs match this filter.</p>
            </div>
          )}

          {filtered.map((job, idx) => (
            <div
              key={job.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.7fr 0.7fr 1.1fr 0.6fr 0.6fr 0.5fr auto',
                gap: '0',
                alignItems: 'center',
                padding: '0.9rem 1.25rem',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-default)' : 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Title + keywords */}
              <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                {job.keywords && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.keywords}</div>
                )}
              </div>

              {/* Type */}
              <span className="badge badge-gray" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{formatStatus(job.type)}</span>

              {/* Status */}
              <span className={`badge badge-${getStatusColor(job.status)}`} style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{formatStatus(job.status)}</span>

              {/* Salary */}
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {job.salaryMin != null && job.salaryMax != null ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}` : '—'}
              </span>

              {/* Vacancies */}
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Users size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />{job.vacancies ?? '—'}
              </span>

              {/* CGPA */}
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {formatEmployerMinCgpa(job.minCgpa ?? job.cgpa)}
              </span>

              {/* Apps */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-700)', background: 'var(--primary-50)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
                <FileText size={12} />{job.applications}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={(e) => { e.stopPropagation(); handleEdit(job); }}
                >
                  Edit
                </button>
                <a
                  className="btn btn-primary"
                  href={`/dashboard/employer/applications?tab=jobs&jobId=${job.id}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Pipeline <ArrowRight size={13} />
                </a>
                {job.status === 'published' && (
                  <button
                    type="button"
                    title="Close posting"
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.5rem', color: 'var(--text-tertiary)' }}
                    disabled={closingJobId === job.id}
                    onClick={(e) => { e.stopPropagation(); void closePublishedJob(job); }}
                  >
                    <Ban size={15} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Fidelity Job Creation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} onClick={closeModal} />
          
          <div className="animate-slideUp" style={{ position: 'relative', width: '100%', maxWidth: '1200px', maxHeight: '90vh', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--primary-100)', color: 'var(--primary-700)', borderRadius: 'var(--radius-md)' }}>
                  <Briefcase size={20} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h2>
              </div>
              <button onClick={closeModal} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={24} className="text-secondary" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Form Fields Section */}
              <div style={{ flex: '1 1 500px', padding: '2rem', borderRight: '1px solid var(--border-default)' }}>
                <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                  
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <EmployerCampusTargetPicker
                      campuses={approvedCampuses}
                      selection={selectedTenantIds}
                      onSelectionChange={setSelectedTenantIds}
                      label={(
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                          <Building2 size={16} className="text-primary-600" aria-hidden />
                          Target campuses
                        </span>
                      )}
                      required
                      hint="Campuses will receive notifications when this job is published."
                      emptyMessage="No approved campuses yet. Request access from the campus directory first."
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label font-bold">Job Title <span className="required">*</span></label>
                    <input className="form-input" placeholder="e.g. Software Development Engineer" value={form.title} onChange={(e) => setField('title', e.target.value)} style={{ fontSize: '1.1rem', padding: '0.75rem' }} />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label font-bold">Keywords</label>
                    <input className="form-input" placeholder="e.g. React, TypeScript, AWS, System design" value={form.keywords} onChange={(e) => setField('keywords', e.target.value)} />
                    <p className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>Comma-separated keywords drive auto-generation.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Job Type <span className="required">*</span></label>
                    <select className="form-select" value={form.type} onChange={(e) => setField('type', e.target.value)}>
                      <option value="full_time">Full Time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                      <option value="ppo">PPO</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label font-bold">Min Salary (Annual)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>₹</span>
                      <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_SALARY_MIN} placeholder="800,000" value={form.salaryMin} onChange={(v) => setField('salaryMin', v)} className="form-input" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Max Salary (Annual)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>₹</span>
                      <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_SALARY_MAX} context={{ salaryMin: form.salaryMin }} placeholder="1,500,000" value={form.salaryMax} onChange={(v) => setField('salaryMax', v)} className="form-input" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Min CGPA</label>
                    <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_MIN_CGPA} step="0.1" placeholder="6.0" value={form.cgpa} onChange={(v) => setField('cgpa', v)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold">Vacancies</label>
                    <ValidatedNumberInput fieldId={FIELD_IDS.EMPLOYER_VACANCIES} placeholder="10" value={form.vacancies} onChange={(v) => setField('vacancies', v)} />
                  </div>
                </div>
              </div>

              {/* Preview & Editor Section */}
              <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-primary)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <AlignLeft size={18} className="text-secondary" /> Job Description Preview
                  </h3>
                  <p className="text-xs text-secondary" style={{ margin: '0.25rem 0 0' }}>
                    Auto-generated from fields. Edit below to refine.
                  </p>
                </div>
                
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    className="form-textarea"
                    style={{ flex: 1, minHeight: '400px', fontSize: '0.95rem', lineHeight: 1.6, padding: '1.25rem', fontFamily: 'var(--font-mono, monospace)', background: 'var(--bg-primary)' }}
                    placeholder="Description is generated from the fields…"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--bg-primary)' }}>
              <button className="btn btn-ghost" type="button" disabled={submitting} onClick={closeModal} style={{ fontWeight: 600 }}>
                Cancel
              </button>
              <button className="btn btn-secondary" type="button" disabled={submitting} onClick={() => submitJob(true)} style={{ fontWeight: 600 }}>
                Save as Draft
              </button>
              <button className="btn btn-primary" type="button" disabled={submitting} onClick={() => submitJob(false)} style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                {editingJob ? 'Update Published Job' : submitting ? 'Publishing…' : 'Publish Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
