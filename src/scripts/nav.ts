import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MQ_MOBILE, isMobileLayout, prefersReducedMotion, unit } from './env';
import { goToFrame } from './frames';
import { storyY } from './hero';
import { T } from '../data/hiw';
import { toggleTheme } from './theme';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section navigation: highlights the current section on the rail / mobile pill,
 * updates the header label, keeps the active icon in view in the pill, and
 * scrolls to a section when its icon is tapped.
 */
export function initNav() {
  const label = document.querySelector<HTMLElement>('.section-label__text');
  const list = document.querySelector<HTMLElement>('.rail__list');
  const buttons = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-target]'));
  let current = 'home';

  // The label fades out, changes, and fades back in. It tracks the text it is
  // heading to (not what's showing), so quick back-and-forth scrolling always
  // ends on the right section's name.
  let labelTarget = label?.textContent ?? '';
  const setLabel = (text: string) => {
    if (!label || text === labelTarget) return;
    labelTarget = text;
    if (prefersReducedMotion()) {
      label.textContent = text;
      return;
    }
    // The old name slides up and fades out; the new one slides up into place.
    gsap.to(label, {
      autoAlpha: 0,
      y: -14,
      duration: 0.22,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        label.textContent = labelTarget;
        gsap.fromTo(label, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power3.out', overwrite: true });
      },
    });
  };

  const revealInPill = (btn: HTMLElement, instant = false) => {
    if (!list || !isMobileLayout()) return;
    const li = btn.parentElement as HTMLElement;
    // Bring the item into the "active slot", level with the section label.
    const activeTop = parseFloat(getComputedStyle(list).paddingTop) || 27 * unit();
    list.scrollTo({ top: Math.max(0, li.offsetTop - activeTop), behavior: instant || prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const activeButton = () => buttons.find((b) => b.dataset.navTarget === current);

  // The day/night toggle sits above Home in the pill, so start with the
  // current section (not the toggle) in the active slot.
  const settlePill = () => {
    const b = activeButton();
    if (b) revealInPill(b, true);
  };
  settlePill();
  window.matchMedia(MQ_MOBILE).addEventListener('change', settlePill);

  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((t) => {
    t.addEventListener('click', () => {
      toggleTheme();
      // Mobile: once the theme has switched, the strip slides back to the
      // current section's icon.
      const b = activeButton();
      if (b) setTimeout(() => revealInPill(b), 350);
    });
  });

  let currentLabel = '';
  const setActive = (id: string, text: string) => {
    // How it works has two parts (buyers, sellers) under one rail icon, so the
    // label can change while the section stays the same.
    if (id === current && text === currentLabel) return;
    currentLabel = text;
    if (id === current) return setLabel(text);
    current = id;
    buttons.forEach((b) => {
      const on = b.dataset.navTarget === id;
      if (on) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
      if (on) revealInPill(b);
    });
    setLabel(text);
    const caret = buttons.find((b) => b.dataset.navTarget === 'footer');
    caret?.setAttribute('aria-label', id === 'footer' ? 'Back to top' : 'Go to the end');
  };

  // Which section is on screen. Hero and How it works share one pinned
  // stage, so their starts come from the story timeline; other sections
  // start when their top passes mid-screen. The last section started wins.
  const sections = sectionStarts();
  const pick = () => {
    const y = window.scrollY;
    let on = sections[0];
    sections.forEach((s) => {
      if (y >= s.start()) on = s;
    });
    if (on) setActive(on.id, on.label);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pick, onRefresh: pick });

  // Tapping a section doesn't scroll through the scroll animations (that
  // looks wrong): it jumps to the section's first frame and plays that
  // frame's own entrance (frames.ts).
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.navTarget!;
      if (id === 'contact') return; // a real page: let the link go to /contact
      e.preventDefault();
      if (id === current && id !== 'home' && id !== 'footer') return;
      // On the footer the caret points up and takes you back home.
      if (id === 'footer' && current === 'footer') return goToFrame('home');
      if (id === 'home' && window.scrollY <= 0) return;
      goToFrame(id);
    });
  });
}

/** Nav sections in story order, each with the scroll position where it starts. */
export function sectionStarts(): { id: string; label: string; start: () => number }[] {
  const list: { id: string; label: string; start: () => number }[] = [
    { id: 'home', label: 'Home', start: () => 0 },
    // How it works takes over as Hero 2 turns into it: first for buyers, then
    // for sellers (same rail icon, its own label).
    { id: 'how-it-works', label: 'Are you a buyer?', start: () => storyY(T.hero2 + 0.4) },
    { id: 'how-it-works', label: 'Are you a seller?', start: () => storyY(T.step3 + 0.3) },
    // Security shares the "?" icon with FAQ.
    { id: 'faq', label: 'Security', start: () => storyY(T.sell4 + 0.3) },
    { id: 'faq', label: 'FAQ', start: () => storyY(T.secure + 0.3) },
  ];
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
    if (el.id === 'home') return;
    list.push({
      id: el.dataset.nav!,
      label: el.dataset.label ?? '',
      start: () => el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5,
    });
  });
  return list;
}
