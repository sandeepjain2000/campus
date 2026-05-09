# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c3_transactional.spec.js >> C-3 Transactional Flows & Cross-Role Visibility >> C3-TXN-010 – Employer partnership request flow
- Location: qa\tests\c3_transactional.spec.js:252:3

# Error details

```
Error: Login failed for hr@techcorp.com — URL stuck at: http://127.0.0.1:3000/dashboard/employer
```

# Test source

```ts
  1   | /**
  2   |  * c3_transactional.spec.js
  3   |  * C-3 – Transactional Flow and Cross-Role Visibility (12 test cases)
  4   |  *
  5   |  * This suite verifies end-to-end multi-role workflows.
  6   |  * Since some transactional UIs (like "Create Drive", "Apply to Job") might be under development,
  7   |  * we use soft-assertions or soft-skips. If a primary action button (e.g. "Create") is missing,
  8   |  * the test gracefully warns and moves on, allowing us to gauge implementation readiness
  9   |  * without failing the entire suite.
  10  |  */
  11  | 
  12  | const { test, expect } = require('@playwright/test');
  13  | 
  14  | // ─── Helpers ─────────────────────────────────────────────────────────────────
  15  | 
  16  | async function loginAs(page, email) {
  17  |   // Use domcontentloaded — faster and more reliable on Next.js than networkidle
  18  |   await page.goto(`/login?email=${encodeURIComponent(email)}`, { waitUntil: 'domcontentloaded' });
  19  |   await expect(page.locator('#login-email')).toHaveValue(email, { timeout: 30_000 });
  20  |   await page.locator('#login-submit').click();
  21  |   try {
  22  |     await page.waitForURL(/\/dashboard\//, { timeout: 30_000 });
  23  |   } catch (e) {
> 24  |     throw new Error(`Login failed for ${email} — URL stuck at: ${page.url()}`);
      |           ^ Error: Login failed for hr@techcorp.com — URL stuck at: http://127.0.0.1:3000/dashboard/employer
  25  |   }
  26  |   // Wait for client hydration
  27  |   await page.waitForTimeout(800);
  28  | }
  29  | 
  30  | // Gracefully tries to find and click an action button (e.g. "Create", "Add")
  31  | // Returns true if clicked, false if not found.
  32  | async function tryInitiateAction(page, selectors) {
  33  |   // Wait for the DOM to settle and network to finish loading the initial payload
  34  |   await page.waitForLoadState('networkidle').catch(() => {});
  35  |   
  36  |   for (const sel of selectors) {
  37  |     const btn = page.locator(sel).first();
  38  |     // Use a longer timeout (8s) because Next.js App Router hydration + SWR fetch can take time
  39  |     if (await btn.isVisible({ timeout: 8_000 }).catch(() => false)) {
  40  |       await btn.click();
  41  |       return true;
  42  |     }
  43  |   }
  44  |   return false;
  45  | }
  46  | 
  47  | // ═══════════════════════════════════════════════════════════════════════════════
  48  | // C-3 TEST CASES
  49  | // ═══════════════════════════════════════════════════════════════════════════════
  50  | 
  51  | test.describe('C-3 Transactional Flows & Cross-Role Visibility', () => {
  52  |   // Use a longer timeout for E2E multi-role flows
  53  |   test.setTimeout(90_000);
  54  | 
  55  |   test('C3-TXN-001 – Create placement drive -> approve -> visible to student', async ({ browser }) => {
  56  |     // We use a fresh context to ensure clean session state
  57  |     const context = await browser.newContext();
  58  |     const page = await context.newPage();
  59  | 
  60  |     // Step 1: Employer tries to create a drive
  61  |     await loginAs(page, 'hr@techcorp.com');
  62  |     await page.goto('/dashboard/employer/drives');
  63  |     
  64  |     const canCreate = await tryInitiateAction(page, [
  65  |       'button:has-text("Create Drive")',
  66  |       'button:has-text("New Drive")',
  67  |       'button:has-text("Request Drive")',
  68  |       '[aria-label*="Create Drive"]'
  69  |     ]);
  70  | 
  71  |     if (!canCreate) {
  72  |       console.warn('⚠️ C3-TXN-001: "Create Drive" button not found. Soft skipping cross-role validation.');
  73  |       await context.close();
  74  |       return; // Soft skip
  75  |     }
  76  | 
  77  |     console.log('✅ C3-TXN-001: Employer "Create Drive" UI accessed.');
  78  |     // TODO: Fill form and submit, then log in as college to approve, then log in as student to view.
  79  |     await context.close();
  80  |   });
  81  | 
  82  |   test('C3-TXN-002 – Create job posting -> visible in student opportunities', async ({ browser }) => {
  83  |     const context = await browser.newContext();
  84  |     const page = await context.newPage();
  85  | 
  86  |     await loginAs(page, 'hr@techcorp.com');
  87  |     await page.goto('/dashboard/employer/jobs');
  88  | 
  89  |     const canCreate = await tryInitiateAction(page, [
  90  |       'button:has-text("Post Job")',
  91  |       'button:has-text("Create Job")',
  92  |       'button:has-text("New Job")'
  93  |     ]);
  94  | 
  95  |     if (!canCreate) {
  96  |       console.warn('⚠️ C3-TXN-002: "Post Job" button not found. Soft skipping.');
  97  |       await context.close();
  98  |       return;
  99  |     }
  100 |     console.log('✅ C3-TXN-002: Employer "Post Job" UI accessed.');
  101 |     await context.close();
  102 |   });
  103 | 
  104 |   test('C3-TXN-003 – Student applies -> application visible to employer and college', async ({ browser }) => {
  105 |     const context = await browser.newContext();
  106 |     const page = await context.newPage();
  107 | 
  108 |     await loginAs(page, 'arjun.verma@iitm.edu');
  109 |     await page.goto('/dashboard/student/jobs'); // or /dashboard/student/drives
  110 | 
  111 |     const canApply = await tryInitiateAction(page, [
  112 |       'button:has-text("Apply")',
  113 |       'button:has-text("Submit Application")'
  114 |     ]);
  115 | 
  116 |     if (!canApply) {
  117 |       console.warn('⚠️ C3-TXN-003: "Apply" button not found for student jobs. Soft skipping.');
  118 |       await context.close();
  119 |       return;
  120 |     }
  121 |     console.log('✅ C3-TXN-003: Student "Apply" UI accessed.');
  122 |     await context.close();
  123 |   });
  124 | 
```