// core/timefix.js — Corriger le temps de travail d'un jour (ex. chrono oublié en marche)
'use strict';
window.App = window.App || {};

App.TimeFix = (() => {
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _hms = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`; };
  let _date = null;

  function _label(key) {
    try { return new Date(key + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return key; }
  }
  function _ov() {
    let ov = document.getElementById('timefix-overlay');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'timefix-overlay'; ov.className = 'overlay';
      ov.onclick = e => { if (e.target === ov) close(); };
      document.body.appendChild(ov);
    }
    return ov;
  }
  function _days() {          // 14 derniers jours (aujourd'hui en premier)
    const base = new Date(App.SRS.todayStr() + 'T12:00:00Z'), out = [];
    for (let i = 0; i < 14; i++) { const d = new Date(base); d.setUTCDate(d.getUTCDate() - i); out.push(d.toISOString().slice(0, 10)); }
    return out;
  }
  function open(date) {
    _date = date || App.SRS.todayStr();
    const ov = _ov();
    const secs = App.Store.getDaySeconds(_date), h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    const running = (_date === App.SRS.todayStr() && App.Session && App.Session.pendingSecs) ? App.Session.pendingSecs() : 0;
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="timefix-title" style="max-width:440px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 id="timefix-title" style="margin:0;font-size:1.15rem">✏️ Corriger le temps de travail</h2>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.TimeFix.close()">✕ Fermer</button>
      </div>
      <label style="font-size:.85rem;font-weight:600" for="timefix-day">Jour</label>
      <select id="timefix-day" class="input" style="width:100%;margin:4px 0 12px" onchange="App.TimeFix.open(this.value)">
        ${_days().map(k => `<option value="${k}" ${k === _date ? 'selected' : ''}>${_esc(_label(k))}${k === App.SRS.todayStr() ? " (aujourd'hui)" : ''} — ${_hms(App.Store.getDaySeconds(k))}</option>`).join('')}
      </select>
      <p style="margin:0 0 8px;font-size:.88rem">Temps enregistré ce jour-là : <strong id="timefix-cur">${_hms(secs)}</strong></p>
      ${running ? `<p style="margin:0 0 8px;font-size:.8rem;color:#b45309">⚠ Une session est en cours (${_hms(running)} pas encore enregistrés). Termine-la d'abord : son temps s'ajoutera à la fin.</p>` : ''}
      <div style="display:flex;gap:8px;align-items:center;margin:8px 0">
        <label style="font-size:.85rem;font-weight:600" for="timefix-h">Nouveau total</label>
        <input id="timefix-h" class="input" type="number" inputmode="numeric" min="0" max="24" step="1" value="${h}" style="width:70px" aria-label="Heures"> <span>h</span>
        <input id="timefix-m" class="input" type="number" inputmode="numeric" min="0" max="59" step="1" value="${m}" style="width:70px" aria-label="Minutes"> <span>min</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px">
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.TimeFix.minus(30)">− 30 min</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.TimeFix.minus(60)">− 1 h</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.TimeFix.minus(120)">− 2 h</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="App.TimeFix.zero()">Remettre à 0</button>
      </div>
      <p style="font-size:.78rem;color:var(--gray-500);margin:0 0 12px">Si tu baisses le total, on retire d'abord le temps « cartes », puis on réduit proportionnellement l'anglais, la simulation et les entraînements. Les cartes révisées ne changent pas. La correction est aussi envoyée à la synchro.</p>
      <div id="timefix-msg" role="status" style="min-height:1.2em;font-size:.82rem;color:#059669"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn btn-ghost" onclick="App.TimeFix.close()">Annuler</button><button type="button" class="btn btn-primary" onclick="App.TimeFix.save()">✔ Enregistrer</button></div>
    </div>`;
    ov.classList.add('open');
  }
  function _read() { return Math.max(0, parseInt(document.getElementById('timefix-h').value, 10) || 0) * 3600 + Math.max(0, parseInt(document.getElementById('timefix-m').value, 10) || 0) * 60; }
  function _write(secs) { secs = Math.max(0, secs); document.getElementById('timefix-h').value = Math.floor(secs / 3600); document.getElementById('timefix-m').value = Math.floor((secs % 3600) / 60); }
  function minus(min) { _write(_read() - min * 60); }
  function zero() { _write(0); }
  function save() {
    if (!_date) return;
    const total = _read();
    if (total > 24 * 3600) { document.getElementById('timefix-msg').textContent = 'Un jour ne dépasse pas 24 h.'; return; }
    const before = App.Store.getDaySeconds(_date);
    App.Store.setDaySeconds(_date, total);
    try { App.Render.all(); App.Render.stats(); } catch (e) {}
    const m = document.getElementById('timefix-msg'); if (m) m.textContent = `✓ ${_label(_date)} : ${_hms(before)} → ${_hms(total)}`;
    setTimeout(close, 700);
  }
  function close() { const ov = document.getElementById('timefix-overlay'); if (ov) { ov.classList.remove('open'); ov.innerHTML = ''; } _date = null; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('timefix-overlay')?.classList.contains('open')) { e.stopImmediatePropagation(); close(); } }, true);

  return { open, close, save, minus, zero };
})();
