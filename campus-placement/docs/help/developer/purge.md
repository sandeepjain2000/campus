# Clean up & restore test data

> **Section:** Developer / QA  
> **Source:** developer  
> **Audience:** all

## Overview

After testing, wipe all jobs, internships, and placement drives, then restore demo tie-ups. Core logins (IITM / NITT / BITS + TechCorp) stay intact.

## Full wipe (recommended)

```bash
npm run db:clear-placement
```

Or: `node scripts/clear_all_placement_data.js`

Hard-deletes every job posting (jobs + internships + projects + hackathons), all placement drives, applications, campus visibility, offers, and assessment uploads. Includes items created by demo accounts and Guided Runner GT-* posts. Does **not** remove colleges, users, students, or employers.

**When:** Clean slate before a demo or after a long QA session.

## Restore after wipe

1. **Restore demo campus ↔ employer tie-ups** — Landing → Demo APIs → Campus tie-ups → **Restore all demo tie-ups**  
   Or: `POST /api/demo/ensure-all-tieups` with body `{ "scope": "demo" }`  
   Approves IIT Madras, NITT Trichy, and BITS Pilani with TechCorp, GlobalSoft, Infosys, Innovent Labs, and FinEdge. Safe to re-run.

2. **Seed fresh postings (optional)** — Landing → Demo APIs → Create jobs / Create internships

3. **All colleges × all employers (full grid, optional)** — `POST /api/demo/ensure-all-tieups` with `{ "scope": "all" }` or `npm run qa:ensure-partnership`

## Partial cleanup (UI)

- **Soft-delete jobs & internships only** — Landing → Demo APIs → Jobs & internships → Delete all jobs & internships (`POST /api/demo/purge-all-jobs-internships`). May miss standalone drives; prefer full wipe above.

- **Selective purge (one row)** — Landing → Demo APIs → **Cleanup (purge)** or `/data-entry` Purge section. Soft-delete single sandbox rows: Data Tester API posts, GT-* titles, playbook `Duration: N months.` descriptions, seed ids `d1000000-*`.

## Remove test college tenants

```bash
py -3 scripts/delete_test_college_tenants.py --dry-run
py -3 scripts/delete_test_college_tenants.py
```

Deletes colleges created during registration tests (MIT WPU, COEP, duplicate IITM, etc.). Keeps `iit-madras`, `nit-trichy`, `bits-pilani` only.

## Related

- SQL: `db/scripts/clear_all_placement_data.sql`
- In-app docs: `/developer#cleanup`
