import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY } from './smooth';
import { scenesReady, storyY } from './hero';
import { T } from '../data/hiw';

const KEY = 'zend-scroll';

/** Saved position (scaled to this screen height) the reload should resume at; 0 = top. */
export const resumeTarget = () => (window as unknown as { __zendResume?: number }).__zendResume ?? 0;

/**
 * Reload resumes where the visitor stopped, snapped to the nearest "frame":
 * every frame of the story (Hero 1, Hero 2, How it works steps 1-3), the
 * start and end of every pinned scene, and the top of every section. Base.astro reads the saved position before first paint;
 * this does the jump once the scroll scenes exist and are measured, while
 * the loading screen covers the page. Resolves when the page is in place.
 */
export function initRestore(): Promise<void> {
  // Remember the position for the next reload of this tab.
  const save = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ y: window.scrollY, h: window.innerHeight }));
    } catch {
      /* storage blocked: reloads start at the top */
    }
  };
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save());

  const target = resumeTarget();
  if (target <= 0) return Promise.resolve();

  const jump = () => {
    ScrollTrigger.refresh();
    const points = new Set<number>([0]);
    ScrollTrigger.getAll().forEach((st) => {
      if (st.pin) {
        points.add(Math.round(st.start));
        points.add(Math.round(st.end));
      }
    });
    // Every frame of the story: Hero 1, Hero 2, How it works steps 1-3.
    Object.values(T).forEach((t) => points.add(storyY(t)));
    document.querySelectorAll<HTMLElement>('[data-nav]').forEach((s) => {
      points.add(Math.round(s.getBoundingClientRect().top + window.scrollY));
    });
    let best = 0;
    points.forEach((p) => {
      if (Math.abs(p - target) < Math.abs(best - target)) best = p;
    });
    scrollToY(best, { immediate: true });
    ScrollTrigger.update();
  };

  // Wait for every scroll scene to be built, and for fonts so positions are
  // final (fonts never longer than a moment).
  const fonts = document.fonts?.ready ?? Promise.resolve();
  return scenesReady
    .then(() => Promise.race([fonts, new Promise((r) => setTimeout(r, 400))]))
    .then(() => new Promise<void>((r) => requestAnimationFrame(() => r())))
    .then(jump);
}
