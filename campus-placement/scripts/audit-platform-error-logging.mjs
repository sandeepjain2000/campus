/**
 * Audit employer API routes for buildPlatformErrorResponse / respondPlatformError in catch blocks.
 * Usage: node scripts/audit-platform-error-logging.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const apiRoot = path.join(root, 'src', 'app', 'api', 'employer');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.name === 'route.js') files.push(full);
  }
  return files;
}

const routes = walk(apiRoot);
const wired = [];
const missing = [];

for (const file of routes) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const hasHandlerCatch = /export async function (GET|POST|PATCH|PUT|DELETE)[\s\S]*?catch\s*\(/m.test(src);
  const hasLogging =
    src.includes('buildPlatformErrorResponse') || src.includes('respondPlatformError');
  if (hasHandlerCatch && !hasLogging) missing.push(rel);
  else if (hasLogging) wired.push(rel);
}

console.log('Platform error logging audit (employer API)\n');
console.log(`Wired (${wired.length}):`);
for (const r of wired.sort()) console.log(`  ✓ ${r}`);
console.log(`\nMissing handler-level logging (${missing.length}):`);
for (const r of missing.sort()) console.log(`  ✗ ${r}`);
process.exit(missing.length > 0 ? 1 : 0);
