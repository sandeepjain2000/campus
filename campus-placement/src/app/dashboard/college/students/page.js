'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { ExportCsvSplitButton } from '@/components/export/ExportCsvSplitButton';
import { ImportCsvSplitButton } from '@/components/import/ImportCsvSplitButton';
import { parseCsv, downloadCsvFromRows } from '@/lib/csvExport';
import {
  CURRENT_ACADEMIC_YEAR,
  CURRENT_SEMESTER,
  STUDENT_CSV_HEADERS,
  studentToCsvRow,
  studentCsvTemplateExampleRow,
  validateStudentCsvHeaders,
  parseStudentRow,
} from '@/lib/collegeStudentsCsv';
import { useToast } from '@/components/ToastProvider';

const firstNames = ['Arjun', 'Sneha', 'Rohan', 'Kavya', 'Amit', 'Priya', 'Rahul', 'Divya', 'Vikram', 'Neha', 'Karan', 'Pooja', 'Siddharth', 'Anjali', 'Raj', 'Meera'];
const lastNames = ['Verma', 'Iyer', 'Patel', 'Reddy', 'Sharma', 'Nair', 'Shah', 'Joshi', 'Singh', 'Gupta', 'Rao', 'Deshmukh', 'Menon', 'Das', 'Sen', 'Kapoor'];
const depts = ['Computer Science', 'Electronics', 'Mechanical', 'Information Technology', 'Civil'];
const baseSkills = ['React', 'Node.js', 'Python', 'Java', 'Spring Boot', 'SQL', 'C++', 'IoT', 'Embedded C', 'Figma', 'UI/UX', 'CSS', 'AutoCAD', 'SolidWorks', 'Machine Learning', 'AWS', 'JavaScript', 'Docker', 'Data Analysis'];
const specializations = ['AI & ML', 'Cyber Security', 'Data Science', 'Cloud Computing', 'Robotics', 'Embedded Systems'];
const disabilityOptions = ['None', 'Locomotor', 'Visual', 'Hearing', 'Neurodivergent'];
const genders = ['Male', 'Female', 'Non-binary'];
const semestersPool = ['4', '5', '6', '7', '8'];
const jobStatusesPool = ['unplaced', 'placed', 'opted_out', 'higher_studies'];
const internshipStatusesPool = ['none', 'ongoing', 'completed'];
const diversityPool = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];

function buildMockStudents() {
  return Array.from({ length: 30 }, (_, i) => {
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
      academicYear: CURRENT_ACADEMIC_YEAR,
      semester: semestersPool[Math.floor(Math.random() * semestersPool.length)],
      name: `${fName} ${lName}`,
      photo: `https://i.pravatar.cc/64?img=${(i % 70) + 1}`,
      roll: `${rollPrefix}2021${String(i + 1).padStart(3, '0')}`,
      dept,
      specialization,
      gender,
      disabilityStatus,
      diversityCategory: diversityPool[Math.floor(Math.random() * diversityPool.length)],
      cgpa: Number((Math.random() * 3 + 6.5).toFixed(2)),
      jobStatus: jobStatusesPool[Math.floor(Math.random() * jobStatusesPool.length)],
      internshipStatus: internshipStatusesPool[Math.floor(Math.random() * internshipStatusesPool.length)],
      verified: Math.random() > 0.2,
      skills: shuffledSkills.slice(0, Math.floor(Math.random() * 3) + 2),
    };
  });
}

function mergeImportedStudents(prev, imported) {
  const byRoll = new Map(prev.map((s) => [s.roll.toLowerCase(), { ...s, skills: [...s.skills] }]));
  let maxId = prev.reduce((m, s) => Math.max(m, s.id), 0);
  for (const u of imported) {
    const key = u.roll.toLowerCase();
    if (byRoll.has(key)) {
      const ex = byRoll.get(key);
      byRoll.set(key, {
        ...ex,
        ...u,
        id: ex.id,
        skills: [...u.skills],
      });
    } else {
      maxId += 1;
      byRoll.set(key, { ...u, id: maxId, skills: [...u.skills] });
    }
  }
  return Array.from(byRoll.values());
}

export default function CollegeStudentsPage() {
  const { addToast } = useToast();
  const [students, setStudents] = useState(buildMockStudents);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [internshipStatusFilter, setInternshipStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState(null);
  const [importBusy, setImportBusy] = useState(false);

  const filtered = useMemo(() => students.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.roll.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && s.dept !== deptFilter) return false;
    if (jobStatusFilter && s.jobStatus !== jobStatusFilter) return false;
    if (internshipStatusFilter && s.internshipStatus !== internshipStatusFilter) return false;
    if (specializationFilter && s.specialization !== specializationFilter) return false;
    if (semesterFilter && s.semester !== semesterFilter) return false;
    if (skillFilter && !s.skills.some((skill) => skill.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    return true;
  }), [students, search, deptFilter, jobStatusFilter, internshipStatusFilter, specializationFilter, semesterFilter, skillFilter]);

  const getStudentCsv = useCallback((scope) => {
    const list = scope === 'current' ? filtered : students;
    const headers = [...STUDENT_CSV_HEADERS];
    const rows = list.map((s) => studentToCsvRow(s));
    return { headers, rows };
  }, [filtered, students]);

  const uniqueSpecializations = useMemo(
    () => Array.from(new Set(students.map((s) => s.specialization))),
    [students],
  );

  const downloadTemplate = useCallback(() => {
    downloadCsvFromRows(
      'students_import_template',
      [...STUDENT_CSV_HEADERS],
      [studentCsvTemplateExampleRow()],
    );
  }, []);

  const onImportFile = useCallback(
    async (file) => {
      setImportBusy(true);
      try {
        const text = await file.text();
        const { headers, rows } = parseCsv(text);
        const check = validateStudentCsvHeaders(headers);
        if (!check.ok) {
          addToast(check.error, 'error');
          return;
        }
        const { idx } = check;
        const imported = [];
        const errors = [];
        rows.forEach((cells, i) => {
          const line = i + 2;
          const r = parseStudentRow(cells, idx, line);
          if (!r.ok) errors.push(r.error);
          else imported.push(r.student);
        });
        if (errors.length) {
          addToast(errors.slice(0, 5).join(' · '), 'error');
          if (errors.length > 5) addToast(`…and ${errors.length - 5} more issues`, 'warning');
          return;
        }
        if (imported.length === 0) {
          addToast('No data rows found in CSV', 'warning');
          return;
        }
        setStudents((prev) => mergeImportedStudents(prev, imported));
        addToast(`Imported ${imported.length} row(s); matched by roll number`, 'success');
      } catch {
        addToast('Could not read CSV file', 'error');
      } finally {
        setImportBusy(false);
      }
    },
    [addToast],
  );

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎓 Manage Students</h1>
          <p>
            Academic year <strong className="font-mono">{CURRENT_ACADEMIC_YEAR}</strong>
            {' · '}
            Semester <strong className="font-mono">{CURRENT_SEMESTER}</strong>
            {' — '}
            Export and import use the same CSV columns (all fields). Click a row to open the full profile.
          </p>
        </div>
      </div>

      <div
        className="card students-csv-toolbar"
        style={{
          marginBottom: '1rem',
          padding: '0.875rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div className="text-sm text-secondary" style={{ maxWidth: '36rem', lineHeight: 1.45 }}>
          <strong className="text-primary">CSV</strong>
          {' — '}
          Export or import the full roster (job and internship status, diversity category, etc.). Matches filters for export when views differ.
        </div>
        <div className="students-csv-toolbar-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <ExportCsvSplitButton
            filenameBase="students"
            currentCount={filtered.length}
            fullCount={students.length}
            getRows={getStudentCsv}
          />
          <ImportCsvSplitButton
            onFileSelected={onImportFile}
            onDownloadTemplate={downloadTemplate}
            busy={importBusy}
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
          <select className="form-select" style={{ width: 'auto' }} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {['1', '2', '3', '4', '5', '6', '7', '8'].map((sem) => (
              <option key={sem} value={sem}>{`Semester ${sem}`}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value)}>
            <option value="">All job statuses</option>
            <option value="unplaced">Job: Unplaced</option>
            <option value="placed">Job: Placed</option>
            <option value="opted_out">Job: Opted out</option>
            <option value="higher_studies">Job: Higher studies</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={internshipStatusFilter} onChange={(e) => setInternshipStatusFilter(e.target.value)}>
            <option value="">All internship statuses</option>
            <option value="none">Internship: None</option>
            <option value="ongoing">Internship: Ongoing</option>
            <option value="completed">Internship: Completed</option>
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
              <th>Sem</th>
              <th>CGPA</th>
              <th>Job</th>
              <th>Internship</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, index) => (
              <tr
                key={s.id}
                role="button"
                tabIndex={0}
                className="student-row-clickable"
                onClick={() => setDetailStudent(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailStudent(s);
                  }
                }}
              >
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
                <td className="text-sm font-mono">{s.semester}</td>
                <td><span className="font-bold" style={{ color: s.cgpa >= 8 ? 'var(--success-600)' : 'inherit' }}>{s.cgpa}</span></td>
                <td><span className={`badge badge-${getStatusColor(s.jobStatus)} badge-dot`}>{formatStatus(s.jobStatus)}</span></td>
                <td><span className={`badge badge-${getStatusColor(s.internshipStatus)} badge-dot`}>{formatStatus(s.internshipStatus)}</span></td>
                <td>{s.verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-amber">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailStudent && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailStudent(null);
          }}
        >
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
            <div className="modal-header">
              <h2 className="modal-title" id="student-detail-title">Student record</h2>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setDetailStudent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <img
                  src={detailStudent.photo}
                  alt=""
                  width={72}
                  height={72}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }}
                />
                <div>
                  <div className="text-lg font-semibold">{detailStudent.name}</div>
                  <div className="text-sm text-secondary font-mono">{detailStudent.roll}</div>
                  <div className="text-sm text-secondary mt-1">
                    {detailStudent.academicYear}
                    {' · '}
                    Semester
                    {' '}
                    {detailStudent.semester}
                  </div>
                </div>
              </div>
              <dl className="student-detail-dl">
                <dt>Department</dt>
                <dd>{detailStudent.dept}</dd>
                <dt>Specialization</dt>
                <dd>{detailStudent.specialization}</dd>
                <dt>CGPA</dt>
                <dd>{detailStudent.cgpa}</dd>
                <dt>Skills</dt>
                <dd>{detailStudent.skills.length ? detailStudent.skills.join(', ') : '—'}</dd>
                <dt>Job status</dt>
                <dd><span className={`badge badge-${getStatusColor(detailStudent.jobStatus)} badge-dot`}>{formatStatus(detailStudent.jobStatus)}</span></dd>
                <dt>Internship status</dt>
                <dd><span className={`badge badge-${getStatusColor(detailStudent.internshipStatus)} badge-dot`}>{formatStatus(detailStudent.internshipStatus)}</span></dd>
                <dt>Verified</dt>
                <dd>{detailStudent.verified ? 'Yes' : 'No'}</dd>
                <dt>Gender</dt>
                <dd>{detailStudent.gender}</dd>
                <dt>Disability status</dt>
                <dd>{detailStudent.disabilityStatus}</dd>
                <dt>Diversity category</dt>
                <dd>{detailStudent.diversityCategory}</dd>
                <dt>Photo URL</dt>
                <dd style={{ wordBreak: 'break-all' }}>{detailStudent.photo}</dd>
              </dl>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDetailStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
