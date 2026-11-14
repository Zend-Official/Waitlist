import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { storyTime, storyY } from './hero';
import { STORY_END, T } from '../data/hiw';
import { HASH_FRAMES } from '../data/footer';
import { scrollToY } from './smooth';
import { initSmoothScroll } from './smooth';
import { initHeroScroll } from './hero';
import { initNav } from './nav';
import { playIntro } from './intro';
import { initPress } from './press';
import { initPerfWatch } from './perf';
import { initTheme } from './theme';
import { initRestore } from './restore';
import { initFaqCard } from './faq';
import { initFooter } from './footer';
import { initScrollbar } from './scrollbar';
import { initDeferredImages } from './images';
import { initPageWave } from './page-wave';
import { initHeroGirl } from './hero-girl';
import { initJoinedCount } from './joined';

export function initApp() {
  // ScrollTrigger re-measures everything on these events. Skip its
  // DOMContentLoaded pass: the scroll scenes are measured as they're built,
  // and it would repeat on the page's load event anyway (each pass is costly
  // on slow phones).
  ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,load,resize' });
  initDeferredImages(); // first: hero images only, the rest after first scroll
  initPageWave();
  initTheme();
  initSmoothScroll();
  initHeroScroll(); // creates the hero pin first so later triggers account for it
  // The rest is set up in short steps after the intro has started, so a slow
  // phone is never frozen for seconds in one go (each step yields to the
  // browser). Everything is ready long before the visitor can scroll to it.
  const later = [
    () => {
      initNav();
      initFaqCard();
    },
    () => initFooter(),
    () => {
      initScrollbar();
      initHeroGirl();
      initJoinedCount();
      initPress();
      initPerfWatch();
    },
  ];
  const runLater = () => {
    const step = later.shift();
    if (!step) return;
    step();
    setTimeout(runLater, 0);
  };
  // Join waitlist: the form's code loads on the first tap (and quietly once
  // the page has settled, so that first tap opens it straight away).
  const loadWaitlist = () => import('./waitlist');
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-waitlist]');
    if (!btn) return;
    e.preventDefault();
    loadWaitlist().then((m) => m.openWaitlist(btn));
  });
  window.addEventListener('load', () => setTimeout(loadWaitlist, 4000), { once: true });

  // Keep the site's files in the browser (sw.js, made by the build): repeat
  // visits load from the cache. Production only, after the page has loaded.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
  }
  // Arriving from another page at /#how-it-works, /#security…: start at that
  // frame (behind the loading screen, like a reload).
  const frame = HASH_FRAMES[location.hash];
  if (frame) (window as unknown as { __zendResume?: number }).__zendResume = storyY(T[frame]);
  // Reload resumes at its frame behind the loading screen, which waits for it.
  playIntro(initRestore());
  setTimeout(runLater, 0);

  // Re-measure once fonts and images have settled.
  // (ScrollTrigger already re-measures on the page's load event by itself, so
  // no extra refresh there. Fonts: only if they were still loading when the
  // animations were first measured; each refresh is costly on slow phones.)
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  // Re-measure the scroll animations after a real resize. ScrollTrigger
  // already does this, except on touch screens it ignores height-only changes
  // under 25% (the address bar sliding in and out). That also skips genuine
  // resizes, e.g. a phone preset in the browser's device toolbar with a
  // similar width, leaving pieces measured for the old size until a reload.
  // So: once resizing stops, re-measure if the width changed or the height
  // changed by more than an address bar ever does (120px). The layout itself
  // uses the small-viewport height, so the address bar never moves it.
  // Keep your place in the story across any re-measure. Each frame is a
  // screen of scrolling, so after a resize the same pixel position would land
  // on a different frame; remember the story time instead and go back to it.
  let keepT: number | null = null;
  ScrollTrigger.addEventListener('refreshInit', () => {
    // Only while inside the story (past its end, e.g. the footer, pixels are fine).
    const inStory = window.scrollY > 0 && window.scrollY <= storyY(STORY_END) + 2;
    keepT = inStory ? storyTime() : null;
  });
  ScrollTrigger.addEventListener('refresh', () => {
    if (keepT === null) return;
    const t = keepT;
    keepT = null;
    scrollToY(storyY(t), { immediate: true });
  });

  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) <= 120) return;
      lastW = w;
      lastH = h;
      ScrollTrigger.refresh();
    }, 250);
  });
}
