import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { T } from '../data/hiw';
import { prefersReducedMotion } from './env';
import { goToFrame, jumpToStory } from './frames';

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer ("Just Zend It"): plain scrolling, no story transition.
 * - As it scrolls in, the top bar contracts onto the day/night toggle (first
 *   60% of the way), then the toggle floats to the top-right corner; the
 *   logo, label and nav fade out and an up arrow floats in bottom right
 *   (CSS in SiteNav.astro reads --foot-k / --foot-m).
 * - Story links jump to their frame; the up arrow goes back to the top.
 * - The girl giggles (a few quick bounces) and now and then hugs her bag.
 */
export function initFooter(): void {
  const footer = document.getElementById('footer');
  if (!footer) return;
  const html = document.documentElement;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  // Only touch <html> when something actually changes: every write there
  // restyles the whole page, which is expensive (and it ran on every refresh).
  let last = '';
  const set = (p: number) => {
    const k = clamp(p / 0.6).toFixed(3);
    const m = clamp((p - 0.6) / 0.4).toFixed(3);
    const state = p <= 0 ? '' : +m >= 0.5 ? 'on' : 'shrink';
    const key = k + m + state;
    if (key === last) return;
    last = key;
    html.style.setProperty('--foot-k', k);
    html.style.setProperty('--foot-m', m);
    if (!state) delete html.dataset.foot;
    else html.dataset.foot = state;
  };
  last = '0.0000.000'; // the CSS defaults: nothing to write until the footer arrives
  ScrollTrigger.create({
    trigger: footer,
    start: 'top 85%',
    end: 'top 25%',
    onUpdate: (self) => set(self.progress),
    onRefresh: (self) => set(self.progress),
  });

  // Links
  footer.querySelectorAll<HTMLAnchorElement>('[data-frame]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const key = a.dataset.frame as keyof typeof T;
      if (key === 'step1') return goToFrame('how-it-works');
      jumpToStory(T[key]);
    });
  });
  document.querySelector('[data-foot-up]')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToFrame('home');
  });

  // The bottom glow grows up from the floor as the footer scrolls in.
  const glow = footer.querySelector<HTMLElement>('.foot-glow');
  if (glow && !prefersReducedMotion()) {
    gsap.fromTo(glow, { scaleY: 0, autoAlpha: 0.4 }, { scaleY: 1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  // The girl: giggle bounce, then a bag hug now and then.
  const girl = footer.querySelector<HTMLElement>('.foot-girl__girl');
  if (!girl || prefersReducedMotion()) return;
  gsap.set(girl, { transformOrigin: '50% 100%' });
  const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true });
  // 1. Giggle: three quick little bounces, each smaller.
  [2.2, 1.5, 0.9].forEach((h, i) => {
    loop.to(girl, { yPercent: -h, rotation: i % 2 ? -0.6 : 0.6, duration: 0.11, ease: 'power2.out' }, i * 0.24).to(
      girl,
      { yPercent: 0, rotation: 0, duration: 0.13, ease: 'power2.in' },
      i * 0.24 + 0.11,
    );
  });
  // 2. Hug: she squeezes the bag a little (narrower, a touch taller), holds, relaxes.
  loop
    .to(girl, { scaleX: 0.975, scaleY: 1.012, duration: 0.3, ease: 'power2.out' }, 2.2)
    .to(girl, { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'power2.inOut' }, 2.8);
  // The room: the plant sways a little.
  const idle: gsap.core.Animation[] = [loop];
  const plant = footer.querySelector('.room--plant');
  if (plant) idle.push(gsap.fromTo(plant, { rotation: -1.2 }, { rotation: 1.2, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }));
  ScrollTrigger.create({
    trigger: footer,
    start: 'top 70%',
    end: 'bottom top',
    onToggle: (self) => idle.forEach((a) => (self.isActive ? a.play() : a.pause())),
  });
}
