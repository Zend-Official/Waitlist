import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MQ_MOBILE, isLite, prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Smooth scrolling on desktop (fine pointer) only; phones keep native scroll. */
export function initSmoothScroll(): Lenis | null {
  const wanted =
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia(MQ_MOBILE).matches &&
    !prefersReducedMotion() &&
    !isLite();
  if (!wanted) return null;

  // The FAQ card's list scrolls on its own (also marked data-lenis-prevent).
  lenis = new Lenis({ autoRaf: false, lerp: 0.1, prevent: (node) => !!node.closest?.('.faq-list') });
  lenis.on('scroll', ScrollTrigger.update);
  // Pinned scenes add scroll length after Lenis first measures the page;
  // re-measure whenever ScrollTrigger lays the page out again, or Lenis
  // would stop scrolling at the old page end.
  ScrollTrigger.addEventListener('refresh', resizeLenis);
  if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = lenis;
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function resizeLenis() {
  lenis?.resize();
}

function raf(time: number) {
  lenis?.raf(time * 1000);
}

/** Switch smooth scrolling off (e.g. the device turned out to be slow). */
export function stopSmoothScroll() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  ScrollTrigger.removeEventListener('refresh', resizeLenis);
  lenis.destroy();
  lenis = null;
  ScrollTrigger.refresh();
}

export const getLenis = () => lenis;

/** Scroll to a y position using Lenis when active, native scroll otherwise. */
export function scrollToY(y: number, opts: { duration?: number; immediate?: boolean } = {}) {
  if (lenis) {
    lenis.resize(); // make sure it knows the full page length
    lenis.scrollTo(y, { duration: opts.duration ?? 1.1, immediate: opts.immediate, force: true });
  } else {
    window.scrollTo({ top: y, behavior: opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}
