import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HIW_SHAPE, STEP_POS, T } from '../data/hiw';
import { unit } from './env';

gsap.registerPlugin(MorphSVGPlugin);

/**
 * How it works, added to the hero's story timeline (one screen of scrolling
 * per unit, see T in data/hiw.ts):
 *
 *  1.00-1.70  Hero 2 -> step 1
 *             - the arrow reshapes into the dark shape on the right edge
 *               (and darkens to its colour)
 *             - the girl, chip, headline and subtitle squeeze into one circle,
 *               which travels to step 1 and becomes it (desktop: the number
 *               circle, then the text opens out of it; mobile: the first
 *               pager dot, then the text rises in)
 *             - Join waitlist glides to its new spot
 *             - only then does the phone slide in
 *  2.00-2.70  step 1 -> 2, 3.00-3.70 step 2 -> 3
 *             - desktop: the text folds back into the badge, the badge shrinks
 *               to a dot, the dot travels down leaving a dashed trail, and
 *               opens into the next step
 *             - mobile: the text rises out through the top fade while the
 *               next rises in from just above the button
 *             - the phone chat gets new messages: each pops in at the
 *               bottom and the older ones scroll up
 * Each step holds for the last 0.3 of its screen.
 */

type Ctx = {
  tl: gsap.core.Timeline;
  hero: HTMLElement;
  desktop: boolean;
  reduce: boolean;
  arrowFrom: SVGPathElement;
};

/** Absolute M/L/C/Z path, every point mapped by f. */
export function mapPath(d: string, f: (x: number, y: number) => [number, number]): string {
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)!.map(Number);
  let k = 0;
  const pts: number[] = [];
  for (let i = 0; i < nums.length; i += 2) pts.push(...f(nums[i], nums[i + 1]));
  return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, () => ` ${+pts[k++].toFixed(2)}`);
}

/** Centre of an element in the hero's layout coordinates (ignores transforms). */
export function centre(el: HTMLElement, root: HTMLElement) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/**
 * Where an element sits on screen without the move/scale GSAP has added, but
 * keeping its CSS centring (GSAP folds CSS `translate` into its own transform,
 * so resetting the transform would lose it). Scale is assumed from the top-left.
 */
export function home(el: HTMLElement) {
  const b = el.getBoundingClientRect();
  const x = Number(gsap.getProperty(el, 'x')) || 0;
  const y = Number(gsap.getProperty(el, 'y')) || 0;
  const s = Number(gsap.getProperty(el, 'scaleX')) || 1;
  const left = b.left - x;
  const top = b.top - y;
  const width = b.width / s;
  const height = b.height / s;
  return { left, top, width, height, right: left + width, bottom: top + height };
}

/** Top of an element within root from layout alone (no transforms, so never
 *  thrown off by an animation in progress). */
export function layoutTop(el: HTMLElement, root: HTMLElement): number {
  let t = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    t += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return t;
}

/** Phones: the move (y) that rests the mobile Join waitlist `gap` px under
 *  `above`, and the button's bottom edge there (both in hero layout px). */
export function ctaUnder(hero: HTMLElement, cta: HTMLElement, above: HTMLElement, gap: number): { y: number; bottom: number } {
  const top = layoutTop(above, hero) + above.offsetHeight + gap;
  // With no move the button sits at its layout box, raised by its own
  // centring (translate -50%, which GSAP keeps as yPercent).
  const yPct = Number(gsap.getProperty(cta, 'yPercent')) || 0;
  const rest = layoutTop(cta, hero) + (yPct / 100) * cta.offsetHeight;
  return { y: top - rest, bottom: top + cta.offsetHeight };
}

/** Layout box of an element on screen, ignoring its GSAP transform. */
function rect(el: HTMLElement) {
  const saved = el.style.transform;
  el.style.transform = 'none';
  const b = el.getBoundingClientRect();
  el.style.transform = saved;
  return b;
}

export function addHowItWorks({ tl, hero, desktop, reduce, arrowFrom }: Ctx): () => void {
  const q = gsap.utils.selector(hero);
  const hiw = q('.hiw')[0] as HTMLElement | undefined;
  if (!hiw) return () => {};
  const h = gsap.utils.selector(hiw);

  const layout = desktop ? 'desktop' : 'mobile';
  const frameW = desktop ? 1728 : 402;
  const girl = q('.girl--h2')[0] as HTMLElement;
  const chip = q('.scene--h2 .chip')[0] as HTMLElement;
  const heads = q('.copy--h2 .headline, .copy--h2 .body, .copy--h2 .joined') as HTMLElement[];
  const heroBtn = q('.copy--h2 .btn')[0] as HTMLElement;
  const cta = h('.hiw-cta')[0] as HTMLElement;
  const dot = h('.hiw-dot')[0] as HTMLElement;
  const squeeze = h('.hiw-squeeze')[0] as HTMLElement;
  const phone = h('.hiw-phone')[0] as HTMLElement;
  const badges = h('.hiw-badge') as HTMLElement[];
  const nums = h('.hiw-badge__num') as HTMLElement[];
  const texts = h('.hiw-text') as HTMLElement[];
  const trail = h('.hiw-trail')[0] as HTMLElement;
  const mtexts = h('.hiw-mtext') as HTMLElement[];
  const pager = h('.hiw-pager')[0] as HTMLElement;
  const pagerDots = h('.hiw-pager i') as HTMLElement[];
  const thread = h('.thread')[0] as HTMLElement;
  const msgs = h('[data-msg]') as HTMLElement[]; // product, pay card, paid, confirm card, thank you
  const who = h('.phone__who') as HTMLElement[];
  const hiwShape = h('.hiw-shape')[0] as HTMLElement;
  const arrowSvg = arrowFrom.ownerSVGElement!;

  // Desktop: Join waitlist moves into the top bar.
  const barCta = document.querySelector<HTMLElement>('.site-header .bar__cta');
  const ctaTarget = desktop && barCta ? barCta : cta;
  // The bar's button appears when the hero's has glided into it (explicit start
  // state: CSS alone isn't restored when scrolling back).
  if (barCta) gsap.set(barCta, { autoAlpha: 0 });

    // ---------- Start states (all of How it works hidden until it arrives) ----------
  gsap.set(hiw, { visibility: 'visible' });

  gsap.set([cta, phone, pager, ...badges, ...texts, trail, ...mtexts, dot, squeeze, hiwShape], { autoAlpha: 0 });
  gsap.set(nums, { autoAlpha: 0 });
  gsap.set(msgs.slice(1), { autoAlpha: 0 });
  gsap.set(who[1], { autoAlpha: 0 });
  gsap.set(arrowSvg, { '--hiw-mix': 0 });

  // ---------- The arrow becomes the dark shape ----------
  // The morph runs in Hero 1's svg (1728/402 wide viewBox stretched to the
  // screen). The dark shape hugs the right edge, so map its points from the
  // frame's right edge to the screen's right edge, in that svg's units.
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  target.style.display = 'none';
  arrowSvg.appendChild(target);
  const updateTarget = () => {
    const W = hero.offsetWidth || window.innerWidth;
    const u = unit() || 1;
    const [ox, oy] = HIW_SHAPE[layout].offset;
    const toSvgX = (x: number) => ((W - (frameW - (x + ox)) * u) * frameW) / W;
    target.setAttribute('d', mapPath(HIW_SHAPE[layout].d, (x, y) => [toSvgX(x), y + oy]));
    // The fallback copy (reduced motion) uses the same mapping.
    const fallback = hiwShape.querySelector<SVGPathElement>(`[data-hiw-shape="${layout}"]`);
    if (fallback) {
      fallback.setAttribute('d', target.getAttribute('d')!);
      fallback.removeAttribute('transform');
    }
  };
  updateTarget();
  ScrollTrigger.addEventListener('refreshInit', updateTarget);

  const A = T.hero2; // 1.0: Hero 2 complete
  if (reduce) {
    tl.to(arrowSvg.parentElement, { autoAlpha: 0, duration: 0.25 }, A + 0.1).to(hiwShape, { autoAlpha: 1, duration: 0.25 }, A + 0.2);
  } else {
    tl.to(arrowFrom, { morphSVG: { shape: target, shapeIndex: 'auto' }, duration: 0.55, ease: 'power2.inOut' }, A);
  }
  tl.to(arrowSvg, { '--hiw-mix': 1, duration: 0.5 }, A);

  // ---------- Hero 2 squeezes into one circle ----------
  // Everything (girl, chip, headline, subtitle) scales down and moves to one
  // point, the centre of the screen, staying visible on the way. Only when
  // they reach it does the circle appear there.
  const C = () => ({ x: hero.offsetWidth / 2, y: hero.offsetHeight / 2 });
  const parts = [girl, chip, ...heads];
  const MEET = A + 0.32; // they all reach the centre
  // The point each part shrinks around: its centre, except the chip, which
  // is tilted around (and so shrinks toward) its top-left corner.
  const pivot = (el: HTMLElement) => {
    const c = centre(el, hero);
    return el === chip ? { x: c.x - el.offsetWidth / 2, y: c.y - el.offsetHeight / 2 } : c;
  };
  parts.forEach((el) => {
    tl.to(el, { x: () => C().x - pivot(el).x, y: () => C().y - pivot(el).y, scale: 0.02, duration: MEET - A, ease: 'power2.in' }, A).set(
      el,
      { autoAlpha: 0 },
      MEET,
    );
  });
  tl.fromTo(squeeze, { scale: 0, autoAlpha: 1 }, { scale: 1.4, autoAlpha: 1, duration: 0.07, ease: 'power2.out', immediateRender: false }, MEET).to(
    squeeze,
    { scale: 1, duration: 0.05, ease: 'power1.inOut' },
    MEET + 0.07,
  );

  // ---------- Join waitlist glides to its new spot ----------
  const glide = () => {
    const a = rect(heroBtn);
    const b = rect(ctaTarget);
    return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), s: b.width / a.width };
  };
  // Quick: it zips to its new spot right as Hero 2 starts to go.
  tl.to(heroBtn, { x: () => glide().x, y: () => glide().y, scale: () => glide().s, duration: 0.22, ease: 'power3.inOut' }, A + 0.04)
    .set(heroBtn, { autoAlpha: 0 }, A + 0.26)
    .set(ctaTarget, { autoAlpha: 1 }, A + 0.26);

  // ---------- The circle becomes step 1, then the phone slides in ----------
  const S1 = MEET + 0.3; // the circle has arrived at step 1
  if (desktop) {
    // It travels to step 1 and becomes its numbered circle; the text opens
    // out of it.
    tl.to(
      squeeze,
      { x: () => centre(badges[0], hero).x - C().x, y: () => centre(badges[0], hero).y - C().y, scale: 1, duration: 0.16, ease: 'power2.inOut' },
      MEET + 0.14,
    )
      .set(badges[0], { autoAlpha: 1 }, S1)
      .set(squeeze, { autoAlpha: 0 }, S1)
      .to(nums[0], { autoAlpha: 1, duration: 0.04 }, S1)
      .fromTo(texts[0], { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.16, ease: 'power2.out', immediateRender: false }, S1 + 0.02);
  } else {
    // It shrinks into the first of the three pager dots; the other two appear
    // beside it, and the text rises in.
    const pagerHome = () => centre(pagerDots[0].parentElement as HTMLElement, hero);
    tl.to(
      squeeze,
      {
        x: () => pagerHome().x - C().x,
        y: () => pagerHome().y - C().y,
        scale: () => (pagerDots[0].parentElement as HTMLElement).offsetWidth / squeeze.offsetWidth,
        duration: 0.16,
        ease: 'power2.inOut',
      },
      MEET + 0.14,
    )
      .set(squeeze, { autoAlpha: 0 }, S1)
      .set(pager, { autoAlpha: 1 }, S1)
      .set(pagerDots[0], { opacity: 1 }, S1)
      .fromTo(mtexts[0], { y: () => 110 * unit(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18, ease: 'power2.out', immediateRender: false }, S1 + 0.02);
  }
  // Only once step 1 is there does the phone slide in.
  tl.fromTo(phone, { yPercent: 35, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.2, ease: 'power3.out', immediateRender: false }, S1 + 0.16);

  // ---------- Phone chat helpers ----------
  // A new message comes in like an incoming bubble: it slides in from the
  // left side (where incoming messages sit), growing from its tail corner,
  // and settles with a small bounce.
  const arrive = (el: HTMLElement, at: number) =>
    tl.fromTo(
      el,
      { x: () => -60 * unit(), scale: 0.9, autoAlpha: 0, transformOrigin: '0% 0%' },
      { x: 0, scale: 1, autoAlpha: 1, duration: 0.16, ease: 'back.out(1.4)', immediateRender: false },
      at,
    );
  // The thread scrolls so `el` sits at the top of the chat area.
  const scrollThreadTo = (el: HTMLElement, at: number) =>
    tl.to(thread, { y: () => -(el.offsetTop - msgs[0].offsetTop), duration: 0.2, ease: 'power2.inOut' }, at);

  // The one dashed trail is revealed in two parts: down to badge 2, then on
  // to badge 3 (as % of its height hidden from the bottom).
  const trailTop = STEP_POS[0].badge[1] + 50;
  const trailH = STEP_POS[2].badge[1] - trailTop;
  const toBadge2 = ((STEP_POS[2].badge[1] - STEP_POS[1].badge[1]) / trailH) * 100;
  const trailClip = ['inset(0% 0% 100% 0%)', `inset(0% 0% ${toBadge2.toFixed(2)}% 0%)`, 'inset(0% 0% 0% 0%)'];

  // ---------- Steps 1 -> 2 -> 3 ----------
  [T.step1, T.step2].forEach((t0, k) => {
    if (desktop) {
      // Text folds back into the badge; the badge becomes a dot ...
      tl.to(texts[k], { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.14, ease: 'power2.in' }, t0)
        .set(texts[k], { autoAlpha: 0 }, t0 + 0.14)
        .to(nums[k], { autoAlpha: 0, duration: 0.06 }, t0 + 0.06)
        .to(badges[k], { scale: 0.24, duration: 0.1, ease: 'power2.in' }, t0 + 0.1)
        .set(badges[k], { autoAlpha: 0 }, t0 + 0.2)
        // ... which travels down to the next step, leaving a dashed trail ...
        .set(dot, { autoAlpha: 1, scale: 0.24, y: () => badges[k].offsetTop - badges[0].offsetTop }, t0 + 0.2)
        .to(dot, { y: () => badges[k + 1].offsetTop - badges[0].offsetTop, duration: 0.26, ease: 'power1.inOut' }, t0 + 0.2)
        .fromTo(trail, { clipPath: trailClip[k], autoAlpha: 1 }, { clipPath: trailClip[k + 1], autoAlpha: 1, duration: 0.26, ease: 'power1.inOut', immediateRender: false }, t0 + 0.2)
        // ... and opens into the next step.
        .set(dot, { autoAlpha: 0 }, t0 + 0.46)
        .fromTo(badges[k + 1], { scale: 0.24, autoAlpha: 1 }, { scale: 1, autoAlpha: 1, duration: 0.1, ease: 'back.out(2)', immediateRender: false }, t0 + 0.46)
        .to(nums[k + 1], { autoAlpha: 1, duration: 0.06 }, t0 + 0.52)
        .fromTo(texts[k + 1], { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.2, ease: 'power2.out', immediateRender: false }, t0 + 0.5);
    } else {
      // Text rises out through the top fade; the next rises in from below.
      tl.to(mtexts[k], { y: () => -90 * unit(), autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t0)
        .fromTo(mtexts[k + 1], { y: () => 110 * unit(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, t0 + 0.2)
        .to(pagerDots[k], { opacity: 0, duration: 0.05 }, t0 + 0.28)
        .to(pagerDots[k + 1], { opacity: 1, duration: 0.05 }, t0 + 0.28);
    }

    // The phone chat: the older messages scroll up to make room and the
    // new ones arrive at the bottom, one after the other.
    const card = msgs[1 + k * 2]; // pay card / confirm card
    const reply = msgs[2 + k * 2]; // "You have paid" / "Thank you"
    if (k === 1) {
      // Confirming happens in Zend's chat.
      tl.to(who[0], { autoAlpha: 0, duration: 0.08 }, t0 + 0.05).to(who[1], { autoAlpha: 1, duration: 0.08 }, t0 + 0.13);
    }
    scrollThreadTo(card, t0 + 0.12);
    arrive(card, t0 + 0.22);
    arrive(reply, t0 + 0.48);
  });

  return () => {
    ScrollTrigger.removeEventListener('refreshInit', updateTarget);
    target.remove();
    gsap.set(hiw, { clearProps: 'visibility' });
  };
}
