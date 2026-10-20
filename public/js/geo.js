// Welt-Renderer: baut aus den Teilen wenige zusammengefasste Meshes (schnell auf dem Tablet),
// mit Texturen, die sich an der Weltgrösse ausrichten, sowie Schildern mit Schrift.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getTexture } from './textures.js';

const SHAPES = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: p => (p.w > 1.2 ? new THREE.SphereGeometry(0.5, 12, 8) : new THREE.SphereGeometry(0.5, 8, 6)),
  cyl: p => new THREE.CylinderGeometry(0.5, 0.5, 1, p.w > 4 ? 32 : p.w > 1 ? 16 : 8),
  cone: () => new THREE.ConeGeometry(0.5, 1, 12),
  hemi: () => new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
};

// Rampe/Keil aus 8 Ecken
function rampGeometry(p) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const lo = Math.min(p.y0, p.y1) - (p.thick ?? 0.3);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i) > 0 ? 1 : 0, sy = pos.getY(i) > 0 ? 1 : 0, sz = pos.getZ(i) > 0 ? 1 : 0;
    const x = sx ? p.x + p.w / 2 : p.x - p.w / 2;
    const z = sz ? p.z + p.d / 2 : p.z - p.d / 2;
    let t = p.axis === 'x' ? sx : sz;
    if (p.dir < 0) t = 1 - t;
    const top = p.y0 + (p.y1 - p.y0) * t;
    pos.setXYZ(i, x, sy ? top : (p.wedge === false ? top - (p.thick ?? 0.3) : lo), z);
  }
  g.computeVertexNormals();
  return g;
}

function boxUV(g, scale) {
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x / scale, z / scale);
    else if (nx >= nz) uv.setXY(i, z / scale, y / scale);
    else uv.setXY(i, x / scale, y / scale);
  }
}

export function partGeometry(p, atOrigin = false) {
  let g;
  const q = atOrigin ? { ...p, x: 0, y: p.k === 'ramp' ? p.y : 0, z: 0 } : p;
  if (p.k === 'ramp') g = rampGeometry(q);
  else {
    g = SHAPES[p.shape || 'box'](p);
    g.scale(p.w, p.h, p.d);
    if (p.rx) g.rotateX(p.rx);
    if (p.rz) g.rotateZ(p.rz);
    if (p.ry) g.rotateY(p.ry);
    g.translate(q.x, q.y, q.z);
  }
  const tex = getTexture(p.tex);
  if (tex) boxUV(g, (tex.userData.scale || 4) * (p.texScale || 1));
  return g;
}

export function needsOwnMesh(p) {
  return !!(p.m || p.k === 'dance' || p.k === 'checkpoint' || p.key || p.glow || p.own);
}

function materialKey(p) {
  const big = p.w * p.d > 2500 || p.k === 'ground' || p.k === 'water' || p.noShadow;
  return [p.c, p.tex || '', p.k === 'lava' || p.k === 'bounce' || p.k === 'goal' || p.k === 'water' || p.k === 'glass' ? p.k : '', p.emissive || '', p.opacity || '', big ? 'n' : 's', p.texScale || 1].join('|');
}

export function makeMaterial(p) {
  const o = { color: p.c };
  const tex = getTexture(p.tex);
  if (tex) o.map = tex;
  switch (p.k) {
    case 'lava': Object.assign(o, { emissive: '#ff3d00', emissiveIntensity: 0.7 }); break;
    case 'bounce': Object.assign(o, { emissive: '#00bcd4', emissiveIntensity: 0.3 }); break;
    case 'goal': Object.assign(o, { emissive: '#ffb300', emissiveIntensity: 0.35 }); break;
    case 'water': Object.assign(o, { transparent: true, opacity: 0.85 }); break;
    case 'glass': Object.assign(o, { transparent: true, opacity: 0.35, depthWrite: false }); break;
    case 'dance': Object.assign(o, { emissive: p.c, emissiveIntensity: 0.4 }); break;
  }
  if (p.emissive) Object.assign(o, { emissive: p.emissive, emissiveIntensity: p.emissiveIntensity ?? 0.8 });
  if (p.opacity) Object.assign(o, { transparent: true, opacity: p.opacity, depthWrite: false });
  return new THREE.MeshLambertMaterial(o);
}

// Baut alle statischen Teile zusammengefasst. Gibt die Teile zurück, die ein eigenes Mesh brauchen.
export function buildStatic(parts, scene, disposables) {
  const groups = new Map();
  const own = [];
  for (const p of parts) {
    if (p.invisible || p.k === 'sign') continue;
    if (needsOwnMesh(p)) { own.push(p); continue; }
    const big = p.w > 70 || p.d > 70;
    const chunk = big ? 'all' : `${Math.floor(p.x / 64)},${Math.floor(p.z / 64)}`;
    const key = materialKey(p) + '#' + chunk;
    if (!groups.has(key)) groups.set(key, { p, geos: [] });
    groups.get(key).geos.push(partGeometry(p));
  }
  const meshes = [];
  for (const [key, { p, geos }] of groups) {
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const mat = makeMaterial(p);
    const mesh = new THREE.Mesh(merged, mat);
    const shadow = key.split('|')[5] === 's';
    mesh.castShadow = shadow && p.k !== 'glass';
    mesh.receiveShadow = p.k !== 'water' && p.k !== 'glass';
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
    disposables.push(merged, mat);
    meshes.push(mesh);
    if (p.k === 'water' && mat.map) mesh.userData.water = true;
  }
  return { own, meshes };
}

// Schild mit Schrift (gut lesbar, beidseitig)
export function signMesh(p, disposables) {
  const W = 512;
  const H = Math.max(64, Math.round((W * p.h) / p.w));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = p.bg || '#ffffff';
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, Math.min(40, H / 3)); ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = p.border || 'rgba(0,0,0,0.12)'; ctx.stroke();
  let size = Math.floor(H * 0.62);
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(p.text).width > W * 0.9 && size > 10) { size -= 2; ctx.font = `900 ${size}px system-ui, sans-serif`; }
  ctx.fillStyle = p.fg || '#5e35b1';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.text, W / 2, H / 2 + size * 0.05);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const geo = new THREE.PlaneGeometry(p.w, p.h);
  disposables.push(tex, mat, geo);
  const g = new THREE.Group();
  const front = new THREE.Mesh(geo, mat);
  front.position.z = 0.02;
  g.add(front);
  if (p.both !== false) {
    const back = new THREE.Mesh(geo, mat);
    back.rotation.y = Math.PI;
    back.position.z = -0.02;
    g.add(back);
  }
  g.position.set(p.x, p.y, p.z);
  g.rotation.y = { 'z+': 0, 'z-': Math.PI, 'x+': Math.PI / 2, 'x-': -Math.PI / 2 }[p.face || 'z+'];
  return g;
}

// Leuchtender Ring am Boden (zeigt, wo man etwas tun kann)
const ringGeo = new THREE.RingGeometry(0.85, 1.1, 40);
ringGeo.rotateX(-Math.PI / 2);
export const ringMaterial = new THREE.MeshBasicMaterial({ color: '#76ff03', transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false });
export function ringMesh(x, y, z, scale = 1) {
  const m = new THREE.Mesh(ringGeo, ringMaterial);
  m.position.set(x, y + 0.04, z);
  m.scale.setScalar(scale);
  m.renderOrder = 2;
  return m;
}

// Himmel mit Farbverlauf
export function skyDome(top, bottom) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h;\nvoid main(){ float t = clamp(h*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, t),1.0);\n#include <colorspace_fragment>\n}',
  });
  mat.toneMapped = false;
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.renderOrder = -1;
  return m;
}
