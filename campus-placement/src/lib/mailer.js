import nodemailer from 'nodemailer';

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
 * @param {{ to: string | string[], subject: string, text: string, html?: string }} opts
 */
export async function sendMail(opts) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!from) {
    console.warn('[mail] EMAIL_FROM / SMTP_USER not set; logging only');
    console.log('[mail would send]', opts.to, opts.subject);
    return { skipped: true };
  }

  const transport = createTransport();
  if (!transport) {
    console.warn('[mail] SMTP_USER / SMTP_PASS not set; logging only');
    console.log('[mail would send]', opts.to, opts.subject, opts.text?.slice(0, 200));
    return { skipped: true };
  }

  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text.replace(/\n/g, '<br/>'),
  });
  return { sent: true };
}
