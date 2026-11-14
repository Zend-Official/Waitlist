import { initScrollbar } from './scrollbar';
import { initTheme, toggleTheme } from './theme';
import { initPageWave } from './page-wave';

/**
 * Script for the inner pages (privacy, terms, partners, contact): no scroll
 * story, just the day/night toggle, the Join waitlist form (its code loads on
 * the first tap), the floating scrollbar and the offline cache.
 */
export function initPage(): void {
  initPageWave();
  initTheme();
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => toggleTheme()));

  const loadWaitlist = () => import('./waitlist');
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-waitlist]');
    if (!btn) return;
    e.preventDefault();
    loadWaitlist().then((m) => m.openWaitlist(btn));
  });
  window.addEventListener('load', () => setTimeout(loadWaitlist, 3000), { once: true });

  initScrollbar();

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
  }
}
