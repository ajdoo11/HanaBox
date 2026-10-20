// Steuerung: Touch-Joystick links, Kamera drehen rechts, Sprung-Knopf, Tastatur und Maus.


export class Input {
  constructor(canvas, joyBase, joyKnob, jumpBtn) {
    this.canvas = canvas;
    this.joyBase = joyBase;
    this.joyKnob = joyKnob;
    this.keys = new Set();
    this.joy = null;
    this.joyVec = { x: 0, y: 0 };
    this.cams = new Map();
    this.camDX = 0; this.camDY = 0; this.zoomF = 1;
    this.taps = [];
    this.jumpTouch = false;
    this.enabled = false;

    canvas.addEventListener('pointerdown', this.down);
    window.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoomF *= Math.exp(e.deltaY * 0.001); }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      if (!this.enabled || e.target.tagName === 'INPUT') return;
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.reset());

    const jumpOn = e => { e.preventDefault(); this.jumpTouch = true; jumpBtn.classList.add('down'); };
    const jumpOff = () => { this.jumpTouch = false; jumpBtn.classList.remove('down'); };
    jumpBtn.addEventListener('pointerdown', jumpOn);
    jumpBtn.addEventListener('pointerup', jumpOff);
    jumpBtn.addEventListener('pointercancel', jumpOff);
    jumpBtn.addEventListener('pointerleave', jumpOff);
  }

  down = e => {
    if (!this.enabled) return;
    // Der Joystick steht fest unten links; nur wer ihn (oder knapp daneben) berührt, steuert damit
    if (e.pointerType !== 'mouse' && !this.joy) {
      const r = this.joyBase.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < r.width * 0.75) {
        this.joy = { id: e.pointerId, ox: cx, oy: cy };
        this.joyBase.classList.add('active');
        this.move(e);
        return;
      }
    }
    this.cams.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false });
    if (this.cams.size === 2) this.pinch = this.pinchDist();
  };

  pinchDist() {
    const [a, b] = [...this.cams.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  move = e => {
    if (this.joy && e.pointerId === this.joy.id) {
      let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
      const R = this.joyBase.offsetWidth * 0.43;
      const l = Math.hypot(dx, dy);
      if (l > R) { dx *= R / l; dy *= R / l; }
      this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joyVec = { x: dx / R, y: -dy / R };
      return;
    }
    const c = this.cams.get(e.pointerId);
    if (!c) return;
    const px = c.x, py = c.y;
    c.x = e.clientX; c.y = e.clientY;
    if (Math.hypot(c.x - c.sx, c.y - c.sy) > 10) c.moved = true;
    if (this.cams.size >= 2) {
      const d = this.pinchDist();
      this.zoomF *= this.pinch / d;
      this.pinch = d;
      c.moved = true;
    } else {
      this.camDX += c.x - px;
      this.camDY += c.y - py;
    }
  };

  up = e => {
    if (this.joy && e.pointerId === this.joy.id) {
      this.joy = null;
      this.joyVec = { x: 0, y: 0 };
      this.joyKnob.style.transform = '';
      this.joyBase.classList.remove('active');
      return;
    }
    const c = this.cams.get(e.pointerId);
    if (!c) return;
    this.cams.delete(e.pointerId);
    if (this.cams.size === 1) this.pinch = null;
    if (e.type === 'pointerup' && !c.moved && performance.now() - c.t < 450) this.taps.push({ x: e.clientX, y: e.clientY });
  };

  getMove() {
    let { x, y } = this.joyVec;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  get jumpHeld() { return this.jumpTouch || this.keys.has('Space'); }

  consumeCamera() {
    const r = { dx: this.camDX, dy: this.camDY, zoom: this.zoomF };
    this.camDX = this.camDY = 0;
    this.zoomF = 1;
    return r;
  }

  consumeTaps() { const t = this.taps; this.taps = []; return t; }

  reset() {
    this.keys.clear();
    this.cams.clear();
    this.joy = null;
    this.joyVec = { x: 0, y: 0 };
    this.joyKnob.style.transform = '';
    this.joyBase.classList.remove('active');
    this.jumpTouch = false;
    this.taps = [];
    this.camDX = this.camDY = 0;
    this.zoomF = 1;
  }
}
