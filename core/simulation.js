// core/simulation.js — Jeux · Simulation clinique (préparation, recueil, décision, appel SAED, prescription,
// transmissions écrites, bilan noté, niveaux et badges)
// Tout fonctionne HORS LIGNE : la reconnaissance des phrases, les réponses du patient et la correction viennent
// des fichiers data/sim_intents.js et data/sim_ehpad.js. Seul l'avis de l'IA (facultatif, bouton à part) utilise internet.
// Sauvegarde automatique dans localStorage (clé ifsi_sim_v1), sur cet appareil uniquement (la progression n'est pas
// synchronisée ; seul le temps actif l'est, via App.Store.logSim). Patients fictifs.
'use strict';
window.App = window.App || {};

App.Sim = (() => {
  const KEY = 'ifsi_sim_v1';
  const NB_KEY = 'ifsi_sim_nb';          // préférence « mode bloc-notes » (l'étudiant note lui-même)
  function _nbPref() { try { return localStorage.getItem(NB_KEY) === '1'; } catch (e) { return false; } }
  const MAX_HISTORY = 30;
  const MAX_LOG = 400;

  const _newProg = () => ({ xp: 0, runs: 0, best: {}, badges: {} });
  let st = { v: 1, current: null, history: [], prog: _newProg() };
  let screen = 'liste';            // liste | jeu (couloir, chambre, bilan : selon current.stage)
  let _confirmFinish = false;
  let _menuOpen = false;
  let _openThemes = {};
  // État d'interface (non sauvegardé) : instrument en main, geste en cours, zoom de la scène
  let _tool = null, _G = null, _hint = '', _zoom = 'room', _autoZoom = false, _timers = [], _anim = null;

  const _el  = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STAGES = [
    { id: 'couloir', label: 'Préparation' },
    { id: 'chambre', label: 'Recueil' },
    { id: 'decision', label: 'Décision' },
    { id: 'transmissions', label: 'Transmissions' },
    { id: 'bilan', label: 'Bilan' }
  ];
  const SECTIONS = [
    ['identite', 'Identité'], ['motif', "Motif d'entrée"], ['antecedents', 'Antécédents'], ['allergies', 'Allergies'],
    ['traitements', 'Traitements'], ['autonomie', 'Autonomie'], ['psychosocial', 'Moral, entourage, repères'],
    ['histoire', 'Histoire récente'], ['symptomes', 'Symptômes'], ['douleur', 'Douleur'], ['constantes', 'Constantes'],
    ['observations', 'Observations'], ['risques', 'Risques dans la chambre']
  ];
  const KIND_LABEL = { dossier: 'Dossier', chercher: 'Dit par la résidente', mesurer: 'Mesure', deduire: 'Observation' };
  // Scénarios à plusieurs résidents : accord au masculin pour les textes écrits au féminin (menus, aides, bilan)
  const _male = scn => !!(scn && scn.patient && scn.patient.sexe === 'M');
  const _MASC = [['de la résidente', 'du résident'], ['à la résidente', 'au résident'], ['la résidente', 'le résident'], ['La résidente', 'Le résident'],
    ['une résidente', 'un résident'], ['Résidente', 'Résident'], ['résidente', 'résident'], ['sur la patiente', 'sur le patient'], ['la patiente', 'le patient'],
    ['Madame', 'Monsieur'], ['tombée', 'tombé'], ['allée', 'allé'], ['arrivée', 'arrivé'], ['opérée', 'opéré'], ['hospitalisée', 'hospitalisé'],
    ['levée', 'levé'], ['réveillée', 'réveillé'], ["qu'elle ressent", "qu'il ressent"], ["ce qu'elle", "ce qu'il"]];
  // Scénarios hospitaliers : on parle d'un « patient » (et non d'un « résident »)
  const _hosp = scn => !!(scn && scn.patient && scn.patient.statut === 'patient');
  const _HOSP = [['résidente', 'patiente'], ['résident', 'patient'], ['Résidente', 'Patiente'], ['Résident', 'Patient']];
  function _gen(txt, scn) {
    let t = String(txt == null ? '' : txt);
    if (_male(scn)) _MASC.forEach(([a, b]) => { t = t.split(a).join(b); });
    if (_hosp(scn)) _HOSP.forEach(([a, b]) => { t = t.split(a).join(b); });
    return t;
  }
  const STAGE_GRID = { entree: "Avant d'entrer", contact: 'Premier contact', recueil: 'Recueil de données' };

  // ── Sauvegarde ────────────────────────────────────────────────
  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) {
        const p = r.prog && typeof r.prog === 'object' ? r.prog : {};
        st = { v: 1, current: r.current || null, history: Array.isArray(r.history) ? r.history : [],
               prog: { xp: +p.xp > 0 ? Math.round(p.xp) : 0, runs: +p.runs > 0 ? Math.round(p.runs) : 0,
                       best: p.best && typeof p.best === 'object' ? p.best : {}, badges: p.badges && typeof p.badges === 'object' ? p.badges : {} } };
      }
    } catch (e) {}
    if (st.current && !_scn(st.current.scenarioId)) st.current = null;
    _fix(st.current);
  }
  function _fix(c) {                 // parties enregistrées avec une version précédente : on complète les champs manquants
    if (!c) return;
    c.log = c.log || []; c.found = c.found || {}; c.done = c.done || {}; c.asked = c.asked || {}; c.seenObj = c.seenObj || {};
    c.pending = c.pending || {}; c.entered = c.entered || {}; c.errors = c.errors || 0; c.misplaced = c.misplaced || 0;
    c.dec = c.dec || { step: 'level', order: null, level: null, levelDone: false, picks: {}, actionsDone: false };
    c.saed = c.saed || { txt: { S: '', A: '', E: '', D: '' }, tries: 0, p1: null, p2: null, t1: null, log: [], sent: false, done: false, canRetry: false, warn: '' };
    c.rx = c.rx || { ecg: null, skipped: false, gazo: null, gazoSkipped: false };
    c.wr = c.wr || { txt: { C: '', D: '', A: '', R: '' }, graded: false, pts: 0, warn: '' };
    c.ai = c.ai || {}; c.prep = c.prep || {}; c.waste = c.waste || null;
    c.nb = !!c.nb; c.notes = typeof c.notes === 'string' ? c.notes : ''; c.nbExp = c.nbExp || {}; c.nbWarn = c.nbWarn || {};
    const k = c.care = (c.care && typeof c.care === 'object') ? c.care : {};
    k.pos = k.pos || null; k.o2 = k.o2 || null; k.alert = k.alert || null; k.stay = !!k.stay; k.stayShown = !!k.stayShown; k.bad = k.bad || 0;
    k.ev = Array.isArray(k.ev) ? k.ev : [];
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  function _scenarios() { return window.App.SimScenarios || []; }
  function _scn(id) { return _scenarios().find(s => s.id === id) || null; }
  function _cur() { return st.current; }
  function _curScn() { return st.current ? _scn(st.current.scenarioId) : null; }

  // ── Reconnaissance des phrases (hors ligne) ───────────────────
  function _norm(s) {
    return String(s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[’'`´]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Mise en forme avant la reconnaissance : abréviations de SMS développées et tutoiement ramené au vouvoiement
  // (les motifs de data/sim_intents.js sont écrits au vouvoiement).
  const _ABBR = { qd: 'quand', pk: 'pourquoi', pq: 'pourquoi', tt: 'tout', ttt: 'traitement', slt: 'salut', bjr: 'bonjour', ds: 'dans', pr: 'pour', cmt: 'comment', bcp: 'beaucoup',
                  qq: 'quelque', qqch: 'quelque chose', qqun: 'quelqu un', vs: 'vous', stp: '', svp: '', sv: '', tjs: 'toujours', tjrs: 'toujours', mtn: 'maintenant', ajd: 'aujourd hui', pdt: 'pendant', ac: 'avec',
                  // mots collés ou écrits « comme on les dit » (SMS, dictée vocale, saisie rapide)
                  jsuis: 'je suis', chui: 'je suis', chuis: 'je suis', jvais: 'je vais', jve: 'je vais', jv: 'je vais', jvous: 'je vous', jveux: 'je veux', jpeux: 'je peux', jpeu: 'je peux', jme: 'je me', jai: 'j ai',
                  cest: 'c est', sest: 's est', lheure: 'l heure', dautre: 'd autre', dautres: 'd autres', danormal: 'd anormal', daide: 'd aide', deau: 'd eau', aujourdhui: 'aujourd hui',
                  quelquun: 'quelqu un', kelkun: 'quelqu un', kelke: 'quelque', kelque: 'quelque', kelques: 'quelques', kelkes: 'quelques',
                  kel: 'quel', kels: 'quels', kelle: 'quelle', kelles: 'quelles', koi: 'quoi', pourkoi: 'pourquoi', pkoi: 'pourquoi', pourqoi: 'pourquoi', ke: 'que', ki: 'qui', keske: 'qu est ce que', keskil: 'qu est ce qu il',
                  coment: 'comment', comant: 'comment', komment: 'comment', koman: 'comment', vou: 'vous', alez: 'allez', bsoin: 'besoin', tps: 'temps', depui: 'depuis', comence: 'commence', comencer: 'commencer',
                  bra: 'bras', tet: 'tete', nui: 'nuit', ya: 'y a', salu: 'salut', bnjour: 'bonjour', bonjou: 'bonjour', bojour: 'bonjour', ephad: 'ehpad', ephat: 'ehpad', mapel: 'm appelle', mapelle: 'm appelle', mappelle: 'm appelle',
                  dacord: 'd accord', daccord: 'd accord', dacor: 'd accord', ptit: 'petit', ptite: 'petite', fai: 'fait', qqpart: 'quelque part', qqpar: 'quelque part', pa: 'pas', choz: 'chose', chos: 'chose', yaurai: 'y aurait', yaurait: 'y aurait',
                  pouve: 'pouvez', save: 'savez', ave: 'avez', mentende: 'm entendez', mentendez: 'm entendez', mentend: 'm entend', voi: 'vois', envi: 'envie', dormire: 'dormir', tp: 'temps',
                  linsuline: 'l insuline', linsulin: 'l insuline', jferme: 'je ferme', jferm: 'je ferme', inkietez: 'inquietez', inkiete: 'inquiete', '2': 'deux' };
  // Mots collés ou abrégés qui demandent une règle plus souple qu'un simple remplacement de mot
  const _GLUE = [[/\bon va fer\b/g, 'on va faire'], [/\b(avez|a|est|fait|etait|ressentez|sentez|prenez|prend) sa\b/g, '$1 ca'], [/\bque c passe\b/g, 'que s est passe'],[/\bj ?m ?a+pp?e+ll?e?\b/g, 'je m appelle'], [/\bsa (va|vous|fait|derange|gene|tourne|dure|date|commence|a|tape|cogne|bat|martele|pulse|tire|serre)\b/g, 'ca $1']];
  const _TU = [
    [/\btu te sens\b/g, 'vous vous sentez'], [/\bte sens tu\b/g, 'vous vous sentez'], [/\bsens tu\b/g, 'sentez vous'],
    [/\bas tu\b/g, 'avez vous'], [/\bes tu\b/g, 'etes vous'], [/\bpeux tu\b/g, 'pouvez vous'], [/\bveux tu\b/g, 'voulez vous'], [/\bvois tu\b/g, 'voyez vous'], [/\bcomprends tu\b/g, 'comprenez vous'],
    [/\bentends tu\b/g, 'entendez vous'], [/\bsais tu\b/g, 'savez vous'], [/\bprends tu\b/g, 'prenez vous'], [/\bbois tu\b/g, 'buvez vous'], [/\bmanges tu\b/g, 'mangez vous'], [/\bdors tu\b/g, 'dormez vous'],
    [/\bfais tu\b/g, 'faites vous'], [/\bvas tu\b/g, 'allez vous'], [/\bdois tu\b/g, 'devez vous'],
    [/\b(tu|t) es\b/g, 'vous etes'], [/\b(tu|t) as\b/g, 'vous avez'], [/\btu peux\b/g, 'vous pouvez'], [/\btu veux\b/g, 'vous voulez'], [/\btu (vois|voies)\b/g, 'vous voyez'], [/\btu comprends\b/g, 'vous comprenez'],
    [/\btu entends\b/g, 'vous entendez'], [/\btu sais\b/g, 'vous savez'], [/\btu vas\b/g, 'vous allez'], [/\btu dois\b/g, 'vous devez'], [/\btu fais\b/g, 'vous faites'], [/\btu prends\b/g, 'vous prenez'],
    [/\btu bois\b/g, 'vous buvez'], [/\btu manges\b/g, 'vous mangez'], [/\btu dors\b/g, 'vous dormez'], [/\btu sens\b/g, 'vous sentez'], [/\btu ressens\b/g, 'vous ressentez'], [/\btu arrives\b/g, 'vous arrivez'],
    [/\b(tu|toi)\b/g, 'vous'], [/\bte\b/g, 'vous'], [/\bton\b/g, 'votre'], [/\bta\b/g, 'votre'], [/\btes\b/g, 'vos']
  ];
  function _prep(n) {
    n = n.split(' ').map(w => Object.prototype.hasOwnProperty.call(_ABBR, w) ? _ABBR[w] : w).join(' ').replace(/\s+/g, ' ').trim();
    _GLUE.forEach(([re, to]) => { n = n.replace(re, to); });
    _TU.forEach(([re, to]) => { n = n.replace(re, to); });
    return n;
  }
  // Distance d'édition (avec inversion de deux lettres = 1 faute) pour tolérer les fautes de frappe
  function _dist(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    const d = []; for (let i = 0; i <= m; i++) { d[i] = [i]; } for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function _active(it, sc) { return !(it.extra && !(sc && sc.answers && sc.answers[it.id])); }
  // Renvoie les identifiants d'intentions reconnues (4 au maximum), dans l'ordre où elles apparaissent.
  function parse(text, scnArg) {
    const n = _prep(_norm(text));
    if (!n) return [];
    const raw = String(text || '').trim();
    const sc = scnArg === undefined ? _curScn() : scnArg;
    const list = (window.App.SimIntents && window.App.SimIntents.LIST) || [];
    let hits = [];
    const covered = [];                                                     // zones du texte déjà expliquées par un motif (pour la tolérance aux fautes)
    list.forEach(it => {
      if (!_active(it, sc)) return;                                         // question propre à certains scénarios
      if ((it.not || []).some(re => re.test(n))) return;
      let score = 0, pos = 1e9;
      const probe = (re, pts) => {
        const m = re.exec(n);
        if (m) { score += pts; pos = Math.min(pos, m.index); if (m[0].length <= 30) covered.push([m.index, m.index + m[0].length]); }
      };
      (it.strong || []).forEach(re => probe(re, 2));
      (it.weak || []).forEach(re => probe(re, 1));
      (it.raw || []).forEach(re => { if (re.test(raw)) { score += 2; pos = Math.min(pos, 0); } });      // motifs sur le texte tel que tapé (majuscules)
      if (score >= (it.min || 2)) hits.push({ it, score, pos });
    });
    const real = hits.filter(h => !h.it.solo);
    if (!hits.length && n.split(' ').length <= 6) {                         // « Merci », « Bon courage » : seulement dans une phrase courte où rien d'autre n'est dit
      list.forEach(it => {
        if (!it.lone || !_active(it, sc) || hits.some(h => h.it === it) || (it.not || []).some(re => re.test(n))) return;
        const m = it.lone.map(re => re.exec(n)).find(Boolean);
        if (m) hits.push({ it, score: 2, pos: m.index });
      });
    }
    // Tolérance aux fautes de frappe : sur tout le texte si rien n'a été compris, sinon seulement sur les mots longs non expliqués
    _fuzzy(n, sc, list, covered, !!real.length).forEach(f => { if (!hits.some(h => h.it === f.it)) hits.push(f); });
    if (hits.some(h => !h.it.solo)) hits = hits.filter(h => !h.it.solo);   // « Bonjour » seul seulement
    const swallowed = new Set(); hits.forEach(h => (h.it.over || []).forEach(o => swallowed.add(o)));
    if (swallowed.size) hits = hits.filter(h => !swallowed.has(h.it.id));        // une question en « avale » d'autres
    hits.sort((a, b) => b.score - a.score);
    hits = hits.slice(0, 4).sort((a, b) => a.pos - b.pos);
    return hits.map(h => h.it.id);
  }
  // Mots courants qu'il ne faut JAMAIS confondre avec un mot-clé (« couleur » n'est pas « douleur », « comprises » n'est pas « comprimés »)
  const _FUZZ_BLOCK = new Set(['couleur', 'couleurs', 'manche', 'manches', 'sommes', 'marge', 'marges', 'valeur', 'valeurs', 'chaleur', 'chambre', 'chambres', 'matin', 'matins', 'malade', 'malades', 'dossier', 'dossiers',
    'comprise', 'comprises', 'compris', 'resident', 'residents', 'residente', 'residentes', 'basse', 'bosses', 'coute', 'couter', 'chutes', 'repose', 'reposes', 'soleil', 'sommes', 'heure', 'heures', 'moral', 'morale', 'morales', 'moraux']);
  const _col = s => s.replace(/(.)\1+/g, '$1');                             // « sonnette » et « sonete » s'écrivent pareil une fois les lettres doubles réduites
  // Un mot tapé presque comme un mot-clé (1 lettre d'écart, lettres doubles oubliées ou en trop, fin du mot abîmée si le mot-clé est long).
  function _near(t, k) {
    if (_FUZZ_BLOCK.has(t) || t[0] !== k[0]) return false;
    const tc = _col(t), kc = _col(k);
    if (kc.length >= 9 && tc.length >= 7 && tc.slice(0, 7) === kc.slice(0, 7)) return true;   // « antecedan » ~ « antecedent »
    if (tc.length < kc.length - 1) return false;
    const d = Math.min(_dist(tc.slice(0, kc.length), kc), _dist(tc.slice(0, kc.length + 1), kc));
    if (kc.length >= 9 && tc.slice(0, 3) === kc.slice(0, 3)) return d <= 2;   // « stagiere » ~ « stagiaire »
    return d <= (kc.length >= 6 ? 1 : 0);                                   // mot-clé court (≤ 5 lettres) : écriture exacte seulement
  }
  function _fuzzy(n, sc, list, covered, strict) {
    let p = 0;
    const toks = n.split(' ').map(t => { const o = { t, i: p }; p += t.length + 1; return o; })
      .filter(o => o.t.length >= (strict ? 6 : 5) && !covered.some(c => o.i < c[1] && o.i + o.t.length > c[0]));
    const out = [];
    if (!toks.length) return out;
    list.forEach(it => {
      if (!_active(it, sc) || !(it.kw || []).length || (it.not || []).some(re => re.test(n))) return;
      let pos = 1e9;
      it.kw.forEach(k => { if (strict && _col(k).length < 6) return; toks.forEach(o => { if (_near(o.t, k)) pos = Math.min(pos, o.i); }); });
      if (pos < 1e9) out.push({ it, score: 2, pos });
    });
    return out;
  }
  // Quand rien n'est reconnu : propose les 2 questions les plus proches (mots en commun avec les libellés)
  const _STOP = new Set(['vous', 'avez', 'etes', 'est', 'ce', 'que', 'qui', 'quoi', 'pour', 'dans', 'les', 'des', 'une', 'votre', 'vos', 'est ce', 'quel', 'quelle', 'avec', 'sans', 'pas', 'plus', 'tout', 'tous', 'cette', 'comme', 'bien', 'aussi', 'mais', 'donc', 'alors', 'fait', 'faire', 'peux', 'pouvez', 'madame', 'monsieur', 'matin', 'quelque', 'chose']);
  function _suggest(text, scnArg) {
    const n = _prep(_norm(text)); if (!n) return [];
    const sc = scnArg === undefined ? _curScn() : scnArg;
    const toks = n.split(' ').filter(t => t.length >= 4 && !_STOP.has(t));
    if (!toks.length) return [];
    const list = (window.App.SimIntents && window.App.SimIntents.LIST) || [];
    const scored = [];
    list.forEach(it => {
      if (!_active(it, sc)) return;
      const words = _norm((it.menu || '') + ' ' + (it.ask || '')).split(' ').filter(w => w.length >= 4 && !_STOP.has(w));
      const kws = it.kw || [];
      let sc2 = 0;
      toks.forEach(t => {
        if (words.some(w => w === t || (w.length >= 5 && t.length >= 5 && _dist(w.slice(0, 5), t.slice(0, 5)) <= 1))) sc2 += 2;
        else if (kws.some(k => t.indexOf(k.slice(0, 5)) === 0)) sc2 += 2;
      });
      if (sc2 >= 2) scored.push({ id: it.id, sc: sc2 });
    });
    scored.sort((a, b) => b.sc - a.sc);
    return scored.slice(0, 2).map(x => x.id);
  }
  // Journal LOCAL des phrases que l'application n'a pas comprises (pour les signaler et les ajouter au vocabulaire)
  const UNK_KEY = 'ifsi_sim_unknown_v1';
  function _unkRead() { try { const a = JSON.parse(localStorage.getItem(UNK_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function _unkAdd(text, scnId) {
    try {
      const t = String(text || '').trim().slice(0, 200); if (!t) return;
      const a = _unkRead().filter(x => x && x.t !== t);
      a.unshift({ t, s: scnId || '', d: new Date().toISOString().slice(0, 10) });
      localStorage.setItem(UNK_KEY, JSON.stringify(a.slice(0, 60)));
    } catch (e) {}
  }
  function unkCopy() {
    const txt = _unkRead().map(x => x.t).join('\n');
    const done = () => { const b = _el('sim-unk-copy'); if (b) { b.textContent = '✓ Copié'; setTimeout(() => { if (b) b.textContent = '📋 Copier la liste'; }, 1600); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, () => {}); return; } } catch (e) {}
    try { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch (e) {}
  }
  function unkClear() { try { localStorage.removeItem(UNK_KEY); } catch (e) {} if (screen === 'liste') render(); }
  function _intent(id) { return ((window.App.SimIntents && window.App.SimIntents.LIST) || []).find(i => i.id === id) || null; }

  // ── Actions du jeu ────────────────────────────────────────────
  function _log(who, text) {
    const c = _cur(); if (!c) return;
    c.log.push({ who, text });
    if (c.log.length > MAX_LOG) c.log.splice(0, c.log.length - MAX_LOG);
  }
  function _find(fid) {            // renvoie true si l'information est nouvelle
    const c = _cur(); if (!c || !fid) return false;
    if (c.found[fid]) return false;
    c.found[fid] = c.actions + 1;   // jamais 0 : reste « vrai »
    return true;
  }
  function _markDone(gid, extra) {
    const c = _cur(); if (!c || !gid || c.done[gid]) return;
    c.done[gid] = Object.assign({ n: c.actions, early: c.firstCare === null }, extra || {});
  }
  function _checkAuto() {
    const c = _cur(), scn = _curScn(); if (!c || !scn) return;
    (scn.autoGestures || []).forEach(g => {
      const ok = (!g.facts || g.facts.every(f => c.found[f]))
              && (!g.asked || g.asked.every(q => c.asked[q]))
              && (!g.objects || g.objects.every(o => c.seenObj[o]));
      if (ok) _markDone(g.id, g.trace ? { retry: (c.errors || 0) > 0 } : null);
    });
  }
  function _factsOf(c, ids) { return (ids || []).filter(f => c.found[f]); }

  function _urgentHint() {                // scénario d'urgence : on rappelle qu'il ne faut pas perdre de temps
    const c = _cur(), scn = _curScn();
    if (!c || !scn || !scn.urgent || c.urgentShown) return;
    if ((scn.urgent.facts || []).some(f => c.found[f]) && c.stage === 'chambre') {
      c.urgentShown = true;
      _log('sys', scn.urgent.message);
    }
  }
  function _afterAction() {
    _checkAuto();
    _urgentHint();
    _save();
    if (!_cur() || _cur().stage !== 'chambre') return;
    _renderLog(); _renderMenu(); _renderActMenu(); _renderStatus(); _renderChambre(); _renderRecueil(); _renderTabs(); _renderSheet();
  }

  function say(text) {
    const c = _cur(), scn = _curScn();
    if (!c || !scn || c.stage !== 'chambre') return;
    text = String(text || '').trim().slice(0, 300);
    if (!text) return;
    const A = parseAct(text);
    if (A.acts.length || A.measure) { _handleAct(A, text); return; }
    _handle(parse(text), text);
  }
  function askMenu(id) {
    const it = _intent(id); if (!it) return;
    _handle([id], _gen(it.ask, _curScn()));
  }
  function _handle(ids, studentText, opts) {
    const c = _cur(), scn = _curScn();
    if (!(opts && opts.skipLog)) _log('me', studentText);
    c.last = null;
    if (!ids.length) {
      c.misses = (c.misses || 0) + 1;
      _log('pat', scn.notUnderstood);
      c.suggest = _suggest(studentText, scn);
      _unkAdd(studentText, scn.id);
      _log('sys', c.suggest.length
        ? '💡 Je n\'ai pas reconnu ta question. Tu voulais peut-être demander l\'une de ces questions (touche-la pour la poser), sinon reformule avec d\'autres mots.'
        : (c.misses >= 2 ? '💡 Astuce : ouvre « 📋 Questions possibles » pour voir ce que tu peux demander. Pose une question à la fois, avec des mots simples.' : '💡 Je n\'ai pas reconnu ta question. Reformule avec d\'autres mots, ou ouvre « 📋 Questions possibles ».'));
      c.actions++;
      _afterAction();
      return;
    }
    c.misses = 0; c.suggest = null;
    const hasContact = ids.some(i => (_intent(i) || {}).contact);
    if (c.actions === 0 && !c.done.g_presentation && !hasContact) _log('pat', scn.whoAreYou);
    ids.forEach(id => {
      let a = scn.answers[id];
      const it = _intent(id) || {};
      // Réponse alternative : le résident ne dit la vérité que si tu as déjà observé certains indices
      // (when.found), ou si tu l'as mis en confiance (when.asked). Sans indice, il minimise.
      let alt = false;
      if (a && a.alt && a.alt.when) {
        const w = a.alt.when;
        alt = (w.found || []).some(f => c.found[f]) || (w.asked || []).some(q => c.asked[q]);
        if (alt) a = a.alt;
      }
      const altKey = id + '#alt';
      const again = alt ? (c.asked[altKey] || 0) > 0 : ((c.asked[id] || 0) > 0 && !it.contact);
      c.asked[id] = (c.asked[id] || 0) + 1;
      if (alt) c.asked[altKey] = (c.asked[altKey] || 0) + 1;
      _log('pat', (again ? 'Je vous l\'ai déjà dit… ' : '') + (a ? a.text : scn.fallbackAnswer));
      if (a) { (a.reveals || []).forEach(_find); (a.logs || []).forEach(_markDone); }
    });
    c.actions++;
    _afterAction();
  }

  // ── Gestes de sécurité pendant le recueil : installer, alerter, oxygène ─────────────────────────────
  // L'étudiant peut TAPER ce qu'il fait (« je l'installe assise », « j'appelle l'infirmière ») ou toucher un bouton
  // du menu « 🩺 Agir ». Ce que vaut chaque geste dépend du patient (data/sim_soins.js). Rien n'est caché : la
  // réaction du patient et une explication s'affichent tout de suite, et une erreur se corrige (on le réinstalle).
  // Hors score : bonus d'XP pour les bons gestes ; un geste DANGEREUX laissé en place à la fin plafonne le score.
  const _SO = () => window.App.SimSoins || { POS: [], O2: [], DEFAULT: {}, cases: {} };
  const _gx = (t, scn) => _gen(String(t == null ? '' : t).replace(/\{e\}/g, _male(scn) ? '' : 'e'), scn);
  function _soinsOf(scn) {
    const S = _SO(), cs = (S.cases || {})[scn.id] || {}, D = S.DEFAULT || {};
    return { vital: cs.vital != null ? !!cs.vital : !!D.vital, pos: cs.pos || {}, o2: Object.assign({}, D.o2 || {}, cs.o2 || {}),
             alert: Object.assign({}, D.alert || {}, cs.nurse || {}), rester: Object.assign({}, D.rester || {}, cs.rester || {}) };
  }
  const _DEBW = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, quinze: 15 };
  const _RE_ACT = {
    subj: /\b(je|j|on|nous)\b/,
    inf: /^(?:(?:alors|donc|bon|ok|ensuite|puis|et|il faut|faut|je dois|je vais|on doit)\s+)*(?:mettre|installer|alerter|appeler|prevenir|allonger|asseoir|assoir|relever|sonner|donner|brancher|lancer|faire venir|rester|surelever|redresser|coucher|baisser|retirer|enlever|arreter|couper|mets|installe|appelle|allonge|assois|assieds|previens|appuie|sonne|branche|donne|lance|couche|releve|baisse|arrete|coupe|enleve|retire|alerte)\b/,
    ask: /\b(puis je|pourrais je|est ce que je|voulez vous que je|souhaitez vous que je|dois je|faut il que je|vous voulez que je|vous souhaitez que je)\b/,
    neg: /\b(je|j|on) (ne|n) |\bm appel\w*|\bje (vois|constate|remarque|note|observe|vois bien)\b/,
    bord1: /\b(bord du lit|au bord|fauteuil|chaise)\b/,
    bord2: /\b(?:je|j|on) (?:le |la |l |vous )?(?:leve|fais lever|fais marcher|mets debout|mettre debout|fais debout|aide a (?:me |se |vous )?lever|aide a marcher)\b(?! (?:le |la |les |l |vos |votre |ses |sa |son |ma |mon |mes |un |une )?(?:dossier|bras|jambes?|mains?|pieds?|doigts?|yeux|tete|lit|drap|couverture|rideau|store|volet|fenetre|cote|verre|plateau|table|oreiller|paupieres?|menton|epaules?))/,
    pls: /\b(pls|position laterale|laterale de securite|sur le cote|sur le flanc)\b/,
    jambes: /\b(surelev\w*|jambes? (?:en )?(?:l air|hauteur|surelevees?|relevees?)|releve\w* (?:les |ses |vos )?jambes|mets? (?:les |ses |vos )?jambes (?:en haut|en l air|sur))\b/,
    demi: /\b(demi assis\w*|semi assis\w*|(?:30|45) degres?|30 a 45|(?:relev|monte|redress)\w* (?:un peu |legerement |doucement |encore )?(?:le |la |son |votre |l )?(?:dossier|tete de lit|tete du lit))\b/,
    assise: /\b(assis|assise|assoi\w*|assie\w*|asseoir|assoir|position assise|(?:cale\w*|calage) (?:par |avec )?(?:les |des )?oreillers?)\b/,
    allong: /\b(?:je |j |on )?(?:le |la |l |vous )?(?:allonge\w*|couche\w*|recouche\w*|mets? a plat|mettre a plat|baisse\w* (?:le |la |son )?dossier)\b/,
    alV: /\b(appel\w*|alerte\w*|alerter|prevenir|previens|preven\w*|sonne\w*|sonner|appuie\w*|appuyer|declenche\w*|hele|crie\w*|fais venir|fait venir|faire venir|demande\w* (?:de )?l aide)\b/,
    alT: /\b(infirmi\w*|tutri\w*|tuteur|sophie|claire|ide|referente|karim|aide soignant\w*|collegue|equipe|renfort\w*|quelqu un|aide|secours|medecin|samu|sonnette|bouton d appel|bouton rouge|poire|cadre|le 15|pompiers?)\b/,
    alGo: /\b(vais|cours|pars|file|vole|monte|descends|retourne)\b[^.?]*\b(chercher|voir|prevenir|appeler|poste)\b/,
    alC: /\b(?:vais|cours|pars|file|vole)\b[^.?]*\b(?:chercher|voir|trouver)\b/,
    alY: /\b(venez|viens|accourez|vite|urgence|a l aide|au secours)\b/,
    alP: /\b(infirmi\w*|tutri\w*|sophie|claire|ide|karim|aide soignant\w*|referente|collegue)\b/,
    alSamu: /\b(samu|le 15|pompiers?)\b/,
    o2N: /\b(oxygen\w*|o2|o 2|o deux|deux ?o|masque a oxygene|lunettes? a oxygene|lunettes? nasales?|sonde nasale|haute concentration|mhc)\b/,
    o2On: /\b(met\w*|mett\w*|install\w*|branch\w*|donn\w*|pos\w*|lance\w*|demarr\w*|administr\w*|ouvr\w*|regl\w*|place\w*|sous|met)\b/,
    o2Off: /\b(enleve\w*|enlever|retire\w*|retirer|arrete\w*|arreter|coupe\w*|couper|stoppe\w*|ote\w*)\b/,
    deb: /\b(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze) ?(?:l|litres?|l ?min)\b/,
    rest: /\b(?:je|j) (?:reste|ne (?:vous |le |la |l )?quitte pas|ne bouge pas|ne pars pas)\b|\brester (?:aupres|pres|avec)\b/,
    meas: /\b(?:je|j|on)\b(?! (?:vais|viens|voudrais|souhaite|dois|peux|veux|aimerais|comptais|me propose))[^.?]*\b(?:prends?|prend|mesure\w*|pose\w*|place\w*|gonfle\w*|branche\w*|compte\w*|verifi\w*|controle\w*|releve\w*|lis|note\w*|effectue\w*|fais|fait)\b[^.?]*\b(?:tension|brassard|saturometre|oxymetre|thermometre|temperature|pouls|frequence respiratoire|frequence cardiaque|glycemie|dextro|constantes|saturation)\b/
  };
  // Reconnaît ce que l'étudiant FAIT (pas ce qu'il demande). Renvoie { acts: [...], measure: bool }.
  function parseAct(text) {
    const raw = String(text || ''), n = _prep(_norm(raw)), R = _RE_ACT, out = { acts: [], measure: false };
    if (!n) return out;
    const isQ = /\?\s*$/.test(raw.trim()) && !/^(?:je|j['’]|on |nous )/i.test(raw.trim());
    if (R.meas.test(n) && !/\?/.test(raw)) out.measure = true;                        // « Je pose le saturomètre » : c'est à toi de faire le geste
    if (R.alY.test(n) && R.alP.test(n) && !R.alV.test(n) && !R.ask.test(n)) { out.acts.push({ k: 'alerte', how: 'sonnette' }); return out; }   // « Sophie, venez vite ! »
    if (R.rest.test(n) && !isQ) out.acts.push({ k: 'reste' });
    if (R.ask.test(n) || isQ || R.neg.test(n)) return out;
    if (!(R.subj.test(n) || R.inf.test(n))) return out;
    // position (une seule : la plus précise)
    let pos = null;
    if (R.pls.test(n)) pos = 'pls';
    else if (R.jambes.test(n)) pos = 'jambes';
    else if (R.bord2.test(n) || (R.bord1.test(n) && (R.assise.test(n) || /\b(install\w*|aide\w*|mets?|met|mett\w*|transf\w*)\b/.test(n)))) pos = 'bord';
    else if (R.demi.test(n)) pos = 'demi';
    else if (R.assise.test(n)) pos = 'assise';
    else if (R.allong.test(n)) pos = 'allongee';
    if (pos) out.acts.push({ k: 'pos', id: pos });
    // alerte
    if ((R.alV.test(n) && R.alT.test(n)) || (R.alC.test(n) && R.alP.test(n))) {
      out.acts.push({ k: 'alerte', how: R.alGo.test(n) ? 'chercher' : (R.alSamu.test(n) && !/\b(infirmi\w*|tutri\w*|sophie|claire|ide)\b/.test(n) ? 'samu' : 'sonnette') });
    }
    // oxygène
    if (R.o2N.test(n) || (/\bdebit\b/.test(n) && /\b(baisse\w*|diminue\w*|reduis\w*|monte\w*|augmente\w*|regle\w*)\b/.test(n))) {
      if (R.o2N.test(n) && R.o2Off.test(n)) out.acts.push({ k: 'o2stop' });
      else if (R.o2On.test(n) || /\bdebit\b/.test(n)) {
        const m = R.deb.exec(n); let deb = null;
        if (m) deb = /^\d/.test(m[1]) ? parseFloat(m[1].replace(',', '.')) : _DEBW[m[1]];
        const dev = /\b(haute concentration|mhc|non reinspirant|reservoir)\b/.test(n) ? 'mhc' : (/\bmasque\b/.test(n) ? 'masque' : (/\b(lunettes?|nasales?|sonde)\b/.test(n) ? 'lunettes' : null));
        out.acts.push({ k: 'o2', dev, deb });
      }
    }
    return out;
  }
  const _ACT_DROP = ['q_mobilite', 'q_sonnette', 'q_equipe'];           // intentions que ces phrases d'action déclenchaient à tort
  function _careEv(k, id, v) { const c = _cur(); c.care.ev.push({ k, id, v, n: c.actions }); if (c.care.ev.length > 60) c.care.ev.splice(0, c.care.ev.length - 60); }
  function _careSay(who, text) { _log(who, _gx(text, _curScn())); }
  function _verdictLine(v, why) {
    if (!why) return;
    const scn = _curScn();
    if (v === 'good') _careSay('good', '✓ ' + why);
    else if (v === 'ok') _careSay('narr', why);
    else if (v === 'avoid') _careSay('sys', '⚠ À éviter. ' + why);
    else _careSay('bad', '⛔ Dangereux. ' + why + ' Corrige tout de suite ' + _agir(scn) + '.');
  }
  const _nurse = scn => (scn.call && scn.call.who) || 'Sophie';
  const _agir = scn => scn && scn.direct ? 'sur le dessin de la chambre (lit, prise d\'oxygène au mur, sonnette)' : 'avec « 🩺 Agir »';
  function _runPos(id) {
    const c = _cur(), scn = _curScn(), S = _soinsOf(scn), P = _SO().POS.find(p => p.id === id); if (!P) return;
    const r = S.pos[id] || { v: 'ok', pat: '', why: '' };
    if (c.care.pos && c.care.pos.id === id) { _log('sys', 'Tu l\'as déjà installé' + (_male(scn) ? '' : 'e') + ' ainsi : ' + _gx(P.short, scn) + '.'); return; }
    c.care.pos = { id, v: r.v }; _careEv('pos', id, r.v);
    if (r.pat) _careSay('pat', r.pat);
    _verdictLine(r.v, r.why);
    if (r.v === 'danger' || r.v === 'avoid') c.care.bad = (c.care.bad || 0) + 1;
  }
  function _runAlert(how) {
    const c = _cur(), scn = _curScn(), S = _soinsOf(scn), A = S.alert, who = _nurse(scn);
    if (c.care.alert) { _careSay('ide', who + ' : « ' + A.again + ' »'); return; }
    const v = how === 'chercher' ? (S.vital ? 'avoid' : 'ok') : (S.vital && how === 'sonnette' ? 'good' : 'ok');
    c.care.alert = { how, v, n: c.actions, found: Object.keys(c.found).length };
    c.care.stay = how !== 'chercher';
    _careEv('alerte', how, v);
    if (how === 'chercher') _log('narr', '(Tu quittes la chambre en vitesse pour aller chercher ' + who + '…)');
    else if (how === 'samu') _careSay('ide', who + ' arrive : « C\'est moi qui appelle le 15, pas toi : tu as bien fait de me prévenir. Je m\'en occupe. ' + (S.vital ? A.vitalOk : A.prompt) + ' »');
    if (how !== 'samu') _careSay('ide', who + (how === 'chercher' ? ' : « ' + A.left + ' »' : ' arrive : « ' + (S.vital ? A.vitalOk : A.prompt) + ' »'));
    if (how === 'chercher') _log('narr', '(Tu reviens dans la chambre avec ' + who + '.)');
    _verdictLine(v, how === 'chercher' ? A.whyLeft : (how === 'samu' ? 'À l\'EHPAD, l\'étudiant ne déclenche pas le 15 tout seul : il alerte l\'infirmière, qui évalue et décide d\'appeler (ou le médecin). Tu as bien fait de demander de l\'aide sans attendre.' : (S.vital ? A.whyGood : A.whyOk)));
  }
  function _o2Level(S, dev, deb) {                       // ce que vaut un réglage d'oxygène chez CE patient
    const o = S.o2;
    if (o.rule === 'high') {                            // détresse avec hypoxémie, sans risque d'hypercapnie : il faut un débit suffisant
      if (dev === 'mhc' || (dev === 'masque' && deb >= 6)) return 'good';
      return 'avoid';                                   // lunettes ou petit débit : insuffisant
    }
    if (!o.byDeb) return 'ok';                          // autorisé (urgence vitale) mais sans bénéfice ici : le texte du cas l'explique
    if (dev === 'mhc' || deb >= 10) return 'danger';
    if (dev === 'lunettes' && deb > 0 && deb <= 2) return 'good';
    return 'avoid';
  }
  function _runO2(a) {
    const c = _cur(), scn = _curScn(), S = _soinsOf(scn), o = S.o2, who = _nurse(scn);
    if (o.mode === 'refuse') {
      _careSay('pat', o.pat); _verdictLine('avoid', o.why); _careEv('o2', 'refus', 'avoid'); c.care.bad = (c.care.bad || 0) + 1; return;
    }
    let dev = a.dev, deb = a.deb;
    if (deb == null && dev === 'mhc') deb = 15;
    if (deb == null || !(deb > 0)) {                      // pas de débit précisé : on demande, sans rien lancer
      _menuAct = true; _menuOpen = false;
      _log('sys', '💡 À quel débit ? Précise-le (par exemple « de l\'oxygène aux lunettes à 2 litres ») ou ' + (_curScn() && _curScn().direct ? 'touche la prise d\'oxygène au mur, sur le dessin de la chambre' : 'choisis dans « 🩺 Agir »') + '. L\'oxygène est un médicament : le débit compte.');
      return;
    }
    if (!dev) dev = deb >= 6 ? 'masque' : (c.care.o2 ? c.care.o2.dev : 'lunettes');
    const v = _o2Level(S, dev, deb);
    c.care.o2 = { dev, deb, v }; _careEv('o2', dev + ' ' + deb, v);
    const r = (o.byDeb || o.rule) ? (o[v] || {}) : { pat: o.pat, why: o.why };
    if (r.pat) _careSay('pat', r.pat);
    _verdictLine(v === 'good' ? 'good' : v, r.why);
    if (v === 'good' && !c.care.alert) _log('sys', '💡 Dans la réalité, c\'est l\'infirmière qui décide et règle l\'oxygène : alerte ' + who + ' d\'abord (' + (scn.direct ? 'touche la sonnette sur le dessin' : '« 🩺 Agir » → sonnette') + ').');
    if (c.care.alert) {                                   // l'infirmière est dans la chambre : elle réagit
      if (v === 'danger') _careSay('ide', who + ' : « Stop ! Baisse le débit tout de suite : c\'est moi qui règle l\'oxygène. »');
      else if (v === 'good') _careSay('ide', who + ' : « ' + (o.nurseGood || 'Oui, à faible débit, c\'est bien. Je prends le relais pour la prescription et le réglage ; surveille sa saturation et sa vigilance.') + ' »');
    }
    if (v !== 'good') c.care.bad = (c.care.bad || 0) + 1;
  }
  function _runO2Stop() {
    const c = _cur(), scn = _curScn();
    if (!c.care.o2) { _log('narr', '(Il n\'y a pas d\'oxygène en route.)'); return; }
    c.care.o2 = null; _careEv('o2', 'stop', 'ok'); _log('narr', '(Tu arrêtes l\'oxygène et tu retires le matériel.)');
  }
  function _runStay() {
    const c = _cur(), scn = _curScn(), S = _soinsOf(scn);
    if (c.care.stay && c.care.stayShown) { _log('narr', '(Tu es toujours près de ' + (_male(scn) ? 'lui' : 'elle') + '.)'); return; }
    c.care.stay = true; c.care.stayShown = true; _careEv('reste', '', S.vital ? 'good' : 'ok');
    _careSay('narr', S.rester.pat); _verdictLine(S.vital ? 'good' : 'ok', S.rester.why);
  }
  function _runAct(a) {
    if (a.k === 'pos') _runPos(a.id);
    else if (a.k === 'alerte') _runAlert(a.how);
    else if (a.k === 'o2') _runO2(a);
    else if (a.k === 'o2stop') _runO2Stop();
    else if (a.k === 'reste') _runStay();
  }
  const MEASURE_HINT = '🩺 Pour mesurer ou relever une constante, c\'est toi qui fais le geste : ouvre l\'onglet « Chambre » et choisis l\'instrument (le pouls se lit sur le saturomètre ou sur le scope). Ici, tu parles au résident ou tu agis (position, alerte, oxygène).';
  function _handleAct(A, text, noParse) {
    const c = _cur();
    _log('me', text); c.last = null; c.misses = 0; c.suggest = null;
    if (A.measure) _log('sys', MEASURE_HINT);
    A.acts.forEach(_runAct);
    let ids = (noParse || (A.measure && !/\?/.test(text))) ? [] : parse(text);
    if (A.acts.length) ids = ids.filter(i => _ACT_DROP.indexOf(i) < 0);
    if (ids.length) { _handle(ids, text, { skipLog: true }); return; }
    c.actions++; _afterAction();
  }
  // Bouton « Agir » : kind = pos | alerte | o2 | o2stop | reste
  function act(kind, arg) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre') return;
    const S = _SO();
    let a = null, say = '';
    if (kind === 'pos') { const P = S.POS.find(p => p.id === arg); if (!P) return; a = { k: 'pos', id: P.id }; say = P.say; }
    else if (kind === 'alerte') { a = { k: 'alerte', how: arg === 'chercher' ? 'chercher' : 'sonnette' };
      say = arg === 'chercher' ? 'Je vais chercher ' + _nurse(scn) + ' au poste de soins.' : 'J\'appuie sur la sonnette d\'appel pour faire venir ' + _nurse(scn) + '.'; }
    else if (kind === 'o2') { const O = S.O2.find(p => p.id === arg); if (!O) return; a = { k: 'o2', dev: O.dev, deb: O.deb }; say = O.say; }
    else if (kind === 'o2stop') { a = { k: 'o2stop' }; say = 'J\'arrête l\'oxygène.'; }
    else if (kind === 'reste') { a = { k: 'reste' }; say = 'Je reste près de vous, je ne vous quitte pas.'; }
    if (!a) return;
    _handleAct({ acts: [a], measure: false }, _gx(say, scn), true);
  }
  let _menuAct = false;
  function toggleAct() { _menuAct = !_menuAct; if (_menuAct) _menuOpen = false; _renderMenu(); _renderActMenu(); }
  function _renderActMenu() {
    const m = _el('sim-actmenu'), b = _el('sim-act-btn'), c = _cur(), scn = _curScn(); if (!m || !c || !scn) return;
    m.style.display = _menuAct ? 'block' : 'none';
    if (b) b.setAttribute('aria-expanded', _menuAct ? 'true' : 'false');
    if (!_menuAct) return;
    const S = _SO(), cp = c.care.pos ? c.care.pos.id : null, co = c.care.o2, who = _nurse(scn);
    const btn = (on, js, txt) => `<button type="button" class="sim-q ${on ? 'done' : ''}" onclick="${js}">${on ? '✓ ' : ''}${_esc(txt)}</button>`;
    m.innerHTML = `<div class="sim-actgrp"><div class="sim-acth">Installer ${_gen('la résidente', scn)}</div>
        ${S.POS.map(p => btn(cp === p.id, `App.Sim.act('pos','${p.id}')`, p.ico + ' ' + _gx(p.label, scn))).join('')}</div>
      <div class="sim-actgrp"><div class="sim-acth">Appeler à l'aide</div>
        ${btn(!!(c.care.alert && c.care.alert.how !== 'chercher'), `App.Sim.act('alerte','sonnette')`, '🔔 Appuyer sur la sonnette d\'appel : ' + who + ' arrive')}
        ${btn(!!(c.care.alert && c.care.alert.how === 'chercher'), `App.Sim.act('alerte','chercher')`, '🏃 Aller chercher ' + who + ' au poste de soins')}
        ${btn(!!c.care.stay, `App.Sim.act('reste','')`, '🤝 Rester près de ' + (_male(scn) ? 'lui' : 'elle') + ' et le rassurer'.replace('le rassurer', _male(scn) ? 'le rassurer' : 'la rassurer'))}</div>
      <div class="sim-actgrp"><div class="sim-acth">Oxygène <span class="sim-muted sim-small">(un médicament : le débit compte)</span></div>
        ${S.O2.map(o => btn(!!(co && co.dev === o.dev && co.deb === o.deb), `App.Sim.act('o2','${o.id}')`, '🫁 ' + o.label)).join('')}
        ${co ? btn(false, `App.Sim.act('o2stop','')`, '⏹ Arrêter l\'oxygène') : ''}</div>
      <div class="sim-muted sim-small sim-menu-tip">Tu peux aussi taper ce que tu fais : « je l'installe assise », « j'appelle l'infirmière », « je mets de l'oxygène à 2 litres ». Mesures (tension, saturation…) : onglet « Chambre ».</div>`;
  }
  function _renderStatus() {
    const el = _el('sim-status'), c = _cur(), scn = _curScn(); if (!el || !c || !scn) return;
    const S = _SO(), chips = [];
    if (c.care.pos) { const P = S.POS.find(p => p.id === c.care.pos.id); if (P) chips.push('🛏️ ' + _gx(P.short, scn)); }
    if (c.care.o2) chips.push('🫁 O₂ ' + (c.care.o2.dev === 'mhc' ? 'masque haute conc.' : c.care.o2.dev) + ' ' + String(c.care.o2.deb).replace('.', ',') + ' L/min');
    if (c.care.alert) chips.push('👩‍⚕️ ' + _nurse(scn) + ' est là');
    if (c.care.stay) chips.push('🤝 Tu restes près de ' + (_male(scn) ? 'lui' : 'elle'));
    el.hidden = !chips.length;
    el.innerHTML = chips.map(x => `<span class="sim-chip sim-chip-st">${_esc(x)}</span>`).join('');
  }
  // Bilan des gestes de sécurité : points d'XP (hors score) et gestes dangereux laissés en place
  function _soinsResults(c, scn) {
    const care = c.care || { ev: [] }, S = _soinsOf(scn), unsafe = [];
    const al = care.alert || null, pos = care.pos || null, o2 = care.o2 || null;
    if (pos && pos.v === 'danger') { const P = _SO().POS.find(p => p.id === pos.id); unsafe.push('Position dangereuse laissée en place pendant le recueil : ' + (P ? _gx(P.short, scn).toLowerCase() : pos.id) + '.'); }
    if (o2 && o2.v === 'danger') unsafe.push('Oxygène à un débit dangereux laissé en place pendant le recueil (' + (o2.dev === 'mhc' ? 'masque haute concentration' : o2.dev) + ', ' + String(o2.deb).replace('.', ',') + ' L/min).');
    let bonus = (al ? (al.v === 'good' ? 3 : (al.v === 'ok' ? 2 : 1)) : 0) + (pos ? (pos.v === 'good' ? 3 : (pos.v === 'ok' ? 1 : 0)) : 0) + (o2 && o2.v === 'good' ? (al ? 2 : 1) : 0) + (care.stay ? 1 : 0);
    if (unsafe.length) bonus = 0;
    return { vital: S.vital, alert: al, pos, o2, stay: !!care.stay, tried: (care.ev || []).length > 0, bonus: Math.min(9, bonus), unsafe };
  }
  function _soinsBilanHtml(c, scn, R) {
    const so = R && R.soins; if (!so) return '';
    const S = _soinsOf(scn), A = S.alert, P = _SO().POS, mk = v => v === 'good' ? '✓' : (v === 'ok' ? '•' : (v === 'avoid' ? '⚠' : '⛔'));
    const rows = [];
    if (so.alert) rows.push(`<div class="sim-row-res ${so.alert.v === 'good' || so.alert.v === 'ok' ? 'ok' : 'late'}"><span class="sim-mark">${mk(so.alert.v)}</span><div><b>Tu as alerté ${_esc(_nurse(scn))} pendant le recueil</b><div class="sim-muted sim-small">${_esc(_gx(so.alert.v === 'avoid' ? A.whyLeft : (S.vital ? A.whyGood : A.whyOk), scn))}</div></div></div>`);
    else if (so.vital) rows.push(`<div class="sim-row-res miss"><span class="sim-mark">✗</span><div><b>Tu n'as pas alerté ${_esc(_nurse(scn))} pendant le recueil</b><div class="sim-muted sim-small">Dans une urgence, on prévient dès qu'on repère des signes de gravité : sonnette ou Karim, sans quitter la personne. Tu l'as fait plus tard, à l'étape « Décision » : c'est moins rapide.</div></div></div>`);
    if (so.pos) { const r = (S.pos[so.pos.id] || {}), L = P.find(p => p.id === so.pos.id);
      rows.push(`<div class="sim-row-res ${so.pos.v === 'good' || so.pos.v === 'ok' ? 'ok' : 'late'}"><span class="sim-mark">${mk(so.pos.v)}</span><div><b>Position à la fin du recueil : ${_esc(_gx(L ? L.short : so.pos.id, scn).toLowerCase())}</b><div class="sim-muted sim-small">${_esc(_gx(r.why || '', scn))}</div></div></div>`); }
    if (so.o2) rows.push(`<div class="sim-row-res ${so.o2.v === 'good' ? 'ok' : 'late'}"><span class="sim-mark">${mk(so.o2.v)}</span><div><b>Oxygène en route à la fin du recueil : ${_esc(so.o2.dev === 'mhc' ? 'masque haute concentration' : so.o2.dev)}, ${_esc(String(so.o2.deb).replace('.', ','))} L/min</b><div class="sim-muted sim-small">${_esc(_gx((S.o2.byDeb ? (S.o2[so.o2.v] || {}) : S.o2).why || '', scn))}</div></div></div>`);
    if (so.stay) rows.push(`<div class="sim-row-res ok"><span class="sim-mark">✓</span><div><b>Tu es resté(e) près ${_gen('de la résidente', scn)}</b><div class="sim-muted sim-small">Rester auprès de la personne qui va mal la rassure et permet de surveiller sa respiration et sa vigilance.</div></div></div>`);
    if (!rows.length) return so.vital ? `<h3 class="sim-h">🩺 Gestes de sécurité pendant le recueil</h3><div class="sim-card"><p class="sim-muted sim-small">Tu n'as fait aucun geste de sécurité pendant le recueil (alerter, installer, rester près de ${_male(scn) ? 'lui' : 'elle'}). Dans ce cas d'urgence, ils comptent : tu peux les faire dès que tu repères des signes de gravité, avec « 🩺 Agir » ou en tapant ce que tu fais.</p></div>` : '';
    return `<h3 class="sim-h">🩺 Gestes de sécurité pendant le recueil</h3><div class="sim-card">${rows.join('')}<div class="sim-muted sim-small" style="margin-top:8px">${so.bonus ? '+' + so.bonus + ' XP pour ces gestes (hors score). ' : ''}Repères à valider avec ton formateur et les protocoles de ton stage ; l'oxygène est un médicament.</div></div>`;
  }

  // ── Instruments : c'est l'étudiant qui fait le geste ──────────
  // Choisir l'instrument → le poser au bon endroit sur la patiente → attendre ou compter → lire l'écran →
  // NOTER lui-même la valeur dans le recueil. Rien n'est ajouté au recueil tant qu'il ne l'a pas noté.
  const _toolFacts = t => t.multi ? t.multi.map(m => m.fact) : [t.fact].concat(t.also ? [t.also.fact] : []);
  function _toolOfFact(scn, fid, c) {
    const ks = Object.keys(scn.tools).filter(k => _toolFacts(scn.tools[k]).indexOf(fid) >= 0);
    return (c && ks.find(k => c.pending[k])) || ks[0] || null;
  }
  const _nMeas = scn => { const set = {}; scn.toolOrder.forEach(k => _toolFacts(scn.tools[k]).forEach(f => { set[f] = 1; })); return Object.keys(set).length; };
  function _gClear() { _timers.forEach(t => { clearInterval(t); clearTimeout(t); }); _timers = []; _G = null; _hint = ''; }
  function _gReset() { _gClear(); _tool = null; _zoom = 'room'; _autoZoom = false; if (_anim) { cancelAnimationFrame(_anim); _anim = null; } }

  function pickTool(key) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre' || !scn.tools[key]) return;
    if (_tool === key) return dropTool();
    _gClear(); _tool = key;
    { const t = scn.tools[key]; if (t.waste && c.waste && !c.waste.done && c.found[t.fact]) _startWaste(key); }
    if (_zoom === 'room') _setZoom('patient', true);
    _renderToolbar(); _renderGesture(); _syncScene();
  }
  function dropTool() {
    _gClear(); _tool = null;
    if (_autoZoom) _setZoom('room', false);
    _renderToolbar(); _renderGesture(); _syncScene();
  }
  function hot(id) {                    // touche sur un élément du dessin
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre' || !id) return;
    const viaScene = scn.sceneTools && scn.sceneTools[id];
    if (viaScene) return pickTool(viaScene);
    if (_tool && (id === 'patiente' || id.indexOf('zone-') === 0)) return _applyTool(id);
    if (id.indexOf('zone-') === 0) return;
    if (id === 'dispenser') return sha();
    if (scn.sceneActs && scn.sceneActs[id]) { _sheet = _sheet === id ? null : id; _renderSheet(); return; }
    if (scn.objects[id]) return useObject(id);
  }
  // ── Actions directes sur le dessin (cas « direct ») : on touche le lit, la prise d'oxygène, la sonnette, le patient ──
  // scn.sceneActs[id] = { ico, title, hint, opts: [{ ico, label, do: ['pos', id] | ['o2', id] | ['o2stop'] | ['alerte', 'sonnette'] | ['reste'] | ['obs', objetId] }] }
  let _sheet = null;
  function _sheetOn(o, c) {
    const d = o.do || [];
    if (d[0] === 'pos') return !!(c.care.pos && c.care.pos.id === d[1]);
    if (d[0] === 'o2') { const O = _SO().O2.find(x => x.id === d[1]); return !!(O && c.care.o2 && c.care.o2.dev === O.dev && c.care.o2.deb === O.deb); }
    if (d[0] === 'alerte') return !!(c.care.alert && c.care.alert.how !== 'chercher');
    if (d[0] === 'reste') return !!c.care.stay;
    if (d[0] === 'obs') return !!c.seenObj[d[1]];
    return false;
  }
  function _renderSheet() {
    const el = _el('sim-sheet'), c = _cur(), scn = _curScn(); if (!el) return;
    const d = _sheet && scn && scn.sceneActs && scn.sceneActs[_sheet];
    if (!d || !c || c.stage !== 'chambre') { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<div class="sim-sheet-h"><b>${_esc(d.ico || '')} ${_esc(_gx(d.title, scn))}</b><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sim.sheetClose()">✕ Fermer</button></div>
      ${d.hint ? `<div class="sim-muted sim-small">${_esc(_gx(d.hint, scn))}</div>` : ''}
      <div class="sim-sheet-opts">${d.opts.map((o, i) => { const on = _sheetOn(o, c);
        return `<button type="button" class="sim-q ${on ? 'done' : ''}" onclick="App.Sim.sheetDo('${_esc(_sheet)}',${i})">${on ? '✓ ' : ''}${_esc(o.ico || '')} ${_esc(_gx(o.label, scn))}</button>`; }).join('')}</div>`;
  }
  function sheetDo(id, i) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre') return;
    const d = scn.sceneActs && scn.sceneActs[id], o = d && d.opts[i]; if (!o) return;
    const a = o.do || [];
    _sheet = null;
    if (a[0] === 'obs') useObject(a[1]); else act(a[0], a[1]);
    _renderSheet();
  }
  function sheetClose() { _sheet = null; _renderSheet(); }
  function _applyTool(zone) {
    const c = _cur(), scn = _curScn(), t = scn.tools[_tool];
    if (t.kind === 'scope') return _scopeZone(zone);
    if (_G) return;                                                  // un geste est déjà en cours
    const ok = t.zone === '*' ? (zone === 'patiente' || zone.indexOf('zone-') === 0) : zone === t.zone;
    if (!ok) { c.misplaced++; _hint = t.where; _save(); _renderGesture(); return; }
    if (c.firstCare === null) c.firstCare = c.actions;
    c.actions++;
    _hint = '';
    if (t.prep && !(c.prep[_tool] && c.prep[_tool].passed) && !(c.prep[_tool] && c.prep[_tool].revealed && c.prep[_tool].go)) {
      const pr = c.prep[_tool] = c.prep[_tool] || { tries: 0, passed: false, sel: [], order: _shuffleIds(t.prep.items.map(i => i.id)) };
      pr.sel = []; pr.revealed = false;
      _log('narr', 'Tu prépares ton matériel avant de piquer.'); c.last = { text: 'Prépare ta sécurité avant de piquer.', facts: [] };
      _G = { tool: _tool, kind: t.kind, phase: 'prep', errs: 0, placeErrs: 0, n: 0 };
      _save(); _renderLog(); _renderChambre(); _renderGesture(false);
      return;
    }
    _log('narr', t.start); c.last = { text: t.start, facts: [] };
    _G = { tool: _tool, kind: t.kind, phase: 'start', errs: 0, placeErrs: 0, n: 0 };
    if (t.kind === 'instant' || t.kind === 'wait') _gMeasure(t.seconds);
    else if (t.kind === 'cuff') _G.phase = 'place';
    else if (t.kind === 'count') _G.phase = 'ready';
    else if (t.kind === 'scale') { _G.phase = 'read'; c.pending[_tool] = true; }
    _save(); _renderLog(); _renderChambre(); _renderRecueil(); _renderGesture(t.kind === 'scale');
  }
  // ── Préparation de sécurité (glycémie capillaire) : on coche ce qu'on fait avant de piquer ──
  function _shuffleIds(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function gPrepToggle(id) {
    const c = _cur(); if (!c || !_G || _G.phase !== 'prep') return;
    const pr = c.prep[_G.tool]; if (!pr || pr.revealed) return;
    const k = pr.sel.indexOf(id); if (k >= 0) pr.sel.splice(k, 1); else pr.sel.push(id);
    _hint = ''; _save(); _renderGesture(false);
  }
  function _prepGo(key) {                 // la préparation est faite : on pique
    const c = _cur(), scn = _curScn(), t = scn.tools[key], pr = c.prep[key]; if (!c || !_G) return;
    pr.go = true;
    _log('narr', t.start); c.last = { text: t.start, facts: [] };
    _G.phase = 'start';
    _hint = '';
    _gMeasure(t.seconds);
    _save(); _renderLog(); _renderChambre(); _renderRecueil(); _renderGesture(false);
  }
  function gPrepSubmit() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || !_G || _G.phase !== 'prep') return;
    const key = _G.tool, t = scn.tools[key], pr = c.prep[key];
    if (pr.revealed) return _prepGo(key);
    const items = t.prep.items;
    const missing = items.filter(i => i.ok && pr.sel.indexOf(i.id) < 0), wrong = items.filter(i => !i.ok && pr.sel.indexOf(i.id) >= 0);
    if (!missing.length && !wrong.length) {
      pr.passed = true;
      _markDone('g_glyc_secu', pr.tries > 0 ? { retry: true } : null);
      _log('narr', 'Tu es prêt : mains frictionnées, gants, autopiqueur de sécurité et collecteur à portée.');
      return _prepGo(key);
    }
    pr.tries++;
    if (pr.tries >= 2) {
      pr.revealed = true;
      _hint = 'Voici ce qu\'il fallait faire : ' + items.filter(i => i.ok).map(i => i.label).join(' ; ') + '. À éviter : ' + items.filter(i => !i.ok).map(i => i.label).join(' ; ') + '.';
    } else {
      _hint = (wrong.length ? 'À revoir : ' + wrong.map(i => '« ' + i.label + ' » : ' + i.why).join(' ') + ' ' : '') + (missing.length ? 'Il te manque ' + missing.length + ' geste' + (missing.length > 1 ? 's' : '') + ' de sécurité.' : '') + ' Corrige ta sélection puis revalide.';
    }
    _save(); _renderGesture(false);
  }
  function _gMeasure(sec) {              // attente chronométrée (thermomètre, saturomètre, gonflage du brassard)
    const g = _G; g.phase = 'measuring'; g.t0 = Date.now(); g.dur = sec * 1000;
    const iv = setInterval(() => {
      if (_G !== g) { clearInterval(iv); return; }
      const k = Math.min(1, (Date.now() - g.t0) / g.dur);
      const bar = _el('sim-g-bar'); if (bar) bar.style.width = Math.round(k * 100) + '%';
      if (k >= 1) { clearInterval(iv); _gToRead(); }
    }, 100);
    _timers.push(iv);
  }
  function _gToRead() {                  // l'écran affiche la valeur : à l'étudiant de la lire et de la noter
    const c = _cur(); if (!_G) return;
    _G.phase = 'read';
    c.pending[_G.tool] = _G.kind === 'count' ? { n: _G.n } : true;
    _save(); _renderRecueil(); _renderToolbar(); _renderGesture(true); _syncScene();
  }
  // comptage chronométré (pouls, respiration)
  function gStartCount() {
    if (!_G || _G.phase !== 'ready' || _G.kind !== 'count') return;
    const t = _curScn().tools[_G.tool], g = _G;
    g.phase = 'running'; g.n = 0; g.t0 = Date.now();
    _renderGesture();
    const iv = setInterval(() => {
      if (_G !== g) { clearInterval(iv); return; }
      const left = Math.max(0, t.seconds - (Date.now() - g.t0) / 1000);
      const el = _el('sim-g-time'); if (el) el.textContent = Math.ceil(left);
      const bar = _el('sim-g-bar'); if (bar) bar.style.width = Math.round((1 - left / t.seconds) * 100) + '%';
      if (left <= 0) { clearInterval(iv); _gCountDone(); }
    }, 200);
    _timers.push(iv);
  }
  function gTap() {
    if (!_G || _G.phase !== 'running') return;
    _G.n++;
    const el = _el('sim-g-n'); if (el) el.textContent = _G.n;
    const b = _el('sim-g-tap'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
  }
  function _gCountDone() {
    const t = _curScn().tools[_G.tool];
    if (Math.abs(_G.n * t.factor - t.rate) > t.tol) { _G.phase = 'recount'; _renderGesture(); return; }   // comptage trop éloigné : on recommence
    _gToRead();
  }
  function gRecount() { if (!_G) return; _G.phase = 'ready'; _G.n = 0; _renderGesture(); }
  // ── Scope : trois capteurs à poser (thorax, bras, doigt), puis le scope donne FC, SpO₂, PA et FR ──
  function _scopeZone(zone) {
    const c = _cur(), scn = _curScn(), t = scn.tools[_tool]; if (!t) return;
    if (_G && _G.phase !== 'sensors') return;                        // mesure en cours ou lecture
    const sn = t.sensors.find(x => x.zone === zone);
    if (!sn) { c.misplaced++; _hint = t.where; _save(); _renderGesture(); return; }
    if (!_G) { if (c.firstCare === null) c.firstCare = c.actions; _G = { tool: _tool, kind: 'scope', phase: 'sensors', errs: 0, placeErrs: 0, n: 0, placed: {}, sub: null }; }
    if (_G.placed[sn.id]) { _hint = 'Ce capteur est déjà en place : pose les autres.'; _renderGesture(); return; }
    c.actions++; _hint = '';
    if (sn.id === 'bras') { _G.sub = 'cuff'; _save(); _renderGesture(); return; }
    _scopePlace(sn);
  }
  function _scopePlace(sn) {
    const c = _cur(), t = _curScn().tools[_G.tool];
    _G.placed[sn.id] = true; _G.sub = null;
    _log('narr', sn.start); c.last = { text: sn.start, facts: [] };
    if (t.sensors.every(x => _G.placed[x.id])) { _log('narr', t.ready); _G.sub = 'scope'; _gMeasure(t.seconds); }
    _save(); _renderLog(); _renderChambre(); _renderGesture();
  }
  // ── Pose du brassard : l'étudiant règle lui-même la hauteur et le sens du repère « Artery » ──
  // Hauteur : bord inférieur du brassard au-dessus du pli du coude. Sens : la flèche « Artery » doit être face à l'artère brachiale (face interne du bras).
  const CUFF_Y0 = 120, CUFF_S = 5, CUFF_H = 56;          // pli du coude dans le dessin, pixels par cm, hauteur du brassard
  function _cuffState() {
    if (!_G) return null;
    if (!_G.cuff) {
      const cms = [9, 11, 13, -2], angs = [-150, 150, 180, -120, 120, 90, -90];
      _G.cuff = { cm: cms[Math.floor(Math.random() * cms.length)], ang: angs[Math.floor(Math.random() * angs.length)], palp: false, drag: false };
    }
    return _G.cuff;
  }
  function gCuffMove(d) { const k = _cuffState(); if (!k) return; k.cm = Math.max(-4, Math.min(16, Math.round((k.cm + d) * 2) / 2)); _hint = ''; _renderGesture(false); }
  function gCuffRot(d) { const k = _cuffState(); if (!k) return; k.ang = ((k.ang + d + 540) % 360) - 180; _hint = ''; _renderGesture(false); }
  function gCuffPalp() {
    const k = _cuffState(); if (!k || k.palp) return;
    k.palp = true; _log('narr', 'Tu palpes le pli du coude : tu sens le pouls de l\'artère brachiale, sur la face interne du bras (côté du corps).');
    _save(); _renderLog(); _renderGesture(false);
  }
  function cuffDown(ev) {
    const k = _cuffState(); if (!k || !ev || !ev.currentTarget) return;
    const svg = ev.currentTarget; k.drag = true;
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    cuffMove(ev);
  }
  function cuffMove(ev) {
    const k = _cuffState(); if (!k || !k.drag) return;
    const svg = ev.currentTarget, r = svg.getBoundingClientRect(); if (!r.height) return;
    const vy = (ev.clientY - r.top) / r.height * 230, lower = vy + CUFF_H / 2;
    k.cm = Math.max(-4, Math.min(16, Math.round((CUFF_Y0 - lower) / CUFF_S * 2) / 2));
    const g = svg.querySelector('#sim-cuffband'); if (g) g.setAttribute('transform', 'translate(0 ' + (-k.cm * CUFF_S) + ')');
  }
  function cuffUp(ev) { const k = _cuffState(); if (k) { k.drag = false; _renderGesture(false); } }
  function gCuffOk() {
    const c = _cur(); if (!c || !_G) return; const k = _cuffState(); if (!k) return;
    const scope = _G.kind === 'scope';
    if (!scope && _G.phase !== 'place') return;
    if (scope && _G.sub !== 'cuff') return;
    const lowOk = k.cm >= 1.5 && k.cm <= 4, angOk = Math.abs(k.ang) <= 35;
    if (!lowOk || !angOk) {
      _G.placeErrs++;
      const m = [];
      if (k.cm > 4) m.push('Le brassard est trop haut : il se place juste au-dessus du pli du coude.');
      else if (k.cm < 1.5) m.push('Le brassard est trop bas : il gêne le pli du coude et fausse la mesure.');
      if (!angOk) m.push('Le repère « Artery » n\'est pas face à l\'artère : l\'artère brachiale passe sur la face interne du bras. Tourne le brassard.');
      _hint = m.join(' '); _save(); _renderGesture(false); return;
    }
    _hint = ''; _markDone('g_brassard', { retry: _G.placeErrs > 0 });
    if (scope) { const t = _curScn().tools[_G.tool], sn = t.sensors.find(x => x.id === 'bras'); if (sn) _scopePlace(sn); return; }
    _G.phase = 'cuffed'; _save(); _renderGesture();
  }
  function gInflate() {
    if (!_G || _G.phase !== 'cuffed') return;
    _G.sub = 'inflate'; _gMeasure(_curScn().tools[_G.tool].seconds); _renderGesture();
  }
  // ── Mode bloc-notes : l'étudiant relève et écrit lui-même les valeurs, rien n'est pré-rempli ──
  function setNb(on) {
    try { localStorage.setItem(NB_KEY, on ? '1' : '0'); } catch (e) {}
    const el = _el('sim-nb-state'); if (el) el.textContent = on ? 'activé pour la prochaine partie' : 'désactivé';
  }
  function _nbNums(text) { return (String(text || '').match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.'))); }
  function _nbExpect(scn, key, n) {
    const t = scn.tools[key], out = [], add = (label, vals, tol) => out.push({ label, vals, tol: tol || 0 });
    if (t.multi) t.multi.forEach(m => m.type === 'bp' ? add(m.label || 'Pression artérielle', [m.sys, m.dia], m.tol) : add(m.label, [m.value], m.tol));
    else if (t.kind === 'count') add(t.label, [n * t.factor], 0);
    else if (t.input && t.input.type === 'bp') add(t.input.label, [t.input.sys, t.input.dia], t.input.tol);
    else { add(t.input.label, [t.input.value], t.input.tol); if (t.also) add(t.also.input.label, [t.also.input.value], t.also.input.tol); }
    return out;
  }
  function _nbMissing(exp, notes) {          // libellés dont la valeur n'apparaît pas dans le bloc-notes
    const nums = _nbNums(notes);
    return (exp || []).filter(e => !e.vals.every(v => nums.some(x => Math.abs(x - v) <= (e.tol || 0) + 0.001))).map(e => e.label);
  }
  function nbTxt(v) {
    const c = _cur(); if (!c) return;
    const was = !!c.notes.trim();
    c.notes = String(v || '').slice(0, 3000);
    ['sim-nb-main', 'sim-nb-g'].forEach(id => { const el = _el(id); if (el && el.value !== c.notes) el.value = c.notes; });
    _saveSoon();
    if (was !== !!c.notes.trim()) _renderTabs();
  }
  function gNbDone() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || !c.nb || !_G || _G.phase !== 'read') return false;
    const key = _G.tool, n = (c.pending[key] && c.pending[key].n != null) ? c.pending[key].n : _G.n;
    const exp = _nbExpect(scn, key, n), miss = _nbMissing(exp, c.notes);
    if (miss.length && !c.nbWarn[key]) {
      c.nbWarn[key] = true;
      _hint = 'Je ne retrouve pas dans ton bloc-notes : ' + miss.join(', ') + '. Relis l\'écran et écris la valeur avec son unité : tu en auras besoin pour appeler l\'infirmière. Si tu es sûr de toi, appuie de nouveau sur « J\'ai noté ».';
      _save(); _renderGesture(false); return false;
    }
    c.nbExp[key] = exp;
    _record(key);
    return false;
  }
  // saisie de la valeur lue
  function _num(v) { const x = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^\d.\-]/g, '')); return isNaN(x) ? null : x; }
  function gSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const c = _cur(), scn = _curScn(); if (!c || !scn || !_G || _G.phase !== 'read') return false;
    const key = _G.tool, t = scn.tools[key], inp = t.input;
    if (t.multi) {                                                    // scope : SpO₂, FC, PA (2 champs), FR
      let n = 0, blank = false; const wrong = [], val = () => _num((_el('sim-in-' + (++n)) || {}).value);
      _G.vals = []; for (let i = 1; i <= 5; i++) _G.vals.push(((_el('sim-in-' + i) || {}).value) || '');   // on garde ce qui est tapé si l'écran est redessiné
      t.multi.forEach(m => {
        if (m.type === 'bp') { const x = val(), y = val(); if (x === null || y === null) blank = true; else if (!(Math.abs(x - m.sys) <= m.tol && Math.abs(y - m.dia) <= m.tol)) wrong.push(m.label); }
        else { const x = val(); if (x === null) blank = true; else if (Math.abs(x - m.value) > (m.tol || 0)) wrong.push(m.label); }
      });
      if (blank) { _hint = 'Écris toutes les valeurs lues sur l\'écran du scope, en chiffres.'; _save(); _renderGesture(true); return false; }
      if (wrong.length) { c.errors++; _G.errs++; _hint = 'Relis bien l\'écran du scope. À revoir : ' + wrong.join(', ') + '.'; _save(); _renderGesture(true); return false; }
      _record(key); return false;
    }
    const a = _num((_el('sim-in-1') || {}).value), b = _num((_el('sim-in-2') || {}).value);
    let ok = false, msg = '', count = true;
    if (a === null || ((inp.type === 'bp' || t.also) && b === null)) { msg = t.also ? 'Écris les deux valeurs lues sur l\'écran, en chiffres : la saturation et le pouls.' : 'Écris la valeur lue, en chiffres.'; count = false; }
    else if (inp.type === 'bp') ok = Math.abs(a - inp.sys) <= inp.tol && Math.abs(b - inp.dia) <= inp.tol;
    else if (t.kind === 'count') {
      const n = (c.pending[key] && c.pending[key].n != null) ? c.pending[key].n : _G.n;
      ok = a === n * t.factor;
      if (!ok) msg = 'Vérifie ton calcul : ' + n + ' × ' + t.factor + ' = ?';
    } else {
      ok = Math.abs(a - inp.value) <= (inp.tol || 0);
      if (t.also) {
        const okB = Math.abs(b - t.also.input.value) <= (t.also.input.tol || 0);
        if (ok && !okB) msg = 'La saturation est juste. Relis le pouls (PR) affiché sous la saturation.';
        else if (!ok && okB) msg = 'Le pouls est juste. Relis la saturation (SpO₂) affichée en grand.';
        ok = ok && okB;
      }
    }
    if (!ok) {
      if (!msg) msg = 'Relis bien l\'écran : cette valeur n\'est pas celle qui est affichée.';
      if (count) { c.errors++; _G.errs++; }
      _hint = msg; _save(); _renderGesture(true); return false;
    }
    _record(key);
    return false;
  }
  function _record(key) {
    const c = _cur(), scn = _curScn(), t = scn.tools[key];
    delete c.pending[key];
    const list = t.multi ? t.multi : [{ fact: t.fact, noted: t.noted }].concat(t.also ? [{ fact: t.also.fact, noted: t.also.noted }] : []);
    const facts = [], notes = [];
    list.forEach(m => { c.entered[m.fact] = true; _find(m.fact); facts.push(m.fact); notes.push(m.noted); });
    const noted = notes.join(' · ');
    if (t.kind === 'scope') c.mon = { live: true };                 // le scope reste branché sur le patient
    if (c.nb) {
      _log('narr', 'Tu relèves la mesure (' + (t.label || 'instrument') + '). Elle est dans ton bloc-notes si tu l\'as écrite.');
      c.last = { text: '✓ Mesure relevée : vérifie que tu l\'as bien écrite dans ton bloc-notes.', facts };
    } else {
      _log('narr', 'Tu notes dans le recueil : ' + noted + '.');
      c.last = { text: '✓ Noté dans le recueil : ' + noted, facts };
    }
    if (t.waste && !(c.waste && c.waste.done)) {                 // il reste à trier les déchets (OPCT / DASRI / ordinaire)
      _gClear(); _tool = key;
      _startWaste(key);
    } else {
      _gClear(); _tool = null;
      if (_autoZoom) _setZoom('room', false);
    }
    _renderToolbar(); _renderGesture(); _syncScene();
    _afterAction();
  }
  function _startWaste(key) {
    const c = _cur(), scn = _curScn(), t = scn.tools[key];
    if (!c.waste) c.waste = { tries: 0, passed: false, done: false, assign: {}, revealed: false, order: _shuffleIds(t.waste.items.map(i => i.id)) };
    _G = { tool: key, kind: t.kind, phase: 'waste', errs: 0, placeErrs: 0, n: 0 };
  }
  function gWasteSet(id, bin) {
    const c = _cur(); if (!c || !_G || _G.phase !== 'waste' || !c.waste || c.waste.revealed) return;
    c.waste.assign[id] = bin; _hint = ''; _save(); _renderGesture(false);
  }
  function gWasteSubmit() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || !_G || _G.phase !== 'waste') return;
    const key = _G.tool, t = scn.tools[key], w = c.waste, items = t.waste.items;
    const done = () => { _gClear(); _tool = null; if (_autoZoom) _setZoom('room', false); _renderToolbar(); _renderGesture(); _syncScene(); _afterAction(); };
    if (w.revealed) { w.done = true; _save(); return done(); }
    if (items.some(i => !w.assign[i.id])) { _hint = 'Choisis une poubelle pour chaque élément avant de valider.'; _save(); _renderGesture(false); return; }
    const wrong = items.filter(i => w.assign[i.id] !== i.bin);
    if (!wrong.length) {
      w.passed = true; w.done = true;
      _markDone('g_glyc_dechets', w.tries > 0 ? { retry: true } : null);
      _log('narr', 'Tu tries tes déchets : autopiqueur dans l\'OPCT, déchets souillés dans les DASRI, emballage propre dans les ordures ménagères.');
      c.last = { text: '✓ Déchets bien triés : OPCT, DASRI, ordures ménagères.', facts: [] };
      return done();
    }
    w.tries++;
    const nm = id => (t.waste.bins.find(b => b.id === id) || {}).label;
    if (w.tries >= 2) {
      w.revealed = true;
      _hint = 'Voici le bon tri : ' + items.map(i => i.label + ' → ' + nm(i.bin)).join(' ; ') + '.';
    } else {
      _hint = 'À revoir : ' + wrong.map(i => '« ' + i.label + ' » : ' + i.why).join(' ') + ' Corrige puis revalide.';
    }
    _save(); _renderGesture(false);
  }
  function reopen(key) {                 // revenir sur une valeur lue mais pas encore notée
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre' || !c.pending[key]) return;
    const t = scn.tools[key];
    _gClear(); _tool = key;
    _G = { tool: key, kind: t.kind, phase: 'read', errs: 0, placeErrs: 0, n: (c.pending[key] && c.pending[key].n) || 0 };
    if (t.kind === 'scope') _G.placed = { ecg: true, bras: true, doigt: true };
    if (_zoom === 'room') _setZoom('patient', true);
    setTab('chambre');
    _renderToolbar(); _renderGesture(true); _syncScene();
  }
  document.addEventListener('keydown', e => {          // barre d'espace = un battement / une inspiration
    if (e.code === 'Space' && _G && _G.phase === 'running' && !/^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test((e.target || {}).tagName || '')) { e.preventDefault(); gTap(); }
  });

  function useObject(key) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre') return;
    const o = scn.objects[key]; if (!o) return;
    c.actions++;
    c.seenObj[key] = true;
    (o.reveals || []).forEach(_find);
    _log('narr', o.narration);
    c.last = { text: o.narration, facts: o.reveals || [] };
    _afterAction();
  }
  function sha() {
    const c = _cur(), scn = _curScn(); if (!c || !scn) return;
    if (c.stage === 'couloir') {
      _markDone('g_sha_in');
      c.last = { text: scn.narration.shaIn, facts: [] };
      _save(); render();
      return;
    }
    if (c.stage !== 'chambre') return;
    let txt;
    if (c.actions === 0) {                       // avant tout contact
      if (c.done.g_sha_in) txt = scn.narration.shaAlready;
      else { _markDone('g_sha_in'); txt = scn.narration.shaIn; }
    } else {                                     // après le contact
      _markDone('g_sha_out');
      txt = scn.narration.shaOut;
    }
    _log('narr', txt);
    c.last = { text: txt, facts: [] };
    _afterAction();
  }
  function knock() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'couloir') return;
    _markDone('g_frapper');
    c.last = { text: scn.narration.knock, facts: [] };
    _save(); render();
  }
  function readDossier() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'couloir') return;
    c.dossierOpen = !c.dossierOpen;
    if (c.dossierOpen) {
      Object.keys(scn.facts).filter(k => scn.facts[k].kind === 'dossier').forEach(_find);
      _markDone('g_dossier');
    }
    _save(); render();
  }
  function enter() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'couloir') return;
    c.stage = 'chambre'; c.tab = 'dialogue'; c.last = null;
    _gReset();
    _log('narr', scn.narration.enter);
    _save(); render();
  }

  // ── Fin de partie et bilan ────────────────────────────────────
  function askFinish() { _confirmFinish = true; _renderChambre(); }
  function cancelFinish() { _confirmFinish = false; _renderChambre(); }
  // ══════════════════════════════════════════════════════════════
  //  Fin du scénario : décision → appel (SAED) → prescription → transmissions → bilan
  //  La correction est faite HORS LIGNE, par mots-clés : elle repère la présence d'éléments attendus.
  //  Elle ne comprend pas le sens d'une phrase (une IA facultative peut donner un avis plus fin).
  // ══════════════════════════════════════════════════════════════
  const LEVELS = [
    { n: 1, name: 'Découverte', xp: 0 }, { n: 2, name: 'Observation', xp: 100 }, { n: 3, name: 'Rigueur', xp: 250 },
    { n: 4, name: 'Initiative', xp: 450 }, { n: 5, name: 'Fiabilité', xp: 700 }, { n: 6, name: 'Autonomie', xp: 1000 }
  ];
  function _levelOf(xp) {
    let L = LEVELS[0];
    LEVELS.forEach(l => { if (xp >= l.xp) L = l; });
    const next = LEVELS[L.n] || null;
    return { L, next, pct: next ? Math.max(0, Math.min(100, Math.round(100 * (xp - L.xp) / (next.xp - L.xp)))) : 100 };
  }
  const BADGES = [
    { id: 'premier_pas', ico: '🌱', name: 'Premier pas', desc: 'Terminer une partie complète.', test: () => true },
    { id: 'oeil', ico: '👁️', name: 'Œil de lynx', desc: 'Trouver toutes les informations clés du recueil.', test: R => R.recueil.found === R.recueil.total },
    { id: 'mains', ico: '🧴', name: 'Mains propres', desc: 'Te frictionner les mains avant ET après le contact.', test: (R, c) => !!(c.done.g_sha_in && c.done.g_sha_out) },
    { id: 'mesures', ico: '🎯', name: 'Mesures justes', desc: 'Noter toutes les mesures sans aucune erreur de saisie.', test: (R, c, scn) => (c.errors || 0) === 0 && Object.keys(c.entered).length >= scn.toolOrder.length },
    { id: 'alerte', ico: '🚨', name: 'Bon réflexe', desc: "Juger qu'il faut alerter l'infirmière maintenant, sans geste dangereux.", test: R => (R.niveau.good || R.niveau.id === 'maintenant') && !R.unsafe.length },
    { id: 'securite', ico: '🛡️', name: "Sécurité d'abord", desc: "Choisir au moins 5 des bons gestes d'attente, sans geste dangereux.", test: R => R.actions.good >= 5 && !R.unsafe.length },
    { id: 'secu', ico: '🩺', name: 'Gestes sûrs', desc: "Alerter l'infirmière et installer le résident correctement pendant le recueil, sans geste dangereux.", test: R => !!R.soins && !!R.soins.alert && R.soins.alert.v !== 'avoid' && !!R.soins.pos && R.soins.pos.v === 'good' && !R.unsafe.length },
    { id: 'saed', ico: '📞', name: 'Message clair', desc: "Obtenir au moins 12/15 à l'appel SAED.", test: R => R.appel.pts >= 12 },
    { id: 'discordance', ico: '🔎', name: 'Discordance repérée', desc: "Repérer une information qui ne colle pas avec le dossier (allergie, chute non signalée, repas non pris…) et la transmettre à l'infirmière.", test: R => !!R.allergySaid },
    { id: 'transmetteur', ico: '📝', name: 'Transmetteur', desc: 'Obtenir au moins 12/15 à la transmission écrite.', test: R => R.trans.pts >= 12 },
    { id: 'ecg', ico: '🫀', name: 'ECG réussi', desc: "Réaliser l'ECG de la prescription avec au moins 70/100.", test: R => !!R.ecg && R.ecg.score >= 70 },
    { id: 'gazo', ico: '🩸', name: 'Gaz du sang lu', desc: "Lire le gaz du sang d'un scénario avec au plus une erreur (sans poser de diagnostic).", test: R => !!R.gazo && R.gazo.score >= 80 },
    { id: 'excellence', ico: '⭐', name: 'Excellence', desc: 'Atteindre 90/100 ou plus, sans geste dangereux.', test: R => R.total >= 90 && !R.unsafe.length },
    { id: 'progres', ico: '📈', name: 'Progression', desc: 'Rejouer et gagner au moins 10 points par rapport à ton meilleur score.', test: R => R.prevBest != null && R.total >= R.prevBest + 10 }
  ];
  const fmt = x => String(Math.round(x * 10) / 10).replace('.', ',');
  const _ai = () => !!(window.App.AI && window.App.AI.isConfigured && window.App.AI.isConfigured());

  // ── Correction hors ligne par éléments attendus ──
  function _words(t) { const n = _norm(t); return n ? n.split(' ').length : 0; }
  function _gradeEl(el, n, w) {
    if (w < 2) return false;
    if (el.test) { try { return !!el.test(n, w); } catch (e) { return false; } }
    if (el.all) return el.all.every(re => re.test(n));
    if (el.need) return el.need.re.filter(re => re.test(n)).length >= el.need.min;
    return (el.re || []).some(re => re.test(n));
  }
  // parts : [{ id, label, elements:[{id,w,label,re|need|all|test}], warn? }] ; texts : { id: texte }
  function _grade(parts, texts) {
    let pts = 0, max = 0;
    const secs = parts.map(p => {
      const raw = (texts && texts[p.id]) || '', n = _norm(raw), w = _words(raw);
      const items = p.elements.map(el => ({ el, ok: _gradeEl(el, n, w) }));
      let got = items.reduce((a, x) => a + (x.ok ? x.el.w : 0), 0);
      const mx = p.elements.reduce((a, el) => a + el.w, 0);
      const warned = !!(p.warn && w >= 2 && p.warn.re.some(re => re.test(n)));
      if (warned) got = Math.max(0, got - p.warn.pen);
      pts += got; max += mx;
      return { id: p.id, label: p.label, items, got, max: mx, warned, warn: warned ? p.warn.text : '', words: w };
    });
    return { secs, pts, max, ratio: max ? pts / max : 0 };
  }
  function _corrHtml(g) {
    return g.secs.map(s => `<div class="sim-corr"><div class="sim-corr-h"><b>${_esc(s.label)}</b><span>${fmt(s.got)}/${s.max}</span></div>` +
      s.items.map(x => `<div class="sim-corr-row ${x.ok ? 'ok' : 'miss'}"><span class="sim-mark">${x.ok ? '✓' : '✗'}</span><span>${_esc(x.el.label)}</span></div>`).join('') +
      (s.warned ? `<div class="sim-corr-warn">⚠ ${_esc(s.warn)}</div>` : '') + '</div>').join('') +
      '<p class="sim-muted sim-small">Correction automatique par mots-clés : elle repère si l\'élément est présent, pas si ta phrase est bien tournée. Un ✗ peut venir d\'une formulation différente de celles prévues.</p>';
  }
  function _callPts(S) {
    if (!S || S.p1 == null) return 0;
    if (S.tries >= 2 && S.p2 != null) return Math.max(S.p1, Math.round(S.p2 * 0.85 * 10) / 10);
    return S.p1;
  }
  function _shuffle(ids, seed) {
    const a = ids.slice(); let s = (seed >>> 0) || 1;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  let _saveT = null;
  function _saveSoon() { clearTimeout(_saveT); _saveT = setTimeout(_save, 400); }
  function _top() { try { window.scrollTo({ top: 0 }); const m = document.querySelector('.main'); if (m && m.scrollTo) m.scrollTo({ top: 0 }); } catch (e) {} }
  function _into(id) { setTimeout(() => { const e = _el(id); if (e && e.scrollIntoView) { try { e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) { e.scrollIntoView(); } } }, 30); }
  function _stage(...ok) { const c = _cur(); return !!c && ok.indexOf(c.stage) >= 0; }

  // ── Transition recueil → décision ──
  function finish() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre') return;
    _confirmFinish = false;
    _gReset();
    c.stage = 'decision'; c.last = null;
    _save(); render(); _top();
  }

  // ── Étape Décision : niveau d'alerte → gestes en attendant → appel de l'infirmière → prescription ──
  const DEC_STEPS = [['level', 'Analyse'], ['actions', 'En attendant'], ['call', 'Appel'], ['rx', 'Prescription']];
  function _decOrder(c, scn) {
    if (!c.dec.order) c.dec.order = { lv: _shuffle(scn.decision.levels.map(l => l.id), c.startedAt), ac: _shuffle(scn.decision.actions.map(a => a.id), c.startedAt + 7) };
    return c.dec.order;
  }
  function _rxName(scn) { return (scn && scn.rx && scn.rx.stepName) || 'Prescription'; }
  function _sub(c) {
    const idx = DEC_STEPS.findIndex(s => s[0] === c.dec.step), scn = _curScn();
    return '<ol class="sim-substeps" aria-label="Sous-étapes de la décision">' + DEC_STEPS.map((s, i) =>
      `<li class="${i < idx ? 'done' : (i === idx ? 'now' : '')}"><b>${i < idx ? '✓' : i + 1}</b> ${_esc(s[0] === 'rx' ? _rxName(scn) : s[1])}</li>`).join('') + '</ol>';
  }
  function _bar(scn, c, title) {
    return `<div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Sim.toList()">← Menu</button>
      <div class="sim-bar-title">${_esc(title || scn.title)}</div><div class="sim-bar-time" id="sim-clock" title="Temps actif">${_hms(c.secs)}</div></div>${_stepper()}`;
  }
  function _foundAlerts(c, scn) {
    return Object.keys(scn.facts).filter(k => scn.facts[k].alert && c.found[k]);
  }

  function _renderDecision(root) {
    const c = _cur(), scn = _curScn(), D = c.dec;
    _decOrder(c, scn);
    let body = '';
    if (D.step === 'level') body = _decLevel(c, scn);
    else if (D.step === 'actions') body = _decActions(c, scn);
    else if (D.step === 'call') body = _decCall(c, scn);
    else body = _decRx(c, scn);
    root.innerHTML = `<div class="sim-wrap">${_bar(scn, c)}${_sub(c)}${body}</div>`;
  }

  function _decLevel(c, scn) {
    const dec = scn.decision, D = c.dec, ord = _decOrder(c, scn).lv;
    const al = _foundAlerts(c, scn);
    const recap = al.length
      ? al.map(k => `<div class="sim-fact"><span class="sim-fact-k">${_esc(scn.facts[k].label)}</span><span class="sim-fact-v">${_esc(scn.facts[k].text)}</span></div>`).join('')
      : '<div class="sim-fact-none">Tu n\'as relevé aucun signe d\'alerte pendant le recueil.</div>';
    const opts = ord.map(id => {
      const l = dec.levels.find(x => x.id === id), on = D.level === id;
      const cls = 'sim-opt' + (on ? ' on' : '') + (D.levelDone ? ' locked' : '') + (D.levelDone && on ? ' ' + l.verdict : '');
      return `<button type="button" class="${cls}" data-id="${_esc(id)}" ${D.levelDone ? 'disabled' : ''} aria-pressed="${on}" onclick="App.Sim.decLevel('${_esc(id)}')"><span class="sim-opt-m">${on ? '●' : '○'}</span><span>${_esc(l.label)}</span></button>`;
    }).join('');
    let foot;
    if (!D.levelDone) foot = `<div class="sim-row sim-enter"><button class="btn btn-primary" ${D.level ? '' : 'disabled'} onclick="App.Sim.decLevelOk()">Valider mon choix</button>${D.level ? '' : '<span class="sim-muted sim-small">Choisis une réponse.</span>'}</div>`;
    else {
      const l = dec.levels.find(x => x.id === D.level);
      const tag = { good: '✓ Bonne analyse', avoid: '◐ À nuancer', danger: _gen('⚠ Risque pour la résidente', scn) }[l.verdict];
      foot = `<div class="sim-fb ${l.verdict}" id="sim-fb"><b>${tag}</b><p>${_esc(l.feedback)}</p></div>
        <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.decNext()">Continuer : que fais-tu en attendant ? →</button></div>`;
    }
    return `<div class="sim-card"><h2 class="sim-title">Décision</h2><p class="sim-lead">${_esc(dec.intro)}</p>
      <details class="sim-recap" ${al.length <= 8 ? 'open' : ''}><summary>📋 Ce que tu as relevé d'inhabituel (${al.length})</summary>${recap}</details></div>
      <div class="sim-card"><h3 class="sim-h" style="margin-top:0">${_esc(dec.levelQ)}</h3><div class="sim-opts">${opts}</div>${foot}</div>`;
  }

  function _actionsReview(c, scn) {
    const dec = scn.decision, picks = c.dec.picks;
    const rows = dec.actions.map(a => {
      const p = !!picks[a.id];
      let st, mark, tag;
      if (a.v === 'good') { st = p ? 'ok' : 'missed'; mark = p ? '✓' : '○'; tag = p ? 'Bien' : 'À ne pas oublier'; }
      else if (a.v === 'danger') { st = p ? 'danger' : 'ok'; mark = p ? '⛔' : '✓'; tag = p ? 'Geste dangereux' : 'Tu as évité ce geste dangereux'; }
      else { st = p ? 'avoid' : 'ok'; mark = p ? '✗' : '✓'; tag = p ? 'À éviter' : 'Bien vu de ne pas le faire'; }
      return `<div class="sim-rev ${st}"><span class="sim-mark">${mark}</span><div><b>${_esc(a.label)}</b><div class="sim-small sim-tag">${_esc(tag)}</div><div class="sim-muted sim-small">${_esc(a.why)}</div></div></div>`;
    }).join('');
    return rows;
  }
  function _decActions(c, scn) {
    const dec = scn.decision, D = c.dec, ord = _decOrder(c, scn).ac;
    const n = Object.keys(D.picks).filter(k => D.picks[k]).length;
    if (!D.actionsDone) {
      const items = ord.map(id => {
        const a = dec.actions.find(x => x.id === id), on = !!D.picks[id];
        return `<button type="button" class="sim-opt chk${on ? ' on' : ''}" data-id="${_esc(id)}" aria-pressed="${on}" onclick="App.Sim.decPick('${_esc(id)}')"><span class="sim-opt-m">${on ? '☑' : '☐'}</span><span>${_esc(a.label)}</span></button>`;
      }).join('');
      return `<div class="sim-card"><h2 class="sim-title">En attendant ${_esc(scn.call.who)}</h2><p class="sim-lead">${_esc(dec.actionsQ)}</p>
        <div class="sim-opts">${items}</div>
        <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.decActionsOk()">Valider mes choix (${n})</button><span class="sim-muted sim-small">Aucune limite : coche ce que tu ferais vraiment.</span></div></div>`;
    }
    const R = _results(true);
    return `<div class="sim-card"><h2 class="sim-title">En attendant ${_esc(scn.call.who)}</h2>
      <div class="sim-fb ${R.actions.danger ? 'danger' : (R.actions.good >= 5 && !R.actions.avoid ? 'good' : 'avoid')}" id="sim-fb"><b>${R.actions.danger ? '⚠ Au moins un geste dangereux' : 'Bilan de tes choix'}</b>
        <p>${R.actions.good}/${R.actions.goodTotal} bons gestes · ${R.actions.avoid} geste${R.actions.avoid > 1 ? 's' : ''} à éviter · ${R.actions.danger} geste${R.actions.danger > 1 ? 's' : ''} dangereux. <b>${fmt(R.actions.pts)}/${R.actions.max} points.</b>${R.actions.danger ? ' Un geste dangereux plafonne le score final de la partie à 50/100.' : ''}</p></div>
      <div class="sim-revs">${_actionsReview(c, scn)}</div>
      <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.decNext()">Continuer : appeler ${_esc(scn.call.who)} →</button></div></div>`;
  }

  // Appel à l'infirmière référente (SAED)
  function _recueilRecap(c, scn) {
    return `<details class="sim-recap"><summary>${c.nb ? '📝 Mon bloc-notes' : '📋 Mon recueil de données'} (à relire avant d'appeler)</summary><div class="sim-recap-body">${_recueilHtml(true)}</div></details>`;
  }
  function _aiBlock(kind, c) {
    const out = c.ai && c.ai[kind];
    let html;
    if (out && out.state === 'ok') {
      const li = t => t ? '<ul class="sim-ul">' + String(t).split(';').map(x => x.trim()).filter(Boolean).map(x => `<li>${_esc(x)}</li>`).join('') + '</ul>' : '';
      html = out.libre ? `<p class="sim-ai-t">${_esc(out.libre)}</p>` :
        `${out.forts ? '<b>Points forts</b>' + li(out.forts) : ''}${out.ameliorer ? '<b>À améliorer</b>' + li(out.ameliorer) : ''}${out.reformulation ? '<b>Exemple de reformulation</b><p class="sim-ai-t">' + _esc(out.reformulation) + '</p>' : ''}`;
      html = `<div class="sim-ai-out"><div class="sim-ai-h">🤖 Avis de l'IA (indicatif · ne change pas ton score)</div>${html}</div>`;
    } else if (out && out.state === 'loading') html = '<div class="sim-ai-out"><div class="sim-ai-h">🤖 L\'IA relit ton texte…</div></div>';
    else if (out && out.state === 'err') html = `<div class="sim-ai-out err" role="alert">${_esc(out.msg)}</div>`;
    else html = '';
    let btn;
    if (!_ai()) btn = '<span class="sim-muted sim-small">Facultatif : une IA peut relire ton texte plus finement. Ajoute ta clé Gemini dans Réglages → Intelligence artificielle (internet nécessaire).</span>';
    else if (navigator.onLine === false) btn = '<span class="sim-muted sim-small">🔌 Hors ligne : l\'avis de l\'IA a besoin d\'internet. La correction ci-dessus fonctionne sans.</span>';
    else btn = `<button class="btn btn-ghost btn-sm" ${out && out.state === 'loading' ? 'disabled' : ''} onclick="App.Sim.aiReview('${kind}')">🤖 Demander l'avis de l'IA</button><span class="sim-muted sim-small">Facultatif · internet · ton texte est envoyé à Google (Gemini) avec ta clé. La patiente est fictive : n'écris jamais de vraies données de patients.</span>`;
    return `<div class="sim-ai" id="sim-ai-${kind}"><div class="sim-row">${btn}</div>${html}</div>`;
  }
  function _decCall(c, scn) {
    const call = scn.call, S = c.saed;
    const logHtml = S.log.length ? `<div class="sim-chat">${S.log.map(m => `<div class="sim-msg sim-${m.who === 'me' ? 'me' : 'pat'}" style="white-space:pre-wrap">${m.who === 'me' ? '' : '<b>' + _esc(call.who) + ' · </b>'}${_esc(m.text)}</div>`).join('')}</div>` : '';
    const g = S.tries ? _grade(call.sections, S.txt) : null;
    let form = '';
    if (!S.sent) {
      const miss = (S.tries && S.t1) ? _grade(call.sections, S.t1).secs.reduce((a, s) => a.concat(s.items.filter(x => !x.ok).map(x => x.el.label)), []) : [];
      form = `${S.warn ? `<div class="sim-g-warn" role="alert">${_esc(S.warn)}</div>` : ''}
        ${S.tries ? `<div class="sim-note">↺ <b>Rappelle ${_esc(call.who)}</b> en complétant ton message. Il te manquait :<ul class="sim-ul">${miss.map(m => `<li>${_esc(m)}</li>`).join('')}</ul>Seul le meilleur des deux essais comptera (le 2e à 85 %).</div>` : ''}
        ${call.sections.map(s => `<div class="sim-saed"><label for="saed-${s.id}"><b>${_esc(s.label)}</b> <span class="sim-muted sim-small">${_esc(s.hint)}</span></label>
          <textarea id="saed-${s.id}" rows="${s.id === 'E' ? 4 : 2}" maxlength="900" placeholder="${_esc(s.placeholder)}" oninput="App.Sim.txt('saed','${s.id}',this.value)">${_esc(S.txt[s.id])}</textarea></div>`).join('')}
        <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.sendSaed()">📞 ${S.tries ? 'Rappeler' : 'Appeler'} ${_esc(call.who)}</button></div>`;
    }
    let after = '';
    if (S.sent) {
      const pts = _callPts(S);
      after = `<h3 class="sim-h">Correction de ton appel · <span class="sim-pts">${fmt(pts)}/15</span></h3>
        ${S.tries >= 2 ? `<p class="sim-muted sim-small">1er essai : ${fmt(S.p1)}/15 · 2e essai : ${fmt(S.p2)}/15 × 0,85 = ${fmt(Math.round(S.p2 * 0.85 * 10) / 10)}. Le meilleur est retenu.</p>` : ''}
        <div class="sim-card">${_corrHtml(g)}</div>
        <details class="sim-why"><summary>Voir un exemple de message SAED complet</summary><div class="sim-model">${['S', 'A', 'E', 'D'].map(k => `<p><b>${k}</b> · ${_esc(call.model[k])}</p>`).join('')}</div></details>
        ${_aiBlock('saed', c)}
        <div class="sim-row sim-enter">${S.canRetry ? `<button class="btn btn-primary" onclick="App.Sim.saedRetry()">↺ Rappeler ${_esc(call.who)} avec ces précisions</button><button class="btn btn-ghost" onclick="App.Sim.saedDone()">Continuer sans rappeler</button>` : `<button class="btn btn-primary" onclick="App.Sim.saedDone()">Continuer : ${_esc((scn.rx && scn.rx.nextLabel) || 'la prescription')} →</button>`}</div>`;
    }
    return `<div class="sim-card"><h2 class="sim-title">📞 Appeler ${_esc(call.who)}</h2><p class="sim-lead">${_esc(call.intro)}</p>
      <div class="sim-note"><b>Méthode.</b> ${_esc(call.method)}</div>${c.care && c.care.alert ? `<div class="sim-note">👩‍⚕️ <b>${_esc(call.who)} est déjà venue</b> pendant le recueil, quand tu l'as alertée. Tu lui fais maintenant ton point complet, avec toutes les mesures : situation, antécédents, évaluation, demande.</div>` : ''}${_recueilRecap(c, scn)}${logHtml}${form}${after}</div>`;
  }

  // Prescription du médecin
  function _decRx(c, scn) {
    const rx = scn.rx, R = c.rx, pt = scn.patient, who = scn.call.who;
    const al = c.saed && c.saed.sent ? _callAllergy(c, scn) : false;
    const ecgCtx = rx.ecgCtx || {};
    const ecgWho = ecgCtx.patient ? (pt.civ + ' ' + pt.nom) : '';
    const lines = rx.lines.map(l => {
      let extra = '';
      if (l.ecg) {
        if (R.ecg) extra = `<div class="sim-rx-ecg ok">✓ ECG réalisé · ${R.ecg.score}/100 · mode ${R.ecg.mode === 'auto' ? 'autonome' : 'guidé'} <button class="btn btn-ghost btn-sm" onclick="App.Sim.rxEcg()">Refaire</button></div>`;
        else if (R.skipped) extra = `<div class="sim-rx-ecg">${_esc(who)} réalise l'ECG à ta place. <button class="btn btn-ghost btn-sm" onclick="App.Sim.rxEcg()">Finalement, je le fais</button></div>`;
        else extra = `<div class="sim-rx-ecg"><button class="btn btn-primary btn-sm" onclick="App.Sim.rxEcg()">🫀 Réaliser l'ECG (atelier)</button><button class="btn btn-ghost btn-sm" onclick="App.Sim.rxSkip()">Laisser ${_esc(who)} le faire</button><div class="sim-muted sim-small">Facultatif. ${_esc(who)} reste à côté de toi : en 1re année, un geste technique se fait sous la supervision d'un soignant. L'ECG simulé est celui de ${_esc(ecgWho)} (pouls à ${_esc(ecgCtx.rate)}/min).</div></div>`;
      }
      if (l.gazo && rx.gazo) {
        if (R.gazo) extra = `<div class="sim-rx-ecg ok">✓ Gaz du sang lu · ${R.gazo.score}/100 <button class="btn btn-ghost btn-sm" onclick="App.Sim.rxGazo()">Refaire</button></div>`;
        else if (R.gazoSkipped) extra = `<div class="sim-rx-ecg">${_esc(who)} lit le résultat à ta place. <button class="btn btn-ghost btn-sm" onclick="App.Sim.rxGazo()">Finalement, je le lis</button></div>`;
        else extra = `<div class="sim-rx-ecg"><button class="btn btn-primary btn-sm" onclick="App.Sim.rxGazo()">🩸 Lire le gaz du sang (atelier)</button><button class="btn btn-ghost btn-sm" onclick="App.Sim.rxGazoSkip()">Laisser ${_esc(who)} le lire</button><div class="sim-muted sim-small">Facultatif et hors score (bonus d'XP). C'est un exercice de raisonnement : tu fais une lecture sommaire, c'est le médecin qui interprète et décide. Les valeurs sont fictives.</div></div>`;
      }
      return `<li><span class="sim-rx-i">${l.icon}</span><div>${_esc(l.t)}${extra}</div></li>`;
    }).join('');
    const ident = rx.patientLine || (pt.civ + ' ' + (pt.prenom ? pt.prenom + ' ' : '') + String(pt.nom).toUpperCase() + ' · ' + pt.age + ' ans · chambre ' + pt.chambre);
    const known = rx.discKnown || rx.allergyKnown, unknown = rx.discUnknown || rx.allergyUnknown;
    const foot = (al ? known : unknown);
    return `<div class="sim-card"><h2 class="sim-title">${_esc(rx.title || 'Prescription du médecin')}</h2><p class="sim-lead">${_esc(rx.intro)}</p>
      <div class="sim-rx"><div class="sim-rx-h">📄 ${_esc(rx.from)}</div><div class="sim-rx-p">${_esc(ident)}</div>
        <ul class="sim-rx-l">${lines}</ul>
        ${foot ? `<div class="sim-rx-a">${_esc(foot)}</div>` : ''}</div>
      <p class="sim-muted sim-small">${_esc(rx.note)}</p>
      <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.rxNext()">Continuer : écrire mes transmissions →</button></div></div>`;
  }
  // « Discordance » : une information qui ne colle pas avec le dossier (ex. allergie, chute non signalée).
  // scn.discordance = { fact, el, said, heard, missed, badge? } ; el = élément de l'appel SAED qui la transmet.
  function _callAllergy(c, scn) {
    const S = c.saed, d = scn && scn.discordance;
    if (!S || !S.sent || !d) return false;
    const g = _grade(scn.call.sections, S.txt);
    return g.secs.some(sec => sec.items.some(x => x.el.id === d.el && x.ok));
  }

  // ── Handlers de la décision ──
  function decLevel(id) {
    const c = _cur(), scn = _curScn(); if (!_stage('decision') || c.dec.step !== 'level' || c.dec.levelDone) return;
    if (!scn.decision.levels.some(l => l.id === id)) return;
    c.dec.level = id; _save(); render();
  }
  function decLevelOk() {
    const c = _cur(); if (!_stage('decision') || c.dec.step !== 'level' || !c.dec.level || c.dec.levelDone) return;
    c.dec.levelDone = true; _save(); render(); _into('sim-fb');
  }
  function decPick(id) {
    const c = _cur(), scn = _curScn(); if (!_stage('decision') || c.dec.step !== 'actions' || c.dec.actionsDone) return;
    if (!scn.decision.actions.some(a => a.id === id)) return;
    if (c.dec.picks[id]) delete c.dec.picks[id]; else c.dec.picks[id] = true;
    _save(); render();
  }
  function decActionsOk() {
    const c = _cur(); if (!_stage('decision') || c.dec.step !== 'actions' || c.dec.actionsDone) return;
    c.dec.actionsDone = true; _save(); render(); _into('sim-fb');
  }
  function decNext() {
    const c = _cur(); if (!_stage('decision')) return;
    if (c.dec.step === 'level' && c.dec.levelDone) c.dec.step = 'actions';
    else if (c.dec.step === 'actions' && c.dec.actionsDone) c.dec.step = 'call';
    else return;
    _save(); render(); _top();
  }
  function txt(kind, id, val) {
    const c = _cur(); if (!c) return;
    const t = kind === 'saed' ? (c.saed && c.saed.txt) : (c.wr && c.wr.txt);
    if (!t || !(id in t)) return;
    t[id] = String(val || '').slice(0, 900); _saveSoon();
  }
  function sendSaed() {
    const c = _cur(), scn = _curScn(); if (!_stage('decision') || c.dec.step !== 'call') return;
    const S = c.saed, call = scn.call; if (S.sent) return;
    if (['S', 'A', 'E', 'D'].reduce((a, k) => a + _words(S.txt[k]), 0) < 8) {
      S.warn = 'Écris ton message pour ' + call.who + ' (quelques phrases) avant d\'appeler.'; _save(); render(); return;
    }
    S.warn = '';
    const g = _grade(call.sections, S.txt);
    S.tries++;
    if (S.tries === 1) { S.p1 = g.pts; S.t1 = Object.assign({}, S.txt); } else S.p2 = g.pts;
    S.sent = true;
    const demandOk = g.secs.some(s => s.id === 'D' && s.items.some(x => x.el.id === 'd_venir' && x.ok));
    const missing = [];
    g.secs.forEach(s => s.items.forEach(x => { if (!x.ok) missing.push(x.el); }));
    missing.sort((a, b) => b.w - a.w);
    const Rp = call.reply;
    let reply;
    if (g.ratio >= 0.75 && demandOk) reply = Rp.good;
    else if (S.tries >= 2) reply = Rp.final;
    else if (g.ratio >= 0.75) reply = Rp.noDemand + ' ' + Rp.retry;
    else reply = (g.ratio >= 0.45 ? Rp.mid : Rp.low) + ' ' + missing.slice(0, 2).map(m => m.ask).join(' ') + ' ' + Rp.retry;
    S.canRetry = S.tries === 1 && !(g.ratio >= 0.75 && demandOk);
    S.done = !S.canRetry;
    S.log.push({ who: 'me', text: ['S', 'A', 'E', 'D'].map(k => k + ' : ' + S.txt[k].trim()).join('\n') });
    S.log.push({ who: 'sophie', text: reply });
    if (S.log.length > 12) S.log.splice(0, S.log.length - 12);
    _save(); render(); _into('sim-ai-saed');
  }
  function saedRetry() {
    const c = _cur(); if (!_stage('decision') || c.dec.step !== 'call' || !c.saed.canRetry) return;
    c.saed.sent = false; c.saed.canRetry = false; _save(); render(); _top();
  }
  function saedDone() {
    const c = _cur(); if (!_stage('decision') || c.dec.step !== 'call' || !c.saed.sent) return;
    c.dec.step = 'rx'; _save(); render(); _top();
  }
  function rxEcg() {
    const c = _cur(), scn = _curScn(); if (!_stage('decision') || c.dec.step !== 'rx' || !window.App.SimECG) return;
    _save();
    const ctx = Object.assign({}, scn.rx.ecgCtx, {
      onDone: r => { c.rx.ecg = { score: r.score, secs: r.secs, mode: r.mode }; c.rx.skipped = false; _save(); screen = 'jeu'; render(); _top(); },
      onBack: () => { screen = 'jeu'; render(); _top(); }
    });
    window.App.SimECG.open(ctx);
  }
  function rxSkip() { const c = _cur(); if (!_stage('decision') || c.dec.step !== 'rx') return; c.rx.skipped = true; _save(); render(); }
  // Atelier facultatif « lire le gaz du sang » (scénarios dont la consigne comporte rx.gazo) : bonus d'XP, hors score
  function rxGazo() {
    const c = _cur(), scn = _curScn();
    if (!_stage('decision') || c.dec.step !== 'rx' || !window.App.Gazo || !scn.rx || !scn.rx.gazo) return;
    _save();
    const g = scn.rx.gazo;
    window.App.Gazo.workshop({
      q: g.q, title: g.title, intro: g.intro, backLabel: g.backLabel, doneLabel: g.doneLabel,
      onDone: r => {
        const steps = Math.max(1, r.steps || 1);
        c.rx.gazo = { score: Math.max(0, Math.round(100 * (steps - (r.errs || 0)) / steps)), errs: r.errs || 0 };
        c.rx.gazoSkipped = false; _save(); screen = 'jeu'; render(); _top();
      },
      onBack: () => { screen = 'jeu'; render(); _top(); }
    });
  }
  function rxGazoSkip() { const c = _cur(); if (!_stage('decision') || c.dec.step !== 'rx') return; c.rx.gazoSkipped = true; _save(); render(); }
  function rxNext() {
    const c = _cur(); if (!_stage('decision') || c.dec.step !== 'rx') return;
    c.stage = 'transmissions'; _save(); render(); _top();
  }

  // ── Étape Transmissions écrites (ciblées) ──
  function _renderTrans(root) {
    const c = _cur(), scn = _curScn(), W = c.wr, wr = scn.written;
    let body;
    const fields = wr.fields.map(f => `<div class="sim-saed"><label for="wr-${f.id}"><b>${_esc(f.label)}</b> <span class="sim-muted sim-small">${_esc(f.hint)}</span></label>
      <textarea id="wr-${f.id}" rows="${f.rows || 3}" maxlength="900" placeholder="${_esc(f.placeholder)}" ${W.graded ? 'readonly' : ''} oninput="App.Sim.txt('wr','${f.id}',this.value)">${_esc(W.txt[f.id])}</textarea></div>`).join('');
    if (!W.graded) {
      body = `<div class="sim-card"><h2 class="sim-title">📝 Transmissions écrites</h2><p class="sim-lead">${_esc(wr.intro)}</p>
        <div class="sim-note">${_esc(wr.rules)}</div>
        <details class="sim-recap"><summary>${c.nb ? '📝 Mon bloc-notes' : '📋 Mon recueil de données'} (à relire)</summary><div class="sim-recap-body">${_recueilHtml(true)}</div></details>
        ${W.warn ? `<div class="sim-g-warn" role="alert">${_esc(W.warn)}</div>` : ''}${fields}
        <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.wrSubmit()">Valider ma transmission</button></div></div>`;
    } else {
      const g = _grade(wr.fields, W.txt);
      body = `<div class="sim-card"><h2 class="sim-title">📝 Transmissions écrites</h2>${fields}
        <h3 class="sim-h">Correction · <span class="sim-pts">${fmt(g.pts)}/15</span></h3>${_corrHtml(g)}
        <details class="sim-why"><summary>Voir un exemple de transmission ciblée</summary><div class="sim-model">${wr.fields.map(f => `<p><b>${_esc(f.label)}</b> · ${_esc(wr.model[f.id])}</p>`).join('')}<p class="sim-muted sim-small">[heure] : à remplacer par l'heure réelle. Chaque service a son logiciel et ses habitudes de rédaction.</p></div></details>
        ${_aiBlock('transmission', c)}
        <div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.wrDone()">Voir mon bilan →</button></div></div>`;
    }
    root.innerHTML = `<div class="sim-wrap">${_bar(scn, c)}${body}</div>`;
  }
  function wrSubmit() {
    const c = _cur(), scn = _curScn(); if (!_stage('transmissions') || c.wr.graded) return;
    const W = c.wr;
    if (Object.keys(W.txt).reduce((a, k) => a + _words(W.txt[k]), 0) < 10) { W.warn = 'Écris ta transmission (cible, données, actions, résultats) avant de la valider.'; _save(); render(); return; }
    W.warn = '';
    W.pts = _grade(scn.written.fields, W.txt).pts; W.graded = true;
    _save(); render(); _top();
  }
  function wrDone() {
    const c = _cur(); if (!_stage('transmissions') || !c.wr.graded) return;
    _complete();
  }

  // ── Avis facultatif de l'IA (internet + clé personnelle) ──
  async function aiReview(kind) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || (kind !== 'saed' && kind !== 'transmission')) return;
    if (!_ai() || navigator.onLine === false) return;
    c.ai = c.ai || {};
    if (c.ai[kind] && c.ai[kind].state === 'loading') return;
    const text = kind === 'saed'
      ? scn.call.sections.map(s => s.label.charAt(0) + ' : ' + (c.saed.txt[s.id] || '')).join('\n')
      : scn.written.fields.map(f => f.label + ' : ' + (c.wr.txt[f.id] || '')).join('\n');
    c.ai[kind] = { state: 'loading' };
    const refresh = () => { const box = _el('sim-ai-' + kind); if (box && _cur() === c) box.outerHTML = _aiBlock(kind, c); };
    refresh();
    try {
      const out = await window.App.AI.reviewSim(kind, scn.call.aiFacts, text);
      c.ai[kind] = Object.assign({ state: 'ok' }, out);
    } catch (e) {
      c.ai[kind] = { state: 'err', msg: String((e && e.message) || 'Avis indisponible pour le moment.') };
    }
    _save(); refresh();
  }

  // ── Calcul du résultat, progression, badges ──
  function _results(partial) {
    const c = _cur(), scn = _curScn(), b = _bilanData(), dec = scn.decision;
    const recueil = { max: 30, found: b.keyFound, total: b.keyTotal, pts: 30 * b.keyFound / (b.keyTotal || 1) };
    const gW = b.grid.reduce((a, x) => a + (x.state === 'ok' || x.state === 'retry' ? 1 : (x.state === 'late' ? 0.5 : 0)), 0);
    const gestes = { max: 15, value: gW, total: b.gTotal, pts: 15 * gW / (b.gTotal || 1) };
    const lv = dec.levels.find(l => l.id === c.dec.level) || null;
    const niveau = { max: 10, id: lv ? lv.id : null, pts: lv ? lv.pts : 0, good: !!lv && lv.verdict === 'good' };
    const picked = dec.actions.filter(a => c.dec.picks[a.id]);
    const goodTotal = dec.actions.filter(a => a.v === 'good').length;
    const good = picked.filter(a => a.v === 'good').length, avoid = picked.filter(a => a.v === 'avoid').length;
    const dangers = picked.filter(a => a.v === 'danger');
    let ap = dec.actionsMax * good / goodTotal - 3 * avoid;
    if (dangers.length) ap = 0;
    const actions = { max: dec.actionsMax, good, goodTotal, avoid, danger: dangers.length, pts: Math.max(0, Math.min(dec.actionsMax, ap)) };
    const appel = { max: 15, pts: _callPts(c.saed), tries: c.saed.tries || 0 };
    const trans = { max: 15, pts: c.wr.graded ? c.wr.pts : 0 };
    const unsafe = [];
    if (lv && lv.verdict === 'danger') unsafe.push(lv.unsafe || 'Tu as jugé qu\'il n\'y avait rien à signaler alors que plusieurs signes allaient dans le même sens.');
    dangers.forEach(a => unsafe.push('Geste dangereux choisi : ' + a.label));
    const soins = _soinsResults(c, scn);
    soins.unsafe.forEach(u => unsafe.push(u));
    const raw = recueil.pts + gestes.pts + niveau.pts + actions.pts + appel.pts + trans.pts;
    const capped = unsafe.length > 0 && raw > 50;
    const total = Math.round(unsafe.length ? Math.min(raw, 50) : raw);
    return { recueil, gestes, niveau, actions, appel, trans, soins, unsafe, raw: Math.round(raw * 10) / 10, capped, total,
             allergySaid: _callAllergy(c, scn), ecg: c.rx.ecg ? { score: c.rx.ecg.score } : null, gazo: c.rx.gazo ? { score: c.rx.gazo.score } : null, partial: !!partial };
  }
  function _complete() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.res) return;
    const P = st.prog;
    const R = _results();
    R.prevBest = P.best[scn.id] != null ? P.best[scn.id] : null;
    const base = R.prevBest == null ? R.total + 10 : Math.max(5, R.total - R.prevBest);
    const bonusEcg = R.ecg ? Math.min(20, Math.round(R.ecg.score / 5)) : 0;
    const bonusGazo = R.gazo ? Math.min(10, Math.round(R.gazo.score / 10)) : 0;
    const bonusSoins = R.soins ? R.soins.bonus : 0;
    const bonus = bonusEcg + bonusGazo + bonusSoins;
    R.xp = { base, bonus, bonusEcg, bonusGazo, bonusSoins, total: base + bonus, first: R.prevBest == null };
    const before = _levelOf(P.xp).L.n;
    R.earned = BADGES.filter(bd => { try { return bd.test(R, c, scn); } catch (e) { return false; } }).map(bd => bd.id);
    R.newBadges = R.earned.filter(id => !P.badges[id]);
    R.newBadges.forEach(id => { P.badges[id] = new Date().toISOString(); });
    P.xp += R.xp.total; P.runs++;
    P.best[scn.id] = Math.max(R.prevBest || 0, R.total);
    R.level = { before, after: _levelOf(P.xp).L.n, xp: P.xp };
    c.res = R; c.stage = 'bilan'; c.saved = true;
    const b = _bilanData();
    st.history.unshift({ scenarioId: scn.id, date: new Date().toISOString(), keyFound: b.keyFound, keyTotal: b.keyTotal,
                         gFound: b.gFound, gTotal: b.gTotal, secs: Math.round(c.secs || 0), score: R.total, xp: R.xp.total });
    if (st.history.length > MAX_HISTORY) st.history.length = MAX_HISTORY;
    _save(); render(); _top();
  }

  function closeBilan() { st.current = null; _save(); screen = 'liste'; render(); }
  function replay() { const id = _cur() && _cur().scenarioId; st.current = null; _save(); if (id) start(id); }

  function _howTo(scn, fid) {
    const f = scn.facts[fid];
    if (f.how) return f.how;
    const tk = _toolOfFact(scn, fid);
    if (tk) return 'Utilise « ' + scn.tools[tk].label + ' », puis note la valeur lue dans le recueil.';
    return '';
  }
  function _bilanData() {
    const c = _cur(), scn = _curScn();
    const keys = Object.keys(scn.facts).filter(k => scn.facts[k].key);
    const keyFound = keys.filter(k => c.found[k]).length;
    const grid = scn.grid.map(g => {
      const d = c.done[g.id];
      let state = d ? 'ok' : 'miss', note = '';
      if (d && g.stage === 'contact' && !d.early) { state = 'late'; note = 'Fait, mais après le premier soin : à faire avant tout soin.'; }
      else if (d && d.retry) { state = 'retry'; note = g.id === 'g_trace' ? 'Réussi, mais avec au moins une erreur de saisie corrigée.' : 'Réussi après une correction.'; }
      return { g, state, note };
    });
    return { keys, keyFound, keyTotal: keys.length, grid, gFound: grid.filter(x => x.state === 'ok' || x.state === 'retry').length, gTotal: grid.length };
  }

  // ── Navigation ────────────────────────────────────────────────
  function open() {
    _load();
    const root = _el('sim-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'liste';
    _startTimer();
    render();
    try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {}
  }
  function close() {
    const root = _el('sim-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    _refreshToday();
  }
  function toList() { screen = 'liste'; _confirmFinish = false; render(); }
  function resume() {
    if (!_cur()) return;
    screen = 'jeu'; render();
  }
  function start(id) {
    const scn = _scn(id); if (!scn) return;
    st.current = { scenarioId: id, startedAt: Date.now(), stage: 'couloir', tab: 'dialogue', log: [], found: {}, done: {},
                   asked: {}, seenObj: {}, pending: {}, entered: {}, errors: 0, misplaced: 0,
                   actions: 0, firstCare: null, secs: 0, dossierOpen: false, misses: 0, last: null, saved: false, nb: _nbPref(), notes: '' };
    _fix(st.current);
    _gReset();
    _confirmFinish = false; _menuOpen = false; _menuAct = false;
    screen = 'jeu';
    _save(); render();
  }
  function setTab(t) {
    const c = _cur(); if (!c) return;
    c.tab = t; _save();
    const p = _el('sim-play'); if (p) p.setAttribute('data-tab', t);
    _renderTabs();
    if (t === 'dialogue') _scrollLog();
  }

  // ── Rendu ─────────────────────────────────────────────────────
  function render() {
    const root = _el('sim-root'); if (!root) return;
    const c = _cur();
    if (!(screen === 'jeu' && c && c.stage === 'chambre')) _gReset();
    if (screen === 'jeu' && c) {
      if (c.stage === 'couloir') return _renderCouloir(root);
      if (c.stage === 'chambre') return _renderChambreShell(root);
      if (c.stage === 'decision') return _renderDecision(root);
      if (c.stage === 'transmissions') return _renderTrans(root);
      if (c.stage === 'bilan')   return _renderBilan(root);
    }
    screen = 'liste';
    _renderListe(root);
  }

  function _hms(s) {
    s = Math.max(0, Math.round(s || 0));
    const m = Math.floor(s / 60), r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  function _stepper() {
    const c = _cur(); if (!c) return '';
    const idx = STAGES.findIndex(s => s.id === c.stage);
    return '<ol class="sim-stepper" aria-label="Étapes">' + STAGES.map((s, i) => {
      const cls = s.soon ? 'soon' : (i < idx ? 'done' : (i === idx ? 'now' : ''));
      return `<li class="${cls}"><span class="sim-step-dot">${s.soon ? '' : (i < idx ? '✓' : (i + 1))}</span><span class="sim-step-lbl">${_esc(s.label)}${s.soon ? ' <em>bientôt</em>' : ''}</span></li>`;
    }).join('') + '</ol>';
  }

  // ── Écran : liste des scénarios ──
  function _renderListe(root) {
    const c = _cur();
    const scn = c ? _scn(c.scenarioId) : null;
    let resumeHtml = '';
    if (c && scn) {
      const bil = c.stage === 'bilan';
      const where = { couloir: 'devant la chambre', chambre: 'dans la chambre', decision: 'à l\'étape Décision', transmissions: 'à l\'étape Transmissions' }[c.stage] || '';
      resumeHtml = `<div class="sim-card sim-resume">
        <div><b>${bil ? 'Dernière partie terminée' : 'Partie en cours'}</b> · ${_esc(scn.title)}<br>
        <span class="sim-muted">${bil ? 'Tu peux revoir ton bilan.' : (where ? 'Tu es ' + where + '. ' : '') + 'Ta progression est sauvegardée sur cet appareil.'}</span></div>
        <div class="sim-row"><button class="btn btn-primary" onclick="App.Sim.resume()">${bil ? 'Voir le bilan' : 'Reprendre'}</button>
        <button class="btn btn-ghost" onclick="App.Sim.discard()">Abandonner</button></div>
      </div>`;
    }
    const cards = _scenarios().map(s => `<div class="sim-card sim-scn">
        <div class="sim-scn-head"><span class="sim-scn-ico">${s.icon || '🏠'}</span><div>
          <div class="sim-scn-title">${_esc(s.title)}</div>
          <div class="sim-chips"><span class="sim-chip">${_esc(s.setting)}</span><span class="sim-chip">${_esc(s.levelLabel)}</span><span class="sim-chip">${_esc(s.semestre)} · ${_esc(s.ue.join(', '))}</span><span class="sim-chip">${_esc(s.duration)}</span></div>
        </div></div>
        <p class="sim-scn-desc">${_esc(s.short)}</p>
        <div class="sim-chips sim-comp">${s.competences.map(k => `<span class="sim-chip sim-chip-c" title="${_esc(k.label)}">Compétence ${k.n}</span>`).join('')}</div>
        <div class="sim-row"><button class="btn btn-primary" onclick="App.Sim.start('${_esc(s.id)}')">${c ? 'Rejouer depuis le début' : 'Jouer'} →</button>
        <span class="sim-muted sim-small">${_esc(s.status)}</span></div>
      </div>`).join('');
    const hist = st.history.length ? `<h3 class="sim-h">🗂️ Mes parties</h3><div class="sim-card"><div class="sim-hist">` + st.history.slice(0, 8).map(h => {
      const s = _scn(h.scenarioId);
      const d = new Date(h.date);
      const ds = isNaN(d) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const sc = typeof h.score === 'number' ? `<b>${h.score}/100</b> · ` : '';
      return `<div class="sim-hist-row"><span>${_esc(ds)}</span><span>${_esc(s ? s.title : h.scenarioId)}</span><span>${sc}${h.keyFound}/${h.keyTotal} infos clés · ${h.gFound}/${h.gTotal} gestes${h.xp ? ' · +' + h.xp + ' XP' : ''}</span></div>`;
    }).join('') + '</div></div>' : '';
    root.innerHTML = `<div class="sim-wrap">
      <div class="sim-top"><button class="btn btn-ghost btn-sm" onclick="App.Sim.close()">← Entraînement</button></div>
      <h2 class="sim-title">🩺 Simulation clinique</h2>
      <p class="sim-lead">Entraîne-toi à entrer chez un résident, faire son recueil de données, repérer ce qui doit alerter, puis transmettre l'essentiel. Les patients sont fictifs : aucune donnée réelle.</p>
      <div class="sim-note">✅ <b>Fonctionne hors ligne</b> : tes phrases sont comprises et tes écrits sont corrigés directement par l'application, sans internet. La correction repère des éléments attendus (mots-clés) : ce n'est pas une IA. <br>
      🤖 <b>IA facultative</b> : si tu as ajouté une clé Gemini dans les réglages, un bouton permet de demander un avis plus fin sur ton appel et ta transmission (internet nécessaire, hors score). <br>
      🏅 <b>Ta progression</b> (niveau, XP, badges) reste sur cet appareil.</div>
      ${_progHtml()}
      <label class="sim-nbtog"><input type="checkbox" id="sim-nb-tog" ${_nbPref() ? 'checked' : ''} onchange="App.Sim.setNb(this.checked)"><span><b>📝 Mode bloc-notes</b> · <span id="sim-nb-state">${_nbPref() ? 'activé pour la prochaine partie' : 'désactivé'}</span><br><small>Plus difficile : le recueil n'est plus rempli pour toi. Tu relèves tension, température… et tu les écris toi-même dans un bloc-notes libre, puis tu t'en sers pour transmettre à l'infirmière.</small></span></label>
      ${resumeHtml}
      <h3 class="sim-h">Scénarios</h3>
      ${cards}
      <h3 class="sim-h">Ateliers techniques</h3>
      ${window.App.SimECG ? window.App.SimECG.card() : ''}
      ${hist}
      ${_unkHtml()}
      <p class="sim-muted sim-small sim-disclaimer">Outil d'entraînement. Il ne remplace ni tes cours ni les protocoles de ton lieu de stage. Les valeurs et réponses sont à valider avec ton formateur.</p>
    </div>`;
  }
  function _unkHtml() {
    const a = _unkRead(); if (!a.length) return '';
    return `<details class="sim-bdgs sim-unk"><summary>💬 Phrases non comprises (${a.length})</summary>
      <p class="sim-muted sim-small">Les phrases que le patient n'a pas comprises sont gardées ici, sur cet appareil seulement. Copie la liste et envoie-la pour qu'on ajoute ces façons de parler.</p>
      <ul class="sim-ul">${a.slice(0, 30).map(x => `<li>${_esc(x.t)}</li>`).join('')}</ul>
      <div class="sim-row"><button class="btn btn-ghost btn-sm" id="sim-unk-copy" onclick="App.Sim.unkCopy()">📋 Copier la liste</button><button class="btn btn-ghost btn-sm" onclick="App.Sim.unkClear()">Vider</button></div></details>`;
  }
  function discard() { st.current = null; _save(); render(); }
  function _progHtml() {
    const P = st.prog, lv = _levelOf(P.xp), nb = BADGES.filter(b => P.badges[b.id]).length;
    const best = Object.keys(P.best).reduce((m, k) => Math.max(m, P.best[k] || 0), 0);
    return `<div class="sim-card sim-xp">
      <div class="sim-xp-top"><div class="sim-xp-n">Niv. ${lv.L.n}</div><div class="sim-xp-t"><b>${_esc(lv.L.name)}</b>
        <div class="sim-muted sim-small">${P.xp} XP${lv.next ? ' · prochain niveau (' + _esc(lv.next.name) + ') à ' + lv.next.xp + ' XP' : ' · niveau maximum'}${best ? ' · meilleur score ' + best + '/100' : ''}</div></div></div>
      <div class="sim-xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lv.pct}"><i style="width:${lv.pct}%"></i></div>
      <details class="sim-bdgs"><summary>🏅 Mes badges (${nb}/${BADGES.length})</summary>
        <div class="sim-bdg-grid">${BADGES.map(b => `<div class="sim-bdg ${P.badges[b.id] ? 'on' : 'off'}" title="${_esc(b.desc)}"><span class="sim-bdg-i">${P.badges[b.id] ? b.ico : '🔒'}</span><b>${_esc(b.name)}</b><span class="sim-small sim-muted">${_esc(b.desc)}</span></div>`).join('')}</div></details>
    </div>`;
  }

  // ── Écran : préparation (couloir) ──
  function _dossierHtml(scn, c) {
    const order = scn.dossierOrder || ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_const_hab'];
    return `<div class="sim-dossier"><div class="sim-dossier-h">📁 Dossier de soins · ${_esc(scn.patient.civ)} ${_esc(scn.patient.nom.toUpperCase())} · chambre ${scn.patient.chambre}</div>` +
      order.filter(k => scn.facts[k]).map(k => `<div class="sim-dossier-row"><b>${_esc(scn.facts[k].label)}</b><span>${_esc(scn.facts[k].text)}</span></div>`).join('') + '</div>';
  }
  function _renderCouloir(root) {
    const c = _cur(), scn = _curScn();
    const d = c.done;
    const btn = (id, ico, label, fn, on) => `<button class="sim-act ${on ? 'on' : ''}" onclick="App.Sim.${fn}()"><span class="sim-act-ico">${ico}</span><span>${label}</span>${on ? '<span class="sim-act-ok">✓</span>' : ''}</button>`;
    root.innerHTML = `<div class="sim-wrap">
      <div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Sim.toList()">← Menu</button>
        <div class="sim-bar-title">${_esc(scn.title)}</div><div class="sim-bar-time" id="sim-clock" title="Temps actif">${_hms(c.secs)}</div></div>
      ${_stepper()}
      <div class="sim-card sim-brief">
        <div class="sim-brief-time">🕖 ${_esc(scn.intro.heure)} · ${_esc(scn.setting)}</div>
        <p>${_esc(scn.intro.texte)}</p>
        <p class="sim-quote">${_esc(scn.intro.equipe)}</p>
        <p><b>Ta mission :</b> ${_esc(scn.intro.consigne)}</p>
      </div>
      <h3 class="sim-h">Devant la chambre ${_esc(scn.patient.chambre)}</h3>
      <div class="sim-acts">
        ${btn('dossier', '📁', c.dossierOpen ? 'Refermer le dossier de soins' : 'Lire le dossier de soins', 'readDossier', !!d.g_dossier)}
        ${btn('sha', '🧴', 'Me frictionner les mains', 'sha', !!d.g_sha_in)}
        ${btn('knock', '✊', 'Frapper à la porte', 'knock', !!d.g_frapper)}
      </div>
      ${c.last ? `<div class="sim-last">${_esc(c.last.text)}</div>` : ''}
      ${c.dossierOpen ? _dossierHtml(scn, c) : ''}
      <div class="sim-row sim-enter"><button class="btn btn-primary sim-big" onclick="App.Sim.enter()">🚪 Entrer dans la chambre →</button></div>
    </div>`;
  }

  // ── Écran : chambre (coque, puis mises à jour ciblées) ──
  function _renderChambreShell(root) {
    const c = _cur(), scn = _curScn();
    root.innerHTML = `<div class="sim-wrap sim-wrap-play">
      <div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Sim.toList()">← Menu</button>
        <div class="sim-bar-title">${_esc(scn.title)}</div><div class="sim-bar-time" id="sim-clock" title="Temps actif">${_hms(c.secs)}</div></div>
      <div id="sim-stepper">${_stepper()}</div>
      <nav class="sim-tabbar" id="sim-tabbar" aria-label="Panneaux"></nav>
      <div class="sim-play" id="sim-play" data-tab="${_esc(c.tab || 'dialogue')}">
        <section class="sim-panel sim-p-dialogue" id="sim-p-dialogue" aria-label="Dialogue">
          <div class="sim-pt"><span class="sim-avatar" aria-hidden="true">${scn.patient.avatar || '👵'}</span><div><b>${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}</b><div class="sim-muted sim-small">${_gen('Résidente', scn)} · chambre ${_esc(scn.patient.chambre)}</div></div></div>
          <div class="sim-status" id="sim-status" hidden aria-label="Ce que tu as mis en place"></div>
          <div class="sim-log" id="sim-log" role="log" aria-live="polite"></div>
          <form class="sim-form" id="sim-form" onsubmit="return App.Sim.submit(event)">
            <input id="sim-input" type="text" autocomplete="off" enterkeyhint="send" maxlength="300" placeholder="Écris ce que tu dis à ${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}…" aria-label="Ta phrase">
            <button class="btn btn-primary" type="submit">Envoyer</button>
          </form>
          <div class="sim-toggles">
            <button class="sim-menu-toggle" type="button" id="sim-menu-btn" onclick="App.Sim.toggleMenu()" aria-expanded="false">📋 Questions possibles</button>
            <button class="sim-menu-toggle sim-act-toggle" type="button" id="sim-act-btn" onclick="App.Sim.toggleAct()" aria-expanded="false" ${scn.direct ? 'hidden' : ''}>🩺 Agir</button>
          </div>
          <div class="sim-menu" id="sim-menu"></div>
          <div class="sim-menu sim-actmenu" id="sim-actmenu"></div>
        </section>
        <section class="sim-panel sim-p-chambre" id="sim-p-chambre" aria-label="Chambre">
          <div class="sim-scene-bar"><h3 class="sim-h">🛏️ Dans la chambre</h3>
            <button type="button" class="btn btn-ghost btn-sm" id="sim-zoom" onclick="App.Sim.toggleZoom()">🔍 Zoom sur ${_male(scn) ? 'le patient' : 'la patiente'}</button></div>
          <div class="sim-scene" id="sim-scene" data-tool="">${_sceneSvg(scn)}</div>
          <div class="sim-sheet" id="sim-sheet" hidden aria-live="polite"></div>
          <div class="sim-toolbar" id="sim-toolbar" role="group" aria-label="Instruments"></div>
          <div class="sim-gesture" id="sim-gesture" aria-live="polite"></div>
          <div class="sim-last" id="sim-last" hidden></div>
          <details class="sim-list"><summary>Voir la liste des objets de la chambre</summary><div class="sim-acts" id="sim-list-body"></div></details>
          <div id="sim-finish"></div>
        </section>
        <section class="sim-panel sim-p-recueil" id="sim-p-recueil" aria-label="Recueil de données"></section>
      </div>
    </div>`;
    _zoom = 'room';
    const sc = _el('sim-scene');
    if (sc) {
      sc.addEventListener('click', ev => { const g = ev.target.closest && ev.target.closest('[data-hot]'); if (g) hot(g.getAttribute('data-hot')); });
      sc.addEventListener('keydown', ev => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        const g = ev.target.closest && ev.target.closest('.sim-hot');
        if (g) { ev.preventDefault(); hot(g.getAttribute('data-hot')); }
      });
    }
    _sheet = null; _renderLog(); _renderMenu(); _renderActMenu(); _renderStatus(); _renderChambre(); _renderRecueil(); _renderTabs(); _renderGesture(); _renderSheet();
    setTimeout(_scrollLog, 0);
  }

  // Le dessin suit ce que fait l'étudiant : position, oxygène, saturomètre au doigt, infirmière présente
  const _POS_SCENE = { assise: 'assise', demi: 'demi', bord: 'bord', allongee: 'flat', jambes: 'jambes', pls: 'pls' };
  function _sceneOpts(scn) {
    const o = scn.scene || {}, c = _cur(), k = (c && c.care) || {};
    const patient = Object.assign({ eyes: 'closed', pale: true }, o.patient || {});
    if (k.pos && _POS_SCENE[k.pos.id]) patient.pos = _POS_SCENE[k.pos.id];
    if (k.o2) patient.o2 = { dev: k.o2.dev, deb: k.o2.deb };
    const st = scn.tools && scn.tools.saturometre;
    if (c && st) {
      const placed = !!c.entered[st.fact] || !!c.pending.saturometre || (_G && _G.tool === 'saturometre');
      const live = !!c.entered[st.fact] || !!c.pending.saturometre || !!(_G && _G.tool === 'saturometre' && _G.phase === 'read');
      if (placed) patient.sat = { live, spo2: st.display.big, pr: st.display.pulse };
    }
    // scope (cas hospitaliers) : capteurs posés sur le patient, écran allumé une fois la mesure faite
    let scope = null; const sc = scn.tools && scn.tools.scope;
    if (c && sc && o.scope) {
      const gp = _G && _G.kind === 'scope' ? _G.placed : null;
      const live = !!(c.mon && c.mon.live) || !!c.pending.scope || !!(_G && _G.kind === 'scope' && _G.phase === 'read');
      const placed = live ? { ecg: true, bras: true, doigt: true } : gp;
      if (placed) {
        patient.mon = { ecg: !!placed.ecg, bras: !!placed.bras, doigt: !!placed.doigt, live };
        if (placed.doigt && !patient.sat) patient.sat = { live, spo2: sc.display.spo2, pr: sc.display.fc };
      }
      scope = Object.assign({}, o.scope, { on: live });
    }
    return Object.assign({}, o, { patient, scope, nurse: !!k.alert, room: scn.patient && scn.patient.chambre });
  }
  const _sceneSigOf = o => JSON.stringify([o.patient.pos, o.patient.o2, o.patient.sat, o.patient.mon, o.nurse, o.scope && o.scope.on]);
  let _sceneSig = '';
  function _sceneSvg(scn) {
    const o = _sceneOpts(scn); _sceneSig = _sceneSigOf(o);
    return App.SimScene.svg(o);
  }
  function _refreshScene() {                 // redessine seulement si quelque chose a changé (le zoom en cours est conservé)
    const sc = _el('sim-scene'), scn = _curScn(); if (!sc || !scn || !_cur()) return;
    const o = _sceneOpts(scn), sig = _sceneSigOf(o);
    if (sig === _sceneSig) return;
    const old = sc.querySelector('svg'), vb = old ? old.getAttribute('viewBox') : null;
    _sceneSig = sig; sc.innerHTML = App.SimScene.svg(o);
    const nw = sc.querySelector('svg'); if (nw && vb) nw.setAttribute('viewBox', vb);
  }
  function _scrollLog() { const l = _el('sim-log'); if (l) l.scrollTop = l.scrollHeight; }
  function _renderLog() {
    const l = _el('sim-log'), c = _cur(); if (!l || !c) return;
    const scn = _curScn();
    const chips = (c.suggest && c.suggest.length && scn)
      ? `<div class="sim-sugg">${c.suggest.map(id => { const it = _intent(id); return it ? `<button type="button" class="sim-q" onclick="App.Sim.askMenu('${_esc(id)}')">${_esc(_gen(it.menu, scn))}</button>` : ''; }).join('')}</div>` : '';
    l.innerHTML = c.log.map(m => `<div class="sim-msg sim-${_esc(m.who)}">${_esc(m.text)}</div>`).join('') + chips;
    _scrollLog();
  }
  function _renderMenu() {
    const m = _el('sim-menu'), b = _el('sim-menu-btn'), c = _cur(); if (!m || !c) return;
    m.style.display = _menuOpen ? 'block' : 'none';
    if (b) b.setAttribute('aria-expanded', _menuOpen ? 'true' : 'false');
    if (!_menuOpen) return;
    const I = window.App.SimIntents, scn = _curScn();
    m.innerHTML = I.THEMES.map(t => {
      const items = I.LIST.filter(i => i.theme === t.id && (!i.extra || (scn && scn.answers && scn.answers[i.id])));
      if (!items.length) return '';
      return `<details data-th="${_esc(t.id)}" ${_openThemes[t.id] ? 'open' : ''} ontoggle="App.Sim.thToggle('${_esc(t.id)}', this.open)">
        <summary>${_esc(_gen(t.label, scn))}</summary>
        ${items.map(i => `<button type="button" class="sim-q ${c.asked[i.id] ? 'done' : ''}" onclick="App.Sim.askMenu('${_esc(i.id)}')">${c.asked[i.id] ? '✓ ' : ''}${_esc(_gen(i.menu, scn))}</button>`).join('')}
      </details>`;
    }).join('') + '<div class="sim-muted sim-small sim-menu-tip">Tu peux aussi taper ta propre phrase dans la zone de texte. ' + (scn.direct ? 'Pour agir, touche le dessin de la chambre dans l\'onglet « Chambre » : le lit (position), la prise d\'oxygène au mur, la sonnette, le patient (observer).' : 'Pour agir (installer le résident, alerter, oxygène) : bouton « 🩺 Agir ».') + '</div>';
  }
  function thToggle(id, open) { if (open) _openThemes[id] = true; else delete _openThemes[id]; }
  function toggleMenu() { _menuOpen = !_menuOpen; if (_menuOpen) _menuAct = false; _renderMenu(); _renderActMenu(); }

  function _renderChambre() { _renderToolbar(); _renderLast(); _renderList(); _renderFinish(); _syncScene(); }

  function _renderLast() {
    const el = _el('sim-last'), c = _cur(); if (!el || !c) return;
    el.hidden = !c.last; el.textContent = c.last ? c.last.text : '';
  }
  function _renderList() {
    const el = _el('sim-list-body'), c = _cur(), scn = _curScn(); if (!el || !c || !scn) return;
    const objBtn = k => { const o = scn.objects[k]; const on = !!c.seenObj[k];
      return `<button class="sim-act ${on ? 'on' : ''}" onclick="App.Sim.useObject('${k}')"><span class="sim-act-ico">${o.icon}</span><span>${_esc(o.label)}</span>${on ? '<span class="sim-act-ok">✓</span>' : ''}</button>`; };
    el.innerHTML = Object.keys(scn.objects).map(objBtn).join('') +
      `<button class="sim-act ${c.done.g_sha_out ? 'on' : ''}" onclick="App.Sim.sha()"><span class="sim-act-ico">🧴</span><span>Me frictionner les mains</span>${c.done.g_sha_out ? '<span class="sim-act-ok">✓</span>' : ''}</button>`;
  }
  function _renderFinish() {
    const el = _el('sim-finish'), scn = _curScn(); if (!el || !scn) return;
    el.innerHTML = _confirmFinish
      ? `<div class="sim-confirm"><p><b>Terminer le recueil ?</b><br><span class="sim-muted">Tu passeras à la décision. Tu ne pourras plus retourner dans la chambre ni poser de questions à ${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}.</span></p>
         <div class="sim-row"><button class="btn btn-ghost" onclick="App.Sim.cancelFinish()">Continuer le recueil</button><button class="btn btn-primary" onclick="App.Sim.finish()">Oui, terminer</button></div></div>`
      : `<div class="sim-row sim-enter"><button class="btn btn-primary" onclick="App.Sim.askFinish()">Terminer le recueil →</button></div>`;
  }
  function _renderToolbar() {
    const el = _el('sim-toolbar'), c = _cur(), scn = _curScn(); if (!el || !c || !scn) return;
    el.innerHTML = scn.toolOrder.map(k => {
      const t = scn.tools[k], done = _toolFacts(t).every(f => !!c.found[f]), pend = !!c.pending[k] && !done, held = _tool === k;
      return `<button type="button" class="sim-tool ${held ? 'held' : ''} ${done ? 'done' : ''}" aria-pressed="${held}" onclick="App.Sim.pickTool('${k}')">
        <span class="sim-tool-ico">${t.icon}</span><span class="sim-tool-lbl">${_esc(t.label)}</span>${done ? (t.waste && c.waste && !c.waste.done ? '<span class="sim-pend-dot" title="Déchets à trier">♻️</span>' : '<span class="sim-act-ok">✓</span>') : (pend ? '<span class="sim-pend-dot" title="Valeur à noter">✎</span>' : '')}</button>`;
    }).join('');
  }
  // L'instrument en main, ou le geste en cours : tout ce que la patiente et l'écran affichent
  function _lcd(d) {
    if (d.pulse != null) {                      // saturomètre de doigt : SpO₂ en grand, pouls (bpm) dessous, comme sur l'appareil
      return `<div class="sim-lcd oxi" role="img" aria-label="Écran du saturomètre : SpO₂ ${_esc(d.big)} ${_esc(d.unit)}, pouls ${_esc(d.pulse)} battements par minute">
        <span class="sim-oxi-pwr" aria-hidden="true"></span>
        <span class="sim-oxi-scr">
          <span class="sim-oxi-row"><small>SpO₂</small><b>${_esc(d.big)}</b><i>${_esc(d.unit)}</i></span>
          <span class="sim-oxi-row pr"><small>PR</small><b>${_esc(d.pulse)}</b><i>bpm <em aria-hidden="true">♥</em></i></span>
        </span>
        ${d.sub ? `<span class="sim-lcd-sub">${_esc(d.sub)}</span>` : ''}</div>`;
    }
    return `<div class="sim-lcd" role="img" aria-label="Écran de l'appareil : ${_esc(d.big)} ${_esc(d.unit)}">${d.sub ? `<span class="sim-lcd-sub">${_esc(d.sub)}</span>` : ''}<span class="sim-lcd-v">${_esc(d.big)}</span><span class="sim-lcd-u">${_esc(d.unit)}</span></div>`;
  }
  // Appareils de mesure dessinés avec leur boîtier : tensiomètre (START / MEM + tuyau), thermomètre (sonde), glucomètre (bandelette + goutte)
  const _DEVS = { tension: 'tension', thermometre: 'thermo', glucometre: 'gluco' };
  function _dev(key, d, busy) {
    const kind = _DEVS[key]; if (!kind || !d || d.pulse != null) return _lcd(d);
    const dash = kind === 'tension' ? '--- / --' : (kind === 'thermo' ? '--.-' : '---');
    const scr = busy
      ? `<span class="sim-dev-v blink" aria-hidden="true">${dash}</span><span class="sim-lcd-u">${_esc(d.unit)}</span>`
      : `${d.sub ? `<span class="sim-lcd-sub">${_esc(d.sub)}</span>` : ''}<span class="sim-lcd-v">${_esc(d.big)}</span><span class="sim-lcd-u">${_esc(d.unit)}</span>`;
    const lbl = busy ? 'Appareil en train de mesurer' : `Écran de l'appareil : ${d.big} ${d.unit}`;
    const screen = `<div class="sim-lcd sim-lcd-in" role="img" aria-label="${_esc(lbl)}">${scr}</div>`;
    if (kind === 'tension') return `<div class="sim-dev sim-dev-tension"><div class="sim-dev-body"><div class="sim-dev-brand">TENSIOMÈTRE</div>${screen}
      <div class="sim-dev-btns"><span class="sim-dev-btn start">START</span><span class="sim-dev-btn">MEM</span></div><span class="sim-dev-port" aria-hidden="true"></span></div>
      <svg class="sim-dev-tube" viewBox="0 0 90 40" aria-hidden="true"><path d="M0 4 C34 4 40 36 70 30" fill="none" stroke="#8a97a6" stroke-width="5" stroke-linecap="round"/><path d="M0 4 C34 4 40 36 70 30" fill="none" stroke="#d3dae2" stroke-width="2" stroke-linecap="round"/><rect x="66" y="22" width="22" height="16" rx="5" fill="#3b5bb0" stroke="#1d2f66"/></svg></div>`;
    if (kind === 'thermo') return `<div class="sim-dev sim-dev-thermo"><div class="sim-dev-body"><div class="sim-dev-brand">THERMOMÈTRE</div>${screen}<span class="sim-dev-btn start">ON</span></div><span class="sim-dev-probe" aria-hidden="true"></span></div>`;
    return `<div class="sim-dev sim-dev-gluco"><div class="sim-dev-body"><div class="sim-dev-brand">GLUCOMÈTRE</div>${screen}<span class="sim-dev-btn start">OK</span>
      <span class="sim-dev-strip" aria-hidden="true"><i class="${busy ? 'drop' : ''}"></i></span></div>
      <svg class="sim-dev-pen" viewBox="0 0 80 22" aria-hidden="true"><rect x="2" y="5" width="56" height="12" rx="6" fill="#e8ecf2" stroke="#8d99a8"/><rect x="58" y="8" width="16" height="6" rx="3" fill="#9aa6b5"/><circle cx="14" cy="11" r="3" fill="#2f6fd6"/></svg></div>`;
  }
  // Écran du scope : tracé du rythme, FC, SpO₂, pression non invasive, FR ; une alarme sonne si une valeur sort des seuils
  function _ecgPath(irregular) {
    const gaps = irregular ? [38, 24, 44, 30, 36, 22] : [34, 34, 34, 34, 34, 34];
    let x = 4, d = 'M0 24';
    gaps.forEach(g => { d += ` L${x} 24 L${x + 3} 20 L${x + 5} 24 L${x + 8} 24 L${x + 10} 4 L${x + 13} 40 L${x + 15} 24 L${x + 20} 24 L${x + 25} 19 L${x + 30} 24`; x += g + 12; });
    return d + ` L${x} 24`;
  }
  function _scopeLcd(t) {
    const d = t.display, al = d.alarms || [];
    const tile = (cls, lbl, val, unit) => `<div class="sc-t ${cls}"><small>${lbl}</small><b>${_esc(val)}</b><i>${_esc(unit)}</i></div>`;
    return `<div class="sim-scope" role="img" aria-label="Écran du scope : fréquence cardiaque ${_esc(d.fc)}, SpO₂ ${_esc(d.spo2)} %, pression artérielle ${_esc(d.pa)}, fréquence respiratoire ${_esc(d.fr)}">
      <svg class="sim-scope-ecg" viewBox="0 0 330 44" preserveAspectRatio="none" aria-hidden="true"><path d="${_ecgPath(d.irregular)}" fill="none" stroke="#5dff8f" stroke-width="1.6" stroke-linejoin="round" pathLength="400"/></svg>
      <div class="sim-scope-grid">${tile('fc', 'FC', d.fc, '/min')}${tile('sp', 'SpO₂', d.spo2, '%')}${tile('pa', 'PNI', d.pa, 'mmHg')}${tile('fr', 'FR', d.fr, '/min')}</div>
      ${al.length ? `<div class="sim-scope-alarm" role="status">🔔 ${al.map(_esc).join(' · ')}</div>` : ''}</div>`;
  }
  function _scopeSensors(t) {
    const g = _G || { placed: {} };
    const list = `<ul class="sim-sens">${t.sensors.map(x => `<li class="${g.placed[x.id] ? 'done' : ''}"><span class="sim-sens-i" aria-hidden="true">${g.placed[x.id] ? '✓' : '○'}</span><span>${_esc(x.label)}<small>${_esc(x.hint)}</small></span></li>`).join('')}</ul>`;
    const cuff = g.sub === 'cuff' ? `<div class="sim-g-note">Pose le brassard du scope toi-même : hauteur (glisse-le ou ▲ ▼) et sens du repère « Artery » (↺ ↻).</div>${_hint ? `<div class="sim-g-warn" role="alert">${_esc(_hint)}</div>` : ''}${_cuffPanel(t, false)}` : '';
    return `<div class="sim-g-note">${_esc(t.intro)}</div>${list}${cuff}`;
  }
  function _scale(t) {
    let cells = '';
    for (let i = 0; i <= 10; i++) {
      const face = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😟', '😣', '😖', '😭'][i];
      cells += `<div class="sim-sc ${i === t.scale ? 'on' : ''}" style="--h:${Math.round(125 - i * 12.5)}"><span class="sim-sc-f">${face}</span><b>${i}</b>${i === t.scale ? '<span class="sim-sc-hand" aria-hidden="true">👆</span>' : ''}</div>`;
    }
    return `<div class="sim-scale" role="img" aria-label="Échelle de douleur de 0 à 10 : ${_gen('la résidente', _curScn())} montre ${t.scale}">${cells}</div><div class="sim-quote">${_esc(t.patientSays)}</div>`;
  }
  // Dessin du bras (face interne, paume vers le haut) avec le brassard à la hauteur réglée ; le repère imprimé « Artery » se déplace quand on tourne le brassard
  function _armSvg(k, locked) {
    const y = -k.cm * CUFF_S, rad = k.ang * Math.PI / 180, cx = 75, mx = cx + Math.sin(rad) * 30, face = Math.cos(rad) > 0.05;
    const cuff = `<g id="sim-cuffband" transform="translate(0 ${y})">
      <rect x="40" y="${CUFF_Y0 - CUFF_H}" width="70" height="${CUFF_H}" rx="9" fill="url(#cfg)" stroke="#1d2f66" stroke-width="2"/>
      <rect x="40" y="${CUFF_Y0 - 14}" width="70" height="14" rx="6" fill="#4a6cc2" opacity=".55"/>
      <path d="M44 ${CUFF_Y0 - CUFF_H + 9} H106" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
      ${face ? `<g transform="translate(${mx.toFixed(1)} ${CUFF_Y0 - CUFF_H / 2 - 2})" opacity="${(0.4 + 0.6 * Math.cos(rad)).toFixed(2)}"><path d="M0 -14 V6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M-5 1 L0 8 L5 1Z" fill="#fff"/><text y="19" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff" letter-spacing=".3">Artery</text></g>
        <g transform="translate(${(mx - 26 * Math.cos(rad)).toFixed(1)} ${CUFF_Y0 - CUFF_H + 3})" opacity=".9"><text font-size="6" fill="#dbe6ff">INDEX</text><path d="M0 5 H26" stroke="#dbe6ff" stroke-width="1"/><path d="M6 3 V8 M13 3 V8 M20 3 V8" stroke="#dbe6ff" stroke-width=".8"/></g>` : ''}
      <path d="M108 ${CUFF_Y0 - 6} C130 ${CUFF_Y0 + 2} 136 ${CUFF_Y0 + 24} 132 ${CUFF_Y0 + 46}" fill="none" stroke="#8a97a6" stroke-width="5" stroke-linecap="round"/>
      <path d="M108 ${CUFF_Y0 - 6} C130 ${CUFF_Y0 + 2} 136 ${CUFF_Y0 + 24} 132 ${CUFF_Y0 + 46}" fill="none" stroke="#c9d2dc" stroke-width="2" stroke-linecap="round"/></g>`;
    return `<svg class="sim-arm" id="sim-arm" viewBox="0 0 150 230" role="img" aria-label="Schéma du bras avec le brassard" ${locked ? '' : 'onpointerdown="App.Sim.cuffDown(event)" onpointermove="App.Sim.cuffMove(event)" onpointerup="App.Sim.cuffUp(event)" onpointercancel="App.Sim.cuffUp(event)"'}>
      <defs><linearGradient id="cfg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#27428c"/><stop offset=".5" stop-color="#3b5bb0"/><stop offset="1" stop-color="#27428c"/></linearGradient>
        <linearGradient id="arg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e7b48c"/><stop offset=".45" stop-color="#f6d2b3"/><stop offset="1" stop-color="#e2ad84"/></linearGradient></defs>
      <path d="M46 6 Q75 -4 104 6 L106 112 Q75 130 44 112Z" fill="url(#arg)" stroke="#c98f66" stroke-width="1.4"/>
      <path d="M44 112 Q75 130 106 112 L100 222 Q75 230 50 222Z" fill="url(#arg)" stroke="#c98f66" stroke-width="1.4"/>
      <path d="M58 40 Q75 58 92 40" fill="none" stroke="#d29a72" stroke-width="1.6" opacity=".7"/>
      <path d="M45 122 Q75 142 105 122" fill="none" stroke="#c4875c" stroke-width="2.6" stroke-linecap="round"/>
      <text x="75" y="160" text-anchor="middle" font-size="8.5" fill="#9a6a48">pli du coude</text>
      ${cuff}</svg>`;
  }
  function _crossSvg(k) {              // coupe du bras vue du dessus : le thorax est à gauche, l'extérieur à droite
    const R = 33, a = (180 + k.ang) * Math.PI / 180, mx = 60 + Math.cos(a) * (R + 1), my = 60 + Math.sin(a) * (R + 1), deg = 180 + k.ang;
    return `<svg class="sim-cross" viewBox="0 0 120 120" role="img" aria-label="Coupe du bras vue du dessus : le thorax est à gauche">
      <path d="M0 6 Q9 60 0 114" fill="#d9e0ea" stroke="#b3bfce" stroke-width="2"/><text x="4" y="62" font-size="7" fill="#6b7a8c" transform="rotate(-90 9 60)" text-anchor="middle">thorax</text>
      <circle cx="60" cy="60" r="27" fill="#f4cba9" stroke="#c98f66" stroke-width="1.4"/><circle cx="62" cy="62" r="6" fill="#efe7dc" stroke="#cdbfae"/>
      <ellipse cx="55" cy="52" rx="13" ry="9" fill="#e7a98a" opacity=".55"/>
      ${k.palp ? '<circle cx="36" cy="60" r="3.6" fill="#d11f2a"><animate attributeName="r" values="3;5;3" dur=".9s" repeatCount="indefinite"/></circle><text x="36" y="73" font-size="6.5" fill="#b3131d" text-anchor="middle">pouls</text>' : ''}
      <circle cx="60" cy="60" r="${R}" fill="none" stroke="#2f4f9e" stroke-width="7"/>
      <g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${deg - 90})"><path d="M0 -7 L5 4 L-5 4Z" fill="#fff" stroke="#16295f" stroke-width="1"/></g>
      <text x="60" y="112" text-anchor="middle" font-size="6.5" fill="#6b7a8c">extérieur du bras →</text></svg>`;
  }
  function _cuffPanel(t, locked) {
    const k = _cuffState();
    if (locked) return `<div class="sim-cuff">${_armSvg(k, true)}<div class="sim-cuff-side">${_crossSvg(k)}</div></div>`;
    return `<div class="sim-cuff">${_armSvg(k, false)}<div class="sim-cuff-side">${_crossSvg(k)}
        <div class="sim-cuff-ctl"><div class="sim-cuff-row"><span>Hauteur</span><button type="button" class="btn btn-ghost btn-sm" aria-label="Monter le brassard" onclick="App.Sim.gCuffMove(0.5)">▲</button><button type="button" class="btn btn-ghost btn-sm" aria-label="Descendre le brassard" onclick="App.Sim.gCuffMove(-0.5)">▼</button></div>
        <div class="sim-cuff-row"><span>Sens</span><button type="button" class="btn btn-ghost btn-sm" aria-label="Tourner le brassard vers la gauche" onclick="App.Sim.gCuffRot(-30)">↺</button><button type="button" class="btn btn-ghost btn-sm" aria-label="Tourner le brassard vers la droite" onclick="App.Sim.gCuffRot(30)">↻</button></div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.Sim.gCuffPalp()" ${k.palp ? 'disabled' : ''}>🫳 Palper le pli du coude</button></div></div></div>
      <div class="sim-row"><button type="button" class="btn btn-primary" onclick="App.Sim.gCuffOk()">✔ Valider la pose du brassard</button></div>`;
  }
  function _gesture() {                 // contenu du panneau « geste »
    const c = _cur(), scn = _curScn(); if (!c || !scn) return '';
    const key = _G ? _G.tool : _tool; const t = scn.tools[key];
    const head = `<div class="sim-g-head"><span class="sim-g-ico">${t.icon}</span><div><b>${_G ? _esc(t.label) : 'Dans ta main : ' + _esc(t.label)}</b>${_G ? '' : `<div class="sim-muted sim-small">${_esc(_gen("Touche sur la patiente l'endroit où tu l'utilises.", scn))}</div>`}</div><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sim.dropTool()">${_G && _G.phase === 'running' ? 'Annuler' : 'Reposer'}</button></div>`;
    const warn = _hint ? `<div class="sim-g-warn" role="alert">${_esc(_hint)}</div>` : '';
    if (t.kind === 'scope' && (!_G || _G.phase === 'sensors')) return head + warn + _scopeSensors(t);
    if (!_G) return head + warn;
    const g = _G;
    if (g.phase === 'waste') {
      const w = c.waste, tw = t.waste, binBy = {}; tw.bins.forEach(b => { binBy[b.id] = b; });
      const rows = (w.order || tw.items.map(i => i.id)).map(id => { const i = tw.items.find(x => x.id === id), cur = w.assign[id];
        const state = w.revealed ? (cur === i.bin ? 'good' : 'wrong') : '';
        return `<div class="sim-waste-row ${state}"><div class="sim-waste-l">${_esc(i.label)}${w.revealed ? `<div class="sim-muted sim-small">${cur === i.bin ? '✓' : '✗ → ' + _esc(binBy[i.bin].label)} · ${_esc(i.why)}</div>` : ''}</div>
          <div class="sim-waste-b" role="group" aria-label="${_esc(i.label)}">${tw.bins.map(b => `<button type="button" class="sim-waste-btn ${b.id} ${cur === b.id ? 'on' : ''}" aria-pressed="${cur === b.id}" ${w.revealed ? 'disabled' : ''} onclick="App.Sim.gWasteSet('${i.id}','${b.id}')"><span aria-hidden="true">${b.ico}</span> ${_esc(b.label)}</button>`).join('')}</div></div>`; }).join('');
      return head + `<div class="sim-prep"><div class="sim-readlbl">♻️ ${_esc(tw.title)}</div><p class="sim-muted sim-small">${_esc(tw.intro)}</p>${warn}<div class="sim-waste">${rows}</div>
        <div class="sim-readrow"><button type="button" class="btn btn-primary" onclick="App.Sim.gWasteSubmit()">${w.revealed ? 'Compris : terminer' : 'Valider mon tri'}</button></div></div>`;
    }
    if (g.phase === 'prep') {
      const pr = c.prep[key], pp = t.prep, byId = {}; pp.items.forEach(i => { byId[i.id] = i; });
      const list = (pr.order || pp.items.map(i => i.id)).map(id => { const i = byId[id], on = pr.sel.indexOf(id) >= 0;
        const cls = pr.revealed ? (i.ok ? 'good' : (on ? 'wrong' : '')) : (on ? 'on' : '');
        return `<button type="button" class="sim-prep-it ${cls}" aria-pressed="${on}" ${pr.revealed ? 'disabled' : ''} onclick="App.Sim.gPrepToggle('${i.id}')"><span class="sim-prep-box">${pr.revealed ? (i.ok ? '✓' : (on ? '✗' : '')) : (on ? '☑' : '☐')}</span><span>${_esc(i.label)}</span></button>`; }).join('');
      return head + `<div class="sim-prep"><div class="sim-readlbl">🛡️ ${_esc(pp.title)}</div><p class="sim-muted sim-small">${_esc(pp.intro)}</p>${warn}<div class="sim-prep-list">${list}</div>
        <div class="sim-readrow"><button type="button" class="btn btn-primary" onclick="App.Sim.gPrepSubmit()">${pr.revealed ? 'Compris : continuer vers le geste' : 'Valider ma préparation (' + pr.sel.length + ')'}</button></div></div>`;
    }
    if (g.phase === 'measuring') {
      const txt = g.sub === 'inflate' ? 'Le brassard se gonfle… Reste immobile et ne parle pas.' : (g.sub === 'scope' ? 'Le scope démarre : le brassard se gonfle tout seul et les courbes apparaissent… patiente quelques secondes.' : 'Mesure en cours… patiente quelques secondes.');
      const dv = (t.display && !t.multi && g.sub !== 'scope' && _DEVS[g.tool]) ? _dev(g.tool, t.display, true) : '';
      return head + `${dv}<div class="sim-g-note">${txt}</div><div class="sim-prog"><i id="sim-g-bar" style="width:0%"></i></div>`;
    }
    if (g.phase === 'place') {
      return head + `<div class="sim-g-note">Pose le brassard toi-même : fais glisser le brassard le long du bras (ou utilise ▲ ▼) et tourne-le (↺ ↻) pour que le repère imprimé soit bien orienté. Puis valide.</div>${warn}${_cuffPanel(t, false)}`;
    }
    if (g.phase === 'cuffed') {
      return head + `${_cuffPanel(t, true)}<div class="sim-g-note">Le brassard est bien en place : repère « Artery » face à l'artère, juste au-dessus du pli du coude. Quand tu es prêt, lance la mesure.</div><div class="sim-row"><button type="button" class="btn btn-primary" onclick="App.Sim.gInflate()">▶ Lancer la mesure</button></div>`;
    }
    if (g.phase === 'ready') {
      return head + `<div class="sim-g-note">${_esc(t.intro)}</div>${warn}<div class="sim-row"><button type="button" class="btn btn-primary" onclick="App.Sim.gStartCount()">▶ Démarrer le comptage (${t.seconds} s)</button></div>`;
    }
    if (g.phase === 'running') {
      return head + `<div class="sim-count"><div class="sim-count-time"><span id="sim-g-time">${t.seconds}</span><small> s</small></div>
        <div class="sim-beat" style="animation-duration:${(60 / t.rate).toFixed(3)}s" aria-hidden="true">${t.tap === 'Battement' ? '💗' : '🫁'}</div>
        <div class="sim-count-n"><span id="sim-g-n">0</span><small> compté(s)</small></div></div>
        <div class="sim-prog"><i id="sim-g-bar" style="width:0%"></i></div>
        <button type="button" class="sim-tapbtn" id="sim-g-tap" onclick="App.Sim.gTap()">${_esc(t.tap)} <small>(ou barre d'espace)</small></button>`;
    }
    if (g.phase === 'recount') {
      const val = g.n * t.factor;
      return head + `<div class="sim-g-warn" role="alert">Tu as compté ${g.n} en ${t.seconds} secondes, soit ${val} /min. Cela ne colle pas avec ce que tu observes : recommence en comptant avec attention.</div>
        <div class="sim-row"><button type="button" class="btn btn-primary" onclick="App.Sim.gRecount()">↺ Recompter</button></div>`;
    }
    // phase « read » : lire l'écran puis noter
    if (c.nb) {
      let disp;
      if (t.multi) disp = _scopeLcd(t);
      else if (t.kind === 'count') disp = `<div class="sim-g-note">Tu as compté <b>${g.n}</b> ${t.tap === 'Battement' ? 'battements' : 'respirations'} en ${t.seconds} secondes. À toi de calculer la fréquence par minute.</div>`;
      else if (t.kind === 'scale') disp = _scale(t);
      else disp = _dev(g.tool, t.display);
      return head + `<div class="sim-readform sim-nbform">${disp}${t.display && t.display.note ? `<p class="sim-muted sim-small">${_esc(t.display.note)}</p>` : ''}${warn}
        <label class="sim-readlbl" for="sim-nb-g">Lis l'écran puis écris dans ton bloc-notes ce que tu relèves (valeur et unité).</label>
        <textarea id="sim-nb-g" class="sim-nb-ta" rows="4" maxlength="3000" placeholder="Ex. : …" oninput="App.Sim.nbTxt(this.value)">${_esc(c.notes)}</textarea>
        <div class="sim-readrow"><button type="button" class="btn btn-primary" onclick="App.Sim.gNbDone()">✔ J'ai noté, ranger l'appareil</button></div></div>`;
    }
    if (t.multi) {
      let k = 0;
      const f = (m, id, ph, lab) => `<label class="sim-mf"><span>${_esc(lab)}</span><input id="sim-in-${id}" type="text" inputmode="numeric" autocomplete="off" aria-label="${_esc(lab)}" placeholder="${ph}" value="${_esc((g.vals && g.vals[id - 1]) || '')}"></label>`;
      const fields = t.multi.map(m => m.type === 'bp'
        ? `<span class="sim-mf2">${f(m, ++k, '0', 'PA systolique')}<span class="sim-slash">/</span>${f(m, ++k, '0', 'PA diastolique')}<span class="sim-unit">mmHg</span></span>`
        : `<span class="sim-mf2">${f(m, ++k, '0', m.label)}<span class="sim-unit">${_esc(m.unit)}</span></span>`).join('');
      return head + `<form class="sim-readform" onsubmit="return App.Sim.gSubmit(event)">${_scopeLcd(t)}${t.display.note ? `<p class="sim-muted sim-small">${_esc(t.display.note)}</p>` : ''}${warn}
        <div class="sim-readlbl">Lis l'écran du scope et note chaque valeur : une alarme qui sonne ne remplace pas ton regard sur le patient.</div>
        <div class="sim-multi">${fields}</div><div class="sim-readrow"><button type="submit" class="btn btn-primary">✎ Noter dans le recueil</button></div></form>`;
    }
    const inp = t.input;
    let disp;
    if (t.kind === 'count') disp = `<div class="sim-g-note">Tu as compté <b>${g.n}</b> ${t.tap === 'Battement' ? 'battements' : 'respirations'} en ${t.seconds} secondes.</div>`;
    else if (t.kind === 'scale') disp = _scale(t);
    else disp = _dev(g.tool, t.display);
    const inputs = inp.type === 'bp'
      ? '<input id="sim-in-1" type="text" inputmode="numeric" autocomplete="off" aria-label="Pression systolique" placeholder="0"><span class="sim-slash">/</span><input id="sim-in-2" type="text" inputmode="numeric" autocomplete="off" aria-label="Pression diastolique" placeholder="0">'
      : (t.also
        ? `<input id="sim-in-1" type="text" inputmode="decimal" autocomplete="off" aria-label="${_esc(inp.label)}" placeholder="SpO₂"><span class="sim-unit">${_esc(inp.unit)}</span><input id="sim-in-2" type="text" inputmode="decimal" autocomplete="off" aria-label="${_esc(t.also.input.label)}" placeholder="Pouls"><span class="sim-unit">${_esc(t.also.input.unit)}</span>`
        : `<input id="sim-in-1" type="text" inputmode="decimal" autocomplete="off" aria-label="${_esc(inp.label)}" placeholder="0">`);
    const lbl = t.kind === 'count' ? `Calcule la fréquence par minute (${g.n} × ${t.factor})` : (t.also ? 'Saturation (SpO₂) et pouls (PR) : note les deux valeurs lues' : `${_esc(inp.label)} : note la valeur lue`);
    return head + `<form class="sim-readform" onsubmit="return App.Sim.gSubmit(event)">${disp}${t.display && t.display.note ? `<p class="sim-muted sim-small">${_esc(t.display.note)}</p>` : ''}${warn}
      <label class="sim-readlbl" for="sim-in-1">${lbl}</label>
      <div class="sim-readrow">${inputs}${t.also ? '' : `<span class="sim-unit">${_esc(inp.unit)}</span>`}<button type="submit" class="btn btn-primary">✎ Noter dans le recueil</button></div></form>`;
  }
  function _renderGesture(focus) {
    const box = _el('sim-gesture'); if (!box) return;
    const on = !!(_tool || _G);
    box.classList.toggle('on', on);
    box.innerHTML = on ? _gesture() : '';
    if (focus) { const i = _el('sim-in-1') || _el('sim-nb-g'); if (i) { try { i.focus({ preventScroll: false }); } catch (e) { i.focus(); } } }
  }
  // Dessin : marques « déjà regardé », instrument en main, zones de la patiente
  function _syncScene() {
    const sc = _el('sim-scene'), c = _cur(), scn = _curScn(); if (!sc || !c || !scn) return;
    _refreshScene();
    sc.setAttribute('data-tool', _tool || '');
    sc.querySelectorAll('.sim-hot').forEach(g => {
      const id = g.getAttribute('data-hot'), tk = scn.sceneTools && scn.sceneTools[id];
      g.classList.toggle('seen', !!c.seenObj[id]);
      g.classList.toggle('held', !!tk && tk === _tool);
    });
    const zb = _el('sim-zoom'); if (zb) zb.textContent = _zoom === 'patient' ? '🏠 Vue de la chambre' : '🔍 Zoom sur ' + (_male(scn) ? 'le patient' : 'la patiente');
  }
  function _setZoom(mode, auto) {
    _zoom = mode; _autoZoom = !!auto && mode === 'patient';
    const svg = document.querySelector('#sim-scene svg'); if (!svg) return;
    const to = App.SimScene.VIEW[mode].split(' ').map(Number), from = (svg.getAttribute('viewBox') || App.SimScene.VIEW.room).split(' ').map(Number);
    if (_anim) cancelAnimationFrame(_anim);
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now(), dur = still ? 0 : 380;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      svg.setAttribute('viewBox', from.map((v, i) => Math.round((v + (to[i] - v) * e) * 10) / 10).join(' '));
      _anim = k < 1 ? requestAnimationFrame(step) : null;
    };
    _anim = requestAnimationFrame(step);
    _syncScene();
  }
  function toggleZoom() { _setZoom(_zoom === 'room' ? 'patient' : 'room', false); }

  function _countFound() {
    const c = _cur(); return c ? Object.keys(c.found).length : 0;
  }
  function _renderRecueil() {
    const p = _el('sim-p-recueil'); if (!p || !_cur() || !_curScn()) return;
    if (_cur().nb && _el('sim-nb-main')) return;                    // on ne redessine pas la zone pendant que l'étudiant écrit
    p.innerHTML = _recueilHtml(false);
  }
  function _recueilHtml(ro) {            // ro : lecture seule (après le recueil, pas de bouton « à noter »)
    const c = _cur(), scn = _curScn(); if (!c || !scn) return '';
    if (c.nb) {
      if (ro) return `<h3 class="sim-h">📝 Mon bloc-notes</h3>${c.notes.trim() ? `<div class="sim-nb-ro">${_esc(c.notes)}</div>` : '<div class="sim-fact-none">Ton bloc-notes est vide.</div>'}`;
      return `<h3 class="sim-h">📝 Mon bloc-notes</h3>
        <p class="sim-muted sim-small">Note ici ce que tu apprends : ce que dit ${_male(scn) ? 'le résident' : 'la résidente'}, les mesures que tu relèves, ce que tu observes. Rien n'est rempli à ta place. Tu t'en serviras pour appeler l'infirmière et écrire tes transmissions.</p>
        <textarea id="sim-nb-main" class="sim-nb-ta" rows="14" maxlength="3000" aria-label="Mon bloc-notes" placeholder="Écris ici…" oninput="App.Sim.nbTxt(this.value)">${_esc(c.notes)}</textarea>
        <details class="sim-recap"><summary>💡 Un pense-bête ? (titres seulement)</summary><div class="sim-recap-body"><p class="sim-muted sim-small">${SECTIONS.map(x => _esc(x[1])).join(' · ')}</p></div></details>`;
    }
    const tableFacts = new Set(scn.constTable.map(r => r.fact)); tableFacts.add('d_const_hab');
    const keys = Object.keys(scn.facts);
    const usualKnown = !!c.found.d_const_hab;
    const rows = SECTIONS.map(([sid, sname]) => {
      if (sid === 'constantes') {
        const trs = scn.constTable.map(r => {
          const f = scn.facts[r.fact], got = c.found[r.fact], tk = _toolOfFact(scn, r.fact, c);
          const cell = got ? _esc(f.text) : (!ro && tk && c.pending[tk] ? `<button type="button" class="sim-pend" onclick="App.Sim.reopen('${tk}')">✎ à noter</button>` : '—');
          return `<tr><th>${_esc(r.label)}</th><td class="${got ? 'v' : 'n'}">${cell}</td><td>${usualKnown ? _esc(r.usual) : '<span class="n" title="Lis le dossier de soins">?</span>'}</td><td class="sim-norm">${_esc(r.norm)}</td></tr>`;
        }).join('');
        return `<div class="sim-sec"><div class="sim-sec-h">${_esc(sname)}</div>
          <div class="sim-tablewrap"><table class="sim-const"><thead><tr><th></th><th>Mesuré</th><th>Habituel</th><th>Repère (cours)</th></tr></thead><tbody>${trs}</tbody></table></div></div>`;
      }
      const fs = keys.filter(k => scn.facts[k].section === sid && !tableFacts.has(k));
      const got = fs.filter(k => c.found[k]);
      if (!fs.length) return '';
      const body = got.length
        ? got.map(k => { const f = scn.facts[k];
            return `<div class="sim-fact"><span class="sim-fact-k">${_esc(f.label)}</span><span class="sim-fact-v">${_esc(f.text)}</span><span class="sim-src">${_esc(_gen(KIND_LABEL[f.kind] || '', scn))}</span></div>`; }).join('')
        : '<div class="sim-fact-none">Pas encore renseigné</div>';
      return `<div class="sim-sec"><div class="sim-sec-h">${_esc(sname)}</div>${body}</div>`;
    }).join('');
    return `<h3 class="sim-h">📋 Recueil de données <span class="sim-count">${_countFound()} notée${_countFound() > 1 ? 's' : ''}</span></h3>
      <p class="sim-muted sim-small">${_esc(_gen("Tout ce que tu apprends s'ajoute ici. « Dit par la résidente » = ce qu'elle ressent ; « Mesure » et « Observation » = ce que tu constates toi-même.", scn))}</p>${rows}`;
  }
  function _renderTabs() {
    const tb = _el('sim-tabbar'), c = _cur(); if (!tb || !c) return;
    const t = c.tab || 'dialogue';
    tb.innerHTML = [['dialogue', '💬', 'Dialogue'], ['chambre', '🛏️', 'Chambre'], ['recueil', c.nb ? '📝' : '📋', c.nb ? 'Notes' : 'Recueil']].map(([id, ico, lbl]) =>
      `<button type="button" class="${t === id ? 'on' : ''}" onclick="App.Sim.setTab('${id}')" aria-current="${t === id}"><span>${ico}</span>${lbl}${id === 'recueil' ? (c.nb ? (c.notes.trim() ? ' <span class="sim-badge">✎</span>' : '') : ` <span class="sim-badge">${_countFound()}</span>`) : ''}</button>`).join('');
    const p = _el('sim-play'); if (p) p.setAttribute('data-tab', t);
  }
  function submit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const inp = _el('sim-input'); if (!inp) return false;
    const v = inp.value.trim();
    if (!v) return false;
    inp.value = '';
    say(v);
    try { inp.focus({ preventScroll: true }); } catch (err) {}
    return false;
  }

  // ── Écran : bilan ──
  function _tips(R) {
    const scn = _curScn(), t = [];
    if (R.recueil.pts / R.recueil.max < 0.7) t.push("Recueil : reprends les informations clés que tu n'as pas trouvées (liste plus bas) et la façon de les obtenir.");
    if (R.gestes.pts / R.gestes.max < 0.7) t.push('Gestes : revois ceux marqués ✗ ou ◐ dans la grille (hygiène des mains, présentation, accord, identité).');
    if (R.niveau.pts < 10 || R.actions.pts < 10) t.push(_gen("Décision : l'étudiant alerte vite, sécurise la résidente et ne donne aucun médicament sans l'infirmière.", scn));
    if (R.appel.pts < 12) t.push("Appel : entraîne-toi à dire le SAED à voix haute en moins d'une minute, avec les valeurs chiffrées et ce que tu demandes.");
    if (R.trans.pts < 12) t.push("Transmission : une cible courte, puis des données chiffrées comparées à l'habituel, des actions, un résultat et la suite.");
    return t;
  }
  function _brk(label, pts, max, note) {
    const pc = max ? Math.round(100 * pts / max) : 0;
    return `<div class="sim-brk"><div class="sim-brk-l"><b>${_esc(label)}</b><div class="sim-muted sim-small">${_esc(note)}</div></div>
      <div class="sim-brk-p">${fmt(pts)}<small>/${max}</small></div><div class="sim-brk-bar"><i style="width:${pc}%"></i></div></div>`;
  }
  function _glycBilanHtml(c, scn) {        // sécurité avant la glycémie capillaire (information, hors score si le cas ne note pas ce geste)
    const pr = c.prep && c.prep.glucometre; if (!pr) return '';
    const inGrid = scn.grid.some(g => g.id === 'g_glyc_secu');
    const ok = pr.passed && pr.tries === 0, mid = pr.passed;
    const w = c.waste, wOk = w && w.passed && w.tries === 0, wMid = w && w.passed;
    const wRow = w ? `<div class="sim-row-res ${wOk ? 'ok' : (wMid ? 'late' : 'miss')}"><span class="sim-mark">${wOk ? '✓' : (wMid ? '◐' : '✗')}</span><div><b>${wOk ? 'Déchets bien triés du premier coup.' : (wMid ? 'Déchets triés après une correction.' : 'Tri des déchets à revoir.')}</b>
      <div class="sim-muted sim-small">Autopiqueur → collecteur OPCT · bandelette, gants et compresse souillés → DASRI (poubelle jaune) · emballage propre → ordures ménagères.</div></div></div>` : '';
    return `<h3 class="sim-h">🩸 Glycémie capillaire : ta sécurité</h3><div class="sim-card"><div class="sim-row-res ${ok ? 'ok' : (mid ? 'late' : 'miss')}"><span class="sim-mark">${ok ? '✓' : (mid ? '◐' : '✗')}</span><div>
      <b>${ok ? 'Préparation de sécurité réussie du premier coup.' : (mid ? 'Préparation réussie après une correction.' : 'Préparation à revoir.')}</b>
      <div class="sim-muted sim-small">Mains frictionnées, gants, lecteur et bandelette vérifiés, autopiqueur de sécurité à usage unique, collecteur à portée, doigt préparé ; on ne rebouche jamais une lancette et on pique sur le côté de la pulpe.${inGrid ? '' : ' (Information : ce geste n\'est pas noté dans le score de ce cas.)'}</div></div></div>${wRow}</div>`;
  }
  function _nbBilanHtml(c, scn) {
    if (!c.nb) return '';
    const keys = Object.keys(c.nbExp || {});
    const rows = keys.map(k => { const miss = _nbMissing(c.nbExp[k], c.notes), t = scn.tools[k];
      return `<div class="sim-row-res ${miss.length ? 'miss' : 'ok'}"><span class="sim-mark">${miss.length ? '✗' : '✓'}</span><div><b>${_esc(t.label)}</b>${miss.length ? `<div class="sim-muted sim-small">Valeur absente de ton bloc-notes : ${_esc(miss.join(', '))}</div>` : '<div class="sim-muted sim-small">Valeur retrouvée dans tes notes.</div>'}</div></div>`; }).join('');
    return `<h3 class="sim-h">📝 Ton bloc-notes</h3><div class="sim-card">
      ${c.notes.trim() ? `<div class="sim-nb-ro">${_esc(c.notes)}</div>` : '<div class="sim-fact-none">Ton bloc-notes est vide.</div>'}
      ${rows ? `<div style="margin-top:8px">${rows}</div>` : ''}
      <div class="sim-muted sim-small" style="margin-top:6px">Compare tes notes à la liste des informations clés ci-dessous : qu'as-tu oublié d'écrire ? Le contrôle automatique ne regarde que les valeurs chiffrées des mesures (hors score).</div></div>`;
  }
  function _renderBilan(root) {
    const c = _cur(), scn = _curScn(), R = c.res || null;
    const b = _bilanData();
    const keyRows = b.keys.map(k => {
      const f = scn.facts[k], ok = !!c.found[k];
      return `<div class="sim-row-res ${ok ? 'ok' : 'miss'}"><span class="sim-mark">${ok ? '✓' : '✗'}</span><div>
        <b>${_esc(f.label)}</b>${ok ? ' · ' + _esc(f.text) : ''}
        ${ok ? (f.meaning ? `<div class="sim-muted sim-small">${_esc(f.meaning)}</div>` : '') : `<div class="sim-muted sim-small">Comment le trouver : ${_esc(_howTo(scn, k))}</div>`}
      </div></div>`;
    }).join('');
    const stages = ['entree', 'contact', 'recueil'];
    const gridRows = stages.map(sg => {
      const rows = b.grid.filter(x => x.g.stage === sg);
      return `<h4 class="sim-h3">${_esc(STAGE_GRID[sg])}</h4>` + rows.map(x => {
        const mark = x.state === 'ok' ? '✓' : (x.state === 'late' ? '◐' : (x.state === 'retry' ? '↺' : '✗'));
        const extra = x.note ? `<div class="sim-small sim-warn">${_esc(x.note)}</div>` : '';
        const why = `<div class="sim-muted sim-small">${_esc(x.g.why)}</div><div class="sim-muted sim-small">Repère : ${_esc(x.g.ref)}</div>`;
        return `<div class="sim-row-res ${x.state}"><span class="sim-mark">${mark}</span><div><b>${_esc(x.g.label)}</b>${extra}${x.state === 'ok' ? `<details class="sim-why"><summary>Pourquoi ?</summary>${why}</details>` : why}</div></div>`;
      }).join('');
    }).join('');
    const sources = scn.sources.map(s => `<li>${s.url ? `<a href="${_esc(s.url)}" target="_blank" rel="noopener noreferrer">${_esc(s.label)}</a>` : _esc(s.label)}<div class="sim-muted sim-small">${_esc(s.note)}</div></li>`).join('');
    const comps = scn.competences.map(k => `<li>Compétence ${k.n} : ${_esc(k.label)}</li>`).join('');
    const head = `<div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Sim.toList()">← Menu</button>
        <div class="sim-bar-title">Bilan · ${_esc(scn.title)}</div><div class="sim-bar-time" id="sim-clock" title="Temps actif">${_hms(c.secs)}</div></div>${_stepper()}`;
    const stats = `<p class="sim-muted sim-small sim-stats">${Object.keys(c.entered).length} mesure${Object.keys(c.entered).length > 1 ? 's' : ''} notée${Object.keys(c.entered).length > 1 ? 's' : ''} sur ${_nMeas(scn)} · ${c.errors || 0} erreur${(c.errors || 0) > 1 ? 's' : ''} de saisie · ${c.misplaced || 0} instrument${(c.misplaced || 0) > 1 ? 's' : ''} mal placé${(c.misplaced || 0) > 1 ? 's' : ''}</p>`;
    const tail = `<h3 class="sim-h">Compétences travaillées</h3><div class="sim-card"><ul class="sim-ul">${comps}</ul></div>
      <h3 class="sim-h">Sources</h3>
      <div class="sim-card"><ul class="sim-ul">${sources}</ul>
        <div class="sim-muted sim-small">Scénario fictif. ${_esc(scn.status)}. En cas de différence, ton cours et les protocoles de ton stage priment.</div></div>
      <div class="sim-row sim-enter"><button class="btn btn-ghost" onclick="App.Sim.replay()">🔁 Rejouer</button><button class="btn btn-primary" onclick="App.Sim.closeBilan()">Terminer</button></div>`;

    if (!R) {                     // partie terminée avec une version précédente : seul le recueil était noté
      root.innerHTML = `<div class="sim-wrap">${head}
        <div class="sim-card sim-sum">
          <div class="sim-sum-box"><div class="sim-sum-n">${b.keyFound}<small>/${b.keyTotal}</small></div><div>informations clés trouvées</div></div>
          <div class="sim-sum-box"><div class="sim-sum-n">${b.gFound}<small>/${b.gTotal}</small></div><div>gestes professionnels réussis</div></div>
          <div class="sim-sum-box"><div class="sim-sum-n">${_hms(c.secs)}</div><div>temps actif</div></div>
        </div>${stats}
        <div class="sim-note">ℹ️ Cette partie a été jouée avant l'ajout de la décision, de l'appel SAED, des transmissions et du score. Seul le recueil est noté ici : <b>rejoue</b> pour obtenir le score complet, le niveau et les badges.</div>
        <h3 class="sim-h">Informations clés</h3><div class="sim-card">${keyRows}</div>
        <h3 class="sim-h">🔎 Ce qu'il fallait retenir</h3><div class="sim-card sim-retain">${_esc(scn.alertSummary)}</div>
        <h3 class="sim-h">Tes gestes</h3>
        <div class="sim-card">${gridRows}<div class="sim-muted sim-small" style="margin-top:8px">✓ réussi · ↺ réussi après une correction · ◐ fait trop tard · ✗ non fait</div></div>${tail}</div>`;
      return;
    }

    const lv = _levelOf(R.level.xp), lvName = L => (LEVELS[L - 1] || LEVELS[0]).name;
    const word = R.total >= 90 ? 'Excellent' : R.total >= 75 ? 'Très bien' : R.total >= 60 ? 'Bien' : R.total >= 40 ? 'À consolider' : 'À reprendre';
    const dec = scn.decision, chosen = dec.levels.find(l => l.id === c.dec.level);
    const unsafe = R.unsafe.length ? `<div class="sim-fb danger" role="alert"><b>⚠ Sécurité ${_gen('de la résidente', scn)}${R.capped ? ' : score plafonné à 50/100' : ''}</b><ul class="sim-ul">${R.unsafe.map(u => `<li>${_esc(u)}</li>`).join('')}</ul>
      <p>En situation réelle, ces choix mettent ${_gen('la résidente', scn)} en danger. C'est la règle n° 1 : on ne prend jamais de risque pour elle, même dans un exercice.</p></div>` : '';
    const earned = R.earned.length ? `<h3 class="sim-h">🏅 Badges de cette partie</h3><div class="sim-card"><div class="sim-bdg-grid">${R.earned.map(id => { const bd = BADGES.find(x => x.id === id); return `<div class="sim-bdg on${R.newBadges.indexOf(id) >= 0 ? ' new' : ''}"><span class="sim-bdg-i">${bd.ico}</span><b>${_esc(bd.name)}</b>${R.newBadges.indexOf(id) >= 0 ? '<em class="sim-new">Nouveau</em>' : ''}<span class="sim-small sim-muted">${_esc(bd.desc)}</span></div>`; }).join('')}</div></div>` : '';
    const dsc = scn.discordance;
    const allergyNote = !dsc ? '' : (c.found[dsc.fact] ? (R.allergySaid ? dsc.said : dsc.heard) : dsc.missed);
    const tips = _tips(R);
    root.innerHTML = `<div class="sim-wrap">${head}
      <div class="sim-card sim-result">
        <div class="sim-result-score"><b>${R.total}</b><span>/100</span></div>
        <div class="sim-result-t"><div class="sim-result-w">${word}</div>
          <div class="sim-muted sim-small">+${R.xp.total} XP${R.xp.first ? ' (dont 10 pour une première partie)' : ' (tu gagnes des XP quand tu progresses)'}${(R.xp.bonusEcg != null ? R.xp.bonusEcg : (R.ecg ? R.xp.bonus : 0)) ? ' · ECG +' + (R.xp.bonusEcg != null ? R.xp.bonusEcg : R.xp.bonus) : ''}${R.xp.bonusGazo ? ' · gaz du sang +' + R.xp.bonusGazo : ''}${R.xp.bonusSoins ? ' · gestes de sécurité +' + R.xp.bonusSoins : ''} · temps actif ${_hms(c.secs)}</div>
          <div class="sim-result-lv">Niveau ${lv.L.n} · ${_esc(lv.L.name)}${R.level.after > R.level.before ? ' <em class="sim-new">Niveau gagné</em>' : ''}</div>
          <div class="sim-xpbar"><i style="width:${lv.pct}%"></i></div></div>
      </div>
      ${unsafe}
      <div class="sim-card">
        ${_brk('Recueil de données', R.recueil.pts, 30, R.recueil.found + '/' + R.recueil.total + ' informations clés trouvées')}
        ${_brk('Gestes professionnels', R.gestes.pts, 15, 'hygiène, contact, mesures, observation')}
        ${_brk('Décision : niveau d\'alerte', R.niveau.pts, 10, chosen ? chosen.label : 'non renseigné')}
        ${_brk('Décision : gestes en attendant', R.actions.pts, 15, R.actions.good + '/' + R.actions.goodTotal + ' bons gestes · ' + R.actions.avoid + ' à éviter · ' + R.actions.danger + ' dangereux')}
        ${_brk('Appel à l\'infirmière (SAED)', R.appel.pts, 15, R.appel.tries > 1 ? '2 essais, le meilleur est retenu' : '1 essai')}
        ${_brk('Transmission écrite', R.trans.pts, 15, 'cible, données, actions, résultats')}
        ${R.ecg ? `<p class="sim-muted sim-small">🫀 ECG de la prescription réalisé : ${R.ecg.score}/100 (bonus d'XP, hors score).</p>` : ''}
        ${R.gazo ? `<p class="sim-muted sim-small">🩸 Gaz du sang lu : ${R.gazo.score}/100 (bonus d'XP, hors score ; lecture sommaire, pas un diagnostic).</p>` : ''}
        ${R.capped ? `<p class="sim-warn sim-small">Total avant plafond : ${fmt(R.raw)}/100.</p>` : ''}
      </div>
      ${_soinsBilanHtml(c, scn, R)}
      ${_glycBilanHtml(c, scn)}
      ${earned}${stats}
      ${tips.length ? `<h3 class="sim-h">Pour progresser</h3><div class="sim-card"><ul class="sim-ul">${tips.map(t => `<li>${_esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${_nbBilanHtml(c, scn)}
      <h3 class="sim-h">Informations clés</h3>
      <div class="sim-card">${keyRows}</div>
      <h3 class="sim-h">🔎 Ce qu'il fallait retenir</h3>
      <div class="sim-card sim-retain">${_esc(scn.alertSummary)}</div>
      <h3 class="sim-h">Ta décision</h3>
      <div class="sim-card">${chosen ? `<div class="sim-fb ${chosen.verdict}"><b>${_esc(chosen.label)}</b><p>${_esc(chosen.feedback)}</p></div>` : ''}
        <details class="sim-why"><summary>Voir le détail de tes choix en attendant ${_esc(scn.call.who)}</summary><div class="sim-revs">${_actionsReview(c, scn)}</div></details></div>
      <h3 class="sim-h">Ton appel à ${_esc(scn.call.who)}</h3>
      <div class="sim-card">${_corrHtml(_grade(scn.call.sections, c.saed.txt))}
        ${allergyNote ? `<p class="sim-small ${R.allergySaid ? '' : 'sim-warn'}">${_esc(allergyNote)}</p>` : ''}
        <details class="sim-why"><summary>Voir un exemple de message SAED</summary><div class="sim-model">${['S', 'A', 'E', 'D'].map(k => `<p><b>${k}</b> · ${_esc(scn.call.model[k])}</p>`).join('')}</div></details>
        ${c.ai && c.ai.saed && c.ai.saed.state === 'ok' ? _aiBlock('saed', c) : ''}</div>
      <h3 class="sim-h">Ta transmission écrite</h3>
      <div class="sim-card">${_corrHtml(_grade(scn.written.fields, c.wr.txt))}
        <details class="sim-why"><summary>Voir un exemple de transmission ciblée</summary><div class="sim-model">${scn.written.fields.map(f => `<p><b>${_esc(f.label)}</b> · ${_esc(scn.written.model[f.id])}</p>`).join('')}</div></details>
        ${c.ai && c.ai.transmission && c.ai.transmission.state === 'ok' ? _aiBlock('transmission', c) : ''}</div>
      <h3 class="sim-h">Tes gestes</h3>
      <div class="sim-card">${gridRows}<div class="sim-muted sim-small" style="margin-top:8px">✓ réussi · ↺ réussi après une correction · ◐ fait trop tard · ✗ non fait</div></div>
      ${tail}</div>`;
  }

  // ── Chrono d'activité (même principe que l'onglet Anglais) ────
  // Le temps passé à jouer s'ajoute à « Temps » du jour. Page cachée, autre onglet ou 1 min sans rien
  // toucher = pause. Jamais plus de 5 s ajoutées par tic. Aucune carte comptée, pas d'effet sur la série.
  const ACTIVE_IDLE_MS = 60 * 1000;
  let _tickTimer = null, _lastAct = 0, _lastTick = 0, _acc = 0, _actBound = false;
  function _markActivity() { _lastAct = Date.now(); }
  function _shown(id) { const e = _el(id); return !!e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'; }
  function _simVisible() {
    const c = _cur();
    return !!c && _shown('games-view') && _shown('sim-root') && !_el('sim-ecg');   // l'atelier ECG compte son propre temps
  }
  function _refreshToday() { try { App.Render.todayStats(); } catch (e) {} }
  function _startTimer() {
    if (!_actBound) {
      ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'].forEach(ev =>
        document.addEventListener(ev, _markActivity, { passive: true, capture: true }));
      document.addEventListener('visibilitychange', () => { _lastTick = Date.now(); _tick(); });
      window.addEventListener('pagehide', () => { try { App.Store.saveLog(); _save(); } catch (e) {} });
      _actBound = true;
    }
    _markActivity();
    _lastTick = Date.now();
    if (!_tickTimer) _tickTimer = setInterval(_tick, 2000);
  }
  function _tick() {
    const now = Date.now();
    const dt = Math.min(5, Math.max(0, (now - _lastTick) / 1000));
    _lastTick = now;
    if (!_simVisible()) return;
    if (document.hidden || now - _lastAct > ACTIVE_IDLE_MS) return;
    _acc += dt;
    const whole = Math.floor(_acc);
    if (whole > 0) {
      _acc -= whole;
      const c = _cur();
      c.secs = (c.secs || 0) + whole;
      try { App.Store.logSim({ seconds: whole }); _refreshToday(); } catch (e) {}
      const clk = _el('sim-clock'); if (clk) clk.textContent = _hms(c.secs);
      if (c.secs % 10 === 0) _save();
    }
  }

  _load();

  return {
    open, close, start, resume, toList, discard, setTab, say, submit, askMenu, toggleMenu, toggleAct, act, thToggle,
    pickTool, dropTool, hot, sheetDo, sheetClose, gCuffMove, gCuffRot, gCuffPalp, gCuffOk, cuffDown, cuffMove, cuffUp, gStartCount, gTap, gRecount, gInflate, gSubmit, gPrepToggle, gPrepSubmit, gWasteSet, gWasteSubmit, gNbDone, nbTxt, setNb, reopen, toggleZoom, useObject, sha, knock, readDossier, enter, askFinish, cancelFinish, finish, closeBilan, replay,
    decLevel, decLevelOk, decPick, decActionsOk, decNext, txt, sendSaed, saedRetry, saedDone, rxEcg, rxSkip, rxGazo, rxGazoSkip, rxNext, unkCopy, unkClear, wrSubmit, wrDone, aiReview,
    parse, parseAct, _t: { norm: _norm, prep: _prep, suggest: _suggest, unk: _unkRead, state: () => st, tick: _tick, grade: (kind, texts) => { const scn = _curScn() || _scenarios()[0]; return _grade(kind === 'saed' ? scn.call.sections : scn.written.fields, texts); }, results: () => _results(), levelOf: _levelOf, cuff: () => (_G && _G.cuff) || null }
  };
})();
