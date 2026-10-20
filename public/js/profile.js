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

export function addRecent(code, game) {
  profile.recent = [{ code, game, t: Date.now() }, ...profile.recent.filter(r => r.code !== code)].slice(0, 6);
  store.set('recent', profile.recent);
}
export function removeRecent(code) {
  profile.recent = profile.recent.filter(r => r.code !== code);
  store.set('recent', profile.recent);
}
