// Export every slide's text into one RTL HTML file for a teacher's read-through:
//   npm run review   →  docs/review/texts.html
// Skipped in the normal e2e run.

import { mkdirSync, writeFileSync } from 'node:fs';
import { test } from '@playwright/test';
import { SLIDE_PATHS } from '../src/content/paths';
import { TEACHER_NOTES } from '../src/content/teacherNotes';
import { SOURCES } from '../src/content/sources';
import { GLOSSARY } from '../src/content/glossary';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paras = (s: string) => s.split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('\n');

test('export slide texts for review', async ({ page }, info) => {
  test.skip(!process.env.REVIEW || info.project.name !== 'desktop');
  test.setTimeout(180_000);
  const parts: string[] = [];
  for (const [i, path] of SLIDE_PATHS.entries()) {
    await page.goto(`/#/${path}?y=5787&city=0&mode=explore`);
    await page.locator('#slide-title').waitFor();
    // open "more" so its text is included
    await page.evaluate(() => document.querySelectorAll('.slide details').forEach(d => d.setAttribute('open', '')));
    const data = await page.evaluate(() => {
      // the home screen (first path) has its own layout; every other path is a slide
      const home = document.querySelector('.home') as HTMLElement | null;
      const text = (home ?? document.querySelector('.slide .text')) as HTMLElement;
      const pick = (sel: string) => [...text.querySelectorAll(sel)].map(e => (e as HTMLElement).innerText.trim()).filter(Boolean);
      return {
        title: (document.querySelector('#slide-title') as HTMLElement).innerText,
        kicker: (document.querySelector('.kicker') as HTMLElement | null)?.innerText ?? '',
        body: home ? pick('.home-intro > p:not(.kicker), .home-start-text > p') : pick(':scope > p, :scope > h3, :scope > blockquote, :scope > table'),
        more: pick(':scope > details > *:not(summary)'),
        gates: [...document.querySelectorAll('.gate .gate-q')].map(e => (e as HTMLElement).innerText.trim()),
      };
    });
    const n = TEACHER_NOTES[path];
    const src = SOURCES[path] ?? [];
    parts.push(`
<section class="slide">
  <h2><span class="num">${i + 1}</span> ${esc(data.title)} <small>${esc(data.kicker)} · ${path}</small></h2>
  <h3>טקסט השקף</h3>${data.body.map(paras).join('\n')}
  ${data.more.length ? `<h3>עוד הסבר (מצב חקירה)</h3>${data.more.map(paras).join('\n')}` : ''}
  ${data.gates.length ? `<h3>שאלות ״נחשו לפני שרואים״</h3><ul>${data.gates.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
  ${n ? `<h3>הערות למורה</h3>
  <p><b>לדיון:</b></p><ul>${n.discussion.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  <p><b>שאלות:</b></p><ul>${n.questions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${n.mistakes.length ? `<p><b>טעויות נפוצות:</b></p><ul>${n.mistakes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}` : ''}
  <h3>מקורות</h3><ul>${src.map(s => `<li>${esc(s.ref)}${s.note ? ` <i>(${esc(s.note)})</i>` : ''}</li>`).join('')}</ul>
  <div class="review"><b>הערות שלי:</b><div class="lines"></div></div>
</section>`);
  }
  const glossary = Object.values(GLOSSARY).map(g => `<dt>${esc(g.term)}</dt><dd>${esc(g.def)}<br><i>מקור: ${esc(g.source)}</i></dd>`).join('\n');
  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>בונים לוח עברי: טקסטים לבדיקה</title>
<style>
body{font-family:Assistant,"Segoe UI",Arial,sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1a2240}
h1{font-family:"Frank Ruhl Libre",David,serif}h2{font-family:"Frank Ruhl Libre",David,serif;border-bottom:2px solid #8e6a0e;padding-bottom:.2rem;margin-top:2.5rem}
h2 small{font-family:inherit;font-size:.8rem;color:#56607e;font-weight:400}h2 .num{color:#8e6a0e}
h3{font-size:1rem;color:#8e6a0e;margin:1.2rem 0 .3rem}blockquote{border-inline-start:4px solid #8e6a0e;margin:.5rem 0;padding:.2rem 1rem;background:#f6f7fa}
.review{border:1px dashed #c7cedd;border-radius:8px;padding:.5rem .8rem;margin-top:1rem}.review .lines{height:5rem;background:repeating-linear-gradient(transparent 0 1.55rem,#e2e7f0 1.55rem 1.6rem)}
dt{font-weight:800;margin-top:.6rem}dd{margin:0}
@media print{.slide{break-inside:avoid-page}h2{margin-top:1.2rem}}
</style></head><body>
<h1>בונים לוח עברי: כל הטקסטים לבדיקה</h1>
<p>נוצר אוטומטית מהאתר (${new Date().toISOString().slice(0, 10)}), בשנת ההדגמה תשפ״ז, ירושלים. לכל שקף: הטקסט, ההסבר המורחב, שאלות הניחוש, הערות המורה והמקורות, ומקום להערות.</p>
${parts.join('\n')}
<h2>מילון מושגים</h2><dl>${glossary}</dl>
</body></html>`;
  mkdirSync('docs/review', { recursive: true });
  writeFileSync('docs/review/texts.html', html);
});
