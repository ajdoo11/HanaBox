// Abenteuer-Häuser: werden jede Stunde neu und anders gebaut.
// 3 Stockwerke mit je 4×4 Räumen: Lava-Parkour, Wackelplattformen, Trampoline, Bällebad, Irrgänge,
// Rutschen, Leitern durch Bodenluken, verschlossene Türen mit Knöpfen, Sterne und ein Schatz ganz oben.
import { P, RAINBOW, PASTEL, rng, createKit } from './kit.js';

export const ADV_THEMES = [
  { name: 'Abenteuer-Haus', wall: '#ffcc80', wallTex: 'brick', floor: '#fff3e0', floorTex: 'checker', accent: '#ff7043' },
  { name: 'Eispalast', wall: '#b3e5fc', wallTex: 'metal', floor: '#e1f5fe', floorTex: 'tiles', accent: '#29b6f6' },
  { name: 'Dschungel-Tempel', wall: '#9e9d24', wallTex: 'stone', floor: '#c5e1a5', floorTex: 'stone', accent: '#689f38' },
  { name: 'Zauberturm', wall: '#9575cd', wallTex: 'stars', floor: '#d1c4e9', floorTex: 'checker', accent: '#7e57c2' },
];

export const advOrigin = id => ({ x: 6000 + id * 600, z: -6000 });
export const hourIndex = now => Math.floor(now / 3600000);
export const minutesLeft = now => 60 - Math.floor((now % 3600000) / 60000);

export function makeAdventure(id, seed) {
  const parts = [];
  const K = createKit({ parts, seed: seed * 7 + 3 });
  const { box, deco, ladder, slide, sign } = K;
  const r = rng(seed * 13 + id * 101 + 5);
  const T = ADV_THEMES[id % ADV_THEMES.length];
  const { x: OX, z: OZ } = advOrigin(id);
  const N = 5, S = 18, H = 9, F = 3, DW = 3.4, DH = 4, WT = 0.6;
  const x0 = OX - (N * S) / 2, z0 = OZ - (N * S) / 2;
  const cellC = (i, j) => [x0 + i * S + S / 2, z0 + j * S + S / 2];
  const pick = a => a[Math.floor(r() * a.length)];
  let doorSeq = 0, gemSeq = 0;
  const gems = [];

  // Aussenwände
  const wallH = F * H + 2;
  box(OX, 0, z0 - WT / 2, N * S + WT * 2, wallH, WT, T.wall, { tex: T.wallTex });
  box(OX - (N * S) / 2 - WT / 2, 0, OZ, WT, wallH, N * S, T.wall, { tex: T.wallTex });
  box(OX + (N * S) / 2 + WT / 2, 0, OZ, WT, wallH, N * S, T.wall, { tex: T.wallTex });

  let arrive = [1 + Math.floor(r() * 3), N - 1];
  const startCell = arrive;
  let entry = null;
  let goal = null;

  for (let f = 0; f < F; f++) {
    const y0 = f * H;
    // --- Labyrinth-Plan (Spannbaum) ---
    const conn = new Set();
    const key = (a, b) => (a[0] * 10 + a[1] < b[0] * 10 + b[1] ? `${a}|${b}` : `${b}|${a}`);
    const seen = new Set([String(arrive)]);
    const stack = [arrive];
    while (stack.length) {
      const c = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [c[0] + a, c[1] + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(String([a, b])));
      if (!nb.length) { stack.pop(); continue; }
      const n = pick(nb);
      conn.add(key(c, n)); seen.add(String(n)); stack.push(n);
    }
    // ein paar Extra-Verbindungen für Abkürzungen
    for (let k = 0; k < 3; k++) {
      const a = [Math.floor(r() * N), Math.floor(r() * N)];
      const b = r() < 0.5 ? [a[0] + 1, a[1]] : [a[0], a[1] + 1];
      if (b[0] < N && b[1] < N) conn.add(key(a, b));
    }
    const linked = (a, b) => conn.has(key(a, b));
    // Entfernungen von der Ankunft
    const dist = new Map([[String(arrive), 0]]);
    const q = [arrive];
    const prev = new Map();
    while (q.length) {
      const c = q.shift();
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [c[0] + a, c[1] + b];
        if (n[0] < 0 || n[1] < 0 || n[0] >= N || n[1] >= N || dist.has(String(n)) || !linked(c, n)) continue;
        dist.set(String(n), dist.get(String(c)) + 1); prev.set(String(n), c); q.push(n);
      }
    }
    let far = arrive, fd = -1;
    for (const [k, d] of dist) if (d > fd) { fd = d; far = k.split(',').map(Number); }
    const up = far;
    // Tür vor dem Ziel-Raum verschliessen; Knopf in einem erreichbaren Raum
    const lockKeys = new Set();
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [up[0] + a, up[1] + b];
      if (String(up) !== String(arrive) && n[0] >= 0 && n[1] >= 0 && n[0] < N && n[1] < N && linked(up, n)) lockKeys.add(key(up, n));
    }
    const lockKey = lockKeys.size ? 'x' : null;
    const reach = new Set([String(arrive)]);
    const q2 = [arrive];
    while (q2.length) {
      const c = q2.shift();
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [c[0] + a, c[1] + b];
        if (n[0] < 0 || n[1] < 0 || n[0] >= N || n[1] >= N || reach.has(String(n)) || !linked(c, n) || lockKeys.has(key(c, n))) continue;
        reach.add(String(n)); q2.push(n);
      }
    }
    const btnCells = [...reach].map(s => s.split(',').map(Number)).filter(c => String(c) !== String(arrive));
    const btnCell = btnCells.length ? pick(btnCells) : arrive;
    const doorKey = lockKey ? `door_${seed}_${doorSeq++}` : null;

    // --- Boden dieses Stockwerks (mit Luke für die Leiter von unten) ---
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const [cx, cz] = cellC(i, j);
      const isArrive = f > 0 && i === arrive[0] && j === arrive[1];
      if (isArrive) {
        // Luke 3×3 in der Mitte
        box(cx, y0 - 0.5, cz - 4.75, S, 0.5, 6.5, T.floor, { tex: T.floorTex });
        box(cx, y0 - 0.5, cz + 4.75, S, 0.5, 6.5, T.floor, { tex: T.floorTex });
        box(cx - 4.75, y0 - 0.5, cz, 6.5, 0.5, 3, T.floor, { tex: T.floorTex });
        box(cx + 4.75, y0 - 0.5, cz, 6.5, 0.5, 3, T.floor, { tex: T.floorTex });
      } else box(cx, y0 - 0.5, cz, S, 0.5, S, T.floor, { tex: T.floorTex });
    }

    // --- Innenwände mit Durchgängen ---
    const wallSeg = (x, z, w, d) => box(x, y0, z, w, H, d, T.wall, { tex: T.wallTex });
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const [cx, cz] = cellC(i, j);
      if (i < N - 1) {
        const x = x0 + (i + 1) * S;
        if (linked([i, j], [i + 1, j])) {
          wallSeg(x, cz - (S + DW) / 4, WT, (S - DW) / 2); wallSeg(x, cz + (S + DW) / 4, WT, (S - DW) / 2);
          box(x, y0 + DH, cz, WT, H - DH, DW, T.wall, { tex: T.wallTex });
          if (lockKeys.has(key([i, j], [i + 1, j]))) addDoor(x, y0, cz, WT * 0.8, DW, doorKey);
        } else wallSeg(x, cz, WT, S);
      }
      if (j < N - 1) {
        const z = z0 + (j + 1) * S;
        if (linked([i, j], [i, j + 1])) {
          wallSeg(cx - (S + DW) / 4, z, (S - DW) / 2, WT); wallSeg(cx + (S + DW) / 4, z, (S - DW) / 2, WT);
          box(cx, y0 + DH, z, DW, H - DH, WT, T.wall, { tex: T.wallTex });
          if (lockKeys.has(key([i, j], [i, j + 1]))) addDoor(cx, y0, z, DW, WT * 0.8, doorKey);
        } else wallSeg(cx, z, S, WT);
      }
    }
    // Vorderwand (Süden) mit Eingang im Erdgeschoss
    for (let i = 0; i < N; i++) {
      const [cx] = cellC(i, 0);
      const z = z0 + N * S + WT / 2;
      if (f === 0 && i === startCell[0]) {
        box(cx - (S + DW) / 4, y0, z, (S - DW) / 2, H, WT, T.wall, { tex: T.wallTex });
        box(cx + (S + DW) / 4, y0, z, (S - DW) / 2, H, WT, T.wall, { tex: T.wallTex });
        box(cx, y0 + DH, z, DW, H - DH, WT, T.wall, { tex: T.wallTex });
        deco(cx, 0, z + 0.4, DW, DH, 0.2, '#81d4fa', { emissive: '#e1f5fe', emissiveIntensity: 0.9, noShadow: true });
        parts.push(P(cx, 1.6, z - 1.0, 3, 3.2, 1.4, '#000', { k: 'portal', invisible: true, to: 'back', name: 'Draussen' }));
        sign('🚪 Ausgang', cx, 4.8, z - 0.35, 3.2, 0.7, 'z-', '#ffffff', '#2e7d32', false);
        entry = [cx, 0.05, z - 4];
      } else box(cx, y0, z, S, H, WT, T.wall, { tex: T.wallTex });
    }

    // --- Räume füllen ---
    const doorsOf = (i, j) => {
      const [cx, cz] = cellC(i, j);
      const d = [];
      if (i > 0 && linked([i, j], [i - 1, j])) d.push([cx - S / 2 + 1.6, cz]);
      if (i < N - 1 && linked([i, j], [i + 1, j])) d.push([cx + S / 2 - 1.6, cz]);
      if (j > 0 && linked([i, j], [i, j - 1])) d.push([cx, cz - S / 2 + 1.6]);
      if (j < N - 1 && linked([i, j], [i, j + 1])) d.push([cx, cz + S / 2 - 1.6]);
      if (f === 0 && i === startCell[0] && j === N - 1) d.push([cx, cz + S / 2 - 1.6]);
      return d;
    };
    const types = ['lava', 'lava', 'moving', 'tramp', 'balls', 'maze', 'beams', 'plain', 'climb', 'slide', 'lava', 'moving'];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const [cx, cz] = cellC(i, j);
      const isArrive = i === arrive[0] && j === arrive[1];
      const isUp = i === up[0] && j === up[1];
      const pads = doorsOf(i, j);
      if (isArrive) {
        if (f === 0) sign(`${T.name}: neu in jeder Stunde! ⏰`, cx, 6, cz - S / 2 + WT / 2 + 0.05, 10, 1.1, 'z+', '#ffffff', T.accent, false);
        decorate(cx, cz, y0);
        continue;
      }
      if (isUp) {
        if (f < F - 1) {
          // Leiter zur Luke im nächsten Stock
          ladder(cx, cz - 1.55, y0, y0 + H, 's', '#ffeb3b');
          sign('⬆️ Nach oben!', cx, y0 + 6, cz - S / 2 + WT / 2 + 0.05, 5, 1, 'z+', '#fff59d', T.accent, false);
        } else {
          goal = [cx, cz, y0];
          box(cx, y0, cz, 8, 1, 8, '#ffd54f', { k: 'goal', emissive: '#ffb300', emissiveIntensity: 0.3 });
          box(cx, y0 + 1, cz - 2, 2, 1.1, 1.2, '#8d6e63', { act: 'treasure', key: `adv${id}_${seed}`, perSeed: true, big: true, tex: 'wood' });
          deco(cx, y0 + 2.1, cz - 2, 2, 0.4, 1.2, '#ffca28', { emissive: '#ffb300', emissiveIntensity: 0.6 });
          deco(cx, y0 + 5, cz, 1.6, 1.6, 1.6, '#ffd600', { shape: 'sphere', emissive: '#ffd600' });
          sign('🏆 Geschafft! Hol dir den Schatz!', cx, y0 + 7, cz - S / 2 + WT / 2 + 0.05, 10, 1.2, 'z+', '#fff59d', '#e65100', false);
        }
        continue;
      }
      if (i === btnCell[0] && j === btnCell[1] && doorKey) { buttonRoom(cx, cz, y0, doorKey); continue; }
      room(pick(types), cx, cz, y0, pads);
    }
    arrive = up;
  }

  function addDoor(x, y0, z, w, d, k) {
    parts.push(P(x, y0 + DH / 2, z, w, DH, d, '#8d6e63', { own: true, door: k, tex: 'wood' }));
    deco(x, y0 + DH + 0.3, z, Math.max(w, 0.3), 0.6, Math.max(d, 0.3), '#e53935', { emissive: '#ff1744', emissiveIntensity: 0.6, lockLamp: k, own: true });
  }

  function gem(x, y, z) {
    parts.push(P(x, y + 0.9, z, 1.0, 1.2, 1.0, '#ffd600', { k: 'deco', gem: `gem${id}_${seed}_${gemSeq++}`, shape: 'sphere', emissive: '#ffd600', emissiveIntensity: 0.7, own: true }));
  }

  function decorate(cx, cz, y0) {
    for (let k = 0; k < 3; k++) deco(cx + (r() - 0.5) * 10, y0, cz + (r() - 0.5) * 10, 1.4, 0.8, 1.4, pick(PASTEL), { shape: 'cyl' });
  }

  function lavaFloor(cx, cz, y0, pads) {
    box(cx, y0, cz, S - 0.2, 0.35, S - 0.2, '#ff5722', { k: 'lava' });
    for (const [px, pz] of pads) box(px, y0, pz, 3.4, 0.55, 3.4, T.accent, { tex: 'metal' });
  }

  function room(type, cx, cz, y0, pads) {
    switch (type) {
      case 'lava': {
        lavaFloor(cx, cz, y0, pads);
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
          if (r() < 0.12) continue;
          const h = 0.8 + Math.floor(r() * 3) * 0.5;
          box(cx + a * 3.1, y0, cz + b * 3.1, 1.8, h, 1.8, pick(RAINBOW));
        }
        if (r() < 0.7) gem(cx, y0 + 2.4, cz);
        break;
      }
      case 'moving': {
        lavaFloor(cx, cz, y0, pads);
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
          const ax = r() < 0.5 ? 'x' : 'z';
          if ((a + b) % 2 === 0) box(cx + a * 3.1, y0, cz + b * 3.1, 2, 1, 2, '#4dd0e1');
          else parts.push(P(cx + a * 3.1, y0 + 1.1, cz + b * 3.1, 2.4, 0.4, 2.4, '#26c6da', { m: { type: 'line', ax, amp: 1.2, speed: 1 + r(), phase: r() * 6 } }));
        }
        if (r() < 0.7) gem(cx + 3.1, y0 + 1.6, cz + 3.1);
        break;
      }
      case 'tramp': {
        for (let k = 0; k < 4; k++) box(cx + (k % 2 ? 3.5 : -3.5), y0, cz + (k < 2 ? 3.5 : -3.5), 3, 0.4, 3, pick(['#00e5ff', '#ff4081', '#76ff03']), { k: 'bounce' });
        box(cx, y0 + 6.2, cz, 4, 0.4, 4, T.accent, { tex: 'metal' });
        gem(cx, y0 + 6.6, cz);
        break;
      }
      case 'balls': {
        box(cx, y0, cz, 10, 0.4, 10, '#e1bee7', { k: 'bounce' });
        for (let k = 0; k < 40; k++) deco(cx + (r() - 0.5) * 9, y0 + 0.4, cz + (r() - 0.5) * 9, 0.6, 0.6, 0.6, pick(RAINBOW), { shape: 'sphere' });
        if (r() < 0.6) gem(cx, y0 + 4, cz);
        break;
      }
      case 'maze': {
        for (let k = 0; k < 4; k++) {
          const horiz = r() < 0.5;
          const ox = (r() - 0.5) * 7, oz = (r() - 0.5) * 7;
          box(cx + ox, y0, cz + oz, horiz ? 7 : 0.5, 3, horiz ? 0.5 : 7, pick(PASTEL), { tex: 'hearts' });
        }
        if (r() < 0.8) gem(cx + (r() - 0.5) * 9, y0, cz + (r() - 0.5) * 9);
        break;
      }
      case 'beams': {
        lavaFloor(cx, cz, y0, pads);
        box(cx, y0, cz, 3, 0.7, 3, T.accent, { tex: 'metal' });
        for (const [px, pz] of pads) {
          const dx = px - cx, dz = pz - cz;
          box((px + cx) / 2, y0, (pz + cz) / 2, Math.abs(dx) > 0.5 ? Math.abs(dx) : 0.9, 0.7, Math.abs(dz) > 0.5 ? Math.abs(dz) : 0.9, '#ffca28', { tex: 'wood' });
        }
        gem(cx, y0 + 0.7, cz);
        break;
      }
      case 'climb': {
        box(cx, y0, cz - 4, 6, 5, 3, '#ff7043', { tex: 'stone' });
        ladder(cx, cz - 2.45, y0, y0 + 5, 's', '#76ff03');
        gem(cx, y0 + 5, cz - 4);
        break;
      }
      case 'slide': {
        box(cx - 4, y0, cz - 4, 4, 5, 4, '#ba68c8', { tex: 'metal' });
        ladder(cx - 4, cz - 1.95, y0, y0 + 5, 's', '#ffeb3b');
        slide(cx - 2, cz - 4, 'x', 1, 8, y0 + 5, y0 + 0.2, '#ff4081', 2.2);
        gem(cx - 4, y0 + 5, cz - 4.5);
        break;
      }
      default: decorate(cx, cz, y0); if (r() < 0.4) gem(cx, y0, cz);
    }
  }

  function buttonRoom(cx, cz, y0, k) {
    box(cx, y0, cz, 3, 4, 3, T.accent, { tex: 'metal' });
    ladder(cx, cz + 1.55, y0, y0 + 4, 's', '#ffeb3b');
    box(cx, y0 + 4, cz - 0.6, 1.2, 0.5, 1.2, '#e53935', { act: 'button', target: k, own: true, emissive: '#ff1744', emissiveIntensity: 0.5 });
    sign('🔴 Drück den Knopf!', cx, y0 + 7, cz - S / 2 + WT / 2 + 0.05, 7, 1, 'z+', '#ffebee', '#c62828', false);
  }

  const spawn = { entry, face: Math.PI };
  return { parts, spawn, goal, theme: T, origin: { x: OX, z: OZ } };
}
