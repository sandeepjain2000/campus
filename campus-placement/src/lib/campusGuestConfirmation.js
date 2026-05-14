import { query } from '@/lib/db';
import { applyEmailTemplate } from '@/lib/emailTemplateRender';
import {
  CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY,
  SPONSORSHIP_COLLEGE_THANKS_SPONSOR_TEMPLATE_KEY,
  SPONSORSHIP_DONATION_RECEIPT_TEMPLATE_KEY,
} from '@/lib/systemEmailTemplates';

export { CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY } from '@/lib/systemEmailTemplates';

export const GUEST_LISTING_KIND_LABEL = {
  guest_faculty: 'Guest faculty',
  guest_lecture: 'Guest lecture / session',
};

const FALLBACK_SUBJECT =
  'Guest engagement interest: {{listingTitle}} — {{employerCompany}}';

const FALLBACK_BODY = `Dear {{collegeName}} Placement Team,

We are writing regarding your published campus guest need.

Listing: {{listingTitle}}
Type: {{listingKind}}

Summary:
{{listingSummary}}

Requirements:
{{listingRequirements}}

Preferred timing: {{timeHint}}

—
From: {{employerName}}
Email: {{employerEmail}}
Organization: {{employerCompany}}

We confirm our interest and would like to discuss next steps at your convenience.

Best regards,
{{employerName}}
{{employerCompany}}`;

/**
 * @param {string} templateKey
 * @returns {Promise<{ template_key: string, subject_template: string, body_template: string, description?: string, updated_at?: string } | null>}
 */
export async function loadSystemEmailTemplate(templateKey) {
  try {
    const r = await query(
      `SELECT template_key, subject_template, body_template, description, updated_at
       FROM system_email_templates WHERE template_key = $1`,
      [templateKey],
    );
    const row = r.rows[0];
    if (row) return row;
  } catch (e) {
    console.warn('[campusGuestConfirmation] system_email_templates missing?', e.message);
  }
  if (templateKey === CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY) {
    return {
      template_key: templateKey,
      subject_template: FALLBACK_SUBJECT,
      body_template: FALLBACK_BODY,
      description: 'Fallback (run migration 027 to store in database)',
    };
  }
  if (templateKey === SPONSORSHIP_COLLEGE_THANKS_SPONSOR_TEMPLATE_KEY) {
    return {
      template_key: templateKey,
      subject_template: 'Thank you for supporting {{collegeName}}',
      body_template:
        'Dear {{employerName}},\n\nOn behalf of {{collegeName}}, thank you for your {{sponsorshipTierName}} sponsorship ({{amountInr}}).\n\nWe have sent a separate email with receipt details for your records.\n\n— {{collegeName}}\n',
      description: 'Fallback (run migration 036_sponsorship_auto_emails.sql)',
    };
  }
  if (templateKey === SPONSORSHIP_DONATION_RECEIPT_TEMPLATE_KEY) {
    return {
      template_key: templateKey,
      subject_template: 'Donation / sponsorship receipt {{receiptNumber}} — {{collegeName}}',
      body_template:
        'Dear {{employerName}},\n\nPlease find your sponsorship receipt details.\n\nReceipt: {{receiptNumber}}\nDate: {{receiptDate}}\nAmount (INR): {{amountInr}}\n\nLegal name: {{billingLegalName}}\nPAN: {{billingPan}}\nGSTIN: {{billingGstNumber}}\n\n{{collegeName}}\n{{taxNote}}\n',
      description: 'Fallback (run migration 034_sponsorship_donation_receipt.sql)',
    };
  }
  return null;
}

/**
 * @param {object} listingRow — columns from campus_engagement_listings + college_* aliases
 * @param {{ displayName: string, email: string, companyName: string }} employer
 */
export function buildCampusGuestSubstitutionVars(listingRow, employer) {
  return {
    collegeName: listingRow.college_name || '',
    collegeCity: listingRow.college_city || '',
    collegeState: listingRow.college_state || '',
    listingTitle: listingRow.title || '',
    listingKind: GUEST_LISTING_KIND_LABEL[listingRow.kind] || listingRow.kind || '',
    listingSummary: listingRow.summary || '—',
    listingRequirements: listingRow.requirements || '—',
    timeHint: listingRow.time_hint || '—',
    employerName: employer.displayName || '',
    employerEmail: employer.email || '',
    employerCompany: employer.companyName || '',
  };
}

export function renderTemplates(templateRow, vars) {
  return {
    subject: applyEmailTemplate(templateRow.subject_template, vars),
    body: applyEmailTemplate(templateRow.body_template, vars),
  };
}
