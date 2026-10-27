// A link from a halacha to the topic slide that explains the same thing at length.

import { slideByPath } from '../../chapters';
import { go } from '../../state/nav';

export function TopicLink({ path }: { path: string }) {
  const s = slideByPath(path);
  if (!s) return null;
  return <p className="topic-link"><button type="button" className="linkbtn" onClick={() => go(path)}>במסלול הנושאים: {s.title}</button></p>;
}
