const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');
const raw = fs.readFileSync(envPath, 'utf8');
let databaseUrl = null;
let supabaseUrl = null;
for (const line of raw.split(/\r?\n/)) {
  let m = line.match(/^SUPABASE_DATABASE_URL=(.+)$/);
  if (m) supabaseUrl = m[1].trim().replace(/^["']|["']$/g, '');
  m = line.match(/^DATABASE_URL=(.+)$/);
  if (m) databaseUrl = m[1].trim().replace(/^["']|["']$/g, '');
}

// Prefer explicit Supabase URL when both exist (e.g. local DB + cloud).
const url = supabaseUrl || databaseUrl || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  console.error('Set SUPABASE_DATABASE_URL or DATABASE_URL in .env.local (or environment).');
  process.exit(1);
}

if (supabaseUrl && databaseUrl && supabaseUrl !== databaseUrl) {
  console.log('Using SUPABASE_DATABASE_URL (Supabase).');
} else if (String(url).includes('supabase')) {
  console.log('Using Supabase connection string.');
}

const sqlPath = path.join(root, 'db', 'migrations', '002_platform_feedback.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  console.log('Applied:', sqlPath);
  await client.end();
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
