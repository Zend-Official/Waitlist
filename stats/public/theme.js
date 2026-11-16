// Day / night: a saved choice, else the device setting (CSS handles that).
(() => {
  const root = document.documentElement;
  try {
    const t = localStorage.getItem('zend-stats-theme');
    if (t === 'light' || t === 'dark') root.dataset.theme = t;
  } catch {}
  const dark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const sync = () => {
      btn.setAttribute('aria-label', dark() ? 'Switch to day mode' : 'Switch to night mode');
      // (fixed icon markup written here, no outside data)
      btn.innerHTML = dark()
        ? '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>'
        : '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
    };
    btn.addEventListener('click', () => {
      root.dataset.theme = dark() ? 'light' : 'dark';
      try {
        localStorage.setItem('zend-stats-theme', root.dataset.theme);
      } catch {}
      sync();
    });
    sync();
  });
})();
