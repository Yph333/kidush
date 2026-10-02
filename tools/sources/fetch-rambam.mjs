// Build-time: fetch Rambam, Hilchot Kiddush HaChodesh ch. 6–8 (public domain) from Hebrew Wikisource
// (exact wikitext, "דפוס" = Warsaw-Vilna printing) and write src/content/rambamKH.json.
// Run: node tools/sources/fetch-rambam.mjs

import { writeFileSync } from 'node:fs';

const CHAPTERS = [['ו', 6], ['ז', 7], ['ח', 8]];
const out = { source: 'ויקיטקסט, רמב״ם הלכות קידוש החודש (דפוס וורשא־ווילנא)', fetched: new Date().toISOString().slice(0, 10), chapters: [] };

for (const [heb, n] of CHAPTERS) {
  const title = `רמב"ם הלכות קידוש החודש ${heb}`;
  const url = `https://he.wikisource.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
  const res = await fetch(url, { headers: { 'User-Agent': 'luach-teaching-site/0.1 (build-time source fetch)' } });
  if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
  const raw = await res.text();
  const printed = raw.split(/^==הגהה==/m)[0];              // keep only the printed edition section
  const halachot = [];
  const re = /<קטע התחלה=(\S+) דפוס\/>([\s\S]*?)<קטע סוף=\1 דפוס\/>/g;
  for (let m; (m = re.exec(printed)); ) {
    const text = m[2]
      .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1')
      .replace(/\{\{[^}]*\}\}/g, '').replace(/<[^>]+>/g, '').replace(/'''?/g, '').replace(/\s+/g, ' ').trim();
    halachot.push({ h: m[1], text });
  }
  if (!halachot.length) throw new Error(`${title}: no halachot parsed`);
  out.chapters.push({ n, heb, url: `https://he.wikisource.org/wiki/${encodeURIComponent(title)}`, halachot });
  console.log(`${title}: ${halachot.length} halachot`);
}

writeFileSync('src/content/rambamKH.json', JSON.stringify(out, null, 1) + '\n');
