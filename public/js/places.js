// Wiederverwendbare Orte für Hana-Stadt und die Länder: Läden, Bad, Freizeitpark, Zoo, Sportplatz …
import { P, RAINBOW, PASTEL, DIR } from './kit.js';

const SIGN_FACE = { s: 'z+', n: 'z-', e: 'x+', w: 'x-' };

// Merkt sich belegte Flächen, damit der Zufallswald nicht in Häuser wächst
export function makeReserve(parts) {
  const list = [];
  const reserve = (x0, z0, x1, z1, fn) => {
    const from = parts.length;
    const r = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), from };
    list.push(r);
    if (fn) fn();
    r.to = parts.length;
    return r;
  };
  const free = (x, z, pad = 3) => !list.some(r => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad);
  return { reserve, free, list };
}

// Laden mit Innenraum, Theke draussen, Verkäufer/in und Job
export function shop(K, w, o) {
  const { x, z, door = 's', bw = 14, bd = 11, h = 6 } = o;
  K.building({ x, z, w: bw, d: bd, h, wall: o.wall || '#fff3e0', wallTex: o.tex || 'brick', roof: o.roof || 'flat', roofColor: o.roofColor || '#8d6e63', door, text: o.name, to: o.to || 'house2', name: o.name, awning: o.awning, signFg: o.signFg });
  const [fx, fz] = DIR[door];
  const fr = { x: x + fx * (bw / 2), z: z + fz * (bd / 2) };
  const at = (side, out) => [fr.x + fx * out + (fz ? side : 0), fr.z + fz * out + (fx ? side : 0)];
  if (o.menu) {
    const [cx, cz] = at(5.5, 3.2);
    K.box(cx, 0, cz, fz ? 4 : 1.8, 1.3, fz ? 1.8 : 4, o.counter || '#ffcc80', { act: 'menu', title: o.menuTitle || o.name, menu: o.menu, tex: 'wood' });
    if (o.keeper) {
      const [kx, kz] = at(5.5, 1.5);
      w.staticBots.push({ name: o.keeper, pos: [kx, 0, kz], rot: Math.atan2(fx, fz), anim: 'idle', role: 'shop', job: o.keeperJob, say: o.say || ['Hallo! 😊', 'Was darf es sein?', 'Schön, dass du da bist! 🌟'] });
    }
  }
  if (o.job) { const [jx, jz] = at(-5.5, 3.2); K.zoneAct(jx, 0, jz, 3.6, 3.6, 'job', { title: o.job.title, job: o.job }); }
  if (o.wardrobe) { const [ax, az] = at(-(bw / 2 + 2.2), -bd / 2 + 2); K.wardrobePart(ax, az, fz ? 2.4 : 1.4, fz ? 1.4 : 2.4, o.wardrobe, o.wardrobeTab); }
  if (o.adopt) { const [ax, az] = at(bw / 2 + 2.2, -bd / 2 + 2); K.box(ax, 0, az, 2.4, 1.3, 2.4, '#ffcc80', { act: 'adopt', tex: 'wood' }); }
  if (o.pois) { const [px, pz] = at(0, 6); o.pois.push({ x: px, z: pz, act: 'idle' }); }
  return at(0, 5);
}

// Mehrere Läden in einer Reihe (Abstand dx)
export function shopRow(K, w, x0, z, dx, door, list, pois) {
  list.forEach((o, i) => shop(K, w, { x: x0 + i * dx, z, door, pois, ...o }));
}

// Häuserreihe mit Garten, alle betretbar
export function houseRow(K, x0, z, dx, names, door = 's', colors = PASTEL, roofs = ['#c62828', '#6d4c41', '#1565c0', '#2e7d32', '#ad1457'], to = 'house2') {
  names.forEach((n, i) => {
    const x = x0 + i * dx;
    K.building({ x, z, w: 11, d: 9, h: 5.5, wall: colors[i % colors.length], wallTex: i % 2 ? 'wood' : 'brick', roof: 'pitched', roofColor: roofs[i % roofs.length], door, text: `${n}s Haus`, to, name: `${n}s Haus` });
    const [fx, fz] = DIR[door];
    K.flowers(x + (fz ? 4 : fx * 7.5), z + (fx ? 4 : fz * 7.5), fz ? 3 : 1.5, fz ? 1.5 : 3, 6);
  });
}

// Rutschenturm mit breiter Treppe und zwei langen Rutschen
export function slideTower(K, x, z, h = 12, c = '#7e57c2') {
  const depth = 0.6, n = Math.round(h / 0.5);
  K.box(x, 0, z, 6, h, 6, c, { tex: 'metal' });
  K.stairs(x, z + 3 + n * depth, 'n', 3, 0, h, ['#ffffff', '#ffe082'], 'wood', 0.5, depth);
  K.slide(x + 3, z, 'x', 1, h * 1.7, h, 0.2, '#ff4081', 2.4);
  K.slide(x - 3, z, 'x', -1, h * 1.7, h, 0.2, '#29b6f6', 2.4);
  for (const [ox, oz] of [[-2.8, -2.8], [2.8, -2.8]]) { K.deco(x + ox, h, z + oz, 0.15, 3, 0.15, '#ffffff'); K.deco(x + ox + 0.6, h + 2.2, z + oz, 1.2, 0.8, 0.05, RAINBOW[(ox > 0) * 3]); }
}

// Schwimmbad: Planschbecken, Sprungturm, Rutsche, Liegen, Kiosk, Bademeister-Job
export function pool(K, w, x, z, name = 'Schwimmbad 🏊', pois) {
  K.deco(x, 0, z, 48, 0.12, 36, '#e0f7fa', { tex: 'tiles', noShadow: true });
  K.deco(x - 4, 0.13, z, 26, 0.06, 18, '#29b6f6', { tex: 'water', emissive: '#29b6f6', emissiveIntensity: 0.3, noShadow: true });
  for (const [ox, oz, ww, dd] of [[0, -9.3, 26.6, 0.6], [0, 9.3, 26.6, 0.6], [-13.3, 0, 0.6, 18], [13.3, 0, 0.6, 18]]) K.box(x - 4 + ox, 0, z + oz, ww, 0.45, dd, '#ffffff', { tex: 'tiles' });
  for (let i = 0; i < 3; i++) K.box(x - 12 + i * 5, 0, z + 3, 3, 0.35, 3, '#00e5ff', { k: 'bounce' });
  K.box(x + 15, 0, z - 8, 3, 6, 3, '#ffffff', { tex: 'tiles' });
  K.ladder(x + 15, z - 6.45, 0, 6, 's', '#90caf9');
  K.slide(x + 13.5, z - 8, 'x', -1, 12, 6, 0.2, '#ff4081', 2.4);
  for (let i = 0; i < 5; i++) K.bench(x - 14 + i * 5, z + 15, Math.PI, PASTEL[i]);
  K.box(x + 18, 0, z + 10, 1.8, 1.3, 4, '#4fc3f7', { act: 'menu', title: '🍦 Bad-Kiosk', menu: ['icecream', 'juice', 'donut'], tex: 'wood' });
  w.staticBots.push({ name: 'Bademeisterin Bea', pos: [x + 19.6, 0, z + 10], rot: -Math.PI / 2, anim: 'idle', role: 'shop', say: ['Viel Spass im Wasser! 🏊', 'Nicht rennen am Beckenrand! 😉', 'Glacé gefällig? 🍦'] });
  K.zoneAct(x + 18, 0, z - 2, 3.6, 3.6, 'job', { title: '🛟 Als Bademeister/in arbeiten', job: { emoji: '🛟', msg: 'Du passt auf alle Schwimmer auf!', stars: 5, time: 4 } });
  K.signPost(name, x, z + 19.5, 'z+', '#e0f7fa', '#0277bd');
  pois?.push({ x: x - 4, z: z + 12, act: 'dance' }, { x: x + 10, z: z + 12, act: 'idle' });
}

// Freizeitpark: Karussell, Rutschenturm, Hüpfburg, Autoscooter, Riesenrad, Zuckerwatte
export function funPark(K, w, x, z, name = 'Freizeitpark 🎡', pois) {
  K.deco(x, 0, z, 90, 0.12, 56, '#fff3e0', { tex: 'stone', noShadow: true });
  // Karussell
  const kx = x - 30, kz = z - 12;
  K.box(kx, 0, kz, 2.4, 4, 2.4, '#ffd54f', { shape: 'cyl' });
  K.deco(kx, 4, kz, 15, 2.2, 15, '#ec407a', { shape: 'cone', tex: 'stripes' });
  K.deco(kx, 0, kz, 15, 0.15, 15, '#f8bbd0', { shape: 'cyl', noShadow: true });
  for (let i = 0; i < 8; i++) K.add(P(kx + 6, 0.4, kz, 1.8, 0.8, 1.8, RAINBOW[i % 7], { m: { type: 'circle', cx: kx, cz: kz, r: 5.5, speed: 0.6, phase: (i * Math.PI) / 4 } }));
  // Rutschenturm
  slideTower(K, x - 4, z - 14, 10, '#26a69a');
  // Hüpfburg
  const hx = x + 26, hz = z - 12;
  K.box(hx, 0, hz, 12, 0.6, 12, '#ff5252', { k: 'bounce' });
  for (const [ox, oz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { K.deco(hx + ox, 0, hz + oz, 2, 5, 2, '#ffeb3b', { shape: 'cyl' }); K.deco(hx + ox, 5, hz + oz, 2.4, 1.8, 2.4, '#2979ff', { shape: 'cone' }); }
  for (const [ox, oz, ww, dd] of [[0, -6, 12, 0.8], [-6, 0, 0.8, 12], [6, 0, 0.8, 12]]) K.deco(hx + ox, 0.6, hz + oz, ww, 2.2, dd, '#ff8a80');
  // Autoscooter
  const ax = x + 22, az = z + 14;
  K.box(ax, 0, az, 26, 0.1, 18, '#455a64', { tex: 'metal' });
  for (const [ox, oz, ww, dd] of [[0, -9, 26, 0.6], [0, 9, 26, 0.6], [-13, 4, 0.6, 10], [13, 0, 0.6, 18]]) K.box(ax + ox, 0, az + oz, ww, 0.8, dd, '#ffca28');
  for (let i = 0; i < 4; i++) K.spot(ax - 8 + i * 5, az - 3 + (i % 2) * 6, 2, i * 2, Math.PI / 2);
  // Riesenrad (zum Anschauen)
  const rx = x - 30, rz = z + 16;
  for (const s of [-1, 1]) { K.deco(rx - 4, 0, rz + s * 1.6, 0.5, 13, 0.5, '#90a4ae', { rz: -0.3 }); K.deco(rx + 4, 0, rz + s * 1.6, 0.5, 13, 0.5, '#90a4ae', { rz: 0.3 }); }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    K.deco(rx + Math.cos(a) * 8, 12 + Math.sin(a) * 8 - 1, rz, 2, 2, 2.2, RAINBOW[i % 7], { shape: 'cyl' });
    K.deco(rx + Math.cos(a) * 4, 12 + Math.sin(a) * 4, rz, 0.3, 0.3, 0.3, '#ffffff', { shape: 'sphere', emissive: '#ffffff' });
  }
  K.deco(rx, 11, rz, 1.4, 1.4, 1.4, '#ffd600', { shape: 'sphere', emissive: '#ffd600' });
  // Zuckerwatte & Eintritt
  K.box(x + 2, 0, z + 20, 4, 1.3, 1.8, '#f48fb1', { act: 'menu', title: '🍭 Zuckerwatte & Snacks', menu: ['donut', 'icecream', 'juice', 'cake'], tex: 'stripes' });
  w.staticBots.push({ name: 'Clown Coco', pos: [x + 2, 0, z + 18.3], rot: Math.PI, anim: 'dance', role: 'fun', say: ['Willkommen im Freizeitpark! 🎡', 'Ab auf die Hüpfburg! 🏰', 'Wer will Zuckerwatte? 🍭'] });
  K.zoneAct(x - 8, 0, z + 20, 3.6, 3.6, 'job', { title: '🎟️ Im Freizeitpark arbeiten', job: { emoji: '🎟️', msg: 'Du verkaufst Tickets für die Bahnen!', stars: 5, time: 4 } });
  K.signPost(name, x, z + 28.5, 'z+', '#fff3e0', '#d81b60', 9);
  pois?.push({ x: hx, z: hz + 9, act: 'dance' }, { x: kx + 9, z: kz, act: 'idle' }, { x: x + 2, z: z + 24, act: 'wave' });
}

// Zoo mit Gehegen; Tiere kann man hochheben und streicheln
export function zoo(K, w, x, z, animals, name = 'Zoo 🦁', pois) {
  K.deco(x, 0, z, 52, 0.12, 40, '#c5e1a5', { tex: 'grass', noShadow: true });
  animals.slice(0, 4).forEach((a, i) => {
    const gx = x - 13 + (i % 2) * 26, gz = z - 9 + Math.floor(i / 2) * 18;
    for (const [ox, oz, ww, dd] of [[0, -7, 20, 0.3], [-10, 0, 0.3, 14], [10, 0, 0.3, 14], [-6, 7, 8, 0.3], [6, 7, 8, 0.3]]) K.box(gx + ox, 0, gz + oz, ww, 1.1, dd, '#8d6e63', { tex: 'wood' });
    for (let k = 0; k < 3; k++) K.it(a, gx - 5 + k * 5, 0.2, gz - 2 + (k % 2) * 3);
    K.tree(gx + 7, gz - 4, 0.6);
  });
  K.box(x, 0, z + 17, 2.6, 1.3, 2.6, '#ffcc80', { act: 'adopt', tex: 'wood' });
  w.staticBots.push({ name: 'Tierpflegerin Tina', pos: [x + 3, 0, z + 17], rot: 0, anim: 'wave', role: 'shop', job: 8, say: ['Möchtest du ein Tier adoptieren? 🐾', 'Die Tiere haben Hunger! 🥕', 'Streichle sie ganz lieb ❤️'] });
  K.zoneAct(x - 5, 0, z + 17, 3.6, 3.6, 'job', { title: '🥕 Tiere füttern', job: { emoji: '🥕', msg: 'Du fütterst alle Tiere!', stars: 5, time: 4 } });
  K.signPost(name, x, z + 21, 'z+', '#f1f8e9', '#33691e');
  pois?.push({ x: x, z: z + 23, act: 'wave' });
}

// Sportplatz mit Toren und Bällen
export function sportsField(K, w, x, z, name = 'Sportplatz ⚽', pois) {
  K.deco(x, 0, z, 44, 0.1, 28, '#66bb6a', { tex: 'grass', noShadow: true });
  for (const [ox, oz, ww, dd] of [[0, -13, 42, 0.3], [0, 13, 42, 0.3], [-21, 0, 0.3, 26], [21, 0, 0.3, 26], [0, 0, 0.3, 26]]) K.deco(x + ox, 0.11, z + oz, ww, 0.02, dd, '#ffffff', { noShadow: true });
  for (const s of [-1, 1]) {
    K.box(x + s * 21.5, 0, z - 3.5, 0.3, 2.6, 0.3, '#ffffff'); K.box(x + s * 21.5, 0, z + 3.5, 0.3, 2.6, 0.3, '#ffffff');
    K.deco(x + s * 21.5, 2.5, z, 0.3, 0.3, 7.3, '#ffffff');
    K.deco(x + s * 22.6, 0, z, 0.1, 2.6, 7, '#eeeeee', { opacity: 0.5 });
  }
  K.it('ball', x, 0.2, z); K.it('ball', x - 8, 0.2, z + 4); K.it('ball', x + 8, 0.2, z - 4);
  for (let i = 0; i < 4; i++) K.bench(x - 12 + i * 8, z + 16.5, Math.PI, '#90a4ae');
  K.zoneAct(x - 18, 0, z + 16.5, 3.6, 3, 'job', { title: '⚽ Fussball-Training leiten', job: { emoji: '⚽', msg: 'Du trainierst die Fussball-Kinder!', stars: 4, time: 3 } });
  K.signPost(name, x, z + 19, 'z+', '#e8f5e9', '#1b5e20');
  pois?.push({ x: x - 5, z: z + 2, act: 'idle' }, { x: x + 6, z: z - 2, act: 'dance' });
}

// Lagerfeuer mit Zelten und Sitz-Baumstämmen
export function camp(K, w, x, z, name = 'Lagerfeuer 🔥', pois) {
  K.deco(x, 0, z, 30, 0.1, 24, '#a1887f', { tex: 'sand', noShadow: true });
  K.deco(x, 0, z, 3, 0.4, 3, '#616161', { shape: 'cyl', tex: 'stone' });
  K.deco(x, 0.4, z, 1.6, 1.8, 1.6, '#ff9100', { shape: 'cone', emissive: '#ff6d00', emissiveIntensity: 1 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    K.box(x + Math.cos(a) * 5, 0, z + Math.sin(a) * 5, 1.2, 0.7, 1.2, '#795548', { act: 'sit', rot: Math.round((Math.atan2(-Math.cos(a), -Math.sin(a))) / (Math.PI / 2)) * (Math.PI / 2), tex: 'wood', shape: 'cyl' });
  }
  for (const [ox, oz, c] of [[-10, -7, '#ff7043'], [10, -7, '#42a5f5'], [-10, 7, '#66bb6a'], [10, 7, '#ab47bc']]) K.deco(x + ox, 0, z + oz, 5, 4, 5, c, { shape: 'cone' });
  K.box(x, 0, z - 9, 3.6, 1.2, 1.6, '#8d6e63', { act: 'menu', title: '🍪 Marshmallows & Kakao', menu: ['cookie', 'cocoa', 'apple'], tex: 'wood' });
  K.zoneAct(x + 5, 0, z - 9, 3.6, 3, 'job', { title: '🪵 Holz fürs Feuer sammeln', job: { emoji: '🪵', msg: 'Du sammelst Holz fürs Lagerfeuer!', stars: 4, time: 3 } });
  K.signPost(name, x, z + 13, 'z+', '#efebe9', '#4e342e');
  pois?.push({ x: x + 3, z: z + 3, act: 'idle' });
}

// Leuchtturm mit Leiter und Schatz oben
export function lighthouse(K, x, z, key, h = 18) {
  K.box(x, 0, z, 6, h, 6, '#ffffff', { tex: 'stripes' });
  for (let y = 3; y < h; y += 6) K.deco(x, y, z, 6.15, 2, 6.15, '#e53935');
  K.ladder(x, z + 3.05, 0, h, 's', '#ffca28');
  K.deco(x - 2, h, z - 2, 1.2, 1.2, 1.2, '#fff59d', { shape: 'sphere', emissive: '#ffeb3b', emissiveIntensity: 1 });
  K.box(x + 1.5, h, z - 1.5, 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key, tex: 'wood' });
  K.signPost('Leuchtturm 🗼', x, z + 8, 'z+', '#ffffff', '#c62828');
}

// Bootssteg ins Meer hinaus (axis x: nach +x / -x), mit Booten am Ende
export function pier(K, x, z, dir = 1, len = 70) {
  const cx = x + dir * len / 2;
  K.ramp(cx, z, len, 5, 0, 0, 'x', 1, '#a1887f', 'wood', { wedge: false, thick: 0.3 });
  for (let i = 0; i <= len; i += 8) for (const s of [-1, 1]) K.deco(x + dir * i, -6, z + s * 2.3, 0.4, 7, 0.4, '#6d4c41');
  for (let i = 0; i < 4; i++) K.spot(x + dir * (len - 6 - i * 7), z + 4.6, 5 + (i % 2), i * 2 + 1, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  K.zoneAct(x + dir * (len - 4), 0, z, 3.6, 3.6, 'job', { title: '🎣 Fischen gehen', job: { emoji: '🎣', msg: 'Du angelst Fische!', stars: 5, time: 5 } });
}

// Häuschen-Dorf mit Pilzdächern (Zauberwald)
export function mushroomHouses(K, x0, z, dx, names, door = 's') {
  names.forEach((n, i) => {
    const x = x0 + i * dx;
    K.building({ x, z, w: 9, d: 9, h: 5, wall: '#fff8e1', wallTex: 'wood', roof: 'flat', roofColor: '#fff8e1', door, text: `${n}s Pilzhaus`, to: 'house2', name: `${n}s Pilzhaus` });
    K.deco(x, 5, z, 13, 5, 13, ['#e53935', '#ab47bc', '#ff7043', '#ec407a'][i % 4], { shape: 'hemi', tex: 'dots' });
  });
}
