import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { T } from '../data/hiw';
import { PHONE, PIVOTS, SELLER_FRAMES, SELLER_SHAPE } from '../data/sellers';
import partsJson from '../data/boy-parts.json';
import { unit } from './env';
import { ctaUnder, home, mapPath } from './hiw';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * How it works — for sellers, added to the story timeline after the buyer
 * steps (one screen of scrolling per unit, see T in data/hiw.ts):
 *
 *  4.00-4.70  buyer step 3 -> seller frame 1
 *             - the step 3 heading moves up to the seller heading's place
 *               (and becomes it); the badge and dashed trail fade away
 *             - the dark shape reshapes into the bottom diagonal
 *             - the phone shrinks and turns into the phone in the boy's hand
 *               as he slides in from behind an invisible edge
 *             - his chat bubbles pop out of the phone
 *  5, 6, 7    seller frame k -> k+1: the heading and subtitle rise out
 *             through the top fade while the next rise in from the bottom;
 *             he changes pose; the new bubbles pop out of his phone.
 * While on screen he idles: blinks, breathes, tilts his head, moves his arms
 * (also in lite mode; off only for reduced motion).
 */

type Ctx = {
  tl: gsap.core.Timeline;
  hero: HTMLElement;
  desktop: boolean;
  reduce: boolean;
  arrowFrom: SVGPathElement;
};

const C = partsJson.canvas;
const PARTS = partsJson.parts as Record<string, { x: number; y: number; w: number; h: number }>;

export function addSellers({ tl, hero, desktop, reduce, arrowFrom }: Ctx): { cleanup: () => void; onUpdate: (t: number) => void } {
  const q = gsap.utils.selector(hero);
  const sell = q('.sell')[0] as HTMLElement | undefined;
  if (!sell) return { cleanup: () => {}, onUpdate: () => {} };
  const s = gsap.utils.selector(sell);

  const layout = desktop ? 'desktop' : 'mobile';
  const frameW = desktop ? 1728 : 402;
  const arrowSvg = arrowFrom.ownerSVGElement!;
  const texts = s('.sell-text') as HTMLElement[];
  const boyBox = s('.boy-box')[0] as HTMLElement;
  const boy = s('.boy')[0] as HTMLElement;
  const poses = s('.pose') as HTMLElement[];
  const bubbleSets = s('.bubbles') as HTMLElement[];
  const pager = s('.sell-pager')[0] as HTMLElement;
  const pagerDots = s('.sell-pager i') as HTMLElement[];
  const sellShape = s('.sell-shape')[0] as HTMLElement;

  // How it works pieces this scene takes over from.
  const step3Text = q('.hiw-step--3 .hiw-text')[0] as HTMLElement;
  const step3Badge = q('.hiw-step--3 .hiw-badge')[0] as HTMLElement;
  const trail = q('.hiw-trail')[0] as HTMLElement;
  const mStep3 = q('.hiw-mtext--3')[0] as HTMLElement;
  const hiwPager = q('.hiw-pager')[0] as HTMLElement;
  const phone = q('.hiw-phone')[0] as HTMLElement;
  const mobileCta = q('.hiw-cta')[0] as HTMLElement;

  // ---------- Start states ----------
  gsap.set(sell, { visibility: 'visible' });
  gsap.set([...texts, pager, sellShape], { autoAlpha: 0 });
  // Waits fully behind the invisible edge (his left side starts ~9% into the
  // canvas and the edge is at 93%, so a whole canvas width clears it).
  gsap.set(boy, { xPercent: 100 });
  gsap.set(poses.slice(1), { autoAlpha: 0, scale: 0.97, transformOrigin: '50% 100%' });
  bubbleSets.forEach((set) => gsap.set(set.children, { autoAlpha: 0 }));

  // ---------- The dark shape: the arrow reshapes into the bottom diagonal ----------
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  target.style.display = 'none';
  arrowSvg.appendChild(target);
  const updateTarget = () => {
    const W = hero.offsetWidth || window.innerWidth;
    const u = unit() || 1;
    const [ox, oy] = SELLER_SHAPE[layout].offset;
    // Hugs the right edge (like How it works' shape), mapped into the arrow
    // svg's stretched units.
    const toSvgX = (x: number) => ((W - (frameW - (x + ox)) * u) * frameW) / W;
    target.setAttribute('d', mapPath(SELLER_SHAPE[layout].d, (x, y) => [toSvgX(x), y + oy]));
    const fallback = sellShape.querySelector<SVGPathElement>(`[data-sell-shape="${layout}"]`);
    if (fallback) {
      fallback.setAttribute('d', target.getAttribute('d')!);
      fallback.removeAttribute('transform');
    }
  };
  updateTarget();
  ScrollTrigger.addEventListener('refreshInit', updateTarget);

  const S = T.step3; // 4.0: buyer step 3 complete
  if (reduce) {
    tl.to(arrowSvg.parentElement, { autoAlpha: 0, duration: 0.2 }, S + 0.05).to(sellShape, { autoAlpha: 1, duration: 0.2 }, S + 0.15);
  } else {
    tl.to(arrowFrom, { morphSVG: { shape: target, shapeIndex: 'auto' }, duration: 0.45, ease: 'power2.inOut' }, S);
  }

  // ---------- Buyer step 3 makes way ----------
  if (desktop) {
    tl.to([step3Badge, trail], { autoAlpha: 0, duration: 0.12 }, S);
  } else {
    tl.to(hiwPager, { autoAlpha: 0, duration: 0.1 }, S);
  }

  // The heading moves up to the seller heading's place and becomes it: the
  // step 3 text travels there fading out while the seller text arrives along
  // the same path fading in.
  const oldText = desktop ? step3Text : mStep3;
  const delta = () => {
    const a = home(oldText);
    const b = home(texts[0]);
    return { x: b.left - a.left, y: b.top - a.top };
  };
  tl.to(oldText, { x: () => delta().x, y: () => delta().y, duration: 0.4, ease: 'power2.inOut' }, S)
    .to(oldText, { autoAlpha: 0, duration: 0.15 }, S + 0.15)
    .fromTo(
      texts[0],
      { x: () => -delta().x, y: () => -delta().y, autoAlpha: 0 },
      { x: 0, y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.inOut', immediateRender: false },
      S + 0.05,
    );

  // ---------- The phone shrinks into the boy's hand as he slides in ----------
  const boyPoint = (pose: keyof typeof PHONE) => {
    const b = boyBox.getBoundingClientRect(); // the canvas box itself never moves
    const p = PHONE[pose];
    return { x: b.left + (p.x / 100) * b.width, y: b.top + (p.y / 100) * b.height, w: (p.w / 100) * b.width, rot: p.rot };
  };
  // The phone flips over to its back and shrinks to the size and tilt of the
  // phone in his hand; he slides in behind it, so it lands in his hand.
  const PHONE_ASPECT = 1.55; // height / width of the phone he holds
  const shrink = () => {
    const h = home(phone);
    const p = boyPoint('worried');
    return {
      x: p.x - (h.left + h.width / 2),
      y: p.y - (h.top + h.height / 2),
      scaleX: p.w / h.width,
      scaleY: (p.w * PHONE_ASPECT) / h.height,
      rot: p.rot,
    };
  };
  tl.to(
    phone,
    {
      x: () => shrink().x,
      y: () => shrink().y,
      scaleX: () => shrink().scaleX,
      scaleY: () => shrink().scaleY,
      rotationY: 180,
      rotation: () => -shrink().rot, // flipped, so the tilt reads mirrored
      transformPerspective: 5000, // gentle 3D, so the big phone doesn't bulge mid-flip
      transformOrigin: '50% 50%',
      duration: 0.45,
      ease: 'power3.inOut',
    },
    S + 0.05,
  )
    .to(phone, { autoAlpha: 0, duration: 0.04 }, S + 0.5)
    .to(boy, { xPercent: 0, duration: 0.3, ease: 'power3.out' }, S + 0.05);

  // The background pattern moves across: from the left (buyer steps) to the
  // right (seller frames), crossfading between its left and right versions.
  tl.to(q('.pattern--h2'), { autoAlpha: 0, duration: 0.3, ease: 'power1.inOut' }, S + 0.05).to(
    q('.pattern--h1'),
    { autoAlpha: 1, duration: 0.3, ease: 'power1.inOut' },
    S + 0.15,
  );

  // Mobile: Join waitlist sits under the current subtitle as far as the
  // subtitle is under the heading (the same 22-unit gap, never under 18px),
  // so it follows when a longer or shorter subtitle comes in. Measured from
  // the layout, not mid-animation.
  const ctaY = (k: number) => ctaUnder(hero, mobileCta, texts[k], Math.max(22 * unit(), 18)).y;

  // Mobile: Join waitlist moves under the subtitle, on the left.
  if (!desktop) {
    // Left edge lines up with the subtitle's; it sits 28 units below it.
    tl.to(
      mobileCta,
      { x: () => home(texts[0]).left - home(mobileCta).left, y: () => ctaY(0), duration: 0.3, ease: 'power2.inOut' },
      S + 0.15,
    ).to(
      pager,
      { autoAlpha: 1, duration: 0.1 },
      S + 0.4,
    );
    tl.set(pagerDots[0], { opacity: 1 }, S + 0.4);
  }

  // ---------- Chat bubbles pop out of his phone, one after another ----------
  const popBubbles = (k: number, at: number) => {
    const pose = SELLER_FRAMES[k].pose;
    Array.from(bubbleSets[k].children).forEach((el, i) => {
      const b = el as HTMLElement;
      const from = () => {
        const box = boyBox.getBoundingClientRect();
        const p = PHONE[pose];
        return {
          x: (p.x / 100) * box.width - (b.offsetLeft + b.offsetWidth / 2),
          y: (p.y / 100) * box.height - (b.offsetTop + b.offsetHeight / 2),
        };
      };
      tl.fromTo(
        b,
        { x: () => from().x, y: () => from().y, scale: 0.15, autoAlpha: 0 },
        { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.12, ease: 'back.out(1.4)', immediateRender: false },
        at + i * 0.09,
      );
    });
  };
  popBubbles(0, S + 0.5);

  // ---------- Seller frame k -> k+1 ----------
  [T.sell1, T.sell2, T.sell3].forEach((t0, k) => {
    // Old bubbles float up and fade.
    tl.to(bubbleSets[k].children, { y: () => -24 * unit(), autoAlpha: 0, duration: 0.15, ease: 'power1.in' }, t0);
    // Text rises out through the top fade; the next rises in from the bottom.
    tl.to(texts[k], { y: () => -140 * unit(), autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t0).fromTo(
      texts[k + 1],
      { y: () => 170 * unit(), autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false },
      t0 + 0.2,
    );
    // He changes pose.
    tl.to(poses[k], { autoAlpha: 0, duration: 0.12 }, t0 + 0.22).to(poses[k + 1], { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(2)' }, t0 + 0.22);
    if (!desktop) {
      tl.to(mobileCta, { y: () => ctaY(k + 1), duration: 0.35, ease: 'power2.inOut' }, t0 + 0.2);
      tl.to(pagerDots[k], { opacity: 0, duration: 0.05 }, t0 + 0.28).to(pagerDots[k + 1], { opacity: 1, duration: 0.05 }, t0 + 0.28);
    }
    popBubbles(k + 1, t0 + 0.45);
  });

  // ---------- Idle: blink, breathe, tilt the head, move the arms ----------
  const idle: gsap.core.Animation[] = [];
  // Each pose's own loops: only the pose on screen runs (0..3 = frames 1..4).
  // Cheap (a few transforms, paused off screen), so it runs in lite mode too;
  // only reduced motion turns it off.
  const byPose: gsap.core.Animation[][] = reduce ? [[], [], [], []] : boyIdle(sell);
  byPose.forEach((list) => idle.push(...list));
  // Only while the boy is on screen (he slides out as Security starts), and
  // only the pose he's in: frame k's pose from its start until the next.
  let playing = -1;
  const onUpdate = (t: number) => {
    const on = t > S + 0.3 && t < T.sell4 + 0.35;
    // Pose k+1 takes over 0.22 into each change (T.sell1.. + 0.22).
    const k = on ? Math.max(0, Math.min(3, Math.floor(t - S - 0.22))) : -1;
    if (k === playing) return;
    if (playing >= 0) byPose[playing].forEach((a) => a.pause());
    playing = k;
    if (k >= 0) byPose[k].forEach((a) => a.play());
  };

  return {
    onUpdate,
    cleanup: () => {
      ScrollTrigger.removeEventListener('refreshInit', updateTarget);
      target.remove();
      idle.forEach((a) => a.kill());
      gsap.set(sell, { clearProps: 'visibility' });
    },
  };
}

/**
 * The boy's idle life (blink, breathe, a gentle rock; in the packing pose the
 * head tilts and the bag pushes into the box), for every pose found under
 * `root`. Returns paused loops, one list per pose (0..3 = frames 1..4): play
 * only the pose on screen. Used by the story and by the phones' seller section
 * (stack.ts), whose copies of the frames each hold one pose.
 */
export function boyIdle(root: HTMLElement): gsap.core.Animation[][] {
  const byPose: gsap.core.Animation[][] = [[], [], [], []];
  const POSES = ['worried', 'wink', 'packing', 'peace'] as const;
  const part = (key: string) => root.querySelector<HTMLElement>(`[data-part="${key}"]`);
  const origin = (key: string) => {
    const pv = PIVOTS[key];
    const p = PARTS[`boy-${key}`];
    if (!pv || !p) return '50% 100%';
    return `${(((pv[0] - p.x) / p.w) * 100).toFixed(1)}% ${(((pv[1] - p.y) / p.h) * 100).toFixed(1)}%`;
  };
  const sway = (key: string, deg: number, dur: number) => {
    const el = part(key);
    if (!el) return;
    byPose[POSES.indexOf(key.split('-')[0] as (typeof POSES)[number])].push(gsap.fromTo(el, { rotation: -deg }, { rotation: deg, transformOrigin: origin(key), duration: dur, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }));
  };
  (['worried', 'wink', 'packing', 'peace'] as const).forEach((pose) => {
    // Breathing: a tiny rise of the body from the floor.
    const k = POSES.indexOf(pose);
    const p = part(`${pose}-body`) ?? part(`${pose}-full`);
    if (p) byPose[k].push(gsap.fromTo(p, { scaleY: 1 }, { scaleY: 1.014, transformOrigin: '50% 100%', duration: 1.8, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }));
    // Blinking.
    const eyes = part(`${pose}-eyes`);
    if (eyes) {
      byPose[k].push(
        gsap
          .timeline({ repeat: -1, repeatDelay: 2.6 + Math.random() * 1.4, paused: true })
          .set(eyes, { autoAlpha: 1 }, 0)
          .set(eyes, { autoAlpha: 0 }, 0.13),
      );
    }
  });
  // Worried, wink and peace are single seamless pictures (see POSE_LAYERS),
  // so each pose rocks gently as a whole and he breathes and blinks. In the
  // packing pose the head tilts a little and the bag pushes into the box.
  (['worried', 'wink', 'packing', 'peace'] as const).forEach((pose, i) => {
    const el = root.querySelector<HTMLElement>(`.pose--${pose}`);
    if (!el) return;
    byPose[i].push(
      gsap.fromTo(el, { rotation: -0.9 }, { rotation: 0.9, transformOrigin: '50% 98%', duration: 2.1 + i * 0.15, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    );
  });
  sway('packing-head', 1.6, 2.1);
  const bag = part('packing-arms-bag');
  if (bag) byPose[2].push(gsap.fromTo(bag, { y: 0 }, { y: '3%', duration: 0.6, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }));
  return byPose;
}
