// Bot-Freunde: laufen herum, grüssen, kommen mit, spielen Fangis und Münzjagd mit.
// Sie benutzen dieselbe Physik wie die Spieler (Treppen, Leitern, Springen).
import { Physics, Body, makeBox, makeRamp } from './physics.js';
import { WORLDS } from './worlds.js';
import { AVATAR_OPTIONS, DEFAULT_AVATAR, BOT_NAMES, JOBS, vehCode, ANIMS } from './shared.js';
import { LAND_DEFS } from './lands.js';

const physCache = new Map();
export function worldPhysics(game) {
  if (physCache.has(game)) return physCache.get(game);
  const ph = new Physics();
  for (const p of WORLDS[game].parts) {
    if (p.k === 'sign' || p.k === 'deco') continue;
    if (p.k === 'ramp') { if (!p.deco) ph.add(makeRamp(p)); continue; }
    ph.add(makeBox(p.x, p.y, p.z, p.w, p.h, p.d, { k: p.k, part: p }));
  }
  physCache.set(game, ph);
  return ph;
}

const pick = a => a[Math.floor(Math.random() * a.length)];
export function randomAvatar(job) {
  const a = {
    ...DEFAULT_AVATAR,
    skin: pick(AVATAR_OPTIONS.skin), hair: 1 + Math.floor(Math.random() * 9), hairColor: pick(AVATAR_OPTIONS.colors),
    face: pick([0, 1, 2, 4, 9, 10]), eyes: Math.floor(Math.random() * AVATAR_OPTIONS.eyes.length),
    shirt: pick(AVATAR_OPTIONS.colors), shirtStyle: Math.floor(Math.random() * 7), sleeve: Math.random() < 0.5 ? 0 : 1,
    pants: pick(AVATAR_OPTIONS.colors), pantsStyle: Math.floor(Math.random() * 3), shoes: pick(AVATAR_OPTIONS.colors),
    hat: Math.random() < 0.3 ? pick([1, 5, 7, 15]) : 0, acc: Math.random() < 0.2 ? pick([1, 3, 4]) : 0,
    pet: Math.random() < 0.45 ? 1 + Math.floor(Math.random() * 8) : 0,
  };
  if (job != null && JOBS[job]) Object.assign(a, JOBS[job].set);
  return a;
}

const FRIENDLY_CHAT = [0, 1, 7, 10, 13, 5, 100, 101, 104, 107, 110, 114];
const BOT_SPEED = { town: 7, hangout: 7, tag: 8, coins: 6.5 };
const AREA = { tag: 28, coins: 40, hangout: 34 };

export class Bot {
  constructor(room, id, opts = {}) {
    this.room = room;
    this.id = id;
    this.bot = true;
    this.staticBot = !!opts.staticBot;
    this.role = opts.role;
    this.chair = opts.chair;
    this.lines = opts.say || [];
    this.name = opts.name || pick(BOT_NAMES.filter(n => ![...room.allEntities()].some(e => e.name === n))) || pick(BOT_NAMES);
    this.avatar = opts.avatar || randomAvatar(opts.job);
    this.score = 0;
    this.dirty = true;
    this.grabbable = !this.staticBot;
    this.carriedBy = null;
    this.carrying = null;
    const [x, y, z] = opts.pos || room.randomSpawn();
    this.state = [x, y, z, opts.rot ?? 0, ANIMS.indexOf(opts.anim || 'idle'), 0];
    if (!this.staticBot) {
      this.body = new Body(room.phys);
      this.body.p.x = x; this.body.p.y = y; this.body.p.z = z;
      this.body.speed = BOT_SPEED[room.game] || 7;
    }
    this.land = opts.land || null;
    this.path = [];
    this.wait = 1 + Math.random() * 3;
    this.emote = null;
    this.chatT = 15 + Math.random() * 40;
    this.greetT = 3 + Math.random() * 5;
    this.lineT = 0;
    this.follow = null;
    this.stuck = 0;
    this.facing = this.state[3];
    this.veh = 0;
  }

  pub() {
    return { id: this.id, name: this.name, avatar: this.avatar, score: this.score, state: this.state, bot: true, staticBot: this.staticBot, role: this.role, chair: this.chair };
  }

  chat(i) { this.room.broadcast({ t: 'chat', id: this.id, i }); }
  say(text) { this.room.broadcast({ t: 'say', id: this.id, text }); }

  setState(anim) {
    const p = this.body.p;
    const s = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +this.facing.toFixed(2), ANIMS.indexOf(anim), this.veh];
    if (s.join() !== this.state.join()) { this.state = s; this.dirty = true; }
  }

  humansNear(r) {
    const [x, , z] = this.state;
    return [...this.room.players.values()].filter(p => Math.hypot(p.state[0] - x, p.state[2] - z) < r && Math.abs(p.state[1] - this.state[1]) < 4);
  }

  // ---------- Ziele wählen ----------
  pickTownPath() {
    const town = WORLDS.town;
    const { nodes, edges } = town.nav;
    const poi = pick(town.pois);
    const p = this.body.p;
    let start = 0, bd = Infinity;
    nodes.forEach(([x, z], i) => { const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; start = i; } });
    if (!this.room.adj) {
      this.room.adj = nodes.map(() => []);
      for (const [a, b] of edges) { this.room.adj[a].push(b); this.room.adj[b].push(a); }
    }
    const prev = new Map([[start, -1]]);
    const q = [start];
    while (q.length) { const n = q.shift(); if (n === poi.node) break; for (const m of this.room.adj[n]) if (!prev.has(m)) { prev.set(m, n); q.push(m); } }
    const path = [];
    for (let n = poi.node; n !== -1 && n !== undefined; n = prev.get(n)) path.unshift(nodes[n]);
    path.push([poi.x, poi.z]);
    this.path = path;
    this.poi = poi;
    this.veh = Math.random() < 0.3 && path.length > 3 ? vehCode(3 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 9)) : 0;
    this.body.speed = this.veh ? 13 : BOT_SPEED.town;
  }

  pickRandomPoint() {
    const A = AREA[this.room.game] || 30;
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 2 * A, z = (Math.random() - 0.5) * 2 * A;
      if (!this.room.phys.query(x - 0.6, 0.3, z - 0.6, x + 0.6, 2.5, z + 0.6).length) { this.path = [[x, z]]; return; }
    }
    this.path = [[0, 0]];
  }

  pickLandPath() {
    const ld = this.land;
    if (!ld) return this.pickTownPath();
    const R = 220;
    for (let i = 0; i < 20; i++) {
      const x = ld.cx + (Math.random() - 0.5) * 2 * R;
      const z = ld.cz + (Math.random() - 0.5) * 2 * R;
      this.path = [[x, z]];
      return;
    }
    this.path = [[ld.cx, ld.cz]];
  }

  // ---------- Bewegung ----------
  moveToward(tx, tz, dt, run = 1) {
    const p = this.body.p;
    const dx = tx - p.x, dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    let wx = 0, wz = 0;
    if (d > 0.3) { wx = (dx / d) * run; wz = (dz / d) * run; }
    const before = [p.x, p.z];
    this.body.update(dt, wx, wz, this.jumpNext);
    this.jumpNext = false;
    const moved = Math.hypot(p.x - before[0], p.z - before[1]);
    if (d > 0.5 && moved < dt * 1.2) {
      this.stuck += dt;
      if (this.stuck > 0.35) this.jumpNext = true;
    } else this.stuck = Math.max(0, this.stuck - dt);
    if (wx || wz) this.facing = Math.atan2(wx, wz);
    return d;
  }

  tick(dt, now) {
    if (this.staticBot) return this.tickStatic(dt);
    if (this.carriedBy != null) return;
    const room = this.room;
    const p = this.body.p;
    let anim = 'idle';

    // Grüssen
    this.greetT -= dt;
    if (this.greetT <= 0) {
      const h = this.humansNear(5)[0];
      if (h) {
        this.greetT = 30 + Math.random() * 20;
        this.facing = Math.atan2(h.state[0] - p.x, h.state[2] - p.z);
        this.emote = 'wave'; this.emoteT = 2;
        this.chat(0);
      } else this.greetT = 2;
    }
    this.chatT -= dt;
    if (this.chatT <= 0) {
      this.chatT = 30 + Math.random() * 50;
      if (this.humansNear(25).length) this.chat(pick(FRIENDLY_CHAT));
    }

    const game = room.game;
    let speedRun = 1;
    if (game === 'tag' && room.round && !room.round.pause && !room.round.waiting) {
      const parts = room.participants();
      if (room.it === this.id) {
        let best = null, bd = Infinity;
        for (const e of parts) {
          if (e.id === this.id || (room.noTagBack && room.noTagBack.id === e.id && now < room.noTagBack.until)) continue;
          const d = Math.hypot(e.state[0] - p.x, e.state[2] - p.z);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          this.path = [[best.state[0], best.state[2]]];
          if (bd < 1.9 && now - room.itSince > 1800) room.setIt(best.id, this.id);
        }
      } else {
        const it = parts.find(e => e.id === room.it);
        if (it) {
          const d = Math.hypot(it.state[0] - p.x, it.state[2] - p.z);
          if (d < 13) {
            const ax = p.x - it.state[0], az = p.z - it.state[2];
            const l = Math.hypot(ax, az) || 1;
            const j = Math.sin(now / 700 + this.id) * 0.6;
            this.path = [[p.x + (ax / l) * 6 + az / l * j * 4, p.z + (az / l) * 6 - ax / l * j * 4]];
          }
        }
      }
    } else if (game === 'coins' && room.round && !room.round.pause) {
      let best = null, bd = Infinity;
      for (const c of room.coins.values()) {
        if (c[2] > p.y + 2.5) continue;
        const d = Math.hypot(c[1] - p.x, c[3] - p.z);
        if (d < bd) { bd = d; best = c; }
      }
      if (best) {
        this.path = [[best[1], best[3]]];
        if (bd < 1.3 && Math.abs(best[2] - p.y) < 3) room.takeCoin(this, best[0]);
      }
    } else if (this.follow) {
      const f = room.players.get(this.follow.id);
      if (!f || now > this.follow.until) { this.follow = null; this.path = []; }
      else {
        const d = Math.hypot(f.state[0] - p.x, f.state[2] - p.z);
        if (d > 45 || Math.abs(f.state[1] - p.y) > 8) {
          p.x = f.state[0] - Math.sin(f.state[3]) * 2.5; p.z = f.state[2] - Math.cos(f.state[3]) * 2.5; p.y = f.state[1] + 0.2;
          this.body.v.x = this.body.v.y = this.body.v.z = 0;
          this.veh = 0;
        }
        this.path = d > 3 ? [[f.state[0], f.state[2]]] : [];
        this.veh = f.state[5] && d > 6 ? vehCode(3, 2) : 0;
        this.body.speed = this.veh ? 16 : 8.5;
        if (d <= 3) this.facing = Math.atan2(f.state[0] - p.x, f.state[2] - p.z);
      }
    }

    // Wegpunkte abarbeiten
    if (this.path.length) {
      const [tx, tz] = this.path[0];
      const d = this.moveToward(tx, tz, dt, speedRun);
      if (d < 1.3) {
        this.path.shift();
        if (!this.path.length && !this.follow && game !== 'tag' && game !== 'coins') {
          this.veh = 0;
          this.body.speed = BOT_SPEED[game] || 7;
          this.wait = 4 + Math.random() * 8;
          const act = this.poi?.act || pick(['idle', 'dance', 'wave', 'idle']);
          this.emote = act === 'idle' ? null : act;
          this.emoteT = this.wait;
        }
      }
      if (this.stuck > 3) { this.stuck = 0; this.path.shift(); if (game === 'town' && !this.path.length) this.wait = 0.5; }
    } else {
      this.body.update(dt, 0, 0, false);
      this.wait -= dt;
      if (this.wait <= 0 && !this.follow) {
        if (this.land) this.pickLandPath();
        else if (game === 'town') this.pickTownPath();
        else this.pickRandomPoint();
      }
    }
    if (p.y < -10) {
      if (this.land) { p.x = this.land.cx; p.y = 0.2; p.z = this.land.cz; }
      else { const s = room.randomSpawn(); p.x = s[0]; p.y = s[1]; p.z = s[2]; }
      this.body.v.y = 0; this.path = [];
    }

    if (this.emoteT > 0) this.emoteT -= dt; else this.emote = null;
    const sp = Math.hypot(this.body.v.x, this.body.v.z);
    if (this.body.climbing && !this.body.grounded) anim = 'climb';
    else if (!this.body.grounded && Math.abs(this.body.v.y) > 2) anim = this.body.v.y > 0 ? 'jump' : 'fall';
    else if (this.veh) anim = (this.veh - 1) >> 4 === 4 ? 'stand' : 'bike';
    else if (sp > 0.8) anim = 'walk';
    else if (this.emote) anim = this.emote;
    this.setState(anim);
  }

  tickStatic(dt) {
    this.lineT -= dt;
    if (this.lineT <= 0 && this.lines.length) {
      if (this.humansNear(7).length) { this.say(pick(this.lines)); this.lineT = 18 + Math.random() * 12; }
      else this.lineT = 2;
    }
  }

  thrown(pos, v) {
    if (!this.body) return;
    this.body.p.x = pos[0]; this.body.p.y = pos[1]; this.body.p.z = pos[2];
    this.body.v.x = v[0]; this.body.v.y = v[1]; this.body.v.z = v[2];
    this.path = [];
    this.wait = 2;
    if (v[1] > 6) setTimeout(() => { if (Math.random() < 0.6) this.say(pick(['Nochmal! 😂', 'Hihi, das kitzelt! 🤭', 'Wiii, lustig! 🎉'])); }, 1200);
  }
}
