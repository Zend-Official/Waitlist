// Geometry for the Hero scene, in Figma pixels (desktop frame 1728x1117,
// mobile frame 402x874), taken from the exported SVGs/PNGs in /assets.
// Which screen edges each piece is pinned to is set in Hero.astro.

// The dark arrow in each frame, in frame coordinates (Hero 2's desktop export
// started 257px in, so its path is shifted by that). Hero 1's arrow morphs
// into Hero 2's during the scroll. Arrows stretch to the screen width.
export const SHAPES = {
  h1: {
    desktop: {
      d: 'M330.527 -234.991L1559.24 581.96C1675.44 659.223 1645.84 837.507 1510.9 873.074L-21.4951 1277C-67.297 1289.07 -116.091 1280.46 -154.997 1253.44L-522.144 998.442C-595.518 947.481 -613.688 846.687 -562.727 773.313L-468.851 638.149C-439.411 595.763 -391.513 569.967 -339.919 568.714L639.691 544.939L-13.5447 357.347C-120.033 326.764 -164.954 200.597 -101.753 109.599L108.11 -192.564C158.342 -264.889 257.199 -283.746 330.527 -234.991Z',
    },
    mobile: {
      d: 'M32.4483 -55.1319L661.37 363.029C720.851 402.577 705.7 493.833 636.632 512.038L-147.736 718.789C-171.18 724.969 -196.156 720.562 -216.07 706.731L-403.997 576.209C-441.554 550.124 -450.854 498.532 -424.769 460.975L-376.718 391.791C-361.65 370.095 -337.132 356.891 -310.724 356.25L190.696 344.08L-143.667 248.06C-198.174 232.406 -221.167 167.826 -188.817 121.248L-81.3972 -33.4155C-55.6856 -70.4352 -5.08529 -80.0874 32.4483 -55.1319Z',
    },
    // Centroid of the arrow, used as the pivot of the page-load intro.
    origin: { desktop: [466.51, 606.33], mobile: [102.05, 375.5] },
  },
  h2: {
    desktop: {
      // Shifted +257 so it shares Hero 1's frame coordinates (needed for the morph).
      d: 'M1590.91 -156.762L355.733 240.297C238.915 277.849 221.278 435.779 326.931 498.177L1526.78 1206.79C1562.64 1227.97 1605.99 1232.37 1645.37 1218.82L2017.06 1090.97C2091.34 1065.41 2130.85 984.484 2105.3 910.203L2058.23 773.367C2043.47 730.456 2009.11 697.164 1965.76 683.753L1142.614 429.115L1740.22 426.781C1837.64 426.399 1905.85 330.404 1874.16 238.281L1768.94 -67.618C1743.75 -140.836 1664.63 -180.458 1590.91 -156.762Z',
    },
    mobile: {
      d: 'M-70.5237 8.4546L-84.5238 763.574C-85.8478 834.99 -2.18478 874.457 52.0868 828.02L668.421 300.656C686.842 284.893 697.43 261.848 697.387 237.602L696.989 8.79576C696.909 -36.9313 659.775 -73.9358 614.049 -73.8561L529.815 -73.7092C503.399 -73.6632 478.591 -61.015 463.037 -39.6635L167.714 365.743L279.011 36.1505C297.154 -17.5793 257.132 -73.2339 200.422 -73.135L12.1139 -72.8068C-32.9586 -72.7282 -69.6882 -36.6104 -70.5237 8.4546Z',
    },
  },
} as const;

// Girl images: where each exported PNG sits in its frame [x, y, w, h].
// The mobile Hero 2 girl is shown mirrored to match the mobile frame.
export const GIRL = {
  worried: { desktop: [571, 111, 1157, 1001], mobile: [-30, 484, 433.7, 375.2] },
  happy: { desktop: [0, 179, 1032, 938], mobile: [-3, 489, 406.5, 369.5] },
} as const;

// Price chip: top-left corner [x, y], size and tilt in each frame.
export const CHIP = {
  h1: { desktop: [1083, 410.07, 267.9, 129.4], mobile: [111, 598.25, 153.2, 70.22] },
  h2: { desktop: [329, 436.07, 267.9, 129.4], mobile: [97, 589.25, 153.2, 70.22] },
  tilt: { desktop: -9.1, mobile: -6.9 },
} as const;
