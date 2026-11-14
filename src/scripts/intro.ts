import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isMobileLayout, unit } from './env';
import { resumeTarget } from './restore';

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

/**
 * Loading screen, on every page load (nav buttons use each frame's own
 * entrance instead, see frames.ts):
 *  1. The whole screen is the arrow's dark colour with the white Zend logo,
 *     which beats once like a heart. Behind it the page moves to its frame
 *     (top, the reload position, or the section's first frame).
 *  2. As the beat settles, the logo glides into the header logo and the
 *     cover opens: on the hero it reshapes into the arrow on screen (Hero 1
 *     or Hero 2); below the hero it lifts away.
 *  3. Landing on Hero 1, its headline, subtitle, button, girl and chip arrive.
 * Any scroll/key/touch fast-forwards it once the page is in place.
 */

let running: gsap.core.Timeline | null = null;

/** Page load. `restored` resolves once a reload has moved to its frame. */
export function playIntro(restored: Promise<void> = Promise.resolve()): void {
  const html = document.documentElement;
  if (!html.classList.contains('intro')) return;
  (window as unknown as { __zendIntroStarted: boolean }).__zendIntroStarted = true;

  const resuming = resumeTarget() > 0;
  if (!resuming) {
    // Fresh start: the hero scroll animation must be at its beginning.
    window.scrollTo(0, 0);
    ScrollTrigger.update();
  }
  runLoader({ fresh: !resuming, place: () => restored });
  // Hidden start states are now applied inline (and the cover is up), so the
  // page can be shown.
  html.classList.remove('intro');
}

type LoaderOpts = {
  /** Landing on Hero 1: play its arrival animation. */
  fresh: boolean;
  /** Move the page to its frame (called once the cover hides the page). */
  place: () => Promise<unknown>;
};

function runLoader({ fresh, place }: LoaderOpts): boolean {
  const hero = document.querySelector<HTMLElement>('.hero');
  const cover = document.querySelector<HTMLElement>('.intro-cover');
  const logo = document.querySelector<HTMLElement>('.intro-logo');
  if (!hero || !cover || !logo) return false;

  const q = gsap.utils.selector(hero);
  const mobile = isMobileLayout();
  const layout = mobile ? '.only-mobile' : '.only-desktop';
  const coverPath = cover.querySelector<SVGPathElement>(`${layout} path`)!;
  const arrowPath = q(`.scene--h1 .shape${layout} path`)[0] as SVGPathElement;
  const headerMark = document.querySelector<HTMLElement>('.brand__mark');
  const girl = q('.scene--h1 .girl');
  const chip = q('.scene--h1 .chip__card');
  const words = q('.copy--h1 .line .li, .copy--h1 .body .li');
  const btn = q('.copy--h1 .btn, .copy--h1 .joined');
  const pattern = q('.pattern--h1');
  const navIn = document.querySelectorAll('.nav-in');
  // The mobile nav pill has a white background: keep the whole pill hidden
  // until it's revealed, so it doesn't sit on top of the dark screen.
  const rail = document.querySelector<HTMLElement>('.rail');
  const girlImg = hero.querySelector<HTMLImageElement>('.scene--h1 .girl img');
  const logoArt = logo.querySelector('svg');

  // Cover and logo are fixed to the screen; keep them outside the (pinned)
  // hero so they stay on screen wherever the page is.
  if (cover.parentElement !== document.body) document.body.append(cover, logo);

  // The cover starts as a rectangle far bigger than the screen, drawn in the
  // arrow's own coordinates, so it can morph straight into the arrow.
  const u = unit() || 1; // 0 only in a zero-size (hidden) window
  const frameW = mobile ? 402 : 1728;
  const below = window.innerHeight / u + 600;
  coverPath.setAttribute('d', `M${-frameW} -800 L${frameW * 2} -800 L${frameW * 2} ${below} L${-frameW} ${below} Z`);

  // Where the centred logo has to travel to land exactly on the header logo.
  const flight = () => {
    const from = logo.getBoundingClientRect();
    const to = headerMark?.getBoundingClientRect();
    if (!to || !from.width) return { x: 0, y: 0, scale: 1 };
    return {
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: to.width / from.width,
    };
  };

  // Start states.
  gsap.set(cover, { display: 'block', yPercent: 0, autoAlpha: 1 });
  gsap.set(logo, { display: 'block', xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, clearProps: 'color' });
  hideForArrival();

  // Hide the header logo until the flying logo lands on it; the nav and (on
  // Hero 1) its content arrive after.
  function hideForArrival() {
    // The desktop top bar follows the story, so hide it with a class while the
    // loading screen is up (the story timeline still sets its own state).
    document.documentElement.classList.add('loading');
    if (headerMark) gsap.set(headerMark, { autoAlpha: 0 });
    gsap.set([rail, navIn], { autoAlpha: 0 });
    if (fresh) {
      gsap.set(pattern, { autoAlpha: 0 });
      gsap.set(words, { yPercent: 60, autoAlpha: 0 });
      gsap.set(girl, { xPercent: 12, autoAlpha: 0 });
      gsap.set(btn, { scale: 0.8, autoAlpha: 0 });
      gsap.set(chip, { scale: 0.4, autoAlpha: 0 });
    }
  }

  const BEAT = 0.55; // heartbeat starts
  const GO = 0.95; // transition starts as the heartbeat settles
  let built = false;

  const tl = gsap.timeline({ paused: true, onComplete: finish });
  running = tl;
  tl.fromTo(logo, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, 0)
    // Wait here until the page is in place behind the cover (and Hero 1's
    // girl image is ready, at most a second), then add the right exit.
    .addPause(0.5, () => {
      const imgReady = fresh
        ? Promise.race([girlImg?.decode?.().catch(() => undefined) ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1000))])
        : Promise.resolve();
      // Even if placing the page fails, the loader must still open.
      const placed = Promise.resolve()
        .then(place)
        .catch((err) => console.error(err));
      Promise.all([placed, imgReady]).then(() => {
        // Nav: hide what arrives only now, after the page has moved (moving
        // replays the hero's scroll animation, which would undo it).
        try {
          buildExit();
        } catch (err) {
          console.error(err);
          tl.progress(1); // never leave the loading screen stuck
          return;
        }
        built = true;
        tl.resume();
      });
    })
    // 1b. One heartbeat: lub (big) – dub (smaller) – settle.
    .to(
      logoArt,
      {
        keyframes: [
          { scale: 1.16, duration: 0.12, ease: 'power2.out' },
          { scale: 0.97, duration: 0.12, ease: 'power2.in' },
          { scale: 1.1, duration: 0.1, ease: 'power2.out' },
          { scale: 1, duration: 0.24, ease: 'power3.inOut' },
        ],
        transformOrigin: '50% 50%',
      },
      BEAT,
    );

  function buildExit() {
    const heroSt = ScrollTrigger.getAll().find((st) => st.pin === hero);
    const onHero = !heroSt || window.scrollY <= heroSt.end + 2;

    // 2. The logo flies to the corner (taking on the header logo's colour,
    //    which is purple over a white page on Hero 2).
    tl.to(
      logo,
      {
        x: () => flight().x,
        y: () => flight().y,
        scale: () => flight().scale,
        color: () => (headerMark ? getComputedStyle(headerMark).color : '#fff'),
        duration: 0.85,
        ease: 'power3.inOut',
      },
      GO,
    )
      .set(logo, { display: 'none' }, GO + 0.85)
      .set(headerMark, { autoAlpha: 1 }, GO + 0.85);

    // ...while the dark screen opens: into the arrow on screen (Hero 1 or
    // Hero 2), or lifting away below the hero.
    if (onHero) {
      // Into the arrow on screen (Hero 1, Hero 2, or How it works' dark
      // shape). The cover keeps its one dark colour throughout.
      tl.to(coverPath, { morphSVG: { shape: arrowPath, shapeIndex: 'auto' }, duration: 0.9, ease: 'power3.inOut' }, GO).set(
        cover,
        { display: 'none' },
        GO + 0.9,
      );
    } else {
      tl.to(cover, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' }, GO).set(cover, { display: 'none' }, GO + 0.8);
    }

    // 3. Nav, and on Hero 1 its content, arrive.
    tl.call(() => document.documentElement.classList.remove('loading'), [], GO + 0.8)
      .to(rail, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, GO + 0.8).fromTo(
      navIn,
      { autoAlpha: 0, y: -8 },
      { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.4, ease: 'power2.out' },
      GO + 0.8,
    );
    if (fresh) {
      tl.to(pattern, { autoAlpha: 1, duration: 0.6 }, GO + 0.35)
        .to(words, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, GO + 0.55)
        .to(girl, { xPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, GO + 0.6)
        .to(btn, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, GO + 0.85)
        .to(chip, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.2)' }, GO + 0.95);
    }
  }

  tl.play(0);
  if (import.meta.env.DEV) (window as unknown as { __intro: gsap.core.Timeline }).__intro = tl;

  const skipKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End']);
  const skip = (e: Event) => {
    if (!built) return; // still getting the page ready behind the cover
    if (e instanceof KeyboardEvent && !skipKeys.has(e.key)) return;
    tl.progress(1);
  };
  const events = ['wheel', 'touchstart', 'keydown'] as const;
  events.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));

  function finish() {
    events.forEach((ev) => window.removeEventListener(ev, skip));
    gsap.set([logo, cover], { display: 'none' });
    document.documentElement.classList.remove('loading');
    gsap.set(logo, { clearProps: 'color' });
    if (logoArt) gsap.set(logoArt, { clearProps: 'transform' });
    // Only remove what the loader animated; elements keep their own inline
    // size vars, and off Hero 1 the hero's scroll animation owns them.
    if (fresh) gsap.set([girl, chip, words, btn, pattern], { clearProps: 'transform,opacity,visibility' });
    gsap.set(navIn, { clearProps: 'transform,opacity,visibility' });
    if (rail) gsap.set(rail, { clearProps: 'opacity,visibility' });
    if (headerMark) gsap.set(headerMark, { clearProps: 'opacity,visibility' });
    running = null;
  }
  return true;
}
