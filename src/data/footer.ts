// Footer link columns, shared by the home footer and the short footer on the
// other pages. `frame` links jump within the home page's story; `href` is
// where the link goes from any page.
export type FooterLink = { label: string; href: string; frame?: 'step1' | 'sell1' | 'secure' | 'faq' };

export const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how-it-works', frame: 'step1' },
      { label: 'For sellers', href: '/#for-sellers', frame: 'sell1' },
      { label: 'Security', href: '/#security', frame: 'secure' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQ', href: '/#faq', frame: 'faq' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Partners', href: '/partners' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms & conditions', href: '/terms' },
    ],
  },
];

/** Home-page hash -> story frame (used when arriving from another page). */
export const HASH_FRAMES: Record<string, 'step1' | 'sell1' | 'secure' | 'faq'> = {
  '#how-it-works': 'step1',
  '#for-sellers': 'sell1',
  '#security': 'secure',
  '#faq': 'faq',
};
