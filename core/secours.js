// core/secours.js — Entraînement « Secourisme PSE1 » (App.Sec)
// Cas de secours sur la voie publique parisienne, en SAUVETEUR ISOLÉ (alerte au 15/18/112) ou en ÉQUIPE (compte rendu au chef d'agrès).
// Chaque cas se joue étape par étape : « je fais quoi ? » (choix), bilan en 4 regards (je choisis ce que je regarde),
// ordre des gestes, puis message d'alerte ou compte rendu écrit (corrigé par mots-clés, pas par une IA).
// Données : data/secours.js (fiches, sources) + data/secours_*.js (les cas). Dessins : ui/sec_scene.js.
// Progression gardée sur cet appareil seulement (localStorage, clé ifsi_sec_v1) : rien n'est envoyé ni synchronisé.
// Le temps passé à s'entraîner est compté par App.Activity (kind « secours »).
// ⚠ Outil de RÉVISION fictif : il ne remplace ni ta formation PSE1, ni les consignes de ton chef d'agrès / de ta structure.
'use strict';
window.App = window.App || {};

App.Sec = (() => {
  const KEY = 'ifsi_sec_v1';
  const MAX_RUNS = 40, MAX_MISS = 40;
  let P = { v: 1, best: {}, runs: [], miss: {} };
  let screen = 'menu';                           // menu | run | bilan
  let run = null, _keysBound = false, ficheOpen = {};

  const D = () => App.SecData;
  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _fmt = s => _esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  function _shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function _norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  const _words = s => (_norm(s).match(/\S+/g) || []).length;
  const _case = id => D().cases.find(c => c.id === id);
  const _top = () => { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} };
  const MODE_LABEL = { solo: 'Sauveteur isolé', team: 'Équipe PCPS' };
  const MODE_ICO = { solo: '🧍', team: '👥' };

  // ══ Sauvegarde ═══════════════════════════════════════════════════════════════
  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) P = { v: 1, best: r.best && typeof r.best === 'object' ? r.best : {}, runs: Array.isArray(r.runs) ? r.runs.slice(-MAX_RUNS) : [], miss: r.miss && typeof r.miss === 'object' ? r.miss : {} };
    } catch (e) {}
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  // ══ Scène ════════════════════════════════════════════════════════════════════
  function _merge(a, b) {                                // fusion récursive : null/false supprime la clé
    const o = Object.assign({}, a || {});
    Object.keys(b || {}).forEach(k => {
      const v = b[k];
      if (v === null) delete o[k];
      else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = _merge(o[k], v);
      else o[k] = v;
    });
    return o;
  }
  const _sceneHtml = sc => (App.SecScene ? App.SecScene.svg(sc) : '');

  // ══ Navigation ═══════════════════════════════════════════════════════════════
  function open() {
    _load(); _bindKeys();
    const root = _el('secours-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root', 'pharma-root', 'gazo-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null;
    render(); _top();
  }
  function close() {
    const root = _el('secours-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; render(); _top(); }
  function isTraining() { return screen === 'run' && !!run; }
  function quit() {
    if (run && run.i > 0 && !run.over && !confirm('Quitter ce cas ? Ta progression dans ce cas sera perdue.')) return;
    toMenu();
  }

  // ══ Lancer un cas ════════════════════════════════════════════════════════════
  function start(caseId, mode) {
    const c = _case(caseId); if (!c) return;
    const m = c.modes[mode]; if (!m) return;
    const sc = _merge(_merge(c.scene, { crew: m.crew || {} }), {});
    run = { caseId, mode, i: 0, phase: 'ask', scene: sc, sel: [], seq: [], found: {}, txt: {}, recs: [], t0: Date.now(), over: false, hint: '' };
    _enterStep();
    screen = 'run'; render(); _top();
  }
  function random() {
    const c = D().cases[Math.floor(Math.random() * D().cases.length)];
    const modes = Object.keys(c.modes);
    start(c.id, modes[Math.floor(Math.random() * modes.length)]);
  }
  const _steps = () => _case(run.caseId).modes[run.mode].steps;
  const _step = () => _steps()[run.i];
  function _enterStep() {
    const st = _step(); if (!st) return;
    if (st.scene) run.scene = _merge(run.scene, st.scene);
    run.phase = 'ask'; run.sel = []; run.seq = []; run.found = {}; run.txt = {}; run.hint = '';
    if (st.kind === 'order') run.items = _shuffle(st.items.map((it, i) => i));
  }

  // ══ Interactions ═════════════════════════════════════════════════════════════
  function pick(i) {
    if (!run || run.phase !== 'ask') return;
    const st = _step();
    if (st.kind === 'choice') run.sel = [i];
    else if (st.kind === 'multi') { const k = run.sel.indexOf(i); if (k >= 0) run.sel.splice(k, 1); else run.sel.push(i); }
    run.hint = ''; render(false);
  }
  function check(id) {                                   // bilan : je regarde / je vérifie un point
    if (!run || run.phase !== 'ask') return;
    run.found[id] = true; render(false);
  }
  function place(i) {                                    // ordre : je pose l'élément i à la suite
    if (!run || run.phase !== 'ask') return;
    if (run.seq.indexOf(i) < 0) run.seq.push(i);
    render(false);
  }
  function unplace() { if (run && run.phase === 'ask') { run.seq.pop(); render(false); } }
  function clearSeq() { if (run && run.phase === 'ask') { run.seq = []; render(false); } }
  function setTxt(id, v) { if (run) run.txt[id] = v; }

  // ── Notation ──────────────────────────────────────────────────────────────
  function _gradeTransmit(st, txt) {
    const els = []; let got = 0, tot = 0;
    st.sections.forEach(sec => {
            const full = _norm(Object.keys(txt).map(k => txt[k]).join(' '));
      sec.elements.forEach(el => {
        const w = el.w || 1; tot += w;
        const hay = full;   // chaque idée est cherchée dans tout le message : peu importe la case où l'élève l'a écrite
        let ok = false;
        if (el.test) ok = !!el.test(hay, _words(txt[sec.id] || ''));
        else if (el.need) ok = el.need.re.filter(re => re.test(hay)).length >= el.need.min;
        else if (el.all) ok = el.all.every(re => re.test(hay));
        else ok = (el.re || []).some(re => re.test(hay));
        if (ok) got += w;
        els.push({ sec: sec.id, label: el.label, ok, w });
      });
    });
    const tips = [];
    const alln = _norm(Object.keys(txt).map(k => txt[k]).join(' '));
    if (st.warn && st.warn.re.some(re => re.test(alln))) tips.push(st.warn.text);
    return { p: tot ? got / tot : 0, els, tips };
  }

  function validate() {
    if (!run || run.phase !== 'ask') return;
    const st = _step(), rec = { id: st.id, cat: st.cat || 'gestes', w: st.w || 1, title: st.title, kind: st.kind, ref: st.ref || '', p: 0, unsafe: false, right: '', detail: null };
    if (st.kind === 'choice') {
      if (!run.sel.length) { run.hint = 'Choisis une réponse.'; render(false); return; }
      const o = st.opts[run.sel[0]], good = st.opts.find(x => x.v === 'good');
      rec.p = o.v === 'good' ? 1 : o.v === 'avoid' ? 0.4 : 0; rec.unsafe = o.v === 'danger';
      rec.right = good ? good.t : ''; rec.detail = { picked: run.sel.slice() };
    } else if (st.kind === 'multi') {
      if (!run.sel.length) { run.hint = 'Coche au moins une réponse.'; render(false); return; }
      const goods = st.opts.filter(o => o.v === 'good').length;
      let g = 0, bad = 0, danger = 0;
      run.sel.forEach(i => { const v = st.opts[i].v; if (v === 'good') g++; else if (v === 'danger') { danger++; bad++; } else bad++; });
      rec.p = Math.max(0, (g - 0.6 * (bad - danger) - 1.0 * danger) / Math.max(1, goods));
      rec.unsafe = danger > 0;
      rec.right = st.opts.filter(o => o.v === 'good').map(o => o.t).join(' · '); rec.detail = { picked: run.sel.slice() };
    } else if (st.kind === 'bilan') {
      const keys = st.checks.filter(c => c.key);
      const f = keys.filter(c => run.found[c.id]).length;
      rec.p = keys.length ? f / keys.length : 1;
      rec.right = keys.filter(c => !run.found[c.id]).map(c => c.t).join(' · ');
      rec.detail = { found: Object.assign({}, run.found), missed: keys.filter(c => !run.found[c.id]).map(c => c.id) };
    } else if (st.kind === 'order') {
      if (run.seq.length < st.items.length) { run.hint = 'Place tous les éléments dans l\'ordre (touche-les un par un).'; render(false); return; }
      let okN = 0; run.seq.forEach((idx, pos) => { if (idx === pos) okN++; });
      // tolérance : crédit partiel pour les paires dans le bon ordre relatif
      let pairs = 0, good = 0; for (let a = 0; a < run.seq.length; a++) for (let b = a + 1; b < run.seq.length; b++) { pairs++; if (run.seq[a] < run.seq[b]) good++; }
      rec.p = okN === st.items.length ? 1 : Math.max(0, (good / Math.max(1, pairs) - 0.4) / 0.6) * 0.8;
      rec.right = st.items.map((it, i) => (i + 1) + '. ' + it.t).join(' · '); rec.detail = { seq: run.seq.slice() };
    } else if (st.kind === 'transmit') {
      const total = st.sections.reduce((a, s) => a + _words(run.txt[s.id] || ''), 0);
      if (total < 6) { run.hint = 'Écris ton message avant de l\'envoyer (même court).'; render(false); return; }
      const g = _gradeTransmit(st, run.txt);
      rec.p = g.p; rec.detail = g; rec.right = 'Voir le message modèle.';
    }
    rec.p = Math.max(0, Math.min(1, rec.p));
    run.recs.push(rec); run.phase = 'fb';
    render(false); _scrollTo('sec-fb');
  }
  function _scrollTo(id) { setTimeout(() => { try { const e = _el(id); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }, 40); }

  function next() {
    if (!run || run.phase !== 'fb') return;
    const st = _step();
    if (st.sceneAfter) run.scene = _merge(run.scene, st.sceneAfter);
    run.i++;
    if (run.i >= _steps().length) { _finish(); return; }
    _enterStep(); render(); _top();
  }

  // ══ Résultat ═════════════════════════════════════════════════════════════════
  function _result() {
    const recs = run.recs, totW = recs.reduce((a, r) => a + r.w, 0) || 1;
    let raw = recs.reduce((a, r) => a + r.w * r.p, 0) / totW * 100;
    const unsafe = recs.filter(r => r.unsafe);
    const capped = unsafe.length > 0 && raw > 50;
    const total = Math.round(capped ? 50 : raw);
    const cats = {};
    recs.forEach(r => { const c = cats[r.cat] || (cats[r.cat] = { w: 0, g: 0 }); c.w += r.w; c.g += r.w * r.p; });
    return { total, raw: Math.round(raw), capped, unsafe, cats, secs: Math.round((Date.now() - run.t0) / 1000) };
  }
  function _finish() {
    const R = _result(); run.res = R; run.over = true;
    const k = run.caseId + '|' + run.mode;
    const isBest = !(P.best[k] >= R.total); if (isBest) P.best[k] = R.total;
    P.runs.push({ c: run.caseId, m: run.mode, s: R.total, d: new Date().toISOString().slice(0, 10), u: R.unsafe.length });
    if (P.runs.length > MAX_RUNS) P.runs = P.runs.slice(-MAX_RUNS);
    // points à revoir : ce qui a été raté (retiré s'il est réussi)
    const steps = _steps();
    run.recs.forEach((r, i) => {
      const key = k + '|' + r.id;
      if (r.p < 0.7) P.miss[key] = { c: run.caseId, m: run.mode, t: r.title, r: r.right, ref: r.ref, ts: Date.now() };
      else delete P.miss[key];
    });
    const keys = Object.keys(P.miss);
    if (keys.length > MAX_MISS) keys.sort((a, b) => P.miss[a].ts - P.miss[b].ts).slice(0, keys.length - MAX_MISS).forEach(x => delete P.miss[x]);
    run.isBest = isBest;
    _save(); screen = 'bilan'; render(); _top();
    try { App.Render.todayStats(); } catch (e) {}
  }
  function retry() { if (run) start(run.caseId, run.mode); }
  function other() { if (!run) return; const c = _case(run.caseId), m = run.mode === 'solo' ? 'team' : 'solo'; if (c.modes[m]) start(run.caseId, m); }
  function forget(key) { delete P.miss[key]; _save(); render(false); }

  // ══ Affichage ════════════════════════════════════════════════════════════════
  function render(top) {
    const root = _el('secours-root'); if (!root) return;
    if (screen === 'menu') root.innerHTML = _menuHtml();
    else if (screen === 'run') root.innerHTML = _runHtml();
    else if (screen === 'bilan') root.innerHTML = _bilanHtml();
    if (top !== false) _top();
  }
  const _pct = (g, w) => w ? Math.round(g / w * 100) : 0;
  const _scoreCls = s => s >= 85 ? 'ok' : s >= 60 ? 'mid' : 'low';

  function _menuHtml() {
    const cases = D().cases;
    const cards = cases.map(c => {
      const modes = Object.keys(c.modes);
      const btns = modes.map(m => {
        const b = P.best[c.id + '|' + m];
        return `<button type="button" class="sec-go ${m}" onclick="App.Sec.start('${c.id}','${m}')"><span>${MODE_ICO[m]} ${m === 'solo' ? 'Solo' : 'Équipe'}</span><small>${b != null ? 'Meilleur : ' + b + '/100' : m === 'solo' ? 'alerte 15/18' : 'chef d\'agrès'}</small></button>`;
      }).join('');
      return `<article class="sec-case">
        <div class="sec-thumb">${_sceneHtml(c.scene)}</div>
        <div class="sec-case-b">
          <h4>${_esc(c.icon)} ${_esc(c.title)}</h4>
          <div class="sec-place">📍 ${_esc(c.place)}</div>
          <div class="sec-victim">${_esc(c.victim)}</div>
          <p class="sec-hook">${_esc(c.hook)}</p>
          <div class="sec-chips">${(c.tags || []).map(t => `<span class="sec-chip">${_esc(t)}</span>`).join('')}<span class="sec-chip lvl">Niveau ${c.level}</span></div>
          <div class="sec-go-row">${btns}</div>
        </div>
      </article>`;
    }).join('');
    const fiches = D().fiches.map(f => `<details class="sec-fiche" ${ficheOpen[f.id] ? 'open' : ''} ontoggle="App.Sec._tog('${f.id}',this.open)"><summary>${_esc(f.icon)} ${_esc(f.title)}</summary><div class="sec-fiche-b">${f.html}</div></details>`).join('');
    const miss = Object.keys(P.miss).map(k => ({ k, m: P.miss[k] })).sort((a, b) => b.m.ts - a.m.ts).slice(0, 12);
    const missHtml = miss.length
      ? `<ul class="sec-miss">${miss.map(({ k, m }) => { const c = _case(m.c); return `<li><div><b>${_esc(m.t)}</b> <span class="sec-chip">${_esc(c ? c.title : m.c)} · ${m.m === 'solo' ? 'solo' : 'équipe'}</span></div><div class="sec-small">${_esc(m.r || '')}</div><div class="sec-small sec-muted">${_esc(m.ref || '')}</div><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.forget('${_esc(k)}')">J'ai compris, retirer</button></li>`; }).join('')}</ul>`
      : `<p class="sec-muted sec-small">Rien à revoir pour l'instant : les points ratés dans un cas apparaîtront ici avec la bonne réponse.</p>`;
    const runs = P.runs.slice(-5).reverse().map(r => { const c = _case(r.c); return `<li>${_esc(r.d)} · ${_esc(c ? c.title : r.c)} · ${r.m === 'solo' ? 'solo' : 'équipe'} · <b>${r.s}/100</b>${r.u ? ' · ⚠ geste dangereux' : ''}</li>`; }).join('');
    const refs = D().refs.map(r => `<li>${r.url ? `<a href="${_esc(r.url)}" target="_blank" rel="noopener">${_esc(r.label)}</a>` : _esc(r.label)}${r.note ? ` <span class="sec-muted">· ${_esc(r.note)}</span>` : ''}</li>`).join('');
    return `<div class="sec-wrap">
      <div class="sec-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.close()">← Entraînement</button></div>
      <h2 class="sec-h">🚑 Secourisme PSE1 <em class="sim-new">Nouveau</em></h2>
      <p class="sec-lead">Révise le <b>bilan en 4 regards</b>, les <b>gestes</b> et les <b>transmissions</b> sur des situations de rue à Paris. Chaque cas se joue en <b>sauveteur isolé</b> (tu alertes le 15 ou le 18) ou en <b>équipe</b> (tu rends compte à ton chef d'agrès).</p>
      <div class="sec-note">⚠️ <b>Outil de révision, pas un exercice officiel.</b> Les cas sont inventés. Il suit ton <b>Mémo Urgence V2.0</b> et tes fiches PCPS du dossier PSE, complétés par le référentiel national (liste en bas) : en cas de doute, c'est la consigne de ton formateur, de ton chef d'agrès et de ta structure qui fait foi. La correction des messages se fait par mots-clés (pas par une IA) : ton message peut être juste avec d'autres mots.</div>
      <div class="sec-actions"><button type="button" class="btn btn-primary" onclick="App.Sec.random()">🎲 Cas au hasard</button></div>
      <h3 class="sec-h3">Les cas</h3>
      <div class="sec-grid">${cards}</div>
      <h3 class="sec-h3">📚 À réviser (fiches courtes)</h3>
      <div class="sec-fiches">${fiches}</div>
      <h3 class="sec-h3">🔁 Mes points à revoir</h3>
      ${missHtml}
      ${runs ? `<h3 class="sec-h3">🕘 Dernières parties</h3><ul class="sec-runs">${runs}</ul>` : ''}
      <h3 class="sec-h3">Sources et limites</h3>
      <ul class="sec-refs">${refs}</ul>
      <p class="sec-small sec-muted">Ta progression reste sur cet appareil (rien n'est envoyé). Ce module est fait pour réviser seul : il ne remplace ni les mises en situation pratiques, ni le matériel réel.</p>
    </div>`;
  }

  const _regLabel = n => ({ 1: '1er regard · La scène', 2: '2e regard · La menace vitale', 3: '3e regard · Les fonctions vitales', 4: '4e regard · Mesures et lésions' }[n] || '');
  function _runHtml() {
    const c = _case(run.caseId), m = c.modes[run.mode], st = _step(), n = _steps().length;
    const prog = `<div class="sec-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${run.i + 1}">${_steps().map((s, i) => `<i class="${i < run.i ? 'done' : i === run.i ? 'cur' : ''}"></i>`).join('')}</div>`;
    const cat = D().cats[st.cat] || '';
    const chips = `<div class="sec-chips"><span class="sec-chip cat">${_esc(cat)}</span>${st.regard ? `<span class="sec-chip reg">${_esc(_regLabel(st.regard))}</span>` : ''}<span class="sec-chip">Étape ${run.i + 1}/${n}</span></div>`;
    const intro = run.i === 0 ? `<div class="sec-intro"><div class="sec-role">${MODE_ICO[run.mode]} <b>${_esc(MODE_LABEL[run.mode])}</b> · ${_esc(m.role)}</div><p>${_fmt(m.intro)}</p></div>` : '';
    return `<div class="sec-wrap sec-run">
      <div class="sec-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.quit()">✕ Quitter</button><b class="sec-title">${_esc(c.icon)} ${_esc(c.title)}</b><span class="sec-mode ${run.mode}">${MODE_ICO[run.mode]} ${_esc(MODE_LABEL[run.mode])}</span></div>
      ${prog}
      <div class="sec-cols">
        <div class="sec-left"><div class="sec-scene" id="sec-scene">${_sceneHtml(run.scene)}</div>${_historyHtml()}</div>
        <div class="sec-right">
          ${intro}
          <section class="sec-card" id="sec-step">
            ${chips}
            <h3 class="sec-st">${_esc(st.title)}</h3>
            ${st.say ? `<div class="sec-say">${_fmt(st.say)}</div>` : ''}
            ${st.q ? `<div class="sec-q">${_fmt(st.q)}</div>` : ''}
            ${run.phase === 'ask' ? _askHtml(st) : _askHtml(st, true)}
          </section>
          ${run.phase === 'fb' ? _fbHtml(st) : ''}
        </div>
      </div>
    </div>`;
  }
  function _historyHtml() {
    if (!run.recs.length) return '';
    const items = run.recs.map((r, i) => `<li class="${r.unsafe ? 'bad' : r.p >= 0.85 ? 'ok' : r.p >= 0.5 ? 'mid' : 'low'}"><span>${r.unsafe ? '⛔' : r.p >= 0.85 ? '✓' : r.p >= 0.5 ? '~' : '✗'}</span> ${_esc(r.title)}</li>`).join('');
    return `<details class="sec-hist"><summary>Ce que j'ai fait jusqu'ici (${run.recs.length})</summary><ul>${items}</ul></details>`;
  }

  // ── Zone de réponse selon le type d'étape ───────────────────────────────
  function _askHtml(st, locked) {
    const dis = locked ? 'disabled' : '';
    const hint = run.hint ? `<div class="sec-hint" role="alert">${_esc(run.hint)}</div>` : '';
    let h = '';
    if (st.kind === 'choice' || st.kind === 'multi') {
      const multi = st.kind === 'multi';
      h += multi ? `<div class="sec-small sec-muted">Coche toutes les bonnes actions (plusieurs réponses possibles).</div>` : '';
      h += `<div class="sec-opts" role="${multi ? 'group' : 'radiogroup'}">` + st.opts.map((o, i) => {
        const on = run.sel.indexOf(i) >= 0;
        let cls = 'sec-opt' + (on ? ' on' : '');
        if (locked) cls += ' ' + (o.v === 'good' ? 'good' : on ? (o.v === 'danger' ? 'danger' : 'avoid') : '') + (on ? ' picked' : '');
        return `<button type="button" class="${cls}" ${dis} aria-pressed="${on}" onclick="App.Sec.pick(${i})"><span class="sec-mark">${multi ? (on ? '☑' : '☐') : (on ? '◉' : '○')}</span><span>${_esc(o.t)}</span></button>`;
      }).join('') + '</div>';
    } else if (st.kind === 'bilan') {
      const groups = {};
      st.checks.forEach(c => { (groups[c.regard || 0] = groups[c.regard || 0] || []).push(c); });
      h += `<div class="sec-small sec-muted">${_esc(st.hint || 'Touche ce que tu veux regarder ou vérifier. Chaque point te montre ce que tu constates.')}</div>`;
      h += Object.keys(groups).sort().map(g => `<div class="sec-chk-grp">${+g ? `<div class="sec-chk-t">${_esc(_regLabel(+g))}</div>` : ''}<div class="sec-chks">${groups[g].map(c => {
        const on = !!run.found[c.id];
        const miss = locked && c.key && !on;
        return `<button type="button" class="sec-chk ${on ? 'on' : ''} ${miss ? 'miss' : ''}" ${dis} onclick="App.Sec.check('${c.id}')">${on ? '✓ ' : ''}${_esc(c.t)}</button>`;
      }).join('')}</div></div>`).join('');
      const obs = st.checks.filter(c => run.found[c.id] || (locked && c.key));
      if (obs.length) h += `<div class="sec-obs"><div class="sec-obs-t">🔎 Ce que tu constates</div><ul>${obs.map(c => `<li class="${run.found[c.id] ? '' : 'missed'}"><b>${_esc(c.t)}</b> — ${_fmt(c.obs)}${run.found[c.id] ? '' : ' <em>(non vérifié)</em>'}</li>`).join('')}</ul></div>`;
    } else if (st.kind === 'order') {
      const placed = run.seq;
      h += `<div class="sec-small sec-muted">Touche les éléments dans l'ordre où tu les fais.</div>`;
      h += `<ol class="sec-seq">${placed.map(i => `<li>${_esc(st.items[i].t)}</li>`).join('') || '<li class="empty">Ton ordre apparaît ici</li>'}</ol>`;
      h += `<div class="sec-opts">${run.items.map(i => { const used = placed.indexOf(i) >= 0; return `<button type="button" class="sec-opt ${used ? 'used' : ''}" ${used || locked ? 'disabled' : ''} onclick="App.Sec.place(${i})"><span class="sec-mark">${used ? placed.indexOf(i) + 1 : '＋'}</span><span>${_esc(st.items[i].t)}</span></button>`; }).join('')}</div>`;
      if (!locked) h += `<div class="sec-row"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.unplace()">↶ Annuler le dernier</button><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.clearSeq()">Tout effacer</button></div>`;
    } else if (st.kind === 'transmit') {
      h += `<div class="sec-small sec-muted">${_fmt(st.intro || '')}</div>`;
      if (st.method) h += `<div class="sec-method">${_fmt(st.method)}</div>`;
      h += st.sections.map(s => `<label class="sec-ta"><span><b>${_esc(s.label)}</b> <small>${_esc(s.hint || '')}</small></span><textarea id="sec-ta-${s.id}" rows="${s.rows || 2}" ${dis} placeholder="${_esc(s.ph || '')}" oninput="App.Sec.setTxt('${s.id}',this.value)">${_esc(run.txt[s.id] || '')}</textarea></label>`).join('');
    }
    if (!locked) {
      h += hint + `<div class="sec-row sec-validate"><button type="button" class="btn btn-primary" onclick="App.Sec.validate()">${st.kind === 'bilan' ? '✔ J\'ai fini ce regard' : st.kind === 'transmit' ? '📞 Envoyer le message' : '✔ Valider'}</button></div>`;
    }
    return h;
  }

  // ── Correction d'une étape ───────────────────────────────────────────
  function _fbHtml(st) {
    const rec = run.recs[run.recs.length - 1];
    const verdict = rec.unsafe ? ['danger', '⛔ Geste dangereux', 'Ce choix peut aggraver l\'état de la victime ou te mettre en danger.']
      : rec.p >= 0.85 ? ['ok', '✓ Bon réflexe', ''] : rec.p >= 0.5 ? ['mid', '~ Presque', 'Une partie est juste, regarde ce qui manque.'] : ['low', '✗ À revoir', 'Regarde la bonne réponse et pourquoi.'];
    let body = '';
    if (st.kind === 'choice') {
      const o = st.opts[run.sel[0]], good = st.opts.find(x => x.v === 'good');
      body += `<div class="sec-fb-row ${o.v}"><b>Ta réponse :</b> ${_esc(o.t)}<div class="sec-why">${_fmt(o.why || '')}</div></div>`;
      if (good && good !== o) body += `<div class="sec-fb-row good"><b>À faire :</b> ${_esc(good.t)}<div class="sec-why">${_fmt(good.why || '')}</div></div>`;
    } else if (st.kind === 'multi') {
      body += `<ul class="sec-fb-list">${st.opts.map((o, i) => {
        const on = run.sel.indexOf(i) >= 0;
        const mark = o.v === 'good' ? (on ? '✓' : '✗ oublié') : (on ? (o.v === 'danger' ? '⛔' : '✗') : '·');
        const cls = o.v === 'good' ? (on ? 'ok' : 'miss') : (on ? 'bad' : 'neutral');
        return `<li class="${cls}"><span class="sec-fbm">${mark}</span><div>${_esc(o.t)}<div class="sec-why">${_fmt(o.why || '')}</div></div></li>`;
      }).join('')}</ul>`;
    } else if (st.kind === 'bilan') {
      const keys = st.checks.filter(c => c.key), missed = keys.filter(c => !run.found[c.id]);
      body += `<div class="sec-fb-row ${missed.length ? 'avoid' : 'good'}"><b>Points essentiels :</b> ${keys.length - missed.length}/${keys.length} vérifiés.</div>`;
      if (missed.length) body += `<ul class="sec-fb-list">${missed.map(c => `<li class="miss"><span class="sec-fbm">✗ oublié</span><div><b>${_esc(c.t)}</b><div class="sec-why">${_fmt(c.why || c.obs)}</div></div></li>`).join('')}</ul>`;
    } else if (st.kind === 'order') {
      body += `<ol class="sec-fb-ord">${st.items.map((it, i) => { const ok = run.seq[i] === i; return `<li class="${ok ? 'ok' : 'bad'}"><span class="sec-fbm">${ok ? '✓' : '✗'}</span><div>${_esc(it.t)}${it.why ? `<div class="sec-why">${_fmt(it.why)}</div>` : ''}</div></li>`; }).join('')}</ol>`;
      if (rec.p < 1) body += `<div class="sec-small sec-muted">Ton ordre : ${run.seq.map(i => st.items[i].t.split(' ').slice(0, 4).join(' ') + '…').map((t, k) => (k + 1) + '. ' + t).join(' ')}</div>`;
    } else if (st.kind === 'transmit') {
      const g = rec.detail;
      body += `<ul class="sec-fb-list">${g.els.map(e => `<li class="${e.ok ? 'ok' : 'miss'}"><span class="sec-fbm">${e.ok ? '✓' : '✗'}</span><div>${_esc(e.label)}</div></li>`).join('')}</ul>`;
      g.tips.forEach(t => { body += `<div class="sec-fb-row avoid">💡 ${_esc(t)}</div>`; });
      const rp = st.reply || {};
      const reply = rec.p >= 0.8 ? rp.good : rec.p >= 0.5 ? rp.mid : rp.low;
      if (reply) body += `<div class="sec-reply"><b>${_esc(st.who || 'Réponse')} :</b> « ${_fmt(reply)} »</div>`;
      if (st.model) body += `<details class="sec-model"><summary>Voir un message modèle</summary>${st.sections.map(s => `<p><b>${_esc(s.label)}</b><br>${_fmt(st.model[s.id] || '')}</p>`).join('')}<p class="sec-small sec-muted">Il y a plusieurs bonnes façons de le dire : ce qui compte, c'est que les informations essentielles y soient.</p></details>`;
    }
    const why = st.fb ? `<div class="sec-fb-note">${_fmt(st.fb)}</div>` : '';
    const after = st.after ? `<div class="sec-after">${_fmt(st.after)}</div>` : '';
    const last = run.i >= _steps().length - 1;
    return `<section class="sec-fb ${verdict[0]}" id="sec-fb" aria-live="polite">
      <div class="sec-verdict">${verdict[1]}${verdict[2] ? ` <small>${_esc(verdict[2])}</small>` : ''}<span class="sec-pts">${Math.round(rec.p * 100)} %</span></div>
      ${body}${why}${after}
      ${st.ref ? `<div class="sec-ref">📖 ${_esc(st.ref)}</div>` : ''}
      <div class="sec-row"><button type="button" class="btn btn-primary" onclick="App.Sec.next()">${last ? '🏁 Voir mon bilan' : 'Continuer →'}</button></div>
    </section>`;
  }

  // ── Bilan final ─────────────────────────────────────────────────────
  function _bilanHtml() {
    const R = run.res, c = _case(run.caseId);
    const cats = Object.keys(R.cats).map(k => { const v = R.cats[k], p = _pct(v.g, v.w); return `<div class="sec-cat"><span>${_esc(D().cats[k] || k)}</span><div class="sec-bar-c"><i class="${_scoreCls(p)}" style="width:${p}%"></i></div><b>${p} %</b></div>`; }).join('');
    const lvl = R.total >= 85 ? 'Très bien : tu es à l\'aise sur ce cas.' : R.total >= 60 ? 'Bien, mais quelques points à solidifier.' : 'À retravailler : relis la fiche et recommence.';
    const rows = run.recs.map(r => `<li class="${r.unsafe ? 'bad' : r.p >= 0.85 ? 'ok' : r.p >= 0.5 ? 'mid' : 'low'}"><span class="sec-fbm">${r.unsafe ? '⛔' : r.p >= 0.85 ? '✓' : r.p >= 0.5 ? '~' : '✗'}</span><div><b>${_esc(r.title)}</b>${r.p < 0.85 && r.right ? `<div class="sec-small">• ${_esc(r.right).replace(/ · /g, '<br>• ')}</div>` : ''}${r.p < 0.85 && r.ref ? `<div class="sec-small sec-muted">${_esc(r.ref)}</div>` : ''}</div><span class="sec-pts">${Math.round(r.p * 100)} %</span></li>`).join('');
    const mm = Math.floor(R.secs / 60), ss = String(R.secs % 60).padStart(2, '0');
    const unsafe = R.unsafe.length ? `<div class="sec-warn-box">⛔ <b>${R.unsafe.length} geste${R.unsafe.length > 1 ? 's' : ''} dangereux${R.unsafe.length > 1 ? '' : ''}</b>${R.capped ? ' : ton score est plafonné à 50/100. En vrai secours, un geste dangereux compte plus que le reste.' : '.'}<ul>${R.unsafe.map(u => `<li>${_esc(u.title)}</li>`).join('')}</ul></div>` : '';
    return `<div class="sec-wrap">
      <div class="sec-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Sec.toMenu()">← Les cas</button><b class="sec-title">${_esc(c.icon)} ${_esc(c.title)}</b><span class="sec-mode ${run.mode}">${MODE_ICO[run.mode]} ${_esc(MODE_LABEL[run.mode])}</span></div>
      <div class="sec-score ${_scoreCls(R.total)}"><div class="sec-score-n">${R.total}<small>/100</small></div><div><b>${_esc(lvl)}</b><div class="sec-small sec-muted">Durée : ${mm} min ${ss} s${run.isBest ? ' · 🏅 nouveau meilleur score pour ce cas' : ''}</div></div></div>
      ${unsafe}
      <div class="sec-cats">${cats}</div>
      <h3 class="sec-h3">Étape par étape</h3>
      <ul class="sec-recap">${rows}</ul>
      <div class="sec-note sec-small">Rappel : ce score ne vaut pas une évaluation officielle. Les points ratés sont ajoutés à « Mes points à revoir » dans le menu. Demande à ton chef d'agrès ou à ton formateur de confirmer les points sur lesquels tu as un doute.</div>
      <div class="sec-actions">
        <button type="button" class="btn btn-primary" onclick="App.Sec.retry()">↺ Recommencer ce cas</button>
        ${c.modes[run.mode === 'solo' ? 'team' : 'solo'] ? `<button type="button" class="btn btn-ghost" onclick="App.Sec.other()">${run.mode === 'solo' ? '👥 Le même cas en équipe' : '🧍 Le même cas en solo'}</button>` : ''}
        <button type="button" class="btn btn-ghost" onclick="App.Sec.random()">🎲 Un autre cas</button>
        <button type="button" class="btn btn-ghost" onclick="App.Sec.toMenu()">Menu</button>
      </div>
    </div>`;
  }

  function _tog(id, o) { ficheOpen[id] = !!o; }

  // ══ Clavier : Entrée valide / continue (hors zone de texte) ══════════════════
  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', e => {
      const root = _el('secours-root'); if (!root || root.style.display === 'none' || !run) return;
      if (e.target && /TEXTAREA|INPUT/.test(e.target.tagName)) return;
      if (e.key === 'Enter' && screen === 'run' && run.phase === 'fb') { e.preventDefault(); next(); }
    });
    _keysBound = true;
  }

  return {
    open, close, toMenu, start, random, quit, pick, check, place, unplace, clearSeq, setTxt, validate, next, retry, other, forget, isTraining, _tog,
    _t: { norm: _norm, grade: _gradeTransmit, state: () => ({ screen, run, P }), result: () => (run && run.res) || null, reset: () => { P = { v: 1, best: {}, runs: [], miss: {} }; _save(); }, merge: _merge }
  };
})();
