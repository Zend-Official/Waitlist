// Shared environment checks (must match the CSS media queries in global.css).
export const MQ_MOBILE = '(max-aspect-ratio: 5/4)';
export const MQ_DESKTOP = 'not all and (max-aspect-ratio: 5/4)';

export const isLite = () => document.documentElement.classList.contains('lite');
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobileLayout = () => window.matchMedia(MQ_MOBILE).matches;

/** Value of a CSS custom property on :root, e.g. token('--c-shape'). */
export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Frame size (Figma px) of the active layout. */
export const frame = () => (isMobileLayout() ? { w: 402, h: 874 } : { w: 1728, h: 1117 });

/** Current size of one design unit (1 Figma px) in CSS px — mirrors --u in global.css. */
export function unit(): number {
  const f = frame();
  const hero = document.querySelector<HTMLElement>('.hero');
  const w = hero?.offsetWidth ?? window.innerWidth;
  const h = hero?.offsetHeight ?? window.innerHeight;
  return Math.min(w / f.w, h / f.h);
}

/** How much the arrow is stretched sideways beyond the frame (it spans the screen width). */
export function stretch(): { x: number } {
  const hero = document.querySelector<HTMLElement>('.hero');
  return { x: (hero?.offsetWidth ?? 0) / (frame().w * unit()) };
}
