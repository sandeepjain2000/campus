# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c12_use_cases.spec.js >> C12 - Use Case Executability >> C12-UC-001 - Employer onboarding and campus partnership
- Location: qa\tests\c12_use_cases.spec.js:35:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/login?email=hr%40techcorp.com
Call log:
  - navigating to "http://127.0.0.1:3000/login?email=hr%40techcorp.com", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * c12_use_cases.spec.js
  3  |  * C-12 – Use Case Flow Executability
  4  |  *
  5  |  * Verifies high-level UC workflows mapping directly to UC-0XX identifiers.
  6  |  * Uses soft-skips for features not yet fully implemented.
  7  |  */
  8  | 
  9  | const { test, expect } = require('@playwright/test');
  10 | 
  11 | async function loginAs(page, email) {
> 12 |   await page.goto(`/login?email=${encodeURIComponent(email)}`);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/login?email=hr%40techcorp.com
  13 |   await expect(page.locator('#login-email')).toHaveValue(email, { timeout: 15_000 });
  14 |   await page.locator('#login-submit').click();
  15 |   await page.waitForURL(/\/dashboard\//, { timeout: 15_000 });
  16 | }
  17 | 
  18 | async function verifyUseCaseEntry(page, route, actionSelectors, ucId) {
  19 |   await page.goto(route);
  20 |   
  21 |   for (const sel of actionSelectors) {
  22 |     const btn = page.locator(sel).first();
  23 |     const canAct = await btn.isVisible({ timeout: 3000 }).catch(() => false);
  24 |     if (canAct) {
  25 |       console.log(`✅ ${ucId}: Use case entry point found via "${sel}".`);
  26 |       return;
  27 |     }
  28 |   }
  29 |   
  30 |   console.warn(`⚠️ ${ucId}: Use case entry point not found. Soft skipping.`);
  31 | }
  32 | 
  33 | test.describe('C12 - Use Case Executability', () => {
  34 | 
  35 |   test('C12-UC-001 - Employer onboarding and campus partnership', async ({ page }) => {
  36 |     await loginAs(page, 'hr@techcorp.com');
  37 |     await verifyUseCaseEntry(page, '/dashboard/employer/select-campus', ['button:has-text("Add Campus")', 'button:has-text("Connect")'], 'C12-UC-001');
  38 |   });
  39 | 
  40 |   test('C12-UC-002 - Create and publish placement drive', async ({ page }) => {
  41 |     await loginAs(page, 'hr@techcorp.com');
  42 |     await verifyUseCaseEntry(page, '/dashboard/employer/drives', ['button:has-text("Create Drive")', 'button:has-text("New Drive")'], 'C12-UC-002');
  43 |   });
  44 | 
  45 |   test('C12-UC-003 - Student application lifecycle', async ({ page }) => {
  46 |     await loginAs(page, 'arjun.verma@iitm.edu');
  47 |     await verifyUseCaseEntry(page, '/dashboard/student/jobs', ['button:has-text("Apply")'], 'C12-UC-003');
  48 |   });
  49 | 
  50 |   test('C12-UC-004 - Interview scheduling and visibility', async ({ page }) => {
  51 |     await loginAs(page, 'hr@techcorp.com');
  52 |     await verifyUseCaseEntry(page, '/dashboard/employer/interviews', ['button:has-text("Schedule Interview")'], 'C12-UC-004');
  53 |   });
  54 | 
  55 | });
  56 | 
```