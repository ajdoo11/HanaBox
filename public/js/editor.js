// Avatar-Editor mit Shop (Sterne) und Berufen. Wird im Menü, in der Boutique, beim Friseur usw. benutzt.
import { AVATAR_OPTIONS, JOBS, KIDS } from './shared.js';
import { profile, owns, price, buy } from './profile.js';

export const ALL_TABS = [
  ['jobs', '⭐ Berufe'], ['kids', '👧 Kinder'], ['hair', 'Frisur'], ['hairColor', 'Haarfarbe'], ['face', 'Gesicht'], ['eyes', 'Augen'], ['skin', 'Haut'],
  ['shirtStyle', 'Oberteil'], ['shirt', 'Farbe Oberteil'], ['sleeve', 'Ärmel'], ['pantsStyle', 'Hose/Rock'], ['pants', 'Farbe Hose'],
  ['shoes', 'Schuhe'], ['hat', 'Hut'], ['acc', 'Accessoires'], ['pet', '🐾 Haustier'],
];
export const PET_TABS = [['pet', '🐾 Mein Haustier']];
export const SALON_TABS = [['hair', 'Frisur'], ['hairColor', 'Haarfarbe'], ['hat', 'Haarschmuck & Hüte'], ['face', 'Make-up & Gesicht']];
export const CLOTHES_TABS = [
  ['shirtStyle', 'Oberteil'], ['shirt', 'Farbe Oberteil'], ['sleeve', 'Ärmel'], ['pantsStyle', 'Hose/Rock'], ['pants', 'Farbe Hose'],
  ['shoes', 'Schuhe'], ['hat', 'Hüte'], ['acc', 'Accessoires'], ['jobs', '⭐ Berufe'],
];
export const JOB_TABS = [['jobs', '⭐ Berufe']];

const COLOR_KEYS = { skin: 'skin', hairColor: 'colors', shirt: 'colors', pants: 'colors', shoes: 'colors', eyes: 'eyes' };

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...kids);
  return e;
}

export function avatarEditor(tabsEl, optsEl, tabs, onChange, toast) {
  let cur = tabs[0][0];
  function render() {
    tabsEl.replaceChildren();
    tabsEl.hidden = tabs.length < 2;
    for (const [k, label] of tabs) {
      tabsEl.append(el('button', { className: k === cur ? 'on' : '', textContent: label, onclick: () => { cur = k; render(); } }));
    }
    optsEl.replaceChildren();
    const a = profile.avatar;
    if (cur === 'kids') {
      for (const kid of KIDS) {
        const b = el('button', { className: 'opt job' });
        b.append(el('span', { className: 'big', textContent: kid.emoji }), el('span', { textContent: kid.name }));
        b.onclick = () => { onChange({ ...profile.avatar, ...kid.set }); toast?.(`${kid.emoji} ${kid.name}!`); };
        optsEl.append(b);
      }
      return;
    }
    if (cur === 'jobs') {
      for (const job of JOBS) {
        const b = el('button', { className: 'opt job' });
        b.append(el('span', { className: 'big', textContent: job.emoji }), el('span', { textContent: job.name }));
        b.onclick = () => { onChange({ ...profile.avatar, ...job.set }); toast?.(`${job.emoji} Du bist jetzt ${job.name}!`); };
        optsEl.append(b);
      }
      return;
    }
    if (COLOR_KEYS[cur]) {
      const list = AVATAR_OPTIONS[COLOR_KEYS[cur]];
      list.forEach((c, i) => {
        const val = cur === 'eyes' ? i : c;
        const b = el('button', { className: 'sw' + (a[cur] === val ? ' on' : ''), onclick: () => onChange({ ...profile.avatar, [cur]: val }) });
        b.style.background = c;
        optsEl.append(b);
      });
      return;
    }
    AVATAR_OPTIONS[cur].forEach((name, i) => {
      const p = price(cur, i);
      const has = owns(cur, i) || a[cur] === i;
      const b = el('button', { className: 'opt' + (a[cur] === i ? ' on' : '') + (has ? '' : ' locked') });
      b.append(el('span', { textContent: name }));
      if (!has) b.append(el('span', { className: 'price', textContent: `⭐ ${p}` }));
      b.onclick = () => {
        if (!owns(cur, i) && a[cur] !== i) {
          if (!buy(cur, i)) { toast?.(`Dafür brauchst du ⭐ ${p}. Sammle Sterne in den Spielen!`); return; }
          toast?.(`🛍️ Gekauft: ${name}!`);
        }
        onChange({ ...profile.avatar, [cur]: i });
      };
      optsEl.append(b);
    });
  }
  render();
  return { render, show(k) { cur = k; render(); } };
}
