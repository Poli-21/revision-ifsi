// ui/sec_scene.js — Dessins de la section « Secourisme PSE1 » (App.SecScene)
// Scènes de rue parisienne vues de face (immeubles haussmanniens, quai de Seine, terrasse de café, station de métro, marché…),
// victimes et secouristes dessinés en pictogrammes. Tout est fictif et illustratif (aucun logo ni marque réels).
// Utilisé par core/secours.js : App.SecScene.svg({ bg, time, plaque, clock, victim, crew, people, props })
'use strict';
window.App = window.App || {};

App.SecScene = (() => {
  const W = 640, H = 360, GY = 236;                       // largeur, hauteur, ligne de sol (trottoir)
  let _uid = 0, defs = [], out = [];
  const add = s => out.push(s);
  const r1 = n => Math.round(n * 10) / 10;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const R = (x, y, w, h, f, rx = 0, ex = '') => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="${f}" ${ex}/>`;
  const C = (x, y, r, f, ex = '') => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${f}" ${ex}/>`;
  const E = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${f}" ${ex}/>`;
  const PG = (pts, f, ex = '') => `<polygon points="${pts.map(p => r1(p[0]) + ',' + r1(p[1])).join(' ')}" fill="${f}" ${ex}/>`;
  const PA = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const LN = (x1, y1, x2, y2, s, w = 2, ex = '') => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" ${ex}/>`;
  const TX = (x, y, t, sz, f, ex = '') => `<text x="${r1(x)}" y="${r1(y)}" font-size="${sz}" font-family="Inter,Arial,sans-serif" font-weight="800" text-anchor="middle" fill="${f}" ${ex}>${esc(t)}</text>`;
  function grad(c1, c2, vert = true) { const id = 'ss' + (++_uid); defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`); return `url(#${id})`; }

  const SKIN = ['#f6d3b8', '#ebb996', '#cf966b', '#a36b45', '#6f4629'];
  const SKY = { day: ['#bfe3f7', '#f3f9fc'], dusk: ['#f6b27a', '#fde8c8'], night: ['#1c2a47', '#3b4f78'] };

  // ── Personnages (origine = milieu des pieds, vers le haut = y négatif, hauteur ≈ 99) ─────────────────
  function mouth(emo, y) {
    if (emo === 'pain') return `<path d="M-4 ${y} Q0 ${y - 3} 4 ${y}" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    if (emo === 'alarm') return E(0, y, 2.6, 3.2, '#7a3b2e');
    if (emo === 'sleep') return `<line x1="-3" y1="${y}" x2="3" y2="${y}" stroke="#7a3b2e" stroke-width="1.6" stroke-linecap="round"/>`;
    return `<path d="M-4 ${y - 1} Q0 ${y + 3} 4 ${y - 1}" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  function head(p, back) {
    const s = p.skin || SKIN[1], hc = p.hair || '#3b2a22', st = p.hs || 'short', emo = p.emo || 'calm';
    let h = '';
    if (st === 'long' || st === 'bun') h += PA('M-12 -90 Q-14 -72 -9 -66 L9 -66 Q14 -72 12 -90Z', hc);
    h += C(0, -88, 11, s);
    if (back) h += PA('M-11.5 -88 A11.5 11.5 0 0 1 11.5 -88 Q11 -80 0 -76 Q-11 -80 -11.5 -88Z', hc) + C(0, -86, 11, hc);
    else {
      if (st === 'bald') h += '';
      else if (st === 'curly') h += [-8, -3, 3, 8].map((x, i) => C(x, -97 + (i % 2 ? 1 : 0), 5.4, hc)).join('') + PA('M-11 -90 Q0 -100 11 -90 L11 -93 Q0 -103 -11 -93Z', hc);
      else if (st === 'bun') h += PA('M-11.5 -89 Q-10 -100 0 -100 Q10 -100 11.5 -89 Q6 -94 0 -94 Q-6 -94 -11.5 -89Z', hc) + C(0, -102, 5, hc);
      else if (st === 'long') h += PA('M-11.5 -88 Q-11 -100 0 -100 Q11 -100 11.5 -88 Q8 -95 0 -95 Q-8 -95 -11.5 -88Z', hc);
      else h += PA('M-11.5 -89 Q-11 -100 0 -100 Q11 -100 11.5 -89 Q7 -95 0 -94 Q-7 -95 -11.5 -89Z', hc);
      if (emo === 'sleep') h += `<path d="M-6 -89 Q-4 -87 -2 -89 M2 -89 Q4 -87 6 -89" stroke="#3b2a22" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
      else h += C(-4, -89, emo === 'alarm' ? 2 : 1.5, '#2a1e1a') + C(4, -89, emo === 'alarm' ? 2 : 1.5, '#2a1e1a');
      h += mouth(emo, -82);
      if (p.acc && p.acc.includes('beard')) h += PA('M-9 -84 Q0 -69 9 -84 Q4 -78 0 -78 Q-4 -78 -9 -84Z', hc, 'opacity=".9"');
      if (p.acc && p.acc.includes('glasses')) h += `<circle cx="-4.5" cy="-89" r="3.6" fill="none" stroke="#3a3a3a" stroke-width="1.2"/><circle cx="4.5" cy="-89" r="3.6" fill="none" stroke="#3a3a3a" stroke-width="1.2"/><line x1="-1" y1="-89" x2="1" y2="-89" stroke="#3a3a3a" stroke-width="1.2"/>`;
      if (emo === 'pain' || emo === 'alarm') h += `<path d="M-8 -94 L-3 -93 M8 -94 L3 -93" stroke="#3b2a22" stroke-width="1.3" stroke-linecap="round"/>`;
      if (p.sweat) h += E(10, -96, 1.6, 2.4, '#8fd3f4') + E(-11, -92, 1.4, 2.2, '#8fd3f4');
    }
    if (p.acc && p.acc.includes('cap')) h += PA('M-12 -92 Q0 -108 12 -92Z', p.capCol || '#2b5b9c') + R(-4, -94, 18, 3.4, p.capCol || '#2b5b9c', 1.5);
    if (p.acc && p.acc.includes('helmet')) h += PA('M-13.5 -86 Q-13 -106 0 -106 Q13 -106 13.5 -86 L13.5 -80 L-13.5 -80Z', p.helmetCol || '#2e3944') + R(-10, -91, 20, 8, 'rgba(160,210,240,.85)', 3) + R(-13.5, -82, 27, 3, '#1f2830');
    if (p.acc && p.acc.includes('cycleHelmet')) h += PA('M-13 -90 Q-12 -107 0 -107 Q12 -107 13 -90 Q0 -94 -13 -90Z', p.helmetCol || '#ff6b3d');
    return h;
  }
  function upper(p, back, armsMode) {
    const top = p.top || '#4a7bd0', st = p.sleeve || top, acc = p.acc || [];
    let g = '';
    if (acc.includes('bag')) g += R(-19, -72, 38, 36, '#2f3b4a', 8, 'opacity=".95"') + R(-14, -68, 28, 8, '#f2a33a', 3);
    g += R(-14, -74, 28, 40, top, 8);
    if (acc.includes('vest')) g += R(-14, -74, 28, 40, p.vest || '#f08a24', 8) + R(-14, -56, 28, 4, '#fff6d8') + R(-14, -48, 28, 3, '#fff6d8') + R(-2, -74, 4, 40, 'rgba(255,255,255,.35)');
    if (acc.includes('apron')) g += R(-11, -62, 22, 28, '#f6f1e6', 4) + R(-2, -62, 4, 5, '#d9d2c3');
    if (acc.includes('scarf')) g += R(-9, -76, 18, 6, '#d94f4f', 3);
    if (p.neck !== false) g = R(-3, -78, 6, 7, p.skin || SKIN[1]) + g;
    if (armsMode === 'throat') {
      g += R(-20, -72, 7, 30, st, 3.5, 'transform="rotate(35 -16 -70)"') + R(13, -72, 7, 30, st, 3.5, 'transform="rotate(-35 16 -70)"');
      g += C(-7, -76, 4, p.skin || SKIN[1]) + C(7, -76, 4, p.skin || SKIN[1]);
    } else if (armsMode === 'chest') {
      g += R(-20, -72, 7, 28, st, 3.5, 'transform="rotate(20 -16 -70)"') + R(13, -72, 7, 28, st, 3.5, 'transform="rotate(-20 16 -70)"');
      g += C(-4, -52, 4, p.skin || SKIN[1]) + C(4, -52, 4, p.skin || SKIN[1]);
    } else {
      g += R(-20, -72, 7, 30, st, 3.5) + R(13, -72, 7, 30, st, 3.5) + C(-16.5, -40, 4, p.skin || SKIN[1]) + C(16.5, -40, 4, p.skin || SKIN[1]);
    }
    return g;
  }
  function lower(p, mode) {
    const bot = p.bottom || '#3a4a6b', sh = p.shoes || '#2a2a33';
    if (mode === 'skirt') return R(-15, -38, 30, 22, bot, 5) + R(-8, -18, 6, 16, p.skin || SKIN[1]) + R(2, -18, 6, 16, p.skin || SKIN[1]) + E(-5, -1, 6, 3, sh) + E(5, -1, 6, 3, sh);
    return R(-12, -40, 12, 40, bot, 3) + R(0, -40, 12, 40, bot, 3) + E(-6, -1, 7, 3.2, sh) + E(6, -1, 7, 3.2, sh);
  }
  // pose : stand | grab | chest | sit | chair | tripod | lie | side | prone | kneel
  function person(p, x, y, s = 1, flip = false) {
    const pose = p.pose || 'stand', back = !!p.back;
    let g = '';
    const skirt = p.skirt ? 'skirt' : null;
    if (pose === 'stand' || pose === 'grab' || pose === 'chest') {
      g += E(0, 1, 20, 4, 'rgba(0,0,0,.18)') + lower(p, skirt) + upper(p, back, pose === 'stand' ? null : pose === 'grab' ? 'throat' : 'chest') + head(p, back);
    } else if (pose === 'sit') {                                       // assis par terre, jambes devant
      g += E(18, 1, 34, 4, 'rgba(0,0,0,.18)');
      g += R(0, -11, 40, 11, p.bottom || '#3a4a6b', 4) + E(41, -5, 4, 6, p.shoes || '#2a2a33');
      g += `<g transform="translate(0 30)">${upper(p, back, null)}${head(p, back)}</g>`;
    } else if (pose === 'chair' || pose === 'tripod') {                // assis sur une chaise ou un banc
      g += E(0, 1, 26, 4, 'rgba(0,0,0,.18)');
      g += R(-16, -26, 46, 5, '#8a6a43', 2) + R(-14, -21, 4, 21, '#5c4630') + R(24, -21, 4, 21, '#5c4630') + R(-16, -58, 4, 33, '#8a6a43', 2);
      g += R(-9, -28, 38, 11, p.bottom || '#3a4a6b', 4) + R(18, -28, 11, 28, p.bottom || '#3a4a6b', 3) + E(26, -1, 8, 3.2, p.shoes || '#2a2a33');
      const rot = pose === 'tripod' ? 'rotate(20 0 -28)' : '';
      g += `<g transform="translate(-4 36) ${rot}">${upper(p, back, null)}${head(p, back)}</g>`;
      if (pose === 'tripod') g += C(26, -33, 4, p.skin || SKIN[1]);
    } else if (pose === 'kneel' || pose === 'cpr') {                   // secouriste à genoux
      g += E(0, 1, 28, 4, 'rgba(0,0,0,.18)');
      g += R(-26, -9, 28, 9, p.bottom || '#1d2f55', 4) + R(-6, -26, 13, 26, p.bottom || '#1d2f55', 3) + E(-28, -4, 4, 6, p.shoes || '#14202f') + E(8, -1, 7, 3.2, p.shoes || '#14202f');
      g += `<g transform="translate(2 12) rotate(${pose === 'cpr' ? 12 : 4} 0 -34)">${upper(p, back, null)}${head(p, back)}</g>`;
      if (pose === 'cpr') g += `<line x1="8" y1="-46" x2="${p.tx != null ? p.tx : 30}" y2="${p.ty != null ? p.ty : -26}" stroke="${p.sleeve || p.top || '#f08a24'}" stroke-width="7" stroke-linecap="round"/>` + C(p.tx != null ? p.tx : 30, p.ty != null ? p.ty : -26, 4.5, p.skin || SKIN[1]);
    } else {                                                           // allongé : on tourne la silhouette debout de 90°
      const prone = pose === 'prone';
      let body = lower(p, skirt) + upper(p, prone || back, null) + head(p, prone || back);
      if (pose === 'side') {
        body = R(-12, -40, 12, 40, p.bottom || '#3a4a6b', 3) + E(-6, -1, 7, 3.2, p.shoes || '#2a2a33') +
          `<g transform="translate(4 -40) rotate(-62)">${R(-6, 0, 12, 38, p.bottom || '#3a4a6b', 3)}</g>` + E(34, -48, 6, 3.2, p.shoes || '#2a2a33', 'transform="rotate(-25 34 -48)"') +
          upper(p, false, null) + head(p, false);
      }
      g += `<g transform="translate(50 -13) rotate(-90)">${body}</g>`;
      g = E(0, 1, 62, 4.5, 'rgba(0,0,0,.18)') + g;
    }
    const t = `translate(${r1(x)} ${r1(y)}) scale(${flip ? -s : s} ${s})`;
    let lab = '';
    if (p.label) lab = `<g transform="translate(${r1(x)} ${r1(y - (pose === 'lie' || pose === 'side' || pose === 'prone' ? 40 : 120) * s)})">${R(-(p.label.length * 3.6 + 8), -10, p.label.length * 7.2 + 16, 16, p.labCol || '#1d2f55', 8, 'opacity=".92"')}${TX(0, 1.5, p.label, 9.5, '#fff')}</g>`;
    return `<g transform="${t}">${g}</g>${lab}`;
  }

  // ── Décors ─────────────────────────────────────────────────────────────────────────────────────────
  function sky(time) { const [a, b] = SKY[time] || SKY.day; add(R(0, 0, W, H, grad(a, b))); if (time === 'night') [[80, 30], [200, 60], [340, 22], [470, 48], [580, 28]].forEach(([x, y]) => add(C(x, y, 1.4, '#fff7d6'))); if (time === 'day') add(E(540, 40, 28, 12, 'rgba(255,255,255,.7)') + E(560, 46, 22, 9, 'rgba(255,255,255,.7)') + E(120, 56, 24, 9, 'rgba(255,255,255,.6)')); }
  // façade haussmannienne : x0..x1, base y, nombre d'étages
  function haussmann(x0, x1, yb, floors, o = {}) {
    const w = x1 - x0, fh = o.fh || 42, h = floors * fh, stone = o.stone || '#eee0c3', stone2 = o.stone2 || '#e0cfa8', roof = o.roof || '#7f8da0';
    add(R(x0, yb - h, w, h, grad(stone, stone2)));
    add(PG([[x0 - 4, yb - h], [x1 + 4, yb - h], [x1 - 8, yb - h - 26], [x0 + 8, yb - h - 26]], grad('#8f9db0', roof)));
    for (let d = x0 + 24; d < x1 - 20; d += 60) add(R(d, yb - h - 26 + 6, 16, 20, stone) + PG([[d - 2, yb - h - 20], [d + 8, yb - h - 32], [d + 18, yb - h - 20]], roof));
    for (let f = 0; f < floors; f++) {
      const y = yb - h + f * fh;
      if (f > 0 || o.bare) add(R(x0, y, w, 2, 'rgba(120,95,60,.25)'));
      if (o.skipGround && f === floors - 1) continue;
      for (let x = x0 + 14; x < x1 - 24; x += 38) {
        add(R(x, y + 8, 18, fh - 14, '#6f8ca8', 2) + R(x + 2, y + 10, 14, fh - 18, o.lit ? '#ffe9a8' : '#a9c6dd', 1.5) + LN(x + 9, y + 10, x + 9, y + fh - 8, '#fbf4e2', 1.2));
        if (f === 1 || f === 3) add(R(x - 3, y + fh - 8, 24, 3, '#3a3f4a', 1) + R(x - 3, y + fh - 14, 24, 1.2, '#3a3f4a'));
      }
    }
  }
  function plane(x, yb, s = 1, lvl = 1) {
    add(R(x - 3 * s, yb - 70 * s, 6 * s, 70 * s, '#8b7762'));
    add(C(x, yb - 84 * s, 34 * s, '#6aa66f') + C(x - 22 * s, yb - 70 * s, 22 * s, '#5b9a63') + C(x + 22 * s, yb - 72 * s, 22 * s, '#78b57c'));
  }
  function lamp(x, yb, c = '#2f6b52') { add(R(x - 2, yb - 86, 4, 86, c) + R(x - 7, yb - 4, 14, 4, c, 1) + LN(x, yb - 84, x + 12, yb - 92, c, 3) + C(x + 14, yb - 92, 5, '#fff3c2', 'stroke="' + c + '" stroke-width="2"')); }
  function plaque(txt) {
    if (!txt) return;
    const w = Math.max(96, txt.length * 8.2 + 22);
    add(`<g transform="translate(12 12)">${R(0, 0, w, 26, '#1f4e9c', 4, 'stroke="#f4f7ff" stroke-width="2.2"')}${R(3, 3, w - 6, 20, 'none', 2.5, 'stroke="#f4f7ff" stroke-width="1"')}${TX(w / 2, 18, txt.toUpperCase(), 11, '#fff')}</g>`);
  }
  function ground(kind) {
    if (kind === 'carrefour') {
      add(R(0, GY, W, 30, '#c9c2b8') + R(0, GY + 30, W, 94, grad('#6d7480', '#555c68')));
      add(R(0, GY + 27, W, 4, '#9a9388'));
      for (let x = 60; x < 600; x += 46) add(R(x, GY + 44, 30, 52, '#f2f2ee', 3, 'opacity=".92"'));
      add(R(0, GY + 110, W, 3, '#f2d24b', 0, 'opacity=".7"'));
    } else if (kind === 'quai') {
      add(R(0, GY, W, 124, grad('#d3cbbd', '#bdb4a3')));
      for (let y = GY + 10; y < H; y += 16) add(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(120,100,70,.16)" stroke-width="1"/>`);
      for (let x = 20; x < W; x += 44) add(`<line x1="${x}" y1="${GY}" x2="${x - 10}" y2="${H}" stroke="rgba(120,100,70,.10)" stroke-width="1"/>`);
    } else if (kind === 'parc') {
      add(R(0, GY - 10, W, 134, grad('#7fbf7a', '#5aa35c')));
      add(PG([[250, GY - 10], [390, GY - 10], [520, H], [120, H]], '#d9c9a4'));
    } else {
      add(R(0, GY, W, 124, grad('#d6d0c6', '#bfb8ab')));
      for (let y = GY + 14; y < H; y += 20) add(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(110,95,70,.14)" stroke-width="1"/>`);
      add(R(0, GY, W, 4, '#aaa396'));
    }
  }
  const BG = {
    quai() {
      add(R(0, 120, W, 40, '#cdb98f') + R(0, 100, W, 22, '#9fb1c2'));                      // rive opposée
      haussmann(30, 210, 124, 3, { fh: 40 }); haussmann(214, 400, 124, 4, { fh: 38, stone: '#f1e6cf' }); haussmann(404, 610, 124, 3, { fh: 40, stone: '#e9dbbd' });
      add(R(0, 124, W, 8, '#a99d86'));                                                    // quai d'en face
      add(R(0, 132, W, 78, grad('#7ea6c6', '#5f8cb0')));                                  // Seine
      for (let x = 20; x < W; x += 74) add(`<path d="M${x} 150 q10 -4 20 0 t20 0" stroke="rgba(255,255,255,.4)" stroke-width="1.6" fill="none"/>`);
      add(R(0, 138, 230, 12, '#cfc7b6') + [0, 1, 2].map(i => PA(`M${14 + i * 74} 150 q23 -22 46 0Z`, '#5f8cb0')).join(''));   // pont
      plane(46, 214, 1); plane(580, 214, 1);
      add(R(0, 206, W, 8, '#b8ad98') + R(0, 212, W, 24, '#a89c87'));                     // parapet
      for (let i = 0; i < 4; i++) add(R(24 + i * 62, 198, 46, 12, '#2f6b52', 1.5) + R(24 + i * 62, 196, 46, 3, '#244f3d'));   // boîtes de bouquinistes
      add(R(0, 232, W, 4, '#9d917c'));
    },
    terrasse() {
      haussmann(0, W, 236, 4, { fh: 40, skipGround: true, stone: '#efe3c6' });
      add(R(0, 180, W, 56, '#2a3f5a') + R(10, 186, 150, 44, '#d4ecf7', 2) + R(480, 186, 150, 44, '#d4ecf7', 2) + R(190, 190, 90, 46, '#7a5a3a', 2));
      add(R(0, 168, W, 14, '#c0392b') + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => R(i * 54, 168, 27, 14, '#fff6ea')).join('') + PA('M0 182 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0 q13 10 27 0Z', '#c0392b'));
      add(R(200, 154, 120, 22, '#16222f', 3) + TX(260, 171, 'CAFÉ DU COIN', 13, '#f3d27a'));
      [[60, 40], [110, 15]].forEach(([x]) => add(E(x + 20, 252, 28, 6, 'rgba(0,0,0,.12)')));
      [90, 540].forEach(x => add(`<g transform="translate(${x} 236)">${E(0, 10, 30, 6, 'rgba(0,0,0,.12)')}${R(-2, -32, 4, 38, '#444')}${E(0, -34, 28, 8, '#f2ece0', 'stroke="#c9c0ae" stroke-width="2"')}${R(-14, 6, 28, 3, '#444')}</g>`));
      [[40, 262], [140, 262], [500, 262], [600, 262]].forEach(([x, y]) => add(`<g transform="translate(${x} ${y})">${R(-9, -22, 18, 3.4, '#a3622d', 1.5)}${R(-9, -22, 3, 22, '#7b4a22')}${R(6, -22, 3, 22, '#7b4a22')}${R(-8, -42, 16, 20, 'none', 2, 'stroke="#a3622d" stroke-width="2.6"')}</g>`));
    },
    carrefour() {
      haussmann(0, 300, 236, 5, { fh: 36 }); haussmann(304, W, 236, 4, { fh: 38, stone: '#f2e8d0' });
      add(R(286, 100, 5, 136, '#46505e') + R(280, 100, 17, 38, '#2b3340', 3) + C(288.5, 109, 4.6, '#e24b3a') + C(288.5, 120, 4.6, '#6b5a2c') + C(288.5, 131, 4.6, '#3a6b3a'));
      lamp(60, 240, '#2e5e4a'); lamp(580, 240, '#2e5e4a');
    },
    rue() {
      haussmann(0, W, 236, 4, { fh: 40, skipGround: true });
      add(R(0, 182, W, 54, '#33404f'));
      [[14, 130, 'MODE', '#c0617a'], [166, 120, 'FLEURISTE', '#3f8f5a'], [300, 190, 'BOUTIQUE', '#c98a2e'], [498, 130, 'LIBRAIRIE', '#4a6fb5']].forEach(([x, w, t, c]) => {
        add(R(x, 166, w, 16, c, 2) + TX(x + w / 2, 178, t, 9.5, '#fff') + R(x + 6, 188, w - 12, 44, '#d6edf7', 2));
      });
      add(PG([[322, 188], [342, 206], [334, 214], [352, 232], [322, 232], [338, 210], [316, 196]], 'rgba(255,255,255,.7)') + LN(322, 188, 372, 232, '#9fb8c6', 1.5) + LN(372, 188, 322, 232, '#9fb8c6', 1.5) + LN(347, 188, 347, 232, '#9fb8c6', 1.2));
      lamp(30, 244, '#2e5e4a');
    },
    metro() {
      haussmann(0, W, 236, 4, { fh: 40, stone: '#ecdfc2' });
      add(R(220, 150, 200, 86, '#17202c'));                                                              // escalier vers la station
      for (let i = 0; i < 6; i++) add(R(232 + i * 3, 160 + i * 12, 176 - i * 6, 8, '#343f4e'));
      add(R(205, 130, 8, 112, '#2f6b52') + R(427, 130, 8, 112, '#2f6b52') + PA('M205 130 Q320 70 435 130 L435 138 Q320 82 205 138Z', '#2f6b52'));
      add(R(262, 96, 116, 24, '#f6f1d6', 4, 'stroke="#2f6b52" stroke-width="3"') + TX(320, 114, 'MÉTRO', 15, '#2f6b52'));
      add(R(205, 190, 8, 6, '#3f8a69') + [0, 1, 2, 3, 4, 5].map(i => LN(213, 196 + i * 8, 232, 196 + i * 8, '#2f6b52', 1.4)).join(''));
      lamp(180, 240, '#2e5e4a'); lamp(455, 240, '#2e5e4a');
    },
    marche() {
      haussmann(0, W, 190, 3, { fh: 38, bare: true, skipGround: false });
      const cols = [['#d9473a', '#fff7ee'], ['#2f8a57', '#fff7ee'], ['#d9a31f', '#fff7ee'], ['#3b6fc4', '#fff7ee']];
      [0, 1, 2, 3].forEach(i => {
        const x = 8 + i * 158, [c1, c2] = cols[i];
        add(R(x, 150, 142, 82, '#e7dcc3', 3));
        for (let k = 0; k < 8; k++) add(R(x + k * 17.8, 150, 8.9, 24, k % 2 ? c2 : c1));
        add(R(x, 174, 142, 6, c1) + R(x + 6, 196, 130, 30, '#8a6a43', 3));
        [['#e0513f'], ['#f0a134'], ['#74b85a'], ['#d9d04a'], ['#e0513f'], ['#74b85a'], ['#f0a134']].forEach(([f], j) => add(C(x + 20 + j * 17, 192, 7.5, f)));
      });
    },
    parc() {
      add(R(0, 150, W, 90, '#6bb26f'));
      add(R(30, 90, 190, 60, '#e4d3ad') + R(30, 76, 190, 14, '#b9554a') + [0, 1, 2, 3, 4, 5].map(i => R(46 + i * 29, 100, 14, 34, '#9bbad0', 1.5)).join('') + R(110, 126, 26, 24, '#8a6a43', 2));
      plane(300, 200, 1.2); plane(440, 190, 1.05); plane(580, 200, 1.2);
      add(R(0, 200, W, 4, '#5e8d5e') + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => R(i * 44 + 4, 190, 3, 20, '#3d4a50')).join('') + R(0, 196, W, 3, '#3d4a50'));
      add(`<g transform="translate(520 262)">${R(-34, -26, 68, 5, '#9a6b3a', 2)}${R(-34, -44, 68, 4, '#9a6b3a', 2)}${R(-30, -26, 4, 26, '#3d3d3d')}${R(26, -26, 4, 26, '#3d3d3d')}</g>`);
      lamp(100, 244, '#2e5e4a');
    },
    place() {
      haussmann(0, 260, 214, 4, { fh: 38 }); haussmann(270, 400, 214, 5, { fh: 36, stone: '#f2e8d0' }); haussmann(410, W, 214, 4, { fh: 38 });
      plane(60, 232, 1.05); plane(590, 232, 1.05);
      add(R(0, 214, W, 24, '#d4cdbf'));
      add(`<g transform="translate(120 244)">${E(0, 2, 30, 6, 'rgba(0,0,0,.14)')}${R(-22, -4, 44, 4, '#2c6a4f')}${R(-14, -40, 28, 36, '#2f7c5c', 4)}${PA('M-22 -40 Q0 -78 22 -40Z', '#2c6a4f')}${C(0, -76, 3.5, '#2c6a4f')}${[-7, 0, 7].map(x => R(x - 1.5, -34, 3, 20, '#c8e8d8')).join('')}</g>`);
      add(`<g transform="translate(510 258)">${R(-34, -26, 68, 5, '#9a6b3a', 2)}${R(-34, -44, 68, 4, '#9a6b3a', 2)}${R(-30, -26, 4, 26, '#3d3d3d')}${R(26, -26, 4, 26, '#3d3d3d')}</g>`);
    },
    foodtruck() {
      haussmann(0, W, 214, 4, { fh: 38 });
      plane(40, 236, 1); plane(600, 236, 1);
      add(R(0, 214, W, 24, '#d4cdbf'));
      add(`<g transform="translate(300 252)">${E(0, 6, 150, 8, 'rgba(0,0,0,.18)')}${R(-150, -96, 230, 88, '#f4e9d0', 8)}${R(80, -76, 60, 68, '#e7bf6b', 8)}${R(92, -66, 36, 28, '#bfe1f2', 4)}${R(-136, -76, 130, 46, '#1d2f2c', 4)}${R(-146, -90, 150, 14, '#c0392b', 3)}${R(-120, -40, 100, 6, '#cfc4a8', 2)}${C(-100, 6, 15, '#2c2c2c')}${C(-100, 6, 7, '#aaa')}${C(100, 6, 15, '#2c2c2c')}${C(100, 6, 7, '#aaa')}${TX(-72, -97, 'CRÊPES & GALETTES', 8.5, '#fff')}${R(-60, -66, 70, 18, '#3a3f45', 3)}${C(-30, -57, 6, '#e0e0e0')}${E(-30, -57, 14, 3, '#c8c8c8')}</g>`);
    }
  };
  function bg(kind, o) {
    sky(o.time);
    (BG[kind] || BG.place)();
    ground(kind === 'carrefour' ? 'carrefour' : kind === 'quai' ? 'quai' : kind === 'parc' ? 'parc' : 'plain');
    plaque(o.plaque);
  }

  // ── Accessoires / indices ────────────────────────────────────────────────────────────────────────
  function anchors(v, vx, vy, s) {
    const pose = v.pose || 'lie';
    if (pose === 'lie' || pose === 'prone' || pose === 'side') {
      const ox = vx + 50 * s, oy = vy - 13 * s;
      return { head: [ox - 88 * s, oy], chest: [ox - 52 * s, oy], neck: [ox - 76 * s, oy], armN: [ox - 52 * s, oy + 16 * s], armF: [ox - 52 * s, oy - 16 * s], hand: [ox - 40 * s, oy + 16 * s], legs: [ox - 16 * s, oy] };
    }
    if (pose === 'chair' || pose === 'tripod' || pose === 'sit') {
      const up = pose === 'sit' ? 30 : 36;
      return { head: [vx - 4 * s, vy - (88 - up) * s], chest: [vx - 4 * s, vy - (52 - up) * s], neck: [vx - 4 * s, vy - (76 - up) * s], armN: [vx - 20 * s, vy - (50 - up) * s], armF: [vx + 14 * s, vy - (50 - up) * s], hand: [vx - 20 * s, vy - (40 - up) * s], legs: [vx + 20 * s, vy - 20 * s] };
    }
    return { head: [vx, vy - 88 * s], chest: [vx, vy - 54 * s], neck: [vx, vy - 76 * s], armN: [vx - 17 * s, vy - 55 * s], armF: [vx + 17 * s, vy - 55 * s], hand: [vx - 17 * s, vy - 40 * s], legs: [vx, vy - 20 * s] };
  }
  function propsDraw(P, A, vx, vy, v) {
    let g = '';
    const on = k => P && P[k];
    if (on('blanket')) g += `<g opacity=".92">${R(A.chest[0] - 40, A.chest[1] - 24, 84, 40, grad('#f4d56a', '#d9b43a'), 8)}${LN(A.chest[0] - 30, A.chest[1] - 12, A.chest[0] + 30, A.chest[1] + 4, 'rgba(255,255,255,.55)', 3)}${LN(A.chest[0] - 24, A.chest[1] + 2, A.chest[0] + 30, A.chest[1] - 12, 'rgba(255,255,255,.4)', 2)}</g>`;
    if (on('blood')) { const q = A[P.blood === 'head' ? 'head' : 'armN']; g += E(q[0] + 4, q[1] + 12, 17, 6, '#a3111d', 'opacity=".9"') + E(q[0] + 2, q[1] + 8, 8, 3, '#d02a35'); }
    if (on('wound')) g += E(A.armN[0] + 6, A.armN[1] + 3, 7, 3.2, '#c1121f') + `<path d="M${r1(A.armN[0] - 2)} ${r1(A.armN[1] + 4)} q3 -6 8 0" stroke="#7a0a12" stroke-width="1.4" fill="none"/>`;
    if (on('bandage')) g += R(A.armN[0] - 2, A.armN[1] - 6, 18, 12, '#f8f3e8', 3, 'stroke="#d9d1bf" stroke-width="1.4"') + R(A.armN[0] + 4, A.armN[1] - 6, 5, 12, '#d94a4a', 1, 'opacity=".65"');
    if (on('garrot')) g += R(A.armN[0] - 12, A.armN[1] - 6.5, 9, 13, '#222a33', 2) + R(A.armN[0] - 12, A.armN[1] - 1.5, 9, 3, '#e8452c') + TX(A.armN[0] - 8, A.armN[1] + 22, P.garrotTime ? P.garrotTime : '', 8, '#222a33');
    if (on('collier')) g += R(A.neck[0] - 7, A.neck[1] - 9, 14, 18, '#f1f4f7', 5, 'stroke="#9eb2c4" stroke-width="1.6" transform="rotate(0)"') + R(A.neck[0] - 3, A.neck[1] - 4, 6, 8, '#2f7ab9', 1.5);
    if (on('helmetOn')) g += `<g transform="translate(${r1(A.head[0])} ${r1(A.head[1])}) rotate(${(v.pose === 'lie' || v.pose === 'prone' || v.pose === 'side') ? -90 : 0})">${PA('M-14 8 Q-15 -17 0 -17 Q15 -17 14 8 L14 14 L-14 14Z', '#2e3944')}${R(-10, -5, 20, 10, 'rgba(160,210,240,.85)', 3)}</g>`;
    if (on('helmetOff')) g += `<g transform="translate(${vx + 120} ${vy - 8})">${E(0, 6, 16, 4, 'rgba(0,0,0,.2)')}${PA('M-14 4 Q-15 -17 0 -17 Q15 -17 14 4 L14 8 L-14 8Z', '#2e3944')}${R(-10, -5, 20, 9, 'rgba(160,210,240,.85)', 3)}</g>`;
    if (on('pads')) g += `<g>${R(A.chest[0] - 16, A.chest[1] - 12, 12, 16, '#fafafa', 2, 'stroke="#2e9d63" stroke-width="1.6"')}${R(A.chest[0] + 8, A.chest[1] + 6, 12, 16, '#fafafa', 2, 'stroke="#2e9d63" stroke-width="1.6"')}<path d="M${r1(A.chest[0] - 10)} ${r1(A.chest[1] + 4)} Q${r1(A.chest[0] + 20)} ${r1(A.chest[1] + 44)} ${r1(vx + 76)} ${r1(vy - 12)}" stroke="#2e9d63" stroke-width="2" fill="none"/></g>`;
    if (on('dae')) g += `<g transform="translate(${vx + 74} ${vy - 18})">${E(0, 20, 22, 4, 'rgba(0,0,0,.18)')}${R(-20, -2, 40, 22, '#2e9d63', 4)}${R(-6, -8, 12, 7, '#2e9d63', 2)}${PA('M0 16 C-9 10 -9 4 -4 4 C-2 4 0 6 0 7 C0 6 2 4 4 4 C9 4 9 10 0 16Z', '#fff')}${on('daeOn') ? C(14, 4, 2.4, '#f6e35a') : ''}</g>`;
    if (on('o2')) g += `<g transform="translate(${vx - 100} ${vy - 6})">${E(0, 4, 14, 3.4, 'rgba(0,0,0,.18)')}${R(-8, -52, 16, 54, '#2f6fc4', 7)}${R(-4, -60, 8, 10, '#aab4bd', 2)}${R(-8, -34, 16, 6, '#fff')}</g>${on('mask') ? `<path d="M${r1(vx - 100)} ${r1(vy - 54)} Q${r1(vx - 80)} ${r1(vy - 80)} ${r1(A.head[0] + 4)} ${r1(A.head[1] - 6)}" stroke="#6fbfe8" stroke-width="2.4" fill="none"/>${E(A.head[0] + 2, A.head[1] + 2, 10, 7, 'rgba(120,200,235,.85)')}` : ''}`;
    if (on('bavu')) g += `<g transform="translate(${A.head[0] - 12} ${A.head[1] - 6})">${E(-14, 0, 14, 9, '#4a4f58')}${E(4, 0, 8, 6, 'rgba(160,215,240,.9)')}</g>`;
    if (on('sugar')) g += `<g transform="translate(${vx + 62} ${vy - 4})">${[0, 1, 2, 3].map(i => R(i * 9 - 4, -9 - (i % 2) * 7, 8, 8, '#fdfdfb', 1, 'stroke="#c8c8c0" stroke-width="1"')).join('')}</g>`;
    if (on('inhaler')) g += `<g transform="translate(${A.hand[0] - 2} ${A.hand[1] - 10})">${R(-4, -4, 8, 13, '#2d6bb5', 2)}${R(-4, 7, 14, 6, '#d7dde3', 2)}</g>`;
    if (on('cones')) [[-150, 14], [150, 14], [-40, 36], [210, 30]].forEach(([dx, dy]) => { g += `<g transform="translate(${vx + dx} ${vy + dy})">${E(0, 2, 11, 3, 'rgba(0,0,0,.2)')}${PG([[-8, 0], [8, 0], [0, -24]], '#f26a21')}${R(-3, -14, 6, 3, '#fff')}${R(-9, -1, 18, 3, '#d9531a', 1)}</g>`; });
    if (on('tape')) g += `<path d="M${vx - 150} ${vy - 8} L${vx + 210} ${vy + 16}" stroke="#f2d24b" stroke-width="3" stroke-dasharray="8 4" fill="none"/>`;
    if (on('water')) g += `<g transform="translate(${A.armN[0] + 4} ${A.armN[1] - 52})">${R(-3, 0, 6, 10, '#7a8591', 1)}${[0, 1, 2, 3].map(i => `<path d="M${-2 + i} ${10 + i * 8} q-1 5 0 8" stroke="#8fd3f4" stroke-width="1.8" fill="none" stroke-linecap="round"/>`).join('')}${E(2, 50, 11, 4, 'rgba(143,211,244,.6)')}</g>`;
    if (on('shards')) g += [[-90, 20], [-60, 30], [-140, 12], [170, 20]].map(([dx, dy], i) => PG([[vx + dx, vy + dy], [vx + dx + 8, vy + dy - 4], [vx + dx + 5, vy + dy + 3]], 'rgba(200,235,250,.85)', 'stroke="#8fb5c9" stroke-width="1"')).join('');
    if (on('scooter')) g += `<g transform="translate(${vx - 210} ${vy - 4}) rotate(-8)">${E(0, 6, 40, 5, 'rgba(0,0,0,.2)')}${C(-26, -6, 12, '#2a2a30')}${C(-26, -6, 5, '#8a8f99')}${C(28, -6, 12, '#2a2a30')}${C(28, -6, 5, '#8a8f99')}${R(-30, -28, 64, 12, '#e24b3a', 5)}${R(-8, -38, 26, 12, '#f2f2f2', 4)}${LN(26, -22, 38, -48, '#444', 3)}${LN(32, -48, 44, -48, '#444', 3)}</g>`;
    if (on('bike')) g += `<g transform="translate(${vx - 170} ${vy - 4}) rotate(-6)">${E(0, 6, 44, 4, 'rgba(0,0,0,.2)')}${C(-30, -10, 15, 'none', 'stroke="#2a2a30" stroke-width="4"')}${C(30, -10, 15, 'none', 'stroke="#2a2a30" stroke-width="4"')}${LN(-30, -10, -4, -28, '#1f6f4a', 3)}${LN(-4, -28, 30, -10, '#1f6f4a', 3)}${LN(-4, -28, 18, -30, '#1f6f4a', 3)}${LN(18, -30, 22, -42, '#444', 3)}${R(-16, -50, 30, 26, '#f2a33a', 4)}</g>`;
    if (on('phone')) g += `<g transform="translate(${vx - 62} ${vy - 84})">${R(0, 0, 8, 14, '#222', 2)}${R(1, 1, 6, 10, '#7fd1f0', 1)}</g>`;
    if (on('food')) g += `<g transform="translate(${vx + 110} ${vy - 20})">${E(0, 8, 22, 4, 'rgba(0,0,0,.15)')}${R(-20, -10, 40, 4, '#f1ece0', 1)}${R(-18, -18, 36, 8, '#c8914a', 4)}${R(-16, -23, 32, 6, '#e0b06a', 3)}</g>`;
    if (on('sweat')) { /* déjà dessiné sur le visage */ }
    if (on('arrow') && P.arrow) g += `<g>${PG([[vx + 140, vy - 60], [vx + 160, vy - 60], [vx + 160, vy - 70], [vx + 178, vy - 52], [vx + 160, vy - 34], [vx + 160, vy - 44], [vx + 140, vy - 44]], '#e24b3a', 'opacity=".85"')}</g>`;
    return g;
  }
  // foule / témoins
  function crowd(n, vx, vy, seed) {
    const pals = [['#d98a8a', '#3b4a6b', 1], ['#7fb069', '#4a4a55', 2], ['#e0b84a', '#2a3a55', 0], ['#6f9fd8', '#5a4a3a', 3], ['#b583d9', '#2f3b4a', 1], ['#d9d9d9', '#3a3a3a', 4]];
    const xs = [-250, -205, 235, 285, 165, -155];
    for (let i = 0; i < n && i < xs.length; i++) {
      const [top, bot, sk] = pals[(i + seed) % pals.length];
      add(person({ top, bottom: bot, skin: SKIN[sk], hair: ['#2b2018', '#6b4a2b', '#c9a35a', '#d9d9d9'][(i + seed) % 4], hs: ['short', 'long', 'bun', 'curly'][(i + seed) % 4], emo: 'alarm', skirt: i % 3 === 1 }, vx + xs[i], vy - 6 - (i % 2) * 4, 0.72, i % 2 === 1));
    }
  }

  // ── API ────────────────────────────────────────────────────────────────────────────────────────────
  // opts : bg, time, plaque, clock, victim{...pose,skin,hair,hs,top,bottom,shoes,acc,emo,sweat,skirt,back,x,y,s}, crew{you,ca,eq : {pose,...}},
  //        witnesses (nombre de curieux), props{...}, label (aria)
  function svg(opts) {
    opts = opts || {}; defs = []; out = [];
    bg(opts.bg || 'place', { time: opts.time || 'day', plaque: opts.plaque });
    const v = Object.assign({ pose: 'lie', skin: SKIN[1] }, opts.victim || {});
    const vs = v.s || 1;
    const vx = v.x != null ? v.x : 330, vy = v.y != null ? v.y : 300;
    const A = anchors(v, vx, vy, vs);
    const P = opts.props || {};
    if (P.scooter) add(propsDraw({ scooter: true }, A, vx, vy, v));
    if (P.bike) add(propsDraw({ bike: true }, A, vx, vy, v));
    if (P.cones) add(propsDraw({ cones: true, tape: P.tape }, A, vx, vy, v));
    crowd(opts.witnesses || 0, vx, vy, (opts.seed || 0));
    // l'équipier au fond (debout), puis la victime, puis les secouristes de face
    const crew = opts.crew || {};
    const uni = { top: '#f08a24', sleeve: '#1d2f55', bottom: '#1d2f55', shoes: '#14202f', acc: ['vest'], vest: '#f08a24' };
    const slot = {
      you: { x: vx - 98, y: vy + 6, flip: false }, ca: { x: vx + 136, y: vy - 4, flip: true }, eq: { x: vx + 60, y: vy + 20, flip: true }
    };
    if (crew.ca) add(person(Object.assign({}, uni, { skin: SKIN[2], hair: '#222', hs: 'short', label: crew.ca.label || 'CA', labCol: '#a14b10' }, crew.ca), slot.ca.x, slot.ca.y, 0.96, slot.ca.flip));
    add(person(v, vx, vy, vs, !!v.flip));
    add(propsDraw(Object.assign({}, P, { scooter: false, bike: false, cones: false }), A, vx, vy, v));
    if (crew.eq) add(person(Object.assign({}, uni, { skin: SKIN[0], hair: '#7a4a24', hs: 'bun', skirt: false, label: crew.eq.label || 'Équipier', labCol: '#1d6f86' }, crew.eq), slot.eq.x, slot.eq.y, 1, slot.eq.flip));
    if (crew.you) add(person(Object.assign({}, uni, { skin: SKIN[1], hair: '#2b2018', hs: 'short', label: crew.you.label || 'Toi', labCol: '#2563eb', tx: A.chest[0] - slot.you.x, ty: A.chest[1] - slot.you.y - 8 }, crew.you), slot.you.x, slot.you.y, 1.02, slot.you.flip));
    if (opts.time === 'night') add(R(0, 0, W, H, 'rgba(12,22,52,.40)'));
    else if (opts.time === 'dusk') add(R(0, 0, W, H, 'rgba(255,150,60,.12)'));
    if (opts.clock) add(`<g transform="translate(${W - 74} 10)">${R(0, 0, 62, 24, 'rgba(18,28,44,.82)', 12)}${TX(31, 17, opts.clock, 12, '#fff')}</g>`);
    return `<svg class="sec-scene-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.label || 'Scène de secours dans une rue de Paris')}" preserveAspectRatio="xMidYMid slice"><defs>${defs.join('')}</defs>${out.join('')}</svg>`;
  }
  // planche de test (toutes les poses)
  function sheet() {
    defs = []; out = [];
    add(R(0, 0, W, H, '#eef2f6'));
    const base = { skin: SKIN[1], top: '#4a7bd0', bottom: '#3a4a6b' };
    ['stand', 'grab', 'chest', 'sit', 'chair', 'tripod'].forEach((p, i) => add(person(Object.assign({}, base, { pose: p, emo: p === 'grab' ? 'alarm' : 'pain', sweat: p === 'tripod' }), 60 + i * 100, 150, 0.9)));
    ['lie', 'side', 'prone'].forEach((p, i) => add(person(Object.assign({}, base, { pose: p, emo: 'sleep', hs: 'long', hair: '#7a4a24', skirt: i === 1 }), 90 + i * 200, 320, 0.9)));
    add(person({ top: '#f08a24', sleeve: '#1d2f55', bottom: '#1d2f55', acc: ['vest'], pose: 'kneel', skin: SKIN[3] }, 560, 330, 1));
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${defs.join('')}</defs>${out.join('')}</svg>`;
  }
  return { svg, sheet, SKIN, W, H };
})();
