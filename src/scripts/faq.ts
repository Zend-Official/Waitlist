import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { T } from '../data/hiw';
import { FAQ_SHAPE } from '../data/faq';
import { prefersReducedMotion, unit } from './env';
import { home, mapPath } from './hiw';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * FAQ ("Got any questions?"), after Security:
 *
 *  9.00-9.70  Security -> FAQ
 *             - the Security text rises out; Join waitlist fades
 *             - the phone's screen widens into the FAQ card: the card opens
 *               out from the phone's outline while the phone fades away
 *             - the dark shape reshapes to the left-hand shape
 *             - the heading rises in, the question chips pop in, then the
 *               Talk to us button
 *
 * Inside the card the questions scroll on their own, with faded edges while
 * there's more above or below. Tapping a question answers it like a chat
 * reply (typing dots, then the answer); one answer is open at a time.
 */

type Ctx = {
  tl: gsap.core.Timeline;
  hero: HTMLElement;
  desktop: boolean;
  reduce: boolean;
  arrowFrom: SVGPathElement;
};

/** Where the Security frame left the phone, relative to its layout box. */
const phoneOffset = (desktop: boolean) =>
  desktop ? { x: (800 - 742) * unit(), y: (205 - 265) * unit() } : { x: (82 - 5) * unit(), y: (379 - 360) * unit() };

export function addFaq({ tl, hero, desktop, reduce, arrowFrom }: Ctx): { cleanup: () => void } {
  const q = gsap.utils.selector(hero);
  const faq = q('.faq')[0] as HTMLElement | undefined;
  if (!faq) return { cleanup: () => {} };

  const layout = desktop ? 'desktop' : 'mobile';
  const frameW = desktop ? 1728 : 402;
  const arrowSvg = arrowFrom.ownerSVGElement!;
  const title = faq.querySelector<HTMLElement>('.faq-title')!;
  const card = faq.querySelector<HTMLElement>('.faq-card')!;
  const items = Array.from(faq.querySelectorAll<HTMLElement>('.faq-item'));
  const talk = faq.querySelector<HTMLElement>('.faq-talk')!;
  const phone = q('.hiw-phone')[0] as HTMLElement;
  const secText = q('.sec-text')[0] as HTMLElement;
  const secCta = q('.sec-cta')[0] as HTMLElement | undefined;
  const mobileCta = q('.hiw-cta')[0] as HTMLElement;

  // ---------- Start states ----------
  gsap.set(faq, { visibility: 'visible' });
  gsap.set([title, card, talk], { autoAlpha: 0 });
  gsap.set(items, { autoAlpha: 0 });

  // ---------- The dark shape: on the left, behind the card ----------
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  target.style.display = 'none';
  arrowSvg.appendChild(target);
  const updateTarget = () => {
    const W = hero.offsetWidth || window.innerWidth;
    const u = unit() || 1;
    const [ox, oy] = FAQ_SHAPE[layout].offset;
    const left = (W - frameW * u) / 2; // the frame is centred
    // Points at the frame's left edge stay on the screen's left edge.
    const toSvgX = (x: number) => ((x <= 0 ? x * u : left + (x + ox) * u) * frameW) / W;
    target.setAttribute('d', mapPath(FAQ_SHAPE[layout].d, (x, y) => [toSvgX(x), y + oy]));
  };
  updateTarget();
  ScrollTrigger.addEventListener('refreshInit', updateTarget);

  const S = T.secure; // 9.0: Security complete
  if (!reduce) tl.to(arrowFrom, { morphSVG: { shape: target, shapeIndex: 'auto' }, duration: 0.45, ease: 'power2.inOut' }, S);

  // ---------- Security makes way ----------
  tl.to(secText, { y: () => -140 * unit(), autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, S);
  if (desktop && secCta) tl.to(secCta, { autoAlpha: 0, duration: 0.15 }, S);
  if (!desktop) tl.to(mobileCta, { autoAlpha: 0, duration: 0.15 }, S);

  // ---------- The phone grows into the card ----------
  // The card is drawn as a wide phone (bezel + notch). It takes over from the
  // phone at the phone's exact box, then grows to its own: the box offsets
  // are CSS variables that run down to 0, so the end is the card's layout.
  const phoneR = desktop ? 150 : 46;
  const cardR = desktop ? 90 : 46;
  const fromPhone = () => {
    const p = home(phone);
    const o = phoneOffset(desktop);
    // The card's own layout box (minus any offsets currently applied).
    const b = home(card);
    const v = (k: string) => parseFloat(getComputedStyle(card).getPropertyValue(k)) || 0;
    const c = { left: b.left - v('--gl'), top: b.top - v('--gt'), width: b.width - v('--gw'), height: b.height - v('--gh') };
    const u = unit();
    return {
      '--gl': `${p.left + o.x - c.left}px`,
      '--gt': `${p.top + o.y - c.top}px`,
      '--gw': `${p.width - c.width}px`,
      '--gh': `${p.height - c.height}px`,
      '--gr': `${(phoneR - cardR) * u}px`,
    };
  };
  const g = ['--gl', '--gt', '--gw', '--gh', '--gr'] as const;
  tl.set(card, { autoAlpha: 1 }, S + 0.08)
    .set(phone, { autoAlpha: 0 }, S + 0.08)
    .fromTo(
      card,
      Object.fromEntries(g.map((k) => [k, () => fromPhone()[k]])),
      { ...Object.fromEntries(g.map((k) => [k, '0px'])), duration: 0.42, ease: 'power3.inOut', immediateRender: false },
      S + 0.08,
    );

  // ---------- Heading, chips, Talk to us ----------
  tl.fromTo(title, { y: () => 170 * unit(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, S + 0.2)
    .fromTo(items, { y: () => 24 * unit(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.2, ease: 'power2.out', immediateRender: false }, S + 0.4)
    .fromTo(talk, { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'back.out(2)', immediateRender: false }, S + 0.5);

  return {
    cleanup: () => {
      ScrollTrigger.removeEventListener('refreshInit', updateTarget);
      target.remove();
      gsap.set(faq, { clearProps: 'visibility' });
    },
  };
}

/**
 * The card's questions (set up once; not part of the scroll story).
 * - Faded edges: the list fades at the top/bottom only while there's more to
 *   scroll that way.
 * - Tapping a question opens its answer like a chat reply: the chip turns to
 *   ✕, typing dots show for a moment, then the answer pops in. Opening one
 *   closes the others; tapping an open one closes it.
 */
export function initFaqCard(): void {
  const list = document.querySelector<HTMLElement>('.faq-list');
  if (!list) return;
  const items = Array.from(list.querySelectorAll<HTMLElement>('.faq-item'));

  const fades = () => {
    const max = list.scrollHeight - list.clientHeight;
    const size = Math.min(60, list.clientHeight * 0.12);
    const top = Math.min(1, list.scrollTop / 40);
    const bottom = max <= 1 ? 0 : Math.min(1, (max - list.scrollTop) / 40);
    list.style.setProperty('--fade-top', `${top * size}px`);
    list.style.setProperty('--fade-bottom', `${bottom * size}px`);
  };
  list.addEventListener('scroll', fades, { passive: true });
  window.addEventListener('resize', fades);
  new ResizeObserver(fades).observe(list);
  fades();

  let timer = 0;
  const close = (item: HTMLElement) => {
    item.removeAttribute('data-open');
    item.removeAttribute('data-typing');
    item.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
  };
  const open = (item: HTMLElement) => {
    items.forEach((i) => i !== item && close(i));
    item.setAttribute('data-open', '');
    item.querySelector('.faq-q')?.setAttribute('aria-expanded', 'true');
    const answer = item.querySelector<HTMLElement>('.faq-a')!;
    const reveal = () => {
      item.removeAttribute('data-typing');
      gsap.fromTo(answer, { scale: 0.85, autoAlpha: 0, transformOrigin: '0% 0%' }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(1.8)' });
      fades();
      // Keep the whole answer in view.
      const a = answer.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      if (a.bottom > l.bottom - 24) list.scrollBy({ top: a.bottom - l.bottom + 48, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };
    clearTimeout(timer);
    if (prefersReducedMotion()) return reveal();
    item.setAttribute('data-typing', '');
    fades();
    timer = window.setTimeout(reveal, 650);
  };

  items.forEach((item) => {
    item.querySelector('.faq-q')!.addEventListener('click', () => {
      if (item.hasAttribute('data-open')) {
        clearTimeout(timer);
        close(item);
        fades();
      } else open(item);
    });
  });
}
