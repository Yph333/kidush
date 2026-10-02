import { SOURCES } from '../content/sources';
import type { SlidePath } from '../content/paths';

export function SlideSources({ path }: { path: string }) {
  const list = SOURCES[path as SlidePath];
  if (!list?.length) return null;
  return (
    <footer className="sources" aria-label="מקורות">
      <b>מקורות:</b>{' '}
      {list.map((s, i) => (
        <span key={i}>{i > 0 && ' · '}{s.ref}{s.note && <small> ({s.note})</small>}</span>
      ))}
    </footer>
  );
}
