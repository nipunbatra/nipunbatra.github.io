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
const navigation = [...home.querySelectorAll('.site-nav a')].map(a => [a.textContent, a.getAttribute('href')]);
for (const filename of pages) {
 const doc = dom(filename).window.document;
 assert.equal(doc.documentElement.dataset.design, 'swiss');
 assert.equal(doc.querySelectorAll('h1').length, 1);
 assert.equal(doc.querySelectorAll('#main').length, 1);
 assert.equal(doc.querySelectorAll('.site-footer').length, 1);
 assert.equal(doc.querySelectorAll('.preview-tools,[data-design-option]').length, 0);
 assert.equal(doc.querySelector('#appearance').options.length, 3);
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
for (const choice of ['light','dark','system']) {
 const {d, doc, media} = boot(choice);
 const control = doc.querySelector('#appearance');
 assert.equal(control.value, choice);
 assert.equal(doc.documentElement.dataset.theme, choice === 'system' ? 'light' : choice);
 media.matches = true; media.change();
 assert.equal(doc.documentElement.dataset.theme, choice === 'light' ? 'light' : 'dark');
 control.value = 'dark';control.dispatchEvent(new d.window.Event('change'));
 assert.equal(doc.documentElement.dataset.mode, 'dark');
 assert.equal(doc.querySelector('meta[name="theme-color"]').content, '#1b1e1c');
 assert.equal(d.window.localStorage.getItem('theme'), 'dark');
 assert.equal(new URL(d.window.location).search, '');
}
assert.equal(boot('invalid', true).doc.documentElement.dataset.theme, 'dark');
assert.equal(boot(null, true, true).doc.documentElement.dataset.theme, 'dark');
console.log('PASS: all nine production pages share Swiss navigation, indexable metadata and valid assets; full bio, videos and illustrations preserved; light/dark/system appearance and storage fallback work.');
