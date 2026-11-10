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
  // ── Séries en pause + réglage « par séries de 10 » : un fichier par appareil, lui aussi ──
  const SERIES_PREFIX = 'ifsi-series-', SERIES_SUFFIX = '.json';
  const SERIES_SIG_KEY = 'ifsi_series_sig_v1', SERIES10_KEY = 'ifsi_series10';
  const SERIES_REMOTE_MAX_AGE = 60 * 86400000;      // une série restée 60 jours sans bouger sur un autre appareil est ignorée
  // timeout : délai maximal d'une requête ; retry : nouvelles tentatives automatiques après un échec passager (réseau pas encore prêt au
  // démarrage du téléphone, coupure brève…) ; pushWait / pushMaxWait : envoi différé du fichier principal (progression des cartes).
  const _delays = { debounce: 15000, maxWait: 60000, periodic: 90000, minResume: 15000, timeout: 25000, retry: [4000, 12000, 40000], pushWait: 8000, pushMaxWait: 60000 };
  let _busy = false, _again = false, _applying = false, _bound = false;
  let _dirtyTimer = null, _dirtySince = 0, _lastSync = 0, _periodic = null;
  let _pushSince = 0, _pullPromise = null, _pulled = false, _retryN = 0, _retryTimer = null, _blockedUntil = 0;
  let _lastError = null;      // { where, msg, at } : dernière erreur de synchro (effacée au prochain succès complet)
  const MAIN_SIG_KEY = 'ifsi_main_sig_v1';

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

  // Requête avec délai maximal (une requête qui ne répond jamais ne bloque plus la synchro) et message d'erreur lisible
  // (code HTTP + explication renvoyée par GitHub). what = ce qu'on essayait de faire, pour le message.
  async function _req(url, opts, what, asJson) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), _delays.timeout) : null;
    try {
      let res;
      try { res = await fetch(url, ctl ? Object.assign({}, opts, { signal: ctl.signal }) : opts); }
      catch (e) {
        const err = new Error(what + ' : ' + (e && e.name === 'AbortError' ? 'délai dépassé (réseau trop lent)' : 'réseau indisponible'));
        err.network = true; throw err;
      }
      if (!res.ok) {
        let detail = '';
        try { const j = await res.json(); if (j && j.message) detail = ' — ' + String(j.message).slice(0, 140); } catch (e) {}
        const err = new Error(what + ' refusée (' + res.status + ')' + detail);
        err.status = res.status;
        // Limite de débit GitHub : on s'arrête un moment au lieu d'insister (réessai automatique ensuite).
        const ra = parseInt((res.headers && res.headers.get && res.headers.get('retry-after')) || '0', 10) || 0;
        if (res.status === 429 || ra || (res.status === 403 && /rate limit|abuse/i.test(detail))) {
          _blockedUntil = Date.now() + Math.min(3600000, Math.max(60000, ra * 1000));
          err.rateLimited = true;
        }
        throw err;
      }
      if (!asJson) return res;
      try { return await res.json(); }
      catch (e) { const err = new Error(what + ' : réponse illisible'); err.network = true; throw err; }
    } finally { if (timer) clearTimeout(timer); }
  }

  async function _createGist() {
    const payload = {
      description: 'Révision IFSI — données SRS',
      public: false,
      files: { [FILENAME]: { content: _serialize() } }
    };
    const data = await _req(`${API}/gists`, { method: 'POST', headers: _headers(), body: JSON.stringify(payload) }, 'Création du Gist', true);
    return data.id;
  }

  // Envoie UNIQUEMENT des fichiers précis (ex. le journal de temps de cet appareil) : les autres fichiers du Gist ne sont pas touchés.
  async function _patchFiles(files, keepalive) {
    await _req(`${API}/gists/${config.gistId}`, { method: 'PATCH', headers: _headers(), body: JSON.stringify({ files }), keepalive: !!keepalive }, 'Envoi vers le Gist');
  }

  // Empreinte courte d'un texte (sert à ne PAS renvoyer 580 Ko quand rien n'a changé depuis le dernier envoi).
  function _hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36) + ':' + s.length; }
  const _mainSig = () => { try { return localStorage.getItem(MAIN_SIG_KEY) || ''; } catch (e) { return ''; } };
  function _markMainUploaded(sig) { try { localStorage.setItem(MAIN_SIG_KEY, sig); } catch (e) {} }

  async function _fetchGist() {
    const data = await _req(`${API}/gists/${config.gistId}`, { headers: _headers() }, 'Lecture du Gist', true);
    const fileInfo = data && data.files && data.files[FILENAME];
    if (!fileInfo) throw new Error('Fichier introuvable dans le Gist');
    // Journaux de temps et séries des appareils (un fichier par appareil)
    const files = {}, series = {};
    Object.entries(data.files || {}).forEach(([name, f]) => {
      if (name.startsWith(TIME_PREFIX) && name.endsWith(TIME_SUFFIX) && f && !f.truncated) files[name] = f.content;
      else if (name.startsWith(SERIES_PREFIX) && name.endsWith(SERIES_SUFFIX) && f && !f.truncated) series[name] = f.content;
    });
    // Fichier principal tronqué par GitHub (au-delà d'environ 1 Mo) : on le relit en entier via son adresse brute
    // (avant, on l'écrasait avec les seules données de cet appareil, ce qui effaçait la progression des autres).
    let text = fileInfo.content;
    if (fileInfo.truncated) {
      if (!fileInfo.raw_url) throw new Error('Fichier principal tronqué par GitHub (adresse brute absente)');
      const r = await _req(fileInfo.raw_url, {}, 'Lecture du fichier principal (volumineux)');
      text = await r.text();
    }
    let main;
    try { main = JSON.parse(text); } catch (e) { throw new Error('Fichier principal du Gist illisible (JSON invalide)'); }
    if (!main || typeof main !== 'object') throw new Error('Fichier principal du Gist vide ou invalide');
    return { main, files, series };
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

  // ── Séries en pause : fusion entre appareils ───────────────────
  // Chaque appareil n'écrit QUE son fichier. Pour une même série (identifiant sid), la version la plus récente gagne ;
  // une série terminée ou abandonnée laisse une « trace » plus récente que sa dernière version : elle disparaît partout.
  const _seriesFile = () => SERIES_PREFIX + _deviceId() + SERIES_SUFFIX;
  function _pref10() {
    let v = null, at = 0;
    try { v = localStorage.getItem(SERIES10_KEY); at = parseInt(localStorage.getItem(SERIES10_KEY + '_at') || '0', 10) || 0; } catch (e) {}
    return { v: v === '0' || v === '1' ? v : null, at };
  }
  function _seriesPayload(slots, done, pv, pat) {
    const empty = !slots.length && !Object.keys(done).length && !pat;
    const sig = JSON.stringify([slots.map(r => [r.sid, r.at, r.idx]), done, pv, pat]);
    return { empty, sig, content: JSON.stringify({ v: 1, dev: _deviceId(), updatedAt: new Date().toISOString(), slots, done, pref: pat ? { v: pv, at: pat } : null }) };
  }
  const _seriesUploadedSig = () => { try { return localStorage.getItem(SERIES_SIG_KEY) || ''; } catch (e) { return ''; } };
  function _markSeriesUploaded(sig) { try { localStorage.setItem(SERIES_SIG_KEY, sig); } catch (e) {} }

  // files : fichiers « séries » du Gist. Met à jour les séries en pause et le réglage de CET appareil.
  // Retourne { changed, needUpload, sig, content }.
  function _seriesApply(files) {
    const S = window.App && App.Session;
    if (!S || !S.seriesState || !S.seriesApply) return { changed: false, needUpload: false };
    const me = _deviceId(), now = Date.now(), local = S.seriesState(), max = local.max || 2;
    const remotes = [];
    Object.keys(files || {}).forEach(name => {
      if (!name.startsWith(SERIES_PREFIX) || !name.endsWith(SERIES_SUFFIX)) return;
      if (name.slice(SERIES_PREFIX.length, -SERIES_SUFFIX.length) === me) return;
      try { const j = JSON.parse(files[name]); if (j && j.v === 1) remotes.push(j); } catch (e) {}
    });
    // Traces (séries terminées / abandonnées) : la plus récente l'emporte ; on oublie celles de plus de 60 jours.
    const done = Object.assign({}, local.done);
    remotes.forEach(j => { const d = j.done && typeof j.done === 'object' ? j.done : {}; Object.keys(d).forEach(sid => { if (_isNum(d[sid]) && d[sid] > (done[sid] || 0)) done[sid] = d[sid]; }); });
    Object.keys(done).forEach(sid => { if (!(done[sid] >= now - SERIES_REMOTE_MAX_AGE)) delete done[sid]; });
    // Séries : pour chaque identifiant, la version la plus récente (locale ou distante).
    const best = {};
    const take = (r, remote) => {
      if (!r || !r.sid || !Array.isArray(r.queue) || !r.queue.length) return;
      if (remote && !(r.at > now - SERIES_REMOTE_MAX_AGE)) return;
      if (!best[r.sid] || (r.at || 0) > (best[r.sid].at || 0)) best[r.sid] = r;
    };
    local.slots.forEach(r => take(r, false));
    remotes.forEach(j => (Array.isArray(j.slots) ? j.slots : []).forEach(r => take(r, true)));
    let list = Object.keys(best).map(k => best[k]).filter(r => !((done[r.sid] || 0) >= (r.at || 0)));
    list.sort((x, y) => (y.at || 0) - (x.at || 0));
    list.slice(max).forEach(r => { done[r.sid] = now; });      // au-delà de 2 séries en pause : la plus ancienne est écartée (partout)
    list = list.slice(0, max);
    const key = (sl, dn) => JSON.stringify([sl.map(r => [r.sid, r.at, r.idx]), dn]);
    let changed = key(list, done) !== key(local.slots, local.done);
    if (changed) S.seriesApply(list, done);
    // Réglage « par séries de 10 » : le plus récent l'emporte. Un choix fait avant cette mise à jour (sans heure) est daté d'aujourd'hui.
    let pref = _pref10();
    if (pref.v !== null && !pref.at) { pref.at = now; try { localStorage.setItem(SERIES10_KEY + '_at', String(now)); } catch (e) {} }
    const before = _pref10();
    remotes.forEach(j => { const p = j.pref; if (p && _isNum(p.at) && (p.v === '0' || p.v === '1') && p.at > pref.at) pref = { v: p.v, at: p.at }; });
    if (pref.at !== before.at || pref.v !== before.v) {
      try { localStorage.setItem(SERIES10_KEY, pref.v); localStorage.setItem(SERIES10_KEY + '_at', String(pref.at)); } catch (e) {}
      changed = true;
    }
    const pl = _seriesPayload(list, done, pref.v, pref.at);
    return { changed, needUpload: !pl.empty && pl.sig !== _seriesUploadedSig(), sig: pl.sig, content: pl.content };
  }
  function _refreshSeriesUI() { try { App.Render.resume && App.Render.resume(); } catch (e) {} }

  function _refreshUI() {
    try { App.Render.todayStats(); } catch (e) {}
    try { const sv = document.getElementById('stats-view'); if (sv && sv.style.display !== 'none') App.Render.stats(); } catch (e) {}
  }
  function _saveLogQuiet() { _applying = true; try { App.Store.saveLog(); } finally { _applying = false; } }

  // ── Étapes isolées + fin de cycle ──────────────────────────────
  // Chaque étape d'une synchro (temps, séries, anglais, Grand Oral, affichage…) est exécutée à part : si l'une échoue, les autres
  // continuent, et l'erreur est affichée avec le NOM de l'étape (avant : un message caché dans une infobulle, et tout s'arrêtait).
  function _stepper() {
    const errs = [];
    return { errs, step(label, fn) { try { return fn(); } catch (e) { errs.push(label + ' : ' + ((e && e.message) || e)); return undefined; } } };
  }
  const _NOCHG = { changed: false, needUpload: false };
  function _applyShared(full, S) {
    const t = S.step('journal de temps', () => _timeApply(full.files, full.main)) || _NOCHG;
    if (t.changed) { S.step('enregistrement du temps', _saveLogQuiet); S.step('affichage du temps', _refreshUI); }
    const sr = S.step('séries en pause', () => _seriesApply(full.series)) || _NOCHG;
    if (sr.changed) S.step('affichage des séries', _refreshSeriesUI);
    return { t, sr };
  }
  function _finishOk(S) {
    _lastSync = Date.now(); _retryN = 0; _blockedUntil = 0;
    clearTimeout(_retryTimer); _retryTimer = null;
    if (S && S.errs.length) {
      const msg = S.errs.join(' · ');
      _lastError = { where: 'étapes', msg, at: Date.now() };
      _setStatus('error', 'Synchro partielle — ' + msg);
    } else { _lastError = null; _setStatus('ok'); }
  }
  const _transient = e => !e || e.network || !e.status || e.status >= 500 || e.status === 408;
  function _finishErr(e, where) {
    const msg = (e && e.message) || String(e);
    _lastError = { where, msg, at: Date.now() };
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (offline) { _setStatus('idle', 'Hors ligne — la synchro reprendra à la reconnexion'); return; }
    const retry = isConfigured() && _transient(e) && _retryN < _delays.retry.length;
    _setStatus('error', msg + (e && e.rateLimited ? ' — pause jusqu\'à ' + new Date(_blockedUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '') + (retry ? ' — nouvel essai automatique…' : ''));
    if (retry) _scheduleRetry();
  }
  // Nouvelle tentative automatique après un échec passager. Tant que la toute première lecture n'a pas réussi, on relit tout (pullRemote).
  function _scheduleRetry() {
    if (_retryTimer || !isConfigured() || _retryN >= _delays.retry.length) return;
    const wait = _delays.retry[_retryN++];
    _retryTimer = setTimeout(() => { _retryTimer = null; _auto(true); }, wait);
  }
  function _auto(force) {
    if (!isConfigured()) return Promise.resolve(false);
    if (!force && Date.now() < _blockedUntil) return Promise.resolve(false);        // limite GitHub atteinte : on laisse passer le temps
    return _pulled ? syncTime() : pullRemote();
  }

  // Synchronisation légère du temps : lit le Gist, additionne les journaux, met à jour l'affichage, envoie SEULEMENT le journal de cet appareil.
  async function syncTime() {
    if (!isConfigured()) return false;
    if (_busy) { _again = true; return false; }
    _busy = true;
    try {
      const S = _stepper();
      const full = await _fetchGist();
      const { t, sr } = _applyShared(full, S);
      const up = {};
      if (t.needUpload) up[_timeFile()] = { content: t.content };
      if (sr.needUpload) up[_seriesFile()] = { content: sr.content };
      if (Object.keys(up).length) {
        await _patchFiles(up);
        if (t.needUpload) _markUploaded(t.sig);
        if (sr.needUpload) _markSeriesUploaded(sr.sig);
      }
      _finishOk(S);
      return true;
    } catch (e) {
      _finishErr(e, 'synchro du temps');
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

  // Série en pause ou réglage « par 10 » modifié : même envoi différé que pour le temps.
  const markSeriesDirty = markTimeDirty;

  // Au passage en arrière-plan / fermeture : envoi immédiat de ses propres ajouts (sans lecture), au mieux.
  function _flushOnHide() {
    if (!isConfigured() || _busy) return;
    try {
      const files = {}, marks = [];
      const L = _ledger();
      if (L) {                    // sinon : pas encore migré, la synchro normale s'en chargera
        _foldOwn(L, App.Store.state.studyLog);
        L.applied = _snapshot(App.Store.state.studyLog);
        _saveLedger(L);
        const pl = _payloadOf(L);
        if (pl.sig !== L.uploaded) { files[_timeFile()] = { content: pl.content }; marks.push(() => _markUploaded(pl.sig)); }
      }
      const S = window.App && App.Session;
      if (S && S.seriesState) {
        const st = S.seriesState(), pf = _pref10(), sp = _seriesPayload(st.slots, st.done, pf.v, pf.at);
        if (!sp.empty && sp.sig !== _seriesUploadedSig()) { files[_seriesFile()] = { content: sp.content }; marks.push(() => _markSeriesUploaded(sp.sig)); }
      }
      if (!Object.keys(files).length) return;
      _patchFiles(files, true)
        .catch(() => _patchFiles(files, false))
        .then(() => marks.forEach(m => m())).catch(() => {});
    } catch (e) {}
  }

  function _bindLifecycle() {
    if (_bound) return;
    _bound = true;
    const resume = () => { if (isConfigured() && Date.now() - _lastSync > _delays.minResume) _auto(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) _flushOnHide(); else resume(); });
    window.addEventListener('focus', resume);
    window.addEventListener('online', () => { if (isConfigured()) { _retryN = 0; _auto(true); } });
    window.addEventListener('pagehide', _flushOnHide);
    _periodic = setInterval(() => { if (!document.hidden && isConfigured()) _auto(); }, _delays.periodic);
  }

  // ── Connexion initiale ─────────────────────────────────────────
  async function connect(token) {
    config.token = token.trim();
    _setStatus('syncing');
    try {
      // Vérifie le token
      const user = await _req(`${API}/user`, { headers: _headers() }, 'Vérification du token', true);

      // Cherche un Gist existant
      const gists = await _req(`${API}/gists?per_page=100`, { headers: _headers() }, 'Liste des Gists', true);
      const existing = Array.isArray(gists) ? gists.find(g => g.files?.[FILENAME]) : null;

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
  // force = true (bouton « Envoyer ») : renvoie le fichier principal même s'il n'a pas changé depuis le dernier envoi.
  async function push(force) {
    if (!isConfigured()) return;
    if (_busy) { _again = true; return; }
    _busy = true;
    _setStatus('syncing');
    try {
      const S = _stepper();
      // On relit d'abord le Gist pour ne jamais envoyer un temps périmé : on additionne les journaux des autres appareils.
      const full = await _fetchGist();
      const { t, sr } = _applyShared(full, S);
      const up = {};
      if (t.needUpload) up[_timeFile()] = { content: t.content };
      if (sr.needUpload) up[_seriesFile()] = { content: sr.content };
      // Fichier principal (progression des cartes…, ~580 Ko) : envoyé seulement s'il a changé depuis le dernier envoi.
      const main = _serialize(), msig = _hash(main.replace(/"updatedAt":"[^"]*"/, ''));
      const mainChanged = force === true || msig !== _mainSig();
      if (mainChanged) up[FILENAME] = { content: main };
      if (Object.keys(up).length) await _patchFiles(up);
      if (mainChanged) _markMainUploaded(msig);
      if (t.needUpload) _markUploaded(t.sig);
      if (sr.needUpload) _markSeriesUploaded(sr.sig);
      _finishOk(S);
    } catch(e) {
      _finishErr(e, 'envoi');
    } finally {
      _busy = false;
      if (_again) { _again = false; setTimeout(syncTime, 500); }
    }
  }

  // Push différé : quelques secondes après la dernière modification (au plus 60 s d'attente si les modifications s'enchaînent).
  function pushDebounced() {
    if (!isConfigured()) return;
    const now = Date.now();
    if (!_pushSince) _pushSince = now;
    clearTimeout(_pushTimer);
    const wait = Math.min(_delays.pushWait, Math.max(0, _pushSince + _delays.pushMaxWait - now));
    _pushTimer = setTimeout(() => { _pushSince = 0; push(); }, wait);
  }

  // ── Diagnostic ────────────────────────────────────────────────
  // Vérifie le token, le Gist, puis fait une VRAIE synchro et affiche l'erreur exacte (avec l'étape) si elle échoue.
  async function diagnose() {
    const out = [];
    if (!config.token)  { out.push('❌ Pas de token'); return out.join('\n'); }
    if (!config.gistId) { out.push('❌ Pas de Gist ID'); return out.join('\n'); }
    out.push('🔑 Token : ' + config.token.slice(0,12) + '…');
    out.push('📋 Gist ID : ' + config.gistId);
    try {
      const u = await _req(`${API}/user`, { headers: _headers() }, 'Vérification du token', true);
      out.push('✅ Compte : ' + u.login);
    } catch(e) { out.push('❌ ' + e.message); return out.join('\n'); }
    try {
      const gd = await _req(`${API}/gists/${config.gistId}`, { headers: _headers() }, 'Lecture du Gist', true);
      const f  = gd.files?.[FILENAME];
      out.push(f ? `✅ Fichier Gist OK (${(f.size/1024).toFixed(1)} Ko)` : `⚠️ Fichier ${FILENAME} absent du Gist`);
    } catch(e) { out.push('❌ ' + e.message + (e.status === 404 ? ' — Déconnecte et reconnecte' : '')); }
    // Vraie synchro (celle que l'appli fait toute seule), pour voir exactement ce qui coince
    try {
      _retryN = 0;
      const ran = _busy ? null : await (_pulled ? syncTime() : pullRemote());
      if (ran === null) out.push('⏳ Une synchro est déjà en cours — relance le diagnostic dans quelques secondes');
      else if (ran && !_lastError) out.push('✅ Test de synchro réussi');
      else out.push('❌ Test de synchro : ' + (_lastError ? _lastError.msg : 'échec sans détail'));
    } catch (e) { out.push('❌ Test de synchro : ' + ((e && e.message) || e)); }
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
      try {
        const S = window.App && App.Session, st = S && S.seriesState ? S.seriesState() : { slots: [] };
        let other = 0; Object.keys(full.series || {}).forEach(n => { if (n.slice(SERIES_PREFIX.length, -SERIES_SUFFIX.length) === me) return; try { other += ((JSON.parse(full.series[n]).slots) || []).length; } catch (e) {} });
        out.push('▶ Séries en pause : ' + st.slots.length + ' ici · ' + other + ' vue(s) chez les autres appareils (réglage « par 10 » : ' + (_pref10().v === '0' ? 'non' : 'oui') + ')');
      } catch (e) {}
      out.push('   Total affiché ici : ' + mn(App.Store.getDaySeconds(today)) + ' · dernière synchro : ' + (_lastSync ? new Date(_lastSync).toLocaleTimeString('fr-FR') : 'jamais'));
    } catch(e) { out.push('⚠️ Journal de temps : ' + e.message); }
    if (_lastError) out.push('⚠️ Dernière erreur (' + new Date(_lastError.at).toLocaleTimeString('fr-FR') + ', ' + _lastError.where + ') : ' + _lastError.msg);
    return out.join('\n');
  }

  // ── Réception (pull) ──────────────────────────────────────────
  // Une seule lecture à la fois (le démarrage, un retour sur l'appli et le bouton « Récupérer » partagent la même).
  function pullRemote(onProgress) {
    if (!isConfigured()) return Promise.resolve(false);
    if (_pullPromise) return _pullPromise;
    _pullPromise = _pull(onProgress).finally(() => { _pullPromise = null; });
    return _pullPromise;
  }

  async function _pull(onProgress) {
    const prog = onProgress || (() => {});
    _setStatus('syncing');
    try {
      const S = _stepper(), step = S.step;
      prog(20, 'Récupération des données…');
      const full = await _fetchGist();
      const remote = _deserialize(full.main);
      prog(50, 'Fusion des données…');

      // Applique les progrès distants sur les cartes locales
      // (le contenu des cartes reste celui de l'app)
      step('progression des cartes', () => {
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
      });

      // Temps et compteurs du jour (journal par appareil) + séries en pause et réglage « par séries de 10 » des autres appareils
      _applyShared({ files: full.files, main: remote, series: full.series }, S);

      step('ordre des matières', () => {
        if (remote.catOrder && remote.catOrder.length > 0)
          App.Store.state.catOrder = (App.Regroup && App.Regroup.remapOrder) ? App.Regroup.remapOrder(remote.catOrder) : remote.catOrder;
      });

      // ── Merge Grand Oral ────────────────────────────────────────
      // Évaluations : union par date exacte (évite les doublons)
      step('Grand Oral (évaluations)', () => {
        if (remote.oralEvals && remote.oralEvals.length > 0) {
          let localEvals = [];
          try { localEvals = JSON.parse(localStorage.getItem('ifsi_oral_evals') || '[]'); } catch(e) {}
          const seen = new Set(localEvals.map(e => e.date));
          remote.oralEvals.forEach(e => { if (e && !seen.has(e.date)) localEvals.push(e); });
          localEvals.sort((a, b) => String((b && b.date) || '').localeCompare(String((a && a.date) || '')));
          localStorage.setItem('ifsi_oral_evals', JSON.stringify(localEvals.slice(0, 50)));
        }
      });
      // Plans : garde le plus long (le plus complet) entre local et distant
      step('Grand Oral (plans)', () => {
        ['p1', 'p2'].forEach(id => {
          const key = 'ifsi_oral_plan_' + id;
          const remoteVal = id === 'p1' ? remote.oralPlanP1 : remote.oralPlanP2;
          if (remoteVal && remoteVal.length > (localStorage.getItem(key) || '').length) {
            localStorage.setItem(key, remoteVal);
          }
        });
      });

      // ── Merge Anglais (étoiles/XP par leçon + série de jours) ──────
      // Par leçon : garde le meilleur des deux appareils (étoiles et XP max),
      // fusionne les mots à revoir. Jamais de perte, juste le meilleur des 2.
      step('anglais (leçons)', () => {
        if (remote.englishProgress) {
          let localEng = {};
          try { localEng = JSON.parse(localStorage.getItem('ifsi_english_progress') || '{}'); } catch(e) {}
          const mergedEng = { ...remote.englishProgress };
          Object.entries(localEng).forEach(([lid, loc]) => {
            loc = loc || {};
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
      });
      // Série de jours : garde la date la plus récente (et le compteur le
      // plus grand en cas d'égalité de date).
      step('anglais (série de jours)', () => {
        if (remote.englishStreak) {
          let localStreak = {};
          try { localStreak = JSON.parse(localStorage.getItem('ifsi_english_streak') || '{}'); } catch(e) {}
          const r = remote.englishStreak, l = localStreak || {};
          let winner = l;
          if (!l.lastDate) winner = r;
          else if (r.lastDate > l.lastDate) winner = r;
          else if (r.lastDate === l.lastDate) winner = (r.count||0) > (l.count||0) ? r : l;
          localStorage.setItem('ifsi_english_streak', JSON.stringify(winner));
        }
      });

      prog(80, 'Sauvegarde…');
      step('sauvegarde des cartes', () => App.Store.save());
      step('sauvegarde du temps', _saveLogQuiet);
      step('sauvegarde de l\'ordre', () => App.Store.saveOrder());
      // Pas de réaffichage complet de l'accueil pendant une série en cours (cas d'une relance automatique tardive)
      const sv = document.getElementById('session-view');
      if (!(sv && sv.style.display && sv.style.display !== 'none')) step('affichage', () => App.Render.all());
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
      _pulled = true;
      _finishOk(S);
      return true;
    } catch(e) {
      _finishErr(e, 'lecture');
      return false;
    }
  }


  // ── Déconnexion ───────────────────────────────────────────────
  function disconnect() {
    clearTimeout(_retryTimer); _retryTimer = null; _retryN = 0; _pulled = false; _lastError = null; _blockedUntil = 0;
    config = { token: '', gistId: '' };
    saveConfig();
    _setStatus('idle');
    _updateUI();
  }

  // ── Statut visuel ──────────────────────────────────────────────
  // Icône + texte dans la fenêtre de synchro (avant : l'icône seule, le message était caché dans une infobulle).
  function _setStatus(s, msg) {
    _status = s;
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    const icons  = { idle:'☁️', syncing:'🔄', ok:'✅', error:'⚠️' };
    const colors = { idle:'#6b7280', syncing:'#2563eb', ok:'#16a34a', error:'#dc2626' };
    const hm = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const labels = { idle: msg || 'Non synchronisé', syncing: 'Synchronisation…', ok: msg || ('Synchronisé · ' + hm), error: msg || 'Erreur de synchro' };
    el.textContent  = (icons[s] || '☁️') + ' ' + (labels[s] || s);
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
      _setStatus('syncing');
      _bindLifecycle();
      // Pull automatique au démarrage (avec délai pour laisser le DOM se charger) ; en cas d'échec : nouvelles tentatives automatiques
      setTimeout(() => { pullRemote(); }, 1000);
    }
  }

  return { init, connect, disconnect, push, pushDebounced, pullRemote, isConfigured, loadConfig, diagnose, syncTime, markTimeDirty, markSeriesDirty,
           lastError: () => _lastError,
           _t: { delays: _delays, config: () => config, setConfig: c => { config = Object.assign({ token: '', gistId: '' }, c); }, ledger: _ledger, deviceId: _deviceId, bind: _bindLifecycle, flush: _flushOnHide, state: () => ({ pulled: _pulled, retryN: _retryN, lastSync: _lastSync, busy: _busy, blockedUntil: _blockedUntil }) } };
})();
