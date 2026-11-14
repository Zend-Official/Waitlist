// How it works — for sellers (frames 4-7). One boy, four poses, built from
// animation layers (src/assets/sellers/parts, positions in boy-parts.json).
//
// Everything about the boy is in his own canvas: 1452 x 1452 px. In the frames
// that canvas is drawn 726 units wide on desktop (top-left at 500, 367) and
// 403 units wide on mobile (top-left at 0, 413). Bubble and phone positions
// are given as % of the canvas, so they scale with him.

export type PoseKey = 'worried' | 'wink' | 'packing' | 'peace';

/**
 * Layers per pose, bottom to top. 'full' is the original single picture of
 * the pose (no seams between cut-out layers); 'eyes' (closed) is shown only
 * to blink. Packing keeps its separate layers so the bag can push into the box.
 */
export const POSE_LAYERS: Record<PoseKey, string[]> = {
  worried: ['full', 'eyes'],
  wink: ['full', 'eyes'],
  packing: ['body', 'head', 'eyes', 'arms-bag', 'box-front', 'phone'],
  peace: ['full', 'eyes'],
};

/**
 * Idle animation pivots (canvas px): the neck for the head, the shoulder for
 * an arm. Movements stay small so the painted-under body never shows edges.
 */
export const PIVOTS: Record<string, [number, number]> = {
  'worried-head': [597, 528],
  'worried-arm-phone': [1205, 612],
  'worried-arm-forehead': [560, 878],
  'wink-head': [599, 524],
  'wink-arm-phone': [478, 900],
  'packing-head': [631, 503],
  'peace-head': [718, 513],
  'peace-arm-peace': [515, 880],
  'peace-arm-phone': [1150, 950],
};

/** The phone in each pose: centre (% of canvas), width (% of canvas), tilt (deg). */
export const PHONE: Record<PoseKey, { x: number; y: number; w: number; rot: number }> = {
  worried: { x: 66.3, y: 54.8, w: 8.5, rot: 8 },
  wink: { x: 27.1, y: 28.7, w: 9.5, rot: -14 },
  packing: { x: 83.5, y: 93.7, w: 13, rot: -58 },
  peace: { x: 69.1, y: 31, w: 7.5, rot: 10 },
};

/** x, y: % of the boy's canvas; my: y on mobile when the text wraps to more lines. */
export type Bubble = { x: number; y: number; my?: number } & (
  | { kind: 'them'; who: string; text: string }
  | { kind: 'you'; who: string; text: string }
  | { kind: 'you-card'; who: string; lines: string[]; button: string }
  | { kind: 'zend'; who: string; text: string; green?: boolean }
);

export type SellerFrame = {
  pose: PoseKey;
  title: string[];
  body: string;
  bubbles: Bubble[];
};

export const SELLER_FRAMES: SellerFrame[] = [
  {
    pose: 'worried',
    title: ['Selling on', 'social media'],
    body: 'Your products are real.\nBut new customers don’t trust you yet',
    bubbles: [
      { kind: 'them', who: 'Treasure', text: 'How do i know you won’t run with my money?', x: 66.9, y: 7.3 },
      { kind: 'you', who: 'You', text: 'They are real bags, I promise!', x: 66.9, y: 23.8, my: 26.5 },
      { kind: 'them', who: 'Treasure', text: 'Prove it.', x: 66.9, y: 37.6, my: 42 },
    ],
  },
  {
    pose: 'wink',
    title: ['Share a', 'Zend link'],
    body: 'Share it wherever you sell. Buyers see who they’re paying and know their money is 100% protected',
    bubbles: [
      { kind: 'you-card', who: 'You', lines: ['Vox bags', 'N150, 000'], button: 'Pay with Zend', x: 76.2, y: 3.2 },
      { kind: 'them', who: 'Treasure', text: 'Oh, it’s Zend? Okay, I’ll pay now.', x: 59.9, y: 25.9 },
    ],
  },
  {
    pose: 'packing',
    title: ['Cha-ching!', 'They paid'],
    body: 'Your money is 100% safe with us. Go ahead and ship the item. The second the buyer confirms they received it, the cash is yours',
    bubbles: [{ kind: 'zend', who: 'Zend', text: 'Treasure paid for your Vox’s bag. Now, you can send her order.', x: 65.2, y: 36.2 }],
  },
  {
    pose: 'peace',
    title: ['Build trust.', 'Get paid'],
    body: 'Buyers trust Zend, so they trust you. Once they confirm their order, you get paid. Its that simple!',
    bubbles: [
      { kind: 'zend', who: 'Zend', text: 'You’ve been paid for Vox’s bag.', x: 71.9, y: -0.1, my: 36, green: true }, // phones: below his face
      { kind: 'them', who: 'Treasure', text: 'Got it! Love the bag. I’ll buy again.', x: 71.9, y: 13.6, my: 15.5 },
    ],
  },
];

/** The dark shape along the bottom (fill #140027), as exported. */
export const SELLER_SHAPE = {
  desktop: {
    offset: [238, 748] as const,
    d: 'M112.654 252.314L1364.91 2.85415C1483.34 -20.7386 1574.07 106.648 1513.05 210.859L820.169 1394.33C799.46 1429.7 764.285 1454.22 723.929 1461.41L343.099 1529.28C266.989 1542.84 194.295 1492.14 180.733 1416.03L155.748 1275.83C147.913 1231.86 161.528 1186.8 192.396 1154.52L778.502 541.708L263.426 825.612C179.459 871.892 74.8678 821.968 58.0472 727.579L2.19336 414.154C-11.1756 339.134 37.9202 267.202 112.654 252.314Z',
  },
  mobile: {
    offset: [0, 569] as const,
    d: 'M374.683 500L585.067 75.1268C604.964 34.9444 568.055 -9.88691 524.8 1.92281L33.5738 136.039C18.8915 140.047 6.70357 150.29 0.227573 164.064L-60.8855 294.047C-73.0991 320.025 -61.9414 350.984 -35.9644 363.198L11.8885 385.696C26.895 392.752 44.3676 392.223 58.9206 384.273L335.237 233.325L183.703 390.574C159.001 416.208 166.798 458.529 199.015 473.676L305.991 523.972C331.597 536.011 362.128 525.356 374.683 500Z',
  },
} as const;
