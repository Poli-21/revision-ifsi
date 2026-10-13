// ui/sim_ecg_art.js — Atelier ECG : schémas dessinés par code (thorax, corps entier) + géométrie des repères
// Tout est vectoriel, léger et hors ligne. Vue de face : la DROITE de la patiente est à GAUCHE de l'image.
// Unités du schéma du thorax : 10 unités = 1 cm environ.
'use strict';
window.App = window.App || {};

App.SimECGArt = (() => {
  const MID = 200;                 // axe du corps (ligne médiane)
  const D0 = 16;                   // bord du sternum (distance à la ligne médiane)
  // y du bord du sternum pour chaque côte (cartilage costal), puis pente vers le bas en allant sur le côté
  const RIB_Y = [0, 92, 120, 147, 173, 197, 219, 239, 257, 273];
  const SLOPE = [0, 0.04, 0.06, 0.09, 0.12, 0.16, 0.20, 0.22, 0.24, 0.26];
  const D_MCL = 85, D_AAL = 140, D_MAL = 160, D_EDGE = 168;
  const ribY = (k, d) => { const e = Math.max(0, Math.abs(d) - D0); return RIB_Y[k] + SLOPE[k] * e * (0.5 + 0.5 * Math.min(1.2, e / 150)); };
  const icsCenter = (k, d) => (ribY(k, d) + ribY(k + 1, d)) / 2;
  const LOUIS_Y = RIB_Y[2];

  // Où est un point (x, y) du schéma ? → espace intercostal, côte, colonne
  function locate(x, y) {
    const d = x - MID, ad = Math.abs(d);
    let ics = 0, onRib = null;
    if (y >= ribY(1, ad)) {
      ics = 9;
      for (let k = 1; k <= 8; k++) { if (y < ribY(k + 1, ad)) { ics = k; break; } }
    }
    for (let k = 1; k <= 9; k++) if (Math.abs(y - ribY(k, ad)) <= 3.5) onRib = k;
    const side = d < 0 ? 'D' : 'G';
    let col;
    if (ad <= 8) col = 'sur le sternum';
    else if (ad < 40 && ad >= 8) col = side === 'D' ? 'bord droit du sternum' : 'bord gauche du sternum';
    else {
      const A = [[54, 'à mi-distance entre le sternum et la ligne médio-claviculaire'], [D_MCL, 'ligne médio-claviculaire'], [D_AAL, 'ligne axillaire antérieure'], [D_MAL, 'ligne axillaire moyenne']];
      let best = A[0], bd = 1e9;
      A.forEach(a => { const dd = Math.abs(ad - a[0]); if (dd < bd) { bd = dd; best = a; } });
      col = bd <= 14 ? best[1] : 'entre ' + (ad < 54 ? 'le sternum et la ligne médio-claviculaire' : (ad < D_MCL ? 'la mi-distance et la ligne médio-claviculaire' : (ad < D_AAL ? 'la ligne médio-claviculaire et la ligne axillaire antérieure' : 'la ligne axillaire antérieure et la ligne axillaire moyenne')));
      if (bd <= 14 && best[0] >= D_MCL) col += side === 'D' ? ' droite' : ' gauche';
    }
    return { d, side, ics, onRib, col };
  }
  const ordF = n => n === 1 ? '1er' : n + 'e';
  function describe(x, y) {
    const L = locate(x, y);
    const where = L.ics === 0 ? 'au-dessus de la 1re côte' : (L.onRib ? 'sur la ' + (L.onRib === 1 ? '1re' : L.onRib + 'e') + ' côte' : 'dans le ' + ordF(L.ics) + ' espace intercostal');
    return where + ', ' + L.col;
  }

  const COL = { RA: '#e53935', LA: '#f6c915', LL: '#43a047', RL: '#212121', V1: '#e53935', V2: '#f6c915', V3: '#43a047', V4: '#8d5a2b', V5: '#212121', V6: '#8e44ad' };
  const COLNAME = { RA: 'rouge', LA: 'jaune', LL: 'vert', RL: 'noir', V1: 'rouge', V2: 'jaune', V3: 'vert', V4: 'marron', V5: 'noir', V6: 'violet' };
  const txtOn = k => (k === 'LA' || k === 'V2') ? '#3b2f00' : '#ffffff';
  const r1 = n => Math.round(n * 10) / 10;

  function ribPoints(k, side, d0, d1) {
    const a = [];
    for (let d = d0; d <= d1 + 0.01; d += 5) a.push((MID + side * d).toFixed(1) + ',' + ribY(k, d).toFixed(1));
    return a.join(' ');
  }

  function marker(key, x, y, state, extra) {
    const ring = state === 'ok' ? '#16a34a' : (state === 'bad' ? '#dc2626' : '#ffffff');
    return `<g class="ecg-mk" data-el="${key}" transform="translate(${r1(x)} ${r1(y)})">
      <circle r="${extra && extra.r || 10}" fill="${COL[key]}" stroke="${ring}" stroke-width="${state ? 3 : 2.2}"/>
      <text y="3.4" text-anchor="middle" font-size="${extra && extra.fs || 9.5}" font-weight="800" fill="${txtOn(key)}" font-family="inherit">${key}</text></g>`;
  }

  // ── Schéma du thorax (vue de face) ──
  // o = { guide, louis, placed:{V1:{x,y,state}}, selected, flash }
  function thorax(o) {
    o = o || {};
    const guide = !!o.guide, louis = !!o.louis;
    const s = [];
    s.push(`<svg class="ecg-svg ecg-thorax" id="ecg-thorax" viewBox="0 0 400 396" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma du thorax vu de face">`);
    s.push(`<defs>
      <linearGradient id="ecgSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d3b8"/><stop offset="1" stop-color="#efbf9f"/></linearGradient>
      <linearGradient id="ecgBone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e3c6"/></linearGradient>
    </defs>`);
    s.push(`<rect width="400" height="396" fill="#fdf6e9"/>`);
    // silhouette : cou, épaules (sortent du cadre), flancs
    const sil = `M ${MID - 24} 0 L ${MID - 24} 44 C ${MID - 60} 52 ${MID - 130} 66 ${MID - 205} 96 L ${MID - 205} 118 C ${MID - 182} 120 ${MID - 176} 128 ${MID - 174} 148 C ${MID - 172} 230 ${MID - 168} 300 ${MID - 158} 392 L ${MID + 158} 392 C ${MID + 168} 300 ${MID + 172} 230 ${MID + 174} 148 C ${MID + 176} 128 ${MID + 182} 120 ${MID + 205} 118 L ${MID + 205} 96 C ${MID + 130} 66 ${MID + 60} 52 ${MID + 24} 44 L ${MID + 24} 0 Z`;
    s.push(`<path d="${sil}" fill="url(#ecgSkin)" stroke="#d7a483" stroke-width="3" stroke-linejoin="round"/>`);
    // creux sus-sternal / cou
    s.push(`<path d="M ${MID - 24} 44 C ${MID - 12} 62 ${MID + 12} 62 ${MID + 24} 44" fill="none" stroke="#e0b190" stroke-width="2" stroke-linecap="round" opacity=".7"/>`);

    // côtes : cartilage costal (bleuté) puis côte osseuse (ivoire)
    for (let k = 1; k <= 9; k++) {
      [-1, 1].forEach(side => {
        const hot = (louis && k === 2) ? '#f59e0b' : null;
        const dStart = k >= 8 ? 26 : D0, dEnd = D_EDGE - 6;
        const dCart = k === 1 ? 44 : (k <= 7 ? 74 : 60);
        s.push(`<polyline points="${ribPoints(k, side, dStart, dCart)}" fill="none" stroke="${hot || '#9fc0d3'}" stroke-width="${hot ? 8 : 7}" stroke-linecap="round" stroke-linejoin="round" opacity="${k === 1 ? .55 : .95}"/>`);
        s.push(`<polyline points="${ribPoints(k, side, dCart - 6, dEnd)}" fill="none" stroke="${hot || '#d9c19a'}" stroke-width="${hot ? 9 : 9}" stroke-linecap="round" stroke-linejoin="round" opacity="${k === 1 ? .55 : .98}"/>`);
        s.push(`<polyline points="${ribPoints(k, side, dCart - 6, dEnd)}" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`);
      });
    }
    // clavicules
    [-1, 1].forEach(side => {
      const x0 = MID + side * 16, x1 = MID + side * 152;
      s.push(`<path d="M ${x0} 79 C ${MID + side * 50} 64 ${MID + side * 108} 66 ${x1} 80" fill="none" stroke="#cdb287" stroke-width="12" stroke-linecap="round"/>`);
      s.push(`<path d="M ${x0} 79 C ${MID + side * 50} 64 ${MID + side * 108} 66 ${x1} 80" fill="none" stroke="url(#ecgBone)" stroke-width="8" stroke-linecap="round"/>`);
    });
    // sternum : manubrium, corps, xiphoïde
    s.push(`<path d="M ${MID - 27} 70 Q ${MID} 62 ${MID + 27} 70 L ${MID + 20} 121 L ${MID - 20} 121 Z" fill="url(#ecgBone)" stroke="#cdb287" stroke-width="2.6" stroke-linejoin="round"/>`);
    s.push(`<path d="M ${MID - 18} 121 L ${MID + 18} 121 L ${MID + 16} 227 L ${MID - 16} 227 Z" fill="url(#ecgBone)" stroke="#cdb287" stroke-width="2.6" stroke-linejoin="round"/>`);
    s.push(`<path d="M ${MID - 10} 227 L ${MID + 10} 227 L ${MID} 256 Z" fill="url(#ecgBone)" stroke="#cdb287" stroke-width="2.4" stroke-linejoin="round"/>`);
    // angle sternal (de Louis) : crête entre manubrium et corps
    s.push(`<line x1="${MID - 21}" y1="${LOUIS_Y + .5}" x2="${MID + 21}" y2="${LOUIS_Y + .5}" stroke="${louis ? '#f59e0b' : '#b89b6c'}" stroke-width="${louis ? 4 : 2.4}" stroke-linecap="round"/>`);
    if (louis) s.push(`<circle cx="${MID}" cy="${LOUIS_Y}" r="15" fill="none" stroke="#f59e0b" stroke-width="2.4" class="ecg-pulse"/>`);

    // repères (mode guidé) : lignes verticales et noms des os
    const line = (d, y0, y1, name, side, stag) => {
      const x = MID + side * d;
      return `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="6 5" opacity=".85"/>` +
        `<text x="${x}" y="${y1 + (stag || 13)}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8" stroke="#fdf6e9" stroke-width="3" paint-order="stroke" font-family="inherit">${name}</text>`;
    };
    if (guide) {
      s.push(line(D_MCL, 84, 352, 'LMC', -1));
      s.push(line(D_MCL, 84, 352, 'LMC', 1));
      s.push(line(D_AAL, 128, 352, 'LAA', 1, 13));
      s.push(line(D_MAL, 140, 352, 'LAM', 1, 27));
      const lab = (x, y, t, anchor) => `<text x="${x}" y="${y}" text-anchor="${anchor || 'middle'}" font-size="10.5" font-weight="700" fill="#6b4a25" stroke="#f6d3b8" stroke-width="3" paint-order="stroke" font-family="inherit">${t}</text>`;
      s.push(lab(MID, 98, 'manubrium'));
      s.push(`<line x1="${MID + 24}" y1="${LOUIS_Y}" x2="${MID + 44}" y2="${LOUIS_Y - 20}" stroke="#b45309" stroke-width="1.4"/>`);
      s.push(lab(MID + 46, LOUIS_Y - 24, 'angle sternal (de Louis)', 'start'));
      s.push(lab(MID, 214, 'corps du sternum'));
      s.push(lab(MID, 272, 'xiphoïde'));
      s.push(lab(MID + 100, 58, 'clavicule', 'middle'));
    }
    // numéros des espaces intercostaux (guidé, ou après avoir repéré l'angle de Louis)
    if (guide || louis) {
      for (let k = 2; k <= 6; k++) {
        const x = MID - 124, y = icsCenter(k, 124);
        s.push(`<circle cx="${x}" cy="${r1(y)}" r="11" fill="#fff" stroke="#9aa5b1" stroke-width="1.6"/><text x="${x}" y="${r1(y + 3.8)}" text-anchor="middle" font-size="11" font-weight="800" fill="#475569" font-family="inherit">${k}</text>`);
      }
      s.push(`<text x="${MID - 124}" y="${r1(icsCenter(2, 124) - 30)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#475569" stroke="#f6d3b8" stroke-width="3" paint-order="stroke" font-family="inherit">n° d'espace</text>`);
      s.push(`<text x="${MID - 124}" y="${r1(icsCenter(2, 124) - 19)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#475569" stroke="#f6d3b8" stroke-width="3" paint-order="stroke" font-family="inherit">intercostal</text>`);
    }
    // côté droit / gauche
    s.push(`<text x="24" y="24" font-size="16" font-weight="800" fill="#7a5a34" font-family="inherit">D</text><text x="376" y="24" text-anchor="end" font-size="16" font-weight="800" fill="#7a5a34" font-family="inherit">G</text>`);
    // horizontale de V4 (guidé)
    const P = o.placed || {};
    if (guide && P.V4) s.push(`<line x1="${r1(P.V4.x)}" y1="${r1(P.V4.y)}" x2="${MID + 180}" y2="${r1(P.V4.y)}" stroke="#7c3aed" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round" opacity=".9"/>`);
    // électrodes posées
    Object.keys(P).forEach(k => { if (P[k]) s.push(marker(k, P[k].x, P[k].y, P[k].state)); });
    s.push('</svg>');
    return s.join('');
  }

  // ── Corps entier (électrodes des membres) ──
  const LIMB = {
    poignet_d: { x: 60, y: 300, name: 'poignet droit' }, poignet_g: { x: 260, y: 300, name: 'poignet gauche' },
    cheville_g: { x: 190, y: 478, name: 'cheville gauche' }, cheville_d: { x: 130, y: 478, name: 'cheville droite' }
  };
  function body(o) {
    o = o || {};
    const P = o.placed || {};            // { RA:{zone,state}, ... }
    const s = [];
    s.push(`<svg class="ecg-svg ecg-body" id="ecg-body" viewBox="0 0 320 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma de la patiente vue de face">`);
    s.push(`<defs>
      <linearGradient id="ecgGown" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fdad0"/><stop offset=".5" stop-color="#b5ebe3"/><stop offset="1" stop-color="#7fcfc4"/></linearGradient>
      <linearGradient id="ecgSkin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f1c3a3"/><stop offset=".5" stop-color="#f7d6bd"/><stop offset="1" stop-color="#efbd9c"/></linearGradient>
    </defs><rect width="320" height="520" fill="#fdf6e9"/>`);
    // jambes
    s.push(`<path d="M 136 330 L 128 480" stroke="#d7a483" stroke-width="42" stroke-linecap="round"/><path d="M 136 330 L 128 480" stroke="url(#ecgSkin2)" stroke-width="38" stroke-linecap="round"/>`);
    s.push(`<path d="M 184 330 L 192 480" stroke="#d7a483" stroke-width="42" stroke-linecap="round"/><path d="M 184 330 L 192 480" stroke="url(#ecgSkin2)" stroke-width="38" stroke-linecap="round"/>`);
    s.push(`<ellipse cx="124" cy="506" rx="26" ry="11" fill="#e9d3b8" stroke="#c9ad8a" stroke-width="2"/><ellipse cx="196" cy="506" rx="26" ry="11" fill="#e9d3b8" stroke="#c9ad8a" stroke-width="2"/>`);
    // bras : manche puis avant-bras
    [[1, 104, 60], [-1, 216, 260]].forEach(a => {
      const sx = a[1], wx = a[2];
      const ex = sx + (wx - sx) * 0.55;
      s.push(`<path d="M ${wx} 300 L ${ex} 214" stroke="#d7a483" stroke-width="34" stroke-linecap="round"/><path d="M ${wx} 300 L ${ex} 214" stroke="url(#ecgSkin2)" stroke-width="30" stroke-linecap="round"/>`);
      s.push(`<circle cx="${wx}" cy="318" r="15" fill="url(#ecgSkin2)" stroke="#d7a483" stroke-width="3"/>`);
      s.push(`<path d="M ${sx} 120 L ${ex} 220" stroke="#6bbdb2" stroke-width="40" stroke-linecap="round"/><path d="M ${sx} 120 L ${ex} 220" stroke="url(#ecgGown)" stroke-width="36" stroke-linecap="round"/>`);
    });
    // chemise de nuit
    s.push(`<path d="M 112 106 Q 160 96 208 106 L 222 218 Q 226 300 232 372 Q 160 392 88 372 Q 94 300 98 218 Z" fill="url(#ecgGown)" stroke="#6bbdb2" stroke-width="3" stroke-linejoin="round"/>`);
    s.push(`<path d="M 136 104 Q 160 124 184 104" fill="none" stroke="#6bbdb2" stroke-width="3" stroke-linecap="round"/>`);
    // cou, tête, cheveux
    s.push(`<rect x="146" y="76" width="28" height="30" rx="10" fill="url(#ecgSkin2)" stroke="#d7a483" stroke-width="3"/>`);
    s.push(`<circle cx="160" cy="52" r="34" fill="url(#ecgSkin2)" stroke="#d7a483" stroke-width="3"/>`);
    s.push(`<path d="M 124 50 Q 124 14 160 14 Q 196 14 196 50 Q 190 30 160 28 Q 130 30 124 50 Z" fill="#e4e7ec" stroke="#b8c0cc" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.push(`<circle cx="124" cy="60" r="12" fill="#e4e7ec" stroke="#b8c0cc" stroke-width="2.4"/><circle cx="196" cy="60" r="12" fill="#e4e7ec" stroke="#b8c0cc" stroke-width="2.4"/>`);
    s.push(`<path d="M 144 52 q 6 5 12 0 M 164 52 q 6 5 12 0" fill="none" stroke="#5b4a52" stroke-width="2.6" stroke-linecap="round"/><path d="M 150 68 q 10 8 20 0" fill="none" stroke="#c9776b" stroke-width="2.6" stroke-linecap="round"/>`);
    // côtés
    s.push(`<text x="14" y="28" font-size="16" font-weight="800" fill="#7a5a34" font-family="inherit">D</text><text x="306" y="28" text-anchor="end" font-size="16" font-weight="800" fill="#7a5a34" font-family="inherit">G</text>`);
    // zones cliquables
    Object.keys(LIMB).forEach(z => {
      const L = LIMB[z], occupied = Object.keys(P).some(k => P[k] && P[k].zone === z);
      s.push(`<g class="ecg-zone" data-zone="${z}"><circle cx="${L.x}" cy="${L.y}" r="${occupied ? 26 : 28}" fill="rgba(37,99,235,.10)" stroke="#2563eb" stroke-width="2" stroke-dasharray="5 4"/>
        <circle cx="${L.x}" cy="${L.y}" r="34" fill="transparent"/></g>`);
      if (o.labels) {
        const left = z === 'cheville_d', right = z === 'cheville_g';
        const tx = left ? L.x - 38 : (right ? L.x + 38 : L.x), ty = (left || right) ? L.y + 4 : L.y + 48, an = left ? 'end' : (right ? 'start' : 'middle');
        s.push(`<text x="${tx}" y="${ty}" text-anchor="${an}" font-size="11" font-weight="700" fill="#1d4ed8" stroke="#fdf6e9" stroke-width="3" paint-order="stroke" font-family="inherit">${L.name}</text>`);
      }
    });
    Object.keys(P).forEach(k => { if (P[k]) { const L = LIMB[P[k].zone]; s.push(marker(k, L.x, L.y, P[k].state, { r: 13, fs: 11 })); } });
    s.push('</svg>');
    return s.join('');
  }

  return { MID, D0, D_MCL, D_AAL, D_MAL, LOUIS_Y, RIB_Y, ribY, icsCenter, locate, describe, ordF, COL, COLNAME, LIMB, thorax, body, marker };
})();
