import { useMemo } from 'react';
import { fmtMolad, moladTotal, yearHeb } from '../../engines/calendar';
import { HOUR, hm, yearGaps } from '../../engines/astro';
import { AstroControls, CivStr } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { DHP, Num, Sig } from '../../components/text';
import { hrs, moladLong } from '../../lib/format';
import type { MonthModel } from '../../lib/month';

function GapTimeline({ M, t }: { M: MonthModel; t: number }) {
  const gap = M.mean - M.conj, W = 760;
  const A = Math.min(M.mean, M.conj) - 18 * HOUR, B = Math.max(M.mean, M.conj) + 18 * HOUR;
  const X = (x: number) => W - 20 - (x - A) / (B - A) * (W - 40);
  const ticks: number[] = [];
  for (let x = Math.ceil(A / (6 * HOUR)) * 6 * HOUR; x < B; x += 6 * HOUR) ticks.push(x);
  const close = Math.abs(X(M.conj) - X(M.mean)) < 180;
  return (
    <>
      <p className="vt">{M.name} {yearHeb(M.y)}</p>
      <svg viewBox={`0 0 ${W} 130`} className="full" role="img" aria-label="מולד ממוצע ומולד אמיתי על ציר זמן">
        <line x1="20" y1="70" x2={W - 20} y2="70" className="wtick" strokeWidth="2" />
        {ticks.map(x => (
          <g key={x}>
            <line x1={X(x)} y1="64" x2={X(x)} y2="76" className="wtick" />
            <text x={X(x)} y="94" textAnchor="middle" className="svgt tx-muted" fontSize="11">{hm(x)}</text>
          </g>
        ))}
        <line x1={X(M.mean)} y1="70" x2={X(M.conj)} y2="70" className="st-shift" strokeWidth="6" opacity=".6" />
        <circle cx={X(M.mean)} cy="70" r="9" className="mk-moon" />
        <text x={X(M.mean)} y="44" textAnchor="middle" className="svgt tx-moon" fontWeight="800">מולד ממוצע <tspan direction="ltr" unicodeBidi="isolate">{hm(M.mean)}</tspan></text>
        <circle cx={X(M.conj)} cy="70" r="9" className="mk-leap" />
        <text x={X(M.conj)} y={close ? 22 : 44} textAnchor="middle" className="svgt tx-leap" fontWeight="800">מולד אמיתי <tspan direction="ltr" unicodeBidi="isolate">{hm(M.conj)}</tspan></text>
        {t > A && t < B && <line x1={X(t)} y1="56" x2={X(t)} y2="84" className="st-shift" strokeWidth="2" />}
        <text x={W / 2} y="120" textAnchor="middle" className="svgt" fontWeight="700">הפער: <tspan direction="ltr" unicodeBidi="isolate">{hrs(Math.abs(gap))}</tspan> שעות · הממוצע {gap > 0 ? 'מאחר' : 'מקדים'}</text>
      </svg>
    </>
  );
}

function YearGapChart({ M }: { M: MonthModel }) {
  const G = useMemo(() => yearGaps(M.y), [M.y]);
  const W = 760, n = G.length, bw = (W - 60) / n, Z = 110, sc = 90 / 16;
  return (
    <svg viewBox={`0 0 ${W} 230`} className="full" role="img" aria-label="הפער לכל חודש בשנה">
      <text x={W / 2} y="16" textAnchor="middle" className="svgt" fontWeight="700">הפער בכל חודש של {yearHeb(M.y)} (בשעות; למעלה: הממוצע מאחר)</text>
      <line x1="40" y1={Z} x2={W - 10} y2={Z} className="wtick" />
      {[-12, -6, 6, 12].map(v => (
        <g key={v}>
          <line x1="40" y1={Z - v * sc} x2={W - 10} y2={Z - v * sc} className="wtick" opacity=".35" />
          <text x="32" y={Z - v * sc + 4} className="svgt tx-muted" fontSize="11" textAnchor="end" direction="ltr">{v > 0 ? '+' : ''}{v}</text>
        </g>
      ))}
      {G.map((m, i) => {
        const h = m.gap / HOUR, x = W - 10 - (i + 1) * bw, hh = Math.abs(h) * sc;
        return (
          <g key={m.name}>
            <rect x={x + 4} y={h > 0 ? Z - hh : Z} width={bw - 8} height={Math.max(1, hh)} rx="2" className={i === M.mi ? 'fl-moon' : 'fl-moonsoft'} />
            <text x={x + bw / 2} y="214" textAnchor="middle" className="svgt" fontSize="11" fontWeight={i === M.mi ? 800 : 400}>{m.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function MeanTrue() {
  const v = useAstro();
  const { M, t } = v;
  const gap = M.mean - M.conj, mt = moladTotal(M.y, M.mi);
  return (
    <Slide
      wide
      kicker="ראייה מול חשבון · 1"
      title="הלוח מול השמיים"
      text={<>
        <p>הלוח מחשב <Term k="molad">מולד</Term> <strong>ממוצע</strong>: כל חודש בדיוק כ״ט י״ב תשצ״ג. בשמיים כל חודש שונה. מסלולי הירח וכדור הארץ אליפטיים, ולכן חודש אמיתי נע בין כ־<Num>29</Num> ימים ו־<Num>6</Num> שעות לכ־<Num>29</Num> ימים ו־<Num>20</Num> שעות.</p>
        <Engine><AstroControls v={v} /></Engine>
      </>}
      more={<>
        <p>הפער בין המולד הממוצע למולד האמיתי מגיע ליותר מחצי יום לכל כיוון (עד כ־<Num>15</Num> שעות), ומתקזז לאורך זמן.</p>
        <p>כאן מתחבר הטעם של הרמב״ם לדחיית לא אד״ו: הלוח הולך לפי הממוצע, והדחיות מקרבות אותו לאמת.</p>
        <p className="note">זמני המולד בלוח נמדדים לפי השעה המקומית הממוצעת בירושלים, כ־<Num>2:21</Num> שעות לפני גריניץ׳. כאן הכול מומר לשעון ישראל.</p>
      </>}
      stage={<>
        <Viz><GapTimeline M={M} t={t} /></Viz>
        <Viz className="explore-only"><YearGapChart M={M} /></Viz>
        <Engine>
          <Steps rows={[
            { l: 'המולד הממוצע לפי הלוח', v: <Sig>{fmtMolad(mt)}</Sig>, s: moladLong(mt) },
            { l: 'ממירים לשעון', v: <CivStr ms={M.mean} />, s: 'שעה מקומית ממוצעת בירושלים, מומרת לשעון ישראל' },
            { l: 'המולד האמיתי (התקבצות)', v: <CivStr ms={M.conj} />, s: 'הרגע שבו לירח ולשמש אותו אורך אקליפטי' },
            { l: 'הפער', v: <><Num>{hrs(Math.abs(gap))}</Num> שעות</>, s: gap > 0 ? 'המולד הממוצע מאוחר מהאמיתי' : 'המולד הממוצע מוקדם מהאמיתי', c: 'final' },
            { l: 'אורך החודש האמיתי', v: <DHP t={Math.round((M.next - M.conj) / 3600000 * 1080)} />, s: <>לעומת הממוצע: <Sig>כ״ט י״ב תשצ״ג</Sig></> },
          ]} />
        </Engine>
      </>}
    />
  );
}
