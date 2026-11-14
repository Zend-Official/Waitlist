// How it works (buyer steps), frame 1 design. Values are Figma px in the
// 1728x1117 (desktop) and 402x874 (mobile) frames.

/**
 * Dark shape on the right edge, exported as SVGs whose path overhangs the
 * visible box. `offset` places the visible box in the frame (right edge).
 * Fill comes from the SVG: #140027 (day).
 */
export const HIW_SHAPE = {
  desktop: {
    offset: [1389, 138] as const,
    d: 'M784.504 709.695L449.171 44.8708C417.457 -18.0052 326.348 -13.9105 300.401 51.5561L5.74293 795.023C-3.06429 817.245 -1.68864 842.211 9.50729 863.331L115.162 1062.64C136.277 1102.47 185.684 1117.65 225.516 1096.53L298.891 1057.64C321.902 1045.44 337.71 1022.99 341.445 997.217L412.347 507.827L467.002 846.419C475.912 901.615 536.422 931.72 585.821 905.533L749.854 818.579C789.116 797.767 804.517 749.371 784.504 709.695Z',
  },
  mobile: {
    offset: [217, 282] as const,
    d: 'M491.506 427.984L242.28 24.6671C218.709 -13.4766 161.139 -5.87604 148.275 37.0774L2.18516 524.876C-2.18142 539.456 0.0622117 555.218 8.32415 568.001L86.2909 688.631C101.873 712.739 134.047 719.651 158.155 704.069L202.565 675.366C216.492 666.365 225.287 651.258 226.241 634.703L244.343 320.365L297.607 532.15C306.29 566.674 346.328 582.448 376.226 563.124L475.505 498.957C499.268 483.599 506.38 452.053 491.506 427.984Z',
  },
} as const;

/** The three buyer steps. Desktop and mobile line breaks follow the frames. */
export const STEPS = [
  {
    title: { desktop: ['Tap on the', 'Seller’s link'], mobile: ['Tap on the', 'Seller’s link'] },
    body: {
      desktop: 'Open it right in the chat to verify the price and details first.',
      mobile: 'Tap on the link provided by the seller',
    },
  },
  {
    title: { desktop: ['Pay in chat'], mobile: ['Pay in', 'Chat'] },
    body: {
      desktop: 'Pay securely with ease in chat using your favorite payment method',
      mobile: 'Pay securely with ease in chat using your favorite payment method',
    },
  },
  {
    title: { desktop: ['Confirm your order'], mobile: ['Confirm your', 'order'] },
    body: {
      desktop: 'Once it arrives, tap confirm to release payment to the seller.',
      mobile: 'Once it arrives, tap confirm to release payment to the seller.',
    },
  },
] as const;

/** Desktop step positions: number badge (50x50) and the text block's top-left. */
export const STEP_POS = [
  { badge: [124, 312], text: [214, 308] },
  { badge: [124, 603], text: [214, 599] },
  { badge: [124, 888], text: [214, 884] },
] as const;

/**
 * Story timeline (one pinned stage for Hero + How it works, one screen of
 * scrolling per unit). Each frame is complete at its time.
 */
export const T = {
  hero1: 0,
  hero2: 1,
  step1: 2,
  step2: 3,
  step3: 4,
  // How it works — for sellers (frames 4-7)
  sell1: 5,
  sell2: 6,
  sell3: 7,
  sell4: 8,
  // Security ("Safe for buyers. Sure for sellers")
  secure: 9,
  // FAQ ("Got any questions?")
  faq: 10,
} as const;

/** Story time when the last frame is complete (the pinned stage's length). */
export const STORY_END = T.faq;
