// ui/sim_scene.js — Simulation clinique : la chambre dessinée (vue isométrique, style « pâte à modeler »)
// Dessin vectoriel généré par code : léger, hors ligne, aucune image externe.
// App.SimScene.svg(opts) renvoie le <svg> complet. Les objets cliquables sont des <g data-hot="…">.
'use strict';
window.App = window.App || {};

App.SimScene = (() => {
  // ── Projection isométrique ──────────────────────────────────────────────
  const S = 52, K = 0.866, OX = 304, OY = 246;      // échelle, cos 30°, origine écran
  const W = 7.2, D = 6.4, H = 4.4;                  // salle : largeur (x), profondeur (y), hauteur (z)
  const VB = '0 0 640 640';
  const P = (x, y, z = 0) => [OX + (x - y) * K * S, OY + (x + y) * 0.5 * S - z * S];
  const r1 = n => Math.round(n * 10) / 10;
  const pts = a => a.map(p => P(p[0], p[1], p[2] || 0).map(r1).join(',')).join(' ');

  // Matrices pour dessiner à plat sur un plan (coordonnées du plan u, v ; v monte vers le haut)
  const mFloor = (h = 0) => `matrix(${K * S} ${0.5 * S} ${-K * S} ${0.5 * S} ${OX} ${OY - h * S})`;      // u=x, v=y
  const mWallA = (y = 0) => `matrix(${K * S} ${0.5 * S} 0 ${-S} ${OX - K * S * y} ${OY + 0.5 * S * y})`;   // plan y=cste : u=x, v=z
  const mWallB = (x = 0) => `matrix(${-K * S} ${0.5 * S} 0 ${-S} ${OX + K * S * x} ${OY + 0.5 * S * x})`;  // plan x=cste : u=y, v=z

  // ── Couleurs ────────────────────────────────────────────────────────────
  const _h = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const mix = (a, b, t) => { const A = _h(a), B = _h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lt = (c, t) => mix(c, '#ffffff', t);
  const dk = (c, t) => mix(c, '#3b2f45', t);

  const C = {
    wallA: '#cdeee8', wallB: '#b9e5dd', wain: '#a6dad0', trim: '#fbf2df', slab: '#dcc7a2',
    floorA: '#f3e8d6', floorB: '#e6d6bd',
    yellow: '#f3c95e', teal: '#58c6bb', cream: '#f6e8c8', mint: '#a3e2dc', white: '#fbf8f1',
    skin: '#f3c9aa', skinPale: '#efd2bd', blush: '#f49b8d', hair: '#e4e7ec', wood: '#e7c98f', metal: '#c3cfd6'
  };

  let defs, uid, out;
  let CLK = { h: 7, m: 40 };
  const grad = (c1, c2, horizontal) => {            // c1 en haut (ou à gauche), c2 en bas (ou à droite)
    const id = 'ss' + (uid++);
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
    return `url(#${id})`;
  };
  const rad = (c1, c2, cx = 0.35, cy = 0.3) => {
    const id = 'ss' + (uid++);
    defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.85"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`);
    return `url(#${id})`;
  };
  const add = s => { out.push(s); };

  // ── Primitives ──────────────────────────────────────────────────────────
  // Boîte aux arêtes arrondies : trois faces dégradées, contour « boudiné », arête éclairée
  function rbox(x, y, z, w, d, h, col, o) {
    o = o || {};
    const cT = o.top || lt(col, 0.32), cL = o.left || col, cR = o.right || dk(col, 0.2);
    const sw = o.rim == null ? 5 : o.rim;
    const face = (arr, fill, stroke) => `<polygon points="${pts(arr)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    let s = face([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], grad(lt(cR, 0.08), dk(cR, 0.1)), cR);
    s += face([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], grad(lt(cL, 0.12), dk(cL, 0.07)), cL);
    s += face([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], grad(lt(cT, 0.12), cT), cT);
    if (sw >= 3) s += `<polyline points="${pts([[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y, z + h]])}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    add(o.id ? `<g data-hot="${o.id}">${s}</g>` : s);
  }
  function shadow(x0, y0, x1, y1, a, b) {
    add(`<polygon points="${pts([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])}" fill="rgba(70,52,40,${a == null ? 0.2 : a})" filter="url(#ssb${b || 1})"/>`);
  }
  const ell = (cx, cy, rx, ry, fill, extra) => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra || ''}/>`;
  const hot = (id, label, x, y, z, r, pad) => { const p = P(x, y, z); return `<g class="sim-hot" data-hot="${id}" tabindex="0" role="button" aria-label="${label}"><circle class="sim-hot-ring" cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r}"/><circle class="sim-hot-hit" cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r + (pad == null ? 6 : pad)}"/></g>`; };

  // ── Pièces du décor ─────────────────────────────────────────────────────
  function floor() {
    add(`<polygon points="${pts([[0, 0, -T], [W, 0, -T], [W, D, -T], [0, D, -T]])}" fill="${C.slab}"/>`);
    // épaisseur du sol (diorama)
    add(`<polygon points="${pts([[0, D, 0], [W, D, 0], [W, D, -T], [0, D, -T]])}" fill="${grad('#e6d3b0', '#cdb68f')}" stroke="#dcc7a2" stroke-width="2" stroke-linejoin="round"/>`);
    add(`<polygon points="${pts([[W, D, 0], [W, 0, 0], [W, 0, -T], [W, D, -T]])}" fill="${grad('#d9c29b', '#bda57c')}" stroke="#d2bb94" stroke-width="2" stroke-linejoin="round"/>`);
    add(`<polygon points="${pts([[0, 0], [W, 0], [W, D], [0, D]])}" fill="${grad(C.floorA, C.floorB)}"/>`);
    let t = '';
    for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) if ((i + j) % 2 === 0) t += `<polygon points="${pts([[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]])}" fill="rgba(255,255,255,.22)"/>`;
    add(t);
    let l = '';
    for (let i = 1; i < W; i++) l += `<line x1="${P(i, 0)[0]}" y1="${P(i, 0)[1]}" x2="${P(i, D)[0]}" y2="${P(i, D)[1]}"/>`;
    for (let j = 1; j < D; j++) l += `<line x1="${P(0, j)[0]}" y1="${P(0, j)[1]}" x2="${P(W, j)[0]}" y2="${P(W, j)[1]}"/>`;
    add(`<g stroke="rgba(150,118,84,.2)" stroke-width="1.2">${l}</g>`);
    // flaque de soleil venant de la fenêtre
    add(`<polygon points="${pts([[4.6, 0.2], [6.9, 0.2], [7.0, 3.6], [4.2, 3.6]])}" fill="rgba(255,250,222,.6)" filter="url(#ssb3)"/>`);
  }
  function walls() {
    // Mur de gauche (plan x=0) : le mur du fond à gauche, avec la porte
    add(`<polygon points="${pts([[0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]])}" fill="${grad('#c6ebe4', '#b4e1d9')}"/>`);
    add(`<polygon points="${pts([[0, 0, 0], [0, D, 0], [0, D, 1.05], [0, 0, 1.05]])}" fill="${grad('#a9dcd2', '#9bd2c8')}"/>`);
    add(`<polyline points="${pts([[0, 0, 1.05], [0, D, 1.05]])}" fill="none" stroke="${C.trim}" stroke-width="4"/>`);
    add(`<polygon points="${pts([[-T, 0, H], [0, 0, H], [0, D, H], [-T, D, H]])}" fill="${C.trim}"/>`);
    add(`<polygon points="${pts([[-T, D, 0], [0, D, 0], [0, D, H], [-T, D, H]])}" fill="${grad('#f1e4c9', '#e0cfae')}"/>`);
    // Mur de droite (plan y=0) : fenêtre, horloge
    add(`<polygon points="${pts([[0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H]])}" fill="${grad('#d6f2ed', '#c4eae3')}"/>`);
    add(`<polygon points="${pts([[0, 0, 0], [W, 0, 0], [W, 0, 1.05], [0, 0, 1.05]])}" fill="${grad('#b4e2d9', '#a6d9cf')}"/>`);
    add(`<polyline points="${pts([[0, 0, 1.05], [W, 0, 1.05]])}" fill="none" stroke="${C.trim}" stroke-width="4"/>`);
    add(`<polygon points="${pts([[0, -T, H], [W, -T, H], [W, 0, H], [0, 0, H]])}" fill="${C.trim}"/>`);
    add(`<polygon points="${pts([[W, -T, 0], [W, 0, 0], [W, 0, H], [W, -T, H]])}" fill="${grad('#ecdcbc', '#d8c4a0')}"/>`);
    add(`<polygon points="${pts([[-T, -T, H], [0, -T, H], [0, 0, H], [-T, 0, H]])}" fill="${C.trim}"/>`);
  }
  function windowAndCurtains() {
    // Fenêtre sur le mur y=0 : x de 4.5 à 6.9, z de 1.5 à 3.7
    const g = grad('#f0faff', '#bfe3f7');                 // en repère de plan (v monte) : c1 = bas
    add(`<g transform="${mWallA(0)}">
      <rect x="4.4" y="1.4" width="2.6" height="2.4" rx="0.14" fill="#fff8e8"/>
      <rect x="4.55" y="1.55" width="2.3" height="2.1" rx="0.08" fill="${g}"/>
      <path d="M4.7 2.2 Q5.4 2.7 6.2 2.45 Q6.6 2.35 6.8 2.55 L6.8 3.6 L4.7 3.6Z" fill="rgba(255,255,255,.55)"/>
      <ellipse cx="5.3" cy="3.05" rx="0.5" ry="0.17" fill="#ffffff" opacity=".9"/><ellipse cx="5.65" cy="3.12" rx="0.35" ry="0.15" fill="#ffffff" opacity=".9"/>
      <rect x="5.64" y="1.55" width="0.12" height="2.1" fill="#fff8e8"/><rect x="4.55" y="2.55" width="2.3" height="0.12" fill="#fff8e8"/>
      <rect x="4.3" y="1.33" width="2.8" height="0.14" rx="0.07" fill="#f7ebd2"/>
    </g>`);
    // Tringle et rideaux (turquoise, plis)
    const cur = (x0, x1) => {
      let f = '';
      const n = 4, w = (x1 - x0) / n;
      for (let i = 0; i < n; i++) f += `<rect x="${r1(x0 + i * w + 0.02)}" y="1.0" width="${r1(w * 0.55)}" height="3.0" rx="0.1" fill="rgba(255,255,255,.22)"/>`;
      return `<rect x="${x0}" y="0.9" width="${x1 - x0}" height="3.15" rx="0.14" fill="${grad('#62d0c4', '#35aea2')}"/>${f}`;
    };
    add(`<g transform="${mWallA(-0.02)}">${cur(3.85, 4.75)}${cur(6.7, 7.1 + 0.0)}
      <rect x="3.7" y="4.02" width="3.6" height="0.12" rx="0.06" fill="#d8b97c"/>
      <ellipse cx="4.3" cy="2.2" rx="0.2" ry="0.1" fill="#f4d99a" opacity=".0"/></g>`);
    // Horloge : l'heure du scénario (7 h 40 par défaut)
    const c = P(2.7, 0, 3.2);
    const hand = (deg, len) => { const a = deg * Math.PI / 180; return [r1(len * Math.sin(a)), r1(-len * Math.cos(a))]; };
    const hh = hand(((CLK.h % 12) + CLK.m / 60) * 30, 8), mm = hand(CLK.m * 6, 12);
    add(`<g transform="translate(${r1(c[0])} ${r1(c[1])})">${ell(0, 2, 17, 17, 'rgba(60,40,30,.18)')}<circle r="17" fill="#fff9ec" stroke="#f0d9a8" stroke-width="4"/>
      <line x1="0" y1="0" x2="${hh[0]}" y2="${hh[1]}" stroke="#3b4a5a" stroke-width="2.8" stroke-linecap="round"/><line x1="0" y1="0" x2="${mm[0]}" y2="${mm[1]}" stroke="#3b4a5a" stroke-width="2" stroke-linecap="round"/><circle r="1.8" fill="#3b4a5a"/></g>`);
  }
  function door() {
    add(`<g transform="${mWallB(0)}">
      <rect x="2.1" y="0" width="1.5" height="3.4" rx="0.1" fill="#ece0c4"/>
      <rect x="2.2" y="0.05" width="1.3" height="3.25" rx="0.08" fill="${grad('#fbf1d9', '#efe0bd')}"/>
      <rect x="2.38" y="0.3" width="0.95" height="1.2" rx="0.07" fill="rgba(0,0,0,.05)"/>
      <rect x="2.38" y="1.75" width="0.95" height="1.2" rx="0.07" fill="rgba(0,0,0,.05)"/>
      <circle cx="3.28" cy="1.55" r="0.07" fill="#a9b6bf"/></g>`);
  }
  function picture() {
    add(`<g transform="${mWallB(0)}">
      <rect x="4.7" y="2.15" width="1.3" height="1.05" rx="0.07" fill="#f7e6bd"/>
      <rect x="4.78" y="2.23" width="1.14" height="0.89" rx="0.04" fill="#bfe6f5"/>
      <path d="M4.78 2.23 Q5.3 2.7 5.92 2.4 L5.92 2.23Z" fill="rgba(0,0,0,0)"/>
      <path d="M4.78 2.23 Q5.15 2.6 5.5 2.4 Q5.75 2.28 5.92 2.45 L5.92 2.23 L4.78 2.23Z" fill="#8fd69c"/>
      <circle cx="5.62" cy="2.9" r="0.11" fill="#ffd66b"/></g>`);
  }
  function dispenser() {
    add(`<g data-hot="dispenser"><g transform="${mWallB(0)}">
      <rect x="3.95" y="1.75" width="0.46" height="0.82" rx="0.1" fill="${grad('#ffffff', '#d3dde5')}" stroke="#c7d3dc" stroke-width="0.02"/>
      <rect x="4.04" y="2.3" width="0.28" height="0.14" rx="0.05" fill="#7cc0ea"/>
      <rect x="4.09" y="2.43" width="0.18" height="0.15" rx="0.05" fill="#5aa8d9"/>
      <path d="M4.18 2.1 q0.09 0.12 0 0.2 q-0.09 -0.08 0 -0.2z" fill="#7cc0ea"/></g></g>`);
  }

  function wardrobe() {
    shadow(0.25, 0.1, 2.1, 1.2, 0.18, 2);
    rbox(0.35, 0.12, 0, 1.65, 0.8, 3.15, '#f5eee1', { rim: 5 });
    add(`<g transform="${mWallA(0.92)}">
      <rect x="0.5" y="0.2" width="1.35" height="2.85" rx="0.08" fill="none" stroke="rgba(150,125,90,.35)" stroke-width="0.03"/>
      <line x1="1.175" y1="0.2" x2="1.175" y2="3.05" stroke="rgba(150,125,90,.4)" stroke-width="0.03"/>
      <circle cx="1.08" cy="1.6" r="0.06" fill="#cfa86b"/><circle cx="1.27" cy="1.6" r="0.06" fill="#cfa86b"/></g>`);
  }
  function bedsideTable() {
    shadow(5.45, 0.4, 6.7, 1.5, 0.2, 2);
    rbox(5.6, 0.5, 0, 0.9, 0.85, 1.22, '#f8f3e8', { rim: 5 });
    add(`<g transform="${mWallA(1.35)}">
      <rect x="5.7" y="0.72" width="0.7" height="0.22" rx="0.05" fill="none" stroke="rgba(150,125,90,.4)" stroke-width="0.03"/>
      <rect x="5.7" y="0.22" width="0.7" height="0.4" rx="0.05" fill="none" stroke="rgba(150,125,90,.4)" stroke-width="0.03"/>
      <circle cx="6.05" cy="0.83" r="0.045" fill="#cfa86b"/><circle cx="6.05" cy="0.42" r="0.045" fill="#cfa86b"/></g>`);
    // carafe + verre, presque pleins
    const c = P(5.95, 0.88, 1.22), v = P(6.28, 1.1, 1.22);
    add(`<g data-hot="table">
      ${ell(c[0], c[1] + 1, 17, 7, 'rgba(70,52,40,.18)')}
      <path d="M${r1(c[0] - 11)} ${r1(c[1])} Q${r1(c[0] - 13)} ${r1(c[1] - 24)} ${r1(c[0] - 7)} ${r1(c[1] - 33)} L${r1(c[0] + 7)} ${r1(c[1] - 33)} Q${r1(c[0] + 13)} ${r1(c[1] - 24)} ${r1(c[0] + 11)} ${r1(c[1])} Q${r1(c[0])} ${r1(c[1] + 6)} ${r1(c[0] - 11)} ${r1(c[1])}Z" fill="${grad('#e8f6ff', '#bfe0f2')}" stroke="#d3ecf9" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${r1(c[0] - 11.5)} ${r1(c[1] - 4)} Q${r1(c[0] - 13)} ${r1(c[1] - 22)} ${r1(c[0] - 7)} ${r1(c[1] - 30)} L${r1(c[0] + 7)} ${r1(c[1] - 30)} Q${r1(c[0] + 13)} ${r1(c[1] - 22)} ${r1(c[0] + 11.5)} ${r1(c[1] - 4)} Q${r1(c[0])} ${r1(c[1] + 4)} ${r1(c[0] - 11.5)} ${r1(c[1] - 4)}Z" fill="#8ecdf0" opacity=".75"/>
      ${ell(c[0], c[1] - 33, 7.5, 3, '#d6eefb', 'stroke="#c4e3f4" stroke-width="1.5"')}
      <path d="M${r1(c[0] + 11)} ${r1(c[1] - 24)} q10 2 9 11 q-1 6 -10 7" fill="none" stroke="#cfe9f7" stroke-width="3" stroke-linecap="round"/>
      <rect x="${r1(c[0] - 6)}" y="${r1(c[1] - 38)}" width="12" height="6" rx="3" fill="#7fc4e8"/>
      ${ell(v[0], v[1] + 1, 9, 4, 'rgba(70,52,40,.16)')}
      <path d="M${r1(v[0] - 8)} ${r1(v[1] - 15)} L${r1(v[0] - 6)} ${r1(v[1])} Q${r1(v[0])} ${r1(v[1] + 3)} ${r1(v[0] + 6)} ${r1(v[1])} L${r1(v[0] + 8)} ${r1(v[1] - 15)}Z" fill="${grad('#e8f6ff', '#c5e4f5')}" stroke="#d3ecf9" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${r1(v[0] - 7.4)} ${r1(v[1] - 12)} L${r1(v[0] - 5.7)} ${r1(v[1] - 1)} Q${r1(v[0])} ${r1(v[1] + 2)} ${r1(v[0] + 5.7)} ${r1(v[1] - 1)} L${r1(v[0] + 7.4)} ${r1(v[1] - 12)}Z" fill="#8ecdf0" opacity=".8"/>
      ${ell(v[0], v[1] - 15, 8, 2.8, '#dff2fc', 'stroke="#c8e6f5" stroke-width="1.4"')}
    </g>`);
  }
  function overbedTable() {
    shadow(1.0, 2.0, 2.6, 3.3, 0.2, 2);
    rbox(1.45, 2.4, 0.04, 0.7, 0.55, 0.1, '#c9d2d8', { rim: 3 });
    rbox(1.73, 2.63, 0.14, 0.1, 0.1, 1.0, '#bcc6cd', { rim: 3 });
    rbox(1.15, 2.15, 1.12, 1.25, 1.0, 0.1, '#efd49a', { rim: 5 });
    rbox(1.27, 2.25, 1.22, 1.0, 0.8, 0.04, '#cfe7f6', { rim: 3 });
    // assiette + tartine, tasse de café, yaourt : tout est intact
    const a = P(1.85, 2.7, 1.26), b = P(1.45, 2.6, 1.26), y = P(2.05, 2.35, 1.26);
    add(`<g data-hot="plateau">
      ${ell(a[0], a[1], 15, 7.5, '#ffffff', 'stroke="#e9eef2" stroke-width="2"')}
      <path d="M${r1(a[0] - 11)} ${r1(a[1] - 2)} q0 -9 11 -9 q11 0 11 9 q0 4 -4 4 L${r1(a[0] - 7)} ${r1(a[1] + 2)} q-4 0 -4 -4Z" fill="${grad('#f1c78a', '#d9a35a')}" stroke="#e6b873" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${r1(a[0] - 7)} ${r1(a[1] - 4)} q7 -6 14 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/>
      ${ell(b[0], b[1] - 1, 11, 5, 'rgba(70,52,40,.14)')}
      <path d="M${r1(b[0] - 9)} ${r1(b[1] - 13)} L${r1(b[0] - 7)} ${r1(b[1])} Q${r1(b[0])} ${r1(b[1] + 3)} ${r1(b[0] + 7)} ${r1(b[1])} L${r1(b[0] + 9)} ${r1(b[1] - 13)}Z" fill="${grad('#ffffff', '#e1e8ee')}" stroke="#eef2f5" stroke-width="2" stroke-linejoin="round"/>
      ${ell(b[0], b[1] - 13, 9, 3.4, '#8a5a3c')}${ell(b[0], b[1] - 13.5, 6.5, 2.2, '#a2704b')}
      <path d="M${r1(b[0] + 9)} ${r1(b[1] - 10)} q7 1 6 6 q-1 4 -7 4" fill="none" stroke="#eef2f5" stroke-width="2.4" stroke-linecap="round"/>
      ${ell(y[0], y[1] - 1, 10, 4.5, 'rgba(70,52,40,.14)')}
      <path d="M${r1(y[0] - 9)} ${r1(y[1] - 15)} L${r1(y[0] - 6.5)} ${r1(y[1])} Q${r1(y[0])} ${r1(y[1] + 3)} ${r1(y[0] + 6.5)} ${r1(y[1])} L${r1(y[0] + 9)} ${r1(y[1] - 15)}Z" fill="${grad('#ffffff', '#e8edf2')}" stroke="#f1f4f7" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${r1(y[0] - 8)} ${r1(y[1] - 9)} L${r1(y[0] - 7)} ${r1(y[1] - 3)} Q${r1(y[0])} ${r1(y[1] + 0)} ${r1(y[0] + 7)} ${r1(y[1] - 3)} L${r1(y[0] + 8)} ${r1(y[1] - 9)}Z" fill="#f6a5c0"/>
      ${ell(y[0], y[1] - 15, 9, 3.2, '#e7ecf1', 'stroke="#d6dde5" stroke-width="1.4"')}
    </g>`);
  }

  function mat() {
    add(`<g transform="${mFloor(0)}">
      <rect x="2.55" y="1.0" width="3.5" height="4.2" rx="0.32" fill="rgba(60,100,95,.22)" transform="translate(0.08 0.12)" filter="url(#ssb2)"/>
      <rect x="2.55" y="1.0" width="3.5" height="4.2" rx="0.32" fill="${grad('#6fd3c8', '#46b6ab')}"/>
      <rect x="2.68" y="1.13" width="3.24" height="3.94" rx="0.22" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="0.04" stroke-dasharray="0.16 0.12"/></g>`);
  }

  function wheel(x, y) {
    const p = P(x, y, 0.2);
    add(`${ell(p[0], p[1] + 4, 9, 4.5, 'rgba(60,45,35,.28)')}<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="9" fill="${grad('#7b8a94', '#53626c')}" stroke="#6a7882" stroke-width="2"/><circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.5" fill="#d4dde3"/>`);
  }

  function bed(state) {
    shadow(3.05, 0.3, 5.65, 4.7, 0.26, 3);
    wheel(3.55, 0.65); wheel(3.55, 3.95);
    rbox(3.4, 0.45, 0.26, 1.8, 3.7, 0.2, '#c7d1d8', { rim: 4 });
    wheel(5.05, 0.65); wheel(5.05, 3.95);
    rbox(3.32, 0.28, 0.4, 2.0, 0.2, 1.7, C.yellow, { rim: 6 });                    // tête de lit
    add(`<g transform="${mWallA(0.48)}"><rect x="3.5" y="0.75" width="1.65" height="1.0" rx="0.18" fill="${grad('#f9dc8c', '#ecbb4a')}" opacity=".9"/></g>`);
    rbox(3.35, 0.46, 0.46, 1.9, 3.7, 0.36, '#fcf8ee', { rim: 5 });                 // matelas
    rbox(3.32, 1.35, 0.78, 0.13, 2.2, 0.62, C.yellow, { rim: 5 });                 // barrière côté fenêtre (lointaine)
    add(`<g transform="${mWallB(3.45)}"><rect x="1.5" y="0.95" width="2.0" height="0.32" rx="0.08" fill="#9ccbe3"/></g>`);
    rbox(3.62, 0.5, 0.82, 1.3, 0.78, 0.24, '#ffffff', { rim: 6, top: '#ffffff' });   // oreiller
    patientBody(state);
    rbox(3.32, 4.12, 0.4, 2.0, 0.2, 1.05, C.yellow, { rim: 6 });                   // pied de lit
    add(`<g transform="${mWallA(4.32)}"><rect x="3.5" y="0.62" width="1.65" height="0.55" rx="0.14" fill="${grad('#f9dc8c', '#ecbb4a')}" opacity=".9"/></g>`);
    // poire d'appel accrochée au bord du lit
    const b = P(5.42, 1.55, 0.7), t = P(5.28, 1.5, 0.95);
    add(`<g data-hot="sonnette"><path d="M${r1(t[0])} ${r1(t[1])} Q${r1(t[0] + 6)} ${r1(t[1] + 14)} ${r1(b[0])} ${r1(b[1] - 8)}" fill="none" stroke="#6b7782" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="${r1(b[0] - 7)}" y="${r1(b[1] - 8)}" width="14" height="17" rx="6" fill="${grad('#ff8a7a', '#e14d44')}" stroke="#ef6a5e" stroke-width="2"/><circle cx="${r1(b[0])}" cy="${r1(b[1] + 0.5)}" r="3.4" fill="#fff" opacity=".9"/></g>`);
  }

  function patientBody(state) {
    // gilet menthe (buste) puis couverture ; la tête repose sur l'oreiller
    const gown = state.gown || C.mint;
    rbox(3.78, 1.2, 0.8, 1.38, 0.95, 0.3, gown, { rim: 6 });
    // couverture crème avec revers
    rbox(3.4, 1.95, 0.8, 1.75, 2.15, 0.34, C.cream, { rim: 6 });
    rbox(3.4, 1.95, 0.8, 1.75, 0.4, 0.37, '#fff4d6', { rim: 6, top: '#fffaea' });
    // relief du corps sous la couverture
    rbox(3.88, 2.6, 1.1, 1.15, 1.35, 0.08, '#f0dcb4', { rim: 5, top: '#f6e6c4' });
    // bras (côté visible) : manche menthe, avant-bras, main, bracelet
    rbox(4.98, 1.28, 0.98, 0.34, 0.8, 0.3, gown, { rim: 5 });
    rbox(5.0, 2.05, 1.02, 0.3, 0.78, 0.24, state.pale ? C.skinPale : C.skin, { rim: 5 });
    const h = P(5.15, 2.98, 1.12), w = P(5.15, 2.72, 1.18);
    add(`${ell(h[0], h[1], 11, 9, rad(lt(C.skin, .3), C.skin), 'stroke="#f3c9aa" stroke-width="3"')}
      <rect x="${r1(w[0] - 10)}" y="${r1(w[1] - 4)}" width="20" height="6" rx="3" fill="#ffffff" stroke="#e6edf2" stroke-width="1.4" transform="rotate(28 ${r1(w[0])} ${r1(w[1])})"/>`);
    // tête
    const c = P(4.43, 0.96, 1.18);
    const rot = 60, eyes = state.eyes || 'closed';
    const hairC = state.hair || ['#f4f6f9', '#cfd5de'];
    const mouth = state.droop ? 'M-6.6 14.6 Q0 12.2 6.6 7.4' : (state.grimace ? 'M-5 13.4 Q0 9.4 5 13.4' : 'M-4.5 11 Q0 13.2 4.5 11');
    // gasp : bouche entrouverte (gêne respiratoire) · cyan : lèvres bleutées (cyanose)
    const lipC = state.cyan ? '#6e7fc2' : '#b9776f';
    const mouthEl = state.gasp
      ? `<ellipse cx="0" cy="12.4" rx="4.2" ry="4.8" fill="#8a4a4f" stroke="${lipC}" stroke-width="2"/><path d="M-2.6 10.2 Q0 9 2.6 10.2" fill="none" stroke="#f4f0ec" stroke-width="1.4" stroke-linecap="round"/>`
      : `<path d="${mouth}" fill="none" stroke="${lipC}" stroke-width="2" stroke-linecap="round"/>`;
    const cyanHalo = state.cyan ? ell(0, 12, 9, 6, '#7f93d6', 'opacity=".22"') : '';
    const brows = state.grimace
      ? '<path d="M-12 -2.6 Q-8 -8 -4 -6.6" fill="none" stroke="#9aa0ab" stroke-width="1.8" stroke-linecap="round"/><path d="M4 -6.6 Q8 -8 12 -2.6" fill="none" stroke="#9aa0ab" stroke-width="1.8" stroke-linecap="round"/>'
      : '<path d="M-12 -4.5 Q-8 -7 -4 -5" fill="none" stroke="#c4c9d2" stroke-width="1.6" stroke-linecap="round"/><path d="M4 -5 Q8 -7 12 -4.5" fill="none" stroke="#c4c9d2" stroke-width="1.6" stroke-linecap="round"/>';
    const sweat = state.sweat ? '<path d="M-15 -11 q2.4 4 0 6.4 q-2.4 -2.4 0 -6.4z" fill="#8fd0f5"/><path d="M13 -13 q2.4 4 0 6.4 q-2.4 -2.4 0 -6.4z" fill="#8fd0f5"/><path d="M-3 -17 q2 3.4 0 5.4 q-2 -2 0 -5.4z" fill="#8fd0f5"/>' : '';
    const eye = (x) => eyes === 'open'
      ? `<ellipse cx="${x}" cy="0" rx="2.6" ry="3" fill="#3b2f45"/><circle cx="${x + 0.9}" cy="-1" r="0.9" fill="#fff"/>`
      : `<path d="M${x - 4} -0.5 Q${x} 3.2 ${x + 4} -0.5" fill="none" stroke="#5a4150" stroke-width="2" stroke-linecap="round"/>`;
    add(`<g transform="translate(${r1(c[0])} ${r1(c[1])}) rotate(${rot}) scale(1.14)">
      ${ell(2, 13, 25, 10, 'rgba(70,52,40,.16)')}
      ${ell(0, -9, 24, 19, rad(hairC[0], hairC[1]), 'stroke="#dfe3ea" stroke-width="2"')}
      ${state.male ? '' : `<circle cx="0" cy="-27" r="9" fill="${rad('#f4f6f9', '#c6ccd6')}" stroke="#dfe3ea" stroke-width="2"/>`}
      ${ell(0, 0, 21, 21, rad(lt(state.pale ? C.skinPale : C.skin, .35), state.pale ? '#e6bfa6' : '#eeb894'), 'stroke="#f3c9aa" stroke-width="1.5"')}
      <path d="M-20 -6 Q-12 -22 0 -21 Q12 -22 20 -6 Q9 -13 0 -12 Q-9 -13 -20 -6Z" fill="${rad(hairC[0], hairC[1])}"/>
      <ellipse cx="-21" cy="1" rx="3.6" ry="5" fill="${C.skin}"/><ellipse cx="21" cy="1" rx="3.6" ry="5" fill="${C.skin}"/>
      ${brows}
      ${eye(-8)}${eye(8)}
      ${ell(-13, 7, 4.6, 3.4, C.blush, 'opacity=".42"')}${ell(13, 7, 4.6, 3.4, C.blush, 'opacity=".42"')}
      ${cyanHalo}${mouthEl}
      ${state.male ? '<path d="M-6 8.6 Q0 6.4 6 8.6" fill="none" stroke="#cfd5de" stroke-width="2.4" stroke-linecap="round"/>' : ''}
      <path d="M-1 3 Q0 5 1 3" fill="none" stroke="#e0a98b" stroke-width="1.6" stroke-linecap="round"/>
      ${sweat}
      ${state.droop ? '<path d="M-7 16 q2.3 4 0 5.8 q-2.3 -1.8 0 -5.8z" fill="#bfe4f6" stroke="#8fd0f5" stroke-width=".6"/>' : ''}
    </g>`);
  }

  function walker() {
    const g = (x, y, z) => P(x, y, z).map(r1);
    const f = [[0.55, 4.6], [0.55, 5.45], [1.15, 4.6], [1.15, 5.45]];
    const top = 1.4;
    const line = (a, b, w, c) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    let s = ell(g(0.85, 5.0, 0)[0], g(0.85, 5.0, 0)[1] + 3, 40, 14, 'rgba(70,52,40,.16)');
    f.forEach(([x, y]) => { s += line(g(x, y, 0), g(x, y, top), 6, '#8d9aa4') + line(g(x, y, 0), g(x, y, top), 3, '#d3dde4'); });
    s += line(g(0.55, 4.6, top), g(0.55, 5.45, top), 6, '#8d9aa4') + line(g(1.15, 4.6, top), g(1.15, 5.45, top), 6, '#8d9aa4');
    s += line(g(0.55, 5.45, top), g(1.15, 5.45, top), 6, '#8d9aa4') + line(g(0.55, 4.6, top), g(1.15, 4.6, top), 6, '#8d9aa4');
    s += line(g(0.55, 4.6, top), g(0.55, 5.45, top), 3, '#d3dde4') + line(g(0.55, 4.6, 0.7), g(0.55, 5.45, 0.7), 4, '#aab6bf');
    s += line(g(0.55, 4.6, top + 0.02), g(0.55, 4.95, top + 0.02), 8, '#6bb7e0') + line(g(0.55, 5.1, top + 0.02), g(0.55, 5.45, top + 0.02), 8, '#6bb7e0');
    f.forEach(([x, y]) => { const p = g(x, y, 0); s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#4b5560"/>`; });
    add(`<g data-hot="deambulateur">${s}</g>`);
  }

  function slippers() {
    // Une paire de chaussons-mules : semelle lisse, talon non maintenu (détail clinique : risque de glissade)
    const one = (x, y, a) => `<g transform="${mFloor(0)} translate(${x} ${y}) rotate(${a})">
      <ellipse cx="0.02" cy="0.04" rx="0.2" ry="0.42" fill="rgba(60,45,35,.22)"/>
      <ellipse cx="0" cy="0" rx="0.18" ry="0.4" fill="${grad('#a3b0cc', '#7e8db0')}" stroke="#8d9bbb" stroke-width="0.025"/>
      <path d="M-0.17 -0.02 Q-0.17 -0.34 0 -0.37 Q0.17 -0.34 0.17 -0.02 Q0 -0.1 -0.17 -0.02Z" fill="${grad('#c9d3e8', '#9eacc8')}"/></g>`;
    add(`<g data-hot="chaussons">${one(2.3, 3.95, -10)}${one(2.85, 4.2, 6)}</g>`);
  }

  function trolley(opts) {
    shadow(6.0, 3.1, 7.3, 4.8, 0.2, 2);
    [[6.25, 3.3], [6.95, 3.3], [6.25, 4.45], [6.95, 4.45]].forEach(([x, y]) => rbox(x, y, 0.1, 0.06, 0.06, 1.0, '#b8c4cc', { rim: 3 }));
    rbox(6.2, 3.25, 0.38, 0.88, 1.3, 0.07, '#dfe8ee', { rim: 4 });
    rbox(6.17, 3.22, 1.06, 0.94, 1.36, 0.09, '#eef3f6', { rim: 5 });
    // instruments posés dessus : thermomètre, tensiomètre (avec écran), saturomètre, montre
    rbox(6.27, 3.32, 1.15, 0.2, 0.44, 0.16, '#ffffff', { rim: 4, id: 'tool-thermometre' });
    rbox(6.27, 3.32, 1.31, 0.2, 0.16, 0.1, '#6cb7e6', { rim: 3, id: 'tool-thermometre' });
    rbox(6.62, 3.3, 1.15, 0.4, 0.4, 0.22, '#ffffff', { rim: 4, id: 'tool-tension' });
    add(`<g transform="${mFloor(1.37)}"><rect x="6.68" y="3.36" width="0.22" height="0.14" rx="0.02" fill="#4a5f78"/><rect x="6.72" y="3.4" width="0.14" height="0.07" rx="0.01" fill="#8ee0b0"/></g>`);
    rbox(6.3, 3.95, 1.15, 0.3, 0.26, 0.1, '#2f5f9e', { rim: 4, id: 'tool-saturometre' });
    rbox(6.36, 3.99, 1.25, 0.18, 0.14, 0.02, '#d3dad5', { rim: 2, id: 'tool-saturometre' });
    rbox(6.7, 4.3, 1.15, 0.24, 0.24, 0.1, '#f7d98c', { rim: 4, id: 'tool-montre' });
    if (opts && opts.glucometre) {                     // glycémie capillaire : lecteur + stylo piqueur
      rbox(6.74, 3.82, 1.15, 0.26, 0.3, 0.1, '#e9f6ee', { rim: 4, id: 'tool-glucometre' });
      rbox(6.82, 3.9, 1.25, 0.1, 0.12, 0.05, '#5fbf8a', { rim: 2, id: 'tool-glucometre' });
    }
  }

  function plant() {
    shadow(6.5, 0.25, 7.2, 1.0, 0.2, 2);
    rbox(6.7, 0.35, 0, 0.42, 0.42, 0.5, '#eab998', { rim: 5 });
    const p = P(6.91, 0.56, 0.5);
    const leaf = (dx, dy, rot, c) => `<ellipse cx="${r1(p[0] + dx)}" cy="${r1(p[1] + dy)}" rx="9" ry="20" fill="${rad(lt(c, .3), c)}" transform="rotate(${rot} ${r1(p[0] + dx)} ${r1(p[1] + dy)})"/>`;
    add(leaf(-14, -26, -30, '#6cc58f') + leaf(14, -28, 28, '#58b87f') + leaf(0, -38, 0, '#7fd49f') + leaf(-4, -22, -12, '#4fae78'));
  }

  // ── Assemblage ──────────────────────────────────────────────────────────
  const T = 0.32;
  function svg(opts) {
    opts = opts || {};
    const state = Object.assign({ eyes: 'closed', pale: true }, opts.patient || {});
    CLK = Object.assign({ h: 7, m: 40 }, opts.clock || {});
    defs = []; uid = 0; out = [];
    floor(); walls(); windowAndCurtains(); door(); picture(); dispenser();
    wardrobe(); mat(); overbedTable(); slippers(); bed(state); bedsideTable(); plant(); walker(); trolley(opts);
    // Zones cliquables (au-dessus de tout)
    const hs = [
      hot('patiente', 'Observer la résidente', 4.4, 1.9, 1.6, 30),
      hot('table', 'Table de chevet', 5.95, 0.9, 1.5, 24),
      hot('plateau', 'Plateau du petit déjeuner', 1.85, 2.6, 1.45, 26),
      hot('deambulateur', 'Déambulateur', 0.85, 5.0, 0.9, 26),
      hot('chaussons', 'Chaussons', 2.58, 4.08, 0.1, 24),
      hot('sonnette', 'Sonnette', 5.42, 1.55, 0.7, 14),
      hot('dispenser', 'Distributeur de solution hydro-alcoolique', 0, 4.17, 2.2, 22)
    ].join('');
    const toolHs = [
      hot('tool-thermometre', 'Thermomètre', 6.37, 3.54, 1.35, 10, 2),
      hot('tool-tension', 'Tensiomètre', 6.82, 3.5, 1.45, 11, 2),
      hot('tool-saturometre', 'Saturomètre', 6.45, 4.08, 1.3, 10, 2),
      hot('tool-montre', 'Montre', 6.82, 4.42, 1.3, 9, 2),
      opts.glucometre ? hot('tool-glucometre', 'Lecteur de glycémie', 6.87, 3.98, 1.34, 9, 2) : ''
    ].join('');
    const spots = [
      hot('zone-tete', 'Front et oreille', 4.45, 0.98, 1.6, 19, 1),
      hot('zone-thorax', 'Thorax (respiration)', 4.4, 1.75, 1.55, 15, 1),
      hot('zone-bras', 'Bras (brassard)', 5.1, 1.7, 1.45, 14, 1),
      hot('zone-poignet', 'Poignet (pouls)', 5.15, 2.58, 1.38, 11, 1),
      hot('zone-doigt', 'Doigt', 5.18, 3.14, 1.34, 10, 1)
    ].join('');
    const f = '<filter id="ssb1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="ssb2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '<filter id="ssb3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>';
    return `<svg class="sim-scene-svg" viewBox="${opts.viewBox || VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(opts.label || 'Chambre 12 : Mme Martin est dans son lit').replace(/"/g, '&quot;')}">
      <defs>${f}${defs.join('')}</defs>
      ${out.join('')}
      <g class="sim-hots">${hs}${toolHs}</g><g class="sim-spots">${spots}</g>
    </svg>`;
  }

  return { svg, P, VIEW: { room: VB, patient: '318 232 256 232' } };
})();
