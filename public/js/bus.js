// Stadtbus: fährt auf der Ringstrasse, langsamer an den Haltestellen. Die Position kommt aus der Uhrzeit,
// deshalb sehen alle Spieler den Bus am gleichen Ort, ohne dass er übertragen werden muss.
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BUS = { R: 210, speed: 13, slow: 4, stopZone: 18 };
const L = 2 * BUS.R;
const PER = 4 * L;
const STOP_S = [0, 1, 2, 3].map(k => k * L + BUS.R);

function stopDist(s) {
  let best = Infinity;
  for (const st of STOP_S) {
    const d = Math.abs(((s - st + PER / 2) % PER + PER) % PER - PER / 2);
    if (d < best) best = d;
  }
  return best;
}

// Zeit, die der Bus für jeden Meter braucht (mit Abbremsen an den Haltestellen)
const TIME = (() => {
  const t = new Float64Array(PER + 1);
  for (let i = 0; i < PER; i++) t[i + 1] = t[i] + 1 / (stopDist(i + 0.5) < BUS.stopZone ? BUS.slow : BUS.speed);
  return t;
})();
const LOOP = TIME[PER];

export function busPose(seconds) {
  const tt = ((seconds % LOOP) + LOOP) % LOOP;
  let lo = 0, hi = PER;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TIME[m] <= tt) lo = m; else hi = m; }
  const s = lo + (tt - TIME[lo]) / (TIME[lo + 1] - TIME[lo]);
  return routePoint(s);
}

// Route im Uhrzeigersinn-Gegenteil: Start an der Ecke (R,-R), dann Seite für Seite
export function routePoint(s) {
  const R = BUS.R;
  const side = Math.min(3, Math.floor(s / L));
  const u = s - side * L - R;
  switch (side) {
    case 0: return { x: R, z: u, rot: 0 };
    case 1: return { x: -u, z: R, rot: -Math.PI / 2 };
    case 2: return { x: -R, z: -u, rot: Math.PI };
    default: return { x: u, z: -R, rot: Math.PI / 2 };
  }
}

export function makeBusMesh() {
  const g = new THREE.Group();
  const paint = (c, e = {}) => toonMat({ color: c, ...e });
  const body = new THREE.Mesh(new RoundedBoxGeometry(4.4, 3.4, 10.5, 4, 0.7), paint('#ffc83d'));
  body.position.y = 2.4;
  body.castShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(4.0, 0.5, 9.6, 3, 0.25), paint('#ff8f00'));
  roof.position.y = 4.35;
  g.add(roof);
  const glass = paint('#8fe3ff', { emissive: '#3fb8e6', emissiveIntensity: 0.25 });
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 8.2), glass);
    w.position.set(sx * 2.23, 3.1, 0);
    g.add(w);
  }
  const front = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 0.08), glass);
  front.position.set(0, 3.0, 5.27);
  g.add(front);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.35, 10.2), paint('#e65100'));
  stripe.position.y = 1.5;
  g.add(stripe);
  const wheel = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 14);
  wheel.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) for (const z of [-3.2, 3.2]) {
    const w = new THREE.Mesh(wheel, paint('#263238'));
    w.position.set(sx * 2.2, 0.8, z);
    g.add(w);
  }
  g.userData.glass = glass;
  g.userData.body = body;
  return g;
}
