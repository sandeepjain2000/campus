import fs from 'fs';

/**
 * PostgreSQL SSL options for `pg` Pool / Client.
 * - Local hosts: TLS off (typical Docker / dev Postgres without SSL).
 * - Remote: verify server cert by default (mitigates MITM).
 * - Opt out only when needed: DATABASE_SSL_REJECT_UNAUTHORIZED=false or DB_SSL_REJECT_UNAUTHORIZED=false
 * - Optional CA bundle: DATABASE_SSL_CA=/path/to/ca.pem
 *
 * @param {string} [hostname]
 * @returns {false | import('pg').ConnectionConfig['ssl']}
 */
export function getPgSslOption(hostname) {
  const h = String(hostname || '').toLowerCase();
  const local = h === 'localhost' || h === '127.0.0.1' || h === '::1';
  if (local) return false;

  const insecure =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ||
    process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false';

  if (insecure) {
    return { rejectUnauthorized: false };
  }

  /** @type {Exclude<import('pg').ConnectionConfig['ssl'], boolean | undefined>} */
  const ssl = { rejectUnauthorized: true };
  const caPath = process.env.DATABASE_SSL_CA?.trim();
  if (caPath) {
    try {
      ssl.ca = fs.readFileSync(caPath, 'utf8');
    } catch (e) {
      throw new Error(`DATABASE_SSL_CA: cannot read ${caPath}: ${e.message}`);
    }
  }
  return ssl;
}
