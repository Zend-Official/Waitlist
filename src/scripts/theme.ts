import { isLite, prefersReducedMotion } from './env';

const KEY = 'zend-theme';
export type Theme = 'light' | 'dark';

const html = document.documentElement;
const deviceDark = window.matchMedia('(prefers-color-scheme: dark)');

export const currentTheme = (): Theme => (html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

const savedTheme = (): Theme | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
};

/** Keep every toggle's label and state in sync with the theme. */
function syncToggles() {
  const dark = currentTheme() === 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(dark));
    b.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to night mode');
  });
}

/** Switch theme. Crossfades the whole page where the browser supports it. */
function apply(theme: Theme, animate: boolean) {
  if (theme === currentTheme()) return;
  const swap = () => {
    html.setAttribute('data-theme', theme);
    syncToggles();
  };
  type VT = { ready: Promise<void>; finished: Promise<void> };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  if (animate && doc.startViewTransition && !document.hidden && !prefersReducedMotion() && !isLite()) {
    const vt = doc.startViewTransition(swap);
    // If the browser cancels the crossfade, the theme still switches; just
    // don't let the cancellation surface as an error.
    vt.ready.catch(() => {});
    vt.finished.catch(() => {});
  } else swap();
}

/** Flip day <-> night and remember the choice. */
export function toggleTheme() {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  apply(next, true);
}

export function initTheme() {
  syncToggles();
  // Follow the device setting live until the visitor picks one with the toggle.
  deviceDark.addEventListener('change', (e) => {
    if (!savedTheme()) apply(e.matches ? 'dark' : 'light', true);
  });
}
