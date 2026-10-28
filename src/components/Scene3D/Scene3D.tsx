// Generic 3D scene panel: lazy-loads a three.js scene module, offers preset views, and always has a
// 2D version (used automatically when WebGL is unavailable, and selectable by the viewer).

import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SceneHandle, SceneModule, SceneView } from './types';

let glCache: boolean | null = null;
export function webglAvailable(): boolean {
  if (glCache !== null) return glCache;
  try {
    const c = document.createElement('canvas');
    glCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { glCache = false; }
  return glCache;
}

export function Scene3D<P>({ load, props, views, fallback, label, height = 440, play, view: viewProp }: {
  load: () => Promise<SceneModule<P>>;
  /** must be referentially stable between renders when unchanged (useMemo) */
  props: P;
  views: SceneView[];
  /** the 2D version */
  fallback: ReactNode;
  label: string;
  height?: number;
  /** play/pause control for the scene's own animation (shown in 3D and 2D) */
  play?: { playing: boolean; toggle: () => void; label?: string };
  /** drive the view from outside (e.g. a guided step); the viewer can still pick another */
  view?: string;
}) {
  const [hasGL] = useState(webglAvailable);
  const [mode, setMode] = useState<'3d' | '2d'>(hasGL ? '3d' : '2d');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  /** why the 3D scene could not start (shown, so a screenshot tells what went wrong) */
  const [failure, setFailure] = useState<string | null>(null);
  const [view, setView] = useState(viewProp ?? views[0]?.id);
  useEffect(() => {
    if (!viewProp) return;
    setView(viewProp);
    handle.current?.setView(viewProp);
  }, [viewProp]);
  const [spin, setSpin] = useState(false);
  // the labels sometimes cover the wheels and the stars: the viewer can hide them (and the choice is kept between scenes)
  const [labels, setLabels] = useState(() => { try { return localStorage.getItem('luach.sceneLabels') !== 'off'; } catch { return true; } });
  const toggleLabels = () => { const v = !labels; setLabels(v); try { localStorage.setItem('luach.sceneLabels', v ? 'on' : 'off'); } catch { /* storage unavailable */ } };
  // photographic bodies (on) or the schematic look; only scenes that have photographic bodies offer the switch
  const [real, setReal] = useState(true);
  const [canReal, setCanReal] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SceneHandle<P> | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (mode !== '3d') return;
    let dead = false;
    setStatus('loading');
    setFailure(null);
    load().then(m => {
      if (dead || !host.current) return;
      try {
        handle.current = m.create(host.current, latest.current);
        if (view) handle.current.setView(view);
        handle.current.setAutoRotate(spin);
        handle.current.setRealism?.(real);
        setCanReal(!!handle.current.setRealism);
        setStatus('ready');
      } catch (e) {
        setStatus('error');
        setFailure(`יצירת הסצנה נכשלה: ${String((e as Error)?.message ?? e)}`);
        setMode('2d');
      }
    }).catch(e => {
      if (dead) return;
      setStatus('error');
      // after a new version is published the old scene files are gone: a page loaded before that needs a reload
      setFailure(`טעינת קובץ הסצנה נכשלה: ${String((e as Error)?.message ?? e)}`);
      setMode('2d');
    });
    return () => { dead = true; handle.current?.dispose(); handle.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, load]);

  useEffect(() => {
    try { handle.current?.update(props); }
    catch (e) { setFailure(`עדכון הסצנה נכשל: ${String((e as Error)?.message ?? e)}`); setMode('2d'); }
  }, [props]);

  return (
    <div className="scene3d">
      <div className="scene-bar">
        {play && (
          <button type="button" className="btn pri play-btn" aria-pressed={play.playing} onClick={play.toggle}>
            {play.playing ? '❚❚ עצור' : `▶ ${play.label ?? 'הפעל'}`}
          </button>
        )}
        {mode === '3d' && views.length > 1 && (
          <div className="seg" role="group" aria-label="מבטים">
            {views.map(v => (
              <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => { setView(v.id); handle.current?.setView(v.id); }}>{v.label}</button>
            ))}
          </div>
        )}
        <span className="sp" />
        {mode === '3d' && (
          <button type="button" className="btn" aria-pressed={!labels} onClick={toggleLabels} title="הטקסט על המודל: הסתרה והצגה">
            {labels ? 'הסתרת הטקסט' : 'הצגת הטקסט'}
          </button>
        )}
        {mode === '3d' && canReal && (
          <button type="button" className="btn" aria-pressed={real} onClick={() => { setReal(!real); handle.current?.setRealism?.(!real); }}>
            מראה מציאותי
          </button>
        )}
        {mode === '3d' && (
          <button type="button" className="btn" aria-pressed={spin} onClick={() => { setSpin(!spin); handle.current?.setAutoRotate(!spin); }}>
            {spin ? 'עצירת הסיבוב' : 'סיבוב אוטומטי'}
          </button>
        )}
        {hasGL && (
          <button type="button" className="btn" onClick={() => setMode(mode === '3d' ? '2d' : '3d')}>
            {mode === '3d' ? 'תצוגה דו־ממדית' : 'תצוגה תלת־ממדית'}
          </button>
        )}
      </div>
      {mode === '3d' ? (
        <div className={`scene-host${labels ? '' : ' no-labels'}`} ref={host} style={{ height }} role="img" aria-label={label}>
          {status === 'loading' && <div className="scene-loading">טוען את הסצנה…</div>}
        </div>
      ) : (
        <div className="scene-2d">{fallback}</div>
      )}
      {mode === '3d' && <p className="note">גוררים כדי לסובב, גלגלת או צביטה כדי להגדיל.</p>}
      {!hasGL && <p className="note">התלת־ממד לא זמין בדפדפן הזה (WebGL כבוי: אין כרטיס מסך מתאים, או שהאצת החומרה כבויה), ולכן מוצגת הגרסה הדו־ממדית. במחשב עם החבילה המלאה: פותחים את האתר בלחיצה כפולה על <bdi>open-3d.bat</bdi>, והתלת־ממד עובד גם בלי כרטיס מסך.</p>}
      {failure && mode === '2d' && (
        <p className="note scene-fail" role="status">
          לא הצלחנו להציג את התלת־ממד, ולכן מוצגת הגרסה הדו־ממדית. <bdi>{failure}</bdi>{' '}
          <button type="button" className="linkbtn" onClick={() => location.reload()}>טעינה מחדש של העמוד</button>
        </p>
      )}
    </div>
  );
}
