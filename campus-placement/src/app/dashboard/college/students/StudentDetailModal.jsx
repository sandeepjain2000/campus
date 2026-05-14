'use client';

import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  FileText,
  Folder,
  GraduationCap,
  Languages,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { formatStatus } from '@/lib/utils';

const SECTION_TOTAL = 6;

function list(value) {
  return Array.isArray(value) ? value : [];
}

function present(value) {
  return value !== null && value !== undefined && value !== '';
}

export function getCompletedSectionCount(student) {
  if (student?.sectionCompletion?.completed != null) return student.sectionCompletion.completed;
  const sections = student?.sections || {};
  return [
    student?.email || student?.phone || student?.bio,
    list(sections.education?.records).length || present(student?.cgpa),
    list(sections.skills?.skills).length || list(sections.skills?.languages).length || list(sections.skills?.subjects).length,
    list(sections.projects).length,
    list(sections.documents?.documents).length || sections.documents?.resumeUrl || student?.resumeUrl,
    list(sections.activities?.workExperience).length ||
      list(sections.activities?.responsibilities).length ||
      list(sections.activities?.accomplishments).length ||
      list(sections.activities?.volunteering).length ||
      list(sections.activities?.extracurriculars).length,
  ].filter(Boolean).length;
}

function valueOrDash(value) {
  return present(value) ? value : '—';
}

function formatPercent(value) {
  return present(value) ? `${Number(value).toFixed(2)}%` : '—';
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function formatPeriod(start, end) {
  const from = formatDate(start);
  const to = formatDate(end) || 'Present';
  if (!from && !end) return '';
  return `${from || 'Started'} - ${to}`;
}

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="student-detail-info">
      <div className="student-detail-label">{label}</div>
      <div className="student-detail-value" style={mono ? { fontFamily: 'var(--font-mono, monospace)' } : undefined}>
        {valueOrDash(value)}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="student-section">
      <div className="student-section-header">
        <div className="student-section-icon" aria-hidden="true">
          <Icon size={17} />
        </div>
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function EmptyState({ children = 'No records added yet.' }) {
  return <div className="student-empty-state">{children}</div>;
}

function TagList({ items, tone = 'indigo' }) {
  const values = list(items).filter(Boolean);
  if (!values.length) return <EmptyState>No tags added yet.</EmptyState>;
  return (
    <div className="student-tag-list">
      {values.map((item) => {
        const label = typeof item === 'string' ? item : item.name || item.title;
        const meta = typeof item === 'string' ? '' : item.proficiency;
        return (
          <span key={`${label}-${meta || ''}`} className={`badge badge-${tone}`} style={{ fontSize: '0.75rem' }}>
            {label}
            {meta ? <span style={{ opacity: 0.75, marginLeft: '0.25rem' }}>· {meta}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function VerificationPill({ verified }) {
  return verified ? (
    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
      <CheckCircle2 size={13} /> Verified
    </span>
  ) : (
    <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
      <CircleAlert size={13} /> Pending verification
    </span>
  );
}

function ActivityList({ items, empty }) {
  const rows = list(items);
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="student-list-stack">
      {rows.map((item, index) => (
        <article key={`${item.title || item.organization || 'activity'}-${index}`} className="student-list-row">
          <div>
            <div className="student-list-title">{item.title || item.name || 'Activity'}</div>
            <div className="student-list-meta">
              {[item.organization || item.issuer, item.period || item.year].filter(Boolean).join(' · ')}
            </div>
          </div>
          {item.description && <p>{item.description}</p>}
        </article>
      ))}
    </div>
  );
}

export default function StudentDetailModal({ student, onClose, onVerify }) {
  if (!student) return null;

  const sections = student.sections || {};
  const basic = sections.basic || {};
  const education = sections.education || {};
  const skills = sections.skills || {};
  const documents = sections.documents || {};
  const activities = sections.activities || {};
  const projects = list(sections.projects);
  const completed = getCompletedSectionCount(student);
  const total = student.sectionCompletion?.total || SECTION_TOTAL;
  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profileLinks = [
    { label: 'LinkedIn', value: student.linkedinUrl },
    { label: 'GitHub', value: student.githubUrl },
    { label: 'Portfolio', value: student.portfolioUrl },
    ...list(basic.profileLinks).map((link) => ({ label: link.title || link.kind || 'Link', value: link.url })),
  ].filter((link, index, arr) => link.value && arr.findIndex((other) => other.value === link.value) === index);

  return (
    <div className="modal-overlay" role="presentation" style={{ overflowY: 'auto', alignItems: 'flex-start' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg student-detail-modal" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
        <div className="student-detail-header">
          <div className="student-detail-identity">
            {student.photo ? (
              <img src={student.photo} alt="" width={56} height={56} className="student-detail-avatar" />
            ) : (
              <div className="student-detail-avatar student-detail-avatar-fallback">{initials || 'S'}</div>
            )}
            <div>
              <h2 id="student-detail-title">{student.name}</h2>
              <div className="student-detail-subtitle">{student.roll || student.systemId}</div>
              <div className="student-detail-badges">
                <VerificationPill verified={student.verified} />
                <span className="badge badge-indigo" style={{ fontSize: '0.78rem' }}>
                  Sections {completed}/{total}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="student-detail-close" aria-label="Close student detail">
            <X size={18} />
          </button>
        </div>

        <div className="student-detail-summary" aria-label="Student summary">
          <InfoItem label="Department" value={student.dept} />
          <InfoItem label="CGPA" value={present(student.cgpa) ? Number(student.cgpa).toFixed(2) : '—'} />
          <InfoItem label="Batch" value={student.batchYear} />
          <InfoItem label="Graduation" value={student.graduationYear} />
        </div>

        <div className="modal-body student-detail-body">
          <Section icon={UserRound} title="Basic Details" description="Identity, contact, academic context, and profile links.">
            <div className="student-detail-grid">
              <InfoItem label="System ID" value={student.systemId} mono />
              <InfoItem label="Roll No." value={student.roll} mono />
              <InfoItem label="Enrollment No." value={student.enrollmentNumber} mono />
              <InfoItem label="Institution" value={basic.institutionName} />
              <InfoItem label="Email" value={student.email} />
              <InfoItem
                label="Communication Email"
                value={(student.communicationEmail && String(student.communicationEmail).trim()) || student.email}
              />
              <InfoItem label="Phone" value={student.phone} />
              <InfoItem label="Gender" value={student.gender} />
              <InfoItem label="Category" value={student.diversityCategory} />
              <InfoItem label="Preferred Locations" value={list(student.preferredLocations).join(', ')} />
              <InfoItem label="Relocation" value={student.willingToRelocate ? 'Open to relocate' : 'Not open to relocate'} />
            </div>
            {student.bio && <p className="student-bio">{student.bio}</p>}
            <div className="student-link-row">
              {student.email && <span><Mail size={13} /> {student.email}</span>}
              {student.phone && <span><Phone size={13} /> {student.phone}</span>}
              {list(student.preferredLocations).length > 0 && <span><MapPin size={13} /> {student.preferredLocations.join(', ')}</span>}
              {profileLinks.map((link) => (
                <a key={link.value} href={link.value} target="_blank" rel="noreferrer">
                  <LinkIcon size={13} /> {link.label}
                </a>
              ))}
            </div>
          </Section>

          <Section icon={GraduationCap} title="Education Details" description="Academic records, scores, and backlog status.">
            {list(education.records).length ? (
              <div className="student-list-stack">
                {education.records.map((record, index) => (
                  <article key={`${record.institution}-${record.degree}-${index}`} className="student-list-row">
                    <div>
                      <div className="student-list-title">{record.degree} · {record.fieldOfStudy || 'Field not specified'}</div>
                      <div className="student-list-meta">
                        {[record.institution, [record.startYear, record.endYear].filter(Boolean).join('-'), record.grade].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {record.description && <p>{record.description}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>No education records added yet.</EmptyState>
            )}
            <div className="student-score-table">
              <div className="student-score-row">
                <span>CGPA</span>
                <strong>{present(student.cgpa) ? Number(student.cgpa).toFixed(2) : '—'}</strong>
              </div>
              <div className="student-score-row">
                <span>Class X</span>
                <strong>{formatPercent(student.tenthPercentage)}</strong>
              </div>
              <div className="student-score-row">
                <span>Class XII</span>
                <strong>{formatPercent(student.twelfthPercentage)}</strong>
              </div>
              <div className="student-score-row">
                <span>Active Backlogs</span>
                <strong>{education.backlogs?.active ?? student.backlogsActive ?? 0}</strong>
              </div>
              <div className="student-score-row">
                <span>Total Backlogs</span>
                <strong>{education.backlogs?.total ?? student.backlogsHistory ?? 0}</strong>
              </div>
            </div>
          </Section>

          <Section icon={Languages} title="Skills, Subjects & Languages" description="Technical strengths and communication readiness.">
            <div className="student-subsection-title">Technical Skills</div>
            <TagList items={skills.skills} />
            <div className="student-subsection-title">Languages</div>
            <TagList items={skills.languages} tone="blue" />
            <div className="student-subsection-title">Subjects</div>
            <TagList items={skills.subjects} tone="gray" />
          </Section>

          <Section icon={Folder} title="Projects" description="Student project evidence, timelines, and technical tags.">
            {projects.length ? (
              <div className="student-list-stack">
                {projects.map((project, index) => (
                  <article key={`${project.title}-${index}`} className="student-list-row">
                    <div>
                      <div className="student-list-title">{project.title}</div>
                      <div className="student-list-meta">{formatPeriod(project.startDate, project.endDate)}</div>
                    </div>
                    {project.description && <p>{project.description}</p>}
                    <TagList items={project.techStack} tone="indigo" />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>No projects added yet.</EmptyState>
            )}
          </Section>

          <Section icon={FileText} title="Resume, Documents & Write-ups" description="Resume and document artifacts available in the student profile.">
            <div className="student-list-stack">
              {documents.resumeUrl || student.resumeUrl ? (
                <article className="student-list-row">
                  <div>
                    <div className="student-list-title">Primary Resume</div>
                    <div className="student-list-meta">Available in profile</div>
                  </div>
                </article>
              ) : null}
              {list(documents.documents).map((doc, index) => (
                <article key={`${doc.name}-${index}`} className="student-list-row">
                  <div>
                    <div className="student-list-title">{doc.name}</div>
                    <div className="student-list-meta">
                      {[formatStatus(doc.type), doc.verified ? 'Verified' : 'Pending verification'].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </article>
              ))}
              {!documents.resumeUrl && !student.resumeUrl && !list(documents.documents).length ? (
                <EmptyState>No documents added yet.</EmptyState>
              ) : null}
            </div>
          </Section>

          <Section icon={Briefcase} title="Experience & Activities" description="Work experience, responsibilities, achievements, and campus involvement.">
            <div className="student-activity-grid">
              <div>
                <div className="student-subsection-title"><Briefcase size={14} /> Internship & Work Ex</div>
                <ActivityList items={activities.workExperience} empty="No internship or work experience added yet." />
              </div>
              <div>
                <div className="student-subsection-title"><Users size={14} /> Positions of Responsibility</div>
                <ActivityList items={activities.responsibilities} empty="No positions of responsibility added yet." />
              </div>
              <div>
                <div className="student-subsection-title"><Award size={14} /> Accomplishments</div>
                <ActivityList items={activities.accomplishments} empty="No accomplishments added yet." />
              </div>
              <div>
                <div className="student-subsection-title"><BookOpen size={14} /> Volunteering & Extra-curricular</div>
                <ActivityList items={[...list(activities.volunteering), ...list(activities.extracurriculars)]} empty="No volunteering or extra-curricular activities added yet." />
              </div>
            </div>
          </Section>
        </div>

        <div className="modal-footer student-detail-footer">
          {student.verified ? (
            <button type="button" className="btn btn-ghost" onClick={() => onVerify(student.id, false)}>Clear Verification</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => onVerify(student.id, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> Approve & Verify Student
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>

        <style jsx global>{`
          .student-detail-modal {
            border-radius: var(--radius-xl);
            margin: 2rem auto;
            overflow: hidden;
            max-width: min(1080px, calc(100vw - 2rem));
          }
          .student-detail-header {
            background: var(--primary-900);
            color: white;
            padding: 1.4rem 1.75rem;
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          }
          .student-detail-identity {
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 0;
          }
          .student-detail-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.35);
            flex-shrink: 0;
          }
          .student-detail-avatar-fallback {
            background: rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            font-weight: 800;
          }
          .student-detail-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .student-detail-subtitle {
            margin-top: 0.2rem;
            color: rgba(255,255,255,0.78);
            font-family: var(--font-mono, monospace);
            font-size: 0.85rem;
          }
          .student-detail-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
            margin-top: 0.7rem;
          }
          .student-detail-close {
            width: 36px;
            height: 36px;
            border: 1px solid rgba(255,255,255,0.22);
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .student-detail-summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1px;
            background: var(--border-default);
            border-bottom: 1px solid var(--border-default);
          }
          .student-detail-summary .student-detail-info {
            border: 0;
            border-radius: 0;
          }
          .student-detail-body {
            padding: 1.5rem;
            display: grid;
            gap: 1.25rem;
            background: var(--bg-secondary);
          }
          .student-section {
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-xl);
            padding: 1.25rem;
          }
          .student-section-header {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .student-section-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: var(--primary-50);
            color: var(--primary-700);
            border: 1px solid var(--primary-200);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .student-section h3 {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 800;
            color: var(--text-primary);
          }
          .student-section p,
          .student-list-row p {
            margin: 0.35rem 0 0;
            color: var(--text-secondary);
            font-size: 0.86rem;
            line-height: 1.5;
          }
          .student-detail-grid,
          .student-activity-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
          }
          .student-detail-info {
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md);
            padding: 0.85rem;
            min-width: 0;
          }
          .student-detail-label {
            color: var(--text-tertiary);
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 0.3rem;
          }
          [data-theme='dark'] .student-detail-label {
            color: var(--text-secondary);
          }
          .student-detail-value {
            color: var(--text-primary);
            font-weight: 700;
            font-size: 0.9rem;
            overflow-wrap: anywhere;
          }
          .student-bio {
            margin-top: 0.85rem !important;
            padding: 0.9rem;
            border-radius: var(--radius-md);
            background: var(--primary-50);
            color: var(--primary-900) !important;
          }
          [data-theme='dark'] .student-bio {
            background: var(--bg-tertiary);
            color: var(--text-primary) !important;
            border: 1px solid var(--border-default);
          }
          .student-link-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.85rem;
          }
          .student-link-row span,
          .student-link-row a {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            border: 1px solid var(--border-default);
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.78rem;
            color: var(--text-secondary);
            background: var(--bg-secondary);
            text-decoration: none;
          }
          .student-list-stack {
            display: grid;
            gap: 0.65rem;
          }
          .student-list-row {
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md);
            background: var(--bg-secondary);
            padding: 0.85rem;
          }
          .student-list-title {
            font-size: 0.92rem;
            font-weight: 800;
            color: var(--text-primary);
          }
          .student-list-meta {
            margin-top: 0.2rem;
            font-size: 0.76rem;
            color: var(--text-tertiary);
          }
          [data-theme='dark'] .student-list-meta {
            color: var(--text-secondary);
          }
          .student-score-table {
            margin-top: 0.85rem;
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md);
            overflow: hidden;
          }
          .student-score-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 1rem;
            padding: 0.65rem 0.85rem;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-default);
            font-size: 0.85rem;
          }
          .student-score-row:last-child {
            border-bottom: 0;
          }
          .student-score-row span {
            color: var(--text-secondary);
          }
          .student-score-row strong {
            color: var(--text-primary);
          }
          .student-subsection-title {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.76rem;
            font-weight: 800;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin: 1rem 0 0.5rem;
          }
          .student-subsection-title:first-child {
            margin-top: 0;
          }
          .student-tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
          }
          .student-empty-state {
            border: 1px dashed var(--border-default);
            border-radius: var(--radius-md);
            background: var(--bg-secondary);
            color: var(--text-tertiary);
            padding: 0.85rem;
            font-size: 0.85rem;
          }
          .student-detail-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: flex-end;
            padding: 1.1rem 1.5rem;
            border-top: 1px solid var(--border-default);
            background: var(--bg-elevated);
          }
          @media (max-width: 760px) {
            .student-detail-modal {
              margin: 0.75rem;
              max-width: calc(100vw - 1.5rem);
            }
            .student-detail-header {
              padding: 1rem;
            }
            .student-detail-header h2 {
              font-size: 1.2rem;
            }
            .student-detail-summary,
            .student-detail-grid,
            .student-activity-grid {
              grid-template-columns: 1fr;
            }
            .student-detail-body {
              padding: 1rem;
            }
            .student-section {
              padding: 1rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
