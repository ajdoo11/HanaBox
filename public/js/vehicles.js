// Fahrzeug-Modelle: Cabrio, Jeep, Kart, Velo, Trotti. Ursprung = Boden-Mitte, vorne = +z.
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { VEHICLES, VEH_COLORS } from './shared.js';
import { mergeChildren } from './merge.js';

const cache = new Map();
// Trickfilm-Look: Karosserie-Teile kräftig abgerundet
const RB = (w, h, d, r = 0.1) => {
  r = Math.max(r, Math.min(w, h, d) * 0.3);
  const k = `${w},${h},${d},${r}`;
  if (!cache.has(k)) cache.set(k, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
  return cache.get(k);
};
const WHEEL = new THREE.CylinderGeometry(1, 1, 1, 20);
WHEEL.rotateZ(Math.PI / 2);
const TOR = new THREE.TorusGeometry(1, 0.12, 8, 24);
TOR.rotateY(Math.PI / 2);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 12);
const mats = new Map();
const M = (c, extra) => {
  const k = c + JSON.stringify(extra || {});
  if (!mats.has(k)) mats.set(k, toonMat({ color: c, ...extra }));
  return mats.get(k);
};

function add(g, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.x = rx;
  m.castShadow = true;
  g.add(m);
  return m;
}
function wheel(g, x, y, z, r, w) {
  const wg = new THREE.Group();
  wg.position.set(x, y, z);
  add(wg, WHEEL, M('#212121'), 0, 0, 0, w, r, r);
  add(wg, WHEEL, M('#cfd8dc'), 0, 0, 0, w + 0.02, r * 0.5, r * 0.5);
  add(wg, RB(w + 0.04, r * 0.3, r * 1.2, 0.02), M('#9e9e9e'), 0, 0, 0);
  wg.userData.wheel = true;
  g.add(wg);
  g.userData.wheels.push(wg);
}

// Strassen, Gehwege und Plätze liegen als dünne Platten (bis 0.14 hoch) auf dem Boden:
// Landfahrzeuge werden darum etwas angehoben, sonst stecken die Räder darin.
const LIFT = 0.15;
export const SEATS = {
  car: { pos: [0, 0.6 + LIFT, -0.25], anim: 'drive' },
  jeep: { pos: [0, 0.85 + LIFT, -0.2], anim: 'drive' },
  kart: { pos: [0, 0.22 + LIFT, -0.25], anim: 'drive' },
  bike: { pos: [0, 0.8 + LIFT, -0.15], anim: 'bike' },
  scooter: { pos: [0, 0.25 + LIFT, -0.05], anim: 'stand' },
  boat: { pos: [0, 0.3, -0.3], anim: 'drive' },
  speedboat: { pos: [0, 0.7, -0.2], anim: 'drive' },
};

const templates = new Map();
export function makeVehicle(type, colorIdx) {
  const k = type + ':' + colorIdx;
  if (!templates.has(k)) {
    const tpl = buildVehicle(type, colorIdx);
    delete tpl.userData.wheels;
    templates.set(k, tpl);
  }
  // Kopie teilt Formen und Materialien; die Räder drehen sich trotzdem einzeln
  const v = templates.get(k).clone();
  v.userData.wheels = v.children.filter(c => c.userData.wheel);
  return v;
}

function buildVehicle(type, colorIdx) {
  const key = VEHICLES[type]?.key || 'car';
  const c = VEH_COLORS[colorIdx] || VEH_COLORS[0];
  const g = new THREE.Group();
  g.userData.wheels = [];
  const body = M(c), white = M('#fafafa'), dark = M('#37474f'), glass = M('#b3e5fc', { transparent: true, opacity: 0.6 });
  const light = M('#fff59d', { emissive: '#fff59d', emissiveIntensity: 0.8 });
  const red = M('#ff5252', { emissive: '#ff1744', emissiveIntensity: 0.5 });
  switch (key) {
    case 'car':
      add(g, RB(2.2, 0.75, 4.2, 0.3), body, 0, 0.75, 0);
      add(g, RB(2.0, 0.35, 1.3, 0.15), body, 0, 1.25, 1.2);
      add(g, RB(1.9, 0.6, 0.08, 0.04), glass, 0, 1.6, 0.6, 1, 1, 1, -0.4);
      add(g, RB(1.6, 0.5, 0.7, 0.15), M('#fff3e0'), 0, 1.15, -0.25);
      add(g, RB(1.6, 0.7, 0.2, 0.1), M('#fff3e0'), 0, 1.45, -0.62);
      add(g, RB(1.6, 0.5, 0.7, 0.15), M('#fff3e0'), 0, 1.15, -1.35);
      add(g, CYL, dark, 0, 1.35, 0.35, 0.22, 0.05, 0.22, -0.9);
      for (const s of [-0.7, 0.7]) { add(g, RB(0.4, 0.2, 0.1), light, s, 0.85, 2.1); add(g, RB(0.4, 0.2, 0.1), red, s, 0.85, -2.1); }
      for (const [x, z] of [[-1.05, 1.35], [1.05, 1.35], [-1.05, -1.35], [1.05, -1.35]]) wheel(g, x, 0.42, z, 0.42, 0.32);
      break;
    case 'jeep':
      add(g, RB(2.3, 1.0, 4.0, 0.2), body, 0, 1.05, 0);
      add(g, RB(1.8, 0.5, 0.7, 0.15), M('#4e342e'), 0, 1.45, -0.2);
      add(g, RB(1.8, 0.8, 0.2, 0.1), M('#4e342e'), 0, 1.85, -0.6);
      for (const s of [-1, 1]) { add(g, RB(0.12, 1.3, 0.12, 0.04), dark, s * 1.0, 2.2, -0.9); add(g, RB(0.12, 0.12, 1.6, 0.04), dark, s * 1.0, 2.85, -0.1); }
      add(g, RB(2.1, 0.12, 0.12, 0.04), dark, 0, 2.85, -0.9);
      add(g, RB(2.1, 0.7, 0.08, 0.04), glass, 0, 1.9, 0.9);
      add(g, CYL, dark, 0, 1.75, 0.4, 0.22, 0.05, 0.22, -0.9);
      for (const s of [-0.75, 0.75]) add(g, RB(0.35, 0.25, 0.1), light, s, 1.1, 2.0);
      add(g, WHEEL, dark, 0, 1.2, -2.1, 0.3, 0.45, 0.45);
      for (const [x, z] of [[-1.1, 1.3], [1.1, 1.3], [-1.1, -1.3], [1.1, -1.3]]) wheel(g, x, 0.55, z, 0.55, 0.4);
      break;
    case 'kart':
      add(g, RB(1.5, 0.3, 2.6, 0.12), body, 0, 0.3, 0);
      add(g, RB(1.0, 0.4, 0.5, 0.12), body, 0, 0.45, 1.05);
      add(g, RB(1.0, 0.6, 0.15, 0.06), M('#212121'), 0, 0.6, -0.65);
      add(g, RB(1.6, 0.08, 0.4, 0.03), white, 0, 0.75, -1.25);
      add(g, CYL, dark, 0, 0.8, 0.4, 0.2, 0.05, 0.2, -1.0);
      for (const [x, z, r] of [[-0.8, 0.85, 0.28], [0.8, 0.85, 0.28], [-0.8, -0.85, 0.33], [0.8, -0.85, 0.33]]) wheel(g, x, r, z, r, 0.32);
      break;
    case 'bike': {
      const fr = body;
      add(g, RB(0.08, 0.08, 1.2, 0.03), fr, 0, 0.75, 0.0, 1, 1, 1, -0.25);
      add(g, RB(0.08, 0.7, 0.08, 0.03), fr, 0, 0.75, -0.2);
      add(g, RB(0.08, 0.75, 0.08, 0.03), fr, 0, 0.85, 0.55, 1, 1, 1, 0.25);
      add(g, RB(0.6, 0.06, 0.06, 0.03), dark, 0, 1.25, 0.65);
      add(g, RB(0.28, 0.08, 0.4, 0.04), M('#4e342e'), 0, 1.12, -0.25);
      add(g, RB(0.5, 0.3, 0.35, 0.06), M('#ffffff'), 0, 1.05, 0.9);
      for (const z of [0.75, -0.75]) {
        const wg = new THREE.Group(); wg.position.set(0, 0.42, z);
        add(wg, TOR, M('#212121'), 0, 0, 0, 0.42, 0.42, 0.42);
        add(wg, RB(0.04, 0.8, 0.04, 0.01), M('#bdbdbd'), 0, 0, 0);
        add(wg, RB(0.04, 0.04, 0.8, 0.01), M('#bdbdbd'), 0, 0, 0);
        wg.userData.wheel = true;
        g.add(wg); g.userData.wheels.push(wg);
      }
      break;
    }
    case 'scooter':
      add(g, RB(0.45, 0.1, 1.3, 0.04), body, 0, 0.2, 0);
      add(g, RB(0.08, 1.2, 0.08, 0.03), dark, 0, 0.8, 0.6, 1, 1, 1, 0.12);
      add(g, RB(0.7, 0.07, 0.07, 0.03), body, 0, 1.4, 0.68);
      for (const z of [0.6, -0.6]) wheel(g, 0, 0.13, z, 0.13, 0.12);
      break;
    case 'boat': {
      const hull = M(c), wood = M('#6d4c41'), seat = M('#8d6e63');
      add(g, RB(2.0, 0.4, 3.4, 0.3), hull, 0, 0.2, 0);
      add(g, RB(1.6, 0.5, 0.08, 0.04), hull, 0, 0.55, -1.6);
      add(g, RB(0.08, 0.5, 3.0, 0.04), hull, -0.9, 0.55, 0);
      add(g, RB(0.08, 0.5, 3.0, 0.04), hull, 0.9, 0.55, 0);
      add(g, RB(1.4, 0.12, 0.6, 0.06), seat, 0, 0.45, -0.3);
      add(g, RB(1.4, 0.12, 0.6, 0.06), seat, 0, 0.45, 0.6);
      add(g, RB(0.08, 0.6, 0.08, 0.02), wood, 0.4, 0.2, -1.0);
      add(g, RB(0.08, 0.6, 0.08, 0.02), wood, -0.4, 0.2, -1.0);
      add(g, CYL, wood, 0, 0.5, -1.0, 0.04, 2.2, 0.04).rotation.z = Math.PI / 2;
      break;
    }
    case 'speedboat': {
      const hull = M(c), trim = M('#e0e0e0'), wind = M('#b3e5fc', { transparent: true, opacity: 0.5 });
      add(g, RB(2.2, 0.5, 4.5, 0.25), hull, 0, 0.25, 0);
      add(g, RB(1.6, 0.15, 1.2, 0.08), trim, 0, 0.55, 1.5);
      add(g, RB(0.1, 0.6, 4.0, 0.04), hull, -1.0, 0.65, 0);
      add(g, RB(0.1, 0.6, 4.0, 0.04), hull, 1.0, 0.65, 0);
      add(g, RB(1.8, 0.7, 0.08, 0.04), wind, 0, 1.0, 0.8, 1, 1, 1, -0.3);
      add(g, RB(1.6, 0.15, 0.8, 0.08), trim, 0, 0.55, -0.3);
      add(g, RB(1.6, 0.15, 0.8, 0.08), trim, 0, 0.55, -1.2);
      add(g, CYL, M('#37474f'), 0, 0.85, 0.2, 0.22, 0.05, 0.22, -0.9);
      add(g, RB(0.3, 0.5, 0.5, 0.08), M('#455a64'), 0, 0.3, -2.0);
      break;
    }
  }
  if (!VEHICLES[type]?.water) for (const c of g.children) c.position.y += LIFT;
  for (const w of g.userData.wheels) mergeChildren(w);
  mergeChildren(g);
  return g;
}

export function spinWheels(v, speed, dt) {
  for (const w of v.userData.wheels) w.rotation.x += speed * dt * 2;
}
