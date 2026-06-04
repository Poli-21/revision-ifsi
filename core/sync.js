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
    // Données Grand Oral
    let oralEvals = [];
    try { oralEvals = JSON.parse(localStorage.getItem('ifsi_oral_evals') || '[]'); } catch(e) {}
    return JSON.stringify({
      v: 2,
      updatedAt: new Date().toISOString(),
      progress,
      studyLog: state.studyLog,
      catOrder: state.catOrder,
      oralEvals,
      oralPlanP1: localStorage.getItem('ifsi_oral_plan_p1') || '',
      oralPlanP2: localStorage.getItem('ifsi_oral_plan_p2') || ''
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
      oralPlanP2: typeof data.oralPlanP2 === 'string' ? data.oralPlanP2 : null
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
    return out.join('\n');
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

      prog(80, 'Sauvegarde…');
      App.Store.save();
      App.Store.saveLog();
      App.Store.saveOrder();
      App.Render.all();
      // Rafraîchit l'historique Grand Oral si le module est visible
      if (window.App?.Oral) {
        try { App.Oral.refreshHistory && App.Oral.refreshHistory(); } catch(e) {}
      }
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
      // Pull automatique au démarrage (avec délai pour laisser le DOM se charger)
      setTimeout(pullRemote, 1000);
    }
  }

  return { init, connect, disconnect, push, pushDebounced, pullRemote, isConfigured, loadConfig, diagnose };
})();
