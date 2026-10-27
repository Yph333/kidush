// Shared bits for chapter 2: the chosen date and place, opinion picks, time display, disclaimer.

import { CITIES } from '../../engines/astro';
import type { ZPlace } from '../../engines/zmanim';
import { localHM } from '../../engines/zmanim';
import { DEFAULT_PICK, ZMAN_BY_ID, type ZmanGroup, type ZmanOpinion } from '../../content/zmanimOpinions';
import { Num } from '../../components/text';
import { setState, useStore } from '../../state/store';

export function useZDay() {
  const iso = useStore(s => s.zDate);
  const city = CITIES[useStore(s => s.city)] ?? CITIES[0];
  const [y, m1, d] = iso.split('-').map(Number);
  const p: ZPlace = { lat: city.lat, lon: city.lon, elevation: city.elevation ?? 0 };
  return { y, m: m1 - 1, d, iso, city, p };
}

const isoOf = (t: number) => new Date(t).toISOString().slice(0, 10);

export function DateControl() {
  const iso = useStore(s => s.zDate);
  const [y, m, d] = iso.split('-').map(Number);
  const shift = (days: number) => setState({ zDate: isoOf(Date.UTC(y, m - 1, d) + days * 86400000) });
  const now = new Date();
  return (
    <div className="fld">תאריך
      <div className="yc">
        <button type="button" aria-label="יום קודם" onClick={() => shift(-1)}>−</button>
        <input type="date" value={iso} aria-label="תאריך" onChange={e => e.target.value && setState({ zDate: e.target.value })} />
        <button type="button" aria-label="יום הבא" onClick={() => shift(1)}>+</button>
        <button type="button" onClick={() => setState({ zDate: isoOf(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) })}>היום</button>
      </div>
    </div>
  );
}

export function CityControl() {
  const city = useStore(s => s.city);
  return (
    <label className="fld">מקום
      <select aria-label="מקום" value={city} onChange={e => setState({ city: +e.target.value })}>
        {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
      </select>
    </label>
  );
}

export function usePick(): (g: ZmanGroup) => ZmanOpinion {
  const pick = useStore(s => s.zPick);
  return g => ZMAN_BY_ID.get(pick[g] ?? DEFAULT_PICK[g]) ?? ZMAN_BY_ID.get(DEFAULT_PICK[g])!;
}

export const setPick = (g: ZmanGroup, id: string) => setState(s => ({ zPick: { ...s.zPick, [g]: id } }));

export const T = ({ ms }: { ms: number | null }) => (ms === null ? <span className="muted">אין</span> : <Num>{localHM(ms)}</Num>);

export function NotARuling() {
  return <p className="disclaimer">מידע לימודי בלבד. כל זמן מוצג כשיטה עם הגדרה ומקור, ואינו פסק הלכה. למעשה יש לשאול רב.</p>;
}

export const MONTHS_HE = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
export const hhmm = (h: number) => { const t = Math.round(h * 60); return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
