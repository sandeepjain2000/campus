/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function readEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

async function main() {
  const env = readEnvLocal();
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || env.DATABASE_URL || env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const col = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'employer_assessment_rows' AND column_name = 'hiring_result'`,
  );
  const ctx = await client.query(`SELECT to_regclass('public.employer_assessment_contexts') AS name`);
  await client.end();
  console.log('hiring_result column:', col.rows.length ? 'OK' : 'MISSING');
  console.log('employer_assessment_contexts:', ctx.rows[0]?.name ? 'OK' : 'MISSING');
  if (!col.rows.length) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
