// ui/tp_art.js — dessins schématiques des gestes de friction hydro-alcoolique (App.TpArt)
// Schémas simplifiés (pas des photos) : la zone qui frotte est colorée, la flèche montre le mouvement.
'use strict';
window.App = window.App || {};

App.TpArt = (() => {
  const SK = 'var(--tp-skin,#f4cfae)', SK2 = 'var(--tp-skin2,#e3b48b)', LN = 'var(--tp-skinline,#b9825a)', HL = 'var(--tp-hl,#2563eb)', AR = 'var(--tp-arrow,#dc2626)';
  const cap = (x, y, w, h, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${SK}" stroke="${LN}" stroke-width="1.4" ${extra || ''}/>`;
  const hl = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r == null ? 6 : r}" fill="${HL}" fill-opacity=".38" stroke="${HL}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
  const arrow = (d, mark) => `<path d="${d}" fill="none" stroke="${AR}" stroke-width="2.4" stroke-linecap="round" marker-end="url(#tp-ah)" ${mark || ''}/>`;
  const defs = `<defs><marker id="tp-ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${AR}"/></marker></defs>`;

  // Une main : paume (36×40) + 4 doigts + pouce. Origine au centre de la paume, doigts vers le haut.
  // opts : { back (dos de la main : ongles), curl (doigts repliés), thumb ('out'|'in'|'hide'), side (-1 pouce à gauche, 1 à droite) }
  function hand(x, y, rot, o) {
    o = o || {}; const s = o.side === 1 ? -1 : 1;
    const fh = o.curl ? [14, 16, 15, 12] : [30, 36, 34, 28];
    let g = `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s} 1)">`;
    if (o.thumb !== 'hide') g += `<g transform="rotate(${o.thumb === 'in' ? -10 : -38} -16 8)">${cap(-31, -6, 10, 28)}</g>`;
    [-16, -6, 4, 14].forEach((fx, i) => { g += cap(fx, -18 - fh[i] + 6, 9, fh[i] + 4); });
    g += `<rect x="-19" y="-18" width="38" height="40" rx="13" fill="${SK}" stroke="${LN}" stroke-width="1.4"/>`;
    if (o.back) {
      [-16, -6, 4, 14].forEach((fx, i) => { g += `<ellipse cx="${fx + 4.5}" cy="${-18 - fh[i] + 12}" rx="3" ry="3.6" fill="#fff" fill-opacity=".75" stroke="${LN}" stroke-width=".8"/>`; });
      g += `<g fill="${SK2}" opacity=".7"><circle cx="-12" cy="-10" r="2.2"/><circle cx="-4" cy="-12" r="2.2"/><circle cx="4" cy="-12" r="2.2"/><circle cx="12" cy="-10" r="2.2"/></g>`;
    } else {
      g += `<path d="M-12 4 Q0 14 12 2" fill="none" stroke="${LN}" stroke-width="1" opacity=".7"/><path d="M-9 -6 Q-2 2 8 -4" fill="none" stroke="${LN}" stroke-width="1" opacity=".5"/>`;
    }
    return g + '</g>';
  }
  const frame = (inner, label) => `<svg class="tp-art" viewBox="0 0 240 150" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs}<rect width="240" height="150" rx="14" fill="var(--tp-bg,#eef4fb)"/>${inner}</svg>`;

  const ART = {
    dose() {
      return frame(`
        <rect x="104" y="10" width="34" height="46" rx="7" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.6"/>
        <rect x="112" y="20" width="18" height="16" rx="3" fill="#fff" stroke="#3b82f6" stroke-width="1"/>
        <path d="M121 10 V3 H146 V8" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <path d="M146 8 V16" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <g fill="#38bdf8"><path d="M146 24 q-4 7 0 9 q4 -2 0 -9z"/><path d="M146 38 q-4 7 0 9 q4 -2 0 -9z" opacity=".8"/></g>
        <g transform="translate(146 110)"><ellipse cx="0" cy="8" rx="38" ry="22" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>
        <ellipse cx="0" cy="10" rx="24" ry="11" fill="${HL}" fill-opacity=".3" stroke="${HL}" stroke-dasharray="3 2"/>
        <ellipse cx="0" cy="12" rx="11" ry="5" fill="#bae6fd" stroke="#38bdf8" stroke-width="1"/></g>
        <text x="30" y="75" font-size="11" fill="var(--gray-700,#374151)" font-weight="700">1 à 2 doses</text>
        <text x="30" y="90" font-size="9.5" fill="var(--gray-600,#4b5563)">creux de la main</text>`, 'Distributeur de produit hydro-alcoolique et paume en creux');
    },
    a() {
      return frame(`${hand(100, 92, 0, { side: 1 })}${hand(140, 92, 0, { side: -1 })}${hl(86, 78, 68, 44, 10)}
        ${arrow('M178 70 V112')}${arrow('M178 112 V70')}<text x="172" y="135" font-size="10" fill="var(--gray-600,#4b5563)">frotter</text>`, 'Paume contre paume');
    },
    b() {
      return frame(`${hand(100, 100, 90, { back: true, side: -1 })}${hl(86, 82, 40, 36, 8)}${hand(120, 78, -90, { side: 1 })}
        ${arrow('M82 40 H150')}${arrow('M150 56 H82')}<text x="40" y="132" font-size="10" fill="var(--gray-700,#374151)" font-weight="700">puis on inverse les mains</text>`, 'Paume sur le dos de l\'autre main');
    },
    c() {
      return frame(`${hand(104, 104, -14, { side: -1 })}${hand(116, 48, 166, { side: -1 })}
        <g fill="${HL}" fill-opacity=".45" stroke="${HL}" stroke-dasharray="3 2"><ellipse cx="96" cy="76" rx="4.5" ry="8"/><ellipse cx="108" cy="74" rx="4.5" ry="8"/><ellipse cx="120" cy="72" rx="4.5" ry="8"/></g>
        ${arrow('M170 50 L186 96')}${arrow('M186 96 L170 50')}<text x="150" y="122" font-size="10" fill="var(--gray-600,#4b5563)">doigts entrelacés</text>`, 'Espaces entre les doigts, doigts entrelacés');
    },
    d() {
      return frame(`${hand(116, 112, -90, { side: 1 })}${hl(80, 92, 60, 44, 8)}${hand(124, 74, 180, { curl: true, back: true, thumb: 'hide' })}
        ${arrow('M170 110 H196')}${arrow('M196 118 H170')}<text x="150" y="140" font-size="10" fill="var(--gray-600,#4b5563)">doigts emboîtés</text>`, 'Dos des doigts contre la paume de l\'autre main');
    },
    e() {
      return frame(`<rect x="86" y="72" width="62" height="54" rx="20" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>
        <path d="M96 90 H138 M96 102 H138 M96 114 H138" stroke="${LN}" stroke-width="1.2" opacity=".7"/>
        <rect x="108" y="22" width="18" height="58" rx="9" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>${hl(108, 22, 18, 52, 9)}
        <path d="M150 38 a24 24 0 1 1 -2 30" fill="none" stroke="${AR}" stroke-width="2.4" marker-end="url(#tp-ah)"/>
        <text x="20" y="46" font-size="10" fill="var(--gray-700,#374151)" font-weight="700">le pouce tourne</text><text x="20" y="60" font-size="10" fill="var(--gray-600,#4b5563)">dans la paume</text>`, 'Pouce frotté par rotation dans la paume opposée');
    },
    f() {
      return frame(`${hand(108, 106, -90, { side: 1 })}${hl(80, 90, 46, 38, 8)}
        <path d="M106 24 L124 70 L90 70 Z" fill="${SK}" stroke="${LN}" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="107" cy="70" rx="17" ry="6" fill="${HL}" fill-opacity=".45" stroke="${HL}" stroke-dasharray="3 2"/>
        <path d="M148 80 a22 12 0 1 0 -2 14" fill="none" stroke="${AR}" stroke-width="2.4" marker-end="url(#tp-ah)"/>
        <text x="228" y="26" text-anchor="end" font-size="10" fill="var(--gray-700,#374151)" font-weight="700">pulpe des doigts</text><text x="228" y="40" text-anchor="end" font-size="10" fill="var(--gray-600,#4b5563)">en rotation</text>`, 'Pulpe des doigts frottée par rotation dans la paume opposée');
    },
    g() {
      return frame(`<rect x="40" y="62" width="150" height="26" rx="13" fill="${SK}" stroke="${LN}" stroke-width="1.5"/>${hl(52, 62, 40, 26, 10)}
        <path d="M30 95 q10 10 10 20" fill="none" stroke="${LN}" stroke-width="1.2" opacity=".0"/>
        <rect x="88" y="44" width="52" height="62" rx="22" fill="${SK}" stroke="${LN}" stroke-width="1.6"/>
        <path d="M98 60 H130 M98 74 H130 M98 88 H130" stroke="${LN}" stroke-width="1.2" opacity=".7"/>
        <path d="M156 40 a30 30 0 0 1 4 52" fill="none" stroke="${AR}" stroke-width="2.4" marker-end="url(#tp-ah)"/>
        <text x="20" y="130" font-size="10" fill="var(--gray-700,#374151)" font-weight="700">on tourne autour du poignet</text>`, 'Poignets frottés par rotation');
    },
    sech() {
      return frame(`${hand(88, 96, 12, { side: 1 })}${hand(152, 96, -12, { side: -1 })}
        <g fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M104 28 q6 -8 12 0 t12 0"/><path d="M96 40 q6 -8 12 0 t12 0"/><path d="M112 16 q6 -8 12 0 t12 0"/></g>
        <circle cx="206" cy="36" r="22" fill="#fff" stroke="${HL}" stroke-width="2"/><path d="M206 36 V22 M206 36 L216 42" stroke="${HL}" stroke-width="2.4" stroke-linecap="round"/>
        <text x="190" y="72" font-size="10" fill="var(--gray-700,#374151)" font-weight="700">20-30 s</text>`, 'Frotter jusqu\'au séchage complet, 20 à 30 secondes');
    }
  };
  function svg(id) { return ART[id] ? ART[id]() : ''; }
  return { svg, ids: Object.keys(ART) };
})();
