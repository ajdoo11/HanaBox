// Prozedurale Oberflächen-Texturen. Sie sind hell/grau gezeichnet und werden mit der Teilfarbe eingefärbt.
import * as THREE from 'three';

const cache = new Map();

function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function make(size, scale, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.userData.scale = scale;
  return t;
}

function noise(ctx, S, n, seed, light = 0.08, dark = 0.08, size = 3) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() < 0.5 ? `rgba(0,0,0,${dark * r()})` : `rgba(255,255,255,${light * r() * 3})`;
    const s = 1 + Math.floor(r() * size);
    ctx.fillRect(Math.floor(r() * S), Math.floor(r() * S), s, s);
  }
}

const DRAW = {
  // Trickfilm-Stil: ruhige, flache Flächen mit wenigen klaren Details statt Rauschen
  grass: [6, (ctx, S) => {
    ctx.fillStyle = '#e6e6e6'; ctx.fillRect(0, 0, S, S);
    const r = rnd(3);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = r() * S, y = r() * S;
      ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 7); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(r() * S, r() * S, 10 + r() * 8, 5 + r() * 3, 0, 0, Math.PI * 2); ctx.fill(); }
  }],
  asphalt: [8, (ctx, S) => { ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, S, S); noise(ctx, S, 120, 5, 0.04, 0.12, 4); }],
  sand: [5, (ctx, S) => { ctx.fillStyle = '#ececec'; ctx.fillRect(0, 0, S, S); noise(ctx, S, 90, 7, 0.1, 0.1, 3); }],
  carpet: [2, (ctx, S) => { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, S, S); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, S - 20, S - 20); }],
  tiles: [2, (ctx, S) => {
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(8, 8, S / 3, 6);
  }],
  checker: [4, (ctx, S) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, S / 2, S / 2); ctx.fillRect(S / 2, S / 2, S / 2, S / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, S / 2, S / 2); ctx.strokeRect(S / 2, S / 2, S / 2, S / 2);
  }],
  brick: [3, (ctx, S) => {
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(0, 0, S, S);
    const rows = 8, bh = S / rows, bw = S / 4;
    const r = rnd(11);
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const off = y % 2 ? bw / 2 : 0;
      const g = 232 + Math.floor(r() * 14);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
    }
  }],
  wood: [3, (ctx, S) => {
    const r = rnd(13);
    const n = 6, w = S / n;
    for (let i = 0; i < n; i++) {
      const g = 215 + Math.floor(r() * 30);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(i * w, 0, w, S);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(i * w, 0, 3, S);
      ctx.fillRect(i * w, Math.floor(r() * S), w, 2);
    }
  }],
  stone: [4, (ctx, S) => {
    ctx.fillStyle = '#c4c4c4'; ctx.fillRect(0, 0, S, S);
    const r = rnd(17);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const g = 215 + Math.floor(r() * 35);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      const s = S / 4;
      ctx.beginPath(); ctx.roundRect(x * s + 3, y * s + 3, s - 6, s - 6, 8); ctx.fill();
    }
  }],
  hearts: [4, (ctx, S) => {
    ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const heart = (x, y, s) => {
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.3);
      ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s * 0.3);
      ctx.bezierCurveTo(x - s / 2, y + s * 0.6, x, y + s * 0.8, x, y + s);
      ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s * 0.6, x + s / 2, y + s * 0.3);
      ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s * 0.3); ctx.fill();
    };
    heart(S * 0.25, S * 0.1, S * 0.3); heart(S * 0.75, S * 0.55, S * 0.3); heart(S * 0.75, S * 0.0 - S * 0.45, S * 0.3);
  }],
  stars: [4, (ctx, S) => {
    ctx.fillStyle = '#e2e2e2'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const star = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      ctx.fill();
    };
    star(S * 0.25, S * 0.25, S * 0.12); star(S * 0.75, S * 0.75, S * 0.12); star(S * 0.75, S * 0.2, S * 0.06); star(S * 0.2, S * 0.75, S * 0.06);
  }],
  dots: [3, (ctx, S) => {
    ctx.fillStyle = '#e4e4e4'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.75]]) { ctx.beginPath(); ctx.arc(x * S, y * S, S * 0.1, 0, Math.PI * 2); ctx.fill(); }
  }],
  stripes: [2, (ctx, S) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(0, 0, S / 2, S);
  }],
  metal: [4, (ctx, S) => {
    ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, S / 2 - 2, S - 2); ctx.strokeRect(S / 2 + 1, 1, S / 2 - 2, S / 2 - 2); ctx.strokeRect(S / 2 + 1, S / 2 + 1, S / 2 - 2, S / 2 - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 8; i++) for (const x of [6, S / 2 - 6, S / 2 + 6, S - 6]) { ctx.beginPath(); ctx.arc(x, 8 + (i * (S - 16)) / 7, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }],
  roof: [2, (ctx, S) => {
    ctx.fillStyle = '#d6d6d6'; ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#f2f2f2' : '#e8e8e8';
      ctx.beginPath(); ctx.arc(x * (S / 4) + (y % 2) * (S / 8) + S / 8, y * (S / 4) + S / 8, S / 8, 0, Math.PI); ctx.fill();
    }
  }],
  hedge: [3, (ctx, S) => {
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(0, 0, S, S);
    const r = rnd(23);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = r() < 0.6 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)';
      ctx.beginPath(); ctx.arc(r() * S, r() * S, 8 + r() * 10, 0, Math.PI * 2); ctx.fill();
    }
  }],
  water: [8, (ctx, S) => {
    ctx.fillStyle = '#e6e6e6'; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    const r = rnd(29);
    for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S; ctx.beginPath(); ctx.arc(x, y, 6 + r() * 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  }],
  // Fenster: Rahmen mit vier Scheiben (Farbe wird mit der Blockfarbe gefärbt)
  window: [2, (ctx, S) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#ececec';
    ctx.fillRect(6, 6, S - 12, S - 12);
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of [[12, 12], [S / 2 + 4, 12], [12, S / 2 + 4], [S / 2 + 4, S / 2 + 4]]) ctx.fillRect(x, y, S / 2 - 16, S / 2 - 16);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(S / 2 - 3, 6, 6, S - 12);
    ctx.fillRect(6, S / 2 - 3, S - 12, 6);
  }],
  // Tür: Holzbretter mit Griff
  door: [2, (ctx, S) => {
    ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f5f5f5' : '#dcdcdc'; ctx.fillRect(i * S / 4, 0, S / 4, S); }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, S / 2 - 20, S / 2 - 10);
    ctx.strokeRect(S / 2 + 6, 14, S / 2 - 20, S / 2 - 10);
    ctx.strokeRect(14, S / 2 + 6, S / 2 - 20, S / 2 - 20);
    ctx.strokeRect(S / 2 + 6, S / 2 + 6, S / 2 - 20, S / 2 - 20);
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(S - 20, S / 2, 6, 0, Math.PI * 2); ctx.fill();
  }],
  // Zaun: senkrechte Latten
  fence: [4, (ctx, S) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#e0e0e0';
    for (let i = 0; i < 4; i++) ctx.fillRect(i * S / 4 + 8, 0, S / 4 - 16, S);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, S * 0.3, S, 8); ctx.fillRect(0, S * 0.7, S, 8);
  }],
  leaves: [2, (ctx, S) => {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, S, S);
    const r = rnd(31);
    for (let i = 0; i < 22; i++) {
      ctx.fillStyle = r() < 0.6 ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.1)';
      ctx.beginPath(); ctx.arc(r() * S, r() * S, 8 + r() * 10, 0, Math.PI * 2); ctx.fill();
    }
  }],
};

export function getTexture(key) {
  if (!key || !DRAW[key]) return null;
  if (!cache.has(key)) {
    const [scale, draw] = DRAW[key];
    cache.set(key, make(128, scale, draw));
  }
  return cache.get(key);
}
