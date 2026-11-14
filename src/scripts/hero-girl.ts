import { T } from '../data/hiw';
import { prefersReducedMotion } from './env';
import { storyY } from './hero';

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
