// Fasst viele kleine einfarbige Teile einer Gruppe zu einem einzigen Mesh zusammen (viel schneller zu zeichnen).
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const vcMaterial = toonMat({ vertexColors: true });
const tmpColor = new THREE.Color();

function mergeable(o) {
  if (!o.isMesh || Array.isArray(o.material)) return false;
  const m = o.material;
  return !m.map && !m.transparent && !(m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex() !== 0) && m.side !== THREE.DoubleSide;
}

// Nur direkte Kinder der Gruppe werden zusammengefasst (damit Gelenke beweglich bleiben).
export function mergeChildren(group, castShadow = true) {
  const list = group.children.filter(mergeable);
  if (list.length < 2) return null;
  const geos = [];
  // Haben alle Teile einen Index, bleibt er erhalten (eine Kugel ohne Index hätte 5x so viele Ecken)
  const indexed = list.every(m => m.geometry.index);
  for (const mesh of list) {
    mesh.updateMatrix();
    let g = mesh.geometry.index && !indexed ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(mesh.matrix);
    tmpColor.copy(mesh.material.color);
    const n = g.attributes.position.count;
    const col = new Uint8Array(n * 3);
    const cr = Math.round(tmpColor.r * 255), cg = Math.round(tmpColor.g * 255), cb = Math.round(tmpColor.b * 255);
    for (let i = 0; i < n; i++) { col[i * 3] = cr; col[i * 3 + 1] = cg; col[i * 3 + 2] = cb; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    g.clearGroups();
    geos.push(g);
  }
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!merged) return null;
  for (const mesh of list) group.remove(mesh);
  const m = new THREE.Mesh(merged, vcMaterial);
  m.castShadow = castShadow;
  m.userData.merged = true;
  group.add(m);
  return merged;
}

// Rekursiv für alle Untergruppen
export function mergeTree(root, castShadow = true) {
  const made = [];
  const visit = g => {
    for (const c of [...g.children]) if (c.isGroup || (c.isObject3D && !c.isMesh && !c.isSprite)) visit(c);
    const geo = mergeChildren(g, castShadow);
    if (geo) made.push(geo);
  };
  visit(root);
  return made;
}
