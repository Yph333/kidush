import { TEACHER_NOTES } from '../content/teacherNotes';
import type { SlidePath } from '../content/paths';
import { setState, useStore } from '../state/store';

export function TeacherNotesPanel() {
  const open = useStore(s => s.notesOpen);
  const path = useStore(s => s.slide);
  if (!open) return null;
  const n = TEACHER_NOTES[path as SlidePath];
  return (
    <aside className="panel notes" aria-label="הערות למורה">
      <div className="panel-h">
        <b>הערות למורה</b>
        <span className="note">מקש N לפתיחה וסגירה</span>
        <button type="button" className="iconbtn" onClick={() => setState({ notesOpen: false })} aria-label="סגירת ההערות">✕</button>
      </div>
      {n ? (
        <div className="notes-cols">
          <section><h4>נקודות לדיון</h4><ul>{n.discussion.map((t, i) => <li key={i}>{t}</li>)}</ul></section>
          <section><h4>שאלות לכיתה</h4><ul>{n.questions.map((t, i) => <li key={i}>{t}</li>)}</ul></section>
          {n.mistakes.length > 0 && <section><h4>טעויות נפוצות</h4><ul>{n.mistakes.map((t, i) => <li key={i}>{t}</li>)}</ul></section>}
        </div>
      ) : <p>אין הערות לשקף הזה.</p>}
    </aside>
  );
}
