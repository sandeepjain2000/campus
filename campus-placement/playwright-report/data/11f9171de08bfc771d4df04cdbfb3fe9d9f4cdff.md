# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: screens.spec.js >> TC_SAD – Super Admin screens open >> TC_SAD_001 – /dashboard/admin/colleges opens
- Location: qa\tests\screens.spec.js:266:3

# Error details

```
TimeoutError: page.goto: Timeout 15000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/login?email=admin%40placementhub.com", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * screens.spec.js – Smoke-tests every screen in CampusPlacement_Test_Cases.xlsx
  3   |  *
  4   |  * Goal: Verify each page/route loads without crashing (no 404, no error boundary,
  5   |  * no blank screen). Does NOT test data correctness — that is covered by manual tests.
  6   |  *
  7   |  * Login strategy: ?email= URL param fills both email + password automatically.
  8   |  */
  9   | const { test, expect } = require('@playwright/test');
  10  | 
  11  | // ─── Login helper ─────────────────────────────────────────────────────────────
  12  | async function loginAsDemo(page, email) {
> 13  |   await page.goto(`/login?email=${encodeURIComponent(email)}`);
      |              ^ TimeoutError: page.goto: Timeout 15000ms exceeded.
  14  |   await expect(page.locator('#login-email')).toHaveValue(email, { timeout: 15_000 });
  15  |   await expect(page.locator('#login-password')).not.toHaveValue('', { timeout: 10_000 });
  16  |   await page.locator('#login-submit').click();
  17  | }
  18  | 
  19  | // Verify a page opened successfully — no error boundary, not a 404
  20  | async function assertPageOpened(page, urlPattern) {
  21  |   await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
  22  |   // Page must not show a generic error / 404
  23  |   const bodyText = await page.locator('body').innerText({ timeout: 10_000 });
  24  |   expect(bodyText).not.toMatch(/404.*not found/i);
  25  |   expect(bodyText).not.toMatch(/application error/i);
  26  | }
  27  | 
  28  | // ═══════════════════════════════════════════════════════════════════════════════
  29  | // AUTHENTICATION SCREENS  (TC_AUTH_001 – TC_AUTH_006)
  30  | // ═══════════════════════════════════════════════════════════════════════════════
  31  | test.describe('TC_AUTH – Authentication screens', () => {
  32  | 
  33  |   test('TC_AUTH_001 – /login screen opens', async ({ page }) => {
  34  |     await page.goto('/login');
  35  |     await assertPageOpened(page, /\/login/);
  36  |     await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });
  37  |   });
  38  | 
  39  |   test('TC_AUTH_001b – Student login lands on /dashboard/student', async ({ page }) => {
  40  |     await loginAsDemo(page, 'arjun.verma@iitm.edu');
  41  |     await assertPageOpened(page, /\/dashboard\/student/);
  42  |   });
  43  | 
  44  |   test('TC_AUTH_002 – Employer login lands on /dashboard/employer', async ({ page }) => {
  45  |     await loginAsDemo(page, 'hr@techcorp.com');
  46  |     await assertPageOpened(page, /\/dashboard\/employer/);
  47  |   });
  48  | 
  49  |   test('TC_AUTH_003 – College Admin login lands on /dashboard/college', async ({ page }) => {
  50  |     await loginAsDemo(page, 'admin@iitm.edu');
  51  |     await assertPageOpened(page, /\/dashboard\/college/);
  52  |   });
  53  | 
  54  |   test('TC_AUTH_004 – /register screen opens', async ({ page }) => {
  55  |     await page.goto('/register');
  56  |     await assertPageOpened(page, /\/register/);
  57  |   });
  58  | 
  59  |   test('TC_AUTH_005 – /forgot-password screen opens', async ({ page }) => {
  60  |     await page.goto('/forgot-password');
  61  |     await assertPageOpened(page, /\/forgot-password/);
  62  |   });
  63  | 
  64  |   test('TC_AUTH_006 – Logout returns to /login', async ({ page }) => {
  65  |     await loginAsDemo(page, 'arjun.verma@iitm.edu');
  66  |     await expect(page).toHaveURL(/\/dashboard\/student/, { timeout: 15_000 });
  67  |     await page.getByRole('button', { name: /sign out/i }).click();
  68  |     await assertPageOpened(page, /\/login/);
  69  |   });
  70  | 
  71  | });
  72  | 
  73  | // ═══════════════════════════════════════════════════════════════════════════════
  74  | // NAVIGATION / DASHBOARD SCREENS  (TC_NAV_001 – TC_NAV_003)
  75  | // ═══════════════════════════════════════════════════════════════════════════════
  76  | test.describe('TC_NAV – Navigation & dashboard screens', () => {
  77  | 
  78  |   test.beforeEach(async ({ page }) => {
  79  |     await loginAsDemo(page, 'arjun.verma@iitm.edu');
  80  |     await expect(page).toHaveURL(/\/dashboard\/student/, { timeout: 15_000 });
  81  |   });
  82  | 
  83  |   test('TC_NAV_001 – Student hub opens and "My profile" navigates to profile', async ({ page }) => {
  84  |     await expect(page.locator('.dashboard-nav-hub-page-title')).toBeVisible({ timeout: 15_000 });
  85  |     await page.locator('a:has-text("My profile")').first().click();
  86  |     await assertPageOpened(page, /\/dashboard\/student\/profile/);
  87  |   });
  88  | 
  89  |   test('TC_NAV_002 – Theme toggle changes data-theme attribute', async ({ page }) => {
  90  |     const btn = page.locator('button[title="Toggle theme"]').first();
  91  |     await expect(btn).toBeVisible({ timeout: 15_000 });
  92  |     const before = await page.locator('html').getAttribute('data-theme');
  93  |     await btn.click();
  94  |     const after = await page.locator('html').getAttribute('data-theme');
  95  |     expect(after).not.toBe(before);
  96  |   });
  97  | 
  98  |   test('TC_NAV_003 – Sidebar visible on inner pages', async ({ page }) => {
  99  |     await page.goto('/dashboard/student/profile');
  100 |     await assertPageOpened(page, /\/dashboard\/student\/profile/);
  101 |     await expect(page.locator('.sidebar')).toBeVisible({ timeout: 15_000 });
  102 |   });
  103 | 
  104 | });
  105 | 
  106 | // ═══════════════════════════════════════════════════════════════════════════════
  107 | // STUDENT SCREENS  (TC_STU_001 – TC_STU_005)
  108 | // ═══════════════════════════════════════════════════════════════════════════════
  109 | test.describe('TC_STU – Student screens open', () => {
  110 | 
  111 |   test.beforeEach(async ({ page }) => {
  112 |     await loginAsDemo(page, 'arjun.verma@iitm.edu');
  113 |     await expect(page).toHaveURL(/\/dashboard\/student/, { timeout: 15_000 });
```