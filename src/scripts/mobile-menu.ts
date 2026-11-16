import { T } from '../data/hiw';
import { MQ_MOBILE } from './env';
import { storyY } from './hero';
import { scrollToY } from './smooth';

/**
 * Phones: the top bar and its menu (styles in SiteNav.astro).
 * - html[data-float]: scrolled down a little, the flat bar becomes a pill.
 * - html[data-menu]: the menu is open (the bar squeezes into a circle round
 *   the ✕ and the panel slides in from the right). The ✕, Escape or any
 *   link closes it; story links glide to their part of the page.
 */
export function initMobileMenu(): void {
  const html = document.documentElement;
  const btn = document.querySelector<HTMLButtonElement>('.hdr-menu');
  const panel = document.querySelector<HTMLElement>('.m-menu');
  if (!btn || !panel) return;
  const mobile = () => window.matchMedia(MQ_MOBILE).matches;

  // ---------- Flat at the top, a pill once scrolled ----------
  // Native: an IntersectionObserver watches an invisible 24px marker at the
  // very top of the page; once it has scrolled out of view, the bar floats.
  const marker = document.createElement('div');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;visibility:hidden';
  document.body.prepend(marker);
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) delete html.dataset.float;
    else html.dataset.float = '';
  }).observe(marker);

  // ---------- Open / close ----------
  let hideTimer = 0;
  const open = () => {
    if (!mobile()) return;
    clearTimeout(hideTimer);
    panel.hidden = false;
    void panel.offsetWidth; // (start the slide from off screen)
    html.dataset.menu = '';
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
  };
  const close = () => {
    if (!html.hasAttribute('data-menu')) return;
    delete html.dataset.menu;
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    hideTimer = window.setTimeout(() => (panel.hidden = true), 520); // after the slide out
  };
  btn.addEventListener('click', () => (html.hasAttribute('data-menu') ? close() : open()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  window.matchMedia(MQ_MOBILE).addEventListener('change', () => !mobile() && close());


  // ---------- Links ----------
  panel.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    if (t === panel) return close(); // a tap on the dimmed page
    const a = t?.closest<HTMLAnchorElement>('a');
    if (!a) return;
    if (a.hasAttribute('data-waitlist')) return close(); // the waitlist opens over it
    const frame = a.dataset.menuFrame as keyof typeof T | 'home' | undefined;
    if (frame) {
      // A part of this page: close, then glide there.
      e.preventDefault();
      close();
      const y = frame === 'home' ? 0 : storyY(T[frame]);
      setTimeout(() => scrollToY(y), 380);
      return;
    }
    close(); // another page: the page change takes over
  });
}
