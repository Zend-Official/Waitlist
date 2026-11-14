/**
 * Moving to another page plays the same wave as Join waitlist: a wave starts
 * at the link you tapped and sweeps over the screen, led by a soft lilac
 * ring, turning everything to the page background. The next page then rises
 * in from that blank background (the home page plays its own intro instead).
 * No library (Web Animations API), so inner pages stay light. Off for reduced
 * motion and for links that open elsewhere.
 */
const KEY = 'zend-wave';
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initPageWave(): void {
  arrive();
  document.addEventListener('click', onClick);
  // Back/forward from the cache: never leave the wave covering the page.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.querySelectorAll('.page-wave').forEach((n) => n.remove());
  });
}

function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
  if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-waitlist') || a.hasAttribute('data-frame')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  // Same page (e.g. #faq on the home page): not a page change.
  if (url.pathname === location.pathname && url.search === location.search) return;
  if (reduce()) return;
  e.preventDefault();
  leave(a, url.href);
}

/** The wave sweeps out from the link, then the browser goes to the next page. */
function leave(from: Element, href: string) {
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;

  const wave = document.createElement('div');
  wave.className = 'page-wave';
  const ring = document.createElement('div');
  ring.className = 'page-wave__ring';
  wave.append(ring);
  document.body.append(wave);

  const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const sweep = wave.animate(
    [{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` }],
    { duration: 650, easing: ease, fill: 'forwards' },
  );
  ring.animate(
    [
      { left: `${cx}px`, top: `${cy}px`, width: '10px', height: '10px', opacity: 0.9 },
      { left: `${cx}px`, top: `${cy}px`, width: `${R * 2 + 60}px`, height: `${R * 2 + 60}px`, opacity: 0 },
    ],
    { duration: 700, easing: ease, fill: 'forwards' },
  );
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage blocked: the next page just appears */
    }
    location.href = href;
  };
  sweep.finished.then(go);
  setTimeout(go, 900); // never get stuck if the animation is throttled
}

/** On the new page: start from the blank background and rise in. */
function arrive() {
  let came = false;
  try {
    came = sessionStorage.getItem(KEY) === '1';
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
  const html = document.documentElement;
  if (!came || reduce() || html.classList.contains('intro')) {
    html.classList.remove('wave-in');
    return;
  }
  // html.wave-in (set before first paint in Base.astro) keeps the page blank.
  requestAnimationFrame(() => {
    const parts = Array.from(document.querySelectorAll<HTMLElement>('body > :not(script):not(.page-wave):not([hidden])'));
    html.classList.remove('wave-in');
    parts.forEach((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], {
        duration: 500,
        delay: 60 + i * 70,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'backwards',
      }),
    );
  });
}
