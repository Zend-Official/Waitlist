import { SHEET_URL } from '../data/contact';
const ENDPOINT: string | undefined = SHEET_URL;

/**
 * "50+ people have joined Zend" under the hero buttons: the count comes from
 * the waitlist sheet (the web app's GET), rounded down to a tidy number
 * from 10 (10s, then 50s, then 100s) with "+"; under 10 the exact number. The
 * last count is remembered so it shows straight away on the next visit.
 */
export function initJoinedCount(): void {
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-joined]'));
  if (!rows.length) return;
  const KEY = 'zend-joined';
  const show = (n: number) => {
    if (!(n >= 1)) return;
    // Always "N+": the exact number under 10, then rounded down (10s, then
    // 50s from 200, then 100s from 1,000).
    const step = n >= 1000 ? 100 : n >= 200 ? 50 : 10;
    const label = `${(n < 10 ? n : Math.floor(n / step) * step).toLocaleString('en-NG')}+`;
    rows.forEach((r) => {
      r.querySelector('.joined__n')!.textContent = label;
      // One face per person, up to 3.
      r.querySelectorAll<HTMLElement>('.joined__face').forEach((f, i) => (f.hidden = i >= Math.min(n, 3)));
      r.hidden = false;
    });
  };
  try {
    show(Number(localStorage.getItem(KEY)));
  } catch {
    /* storage blocked */
  }
  if (!ENDPOINT) return;
  const load = () =>
    fetch(ENDPOINT)
      .then((r) => r.json() as Promise<{ count?: number }>)
      .then(({ count }) => {
        if (typeof count !== 'number') return;
        try {
          localStorage.setItem(KEY, String(count));
        } catch {
          /* storage blocked */
        }
        show(count);
      })
      .catch(() => {});
  // Not urgent: after the page has settled.
  if ('requestIdleCallback' in window) requestIdleCallback(() => load(), { timeout: 3000 });
  else setTimeout(load, 1500);
}

