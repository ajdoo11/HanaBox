// Niedliche 3D-Modelle für Gegenstände in der Hana-Stadt. Ursprung = Unterkante.
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { ITEM_TYPES } from './shared.js';
import { mergeChildren } from './merge.js';

const G = {
  sphere: new THREE.SphereGeometry(1, 12, 9),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  cone: new THREE.ConeGeometry(1, 1, 16),
  torus: new THREE.TorusGeometry(1, 0.42, 10, 20),
  arc: new THREE.TorusGeometry(1, 0.3, 8, 16, Math.PI * 0.75),
};
const matCache = new Map();
function mat(c, emissive) {
  const k = c + (emissive || '');
  if (!matCache.has(k)) matCache.set(k, toonMat(emissive ? { color: c, emissive, emissiveIntensity: 0.4 } : { color: c }));
  return matCache.get(k);
}

function add(group, geo, c, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(G[geo], mat(c));
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  group.add(m);
  return m;
}

function eyes(g, y, z, spread = 0.09, size = 0.04) {
  add(g, 'sphere', '#212121', size, size, size, -spread, y, z);
  add(g, 'sphere', '#212121', size, size, size, spread, y, z);
}

const BUILDERS = {
  apple: g => { add(g, 'sphere', '#e53935', 0.26, 0.24, 0.26, 0, 0.24, 0); add(g, 'box', '#6d4c41', 0.03, 0.12, 0.03, 0, 0.52, 0); add(g, 'sphere', '#43a047', 0.08, 0.03, 0.05, 0.07, 0.52, 0); },
  banana: g => { add(g, 'arc', '#fdd835', 0.25, 0.25, 0.3, 0, 0.12, 0, Math.PI / 2, 0, Math.PI * 1.1); },
  strawberry: g => { add(g, 'cone', '#e53935', 0.18, 0.32, 0.18, 0, 0.18, 0, Math.PI); add(g, 'cyl', '#43a047', 0.17, 0.05, 0.17, 0, 0.35, 0); },
  carrot: g => { add(g, 'cone', '#fb8c00', 0.1, 0.5, 0.1, 0, 0.1, 0, Math.PI / 2, 0, 0); add(g, 'cone', '#43a047', 0.06, 0.2, 0.06, 0, 0.1, -0.33, -Math.PI / 2, 0, 0); },
  pizza: g => {
    add(g, 'cyl', '#ffb74d', 0.42, 0.06, 0.42, 0, 0.03, 0);
    add(g, 'cyl', '#fdd835', 0.37, 0.02, 0.37, 0, 0.07, 0);
    for (const [x, z] of [[0.15, 0.1], [-0.15, 0.12], [0, -0.18], [-0.1, -0.05], [0.18, -0.1]]) add(g, 'cyl', '#d32f2f', 0.06, 0.02, 0.06, x, 0.09, z);
  },
  burger: g => {
    add(g, 'cyl', '#ffb74d', 0.26, 0.08, 0.26, 0, 0.04, 0);
    add(g, 'cyl', '#6d4c41', 0.27, 0.08, 0.27, 0, 0.12, 0);
    add(g, 'cyl', '#7cb342', 0.29, 0.03, 0.29, 0, 0.18, 0);
    add(g, 'sphere', '#ffb74d', 0.26, 0.14, 0.26, 0, 0.2, 0);
  },
  cake: g => {
    add(g, 'cyl', '#f8bbd0', 0.36, 0.3, 0.36, 0, 0.15, 0);
    add(g, 'cyl', '#ffffff', 0.37, 0.06, 0.37, 0, 0.31, 0);
    add(g, 'cyl', '#81d4fa', 0.025, 0.18, 0.025, 0, 0.43, 0);
    const f = add(g, 'sphere', '#ffeb3b', 0.03, 0.05, 0.03, 0, 0.55, 0); f.material = mat('#ffeb3b', '#ff9800');
    for (let i = 0; i < 6; i++) add(g, 'sphere', '#e53935', 0.04, 0.04, 0.04, Math.cos(i) * 0.28, 0.36, Math.sin(i) * 0.28);
  },
  cookie: g => { add(g, 'cyl', '#c68642', 0.25, 0.05, 0.25, 0, 0.025, 0); for (const [x, z] of [[0.1, 0.05], [-0.08, 0.1], [0, -0.12], [-0.12, -0.05]]) add(g, 'sphere', '#4e342e', 0.035, 0.02, 0.035, x, 0.055, z); },
  donut: g => { add(g, 'torus', '#ffcc80', 0.16, 0.16, 0.16, 0, 0.07, 0, Math.PI / 2); add(g, 'torus', '#f06292', 0.165, 0.165, 0.1, 0, 0.1, 0, Math.PI / 2); },
  croissant: g => { add(g, 'arc', '#ffb74d', 0.22, 0.22, 0.5, 0, 0.08, 0.05, Math.PI / 2, 0, Math.PI * 1.12); },
  icecream: g => {
    add(g, 'cone', '#d7a86e', 0.12, 0.3, 0.12, 0, 0.15, 0, Math.PI);
    add(g, 'sphere', '#f48fb1', 0.15, 0.14, 0.15, 0, 0.36, 0);
    add(g, 'sphere', '#fff59d', 0.12, 0.11, 0.12, 0, 0.5, 0);
    add(g, 'sphere', '#e53935', 0.04, 0.04, 0.04, 0, 0.62, 0);
  },
  juice: g => { add(g, 'box', '#ffa726', 0.22, 0.36, 0.16, 0, 0.18, 0); add(g, 'box', '#ffffff', 0.16, 0.12, 0.17, 0, 0.2, 0); add(g, 'box', '#e91e63', 0.02, 0.2, 0.02, 0.05, 0.44, 0); },
  ball: g => {
    add(g, 'sphere', '#ffffff', 0.3, 0.3, 0.3, 0, 0.3, 0);
    for (const [x, y, z] of [[0, 0.6, 0], [0.3, 0.3, 0], [-0.3, 0.3, 0], [0, 0.3, 0.3], [0, 0.3, -0.3], [0, 0, 0]]) add(g, 'sphere', '#e53935', 0.09, 0.09, 0.09, x * 0.92, y * 0.92 + 0.024, z * 0.92);
  },
  teddy: g => {
    const c = '#a1887f';
    add(g, 'sphere', c, 0.22, 0.26, 0.2, 0, 0.26, 0);
    add(g, 'sphere', c, 0.18, 0.17, 0.17, 0, 0.62, 0);
    add(g, 'sphere', c, 0.07, 0.07, 0.05, -0.14, 0.76, 0);
    add(g, 'sphere', c, 0.07, 0.07, 0.05, 0.14, 0.76, 0);
    add(g, 'sphere', '#d7ccc8', 0.08, 0.06, 0.06, 0, 0.58, 0.14);
    eyes(g, 0.66, 0.15, 0.07, 0.025);
    add(g, 'sphere', c, 0.08, 0.08, 0.08, -0.12, 0.06, 0.08);
    add(g, 'sphere', c, 0.08, 0.08, 0.08, 0.12, 0.06, 0.08);
    add(g, 'sphere', c, 0.07, 0.07, 0.07, -0.22, 0.33, 0.04);
    add(g, 'sphere', c, 0.07, 0.07, 0.07, 0.22, 0.33, 0.04);
  },
  balloon: g => { add(g, 'sphere', '#ff4081', 0.3, 0.36, 0.3, 0, 1.4, 0); add(g, 'box', '#ffffff', 0.01, 1.05, 0.01, 0, 0.53, 0); add(g, 'cone', '#ff4081', 0.05, 0.08, 0.05, 0, 1.03, 0, Math.PI); },
  gift: g => {
    add(g, 'box', '#ab47bc', 0.5, 0.42, 0.5, 0, 0.21, 0);
    add(g, 'box', '#ffeb3b', 0.52, 0.43, 0.08, 0, 0.215, 0);
    add(g, 'box', '#ffeb3b', 0.08, 0.43, 0.52, 0, 0.215, 0);
    add(g, 'sphere', '#ffeb3b', 0.1, 0.07, 0.1, -0.07, 0.46, 0);
    add(g, 'sphere', '#ffeb3b', 0.1, 0.07, 0.1, 0.07, 0.46, 0);
  },
  flower: g => {
    add(g, 'cyl', '#d7794b', 0.2, 0.35, 0.2, 0, 0.175, 0);
    add(g, 'cyl', '#5d4037', 0.18, 0.02, 0.18, 0, 0.35, 0);
    add(g, 'cyl', '#43a047', 0.025, 0.4, 0.025, 0, 0.55, 0);
    add(g, 'sphere', '#ffeb3b', 0.07, 0.07, 0.07, 0, 0.78, 0);
    for (let i = 0; i < 6; i++) add(g, 'sphere', '#f06292', 0.08, 0.08, 0.05, Math.cos((i / 6) * Math.PI * 2) * 0.12, 0.78 + Math.sin((i / 6) * Math.PI * 2) * 0.12, 0);
    add(g, 'sphere', '#66bb6a', 0.09, 0.03, 0.05, 0.08, 0.5, 0);
  },
};

Object.assign(BUILDERS, {
  cocoa: g => { add(g, 'cyl', '#ffffff', 0.18, 0.32, 0.18, 0, 0.16, 0); add(g, 'cyl', '#6d4c41', 0.16, 0.02, 0.16, 0, 0.32, 0); add(g, 'torus', '#ffffff', 0.08, 0.08, 0.08, 0.2, 0.18, 0, 0, Math.PI / 2); add(g, 'sphere', '#fafafa', 0.1, 0.06, 0.1, 0, 0.35, 0); },
  coconut: g => { add(g, 'sphere', '#6d4c41', 0.25, 0.23, 0.25, 0, 0.23, 0); add(g, 'cyl', '#fafafa', 0.12, 0.02, 0.12, 0, 0.46, 0); add(g, 'box', '#e91e63', 0.02, 0.3, 0.02, 0.05, 0.6, 0); },
  pineapple: g => { add(g, 'sphere', '#fbc02d', 0.2, 0.28, 0.2, 0, 0.28, 0); for (let i = 0; i < 5; i++) add(g, 'cone', '#43a047', 0.06, 0.3, 0.06, Math.cos(i) * 0.06, 0.65, Math.sin(i) * 0.06, 0, 0, (i - 2) * 0.25); },
  mango: g => { add(g, 'sphere', '#ff9800', 0.2, 0.17, 0.26, 0, 0.17, 0); add(g, 'sphere', '#43a047', 0.06, 0.02, 0.09, 0.05, 0.34, 0.05); },
});

Object.assign(BUILDERS, {
  snowball: g => { add(g, 'sphere', '#fafafa', 0.22, 0.21, 0.22, 0, 0.21, 0); add(g, 'sphere', '#e3f2fd', 0.08, 0.06, 0.08, 0.1, 0.36, 0.06); },
  waterballoon: g => { add(g, 'sphere', '#4fc3f7', 0.22, 0.26, 0.22, 0, 0.26, 0); add(g, 'cone', '#29b6f6', 0.05, 0.08, 0.05, 0, 0.55, 0); },
  frisbee: g => { add(g, 'cyl', '#ff7043', 0.32, 0.05, 0.32, 0, 0.03, 0); add(g, 'torus', '#ffccbc', 0.24, 0.24, 0.24, 0, 0.06, 0, Math.PI / 2); },
  kite: g => {
    add(g, 'box', '#ec407a', 0.5, 0.5, 0.03, 0, 0.62, 0, 0, 0, Math.PI / 4);
    add(g, 'box', '#ffeb3b', 0.04, 0.7, 0.04, 0, 0.62, 0.02);
    add(g, 'box', '#ffeb3b', 0.7, 0.04, 0.04, 0, 0.62, 0.02);
    for (let i = 0; i < 3; i++) add(g, 'sphere', ['#42a5f5', '#66bb6a', '#ffa726'][i], 0.05, 0.05, 0.05, 0.05 * i, 0.15 + i * 0.08, 0);
  },
  // Deko aus dem Rucksack-Shop
  sunflower: g => {
    add(g, 'cyl', '#d7794b', 0.2, 0.35, 0.2, 0, 0.175, 0);
    add(g, 'cyl', '#43a047', 0.03, 0.9, 0.03, 0, 0.8, 0);
    add(g, 'sphere', '#66bb6a', 0.12, 0.03, 0.06, 0.1, 0.7, 0);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(g, 'sphere', '#fdd835', 0.09, 0.05, 0.03, Math.cos(a) * 0.2, 1.3 + Math.sin(a) * 0.2, 0.02, 0, 0, a); }
    add(g, 'cyl', '#6d4c41', 0.13, 0.05, 0.13, 0, 1.3, 0.04, Math.PI / 2);
  },
  lantern: g => {
    add(g, 'cyl', '#37474f', 0.12, 0.06, 0.12, 0, 0.03, 0);
    add(g, 'cyl', '#455a64', 0.035, 1.3, 0.035, 0, 0.68, 0);
    const l = add(g, 'sphere', '#fff59d', 0.17, 0.2, 0.17, 0, 1.45, 0); l.material = mat('#fff59d', '#ffca28');
    add(g, 'cone', '#37474f', 0.2, 0.14, 0.2, 0, 1.7, 0);
  },
  snowman: g => {
    add(g, 'sphere', '#fafafa', 0.38, 0.35, 0.38, 0, 0.34, 0);
    add(g, 'sphere', '#fafafa', 0.28, 0.26, 0.28, 0, 0.88, 0);
    add(g, 'sphere', '#fafafa', 0.2, 0.19, 0.2, 0, 1.28, 0);
    eyes(g, 1.34, 0.18, 0.07, 0.03);
    add(g, 'cone', '#fb8c00', 0.04, 0.16, 0.04, 0, 1.28, 0.26, Math.PI / 2);
    add(g, 'torus', '#e53935', 0.18, 0.18, 0.2, 0, 1.1, 0, Math.PI / 2);
    for (const y of [0.8, 0.92, 1.0]) add(g, 'sphere', '#212121', 0.03, 0.03, 0.03, 0, y, 0.27);
    add(g, 'cyl', '#212121', 0.15, 0.2, 0.15, 0, 1.52, 0);
  },
  palm: g => {
    add(g, 'cyl', '#d7794b', 0.22, 0.3, 0.22, 0, 0.15, 0);
    add(g, 'cyl', '#a1887f', 0.05, 1.0, 0.05, 0.04, 0.8, 0, 0, 0, -0.08);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(g, 'sphere', '#43a047', 0.3, 0.03, 0.09, Math.cos(a) * 0.25 + 0.08, 1.25, Math.sin(a) * 0.25, 0, -a, -0.35); }
    add(g, 'sphere', '#6d4c41', 0.06, 0.06, 0.06, 0.12, 1.2, 0.05);
  },
  gnome: g => {
    add(g, 'cyl', '#1e88e5', 0.16, 0.3, 0.16, 0, 0.15, 0);
    add(g, 'sphere', '#ffe0bd', 0.12, 0.12, 0.12, 0, 0.4, 0.02);
    add(g, 'cone', '#fafafa', 0.11, 0.18, 0.06, 0, 0.3, 0.1, Math.PI);
    add(g, 'sphere', '#f48fb1', 0.03, 0.03, 0.03, 0, 0.4, 0.14);
    eyes(g, 0.44, 0.12, 0.05, 0.02);
    add(g, 'cone', '#e53935', 0.13, 0.32, 0.13, 0, 0.62, 0);
  },
});

// ---------- Tiere im Trickfilm-Stil: grosser Kopf, Kulleraugen mit Glanzpunkt, rosa Bäckchen ----------
function bigEyes(g, y, z, spread, s) {
  for (const x of [-spread, spread]) {
    add(g, 'sphere', '#ffffff', s * 0.85, s, s * 0.6, x, y, z);
    add(g, 'sphere', '#1b1030', s * 0.58, s * 0.66, s * 0.4, x, y - s * 0.12, z + s * 0.32);
    add(g, 'sphere', '#ffffff', s * 0.2, s * 0.2, s * 0.12, x + s * 0.18, y + s * 0.12, z + s * 0.66);
  }
}
function cheeks(g, y, z, spread, s = 0.06) {
  for (const x of [-spread, spread]) add(g, 'sphere', '#ff8fab', s * 1.3, s * 0.75, s * 0.4, x, y, z);
}
function paws(g, c, pts, r = 0.08) {
  for (const [x, z] of pts) add(g, 'sphere', c, r, r * 0.85, r * 1.1, x, r * 0.8, z);
}

Object.assign(BUILDERS, {
  duck: g => {
    add(g, 'sphere', '#ffd43b', 0.24, 0.18, 0.28, 0, 0.18, 0);
    add(g, 'sphere', '#ffd43b', 0.17, 0.17, 0.17, 0, 0.42, 0.1);
    add(g, 'sphere', '#ff922b', 0.09, 0.035, 0.1, 0, 0.38, 0.27);
    add(g, 'sphere', '#ffd43b', 0.05, 0.1, 0.12, 0, 0.26, -0.28, -0.6);
    bigEyes(g, 0.47, 0.22, 0.075, 0.055);
    cheeks(g, 0.4, 0.24, 0.12, 0.035);
  },
  cat: g => {
    const c = '#ffa94d', d = '#e8590c';
    add(g, 'sphere', c, 0.22, 0.2, 0.27, 0, 0.26, -0.06);
    add(g, 'sphere', '#fff4e6', 0.14, 0.13, 0.12, 0, 0.24, 0.12);
    add(g, 'sphere', c, 0.29, 0.26, 0.26, 0, 0.6, 0.12);
    for (const sx of [-1, 1]) {
      add(g, 'cone', c, 0.1, 0.17, 0.08, sx * 0.17, 0.86, 0.1, 0, 0, sx * -0.25);
      add(g, 'cone', '#ffc9de', 0.05, 0.1, 0.04, sx * 0.17, 0.85, 0.13, 0, 0, sx * -0.25);
    }
    for (const x of [-0.07, 0, 0.07]) add(g, 'sphere', d, 0.03, 0.06, 0.03, x, 0.83, 0.15);
    add(g, 'sphere', '#fff4e6', 0.12, 0.08, 0.06, 0, 0.53, 0.35);
    add(g, 'sphere', '#ff6b9d', 0.035, 0.025, 0.02, 0, 0.57, 0.39);
    bigEyes(g, 0.64, 0.3, 0.11, 0.075);
    cheeks(g, 0.53, 0.33, 0.17);
    add(g, 'arc', c, 0.2, 0.2, 0.22, 0, 0.32, -0.38, 0, Math.PI / 2, 0);
    paws(g, '#fff4e6', [[-0.11, 0.12], [0.11, 0.12], [-0.11, -0.2], [0.11, -0.2]]);
  },
  dog: g => {
    const c = '#d9a066', d = '#8a5a2b';
    add(g, 'sphere', c, 0.23, 0.21, 0.3, 0, 0.27, -0.06);
    add(g, 'sphere', '#fff4e6', 0.15, 0.13, 0.12, 0, 0.25, 0.14);
    add(g, 'sphere', c, 0.3, 0.27, 0.27, 0, 0.62, 0.13);
    add(g, 'sphere', d, 0.11, 0.1, 0.06, 0.12, 0.72, 0.33);
    add(g, 'sphere', '#fff4e6', 0.15, 0.1, 0.11, 0, 0.52, 0.34);
    add(g, 'sphere', '#1b1030', 0.055, 0.04, 0.04, 0, 0.57, 0.45);
    add(g, 'sphere', '#ff6b9d', 0.05, 0.03, 0.06, 0, 0.45, 0.4, 0.4);
    for (const sx of [-1, 1]) add(g, 'sphere', d, 0.08, 0.2, 0.07, sx * 0.29, 0.58, 0.12, 0, 0, sx * 0.25);
    bigEyes(g, 0.68, 0.32, 0.11, 0.075);
    cheeks(g, 0.55, 0.35, 0.18);
    add(g, 'sphere', c, 0.05, 0.05, 0.16, 0, 0.42, -0.38, -0.8);
    paws(g, '#fff4e6', [[-0.12, 0.14], [0.12, 0.14], [-0.12, -0.22], [0.12, -0.22]]);
  },
  bunny: g => {
    const c = '#ffffff';
    add(g, 'sphere', c, 0.22, 0.2, 0.25, 0, 0.22, -0.04);
    add(g, 'sphere', c, 0.24, 0.22, 0.22, 0, 0.5, 0.12);
    for (const sx of [-1, 1]) {
      add(g, 'sphere', c, 0.07, 0.24, 0.05, sx * 0.09, 0.86, 0.06, -0.15, 0, sx * -0.12);
      add(g, 'sphere', '#ffc9de', 0.04, 0.17, 0.02, sx * 0.09, 0.86, 0.1, -0.15, 0, sx * -0.12);
    }
    add(g, 'sphere', '#ff6b9d', 0.035, 0.025, 0.02, 0, 0.47, 0.34);
    bigEyes(g, 0.55, 0.28, 0.095, 0.068);
    cheeks(g, 0.45, 0.29, 0.15);
    add(g, 'sphere', c, 0.09, 0.09, 0.09, 0, 0.24, -0.3);
    paws(g, c, [[-0.1, 0.14], [0.1, 0.14]], 0.07);
  },
  chick: g => {
    const c = '#ffe066';
    add(g, 'sphere', c, 0.26, 0.24, 0.26, 0, 0.25, 0);
    add(g, 'sphere', '#ff922b', 0.06, 0.04, 0.07, 0, 0.27, 0.25);
    for (const sx of [-1, 1]) add(g, 'sphere', '#fcc419', 0.05, 0.11, 0.13, sx * 0.25, 0.24, -0.02, 0, 0, sx * 0.4);
    for (const [x, rz] of [[-0.03, 0.4], [0.03, -0.4]]) add(g, 'sphere', c, 0.03, 0.08, 0.03, x, 0.52, 0, 0, 0, rz);
    bigEyes(g, 0.35, 0.2, 0.09, 0.06);
    cheeks(g, 0.27, 0.22, 0.15, 0.04);
    paws(g, '#ff922b', [[-0.08, 0.06], [0.08, 0.06]], 0.05);
  },
  penguin: g => {
    add(g, 'sphere', '#26315e', 0.26, 0.3, 0.24, 0, 0.32, 0);
    add(g, 'sphere', '#ffffff', 0.2, 0.24, 0.12, 0, 0.3, 0.14);
    add(g, 'sphere', '#26315e', 0.24, 0.22, 0.22, 0, 0.7, 0.03);
    add(g, 'sphere', '#ffffff', 0.17, 0.14, 0.1, 0, 0.67, 0.17);
    add(g, 'cone', '#ff922b', 0.05, 0.11, 0.05, 0, 0.64, 0.29, Math.PI / 2);
    bigEyes(g, 0.73, 0.22, 0.08, 0.06);
    cheeks(g, 0.64, 0.24, 0.13, 0.04);
    for (const sx of [-1, 1]) add(g, 'sphere', '#26315e', 0.06, 0.2, 0.1, sx * 0.26, 0.36, 0, 0, 0, sx * -0.35);
    paws(g, '#ff922b', [[-0.09, 0.08], [0.09, 0.08]], 0.07);
  },
  parrot: g => {
    add(g, 'sphere', '#f03e3e', 0.18, 0.24, 0.18, 0, 0.3, 0);
    add(g, 'sphere', '#f03e3e', 0.2, 0.19, 0.19, 0, 0.62, 0.04);
    add(g, 'sphere', '#ffe066', 0.12, 0.08, 0.06, 0, 0.6, 0.18);
    add(g, 'cone', '#495057', 0.05, 0.1, 0.05, 0, 0.56, 0.25, Math.PI / 2 + 0.6);
    bigEyes(g, 0.67, 0.16, 0.085, 0.06);
    for (const sx of [-1, 1]) add(g, 'sphere', '#339af0', 0.06, 0.2, 0.15, sx * 0.18, 0.32, -0.02);
    add(g, 'sphere', '#51cf66', 0.07, 0.22, 0.04, 0, 0.12, -0.2, -0.6);
    for (const [x, c] of [[-0.04, '#ffd43b'], [0.04, '#51cf66']]) add(g, 'sphere', c, 0.03, 0.08, 0.03, x, 0.83, 0, 0, 0, x * -6);
  },
  unicorn: g => {
    const c = '#ffffff';
    add(g, 'sphere', c, 0.3, 0.27, 0.42, 0, 0.6, -0.05);
    for (const [x, z] of [[-0.15, 0.2], [0.15, 0.2], [-0.15, -0.28], [0.15, -0.28]]) {
      add(g, 'cyl', c, 0.07, 0.4, 0.07, x, 0.27, z);
      add(g, 'sphere', '#cc5de8', 0.08, 0.06, 0.09, x, 0.06, z);
    }
    add(g, 'sphere', c, 0.25, 0.25, 0.27, 0, 1.0, 0.36);
    add(g, 'sphere', '#ffe3ef', 0.15, 0.11, 0.1, 0, 0.92, 0.58);
    add(g, 'cone', '#ffd43b', 0.055, 0.32, 0.055, 0, 1.33, 0.45, 0.35);
    bigEyes(g, 1.05, 0.58, 0.11, 0.075);
    cheeks(g, 0.94, 0.6, 0.17);
    const mane = ['#ff6b9d', '#cc5de8', '#4dabf7', '#ffd43b', '#69db7c'];
    mane.forEach((m, i) => add(g, 'sphere', m, 0.09, 0.11, 0.09, 0, 1.2 - i * 0.12, 0.24 - i * 0.11));
    mane.forEach((m, i) => add(g, 'sphere', m, 0.07, 0.07, 0.07, i % 2 ? 0.03 : -0.03, 0.66 - i * 0.07, -0.5 - i * 0.03));
    for (const sx of [-1, 1]) add(g, 'cone', c, 0.06, 0.12, 0.05, sx * 0.13, 1.23, 0.3);
  },
  fox: g => {
    const c = '#ff7a1a';
    add(g, 'sphere', c, 0.21, 0.19, 0.29, 0, 0.27, -0.06);
    add(g, 'sphere', '#ffffff', 0.13, 0.12, 0.1, 0, 0.25, 0.13);
    add(g, 'sphere', c, 0.27, 0.24, 0.25, 0, 0.58, 0.12);
    add(g, 'sphere', '#ffffff', 0.15, 0.1, 0.12, 0, 0.5, 0.3);
    add(g, 'sphere', '#1b1030', 0.04, 0.035, 0.035, 0, 0.53, 0.42);
    for (const sx of [-1, 1]) {
      add(g, 'cone', c, 0.1, 0.2, 0.08, sx * 0.15, 0.85, 0.1, 0, 0, sx * -0.2);
      add(g, 'cone', '#3b2314', 0.05, 0.08, 0.05, sx * 0.17, 0.93, 0.1, 0, 0, sx * -0.2);
    }
    bigEyes(g, 0.63, 0.3, 0.105, 0.07);
    cheeks(g, 0.52, 0.3, 0.17);
    add(g, 'sphere', c, 0.13, 0.13, 0.28, 0, 0.42, -0.45, 0.6);
    add(g, 'sphere', '#ffffff', 0.08, 0.08, 0.1, 0, 0.56, -0.66, 0.6);
    paws(g, '#3b2314', [[-0.11, 0.12], [0.11, 0.12], [-0.11, -0.2], [0.11, -0.2]]);
  },
  turtle: g => {
    add(g, 'sphere', '#2f9e44', 0.32, 0.2, 0.36, 0, 0.18, -0.02);
    for (const [x, z] of [[0, 0], [-0.15, 0.1], [0.15, 0.1], [-0.15, -0.14], [0.15, -0.14]]) add(g, 'sphere', '#8ce99a', 0.09, 0.04, 0.09, x, 0.36 - Math.hypot(x, z) * 0.45, z);
    add(g, 'sphere', '#a9e34b', 0.17, 0.15, 0.16, 0, 0.26, 0.42);
    bigEyes(g, 0.31, 0.53, 0.07, 0.05);
    cheeks(g, 0.23, 0.55, 0.1, 0.035);
    paws(g, '#a9e34b', [[-0.27, 0.2], [0.27, 0.2], [-0.27, -0.2], [0.27, -0.2]], 0.09);
  },
  dolphin: g => {
    add(g, 'sphere', '#4dabf7', 0.24, 0.24, 0.5, 0, 0.3, -0.05);
    add(g, 'sphere', '#e7f5ff', 0.17, 0.14, 0.38, 0, 0.22, 0.02);
    add(g, 'sphere', '#4dabf7', 0.1, 0.08, 0.16, 0, 0.26, 0.5);
    add(g, 'cone', '#339af0', 0.07, 0.22, 0.13, 0, 0.58, -0.08, -0.35);
    add(g, 'sphere', '#339af0', 0.24, 0.04, 0.1, 0, 0.32, -0.58);
    bigEyes(g, 0.4, 0.38, 0.13, 0.065);
    cheeks(g, 0.3, 0.42, 0.15, 0.04);
  },
  butterfly: g => {
    add(g, 'sphere', '#5f3dc4', 0.05, 0.05, 0.2, 0, 0.5, 0);
    add(g, 'sphere', '#5f3dc4', 0.08, 0.08, 0.08, 0, 0.52, 0.2);
    bigEyes(g, 0.54, 0.26, 0.04, 0.03);
    for (const sx of [-1, 1]) {
      add(g, 'sphere', '#cc5de8', 0.22, 0.03, 0.17, sx * 0.21, 0.52, 0.07, 0, 0, sx * 0.3);
      add(g, 'sphere', '#ffd43b', 0.07, 0.035, 0.06, sx * 0.24, 0.54, 0.08, 0, 0, sx * 0.3);
      add(g, 'sphere', '#ff6b9d', 0.14, 0.03, 0.11, sx * 0.15, 0.49, -0.13, 0, 0, sx * 0.3);
      add(g, 'cyl', '#5f3dc4', 0.01, 0.16, 0.01, sx * 0.04, 0.62, 0.27, 0.6, 0, sx * -0.3);
    }
  },
  hamster: g => {
    const c = '#ffc078';
    add(g, 'sphere', c, 0.25, 0.22, 0.26, 0, 0.21, 0);
    add(g, 'sphere', '#fff4e6', 0.17, 0.14, 0.12, 0, 0.18, 0.15);
    for (const sx of [-1, 1]) {
      add(g, 'sphere', c, 0.07, 0.07, 0.03, sx * 0.14, 0.4, 0.05);
      add(g, 'sphere', '#ffc9de', 0.04, 0.04, 0.02, sx * 0.14, 0.4, 0.07);
      add(g, 'sphere', '#fff4e6', 0.08, 0.07, 0.06, sx * 0.13, 0.19, 0.2);
    }
    add(g, 'sphere', '#ff6b9d', 0.03, 0.022, 0.02, 0, 0.24, 0.27);
    bigEyes(g, 0.29, 0.21, 0.085, 0.055);
    paws(g, '#fff4e6', [[-0.08, 0.2], [0.08, 0.2]], 0.045);
  },
});

const templates = new Map();
export function makeItemMesh(type) {
  let tpl = templates.get(type);
  if (!tpl) {
    tpl = new THREE.Group();
    const inner = new THREE.Group();
    tpl.add(inner);
    BUILDERS[ITEM_TYPES[type]?.key]?.(inner);
    mergeChildren(inner);
    templates.set(type, tpl);
  }
  // Kopie teilt Form und Material mit der Vorlage (spart viel Speicher, wichtig für iPads)
  const g = tpl.clone();
  g.userData.inner = g.children[0];
  return g;
}

export function itemCat(type) { return ITEM_TYPES[type]?.cat; }
