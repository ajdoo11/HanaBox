// Strassenverkehr zum Anschauen: Ampeln an allen Kreuzungen und Boote, die um die Inseln fahren.
// Beides richtet sich nach der Uhrzeit des Servers, darum sehen alle Spieler dasselbe.
import * as THREE from 'three';
import { ROADS } from './town.js';
import { makeVehicle, SEATS } from './vehicles.js';
import { Character } from './avatar.js';
import { randomAvatar } from './bots.js';

// ---------- Ampeln ----------
// Die Masten stehen fest in der Stadt (town.js); hier werden nur die Lichter gezeichnet und geschaltet.
export const LIGHT_POLES = [];
for (const rx of ROADS) for (const rz of ROADS) {
  LIGHT_POLES.push({ x: rx + 7.6, z: rz - 7.6, axis: 'z' }, { x: rx - 7.6, z: rz + 7.6, axis: 'x' });
}
const ON = [new THREE.Color('#ff1744'), new THREE.Color('#ffd600'), new THREE.Color('#00e676')];
const OFF = [new THREE.Color('#4a1515'), new THREE.Color('#4a4215'), new THREE.Color('#123a22')];
const PERIOD = 20;
// 0 = rot, 1 = gelb, 2 = grün – Längs- und Querverkehr haben abwechselnd grün
function lightFor(axis, t) {
  const s = ((t % PERIOD) + PERIOD) % PERIOD;
  const a = axis === 'z' ? s : (s + PERIOD / 2) % PERIOD;
  return a < 8 ? 2 : a < 10 ? 1 : 0;
}

export function makeTrafficLights(scene) {
  const geo = new THREE.SphereGeometry(0.24, 12, 8);
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const slots = [];
  for (const p of LIGHT_POLES) for (const face of [-1, 1]) for (let k = 0; k < 3; k++) {
    const y = 5.95 - k * 0.65;
    slots.push({ axis: p.axis, k: [0, 1, 2][k], x: p.x + (p.axis === 'x' ? face * 0.42 : 0), y, z: p.z + (p.axis === 'z' ? face * 0.42 : 0) });
  }
  const mesh = new THREE.InstancedMesh(geo, mat, slots.length);
  const m = new THREE.Matrix4();
  slots.forEach((s, i) => { m.makeTranslation(s.x, s.y, s.z); mesh.setMatrixAt(i, m); mesh.setColorAt(i, OFF[s.k]); });
  mesh.frustumCulled = false;
  scene.add(mesh);
  let last = '';
  return {
    dispose() { mesh.removeFromParent(); geo.dispose(); mat.dispose(); },
    update(t) {
      const key = lightFor('z', t) + ':' + lightFor('x', t);
      if (key === last) return;
      last = key;
      slots.forEach((s, i) => mesh.setColorAt(i, lightFor(s.axis, t) === s.k ? ON[s.k] : OFF[s.k]));
      mesh.instanceColor.needsUpdate = true;
    },
  };
}

// ---------- Boote ----------
// Jedes Boot fährt auf einer fast quadratischen Runde um eine Insel.
const loop = (cx, cz, H, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [cx + H * Math.sign(c) * Math.abs(c) ** 0.35, cz + H * Math.sign(s) * Math.abs(s) ** 0.35];
};

export function makeBoats(scene, lands) {
  const boats = [];
  lands.forEach((l, li) => {
    // Hana-Stadt hat im Süden einen langen Strand, die Länder sind Inseln mit 700 Breite
    const H = l.key === 'stadt' ? 370 : 420, cz = l.key === 'stadt' ? 20 : l.cz;
    for (let i = 0; i < 4; i++) {
      const speedy = i % 2 === 0;
      boats.push({
        cx: l.cx, cz, H: H + i * 18, a0: (i / 4) * Math.PI * 2 + li, dir: i === 1 ? -1 : 1,
        speed: speedy ? 16 : 7, type: speedy ? 6 : 5, color: (li * 4 + i) % 9, root: null,
      });
    }
  });
  const pos = new THREE.Vector3();
  return {
    boats,
    update(t, dt, me) {
      for (const b of boats) {
        const a = b.a0 + b.dir * (b.speed / b.H) * t;
        const [x, z] = loop(b.cx, b.cz, b.H, a);
        pos.set(x, 0, z);
        const near = Math.abs(x - me.x) < 330 && Math.abs(z - me.z) < 330;
        if (!near) { if (b.root) b.root.visible = false; continue; }
        if (!b.root) {
          // Boot erst bauen, wenn jemand in der Nähe ist
          b.char = new Character(randomAvatar(), null);
          b.char.root.add(makeVehicle(b.type, b.color));
          const seat = SEATS[b.type === 6 ? 'speedboat' : 'boat'];
          b.char.seatY = seat.pos[1]; b.char.seatZ = seat.pos[2];
          b.root = b.char.root;
          scene.add(b.root);
        }
        const [x2, z2] = loop(b.cx, b.cz, b.H, a + b.dir * 0.002);
        b.root.visible = true;
        b.root.position.set(x, -0.55 + Math.sin(t * 2 + b.a0) * 0.08, z);
        b.root.rotation.y = Math.atan2(x2 - x, z2 - z);
        b.root.rotation.z = Math.sin(t * 1.3 + b.a0) * 0.04;
        b.char.update(dt, 'drive', 0);
      }
    },
  };
}
