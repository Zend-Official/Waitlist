import { T } from '../data/hiw';
import { prefersReducedMotion } from './env';
import { isStacked, storyY } from './hero';

/**
 * The hero girl is alive while she's on screen:
 *  - both: she blinks, and types on her phone (thumb-tap overlays swapped
 *    like a flip-book, in bursts)
 *  - Hero 1, worried: a slow worried sigh now and then, and her frown
 *    deepens for a moment
 *  - Hero 2, happy: gentle breathing and a happy little head bob
 *
 * The motion itself is plain CSS animation (Hero.astro, "The girl's idle
 * life"), which the browser runs on the graphics chip with no script per
 * frame. This only says which girl is on screen: html[data-girl] = 1 (Hero 1),
 * 2 (Hero 2) or nothing (neither, so nothing animates).
 * Runs in lite mode too; reduced motion turns it off (in the CSS as well).
 */
export function initHeroGirl(): void {
  if (prefersReducedMotion()) return;
  const html = document.documentElement;

  const check = () => {
    const y = window.scrollY;
    // Hero 1 until halfway into the change to Hero 2; Hero 2 until How it works.
    const now = y < storyY(T.hero1 + 0.5) ? '1' : y < storyY(T.step1) - 2 ? '2' : '';
    if ((html.dataset.girl ?? '') === now) return;
    if (now) html.dataset.girl = now;
    else delete html.dataset.girl;
  };

  // Start once the loading intro has finished (not underneath it: on slow
  // phones every animation frame during the intro is expensive).
  const start = () => {
    // Phones (the page scrolls normally): native, an IntersectionObserver
    // with a line across the middle of the screen; the girl whose hero
    // section is on that line animates.
    if (isStacked()) {
      const [h1, h2] = Array.from(document.querySelectorAll<HTMLElement>('.hero'));
      const on = new Set<string>();
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const k = e.target === h1 ? '1' : '2';
            if (e.isIntersecting) on.add(k);
            else on.delete(k);
          });
          const now = on.has('1') ? '1' : on.has('2') ? '2' : '';
          if (now) html.dataset.girl = now;
          else delete html.dataset.girl;
        },
        { rootMargin: '-50% 0px -50% 0px' },
      );
      if (h1) io.observe(h1);
      if (h2) io.observe(h2);
      return;
    }
    // Desktop: the pinned story (its scroll positions are frames, not sections).
    window.addEventListener('scroll', check, { passive: true });
    check();
  };
  if (!html.classList.contains('intro') && !html.classList.contains('loading')) return start();
  const mo = new MutationObserver(() => {
    if (html.classList.contains('intro') || html.classList.contains('loading')) return;
    mo.disconnect();
    setTimeout(start, 600);
  });
  mo.observe(html, { attributes: true, attributeFilter: ['class'] });
}
