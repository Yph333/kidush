// One-click launcher: starts the dev server, opens the browser, and stops the server when the browser is
// closed or nobody has used the page for a while. Used by start.bat; the app code is not touched — a tiny
// heartbeat script is injected into the page by a plugin that exists only here.
//
//   node tools/launcher/start.mjs [--idle=20] [--port=5173]
//     --idle  minutes without mouse/keyboard/touch in any open tab before the server stops (default 20)

import { createServer } from 'vite';
import { spawn } from 'node:child_process';

const arg = (name, def) => {
  const a = process.argv.find(s => s.startsWith(`--${name}=`));
  return a ? Number(a.split('=')[1]) : def;
};
const IDLE_MIN = arg('idle', 20);
const PORT = arg('port', 5173);
const STALE_MS = 90_000;           // a tab whose heartbeat stopped this long ago no longer counts for "in use"
const CLOSE_GRACE_MS = 10_000;     // after the last tab closes, wait this long in case it was only a reload
const FIRST_PING_MS = 120_000;     // if the browser never connects, give up after this long
const PING_MS = 15_000;

/** tab id -> { seen: last heartbeat time, active: last user activity time } */
const tabs = new Map();
const started = Date.now();
let sockets = 0, lastClose = 0, tabsEver = false;

// runs in the page: a heartbeat every 15 s with the time of the last mouse / keyboard / touch use
const CLIENT = `
(() => {
  const id = Math.random().toString(36).slice(2);
  let active = Date.now();
  for (const t of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'])
    addEventListener(t, () => { active = Date.now(); }, { passive: true, capture: true });
  const ping = () => fetch('/__launcher/ping', { method: 'POST', body: JSON.stringify({ id, idle: Date.now() - active }) }).catch(() => {});
  ping(); setInterval(ping, ${PING_MS});
})();`;

const launcher = {
  name: 'luach-launcher',
  transformIndexHtml: () => [{ tag: 'script', children: CLIENT, injectTo: 'body' }],
  configureServer(server) {
    // the page's live-reload socket closes the moment its tab is closed: the reliable "browser closed" signal
    server.ws.on('connection', socket => {
      sockets++;
      tabsEver = true;
      socket.on('close', () => { sockets--; lastClose = Date.now(); });
    });
    server.middlewares.use((req, res, next) => {
      if (req.method !== 'POST' || req.url !== '/__launcher/ping') return next();
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        const now = Date.now();
        try { const { id, idle } = JSON.parse(body); tabs.set(id, { seen: now, active: now - Math.max(0, +idle || 0) }); } catch { /* ignore */ }
        res.statusCode = 204;
        res.end();
      });
    });
  },
};

const server = await createServer({ plugins: [launcher], server: { port: PORT, open: false } });
await server.listen();
const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${PORT}/`;

console.log(`\n  Luach is running at ${url}`);
console.log(`  The server stops when the browser tab is closed, or after ${IDLE_MIN} min without use.`);
console.log('  To stop it now, close this window or press Ctrl+C.\n');

// open the default browser
if (process.env.LUACH_NO_OPEN) { /* tests */ } else if (process.platform === 'win32') spawn(process.env.ComSpec || 'cmd.exe', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();

let stopping = false;
async function stop(why) {
  if (stopping) return;
  stopping = true;
  console.log(`\n  Stopping: ${why}.`);
  clearInterval(timer);
  await server.close().catch(() => {});
  process.exit(0);
}

const timer = setInterval(() => {
  const now = Date.now();
  if (sockets === 0) {
    if (tabsEver && now - lastClose > CLOSE_GRACE_MS) return void stop('the browser tab was closed');
    if (!tabsEver && now - started > FIRST_PING_MS) return void stop('no browser tab connected');
    return;
  }
  for (const [id, t] of tabs) if (now - t.seen > STALE_MS) tabs.delete(id);
  if (tabs.size === 0) return;
  const lastActive = Math.max(...[...tabs.values()].map(t => t.active));
  if (now - lastActive > IDLE_MIN * 60_000) stop(`no use for ${IDLE_MIN} minutes`);
}, 5_000);

process.on('SIGINT', () => stop('Ctrl+C'));
process.on('SIGTERM', () => stop('terminated'));
