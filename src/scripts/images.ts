/**
 * Deferred images (SmartPicture `defer`, hero girl patches). Their URLs wait
 * in data-src / data-srcset so the first load is just the hero:
 *  - "idle": once the page has loaded and settled (the hero girl's blink and
 *    typing patches).
 *  - "scroll": the first time the visitor scrolls, taps, presses a key or
 *    jumps somewhere (later scenes), or a few seconds after load anyway, so
 *    everything is ready well before it's reached.
 */
export function initDeferredImages(): void {
  const load = (group: 'idle' | 'scroll') => {
    document.querySelectorAll<HTMLImageElement>(`img[data-defer="${group}"]`).forEach((img) => {
      img.parentElement?.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((s) => {
        s.srcset = s.dataset.srcset!;
        s.removeAttribute('data-srcset');
      });
      if (img.dataset.src) img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.removeAttribute('data-defer');
    });
  };

  const idle = (fn: () => void, timeout: number) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, Math.min(timeout, 1200));
  const afterLoad = (fn: () => void) => (document.readyState === 'complete' ? fn() : window.addEventListener('load', fn, { once: true }));

  afterLoad(() => idle(() => load('idle'), 1500));

  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    events.forEach((e) => window.removeEventListener(e, go));
    load('scroll');
  };
  const events = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
  events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
  // Reloaded part-way down (resumes there) or nothing happens for a while.
  if (window.scrollY > 0) go();
  afterLoad(() => setTimeout(() => idle(go, 2000), 3500));
}
