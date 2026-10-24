// Eigene Häuser: freie Grundstücke («zu verkaufen») und die Häuser, die Spieler dort mit Sternen bauen.
// Jedes Haus hat einen eigenen Innenraum weit weg von der Stadt (wie die anderen Innenwelten).
import { createKit } from './kit.js';
import { HOUSE_LOTS, HOUSE_STYLES, HOUSE_WALLS, HOUSE_ROOFS } from './shared.js';

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

  return { parts, interior: houseInside(K, i, st.key, wall, name) };
}

// Innenraum: Wohnzimmer, Küche, Bett, Kleiderschrank, Zähneputzen. Grössere Häuser haben mehr.
function houseInside(K, i, style, wall, name) {
  const { box, deco, sofa, table, chair, bed, wardrobePart, stairs, slide } = K;
  const { x: ox, z: oz } = lotInterior(i);
  const [W, D, H] = LOOK[style].inside;
  const floor = style === 'castle' ? '#b0a090' : '#d7a86e';
  const spawn = K.shell(ox, oz, W, D, H, floor, style === 'castle' ? 'stone' : 'wood', wall, style === 'castle' ? 'stone' : 'dots', `${name} 🏡`);
  const back = oz - D / 2 + 1;
  // Wohnzimmer links
  sofa(ox - W / 4, oz + 1, Math.PI, '#4dabf7', style === 'cottage' ? 3 : 4);
  deco(ox - W / 4, 0, oz - 2, 3, 0.06, 2.2, '#ff8fab', { tex: 'carpet', noShadow: true });
  // Küche hinten rechts
  box(ox + W / 2 - 1.6, 0, back + 0.2, 2, 3.2, 1.6, '#e3f2fd', { act: 'menu', title: '🧊 Kühlschrank', menu: ['apple', 'banana', 'juice', 'icecream', 'cookie'] });
  box(ox + W / 2 - 4.6, 0, back, 3.4, 1.2, 1.4, '#455a64', { act: 'menu', title: '🍳 Kochen', menu: ['pizza', 'burger', 'cake', 'croissant'] });
  table(ox + W / 4, 0, oz - 1, 3, 2, '#ffffff');
  chair(ox + W / 4 - 2.3, oz - 1, Math.PI / 2, '#ffcc80'); chair(ox + W / 4 + 2.3, oz - 1, -Math.PI / 2, '#ffcc80');
  // Bett und Schrank hinten links, Lavabo rechts
  bed(ox - W / 2 + 3, 0, back + 2, 0, '#cc5de8');
  wardrobePart(ox - W / 2 + 7, back - 0.2, 3, 1.4, '👗 Kleiderschrank');
  box(ox + W / 2 - 0.9, 0, oz + D / 2 - 5, 1, 1.4, 1.6, '#ffffff', { act: 'brush', title: '🪥 Zähne putzen' });
  box(ox - W / 2 + 1.2, 0, oz + D / 2 - 4, 1.8, 1, 1.2, '#ef9a9a', { act: 'menu', title: '🧸 Spielzeugkiste', menu: ['ball', 'teddy', 'duck', 'balloon'] });

  if (style === 'villa' || style === 'castle') {
    // Galerie mit zweitem Bett, Treppe hinauf und Rutsche hinunter
    const up = 5;
    box(ox, up - 0.4, back + 3, W - 2, 0.4, 6, '#ffe0b2', { tex: 'carpet' });
    deco(ox, up, back + 6, W - 2, 1.1, 0.15, '#ffffff');
    stairs(ox + 2, back + 16, 'n', 2.4, 0, up, '#ffd43b', 'wood');
    bed(ox - 6, up, back + 3, Math.PI / 2, '#69db7c');
    slide(ox - W / 2 + 3, back + 6.2, 'z', 1, 9, up, 0.2, '#ff4081', 2.2);
  }
  if (style === 'castle') {
    // Thron und Schatzkiste
    const tx = ox - 5;
    box(tx, 0, back + 9, 3, 0.6, 2, '#e03131', { tex: 'carpet' });
    box(tx, 0.6, back + 8.6, 1.6, 1, 1.2, '#ffd43b', { act: 'sit', rot: 0 });
    deco(tx, 1.6, back + 8.1, 1.8, 2.4, 0.3, '#ffd43b');
    deco(tx, 0.06, back + 15, 2.4, 0.04, 10, '#e03131', { noShadow: true });
  }
  return { spawn };
}
