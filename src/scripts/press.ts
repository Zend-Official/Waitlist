import { gsap } from 'gsap';
import { prefersReducedMotion } from './env';

const SELECTOR = '.btn, .rail__btn';

/**
 * Press feedback for every button: scales in while pressed and springs back
 * out on release. A quick click (or keyboard Enter/Space) still plays the full
 * in-and-out pulse, so the effect is always visible.
 *
 * It animates the standalone CSS `scale` property, not `transform`, so it
 * never interferes with the scroll/intro animations GSAP runs on the buttons.
 */
export function initPress() {
  // One tween-able value per button, written to style.scale.
  const states = new WeakMap<HTMLElement, { s: number }>();
  const stateOf = (el: HTMLElement) => {
    let st = states.get(el);
    if (!st) {
      st = { s: 1 };
      states.set(el, st);
    }
    return st;
  };

  const animate = (el: HTMLElement, phase: 'in' | 'out') => {
    const st = stateOf(el);
    const depth = prefersReducedMotion() ? 0.97 : 0.9;
    gsap.to(st, {
      s: phase === 'in' ? depth : 1,
      duration: phase === 'in' ? 0.12 : 0.6,
      ease: phase === 'in' ? 'power2.out' : 'elastic.out(1.1, 0.45)',
      overwrite: true,
      onUpdate: () => {
        el.style.scale = st.s.toFixed(4);
      },
      onComplete: () => {
        if (phase === 'out') el.style.removeProperty('scale');
      },
    });
  };

  let held: HTMLElement | null = null;
  let pressedAt = 0;

  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR);
      if (!el) return;
      held = el;
      pressedAt = performance.now();
      animate(el, 'in');
    },
    { passive: true },
  );

  const release = () => {
    if (!held) return;
    const el = held;
    held = null;
    // Let the press-in be seen before springing back, even on a fast tap.
    const wait = Math.max(0, 110 - (performance.now() - pressedAt));
    window.setTimeout(() => animate(el, 'out'), wait);
  };
  document.addEventListener('pointerup', release, { passive: true });
  document.addEventListener('pointercancel', release, { passive: true });

  // Keyboard activation (Enter / Space on a focused button).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = (document.activeElement as Element | null)?.closest<HTMLElement>(SELECTOR);
    if (!el) return;
    animate(el, 'in');
    window.setTimeout(() => animate(el, 'out'), 110);
  });
}
