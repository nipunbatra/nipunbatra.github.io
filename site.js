/* Apply the saved site appearance before paint; follow the system by default. */
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark', 'system'].includes(value) ? value : 'system';
  let choice = 'system';
  try { choice = valid(localStorage.getItem('theme')); } catch (_) {}
  const apply = () => {
    const mode = choice === 'system' ? (preference.matches ? 'dark' : 'light') : choice;
    root.dataset.mode = mode;
    root.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#1b1e1c' : '#fffefa');
    const control = document.querySelector('#appearance');
    if (control) control.value = choice;
  };
  apply();
  const bind = () => {
    apply();
    document.querySelector('#appearance')?.addEventListener('change', event => {
      choice = valid(event.target.value);
      try { localStorage.setItem('theme', choice); } catch (_) {}
      apply();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  preference.addEventListener('change', () => { if (choice === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === 'theme' || event.key === null) { choice = valid(event.newValue); apply(); }
  });
})();
