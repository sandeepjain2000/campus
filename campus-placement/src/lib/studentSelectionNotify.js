import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { studentApplicationsHrefForType } from '@/lib/studentSelectionOffer';

function appOrigin() {
  const u = process.env.NEXTAUTH_URL;
  if (u) return u.replace(/\/$/, '');
  const v = process.env.VERCEL_URL;
  if (v) return (v.startsWith('http') ? v : `https://${v}`).replace(/\/$/, '');
  return '';
}

/**
 * Notify student of selection (in-app alert + email).
 * This is NOT the formal offer — see studentFormalOfferNotify.js.
 *
 * @param {{
 *   studentUserId: string;
 *   email: string;
 *   firstName: string;
 *   companyName: string;
 *   roleTitle: string;
 *   sourceKind?: 'drive' | 'program';
 *   programType?: string;
 * }} opts
 */
export async function notifyStudentSelection({
  studentUserId,
  email,
  firstName,
  companyName,
  roleTitle,
  sourceKind = 'drive',
  programType,
}) {
  const origin = appOrigin();
  const applicationsPath =
    sourceKind === 'drive'
      ? studentApplicationsHrefForType('drives')
      : studentApplicationsHrefForType(programType || 'internships');
  const applicationsLink = origin ? `${origin}${applicationsPath}` : applicationsPath;

  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        studentUserId,
        'Selection update',
        `You were selected by ${companyName} for ${roleTitle}. A formal offer letter will follow separately.`,
        'success',
        applicationsPath,
      ],
    );
  } catch (err) {
    console.error('Failed to create student selection in-app notification:', err);
  }

  try {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <h2 style="margin: 0; color: #ffffff;">Selection update</h2>
        </div>
        <div style="padding: 20px; line-height: 1.5;">
          <p>Hi ${firstName || 'there'},</p>
          <p>Congratulations — <strong>${companyName}</strong> has marked you <strong>selected</strong> for <strong>${roleTitle}</strong>.</p>
          <p style="margin: 12px 0; padding: 12px 14px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; color: #166534;">
            This is your <strong>selection</strong> outcome, not the formal offer. When the employer or placement office publishes the drafted offer letter, you will receive a separate email and can accept or decline on <strong>My Offers</strong>.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${applicationsLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Applications</a>
          </div>
          <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
            PlacementHub — selection notification (formal offer will follow separately).
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: email,
      subject: `[PlacementHub] Selected by ${companyName} — formal offer to follow`,
      text: [
        `Hi ${firstName || 'there'},`,
        '',
        `You were selected by ${companyName} for ${roleTitle}.`,
        'This is a selection update only. A formal offer letter will be sent separately when published.',
        `Track status: ${applicationsLink}`,
      ].join('\n'),
      html,
      context: 'student_selection',
      recipientUserId: studentUserId,
    });
  } catch (err) {
    console.error('Failed to send student selection email:', err);
  }
}
