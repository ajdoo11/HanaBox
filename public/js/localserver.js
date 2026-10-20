// Spiel-Server direkt im Browser – für Hosting ohne Node-Server (z.B. GitHub Pages).
// Verhält sich wie ein WebSocket, damit das Spiel nichts davon merkt.
import { createGameCore } from './gamecore.js';

const key = (kind, code) => `hbsave_${kind}_${code}`;
const storage = {
  read(kind, code) { try { return JSON.parse(localStorage.getItem(key(kind, code))); } catch { return null; } },
  write(kind, code, data) { try { localStorage.setItem(key(kind, code), JSON.stringify(data)); } catch { /* Speicher voll */ } },
  exists(kind, code) { try { return localStorage.getItem(key(kind, code)) != null; } catch { return false; } },
};

let core = null;

export class LocalSocket {
  constructor() {
    core ??= createGameCore({ storage });
    this.readyState = 0;
    this.onopen = this.onmessage = this.onclose = this.onerror = null;
    this.peer = { readyState: 1, send: data => setTimeout(() => { if (this.readyState === 1) this.onmessage?.({ data }); }, 0) };
    setTimeout(() => {
      this.readyState = 1;
      this.client = core.connect(this.peer);
      this.onopen?.();
    }, 0);
  }

  send(data) {
    if (this.readyState !== 1) return;
    setTimeout(() => core.message(this.client, data), 0);
  }

  close() {
    if (this.readyState >= 2) return;
    const wasOpen = this.readyState === 1;
    this.readyState = 3;
    this.peer.readyState = 3;
    if (wasOpen) core.disconnect(this.client);
    setTimeout(() => this.onclose?.({}), 0);
  }
}
