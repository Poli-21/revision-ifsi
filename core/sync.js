// core/sync.js — Synchronisation via GitHub Gist
'use strict';
window.App = window.App || {};

App.Sync = (() => {
  const SYNC_KEY  = 'ifsi_sync_config';
  const API       = 'https://api.github.com';
  const FILENAME  = 'ifsi-srs-data.json';

  let config  = { token: '', gistId: '' };
  let _pushTimer = null;
  let _status = 'idle'; // idle | syncing | ok | error

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

  async function _updateGist() {
    const payload = { files: { [FILENAME]: { content: _serialize() } } };
    const res = await fetch(`${API}/gists/${config.gistId}`, { method: 'PATCH', headers: _headers(), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Mise à jour Gist échouée (${res.status})`);
  }

  async function _fetchGist() {
    const res = await fetch(`${API}/gists/${config.gistId}`, { headers: _headers() });
    if (!res.ok) throw new Error(`Lecture Gist échouée (${res.status})`);
    const data = await res.json();
    const fileInfo = data.files?.[FILENAME];
    if (!fileInfo) throw new Error('Fichier introuvable dans le Gist');
    // Si tronqué (ancien format lourd) → on écrase avec le nouveau format compact
    if (fileInfo.truncated) {
      await _updateGist();   // pousse le format léger
      return { v: 2, progress: {}, studyLog: {}, catOrder: [] }; // repart de zéro côté merge
    }
    return JSON.parse(fileInfo.content);
  }

  // ── Sérialisation ──────────────────────────────────────────────
  // On ne sync que les progrès SRS + log + ordre (pas le contenu des cartes)
  function _serialize() {
    const { state } = App.Store;
    const progress = {};
    state.cards.forEach(c => { if (c.progress) progress[c.id] = c.progress; });
    return JSON.stringify({
      v: 2,
      updatedAt: new Date().toISOString(),
      progress,               // { cardId: progressObject }
      studyLog: state.studyLog,
      catOrder: state.catOrder
    }, null, 0);
  }

  function _deserialize(data) {
    return {
      progress: data.progress && typeof data.progress === 'object' ? data.progress : {},
      studyLog: data.studyLog && typeof data.studyLog === 'object' ? data.studyLog : {},
      catOrder: Array.isArray(data.catOrder) ? data.catOrder : [],
      updatedAt: data.updatedAt || ''
    };
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
        _setStatus('ok', `Connecté · ${user.login}`);
        return { ok: true, msg: `Gist existant trouvé · ${user.login}` };
      } else {
        // Crée un nouveau Gist avec les données locales
        config.gistId = await _createGist();
        saveConfig();
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
    _setStatus('syncing');
    try {
      await _updateGist();
      _setStatus('ok');
    } catch(e) {
      _setStatus('error', e.message);
    }
  }

  // Push différé (évite les appels répétés à chaque keystroke)
  function pushDebounced() {
    if (!isConfigured()) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(push, 1500);
  }

  // ── Réception (pull) ──────────────────────────────────────────
  async function pullRemote(onProgress) {
    const prog = onProgress || (() => {});
    if (!isConfigured()) return false;
    _setStatus('syncing');
    try {
      prog(20, 'Récupération des données…');
      const remote = _deserialize(await _fetchGist());
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

      // Merge log (union des jours, max des valeurs)
      const mergedLog = { ...remote.studyLog };
      Object.entries(App.Store.state.studyLog).forEach(([date, entry]) => {
        if (!mergedLog[date]) mergedLog[date] = entry;
        else mergedLog[date] = {
          reviewed: Math.max(mergedLog[date].reviewed||0, entry.reviewed||0),
          ok:       Math.max(mergedLog[date].ok||0,       entry.ok||0),
          hard:     Math.max(mergedLog[date].hard||0,     entry.hard||0),
          nope:     Math.max(mergedLog[date].nope||0,     entry.nope||0),
          seconds:  Math.max(mergedLog[date].seconds||0,  entry.seconds||0),
        };
      });

      App.Store.state.studyLog = mergedLog;
      if (remote.catOrder && remote.catOrder.length > 0)
        App.Store.state.catOrder = remote.catOrder;

      prog(80, 'Sauvegarde…');
      App.Store.save();
      App.Store.saveLog();
      App.Store.saveOrder();
      App.Render.all();
      prog(100, 'Synchronisé !');
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
    const icons = { idle:'☁️', syncing:'🔄', ok:'✅', error:'⚠️' };
    const colors = { idle:'#6b7280', syncing:'#2563eb', ok:'#16a34a', error:'#dc2626' };
    const labels = { idle:'Non sync.', syncing:'Sync…', ok: msg||'Synchronisé', error: msg||'Erreur sync' };
    el.textContent = `${icons[s]} ${labels[s]}`;
    el.style.color = colors[s];
    if (s === 'syncing') el.style.animation = 'spin .8s linear infinite';
    else el.style.animation = '';
  }

  function _updateUI() {
    const btn = document.getElementById('sync-settings-btn');
    if (btn) btn.textContent = isConfigured() ? '☁️ Sync ON' : '☁️ Sync';
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    loadConfig();
    _updateUI();
    if (isConfigured()) {
      _setStatus('ok', 'Configuré');
      // Pull au démarrage pour récupérer les mises à jour d'autres appareils
      setTimeout(pullRemote, 1000);
    } else {
      _setStatus('idle');
    }
  }

  return { init, connect, disconnect, push, pushDebounced, pullRemote, isConfigured, loadConfig };
})();
