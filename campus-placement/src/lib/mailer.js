import nodemailer from 'nodemailer';
import { getPlatformSettings } from '@/lib/platformSettings';
import { query } from '@/lib/db';

function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  /** Gmail app passwords may be pasted with spaces; SMTP expects 16 chars without spaces. */
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Resolve final recipients. Env wins for emergency override; else super-admin "system notification inbox"
 * (when set); otherwise the original address(es).
 * @param {string | string[]} originalTo
 * @param {Awaited<ReturnType<typeof getPlatformSettings>>} platform
 */
function resolveRecipients(originalTo, platform) {
  const envOverride = process.env.OUTBOUND_EMAIL_OVERRIDE?.trim();
  if (envOverride) return envOverride;
  const inbox = String(platform?.systemNotificationInboxEmail || '').trim();
  if (inbox) return inbox;
  return originalTo;
}

function formatFrom(platform) {
  const addr = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!addr) return null;
  const name = String(platform?.systemNotificationSenderName || platform?.platformName || 'PlacementHub').trim();
  const safeName = name.replace(/["\r\n]/g, '');
  if (addr.includes('<') && addr.includes('>')) return addr;
  return `"${safeName}" <${addr}>`;
}

function normalizeTo(v) {
  if (Array.isArray(v)) return v.join(', ');
  return v == null ? '' : String(v);
}

/** Extract bare email from `addr` or `"Name" <addr>`. */
function extractEmailFromRaw(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = s.match(/<([^<>]+@[^<>]+)>/);
  if (m) return m[1].trim();
  return s;
}

/**
 * If `address` matches a user or tenant primary email, return their communication_email (fallback: primary email).
 */
async function resolveCommunicationRouteForAddress(address) {
  const extracted = extractEmailFromRaw(address);
  if (!extracted.includes('@')) return null;
  const lower = extracted.toLowerCase();
  try {
    const r = await query(
      `SELECT COALESCE(
         (SELECT COALESCE(NULLIF(TRIM(u.communication_email), ''), u.email)
          FROM users u WHERE LOWER(u.email) = $1 LIMIT 1),
         (SELECT COALESCE(NULLIF(TRIM(t.communication_email), ''), t.email)
          FROM tenants t WHERE t.email IS NOT NULL AND LOWER(t.email) = $1 LIMIT 1)
       ) AS resolved`,
      [lower],
    );
    const resolved = r.rows[0]?.resolved;
    if (resolved && String(resolved).trim()) return String(resolved).trim();
  } catch (e) {
    console.warn('[mail] resolveCommunicationRouteForAddress failed:', e.message);
  }
  return null;
}

/**
 * Rewrite each recipient to users.communication_email / tenants.communication_email when the address is known.
 * Unknown addresses are unchanged. Then platform override (OUTBOUND_EMAIL_OVERRIDE / system inbox) still applies.
 * @param {string | string[]} to
 */
async function routeThroughCommunicationEmails(to) {
  if (Array.isArray(to)) {
    const out = [];
    for (const item of to) {
      const raw = String(item || '').trim();
      if (!raw) continue;
      const extracted = extractEmailFromRaw(raw);
      const resolved = await resolveCommunicationRouteForAddress(extracted);
      if (resolved && resolved.toLowerCase() !== extracted.toLowerCase()) {
        out.push(resolved);
      } else {
        out.push(raw);
      }
    }
    return out;
  }
  if (typeof to === 'string' && to.includes(',')) {
    const parts = to.split(',').map((p) => p.trim()).filter(Boolean);
    const routed = await routeThroughCommunicationEmails(parts);
    return routed.join(', ');
  }
  const raw = String(to || '').trim();
  if (!raw) return to;
  const extracted = extractEmailFromRaw(raw);
  const resolved = await resolveCommunicationRouteForAddress(extracted);
  if (resolved && resolved.toLowerCase() !== extracted.toLowerCase()) {
    return resolved;
  }
  return raw;
}

/**
 * @param {object} row
 */
async function persistMailDeliveryLog(row) {
  try {
    await query(
      `INSERT INTO mail_delivery_logs (
        context, status, skip_reason, original_to, resolved_to, subject_truncated,
        error_message, error_code, message_id, smtp_response, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::uuid)`,
      [
        row.context || null,
        row.status,
        row.skipReason || null,
        row.originalTo ? normalizeTo(row.originalTo).slice(0, 2000) : null,
        row.resolvedTo ? normalizeTo(row.resolvedTo).slice(0, 2000) : null,
        row.subject ? String(row.subject).slice(0, 500) : null,
        row.errorMessage ? String(row.errorMessage).slice(0, 4000) : null,
        row.errorCode ? String(row.errorCode).slice(0, 100) : null,
        row.messageId ? String(row.messageId).slice(0, 500) : null,
        row.smtpResponse ? String(row.smtpResponse).slice(0, 2000) : null,
        row.userId || null,
      ],
    );
  } catch (e) {
    console.warn('[mail] persistMailDeliveryLog failed (non-fatal):', e.message);
  }
}

/** Subject line for new-student account email (form + CSV import). */
export const STUDENT_WELCOME_SUBJECT = 'Your PlacementHub Account is Ready';

/**
 * Plain-text body for new student welcome (temporary password + system ID).
 * @param {{ firstName?: string | null, email: string, tempPass: string, systemId: string }} p
 */
export function studentWelcomeEmailBody({ firstName, email, tempPass, systemId }) {
  const fn = (firstName && String(firstName).trim()) || 'Student';
  return (
    `Hello ${fn},\n\nYour campus placement account has been created.\n\n` +
    `Login: ${email}\nTemporary Password: ${tempPass}\n\n` +
    `Please log in and change your password.\n\nSystem ID: ${systemId}\n\n` +
    `Best regards,\nPlacementHub Team`
  );
}

/**
 * @param {{ to: string | string[], subject: string, text: string, html?: string, context?: string, userId?: string }} opts
 * @param {string} [opts.context] — optional label for logs (e.g. `guest_confirmation`, `student_welcome`)
 * @param {string} [opts.userId] — optional acting user (stored in `mail_delivery_logs.user_id`)
 */
export async function sendMail(opts) {
  const { context, userId, ...mailOpts } = opts;
  const logCtx = context ? `[mail:${context}]` : '[mail]';
  const originalTo = mailOpts.to;
  const platform = await getPlatformSettings();
  const from = formatFrom(platform);
  if (!from) {
    console.warn(`${logCtx} skip: EMAIL_FROM / SMTP_USER not set (no From address)`);
    console.warn(`${logCtx} would-send to=%s subject=%s`, String(originalTo), mailOpts.subject);
    await persistMailDeliveryLog({
      context,
      status: 'skipped',
      skipReason: 'no_from',
      originalTo,
      resolvedTo: null,
      subject: mailOpts.subject,
      userId,
    });
    return { skipped: true, reason: 'no_from' };
  }

  const transport = createTransport();
  if (!transport) {
    console.warn(`${logCtx} skip: SMTP_USER / SMTP_PASS not set (no transport)`);
    console.warn(`${logCtx} would-send to=%s subject=%s`, String(originalTo), mailOpts.subject);
    await persistMailDeliveryLog({
      context,
      status: 'skipped',
      skipReason: 'no_smtp_credentials',
      originalTo,
      resolvedTo: null,
      subject: mailOpts.subject,
      userId,
    });
    return { skipped: true, reason: 'no_smtp_credentials' };
  }

  const afterCommunication = await routeThroughCommunicationEmails(mailOpts.to);
  if (String(normalizeTo(afterCommunication)) !== String(normalizeTo(originalTo))) {
    console.info(
      `${logCtx} routed to communication email: before=%s after=%s`,
      String(normalizeTo(originalTo)),
      String(normalizeTo(afterCommunication)),
    );
  }

  const to = resolveRecipients(afterCommunication, platform);
  const redirected =
    String(normalizeTo(afterCommunication)) !== String(Array.isArray(to) ? to.join(',') : to);
  if (redirected) {
    console.info(
      `${logCtx} recipient redirect active: beforePlatformOverride=%s resolvedTo=%s (OUTBOUND_EMAIL_OVERRIDE or systemNotificationInboxEmail)`,
      String(normalizeTo(afterCommunication)),
      String(to),
    );
  }

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: mailOpts.subject,
      text: mailOpts.text,
      html: mailOpts.html || mailOpts.text.replace(/\n/g, '<br/>'),
    });
    console.info(
      `${logCtx} sent ok to=%s subject=%s messageId=%s response=%s`,
      String(to),
      mailOpts.subject,
      info.messageId ?? '(none)',
      info.response ?? '(none)',
    );
    await persistMailDeliveryLog({
      context,
      status: 'sent',
      originalTo,
      resolvedTo: to,
      subject: mailOpts.subject,
      messageId: info.messageId,
      smtpResponse: info.response,
      userId,
    });
    return { sent: true, messageId: info.messageId, response: info.response };
  } catch (err) {
    const e = err && typeof err === 'object' ? err : new Error(String(err));
    console.error(`${logCtx} SEND FAILED to=%s subject=%s`, String(to), mailOpts.subject);
    console.error(`${logCtx} error: %s`, e.message);
    if (e.code) console.error(`${logCtx} code: %s`, e.code);
    if (e.command) console.error(`${logCtx} smtp command: %s`, e.command);
    if (e.response) console.error(`${logCtx} smtp response: %s`, String(e.response).slice(0, 500));
    if (e.responseCode) console.error(`${logCtx} smtp responseCode: %s`, e.responseCode);
    if (process.env.NODE_ENV === 'development' && e.stack) {
      console.error(`${logCtx} stack: %s`, e.stack.split('\n').slice(0, 8).join('\n'));
    }
    await persistMailDeliveryLog({
      context,
      status: 'failed',
      originalTo,
      resolvedTo: to,
      subject: mailOpts.subject,
      errorMessage: e.message,
      errorCode: e.code != null ? String(e.code) : null,
      smtpResponse: e.response != null ? String(e.response).slice(0, 2000) : null,
      userId,
    });
    throw err;
  }
}
