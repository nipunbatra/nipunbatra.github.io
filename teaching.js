/* Progressive enhancement: all course and video links also exist in static HTML. */
function initTeaching(root = document, options = {}) {
  const one = selector => root.querySelector(selector);
  const all = selector => Array.from(root.querySelectorAll(selector));
  const doc = root.ownerDocument || document;
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matches = (text, query) => normalize(query).trim().split(/\s+/).every(word => normalize(text).includes(word));
  const index = JSON.parse(one('#teaching-search-data').textContent);
  const form = one('.library-search');
  const query = one('#library-query');
  const panel = one('[data-search-panel]');
  const results = one('[data-results]');
  const moreResults = one('[data-more-results]');
  const directory = one('.video-directory');
  const collection = one('[data-collection-filter]');
  let resultLimit = 12;
  let resultType = 'all';
  let selectedGroup = '';
  let videoLimit = 30;
  const params = new URLSearchParams(options.queryString ?? window.location.search);
  const typeButtons = all('[data-result-type]');
  if (typeButtons.some(button => button.dataset.resultType === params.get('type'))) resultType = params.get('type');

  function openSheets(hash) {
    if (!hash.startsWith('#sheets-')) return;
    const target = doc.getElementById(hash.slice(1));
    if (target?.matches('.sheet-group')) target.open = true;
  }
  if (!options.preview) {
    openSheets(window.location.hash);
    window.addEventListener('hashchange', () => openSheets(window.location.hash));
    root.addEventListener('click', event => {
      const anchor = event.target.closest('a.course-sheets');
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === window.location.pathname) openSheets(url.hash);
    });
  }

  function updateURL() {
    if (options.preview) return;
    const url = new URL(window.location.href);
    const q = query.value.trim();
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    if (q && resultType !== 'all') url.searchParams.set('type', resultType); else url.searchParams.delete('type');
    if (collection?.value) url.searchParams.set('collection', collection.value);
    else url.searchParams.delete('collection');
    window.history.replaceState(null, '', url);
  }

  function renderSearch() {
    const q = query.value.trim();
    const active = !!q || !!selectedGroup;
    panel.hidden = !active;
    if (directory) directory.hidden = active;
    if (!active) return;
    const matchesQuery = index.filter(item => {
      if (selectedGroup && !item.groups?.includes(selectedGroup)) return false;
      if (collection?.value && item.kind === 'Video' && !item.groups?.includes(collection.value)) return false;
      return matches([item.title, item.meta, item.terms].join(' '), q);
    });
    typeButtons.forEach(button => {
      const type = button.dataset.resultType;
      const count = type === 'all' ? matchesQuery.length : matchesQuery.filter(item => item.kind === type).length;
      button.querySelector('[data-type-count]').textContent = String(count);
      button.setAttribute('aria-pressed', String(type === resultType));
    });
    const found = matchesQuery.filter(item => resultType === 'all' || item.kind === resultType);
    results.replaceChildren();
    found.slice(0, resultLimit).forEach(item => {
      const article = doc.createElement('article');
      article.className = 'search-result';
      const heading = doc.createElement('h3');
      const anchor = doc.createElement('a');
      anchor.href = options.linkBase ? new URL(item.url, options.linkBase).href : item.url;
      if (options.preview) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
      anchor.textContent = item.title;
      heading.append(anchor);
      const description = doc.createElement('p');
      description.textContent = item.kind + ' · ' + item.meta;
      article.append(heading, description);
      results.append(article);
    });
    one('[data-result-count]').textContent = found.length
      ? `${found.length} result${found.length === 1 ? '' : 's'}${q ? ` for “${q}”` : ''}`
      : resultType === 'all' ? 'No matches. Try a topic, course code or year.' : 'No matches in this category. Choose All or try another topic.';
    moreResults.hidden = found.length <= resultLimit;
    moreResults.textContent = `Show more results (${Math.max(0, found.length - resultLimit)} remaining)`;
  }

  function search() {
    resultLimit = 12;
    selectedGroup = '';
    renderSearch();
    updateURL();
  }
  query.addEventListener('input', search);
  typeButtons.forEach(button => button.addEventListener('click', () => {
    resultType = button.dataset.resultType;
    resultLimit = 12;
    renderSearch();
    updateURL();
  }));
  form.addEventListener('submit', event => { event.preventDefault(); search(); });
  moreResults.addEventListener('click', () => { resultLimit += 24; renderSearch(); });
  one('[data-close-search]').addEventListener('click', () => {
    query.value = '';
    selectedGroup = '';
    resultType = 'all';
    renderSearch();
    updateURL();
    query.focus();
  });

  if (directory) {
    const videos = all('[data-video]');
    function filterVideos() {
      const group = collection.value;
      let count = 0;
      videos.forEach(video => {
        const match = !group || video.dataset.groups.split(' ').includes(group);
        video.hidden = !match || count >= videoLimit;
        if (match) count++;
      });
      one('[data-video-count]').textContent = `${count} video${count === 1 ? '' : 's'}${count > videoLimit ? ` · showing ${videoLimit}` : ''}`;
      one('[data-video-empty]').hidden = count !== 0;
      one('[data-more-videos]').hidden = count <= videoLimit;
      one('#directory-heading').textContent = group ? collection.selectedOptions[0].textContent : 'All teaching videos';
    }
    collection.value = params.get('collection') || '';
    if (collection.selectedIndex < 0) collection.value = '';
    collection.addEventListener('change', () => {
      videoLimit = 30; filterVideos(); updateURL();
    });
    one('[data-more-videos]').addEventListener('click', () => { videoLimit += 30; filterVideos(); });
    filterVideos();
  }

  const menu = one('.menu-toggle');
  const nav = one('#nav-links');
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', expanded);
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') menu.click();
  });
  one('.theme-toggle')?.addEventListener('click', () => {
    const target = options.themeRoot || doc.documentElement;
    const theme = target.dataset.theme === 'dark' ? 'light' : 'dark';
    target.dataset.theme = theme;
    if (!options.preview) { try { localStorage.setItem('theme', theme); } catch (error) { /* Storage may be disabled. */ } }
  });
  query.value = params.get('q') || '';
  renderSearch();

  // The embedded preview can inspect unpublished collections without leaving the conversation.
  return {
    showCollection(id) {
      query.value = '';
      resultType = 'all';
      selectedGroup = id;
      resultLimit = 30;
      if (!id) {
        selectedGroup = '__all_videos__';
        index.filter(item => item.kind === 'Video').forEach(item => {
          if (!item.groups.includes('__all_videos__')) item.groups.push('__all_videos__');
        });
      }
      renderSearch();
      return panel;
    }
  };
}

if (document.querySelector('#teaching-search-data')) initTeaching();
