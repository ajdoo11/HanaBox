import { firebaseConfig } from './firebase-config.js';

let app, auth, currentUser = null;
let childProfiles = [];
let activeChild = null;

const API_BASE = '';

async function initFirebase() {
  if (app) return;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js');
  const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } =
    await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth._signIn = signInWithEmailAndPassword;
  auth._create = createUserWithEmailAndPassword;
  auth._signOut = signOut;
  auth._verify = sendEmailVerification;
  auth._onAuth = onAuthStateChanged;
}

export async function init() {
  if (firebaseConfig.apiKey === 'DEIN_API_KEY') return null;
  await initFirebase();
  return new Promise(resolve => {
    auth._onAuth(auth, user => {
      currentUser = user;
      resolve(user);
    });
  });
}

export function isConfigured() {
  return firebaseConfig.apiKey !== 'DEIN_API_KEY';
}

export async function register(email, password) {
  await initFirebase();
  const cred = await auth._create(auth, email, password);
  await auth._verify(cred.user);
  currentUser = cred.user;
  return cred.user;
}

export async function login(email, password) {
  await initFirebase();
  const cred = await auth._signIn(auth, email, password);
  currentUser = cred.user;
  return cred.user;
}

export async function logout() {
  if (!auth) return;
  await auth._signOut(auth);
  currentUser = null;
  childProfiles = [];
  activeChild = null;
}

export function getUser() { return currentUser; }
export function getActiveChild() { return activeChild; }
export function setActiveChild(child) { activeChild = child; }
export function getChildren() { return childProfiles; }

export async function getToken() {
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

export async function loadChildren() {
  const token = await getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/children`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return [];
  childProfiles = await res.json();
  return childProfiles;
}

export async function addChild(name) {
  const token = await getToken();
  if (!token) throw new Error('Nicht angemeldet');
  const res = await fetch(`${API_BASE}/api/children`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Fehler beim Anlegen');
  const child = await res.json();
  childProfiles.push(child);
  return child;
}

export async function removeChild(childId) {
  const token = await getToken();
  if (!token) throw new Error('Nicht angemeldet');
  const res = await fetch(`${API_BASE}/api/children/${childId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Fehler beim Löschen');
  childProfiles = childProfiles.filter(c => c.id !== childId);
}
