// Eigene Häuser: freie Grundstücke («zu verkaufen») und die Häuser, die Spieler dort mit Sternen bauen.
// Jedes Haus hat einen eigenen Innenraum weit weg von der Stadt (wie die anderen Innenwelten).
import { createKit } from './kit.js';
import { HOUSE_LOTS, HOUSE_STYLES, HOUSE_WALLS, HOUSE_ROOFS, HOUSE_FLOORS, FURNITURE, FURN_INDEX } from './shared.js';

const LOT = 18;
export const lotInterior = i => ({ x: -1300 + i * 120, z: -2100 });
// Wo man ankommt, wenn man zum Haus reist: auf dem Gehweg vor dem Grundstück
export const lotFront = i => ({ x: HOUSE_LOTS[i].x, z: HOUSE_LOTS[i].z - LOT / 2 - 2 });
export const houseName = owner => (/[sxzß]$/i.test(owner) ? `${owner}' Haus` : `${owner}s Haus`);

// Grösse und Aussehen je Haustyp
const LOOK = {
  cottage: { w: 9, d: 8, h: 5.6, tex: 'wood', roof: 'pitched', inside: [20, 16, 7] },
  family: { w: 12, d: 10, h: 6, tex: 'brick', roof: 'pitched', inside: [28, 20, 8] },
  villa: { w: 15, d: 11, h: 9, tex: 'tiles', roof: 'flat', inside: [34, 24, 11] },
  castle: { w: 12, d: 11, h: 8, tex: 'stone', roof: 'flat', inside: [34, 28, 12] },
};

export function lotParts(i, h) {
  const parts = [];
  const K = createKit({ parts, seed: 500 + i });
  const { deco, box, sign, signPost, bush, flowers, tree } = K;
  const { x, z } = HOUSE_LOTS[i];
  const front = z - LOT / 2;
  deco(x, 0, z, LOT, 0.1, LOT, '#9ccc65', { tex: 'grass', noShadow: true });
  // Gartenzaun hinten und an den Seiten
  deco(x, 0, z + LOT / 2 - 0.1, LOT, 1.0, 0.2, '#ffffff', { tex: 'wood' });
  for (const s of [-1, 1]) deco(x + s * (LOT / 2 - 0.1), 0, z, 0.2, 1.0, LOT, '#ffffff', { tex: 'wood' });
  if (!h) {
    signPost(`🏡 Frei · Nr. ${i + 1}`, x, front + 3, 'z-', '#fff59d', '#2e7d32', 7);
    sign('📱 Handy → 🎒 Rucksack', x, 1.6, front + 3.05, 5.4, 0.7, 'z-', '#ffffff', '#6a1b9a', false);
    flowers(x - 5, z + 4, 4, 2, 6);
    return { parts, interior: null };
  }

  const st = HOUSE_STYLES[h.style] || HOUSE_STYLES[0];
  const L = LOOK[st.key];
  const wall = HOUSE_WALLS[h.wall] || HOUSE_WALLS[0], roof = HOUSE_ROOFS[h.roof] || HOUSE_ROOFS[0];
  const name = houseName(h.owner);
  const hz = z + LOT / 2 - L.d / 2 - 1.5;
  const hf = hz - L.d / 2;
  K.building({ x, z: hz, w: L.w, d: L.d, h: L.h, wall, wallTex: L.tex, roof: L.roof, roofColor: roof, door: 'n', text: name, to: 'lot:' + i, name, signFg: '#5d4037', awning: st.key === 'villa' ? roof : undefined });
  // Gartenweg, Briefkasten, Blumen
  deco(x, 0.1, (front + hf) / 2, 2.6, 0.04, hf - front, '#d7ccc8', { tex: 'stone', noShadow: true });
  box(x + 3.2, 0, front + 1.2, 0.2, 1.2, 0.2, '#6d4c41');
  deco(x + 3.2, 1.2, front + 1.2, 0.7, 0.55, 0.9, roof);
  flowers(x - 5, hf - 1.6, 4, 1.4, 6);
  bush(x + 6.5, hf - 1.6, 0.8);

  if (st.key === 'cottage') {
    deco(x + 2.5, L.h + 0.6, hz + 1.5, 1, 2.6, 1, '#b0614a', { tex: 'brick' });
    tree(x + 6, z - 3, 0.6);
  } else if (st.key === 'family') {
    deco(x - 3.5, L.h + 1, hz + 2, 1.1, 2.6, 1.1, '#b0614a', { tex: 'brick' });
    deco(x - 6.5, 0, z - 3, 3, 0.25, 3, '#8d6e63', { tex: 'sand' });
    deco(x - 6.5, 0.25, z - 3, 0.6, 0.6, 0.6, '#ffca28', { shape: 'sphere' });
  } else if (st.key === 'villa') {
    // Dachgarten und Formschnitt-Büsche
    for (const s of [-1, 1]) {
      deco(x + s * 4.5, L.h + 0.5, hz, 2.6, 0.6, 2.6, '#8d6e63', { tex: 'wood' });
      deco(x + s * 4.5, L.h + 1.1, hz, 2.2, 1.6, 2.2, '#5ccb3c', { shape: 'sphere' });
      deco(x + s * 8.3, 0, hf + 1, 0.9, 2.4, 0.9, '#2f9e44', { shape: 'cone' });
    }
  } else if (st.key === 'castle') {
    // Ecktürme mit Spitzdach, Zinnen und Fahne
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const tx = x + sx * L.w / 2, tz = hz + sz * L.d / 2;
      box(tx, 0, tz, 3, L.h + 2.5, 3, wall, { shape: 'cyl', tex: 'stone' });
      deco(tx, L.h + 2.5, tz, 3.8, 3.4, 3.8, roof, { shape: 'cone' });
    }
    for (let k = -2; k <= 2; k++) {
      deco(x + k * 2.2, L.h + 0.5, hf + 0.4, 1, 1, 0.8, wall, { tex: 'stone' });
      deco(x + k * 2.2, L.h + 0.5, hz + L.d / 2 - 0.4, 1, 1, 0.8, wall, { tex: 'stone' });
    }
    deco(x, L.h + 0.5, hz, 0.15, 4, 0.15, '#5d4037');
    deco(x + 0.9, L.h + 3.6, hz, 1.6, 0.9, 0.08, roof);
  }

  return { parts, interior: houseInside(K, i, h, name) };
}

// Innenraum: feste Hülle (bei Villa/Schlösschen mit Galerie, Treppe, Rutsche, Thron) und frei
// einrichtbare Möbel. Ohne eigene Einrichtung steht die Grundausstattung (defaultFurn) drin.
export function lotInside(i, h) {
  const st = HOUSE_STYLES[h?.style] || HOUSE_STYLES[0];
  const [W, D, H] = LOOK[st.key].inside;
  return { ...lotInterior(i), W, D, H, style: st.key };
}

export function defaultFurn(styleIdx) {
  const key = (HOUSE_STYLES[styleIdx] || HOUSE_STYLES[0]).key;
  const [W, D] = LOOK[key].inside;
  const back = -D / 2 + 1;
  const F = k => FURN_INDEX[k];
  return [
    [F('sofa'), -W / 4, 1, 2], [F('rug'), -W / 4, -2, 0], [F('tv'), -W / 4, -D / 2 + 1, 0],
    [F('fridge'), W / 2 - 1.6, back + 0.2, 0], [F('stove'), W / 2 - 4.6, back, 0],
    [F('table'), W / 4, -1, 0], [F('chair'), W / 4 - 2.3, -1, 1], [F('chair'), W / 4 + 2.3, -1, 3],
    [F('bed'), -W / 2 + 3, back + 2, 0], [F('wardrobe'), -W / 2 + 7, back - 0.2, 0],
    [F('sink'), W / 2 - 0.9, D / 2 - 5, 3], [F('toybox'), -W / 2 + 1.2, D / 2 - 4, 0], [F('plant'), W / 2 - 1.2, D / 2 - 1.6, 0],
  ].map(([k, x, z, r]) => [k, Math.round(x * 10) / 10, Math.round(z * 10) / 10, r]);
}

function houseInside(K, i, h, name) {
  const { box, deco, stairs, slide } = K;
  const { x: ox, z: oz, W, D, H, style } = lotInside(i, h);
  const fl = HOUSE_FLOORS[h.floor] || (style === 'castle' ? HOUSE_FLOORS[4] : HOUSE_FLOORS[0]);
  const wall = HOUSE_WALLS[h.inWall ?? h.wall] || HOUSE_WALLS[0];
  const spawn = K.shell(ox, oz, W, D, H, fl.c, fl.tex, wall, style === 'castle' ? 'stone' : 'dots', `${name} 🏡`);
  const back = oz - D / 2 + 1;
  if (style === 'villa' || style === 'castle') {
    // Galerie mit Treppe hinauf und Rutsche hinunter
    const up = 5;
    box(ox, up - 0.4, back + 3, W - 2, 0.4, 6, '#ffe0b2', { tex: 'carpet' });
    deco(ox, up, back + 6, W - 2, 1.1, 0.15, '#ffffff');
    stairs(ox + 2, back + 16, 'n', 2.4, 0, up, '#ffd43b', 'wood');
    slide(ox - W / 2 + 3, back + 6.2, 'z', 1, 9, up, 0.2, '#ff4081', 2.2);
  }
  if (style === 'castle') {
    const tx = ox - 5;
    box(tx, 0, back + 9, 3, 0.6, 2, '#e03131', { tex: 'carpet' });
    box(tx, 0.6, back + 8.6, 1.6, 1, 1.2, '#ffd43b', { act: 'sit', rot: 0 });
    deco(tx, 1.6, back + 8.1, 1.8, 2.4, 0.3, '#ffd43b');
  }
  for (const [k, x, z, r] of h.furn || defaultFurn(h.style)) {
    const f = FURNITURE[k];
    if (!f) continue;
    const cx = Math.max(-W / 2 + 1, Math.min(W / 2 - 1, x)), cz = Math.max(-D / 2 + 1, Math.min(D / 2 - 1.5, z));
    placeFurn(K, f.key, ox + cx, oz + cz, r & 3);
  }
  return { spawn };
}

// Ein Möbelstück bauen. r = Drehung in Vierteln (0 = schaut nach Süden, zur Tür)
const FURN_COLORS = ['#4dabf7', '#ff8fab', '#69db7c', '#ffd43b', '#b197fc', '#ff922b'];
function placeFurn(K, key, x, z, r) {
  const { box, deco, sofa, chair, table, bed, wardrobePart } = K;
  const rot = r * Math.PI / 2;
  const turn = r % 2 === 1;
  const s = Math.sin(rot), co = Math.cos(rot);
  // Teil relativ zum Möbel (dx nach rechts, dz nach vorne), mitgedreht; solid: false = ohne Zusammenstoss
  const B = (dx, y, dz, w, hh, d, c, e = {}) => {
    const { solid = true, ...rest } = e;
    return (solid ? box : deco)(x + dx * co + dz * s, y, z - dx * s + dz * co, turn ? d : w, hh, turn ? w : d, c, rest);
  };
  const col = FURN_COLORS[Math.abs(Math.round(x * 3 + z * 7)) % FURN_COLORS.length];
  switch (key) {
    case 'sofa': sofa(x, z, rot, col, 4); break;
    case 'armchair': sofa(x, z, rot, col, 2); break;
    case 'beanbag': box(x, 0, z, 1.8, 1.0, 1.8, col, { shape: 'sphere', act: 'sit', rot }); break;
    case 'bed': bed(x, 0, z, rot, col); break;
    case 'table': table(x, 0, z, turn ? 2 : 3, turn ? 3 : 2, '#ffffff'); break;
    case 'chair': chair(x, z, rot, '#ffcc80'); break;
    case 'desk':
      B(0, 0, 0, 2.6, 1.2, 1.3, '#a1887f', { tex: 'wood' });
      B(0, 1.2, -0.3, 1.2, 0.8, 0.1, '#263238', { solid: false });
      B(0, 1.25, -0.24, 1.05, 0.65, 0.04, '#4dabf7', { solid: false, emissive: '#74c0fc', emissiveIntensity: 0.6 });
      break;
    case 'tv':
      B(0, 0, 0, 3.4, 0.8, 0.9, '#6d4c41', { tex: 'wood' });
      B(0, 0.85, 0, 3, 1.8, 0.15, '#263238', { solid: false });
      B(0, 1, 0.1, 2.7, 1.5, 0.04, '#4dabf7', { solid: false, emissive: '#74c0fc', emissiveIntensity: 0.5 });
      break;
    case 'shelf':
      B(0, 0, 0, 3, 3.2, 0.8, '#8d6e63', { tex: 'wood' });
      for (let row = 0; row < 3; row++) for (let b = 0; b < 6; b++) B(-1.2 + b * 0.48, 0.25 + row, 0.42, 0.35, 0.75, 0.06, FURN_COLORS[(b + row) % 6], { solid: false });
      break;
    case 'lamp':
      box(x, 0, z, 0.2, 2.6, 0.2, '#495057', { shape: 'cyl' });
      deco(x, 2.5, z, 1, 0.8, 1, '#fff3bf', { shape: 'cone', emissive: '#ffe066', emissiveIntensity: 0.8 });
      break;
    case 'plant':
      box(x, 0, z, 0.9, 0.8, 0.9, '#d9480f', { shape: 'cyl' });
      deco(x, 0.7, z, 1.6, 1.8, 1.6, '#40c057', { shape: 'sphere' });
      deco(x + 0.3, 1.6, z, 1, 1, 1, '#69db7c', { shape: 'sphere' });
      break;
    case 'rug': deco(x, 0, z, turn ? 2.2 : 3, 0.06, turn ? 3 : 2.2, col, { tex: 'carpet', noShadow: true }); break;
    case 'wardrobe': wardrobePart(x, z, turn ? 1.4 : 3, turn ? 3 : 1.4, '👗 Kleiderschrank'); break;
    case 'bath':
      B(0, 0, 0, 3.4, 1, 1.8, '#ffffff', { act: 'bath', rot });
      B(0, 0.95, 0, 3, 0.08, 1.4, '#74c0fc', { solid: false, emissive: '#a5d8ff', emissiveIntensity: 0.2 });
      break;
    case 'sink': B(0, 0, 0, 1.6, 1.4, 1, '#ffffff', { act: 'brush', title: '🪥 Zähne putzen' }); break;
    case 'fridge': B(0, 0, 0, 2, 3.2, 1.6, '#e3f2fd', { act: 'menu', title: '🧊 Kühlschrank', menu: ['apple', 'banana', 'juice', 'icecream', 'cookie'] }); break;
    case 'stove': B(0, 0, 0, 3.4, 1.2, 1.4, '#455a64', { act: 'menu', title: '🍳 Kochen', menu: ['pizza', 'burger', 'cake', 'croissant'] }); break;
    case 'toybox': B(0, 0, 0, 1.8, 1, 1.2, '#ef9a9a', { act: 'menu', title: '🧸 Spielzeugkiste', menu: ['ball', 'teddy', 'duck', 'balloon'] }); break;
    case 'piano':
      B(0, 0, 0, 3, 2.2, 1.2, '#212529');
      B(0, 1.1, 0.7, 2.8, 0.15, 0.4, '#ffffff', { solid: false });
      chair(x + s * 1.6, z + co * 1.6, rot + Math.PI, '#212529');
      break;
    case 'aquarium':
      B(0, 0, 0, 2.6, 1, 1.2, '#6d4c41', { tex: 'wood' });
      B(0, 1, 0, 2.6, 1.6, 1.2, '#74c0fc', { solid: false, opacity: 0.55, emissive: '#4dabf7', emissiveIntensity: 0.3 });
      for (const [dx, c] of [[-0.6, '#ff922b'], [0.5, '#ffd43b']]) B(dx, 1.7, 0, 0.4, 0.25, 0.15, c, { solid: false, shape: 'sphere' });
      break;
    case 'bunk':
      // Hochbett: unten Kuschelecke, oben das Bett, Leiter vorne
      B(0, 0, 0, 2.6, 0.3, 3.8, '#a1887f', { solid: false, tex: 'wood' });
      for (const [dx, dz] of [[-1.2, -1.8], [1.2, -1.8], [-1.2, 1.8], [1.2, 1.8]]) B(dx, 0, dz, 0.2, 2.6, 0.2, '#8d6e63');
      B(0, 2.4, 0, 2.6, 0.3, 3.8, '#a1887f', { tex: 'wood' });
      B(0, 2.7, 0, 2.5, 0.5, 3.6, col, { tex: 'dots', act: 'sleep', rot });
      B(0, 0.3, 0, 2.2, 0.5, 3.2, '#ffe066', { tex: 'carpet', act: 'sit', rot });
      break;
  }
}
