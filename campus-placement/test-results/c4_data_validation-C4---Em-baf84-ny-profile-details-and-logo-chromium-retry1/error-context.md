# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: c4_data_validation.spec.js >> C4 - Employer Data Validation >> C4-EMP-001 - Company profile details and logo
- Location: qa\tests\c4_data_validation.spec.js:67:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3000/login?email=hr%40techcorp.com", waiting until "domcontentloaded"

```

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, open 'C:\Users\sandeep\Downloads\Claudes\CampusPlacement\campus-placement\test-results\.playwright-artifacts-8\traces\a02c64d2a8d7db6e5ee5-73408eea215687b1e8aa-retry1.trace'
```