import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { T } from '../data/hiw';
import { PHONE } from '../data/sellers';
import { SECURITY_SHAPE } from '../data/security';
import { unit } from './env';
import { centre, ctaUnder, home, layoutTop, mapPath } from './hiw';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * Security ("Safe for buyers. Sure for sellers"), after the last seller frame:
 *
 *  8.00-8.70  seller frame 4 -> Security
 *             - the phone in his hand turns back to its screen and grows into
 *               the big phone (now showing the Security screen) while he slides
 *               out behind his invisible edge
 *             - the seller text rises out, the Security text rises in
 *             - the dark shape reshapes to the bottom-left diagonal
 *             - desktop: Join waitlist travels down from the top bar to its
 *               spot under the text; mobile: it moves under the new subtitle
 *             - the shield pops in
 * While on screen the shield is alive: a light sweeps across it, then it beats
 * like a heart and sends out faint shockwaves (off for reduced motion).
 */

type Ctx = {
  tl: gsap.core.Timeline;
  hero: HTMLElement;
  desktop: boolean;
  reduce: boolean;
  arrowFrom: SVGPathElement;
};

/**
 * Where the Security frame puts the phone, relative to its How it works
 * spot. Phones: at the design's spot, or lower if needed so it always starts
 * a clear gap below Join waitlist (which rests under the subtitle, however
 * many lines that wraps to). Shared with the FAQ, whose card grows from it.
 */
export function securityPlace(desktop: boolean, hero: HTMLElement): { x: number; y: number } {
  const u = unit();
  if (desktop) return { x: (800 - 742) * u, y: (205 - 265) * u };
  const phone = hero.querySelector<HTMLElement>('.hiw-phone');
  let y = (379 - 385) * u; // design: phone top at 379 (layout spot 385)
  const c = mobileCtaSpot(hero);
  if (phone && c) y = Math.max(y, c.bottom + 32 * u - layoutTop(phone, hero));
  return { x: (82 - 5) * u, y };
}

/** Phones: where Join waitlist rests in the Security frame, 28 units (never
 *  under 22px) below the subtitle. */
function mobileCtaSpot(hero: HTMLElement): { y: number; bottom: number } | null {
  const body = hero.querySelector<HTMLElement>('.sec-body');
  const cta = hero.querySelector<HTMLElement>('.hiw-cta');
  return body && cta ? ctaUnder(hero, cta, body, Math.max(28 * unit(), 22)) : null;
}

export function addSecurity({ tl, hero, desktop, reduce, arrowFrom }: Ctx): { cleanup: () => void; onUpdate: (t: number) => void } {
  const q = gsap.utils.selector(hero);
  const sec = q('.sec')[0] as HTMLElement | undefined;
  if (!sec) return { cleanup: () => {}, onUpdate: () => {} };

  const layout = desktop ? 'desktop' : 'mobile';
  const frameW = desktop ? 1728 : 402;
  const arrowSvg = arrowFrom.ownerSVGElement!;
  const secText = sec.querySelector<HTMLElement>('.sec-text')!;
  const secBody = sec.querySelector<HTMLElement>('.sec-body')!;
  const secCta = sec.querySelector<HTMLElement>('.sec-cta');
  const phone = q('.hiw-phone')[0] as HTMLElement;
  const secureScreen = q('.phone__secure')[0] as HTMLElement;
  const boy = q('.boy')[0] as HTMLElement;
  const boyBox = q('.boy-box')[0] as HTMLElement;
  const sellTexts = q('.sell-text') as HTMLElement[];
  const lastBubbles = q('.bubbles--4 .bub') as HTMLElement[];
  const sellPager = q('.sell-pager')[0] as HTMLElement;
  const barCta = document.querySelector<HTMLElement>('.site-header .bar__cta');
  const mobileCta = q('.hiw-cta')[0] as HTMLElement;
  const art = secureScreen.querySelector('.secure__art svg')!; // (not the logo icon above it)
  const pick = (sel: string) => art.querySelector(sel) as SVGGElement;
  const shield = pick('#shield');
  const sweep = pick('#shield-sweep');
  const waves = Array.from(art.querySelectorAll<SVGPathElement>('#waves .wave'));
  const glow = secureScreen.querySelector<HTMLElement>('.secure__glow')!;

  // ---------- Start states ----------
  gsap.set(sec, { visibility: 'visible' });
  gsap.set(secText, { autoAlpha: 0 });
  if (secCta) gsap.set(secCta, { autoAlpha: 0 });
  gsap.set(secureScreen, { autoAlpha: 0 });
  gsap.set(shield, { scale: 0.6, autoAlpha: 0, transformOrigin: '50% 50%' }); // (svgOrigin misreads while the screen is hidden)
  gsap.set(sweep, { x: -200 }); // waits off the shield's left side
  gsap.set(waves, { opacity: 0, transformOrigin: '50% 50%' });

  // ---------- The dark shape: bottom-left diagonal ----------
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  target.style.display = 'none';
  arrowSvg.appendChild(target);
  const updateTarget = () => {
    const W = hero.offsetWidth || window.innerWidth;
    const u = unit() || 1;
    const [ox, oy] = SECURITY_SHAPE[layout].offset;
    // Placed with the (centred) phone, mapped into the arrow svg's stretched units.
    const left = (W - frameW * u) / 2;
    const toSvgX = (x: number) => ((left + (x + ox) * u) * frameW) / W;
    target.setAttribute('d', mapPath(SECURITY_SHAPE[layout].d, (x, y) => [toSvgX(x), y + oy]));
  };
  updateTarget();
  ScrollTrigger.addEventListener('refreshInit', updateTarget);

  // Desktop: Join waitlist rests a set distance under the subtitle, however
  // many lines it wraps to (layout position, ignoring the text's animation).
  const placeCta = () => {
    if (!desktop || !secCta) return;
    let top = secBody.offsetHeight;
    let n: HTMLElement | null = secBody;
    while (n && n !== hero) {
      top += n.offsetTop;
      n = n.offsetParent as HTMLElement | null;
    }
    secCta.style.top = `${top + 48 * unit()}px`;
  };
  placeCta();
  ScrollTrigger.addEventListener('refreshInit', placeCta);

  const S = T.sell4; // 8.0: seller frame 4 complete
  if (!reduce) tl.to(arrowFrom, { morphSVG: { shape: target, shapeIndex: 'auto' }, duration: 0.45, ease: 'power2.inOut' }, S);

  // ---------- Seller frame 4 makes way ----------
  tl.to(lastBubbles, { y: () => -24 * unit(), autoAlpha: 0, duration: 0.15, ease: 'power1.in' }, S)
    .to(sellTexts[3], { y: () => -140 * unit(), autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, S)
    .to(boy, { xPercent: 100, duration: 0.3, ease: 'power2.in' }, S + 0.05);
  if (!desktop) tl.to(sellPager, { autoAlpha: 0, duration: 0.1 }, S);

  // ---------- The phone grows out of his hand ----------
  // It starts as the phone in his hand (turned to its back), then turns to its
  // screen, now showing Security, and grows into place.
  const fromHand = () => {
    const b = boyBox.getBoundingClientRect(); // the canvas box itself never moves
    const p = PHONE.peace;
    const c = centre(phone, hero);
    const w = (p.w / 100) * b.width;
    return {
      x: b.left + (p.x / 100) * b.width - c.x,
      y: b.top + (p.y / 100) * b.height - c.y,
      scaleX: w / phone.offsetWidth,
      scaleY: (w * 1.55) / phone.offsetHeight,
      rotation: -p.rot,
    };
  };
  // Where the Security frame puts the phone, relative to How it works' spot.
  const place = () => securityPlace(desktop, hero);
  tl.set(secureScreen, { autoAlpha: 1 }, S)
    .set(
      phone,
      {
        x: () => fromHand().x,
        y: () => fromHand().y,
        scaleX: () => fromHand().scaleX,
        scaleY: () => fromHand().scaleY,
        rotation: () => fromHand().rotation,
        rotationY: 180,
        transformPerspective: 5000,
        transformOrigin: '50% 50%',
        autoAlpha: 1,
      },
      S + 0.02,
    )
    .to(
      phone,
      { x: () => place().x, y: () => place().y, scaleX: 1, scaleY: 1, rotation: 0, rotationY: 360, duration: 0.45, ease: 'power3.inOut' },
      S + 0.04,
    );

  // ---------- Security text rises in ----------
  tl.fromTo(secText, { y: () => 170 * unit(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, S + 0.2);

  // ---------- Join waitlist ----------
  if (desktop && barCta && secCta) {
    // Travels down from the top bar to its spot under the text.
    const glide = () => {
      const a = home(barCta);
      const b = home(secCta);
      return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), s: b.width / a.width };
    };
    tl.to(barCta, { x: () => glide().x, y: () => glide().y, scale: () => glide().s, duration: 0.3, ease: 'power3.inOut' }, S + 0.2)
      .set(barCta, { autoAlpha: 0 }, S + 0.5)
      .set(secCta, { autoAlpha: 1 }, S + 0.5);
  } else if (!desktop) {
    // Goes under the new subtitle (28 units below it, never under 22px; left
    // edge lined up). It fades out, moves while hidden, and fades back in
    // there: sliding across, it would pass behind the growing phone.
    tl.to(mobileCta, { autoAlpha: 0, duration: 0.1, ease: 'power1.in' }, S)
      .set(
        mobileCta,
        { x: () => home(secText).left - home(mobileCta).left, y: () => mobileCtaSpot(hero)?.y ?? 0 },
        S + 0.3,
      )
      .fromTo(mobileCta, { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'back.out(2)', immediateRender: false }, S + 0.45);
  }

  // ---------- The shield pops in ----------
  tl.to(shield, { scale: 1, autoAlpha: 1, duration: 0.15, ease: 'back.out(2)' }, S + 0.5);

  // ---------- Idle: a light sweeps across, then the shield beats like a heart
  // and sends out faint shockwaves; a short rest; repeat ----------
  const idle: gsap.core.Animation[] = [];
  if (!reduce) {
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.3, paused: true });
    // 1. Light glides across from left to right (clipped to the shield).
    loop.fromTo(sweep, { x: -200 }, { x: 430, duration: 0.95, ease: 'power1.inOut' }, 0);
    // 2. As it finishes: one heartbeat, lub (big) - dub (smaller) - settle.
    loop.to(
      shield,
      {
        keyframes: [
          { scale: 1.08, duration: 0.12, ease: 'power2.out' },
          { scale: 0.98, duration: 0.12, ease: 'power2.in' },
          { scale: 1.05, duration: 0.1, ease: 'power2.out' },
          { scale: 1, duration: 0.26, ease: 'power3.inOut' },
        ],
      },
      0.85,
    );
    // 3. Each beat sends a faint shockwave rippling out.
    waves.forEach((w, i) => {
      loop.fromTo(w, { scale: 1, opacity: 0.55 }, { scale: 1.5, opacity: 0, duration: 1.2, ease: 'power2.out' }, 0.87 + i * 0.24);
    });
    // The glow swells with the beat.
    loop.fromTo(glow, { scale: 0.9, opacity: 0.6 }, { scale: 1.15, opacity: 1, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.85);
    idle.push(loop);
  }
  let on = false;
  const onUpdate = (t: number) => {
    const now = t > S + 0.4 && t < T.secure + 0.25; // (stops once FAQ takes over)
    if (now === on) return;
    on = now;
    idle.forEach((a) => (now ? a.play() : a.pause()));
  };

  return {
    onUpdate,
    cleanup: () => {
      ScrollTrigger.removeEventListener('refreshInit', updateTarget);
      ScrollTrigger.removeEventListener('refreshInit', placeCta);
      if (secCta) secCta.style.removeProperty('top');
      target.remove();
      idle.forEach((a) => a.kill());
      gsap.set(sec, { clearProps: 'visibility' });
    },
  };
}
