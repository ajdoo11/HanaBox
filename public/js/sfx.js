// Kleine Klänge mit WebAudio (keine Dateien nötig).
let ctx = null;
export let muted = false;
export function setMuted(m) { muted = m; }

export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* kein Audio */ }
}

function tone(f0, f1, dur, type = 'sine', vol = 0.15, delay = 0) {
  const now = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.connect(g).connect(ctx.destination);
  o.start(now);
  o.stop(now + dur + 0.02);
}

export function sfx(name) {
  if (!ctx || muted) return;
  try {
    switch (name) {
      case 'jump': tone(300, 560, 0.14, 'square', 0.04); break;
      case 'bounce': tone(180, 900, 0.3, 'sine', 0.15); break;
      case 'coin': tone(988, 988, 0.08, 'square', 0.05); tone(1319, 1319, 0.25, 'square', 0.05, 0.08); break;
      case 'checkpoint': [523, 659, 784].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.12, i * 0.1)); break;
      case 'goal': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.12, i * 0.11)); break;
      case 'pop': tone(700, 140, 0.25, 'sine', 0.15); break;
      case 'chat': tone(800, 1100, 0.07, 'sine', 0.06); break;
      case 'tag': tone(520, 260, 0.25, 'square', 0.06); break;
      case 'place': tone(240, 200, 0.06, 'square', 0.05); break;
      case 'remove': tone(200, 120, 0.08, 'square', 0.05); break;
      case 'pick': tone(500, 800, 0.1, 'sine', 0.1); break;
      case 'drop': tone(500, 300, 0.1, 'sine', 0.08); break;
      case 'eat': [0, 0.18, 0.36].forEach(d => tone(180, 120, 0.1, 'square', 0.05, d)); break;
      case 'pet': tone(700, 1000, 0.15, 'sine', 0.1); tone(900, 1300, 0.2, 'sine', 0.08, 0.15); break;
      case 'sit': tone(300, 220, 0.12, 'sine', 0.08); break;
      case 'shower': for (let i = 0; i < 10; i++) tone(1500 + Math.random() * 800, 1200, 0.05, 'sine', 0.02, i * 0.1); break;
      case 'magic': [784, 988, 1175, 1568].forEach((f, i) => tone(f, f * 1.02, 0.15, 'sine', 0.08, i * 0.06)); break;
      case 'click': tone(1000, 900, 0.04, 'square', 0.04); break;
      case 'horn': tone(392, 392, 0.18, 'square', 0.06); tone(330, 330, 0.25, 'square', 0.06, 0.2); break;
      case 'bump': tone(120, 60, 0.15, 'triangle', 0.15); break;
      case 'buy': [659, 880, 1319].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.1, i * 0.08)); break;
    }
  } catch { /* egal */ }
}
