# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c3_transactional.spec.js >> C-3 Transactional Flows & Cross-Role Visibility >> C3-TXN-004 – Employer shortlist decision reflects to student and college
- Location: qa\tests\c3_transactional.spec.js:125:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/dashboard/employer/applications", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e9] [cursor=pointer]:
    - img [ref=e10]
  - alert [ref=e13]
```

# Test source

```ts
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
  125 |   test('C3-TXN-004 – Employer shortlist decision reflects to student and college', async ({ browser }) => {
  126 |     const context = await browser.newContext();
  127 |     const page = await context.newPage();
  128 | 
  129 |     await loginAs(page, 'hr@techcorp.com');
> 130 |     await page.goto('/dashboard/employer/applications');
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  131 | 
  132 |     const canShortlist = await tryInitiateAction(page, [
  133 |       'button:has-text("Shortlist")',
  134 |       'button:has-text("Update Status")',
  135 |       'button[title="Shortlist"]'
  136 |     ]);
  137 | 
  138 |     if (!canShortlist) {
  139 |       console.warn('⚠️ C3-TXN-004: "Shortlist" action not found on applications. Soft skipping.');
  140 |       await context.close();
  141 |       return;
  142 |     }
  143 |     console.log('✅ C3-TXN-004: Employer "Shortlist" UI accessed.');
  144 |     await context.close();
  145 |   });
  146 | 
  147 |   test('C3-TXN-005 – Interview schedule visible to student, employer, and college', async ({ browser }) => {
  148 |     const context = await browser.newContext();
  149 |     const page = await context.newPage();
  150 | 
  151 |     await loginAs(page, 'hr@techcorp.com');
  152 |     await page.goto('/dashboard/employer/interviews');
  153 | 
  154 |     const canSchedule = await tryInitiateAction(page, [
  155 |       'button:has-text("Schedule Interview")',
  156 |       'button:has-text("New Interview")'
  157 |     ]);
  158 | 
  159 |     if (!canSchedule) {
  160 |       console.warn('⚠️ C3-TXN-005: "Schedule Interview" button not found. Soft skipping.');
  161 |       await context.close();
  162 |       return;
  163 |     }
  164 |     console.log('✅ C3-TXN-005: Employer "Schedule Interview" UI accessed.');
  165 |     await context.close();
  166 |   });
  167 | 
  168 |   test('C3-TXN-006 – Employer releases offer -> visible to student and college', async ({ browser }) => {
  169 |     const context = await browser.newContext();
  170 |     const page = await context.newPage();
  171 | 
  172 |     await loginAs(page, 'hr@techcorp.com');
  173 |     await page.goto('/dashboard/employer/offers');
  174 | 
  175 |     const canRelease = await tryInitiateAction(page, [
  176 |       'button:has-text("Release Offer")',
  177 |       'button:has-text("New Offer")'
  178 |     ]);
  179 | 
  180 |     if (!canRelease) {
  181 |       console.warn('⚠️ C3-TXN-006: "Release Offer" button not found. Soft skipping.');
  182 |       await context.close();
  183 |       return;
  184 |     }
  185 |     console.log('✅ C3-TXN-006: Employer "Release Offer" UI accessed.');
  186 |     await context.close();
  187 |   });
  188 | 
  189 |   test('C3-TXN-007 – Student accepts/rejects offer -> reflected back', async ({ browser }) => {
  190 |     const context = await browser.newContext();
  191 |     const page = await context.newPage();
  192 | 
  193 |     await loginAs(page, 'arjun.verma@iitm.edu');
  194 |     await page.goto('/dashboard/student/offers');
  195 | 
  196 |     const canRespond = await tryInitiateAction(page, [
  197 |       'button:has-text("Accept")',
  198 |       'button:has-text("Respond")'
  199 |     ]);
  200 | 
  201 |     if (!canRespond) {
  202 |       console.warn('⚠️ C3-TXN-007: "Accept/Respond Offer" button not found. Soft skipping.');
  203 |       await context.close();
  204 |       return;
  205 |     }
  206 |     console.log('✅ C3-TXN-007: Student "Offer Response" UI accessed.');
  207 |     await context.close();
  208 |   });
  209 | 
  210 |   test('C3-TXN-008 – Assessment upload and result mapping', async ({ browser }) => {
  211 |     const context = await browser.newContext();
  212 |     const page = await context.newPage();
  213 | 
  214 |     await loginAs(page, 'hr@techcorp.com');
  215 |     await page.goto('/dashboard/employer/assessment-uploads');
  216 | 
  217 |     const canUpload = await tryInitiateAction(page, [
  218 |       'button:has-text("Upload")',
  219 |       'button:has-text("New Assessment")'
  220 |     ]);
  221 | 
  222 |     if (!canUpload) {
  223 |       console.warn('⚠️ C3-TXN-008: "Upload Assessment" button not found. Soft skipping.');
  224 |       await context.close();
  225 |       return;
  226 |     }
  227 |     console.log('✅ C3-TXN-008: Employer "Upload Assessment" UI accessed.');
  228 |     await context.close();
  229 |   });
  230 | 
```