// Gemeinsame Daten für Client und Server.
// WICHTIG: Es gibt absichtlich KEINE Waffen, Werkzeuge zum Schaden oder Kampf-Spiele.

export const GAMES = {
  town:    { name: 'HanaBlox Welt', emoji: '🌍', desc: 'Hana-Stadt, Schneeland, Tropeninsel und Zauberwald: Häuser, Abenteuer, Haustiere, Fahrzeuge, Bauen und Bot-Freunde!', bg: 'linear-gradient(135deg,#ffb3d9,#b39dff)' },
};
export const OLD_GAMES = {
  obby:  { name: 'Regenbogen-Obby', emoji: '🌈', desc: 'Hüpfe über Plattformen bis ins Ziel!', bg: 'linear-gradient(135deg,#ff6fb5,#ffb347)' },
  hangout: { name: 'Spielplatz', emoji: '🎠', desc: 'Trampoline, Karussell, Rutschbahn und Tanzfläche.', bg: 'linear-gradient(135deg,#6dd5ed,#2193b0)' },
  build:   { name: 'Bauwelt', emoji: '🧱', desc: 'Baut zusammen eure eigene Welt. Sie wird gespeichert!', bg: 'linear-gradient(135deg,#a8e063,#56ab2f)' },
  coins:   { name: 'Münzjagd', emoji: '🪙', desc: 'Wer sammelt die meisten Münzen?', bg: 'linear-gradient(135deg,#f7d14c,#f09819)' },
  tag:     { name: 'Fangis', emoji: '🏃', desc: 'Wer «es» ist, muss die anderen fangen!', bg: 'linear-gradient(135deg,#c471f5,#fa71cd)' },
};

export const MAX_PLAYERS = 40;

// Chat nur mit vorgegebenen Sätzen und Emojis – kein freier Text (sicher für Kinder).
export const QUICK_CHAT = [
  'Hallo! 👋', 'Komm mit!', 'Wo bist du?', 'Warte auf mich!', 'Folge mir!',
  'Super gemacht! 🎉', 'Danke! 😊', 'Lass uns spielen!', 'Ich bin hier!', 'Wie geht das?',
  'Haha 😂', 'Ja 👍', 'Nein 👎', 'Schau mal!', 'Tschüss! 👋',
];
export const EMOJIS = ['😀', '😂', '😍', '😎', '🥳', '😮', '😢', '❤️', '⭐', '🌈', '🦄', '🐱', '🐶', '🍕', '🎉', '👍'];
export const EMOJI_BASE = 100;

export function chatText(i) {
  if (i >= EMOJI_BASE) return EMOJIS[i - EMOJI_BASE];
  return QUICK_CHAT[i];
}
export function validChat(i) {
  return Number.isInteger(i) && ((i >= 0 && i < QUICK_CHAT.length) || (i >= EMOJI_BASE && i < EMOJI_BASE + EMOJIS.length));
}

export const BLOCK_TYPES = [
  { name: 'Rot', color: '#e53935' },
  { name: 'Orange', color: '#fb8c00' },
  { name: 'Gelb', color: '#fdd835' },
  { name: 'Grün', color: '#43a047' },
  { name: 'Hellblau', color: '#29b6f6' },
  { name: 'Blau', color: '#1e88e5' },
  { name: 'Lila', color: '#8e24aa' },
  { name: 'Rosa', color: '#f06292' },
  { name: 'Weiss', color: '#fafafa' },
  { name: 'Grau', color: '#90a4ae' },
  { name: 'Schwarz', color: '#37474f' },
  { name: 'Holz', color: '#a1887f' },
  { name: 'Glas', color: '#b3e5fc', kind: 'glass' },
  { name: 'Leuchten', color: '#fff59d', kind: 'glow' },
  { name: 'Trampolin', color: '#00e5ff', kind: 'bounce' },
  { name: 'Lava', color: '#ff5722', kind: 'lava' },
  { name: 'Fenster', color: '#81d4fa', tex: 'window' },
  { name: 'Tür', color: '#8d6e63', tex: 'door', kind: 'door' },
  { name: 'Dachziegel', color: '#c62828', tex: 'roof' },
  { name: 'Zaun', color: '#ffffff', tex: 'fence' },
  { name: 'Ziegel', color: '#bf360c', tex: 'brick' },
  { name: 'Gras', color: '#66bb6a', tex: 'grass' },
  { name: 'Sand', color: '#ffe0a3', tex: 'sand' },
  { name: 'Wasser', color: '#29b6f6', kind: 'glass' },
];
// Stoff-Muster für die Klötze (werden mit der Farbe eingefärbt)
BLOCK_TYPES.forEach(t => { if (!t.tex && t.kind !== 'glass' && t.kind !== 'glow' && t.kind !== 'lava' && t.kind !== 'bounce') t.tex = 'stone'; });
BLOCK_TYPES.find(t => t.name === 'Holz').tex = 'wood';
BLOCK_TYPES.find(t => t.name === 'Lava').tex = 'stone';

export const BUILD = { size: 2, half: 24, maxY: 20, maxBlocks: 4000 };

export const AVATAR_OPTIONS = {
  skin: ['#f5d76e', '#ffe0bd', '#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'],
  colors: ['#e53935', '#f06292', '#ff8a65', '#fb8c00', '#fdd835', '#c0ca33', '#43a047', '#26a69a',
    '#29b6f6', '#1e88e5', '#3949ab', '#8e24aa', '#ba68c8', '#fafafa', '#90a4ae', '#37474f',
    '#212121', '#5d4037', '#a1887f', '#ffd54f'],
  hair: ['Keine', 'Kurz', 'Lang offen', 'Zöpfe', 'Dutt', 'Pferdeschwanz', 'Langer Zopf', 'Bob', 'Locken', 'Stachelig'],
  hat: ['Keiner', 'Kappe', 'Krone', 'Hasenohren', 'Katzenohren', 'Blume', 'Zauberhut', 'Schleife', 'Kochmütze',
    'Feuerwehrhelm', 'Bauhelm', 'Stirnspiegel', 'Polizeimütze', 'Astronautenhelm', 'Diadem', 'Strohhut'],
  face: ['Lächeln', 'Grinsen', 'Zwinkern', 'Katze', 'Staunen', 'Cool', 'Verliebt', 'Frech', 'Müde', 'Glitzeraugen', 'Wimpern'],
  eyes: ['#5d4037', '#1e88e5', '#43a047', '#8e24aa', '#212121', '#ec407a'],
  shirtStyle: ['Uni', 'Streifen', 'Herz', 'Stern', 'Regenbogen', 'Blume', 'Punkte', 'Kittel', 'Glitzer', 'Jacke', 'Kleid'],
  sleeve: ['Kurze Ärmel', 'Lange Ärmel'],
  pantsStyle: ['Hose', 'Shorts', 'Rock', 'Latzhose'],
  acc: ['Nichts', 'Brille', 'Sonnenbrille', 'Kopfhörer', 'Rucksack', 'Engelsflügel', 'Umhang', 'Halskette', 'Mundschutz', 'Feenflügel'],
  pet: ['Kein Haustier', '🐱 Katze', '🐶 Hund', '🐰 Hase', '🐥 Küken', '🐧 Pinguin', '🦜 Papagei', '🦊 Fuchs', '🦄 Einhorn'],
};

export const DEFAULT_AVATAR = {
  skin: '#ffe0bd', hair: 6, hairColor: '#ba68c8', face: 9, eyes: 1, shirt: '#fdd835', shirtStyle: 9, sleeve: 1,
  pants: '#37474f', pantsStyle: 1, shoes: '#212121', hat: 0, acc: 0, pet: 0,
};

// Preise im Avatar-Shop (in Sternen – nur Spielwährung, kein echtes Geld).
export const PRICES = {
  hat: { 2: 60, 3: 30, 4: 30, 6: 45, 7: 15, 13: 50, 15: 20 },
  face: { 6: 20, 7: 15, 9: 25 },
  acc: { 2: 15, 3: 20, 5: 60, 6: 30, 9: 50 },
  shirtStyle: { 8: 25, 4: 15 },
  pet: { 3: 15, 4: 15, 5: 40, 6: 40, 7: 70, 8: 120 },
};

// Berufe: ziehen die passende Kleidung an (gratis).
export const JOBS = [
  { name: 'Zahnärztin', emoji: '🦷', set: { shirt: '#ffffff', shirtStyle: 7, sleeve: 1, hat: 11, acc: 8, pants: '#4fc3f7', pantsStyle: 0 } },
  { name: 'Ärztin', emoji: '🩺', set: { shirt: '#ffffff', shirtStyle: 7, sleeve: 1, hat: 0, acc: 0, pants: '#26a69a', pantsStyle: 0 } },
  { name: 'Köchin', emoji: '👩‍🍳', set: { shirt: '#ffffff', shirtStyle: 0, sleeve: 1, hat: 8, acc: 0, pants: '#424242', pantsStyle: 0 } },
  { name: 'Feuerwehr', emoji: '🚒', set: { shirt: '#e53935', shirtStyle: 0, sleeve: 1, hat: 9, acc: 0, pants: '#212121', pantsStyle: 0 } },
  { name: 'Polizei', emoji: '👮', set: { shirt: '#1e3a8a', shirtStyle: 0, sleeve: 1, hat: 12, acc: 0, pants: '#1e3a8a', pantsStyle: 0 } },
  { name: 'Bauarbeiterin', emoji: '👷', set: { shirt: '#ff9800', shirtStyle: 1, sleeve: 0, hat: 10, acc: 0, pants: '#1565c0', pantsStyle: 3 } },
  { name: 'Astronautin', emoji: '👩‍🚀', set: { shirt: '#eeeeee', shirtStyle: 0, sleeve: 1, hat: 13, acc: 4, pants: '#eeeeee', pantsStyle: 0 } },
  { name: 'Prinzessin', emoji: '👸', set: { shirt: '#f8bbd0', shirtStyle: 10, sleeve: 0, hat: 14, acc: 7, pants: '#f48fb1', pantsStyle: 2 } },
  { name: 'Tierpflegerin', emoji: '🐾', set: { shirt: '#8bc34a', shirtStyle: 0, sleeve: 0, hat: 15, acc: 0, pants: '#795548', pantsStyle: 3 } },
  { name: 'Fee', emoji: '🧚', set: { shirt: '#ce93d8', shirtStyle: 8, sleeve: 0, hat: 5, acc: 9, pants: '#ba68c8', pantsStyle: 2 } },
];

// Drei fertige Kinder-Figuren (Vorlagen, keine Fotos)
export const KIDS = [
  { name: 'Mädchen in Blau', emoji: '👧', set: { skin: '#ffe0bd', hair: 2, hairColor: '#8d6e63', face: 1, eyes: 1, shirt: '#64b5f6', shirtStyle: 0, sleeve: 0, pants: '#212121', pantsStyle: 0, shoes: '#eceff1', hat: 0, acc: 0 } },
  { name: 'Mädchen in Pink', emoji: '👧', set: { skin: '#ffe0bd', hair: 2, hairColor: '#a1887f', face: 2, eyes: 2, shirt: '#f06292', shirtStyle: 0, sleeve: 0, pants: '#212121', pantsStyle: 0, shoes: '#eceff1', hat: 0, acc: 0 } },
  { name: 'Junge mit kurzen Haaren', emoji: '👦', set: { skin: '#ffe0bd', hair: 1, hairColor: '#8d5524', face: 0, eyes: 0, shirt: '#4dd0c8', shirtStyle: 0, sleeve: 1, pants: '#1565c0', pantsStyle: 0, shoes: '#eceff1', hat: 0, acc: 0 } },
];

// Fahrzeuge (nur zum Herumfahren)
export const VEHICLES = [
  { key: 'car', name: 'Cabrio', emoji: '🚗', speed: 24, turn: 2.0, half: 1.15, height: 1.6 },
  { key: 'jeep', name: 'Jeep', emoji: '🚙', speed: 22, turn: 2.0, half: 1.2, height: 1.8 },
  { key: 'kart', name: 'Kart', emoji: '🏎️', speed: 28, turn: 2.6, half: 0.9, height: 1.2 },
  { key: 'bike', name: 'Velo', emoji: '🚲', speed: 15, turn: 2.8, half: 0.5, height: 2.2 },
  { key: 'scooter', name: 'Trotti', emoji: '🛴', speed: 12, turn: 3.0, half: 0.45, height: 2.4 },
  { key: 'boat', name: 'Ruderboot', emoji: '🚣', speed: 10, turn: 1.8, half: 1.2, height: 0.8, water: true },
  { key: 'speedboat', name: 'Speedboot', emoji: '🚤', speed: 22, turn: 1.5, half: 1.4, height: 1.0, water: true },
];
export const VEH_COLORS = ['#e53935', '#f06292', '#ab47bc', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#ffffff', '#26c6da'];

export const BOT_NAMES = ['Lina', 'Mia', 'Emma', 'Lea', 'Noah', 'Leon', 'Luca', 'Sofia', 'Nina', 'Elias', 'Jana', 'Ella', 'Ben', 'Lara', 'Timo', 'Zoe'];

// Gegenstände für die Hana-Stadt (Essen, Spielzeug, Haustiere, Pflanzen) – keine Waffen.
export const ITEM_TYPES = [
  { key: 'apple', name: 'Apfel', emoji: '🍎', cat: 'food' },
  { key: 'banana', name: 'Banane', emoji: '🍌', cat: 'food' },
  { key: 'strawberry', name: 'Erdbeere', emoji: '🍓', cat: 'food' },
  { key: 'carrot', name: 'Karotte', emoji: '🥕', cat: 'food' },
  { key: 'pizza', name: 'Pizza', emoji: '🍕', cat: 'food' },
  { key: 'burger', name: 'Burger', emoji: '🍔', cat: 'food' },
  { key: 'cake', name: 'Torte', emoji: '🎂', cat: 'food' },
  { key: 'cookie', name: 'Keks', emoji: '🍪', cat: 'food' },
  { key: 'donut', name: 'Donut', emoji: '🍩', cat: 'food' },
  { key: 'croissant', name: 'Gipfeli', emoji: '🥐', cat: 'food' },
  { key: 'icecream', name: 'Glace', emoji: '🍦', cat: 'food' },
  { key: 'juice', name: 'Saft', emoji: '🧃', cat: 'food' },
  { key: 'ball', name: 'Ball', emoji: '⚽', cat: 'toy' },
  { key: 'teddy', name: 'Teddy', emoji: '🧸', cat: 'toy' },
  { key: 'duck', name: 'Quietschente', emoji: '🦆', cat: 'toy' },
  { key: 'balloon', name: 'Ballon', emoji: '🎈', cat: 'toy' },
  { key: 'gift', name: 'Geschenk', emoji: '🎁', cat: 'toy' },
  { key: 'cat', name: 'Katze', emoji: '🐱', cat: 'pet' },
  { key: 'dog', name: 'Hund', emoji: '🐶', cat: 'pet' },
  { key: 'bunny', name: 'Hase', emoji: '🐰', cat: 'pet' },
  { key: 'chick', name: 'Küken', emoji: '🐥', cat: 'pet' },
  { key: 'flower', name: 'Blumentopf', emoji: '🌷', cat: 'plant' },
  { key: 'cocoa', name: 'Heisse Schokolade', emoji: '☕', cat: 'food' },
  { key: 'coconut', name: 'Kokosnuss', emoji: '🥥', cat: 'food' },
  { key: 'pineapple', name: 'Ananas', emoji: '🍍', cat: 'food' },
  { key: 'mango', name: 'Mango', emoji: '🥭', cat: 'food' },
  { key: 'penguin', name: 'Pinguin', emoji: '🐧', cat: 'pet' },
  { key: 'parrot', name: 'Papagei', emoji: '🦜', cat: 'pet' },
  { key: 'unicorn', name: 'Einhorn', emoji: '🦄', cat: 'pet' },
  { key: 'fox', name: 'Fuchs', emoji: '🦊', cat: 'pet' },
  { key: 'snowball', name: 'Schneeball', emoji: '🏐', cat: 'toy' },
  { key: 'waterballoon', name: 'Wasserballon', emoji: '💧', cat: 'toy' },
  { key: 'frisbee', name: 'Frisbee', emoji: '🥏', cat: 'toy' },
  { key: 'kite', name: 'Drachen', emoji: '🪁', cat: 'toy' },
  { key: 'turtle', name: 'Schildkröte', emoji: '🐢', cat: 'pet' },
  { key: 'dolphin', name: 'Delfin', emoji: '🐬', cat: 'pet' },
  { key: 'butterfly', name: 'Schmetterling', emoji: '🦋', cat: 'pet' },
  { key: 'hamster', name: 'Hamster', emoji: '🐹', cat: 'pet' },
  { key: 'sunflower', name: 'Sonnenblume', emoji: '🌻', cat: 'plant' },
  { key: 'lantern', name: 'Laterne', emoji: '🏮', cat: 'deco' },
  { key: 'snowman', name: 'Schneemann', emoji: '⛄', cat: 'deco' },
  { key: 'palm', name: 'Mini-Palme', emoji: '🌴', cat: 'plant' },
  { key: 'gnome', name: 'Gartenzwerg', emoji: '🍄', cat: 'deco' },
];

// Eigene Haustiere (folgen dir überall hin). Preis in Sternen.
export const PETS = [
  { key: 'cat', price: 0 }, { key: 'dog', price: 0 }, { key: 'bunny', price: 15 }, { key: 'chick', price: 15 },
  { key: 'penguin', price: 40 }, { key: 'parrot', price: 40 }, { key: 'fox', price: 70 }, { key: 'unicorn', price: 120 },
];
// Rucksack-Shop (nur Sterne). Einmal gekauft, gehört es dir für immer.
// Fahrzeuge: Index in VEHICLES. Deko: Gegenstand zum Hinstellen. Tiere: Index in AVATAR_OPTIONS.pet (Preis aus PRICES.pet).
export const SHOP = {
  veh: [{ type: 4, price: 10 }, { type: 3, price: 15 }, { type: 2, price: 35 }, { type: 0, price: 50 }, { type: 1, price: 60 }],
  deco: [{ key: 'flower', price: 2 }, { key: 'balloon', price: 3 }, { key: 'sunflower', price: 4 }, { key: 'gift', price: 5 }, { key: 'teddy', price: 6 },
    { key: 'gnome', price: 8 }, { key: 'lantern', price: 10 }, { key: 'palm', price: 15 }, { key: 'snowman', price: 20 }],
};

export const ITEM_INDEX = Object.fromEntries(ITEM_TYPES.map((t, i) => [t.key, i]));
export const MAX_ITEMS = 250;

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export function sanitizeAvatar(a) {
  const out = { ...DEFAULT_AVATAR };
  if (!a || typeof a !== 'object') return out;
  for (const k of ['skin', 'shirt', 'pants', 'hairColor', 'shoes']) if (typeof a[k] === 'string' && COLOR_RE.test(a[k])) out[k] = a[k];
  for (const k of ['hair', 'hat', 'face', 'eyes', 'shirtStyle', 'sleeve', 'pantsStyle', 'acc', 'pet']) {
    const n = a[k];
    if (Number.isInteger(n) && n >= 0 && n < AVATAR_OPTIONS[k].length) out[k] = n;
  }
  return out;
}

const BAD = ['arsch', 'scheiss', 'scheiß', 'fick', 'fuck', 'shit', 'bitch', 'hure', 'nazi', 'sex', 'idiot', 'dumm'];
export function sanitizeName(n) {
  let s = String(n ?? '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  const low = s.toLowerCase();
  if (BAD.some(w => low.includes(w))) s = '';
  return s || 'Spieler' + Math.floor(Math.random() * 900 + 100);
}

export const ANIMS = ['idle', 'walk', 'jump', 'fall', 'dance', 'wave', 'sit', 'sleep', 'eat', 'drive', 'climb', 'carried', 'bike', 'stand'];

// Fahrzeug-Code im Spielerzustand: 0 = zu Fuss, sonst Typ*16 + Farbe + 1
export const vehCode = (type, color) => type * 16 + color + 1;
export const vehDecode = c => (c > 0 ? { type: Math.floor((c - 1) / 16), color: (c - 1) % 16 } : null);
