// Klötzchen-Physik: Boxen, Rampen/Rutschen, Auslöser (Leitern, Türen) – läuft im Browser und auf dem Server (Bots).

// Meer: sichtbare Oberfläche bei -0.35; man schwimmt mit Kopf über Wasser, Boote liegen etwas tiefer.
export const SEA = { swimY: -2.3, boatY: -2.7, floor: -9 };
export const PLAYER = { half: 0.45, height: 2.8, speed: 9, jump: 13, gravity: 34, bounce: 24, step: 0.6, climb: 6 };
const CELL = 8;
const TRIGGER_KINDS = new Set(['ladder', 'portal', 'zone']);

export function makeBox(x, y, z, w, h, d, props = {}) {
  return {
    minX: x - w / 2, maxX: x + w / 2, minY: y - h / 2, maxY: y + h / 2, minZ: z - d / 2, maxZ: z + d / 2,
    dx: 0, dy: 0, dz: 0, ...props,
  };
}

export function makeRamp(p) {
  const r = {
    minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2,
    y0: p.y0, y1: p.y1, axis: p.axis, dir: p.dir, slide: !!p.slide, ramp: true, k: 'ramp',
  };
  r.minY = Math.min(p.y0, p.y1) - 0.3;
  r.maxY = Math.max(p.y0, p.y1);
  return r;
}
export function rampHeight(r, x, z) {
  let t = r.axis === 'x' ? (x - r.minX) / (r.maxX - r.minX) : (z - r.minZ) / (r.maxZ - r.minZ);
  t = Math.max(0, Math.min(1, t));
  if (r.dir < 0) t = 1 - t;
  return r.y0 + (r.y1 - r.y0) * t;
}

class Grid {
  constructor() { this.map = new Map(); }
  cells(b, fn) {
    const x0 = Math.floor(b.minX / CELL), x1 = Math.floor(b.maxX / CELL);
    const z0 = Math.floor(b.minZ / CELL), z1 = Math.floor(b.maxZ / CELL);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) fn(x + ',' + z);
  }
  add(b) { this.cells(b, k => { let s = this.map.get(k); if (!s) this.map.set(k, (s = new Set())); s.add(b); }); }
  remove(b) { this.cells(b, k => this.map.get(k)?.delete(b)); }
  query(minX, minY, minZ, maxX, maxY, maxZ, out) {
    const x0 = Math.floor(minX / CELL), x1 = Math.floor(maxX / CELL);
    const z0 = Math.floor(minZ / CELL), z1 = Math.floor(maxZ / CELL);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const s = this.map.get(x + ',' + z);
      if (!s) continue;
      for (const b of s) if (b.minX < maxX && b.maxX > minX && b.minY < maxY && b.maxY > minY && b.minZ < maxZ && b.maxZ > minZ) out.add(b);
    }
    return out;
  }
}

export class Physics {
  constructor() {
    this.solid = new Grid();
    this.trig = new Grid();
    this.ramps = new Grid();
    this.dynamic = [];
  }
  add(b) {
    if (b.dyn) { this.dynamic.push(b); return; }
    if (b.ramp) this.ramps.add(b);
    else if (TRIGGER_KINDS.has(b.k)) this.trig.add(b);
    else this.solid.add(b);
  }
  remove(b) {
    if (b.dyn) { const i = this.dynamic.indexOf(b); if (i >= 0) this.dynamic.splice(i, 1); return; }
    if (b.ramp) this.ramps.remove(b);
    else if (TRIGGER_KINDS.has(b.k)) this.trig.remove(b);
    else this.solid.remove(b);
  }
  moveDynamic(b, x, y, z) {
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2, cz = (b.minZ + b.maxZ) / 2;
    b.dx = x - cx; b.dy = y - cy; b.dz = z - cz;
    b.minX += b.dx; b.maxX += b.dx; b.minY += b.dy; b.maxY += b.dy; b.minZ += b.dz; b.maxZ += b.dz;
  }
  query(minX, minY, minZ, maxX, maxY, maxZ) {
    const out = this.solid.query(minX, minY, minZ, maxX, maxY, maxZ, new Set());
    for (const b of this.dynamic) if (b.minX < maxX && b.maxX > minX && b.minY < maxY && b.maxY > minY && b.minZ < maxZ && b.maxZ > minZ) out.add(b);
    return [...out];
  }
  triggers(minX, minY, minZ, maxX, maxY, maxZ) { return [...this.trig.query(minX, minY, minZ, maxX, maxY, maxZ, new Set())]; }
  rampsAt(x, z) { return [...this.ramps.query(x - 0.01, -1e4, z - 0.01, x + 0.01, 1e4, z + 0.01, new Set())]; }
  // höchste Oberfläche unter einem Punkt (für Bots und Gegenstände)
  surfaceAt(x, z, maxY) {
    let best = -Infinity;
    for (const b of this.query(x - 0.2, -50, z - 0.2, x + 0.2, maxY, z + 0.2)) if (!b.dyn && b.k !== 'water' && b.maxY <= maxY + 0.01 && b.maxY > best) best = b.maxY;
    for (const r of this.rampsAt(x, z)) { const h = rampHeight(r, x, z); if (h <= maxY + 0.6 && h > best) best = h; }
    return best;
  }
}

export class Body {
  constructor(phys, half = PLAYER.half, height = PLAYER.height) {
    this.phys = phys;
    this.half = half;
    this.height = height;
    this.p = { x: 0, y: 0, z: 0 };
    this.v = { x: 0, y: 0, z: 0 };
    this.grounded = false;
    this.ground = null;
    this.touch = new Set();
    this.trig = [];
    this.speedMul = 1;
    this.speed = PLAYER.speed;
    // Leitern werden nur über den Knopf „Hochklettern“ benutzt (kein Hochziehen durch die Physik)
    this.canClimb = false;
    this.climbing = false;
    this.swimming = false;
    this.swimY = 0;
  }
  hitsList() {
    const h = this.half, p = this.p;
    return this.phys.query(p.x - h, p.y, p.z - h, p.x + h, p.y + this.height, p.z + h);
  }
  hits(b) {
    const h = this.half, p = this.p;
    return b.minX < p.x + h && b.maxX > p.x - h && b.minY < p.y + this.height && b.maxY > p.y && b.minZ < p.z + h && b.maxZ > p.z - h;
  }
  update(dt, wx, wz, jump) {
    this.touch.clear();
    this.bounced = false;
    this.jumped = false;
    const g = this.ground;
    if (g && g.dyn) { this.p.x += g.dx; this.p.y += g.dy; this.p.z += g.dz; }
    this.depenetrate();
    const h = this.half, p = this.p;
    this.trig = this.phys.triggers(p.x - h, p.y, p.z - h, p.x + h, p.y + this.height, p.z + h);
    const ladder = this.canClimb && this.trig.find(t => t.k === 'ladder');
    this.climbing = !!ladder;
    this.climbUp = this.climbing && (jump || Math.hypot(wx, wz) > 0.2);
    const n = Math.max(1, Math.ceil(dt / 0.01));
    const sdt = dt / n;
    for (let i = 0; i < n; i++) this.step(sdt, wx, wz, jump);
  }
  depenetrate() {
    const h = this.half, p = this.p;
    for (const b of this.hitsList()) {
      if (!b.dyn || !this.hits(b)) continue;
      const pens = [
        ['x', b.maxX - (p.x - h), 1], ['x', p.x + h - b.minX, -1],
        ['z', b.maxZ - (p.z - h), 1], ['z', p.z + h - b.minZ, -1],
        ['y', b.maxY - p.y, 1], ['y', p.y + this.height - b.minY, -1],
      ];
      let best = pens[0];
      for (const q of pens) if (q[1] < best[1]) best = q;
      p[best[0]] += best[1] * best[2];
      if (best[0] === 'y' && best[2] > 0) { this.v.y = Math.max(this.v.y, 0); this.ground = b; }
    }
  }
  step(dt, wx, wz, jump) {
    const P = PLAYER;
    const onIce = this.ground && this.ground.k === 'ice';
    const accel = this.onSlide ? 0.8 : onIce ? 2.2 : this.grounded || this.climbing ? 16 : 6;
    const f = 1 - Math.exp(-accel * dt);
    const sp = this.speed * this.speedMul;
    if (this.onSlide) {
      // auf der Rutsche: nur quer steuern, nicht bremsen
      const r = this.onSlide;
      if (r.axis === 'x') this.v.z += (wz * sp * 0.5 - this.v.z) * (1 - Math.exp(-8 * dt));
      else this.v.x += (wx * sp * 0.5 - this.v.x) * (1 - Math.exp(-8 * dt));
    } else {
      this.v.x += (wx * sp - this.v.x) * f;
      this.v.z += (wz * sp - this.v.z) * f;
    }
    if (this.climbing) {
      this.v.y = this.climbUp ? P.climb : -2.5;
    } else if (this.swimming) {
      if (jump) { this.v.y = P.jump * 0.7; this.jumped = true; this.swimming = false; }
      else { this.v.y = 0; this.p.y = this.swimY; this.grounded = true; }
    } else {
      if (jump && this.grounded) { this.v.y = P.jump; this.jumped = true; }
      this.v.y = Math.max(this.v.y - P.gravity * dt, -60);
    }
    if (this.onSlide) {
      const r = this.onSlide;
      const s = r.dir > 0 ? -1 : 1;
      const ax = r.axis;
      this.v[ax] += s * 45 * dt;
      if (Math.abs(this.v[ax]) > 22) this.v[ax] = Math.sign(this.v[ax]) * 22;
      if (this.v[ax] * s < 6) this.v[ax] = s * 6;
      this.slid = true;
    }
    const canStep = this.grounded;
    this.wasRamp = this.onRamp;
    this.grounded = false;
    this.ground = null;
    this.onRamp = null;
    this.onSlide = null;
    this.moveH('x', this.v.x * dt, canStep);
    this.moveH('z', this.v.z * dt, canStep);
    this.moveV(this.v.y * dt);
    // Schanze: oben von der Rampe abheben
    if (this.wasRamp && !this.onRamp && !this.grounded && this.rampVy > 2 && this.v.y <= 0.5) this.v.y = Math.min(this.rampVy, 16);
  }
  moveH(ax, d, canStep) {
    if (d === 0) return;
    const p = this.p, h = this.half;
    p[ax] += d;
    for (const b of this.hitsList()) {
      if (!this.hits(b)) continue;
      this.touch.add(b);
      const rise = b.maxY - p.y;
      if ((canStep || this.climbing) && rise > 0 && rise <= PLAYER.step) {
        const oy = p.y;
        p.y = b.maxY + 0.001;
        if (!this.hitsList().some(o => this.hits(o))) continue;
        p.y = oy;
      }
      if (ax === 'x') p.x = d > 0 ? b.minX - h - 1e-4 : b.maxX + h + 1e-4;
      else p.z = d > 0 ? b.minZ - h - 1e-4 : b.maxZ + h + 1e-4;
      this.v[ax] = 0;
    }
  }
  moveV(d) {
    const p = this.p;
    p.y += d;
    for (const b of this.hitsList()) {
      if (!this.hits(b)) continue;
      this.touch.add(b);
      if (d < 0) {
        p.y = b.maxY;
        if (b.k === 'bounce') {
          this.v.y = PLAYER.bounce;
          this.bounced = true;
        } else {
          if (this.v.y < 0) this.v.y = 0;
          this.grounded = true;
          this.ground = b;
        }
      } else {
        p.y = b.minY - this.height - 1e-4;
        if (this.v.y > 0) this.v.y = 0;
      }
    }
    // Rampen & Rutschen
    for (const r of this.phys.rampsAt(p.x, p.z)) {
      const hgt = rampHeight(r, p.x, p.z);
      const snap = this.wasRamp && this.v.y <= 0 ? 0.45 : 0.02;
      if (p.y < hgt + snap && p.y > hgt - 1.6 && this.v.y <= 6) {
        p.y = hgt;
        if (this.v.y < 0) this.v.y = 0;
        this.grounded = true;
        this.ground = r;
        this.onRamp = r;
        if (r.slide) this.onSlide = r;
        const len = r.axis === 'x' ? r.maxX - r.minX : r.maxZ - r.minZ;
        const slope = ((r.y1 - r.y0) / len) * (r.dir > 0 ? 1 : -1);
        this.rampVy = slope * (r.axis === 'x' ? this.v.x : this.v.z);
      }
    }
  }
}
