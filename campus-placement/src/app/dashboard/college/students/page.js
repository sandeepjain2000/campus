'use client';
import { useState, useCallback } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';

const firstNames = ['Arjun', 'Sneha', 'Rohan', 'Kavya', 'Amit', 'Priya', 'Rahul', 'Divya', 'Vikram', 'Neha', 'Karan', 'Pooja', 'Siddharth', 'Anjali', 'Raj', 'Meera'];
const lastNames = ['Verma', 'Iyer', 'Patel', 'Reddy', 'Sharma', 'Nair', 'Shah', 'Joshi', 'Singh', 'Gupta', 'Rao', 'Deshmukh', 'Menon', 'Das', 'Sen', 'Kapoor'];
const depts = ['Computer Science', 'Electronics', 'Mechanical', 'Information Technology', 'Civil'];
const baseSkills = ['React', 'Node.js', 'Python', 'Java', 'Spring Boot', 'SQL', 'C++', 'IoT', 'Embedded C', 'Figma', 'UI/UX', 'CSS', 'AutoCAD', 'SolidWorks', 'Machine Learning', 'AWS', 'JavaScript', 'Docker', 'Data Analysis'];
const specializations = ['AI & ML', 'Cyber Security', 'Data Science', 'Cloud Computing', 'Robotics', 'Embedded Systems'];
const disabilityOptions = ['None', 'Locomotor', 'Visual', 'Hearing', 'Neurodivergent'];
const genders = ['Male', 'Female', 'Non-binary'];

const mockStudents = Array.from({ length: 30 }, (_, i) => {
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const dept = depts[Math.floor(Math.random() * depts.length)];
  const rollPrefix = dept === 'Computer Science' || dept === 'Information Technology' ? 'CS' : dept === 'Electronics' ? 'EC' : dept === 'Mechanical' ? 'ME' : 'CV';
  const shuffledSkills = [...baseSkills].sort(() => 0.5 - Math.random());
  const specialization = dept === 'Computer Science' || dept === 'Information Technology'
    ? specializations[Math.floor(Math.random() * specializations.length)]
    : dept === 'Electronics'
      ? 'Embedded Systems'
      : 'Core Engineering';
  const disabilityStatus = Math.random() > 0.88
    ? disabilityOptions[Math.floor(Math.random() * (disabilityOptions.length - 1)) + 1]
    : 'None';
  const gender = genders[Math.floor(Math.random() * genders.length)];

  return {
    id: i + 1,
    name: `${fName} ${lName}`,
    photo: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
    roll: `${rollPrefix}2021${String(i + 1).padStart(3, '0')}`,
    dept,
    specialization,
    gender,
    disabilityStatus,
    cgpa: Number((Math.random() * 3 + 6.5).toFixed(2)),
    status: Math.random() > 0.6 ? 'placed' : 'unplaced',
    verified: Math.random() > 0.2,
    skills: shuffledSkills.slice(0, Math.floor(Math.random() * 3) + 2),
  };
});

export default function CollegeStudentsPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  const filtered = mockStudents.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.roll.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && s.dept !== deptFilter) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    if (specializationFilter && s.specialization !== specializationFilter) return false;
    if (skillFilter && !s.skills.some((skill) => skill.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    return true;
  });

  const getStudentCsv = useCallback((scope) => {
    const list = scope === 'current' ? filtered : mockStudents;
    const headers = ['Name', 'Roll', 'Department', 'Specialization', 'Gender', 'Disability', 'Skills', 'CGPA', 'Status', 'Verified'];
    const rows = list.map((s) => [
      s.name,
      s.roll,
      s.dept,
      s.specialization,
      s.gender,
      s.disabilityStatus,
      s.skills.join('; '),
      String(s.cgpa),
      s.status,
      s.verified ? 'Yes' : 'No',
    ]);
    return { headers, rows };
  }, [filtered]);

  const uniqueSpecializations = Array.from(new Set(mockStudents.map((s) => s.specialization)));

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎓 Manage Students</h1>
          <p>Includes profile photos, specialization, and diversity records.</p>
        </div>
        <div className="page-header-actions">
          <ExportCsvSplitButton
            filenameBase="students"
            currentCount={filtered.length}
            fullCount={mockStudents.length}
            getRows={getStudentCsv}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" placeholder="🔍 Search by name or roll..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
          <input className="form-input" placeholder="💡 Search by skill..." value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} style={{ maxWidth: 180 }} />
          <select className="form-select" style={{ width: 'auto' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)}>
            <option value="">All Specializations</option>
            {uniqueSpecializations.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="unplaced">Unplaced</option>
            <option value="placed">Placed</option>
          </select>
          <div className="text-sm text-secondary">{filtered.length} students</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Student</th>
              <th>Roll</th>
              <th>Dept</th>
              <th>Specialization</th>
              <th>Diversity</th>
              <th>CGPA</th>
              <th>Status</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, index) => (
              <tr key={s.id}>
                <td style={{ color: 'var(--text-tertiary)' }}>{index + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img
                      src={s.photo}
                      alt={`${s.name} profile`}
                      width={32}
                      height={32}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }}
                    />
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-tertiary">{s.skills.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm font-mono">{s.roll}</td>
                <td className="text-sm">{s.dept}</td>
                <td><span className="badge badge-indigo">{s.specialization}</span></td>
                <td className="text-sm">
                  <div>{s.gender}</div>
                  <div className="text-xs text-tertiary">{s.disabilityStatus === 'None' ? 'No disability record' : s.disabilityStatus}</div>
                </td>
                <td><span className="font-bold" style={{ color: s.cgpa >= 8 ? 'var(--success-600)' : 'inherit' }}>{s.cgpa}</span></td>
                <td><span className={`badge badge-${getStatusColor(s.status)} badge-dot`}>{formatStatus(s.status)}</span></td>
                <td>{s.verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-amber">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
