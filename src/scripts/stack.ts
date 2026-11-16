import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY_END } from '../data/hiw';
import { prefersReducedMotion } from './env';
import { boyIdle } from './sellers';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phones ("scroll mode"): the story as a page you scroll
 * normally, each part with its own motion (html[data-flow]).
 *
 *  1. Hero: the girl stays where she is while Hero 1 scrolls away under her;
 *     when Hero 2's girl rises to meet her she turns into her (moves, resizes
 *     and crossfades with the scroll), then scrolls on with Hero 2.
 *  2. How it works for buyers: one timeline (FlowTimeline.astro), no phone.
 *     Its line draws itself as you scroll; the steps slide in.
 *  3. Sellers: the four frames scroll over one fixed background (their
 *     shared dark shape and pattern); the text rises, the boy slides in, the
 *     bubbles pop. Join waitlist only on the last one.
 *  4. Security: its own section; text, Join waitlist and phone rise in.
 *  5. FAQ: the questions stacked without the phone frame, sliding in from
 *     the left one by one, then Talk to us.
 *
 * Built from the story itself: the timeline is set to a frame and the stage
 * copied ("snapshot"), keeping only what's visible there. The hero stays as
 * the first section. Everything comes in again whenever you scroll back.
 */

/** What comes in, and from where, as a part scrolls into view. */
const ENTER: [string, gsap.TweenVars][] = [
  ['.copy--h2 .line, .copy--h2 .body, .copy--h2 .btn, .copy--h2 .joined', { y: 36 }],
  ['.scene--h2 .chip', { scale: 0.6 }],
  ['.flow-tl__title', { y: 70 }],
  ['.flow-tl__num', { scale: 0 }],
  ['.flow-tl__name', { x: -60 }],
  ['.flow-tl__bubble', { x: 70, scale: 0.94 }],
  ['.sell-pager', { y: -12 }],
  ['.sell-text', { y: 40 }],
  ['.boy-box', { x: 70 }],
  ['.bubbles .bub', { scale: 0.6 }],
  ['.sec-text', { y: 40 }],
  ['.hiw-cta', { y: 24 }],
  ['.hiw-phone', { y: 90 }],
  ['.faq-title', { y: 30 }],
  ['.faq-item', { x: -56 }],
  ['.faq-talk', { scale: 0.85 }],
];
const ENTER_ALL = ENTER.map(([s]) => s).join(', ');
/** The same, plus Hero 1's own pieces (they leave and come back too). */
const ENTER_IN: [string, gsap.TweenVars][] = [
  ['.copy--h1 .line, .copy--h1 .body, .copy--h1 .btn, .copy--h1 .joined', { y: 36 }],
  // the dark background shapes glide in from off the left edge (no fade)
  ['.shape-box, .sell-shape', { xPercent: -100, autoAlpha: 1 }],
  ...ENTER,
];
const ENTER_ALL_IN = ENTER_IN.map(([s]) => s).join(', ');

/** The browser can tie CSS animations to the scroll (native, smooth on phones). */
const NATIVE_SCROLL_FX = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

export type Stack = {
  /** Scroll position (page px) of each story frame 0..STORY_END. */
  tops: () => number[];
  cleanup: () => void;
};

export function buildStack(hero: HTMLElement, tl: gsap.core.Timeline, header: HTMLElement): Stack {
  const html = document.documentElement;
  const triggers: ScrollTrigger[] = [];
  const observers: IntersectionObserver[] = [];
  const made: HTMLElement[] = [];

  // The header's look at each frame, and the snapshots we need.
  const hdr: string[] = [];
  const shots = new Map<number, HTMLElement>();
  for (let k = 0; k <= STORY_END; k++) {
    tl.time(k); // the story at frame k
    gsap.getTweensOf(hero.querySelectorAll('.faq-item, .faq-talk')).forEach((t) => t.progress(1));
    hdr.push(header.dataset.hdr ?? 'h1');
    if ([1, 5, 6, 7, 8, 9].includes(k)) shots.set(k, snapshot(hero));
  }
  tl.time(0); // the hero itself stays at Hero 1
  html.dataset.flow = '';

  // ---------- 1. Hero 2 ----------
  const hero2 = shots.get(1)!;
  hero.after(hero2);
  made.push(hero2);

  // ---------- 2. How it works: the timeline ----------
  const timeline = document.querySelector<HTMLElement>('.flow-tl')!;
  const tlHome = {
    parent: timeline.parentElement!,
    next: timeline.nextSibling,
  };
  timeline.hidden = false;
  hero2.after(timeline);

  // ---------- 3. Sellers: sideways through the four frames ----------
  // One background (their shared dark shape and pattern) with the four frames
  // on top of it, one screen each. Once the section fills the screen it's
  // held there (pinned), and scrolling moves sideways through the frames:
  // each slides out to the left fading away while the next slides in from
  // the right fading in. Then normal scrolling carries on.
  const sell = document.createElement('div');
  sell.className = 'flow-sell';
  const bg = shots.get(5)!.cloneNode(true) as HTMLElement;
  bg.classList.add('flow-sell__bg');
  bg.setAttribute('aria-hidden', 'true');
  // (It keeps the pager dots: they stay put while the frames slide.)
  bg.querySelectorAll('.sell-window, .boy-box, .hiw, .copy, .scene .girl, .scene .chip').forEach((n) => n.remove());
  sell.append(bg);
  [5, 6, 7, 8].forEach((k) => {
    const f = shots.get(k)!;
    f.classList.add('flow-sell__frame');
    f.querySelectorAll('.hero__bg, .shape-box, .sell-shape, .sell-pager').forEach((n) => n.remove());
    if (k !== 8) f.querySelectorAll('.hiw-cta').forEach((n) => n.remove()); // Join waitlist: last one only
    sell.append(f);
  });
  // The browser holds it (CSS position: sticky inside a taller "track"),
  // not a script: on phones that stays perfectly in step with the finger,
  // with no snap or bounce as it reaches the top.
  const track = document.createElement('div');
  track.className = 'flow-sell-track';
  track.append(sell);
  timeline.after(track);
  made.push(track);
  const frameCount = sell.querySelectorAll('.flow-sell__frame').length;
  const sizeTrack = () => (track.style.height = `${sell.offsetHeight + window.innerHeight * (frameCount - 1)}px`);
  sizeTrack();
  ScrollTrigger.addEventListener('refreshInit', sizeTrack);
  const sellFrames = Array.from(sell.querySelectorAll<HTMLElement>('.flow-sell__frame'));

  // ---------- 4. Security ----------
  const sec = shots.get(9)!;
  // (Join waitlist stays, under the subtitle; .sec-cta is desktop's.)
  sec.querySelectorAll('.sec-cta').forEach((n) => n.remove());
  track.after(sec);
  made.push(sec);

  // ---------- The sellers' sideways scroll ----------
  // Native where the browser has scroll-driven CSS animations (global.css,
  // "sell-f0..3"): each frame's slide-and-fade is tied straight to the page
  // scroll, run by the browser in step with the finger; this script only
  // works out where on the page it happens (setRanges, below). Older browsers
  // get the same motion from GSAP, driven by the scroll.
  sellFrames.forEach((f, k) => (f.dataset.sf = String(k)));
  let sellFallback: ScrollTrigger | null = null;
  if (!NATIVE_SCROLL_FX) {
    const across = gsap.timeline({ paused: true });
    sellFrames.forEach((f, k) => k && gsap.set(f, { xPercent: 100, autoAlpha: 0 }));
    for (let k = 0; k < sellFrames.length - 1; k++) {
      across
        .to(sellFrames[k], { xPercent: -100, autoAlpha: 0, duration: 0.7, ease: 'power1.inOut' }, k + 0.15)
        .to(sellFrames[k + 1], { xPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, k + 0.15);
    }
    across.to({}, { duration: 0.15 }, sellFrames.length - 1 - 0.15); // (whole screens)
    sellFallback = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: () => `+=${window.innerHeight * (sellFrames.length - 1)}`,
      scrub: 0.3,
      animation: across,
      invalidateOnRefresh: true,
    });
    triggers.push(sellFallback);
  }

  // Which frame is showing (IntersectionObserver: the frame at least half on
  // screen; the section clips the others away): the pager dots, the boy's
  // idle life and the chat messages follow it.
  const boyLoops = prefersReducedMotion() ? [] : sellFrames.map((f) => boyIdle(f).flat());
  let shownBoy = -1;
  let sellOnScreen = false;
  let frameNow = 0;
  const playBoy = () => {
    const want = sellOnScreen ? frameNow : -1;
    if (want === shownBoy) return;
    boyLoops[shownBoy]?.forEach((a) => a.pause());
    shownBoy = want;
    boyLoops[want]?.forEach((a) => a.play());
  };
  // The pager dots (on the still background) mark the frame on screen.
  const dots = Array.from(bg.querySelectorAll<HTMLElement>('.sell-pager i'));
  // The chat messages "type" in, one after another (typing dots, then the
  // message), once the boy is half in view: frame 1 as it scrolls up into
  // view, frames 2-4 as they slide in. Going on forward they stay; going
  // back (frame 1 below the screen, frames 2-4 leaving to the right) they're
  // put back, to type again next time. (CSS does the motion: global.css.)
  const reduceBubbles = prefersReducedMotion();
  const chats = sellFrames.map((f) => Array.from(f.querySelectorAll<HTMLElement>('.bubbles .bub')));
  chats.flat().forEach((b) => {
    const d = document.createElement('span');
    d.className = 'bub__dots';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<i></i><i></i><i></i>';
    b.append(d);
    b.dataset.chat = '';
    b.style.removeProperty('opacity');
    b.style.removeProperty('visibility');
    unpin(b);
  });
  const typing = new Map<number, number[]>();
  const typeChat = (i: number) => {
    if (reduceBubbles || typing.has(i)) return;
    const timers: number[] = [];
    chats[i].forEach((b, j) => {
      const at = 150 + j * 1500;
      timers.push(window.setTimeout(() => ((b.dataset.say = ''), (b.dataset.typing = '')), at));
      timers.push(window.setTimeout(() => delete b.dataset.typing, at + 900));
    });
    typing.set(i, timers);
  };
  const untypeChat = (i: number) => {
    const timers = typing.get(i);
    if (!timers) return;
    timers.forEach(clearTimeout);
    typing.delete(i);
    chats[i].forEach((b) => {
      delete b.dataset.typing;
      delete b.dataset.say;
    });
  };
  const setFrame = (k: number) => {
    frameNow = k;
    dots.forEach((d) => (d.style.opacity = d === dots[k] ? '1' : '0'));
    chats.forEach((_, i) => {
      if (!i) return;
      if (i <= k) typeChat(i);
      else untypeChat(i);
    });
    playBoy();
  };
  setFrame(0);
  const frameSeen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const k = Number((e.target as HTMLElement).dataset.sf);
        if (e.intersectionRatio >= 0.5 && k !== frameNow) setFrame(k);
      }),
    { threshold: [0.5] },
  );
  sellFrames.forEach((f) => frameSeen.observe(f));
  // The section on screen at all (the boy only moves while it is); reset
  // frame 1's messages once it's back below the screen.
  const trackSeen = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      sellOnScreen = e.isIntersecting;
      playBoy();
      if (!e.isIntersecting && e.boundingClientRect.top > 0) untypeChat(0);
    }),
  );
  trackSeen.observe(track);
  // Frame 1's messages: when the boy is half in view.
  const boy1 = sellFrames[0].querySelector<HTMLElement>('.boy-box') ?? sellFrames[0];
  const boySeen = new IntersectionObserver((entries) => entries.forEach((e) => e.intersectionRatio >= 0.5 && frameNow === 0 && typeChat(0)), {
    threshold: [0.5],
  });
  boySeen.observe(boy1);
  observers.push(frameSeen, trackSeen, boySeen);

  // ---------- 5. FAQ without the phone ----------
  const faq = document.createElement('section');
  faq.className = 'flow-faq';
  const pick = (sel: string) => {
    const el = hero.querySelector<HTMLElement>(sel)!.cloneNode(true) as HTMLElement;
    gsap.set([el, ...Array.from(el.querySelectorAll<HTMLElement>('[style]'))], {
      clearProps: 'transform,opacity,visibility,translate',
    });
    return el;
  };
  const title = pick('.faq-title');
  title.removeAttribute('id');
  const list = pick('.faq-list');
  list.removeAttribute('data-bound');
  list.setAttribute('data-ready', '');
  list.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  const talk = pick('.faq-talk');
  // The brand pattern behind it, fading in from the top right (global.css).
  const faqPattern = hero.querySelector<HTMLElement>('.hero__bg .pattern')?.cloneNode(true) as HTMLElement | undefined;
  if (faqPattern) {
    faqPattern.classList.add('flow-faq__pattern');
    faq.append(faqPattern);
  }
  faq.append(title, list, talk);
  sec.after(faq);
  made.push(faq);

  // ---------- The girl: stays put, then turns into Hero 2's ----------
  // Hero 1's girl is held exactly where she is on screen (fixed) while the
  // page scrolls under her; Hero 2's girl comes up invisible. As soon as
  // Hero 2's text is in view, Hero 2's girl is held at the spot she'll end
  // up in once Hero 2 fills the screen, and Hero 1's girl moves and resizes
  // onto her, crossfading into her (on its own clock, straight away). When
  // Hero 2 reaches the top, its girl is let go exactly there and scrolls on.
  // Scrolling back up plays it all backwards.
  const girlA = hero.querySelector<HTMLElement>('.girl--h1');
  const girlB = hero2.querySelector<HTMLElement>('.girl--h2');
  const artA = girlA?.querySelector<HTMLElement>('.girl__art');
  let morph: gsap.core.Timeline | null = null;
  const LAYOUT = 'position,top,bottom,left,width,height,margin,zIndex';
  const fix = (el: HTMLElement, top: number, left: number, w: number, h: number) =>
    gsap.set(el, {
      position: 'fixed',
      top,
      left,
      width: w,
      height: h,
      margin: 0,
      zIndex: 6,
    });
  const holdA = () => {
    if (!girlA) return;
    gsap.set(girlA, { clearProps: LAYOUT });
    // Her spot with the page at the top (layout only: no animation offsets),
    // held from the BOTTOM of the screen: when a phone's address bar slides
    // away at the top the screen's top edge moves but its bottom doesn't, so
    // she stays exactly where she is. (Measured against the screen height
    // with the bar showing, the hero stage, so at the very top she still
    // sits on her spot in the hero.)
    const stageH = hero.querySelector<HTMLElement>('.hero__stage')?.offsetHeight ?? window.innerHeight;
    const h = girlA.offsetHeight;
    fix(girlA, pageTop(girlA), offsetX(girlA), girlA.offsetWidth, h);
    gsap.set(girlA, { top: 'auto', bottom: stageH - pageTop(girlA) - h });
  };
  // Hero 2's girl, held where she sits once Hero 2 fills the screen.
  const holdB = (on: boolean) => {
    if (!girlB) return;
    gsap.set(girlB, { clearProps: LAYOUT });
    if (on) fix(girlB, pageTop(girlB) - pageTop(hero2), offsetX(girlB), girlB.offsetWidth, girlB.offsetHeight);
  };
  if (girlA && girlB && artA) {
    holdA();
    ScrollTrigger.addEventListener('refreshInit', holdA);
    gsap.set(girlB, { autoAlpha: 0 });
    const play = () => {
      if (morph) {
        morph.eventCallback('onReverseComplete', null);
        morph.play();
        return;
      }
      if (prefersReducedMotion()) {
        gsap.set(artA, { autoAlpha: 0 });
        gsap.set(girlB, { autoAlpha: 1 });
        return;
      }
      const a = girlA.getBoundingClientRect();
      const b = girlB.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const k = b.height / a.height;
      morph = gsap
        .timeline()
        .fromTo(
          artA,
          { x: 0, y: 0, scale: 1 },
          {
            x: dx,
            y: dy,
            scale: k,
            transformOrigin: '50% 50%',
            duration: 0.7,
            ease: 'power3.inOut',
          },
          0,
        )
        .fromTo(artA, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0.25)
        .fromTo(girlB, { x: -dx, y: -dy, scale: 1 / k, transformOrigin: '50% 50%' }, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut' }, 0)
        .fromTo(girlB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0.25);
    };
    // Backwards: Hero 2's girl stays held until she has turned back into
    // Hero 1's girl (letting her go first made her vanish for a moment).
    const back = () => {
      if (morph) {
        morph.eventCallback('onReverseComplete', () => holdB(false));
        morph.reverse();
      } else {
        gsap.set(artA, { autoAlpha: 1 });
        gsap.set(girlB, { autoAlpha: 0 });
        holdB(false);
      }
    };
    // A new layout: measure the morph again next time.
    ScrollTrigger.addEventListener('refreshInit', () => {
      morph?.kill();
      morph = null;
    });
    const copy2 = hero2.querySelector('.copy--h2') ?? hero2;
    triggers.push(
      ScrollTrigger.create({
        trigger: copy2,
        start: 'top 75%', // Hero 2's text is coming into view
        endTrigger: hero2,
        end: 'top top', // Hero 2 fills the screen
        onEnter: () => {
          holdB(true);
          play();
        },
        onLeave: () => holdB(false),
        onEnterBack: () => holdB(true),
        onLeaveBack: back,
      }),
    );
  }

  // ---------- In, for every element ----------
  // Each element has its own entrance: once it's a little way up the screen
  // it rises (or slides / pops) in. Scrolling on down past it, it simply
  // scrolls away (no exit), so coming back up it's already there; it's put
  // back only once it has gone below the screen, to come in again next time.
  // Native: an IntersectionObserver sets data-in, CSS transitions do the
  // motion (global.css, [data-fx]). (Hero 1 is brought in by the intro.)
  const reduce = prefersReducedMotion();
  const scope = [hero2, timeline, bg, ...sellFrames, sec, faq];
  const items: HTMLElement[] = [];
  const band = timeline.querySelector<HTMLElement>('.flow-tl__band');
  // Which element starts each item's entrance: the sellers' section and its
  // background come in as one group, the buyers' heading band as one.
  const groupOf = (el: HTMLElement) => (sell.contains(el) ? track : band?.contains(el) ? band : el);
  const groups = new Map<HTMLElement, HTMLElement[]>();
  if (!reduce) {
    scope.forEach((root) => {
      const els = [root, ...Array.from(root.querySelectorAll<HTMLElement>(ENTER_ALL_IN))].filter(
        (el) => el.matches(ENTER_ALL_IN) && getComputedStyle(el).visibility !== 'hidden',
      );
      els.forEach((el) => {
        if (items.includes(el)) return;
        if (el.matches('.chip')) return; // the chips follow the phone (below)
        if (hero2.contains(el) && el.matches('.shape-box, .sell-shape')) return; // (Hero 2's dark shape just scrolls in)
        if (el.matches('.bubbles .bub') && sell.contains(el)) return; // (typed in with the boy, above)
        // Fold the frame's own offsets into the layout and drop the copy's
        // inline opacity, so the CSS entrance owns them.
        const x = Number(gsap.getProperty(el, 'x')) || 0;
        const y = Number(gsap.getProperty(el, 'y')) || 0;
        if (x) el.style.marginLeft = `${(parseFloat(el.style.marginLeft) || 0) + x}px`;
        if (y) el.style.marginTop = `${(parseFloat(el.style.marginTop) || 0) + y}px`;
        if (x || y) gsap.set(el, { x: 0, y: 0 });
        el.style.removeProperty('opacity');
        el.style.removeProperty('visibility');
        // GSAP leaves inline translate/scale/rotate: none on what it has
        // moved; they'd override the CSS entrance's own translate/scale.
        const canSlide = unpin(el);
        // Where it comes from, as CSS variables (see ENTER_IN).
        const from = ENTER_IN.find(([sel]) => el.matches(sel))![1];
        const n = items.length;
        el.dataset.fx = '';
        if (from.x !== undefined) el.style.setProperty('--fx-x', `${from.x}px`);
        if (from.xPercent !== undefined) el.style.setProperty('--fx-x', `${from.xPercent}%`);
        if (from.y !== undefined) el.style.setProperty('--fx-y', `${from.y}px`);
        if (from.scale !== undefined) el.style.setProperty('--fx-s', String(from.scale));
        if (from.autoAlpha === 1) el.style.setProperty('--fx-o', '1'); // glides in without fading
        el.style.setProperty('--fx-d', `${(n % 4) * 0.06}s`); // small stagger between neighbours
        if (el.matches('.shape-box, .sell-shape')) el.dataset.fx = 'shape';
        if (el.matches('.flow-tl__num')) el.dataset.fx = 'pop';
        if (!canSlide) {
          // (can't slide: fades and grows in instead)
          el.style.removeProperty('--fx-x');
          el.style.removeProperty('--fx-y');
          el.style.setProperty('--fx-s', '0.9');
          el.dataset.fx = 'pop';
        }
        items.push(el);
        const g = groupOf(el);
        groups.set(g, [...(groups.get(g) ?? []), el]);
      });
    });
  }
  // Put back (or in) with no transition, e.g. off screen or after a reload.
  const snap = (els: HTMLElement[], on: boolean) => {
    els.forEach((el) => {
      el.dataset.snap = '';
      if (on) el.dataset.in = '';
      else delete el.dataset.in;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => delete el.dataset.snap)));
  };
  // In: once the group's top is 14% up from the bottom of the screen (the
  // heading band: once 15% of it is in view).
  const inSeen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const els = groups.get(e.target as HTMLElement) ?? [];
        if (e.isIntersecting) els.forEach((el) => (el.dataset.in = ''));
        else if (e.boundingClientRect.bottom < 0) snap(els, true); // (already scrolled past, e.g. a reload here)
      }),
    { rootMargin: '0px 0px -14% 0px' },
  );
  const bandSeen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const els = groups.get(e.target as HTMLElement) ?? [];
        if (e.intersectionRatio >= 0.15) els.forEach((el) => (el.dataset.in = ''));
        else if (e.boundingClientRect.bottom < 0) snap(els, true);
      }),
    { threshold: [0, 0.15] },
  );
  // Reset: once it has gone below the screen.
  const outSeen = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting && e.boundingClientRect.top > 0) snap(groups.get(e.target as HTMLElement) ?? [], false);
    }),
  );
  groups.forEach((_, g) => {
    (g === band ? bandSeen : inSeen).observe(g);
    outSeen.observe(g);
  });
  observers.push(inSeen, bandSeen, outSeen);

  // ---------- Scroll-tied effects ----------
  // - Hero 1's Vox bag chip fades away the moment the page starts to pull it
  //   away from her (held) phone; Hero 2's fades in as it comes up to the
  //   phone.
  // - The buyers' timeline line draws itself down, a step at a time.
  // Native: scroll-driven CSS animations on the page scroll (global.css);
  // this only works out where on the page each one runs (setRanges). Older
  // browsers get the same from GSAP, driven by the scroll.
  const chip1 = hero.querySelector<HTMLElement>('.scene--h1 .chip');
  const chip2 = hero2.querySelector<HTMLElement>('.scene--h2 .chip');
  const segs = Array.from(timeline.querySelectorAll<HTMLElement>('.flow-tl__seg'));
  const range = (el: HTMLElement | null | undefined, a: number, b: number) => {
    if (!el) return;
    el.style.setProperty('--sr-a', `${Math.round(a)}px`);
    el.style.setProperty('--sr-b', `${Math.round(Math.max(b, a + 1))}px`);
  };
  const setRanges = () => {
    const ih = window.innerHeight;
    const t = pageTop(track);
    range(sell, t, t + ih * (sellFrames.length - 1)); // (the frames read it from here)
    range(chip1, 0, 70);
    range(chip2, pageTop(hero2) - ih * 0.16, pageTop(hero2));
    segs.forEach((seg) => range(seg, pageTop(seg) - ih * 0.7, pageTop(seg) + seg.offsetHeight - ih * 0.55));
  };
  if (NATIVE_SCROLL_FX) {
    if (!reduce) {
      chip1?.setAttribute('data-sfx', 'chip-out');
      chip2?.setAttribute('data-sfx', 'chip-in');
      segs.forEach((seg) => seg.setAttribute('data-sfx', 'draw'));
    }
    setRanges();
    ScrollTrigger.addEventListener('refresh', setRanges);
  } else if (!reduce) {
    if (chip1)
      triggers.push(
        ScrollTrigger.create({ start: 0, end: 70, scrub: 0.2, animation: gsap.fromTo(chip1, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, ease: 'power1.in', immediateRender: false }) }),
      );
    if (chip2)
      triggers.push(
        ScrollTrigger.create({ trigger: hero2, start: 'top 16%', end: 'top top', scrub: 0.2, animation: gsap.fromTo(chip2, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'power1.out' }) }),
      );
    segs.forEach((seg) =>
      triggers.push(ScrollTrigger.create({ trigger: seg, start: 'top 70%', end: 'bottom 55%', scrub: 0.3, animation: gsap.fromTo(seg, { scaleY: 0 }, { scaleY: 1, ease: 'none' }) })),
    );
  }

  // ---------- Positions of the story frames, and the header ----------
  const steps = Array.from(timeline.querySelectorAll<HTMLElement>('.flow-tl__step'));
  const tops = () => {
    const ih = window.innerHeight;
    const t0 = pageTop(timeline);
    const tt = pageTop(track);
    return [
      pageTop(hero),
      pageTop(hero2),
      t0,
      Math.max(t0 + 1, pageTop(steps[1]) - Math.round(ih * 0.3)),
      Math.max(t0 + 2, pageTop(steps[2]) - Math.round(ih * 0.3)),
      // (the seller frames: one screen of the held scroll each)
      ...sellFrames.map((_, k) => Math.round(tt + k * ih)),
      pageTop(sec),
      pageTop(faq),
    ];
  };
  // The header takes the look of the section under a line 40% down the
  // screen (IntersectionObserver, no scroll listener).
  const hdrOf = new Map<HTMLElement, string>([
    [hero, hdr[0]],
    [hero2, hdr[1]],
    [timeline, hdr[2]],
    [track, hdr[5]],
    [sec, hdr[9]],
    [faq, hdr[10]],
  ]);
  const hdrSeen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) header.dataset.hdr = hdrOf.get(e.target as HTMLElement) ?? 'hiw';
      }),
    { rootMargin: '-40% 0px -60% 0px' },
  );
  hdrOf.forEach((_, el) => hdrSeen.observe(el));
  observers.push(hdrSeen);
  ScrollTrigger.refresh();

  return {
    tops,
    cleanup: () => {
      observers.forEach((o) => o.disconnect());
      triggers.forEach((t) => t.kill(true));
      ScrollTrigger.removeEventListener('refresh', setRanges);
      ScrollTrigger.removeEventListener('refreshInit', sizeTrack);
      ScrollTrigger.removeEventListener('refreshInit', holdA);
      items.forEach((el) => {
        delete el.dataset.fx;
        delete el.dataset.in;
      });
      boyLoops.flat().forEach((a) => a.kill());
      typing.forEach((timers) => timers.forEach(clearTimeout));
      made.forEach((n) => n.remove());
      timeline.hidden = true;
      tlHome.parent.insertBefore(timeline, tlHome.next);
      morph?.kill();
      const props = 'position,top,bottom,left,width,height,margin,x,y,scale,opacity,visibility,zIndex';
      if (girlA) gsap.set([girlA, artA], { clearProps: props });
      if (girlB) gsap.set(girlB, { clearProps: props });
      chip1?.removeAttribute('data-sfx');
      delete html.dataset.flow;
    },
  };
}

/** Drop the inline translate / scale / rotate GSAP leaves on elements it
 *  has moved (set to none), so CSS can use those properties. */
function unpin(el: HTMLElement): boolean {
  ['translate', 'scale', 'rotate'].forEach((p) => el.style.removeProperty(p));
  // An element with a translate of its own in the stylesheet (e.g. a button
  // centred with -50%) already has it folded into its position by GSAP: keep
  // it switched off, and tell the caller it can't slide (it grows in).
  if (getComputedStyle(el).translate !== 'none') {
    el.style.translate = 'none';
    return false;
  }
  return true;
}

/** Top of an element on the page (ignoring any pin in progress: layout-based). */
function pageTop(el: HTMLElement): number {
  let t = 0;
  let n: HTMLElement | null = el;
  while (n) {
    t += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return t;
}

/** Left offset of an element within its hero section. */
function offsetX(el: HTMLElement): number {
  let x = 0;
  let n: HTMLElement | null = el;
  while (n && !n.classList.contains('hero')) {
    x += n.offsetLeft;
    n = n.offsetParent as HTMLElement | null;
  }
  return x;
}

/** A copy of the stage as it looks now, without what's hidden. */
function snapshot(hero: HTMLElement): HTMLElement {
  const copy = hero.cloneNode(true) as HTMLElement;
  // Drop what isn't visible in this frame (same tree, walked side by side).
  const prune = (orig: Element, cp: Element) => {
    const cc = Array.from(cp.children);
    Array.from(orig.children).forEach((o, i) => {
      const c = cc[i];
      if (!c) return;
      if (o.classList.contains('faq-item')) return; // (questions open and close)
      if (o.classList.contains('girl__part')) return; // (her blink and typing overlays: hidden between blinks)
      if (o.hasAttribute('data-part')) return; // (the boy's parts: his eyes are hidden between blinks)
      if (o.classList.contains('sell-pager')) return; // (all four dots, faint or filled)
      const cs = getComputedStyle(o);
      if (cs.display === 'none' || cs.opacity === '0') c.remove();
      else prune(o, c);
    });
  };
  prune(hero, copy);
  copy.querySelectorAll('.intro-cover, .intro-logo').forEach((n) => n.remove());
  // Flat, sharp pictures: the story turns the phone in 3D (it flips round as
  // it grows out of the boy's hand); a copy left with that 3D transform is
  // drawn as a softened 3D layer. Keep the move and size, drop the 3D.
  copy.querySelectorAll<HTMLElement>('[style*="matrix3d"], [style*="perspective"], [style*="rotateY"], [style*="translate3d"]').forEach((el) =>
    gsap.set(el, { rotationX: 0, rotationY: 0, z: 0, transformPerspective: 0, force3D: false }),
  );
  // One of each id/nav anchor on the page: the copies are pictures of frames.
  // (SVG ids stay: the copies' shapes and patterns point at the hero's.)
  [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('[id], [data-nav], [aria-labelledby]'))].forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.removeAttribute('id');
    el.removeAttribute('data-nav');
    el.removeAttribute('data-label');
    el.removeAttribute('aria-labelledby');
  });
  copy.classList.add('hero--frame');
  return copy;
}
