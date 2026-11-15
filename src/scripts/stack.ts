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
  ['.flow-tl__shape', { xPercent: 100, autoAlpha: 1 }],
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

export type Stack = {
  /** Scroll position (page px) of each story frame 0..STORY_END. */
  tops: () => number[];
  cleanup: () => void;
};

export function buildStack(hero: HTMLElement, tl: gsap.core.Timeline, header: HTMLElement): Stack {
  const html = document.documentElement;
  const triggers: ScrollTrigger[] = [];
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
  timeline.after(sell);
  made.push(sell);
  const sellFrames = Array.from(sell.querySelectorAll<HTMLElement>('.flow-sell__frame'));

  // ---------- 4. Security ----------
  const sec = shots.get(9)!;
  // (Join waitlist stays, under the subtitle; .sec-cta is desktop's.)
  sec.querySelectorAll('.sec-cta').forEach((n) => n.remove());
  sell.after(sec);
  made.push(sec);

  // The sellers' sideways scroll (one screen of scrolling per change) and the
  // boy's idle life on whichever frame is showing.
  const across = gsap.timeline({ paused: true });
  sellFrames.forEach((f, k) => k && gsap.set(f, { xPercent: 100, autoAlpha: 0 }));
  for (let k = 0; k < sellFrames.length - 1; k++) {
    across
      .to(sellFrames[k], { xPercent: -100, autoAlpha: 0, duration: 0.7, ease: 'power1.inOut' }, k + 0.15)
      .to(sellFrames[k + 1], { xPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, k + 0.15);
  }
  across.to({}, { duration: 0.15 }, sellFrames.length - 1 - 0.15); // (whole screens)
  const boyLoops = prefersReducedMotion() ? [] : sellFrames.map((f) => boyIdle(f).flat());
  let shownBoy = -1;
  let sellOnScreen = false;
  const playBoy = (k: number) => {
    const want = sellOnScreen ? k : -1;
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
  // put back, to type again next time.
  const reduceBubbles = prefersReducedMotion();
  const chats = sellFrames.map((f) => Array.from(f.querySelectorAll<HTMLElement>('.bubbles .bub')));
  chats.flat().forEach((b) => {
    const d = document.createElement('span');
    d.className = 'bub__dots';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<i></i><i></i><i></i>';
    b.append(d);
    if (!reduceBubbles) gsap.set(b, { autoAlpha: 0, scale: 0.85, transformOrigin: '100% 100%' });
  });
  const typing = new Map<number, gsap.core.Timeline>();
  const typeChat = (i: number) => {
    if (reduceBubbles || typing.has(i)) return;
    const tl = gsap.timeline();
    chats[i].forEach((b, j) => {
      const at = 0.15 + j * 1.5;
      tl.call(() => void (b.dataset.typing = ''), [], at)
        .fromTo(b, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)', immediateRender: false }, at)
        .call(() => void delete b.dataset.typing, [], at + 0.9);
    });
    typing.set(i, tl);
  };
  const untypeChat = (i: number) => {
    const tl = typing.get(i);
    if (!tl) return;
    tl.kill();
    typing.delete(i);
    chats[i].forEach((b) => {
      delete b.dataset.typing;
      gsap.set(b, { autoAlpha: 0, scale: 0.85 });
    });
  };
  // Frame 1: when the boy is half in view, on the way down; reset once below.
  const boy1 = sellFrames[0].querySelector<HTMLElement>('.boy-box') ?? sellFrames[0];
  // (Also when the page opens or re-measures already past that point, e.g. a
  // reload that resumes here: the messages still type in.)
  triggers.push(
    ScrollTrigger.create({ trigger: boy1, start: 'center bottom', onEnter: () => typeChat(0), onRefresh: (self) => void (self.progress > 0 && typeChat(0)) }),
  );
  triggers.push(ScrollTrigger.create({ trigger: sell, start: 'top bottom', onLeaveBack: () => untypeChat(0) }));
  let frameNow = -1;
  const showFrame = (k: number) => {
    if (k === frameNow) return;
    frameNow = k;
    dots.forEach((d, i) => gsap.set(d, { opacity: i === k ? 1 : 0 }));
    // (A frame counts as arrived once it's halfway in: the boy half in view.)
    chats.forEach((_, i) => {
      if (!i) return;
      if (i <= k) typeChat(i);
      else untypeChat(i);
    });
  };
  const sellPin = ScrollTrigger.create({
    trigger: sell,
    start: 'top top',
    end: () => `+=${window.innerHeight * (sellFrames.length - 1)}`,
    pin: true,
    // Phones scroll on their own momentum: switch to "held" a moment early,
    // so the section settles into place as it reaches the top instead of
    // overshooting and jumping back.
    anticipatePin: 1,
    scrub: 0.3,
    animation: across,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const k = Math.round(self.progress * (sellFrames.length - 1));
      playBoy(k);
      showFrame(k);
    },
    onRefresh: (self) => showFrame(Math.round(self.progress * (sellFrames.length - 1))),
  });
  triggers.push(sellPin);
  showFrame(0);
  triggers.push(
    ScrollTrigger.create({
      trigger: sell,
      start: 'top bottom',
      // on screen from rising in, through the pinned stretch, until it has
      // scrolled away at the top
      end: () => `+=${window.innerHeight * sellFrames.length + sell.offsetHeight}`,
      onToggle: (self) => {
        sellOnScreen = self.isActive;
        playBoy(Math.round(sellPin.progress * (sellFrames.length - 1)));
      },
    }),
  );

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
  const LAYOUT = 'position,top,left,width,height,margin,zIndex';
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
    // Her spot with the page at the top (layout only: no animation offsets).
    fix(girlA, pageTop(girlA), offsetX(girlA), girlA.offsetWidth, girlA.offsetHeight);
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

  // ---------- In and out, for every element ----------
  // Each element has its own: coming up from the bottom of the screen it
  // rises (or slides / pops) in; passing up under the top bar it slides up
  // and fades out. Scrolling back plays them the other way. Every time.
  const reduce = prefersReducedMotion();
  const scope = [hero.querySelector('.copy--h1'), hero2, timeline, bg, ...sellFrames, sec, faq].filter(Boolean) as HTMLElement[];
  const items: { el: HTMLElement; from: gsap.TweenVars }[] = [];
  const band = timeline.querySelector<HTMLElement>('.flow-tl__band');
  if (!reduce) {
    scope.forEach((root) => {
      const els = [root, ...Array.from(root.querySelectorAll<HTMLElement>(ENTER_ALL_IN))].filter(
        (el) => el.matches(ENTER_ALL_IN) && getComputedStyle(el).visibility !== 'hidden',
      );
      els.forEach((el) => {
        if (items.some((it) => it.el === el)) return;
        if (el.matches('.chip')) return; // the chips follow the phone (below)
        if (el.hasAttribute('data-join')) return; // (pops in after the last message, below)
        if (el.matches('.bubbles .bub') && sell.contains(el)) return; // (typed in with the boy, below)
        // Fold the frame's own offsets into the layout, so these effects can
        // own the element's x/y.
        const x = Number(gsap.getProperty(el, 'x')) || 0;
        const y = Number(gsap.getProperty(el, 'y')) || 0;
        if (x) el.style.marginLeft = `${(parseFloat(el.style.marginLeft) || 0) + x}px`;
        if (y) el.style.marginTop = `${(parseFloat(el.style.marginTop) || 0) + y}px`;
        if (x || y) gsap.set(el, { x: 0, y: 0 });
        items.push({ el, from: ENTER_IN.find(([sel]) => el.matches(sel))![1] });
      });
    });
  }
  const isShape = (el: HTMLElement) => el.matches('.shape-box, .sell-shape');
  const show = (el: HTMLElement) =>
    gsap.to(el, {
      x: 0,
      xPercent: 0,
      y: 0,
      scale: 1,
      autoAlpha: 1,
      // long enough to see; the big shapes take their time
      duration: isShape(el) ? 1.1 : 0.85,
      ease: isShape(el) ? 'power3.inOut' : el.matches('.flow-tl__num') ? 'back.out(2.2)' : 'power3.out',
      overwrite: true,
    });
  items.forEach(({ el, from }, n) => {
    // Small stagger between neighbours entering together.
    const delay = (n % 4) * 0.06;
    // (The sellers' section and its background come and go as one group, and
    // the buyers' heading band as one: heading and shape start together once
    // the band is about 15% in view.)
    const trig = sell.contains(el) ? sell : band?.contains(el) ? band : el;
    const hidden = () => gsap.set(el, { x: 0, xPercent: 0, y: 0, scale: 1, autoAlpha: 0, ...from });
    // In: once it's a little way up the screen. Scrolling on down past it, it
    // simply scrolls away (no exit), so coming back up it's already there.
    triggers.push(
      ScrollTrigger.create({
        trigger: trig,
        start: band?.contains(el) ? () => `top bottom-=${Math.round(band.offsetHeight * 0.15)}` : 'top 86%',
        onEnter: () => gsap.delayedCall(delay, () => show(el)),
        onRefresh: (self) => {
          // Start in the right state for where the page is (the loading
          // intro brings Hero 1's pieces in itself).
          if (html.classList.contains('loading') && hero.contains(el) && self.progress > 0) return;
          if (self.progress > 0) gsap.set(el, { x: 0, xPercent: 0, y: 0, scale: 1, autoAlpha: 1 });
          else hidden();
        },
      }),
    );
    // Reset: only once it has gone below the screen (scrolled back up above
    // it), ready to come in again next time.
    triggers.push(
      ScrollTrigger.create({
        trigger: trig,
        start: 'top bottom',
        onLeaveBack: () => {
          gsap.killTweensOf(el);
          hidden();
        },
      }),
    );
  });

  // ---------- The Vox bag chips follow the phone ----------
  // Hero 1's chip sits by her phone, but the page scrolls it away from the
  // held girl: it fades out the moment it starts to leave. Hero 2's chip
  // fades in as it comes up close to the (held) phone. Both with the scroll.
  if (!reduce) {
    const chip1 = hero.querySelector<HTMLElement>('.scene--h1 .chip');
    const chip2 = hero2.querySelector<HTMLElement>('.scene--h2 .chip');
    if (chip1) {
      triggers.push(
        ScrollTrigger.create({
          start: 0,
          end: 70,
          scrub: 0.2,
          animation: gsap.fromTo(chip1, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, ease: 'power1.in', immediateRender: false }),
        }),
      );
    }
    if (chip2) {
      triggers.push(
        ScrollTrigger.create({
          trigger: hero2,
          start: 'top 16%',
          end: 'top top',
          scrub: 0.2,
          animation: gsap.fromTo(chip2, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'power1.out' }),
        }),
      );
    }
  }

  // The timeline's line draws itself down, a step at a time, as you scroll.
  if (!reduce) {
    timeline.querySelectorAll<HTMLElement>('.flow-tl__seg').forEach((seg) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: seg,
          start: 'top 70%',
          end: 'bottom 55%',
          scrub: 0.3,
          animation: gsap.fromTo(seg, { scaleY: 0 }, { scaleY: 1, ease: 'none' }),
        }),
      );
    });
  }

  // Each step's chat bubble "types" in: dots for a moment, then the message.
  // It types again whenever it comes back into view.
  if (!reduce) timeline.querySelectorAll<HTMLElement>('[data-join]').forEach((j) => gsap.set(j, { autoAlpha: 0, transformOrigin: '0% 100%' }));
  timeline.querySelectorAll<HTMLElement>('[data-type]').forEach((bubble) => {
    if (reduce) return void (bubble.dataset.typed = '');
    let timer = 0;
    let wait = 0;
    // A step's second message types once the first has been sent.
    const after = bubble.hasAttribute('data-type-delay') ? 1250 : 0;
    const type = () => {
      clearTimeout(timer);
      clearTimeout(wait);
      delete bubble.dataset.typed;
      delete bubble.dataset.typing;
      wait = window.setTimeout(() => {
        bubble.dataset.typing = '';
        timer = window.setTimeout(() => {
          delete bubble.dataset.typing;
          bubble.dataset.typed = '';
          const msg = bubble.querySelector('.flow-tl__msg');
          if (msg) gsap.fromTo(msg, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' });
          // The last message sent: Join waitlist pops in right under it.
          const join = bubble.nextElementSibling as HTMLElement | null;
          if (join?.hasAttribute('data-join')) gsap.fromTo(join, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)', delay: 0.2 });
        }, 900);
      }, after);
    };
    const reset = () => {
      clearTimeout(timer);
      clearTimeout(wait);
      delete bubble.dataset.typing;
      delete bubble.dataset.typed;
      const join = bubble.nextElementSibling as HTMLElement | null;
      if (join?.hasAttribute('data-join')) {
        gsap.killTweensOf(join);
        gsap.set(join, { autoAlpha: 0 });
      }
    };
    // Types once on the way down; it's put back only once it has gone below
    // the screen (so scrolling back up past it never replays it).
    triggers.push(ScrollTrigger.create({ trigger: bubble, start: 'top 88%', onEnter: () => bubble.hasAttribute('data-typed') || type() }));
    triggers.push(ScrollTrigger.create({ trigger: bubble, start: 'top bottom', onLeaveBack: reset }));
  });

  // ---------- Positions of the story frames, and the header ----------
  const steps = Array.from(timeline.querySelectorAll<HTMLElement>('.flow-tl__step'));
  const tops = () => {
    const ih = window.innerHeight;
    const t0 = pageTop(timeline);
    return [
      pageTop(hero),
      pageTop(hero2),
      t0,
      Math.max(t0 + 1, pageTop(steps[1]) - Math.round(ih * 0.3)),
      Math.max(t0 + 2, pageTop(steps[2]) - Math.round(ih * 0.3)),
      // (the seller frames: one screen of the pinned scroll each)
      ...sellFrames.map((_, k) => Math.round(sellPin.start + k * window.innerHeight)),
      pageTop(sec),
      pageTop(faq),
    ];
  };
  let current = -1;
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * 0.4;
    let k = 0;
    tops().forEach((t, i) => {
      if (y >= t) k = i;
    });
    if (k === current) return;
    current = k;
    header.dataset.hdr = hdr[k];
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  ScrollTrigger.refresh();

  return {
    tops,
    cleanup: () => {
      window.removeEventListener('scroll', onScroll);
      triggers.forEach((t) => t.kill(true));
      gsap.killTweensOf(items.map((it) => it.el));
      gsap.set(
        items.map((it) => it.el),
        { clearProps: 'x,y,scale,opacity,visibility' },
      );
      boyLoops.flat().forEach((a) => a.kill());
      typing.forEach((t) => t.kill());
      made.forEach((n) => n.remove());
      timeline.hidden = true;
      tlHome.parent.insertBefore(timeline, tlHome.next);
      ScrollTrigger.removeEventListener('refreshInit', holdGirl);
      morph?.kill();
      if (girlA)
        gsap.set([girlA, artA], {
          clearProps: 'position,top,left,width,height,margin,x,y,scale,opacity,visibility,zIndex',
        });
      if (girlB)
        gsap.set(girlB, {
          clearProps: 'position,top,left,width,height,margin,x,y,scale,opacity,visibility,zIndex',
        });
      delete html.dataset.flow;
    },
  };
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
