// Welt-Renderer: baut aus den Teilen wenige zusammengefasste Meshes (schnell auf dem Tablet),
// mit Texturen, die sich an der Weltgrösse ausrichten, sowie Schildern mit Schrift.
import * as THREE from 'three';
import { toonMat } from './toon.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getTexture } from './textures.js';

// Rundungen etwas feiner, damit die Umrisslinien keine Kanten-Facetten nachzeichnen
const SHAPES = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: p => (p.w > 1.2 ? new THREE.SphereGeometry(0.5, 16, 10) : new THREE.SphereGeometry(0.5, 10, 7)),
  cyl: p => new THREE.CylinderGeometry(0.5, 0.5, 1, p.w > 4 ? 32 : p.w > 1 ? 18 : 10),
  trunk: () => new THREE.CylinderGeometry(0.34, 0.5, 1, 10),
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

// Trickfilm-Look: mittelgrosse Klötze (Häuser, Möbel, Mauern) bekommen weich abgeschrägte Kanten.
// Nur für die Darstellung – die Physik rechnet weiter mit dem genauen Quader.
const SOFT_SKIP = new Set(['ground', 'baseplate', 'water', 'glass', 'ladder', 'zone', 'portal', 'checkpoint']);
function softBox(p) {
  if (p.shape || SOFT_SKIP.has(p.k)) return null;
  const w = p.w + (p.gw || 0), d = p.d + (p.gd || 0), min = Math.min(w, p.h, d);
  if (min < 0.6 || Math.max(w, p.h, d) > 40) return null;
  return new RoundedBoxGeometry(w, p.h, d, 1, Math.min(0.35, min * 0.2));
}

export function partGeometry(p, atOrigin = false) {
  let g;
  const lift = p.lift || 0;
  const q = atOrigin ? { ...p, x: 0, y: p.k === 'ramp' ? p.y : 0, z: 0 } : { ...p, y: p.y + lift };
  if (p.k === 'ramp') g = rampGeometry(lift && !atOrigin ? { ...q, y0: p.y0 + lift, y1: p.y1 + lift } : q);
  else {
    g = softBox(p);
    if (!g) {
      g = SHAPES[p.shape || 'box'](p);
      g.scale(p.w + (p.gw || 0), p.h, p.d + (p.gd || 0));
    }
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

// Teile ohne Leuchten/Durchsicht/Spezialboden tragen ihre Farbe als Eckenfarbe: dann können alle Teile
// mit derselben Oberfläche (Textur) zusammen gezeichnet werden, egal welche Farbe sie haben (viel flüssiger).
const SPECIAL = new Set(['lava', 'bounce', 'goal', 'water', 'glass', 'dance']);
const vertexColored = p => !p.emissive && !p.opacity && !SPECIAL.has(p.k);

function materialKey(p) {
  const big = p.w * p.d > 2500 || p.k === 'ground' || p.k === 'water' || p.noShadow;
  return [vertexColored(p) ? 'vc' : p.c, p.tex || '', p.k === 'lava' || p.k === 'bounce' || p.k === 'goal' || p.k === 'water' || p.k === 'glass' ? p.k : '', p.emissive || '', p.opacity || '', big ? 'n' : 's', p.texScale || 1].join('|');
}

export function makeMaterial(p, vc = false) {
  const o = vc ? { color: '#ffffff', vertexColors: true } : { color: p.c };
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
  return toonMat(o);
}

// Gegen Flackern (Z-Fighting): Liegen zwei verschieden aussehende Flächen (fast) auf derselben Höhe übereinander,
// wird die kleinere für die Darstellung etwas angehoben (p.lift). Physik und Laufhöhe bleiben unverändert.
const LIFT_GAP = 0.05, LIFT_STEP = 0.06;
export function fixCoplanar(parts) {
  const items = [];
  for (const p of parts) {
    p.lift = 0;
    if (p.invisible || p.k === 'sign' || p.m || ['sphere', 'cone', 'hemi'].includes(p.shape) || p.rx || p.rz || p.ry) continue;
    if (p.k === 'ramp' && p.y0 !== p.y1) continue;
    const top = p.k === 'ramp' ? p.y0 : p.y + p.h / 2;
    items.push({ p, top, area: p.w * p.d, x0: p.x - p.w / 2, x1: p.x + p.w / 2, z0: p.z - p.d / 2, z1: p.z + p.d / 2, look: p.c + '|' + (p.tex || '') });
  }
  // grosse Flächen zuerst (bleiben unten), kleinere darüber
  items.sort((a, b) => b.area - a.area);
  const C = 16, grid = new Map(), bigs = [];
  const cells = it => { const r = []; for (let gx = Math.floor(it.x0 / C); gx <= Math.floor(it.x1 / C); gx++) for (let gz = Math.floor(it.z0 / C); gz <= Math.floor(it.z1 / C); gz++) r.push(gx + ',' + gz); return r; };
  for (const it of items) {
    const near = new Set(bigs);
    const big = it.area > 40000;
    if (!big) for (const k of cells(it)) for (const o of grid.get(k) || []) near.add(o);
    let eff = it.top;
    for (let guard = 0; guard < 20; guard++) {
      let bump = null;
      for (const o of near) {
        if (o.look === it.look || Math.abs(o.top + o.p.lift - eff) >= LIFT_GAP) continue;
        if (Math.min(it.x1, o.x1) - Math.max(it.x0, o.x0) <= 0.05 || Math.min(it.z1, o.z1) - Math.max(it.z0, o.z0) <= 0.05) continue;
        bump = Math.max(bump ?? -Infinity, o.top + o.p.lift + LIFT_STEP);
      }
      if (bump == null) break;
      eff = Math.max(eff, bump);
    }
    it.p.lift = eff - it.top;
    if (big) bigs.push(it);
    else for (const k of cells(it)) (grid.get(k) || grid.set(k, []).get(k)).push(it);
  }
  fixWalls(parts);
  return parts;
}

// Senkrechte Flächen genau in derselben Ebene (z.B. Pfosten und Schildtafel): das kleinere Teil wird minimal dicker gezeichnet
function fixWalls(parts) {
  const vis = parts.filter(p => !p.invisible && p.k !== 'sign' && p.k !== 'ramp' && !p.m && !p.shape && !p.rx && !p.ry && !p.rz && p.w * p.d < 40000);
  for (const p of vis) { p.gw = 0; p.gd = 0; }
  const grid = new Map(), C = 16;
  for (const p of vis) for (let gx = Math.floor((p.x - p.w / 2) / C); gx <= Math.floor((p.x + p.w / 2) / C); gx++) for (let gz = Math.floor((p.z - p.d / 2) / C); gz <= Math.floor((p.z + p.d / 2) / C); gz++) (grid.get(gx + ',' + gz) || grid.set(gx + ',' + gz, []).get(gx + ',' + gz)).push(p);
  // mehrere Durchgänge: bis keine zwei verschiedenfarbigen Wandflächen mehr bündig liegen
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const list of grid.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.c === b.c && (a.tex || '') === (b.tex || '')) continue;
      const ya = a.y + a.lift, yb = b.y + b.lift;
      if (Math.min(ya + a.h / 2, yb + b.h / 2) - Math.max(ya - a.h / 2, yb - b.h / 2) <= 0.05) continue;
      for (const [ax, sz, g, ox, osz] of [['x', 'w', 'gw', 'z', 'd'], ['z', 'd', 'gd', 'x', 'w']]) {
        if (Math.min(a[ox] + a[osz] / 2, b[ox] + b[osz] / 2) - Math.max(a[ox] - a[osz] / 2, b[ox] - b[osz] / 2) <= 0.05) continue;
        const same = s => Math.abs((a[ax] + s * (a[sz] + a[g]) / 2) - (b[ax] + s * (b[sz] + b[g]) / 2)) < 0.02;
        if (!same(-1) && !same(1)) continue;
        const va = a.w * a.h * a.d, vb = b.w * b.h * b.d;
        const small = va < vb || (va === vb && a[g] <= b[g]) ? a : b;
        small[g] += 0.06;
        changed = true;
      }
    }
    if (!changed) break;
  }
}

// Baut alle statischen Teile zusammengefasst. Gibt die Teile zurück, die ein eigenes Mesh brauchen.
const tmpColor = new THREE.Color();
export function buildStatic(parts, scene, disposables) {
  fixCoplanar(parts);
  const groups = new Map();
  const own = [];
  for (const p of parts) {
    if (p.invisible || p.k === 'sign') continue;
    if (needsOwnMesh(p)) { own.push(p); continue; }
    const big = p.w > 70 || p.d > 70;
    const chunk = big ? 'all' : `${Math.floor(p.x / 64)},${Math.floor(p.z / 64)}`;
    const key = materialKey(p) + '#' + chunk;
    if (!groups.has(key)) groups.set(key, { p, geos: [] });
    const geo = partGeometry(p);
    if (vertexColored(p)) {
      const c = tmpColor.set(p.c), n = geo.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    groups.get(key).geos.push(geo);
  }
  const meshes = [];
  for (const [key, { p, geos }] of groups) {
    // Abgerundete Klötze haben keinen Index: dann alle Teile der Gruppe ohne Index zusammenfassen
    if (geos.some(g => !g.index) && geos.some(g => g.index)) {
      for (let i = 0; i < geos.length; i++) if (geos[i].index) { const n = geos[i].toNonIndexed(); geos[i].dispose(); geos[i] = n; }
    }
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const mat = makeMaterial(p, vertexColored(p));
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
