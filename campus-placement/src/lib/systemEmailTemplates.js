/** Keys stored in `system_email_templates` (Super Admin–editable). */
export const CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY = 'campus_guest_confirmation';
export const SPONSORSHIP_THANK_YOU_TEMPLATE_KEY = 'sponsorship_thank_you';
export const SPONSORSHIP_DONATION_RECEIPT_TEMPLATE_KEY = 'sponsorship_donation_receipt';

export const EDITABLE_SYSTEM_EMAIL_TEMPLATE_KEYS = [
  CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY,
  SPONSORSHIP_THANK_YOU_TEMPLATE_KEY,
  SPONSORSHIP_DONATION_RECEIPT_TEMPLATE_KEY,
];

/** @type {Set<string>} */
export const EDITABLE_SYSTEM_EMAIL_TEMPLATE_KEY_SET = new Set(EDITABLE_SYSTEM_EMAIL_TEMPLATE_KEYS);

/**
 * UI + docs: human title, short summary, and Mustache-style placeholders for each template.
 * @type {Record<string, { title: string, summary: string, placeholders: string[] }>}
 */
export const SYSTEM_EMAIL_TEMPLATE_META = {
  [CAMPUS_GUEST_CONFIRMATION_TEMPLATE_KEY]: {
    title: 'Campus guest need — employer confirmation',
    summary:
      'Prefills the email when you confirm interest in a published guest faculty or lecture listing. You can edit before sending.',
    placeholders: [
      'collegeName',
      'collegeCity',
      'collegeState',
      'listingTitle',
      'listingKind',
      'listingSummary',
      'listingRequirements',
      'timeHint',
      'employerName',
      'employerEmail',
      'employerCompany',
    ],
  },
  [SPONSORSHIP_THANK_YOU_TEMPLATE_KEY]: {
    title: 'Sponsorship — thank you to college',
    summary:
      'Intended for a thank-you note to the institution after your company sponsors a campus opportunity. Wire-up for send is separate; Super Admins edit the default wording here.',
    placeholders: [
      'collegeName',
      'collegeCity',
      'collegeState',
      'employerName',
      'employerEmail',
      'employerCompany',
      'sponsorshipTierName',
      'sponsorshipCategory',
      'amountInr',
      'placementSeasonLabel',
    ],
  },
  [SPONSORSHIP_DONATION_RECEIPT_TEMPLATE_KEY]: {
    title: 'Sponsorship — donation receipt to employer',
    summary:
      'Sent when a college admin emails a tax/records receipt for a recorded sponsorship payment. Triggered from College → Sponsorships.',
    placeholders: [
      'collegeName',
      'collegeCity',
      'collegeState',
      'employerCompany',
      'employerName',
      'employerEmail',
      'billingLegalName',
      'billingPan',
      'billingGstNumber',
      'receiptNumber',
      'receiptDate',
      'paymentRecordedDate',
      'amountInr',
      'tierName',
      'category',
      'paymentMethodLabel',
      'taxNote',
    ],
  },
};
