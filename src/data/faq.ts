// FAQ questions and answers. Facts from the user (2026-11-13): WhatsApp first
// (other social apps later), no app to download, free for now, pay and get
// paid in naira, dispute then refund, instant payout, Nigeria first then more
// of Africa. Plain words for everyday people: "crypto" only in the partners
// answer (the user's rule).
// Shown as chat chips in the FAQ card: one answer open at a time.
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is Zend?',
    a: 'Zend helps you buy and sell on social media without fear, starting with WhatsApp. We keep the money safe until the buyer gets their order.',
  },
  {
    q: 'How does Zend keep my money safe?',
    a: "When you pay, we hold the money for you. The seller only gets it after you tell us you've received your order.",
  },
  {
    q: 'What if my order never arrives?',
    a: "Tell us. We'll look into it and give you your money back. The seller never gets paid until you say you've received your order.",
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. Zend works right in the chat. You talk to the seller and pay in the same place, starting with WhatsApp, with more social media apps coming soon.',
  },
  {
    q: 'How do I pay?',
    a: 'You pay in naira, the same way you pay for anything else. Sellers also get paid in naira.',
  },
  {
    q: 'I sell on social media. Why use Zend?',
    a: 'Customers trust you faster when they know their money is safe, so you sell more. And once they confirm they got their order, you get paid immediately.',
  },
  {
    q: 'How much does Zend cost?',
    a: "Nothing. Zend is free for now.",
  },
  {
    q: 'Where can I use Zend?',
    a: "We're starting in Nigeria on WhatsApp. More African countries and other social media apps are coming soon.",
  },
  {
    q: 'Who are your partners?',
    a: 'We work with Stellar, a trusted crypto network used around the world. It keeps a secure record of every payment, so no one can tamper with your money.',
  },
  {
    q: 'When can I start using Zend?',
    a: "Very soon. Join the waitlist and we'll tell you the moment it's ready.",
  },
];

/**
 * Dark shape on the left behind the FAQ card (fill #140027), traced from the
 * user's faq-desktop.png (992x731) and faq-obile.png (346x494). Coordinates
 * are those PNGs' pixels; `offset` places them in the frame (both sit on the
 * frame's left edge and run off its bottom). Points at x <= 0 stay pinned to
 * the screen's left edge.
 */
export const FAQ_SHAPE = {
  desktop: {
    offset: [0, 659] as const, // top edge level with the middle of the card (frame y 661)
    d: 'M-60 2L850 7C971 7 1035 153 954 243L442 810L-60 810L-60 575L168 416L-60 488Z',
  },
  mobile: {
    offset: [0, 505] as const, // top edge level with the middle of the card (frame y 512)
    d: 'M-40 8.5L289.7 0C335 -1.2 360.5 51.6 331.2 86.3L-35 520L-40 520L-40 221.6L43 159L-40 187.8Z',
  },
} as const;
