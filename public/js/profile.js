// Spielerprofil auf dem Gerät: Name, Avatar, Sterne (Spielwährung), gekaufte Sachen, zuletzt gespielt.
import { DEFAULT_AVATAR, PRICES, sanitizeAvatar } from './shared.js';

const store = {
  get(k, d) { try { const v = localStorage.getItem('hb_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hb_' + k, JSON.stringify(v)); } catch { /* privat */ } },
};

export const profile = {
  name: store.get('name', ''),
  avatar: sanitizeAvatar(store.get('avatar', DEFAULT_AVATAR)),
  stars: store.get('stars', 20),
  owned: new Set(store.get('owned', [])),
  recent: store.get('recent', []),
  muted: store.get('muted', false),
  grab: store.get('grab', true),
  vehColor: store.get('vehcolor', 0),
};

export function saveGrab(g) { profile.grab = g; store.set('grab', g); }

export function saveName(n) { profile.name = n; store.set('name', n); }
export function saveAvatar(a) { profile.avatar = a; store.set('avatar', a); }
export function saveMuted(m) { profile.muted = m; store.set('muted', m); }

export function addStars(n) {
  if (!n) return;
  profile.stars = Math.max(0, profile.stars + n);
  store.set('stars', profile.stars);
  window.dispatchEvent(new CustomEvent('stars', { detail: { n, total: profile.stars } }));
}

// Arbeit (Jobs, Einkauf, Zahnarzt) bringt pro Tag höchstens WORK_DAILY Sterne
export const WORK_DAILY = 90;
const JOB_WAIT = 120000;
const dayKey = () => new Date().toDateString();

export function workLeft() {
  if (store.get('workday', '') !== dayKey()) return WORK_DAILY;
  return Math.max(0, WORK_DAILY - store.get('workearned', 0));
}

export function earnWork(n) {
  const today = dayKey();
  if (store.get('workday', '') !== today) { store.set('workday', today); store.set('workearned', 0); }
  const done = store.get('workearned', 0);
  const give = Math.max(0, Math.min(n, WORK_DAILY - done));
  store.set('workearned', done + give);
  if (give) addStars(give);
  return give;
}

// Jeder Arbeitsplatz ist nach der Arbeit 2 Minuten gesperrt
export function jobWait(key) {
  const last = store.get('jobdone', {})[key] || 0;
  return Math.max(0, JOB_WAIT - (Date.now() - last));
}
export function markJob(key) {
  const m = store.get('jobdone', {});
  m[key] = Date.now();
  store.set('jobdone', m);
}

export function price(kind, i) { return PRICES[kind]?.[i] || 0; }
export function owns(kind, i) { return !price(kind, i) || profile.owned.has(kind + ':' + i); }
export function buy(kind, i) {
  const p = price(kind, i);
  if (owns(kind, i)) return true;
  if (profile.stars < p) return false;
  profile.owned.add(kind + ':' + i);
  store.set('owned', [...profile.owned]);
  addStars(-p);
  return true;
}

// Rucksack-Shop: Kauf mit Sternen, gespeichert als «veh:2», «deco:lantern» …
export function ownsShop(id) { return profile.owned.has(id); }
export function buyShop(id, p) {
  if (profile.owned.has(id)) return true;
  if (profile.stars < p) return false;
  profile.owned.add(id);
  store.set('owned', [...profile.owned]);
  addStars(-p);
  return true;
}
export function saveVehColor(c) { profile.vehColor = c; store.set('vehcolor', c); }

export function addRecent(code, game) {
  profile.recent = [{ code, game, t: Date.now() }, ...profile.recent.filter(r => r.code !== code)].slice(0, 6);
  store.set('recent', profile.recent);
}
export function removeRecent(code) {
  profile.recent = profile.recent.filter(r => r.code !== code);
  store.set('recent', profile.recent);
}
