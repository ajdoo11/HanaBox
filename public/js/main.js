// Startseite, Avatar & Shop, Verbindung und Spielstart.
import * as THREE from 'three';
import { GAMES, AVATAR_OPTIONS, QUICK_CHAT, EMOJIS, EMOJI_BASE, sanitizeAvatar, sanitizeName } from './shared.js';
import { Character } from './avatar.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { unlockAudio, sfx, setMuted } from './sfx.js';
import { profile, saveName, saveAvatar, saveMuted, saveGrab, addRecent, removeRecent } from './profile.js';
import { avatarEditor, ALL_TABS } from './editor.js';
import * as Account from './account.js';
import { SERVER_URL } from './config.js';
import { LocalSocket } from './localserver.js';

// Ohne eigenen Node-Server (GitHub Pages) läuft der Spiel-Server im Browser
const STATIC_HOST = location.hostname.endsWith('github.io') || location.protocol === 'file:' || new URLSearchParams(location.search).has('offline');
let localMode = STATIC_HOST && !SERVER_URL;

const $ = id => document.getElementById(id);
setMuted(profile.muted);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('view'), antialias: devicePixelRatio < 1.5, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setSize(innerWidth, innerHeight, false);

const input = new Input($('view'), $('joyBase'), $('joyKnob'), $('btnJump'));
let game = null;
let net = null;

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...kids);
  return e;
}

// ---------- Sterne ----------
function showStars() { document.querySelectorAll('.starCount').forEach(e => { e.textContent = profile.stars; }); }
let toastTimer;
function starToast(text) {
  const t = $('starToast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}
window.addEventListener('stars', e => {
  showStars();
  if (e.detail.n > 0) { starToast(`+${e.detail.n} ⭐`); }
  else sfx('buy');
});

// ---------- Avatar-Vorschau ----------
function makePreview(canvas, size) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!size });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9a6ff', 2.2));
  const sun = new THREE.DirectionalLight('#ffffff', 1.6);
  sun.position.set(3, 5, 6);
  scene.add(sun);
  const cam = new THREE.PerspectiveCamera(size ? 30 : 32, 1, 0.1, 50);
  return { r, scene, cam, char: null, size };
}
const mini = makePreview($('miniAvatar'), 96);
const big = makePreview($('avatarCanvas'));
let bigRunning = false;

function setPreviewAvatar(pv) {
  if (pv.char) pv.char.dispose();
  pv.char = new Character(profile.avatar, null);
  pv.scene.add(pv.char.root);
}
function renderMini() {
  setPreviewAvatar(mini);
  mini.r.setSize(96, 96, false);
  mini.cam.aspect = 1;
  const y = 2.45;
  mini.cam.position.set(0, y + 0.15, 3.0);
  mini.cam.lookAt(0, y, 0);
  mini.cam.updateProjectionMatrix();
  mini.char.root.rotation.y = 0.35;
  mini.char.update(0.016, 'idle');
  mini.r.render(mini.scene, mini.cam);
}
function bigLoop(now) {
  if (!bigRunning) return;
  requestAnimationFrame(bigLoop);
  const c = $('avatarCanvas');
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return;
  if (c.width !== Math.floor(w * big.r.getPixelRatio())) big.r.setSize(w, h, false);
  big.cam.aspect = w / h;
  big.cam.position.set(0, 2.0, 9);
  big.cam.lookAt(0, 1.5, 0);
  big.cam.updateProjectionMatrix();
  big.char.root.rotation.y = Math.sin(now / 1600) * 0.7;
  big.char.update(1 / 60, (now / 3000) % 4 < 1 ? 'wave' : 'idle');
  big.r.render(big.scene, big.cam);
}

// ---------- Startseite ----------
function showMenu() {
  $('menu').hidden = false;
  $('avatarScreen').hidden = true;
  $('helloName').textContent = profile.name || 'du';
  $('btnAccountLogout').hidden = !Account.token();
  showStars();
  renderRecent();
  renderMini();
}

// Alle spielen in derselben Welt: keine Codes und keine Raum-Liste mehr
function renderRecent() {
  $('recentBox').hidden = true;
  $('joinBox').hidden = true;
}

function renderGames() {
  const grid = $('gameGrid');
  grid.replaceChildren();
  for (const [key, g] of Object.entries(GAMES)) {
    const thumb = el('div', { className: 'thumb', textContent: g.emoji });
    thumb.style.background = g.bg;
    const b = el('button', { className: 'game-card' }, thumb, el('div', { className: 'info' }, el('h3', { textContent: g.name }), el('p', { textContent: g.desc })));
    b.onclick = () => { unlockAudio(); openGameDialog(key); };
    grid.append(b);
  }
}

function dialog(build) {
  const card = $('dialogCard');
  card.replaceChildren();
  card.classList.remove('center');
  const close = () => { $('dialog').hidden = true; };
  build(card, close);
  $('dialog').hidden = false;
  return close;
}
$('dialog').addEventListener('pointerdown', e => { if (e.target === $('dialog') && !$('dialog').dataset.locked) $('dialog').hidden = true; });

function openGameDialog(key) {
  const g = GAMES[key];
  dialog((card, close) => {
    card.append(
      el('div', { className: 'big-emoji', textContent: g.emoji }),
      el('h2', { textContent: g.name }),
      el('p', { textContent: g.desc }),
      el('p', { textContent: 'Du bekommst einen Code. Den kannst du deinen Freunden geben, damit sie zu dir kommen.' }),
      el('div', { className: 'row' },
        el('button', { className: 'btn primary big', textContent: '▶ Spielen', onclick: () => { close(); connect({ create: true, game: key }); } }),
        el('button', { className: 'btn', textContent: 'Abbrechen', onclick: close })),
    );
  });
}

function askName(then) {
  $('dialog').dataset.locked = '1';
  dialog((card, close) => {
    const inp = el('input', { className: 'name', maxLength: 14, placeholder: 'Dein Name', value: profile.name });
    const ok = () => {
      if (!inp.value.trim()) { inp.focus(); return; }
      saveName(sanitizeName(inp.value));
      delete $('dialog').dataset.locked;
      close();
      showMenu();
      then?.();
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    card.append(
      el('div', { className: 'big-emoji', textContent: '👋' }),
      el('h2', { textContent: 'Willkommen bei HanaBlox!' }),
      el('p', { textContent: 'Wie heisst du? So sehen dich deine Freunde im Spiel.' }),
      inp,
      el('div', { className: 'row' }, el('button', { className: 'btn primary big', textContent: 'Los geht’s!', onclick: ok })),
    );
    setTimeout(() => inp.focus(), 50);
  });
}

// ---------- Avatar & Shop ----------
let editor = null;
function openAvatar() {
  $('menu').hidden = true;
  $('avatarScreen').hidden = false;
  $('nameInput').value = profile.name;
  $('nameInput').readOnly = !!Account.token();
  setPreviewAvatar(big);
  editor = avatarEditor($('avatarTabs'), $('avatarOptions'), ALL_TABS, a => {
    saveAvatar(a);
    setPreviewAvatar(big);
    editor.render();
    sfx('click');
  }, text => starToast(text));
  bigRunning = true;
  requestAnimationFrame(bigLoop);
}
function closeAvatar() {
  const n = $('nameInput').value;
  if (n.trim()) saveName(sanitizeName(n));
  bigRunning = false;
  showMenu();
}
function randomAvatar() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  saveAvatar(sanitizeAvatar({
    ...profile.avatar,
    skin: pick(AVATAR_OPTIONS.skin), shirt: pick(AVATAR_OPTIONS.colors), pants: pick(AVATAR_OPTIONS.colors),
    hairColor: pick(AVATAR_OPTIONS.colors), hair: Math.floor(Math.random() * AVATAR_OPTIONS.hair.length),
  }));
  setPreviewAvatar(big);
  editor?.render();
}

// ---------- Verbindung ----------
function loading(text) {
  $('loading').hidden = !text;
  if (text) $('loadingText').textContent = text;
}

// Ein kostenloser Online-Server schläft nach einer Pause ein: erst wecken, dann verbinden
async function wakeServer() {
  const health = SERVER_URL.replace(/^ws/, 'http').replace(/\/ws\/?$/, '') + '/health';
  const until = Date.now() + 100000;
  for (let i = 0; Date.now() < until; i++) {
    try { if ((await fetch(health, { cache: 'no-store' })).ok) return true; } catch { /* schläft noch */ }
    if (i === 1) loading('Server wird geweckt … das dauert bis zu einer Minute ☕');
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

async function connect(opts) {
  if (localMode && !profile.name) { askName(() => connect(opts)); return; }
  if (!localMode && !Account.token()) { showLogin(); return; }
  $('menuError').textContent = '';
  loading('Verbinde…');
  if (SERVER_URL && !localMode && !(await wakeServer())) {
    loading(null);
    $('menuError').textContent = 'Der Online-Server antwortet nicht. Bitte später nochmal versuchen.';
    return;
  }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = localMode ? new LocalSocket() : new WebSocket(SERVER_URL || `${proto}://${location.host}/ws`);
  let welcomed = false;
  const myNet = { ws, send(m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } };
  net = myNet;
  ws.onopen = () => myNet.send({ t: 'join', ...opts, token: Account.token(), name: profile.name, avatar: profile.avatar, grab: profile.grab !== false });
  ws.onmessage = e => {
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'welcome') {
      welcomed = true;
      botsOn = m.bots !== false;
      loading(null);
      addRecent(m.code, m.game);
      startGame(m, myNet);
      const bc = localStorage.getItem('hana_botCount');
      if (bc != null) myNet.send({ t: 'bots', on: botsOn, count: Number(bc) });
      return;
    }
    if (m.t === 'error') {
      loading(null);
      if (m.code === 'login') { ws.close(); Account.logout().then(showLogin); return; }
      $('menuError').textContent = m.msg;
      if (opts.code && m.code === 'notfound') { removeRecent(opts.code); renderRecent(); }
      ws.close();
      return;
    }
    game?.onMessage(m);
  };
  ws.onclose = () => {
    if (net !== myNet) return;
    loading(null);
    if (!welcomed) {
      if (!$('menuError').textContent) $('menuError').textContent = 'Keine Verbindung zum Server. Läuft der Server?';
      return;
    }
    if (game) {
      endGame();
      dialog((card, close) => {
        card.append(el('div', { className: 'big-emoji', textContent: '📡' }), el('h2', { textContent: 'Verbindung unterbrochen' }),
          el('p', { textContent: 'Prüfe das WLAN und versuche es nochmal.' }),
          el('div', { className: 'row' }, el('button', { className: 'btn primary', textContent: 'OK', onclick: close })));
      });
    }
  };
}

function startGame(welcome, myNet) {
  $('menu').hidden = true;
  $('avatarScreen').hidden = true;
  $('dialog').hidden = true;
  history.replaceState(null, '', `?code=${welcome.code}`);
  input.enabled = true;
  input.reset();
  game = new Game({ renderer, input, net: myNet, welcome, name: profile.name, avatar: profile.avatar, onLeave: leave });
  window.hbGame = game; // zum Testen in der Browser-Konsole
  // Sprachchat startet automatisch, sobald man online in der Welt ist
  if (!localMode) {
    const g = game;
    g.voice.start().then(mic => {
      if (game !== g) return;
      $('gmVoice').textContent = mic ? '🎤 Sprachchat ein' : '🔈 Nur zuhören (kein Mikrofon)';
      g.notice(mic ? '🎤 Sprachchat ist an – alle hören dich!' : '🔈 Du hörst die anderen. Mikrofon im Browser erlauben, um zu sprechen.', 3500);
    });
  }
}

function endGame() {
  input.enabled = false;
  input.reset();
  game?.destroy();
  game = null;
  $('chatPanel').hidden = true;
  $('emotePanel').hidden = true;
  $('gameMenu').hidden = true;
  history.replaceState(null, '', location.pathname);
  showMenu();
}

function leave() {
  const n = net;
  net = null;
  endGame();
  n?.ws.close();
}

// ---------- Spielmenü (wie bei Roblox) ----------
let botsOn = true;
const savedBotCount = localStorage.getItem('hana_botCount');
if (savedBotCount != null) { $('gmBotCount').value = savedBotCount; $('gmBotCountLabel').textContent = savedBotCount; }
function updateSoundBtn() {
  $('gmSound').textContent = profile.muted ? '🔇 Ton aus' : '🔊 Ton an';
  $('gmBots').textContent = botsOn ? '🤖 Bot-Freunde: an' : '🤖 Bot-Freunde: aus';
  $('gmGrab').textContent = profile.grab !== false ? '🤗 Hochheben erlauben: ja' : '🤗 Hochheben erlauben: nein';
}
$('btnMenu').onclick = () => { showStars(); updateSoundBtn(); $('gameMenu').hidden = false; };
import { getDaily, getBadges } from './quests.js';
function openQuests() {
  const list = $('questList'), badges = $('badgeList');
  list.replaceChildren();
  for (const q of getDaily()) {
    const row = el('div', { className: 'quest-row' + (q.done ? ' done' : '') });
    row.append(el('span', { textContent: (q.done ? '✅ ' : '⬜ ') + q.text }), el('span', { className: 'n', textContent: `${q.have}/${q.goal}` }));
    list.append(row);
  }
  badges.replaceChildren();
  for (const b of getBadges()) {
    badges.append(el('div', { className: 'badge' + (b.done ? '' : ' locked') }, el('b', { textContent: (b.done ? '🏅 ' : '🔒 ') + b.name }), `${b.text} (${b.have}/${b.goal})`));
  }
  $('questPanel').hidden = false;
}
$('gmQuests').onclick = openQuests;
$('btnQuestsHome').onclick = openQuests;
$('questClose').onclick = () => { $('questPanel').hidden = true; };
$('gmBots').onclick = () => { botsOn = !botsOn; net?.send({ t: 'bots', on: botsOn, count: Number($('gmBotCount').value) }); updateSoundBtn(); };
$('gmBotCount').oninput = () => { $('gmBotCountLabel').textContent = $('gmBotCount').value; };
$('gmBotCount').onchange = () => { const c = Number($('gmBotCount').value); localStorage.setItem('hana_botCount', c); net?.send({ t: 'bots', on: botsOn, count: c }); };
$('gmGrab').onclick = () => { saveGrab(profile.grab === false); net?.send({ t: 'pref', grab: profile.grab !== false }); updateSoundBtn(); };
$('gmVoice').onclick = async () => {
  if (!game) return;
  if (game.voice.isEnabled) {
    game.voice.stop();
    $('gmVoice').textContent = '🔇 Sprachchat aus';
  } else if (localMode) {
    game.notice('🎤 Sprachchat braucht den Online-Server (siehe Anleitung)', 3500);
  } else {
    const ok = await game.voice.start();
    $('gmVoice').textContent = ok ? '🎤 Sprachchat ein' : '🔇 Sprachchat nicht verfügbar';
  }
};

// Karte mit Teleport
$('btnMap').onclick = () => game?.openMap();
$('gmResume').onclick = () => { $('gameMenu').hidden = true; };
$('gmReset').onclick = () => { $('gameMenu').hidden = true; game?.resetCharacter(); };
$('gmSound').onclick = () => { saveMuted(!profile.muted); setMuted(profile.muted); updateSoundBtn(); };
$('gmLeave').onclick = () => leave();
$('gameMenu').addEventListener('pointerdown', e => { if (e.target === $('gameMenu')) $('gameMenu').hidden = true; });

$('btnInvite').onclick = () => {
  if (!game) return;
  const code = game.code;
  const url = `${location.origin}/?code=${code}`;
  dialog((card, close) => {
    card.classList.add('center');
    card.append(
      el('h2', { textContent: '👋 Freunde einladen' }),
      el('p', { textContent: 'Sag deinen Freunden diesen Code. Sie tippen ihn auf dem Startbildschirm bei «Code von Freunden» ein:' }),
      el('div', { className: 'code', textContent: code }),
    );
    const row = el('div', { className: 'row' });
    if (navigator.share) {
      row.append(el('button', { className: 'btn pink', textContent: '📤 Link teilen', onclick: () => navigator.share({ title: 'Komm zu HanaBlox!', text: `Spiel mit mir HanaBlox! Code: ${code}`, url }).catch(() => {}) }));
    } else if (navigator.clipboard) {
      row.append(el('button', { className: 'btn pink', textContent: '📋 Link kopieren', onclick: e => { navigator.clipboard.writeText(url).then(() => { e.target.textContent = '✓ Kopiert'; }).catch(() => {}); } }));
    }
    row.append(el('button', { className: 'btn primary', textContent: 'OK', onclick: close }));
    card.append(row);
  });
};

function buildChatPanel() {
  const p = $('chatPanel');
  const phrases = el('div', { className: 'phrases' });
  QUICK_CHAT.forEach((text, i) => phrases.append(el('button', { textContent: text, onclick: () => { game?.sayChat(i); p.hidden = true; } })));
  const emojis = el('div', { className: 'emojis' });
  EMOJIS.forEach((e, i) => emojis.append(el('button', { textContent: e, onclick: () => { game?.sayChat(EMOJI_BASE + i); p.hidden = true; } })));
  p.append(phrases, emojis);
  const ep = $('emotePanel');
  const box = el('div', { className: 'emotes' });
  for (const [id, label] of [['dance', '💃 Tanzen'], ['wave', '👋 Winken'], ['sit', '🪑 Sitzen']]) {
    box.append(el('button', { textContent: label, onclick: () => { game?.doEmote(id); ep.hidden = true; } }));
  }
  ep.append(box);
}
$('btnChat').onclick = () => { $('chatPanel').hidden = !$('chatPanel').hidden; $('emotePanel').hidden = true; };
$('btnEmote').onclick = () => { $('emotePanel').hidden = !$('emotePanel').hidden; $('chatPanel').hidden = true; };
$('view').addEventListener('pointerdown', () => { $('chatPanel').hidden = true; $('emotePanel').hidden = true; });

// ---------- Start ----------
$('btnAvatar').onclick = () => { unlockAudio(); openAvatar(); };
$('btnAvatarBack').onclick = closeAvatar;
$('btnRandom').onclick = randomAvatar;
$('btnJoin').onclick = () => {
  unlockAudio();
  const code = $('joinCode').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 4) { $('menuError').textContent = 'Der Code hat 4 Zeichen.'; return; }
  connect({ code });
};
$('joinCode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnJoin').click(); });
document.addEventListener('pointerdown', unlockAudio, { once: true });

buildChatPanel();
renderGames();

// ---------- Anmeldung (Kinder-Konto) ----------
function showAuth(view) {
  for (const v of ['Wait', 'Login', 'Register']) $('auth' + v).hidden = view !== v.toLowerCase();
  $('authError').textContent = '';
  $('regError').textContent = '';
}

function showLogin() {
  $('menu').hidden = true;
  $('avatarScreen').hidden = true;
  $('authScreen').hidden = false;
  showAuth('login');
}

async function afterSignIn() {
  // Neu laden, damit Figur, Sterne und Aufgaben aus dem Konto überall übernommen werden
  location.replace(location.pathname);
}

async function authAction(btn, errEl, fn) {
  errEl.textContent = '';
  btn.disabled = true;
  try {
    if (!(await wakeServer())) throw new Error('Der Server antwortet nicht. Bitte nochmal versuchen.');
    await fn();
    await afterSignIn();
  } catch (e) {
    errEl.textContent = e.message || String(e);
  } finally {
    btn.disabled = false;
  }
}

$('btnShowReg').onclick = () => showAuth('register');
$('btnShowLogin').onclick = () => showAuth('login');

$('btnLogin').onclick = () => {
  const name = $('authName').value.trim(), pass = $('authPass').value;
  if (!name || !pass) { $('authError').textContent = 'Bitte Spielername und Passwort eingeben.'; return; }
  authAction($('btnLogin'), $('authError'), () => Account.login(name, pass));
};
$('authPass').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnLogin').click(); });

$('btnRegister').onclick = () => {
  const name = $('regName').value.trim(), pass = $('regPass').value, pass2 = $('regPass2').value;
  if (name.length < 3) { $('regError').textContent = 'Der Spielername braucht mindestens 3 Zeichen.'; return; }
  if (pass.length < 4) { $('regError').textContent = 'Das Passwort braucht mindestens 4 Zeichen.'; return; }
  if (pass !== pass2) { $('regError').textContent = 'Die beiden Passwörter sind nicht gleich.'; return; }
  authAction($('btnRegister'), $('regError'), () => Account.register(name, pass));
};
$('regPass2').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnRegister').click(); });

$('btnAccountLogout').onclick = () => {
  dialog((card, close) => {
    card.append(el('div', { className: 'big-emoji', textContent: '🚪' }), el('h2', { textContent: `${profile.name} abmelden?` }),
      el('p', { textContent: 'Dein Spielstand ist im Konto gespeichert. Du kannst dich jederzeit wieder anmelden.' }),
      el('div', { className: 'row' },
        el('button', { className: 'btn primary', textContent: 'Abmelden', onclick: async () => { close(); await Account.logout(); location.replace(location.pathname); } }),
        el('button', { className: 'btn', textContent: 'Abbrechen', onclick: close })));
  });
};

// ---------- Start ----------
async function boot() {
  if (localMode) {
    showMenu();
    if (!profile.name) askName();
    return;
  }
  $('menu').hidden = true;
  $('authScreen').hidden = false;
  if (!Account.token()) { showAuth('login'); return; }
  showAuth('wait');
  try {
    if (!(await wakeServer())) throw new Error('offline');
    const me = await Account.check();
    if (me?.reload) { location.replace(location.pathname); return; }
    if (!me) { showAuth('login'); return; }
    $('authScreen').hidden = true;
    showMenu();
  } catch {
    showAuth('login');
    $('authError').textContent = 'Der Server antwortet gerade nicht. Bitte die Seite neu laden.';
  }
}
boot();

window.addEventListener('resize', () => { if (!game) renderer.setSize(innerWidth, innerHeight, false); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
