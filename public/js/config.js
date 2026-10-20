// Online-Server für die GitHub-Seite (GitHub kann selbst keinen Server starten).
// Kommt die Seite direkt von einem HanaBlox-Server (PC oder Render), wird immer dieser benutzt.
const ONLINE_SERVER = 'wss://hanablox.onrender.com/ws';

const staticHost = location.hostname.endsWith('github.io') || location.protocol === 'file:';
export const SERVER_URL = staticHost ? ONLINE_SERVER : '';
