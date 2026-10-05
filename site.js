/* Apply the saved site appearance before paint; follow the system until the switch is used. */
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark'].includes(value) ? value : 'system';
  let choice = 'system';
  try { choice = valid(localStorage.getItem('theme')); } catch (_) {}
  const apply = () => {
    const mode = choice === 'system' ? (preference.matches ? 'dark' : 'light') : choice;
    root.dataset.mode = mode;
    root.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#1b1e1c' : '#fffefa');
    document.querySelectorAll('.mode').forEach(button => button.setAttribute('aria-checked', String(mode === 'dark')));
  };
  apply();
  const bind = () => {
    apply();
    document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => {
      choice = root.dataset.mode === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', choice); } catch (_) {}
      apply();
    }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  preference.addEventListener('change', () => { if (choice === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === 'theme' || event.key === null) { choice = valid(event.newValue); apply(); }
  });
})();
