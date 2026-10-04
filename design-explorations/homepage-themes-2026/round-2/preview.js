(() => {
  const root = document.documentElement;
  const designs = ['swiss', 'editorial', 'index', 'forest'];
  const modes = ['light', 'dark', 'system'];
  const params = new URLSearchParams(location.search);
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('homepage-preview') || '{}') || {}; } catch (_) {}
  let design = params.get('design') || stored.design || 'swiss';
  let mode = params.get('mode') || stored.mode || 'system';
  if (!designs.includes(design)) design = 'swiss';
  if (!modes.includes(mode)) mode = 'system';
  const apply = () => {
    root.dataset.design = design;
    root.dataset.mode = mode === 'system' ? (preference.matches ? 'dark' : 'light') : mode;
    document.querySelectorAll('[data-design-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.designOption === design));
    });
    document.querySelector('#mode').value = mode;
    const url = new URL(location.href);
    url.searchParams.set('design', design);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
    try { localStorage.setItem('homepage-preview', JSON.stringify({ design, mode })); } catch (_) {}
  };
  document.querySelectorAll('[data-design-option]').forEach(button => {
    button.addEventListener('click', () => { design = button.dataset.designOption; apply(); });
  });
  document.querySelector('#mode').addEventListener('change', event => { mode = event.target.value; apply(); });
  preference.addEventListener('change', () => { if (mode === 'system') apply(); });
  apply();
})();
