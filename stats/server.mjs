// Zend stats dashboard: sign-in, sessions and a private proxy to the backend
// statistics API. Node built-ins only (no packages).
//
// The browser never sees the API token: it signs in here, gets a session
// cookie, and calls /api/<route>; this server checks the session and forwards
// the GET to the backend with the token from its own environment.
//
// Environment (see stats/README.md):
//   STATS_READ_TOKEN   backend read token (required)
//   STATS_API_BASE     backend base URL, default http://127.0.0.1:4567
//   STATS_USERS_FILE   dashboard users (made by manage-user.mjs)
//   STATS_PORT         default 4600 (listens on 127.0.0.1 only; nginx in front)
//   STATS_ORIGIN       public origin, e.g. https://stats.zendpay.io
//   STATS_SESSION_HOURS default 12
//   STATS_INSECURE_COOKIE=1 for local testing over http only

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCb);
const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;

const TOKEN = env.STATS_READ_TOKEN ?? '';
const API_BASE = (env.STATS_API_BASE ?? 'http://127.0.0.1:4567').replace(/\/+$/, '');
const USERS_FILE = env.STATS_USERS_FILE ?? '/etc/zend-stats/users.json';
const PORT = Number(env.STATS_PORT ?? 4600);
const ORIGIN = env.STATS_ORIGIN ?? 'https://stats.zendpay.io';
const SESSION_MS = Number(env.STATS_SESSION_HOURS ?? 12) * 3600_000;
const SECURE = env.STATS_INSECURE_COOKIE !== '1';
const COOKIE = SECURE ? '__Host-zs' : 'zs';

if (!/^[\x21-\x7e]{32,256}$/.test(TOKEN)) {
  console.error('STATS_READ_TOKEN is missing or not 32-256 printable characters.');
  process.exit(1);
}

// ---------- Users (scrypt hashes; see manage-user.mjs) ----------
const SCRYPT ={ N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function loadUsers() {
  try {
    return JSON.parse(await readFile(USERS_FILE, 'utf8')).users ?? {};
  } catch {
    return {};
  }
}
const DUMMY = { salt: randomBytes(16).toString('base64'), hash: randomBytes(64).toString('base64') };
async function checkPassword(username, password) {
  const users = await loadUsers();
  const u = Object.hasOwn(users, username) ? users[username] : null;
  const rec = u ?? DUMMY; // same work whether or not the user exists
  const got = await scrypt(password, Buffer.from(rec.salt, 'base64'), 64, SCRYPT);
  const want = Buffer.from(rec.hash, 'base64');
  return Boolean(u) && want.length === got.length && timingSafeEqual(got, want);
}

// ---------- Sessions (in memory: a restart signs everyone out) ----------
const sessions = new Map(); // id -> { user, exp }
function newSession(user) {
  const id = randomBytes(32).toString('base64url');
  sessions.set(id, { user, exp: Date.now() + SESSION_MS });
  return id;
}
function sessionOf(req) {
  const m = (req.headers.cookie ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{43})`));
  if (!m) return null;
  const s = sessions.get(m[1]);
  if (!s) return null;
  if (s.exp < Date.now()) {
    sessions.delete(m[1]);
    return null;
  }
  return { id: m[1], ...s };
}
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) if (s.exp < now) sessions.delete(id);
}, 600_000).unref();
const cookie = (value, maxAgeS) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeS}${SECURE ? '; Secure' : ''}`;

// ---------- Sign-in attempt limits (per IP and per username) ----------
const attempts = new Map(); // key -> { n, until }
const WINDOW_MS = 15 * 60_000;
const MAX_TRIES = 8;
function limited(key) {
  const a = attempts.get(key);
  return Boolean(a && a.until > Date.now() && a.n >= MAX_TRIES);
}
function failed(key) {
  const a = attempts.get(key);
  if (!a || a.until < Date.now()) attempts.set(key, { n: 1, until: Date.now() + WINDOW_MS });
  else a.n++;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, a] of attempts) if (a.until < now) attempts.delete(k);
}, 600_000).unref();

// ---------- Helpers ----------
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
const json = (res, status, obj, headers = {}) =>
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', ...headers });
const clientIp = (req) => String(req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? '');
function sameOrigin(req) {
  const o = req.headers.origin;
  if (o) return o === ORIGIN || (!SECURE && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o));
  return false;
}
async function readBody(req, max = 4096) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw new Error('too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// ---------- Static files (an explicit list; nothing else is served) ----------
const PUB = join(here, 'public');
const FONTS = join(here, '..', 'public', 'fonts');
const FILES = {
  '/': [join(PUB, 'index.html'), true],
  '/login': [join(PUB, 'login.html'), false],
  '/app.css': [join(PUB, 'app.css'), false],
  '/app.js': [join(PUB, 'app.js'), true],
  '/login.js': [join(PUB, 'login.js'), false],
  '/theme.js': [join(PUB, 'theme.js'), false],
  '/favicon.svg': [join(PUB, 'favicon.svg'), false],
  '/fonts/archivo-var.woff2': [join(FONTS, 'archivo-var.woff2'), false],
  '/fonts/archivo-black.woff2': [join(FONTS, 'archivo-black.woff2'), false],
};
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
async function serveFile(res, path) {
  try {
    await stat(path);
    const body = await readFile(path);
    const cache = path.endsWith('.woff2') ? 'public, max-age=31536000, immutable' : 'no-cache';
    send(res, 200, body, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': cache });
  } catch {
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

// ---------- Proxy to the backend statistics API (GET only) ----------
const ROUTE = /^\/api\/(overview|trends|users|payments|links|operations|issues)(\/[A-Za-z0-9%._~-]{1,200})?$/;
async function proxy(req, res, path, query) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40_000);
  try {
    const r = await fetch(`${API_BASE}/api/v1/stats/${path.slice(5)}${query}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
      signal: ctrl.signal,
      redirect: 'error',
    });
    const body = await r.text();
    // The backend's own 401 means OUR token is wrong, not the dashboard user's
    // session: report it as a server problem so the page doesn't sign out.
    const status = r.status === 401 ? 502 : r.status;
    send(res, status, body, { 'Content-Type': 'application/json; charset=utf-8' });
  } catch {
    json(res, 502, { Success: false, Error: 'STATS_UNREACHABLE', Message: 'The statistics service could not be reached.' });
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Routes ----------
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://local');
    const path = url.pathname;
    const s = sessionOf(req);

    if (req.method === 'POST' && path === '/login') {
      if (!sameOrigin(req)) return json(res, 403, { error: 'Bad origin' });
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        return json(res, 400, { error: 'Bad request' });
      }
      const username = String(body?.username ?? '').trim().toLowerCase().slice(0, 64);
      const password = String(body?.password ?? '').slice(0, 256);
      const ip = clientIp(req);
      if (limited(`ip:${ip}`) || limited(`u:${username}`))
        return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      if (!username || !password || !(await checkPassword(username, password))) {
        failed(`ip:${ip}`);
        failed(`u:${username}`);
        return json(res, 401, { error: 'Wrong username or password.' });
      }
      attempts.delete(`u:${username}`);
      const id = newSession(username);
      console.log(`sign-in ${username} from ${ip}`);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(id, Math.floor(SESSION_MS / 1000)) });
    }

    if (req.method === 'POST' && path === '/logout') {
      if (!sameOrigin(req)) return json(res, 403, { error: 'Bad origin' });
      if (s) sessions.delete(s.id);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { Allow: 'GET, POST' });

    if (path === '/api/me') return s ? json(res, 200, { user: s.user }) : json(res, 401, { error: 'Signed out' });

    if (path.startsWith('/api/')) {
      if (!s) return json(res, 401, { Success: false, Error: 'SIGNED_OUT', Message: 'Please sign in again.' });
      if (!ROUTE.test(path)) return json(res, 404, { Success: false, Error: 'NOT_FOUND', Message: 'Unknown statistics route.' });
      return proxy(req, res, path, url.search);
    }

    const file = FILES[path];
    if (!file) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    const [filePath, needsSession] = file;
    if (needsSession && !s) {
      if (path === '/') return send(res, 302, '', { Location: '/login' });
      return send(res, 401, 'Signed out', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    if (path === '/login' && s) return send(res, 302, '', { Location: '/' });
    return serveFile(res, filePath);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Server error' });
  }
});
server.requestTimeout = 60_000;
server.listen(PORT, '127.0.0.1', () => console.log(`zend-stats on http://127.0.0.1:${PORT} -> ${API_BASE}`));
