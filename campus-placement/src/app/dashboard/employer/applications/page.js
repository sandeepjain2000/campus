'use client';
import { useState, useCallback, useMemo } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { useToast } from '@/components/ToastProvider';

const mockApps = [
  { id: 1, name: 'Arjun Verma', email: 'arjun@iitm.edu', photo: 'https://i.pravatar.cc/64?img=12', role: 'SDE', college: 'IIT Mumbai', degree: 'B.Tech', branch: 'CSE', specialization: 'AI & ML', cgpa: 8.72, status: 'shortlisted', skills: ['Python', 'JavaScript', 'React'], resumeUrl: '/samples/resume-arjun.pdf' },
  { id: 2, name: 'Sneha Iyer', email: 'sneha@iitm.edu', photo: 'https://i.pravatar.cc/64?img=5', role: 'SDE', college: 'IIT Mumbai', degree: 'B.Tech', branch: 'CSE', specialization: 'Data Science', cgpa: 9.15, status: 'in_progress', skills: ['Python', 'TensorFlow', 'NLP'], resumeUrl: '/samples/resume-sneha.pdf' },
  { id: 3, name: 'Rohan Patel', email: 'rohan@iitm.edu', photo: 'https://i.pravatar.cc/64?img=33', role: 'Full Stack Dev', college: 'IIT Mumbai', degree: 'B.Tech', branch: 'ECE', specialization: 'Embedded Systems', cgpa: 7.65, status: 'applied', skills: ['C/C++', 'Arduino', 'Python'], resumeUrl: '/samples/resume-rohan.pdf' },
  { id: 4, name: 'Kavya Reddy', email: 'kavya@iitm.edu', photo: 'https://i.pravatar.cc/64?img=45', role: 'SDE', college: 'IIT Mumbai', degree: 'Dual Degree', branch: 'CSE', specialization: 'Cyber Security', cgpa: 8.45, status: 'selected', skills: ['React', 'Node.js', 'PostgreSQL'], resumeUrl: '/samples/resume-kavya.pdf' },
  { id: 5, name: 'Amit Sharma', email: 'amit@iitm.edu', photo: 'https://i.pravatar.cc/64?img=52', role: 'SDE', college: 'IIT Mumbai', degree: 'B.Tech', branch: 'ME', specialization: 'Robotics', cgpa: 7.2, status: 'rejected', skills: ['AutoCAD', 'MATLAB'], resumeUrl: '/samples/resume-amit.pdf' },
];

/** @param {string} band */
function cgpaMatchesBand(cgpa, band) {
  if (!band) return true;
  const g = Number(cgpa);
  if (band === 'gte9') return g >= 9;
  if (band === '8to9') return g >= 8 && g < 9;
  if (band === '7to8') return g >= 7 && g < 8;
  if (band === 'lt7') return g < 7;
  return true;
}

export default function EmployerApplicationsPage() {
  const { addToast } = useToast();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [gradeBand, setGradeBand] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const colleges = Array.from(new Set(mockApps.map((a) => a.college)));
  const degrees = Array.from(new Set(mockApps.map((a) => a.degree)));
  const specializations = Array.from(new Set(mockApps.map((a) => a.specialization)));

  const filtered = useMemo(
    () =>
      mockApps.filter((a) => {
        if (filter && a.status !== filter) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (collegeFilter && a.college !== collegeFilter) return false;
        if (skillFilter && !a.skills.some((skill) => skill.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
        if (degreeFilter && a.degree !== degreeFilter) return false;
        if (specializationFilter && a.specialization !== specializationFilter) return false;
        if (!cgpaMatchesBand(a.cgpa, gradeBand)) return false;
        return true;
      }),
    [filter, search, collegeFilter, skillFilter, degreeFilter, specializationFilter, gradeBand],
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };

  const bulkDownloadCvs = () => {
    const picked = filtered.filter((a) => selectedIds.has(a.id) && a.resumeUrl);
    if (!picked.length) {
      addToast('Select at least one applicant with a CV.', 'warning');
      return;
    }
    picked.forEach((app, i) => {
      window.setTimeout(() => {
        const a = document.createElement('a');
        a.href = app.resumeUrl;
        a.download = `${app.name.replace(/\s+/g, '_')}_CV.pdf`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 450);
    });
    addToast(`Started ${picked.length} CV download(s). Allow pop-ups if the browser blocks multiple files.`, 'info');
  };

  const getApplicationsCsv = useCallback(
    (scope) => {
      const list = scope === 'current' ? filtered : mockApps;
      const headers = ['Student', 'Email', 'College', 'Degree', 'Branch', 'Specialization', 'CGPA', 'Role', 'Status', 'Skills'];
      const rows = list.map((a) => [
        a.name,
        a.email,
        a.college,
        a.degree,
        a.branch,
        a.specialization,
        String(a.cgpa),
        a.role,
        a.status,
        a.skills.join('; '),
      ]);
      return { headers, rows };
    },
    [filtered],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📋 Applications</h1>
          <p>Review and manage student applications</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton filenameBase="applications" currentCount={filtered.length} fullCount={mockApps.length} getRows={getApplicationsCsv} />
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>
          All ({mockApps.length})
        </button>
        <button className={`tab ${filter === 'applied' ? 'active' : ''}`} onClick={() => setFilter('applied')}>
          New
        </button>
        <button className={`tab ${filter === 'shortlisted' ? 'active' : ''}`} onClick={() => setFilter('shortlisted')}>
          Shortlisted R1
        </button>
        <button className={`tab ${filter === 'shortlisted_int' ? 'active' : ''}`} onClick={() => setFilter('shortlisted_int')}>
          Shortlisted Int
        </button>
        <button className={`tab ${filter === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter('in_progress')}>
          In Progress
        </button>
        <button className={`tab ${filter === 'selected' ? 'active' : ''}`} onClick={() => setFilter('selected')}>
          Selected
        </button>
        <button className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
          Rejected
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="🔍 Search students..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
          <select className="form-input" value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Colleges</option>
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="form-input" value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Degrees</option>
            {degrees.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select className="form-input" value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">All Specialisations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="form-input" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All grades (CGPA)</option>
            <option value="gte9">CGPA ≥ 9.0</option>
            <option value="8to9">CGPA 8.0 – 8.99</option>
            <option value="7to8">CGPA 7.0 – 7.99</option>
            <option value="lt7">CGPA &lt; 7.0</option>
          </select>
          <input className="form-input" placeholder="💡 Search by skill..." value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} style={{ maxWidth: 200 }} />
          <div className="text-sm text-secondary">{filtered.length} results</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" type="button" onClick={bulkDownloadCvs}>
              📄 Download CVs (bulk)
            </button>
            <button className="btn btn-success btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
              ✅ Bulk Shortlist
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} aria-label="Select all in view" />
              </th>
              <th>Student</th>
              <th>Degree</th>
              <th>Branch</th>
              <th>Specialisation</th>
              <th>CGPA</th>
              <th>Role</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleRow(app.id)} aria-label={`Select ${app.name}`} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={app.photo}
                      alt=""
                      width={32}
                      height={32}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{app.name}</div>
                      <div className="text-xs text-tertiary">{app.college}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{app.degree}</td>
                <td>{app.branch}</td>
                <td>
                  <span className="badge badge-indigo">{app.specialization}</span>
                </td>
                <td>
                  <span className="font-bold" style={{ color: app.cgpa >= 8 ? 'var(--success-600)' : 'inherit' }}>
                    {app.cgpa}
                  </span>
                </td>
                <td className="text-sm">{app.role}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {app.skills.slice(0, 2).map((s) => (
                      <span key={s} className="badge badge-gray">
                        {s}
                      </span>
                    ))}
                    {app.skills.length > 2 && <span className="badge badge-gray">+{app.skills.length - 2}</span>}
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${getStatusColor(app.status)} badge-dot`}>{formatStatus(app.status)}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" title="View Profile" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                      👁️
                    </button>
                    {app.resumeUrl && (
                      <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="View/Download Resume">
                        📄 CV
                      </a>
                    )}
                    {app.status === 'applied' && (
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                        Shortlist
                      </button>
                    )}
                    {app.status === 'shortlisted' && (
                      <button className="btn btn-success btn-sm" onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                        Advance
                      </button>
                    )}
                    {app.status !== 'rejected' && app.status !== 'selected' && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => alert('Feature coming soon! (Wireframe Action)')}>
                        Reject
                      </button>
                    )}
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
