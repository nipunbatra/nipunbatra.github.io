// Run with the existing jsdom installation on NODE_PATH. No production dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../../..');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'preview.js'), 'utf8');
const original = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).window.document;
function preview(query = '') {
  const dom = new JSDOM(html, { url: 'https://nipunbatra.github.io/design-explorations/homepage-themes-2026/round-2/' + query, runScripts: 'outside-only' });
  const media = { matches: false, addEventListener(_, handler) { this.handler = handler; } };
  dom.window.matchMedia = () => media;
  dom.window.eval(js);
  return { dom, doc: dom.window.document, media };
}
const { dom, doc, media } = preview();
assert.deepEqual([...doc.querySelectorAll('.bio p')].map(p => p.textContent), [...original.querySelectorAll('.bio-copy p')].map(p => p.textContent));
assert.deepEqual([...doc.querySelectorAll('.bio a')].map(a => a.href), [...original.querySelectorAll('.bio-copy a')].map(a => a.href));
assert.deepEqual([...doc.querySelectorAll('.video')].map(a => a.href), [...original.querySelectorAll('.media-card')].map(a => a.href));
assert.equal(doc.querySelectorAll('.topic-visual').length, 6);
assert.equal(doc.querySelectorAll('.bio p[hidden]').length, 0);
assert.equal(doc.querySelector('meta[name=robots]').content, 'noindex,follow');
for (const design of ['swiss', 'editorial', 'index', 'forest']) {
  doc.querySelector(`[data-design-option=${design}]`).click();
  assert.equal(doc.documentElement.dataset.design, design);
  assert.equal(doc.querySelectorAll('[data-design-option][aria-pressed=true]').length, 1);
  for (const mode of ['light', 'dark', 'system']) {
    const select = doc.querySelector('#mode');
    select.value = mode;
    select.dispatchEvent(new dom.window.Event('change'));
    assert.equal(doc.documentElement.dataset.mode, mode === 'system' ? 'light' : mode);
    assert.equal(new URL(dom.window.location).searchParams.get('mode'), mode);
    assert.equal(new URL(dom.window.location).searchParams.get('design'), design);
    assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('homepage-preview')), { design, mode });
  }
}
media.matches = true;
media.handler();
assert.equal(doc.documentElement.dataset.mode, 'dark');
const deepLink = preview('?design=editorial&mode=dark').doc;
assert.equal(deepLink.documentElement.dataset.design, 'editorial');
assert.equal(deepLink.documentElement.dataset.mode, 'dark');
const invalid = preview('?design=invalid&mode=invalid').doc;
assert.equal(invalid.documentElement.dataset.design, 'swiss');
assert.equal(invalid.documentElement.dataset.mode, 'light');
for (const el of doc.querySelectorAll('[href],[src]')) {
  const value = el.getAttribute('href') || el.getAttribute('src');
  if (/^(https?:|mailto:|data:)/.test(value)) continue;
  if (value.startsWith('#')) { assert.ok(doc.querySelector(value), value); continue; }
  assert.ok(fs.existsSync(path.resolve(__dirname, value.split(/[?#]/)[0])), value);
}
const css = fs.readFileSync(path.join(__dirname, 'preview.css'), 'utf8');
for (const match of css.matchAll(/url\('([^']+)'\)/g)) {
  assert.ok(fs.existsSync(path.resolve(__dirname, match[1])), match[1]);
}
console.log('PASS: full original bio and links, both original videos, six topic illustrations, four styles, light/dark/system modes, shared URLs, saved preferences and local assets.');
