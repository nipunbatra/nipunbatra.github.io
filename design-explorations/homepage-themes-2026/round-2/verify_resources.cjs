const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../../..');
const read = filename => fs.readFileSync(path.join(__dirname, filename), 'utf8');
const published = filename => execFileSync('git', ['show', 'HEAD:' + filename], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
const base = 'https://nipunbatra.github.io/design-explorations/homepage-themes-2026/round-2/';
const visible = (doc, selector) => [...doc.querySelectorAll(selector)].filter(el => !el.hidden);
function page(filename, design, mode) {
  const dom = new JSDOM(read(filename), { url: base + filename + '?design=' + design + '&mode=' + mode, runScripts: 'outside-only' });
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  dom.window.eval(read('preview.js'));
  dom.window.eval(filename === 'projects.html' ? read('projects-filter.js') : fs.readFileSync(path.join(root, 'teaching.js'), 'utf8'));
  return dom;
}
function input(dom, selector, value, type = 'input') {
  const el = dom.window.document.querySelector(selector);
  if (typeof value === 'boolean') el.checked = value; else el.value = value;
  el.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
}
for (const filename of ['teaching.html', 'teaching-videos.html', 'projects.html']) {
  const original = new JSDOM(published(filename)).window.document;
  const staticDoc = new JSDOM(read(filename)).window.document;
  const selector = filename === 'teaching.html' ? '[data-course]' : filename === 'teaching-videos.html' ? '[data-video]' : '.project-item';
  assert.deepEqual([...staticDoc.querySelectorAll(selector)].map(el => el.textContent), [...original.querySelectorAll(selector)].map(el => el.textContent), filename + ' content changed');
  assert.equal(staticDoc.querySelectorAll('#main').length, 1);
  assert.equal(staticDoc.querySelector('#page').options.length, 4);
  assert.match(staticDoc.querySelector('meta[name=robots]').content, /noindex/);
  for (const el of staticDoc.querySelectorAll('[href],[src]')) {
    const value = el.getAttribute('href') || el.getAttribute('src');
    if (/^(https?:|mailto:|data:|#)/.test(value)) continue;
    assert.ok(fs.existsSync(path.resolve(__dirname, value.split(/[?#]/)[0])), filename + ': ' + value);
  }
  for (const design of ['swiss', 'editorial', 'index', 'forest']) {
    for (const mode of ['light', 'dark']) {
      const dom = page(filename, design, mode), doc = dom.window.document;
      assert.equal(doc.documentElement.dataset.design, design);
      assert.equal(doc.documentElement.dataset.theme, mode);
      assert.equal(doc.querySelector('#page').value, filename);
      for (const destination of ['index.html', 'teaching.html', 'projects.html']) {
        const link = [...doc.querySelectorAll('.site-nav a')].find(a => new URL(a.href).pathname === new URL(destination, base).pathname);
        assert.ok(link, destination);
        assert.equal(new URL(link.href).searchParams.get('design'), design);
        assert.equal(new URL(link.href).searchParams.get('mode'), mode);
      }
      if (filename === 'teaching.html') {
        assert.equal(doc.querySelectorAll('[data-course]').length, 25);
        assert.equal(doc.querySelectorAll('.collection').length, 19);
        assert.equal(doc.querySelectorAll('.sheet-list a').length, 86);
        input(dom, '[data-recordings]', true, 'change');
        assert.equal(visible(doc, '[data-course]').length, 7);
        input(dom, '#library-query', 'autograd PDF');
        assert.match(doc.querySelector('[data-results]').textContent, /Backpropagation & Autograd/);
        assert.equal(new URL(dom.window.location).searchParams.get('design'), design);
        const result = doc.querySelector('[data-results] a');
        assert.ok(!result.href.includes('/round-2/teaching-cheatsheets/'));
      } else if (filename === 'teaching-videos.html') {
        assert.equal(doc.querySelectorAll('[data-video]').length, 562);
        input(dom, '[data-collection-filter]', 'seven-ideas-ml', 'change');
        assert.equal(visible(doc, '[data-video]').length, 8);
        input(dom, '[data-collection-filter]', '', 'change');
        doc.querySelector('[data-more-videos]').click();
        assert.equal(visible(doc, '[data-video]').length, 60);
      } else {
        input(dom, '#project-search', 'autograd playground');
        assert.equal(visible(doc, '.project-item').length, 1);
        input(dom, '#project-search', 'no such project abcdef');
        assert.equal(visible(doc, '.project-item').length, 0);
        assert.equal(doc.querySelector('#empty-state').hidden, false);
        input(dom, '#project-search', '');
        assert.equal(visible(doc, '.project-item').length, original.querySelectorAll('.project-item').length);
      }
      input(dom, '#mode', mode === 'dark' ? 'light' : 'dark', 'change');
      assert.equal(doc.documentElement.dataset.theme, mode === 'dark' ? 'light' : 'dark');
    }
  }
}
console.log('PASS: Teaching, video directory and Open Source preserve published content; all four styles and both modes retain navigation, filters, search, pagination and valid local destinations.');
