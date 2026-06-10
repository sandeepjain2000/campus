/**
 * In-app Developer page — QA runbook (Guided Runner + demo tools).
 * Route: /developer — keep in sync with qa/guided/RUNNER_QUICKSTART.md
 */

export const DEVELOPER_PAGE_META = {
  title: 'Developer',
  notesTitle: 'Developer notes',
  subtitle: 'Guided Runner, partial automated testing, demo data, and cleanup — for when you return after a break.',
  repoPath: 'campus-placement',
  terminalHelp: 'npm run test:guided:help',
};

/** Table of contents for /developer — keep in sync with DeveloperPage section ids. */
export const DEVELOPER_PAGE_TOC = [
  { id: 'quick-start', label: 'Quick start', hint: 'npm run dev + guided help' },
  { id: 'playbooks', label: 'Guided playbooks', hint: 'Partial E2E flows by scenario' },
  { id: 'runner-alerts', label: 'Runner alerts', hint: 'Recent UI / menu changes' },
  { id: 'email-demo', label: 'Email & demo mail', hint: 'YOPmail, workflows preview' },
  { id: 'e2e-roles', label: 'Internship E2E roles', hint: 'Who does what in full cycle' },
  { id: 'panel', label: 'Next button', hint: 'How the screen tag works' },
  { id: 'screen-tag', label: 'Screen tag states', hint: 'Armed, idle, running' },
  { id: 'marker', label: 'Session marker', hint: 'GT- titles link publish → apply' },
  { id: 'logins', label: 'Demo logins', hint: 'Employer, college, student' },
  { id: 'cleanup', label: 'Clean up & restore', hint: 'Full wipe + restore tie-ups' },
  { id: 'legacy', label: 'Legacy commands', hint: 'Sync routes, focus areas' },
  { id: 'related', label: 'Related files', hint: 'Markdown & SQL in repo' },
];

/** @deprecated use DEVELOPER_PAGE_META */
export const DEVELOPER_NOTES_META = DEVELOPER_PAGE_META;

export const QUICK_START_STEPS = [
  { step: '0', command: 'npm run dev', detail: 'Start the app (terminal 1 — leave running)' },
  { step: '1', command: 'npm run test:guided:help', detail: 'Print cheat sheet in terminal 2' },
  { step: '2', command: '(pick a playbook below)', detail: 'Run in terminal 2 from the app folder' },
];

export const GUIDED_PLAYBOOKS = [
  {
    goal: 'Full placement drive cycle — Employer → College → Student → Employer',
    command: 'npm run test:guided:playbook-drives-e2e',
    focus: 'DRV-E04/05, DRV-C03, DRV-S04, DRV-E12/13, DRV-S10',
  },
  {
    goal: 'Employer requests placement drive + college approves',
    command: 'npm run test:guided:playbook-drives',
    focus: 'DRV-E04, DRV-E05, DRV-C03',
  },
  {
    goal: 'Student apply + employer select (after drive request)',
    command: 'npm run test:guided:playbook-drives-apply',
    focus: 'DRV-C03, DRV-S04, DRV-E12, DRV-E13, DRV-S10',
  },
  {
    goal: 'Browse Focus Areas drive cases (navigation only — no CSV)',
    command: 'npm run test:guided:drives',
    focus: 'placement-drives section',
  },
  {
    goal: 'Full internship cycle — Employer → College → Student → Employer (recommended)',
    command: 'npm run test:guided:playbook-e2e',
    focus: 'EI-02/03, CI-01, SI-04, EI-15/16, SI-09',
  },
  {
    goal: 'Employer publishes internship only (form fill + publish)',
    command: 'npm run test:guided:playbook',
    focus: 'EI-02, EI-03',
  },
  {
    goal: 'College → student apply → employer select (after publish)',
    command: 'npm run test:guided:playbook-apply',
    focus: 'CI-01, SI-04, EI-15, EI-16, SI-09',
  },
  {
    goal: 'Split E2E (two terminals / two sessions)',
    command: 'npm run test:guided:playbook then test:guided:playbook-apply',
    focus: 'Uses SQLite marker between runs',
  },
  {
    goal: 'List all playbooks',
    command: 'npm run test:guided:playbook-list',
    focus: '—',
  },
  {
    goal: 'Fix empty approved campuses (IIT Madras for all employers)',
    command: 'npm run qa:ensure-partnership',
    focus: 'SETUP',
  },
  {
    goal: 'Fix TechCorp approved campuses (hr@techcorp.com × all active colleges)',
    command: 'npm run qa:ensure-techcorp-partnerships',
    focus: 'SETUP — before internship apply/select playbook',
  },
  {
    goal: 'Restore all demo tie-ups (IITM + NITT + BITS × 5 demo employers)',
    command: 'Landing → Demo APIs → Campus tie-ups → Restore all demo tie-ups',
    focus: 'SETUP after cleanup',
  },
  {
    goal: 'Legacy: IIT Madras tie-up only (demo employers)',
    command: 'Open /data-entry → Campus tie-ups → Ensure IIT Madras tie-up',
    focus: 'SETUP',
  },
];

export const RUNNER_PANEL_STEPS = [
  'One browser window — step instructions print in the terminal running npm run test:guided:playbook-e2e.',
  'One blue screen-tag click per step when it pulses (Alt+Enter works). Read Observe in the terminal, then click.',
  'While automation runs, the tag fades and is not clickable — wait for the next pulse.',
  'See Screen tag states below for armed / idle / running.',
  'Landing banner: Developer · Data links beside the YOPmail line.',
  'Disable globally: NEXT_PUBLIC_HIDE_GUIDED_RUNNER=true.',
];

/** Screen tag (S-xx / LANDING / LOGIN) — top-right during guided tests. */
export const SCREEN_TAG_STATES = [
  {
    look: 'Blue + yellow border + pulse',
    state: 'Armed',
    meaning: 'Click it (or press Alt+Enter) to run this step. Read Observe in the terminal first.',
    previewClass: 'dev-notes-tag-preview--armed',
  },
  {
    look: 'Red/pink, no pulse',
    state: 'Idle',
    meaning: 'Playbook is running, but this step is not waiting for you yet — check the terminal.',
    previewClass: 'dev-notes-tag-preview--idle',
  },
  {
    look: 'Blue, faded / not clickable',
    state: 'Running',
    meaning: 'Automation is in progress — wait until it finishes.',
    previewClass: 'dev-notes-tag-preview--running',
  },
];

export const SCREEN_TAG_ARMED_CLICKS = [
  'One armed click runs the step (login, navigate, fill, publish, etc.) and advances to the next step automatically.',
  'Read Observe in the terminal before each click — you control pace by waiting for the pulse.',
];

export const SCREEN_TAG_STUCK_TIPS = [
  'One click, then wait — if the tag turns green, the click worked; wait for automation or the next armed pulse.',
  'Alt+Enter — same as clicking the tag when it is armed.',
  'If it shakes — the step is not ready yet; check the playbook terminal for the current step.',
];

export const SESSION_MARKER_NOTES = [
  'Full-cycle playbook (npm run test:guided:playbook-e2e) runs all roles in one session — ~40 steps, one GT- marker.',
  'Placement drive playbooks: test:guided:playbook-drives-e2e (full), playbook-drives (request + approve), playbook-drives-apply (apply + select). CSV export/upload on drives is still manual — see qa/MANUAL_TEST_PLAYBOOK.md.',
  'Publish-only or apply-only playbooks still available for partial testing.',
  'Publish playbook creates a title like GT-20260529T1530 Summer Data Intern.',
  'Marker + every step event are stored in db/sqlite/guided_testing.sqlite (laptop only).',
  'View log: npm run qa:guided:db-log',
  'Apply playbook reads guided_session.marker to find the same internship.',
  'Override (PowerShell): $env:PH_GUIDED_MARKER="GT-..."; npm run test:guided:playbook-apply',
];

export const INTERNSHIP_E2E_ROLES = [
  { role: 'Employer', steps: 'Partnership (if needed), publish internship with GT- marker', account: 'hr@techcorp.com' },
  { role: 'College', steps: 'Approve tie-up (if needed), verify posting on campus list', account: 'admin@iitm.edu' },
  { role: 'Student', steps: 'Browse internships, apply to GT- posting', account: 'arjun.verma@iitm.edu' },
  { role: 'Employer', steps: 'Shortlist and Select applicant on Applications → Internships', account: 'hr@techcorp.com' },
  { role: 'Closure', steps: 'Student confirms Selected on My Applications', account: 'arjun.verma@iitm.edu' },
];

export const DEMO_LOGINS = [
  { role: 'Employer', email: 'hr@techcorp.com' },
  { role: 'College admin', email: 'admin@iitm.edu' },
  { role: 'Student', email: 'arjun.verma@iitm.edu' },
];

export const DEMO_PASSWORD = 'Admin@123';

/** Shown on /developer and in npm run test:guided:help — keep current after UI/menu changes. */
export const RUNNER_CHANGE_ALERTS = [
  {
    date: '2026-06-09',
    title: 'Cleanup & demo sandbox',
    items: [
      'Full reset: npm run db:clear-placement — removes all jobs, internships, drives (hard delete + cascades). Documented on /developer#cleanup.',
      'After wipe: Demo APIs → Restore all demo tie-ups (IITM / NITT / BITS × 5 employers).',
      'Landing panel: Demo APIs + Cleanup (purge) — no Demo Tools label.',
      'Test colleges: py -3 scripts/delete_test_college_tenants.py — keeps only seed campuses.',
      'Employer tie-up Revoke button disabled (visible but not clickable).',
    ],
  },
  {
    date: '2026-05-29',
    title: 'Recruitment & assessment UI',
    items: [
      'Placement drive playbooks: npm run test:guided:playbook-drives-e2e (full cycle), playbook-drives (request + approve), playbook-drives-apply (apply + select). CSV on drives is still manual.',
      'Assessment uploads (CSV) — tabs Internship / Jobs / Drive / Projects; Export CSV per tab (all applications, same columns as import); CSV upload only (no mapping dialog); round display names from Assessment map.',
      'Assessment Update Online — new screen below CSV uploads; tabbed application table with inline round edits.',
      'Hiring Results Dashboard — read-only employer view (was Hiring Assessment); tabbed by opportunity type.',
      'Assessment map — configure round labels per kind under Settings (used by CSV upload and online update).',
      'Upload offers (CSV) — removed from employer/college sidebar; still open via Offers page → /offers-upload.',
      'Purge test data — removed from employer/college login menus; super-admin only on /data-entry.',
      'After dashboardMenu.js edits run: npm run qa:sync-routes',
    ],
  },
];

/** Demo email / notification pointers for QA (landing banner + /email-notifications). */
export const EMAIL_DEMO_NOTES = [
  'Disposable inbox for system mail in demos: placementhub@yopmail.com — check at https://yopmail.com/',
  'Data Tester seeded users use @placementhub.test (not YOPmail); password Admin@123.',
  'Email workflows preview (no mail sent): Landing → Demo Tools → Email workflows, or /email-notifications.',
  'Assessment round updates from CSV or Assessment Update Online appear on Hiring Results Dashboard (employer) and college Hiring Assessment (read-only).',
  'College Audit Reports → Export CSV can email a download link when SMTP is configured.',
];

/** Full reset + restore — primary cleanup path (documented on /developer#cleanup). */
export const CLEANUP_OVERVIEW =
  'After testing, wipe all jobs, internships, and placement drives, then restore demo tie-ups. Core logins (IITM / NITT / BITS + TechCorp) stay intact.';

export const CLEANUP_COMMANDS = [
  {
    title: 'Full wipe — all jobs, internships, drives (recommended)',
    command: 'npm run db:clear-placement',
    alt: 'node scripts/clear_all_placement_data.js',
    detail:
      'Hard-deletes every job posting (jobs + internships + projects + hackathons), all placement drives, applications, campus visibility, offers, and assessment uploads. Includes items created by demo accounts and Guided Runner GT-* posts. Does not remove colleges, users, students, or employers.',
    when: 'Clean slate before a demo or after a long QA session.',
  },
  {
    title: 'Soft-delete jobs & internships only (UI)',
    command: 'Landing → Demo APIs → Jobs & internships → Delete all jobs & internships',
    alt: 'POST /api/demo/purge-all-jobs-internships',
    detail:
      'Marks job postings deleted in DB; may miss standalone drives. Prefer npm run db:clear-placement for a full reset.',
    when: 'Quick partial cleanup from the landing panel.',
  },
  {
    title: 'Selective purge (one entity at a time)',
    command: 'Landing → Demo APIs → Cleanup (purge)',
    alt: '/data-entry → Purge section',
    detail:
      'Soft-delete single sandbox rows: Data Tester API posts, GT-* titles, playbook Duration: N months. descriptions, seed ids d1000000-*.',
    when: 'Remove one bad test row without wiping everything.',
  },
  {
    title: 'Remove test college tenants (registration QA)',
    command: 'py -3 scripts/delete_test_college_tenants.py --dry-run',
    alt: 'py -3 scripts/delete_test_college_tenants.py',
    detail:
      'Deletes colleges created during registration tests (MIT WPU, COEP, duplicate IITM, etc.). Keeps iit-madras, nit-trichy, bits-pilani only. Cascades users, visibility, and drives for those tenants.',
    when: 'College admin list is cluttered with test campuses.',
  },
];

/** Run after a full wipe so employers can publish again. */
export const RESTORE_AFTER_CLEANUP = [
  {
    title: 'Restore demo campus ↔ employer tie-ups',
    command: 'Landing → Demo APIs → Campus tie-ups → Restore all demo tie-ups',
    alt: 'POST /api/demo/ensure-all-tieups  body: { "scope": "demo" }',
    detail: 'Approves IIT Madras, NITT Trichy, and BITS Pilani with TechCorp, GlobalSoft, Infosys, Innovent Labs, and FinEdge. Safe to re-run.',
  },
  {
    title: 'TechCorp only — all active colleges',
    command: 'npm run qa:ensure-techcorp-partnerships',
    alt: 'node scripts/db_exec_sql_file.js db/seeds/ensure_techcorp_partnerships.sql',
    detail:
      'Upserts approved tie-ups for hr@techcorp.com with every active college tenant. Use when TechCorp shows no approved campuses, internship publish fails, or Applications → Internships shows partnership errors. Safe to re-run.',
    when: 'Guided internship playbook (EI-15/16) or TechCorp + Arjun Verma / IIT Madras QA.',
  },
  {
    title: 'Seed fresh postings (optional)',
    command: 'Landing → Demo APIs → Create jobs / Create internships',
    alt: '/data-entry → Jobs & internships section',
    detail: 'Creates new published listings with campus visibility after tie-ups are restored.',
  },
  {
    title: 'All colleges × all employers (full grid)',
    command: 'POST /api/demo/ensure-all-tieups  body: { "scope": "all" }',
    alt: 'npm run qa:ensure-partnership',
    detail: 'Only if you need every employer approved on every active college — not required for standard demo.',
  },
];

/** @deprecated use CLEANUP_COMMANDS + RESTORE_AFTER_CLEANUP */
export const PURGE_NOTES = [
  CLEANUP_OVERVIEW,
  'Full wipe: npm run db:clear-placement (see Clean up & restore on /developer).',
  'Then restore tie-ups: Demo APIs → Restore all demo tie-ups.',
  'Selective purge: Demo APIs → Cleanup — GT-* and Data Tester rows one at a time.',
];

export const LEGACY_RUNNER_COMMANDS = [
  { command: 'npm run qa:ensure-techcorp-partnerships', use: 'Approve TechCorp (hr@techcorp.com) on all active colleges — see Clean up & restore' },
  { command: 'npm run qa:sync-help-knowledge', use: 'Export docs/help/*.md + index for AI Help (OPENAI_API_KEY for embeddings; full corpus either way)' },
  { command: 'npm run qa:sync-routes', use: 'Regenerate qa/routes-by-role.js after dashboardMenu.js changes' },
  { command: 'npm run test:guided:drives', use: 'Browse Focus Areas placement-drive cases (navigation only; CSV still manual)' },
  { command: 'npm run test:guided:playbook-drives-e2e', use: 'Full placement drive cycle (employer → college → student → employer)' },
  { command: 'npm run test:guided:playbook-drives', use: 'Employer request drive + college approve' },
  { command: 'npm run test:guided:playbook-drives-apply', use: 'Student apply + employer shortlist/select (uses GT- marker)' },
  { command: 'npm run test:guided:internships', use: 'Browse Focus Areas internship cases (navigation only)' },
  { command: 'npm run test:guided -- --focus EI-03', use: 'Single Focus Area case' },
  { command: 'npm run test:guided -- --playbook <id>', use: 'Any playbook in qa/guided/playbooks/' },
  { command: '..\\run-guided.ps1 (parent CampusPlacement folder)', use: 'Launcher if cwd is wrong' },
];

export const RELATED_DOCS = [
  { label: 'Cleanup & restore (markdown)', path: 'docs/help/developer/purge.md' },
  { label: 'Clear placement SQL', path: 'db/scripts/clear_all_placement_data.sql' },
  { label: 'Help library for Cursor / Claude (markdown)', path: 'docs/help/', hint: 'Point AI tools here; sync: npm run qa:sync-help-knowledge' },
  { label: 'Manual test playbook (CSV, cross-view)', path: 'qa/MANUAL_TEST_PLAYBOOK.md' },
  { label: 'Runner quick start (repo file)', path: 'qa/guided/RUNNER_QUICKSTART.md' },
  { label: 'Focus Areas JSON', path: 'qa/guided/focus-areas.json', hint: 'Rebuild: npm run qa:build-focus-areas' },
  { label: 'QA routes by role', path: 'qa/routes-by-role.js', hint: 'Rebuild: npm run qa:sync-routes' },
];
