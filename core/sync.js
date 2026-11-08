// core/sync.js — Synchronisation via GitHub Gist
//
// TEMPS DE TRAVAIL ET COMPTEURS DU JOUR : journal par appareil.
//   Avant, la fusion gardait le PLUS GRAND des deux appareils (le temps de l'autre était perdu), la récupération n'avait lieu
//   qu'au démarrage et le temps passé en entraînement n'était jamais envoyé. Maintenant :
//   - chaque appareil écrit son propre fichier « ifsi-time-<id>.json » dans le Gist (jamais écrasé par un autre appareil) ;
//   - ce fichier contient ses AJOUTS (le temps qu'il a réellement compté, y compris une correction manuelle, qui est un ajout négatif)
//     et une « base » (l'historique d'avant ce système, commun aux appareils) ;
//   - total d'un jour = plus grande base + somme des ajouts de tous les appareils ;
//   - synchro au démarrage, au retour sur l'appli, à la reconnexion, toutes les 90 s et quelques secondes après chaque ajout.
'use strict';
window.App = window.App || {};

App.Sync = (() => {
  const SYNC_KEY  = 'ifsi_sync_config';
  const API       = 'https://api.github.com';
  const FILENAME  = 'ifsi-srs-data.json';

  let config  = { token: '', gistId: '' };
  let _pushTimer = null;
  let _status = 'idle'; // idle | syncing | ok | error

  // ── Journal de temps par appareil ──────────────────────────────
  const DEV_KEY     = 'ifsi_device_id';
  const LEDGER_KEY  = 'ifsi_time_ledger_v1';
  const TIME_PREFIX = 'ifsi-time-';
  const TIME_SUFFIX = '.json';
  const _delays = { debounce: 15000, maxWait: 60000, periodic: 90000, minResume: 15000 };
  let _busy = false, _again = false, _applying = false, _bound = false;
  let _dirtyTimer = null, _dirtySince = 0, _lastSync = 0, _periodic = null;

  // ── Config ─────────────────────────────────────────────────────
  function loadConfig() {
    try { config = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}'); } catch(e) {}
    config.token  = config.token  || '';
    config.gistId = config.gistId || '';
  }

  function saveConfig() {
    localStorage.setItem(SYNC_KEY, JSON.stringify(config));
  }

  function isConfigured() {
    return !!(config.token && config.gistId);
  }

  // ── API GitHub ─────────────────────────────────────────────────
  function _headers() {
    return {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
  }

  async function _createGist() {
    const payload = {
      description: 'Révision IFSI — données SRS',
      public: false,
      files: { [FILENAME]: { content: _serialize() } }
    };
    const res = await fetch(`${API}/gists`, { method: 'POST', headers: _headers(), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Création Gist échouée (${res.status})`);
    const data = await res.json();
    return data.id;
  }

  async function _updateGist(extraFiles) {
    const payload = { files: { [FILENAME]: { content: _serialize() }, ...(extraFiles || {}) } };
    const res = await fetch(`${API}/gists/${config.gistId}`, { method: 'PATCH', headers: _headers(), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Mise à jour Gist échouée (${res.status})`);
  }
  // Envoie UNIQUEMENT des fichiers précis (ex. le journal de temps de cet appareil) : les autres fichiers du Gist ne sont pas touchés.
  async function _patchFiles(files, keepalive) {
    const res = await fetch(`${API}/gists/${config.gistId}`, { method: 'PATCH', headers: _headers(), body: JSON.stringify({ files }), keepalive: !!keepalive });
    if (!res.ok) throw new Error(`Mise à jour Gist échouée (${res.status})`);
  }

  async function _fetchGist() {
    const res = await fetch(`${API}/gists/${config.gistId}`, { headers: _headers() });
    if (!res.ok) throw new Error(`Lecture Gist échouée (${res.status})`);
    const data = await res.json();
    const fileInfo = data.files?.[FILENAME];
    if (!fileInfo) throw new Error('Fichier introuvable dans le Gist');
    // Journaux de temps des appareils (un fichier par appareil)
    const files = {};
    Object.entries(data.files || {}).forEach(([name, f]) => {
      if (name.startsWith(TIME_PREFIX) && name.endsWith(TIME_SUFFIX) && f && !f.truncated) files[name] = f.content;
    });
    // Si tronqué (ancien format lourd) → on écrase avec le nouveau format compact
    if (fileInfo.truncated) {
      await _updateGist();   // pousse le format léger
      return { main: { v: 2, progress: {}, studyLog: {}, catOrder: [] }, files }; // repart de zéro côté merge
    }
    return { main: JSON.parse(fileInfo.content), files };
  }

  // ── Sérialisation ──────────────────────────────────────────────
  // On ne sync que les progrès SRS + log + ordre (pas le contenu des cartes)
  function _serialize() {
    const { state } = App.Store;
    const progress = {};
    state.cards.forEach(c => { if (c.progress) progress[c.id] = c.progress; });
    // Données Grand Oral
    let oralEvals = [];
    try { oralEvals = JSON.parse(localStorage.getItem('ifsi_oral_evals') || '[]'); } catch(e) {}
    // Progression du module Anglais (étoiles/XP par leçon + série de jours) —
    // sans ça elle ne se retrouve pas d'un appareil à l'autre, contrairement
    // aux cartes/flashcards qui, elles, sont déjà synchronisées ci-dessus.
    let englishProgress = {}, englishStreak = {};
    try { englishProgress = JSON.parse(localStorage.getItem('ifsi_english_progress') || '{}'); } catch(e) {}
    try { englishStreak   = JSON.parse(localStorage.getItem('ifsi_english_streak')   || '{}'); } catch(e) {}
    return JSON.stringify({
      v: 2,
      updatedAt: new Date().toISOString(),
      progress,
      studyLog: state.studyLog,
      catOrder: state.catOrder,
      oralEvals,
      oralPlanP1: localStorage.getItem('ifsi_oral_plan_p1') || '',
      oralPlanP2: localStorage.getItem('ifsi_oral_plan_p2') || '',
      englishProgress,
      englishStreak
    }, null, 0);
  }

  function _deserialize(data) {
    return {
      progress:   data.progress && typeof data.progress === 'object' ? data.progress : {},
      studyLog:   data.studyLog && typeof data.studyLog === 'object' ? data.studyLog : {},
      catOrder:   Array.isArray(data.catOrder) ? data.catOrder : [],
      updatedAt:  data.updatedAt || '',
      oralEvals:  Array.isArray(data.oralEvals) ? data.oralEvals : [],
      oralPlanP1: typeof data.oralPlanP1 === 'string' ? data.oralPlanP1 : null,
      oralPlanP2: typeof data.oralPlanP2 === 'string' ? data.oralPlanP2 : null,
      englishProgress: data.englishProgress && typeof data.englishProgress === 'object' ? data.englishProgress : null,
      englishStreak:   data.englishStreak   && typeof data.englishStreak   === 'object' ? data.englishStreak   : null
    };
  }

  // ── Journal de temps par appareil : cœur de la fusion ──────────
  function _deviceId() {
    let id = '';
    try { id = localStorage.getItem(DEV_KEY) || ''; } catch (e) {}
    if (!id) {
      id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
      try { localStorage.setItem(DEV_KEY, id); } catch (e) {}
    }
    return id;
  }
  const _timeFile = () => TIME_PREFIX + _deviceId() + TIME_SUFFIX;
  function _ledger() {
    try { const l = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null'); if (l && l.v === 1 && l.own && l.base && l.applied) return l; } catch (e) {}
    return null;
  }
  function _saveLedger(l) { try { localStorage.setItem(LEDGER_KEY, JSON.stringify(l)); } catch (e) {} }
  const _isNum = v => typeof v === 'number' && isFinite(v);
  function _numeric(entry) {      // tous les compteurs numériques d'un jour (temps, cartes, anglais…), sauf l'horodatage de correction
    const o = {};
    Object.keys(entry || {}).forEach(k => { if (k !== 'fixAt' && _isNum(entry[k])) o[k] = entry[k]; });
    return o;
  }
  function _snapshot(log) { const o = {}; Object.keys(log || {}).forEach(d => { o[d] = _numeric(log[d]); }); return o; }

  // Ajouts faits ICI depuis la dernière application : (valeur actuelle − valeur appliquée). Peut être négatif (correction manuelle).
  function _foldOwn(L, log) {
    const dates = new Set([...Object.keys(log || {}), ...Object.keys(L.applied)]);
    dates.forEach(d => {
      const cur = _numeric(log[d]), app = L.applied[d] || {};
      new Set([...Object.keys(cur), ...Object.keys(app)]).forEach(f => {
        const delta = (cur[f] || 0) - (app[f] || 0);
        if (delta) { const o = L.own[d] || (L.own[d] = {}); o[f] = (o[f] || 0) + delta; }
      });
    });
  }
  function _payloadOf(L) {
    const sig = JSON.stringify([L.base, L.own]);
    return { sig, content: JSON.stringify({ v: 1, dev: _deviceId(), updatedAt: new Date().toISOString(), base: L.base, own: L.own }) };
  }

  // files : fichiers « temps » du Gist ; remoteMain : fichier principal (sert seulement à la toute première migration).
  // Met à jour App.Store.state.studyLog en place. Retourne { changed, needUpload, sig, content }.
  function _timeApply(files, remoteMain) {
    const me = _deviceId(), log = App.Store.state.studyLog;
    const others = [];
    Object.keys(files || {}).forEach(name => {
      if (!name.startsWith(TIME_PREFIX) || !name.endsWith(TIME_SUFFIX)) return;
      if (name.slice(TIME_PREFIX.length, -TIME_SUFFIX.length) === me) return;
      try { const j = JSON.parse(files[name]); if (j && j.v === 1 && j.own && j.base) others.push(j); } catch (e) {}
    });
    let L = _ledger();
    if (!L) {
      // Première synchro de cet appareil : son historique actuel devient la « base » (commune aux appareils).
      const base = _snapshot(log);
      if (!others.length && remoteMain && remoteMain.studyLog && typeof remoteMain.studyLog === 'object') {
        // Aucun autre appareil n'a encore de journal : on garde le plus grand des deux historiques (ancien comportement, une seule fois).
        Object.entries(remoteMain.studyLog).forEach(([d, e]) => {
          const r = _numeric(e), b = base[d] || (base[d] = {});
          Object.keys(r).forEach(f => { b[f] = Math.max(b[f] || 0, r[f]); });
        });
      }
      L = { v: 1, base, own: {}, applied: _snapshot(log), uploaded: '' };
    }
    _foldOwn(L, log);
    // Total d'un jour = plus grande base + somme des ajouts de tous les appareils.
    const peers = others.concat([{ base: L.base, own: L.own }]);
    const dates = new Set();
    peers.forEach(p => { Object.keys(p.base).forEach(d => dates.add(d)); Object.keys(p.own).forEach(d => dates.add(d)); });
    let changed = false;
    dates.forEach(d => {
      const fields = new Set();
      peers.forEach(p => { Object.keys(p.base[d] || {}).forEach(f => fields.add(f)); Object.keys(p.own[d] || {}).forEach(f => fields.add(f)); });
      const e = log[d] || (log[d] = { reviewed: 0, ok: 0, hard: 0, nope: 0 });
      fields.forEach(f => {
        let b = 0, sum = 0;
        peers.forEach(p => { b = Math.max(b, (p.base[d] || {})[f] || 0); sum += (p.own[d] || {})[f] || 0; });
        const tot = Math.max(0, Math.round(b + sum));
        if (e[f] !== tot) { e[f] = tot; changed = true; }
      });
    });
    L.applied = _snapshot(log);
    _saveLedger(L);
    const pl = _payloadOf(L);
    return { changed, needUpload: pl.sig !== L.uploaded, sig: pl.sig, content: pl.content };
  }
  function _markUploaded(sig) { const L = _ledger(); if (L) { L.uploaded = sig; _saveLedger(L); } }

  function _refreshUI() {
    try { App.Render.todayStats(); } catch (e) {}
    try { const sv = document.getElementById('stats-view'); if (sv && sv.style.display !== 'none') App.Render.stats(); } catch (e) {}
  }
  function _saveLogQuiet() { _applying = true; try { App.Store.saveLog(); } finally { _applying = false; } }

  // Synchronisation légère du temps : lit le Gist, additionne les journaux, met à jour l'affichage, envoie SEULEMENT le journal de cet appareil.
  async function syncTime() {
    if (!isConfigured()) return false;
    if (_busy) { _again = true; return false; }
    _busy = true;
    try {
      const full = await _fetchGist();
      const t = _timeApply(full.files, full.main);
      if (t.changed) { _saveLogQuiet(); _refreshUI(); }
      if (t.needUpload) { await _patchFiles({ [_timeFile()]: { content: t.content } }); _markUploaded(t.sig); }
      _lastSync = Date.now();
      return true;
    } catch (e) {
      if (navigator.onLine !== false) _setStatus('error', e.message);
      return false;
    } finally {
      _busy = false;
      if (_again) { _again = false; setTimeout(syncTime, 500); }
    }
  }

  // Appelé à chaque écriture du journal du jour (temps, révisions) : envoi quelques secondes plus tard (au plus 60 s d'attente).
  function markTimeDirty() {
    if (_applying || !isConfigured()) return;
    const now = Date.now();
    if (!_dirtySince) _dirtySince = now;
    clearTimeout(_dirtyTimer);
    const wait = Math.min(_delays.debounce, Math.max(0, _dirtySince + _delays.maxWait - now));
    _dirtyTimer = setTimeout(() => { _dirtySince = 0; syncTime(); }, wait);
  }

  // Au passage en arrière-plan / fermeture : envoi immédiat de ses propres ajouts (sans lecture), au mieux.
  function _flushOnHide() {
    if (!isConfigured() || _busy) return;
    try {
      const L = _ledger();
      if (!L) return;            // pas encore migré : la synchro normale s'en chargera
      _foldOwn(L, App.Store.state.studyLog);
      L.applied = _snapshot(App.Store.state.studyLog);
      _saveLedger(L);
      const pl = _payloadOf(L);
      if (pl.sig === L.uploaded) return;
      _patchFiles({ [_timeFile()]: { content: pl.content } }, true)
        .catch(() => _patchFiles({ [_timeFile()]: { content: pl.content } }, false))
        .then(() => _markUploaded(pl.sig)).catch(() => {});
    } catch (e) {}
  }

  function _bindLifecycle() {
    if (_bound) return;
    _bound = true;
    const resume = () => { if (isConfigured() && Date.now() - _lastSync > _delays.minResume) syncTime(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) _flushOnHide(); else resume(); });
    window.addEventListener('focus', resume);
    window.addEventListener('online', () => { if (isConfigured()) syncTime(); });
    window.addEventListener('pagehide', _flushOnHide);
    _periodic = setInterval(() => { if (!document.hidden && isConfigured()) syncTime(); }, _delays.periodic);
  }

  // ── Connexion initiale ─────────────────────────────────────────
  async function connect(token) {
    config.token = token.trim();
    _setStatus('syncing');
    try {
      // Vérifie le token
      const me = await fetch(`${API}/user`, { headers: _headers() });
      if (!me.ok) throw new Error('Token invalide');
      const user = await me.json();

      // Cherche un Gist existant
      const list = await fetch(`${API}/gists?per_page=100`, { headers: _headers() });
      const gists = await list.json();
      const existing = gists.find(g => g.files?.[FILENAME]);

      if (existing) {
        config.gistId = existing.id;
        saveConfig();
        // Récupère les données distantes
        await pullRemote();
        _bindLifecycle();
        _setStatus('ok', `Connecté · ${user.login}`);
        return { ok: true, msg: `Gist existant trouvé · ${user.login}` };
      } else {
        // Crée un nouveau Gist avec les données locales
        config.gistId = await _createGist();
        saveConfig();
        _bindLifecycle();
        setTimeout(syncTime, 500);
        _setStatus('ok', `Connecté · ${user.login}`);
        return { ok: true, msg: `Nouveau Gist créé · ${user.login}` };
      }
    } catch(e) {
      config.token = ''; config.gistId = '';
      _setStatus('error', e.message);
      return { ok: false, msg: e.message };
    }
  }

  // ── Envoi (push) ──────────────────────────────────────────────
  async function push() {
    if (!isConfigured()) return;
    if (_busy) { _again = true; return; }
    _busy = true;
    _setStatus('syncing');
    try {
      // On relit d'abord le Gist pour ne jamais envoyer un temps périmé : on additionne les journaux des autres appareils.
      const full = await _fetchGist();
      const t = _timeApply(full.files, full.main);
      if (t.changed) { _saveLogQuiet(); _refreshUI(); }
      await _updateGist(t.needUpload ? { [_timeFile()]: { content: t.content } } : {});
      if (t.needUpload) _markUploaded(t.sig);
      _lastSync = Date.now();
      _setStatus('ok');
    } catch(e) {
      _setStatus('error', e.message);
    } finally {
      _busy = false;
      if (_again) { _again = false; setTimeout(syncTime, 500); }
    }
  }

  // Push différé (évite les appels répétés à chaque keystroke)
  function pushDebounced() {
    if (!isConfigured()) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(push, 2000);
  }

  // ── Diagnostic ────────────────────────────────────────────────
  async function diagnose() {
    const out = [];
    if (!config.token)  { out.push('❌ Pas de token'); return out.join('\n'); }
    if (!config.gistId) { out.push('❌ Pas de Gist ID'); return out.join('\n'); }
    out.push('🔑 Token : ' + config.token.slice(0,12) + '…');
    out.push('📋 Gist ID : ' + config.gistId);
    try {
      const me = await fetch(`${API}/user`, { headers: _headers() });
      if (!me.ok) { out.push(`❌ Token invalide (${me.status})`); return out.join('\n'); }
      const u = await me.json();
      out.push('✅ Compte : ' + u.login);
    } catch(e) { out.push('❌ Réseau : ' + e.message); return out.join('\n'); }
    try {
      const g = await fetch(`${API}/gists/${config.gistId}`, { headers: _headers() });
      if (!g.ok) { out.push(`❌ Gist introuvable (${g.status}) — Déconnecte et reconnecte`); return out.join('\n'); }
      const gd = await g.json();
      const f  = gd.files?.[FILENAME];
      out.push(f ? `✅ Fichier Gist OK (${(f.size/1024).toFixed(1)} Ko)` : `⚠️ Fichier ${FILENAME} absent du Gist`);
    } catch(e) { out.push('❌ Lecture Gist : ' + e.message); }
    try {
      const full = await _fetchGist(), me = _deviceId(), today = App.SRS.todayStr();
      const mn = s => Math.round((s || 0) / 60) + ' min';
      const L = _ledger();
      out.push('⏱ Journal de temps (aujourd\'hui, ' + today + ') — cet appareil : ' + me + (L ? '' : ' (pas encore initialisé)'));
      let own = L ? ((L.own[today] || {}).seconds || 0) : 0, tot = (L ? ((L.base[today] || {}).seconds || 0) : 0) + own;
      out.push('   • ' + me + ' (cet appareil) : +' + mn(own));
      Object.keys(full.files).forEach(name => {
        const id = name.slice(TIME_PREFIX.length, -TIME_SUFFIX.length);
        if (id === me) return;
        try { const j = JSON.parse(full.files[name]); const o = ((j.own || {})[today] || {}).seconds || 0; tot += o; out.push('   • ' + id + ' : +' + mn(o) + ' (vu ' + (j.updatedAt || '?').slice(11, 16) + ' UTC)'); } catch (e) { out.push('   • ' + id + ' : illisible'); }
      });
      out.push('   Total affiché ici : ' + mn(App.Store.getDaySeconds(today)) + ' · dernière synchro : ' + (_lastSync ? new Date(_lastSync).toLocaleTimeString('fr-FR') : 'jamais'));
    } catch(e) { out.push('⚠️ Journal de temps : ' + e.message); }
    return out.join('\n');
  }

  // ── Réception (pull) ──────────────────────────────────────────
  async function pullRemote(onProgress) {
    const prog = onProgress || (() => {});
    if (!isConfigured()) return false;
    _setStatus('syncing');
    try {
      prog(20, 'Récupération des données…');
      const full = await _fetchGist();
      const remote = _deserialize(full.main);
      prog(50, 'Fusion des données…');

      // Applique les progrès distants sur les cartes locales
      // (le contenu des cartes reste celui de l'app)
      App.Store.state.cards.forEach(card => {
        const remoteP = remote.progress[card.id];
        const localP  = card.progress;
        if (remoteP && localP) {
          // Garde le plus récent
          if ((remoteP.lastReview || '') > (localP.lastReview || ''))
            card.progress = remoteP;
        } else if (remoteP && !localP) {
          card.progress = remoteP;
        }
      });

      // Temps et compteurs du jour : journal par appareil (les ajouts de chaque appareil s'additionnent ; plus de « max » qui perdait du temps)
      _timeApply(full.files, remote);

      if (remote.catOrder && remote.catOrder.length > 0)
        App.Store.state.catOrder = (App.Regroup && App.Regroup.remapOrder) ? App.Regroup.remapOrder(remote.catOrder) : remote.catOrder;

      // ── Merge Grand Oral ────────────────────────────────────────
      // Évaluations : union par date exacte (évite les doublons)
      if (remote.oralEvals && remote.oralEvals.length > 0) {
        let localEvals = [];
        try { localEvals = JSON.parse(localStorage.getItem('ifsi_oral_evals') || '[]'); } catch(e) {}
        const seen = new Set(localEvals.map(e => e.date));
        remote.oralEvals.forEach(e => { if (!seen.has(e.date)) localEvals.push(e); });
        localEvals.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem('ifsi_oral_evals', JSON.stringify(localEvals.slice(0, 50)));
      }
      // Plans : garde le plus long (le plus complet) entre local et distant
      ['p1', 'p2'].forEach(id => {
        const key = 'ifsi_oral_plan_' + id;
        const remoteVal = id === 'p1' ? remote.oralPlanP1 : remote.oralPlanP2;
        if (remoteVal && remoteVal.length > (localStorage.getItem(key) || '').length) {
          localStorage.setItem(key, remoteVal);
        }
      });

      // ── Merge Anglais (étoiles/XP par leçon + série de jours) ──────
      // Par leçon : garde le meilleur des deux appareils (étoiles et XP max),
      // fusionne les mots à revoir. Jamais de perte, juste le meilleur des 2.
      if (remote.englishProgress) {
        let localEng = {};
        try { localEng = JSON.parse(localStorage.getItem('ifsi_english_progress') || '{}'); } catch(e) {}
        const mergedEng = { ...remote.englishProgress };
        Object.entries(localEng).forEach(([lid, loc]) => {
          const rem = mergedEng[lid];
          if (!rem) { mergedEng[lid] = loc; return; }
          mergedEng[lid] = {
            stars:    Math.max(loc.stars||0, rem.stars||0),
            xp:       Math.max(loc.xp||0,    rem.xp||0),
            mistakes: { ...(rem.mistakes||{}), ...(loc.mistakes||{}) }
          };
        });
        localStorage.setItem('ifsi_english_progress', JSON.stringify(mergedEng));
      }
      // Série de jours : garde la date la plus récente (et le compteur le
      // plus grand en cas d'égalité de date).
      if (remote.englishStreak) {
        let localStreak = {};
        try { localStreak = JSON.parse(localStorage.getItem('ifsi_english_streak') || '{}'); } catch(e) {}
        const r = remote.englishStreak, l = localStreak;
        let winner = l;
        if (!l.lastDate) winner = r;
        else if (r.lastDate > l.lastDate) winner = r;
        else if (r.lastDate === l.lastDate) winner = (r.count||0) > (l.count||0) ? r : l;
        localStorage.setItem('ifsi_english_streak', JSON.stringify(winner));
      }

      prog(80, 'Sauvegarde…');
      App.Store.save();
      _saveLogQuiet();
      App.Store.saveOrder();
      App.Render.all();
      // Rafraîchit l'historique Grand Oral si le module est visible
      if (window.App?.Oral) {
        try { App.Oral.refreshHistory && App.Oral.refreshHistory(); } catch(e) {}
      }
      // Rafraîchit l'écran d'accueil Anglais si c'est bien ce qui est affiché
      // (nouvelles étoiles/XP fusionnées) — jamais si une leçon est en cours,
      // pour ne pas interrompre l'utilisateur·ice en pleine partie.
      if (window.App?.English) {
        const engHome = document.getElementById('english-home');
        if (engHome && engHome.style.display !== 'none') {
          try { App.English.showHome(); } catch(e) {}
        }
      }
      prog(100, 'Synchronisé !');
      _lastSync = Date.now();
      _setStatus('ok');
      return true;
    } catch(e) {
      _setStatus('error', e.message);
      return false;
    }
  }


  // ── Déconnexion ───────────────────────────────────────────────
  function disconnect() {
    config = { token: '', gistId: '' };
    saveConfig();
    _setStatus('idle');
    _updateUI();
  }

  // ── Statut visuel ──────────────────────────────────────────────
  function _setStatus(s, msg) {
    _status = s;
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    const icons  = { idle:'☁️', syncing:'🔄', ok:'✅', error:'⚠️' };
    const colors = { idle:'#6b7280', syncing:'#2563eb', ok:'#16a34a', error:'#dc2626' };
    const labels = { idle:'Non sync.', syncing:'Sync…', ok: msg||'Synchronisé', error: msg||'Erreur sync' };
    el.textContent  = icons[s]  || '☁️';
    el.style.color  = colors[s] || '#6b7280';
    el.title        = labels[s] || s;
  }

  function _updateUI() {
    const configured = isConfigured();
    const setupZone  = document.getElementById('sync-setup-zone');
    const connZone   = document.getElementById('sync-connected-zone');
    if (setupZone) setupZone.style.display  = configured ? 'none'  : 'block';
    if (connZone)  connZone.style.display   = configured ? 'block' : 'none';
  }

  // ── Init (appelé au démarrage de l'app) ───────────────────────
  function init() {
    loadConfig();
    _updateUI();
    if (isConfigured()) {
      _setStatus('ok');
      _bindLifecycle();
      // Pull automatique au démarrage (avec délai pour laisser le DOM se charger)
      setTimeout(pullRemote, 1000);
    }
  }

  return { init, connect, disconnect, push, pushDebounced, pullRemote, isConfigured, loadConfig, diagnose, syncTime, markTimeDirty,
           _t: { delays: _delays, config: () => config, setConfig: c => { config = Object.assign({ token: '', gistId: '' }, c); }, ledger: _ledger, deviceId: _deviceId, bind: _bindLifecycle, flush: _flushOnHide } };
})();
