// Dauerhafter Speicher für Konten und die gemeinsame Welt.
// Mit Firebase-Schlüssel (Umgebungsvariable FIREBASE_SERVICE_ACCOUNT oder Datei firebase-service-account.json)
// landet alles in Firestore und überlebt jeden Neustart des Servers. Sonst werden Dateien im Ordner data/ benutzt.
import fs from 'node:fs';
import path from 'node:path';

export async function openStore(root) {
  const keyFile = path.join(root, 'firebase-service-account.json');
  const key = process.env.FIREBASE_SERVICE_ACCOUNT || (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8') : '');
  const pending = new Set();
  const track = p => { pending.add(p); p.finally(() => pending.delete(p)); return p; };
  const flush = () => Promise.allSettled([...pending]);

  if (key) {
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore(initializeApp({ credential: cert(JSON.parse(key)) }));
    const col = name => db.collection('hanablox_' + name);
    // Firestore erlaubt keine verschachtelten Listen: Daten werden als JSON-Text gespeichert
    return {
      kind: 'Firebase',
      async all(name) { return (await col(name).get()).docs.map(d => [d.id, JSON.parse(d.data().json)]); },
      set(name, id, data) {
        return track(col(name).doc(id).set({ json: JSON.stringify(data), t: Date.now() }).catch(e => console.error('Speichern fehlgeschlagen:', name, id, e.message)));
      },
      flush,
    };
  }

  const dir = name => { const d = path.join(root, 'data', name); fs.mkdirSync(d, { recursive: true }); return d; };
  const file = (name, id) => path.join(dir(name), encodeURIComponent(id) + '.json');
  return {
    kind: 'Dateien',
    async all(name) {
      return fs.readdirSync(dir(name)).filter(f => f.endsWith('.json')).flatMap(f => {
        try { return [[decodeURIComponent(f.slice(0, -5)), JSON.parse(fs.readFileSync(path.join(dir(name), f), 'utf8'))]]; } catch { return []; }
      });
    },
    set(name, id, data) {
      return track(fs.promises.writeFile(file(name, id), JSON.stringify(data)).catch(e => console.error('Speichern fehlgeschlagen:', name, id, e.message)));
    },
    flush,
  };
}
