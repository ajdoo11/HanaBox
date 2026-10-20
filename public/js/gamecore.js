// Spiel-Server-Kern: Räume, Bots und Spielregeln. Läuft im Node-Server und – ohne Server (z.B. GitHub Pages) – direkt im Browser.
import { GAMES, MAX_PLAYERS, BLOCK_TYPES, BUILD, ITEM_TYPES, ITEM_INDEX, MAX_ITEMS, VEHICLES, sanitizeAvatar, sanitizeName, validChat, ANIMS } from './shared.js';
import { WORLDS } from './worlds.js';
import { townCellAllowed, LAND_DEFS } from './lands.js';
import { Bot, randomAvatar, worldPhysics } from './bots.js';

// storage: { read(kind, code), write(kind, code, data), exists(kind, code) } mit kind = 'build' | 'town'
// authenticate(token): liefert das Konto ({ name }) – ohne diese Funktion (im Browser) wählt man den Namen selbst
export function createGameCore({ storage, log = () => {}, authenticate = null }) {
  // ---------- Räume ----------
  const rooms = new Map();
  // Alle spielen zusammen in derselben Welt
  const SHARED_CODE = 'HANA';
  const BOT_TARGET_DEFAULT = { town: 6, hangout: 4, tag: 4, coins: 4, obby: 0, build: 0 };
  let nextBotId = 100000;


  const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
  const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);

  class Room {
    constructor(code, game) {
      this.code = code;
      this.game = game;
      this.players = new Map();
      this.bots = new Map();
      this.botsEnabled = true;
      this.botTarget = BOT_TARGET_DEFAULT[game] || 0;
      this.emptySince = Date.now();
      this.phys = worldPhysics(game);
      if (game === 'build') { this.blocks = new Map(); this.load(); }
      if (game === 'town') {
        this.items = new Map(); this.itemSeq = 1; this.toggles = {}; this.blocks = new Map(); this.loadTown();
        for (const sb of WORLDS.town.staticBots) this.addStaticBot(sb);
      }
      if (game === 'coins') { this.coins = new Map(); this.coinSeq = 1; this.round = null; this.respawnAt = []; }
      if (game === 'tag') { this.it = null; this.round = null; this.itSince = 0; this.noTagBack = null; this.itMs = new Map(); }
    }

    *allEntities() { yield* this.players.values(); yield* this.bots.values(); }
    entity(id) { return this.players.get(id) || this.bots.get(id); }
    participants() { return [...this.players.values(), ...[...this.bots.values()].filter(b => !b.staticBot)]; }

    broadcast(msg, except) {
      const s = JSON.stringify(msg);
      for (const p of this.players.values()) if (p !== except && p.ws.readyState === 1) p.ws.send(s);
    }

    pub(p) { return p.bot ? p.pub() : { id: p.id, name: p.name, avatar: p.avatar, score: p.score, state: p.state }; }

    randomSpawn() {
      const s = WORLDS[this.game].spawn;
      return [s[0] + (Math.random() - 0.5) * 8, s[1] + 0.2, s[2] + (Math.random() - 0.5) * 8];
    }

    // --- Bots ---
    addStaticBot(sb) {
      const b = new Bot(this, nextBotId++, { staticBot: true, ...sb });
      this.bots.set(b.id, b);
      return b;
    }
    // Bot-Gebiete: Hana-Stadt (null) und jedes Land bekommen gleich viele Bots
    botAreas() { return this.game === 'town' ? [null, ...LAND_DEFS.filter(l => l.key !== 'stadt')] : [null]; }
    landSpawn(ld) {
      for (let i = 0; i < 30; i++) {
        const x = ld.cx + (Math.random() - 0.5) * 300, z = ld.cz + (Math.random() - 0.5) * 300;
        if (!this.phys.query(x - 0.7, 0.2, z - 0.7, x + 0.7, 3, z + 0.7).length) return [x, 0.2, z];
      }
      return [ld.arrive[0], 0.2, ld.arrive[1] - 10];
    }
    syncBots() {
      const humans = this.players.size;
      for (const area of this.botAreas()) {
        const want = !this.botsEnabled || humans === 0 ? 0 : area ? this.botTarget : Math.max(0, this.botTarget - Math.max(0, humans - 1));
        const dyn = [...this.bots.values()].filter(b => !b.staticBot && (b.land || null) === area);
        for (let n = dyn.length; n < want; n++) {
          const b = new Bot(this, nextBotId++, area ? { pos: this.landSpawn(area), land: area } : {});
          this.bots.set(b.id, b);
          if (this.game === 'tag') this.itMs.set(b.id, 0);
          this.broadcast({ t: 'join', player: b.pub() });
        }
        for (let n = dyn.length; n > want; n--) this.removeBot(dyn[n - 1]);
      }
    }
    removeBot(b) {
      this.releaseLinks(b);
      this.bots.delete(b.id);
      this.broadcast({ t: 'leave', id: b.id });
      if (this.game === 'tag' && this.it === b.id) this.it = null;
    }
    onHumanChat(p, i) {
      const near = r => [...this.bots.values()].filter(b => !b.staticBot && b.carriedBy == null)
        .map(b => [b, Math.hypot(b.state[0] - p.state[0], b.state[2] - p.state[2])]).filter(([, d]) => d < r).sort((a, b) => a[1] - b[1]).map(x => x[0]);
      const later = (fn, ms = 900) => setTimeout(fn, ms);
      if (i === 4 || i === 1) {
        const b = near(30).find(x => !x.follow);
        if (b) { b.follow = { id: p.id, until: Date.now() + 180000 }; later(() => b.chat(11)); }
      } else if (i === 0) {
        const b = near(15)[0];
        if (b) later(() => { b.chat(0); b.emote = 'wave'; b.emoteT = 2; });
      } else if (i === 7) {
        for (const b of near(15).slice(0, 2)) later(() => { b.chat(104); b.emote = 'dance'; b.emoteT = 6; });
      } else if (i === 14) {
        for (const b of this.bots.values()) if (b.follow?.id === p.id) { b.follow = null; later(() => b.chat(14)); }
      } else if (i === 2) {
        for (const b of this.bots.values()) if (b.follow?.id === p.id) later(() => b.chat(8));
      } else if (i === 5 || i === 6) {
        const b = near(12)[0];
        if (b) later(() => b.chat(Math.random() < 0.5 ? 107 : 102));
      }
    }

    // --- Hochheben ---
    releaseLinks(e) {
      if (e.carrying != null) {
        const t = this.entity(e.carrying);
        e.carrying = null;
        if (t) { t.carriedBy = null; this.broadcast({ t: 'thrown', id: t.id, by: e.id, v: [0, 3, 0], pos: [t.state[0], t.state[1], t.state[2]] }); if (t.bot) t.thrown([t.state[0], t.state[1], t.state[2]], [0, 3, 0]); }
      }
      if (e.carriedBy != null) {
        const c = this.entity(e.carriedBy);
        e.carriedBy = null;
        if (c) { c.carrying = null; this.broadcast({ t: 'thrown', id: e.id, by: c.id, v: [0, 3, 0], pos: [e.state[0], e.state[1], e.state[2]] }); }
      }
    }
    carryPos(c) {
      const r = c.state[3];
      return [c.state[0] + Math.sin(r) * 0.8, c.state[1] + 0.9, c.state[2] + Math.cos(r) * 0.8];
    }
    throwOut(carrier, power) {
      const t = this.entity(carrier.carrying);
      carrier.carrying = null;
      if (!t) return;
      t.carriedBy = null;
      const r = carrier.state[3];
      const v = power === 'throw' ? [Math.sin(r) * 9, 10, Math.cos(r) * 9] : [Math.sin(r) * 2, 3, Math.cos(r) * 2];
      const pos = this.carryPos(carrier);
      this.broadcast({ t: 'thrown', id: t.id, by: carrier.id, v, pos });
      if (t.bot) t.thrown(pos, v);
    }

    // --- Speichern ---
    load() {
      const data = storage.read('build', this.code);
      for (const [x, y, z, k] of data?.blocks || []) this.blocks.set(`${x},${y},${z}`, [x, y, z, k]);
    }
    loadTown() {
      let data = null;
      data = storage.read('town', this.code);
      if (data && data.v === 2) {
        for (const [, type, x, y, z] of data.items || []) this.addItem(type, x, y, z, null);
        this.toggles = data.toggles || {};
        for (const [bx, by, bz, k] of data.blocks || []) this.blocks.set(`${bx},${by},${bz}`, [bx, by, bz, k]);
      } else {
        for (const [key, x, y, z] of WORLDS.town.items) this.addItem(ITEM_INDEX[key], x, y, z, null);
      }
    }
    addItem(type, x, y, z, holder) {
      const it = [this.itemSeq++, type, x, y, z, holder];
      this.items.set(it[0], it);
      return it;
    }
    saveSoon() {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(), 5000);
    }
    save() {
      clearTimeout(this.saveTimer);
      if (this.game === 'build') storage.write('build', this.code, { blocks: [...this.blocks.values()] });
      if (this.game === 'town') {
        const items = [...this.items.values()].map(([id, type, x, y, z]) => [id, type, x, y, z, null]);
        storage.write('town', this.code, { v: 2, items, toggles: this.toggles, blocks: [...this.blocks.values()] });
      }
    }
    dropAll(p) {
      for (const it of this.items?.values() || []) {
        if (it[5] !== p.id) continue;
        it[5] = null;
        it[2] = p.state[0]; it[3] = p.state[1]; it[4] = p.state[2];
        this.broadcast({ t: 'itemDrop', id: it[0], x: it[2], y: it[3], z: it[4] });
      }
    }

    extra() {
      const carry = [...this.allEntities()].filter(e => e.carrying != null).map(e => [e.id, e.carrying]);
      if (this.game === 'build') return { blocks: [...this.blocks.values()] };
      if (this.game === 'town') return { items: [...this.items.values()], toggles: this.toggles, blocks: [...this.blocks.values()], carry };
      if (this.game === 'coins') return { coins: [...this.coins.values()], round: this.round, carry };
      if (this.game === 'tag') return { it: this.it, round: this.round, carry };
      return { carry };
    }

    // --- Münzjagd ---
    spawnCoin() {
      const spots = WORLDS.coins.coinSpots;
      const used = new Set([...this.coins.values()].map(c => c[4]));
      let idx;
      for (let i = 0; i < 20; i++) { idx = Math.floor(Math.random() * spots.length); if (!used.has(idx)) break; }
      const [x, y, z] = spots[idx];
      const c = [this.coinSeq++, x, y, z, idx];
      this.coins.set(c[0], c);
      return c;
    }
    startCoinRound() {
      this.round = { endsAt: Date.now() + 120000, pause: false };
      for (const p of this.allEntities()) p.score = 0;
      while (this.coins.size < 25) this.broadcast({ t: 'coinAdd', c: this.spawnCoin() });
      this.broadcast({ t: 'round', round: this.round, reset: true, start: true });
    }
    takeCoin(p, id) {
      if (this.game !== 'coins' || !this.round || this.round.pause) return;
      const c = this.coins.get(id);
      if (!c) return;
      const [px, py, pz] = p.state;
      if (Math.hypot(c[1] - px, c[3] - pz) > 4 || Math.abs(c[2] - py) > 5) return;
      this.coins.delete(id);
      p.score++;
      this.broadcast({ t: 'coinTaken', id, by: p.id, v: p.score });
      this.respawnAt.push(Date.now() + 2500);
    }

    // --- Fangis ---
    setIt(id, by = null) {
      const prev = this.it;
      this.it = id;
      this.itSince = Date.now();
      this.noTagBack = by != null ? { id: by, until: Date.now() + 4000 } : null;
      if (prev !== id) this.broadcast({ t: 'it', id, by });
    }
    results(asc) {
      return this.participants().map(p => ({ id: p.id, name: p.name, v: p.score })).sort((a, b) => (asc ? a.v - b.v : b.v - a.v));
    }

    tick(dt) {
      const now = Date.now();
      if (this.game === 'coins' && this.players.size) {
        if (!this.round) this.startCoinRound();
        else if (!this.round.pause && now >= this.round.endsAt) {
          this.broadcast({ t: 'roundEnd', results: this.results(false) });
          this.round = { endsAt: now + 8000, pause: true };
          this.broadcast({ t: 'round', round: this.round });
        } else if (this.round.pause && now >= this.round.endsAt) this.startCoinRound();
        this.respawnAt = this.respawnAt.filter(t => {
          if (t > now) return true;
          if (this.coins.size < 25) this.broadcast({ t: 'coinAdd', c: this.spawnCoin() });
          return false;
        });
      }
      if (this.game === 'tag') this.tickTag(dt, now);
      // Bots
      for (const b of this.bots.values()) {
        if (b.carriedBy != null) {
          const c = this.entity(b.carriedBy);
          if (c) { const [x, y, z] = this.carryPos(c); b.state = [x, y, z, c.state[3], ANIMS.indexOf('carried'), 0]; b.dirty = true; if (b.body) { b.body.p.x = x; b.body.p.y = y; b.body.p.z = z; } }
          continue;
        }
        b.tick(dt, now);
      }
    }

    tickTag(dt, now) {
      const parts = this.participants();
      if (parts.length < 2) {
        if (!this.round || !this.round.waiting) {
          this.round = { waiting: true, endsAt: 0 };
          this.broadcast({ t: 'round', round: this.round });
          this.setIt(null);
        }
        return;
      }
      if (!this.round || this.round.waiting || (this.round.pause && now >= this.round.endsAt)) {
        this.round = { endsAt: now + 120000, pause: false };
        for (const p of parts) { p.score = 0; this.itMs.set(p.id, 0); }
        this.broadcast({ t: 'round', round: this.round, reset: true, start: true });
        this.it = null;
        this.setIt(parts[Math.floor(Math.random() * parts.length)].id);
        return;
      }
      if (this.round.pause) return;
      if (this.it == null || !this.entity(this.it)) this.setIt(parts[Math.floor(Math.random() * parts.length)].id);
      const p = this.entity(this.it);
      if (p) {
        const ms = (this.itMs.get(p.id) || 0) + dt * 1000;
        this.itMs.set(p.id, ms);
        const sec = Math.floor(ms / 1000);
        if (sec !== p.score) { p.score = sec; this.broadcast({ t: 'score', id: p.id, v: sec }); }
      }
      if (now >= this.round.endsAt) {
        this.broadcast({ t: 'roundEnd', results: this.results(true) });
        this.round = { endsAt: now + 8000, pause: true };
        this.broadcast({ t: 'round', round: this.round });
      }
    }

    flushStates() {
      const l = [];
      for (const p of this.allEntities()) if (p.dirty) { p.dirty = false; l.push([p.id, ...p.state]); }
      if (l.length) this.broadcast({ t: 'st', l });
    }
  }

  function joinRoom(client, m) {
    if (client.room) return;
    const account = authenticate ? authenticate(m.token) : null;
    if (authenticate && !account) return send(client.ws, { t: 'error', code: 'login', msg: 'Bitte melde dich zuerst an.' });
    const name = account ? account.name : sanitizeName(m.name);
    const avatar = sanitizeAvatar(m.avatar);
    let room = rooms.get(SHARED_CODE);
    if (!room) { room = new Room(SHARED_CODE, 'town'); rooms.set(SHARED_CODE, room); }
    if (room.players.size >= MAX_PLAYERS) return send(client.ws, { t: 'error', msg: `Die Welt ist voll (max. ${MAX_PLAYERS} Spieler).` });

    const sp = WORLDS[room.game].spawn;
    const p = { id: client.id, ws: client.ws, name, avatar, score: 0, state: [sp[0], sp[1], sp[2], Math.PI, 0, 0], dirty: false, grabbable: m.grab !== false, carrying: null, carriedBy: null };
    if (room.game === 'tag') room.itMs.set(p.id, 0);
    room.players.set(p.id, p);
    room.syncBots();
    send(client.ws, {
      t: 'welcome', id: p.id, code: room.code, game: room.game, now: Date.now(),
      players: [...room.allEntities()].filter(e => e !== p).map(x => room.pub(x)), extra: room.extra(), bots: room.botsEnabled,
    });
    room.broadcast({ t: 'join', player: room.pub(p) }, p);
    client.room = room;
    client.player = p;
    log(`${name} → Raum ${room.code} (${GAMES[room.game].name}), ${room.players.size} Spieler`);
  }

  function leaveRoom(client) {
    const room = client.room;
    if (!room) return;
    const p = client.player;
    room.releaseLinks(p);
    room.players.delete(client.id);
    if (room.game === 'town') { room.dropAll(p); room.saveSoon(); }
    for (const b of room.bots.values()) if (b.follow?.id === p.id) b.follow = null;
    room.broadcast({ t: 'leave', id: client.id });
    if (room.game === 'tag' && room.it === client.id) room.it = null;
    if (room.players.size === 0) {
      room.emptySince = Date.now();
      if (room.game === 'build' || room.game === 'town') room.save();
    }
    room.syncBots();
    client.room = null;
    client.player = null;
  }

  function handle(client, m) {
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'join') return joinRoom(client, m);
    const room = client.room, p = client.player;
    if (!room || !p) return;
    const now = Date.now();
    switch (m.t) {
      case 's': {
        const s = m.s;
        if (!Array.isArray(s) || s.length < 5) return;
        const a = Number.isInteger(s[4]) && s[4] >= 0 && s[4] < ANIMS.length ? s[4] : 0;
        const v = Number.isInteger(s[5]) && s[5] >= 0 && s[5] <= VEHICLES.length * 16 ? s[5] : 0;
        p.state = [num(s[0], -3200, 3200), num(s[1], -100, 300), num(s[2], -3200, 3200), num(s[3], -50, 50), a, v];
        p.dirty = true;
        break;
      }
      case 'chat':
        if (!validChat(m.i) || now - client.lastChat < 1200) return;
        client.lastChat = now;
        room.broadcast({ t: 'chat', id: p.id, i: m.i });
        room.onHumanChat(p, m.i);
        break;
      case 'bots':
        if (typeof m.count === 'number') room.botTarget = Math.max(0, Math.min(20, Math.round(m.count)));
        room.botsEnabled = m.on !== false;
        room.syncBots();
        room.broadcast({ t: 'notice', text: room.botsEnabled ? `🤖 ${room.botTarget} Bot-Freunde in jeder Welt!` : '🤖 Bot-Freunde sind gegangen' });
        break;
      case 'pref':
        p.grabbable = m.grab !== false;
        break;
      case 'score':
        if (room.game !== 'obby' || !Number.isInteger(m.v)) return;
        p.score = Math.max(0, Math.min(WORLDS.obby.stages + 1, m.v));
        room.broadcast({ t: 'score', id: p.id, v: p.score });
        break;
      case 'finish':
        if (room.game !== 'obby' || now - (client.lastFinish || 0) < 5000) return;
        client.lastFinish = now;
        room.broadcast({ t: 'notice', text: `🏆 ${p.name} hat das Ziel erreicht!` });
        break;
      case 'place': {
        if (room.game !== 'build' && room.game !== 'town') return;
        const { x, y, z, k } = m;
        if (![x, y, z, k].every(Number.isInteger)) return;
        if (room.game === 'build') {
          if (x < -BUILD.half || x >= BUILD.half || z < -BUILD.half || z >= BUILD.half || y < 0 || y >= BUILD.maxY) return;
        } else if (!townCellAllowed(x, y, z)) return send(client.ws, { t: 'notice', text: 'Hier kann man nicht bauen 🏗️' });
        if (k < 0 || k >= BLOCK_TYPES.length) return;
        const key = `${x},${y},${z}`;
        if (room.blocks.has(key)) return;
        const cap = room.game === 'town' ? 9000 : BUILD.maxBlocks;
        if (room.blocks.size >= cap) return send(client.ws, { t: 'notice', text: 'Die Welt ist voll – lösche ein paar Klötze.' });
        room.blocks.set(key, [x, y, z, k]);
        room.broadcast({ t: 'place', x, y, z, k, by: p.id });
        // Eine Tür braucht zwei Klötze in der Höhe, damit man durchgehen kann
        if (BLOCK_TYPES[k].kind === 'door') {
          const up = `${x},${y + 1},${z}`;
          if (!room.blocks.has(up) && (room.game === 'build' ? y + 1 < BUILD.maxY : townCellAllowed(x, y + 1, z))) {
            room.blocks.set(up, [x, y + 1, z, k]);
            room.broadcast({ t: 'place', x, y: y + 1, z, k, by: p.id });
          }
        }
        room.saveSoon();
        break;
      }
      case 'remove': {
        if (room.game !== 'build' && room.game !== 'town') return;
        const key = `${m.x},${m.y},${m.z}`;
        if (!room.blocks.delete(key)) return;
        room.broadcast({ t: 'remove', x: m.x, y: m.y, z: m.z, by: p.id });
        room.saveSoon();
        break;
      }
      case 'coin': room.takeCoin(p, m.id); break;
      case 'avatar':
        if (now - (client.lastAvatar || 0) < 300) return;
        client.lastAvatar = now;
        p.avatar = sanitizeAvatar(m.avatar);
        room.broadcast({ t: 'avatar', id: p.id, avatar: p.avatar }, p);
        break;
      case 'spawn': {
        if (room.game !== 'town' || !Number.isInteger(m.type) || !ITEM_TYPES[m.type]) return;
        if (now - (client.lastSpawn || 0) < 400) return;
        client.lastSpawn = now;
        if (room.items.size >= MAX_ITEMS) return send(client.ws, { t: 'notice', text: 'Es liegen schon sehr viele Sachen herum – iss etwas auf! 😋' });
        if ([...room.items.values()].some(i => i[5] === p.id)) return;
        const it = room.addItem(m.type, p.state[0], p.state[1], p.state[2], p.id);
        room.broadcast({ t: 'item', it });
        room.saveSoon();
        break;
      }
      case 'pick': {
        if (room.game !== 'town') return;
        const it = room.items.get(m.id);
        if (!it || it[5] != null) return;
        if ([...room.items.values()].some(i => i[5] === p.id)) return;
        if (Math.hypot(it[2] - p.state[0], it[4] - p.state[2]) > 6) return;
        it[5] = p.id;
        room.broadcast({ t: 'itemHold', id: it[0], by: p.id });
        break;
      }
      case 'drop': {
        if (room.game !== 'town') return;
        const it = room.items.get(m.id);
        if (!it || it[5] !== p.id) return;
        it[5] = null;
        it[2] = num(m.x, -2000, 2000); it[3] = num(m.y, -5, 60); it[4] = num(m.z, -2000, 2000);
        room.broadcast({ t: 'itemDrop', id: it[0], x: it[2], y: it[3], z: it[4] });
        room.saveSoon();
        break;
      }
      case 'eat': {
        if (room.game !== 'town') return;
        const it = room.items.get(m.id);
        if (!it || it[5] !== p.id || ITEM_TYPES[it[1]].cat !== 'food') return;
        room.items.delete(it[0]);
        room.broadcast({ t: 'itemGone', id: it[0], by: p.id });
        room.saveSoon();
        break;
      }
      case 'toggle': {
        if (room.game !== 'town' || typeof m.key !== 'string') return;
        const valid = WORLDS.town.parts.some(pt => pt.key === m.key);
        if (!valid || now - (client.lastToggle || 0) < 400) return;
        client.lastToggle = now;
        room.toggles[m.key] = !room.toggles[m.key];
        room.broadcast({ t: 'toggle', key: m.key, on: room.toggles[m.key] });
        room.saveSoon();
        break;
      }
      case 'grab': {
        const t = room.entity(m.id);
        if (!t || t === p || t.staticBot || t.grabbable === false) return;
        if (p.carrying != null || p.carriedBy != null || t.carrying != null || t.carriedBy != null) return;
        if (p.state[5] || t.state[5]) return;
        if (Math.hypot(t.state[0] - p.state[0], t.state[2] - p.state[2]) > 4 || Math.abs(t.state[1] - p.state[1]) > 3) return;
        p.carrying = t.id;
        t.carriedBy = p.id;
        if (t.bot) { t.follow = null; t.path = []; t.veh = 0; }
        room.broadcast({ t: 'carry', by: p.id, id: t.id });
        if (t.bot) setTimeout(() => t.say(['Huiii! 😆', 'Hihi! 🤭', 'Wohin gehen wir? 😄'][Math.floor(Math.random() * 3)]), 400);
        break;
      }
      case 'throw': if (p.carrying != null) room.throwOut(p, 'throw'); break;
      case 'putdown': if (p.carrying != null) room.throwOut(p, 'put'); break;
      case 'release': {
        if (p.carriedBy == null) return;
        const c = room.entity(p.carriedBy);
        p.carriedBy = null;
        if (c) c.carrying = null;
        room.broadcast({ t: 'thrown', id: p.id, by: c?.id ?? -1, v: [0, 7, 0], pos: [p.state[0], p.state[1], p.state[2]] });
        break;
      }
      case 'treated': {
        const t = room.entity(m.id);
        if (!t || now - (client.lastTreat || 0) < 3000) return;
        client.lastTreat = now;
        room.broadcast({ t: 'treated', id: t.id, by: p.id });
        if (t.bot && t.role === 'patient') {
          t.say('Danke, Frau Doktor! Meine Zähne glänzen! ✨😁');
          setTimeout(() => {
            if (!room.bots.has(t.id)) return;
            room.removeBot(t);
            setTimeout(() => {
              if (!rooms.has(room.code)) return;
              const sb = WORLDS.town.staticBots.find(s => s.role === 'patient' && s.chair === t.chair);
              const nb = room.addStaticBot({ ...sb, avatar: randomAvatar() });
              room.broadcast({ t: 'join', player: nb.pub() });
            }, 12000);
          }, 3500);
        }
        break;
      }
      case 'voice:ready':
        p.voiceReady = true;
        for (const [id, other] of room.players) {
          if (id !== p.id && other.voiceReady) {
            send(other.ws, { t: 'voice:user', id: p.id });
          }
        }
        break;
      case 'voice:offer': {
        const target = room.players.get(m.targetId);
        if (!target) return;
        send(target.ws, { t: 'voice:offer', id: p.id, sdp: m.sdp });
        break;
      }
      case 'voice:answer': {
        const target = room.players.get(m.targetId);
        if (!target) return;
        send(target.ws, { t: 'voice:answer', id: p.id, sdp: m.sdp });
        break;
      }
      case 'voice:ice': {
        const target = room.players.get(m.targetId);
        if (!target) return;
        send(target.ws, { t: 'voice:ice', id: p.id, candidate: m.candidate });
        break;
      }
      case 'voice:leave':
        p.voiceReady = false;
        room.broadcast({ t: 'voice:leave', id: p.id }, p);
        break;
      case 'fireworks': {
        const x = num(m.x, -3200, 3200), z = num(m.z, -3200, 3200);
        if (Math.hypot(x - p.state[0], z - p.state[2]) > 14) return;
        if (now - (room.lastFireworks || 0) < 7000) return send(client.ws, { t: 'notice', text: '🎆 Das Feuerwerk lädt gleich wieder nach …' });
        room.lastFireworks = now;
        room.broadcast({ t: 'fireworks', x, z, by: p.name });
        break;
      }
      case 'tag': {
        if (room.game !== 'tag' || room.it !== p.id || !room.round || room.round.pause || room.round.waiting) return;
        if (now - room.itSince < 1800) return;
        const target = room.entity(m.id);
        if (!target || target === p || target.staticBot) return;
        if (room.noTagBack && room.noTagBack.id === target.id && now < room.noTagBack.until) return;
        const [ax, ay, az] = p.state, [bx, by, bz] = target.state;
        if (Math.hypot(ax - bx, az - bz) > 4 || Math.abs(ay - by) > 4) return;
        room.setIt(target.id, p.id);
        break;
      }
    }
  }

    let nextId = 1;
    function connect(ws) {
      return { ws, id: nextId++, room: null, player: null, tokens: 60, lastRefill: Date.now(), lastChat: 0, alive: true };
    }
    function message(client, data) {
      const now = Date.now();
      client.tokens = Math.min(60, client.tokens + ((now - client.lastRefill) / 1000) * 40);
      client.lastRefill = now;
      if (client.tokens < 1) return;
      client.tokens--;
      let m;
      try { m = JSON.parse(data); } catch { return; }
      try { handle(client, m); } catch (e) { console.error(e); }
    }
    function disconnect(client) { try { leaveRoom(client); } catch (e) { console.error(e); } }

  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = Math.min(0.2, (now - lastTick) / 1000);
    lastTick = now;
    for (const [code, room] of rooms) {
      if (room.players.size === 0) {
        if (now - room.emptySince > 120000) rooms.delete(code);
        continue;
      }
      try { room.tick(dt); } catch (e) { console.error(e); }
      room.flushStates();
    }
  }, 66);


    function saveAll() { for (const room of rooms.values()) if (room.game === 'town' || room.game === 'build') room.save(); }

  return { connect, message, disconnect, rooms, saveAll };
}
