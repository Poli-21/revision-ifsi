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
  function _gen(txt, scn) {
    let t = String(txt == null ? '' : txt);
    if (!_male(scn)) return t;
    _MASC.forEach(([a, b]) => { t = t.split(a).join(b); });
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
    c.ai = c.ai || {};
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
  // Renvoie les identifiants d'intentions reconnues (3 au maximum), dans l'ordre où elles apparaissent.
  function parse(text, scnArg) {
    const n = _norm(text);
    if (!n) return [];
    const sc = scnArg === undefined ? _curScn() : scnArg;
    const list = (window.App.SimIntents && window.App.SimIntents.LIST) || [];
    let hits = [];
    list.forEach(it => {
      if (it.extra && !(sc && sc.answers && sc.answers[it.id])) return;     // question propre à certains scénarios
      let score = 0, pos = 1e9;
      const probe = (re, pts) => {
        const m = re.exec(n);
        if (m) { score += pts; pos = Math.min(pos, m.index); }
      };
      (it.strong || []).forEach(re => probe(re, 2));
      (it.weak || []).forEach(re => probe(re, 1));
      if (score >= (it.min || 2)) hits.push({ it, score, pos });
    });
    if (hits.some(h => !h.it.solo)) hits = hits.filter(h => !h.it.solo);   // « Bonjour » seul seulement
    const swallowed = new Set(); hits.forEach(h => (h.it.over || []).forEach(o => swallowed.add(o)));
    if (swallowed.size) hits = hits.filter(h => !swallowed.has(h.it.id));        // une question en « avale » d'autres
    hits.sort((a, b) => b.score - a.score);
    hits = hits.slice(0, 3).sort((a, b) => a.pos - b.pos);
    return hits.map(h => h.it.id);
  }
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
    _renderLog(); _renderMenu(); _renderChambre(); _renderRecueil(); _renderTabs();
  }

  function say(text) {
    const c = _cur(), scn = _curScn();
    if (!c || !scn || c.stage !== 'chambre') return;
    text = String(text || '').trim().slice(0, 300);
    if (!text) return;
    _handle(parse(text), text);
  }
  function askMenu(id) {
    const it = _intent(id); if (!it) return;
    _handle([id], _gen(it.ask, _curScn()));
  }
  function _handle(ids, studentText) {
    const c = _cur(), scn = _curScn();
    _log('me', studentText);
    c.last = null;
    if (!ids.length) {
      c.misses = (c.misses || 0) + 1;
      _log('pat', scn.notUnderstood);
      if (c.misses >= 2) _log('sys', '💡 Astuce : ouvre « 📋 Questions possibles » pour voir ce que tu peux demander. Pose une question à la fois, avec des mots simples.');
      c.actions++;
      _afterAction();
      return;
    }
    c.misses = 0;
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

  // ── Instruments : c'est l'étudiant qui fait le geste ──────────
  // Choisir l'instrument → le poser au bon endroit sur la patiente → attendre ou compter → lire l'écran →
  // NOTER lui-même la valeur dans le recueil. Rien n'est ajouté au recueil tant qu'il ne l'a pas noté.
  function _toolOfFact(scn, fid) { return Object.keys(scn.tools).find(k => scn.tools[k].fact === fid) || null; }
  function _gClear() { _timers.forEach(t => { clearInterval(t); clearTimeout(t); }); _timers = []; _G = null; _hint = ''; }
  function _gReset() { _gClear(); _tool = null; _zoom = 'room'; _autoZoom = false; if (_anim) { cancelAnimationFrame(_anim); _anim = null; } }

  function pickTool(key) {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre' || !scn.tools[key]) return;
    if (_tool === key) return dropTool();
    _gClear(); _tool = key;
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
    if (scn.objects[id]) return useObject(id);
  }
  function _applyTool(zone) {
    const c = _cur(), scn = _curScn(), t = scn.tools[_tool];
    if (_G) return;                                                  // un geste est déjà en cours
    const ok = t.zone === '*' ? (zone === 'patiente' || zone.indexOf('zone-') === 0) : zone === t.zone;
    if (!ok) { c.misplaced++; _hint = t.where; _save(); _renderGesture(); return; }
    if (c.firstCare === null) c.firstCare = c.actions;
    c.actions++;
    _hint = '';
    _log('narr', t.start); c.last = { text: t.start, facts: [] };
    _G = { tool: _tool, kind: t.kind, phase: 'start', errs: 0, placeErrs: 0, n: 0 };
    if (t.kind === 'instant' || t.kind === 'wait') _gMeasure(t.seconds);
    else if (t.kind === 'cuff') _G.phase = 'place';
    else if (t.kind === 'count') _G.phase = 'ready';
    else if (t.kind === 'scale') { _G.phase = 'read'; c.pending[_tool] = true; }
    _save(); _renderLog(); _renderChambre(); _renderRecueil(); _renderGesture(t.kind === 'scale');
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
    _save(); _renderRecueil(); _renderToolbar(); _renderGesture(true);
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
  // pose du brassard
  function gPlace(id) {
    const c = _cur(); if (!_G || _G.phase !== 'place') return;
    const t = _curScn().tools[_G.tool], p = t.cuff.find(x => x.id === id); if (!p) return;
    if (!p.ok) { _G.placeErrs++; _hint = p.hint; _renderGesture(); return; }
    _hint = ''; _markDone('g_brassard', { retry: _G.placeErrs > 0 });
    _G.phase = 'cuffed'; _save(); _renderGesture();
  }
  function gInflate() {
    if (!_G || _G.phase !== 'cuffed') return;
    _G.sub = 'inflate'; _gMeasure(_curScn().tools[_G.tool].seconds); _renderGesture();
  }
  // saisie de la valeur lue
  function _num(v) { const x = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^\d.\-]/g, '')); return isNaN(x) ? null : x; }
  function gSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const c = _cur(), scn = _curScn(); if (!c || !scn || !_G || _G.phase !== 'read') return false;
    const key = _G.tool, t = scn.tools[key], inp = t.input;
    const a = _num((_el('sim-in-1') || {}).value), b = _num((_el('sim-in-2') || {}).value);
    let ok = false, msg = '', count = true;
    if (a === null || (inp.type === 'bp' && b === null)) { msg = 'Écris la valeur lue, en chiffres.'; count = false; }
    else if (inp.type === 'bp') ok = Math.abs(a - inp.sys) <= inp.tol && Math.abs(b - inp.dia) <= inp.tol;
    else if (t.kind === 'count') {
      const n = (c.pending[key] && c.pending[key].n != null) ? c.pending[key].n : _G.n;
      ok = a === n * t.factor;
      if (!ok) msg = 'Vérifie ton calcul : ' + n + ' × ' + t.factor + ' = ?';
    } else ok = Math.abs(a - inp.value) <= (inp.tol || 0);
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
    delete c.pending[key]; c.entered[t.fact] = true; _find(t.fact);
    _log('narr', 'Tu notes dans le recueil : ' + t.noted + '.');
    c.last = { text: '✓ Noté dans le recueil : ' + t.noted, facts: [t.fact] };
    _gClear(); _tool = null;
    if (_autoZoom) _setZoom('room', false);
    _renderToolbar(); _renderGesture(); _syncScene();
    _afterAction();
  }
  function reopen(key) {                 // revenir sur une valeur lue mais pas encore notée
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre' || !c.pending[key]) return;
    const t = scn.tools[key];
    _gClear(); _tool = key;
    _G = { tool: key, kind: t.kind, phase: 'read', errs: 0, placeErrs: 0, n: (c.pending[key] && c.pending[key].n) || 0 };
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
    return `<details class="sim-recap"><summary>📋 Mon recueil de données (à relire avant d'appeler)</summary><div class="sim-recap-body">${_recueilHtml(true)}</div></details>`;
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
      <div class="sim-note"><b>Méthode.</b> ${_esc(call.method)}</div>${_recueilRecap(c, scn)}${logHtml}${form}${after}</div>`;
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
        <details class="sim-recap"><summary>📋 Mon recueil de données (à relire)</summary><div class="sim-recap-body">${_recueilHtml(true)}</div></details>
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
    const raw = recueil.pts + gestes.pts + niveau.pts + actions.pts + appel.pts + trans.pts;
    const capped = unsafe.length > 0 && raw > 50;
    const total = Math.round(unsafe.length ? Math.min(raw, 50) : raw);
    return { recueil, gestes, niveau, actions, appel, trans, unsafe, raw: Math.round(raw * 10) / 10, capped, total,
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
    const bonus = bonusEcg + bonusGazo;
    R.xp = { base, bonus, bonusEcg, bonusGazo, total: base + bonus, first: R.prevBest == null };
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
                   actions: 0, firstCare: null, secs: 0, dossierOpen: false, misses: 0, last: null, saved: false };
    _fix(st.current);
    _gReset();
    _confirmFinish = false; _menuOpen = false;
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
      ${resumeHtml}
      <h3 class="sim-h">Scénarios</h3>
      ${cards}
      <h3 class="sim-h">Ateliers techniques</h3>
      ${window.App.SimECG ? window.App.SimECG.card() : ''}
      ${hist}
      <p class="sim-muted sim-small sim-disclaimer">Outil d'entraînement. Il ne remplace ni tes cours ni les protocoles de ton lieu de stage. Les valeurs et réponses sont à valider avec ton formateur.</p>
    </div>`;
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
          <div class="sim-pt"><span class="sim-avatar" aria-hidden="true">${scn.patient.avatar || '👵'}</span><div><b>${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}</b><div class="sim-muted sim-small">${_male(scn) ? 'Résident' : 'Résidente'} · chambre ${_esc(scn.patient.chambre)}</div></div></div>
          <div class="sim-log" id="sim-log" role="log" aria-live="polite"></div>
          <form class="sim-form" id="sim-form" onsubmit="return App.Sim.submit(event)">
            <input id="sim-input" type="text" autocomplete="off" enterkeyhint="send" maxlength="300" placeholder="Écris ce que tu dis à ${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}…" aria-label="Ta phrase">
            <button class="btn btn-primary" type="submit">Envoyer</button>
          </form>
          <button class="sim-menu-toggle" type="button" id="sim-menu-btn" onclick="App.Sim.toggleMenu()">📋 Questions possibles</button>
          <div class="sim-menu" id="sim-menu"></div>
        </section>
        <section class="sim-panel sim-p-chambre" id="sim-p-chambre" aria-label="Chambre">
          <div class="sim-scene-bar"><h3 class="sim-h">🛏️ Dans la chambre</h3>
            <button type="button" class="btn btn-ghost btn-sm" id="sim-zoom" onclick="App.Sim.toggleZoom()">🔍 Zoom sur ${_male(scn) ? 'le patient' : 'la patiente'}</button></div>
          <div class="sim-scene" id="sim-scene" data-tool="">${_sceneSvg(scn)}</div>
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
    _renderLog(); _renderMenu(); _renderChambre(); _renderRecueil(); _renderTabs(); _renderGesture();
    setTimeout(_scrollLog, 0);
  }

  function _sceneSvg(scn) {
    const o = scn.scene || {};
    return App.SimScene.svg(Object.assign({}, o, { patient: Object.assign({ eyes: 'closed', pale: true }, o.patient || {}) }));
  }
  function _scrollLog() { const l = _el('sim-log'); if (l) l.scrollTop = l.scrollHeight; }
  function _renderLog() {
    const l = _el('sim-log'), c = _cur(); if (!l || !c) return;
    l.innerHTML = c.log.map(m => `<div class="sim-msg sim-${_esc(m.who)}">${_esc(m.text)}</div>`).join('');
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
    }).join('') + '<div class="sim-muted sim-small sim-menu-tip">Tu peux aussi taper ta propre phrase dans la zone de texte.</div>';
  }
  function thToggle(id, open) { if (open) _openThemes[id] = true; else delete _openThemes[id]; }
  function toggleMenu() { _menuOpen = !_menuOpen; _renderMenu(); }

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
      const t = scn.tools[k], done = !!c.found[t.fact], pend = !!c.pending[k] && !done, held = _tool === k;
      return `<button type="button" class="sim-tool ${held ? 'held' : ''} ${done ? 'done' : ''}" aria-pressed="${held}" onclick="App.Sim.pickTool('${k}')">
        <span class="sim-tool-ico">${t.icon}</span><span class="sim-tool-lbl">${_esc(t.label)}</span>${done ? '<span class="sim-act-ok">✓</span>' : (pend ? '<span class="sim-pend-dot" title="Valeur à noter">✎</span>' : '')}</button>`;
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
  function _scale(t) {
    let cells = '';
    for (let i = 0; i <= 10; i++) {
      const face = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😟', '😣', '😖', '😭'][i];
      cells += `<div class="sim-sc ${i === t.scale ? 'on' : ''}" style="--h:${Math.round(125 - i * 12.5)}"><span class="sim-sc-f">${face}</span><b>${i}</b>${i === t.scale ? '<span class="sim-sc-hand" aria-hidden="true">👆</span>' : ''}</div>`;
    }
    return `<div class="sim-scale" role="img" aria-label="Échelle de douleur de 0 à 10 : ${_gen('la résidente', _curScn())} montre ${t.scale}">${cells}</div><div class="sim-quote">${_esc(t.patientSays)}</div>`;
  }
  function _arm(t, placed) {
    const band = { epaule: [14, 36], bon: [84, 108], coude: [112, 138] };
    const bands = t.cuff.map(p => {
      const [y0, y1] = band[p.id];
      return `<g class="sim-band ${placed === p.id ? 'on' : ''}" onclick="App.Sim.gPlace('${p.id}')"><rect x="36" y="${y0}" width="78" height="${y1 - y0}" rx="8"/></g>`;
    }).join('');
    return `<svg class="sim-arm" viewBox="0 0 150 215" role="img" aria-label="Schéma du bras">
      <path d="M48 8 Q75 -2 102 8 L106 112 Q75 132 44 112Z" fill="#f4cba9"/><path d="M46 112 Q75 134 104 112 L98 205 Q75 214 52 205Z" fill="#efc09b"/>
      <path d="M46 120 Q75 140 104 120" fill="none" stroke="#d9a07a" stroke-width="2.5" stroke-linecap="round"/>
      <text x="75" y="166" text-anchor="middle" font-size="9" fill="#a4714e">pli du coude ↑</text>${bands}</svg>`;
  }
  function _gesture() {                 // contenu du panneau « geste »
    const c = _cur(), scn = _curScn(); if (!c || !scn) return '';
    const key = _G ? _G.tool : _tool; const t = scn.tools[key];
    const head = `<div class="sim-g-head"><span class="sim-g-ico">${t.icon}</span><div><b>${_G ? _esc(t.label) : 'Dans ta main : ' + _esc(t.label)}</b>${_G ? '' : `<div class="sim-muted sim-small">${_esc(_gen("Touche sur la patiente l'endroit où tu l'utilises.", scn))}</div>`}</div><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sim.dropTool()">${_G && _G.phase === 'running' ? 'Annuler' : 'Reposer'}</button></div>`;
    const warn = _hint ? `<div class="sim-g-warn" role="alert">${_esc(_hint)}</div>` : '';
    if (!_G) return head + warn;
    const g = _G;
    if (g.phase === 'measuring') {
      const txt = g.sub === 'inflate' ? 'Le brassard se gonfle… Reste immobile et ne parle pas.' : 'Mesure en cours… patiente quelques secondes.';
      return head + `<div class="sim-g-note">${txt}</div><div class="sim-prog"><i id="sim-g-bar" style="width:0%"></i></div>`;
    }
    if (g.phase === 'place') {
      return head + `<div class="sim-g-note">Où places-tu le brassard ? Touche le bon endroit sur le bras.</div>${warn}
        <div class="sim-cuff">${_arm(t, null)}<div class="sim-cuff-list">${t.cuff.map(p => `<button type="button" class="sim-q" onclick="App.Sim.gPlace('${p.id}')">${_esc(p.label)}</button>`).join('')}</div></div>`;
    }
    if (g.phase === 'cuffed') {
      return head + `<div class="sim-g-note">Le brassard est bien en place. Quand tu es prêt, lance la mesure.</div><div class="sim-row"><button type="button" class="btn btn-primary" onclick="App.Sim.gInflate()">▶ Lancer la mesure</button></div>`;
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
    const inp = t.input;
    let disp;
    if (t.kind === 'count') disp = `<div class="sim-g-note">Tu as compté <b>${g.n}</b> ${t.tap === 'Battement' ? 'battements' : 'respirations'} en ${t.seconds} secondes.</div>`;
    else if (t.kind === 'scale') disp = _scale(t);
    else disp = _lcd(t.display);
    const inputs = inp.type === 'bp'
      ? '<input id="sim-in-1" type="text" inputmode="numeric" autocomplete="off" aria-label="Pression systolique" placeholder="0"><span class="sim-slash">/</span><input id="sim-in-2" type="text" inputmode="numeric" autocomplete="off" aria-label="Pression diastolique" placeholder="0">'
      : `<input id="sim-in-1" type="text" inputmode="decimal" autocomplete="off" aria-label="${_esc(inp.label)}" placeholder="0">`;
    const lbl = t.kind === 'count' ? `Calcule la fréquence par minute (${g.n} × ${t.factor})` : `${_esc(inp.label)} : note la valeur lue`;
    return head + `<form class="sim-readform" onsubmit="return App.Sim.gSubmit(event)">${disp}${t.display && t.display.note ? `<p class="sim-muted sim-small">${_esc(t.display.note)}</p>` : ''}${warn}
      <label class="sim-readlbl" for="sim-in-1">${lbl}</label>
      <div class="sim-readrow">${inputs}<span class="sim-unit">${_esc(inp.unit)}</span><button type="submit" class="btn btn-primary">✎ Noter dans le recueil</button></div></form>`;
  }
  function _renderGesture(focus) {
    const box = _el('sim-gesture'); if (!box) return;
    const on = !!(_tool || _G);
    box.classList.toggle('on', on);
    box.innerHTML = on ? _gesture() : '';
    if (focus) { const i = _el('sim-in-1'); if (i) { try { i.focus({ preventScroll: false }); } catch (e) { i.focus(); } } }
  }
  // Dessin : marques « déjà regardé », instrument en main, zones de la patiente
  function _syncScene() {
    const sc = _el('sim-scene'), c = _cur(), scn = _curScn(); if (!sc || !c || !scn) return;
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
    p.innerHTML = _recueilHtml(false);
  }
  function _recueilHtml(ro) {            // ro : lecture seule (après le recueil, pas de bouton « à noter »)
    const c = _cur(), scn = _curScn(); if (!c || !scn) return '';
    const tableFacts = new Set(scn.constTable.map(r => r.fact)); tableFacts.add('d_const_hab');
    const keys = Object.keys(scn.facts);
    const usualKnown = !!c.found.d_const_hab;
    const rows = SECTIONS.map(([sid, sname]) => {
      if (sid === 'constantes') {
        const trs = scn.constTable.map(r => {
          const f = scn.facts[r.fact], got = c.found[r.fact], tk = _toolOfFact(scn, r.fact);
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
    tb.innerHTML = [['dialogue', '💬', 'Dialogue'], ['chambre', '🛏️', 'Chambre'], ['recueil', '📋', 'Recueil']].map(([id, ico, lbl]) =>
      `<button type="button" class="${t === id ? 'on' : ''}" onclick="App.Sim.setTab('${id}')" aria-current="${t === id}"><span>${ico}</span>${lbl}${id === 'recueil' ? ` <span class="sim-badge">${_countFound()}</span>` : ''}</button>`).join('');
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
    const stats = `<p class="sim-muted sim-small sim-stats">${Object.keys(c.entered).length} mesure${Object.keys(c.entered).length > 1 ? 's' : ''} notée${Object.keys(c.entered).length > 1 ? 's' : ''} sur ${scn.toolOrder.length} · ${c.errors || 0} erreur${(c.errors || 0) > 1 ? 's' : ''} de saisie · ${c.misplaced || 0} instrument${(c.misplaced || 0) > 1 ? 's' : ''} mal placé${(c.misplaced || 0) > 1 ? 's' : ''}</p>`;
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
    const unsafe = R.unsafe.length ? `<div class="sim-fb danger" role="alert"><b>⚠ Sécurité ${_male(scn) ? 'du résident' : 'de la résidente'}${R.capped ? ' : score plafonné à 50/100' : ''}</b><ul class="sim-ul">${R.unsafe.map(u => `<li>${_esc(u)}</li>`).join('')}</ul>
      <p>En situation réelle, ces choix mettent ${_male(scn) ? 'le résident' : 'la résidente'} en danger. C'est la règle n° 1 : on ne prend jamais de risque pour elle, même dans un exercice.</p></div>` : '';
    const earned = R.earned.length ? `<h3 class="sim-h">🏅 Badges de cette partie</h3><div class="sim-card"><div class="sim-bdg-grid">${R.earned.map(id => { const bd = BADGES.find(x => x.id === id); return `<div class="sim-bdg on${R.newBadges.indexOf(id) >= 0 ? ' new' : ''}"><span class="sim-bdg-i">${bd.ico}</span><b>${_esc(bd.name)}</b>${R.newBadges.indexOf(id) >= 0 ? '<em class="sim-new">Nouveau</em>' : ''}<span class="sim-small sim-muted">${_esc(bd.desc)}</span></div>`; }).join('')}</div></div>` : '';
    const dsc = scn.discordance;
    const allergyNote = !dsc ? '' : (c.found[dsc.fact] ? (R.allergySaid ? dsc.said : dsc.heard) : dsc.missed);
    const tips = _tips(R);
    root.innerHTML = `<div class="sim-wrap">${head}
      <div class="sim-card sim-result">
        <div class="sim-result-score"><b>${R.total}</b><span>/100</span></div>
        <div class="sim-result-t"><div class="sim-result-w">${word}</div>
          <div class="sim-muted sim-small">+${R.xp.total} XP${R.xp.first ? ' (dont 10 pour une première partie)' : ' (tu gagnes des XP quand tu progresses)'}${(R.xp.bonusEcg != null ? R.xp.bonusEcg : (R.ecg ? R.xp.bonus : 0)) ? ' · ECG +' + (R.xp.bonusEcg != null ? R.xp.bonusEcg : R.xp.bonus) : ''}${R.xp.bonusGazo ? ' · gaz du sang +' + R.xp.bonusGazo : ''} · temps actif ${_hms(c.secs)}</div>
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
      ${earned}${stats}
      ${tips.length ? `<h3 class="sim-h">Pour progresser</h3><div class="sim-card"><ul class="sim-ul">${tips.map(t => `<li>${_esc(t)}</li>`).join('')}</ul></div>` : ''}
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
    open, close, start, resume, toList, discard, setTab, say, submit, askMenu, toggleMenu, thToggle,
    pickTool, dropTool, hot, gStartCount, gTap, gRecount, gPlace, gInflate, gSubmit, reopen, toggleZoom, useObject, sha, knock, readDossier, enter, askFinish, cancelFinish, finish, closeBilan, replay,
    decLevel, decLevelOk, decPick, decActionsOk, decNext, txt, sendSaed, saedRetry, saedDone, rxEcg, rxSkip, rxGazo, rxGazoSkip, rxNext, wrSubmit, wrDone, aiReview,
    parse, _t: { norm: _norm, state: () => st, tick: _tick, grade: (kind, texts) => { const scn = _curScn() || _scenarios()[0]; return _grade(kind === 'saed' ? scn.call.sections : scn.written.fields, texts); }, results: () => _results(), levelOf: _levelOf }
  };
})();
