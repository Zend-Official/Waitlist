import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY_END } from '../data/hiw';
import { MQ_MOBILE } from './env';
import { storyY } from './hero';

gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger);

/**
 * Phones: one swipe = one frame (like TikTok). A swipe up or down glides to
 * the next or previous frame and plays its animation; free scrolling and
 * flinging past frames are off. Pages are the story's frames (0..STORY_END),
 * then the footer a screen at a time.
 *
 * Left alone (they scroll as usual):
 * - the FAQ card's questions: once the list can't scroll any further that
 *   way, the next swipe turns the page;
 * - the mobile nav strip, and the waitlist form.
 */
const IGNORE = ['.faq-list', '.rail__list', '.wl'];
const DURATION = 0.85;

export function initSwipePaging(): void {
  const wanted = () => window.matchMedia(MQ_MOBILE).matches && window.matchMedia('(pointer: coarse)').matches;
  let busy = false;

  const pages = (): number[] => {
    const ys: number[] = [];
    for (let t = 0; t <= STORY_END; t++) ys.push(storyY(t));
    const max = ScrollTrigger.maxScroll(window);
    // The footer: first with its top at the top of the screen (once the
    // pinned story has scrolled away), then a screen at a time to the end.
    const hero = document.querySelector<HTMLElement>('.hero');
    let y = ys[ys.length - 1] + (hero?.offsetHeight ?? window.innerHeight);
    while (y < max - 2) {
      ys.push(y);
      y += window.innerHeight;
    }
    if (ys[ys.length - 1] < max - 2) ys.push(max);
    return ys;
  };

  const go = (dir: 1 | -1) => {
    if (busy || document.documentElement.classList.contains('wl-open')) return;
    const ys = pages();
    const y = window.scrollY;
    // The page we're on (or nearest to, after a nav jump or a resize).
    let i = 0;
    ys.forEach((v, k) => {
      if (Math.abs(v - y) < Math.abs(ys[i] - y)) i = k;
    });
    // Between two pages: the nearest one in the swipe's direction is next.
    let j = i + dir;
    if (dir > 0 && ys[i] > y + 2) j = i;
    if (dir < 0 && ys[i] < y - 2) j = i;
    j = Math.max(0, Math.min(ys.length - 1, j));
    if (Math.abs(ys[j] - y) < 2) return;
    busy = true;
    gsap.to(window, {
      scrollTo: { y: ys[j], autoKill: false },
      duration: DURATION,
      ease: 'power2.inOut',
      overwrite: true,
      onComplete: () => void setTimeout(() => (busy = false), 120),
    });
  };

  // One page per swipe: a long drag only counts once.
  let fired = false;
  const once = (dir: 1 | -1) => {
    if (fired) return;
    fired = true;
    go(dir);
  };

  const obs = Observer.create({
    target: window,
    type: 'touch',
    preventDefault: true, // no native scrolling: we move the page
    allowClicks: true,
    tolerance: 14,
    ignore: IGNORE,
    onPress: () => void (fired = false),
    onUp: () => once(1), // finger moves up: next frame
    onDown: () => once(-1),
  });

  // The FAQ list scrolls itself; at its end (or top) a further swipe turns
  // the page. It must already have been at that end when the swipe began,
  // so a swipe that scrolls the list to its end doesn't also turn the page.
  const list = document.querySelector<HTMLElement>('.faq-list');
  if (list) {
    let startY = 0;
    let atTop = false;
    let atEnd = false;
    list.addEventListener(
      'touchstart',
      (e) => {
        startY = e.touches[0].clientY;
        atTop = list.scrollTop <= 1;
        atEnd = list.scrollTop >= list.scrollHeight - list.clientHeight - 1;
      },
      { passive: true },
    );
    list.addEventListener(
      'touchend',
      (e) => {
        if (!obs.isEnabled) return;
        const dy = startY - e.changedTouches[0].clientY; // > 0: finger moved up
        if (dy > 40 && atEnd) go(1);
        else if (dy < -40 && atTop) go(-1);
      },
      { passive: true },
    );
  }

  const sync = () => (wanted() ? obs.enable() : obs.disable());
  sync();
  window.matchMedia(MQ_MOBILE).addEventListener('change', sync);
}
