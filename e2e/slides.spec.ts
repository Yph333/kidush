// Screenshot every slide in both modes, and check each one renders cleanly:
// no console errors, no horizontal page scroll, title present.
// Screenshots: e2e/__screenshots__/<project>/<mode>/<nn>-<chapter>-<slide>.png

import { expect, test } from '@playwright/test';
import { RAMBAM_PATHS, SLIDE_PATHS } from '../src/content/paths';

const MODES = ['explore', 'present'] as const;
const YEAR = 5787;

for (const mode of MODES) {
  test.describe(mode, () => {
    [...SLIDE_PATHS, ...RAMBAM_PATHS].forEach((path, i) => {
      test(`${String(i + 1).padStart(2, '0')} ${path}`, async ({ page }, info) => {
        const errors: string[] = [];
        // Google Fonts may time out; the site must work with fallback fonts, so those failures are not errors.
        page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location().url)) errors.push(m.text()); });
        page.on('pageerror', e => errors.push(String(e)));

        await page.goto(`/#/${path}?y=${YEAR}&city=0&mode=${mode}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('#slide-title')).toBeVisible();
        if (await page.locator('.scene3d').count()) {
          await page.locator('.scene-host canvas, .scene-2d svg').first().waitFor();
          await page.waitForTimeout(300);
        }

        const overflow = await page.evaluate(() => {
          const out: string[] = [];
          const deck = document.querySelector('#deck') as HTMLElement;
          if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page ${document.documentElement.scrollWidth}>${window.innerWidth}`);
          if (deck && deck.scrollWidth > deck.clientWidth + 1) out.push(`deck ${deck.scrollWidth}>${deck.clientWidth}`);
          return out;
        });
        expect(overflow, 'horizontal overflow').toEqual([]);

        const name = `${String(i + 1).padStart(2, '0')}-${path.replaceAll('/', '-')}.png`;
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
  await page.getByRole('button', { name: 'אני לא יודע/ת' }).click();
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
  const idk = page.getByRole('button', { name: 'אני לא יודע/ת' });
  await idk.click(); await idk.click();                       // length, then type
  await expect(page.locator('.step.final .sv')).toContainText('חסרה');
  await page.getByRole('button', { name: 'שנה הבאה' }).last().click();
  await expect(page.getByRole('button', { name: /חזרה לשנת ההדגמה/ })).toBeVisible();
  await expect(page.locator('.gate.open')).toBeVisible();     // a different year has its own guess
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
  await page.locator('.gate.open').getByRole('button', { name: 'כן', exact: true }).click();
  await expect(page.locator('.gate.done')).toContainText('נכון');
  await expect(page.locator('.result')).toContainText('ליל ב׳ אייר ד׳תתקל״ח');
  await expect(page.locator('.vpair .engine').nth(1)).toContainText('11° 11′');
});

// The whole path for 5787 by guessing (answers from tests/vectors.json), then check the map.
test('guess path for 5787: every gate answered, facts revealed', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const gate = () => page.locator('.gate.open');
  const go = async (path: string) => { await page.goto(`/#/${path}?y=5787&city=0&mode=explore`); await expect(page.locator('#slide-title')).toBeVisible(); };
  const yes = (v: boolean) => gate().getByRole('button', { name: v ? 'כן' : 'לא', exact: true }).click();

  await go('shana/katan'); await yes(true);
  await go('luach/odfim'); await gate().getByRole('button', { name: 'שבת' }).click();
  await go('luach/sugim');
  await gate().getByRole('spinbutton').fill('385'); await gate().getByRole('button', { name: 'ניחוש' }).click();
  await gate().getByRole('radio', { name: 'שלמה' }).click(); await gate().getByRole('button', { name: 'ניחוש' }).click();
  for (const d of ['adu', 'zaken', 'gatrad', 'betu']) { await go(`dechiyot/${d}`); await yes(false); }
  await go('luach/keviut'); await gate().getByRole('radio', { name: 'זשה' }).click(); await gate().getByRole('button', { name: 'ניחוש' }).click();
  await go('kelim/machshevon'); await gate().getByRole('button', { name: 'שבת' }).click();

  await expect(page.locator('.gate.open')).toHaveCount(0);
  await expect(page.locator('.gate.done.bad')).toHaveCount(0);
  const map = page.getByRole('navigation', { name: 'מפת התקדמות' });
  await expect(map.locator('.guess-path')).toContainText('ענינו על 10 מתוך 10, מהם 10 נכון');
  await expect(map.locator('.computed')).toContainText('זשה');
  await expect(map.locator('.computed')).toContainText('385 ימים, שלמה');
  await page.screenshot({ path: 'e2e/__screenshots__/desktop/guess-path-complete.png', fullPage: true });
});

test('a wrong guess is marked and can be hidden again', async ({ page }) => {
  await page.goto('/#/shana/katan?y=5787&city=0&mode=explore');
  await page.locator('.gate.open').getByRole('button', { name: 'לא', exact: true }).click();
  await expect(page.locator('.gate.done.bad')).toContainText('לא בדיוק');
  await page.getByRole('button', { name: 'להסתיר שוב' }).click();
  await expect(page.locator('.gate.open')).toBeVisible();
});

test('presentation mode: the teacher can reveal without guessing', async ({ page }) => {
  await page.goto('/#/luach/keviut?y=5787&city=0&mode=present');
  await page.locator('.gate.open').getByRole('button', { name: 'חשוף' }).click();
  await expect(page.locator('.gate.done')).toContainText('זשה');
  await expect(page.locator('tr.hl .sig')).toHaveText('זשה');
});

test('sandbox: switching off גטר״ד produces a 356-day year, fast', async ({ page }, info) => {
  await page.goto('/#/dechiyot/argaz?y=5787&city=0&mode=explore');
  await page.getByRole('switch').nth(0).check();          // turn לא אד״ו back on
  await page.getByRole('switch').nth(2).uncheck();        // גטר״ד off
  await expect(page.locator('.bars tr.bad').filter({ hasText: '356' })).toBeVisible();
  const ms = Number((await page.locator('.note', { hasText: 'מילישניות' }).innerText()).match(/(\d+)\s*מילישניות/)![1]);
  expect(ms).toBeLessThan(1000);
  await page.locator('.bars tr.bad .ex').first().click();
  await expect(page.locator('.ex-list')).toContainText('356');
  if (info.project.name === 'desktop') await page.screenshot({ path: 'e2e/__screenshots__/desktop/sandbox-gatrad-off.png', fullPage: true });
});

test('zmanim: picking an opinion changes the time and the annual table; CSV downloads', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/#/yom/zmanim?y=5787&city=0&mode=explore');
  const tzeit = page.locator('.zt tbody tr').filter({ hasText: 'צאת הכוכבים' });
  const before = await tzeit.locator('.ztime').innerText();
  await tzeit.getByRole('radio', { name: /רבנו תם, 72/ }).click();
  await expect(tzeit.locator('.ztime')).not.toHaveText(before);
  await page.goto('/#/yom/shnati?y=5787&city=0&mode=explore');
  await expect(page.locator('.annual thead')).toContainText('רבנו תם, 72 דקות');
  const rows = await page.locator('.annual tbody tr').count();
  expect(rows).toBe(385);                         // תשפ״ז is a 385-day year
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'הורדה כ־CSV' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^zmanim-.*-5787\.csv$/);
  const text = await (await dl.createReadStream()).toArray().then(b => Buffer.concat(b).toString('utf8'));
  expect(text.split('\r\n').filter(Boolean)).toHaveLength(386);
  expect(text).toContain('צאת הכוכבים (רבנו תם, 72 דקות)');
});

test('horizon: a ridge in the east delays the visible sunrise', async ({ page }) => {
  await page.goto('/#/yom/gova?y=5787&city=0&mode=explore');
  const last = page.locator('.step.final .ss');
  const open = await last.innerText();
  await page.getByRole('button', { name: 'הרים במזרח' }).click();
  await expect(last).not.toHaveText(open);
  const m = (await last.innerText()).match(/זריחה\s*(-?[\d.]+)/);
  expect(Number(m![1])).toBeGreaterThan(5);
});

test.describe('3D scenes', () => {
  for (const [path, views] of [['chodesh/natui', 3], ['chodesh/likuyim', 3], ['yom/kipa', 3], ['shana/tekufot', 3], ['reiya/galgalim', 3]] as const) {
    test(`${path}: renders, switches views, and has a 2D version`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(`/#/${path}?y=5787&city=0&mode=explore`);
      const hasGL = await page.evaluate(() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); });
      if (hasGL) {
        await expect(page.locator('.scene-host canvas')).toHaveCount(1, { timeout: 15_000 });   // scenes with photographic textures load slower under load
        const bar = page.getByRole('group', { name: 'מבטים' });
        await expect(bar.getByRole('button')).toHaveCount(views);
        await bar.getByRole('button').nth(1).click();
        await expect(bar.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
        await page.getByRole('button', { name: 'תצוגה דו־ממדית' }).click();
      }
      await expect(page.locator('.scene-2d svg')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test('monthly calendar: Av 5782 shows Tisha BeAv postponed to Sunday', async ({ page }) => {
  await page.goto('/#/kelim/luach?y=5782&city=0&mode=explore');
  await page.locator('.cal-slide select').first().selectOption({ label: 'אב' });
  const cell = page.locator('.cal td').filter({ hasText: 'תשעה באב' });
  await expect(cell).toHaveCount(1);
  await expect(cell).toContainText('(נדחה)');
  await expect(cell).toContainText('7/8');
  expect(await cell.evaluate(td => (td as HTMLTableCellElement).cellIndex)).toBe(0);   // Sunday column
});

test('Rambam tables: the worked example highlights the right rows', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/#/reiya/tavlaot?y=5787&city=0&mode=explore');
  await page.getByRole('button', { name: /הדוגמה של הרמב״ם/ }).click();
  await expect(page.locator('.slide')).toContainText('ליל ב׳ אייר');
  const card = (t: string) => page.locator('.tcard').filter({ hasText: t });
  await expect(card('המרחק הכפול').locator('tr.hl')).toContainText('32°–38°');
  await expect(card('מנת המסלול של הירח').locator('tr.hl')).toHaveCount(2);
  await expect(card('קיצי הראייה').locator('tr.hl')).toContainText('11°');
  await expect(card('קיצי הראייה')).toContainText('11° 11′');
});

test('horizon phase B: the computed SRTM profile for Eilat makes sunset much earlier', async ({ page }) => {
  await page.goto('/#/yom/gova?y=5787&city=5&mode=explore');
  await page.getByRole('button', { name: /שלב ב׳/ }).click();
  await expect(page.getByRole('button', { name: /שלב ב׳/ })).toHaveAttribute('aria-pressed', 'true');
  const m = (await page.locator('.step.final .ss').innerText()).match(/שקיעה\s*(-?[\d.]+)/);
  expect(Number(m![1])).toBeLessThan(-15);
});

test.describe('3D scenes move', () => {
  for (const path of ['chodesh/natui', 'chodesh/likuyim', 'yom/kipa', 'shana/tekufot', 'reiya/galgalim']) {
    test(`${path}: mouse drag rotates the view; play animates; auto-rotate spins`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop');
      await page.goto(`/#/${path}?y=5787&city=0&mode=explore`);
      const canvas = page.locator('.scene-host canvas');
      await expect(canvas).toHaveCount(1, { timeout: 15_000 });
      await page.waitForTimeout(500);
      const shot = () => canvas.screenshot();

      // drag with the mouse
      const a = await shot();
      const box = (await canvas.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(200);
      const b = await shot();
      expect(b.equals(a), 'view changed after dragging').toBe(false);

      // play
      const play = page.locator('.play-btn');
      await play.click();
      await expect(play).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(800);
      const c = await shot();
      await play.click();
      await expect(play).toHaveAttribute('aria-pressed', 'false');
      expect(c.equals(b), 'scene changed while playing').toBe(false);

      // auto-rotate
      await page.getByRole('button', { name: 'סיבוב אוטומטי' }).click();
      await page.waitForTimeout(600);
      const d = await shot();
      await page.getByRole('button', { name: 'עצירת הסיבוב' }).click();
      expect(d.equals(c), 'camera spun').toBe(false);
    });
  }
});

test('guided explanation: steps, keyboard inside the card, and the "read" mark in the map', async ({ page }) => {
  await page.goto(`/#/dechiyot/adu?y=${YEAR}&city=0&mode=explore`);
  const guide = page.getByRole('region', { name: 'הסבר מודרך' });
  await expect(guide).toBeVisible();
  await expect(guide.locator('.guide-count')).toHaveText(/צעד\s*1\s*מתוך\s*7/);
  await guide.getByRole('button', { name: 'הצעד הבא' }).click();
  await expect(page.locator('.step.focus')).toContainText('יום כיפור');           // step 2 points at the Yom Kippur row
  await page.keyboard.press('ArrowLeft');                                          // focus is in the card: next step, same slide
  await expect(page).toHaveURL(/dechiyot\/adu/);
  await expect(guide.locator('.guide-count')).toHaveText(/צעד\s*3\s*מתוך\s*7/);
  await guide.getByRole('button', { name: /צעד 7:/ }).click();
  await expect(guide.getByRole('button', { name: /לשקף הבא: מולד זקן/ })).toBeVisible();
  // phone: the map is a drawer, opened by ☰; desktop: a column (☰ there folds it away)
  if (!(await page.locator('.map').isVisible())) await page.getByRole('button', { name: /מפת השיעור/ }).click();
  await expect(page.locator('.map').getByRole('button', { name: /לא אד״ו/ }).locator('.guide-tag')).toBeVisible();
});

test('guided explanation is folded in presentation mode', async ({ page }) => {
  await page.goto(`/#/dechiyot/lama?y=${YEAR}&city=0&mode=present`);
  await expect(page.getByRole('region', { name: 'הסבר מודרך' })).toHaveCount(0);
  await page.getByRole('button', { name: /הסבר מודרך/ }).click();
  await expect(page.getByRole('region', { name: 'הסבר מודרך' })).toBeVisible();
});

test('Rambam track: a guide step lights up its words, and "next" stays inside the track', async ({ page }) => {
  await page.goto(`/#/rambam/14/1?y=${YEAR}&city=0&mode=explore`);
  await expect(page.locator('#slide-title')).toHaveText('שני גלגלים, שני מהלכים');
  await expect(page.locator('.rt-mark')).toHaveText(['הירח שני מהלכים אמצעיים יש לו']);
  const guide = page.getByRole('region', { name: 'הסבר מודרך' });
  await guide.getByRole('button', { name: /צעד 6:/ }).click();
  await expect(page.locator('.rt-mark')).toHaveCount(2);
  await expect(guide.locator('.guide-quote')).toContainText('סימנם י״ג יל״ה');
  await page.getByRole('button', { name: 'יום קדימה' }).click();
  await expect(page.locator('.facts')).toContainText('14° 25′ 18″ במזל שור');     // 1° 14′ 43″ + 13° 10′ 35″
  await expect(page.locator('.bot .pos')).toHaveText(`${RAMBAM_PATHS.indexOf('rambam/14/1') + 1}/${RAMBAM_PATHS.length}`);   // the bottom bar counts this track only
  await page.locator('.bot .nb.next').click();
  await expect(page).toHaveURL(/rambam\/14\/2/);
  await page.goto(`/#/${RAMBAM_PATHS[RAMBAM_PATHS.length - 1]}?y=${YEAR}&city=0&mode=explore`);
  await expect(page.locator('.bot .nb.next')).toBeDisabled();                         // the track's end, not the topics
});

test('desktop: the lesson map column folds away and comes back', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a drawer on phones');
  await page.goto(`/#/rambam/10/1?y=${YEAR}&city=0&mode=explore`);
  const map = page.locator('.map'), btn = page.getByRole('button', { name: /מפת השיעור/ });
  await expect(map).toBeVisible();
  await btn.click();
  await expect(map).toBeHidden();
  await page.reload();
  await expect(map).toBeHidden();                                                   // remembered
  await btn.click();
  await expect(map).toBeVisible();
});

test('home: two equal ways in', async ({ page }) => {
  await page.goto(`/#/yesodot/petiha?y=${YEAR}&city=0&mode=explore`);
  await page.getByRole('button', { name: /הלכה הלכה ברמב״ם/ }).click();
  await expect(page).toHaveURL(new RegExp(RAMBAM_PATHS[0].replaceAll('/', '\\/')));
});
