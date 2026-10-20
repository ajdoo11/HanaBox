// Tägliche Aufgaben und Abzeichen. Alles wird auf dem Gerät gespeichert.
import { addStars } from './profile.js';

const store = {
  get(k, d) { try { const v = localStorage.getItem('hb_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hb_' + k, JSON.stringify(v)); } catch { /* privat */ } },
};

export const DAILY = [
  { key: 'climb', text: 'Klettere 3-mal eine Leiter hoch', goal: 3, reward: 8 },
  { key: 'gem', text: 'Sammle 5 Sterne in den Abenteuer-Häusern', goal: 5, reward: 10 },
  { key: 'adventure', text: 'Betritt ein Abenteuer-Haus', goal: 1, reward: 5 },
  { key: 'pet', text: 'Streichle dein Haustier 2-mal', goal: 2, reward: 5 },
  { key: 'adopt', text: 'Adoptiere ein eigenes Haustier', goal: 1, reward: 10 },
  { key: 'visit', text: 'Besuche 2 verschiedene Länder', goal: 2, reward: 12 },
  { key: 'build', text: 'Baue 5 Klötze in der Stadt', goal: 5, reward: 8 },
  { key: 'dentist', text: 'Putze einem Patienten die Zähne', goal: 1, reward: 10 },
];

export const BADGES = [
  { key: 'climb', name: 'Kletteräffchen', text: '50 Leitern hochgeklettert', goal: 50 },
  { key: 'gem', name: 'Sternensammler', text: '100 Sterne in den Abenteuern gesammelt', goal: 100 },
  { key: 'pet', name: 'Tierfreund', text: 'Dein Tier 40-mal gestreichelt', goal: 40 },
  { key: 'build', name: 'Baumeister', text: '100 Klötze gebaut', goal: 100 },
  { key: 'dentist', name: 'Zahnärztin', text: '10 Patienten behandelt', goal: 10 },
  { key: 'lands', name: 'Weltreisende', text: 'Alle 4 Länder besucht', goal: 4 },
];

const today = () => new Date().toDateString();

function daily() {
  const d = store.get('daily', null);
  if (!d || d.day !== today()) {
    const fresh = { day: today(), progress: {}, done: {}, lands: [] };
    store.set('daily', fresh);
    return fresh;
  }
  return d;
}

function totals() { return store.get('totals', {}); }

// Ereignis aus dem Spiel melden, z. B. track('climb'), track('visit:schnee')
export function track(event, notify) {
  const [key, sub] = event.split(':');
  const d = daily();
  const t = totals();
  if (key === 'visit') {
    if (!sub) return;
    if (!d.lands.includes(sub)) d.lands.push(sub);
    if (!t.lands) t.lands = [];
    if (!t.lands.includes(sub)) t.lands.push(sub);
    d.progress.visit = d.lands.length;
    t.lands = t.lands;
  } else {
    d.progress[key] = (d.progress[key] || 0) + 1;
    t[key] = (t[key] || 0) + 1;
  }
  store.set('totals', t);
  const newly = [];
  for (const q of DAILY) {
    if (q.key !== key && q.key !== 'visit') continue;
    const have = d.progress[q.key] || 0;
    if (!d.done[q.key] && have >= q.goal) {
      d.done[q.key] = true;
      addStars(q.reward);
      newly.push(q);
    }
  }
  store.set('daily', d);
  for (const q of newly) notify?.(`🏆 Aufgabe geschafft: ${q.text} (+${q.reward} ⭐)`);
  return newly;
}

export function getDaily() {
  const d = daily();
  return DAILY.map(q => ({ ...q, have: Math.min(q.goal, d.progress[q.key] || 0), done: !!d.done[q.key] }));
}

export function getBadges() {
  const t = totals();
  return BADGES.map(b => {
    const have = b.key === 'lands' ? (t.lands || []).length : t[b.key] || 0;
    return { ...b, have: Math.min(b.goal, have), done: have >= b.goal };
  });
}
