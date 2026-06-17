import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

function appOrigin() {
  const u = process.env.NEXTAUTH_URL;
  if (u) return u.replace(/\/$/, '');
  const v = process.env.VERCEL_URL;
  if (v) return (v.startsWith('http') ? v : `https://${v}`).replace(/\/$/, '');
  return '';
}

/**
 * Notify student of selection (in-app alert + email)
 * @param {{ studentUserId: string, email: string, firstName: string, companyName: string, roleTitle: string, sourceKind: 'drive' | 'program' }} opts
 */
export async function notifyStudentSelection({ studentUserId, email, firstName, companyName, roleTitle, sourceKind }) {
  const origin = appOrigin();
  const link = origin ? `${origin}/dashboard/student/offers` : '/dashboard/student/offers';

  // 1. In-app notification
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        studentUserId,
        'Application Selected!',
        `Congratulations! You have been selected by ${companyName} for the role of ${roleTitle}.`,
        'success',
        link,
      ]
    );
  } catch (err) {
    console.error('Failed to create student selection in-app notification:', err);
  }

  // 2. Email alert
  try {
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <h2 style="margin: 0; color: #ffffff;">Congratulations! 🎉</h2>
        </div>
        <div style="padding: 20px; line-height: 1.5;">
          <p>Hi ${firstName || 'there'},</p>
          <p>We are thrilled to inform you that you have been <strong>selected</strong> by <strong>${companyName}</strong> for the position of <strong>${roleTitle}</strong>!</p>
          <p>Please log in to your PlacementHub dashboard to view the offer details and respond before the deadline.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Offers</a>
          </div>
          <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
            This is an automated notification regarding your application status on PlacementHub.
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: email,
      subject: `[PlacementHub] Selection Update: Selected by ${companyName}`,
      text: `Hi ${firstName || 'there'},\n\nCongratulations! You have been selected by ${companyName} for the position of ${roleTitle}.\n\nPlease log in to your dashboard to view your offers:\n\n${link}`,
      html,
      context: 'student_selection',
      recipientUserId: studentUserId,
    });
  } catch (err) {
    console.error('Failed to send student selection email:', err);
  }
}
