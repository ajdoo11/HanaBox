// Baukasten für alle Welten: Häuser, Bäume, Möbel, Leitern, Rutschen, Schilder …

export const P = (x, y, z, w, h, d, c, e = {}) => ({ x, y, z, w, h, d, c, ...e });
export const RAINBOW = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#651fff', '#d500f9'];
export const PASTEL = ['#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#bbdefb', '#b2ebf2', '#c8e6c9', '#fff9c4', '#ffe0b2'];
export const FACE = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
export const DIR = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] };

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Liste aller Treppen/Leitern (für automatische Tests)
export const BUILT = { stairs: [], ladders: [] };

export function createKit({ parts, items = [], pois = [], seed = 1 }) {
  const r = rng(seed);
  const add = p => { parts.push(p); return p; };
  const it = (key, x, y, z) => items.push([key, x, y, z]);
  const box = (x, y0, z, w, h, d, c, e = {}) => add(P(x, y0 + h / 2, z, w, h, d, c, e));
  const deco = (x, y0, z, w, h, d, c, e = {}) => box(x, y0, z, w, h, d, c, { k: 'deco', ...e });
  const sign = (text, x, y, z, w, h, face = 'z+', bg = '#ffffff', fg = '#6a1b9a', board = true) => {
    const off = { 'z+': [0, 0.13], 'z-': [0, -0.13], 'x+': [0.13, 0], 'x-': [-0.13, 0] }[face];
    if (board) deco(x, y - h / 2 - 0.1, z, face[0] === 'z' ? w + 0.3 : 0.24, h + 0.2, face[0] === 'z' ? 0.24 : w + 0.3, '#ffffff', { noShadow: true });
    add({ k: 'sign', text, x: x + off[0], y, z: z + off[1], w, h, face, bg, fg, both: false });
  };
  const signPost = (text, x, z, face = 'z+', bg = '#ffffff', fg = '#6a1b9a', w = 7) => {
    deco(x - w / 2 + 0.4, 0, z, 0.25, 3.4, 0.25, '#795548');
    deco(x + w / 2 - 0.4, 0, z, 0.25, 3.4, 0.25, '#795548');
    sign(text, x, 3.6, z, w, 1.4, face, bg, fg);
  };
  // Bäume im Trickfilm-Stil: runde Wolkenkronen, oben eine hellere Kugel als Lichtkante, leicht schiefer Stamm
  const GREENS = ['#4cbb2c', '#5ccb3c', '#3fae35', '#6fd13f'];
  const light = c => { const n = parseInt(c.slice(1), 16); const f = v => Math.min(255, Math.round(v + (255 - v) * 0.28)); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); };
  const tree = (x, z, s = 1, y0 = 0, greens = GREENS) => {
    box(x, y0, z, 0.8 * s, 3.2 * s, 0.8 * s, '#8d5a3b', { shape: 'trunk', rz: (r() - 0.5) * 0.12 });
    const g = greens[Math.floor(r() * greens.length)];
    deco(x, y0 + 2.4 * s, z, 4.4 * s, 3.4 * s, 4.4 * s, g, { shape: 'sphere' });
    deco(x + 1.2 * s, y0 + 3.3 * s, z - 0.3 * s, 2.8 * s, 2.6 * s, 2.8 * s, g, { shape: 'sphere' });
    deco(x - 1.1 * s, y0 + 3.2 * s, z + 0.6 * s, 2.7 * s, 2.5 * s, 2.7 * s, g, { shape: 'sphere' });
    deco(x + 0.1 * s, y0 + 4.4 * s, z + 0.1 * s, 2.7 * s, 2.3 * s, 2.7 * s, light(g), { shape: 'sphere' });
  };
  const pine = (x, z, s = 1, snow = false) => {
    box(x, 0, z, 0.6 * s, 2 * s, 0.6 * s, '#7a4a2e', { shape: 'trunk' });
    const tiers = [[1.3, 3.8, 2.6, '#2f9e44'], [2.9, 3.0, 2.3, '#37b24d'], [4.3, 2.1, 1.9, '#51cf66']];
    for (const [y, w, h, c] of tiers) {
      deco(x, y * s, z, w * s, h * s, w * s, c, { shape: 'cone' });
      if (snow) deco(x, (y + h * 0.55) * s, z, w * 0.62 * s, h * 0.45 * s, w * 0.62 * s, '#ffffff', { shape: 'cone' });
    }
  };
  const palm = (x, z, s = 1) => {
    for (let i = 0; i < 5; i++) box(x + i * 0.12 * s, i * 1.4 * s, z, 0.7 * s, 1.45 * s, 0.7 * s, i % 2 ? '#b07a52' : '#c48b5f', { shape: 'trunk' });
    const tx = x + 0.6 * s, ty = 7 * s;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      deco(tx + Math.cos(a) * 1.6 * s, ty - 0.3 * s, z + Math.sin(a) * 1.6 * s, 3.8 * s, 0.35 * s, 1.3 * s, i % 2 ? '#4cbb2c' : '#3fae35', { shape: 'sphere', ry: -a, rz: -0.3 });
    }
    deco(tx, ty - 0.6 * s, z, 0.55 * s, 0.55 * s, 0.55 * s, '#6d4c41', { shape: 'sphere' });
    deco(tx + 0.4 * s, ty - 0.7 * s, z + 0.3 * s, 0.55 * s, 0.55 * s, 0.55 * s, '#6d4c41', { shape: 'sphere' });
  };
  const bush = (x, z, s = 1, c = '#5ccb3c') => {
    deco(x, 0, z, 1.8 * s, 1.4 * s, 1.8 * s, c, { shape: 'sphere' });
    deco(x + 0.3 * s, 0.6 * s, z + 0.1 * s, 1.0 * s, 0.9 * s, 1.0 * s, light(c), { shape: 'sphere' });
  };
  const flowers = (x, z, w, d, n = 10, fl = ['#f06292', '#fff176', '#ba68c8', '#ff8a65', '#ffffff', '#64b5f6']) => {
    deco(x, 0, z, w, 0.25, d, '#8d6e63', { tex: 'sand' });
    for (let i = 0; i < n; i++) {
      const fx = x + (r() - 0.5) * (w - 0.4), fz = z + (r() - 0.5) * (d - 0.4);
      deco(fx, 0.25, fz, 0.08, 0.4, 0.08, '#388e3c');
      deco(fx, 0.62, fz, 0.32, 0.25, 0.32, fl[i % fl.length], { shape: 'sphere' });
    }
  };
  const lamp = (x, z, c = '#fff9c4') => {
    box(x, 0, z, 0.3, 5, 0.3, '#455a64', { shape: 'cyl' });
    deco(x, 5, z, 0.9, 0.5, 0.9, c, { shape: 'sphere', emissive: '#fff59d', emissiveIntensity: 0.6 });
  };
  const bench = (x, z, rot = 0, c = '#a1887f') => {
    const f = [Math.round(Math.sin(rot)), Math.round(Math.cos(rot))];
    const along = f[0] ? 'z' : 'x';
    box(x, 0, z, along === 'x' ? 3 : 1.2, 0.85, along === 'x' ? 1.2 : 3, c, { act: 'sit', rot, tex: 'wood' });
    deco(x - f[0] * 0.55, 0.85, z - f[1] * 0.55, along === 'x' ? 3 : 0.15, 0.9, along === 'x' ? 0.15 : 3, c, { tex: 'wood' });
  };
  const chair = (x, z, rot, c, y0 = 0) => {
    const f = [Math.round(Math.sin(rot)), Math.round(Math.cos(rot))];
    box(x, y0, z, 1.1, 0.9, 1.1, c, { act: 'sit', rot });
    deco(x - f[0] * 0.5, y0 + 0.9, z - f[1] * 0.5, f[0] ? 0.15 : 1.1, 1.1, f[0] ? 1.1 : 0.15, c);
  };
  const table = (x, y0, z, w, d, c = '#ffffff', tex) => box(x, y0, z, w, 1.1, d, c, tex ? { tex } : {});
  const sofa = (x, z, rot, c, len = 4) => {
    const f = [Math.round(Math.sin(rot)), Math.round(Math.cos(rot))];
    const w = f[0] ? 1.5 : len, d = f[0] ? len : 1.5;
    box(x, 0, z, w, 0.85, d, c, { act: 'sit', rot, tex: 'carpet' });
    deco(x - f[0] * 0.65, 0.85, z - f[1] * 0.65, f[0] ? 0.3 : len, 1.0, f[0] ? len : 0.3, c, { tex: 'carpet' });
  };
  const bed = (x, y0, z, rot, c) => {
    const f = [Math.round(Math.sin(rot)), Math.round(Math.cos(rot))];
    const w = f[0] ? 3.8 : 2.6, d = f[0] ? 2.6 : 3.8;
    box(x, y0, z, w, 0.9, d, '#ffffff', { act: 'sleep', rot });
    deco(x + f[0] * 0.5, y0 + 0.9, z + f[1] * 0.5, f[0] ? 2.8 : 2.66, 0.1, f[0] ? 2.66 : 2.8, c, { tex: 'dots' });
    deco(x - f[0] * 1.4, y0 + 0.9, z - f[1] * 1.4, f[0] ? 0.7 : 1.8, 0.28, f[0] ? 1.8 : 0.7, '#fff8e1');
    deco(x - f[0] * 2.0, y0, z - f[1] * 2.0, f[0] ? 0.2 : 2.7, 2.2, f[0] ? 2.7 : 0.2, '#8d6e63', { tex: 'wood' });
  };
  const ladder = (x, z, y0, y1, face, c = '#ffb300') => {
    const [fx, fz] = DIR[face];
    const h = y1 - y0;
    BUILT.ladders.push({ x, z, y0, y1, face });
    add(P(x + fx * 0.35, y0 + (h + 1.8) / 2, z + fz * 0.35, fx ? 1.4 : 1.6, h + 1.8, fx ? 1.6 : 1.4, '#000', { k: 'ladder', invisible: true, fx, fz, top: y1 }));
    add(P(x - fx * 0.2, y0 + h / 2, z - fz * 0.2, fx ? 0.2 : 1.6, h, fx ? 1.6 : 0.2, '#000', { invisible: true }));
    const side = fx ? [0, 1] : [1, 0];
    for (const s of [-0.6, 0.6]) deco(x + side[0] * s, y0, z + side[1] * s, 0.14, h + 0.6, 0.14, c, { shape: 'cyl' });
    for (let y = y0 + 0.5; y < y1 + 0.4; y += 0.6) deco(x, y, z, side[0] ? 1.2 : 0.1, 0.1, side[1] ? 1.2 : 0.1, c);
  };
  const stairs = (x, z, face, width, fromY, toY, c, tex, rise = 0.5, depth = 1) => {
    const [fx, fz] = DIR[face];
    const n = Math.round((toY - fromY) / rise);
    BUILT.stairs.push({ x, z, face, fromY, toY, depth, n });
    for (let j = 0; j < n; j++) {
      const top = fromY + (j + 1) * rise;
      const cx = x + fx * (j * depth + depth / 2), cz = z + fz * (j * depth + depth / 2);
      box(cx, fromY, cz, fx ? depth : width, top - fromY, fz ? depth : width, Array.isArray(c) ? c[j % c.length] : c, tex ? { tex } : {});
    }
  };
  const ramp = (x, z, w, d, y0, y1, axis, dir, c, tex, extra = {}) => add({ k: 'ramp', x, z, w, d, y0, y1, axis, dir, c, tex, ...extra });
  const slide = (x, z, axis, dir, len, yTop, yBot, c = '#ff4081', w = 2.2) => {
    const cx = axis === 'x' ? x + (dir * len) / 2 : x, cz = axis === 'z' ? z + (dir * len) / 2 : z;
    add({ k: 'ramp', slide: true, x: cx, z: cz, w: axis === 'x' ? len : w, d: axis === 'z' ? len : w, y0: yBot, y1: yTop, axis, dir: -dir, c, wedge: false, thick: 0.25 });
    for (const s of [-1, 1]) {
      const ox = axis === 'x' ? 0 : s * (w / 2 + 0.1), oz = axis === 'z' ? 0 : s * (w / 2 + 0.1);
      add({ k: 'ramp', deco: true, x: cx + ox, z: cz + oz, w: axis === 'x' ? len : 0.2, d: axis === 'z' ? len : 0.2, y0: yBot + 0.5, y1: yTop + 0.5, axis, dir: -dir, c: '#ffffff', wedge: false, thick: 0.6 });
    }
  };
  const spot = (x, z, type, color, rot = 0) => add(P(x, 0.05, z, 3, 0.1, 4, '#ffffff', { k: 'deco', act: 'vehicle', veh: type, vcolor: color, rot, spotShow: true }));
  const zoneAct = (x, y0, z, w, d, act, extra = {}) => add(P(x, y0 + 1.5, z, w, 3, d, '#000', { k: 'zone', act, invisible: true, ...extra }));
  const portal = (x, y0, z, w, d, to, name, out, outFace) => {
    add(P(x, y0 + 1.6, z, w, 3.2, d, '#000', { k: 'portal', invisible: true, to, name, out, outFace }));
    add(P(x, y0 + 0.01, z, 2.6, 0.02, 2.6, '#000', { k: 'deco', ring: 1.2, invisible: true }));
  };

  const building = o => {
    const { x, z, w, d, h = 6, wall = '#ffffff', wallTex = 'brick', roof = 'flat', roofColor = '#8d6e63', door = 's', text, to, signBg = '#ffffff', signFg = '#6a1b9a', awning } = o;
    box(x, 0, z, w, h, d, wall, { tex: wallTex });
    const [fx, fz] = DIR[door];
    const front = { x: x + fx * (w / 2), z: z + fz * (d / 2) };
    deco(front.x + fx * 0.06, 0, front.z + fz * 0.06, fx ? 0.15 : 2.6, 3.6, fx ? 2.6 : 0.15, '#5d4037', { tex: 'wood' });
    // Trickfilm-Details: Rundbogen über der Tür, Band unter dem Dach in Dachfarbe
    deco(front.x + fx * 0.06, 3.525, front.z + fz * 0.06, fx ? 1.6 : 2.6, 0.15, fx ? 2.6 : 1.6, '#5d4037', fx ? { shape: 'cyl', rz: Math.PI / 2, tex: 'wood' } : { shape: 'cyl', rx: Math.PI / 2, tex: 'wood' });
    if (h > 4) deco(x, h - 0.6, z, w + 0.3, 0.6, d + 0.3, roofColor);
    deco(front.x + fx * 0.3, 0, front.z + fz * 0.3, fx ? 1.4 : 3.6, 0.12, fx ? 3.6 : 1.4, '#9e9e9e', { tex: 'stone' });
    const faces = [['s', 0, d / 2, w], ['n', 0, -d / 2, w], ['e', w / 2, 0, d], ['w', -w / 2, 0, d]];
    for (const [f, ox, oz, len] of faces) {
      const [ax, az] = DIR[f];
      const n = Math.max(1, Math.floor(len / 5));
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + (len / n) * (i + 0.5);
        if (f === door && Math.abs(t) < 2.8) continue;
        for (let y = 1.6; y < h - 1.4; y += 3.6) {
          const wx = x + ox + (az ? t : 0) + ax * 0.05, wz = z + oz + (ax ? t : 0) + az * 0.05;
          deco(wx, y, wz, ax ? 0.12 : 1.9, 1.9, ax ? 1.9 : 0.12, '#ffffff', { noShadow: true });
          deco(wx + ax * 0.04, y + 0.15, wz + az * 0.04, ax ? 0.12 : 1.6, 1.6, ax ? 1.6 : 0.12, '#b3e5fc', { noShadow: true, emissive: '#4fc3f7', emissiveIntensity: 0.15 });
          for (const sd of [-1, 1]) deco(wx + az * sd * 1.3 + ax * 0.02, y, wz + ax * sd * 1.3 + az * 0.02, ax ? 0.1 : 0.55, 1.9, ax ? 0.55 : 0.1, roofColor, { noShadow: true });
        }
      }
    }
    if (roof === 'pitched') {
      const rh = Math.min(w, d) * 0.32;
      if (d <= w) {
        ramp(x, z + d / 4, w + 1, d / 2 + 0.6, h, h + rh, 'z', -1, roofColor, 'roof', { thick: 0.4 });
        ramp(x, z - d / 4, w + 1, d / 2 + 0.6, h, h + rh, 'z', 1, roofColor, 'roof', { thick: 0.4 });
      } else {
        ramp(x + w / 4, z, w / 2 + 0.6, d + 1, h, h + rh, 'x', -1, roofColor, 'roof', { thick: 0.4 });
        ramp(x - w / 4, z, w / 2 + 0.6, d + 1, h, h + rh, 'x', 1, roofColor, 'roof', { thick: 0.4 });
      }
    } else if (roof === 'dome') {
      deco(x, h - 0.2, z, Math.min(w, d) * 0.9, Math.min(w, d) * 0.5, Math.min(w, d) * 0.9, roofColor, { shape: 'hemi' });
    } else {
      deco(x, h, z, w + 0.6, 0.5, d + 0.6, roofColor);
    }
    if (awning) ramp(front.x + fx * 1.2, front.z + fz * 1.2, fx ? 2.4 : w * 0.8, fx ? w * 0.8 : 2.4, 3.9, 4.6, fx ? 'x' : 'z', -(fx || fz), awning, 'stripes', { wedge: false, thick: 0.15 });
    if (text) sign(text, front.x + fx * 0.2, Math.min(h - 0.9, 5.2), front.z + fz * 0.2, Math.min(w * 0.75, 12), 1.5, fx ? (fx > 0 ? 'x+' : 'x-') : (fz > 0 ? 'z+' : 'z-'), signBg, signFg);
    if (to) portal(front.x + fx * 1.4, 0, front.z + fz * 1.4, fx ? 1.6 : 3, fx ? 3 : 1.6, to, o.name || text, [front.x + fx * 4.5, front.z + fz * 4.5], FACE[door]);
    return { fx: front.x + fx * 4, fz: front.z + fz * 4 };
  };

  // Innenraum-Hülle mit Ausgang
  const shell = (ox, oz, w, d, h, floorC, floorTex, wallC, wallTex, name) => {
    box(ox, -0.4, oz, w + 2, 0.4, d + 2, floorC, { tex: floorTex });
    box(ox, 0, oz - d / 2 - 0.25, w + 1, h, 0.5, wallC, { tex: wallTex });
    box(ox - w / 2 - 0.25, 0, oz, 0.5, h, d, wallC, { tex: wallTex });
    box(ox + w / 2 + 0.25, 0, oz, 0.5, h, d, wallC, { tex: wallTex });
    const seg = (w - 3.4) / 2;
    box(ox - 1.7 - seg / 2, 0, oz + d / 2 + 0.25, seg, h, 0.5, wallC, { tex: wallTex });
    box(ox + 1.7 + seg / 2, 0, oz + d / 2 + 0.25, seg, h, 0.5, wallC, { tex: wallTex });
    box(ox, 4, oz + d / 2 + 0.25, 3.4, h - 4, 0.5, wallC, { tex: wallTex });
    deco(ox, 0, oz + d / 2 + 0.6, 3.4, 4, 0.2, '#81d4fa', { emissive: '#e1f5fe', emissiveIntensity: 0.9, noShadow: true });
    add(P(ox, 1.6, oz + d / 2 - 0.4, 3, 3.2, 1.4, '#000', { k: 'portal', invisible: true, to: 'back', name: 'Draussen' }));
    add(P(ox, 0.01, oz + d / 2 - 1.2, 2.6, 0.02, 2.6, '#000', { k: 'deco', ring: 1.2, invisible: true }));
    sign('🚪 Ausgang', ox, 4.6, oz + d / 2 - 0.05, 3.2, 0.7, 'z-', '#ffffff', '#2e7d32', false);
    if (name) sign(name, ox, Math.min(h - 1.2, 7), oz - d / 2 + 0.05, Math.min(w * 0.5, 12), 1.5, 'z+', '#ffffff', '#6a1b9a', false);
    return { entry: [ox, 0, oz + d / 2 - 4], face: Math.PI };
  };
  const wardrobePart = (x, z, w, d, title, tab) => box(x, 0, z, w, 3, d, '#ffcc80', { act: 'wardrobe', title, tab, tex: 'wood' });

  // Meer rundherum (Meeresboden tief unten) + Sandstrand, der sanft ins Wasser hineinläuft
  const sea = (cx, cz, size, waterC = '#4fc3f7') => {
    add(P(cx, -0.35, cz, size, 0.2, size, waterC, { k: 'deco', tex: 'water', noShadow: true, opacity: 0.85 }));
    add(P(cx, -9.5, cz, size, 1, size, '#0288d1', { k: 'water', invisible: true }));
  };
  // Strand an einer rechteckigen Küste: von Höhe 0 an der Küste bis -5 draussen im Meer
  const beach = (x0, z0, x1, z1, len = 34, c = '#ffe0b2') => {
    const w = x1 - x0, d = z1 - z0;
    ramp((x0 + x1) / 2, z1 + len / 2, w, len, 0, -5, 'z', 1, c, 'sand');
    ramp((x0 + x1) / 2, z0 - len / 2, w, len, -5, 0, 'z', 1, c, 'sand');
    ramp(x1 + len / 2, (z0 + z1) / 2, len, d, 0, -5, 'x', 1, c, 'sand');
    ramp(x0 - len / 2, (z0 + z1) / 2, len, d, -5, 0, 'x', 1, c, 'sand');
    // Ecken: flache Sandbänke, damit man auch dort ins Wasser laufen kann
    for (const [sx, sz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      const ox = sx === x0 ? -1 : 1, oz = sz === z0 ? -1 : 1;
      ramp(sx + ox * len / 2, sz + oz * len / 4, len, len / 2, oz < 0 ? -2.6 : 0, oz < 0 ? 0 : -2.6, 'z', 1, c, 'sand');
      ramp(sx + ox * len / 2, sz + oz * len * 0.75, len, len / 2, oz < 0 ? -5 : -2.6, oz < 0 ? -2.6 : -5, 'z', 1, c, 'sand');
    }
  };
  const island = (cx, cz, size, color, tex, waterC = '#4fc3f7') => {
    add(P(cx, -1, cz, size, 2, size, color, { k: 'ground', tex }));
    sea(cx, cz, size + 1100, waterC);
    beach(cx - size / 2, cz - size / 2, cx + size / 2, cz + size / 2);
  };
  const snowman = (x, z, s = 1) => {
    box(x, 0, z, 2 * s, 1.8 * s, 2 * s, '#ffffff', { shape: 'sphere' });
    deco(x, 1.4 * s, z, 1.5 * s, 1.4 * s, 1.5 * s, '#ffffff', { shape: 'sphere' });
    deco(x, 2.5 * s, z, 1.05 * s, 1.05 * s, 1.05 * s, '#ffffff', { shape: 'sphere' });
    deco(x, 2.95 * s, z + 0.5 * s, 0.14 * s, 0.14 * s, 0.6 * s, '#ff9800', { shape: 'cone', rx: Math.PI / 2 });
    deco(x, 3.0 * s, z, 0.9 * s, 0.1 * s, 0.9 * s, '#212121', { shape: 'cyl' });
    deco(x, 3.05 * s, z, 0.55 * s, 0.6 * s, 0.55 * s, '#212121', { shape: 'cyl' });
    deco(x, 2.1 * s, z, 1.2 * s, 0.2 * s, 1.2 * s, '#e53935', { shape: 'cyl' });
  };
  const mushroom = (x, z, h, capR, capC = '#e53935', y0 = 0) => {
    box(x, y0, z, capR * 0.4, h, capR * 0.4, '#fff3e0', { shape: 'cyl' });
    box(x, y0 + h, z, capR * 2, 0.6, capR * 2, capC, { shape: 'cyl' });
    deco(x, y0 + h + 0.5, z, capR * 2, capR * 0.7, capR * 2, capC, { shape: 'hemi', tex: 'dots' });
  };
  const crystal = (x, z, s = 1, c = '#ce93d8') => deco(x, 0, z, 1 * s, 3 * s, 1 * s, c, { shape: 'cone', emissive: c, emissiveIntensity: 0.5, opacity: 0.85 });

  return {
    r, add, it, box, deco, sign, signPost, tree, pine, palm, bush, flowers, lamp, bench, chair, table, sofa, bed,
    ladder, stairs, ramp, slide, spot, zoneAct, portal, building, shell, wardrobePart, island, sea, beach, snowman, mushroom, crystal,
  };
}
