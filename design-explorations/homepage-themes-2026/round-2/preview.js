(() => {
  const root = document.documentElement;
  const designs = ['swiss', 'editorial', 'index', 'forest'];
  const modes = ['light', 'dark', 'system'];
  const pages = ['index.html', 'teaching.html', 'teaching-videos.html', 'projects.html'];
  const base = new URL('./', location.href);
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const params = new URLSearchParams(location.search);
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('homepage-preview') || '{}') || {}; } catch (_) {}
  let design = params.get('design') || stored.design || 'swiss';
  let mode = params.get('mode') || stored.mode || 'system';
  if (!designs.includes(design)) design = 'swiss';
  if (!modes.includes(mode)) mode = 'system';
  const decorateLink = anchor => {
    if (anchor.getAttribute('href')?.startsWith('#')) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
    const filename = url.pathname.slice(base.pathname.length) || 'index.html';
    if (!pages.includes(filename)) return;
    url.searchParams.set('design', design);
    url.searchParams.set('mode', mode);
    anchor.href = url.href;
  };
  const apply = () => {
    root.dataset.design = design;
    root.dataset.mode = mode === 'system' ? (preference.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = root.dataset.mode;
    document.querySelectorAll('[data-design-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.designOption === design));
    });
    document.querySelector('#mode').value = mode;
    document.querySelector('#page').value = currentPage;
    const url = new URL(location.href);
    url.searchParams.set('design', design);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
    document.querySelectorAll('a[href]').forEach(decorateLink);
    try { localStorage.setItem('homepage-preview', JSON.stringify({ design, mode })); } catch (_) {}
  };
  document.querySelectorAll('[data-design-option]').forEach(button => {
    button.addEventListener('click', () => { design = button.dataset.designOption; apply(); });
  });
  document.querySelector('#mode').addEventListener('change', event => { mode = event.target.value; apply(); });
  document.querySelector('#page').addEventListener('change', event => {
    const url = new URL(event.target.value, base);
    url.searchParams.set('design', design);
    url.searchParams.set('mode', mode);
    location.assign(url.href);
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (anchor) decorateLink(anchor);
  }, true);
  preference.addEventListener('change', () => { if (mode === 'system') apply(); });
  apply();
})();
