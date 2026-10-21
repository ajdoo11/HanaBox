// Die laufende Spielwelt: 3D-Szene, eigener Spieler, andere Spieler/Bots, Fahrzeuge, Häuser und Spielregeln.
import * as THREE from 'three';
import { WORLDS } from './worlds.js';
import { GAMES, BLOCK_TYPES, ANIMS, ITEM_TYPES, ITEM_INDEX, VEHICLES, PETS, chatText, vehCode, vehDecode } from './shared.js';
import { Physics, Body, makeBox, makeRamp, PLAYER, SEA } from './physics.js';
import { Character } from './avatar.js';
import { BuildWorld, blockIcon } from './build.js';
import { makeItemMesh } from './items.js';
import { makeVehicle, spinWheels, SEATS } from './vehicles.js';
import { buildStatic, partGeometry, makeMaterial, signMesh, ringMesh, ringMaterial, skyDome } from './geo.js';
import { getTexture } from './textures.js';
import { addStars, saveAvatar, earnWork, jobWait, markJob, workLeft, WORK_DAILY } from './profile.js';
import { avatarEditor, SALON_TABS, CLOTHES_TABS, PET_TABS } from './editor.js';
import { openTeethGame } from './dentist.js';
import { landAt, LAND_DEFS, townCellAllowed } from './lands.js';
import { VoiceChat } from './voice.js';
import { makeAdventure, hourIndex, minutesLeft } from './adventure.js';
import { track } from './quests.js';
import { sfx } from './sfx.js';

const ACT_LABELS = {
  sit: '🪑 Hinsetzen', sleep: '😴 Schlafen', bath: '🛁 Baden', shower: '🚿 Duschen', salon: '💇 Frisur machen',
  wardrobe: '👗 Umziehen', swing: '🎠 Schaukeln', treasure: '🎁 Schatz öffnen', brush: '🪥 Zähne putzen',
  dchair: '🦷 Auf den Zahnarztstuhl', dentist: '🦷 Zähne behandeln', register: '🛒 Bezahlen (Piep!)',
  job: '💼 Arbeiten',
};
const RING_ACTS = new Set(['fireworks', 'menu', 'wardrobe', 'salon', 'dentist', 'dchair', 'treasure', 'vehicle', 'brush', 'register', 'swing', 'shower', 'travel', 'button', 'adopt', 'job']);

const JOB_TASKS = [
  { name: 'Bäckerei', emoji: '🥐', msg: 'Du backst Brötchen!', stars: 5, time: 4 },
  { name: 'Supermarkt', emoji: '🛒', msg: 'Du räumst die Regale ein!', stars: 4, time: 3 },
  { name: 'Feuerwehr', emoji: '🚒', msg: 'Du polierst das Feuerwehrauto!', stars: 6, time: 5 },
  { name: 'Café', emoji: '☕', msg: 'Du servierst Kaffee!', stars: 4, time: 3 },
  { name: 'Boutique', emoji: '👗', msg: 'Du sortierst die Kleider!', stars: 4, time: 3 },
  { name: 'Tierarzt', emoji: '🐾', msg: 'Du pflegst die Tiere!', stars: 5, time: 4 },
  { name: 'Bauernhof', emoji: '🐄', msg: 'Du fütterst die Tiere!', stars: 5, time: 4 },
];

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export class Game {
  constructor({ renderer, input, net, welcome, name, avatar, onLeave }) {
    this.renderer = renderer;
    this.input = input;
    this.net = net;
    this.onLeave = onLeave;
    this.gameKey = welcome.game;
    this.code = welcome.code;
    this.myId = welcome.id;
    this.myName = name;
    this.timeOffset = welcome.now - Date.now();
    this.def = WORLDS[this.gameKey];
    this.camInit = this.def.cam || { pitch: 0.38, dist: 14 };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.4, 1200);
    this.raycaster = new THREE.Raycaster();
    this.phys = new Physics();
    this.dynamic = [];
    this.danceTiles = [];
    this.checkpointMeshes = new Map();
    this.coins = new Map();
    this.pendingCoins = new Set();
    this.remotes = new Map();
    this.scores = new Map([[this.myId, 0]]);
    this.effects = [];
    this.disposables = [];
    this.cam = { yaw: 0, pitch: this.camInit.pitch, dist: this.camInit.dist, cur: this.camInit.dist, lastDrag: 0 };
    this.camTarget = new THREE.Vector3();
    this.buildMode = 'build';
    this.buildType = 0;
    this.round = null;
    this.it = null;
    this.stage = 0;
    this.finished = false;
    this.obbyStart = null;
    this.tagCooldown = 0;
    this.lastSend = 0;
    this.lastState = '';
    this.hudTimer = 0;
    this.emote = null;
    this.airTime = 0;
    this.myAvatar = avatar;
    this.items = new Map();
    this.toggleMeshes = new Map();
    this.toggles = {};
    this.actParts = [];
    this.rings = [];
    this.parked = [];
    this.rockets = [];
    this.riding = null;
    this.petMenu = false;
    try { this.friends = new Set(JSON.parse(localStorage.getItem('hb_friends') || '[]')); } catch { this.friends = new Set(); }
    this.pose = null;
    this.held = null;
    this.voice = new VoiceChat(this);
    this.voiceMuted = true;
    this.eating = 0;
    this.showerT = 0;
    this.fxTimer = 0;
    this.actionsKey = '';
    this.driving = null;
    this.swimming = false;
    this.carriedBy = null;
    this.carrying = null;
    this.portalCooldown = 0;
    this.backPos = null;
    this.place = this.def.name;
    this.pets = new Map();
    this.wildlife = [];
    this.jobTimer = 0;
    this.jobData = null;
    this.quest = e => track(e, msg => this.notice(msg, 3500));

    this.setupScene();
    this.buildWorld();
    this.spawnWildlife();

    this.char = new Character(avatar, name);
    this.char.tag.visible = false;
    this.scene.add(this.char.root);
    this.body = new Body(this.phys);
    this.facing = Math.PI;
    this.spawnPoint = [...this.def.spawn];
    this.respawn(true);
    this.camTarget.set(this.body.p.x, this.body.p.y + 2.2, this.body.p.z);
    this.syncPet(this.myId, avatar);

    for (const p of welcome.players) this.addRemote(p, true);
    this.applyExtra(welcome.extra || {});
    this.setupHud();

    this.onResize();
    window.addEventListener('resize', this.onResize);
    this.running = true;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------- Aufbau ----------
  setSky(color) {
    const horizon = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45);
    const top = new THREE.Color(color).multiplyScalar(0.8);
    this.sky.material.uniforms.top.value.copy(top);
    this.sky.material.uniforms.bottom.value.copy(horizon);
    this.scene.fog.color.copy(horizon);
    this.scene.background = horizon;
  }

  updateLand() {
    const p = this.body.p;
    const l = landAt(p.x, p.z);
    if (!l || l === this.land) return;
    this.land = l;
    this.setSky(l.sky);
    if (this.snow) this.snow.visible = !!l.snow;
    this.place = l.name;
    this.quest?.('visit:' + l.key);
  }

  makeSnow() {
    // Schneeflocken: die Bewegung rechnet die Grafikkarte, der Prozessor fasst sie nicht an
    const n = 1500;
    const seed = new Float32Array(n * 3);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
    this.snowT = 0;
    this.snowU = { uTime: { value: 0 }, uH: { value: 800 }, uProj: { value: 1 }, uSize: { value: 0.35 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.snowU, transparent: true, depthWrite: false,
      vertexShader: `attribute vec3 seed; uniform float uTime; uniform float uH; uniform float uProj; uniform float uSize;
        void main() {
          float y = mod(seed.y * 40.0 - uTime * 3.0, 40.0) - 5.0;
          float x = (seed.x - 0.5) * 90.0 + sin(y * 0.5 + seed.z * 6.2832 + uTime * 0.4) * 0.4;
          float z = (seed.z - 0.5) * 90.0;
          vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uProj * uH * 0.5 / max(-mv.z, 0.1);
        }`,
      fragmentShader: `void main() { vec2 c = gl_PointCoord - 0.5; if (dot(c, c) > 0.25) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, 0.9); }`,
    });
    this.snow = new THREE.Points(geo, mat);
    this.snow.visible = false;
    this.snow.frustumCulled = false;
    this.scene.add(this.snow);
    this.disposables.push(geo, mat);
  }

  updateSnow(dt) {
    if (!this.snow?.visible) return;
    this.snowT += dt;
    this.snowU.uTime.value = this.snowT;
    this.snowU.uH.value = this.renderer.domElement.height;
    this.snowU.uProj.value = this.camera.projectionMatrix.elements[5];
    const c = this.camera.position;
    this.snow.position.set(c.x, c.y - 15, c.z);
  }

  // Karte: Orte im aktuellen Land + Reisen
  openMap(travelOnly = false) {
    const panel = $('mapPanel');
    if (!panel.hidden && !travelOnly) { panel.hidden = true; return; }
    panel.replaceChildren();
    const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; };
    const land = this.land || LAND_DEFS[0];
    const dest = this.def.destinations?.[land.key] || [];
    if (!travelOnly && dest.length) {
      panel.append(mk('h3', '', `🗺️ ${land.emoji} ${land.name} – wohin?`));
      const grid = mk('div', 'map-grid', '');
      for (const [name, x, z] of dest) {
        const b = mk('button', '', name);
        b.onclick = () => { panel.hidden = true; this.goTo(name, x, z); };
        grid.append(b);
      }
      panel.append(grid);
    }
    panel.append(mk('h3', '', '✈️ In ein anderes Land reisen'));
    const g2 = mk('div', 'map-grid', '');
    for (const l of this.def.lands || []) {
      const b = mk('button', '', `${l.emoji} ${l.name}${l === land ? ' (hier)' : ''}`);
      b.onclick = () => { panel.hidden = true; this.travel(l); };
      g2.append(b);
    }
    panel.append(g2);
    const close = mk('button', 'btn', 'Schliessen');
    close.onclick = () => { panel.hidden = true; };
    panel.append(close);
    panel.hidden = false;
  }

  travel(l) {
    if (this.carriedBy != null) return;
    if (this.driving) this.exitVehicle();
    if (this.carrying != null) this.net.send({ t: 'putdown' });
    const fade = $('fade');
    fade.classList.add('on');
    sfx('magic');
    setTimeout(() => {
      this.teleport(l.arrive[0], 0.2, l.arrive[1], Math.PI);
      this.updateLand();
      fade.classList.remove('on');
      this.showBig(`${l.emoji} Willkommen im ${l.name}!`, ['Tippe auf 🗺️ Karte, um alle Orte zu sehen.'], [], 2500);
    }, 400);
  }

  setupScene() {
    const d = this.def;
    const horizon = new THREE.Color(d.sky).lerp(new THREE.Color('#ffffff'), 0.45);
    const top = new THREE.Color(d.sky).multiplyScalar(0.8);
    this.sky = skyDome(top, horizon);
    this.scene.add(this.sky);
    this.disposables.push(this.sky.geometry, this.sky.material);
    this.scene.fog = new THREE.Fog(horizon, 120, 420);
    // Falls der Himmel einmal nicht gezeichnet wird: hell statt schwarz
    this.scene.background = horizon.clone();
    this.makeSnow();
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#8aa07a', 1.15));
    const sun = new THREE.DirectionalLight('#fff4dc', 1.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    const sc = sun.shadow.camera;
    sc.left = -55; sc.right = 55; sc.top = 55; sc.bottom = -55; sc.near = 1; sc.far = 220;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);
    this.sun = sun;
  }

  buildWorld() {
    const parts = this.def.parts;
    for (const p of parts) if (p.k === 'ground' && !p.tex) p.tex = 'grass';
    for (const p of parts) if (p.k === 'baseplate') { p.own = true; p.tex = 'tiles'; }
    this.doors = new Map();
    this.gems = [];
    this.addParts(parts, this.scene, null);
    if (this.def.goal) {
      const [gx, gy, gz] = this.def.goal;
      const geo = new THREE.OctahedronGeometry(1.4);
      const mat = new THREE.MeshLambertMaterial({ color: '#ffd700', emissive: '#ffab00', emissiveIntensity: 0.6 });
      this.disposables.push(geo, mat);
      this.trophy = new THREE.Mesh(geo, mat);
      this.trophy.position.set(gx, gy + 5, gz - 4);
      this.scene.add(this.trophy);
    }
    if (this.gameKey === 'build') this.build = new BuildWorld(this.scene, this.phys);
    if (this.gameKey === 'town') {
      this.build = new BuildWorld(this.scene, this.phys, townCellAllowed);
      // Unsichtbare Bodenfläche zum Anzielen (überall in den Ländern)
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.02;
      this.scene.add(plane);
      this.groundPick = plane;
      this.disposables.push(plane.geometry, plane.material);
    }
    if (this.gameKey === 'coins') {
      this.coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.16, 20);
      this.coinGeo.rotateX(Math.PI / 2);
      this.coinMat = new THREE.MeshLambertMaterial({ color: '#ffd54f', emissive: '#ff8f00', emissiveIntensity: 0.45 });
      this.disposables.push(this.coinGeo, this.coinMat);
    }
  }

  // Baut Teile auf (für die feste Welt und für Abenteuer-Häuser, die man wieder entfernen kann)
  addParts(parts, parent, rec) {
    const disp = rec ? rec.disposables : this.disposables;
    const { own } = buildStatic(parts, parent, disp);
    const ownSet = new Set(own);
    for (const p of parts) {
      let mesh = null;
      if (ownSet.has(p)) {
        const geo = partGeometry(p, true);
        const mat = makeMaterial(p);
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(p.x, (p.k === 'ramp' ? 0 : p.y) + (p.lift || 0), p.z);
        mesh.castShadow = p.k !== 'baseplate';
        mesh.receiveShadow = true;
        parent.add(mesh);
        disp.push(geo, mat);
        if (p.k === 'baseplate') this.ground = mesh;
        const tk = p.key || p.glow;
        if (tk) {
          if (!this.toggleMeshes.has(tk)) this.toggleMeshes.set(tk, []);
          this.toggleMeshes.get(tk).push({ mesh, kind: p.act || 'glow' });
        }
        if (p.lockLamp) this.doorEntry(p.lockLamp).lamps.push(mesh);
        if (p.gem) { const g = { key: p.gem, mesh, x: p.x, y: p.y, z: p.z }; this.gems.push(g); rec?.gems.push(g); if (this.gotGem(p.gem)) mesh.visible = false; }
      }
      if (p.k === 'sign') { const s = signMesh(p, disp); parent.add(s); continue; }
      if (p.ring) this.addRing(p.x, p.y, p.z, p.ring, parent, rec);
      if (p.k === 'ramp') { if (!p.deco) { const rb = makeRamp(p); this.phys.add(rb); rec?.boxes.push(rb); } continue; }
      const box = makeBox(p.x, p.y, p.z, p.w, p.h, p.d, { k: p.k, n: p.n, dyn: !!p.m, part: p });
      if (p.k !== 'deco') { this.phys.add(box); rec?.boxes.push(box); }
      if (p.door) { const d = this.doorEntry(p.door); d.boxes.push(box); if (mesh) d.meshes.push(mesh); }
      if (p.act) {
        const a = { part: p, box, mesh };
        this.actParts.push(a);
        rec?.acts.push(a);
        if (RING_ACTS.has(p.act)) this.addRing(p.x, p.y - p.h / 2, p.z, Math.min(2.6, Math.max(p.w, p.d) / 2 + 0.8), parent, rec);
        if (p.act === 'vehicle') this.addParked(p);
      }
      if (p.m && mesh) { const d = { part: p, mesh, box }; this.dynamic.push(d); rec?.dynamic.push(d); }
      if (p.k === 'dance' && mesh) this.danceTiles.push(mesh);
      if (p.k === 'checkpoint' && mesh) this.checkpointMeshes.set(p.n, mesh);
    }
  }

  doorEntry(k) {
    if (!this.doors.has(k)) this.doors.set(k, { boxes: [], meshes: [], lamps: [], open: false });
    return this.doors.get(k);
  }

  addChunk(parts) {
    const rec = { group: new THREE.Group(), disposables: [], boxes: [], acts: [], rings: [], dynamic: [], gems: [] };
    this.scene.add(rec.group);
    this.addParts(parts, rec.group, rec);
    return rec;
  }

  removeChunk(rec) {
    if (!rec) return;
    rec.group.removeFromParent();
    for (const d of rec.disposables) d.dispose();
    for (const b of rec.boxes) this.phys.remove(b);
    const acts = new Set(rec.acts);
    this.actParts = this.actParts.filter(a => !acts.has(a));
    const rings = new Set(rec.rings);
    this.rings = this.rings.filter(r => !rings.has(r));
    const dyn = new Set(rec.dynamic);
    this.dynamic = this.dynamic.filter(d => !dyn.has(d));
    const gems = new Set(rec.gems);
    this.gems = this.gems.filter(g => !gems.has(g));
    for (const [k, d] of this.doors) if (d.boxes.some(b => rec.boxes.includes(b))) this.doors.delete(k);
  }

  gotGem(key) {
    if (!this.gemSet) { try { this.gemSet = new Set(JSON.parse(localStorage.getItem('hb_gems') || '[]')); } catch { this.gemSet = new Set(); } }
    return this.gemSet.has(key);
  }

  collectGem(g) {
    g.mesh.visible = false;
    this.gemSet.add(g.key);
    try { localStorage.setItem('hb_gems', JSON.stringify([...this.gemSet].slice(-400))); } catch { /* egal */ }
    this.burst(new THREE.Vector3(g.x, g.y, g.z), ['#ffd600', '#fff59d'], 12, 4);
    sfx('coin');
    addStars(1);
    this.quest?.('gem');
  }

  openDoor(k) {
    const d = this.doors.get(k);
    if (!d || d.open) { this.notice('Diese Tür ist schon offen!'); return; }
    d.open = true;
    for (const b of d.boxes) this.phys.remove(b);
    for (const m of d.meshes) m.userData.opening = 0.001;
    for (const l of d.lamps) { l.material.color.set('#76ff03'); l.material.emissive.set('#76ff03'); }
    this.notice('🚪 Eine Tür hat sich geöffnet! Finde sie!', 3000);
    sfx('checkpoint');
  }

  leaveAdventure() {
    if (!this.adv) return;
    this.removeChunk(this.adv.rec);
    this.adv = null;
  }

  // Abenteuer-Haus: jede Stunde neu gebaut; Knöpfe öffnen Türen; Sterne sammeln; oben der Schatz
  updateAdventure(t) {
    if (!this.adv) return;
    const p = this.body.p;
    const seed = hourIndex(Date.now() + this.timeOffset) * 10 + this.adv.id;
    if (seed !== this.adv.seed && !this.adv.stale) {
      // Neue Stunde: das Haus wird erst beim nächsten Betreten umgebaut, nicht während man darin ist
      this.adv.stale = true;
      this.notice('⏰ Die Stunde ist um – beim nächsten Besuch ist das Haus neu!', 3500);
    }
    // Knopf drücken: nahe stehen und Taste E / Knopf "Drücken" nutzen
    const btn = this.adv.rec.acts.find(a => a.part.act === 'button' && Math.hypot(a.part.x - p.x, a.part.z - p.z) < 2);
    if (btn && btn !== this.lastBtn) {
      this.lastBtn = btn;
      this.openDoor(btn.part.target);
    }
    if (!btn) this.lastBtn = null;
    for (const g of this.gems) if (g.mesh.visible && Math.hypot(g.x - p.x, g.z - p.z) < 1.8 && Math.abs(g.y - p.y) < 3) this.collectGem(g);
    for (const g of this.gems) if (g.mesh.visible) { g.mesh.rotation.y += 0.04; g.mesh.position.y = g.y + Math.sin(t * 2 + g.x) * 0.2; }
    // Türen öffnen sich langsam
    for (const d of this.doors.values()) {
      if (!d.open) continue;
      for (const m of d.meshes) if (m.userData.opening !== undefined && m.userData.opening < 1) {
        m.userData.opening = Math.min(1, m.userData.opening + 0.03);
        m.scale.y = Math.max(0.05, 1 - m.userData.opening);
        m.position.y += 0.0;
      }
    }
    // Stundenanzeige
    this.place = `${this.adv.data.theme.name} · noch ${minutesLeft(Date.now() + this.timeOffset)} Min.`;
    // Dach/Rutsche/Ziel: Schatz-Truhe reagiert wie gewohnt über actParts
  }

  // Abenteuer-Haus betreten (wird jede Stunde neu gebaut)
  enterAdventure(id) {
    const seed = hourIndex(Date.now() + this.timeOffset) * 10 + id;
    if (!this.adv || this.adv.seed !== seed || this.adv.id !== id) {
      this.removeChunk(this.adv?.rec);
      const a = makeAdventure(id, seed);
      this.adv = { id, seed, rec: this.addChunk(a.parts), data: a };
    }
    this.safePos = [...this.adv.data.spawn.entry];
    return this.adv.data.spawn;
  }

  addRing(x, y, z, r, parent = this.scene, rec = null) {
    const m = ringMesh(x, y, z, r / 1.1);
    parent.add(m);
    this.rings.push(m);
    rec?.rings.push(m);
  }

  addParked(p) {
    const v = makeVehicle(p.veh, p.vcolor);
    v.position.set(p.x, 0.02 + (p.y - p.h / 2), p.z);
    v.rotation.y = p.rot || 0;
    v.userData.vehType = p.veh;
    v.userData.vehColor = p.vcolor;
    v.visible = false;
    this.scene.add(v);
    this.parked.push(v);
    v.spawnTime = Date.now();
    setTimeout(() => {
      if (this.parked.includes(v)) {
        v.removeFromParent();
        this.parked.splice(this.parked.indexOf(v), 1);
      }
    }, 15 * 60 * 1000);
  }

  applyToggle(key, on) {
    this.toggles[key] = on;
    for (const { mesh, kind } of this.toggleMeshes.get(key) || []) {
      const m = mesh.material;
      if (kind === 'tv') {
        m.color.set(on ? '#4fc3f7' : '#263238');
        m.emissive.set(on ? '#4fc3f7' : '#000000');
        m.emissiveIntensity = on ? 0.8 : 0;
      } else if (kind === 'glow') {
        m.emissive.set(on ? '#fff59d' : '#000000');
        m.emissiveIntensity = on ? 1 : 0;
      }
    }
  }

  applyExtra(x) {
    if (x.items) for (const it of x.items) this.addItem(it);
    if (x.toggles) for (const [k, v] of Object.entries(x.toggles)) this.applyToggle(k, v);
    if (x.blocks && this.build) for (const [bx, by, bz, k] of x.blocks) this.build.place(bx, by, bz, k);
    if (x.coins) for (const c of x.coins) this.addCoin(c);
    if (x.round !== undefined) this.round = x.round;
    if (x.it !== undefined) this.setIt(x.it, true);
    if (x.carry) for (const [by, id] of x.carry) this.onCarry(by, id);
  }

  // ---------- HUD ----------
  setupHud() {
    $('hud').hidden = false;
    $('roomCode').textContent = this.code;
    $('gameTitle').textContent = `${GAMES[this.gameKey].emoji} ${GAMES[this.gameKey].name}`;
    $('chatLog').replaceChildren();
    $('bigMsg').hidden = true;
    $('actions').replaceChildren();
    $('btnMap').hidden = !this.def.destinations;
    this.actionsKey = '';
    const bar = $('buildBar');
    bar.hidden = this.gameKey !== 'build' && this.gameKey !== 'town';
    if (this.gameKey === 'town') this.buildMode = 'play';
    if (!bar.hidden) {
      const modes = bar.querySelector('.modes');
      modes.replaceChildren();
      for (const [id, label] of [['build', '🧱 Bauen'], ['erase', '🧽 Löschen'], ['play', '🏃 Spielen']]) {
        const b = document.createElement('button');
        b.textContent = label;
        b.className = 'mode' + (id === this.buildMode ? ' on' : '');
        b.onclick = () => {
          this.buildMode = id;
          modes.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
          bar.querySelector('.palette').hidden = id !== 'build';
        };
        modes.append(b);
      }
      const pal = bar.querySelector('.palette');
      pal.replaceChildren();
      pal.hidden = this.buildMode !== 'build';
      BLOCK_TYPES.forEach((t, k) => {
        const b = document.createElement('button');
        b.className = 'swatch' + (k === this.buildType ? ' on' : '');
        b.style.background = `${t.color} url(${blockIcon(t)}) center / cover`;
        b.title = t.name;
        b.onclick = () => {
          this.buildType = k;
          pal.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === b));
        };
        pal.append(b);
      });
    }
    this.renderScores();
    this.renderStatus();
  }

  notice(text, ms = 2500) {
    const n = $('notice');
    n.textContent = text;
    n.classList.add('show');
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => n.classList.remove('show'), ms);
  }

  logChat(name, text) {
    const log = $('chatLog');
    const row = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = name + ': ';
    row.append(b, document.createTextNode(text));
    log.append(row);
    while (log.children.length > 5) log.firstChild.remove();
    setTimeout(() => row.remove(), 15000);
  }

  showBig(title, lines, buttons = [], ms = 0) {
    const el = $('bigMsg');
    el.replaceChildren();
    const h = document.createElement('h2');
    h.textContent = title;
    el.append(h);
    for (const l of lines) {
      const p = document.createElement('p');
      p.textContent = l;
      el.append(p);
    }
    for (const [label, fn] of buttons) {
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = label;
      b.onclick = () => { el.hidden = true; fn(); };
      el.append(b);
    }
    el.hidden = false;
    clearTimeout(this.bigTimer);
    if (ms) this.bigTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  nameOf(id) {
    if (id === this.myId) return this.myName;
    return this.remotes.get(id)?.name ?? '?';
  }

  renderScores() {
    const el = $('scoreboard');
    el.replaceChildren();
    const ids = [this.myId, ...[...this.remotes.values()].filter(r => !r.staticBot).map(r => r.id)];
    const g = this.gameKey;
    const sc = id => this.scores.get(id) || 0;
    if (g === 'coins' || g === 'obby') ids.sort((a, b) => sc(b) - sc(a));
    if (g === 'tag') ids.sort((a, b) => sc(a) - sc(b));
    const head = document.createElement('div');
    head.className = 'sb-head';
    head.textContent = `👥 ${ids.length} Spieler ${this.scoreOpen ? '▴' : '▾'}`;
    head.onclick = () => { this.scoreOpen = !this.scoreOpen; this.renderScores(); };
    el.append(head);
    for (const id of this.scoreOpen ? ids.slice(0, 8) : []) {
      const row = document.createElement('div');
      row.className = 'sb-row' + (id === this.myId ? ' me' : '') + (id === this.it ? ' it' : '');
      const n = document.createElement('span');
      const r = this.remotes.get(id);
      n.textContent = (r?.bot ? '🤖 ' : '') + this.nameOf(id) + (id === this.it ? ' 🏃' : '');
      row.append(n);
      if (id !== this.myId && r && !r.bot && !r.staticBot) {
        if (this.friends.has(r.name)) n.textContent += ' ⭐';
        row.onclick = () => this.toggleFriend(r.name);
      }
      const v = document.createElement('span');
      v.className = 'sb-val';
      const s = sc(id);
      if (g === 'coins') v.textContent = `🪙 ${s}`;
      else if (g === 'tag') v.textContent = `⏱ ${s}s`;
      else if (g === 'obby') v.textContent = s > this.def.stages ? '🏆' : `Stufe ${s}`;
      row.append(v);
      el.append(row);
    }
  }

  renderStatus() {
    const el = $('status');
    const now = Date.now() + this.timeOffset;
    let text = '';
    if (this.gameKey === 'obby') {
      const time = this.obbyStart ? (this.finished ? this.finishMs : performance.now() - this.obbyStart) : 0;
      text = this.finished ? `🏆 Geschafft! Zeit ${fmtTime(this.finishMs)}` : `🚩 Stufe ${this.stage}/${this.def.stages}  ·  ⏱ ${fmtTime(time)}`;
    } else if (this.gameKey === 'coins') {
      const r = this.round;
      if (!r) text = '🪙 Münzjagd';
      else if (r.pause) text = `Nächste Runde in ${fmtTime(r.endsAt - now)}`;
      else text = `🪙 ${this.scores.get(this.myId) || 0} Münzen  ·  ⏱ ${fmtTime(r.endsAt - now)}`;
    } else if (this.gameKey === 'tag') {
      const r = this.round;
      if (!r || r.waiting) text = '⏳ Warte auf Mitspieler…';
      else if (r.pause) text = `Nächste Runde in ${fmtTime(r.endsAt - now)}`;
      else if (this.it === this.myId) text = `🏃 DU bist ES! Fange jemanden!  ·  ⏱ ${fmtTime(r.endsAt - now)}`;
      else text = `🏃 ${this.nameOf(this.it)} ist ES – lauf weg!  ·  ⏱ ${fmtTime(r.endsAt - now)}`;
    } else if (this.gameKey === 'build') {
      text = this.buildMode === 'play' ? '🏃 Spielmodus' : this.buildMode === 'erase' ? '🧽 Tippe auf einen Klotz zum Löschen' : '🧱 Tippe, um einen Klotz zu setzen';
    } else if (this.gameKey === 'town') {
      const it = this.held != null ? this.items.get(this.held) : null;
      if (this.buildMode !== 'play') text = this.buildMode === 'erase' ? '🧽 Tippe auf einen Klotz zum Löschen' : `🧱 Bauen: ${BLOCK_TYPES[this.buildType].name}`;
      else if (this.driving) text = `${VEHICLES[this.driving.type].emoji} Du fährst ${VEHICLES[this.driving.type].name}`;
      else if (it) text = `Du trägst: ${ITEM_TYPES[it.type].emoji} ${ITEM_TYPES[it.type].name}`;
      else text = `📍 ${this.place}`;
    } else {
      text = '🎠 Viel Spass auf dem Spielplatz!';
    }
    if (el.textContent !== text) el.textContent = text;
  }

  // ---------- andere Spieler & Bots ----------
  addRemote(p, silent = false) {
    if (this.remotes.has(p.id) || p.id === this.myId) return;
    const char = new Character(p.avatar, p.name, { bot: p.bot });
    this.scene.add(char.root);
    const s = p.state || [...this.def.spawn, 0, 0, 0];
    const pos = new THREE.Vector3(s[0], s[1], s[2]);
    const r = {
      id: p.id, name: p.name, char, pos, target: pos.clone(), rot: s[3] || 0, targetRot: s[3] || 0, anim: ANIMS[s[4]] || 'idle',
      bot: !!p.bot, staticBot: !!p.staticBot, role: p.role, chair: p.chair, veh: 0, vehModel: null, carriedBy: null, speed: 0,
      rideOf: p.rideOf ?? null,
    };
    this.remotes.set(p.id, r);
    this.setRemoteVeh(r, s[5] || 0);
    if (r.rideOf != null) this.setRide(r, r.rideOf);
    this.syncPet(p.id, p.avatar);
    this.scores.set(p.id, p.score || 0);
    if (p.id === this.it) char.setIt(true);
    if (!silent && !p.bot) { this.notice(`👋 ${p.name} ist da!`); sfx('chat'); }
    this.renderScores();
  }

  removeRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    if (r.tag) r.tag.removeFromParent();
    r.char.dispose();
    this.syncPet(id, null);
    this.remotes.delete(id);
    this.scores.delete(id);
    if (this.carrying === id) { this.carrying = null; this.char.holding = this.held != null; }
    if (!r.bot) this.notice(`${r.name} ist gegangen`);
    this.renderScores();
  }

  // Der Fahrer kann auch selbst der Zielpunkt sein (dann steht er im Fahrzeug, nicht als Remote)
  driverView(id) {
    if (id === this.myId) return this.driving ? { pos: this.body.p, rot: this.facing, veh: vehCode(this.driving.type, this.driving.color) } : null;
    return this.remotes.get(id) || null;
  }

  // Beifahrer sitzt rechts neben dem Fahrer
  rideOffset(d) {
    const c = Math.cos(d.rot), s = Math.sin(d.rot);
    return { x: d.pos.x + 0.55 * c, y: d.pos.y, z: d.pos.z - 0.55 * s };
  }

  rideSeat(d) {
    const v = d.veh ? vehDecode(d.veh) : null;
    return v && VEHICLES[v.type] ? SEATS[VEHICLES[v.type].key] : null;
  }

  setRide(r, driverId) {
    r.rideOf = driverId;
    const d = this.driverView(driverId);
    const seat = d && this.rideSeat(d);
    if (seat) { r.char.seatY = seat.pos[1]; r.char.seatZ = seat.pos[2]; }
  }

  onRide({ id, by }) {
    if (id === this.myId) {
      if (by == null) this.endRideLocal();
      else { this.riding = by; this.notice('🪑 Du fährst mit – viel Spass!', 2500); sfx('magic'); }
      return;
    }
    const r = this.remotes.get(id);
    if (!r) return;
    if (by == null) {
      r.rideOf = null;
      r.char.seatY = 0; r.char.seatZ = 0;
    } else this.setRide(r, by);
  }

  endRideLocal() {
    if (this.riding == null) return;
    this.riding = null;
    this.char.seatY = 0; this.char.seatZ = 0;
    this.body.v.x = this.body.v.y = this.body.v.z = 0;
  }

  leaveRide() {
    this.net.send({ t: 'unride' });
    this.endRideLocal();
  }

  setRemoteVeh(r, code) {
    if (r.veh === code) return;
    r.veh = code;
    if (r.vehModel) { r.vehModel.removeFromParent(); r.vehModel = null; }
    const v = vehDecode(code);
    r.char.seatY = 0; r.char.seatZ = 0;
    if (v && VEHICLES[v.type]) {
      r.vehModel = makeVehicle(v.type, v.color);
      r.char.root.add(r.vehModel);
      const seat = SEATS[VEHICLES[v.type].key];
      r.char.seatY = seat.pos[1]; r.char.seatZ = seat.pos[2];
    }
  }

  // ---------- Netzwerk ----------
  onMessage(m) {
    switch (m.t) {
      case 'join': this.addRemote(m.player); break;
      case 'ride': this.onRide(m); break;
      case 'leave': this.removeRemote(m.id); break;
      case 'st':
        for (const [id, x, y, z, r, a, v] of m.l) {
          const rp = this.remotes.get(id);
          if (!rp) continue;
          rp.target.set(x, y, z);
          rp.targetRot = r;
          rp.anim = ANIMS[a] || 'idle';
          this.setRemoteVeh(rp, v || 0);
        }
        break;
      case 'chat': {
        const text = chatText(m.i);
        if (!text) break;
        const who = m.id === this.myId ? this.char : this.remotes.get(m.id)?.char;
        who?.say(text);
        this.logChat(this.nameOf(m.id), text);
        if (m.id !== this.myId) sfx('chat');
        break;
      }
      case 'say': { // freie Sätze von Bots (vom Server festgelegt)
        const r = this.remotes.get(m.id);
        if (r) r.char.say(m.text);
        break;
      }
      case 'score': this.scores.set(m.id, m.v); this.renderScores(); break;
      case 'notice': this.notice(m.text, 3500); break;
      case 'place':
        if (this.build?.place(m.x, m.y, m.z, m.k) && m.by === this.myId) sfx('place');
        break;
      case 'remove':
        if (this.build?.remove(m.x, m.y, m.z) && m.by === this.myId) sfx('remove');
        break;
      case 'coinAdd': this.addCoin(m.c); break;
      case 'coinTaken': {
        const c = this.coins.get(m.id);
        if (c) {
          this.burst(c.mesh.position, '#ffd54f', 10);
          this.scene.remove(c.mesh);
          this.coins.delete(m.id);
        }
        this.pendingCoins.delete(m.id);
        this.scores.set(m.by, m.v);
        if (m.by === this.myId) { sfx('coin'); addStars(1); }
        this.renderScores();
        break;
      }
      case 'round':
        this.round = m.round;
        if (m.reset) { for (const k of this.scores.keys()) this.scores.set(k, 0); this.renderScores(); }
        if (!m.round.pause && !m.round.waiting && m.start) this.notice('🏁 Neue Runde – los geht’s!');
        break;
      case 'roundEnd': {
        const lines = m.results.slice(0, 5).map((r, i) => `${['🥇', '🥈', '🥉'][i] || '  '} ${r.name}: ${this.gameKey === 'coins' ? r.v + ' Münzen' : r.v + ' s als Fänger'}`);
        const win = m.results[0];
        if (m.results.some(r => r.id === this.myId)) {
          const won = win && win.id === this.myId;
          addStars(won ? 15 : 5);
          lines.push(won ? '⭐ +15 Sterne für dich!' : '⭐ +5 Sterne fürs Mitspielen!');
        }
        this.showBig(win ? `🎉 ${win.name} gewinnt!` : 'Runde vorbei', lines, [], 7000);
        sfx('goal');
        break;
      }
      case 'it': this.setIt(m.id, false, m.by); break;
      case 'item': this.addItem(m.it); break;
      case 'itemHold': this.setHolder(m.id, m.by); break;
      case 'itemDrop': {
        const it = this.items.get(m.id);
        if (!it) break;
        this.setHolder(m.id, null);
        it.x = m.x; it.y = m.y; it.z = m.z;
        it.mesh.position.set(m.x, m.y, m.z);
        break;
      }
      case 'itemGone': {
        const it = this.items.get(m.id);
        if (!it) break;
        this.setHolder(m.id, null);
        this.burst(it.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), ['#d7a86e', '#fff3e0', '#ffcc80'], 10, 3);
        this.scene.remove(it.mesh);
        this.items.delete(m.id);
        if (m.by === this.myId) { sfx('eat'); this.char.say('😋 Mmmh!'); addStars(1); }
        else this.remotes.get(m.by)?.char.say('😋');
        break;
      }
      case 'toggle': this.applyToggle(m.key, m.on); sfx('click'); break;
      case 'avatar': {
        const r = this.remotes.get(m.id);
        if (!r) break;
        r.char = this.rebuildChar(r.char, m.avatar, r.name, r.bot);
        this.syncPet(m.id, m.avatar);
        if (r.vehModel) { r.char.root.add(r.vehModel); const v = vehDecode(r.veh); const seat = SEATS[VEHICLES[v.type].key]; r.char.seatY = seat.pos[1]; r.char.seatZ = seat.pos[2]; }
        this.burst(r.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), ['#ffffff', '#f48fb1', '#b39ddb'], 14, 4);
        break;
      }
      case 'carry': this.onCarry(m.by, m.id); break;
      case 'thrown': this.onThrown(m); break;
      case 'fireworks': this.startFireworks(m.x, m.z, m.by); break;
      case 'treated':
        if (m.id === this.myId) {
          this.notice(`✨ ${this.nameOf(m.by)} hat deine Zähne geputzt! Strahlend sauber!`, 3500);
          this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 2.4, this.body.p.z), ['#ffffff', '#e1f5fe', '#fff59d'], 20, 4);
          sfx('goal');
          addStars(3);
        } else {
          const r = this.remotes.get(m.id);
          if (r) this.burst(r.pos.clone().add(new THREE.Vector3(0, 2, 0)), ['#ffffff', '#e1f5fe', '#fff59d'], 16, 4);
        }
        break;
      case 'teleport':
        this.teleport(m.x, m.y, m.z, m.face ?? this.facing);
        break;
      default:
        if (m.t?.startsWith('voice:')) this.voice.onMessage(m);
        break;
    }
  }

  // ---------- Hochheben & Werfen ----------
  onCarry(by, id) {
    if (id === this.myId) {
      this.carriedBy = by;
      this.pose = null;
      if (this.held != null) this.dropItem();
      this.char.say('😮 Huch!');
    } else {
      const r = this.remotes.get(id);
      if (r) r.carriedBy = by;
    }
    if (by === this.myId) { this.carrying = id; this.char.holding = true; sfx('pick'); }
    else { const c = this.charOf(by); if (c) c.holding = true; }
  }

  onThrown(m) {
    if (m.by === this.myId) { this.carrying = null; this.char.holding = this.held != null; }
    else { const c = this.charOf(m.by); if (c) c.holding = false; }
    if (m.id === this.myId) {
      this.carriedBy = null;
      const [x, y, z] = m.pos;
      this.body.p.x = x; this.body.p.y = y; this.body.p.z = z;
      this.body.v.x = m.v[0]; this.body.v.y = m.v[1]; this.body.v.z = m.v[2];
      this.body.ground = null;
      if (m.v[1] > 6) { this.char.say('Wiiii! 🎉'); sfx('bounce'); }
    } else {
      const r = this.remotes.get(m.id);
      if (r) { r.carriedBy = null; if (m.v[1] > 6) r.char.say('Wiiii! 🎉'); }
    }
  }

  carryPos(by) {
    if (by === this.myId) {
      const p = this.body.p;
      return { x: p.x + Math.sin(this.facing) * 0.8, y: p.y + 0.9, z: p.z + Math.cos(this.facing) * 0.8, rot: this.facing };
    }
    const c = this.remotes.get(by);
    if (!c) return null;
    return { x: c.pos.x + Math.sin(c.rot) * 0.8, y: c.pos.y + 0.9, z: c.pos.z + Math.cos(c.rot) * 0.8, rot: c.rot };
  }

  // Sucht oben einen freien Standplatz auf Höhe der Leiterspitze
  findTopSpot(lx, lz, top, fx, fz) {
    const cands = [];
    for (const rad of [1.4, 2.0, 2.6]) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        cands.push([lx + Math.cos(a) * rad, lz + Math.sin(a) * rad]);
      }
    }
    // Von der Leiter weg bevorzugen
    cands.sort((a, b) => ((b[0] - lx) * -fx + (b[1] - lz) * -fz) - ((a[0] - lx) * -fx + (a[1] - lz) * -fz));
    for (const [x, z] of cands) {
      const s = this.phys.surfaceAt(x, z, top + 1.6);
      if (!Number.isFinite(s) || Math.abs(s - top) > 0.9) continue;
      if (this.phys.query(x - 0.4, s + 0.05, z - 0.4, x + 0.4, s + 2.4, z + 0.4).length) continue;
      return [x, s + 0.05, z];
    }
    return [lx, top + 0.05, lz];
  }

  startClimb(trig) {
    const part = trig.part;
    const fx = part.fx || 0, fz = part.fz || 0;
    // Leiter sitzt auf der Mitte der Auslöser-Box, versetzt in Richtung fx/fz
    const lx = part.x - fx * 0.35, lz = part.z - fz * 0.35;
    const top = part.top;
    const p = this.body.p;
    this.pose = null;
    if (this.driving) this.exitVehicle();
    // Figur steht vor der Leiter und schaut zu ihr
    this.climb = {
      x: lx + fx * 0.6, z: lz + fz * 0.6, y: p.y, top,
      facing: Math.atan2(-fx, -fz),
      spot: this.findTopSpot(lx, lz, top, fx, fz),
    };
    this.notice('🧗 Hoch geht’s!', 1500);
  }

  nearestRideable() {
    const p = this.body.p;
    let best = null, bd = 5;
    for (const r of this.remotes.values()) {
      if (r.bot || r.staticBot || !r.veh || r.rideOf != null) continue;
      if ([...this.remotes.values()].some(x => x.rideOf === r.id)) continue;
      const v = vehDecode(r.veh);
      if (!v || !VEHICLES[v.type] || !['car', 'jeep', 'boat', 'speedboat'].includes(VEHICLES[v.type].key)) continue;
      const d = Math.hypot(r.pos.x - p.x, r.pos.z - p.z);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  nearestLadder() {
    const p = this.body.p;
    const tr = this.phys.triggers(p.x - 1.2, p.y, p.z - 1.2, p.x + 1.2, p.y + 2, p.z + 1.2).filter(t => t.k === 'ladder' && t.part && p.y < (t.part.top ?? 99) - 0.5);
    return tr[0] || null;
  }

  nearestPerson() {
    const p = this.body.p;
    let best = null, bd = 2.6;
    for (const r of this.remotes.values()) {
      if (r.staticBot || r.veh || r.carriedBy != null) continue;
      const d = Math.hypot(r.pos.x - p.x, r.pos.z - p.z);
      if (d < bd && Math.abs(r.pos.y - p.y) < 2) { bd = d; best = r; }
    }
    return best;
  }

  // ---------- Eigene Haustiere, die nachlaufen ----------
  syncPet(ownerId, avatar) {
    const want = avatar?.pet || 0;
    const cur = this.pets.get(ownerId);
    if (cur && cur.kind === want) return;
    if (cur) { cur.mesh.removeFromParent(); this.pets.delete(ownerId); }
    if (!want || !PETS[want - 1]) return;
    const mesh = makeItemMesh(ITEM_INDEX[PETS[want - 1].key]);
    mesh.scale.setScalar(1.25);
    const owner = ownerId === this.myId ? this.body.p : this.remotes.get(ownerId)?.pos;
    const pos = new THREE.Vector3(owner?.x || 0, owner?.y || 0, (owner?.z || 0) + 1.5);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.pets.set(ownerId, { kind: want, mesh, pos, rot: 0, t: Math.random() * 5, hop: 0, side: Math.random() < 0.5 ? -1 : 1 });
  }

  updatePets(dt) {
    for (const [ownerId, pet] of this.pets) {
      let ox, oy, oz, orot, visible = true;
      if (ownerId === this.myId) { ({ x: ox, y: oy, z: oz } = this.body.p); orot = this.facing; }
      else {
        const r = this.remotes.get(ownerId);
        if (!r) continue;
        ox = r.pos.x; oy = r.pos.y; oz = r.pos.z; orot = r.rot; visible = r.char.root.visible;
      }
      pet.mesh.visible = visible;
      if (!visible) continue;
      const tx = ox - Math.sin(orot) * 1.8 + Math.cos(orot) * 1.0 * pet.side;
      const tz = oz - Math.cos(orot) * 1.8 - Math.sin(orot) * 1.0 * pet.side;
      const dx = tx - pet.pos.x, dz = tz - pet.pos.z, d = Math.hypot(dx, dz);
      const rest = !!pet.rest;
      if (!rest && (d > 20 || Math.abs(oy - pet.pos.y) > 8)) { pet.pos.set(tx, oy, tz); }
      else if (!rest && d > 0.4) {
        const sp = Math.min(d * 3, 16) * dt;
        pet.pos.x += (dx / d) * sp; pet.pos.z += (dz / d) * sp;
        pet.rot = lerpAngle(pet.rot, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10));
      }
      // Bodenhöhe (für das eigene Tier genau, sonst wie der Besitzer)
      let gy = oy;
      if (ownerId === this.myId) { const s = this.phys.surfaceAt(pet.pos.x, pet.pos.z, oy + 1.2); if (Number.isFinite(s) && s > oy - 4) gy = s; }
      pet.pos.y += (gy - pet.pos.y) * (1 - Math.exp(-dt * 12));
      pet.t += dt;
      if (pet.hop > 0) pet.hop = Math.max(0, pet.hop - dt);
      const moving = !rest && d > 0.6;
      const inner = pet.mesh.userData.inner;
      inner.position.y = Math.abs(Math.sin(pet.t * (moving || pet.hop ? 10 : 2))) * (pet.hop ? 0.5 : moving ? 0.22 : 0.04);
      pet.mesh.position.copy(pet.pos);
      pet.mesh.rotation.y = pet.rot;
    }
  }

  togglePetRest() {
    const pet = this.pets.get(this.myId);
    if (!pet) return;
    pet.rest = !pet.rest;
    pet.hop = 0.6;
    this.char.say(pet.rest ? '🏠 Tier bleibt hier' : '🐾 Komm, Tier!');
    sfx('pet');
  }

  petMyPet() {
    const pet = this.pets.get(this.myId);
    if (!pet) return;
    pet.hop = 1.2;
    this.burst(pet.pos.clone().add(new THREE.Vector3(0, 1, 0)), ['#ff4081', '#ff80ab', '#f8bbd0'], 10, 3, true);
    this.char.say('❤️ Braves Tier!');
    sfx('pet');
    this.quest?.('pet');
  }

  // ---------- Wilde Tiere (wandern frei herum) ----------
  spawnWildlife() {
    if (this.gameKey !== 'town') return;
    const spawns = [
      { key: 'chick', cx: 120, cz: 130, r: 14, n: 6, speed: 2.5, scale: 2.5 },
      { key: 'bunny', cx: 126, cz: 118, r: 16, n: 4, speed: 4, scale: 2.5 },
      { key: 'cat', cx: 112, cz: 126, r: 10, n: 2, speed: 3, scale: 2.5 },
      { key: 'duck', cx: 0, cz: 0, r: 9, n: 5, speed: 2, scale: 2.5 },
      { key: 'duck', cx: 0, cz: 175, r: 10, n: 3, speed: 2, scale: 2.5 },
      { key: 'butterfly', cx: -16, cz: 16, r: 10, n: 4, speed: 3, fly: true, scale: 2.0 },
      { key: 'butterfly', cx: 16, cz: -16, r: 8, n: 3, speed: 3, fly: true, scale: 2.0 },
      { key: 'butterfly', cx: -120, cz: -40, r: 10, n: 3, speed: 3, fly: true, scale: 2.0 },
      { key: 'turtle', cx: -10, cz: 175, r: 14, n: 3, speed: 1, scale: 2.5 },
      { key: 'hamster', cx: -120, cz: -60, r: 12, n: 3, speed: 3, scale: 2.5 },
      { key: 'fox', cx: 60, cz: -60, r: 18, n: 2, speed: 5, scale: 2.5 },
      { key: 'dog', cx: 0, cz: 15, r: 10, n: 2, speed: 4, scale: 2.5 },
      { key: 'bunny', cx: -60, cz: 100, r: 12, n: 3, speed: 4, scale: 2.5 },
      { key: 'parrot', cx: 0, cz: -16, r: 8, n: 2, speed: 3, fly: true, scale: 2.0 },
      // Schneeland
      { key: 'bunny', cx: 2600, cz: 30, r: 25, n: 5, speed: 3, scale: 2.5 },
      { key: 'fox', cx: 2620, cz: -20, r: 20, n: 3, speed: 5, scale: 2.5 },
      { key: 'cat', cx: 2580, cz: 40, r: 15, n: 3, speed: 3, scale: 2.5 },
      { key: 'dog', cx: 2610, cz: 50, r: 12, n: 2, speed: 4, scale: 2.5 },
      // Tropeninsel
      { key: 'parrot', cx: -2600, cz: 20, r: 30, n: 6, speed: 3, fly: true, scale: 2.0 },
      { key: 'turtle', cx: -2580, cz: -10, r: 20, n: 4, speed: 1, scale: 2.5 },
      { key: 'butterfly', cx: -2620, cz: 30, r: 20, n: 5, speed: 3, fly: true, scale: 2.0 },
      { key: 'duck', cx: -2600, cz: -30, r: 12, n: 4, speed: 2, scale: 2.5 },
      // Zauberwald
      { key: 'fox', cx: 20, cz: 2600, r: 25, n: 4, speed: 5, scale: 2.5 },
      { key: 'bunny', cx: -20, cz: 2620, r: 20, n: 5, speed: 4, scale: 2.5 },
      { key: 'butterfly', cx: 10, cz: 2580, r: 25, n: 6, speed: 3, fly: true, scale: 2.0 },
      { key: 'hamster', cx: -30, cz: 2610, r: 15, n: 3, speed: 3, scale: 2.5 },
    ];
    for (const s of spawns) {
      const typeIdx = ITEM_INDEX[s.key];
      if (typeIdx == null) continue;
      for (let i = 0; i < s.n; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * s.r * 0.7;
        const x = s.cx + Math.cos(a) * d, z = s.cz + Math.sin(a) * d;
        const mesh = makeItemMesh(typeIdx);
        mesh.scale.setScalar(s.scale || 2.0);
        mesh.position.set(x, s.fly ? 1.8 : 0.1, z);
        this.scene.add(mesh);
        this.wildlife.push({
          mesh, cx: s.cx, cz: s.cz, r: s.r, speed: s.speed, fly: !!s.fly,
          x, z, y: s.fly ? 1.8 : 0.1,
          tx: x, tz: z,
          rot: Math.random() * Math.PI * 2,
          t: Math.random() * 10,
          wait: Math.random() * 3,
          state: 'idle',
        });
      }
    }
  }

  updateWildlife(dt) {
    for (const w of this.wildlife) {
      w.t += dt;
      if (w.state === 'idle') {
        w.wait -= dt;
        if (w.wait <= 0) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * w.r * 0.7;
          w.tx = w.cx + Math.cos(a) * d;
          w.tz = w.cz + Math.sin(a) * d;
          w.state = 'walk';
        }
      } else {
        const dx = w.tx - w.x, dz = w.tz - w.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.3) {
          w.state = 'idle';
          w.wait = 2 + Math.random() * 5;
        } else {
          const sp = w.speed * dt;
          w.x += (dx / dist) * sp;
          w.z += (dz / dist) * sp;
          w.rot = lerpAngle(w.rot, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8));
        }
      }
      if (w.fly) {
        w.y = 1.2 + Math.sin(w.t * 2) * 0.4;
      } else {
        const s = this.phys.surfaceAt(w.x, w.z, w.y + 1.2);
        if (Number.isFinite(s)) w.y += (s - w.y) * (1 - Math.exp(-dt * 10));
      }
      const inner = w.mesh.userData.inner;
      const moving = w.state === 'walk';
      inner.position.y = Math.abs(Math.sin(w.t * (moving ? 10 : 2))) * (moving ? 0.2 : 0.04);
      if (w.fly) inner.rotation.z = Math.sin(w.t * 12) * 0.3;
      w.mesh.position.set(w.x, w.y, w.z);
      w.mesh.rotation.y = w.rot;
    }
  }

  // ---------- Gegenstände ----------
  charOf(id) { return id === this.myId ? this.char : this.remotes.get(id)?.char; }

  addItem([id, type, x, y, z, holder]) {
    if (this.items.has(id) || !ITEM_TYPES[type]) return;
    const mesh = makeItemMesh(type);
    mesh.position.set(x, y, z);
    mesh.rotation.y = (id * 1.7) % (Math.PI * 2);
    mesh.traverse(o => { o.userData.itemId = id; });
    this.scene.add(mesh);
    this.items.set(id, { id, type, mesh, x, y, z, holder: null, cat: ITEM_TYPES[type].cat, t: Math.random() * 6, hop: 0 });
    if (holder != null) this.setHolder(id, holder);
  }

  setHolder(id, holder) {
    const it = this.items.get(id);
    if (!it) return;
    if (it.holder != null) {
      const c = this.charOf(it.holder);
      if (c) c.holding = false;
      if (it.holder === this.myId) this.held = null;
    }
    it.holder = holder;
    if (holder != null) {
      const c = this.charOf(holder);
      if (c) c.holding = true;
      if (holder === this.myId) { this.held = id; sfx('pick'); }
    }
  }

  nearestItem() {
    const p = this.body.p;
    let best = null, bd = 2.3;
    for (const it of this.items.values()) {
      if (it.holder != null) continue;
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < bd && it.y > p.y - 1.3 && it.y < p.y + 2.6) { bd = d; best = it; }
    }
    return best;
  }

  nearestAct() {
    const p = this.body.p;
    let best = null, bd = 0;
    for (const a of this.actParts) {
      const b = a.box;
      if (b.minY > p.y + 2.6 || b.maxY < p.y - 0.6) continue;
      const dx = Math.max(b.minX - p.x, 0, p.x - b.maxX), dz = Math.max(b.minZ - p.z, 0, p.z - b.maxZ);
      // Reichweite passend zum grünen Ring
      const ringR = Math.min(2.6, Math.max(a.part.w, a.part.d) / 2 + 0.8);
      const reach = RING_ACTS.has(a.part.act) ? ringR - Math.min(a.part.w, a.part.d) / 2 + 0.2 : 1.5;
      const score = Math.hypot(dx, dz) - Math.max(1.5, reach);
      if (score < bd) { bd = score; best = a; }
    }
    return best;
  }

  pickItem(it) {
    if (this.held != null) this.dropItem();
    this.net.send({ t: 'pick', id: it.id });
  }

  dropItem() {
    if (this.held == null) return;
    const p = this.body.p;
    const x = p.x + Math.sin(this.facing) * 1.0, z = p.z + Math.cos(this.facing) * 1.0;
    let y = this.phys.surfaceAt(x, z, p.y + 1.6);
    if (!Number.isFinite(y)) y = p.y;
    this.net.send({ t: 'drop', id: this.held, x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) });
    sfx('drop');
  }

  eatItem() {
    if (this.held == null || this.eating > 0) return;
    this.eating = 1.3;
    this.eatId = this.held;
    sfx('eat');
  }

  petItem(it) {
    it.hop = 1;
    this.burst(it.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), ['#ff4081', '#ff80ab', '#f8bbd0'], 8, 3, true);
    this.char.say('❤️');
    sfx('pet');
  }

  spawnItem(key) {
    if (this.held != null) this.dropItem();
    this.net.send({ t: 'spawn', type: ITEM_INDEX[key] });
  }

  // ---------- Möbel & Aktionen ----------
  sitOn(a, type) {
    const b = a.box, p = this.body.p, inset = 0.35;
    let x = clamp(p.x, b.minX + inset, b.maxX - inset), z = clamp(p.z, b.minZ + inset, b.maxZ - inset);
    let y = b.maxY;
    if (type === 'bath') y = b.maxY - 0.6;
    if (type === 'sleep' || type === 'dchair') { x = (b.minX + b.maxX) / 2; z = (b.minZ + b.maxZ) / 2 + 0.3; }
    if (type === 'swing') { x = (b.minX + b.maxX) / 2; z = (b.minZ + b.maxZ) / 2; y = b.maxY - 0.1; }
    this.pose = { type, x, y, z, facing: a.part.rot ?? this.facing, standY: Math.max(b.maxY + 0.02, p.y), part: a.part, t: 0 };
    this.emote = null;
    if (type === 'sleep') this.char.say('😴 Zzz…');
    if (type === 'bath') this.char.say('🛁 Blubb!');
    if (type === 'swing') this.char.say('Wiiii! 🎠');
    sfx('sit');
  }

  standUp() {
    if (!this.pose) return;
    const p = this.body.p;
    p.x = this.pose.x; p.z = this.pose.z; p.y = this.pose.standY;
    if (this.pose.type === 'swing') p.z += 1.2;
    this.body.v.x = this.body.v.y = this.body.v.z = 0;
    this.pose = null;
  }

  doAct(a) {
    const k = a.part.act;
    switch (k) {
      case 'sit': case 'bath': case 'sleep': case 'swing': this.sitOn(a, k); break;
      case 'dchair': this.sitOn(a, 'dchair'); this.notice('😮 Mund auf! Tippe «Behandlung starten» oder warte auf eine Zahnärztin.', 3500); break;
      case 'salon': this.sitOn(a, 'sit'); this.openAvatarPanel(a.part.title || '💇 Friseur', SALON_TABS, a.part.title ? 'face' : null); break;
      case 'wardrobe': this.openAvatarPanel(a.part.title || '👗 Umziehen', CLOTHES_TABS, a.part.tab); break;
      case 'shower': this.showerT = 4; this.char.say('🚿 🎶'); sfx('shower'); break;
      case 'menu': this.openItemMenu(a.part.title, a.part.menu); break;
      case 'travel': this.openMap(true); break;
      case 'adopt': this.openAvatarPanel('🐾 Haustier adoptieren', PET_TABS); break;
      case 'tv': case 'lamp': this.net.send({ t: 'toggle', key: a.part.key }); break;
      case 'vehicle': this.enterVehicle(a.part.veh, a.part.vcolor, a.part); break;
      case 'treasure': this.openTreasure(a.part); break;
      case 'fireworks': this.net.send({ t: 'fireworks', x: a.part.x, z: a.part.z }); break;
      case 'brush':
        openTeethGame({ title: '🪥 Zähne putzen', onDone: ok => { if (ok) { earnWork(3); this.notice('✨ Strahlende Zähne! +3 ⭐'); this.char.say('😁✨'); } } });
        break;
      case 'dentist': this.treatPatient(a.part.chair); break;
      case 'register': {
        sfx('coin');
        earnWork(2);
        this.char.say('Piep! 🛒');
        this.notice('🛒 Einkauf erledigt! ⭐ +2 Sterne');
        const bot = [...this.remotes.values()].find(r => r.staticBot && Math.hypot(r.pos.x - this.body.p.x, r.pos.z - this.body.p.z) < 6);
        bot?.char.say('Danke für den Einkauf! 😊');
        break;
      }
      case 'job': {
        if (this.jobTimer > 0) { this.notice('💼 Du arbeitest schon!'); break; }
        const wk = a.part.title || String(a.part.jobId ?? 0);
        const wait = jobWait(wk);
        if (wait > 0) { this.notice(`⏳ Hier gibt es in ${Math.ceil(wait / 60000)} Min. wieder Arbeit`, 2800); break; }
        markJob(wk);
        const jt = a.part?.job || JOB_TASKS[a.part?.jobId ?? 0];
        this.jobTimer = jt.time;
        this.jobData = jt;
        this.notice(`${jt.emoji} ${jt.msg}`);
        sfx('magic');
        this.emote = 'walk';
        break;
      }
    }
  }

  openTreasure(part) {
    const key = 'hb_chest_' + part.key;
    const today = new Date().toDateString();
    let got = false;
    try { got = localStorage.getItem(key) === today; } catch { /* egal */ }
    const p = this.body.p;
    this.burst(new THREE.Vector3(p.x, p.y + 2, p.z), ['#ffd54f', '#fff59d', '#ff80ab', '#80deea'], got ? 12 : 50, 10);
    if (got) { this.notice('🎁 Schon geöffnet – morgen gibt es einen neuen Schatz!'); return; }
    try { localStorage.setItem(key, today); } catch { /* egal */ }
    addStars(15);
    sfx('goal');
    this.showBig('🎁 Schatz gefunden!', ['⭐ +15 Sterne!', 'Super gemacht!'], [], 3500);
  }

  treatPatient(chair) {
    const patient = [...this.remotes.values()].find(r => r.chair === chair && (r.role === 'patient' || r.anim === 'sleep') && Math.hypot(r.pos.x - this.body.p.x, r.pos.z - this.body.p.z) < 6);
    const human = !patient && [...this.remotes.values()].find(r => !r.bot && r.anim === 'sleep' && Math.hypot(r.pos.x - this.body.p.x, r.pos.z - this.body.p.z) < 4);
    const who = patient || human;
    if (!who) { this.notice('Kein Patient auf diesem Stuhl. Warte kurz! 🦷'); return; }
    who.char.say('Aaaah! 😮');
    openTeethGame({
      title: '🦷 Zähne behandeln', patient: who.name,
      onDone: ok => {
        if (!ok) return;
        this.net.send({ t: 'treated', id: who.id });
        this.quest('dentist');
        addStars(5);
        this.notice(`✨ Super, Frau Doktor! ${who.name} hat saubere Zähne. +5 ⭐`, 3500);
      },
    });
  }

  selfTreatment() {
    const dentist = [...this.remotes.values()].find(r => r.role === 'dentist');
    const lines = ['Hallo! Mund weit auf! 😮', 'Ich schaue mal… 🔍', 'Schön putzen… 🪥', 'Fertig! Super Zähne! ✨'];
    lines.forEach((l, i) => setTimeout(() => {
      if (!this.pose || this.pose.type !== 'dchair') return;
      if (dentist) dentist.char.say(l); else this.notice(l, 1500);
      const p = this.body.p;
      this.burst(new THREE.Vector3(p.x, p.y + 1.2, p.z - 0.6), ['#ffffff', '#e1f5fe'], 8, 3, true);
      if (i === lines.length - 1) { earnWork(3); this.char.say('😁✨'); sfx('goal'); }
      else sfx('click');
    }, i * 1600));
  }

  openItemMenu(title, keys) {
    const panel = $('itemMenu');
    panel.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'item-grid';
    for (const key of keys) {
      const t = ITEM_TYPES[ITEM_INDEX[key]];
      const b = document.createElement('button');
      const e = document.createElement('span');
      e.className = 'e';
      e.textContent = t.emoji;
      b.append(e, document.createTextNode(t.name));
      b.onclick = () => { panel.hidden = true; this.spawnItem(key); };
      grid.append(b);
    }
    const close = document.createElement('button');
    close.className = 'btn';
    close.textContent = 'Schliessen';
    close.onclick = () => { panel.hidden = true; };
    panel.append(h, grid, close);
    panel.hidden = false;
  }

  openAvatarPanel(title, tabs, first) {
    const panel = $('avatarPanel');
    panel.querySelector('h3').textContent = title;
    const ed = avatarEditor(panel.querySelector('.tabs'), panel.querySelector('.opt-grid'), tabs, a => {
      saveAvatar(a);
      this.setMyAvatar(a);
      ed.render();
    }, t => this.notice(t, 2500));
    if (first) ed.show(first);
    panel.querySelector('.close').onclick = () => {
      panel.hidden = true;
      if (this.pose && this.pose.type === 'sit') this.standUp();
    };
    panel.hidden = false;
  }

  rebuildChar(old, avatar, name, bot = false) {
    const c = new Character(avatar, name, { bot });
    c.root.position.copy(old.root.position);
    c.root.rotation.y = old.root.rotation.y;
    c.holding = old.holding;
    c.seatY = old.seatY; c.seatZ = old.seatZ;
    if (old.ring.visible) c.setIt(true);
    this.scene.add(c.root);
    old.dispose();
    return c;
  }

  setMyAvatar(a) {
    this.myAvatar = a;
    const veh = this.driving?.model;
    this.char = this.rebuildChar(this.char, a, this.myName);
    this.char.tag.visible = false;
    if (veh) this.char.root.add(veh);
    if ((a.pet || 0) !== (this.pets.get(this.myId)?.kind || 0)) { this.syncPet(this.myId, a); if (a.pet) { this.notice('🐾 Dein Haustier läuft dir jetzt überall nach!', 3000); this.quest?.('adopt'); } }
    this.net.send({ t: 'avatar', avatar: a });
    this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 1.6, this.body.p.z), ['#ffffff', '#f48fb1', '#b39ddb', '#fff59d'], 16, 4);
    sfx('magic');
  }

  // ---------- Fahrzeuge ----------
  enterVehicle(type, color, part) {
    if (this.driving || this.carriedBy != null || this.riding != null) return;
    if (this.held != null) this.dropItem();
    if (this.carrying != null) this.net.send({ t: 'putdown' });
    const V = VEHICLES[type];
    const model = makeVehicle(type, color);
    this.char.root.add(model);
    const seat = SEATS[V.key];
    this.char.seatY = seat.pos[1];
    this.char.seatZ = seat.pos[2];
    this.driving = { type, color, model, speed: 0, anim: seat.anim, bump: 0 };
    if (part) { this.body.p.x = part.x; this.body.p.z = part.z; this.body.p.y = Math.max(this.body.p.y, part.y - part.h / 2 + 0.02); this.facing = part.rot || 0; }
    this.body.half = V.half;
    this.body.height = V.height;
    this.body.speed = V.speed;
    this.body.canClimb = false;
    this.body.depenetrate();
    this.cam.yaw = this.facing + Math.PI;
    sfx('magic');
    if (V.water) this.notice(`${V.emoji} Ahoi! Ab aufs Wasser! Joystick hoch = fahren`, 3000);
    else this.notice(`${V.emoji} Los geht's! Joystick hoch = fahren, links/rechts = lenken`, 3000);
  }

  exitVehicle() {
    if (!this.driving) return;
    const d = this.driving;
    const wasWater = VEHICLES[d.type]?.water;
    d.model.removeFromParent();
    const parked = makeVehicle(d.type, d.color);
    parked.position.set(this.body.p.x, this.body.p.y - 0.3, this.body.p.z);
    parked.rotation.y = this.facing;
    parked.userData.vehType = d.type;
    parked.userData.vehColor = d.color;
    this.scene.add(parked);
    this.parked.push(parked);
    parked.spawnTime = Date.now();
    setTimeout(() => {
      if (this.parked.includes(parked)) {
        parked.removeFromParent();
        this.parked.splice(this.parked.indexOf(parked), 1);
      }
    }, 15 * 60 * 1000);
    this.char.seatY = 0; this.char.seatZ = 0;
    this.driving = null;
    const p = this.body.p;
    const sx = Math.cos(this.facing) * 2.2, sz = -Math.sin(this.facing) * 2.2;
    this.body.half = PLAYER.half;
    this.body.height = PLAYER.height;
    this.body.speed = PLAYER.speed;
    this.body.canClimb = false;
    p.x += sx; p.z += sz;
    if (wasWater) {
      this.swimming = true;
      this.body.swimming = true;
      this.body.swimY = SEA.swimY;
      this.body.speed = 5;
      this.notice('💦 Du schwimmst! Springen zum Rausklettern', 2500);
    } else {
      p.y += 0.3;
    }
    this.body.v.x = this.body.v.y = this.body.v.z = 0;
    this.burst(new THREE.Vector3(p.x - sx, p.y + 1, p.z - sz), wasWater ? ['#ffffff', '#b3e5fc'] : ['#ffffff', '#e0e0e0'], 12, 3);
    sfx('pop');
  }

  nearestParked() {
    const p = this.body.p;
    let best = null, bd = 4;
    for (const v of this.parked) {
      const dx = v.position.x - p.x, dz = v.position.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < bd && Math.abs(v.position.y - p.y) < 3) { bd = d; best = v; }
    }
    return best;
  }

  enterParked(v) {
    const type = v.userData.vehType, color = v.userData.vehColor;
    v.removeFromParent();
    this.parked.splice(this.parked.indexOf(v), 1);
    this.enterVehicle(type, color);
  }

  // ---------- Türen ----------
  usePortal(part) {
    const now = performance.now();
    if (now < this.portalCooldown) return;
    this.portalCooldown = now + 1500;
    let dest, face;
    if (part.to === 'back') {
      dest = this.backPos ? [this.backPos.x, 0.15, this.backPos.z] : [...this.def.spawn];
      face = this.backPos?.face ?? 0;
      this.place = this.land?.name || 'Hana-Stadt';
      this.leaveAdventure();
      this.houseEntry = null;
    } else if (part.to.startsWith('adv:')) {
      const id = Number(part.to.split(':')[1]);
      this.backPos = { x: part.out[0], z: part.out[1], face: part.outFace };
      const spawn = this.enterAdventure(id);
      dest = spawn.entry;
      face = spawn.face;
      this.place = this.adv.data.theme.name;
      this.houseEntry = [dest[0], dest[1] + 0.05, dest[2]];
      this.quest?.('adventure');
    } else {
      const it = this.def.interiors?.[part.to];
      if (!it) return;
      this.backPos = { x: part.out[0], z: part.out[1], face: part.outFace };
      dest = it.spawn.entry;
      face = it.spawn.face;
      this.place = part.name || 'Haus';
      this.houseEntry = [dest[0], dest[1] + 0.05, dest[2]];
    }
    const fade = $('fade');
    fade.classList.add('on');
    sfx('pop');
    setTimeout(() => {
      this.teleport(dest[0], dest[1] + 0.05, dest[2], face);
      this.notice(`🚪 ${this.place}`, 1800);
      fade.classList.remove('on');
    }, 220);
  }

  teleport(x, y, z, face) {
    if (this.driving) this.exitVehicle();
    this.pose = null;
    this.climb = null;
    const p = this.body.p;
    p.x = x; p.y = y; p.z = z;
    this.body.v.x = this.body.v.y = this.body.v.z = 0;
    this.body.ground = null;
    this.facing = face;
    this.cam.yaw = face + Math.PI;
    this.camTarget.set(x, y + 2.2, z);
    this.cam.cur = 4;
    this.portalCooldown = performance.now() + 1200;
    this.lastSend = 0;
  }

  goTo(name, x, z) {
    if (this.carriedBy != null) return;
    if (this.driving) this.exitVehicle();
    if (this.carrying != null) this.net.send({ t: 'putdown' });
    this.place = name.replace(/^\S+\s/, '');
    const fade = $('fade');
    fade.classList.add('on');
    setTimeout(() => {
      this.teleport(x, Math.max(0.15, this.phys.surfaceAt(x, z, 30) + 0.05) || 0.15, z, Math.PI);
      fade.classList.remove('on');
      this.notice(`📍 ${name}`, 1800);
    }, 220);
  }

  resetCharacter() {
    this.pose = null;
    if (this.driving) this.exitVehicle();
    if (this.held != null) this.dropItem();
    if (this.carriedBy != null) this.net.send({ t: 'release' });
    this.place = this.def.name;
    this.respawn(false, '🔄 Figur zurückgesetzt');
  }

  // ---------- Knöpfe für Aktionen ----------
  updateActions() {
    const el = $('actions');
    const list = [];
    if (this.riding != null) {
      list.push(['🚪 Absteigen', () => this.leaveRide()]);
    } else if (this.driving) {
      list.push(['🚪 Aussteigen', () => this.exitVehicle()]);
      list.push(['📯 Hupen', () => { sfx('horn'); this.char.say('Tuuut! 📯'); }]);
    } else if (this.carriedBy != null) {
      list.push(['🦘 Runterspringen', () => this.net.send({ t: 'release' })]);
    } else if (this.carrying != null) {
      list.push(['🤾 Werfen', () => this.net.send({ t: 'throw' })]);
      list.push(['⬇️ Absetzen', () => this.net.send({ t: 'putdown' })]);
    } else if (this.pose) {
      list.push(['⬆️ Aufstehen', () => this.standUp()]);
      if (this.pose.type === 'dchair') list.push(['🦷 Behandlung starten', () => this.selfTreatment()]);
    } else {
      if (this.held != null) {
        const it = this.items.get(this.held);
        if (it) {
          if (it.cat === 'food') list.push([`😋 ${ITEM_TYPES[it.type].emoji} Essen`, () => this.eatItem()]);
          if (it.cat === 'pet') list.push(['❤️ Streicheln', () => this.petItem(it)]);
          list.push(['🤲 Hinlegen', () => this.dropItem()]);
        }
      } else {
        const it = this.nearestItem();
        if (it) {
          list.push([`✋ ${ITEM_TYPES[it.type].emoji} Nehmen`, () => this.pickItem(it)]);
          if (it.cat === 'pet') list.push(['❤️ Streicheln', () => this.petItem(it)]);
        }
      }
      const myPet = this.pets.get(this.myId);
      if (myPet && this.petMenu && this.held == null && list.length < 3) list.push([myPet.rest ? '🐾 Tier zurückrufen' : '🏠 Tier hier ablegen', () => this.togglePetRest()]);
      const ride = !this.driving && this.nearestRideable();
      if (ride) list.unshift([`🪑 ${ride.name} mitfahren`, () => this.net.send({ t: 'ride', id: ride.id })]);
      const lad = !this.body.climbing && !this.autoClimb && this.nearestLadder();
      if (lad) list.unshift(['🧗 Hochklettern', () => this.startClimb(lad)]);
      if (list.length < 2 && this.held == null) {
        const r = this.nearestPerson();
        if (r) list.push([`🤗 ${r.name} hochheben`, () => this.net.send({ t: 'grab', id: r.id })]);
      }
      if (list.length < 3) {
        const a = this.nearestAct();
        if (a && a.part.act === 'button') { /* Knopf wird unten als eigener Eintrag gezeigt */ }
        else if (a) {
          const pa = a.part;
          if (pa.act === 'button') list.push(['🔴 Knopf drücken', () => this.openDoor(pa.target)]);
          let label = pa.act === 'menu' ? pa.title : (pa.title || ACT_LABELS[pa.act]);
          if (pa.act === 'tv') label = this.toggles[pa.key] ? '📺 Ausschalten' : '📺 Einschalten';
          if (pa.act === 'lamp') label = this.toggles[pa.key] ? '💡 Licht aus' : '💡 Licht an';
          if (pa.act === 'vehicle') label = `${VEHICLES[pa.veh].emoji} ${VEHICLES[pa.veh].name} fahren`;
          if (label) list.push([label, () => this.doAct(a)]);
        }
      }
      if (list.length < 3 && !this.driving) {
        const pv = this.nearestParked();
        if (pv) {
          const V = VEHICLES[pv.userData.vehType];
          list.push([`${V.emoji} ${V.name} einsteigen`, () => this.enterParked(pv)]);
        }
      }
    }
    const key = list.map(l => l[0]).join('|');
    if (key === this.actionsKey) return;
    this.actionsKey = key;
    el.replaceChildren();
    for (const [label, fn] of list) {
      const b = document.createElement('button');
      b.className = 'act-btn';
      b.textContent = label;
      b.onpointerdown = e => { e.stopPropagation(); };
      b.onclick = () => { fn(); this.actionsKey = null; };
      el.append(b);
    }
  }

  updateItems(dt) {
    for (const it of this.items.values()) {
      const inner = it.mesh.userData.inner;
      if (it.holder != null) {
        const c = this.charOf(it.holder);
        if (!c) continue;
        const r = c.root.rotation.y;
        it.mesh.position.set(c.root.position.x + Math.sin(r) * 0.85, c.root.position.y + c.body.position.y * 0.8 + 1.3, c.root.position.z + Math.cos(r) * 0.85);
        it.mesh.rotation.y = r;
        inner.position.y = 0;
        continue;
      }
      it.t += dt;
      if (it.hop > 0) it.hop = Math.max(0, it.hop - dt * 1.5);
      if (it.cat === 'pet') {
        inner.position.y = Math.abs(Math.sin(it.t * (it.hop ? 9 : 2.5))) * (it.hop ? 0.35 : 0.06);
        if (Math.sin(it.t * 0.4 + it.id) > 0.97) it.mesh.rotation.y += dt * 2;
      } else if (ITEM_TYPES[it.type].key === 'balloon') {
        inner.position.y = Math.sin(it.t * 1.5) * 0.1;
      } else inner.position.y = 0;
    }
  }

  setIt(id, silent, by) {
    const prev = this.it;
    this.it = id;
    if (prev != null) {
      if (prev === this.myId) this.char.setIt(false);
      else this.remotes.get(prev)?.char.setIt(false);
    }
    if (id != null) {
      if (id === this.myId) this.char.setIt(true);
      else this.remotes.get(id)?.char.setIt(true);
    }
    this.body.speedMul = id === this.myId ? 1.12 : 1;
    if (id === this.myId) this.tagCooldown = performance.now() + 2000;
    if (!silent && id != null) {
      if (id === this.myId) this.notice(by != null ? `${this.nameOf(by)} hat dich gefangen! Jetzt bist DU es!` : 'DU bist ES! Fange die anderen!');
      else this.notice(`${this.nameOf(id)} ist jetzt ES!`);
      sfx('tag');
    }
    this.renderScores();
  }

  sendState(now) {
    if (now - this.lastSend < 66 || this.riding != null) return;
    const p = this.body.p;
    const a = ANIMS.indexOf(this.anim);
    const veh = this.driving ? vehCode(this.driving.type, this.driving.color) : 0;
    const s = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +this.facing.toFixed(2), a, veh];
    const key = s.join(',');
    if (key === this.lastState && now - this.lastSend < 1000) return;
    this.lastState = key;
    this.lastSend = now;
    this.net.send({ t: 's', s });
  }

  // ---------- Münzen ----------
  addCoin([id, x, y, z]) {
    if (this.coins.has(id) || !this.coinGeo) return;
    const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.coins.set(id, { mesh, x, y, z });
  }

  // ---------- Effekte ----------
  burst(pos, color, n = 14, up = 6, float = false) {
    const geo = this.burstGeo || (this.burstGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22));
    if (!this.disposables.includes(geo)) this.disposables.push(geo);
    const colors = Array.isArray(color) ? color : [color];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 4;
      const hs = float ? 0.4 : 1;
      this.effects.push({ m, v: new THREE.Vector3(Math.cos(a) * sp * hs, up * (0.5 + Math.random()), Math.sin(a) * sp * hs), life: 1, g: float ? 2 : 15 });
      this.scene.add(m);
    }
  }

  // ---------- Feuerwerk ----------
  startFireworks(x, z, by) {
    const p = this.body.p;
    if (Math.hypot(x - p.x, z - p.z) > 320) return;
    this.notice(`🎆 ${by} zündet ein Feuerwerk!`, 2500);
    for (let i = 0; i < 12; i++) setTimeout(() => this.launchRocket(x + (Math.random() - 0.5) * 18, z + (Math.random() - 0.5) * 18), i * 380 + Math.random() * 200);
  }

  launchRocket(x, z) {
    if (!this.running) return;
    const geo = this.rocketGeo || (this.rocketGeo = new THREE.SphereGeometry(0.28, 8, 6));
    if (!this.disposables.includes(geo)) this.disposables.push(geo);
    const sets = [['#ff1744', '#ff8a80', '#ffffff'], ['#ffea00', '#ff9100'], ['#00e5ff', '#2979ff', '#ffffff'], ['#76ff03', '#ffff00'], ['#d500f9', '#ff4081', '#ffffff'], ['#ff9100', '#ffd180']];
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#fff8e1' }));
    m.position.set(x, 1.2, z);
    this.scene.add(m);
    this.rockets.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, 17 + Math.random() * 5, (Math.random() - 0.5) * 3), colors: sets[Math.floor(Math.random() * sets.length)] });
    sfx('whoosh');
  }

  updateRockets(dt) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.v.y -= 15 * dt;
      r.m.position.addScaledVector(r.v, dt);
      if (Math.random() < 0.5) this.burst(r.m.position.clone(), ['#ffe082', '#ffffff'], 1, 0.5, true);
      if (r.v.y > 3) continue;
      const geo = this.burstGeo || (this.burstGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22));
      if (!this.disposables.includes(geo)) this.disposables.push(geo);
      for (let k = 0; k < 48; k++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: r.colors[k % r.colors.length], transparent: true }));
        m.position.copy(r.m.position);
        m.scale.setScalar(2.3);
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        this.effects.push({ m, v: dir.multiplyScalar(7 + Math.random() * 3.5), life: 2, g: 2.5 });
        this.scene.add(m);
      }
      sfx('boom');
      this.scene.remove(r.m);
      r.m.material.dispose();
      this.rockets.splice(i, 1);
    }
  }

  // ---------- Selfie ----------
  takePhoto() {
    if (this.photoBusy) return;
    this.photoBusy = true;
    if (!this.driving && !this.pose) this.emote = 'wave';
    this.selfie = true;
    sfx('click');
    setTimeout(() => { this.photoReq = true; }, 800);
  }

  finishPhoto() {
    this.photoReq = false;
    const src = this.renderer.domElement;
    const W = 1200, H = Math.round(W * src.height / src.width);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0, W, H);
    this.selfie = false;
    this.emote = null;
    // Rahmen und Schriftzug wie ein Sofortbild
    g.lineWidth = 28; g.strokeStyle = '#ffffff'; g.strokeRect(14, 14, W - 28, H - 28);
    const label = `⭐ HanaBlox · ${this.myName} · ${this.place || 'Hana-Stadt'} · ${new Date().toLocaleDateString('de-CH')}`;
    g.font = '800 34px Nunito, Arial, sans-serif';
    const tw = g.measureText(label).width;
    g.fillStyle = 'rgba(124,77,255,0.88)';
    g.beginPath(); g.roundRect((W - tw) / 2 - 22, H - 96, tw + 44, 56, 28); g.fill();
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.fillText(label, (W - tw) / 2, H - 68);
    const flash = document.createElement('div');
    flash.className = 'photo-flash';
    document.body.append(flash);
    setTimeout(() => flash.remove(), 500);
    sfx('pop');
    c.toBlob(blob => { this.photoBusy = false; this.onPhoto?.(blob, c.toDataURL('image/jpeg', 0.85)); }, 'image/jpeg', 0.9);
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      e.v.y -= (e.g ?? 15) * dt;
      e.m.position.addScaledVector(e.v, dt);
      e.m.rotation.x += dt * 5;
      e.m.material.opacity = Math.max(0, e.life);
      if (e.life <= 0) {
        this.scene.remove(e.m);
        e.m.material.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  // ---------- Spieler ----------
  respawn(initial = false, msg) {
    let [x, y, z] = this.spawnPoint;
    if (this.land && this.land.key !== 'stadt' && this.gameKey === 'town') [x, y, z] = [this.land.arrive[0], 0.2, this.land.arrive[1]];
    // Im Haus: zurück an den Eingang dieses Hauses (nie zum Flughafen)
    if (this.houseEntry) [x, y, z] = this.houseEntry;
    if (!initial) this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 1.3, this.body.p.z), ['#ffffff', '#ffeb3b', '#f48fb1'], 14);
    this.body.p.x = x + (Math.random() - 0.5) * 2;
    this.body.p.y = y + 0.05;
    this.body.p.z = z + (Math.random() - 0.5) * 2;
    this.body.v.x = this.body.v.y = this.body.v.z = 0;
    this.body.ground = null;
    if (this.swimming) { this.swimming = false; this.body.swimming = false; this.body.speed = PLAYER.speed; }
    if (!initial) { sfx('pop'); if (msg) this.notice(msg, 1500); }
  }

  seaAt(x, z) {
    return this.phys.query(x - 0.1, SEA.floor - 3, z - 0.1, x + 0.1, -2, z + 0.1).some(b => b.k === 'water');
  }

  stopSwim() {
    if (!this.swimming && !this.body.swimming) return;
    this.swimming = false;
    this.body.swimming = false;
    if (!this.driving) { this.body.speed = PLAYER.speed; this.body.height = PLAYER.height; }
  }

  // Meer: wo der Boden (Strand) höher ist als die Schwimmtiefe, läuft man; weiter draussen schwimmt man.
  updateWater() {
    const b = this.body, p = b.p;
    const boat = this.driving && VEHICLES[this.driving.type]?.water;
    if (!this.seaAt(p.x, p.z)) { this.stopSwim(); return; }
    const lvl = boat ? SEA.boatY : SEA.swimY;
    const floor = this.phys.surfaceAt(p.x, p.z, p.y + 0.7);
    if (floor >= lvl - 0.02 || p.y > lvl + 0.05) { this.stopSwim(); return; }
    if (boat) { p.y = lvl; b.v.y = 0; b.grounded = true; return; }
    if (this.driving) this.exitVehicle();
    if (!this.swimming) {
      this.swimming = true;
      const now = performance.now();
      if (now - (this.swimNoticeAt || 0) > 20000) { this.swimNoticeAt = now; sfx('pop'); this.notice('💦 Du schwimmst! Schwimm zum Strand, dort kannst du rauslaufen', 2500); }
    }
    b.swimming = true;
    b.swimY = lvl;
    b.speed = 6;
    b.height = 1.8;
    p.y = lvl;
    if (b.v.y < 0) b.v.y = 0;
    b.grounded = true;
  }

  onTouch(b) {
    switch (b.k) {
      case 'lava': this.respawn(false, 'Autsch, heiss! 🔥 Nochmal versuchen!'); return true;
      case 'water': return false;
      case 'checkpoint':
        if (b.n > this.stage) {
          this.stage = b.n;
          this.spawnPoint = [(b.minX + b.maxX) / 2, b.maxY, (b.minZ + b.maxZ) / 2];
          const mesh = this.checkpointMeshes.get(b.n);
          if (mesh) mesh.material.color.set('#69f0ae');
          this.notice(`🚩 Checkpoint ${b.n}!`);
          this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 1, this.body.p.z), ['#69f0ae', '#ffffff'], 16);
          sfx('checkpoint');
          addStars(2);
          this.net.send({ t: 'score', v: this.stage });
        }
        break;
      case 'goal':
        if (this.gameKey === 'obby' && !this.finished) {
          this.finished = true;
          this.finishMs = this.obbyStart ? performance.now() - this.obbyStart : 0;
          let best = 0;
          try { best = Number(localStorage.getItem('hb_obby_best') || 0); } catch { /* egal */ }
          const isBest = !best || this.finishMs < best;
          try { if (isBest) localStorage.setItem('hb_obby_best', String(Math.round(this.finishMs))); } catch { /* egal */ }
          this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 2, this.body.p.z), ['#ff1744', '#ffea00', '#00e676', '#00b0ff', '#d500f9'], 60, 12);
          sfx('goal');
          this.net.send({ t: 'finish', ms: Math.round(this.finishMs) });
          this.net.send({ t: 'score', v: this.def.stages + 1 });
          addStars(25);
          this.showBig('🏆 Geschafft!', [`Deine Zeit: ${fmtTime(this.finishMs)}`, isBest ? '🥇 Neue Bestzeit!' : `Bestzeit: ${fmtTime(best)}`, '⭐ +25 Sterne!'],
            [['Nochmal von vorne', () => this.restartObby()], ['Weiterspielen', () => {}]]);
        } else if (this.gameKey !== 'obby' && !this.goalDone) {
          this.goalDone = true;
          this.notice('⭐ Ganz oben angekommen! +10 Sterne');
          addStars(10);
          this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 2, this.body.p.z), ['#ffea00', '#ffffff'], 30, 10);
          sfx('goal');
        }
        break;
    }
    return false;
  }

  restartObby() {
    this.stage = 0;
    this.finished = false;
    this.obbyStart = null;
    this.spawnPoint = [...this.def.spawn];
    for (const [n, mesh] of this.checkpointMeshes) if (n > 0) mesh.material.color.set('#ffffff');
    this.net.send({ t: 'score', v: 0 });
    this.respawn(true);
  }

  updateLocal(dt, t) {
    const c = this.input.consumeCamera();
    if (c.dx || c.dy) this.cam.lastDrag = performance.now();
    this.cam.yaw -= c.dx * 0.0065;
    this.cam.pitch = clamp(this.cam.pitch + c.dy * 0.005, -0.25, 1.35);
    this.cam.dist = clamp(this.cam.dist * c.zoom, 4, 40);

    const mv = this.input.getMove();
    const jump = this.input.jumpHeld;
    const p = this.body.p;

    // Getragen werden
    if (this.carriedBy != null) {
      const cp = this.carryPos(this.carriedBy);
      if (cp) { p.x = cp.x; p.y = cp.y; p.z = cp.z; this.facing = cp.rot; }
      this.body.v.x = this.body.v.y = this.body.v.z = 0;
      if (jump && !this.releaseSent) { this.releaseSent = true; this.net.send({ t: 'release' }); setTimeout(() => { this.releaseSent = false; }, 800); }
      this.anim = 'carried';
      this.finishChar(dt, 0);
      return;
    }

    // Mitfahren: man sitzt beim Fahrer und hat keine eigene Steuerung
    if (this.riding != null) {
      const d = this.remotes.get(this.riding);
      if (!d) this.endRideLocal();
      else {
        const o = this.rideOffset(d);
        p.x = o.x; p.y = o.y; p.z = o.z;
        this.body.v.x = this.body.v.y = this.body.v.z = 0;
        this.facing = d.rot;
        this.anim = 'drive';
        const seat = this.rideSeat(d);
        if (seat) { this.char.seatY = seat.pos[1]; this.char.seatZ = seat.pos[2]; }
        this.finishChar(dt, 0);
        return;
      }
    }

    // Fahren
    if (this.driving) {
      const d = this.driving, V = VEHICLES[d.type];
      const target = mv.y * V.speed * (mv.y < 0 ? 0.5 : 1);
      d.speed += (target - d.speed) * (1 - Math.exp(-dt * (Math.abs(target) > Math.abs(d.speed) ? 1.6 : 2.5)));
      const turnF = clamp(Math.abs(d.speed) / 6, 0, 1) * Math.sign(d.speed || 1);
      this.facing -= mv.x * V.turn * dt * turnF;
      const f = d.speed / V.speed;
      const px0 = this.body.p.x, pz0 = this.body.p.z;
      this.body.update(dt, Math.sin(this.facing) * f, Math.cos(this.facing) * f, false);
      if (this.hitsOtherPlayer(V.half)) {
        this.body.p.x = px0; this.body.p.z = pz0;
        if (Math.abs(d.speed) > 2) { d.speed *= 0.2; sfx('bump'); }
      }
      const actual = Math.hypot(this.body.v.x, this.body.v.z);
      if (Math.abs(d.speed) > 4 && actual < Math.abs(d.speed) * 0.25) {
        d.bump += dt;
        if (d.bump > 0.15) { d.speed *= 0.3; d.bump = 0; sfx('bump'); }
      } else d.bump = 0;
      if (!V.water) spinWheels(d.model, d.speed, dt);
      if (V.water) {
        d.model.rotation.x = Math.sin(t * 1.5) * 0.04;
        d.model.rotation.z = Math.sin(t * 1.1) * 0.03;
        if (Math.abs(d.speed) > 3 && (this.fxTimer -= dt) <= 0) {
          this.fxTimer = 0.15;
          this.burst(new THREE.Vector3(p.x, p.y + 0.3, p.z), ['#ffffff', '#b3e5fc'], 3, 1.5, true);
        }
      }
      if (performance.now() - this.cam.lastDrag > 1200) this.cam.yaw = lerpAngle(this.cam.yaw, this.facing + Math.PI, 1 - Math.exp(-dt * 2));
      this.updateWater();
      if (p.y < this.def.killY) { this.exitVehicle(); this.respawn(false, 'Huch!'); }
      this.anim = d.anim;
      this.finishChar(dt, Math.abs(d.speed));
      return;
    }

    const sy = Math.sin(this.cam.yaw), cy = Math.cos(this.cam.yaw);
    let wx = -sy * mv.y + cy * mv.x;
    let wz = -cy * mv.y - sy * mv.x;
    let moving = Math.hypot(wx, wz) > 0.05;
    let jumpIn = jump;
    // Leiter: fester Kletterablauf (unabhängig von der Physik)
    if (this.climb) {
      const c = this.climb;
      c.y = Math.min(c.top, c.y + 4.5 * dt);
      p.x = c.x; p.z = c.z; p.y = c.y;
      this.body.v.x = this.body.v.y = this.body.v.z = 0;
      this.body.ground = null;
      this.facing = c.facing;
      this.anim = 'climb';
      this.airTime = 0;
      if (Math.random() < dt * 4) sfx('click');
      if (c.y >= c.top - 1e-3) {
        const s = c.spot;
        p.x = s[0]; p.y = s[1]; p.z = s[2];
        this.body.grounded = true;
        this.climb = null;
        this.quest?.('climb');
      }
      this.finishChar(dt, 0);
      return;
    }

    // Sitzen / Schlafen / Baden / Schaukeln
    if (this.pose && (moving || jump)) this.standUp();
    if (this.pose) {
      const ps = this.pose;
      ps.t += dt;
      p.x = ps.x; p.y = ps.y; p.z = ps.z;
      if (ps.type === 'swing') {
        const s = Math.sin(ps.t * 2.2);
        p.z = ps.z + s * 1.3;
        p.y = ps.y + (1 - Math.cos(s * 0.6)) * 2.2;
      }
      this.body.v.x = this.body.v.y = this.body.v.z = 0;
      this.body.ground = null;
      this.body.grounded = true;
      this.facing = ps.facing;
      this.anim = ps.type === 'sleep' || ps.type === 'dchair' ? 'sleep' : 'sit';
      this.airTime = 0;
      if (ps.type === 'bath' && (this.fxTimer -= dt) <= 0) {
        this.fxTimer = 0.25;
        this.burst(new THREE.Vector3(p.x + (Math.random() - 0.5) * 2, p.y + 0.6, p.z + (Math.random() - 0.5)), ['#ffffff', '#e1f5fe'], 2, 1.5, true);
      }
      if (ps.type === 'sleep' && (this.fxTimer -= dt) <= 0) { this.fxTimer = 6; this.char.say('😴 Zzz…'); }
      this.finishChar(dt, 0);
      return;
    }
    if (this.showerT > 0) {
      this.showerT -= dt;
      if ((this.fxTimer -= dt) <= 0) {
        this.fxTimer = 0.04;
        this.burst(new THREE.Vector3(p.x + (Math.random() - 0.5) * 1.2, p.y + 3.3, p.z + (Math.random() - 0.5) * 1.2), ['#4fc3f7', '#b3e5fc'], 1, -2);
      }
      if (this.showerT <= 0) { this.notice('✨ Schön sauber!'); this.burst(new THREE.Vector3(p.x, p.y + 1.5, p.z), ['#ffffff', '#fff59d'], 14, 4); }
    }
    if (this.eating > 0) {
      this.eating -= dt;
      if (this.eating <= 0 && this.held === this.eatId) this.net.send({ t: 'eat', id: this.eatId });
    }
    if (this.jobTimer > 0) {
      this.jobTimer -= dt;
      if (this.jobTimer <= 0) {
        const jt = this.jobData;
        const got = earnWork(jt.stars);
        this.notice(got ? `${jt.emoji} Fertig! ⭐ +${got} Sterne verdient!` : `${jt.emoji} Fertig! Heute hast du genug Arbeits-Sterne – morgen wieder!`, 3000);
        sfx('goal');
        this.burst(new THREE.Vector3(this.body.p.x, this.body.p.y + 1.5, this.body.p.z), ['#ffd54f', '#fff59d'], 20, 6);
        this.jobData = null;
        this.quest?.('job');
      }
    }

    this.body.update(dt, wx, wz, jumpIn);
    if (this.body.jumped) sfx('jump');
    if (this.body.slid && !this.slideSound) { this.slideSound = true; sfx('bounce'); setTimeout(() => { this.slideSound = false; }, 1500); }
    this.body.slid = false;
    if (this.body.bounced) sfx('bounce');
    if (moving) {
      this.facing = lerpAngle(this.facing, Math.atan2(wx, wz), 1 - Math.exp(-dt * 14));
      // Kamera geht beim Vorwärtslaufen hinter die Figur (nur Seitwärts dreht sie nicht, sonst läuft man im Kreis)
      if (performance.now() - this.cam.lastDrag > 700) this.cam.yaw = lerpAngle(this.cam.yaw, this.facing + Math.PI, 1 - Math.exp(-dt * 4));
      this.emote = null;
      if (this.gameKey === 'obby' && !this.obbyStart && !this.finished) this.obbyStart = performance.now();
    }
    if (this.body.jumped || this.body.bounced) this.emote = null;
    this.updateWater();
    for (const b of this.body.touch) if (this.onTouch(b)) break;
    for (const tr of this.body.trig) if (tr.k === 'portal' && tr.part) { this.usePortal(tr.part); break; }
    if (p.y < this.def.killY) this.respawn(false, 'Huch! Zurück zum Start');

    this.airTime = this.body.grounded ? 0 : this.airTime + dt;
    const sp = Math.hypot(this.body.v.x, this.body.v.z);
    let anim = 'idle';
    if (this.swimming) anim = sp > 0.5 ? 'walk' : 'idle';
    else if (this.body.climbing && !this.body.grounded) anim = 'climb';
    else if (this.airTime > 0.1) anim = this.body.v.y > 0 ? 'jump' : 'fall';
    else if (sp > 0.8) anim = 'walk';
    else if (this.eating > 0) anim = 'eat';
    else if (this.emote) anim = this.emote;
    this.anim = anim;
    this.finishChar(dt, sp);
  }

  hitsOtherPlayer(half) {
    const p = this.body.p;
    for (const r of this.remotes.values()) {
      if (r.rideOf != null || !r.char.root.visible) continue;
      if (Math.abs(r.pos.y - p.y) > 1.5) continue;
      if (Math.hypot(r.pos.x - p.x, r.pos.z - p.z) < half + 0.5) return true;
    }
    return false;
  }

  finishChar(dt, sp) {
    const p = this.body.p;
    this.char.root.position.set(p.x, p.y, p.z);
    this.char.root.rotation.y = this.facing;
    this.char.update(dt, this.anim, sp);
  }

  updateRemotes(dt) {
    const k = 1 - Math.exp(-dt * 12);
    for (const r of this.remotes.values()) {
      if (r.rideOf != null) {
        const d = this.driverView(r.rideOf);
        if (!d) continue;
        const o = this.rideOffset(d);
        r.pos.set(o.x, o.y, o.z);
        r.rot = d.rot;
        r.char.root.position.copy(r.pos);
        r.char.root.rotation.y = r.rot;
        if (r.char.root.visible) r.char.update(dt, 'drive', 0);
        continue;
      }
      const before = r.pos.clone();
      if (r.carriedBy != null) {
        const cp = this.carryPos(r.carriedBy);
        if (cp) { r.pos.set(cp.x, cp.y, cp.z); r.rot = cp.rot; }
        r.char.root.position.copy(r.pos);
        r.char.root.rotation.y = r.rot;
        r.char.update(dt, 'carried', 0);
        continue;
      }
      if (r.pos.distanceTo(r.target) > 20) r.pos.copy(r.target);
      else r.pos.lerp(r.target, k);
      r.rot = lerpAngle(r.rot, r.targetRot, k);
      r.char.root.position.copy(r.pos);
      r.char.root.rotation.y = r.rot;
      const sp = Math.hypot(r.pos.x - before.x, r.pos.z - before.z) / Math.max(dt, 1e-3);
      r.speed += (sp - r.speed) * k;
      if (!r.char.root.visible) continue;
      if (r.vehModel) spinWheels(r.vehModel, r.speed, dt);
      const pp = this.body.p;
      const far = Math.abs(r.pos.x - pp.x) + Math.abs(r.pos.z - pp.z) > 45;
      if (far && (((this.quality?.frame || 0) + r.id) % 4)) continue;
      r.char.update(dt, r.anim, r.speed);
    }
  }

  updateDynamic(t) {
    for (const d of this.dynamic) {
      const m = d.part.m;
      let x = d.part.x, y = d.part.y, z = d.part.z;
      if (m.type === 'line') {
        const o = Math.sin(t * m.speed + (m.phase || 0)) * m.amp;
        if (m.ax === 'x') x += o; else if (m.ax === 'y') y += o; else z += o;
      } else if (m.type === 'circle') {
        const a = t * m.speed + m.phase;
        x = m.cx + Math.cos(a) * m.r;
        z = m.cz + Math.sin(a) * m.r;
      }
      this.phys.moveDynamic(d.box, x, y, z);
      d.mesh.position.set(x, y, z);
    }
  }

  updateGameRules(dt, t) {
    if (this.coins.size) {
      const p = this.body.p;
      const paused = this.round?.pause;
      for (const [id, c] of this.coins) {
        c.mesh.rotation.y = t * 3 + id;
        c.mesh.position.y = c.y + Math.sin(t * 2 + id) * 0.2;
        if (!paused && !this.pendingCoins.has(id) && Math.abs(c.x - p.x) < 1.3 && Math.abs(c.z - p.z) < 1.3 && c.y > p.y - 0.8 && c.y < p.y + 3) {
          this.pendingCoins.add(id);
          this.net.send({ t: 'coin', id });
          setTimeout(() => this.pendingCoins.delete(id), 1500);
        }
      }
    }
    if (this.gameKey === 'tag' && this.it === this.myId && this.round && !this.round.pause && !this.round.waiting) {
      const now = performance.now();
      if (now > this.tagCooldown) {
        const p = this.body.p;
        for (const r of this.remotes.values()) {
          if (Math.hypot(r.pos.x - p.x, r.pos.z - p.z) < 2.2 && Math.abs(r.pos.y - p.y) < 2.5) {
            this.net.send({ t: 'tag', id: r.id });
            this.tagCooldown = now + 600;
            break;
          }
        }
      }
    }
    if (this.danceTiles.length) {
      const beat = Math.floor(t * 2);
      if (beat !== this.lastBeat) {
        this.lastBeat = beat;
        const pal = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#00b0ff', '#651fff', '#d500f9'];
        this.danceTiles.forEach((m, i) => {
          const c = pal[(i * 3 + beat) % pal.length];
          m.material.color.set(c);
          m.material.emissive.set(c);
        });
      }
    }
    if (this.trophy) { this.trophy.rotation.y += dt * 1.5; this.trophy.position.y += Math.sin(t * 2) * 0.01; }
    ringMaterial.opacity = 0.45 + Math.sin(t * 4) * 0.25;
    const water = getTexture('water');
    if (water) { water.offset.x = (t * 0.02) % 1; water.offset.y = (t * 0.013) % 1; }
    for (const [key, on] of Object.entries(this.toggles)) {
      if (!on) continue;
      for (const { mesh, kind } of this.toggleMeshes.get(key) || []) if (kind === 'tv') mesh.material.emissive.setHSL((t * 0.15) % 1, 0.7, 0.55);
    }
  }

  toggleFriend(name) {
    if (this.friends.has(name)) { this.friends.delete(name); this.notice(`${name} ist kein Freund mehr`, 2000); }
    else { this.friends.add(name); this.notice(`⭐ ${name} ist jetzt dein Freund – du findest ihn schneller!`, 2600); sfx('magic'); }
    localStorage.setItem('hb_friends', JSON.stringify([...this.friends]));
    this.renderScores();
  }

  // Namen von Freunden leuchten durch Gebäude, sobald sie weiter weg sind (nah dran sieht man sie ohnehin)
  nameTag(text) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 72;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(40,20,80,0.82)';
    g.beginPath(); g.roundRect(4, 6, 312, 60, 30); g.fill();
    g.fillStyle = '#ffffff'; g.font = '800 34px Nunito, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('⭐ ' + text, 160, 37);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(5, 1.125, 1);
    s.renderOrder = 999;
    this.scene.add(s);
    this.disposables.push(tex, mat);
    return s;
  }

  updateFriendTags() {
    for (const r of this.remotes.values()) {
      const isFriend = !r.bot && !r.staticBot && this.friends.has(r.name);
      if (!isFriend) { if (r.tag) r.tag.visible = false; continue; }
      if (!r.tag) r.tag = this.nameTag(r.name);
      const d = r.pos.distanceTo(this.body.p);
      r.tag.visible = d > 9 && d < 160;
      r.tag.position.set(r.pos.x, r.pos.y + 4.6, r.pos.z);
      r.tag.material.opacity = Math.min(1, Math.max(0, (d - 9) / 12));
    }
  }

  updateLOD() {
    const p = this.body.p;
    for (const v of this.parked) v.visible = Math.abs(v.position.x - p.x) < 90 && Math.abs(v.position.z - p.z) < 90;
    for (const r of this.rings) r.visible = Math.abs(r.position.x - p.x) < 70 && Math.abs(r.position.z - p.z) < 70 && Math.abs(r.position.y - p.y) < 12;
    for (const r of this.remotes.values()) r.char.root.visible = Math.abs(r.pos.x - p.x) < 110 && Math.abs(r.pos.z - p.z) < 110;
  }

  handleTaps() {
    const taps = this.input.consumeTaps();
    if (!taps.length) return;
    // Tier antippen öffnet sein Menü; ein Tipp daneben schliesst es
    const myPet = this.pets.get(this.myId);
    if (myPet && myPet.mesh.visible) {
      const t = taps[taps.length - 1];
      this.raycaster.setFromCamera(new THREE.Vector2((t.x / innerWidth) * 2 - 1, -(t.y / innerHeight) * 2 + 1), this.camera);
      if (this.raycaster.intersectObject(myPet.mesh, true).length) { this.petMenu = true; sfx('click'); return; }
      this.petMenu = false;
    }
    if (this.items.size && (!this.build || this.buildMode === 'play')) {
      const meshes = [...this.items.values()].filter(i => i.holder == null).map(i => i.mesh);
      for (const tap of taps) {
        const ndc = new THREE.Vector2((tap.x / innerWidth) * 2 - 1, -(tap.y / innerHeight) * 2 + 1);
        this.raycaster.setFromCamera(ndc, this.camera);
        const hit = this.raycaster.intersectObjects(meshes, true)[0];
        const it = hit && this.items.get(hit.object.userData.itemId);
        if (!it) continue;
        const p = this.body.p;
        if (Math.hypot(it.x - p.x, it.z - p.z) < 5) { this.standUp(); this.pickItem(it); }
        else this.notice('Geh näher hin, um es zu nehmen');
      }
      return;
    }
    if (!this.build) return;
    if (this.buildMode === 'play') { this.build.ghost.visible = false; return; }
    // Bau-Fläche folgt dem Spieler, damit man in allen Ländern bauen kann
    if (this.groundPick) { this.groundPick.position.set(this.body.p.x, 0.02, this.body.p.z); this.groundPick.updateMatrixWorld(); }
    for (const tap of taps) {
      const ndc = new THREE.Vector2((tap.x / innerWidth) * 2 - 1, -(tap.y / innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const pick = this.build.pick(this.raycaster, this.groundPick || this.ground);
      if (!pick) continue;
      if (this.buildMode === 'erase') {
        if (pick.remove) this.net.send({ t: 'remove', x: pick.remove[0], y: pick.remove[1], z: pick.remove[2] });
      } else {
        const [x, y, z] = pick.place;
        if (!this.build.inRange(x, y, z)) {
          this.notice(landAt(this.body.p.x, this.body.p.z) ? 'Hier kann man nicht bauen 🏗️' : 'In den Häusern kann man nicht bauen – geh nach draussen! 🏗️', 2500);
          continue;
        }
        if (this.build.overlapsPlayer(x, y, z, this.body.p)) continue;
        this.quest('build');
        this.net.send({ t: 'place', x, y, z, k: this.buildType });
        const [cx, cy, cz] = this.build.center(x, y, z);
        this.build.ghost.position.set(cx, cy, cz);
        this.build.ghost.visible = true;
        clearTimeout(this.ghostTimer);
        this.ghostTimer = setTimeout(() => { if (this.build) this.build.ghost.visible = false; }, 300);
      }
    }
  }

  // Kamera, die nicht durch Wände schaut
  // Die Schatten-Kamera wandert nur in ganzen Bildpunkten mit, sonst flimmern die Kanten
  snapSun(p) {
    const sun = this.sun, T = 110 / sun.shadow.mapSize.x;
    const eye = new THREE.Vector3(40, 80, 25);
    const look = new THREE.Matrix4().lookAt(eye, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
    const v = new THREE.Vector3(p.x, p.y, p.z).applyMatrix4(look.clone().invert());
    v.x = Math.round(v.x / T) * T;
    v.y = Math.round(v.y / T) * T;
    const world = v.applyMatrix4(look);
    sun.target.position.copy(world);
    sun.position.copy(world).add(eye);
  }

  updateCamera(dt) {
    const p = this.body.p;
    // Selfie: Kamera steht vor der Figur und schaut sie an
    if (this.selfie) {
      const f = this.facing, sx = Math.sin(f), sz = Math.cos(f);
      this.camera.position.set(p.x + sx * 4.6 + sz * 0.9, p.y + 3.1, p.z + sz * 4.6 - sx * 0.9);
      this.camera.lookAt(p.x, p.y + (this.driving ? 1.9 : 1.7), p.z);
      this.sky.position.copy(this.camera.position);
      return;
    }
    const target = new THREE.Vector3(p.x, p.y + (this.driving ? 2.6 : 2.3), p.z);
    this.camTarget.lerp(target, 1 - Math.exp(-dt * 18));
    const { yaw, pitch } = this.cam;
    const cp = Math.cos(pitch);
    const dir = new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
    let maxD = this.cam.dist;
    const step = 0.4;
    for (let d = 1.2; d < this.cam.dist; d += step) {
      const x = this.camTarget.x + dir.x * d, y = this.camTarget.y + dir.y * d, z = this.camTarget.z + dir.z * d;
      const hit = this.phys.query(x - 0.15, y - 0.15, z - 0.15, x + 0.15, y + 0.15, z + 0.15).some(b => b.k !== 'water' && b.k !== 'ground' && !b.dyn && b.part?.k !== 'baseplate');
      if (hit) { maxD = Math.max(1.5, d - 0.5); break; }
    }
    const k = maxD < this.cam.cur ? 1 - Math.exp(-dt * 25) : 1 - Math.exp(-dt * 3);
    this.cam.cur += (maxD - this.cam.cur) * k;
    const D = this.cam.cur;
    this.camera.position.set(this.camTarget.x + dir.x * D, this.camTarget.y + dir.y * D, this.camTarget.z + dir.z * D);
    this.camera.lookAt(this.camTarget);
    this.snapSun(p);
    this.sky.position.copy(this.camera.position);
  }

  frame = now => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const rawDt = (now - this.lastT) / 1000;
    const dt = Math.min(0.1, rawDt);
    this.lastT = now;
    this.adaptQuality(rawDt);
    const cv = this.renderer.domElement;
    if (Math.abs(cv.width - innerWidth * this.renderer.getPixelRatio()) > 1) this.onResize();
    const t = (Date.now() + this.timeOffset) / 1000;
    this.updateDynamic(t);
    this.updateLocal(dt, t);
    this.updateRemotes(dt);
    this.updateFriendTags();
    this.updateGameRules(dt, t);
    this.updateCamera(dt);
    this.handleTaps();
    this.updateEffects(dt);
    this.updateSnow(dt);
    this.updatePets(dt);
    this.updateWildlife(dt);
    this.updateAdventure(t);
    if (this.items.size) this.updateItems(dt);
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.15;
      this.renderStatus();
      this.updateActions();
      this.updateLOD();
      this.updateLand();
    }
    this.sendState(now);
    this.updateRockets(dt);
    this.renderer.render(this.scene, this.camera);
    if (this.photoReq) this.finishPhoto();
  };

  // Leistung anpassen, ohne dass das Bild unscharf wird: die Auflösung bleibt immer gleich,
  // bei langsamen Geräten werden nacheinander Schatten seltener/aus und die Sichtweite kürzer.
  adaptQuality(rawDt) {
    const q = this.quality || (this.quality = { avg: 1 / 60, t: 0, frame: 0, level: 0 });
    q.avg += (rawDt - q.avg) * 0.05;
    q.t += rawDt;
    q.frame++;
    const every = q.level >= 1 ? 4 : 2;
    this.renderer.shadowMap.needsUpdate = this.sun.castShadow && q.frame % every === 0;
    if (q.t < 2) return;
    q.t = 0;
    let level = q.level;
    if (q.avg > 1 / 38) level = Math.min(3, level + 1);
    else if (q.avg < 1 / 56) level = Math.max(0, level - 1);
    if (level === q.level) return;
    q.level = level;
    const shadows = level < 2;
    if (this.sun.castShadow !== shadows) { this.sun.castShadow = shadows; this.renderer.shadowMap.needsUpdate = true; }
    const far = level >= 3 ? 260 : 420;
    if (this.scene.fog) { this.scene.fog.far = far; this.scene.fog.near = far * 0.3; }
    this.camera.far = far + 40;
    this.camera.updateProjectionMatrix();
    // Himmel muss innerhalb der Sichtweite liegen, sonst wird er schwarz
    this.sky.scale.setScalar((far + 40) * 0.9 / 900);
  }

  onResize = () => {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  doEmote(e) { this.emote = e; }
  sayChat(i) { this.net.send({ t: 'chat', i }); }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.voice.stop();
    removeEventListener('pointerdown', this.voice.unlock, true);
    window.removeEventListener('resize', this.onResize);
    clearTimeout(this.noticeTimer);
    clearTimeout(this.bigTimer);
    this.char.dispose();
    for (const r of this.remotes.values()) r.char.dispose();
    for (const e of this.effects) e.m.material.dispose();
    this.build?.dispose();
    for (const d of this.disposables) d.dispose();
    this.scene.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.parameters) { /* geteilte Geometrien bleiben */ } });
    $('hud').hidden = true;
    $('notice').classList.remove('show');
    $('actions').replaceChildren();
    $('itemMenu').hidden = true;
    $('avatarPanel').hidden = true;
    $('mapPanel').hidden = true;
  }
}
