const form = document.getElementById('login');
const err = document.getElementById('err');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const btn = form.querySelector('button');
  btn.disabled = true;
  err.hidden = true;
  try {
    const r = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username.value, password: form.password.value }),
    });
    if (r.ok) return location.replace('/');
    const j = await r.json().catch(() => ({}));
    err.textContent = j.error || 'Could not sign in.';
  } catch {
    err.textContent = 'Could not reach the server.';
  }
  err.hidden = false;
  btn.disabled = false;
  form.password.select();
});
