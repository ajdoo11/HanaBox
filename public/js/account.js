// Kinder-Konto: einmal anmelden, danach bleibt das Gerät angemeldet.
// Der Spielstand (alles mit «hb_» im Gerätespeicher: Figur, Sterne, Aufgaben, Schätze …) wird automatisch im Konto gesichert
// und beim Anmelden auf einem anderen Gerät wiederhergestellt.
import { SERVER_URL } from './config.js';

const TOKEN = 'hbacc_token', NAME = 'hbacc_name', STAMP = 'hbacc_t';
export const API = SERVER_URL ? SERVER_URL.replace(/^ws/, 'http').replace(/\/ws\/?$/, '') : '';

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { setItem.call(localStorage, k, String(v)); } catch { /* privat */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* privat */ } },
};

export const token = () => ls.get(TOKEN);
export const accountName = () => ls.get(NAME);

function gameKeys() {
  const keys = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('hb_')) keys.push(k); } } catch { /* privat */ }
  return keys;
}

function snapshot() {
  const data = {};
  for (const k of gameKeys()) data[k] = ls.get(k);
  return { t: Number(ls.get(STAMP)) || Date.now(), data };
}

function restore(profile, name) {
  for (const k of gameKeys()) ls.del(k);
  for (const [k, v] of Object.entries(profile?.data || {})) if (k.startsWith('hb_')) ls.set(k, v);
  ls.set('hb_name', JSON.stringify(name));
  ls.set(STAMP, profile?.t || Date.now());
}

async function api(path, opts = {}) {
  const t = token();
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
  } catch {
    throw Object.assign(new Error('Keine Verbindung zum Server. Bitte nochmal versuchen.'), { offline: true });
  }
  let body = {};
  try { body = await res.json(); } catch { /* leer */ }
  if (!res.ok) throw Object.assign(new Error(body.error || 'Fehler beim Server'), { status: res.status });
  return body;
}

function signedIn(r) {
  ls.set(TOKEN, r.token);
  ls.set(NAME, r.name);
}

// Neues Konto: der bisherige Spielstand auf diesem Gerät kommt ins Konto mit
export async function register(name, pass) {
  ls.set('hb_name', JSON.stringify(name.trim()));
  const r = await api('/api/register', { method: 'POST', body: JSON.stringify({ name, pass, profile: snapshot() }) });
  signedIn(r);
  restore(r.profile, r.name);
}

export async function login(name, pass) {
  const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ name, pass }) });
  signedIn(r);
  restore(r.profile, r.name);
}

// Beim Start: Ist das Gerät noch angemeldet? Liefert { name, reload } oder null.
export async function check() {
  if (!token()) return null;
  try {
    const me = await api('/api/me');
    if (me.profile && me.profile.t > (Number(ls.get(STAMP)) || 0)) { restore(me.profile, me.name); return { name: me.name, reload: true }; }
    if (!me.profile) upload();
    ls.set(NAME, me.name);
    return { name: me.name };
  } catch (e) {
    if (e.status === 401) { ls.del(TOKEN); return null; }
    throw e;
  }
}

export async function logout() {
  await upload();
  try { await api('/api/logout', { method: 'POST' }); } catch { /* egal */ }
  ls.del(TOKEN);
  ls.del(NAME);
  ls.del(STAMP);
  for (const k of gameKeys()) ls.del(k);
}

let timer = null;
function upload() {
  clearTimeout(timer);
  timer = null;
  if (!token()) return Promise.resolve();
  return fetch(API + '/api/profile', {
    method: 'PUT', keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(snapshot()),
  }).catch(() => {});
}

// Jede Änderung am Spielstand wird kurz danach ins Konto hochgeladen
const setItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (k, v) {
  setItem.call(this, k, v);
  if (this === localStorage && typeof k === 'string' && k.startsWith('hb_') && token()) {
    setItem.call(localStorage, STAMP, String(Date.now()));
    if (!timer) timer = setTimeout(upload, 3000);
  }
};
addEventListener('pagehide', () => { if (timer) upload(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && timer) upload(); });
