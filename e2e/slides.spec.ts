// Screenshot every slide in both modes, and check each one renders cleanly:
// no console errors, no horizontal page scroll, title present.
// Screenshots: e2e/__screenshots__/<project>/<mode>/<nn>-<chapter>-<slide>.png

import { expect, test } from '@playwright/test';
import { SLIDE_PATHS } from '../src/content/paths';

const MODES = ['explore', 'present'] as const;
const YEAR = 5787;

for (const mode of MODES) {
  test.describe(mode, () => {
    SLIDE_PATHS.forEach((path, i) => {
      test(`${String(i + 1).padStart(2, '0')} ${path}`, async ({ page }, info) => {
        const errors: string[] = [];
        // Google Fonts may time out; the site must work with fallback fonts, so those failures are not errors.
        page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location().url)) errors.push(m.text()); });
        page.on('pageerror', e => errors.push(String(e)));

        await page.goto(`/#/${path}?y=${YEAR}&city=0&mode=${mode}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('#slide-title')).toBeVisible();

        const overflow = await page.evaluate(() => {
          const out: string[] = [];
          const deck = document.querySelector('#deck') as HTMLElement;
          if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page ${document.documentElement.scrollWidth}>${window.innerWidth}`);
          if (deck && deck.scrollWidth > deck.clientWidth + 1) out.push(`deck ${deck.scrollWidth}>${deck.clientWidth}`);
          return out;
        });
        expect(overflow, 'horizontal overflow').toEqual([]);

        const name = `${String(i + 1).padStart(2, '0')}-${path.replace('/', '-')}.png`;
        // full content of the slide (the deck scrolls internally)
        const deck = page.locator('#deck');
        const h = await deck.evaluate(el => el.scrollHeight);
        await page.setViewportSize({ width: page.viewportSize()!.width, height: Math.min(Math.max(h + 140, page.viewportSize()!.height), 6000) });
        await page.screenshot({ path: `e2e/__screenshots__/${info.project.name}/${mode}/${name}` });
        expect(errors, 'console errors').toEqual([]);
      });
    });
  });
}

test('mode toggle keeps the slide; URL carries year and mode', async ({ page }) => {
  await page.goto(`/#/luach/keviut?y=5785&city=0&mode=explore`);
  await expect(page.locator('#slide-title')).toHaveText('קביעות השנה');
  await page.keyboard.press('p');
  await expect(page).toHaveURL(/luach\/keviut\?y=5785&city=0&mode=present/);
  await expect(page.locator('#slide-title')).toHaveText('קביעות השנה');
  await expect(page.locator('tr.hl .sig')).toHaveText('השא');
});

test('keyboard navigation: ArrowLeft = next (RTL)', async ({ page }) => {
  await page.goto(`/#/yesodot/petiha?y=${YEAR}&city=0&mode=present`);
  await expect(page.locator('#slide-title')).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/yesodot\/yehidot/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/yesodot\/petiha/);
});

test('demo year drives the slides and a temporary detour returns to it', async ({ page }) => {
  await page.goto(`/#/luach/sugim?y=5784&city=0&mode=explore`);
  await expect(page.locator('.step.final .sv')).toContainText('חסרה');
  await page.getByRole('button', { name: 'שנה הבאה' }).last().click();
  await expect(page.getByRole('button', { name: /חזרה לשנת ההדגמה/ })).toBeVisible();
  await page.getByRole('button', { name: /חזרה לשנת ההדגמה/ }).click();
  await expect(page.locator('.step.final .sv')).toContainText('חסרה');
});

test('teacher notes open with N, glossary opens from a term', async ({ page }) => {
  await page.goto(`/#/yesodot/yehidot?y=${YEAR}&city=0&mode=present`);
  await expect(page.locator('#slide-title')).toBeVisible();
  await page.keyboard.press('n');
  await expect(page.getByRole('complementary', { name: 'הערות למורה' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.term').first().click();
  await expect(page.getByRole('dialog', { name: 'מילון מושגים' })).toContainText('1/1080');
});

test('Rambam example: loads 2 Iyar 4938 and both methods agree on visible', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto(`/#/reiya/reiya?y=${YEAR}&city=0&mode=explore`);
  await page.getByRole('button', { name: /טען את הדוגמה של הרמב״ם/ }).click();
  await expect(page.locator('.result')).toContainText('ליל ב׳ אייר ד׳תתקל״ח');
  await expect(page.locator('.vpair .engine').nth(1)).toContainText('11° 11′');
});
