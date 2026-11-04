// core/duo.js — Entraînement « Questions à deux » (App.Duo)
// Tu interroges un ami (ou toi-même) : la question, la réponse attendue, les points à vérifier et des relances
// sont sous tes yeux. Chacun son tour, score pour chacun, « à revoir » gardé sur cet appareil.
// 100 % hors ligne. Progression : localStorage, clé ifsi_duo_v1 (rien n'est envoyé ni synchronisé, aucune carte de révision modifiée).
// Le temps passé en questions est compté par App.Activity (kind « duo ») → « Temps » du jour.
'use strict';
window.App = window.App || {};

App.Duo = (() => {
  const KEY = 'ifsi_duo_v1';
  const MAX_RUNS = 30;
  const DEF_NAMES = ['Moi', 'Mon pote'];
  const DEF_CFG = { chapter: '', mode: 'duo', order: 'shuffle', n: 10, only: 'all', swap: true, hide: false, names: DEF_NAMES.slice() };

  let P = { v: 1, q: {}, runs: [], pref: {} };   // progression
  let cfg = Object.assign({}, DEF_CFG, { names: DEF_NAMES.slice() });
  let screen = 'menu';                           // menu | setup | play | bilan
  let setId = null;                              // UE choisie (null = « à revoir » toutes UE)
  let run = null;                                // série en cours
  let ORDER = null;                              // id de question → rang global (ordre du cours)

  const D = () => App.DuoBank;
  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function _shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function _top() { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} }

  // ── Banque ─────────────────────────────────────────────────
  function _buildIndex() {
    if (ORDER) return;
    ORDER = {};
    let k = 0;
    D().sets.forEach(s => s.items.forEach(it => { ORDER[it.id] = k++; }));
  }
  function _item(id) {
    for (const s of D().sets) { const it = s.items.find(x => x.id === id); if (it) return { it, set: s }; }
    return null;
  }
  const _name = i => (String((cfg.names || [])[i] || '').trim() || DEF_NAMES[i]).slice(0, 20);

  // ── Stockage ───────────────────────────────────────────────
  function _load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.v === 1 && o.q && typeof o.q === 'object') P = { v: 1, q: o.q, runs: Array.isArray(o.runs) ? o.runs : [], pref: o.pref && typeof o.pref === 'object' ? o.pref : {} };
    } catch (e) { P = { v: 1, q: {}, runs: [], pref: {} }; }
    const p = P.pref || {};
    cfg = Object.assign({}, DEF_CFG, { names: DEF_NAMES.slice() });
    if (p.mode === 'duo' || p.mode === 'solo') cfg.mode = p.mode;
    if (p.order === 'shuffle' || p.order === 'course') cfg.order = p.order;
    if ([10, 20, 0].includes(p.n)) cfg.n = p.n;
    if (typeof p.swap === 'boolean') cfg.swap = p.swap;
    if (typeof p.hide === 'boolean') cfg.hide = p.hide;
    if (Array.isArray(p.names)) cfg.names = [String(p.names[0] || ''), String(p.names[1] || '')].map(s => s.slice(0, 20));
  }
  function _save() {
    try {
      P.pref = { mode: cfg.mode, order: cfg.order, n: cfg.n, swap: cfg.swap, hide: cfg.hide, names: cfg.names.slice() };
      localStorage.setItem(KEY, JSON.stringify(P));
    } catch (e) {}
  }
  const _rec = id => P.q[id] || null;
  const _isMissed = id => { const r = P.q[id]; return !!r && (r.last === 0 || r.last === 1); };
  const _isMastered = id => { const r = P.q[id]; return !!r && r.st >= 2; };
  function _stats(set) {
    const its = set ? set.items : D().sets.flatMap(s => s.items);
    return {
      total: its.length,
      seen: its.filter(it => (P.q[it.id] || {}).s > 0).length,
      mastered: its.filter(it => _isMastered(it.id)).length,
      missed: its.filter(it => _isMissed(it.id)).length
    };
  }
  const _today = () => new Date().toISOString().slice(0, 10);

  // ── Choix des questions ────────────────────────────────────
  function _poolIds(set, chapter, only) {
    const sets = set ? [set] : D().sets;
    let ids = [];
    sets.forEach(s => s.items.forEach(it => { if (!chapter || it.c === chapter) ids.push(it.id); }));
    if (only === 'miss') ids = ids.filter(_isMissed);
    return ids;
  }
  function _pick(ids, n, order) {
    const score = id => {
      const r = P.q[id];
      let b = 3;
      if (r && r.s) b = r.last === 0 ? 4 : r.last === 1 ? 3.5 : r.last === 2 ? 1 : 2.5;
      return b + Math.random() * 1.5;
    };
    let out = ids.map(id => ({ id, s: score(id) })).sort((a, b) => b.s - a.s);
    if (n > 0) out = out.slice(0, n);
    out = out.map(x => x.id);
    return order === 'course' ? out.sort((a, b) => ORDER[a] - ORDER[b]) : _shuffle(out);
  }

  // ── Navigation ─────────────────────────────────────────────
  function open() {
    if (!D()) return;
    _load(); _buildIndex();
    const root = _el('duo-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null; setId = null;
    render(); _top();
  }
  function close() {
    const root = _el('duo-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; setId = null; render(); _top(); }
  function chooseSet(id) { setId = id; cfg.chapter = ''; cfg.only = 'all'; screen = 'setup'; render(); _top(); }
  function backToSetup() { screen = 'setup'; run = null; render(); _top(); }
  function isTraining() { return screen === 'play' && !!run && !run.quitAsk; }

  function setCfg(k, v) {
    if (k === 'n') v = Number(v);
    if (!(k in cfg)) return;
    cfg[k] = (k === 'swap' || k === 'hide') ? !!v : v;
    _save();
    if (screen === 'setup') render();
  }
  function setName(i, v) { cfg.names[i] = String(v || '').slice(0, 20); _save(); }

  // ── Série ──────────────────────────────────────────────────
  function start() {
    const set = setId ? D().get(setId) : null;
    const ids = _pick(_poolIds(set, setId ? cfg.chapter : '', setId ? cfg.only : 'miss'), setId ? cfg.n : 20, cfg.order);
    if (!ids.length) return;
    _begin(ids, set ? set.id : 'MIX');
  }
  function startReview() {   // série des questions « à revoir » de toutes les UE
    setId = null;
    start();
  }
  function retryMissed() {
    if (!run) return;
    const ids = run.results.filter(r => !r.skipped && r.ok < 2).map(r => r.id);
    if (!ids.length) { toMenu(); return; }
    _begin(_shuffle(ids), run.setKey);
  }
  function again() { if (!run) return; setId = run.setKey === 'MIX' ? null : run.setKey; start(); }
  function _begin(ids, setKey) {
    run = { setKey, ids, i: 0, results: [], revealed: false, quitAsk: false, startedAt: Date.now(), mode: cfg.mode, swap: cfg.swap, names: [_name(0), _name(1)] };
    screen = 'play'; render(); _top();
  }
  const _asker = i => (run.mode === 'duo' && run.swap && i % 2 === 1) ? 1 : 0;

  function reveal() { if (!run) return; run.revealed = true; render(); }
  function toggleAnswer() {
    cfg.hide = !cfg.hide; _save();
    const a = _el('duo-ans'), b = _el('duo-tog');
    if (a) a.classList.toggle('is-hidden', cfg.hide);
    if (b) b.textContent = cfg.hide ? '👁 Voir la réponse' : '🙈 Masquer la réponse';
  }

  function rate(v) {   // v : 0 raté · 1 à moitié · 2 juste
    if (!run || screen !== 'play' || run.quitAsk) return;
    const id = run.ids[run.i];
    const asker = _asker(run.i), answerer = run.mode === 'duo' ? 1 - asker : 0;
    const prev = P.q[id] ? JSON.parse(JSON.stringify(P.q[id])) : null;
    const r = P.q[id] || { s: 0, n: 0, st: 0 };
    r.s = (r.s || 0) + 1;
    if (answerer === 0) {                    // seules TES propres réponses alimentent « à revoir »
      r.n = (r.n || 0) + 1; r.last = v; r.st = v === 2 ? (r.st || 0) + 1 : 0; r.d = _today();
    }
    P.q[id] = r; _save();
    run.results.push({ id, ok: v, by: answerer, asker, prev });
    _advance();
  }
  function skip() {
    if (!run || screen !== 'play' || run.quitAsk) return;
    const id = run.ids[run.i];
    const prev = P.q[id] ? JSON.parse(JSON.stringify(P.q[id])) : null;
    const r = P.q[id] || { s: 0, n: 0, st: 0 };
    r.s = (r.s || 0) + 1; P.q[id] = r; _save();
    run.results.push({ id, skipped: true, ok: 0, by: null, asker: _asker(run.i), prev });
    _advance();
  }
  function undo() {
    if (!run || screen !== 'play' || !run.results.length) return;
    const last = run.results.pop();
    if (last.prev) P.q[last.id] = last.prev; else delete P.q[last.id];
    _save();
    run.i = Math.max(0, run.i - 1); run.revealed = false; run.quitAsk = false;
    render(); _top();
  }
  function _advance() {
    run.i++; run.revealed = false;
    if (run.i >= run.ids.length) { _finish(); return; }
    render(); _top();
  }
  function _scores() {
    const sc = [{ pts: 0, n: 0, ok: 0, mid: 0, ko: 0 }, { pts: 0, n: 0, ok: 0, mid: 0, ko: 0 }];
    run.results.forEach(r => {
      if (r.skipped || r.by == null) return;
      const s = sc[r.by]; s.n++; s.pts += r.ok / 2;
      if (r.ok === 2) s.ok++; else if (r.ok === 1) s.mid++; else s.ko++;
    });
    return sc;
  }
  function _finish() {
    const sc = _scores();
    P.runs.unshift({ d: new Date().toISOString(), set: run.setKey, n: run.results.filter(r => !r.skipped).length, mode: run.mode, p: sc.map(s => [s.pts, s.n]), names: run.names });
    P.runs = P.runs.slice(0, MAX_RUNS); _save();
    screen = 'bilan'; render(); _top();
  }
  function askQuit() { if (!run) return; run.quitAsk = true; render(); }
  function keepGoing() { if (!run) return; run.quitAsk = false; render(); }
  function quit() {
    if (!run) { toMenu(); return; }
    if (run.results.some(r => !r.skipped)) { _finish(); } else { toMenu(); }
  }

  // ── Rendu ──────────────────────────────────────────────────
  function render() {
    const root = _el('duo-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml();
    else if (screen === 'setup') h = _setupHtml();
    else if (screen === 'play') h = _playHtml();
    else if (screen === 'bilan') h = _bilanHtml();
    root.innerHTML = `<div class="ph-wrap duo-wrap">${h}</div>`;
  }
  const _bar = (a, b, cls) => { const p = b ? Math.round(a / b * 100) : 0; return `<div class="ph-bar ${cls || ''}"><i style="width:${p}%"></i></div>`; };
  const _num = x => (Math.round(x * 2) / 2).toString().replace('.', ',');

  function _menuHtml() {
    const all = _stats(null);
    const cards = D().sets.map(s => {
      const st = _stats(s);
      return `<div class="ph-card duo-set">
        <div class="ph-th-head"><span class="ph-ico">${s.ico}</span><div><div class="ph-th-name">${_esc(s.ue)} · ${_esc(s.name)}</div><div class="ph-muted ph-small">${_esc(s.blurb)}</div></div></div>
        <div class="ph-muted ph-small">${_esc(s.exam)}</div>
        ${_bar(st.mastered, st.total, 'ph-bar-ok')}
        <div class="ph-muted ph-small">${st.total} question${st.total > 1 ? 's' : ''} · ${st.seen} vue${st.seen > 1 ? 's' : ''} · ${st.mastered} réussie${st.mastered > 1 ? 's' : ''} 2 fois d’affilée${st.missed ? ` · <b class="ph-bad-t">${st.missed} à revoir</b>` : ''}</div>
        <div class="ph-row ph-gap"><button class="btn btn-primary" onclick="App.Duo.chooseSet('${s.id}')">Choisir →</button></div>
      </div>`;
    }).join('');
    const last = P.runs.slice(0, 3).map(r => {
      const nm = r.set === 'MIX' ? 'À revoir' : ((D().get(r.set) || {}).ue || r.set);
      const sc = r.mode === 'duo' && Array.isArray(r.p) && Array.isArray(r.names)
        ? r.p.map((p, i) => `${_esc(r.names[i] || '')} ${_num(p[0])}/${p[1]}`).join(' · ')
        : (Array.isArray(r.p) && r.p[0] ? `${_num(r.p[0][0])}/${r.p[0][1]}` : '');
      return `<div class="ph-hist"><span>${_esc(new Date(r.d).toLocaleDateString('fr-FR'))}</span><span>${_esc(nm)} · ${r.mode === 'duo' ? 'à deux' : 'seul·e'}</span><b>${sc}</b></div>`;
    }).join('');
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Duo.close()">← Entraînement</button></div>
      <h2 class="ph-title">🗣️ Questions à deux</h2>
      <p class="ph-lead">Tu <b>poses les questions à ton pote</b>, mais tu as la <b>question</b> et la <b>réponse attendue</b> sous les yeux, avec les points à vérifier et des relances. Chacun son tour, un score pour chacun. Ça marche aussi <b>tout seul</b> (réponse cachée jusqu’à ce que tu la demandes).</p>
      ${cards}
      ${all.missed ? `<div class="ph-card"><div class="ph-th-name">🔁 À revoir : ${all.missed} question${all.missed > 1 ? 's' : ''}</div><div class="ph-muted ph-small">Celles que tu as ratées ou à moitié réussies (tes propres réponses), toutes UE confondues.</div><div class="ph-row ph-gap"><button class="btn btn-primary" onclick="App.Duo.startReview()">▶ Série des à revoir</button></div></div>` : ''}
      ${last ? `<h3 class="ph-h">Dernières séries</h3>${last}` : ''}
      <div class="ph-note">Questions et réponses écrites à partir de <b>tes notes Notion</b>, pas d’un corrigé officiel : en cas de doute, c’est ton cours (et ton formateur) qui font foi. Un avertissement ⚠ s’affiche quand tes notes sont incomplètes ou « à valider ». D.1 est laissé de côté ; A.1 viendra quand tes notes seront plus complètes. Ta liste « à revoir » reste sur cet appareil.</div>`;
  }

  function _setupHtml() {
    const set = D().get(setId); if (!set) return _menuHtml();
    const pool = _poolIds(set, cfg.chapter, cfg.only);
    const chOpts = Object.keys(set.chapters).map(k => {
      const n = set.items.filter(it => it.c === k).length;
      return `<option value="${_esc(k)}" ${cfg.chapter === k ? 'selected' : ''}>${_esc(set.chapters[k])} (${n})</option>`;
    }).join('');
    const seg = (key, val, label) => `<button class="duo-seg-b ${String(cfg[key]) === String(val) ? 'on' : ''}" onclick="App.Duo.setCfg('${key}', ${typeof val === 'string' ? `'${val}'` : val})">${label}</button>`;
    const nAvail = pool.length;
    const nRun = cfg.n > 0 ? Math.min(cfg.n, nAvail) : nAvail;
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Duo.toMenu()">← Retour</button></div>
      <h2 class="ph-title">${set.ico} ${_esc(set.ue)} · ${_esc(set.name)}</h2>
      <div class="ph-card">
        <div class="duo-lbl">Mode</div>
        <div class="duo-seg">${seg('mode', 'duo', '👥 À deux')}${seg('mode', 'solo', '🧑 Seul·e')}</div>
        <div class="ph-muted ph-small">${cfg.mode === 'duo' ? 'Tu interroges : la réponse attendue est sous tes yeux, tu notes la réponse de l’autre.' : 'Tu te testes : la réponse reste cachée jusqu’à ce que tu la demandes, puis tu te notes.'}</div>
        ${cfg.mode === 'duo' ? `
          <div class="duo-names">
            <label>Toi<input class="ph-in" maxlength="20" value="${_esc(cfg.names[0])}" placeholder="${DEF_NAMES[0]}" oninput="App.Duo.setName(0, this.value)"></label>
            <label>L’autre<input class="ph-in" maxlength="20" value="${_esc(cfg.names[1])}" placeholder="${DEF_NAMES[1]}" oninput="App.Duo.setName(1, this.value)"></label>
          </div>
          <label class="duo-chk"><input type="checkbox" ${cfg.swap ? 'checked' : ''} onchange="App.Duo.setCfg('swap', this.checked)"> Alterner : à chaque question, c’est l’autre qui interroge</label>
          <label class="duo-chk"><input type="checkbox" ${cfg.hide ? 'checked' : ''} onchange="App.Duo.setCfg('hide', this.checked)"> Masquer la réponse par défaut (si l’autre voit ton écran)</label>
          <div class="ph-muted ph-small">Ta liste « à revoir » ne compte que <b>tes propres réponses</b> : garde l’alternance pour t’interroger toi aussi.</div>` : ''}
      </div>
      <div class="ph-card">
        <div class="duo-lbl">Chapitre</div>
        <select class="ortho-cat-select duo-sel" onchange="App.Duo.setCfg('chapter', this.value)"><option value="">Tous les chapitres (${set.items.length})</option>${chOpts}</select>
        <div class="duo-lbl">Questions</div>
        <div class="duo-seg">${seg('only', 'all', 'Toutes')}${seg('only', 'miss', '🔁 À revoir seulement')}</div>
        <div class="duo-lbl">Ordre</div>
        <div class="duo-seg">${seg('order', 'shuffle', '🔀 Mélangé')}${seg('order', 'course', '📚 Ordre du cours')}</div>
        <div class="duo-lbl">Nombre</div>
        <div class="duo-seg">${seg('n', 10, '10')}${seg('n', 20, '20')}${seg('n', 0, 'Toutes')}</div>
        <div class="ph-muted ph-small">Les questions pas encore vues ou ratées passent en premier.</div>
      </div>
      <div class="ph-row ph-gap ph-wrapr">
        <button class="btn btn-primary ph-big" ${nAvail ? '' : 'disabled'} onclick="App.Duo.start()">▶ Commencer (${nRun} question${nRun > 1 ? 's' : ''})</button>
        ${nAvail ? '' : '<span class="ph-muted ph-small">Rien à revoir ici pour l’instant.</span>'}
      </div>
      <div class="ph-note">${_esc(set.note)}</div>`;
  }

  function _playHtml() {
    const id = run.ids[run.i], f = _item(id);
    if (!f) return '';
    const { it, set } = f;
    const total = run.ids.length, duo = run.mode === 'duo';
    const asker = _asker(run.i), answerer = 1 - asker;
    const sc = _scores();
    const scoreTxt = duo
      ? run.names.map((n, i) => `<span class="duo-sc"><b>${_esc(n)}</b> ${_num(sc[i].pts)}/${sc[i].n}</span>`).join('')
      : `<span class="duo-sc"><b>Score</b> ${_num(sc[0].pts)}/${sc[0].n}</span>`;
    const showAns = duo ? true : run.revealed;
    const pts = it.pts.length ? `<div class="duo-pts">${it.pts.map(p => `<label class="duo-pt"><input type="checkbox"> <span>${_esc(p)}</span></label>`).join('')}</div>` : '';
    const rel = it.rel.length ? `<details class="duo-rel"><summary>💬 Pour relancer (${it.rel.length})</summary>${it.rel.map(r => `<div class="duo-relq"><b>${_esc(r[0])}</b><div>${_esc(r[1])}</div></div>`).join('')}</details>` : '';
    const chk = it.chk ? `<div class="duo-chk-w">⚠ À valider : ${_esc(it.chk)}</div>` : '';
    const ansBlock = `<div id="duo-ans" class="duo-ans ${duo && cfg.hide ? 'is-hidden' : ''}">
        <div class="duo-ans-t">✅ Réponse attendue</div>
        <div class="duo-ans-a">${_esc(it.a)}</div>
        ${pts ? `<div class="duo-ans-t duo-ans-t2">À vérifier dans la réponse</div>${pts}` : ''}
        ${chk}${rel}
      </div>`;
    const roles = duo
      ? `<div class="duo-roles"><span>🎤 <b>${_esc(run.names[asker])}</b> pose la question</span><span>💭 <b>${_esc(run.names[answerer])}</b> répond</span></div>`
      : '';
    const rateBtns = `<div class="duo-rate">
        <button class="duo-r duo-r-ko" onclick="App.Duo.rate(0)"><span class="duo-r-i">❌</span>Raté</button>
        <button class="duo-r duo-r-mid" onclick="App.Duo.rate(1)"><span class="duo-r-i">🟡</span>À moitié</button>
        <button class="duo-r duo-r-ok" onclick="App.Duo.rate(2)"><span class="duo-r-i">✅</span>Juste</button>
      </div>`;
    const quit = run.quitAsk
      ? `<div class="duo-quit"><b>Terminer la série ?</b> Les questions déjà notées sont gardées.<div class="ph-row ph-gap ph-wrapr"><button class="btn btn-primary" onclick="App.Duo.quit()">Terminer et voir le bilan</button><button class="btn btn-ghost" onclick="App.Duo.keepGoing()">Continuer</button></div></div>`
      : '';
    return `<div class="ph-top ph-row"><button class="btn btn-ghost btn-sm" onclick="App.Duo.askQuit()">✕ Terminer</button>
        <div class="ph-prog"><div class="ph-muted ph-small">Question ${run.i + 1} sur ${total}</div>${_bar(run.i, total)}</div></div>
      <div class="duo-scores">${scoreTxt}</div>
      ${quit}
      <div class="ph-card ph-q duo-q-card">
        <div class="ph-tag">${_esc(set.ue)} · ${_esc(set.chapters[it.c] || it.c)}</div>
        ${roles}
        <div class="ph-qtext duo-q">${_esc(it.q)}</div>
        ${duo
          ? `<button id="duo-tog" class="btn btn-ghost btn-sm duo-tog" onclick="App.Duo.toggleAnswer()">${cfg.hide ? '👁 Voir la réponse' : '🙈 Masquer la réponse'}</button>${ansBlock}`
          : (showAns ? ansBlock : `<button class="btn btn-primary ph-big duo-show" onclick="App.Duo.reveal()">👁 Voir la réponse</button>`)}
      </div>
      ${showAns || duo ? `<div class="ph-muted ph-small duo-ask">${duo ? `Note la réponse de <b>${_esc(run.names[answerer])}</b> :` : 'Comment tu t’es noté·e ?'}</div>${rateBtns}` : ''}
      <div class="ph-row ph-gap duo-more">
        <button class="btn btn-ghost btn-sm" onclick="App.Duo.undo()" ${run.results.length ? '' : 'disabled'}>↶ Question précédente</button>
        <button class="btn btn-ghost btn-sm" onclick="App.Duo.skip()">⏭ Passer</button>
      </div>`;
  }

  function _bilanHtml() {
    const sc = _scores(), duo = run.mode === 'duo';
    const rated = run.results.filter(r => !r.skipped), skipped = run.results.length - rated.length;
    const missed = run.results.filter(r => !r.skipped && r.ok < 2);
    const scoreCards = (duo ? [0, 1] : [0]).map(i => {
      const s = sc[i], p = s.n ? Math.round(s.pts / s.n * 100) : 0;
      return `<div class="duo-sbox"><div class="duo-sname">${_esc(duo ? run.names[i] : 'Ton score')}</div>
        <div class="duo-sbig">${_num(s.pts)} <span>/ ${s.n}</span></div>
        ${_bar(s.pts, s.n, 'ph-bar-ok')}
        <div class="ph-muted ph-small">${s.n ? `${p} % · ✅ ${s.ok} · 🟡 ${s.mid} · ❌ ${s.ko}` : 'aucune réponse notée'}</div></div>`;
    }).join('');
    const list = missed.map(r => {
      const f = _item(r.id); if (!f) return '';
      return `<details class="duo-miss"><summary>${r.ok === 1 ? '🟡' : '❌'} ${_esc(f.it.q)}</summary>
        <div class="duo-ans-a">${_esc(f.it.a)}</div>${f.it.chk ? `<div class="duo-chk-w">⚠ À valider : ${_esc(f.it.chk)}</div>` : ''}</details>`;
    }).join('');
    const verdict = !rated.length ? 'Aucune question notée.'
      : missed.length === 0 ? 'Sans faute 🎉' : `${missed.length} question${missed.length > 1 ? 's' : ''} à revoir.`;
    return `<h2 class="ph-title">Bilan de la série</h2>
      <p class="ph-lead">${rated.length} question${rated.length > 1 ? 's' : ''} notée${rated.length > 1 ? 's' : ''}${skipped ? ` · ${skipped} passée${skipped > 1 ? 's' : ''}` : ''} · ${verdict}</p>
      <div class="duo-sgrid">${scoreCards}</div>
      ${missed.length ? `<h3 class="ph-h">À revoir (${missed.length})</h3><div class="ph-muted ph-small">Touche une question pour relire la réponse.</div>${list}` : ''}
      ${duo ? `<div class="ph-note">Ta liste « à revoir » n’a pris en compte que les questions auxquelles <b>${_esc(run.names[0])}</b> a répondu.</div>` : ''}
      <div class="ph-row ph-gap ph-wrapr duo-end">
        ${missed.length ? `<button class="btn btn-primary ph-big" onclick="App.Duo.retryMissed()">🔁 Refaire les ${missed.length} à revoir</button>` : ''}
        <button class="btn ${missed.length ? 'btn-ghost' : 'btn-primary'} ph-big" onclick="App.Duo.again()">▶ Nouvelle série</button>
        <button class="btn btn-ghost ph-big" onclick="App.Duo.toMenu()">Menu</button>
      </div>`;
  }

  return {
    open, close, toMenu, chooseSet, backToSetup, setCfg, setName, start, startReview, retryMissed, again,
    reveal, toggleAnswer, rate, skip, undo, askQuit, keepGoing, quit, isTraining,
    _t: { state: () => ({ screen, setId, cfg, run, P }) }
  };
})();
