/* eslint-disable no-console */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function readEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    out[k] = v;
  }
  return out;
}

async function main() {
  const env = readEnvLocal();
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    env.DATABASE_URL ||
    env.SUPABASE_DATABASE_URL;
  if (!rawUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const summary = await client.query(
      `SELECT status, COUNT(*)::int AS n FROM mail_delivery_logs GROUP BY status ORDER BY status`,
    );
    console.log('--- mail_delivery_logs summary (counts by status) ---');
    console.log(JSON.stringify(summary.rows, null, 2));
    const r = await client.query(
      `SELECT id, created_at, context, status, skip_reason, original_to, resolved_to,
              subject_truncated, error_message, error_code, message_id,
              LEFT(smtp_response, 500) AS smtp_response_preview,
              user_id
       FROM mail_delivery_logs
       ORDER BY created_at DESC
       LIMIT 50`,
    );
    console.log('--- mail_delivery_logs rows (newest first, max 50) ---');
    console.log(JSON.stringify(r.rows, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
