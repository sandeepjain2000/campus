import { randomBytes } from 'crypto';
import { sendMail } from '@/lib/mailer';

function appOrigin() {
  const u = process.env.NEXTAUTH_URL;
  if (u) return u.replace(/\/$/, '');
  const v = process.env.VERCEL_URL;
  if (v) return (v.startsWith('http') ? v : `https://${v}`).replace(/\/$/, '');
  return '';
}

export function newEmailVerificationToken() {
  return randomBytes(32).toString('hex');
}

/**
 * @param {{ to: string, firstName: string, token: string, role: string }} opts
 */
export async function sendSignupVerificationEmail({ to, firstName, token, role }) {
  const base = appOrigin();
  const link = base ? `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}` : '';

  const roleLine =
    role === 'student'
      ? 'Once verified, you can sign in and complete your placement profile.'
      : 'Once verified, your registration will remain with our team until your account is approved.';

  const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #eef2ff; padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; color: #312e81;">Verify your email</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${firstName || 'there'},</p>
          <p>Thanks for registering on PlacementHub. Please confirm your email address to activate your account.</p>
          <p style="font-size: 14px; color: #4b5563;">${roleLine}</p>
          ${
            link
              ? `<p style="margin-top: 24px;"><a href="${link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: 700;">Verify email</a></p>
                 <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">This link expires in 48 hours. If the button does not work, paste this URL into your browser:<br/><span style="word-break: break-all;">${link}</span></p>`
              : '<p><strong>Note:</strong> Email verification link could not be built (missing NEXTAUTH_URL / VERCEL_URL). Ask your administrator to set NEXTAUTH_URL.</p>'
          }
          <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">If you did not create an account, you can ignore this message.</p>
        </div>
      </div>
    `;

  await sendMail({
    to,
    subject: '[PlacementHub] Verify your email address',
    text: `Hi ${firstName || 'there'},\n\nVerify your PlacementHub account by opening this link (expires in 48 hours):\n\n${link || '(link unavailable — set NEXTAUTH_URL)'}\n\n${roleLine}\n\nIf you did not sign up, ignore this email.`,
    html,
  });
}
