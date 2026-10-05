/* Run with an existing jsdom installation on NODE_PATH; no production dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const catalog = JSON.parse(read('data/teaching/catalog.json'));
const source = read('teaching.js');
function page(filename, query = '') {
  const dom = new JSDOM(read(filename), { url: 'https://nipunbatra.github.io/' + filename + query, runScripts: 'outside-only' });
  dom.window.eval(source);
  return dom;
}
function input(dom, selector, value, type = 'input') {
  const element = dom.window.document.querySelector(selector);
  if (typeof value === 'boolean') element.checked = value; else element.value = value;
  element.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
}
const visible = (doc, selector) => [...doc.querySelectorAll(selector)].filter(row => !row.hidden);

const main = page('teaching.html');
const doc = main.window.document;
assert.equal(doc.querySelectorAll('[data-course]').length, 11);
assert.equal(doc.querySelectorAll('[data-offering]').length, 25);
assert.deepEqual([...doc.querySelectorAll('[data-offering]')].map(a => a.href).sort(), catalog.courses.map(c => c.url).sort());
assert.equal(doc.querySelectorAll('.offering.is-recorded[data-offering], .offering.is-current[data-offering]').length, 7);
assert.equal(doc.querySelectorAll('.offering.is-current[data-offering]').length, 1);
assert.equal(doc.querySelectorAll('[data-offering] [aria-hidden]').length, 5);
assert.doesNotMatch(read('teaching.html'), /Not linked|data-course-query|sheet-shortcuts/);
assert.equal(doc.querySelectorAll('input[type=search]').length, 1);
assert.deepEqual([...doc.querySelectorAll('.section-jumps a')].map(a => a.getAttribute('href')).slice(0, 4), ['#now', '#courses', '#videos', '#cheatsheets']);
assert.match(doc.querySelector('#now h2').textContent, new RegExp(catalog.courses[0].title));
assert.ok(doc.querySelector(`#now a[href="${catalog.courses[0].url}"]`));
assert.equal(doc.querySelectorAll('.collection').length, 19);
assert.equal(doc.querySelectorAll('.sheet-group').length, 5);
assert.equal(doc.querySelectorAll('.sheet-list a').length, 86);
assert.equal(new Set([...doc.querySelectorAll('.sheet-list a')].map(a => a.href)).size, 86);
assert.equal(doc.querySelectorAll('.course-table .course-sheets').length, 5);
for (const shortcut of doc.querySelectorAll('.course-table .course-sheets')) {
  const target = doc.querySelector(shortcut.hash);
  assert.ok(target);
  assert.match(target.querySelector('summary small').textContent, /(?:ES|CS)\d+ · (?:Jan|Aug) \d{4}/);
  shortcut.click();
  assert.equal(target.open, true);
}
assert.deepEqual([...doc.querySelectorAll('.collection-group>h3')].map(el => el.textContent), [
  'Visual explanations', 'One-minute lessons', 'Three-minute lessons', 'Course recordings',
  'Science & everyday systems', 'Practical tutorials'
]);
doc.querySelector('#now .course-sheets').click();
assert.equal(doc.querySelector('#sheets-dl-2026').open, true);
const sheetsLink = page('teaching.html', '#sheets-stt-2026');
assert.equal(sheetsLink.window.document.querySelector('#sheets-stt-2026').open, true);
for (const c of catalog.collections) {
  assert.ok(doc.querySelector(`[data-collection-id="${c.id}"]`), c.id + ' missing from the home page');
  if (c.playlist_id) assert.ok([...doc.querySelectorAll('a')].some(a => a.href === 'https://www.youtube.com/playlist?list=' + c.playlist_id));
}
input(main, '#library-query', 'Git cheat sheet');
assert.match(doc.querySelector('[data-results]').textContent, /Git for ML projects/);
assert.match(doc.querySelector('[data-results]').textContent, /Cheatsheet/);
input(main, '#library-query', 'autograd PDF');
assert.match(doc.querySelector('[data-results]').textContent, /Backpropagation & Autograd/);
doc.querySelector('[data-close-search]').click();
input(main, '#library-query', 'representations');
assert.match(doc.querySelector('[data-results]').textContent, /Seven Ways Machines Learn Representations/);
assert.equal(new URL(main.window.location.href).searchParams.get('q'), 'representations');
input(main, '#library-query', 'CS203 2026');
assert.match(doc.querySelector('[data-results]').textContent, /Software Tools and Techniques for AI/);
input(main, '#library-query', '<img src=x onerror=alert(1)>');
assert.equal(doc.querySelectorAll('[data-results] img').length, 0);
assert.match(doc.querySelector('[data-result-count]').textContent, /No matches/);
input(main, '#library-query', 'machine learning');
assert.equal(doc.querySelectorAll('.search-result').length, 12);
doc.querySelector('[data-more-results]').click();
assert.equal(doc.querySelectorAll('.search-result').length, 36);
doc.querySelector('[data-close-search]').click();
assert.equal(doc.querySelector('[data-search-panel]').hidden, true);
assert.equal(new URL(main.window.location.href).search, '');

assert.equal(doc.querySelector('.site-nav [aria-current="page"]').getAttribute('href'), 'teaching.html');
assert.equal(doc.querySelectorAll('.mode[role=switch]').length, 1);

const library = page('teaching-videos.html', '?collection=seven-ideas-ml');
const lib = library.window.document;
assert.equal(lib.querySelectorAll('[data-video]').length, 562);
assert.equal(visible(lib, '[data-video]').length, 8);
assert.equal(lib.querySelector('[data-video-count]').textContent, '8 videos');
assert.match(lib.querySelector('#directory-heading').textContent, /Seven Ideas/);
input(library, '[data-collection-filter]', '', 'change');
assert.equal(visible(lib, '[data-video]').length, 30);
lib.querySelector('[data-more-videos]').click();
assert.equal(visible(lib, '[data-video]').length, 60);
input(library, '[data-collection-filter]', 'indian-scientists', 'change');
assert.equal(visible(lib, '[data-video]').length, 1);
const linked = page('teaching-videos.html', '?q=representations');
assert.match(linked.window.document.querySelector('[data-results]').textContent, /Seven Ways/);
assert.equal(linked.window.document.querySelector('.video-directory').hidden, true);

// Resource filters retain their query, reset pagination, and can be shared by URL.
input(main, '#library-query', 'machine learning');
doc.querySelector('[data-result-type=Cheatsheet]').click();
assert.equal(doc.querySelectorAll('.search-result').length, 12);
assert.ok([...doc.querySelectorAll('.search-result p')].every(el => el.textContent.startsWith('Cheatsheet ·')));
assert.equal(new URL(main.window.location.href).searchParams.get('type'), 'Cheatsheet');
assert.equal(doc.querySelector('[data-result-type=Cheatsheet]').getAttribute('aria-pressed'), 'true');
doc.querySelector('[data-more-results]').click();
assert.ok(doc.querySelectorAll('.search-result').length > 12);
doc.querySelector('[data-result-type=Course]').click();
assert.ok([...doc.querySelectorAll('.search-result p')].every(el => el.textContent.startsWith('Course ·')));
assert.equal(doc.querySelector('[data-result-type=Cheatsheet]').getAttribute('aria-pressed'), 'false');
input(main, '#library-query', 'Git');
assert.equal(doc.querySelectorAll('.search-result').length, 0);
assert.match(doc.querySelector('[data-result-count]').textContent, /Choose All/);
doc.querySelector('[data-result-type=all]').click();
assert.ok(doc.querySelectorAll('.search-result').length > 0);
assert.equal(new URL(main.window.location.href).searchParams.has('type'), false);
doc.querySelector('[data-close-search]').click();
const filteredLink = page('teaching.html', '?q=autograd&type=Cheatsheet');
const filteredDoc = filteredLink.window.document;
assert.match(filteredDoc.querySelector('[data-results]').textContent, /Backpropagation & Autograd/);
assert.ok([...filteredDoc.querySelectorAll('.search-result p')].every(el => el.textContent.startsWith('Cheatsheet ·')));

// Crawlability, escaping, local assets and preservation are checked on the static pages.
for (const filename of ['teaching.html', 'teaching-videos.html']) {
  const staticDoc = new JSDOM(read(filename)).window.document;
  const ids = [...staticDoc.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
  assert.equal(staticDoc.querySelector('[name=robots]')?.content.includes('noindex') || false, false);
  assert.ok(staticDoc.querySelector('link[rel=canonical]'));
  for (const el of staticDoc.querySelectorAll('[href], [src]')) {
    const url = el.getAttribute('href') || el.getAttribute('src');
    if (/^(https?:|mailto:|data:|#)/.test(url)) continue;
    assert.ok(fs.existsSync(path.join(root, url.split(/[?#]/)[0])), url);
  }
  assert.equal(/Listed|↗|>Films</.test(read(filename)), false);
}
const noJS = new JSDOM(read('teaching-videos.html')).window.document;
assert.equal(visible(noJS, '[data-video]').length, 562);
assert.equal(new Set(catalog.videos.map(v => v.id)).size, 562);
const seven = catalog.collections.find(c => c.id === 'seven-ideas-ml');
assert.equal(seven.video_ids.length, 8);
assert.equal(seven.video_ids.includes('CwfzBxAv_mE'), true);
assert.equal(seven.url, 'https://www.youtube.com/playlist?list=PLDhLa2ZdfNzw');
assert.equal(catalog.collections.some(c => ['ml-history', 'ml-2019-extras', 'ipad', 'summer-school-2025'].includes(c.id)), false);
for (const filename of ['teaching.html', 'teaching-videos.html']) {
  assert.doesNotMatch(read(filename), /No public videos|2019 extras|iPad tips|ACM India Summer School|AI for social good summer school/);
}
const currentDL = catalog.courses.find(c => c.code === 'ES667' && c.semester === 'Aug 2026');
assert.equal(currentDL.recordings, true);
assert.equal(currentDL.recording_url, 'https://www.youtube.com/playlist?list=PLGRBnxCA2r9c');
assert.equal(catalog.collections.find(c => c.id === 'dl-2026').video_ids.length, 7);
assert.equal(catalog.collections.some(c => /films|research|lab talks|nilmtk/i.test(c.title)), false);

// The original table is the source of truth for semester and recording flags.
const oldPath = path.join(root, 'output/teaching/teaching-before-compact.html');
if (fs.existsSync(oldPath)) {
  const old = new JSDOM(fs.readFileSync(oldPath, 'utf8')).window.document;
  const original = [...old.querySelectorAll('.course-list tbody')].flatMap(group =>
    [...group.querySelectorAll('tr')].filter(row => row.querySelector('td')).map(row => ({
      year: group.querySelector('th').textContent, semester: row.cells[0].textContent,
      code: row.cells[1].textContent,
      title: row.cells[2].textContent.replace('Current', '').trim(),
      url: row.cells[3].querySelector('a').getAttribute('href'),
      recordings: !!row.querySelector('.yt-icon')
    })));
  // The current DL playlist was explicitly made public after the original table.
  original.find(c => c.code === 'ES667' && c.semester === 'Aug 2026').recordings = true;
  assert.deepEqual(catalog.courses.map(({year,semester,code,title,url,recordings}) => ({year,semester,code,title,url,recordings})), original);
}
console.log('PASS: course preservation (11 course rows, 25 offering chips), all teaching playlists on home page, 86 cheatsheets, filters, search, pagination, deep links, navigation, static indexing, assets and shared navigation.');
