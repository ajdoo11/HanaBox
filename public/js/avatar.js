// Figur im Roblox-Stil (abgerundete Klötze) mit Gesicht, Frisuren, Kleidung, Hüten, Accessoires.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from './shared.js';
import { mergeTree } from './merge.js';

const geoCache = new Map();
function RB(w, h, d, r = 0.08) {
  const k = `rb${w},${h},${d},${r}`;
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
  return geoCache.get(k);
}
const SPHERE = new THREE.SphereGeometry(1, 18, 12);
const CONE = new THREE.ConeGeometry(1, 1, 18);
const CONE4 = new THREE.ConeGeometry(1, 1, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
const HEMI = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const TORUS = new THREE.TorusGeometry(1, 0.12, 8, 24);
const RING = new THREE.TorusGeometry(0.95, 0.09, 8, 28);
const SKIRT = new THREE.CylinderGeometry(0.52, 0.78, 0.6, 20, 1, true);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Gesicht ----------
export function drawFace(ctx, face, skin, eyeColor = '#5d4037') {
  const S = 256;
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, S, S);
  ctx.translate(128, 120);
  ctx.scale(1.18, 1.18);
  ctx.translate(-128, -120);
  const dark = '#2b1d14';
  const eye = (x, y, big = 1, lashes = false) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(x, y, 17 * big, 22 * big, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 12 * big, 16 * big, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(x + 1, y + 4, 6 * big, 8 * big, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + 6 * big, y - 4 * big, 5 * big, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 4 * big, y + 9 * big, 2.5 * big, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y, 17 * big, 22 * big, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    if (lashes) {
      ctx.lineWidth = 4;
      for (const a of [-0.35, 0, 0.35]) {
        const sx = x + Math.sin(a) * 17 * big * (x < 128 ? -1 : 1);
        ctx.beginPath(); ctx.moveTo(sx, y - 20 * big); ctx.lineTo(sx + (x < 128 ? -6 : 6), y - 30 * big); ctx.stroke();
      }
    }
  };
  const brows = (dy = 0, tilt = 0) => {
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(70, 72 + dy - tilt); ctx.lineTo(102, 68 + dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(154, 68 + dy); ctx.lineTo(186, 72 + dy - tilt); ctx.stroke();
  };
  const blush = () => {
    ctx.fillStyle = 'rgba(255,105,135,0.35)';
    ctx.beginPath(); ctx.ellipse(60, 150, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(196, 150, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
  };
  const smile = (w = 34, y = 150) => {
    ctx.strokeStyle = dark; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(128, y - 22, w, 0.22 * Math.PI, 0.78 * Math.PI); ctx.stroke();
  };
  const closedEye = (x, y) => { ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y + 6, 14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); };
  switch (face) {
    case 1: // Grinsen
      brows(); eye(86, 108); eye(170, 108); blush();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(84, 146); ctx.quadraticCurveTo(128, 205, 172, 146); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(96, 147, 64, 12);
      ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.ellipse(128, 175, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 2: // Zwinkern
      brows(); closedEye(86, 108); eye(170, 108); blush(); smile();
      break;
    case 3: // Katze
      eye(86, 108); eye(170, 108); blush();
      ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.moveTo(118, 136); ctx.lineTo(138, 136); ctx.lineTo(128, 147); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(128, 147); ctx.quadraticCurveTo(116, 166, 104, 152); ctx.moveTo(128, 147); ctx.quadraticCurveTo(140, 166, 152, 152); ctx.stroke();
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) for (const dy of [-6, 6]) { ctx.beginPath(); ctx.moveTo(128 + s * 44, 146 + dy); ctx.lineTo(128 + s * 84, 140 + dy * 2); ctx.stroke(); }
      break;
    case 4: // Staunen
      brows(-8); eye(86, 108, 1.15); eye(170, 108, 1.15);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(128, 168, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 5: // Cool
      ctx.fillStyle = '#111';
      roundRect(ctx, 52, 86, 70, 42, 14); ctx.fill();
      roundRect(ctx, 134, 86, 70, 42, 14); ctx.fill();
      ctx.fillRect(116, 94, 24, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(62, 92, 20, 6); ctx.fillRect(144, 92, 20, 6);
      ctx.strokeStyle = dark; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(100, 166); ctx.quadraticCurveTo(140, 180, 168, 152); ctx.stroke();
      break;
    case 6: { // Verliebt
      const heart = (cx, cy) => {
        ctx.fillStyle = '#e91e63';
        ctx.beginPath(); ctx.moveTo(cx, cy + 16);
        ctx.bezierCurveTo(cx - 30, cy - 4, cx - 14, cy - 26, cx, cy - 10);
        ctx.bezierCurveTo(cx + 14, cy - 26, cx + 30, cy - 4, cx, cy + 16); ctx.fill();
      };
      heart(86, 110); heart(170, 110); blush(); smile(30);
      break;
    }
    case 7: // Frech
      brows(0, 6); eye(86, 108); closedEye(170, 108); blush(); smile(30);
      ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.ellipse(140, 160, 13, 16, 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    case 8: // Müde
      closedEye(86, 112); closedEye(170, 112);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(128, 165, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 9: // Glitzeraugen
      eye(86, 106, 1.3, true); eye(170, 106, 1.3, true); blush();
      ctx.fillStyle = '#fff';
      for (const [x, y] of [[80, 98], [164, 98]]) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; const r = i % 2 ? 2 : 7; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.fill(); }
      smile(26, 158);
      break;
    case 10: // Wimpern
      eye(86, 108, 1.05, true); eye(170, 108, 1.05, true); blush();
      ctx.fillStyle = '#e57373'; ctx.beginPath(); ctx.ellipse(128, 156, 22, 9, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(128, 156, 22, 5, 0, Math.PI, Math.PI * 2); ctx.fill();
      break;
    default: // Lächeln
      brows(); eye(86, 108); eye(170, 108); blush(); smile();
  }
}

// ---------- Shirt ----------
function drawShirt(ctx, a, back) {
  const S = 128, c = a.shirt;
  ctx.fillStyle = c; ctx.fillRect(0, 0, S, S);
  const style = a.shirtStyle;
  const light = 'rgba(255,255,255,0.55)', dark = 'rgba(0,0,0,0.18)';
  switch (style) {
    case 1: ctx.fillStyle = light; for (let y = 8; y < S; y += 24) ctx.fillRect(0, y, S, 10); break;
    case 2: if (!back) { ctx.fillStyle = '#e91e63'; ctx.beginPath(); ctx.moveTo(64, 92); ctx.bezierCurveTo(20, 60, 40, 28, 64, 50); ctx.bezierCurveTo(88, 28, 108, 60, 64, 92); ctx.fill(); } break;
    case 3: if (!back) { ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const ang = (i * Math.PI) / 5 - Math.PI / 2; const r = i % 2 ? 13 : 30; ctx.lineTo(64 + Math.cos(ang) * r, 62 + Math.sin(ang) * r); } ctx.fill(); } break;
    case 4: { const cols = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#d500f9']; cols.forEach((cc, i) => { ctx.fillStyle = cc; ctx.fillRect(0, 20 + i * 15, S, 15); }); break; }
    case 5: if (!back) { ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(64, 60, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f48fb1'; for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc(64 + Math.cos(ang) * 18, 60 + Math.sin(ang) * 18, 11, 0, Math.PI * 2); ctx.fill(); } } break;
    case 6: ctx.fillStyle = light; for (let y = 12; y < S; y += 28) for (let x = 12 + ((y / 28) % 2) * 14; x < S; x += 28) { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); } break;
    case 7: // Kittel
      if (!back) {
        ctx.fillStyle = dark; ctx.fillRect(62, 20, 4, S);
        ctx.fillStyle = '#b0bec5'; for (const y of [44, 70, 96]) { ctx.beginPath(); ctx.arc(72, y, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.strokeRect(84, 62, 24, 26);
        ctx.fillStyle = '#1e88e5'; ctx.fillRect(90, 54, 4, 16);
        ctx.fillStyle = '#90caf9'; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(64, 34); ctx.lineTo(84, 0); ctx.fill();
      }
      break;
    case 8: { ctx.fillStyle = '#fff'; let s = 7; for (let i = 0; i < 60; i++) { s = (s * 16807) % 2147483647; const x = s % S; s = (s * 16807) % 2147483647; const y = s % S; ctx.globalAlpha = 0.5 + (i % 3) * 0.2; ctx.fillRect(x, y, 3, 3); } ctx.globalAlpha = 1; break; }
    case 9: // Jacke
      if (!back) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(44, 0, 40, S);
        ctx.fillStyle = '#ec407a'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥', 64, 60);
        ctx.fillStyle = dark; ctx.fillRect(40, 0, 4, S); ctx.fillRect(84, 0, 4, S);
        ctx.fillStyle = light; ctx.fillRect(12, 70, 22, 4); ctx.fillRect(94, 70, 22, 4);
      } else { ctx.fillStyle = light; ctx.fillRect(20, 40, 88, 6); }
      break;
    case 10: // Kleid (Oberteil)
      ctx.fillStyle = light; ctx.fillRect(0, 96, S, 8);
      if (!back) { ctx.fillStyle = '#fff'; for (const x of [52, 64, 76]) { ctx.beginPath(); ctx.arc(x, 30, 4, 0, Math.PI * 2); ctx.fill(); } }
      break;
  }
  if (!back && style !== 7 && style !== 9) { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(64, 0, 22, 12, 0, 0, Math.PI); ctx.fill(); }
}

function lam(c, extra = {}) { return new THREE.MeshLambertMaterial({ color: c, ...extra }); }

export class Character {
  constructor(avatar, name, opts = {}) {
    this.a = { ...DEFAULT_AVATAR, ...avatar };
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.t = Math.random() * 10;
    this.walkPhase = 0;
    this.mats = [];
    this.texs = [];
    this.bot = !!opts.bot;
    this.build(this.a);
    this.mergedGeos = mergeTree(this.body);
    this.ring = new THREE.Mesh(RING, this.m('#ff1744', { emissive: '#ff1744', emissiveIntensity: 0.6 }));
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.08;
    this.ring.visible = false;
    this.root.add(this.ring);
    if (name != null) this.setName(name);
  }

  m(c, extra) { const mt = lam(c, extra); this.mats.push(mt); return mt; }

  part(geo, sx, sy, sz, mat, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  rb(w, h, d, mat, x, y, z, parent, r = 0.08) { return this.part(RB(w, h, d, r), 1, 1, 1, mat, x, y, z, parent); }

  canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    this.texs.push(t);
    return t;
  }

  build(a) {
    const skin = this.m(a.skin), pants = this.m(a.pants), shoes = this.m(a.shoes), hairM = this.m(a.hairColor);
    const shirt = this.m(a.shirt);
    const b = this.body;
    const ps = a.pantsStyle;
    // Beine
    this.legL = new THREE.Group(); this.legL.position.set(-0.24, 1.05, 0); b.add(this.legL);
    this.legR = new THREE.Group(); this.legR.position.set(0.24, 1.05, 0); b.add(this.legR);
    for (const leg of [this.legL, this.legR]) {
      if (ps === 1) { // Shorts
        this.rb(0.44, 0.42, 0.46, pants, 0, -0.21, 0, leg);
        this.rb(0.4, 0.5, 0.42, skin, 0, -0.62, 0, leg);
      } else if (ps === 2) { // Rock: Beine mit Strümpfen
        this.rb(0.38, 0.9, 0.4, skin, 0, -0.47, 0, leg);
        this.rb(0.4, 0.35, 0.42, this.m('#ffffff'), 0, -0.72, 0, leg);
      } else {
        this.rb(0.44, 0.92, 0.46, pants, 0, -0.46, 0, leg);
      }
      this.rb(0.46, 0.22, 0.6, shoes, 0, -0.94, 0.06, leg, 0.07);
    }
    // Rumpf mit Shirt-Bild
    const front = this.m('#ffffff', { map: this.canvasTex(128, 128, ctx => drawShirt(ctx, a, false)) });
    const back = this.m('#ffffff', { map: this.canvasTex(128, 128, ctx => drawShirt(ctx, a, true)) });
    const torso = new THREE.Mesh(RB(1.0, 1.0, 0.52, 0.1), [shirt, shirt, shirt, shirt, front, back]);
    torso.position.y = 1.55;
    torso.castShadow = true;
    b.add(torso);
    if (ps === 2) {
      const sk = this.part(SKIRT, 1, 1, 1, this.m(a.pants, { side: THREE.DoubleSide }), 0, 1.0, 0, b);
      sk.scale.set(1, 1, 0.75);
    }
    if (ps === 3) { // Latzhose
      this.rb(0.7, 0.45, 0.54, pants, 0, 1.25, 0, b, 0.05);
      this.rb(0.12, 0.55, 0.55, pants, -0.3, 1.7, 0, b, 0.03);
      this.rb(0.12, 0.55, 0.55, pants, 0.3, 1.7, 0, b, 0.03);
    }
    // Arme
    this.armL = new THREE.Group(); this.armL.position.set(-0.72, 1.98, 0); b.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.72, 1.98, 0); b.add(this.armR);
    for (const arm of [this.armL, this.armR]) {
      this.rb(0.42, 0.5, 0.44, shirt, 0, -0.22, 0, arm);
      this.rb(0.38, 0.52, 0.4, a.sleeve === 1 ? shirt : skin, 0, -0.68, 0, arm);
      if (a.sleeve === 1) this.rb(0.36, 0.16, 0.38, skin, 0, -0.98, 0, arm, 0.06);
    }
    // Kopf
    const head = new THREE.Group();
    head.position.set(0, 2.05, 0);
    b.add(head);
    this.head = head;
    const faceTex = this.canvasTex(256, 256, ctx => drawFace(ctx, a.face, a.skin, AVATAR_OPTIONS.eyes[a.eyes] || '#5d4037'));
    const faceM = this.m('#ffffff', { map: faceTex });
    const hm = new THREE.Mesh(RB(0.8, 0.76, 0.74, 0.16), [skin, skin, skin, skin, faceM, skin]);
    hm.position.y = 0.4;
    hm.castShadow = true;
    head.add(hm);
    this.buildHair(a, head, hairM);
    this.buildHat(a, head);
    this.buildAcc(a, head, b);
  }

  buildHair(a, h, hair) {
    const style = a.hair;
    if (!style) return;
    const cap = () => this.rb(0.88, 0.24, 0.82, hair, 0, 0.76, -0.02, h, 0.1);
    const bangs = () => this.rb(0.86, 0.16, 0.14, hair, 0, 0.68, 0.34, h, 0.06);
    const backShort = () => { this.rb(0.88, 0.55, 0.16, hair, 0, 0.5, -0.4, h, 0.07); this.rb(0.1, 0.38, 0.62, hair, -0.44, 0.58, -0.06, h, 0.04); this.rb(0.1, 0.38, 0.62, hair, 0.44, 0.58, -0.06, h, 0.04); };
    switch (style) {
      case 1: cap(); backShort(); break;
      case 2: cap(); bangs(); this.rb(0.92, 1.3, 0.2, hair, 0, 0.12, -0.42, h, 0.09); this.rb(0.13, 1.0, 0.56, hair, -0.46, 0.25, -0.1, h, 0.06); this.rb(0.13, 1.0, 0.56, hair, 0.46, 0.25, -0.1, h, 0.06); break;
      case 3: cap(); bangs(); backShort();
        for (const s of [-1, 1]) { this.part(SPHERE, 0.2, 0.2, 0.2, hair, s * 0.56, 0.55, -0.12, h); this.rb(0.24, 0.62, 0.24, hair, s * 0.6, 0.15, -0.12, h, 0.1); this.part(SPHERE, 0.07, 0.07, 0.07, this.m('#f06292'), s * 0.55, 0.52, -0.02, h); }
        break;
      case 4: cap(); bangs(); backShort(); this.part(SPHERE, 0.26, 0.24, 0.26, hair, 0, 0.98, -0.18, h); break;
      case 5: cap(); bangs(); backShort();
        this.part(SPHERE, 0.09, 0.09, 0.09, this.m('#f06292'), 0, 0.62, -0.5, h);
        this.part(RB(0.26, 0.85, 0.26, 0.12), 1, 1, 1, hair, 0, 0.2, -0.62, h, 0.35); break;
      case 6: { cap(); bangs(); backShort(); // langer Zopf
        const n = 8;
        for (let i = 0; i < n; i++) {
          const s = 0.2 - i * 0.012;
          this.part(SPHERE, s, s * 1.1, s, hair, (i % 2 ? 0.04 : -0.04), 0.45 - i * 0.24, -0.5 - Math.min(i, 3) * 0.04, h);
        }
        this.part(SPHERE, 0.08, 0.08, 0.08, this.m('#ffeb3b'), 0, 0.45 - n * 0.24 + 0.1, -0.6, h);
        break; }
      case 7: cap(); bangs(); this.rb(0.14, 0.66, 0.74, hair, -0.47, 0.42, -0.02, h, 0.07); this.rb(0.14, 0.66, 0.74, hair, 0.47, 0.42, -0.02, h, 0.07); this.rb(0.94, 0.66, 0.16, hair, 0, 0.42, -0.42, h, 0.07); break;
      case 8: { // Locken
        const pts = [[0, 0.86, 0], [-0.3, 0.8, 0.1], [0.3, 0.8, 0.1], [-0.42, 0.55, -0.1], [0.42, 0.55, -0.1], [0, 0.75, -0.3], [-0.3, 0.45, -0.38], [0.3, 0.45, -0.38], [0, 0.35, -0.45], [-0.25, 0.85, -0.2], [0.25, 0.85, -0.2], [0, 0.66, 0.3]];
        for (const [x, y, z] of pts) this.part(SPHERE, 0.23, 0.23, 0.23, hair, x, y, z, h);
        break; }
      case 9: cap(); backShort(); for (let i = 0; i < 7; i++) this.part(CONE, 0.13, 0.34, 0.13, hair, -0.33 + i * 0.11, 0.98, -0.05 + ((i % 2) - 0.5) * 0.2, h, -0.2 + (i % 2) * 0.4, 0, (i - 3) * -0.12); break;
    }
  }

  buildHat(a, h) {
    const top = 0.78;
    switch (a.hat) {
      case 1: { const c = this.m('#e53935'); this.rb(0.9, 0.26, 0.86, c, 0, top + 0.1, 0, h, 0.1); this.rb(0.8, 0.06, 0.44, c, 0, top + 0.0, 0.54, h, 0.03); break; }
      case 2: {
        const g = this.m('#ffc107', { emissive: '#7a5500', emissiveIntensity: 0.4 });
        this.part(CYL, 0.34, 0.2, 0.34, g, 0, top + 0.1, 0, h);
        for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; this.part(CONE4, 0.07, 0.2, 0.07, g, Math.sin(ang) * 0.3, top + 0.28, Math.cos(ang) * 0.3, h); }
        this.part(SPHERE, 0.06, 0.06, 0.06, this.m('#e91e63'), 0, top + 0.12, 0.35, h);
        break;
      }
      case 3: { const w = this.m('#ffffff'), p = this.m('#f8bbd0'); for (const s of [-1, 1]) { this.rb(0.16, 0.7, 0.1, w, s * 0.2, top + 0.35, 0, h, 0.06); this.rb(0.08, 0.5, 0.02, p, s * 0.2, top + 0.35, 0.05, h, 0.01); } break; }
      case 4: { const c = this.m(a.hairColor); for (const s of [-1, 1]) this.part(CONE4, 0.17, 0.3, 0.17, c, s * 0.26, top + 0.12, 0, h, 0, Math.PI / 4); break; }
      case 5: { const y = this.m('#ffeb3b'), pk = this.m('#f06292'); this.part(SPHERE, 0.07, 0.07, 0.07, y, 0.32, top - 0.06, 0.2, h); for (let i = 0; i < 5; i++) { const ang = (i / 5) * Math.PI * 2; this.part(SPHERE, 0.08, 0.08, 0.05, pk, 0.32 + Math.cos(ang) * 0.11, top - 0.06 + Math.sin(ang) * 0.11, 0.2, h); } break; }
      case 6: { const pu = this.m('#7e57c2'); this.part(CYL, 0.58, 0.05, 0.58, pu, 0, top + 0.02, 0, h); this.part(CONE, 0.4, 0.9, 0.4, pu, 0, top + 0.47, 0, h, -0.1); this.part(SPHERE, 0.06, 0.06, 0.06, this.m('#ffeb3b', { emissive: '#ffeb3b', emissiveIntensity: 0.6 }), 0.1, top + 0.4, 0.3, h); break; }
      case 7: { const r = this.m('#ff4081'); this.part(SPHERE, 0.18, 0.13, 0.07, r, -0.17, top + 0.06, 0.05, h, 0, 0, 0.4); this.part(SPHERE, 0.18, 0.13, 0.07, r, 0.17, top + 0.06, 0.05, h, 0, 0, -0.4); this.part(SPHERE, 0.07, 0.07, 0.07, r, 0, top + 0.06, 0.07, h); break; }
      case 8: { const w = this.m('#ffffff'); this.part(CYL, 0.38, 0.38, 0.38, w, 0, top + 0.2, 0, h); this.part(SPHERE, 0.46, 0.25, 0.46, w, 0, top + 0.44, 0, h); break; }
      case 9: { const r = this.m('#e53935'); this.part(HEMI, 0.48, 0.42, 0.5, r, 0, top - 0.08, 0, h); this.part(CYL, 0.56, 0.05, 0.6, r, 0, top - 0.06, -0.06, h); this.part(SPHERE, 0.08, 0.08, 0.04, this.m('#ffd600'), 0, top + 0.1, 0.46, h); break; }
      case 10: { const y = this.m('#ffca28'); this.part(HEMI, 0.47, 0.4, 0.47, y, 0, top - 0.06, 0, h); this.part(CYL, 0.55, 0.04, 0.55, y, 0, top - 0.05, 0.03, h); break; }
      case 11: { this.part(TORUS, 0.43, 0.43, 0.6, this.m('#eeeeee'), 0, top - 0.12, 0, h, Math.PI / 2); this.part(CYL, 0.13, 0.03, 0.13, this.m('#cfd8dc', { emissive: '#ffffff', emissiveIntensity: 0.3 }), 0, top - 0.06, 0.4, h, Math.PI / 2); break; }
      case 12: { const bl = this.m('#1e3a8a'); this.part(CYL, 0.46, 0.2, 0.46, bl, 0, top + 0.08, 0, h); this.rb(0.7, 0.05, 0.36, this.m('#111111'), 0, top - 0.02, 0.45, h, 0.02); this.part(SPHERE, 0.07, 0.07, 0.03, this.m('#ffd600'), 0, top + 0.1, 0.46, h); break; }
      case 13: { this.part(SPHERE, 0.66, 0.66, 0.66, this.m('#b3e5fc', { transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.42, 0, h); this.part(TORUS, 0.6, 0.6, 0.6, this.m('#eeeeee'), 0, 0.0, 0, h, Math.PI / 2); break; }
      case 14: { const g = this.m('#e1f5fe', { emissive: '#b3e5fc', emissiveIntensity: 0.4 }); this.part(TORUS, 0.36, 0.36, 0.3, g, 0, top - 0.02, 0, h, Math.PI / 2); for (const [x, s] of [[0, 0.1], [-0.15, 0.06], [0.15, 0.06]]) this.part(CONE4, s, s * 2, s * 0.5, g, x, top + 0.08, 0.34, h); this.part(SPHERE, 0.05, 0.05, 0.05, this.m('#f06292'), 0, top + 0.05, 0.37, h); break; }
      case 15: { const s = this.m('#f0d58c'); this.part(CYL, 0.8, 0.05, 0.8, s, 0, top, 0, h); this.part(CYL, 0.42, 0.25, 0.42, s, 0, top + 0.12, 0, h); this.part(CYL, 0.43, 0.06, 0.43, this.m('#e91e63'), 0, top + 0.05, 0, h); break; }
    }
  }

  buildAcc(a, h, b) {
    switch (a.acc) {
      case 1: case 2: {
        const m = this.m(a.acc === 2 ? '#111111' : '#6d4c41');
        for (const s of [-1, 1]) this.part(TORUS, 0.13, 0.13, 0.5, m, s * 0.17, 0.45, 0.39, h);
        this.rb(0.1, 0.03, 0.03, m, 0, 0.47, 0.39, h, 0.01);
        if (a.acc === 2) for (const s of [-1, 1]) this.part(CYL, 0.12, 0.02, 0.12, this.m('#212121', { transparent: true, opacity: 0.8 }), s * 0.17, 0.45, 0.39, h, Math.PI / 2);
        break;
      }
      case 3: { const m = this.m('#ec407a'); this.part(TORUS, 0.46, 0.46, 0.5, m, 0, 0.5, 0, h, 0, Math.PI / 2); for (const s of [-1, 1]) this.part(CYL, 0.16, 0.12, 0.16, m, s * 0.44, 0.42, 0, h, 0, 0, Math.PI / 2); break; }
      case 4: { const m = this.m('#ab47bc'); this.rb(0.8, 0.85, 0.32, m, 0, 1.55, -0.42, b, 0.12); this.rb(0.6, 0.3, 0.1, this.m('#ce93d8'), 0, 1.4, -0.6, b, 0.05); break; }
      case 5: case 9: {
        const m = this.m(a.acc === 5 ? '#ffffff' : '#e1bee7', a.acc === 9 ? { transparent: true, opacity: 0.75, emissive: '#f8bbd0', emissiveIntensity: 0.3 } : {});
        for (const s of [-1, 1]) {
          const w = this.part(SPHERE, 0.55, 0.32, 0.06, m, s * 0.55, 1.95, -0.38, b, 0, s * 0.35, s * -0.5);
          w.castShadow = false;
          this.part(SPHERE, 0.38, 0.22, 0.06, m, s * 0.45, 1.55, -0.38, b, 0, s * 0.35, s * 0.4);
        }
        break;
      }
      case 6: { const c = this.m('#c62828', { side: THREE.DoubleSide }); const cape = this.rb(1.05, 1.6, 0.06, c, 0, 1.25, -0.32, b, 0.03); cape.rotation.x = 0.12; break; }
      case 7: { this.part(TORUS, 0.32, 0.32, 0.3, this.m('#ffd54f'), 0, 2.02, 0.05, b, Math.PI / 2 - 0.3); this.part(SPHERE, 0.06, 0.08, 0.04, this.m('#e91e63'), 0, 1.86, 0.3, b); break; }
      case 8: { this.rb(0.62, 0.3, 0.06, this.m('#81d4fa'), 0, 0.26, 0.38, h, 0.04); break; }
    }
  }

  makeLabel(text, h, font, fg, bg, pad) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = font;
    const tw = ctx.measureText(text).width;
    c.width = Math.ceil(tw + pad * 2);
    c.height = h;
    ctx.font = font;
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, c.width, c.height, h / 2.4);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.renderOrder = 999;
    return { sprite: sp, aspect: c.width / c.height };
  }

  setName(name, it = false) {
    const hidden = this.tag && !this.tag.visible && !it;
    if (this.tag) { this.root.remove(this.tag); this.tag.material.map.dispose(); this.tag.material.dispose(); }
    const label = (this.bot ? '🤖 ' : '') + (it ? `${name} – ES!` : name);
    const { sprite, aspect } = this.makeLabel(label, 64, 'bold 34px system-ui, sans-serif', '#fff', it ? 'rgba(220,20,60,0.85)' : this.bot ? 'rgba(80,60,140,0.6)' : 'rgba(0,0,0,0.45)', 18);
    sprite.scale.set(0.5 * aspect, 0.5, 1);
    sprite.position.y = 3.35;
    this.root.add(sprite);
    this.tag = sprite;
    if (hidden) sprite.visible = false;
    this.name = name;
  }

  setIt(on) {
    this.ring.visible = on;
    this.setName(this.name, on);
  }

  say(text) {
    if (this.bubble) { this.root.remove(this.bubble); this.bubble.material.map.dispose(); this.bubble.material.dispose(); }
    const { sprite, aspect } = this.makeLabel(text, 80, 'bold 44px system-ui, sans-serif', '#222', 'rgba(255,255,255,0.95)', 26);
    sprite.scale.set(0.75 * aspect, 0.75, 1);
    sprite.position.y = 4.05;
    this.root.add(sprite);
    this.bubble = sprite;
    this.bubbleT = 5;
  }

  update(dt, anim = 'idle', speed = 0) {
    this.t += dt;
    const t = this.t;
    let la = 0, ra = 0, ll = 0, rl = 0, laz = 0, raz = 0, by = 0, bry = 0, brx = 0, bz = 0, hx = 0;
    switch (anim) {
      case 'walk': {
        this.walkPhase += dt * Math.max(4, speed * 1.25);
        const s = Math.sin(this.walkPhase) * 0.85;
        la = s; ra = -s; ll = -s; rl = s;
        by = Math.abs(Math.cos(this.walkPhase)) * 0.06;
        break;
      }
      case 'jump': la = ra = -2.7; ll = -0.35; rl = 0.25; break;
      case 'fall': la = ra = -2.9; laz = -0.3; raz = 0.3; ll = 0.2; rl = -0.2; break;
      case 'dance':
        laz = -(2.4 + Math.sin(t * 8) * 0.5); raz = 2.4 + Math.sin(t * 8 + Math.PI) * 0.5;
        by = Math.abs(Math.sin(t * 8)) * 0.18; bry = Math.sin(t * 3) * 0.7;
        ll = Math.sin(t * 8) * 0.3; rl = -ll;
        break;
      case 'wave': raz = 2.7 + Math.sin(t * 10) * 0.35; la = Math.sin(t * 2) * 0.05; break;
      case 'sit': ll = rl = -1.5; la = ra = -0.4; by = -0.95; break;
      case 'drive': ll = rl = -1.45; la = ra = -1.25; by = -0.95; break;
      case 'bike': { const s = Math.sin(t * Math.max(2, speed)) * 0.5; ll = -1.1 + s; rl = -1.1 - s; la = ra = -1.3; by = -0.75; brx = 0.2; break; }
      case 'stand': la = ra = -1.2; ll = -0.1; rl = 0.1; break;
      case 'sleep': brx = -Math.PI / 2; by = 0.3; bz = 1.45; la = ra = -0.1; break;
      case 'eat': ra = -2.2 + Math.sin(t * 12) * 0.25; raz = 0.5; la = -1.2; break;
      case 'climb': { const s = Math.sin(t * 9); la = -2.8 + s * 0.5; ra = -2.8 - s * 0.5; ll = -0.6 - s * 0.5; rl = -0.6 + s * 0.5; break; }
      case 'carried': ll = rl = -1.4; laz = -(2.2 + Math.sin(t * 10) * 0.4); raz = 2.2 + Math.sin(t * 10 + 1) * 0.4; by = -0.95; break;
      default: la = Math.sin(t * 2) * 0.05; ra = -la; hx = Math.sin(t * 0.7) * 0.04;
    }
    if (this.holding && !['sleep', 'eat', 'dance', 'drive', 'bike', 'climb', 'carried'].includes(anim)) {
      la = ra = -1.35; laz = 0.25; raz = -0.25;
    }
    by += this.seatY || 0;
    bz += this.seatZ || 0;
    const k = 1 - Math.exp(-dt * 14);
    const ease = (o, prop, v) => { o.rotation[prop] += (v - o.rotation[prop]) * k; };
    ease(this.armL, 'x', la); ease(this.armR, 'x', ra);
    ease(this.armL, 'z', laz); ease(this.armR, 'z', raz);
    ease(this.legL, 'x', ll); ease(this.legR, 'x', rl);
    ease(this.body, 'y', bry);
    ease(this.body, 'x', brx);
    ease(this.head, 'x', hx);
    this.body.position.y += (by - this.body.position.y) * k;
    this.body.position.z += (bz - this.body.position.z) * k;
    if (this.ring.visible) this.ring.rotation.z += dt * 3;
    if (this.bubble) {
      this.bubbleT -= dt;
      this.bubble.material.opacity = Math.min(1, this.bubbleT);
      if (this.bubbleT <= 0) {
        this.root.remove(this.bubble);
        this.bubble.material.map.dispose();
        this.bubble.material.dispose();
        this.bubble = null;
      }
    }
  }

  dispose() {
    for (const g of this.mergedGeos || []) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const t of this.texs) t.dispose();
    for (const s of [this.tag, this.bubble]) if (s) { s.material.map.dispose(); s.material.dispose(); }
    this.root.removeFromParent();
  }
}
