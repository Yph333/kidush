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

export function Scene3D<P>({ load, props, views, fallback, label, height = 440, play }: {
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
}) {
  const [hasGL] = useState(webglAvailable);
  const [mode, setMode] = useState<'3d' | '2d'>(hasGL ? '3d' : '2d');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [view, setView] = useState(views[0]?.id);
  const [spin, setSpin] = useState(false);
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
    load().then(m => {
      if (dead || !host.current) return;
      try {
        handle.current = m.create(host.current, latest.current);
        if (view) handle.current.setView(view);
        handle.current.setAutoRotate(spin);
        handle.current.setRealism?.(real);
        setCanReal(!!handle.current.setRealism);
        setStatus('ready');
      } catch {
        setStatus('error');
        setMode('2d');
      }
    }).catch(() => { if (!dead) { setStatus('error'); setMode('2d'); } });
    return () => { dead = true; handle.current?.dispose(); handle.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, load]);

  useEffect(() => { handle.current?.update(props); }, [props]);

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
        <div className="scene-host" ref={host} style={{ height }} role="img" aria-label={label}>
          {status === 'loading' && <div className="scene-loading">טוען את הסצנה…</div>}
        </div>
      ) : (
        <div className="scene-2d">{fallback}</div>
      )}
      {mode === '3d' && <p className="note">גוררים כדי לסובב, גלגלת או צביטה כדי להגדיל.</p>}
      {!hasGL && <p className="note">הדפדפן לא תומך ב־WebGL, ולכן מוצגת הגרסה הדו־ממדית.</p>}
    </div>
  );
}
