import { gsap } from 'gsap';
import { T } from '../data/hiw';
import { prefersReducedMotion } from './env';
import { storyY } from './hero';

/**
 * The hero girl is alive while the hero is on screen:
 *  - both: she blinks, and types on her phone (thumb-tap overlays swapped
 *    like a flip-book, in bursts)
 *  - Hero 1, worried: a slow worried sigh now and then, and her frown
 *    deepens for a moment
 *  - Hero 2, happy: gentle breathing and a happy little head bob
 * Whole-picture motion moves .girl__art (picture + overlays together), so
 * the hero's own scroll animation on the girl's box is untouched. The
 * overlays are small patches cut from the user's edited pictures.
 * Runs in lite mode too; reduced motion turns it off.
 */
export function initHeroGirl(): void {
  if (prefersReducedMotion()) return;
  const loops: gsap.core.Animation[] = [];

  const overlays = (girl: Element | null) => {
    const get = (k: string) => girl?.querySelector<HTMLElement>(`.girl__part--${k}`) ?? null;
    return { eyes: get('eyes'), frown: get('frown'), left: get('tap-left'), right: get('tap-right') };
  };

  // Blink: eyes shut for a moment, at uneven gaps (sometimes a double blink).
  const blink = (eyes: HTMLElement | null, delay: number) => {
    if (!eyes) return;
    const tl = gsap.timeline({ repeat: -1, paused: true, delay });
    tl.set(eyes, { opacity: 1 }, 0)
      .set(eyes, { opacity: 0 }, 0.13)
      .set(eyes, { opacity: 1 }, 2.9)
      .set(eyes, { opacity: 0 }, 3.03)
      .set(eyes, { opacity: 1 }, 3.25)
      .set(eyes, { opacity: 0 }, 3.37)
      .set({}, {}, 6.4);
    loops.push(tl);
  };

  // Typing: a burst of thumb taps (left, right, ...), then a pause to read.
  const typing = (left: HTMLElement | null, right: HTMLElement | null, delay: number) => {
    if (!left || !right) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true, delay });
    const step = 0.14;
    const taps = [left, right, left, right, right, left, right, left];
    taps.forEach((t, i) => {
      tl.set(t, { opacity: 1 }, i * step).set(t, { opacity: 0 }, i * step + step * 0.75);
    });
    // a short second burst, as if finishing a word
    [left, right, left].forEach((t, i) => {
      const at = taps.length * step + 0.5 + i * step;
      tl.set(t, { opacity: 1 }, at).set(t, { opacity: 0 }, at + step * 0.75);
    });
    loops.push(tl);
  };

  // ---------- Hero 1: worried ----------
  const g1 = document.querySelector('.girl--h1');
  const worried = g1?.querySelector<HTMLElement>('.girl__art');
  if (worried) {
    const o = overlays(g1);
    gsap.set(worried, { transformOrigin: '70% 100%' });
    const sigh = gsap.timeline({ repeat: -1, repeatDelay: 2.6, paused: true, delay: 1 });
    sigh
      .to(worried, { yPercent: -0.9, scaleY: 1.012, duration: 1.1, ease: 'sine.inOut' }) // breathe in
      .to(worried, { yPercent: 0.5, scaleY: 0.994, duration: 1.3, ease: 'sine.inOut' }) // sigh out, sink
      .to(worried, { yPercent: 0, scaleY: 1, duration: 0.9, ease: 'sine.out' });
    loops.push(sigh);
    if (o.frown) {
      const frown = gsap.timeline({ repeat: -1, repeatDelay: 4.2, paused: true, delay: 2.2 });
      frown.to(o.frown, { opacity: 1, duration: 0.25, ease: 'power1.out' }).to(o.frown, { opacity: 0, duration: 0.4, ease: 'power1.in' }, '+=0.9');
      loops.push(frown);
    }
    blink(o.eyes, 0.8);
    typing(o.left, o.right, 0.4);
  }

  // ---------- Hero 2: happy ----------
  const g2 = document.querySelector('.girl--h2');
  const happy = g2?.querySelector<HTMLElement>('.girl__art');
  if (happy) {
    const o = overlays(g2);
    // Her hips (the mobile frame shows her mirrored, so they're on the other side).
    gsap.set(happy, { transformOrigin: window.matchMedia('(max-aspect-ratio: 5/4)').matches ? '65% 80%' : '35% 80%' });
    loops.push(gsap.to(happy, { scaleY: 1.008, duration: 2.1, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }));
    const bob = gsap.timeline({ repeat: -1, repeatDelay: 2.2, paused: true });
    bob
      .to(happy, { rotation: -0.9, duration: 0.28, ease: 'sine.inOut' })
      .to(happy, { rotation: 0.3, duration: 0.28, ease: 'sine.inOut' })
      .to(happy, { rotation: -0.7, duration: 0.26, ease: 'sine.inOut' })
      .to(happy, { rotation: 0, duration: 0.4, ease: 'sine.out' });
    loops.push(bob);
    blink(o.eyes, 1.6);
    typing(o.left, o.right, 0.9);
  }
  if (!loops.length) return;

  // Only while the hero (Hero 1 / Hero 2) is on screen.
  let on = false;
  const check = () => {
    const now = window.scrollY < storyY(T.step1) - 2;
    if (now === on) return;
    on = now;
    loops.forEach((a) => (now ? a.play() : a.pause()));
  };
  // Start once the loading intro has finished (not underneath it: on slow
  // phones every animation frame during the intro is expensive).
  const html = document.documentElement;
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
