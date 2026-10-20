// Spielwelten als reine Daten (werden auch vom Server gelesen).
// Jedes Teil: Mitte x,y,z, Grösse w,h,d, Farbe c, optional k (Art) und m (Bewegung).
import { makeTown as makeBigTown } from './town.js';

export const RAINBOW = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#651fff', '#d500f9'];

const P = (x, y, z, w, h, d, c, extra = {}) => ({ x, y, z, w, h, d, c, ...extra });

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tree(parts, x, z, y0 = 0, extra = {}) {
  parts.push(P(x, y0 + 2, z, 1, 4, 1, '#8d6e63'));
  parts.push(P(x, y0 + 5, z, 4, 3, 4, '#43a047', extra));
  parts.push(P(x, y0 + 7, z, 2.4, 1.4, 2.4, '#66bb6a', extra));
}

// Treppe, die an einer Plattformkante (edgeX/edgeZ) beginnt und sich in Richtung dir nach unten bewegt.
function stairs(parts, edgeX, edgeZ, dirX, dirZ, top, width, color, rise = 0.5, depth = 1, extra = {}) {
  const n = Math.round(top / rise);
  for (let j = 0; j < n; j++) {
    const t = top - j * rise;
    const cx = edgeX + dirX * (j * depth + depth / 2);
    const cz = edgeZ + dirZ * (j * depth + depth / 2);
    const w = dirX ? depth : width, d = dirZ ? depth : width;
    parts.push(P(cx, t / 2, cz, w, t, d, Array.isArray(color) ? color[j % color.length] : color, extra));
  }
}

function clouds(parts, seed, n, spread, yMin, yMax) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * spread, z = (r() - 0.5) * spread, y = yMin + r() * (yMax - yMin);
    const s = 4 + r() * 6;
    parts.push(P(x, y, z, s, 1.5, s * 0.6, '#ffffff', { k: 'deco' }));
    parts.push(P(x + s * 0.3, y + 0.8, z, s * 0.5, 1.2, s * 0.4, '#ffffff', { k: 'deco' }));
  }
}

// ---------- Regenbogen-Obby ----------
function makeObby() {
  const parts = [];
  const add = (x, top, z, w, d, c, extra = {}, h = 1) => parts.push(P(x, top - h / 2, z, w, h, d, c, extra));
  let edge = -7, top = 0, stage = 0;
  add(0, 0, 0, 14, 14, '#f5f5f5', { k: 'checkpoint', n: 0 });
  const checkpoint = (gap = 3) => {
    stage++;
    const z = edge - gap - 4;
    add(0, top, z, 8, 8, '#ffffff', { k: 'checkpoint', n: stage });
    edge = z - 4;
  };

  // 1: Hüpfsteine
  for (let i = 0; i < 6; i++) {
    top += 0.6;
    const z = edge - 2.5 - 1.5;
    add(i % 2 ? 2 : -2, top, z, 3, 3, RAINBOW[i % 7]);
    edge = z - 1.5;
  }
  checkpoint();

  // 2: Lava-Hürden
  {
    const len = 26, zc = edge - 2 - len / 2;
    add(0, top, zc, 5, len, '#90caf9');
    for (let i = 0; i < 4; i++) parts.push(P(0, top + 0.35, edge - 2 - 5 - i * 5.5, 5, 0.7, 1.2, '#ff3d00', { k: 'lava' }));
    edge = zc - len / 2;
  }
  checkpoint(2);

  // 3: Wackelplattformen
  for (let i = 0; i < 3; i++) {
    const z = edge - 2.5 - 1.75;
    add(0, top, z, 3.5, 3.5, RAINBOW[(i * 2) % 7], { m: { type: 'line', ax: 'x', amp: 4, speed: 1.1, phase: i * 1.6 } });
    edge = z - 1.75;
  }
  checkpoint(2.5);

  // 4: Trampoline nach oben
  for (let i = 0; i < 2; i++) {
    const z = edge - 2.5 - 1.5;
    add(0, top, z, 3, 3, '#00e5ff', { k: 'bounce' }, 0.6);
    edge = z - 1.5;
    top += 5;
    const z2 = edge - 1.5 - 3;
    add(0, top, z2, 6, 6, i ? '#ffb74d' : '#ffd54f');
    edge = z2 - 3;
  }
  checkpoint(2.5);

  // 5: Balken
  for (let i = 0; i < 4; i++) {
    const z = edge - 2 - 4;
    add(i % 2 ? 1.6 : -1.6, top, z, 1.4, 8, RAINBOW[(i + 3) % 7]);
    edge = z - 4;
  }
  checkpoint(2);

  // 6: Wendeltreppe
  {
    const R = 5, cz = edge - 2 - 1.2 - R;
    parts.push(P(0, top + 5, cz, 3.6, 12, 3.6, '#b39ddb'));
    const steps = 19;
    for (let i = 0; i < steps; i++) {
      const a = (i * 3 * Math.PI) / (steps - 1);
      top += 0.55;
      add(Math.sin(a) * R, top, cz + Math.cos(a) * R, 2.4, 2.4, RAINBOW[i % 7]);
    }
    edge = cz - R - 1.2;
  }
  checkpoint(2.5);

  // 7: Schwebende Wolken (auf und ab)
  for (let i = 0; i < 3; i++) {
    const z = edge - 3 - 2;
    add(0, top, z, 4, 4, '#ffffff', { m: { type: 'line', ax: 'y', amp: 1.5, speed: 1.4, phase: i * 2 } });
    edge = z - 2;
  }
  checkpoint(3);

  // 8: Mini-Würfel
  for (let i = 0; i < 5; i++) {
    top += 0.4;
    const z = edge - 2.5 - 1;
    add((i % 2 ? 1 : -1) * 1.5, top, z, 2, 2, RAINBOW[i % 7]);
    edge = z - 1;
  }

  // Ziel
  const gz = edge - 3 - 6;
  add(0, top, gz, 12, 12, '#ffd700', { k: 'goal' });
  parts.push(P(0, top + 2, gz - 4, 1, 4, 1, '#ffca28', { k: 'deco' }));
  clouds(parts, 3, 30, 260, -10, 40);

  return {
    name: 'Regenbogen-Obby', sky: '#9fd8ff', spawn: [0, 0, 0], killY: -25, parts, stages: stage,
    goal: [0, top, gz],
  };
}

// ---------- Münzjagd ----------
function house(parts, x, z, c) {
  const s = x < 0 ? 1 : -1; // Kisten zur Mitte hin
  parts.push(P(x, 2.5, z, 8, 5, 8, c));
  parts.push(P(x, 5.5, z, 9, 1, 9, '#795548', { spot: true }));
  parts.push(P(x, 6.5, z, 6, 1, 6, '#8d6e63', { spot: true }));
  parts.push(P(x, 2.2, z + 4.05, 1.6, 2.6, 0.2, '#5d4037', { k: 'deco' }));
  parts.push(P(x + s * 5.5, 0.75, z + 3, 2, 1.5, 2, '#ffcc80', { spot: true }));
  parts.push(P(x + s * 5.5, 1.5, z + 1, 2, 3, 2, '#ffb74d', { spot: true }));
  parts.push(P(x + s * 5.5, 2.25, z - 1, 2, 4.5, 2, '#ffa726', { spot: true }));
}

function makeCoins() {
  const parts = [];
  parts.push(P(0, -1, 0, 90, 2, 90, '#7cb342', { k: 'ground' }));
  parts.push(P(0, -3, 0, 500, 1, 500, '#4fc3f7', { k: 'water' }));
  house(parts, -22, -20, '#ef5350');
  house(parts, 22, -20, '#42a5f5');
  house(parts, -22, 22, '#ab47bc');
  house(parts, 22, 22, '#ffa726');
  const hill = ['#8bc34a', '#9ccc65', '#aed581', '#c5e1a5'];
  for (let i = 0; i < 4; i++) {
    const s = 16 - i * 4;
    parts.push(P(0, i * 1.5 + 0.75, 0, s, 1.5, s, hill[i], { spot: true }));
  }
  for (const sx of [-1, 1]) {
    parts.push(P(sx * 32, 5.5, 0, 5, 11, 5, '#bdbdbd', { spot: true }));
    stairs(parts, sx * 32, 2.5, 0, 1, 11, 3, '#e0e0e0', 0.5, 1.2);
  }
  parts.push(P(0, 10.75, 0, 59, 0.5, 3, '#8d6e63', { spot: true }));
  const r = rng(11);
  for (let i = 0; i < 14; i++) {
    const x = (r() - 0.5) * 80, z = (r() - 0.5) * 80;
    if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
    if ((Math.abs(Math.abs(x) - 22) < 9 && Math.abs(Math.abs(z) - 21) < 9) || Math.abs(Math.abs(x) - 32) < 5) continue;
    tree(parts, x, z, 0, { spot: true });
  }

  // Münz-Plätze berechnen
  const spots = [];
  const solid = parts.filter(p => !p.k || p.k === undefined);
  const free = (x, y, z) => !solid.some(p => Math.abs(p.x - x) < p.w / 2 + 0.6 && Math.abs(p.z - z) < p.d / 2 + 0.6 && y > p.y - p.h / 2 - 0.5 && y < p.y + p.h / 2 + 1.5);
  const sr = rng(23);
  for (const p of parts) {
    if (!p.spot) continue;
    const top = p.y + p.h / 2;
    const n = Math.max(1, Math.min(5, Math.floor((p.w * p.d) / 30)));
    for (let i = 0; i < n; i++) {
      const x = p.x + (sr() - 0.5) * Math.max(0, p.w - 1.6);
      const z = p.z + (sr() - 0.5) * Math.max(0, p.d - 1.6);
      if (free(x, top + 1.2, z)) spots.push([+x.toFixed(2), +(top + 1.2).toFixed(2), +z.toFixed(2)]);
    }
  }
  for (let i = 0; i < 400 && spots.length < 120; i++) {
    const x = (sr() - 0.5) * 84, z = (sr() - 0.5) * 84;
    if (free(x, 1.2, z)) spots.push([+x.toFixed(2), 1.2, +z.toFixed(2)]);
  }
  clouds(parts, 5, 20, 300, 25, 45);
  return { name: 'Münzjagd', sky: '#87ceeb', spawn: [0, 0, 14], killY: -15, parts, coinSpots: spots };
}

// ---------- Fangis ----------
function makeTag() {
  const parts = [];
  const S = 64;
  parts.push(P(0, -1, 0, S, 2, S, '#ffe082', { k: 'ground' }));
  const wc = '#ce93d8';
  parts.push(P(0, 1.5, -S / 2 - 0.5, S + 2, 3, 1, wc));
  parts.push(P(0, 1.5, S / 2 + 0.5, S + 2, 3, 1, wc));
  parts.push(P(-S / 2 - 0.5, 1.5, 0, 1, 3, S, wc));
  parts.push(P(S / 2 + 0.5, 1.5, 0, 1, 3, S, wc));
  // Mittelburg mit Treppen
  parts.push(P(0, 1.5, 0, 10, 3, 10, '#7e57c2'));
  stairs(parts, 0, 5, 0, 1, 3, 3, '#9575cd');
  stairs(parts, 0, -5, 0, -1, 3, 3, '#9575cd');
  // Brücken zu Türmen
  for (const sx of [-1, 1]) {
    parts.push(P(sx * 20, 2.5, 0, 6, 5, 6, '#5c6bc0'));
    parts.push(P(sx * 11.5, 2.75, 0, 11, 0.5, 2.5, '#8d6e63'));
    stairs(parts, sx * 20, 3, 0, 1, 5, 2.5, '#7986cb');
  }
  // Säulen und Kisten
  const r = rng(42);
  for (let i = 0; i < 22; i++) {
    const x = (r() - 0.5) * (S - 8), z = (r() - 0.5) * (S - 8);
    if (Math.abs(x) < 26 && Math.abs(z) < 11) continue;
    const tall = r() < 0.4;
    const h = tall ? 4 : 1.5, w = tall ? 1.6 : 2.4;
    parts.push(P(x, h / 2, z, w, h, w, RAINBOW[i % 7]));
  }
  // Tunnel
  parts.push(P(0, 1.5, 22, 2, 3, 8, '#4db6ac'));
  parts.push(P(5, 1.5, 22, 2, 3, 8, '#4db6ac'));
  parts.push(P(2.5, 3.25, 22, 7, 0.5, 8, '#26a69a'));
  parts.push(P(0, 1.5, -22, 8, 3, 2, '#4db6ac'));
  parts.push(P(0, 1.5, -27, 8, 3, 2, '#4db6ac'));
  parts.push(P(0, 3.25, -24.5, 8, 0.5, 7, '#26a69a'));
  clouds(parts, 9, 16, 300, 30, 50);
  return { name: 'Fangis', sky: '#b3e5fc', spawn: [0, 3, 0], killY: -20, parts };
}

// ---------- Spielplatz ----------
function makeHangout() {
  const parts = [];
  const S = 80;
  parts.push(P(0, -1, 0, S, 2, S, '#81c784', { k: 'ground' }));
  parts.push(P(0, -3, 0, 500, 1, 500, '#4fc3f7', { k: 'water' }));
  // Zaun
  const fc = '#ffffff';
  parts.push(P(0, 0.6, -S / 2 + 0.5, S, 1.2, 0.4, fc));
  parts.push(P(0, 0.6, S / 2 - 0.5, S, 1.2, 0.4, fc));
  parts.push(P(-S / 2 + 0.5, 0.6, 0, 0.4, 1.2, S, fc));
  parts.push(P(S / 2 - 0.5, 0.6, 0, 0.4, 1.2, S, fc));
  // Weg
  parts.push(P(0, 0.02, 0, 4, 0.04, S - 2, '#e0c9a6', { k: 'deco' }));
  parts.push(P(0, 0.02, 0, S - 2, 0.04, 4, '#e0c9a6', { k: 'deco' }));
  // Tanzfläche
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    parts.push(P(-19 + i * 2, 0.1, -19 + j * 2, 1.96, 0.2, 1.96, RAINBOW[(i + j) % 7], { k: 'dance' }));
  }
  // Trampoline
  for (let i = 0; i < 3; i++) parts.push(P(10 + i * 4.5, 0.2, -10, 3, 0.4, 3, '#00e5ff', { k: 'bounce' }));
  // Wolkenweg nach oben
  parts.push(P(15, 0.2, -20, 3, 0.4, 3, '#00e5ff', { k: 'bounce' }));
  parts.push(P(15, 5.5, -26, 6, 1, 6, '#ffffff'));
  parts.push(P(16.5, 6.2, -27.5, 2.4, 0.4, 2.4, '#00e5ff', { k: 'bounce' }));
  parts.push(P(15, 11.5, -33, 6, 1, 6, '#ffffff'));
  parts.push(P(16.5, 12.2, -34.5, 2.4, 0.4, 2.4, '#00e5ff', { k: 'bounce' }));
  parts.push(P(15, 17.5, -38, 8, 1, 4, '#fff59d', { k: 'goal' }));
  // Karussell
  parts.push(P(-15, 0.5, 15, 3, 1, 3, '#ff7043'));
  parts.push(P(-15, 3, 15, 0.6, 4, 0.6, '#ffccbc'));
  parts.push(P(-15, 5.2, 15, 7, 0.4, 7, '#ff8a65', { k: 'deco' }));
  for (let i = 0; i < 6; i++) {
    parts.push(P(-15 + 5, 0.3, 15, 2.2, 0.6, 2.2, RAINBOW[i], { m: { type: 'circle', cx: -15, cz: 15, r: 5, speed: 0.7, phase: (i * Math.PI) / 3 } }));
  }
  // Turm mit Treppe und Rutschbahn
  parts.push(P(15, 3, 15, 4, 6, 4, '#5c6bc0'));
  parts.push(P(15, 7.5, 15, 4, 0.4, 4, '#ef5350', { k: 'deco' }));
  stairs(parts, 15, 17, 0, 1, 6, 3, '#7986cb');
  stairs(parts, 13, 15, -1, 0, 6, 2.4, '#ffeb3b', 0.25, 0.6);
  // Sandkasten
  parts.push(P(15, 0.15, 3, 8, 0.3, 8, '#ffe0b2'));
  parts.push(P(15, 0.4, -1.2, 8.4, 0.8, 0.4, '#a1887f'));
  parts.push(P(15, 0.4, 7.2, 8.4, 0.8, 0.4, '#a1887f'));
  parts.push(P(10.8, 0.4, 3, 0.4, 0.8, 8.4, '#a1887f'));
  parts.push(P(19.2, 0.4, 3, 0.4, 0.8, 8.4, '#a1887f'));
  // Teich (nur Deko)
  parts.push(P(-20, 0.03, -2, 10, 0.06, 7, '#4fc3f7', { k: 'deco' }));
  // Bänke
  for (const [x, z] of [[-6, 6], [6, 6], [-6, -6], [6, -6]]) {
    parts.push(P(x, 0.5, z, 3, 0.3, 1, '#8d6e63'));
    parts.push(P(x - 1.2, 0.25, z, 0.3, 0.5, 0.8, '#6d4c41'));
    parts.push(P(x + 1.2, 0.25, z, 0.3, 0.5, 0.8, '#6d4c41'));
  }
  // Bäume und Blumen
  for (const [x, z] of [[-32, -32], [-32, 32], [32, 32], [-30, 0], [30, -5], [0, 32], [-8, -32], [25, 30], [-25, 28]]) tree(parts, x, z);
  const r = rng(77);
  const flower = ['#f06292', '#fff176', '#ba68c8', '#ff8a65', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const x = (r() - 0.5) * 74, z = (r() - 0.5) * 74;
    if (Math.abs(x) < 3 || Math.abs(z) < 3) continue;
    parts.push(P(x, 0.25, z, 0.1, 0.5, 0.1, '#388e3c', { k: 'deco' }));
    parts.push(P(x, 0.55, z, 0.35, 0.25, 0.35, flower[i % flower.length], { k: 'deco' }));
  }
  clouds(parts, 13, 20, 300, 30, 50);
  return { name: 'Spielplatz', sky: '#8fd3fe', spawn: [0, 0, 8], killY: -15, parts };
}

// ---------- Bauwelt ----------
function makeBuild() {
  const parts = [];
  const size = 96;
  parts.push(P(0, -1, 0, size, 2, size, '#4caf50', { k: 'baseplate' }));
  parts.push(P(0, -3, 0, 500, 1, 500, '#4fc3f7', { k: 'water' }));
  clouds(parts, 17, 20, 300, 35, 55);
  return { name: 'Bauwelt', sky: '#87ceeb', spawn: [0, 0, 0], killY: -15, parts };
}

// ---------- Hana-Stadt (Lebenswelt) ----------
const fwd = r => [Math.round(Math.sin(r)), Math.round(Math.cos(r))];

function building(parts, cx, cz, w, d, floor, wall, door, label) {
  const H = 4, T = 0.4, dw = 3.4;
  parts.push(P(cx, 0.05, cz, w, 0.1, d, floor));
  const back = door === 's' ? cz - d / 2 : cz + d / 2;
  const front = door === 's' ? cz + d / 2 : cz - d / 2;
  parts.push(P(cx, H / 2, back, w + T, H, T, wall));
  parts.push(P(cx - w / 2, H / 2, cz, T, H, d, wall));
  parts.push(P(cx + w / 2, H / 2, cz, T, H, d, wall));
  const seg = (w - dw) / 2;
  parts.push(P(cx - dw / 2 - seg / 2, H / 2, front, seg, H, T, wall));
  parts.push(P(cx + dw / 2 + seg / 2, H / 2, front, seg, H, T, wall));
  parts.push(P(cx, H + 0.1, back, w + 0.8, 0.2, 0.9, '#ffffff', { k: 'deco' }));
  parts.push(P(cx, H + 1.0, front, 8, 1.6, 0.3, '#ffffff', { k: 'deco', label, face: door === 's' ? 1 : -1 }));
}
function chair(parts, x, z, r, c) {
  const [fx, fz] = fwd(r);
  parts.push(P(x, 0.45, z, 1.1, 0.9, 1.1, c, { act: 'sit', rot: r }));
  parts.push(P(x - fx * 0.5, 1.4, z - fz * 0.5, fx ? 0.15 : 1.1, 1.0, fz ? 0.15 : 1.1, c, { k: 'deco' }));
}
function sofa(parts, x, z, r, c, len = 4) {
  const [fx, fz] = fwd(r);
  const w = fx ? 1.4 : len, d = fz ? 1.4 : len;
  parts.push(P(x, 0.4, z, w, 0.8, d, c, { act: 'sit', rot: r }));
  parts.push(P(x - fx * 0.6, 1.25, z - fz * 0.6, fx ? 0.3 : len, 0.9, fz ? 0.3 : len, c, { k: 'deco' }));
}
function bed(parts, x, z, c) {
  parts.push(P(x, 0.45, z, 2.6, 0.9, 3.8, '#ffffff', { act: 'sleep', rot: 0 }));
  parts.push(P(x, 0.94, z + 0.5, 2.66, 0.1, 2.8, c, { k: 'deco' }));
  parts.push(P(x, 1.05, z - 1.4, 1.8, 0.28, 0.7, '#fff8e1', { k: 'deco' }));
  parts.push(P(x, 1.3, z - 2.0, 2.7, 1.6, 0.2, '#8d6e63', { k: 'deco' }));
}

function makeTown() {
  const parts = [];
  const items = [];
  const it = (key, x, y, z) => items.push([key, x, y, z]);
  parts.push(P(0, -1, 0, 120, 2, 120, '#9ccc65', { k: 'ground' }));
  parts.push(P(0, -3, 0, 500, 1, 500, '#4fc3f7', { k: 'water' }));
  // Strasse
  parts.push(P(0, 0.02, 0, 118, 0.04, 8, '#78909c', { k: 'deco' }));
  for (let x = -54; x <= 54; x += 6) parts.push(P(x, 0.05, 0, 3, 0.02, 0.3, '#ffffff', { k: 'deco' }));
  parts.push(P(0, 0.04, -5.5, 118, 0.08, 3, '#e0e0e0', { k: 'deco' }));
  parts.push(P(0, 0.04, 5.5, 118, 0.08, 3, '#e0e0e0', { k: 'deco' }));
  for (let i = 0; i < 6; i++) parts.push(P(-17, 0.05, -3 + i * 1.2, 4, 0.02, 0.6, '#ffffff', { k: 'deco' }));
  for (const x of [-50, -17, 17, 50]) for (const z of [-6.5, 6.5]) {
    parts.push(P(x, 2, z, 0.25, 4, 0.25, '#607d8b'));
    parts.push(P(x, 4.1, z, 0.8, 0.3, 0.8, '#fff59d', { k: 'deco' }));
  }

  // --- Mein Haus ---
  building(parts, -34, -18, 26, 20, '#ffe0b2', '#f8bbd0', 's', 'Mein Haus 🏠');
  parts.push(P(-45.6, 1.4, -27.1, 1.6, 2.8, 1.2, '#e3f2fd', { act: 'menu', title: '🧊 Kühlschrank', menu: ['apple', 'banana', 'strawberry', 'carrot', 'juice', 'icecream'] }));
  parts.push(P(-43.2, 0.6, -27.1, 3, 1.2, 1.2, '#fafafa'));
  parts.push(P(-40.9, 0.6, -27.1, 1.6, 1.2, 1.2, '#455a64', { act: 'menu', title: '🍳 Kochen', menu: ['pizza', 'burger', 'cake', 'cookie', 'croissant', 'donut'] }));
  parts.push(P(-41.25, 1.22, -27.1, 0.5, 0.04, 0.5, '#ff7043', { k: 'deco' }));
  parts.push(P(-40.55, 1.22, -27.1, 0.5, 0.04, 0.5, '#ff7043', { k: 'deco' }));
  parts.push(P(-42, 0.55, -21, 3.2, 1.1, 2, '#bcaaa4'));
  chair(parts, -44.3, -21, Math.PI / 2, '#ffab91');
  chair(parts, -39.7, -21, -Math.PI / 2, '#ffab91');
  it('apple', -42.6, 1.1, -21); it('juice', -41.4, 1.1, -21.3);
  parts.push(P(-33, 0.4, -27.3, 3.4, 0.8, 0.8, '#8d6e63'));
  parts.push(P(-33, 1.75, -27.5, 3, 1.7, 0.2, '#263238', { act: 'tv', key: 'tv1' }));
  sofa(parts, -33, -21, Math.PI, '#9575cd', 4.4);
  parts.push(P(-33, 0.12, -24, 6, 0.02, 4, '#f48fb1', { k: 'deco' }));
  parts.push(P(-37.5, 0.15, -26.8, 0.8, 0.3, 0.8, '#757575', { act: 'lamp', key: 'lamp1' }));
  parts.push(P(-37.5, 1.3, -26.8, 0.15, 2.2, 0.15, '#9e9e9e', { k: 'deco' }));
  parts.push(P(-37.5, 2.6, -26.8, 1, 0.6, 1, '#fff59d', { k: 'deco', glow: 'lamp1' }));
  bed(parts, -24.5, -23.5, '#90caf9');
  it('teddy', -24.5, 0.99, -22.5);
  parts.push(P(-22.0, 1.5, -15.5, 1.4, 3, 2.6, '#ffcc80', { act: 'wardrobe', title: '👗 Kleiderschrank' }));
  parts.push(P(-44.8, 0.45, -9.9, 3.4, 0.9, 1.8, '#ffffff', { act: 'bath', rot: Math.PI / 2 }));
  parts.push(P(-44.8, 0.92, -9.9, 3.0, 0.06, 1.4, '#81d4fa', { k: 'deco' }));
  parts.push(P(-41, 0.15, -9.6, 2, 0.1, 2, '#b3e5fc', { act: 'shower' }));
  parts.push(P(-41, 2, -10.55, 0.1, 3.8, 0.1, '#9e9e9e', { k: 'deco' }));
  parts.push(P(-41, 3.4, -10.2, 0.7, 0.1, 0.7, '#9e9e9e', { k: 'deco' }));
  parts.push(P(-25, 0.5, -10, 2, 1, 1.2, '#ef9a9a', { act: 'menu', title: '🧸 Spielzeugkiste', menu: ['ball', 'teddy', 'duck', 'balloon', 'gift'] }));
  it('flower', -22.5, 0.1, -9.5); it('cat', -30, 0.1, -12);

  // --- Café ---
  building(parts, 0, -18, 22, 20, '#fff3e0', '#bcaaa4', 's', 'Café ☕');
  parts.push(P(0, 0.6, -25, 10, 1.2, 1.4, '#a1887f', { act: 'menu', title: '☕ Bestellen', menu: ['croissant', 'donut', 'cookie', 'cake', 'icecream', 'juice', 'pizza'] }));
  parts.push(P(-3, 1.5, -25.2, 3, 0.6, 1, '#e1f5fe', { k: 'deco' }));
  parts.push(P(0, 2.5, -27.4, 12, 0.3, 0.8, '#8d6e63', { k: 'deco' }));
  for (let i = 0; i < 6; i++) parts.push(P(-5 + i * 2, 2.85, -27.4, 0.5, 0.4, 0.5, RAINBOW[i], { k: 'deco' }));
  for (const [x, z] of [[-6, -14], [6, -14], [-6, -19.5], [6, -19.5]]) {
    parts.push(P(x, 0.55, z, 1.8, 1.1, 1.8, '#ffffff'));
    chair(parts, x - 1.6, z, Math.PI / 2, '#f48fb1');
    chair(parts, x + 1.6, z, -Math.PI / 2, '#f48fb1');
  }
  it('donut', 6, 1.1, -14); it('cookie', -6, 1.1, -19.5);

  // --- Friseur ---
  building(parts, 34, -18, 22, 20, '#f3e5f5', '#ce93d8', 's', 'Friseur ✂️');
  for (const x of [27, 34, 41]) {
    parts.push(P(x, 0.5, -24, 1.3, 1.0, 1.3, '#7b1fa2', { act: 'salon', rot: 0 }));
    parts.push(P(x, 1.5, -24.6, 1.3, 1.2, 0.2, '#7b1fa2', { k: 'deco' }));
    parts.push(P(x, 2.4, -27.7, 2, 2.2, 0.1, '#e1f5fe', { k: 'deco' }));
  }
  sofa(parts, 42, -13, -Math.PI / 2, '#f8bbd0', 4);
  parts.push(P(26, 0.6, -12, 2, 1.2, 3, '#ba68c8'));
  for (let i = 0; i < 4; i++) parts.push(P(26, 1.4, -13 + i * 0.7, 0.3, 0.5, 0.3, RAINBOW[i + 2], { k: 'deco' }));

  // --- Kleiderladen ---
  building(parts, -34, 18, 26, 20, '#e8f5e9', '#80cbc4', 'n', 'Kleiderladen 👗');
  parts.push(P(-34, 0.6, 25.5, 6, 1.2, 1.4, '#4db6ac', { act: 'wardrobe', title: '👗 Kleider anprobieren' }));
  for (const x of [-43, -25]) {
    parts.push(P(x, 2.4, 18, 0.12, 0.12, 8, '#9e9e9e', { k: 'deco' }));
    parts.push(P(x, 1.2, 14, 0.12, 2.4, 0.12, '#9e9e9e', { k: 'deco' }));
    parts.push(P(x, 1.2, 22, 0.12, 2.4, 0.12, '#9e9e9e', { k: 'deco' }));
    for (let i = 0; i < 7; i++) parts.push(P(x, 1.7, 15 + i, 0.9, 1.2, 0.2, RAINBOW[(i + (x > -34 ? 3 : 0)) % 7], { k: 'deco' }));
  }
  parts.push(P(-46.7, 2, 18, 0.1, 2.8, 2, '#e1f5fe', { k: 'deco' }));
  parts.push(P(-45.5, 0.15, 18, 2, 0.1, 2, '#ffcdd2', { act: 'wardrobe', title: '🪞 Spiegel – Umziehen' }));

  // --- Tierhandlung ---
  building(parts, 0, 18, 22, 20, '#fffde7', '#ffcc80', 'n', 'Tierhandlung 🐾');
  parts.push(P(0, 0.6, 25.5, 8, 1.2, 1.4, '#ffb74d', { act: 'menu', title: '🐾 Haustier holen', menu: ['cat', 'dog', 'bunny', 'chick'] }));
  parts.push(P(8.5, 0.6, 18, 1.4, 1.2, 4, '#90caf9', { act: 'menu', title: '🎾 Spielzeug', menu: ['ball', 'duck', 'balloon', 'teddy', 'gift'] }));
  for (const [x, z, c] of [[-8, 20, '#ef9a9a'], [-8, 15, '#a5d6a7'], [-4, 24, '#ce93d8']]) {
    parts.push(P(x, 0.2, z, 2.2, 0.2, 2.2, c, { k: 'deco' }));
  }
  it('dog', -8, 0.3, 20); it('bunny', -8, 0.3, 15); it('chick', 4, 0.1, 13);

  // --- Park ---
  parts.push(P(34, 0.03, 19, 24, 0.04, 22, '#a5d6a7', { k: 'deco' }));
  parts.push(P(38, 0.06, 24, 8, 0.04, 5, '#4fc3f7', { k: 'deco' }));
  parts.push(P(34, 3, 8.6, 6, 1.4, 0.3, '#ffffff', { k: 'deco', label: 'Park 🌳', face: -1 }));
  parts.push(P(31.2, 1.2, 8.6, 0.2, 2.4, 0.2, '#8d6e63', { k: 'deco' }));
  parts.push(P(36.8, 1.2, 8.6, 0.2, 2.4, 0.2, '#8d6e63', { k: 'deco' }));
  sofa(parts, 27, 20, Math.PI / 2, '#8d6e63', 3);
  sofa(parts, 34, 28, Math.PI, '#8d6e63', 3);
  parts.push(P(30, 0.2, 13, 3, 0.4, 3, '#00e5ff', { k: 'bounce' }));
  parts.push(P(43, 0.7, 15, 3, 1.4, 1.6, '#f8bbd0', { act: 'menu', title: '🍦 Glace-Stand', menu: ['icecream', 'juice', 'strawberry'] }));
  parts.push(P(43, 1.8, 15.6, 0.15, 3.6, 0.15, '#ffffff', { k: 'deco' }));
  parts.push(P(43, 3.6, 15.6, 4, 0.3, 4, '#ff80ab', { k: 'deco' }));
  tree(parts, 25, 28); tree(parts, 45, 25); tree(parts, 45, 9.5);
  const r = rng(99);
  const fl = ['#f06292', '#fff176', '#ba68c8', '#ff8a65', '#ffffff'];
  for (let i = 0; i < 26; i++) {
    const x = 24 + r() * 20, z = 10 + r() * 18;
    if (Math.abs(x - 38) < 5 && Math.abs(z - 24) < 3.5) continue;
    parts.push(P(x, 0.25, z, 0.1, 0.5, 0.1, '#388e3c', { k: 'deco' }));
    parts.push(P(x, 0.55, z, 0.35, 0.25, 0.35, fl[i % fl.length], { k: 'deco' }));
  }
  it('ball', 34, 0.1, 18);
  // Bäume am Rand
  for (const [x, z] of [[-55, -20], [-55, 20], [55, -20], [55, 20], [-17, -20], [17, -20], [-17, 22], [17, 24], [-50, 40], [0, 45], [40, 45], [-30, -45], [30, -45]]) tree(parts, x, z);
  clouds(parts, 21, 20, 300, 30, 50);

  return { name: 'Hana-Stadt', sky: '#a7dcff', spawn: [0, 0, 0], killY: -15, parts, items, cam: { pitch: 0.68, dist: 15 } };
}

export const WORLDS = {
  town: makeBigTown(),
  obby: makeObby(),
  coins: makeCoins(),
  tag: makeTag(),
  hangout: makeHangout(),
  build: makeBuild(),
};
