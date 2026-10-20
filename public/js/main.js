// Startseite, Avatar & Shop, Verbindung und Spielstart.
import * as THREE from 'three';
import { GAMES, AVATAR_OPTIONS, QUICK_CHAT, EMOJIS, EMOJI_BASE, sanitizeAvatar, sanitizeName } from './shared.js';
import { Character } from './avatar.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { unlockAudio, sfx, setMuted } from './sfx.js';
import { profile, saveName, saveAvatar, saveMuted, saveGrab, addRecent, removeRecent } from './profile.js';
import { avatarEditor, ALL_TABS } from './editor.js';
import * as Auth from './auth.js';

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
  showStars();
  renderRecent();
  renderMini();
}

function renderRecent() {
  const row = $('recentRow');
  row.replaceChildren();
  $('recentBox').hidden = profile.recent.length === 0;
  for (const r of profile.recent) {
    const g = GAMES[r.game];
    if (!g) continue;
    const b = el('button', { className: 'recent-card', onclick: () => { unlockAudio(); connect({ code: r.code }); } });
    b.append(el('span', { className: 'e', textContent: g.emoji }), el('span', {}, g.name, el('small', { textContent: 'Code ' + r.code })));
    row.append(b);
  }
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

function connect(opts) {
  if (!profile.name) { askName(() => connect(opts)); return; }
  $('menuError').textContent = '';
  loading('Verbinde…');
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  let welcomed = false;
  const myNet = { ws, send(m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } };
  net = myNet;
  ws.onopen = () => myNet.send({ t: 'join', ...opts, name: profile.name, avatar: profile.avatar, grab: profile.grab !== false });
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

// ---------- Auth ----------
const CHILD_EMOJIS = ['🧒', '👧', '👦', '🧒🏽', '👧🏻', '👦🏾', '🧒🏼', '👧🏿'];

function showAuth(view) {
  $('authLogin').hidden = view !== 'login';
  $('authRegister').hidden = view !== 'register';
  $('authChildren').hidden = view !== 'children';
  $('authError').textContent = '';
  $('regError').textContent = '';
  $('childError').textContent = '';
}

function renderChildren(children) {
  const grid = $('childList');
  grid.replaceChildren();
  for (const c of children) {
    const card = el('div', { className: 'child-card' });
    const emoji = CHILD_EMOJIS[Math.abs(hashStr(c.id)) % CHILD_EMOJIS.length];
    card.append(
      el('span', { className: 'avatar-emoji', textContent: emoji }),
      el('span', { textContent: c.name }),
      el('span', { className: 'remove', textContent: '✕ Entfernen', onclick: async (e) => {
        e.stopPropagation();
        try { await Auth.removeChild(c.id); renderChildren(Auth.getChildren()); } catch {}
      }})
    );
    card.onclick = () => {
      Auth.setActiveChild(c);
      if (!profile.name || profile.name === 'du') saveName(c.name);
      $('authScreen').hidden = true;
      showMenu();
    };
    grid.append(card);
  }
}

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h; }

$('btnShowReg').onclick = () => showAuth('register');
$('btnShowLogin').onclick = () => showAuth('login');
$('btnSkipAuth').onclick = () => { $('authScreen').hidden = true; showMenu(); };

$('btnLogin').onclick = async () => {
  const email = $('authEmail').value.trim(), pass = $('authPass').value;
  if (!email || !pass) { $('authError').textContent = 'Bitte E-Mail und Passwort eingeben.'; return; }
  try {
    await Auth.login(email, pass);
    const children = await Auth.loadChildren();
    if (children.length > 0) { showAuth('children'); renderChildren(children); }
    else showAuth('children');
  } catch (e) {
    $('authError').textContent = e.code === 'auth/invalid-credential' ? 'E-Mail oder Passwort falsch.'
      : e.code === 'auth/too-many-requests' ? 'Zu viele Versuche. Warte kurz.'
      : 'Fehler: ' + (e.message || e);
  }
};

$('btnRegister').onclick = async () => {
  const email = $('regEmail').value.trim(), pass = $('regPass').value, pass2 = $('regPass2').value;
  if (!email || !pass) { $('regError').textContent = 'Bitte alle Felder ausfüllen.'; return; }
  if (pass.length < 6) { $('regError').textContent = 'Passwort muss mindestens 6 Zeichen haben.'; return; }
  if (pass !== pass2) { $('regError').textContent = 'Passwörter stimmen nicht überein.'; return; }
  try {
    await Auth.register(email, pass);
    showAuth('children');
  } catch (e) {
    $('regError').textContent = e.code === 'auth/email-already-in-use' ? 'Diese E-Mail ist bereits registriert.'
      : e.code === 'auth/weak-password' ? 'Passwort zu schwach.'
      : 'Fehler: ' + (e.message || e);
  }
};

$('btnAddChild').onclick = async () => {
  const name = $('childNameInput').value.trim();
  if (!name) { $('childError').textContent = 'Bitte einen Namen eingeben.'; return; }
  try {
    await Auth.addChild(name);
    $('childNameInput').value = '';
    renderChildren(Auth.getChildren());
  } catch (e) { $('childError').textContent = e.message || 'Fehler'; }
};
$('childNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnAddChild').click(); });

$('btnLogout').onclick = async () => {
  await Auth.logout();
  showAuth('login');
};

// ---------- Start ----------
async function boot() {
  if (Auth.isConfigured()) {
    $('authScreen').hidden = false;
    $('menu').hidden = true;
    const user = await Auth.init();
    if (user) {
      const children = await Auth.loadChildren();
      showAuth('children');
      renderChildren(children);
    } else {
      showAuth('login');
    }
  } else {
    showMenu();
  }
  const urlCode = new URLSearchParams(location.search).get('code');
  if (urlCode) $('joinCode').value = urlCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (!profile.name) askName();
}
boot();

window.addEventListener('resize', () => { if (!game) renderer.setSize(innerWidth, innerHeight, false); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
