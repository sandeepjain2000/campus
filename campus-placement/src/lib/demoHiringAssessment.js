/**
 * Demo hiring pipeline — round names are fixed for now (company-configurable later).
 * Intended to feed reports / dashboards.
 */

export const HIRING_ROUNDS = [
  { id: 'aptitude', name: 'Aptitude', short: 'APT' },
  { id: 'gd', name: 'Group Discussion', short: 'GD' },
  { id: 'interviews', name: 'Interviews', short: 'INT' },
];

/** @type {{ student: string, roll: string, campus: string, rounds: Record<string, { status: string, detail: string }> }[]} */
export const MOCK_HIRING_ASSESSMENT = [
  {
    student: 'Arjun Verma',
    roll: 'CS21001',
    campus: 'IIT Madras',
    rounds: {
      aptitude: { status: 'Qualified', detail: '82 / 100' },
      gd: { status: 'Qualified', detail: 'B+' },
      interviews: { status: 'Shortlisted', detail: 'Awaiting HR' },
    },
  },
  {
    student: 'Sneha Iyer',
    roll: 'CS21044',
    campus: 'IIT Madras',
    rounds: {
      aptitude: { status: 'Qualified', detail: '91 / 100' },
      gd: { status: 'Not invited', detail: '—' },
      interviews: { status: '—', detail: '—' },
    },
  },
  {
    student: 'Rohan Patel',
    roll: 'EC21009',
    campus: 'IIT Madras',
    rounds: {
      aptitude: { status: 'Waitlisted', detail: '68 / 100' },
      gd: { status: '—', detail: '—' },
      interviews: { status: '—', detail: '—' },
    },
  },
];
