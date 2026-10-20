// HanaBlox-Server: liefert das Spiel aus und verbindet Spieler in privaten Räumen (per Code).
// Dazu kommen Bot-Freunde, damit niemand alleine spielen muss.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createGameCore } from '../public/js/gamecore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data', 'builds');
const TOWNS = path.join(ROOT, 'data', 'towns');
const ACCOUNTS = path.join(ROOT, 'data', 'accounts');
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(TOWNS, { recursive: true });
fs.mkdirSync(ACCOUNTS, { recursive: true });

// ---------- Firebase Admin: prüft Anmelde-Tokens der Eltern ----------
// Ohne Schlüsseldatei reicht die Projekt-ID: Google-Signaturen werden trotzdem geprüft.
let fbAdmin = null;
try {
  const admin = (await import('firebase-admin')).default;
  const keyFile = path.join(ROOT, 'firebase-service-account.json');
  if (fs.existsSync(keyFile)) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyFile, 'utf8'))) });
  else {
    const { firebaseConfig } = await import('../public/js/firebase-config.js');
    admin.initializeApp({ projectId: firebaseConfig.projectId });
  }
  fbAdmin = admin;
} catch (e) { console.warn('Firebase Admin nicht geladen – Eltern-Konten sind deaktiviert:', e.message); }

async function verifyToken(authHeader) {
  if (!fbAdmin || !authHeader?.startsWith('Bearer ')) return null;
  try { return await fbAdmin.auth().verifyIdToken(authHeader.slice(7)); } catch { return null; }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 1e5) { req.destroy(); reject(new Error('too large')); } });
    req.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
  });
}

function accountFile(uid) { return path.join(ACCOUNTS, uid + '.json'); }

function loadAccount(uid) {
  try { return JSON.parse(fs.readFileSync(accountFile(uid), 'utf8')); } catch { return { children: [] }; }
}

function saveAccount(uid, data) {
  fs.writeFileSync(accountFile(uid), JSON.stringify(data, null, 2));
}
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Nicht gefunden'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function jsonRes(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); res.end(); return; }

  // API-Routen
  if (url === '/api/children' && req.method === 'GET') {
    const user = await verifyToken(req.headers.authorization);
    if (!user) return jsonRes(res, 401, { error: 'Nicht angemeldet' });
    const acc = loadAccount(user.uid);
    return jsonRes(res, 200, acc.children);
  }
  if (url === '/api/children' && req.method === 'POST') {
    const user = await verifyToken(req.headers.authorization);
    if (!user) return jsonRes(res, 401, { error: 'Nicht angemeldet' });
    const body = await readBody(req);
    if (!body?.name || typeof body.name !== 'string') return jsonRes(res, 400, { error: 'Name fehlt' });
    const acc = loadAccount(user.uid);
    if (acc.children.length >= 5) return jsonRes(res, 400, { error: 'Maximal 5 Kinder' });
    const child = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: body.name.trim().slice(0, 14) };
    acc.children.push(child);
    saveAccount(user.uid, acc);
    return jsonRes(res, 201, child);
  }
  if (url.startsWith('/api/children/') && req.method === 'DELETE') {
    const user = await verifyToken(req.headers.authorization);
    if (!user) return jsonRes(res, 401, { error: 'Nicht angemeldet' });
    const childId = url.slice('/api/children/'.length);
    const acc = loadAccount(user.uid);
    acc.children = acc.children.filter(c => c.id !== childId);
    saveAccount(user.uid, acc);
    return jsonRes(res, 200, { ok: true });
  }

  if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(PUB, url));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); res.end(); return; }
  sendFile(res, file);
});

// ---------- WebSocket ----------
const storageDirs = { build: DATA, town: TOWNS };
const fileOf = (kind, code) => path.join(storageDirs[kind], code + '.json');
const core = createGameCore({
  log,
  storage: {
    read(kind, code) { try { return JSON.parse(fs.readFileSync(fileOf(kind, code), 'utf8')); } catch { return null; } },
    write(kind, code, data) { fs.writeFile(fileOf(kind, code), JSON.stringify(data), () => {}); },
    exists(kind, code) { return fs.existsSync(fileOf(kind, code)); },
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

function log(msg) { console.log(new Date().toLocaleTimeString('de-CH'), msg); }

server.listen(PORT, () => {
  console.log(`\n🎮 HanaBlox läuft!`);
  console.log(`   Auf diesem Computer:   http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`   Im WLAN (Tablet):      http://${a.address}:${PORT}`);
  }
  console.log('');
});
