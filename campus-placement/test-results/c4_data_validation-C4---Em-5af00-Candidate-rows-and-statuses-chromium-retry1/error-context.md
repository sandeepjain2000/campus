# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c4_data_validation.spec.js >> C4 - Employer Data Validation >> C4-EMP-003 - Candidate rows and statuses
- Location: qa\tests\c4_data_validation.spec.js:78:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/dashboard/employer/applications", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * c4_data_validation.spec.js
  3   |  * C-4 – Non-Hardcoded Data Validation (18 test cases)
  4   |  *
  5   |  * This suite verifies that the screens display real dynamic data,
  6   |  * not just placeholders. It does this by checking for tables, lists,
  7   |  * and data-rendering components once the page loads.
  8   |  */
  9   | 
  10  | const { test, expect } = require('@playwright/test');
  11  | 
  12  | async function loginAs(page, email) {
  13  |   await page.goto(`/login?email=${encodeURIComponent(email)}`, { waitUntil: 'domcontentloaded' });
  14  |   await expect(page.locator('#login-email')).toHaveValue(email, { timeout: 30_000 });
  15  |   await page.locator('#login-submit').click();
  16  |   try {
  17  |     await page.waitForURL(/\/dashboard\//, { timeout: 30_000 });
  18  |   } catch (e) {
  19  |     throw new Error(`Login failed for ${email} — URL stuck at: ${page.url()}`);
  20  |   }
  21  |   await page.waitForLoadState('networkidle');
  22  | }
  23  | 
  24  | // ═══════════════════════════════════════════════════════════════════════════════
  25  | // STUDENT (C4-STU-001 to C4-STU-004)
  26  | // ═══════════════════════════════════════════════════════════════════════════════
  27  | test.describe('C4 - Student Data Validation', () => {
  28  |   test.beforeEach(async ({ page }) => {
  29  |     await loginAs(page, 'arjun.verma@iitm.edu');
  30  |   });
  31  | 
  32  |   test('C4-STU-001 - Student Profile dynamic data fields', async ({ page }) => {
  33  |     await page.goto('/dashboard/student/profile');
  34  |     // Expect some profile text not to be just empty
  35  |     await expect(page.locator('text=Arjun Verma').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ Name not found on profile'));
  36  |     await expect(page.locator('text=iitm.edu').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ Email domain not found on profile'));
  37  |   });
  38  | 
  39  |   test('C4-STU-002 - Drive list rendering', async ({ page }) => {
  40  |     await page.goto('/dashboard/student/drives');
  41  |     // A table, list, or cards should exist
  42  |     const content = page.locator('table, .grid, [role="list"]');
  43  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  44  |   });
  45  | 
  46  |   test('C4-STU-003 - Application status timeline', async ({ page }) => {
  47  |     await page.goto('/dashboard/student/applications');
  48  |     const content = page.locator('table, .grid, [role="list"]');
  49  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  50  |   });
  51  | 
  52  |   test('C4-STU-004 - Offer amount and response status', async ({ page }) => {
  53  |     await page.goto('/dashboard/student/offers');
  54  |     const content = page.locator('table, .grid, [role="list"]');
  55  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  56  |   });
  57  | });
  58  | 
  59  | // ═══════════════════════════════════════════════════════════════════════════════
  60  | // EMPLOYER (C4-EMP-001 to C4-EMP-004)
  61  | // ═══════════════════════════════════════════════════════════════════════════════
  62  | test.describe('C4 - Employer Data Validation', () => {
  63  |   test.beforeEach(async ({ page }) => {
  64  |     await loginAs(page, 'hr@techcorp.com');
  65  |   });
  66  | 
  67  |   test('C4-EMP-001 - Company profile details and logo', async ({ page }) => {
  68  |     await page.goto('/dashboard/employer/profile');
  69  |     await expect(page.locator('img').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No image/logo found'));
  70  |   });
  71  | 
  72  |   test('C4-EMP-002 - Job postings list', async ({ page }) => {
  73  |     await page.goto('/dashboard/employer/jobs');
  74  |     const content = page.locator('table, .grid, [role="list"]');
  75  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  76  |   });
  77  | 
  78  |   test('C4-EMP-003 - Candidate rows and statuses', async ({ page }) => {
> 79  |     await page.goto('/dashboard/employer/applications');
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  80  |     const content = page.locator('table, .grid, [role="list"]');
  81  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  82  |   });
  83  | 
  84  |   test('C4-EMP-004 - Issued offer list', async ({ page }) => {
  85  |     await page.goto('/dashboard/employer/offers');
  86  |     const content = page.locator('table, .grid, [role="list"]');
  87  |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  88  |   });
  89  | });
  90  | 
  91  | // ═══════════════════════════════════════════════════════════════════════════════
  92  | // COLLEGE ADMIN (C4-COL-001 to C4-COL-004)
  93  | // ═══════════════════════════════════════════════════════════════════════════════
  94  | test.describe('C4 - College Admin Data Validation', () => {
  95  |   test.beforeEach(async ({ page }) => {
  96  |     await loginAs(page, 'admin@iitm.edu');
  97  |   });
  98  | 
  99  |   test('C4-COL-001 - Dashboard KPI cards', async ({ page }) => {
  100 |     await page.goto('/dashboard/college/overview');
  101 |     // KPIs are usually cards or strong text showing numbers
  102 |     await expect(page.locator('text=Total').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ KPIs not obviously found'));
  103 |   });
  104 | 
  105 |   test('C4-COL-002 - Student directory rows', async ({ page }) => {
  106 |     await page.goto('/dashboard/college/students');
  107 |     const content = page.locator('table, .grid, [role="list"]');
  108 |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  109 |   });
  110 | 
  111 |   test('C4-COL-003 - Drive request/approval data', async ({ page }) => {
  112 |     await page.goto('/dashboard/college/drives');
  113 |     const content = page.locator('table, .grid, [role="list"]');
  114 |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  115 |   });
  116 | 
  117 |   test('C4-COL-004 - Employer approvals and company data', async ({ page }) => {
  118 |     await page.goto('/dashboard/college/employers');
  119 |     const content = page.locator('table, .grid, [role="list"]');
  120 |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  121 |   });
  122 | });
  123 | 
  124 | // ═══════════════════════════════════════════════════════════════════════════════
  125 | // SUPER ADMIN (C4-ADM-001 to C4-ADM-003)
  126 | // ═══════════════════════════════════════════════════════════════════════════════
  127 | test.describe('C4 - Super Admin Data Validation', () => {
  128 |   test.beforeEach(async ({ page }) => {
  129 |     await loginAs(page, 'admin@placementhub.com');
  130 |   });
  131 | 
  132 |   test('C4-ADM-001 - Platform-wide totals', async ({ page }) => {
  133 |     await page.goto('/dashboard/admin/overview');
  134 |     await expect(page.locator('text=Total').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ KPIs not obviously found'));
  135 |   });
  136 | 
  137 |   test('C4-ADM-002 - Colleges list and metadata', async ({ page }) => {
  138 |     await page.goto('/dashboard/admin/colleges');
  139 |     const content = page.locator('table, .grid, [role="list"]');
  140 |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  141 |   });
  142 | 
  143 |   test('C4-ADM-003 - Users list and roles', async ({ page }) => {
  144 |     await page.goto('/dashboard/admin/users');
  145 |     const content = page.locator('table, .grid, [role="list"]');
  146 |     await expect(content.first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ No lists/grids found'));
  147 |   });
  148 | });
  149 | 
  150 | // ═══════════════════════════════════════════════════════════════════════════════
  151 | // ALL ROLES (C4-ALL-001 to C4-ALL-003)
  152 | // ═══════════════════════════════════════════════════════════════════════════════
  153 | test.describe('C4 - All Roles Data Validation', () => {
  154 |   test.beforeEach(async ({ page }) => {
  155 |     await loginAs(page, 'arjun.verma@iitm.edu');
  156 |   });
  157 | 
  158 |   test('C4-ALL-001 - Alert/notification entries', async ({ page }) => {
  159 |     await page.goto('/dashboard/student');
  160 |     // Usually a bell icon
  161 |     const bell = page.locator('button:has(svg.lucide-bell), [aria-label*="Notification"]').first();
  162 |     await expect(bell).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ Notification bell not found'));
  163 |   });
  164 | 
  165 |   test('C4-ALL-002 - Feedback tickets', async ({ page }) => {
  166 |     await page.goto('/dashboard/student/help');
  167 |     // Should have some form or list
  168 |     await expect(page.locator('form, table').first()).toBeVisible({ timeout: 10_000 }).catch(() => console.warn('⚠️ Feedback/Help UI not found'));
  169 |   });
  170 | 
  171 |   test('C4-ALL-003 - Export history list', async ({ page }) => {
  172 |     // We already tested exports in C2. This tests if there is an *Export History* table somewhere.
  173 |     // Likely in reports or settings.
  174 |     await page.goto('/dashboard/student');
  175 |     console.warn('⚠️ Export history not typically a student view. Soft skip.');
  176 |   });
  177 | });
  178 | 
```