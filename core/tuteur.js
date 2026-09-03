// core/tuteur.js — Tuteur IA (chat) : discussion libre avec Gemini,
// contexte IFSI/référentiel 2026 injecté côté core/ai.js (systemInstruction).
'use strict';
window.App = window.App || {};

App.Tuteur = (() => {
  const HIST_KEY   = 'ifsi_tuteur_chat';
  const MAX_STORED = 60;   // messages conservés en local
  const MAX_CONTEXT = 16;  // derniers messages envoyés à l'API à chaque tour

  let _history = [];   // [{role:'user'|'model', text}]
  let _sending = false;

  function _load() {
    try { _history = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch(e) { _history = []; }
  }
  function _save() {
    localStorage.setItem(HIST_KEY, JSON.stringify(_history.slice(-MAX_STORED)));
  }

  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _el(id) { return document.getElementById(id); }

  // Rendu minimal du markdown Gemini (gras/italique/listes/sauts de ligne) sans dépendance externe.
  function _md(text) {
    let h = _esc(text);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(?:^|\n)[-*] (.+)/g, '\n• $1');
    h = h.replace(/\n/g, '<br>');
    return h;
  }

  function init() {
    _load();
    const root = _el('tuteur-root');
    if (!root) return;

    if (!App.AI.isConfigured()) {
      root.innerHTML = `
        <div class="tuteur-empty">
          <h2 style="margin:0 0 6px;font-size:1.2rem">🤖 Tuteur IA</h2>
          <p>Configure ta clé API Gemini pour discuter avec le tuteur IA (questions de cours, explications, entraînement oral…).</p>
          <button class="btn btn-primary" onclick="openSyncModal()">⚙️ Ouvrir les réglages</button>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="tuteur-head">
        <div>
          <h2 style="margin:0;font-size:1.15rem">🤖 Tuteur IA</h2>
          <p style="margin:2px 0 0;font-size:.78rem;color:var(--gray-500)">Pose une question de cours, demande une explication, entraîne-toi à l'oral…</p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.Tuteur.clearChat()">🗑 Effacer</button>
      </div>
      <div class="tuteur-log" id="tuteur-log"></div>
      <div class="tuteur-input-row">
        <textarea id="tuteur-input" placeholder="Écris ta question… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)" onkeydown="App.Tuteur._onKeydown(event)"></textarea>
        <button class="btn btn-primary" id="tuteur-send-btn" onclick="App.Tuteur.send()">➤</button>
      </div>
    `;
    _paintLog();
  }

  function _onKeydown(ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); send(); }
  }

  function _paintLog() {
    const log = _el('tuteur-log');
    if (!log) return;
    if (!_history.length) {
      log.innerHTML = `<p class="tuteur-hint">💬 Dis bonjour, ou pose directement une question sur ton programme IFSI.</p>`;
    } else {
      log.innerHTML = _history.map(m =>
        `<div class="tuteur-bubble tuteur-bubble-${m.role === 'user' ? 'user' : 'model'}">${_md(m.text)}</div>`
      ).join('');
    }
    log.scrollTop = log.scrollHeight;
  }

  function _setSending(on) {
    _sending = on;
    const btn = _el('tuteur-send-btn');
    if (btn) { btn.disabled = on; btn.textContent = on ? '…' : '➤'; }
  }

  async function send() {
    if (_sending) return;
    const inp = _el('tuteur-input');
    const text = inp?.value.trim();
    if (!text) return;
    inp.value = '';
    _history.push({ role: 'user', text });
    _save();
    _paintLog();
    _setSending(true);

    const log = _el('tuteur-log');
    const typing = document.createElement('div');
    typing.className = 'tuteur-bubble tuteur-bubble-model tuteur-bubble-typing';
    typing.textContent = '···';
    log?.appendChild(typing);
    if (log) log.scrollTop = log.scrollHeight;

    try {
      const context = _history.slice(-MAX_CONTEXT);
      const reply = await App.AI.chat(context);
      _history.push({ role: 'model', text: reply });
      _save();
    } catch(e) {
      _history.push({ role: 'model', text: `⚠️ ${e.message}` });
    }
    _setSending(false);
    _paintLog();
    inp?.focus();
  }

  function clearChat() {
    if (_history.length && !confirm('Effacer toute la conversation ?')) return;
    _history = [];
    _save();
    _paintLog();
  }

  return { init, send, clearChat, _onKeydown };
})();
