// Weitere Länder: Schneeland, Tropeninsel, Zauberwald. Man reist mit dem Flughafen dorthin.
import { P, RAINBOW, PASTEL, rng } from './kit.js';
import { makeReserve, shop, shopRow, houseRow, slideTower, pool, funPark, zoo, sportsField, camp, lighthouse, pier, mushroomHouses, fireworksButton } from './places.js';

const job = (emoji, title, msg, stars = 5, time = 4) => ({ emoji, title: `${emoji} ${title}`, msg, stars, time });

export const LAND_DEFS = [
  { key: 'stadt', name: 'Hana-Stadt', emoji: '🏙️', cx: 0, cz: 0, size: 570, sky: '#8fd3fe', arrive: [0, 292] },
  { key: 'schnee', name: 'Schneeland', emoji: '❄️', cx: 2600, cz: 0, size: 700, sky: '#cfe8ff', arrive: [2600, 132], snow: true },
  { key: 'tropen', name: 'Tropeninsel', emoji: '🏝️', cx: -2600, cz: 0, size: 700, sky: '#6fd1ff', arrive: [-2600, 132] },
  { key: 'zauber', name: 'Zauberwald', emoji: '🍄', cx: 0, cz: 2600, size: 700, sky: '#c9b6ff', arrive: [0, 2732] },
];

export function landAt(x, z) {
  for (const l of LAND_DEFS) if (Math.abs(x - l.cx) < l.size / 2 + 60 && Math.abs(z - l.cz) < l.size / 2 + 60) return l;
  return null;
}

// Bauen in den Städten: Klötze (Zellen à 2 Einheiten) nur auf der Insel, bis zu 30 Zellen hoch.
export function townCellAllowed(x, y, z) {
  if (![x, y, z].every(Number.isInteger) || y < 0 || y >= 30) return false;
  const wx = x * 2 + 1, wz = z * 2 + 1;
  const l = landAt(wx, wz);
  if (!l) return false;
  return Math.abs(wx - l.cx) < l.size / 2 - 6 && Math.abs(wz - l.cz) < l.size / 2 - 6;
}

// Flughafen mit Reise-Schalter
function airport(K, cx, cz, color = '#90caf9') {
  const { box, deco, sign, zoneAct } = K;
  box(cx, 0, cz, 16, 6, 8, '#eceff1', { tex: 'tiles' });
  deco(cx, 6, cz, 16.6, 0.5, 8.6, color);
  sign('Flughafen ✈️', cx, 4.6, cz + 4.2, 9, 1.4, 'z+', '#ffffff', '#1565c0');
  box(cx, 0, cz + 6, 6, 1.3, 1.6, color, { act: 'travel', title: '✈️ Verreisen' });
  zoneAct(cx, 0, cz + 7.5, 6, 2, 'travel', { title: '✈️ Verreisen' });
  // Flugzeug
  const px = cx + 16, pz = cz + 6;
  deco(px, 1.2, pz, 2.2, 2.2, 12, '#ffffff', { shape: 'cyl', rx: Math.PI / 2 });
  deco(px, 1.2, pz + 6.5, 2.2, 2.2, 2.2, '#ffffff', { shape: 'sphere' });
  deco(px, 1.8, pz, 14, 0.25, 3, color);
  deco(px, 2.4, pz - 5.2, 0.25, 3, 2, color);
  deco(px, 2.2, pz - 5.4, 5, 0.2, 1.6, color);
  for (let i = 0; i < 4; i++) deco(px + 1.11, 2.3, pz + 3 - i * 2, 0.05, 0.6, 0.8, '#4fc3f7');
}

function cabins(K, list, color, roofColor, to = 'house2') {
  const { building } = K;
  for (const [x, z, door, name] of list) building({ x, z, w: 11, d: 9, h: 5.5, wall: color, wallTex: 'wood', roof: 'pitched', roofColor, door, text: name, to, name });
}

// ---------- Schneeland ----------
function snowland(K, w) {
  const L = LAND_DEFS[1];
  const { cx, cz } = L;
  const { r, box, deco, sign, signPost, pine, snowman, lamp, bench, ladder, stairs, slide, ramp, spot, building, island, it, crystal } = K;
  island(cx, cz, L.size, '#f5f9ff', 'sand', '#81d4fa');
  airport(K, cx, cz + 112, '#81d4fa');
  // Dorfplatz mit Weihnachtsbaum
  deco(cx, 0, cz + 60, 60, 0.12, 50, '#e3f2fd', { tex: 'stone', noShadow: true });
  box(cx, 0, cz + 60, 1.4, 3, 1.4, '#6d4c41', { shape: 'cyl' });
  for (let i = 0; i < 5; i++) deco(cx, 2 + i * 2.2, cz + 60, 9 - i * 1.6, 3.2, 9 - i * 1.6, '#2e7d32', { shape: 'cone' });
  deco(cx, 13.6, cz + 60, 1.4, 1.4, 1.4, '#ffd600', { shape: 'sphere', emissive: '#ffd600' });
  for (let i = 0; i < 30; i++) { const a = i * 2.4, h = 2.5 + (i % 10) * 1.0, rr = 4.2 - (i % 10) * 0.35; deco(cx + Math.cos(a) * rr, h, cz + 60 + Math.sin(a) * rr, 0.4, 0.4, 0.4, RAINBOW[i % 7], { shape: 'sphere', emissive: RAINBOW[i % 7], emissiveIntensity: 0.7 }); }
  for (const [x, z] of [[-12, 52], [12, 52], [-12, 68], [12, 68]]) snowman(cx + x, cz + z);
  fireworksButton(K, cx - 4, cz + 46);
  box(cx + 15, 0, cz + 74, 4, 1.4, 2, '#d32f2f', { act: 'menu', title: '☕ Heisse Schokolade', menu: ['cocoa', 'cookie', 'cake'], tex: 'wood' });
  deco(cx + 15, 1.4, cz + 74.8, 4.4, 2.6, 0.2, '#ffffff', { tex: 'stripes' });
  for (const [x, z, rot] of [[-8, 74, Math.PI], [8, 46, 0]]) bench(cx + x, cz + z, rot, '#a1887f');
  for (const [x, z] of [[-18, 46], [18, 46], [-18, 74]]) lamp(cx + x, cz + z, '#fffde7');
  // Hütten
  cabins(K, [
    [cx - 40, cz + 40, 'e', 'Hütte Alpenrose'], [cx - 40, cz + 60, 'e', 'Hütte Edelweiss'], [cx - 40, cz + 80, 'e', 'Hütte Murmeli'],
    [cx + 40, cz + 40, 'w', 'Hütte Schneeflocke'], [cx + 40, cz + 80, 'w', 'Hütte Eiszapfen'],
  ], '#a1887f', '#eceff1');
  building({ x: cx + 40, z: cz + 60, w: 12, d: 12, h: 5, wall: '#e3f2fd', wallTex: 'tiles', roof: 'dome', roofColor: '#ffffff', door: 'w', text: 'Iglu ❄️', to: 'igloo', name: 'Iglu' });
  // Eisbahn
  box(cx - 50, 0, cz - 10, 36, 0.15, 24, '#b3e5fc', { k: 'ice', emissive: '#e1f5fe', emissiveIntensity: 0.2 });
  for (const [x, z, ww, dd] of [[0, -12.3, 36.6, 0.6], [0, 12.3, 36.6, 0.6], [-18.3, 0, 0.6, 24], [18.3, 4, 0.6, 16]]) box(cx - 50 + x, 0, cz - 10 + z, ww, 1, dd, '#ffffff', { tex: 'wood' });
  signPost('Eisbahn ⛸️', cx - 50, cz + 4, 'z+', '#e1f5fe', '#0277bd');
  it('penguin', cx - 44, 0.2, cz - 14); it('penguin', cx - 56, 0.2, cz - 6);
  // Gefrorener See
  box(cx + 60, 0, cz - 20, 40, 0.12, 30, '#c5e8ff', { k: 'ice', shape: 'cyl', emissive: '#e1f5fe', emissiveIntensity: 0.15 });
  // Skiberg mit Rutschen
  const mx = cx - 30, mz = cz - 90;
  const levels = [[60, 6], [46, 6], [32, 6], [18, 6], [8, 6]];
  let y = 0;
  levels.forEach(([s, h], i) => { box(mx, y, mz, s, h, s * 0.8, i % 2 ? '#ffffff' : '#f5f9ff', { tex: 'sand' }); y += h; });
  // Weg hoch: Treppen und Leitern
  stairs(mx - 4, mz + 24 + 9.6, 'n', 6, 0, 6, '#cfd8dc', 'stone', 0.5, 0.8);
  ladder(mx - 10, mz + 18.4 + 0.05, 6, 12, 's', '#ff7043');
  ladder(mx + 6, mz + 12.8 + 0.05, 12, 18, 's', '#ff7043');
  ladder(mx - 4, mz + 7.2 + 0.05, 18, 24, 's', '#ff7043');
  ladder(mx + 2, mz + 3.2 + 0.05, 24, 30, 's', '#ff7043');
  // Breite Schneerampen auf der Westseite bis zum Gipfel
  for (let i = 0; i < 4; i++) {
    const s2 = levels[i + 1][0], len = s2 * 0.8 - 2, top = 6 * (i + 1);
    ramp(mx - s2 / 2 - 1.6, mz, 3, len, top, top + 6.05, 'z', i % 2 ? 1 : -1, '#e3f2fd', 'sand');
  }
  box(mx, 30, mz, 4, 1.1, 1.2, '#8d6e63', { act: 'treasure', key: 'chest_ski', tex: 'wood' });
  sign('Skiberg 🎿', mx, 33, mz + 1, 5, 1.2, 'z+', '#ffffff', '#0277bd', false);
  // grosse Eisrutschen vom Gipfel
  slide(mx + 4, mz, 'x', 1, 30, 30, 18, '#4fc3f7', 3);
  box(mx + 36, 15, mz, 6, 3, 6, '#e1f5fe', { tex: 'tiles' });
  slide(mx + 36, mz + 3, 'z', 1, 28, 18, 6, '#29b6f6', 3);
  box(mx + 36, 3, mz + 34, 6, 3, 6, '#e1f5fe', { tex: 'tiles' });
  slide(mx + 33, mz + 34, 'x', -1, 16, 6, 0.2, '#03a9f4', 3);
  // Schlittenhügel (Schanzen)
  for (let i = 0; i < 3; i++) ramp(cx + 70 + i * 14, cz + 30, 6, 6, 0, 2 + i, 'x', 1, '#ffffff', 'sand');
  // Abenteuer-Haus
  building({ x: cx + 80, z: cz - 90, w: 22, d: 20, h: 14, wall: '#b3e5fc', wallTex: 'metal', roof: 'flat', roofColor: '#4fc3f7', door: 's', text: 'Eispalast ❄️ Abenteuer', to: 'adv:1', name: 'Eispalast-Abenteuer' });
  for (let i = 0; i < 8; i++) crystal(cx + 70 + (i % 4) * 6, cz - 72 + Math.floor(i / 4) * 4, 0.8 + (i % 3) * 0.3, '#80deea');
  // Fahrzeuge
  for (let i = 0; i < 4; i++) spot(cx - 14 + i * 7, cz + 96, [1, 2, 4, 3][i], [7, 3, 8, 0][i], Math.PI);
  spot(cx + 65, cz - 6, 5, 2, Math.PI / 2); spot(cx + 75, cz - 6, 5, 4, Math.PI / 2);
  // Marktplatz
  const mkx = cx + 60, mkz = cz + 30;
  deco(mkx, 0, mkz, 30, 0.12, 20, '#e3f2fd', { tex: 'stone', noShadow: true });
  box(mkx - 8, 0, mkz - 6, 5, 1.4, 2.4, '#d32f2f', { act: 'menu', title: '🍰 Bäckerei', menu: ['cake', 'cookie', 'croissant'], tex: 'wood' });
  sign('Bäckerei 🥐', mkx - 8, 2.8, mkz - 6, 5, 1, 'z+', '#ffffff', '#c62828', false);
  K.wardrobePart(mkx + 8, mkz - 6, 5, 2.4, '🧥 Winterkleidung');
  sign('Shop 🧥', mkx + 8, 2.8, mkz - 6, 4, 1, 'z+', '#ffffff', '#0d47a1', false);
  K.zoneAct(mkx - 8, 0, mkz - 2, 6, 3, 'job', { title: '🥐 In der Bäckerei arbeiten', jobId: 0 });
  K.zoneAct(mkx + 8, 0, mkz - 2, 6, 3, 'job', { title: '🧥 Im Shop arbeiten', jobId: 4 });
  for (const [bx, bz, rot] of [[mkx - 2, mkz + 6, 0], [mkx + 2, mkz + 6, 0]]) bench(cx + (bx - cx), cz + (bz - cz), rot, '#a1887f');
  // Zusätzliche Hütten
  cabins(K, [
    [cx + 70, cz - 30, 'w', 'Hütte Kristall'], [cx + 70, cz - 50, 'w', 'Hütte Nordlicht'],
    [cx - 70, cz - 30, 'e', 'Hütte Schneekristall'], [cx - 70, cz - 50, 'e', 'Hütte Gletscher'],
  ], '#b3e5fc', '#ffffff');
  // Schneepark
  const spx = cx - 80, spz = cz - 60;
  deco(spx, 0, spz, 40, 0.12, 30, '#e3f2fd', { tex: 'stone', noShadow: true });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) box(spx - 10 + i * 4, 0, spz - 6 + j * 4, 3.8, 0.15, 3.8, RAINBOW[(i + j) % 7], { k: 'bounce' });
  signPost('Schneepark 🎪', spx, spz + 18, 'z+', '#e3f2fd', '#0277bd');
  // Schneefestung
  const sfx2 = cx + 120, sfz = cz - 40;
  for (const [ox, oz] of [[-12, -8], [12, -8], [-12, 8], [12, 8]]) { box(sfx2 + ox, 0, sfz + oz, 4, 6, 4, '#eceff1', { tex: 'stone' }); deco(sfx2 + ox, 6, sfz + oz, 4.4, 2, 4.4, '#b3e5fc', { shape: 'cone' }); }
  for (const [ox, oz, ww, dd] of [[0, -8, 20, 1.6], [0, 8, 20, 1.6], [-12, 0, 1.6, 14], [12, 0, 1.6, 14]]) box(sfx2 + ox, 0, sfz + oz, ww, 3, dd, '#eceff1', { tex: 'stone' });
  box(sfx2, 3, sfz, 20, 0.5, 14, '#f5f5f5', { tex: 'stone' });
  ladder(sfx2 - 11.95, sfz, 0, 3.5, 'e', '#ffca28');
  signPost('Schneefestung 🏰', sfx2, sfz + 12, 'z+', '#e3f2fd', '#37474f');
  // Schneemobil-Piste
  ramp(cx - 100, cz + 50, 8, 10, 0, 3, 'z', -1, '#f5f9ff', 'sand');
  ramp(cx - 100, cz + 30, 8, 10, 0, 4, 'z', 1, '#f5f9ff', 'sand');
  ramp(cx - 120, cz + 40, 8, 10, 0, 2.5, 'x', 1, '#f5f9ff', 'sand');
  signPost('Schneemobil-Piste 🏔️', cx - 100, cz + 60, 'z+', '#e3f2fd', '#0277bd');
  spot(cx - 110, cz + 45, 4, 7, Math.PI / 2); spot(cx - 110, cz + 38, 4, 2, Math.PI / 2);
  // ---------- Neue Orte im Schneeland ----------
  const { reserve, free } = makeReserve([]);
  reserve(cx - 100, cz - 140, cx + 100, cz + 140);
  reserve(cx + 104, cz - 52, cx + 136, cz - 26); reserve(cx - 126, cz + 24, cx - 94, cz + 64);
  // Alpenstrasse mit Läden
  reserve(cx + 135, cz + 178, cx + 285, cz + 206);
  shopRow(K, w, cx + 150, cz + 190, 40, 's', [
    { name: 'Hüttencafé ☕', wall: '#d7ccc8', tex: 'wood', roof: 'pitched', roofColor: '#eceff1', to: 'cafe', menu: ['cocoa', 'cake', 'cookie'], keeper: 'Heidi', job: job('☕', 'Im Hüttencafé servieren', 'Du bringst allen heisse Schokolade!') },
    { name: 'Skishop ⛷️', wall: '#bbdefb', awning: '#1e88e5', to: 'boutique', menu: ['snowball'], menuTitle: '❄️ Schneebälle', keeper: 'Ski-Sepp', wardrobe: '🧥 Skikleider', job: job('⛷️', 'Skier wachsen', 'Du wachst die Skier, damit sie schnell sind!') },
    { name: 'Alpenmarkt 🛒', wall: '#c8e6c9', awning: '#43a047', to: 'market', menu: ['apple', 'carrot', 'juice', 'croissant'], keeper: 'Vreni', job: job('🛒', 'Im Alpenmarkt arbeiten', 'Du füllst die Regale auf!', 4, 3) },
    { name: 'Fondue-Stübli 🧀', wall: '#ffe0b2', tex: 'wood', roof: 'pitched', roofColor: '#795548', to: 'cafe', menu: ['croissant', 'cocoa', 'apple'], keeper: 'Koch Ueli', keeperJob: 2, job: job('🧀', 'Fondue rühren', 'Du rührst das Käse-Fondue!') },
  ]);
  for (let i = 0; i < 4; i++) spot(cx + 150 + i * 8, cz + 222, [1, 1, 3, 0][i], [3, 7, 2, 0][i], Math.PI);
  // Chalet-Dorf
  reserve(cx - 270, cz + 165, cx - 95, cz + 222);
  houseRow(K, cx - 260, cz + 175, 22, ['Heidi', 'Peter', 'Clara', 'Urs', 'Anni', 'Beat', 'Mona', 'Reto'], 's', ['#d7ccc8', '#ffe0b2', '#ffccbc', '#e3f2fd']);
  houseRow(K, cx - 260, cz + 212, 22, ['Sina', 'Fabio', 'Lara', 'Gian', 'Nina', 'Dario', 'Ella', 'Marco'], 'n', ['#e3f2fd', '#ffe0b2', '#d7ccc8', '#ffccbc']);
  // Thermalbad, Rodelbahn, Husky-Station, Eishockey, Iglu-Siedlung, Kletterhalle, Lagerfeuer
  reserve(cx + 194, cz - 200, cx + 246, cz - 156); pool(K, w, cx + 220, cz - 180, 'Thermalbad ♨️');
  reserve(cx - 260, cz - 205, cx - 180, cz - 168); slideTower(K, cx - 220, cz - 200, 16, '#4fc3f7');
  signPost('Rodelbahn 🛷', cx - 232, cz - 172, 'z+', '#e1f5fe', '#0277bd');
  reserve(cx - 248, cz - 82, cx - 192, cz - 36); zoo(K, w, cx - 220, cz - 60, ['dog', 'penguin', 'fox', 'bunny'], 'Husky-Station 🐕');
  reserve(cx + 195, cz - 76, cx + 246, cz - 36);
  box(cx + 220, 0, cz - 60, 40, 0.15, 24, '#b3e5fc', { k: 'ice', emissive: '#e1f5fe', emissiveIntensity: 0.2 });
  for (const [ox, oz, ww, dd] of [[0, -12.3, 40.6, 0.6], [0, 12.3, 40.6, 0.6], [-20.3, -6, 0.6, 12], [-20.3, 9, 0.6, 6], [20.3, 0, 0.6, 24]]) box(cx + 220 + ox, 0, cz - 60 + oz, ww, 1, dd, '#ffffff', { tex: 'wood' });
  for (const s of [-1, 1]) { box(cx + 220 + s * 17, 0, cz - 62, 0.3, 2, 0.3, '#d32f2f'); box(cx + 220 + s * 17, 0, cz - 58, 0.3, 2, 0.3, '#d32f2f'); deco(cx + 220 + s * 17, 1.9, cz - 60, 0.3, 0.3, 4.3, '#d32f2f'); }
  it('ball', cx + 220, 0.3, cz - 60); it('snowball', cx + 214, 0.3, cz - 56);
  K.zoneAct(cx + 196, 0, cz - 42, 3.6, 3.6, 'job', { title: '🏒 Eismeister/in sein', job: job('🏒', 'Eismeister/in sein', 'Du machst das Eis wieder glatt!') });
  signPost('Eishockey 🏒', cx + 220, cz - 40, 'z+', '#e1f5fe', '#0d47a1');
  reserve(cx - 72, cz - 242, cx + 72, cz - 212);
  for (let i = 0; i < 5; i++) building({ x: cx - 60 + i * 30, z: cz - 230, w: 11, d: 11, h: 4.5, wall: '#e3f2fd', wallTex: 'tiles', roof: 'dome', roofColor: '#ffffff', door: 's', text: `Iglu ${i + 1} ❄️`, to: 'igloo', name: `Iglu ${i + 1}` });
  signPost('Iglu-Siedlung 🧊', cx - 15, cz - 214, 'z+', '#e3f2fd', '#0277bd');
  reserve(cx + 125, cz - 245, cx + 160, cz - 215);
  shop(K, w, { x: cx + 140, z: cz - 232, bw: 20, bd: 14, h: 10, name: 'Eiskletterhalle 🧗', wall: '#b3e5fc', tex: 'metal', roofColor: '#0288d1', to: 'parkour', menu: ['juice', 'apple'], menuTitle: '🧃 Kletter-Snacks', keeper: 'Bergführerin Bea', job: job('🧗', 'Kletterseile prüfen', 'Du prüfst alle Kletterseile!') });
  reserve(cx - 188, cz + 86, cx - 152, cz + 114); camp(K, w, cx - 170, cz + 100, 'Lagerfeuer 🔥');
  // Wald (dichter und grösser) – nur wo Platz ist
  for (let i = 0; i < 300; i++) {
    const x = cx + (r() - 0.5) * 660, z = cz + (r() - 0.5) * 660;
    if (!free(x, z)) continue;
    pine(x, z, 0.9 + r() * 0.8, true);
  }
  for (let i = 0; i < 60; i++) { const x = cx + (r() - 0.5) * 600, z = cz + (r() - 0.5) * 600; if (free(x, z)) snowman(x, z, 0.7 + r() * 0.4); }
  for (let i = 0; i < 20; i++) { const x = cx + (r() - 0.5) * 500, z = cz + (r() - 0.5) * 500; if (free(x, z)) crystal(x, z, 0.5 + r() * 0.6, '#80deea'); }
  for (let i = 0; i < 15; i++) { const x = cx + (r() - 0.5) * 500, z = cz + (r() - 0.5) * 500; if (free(x, z)) lamp(x, z, '#fffde7'); }
  w.destinations.schnee = [['🛬 Flughafen', cx, cz + 124], ['🎄 Dorfplatz', cx, cz + 48], ['⛸️ Eisbahn', cx - 50, cz + 8], ['🎿 Skiberg', mx - 4, mz + 30], ['❄️ Eispalast-Abenteuer', cx + 80, cz - 74], ['🧊 Gefrorener See', cx + 60, cz + 2], ['🏰 Schneefestung', sfx2, sfz + 14], ['🎪 Schneepark', spx, spz + 20], ['🛍️ Alpenstrasse', cx + 210, cz + 204], ['🏡 Chalet-Dorf', cx - 180, cz + 194], ['♨️ Thermalbad', cx + 220, cz - 156], ['🛷 Rodelbahn', cx - 220, cz - 166], ['🐕 Husky-Station', cx - 220, cz - 34], ['🏒 Eishockey', cx + 220, cz - 36], ['🧊 Iglu-Siedlung', cx, cz - 208], ['🧗 Eiskletterhalle', cx + 140, cz - 214], ['🔥 Lagerfeuer', cx - 170, cz + 116]];
  w.staticBots.push({ name: 'Kakao-Kurt', pos: [cx + 15, 0, cz + 72.2], rot: 0, anim: 'idle', job: 2, role: 'shop', say: ['Heisse Schokolade! ☕', 'Brrr, ist das kalt! 🥶', 'Mit Sahne? 😋'] });
  w.staticBots.push({ name: 'Eisläuferin Elsa', pos: [cx - 50, 0.15, cz - 10], rot: 0, anim: 'dance', role: 'fun', say: ['Komm aufs Eis! ⛸️', 'Wiii, ich drehe mich! 💫'] });
}

// ---------- Tropeninsel ----------
function tropen(K, w) {
  const L = LAND_DEFS[2];
  const { cx, cz } = L;
  const { r, box, deco, sign, signPost, palm, flowers, ladder, stairs, slide, spot, building, island, it, bench } = K;
  island(cx, cz, L.size, '#ffe0a3', 'sand', '#26c6da');
  deco(cx, 0, cz - 20, 400, 0.1, 360, '#8bc34a', { tex: 'grass', noShadow: true });
  airport(K, cx, cz + 112, '#ffb74d');
  // Wasserpark
  const wx = cx + 50, wz = cz + 30;
  deco(wx, 0, wz, 50, 0.12, 36, '#e0f7fa', { tex: 'tiles', noShadow: true });
  deco(wx, 0.13, wz + 6, 30, 0.05, 18, '#4fc3f7', { tex: 'water', emissive: '#29b6f6', emissiveIntensity: 0.3, noShadow: true });
  const towers = [[-18, -10, 10, '#ff7043'], [0, -12, 16, '#ab47bc'], [18, -10, 22, '#26a69a']];
  for (const [ox, oz, h, c] of towers) {
    box(wx + ox, 0, wz + oz, 5, h, 5, c, { tex: 'stripes' });
    ladder(wx + ox, wz + oz + 2.55, 0, h, 's', '#ffeb3b');
    deco(wx + ox, h, wz + oz, 5.6, 2.6, 5.6, '#ffffff', { shape: 'cone', tex: 'stripes' });
  }
  slide(wx - 15.5, wz - 10, 'x', 1, 14, 10, 0.2, '#ffeb3b', 2.6);
  slide(wx + 2.5, wz - 12, 'z', 1, 30, 16, 0.2, '#e91e63', 2.6);
  box(wx + 24, 21.5, wz - 10, 6, 0.5, 6, '#00bcd4');
  slide(wx + 24, wz - 7, 'z', 1, 40, 22, 0.2, '#00bcd4', 2.6);
  for (let i = 0; i < 4; i++) box(wx - 20 + i * 5, 0, wz + 16, 3, 0.4, 3, '#ffeb3b', { k: 'bounce' });
  signPost('Wasserpark 🌊', wx, wz + 20, 'z+', '#e0f7fa', '#00838f');
  // Vulkan
  const vx = cx - 60, vz = cz - 60;
  let y = 0;
  [[60, 5], [48, 5], [36, 5], [26, 5], [18, 5]].forEach(([s, h], i) => { box(vx, y, vz, s, h, s, i % 2 ? '#6d4c41' : '#795548', { shape: 'cyl', tex: 'stone' }); y += h; });
  stairs(vx, vz + 38, 'n', 6, 0, 5, '#a1887f', 'stone', 0.5, 0.8);
  ladder(vx + 10, vz + 24.05, 5, 10, 's', '#ffca28');
  ladder(vx - 6, vz + 18.05, 10, 15, 's', '#ffca28');
  ladder(vx + 4, vz + 13.05, 15, 20, 's', '#ffca28');
  ladder(vx, vz + 9.05, 20, 25, 's', '#ffca28');
  deco(vx, 25, vz, 10, 0.3, 10, '#ff5722', { shape: 'cyl', emissive: '#ff3d00', emissiveIntensity: 0.9 });
  box(vx + 6, 25, vz + 2, 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_volcano', tex: 'wood' });
  signPost('Vulkan 🌋', vx - 9, vz + 40, 'z+', '#ffccbc', '#bf360c');
  // Strandhütten
  const hut = (x, z, door, name) => building({ x, z, w: 10, d: 8, h: 5, wall: '#ffcc80', wallTex: 'wood', roof: 'pitched', roofColor: '#d7b56d', door, text: name, to: 'house2', name });
  hut(cx - 40, cz + 70, 's', 'Hütte Kokosnuss'); hut(cx - 20, cz + 70, 's', 'Hütte Ananas'); hut(cx + 0, cz + 70, 's', 'Hütte Mango');
  hut(cx - 90, cz + 20, 'e', 'Hütte Papagei'); hut(cx - 90, cz + 40, 'e', 'Hütte Delfin');
  fireworksButton(K, cx + 2, cz + 84);
  // Tiki-Bar
  box(cx - 10, 0, cz + 92, 6, 1.4, 2, '#8d6e63', { act: 'menu', title: '🍹 Tiki-Bar', menu: ['coconut', 'pineapple', 'mango', 'juice', 'icecream'], tex: 'wood' });
  for (const s of [-1, 1]) deco(cx - 10 + s * 2.8, 0, cz + 91.3, 0.3, 4, 0.3, '#795548');
  deco(cx - 10, 4, cz + 91.5, 7.5, 0.6, 4, '#d7b56d', { tex: 'hedge' });
  // Abenteuer-Tempel
  const tx = cx + 70, tz = cz - 70;
  box(tx, 0, tz, 30, 4, 30, '#a1887f', { tex: 'stone' });
  box(tx, 4, tz, 24, 4, 24, '#8d6e63', { tex: 'stone' });
  stairs(tx, tz + 12 + 9.6, 'n', 6, 0, 8, '#bcaaa4', 'stone', 0.5, 0.6);
  building({ x: tx, z: tz, w: 18, d: 18, h: 16, wall: '#9e9d24', wallTex: 'stone', roof: 'flat', roofColor: '#827717', door: 's', text: 'Dschungel-Tempel 🗿', to: 'adv:2', name: 'Dschungel-Tempel' });
  K.portal(tx, 8, tz + 10.4, 3, 1.6, 'adv:2', 'Dschungel-Tempel', [tx, tz + 26], 0);
  deco(tx, 8, tz + 9.06, 2.6, 3.6, 0.15, '#5d4037', { tex: 'wood' });
  for (let i = 0; i < 4; i++) spot(cx + 6 + i * 6, cz + 96, [0, 2, 3, 4][i], [5, 1, 8, 6][i], Math.PI);
  spot(cx - 80, cz - 30, 5, 3, 0); spot(cx - 70, cz - 30, 6, 1, 0);
  spot(cx + 80, cz + 20, 5, 5, Math.PI); spot(cx + 90, cz + 20, 6, 0, Math.PI);
  // Strandbar & Shops
  const bx = cx + 40, bz = cz + 80;
  box(bx, 0, bz, 5, 1.4, 2.4, '#ff8a65', { act: 'menu', title: '🍦 Glacé-Stand', menu: ['icecream', 'juice', 'coconut'], tex: 'wood' });
  sign('Glacé 🍦', bx, 2.8, bz, 5, 1, 'z+', '#ffffff', '#e65100', false);
  K.zoneAct(bx, 0, bz + 3, 6, 3, 'job', { title: '🍦 Glacé verkaufen', jobId: 3 });
  // Surfschule
  box(cx - 60, 0, cz + 80, 8, 3, 6, '#4fc3f7', { tex: 'wood' });
  sign('Surfschule 🏄', cx - 60, 4, cz + 83.2, 7, 1.2, 'z+', '#ffffff', '#00838f', false);
  K.zoneAct(cx - 60, 0, cz + 86, 8, 3, 'job', { title: '🏄 In der Surfschule arbeiten', jobId: 5 });
  // Zusätzliche Hütten
  hut(cx + 40, cz + 40, 's', 'Hütte Papaya'); hut(cx + 60, cz + 40, 's', 'Hütte Flamingo');
  hut(cx - 60, cz + 40, 's', 'Hütte Schildkröte'); hut(cx + 80, cz - 20, 'w', 'Hütte Koralle');
  // Korallenriff (Unterwasser-Bereich)
  const rx = cx - 120, rz = cz - 40;
  deco(rx, 0, rz, 30, 0.12, 20, '#e0f7fa', { tex: 'tiles', noShadow: true });
  for (let i = 0; i < 8; i++) deco(rx + (r() - 0.5) * 26, 0, rz + (r() - 0.5) * 16, 1.5 + r(), 2 + r() * 3, 1.5 + r(), ['#e91e63', '#ff5722', '#ffeb3b', '#4caf50'][i % 4], { shape: 'cyl' });
  it('turtle', rx - 6, 0.2, rz); it('dolphin', rx + 8, 0.2, rz + 4); it('turtle', rx, 0.2, rz - 6);
  signPost('Korallenriff 🐠', rx, rz + 14, 'z+', '#e0f7fa', '#00695c');
  // Piratenschiff
  const px2 = cx + 120, pz2 = cz + 40;
  box(px2, 0, pz2, 18, 3, 6, '#795548', { tex: 'wood' });
  box(px2, 3, pz2, 16, 1, 5, '#8d6e63', { tex: 'wood' });
  deco(px2, 0, pz2, 0.3, 10, 0.3, '#5d4037');
  deco(px2, 8, pz2, 6, 4, 0.2, '#ffffff');
  box(px2 + 6, 4, pz2 + 1, 1.4, 1, 1.4, '#8d6e63', { act: 'treasure', key: 'chest_pirate', tex: 'wood' });
  stairs(px2 - 8 - 4.8, pz2, 'e', 3, 0, 4, '#a1887f', 'wood', 0.5, 0.6);
  signPost('Piratenschiff ☠️', px2, pz2 + 6, 'z+', '#fff8e1', '#4e342e');
  // Strand-Volleyball
  const vbx = cx + 30, vbz = cz + 60;
  deco(vbx, 0, vbz, 14, 0.1, 8, '#ffe0b2', { tex: 'sand', noShadow: true });
  deco(vbx, 0, vbz, 0.15, 3, 0.15, '#795548');
  deco(vbx, 2.2, vbz, 8, 0.08, 0.15, '#ffffff');
  signPost('Volleyball 🏐', vbx, vbz + 6, 'z+', '#fff8e1', '#e65100');
  // Zusätzliche Hütten am Rand
  hut(cx - 120, cz + 60, 's', 'Hütte Seestern'); hut(cx - 120, cz + 80, 's', 'Hütte Muschel');
  hut(cx + 120, cz - 20, 'w', 'Hütte Delfin II'); hut(cx + 120, cz - 40, 'w', 'Hütte Hai');
  // ---------- Neue Orte auf der Tropeninsel ----------
  const { reserve, free } = makeReserve([]);
  reserve(cx - 110, cz - 120, cx + 110, cz + 120);
  reserve(cx - 137, cz - 52, cx - 103, cz - 26); reserve(cx + 98, cz + 30, cx + 138, cz + 50);
  reserve(cx - 127, cz + 54, cx - 113, cz + 86); reserve(cx + 113, cz - 46, cx + 127, cz - 14);
  // Strandpromenade mit Läden
  reserve(cx - 275, cz + 178, cx - 125, cz + 206);
  shopRow(K, w, cx - 260, cz + 190, 40, 's', [
    { name: 'Kokos-Café 🥥', wall: '#ffe0b2', tex: 'wood', roof: 'pitched', roofColor: '#d7b56d', to: 'cafe', menu: ['coconut', 'mango', 'juice'], keeper: 'Kiki', job: job('🥥', 'Kokosnüsse knacken', 'Du knackst frische Kokosnüsse!') },
    { name: 'Strandmode 👙', wall: '#b2ebf2', awning: '#00acc1', to: 'boutique', menu: ['waterballoon', 'frisbee'], menuTitle: '🏖️ Strand-Spielzeug', keeper: 'Lulu', wardrobe: '👙 Bademode', job: job('👙', 'Im Strandladen arbeiten', 'Du faltest Badetücher!', 4, 3) },
    { name: 'Insel-Markt 🍍', wall: '#fff59d', awning: '#fbc02d', to: 'market', menu: ['pineapple', 'banana', 'mango', 'coconut'], keeper: 'Malia', job: job('🍍', 'Früchte verkaufen', 'Du verkaufst frische Früchte!', 4, 3) },
    { name: 'Beach-Salon 💇', wall: '#f8bbd0', awning: '#ec407a', to: 'salon', menu: ['juice'], menuTitle: '🍹 Salon-Drinks', keeper: 'Frisörin Fifi', job: job('💇', 'Haare flechten', 'Du flechtest bunte Zöpfe!', 4, 3) },
  ]);
  // Bungalow-Dorf
  reserve(cx + 120, cz - 252, cx + 270, cz - 188);
  houseRow(K, cx + 130, cz - 200, 22, ['Kai', 'Moana', 'Lani', 'Koa', 'Nalu', 'Mele', 'Tiki'], 's', ['#ffcc80', '#b2ebf2', '#f8bbd0', '#fff59d']);
  houseRow(K, cx + 130, cz - 240, 22, ['Ari', 'Lea', 'Noa', 'Malu', 'Kiri', 'Ola', 'Pua'], 's', ['#b2ebf2', '#ffcc80', '#fff59d', '#f8bbd0']);
  // Hafen mit Bootssteg und Booten
  reserve(cx + 300, cz + 132, cx + 352, cz + 168);
  shop(K, w, { x: cx + 318, z: cz + 150, door: 'e', name: 'Hafen-Kiosk ⚓', wall: '#e3f2fd', tex: 'wood', roofColor: '#1565c0', to: 'house2', menu: ['juice', 'icecream'], keeper: 'Kapitän Kurt', say: ['Ahoi! ⚓', 'Nimm ein Boot und fahr aufs Meer! 🚤', 'Am Steg kannst du fischen! 🎣'], job: job('⚓', 'Boote putzen', 'Du schrubbst die Boote blitzblank!') });
  pier(K, cx + 340, cz + 150, 1, 80);
  // Leuchtturm, Lagune, Schildkröten-Station, Rutschenturm, Freizeitpark, Lagerfeuer
  reserve(cx + 290, cz + 248, cx + 310, cz + 272); lighthouse(K, cx + 300, cz + 255, 'chest_lighthouse', 20);
  reserve(cx - 246, cz - 180, cx - 194, cz - 138); pool(K, w, cx - 220, cz - 160, 'Lagunen-Bad 🏝️');
  reserve(cx + 172, cz + 206, cx + 228, cz + 254); zoo(K, w, cx + 200, cz + 230, ['turtle', 'dolphin', 'parrot', 'butterfly'], 'Schildkröten-Station 🐢');
  reserve(cx - 35, cz - 228, cx + 35, cz - 195); slideTower(K, cx, cz - 220, 16, '#26c6da');
  signPost('Wasserrutschen-Turm 🌊', cx - 12, cz - 192, 'z+', '#e0f7fa', '#00838f');
  reserve(cx - 247, cz - 290, cx - 153, cz - 228); funPark(K, w, cx - 200, cz - 260, 'Insel-Kirmes 🎡');
  reserve(cx - 137, cz + 246, cx - 103, cz + 276); camp(K, w, cx - 120, cz + 260, 'Strand-Lagerfeuer 🔥');
  reserve(cx + 178, cz + 108, cx + 222, cz + 142); sportsField(K, w, cx + 200, cz + 120, 'Beach-Fussball ⚽');
  // Palmen (dichter und grösser) – nur wo Platz ist
  for (let i = 0; i < 250; i++) {
    const x = cx + (r() - 0.5) * 660, z = cz + (r() - 0.5) * 660;
    if (!free(x, z)) continue;
    palm(x, z, 0.8 + r() * 0.5);
  }
  for (let i = 0; i < 30; i++) palm(cx - 80 + (i % 15) * 12, cz + 82 + Math.floor(i / 15) * 40, 0.9);
  flowers(cx - 30, cz + 50, 10, 4, 18, ['#ff4081', '#ffeb3b', '#ff9800', '#e040fb']);
  flowers(cx + 50, cz + 60, 12, 4, 20, ['#ff4081', '#e040fb', '#ffeb3b']);
  flowers(cx - 100, cz + 30, 8, 4, 16, ['#ff4081', '#ff9800']);
  for (let i = 0; i < 10; i++) { const x = cx + (r() - 0.5) * 400, z = cz + (r() - 0.5) * 400; if (free(x, z)) bench(x, z, Math.floor(r() * 4) * Math.PI / 2, '#a1887f'); }
  it('parrot', cx - 12, 1.4, cz + 92); it('coconut', cx - 8, 1.4, cz + 92);
  it('parrot', cx + 100, 0.2, cz + 50); it('turtle', cx - 100, 0.2, cz - 20);
  w.destinations.tropen = [['🛬 Flughafen', cx, cz + 124], ['🌊 Wasserpark', wx, wz + 24], ['🌋 Vulkan', vx, vz + 40], ['🍹 Tiki-Bar', cx - 10, cz + 96], ['🗿 Dschungel-Tempel', tx, tz + 26], ['🛖 Strandhütten', cx - 20, cz + 76], ['🐠 Korallenriff', rx, rz + 16], ['☠️ Piratenschiff', px2 - 14, pz2], ['🛍️ Strandpromenade', cx - 200, cz + 204], ['🏡 Bungalow-Dorf', cx + 200, cz - 186], ['⚓ Hafen & Boote', cx + 335, cz + 140], ['🗼 Leuchtturm', cx + 300, cz + 266], ['🏝️ Lagunen-Bad', cx - 220, cz - 136], ['🐢 Schildkröten-Station', cx + 200, cz + 256], ['🌊 Wasserrutschen-Turm', cx, cz - 188], ['🎡 Insel-Kirmes', cx - 200, cz - 226], ['🔥 Strand-Lagerfeuer', cx - 120, cz + 278], ['⚽ Beach-Fussball', cx + 200, cz + 143]];
  w.staticBots.push({ name: 'Tiki-Toni', pos: [cx - 10, 0, cz + 90.4], rot: 0, anim: 'idle', role: 'shop', say: ['Aloha! 🌺', 'Frische Kokosnuss! 🥥', 'Ein Mango-Drink? 🥭'] });
}

// ---------- Zauberwald ----------
function zauber(K, w) {
  const L = LAND_DEFS[3];
  const { cx, cz } = L;
  const { r, box, deco, sign, signPost, tree, mushroom, crystal, flowers, ladder, stairs, slide, ramp, spot, building, island, it, bench, lamp } = K;
  island(cx, cz, L.size, '#7cb342', 'grass', '#7e57c2');
  airport(K, cx, cz + 112, '#ce93d8');
  // Feenschloss
  const sx = cx, sz = cz - 60;
  building({ x: sx, z: sz, w: 40, d: 26, h: 16, wall: '#f8bbd0', wallTex: 'brick', roof: 'flat', roofColor: '#ec407a', door: 's', text: 'Feenschloss 🏰', to: 'castle', name: 'Feenschloss', signFg: '#ad1457' });
  for (const [ox, oz] of [[-20, -13], [20, -13], [-20, 13], [20, 13]]) {
    box(sx + ox, 0, sz + oz, 7, 22, 7, '#f48fb1', { shape: 'cyl', tex: 'brick' });
    deco(sx + ox, 22, sz + oz, 8.4, 7, 8.4, '#ab47bc', { shape: 'cone' });
  }
  for (let i = 0; i < 10; i++) deco(sx - 18 + i * 4, 16, sz + 13, 1.6, 1.4, 1.6, '#f8bbd0', { tex: 'brick' });
  // Riesenpilze zum Hochhüpfen
  const caps = ['#e53935', '#ab47bc', '#ff7043', '#ec407a', '#7e57c2'];
  let px = cx - 70, pz = cz + 30, h = 1.5, last = null;
  for (let i = 0; i < 12; i++) {
    mushroom(px, pz, h, 2.2 + r() * 0.6, caps[i % caps.length]);
    last = [px, pz, h];
    px += (r() < 0.5 ? 1 : -0.4) * 4.5; pz -= 4.5; h += 1.6;
  }
  box(last[0], last[2] + 0.6, last[1], 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_mushroom', tex: 'wood' });
  signPost('Pilz-Parkour 🍄', cx - 70, cz + 40, 'z+', '#fff3e0', '#c62828');
  // Baumhäuser
  const trees = [[cx + 60, cz + 20], [cx + 85, cz + 20], [cx + 72, cz - 8]];
  for (const [x, z] of trees) {
    box(x, 0, z, 3, 12, 3, '#6d4c41', { shape: 'cyl', tex: 'wood' });
    box(x, 12, z, 9, 0.5, 9, '#a1887f', { tex: 'wood' });
    deco(x, 12.5, z, 8, 3, 0.3, '#8d6e63', { tex: 'wood' });
    deco(x, 15.5, z, 11, 5, 11, '#ba68c8', { shape: 'sphere', tex: 'leaves' });
    ladder(x, z + 4.55, 0, 12.5, 's', '#ffca28');
  }
  box((trees[0][0] + trees[1][0]) / 2, 12.2, trees[0][1], 16, 0.3, 2, '#bcaaa4', { tex: 'wood' });
  box(trees[2][0], 12.2, (trees[0][1] + trees[2][1]) / 2 + 2, 2, 0.3, 20, '#bcaaa4', { tex: 'wood' });
  slide(trees[1][0] + 4.5, trees[1][1], 'x', 1, 20, 12.4, 0.2, '#ff4081', 2.4);
  signPost('Baumhäuser 🌳', cx + 72, cz + 34, 'z+', '#f3e5f5', '#6a1b9a');
  // Einhornwiese & Regenbogen
  deco(cx, 0, cz + 50, 50, 0.1, 30, '#c5e1a5', { tex: 'grass', noShadow: true });
  for (let i = 0; i < 7; i++) {
    for (let a = 0; a <= 12; a++) {
      const t = (a / 12) * Math.PI, R = 14 - i * 0.8;
      deco(cx + Math.cos(t) * R, Math.sin(t) * R, cz + 40, 1.6, 0.8, 0.8, RAINBOW[i], { emissive: RAINBOW[i], emissiveIntensity: 0.4, noShadow: true });
    }
  }
  fireworksButton(K, cx + 6, cz + 63);
  it('unicorn', cx - 8, 0.1, cz + 52); it('unicorn', cx + 10, 0.1, cz + 56); it('fox', cx + 30, 0.1, cz + 60);
  // Feenkreis zum Tanzen
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    crystal(cx - 40 + Math.cos(a) * 9, cz - 10 + Math.sin(a) * 9, 0.7, PASTEL[i % PASTEL.length]);
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) K.add(P(cx - 42 + i * 2, 0.1, cz - 12 + j * 2, 1.96, 0.2, 1.96, RAINBOW[(i + j) % 7], { k: 'dance' }));
  // Zauberturm (Abenteuer)
  building({ x: cx + 70, z: cz - 70, w: 20, d: 20, h: 22, wall: '#7e57c2', wallTex: 'stars', roof: 'flat', roofColor: '#4527a0', door: 's', text: 'Zauberturm 🔮 Abenteuer', to: 'adv:3', name: 'Zauberturm' });
  deco(cx + 70, 22, cz - 70, 22, 10, 22, '#5e35b1', { shape: 'cone' });
  for (let i = 0; i < 4; i++) spot(cx - 20 + i * 7, cz + 96, [3, 4, 0, 2][i], [2, 1, 4, 8][i], Math.PI);
  spot(cx - 50, cz - 10, 5, 6, Math.PI / 2); spot(cx - 40, cz - 10, 5, 2, Math.PI / 2);
  // Zauberladen
  building({ x: cx - 70, z: cz + 60, w: 12, d: 10, h: 6, wall: '#9575cd', wallTex: 'stars', roof: 'pitched', roofColor: '#7e57c2', door: 's', text: 'Zauberladen 🔮', to: 'house2', name: 'Zauberladen' });
  box(cx - 70, 0, cz + 72, 5, 1.4, 2.4, '#9575cd', { act: 'menu', title: '🧪 Zaubertränke', menu: ['juice', 'cake'], tex: 'wood' });
  K.zoneAct(cx - 70, 0, cz + 76, 6, 3, 'job', { title: '🧪 Zaubertränke brauen', jobId: 5 });
  // Hexenhaus
  building({ x: cx - 40, z: cz - 60, w: 10, d: 10, h: 5, wall: '#6d4c41', wallTex: 'wood', roof: 'pitched', roofColor: '#4e342e', door: 's', text: 'Hexenhaus 🧙', to: 'house2', name: 'Hexenhaus' });
  // Magischer Teich
  const ptx = cx + 100, ptz = cz + 50;
  deco(ptx, 0, ptz, 24, 0.12, 18, '#e1bee7', { tex: 'water', shape: 'cyl', emissive: '#ce93d8', emissiveIntensity: 0.4, noShadow: true, opacity: 0.85 });
  for (let i = 0; i < 6; i++) deco(ptx + Math.cos(i) * 10, 0, ptz + Math.sin(i) * 8, 2, 0.3, 2, '#e8f5e9', { shape: 'cyl' });
  signPost('Magischer Teich 🌸', ptx, ptz + 12, 'z+', '#f3e5f5', '#6a1b9a');
  it('butterfly', ptx - 5, 0.2, ptz + 3); it('butterfly', ptx + 6, 0.2, ptz - 2);
  // Drachenhöhle
  const dhx = cx - 100, dhz = cz - 60;
  box(dhx, 0, dhz, 20, 10, 16, '#5d4037', { tex: 'stone' });
  box(dhx, 0, dhz + 8.5, 10, 8, 1, '#000000', { invisible: true });
  deco(dhx, 0, dhz + 8, 12, 8, 0.6, '#4e342e', { tex: 'stone' });
  box(dhx, 0, dhz + 6, 6, 6, 2, '#3e2723', { tex: 'stone' });
  box(dhx + 4, 0, dhz + 2, 1.4, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_dragon', tex: 'wood' });
  signPost('Drachenhöhle 🐉', dhx, dhz + 12, 'z+', '#efebe9', '#4e342e');
  // Elfendorf
  const edx = cx - 60, edz = cz + 80;
  for (let i = 0; i < 5; i++) {
    const ex = edx + (i - 2) * 14, ez = edz;
    tree(ex, ez, 1.4, 0, ['#a5d6a7', '#81c784', '#66bb6a']);
    box(ex, 3, ez, 6, 0.4, 6, '#a1887f', { tex: 'wood' });
    ladder(ex, ez + 3.05, 0, 3.5, 's', '#ffca28');
  }
  for (let i = 0; i < 4; i++) box(edx + (i - 1.5) * 14, 3.2, edz, 6, 0.3, 1.5, '#bcaaa4', { tex: 'wood' });
  signPost('Elfendorf 🧝', edx, edz + 8, 'z+', '#e8f5e9', '#2e7d32');
  // Geisterwald-Pfad
  for (let i = 0; i < 10; i++) {
    const gx = cx + 80 + Math.sin(i * 0.8) * 15, gz = cz - 40 - i * 12;
    tree(gx, gz, 1.8, 0, ['#4a148c', '#311b92', '#1a237e']);
    if (i % 3 === 0) deco(gx, 4, gz, 2, 2, 2, '#ff9800', { shape: 'sphere', emissive: '#ff9800', emissiveIntensity: 0.8 });
  }
  // ---------- Neue Orte im Zauberwald ----------
  const { reserve, free } = makeReserve([]);
  reserve(cx - 110, cz - 120, cx + 110, cz + 120);
  reserve(cx - 112, cz - 70, cx - 88, cz - 46); reserve(cx + 86, cz + 38, cx + 114, cz + 64); reserve(cx + 62, cz - 150, cx + 98, cz - 36);
  // Feenmarkt mit Läden
  reserve(cx + 125, cz + 178, cx + 280, cz + 206);
  shopRow(K, w, cx + 140, cz + 190, 40, 's', [
    { name: 'Feen-Teestube 🫖', wall: '#f8bbd0', tex: 'wood', roof: 'pitched', roofColor: '#ab47bc', to: 'cafe', menu: ['cake', 'cookie', 'juice'], keeper: 'Fee Flora', keeperJob: 9, job: job('🫖', 'Feen-Tee kochen', 'Du kochst glitzernden Feen-Tee!') },
    { name: 'Zauberkleider 👗', wall: '#e1bee7', tex: 'stars', awning: '#8e24aa', to: 'boutique', menu: ['butterfly'], menuTitle: '🦋 Schmetterlinge', keeper: 'Schneiderin Selma', wardrobe: '🧚 Feenkleider', wardrobeTab: 'jobs', job: job('👗', 'Zauberkleider nähen', 'Du nähst ein Glitzerkleid!') },
    { name: 'Feen-Salon 💇', wall: '#d1c4e9', tex: 'stars', awning: '#7e57c2', to: 'salon', menu: ['juice'], menuTitle: '🧃 Zaubersaft', keeper: 'Fee Mira', keeperJob: 9, job: job('💇', 'Feen frisieren', 'Du zauberst bunte Frisuren!', 4, 3) },
    { name: 'Einhorn-Stall 🦄', wall: '#fff3e0', tex: 'wood', roof: 'pitched', roofColor: '#ec407a', to: 'pets', menu: ['carrot', 'apple'], menuTitle: '🥕 Einhorn-Futter', keeper: 'Stallmeisterin Sophie', keeperJob: 8, adopt: true, job: job('🦄', 'Einhörner bürsten', 'Du bürstest die Einhörner, bis sie glitzern!') },
  ]);
  // Feendorf mit Pilzhäusern
  reserve(cx - 270, cz - 262, cx - 125, cz - 188);
  mushroomHouses(K, cx - 260, cz - 200, 20, ['Lili', 'Funkel', 'Glimmer', 'Tau', 'Moos', 'Sternchen', 'Blüte']);
  mushroomHouses(K, cx - 260, cz - 245, 20, ['Wolke', 'Regen', 'Sonne', 'Mond', 'Nebel', 'Wind', 'Schnee']);
  // Zauberschule (innen Labyrinth), Einhorn-Koppel, Kletterbaum, Feen-Kirmes, Rutschenturm, Lagerfeuer
  reserve(cx + 180, cz - 216, cx + 222, cz - 180);
  shop(K, w, { x: cx + 200, z: cz - 205, bw: 30, bd: 20, h: 14, name: 'Zauberschule 🪄', wall: '#b39ddb', tex: 'stars', roofColor: '#4527a0', to: 'maze', menu: ['juice', 'cake'], menuTitle: '🪄 Pausen-Kiosk', keeper: 'Professorin Funkel', keeperJob: 9, say: ['Willkommen in der Zauberschule! 🪄', 'Drinnen ist ein magisches Labyrinth! 🌀', 'Simsalabim! ✨'], job: job('🪄', 'Zaubern lernen', 'Du lernst einen Glitzer-Zauber! ✨', 6, 5) });
  reserve(cx - 248, cz + 178, cx - 192, cz + 224); zoo(K, w, cx - 220, cz + 200, ['unicorn', 'fox', 'bunny', 'butterfly'], 'Einhorn-Koppel 🦄');
  reserve(cx - 262, cz - 10, cx - 236, cz + 24);
  shop(K, w, { x: cx - 250, z: cz + 6, door: 'e', bw: 16, bd: 18, h: 12, name: 'Riesen-Kletterbaum 🌳', wall: '#795548', tex: 'wood', roofColor: '#66bb6a', to: 'parkour', menu: ['apple'], menuTitle: '🍎 Kletter-Äpfel', keeper: 'Elfe Elin', job: job('🌳', 'Kletterbaum pflegen', 'Du pflegst den Riesenbaum!') });
  reserve(cx - 47, cz - 270, cx + 47, cz - 205); funPark(K, w, cx, cz - 240, 'Feen-Kirmes 🎠');
  reserve(cx + 215, cz + 30, cx + 285, cz + 70); slideTower(K, cx + 250, cz + 40, 14, '#ec407a');
  signPost('Regenbogen-Rutschen 🌈', cx + 240, cz + 66, 'z+', '#f3e5f5', '#6a1b9a');
  reserve(cx + 222, cz - 104, cx + 258, cz - 74); camp(K, w, cx + 240, cz - 90, 'Elfen-Lagerfeuer 🔥');
  reserve(cx + 128, cz + 98, cx + 172, cz + 132); sportsField(K, w, cx + 150, cz + 112, 'Feen-Fussball ⚽');
  // Wald (viel dichter und grösser) – nur wo Platz ist
  for (let i = 0; i < 280; i++) {
    const x = cx + (r() - 0.5) * 660, z = cz + (r() - 0.5) * 660;
    if (!free(x, z)) continue;
    if (r() < 0.6) tree(x, z, 1 + r() * 0.6, 0, ['#ba68c8', '#f06292', '#9575cd', '#4db6ac']);
    else mushroom(x, z, 1 + r() * 3, 1.5 + r(), caps[i % caps.length]);
  }
  for (let i = 0; i < 70; i++) { const x = cx + (r() - 0.5) * 600, z = cz + (r() - 0.5) * 600; if (free(x, z)) crystal(x, z, 0.6 + r(), PASTEL[i % PASTEL.length]); }
  flowers(cx + 20, cz + 80, 12, 4, 24);
  flowers(cx - 60, cz + 30, 10, 4, 20);
  flowers(cx + 100, cz - 20, 8, 3, 16);
  for (let i = 0; i < 15; i++) { const x = cx + (r() - 0.5) * 500, z = cz + (r() - 0.5) * 500; if (free(x, z)) bench(x, z, Math.floor(r() * 4) * Math.PI / 2, '#8d6e63'); }
  w.destinations.zauber = [['🛬 Flughafen', cx, cz + 124], ['🏰 Feenschloss', sx, sz + 20], ['🍄 Pilz-Parkour', cx - 70, cz + 44], ['🌳 Baumhäuser', cx + 72, cz + 38], ['🦄 Einhornwiese', cx, cz + 62], ['🔮 Zauberturm', cx + 70, cz - 54], ['💎 Feenkreis', cx - 40, cz + 2], ['🌸 Magischer Teich', ptx, ptz + 14], ['🐉 Drachenhöhle', dhx, dhz + 14], ['🧝 Elfendorf', edx, edz + 10], ['🛍️ Feenmarkt', cx + 200, cz + 204], ['🍄 Feendorf', cx - 200, cz - 186], ['🪄 Zauberschule', cx + 200, cz - 186], ['🦄 Einhorn-Koppel', cx - 220, cz + 226], ['🌳 Riesen-Kletterbaum', cx - 236, cz + 6], ['🎠 Feen-Kirmes', cx, cz - 206], ['🌈 Regenbogen-Rutschen', cx + 250, cz + 70], ['🔥 Elfen-Lagerfeuer', cx + 240, cz - 72], ['⚽ Feen-Fussball', cx + 150, cz + 134]];
}

// Innenwelten der Länder
function landInteriors(K, w) {
  const { box, deco, shell, sofa, bed, table, chair, it, stairs, ladder, slide, sign } = K;
  const add = (key, i) => { w.interiors[key] = { x: -900 + i * 200, z: -1500 }; return w.interiors[key]; };
  // Iglu
  {
    const o = add('igloo', 10);
    o.spawn = shell(o.x, o.z, 22, 18, 7, '#e3f2fd', 'tiles', '#ffffff', 'sand', 'Gemütliches Iglu ❄️');
    box(o.x, 0, o.z - 7, 4, 1.4, 1.4, '#795548', { tex: 'brick' });
    deco(o.x, 0.3, o.z - 6.3, 2, 1, 0.3, '#ff7043', { emissive: '#ff5722', emissiveIntensity: 0.9 });
    sofa(o.x - 6, o.z - 2, Math.PI / 2, '#e57373', 4);
    bed(o.x + 7, 0, o.z - 4, 0, '#90caf9');
    box(o.x + 7, 0, o.z + 4, 2.4, 1.2, 1.4, '#a1887f', { act: 'menu', title: '☕ Kakao kochen', menu: ['cocoa', 'cookie'] });
    it('penguin', o.x - 3, 0, o.z + 3);
  }
  // Feenschloss innen
  {
    const o = add('castle', 11);
    const W = 50, D = 40, H = 18;
    o.spawn = shell(o.x, o.z, W, D, H, '#f8bbd0', 'checker', '#f48fb1', 'hearts', 'Feenschloss 🏰');
    // Ballsaal
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) K.add(P(o.x - 5 + i * 2, 0.1, o.z - 2 + j * 2, 1.96, 0.2, 1.96, PASTEL[(i + j) % PASTEL.length], { k: 'dance' }));
    // Thron
    box(o.x, 0, o.z - 16, 10, 1, 5, '#ce93d8', { tex: 'carpet' });
    box(o.x, 1, o.z - 17, 2.2, 1, 2, '#ffd54f', { act: 'sit', rot: 0, emissive: '#ffb300', emissiveIntensity: 0.3 });
    deco(o.x, 2, o.z - 18.2, 2.4, 3.2, 0.4, '#ffd54f', { emissive: '#ffb300', emissiveIntensity: 0.3 });
    // Galerie mit Treppen
    box(o.x, 6, o.z - 12, W, 0.5, 16, '#f3e5f5', { tex: 'carpet' });
    stairs(o.x - 22, o.z + 12, 'n', 4, 0, 6.5, '#ce93d8', 'carpet', 0.5, 1.2);
    stairs(o.x + 22, o.z + 12, 'n', 4, 0, 6.5, '#ce93d8', 'carpet', 0.5, 1.2);
    for (let i = 0; i < 12; i++) deco(o.x - 22 + i * 4, 6.5, o.z - 4.1, 0.2, 1.1, 0.2, '#ffffff');
    bed(o.x - 16, 6.5, o.z - 14, 0, '#f48fb1');
    K.wardrobePart(o.x - 8, o.z - 18.6, 3, 1.4, '👑 Prinzessinnen-Kleider', 'jobs');
    // Turm mit Leiter und Rutsche
    box(o.x + 16, 6.5, o.z - 16, 8, 6, 6, '#f48fb1', { tex: 'brick' });
    ladder(o.x + 11.95, o.z - 16, 6.5, 12.5, 'w', '#ffd54f');
    box(o.x + 16, 12.5, o.z - 18.4, 2, 1, 1, '#8d6e63', { act: 'treasure', key: 'chest_castle', tex: 'wood' });
    slide(o.x + 16, o.z - 13, 'z', 1, 26, 12.5, 0.2, '#ff80ab', 2.4);
    w.staticBots.push({ name: 'Prinzessin Lili', pos: [o.x, 2, o.z - 16.6], rot: 0, anim: 'sit', job: 7, role: 'shop', say: ['Willkommen in meinem Schloss! 👑', 'Lass uns tanzen! 💃', 'Oben im Turm ist ein Schatz! 🎁'] });
  }
}

export function addLands(K, w) {
  w.destinations = { stadt: w.destinationsStadt };
  landInteriors(K, w);
  snowland(K, w);
  tropen(K, w);
  zauber(K, w);
}
