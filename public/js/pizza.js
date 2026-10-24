// Pizzeria-Minispiel: Bestellung lesen, Teig, Sauce, Käse, Beläge mit dem Finger verteilen, backen, servieren.
import { sfx } from './sfx.js';

const TOPPINGS = [
  { key: 'salami', emoji: '🍕', name: 'Salami', draw: (c, x, y) => { c.fillStyle = '#c62828'; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = '#ef9a9a'; for (const [a, b] of [[-4, -3], [4, 2], [-1, 5]]) { c.beginPath(); c.arc(x + a, y + b, 2, 0, 7); c.fill(); } } },
  { key: 'mushroom', emoji: '🍄', name: 'Pilze', draw: (c, x, y) => { c.fillStyle = '#d7ccc8'; c.beginPath(); c.ellipse(x, y - 2, 12, 8, 0, Math.PI, 0); c.fill(); c.fillRect(x - 4, y - 2, 8, 9); } },
  { key: 'pepper', emoji: '🫑', name: 'Peperoni', draw: (c, x, y) => { c.strokeStyle = '#43a047'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, 9, 0, 7); c.stroke(); } },
  { key: 'pineapple', emoji: '🍍', name: 'Ananas', draw: (c, x, y) => { c.fillStyle = '#ffd54f'; c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 11, y + 8); c.lineTo(x - 11, y + 8); c.fill(); } },
  { key: 'olive', emoji: '🫒', name: 'Oliven', draw: (c, x, y) => { c.strokeStyle = '#263238'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, 6, 0, 7); c.stroke(); } },
  { key: 'tomato', emoji: '🍅', name: 'Tomaten', draw: (c, x, y) => { c.fillStyle = '#e53935'; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill(); c.fillStyle = '#ffcdd2'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } },
];
const CUSTOMERS = ['Mia', 'Leon', 'Oma Rosi', 'Ben', 'Lina', 'Herr Gross', 'Zoe', 'Elias'];
const ORDERS_PER_SHIFT = 3;

const pick = a => a[Math.floor(Math.random() * a.length)];
function makeOrder() {
  const kinds = [...TOPPINGS].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
  return { who: pick(CUSTOMERS), want: kinds.map(t => ({ t, n: 2 + Math.floor(Math.random() * 3) })) };
}

export function openPizzaGame({ onServe, onDone }) {
  const overlay = document.createElement('div');
  overlay.className = 'teeth-overlay';
  const card = document.createElement('div');
  card.className = 'teeth-card pizza-card';
  const h = document.createElement('h2');
  h.textContent = '🍕 Pizzeria – du bist Pizzabäcker/in!';
  const info = document.createElement('p');
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 420;
  const tools = document.createElement('div');
  tools.className = 'teeth-tools';
  const steps = document.createElement('div');
  steps.className = 'teeth-tools';
  card.append(h, info, canvas, steps, tools);
  overlay.append(card);
  document.body.append(overlay);
  const ctx = canvas.getContext('2d');

  const PX = 230, PY = 220, PR = 150;
  let order = makeOrder(), served = 0, earned = 0;
  let pizza, tool = null, oven = 0, closed = false;
  const reset = () => { pizza = { dough: false, sauce: 0, cheese: 0, tops: [], baked: 0 }; oven = 0; tool = null; };
  reset();

  function hint() {
    if (!pizza.dough) return '1️⃣ Tippe auf «🫓 Teig», um den Teig auszurollen.';
    if (pizza.sauce < 1) return '2️⃣ Tippe auf «🍅 Sauce» und streiche mit dem Finger über die Pizza.';
    if (pizza.cheese < 1) return '3️⃣ Jetzt «🧀 Käse» – streich ihn über die Pizza.';
    if (oven > 0) return '🔥 Die Pizza backt …';
    if (pizza.baked >= 1) return '🛎️ Fertig gebacken! Tippe auf «Servieren».';
    const miss = order.want.find(w => pizza.tops.filter(t => t.t === w.t).length < w.n);
    if (miss) return `4️⃣ Wähle ${miss.t.emoji} ${miss.t.name} und tippe auf die Pizza (${pizza.tops.filter(t => t.t === miss.t).length}/${miss.n}).`;
    return '5️⃣ Alles drauf! Ab «🔥 In den Ofen».';
  }

  function draw() {
    ctx.clearRect(0, 0, 640, 420);
    // Holzbrett
    ctx.fillStyle = '#d7a86e'; ctx.beginPath(); ctx.roundRect(40, 30, 380, 380, 30); ctx.fill();
    ctx.strokeStyle = '#b07a42'; ctx.lineWidth = 4; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(40, 30 + i * 63); ctx.lineTo(420, 30 + i * 63); ctx.stroke(); }
    if (pizza.dough) {
      const b = pizza.baked;
      ctx.fillStyle = b >= 1 ? '#d9963f' : '#f3d39b'; ctx.beginPath(); ctx.arc(PX, PY, PR, 0, 7); ctx.fill();
      ctx.fillStyle = b >= 1 ? '#c87f2a' : '#ecc27e'; ctx.lineWidth = 16; ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.arc(PX, PY, PR - 8, 0, 7); ctx.stroke();
      if (pizza.sauce > 0) { ctx.globalAlpha = Math.min(1, pizza.sauce); ctx.fillStyle = b >= 1 ? '#b71c1c' : '#e53935'; ctx.beginPath(); ctx.arc(PX, PY, PR - 20, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      if (pizza.cheese > 0) {
        ctx.globalAlpha = Math.min(1, pizza.cheese) * 0.9; ctx.fillStyle = b >= 1 ? '#ffd54f' : '#fff8e1';
        for (let i = 0; i < 45; i++) { const a = i * 2.39996, r = 118 * Math.sqrt((i + 0.5) / 45); ctx.beginPath(); ctx.ellipse(PX + Math.cos(a) * r, PY + Math.sin(a) * r, 24, 17, a, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        if (b >= 1) { ctx.fillStyle = '#e0a03a'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(PX + Math.cos(i * 1.7) * (i * 8), PY + Math.sin(i * 1.7) * (i * 8), 5, 0, 7); ctx.fill(); } }
      }
      for (const t of pizza.tops) t.t.draw(ctx, t.x, t.y);
    } else {
      ctx.fillStyle = '#f3d39b'; ctx.beginPath(); ctx.arc(PX, PY, 55, 0, 7); ctx.fill();
      ctx.fillStyle = '#5d4037'; ctx.font = '900 22px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Teigkugel', PX, PY + 90);
    }
    if (oven > 0) {
      ctx.fillStyle = 'rgba(255,111,0,0.35)'; ctx.fillRect(40, 30, 380, 380);
      ctx.fillStyle = '#fff'; ctx.font = '900 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🔥 backt …', PX, 70);
      ctx.fillStyle = '#4e342e'; ctx.fillRect(90, 380, 280, 16); ctx.fillStyle = '#ffca28'; ctx.fillRect(90, 380, 280 * (1 - oven / 3), 16);
    }
    // Bestellzettel
    ctx.fillStyle = '#fffde7'; ctx.beginPath(); ctx.roundRect(445, 30, 175, 300, 14); ctx.fill();
    ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#2b2140'; ctx.textAlign = 'left'; ctx.font = '900 20px system-ui';
    ctx.fillText('🧾 Bestellung', 458, 62);
    ctx.font = '800 17px system-ui'; ctx.fillText(`für ${order.who}`, 458, 88);
    let y = 125;
    for (const line of ['🫓 Teig', '🍅 Sauce', '🧀 Käse']) { ctx.fillText(line, 458, y); y += 30; }
    ctx.font = '900 19px system-ui';
    for (const w of order.want) {
      const have = pizza.tops.filter(t => t.t === w.t).length;
      ctx.fillStyle = have >= w.n ? '#2e7d32' : '#2b2140';
      ctx.fillText(`${w.n}× ${w.t.emoji} ${w.t.name}`, 458, y); y += 30;
    }
    ctx.fillStyle = '#6a1b9a'; ctx.font = '900 18px system-ui';
    ctx.fillText(`🍕 ${served}/${ORDERS_PER_SHIFT}  ⭐ +${earned}`, 458, 312);
    info.textContent = hint();
  }

  const btn = (parent, label, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.onclick = fn; parent.append(b); return b; };
  function renderTools() {
    steps.replaceChildren(); tools.replaceChildren();
    const sel = id => (tool === id ? 'primary' : '');
    btn(steps, '🫓 Teig', () => { if (!pizza.dough) { pizza.dough = true; sfx('pop'); } renderTools(); draw(); }, pizza.dough ? '' : 'primary');
    btn(steps, '🍅 Sauce', () => { tool = 'sauce'; renderTools(); }, sel('sauce'));
    btn(steps, '🧀 Käse', () => { tool = 'cheese'; renderTools(); }, sel('cheese'));
    for (const t of TOPPINGS) btn(steps, `${t.emoji} ${t.name}`, () => { tool = t; renderTools(); }, sel(t));
    btn(tools, '🔥 In den Ofen', bake, 'pink');
    btn(tools, '🛎️ Servieren', serve, 'primary');
    btn(tools, '🗑️ Neue Pizza', () => { reset(); renderTools(); draw(); });
    btn(tools, 'Fertig', () => finish(), '');
  }

  function bake() {
    if (!pizza.dough || pizza.sauce < 1 || pizza.cheese < 1) { info.textContent = '🙈 Zuerst Teig, Sauce und Käse!'; return; }
    if (oven > 0 || pizza.baked >= 1) return;
    oven = 3; sfx('magic');
    let last = performance.now();
    const step = now => {
      if (closed) return;
      oven = Math.max(0, oven - (now - last) / 1000); last = now;
      if (oven > 0) requestAnimationFrame(step); else { pizza.baked = 1; sfx('goal'); }
      draw();
    };
    requestAnimationFrame(step);
  }

  function serve() {
    if (pizza.baked < 1) { info.textContent = '🔥 Die Pizza muss zuerst in den Ofen!'; return; }
    const miss = order.want.find(w => pizza.tops.filter(t => t.t === w.t).length < w.n);
    if (miss) { info.textContent = `😮 ${order.who} wollte ${miss.n}× ${miss.t.emoji} ${miss.t.name}. Mach eine neue Pizza!`; sfx('pop'); return; }
    served++;
    const got = onServe?.() || 0;
    earned += got;
    sfx('coin');
    if (served >= ORDERS_PER_SHIFT) { finish(true); return; }
    info.textContent = `😋 ${order.who} sagt: Mmmh, lecker! Danke!`;
    order = makeOrder(); reset();
    setTimeout(() => { if (!closed) { renderTools(); draw(); } }, 1200);
    renderTools();
  }

  // Mit dem Finger: Sauce/Käse streichen, Beläge setzen
  const at = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 420 / r.height]; };
  let down = false;
  const paint = e => {
    if (!pizza.dough || pizza.baked >= 1 || oven > 0 || !tool) return;
    const [x, y] = at(e);
    if (Math.hypot(x - PX, y - PY) > PR - 12) return;
    if (tool === 'sauce') pizza.sauce = Math.min(1, pizza.sauce + 0.06);
    else if (tool === 'cheese') { if (pizza.sauce < 1) { info.textContent = '🍅 Zuerst die Sauce!'; return; } pizza.cheese = Math.min(1, pizza.cheese + 0.06); }
    draw();
  };
  canvas.addEventListener('pointerdown', e => {
    down = true;
    if (typeof tool === 'object' && tool && pizza.dough && !pizza.baked && !oven) {
      const [x, y] = at(e);
      if (Math.hypot(x - PX, y - PY) < PR - 20) { pizza.tops.push({ t: tool, x, y }); sfx('pop'); draw(); }
      return;
    }
    paint(e);
  });
  canvas.addEventListener('pointermove', e => { if (down && typeof tool === 'string') paint(e); });
  addEventListener('pointerup', () => { down = false; });

  function finish(all = false) {
    if (closed) return;
    closed = true;
    overlay.remove();
    onDone?.({ served, earned, all });
  }

  renderTools();
  draw();
}
