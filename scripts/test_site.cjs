// Static content, indexing, navigation and appearance checks; use existing jsdom.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const pages = ['index.html','teaching.html','teaching-videos.html','projects.html','ml-in-1-minute.html','dl-in-3-minutes.html','psdv-in-1-minute.html','python-in-1-minute.html','stai-in-1-minute.html'];
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const dom = f => new JSDOM(read(f), { url: 'https://nipunbatra.github.io/' + f, runScripts: 'outside-only' });
const approved = dom('design-explorations/homepage-themes-2026/round-2/index.html').window.document;
const home = dom('index.html').window.document;
assert.deepEqual([...home.querySelectorAll('.bio p')].map(p => p.textContent), [...approved.querySelectorAll('.bio p')].map(p => p.textContent));
assert.deepEqual([...home.querySelectorAll('.bio a,.video')].map(a => a.href), [...approved.querySelectorAll('.bio a,.video')].map(a => a.href));
assert.equal(home.querySelectorAll('.topic-visual').length, 6);
assert.deepEqual([...home.querySelectorAll('.discovery h2,.conversations h2')].map(h => h.textContent), ['Research','Teaching','In conversation']);
assert.equal(home.querySelectorAll('.topic-copy small').length, 6);
const navigation = [...home.querySelectorAll('.site-nav a')].map(a => [a.textContent, a.getAttribute('href')]);
for (const filename of pages) {
 const doc = dom(filename).window.document;
 assert.equal(doc.documentElement.dataset.design, 'swiss');
 assert.equal(doc.querySelectorAll('h1').length, 1);
 assert.equal(doc.querySelectorAll('#main').length, 1);
 assert.equal(doc.querySelectorAll('.site-footer').length, 1);
 assert.equal(doc.querySelectorAll('.preview-tools,[data-design-option]').length, 0);
 assert.equal(doc.querySelectorAll('#appearance,.appearance-control').length, 0);
 assert.equal(doc.querySelectorAll('.site-header button.mode[role=switch]').length, 1);
 assert.equal(doc.querySelector('.mode').textContent.trim(), '');
 assert.deepEqual([...doc.querySelectorAll('.site-nav a')].map(a => [a.textContent, a.getAttribute('href')]), navigation);
 const active = filename === 'index.html' || filename === 'projects.html' ? filename : 'teaching.html';
 assert.equal(doc.querySelector('.site-nav [aria-current]').getAttribute('href'), active);
 assert.equal(doc.querySelector('link[rel=canonical]').href, 'https://nipunbatra.github.io/' + (filename === 'index.html' ? '' : filename));
 assert.ok(doc.querySelector('meta[name=description]').content.length > 30);
 assert.ok(doc.querySelector('meta[property="og:title"]'));
 assert.equal(doc.querySelector('meta[name=robots]')?.content.includes('noindex') || false, false);
 assert.doesNotMatch(read(filename), /design-explorations|preview\.js|preview\.css|\.\.\/\.\.\/\.\.\//);
 const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
 assert.equal(ids.length, new Set(ids).size, filename + ': duplicate IDs');
 for (const el of doc.querySelectorAll('[href],[src]')) {
  const value = el.getAttribute('href') || el.getAttribute('src');
  if (/^(https?:|mailto:|data:|#)/.test(value)) continue;
  assert.ok(fs.existsSync(path.join(root, value.split(/[?#]/)[0])), filename + ': ' + value);
 }
}
{
 // Open source keeps one search with a live count, the jump strip and tag boxes.
 const d = dom('projects.html'); d.window.eval(read('projects.js'));
 const doc = d.window.document, search = doc.querySelector('#project-search');
 const items = doc.querySelectorAll('.project-item');
 assert.equal(doc.querySelector('#search-status').textContent, items.length + ' entries');
 assert.equal(doc.querySelectorAll('.project-section .project-list').length, 3);
 assert.ok([...items].every(item => item.querySelector('h3') && item.querySelector('p') && item.querySelectorAll('.project-tags .tag').length));
 search.value = 'privacy wasm'; search.dispatchEvent(new d.window.Event('input'));
 const shown = [...items].filter(item => !item.hidden);
 assert.ok(shown.length > 0 && shown.length < items.length);
 assert.equal(doc.querySelector('#search-status').textContent, shown.length + (shown.length === 1 ? ' entry' : ' entries'));
 search.value = 'zzzz'; search.dispatchEvent(new d.window.Event('input'));
 assert.equal(doc.querySelector('#empty-state').hidden, false);
 assert.ok(doc.querySelector('.archive-strip a[href*="github.com/nipunbatra"]'));
}
function boot(stored, systemDark = false, noStorage = false) {
 const d = dom('teaching.html');
 const media = { matches: systemDark, addEventListener(_, fn) { this.change = fn; } };
 d.window.matchMedia = () => media;
 if (stored) d.window.localStorage.setItem('theme', stored);
 if (noStorage) Object.defineProperty(d.window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
 d.window.eval(read('site.js'));
 d.window.document.dispatchEvent(new d.window.Event('DOMContentLoaded'));
 return { d, media, doc: d.window.document };
}
for (const stored of ['light','dark',null]) {
 const {d, doc, media} = boot(stored);
 const toggle = doc.querySelector('.mode');
 assert.equal(doc.documentElement.dataset.theme, stored || 'light');
 assert.equal(toggle.getAttribute('aria-checked'), String(stored === 'dark'));
 media.matches = true; media.change();
 // An explicit choice wins; otherwise the switch follows the system setting.
 assert.equal(doc.documentElement.dataset.theme, stored === 'light' ? 'light' : 'dark');
 assert.equal(toggle.getAttribute('aria-checked'), String(stored !== 'light'));
 toggle.click();
 const flipped = stored === 'light' ? 'dark' : 'light';
 assert.equal(doc.documentElement.dataset.mode, flipped);
 assert.equal(toggle.getAttribute('aria-checked'), String(flipped === 'dark'));
 assert.equal(doc.querySelector('meta[name="theme-color"]').content, flipped === 'dark' ? '#1b1e1c' : '#fffefa');
 assert.equal(d.window.localStorage.getItem('theme'), flipped);
 media.matches = false; media.change();
 assert.equal(doc.documentElement.dataset.mode, flipped);
 assert.equal(new URL(d.window.location).search, '');
}
assert.equal(boot('invalid', true).doc.documentElement.dataset.theme, 'dark');
assert.equal(boot(null, true, true).doc.documentElement.dataset.theme, 'dark');
console.log('PASS: all nine production pages share Swiss navigation, indexable metadata and valid assets; full bio, videos and illustrations preserved; sun and moon switch follows the system until clicked, persists the choice, and survives unavailable storage.');
