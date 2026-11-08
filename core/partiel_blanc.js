// core/partiel_blanc.js — Partiels blancs : 3 versions par UE, au format réel de l'examen (QRU / QRM, chrono, note /20)
// Les sujets viennent de App.PartielBank (data/partiels_s1.js). Rendu dans #partiels-root (mode Partiels).
// Barème utilisé (hypothèse, à confirmer auprès de ton IFSI) :
//   QRU : 1 point si la bonne réponse, sinon 0.
//   QRM : 1 point si exactement les bonnes réponses ; 0,5 si une seule erreur (oubli OU case en trop) ; sinon 0.
//   QROC : auto-évaluation (tu compares à la réponse modèle et tu te donnes 0, ½ ou 1).
'use strict';
window.App = window.App || {};

App.PartielBlanc = (() => {
  const RUN_KEY  = 'ifsi_pb_run';
  const HIST_KEY = 'ifsi_partiel_history';   // même historique que le quiz : alimente la priorisation par UE
  const LETTERS  = 'ABCDEFGH';

  let _run = null;       // sujet en cours { ue, vid, qs:[{...}], ans:[[]|string], flags:[], cur, endsAt, total, ... }
  let _res = null;       // résultat affiché { run, per:[], pts, note, byCh }
  let _timer = null;
  let _confirm = null;   // null | 'finish' | 'quit'
  let _filter = 'errors';

  // ── Utilitaires ──────────────────────────────────────────────────
  function _esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _root() { return document.getElementById('partiels-root'); }
  function _el(id) { return document.getElementById(id); }
  function _bank(ue) { return App.PartielBank && App.PartielBank.BANK[ue]; }
  function _shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function _fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(r).padStart(2, '0');
  }
  function _loadRun() { try { const r = JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); return r && r.qs ? r : null; } catch (e) { return null; } }
  function _saveRun() { try { if (_run) localStorage.setItem(RUN_KEY, JSON.stringify(_run)); } catch (e) {} }
  function _clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) {} }
  function _hist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } }
  function _addHist(entry) { try { const h = _hist(); h.unshift(entry); localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 100))); } catch (e) {} }
  function _blancHist(ue, vid) { return _hist().filter(h => h.mode === 'blanc' && h.ue === ue && h.v === vid); }
  function _stopTimer() { if (_timer) { clearInterval(_timer); _timer = null; } }

  // ── Bloc affiché dans la fiche d'une UE ──────────────────────────
  function blockHTML(ue) {
    const b = _bank(ue);
    if (!b) {
      const m = App.PartielBank && App.PartielBank.MODALITIES[ue];
      return m ? `<div class="partiel-block"><h3>📝 Partiel blanc</h3><p>${_esc(m)}</p></div>` : '';
    }
    const run = _loadRun();
    const resume = run && run.ue === ue
      ? `<div class="pb-resume">⏸ Un partiel blanc est en pause (${_esc(run.vid)}, ${run.ans.filter(a => a && a.length).length}/${run.qs.length} réponses).
           <button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.resume()">Reprendre →</button>
           <button class="btn btn-ghost btn-sm" onclick="App.PartielBlanc.discard()">Abandonner</button></div>` : '';
    const cards = b.versions.map(v => {
      const h = _blancHist(ue, v.id), last = h[0];
      const n = v.questions.length;
      return `<div class="pb-ver">
        <div class="pb-ver-t">${_esc(v.title)}</div>
        <div class="pb-ver-m">${n} questions · ${b.minutes} min</div>
        <div class="pb-ver-s">${last ? `Dernier : <strong>${last.score}/20</strong> · meilleur : <strong>${Math.max(...h.map(x => x.score))}/20</strong>` : 'Pas encore passé'}</div>
        <button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.start('${ue}','${v.id}')">Passer le sujet →</button>
      </div>`;
    }).join('');
    return `<div class="partiel-block pb-block">
      <h3>📝 Partiels blancs — format réel de l'examen</h3>
      <p><strong>${_esc(b.modality)}</strong> · ${_esc(b.note)} Trois sujets différents, qui couvrent tous les chapitres, notés sur 20 avec correction détaillée.</p>
      ${resume}
      <div class="pb-vers">${cards}</div>
      <p class="pb-fine">Sujets écrits d'après tes notes Notion (${_esc(b.basis)}). Ce ne sont pas des annales officielles : le vrai partiel peut être différent. Barème supposé : QRU 1 point ; QRM 1 point si exact, ½ avec une seule erreur. Les protocoles de ton établissement et ton cours Moodle font foi.</p>
    </div>`;
  }

  // ── Démarrage / reprise ──────────────────────────────────────────
  function start(ue, vid) {
    const b = _bank(ue);
    const v = b && b.versions.find(x => x.id === vid);
    if (!v) return;
    _stopTimer();
    const qs = (b.mix ? _shuffle(v.questions) : v.questions).map(q => {
      if (q.t === 'qroc') return { t: 'qroc', q: q.q, r: q.r, kw: q.kw || [], e: q.e || '', c: q.c, ctx: q.ctx || '' };
      const opts = _shuffle([...q.ok.map(t => ({ t, ok: 1 })), ...q.ko.map(t => ({ t, ok: 0 }))]);
      return { t: q.t, q: q.q, o: opts, e: q.e, c: q.c, chk: !!q.chk, ctx: q.ctx || '' };
    });
    _run = { ue, vid, qs, ans: qs.map(q => q.t === 'qroc' ? '' : []), flags: qs.map(() => 0), cur: 0,
             endsAt: Date.now() + b.minutes * 60000, total: b.minutes * 60000, startedAt: Date.now() };
    _confirm = null; _res = null;
    _saveRun();
    _paintExam(true);
    _startTimer();
  }

  function resume() {
    const r = _loadRun();
    if (!r) return;
    _run = r;
    _run.endsAt = Date.now() + (r.remaining != null ? r.remaining : Math.max(0, r.endsAt - Date.now()));
    delete _run.remaining;
    _confirm = null; _res = null;
    _saveRun();
    _paintExam(true);
    _startTimer();
  }

  function discard() {
    const r = _loadRun(), ue = r ? r.ue : (_run && _run.ue) || null;
    _clearRun(); _run = null;
    if (App.Partiels && ue) App.Partiels.selectUE(ue);
  }

  function _startTimer() { _stopTimer(); _tick(); _timer = setInterval(_tick, 1000); }
  function _tick() {
    if (!_run) { _stopTimer(); return; }
    const t = _el('pb-timer');
    if (!t) { _stopTimer(); return; }                   // l'utilisateur a quitté l'écran d'examen
    const left = _run.endsAt - Date.now();
    t.textContent = '⏱ ' + _fmt(left);
    t.classList.toggle('pb-timer-low', left < 5 * 60000);
    const bar = _el('pb-timebar');
    if (bar) bar.style.width = Math.max(0, Math.min(100, left / _run.total * 100)) + '%';
    if (left <= 0) _submit(true);
  }

  // ── Écran d'examen ───────────────────────────────────────────────
  function _paintExam(full) {
    const root = _root();
    if (!root || !_run) return;
    if (full || !_el('pb-qarea')) {
      const b = _bank(_run.ue);
      root.innerHTML = `
        <div class="pb-head">
          <button class="btn btn-ghost btn-sm" onclick="App.PartielBlanc.askQuit()">⏸ Quitter</button>
          <div class="pb-title">${_esc(_run.ue)} · ${_esc(b ? b.name : '')} — ${_esc(_run.vid)}</div>
          <div class="pb-timer" id="pb-timer">⏱ --:--</div>
        </div>
        <div class="pb-timebar"><div id="pb-timebar"></div></div>
        <div class="pb-nav" id="pb-nav"></div>
        <div id="pb-qarea"></div>
        <div id="pb-confirm"></div>`;
    }
    _paintNav(); _paintQ(); _paintConfirm();
  }

  function _paintNav() {
    const nav = _el('pb-nav');
    if (!nav) return;
    nav.innerHTML = _run.qs.map((q, i) => {
      const a = _run.ans[i], done = q.t === 'qroc' ? !!(a && a.trim()) : !!(a && a.length);
      return `<button class="pb-n ${i === _run.cur ? 'cur' : ''} ${done ? 'done' : ''} ${_run.flags[i] ? 'flag' : ''}" onclick="App.PartielBlanc.go(${i})" aria-label="Question ${i + 1}">${i + 1}</button>`;
    }).join('');
  }

  function _paintQ() {
    const area = _el('pb-qarea');
    if (!area) return;
    const i = _run.cur, q = _run.qs[i], n = _run.qs.length;
    let body = '';
    if (q.t === 'qroc') {
      body = `<textarea class="pb-qroc" id="pb-qroc" placeholder="Rédige ta réponse, comme sur la copie…" oninput="App.PartielBlanc.typeQroc(this.value)">${_esc(_run.ans[i])}</textarea>`;
    } else {
      const sel = _run.ans[i] || [];
      body = `<div class="pb-opts">` + q.o.map((o, k) => `
        <button class="pb-opt ${sel.includes(k) ? 'sel' : ''} ${q.t}" role="${q.t === 'qru' ? 'radio' : 'checkbox'}" aria-checked="${sel.includes(k)}" onclick="App.PartielBlanc.pick(${k})">
          <span class="pb-box">${sel.includes(k) ? (q.t === 'qru' ? '●' : '✓') : ''}</span>
          <span class="pb-let">${LETTERS[k]}</span><span class="pb-txt">${_esc(o.t)}</span>
        </button>`).join('') + `</div>`;
    }
    const kind = q.t === 'qru' ? 'QRU — une seule réponse exacte' : q.t === 'qrm' ? 'QRM — une ou plusieurs réponses exactes' : 'QROC — réponse rédigée';
    area.innerHTML = `
      <div class="pb-card">
        <div class="pb-qmeta"><span>Question ${i + 1} / ${n}</span><span class="pb-kind ${q.t}">${kind}</span></div>
        ${q.ctx ? `<div class="pb-ctx"><div class="pb-ctx-t">📋 Situation clinique</div><div>${_esc(q.ctx)}</div></div>` : ''}
        <div class="pb-q">${_esc(q.q)}</div>
        ${body}
      </div>
      <div class="pb-actions">
        <button class="btn btn-ghost btn-sm" onclick="App.PartielBlanc.go(${i - 1})" ${i === 0 ? 'disabled' : ''}>← Précédente</button>
        <button class="btn btn-ghost btn-sm ${_run.flags[i] ? 'pb-flagged' : ''}" onclick="App.PartielBlanc.flag()">${_run.flags[i] ? '🚩 À revoir (retirer)' : '🏳 Marquer à revoir'}</button>
        ${i < n - 1
          ? `<button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.go(${i + 1})">Suivante →</button>`
          : `<button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.askFinish()">Rendre la copie</button>`}
      </div>
      ${i < n - 1 ? `<div class="pb-finish-row"><button class="btn btn-ghost btn-sm" onclick="App.PartielBlanc.askFinish()">Rendre la copie maintenant</button></div>` : ''}`;
  }

  function _paintConfirm() {
    const box = _el('pb-confirm');
    if (!box) return;
    if (!_confirm) { box.innerHTML = ''; return; }
    const blank = _run.qs.filter((q, i) => q.t === 'qroc' ? !(_run.ans[i] || '').trim() : !(_run.ans[i] || []).length).length;
    const flagged = _run.flags.filter(Boolean).length;
    const msg = _confirm === 'finish'
      ? `<strong>Rendre la copie ?</strong><br>${blank ? `${blank} question${blank > 1 ? 's' : ''} sans réponse. ` : 'Toutes les questions ont une réponse. '}${flagged ? `${flagged} marquée${flagged > 1 ? 's' : ''} « à revoir ». ` : ''}Tu ne pourras plus modifier tes réponses.`
      : `<strong>Mettre en pause ?</strong><br>Tes réponses et le temps restant sont conservés : tu pourras reprendre depuis la fiche de l'UE.`;
    box.innerHTML = `<div class="pb-confirm-wrap"><div class="pb-confirm">
      <p>${msg}</p>
      <div class="pb-confirm-btns">
        <button class="btn btn-ghost btn-sm" onclick="App.PartielBlanc.cancelConfirm()">Annuler</button>
        <button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.${_confirm === 'finish' ? 'finish' : 'quit'}()">${_confirm === 'finish' ? 'Rendre la copie' : 'Mettre en pause'}</button>
      </div></div></div>`;
  }

  // ── Interactions ─────────────────────────────────────────────────
  function pick(k) {
    if (!_run) return;
    const i = _run.cur, q = _run.qs[i];
    if (q.t === 'qroc') return;
    let sel = (_run.ans[i] || []).slice();
    if (q.t === 'qru') sel = sel.length === 1 && sel[0] === k ? [] : [k];
    else sel = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].sort((a, b) => a - b);
    _run.ans[i] = sel;
    _saveRun(); _paintNav(); _paintQ();
  }
  function typeQroc(v) { if (_run) { _run.ans[_run.cur] = v; _saveRun(); _paintNav(); } }
  function go(n) {
    if (!_run || n < 0 || n >= _run.qs.length) return;
    _run.cur = n; _saveRun(); _paintNav(); _paintQ();
    const nav = _el('pb-nav'); const b = nav && nav.children[n]; if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function flag() { if (!_run) return; _run.flags[_run.cur] = _run.flags[_run.cur] ? 0 : 1; _saveRun(); _paintNav(); _paintQ(); }
  function askFinish() { _confirm = 'finish'; _paintConfirm(); }
  function askQuit() { _confirm = 'quit'; _paintConfirm(); }
  function cancelConfirm() { _confirm = null; _paintConfirm(); }
  function finish() { _submit(false); }
  function quit() {
    if (!_run) return;
    _stopTimer();
    _run.remaining = Math.max(0, _run.endsAt - Date.now());   // le temps est figé pendant la pause
    _saveRun();
    const ue = _run.ue; _run = null; _confirm = null;
    if (App.Partiels) App.Partiels.selectUE(ue);
  }

  // ── Notation ─────────────────────────────────────────────────────
  function _scoreQ(q, sel) {
    if (q.t === 'qroc') return null;
    sel = sel || [];
    const good = q.o.map((o, k) => o.ok ? k : -1).filter(k => k >= 0);
    if (q.t === 'qru') return sel.length === 1 && good.includes(sel[0]) ? 1 : 0;
    const errs = good.filter(k => !sel.includes(k)).length + sel.filter(k => !good.includes(k)).length;
    return errs === 0 ? 1 : errs === 1 && sel.length ? 0.5 : 0;
  }

  function _compute() {
    const r = _res.run;
    _res.per = r.qs.map((q, i) => q.t === 'qroc' ? (r.self && r.self[i] != null ? r.self[i] : null) : _scoreQ(q, r.ans[i]));
    const N = r.qs.length;
    _res.pts = _res.per.reduce((s, x) => s + (x || 0), 0);
    _res.note = Math.round(_res.pts / N * 20 * 10) / 10;
    const by = {};
    r.qs.forEach((q, i) => { const o = by[q.c] || (by[q.c] = { pts: 0, n: 0 }); o.n++; o.pts += _res.per[i] || 0; });
    _res.byCh = by;
  }

  function _submit(auto) {
    if (!_run) return;
    _stopTimer();
    _res = { run: _run, auto: !!auto, saved: false };
    _run = null; _confirm = null;
    _clearRun();
    _compute();
    _filter = 'errors';
    if (!_res.run.qs.some(q => q.t === 'qroc')) _saveResult();
    _paintResult();
  }

  function _saveResult() {
    if (_res.saved) return;
    _res.saved = true;
    _addHist({ date: new Date().toISOString().slice(0, 10), ue: _res.run.ue, score: _res.note, total: _res.run.qs.length,
               correct: Math.round(_res.pts * 10) / 10, mode: 'blanc', v: _res.run.vid });
  }

  function selfMark(i, v) { if (!_res) return; _res.run.self = _res.run.self || {}; _res.run.self[i] = v; _compute(); _paintResult(); }
  function saveSelf() { if (_res) { _saveResult(); _paintResult(); } }

  // ── Écran de résultat / correction ───────────────────────────────
  function setFilter(f) { _filter = f; _paintResult(); }

  function _paintResult() {
    const root = _root();
    if (!root || !_res) return;
    const r = _res.run, b = _bank(r.ue), N = r.qs.length;
    const color = _res.note >= 12 ? 'var(--success)' : _res.note >= 10 ? 'var(--warning)' : 'var(--danger)';
    const pending = r.qs.some((q, i) => q.t === 'qroc' && _res.per[i] == null);
    const verdict = _res.note >= 10 ? 'Au-dessus de 10/20.' : 'Sous la barre des 10/20 : reprends les chapitres en rouge ci-dessous.';
    const chs = Object.entries(_res.byCh).map(([c, o]) => ({ c, pct: o.pts / o.n, pts: o.pts, n: o.n })).sort((a, b2) => a.pct - b2.pct);
    const chRows = chs.map(x => {
      const lbl = App.PartielBank.CH[x.c] || x.c, p = Math.round(x.pct * 100);
      const col = p >= 70 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';
      return `<div class="pb-ch"><div class="pb-ch-l">${_esc(lbl)}</div><div class="pb-ch-bar"><div style="width:${p}%;background:${col}"></div></div><div class="pb-ch-v">${x.pts % 1 ? x.pts.toFixed(1) : x.pts}/${x.n}</div></div>`;
    }).join('');
    const items = r.qs.map((q, i) => ({ q, i, s: _res.per[i] }))
      .filter(x => _filter === 'all' || x.q.t === 'qroc' || (x.s || 0) < 1 || (r.flags && r.flags[x.i]));
    const list = items.map(x => _reviewItem(x.q, x.i, x.s)).join('') || '<p class="partiel-empty">🎉 Aucune erreur sur cette copie.</p>';
    root.innerHTML = `
      <div class="pb-res">
        <div class="pb-score" style="color:${color}">${_res.note} / 20</div>
        <p class="pb-sub">${_esc(r.ue)} · ${_esc(b ? b.name : '')} — ${_esc(r.vid)} · ${_res.pts % 1 ? _res.pts.toFixed(1) : _res.pts} points sur ${N}${_res.auto ? ' · temps écoulé, copie rendue automatiquement' : ''}</p>
        <p class="pb-sub">${pending ? 'Auto-évalue les questions rédigées pour obtenir la note finale.' : _esc(verdict)}</p>
        <div class="pb-chs"><h4>Résultat par chapitre</h4>${chRows}</div>
        <div class="pb-filter">
          <button class="btn btn-sm ${_filter === 'errors' ? 'btn-primary' : 'btn-ghost'}" onclick="App.PartielBlanc.setFilter('errors')">Mes erreurs et 🚩</button>
          <button class="btn btn-sm ${_filter === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="App.PartielBlanc.setFilter('all')">Toutes les questions</button>
        </div>
        <div id="pb-fc-bar" class="pb-fc-bar">${_fcBarHTML()}</div>
        <div class="pb-review">${list}</div>
        <div class="pb-end">
          ${r.qs.some(q => q.t === 'qroc') && !_res.saved ? `<button class="btn btn-primary" onclick="App.PartielBlanc.saveSelf()">Enregistrer la note</button>` : ''}
          <button class="btn btn-primary" onclick="App.PartielBlanc.start('${r.ue}','${r.vid}')">↺ Refaire ce sujet</button>
          <button class="btn btn-ghost" onclick="App.PartielBlanc.leave()">← Retour à l'UE</button>
        </div>
        <p class="pb-fine">Sujets écrits d'après tes notes de cours — pas des annales. Barème supposé (QRU 1 pt ; QRM 1 pt, ½ avec une erreur). Vérifie les points marqués « à valider » dans ton cours Moodle.</p>
      </div>`;
    window.scrollTo && window.scrollTo(0, 0);
  }

  function _reviewItem(q, i, s) {
    const r = _res.run, sel = r.ans[i];
    const st = s == null ? '' : s === 1 ? '<span class="pb-st ok">✔ 1 point</span>' : s === 0.5 ? '<span class="pb-st half">½ point</span>' : '<span class="pb-st ko">✖ 0 point</span>';
    let body;
    if (q.t === 'qroc') {
      body = `<div class="pb-qroc-r"><strong>Ta réponse :</strong><p>${_esc(sel) || '<em>(vide)</em>'}</p><strong>Réponse modèle :</strong><p>${_esc(q.r)}</p>
        ${q.kw && q.kw.length ? `<p class="pb-kw">Mots-clés attendus : ${q.kw.map(k => `<span>${_esc(k)}</span>`).join('')}</p>` : ''}
        <div class="pb-self">Ta note : ${[0, 0.5, 1].map(v => `<button class="btn btn-sm ${r.self && r.self[i] === v ? 'btn-primary' : 'btn-ghost'}" onclick="App.PartielBlanc.selfMark(${i},${v})">${v === 0.5 ? '½' : v}</button>`).join(' ')}</div></div>`;
    } else {
      body = '<div class="pb-ropts">' + q.o.map((o, k) => {
        const chosen = (sel || []).includes(k);
        const cls = o.ok && chosen ? 'right' : o.ok ? 'miss' : chosen ? 'wrong' : '';
        const tag = o.ok && chosen ? 'bonne réponse cochée' : o.ok ? 'bonne réponse oubliée' : chosen ? 'cochée à tort' : '';
        return `<div class="pb-ropt ${cls}"><span class="pb-let">${LETTERS[k]}</span><span class="pb-txt">${_esc(o.t)}</span>${tag ? `<span class="pb-tag">${tag}</span>` : ''}</div>`;
      }).join('') + '</div>';
    }
    const src = App.PartielBank.CH[q.c] || q.c;
    return `<div class="pb-ri">
      <div class="pb-ri-h"><span>Question ${i + 1} · ${q.t.toUpperCase()}${r.flags && r.flags[i] ? ' · 🚩 à revoir' : ''}</span>${st}</div>
      ${q.ctx ? `<details class="pb-ctx-d"><summary>📋 Situation clinique</summary><div>${_esc(q.ctx)}</div></details>` : ''}
      <div class="pb-q">${_esc(q.q)}</div>${body}
      <div class="pb-expl"><strong>Explication :</strong> ${_esc(q.e)}${q.chk ? ' <em>(point issu des compléments de tes notes : à valider avec ton cours)</em>' : ''}
        <div class="pb-src">Source : ${_esc(src)}</div></div>
      <div class="pb-fc-row"><button class="btn btn-ghost btn-sm" data-fc="${i}" onclick="App.PartielBlanc.addCard(${i})" ${_hasCard(q) ? 'disabled' : ''}>${_hasCard(q) ? '✓ Dans tes flashcards' : '🧠 Ajouter aux flashcards'}</button></div>
    </div>`;
  }

  // ── « À revoir » → flashcards ────────────────────────────────────
  // Une question du partiel devient une carte de ton paquet (matière « À revoir - <UE> », tag UE conservé) :
  // elle entre alors dans la répétition espacée. Identifiant stable → jamais de doublon.
  function _hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function _cardId(q) { return 'pbr_' + String(_res.run.ue).replace(/[^A-Za-z0-9]/g, '') + '_' + _hash(String(q.q)); }
  function _hasCard(q) { return !!(App.Store && App.Store.state.cards.some(c => c.id === _cardId(q))); }
  function _revisionSet() {
    const r = _res.run;
    return r.qs.map((q, i) => i).filter(i => (r.flags && r.flags[i]) || (_res.per[i] != null && _res.per[i] < 1));
  }
  function _cardFromQ(q) {
    const one = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    let term = one(q.q), def, ex;
    if (q.t === 'qroc') {
      def = q.r;
      ex = [q.kw && q.kw.length ? 'Mots-clés : ' + q.kw.join(' · ') : '', q.e].filter(Boolean).join('\n');
    } else {
      const good = q.o.filter(o => o.ok).map(o => '• ' + o.t), bad = q.o.filter(o => !o.ok).map(o => '• ' + o.t);
      if (q.t === 'qrm') term += ' (plusieurs réponses possibles)';
      if (/propositions|affirmation|lesquel|laquelle|ci-dessous|suivant/i.test(q.q)) term += ' [' + q.o.map((o, k) => LETTERS[k] + '. ' + o.t).join(' ; ') + ']';
      def = (good.length > 1 ? '✔ Bonnes réponses :\n' : '✔ Bonne réponse :\n') + good.join('\n') + '\n\n✖ Fausses :\n' + bad.join('\n');
      ex = one(q.e) + (q.chk ? ' (à valider avec ton cours)' : '');
    }
    if (q.ctx) ex = (ex ? ex + '\n\n' : '') + 'Situation : ' + one(q.ctx);
    return { id: _cardId(q), cat: App.Store.normCat('À revoir - ' + _res.run.ue), term, def, example: ex || null,
             ue: _res.run.ue, type: null, customImage: null, suspended: false, progress: null, src: 'partiel-blanc' };
  }
  function _toast(msg) {
    try { if (typeof window._showToast === 'function') return window._showToast(msg); } catch (e) {}
    let t = document.getElementById('pb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'pb-toast'; t.className = 'pb-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3200);
  }
  function _addMany(idxs) {
    if (!_res || !App.Store) return 0;
    const have = new Set(App.Store.state.cards.map(c => c.id));
    let n = 0;
    idxs.forEach(i => {
      const q = _res.run.qs[i];
      if (!q || have.has(_cardId(q))) return;
      App.Store.state.cards.push(_cardFromQ(q)); have.add(_cardId(q)); n++;
    });
    if (n) {
      App.Store.save();
      try { if (App.Render && App.Render.all) App.Render.all(); } catch (e) {}
    }
    _refreshFc();
    return n;
  }
  function addCard(i) {
    const n = _addMany([i]);
    _toast(n ? '🧠 Question ajoutée à tes flashcards (matière « À revoir - ' + _res.run.ue + ' »)' : 'Cette question est déjà dans tes flashcards');
  }
  function addAll() {
    if (!_res) return;
    const n = _addMany(_revisionSet());
    _toast(n ? '🧠 ' + n + ' carte' + (n > 1 ? 's' : '') + ' ajoutée' + (n > 1 ? 's' : '') + ' à tes flashcards (« À revoir - ' + _res.run.ue + ' »)' : 'Tout est déjà dans tes flashcards');
  }
  function _fcBarHTML() {
    if (!_res) return '';
    const r = _res.run, set = _revisionSet();
    if (!set.length) return `<span class="pb-fc-t">🧠 Flashcards</span><span class="pb-fc-s">Aucune erreur ni question marquée : rien à ajouter. Tu peux quand même ajouter une question précise avec son bouton.</span>`;
    const errs = set.filter(i => _res.per[i] != null && _res.per[i] < 1).length, flg = set.filter(i => r.flags && r.flags[i]).length;
    const todo = set.filter(i => !_hasCard(r.qs[i])).length;
    return `<span class="pb-fc-t">🧠 Flashcards</span>
      <span class="pb-fc-s">${set.length} question${set.length > 1 ? 's' : ''} à revoir (${errs} erreur${errs > 1 ? 's' : ''}, ${flg} marquée${flg > 1 ? 's' : ''} 🚩) : en faire des cartes de révision espacée.</span>
      <button class="btn btn-primary btn-sm" onclick="App.PartielBlanc.addAll()" ${todo ? '' : 'disabled'}>${todo ? 'Ajouter à mes flashcards (' + todo + ')' : '✓ Déjà dans tes flashcards'}</button>`;
  }
  function _refreshFc() {
    const bar = _el('pb-fc-bar'); if (bar) bar.innerHTML = _fcBarHTML();
    document.querySelectorAll('[data-fc]').forEach(b => {
      const q = _res && _res.run.qs[+b.dataset.fc]; if (!q) return;
      const has = _hasCard(q); b.disabled = has; b.textContent = has ? '✓ Dans tes flashcards' : '🧠 Ajouter aux flashcards';
    });
  }

  function leave() {
    const ue = _res ? _res.run.ue : null;
    _res = null;
    if (App.Partiels && ue) App.Partiels.selectUE(ue);
  }

  return {
    blockHTML, start, resume, discard, pick, typeQroc, go, flag,
    askFinish, askQuit, cancelConfirm, finish, quit,
    setFilter, selfMark, saveSelf, leave, addCard, addAll,
    _scoreQ   // exposé pour les tests
  };
})();
