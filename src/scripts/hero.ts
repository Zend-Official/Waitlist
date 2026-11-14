import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { MQ_DESKTOP, MQ_MOBILE, prefersReducedMotion, token, unit } from './env';
import { getLenis, scrollToY } from './smooth';
import { addHowItWorks } from './hiw';
import { addSellers } from './sellers';
import { addSecurity } from './security';
import { addFaq } from './faq';
import { T, STORY_END } from '../data/hiw';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

/**
 * Hero scroll scene: pinned for one screen height, scrubbed by scroll.
 * One arrow reshapes itself from Hero 1's position into Hero 2's, and the girl
 * (with her chip) travels from her Hero 1 spot to her Hero 2 spot, blending
 * from worried to happy on the way. No snapping: it follows the scroll exactly.
 *
 * Timeline (0 -> 1):
 *  0.00-0.16  Hero 1 copy rises out
 *  0.08-0.60  arrow morphs Hero 1 -> Hero 2
 *  0.10-0.60  girl + chip travel; worried -> happy blend at 0.30-0.42
 *  0.28-0.50  pattern fade flips direction
 *  0.40-0.50  logo turns dark, section label white (desktop)
 *  0.62-0.80  chip: bag -> green double tick, small pop
 *  0.60-0.92  Hero 2 copy rises in
 */
/** Hero 2 arrow tip, in desktop frame units (see .scene--h2 .shape in Hero.astro). */
const H2_TIP_X = 257;

/**
 * Rewrites the x coordinates of an absolute M/L/C path with `fx`.
 * (The arrow paths only use absolute M, L, C and Z.)
 */
function mapPathX(d: string, fx: (x: number) => number): string {
  let i = 0;
  return d.replace(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi, (tok) => {
    if (/^[a-z]$/i.test(tok)) {
      i = 0;
      return tok;
    }
    const v = parseFloat(tok);
    const out = i % 2 === 0 ? fx(v) : v;
    i += 1;
    return ` ${+out.toFixed(2)}`;
  });
}

let story: { tl: gsap.core.Timeline; st: ScrollTrigger } | null = null;
/** Resolves once every scroll scene has joined the story timeline. */
export let scenesReady: Promise<void> = Promise.resolve();
/** Story time to return to after a layout switch rebuilds the story. */
let resumeT: number | null = null;
let lastT: number | null = null;

/** Scroll position where the story timeline is at time t (see T in data/hiw.ts). */
export function storyY(t: number): number {
  if (!story) return 0;
  const { tl, st } = story;
  return Math.round(st.start + (t / tl.duration()) * (st.end - st.start));
}

/** Story time at the current scroll position. */
export function storyTime(): number {
  if (!story) return 0;
  const { tl, st } = story;
  const p = (window.scrollY - st.start) / (st.end - st.start || 1);
  return Math.max(0, Math.min(1, p)) * tl.duration();
}

export function initHeroScroll() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!hero || !header) return;
  const q = gsap.utils.selector(hero);
  const mm = gsap.matchMedia();

  mm.add({ desktop: MQ_DESKTOP, mobile: MQ_MOBILE }, (ctx) => {
    const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };
    const lenis = getLenis();
    const reduce = prefersReducedMotion();
    const success = token('--c-success');

    const layout = desktop ? '.only-desktop' : '.only-mobile';
    const arrowFrom = q(`.scene--h1 .shape${layout} path`)[0] as SVGPathElement;
    const arrowTo = q(`.scene--h2 .shape${layout} path`)[0] as SVGPathElement;
    const girlA = q('.girl--h1')[0] as HTMLElement;
    const girlB = q('.girl--h2')[0] as HTMLElement;
    const chipA = q('.scene--h1 .chip')[0] as HTMLElement;
    const chipB = q('.scene--h2 .chip')[0] as HTMLElement;

    // Distances between the Hero 1 and Hero 2 spots, measured live (each piece
    // is pinned to different screen edges, so this changes with screen size).
    const centre = (el: HTMLElement) => ({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 });
    const girlDx = () => centre(girlB).x - centre(girlA).x;
    const girlDy = () => centre(girlB).y - centre(girlA).y;
    const girlK = () => girlB.offsetHeight / girlA.offsetHeight;
    const chipDx = () => chipB.offsetLeft - chipA.offsetLeft;
    const chipDy = () => chipB.offsetTop - chipA.offsetTop;

    // The morph runs inside Hero 1's svg, whose 1728-wide viewBox is stretched
    // to the screen width. Hero 2's arrow is stretched from its tip instead, so
    // express its path in Hero 1's coordinates for the current screen size.
    const morphTarget = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    morphTarget.style.display = 'none';
    arrowFrom.parentNode?.appendChild(morphTarget);
    const updateMorphTarget = () => {
      const d = arrowTo.getAttribute('d') ?? '';
      if (!desktop) {
        morphTarget.setAttribute('d', d);
        return;
      }
      const W = hero.offsetWidth;
      const u = unit();
      const s2 = (W - H2_TIP_X * u) / ((1728 - H2_TIP_X) * u); // stretch right of the tip
      const toScreen = (x: number) => H2_TIP_X * u + (x - H2_TIP_X) * u * s2;
      morphTarget.setAttribute('d', mapPathX(d, (x) => (toScreen(x) * 1728) / W));
    };
    updateMorphTarget();
    ScrollTrigger.addEventListener('refreshInit', updateMorphTarget);

    gsap.set(q('.scene--h2, .copy--h2'), { visibility: 'visible' });
    gsap.set(chipB, { autoAlpha: 0 });
    gsap.set(q('.copy--h2 .line, .copy--h2 .body, .copy--h2 .btn, .copy--h2 .joined'), { autoAlpha: 0, yPercent: 45 });
    header.dataset.hdr = 'h1';
    header.dataset.bar = 'off';
    document.documentElement.dataset.rail = desktop ? 'bar' : 'hero';

    const tl = gsap.timeline({ defaults: { ease: 'none' } });

    // 1. Hero 1 copy leaves
    tl.to(q('.copy--h1 .line'), { yPercent: -55, autoAlpha: 0, stagger: 0.03, duration: 0.12, ease: 'power1.in' }, 0).to(
      q('.copy--h1 .body, .copy--h1 .btn, .copy--h1 .joined'),
      { yPercent: -35, autoAlpha: 0, stagger: 0.02, duration: 0.12, ease: 'power1.in' },
      0.03,
    );

    // 2. One arrow: Hero 1's arrow reshapes into Hero 2's (reduced motion: crossfade)
    const arrowB = q('.scene--h2 .shape-box');
    if (reduce) {
      tl.to(q('.scene--h1 .shape-box'), { autoAlpha: 0, duration: 0.3 }, 0.15).fromTo(arrowB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.3);
    } else {
      gsap.set(arrowB, { autoAlpha: 0 });
      tl.to(arrowFrom, { morphSVG: { shape: morphTarget, shapeIndex: 'auto' }, duration: 0.52, ease: 'power2.inOut' }, 0.08);
    }

    // 3. One girl: she travels to her Hero 2 spot, blending worried -> happy.
    //    The chip rides along and hands over to Hero 2's chip where it lands.
    const move = reduce ? 0 : 1;
    tl.to(girlA, { x: () => girlDx() * move, y: () => girlDy() * move, scale: () => (move ? girlK() : 1), duration: 0.5, ease: 'power2.inOut' }, 0.1)
      .fromTo(
        girlB,
        { x: () => -girlDx() * move, y: () => -girlDy() * move, scale: () => (move ? 1 / girlK() : 1) },
        { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'power2.inOut' },
        0.1,
      )
      .to(girlA, { autoAlpha: 0, duration: 0.12 }, 0.3)
      .fromTo(girlB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.3)
      .to(chipA, { x: () => chipDx() * move, y: () => chipDy() * move, duration: 0.5, ease: 'power2.inOut' }, 0.1)
      .set(chipA, { autoAlpha: 0 }, 0.6)
      .set(chipB, { autoAlpha: 1 }, 0.6);

    // 4. Pattern fade flips with the arrow
    tl.to(q('.pattern--h1'), { autoAlpha: 0, duration: 0.2 }, 0.28).to(q('.pattern--h2'), { autoAlpha: 1, duration: 0.2 }, 0.3);

    // 5. Logo / label colours follow what's behind them: Hero 1 logo on the
    //    arrow; Hero 2 (desktop) label on the arrow; How it works both on the
    //    page. A data attribute, so the colours come from the theme.
    // Scenes added below register their per-frame hooks here (declared first,
    // so a timeline tick during setup can't reach a scene that isn't ready).
    const onStory: ((t: number) => void)[] = [];
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      header.dataset.hdr = t >= T.hero2 + 0.4 ? 'hiw' : desktop && t >= 0.45 ? 'h2' : 'h1';
      // Desktop: the top bar from How it works on.
      header.dataset.bar = desktop && t >= T.hero2 + 0.05 ? 'on' : 'off'; // in time to receive Join waitlist
      // Security: Join waitlist leaves the bar for its spot under the text.
      header.dataset.cta = desktop && t >= T.sell4 + 0.5 ? 'off' : 'on';
      // Desktop: square rail with the top bar from How it works on.
      document.documentElement.dataset.rail = desktop ? 'bar' : 'hero'; // desktop: square rail throughout
      onStory.forEach((fn) => fn(t));
    });

    // 6. Hero 2 chip "pays"
    tl.to(q('.scene--h2 .chip__bag'), { scale: 0, autoAlpha: 0, duration: 0.05, ease: 'power1.in' }, 0.62)
      .to(q('.scene--h2 .chip__box'), { backgroundColor: success, borderRadius: '50%', duration: 0.06 }, 0.64)
      .to(q('.scene--h2 .chip__tick'), { autoAlpha: 1, duration: 0.01 }, 0.67)
      .to(q('.scene--h2 .chip__tick path'), { strokeDashoffset: 0, duration: 0.08, stagger: 0.03 }, 0.67)
      .to(q('.scene--h2 .chip__card'), { scale: 1.08, duration: 0.04, ease: 'power1.out' }, 0.71)
      .to(q('.scene--h2 .chip__card'), { scale: 1, duration: 0.05, ease: 'power1.in' }, 0.75);

    // 7. Hero 2 copy arrives
    tl.to(q('.copy--h2 .line'), { yPercent: 0, autoAlpha: 1, stagger: 0.04, duration: 0.14, ease: 'power2.out' }, 0.6)
      .to(q('.copy--h2 .body'), { yPercent: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0.7)
      .to(q('.copy--h2 .btn'), { yPercent: 0, autoAlpha: 1, duration: 0.12, ease: 'back.out(2)' }, 0.78)
      .to(q('.copy--h2 .joined'), { yPercent: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.84);

    // 8. How it works (same stage, one story): buyers, then sellers; then Security
    // The later scenes join the same timeline in short steps right after the
    // hero is ready (each step yields to the browser), so a slow phone isn't
    // frozen building all of them before the first paint. They're in place
    // long before anyone can scroll to them; a reload part-way down waits
    // for them (scenesReady) before jumping to its frame.
    const cleanups: (() => void)[] = [];
    let alive = true;
    const sceneCtx = { tl, hero, desktop, reduce, arrowFrom };
    const steps = [
      () => cleanups.push(addHowItWorks(sceneCtx)),
      () => {
        const sellers = addSellers(sceneCtx);
        cleanups.push(sellers.cleanup);
        onStory.push(sellers.onUpdate);
      },
      () => {
        const security = addSecurity(sceneCtx);
        cleanups.push(security.cleanup);
        onStory.push(security.onUpdate);
      },
      () => cleanups.push(addFaq(sceneCtx).cleanup),
    ];
    scenesReady = new Promise<void>((resolve) => {
      const next = () => {
        if (!alive) return resolve();
        const step = steps.shift();
        if (!step) {
          // Put the story at the current scroll position now that it's whole.
          tl.progress(tl.progress());
          return resolve();
        }
        step();
        setTimeout(next, 0);
      };
      setTimeout(next, 0);
    });

    // Keep the timeline exactly STORY_END long: one unit per screen of scrolling.
    tl.to({}, { duration: 0.1 }, STORY_END - 0.1);

    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: `+=${STORY_END * 100}%`,
      pin: true,
      animation: tl,
      // Lenis already smooths desktop scrolling; phones get a light catch-up.
      scrub: lenis ? true : 0.3,
      invalidateOnRefresh: true,
      // Running note of the current frame (from the scroll position, so it is
      // left alone when a layout switch rewinds the animation), used to come
      // back to the same frame after the switch. Null at the top or past the end.
      onUpdate: (self) => {
        const y = self.scroll();
        lastT = y > 0 && y <= self.end + 2 ? self.progress * STORY_END : null;
      },
    });

    story = { tl, st };
    // Switching layout (phone <-> desktop) rebuilds the story: go back to the
    // frame you were on before the switch (pixels mean a different frame now).
    if (resumeT !== null) {
      const t = resumeT;
      resumeT = null;
      scenesReady.then(() =>
        setTimeout(() => {
          ScrollTrigger.refresh();
          scrollToY(storyY(t), { immediate: true });
        }, 60),
      );
    }
    if (import.meta.env.DEV) (window as unknown as { __hero: unknown }).__hero = { tl, st };

    return () => {
      // Return to this frame after the layout switch (the note kept as you
      // scroll; by now the old scroll length may already be gone).
      resumeT = lastT;
      ScrollTrigger.removeEventListener('refreshInit', updateMorphTarget);
      morphTarget.remove();
      alive = false;
      cleanups.forEach((fn) => fn());
      delete header.dataset.hdr;
      delete header.dataset.bar;
      delete header.dataset.cta;
      delete document.documentElement.dataset.rail;
      story = null;
    };
  });
}
