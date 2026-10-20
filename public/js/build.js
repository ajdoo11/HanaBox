// Bauwelt: Klötze effizient zeichnen (InstancedMesh) und mit der Physik verbinden.
import * as THREE from 'three';
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
  return new THREE.MeshLambertMaterial(opts);
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
