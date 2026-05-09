# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c3_transactional.spec.js >> C-3 Transactional Flows & Cross-Role Visibility >> C3-TXN-012 – Clarification/discussion created by college
- Location: qa\tests\c3_transactional.spec.js:295:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/dashboard/college/overview", waiting until "load"

```

# Test source

```ts
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
  231 |   test('C3-TXN-009 – College bulk offers upload', async ({ browser }) => {
  232 |     const context = await browser.newContext();
  233 |     const page = await context.newPage();
  234 | 
  235 |     await loginAs(page, 'admin@iitm.edu');
  236 |     await page.goto('/dashboard/college/offers');
  237 | 
  238 |     const canUpload = await tryInitiateAction(page, [
  239 |       'button:has-text("Upload Offers")',
  240 |       'button:has-text("Import")'
  241 |     ]);
  242 | 
  243 |     if (!canUpload) {
  244 |       console.warn('⚠️ C3-TXN-009: "Upload Offers" button not found. Soft skipping.');
  245 |       await context.close();
  246 |       return;
  247 |     }
  248 |     console.log('✅ C3-TXN-009: College "Upload Offers" UI accessed.');
  249 |     await context.close();
  250 |   });
  251 | 
  252 |   test('C3-TXN-010 – Employer partnership request flow', async ({ browser }) => {
  253 |     const context = await browser.newContext();
  254 |     const page = await context.newPage();
  255 | 
  256 |     await loginAs(page, 'hr@techcorp.com');
  257 |     await page.goto('/dashboard/employer/select-campus');
  258 | 
  259 |     const canRequest = await tryInitiateAction(page, [
  260 |       'button:has-text("Request Partnership")',
  261 |       'button:has-text("Add Campus")',
  262 |       'button:has-text("Connect")'
  263 |     ]);
  264 | 
  265 |     if (!canRequest) {
  266 |       console.warn('⚠️ C3-TXN-010: "Request Partnership" button not found. Soft skipping.');
  267 |       await context.close();
  268 |       return;
  269 |     }
  270 |     console.log('✅ C3-TXN-010: Employer "Request Partnership" UI accessed.');
  271 |     await context.close();
  272 |   });
  273 | 
  274 |   test('C3-TXN-011 – College placement event creation', async ({ browser }) => {
  275 |     const context = await browser.newContext();
  276 |     const page = await context.newPage();
  277 | 
  278 |     await loginAs(page, 'admin@iitm.edu');
  279 |     await page.goto('/dashboard/college/calendar');
  280 | 
  281 |     const canCreate = await tryInitiateAction(page, [
  282 |       'button:has-text("Create Event")',
  283 |       'button:has-text("New Event")'
  284 |     ]);
  285 | 
  286 |     if (!canCreate) {
  287 |       console.warn('⚠️ C3-TXN-011: "Create Event" button not found. Soft skipping.');
  288 |       await context.close();
  289 |       return;
  290 |     }
  291 |     console.log('✅ C3-TXN-011: College "Create Event" UI accessed.');
  292 |     await context.close();
  293 |   });
  294 | 
  295 |   test('C3-TXN-012 – Clarification/discussion created by college', async ({ browser }) => {
  296 |     const context = await browser.newContext();
  297 |     const page = await context.newPage();
  298 | 
  299 |     await loginAs(page, 'admin@iitm.edu');
  300 |     // We don't have a specific discussion board route in the earlier lists, checking reports or general
> 301 |     await page.goto('/dashboard/college/overview');
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  302 | 
  303 |     const canDiscuss = await tryInitiateAction(page, [
  304 |       'button:has-text("Start Discussion")',
  305 |       'button:has-text("New Announcement")'
  306 |     ]);
  307 | 
  308 |     if (!canDiscuss) {
  309 |       console.warn('⚠️ C3-TXN-012: "Start Discussion/Announcement" button not found. Soft skipping.');
  310 |       await context.close();
  311 |       return;
  312 |     }
  313 |     console.log('✅ C3-TXN-012: College "Discussion" UI accessed.');
  314 |     await context.close();
  315 |   });
  316 | });
  317 | 
```