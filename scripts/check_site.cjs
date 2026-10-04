// Real-browser checks for the production site. Use an existing Playwright install.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.SITE_BASE || 'http://127.0.0.1:8765/';
const output = path.resolve(__dirname, '../output/site-launch');
const pages = ['index.html', 'teaching.html', 'teaching-videos.html', 'projects.html', 'ml-in-1-minute.html', 'dl-in-3-minutes.html', 'psdv-in-1-minute.html', 'python-in-1-minute.html', 'stai-in-1-minute.html'];
(async () => {
 fs.mkdirSync(output, { recursive: true });
 const browser = await chromium.launch({ headless: true, ...(process.env.SITE_BROWSER ? { executablePath: process.env.SITE_BROWSER } : {}) });
 const page = await browser.newPage();
 await page.emulateMedia({ reducedMotion: 'reduce' });
 const errors = [], audit = [], shells = new Map();
 page.on('pageerror', e => errors.push(e.message));
 for (const width of [1440, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
  for (const mode of ['light', 'dark']) for (const file of pages) {
   await page.goto(base + file, { waitUntil: 'domcontentloaded' });
   await page.selectOption('#appearance', mode);
   await page.evaluate(() => document.fonts.ready);
   await page.locator('img').evaluateAll(images => Promise.all(images.filter(i => new URL(i.src).origin === location.origin).map(i => i.decode().catch(() => {}))));
   const layout = await page.evaluate(() => {
    const bounds = selector => { const b = document.querySelector(selector)?.getBoundingClientRect(); return b ? { x:b.x, y:b.y, width:b.width, right:b.right, height:b.height } : null; };
    const nav = getComputedStyle(document.querySelector('.site-nav')), title = getComputedStyle(document.querySelector('h1'));
    return {
     shell: { nav:bounds('.site-nav'), direction:nav.flexDirection, navFont:nav.fontFamily, navSize:nav.fontSize, titleFont:title.fontFamily, titleSize:title.fontSize, titleWeight:title.fontWeight },
     overflow:document.documentElement.scrollWidth > innerWidth,
     brokenImages:[...document.images].filter(i => new URL(i.src).origin === location.origin && !i.naturalWidth).map(i => i.src),
     theme:document.documentElement.dataset.theme, header:bounds('.site-header'), courses:bounds('.course-table'), sidebar:bounds('.teaching-sidebar'), portrait:bounds('.portrait'), video:bounds('.video-thumb')
    };
   });
   const label = `${file} ${mode} ${width}px`;
   assert.equal(layout.overflow, false, label + ': horizontal overflow');
   assert.deepEqual(layout.brokenImages, [], label + ': broken local image');
   assert.equal(layout.theme, mode);
   const key = `${width}-${mode}`;
   if (file === 'index.html') shells.set(key, layout);
   else {
    const home = shells.get(key);
    for (const dimension of ['x','y','width']) {
     assert.ok(Math.abs(layout.header[dimension] - home.header[dimension]) < 2, `${label}: header ${dimension} differs from Home`);
     assert.ok(Math.abs(layout.shell.nav[dimension] - home.shell.nav[dimension]) < 2, `${label}: menu ${dimension} differs from Home`);
    }
    for (const property of ['direction','navFont','navSize','titleFont','titleSize','titleWeight']) assert.equal(layout.shell[property], home.shell[property], `${label}: ${property} differs from Home`);
   }
   if (width === 1440 && file === 'teaching.html') {
    assert.ok(layout.courses.width >= 565, 'Course table remains readable beside the menu');
    assert.ok(Math.abs(layout.sidebar.width - 280) < 2, 'Compact playlist column');
    assert.ok(layout.courses.x > layout.header.right, 'Courses sit beside the left navigation');
   }
   if (width === 1440 && file === 'index.html') assert.ok(Math.abs(layout.portrait.width - layout.video.width) < 2, 'Portrait and interview alignment');
   if ([1440,390].includes(width) && ['index.html','teaching.html','projects.html','ml-in-1-minute.html'].includes(file)) {
    await page.screenshot({ path:path.join(output, `${file.replace('.html','')}-${mode}-${width}.jpg`), type:'jpeg', quality:85, fullPage:file === 'index.html' });
   }
   audit.push({ file, width, mode, ...layout });
  }
  console.log(`PASS: all nine pages in light/dark at ${width}px; shared menu/type, images, no horizontal overflow.`);
 }
 await page.setViewportSize({ width:1440, height:1000 });
 await page.goto(base + 'teaching.html');
 await page.locator('[data-recordings]').check();
 assert.equal(await page.locator('[data-course]:visible').count(), 7);
 await page.locator('#library-query').fill('autograd PDF');
 await page.waitForFunction(() => document.querySelector('[data-results]').textContent.includes('Backpropagation & Autograd'));
 await page.selectOption('#appearance','light');
 const query = new URL(page.url()).search;
 await page.selectOption('#appearance','dark');
 assert.equal(new URL(page.url()).search, query, 'Changing theme preserves search');
 await page.locator('[data-close-search]').click();
 await page.locator('.course-sheets').first().click();
 assert.ok(await page.locator('.sheet-group[open]').count() > 0);
 await page.goto(base + 'teaching-videos.html');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark', 'Theme persists across pages');
 await page.selectOption('[data-collection-filter]','seven-ideas-ml');
 assert.equal(await page.locator('[data-video]:visible').count(),8);
 await page.selectOption('[data-collection-filter]','');
 assert.equal(await page.locator('[data-video]:visible').count(),30);
 await page.locator('[data-more-videos]').click();
 assert.equal(await page.locator('[data-video]:visible').count(),60);
 await page.goto(base + 'projects.html');
 await page.locator('#project-search').fill('autograd playground');
 assert.equal(await page.locator('.project-item:visible').count(),1);
 for (const file of pages.slice(4)) {
  await page.goto(base + file);
  const total = await page.locator('.lesson-video:visible').count();
  assert.ok(total > 0);
  await page.locator('#video-search').fill('no-such-lesson-xyz');
  assert.equal(await page.locator('.lesson-video:visible').count(),0);
  assert.ok(await page.locator('#empty-state').isVisible());
  await page.locator('#video-search').fill('');
  assert.equal(await page.locator('.lesson-video:visible').count(),total);
 }
 await page.selectOption('#appearance','system');
 await page.emulateMedia({ colorScheme:'light' });
 await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
 await page.emulateMedia({ colorScheme:'dark' });
 await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
 const noJS = await browser.newContext({ javaScriptEnabled:false });
 const staticPage = await noJS.newPage();
 await staticPage.goto(base + 'teaching-videos.html');
 assert.equal(await staticPage.locator('[data-video]:visible').count(),562, 'Videos accessible without JavaScript');
 await staticPage.goto(base + 'teaching.html');
 assert.equal(await staticPage.locator('[data-course]:visible').count(),25);
 assert.equal(await staticPage.locator('.collection:visible').count(),19);
 await noJS.close();
 assert.deepEqual(errors,[], 'Browser script errors');
 fs.writeFileSync(path.join(output,'site-layout-audit.json'), JSON.stringify(audit,null,2) + '\n');
 console.log('PASS: course/search/cheatsheet/playlist/project/series interactions, theme persistence, system appearance and no-JS content.');
 await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
