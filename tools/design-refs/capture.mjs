// Capture design reference screenshots: 1440x900, network idle + canvas painted, a hero shot,
// a hero shot after sweeping the mouse across it, then one shot per viewport scroll to the bottom.
// Usage: node tools/design-refs/capture.mjs [url ...]   → design-refs/<site>/NN-*.png  (git-ignored)

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URLS = process.argv.slice(2).length ? process.argv.slice(2) : [
  'https://thisisdash.com/', 'https://onramper.com/', 'https://linear.app/', 'https://stripe.com/',
  'https://www.solarsystemscope.com/', 'https://3dsolarsystem.online/', 'https://venturi.space/', 'https://www.endurosat.com/',
];
const W = 1440, H = 900, MAX_SHOTS = 30;
const site = (u) => new URL(u).hostname.replace(/^www\./, '');
const pause = (ms) => new Promise(r => setTimeout(r, ms));

async function canvasPainted(page) {
  // wait for every visible canvas to have a non-zero size and a few animation frames behind it
  await page.waitForFunction(() => [...document.querySelectorAll('canvas')]
    .filter(c => c.offsetParent !== null).every(c => c.width > 0 && c.height > 0), null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 30 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
  await pause(1500);
}

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
for (const url of URLS) {
  const dir = join('design-refs', site(url));
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'en-US' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => console.log(`  ${site(url)}: network never idle, continuing`));
    await canvasPainted(page);
    let i = 1;
    const shot = async (name) => { await page.screenshot({ path: join(dir, `${String(i++).padStart(2, '0')}-${name}.png`) }); };
    await shot('hero');

    // sweep the mouse across the hero (left→right, wavy), ending in the middle
    for (let s = 0; s <= 60; s++) await page.mouse.move(80 + (s / 60) * (W - 160), H * 0.45 + Math.sin(s / 6) * 120, { steps: 2 });
    await page.mouse.move(W * 0.6, H * 0.5, { steps: 12 });
    await pause(600);
    await shot('hero-cursor');

    // position = window scroll, or the scrollTop of the tallest scrolling container; pages that scroll-jack
    // (WebGL "scroll" with nothing actually scrolling) are followed by comparing frames instead
    const where = () => page.evaluate(() => {
      let y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      for (const el of document.querySelectorAll('body *')) {
        if (el.scrollHeight - el.clientHeight > max && el.clientHeight > innerHeight / 2 && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
          y = el.scrollTop; max = el.scrollHeight - el.clientHeight;
        }
      }
      return { y: Math.round(y), max };
    });
    let last = -1, lastBuf = null, same = 0, step = 0;
    while (i <= MAX_SHOTS) {
      await page.mouse.wheel(0, H);
      await pause(1500);
      step++;
      const { y, max } = await where();
      const jacked = y === 0 && last <= 0;
      if (jacked && step > 16) break;            // animated scroll-jacked pages never repeat a frame
      if (!jacked && y === last) break;
      last = y;
      await canvasPainted(page).catch(() => {});
      const buf = await page.screenshot();
      if (jacked) {
        if (lastBuf && buf.equals(lastBuf)) { if (++same >= 2) break; continue; }
        same = 0; lastBuf = buf;
      }
      await page.screenshot({ path: join(dir, `${String(i++).padStart(2, '0')}-scroll-${jacked ? `step${step}` : y}.png`) });
      if (!jacked && y >= max - 2) break;
    }
    console.log(`${site(url)}: ${i - 1} shots`);
  } catch (err) {
    console.log(`${site(url)}: FAILED ${err.message.split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();
