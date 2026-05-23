'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { ProfileLinkKindIcon } from '@/components/ProfileLinkKindIcon';
import { defaultStudentProfile } from '@/lib/studentProfileStorage';
import { toSignedViewUrl } from '@/lib/clientAssetUrl';
import { uploadStudentAvatarViaServer } from '@/lib/clientStudentAvatarUpload';
import { studentAvatarAcceptAttr, validateStudentAvatarFile } from '@/lib/studentAvatarUpload';
import { validateStudentAcademicScores } from '@/lib/validators';
import { STUDENT_DOCUMENT_ACCEPT_ATTR } from '@/lib/studentDocumentUpload';
import { uploadStudentDocumentViaServer } from '@/lib/clientStudentDocumentUpload';
import TagPicker from '@/components/TagPicker';
import StudentResumeUploadCard from '@/components/student/StudentResumeUploadCard';
import PageLoading from '@/components/PageLoading';

const LINK_KINDS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'website', label: 'Website' },
  { value: 'project', label: 'Project / portfolio' },
  { value: 'other', label: 'Other' },
];

const PROFILE_TABS = [
  { key: 'academics', label: 'Academics' },
  { key: 'contact', label: 'Contact' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'internships', label: 'Internships' },
  { key: 'otherWork', label: 'Other work' },
  { key: 'activities', label: 'Activities' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'links', label: 'Links' },
  { key: 'about', label: 'About' },
];

function newLinkId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `l-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function deriveCurrentSemester(profile) {
  const batchYearRaw = profile?.batchYear;
  const gradYearRaw = profile?.graduationYear;
  const batchYear = Number.isFinite(Number(batchYearRaw))
    ? Number(batchYearRaw)
    : Number.isFinite(Number(gradYearRaw))
      ? Number(gradYearRaw) - 4
      : null;
  if (!Number.isFinite(batchYear)) return '—';

  const now = new Date();
  const yearDiff = now.getFullYear() - batchYear;
  const isOddSemesterWindow = now.getMonth() >= 6; // Jul-Dec
  const semester = Math.max(1, Math.min(8, yearDiff * 2 + (isOddSemesterWindow ? 1 : 2)));
  return String(semester);
}

/** Omit local-only / large fields from API save payload. */
function profilePutBody(p) {
  return {
    department: p.department,
    branch: p.branch,
    batchYear: p.batchYear,
    graduationYear: p.graduationYear,
    cgpa: p.cgpa,
    tenthPercentage: p.tenthPercentage,
    twelfthPercentage: p.twelfthPercentage,
    diplomaPercentage: p.diplomaPercentage,
    backlogsActive: p.backlogsActive,
    backlogsHistory: p.backlogsHistory,
    educationDetails: p.educationDetails,
    gender: p.gender,
    bio: p.bio,
    skills: p.skills,
    expectedSalaryMin: p.expectedSalaryMin,
    expectedSalaryMax: p.expectedSalaryMax,
    preferredLocations: p.preferredLocations,
    willingToRelocate: p.willingToRelocate,
    profileLinks: p.profileLinks,
    phones: p.phones,
    emails: p.emails,
    communicationEmail: p.communicationEmail,
    address: p.address,
    projects: p.projects,
    internships: p.internships,
    otherWork: p.otherWork,
    workExperience: p.workExperience,
    responsibilities: p.responsibilities,
    accomplishments: p.accomplishments,
    volunteering: p.volunteering,
    extracurriculars: p.extracurriculars,
  };
}

function blankProject() {
  return {
    title: '',
    description: '',
    techStack: [],
    projectUrl: '',
    githubUrl: '',
    startDate: '',
    endDate: '',
  };
}

function blankActivity() {
  return {
    title: '',
    organization: '',
    period: '',
    description: '',
  };
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

/** Expected salary stored as ₹/year (same unit as preferences UI). */
const MAX_EXPECTED_SALARY = 50_000_000;

function validateExpectedSalary(p) {
  const min = p.expectedSalaryMin === '' || p.expectedSalaryMin == null ? null : Number(p.expectedSalaryMin);
  const max = p.expectedSalaryMax === '' || p.expectedSalaryMax == null ? null : Number(p.expectedSalaryMax);
  if (min != null) {
    if (!Number.isFinite(min) || min < 0) {
      return 'Expected salary minimum must be zero or a positive number.';
    }
    if (min > MAX_EXPECTED_SALARY) {
      return 'Expected salary minimum is above the allowed maximum.';
    }
  }
  if (max != null) {
    if (!Number.isFinite(max) || max < 0) {
      return 'Expected salary maximum must be zero or a positive number.';
    }
    if (max > MAX_EXPECTED_SALARY) {
      return 'Expected salary maximum is above the allowed maximum.';
    }
  }
  if (min != null && max != null && min > max) {
    return 'Expected salary minimum cannot be greater than the maximum.';
  }
  return null;
}

function parseSalaryInput(value) {
  if (value === '' || value == null) return '';
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return '';
  if (n < 0) return 0;
  if (n > MAX_EXPECTED_SALARY) return MAX_EXPECTED_SALARY;
  return n;
}

function clampCgpaInput(value) {
  if (value === '' || value == null) return '';
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return '';
  if (n > 10) return 10;
  if (n < 0) return 0;
  return n;
}

function clampPercentInput(value) {
  if (value === '' || value == null) return '';
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return '';
  if (n > 100) return 100;
  if (n < 0) return 0;
  return n;
}

export default function StudentProfilePage() {
  const { data: session, status, update } = useSession();
  const { addToast } = useToast();
  const email = session?.user?.email || '';
  const [activeTab, setActiveTab] = useState('academics');
  const [editingTab, setEditingTab] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState(() => defaultStudentProfile(session?.user));
  const currentSemester = deriveCurrentSemester(profile);
  const editingHeader = editingTab === 'header';
  const editing = editingTab === activeTab;

  const calendarFetcher = useCallback(async (url) => {
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Failed to load calendar');
    return json;
  }, []);
  const { data: placementCalData, isLoading: placementCalLoading } = useSWR('/api/student/calendar', calendarFetcher);
  const upcomingPlacementDates = useMemo(() => {
    const events = Array.isArray(placementCalData?.events) ? placementCalData.events : [];
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayYmd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return events
      .map((e) => ({
        id: e.id,
        title: e.title,
        ymd: String(e.date || '').slice(0, 10),
      }))
      .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.ymd))
      .sort((a, b) => a.ymd.localeCompare(b.ymd))
      .filter((e) => e.ymd >= todayYmd)
      .slice(0, 5);
  }, [placementCalData]);

  const loadProfileFromApi = useCallback(
    async (opts) => {
      const silent = Boolean(opts?.silent);
      if (!email) {
        setProfile(defaultStudentProfile(session?.user));
        if (!silent) setProfileLoading(false);
        return;
      }
      if (!silent) setProfileLoading(true);
      try {
        const res = await fetch('/api/student/profile');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          addToast(data.hint ? `${data.error || 'Error'}: ${data.hint}` : data.error || 'Could not load profile', 'warning');
          setProfile(defaultStudentProfile(session?.user));
          return;
        }
        if (data.profile) setProfile(data.profile);
      } catch {
        addToast('Could not load profile (network).', 'warning');
        setProfile(defaultStudentProfile(session?.user));
      } finally {
        if (!silent) setProfileLoading(false);
      }
    },
    [addToast, email, session?.user]
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role !== 'student') {
      setProfileLoading(false);
      return;
    }
    loadProfileFromApi();
  }, [status, session?.user?.role, loadProfileFromApi]);

  const persist = useCallback((next) => {
    setProfile(next);
  }, []);

  const handleSave = async () => {
    const academicErr = validateStudentAcademicScores({
      cgpa: profile.cgpa,
      tenthPercentage: profile.tenthPercentage,
      twelfthPercentage: profile.twelfthPercentage,
      diplomaPercentage: profile.diplomaPercentage,
    });
    if (academicErr) {
      addToast(academicErr, 'warning');
      return;
    }
    const salaryErr = validateExpectedSalary(profile);
    if (salaryErr) {
      addToast(salaryErr, 'warning');
      return;
    }
    const savedSummary = editingTab === 'header';
    setProfileSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePutBody(profile)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(data.hint ? `${data.error || 'Save failed'}: ${data.hint}` : data.error || 'Save failed', 'warning');
        return;
      }
      if (data.profile) setProfile(data.profile);
      setEditingTab(null);
      addToast(savedSummary ? 'Profile summary saved.' : 'Profile saved.', 'success');
    } catch {
      addToast('Save failed (network).', 'warning');
    } finally {
      setProfileSaving(false);
    }
  };

  const addProfileLink = () => {
    const prevLinks = profile.profileLinks || [];
    persist({
      ...profile,
      profileLinks: [...prevLinks, { id: newLinkId(), kind: 'website', url: '', title: '', description: '' }],
    });
  };

  const updateLink = (id, patch) => {
    const prevLinks = profile.profileLinks || [];
    persist({
      ...profile,
      profileLinks: prevLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeLink = (id) => {
    const prevLinks = profile.profileLinks || [];
    persist({ ...profile, profileLinks: prevLinks.filter((l) => l.id !== id) });
  };

  const updateEducationDetail = (key, patch) => {
    persist({
      ...profile,
      educationDetails: {
        ...(profile.educationDetails || {}),
        [key]: {
          ...((profile.educationDetails || {})[key] || {}),
          ...patch,
        },
      },
    });
  };

  const addProject = () => {
    persist({ ...profile, projects: [...asList(profile.projects), blankProject()] });
  };

  const updateProject = (index, patch) => {
    const projects = [...asList(profile.projects)];
    projects[index] = { ...projects[index], ...patch };
    persist({ ...profile, projects });
  };

  const removeProject = (index) => {
    const projects = [...asList(profile.projects)];
    projects.splice(index, 1);
    persist({ ...profile, projects });
  };

  const addActivity = (key) => {
    persist({ ...profile, [key]: [...asList(profile[key]), blankActivity()] });
  };

  const updateActivity = (key, index, patch) => {
    const rows = [...asList(profile[key])];
    rows[index] = { ...rows[index], ...patch };
    persist({ ...profile, [key]: rows });
  };

  const removeActivity = (key, index) => {
    const rows = [...asList(profile[key])];
    rows.splice(index, 1);
    persist({ ...profile, [key]: rows });
  };

  const addPhone = () => {
    persist({
      ...profile,
      phones: [...(profile.phones || []), { label: 'Other', value: '' }],
    });
  };

  const updatePhone = (index, patch) => {
    const phones = [...(profile.phones || [])];
    phones[index] = { ...phones[index], ...patch };
    persist({ ...profile, phones });
  };

  const removePhone = (index) => {
    const phones = [...(profile.phones || [])];
    phones.splice(index, 1);
    persist({ ...profile, phones: phones.length ? phones : [{ label: 'Primary', value: '' }] });
  };

  const addEmailRow = () => {
    persist({
      ...profile,
      emails: [...(profile.emails || []), { label: 'Other', value: '' }],
    });
  };

  const updateEmailRow = (index, patch) => {
    const emails = [...(profile.emails || [])];
    emails[index] = { ...emails[index], ...patch };
    persist({ ...profile, emails });
  };

  const removeEmailRow = (index) => {
    const emails = [...(profile.emails || [])];
    emails.splice(index, 1);
    persist({
      ...profile,
      emails: emails.length ? emails : [{ label: 'College', value: email }],
    });
  };

  const persistLocalAvatarDataUrl = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl !== 'string') {
            addToast('Could not read the image file.', 'warning');
            reject(new Error('invalid read'));
            return;
          }
          if (dataUrl.length > 1_200_000) {
            addToast('Image too large for offline storage. Use a smaller file (~900KB).', 'warning');
            reject(new Error('too large'));
            return;
          }
          setProfile((prev) => ({
            ...prev,
            avatarDataUrl: dataUrl,
            avatarUrl: '',
            avatarName: file.name,
          }));
          addToast('Photo saved in this browser only (cloud upload not available).', 'info');
          resolve();
        };
        reader.onerror = () => {
          addToast('Could not read the image file.', 'warning');
          reject(new Error('read error'));
        };
        reader.readAsDataURL(file);
      }),
    [addToast],
  );

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validated = validateStudentAvatarFile(file);
    if (!validated.ok) {
      addToast(validated.error, 'warning');
      return;
    }

    setAvatarUploading(true);
    try {
      const serverResult = await uploadStudentAvatarViaServer(file);
      if (serverResult.ok) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl: serverResult.avatar_url,
          avatarDataUrl: '',
          avatarName: file.name,
        }));
        await update({ avatar: serverResult.avatar_url });
        addToast('Profile photo updated.', 'success');
        return;
      }

      if (serverResult.error === 'Cloud storage not configured' || serverResult.hint?.includes('S3')) {
        await persistLocalAvatarDataUrl(file);
        return;
      }

      addToast(serverResult.error + (serverResult.hint ? ` — ${serverResult.hint}` : ''), 'warning');
    } catch (err) {
      if (err?.message !== 'too large' && err?.message !== 'invalid read' && err?.message !== 'read error') {
        addToast('Upload failed (network).', 'warning');
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const onCvChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCvUploading(true);
    try {
      const result = await uploadStudentDocumentViaServer(file, {
        documentType: 'resume',
        setAsPrimaryResume: true,
      });
      if (!result.ok) {
        addToast(result.error + (result.hint ? ` — ${result.hint}` : ''), 'warning');
        return;
      }

      await loadProfileFromApi({ silent: true });
      addToast('Primary CV saved. Employers will see this version when you apply.', 'success');
    } catch {
      addToast('Résumé upload failed (network).', 'warning');
    } finally {
      setCvUploading(false);
    }
  };

  const displayPhones = profile.phones?.length ? profile.phones : [{ label: 'Primary', value: profile.phone || '' }];
  const displayEmails = profile.emails?.length
    ? profile.emails
    : [
        { label: 'College', value: profile.collegeEmail || email },
        { label: 'Personal', value: profile.personalEmail || '' },
      ];

  const locList = (profile.preferredLocations || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawAvatarSrc = profile.avatarUrl || profile.avatarDataUrl || session?.user?.avatar || '';
  const avatarSrc = rawAvatarSrc.startsWith('data:') ? rawAvatarSrc : toSignedViewUrl(rawAvatarSrc);
  const resumeViewUrl = profile.resumeUrl ? '/api/student/resume/view' : '';
  const resumeLabel = profile.cvFileName?.trim() || 'View résumé';
  const headerActionLabelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '0.3rem 0.55rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: 'white',
    margin: 0,
    textAlign: 'center',
  };
  const skillsList = profile.skills || [];
  const linksList = profile.profileLinks || [];
  const projectsList = asList(profile.projects);
  const internshipsList = asList(profile.internships?.length ? profile.internships : profile.workExperience);
  const otherWorkList = asList(profile.otherWork);
  const activitySections = [
    { key: 'responsibilities', title: 'Positions of Responsibility', empty: 'No responsibilities added yet.' },
    { key: 'accomplishments', title: 'Accomplishments', empty: 'No accomplishments added yet.' },
    { key: 'volunteering', title: 'Volunteering', empty: 'No volunteering added yet.' },
    { key: 'extracurriculars', title: 'Extra-curricular Activities', empty: 'No activities added yet.' },
  ];
  const cgpaNum = profile.cgpa === '' || profile.cgpa == null ? NaN : Number(profile.cgpa);
  const hasSalary =
    (profile.expectedSalaryMin != null && Number(profile.expectedSalaryMin) > 0) ||
    (profile.expectedSalaryMax != null && Number(profile.expectedSalaryMax) > 0);

  if (profileLoading) {
    return <PageLoading message="Loading profile…" />;
  }

  return (
    <div className="animate-fadeIn">
      <div className="profile-header">
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0, background: 'var(--bg-tertiary)' }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(session?.user?.name)
            )}
          </div>
          <label
            aria-label={avatarUploading ? 'Uploading profile photo' : 'Change profile photo'}
            style={{
              ...headerActionLabelStyle,
              cursor: avatarUploading ? 'wait' : 'pointer',
              opacity: avatarUploading ? 0.8 : 1,
            }}
          >
            {avatarUploading ? 'Uploading…' : 'Change photo'}
            <input
              type="file"
              accept={studentAvatarAcceptAttr()}
              hidden
              disabled={avatarUploading}
              onChange={onAvatarChange}
            />
          </label>
        </div>
        <div className="profile-info" style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{session?.user?.name}</h2>
            {!editingHeader ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingTab('header')}>
                Edit summary
              </button>
            ) : (
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                Editing summary
              </span>
            )}
          </div>
          {!editingHeader ? (
            <>
              <p style={{ margin: '0.35rem 0 0' }}>
                {[
                  profile.branch,
                  profile.batch || profile.joiningAcademicYear
                    ? `Batch ${profile.batch || profile.joiningAcademicYear}`
                    : profile.batchYear !== '' && profile.batchYear != null
                      ? `Batch ${profile.batchYear}`
                      : '',
                ]
                  .filter(Boolean)
                  .join(' | ') || '—'}
              </p>
              <div className="profile-meta">
                <div className="profile-meta-item">🎓 {profile.rollNumber || '—'}</div>
                <div className="profile-meta-item">
                  📊 CGPA: {Number.isFinite(cgpaNum) ? `${cgpaNum}` : '—'}
                </div>
                {resumeViewUrl ? (
                  <a
                    href={resumeViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-meta-item profile-resume-link"
                  >
                    📄 {resumeLabel}
                  </a>
                ) : null}
                {displayEmails
                  .filter((x) => x.value)
                  .map((x, i) => (
                    <div key={i} className="profile-meta-item">
                      📧 {x.label}: {x.value}
                    </div>
                  ))}
                <div className="profile-meta-item">
                  ✉️ Notifications:{' '}
                  {(profile.communicationEmail && String(profile.communicationEmail).trim()) || email || '—'}
                </div>
                {displayPhones
                  .filter((x) => x.value)
                  .slice(0, 2)
                  .map((x, i) => (
                    <div key={i} className="profile-meta-item">
                      📱 {x.label}: {x.value}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  style={{ minWidth: '140px', flex: '1 1 140px' }}
                  placeholder="Branch / specialisation"
                  maxLength={100}
                  value={profile.branch}
                  onChange={(e) => persist({ ...profile, branch: e.target.value })}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Batch year"
                  style={{ width: '8rem' }}
                  value={profile.batchYear === '' || profile.batchYear == null ? '' : profile.batchYear}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') {
                      persist({ ...profile, batchYear: '' });
                      return;
                    }
                    const n = parseInt(v, 10);
                    persist({ ...profile, batchYear: Number.isFinite(n) ? n : '' });
                  }}
                />
              </div>
              <div className="drive-info-item" style={{ margin: 0 }}>
                <div className="drive-info-label">Roll number</div>
                <div className="drive-info-value" title="Assigned by your college">
                  {profile.rollNumber || '—'}
                  <span className="text-xs text-tertiary" style={{ display: 'block', marginTop: '0.25rem' }}>
                    Set by placement office — not editable here
                  </span>
                </div>
              </div>
              <div>
                <div className="drive-info-label" style={{ marginBottom: '0.35rem' }}>
                  CGPA
                </div>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10"
                  style={{ maxWidth: '10rem' }}
                  value={profile.cgpa === '' ? '' : profile.cgpa}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      cgpa: e.target.value === '' ? '' : clampCgpaInput(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <div className="drive-info-label" style={{ marginBottom: '0.35rem' }}>
                  Communication email (notifications)
                </div>
                <input
                  className="form-input"
                  type="email"
                  placeholder="email@example.com"
                  value={profile.communicationEmail || ''}
                  onChange={(e) => persist({ ...profile, communicationEmail: e.target.value })}
                />
              </div>
              <div>
                <div className="drive-info-label" style={{ marginBottom: '0.35rem' }}>
                  Email addresses
                </div>
                {displayEmails.map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: '120px' }}
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updateEmailRow(i, { label: e.target.value })}
                    />
                    <input
                      className="form-input"
                      style={{ flex: '1 1 180px', minWidth: 0 }}
                      type="email"
                      placeholder="email@example.com"
                      value={row.value}
                      onChange={(e) => updateEmailRow(i, { value: e.target.value })}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEmailRow(i)} aria-label="Remove email">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addEmailRow}>
                  + Add email
                </button>
              </div>
              <div>
                <div className="drive-info-label" style={{ marginBottom: '0.35rem' }}>
                  Phone numbers
                </div>
                {displayPhones.map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="form-input"
                      style={{ maxWidth: '120px' }}
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updatePhone(i, { label: e.target.value })}
                    />
                    <input
                      className="form-input"
                      style={{ flex: '1 1 180px', minWidth: 0 }}
                      placeholder="+91 …"
                      value={row.value}
                      onChange={(e) => updatePhone(i, { value: e.target.value })}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePhone(i)} aria-label="Remove phone">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addPhone}>
                  + Add number
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={profileSaving}
                  onClick={() => {
                    void loadProfileFromApi({ silent: true });
                    setEditingTab(null);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" disabled={profileSaving} onClick={() => void handleSave()}>
                  {profileSaving ? 'Saving…' : 'Save summary'}
                </button>
              </div>
              <p className="text-xs text-tertiary" style={{ margin: 0 }}>
                Full address and additional labels are under the Contact tab.
              </p>
            </div>
          )}
        </div>
      </div>

      <StudentResumeUploadCard
        resumeViewUrl={resumeViewUrl}
        resumeLabel={resumeLabel}
        cvUploading={cvUploading}
        onCvChange={onCvChange}
      />

      <div
        className="card"
        style={{
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Upcoming placement dates</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/dashboard/student/calendar" className="btn btn-secondary btn-sm">
              Full calendar
            </Link>
            <Link href="/dashboard/student/interviews" className="btn btn-ghost btn-sm">
              Interviews
            </Link>
          </div>
        </div>
        {placementCalLoading ? (
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Loading campus calendar…
          </p>
        ) : upcomingPlacementDates.length === 0 ? (
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            No upcoming drives on your campus calendar yet.{' '}
            <Link href="/dashboard/student/drives">Browse drives</Link> to find companies and apply.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem' }}>
            {upcomingPlacementDates.map((ev) => (
              <li key={ev.id} style={{ fontSize: '0.9rem' }}>
                <strong>{formatDate(ev.ymd)}</strong> — {ev.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <div className="horizontal-scroll" style={{ display: 'flex', gap: '0.35rem', paddingBottom: '0.1rem' }} role="tablist" aria-label="Profile sections">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              onClick={() => {
                if (editingTab) {
                  void loadProfileFromApi({ silent: true });
                  setEditingTab(null);
                }
                setActiveTab(tab.key);
              }}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {editingHeader ? 'Profile summary' : PROFILE_TABS.find((tab) => tab.key === activeTab)?.label}
          </h3>
          <p className="text-sm text-secondary" style={{ margin: '0.25rem 0 0' }}>
            {editingHeader
              ? 'These details appear in the card at the top of your profile.'
              : 'Edit this section independently from the rest of your profile.'}
          </p>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={profileSaving}
              onClick={() => {
                void loadProfileFromApi({ silent: true });
                setEditingTab(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={profileSaving} onClick={() => void handleSave()}>
              {profileSaving ? 'Saving…' : 'Save section'}
            </button>
          </div>
        ) : !editingHeader ? (
          <button type="button" className="btn btn-secondary" onClick={() => setEditingTab(activeTab)}>
            ✏️ Edit section
          </button>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {activeTab === 'academics' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎓 Academic Information</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item">
              <div className="drive-info-label">Department</div>
              {editing ? (
                <input className="form-input" value={profile.department} onChange={(e) => persist({ ...profile, department: e.target.value })} />
              ) : (
                <div className="drive-info-value">{profile.department}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Branch / Specialisation</div>
              {editing ? (
                <input className="form-input" maxLength={100} value={profile.branch} onChange={(e) => persist({ ...profile, branch: e.target.value })} />
              ) : (
                <div className="drive-info-value">{profile.branch}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Roll number</div>
              <div className="drive-info-value" title="Assigned by your college">
                {profile.rollNumber || '—'}
                <span className="text-xs text-tertiary" style={{ display: 'block', marginTop: '0.25rem' }}>
                  Set by placement office — not editable
                </span>
              </div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">CGPA</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10"
                  value={profile.cgpa === '' ? '' : profile.cgpa}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      cgpa: e.target.value === '' ? '' : clampCgpaInput(e.target.value),
                    })
                  }
                />
              ) : (
                <div
                  className="drive-info-value"
                  style={{
                    color: Number.isFinite(cgpaNum) && cgpaNum >= 8 ? 'var(--success-600)' : 'var(--text-primary)',
                  }}
                >
                  {Number.isFinite(cgpaNum) ? `${cgpaNum} / 10` : '—'}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">10th %</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.tenthPercentage === '' ? '' : profile.tenthPercentage}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      tenthPercentage: e.target.value === '' ? '' : clampPercentInput(e.target.value),
                    })
                  }
                />
              ) : (
                <div className="drive-info-value">
                  {profile.tenthPercentage === '' || profile.tenthPercentage == null ? '—' : `${profile.tenthPercentage}%`}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">12th %</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.twelfthPercentage === '' ? '' : profile.twelfthPercentage}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      twelfthPercentage: e.target.value === '' ? '' : clampPercentInput(e.target.value),
                    })
                  }
                />
              ) : (
                <div className="drive-info-value">
                  {profile.twelfthPercentage === '' || profile.twelfthPercentage == null ? '—' : `${profile.twelfthPercentage}%`}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Diploma %</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.diplomaPercentage === '' ? '' : profile.diplomaPercentage}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      diplomaPercentage: e.target.value === '' ? '' : clampPercentInput(e.target.value),
                    })
                  }
                />
              ) : (
                <div className="drive-info-value">
                  {profile.diplomaPercentage === '' || profile.diplomaPercentage == null ? '—' : `${profile.diplomaPercentage}%`}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Graduation year</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  value={profile.graduationYear === '' ? '' : profile.graduationYear}
                  onChange={(e) =>
                    persist({
                      ...profile,
                      graduationYear: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                    })
                  }
                />
              ) : (
                <div className="drive-info-value">
                  {profile.graduationYear === '' || profile.graduationYear == null ? '—' : profile.graduationYear}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Current Semester</div>
              <div className="drive-info-value">{currentSemester}</div>
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Active Backlogs</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={profile.backlogsActive ?? 0}
                  onChange={(e) => persist({ ...profile, backlogsActive: e.target.value === '' ? 0 : parseInt(e.target.value, 10) })}
                />
              ) : (
                <div className="drive-info-value">{profile.backlogsActive ?? 0}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Total Backlogs</div>
              {editing ? (
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={profile.backlogsHistory ?? 0}
                  onChange={(e) => persist({ ...profile, backlogsHistory: e.target.value === '' ? 0 : parseInt(e.target.value, 10) })}
                />
              ) : (
                <div className="drive-info-value">{profile.backlogsHistory ?? 0}</div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Gender</div>
              {editing ? (
                <select className="form-select" value={profile.gender || ''} onChange={(e) => persist({ ...profile, gender: e.target.value })}>
                  <option value="">—</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              ) : (
                <div className="drive-info-value">{profile.gender || '—'}</div>
              )}
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.875rem' }}>
            {[
              ['tenth', '10th Standard'],
              ['twelfth', '12th Standard'],
              ['diploma', 'Diploma'],
            ].map(([key, label]) => {
              const row = (profile.educationDetails || {})[key] || {};
              const hasDetails = row.institution || row.board || row.year || row.notes;
              return (
                <div key={key} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.875rem', background: 'var(--bg-secondary)' }}>
                  <div className="drive-info-label" style={{ marginBottom: '0.6rem' }}>{label} Details</div>
                  {editing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}>
                      <input className="form-input" placeholder="School / institution" value={row.institution || ''} onChange={(e) => updateEducationDetail(key, { institution: e.target.value })} />
                      <input className="form-input" placeholder="Board / university" value={row.board || ''} onChange={(e) => updateEducationDetail(key, { board: e.target.value })} />
                      <input className="form-input" type="number" placeholder="Passing year" value={row.year || ''} onChange={(e) => updateEducationDetail(key, { year: e.target.value === '' ? '' : parseInt(e.target.value, 10) })} />
                      <textarea className="form-textarea" rows={2} style={{ gridColumn: '1 / -1' }} placeholder="Notes, stream, achievements, or subjects" value={row.notes || ''} onChange={(e) => updateEducationDetail(key, { notes: e.target.value })} />
                    </div>
                  ) : hasDetails ? (
                    <div className="text-sm" style={{ lineHeight: 1.6 }}>
                      {[row.institution, row.board, row.year].filter(Boolean).join(' · ')}
                      {row.notes && <div className="text-secondary" style={{ marginTop: '0.25rem' }}>{row.notes}</div>}
                    </div>
                  ) : (
                    <div className="text-sm text-tertiary">No details added yet.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {activeTab === 'contact' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📇 Contact</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Communication Email
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {editing ? (
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    type="email"
                    placeholder="email@example.com"
                    value={profile.communicationEmail || ''}
                    onChange={(e) => persist({ ...profile, communicationEmail: e.target.value })}
                  />
                ) : (
                  <div className="text-sm">
                    {profile.communicationEmail || '—'}
                    <div className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>
                      All platform notifications and alerts will be sent to this address.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Other Email addresses
              </div>
              {displayEmails.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  {editing ? (
                    <>
                      <input
                        className="form-input"
                        style={{ maxWidth: '120px' }}
                        placeholder="Label"
                        value={row.label}
                        onChange={(e) => updateEmailRow(i, { label: e.target.value })}
                      />
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        type="email"
                        placeholder="email@example.com"
                        value={row.value}
                        onChange={(e) => updateEmailRow(i, { value: e.target.value })}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEmailRow(i)} aria-label="Remove email">
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-sm">
                      <strong>{row.label}:</strong> {row.value || '—'}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addEmailRow}>
                  + Add email
                </button>
              )}
            </div>
            <div>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Mobile numbers
              </div>
              {displayPhones.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  {editing ? (
                    <>
                      <input
                        className="form-input"
                        style={{ maxWidth: '120px' }}
                        placeholder="Label"
                        value={row.label}
                        onChange={(e) => updatePhone(i, { label: e.target.value })}
                      />
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="+91 …"
                        value={row.value}
                        onChange={(e) => updatePhone(i, { value: e.target.value })}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePhone(i)} aria-label="Remove phone">
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-sm">
                      <strong>{row.label}:</strong> {row.value || '—'}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={addPhone}>
                  + Add number
                </button>
              )}
            </div>
            <div>
              <div className="drive-info-label" style={{ marginBottom: '0.5rem' }}>
                Address
              </div>
              {editing ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <input
                    className="form-input"
                    placeholder="Address line"
                    value={profile.address?.line1 || ''}
                    onChange={(e) =>
                      persist({
                        ...profile,
                        address: { ...(profile.address || {}), line1: e.target.value },
                      })
                    }
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input
                      className="form-input"
                      placeholder="City"
                      value={profile.address?.city || ''}
                      onChange={(e) =>
                        persist({
                          ...profile,
                          address: { ...(profile.address || {}), city: e.target.value },
                        })
                      }
                    />
                    <input
                      className="form-input"
                      placeholder="State"
                      value={profile.address?.state || ''}
                      onChange={(e) =>
                        persist({
                          ...profile,
                          address: { ...(profile.address || {}), state: e.target.value },
                        })
                      }
                    />
                  </div>
                  <input
                    className="form-input"
                    placeholder="Pincode"
                    value={profile.address?.pincode || ''}
                    onChange={(e) =>
                      persist({
                        ...profile,
                        address: { ...(profile.address || {}), pincode: e.target.value },
                      })
                    }
                  />
                </div>
              ) : (
                <div className="text-sm">
                  {(profile.address?.line1 || profile.address?.city || profile.address?.state || profile.address?.pincode)
                    ? [profile.address?.line1, profile.address?.city, profile.address?.state, profile.address?.pincode]
                        .filter(Boolean)
                        .join(', ')
                    : '—'}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {activeTab === 'skills' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💡 Skills</h3>
          </div>
          {editing ? (
            <>
              <TagPicker
                tags={skillsList}
                onChange={(skills) => setProfile((p) => ({ ...p, skills }))}
                placeholder="Type a skill and press Enter…"
              />
              <p className="text-sm" style={{ marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
                Press Enter or comma to add a tag. Backspace removes the last tag when the field is empty.
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skillsList.length ? (
                skillsList.map((skill, i) => (
                  <span
                    key={`${skill}-${i}`}
                    className="badge badge-indigo"
                    style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No skills yet. Edit profile to add some.
                </span>
              )}
            </div>
          )}
        </div>
        )}

        {activeTab === 'projects' && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title">🧩 Projects</h3>
            {editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addProject}>
                + Add project
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '0.875rem' }}>
            {projectsList.length === 0 && <p className="text-sm text-secondary">No projects added yet.</p>}
            {projectsList.map((project, index) => (
              <div key={index} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                {editing ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <input className="form-input" placeholder="Project title" value={project.title || ''} onChange={(e) => updateProject(index, { title: e.target.value })} />
                    <textarea className="form-textarea" rows={3} placeholder="What did you build? What problem did it solve?" value={project.description || ''} onChange={(e) => updateProject(index, { description: e.target.value })} />
                    <input
                      className="form-input"
                      placeholder="Tech stack, comma-separated"
                      value={asList(project.techStack).join(', ')}
                      onChange={(e) => updateProject(index, { techStack: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      <input className="form-input" type="url" placeholder="Project URL" value={project.projectUrl || ''} onChange={(e) => updateProject(index, { projectUrl: e.target.value })} />
                      <input className="form-input" type="url" placeholder="GitHub URL" value={project.githubUrl || ''} onChange={(e) => updateProject(index, { githubUrl: e.target.value })} />
                      <input className="form-input" type="date" value={project.startDate || ''} onChange={(e) => updateProject(index, { startDate: e.target.value })} />
                      <input className="form-input" type="date" value={project.endDate || ''} onChange={(e) => updateProject(index, { endDate: e.target.value })} />
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeProject(index)} style={{ justifySelf: 'start' }}>
                      Remove project
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{project.title || 'Untitled project'}</div>
                    {(project.startDate || project.endDate) && (
                      <div className="text-xs text-tertiary" style={{ marginTop: '0.2rem' }}>
                        {[project.startDate, project.endDate || 'Present'].filter(Boolean).join(' - ')}
                      </div>
                    )}
                    {project.description && <p className="text-sm text-secondary" style={{ lineHeight: 1.6, margin: '0.5rem 0' }}>{project.description}</p>}
                    {asList(project.techStack).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {project.techStack.map((tech) => <span key={tech} className="badge badge-indigo">{tech}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'internships' && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title">💼 Internships</h3>
            {editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addActivity('internships')}>
                + Add internship
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {internshipsList.length === 0 && <p className="text-sm text-secondary">No internships added yet.</p>}
            {internshipsList.map((row, index) => (
              <div key={index} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                {editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
                    <input className="form-input" placeholder="Role / title" value={row.title || ''} onChange={(e) => updateActivity('internships', index, { title: e.target.value })} />
                    <input className="form-input" placeholder="Company / organization" value={row.organization || ''} onChange={(e) => updateActivity('internships', index, { organization: e.target.value })} />
                    <input className="form-input" placeholder="Duration, e.g. May-Jul 2025" value={row.period || ''} onChange={(e) => updateActivity('internships', index, { period: e.target.value })} />
                    <textarea className="form-textarea" rows={4} style={{ gridColumn: '1 / -1' }} placeholder="Describe your work, responsibilities, tools used, and outcomes." value={row.description || ''} onChange={(e) => updateActivity('internships', index, { description: e.target.value })} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeActivity('internships', index)} style={{ justifySelf: 'start' }}>
                      Remove internship
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{row.title || 'Untitled internship'}</div>
                    <div className="text-xs text-tertiary">{[row.organization, row.period].filter(Boolean).join(' · ')}</div>
                    {row.description && <p className="text-sm text-secondary" style={{ margin: '0.5rem 0 0', lineHeight: 1.6 }}>{row.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'otherWork' && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title">🛠️ Other Work</h3>
            {editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addActivity('otherWork')}>
                + Add work
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {otherWorkList.length === 0 && <p className="text-sm text-secondary">No part-time, freelance, research, or other work added yet.</p>}
            {otherWorkList.map((row, index) => (
              <div key={index} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                {editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
                    <input className="form-input" placeholder="Role / work title" value={row.title || ''} onChange={(e) => updateActivity('otherWork', index, { title: e.target.value })} />
                    <input className="form-input" placeholder="Organization / client" value={row.organization || ''} onChange={(e) => updateActivity('otherWork', index, { organization: e.target.value })} />
                    <input className="form-input" placeholder="Duration / year" value={row.period || ''} onChange={(e) => updateActivity('otherWork', index, { period: e.target.value })} />
                    <textarea className="form-textarea" rows={4} style={{ gridColumn: '1 / -1' }} placeholder="Describe the work, scope, contribution, and impact." value={row.description || ''} onChange={(e) => updateActivity('otherWork', index, { description: e.target.value })} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeActivity('otherWork', index)} style={{ justifySelf: 'start' }}>
                      Remove work
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{row.title || 'Untitled work'}</div>
                    <div className="text-xs text-tertiary">{[row.organization, row.period].filter(Boolean).join(' · ')}</div>
                    {row.description && <p className="text-sm text-secondary" style={{ margin: '0.5rem 0 0', lineHeight: 1.6 }}>{row.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'activities' && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title">🏅 Activities</h3>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activitySections.map((section) => {
              const rows = asList(profile[section.key]);
              return (
                <div key={section.key} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{section.title}</div>
                    {editing && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addActivity(section.key)}>
                        + Add
                      </button>
                    )}
                  </div>
                  {rows.length === 0 && <p className="text-sm text-secondary" style={{ margin: 0 }}>{section.empty}</p>}
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {rows.map((row, index) => (
                      <div key={index} style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border-default)', paddingTop: index === 0 ? 0 : '0.75rem' }}>
                        {editing ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
                            <input className="form-input" placeholder="Title" value={row.title || ''} onChange={(e) => updateActivity(section.key, index, { title: e.target.value })} />
                            <input className="form-input" placeholder="Organization / issuer" value={row.organization || ''} onChange={(e) => updateActivity(section.key, index, { organization: e.target.value })} />
                            <input className="form-input" placeholder="Period / year" value={row.period || ''} onChange={(e) => updateActivity(section.key, index, { period: e.target.value })} />
                            <textarea className="form-textarea" rows={2} style={{ gridColumn: '1 / -1' }} placeholder="Details, responsibility, outcome, or impact" value={row.description || ''} onChange={(e) => updateActivity(section.key, index, { description: e.target.value })} />
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeActivity(section.key, index)} style={{ justifySelf: 'start' }}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700 }}>{row.title || 'Untitled'}</div>
                            <div className="text-xs text-tertiary">{[row.organization, row.period].filter(Boolean).join(' · ')}</div>
                            {row.description && <p className="text-sm text-secondary" style={{ margin: '0.35rem 0 0', lineHeight: 1.5 }}>{row.description}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {activeTab === 'preferences' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎯 Placement preferences</h3>
          </div>
          <div className="drive-info-grid">
            <div className="drive-info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="drive-info-label">Expected salary (₹ / year)</div>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Min"
                    min={0}
                    step={10000}
                    max={MAX_EXPECTED_SALARY}
                    value={profile.expectedSalaryMin === '' || profile.expectedSalaryMin == null ? '' : profile.expectedSalaryMin}
                    onChange={(e) =>
                      persist({
                        ...profile,
                        expectedSalaryMin: parseSalaryInput(e.target.value === '' ? '' : e.target.value),
                      })
                    }
                  />
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Max"
                    min={0}
                    step={10000}
                    max={MAX_EXPECTED_SALARY}
                    value={profile.expectedSalaryMax === '' || profile.expectedSalaryMax == null ? '' : profile.expectedSalaryMax}
                    onChange={(e) =>
                      persist({
                        ...profile,
                        expectedSalaryMax: parseSalaryInput(e.target.value === '' ? '' : e.target.value),
                      })
                    }
                  />
                </div>
              ) : (
                <div className="drive-info-value">
                  {hasSalary ? (
                    <>
                      ₹{(Number(profile.expectedSalaryMin) / 100000).toFixed(1)}L – ₹
                      {(Number(profile.expectedSalaryMax) / 100000).toFixed(1)}L PA
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              )}
            </div>
            <div className="drive-info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="drive-info-label">Preferred locations (comma-separated)</div>
              {editing ? (
                <input
                  className="form-input"
                  value={profile.preferredLocations}
                  onChange={(e) => persist({ ...profile, preferredLocations: e.target.value })}
                  placeholder="Bangalore, Hyderabad, Remote…"
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {locList.map((loc, i) => (
                    <span key={i} className="badge badge-blue">
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="drive-info-item">
              <div className="drive-info-label">Willing to relocate</div>
              {editing ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profile.willingToRelocate}
                    onChange={(e) => persist({ ...profile, willingToRelocate: e.target.checked })}
                  />
                  Yes
                </label>
              ) : (
                <div className="drive-info-value">{profile.willingToRelocate ? '✅ Yes' : '❌ No'}</div>
              )}
            </div>
          </div>
        </div>
        )}

        {activeTab === 'links' && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title">🔗 Profiles, projects & websites</h3>
            {editing && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addProfileLink}>
                + Add link
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {linksList.length === 0 && (
              <p className="text-sm text-secondary">No links yet. Add LinkedIn, GitHub, a general site, or a project link.</p>
            )}
            {linksList.map((link) => (
              <div key={link.id} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                {editing ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label
                          className="form-label text-xs"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-tertiary)' }}
                        >
                          <ProfileLinkKindIcon kind={link.kind} />
                          Type
                        </label>
                        <select className="form-select" value={link.kind} onChange={(e) => updateLink(link.id, { kind: e.target.value })}>
                          {LINK_KINDS.map((k) => (
                            <option key={k.value} value={k.value}>
                              {k.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-xs">Title / label</label>
                        <input className="form-input" value={link.title} onChange={(e) => updateLink(link.id, { title: e.target.value })} placeholder="e.g. My GitHub" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label text-xs">URL</label>
                        <input className="form-input" value={link.url} onChange={(e) => updateLink(link.id, { url: e.target.value })} placeholder="https://…" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label text-xs">Description</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={link.description}
                          onChange={(e) => updateLink(link.id, { description: e.target.value })}
                          placeholder="What’s on this profile or in this repo? Key projects, stack, etc."
                        />
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLink(link.id)}>
                      Remove link
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', minWidth: 0 }}>
                        <div style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }}>
                          <ProfileLinkKindIcon kind={link.kind} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                        <div className="text-xs font-bold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {LINK_KINDS.find((k) => k.value === link.kind)?.label || link.kind}
                        </div>
                        <a href={link.url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {link.title || link.url || 'Untitled'}
                        </a>
                        {link.description && <p className="text-sm text-secondary" style={{ margin: '0.35rem 0 0', lineHeight: 1.5 }}>{link.description}</p>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {activeTab === 'about' && (
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">📝 About me</h3>
        </div>
        {editing ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label
                className={`btn btn-secondary btn-sm${avatarUploading ? ' disabled' : ''}`}
                style={{ cursor: avatarUploading ? 'wait' : 'pointer', margin: 0, opacity: avatarUploading ? 0.7 : 1 }}
              >
                {avatarUploading ? '⏳ Uploading photo…' : '📷 Update photo'}
                <input
                  type="file"
                  accept={studentAvatarAcceptAttr()}
                  hidden
                  disabled={avatarUploading}
                  onChange={onAvatarChange}
                />
              </label>
              <label
                className={`btn btn-secondary btn-sm${cvUploading ? ' disabled' : ''}`}
                style={{ cursor: cvUploading ? 'wait' : 'pointer', margin: 0, opacity: cvUploading ? 0.7 : 1 }}
              >
                {cvUploading ? '⏳ Uploading CV…' : '📄 Upload CV / Resume'}
                <input type="file" accept={STUDENT_DOCUMENT_ACCEPT_ATTR} hidden disabled={cvUploading} onChange={onCvChange} />
              </label>
            </div>
            <textarea className="form-textarea" value={profile.bio} onChange={(e) => persist({ ...profile, bio: e.target.value })} rows={4} />
          </div>
        ) : (
          <p className="text-sm" style={{ lineHeight: 1.7 }}>
            {profile.bio || '—'}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
