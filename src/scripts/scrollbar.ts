import { scrollToY } from './smooth';

/**
 * The page's scrollbar on mouse/trackpad devices: a slim floating thumb in
 * the dark shape's colour with no track, so whatever is behind it shows
 * through (a native scrollbar always paints its track with the page's
 * background). Drag it like a normal scrollbar. Touch screens keep their own
 * overlay scrollbar.
 */
export function initScrollbar(): void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const html = document.documentElement;
  html.classList.add('own-scrollbar');

  const thumb = document.createElement('div');
  thumb.className = 'page-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  document.body.appendChild(thumb);

  let h = 0;
  const update = () => {
    const vh = window.innerHeight;
    const total = html.scrollHeight;
    const max = total - vh;
    if (max <= 0) {
      thumb.style.display = 'none';
      return;
    }
    thumb.style.display = '';
    h = Math.max(36, (vh * vh) / total);
    const y = (window.scrollY / max) * (vh - h - 8) + 4;
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${y}px)`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(document.body);
  update();

  // Drag
  let startY = 0;
  let startScroll = 0;
  const move = (e: PointerEvent) => {
    const vh = window.innerHeight;
    const max = html.scrollHeight - vh;
    const per = max / Math.max(1, vh - h - 8);
    scrollToY(Math.min(max, Math.max(0, startScroll + (e.clientY - startY) * per)), { immediate: true });
  };
  const up = () => {
    thumb.classList.remove('is-drag');
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startScroll = window.scrollY;
    thumb.classList.add('is-drag');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}
