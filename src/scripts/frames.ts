import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env';
import { scrollToY } from './smooth';
import { storyY } from './hero';
import { isMobileLayout } from './env';
import { T } from '../data/hiw';

gsap.registerPlugin(ScrollTrigger);

/**
 * Nav buttons: jump straight to a section's first frame (scrolling through
 * the scroll animations looks wrong) and play that frame's own entrance.
 *  - Hero 1: the arrow sweeps in along its direction, then the pattern,
 *    headline, subtitle, girl, button and chip arrive.
 *  - Other sections: their own entrance once built; until then the content
 *    fades up.
 * Scrolling during an entrance finishes it at once.
 */

type Entrance = (section: HTMLElement) => { tl: gsap.core.Timeline; cleanup: () => void };

const ENTRANCES: Record<string, Entrance> = {
  home: (hero) => {
    const q = gsap.utils.selector(hero);
    const arrow = q('.scene--h1 .shape-box');
    const pattern = q('.pattern--h1');
    const words = q('.copy--h1 .line .li, .copy--h1 .body .li');
    const girl = q('.scene--h1 .girl');
    const btn = q('.copy--h1 .btn, .copy--h1 .joined');
    const chip = q('.scene--h1 .chip__card');
    const tl = gsap
      .timeline()
      .fromTo(arrow, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }, 0)
      .fromTo(pattern, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.2)
      .fromTo(words, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, 0.3)
      .fromTo(girl, { xPercent: 12, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0.35)
      .fromTo(btn, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, 0.6)
      .fromTo(chip, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0.7);
    // Hand everything back to the hero's scroll animation afterwards.
    const cleanup = () => {
      gsap.set(arrow, { clearProps: 'clipPath' });
      gsap.set([pattern, words, girl, btn, chip], { clearProps: 'transform,opacity,visibility' });
    };
    return { tl, cleanup };
  },

  // How it works, step 1: the dark shape sweeps in from the right edge, the
  // dot pops and opens into step 1, the phone rises and the button pops.
  'how-it-works': () => {
    const hero = document.querySelector<HTMLElement>('.hero')!;
    const q = gsap.utils.selector(hero);
    const shape = q('.scene--h1 .shape-box');
    const phone = q('.hiw-phone');
    const cta = q('.hiw-cta');
    const mobile = isMobileLayout();
    const text = mobile ? q('.hiw-mtext--1') : q('.hiw-step--1 .hiw-text');
    const badge = q('.hiw-step--1 .hiw-badge');
    const pager = q('.hiw-pager');
    const tl = gsap
      .timeline()
      .fromTo(shape, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }, 0)
      .fromTo(phone, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 0.15)
      .fromTo(cta, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, 0.55);
    if (mobile) {
      tl.fromTo(text, { clipPath: 'circle(0% at 50% 40%)' }, { clipPath: 'circle(120% at 50% 40%)', duration: 0.6, ease: 'power2.out' }, 0.2).fromTo(
        pager,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3 },
        0.4,
      );
    } else {
      tl.fromTo(badge, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0.2).fromTo(
        text,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power2.out' },
        0.4,
      );
    }
    // The story timeline owns these again afterwards (at step 1 they are all
    // fully shown, which is what clearing leaves).
    const cleanup = () => {
      gsap.set(shape, { clearProps: 'clipPath' });
      gsap.set([phone, cta, pager, badge], { clearProps: 'transform,opacity,visibility' });
      gsap.set(text, { clearProps: 'clipPath' });
    };
    return { tl, cleanup };
  },
};

/** Scroll position of a section's first frame. */
function frameY(id: string, section: HTMLElement): number {
  if (id === 'home') return 0;
  if (id === 'how-it-works') return storyY(T.step1);
  if (id === 'faq') return storyY(T.secure); // "?" goes to Security first
  return Math.round(section.getBoundingClientRect().top + window.scrollY);
}

// Security: its text rises in and the shield pops.
ENTRANCES.faq = () => {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const q = gsap.utils.selector(hero);
  const text = q('.sec-text');
  const phone = q('.hiw-phone');
  const shield = q('.phone__secure #shield');
  const tl = gsap
    .timeline()
    .fromTo(text, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, 0)
    .fromTo(phone, { yPercent: 25 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0.1)
    .fromTo(shield, { scale: 0.6, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.5);
  return { tl, cleanup: () => gsap.set(text, { clearProps: 'transform' }) };
};

/** Placeholder entrance for sections not built yet: content fades up. */
const fadeUp: Entrance = (section) => {
  const items = Array.from(section.children);
  const tl = gsap.timeline().fromTo(items, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' });
  return { tl, cleanup: () => gsap.set(items, { clearProps: 'transform,opacity,visibility' }) };
};

let current: { tl: gsap.core.Timeline } | null = null;

/** Jump straight to a story time (a frame) with no entrance (footer links). */
export function jumpToStory(t: number): void {
  current?.tl.progress(1);
  scrollToY(storyY(t), { immediate: true });
  ScrollTrigger.update();
  ScrollTrigger.getAll().forEach((st) => {
    const tween = st.getTween?.() as unknown as { progress?: (p: number) => unknown } | undefined;
    if (tween && typeof tween.progress === 'function') tween.progress(1);
    st.animation?.progress(st.progress);
  });
}

export function goToFrame(id: string): void {
  // The "?" icon covers Security and FAQ; it goes to Security first.
  const section = document.getElementById(id === 'faq' ? 'security' : id);
  if (!section) return;
  current?.tl.progress(1); // finish any entrance still playing

  // Jump to the section's first frame.
  const y = frameY(id, section);
  scrollToY(y, { immediate: true });
  ScrollTrigger.update();
  // Scrubbed scenes ease toward the new position; put them there at once,
  // so the frame is complete before its entrance hides and re-reveals it.
  ScrollTrigger.getAll().forEach((st) => {
    const tween = st.getTween?.() as unknown as { progress?: (p: number) => unknown } | undefined;
    if (tween && typeof tween.progress === 'function') tween.progress(1);
    st.animation?.progress(st.progress);
  });
  if (prefersReducedMotion()) return;

  // Same frame as the jump (no paint in between), so nothing flashes.
  const { tl, cleanup } = (ENTRANCES[id] ?? fadeUp)(section);
  const entry = { tl };
  current = entry;

  const skip = () => tl.progress(1);
  const events = ['wheel', 'touchstart'] as const;
  events.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
  tl.eventCallback('onComplete', () => {
    events.forEach((ev) => window.removeEventListener(ev, skip));
    cleanup();
    if (current === entry) current = null;
  });
}
