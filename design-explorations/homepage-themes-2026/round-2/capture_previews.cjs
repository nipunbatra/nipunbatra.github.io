// Use an existing Playwright install via NODE_PATH; no website dependencies.
// PREVIEW_BASE may point at the published preview for post-deployment checks.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:8765/design-explorations/homepage-themes-2026/round-2/';
const images = path.join(__dirname, 'images/rendered');
const output = path.resolve(__dirname, '../../../output/playwright');
const designs = process.env.PREVIEW_DESIGNS?.split(',') || ['swiss', 'editorial', 'index', 'forest'];
const pages = ['index.html', 'teaching.html', 'teaching-videos.html', 'projects.html'];
(async () => {
 fs.mkdirSync(images, { recursive: true });
 fs.mkdirSync(output, { recursive: true });
 const browser = await chromium.launch({ headless: true, ...(process.env.PREVIEW_BROWSER ? { executablePath: process.env.PREVIEW_BROWSER } : {}) });
 const page = await browser.newPage();
 await page.emulateMedia({ reducedMotion: 'reduce' });
 const errors = [], audit = [];
 page.on('pageerror', error => errors.push(error.message));
 for (const width of [1440, 768, 390]) {
  await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
  for (const design of designs) for (const mode of ['light', 'dark']) for (const file of pages) {
   await page.goto(`${base}${file}?design=${design}&mode=${mode}`);
   await page.evaluate(() => document.fonts.ready);
   await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
   const layout = await page.evaluate(() => {
    const bounds = selector => { const b = document.querySelector(selector)?.getBoundingClientRect(); return b ? { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom } : null; };
    return { overflow: document.documentElement.scrollWidth > innerWidth, brokenImages: [...document.images].filter(i => !i.naturalWidth).map(i => i.src), heading: document.querySelector('h1')?.textContent, header: bounds('.site-header'), courses: bounds('.course-table'), sidebar: bounds('.teaching-sidebar'), portrait: bounds('.portrait'), video: bounds('.video-thumb'), conversations: bounds('.conversations'), bio: bounds('.biography'), discovery: bounds('.discovery') };
   });
   const name = `${design}-${mode}-${file.replace('.html', '')}`;
   assert.equal(layout.overflow, false, `${name} overflows at ${width}px`);
   assert.deepEqual(layout.brokenImages, [], `${name}: broken image`);
   if (width === 1440) {
    if (file === 'teaching.html') {
     assert.ok(layout.courses.width > 800, `${name}: courses squeezed`);
     assert.ok(Math.abs(layout.sidebar.width - 358) < 2, `${name}: playlist width changed`);
     assert.ok(Math.abs(layout.header.x - layout.courses.x) < 2, `${name}: extra navigation rail`);
    }
    if (file === 'index.html' && design === 'swiss') assert.ok(Math.abs(layout.portrait.width - layout.video.width) < 2, 'Swiss portrait and interviews must align');
    if (file === 'index.html' && design === 'index') assert.ok(layout.portrait.x < layout.discovery.x, 'Index portrait must be at the left');
    if (file === 'index.html' && design === 'forest') assert.ok(Math.abs(layout.header.x - layout.conversations.x) < 2, 'Forest conversations must span the full width');
    if (!process.env.CHECK_ONLY) await page.screenshot({ path: path.join(images, `${name}.jpg`), type: 'jpeg', quality: 86, fullPage: file === 'index.html' });
    if (file === 'teaching.html') {
     await page.locator('#cheatsheets').scrollIntoViewIfNeeded();
     if (!process.env.CHECK_ONLY) await page.screenshot({ path: path.join(images, `${design}-${mode}-cheatsheets.jpg`), type: 'jpeg', quality: 86 });
    }
   }
   if (width === 390 && design === 'swiss' && !process.env.CHECK_ONLY) await page.screenshot({ path: path.join(output, `${name}-mobile.png`), fullPage: file === 'index.html' });
   audit.push({ design, mode, file, width, ...layout });
  }
  console.log(`PASS: all four pages, ${designs.length} designs and both modes at ${width}px.`);
 }
 // Real browser checks of the interactions most likely to be affected by the theme.
 await page.goto(`${base}teaching.html?design=swiss&mode=light`);
 await page.locator('[data-recordings]').check();
 assert.equal(await page.locator('[data-course]:visible').count(), 7);
 await page.locator('#library-query').fill('autograd PDF');
 await page.waitForFunction(() => document.querySelector('[data-results]').textContent.includes('Backpropagation & Autograd'));
 await page.selectOption('#mode', 'dark');
 assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
 assert.ok(new URL(page.url()).searchParams.has('q'));
 await page.goto(`${base}teaching-videos.html?design=swiss&mode=light`);
 await page.selectOption('[data-collection-filter]', 'seven-ideas-ml');
 assert.equal(await page.locator('[data-video]:visible').count(), 8);
 await page.goto(`${base}projects.html?design=forest&mode=dark`);
 await page.locator('#project-search').fill('autograd playground');
 assert.equal(await page.locator('.project-item:visible').count(), 1);
 assert.deepEqual(errors, [], 'Browser script errors');
 fs.writeFileSync(path.join(output, 'preview-layout-audit.json'), JSON.stringify(audit, null, 2) + '\n');
 console.log('PASS: recordings, teaching search, theme changes, playlist selection and project search in Chromium.');
 await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
