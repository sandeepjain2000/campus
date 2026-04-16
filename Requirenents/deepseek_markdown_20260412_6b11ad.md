# Additional Requirements - Campus Recruitment System (Beyond Current Spec)

This document contains new functional requirements not present in the original specification (`placement_system_full_spec.pdf`) or the previously identified gaps (`Add 3.pdf`, `additional.pdf`). These points expand the system's capabilities across all modules.

---

## College Group Module – Expanded Points

> Base module already noted as "new" in Add 3.pdf. These are additional capabilities.

- **Centralized placement dashboard** for group admin to view placement statistics (placement %, avg. salary, offers made) across all entities under the group (BE, MCA, MBA, multiple campuses).
- **Shared employer blacklist** – any college under the group can flag an employer; group admin can apply blacklist globally.
- **Common placement calendar** for group-wide mega drives or virtual job fairs involving all entities.
- **Role-based access control within group** – distinct permissions for Group Super Admin vs. Individual College Admin.

---

## College Module – New Points

- **Restrict employer visibility per department** – college can hide specific departments (e.g., Civil, Mechanical) from non-core employers.
- **Minimum CGPA threshold per department** – override student-level eligibility at the department level.
- **Mandatory pre-placement talk (PPT) flag** – students cannot apply until employer conducts a PPT.
- **Student grievance & feedback portal** – students can report issues with employers or drives; visible only to college placement office.
- **Placement committee approval workflow** – each drive requires internal approval before being published to students.
- **Auto-reminder for pending student verifications** – weekly digest of unverified students.

---

## Employer Module – New Points

- **Anonymous company posting** – hide company name until shortlisting stage (for confidential or competitive hiring).
- **Batch-wise hiring plan** – specify target headcount per graduation year (e.g., 10 hires from batch 2025, 5 from batch 2026).
- **Job posting templates** – save and reuse eligibility criteria, bond terms, hiring intent, and assignment templates.
- **Reopen closed drives** – with audit trail and mandatory college approval.
- **Offer expiry timer** – student must accept/reject by employer-set deadline; offer auto-cancels after expiry.
- **Anonymous employer rating by students** – post-drive survey on professionalism, transparency, timeliness (aggregated, not student-identifiable).

---

## Student Module – New Points

- **Mock test / aptitude attempt tracking** – system records attempts, scores, and improvement over time.
- **Placement readiness indicator** (Low / Medium / High) – computed from profile completeness, skills, CGPA, and test scores.
- **Student wishlist of companies** – get notified immediately when a wishlisted company opens a drive.
- **Withdrawal reason capture** – mandatory dropdown when student opts out of a confirmed drive (for analytics).
- **Block employer** – student can hide their profile completely from specific employers.
- **Anonymous doubt/query submission** to placement cell – without revealing identity.

---

## Event & Scheduling – New Points

- **Recurring drive schedules** – e.g., "every first Monday of the month" for regular hiring.
- **Time zone support** – for virtual drives involving international employers.
- **Auto-promotion from waitlist** – when a confirmed student is marked absent, next waitlisted student is auto-notified and enrolled.
- **Conflict detection at student level** – prevent applying to two drives scheduled at overlapping times.
- **Event template library** – preconfigured templates for PPT, online assessment, panel interview, group discussion.

---

## Hiring Data & Insights – New Points

- **Employer reliability score** – computed from cancellation rate, offer-to-joining ratio, average response time, and student feedback.
- **College ranking leaderboard** – visible to employers, based on placement %, average salary, student readiness, and company feedback.
- **Salary trend analytics** – year-over-year comparison by branch, job role, company type (PSU, startup, MNC).
- **Dropout rate per drive** – % of confirmed students who did not attend (no-show).
- **Employer comparison report for colleges** – side-by-side view of Company A vs. Company B on offer acceptance rate, joining %, retention, and student ratings.

---

## Compliance & Trust – New Points

- **Employer background verification badge** – verified by platform or third-party agency (e.g., MSME, DPIIT, listed company).
- **Accreditation expiry alerts for colleges** – automated reminders to re-upload NAAC, NBA, NIRF before expiry.
- **Legal agreement e-signature** between college and employer before drive commencement.
- **Fraud flagging system** – students can report suspicious employer behavior (fake job postings, data misuse).
- **Data retention policy configuration** – define how long student/employer data is retained after a batch graduates.

---

## System & Platform – New (Not Covered in Any Spec)

- **API for external LMS integration** – colleges can automatically sync student records (name, roll, branch, CGPA) from their internal system.
- **Export reports in multiple formats** – PDF, Excel, CSV for all analytics dashboards.
- **Audit log viewer for admin** – timestamped record of who created, modified, or deleted what.
- **Bulk email/SMS templates with merge fields** – support placeholders like `{student_name}`, `{drive_date}`, `{venue}`, `{company_name}`.
- **Two-factor authentication (2FA)** for college and employer admin accounts.
- **Mobile app for employers** – currently only student-focused in spec; add employer-facing app for drive tracking and shortlisting.
- **Calendar sync (Google / Outlook / iCal)** – students and employers can push event dates to their personal calendars.
- **Multi-language support** – UI and system notifications in English + regional languages (Hindi, Tamil, Telugu, Marathi, etc.).
- **Payment gateway integration** – for premium job postings, drive fees, or platform subscription (Razorpay, Stripe).
- **Student identity verification** – Aadhaar or college ID upload + verification before first application.
- **Offline drive mode** – mark attendance manually, upload results via Excel, bypass online checks.
- **Automated backup & restore** – scheduled daily/weekly backups for college and employer data.
- **Public placement dashboard widget** – colleges can embed real-time placement stats on their own public website.

---

## Cross-Module / Workflow Enhancements

- **Placement calendar heatmap** – visual indicator of busy vs. free slots for colleges (helps employers choose dates).
- **Student-Employer chat (with consent)** – temporary, drive-specific chat for clarification (logs retained for compliance).
- **Auto-generation of offer letter PDF** – from employer-filled template, downloadable by student.
- **Student batch rollover** – at end of academic year, promote final-year students to "alumni" status automatically.
- **Employer scorecard** – colleges can rate employers after drive completion (timeliness, coordination, student treatment).

---

## Summary of New Points by Priority (Suggested)

| Priority | Modules |
|----------|---------|
| High (Must have) | College group shared blacklist, offer expiry timer, auto-promotion from waitlist, conflict detection, employer reliability score, 2FA, bulk templates |
| Medium (Should have) | Anonymous company posting, student wishlist, withdrawal reason capture, API for LMS, offline drive mode, calendar sync |
| Low (Nice to have) | Multi-language, payment gateway, public placement widget, mobile app for employers |

---

*Document generated from gap analysis across `placement_system_full_spec.pdf`, `Add 3.pdf`, and `additional.pdf`.*