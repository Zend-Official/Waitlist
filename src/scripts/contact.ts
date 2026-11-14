/**
 * Contact us form: sends the message to the team's email through the Google
 * Apps Script web app (the same one as the waitlist; it emails the message
 * with Reply-To set to the sender, and keeps a copy in the "Contact" tab).
 */
import { SHEET_URL } from '../data/contact';
const ENDPOINT: string | undefined = SHEET_URL;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('form.ct');
  if (!form) return;
  const field = (n: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${n}"]`)!;
  const name = field('name');
  const email = field('email');
  const message = field('message');
  const hp = field('zx_hp_field'); // a name browsers won't auto-fill
  const error = form.querySelector<HTMLElement>('.ct__error')!;
  const send = form.querySelector<HTMLButtonElement>('.ct__send')!;
  const done = form.querySelector<HTMLElement>('.ct__done')!;
  let busy = false;

  const showError = (msg: string, f?: HTMLInputElement | HTMLTextAreaElement) => {
    error.textContent = msg;
    [name, email, message].forEach((i) => i.removeAttribute('aria-invalid'));
    if (f) {
      f.setAttribute('aria-invalid', 'true');
      f.focus();
    }
  };
  [name, email, message].forEach((i) => i.addEventListener('input', () => i.getAttribute('aria-invalid') && showError('')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    if (name.value.trim().length < 2) return showError('Please tell us your name.', name);
    if (!isEmail(email.value)) return showError("That doesn't look like an email. Try you@email.com.", email);
    if (message.value.trim().length < 5) return showError('Please write your message.', message);
    showError('');
    busy = true;
    send.setAttribute('aria-busy', 'true');
    try {
      const body = { type: 'contact', name: name.value.trim(), email: email.value.trim(), message: message.value.trim(), website: hp.value };
      if (!ENDPOINT) throw new Error('not connected');
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) throw new Error('not sent');
      form.reset();
      [...form.querySelectorAll<HTMLElement>('.ct__field, .ct__send, .ct__error')].forEach((el) => (el.style.display = 'none'));
      done.hidden = false;
      done.focus?.();
    } catch {
      showError("We couldn't send that. Check your connection and try again.");
    } finally {
      busy = false;
      send.removeAttribute('aria-busy');
    }
  });
}
