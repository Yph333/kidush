// The single-file build must work fully offline: every slide opens from file:// with the network off, makes no
// network request and logs no error, and no work-in-progress label ("TODO", "draft", …) is visible.
// Needs `npm run build:single` first (skipped otherwise).

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { RAMBAM_PATHS, SLIDE_PATHS } from '../src/content/paths';

const FILE = resolve('dist-single/index.html');
const WIP = /TODO|verify|טיוטה|ממתין לאישור|placeholder|lorem|src\/|\.tsx?\b/i;

test('every slide works offline from the single file', async ({ browser }) => {
  test.skip(!existsSync(FILE), 'run npm run build:single first');
  test.setTimeout(20 * 60_000);
  const ctx = await browser.newContext({ offline: true });
  const page = await ctx.newPage();
  const net: string[] = [], errors: string[] = [], wip: string[] = [];
  let at = '';
  page.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) net.push(`${at}: ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error') errors.push(`${at}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${at}: ${e}`));
  const base = pathToFileURL(FILE).href;
  for (const mode of ['explore', 'present']) {
    for (const path of [...SLIDE_PATHS, ...RAMBAM_PATHS]) {
      at = `${mode} ${path}`;
      await page.goto(`${base}#/${path}?y=5787&city=0&mode=${mode}`);
      await expect(page.locator('#slide-title')).toBeVisible();
      if (await page.locator('.scene3d').count()) await page.locator('.scene-host canvas, .scene-2d svg').first().waitFor();
      expect(await page.locator('.scene-fail').count(), `${at}: 3D fell back after an error`).toBe(0);
      const text = await page.locator('body').innerText();
      for (const line of text.split('\n')) if (WIP.test(line)) wip.push(`${at}: ${line.trim()}`);
    }
  }
  expect(net, 'network requests').toEqual([]);
  expect(errors, 'errors').toEqual([]);
  expect([...new Set(wip)], 'work-in-progress labels').toEqual([]);
});
