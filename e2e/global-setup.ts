import { rmSync } from 'node:fs';

/** Slide numbers shift as slides are added: start every run with an empty screenshot folder. */
export default function globalSetup() {
  rmSync('e2e/__screenshots__', { recursive: true, force: true });
}
