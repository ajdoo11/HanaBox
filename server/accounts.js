// Kinder-Konten: Spielername + Passwort (ohne E-Mail). Passwörter werden nur gehasht gespeichert.
// Nach dem Anmelden bekommt das Gerät einen Schlüssel (Token) und bleibt damit angemeldet.
import crypto from 'node:crypto';
import { sanitizeName } from '../public/js/shared.js';

const NAME_RE = /^[\p{L}\p{N} _-]{3,14}$/u;
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
// Wer Sterne verschenken darf (Eltern-Konto). Auf dem Server änderbar mit HANABLOX_ADMINS=name1,name2
const ADMINS = new Set((process.env.HANABLOX_ADMINS || 'test').toLowerCase().split(',').map(s => s.trim()).filter(Boolean));
const starsOf = a => { try { const n = JSON.parse(a.profile?.data?.hb_stars ?? 'null'); return Number.isFinite(n) ? n : 20; } catch { return 20; } };
const hashPw = (pass, salt) => crypto.scryptSync(pass, salt, 32).toString('hex');

export async function createAccounts(store) {
  const byId = new Map();
  const byToken = new Map();
  for (const [id, a] of await store.all('accounts')) {
    if (!a?.name || !a.hash) continue;
    byId.set(id, a);
    for (const t of a.tokens || []) byToken.set(t, id);
  }
  const save = id => store.set('accounts', id, byId.get(id));

  function issueToken(id) {
    const token = crypto.randomBytes(24).toString('base64url');
    const a = byId.get(id);
    const tokens = [...(a.tokens || []), sha(token)];
    // höchstens 10 angemeldete Geräte pro Kind
    for (const old of tokens.splice(0, Math.max(0, tokens.length - 10))) byToken.delete(old);
    a.tokens = tokens;
    byToken.set(sha(token), id);
    save(id);
    return token;
  }

  const pub = a => ({ name: a.name, profile: a.profile || null, admin: ADMINS.has(a.name.toLowerCase()) });

  return {
    count: () => byId.size,
    register(name, pass) {
      name = String(name ?? '').replace(/\s+/g, ' ').trim();
      pass = String(pass ?? '');
      if (!NAME_RE.test(name)) return { error: 'Der Name braucht 3 bis 14 Buchstaben oder Zahlen.' };
      if (sanitizeName(name) !== name) return { error: 'Bitte einen anderen Namen wählen.' };
      if (pass.length < 4 || pass.length > 64) return { error: 'Das Passwort braucht mindestens 4 Zeichen.' };
      const id = name.toLowerCase();
      if (byId.has(id)) return { error: 'Diesen Namen gibt es schon. Bitte einen anderen wählen.' };
      const salt = crypto.randomBytes(16).toString('hex');
      byId.set(id, { name, salt, hash: hashPw(pass, salt), tokens: [], profile: null, created: Date.now() });
      return { token: issueToken(id), ...pub(byId.get(id)) };
    },
    login(name, pass) {
      const a = byId.get(String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase());
      if (!a) return { error: 'Name oder Passwort stimmt nicht.' };
      const ok = crypto.timingSafeEqual(Buffer.from(hashPw(String(pass ?? ''), a.salt), 'hex'), Buffer.from(a.hash, 'hex'));
      if (!ok) return { error: 'Name oder Passwort stimmt nicht.' };
      return { token: issueToken(a.name.toLowerCase()), ...pub(a) };
    },
    byToken(token) {
      const id = token && byToken.get(sha(String(token)));
      return id ? byId.get(id) : null;
    },
    me(token) { const a = this.byToken(token); return a ? pub(a) : null; },
    logout(token) {
      const h = sha(String(token ?? ''));
      const id = byToken.get(h);
      if (!id) return;
      byToken.delete(h);
      const a = byId.get(id);
      a.tokens = a.tokens.filter(t => t !== h);
      save(id);
    },
    isAdmin: a => !!a && ADMINS.has(a.name.toLowerCase()),
    // Alle angemeldeten Spieler mit ihren Sternen (für das Eltern-Konto)
    list() {
      return [...byId.values()].map(a => ({ name: a.name, stars: starsOf(a), pending: a.pendingStars || 0, last: a.profile?.t || a.created || 0 }));
    },
    // Geschenk für jemanden, der gerade nicht spielt: wird beim nächsten Spielstart gutgeschrieben
    addGift(name, n) {
      const id = String(name ?? '').toLowerCase();
      const a = byId.get(id);
      if (!a) return false;
      a.pendingStars = (a.pendingStars || 0) + n;
      save(id);
      return true;
    },
    has: name => byId.has(String(name ?? '').toLowerCase()),
    takeGift(a) {
      const n = a?.pendingStars || 0;
      if (n) { a.pendingStars = 0; save(a.name.toLowerCase()); }
      return n;
    },
    setProfile(token, profile) {
      const a = this.byToken(token);
      if (!a) return false;
      a.profile = profile;
      save(a.name.toLowerCase());
      return true;
    },
  };
}
