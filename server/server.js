// HanaBlox-Server: liefert das Spiel aus, verwaltet die Kinder-Konten und die gemeinsame Welt.
// Dazu kommen Bot-Freunde, damit niemand alleine spielen muss.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createGameCore } from '../public/js/gamecore.js';
import { sanitizeAvatar } from '../public/js/shared.js';
import { openStore } from './store.js';
import { createAccounts } from './accounts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;

const store = await openStore(ROOT);
const accounts = await createAccounts(store);

// Die Welt wird beim Start geladen und danach im Speicher gehalten; Änderungen gehen sofort in den Speicher.
const worlds = new Map(await store.all('worlds'));
const worldId = (kind, code) => `${kind}_${code}`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

// Das Spiel kann auch von GitHub Pages aus mit diesem Server sprechen
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Nicht gefunden'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function jsonRes(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 200000) { req.destroy(); resolve(null); } });
    req.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
  });
}

const bearer = req => (req.headers.authorization || '').replace(/^Bearer /, '');

// Gegen Passwort-Raten: höchstens 20 Anmelde-Versuche pro 10 Minuten und Adresse
const attempts = new Map();
function tooMany(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter(t => now - t < 600000);
  list.push(now);
  attempts.set(ip, list);
  return list.length > 20;
}

// Profil = Spielstand des Geräts (Figur, Sterne, Aufgaben …) als Schlüssel → Text
function cleanProfile(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p) || typeof p.data !== 'object' || !p.data) return null;
  const data = {};
  for (const [k, v] of Object.entries(p.data).slice(0, 300)) if (typeof k === 'string' && k.length < 80 && typeof v === 'string' && v.length < 20000) data[k] = v;
  try { data.hb_avatar = JSON.stringify(sanitizeAvatar(JSON.parse(data.hb_avatar || 'null'))); } catch { delete data.hb_avatar; }
  return { t: Number(p.t) || Date.now(), data };
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); res.end(); return; }

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  // Lebenszeichen (weckt den schlafenden Online-Server)
  if (url === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', ...CORS }); res.end('ok'); return; }

  // ---------- Konten ----------
  if (url === '/api/register' && req.method === 'POST') {
    if (tooMany(req)) return jsonRes(res, 429, { error: 'Zu viele Versuche. Warte ein paar Minuten.' });
    const b = await readBody(req);
    const r = accounts.register(b?.name, b?.pass);
    if (!r.error && b?.profile) accounts.setProfile(r.token, cleanProfile(b.profile));
    return jsonRes(res, r.error ? 400 : 200, r.error ? r : { ...accounts.me(r.token), token: r.token });
  }
  if (url === '/api/login' && req.method === 'POST') {
    if (tooMany(req)) return jsonRes(res, 429, { error: 'Zu viele Versuche. Warte ein paar Minuten.' });
    const b = await readBody(req);
    const r = accounts.login(b?.name, b?.pass);
    return jsonRes(res, r.error ? 400 : 200, r);
  }
  if (url === '/api/me' && req.method === 'GET') {
    const me = accounts.me(bearer(req));
    return me ? jsonRes(res, 200, me) : jsonRes(res, 401, { error: 'Nicht angemeldet' });
  }
  if (url === '/api/profile' && req.method === 'PUT') {
    const p = cleanProfile(await readBody(req));
    if (!p) return jsonRes(res, 400, { error: 'Ungültig' });
    return accounts.setProfile(bearer(req), p) ? jsonRes(res, 200, { ok: true }) : jsonRes(res, 401, { error: 'Nicht angemeldet' });
  }
  if (url === '/api/logout' && req.method === 'POST') {
    accounts.logout(bearer(req));
    return jsonRes(res, 200, { ok: true });
  }

  if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(PUB, url));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); res.end(); return; }
  sendFile(res, file);
});

// ---------- Gemeinsame Welt ----------
const core = createGameCore({
  log,
  authenticate: token => accounts.byToken(token),
  storage: {
    read: (kind, code) => worlds.get(worldId(kind, code)) ?? null,
    write(kind, code, data) { worlds.set(worldId(kind, code), data); store.set('worlds', worldId(kind, code), data); },
    exists: (kind, code) => worlds.has(worldId(kind, code)),
  },
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
wss.on('connection', ws => {
  const client = core.connect(ws);
  ws.on('pong', () => { client.alive = true; });
  ws.on('message', data => core.message(client, data));
  ws.on('close', () => core.disconnect(client));
  ws.on('error', () => {});
  ws._client = client;
});
setInterval(() => {
  for (const ws of wss.clients) {
    const c = ws._client;
    if (!c) continue;
    if (!c.alive) { ws.terminate(); continue; }
    c.alive = false;
    ws.ping();
  }
}, 20000);

// Vor dem Herunterfahren (Render schläft ein oder startet neu) alles sicher speichern
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  core.saveAll();
  await store.flush();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function log(msg) { console.log(new Date().toLocaleTimeString('de-CH'), msg); }

server.listen(PORT, () => {
  console.log(`\n🎮 HanaBlox läuft! (Speicher: ${store.kind}, ${accounts.count()} Konten)`);
  console.log(`   Auf diesem Computer:   http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`   Im WLAN (Tablet):      http://${a.address}:${PORT}`);
  }
  console.log('');
});
