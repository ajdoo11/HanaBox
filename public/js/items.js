// Niedliche 3D-Modelle für Gegenstände in der Hana-Stadt. Ursprung = Unterkante.
import * as THREE from 'three';
import { ITEM_TYPES } from './shared.js';
import { mergeChildren } from './merge.js';

const G = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  cone: new THREE.ConeGeometry(1, 1, 16),
  torus: new THREE.TorusGeometry(1, 0.42, 10, 20),
  arc: new THREE.TorusGeometry(1, 0.3, 8, 16, Math.PI * 0.75),
};
const matCache = new Map();
function mat(c, emissive) {
  const k = c + (emissive || '');
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshLambertMaterial(emissive ? { color: c, emissive, emissiveIntensity: 0.4 } : { color: c }));
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
  duck: g => {
    add(g, 'sphere', '#ffeb3b', 0.22, 0.17, 0.27, 0, 0.17, 0);
    add(g, 'sphere', '#ffeb3b', 0.14, 0.14, 0.14, 0, 0.38, 0.1);
    add(g, 'sphere', '#ff9800', 0.07, 0.03, 0.08, 0, 0.36, 0.25);
    eyes(g, 0.43, 0.22, 0.06, 0.025);
  },
  balloon: g => { add(g, 'sphere', '#ff4081', 0.3, 0.36, 0.3, 0, 1.4, 0); add(g, 'box', '#ffffff', 0.01, 1.05, 0.01, 0, 0.53, 0); add(g, 'cone', '#ff4081', 0.05, 0.08, 0.05, 0, 1.03, 0, Math.PI); },
  gift: g => {
    add(g, 'box', '#ab47bc', 0.5, 0.42, 0.5, 0, 0.21, 0);
    add(g, 'box', '#ffeb3b', 0.52, 0.43, 0.08, 0, 0.215, 0);
    add(g, 'box', '#ffeb3b', 0.08, 0.43, 0.52, 0, 0.215, 0);
    add(g, 'sphere', '#ffeb3b', 0.1, 0.07, 0.1, -0.07, 0.46, 0);
    add(g, 'sphere', '#ffeb3b', 0.1, 0.07, 0.1, 0.07, 0.46, 0);
  },
  cat: g => {
    const c = '#ffb74d';
    add(g, 'sphere', c, 0.24, 0.22, 0.34, 0, 0.3, -0.05);
    add(g, 'sphere', c, 0.23, 0.21, 0.21, 0, 0.55, 0.28);
    add(g, 'cone', c, 0.08, 0.14, 0.08, -0.13, 0.76, 0.27);
    add(g, 'cone', c, 0.08, 0.14, 0.08, 0.13, 0.76, 0.27);
    add(g, 'sphere', '#ffffff', 0.1, 0.07, 0.06, 0, 0.5, 0.46);
    add(g, 'sphere', '#f48fb1', 0.03, 0.025, 0.02, 0, 0.53, 0.5);
    eyes(g, 0.6, 0.45, 0.09, 0.035);
    add(g, 'cyl', c, 0.04, 0.4, 0.04, 0, 0.5, -0.42, -0.5);
    for (const [x, z] of [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.2], [0.12, -0.2]]) add(g, 'cyl', c, 0.05, 0.16, 0.05, x, 0.08, z);
  },
  dog: g => {
    const c = '#a1887f';
    add(g, 'sphere', c, 0.25, 0.23, 0.38, 0, 0.32, -0.05);
    add(g, 'sphere', c, 0.24, 0.22, 0.22, 0, 0.6, 0.3);
    add(g, 'sphere', '#d7ccc8', 0.12, 0.09, 0.12, 0, 0.53, 0.48);
    add(g, 'sphere', '#212121', 0.045, 0.035, 0.03, 0, 0.58, 0.6);
    add(g, 'sphere', '#6d4c41', 0.07, 0.17, 0.05, -0.24, 0.55, 0.28);
    add(g, 'sphere', '#6d4c41', 0.07, 0.17, 0.05, 0.24, 0.55, 0.28);
    eyes(g, 0.67, 0.47, 0.09, 0.035);
    add(g, 'cyl', c, 0.05, 0.25, 0.05, 0, 0.5, -0.45, -0.9);
    for (const [x, z] of [[-0.13, 0.15], [0.13, 0.15], [-0.13, -0.22], [0.13, -0.22]]) add(g, 'cyl', c, 0.06, 0.18, 0.06, x, 0.09, z);
  },
  bunny: g => {
    const c = '#fafafa';
    add(g, 'sphere', c, 0.24, 0.22, 0.28, 0, 0.24, -0.04);
    add(g, 'sphere', c, 0.19, 0.18, 0.18, 0, 0.48, 0.18);
    add(g, 'sphere', c, 0.06, 0.22, 0.04, -0.08, 0.82, 0.14);
    add(g, 'sphere', c, 0.06, 0.22, 0.04, 0.08, 0.82, 0.14);
    add(g, 'sphere', '#f8bbd0', 0.035, 0.16, 0.02, -0.08, 0.82, 0.17);
    add(g, 'sphere', '#f8bbd0', 0.035, 0.16, 0.02, 0.08, 0.82, 0.17);
    add(g, 'sphere', '#f48fb1', 0.03, 0.025, 0.02, 0, 0.46, 0.36);
    eyes(g, 0.52, 0.33, 0.08, 0.03);
    add(g, 'sphere', c, 0.08, 0.08, 0.08, 0, 0.26, -0.33);
  },
  chick: g => {
    add(g, 'sphere', '#ffee58', 0.2, 0.19, 0.2, 0, 0.19, 0);
    add(g, 'sphere', '#ffee58', 0.15, 0.15, 0.15, 0, 0.42, 0.04);
    add(g, 'cone', '#ff9800', 0.04, 0.08, 0.04, 0, 0.41, 0.22, Math.PI / 2);
    eyes(g, 0.46, 0.15, 0.06, 0.025);
    add(g, 'sphere', '#fdd835', 0.04, 0.09, 0.12, -0.19, 0.2, 0);
    add(g, 'sphere', '#fdd835', 0.04, 0.09, 0.12, 0.19, 0.2, 0);
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
  penguin: g => {
    add(g, 'sphere', '#263238', 0.25, 0.33, 0.24, 0, 0.35, 0);
    add(g, 'sphere', '#ffffff', 0.19, 0.26, 0.12, 0, 0.33, 0.13);
    add(g, 'sphere', '#263238', 0.18, 0.17, 0.17, 0, 0.72, 0.02);
    add(g, 'cone', '#ff9800', 0.05, 0.12, 0.05, 0, 0.7, 0.2, Math.PI / 2);
    eyes(g, 0.77, 0.15, 0.07, 0.03);
    add(g, 'sphere', '#ff9800', 0.09, 0.03, 0.12, -0.1, 0.03, 0.06); add(g, 'sphere', '#ff9800', 0.09, 0.03, 0.12, 0.1, 0.03, 0.06);
    add(g, 'sphere', '#263238', 0.05, 0.2, 0.1, -0.25, 0.4, 0, 0, 0, 0.3); add(g, 'sphere', '#263238', 0.05, 0.2, 0.1, 0.25, 0.4, 0, 0, 0, -0.3);
  },
  parrot: g => {
    add(g, 'sphere', '#e53935', 0.17, 0.26, 0.17, 0, 0.32, 0);
    add(g, 'sphere', '#e53935', 0.14, 0.14, 0.14, 0, 0.62, 0.05);
    add(g, 'cone', '#fdd835', 0.05, 0.12, 0.05, 0, 0.58, 0.2, Math.PI / 2 + 0.4);
    eyes(g, 0.66, 0.15, 0.07, 0.025);
    add(g, 'sphere', '#1e88e5', 0.06, 0.2, 0.14, -0.17, 0.32, -0.02); add(g, 'sphere', '#1e88e5', 0.06, 0.2, 0.14, 0.17, 0.32, -0.02);
    add(g, 'box', '#43a047', 0.1, 0.35, 0.04, 0, 0.12, -0.18, -0.6);
  },
  unicorn: g => {
    const c = '#fafafa';
    add(g, 'sphere', c, 0.3, 0.28, 0.48, 0, 0.62, 0);
    for (const [x, z] of [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.25], [0.15, -0.25]]) add(g, 'cyl', c, 0.07, 0.45, 0.07, x, 0.23, z);
    add(g, 'sphere', c, 0.18, 0.2, 0.26, 0, 0.98, 0.42);
    add(g, 'cone', '#ffd54f', 0.05, 0.3, 0.05, 0, 1.28, 0.5, 0.3);
    eyes(g, 1.03, 0.6, 0.1, 0.035);
    const mane = ['#f06292', '#ba68c8', '#64b5f6', '#ffd54f'];
    for (let i = 0; i < 4; i++) add(g, 'sphere', mane[i], 0.08, 0.1, 0.08, 0, 1.1 - i * 0.12, 0.25 - i * 0.12);
    add(g, 'sphere', '#ba68c8', 0.08, 0.25, 0.08, 0, 0.62, -0.5, 0.6);
  },
  fox: g => {
    const c = '#ff7043';
    add(g, 'sphere', c, 0.22, 0.2, 0.34, 0, 0.3, -0.05);
    add(g, 'sphere', c, 0.2, 0.18, 0.2, 0, 0.55, 0.28);
    add(g, 'sphere', '#ffffff', 0.09, 0.07, 0.1, 0, 0.5, 0.45);
    add(g, 'sphere', '#212121', 0.03, 0.03, 0.03, 0, 0.53, 0.55);
    add(g, 'cone', c, 0.07, 0.16, 0.07, -0.11, 0.76, 0.27); add(g, 'cone', c, 0.07, 0.16, 0.07, 0.11, 0.76, 0.27);
    eyes(g, 0.6, 0.44, 0.08, 0.03);
    add(g, 'sphere', c, 0.1, 0.1, 0.3, 0, 0.4, -0.45, 0.5);
    add(g, 'sphere', '#ffffff', 0.06, 0.06, 0.08, 0, 0.5, -0.68);
    for (const [x, z] of [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.2], [0.12, -0.2]]) add(g, 'cyl', '#5d4037', 0.05, 0.16, 0.05, x, 0.08, z);
  },
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
  turtle: g => {
    add(g, 'sphere', '#558b2f', 0.32, 0.17, 0.36, 0, 0.17, 0);
    add(g, 'sphere', '#8bc34a', 0.12, 0.05, 0.12, 0, 0.32, 0);
    add(g, 'sphere', '#aed581', 0.12, 0.1, 0.13, 0, 0.16, 0.38);
    eyes(g, 0.2, 0.48, 0.06, 0.025);
    for (const [x, z] of [[-0.25, 0.2], [0.25, 0.2], [-0.25, -0.2], [0.25, -0.2]]) add(g, 'sphere', '#aed581', 0.08, 0.05, 0.1, x, 0.06, z);
  },
  dolphin: g => {
    add(g, 'sphere', '#4fc3f7', 0.22, 0.22, 0.55, 0, 0.3, 0);
    add(g, 'sphere', '#e1f5fe', 0.16, 0.12, 0.42, 0, 0.22, 0.05);
    add(g, 'cone', '#4fc3f7', 0.08, 0.2, 0.08, 0, 0.3, 0.6, Math.PI / 2);
    add(g, 'cone', '#29b6f6', 0.06, 0.22, 0.12, 0, 0.55, -0.05, -0.3);
    add(g, 'box', '#29b6f6', 0.4, 0.04, 0.12, 0, 0.32, -0.58);
    eyes(g, 0.38, 0.4, 0.12, 0.03);
  },
  butterfly: g => {
    add(g, 'cyl', '#4e342e', 0.03, 0.3, 0.03, 0, 0.5, 0, Math.PI / 2);
    for (const s of [-1, 1]) {
      add(g, 'sphere', '#ab47bc', 0.2, 0.03, 0.14, s * 0.2, 0.5, 0.06, 0, 0, s * 0.3);
      add(g, 'sphere', '#f06292', 0.13, 0.03, 0.1, s * 0.15, 0.48, -0.1, 0, 0, s * 0.3);
    }
  },
  hamster: g => {
    const c = '#ffcc80';
    add(g, 'sphere', c, 0.22, 0.18, 0.25, 0, 0.18, 0);
    add(g, 'sphere', '#fff3e0', 0.15, 0.12, 0.12, 0, 0.16, 0.14);
    add(g, 'sphere', c, 0.06, 0.06, 0.03, -0.12, 0.34, 0.08); add(g, 'sphere', c, 0.06, 0.06, 0.03, 0.12, 0.34, 0.08);
    add(g, 'sphere', '#f48fb1', 0.025, 0.02, 0.02, 0, 0.2, 0.26);
    eyes(g, 0.26, 0.21, 0.07, 0.025);
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

export function makeItemMesh(type) {
  const g = new THREE.Group();
  const t = ITEM_TYPES[type];
  const inner = new THREE.Group();
  g.add(inner);
  BUILDERS[t?.key]?.(inner);
  mergeChildren(inner);
  g.userData.inner = inner;
  return g;
}

export function itemCat(type) { return ITEM_TYPES[type]?.cat; }
