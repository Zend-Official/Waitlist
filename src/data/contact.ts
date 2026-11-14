// Zend's public contact details (from the user, 2026-11-14).
// The waitlist / contact Google Apps Script web app (public: it's in the
// site's code anyway). PUBLIC_WAITLIST_URL in .env overrides it.
export const SHEET_URL =
  (import.meta.env.PUBLIC_WAITLIST_URL as string | undefined) ||
  'https://script.google.com/macros/s/AKfycbzaRRVCFCn9CQecCP7m5WZN5KY_OvJQeQjxig6RCXkHCuXwNF2X3xveBqs4bkuGUU-m/exec';

/** Google Analytics (carried over from the old waitlist site). */
export const GA_ID = 'G-EV9V287KK1';
/** Facebook domain verification (carried over from the old waitlist site). */
export const FB_DOMAIN_VERIFICATION = 'asi9lykxtj8gd3mxh1uwh42vsrsv12';

export const CONTACT_EMAIL = 'officialzendit@gmail.com';
export const SOCIALS = {
  instagram: { handle: '@zend.hq', url: 'https://www.instagram.com/zend.hq' },
  x: { handle: '@Zend_Hq', url: 'https://x.com/Zend_Hq' },
} as const;
