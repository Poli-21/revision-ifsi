// core/pharma.js — Entraînement « Pharmaco » (App.Pharma)
// DCI / spécialité / générique · classes et suffixes · effets indésirables et surveillance.
// 100 % hors ligne. Progression gardée sur cet appareil seulement (localStorage, clé ifsi_pharma_v1) :
// rien n'est envoyé, rien n'est synchronisé, et aucune carte de révision n'est modifiée.
// Le temps passé à s'entraîner est compté par App.Activity (kind « pharma ») → « Temps » du jour.
'use strict';
window.App = window.App || {};

App.Pharma = (() => {
  const KEY = 'ifsi_pharma_v1';
  const MAX_RUNS = 30;
  const N_SERIES = 10, N_MIX = 15, N_MISS = 15;
  const MASTERED = 2;                       // bonnes réponses d'affilée pour dire « maîtrisée »

  let P = { v: 1, q: {}, runs: [] };        // progression
  let screen = 'menu';                      // menu | fiche | repertoire | quiz | bilan
  let ficheTh = null, repFilter = '';
  let run = null;                           // série en cours
  let _keysBound = false;

  const D = () => App.PharmaData;
  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _fmt = s => _esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function _shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function _norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function _lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const _theme = id => D().themes.find(t => t.id === id);
  const _qOf = id => D().questions.find(q => q.id === id);

  // ── Stockage ─────────────────────────────────────────────────
  function _load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.v === 1 && o.q && typeof o.q === 'object') P = { v: 1, q: o.q, runs: Array.isArray(o.runs) ? o.runs : [] };
    } catch (e) { P = { v: 1, q: {}, runs: [] }; }
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  function _rec(id) { return P.q[id] || { n: 0, ok: 0, streak: 0, last: null }; }
  function _isMissed(id) { const r = P.q[id]; return !!r && r.n > 0 && r.last === 0; }
  function _isMastered(id) { const r = P.q[id]; return !!r && r.streak >= MASTERED; }
  function _record(q, ok) {
    const r = _rec(q.id);
    r.n++; if (ok) r.ok++;
    r.streak = ok ? r.streak + 1 : 0;
    r.last = ok ? 1 : 0;
    r.d = new Date().toISOString().slice(0, 10);
    P.q[q.id] = r;
    _save();
  }
  function _stats(thId) {
    const qs = D().questions.filter(q => !thId || q.th === thId);
    const seen = qs.filter(q => (P.q[q.id] || {}).n > 0).length;
    return { total: qs.length, seen, mastered: qs.filter(q => _isMastered(q.id)).length, missed: qs.filter(q => _isMissed(q.id)).length };
  }

  // ── Choix des questions d'une série ──────────────────────────
  function _pick(kind, n) {
    const Q = D().questions;
    let pool = kind === 'mix' ? Q : kind === 'miss' ? Q.filter(q => _isMissed(q.id)) : Q.filter(q => q.th === kind);
    const score = q => {
      const r = P.q[q.id];
      const base = !r || !r.n ? 3 : r.last === 0 ? 4 : r.streak >= MASTERED ? 1 : 2;
      return base + Math.random() * 1.5;
    };
    return _shuffle(pool.map(q => ({ id: q.id, s: score(q) })).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.id));
  }

  // ── Navigation ───────────────────────────────────────────────
  function open() {
    _load(); _bindKeys();
    const root = _el('pharma-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null;
    render();
    _top();
  }
  function close() {
    const root = _el('pharma-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; render(); _top(); }
  function showFiche(thId) { ficheTh = thId; screen = 'fiche'; render(); _top(); }
  function showRepertoire() { screen = 'repertoire'; render(); _top(); }
  function setFilter(v) { repFilter = v || ''; _renderRepRows(); }
  function _top() { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} }
  function isTraining() { return screen === 'quiz' && !!run; }

  // ── Série ────────────────────────────────────────────────────
  function startRun(kind) {
    const n = kind === 'mix' ? N_MIX : kind === 'miss' ? N_MISS : N_SERIES;
    const ids = _pick(kind, n);
    if (!ids.length) { toMenu(); return; }
    _beginRun(kind, ids);
  }
  function retryMistakes() {
    if (!run) return;
    const ids = run.results.filter(r => !r.ok).map(r => r.id);
    if (!ids.length) { toMenu(); return; }
    _beginRun('miss', _shuffle(ids));
  }
  function again() { if (run) startRun(run.kind === 'miss' ? 'miss' : run.kind); }
  function _beginRun(kind, ids) {
    run = { kind, ids, i: 0, results: [], cur: null, quitAsk: false, startedAt: Date.now() };
    screen = 'quiz';
    _initCur();
    render(); _top();
  }
  function _initCur() {
    const q = _qOf(run.ids[run.i]);
    const cur = { id: q.id, done: false, ok: false };
    if (q.t === 'qcm') cur.order = _shuffle([0, 1, 2, 3]), cur.picked = null;
    else if (q.t === 'txt') cur.val = '', cur.near = false, cur.empty = false;
    else if (q.t === 'asc') {
      cur.lOrder = _shuffle([0, 1, 2, 3]); cur.rOrder = _shuffle([0, 1, 2, 3]);
      cur.matched = []; cur.sel = null; cur.errs = 0; cur.flash = null;
    }
    run.cur = cur;
  }
  function askQuit() { if (run) { run.quitAsk = true; render(); } }
  function keepGoing() { if (run) { run.quitAsk = false; render(); } }
  function quit() { toMenu(); }
  function next() {
    if (!run || !run.cur || !run.cur.done) return;
    if (run.i + 1 >= run.ids.length) { _finish(); return; }
    run.i++; _initCur(); render(); _top();
  }
  function _finish() {
    const ok = run.results.filter(r => r.ok).length;
    P.runs.unshift({ d: new Date().toISOString(), k: run.kind, ok, n: run.results.length });
    if (P.runs.length > MAX_RUNS) P.runs.length = MAX_RUNS;
    _save();
    screen = 'bilan'; render(); _top();
  }
  function _answered(q, ok) {
    run.cur.done = true; run.cur.ok = ok;
    run.results.push({ id: q.id, ok, picked: run.cur.picked != null ? run.cur.order[run.cur.picked] : null, val: run.cur.val || '' });
    _record(q, ok);
  }

  // ── Réponses ─────────────────────────────────────────────────
  function pick(k) {                                  // QCM : k = position affichée
    if (!run || screen !== 'quiz') return;
    const cur = run.cur, q = _qOf(cur.id);
    if (cur.done || q.t !== 'qcm' || k < 0 || k > 3) return;
    cur.picked = k;
    _answered(q, cur.order[k] === q.a);
    render(true);
  }
  function submitTxt() {                              // saisie
    if (!run) return;
    const cur = run.cur, q = _qOf(cur.id);
    if (cur.done || q.t !== 'txt') return;
    const inp = _el('ph-in');
    const val = inp ? inp.value : '';
    if (!_norm(val)) { cur.empty = true; render(); return; }
    cur.val = val;
    const g = _gradeTxt(q, val);
    cur.near = g.near;
    _answered(q, g.ok);
    render(true);
  }
  function _gradeTxt(q, val) {
    const n = _norm(val);
    const oks = (q.ok || []).map(_norm);
    if (oks.includes(n)) return { ok: true, near: false };
    const padded = ' ' + n + ' ';
    if (oks.some(s => s && padded.includes(' ' + s + ' '))) return { ok: true, near: false };
    if (q.kw && q.kw.length && q.kw.every(grp => grp.some(w => padded.includes(w)))) return { ok: true, near: false };
    if (oks.some(s => s.length >= 7 && _lev(n, s) <= 1)) return { ok: true, near: true };
    return { ok: false, near: false };
  }
  function ascTap(side, k) {                          // association : k = indice de la paire
    if (!run) return;
    const cur = run.cur, q = _qOf(cur.id);
    if (cur.done || q.t !== 'asc' || cur.flash || cur.matched.includes(k)) return;
    if (cur.sel && cur.sel.side === side) { cur.sel = cur.sel.k === k ? null : { side, k }; render(); return; }
    if (!cur.sel) { cur.sel = { side, k }; render(); return; }
    const lk = side === 'l' ? k : cur.sel.k, rk = side === 'r' ? k : cur.sel.k;
    if (lk === rk) {
      cur.matched.push(lk); cur.sel = null;
      if (cur.matched.length === q.pairs.length) _answered(q, cur.errs === 0);
      render(cur.done);
    } else {
      cur.errs++; cur.flash = { l: lk, r: rk }; cur.sel = null; render();
      setTimeout(() => { if (run && run.cur === cur) { cur.flash = null; render(); } }, 650);
    }
  }

  // ── Rendu ────────────────────────────────────────────────────
  function render(focusFeedback) {
    const root = _el('pharma-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml();
    else if (screen === 'fiche') h = _ficheHtml();
    else if (screen === 'repertoire') h = _repHtml();
    else if (screen === 'quiz') h = _quizHtml();
    else if (screen === 'bilan') h = _bilanHtml();
    root.innerHTML = `<div class="ph-wrap">${h}</div>`;
    if (screen === 'quiz') {
      const q = _qOf(run.cur.id);
      if (q.t === 'txt' && !run.cur.done) { const i = _el('ph-in'); if (i) { try { i.focus({ preventScroll: true }); } catch (e) {} } }
      if (focusFeedback) { const f = _el('ph-fb'); if (f) { try { f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} } }
    }
  }

  function _bar(a, b, cls) { const p = b ? Math.round(a / b * 100) : 0; return `<div class="ph-bar ${cls || ''}"><i style="width:${p}%"></i></div>`; }

  function _menuHtml() {
    const all = _stats(null);
    const cards = D().themes.map(t => {
      const s = _stats(t.id);
      return `<div class="ph-card">
        <div class="ph-th-head"><span class="ph-ico">${t.ico}</span><div><div class="ph-th-name">${_esc(t.name)}</div><div class="ph-muted ph-small">${_esc(t.blurb)}</div></div></div>
        ${_bar(s.mastered, s.total, 'ph-bar-ok')}
        <div class="ph-muted ph-small">${s.mastered} maîtrisée${s.mastered > 1 ? 's' : ''} sur ${s.total} · ${s.seen} vue${s.seen > 1 ? 's' : ''}${s.missed ? ` · <b class="ph-bad-t">${s.missed} à revoir</b>` : ''}</div>
        <div class="ph-row ph-gap">
          <button class="btn btn-ghost" onclick="App.Pharma.showFiche('${t.id}')">📖 Fiche</button>
          <button class="btn btn-primary" onclick="App.Pharma.startRun('${t.id}')">▶ Série de ${N_SERIES}</button>
        </div></div>`;
    }).join('');
    const last = P.runs.slice(0, 3).map(r => {
      const th = r.k === 'mix' ? 'Série mixte' : r.k === 'miss' ? 'Mes erreurs' : (_theme(r.k) || {}).name || r.k;
      return `<div class="ph-hist"><span>${_esc(new Date(r.d).toLocaleDateString('fr-FR'))}</span><span>${_esc(th)}</span><b>${r.ok} / ${r.n}</b></div>`;
    }).join('');
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Pharma.close()">← Entraînement</button></div>
      <h2 class="ph-title">💊 Pharmaco</h2>
      <p class="ph-lead">Des thèmes pour ne plus confondre <b>DCI</b>, <b>spécialité</b> et <b>générique</b>, reconnaître la <b>classe</b> d'un médicament avec son suffixe, savoir ce qu'on <b>surveille</b>, connaître les <b>fiches médicaments</b> et les <b>antidotes</b>. Fiche d'abord si tu veux, puis séries de questions.</p>
      ${cards}
      <div class="ph-row ph-gap ph-wrapr">
        <button class="btn btn-primary" onclick="App.Pharma.startRun('mix')">🔀 Série mixte (${N_MIX})</button>
        <button class="btn btn-ghost" ${all.missed ? '' : 'disabled'} onclick="App.Pharma.startRun('miss')">🔁 Mes erreurs (${all.missed})</button>
        <button class="btn btn-ghost" onclick="App.Pharma.showRepertoire()">📋 Répertoire DCI ↔ spécialités</button>
      </div>
      ${last ? `<h3 class="ph-h">Dernières séries</h3><div class="ph-card">${last}</div>` : ''}
      <div class="ph-note"><b>À savoir.</b> Le contenu vient de tes notes (TD 3 pharmacologie, TD 6 prescription, TD HTA / SCA / AOMI, CM7, CM16) ; les points marqués « à vérifier » sont de la culture générale. Ce sont des exemples d'entraînement : ce n'est ni une prescription ni un protocole. En stage, on se fie à la prescription, au RCP ou à la base de données (BDPM, Thériaque, Vidal), au protocole du service et à l'infirmier(e). Ta progression reste sur cet appareil ; le temps passé compte dans ton temps de révision.</div>`;
  }

  function _tblHtml(t) {
    return `<div class="ph-tblw"><table class="ph-tbl"><thead><tr>${t.head.map(x => `<th>${_esc(x)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="ph-td-k"' : ''} data-l="${_esc(t.head[i])}">${_fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function _ficheHtml() {
    const t = _theme(ficheTh); if (!t) return '';
    const blocks = t.lesson.map(b => {
      let s = '';
      if (b.h) s += `<h3 class="ph-h">${_esc(b.h)}</h3>`;
      if (b.p) s += `<p class="ph-p">${_fmt(b.p)}</p>`;
      if (b.ul) s += `<ul class="ph-ul">${b.ul.map(x => `<li>${_fmt(x)}</li>`).join('')}</ul>`;
      if (b.tbl) s += _tblHtml(b.tbl);
      return s;
    }).join('');
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Pharma.toMenu()">← Pharmaco</button></div>
      <h2 class="ph-title">${t.ico} ${_esc(t.name)}</h2>
      <div class="ph-card">${blocks}</div>
      <div class="ph-muted ph-small" style="margin:8px 0 14px">${_esc(t.src)}</div>
      <div class="ph-row ph-gap">
        <button class="btn btn-primary ph-big" onclick="App.Pharma.startRun('${t.id}')">▶ S'entraîner sur ce thème</button>
        ${t.id === 'dci' ? '<button class="btn btn-ghost" onclick="App.Pharma.showRepertoire()">📋 Répertoire</button>' : ''}
      </div>`;
  }

  function _repRows() {
    const f = _norm(repFilter);
    const rows = D().drugs.filter(d => !f || _norm([d.dci, d.brands, d.cls, d.stem].join(' ')).includes(f));
    if (!rows.length) return '<tr><td colspan="4" class="ph-muted">Aucun résultat.</td></tr>';
    return rows.map(d => `<tr><td class="ph-td-k" data-l="DCI">${_esc(d.dci)}</td><td data-l="Spécialité(s)">${_esc(d.brands)}</td><td data-l="Classe">${_esc(d.cls)}</td><td data-l="Suffixe">${_esc(d.stem || '—')}</td></tr>`).join('');
  }
  function _renderRepRows() { const b = _el('ph-rep-body'); if (b) b.innerHTML = _repRows(); }
  function _repHtml() {
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Pharma.toMenu()">← Pharmaco</button></div>
      <h2 class="ph-title">📋 Répertoire DCI ↔ spécialités</h2>
      <p class="ph-lead">Les noms de marque cités dans tes notes, avec leur <b>DCI</b>, leur <b>classe</b> et le <b>suffixe</b> repère. Tape un nom (marque ou DCI) pour filtrer.</p>
      <input id="ph-rep-in" class="ph-in" type="search" placeholder="Filtrer : Doliprane, ramipril, IEC, -lol…" value="${_esc(repFilter)}" oninput="App.Pharma.setFilter(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="ph-tblw"><table class="ph-tbl"><thead><tr><th>DCI (principe actif)</th><th>Spécialité(s)</th><th>Classe</th><th>Suffixe</th></tr></thead><tbody id="ph-rep-body">${_repRows()}</tbody></table></div>
      <div class="ph-muted ph-small" style="margin-top:8px">Une même DCI peut avoir plusieurs marques et des génériques ; « — » = pas de marque citée dans tes notes. À recouper avec la BDPM ou le RCP.</div>`;
  }

  function _quizHtml() {
    const q = _qOf(run.cur.id), cur = run.cur;
    const th = _theme(q.th);
    const total = run.ids.length;
    const label = run.kind === 'mix' ? 'Série mixte' : run.kind === 'miss' ? 'Mes erreurs' : th.name;
    let body = '';
    if (q.t === 'qcm') body = _qcmHtml(q, cur);
    else if (q.t === 'txt') body = _txtHtml(q, cur);
    else body = _ascHtml(q, cur);
    const fb = cur.done ? _feedbackHtml(q, cur) : '';
    const quit = run.quitAsk
      ? `<div class="ph-quit"><b>Quitter la série ?</b> Tes réponses déjà données sont gardées.
          <button class="btn btn-ghost btn-sm" onclick="App.Pharma.quit()">Oui, quitter</button>
          <button class="btn btn-primary btn-sm" onclick="App.Pharma.keepGoing()">Continuer</button></div>` : '';
    return `<div class="ph-top ph-row">
        <button class="btn btn-ghost btn-sm" onclick="App.Pharma.askQuit()">← Quitter</button>
        <div class="ph-prog">${_bar(run.i + (cur.done ? 1 : 0), total)}<span class="ph-small ph-muted">Question ${run.i + 1} / ${total}</span></div>
        <span class="ph-score">${run.results.filter(r => r.ok).length} ✓</span>
      </div>${quit}
      <div class="ph-card ph-q">
        <div class="ph-tag">${th.ico} ${_esc(label)}${q.t === 'asc' ? ' · association' : q.t === 'txt' ? ' · réponse à écrire' : ''}</div>
        <div class="ph-qtext">${_fmt(q.q)}</div>
        ${body}
      </div>${fb}`;
  }
  function _qcmHtml(q, cur) {
    return `<div class="ph-opts" role="group" aria-label="Réponses">${cur.order.map((orig, k) => {
      let cls = 'ph-opt';
      if (cur.done) {
        if (orig === q.a) cls += ' ph-right';
        else if (cur.picked === k) cls += ' ph-wrong';
        else cls += ' ph-dim';
      }
      return `<button class="${cls}" ${cur.done ? 'disabled' : ''} onclick="App.Pharma.pick(${k})"><span class="ph-key">${k + 1}</span><span>${_esc(q.opts[orig])}</span></button>`;
    }).join('')}</div>`;
  }
  function _txtHtml(q, cur) {
    if (cur.done) {
      return `<input class="ph-in ${cur.ok ? 'ph-in-ok' : 'ph-in-bad'}" value="${_esc(cur.val)}" disabled aria-label="Ta réponse">`;
    }
    return `<div class="ph-row ph-gap"><input id="ph-in" class="ph-in" type="text" placeholder="Ta réponse…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
        onkeydown="if(event.key==='Enter'){event.preventDefault();App.Pharma.submitTxt()}" aria-label="Ta réponse">
        <button class="btn btn-primary" onclick="App.Pharma.submitTxt()">Valider</button></div>
        ${cur.empty ? '<div class="ph-small ph-bad-t" style="margin-top:6px">Écris une réponse avant de valider.</div>' : ''}`;
  }
  function _ascHtml(q, cur) {
    const L = cur.lOrder.map(k => {
      const done = cur.matched.includes(k), sel = cur.sel && cur.sel.side === 'l' && cur.sel.k === k, bad = cur.flash && cur.flash.l === k;
      return `<button class="ph-pair ${done ? 'ph-right' : ''} ${sel ? 'ph-sel' : ''} ${bad ? 'ph-wrong' : ''}" ${done || cur.done ? 'disabled' : ''} onclick="App.Pharma.ascTap('l',${k})">${_esc(q.pairs[k][0])}</button>`;
    }).join('');
    const R = cur.rOrder.map(k => {
      const done = cur.matched.includes(k), sel = cur.sel && cur.sel.side === 'r' && cur.sel.k === k, bad = cur.flash && cur.flash.r === k;
      return `<button class="ph-pair ${done ? 'ph-right' : ''} ${sel ? 'ph-sel' : ''} ${bad ? 'ph-wrong' : ''}" ${done || cur.done ? 'disabled' : ''} onclick="App.Pharma.ascTap('r',${k})">${_esc(q.pairs[k][1])}</button>`;
    }).join('');
    return `<div class="ph-small ph-muted" style="margin-bottom:6px">Touche un élément à gauche, puis son correspondant à droite.${cur.errs ? ` · <b class="ph-bad-t">${cur.errs} erreur${cur.errs > 1 ? 's' : ''}</b>` : ''}</div>
      <div class="ph-asc"><div class="ph-col">${L}</div><div class="ph-col">${R}</div></div>`;
  }
  function _feedbackHtml(q, cur) {
    const last = run.i + 1 >= run.ids.length;
    let head, extra = '';
    if (cur.ok) {
      head = q.t === 'asc' ? '✓ Sans faute !' : '✓ Bien joué !';
      if (cur.near) extra = `<div class="ph-small">Attention à l'orthographe : <b>${_esc(q.show)}</b>.</div>`;
    } else if (q.t === 'qcm') {
      head = '✗ Pas tout à fait.'; extra = `<div class="ph-small">Bonne réponse : <b>${_esc(q.opts[q.a])}</b></div>`;
    } else if (q.t === 'txt') {
      head = '✗ Pas tout à fait.'; extra = `<div class="ph-small">Réponse attendue : <b>${_esc(q.show)}</b></div>`;
    } else {
      head = '✗ Association terminée avec ' + cur.errs + ' erreur' + (cur.errs > 1 ? 's' : '') + '.';
    }
    return `<div id="ph-fb" class="ph-fb ${cur.ok ? 'ph-fb-ok' : 'ph-fb-bad'}" role="status" aria-live="polite">
        <div class="ph-fb-h">${head}</div>${extra}
        <div class="ph-fb-why">${_fmt(q.why)}</div>
        <div class="ph-small ph-muted">Source : ${_esc(_srcLabel(q.src))}${q.chk ? ' · <b class="ph-warn-t">à vérifier dans ton cours (culture générale)</b>' : ''}</div>
        <div class="ph-row" style="margin-top:10px"><button class="btn btn-primary ph-big" id="ph-next" onclick="App.Pharma.next()">${last ? 'Voir mon bilan →' : 'Question suivante →'}</button></div>
      </div>`;
  }
  const SRC = { TD3: 'ton TD 3 (pharmacologie)', TD6: 'ton TD 6 (analyse d\'une prescription)', SCA: 'ton TD SCA', HTA: 'ton TD HTA', AOMI: 'ton TD AOMI', CM7: 'ton CM7 (HTA)', CM16: 'ton CM16 (insuffisance cardiaque)', 'Général': 'culture générale', Notes: 'tes notes de pharmaco' };
  function _srcLabel(s) { return SRC[s] || s; }

  function _bilanHtml() {
    const ok = run.results.filter(r => r.ok).length, n = run.results.length;
    const pct = n ? Math.round(ok / n * 100) : 0;
    const msg = pct >= 90 ? 'Très solide.' : pct >= 70 ? 'Bien : encore quelques points à fixer.' : pct >= 50 ? 'À consolider : relis la fiche puis refais les erreurs.' : 'À retravailler : commence par la fiche du thème.';
    const wrong = run.results.filter(r => !r.ok);
    const byTh = {};
    run.results.forEach(r => { const q = _qOf(r.id); (byTh[q.th] = byTh[q.th] || { ok: 0, n: 0 }); byTh[q.th].n++; if (r.ok) byTh[q.th].ok++; });
    const thRows = Object.keys(byTh).length > 1 ? Object.keys(byTh).map(id => `<div class="ph-hist"><span>${_theme(id).ico} ${_esc(_theme(id).name)}</span><span></span><b>${byTh[id].ok} / ${byTh[id].n}</b></div>`).join('') : '';
    const errs = wrong.map(r => {
      const q = _qOf(r.id);
      const good = q.t === 'qcm' ? q.opts[q.a] : q.t === 'txt' ? q.show : '';
      return `<div class="ph-err"><div class="ph-err-q">${_fmt(q.q)}</div>${good ? `<div class="ph-small">Bonne réponse : <b>${_esc(good)}</b></div>` : ''}<div class="ph-small ph-muted">${_fmt(q.why)}</div></div>`;
    }).join('');
    const kind = run.kind;
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Pharma.toMenu()">← Pharmaco</button></div>
      <h2 class="ph-title">Bilan de la série</h2>
      <div class="ph-card ph-center">
        <div class="ph-big-score">${ok} / ${n}</div>
        <div class="ph-pct ${pct >= 70 ? 'ph-ok-t' : pct >= 50 ? 'ph-warn-t' : 'ph-bad-t'}">${pct} %</div>
        <div class="ph-muted">${msg}</div>
      </div>
      ${thRows ? `<div class="ph-card">${thRows}</div>` : ''}
      <div class="ph-row ph-gap ph-wrapr" style="margin:12px 0">
        ${wrong.length ? `<button class="btn btn-primary" onclick="App.Pharma.retryMistakes()">🔁 Refaire mes ${wrong.length} erreur${wrong.length > 1 ? 's' : ''}</button>` : ''}
        <button class="btn ${wrong.length ? 'btn-ghost' : 'btn-primary'}" onclick="App.Pharma.again()">▶ Nouvelle série</button>
        ${_theme(kind) ? `<button class="btn btn-ghost" onclick="App.Pharma.showFiche('${kind}')">📖 Fiche du thème</button>` : ''}
        <button class="btn btn-ghost" onclick="App.Pharma.toMenu()">Menu</button>
      </div>
      ${wrong.length ? `<h3 class="ph-h">À revoir</h3><div class="ph-card">${errs}</div>` : '<div class="ph-note">Aucune erreur sur cette série. Les questions réussies reviendront moins souvent ; celles que tu rates reviennent en priorité.</div>'}`;
  }

  // ── Clavier : 1-4 = réponse, Entrée = suite ─────────────────
  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', e => {
      if (screen !== 'quiz' || !run || e.ctrlKey || e.metaKey || e.altKey) return;
      const root = _el('pharma-root'); if (!root || root.style.display === 'none') return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const q = _qOf(run.cur.id);
      if (!run.cur.done && q.t === 'qcm' && /^[1-4]$/.test(e.key)) { e.preventDefault(); pick(parseInt(e.key, 10) - 1); }
      else if (run.cur.done && e.key === 'Enter') { e.preventDefault(); next(); }
    });
    _keysBound = true;
  }

  _load();

  return {
    open, close, toMenu, showFiche, showRepertoire, setFilter, startRun, retryMistakes, again, askQuit, keepGoing, quit, next,
    pick, submitTxt, ascTap, isTraining,
    _t: { norm: _norm, lev: _lev, grade: _gradeTxt, pick: _pick, state: () => ({ screen, run, P }), stats: _stats, reset: () => { P = { v: 1, q: {}, runs: [] }; _save(); } }
  };
})();
