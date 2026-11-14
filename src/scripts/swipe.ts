import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { STORY_END } from '../data/hiw';
import { MQ_MOBILE } from './env';
import { storyActive, storyY } from './hero';

gsap.registerPlugin(ScrollToPlugin);

/**
 * Phones: TikTok-style paging, from the hero to the FAQ.
 * - While you hold and drag, the page follows your finger (the frame's
 *   animation plays along), up to one frame either way.
 * - Let go and it settles: on to the next/previous frame if you dragged
 *   past about a fifth of the way or flicked; otherwise back where it was.
 * - Free scrolling and flinging past frames are off there.
 *
 * From the FAQ on down to the footer it's ordinary scrolling. Coming back up
 * from the footer, the page settles on the nearest frame once it stops.
 *
 * Left alone (they scroll as usual): the FAQ card's questions (once the list
 * can't scroll any further that way, the next swipe turns the page), the
 * mobile nav strip, and the waitlist form.
 */
const IGNORE = '.rail__list, .wl';
const DURATION = 1.6; // seconds for a whole transition (part of one takes less)
// Each frame change only animates over the first part of its screen of
// scrolling (the transition), then rests. Drags and glides move through that
// moving part only, so dragging back from a frame shows its transition
// reversing under your finger straight away (no dead stretch first).
const COMMIT = 0.2; // share of a frame to drag before letting go moves on
const FLICK = 0.45; // px/ms: a quick flick moves on even if short

export function initSwipePaging(): void {
  const wanted = () => window.matchMedia(MQ_MOBILE).matches && window.matchMedia('(pointer: coarse)').matches;
  const html = document.documentElement;
  let busy = false;

  const frames = (): number[] => {
    const ys: number[] = [];
    for (let t = 0; t <= STORY_END; t++) ys.push(storyY(t));
    return ys;
  };
  const end = () => storyY(STORY_END);
  const nearest = (ys: number[], y: number) => ys.reduce((best, v, k) => (Math.abs(v - y) < Math.abs(ys[best] - y) ? k : best), 0);
  const frameH = () => Math.max(1, storyY(1) - storyY(0));

  /** Moving part (px) of frame k -> k+1. */
  const active = (k: number) => Math.max(1, storyActive(k) * frameH());

  /**
   * Glide to y over `span` px of transition, then (optionally) jump to
   * `then` (across a resting stretch, which looks the same).
   */
  const glide = (y: number, span = frameH(), then?: number) => {
    const share = Math.min(1, Math.abs(y - window.scrollY) / Math.max(1, span));
    busy = true;
    gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: Math.max(0.35, DURATION * share),
      ease: share > 0.6 ? 'power2.inOut' : 'power2.out',
      overwrite: true,
      onComplete: () => {
        if (then !== undefined) window.scrollTo(0, then);
        setTimeout(() => (busy = false), 100);
      },
    });
  };

  /** Settle frame `to`, coming from frame `from` (one apart, or the same). */
  const settle = (from: number, to: number) => {
    const ys = frames();
    if (to > from) glide(ys[from] + active(from), active(from), ys[to]); // play on, then rest
    else if (to < from) {
      // Back: skip the rest stretch, then play the transition in reverse.
      if (window.scrollY > ys[to] + active(to)) window.scrollTo(0, ys[to] + active(to));
      glide(ys[to], active(to));
    } else if (window.scrollY < ys[from]) glide(ys[from - 1] + active(from - 1), active(from - 1), ys[from]); // back out of a reverse
    else glide(ys[from], active(from));
  };

  /** One frame on or back from where the page is now. */
  const go = (dir: 1 | -1) => {
    if (busy || html.classList.contains('wl-open')) return;
    const ys = frames();
    const y = window.scrollY;
    const i = nearest(ys, y);
    let j = i + dir;
    if (dir > 0 && ys[i] > y + 2) j = i;
    if (dir < 0 && ys[i] < y - 2) j = i;
    j = Math.max(0, Math.min(ys.length - 1, j));
    if (j === i) {
      if (Math.abs(ys[i] - y) >= 2) glide(ys[i]);
    } else settle(i, j);
  };

  // ---------- Hold, drag, let go ----------
  // Per touch we decide whether it's ours (the page follows the finger) or
  // the browser's (native scrolling): inside the story it's ours, except a
  // drag up on the FAQ, which scrolls on into the footer.
  let startY = 0;
  let startScroll = 0;
  let from = 0; // the frame the drag started on
  let ignored = false;
  let mine = false;
  let decided = false;
  let lastY = 0;
  let lastT = 0;
  let vel = 0; // px/ms, > 0 = finger moving up
  let held = false; // a finger is on the screen
  let onList = false;
  let freeDrag = false; // a plain page drag (between the FAQ and the footer)
  let onListTop = false;
  let startT = 0;

  window.addEventListener(
    'touchstart',
    (e) => {
      held = true;
      ignored = !wanted() || e.touches.length > 1 || html.classList.contains('wl-open') || !!(e.target as Element | null)?.closest?.(IGNORE);
      if (ignored) return;
      // On the FAQ's questions: only a drag down from the top of the list
      // is ours (back to Security, following the finger); the list scrolls
      // itself otherwise.
      const list = (e.target as Element | null)?.closest?.('.faq-list') as HTMLElement | null;
      onListTop = !!list && list.scrollTop <= 1;
      onList = !!list;
      // Catch the page mid-glide, like grabbing a moving feed.
      gsap.killTweensOf(window);
      busy = false;
      startY = lastY = e.touches[0].clientY;
      lastT = e.timeStamp;
      vel = 0;
      startScroll = window.scrollY;
      startT = performance.now();
      from = nearest(frames(), startScroll);
      mine = false;
      decided = false;
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (ignored) return;
      const fy = e.touches[0].clientY;
      const dy = startY - fy; // > 0: finger moving up (next)
      if (!decided) {
        if (Math.abs(dy) < 4) return;
        decided = true;
        const y = window.scrollY;
        const atFaq = Math.abs(y - end()) <= 2;
        // Just below the FAQ (on the way back from the footer), a drag down on
        // the questions at their top moves the page itself (the list can't).
        freeDrag = onList && onListTop && dy < 0 && y > end() + 2;
        mine = freeDrag || (onList ? atFaq && onListTop && dy < 0 : y < end() - 2 || (atFaq && dy < 0));
      }
      if (!mine) return; // native scrolling
      if (e.cancelable) e.preventDefault();
      const dt = e.timeStamp - lastT;
      if (dt > 0) vel = 0.7 * ((lastY - fy) / dt) + 0.3 * vel;
      lastY = fy;
      lastT = e.timeStamp;
      if (freeDrag) return void window.scrollTo(0, Math.max(end(), startScroll + dy));
      // Follow the finger through the moving part, one frame either way.
      const ys = frames();
      const off = startScroll - ys[from] + dy;
      if (off >= 0) {
        if (from < ys.length - 1) window.scrollTo(0, ys[from] + Math.min(off, active(from)));
      } else if (from > 0) {
        window.scrollTo(0, ys[from - 1] + Math.max(0, active(from - 1) + off));
      }
    },
    { passive: false },
  );

  const release = () => {
    held = false;
    if (ignored || !mine) return;
    mine = false;
    if (freeDrag) return void (freeDrag = false); // ordinary scrolling: no settling
    const ys = frames();
    const y = window.scrollY;
    // How far into the transition the finger got (+ on, - back).
    const moved = y >= ys[from] ? y - ys[from] : -(ys[from - 1] + active(from - 1) - y);
    const span = moved >= 0 ? active(from) : active(from - 1);
    // A flick: fast at the end, or a short swipe done quickly.
    const quick = performance.now() - startT < 300 && Math.abs(moved) > 24;
    let to = from;
    if (moved > span * COMMIT || vel > FLICK || (quick && moved > 0)) to = from + 1;
    else if (moved < -span * COMMIT || vel < -FLICK || (quick && moved < 0)) to = from - 1;
    to = Math.max(0, Math.min(ys.length - 1, to));
    settle(from, to);
  };
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });

  // ---------- Mouse wheel / trackpad ----------
  // In the story a scroll moves one frame and plays its transition, like a
  // swipe (a trackpad keeps sending scroll after you let go, so a new
  // frame change waits until that has died down). Over the FAQ questions
  // the list scrolls first; from the FAQ down it's ordinary scrolling.
  let wheelSum = 0;
  let lastWheel = 0;
  let quietAfter = 0; // no new frame change until scrolling has paused
  window.addEventListener(
    'wheel',
    (e) => {
      // (Any phone-layout screen: also a narrow desktop window with a mouse.)
      if (!window.matchMedia(MQ_MOBILE).matches || e.ctrlKey || html.classList.contains('wl-open')) return;
      const t = e.target as Element | null;
      if (t?.closest?.(IGNORE)) return;
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      const list = t?.closest?.('.faq-list') as HTMLElement | null;
      if (list) {
        const canScroll = dir > 0 ? list.scrollTop < list.scrollHeight - list.clientHeight - 1 : list.scrollTop > 1;
        if (canScroll) return; // the list scrolls itself
      }
      const y = window.scrollY;
      const atFaq = Math.abs(y - end()) <= 2;
      if (!(y < end() - 2 || (atFaq && dir < 0))) return; // ordinary scrolling
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (busy || now < quietAfter) {
        // Still gliding, or the tail of a trackpad fling: wait for a pause.
        if (busy) quietAfter = now + 180;
        else if (gap < 180) quietAfter = now + 180;
        wheelSum = 0;
        return;
      }
      if (gap > 250) wheelSum = 0;
      wheelSum += e.deltaY;
      if (Math.abs(wheelSum) >= 30) {
        wheelSum = 0;
        go(dir);
        quietAfter = now + 180;
      }
    },
    { passive: false },
  );

  // ---------- The FAQ list hands over at its ends ----------
  const list = document.querySelector<HTMLElement>('.faq-list');
  if (list) {
    let sy = 0;
    let atEnd = false;
    list.addEventListener(
      'touchstart',
      (e) => {
        sy = e.touches[0].clientY;
        atEnd = list.scrollTop >= list.scrollHeight - list.clientHeight - 1;
      },
      { passive: true },
    );
    list.addEventListener(
      'touchend',
      (e) => {
        if (!wanted()) return;
        const dy = sy - e.changedTouches[0].clientY;
        // (Back to Security from the top of the list: the drag handler above.)
        if (dy > 40 && atEnd) window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' }); // on toward the footer
      },
      { passive: true },
    );
  }

  // ---------- Coming back up from the footer ----------
  // Native scrolling can carry the page back into the story between frames:
  // once it stops there, settle on the nearest frame.
  let settleTimer = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!wanted() || busy || held) return; // never while a finger is down
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const y = window.scrollY;
        if (busy || held || y >= end() - 2) return;
        const ys = frames();
        const k = nearest(ys, y);
        if (Math.abs(ys[k] - y) > 2) glide(ys[k]);
      }, 160);
    },
    { passive: true },
  );
}
