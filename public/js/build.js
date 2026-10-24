// Bauwelt: Klötze effizient zeichnen (InstancedMesh) und mit der Physik verbinden.
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { BLOCK_TYPES, BUILD } from './shared.js';
import { makeBox, PLAYER } from './physics.js';
import { getTexture } from './textures.js';

const S = BUILD.size;

export function blockMaterial(t) {
  const opts = { color: t.color };
  const tex = getTexture(t.tex);
  if (tex) opts.map = tex;
  if (t.kind === 'glass') Object.assign(opts, { transparent: true, opacity: 0.45 });
  if (t.kind === 'glow') Object.assign(opts, { emissive: t.color, emissiveIntensity: 0.8 });
  if (t.kind === 'lava') Object.assign(opts, { emissive: '#ff3d00', emissiveIntensity: 0.6 });
  if (t.kind === 'bounce') Object.assign(opts, { emissive: '#00bcd4', emissiveIntensity: 0.25 });
  return toonMat(opts);
}

// Vorschaubild eines Klotzes für die Bau-Leiste (echtes Muster statt nur Farbe)
const icons = new Map();
export function blockIcon(t) {
  if (icons.has(t.name)) return icons.get(t.name);
  const S = 64, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = t.color; g.fillRect(0, 0, S, S);
  const tex = getTexture(t.tex);
  if (tex) { g.globalCompositeOperation = 'multiply'; g.drawImage(tex.image, 0, 0, S, S); g.globalCompositeOperation = 'source-over'; }
  if (t.kind === 'door') {
    g.fillStyle = '#ffd54f'; g.strokeStyle = '#5d4037'; g.lineWidth = 2;
    g.beginPath(); g.arc(48, 34, 5, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  if (t.name === 'Wasser') {
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 4;
    for (const y of [18, 34, 50]) { g.beginPath(); for (let x = 0; x <= S; x += 4) g.lineTo(x, y + Math.sin(x / 6) * 4); g.stroke(); }
  } else if (t.kind === 'glass') {
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(10, 30); g.lineTo(30, 10); g.moveTo(18, 46); g.lineTo(46, 18); g.stroke();
    g.strokeStyle = 'rgba(2,136,209,0.6)'; g.lineWidth = 4; g.strokeRect(2, 2, S - 4, S - 4);
  } else if (t.kind === 'glow') {
    const r = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.5, '#fff176'); r.addColorStop(1, '#ffb300');
    g.fillStyle = r; g.fillRect(0, 0, S, S);
  } else if (t.kind === 'lava') {
    g.fillStyle = '#ffeb3b';
    for (const [x, y, rr] of [[16, 18, 7], [44, 26, 9], [24, 46, 8], [50, 52, 5]]) { g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
  } else if (t.kind === 'bounce') {
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath();
    for (let i = 0; i <= 6; i++) g.lineTo(i % 2 ? 44 : 20, 52 - i * 7);
    g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(12, 52, 40, 6); g.fillRect(12, 6, 40, 6);
  }
  const url = c.toDataURL();
  icons.set(t.name, url);
  return url;
}

export class BuildWorld {
  constructor(scene, phys, allowed = BuildWorld.defaultAllowed) {
    this.scene = scene;
    this.phys = phys;
    this.allowed = allowed;
    this.blocks = new Map();
    this.tmp = new THREE.Matrix4();
    const geo = new THREE.BoxGeometry(S, S, S);
    this.geo = geo;
    this.meshes = BLOCK_TYPES.map((t, k) => {
      const m = new THREE.InstancedMesh(geo, blockMaterial(t), BUILD.maxBlocks);
      m.count = 0;
      m.castShadow = t.kind !== 'glass';
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.userData = { keys: [], type: k };
      scene.add(m);
      return m;
    });
    // Vorschau-Klotz
    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(S * 1.02, S * 1.02, S * 1.02),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }));
    this.ghost.visible = false;
    scene.add(this.ghost);
  }

  static key(x, y, z) { return x + ',' + y + ',' + z; }

  static defaultAllowed(x, y, z) {
    return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
      x >= -BUILD.half && x < BUILD.half && z >= -BUILD.half && z < BUILD.half && y >= 0 && y < BUILD.maxY;
  }

  inRange(x, y, z) { return this.allowed(x, y, z); }

  center(x, y, z) { return [x * S + S / 2, y * S + S / 2, z * S + S / 2]; }

  place(x, y, z, k) {
    const key = BuildWorld.key(x, y, z);
    if (this.blocks.has(key) || !BLOCK_TYPES[k]) return false;
    const m = this.meshes[k];
    const idx = m.count++;
    const [cx, cy, cz] = this.center(x, y, z);
    this.tmp.makeTranslation(cx, cy, cz);
    m.setMatrixAt(idx, this.tmp);
    m.instanceMatrix.needsUpdate = true;
    m.boundingSphere = null;
    m.userData.keys[idx] = key;
    // Türen sind begehbar: kein Körper für die Physik
    const passable = BLOCK_TYPES[k].kind === 'door';
    const box = makeBox(cx, cy, cz, S, S, S, { k: BLOCK_TYPES[k].kind });
    if (!passable) this.phys.add(box);
    this.blocks.set(key, { x, y, z, k, idx, box, passable });
    return true;
  }

  remove(x, y, z) {
    const key = BuildWorld.key(x, y, z);
    const b = this.blocks.get(key);
    if (!b) return false;
    const m = this.meshes[b.k];
    const last = m.count - 1;
    if (b.idx !== last) {
      m.getMatrixAt(last, this.tmp);
      m.setMatrixAt(b.idx, this.tmp);
      const lk = m.userData.keys[last];
      m.userData.keys[b.idx] = lk;
      this.blocks.get(lk).idx = b.idx;
    }
    m.count--;
    m.userData.keys.length = m.count;
    m.instanceMatrix.needsUpdate = true;
    m.boundingSphere = null;
    if (!b.passable) this.phys.remove(b.box);
    this.blocks.delete(key);
    return true;
  }

  // Liefert Ziel-Zellen für Bauen und Löschen an einer Bildschirmposition.
  pick(raycaster, ground) {
    const objs = this.meshes.filter(m => m.count > 0);
    objs.push(ground);
    const hit = raycaster.intersectObjects(objs, false)[0];
    if (!hit || hit.distance > 80) return null;
    if (hit.object === ground) {
      const x = Math.floor(hit.point.x / S), z = Math.floor(hit.point.z / S);
      return { place: [x, 0, z], remove: null };
    }
    const key = hit.object.userData.keys[hit.instanceId];
    const b = this.blocks.get(key);
    if (!b) return null;
    const n = hit.face.normal;
    return {
      place: [b.x + Math.round(n.x), b.y + Math.round(n.y), b.z + Math.round(n.z)],
      remove: [b.x, b.y, b.z],
    };
  }

  overlapsPlayer(x, y, z, p) {
    const [cx, cy, cz] = this.center(x, y, z);
    const h = PLAYER.half;
    return Math.abs(cx - p.x) < S / 2 + h && Math.abs(cz - p.z) < S / 2 + h && cy + S / 2 > p.y && cy - S / 2 < p.y + PLAYER.height;
  }

  dispose() {
    for (const m of this.meshes) { m.material.dispose(); m.dispose(); }
    this.geo.dispose();
    this.ghost.geometry.dispose();
    this.ghost.material.dispose();
  }
}
