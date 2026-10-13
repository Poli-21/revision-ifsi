// core/simulation.js — Jeux · Simulation clinique (étape 1 : moteur + scénario EHPAD en version texte)
// Tout fonctionne HORS LIGNE : la reconnaissance des phrases et les réponses du patient viennent des
// fichiers data/sim_intents.js et data/sim_ehpad.js. Aucune IA, aucun envoi de données ici.
// Sauvegarde automatique dans localStorage (clé ifsi_sim_v1). Patients fictifs.
'use strict';
window.App = window.App || {};

App.Sim = (() => {
  const KEY = 'ifsi_sim_v1';
  const MAX_HISTORY = 30;
  const MAX_LOG = 400;

  let st = { v: 1, current: null, history: [] };
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
    { id: 'decision', label: 'Décision', soon: true },
    { id: 'transmissions', label: 'Transmissions', soon: true },
    { id: 'bilan', label: 'Bilan' }
  ];
  const SECTIONS = [
    ['identite', 'Identité'], ['motif', "Motif d'entrée"], ['antecedents', 'Antécédents'], ['allergies', 'Allergies'],
    ['traitements', 'Traitements'], ['autonomie', 'Autonomie'], ['psychosocial', 'Moral, entourage, repères'],
    ['histoire', 'Histoire récente'], ['symptomes', 'Symptômes'], ['douleur', 'Douleur'], ['constantes', 'Constantes'],
    ['observations', 'Observations'], ['risques', 'Risques dans la chambre']
  ];
  const KIND_LABEL = { dossier: 'Dossier', chercher: 'Dit par la résidente', mesurer: 'Mesure', deduire: 'Observation' };
  const STAGE_GRID = { entree: "Avant d'entrer", contact: 'Premier contact', recueil: 'Recueil de données' };

  // ── Sauvegarde ────────────────────────────────────────────────
  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) st = { v: 1, current: r.current || null, history: Array.isArray(r.history) ? r.history : [] };
    } catch (e) {}
    if (st.current && !_scn(st.current.scenarioId)) st.current = null;
    _fix(st.current);
  }
  function _fix(c) {                 // parties enregistrées avec une version précédente : on complète les champs manquants
    if (!c) return;
    c.log = c.log || []; c.found = c.found || {}; c.done = c.done || {}; c.asked = c.asked || {}; c.seenObj = c.seenObj || {};
    c.pending = c.pending || {}; c.entered = c.entered || {}; c.errors = c.errors || 0; c.misplaced = c.misplaced || 0;
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
  function parse(text) {
    const n = _norm(text);
    if (!n) return [];
    const list = (window.App.SimIntents && window.App.SimIntents.LIST) || [];
    let hits = [];
    list.forEach(it => {
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

  function _afterAction() {
    _checkAuto();
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
    _handle([id], it.ask);
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
      const a = scn.answers[id];
      const it = _intent(id) || {};
      const again = (c.asked[id] || 0) > 0 && !it.contact;
      c.asked[id] = (c.asked[id] || 0) + 1;
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
  function finish() {
    const c = _cur(), scn = _curScn(); if (!c || !scn || c.stage !== 'chambre') return;
    _confirmFinish = false;
    _gReset();
    c.stage = 'bilan';
    if (!c.saved) {
      c.saved = true;
      const b = _bilanData();
      st.history.unshift({ scenarioId: scn.id, date: new Date().toISOString(), keyFound: b.keyFound, keyTotal: b.keyTotal,
                           gFound: b.gFound, gTotal: b.gTotal, secs: Math.round(c.secs || 0) });
      if (st.history.length > MAX_HISTORY) st.history.length = MAX_HISTORY;
    }
    _save(); render();
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
      resumeHtml = `<div class="sim-card sim-resume">
        <div><b>${bil ? 'Dernière partie terminée' : 'Partie en cours'}</b> · ${_esc(scn.title)}<br>
        <span class="sim-muted">${bil ? 'Tu peux revoir ton bilan.' : 'Ta progression est sauvegardée sur cet appareil.'}</span></div>
        <div class="sim-row"><button class="btn btn-primary" onclick="App.Sim.resume()">${bil ? 'Voir le bilan' : 'Reprendre'}</button>
        <button class="btn btn-ghost" onclick="App.Sim.discard()">Abandonner</button></div>
      </div>`;
    }
    const cards = _scenarios().map(s => `<div class="sim-card sim-scn">
        <div class="sim-scn-head"><span class="sim-scn-ico">🏠</span><div>
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
      return `<div class="sim-hist-row"><span>${_esc(ds)}</span><span>${_esc(s ? s.title : h.scenarioId)}</span><span>${h.keyFound}/${h.keyTotal} infos clés · ${h.gFound}/${h.gTotal} gestes</span></div>`;
    }).join('') + '</div></div>' : '';
    root.innerHTML = `<div class="sim-wrap">
      <div class="sim-top"><button class="btn btn-ghost btn-sm" onclick="App.Sim.close()">← Entraînement</button></div>
      <h2 class="sim-title">🩺 Simulation clinique</h2>
      <p class="sim-lead">Entraîne-toi à entrer chez un résident, faire son recueil de données, repérer ce qui doit alerter, puis transmettre l'essentiel. Les patients sont fictifs : aucune donnée réelle.</p>
      <div class="sim-note">✅ <b>Fonctionne hors ligne</b> : les questions que tu tapes sont comprises directement par l'application, sans internet. <br>
      🛠️ <b>Étape 1 sur 6</b> : cette version couvre la préparation et le recueil de données. La décision, l'appel de l'infirmier référent, les transmissions corrigées et la progression (niveaux, badges) arrivent ensuite.</div>
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

  // ── Écran : préparation (couloir) ──
  function _dossierHtml(scn, c) {
    const order = ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_const_hab'];
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
      <h3 class="sim-h">Devant la chambre 12</h3>
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
          <div class="sim-pt"><span class="sim-avatar" aria-hidden="true">👵</span><div><b>${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}</b><div class="sim-muted sim-small">Résidente · chambre ${scn.patient.chambre}</div></div></div>
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
            <button type="button" class="btn btn-ghost btn-sm" id="sim-zoom" onclick="App.Sim.toggleZoom()">🔍 Zoom sur la patiente</button></div>
          <div class="sim-scene" id="sim-scene" data-tool="">${App.SimScene.svg({ patient: { eyes: 'closed', pale: true } })}</div>
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
    const I = window.App.SimIntents;
    m.innerHTML = I.THEMES.map(t => {
      const items = I.LIST.filter(i => i.theme === t.id);
      return `<details data-th="${_esc(t.id)}" ${_openThemes[t.id] ? 'open' : ''} ontoggle="App.Sim.thToggle('${_esc(t.id)}', this.open)">
        <summary>${_esc(t.label)}</summary>
        ${items.map(i => `<button type="button" class="sim-q ${c.asked[i.id] ? 'done' : ''}" onclick="App.Sim.askMenu('${_esc(i.id)}')">${c.asked[i.id] ? '✓ ' : ''}${_esc(i.menu)}</button>`).join('')}
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
      ? `<div class="sim-confirm"><p><b>Terminer le recueil ?</b><br><span class="sim-muted">Tu passeras au bilan. Tu ne pourras plus poser de questions à ${_esc(scn.patient.civ)} ${_esc(scn.patient.nom)}.</span></p>
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
    return `<div class="sim-lcd" role="img" aria-label="Écran de l'appareil : ${_esc(d.big)} ${_esc(d.unit)}">${d.sub ? `<span class="sim-lcd-sub">${_esc(d.sub)}</span>` : ''}<span class="sim-lcd-v">${_esc(d.big)}</span><span class="sim-lcd-u">${_esc(d.unit)}</span></div>`;
  }
  function _scale(t) {
    let cells = '';
    for (let i = 0; i <= 10; i++) {
      const face = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😟', '😣', '😖', '😭'][i];
      cells += `<div class="sim-sc ${i === t.scale ? 'on' : ''}" style="--h:${Math.round(125 - i * 12.5)}"><span class="sim-sc-f">${face}</span><b>${i}</b>${i === t.scale ? '<span class="sim-sc-hand" aria-hidden="true">👆</span>' : ''}</div>`;
    }
    return `<div class="sim-scale" role="img" aria-label="Échelle de douleur de 0 à 10 : la résidente montre ${t.scale}">${cells}</div><div class="sim-quote">${_esc(t.patientSays)}</div>`;
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
    const head = `<div class="sim-g-head"><span class="sim-g-ico">${t.icon}</span><div><b>${_G ? _esc(t.label) : 'Dans ta main : ' + _esc(t.label)}</b>${_G ? '' : '<div class="sim-muted sim-small">Touche sur la patiente l\'endroit où tu l\'utilises.</div>'}</div><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sim.dropTool()">${_G && _G.phase === 'running' ? 'Annuler' : 'Reposer'}</button></div>`;
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
    return head + `<form class="sim-readform" onsubmit="return App.Sim.gSubmit(event)">${disp}${warn}
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
    const zb = _el('sim-zoom'); if (zb) zb.textContent = _zoom === 'patient' ? '🏠 Vue de la chambre' : '🔍 Zoom sur la patiente';
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
    const p = _el('sim-p-recueil'), c = _cur(), scn = _curScn(); if (!p || !c || !scn) return;
    const tableFacts = new Set(scn.constTable.map(r => r.fact)); tableFacts.add('d_const_hab');
    const keys = Object.keys(scn.facts);
    const usualKnown = !!c.found.d_const_hab;
    const rows = SECTIONS.map(([sid, sname]) => {
      if (sid === 'constantes') {
        const trs = scn.constTable.map(r => {
          const f = scn.facts[r.fact], got = c.found[r.fact], tk = _toolOfFact(scn, r.fact);
          const cell = got ? _esc(f.text) : (tk && c.pending[tk] ? `<button type="button" class="sim-pend" onclick="App.Sim.reopen('${tk}')">✎ à noter</button>` : '—');
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
            return `<div class="sim-fact"><span class="sim-fact-k">${_esc(f.label)}</span><span class="sim-fact-v">${_esc(f.text)}</span><span class="sim-src">${_esc(KIND_LABEL[f.kind] || '')}</span></div>`; }).join('')
        : '<div class="sim-fact-none">Pas encore renseigné</div>';
      return `<div class="sim-sec"><div class="sim-sec-h">${_esc(sname)}</div>${body}</div>`;
    }).join('');
    p.innerHTML = `<h3 class="sim-h">📋 Recueil de données <span class="sim-count">${_countFound()} notée${_countFound() > 1 ? 's' : ''}</span></h3>
      <p class="sim-muted sim-small">Tout ce que tu apprends s'ajoute ici. « Dit par la résidente » = ce qu'elle ressent ; « Mesure » et « Observation » = ce que tu constates toi-même.</p>${rows}`;
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
  function _renderBilan(root) {
    const c = _cur(), scn = _curScn();
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
    root.innerHTML = `<div class="sim-wrap">
      <div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Sim.toList()">← Menu</button>
        <div class="sim-bar-title">Bilan · ${_esc(scn.title)}</div><div class="sim-bar-time" id="sim-clock" title="Temps actif">${_hms(c.secs)}</div></div>
      ${_stepper()}
      <div class="sim-card sim-sum">
        <div class="sim-sum-box"><div class="sim-sum-n">${b.keyFound}<small>/${b.keyTotal}</small></div><div>informations clés trouvées</div></div>
        <div class="sim-sum-box"><div class="sim-sum-n">${b.gFound}<small>/${b.gTotal}</small></div><div>gestes professionnels réussis</div></div>
        <div class="sim-sum-box"><div class="sim-sum-n">${_hms(c.secs)}</div><div>temps actif</div></div>
      </div>
      <p class="sim-muted sim-small sim-stats">${Object.keys(c.entered).length} mesure${Object.keys(c.entered).length > 1 ? 's' : ''} notée${Object.keys(c.entered).length > 1 ? 's' : ''} sur ${scn.toolOrder.length} · ${c.errors || 0} erreur${(c.errors || 0) > 1 ? 's' : ''} de saisie · ${c.misplaced || 0} instrument${(c.misplaced || 0) > 1 ? 's' : ''} mal placé${(c.misplaced || 0) > 1 ? 's' : ''}</p>
      <div class="sim-note">🛠️ <b>Bilan provisoire (étape 1)</b> : il porte sur le recueil. La décision, l'appel de l'infirmier référent, tes transmissions écrites et le score complet arrivent aux étapes suivantes.</div>
      <h3 class="sim-h">Informations clés</h3>
      <div class="sim-card">${keyRows}</div>
      <h3 class="sim-h">🔎 Ce qu'il fallait retenir</h3>
      <div class="sim-card sim-retain">${_esc(scn.alertSummary)}</div>
      <h3 class="sim-h">Tes gestes</h3>
      <div class="sim-card">${gridRows}<div class="sim-muted sim-small" style="margin-top:8px">✓ réussi · ↺ réussi après une correction · ◐ fait trop tard · ✗ non fait</div></div>
      <h3 class="sim-h">Compétences travaillées</h3>
      <div class="sim-card"><ul class="sim-ul">${comps}</ul></div>
      <h3 class="sim-h">Sources</h3>
      <div class="sim-card"><ul class="sim-ul">${sources}</ul>
        <div class="sim-muted sim-small">Scénario fictif. ${_esc(scn.status)}. En cas de différence, ton cours et les protocoles de ton stage priment.</div></div>
      <div class="sim-row sim-enter"><button class="btn btn-ghost" onclick="App.Sim.replay()">🔁 Rejouer</button><button class="btn btn-primary" onclick="App.Sim.closeBilan()">Terminer</button></div>
    </div>`;
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
    parse, _t: { norm: _norm, state: () => st, tick: _tick }
  };
})();
