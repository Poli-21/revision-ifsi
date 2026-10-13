// core/sim_ecg.js — Atelier ECG : poser les 10 électrodes d'un ECG 12 dérivations, enregistrer, contrôler le tracé.
// Fonctionne hors ligne. Le tracé est SIMULÉ à but pédagogique (il montre l'effet d'une erreur de pose) :
// ce n'est pas un vrai ECG et il ne sert pas à l'interprétation.
// Contexte France : couleurs CEI (rouge, jaune, vert, noir ; V1 à V6 = rouge, jaune, vert, marron, noir, violet),
// défilement 25 mm/s, 10 mm/mV, secteur à 50 Hz.
'use strict';
window.App = window.App || {};

App.SimECG = (() => {
  const Art = () => App.SimECGArt;
  const KEY = 'ifsi_simecg_v1';
  const PATIENT0 = { nom: 'LEFÈVRE', prenom: 'Geneviève', dn: '12/03/1942', age: 84 };
  // Contexte facultatif donné par un scénario de simulation : { patient, rate, situation, onDone(r), onBack() }.
  // Sans contexte (atelier ouvert depuis la liste), l'atelier se comporte exactement comme avant.
  let CTX = null;
  const PATIENT = new Proxy({}, { get: (_, k) => ((CTX && CTX.patient) || PATIENT0)[k] });
  const LIMBS = ['RA', 'LA', 'LL', 'RL'];
  const VS = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const ZONE_NAME = { poignet_d: 'poignet droit', poignet_g: 'poignet gauche', cheville_g: 'cheville gauche', cheville_d: 'cheville droite' };
  const LIMB_INFO = {
    RA: { color: 'rouge', site: 'bras droit', zone: 'poignet_d', hint: "Le câble rouge se pose sur le bras droit (poignet droit). Vue de face, la droite de la patiente est à gauche de l'image." },
    LA: { color: 'jaune', site: 'bras gauche', zone: 'poignet_g', hint: "Le câble jaune se pose sur le bras gauche (poignet gauche), donc à droite de l'image." },
    LL: { color: 'vert', site: 'jambe gauche', zone: 'cheville_g', hint: "Le câble vert se pose sur la jambe gauche (cheville gauche)." },
    RL: { color: 'noir', site: 'jambe droite', zone: 'cheville_d', hint: "Le câble noir (neutre, la « terre ») se pose sur la jambe droite." }
  };
  const V_HELP = {
    V1: "V1 : 4e espace intercostal droit, au bord droit du sternum.",
    V2: "V2 : 4e espace intercostal gauche, au bord gauche du sternum (en face de V1).",
    V3: "V3 : à mi-chemin entre V2 et V4.",
    V4: "V4 : 5e espace intercostal gauche, sur la ligne médio-claviculaire.",
    V5: "V5 : sur la même horizontale que V4, sur la ligne axillaire antérieure.",
    V6: "V6 : sur la même horizontale que V4, sur la ligne axillaire moyenne."
  };

  // ── Préparation : actions à cocher ──
  const PREP = [
    { id: 'p_id', ok: true, t: "Vérifier la prescription médicale et l'identité de la patiente (nom, prénom, date de naissance)", why: "Identitovigilance : l'ECG doit être attribué à la bonne personne, et il se fait sur prescription." },
    { id: 'x_marche', ok: false, t: "Faire marcher la patiente quelques minutes pour « chauffer le cœur » avant l'ECG", why: "L'ECG standard se fait au repos. La marche change la fréquence cardiaque et fatigue la patiente (l'épreuve d'effort est un autre examen)." },
    { id: 'p_fric', ok: true, t: "Faire une hygiène des mains (friction hydro-alcoolique)", why: "Geste d'hygiène avant tout contact avec la patiente et son matériel." },
    { id: 'p_info', ok: true, t: "Expliquer le geste, recueillir l'accord de la patiente et préserver son intimité (porte, rideau)", why: "Information et consentement ; le thorax est dégagé, donc l'intimité compte." },
    { id: 'p_pos', ok: true, t: "Installer la patiente allongée, détendue, bras le long du corps, jambes non croisées", why: "Une patiente crispée ou mal installée fait des tremblements musculaires qui parasitent le tracé.", art: 'tremor' },
    { id: 'x_vet', ok: false, t: "Poser les électrodes à travers la chemise de nuit pour ne pas gêner la patiente", why: "Les électrodes se posent sur la peau nue, thorax et membres dégagés : sinon le contact est mauvais.", art: 'wander' },
    { id: 'p_peau', ok: true, t: "Préparer la peau : propre et sèche (dégraissée à l'alcool si besoin, rasée si pilosité importante)", why: "Une peau grasse, humide ou poilue donne un mauvais contact : la ligne de base ondule ou le tracé est parasité. (Rasage : selon le protocole de ton service.)", art: 'wander' },
    { id: 'p_elec', ok: true, t: "Vérifier que les électrodes sont en bon état (gel humide, non périmées)", why: "Un gel sec ou des électrodes périmées donnent un mauvais contact.", art: 'wander' },
    { id: 'x_parle', ok: false, t: "Discuter avec la patiente pendant l'enregistrement pour la rassurer", why: "Parler fait bouger les muscles et crée des parasites : on rassure avant, puis on demande le silence.", art: 'tremor' },
    { id: 'p_still', ok: true, t: "Demander à la patiente de rester immobile et de ne pas parler pendant l'enregistrement", why: "Mouvements et paroles créent des artefacts musculaires.", art: 'tremor' }
  ];
  const PREP_GOOD = PREP.filter(p => p.ok).length;

  // ═══════════ Modèle du tracé simulé ═══════════
  // Cœur = un vecteur (dipôle) dans le plan frontal pour chaque onde ; la dérivation mesure sa projection.
  const HV = { P: { m: 0.15, a: 55 }, q: { m: 0.14, a: 150 }, R: { m: 1.30, a: 60 }, S: { m: 0.10, a: -125 }, T: { m: 0.42, a: 45 } };
  const WAVES = ['P', 'q', 'R', 'S', 'T'];
  // Positions (plan frontal, y vers le bas) : triangle d'Einthoven. Les deux jambes ont le même potentiel.
  const SITE = { RA: [-0.5, -0.866], LA: [0.5, -0.866], LL: [0, 0] };
  const ZONE_SITE = { poignet_d: 'RA', poignet_g: 'LA', cheville_g: 'LL', cheville_d: 'LL' };
  const pot = (w, site) => { const v = HV[w], a = v.a * Math.PI / 180; return v.m * (Math.cos(a) * SITE[site][0] + Math.sin(a) * SITE[site][1]); };
  // Gabarits précordiaux (mV) : [P, q, R, S, T]
  const VT = [
    [0.06, 0.00, 0.18, -0.95, -0.08],
    [0.09, 0.00, 0.40, -1.20, 0.40],
    [0.10, 0.00, 0.80, -0.80, 0.55],
    [0.12, -0.05, 1.40, -0.35, 0.55],
    [0.12, -0.12, 1.50, -0.12, 0.45],
    [0.12, -0.14, 1.15, -0.05, 0.35]
  ];
  const UA = [[-24, 0], [24, 1], [54, 2], [85, 3], [140, 4], [160, 5]];
  function uOf(d) {
    if (d <= UA[0][0]) return 0;
    for (let i = 1; i < UA.length; i++) if (d <= UA[i][0]) { const t = (d - UA[i - 1][0]) / (UA[i][0] - UA[i - 1][0]); return UA[i - 1][1] + t * (UA[i][1] - UA[i - 1][1]); }
    return 5;
  }
  function vComps(x) {
    const u = uOf(x - Art().MID), i = Math.min(4, Math.floor(u)), t = u - i, o = {};
    WAVES.forEach((w, j) => { o[w] = VT[i][j] + t * (VT[i + 1][j] - VT[i][j]); });
    return o;
  }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const LEADS = ['D1', 'D2', 'D3', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const LAYOUT = [['D1', 'aVR', 'V1', 'V4'], ['D2', 'aVL', 'V2', 'V5'], ['D3', 'aVF', 'V3', 'V6']];

  // Construit l'enregistrement à partir de ce que l'étudiant a réellement posé et réglé
  function buildRecording(S) {
    const rate = (CTX && CTX.rate) || 72, RR = 60 / rate, rnd = mulberry(1942 + S.attempt * 7);
    const beats = []; for (let t = 0.5; t < 24; t += RR * (1 + (rnd() - 0.5) * 0.04)) beats.push(t);
    const rec = { beats, RR, comps: {}, off: {}, offWhy: {}, noise: { tremor: !!S.art.tremor, wander: !!S.art.wander, hz50: false, hz50big: false }, speed: S.set.speed, gain: S.set.gain, seed: rnd() };
    const L = S.limbs, V = S.V;
    // câbles des membres → ce que « voit » l'appareil
    const inp = {};
    ['RA', 'LA', 'LL'].forEach(k => { inp[k] = L[k] ? ZONE_SITE[L[k]] : null; });
    const miss = ['RA', 'LA', 'LL'].filter(k => !inp[k]);
    if (!L.RL) { rec.noise.hz50 = true; rec.noise.hz50big = true; }
    const per = {};
    WAVES.forEach(w => {
      const ra = inp.RA ? pot(w, inp.RA) : 0, la = inp.LA ? pot(w, inp.LA) : 0, ll = inp.LL ? pot(w, inp.LL) : 0;
      per[w] = { D1: la - ra, D2: ll - ra, D3: ll - la, aVR: ra - (la + ll) / 2, aVL: la - (ra + ll) / 2, aVF: ll - (ra + la) / 2 };
    });
    ['D1', 'D2', 'D3', 'aVR', 'aVL', 'aVF'].forEach(n => {
      rec.comps[n] = {}; WAVES.forEach(w => { rec.comps[n][w] = per[w][n]; });
      const need = n === 'D1' ? ['RA', 'LA'] : n === 'D2' ? ['RA', 'LL'] : n === 'D3' ? ['LA', 'LL'] : ['RA', 'LA', 'LL'];
      const lost = need.filter(k => miss.indexOf(k) >= 0);
      if (lost.length) { rec.off[n] = true; rec.offWhy[n] = 'câble ' + LIMB_INFO[lost[0]].color + ' non connecté'; }
    });
    VS.forEach(k => {
      if (!V[k]) { rec.off[k] = true; rec.offWhy[k] = 'électrode ' + k + ' non connectée'; rec.comps[k] = { P: 0, q: 0, R: 0, S: 0, T: 0 }; }
      else rec.comps[k] = vComps(V[k].x);
      if (miss.length) { rec.off[k] = true; rec.offWhy[k] = 'câble ' + LIMB_INFO[miss[0]].color + ' non connecté'; }
    });
    return rec;
  }
  const gauss = (x, mu, sg) => Math.exp(-0.5 * ((x - mu) / sg) * ((x - mu) / sg));
  function sample(rec, lead, t, ph) {
    const c = rec.comps[lead];
    let v = 0;
    if (!rec.off[lead]) {
      const tc = 0.13 + 0.17 * rec.RR;
      for (let i = 0; i < rec.beats.length; i++) {
        const dt = t - rec.beats[i];
        if (dt < -0.35 || dt > 0.6) continue;
        v += c.P * gauss(dt, -0.175, 0.024) + c.q * gauss(dt, -0.030, 0.008) + c.R * gauss(dt, 0, 0.0115) + c.S * gauss(dt, 0.030, 0.012) + c.T * gauss(dt, tc, 0.052);
      }
    }
    const n = rec.noise;
    if (n.wander) v += 0.24 * Math.sin(2 * Math.PI * 0.27 * t + ph) + 0.09 * Math.sin(2 * Math.PI * 0.11 * t + ph * 2);
    if (n.tremor) v += 0.055 * Math.sin(2 * Math.PI * 9.3 * t + ph) + 0.045 * Math.sin(2 * Math.PI * 11.7 * t + ph * 3) + 0.035 * Math.sin(2 * Math.PI * 14.9 * t + ph * 5);
    if (n.hz50) v += (n.hz50big ? 0.20 : 0.06) * Math.sin(2 * Math.PI * 50 * t + ph);
    v += 0.012 * Math.sin(2 * Math.PI * 31.7 * t + ph * 7);
    return v;
  }

  // Dessin du tracé sur papier millimétré : 3 × 4 dérivations + bande de rythme (D2)
  function tracingSvg(rec, S) {
    const spd = rec.speed, gain = rec.gain, X0 = 12, W = 250, ROWS = [24, 55, 86], RY = 122, H = 142;
    const s = [];
    s.push(`<svg class="ecg-paper" viewBox="0 0 ${X0 + W + 2} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tracé ECG simulé, 12 dérivations">`);
    s.push(`<defs><pattern id="ecgG1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#f3b9b9" stroke-width=".13"/></pattern>
      <pattern id="ecgG5" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#ecgG1)"/><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#e58a8a" stroke-width=".3"/></pattern></defs>`);
    s.push(`<rect width="${X0 + W + 2}" height="${H}" fill="#fff6f6"/><rect width="${X0 + W + 2}" height="${H}" fill="url(#ecgG5)"/>`);
    s.push(`<text x="2" y="7" font-size="4" font-weight="700" fill="#5b2c2c" font-family="inherit">${PATIENT.nom} ${PATIENT.prenom} · né(e) le ${PATIENT.dn} · ${spd} mm/s · ${gain} mm/mV · 50 Hz</text>`);
    const path = (lead, x0, base, t0, len, ph) => {
      const n = Math.round(len * spd * 10), pts = [];   // un point tous les 0,1 mm
      for (let i = 0; i <= n; i++) {
        const xm = i / 10, t = t0 + xm / spd;
        const y = base - sample(rec, lead, t, ph) * gain;
        pts.push((x0 + xm).toFixed(1) + ',' + y.toFixed(2));
      }
      return 'M' + pts.join(' L');
    };
    const cal = base => `<path d="M 2 ${base} L 3 ${base} L 3 ${base - gain} L 8 ${base - gain} L 8 ${base} L 10 ${base}" fill="none" stroke="#1f2937" stroke-width=".45" stroke-linejoin="round"/>`;
    LAYOUT.forEach((row, r) => {
      s.push(cal(ROWS[r]));
      row.forEach((lead, c) => {
        const x0 = X0 + c * 62.5, t0 = c * 2.5, ph = LEADS.indexOf(lead) * 1.7;
        s.push(`<path d="${path(lead, x0, ROWS[r], t0, 62.5 / spd, ph)}" fill="none" stroke="#111827" stroke-width=".42" stroke-linejoin="round" stroke-linecap="round"/>`);
        s.push(`<text x="${x0 + 1}" y="${ROWS[r] - 15.5}" font-size="4.2" font-weight="800" fill="#111827" font-family="inherit">${lead}</text>`);
        if (c > 0) s.push(`<line x1="${x0}" y1="${ROWS[r] - 3}" x2="${x0}" y2="${ROWS[r] + 3}" stroke="#111827" stroke-width=".3"/>`);
        if (rec.off[lead]) s.push(`<text x="${x0 + 3}" y="${ROWS[r] - 5}" font-size="3.4" font-weight="800" fill="#b91c1c" font-family="inherit">${rec.offWhy[lead]}</text>`);
      });
    });
    s.push(cal(RY));
    s.push(`<path d="${path('D2', X0, RY, 0, 250 / spd, 5.1)}" fill="none" stroke="#111827" stroke-width=".42" stroke-linejoin="round" stroke-linecap="round"/>`);
    s.push(`<text x="${X0 + 1}" y="${RY - 15.5}" font-size="4.2" font-weight="800" fill="#111827" font-family="inherit">D2 (rythme)</text>`);
    s.push('</svg>');
    return s.join('');
  }

  // ═══════════ Évaluation de ce que l'étudiant a posé ═══════════
  function evalLimbs(L) {
    const items = {}; let nOk = 0;
    LIMBS.forEach(k => {
      const z = L[k], inf = LIMB_INFO[k];
      if (!z) { items[k] = { ok: false, msg: 'Le câble ' + inf.color + " n'est pas posé." }; return; }
      if (z === inf.zone) { items[k] = { ok: true, msg: 'Câble ' + inf.color + ' : ' + inf.site + ' ✓' }; nOk++; return; }
      items[k] = { ok: false, msg: 'Tu as posé le câble ' + inf.color + ' sur le ' + ZONE_NAME[z] + '. ' + inf.hint };
    });
    const extra = [];
    if (L.RA === 'poignet_g' && L.LA === 'poignet_d') extra.push("Rouge et jaune sont inversés : sur le tracé, la dérivation D1 sera « à l'envers » (onde P négative en D1).");
    if (L.LL === 'cheville_d' && L.RL === 'cheville_g') extra.push("Vert et noir sont inversés : ça ne se voit presque pas sur le tracé, mais ce n'est pas le bon branchement (le noir est la terre).");
    if (L.RA === 'cheville_d' && L.RL === 'poignet_d') extra.push("Rouge et noir sont inversés : la dérivation D2 devient une ligne plate, signe typique d'un branchement inversé.");
    return { items, nOk, extra };
  }
  function evalThorax(V) {
    const a = Art(), M = a.MID, items = {}; let nOk = 0;
    const exp2 = { x: M + 24, y: a.icsCenter(4, 24) }, exp4 = { x: M + 85, y: a.icsCenter(5, 85) };
    const v2 = V.V2 || exp2, v4 = V.V4 || exp4, y4 = v4.y;
    const inIcs = (p, k) => { const d = Math.abs(p.x - M); return p.y >= a.ribY(k, d) + 1 && p.y <= a.ribY(k + 1, d) - 1; };
    const icsNum = p => { const L = a.locate(p.x, p.y); return L; };
    VS.forEach(k => {
      const p = V[k];
      if (!p) { items[k] = { ok: false, msg: k + " n'est pas posée. " + V_HELP[k] }; return; }
      let xOk = false, yOk = false, hint = '';
      if (k === 'V1') { xOk = Math.abs(p.x - (M - 24)) <= 16; yOk = inIcs(p, 4); }
      if (k === 'V2') { xOk = Math.abs(p.x - (M + 24)) <= 16; yOk = inIcs(p, 4); }
      if (k === 'V4') { xOk = Math.abs(p.x - (M + 85)) <= 17; yOk = inIcs(p, 5); }
      if (k === 'V3') { const m = { x: (v2.x + v4.x) / 2, y: (v2.y + v4.y) / 2 }; xOk = Math.abs(p.x - m.x) <= 17; yOk = Math.abs(p.y - m.y) <= 14; }
      if (k === 'V5') { xOk = Math.abs(p.x - (M + 140)) <= 11; yOk = Math.abs(p.y - y4) <= 12; }
      if (k === 'V6') { xOk = Math.abs(p.x - (M + 160)) <= 11; yOk = Math.abs(p.y - y4) <= 12; }
      const ok = xOk && yOk;
      if (ok) { items[k] = { ok: true, msg: k + ' ✓ ' + V_HELP[k].replace(/^V\d : /, '') }; nOk++; return; }
      const where = a.describe(p.x, p.y);
      if (k === 'V1' || k === 'V2' || k === 'V4') {
        const want = k === 'V4' ? 5 : 4;
        if (xOk && !yOk) hint = "Le côté est bon, mais pas l'espace : compte à partir de l'angle sternal (2e côte → 2e espace → 3e côte → …) pour arriver au " + a.ordF(want) + ' espace intercostal.';
        else if (!xOk && yOk) hint = k === 'V4' ? "L'espace est bon, mais pas la ligne : la ligne médio-claviculaire passe au milieu de la clavicule." : "L'espace est bon, mais il faut être juste au bord du sternum, du bon côté.";
        else hint = 'Reprends le repérage depuis l\'angle sternal.';
      } else if (k === 'V3') hint = "V3 se place au milieu du trajet entre V2 et V4 (pose-les d'abord)." ;
      else {
        if (xOk && !yOk) hint = k + " ne suit pas l'espace intercostal : il se place sur l'horizontale qui passe par V4.";
        else if (!xOk && yOk) hint = "Bonne horizontale, mais pas la bonne ligne : " + (k === 'V5' ? "ligne axillaire antérieure (pli avant de l'aisselle)." : "ligne axillaire moyenne (milieu de l'aisselle).");
        else hint = "Place-la sur l'horizontale de V4, sur la " + (k === 'V5' ? 'ligne axillaire antérieure.' : 'ligne axillaire moyenne.');
      }
      let said = 'Tu as posé ' + k + ' ' + where + '. ';
      if (k === 'V5' || k === 'V6') {
        const Lc = a.locate(p.x, p.y), dy = p.y - y4;
        said = 'Tu as posé ' + k + ' sur la ' + (Lc.col.indexOf('ligne') === 0 ? Lc.col : 'zone « ' + Lc.col + ' »') + (Math.abs(dy) <= 12 ? ', à la bonne hauteur. ' : (dy < 0 ? ', plus haut que V4. ' : ', plus bas que V4. '));
      }
      items[k] = { ok: false, msg: said + V_HELP[k] + ' ' + hint };
    });
    const extra = [];
    if (V.V1 && V.V2 && V.V1.x > V.V2.x) extra.push("V1 et V2 sont inversés : V1 est à droite du sternum, V2 à gauche.");
    if (V.V5 && V.V6 && V.V5.x > V.V6.x) extra.push("V5 et V6 sont inversés : V5 est plus en avant (ligne axillaire antérieure), V6 plus sur le côté.");
    return { items, nOk, extra };
  }
  function evalPrep(sel) {
    let good = 0, bad = 0; const tags = { tremor: false, wander: false };
    PREP.forEach(p => {
      const on = !!sel[p.id];
      if (p.ok && on) good++;
      if (!p.ok && on) bad++;
      if (p.art) { if ((p.ok && !on) || (!p.ok && on)) tags[p.art] = true; }
    });
    return { good, bad, tags, pts: 20 * Math.max(0, good - bad) / PREP_GOOD };
  }

  // Contrôle qualité : ce que l'on voit réellement sur le tracé produit
  const QC = [
    { id: 'p', q: "L'onde P est-elle positive en D1 et en D2 ?", yes: "Oui : sur un ECG correctement branché, l'onde P est positive en D1 et D2.", no: "Non : une onde P négative en D1 évoque une inversion des câbles des bras ; une D2 plate évoque une inversion avec le câble noir." },
    { id: 'avr', q: "En aVR, le complexe QRS est-il nettement négatif (tracé « à l'envers ») ?", yes: "Oui : aVR regarde le cœur « de dos » : tout y est normalement négatif.", no: "Non : si aVR n'est pas négatif, vérifie le branchement des bras." },
    { id: 'prog', q: "De V1 à V6, les ondes R grandissent-elles progressivement (et les S diminuent) ?", yes: "Oui : c'est la progression harmonieuse de l'onde R, signe de précordiales bien posées.", no: "Non : une progression anormale peut venir de précordiales mal placées ou inversées, ou d'une électrode manquante." },
    { id: 'clean', q: "Le tracé est-il propre (ni tremblements, ni ligne de base qui ondule, ni parasites) ?", yes: "Oui : tracé exploitable.", no: "Non : tremblements = patiente crispée ou qui bouge ; ligne ondulante = mauvais contact ; parasites réguliers = problème de terre (câble noir) ou matériel électrique proche." },
    { id: 'all', q: "Les 12 dérivations sont-elles toutes enregistrées (aucune ligne plate) ?", yes: "Oui : toutes les dérivations sont présentes.", no: "Non : une ligne plate avec un message d'alerte = électrode ou câble non connecté." },
    { id: 'cal', q: "L'étalonnage est-il correct : 25 mm/s et créneau de 10 mm de haut au début de chaque ligne ?", yes: "Oui : 25 mm/s et 10 mm/mV, c'est le standard.", no: "Non : lis la vitesse et la sensibilité en haut du papier, et regarde la hauteur du créneau ; il faut 25 mm/s et 10 mm/mV." }
  ];
  function truth(rec) {
    const c = rec.comps, off = rec.off, any = k => Object.keys(off).length > 0;
    const net = n => c[n].R + c[n].q + c[n].S;
    const ok = {};
    ok.p = !off.D1 && !off.D2 && c.D1.P > 0.04 && c.D2.P > 0.04;
    ok.avr = !off.aVR && net('aVR') < -0.3;
    ok.prog = !VS.some(k => off[k]) && c.V1.R < c.V2.R && c.V2.R < c.V3.R && c.V3.R < c.V4.R && c.V6.R > c.V1.R;
    ok.clean = !(rec.noise.tremor || rec.noise.wander || rec.noise.hz50);
    ok.all = Object.keys(off).length === 0;
    ok.cal = rec.speed === 25 && rec.gain === 10;
    return ok;
  }

  // ═══════════ État ═══════════
  let hist = { v: 1, attempts: [] };
  function _loadH() { try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && Array.isArray(r.attempts)) hist = r; } catch (e) {} }
  function _saveH() { try { localStorage.setItem(KEY, JSON.stringify(hist)); } catch (e) {} }
  let S = null, _timers = [];
  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _clr = () => { _timers.forEach(t => { clearInterval(t); clearTimeout(t); }); _timers = []; };

  const STEPS = [['prep', 'Préparer'], ['membres', 'Membres'], ['thorax', 'Thorax'], ['enreg', 'Enregistrer'], ['controle', 'Contrôler']];
  function _fresh(mode) {
    return {
      step: 'prep', mode, started: Date.now(), secs: 0, attempt: 1,
      prep: { sel: {}, done: false, res: null },
      limbs: { RA: null, LA: null, LL: null, RL: null }, limbsFirst: null, limbsChecked: false, limbsFinal: null,
      V: { V1: null, V2: null, V3: null, V4: null, V5: null, V6: null }, thFirst: null, thChecked: false, thFinal: null, louis: false, louisTries: 0,
      sel: null, hint: '', verdictAt: null,
      art: { tremor: false, wander: false },
      set: { speed: 50, gain: 20 }, identity: false, setFirst: null,
      rec: null, recProg: 0, recording: false,
      qc: { answers: {}, revealed: false, first: null }, qcDone: false,
      redo: { limbs: 0, thorax: 0, set: 0, noise: 0 }
    };
  }

  // ── Entrée / sortie ──
  function card() {
    _loadH();
    const best = hist.attempts.reduce((m, a) => Math.max(m, a.score || 0), 0);
    return `<div class="sim-card ecg-card">
      <div class="sim-scn-head"><span class="sim-scn-ico">🫀</span><div>
        <div class="sim-scn-title">Atelier ECG : poser les électrodes <em class="sim-new">Nouveau</em></div>
        <div class="sim-chips"><span class="sim-chip">Geste technique</span><span class="sim-chip">Sur prescription médicale</span><span class="sim-chip">10 à 15 min</span></div>
      </div></div>
      <p class="sim-scn-desc">Prépare la patiente, pose toi-même les 4 électrodes des membres et les 6 précordiales sur un schéma du thorax (espaces intercostaux, lignes de repère), règle l'appareil, puis contrôle le tracé. Une erreur de pose se voit sur le tracé.</p>
      <div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.open()">Ouvrir l'atelier →</button>
      <span class="sim-muted sim-small">${hist.attempts.length ? hist.attempts.length + ' essai' + (hist.attempts.length > 1 ? 's' : '') + ' · meilleur score ' + best + '/100' : 'Fonctionne hors ligne'}</span></div>
    </div>`;
  }
  function open(ctx) {
    CTX = (ctx && typeof ctx === 'object' && ctx.patient) ? ctx : null;
    _loadH(); _clr();
    const root = _el('sim-root'); if (!root) return;
    S = null; _intro();
    _startTimer();
    try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {}
  }
  function back() {
    _clr(); S = null;
    const c = CTX; CTX = null;
    if (c && typeof c.onBack === 'function') { try { c.onBack(); return; } catch (e) {} }
    try { App.Sim.toList(); } catch (e) { App.Sim.open(); }
  }
  // Fin de l'atelier lancé depuis un scénario : on renvoie le score au scénario
  function done() {
    const c = CTX, r = S && S.bilan ? { score: S.bilan.total, secs: S.secs, mode: S.mode, tries: S.attempt } : null;
    _clr(); S = null; CTX = null;
    if (c && typeof c.onDone === 'function' && r) { try { c.onDone(r); return; } catch (e) {} }
    try { App.Sim.toList(); } catch (e) { App.Sim.open(); }
  }

  function _shell(inner, showSteps) {
    const root = _el('sim-root'); if (!root) return;
    const idx = S ? STEPS.findIndex(x => x[0] === S.step) : -1;
    const stepper = showSteps ? `<ol class="sim-stepper ecg-stepper" aria-label="Étapes">` + STEPS.map((x, i) => `<li class="${i < idx ? 'done' : (i === idx ? 'now' : '')}"><span class="sim-step-dot">${i < idx ? '✓' : (i + 1)}</span><span class="sim-step-lbl">${x[1]}</span></li>`).join('') + '</ol>' : '';
    root.innerHTML = `<div class="sim-wrap ecg-wrap" id="sim-ecg">
      <div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.SimECG.back()">${CTX ? '← Prescription' : '← Simulation'}</button><div class="sim-bar-title">🫀 Atelier ECG</div>${S ? '<span class="sim-bar-time" id="ecg-clock">' + _hms(S.secs) + '</span>' : ''}</div>
      ${stepper}${S && S.todo && S.todo.length && S.attempt > 1 && ['membres', 'thorax', 'enreg'].indexOf(S.step) >= 0 ? '<div class="sim-note ecg-todo">🔁 <b>Nouvel enregistrement : à corriger</b><ul class="sim-ul">' + S.todo.map(t => '<li>' + _esc(t) + '</li>').join('') + '</ul></div>' : ''}${inner}</div>`;
  }
  function _hms(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function _intro() {
    const last = hist.attempts.slice(-3).reverse();
    _shell(`<div class="sim-card">
      <h2 class="sim-title">Poser un ECG 12 dérivations</h2>
      <p class="sim-lead"><b>Situation.</b> ${CTX && CTX.situation ? _esc(CTX.situation) + ' ' : `${PATIENT.prenom} ${PATIENT.nom}, ${PATIENT.age} ans, est résidente en EHPAD. Le médecin traitant a prescrit un ECG de contrôle. `}Tu es l'étudiant(e) infirmier(ère) : tu prépares la résidente, tu poses les électrodes, tu règles l'appareil, tu enregistres puis tu vérifies que le tracé est exploitable avant de le transmettre. <i>(Patiente fictive.)</i></p>
      <h3 class="sim-h2">Choisis ton mode</h3>
      <div class="ecg-modes">
        <button class="ecg-mode" onclick="App.SimECG.start('guide')"><b>🧭 Guidé</b><span>Repères visibles sur le schéma (lignes, numéros d'espaces), vérification de chaque étape avec explication.</span></button>
        <button class="ecg-mode" onclick="App.SimECG.start('auto')"><b>🎯 Autonome</b><span>Schéma sans repères. Tes erreurs ne sont révélées que par le tracé et le bilan, comme sur le terrain.</span></button>
      </div>
      ${last.length ? '<h3 class="sim-h2">Mes derniers essais</h3><div class="sim-hist">' + last.map(a => `<div class="sim-hist-row"><span>${_esc(new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))}</span><span>${a.mode === 'auto' ? 'Autonome' : 'Guidé'}</span><span>${a.score}/100</span></div>`).join('') + '</div>' : ''}
    </div>
    <div class="sim-note">✅ <b>Fonctionne hors ligne.</b> 🧪 <b>Tracé simulé</b> : il sert à voir l'effet d'une erreur de pose (câbles inversés, électrode oubliée, parasites). Ce n'est pas un vrai ECG et il ne sert pas à interpréter. Repères d'après les protocoles français (couleurs CEI, 25 mm/s, 10 mm/mV) ; vérifie toujours le protocole de ton service et de ton IFSI.</div>`, false);
  }
  function start(mode) { _clr(); S = _fresh(mode === 'auto' ? 'auto' : 'guide'); _render(); }

  // ── Rendu par étape ──
  function _render() {
    if (!S) return _intro();
    _clr();
    const f = { prep: _rPrep, membres: _rLimbs, thorax: _rThorax, enreg: _rEnreg, controle: _rControle, bilan: _rBilan }[S.step];
    f();
    _bind();
  }
  function _chips(keys, placed, selKey) {
    return '<div class="ecg-chips">' + keys.map(k => {
      const on = placed(k);
      return `<button class="ecg-chip${selKey === k ? ' sel' : ''}${on ? ' placed' : ''}" onclick="App.SimECG.pick('${k}')"><span class="ecg-dot" style="background:${Art().COL[k]}"></span><b>${k}</b><span class="ecg-chip-c">${Art().COLNAME[k]}${on ? ' ✓' : ''}</span></button>`;
    }).join('') + '</div>';
  }
  const _bar = (txt, pct) => `<div class="ecg-prog"><div style="width:${pct}%"></div></div><p class="sim-muted sim-small">${txt}</p>`;

  // 1 · Préparation
  function _rPrep() {
    const done = S.prep.done, res = S.prep.res;
    const items = PREP.map(p => {
      const on = !!S.prep.sel[p.id];
      let cls = 'ecg-opt' + (on ? ' on' : ''), mark = on ? '☑' : '☐', why = '';
      if (done) {
        const right = p.ok === on;
        cls += right ? ' good' : ' bad';
        mark = (p.ok ? (on ? '✓' : '✗ oublié') : (on ? '✗ piège' : '✓'));
        why = `<div class="ecg-why">${_esc(p.why)}</div>`;
      }
      return `<button class="${cls}" ${done ? 'disabled' : `onclick="App.SimECG.toggle('${p.id}')"`}><span class="ecg-opt-m">${mark}</span><span class="ecg-opt-t">${_esc(p.t)}${why}</span></button>`;
    }).join('');
    _shell(`<div class="sim-card"><h3 class="sim-h">1 · Préparer la patiente et le matériel</h3>
      <p class="sim-lead">Avant de poser la moindre électrode, quelles actions fais-tu ? <b>Coche toutes les actions justes</b> (attention, certaines propositions sont des pièges).</p>
      <div class="ecg-opts">${items}</div>
      ${done ? `<div class="ecg-res ${res.bad || res.good < PREP_GOOD ? 'warn' : 'ok'}"><b>${res.good}/${PREP_GOOD} actions justes cochées${res.bad ? ', ' + res.bad + ' piège' + (res.bad > 1 ? 's' : '') + ' coché' + (res.bad > 1 ? 's' : '') : ''}.</b>${res.tags.tremor || res.tags.wander ? '<br>Ces oublis auront des conséquences sur le tracé (tremblements ou ligne de base instable) : tu pourras le constater à l\'étape « Contrôler ».' : '<br>Préparation complète : le tracé devrait être propre.'}</div>
      <div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.next()">Continuer : poser les électrodes →</button></div>`
        : `<div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.validatePrep()">Valider ma préparation</button></div>`}
    </div>`, true);
  }
  function toggle(id) { if (!S || S.prep.done) return; S.prep.sel[id] = !S.prep.sel[id]; _render(); }
  function validatePrep() {
    if (!S || S.prep.done) return;
    S.prep.res = evalPrep(S.prep.sel); S.prep.done = true;
    S.art = { tremor: S.prep.res.tags.tremor, wander: S.prep.res.tags.wander };
    _render();
  }

  // 2 · Électrodes des membres
  function _limbPlaced() { const o = {}; const ev = S.limbsChecked && S.mode === 'guide' ? evalLimbs(S.limbs).items : null; LIMBS.forEach(k => { if (S.limbs[k]) o[k] = { zone: S.limbs[k], state: ev ? (ev[k].ok ? 'ok' : 'bad') : '' }; }); return o; }
  function _rLimbs() {
    const n = LIMBS.filter(k => S.limbs[k]).length;
    const ev = S.limbsChecked ? evalLimbs(S.limbs) : null;
    let fb = '';
    if (ev && S.mode === 'guide') {
      fb = '<div class="ecg-fb">' + LIMBS.map(k => `<div class="ecg-fb-row ${ev.items[k].ok ? 'ok' : 'bad'}"><span class="ecg-fb-m">${ev.items[k].ok ? '✓' : '✗'}</span><span>${_esc(ev.items[k].msg)}</span></div>`).join('') +
        ev.extra.map(t => `<div class="ecg-fb-row warn"><span class="ecg-fb-m">⚠</span><span>${_esc(t)}</span></div>`).join('') + '</div>';
    }
    const allOk = ev && ev.nOk === 4;
    const btns = S.mode === 'guide'
      ? (S.limbsChecked ? (allOk ? `<button class="btn btn-primary" onclick="App.SimECG.next()">Continuer : le thorax →</button>` : `<button class="btn btn-ghost" onclick="App.SimECG.uncheck('limbs')">Corriger</button><button class="btn btn-ghost" onclick="App.SimECG.next()">Continuer quand même</button>`) : `<button class="btn btn-primary" ${n < 4 ? 'disabled' : ''} onclick="App.SimECG.checkLimbs()">Vérifier mes électrodes</button>`)
      : `<button class="btn btn-primary" ${n < 4 ? 'disabled' : ''} onclick="App.SimECG.checkLimbs()">Valider les électrodes des membres →</button>`;
    _shell(`<div class="sim-card"><h3 class="sim-h">2 · Électrodes des membres</h3>
      <p class="sim-lead">Choisis un câble, puis touche l'endroit où tu le poses. <b>Vue de face : la droite de la patiente est à gauche de l'image.</b> Pour déplacer une électrode, choisis-la de nouveau puis touche le nouvel endroit.</p>
      ${S.mode === 'guide' ? '<div class="sim-note">🧠 <b>Astuce</b> : rouge, jaune, vert, noir — dans le sens des aiguilles d\'une montre en partant du bras droit, vue de face. Pose sur la peau, au poignet et à la cheville.</div>' : ''}
      ${_chips(LIMBS, k => !!S.limbs[k], S.sel)}
      <div class="ecg-fig ecg-fig-body">${Art().body({ placed: _limbPlaced(), labels: S.mode === 'guide' })}</div>
      <p class="sim-muted sim-small">${S.hint ? _esc(S.hint) : (S.sel ? 'Touche maintenant l\'endroit où poser le câble ' + _cableName(S.sel) + '.' : (n < 4 ? 'Choisis un câble.' : 'Les 4 câbles sont posés.'))} · Schéma : en pratique, la patiente est allongée.</p>
      ${fb}<div class="sim-row">${btns}</div></div>`, true);
  }
  const _cableName = k => LIMB_INFO[k] ? LIMB_INFO[k].color : Art().COLNAME[k];
  function pick(k) {
    if (!S) return;
    S.sel = S.sel === k ? null : k; S.hint = '';
    _render();
  }
  function uncheck(w) { if (!S) return; if (w === 'limbs') S.limbsChecked = false; else S.thChecked = false; _render(); }
  function zoneTap(zone) {
    if (!S || S.step !== 'membres') return;
    if (!S.sel) {
      const k = LIMBS.find(x => S.limbs[x] === zone);
      if (k) { S.sel = k; S.hint = 'Câble ' + _cableName(k) + ' repris : touche le nouvel endroit.'; _render(); } else { S.hint = "Choisis d'abord un câble en haut."; _render(); }
      return;
    }
    LIMBS.forEach(k => { if (S.limbs[k] === zone) S.limbs[k] = null; });
    S.limbs[S.sel] = zone; S.sel = null; S.hint = ''; S.limbsChecked = false;
    _render();
  }
  function checkLimbs() {
    if (!S) return;
    const ev = evalLimbs(S.limbs);
    if (S.limbsFirst == null) S.limbsFirst = ev.nOk;
    S.limbsFinal = ev.nOk; S.limbsChecked = true;
    if (S.mode === 'auto') { S.step = 'thorax'; S.sel = null; S.hint = ''; }
    _render();
  }

  // 3 · Thorax
  function _thPlaced() {
    const ev = S.thChecked && S.mode === 'guide' ? evalThorax(S.V).items : null, o = {};
    VS.forEach(k => { if (S.V[k]) o[k] = { x: S.V[k].x, y: S.V[k].y, state: ev ? (ev[k].ok ? 'ok' : 'bad') : '' }; });
    return o;
  }
  function _rThorax() {
    const n = VS.filter(k => S.V[k]).length, a = Art();
    if (!S.louis) {
      _shell(`<div class="sim-card"><h3 class="sim-h">3 · Électrodes précordiales : le repérage</h3>
        <p class="sim-lead">Pour poser V1 et V2 dans le 4e espace intercostal, on <b>compte les côtes</b> à partir d'un repère facile à sentir : l'<b>angle sternal</b> (angle de Louis), la petite crête à la jonction du manubrium et du corps du sternum. La 2e côte s'y attache.</p>
        <div class="ecg-fig ecg-fig-th">${a.thorax({ guide: S.mode === 'guide', louis: false, placed: {} })}</div>
        <p class="sim-muted sim-small" id="ecg-hint">${S.hint ? _esc(S.hint) : '👉 Touche l\'angle sternal sur le schéma.'}</p></div>`, true);
      return;
    }
    const ev = S.thChecked ? evalThorax(S.V) : null;
    let fb = '';
    if (ev && S.mode === 'guide') {
      fb = '<div class="ecg-fb">' + VS.map(k => `<div class="ecg-fb-row ${ev.items[k].ok ? 'ok' : 'bad'}"><span class="ecg-fb-m">${ev.items[k].ok ? '✓' : '✗'}</span><span>${_esc(ev.items[k].msg)}</span></div>`).join('') +
        ev.extra.map(t => `<div class="ecg-fb-row warn"><span class="ecg-fb-m">⚠</span><span>${_esc(t)}</span></div>`).join('') + '</div>';
    }
    const allOk = ev && ev.nOk === 6;
    const btns = S.mode === 'guide'
      ? (S.thChecked ? (allOk ? `<button class="btn btn-primary" onclick="App.SimECG.next()">Continuer : régler l'appareil →</button>` : `<button class="btn btn-ghost" onclick="App.SimECG.uncheck('th')">Corriger</button><button class="btn btn-ghost" onclick="App.SimECG.next()">Continuer quand même</button>`) : `<button class="btn btn-primary" ${n < 6 ? 'disabled' : ''} onclick="App.SimECG.checkThorax()">Vérifier mes électrodes</button>`)
      : `<button class="btn btn-primary" ${n < 6 ? 'disabled' : ''} onclick="App.SimECG.checkThorax()">Valider les précordiales →</button>`;
    _shell(`<div class="sim-card"><h3 class="sim-h">3 · Électrodes précordiales V1 à V6</h3>
      <p class="sim-lead">Choisis une électrode, puis touche le thorax à l'endroit où tu la poses. <b>Astuce du terrain</b> : pose V1, V2 et V4 après avoir palpé les espaces, puis V3, V5 et V6 à vue. Pour déplacer une électrode, choisis-la de nouveau.</p>
      ${_chips(VS, k => !!S.V[k], S.sel)}
      <div class="ecg-fig ecg-fig-th">${a.thorax({ guide: S.mode === 'guide', louis: true, placed: _thPlaced() })}</div>
      <p class="sim-muted sim-small" id="ecg-hint">${S.hint ? _esc(S.hint) : (S.sel ? 'Touche le thorax pour poser ' + S.sel + ' (' + a.COLNAME[S.sel] + ').' : (n < 6 ? 'Choisis une électrode.' : 'Les 6 électrodes sont posées.'))}</p>
      <div class="sim-note">👩 <b>Chez la femme</b>, on soulève le sein : l'électrode se pose sur le thorax, pas sur le sein (la plupart des protocoles ; à vérifier avec ton cours).</div>
      ${S.mode === 'guide' ? `<details class="ecg-help"><summary>💡 Aide : où poser chaque électrode ?</summary><ul class="sim-ul">${VS.map(k => '<li>' + _esc(V_HELP[k]) + '</li>').join('')}</ul></details>` : ''}
      ${fb}<div class="sim-row">${btns}</div></div>`, true);
  }
  function thoraxTap(ev) {
    if (!S || S.step !== 'thorax') return;
    const svg = _el('ecg-thorax'); if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = (ev.clientX - r.left) / r.width * vb.width, y = (ev.clientY - r.top) / r.height * vb.height;
    const a = Art();
    if (!S.louis) {
      if (Math.abs(x - a.MID) <= 30 && Math.abs(y - a.LOUIS_Y) <= 11) { S.louis = true; S.hint = ''; S.sel = null; }
      else {
        S.louisTries++;
        if (Math.abs(x - a.MID) > 34) S.hint = "Cherche au milieu de la poitrine : le sternum est l'os vertical central.";
        else if (y < a.LOUIS_Y - 11) S.hint = "Tu es sur le manubrium (la partie haute). Descends un peu : l'angle est la crête qui le sépare du corps du sternum.";
        else S.hint = "Tu es déjà sur le corps du sternum. Remonte un peu : l'angle sternal est à la jonction avec le manubrium.";
      }
      _render(); return;
    }
    const cx = Math.max(24, Math.min(376, x)), cy = Math.max(70, Math.min(380, y));
    if (!S.sel) {
      let best = null, bd = 16;
      VS.forEach(k => { const p = S.V[k]; if (p) { const d = Math.hypot(p.x - cx, p.y - cy); if (d < bd) { bd = d; best = k; } } });
      if (best) { S.sel = best; S.hint = best + ' repris : touche le nouvel endroit.'; }
      else S.hint = "Choisis d'abord une électrode (V1 à V6) en haut.";
      _render(); return;
    }
    S.V[S.sel] = { x: Math.round(cx * 10) / 10, y: Math.round(cy * 10) / 10 };
    S.sel = null; S.hint = ''; S.thChecked = false;
    _render();
  }
  function checkThorax() {
    if (!S) return;
    const ev = evalThorax(S.V);
    if (S.thFirst == null) S.thFirst = ev.nOk;
    S.thFinal = ev.nOk; S.thChecked = true;
    if (S.mode === 'auto') { S.step = 'enreg'; S.sel = null; S.hint = ''; }
    _render();
  }

  // 4 · Appareil et enregistrement
  function _rEnreg() {
    const off = [];
    LIMBS.forEach(k => { if (!S.limbs[k]) off.push(k); });
    VS.forEach(k => { if (!S.V[k]) off.push(k); });
    const led = k => `<span class="ecg-led ${(LIMBS.indexOf(k) >= 0 ? S.limbs[k] : S.V[k]) ? 'on' : 'off'}" title="${k}"><i style="background:${Art().COL[k]}"></i>${k}</span>`;
    const radio = (name, vals, cur, fn) => vals.map(v => `<button class="ecg-seg${cur === v ? ' on' : ''}" onclick="App.SimECG.${fn}(${v})">${v}</button>`).join('');
    _shell(`<div class="sim-card"><h3 class="sim-h">4 · Régler l'appareil et enregistrer</h3>
      <div class="ecg-machine">
        <div class="ecg-m-title">ÉLECTROCARDIOGRAPHE <span>PRÊT</span></div>
        <div class="ecg-leds">${LIMBS.concat(VS).map(led).join('')}</div>
        ${off.length ? `<div class="ecg-m-warn">⚠ Contact absent : ${off.join(', ')}. L'appareil enregistrera quand même, mais ces dérivations seront plates.</div>` : '<div class="ecg-m-ok">✓ Les 10 électrodes sont connectées.</div>'}
        <div class="ecg-m-row"><span>Défilement</span><div>${radio('s', [12.5, 25, 50], S.set.speed, 'setSpeed')}<em>mm/s</em></div></div>
        <div class="ecg-m-row"><span>Sensibilité</span><div>${radio('g', [5, 10, 20], S.set.gain, 'setGain')}<em>mm/mV</em></div></div>
        <div class="ecg-m-row"><span>Identité</span><div>${S.identity ? `<b class="ecg-id">${PATIENT.nom} ${PATIENT.prenom} · ${PATIENT.dn}</b>` : `<button class="ecg-seg" onclick="App.SimECG.setIdentity()">Saisir l'identité de la patiente</button>`}</div></div>
      </div>
      <p class="sim-muted sim-small">L'appareil a gardé les réglages du dernier utilisateur : vérifie-les avant d'enregistrer.</p>
      ${S.recording ? _bar('Enregistrement en cours… demande à la patiente de rester immobile, sans parler.', S.recProg)
        : `<div class="sim-row">${off.length ? '<button class="btn btn-ghost" onclick="App.SimECG.goStep(\'' + (off.some(k => LIMBS.indexOf(k) >= 0) ? 'membres' : 'thorax') + '\')">← Revenir poser l\'électrode manquante</button>' : ''}<button class="btn btn-primary" ${S.identity ? '' : 'disabled'} onclick="App.SimECG.record()">⏺ Enregistrer (10 s)</button></div>${S.identity ? '' : '<p class="sim-muted sim-small">Saisis d\'abord l\'identité : un tracé sans identité ne peut pas être classé.</p>'}`}
    </div>`, true);
  }
  function setSpeed(v) { if (!S || S.recording) return; S.set.speed = v; _render(); }
  function setGain(v) { if (!S || S.recording) return; S.set.gain = v; _render(); }
  function setIdentity() { if (!S || S.recording) return; S.identity = true; _render(); }
  function goStep(st) { if (!S) return; S.step = st; S.sel = null; S.hint = ''; if (st === 'membres') S.limbsChecked = false; if (st === 'thorax') S.thChecked = false; _render(); }
  function record() {
    if (!S || S.recording || !S.identity) return;
    if (S.setFirst == null) S.setFirst = (S.set.speed === 25 ? 1 : 0) + (S.set.gain === 10 ? 1 : 0);
    S.recording = true; S.recProg = 0;
    _render();
    let t = 0;
    const iv = setInterval(() => {
      t += 0.1;
      S.recProg = Math.min(100, Math.round(t / 10 * 100));
      const bar = document.querySelector('.ecg-prog > div'); if (bar) bar.style.width = S.recProg + '%';
      if (t >= 10) {
        clearInterval(iv);
        S.recording = false; S.rec = buildRecording(S); S.step = 'controle'; S.qc = { answers: {}, revealed: false, first: S.qc.first }; _render();
      }
    }, 100);
    _timers.push(iv);
  }

  // 5 · Contrôle du tracé
  function _rControle() {
    const rec = S.rec, tr = truth(rec), q = S.qc;
    const answered = QC.every(x => q.answers[x.id] != null);
    const rows = QC.map(x => {
      const a = q.answers[x.id];
      let cls = 'ecg-q', res = '';
      if (q.revealed) {
        const good = (a === true) === tr[x.id];
        cls += good ? ' good' : ' bad';
        res = `<div class="ecg-why">${good ? '✓ ' : '✗ '}${tr[x.id] ? _esc(x.yes) : _esc(x.no)}${good ? '' : ' <b>(sur ce tracé, la bonne réponse est « ' + (tr[x.id] ? 'oui' : 'non') + ' »)</b>'}</div>`;
      }
      return `<div class="${cls}"><div class="ecg-q-t">${_esc(x.q)}</div><div class="ecg-q-b">
        <button class="ecg-seg${a === true ? ' on' : ''}" ${q.revealed ? 'disabled' : `onclick="App.SimECG.answer('${x.id}',true)"`}>Oui</button>
        <button class="ecg-seg${a === false ? ' on' : ''}" ${q.revealed ? 'disabled' : `onclick="App.SimECG.answer('${x.id}',false)"`}>Non</button></div>${res}</div>`;
    }).join('');
    let verdict = '';
    if (q.revealed) {
      const bad = QC.filter(x => !tr[x.id]);
      if (bad.length) {
        const causes = _causes(tr);
        verdict = `<div class="ecg-res warn"><b>Tracé non exploitable : il faut le refaire après correction.</b><ul class="sim-ul">${causes.map(c => '<li>' + _esc(c) + '</li>').join('')}</ul>
          <div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.redoRec()">Corriger et refaire l'enregistrement</button></div></div>`;
      } else {
        verdict = `<div class="ecg-res ok"><b>Tracé techniquement exploitable.</b> Il est identifié, daté, étalonné, sans parasite, avec les 12 dérivations. Tu le remets au médecin pour interprétation et tu traces le geste dans le dossier de soins.<br><span class="sim-small">Attention : un tracé d'allure normale peut venir d'électrodes mal placées (surtout les précordiales). Seul le repérage anatomique le garantit.</span>
          <div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.finish()">Terminer et voir mon bilan →</button></div></div>`;
      }
    }
    _shell(`<div class="sim-card"><h3 class="sim-h">5 · Contrôler le tracé</h3>
      <p class="sim-lead">Regarde le tracé avant de le transmettre. <b>Fais défiler le papier de gauche à droite.</b> Réponds aux 6 questions de contrôle : le simulateur te dira ensuite ce qu'il en est vraiment.</p>
      <div class="ecg-paper-wrap" id="ecg-paper-wrap">${tracingSvg(rec, S)}</div>
      <p class="sim-muted sim-small">🧪 Tracé simulé à but pédagogique.${S.attempt > 1 ? ' · Enregistrement n° ' + S.attempt : ''}</p>
      <div class="ecg-qs">${rows}</div>
      ${q.revealed ? '' : `<div class="sim-row"><button class="btn btn-primary" ${answered ? '' : 'disabled'} onclick="App.SimECG.validateQC()">Valider mes réponses</button>${answered ? '' : '<span class="sim-muted sim-small">Réponds aux 6 questions.</span>'}</div>`}
      ${verdict}</div>`, true);
  }
  function answer(id, v) { if (!S || S.qc.revealed) return; S.qc.answers[id] = v; const w = _el('ecg-paper-wrap'), sl = w ? w.scrollLeft : 0; _render(); const w2 = _el('ecg-paper-wrap'); if (w2) w2.scrollLeft = sl; }
  function validateQC() {
    if (!S) return;
    const tr = truth(S.rec);
    if (S.qc.first == null) S.qc.first = QC.filter(x => (S.qc.answers[x.id] === true) === tr[x.id]).length;
    S.qc.revealed = true; _render();
  }
  function _causes(tr) {
    const out = [], rec = S.rec, L = S.limbs;
    LIMBS.forEach(k => { const inf = LIMB_INFO[k]; if (L[k] && L[k] !== inf.zone) out.push('Le câble ' + inf.color + ' est sur le ' + ZONE_NAME[L[k]] + ' au lieu du ' + ZONE_NAME[inf.zone] + '.'); if (!L[k]) out.push('Le câble ' + inf.color + " n'est pas posé."); });
    VS.forEach(k => { if (!S.V[k]) out.push(k + " n'est pas posée."); });
    if (!tr.prog && VS.every(k => S.V[k])) out.push('La progression des ondes R de V1 à V6 est anormale : vérifie la position et l\'ordre des précordiales.');
    if (rec.noise.tremor) out.push("Tremblements : la patiente était crispée, mal installée ou a parlé/bougé.");
    if (rec.noise.wander) out.push("Ligne de base instable : mauvais contact (peau non préparée, gel sec, électrodes inadaptées ou posées à travers un vêtement).");
    if (rec.noise.hz50) out.push("Parasites réguliers à 50 Hz (fréquence du secteur en France) : câble noir (terre) non posé.");
    if (!tr.cal) out.push('Étalonnage non standard : ' + rec.speed + ' mm/s et ' + rec.gain + ' mm/mV, alors qu\'il faut 25 mm/s et 10 mm/mV.');
    return out;
  }
  function redoRec() {
    if (!S) return;
    const tr = truth(S.rec), rec = S.rec;
    S.attempt++; S.todo = _causes(tr);
    const anyOff = Object.keys(rec.off).length > 0;
    const limbBad = LIMBS.some(k => !S.limbs[k] || S.limbs[k] !== LIMB_INFO[k].zone) && (!tr.p || !tr.avr || rec.off.D1 || rec.off.D2 || rec.off.aVR);
    if (rec.noise.tremor || rec.noise.wander || rec.noise.hz50) { S.redo.noise++; S.art = { tremor: false, wander: false }; }
    if (anyOff || limbBad || !tr.p || !tr.avr) { S.redo.limbs++; S.step = LIMBS.some(k => !S.limbs[k]) || limbBad || !tr.p || !tr.avr ? 'membres' : 'thorax'; S.limbsChecked = false; S.thChecked = false; }
    else if (!tr.prog) { S.redo.thorax++; S.step = 'thorax'; S.thChecked = false; }
    else if (!tr.cal) { S.redo.set++; S.step = 'enreg'; }
    else S.step = 'enreg';
    S.sel = null; S.hint = '';
    _render();
  }
  function finish() { if (!S) return; S.step = 'bilan'; _finalize(); _render(); }

  // 6 · Bilan
  function _finalize() {
    const lf = evalLimbs(S.limbs), tf = evalThorax(S.V);
    const prep = evalPrep(S.prep.sel).pts;
    const first = (S.limbsFirst == null ? lf.nOk : S.limbsFirst), thFirst = (S.thFirst == null ? tf.nOk : S.thFirst);
    const limbs = 20 * (first + lf.nOk) / 8;
    const thorax = 30 * (thFirst + tf.nOk) / 12;
    const sFirst = S.setFirst == null ? 0 : S.setFirst, sFinal = (S.set.speed === 25 ? 1 : 0) + (S.set.gain === 10 ? 1 : 0);
    const settings = 10 * (sFirst + sFinal) / 4;
    const qc = 20 * (S.qc.first == null ? 0 : S.qc.first) / QC.length;
    const total = Math.round(prep + limbs + thorax + settings + qc);
    S.bilan = { prep, limbs, thorax, settings, qc, total, lf, tf, first, thFirst, sFirst, sFinal };
    if (!S.saved) {
      S.saved = true;
      hist.attempts.push({ date: Date.now(), mode: S.mode, score: total, secs: S.secs, tries: S.attempt });
      if (hist.attempts.length > 20) hist.attempts = hist.attempts.slice(-20);
      _saveH();
    }
  }
  function _rBilan() {
    const b = S.bilan, a = Art();
    const row = (label, pts, max, note) => `<div class="ecg-brow"><div><b>${label}</b><div class="sim-muted sim-small">${note}</div></div><div class="ecg-bpts">${Math.round(pts)}<small>/${max}</small></div></div>`;
    const lfx = b.lf.items, tfx = b.tf.items;
    const errs = [];
    LIMBS.forEach(k => { if (!lfx[k].ok) errs.push(lfx[k].msg); });
    b.lf.extra.forEach(t => errs.push(t));
    VS.forEach(k => { if (!tfx[k].ok) errs.push(tfx[k].msg); });
    b.tf.extra.forEach(t => errs.push(t));
    if (S.set.speed !== 25 || S.set.gain !== 10) errs.push('Réglage final : ' + S.set.speed + ' mm/s, ' + S.set.gain + ' mm/mV (standard : 25 mm/s et 10 mm/mV).');
    const noteL = b.first === 4 ? 'tout juste du premier coup' : (b.lf.nOk === 4 ? '↺ juste après correction' : (4 - b.lf.nOk) + ' erreur(s) restante(s)');
    const noteT = b.thFirst === 6 ? 'tout juste du premier coup' : (b.tf.nOk === 6 ? '↺ juste après correction' : (6 - b.tf.nOk) + ' erreur(s) restante(s)');
    _shell(`<div class="sim-card ecg-bilan"><h2 class="sim-title">Bilan de l'atelier ECG</h2>
      <div class="ecg-score"><b>${b.total}</b><span>/100</span></div>
      <p class="sim-muted sim-small">Mode ${S.mode === 'auto' ? 'autonome' : 'guidé'} · ${_hms(S.secs)} · ${S.attempt} enregistrement${S.attempt > 1 ? 's' : ''}</p>
      ${row('Préparation', b.prep, 20, 'actions justes cochées, pièges évités')}
      ${row('Électrodes des membres', b.limbs, 20, noteL)}
      ${row('Électrodes précordiales', b.thorax, 30, noteT)}
      ${row('Réglages de l\'appareil', b.settings, 10, 'défilement 25 mm/s, sensibilité 10 mm/mV')}
      ${row('Contrôle du tracé', b.qc, 20, (S.qc.first == null ? 0 : S.qc.first) + '/' + QC.length + ' observations justes au premier contrôle')}
      ${errs.length ? '<h3 class="sim-h2">Ce qu\'il faut corriger</h3><ul class="sim-ul">' + errs.map(t => '<li>' + _esc(t) + '</li>').join('') + '</ul>' : '<div class="ecg-res ok"><b>Toutes les électrodes étaient bien placées.</b></div>'}
      <h3 class="sim-h2">À retenir</h3>
      <ul class="sim-ul">
        <li><b>Membres (CEI)</b> : rouge au bras droit, jaune au bras gauche, vert à la jambe gauche, noir à la jambe droite.</li>
        <li><b>V1</b> 4e EIC droit, bord du sternum · <b>V2</b> 4e EIC gauche, bord du sternum · <b>V4</b> 5e EIC gauche, ligne médio-claviculaire · <b>V3</b> entre V2 et V4 · <b>V5</b> et <b>V6</b> sur l'horizontale de V4, lignes axillaires antérieure puis moyenne.</li>
        <li><b>Repérer les espaces</b> : angle sternal → 2e côte → on compte vers le bas.</li>
        <li><b>Standard</b> : 25 mm/s, 10 mm/mV, créneau d'étalonnage de 10 mm, identité sur le tracé.</li>
        <li><b>Contrôle</b> : P positive en D1 et D2, aVR négatif, R qui grandit de V1 à V6, pas de parasites. En cas de doute, on vérifie les électrodes et on refait.</li>
        <li>Vert et noir inversés ne se voient presque pas sur le tracé : seul un branchement soigneux l'évite.</li>
      </ul>
      <p class="sim-muted sim-small sim-disclaimer">Outil d'entraînement : tracé simulé, repères d'après des protocoles français ; valide les détails (rasage, pose chez la femme, protocole de service) avec ton cours et ton formateur.</p>
      ${CTX
        ? `<div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.done()">✓ Retour à la prescription</button><button class="btn btn-ghost" onclick="App.SimECG.start('${S.mode}')">Refaire l'ECG</button></div>`
        : `<div class="sim-row"><button class="btn btn-primary" onclick="App.SimECG.start('${S.mode}')">Rejouer</button><button class="btn btn-ghost" onclick="App.SimECG.back()">Retour à la simulation</button></div>`}
    </div>`, false);
  }
  function next() {
    if (!S) return;
    const order = ['prep', 'membres', 'thorax', 'enreg', 'controle'];
    const i = order.indexOf(S.step);
    if (S.step === 'membres' && S.limbsFirst == null) { const ev = evalLimbs(S.limbs); S.limbsFirst = ev.nOk; S.limbsFinal = ev.nOk; }
    if (S.step === 'thorax' && S.thFirst == null) { const ev = evalThorax(S.V); S.thFirst = ev.nOk; S.thFinal = ev.nOk; }
    if (i >= 0 && i < order.length - 1) S.step = order[i + 1];
    S.sel = null; S.hint = ''; _render();
  }

  // ── Liaison des touches sur les schémas ──
  function _bind() {
    const b = _el('ecg-body');
    if (b) b.addEventListener('click', e => { const z = e.target.closest && e.target.closest('[data-zone]'); const m = e.target.closest && e.target.closest('.ecg-mk'); if (z) zoneTap(z.getAttribute('data-zone')); else if (m) { const k = m.getAttribute('data-el'); const zz = S.limbs[k]; if (zz) zoneTap(zz); } });
    const t = _el('ecg-thorax');
    if (t) t.addEventListener('click', thoraxTap);
  }

  // ── Chrono d'activité : le temps passé s'ajoute au temps du jour (comme la simulation) ──
  let _tickT = null, _lastAct = 0, _lastTick = 0, _acc = 0, _bound = false;
  const _mark = () => { _lastAct = Date.now(); };
  function _startTimer() {
    if (!_bound) {
      ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'].forEach(ev => document.addEventListener(ev, _mark, { passive: true, capture: true }));
      _bound = true;
    }
    _mark(); _lastTick = Date.now();
    if (!_tickT) _tickT = setInterval(_tick, 2000);
  }
  function _tick() {
    const now = Date.now(), dt = Math.min(5, Math.max(0, (now - _lastTick) / 1000)); _lastTick = now;
    const root = _el('sim-root'), live = !!_el('sim-ecg') && !!root && root.style.display !== 'none' && !!S;
    if (!live || document.hidden || now - _lastAct > 60000) return;
    const g = _el('games-view'); if (g && getComputedStyle(g).display === 'none') return;
    _acc += dt;
    const w = Math.floor(_acc);
    if (w > 0) {
      _acc -= w; S.secs += w;
      try { App.Store.logSim({ seconds: w }); App.Render.todayStats(); } catch (e) {}
      const c = _el('ecg-clock'); if (c) c.textContent = _hms(S.secs);
    }
  }

  _loadH();
  return { card, open, back, start, toggle, validatePrep, next, pick, uncheck, checkLimbs, checkThorax, setSpeed, setGain, setIdentity, goStep, record, answer, validateQC, redoRec, finish, done,
    _t: { state: () => S, evalLimbs, evalThorax, buildRecording, truth, uOf, tick: _tick } };
})();
