import { gsap } from 'gsap';
import { prefersReducedMotion } from './env';
import { getLenis } from './smooth';

/**
 * Join waitlist (form in Waitlist.astro). Any [data-waitlist] button opens it:
 *  1. A wave starts at the tapped button and sweeps over the screen; what it
 *     passes turns to the page background (a growing circle), led by a soft
 *     lilac ring.
 *  2. The form appears plainly in the middle (heading, subtitle, name,
 *     Phone | Email switch, Join).
 *  3. On a successful save, everything squeezes into a point in the middle;
 *     the point opens into a tick and "You're in!".
 *  ✕ (or Esc) reverses it back to the page, ending on the button.
 * Saves to the Google Sheet web app in PUBLIC_WAITLIST_URL.
 */

import { SHEET_URL } from '../data/contact';
const ENDPOINT: string | undefined = SHEET_URL;

type Mode = 'phone' | 'email';

/** Nigerian mobile number -> +234XXXXXXXXXX, or null. */
export function normalisePhone(raw: string): string | null {
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+234')) p = p.slice(4);
  else if (p.startsWith('234') && p.length > 11) p = p.slice(3);
  if (p.startsWith('0')) p = p.slice(1);
  return /^[789][01]\d{8}$/.test(p) ? `+234${p}` : null;
}
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function setup(): ((btn: HTMLElement) => void) | null {
  const root = document.getElementById('waitlist');
  if (!root) return null;
  const wave = root.querySelector<HTMLElement>('.wl-wave')!;
  const ring = root.querySelector<HTMLElement>('.wl-ring')!;
  const close = root.querySelector<HTMLButtonElement>('.wl-close')!;
  const form = root.querySelector<HTMLFormElement>('.wl-form')!;
  const items = Array.from(form.querySelectorAll<HTMLElement>('.wl-in'));
  const nameIn = form.querySelector<HTMLInputElement>('[name="name"]')!;
  const phoneIn = form.querySelector<HTMLInputElement>('[name="phone"]')!;
  const emailIn = form.querySelector<HTMLInputElement>('[name="email"]')!;
  const hp = form.querySelector<HTMLInputElement>('[name="zx_hp_field"]')!; // a name browsers won't auto-fill
  const phoneField = form.querySelector<HTMLElement>('.wl-field--phone')!;
  const emailField = form.querySelector<HTMLElement>('.wl-field--email')!;
  const switchBtns = Array.from(form.querySelectorAll<HTMLButtonElement>('.wl-switch button'));
  const error = form.querySelector<HTMLElement>('.wl-error')!;
  const submit = form.querySelector<HTMLButtonElement>('.wl-submit')!;
  const dot = root.querySelector<HTMLElement>('.wl-dot')!;
  const tick = dot.querySelector('path')!;
  const done = root.querySelector<HTMLElement>('.wl-done')!;

  let mode: Mode = 'phone';
  let trigger: HTMLElement | null = null;
  let source = '';
  let openTl: gsap.core.Timeline | null = null;
  let isOpen = false;
  let busy = false;
  const reduce = () => prefersReducedMotion();

  // ---------- Errors (friendly hints) ----------
  const showError = (msg: string, field?: HTMLInputElement) => {
    error.textContent = msg;
    [nameIn, phoneIn, emailIn].forEach((i) => i.removeAttribute('aria-invalid'));
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  };
  [nameIn, phoneIn, emailIn].forEach((i) =>
    i.addEventListener('input', () => {
      if (i.getAttribute('aria-invalid')) showError('');
    }),
  );

  // ---------- Phone | Email ----------
  const applyMode = (m: Mode) => {
    mode = m;
    switchBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
    phoneField.hidden = m !== 'phone';
    emailField.hidden = m !== 'email';
  };
  switchBtns.forEach((b) =>
    b.addEventListener('click', () => {
      applyMode(b.dataset.mode as Mode);
      showError('');
      (mode === 'phone' ? phoneIn : emailIn).focus();
    }),
  );

  const reset = () => {
    gsap.set(items, { clearProps: 'all' });
    gsap.set(error, { clearProps: 'all' });
    gsap.set(dot, { opacity: 0, scale: 0 });
    gsap.set(tick, { strokeDashoffset: 24 });
    gsap.set(done, { autoAlpha: 0, y: 0 });
    form.reset();
    applyMode('phone');
    showError('');
    submit.removeAttribute('aria-busy');
    busy = false;
  };

  // ---------- Open: the wave from the button ----------
  const open = (btn: HTMLElement) => {
    if (isOpen) return;
    isOpen = true;
    trigger = btn;
    source = btn.closest('.site-header') ? 'top-bar' : (btn.closest<HTMLElement>('[id]')?.id ?? '');
    reset();

    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const R = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 40;

    root.hidden = false;
    document.documentElement.classList.add('wl-open');
    getLenis()?.stop();

    const d = reduce() ? 0.01 : 1;
    openTl = gsap.timeline({ onComplete: () => nameIn.focus({ preventScroll: true }) });
    openTl
      .fromTo(
        wave,
        { clipPath: `circle(0px at ${cx}px ${cy}px)` },
        { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.75 * d, ease: 'power2.inOut' },
        0,
      )
      .fromTo(
        ring,
        { x: cx, y: cy, xPercent: -50, yPercent: -50, width: 10, height: 10, opacity: 0.9 },
        { width: R * 2 + 60, height: R * 2 + 60, opacity: 0, duration: 0.8 * d, ease: 'power2.inOut' },
        0,
      )
      .fromTo(close, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3 * d, ease: 'back.out(2)' }, 0.5 * d)
      .fromTo(items, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05 * d, duration: 0.4 * d, ease: 'power3.out' }, 0.45 * d);
  };

  // ---------- Close: everything plays back to the button ----------
  const finish = () => {
    root.hidden = true;
    isOpen = false;
    document.documentElement.classList.remove('wl-open');
    getLenis()?.start();
    trigger?.focus({ preventScroll: true });
  };
  const shut = () => {
    if (!isOpen || !openTl) return;
    const tl = openTl;
    tl.eventCallback('onReverseComplete', () => {
      tl.eventCallback('onReverseComplete', null);
      tl.timeScale(1);
      finish();
    });
    // After a sign-up, the thank-you folds back into its point first.
    const hasDone = Number(gsap.getProperty(done, 'opacity')) > 0;
    if (hasDone && !reduce()) {
      gsap
        .timeline({ onComplete: () => void tl.timeScale(1.4).reverse() })
        .to(done, { autoAlpha: 0, y: 16, duration: 0.2 })
        .to(dot, { scale: 0, opacity: 0, duration: 0.25, ease: 'back.in(2)' }, 0.05);
    } else {
      tl.timeScale(1.4).reverse();
    }
  };
  close.addEventListener('click', shut);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') shut();
    // Keep Tab inside the dialog.
    if (e.key === 'Tab') {
      const f = Array.from(root.querySelectorAll<HTMLElement>('button, input:not(.wl-hp)')).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ---------- Submit: squeeze into a point, open into the thank-you ----------
  const squeeze = () => {
    const d = reduce() ? 0.01 : 1;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const tl = gsap.timeline();
    items.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      tl.to(
        el,
        { x: `+=${cx - (b.left + b.width / 2)}`, y: `+=${cy - (b.top + b.height / 2)}`, scale: 0, autoAlpha: 0, duration: 0.45 * d, ease: 'power3.in' },
        i * 0.03 * d,
      );
    });
    tl.to(error, { autoAlpha: 0, duration: 0.1 }, 0)
      .fromTo(dot, { scale: 0, opacity: 1 }, { scale: 0.14, duration: 0.15 * d, ease: 'power2.out' }, 0.45 * d)
      .to(dot, { scale: 1, duration: 0.45 * d, ease: 'back.out(1.8)' }, 0.65 * d)
      .to(tick, { strokeDashoffset: 0, duration: 0.35 * d, ease: 'power2.out' }, 0.85 * d)
      .fromTo(done, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4 * d, ease: 'power3.out' }, 0.9 * d)
      .call(() => close.focus({ preventScroll: true }));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = nameIn.value.trim();
    if (name.length < 2) return showError('Please tell us your name.', nameIn);
    let contact: { phone?: string; email?: string };
    if (mode === 'phone') {
      const p = normalisePhone(phoneIn.value);
      if (!p) return showError("That doesn't look like a phone number. Try 0801 234 5678.", phoneIn);
      contact = { phone: p };
    } else {
      if (!isEmail(emailIn.value)) return showError("That doesn't look like an email. Try you@email.com.", emailIn);
      contact = { email: emailIn.value.trim().toLowerCase() };
    }
    showError('');
    busy = true;
    submit.setAttribute('aria-busy', 'true');
    try {
      await save({ name, ...contact, source, website: hp.value });
      squeeze();
    } catch {
      showError("We couldn't save that. Check your connection and try again.");
      busy = false;
    } finally {
      submit.removeAttribute('aria-busy');
    }
  });

  return open;
}

let opener: ((btn: HTMLElement) => void) | null | undefined;
/** Opens the form from a Join waitlist button (sets it up on first use). */
export function openWaitlist(btn: HTMLElement): void {
  if (opener === undefined) opener = setup();
  opener?.(btn);
}

async function save(body: Record<string, string | undefined>): Promise<void> {
  if (!ENDPOINT) {
    // Not connected to the sheet yet: pretend it worked (until the URL is set).
    console.warn('[waitlist] PUBLIC_WAITLIST_URL is not set; sign-up not saved', body);
    await new Promise((r) => setTimeout(r, 600));
    return;
  }
  // text/plain keeps it a "simple" request (no CORS preflight), which Google
  // Apps Script web apps need.
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok?: boolean };
  if (!json.ok) throw new Error('not saved');
}
