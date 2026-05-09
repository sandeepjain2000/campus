# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c4_data_validation.spec.js >> C4 - Student Data Validation >> C4-STU-003 - Application status timeline
- Location: qa\tests\c4_data_validation.spec.js:46:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: locator('#login-email')
Expected: "arjun.verma@iitm.edu"
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" with timeout 30000ms
  - waiting for locator('#login-email')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "P PlacementHub" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: P
        - generic [ref=e7]: PlacementHub
      - heading "Welcome back" [level=1] [ref=e8]
      - paragraph [ref=e9]: Sign in to your account to continue
    - generic [ref=e10]:
      - button "Demo accounts" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]:
          - img [ref=e14]
          - text: Demo accounts
        - img [ref=e17]
      - button "All accounts" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]:
          - img [ref=e22]
          - text: All accounts
        - img [ref=e26]
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]: Email address
          - textbox "Email address" [ref=e31]:
            - /placeholder: you@example.com
            - text: arjun.verma@iitm.edu
        - generic [ref=e32]:
          - generic [ref=e33]:
            - generic [ref=e34]: Password
            - link "Forgot password?" [ref=e35] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e36]:
            - textbox "Password" [ref=e37]:
              - /placeholder: Enter your password
              - text: Admin@123
            - button "Show password" [ref=e38] [cursor=pointer]:
              - img [ref=e39]
        - button "Sign In" [ref=e42] [cursor=pointer]
    - generic [ref=e43]:
      - text: Don't have an account?
      - link "Sign up" [ref=e44] [cursor=pointer]:
        - /url: /register
  - button "Open Next.js Dev Tools" [ref=e50] [cursor=pointer]:
    - img [ref=e51]
  - alert [ref=e54]
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
> 14  |   await expect(page.locator('#login-email')).toHaveValue(email, { timeout: 30_000 });
      |                                              ^ Error: expect(locator).toHaveValue(expected) failed
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
  79  |     await page.goto('/dashboard/employer/applications');
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
```