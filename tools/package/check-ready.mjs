// CI check of the ready package: its own browser, with the graphics card switched off, opens the site from
// file:// and draws a 3D scene (software rendering), offline.  node tools/package/check-ready.mjs <ready folder>
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const dir = process.argv[2];
const find = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { const r = find(p); if (r) return r; } else if (f === 'chrome.exe') return p; } return null; };
const exe = find(join(dir, 'browser'));
if (!exe) throw new Error('no chrome.exe in the ready package');
const b = await chromium.launch({ executablePath: exe, args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ offline: true });
const p = await ctx.newPage();
await p.goto(`${pathToFileURL(join(dir, 'site', 'index.html')).href}#/rambam/10/7?y=5787&city=0&mode=explore`);
await p.locator('.scene-host canvas').first().waitFor({ timeout: 30_000 });
console.log('ready package OK: 3D drawn by', exe);
await b.close();
