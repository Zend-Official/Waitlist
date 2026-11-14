// Site sections in story order. `icon` matches a file in src/assets/icons.
export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'how-it-works', label: 'How it works', icon: 'how' },
  { id: 'faq', label: 'FAQ', icon: 'faq' },
  { id: 'contact', label: 'Contact us', icon: 'support' },
  // Last button: a caret pointing down to the footer; on the footer it
  // points up and goes back home (nav.ts).
  { id: 'footer', label: 'Just Zend It', icon: 'caret' },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]['id'];
