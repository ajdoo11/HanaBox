// Zahnarzt-Minispiel: Schmutz wegputzen und Löcher mit Sternchen füllen.
import { sfx } from './sfx.js';

export function openTeethGame({ title = '🦷 Zähne putzen', patient = 'dir', onDone }) {
  const overlay = document.createElement('div');
  overlay.className = 'teeth-overlay';
  const card = document.createElement('div');
  card.className = 'teeth-card';
  const h = document.createElement('h2');
  h.textContent = title;
  const info = document.createElement('p');
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 420;
  const tools = document.createElement('div');
  tools.className = 'teeth-tools';
  card.append(h, info, canvas, tools);
  overlay.append(card);
  document.body.append(overlay);
  const ctx = canvas.getContext('2d');

  // Zähne
  const teeth = [];
  for (let i = 0; i < 8; i++) {
    teeth.push({ x: 110 + i * 56, y: 120, w: 50, h: 70, top: true });
    teeth.push({ x: 110 + i * 56, y: 230, w: 50, h: 66, top: false });
  }
  const spots = [];
  const pick = () => teeth[Math.floor(Math.random() * teeth.length)];
  for (let i = 0; i < 9; i++) {
    const t = pick();
    spots.push({ kind: 'dirt', x: t.x + 10 + Math.random() * 30, y: t.y + 15 + Math.random() * 40, r: 11 + Math.random() * 6, life: 1, color: Math.random() < 0.5 ? '#8d6e63' : '#9ccc65' });
  }
  for (let i = 0; i < 3; i++) {
    const t = pick();
    spots.push({ kind: 'hole', x: t.x + 25, y: t.y + 35, r: 9, life: 1 });
  }
  let tool = 'brush';
  let sparkles = [];
  let done = false;

  const toolBtn = (id, label) => {
    const b = document.createElement('button');
    b.className = 'btn' + (tool === id ? ' primary' : '');
    b.textContent = label;
    b.onclick = () => { tool = id; tools.querySelectorAll('button').forEach(x => x.classList.toggle('primary', x === b)); };
    tools.append(b);
  };
  toolBtn('brush', '🪥 Zahnbürste');
  toolBtn('fill', '⭐ Füllung');
  const close = document.createElement('button');
  close.className = 'btn pink';
  close.textContent = 'Fertig';
  close.onclick = () => finish(false);
  tools.append(close);

  function remaining() { return spots.filter(s => s.life > 0).length; }
  function updateInfo() {
    const d = spots.filter(s => s.kind === 'dirt' && s.life > 0).length, hl = spots.filter(s => s.kind === 'hole' && s.life > 0).length;
    info.textContent = done ? '✨ Strahlend sauber! Super gemacht!' : `Putze den Schmutz weg (noch ${d}) und fülle die Löcher mit ⭐ (noch ${hl}).`;
  }

  function draw() {
    ctx.clearRect(0, 0, 640, 420);
    // Mund
    ctx.fillStyle = '#ef9a9a';
    ctx.beginPath(); ctx.ellipse(320, 210, 290, 180, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath(); ctx.ellipse(320, 210, 250, 120, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e57373';
    ctx.beginPath(); ctx.ellipse(320, 250, 140, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f48fb1';
    ctx.fillRect(80, 100, 480, 30); ctx.fillRect(80, 285, 480, 30);
    for (const t of teeth) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(t.x, t.y, t.w, t.h, 14); ctx.fill(); ctx.stroke();
    }
    for (const s of spots) {
      if (s.life <= 0) {
        if (s.kind === 'hole') { ctx.fillStyle = '#ffd54f'; star(s.x, s.y, 10); }
        continue;
      }
      ctx.globalAlpha = s.life;
      if (s.kind === 'dirt') { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    sparkles = sparkles.filter(p => (p.t -= 0.03) > 0);
    for (const p of sparkles) { ctx.globalAlpha = p.t; ctx.fillStyle = p.c; star(p.x, p.y - (1 - p.t) * 30, 6); ctx.globalAlpha = 1; }
    if (overlay.isConnected) requestAnimationFrame(draw);
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.fill();
  }

  function at(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 640, y: ((e.clientY - rect.top) / rect.height) * 420 };
  }
  let down = false;
  const act = e => {
    const p = at(e);
    for (const s of spots) {
      if (s.life <= 0 || Math.hypot(s.x - p.x, s.y - p.y) > s.r + 44) continue;
      if (tool === 'brush' && s.kind === 'dirt') {
        s.life -= 0.12;
        if (Math.random() < 0.3) sparkles.push({ x: s.x, y: s.y, t: 1, c: '#e1f5fe' });
        if (s.life <= 0) { sfx('pop'); sparkles.push({ x: s.x, y: s.y, t: 1, c: '#ffffff' }); }
      } else if (tool === 'fill' && s.kind === 'hole' && e.type === 'pointerdown') {
        s.life = 0; sfx('coin');
        for (let i = 0; i < 5; i++) sparkles.push({ x: s.x + (Math.random() - 0.5) * 30, y: s.y, t: 1, c: '#ffd54f' });
      } else if (tool === 'brush' && s.kind === 'hole' && e.type === 'pointerdown') {
        info.textContent = 'Für Löcher brauchst du die ⭐ Füllung!';
        return;
      }
    }
    updateInfo();
    if (!done && remaining() === 0) {
      done = true;
      updateInfo();
      sfx('goal');
      for (let i = 0; i < 30; i++) sparkles.push({ x: 100 + Math.random() * 440, y: 120 + Math.random() * 180, t: 1 + Math.random(), c: ['#fff59d', '#ffffff', '#81d4fa'][i % 3] });
      setTimeout(() => finish(true), 1500);
    }
  };
  canvas.addEventListener('pointerdown', e => { down = true; try { canvas.setPointerCapture(e.pointerId); } catch { /* egal */ } act(e); });
  canvas.addEventListener('pointermove', e => { if (down) act(e); });
  canvas.addEventListener('pointerup', () => { down = false; });

  function finish(ok) {
    if (!overlay.isConnected) return;
    overlay.remove();
    onDone?.(ok);
  }
  updateInfo();
  draw();
  if (patient !== 'dir') info.textContent = `${patient} macht den Mund auf: «Aaaah!» – ` + info.textContent;
}
