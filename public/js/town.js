// Hana-Stadt: grosse Stadt mit Strassen, Plätzen, Spielplätzen und vielen Häusern,
// die man betreten kann (jedes Haus hat eine eigene Innenwelt).
import { P, RAINBOW, PASTEL, FACE, DIR, rng, createKit } from './kit.js';
import { addLands, LAND_DEFS } from './lands.js';
import { KIDS } from './shared.js';
import { shopRow, pool, funPark, zoo, sportsField, camp, slideTower, fireworksButton } from './places.js';

export const ROADS = [-210, -90, -30, 30, 90, 210];
const RING = 210;
const ROAD_W = 10;
const G = 285;

export function makeTown() {
  const parts = [];
  const items = [];
  const pois = [];
  const staticBots = [];
  const K = createKit({ parts, items, pois, seed: 2024 });
  const { r, add, it, box, deco, sign, tree, pine, bush, flowers, lamp, bench, chair, table, sofa, bed, ladder, stairs, slide, ramp, spot, zoneAct, building, shell, wardrobePart } = K;

  // ---------- Boden, Strassen, Strand ----------
  add(P(0, -1, 0, 2 * G, 2, 2 * G, '#7cc66a', { k: 'ground', tex: 'grass' }));
  add(P(0, -1, G + 14, 2 * G, 2, 28, '#ffe0a3', { k: 'ground', tex: 'sand' }));
  K.sea(0, 0, 2000);
  K.beach(-G, -G, G, G + 28);
  for (const rr of ROADS) {
    deco(rr, 0, 0, ROAD_W, 0.06, 2 * RING + ROAD_W, '#5f6b73', { tex: 'asphalt', noShadow: true });
    deco(0, 0.002, rr, 2 * RING + ROAD_W, 0.06, ROAD_W, '#5f6b73', { tex: 'asphalt', noShadow: true });
    for (const s of [-1, 1]) {
      deco(rr + s * 6.5, 0, 0, 3, 0.14, 2 * RING + 16, '#e0e0e0', { tex: 'tiles', noShadow: true });
      deco(0, 0.004, rr + s * 6.5, 2 * RING + 16, 0.14, 3, '#e0e0e0', { tex: 'tiles', noShadow: true });
    }
    for (let t = -RING + 4; t < RING; t += 8) {
      if (ROADS.some(q => Math.abs(q - t) < 9)) continue;
      deco(rr, 0.06, t, 0.35, 0.02, 3.2, '#ffffff', { noShadow: true });
      deco(t, 0.062, rr, 3.2, 0.02, 0.35, '#ffffff', { noShadow: true });
    }
  }
  for (const rx of ROADS) for (const rz of ROADS) {
    for (let i = -2; i <= 2; i++) {
      deco(rx + i * 1.6, 0.064, rz + 9.5, 0.9, 0.02, 3, '#ffffff', { noShadow: true });
      deco(rx + 9.5, 0.064, rz + i * 1.6, 3, 0.02, 0.9, '#ffffff', { noShadow: true });
    }
    lamp(rx + 8.5, rz + 8.5); lamp(rx - 8.5, rz - 8.5);
    // Ampeln an den anderen zwei Ecken (die Lichter schaltet traffic.js)
    for (const [sx, sz] of [[1, -1], [-1, 1]]) {
      box(rx + sx * 7.6, 0, rz + sz * 7.6, 0.3, 4.2, 0.3, '#37474f', { shape: 'cyl' });
      deco(rx + sx * 7.6, 4.2, rz + sz * 7.6, 0.75, 2.2, 0.75, '#263238');
      deco(rx + sx * 7.6, 6.4, rz + sz * 7.6, 0.95, 0.15, 0.95, '#263238');
    }
  }
  // Bäume entlang der Strassen
  for (const rr of ROADS) for (let t = -150; t <= 150; t += 20) {
    if (ROADS.some(q => Math.abs(q - t) < 14)) continue;
    if (r() < 0.55) tree(rr + 9.3, t, 0.7);
    if (r() < 0.55) tree(t, rr - 9.3, 0.7);
  }
  // Strand
  for (let x = -140; x <= 140; x += 22) {
    const c = RAINBOW[Math.floor(r() * 7)];
    deco(x, 0, G + 10, 0.15, 3.2, 0.15, '#ffffff');
    deco(x, 3.2, G + 10, 3.6, 0.6, 3.6, c, { shape: 'cone', tex: 'stripes' });
    deco(x + 1.6, 0, G + 11, 1.4, 0.05, 2.6, PASTEL[Math.floor(r() * PASTEL.length)], { tex: 'stripes' });
  }
  box(-40, 0, G + 8, 3, 5, 3, '#ffffff', { tex: 'wood' });
  ladder(-40, G + 10.05, 0, 5, 's', '#ffffff');
  deco(-40, 5, G + 8, 3.4, 0.2, 3.4, '#e53935');
  deco(-40, 6.6, G + 8, 3.8, 0.3, 3.8, '#e53935', { shape: 'cone' });
  sign('Strand 🏖️', 0, 3.5, G + 2, 7, 1.5, 'z-');
  it('ball', 10, 0.1, G + 9); it('duck', -20, 0.1, G + 12);
  spot(-30, G + 14, 5, 0, Math.PI); spot(-20, G + 14, 5, 3, Math.PI); spot(20, G + 14, 6, 1, Math.PI); spot(30, G + 14, 6, 5, Math.PI);
  pois.push({ x: 0, z: G + 6, act: 'dance' }, { x: -60, z: G + 6, act: 'idle' }, { x: 60, z: G + 6, act: 'wave' });
  sign('Hana-Stadt ⭐', 0, 3.2, G - 4, 8, 1.6, 'z+');

  // ---------- Stadtplatz (Mitte) ----------
  {
    const cx = 0, cz = 0;
    deco(cx, 0, cz, 44, 0.12, 44, '#f1e4d0', { tex: 'stone', noShadow: true });
    box(cx, 0, cz, 12, 1.0, 12, '#b0bec5', { shape: 'cyl', tex: 'stone' });
    deco(cx, 1.0, cz, 10.8, 0.05, 10.8, '#4fc3f7', { shape: 'cyl', tex: 'water', emissive: '#29b6f6', emissiveIntensity: 0.3 });
    box(cx, 1.0, cz, 1.6, 3, 1.6, '#cfd8dc', { shape: 'cyl', tex: 'stone' });
    deco(cx, 4, cz, 4.5, 0.6, 4.5, '#cfd8dc', { shape: 'cyl', tex: 'stone' });
    deco(cx, 4.6, cz, 1.2, 1.6, 1.2, '#81d4fa', { shape: 'sphere', opacity: 0.6, emissive: '#4fc3f7', emissiveIntensity: 0.5 });
    for (const [x, z, rot] of [[-9, 9, Math.PI * 0.75], [9, 9, -Math.PI * 0.75], [-12, 0, Math.PI / 2], [12, 0, -Math.PI / 2]]) bench(cx + x, cz + z, Math.round(rot / (Math.PI / 2)) * (Math.PI / 2));
    // Bühne mit Tanzfläche
    box(cx, 0, cz - 15, 16, 1.0, 8, '#7e57c2', { tex: 'wood' });
    stairs(cx - 9.5, cz - 15, 'e', 3, 0, 1, '#9575cd', null, 0.5, 0.75);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) add(P(cx - 5 + i * 2, 1.1, cz - 17 + j * 2, 1.96, 0.2, 1.96, RAINBOW[(i + j) % 7], { k: 'dance' }));
    for (const s of [-1, 1]) { box(cx + s * 7.2, 1, cz - 18.3, 1.4, 2.6, 1.2, '#212121'); deco(cx + s * 7.2, 2.6, cz - 17.65, 0.9, 0.9, 0.05, '#616161', { shape: 'cyl', rx: Math.PI / 2 }); }
    sign('Bühne 🎤', cx, 4.6, cz - 18.8, 6, 1.3, 'z+', '#fff59d', '#6a1b9a');
    fireworksButton(K, cx - 13, cz - 9);
    deco(cx, 0, cz - 18.8, 0.3, 3.8, 0.3, '#455a64');
    // Glace-Stand
    box(cx + 15, 0, cz + 15, 3.4, 1.4, 1.8, '#f8bbd0', { act: 'menu', title: '🍦 Glace-Stand', menu: ['icecream', 'juice', 'strawberry', 'donut'] });
    deco(cx + 15, 0, cz + 15.8, 0.15, 3.8, 0.15, '#ffffff');
    deco(cx + 15, 3.8, cz + 15.8, 4.5, 0.4, 4.5, '#ff80ab', { shape: 'cone', tex: 'stripes' });
    sign('Glace 🍦', cx + 15, 2.2, cz + 16.1, 3, 0.8, 'z+', '#ffffff', '#e91e63', false);
    flowers(cx - 16, cz + 16, 6, 4, 14); flowers(cx + 16, cz - 16, 4, 6, 12);
    tree(cx - 18, cz - 4); tree(cx + 18, cz + 4); tree(cx - 18, cz + 6, 0.8);
    pois.push({ x: cx + 8, z: cz + 8, act: 'idle' }, { x: cx, z: cz - 15, y: 1, act: 'dance' }, { x: cx - 8, z: cz - 8, act: 'wave' }, { x: cx + 13, z: cz + 13, act: 'idle' }, { x: cx - 14, z: cz + 4, act: 'idle' });
  }

  // ---------- Bushaltestellen an der Ringstrasse ----------
  for (const [x, z] of [[217.5, 0], [0, 217.5], [-217.5, 0], [0, -217.5]]) K.signPost('🚌 Bushaltestelle', x, z, 'z+', '#ffe082', '#e65100', 7);

  // ---------- Skulpturen der Kinder am Stadtplatz ----------
  {
    const statue = (x, z, kid) => {
      const a = kid.set;
      box(x, 0, z, 3.6, 1.2, 3.6, '#cfd8dc', { tex: 'stone' });
      box(x - 0.45, 1.2, z, 0.75, 1.8, 0.8, a.pants, { tex: 'stone' });
      box(x + 0.45, 1.2, z, 0.75, 1.8, 0.8, a.pants, { tex: 'stone' });
      box(x, 3.0, z, 2.0, 1.9, 1.0, a.shirt, { tex: 'stone' });
      box(x - 1.45, 3.0, z, 0.7, 1.8, 0.7, a.shirt, { tex: 'stone' });
      box(x + 1.45, 3.0, z, 0.7, 1.8, 0.7, a.shirt, { tex: 'stone' });
      box(x, 4.9, z, 1.4, 1.4, 1.2, a.skin, { tex: 'stone' });
      deco(x, 5.65, z - 0.02, 1.6, 0.55, 1.5, a.hairColor, { tex: 'stone' });
    };
    statue(-9, 17, KIDS[0]);
    statue(0, 19, KIDS[1]);
    statue(9, 17, KIDS[2]);
  }

  // ---------- Wohnhäuser ----------
  const houseColors = ['#ffccbc', '#fff9c4', '#c8e6c9', '#b3e5fc', '#e1bee7', '#ffe0b2', '#f8bbd0', '#d7ccc8'];
  const roofColors = ['#c62828', '#6d4c41', '#1565c0', '#2e7d32', '#ad1457', '#4e342e'];
  const residential = (cx, cz, names) => {
    let i = 0;
    for (const ox of [-11, 11]) for (const oz of [-11, 11]) {
      const x = cx + ox, z = cz + oz;
      const door = oz > 0 ? 's' : 'n';
      deco(x, 0, z, 20, 0.1, 20, '#9ccc65', { tex: 'grass', noShadow: true });
      const f = building({ x, z: z - (oz > 0 ? 1 : -1) * 2, w: 12, d: 10, h: 6, wall: houseColors[Math.floor(r() * houseColors.length)], wallTex: r() < 0.5 ? 'brick' : 'wood', roof: 'pitched', roofColor: roofColors[Math.floor(r() * roofColors.length)], door, text: `${names[i]}s Haus`, to: 'house2', name: `${names[i]}s Haus` });
      // Gartenzaun
      const zf = z + (oz > 0 ? 9.5 : -9.5);
      for (const s of [-1, 1]) deco(x + s * 5.75, 0, zf, 7.5, 1.0, 0.2, '#ffffff', { tex: 'wood' });
      bush(x - 7, z + (oz > 0 ? 6 : -6)); bush(x + 7, z + (oz > 0 ? 6 : -6), 0.8, '#81c784');
      if (r() < 0.6) tree(x + (r() < 0.5 ? -7.5 : 7.5), z - (oz > 0 ? 6 : -6), 0.8);
      if (r() < 0.5) flowers(x + 5, z + (oz > 0 ? 5.5 : -5.5), 3, 1.5, 6);
      pois.push({ x: f.fx, z: zf + (oz > 0 ? 2 : -2), act: 'idle' });
      i++;
    }
  };
  residential(-120, -120, ['Lina', 'Noah', 'Mia', 'Leon']);
  residential(60, -120, ['Emma', 'Luca', 'Sofia', 'Ben']);
  residential(60, 60, ['Nina', 'Elias', 'Ella', 'Timo']);
  residential(-120, 120, ['Lea', 'Jana', 'Zoe', 'Lara']);
  residential(60, 120, ['Omi', 'Opa', 'Tante Ida', 'Onkel Max']);

  // ---------- Mein Haus ----------
  {
    const cx = -120, cz = -60;
    deco(cx, 0, cz, 44, 0.1, 44, '#9ccc65', { tex: 'grass', noShadow: true });
    building({ x: cx, z: cz - 4, w: 26, d: 18, h: 10, wall: '#f8bbd0', wallTex: 'wood', roof: 'pitched', roofColor: '#ad1457', door: 's', text: 'Mein Haus 🏠', to: 'home', name: 'Mein Haus', signBg: '#fff', signFg: '#ad1457' });
    for (const s of [-1, 1]) deco(cx + s * 12, 0, cz + 20, 20, 1.0, 0.2, '#ffffff', { tex: 'wood' });
    deco(cx, 0, cz + 12, 3, 0.12, 14, '#bcaaa4', { tex: 'stone', noShadow: true });
    flowers(cx - 10, cz + 12, 8, 3, 16); flowers(cx + 10, cz + 12, 8, 3, 16);
    tree(cx - 18, cz - 16); tree(cx + 18, cz - 16); tree(cx + 18, cz + 14, 0.8);
    // Schaukel im Garten
    deco(cx - 17, 0, cz + 6, 0.2, 4, 0.2, '#8d6e63'); deco(cx - 13, 0, cz + 6, 0.2, 4, 0.2, '#8d6e63'); deco(cx - 15, 4, cz + 6, 4.4, 0.2, 0.2, '#8d6e63');
    box(cx - 15, 0.6, cz + 6, 1.4, 0.15, 0.8, '#ff7043', { act: 'swing', rot: 0 });
    deco(cx - 15.5, 0.75, cz + 6, 0.04, 3.25, 0.04, '#9e9e9e'); deco(cx - 14.5, 0.75, cz + 6, 0.04, 3.25, 0.04, '#9e9e9e');
    it('ball', cx + 8, 0.1, cz + 8);
    pois.push({ x: cx, z: cz + 16, act: 'wave' });
  }

  // ---------- Zahnarzt ----------
  {
    const cx = -60, cz = -60;
    deco(cx, 0, cz, 44, 0.1, 44, '#c5e1a5', { tex: 'grass', noShadow: true });
    building({ x: cx, z: cz - 2, w: 30, d: 20, h: 8, wall: '#e3f2fd', wallTex: 'tiles', roof: 'flat', roofColor: '#90caf9', door: 's', text: 'Zahnarzt 🦷', to: 'dentist', name: 'Zahnarztpraxis', signBg: '#ffffff', signFg: '#0277bd', awning: '#4fc3f7' });
    deco(cx + 10, 8.3, cz - 2, 3, 3, 1.5, '#ffffff', { shape: 'sphere' });
    flowers(cx - 12, cz + 14, 6, 2, 8); bush(cx + 12, cz + 14); bush(cx + 16, cz + 14);
    bench(cx + 10, cz + 16, Math.PI);
    pois.push({ x: cx, z: cz + 16, act: 'idle' });
  }

  // ---------- Café ----------
  {
    const cx = 0, cz = -60;
    deco(cx, 0, cz, 44, 0.12, 44, '#ffe0b2', { tex: 'stone', noShadow: true });
    building({ x: cx, z: cz - 6, w: 26, d: 16, h: 7, wall: '#a1887f', wallTex: 'brick', roof: 'flat', roofColor: '#5d4037', door: 's', text: 'Café & Bäckerei ☕', to: 'cafe', name: 'Café', awning: '#f48fb1', signFg: '#5d4037' });
    for (const [x, z] of [[-10, 8], [0, 12], [10, 8]]) {
      box(cx + x, 0, cz + z, 2, 1.1, 2, '#ffffff', { shape: 'cyl' });
      deco(cx + x, 1.1, cz + z, 0.12, 2.6, 0.12, '#ffffff');
      deco(cx + x, 3.7, cz + z, 4, 0.6, 4, RAINBOW[(x + 20) % 7], { shape: 'cone', tex: 'stripes' });
      chair(cx + x - 1.7, cz + z, Math.PI / 2, '#f48fb1'); chair(cx + x + 1.7, cz + z, -Math.PI / 2, '#f48fb1');
    }
    it('croissant', cx + 10, 1.1, cz + 8); it('juice', cx, 1.1, cz + 12);
    pois.push({ x: cx - 5, z: cz + 14, act: 'idle' }, { x: cx + 5, z: cz + 16, act: 'wave' });
  }

  // ---------- Boutique ----------
  {
    const cx = 60, cz = -60;
    deco(cx, 0, cz, 44, 0.12, 44, '#f3e5f5', { tex: 'tiles', noShadow: true });
    building({ x: cx, z: cz - 4, w: 30, d: 20, h: 8, wall: '#f48fb1', wallTex: 'hearts', roof: 'flat', roofColor: '#ad1457', door: 's', text: 'Boutique 👗', to: 'boutique', name: 'Boutique', awning: '#ce93d8', signFg: '#ad1457' });
    for (const s of [-1, 1]) {
      box(cx + s * 9, 0, cz + 8, 4, 0.6, 3, '#ffffff');
      deco(cx + s * 9, 0.6, cz + 8, 0.9, 1.0, 0.5, RAINBOW[s + 2], { shape: 'cyl' });
      deco(cx + s * 9, 1.6, cz + 8, 1.1, 1.0, 0.55, RAINBOW[s + 3]);
      deco(cx + s * 9, 2.6, cz + 8, 0.6, 0.6, 0.6, '#ffe0bd', { shape: 'sphere' });
    }
    pois.push({ x: cx, z: cz + 14, act: 'dance' });
  }

  // ---------- Kletterturm (Parkour-Haus) ----------
  {
    const cx = -60, cz = -120;
    deco(cx, 0, cz, 44, 0.1, 44, '#b39ddb', { tex: 'checker', noShadow: true });
    building({ x: cx, z: cz - 4, w: 18, d: 18, h: 22, wall: '#ce93d8', wallTex: 'metal', roof: 'flat', roofColor: '#7b1fa2', door: 's', text: 'Kletterhaus 🧗', to: 'parkour', name: 'Kletterhaus', signFg: '#7b1fa2' });
    // Kletterwand aussen
    box(cx + 15, 0, cz + 2, 2, 9, 8, '#ff7043', { tex: 'stone' });
    ladder(cx + 13.4, cz + 2, 0, 9, 'w', '#ffeb3b');
    box(cx + 15, 9, cz + 2, 4, 0.5, 8, '#ffccbc');
    slide(cx + 15, cz + 6, 'z', 1, 12, 9.5, 0.3, '#29b6f6');
    pois.push({ x: cx + 10, z: cz + 14, act: 'idle' });
  }

  // ---------- Hecken-Labyrinth ----------
  {
    const cx = 0, cz = -120, N = 9, C = 4.6;
    deco(cx, 0, cz, 44, 0.12, 44, '#d7ccc8', { tex: 'sand', noShadow: true });
    const cells = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ v: false, e: true, s: true })));
    const mr = rng(77);
    const stack = [[0, 0]]; cells[0][0].v = true;
    while (stack.length) {
      const [i, j] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !cells[a][b].v);
      if (!nb.length) { stack.pop(); continue; }
      const [a, b] = nb[Math.floor(mr() * nb.length)];
      if (a > i) cells[i][j].e = false; if (a < i) cells[a][b].e = false;
      if (b > j) cells[i][j].s = false; if (b < j) cells[a][b].s = false;
      cells[a][b].v = true; stack.push([a, b]);
    }
    const x0 = cx - (N * C) / 2, z0 = cz - (N * C) / 2, H = 3.2, T = 0.9;
    const hedge = (x, z, w, d) => box(x, 0, z, w, H, d, '#43a047', { tex: 'hedge' });
    for (let i = 0; i < N; i++) {
      if (i !== Math.floor(N / 2)) hedge(x0 + i * C + C / 2, z0, C + T, T);
      if (i !== Math.floor(N / 2)) hedge(x0 + i * C + C / 2, z0 + N * C, C + T, T);
    }
    for (let j = 0; j < N; j++) { hedge(x0, z0 + j * C + C / 2, T, C + T); hedge(x0 + N * C, z0 + j * C + C / 2, T, C + T); }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (cells[i][j].e && i < N - 1) hedge(x0 + (i + 1) * C, z0 + j * C + C / 2, T, C + T);
      if (cells[i][j].s && j < N - 1) hedge(x0 + i * C + C / 2, z0 + (j + 1) * C, C + T, T);
    }
    const mx = x0 + Math.floor(N / 2) * C + C / 2, mz = z0 + Math.floor(N / 2) * C + C / 2;
    box(mx, 0, mz, 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_maze', tex: 'wood' });
    deco(mx, 1.1, mz, 1.6, 0.4, 1.1, '#ffca28', { emissive: '#ffb300', emissiveIntensity: 0.5 });
    sign('Irrgarten 🌿', cx, 4.5, z0 + N * C + 0.6, 7, 1.5, 'z+', '#c8e6c9', '#1b5e20');
    deco(cx - 3, 0, z0 + N * C + 0.6, 0.3, 3.8, 0.3, '#5d4037'); deco(cx + 3, 0, z0 + N * C + 0.6, 0.3, 3.8, 0.3, '#5d4037');
    pois.push({ x: cx + 8, z: z0 + N * C + 4, act: 'idle' });
  }

  // ---------- Feuerwehr ----------
  {
    const cx = 120, cz = -120;
    deco(cx, 0, cz, 44, 0.12, 44, '#bdbdbd', { tex: 'asphalt', noShadow: true });
    box(cx, 0, cz - 6, 30, 9, 16, '#e53935', { tex: 'brick' });
    deco(cx, 9, cz - 6, 30.6, 0.5, 16.6, '#b71c1c');
    for (const s of [-8, 0, 8]) deco(cx + s, 0, cz + 2.06, 6, 6.5, 0.15, '#eeeeee', { tex: 'metal' });
    sign('Feuerwehr 🚒', cx, 7.6, cz + 2.2, 12, 1.6, 'z+', '#ffffff', '#c62828');
    box(cx + 12, 0, cz - 6, 4, 16, 4, '#c62828', { tex: 'brick' });
    spot(cx - 8, cz + 10, 1, 0, 0); spot(cx, cz + 10, 1, 0, 0); spot(cx + 8, cz + 10, 3, 0, 0);
    pois.push({ x: cx - 12, z: cz + 14, act: 'wave' });
    zoneAct(cx, 0, cz + 6, 10, 6, 'job', { title: '🚒 Bei der Feuerwehr arbeiten', jobId: 2 });
  }

  // ---------- Kart-Rennbahn ----------
  {
    const cx = 120, cz = -60;
    deco(cx, 0, cz, 44, 0.1, 44, '#8bc34a', { tex: 'grass', noShadow: true });
    const R1 = 19, R2 = 11;
    deco(cx, 0, cz, 2 * R1, 0.1, 2 * R1, '#546e7a', { shape: 'cyl', tex: 'asphalt', noShadow: true });
    deco(cx, 0.02, cz, 2 * R2, 0.12, 2 * R2, '#8bc34a', { shape: 'cyl', tex: 'grass', noShadow: true });
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const c = i % 2 ? '#ffffff' : '#e53935';
      box(cx + Math.cos(a) * (R1 + 0.4), 0, cz + Math.sin(a) * (R1 + 0.4), 1.5, 0.8, 1.5, c, { ry: -a });
      if (i % 2 === 0) box(cx + Math.cos(a) * (R2 - 0.5), 0, cz + Math.sin(a) * (R2 - 0.5), 1.2, 0.7, 1.2, c);
    }
    for (let k = 0; k < 8; k++) deco(cx + R2 + 0.5 + k, 0.13, cz, 1, 0.02, 1, k % 2 ? '#212121' : '#ffffff', { tex: 'checker', noShadow: true });
    ramp(cx - 15, cz, 5, 4, 0.1, 1.6, 'z', 1, '#ffca28', 'metal');
    sign('Kart-Bahn 🏎️', cx, 4, cz + 21, 9, 1.5, 'z+', '#212121', '#ffeb3b');
    deco(cx - 4.5, 0, cz + 21, 0.3, 3.2, 0.3, '#424242'); deco(cx + 4.5, 0, cz + 21, 0.3, 3.2, 0.3, '#424242');
    for (let i = 0; i < 4; i++) spot(cx + 13 + (i % 2) * 3.5, cz + 4 + Math.floor(i / 2) * 5, 2, [0, 5, 3, 1][i], Math.PI);
    pois.push({ x: cx - 4, z: cz + 19, act: 'wave' });
  }

  // ---------- Spielplatz ----------
  {
    const cx = -120, cz = 0;
    deco(cx, 0, cz, 44, 0.12, 44, '#ffe0a3', { tex: 'sand', noShadow: true });
    // Rutschbahn-Turm
    box(cx - 8, 0, cz - 8, 4, 5, 4, '#42a5f5', { tex: 'wood' });
    deco(cx - 8, 5, cz - 8, 4.4, 2.4, 4.4, '#ef5350', { shape: 'cone' });
    ladder(cx - 8, cz - 5.95, 0, 5, 's', '#ffeb3b');
    slide(cx - 6, cz - 8, 'x', 1, 9, 5, 0.2, '#ff4081');
    // Klettergerüst
    for (let i = 0; i < 4; i++) { deco(cx + 4 + i * 2.5, 0, cz - 12, 0.2, 4, 0.2, '#ffb300'); deco(cx + 4 + i * 2.5, 0, cz - 8, 0.2, 4, 0.2, '#ffb300'); }
    box(cx + 7.75, 4, cz - 10, 8.2, 0.3, 4.2, '#ffca28', { tex: 'metal' });
    ladder(cx + 3.9, cz - 10, 0, 4, 'w', '#ff7043');
    ladder(cx + 11.6, cz - 10, 0, 4, 'e', '#ff7043');
    // Schaukeln
    for (let i = 0; i < 3; i++) {
      const x = cx + 4 + i * 3.2, z = cz + 8;
      deco(x - 1.4, 0, z, 0.2, 4.2, 0.2, '#8d6e63'); deco(x + 1.4, 0, z, 0.2, 4.2, 0.2, '#8d6e63');
      deco(x, 4.2, z, 3, 0.2, 0.2, '#8d6e63');
      box(x, 0.6, z, 1.3, 0.15, 0.8, RAINBOW[i * 2], { act: 'swing', rot: 0 });
      deco(x - 0.55, 0.75, z, 0.04, 3.45, 0.04, '#9e9e9e'); deco(x + 0.55, 0.75, z, 0.04, 3.45, 0.04, '#9e9e9e');
    }
    // Trampoline & Karussell
    for (let i = 0; i < 3; i++) box(cx - 14 + i * 4, 0, cz + 10, 3, 0.4, 3, '#00e5ff', { k: 'bounce' });
    box(cx - 6, 0, cz + 2, 2, 1, 2, '#ff7043', { shape: 'cyl' });
    for (let i = 0; i < 6; i++) add(P(cx - 6 + 4, 0.3, cz + 2, 2, 0.6, 2, RAINBOW[i], { m: { type: 'circle', cx: cx - 6, cz: cz + 2, r: 4, speed: 0.7, phase: (i * Math.PI) / 3 } }));
    // Sandkasten
    deco(cx + 12, 0, cz + 14, 8, 0.4, 8, '#fff3c4', { tex: 'sand' });
    for (const [x, z, w, d] of [[0, -4, 8.4, 0.4], [0, 4, 8.4, 0.4], [-4, 0, 0.4, 8.4], [4, 0, 0.4, 8.4]]) box(cx + 12 + x, 0, cz + 14 + z, w, 0.6, d, '#a1887f', { tex: 'wood' });
    sign('Spielplatz 🛝', cx, 3.6, cz + 21, 8, 1.4, 'z+', '#ffffff', '#e65100');
    deco(cx - 4, 0, cz + 21, 0.25, 3, 0.25, '#795548'); deco(cx + 4, 0, cz + 21, 0.25, 3, 0.25, '#795548');
    it('ball', cx, 0.1, cz + 4); it('ball', cx + 6, 0.1, cz - 2);
    tree(cx - 18, cz - 18); tree(cx + 18, cz - 18); tree(cx - 18, cz + 16, 0.8);
    pois.push({ x: cx - 2, z: cz + 4, act: 'dance' }, { x: cx - 8, z: cz - 3, act: 'idle' }, { x: cx + 8, z: cz + 12, act: 'idle' });
  }

  // ---------- Friseur & Tierhandlung ----------
  {
    const cx = -60, cz = 0;
    deco(cx, 0, cz, 44, 0.12, 44, '#eeeeee', { tex: 'tiles', noShadow: true });
    building({ x: cx - 11, z: cz - 4, w: 18, d: 16, h: 7, wall: '#e1bee7', wallTex: 'stars', roof: 'flat', roofColor: '#8e24aa', door: 's', text: 'Friseur ✂️', to: 'salon', name: 'Friseursalon', awning: '#ba68c8', signFg: '#8e24aa' });
    building({ x: cx + 11, z: cz - 4, w: 18, d: 16, h: 7, wall: '#ffe0b2', wallTex: 'wood', roof: 'flat', roofColor: '#ef6c00', door: 's', text: 'Tierhandlung 🐾', to: 'pets', name: 'Tierhandlung', awning: '#ffb74d', signFg: '#e65100' });
    flowers(cx, cz + 10, 4, 4, 10);
    it('dog', cx + 6, 0.1, cz + 12);
    pois.push({ x: cx - 11, z: cz + 12, act: 'idle' }, { x: cx + 11, z: cz + 12, act: 'wave' });
  }

  // ---------- Supermarkt ----------
  {
    const cx = 60, cz = 0;
    deco(cx, 0, cz, 44, 0.1, 44, '#9e9e9e', { tex: 'asphalt', noShadow: true });
    building({ x: cx, z: cz - 8, w: 34, d: 18, h: 8, wall: '#c8e6c9', wallTex: 'tiles', roof: 'flat', roofColor: '#2e7d32', door: 's', text: 'Supermarkt 🛒', to: 'market', name: 'Supermarkt', awning: '#66bb6a', signFg: '#1b5e20' });
    for (let i = 0; i < 6; i++) { deco(cx - 15 + i * 6, 0.1, cz + 10, 0.2, 0.02, 5, '#ffffff', { noShadow: true }); }
    spot(cx - 12, cz + 12, 0, 1, Math.PI); spot(cx - 6, cz + 12, 0, 3, Math.PI); spot(cx, cz + 12, 1, 4, Math.PI); spot(cx + 6, cz + 12, 0, 5, Math.PI);
    pois.push({ x: cx + 14, z: cz + 16, act: 'idle' });
  }

  // ---------- Skatepark ----------
  {
    const cx = 120, cz = 0;
    deco(cx, 0, cz, 44, 0.12, 44, '#b0bec5', { tex: 'stone', noShadow: true });
    ramp(cx - 12, cz - 12, 8, 6, 0, 3, 'z', -1, '#90a4ae', 'metal');
    box(cx - 12, 0, cz - 18, 8, 3, 6, '#78909c', { tex: 'metal' });
    ramp(cx + 12, cz - 12, 8, 6, 0, 3, 'z', -1, '#ffab40', 'metal');
    box(cx + 12, 0, cz - 18, 8, 3, 6, '#ff9100', { tex: 'metal' });
    box(cx, 0, cz - 18, 16, 3, 6, '#b0bec5', { tex: 'metal' });
    ramp(cx - 8, cz + 6, 6, 5, 0, 2, 'x', 1, '#ef5350', 'metal');
    ramp(cx - 3, cz + 6, 4, 5, 0, 2, 'x', -1, '#ef5350', 'metal');
    box(cx - 5.5, 0, cz + 6, 1, 2, 5, '#c62828');
    ramp(cx + 10, cz + 8, 5, 6, 0, 2.5, 'x', -1, '#7e57c2', 'metal');
    box(cx + 15, 0, cz + 8, 5, 2.5, 6, '#5e35b1', { tex: 'metal' });
    for (const [x, z, t, c] of [[cx - 16, cz + 16, 3, 0], [cx - 12, cz + 16, 4, 2], [cx - 8, cz + 16, 3, 5], [cx + 4, cz + 16, 4, 6]]) spot(x, z, t, c, 0);
    sign('Skatepark 🛹', cx, 4, cz + 21, 8, 1.4, 'z+', '#212121', '#76ff03');
    deco(cx - 4, 0, cz + 21, 0.25, 3.3, 0.25, '#424242'); deco(cx + 4, 0, cz + 21, 0.25, 3.3, 0.25, '#424242');
    pois.push({ x: cx, z: cz + 12, act: 'dance' });
  }

  // ---------- Park mit See ----------
  {
    const cx = -120, cz = 60;
    deco(cx + 4, 0.02, cz - 2, 22, 0.1, 16, '#4fc3f7', { shape: 'cyl', tex: 'water', emissive: '#29b6f6', emissiveIntensity: 0.25, noShadow: true });
    ramp(cx - 2, cz - 2, 4, 3, 0.1, 1.5, 'x', 1, '#a1887f', 'wood');
    box(cx + 4, 1.2, cz - 2, 8, 0.3, 3, '#a1887f', { tex: 'wood' });
    ramp(cx + 10, cz - 2, 4, 3, 0.1, 1.5, 'x', -1, '#a1887f', 'wood');
    for (const s of [-1, 1]) deco(cx + 4, 1.5, cz - 2 + s * 1.4, 8, 0.8, 0.12, '#8d6e63');
    deco(cx - 14, 0, cz + 2, 2.6, 0.12, 30, '#d7ccc8', { tex: 'stone', noShadow: true });
    for (const [x, z] of [[-17, -16], [-6, 14], [16, 14], [16, -16], [-17, 16], [4, -18]]) tree(cx + x, cz + z, 1.1);
    for (const [x, z] of [[-16, 6], [18, 2], [0, 16]]) bench(cx + x, cz + z, x > 0 ? -Math.PI / 2 : x < 0 ? Math.PI / 2 : Math.PI);
    table(cx + 10, 0, cz + 14, 3, 2, '#8d6e63', 'wood');
    box(cx + 10, 0, cz + 16.3, 3, 0.6, 0.8, '#a1887f', { act: 'menu', title: '🧺 Picknickkorb', menu: ['apple', 'banana', 'strawberry', 'cookie', 'juice', 'cake'] });
    flowers(cx - 4, cz + 12, 6, 3, 14);
    it('duck', cx + 2, 0.12, cz - 4); it('duck', cx + 6, 0.12, cz);
    spot(cx - 6, cz - 2, 5, 2, Math.PI / 2); spot(cx + 14, cz - 2, 5, 4, -Math.PI / 2);
    sign('Park 🌳', cx, 3.5, cz - 21, 6, 1.3, 'z-', '#ffffff', '#2e7d32');
    pois.push({ x: cx - 14, z: cz + 8, act: 'idle' }, { x: cx + 4, z: cz - 2, y: 1.5, act: 'wave' }, { x: cx + 10, z: cz + 12, act: 'idle' });
  }

  // ---------- Trampolinpark ----------
  {
    const cx = -60, cz = 60;
    deco(cx, 0, cz, 44, 0.12, 44, '#7e57c2', { tex: 'checker', noShadow: true });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(cx - 13 + i * 5, 0, cz - 12 + j * 5, 4, 0.4, 4, j % 2 ? '#00e5ff' : '#ff4081', { k: 'bounce' });
    box(cx + 12, 0, cz - 10, 6, 6, 6, '#ffca28', { tex: 'metal' });
    ladder(cx + 8.95, cz - 10, 0, 6, 'w', '#ffffff');
    box(cx + 12, 0, cz + 0, 6, 0.4, 6, '#00e5ff', { k: 'bounce' });
    box(cx + 12, 11, cz + 8, 6, 0.6, 6, '#ffffff', { tex: 'stars' });
    box(cx - 2, 7, cz + 10, 5, 0.6, 5, '#f8bbd0');
    box(cx - 2, 0, cz + 2.5, 4, 0.4, 4, '#76ff03', { k: 'bounce' });
    deco(cx + 12, 11.6, cz + 8, 1.2, 1.2, 1.2, '#ffd600', { shape: 'sphere', emissive: '#ffd600' });
    box(cx + 12, 11.6, cz + 10.4, 1.4, 0.9, 1, '#8d6e63', { act: 'treasure', key: 'chest_tramp', tex: 'wood' });
    sign('Trampolinpark 🤸', cx, 4, cz - 21, 10, 1.5, 'z-', '#ffffff', '#6a1b9a');
    pois.push({ x: cx - 8, z: cz + 14, act: 'dance' });
  }

  // ---------- Fahrzeug-Parkplatz ----------
  {
    const cx = 0, cz = 60;
    deco(cx, 0, cz, 44, 0.1, 44, '#78909c', { tex: 'asphalt', noShadow: true });
    let n = 0;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      const x = cx - 16 + i * 8, z = cz - 12 + j * 10;
      deco(x - 2, 0.1, z, 0.2, 0.02, 5, '#ffffff', { noShadow: true });
      spot(x + 1, z, [0, 1, 2, 3, 4][(i + j) % 5], n % 9, 0);
      n++;
    }
    sign('Fahrzeuge 🚗🚲', cx, 4, cz - 21, 9, 1.5, 'z-', '#ffeb3b', '#212121');
    deco(cx - 4.5, 0, cz - 21, 0.3, 3.2, 0.3, '#424242'); deco(cx + 4.5, 0, cz - 21, 0.3, 3.2, 0.3, '#424242');
    pois.push({ x: cx + 18, z: cz - 18, act: 'idle' });
  }

  // ---------- Obby-Turm ----------
  {
    const cx = 120, cz = 60;
    deco(cx, 0, cz, 44, 0.12, 44, '#b2ebf2', { tex: 'checker', noShadow: true });
    let y = 0, x = cx - 14, z = cz + 14;
    const steps = [[0, -5], [4, -4], [5, 1], [4, 4], [-1, 5], [-5, 3], [-5, -2], [-2, -5], [4, -4], [5, 0]];
    for (let i = 0; i < steps.length; i++) {
      x += steps[i][0]; z += steps[i][1]; y += 1.6;
      box(x, y - 0.5, z, 3, 0.5, 3, RAINBOW[i % 7]);
    }
    box(x, y, z, 6, 0.5, 6, '#ffd700', { k: 'goal' });
    box(x, y + 0.5, z - 2, 1.4, 0.9, 1, '#8d6e63', { act: 'treasure', key: 'chest_obby', tex: 'wood' });
    slide(x + 3, z, 'x', 1, 14, y + 0.4, 0.3, '#29b6f6', 2.6);
    sign('Obby-Turm 🌈', cx, 4, cz - 21, 8, 1.4, 'z-', '#ffffff', '#e91e63');
    pois.push({ x: cx - 16, z: cz + 18, act: 'idle' });
  }

  // ---------- Labyrinth-Haus & Schule ----------
  {
    const cx = -60, cz = 120;
    deco(cx, 0, cz, 44, 0.12, 44, '#f8bbd0', { tex: 'checker', noShadow: true });
    building({ x: cx, z: cz + 2, w: 26, d: 22, h: 9, wall: '#ba68c8', wallTex: 'hearts', roof: 'flat', roofColor: '#6a1b9a', door: 'n', text: 'Labyrinth-Haus 🌀', to: 'maze', name: 'Labyrinth-Haus', signFg: '#6a1b9a' });
    pois.push({ x: cx + 10, z: cz - 15, act: 'idle' });
  }
  {
    const cx = 0, cz = 120;
    deco(cx, 0, cz, 44, 0.12, 44, '#cfd8dc', { tex: 'asphalt', noShadow: true });
    building({ x: cx, z: cz + 6, w: 34, d: 14, h: 14, wall: '#ffb74d', wallTex: 'brick', roof: 'flat', roofColor: '#e65100', door: 'n', text: 'Abenteuer-Haus ⏰', to: 'adv:0', name: 'Abenteuer-Haus', signFg: '#e65100' });
    sign('Jede Stunde neu!', cx, 7.5, cz - 1.2, 8, 1.1, 'z-', '#fff59d', '#e65100');
    // Pausenplatz: Himmel-und-Hölle & Basketball
    for (let i = 0; i < 6; i++) deco(cx - 10, 0.12, cz - 16 + i * 1.6, 1.4, 0.02, 1.4, RAINBOW[i], { noShadow: true });
    box(cx + 12, 0, cz - 14, 0.3, 4.5, 0.3, '#455a64'); deco(cx + 12, 4.5, cz - 13.7, 2, 1.4, 0.15, '#ffffff'); deco(cx + 12, 4, cz - 13.1, 0.9, 0.1, 0.9, '#ff5722', { shape: 'cyl' });
    it('ball', cx + 10, 0.1, cz - 10);
    pois.push({ x: cx - 8, z: cz - 12, act: 'dance' }, { x: cx + 8, z: cz - 16, act: 'idle' });
  }

  // ---------- Bauernhof ----------
  {
    const cx = 120, cz = 120;
    deco(cx, 0, cz, 44, 0.12, 44, '#aed581', { tex: 'grass', noShadow: true });
    box(cx - 6, 0, cz - 4, 16, 8, 12, '#c62828', { tex: 'wood' });
    ramp(cx - 6, cz - 7, 17, 6.6, 8, 12, 'z', -1, '#eeeeee', 'roof', { thick: 0.4 });
    ramp(cx - 6, cz - 1, 17, 6.6, 8, 12, 'z', 1, '#eeeeee', 'roof', { thick: 0.4 });
    deco(cx - 6, 0, cz + 2.06, 5, 5.5, 0.15, '#ffffff', { tex: 'wood' });
    sign('Bauernhof 🐄', cx - 6, 6.6, cz + 2.2, 8, 1.3, 'z+', '#fff8e1', '#5d4037');
    for (let i = 0; i < 6; i++) deco(cx + 8 + (i % 3) * 4, 0, cz + 6 + Math.floor(i / 3) * 6, 4, 1.2, 0.2, '#ffffff', { tex: 'wood' });
    for (const [x, z] of [[cx + 12, cz + 14], [cx + 16, cz + 10]]) deco(x, 0, z, 3, 2, 3, '#ffe082', { tex: 'sand', shape: 'cyl', rx: Math.PI / 2 });
    it('chick', cx + 10, 0.1, cz + 9); it('chick', cx + 12, 0.1, cz + 10); it('bunny', cx + 6, 0.1, cz + 12); it('carrot', cx + 7, 0.1, cz + 13); it('cat', cx - 12, 0.1, cz + 6);
    tree(cx + 16, cz - 16); tree(cx - 18, cz - 18);
    pois.push({ x: cx + 4, z: cz + 16, act: 'idle' });
    zoneAct(cx + 10, 0, cz + 10, 10, 10, 'job', { title: '🐄 Auf dem Bauernhof arbeiten', jobId: 6 });
  }

  // ---------- Neue Quartiere ausserhalb der Ringstrasse ----------
  const W = { staticBots };
  const job = (emoji, title, msg, stars = 5, time = 4) => ({ emoji, title: `${emoji} ${title}`, msg, stars, time });
  // Einkaufsstrasse im Norden
  shopRow(K, W, -250, -252, 50, 's', [
    { name: 'Kino 🎬', wall: '#37474f', signFg: '#d32f2f', roofColor: '#212121', to: 'house2', menu: ['juice', 'donut', 'icecream'], menuTitle: '🍿 Kino-Snacks', keeper: 'Kino-Karl', job: job('🎬', 'Im Kino arbeiten', 'Du zeigst allen ihre Plätze!') },
    { name: 'Pizzeria 🍕', wall: '#ffccbc', awning: '#e53935', to: 'pizzeria', menu: ['pizza', 'juice'], keeper: 'Pizzaiolo Paolo', keeperJob: 2, say: ['Pizza Margherita! 🍕', 'Frisch aus dem Ofen! 🔥', 'Komm rein und back selber Pizza! 👩‍🍳'] },
    { name: 'Spielwaren 🧸', wall: '#fff59d', awning: '#ffb300', to: 'market', menu: ['ball', 'teddy', 'balloon', 'kite', 'frisbee', 'duck'], keeper: 'Toni Teddy', job: job('🧸', 'Im Spielwarenladen arbeiten', 'Du räumst die Spielsachen ein!') },
    { name: 'Blumenladen 🌷', wall: '#f8bbd0', awning: '#ec407a', to: 'house2', menu: ['flower'], keeper: 'Flora', job: job('🌷', 'Blumen giessen', 'Du giesst alle Blumen!', 4, 3) },
    { name: 'Einkaufszentrum 🛍️', bw: 30, bd: 14, h: 9, wall: '#e3f2fd', tex: 'tiles', roofColor: '#1e88e5', to: 'market', menu: ['apple', 'banana', 'strawberry', 'carrot', 'juice'], keeper: 'Kassiererin Kim', job: job('🛍️', 'An der Kasse arbeiten', 'Piep, piep! Du scannst alle Einkäufe!'), wardrobe: '👗 Mode-Abteilung' },
    { name: 'Bücherei 📚', wall: '#d7ccc8', tex: 'wood', to: 'maze', menu: ['juice'], menuTitle: '📚 Lese-Ecke', keeper: 'Frau Buch', job: job('📚', 'Bücher einräumen', 'Du sortierst alle Bücher!', 4, 3) },
    { name: 'Burger-Bude 🍔', wall: '#ffe082', awning: '#fb8c00', to: 'cafe', menu: ['burger', 'juice', 'icecream'], keeper: 'Burger-Ben', job: job('🍔', 'Burger braten', 'Du brätst leckere Burger!') },
    { name: 'Polizei 👮', wall: '#bbdefb', signFg: '#0d47a1', roofColor: '#1565c0', to: 'house2', keeper: null, job: job('👮', 'Bei der Polizei arbeiten', 'Du hilfst allen über die Strasse!', 6, 5), wardrobe: '👮 Uniformen', wardrobeTab: 'jobs' },
    { name: 'Kinderarzt 🩺', wall: '#ffffff', signFg: '#00897b', roofColor: '#26a69a', to: 'dentist', menu: ['apple', 'juice'], menuTitle: '🍎 Gesunde Snacks', keeper: 'Dr. Lena', keeperJob: 1, job: job('🩺', 'In der Praxis helfen', 'Du verbindest Teddys Pfote! 🧸', 6, 5) },
    { name: 'Glacé-Bar 🍦', wall: '#f3e5f5', awning: '#ab47bc', to: 'cafe', menu: ['icecream', 'strawberry', 'juice'], keeper: 'Gina Glacé', job: job('🍦', 'Glacé verkaufen', 'Du füllst Glacé-Becher!', 4, 3) },
    { name: 'Süsswaren 🍬', wall: '#ffcdd2', awning: '#e91e63', to: 'market', menu: ['donut', 'cookie', 'cake'], keeper: 'Susi Süss', job: job('🍬', 'Bonbons verpacken', 'Du verpackst Bonbons!', 4, 3) },
  ], pois);
  // Süden: Freizeitpark, Schwimmbad, Zoo, Sportplatz
  funPark(K, W, -190, 252, 'Hana-Land 🎡', pois);
  pool(K, W, -60, 250, 'Schwimmbad 🏊', pois);
  zoo(K, W, 70, 248, ['bunny', 'chick', 'dog', 'cat'], 'Streichelzoo 🐰', pois);
  sportsField(K, W, 200, 248, 'Sportplatz ⚽', pois);
  // Osten & Westen: Wohnquartiere, Lagerfeuer, Rutschenturm
  residential(255, -160, ['Mila', 'Finn', 'Lou', 'Jonas']);
  residential(255, -110, ['Anna', 'Paul', 'Lia', 'Max']);
  residential(255, -60, ['Sara', 'Tim', 'Nora', 'Leo']);
  camp(K, W, 255, 8, 'Lagerfeuer 🔥', pois);
  slideTower(K, 255, 60, 12, '#ef5350');
  residential(255, 160, ['Ida', 'Jan', 'Romy', 'Nils']);
  residential(-255, -160, ['Luna', 'Ben', 'Elin', 'Mats']);
  residential(-255, -110, ['Alma', 'Ole', 'Pia', 'Theo']);
  camp(K, W, -255, -40, 'Pfadi-Lager ⛺', pois);
  slideTower(K, -255, 30, 14, '#7e57c2');
  residential(-255, 110, ['Hanna', 'Luis', 'Maja', 'Tom']);
  residential(-255, 160, ['Clara', 'Emil', 'Ronja', 'Sami']);
  // Parkplätze an der Ringstrasse
  for (let i = 0; i < 5; i++) { spot(-190 + i * 6, -186, i % 5, i * 2, 0); spot(170 + i * 6, 186, (i + 2) % 5, i * 2 + 1, Math.PI); }
  for (const [x, z] of [[-150, -186], [150, -186], [-150, 186], [150, 186], [-186, 150], [186, -150]]) { tree(x, z, 0.8); bench(x + 4, z, 0, '#a1887f'); }

  // ---------- Innenwelten ----------
  const interiors = {};
  const IZ = -1500;
  const keys = ['home', 'house2', 'dentist', 'parkour', 'maze', 'cafe', 'boutique', 'salon', 'pets', 'market', 'pizzeria'];
  keys.forEach((k, i) => { interiors[k] = { x: -900 + i * 200, z: IZ }; });


  // Mein Haus (2 Stockwerke, Dachboden mit Rutsche)
  {
    const { x: ox, z: oz } = interiors.home;
    const W = 44, D = 34, H = 13;
    interiors.home.spawn = shell(ox, oz, W, D, H, '#d7a86e', 'wood', '#f8bbd0', 'hearts', 'Mein Haus 🏠');
    // Obergeschoss (hintere Hälfte)
    const up = 5.5;
    box(ox, up - 0.4, oz - D / 4 - 1, W, 0.4, D / 2 - 2, '#ffe0b2', { tex: 'carpet' });
    for (let i = 0; i < 9; i++) deco(ox - W / 2 + 4 + i * 4.5, up, oz - 1.8, 0.15, 1.2, 0.15, '#ffffff');
    deco(ox, up + 1.1, oz - 1.8, W - 2, 0.15, 0.15, '#ffffff');
    stairs(ox - W / 2 + 2, oz + 8, 'n', 3, 0, up, '#ffab91', 'wood');
    // Küche
    box(ox - 19, 0, oz - 15.4, 2, 3.2, 1.6, '#e3f2fd', { act: 'menu', title: '🧊 Kühlschrank', menu: ['apple', 'banana', 'strawberry', 'carrot', 'juice', 'icecream', 'cake'] });
    box(ox - 16, 0, oz - 15.6, 4, 1.2, 1.4, '#ffffff', { tex: 'tiles' });
    box(ox - 12.8, 0, oz - 15.6, 2.2, 1.2, 1.4, '#455a64', { act: 'menu', title: '🍳 Kochen', menu: ['pizza', 'burger', 'cake', 'cookie', 'croissant', 'donut'] });
    deco(ox - 13.3, 1.2, oz - 15.6, 0.7, 0.05, 0.7, '#ff7043', { emissive: '#ff5722', emissiveIntensity: 0.4 });
    table(ox - 15, 0, oz - 9, 4, 2.4, '#bcaaa4', 'wood');
    chair(ox - 17.8, oz - 9, Math.PI / 2, '#ffab91'); chair(ox - 12.2, oz - 9, -Math.PI / 2, '#ffab91');
    chair(ox - 15, oz - 6.6, Math.PI, '#ffab91');
    it('apple', ox - 15.6, 1.1, oz - 9); it('juice', ox - 14.4, 1.1, oz - 9.3); it('pizza', ox - 15, 1.1, oz - 8.6);
    // Bad (hinten rechts unten)
    deco(ox + 13, 0, oz - 15, 0.3, 5, 4, '#e1f5fe');
    box(ox + 17, 0, oz - 15.4, 4, 0.9, 2, '#ffffff', { act: 'bath', rot: -Math.PI / 2 });
    deco(ox + 17, 0.9, oz - 15.4, 3.6, 0.06, 1.6, '#81d4fa', { emissive: '#4fc3f7', emissiveIntensity: 0.3 });
    add(P(ox + 15.5, 0.08, oz - 11, 2, 0.12, 2, '#b3e5fc', { act: 'shower' }));
    deco(ox + 15.5, 3.4, oz - 11.6, 0.8, 0.1, 0.8, '#9e9e9e');
    box(ox + 20.5, 0, oz - 11, 1, 1.4, 1.6, '#ffffff', { act: 'brush', title: '🪥 Zähne putzen' });
    // Wohnzimmer
    box(ox, 0, oz - 15.6, 4, 0.8, 1, '#8d6e63', { tex: 'wood' });
    add(P(ox, 1.9, oz - 16, 3.6, 2, 0.2, '#263238', { act: 'tv', key: 'tv_home' }));
    sofa(ox, oz - 9, Math.PI, '#9575cd', 5);
    deco(ox, 0.01, oz - 12, 7, 0.04, 4, '#f48fb1', { tex: 'carpet', noShadow: true });
    box(ox + 5, 0, oz - 15.5, 0.9, 0.3, 0.9, '#757575', { act: 'lamp', key: 'lamp_home' });
    deco(ox + 5, 0.3, oz - 15.5, 0.15, 2.4, 0.15, '#9e9e9e');
    add(P(ox + 5, 3, oz - 15.5, 1.1, 0.7, 1.1, '#fff59d', { k: 'deco', glow: 'lamp_home' }));
    it('cat', ox + 3, 0.05, oz - 6);
    // Obergeschoss: Schlafzimmer & Spielzimmer
    bed(ox - 17, up, oz - 13, 0, '#90caf9'); bed(ox - 12, up, oz - 13, 0, '#f48fb1');
    it('teddy', ox - 12, up + 1.0, oz - 12);
    wardrobePart(ox - 7, oz - 15.6, 3, 1.4, '👗 Kleiderschrank');
    deco(ox - 1, up, oz - 10, 0.3, 4, 13, '#e1bee7');
    box(ox + 8, up, oz - 15.4, 2.4, 1.1, 1.6, '#ef9a9a', { act: 'menu', title: '🧸 Spielzeugkiste', menu: ['ball', 'teddy', 'duck', 'balloon', 'gift'] });
    box(ox + 14, up, oz - 9, 6, 0.35, 6, '#00e5ff', { k: 'bounce' });
    for (let i = 0; i < 18; i++) deco(ox + 11.6 + (i % 6) * 1, up + 0.35, oz - 11.4 + Math.floor(i / 6) * 2.2, 0.6, 0.6, 0.6, RAINBOW[i % 7], { shape: 'sphere' });
    // Leiter zum Dachboden + Rutsche
    const attic = 10;
    box(ox + 15, attic - 0.4, oz - 14.5, 12, 0.4, 5, '#ffe0b2', { tex: 'wood' });
    ladder(ox + 20.6, oz - 11.6, up, attic, 's', '#ffeb3b');
    box(ox + 12, attic, oz - 16, 2, 1, 1.2, '#8d6e63', { act: 'treasure', key: 'chest_attic', tex: 'wood' });
    deco(ox + 12, attic + 1, oz - 16, 2, 0.3, 1.2, '#ffca28', { emissive: '#ffb300', emissiveIntensity: 0.5 });
    slide(ox + 12, oz - 12, 'z', 1, 24, attic, 0.2, '#ff4081', 2.4);
    it('balloon', ox + 17, attic, oz - 14);
  }

  // Familienhaus (für alle anderen Häuser)
  {
    const { x: ox, z: oz } = interiors.house2;
    interiors.house2.spawn = shell(ox, oz, 32, 24, 9, '#bcaaa4', 'wood', '#fff9c4', 'dots', 'Willkommen! 👋');
    sofa(ox - 8, oz - 2, Math.PI, '#4db6ac', 4);
    box(ox - 8, 0, oz - 10.6, 3.5, 0.8, 0.9, '#6d4c41', { tex: 'wood' });
    add(P(ox - 8, 1.8, oz - 11.2, 3.2, 1.8, 0.2, '#263238', { act: 'tv', key: 'tv_house2' }));
    box(ox + 13, 0, oz - 10.4, 2, 3.2, 1.6, '#e3f2fd', { act: 'menu', title: '🧊 Kühlschrank', menu: ['apple', 'banana', 'juice', 'icecream', 'cookie'] });
    box(ox + 10, 0, oz - 10.6, 3.4, 1.2, 1.4, '#455a64', { act: 'menu', title: '🍳 Kochen', menu: ['pizza', 'burger', 'cake', 'croissant'] });
    table(ox + 9, 0, oz - 4, 3.4, 2.2, '#ffffff');
    chair(ox + 6.6, oz - 4, Math.PI / 2, '#ffcc80'); chair(ox + 11.4, oz - 4, -Math.PI / 2, '#ffcc80');
    it('cookie', ox + 9, 1.1, oz - 4);
    // Hochebene mit Leiter (Kinderzimmer)
    box(ox, 4.6, oz + 2, 12, 0.4, 7, '#ffccbc', { tex: 'carpet' });
    for (const s of [-1, 1]) deco(ox + s * 6, 5, oz + 2, 0.15, 1.1, 7, '#ffffff');
    ladder(ox + 4, oz + 5.6, 0, 5, 's', '#4fc3f7');
    bed(ox - 3, 5, oz + 1.5, Math.PI / 2, '#ce93d8');
    it('teddy', ox - 2, 6, oz + 1.5);
    box(ox + 2, 5, oz + 0, 1.8, 1, 1.2, '#ef9a9a', { act: 'menu', title: '🧸 Spielzeugkiste', menu: ['ball', 'teddy', 'duck', 'balloon'] });
    wardrobePart(ox - 14.6, oz + 2, 1.4, 3, '👗 Kleiderschrank');
    box(ox + 14.6, 0, oz + 6, 1, 1.4, 1.6, '#ffffff', { act: 'brush', title: '🪥 Zähne putzen' });
    it('dog', ox + 3, 0.05, oz - 6);
  }

  // Pizzeria: Holzofen, Pizza-Theke (Minispiel), Koch-Kleider, Tische
  {
    const { x: ox, z: oz } = interiors.pizzeria;
    interiors.pizzeria.spawn = shell(ox, oz, 32, 24, 8, '#d7a86e', 'checker', '#ffe0b2', 'brick', 'Pizzeria 🍕');
    // Holzofen (Kuppel) mit Glut
    box(ox - 9, 0, oz - 9.5, 7, 1.6, 4, '#b0614a', { tex: 'brick' });
    deco(ox - 9, 1.6, oz - 9.5, 6.4, 3.6, 3.8, '#c0714f', { shape: 'hemi', tex: 'brick' });
    deco(ox - 9, 1.7, oz - 7.55, 2.2, 1.4, 0.1, '#ff6d00', { emissive: '#ff3d00', emissiveIntensity: 0.9 });
    deco(ox - 9, 4.8, oz - 10.2, 0.9, 3.2, 0.9, '#8d6e63', { tex: 'brick' });
    sign('🔥 Holzofen', ox - 9, 6.4, oz - 11.9, 4, 0.9, 'z+', '#fff3e0', '#bf360c', false);
    // Pizza-Theke: hier startet das Spiel
    box(ox + 2, 0, oz - 8, 9, 1.2, 2.2, '#ffffff', { act: 'pizza', tex: 'tiles' });
    deco(ox + 2, 1.2, oz - 8, 3, 0.08, 1.6, '#d7a86e', { tex: 'wood' });
    for (const [dx, c] of [[-3, '#e53935'], [-2, '#fff8e1'], [5.6, '#43a047'], [6.6, '#ffd54f']]) deco(ox + dx + 0.5, 1.2, oz - 8.4, 0.7, 0.45, 0.7, c, { shape: 'cyl' });
    sign('👩‍🍳 Pizza backen', ox + 2, 3.4, oz - 9.2, 5, 1, 'z+', '#e53935', '#ffffff');
    staticBots.push({ name: 'Pizzaiolo Paolo', pos: [ox + 9, 0, oz - 9.5], rot: 0, anim: 'idle', job: 2, role: 'shop', say: ['Tippe auf die Theke und back eine Pizza! 🍕', 'Nicht vergessen: zuerst Sauce, dann Käse! 🧀', 'Mamma mia, perfetto! 👌'] });
    wardrobePart(ox + 14.6, oz - 4, 1.4, 3, '👩‍🍳 Koch-Kleider', 'jobs');
    // Tische für die Gäste
    for (const [tx, tz] of [[-8, 2], [0, 4], [8, 2], [-8, 9], [8, 9]]) {
      table(ox + tx, 0, oz + tz, 2.6, 2.2, '#ffffff', 'checker');
      chair(ox + tx - 2.1, oz + tz, Math.PI / 2, '#e53935'); chair(ox + tx + 2.1, oz + tz, -Math.PI / 2, '#e53935');
    }
    box(ox - 14.4, 0, oz + 6, 1.4, 1.3, 3, '#ffcc80', { act: 'menu', title: '🍕 Pizza essen', menu: ['pizza', 'juice', 'icecream'], tex: 'wood' });
  }

  // Zahnarztpraxis
  {
    const { x: ox, z: oz } = interiors.dentist;
    const W = 40, D = 30;
    interiors.dentist.spawn = shell(ox, oz, W, D, 8, '#e0f7fa', 'tiles', '#e3f2fd', 'dots', 'Zahnarztpraxis 🦷');
    // Empfang
    box(ox + 10, 0, oz + 8, 7, 1.3, 1.6, '#4fc3f7', { tex: 'wood' });
    staticBots.push({ name: 'Frau Weiss', pos: [ox + 10, 0, oz + 6.4], rot: Math.PI, anim: 'idle', job: 0, role: 'reception', say: ['Willkommen! 😊', 'Bitte setz dich ins Wartezimmer.', 'Gleich bist du dran!'] });
    for (let i = 0; i < 4; i++) chair(ox - 16 + i * 2, oz + 12, Math.PI, '#81d4fa');
    box(ox - 6, 0, oz + 12.5, 3, 0.6, 2, '#ffeb3b', { act: 'menu', title: '🧸 Spielecke', menu: ['teddy', 'duck', 'ball'] });
    deco(ox - 18, 0, oz + 5, 1.6, 2.2, 3, '#4fc3f7', { opacity: 0.6, emissive: '#29b6f6', emissiveIntensity: 0.3 });
    // Wand zwischen Wartezimmer und Behandlung
    box(ox - 9, 0, oz + 2, W - 18, 3.8, 0.4, '#bbdefb', { tex: 'tiles' });
    box(ox + 15.5, 0, oz + 2, 9, 3.8, 0.4, '#bbdefb', { tex: 'tiles' });
    sign('Zähne putzen nicht vergessen! 🪥', ox - 6, 2.5, oz + 2.25, 9, 1.0, 'z+', '#ffffff', '#0277bd', false);
    // Behandlungszimmer
    for (let i = 0; i < 3; i++) {
      const x = ox - 13 + i * 13, z = oz - 7;
      if (i < 2) box(x + 6.5, 0, z, 0.3, 3.8, 14, '#e1f5fe');
      box(x, 0, z, 1.6, 0.9, 4.2, '#26c6da', { act: 'dchair', rot: 0, chair: i });
      deco(x, 0.9, z - 1.8, 1.6, 1.3, 0.5, '#26c6da');
      deco(x, 3.4, z - 0.5, 1.4, 0.2, 0.8, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 });
      deco(x, 0, z - 2.6, 0.15, 3.4, 0.15, '#90a4ae');
      box(x + 2.4, 0, z + 0.5, 1.4, 1.1, 1.0, '#ffffff', { act: 'dentist', chair: i, title: '🦷 Zähne behandeln' });
      deco(x + 2.4, 1.1, z + 0.5, 1.2, 0.05, 0.8, '#b0bec5');
      box(x - 2.4, 0, z - 4, 1.2, 1.4, 1, '#ffffff', { act: 'brush', title: '🪥 Zähne putzen' });
      staticBots.push({ name: null, pos: [x, 0.9, z + 0.4], rot: 0, anim: 'sleep', role: 'patient', chair: i });
    }
    wardrobePart(ox + 18.6, oz - 12, 1.4, 3, '🥼 Kittel anziehen', 'jobs');
    staticBots.push({ name: 'Dr. Zahnfee', pos: [ox + 16, 0, oz - 9], rot: -Math.PI / 2, anim: 'idle', job: 0, role: 'dentist', say: ['Hallo! Willst du Zahnärztin sein? 🦷', 'Zieh den Kittel an und hilf mir!', 'Die Patienten warten schon!'] });
  }

  // Kletterhaus
  {
    const { x: ox, z: oz } = interiors.parkour;
    const W = 40, D = 40, H = 36;
    interiors.parkour.spawn = shell(ox, oz, W, D, H, '#ce93d8', 'checker', '#ba68c8', 'metal', 'Kletterhaus 🧗');
    const plat = (x, y, z, w, d, c) => box(ox + x, y - 0.5, oz + z, w, 0.5, d, c, { tex: 'metal' });
    // Runde 1: Leiter und Hüpfplattformen
    plat(-16, 6, 12, 6, 6, '#f48fb1');
    ladder(ox - 16, oz + 15.05, 0, 6, 's', '#ffeb3b');
    plat(-16, 6.6, 5, 3, 3, '#ff80ab'); plat(-16, 7.2, 0, 3, 3, '#ff4081'); plat(-12, 7.8, -4, 3, 3, '#f50057');
    plat(-6, 8.4, -6, 4, 4, '#ce93d8');
    // Trampolin nach oben
    box(ox - 1, 8, oz - 6, 3, 0.4, 3, '#00e5ff', { k: 'bounce' });
    plat(5, 14, -6, 6, 6, '#7e57c2');
    // Kletterwand
    box(ox + 14, 14, oz - 16, 10, 8, 2, '#ff7043', { tex: 'stone' });
    plat(12, 14, -12, 12, 6, '#7e57c2');
    ladder(ox + 14, oz - 14.95, 14, 22, 's', '#76ff03');
    plat(14, 22, -16.5, 10, 3, '#5e35b1');
    // Balken
    plat(8, 22, -10, 1.5, 9, '#ffca28'); plat(8, 22.6, -1, 1.5, 7, '#ffb300');
    // Wackelplattformen
    add(P(ox + 2, 22.6, oz + 4, 3.5, 0.5, 3.5, '#4dd0e1', { m: { type: 'line', ax: 'x', amp: 4, speed: 1.2, phase: 0 } }));
    plat(-6, 23, 4, 5, 5, '#26c6da');
    ladder(ox - 6, oz + 6.55, 23, 30, 's', '#ff4081');
    plat(-6, 30, 3.5, 10, 6, '#ffd600');
    box(ox - 6, 30, oz + 1.5, 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_parkour', tex: 'wood' });
    deco(ox - 6, 31.1, oz + 1.5, 1.6, 0.35, 1.1, '#ffca28', { emissive: '#ffb300', emissiveIntensity: 0.5 });
    sign('🏆 Geschafft!', ox - 6, 33, oz + 0.7, 4, 1, 'z+', '#fff59d', '#e65100', false);
    // Rutschen zurück nach unten
    slide(ox - 0.5, oz + 3, 'x', 1, 14, 30, 22, '#29b6f6', 2.4);
    plat(16, 22, 3, 5, 5, '#29b6f6');
    slide(ox + 16, oz + 5.5, 'z', 1, 10, 22, 14, '#29b6f6', 2.4);
    plat(16, 14, 17, 5, 5, '#29b6f6');
    slide(ox + 13.5, oz + 17, 'x', -1, 12, 14, 0.2, '#29b6f6', 2.4);
    // Schaumgrube
    box(ox + 10, 0, oz + 6, 8, 0.6, 6, '#ffeb3b', { k: 'bounce' });
  }

  // Labyrinth-Haus (2 Ebenen)
  {
    const { x: ox, z: oz } = interiors.maze;
    const N = 11, C = 5;
    const W = N * C, D = N * C;
    interiors.maze.spawn = shell(ox, oz, W + 6, D + 10, 12, '#f8bbd0', 'checker', '#ab47bc', 'hearts', 'Labyrinth 🌀');
    const mr = rng(4242);
    const cells = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ v: false, e: true, s: true })));
    const stack = [[Math.floor(N / 2), N - 1]]; cells[Math.floor(N / 2)][N - 1].v = true;
    while (stack.length) {
      const [i, j] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !cells[a][b].v);
      if (!nb.length) { stack.pop(); continue; }
      const [a, b] = nb[Math.floor(mr() * nb.length)];
      if (a > i) cells[i][j].e = false; if (a < i) cells[a][b].e = false;
      if (b > j) cells[i][j].s = false; if (b < j) cells[a][b].s = false;
      cells[a][b].v = true; stack.push([a, b]);
    }
    const x0 = ox - W / 2, z0 = oz - D / 2 - 2, T = 0.6, H = 4.5;
    const cols = ['#ec407a', '#ab47bc', '#7e57c2', '#f06292'];
    const wall = (x, z, w, d) => box(x, 0, z, w, H, d, cols[Math.floor(mr() * cols.length)], { tex: 'hearts' });
    for (let i = 0; i < N; i++) {
      wall(x0 + i * C + C / 2, z0, C + T, T);
      if (i !== Math.floor(N / 2)) wall(x0 + i * C + C / 2, z0 + N * C, C + T, T);
    }
    for (let j = 0; j < N; j++) { wall(x0, z0 + j * C + C / 2, T, C + T); wall(x0 + N * C, z0 + j * C + C / 2, T, C + T); }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (cells[i][j].e && i < N - 1) wall(x0 + (i + 1) * C, z0 + j * C + C / 2, T, C + T);
      if (cells[i][j].s && j < N - 1) wall(x0 + i * C + C / 2, z0 + (j + 1) * C, C + T, T);
    }
    // Schätze & Leitern auf die Mauern (oben kann man über die Mauern balancieren!)
    const cx = x0 + Math.floor(N / 2) * C + C / 2, cz = z0 + Math.floor(N / 2) * C + C / 2;
    box(cx, 0, cz, 1.6, 1.1, 1.1, '#8d6e63', { act: 'treasure', key: 'chest_maze_in', tex: 'wood' });
    deco(cx, 1.1, cz, 1.6, 0.35, 1.1, '#ffca28', { emissive: '#ffb300', emissiveIntensity: 0.5 });
    deco(cx, 4, cz, 1.4, 1.4, 1.4, '#ffd600', { shape: 'sphere', emissive: '#ffd600' });
    for (const [i, j] of [[1, 1], [N - 2, 2], [2, N - 3], [N - 3, N - 2]]) {
      box(x0 + i * C + C / 2, 0, z0 + j * C + C / 2, 1.4, 0.5, 1.4, '#00e5ff', { k: 'bounce' });
    }
  }

  // Café innen
  {
    const { x: ox, z: oz } = interiors.cafe;
    interiors.cafe.spawn = shell(ox, oz, 32, 24, 8, '#ffe0b2', 'checker', '#a1887f', 'brick', 'Café & Bäckerei ☕');
    box(ox, 0, oz - 7, 14, 1.3, 1.8, '#8d6e63', { act: 'menu', title: '☕ Bestellen', menu: ['croissant', 'donut', 'cookie', 'cake', 'icecream', 'juice', 'pizza', 'burger'], tex: 'wood' });
    deco(ox - 3, 1.3, oz - 7, 5, 0.9, 1.4, '#e1f5fe', { opacity: 0.5 });
    for (let i = 0; i < 5; i++) deco(ox - 5 + i, 1.4, oz - 7, 0.5, 0.3, 0.5, ['#f48fb1', '#ffcc80', '#ce93d8', '#fff59d', '#a5d6a7'][i], { shape: 'cyl' });
    box(ox + 8, 0, oz - 10.6, 3.4, 1.2, 1.4, '#455a64', { act: 'menu', title: '🧁 Backen', menu: ['cake', 'cookie', 'croissant', 'donut'] });
    staticBots.push({ name: 'Bäcker Bruno', pos: [ox, 0, oz - 9], rot: 0, anim: 'idle', job: 2, role: 'shop', say: ['Frisch gebacken! 🥐', 'Was darf es sein?', 'Probier die Torte! 🎂'] });
    zoneAct(ox + 8, 0, oz - 10.6, 4, 2, 'job', { title: '🥐 In der Bäckerei arbeiten', jobId: 0 });
    for (const [x, z] of [[-9, 2], [0, 4], [9, 2], [-9, 8], [9, 8]]) {
      box(ox + x, 0, oz + z, 2, 1.1, 2, '#ffffff', { shape: 'cyl' });
      chair(ox + x - 1.7, oz + z, Math.PI / 2, '#f48fb1'); chair(ox + x + 1.7, oz + z, -Math.PI / 2, '#f48fb1');
    }
    it('cake', ox, 1.1, oz + 4); it('donut', ox - 9, 1.1, oz + 2);
  }

  // Boutique innen (mit Laufsteg)
  {
    const { x: ox, z: oz } = interiors.boutique;
    interiors.boutique.spawn = shell(ox, oz, 40, 30, 9, '#f8bbd0', 'checker', '#f48fb1', 'hearts', 'Boutique 👗');
    const rack = (x, z, title, tab, len = 6, horiz = true) => {
      deco(x, 2.6, z, horiz ? len : 0.12, 0.12, horiz ? 0.12 : len, '#9e9e9e');
      deco(x - (horiz ? len / 2 : 0), 0, z - (horiz ? 0 : len / 2), 0.12, 2.6, 0.12, '#9e9e9e');
      deco(x + (horiz ? len / 2 : 0), 0, z + (horiz ? 0 : len / 2), 0.12, 2.6, 0.12, '#9e9e9e');
      for (let i = 0; i < 7; i++) {
        const t = -len / 2 + 0.5 + i * ((len - 1) / 6);
        deco(x + (horiz ? t : 0), 1.2, z + (horiz ? 0 : t), horiz ? 0.25 : 0.9, 1.3, horiz ? 0.9 : 0.25, RAINBOW[(i + len) % 7]);
      }
      add(P(x, 1.5, z, horiz ? len : 2.5, 3, horiz ? 2.5 : len, '#000', { k: 'zone', act: 'wardrobe', title, tab, invisible: true }));
    };
    rack(ox - 14, oz - 10, '👚 Oberteile', 'shirtStyle');
    rack(ox - 14, oz - 2, '👗 Hosen & Röcke', 'pantsStyle');
    rack(ox - 14, oz + 6, '👟 Schuhe', 'shoes');
    rack(ox + 14, oz - 10, '👒 Hüte', 'hat');
    rack(ox + 14, oz - 2, '🕶️ Accessoires', 'acc');
    rack(ox + 14, oz + 6, '⭐ Berufe & Kostüme', 'jobs');
    // Umkleiden
    for (const s of [-1, 1]) {
      deco(ox + s * 6, 0, oz - 13.6, 0.2, 3.5, 3, '#ce93d8');
      deco(ox + s * 6 + s * 1.6, 3.5, oz - 13.6, 3.4, 0.2, 3, '#ce93d8');
      wardrobePart(ox + s * 8, oz - 14.6, 2.6, 0.6, '🪞 Umkleide');
      deco(ox + s * 8, 1, oz - 14.2, 2, 2.4, 0.06, '#e1f5fe', { emissive: '#ffffff', emissiveIntensity: 0.3 });
    }
    // Laufsteg
    box(ox, 0, oz - 2, 4, 0.6, 16, '#ffffff', { tex: 'tiles' });
    stairs(ox, oz + 7.8, 'n', 3, 0, 0.6, '#ffffff', null, 0.6, 1.0);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) deco(ox + s * 2.3, 0, oz - 9 + i * 3, 0.3, 0.8, 0.3, '#fff59d', { emissive: '#fff59d', emissiveIntensity: 1 });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) add(P(ox - 1 + i * 2, 0.7, oz - 11 + j * 2, 1.96, 0.2, 1.96, RAINBOW[(i + j) % 7], { k: 'dance' }));
    sign('✨ Laufsteg ✨', ox, 5.5, oz - 14.6, 6, 1.2, 'z+', '#ffffff', '#ad1457', false);
    staticBots.push({ name: 'Modedesignerin Mila', pos: [ox + 6, 0, oz + 9], rot: Math.PI, anim: 'idle', role: 'shop', fancy: true, say: ['Probier die neuen Kleider! 👗', 'Lauf über den Laufsteg! ✨', 'Du siehst toll aus! 😍'] });
    zoneAct(ox + 12, 0, oz + 4, 6, 4, 'job', { title: '👗 In der Boutique arbeiten', jobId: 4 });
  }

  // Friseur innen
  {
    const { x: ox, z: oz } = interiors.salon;
    interiors.salon.spawn = shell(ox, oz, 30, 22, 8, '#f3e5f5', 'checker', '#ce93d8', 'stars', 'Friseursalon ✂️');
    for (let i = 0; i < 4; i++) {
      const x = ox - 10.5 + i * 7;
      box(x, 0, oz - 7, 1.4, 1.0, 1.4, '#7b1fa2', { act: 'salon', rot: 0 });
      deco(x, 1.0, oz - 7.6, 1.4, 1.4, 0.25, '#7b1fa2');
      deco(x, 1.5, oz - 10.7, 2.2, 2.6, 0.1, '#e1f5fe', { emissive: '#ffffff', emissiveIntensity: 0.25 });
      deco(x, 0, oz - 10.4, 2.4, 1.1, 0.6, '#ffffff');
    }
    sofa(ox + 11, oz + 4, -Math.PI / 2, '#f8bbd0', 4);
    box(ox - 12, 0, oz + 3, 2.6, 1.1, 1.6, '#f48fb1', { act: 'salon', rot: Math.PI / 2, title: '💅 Make-up & Nägel' });
    staticBots.push({ name: 'Friseurin Fia', pos: [ox - 7, 0, oz - 4.5], rot: Math.PI, anim: 'idle', role: 'shop', say: ['Neue Frisur gefällig? ✂️', 'Setz dich auf einen Stuhl!', 'Wow, schöne Haare! 💜'] });
  }

  // Tierhandlung innen
  {
    const { x: ox, z: oz } = interiors.pets;
    interiors.pets.spawn = shell(ox, oz, 30, 22, 8, '#fffde7', 'wood', '#ffcc80', 'dots', 'Tierhandlung 🐾');
    box(ox - 3, 0, oz - 7, 5, 1.3, 1.6, '#ffb74d', { act: 'adopt', title: '🐾 Eigenes Haustier adoptieren', tex: 'wood' });
    box(ox + 3.5, 0, oz - 7, 4, 1.3, 1.6, '#ffcc80', { act: 'menu', title: '🧸 Tier zum Tragen', menu: ['cat', 'dog', 'bunny', 'chick', 'penguin', 'parrot'], tex: 'wood' });
    sign('Hier kannst du ein Haustier adoptieren – es folgt dir überall hin! 🐾', ox, 3.4, oz - 10.9, 13, 1.0, 'z+', '#fff8e1', '#e65100', false);
    box(ox + 12, 0, oz - 2, 1.6, 1.3, 6, '#90caf9', { act: 'menu', title: '🎾 Spielzeug & Futter', menu: ['ball', 'duck', 'carrot', 'cookie', 'balloon'] });
    for (const [x, z, c] of [[-10, -2, '#ef9a9a'], [-10, 3, '#a5d6a7'], [-5, 6, '#ce93d8']]) deco(ox + x, 0, oz + z, 2.4, 0.3, 2.4, c, { tex: 'carpet' });
    deco(ox - 12, 0, oz - 8, 3, 2.4, 1.4, '#4fc3f7', { opacity: 0.6, emissive: '#29b6f6', emissiveIntensity: 0.3 });
    staticBots.push({ name: 'Tierpfleger Tom', pos: [ox, 0, oz - 9], rot: 0, anim: 'idle', job: 8, role: 'shop', say: ['Die Tiere freuen sich auf dich! 🐶', 'Streichle sie mal! ❤️', 'Welches Haustier möchtest du?'] });
    it('cat', ox - 10, 0.3, oz - 2); it('bunny', ox - 10, 0.3, oz + 3); it('dog', ox - 5, 0.3, oz + 6);
  }

  // Supermarkt innen
  {
    const { x: ox, z: oz } = interiors.market;
    interiors.market.spawn = shell(ox, oz, 40, 28, 8, '#eeeeee', 'tiles', '#c8e6c9', 'tiles', 'Supermarkt 🛒');
    const shelf = (x, z, title, menu, c) => {
      box(x, 0, z, 10, 2.4, 1.6, '#eceff1', { act: 'menu', title, menu, tex: 'metal' });
      for (let i = 0; i < 8; i++) for (const y of [0.9, 1.7]) deco(x - 4.3 + i * 1.2, y, z, 0.8, 0.5, 1.7, c[(i + Math.round(y)) % c.length]);
    };
    shelf(ox - 10, oz - 8, '🍎 Obst & Gemüse', ['apple', 'banana', 'strawberry', 'carrot'], ['#e53935', '#fdd835', '#43a047', '#fb8c00']);
    shelf(ox + 6, oz - 8, '🥐 Bäckerei', ['croissant', 'cake', 'cookie', 'donut'], ['#d7a86e', '#f8bbd0', '#ffcc80']);
    shelf(ox - 10, oz - 1, '🍭 Süsses', ['icecream', 'donut', 'cookie', 'cake'], ['#f06292', '#ba68c8', '#4fc3f7']);
    shelf(ox + 6, oz - 1, '🧃 Getränke & Pizza', ['juice', 'pizza', 'burger'], ['#ffa726', '#e53935', '#26c6da']);
    for (const s of [-1, 1]) {
      box(ox + s * 8, 0, oz + 6, 4, 1.1, 1.6, '#90a4ae', { act: 'register', tex: 'metal' });
      deco(ox + s * 8 - 1, 1.1, oz + 6, 0.8, 0.6, 0.6, '#212121');
    }
    staticBots.push({ name: 'Kassiererin Kim', pos: [ox - 8, 0, oz + 7.6], rot: Math.PI, anim: 'idle', role: 'shop', say: ['Piep! 🛒', 'Schönen Tag noch! 😊', 'Hast du alles gefunden?'] });
    zoneAct(ox - 10, 0, oz - 4, 10, 3, 'job', { title: '🛒 Im Supermarkt arbeiten', jobId: 1 });
  }

  // ---------- Wege für Bots ----------
  const nodes = [];
  const edges = [];
  const nodeAt = new Map();
  const node = (x, z) => {
    const k = x + ',' + z;
    if (!nodeAt.has(k)) { nodeAt.set(k, nodes.length); nodes.push([x, z]); }
    return nodeAt.get(k);
  };
  const S = 7;
  for (let a = 0; a < ROADS.length; a++) for (let b = 0; b < ROADS.length; b++) {
    const rx = ROADS[a], rz = ROADS[b];
    const c = [[-S, -S], [S, -S], [S, S], [-S, S]].map(([dx, dz]) => node(rx + dx, rz + dz));
    for (let i = 0; i < 4; i++) edges.push([c[i], c[(i + 1) % 4]]);
    if (a + 1 < ROADS.length) for (const dz of [-S, S]) edges.push([node(rx + S, rz + dz), node(ROADS[a + 1] - S, rz + dz)]);
    if (b + 1 < ROADS.length) for (const dx of [-S, S]) edges.push([node(rx + dx, rz + S), node(rx + dx, ROADS[b + 1] - S)]);
  }
  for (const p of pois) {
    let best = 0, bd = Infinity;
    nodes.forEach(([x, z], i) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = i; } });
    p.node = best;
  }

  const destinations = [
    ['🏙️ Stadtplatz', 0, 12], ['🏠 Mein Haus', -120, -42], ['🦷 Zahnarzt', -60, -44], ['☕ Café', 4, -44], ['👗 Boutique', 60, -44],
    ['🛝 Spielplatz', -120, 18], ['✂️ Friseur & 🐾 Tiere', -60, 12], ['🛒 Supermarkt', 72, 16], ['🛹 Skatepark', 116, 18],
    ['🌳 Park & See', -120, 42], ['🤸 Trampolinpark', -60, 42], ['🚗 Fahrzeuge', 0, 42], ['🌈 Obby-Turm', 106, 76],
    ['🧗 Kletterhaus', -60, -106], ['🌿 Irrgarten', 0, -96], ['🚒 Feuerwehr', 120, -102], ['🏎️ Kart-Bahn', 120, -38],
    ['🌀 Labyrinth-Haus', -60, 104], ['⏰ Abenteuer-Haus', 0, 104], ['🐄 Bauernhof', 110, 140], ['🏖️ Strand & ✈️ Flughafen', 0, G + 7],
    ['🛍️ Einkaufsstrasse', 0, -236], ['🍕 Pizzeria', -200, -238], ['🏡 Eigene Häuser', 0, -198], ['🎡 Hana-Land', -190, 284], ['🏊 Schwimmbad', -60, 274], ['🐰 Streichelzoo', 70, 274], ['⚽ Sportplatz', 200, 272], ['🔥 Lagerfeuer', 255, 24], ['⛺ Pfadi-Lager', -255, -24],
  ];

  // Flughafen am Strand
  K.box(0, 0, G + 20, 16, 6, 8, '#eceff1', { tex: 'tiles' });
  K.deco(0, 6, G + 20, 16.6, 0.5, 8.6, '#90caf9');
  sign('Flughafen ✈️', 0, 4.6, G + 15.8, 9, 1.4, 'z-', '#ffffff', '#1565c0');
  box(0, 0, G + 14.4, 6, 1.3, 1.6, '#90caf9', { act: 'travel', title: '✈️ Verreisen' });

  const w = { staticBots, interiors, destinationsStadt: destinations };
  addLands(K, w);

  return {
    name: 'Hana-Stadt', sky: '#8fd3fe', spawn: [0, 0.12, 12], killY: -15, parts, items,
    cam: { pitch: 0.42, dist: 13 }, pois, nav: { nodes, edges }, staticBots, interiors,
    bounds: G, destinations: w.destinations, lands: LAND_DEFS,
  };
}
