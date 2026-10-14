// core/tp.js — Entraînement « TP » (App.Tp) : travaux pratiques, d'abord l'hygiène des mains (FHA + lavage).
// Activités : fiche · prérequis · reconnaître le geste · ordre des gestes · pratique guidée avec minuteur ·
// situations de soins (Temps 2) · auto-évaluation avec la grille officielle (Oui/Non, Temps 1 /12 et Temps 2 /15).
// Données : data/tp_fha.js. Dessins : ui/tp_art.js. Progression gardée sur cet appareil seulement (localStorage ifsi_tp_v1).
// Le temps passé est compté par App.Activity (kind « tp »).
// ⚠ Outil de RÉVISION : l'auto-évaluation n'est pas une évaluation officielle ; le protocole de l'IFSI / du stage prime.
'use strict';
window.App = window.App || {};

App.Tp = (() => {
  const KEY = 'ifsi_tp_v1';
  const MAX_EVALS = 30, MAX_MISS = 30;
  let P = { v: 1, best: {}, evals: [], miss: {} };
  let screen = 'menu';                       // menu | home | fiche | quiz | result | guide | evalstart | eval | evalres
  let tpId = null, q = null, G = null, E = null, _timer = null, _resLast = null;

  const D = () => App.TpData;
  const _tp = () => D().tps.find(t => t.id === tpId);
  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _fmt = s => _esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const _shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const _top = () => { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} };
  const _pct = (g, w) => w ? Math.round(g / w * 100) : 0;
  const _cls = s => s >= 85 ? 'ok' : s >= 60 ? 'mid' : 'low';
  const _art = id => (App.TpArt ? App.TpArt.svg(id) : '');
  const _step = id => _tp().steps.find(s => s.id === id);
  const _dateFr = ts => { const d = new Date(ts); return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };

  // ══ Sauvegarde ═══════════════════════════════════════════════════════════
  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) P = { v: 1, best: r.best && typeof r.best === 'object' ? r.best : {}, evals: Array.isArray(r.evals) ? r.evals.slice(0, MAX_EVALS) : [], miss: r.miss && typeof r.miss === 'object' ? r.miss : {} };
    } catch (e) {}
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  function _addMiss(kind, id, label) {
    P.miss[kind + '|' + tpId + '|' + id] = { ts: Date.now(), kind, tp: tpId, label: String(label).slice(0, 140) };
    const ks = Object.keys(P.miss).sort((a, b) => P.miss[b].ts - P.miss[a].ts);
    ks.slice(MAX_MISS).forEach(k => delete P.miss[k]);
  }

  // ══ Navigation ═══════════════════════════════════════════════════════════
  function open() {
    _load();
    const root = _el('tp-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root', 'pharma-root', 'gazo-root', 'secours-root', 'dose-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; tpId = null; q = null; G = null; E = null;
    render(); _top();
  }
  function close() {
    _stopTimer();
    const root = _el('tp-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    q = null; G = null; E = null; screen = 'menu'; tpId = null;
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { _stopTimer(); screen = 'menu'; tpId = null; q = null; G = null; E = null; render(); _top(); }
  function pick(id) { if (!D().tps.find(t => t.id === id)) return; tpId = id; screen = 'home'; render(); _top(); }
  function toHome() { _stopTimer(); screen = 'home'; q = null; G = null; E = null; render(); _top(); }
  function isTraining() { return screen !== 'menu' && screen !== 'home'; }

  // ══ Affichage ═══════════════════════════════════════════════════════════
  function render(top) {
    const root = _el('tp-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml();
    else if (screen === 'home') h = _homeHtml();
    else if (screen === 'fiche') h = _ficheHtml();
    else if (screen === 'quiz') h = _quizHtml();
    else if (screen === 'result') h = _resultHtml();
    else if (screen === 'guide') h = _guideHtml();
    else if (screen === 'evalstart') h = _evalStartHtml();
    else if (screen === 'eval') h = _evalHtml();
    else if (screen === 'evalres') h = _evalResHtml();
    root.innerHTML = `<div class="tp-wrap">${h}</div>`;
    if (top !== false) _top();
  }
  const _bar = (back, title) => `<div class="tp-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="${back}">← Retour</button><div class="tp-bar-title">${_esc(title)}</div></div>`;
  const _disc = () => `<p class="tp-disc">${_esc(D().disclaimer)}</p>`;

  // ── Menu ──
  function _menuHtml() {
    const cards = D().tps.map(t => {
      const bests = ['prereq', 'recog', 'order', 'ctx'].map(k => P.best[t.id + '|' + k]).filter(v => v != null);
      const lastEv = P.evals.find(e => e.tp === t.id);
      return `<button type="button" class="tp-card" onclick="App.Tp.pick('${t.id}')">
        <span class="tp-card-ico">${t.icon}</span>
        <span class="tp-card-txt"><span class="tp-card-name">${_esc(t.title)}</span><span class="tp-card-ue">${_esc(t.ue)}</span>
          <span class="tp-card-desc">${_esc(t.short)}</span>
          <span class="tp-chips">${t.grid ? '<span class="tp-chip">Grille officielle</span>' : '<span class="tp-chip soft">Sans grille officielle</span>'}${bests.length ? `<span class="tp-chip soft">Meilleurs scores : ${bests.map(v => v + '%').join(' · ')}</span>` : ''}${lastEv ? `<span class="tp-chip soft">Dernière auto-éval : ${lastEv.total}/${lastEv.max}</span>` : ''}</span></span>
        <span class="tp-card-go">Ouvrir →</span></button>`;
    }).join('');
    return `<div class="tp-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Tp.close()">← Entraînement</button></div>
      <h2 class="tp-title">🧪 Entraînement TP</h2>
      <p class="tp-lead">Répète la technique et le raisonnement demandés à l'évaluation de TP. Commence par l'hygiène des mains, calquée sur ta grille officielle. D'autres TP pourront être ajoutés avec leurs grilles.</p>
      <div class="tp-note">✅ <b>Fonctionne hors ligne.</b> 🧪 Les schémas sont simplifiés : ils ne remplacent ni ton TP en salle ni la démonstration de ton formateur. 📱 Ta progression reste sur cet appareil.</div>
      <div class="tp-cards">${cards}</div>
      ${_histHtml(null, 6)}
      ${_disc()}`;
  }
  function _histHtml(onlyTp, n) {
    const list = P.evals.filter(e => !onlyTp || e.tp === onlyTp).slice(0, n);
    if (!list.length) return '';
    return `<h3 class="tp-h">🗂️ Mes auto-évaluations</h3><div class="tp-card2"><div class="tp-hist">${list.map(e => {
      const tp = D().tps.find(t => t.id === e.tp);
      return `<div class="tp-hist-row"><span>${_esc(_dateFr(e.ts))}</span><span>${_esc(tp ? tp.title.replace(/ \(.*/, '') : e.tp)} · ${e.who === 'pair' ? '👥 ' + _esc(e.name || 'camarade') : '🙋 moi'}</span><b class="${_cls(_pct(e.total, e.max))}">${e.total}/${e.max}</b></div>`;
    }).join('')}</div></div>`;
  }

  // ── Accueil d'un TP ──
  function _homeHtml() {
    const t = _tp();
    const hasArt = t.steps.some(s => s.art);
    const act = (ico, name, desc, fn, key) => {
      const b = key ? P.best[t.id + '|' + key] : null;
      return `<button type="button" class="tp-act" onclick="${fn}"><span class="tp-act-ico">${ico}</span><span class="tp-act-txt"><b>${name}</b><small>${desc}</small></span>${b != null ? `<span class="tp-best ${_cls(b)}">${b}%</span>` : ''}</button>`;
    };
    const acts = [
      act('📖', 'Fiche : technique et critères', t.grid ? "Les gestes un par un et les critères de ta grille." : 'Les étapes et les points de vigilance.', 'App.Tp.fiche()'),
      t.grid ? act('👕', 'Prérequis : repère ce qui ne va pas', 'Avant-bras, bijoux, ongles : 6 situations.', "App.Tp.startQuiz('prereq')", 'prereq') : '',
      hasArt ? act('👀', 'Reconnais le geste', 'On te montre le schéma : quel geste est-ce ?', "App.Tp.startQuiz('recog')", 'recog') : '',
      act('🔀', "Remets les gestes dans l'ordre", 'Tape les étapes dans le bon ordre.', "App.Tp.startQuiz('order')", 'order'),
      act('⏱️', 'Pratique guidée avec minuteur', t.grid ? 'Fais le geste devant ton téléphone : le guide te dit quoi faire et pendant combien de temps.' : 'Le guide te donne les étapes et chronomètre le frottement.', 'App.Tp.startGuide()'),
      act('🏥', 'Situations de soins', t.grid ? "Temps 2 : faut-il une hygiène des mains, laquelle, quand ?" : "Quelle méthode, quand, comment ?", "App.Tp.startQuiz('ctx')", 'ctx'),
      t.grid ? act('✅', 'Auto-évaluation avec la grille', "Oui/Non critère par critère, Temps 1 /12 et Temps 2 /15. Toi ou un camarade.", 'App.Tp.evalStart()') : ''
    ].join('');
    const miss = Object.keys(P.miss).map(k => P.miss[k]).filter(m => m.tp === t.id).sort((a, b) => b.ts - a.ts).slice(0, 8);
    const missH = miss.length ? `<h3 class="tp-h">🔁 À revoir</h3><div class="tp-card2"><ul class="tp-ul">${miss.map(m => `<li>${_esc(m.label)}</li>`).join('')}</ul><button type="button" class="btn btn-ghost btn-sm" onclick="App.Tp.clearMiss()">Effacer cette liste</button></div>` : '';
    return `${_bar('App.Tp.toMenu()', t.title)}
      <h2 class="tp-title">${t.icon} ${_esc(t.title)}</h2>
      <p class="tp-lead">${_esc(t.short)}</p>
      ${t.sheet ? `<p class="tp-src">📄 Source : ${_esc(t.sheet)}</p>` : ''}
      <div class="tp-acts">${acts}</div>
      ${missH}${_histHtml(t.id, 5)}${_disc()}`;
  }
  function clearMiss() { Object.keys(P.miss).forEach(k => { if (P.miss[k].tp === tpId) delete P.miss[k]; }); _save(); render(false); }

  // ── Fiche ──
  function fiche() { screen = 'fiche'; render(); }
  function _ficheHtml() {
    const t = _tp();
    const steps = t.steps.map(s => `<article class="tp-step">${s.art ? `<div class="tp-step-art">${_art(s.art)}</div>` : `<div class="tp-step-ico">${s.ico || ''}</div>`}
      <div class="tp-step-b"><div class="tp-step-h"><span class="tp-code">${_esc(s.code)}</span><b>${_esc(s.label)}</b></div><p>${_esc(s.how)}</p></div></article>`).join('');
    const pre = t.grid ? `<h3 class="tp-h">Les 3 prérequis (avant de commencer)</h3><div class="tp-card2">${D().prereqs.map(p => `<div class="tp-pre"><span class="tp-pre-ico">${p.ico}</span><div><b>${_esc(p.label)}</b> <span class="tp-muted">(${_esc(p.detail)})</span><div class="tp-muted tp-small">${_esc(p.why)}</div></div></div>`).join('')}</div>` : '';
    const more = (t.fiche || []).map(f => `<div class="tp-card2"><h4 class="tp-h4">${_esc(f.t)}</h4>${f.list ? `<ol class="tp-ol">${t.moments.map(m => `<li>${_esc(m)}</li>`).join('')}</ol>` : `<p>${_fmt(f.p)}</p>`}</div>`).join('');
    const crit = t.grid ? `<h3 class="tp-h">Les critères de la grille officielle</h3><div class="tp-card2">${t.grid.temps.map(tm => `<p><b>${_esc(tm.title)}</b> — ${tm.max} points (1 point par critère « Oui »)</p>`).join('')}<p class="tp-muted tp-small">Chaque critère vaut 1 point si l'évaluateur coche « Oui », 0 si « Non ». Détail critère par critère dans « Auto-évaluation avec la grille ».</p></div>` : '';
    return `${_bar('App.Tp.toHome()', t.title)}<h2 class="tp-title">📖 Fiche · ${_esc(t.title)}</h2>
      ${pre}<h3 class="tp-h">Les gestes, dans l'ordre</h3>${steps}${more}${crit}
      <div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.toHome()">Terminer</button></div>${_disc()}`;
  }

  // ══ Quiz (prérequis · reconnaître · ordre · situations) ═════════════════════════════
  const KINDS = { prereq: 'Prérequis', recog: 'Reconnais le geste', order: 'Ordre des gestes', ctx: 'Situations de soins' };
  function startQuiz(kind) {
    const t = _tp(); if (!t) return;
    let items = [];
    if (kind === 'prereq') items = _shuffle(D().prereqCases).slice(0, 6);
    else if (kind === 'recog') items = _shuffle(t.steps.filter(s => s.art));
    else if (kind === 'order') items = [null];
    else if (kind === 'ctx') items = _shuffle(t.contexts).slice(0, 8);
    q = { kind, items, i: 0, score: 0, total: kind === 'order' ? t.steps.length : items.length, sel: [], seq: [], checked: false, ok: false, log: [], t0: Date.now() };
    if (kind === 'order') q.pool = _shuffle(t.steps.map(s => s.id));
    if (kind === 'recog' || kind === 'ctx') _prepOpts();
    screen = 'quiz'; render();
  }
  function _prepOpts() {
    const t = _tp(), it = q.items[q.i]; if (!it) return;
    if (q.kind === 'recog') {
      const others = _shuffle(t.steps.filter(s => s.id !== it.id && s.art)).slice(0, 3).map(s => s.id);
      q.opts = _shuffle([it.id].concat(others));
    } else if (q.kind === 'ctx') {
      q.opts = _shuffle(it.opts.map((o, i) => i));
    }
    q.sel = []; q.checked = false; q.ok = false;
  }
  function _quizHtml() {
    const t = _tp();
    const head = `${_bar('App.Tp.quitQuiz()', KINDS[q.kind])}`;
    if (q.kind === 'order') return head + _orderHtml(t);
    const n = q.items.length, it = q.items[q.i];
    const prog = `<div class="tp-prog"><i style="width:${Math.round(q.i / n * 100)}%"></i></div><div class="tp-muted tp-small">Question ${q.i + 1} sur ${n} · ${q.score} bonne${q.score > 1 ? 's' : ''} réponse${q.score > 1 ? 's' : ''}</div>`;
    let body = '';
    if (q.kind === 'prereq') {
      const pre = D().prereqs;
      const btns = pre.map(p => { const on = q.sel.includes(p.id); const bad = q.checked && it.bad.includes(p.id), wrongOn = q.checked && on && !it.bad.includes(p.id);
        return `<button type="button" class="tp-tog ${on ? 'on' : ''} ${q.checked ? (bad ? 'good' : (wrongOn ? 'wrong' : '')) : ''}" aria-pressed="${on}" ${q.checked ? 'disabled' : ''} onclick="App.Tp.togPre('${p.id}')"><span>${p.ico}</span><span>${_esc(p.label)} <small>non respecté${on ? ' ✓' : ''}</small></span></button>`; }).join('');
      let fb = '';
      if (q.checked) {
        const whys = it.bad.length ? it.bad.map(id => { const p = pre.find(x => x.id === id); return `<li><b>${_esc(p.label)}</b> : ${_esc(p.why)}</li>`; }).join('') : '';
        fb = `<div class="tp-fb ${q.ok ? 'ok' : 'bad'}"><b>${q.ok ? '✓ Bien vu' : '✗ À revoir'}</b><p>${it.bad.length ? 'Ce qui n\'est pas conforme : ' + it.bad.map(id => _esc(pre.find(x => x.id === id).label.toLowerCase())).join(' ; ') + '.' : 'Tout est conforme : aucun prérequis à corriger.'}</p>${whys ? `<ul class="tp-ul">${whys}</ul>` : ''}</div>`;
      }
      body = `<div class="tp-card2"><p class="tp-situ">${_esc(it.text)}</p><p class="tp-q">Quels prérequis ne sont PAS respectés ? <span class="tp-muted tp-small">(coche-les ; si tout est bon, ne coche rien)</span></p><div class="tp-togs">${btns}</div>${fb}
        <div class="tp-row">${q.checked ? `<button type="button" class="btn btn-primary" onclick="App.Tp.next()">${q.i + 1 < n ? 'Question suivante →' : 'Voir mon résultat →'}</button>` : `<button type="button" class="btn btn-primary" onclick="App.Tp.check()">Valider${q.sel.length ? '' : ' : tout est conforme'}</button>`}</div></div>`;
    } else if (q.kind === 'recog') {
      const opts = q.opts.map(id => { const s = _step(id), chosen = q.sel[0] === id;
        const cls = q.checked ? (id === it.id ? 'good' : (chosen ? 'wrong' : '')) : '';
        return `<button type="button" class="tp-opt ${cls}" ${q.checked ? 'disabled' : ''} onclick="App.Tp.answer('${id}')"><span class="tp-code">${_esc(s.code)}</span><span>${_esc(s.label)}</span></button>`; }).join('');
      const fb = q.checked ? `<div class="tp-fb ${q.ok ? 'ok' : 'bad'}"><b>${q.ok ? '✓ Exact' : '✗ Ce n\'était pas celui-là'}</b><p>C'était : <b>${_esc(it.label)}</b>. ${_esc(it.how)}</p></div>` : '';
      body = `<div class="tp-card2"><div class="tp-quiz-art">${_art(it.art).replace(/<text[^>]*>[^<]*<\/text>/g, '')}</div><p class="tp-q">Quel geste le schéma montre-t-il ?</p><div class="tp-opts">${opts}</div>${fb}
        ${q.checked ? `<div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.next()">${q.i + 1 < n ? 'Suivant →' : 'Voir mon résultat →'}</button></div>` : ''}</div>`;
    } else if (q.kind === 'ctx') {
      const opts = q.opts.map((oi, k) => { const chosen = q.sel[0] === oi;
        const cls = q.checked ? (oi === it.good ? 'good' : (chosen ? 'wrong' : '')) : '';
        return `<button type="button" class="tp-opt ${cls}" ${q.checked ? 'disabled' : ''} onclick="App.Tp.answer(${oi})"><span class="tp-code">${String.fromCharCode(65 + k)}</span><span>${_esc(it.opts[oi])}</span></button>`; }).join('');
      const fb = q.checked ? `<div class="tp-fb ${q.ok ? 'ok' : 'bad'}"><b>${q.ok ? '✓ Bonne réponse' : '✗ À revoir'}</b><p>${q.ok ? '' : 'Bonne réponse : ' + _esc(it.opts[it.good]) + '. '}${_esc(it.why)}</p></div>` : '';
      body = `<div class="tp-card2"><p class="tp-situ">${_esc(it.situ)}</p><p class="tp-q">${_esc(it.q)}</p><div class="tp-opts">${opts}</div>${fb}
        ${q.checked ? `<div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.next()">${q.i + 1 < n ? 'Situation suivante →' : 'Voir mon résultat →'}</button></div>` : ''}</div>`;
    }
    return head + prog + body;
  }
  function togPre(id) {
    if (!q || q.kind !== 'prereq' || q.checked) return;
    const k = q.sel.indexOf(id); if (k >= 0) q.sel.splice(k, 1); else q.sel.push(id);
    render(false);
  }
  function check() {
    if (!q || q.kind !== 'prereq' || q.checked) return;
    const it = q.items[q.i], a = q.sel.slice().sort().join(','), b = it.bad.slice().sort().join(',');
    q.ok = a === b; q.checked = true;
    if (q.ok) q.score++; else _addMiss('prereq', it.id, 'Prérequis : ' + it.text.split('.')[0] + '.');
    q.log.push({ ok: q.ok });
    render(false);
  }
  function answer(v) {
    if (!q || q.checked || (q.kind !== 'recog' && q.kind !== 'ctx')) return;
    const it = q.items[q.i];
    q.sel = [v]; q.checked = true;
    q.ok = q.kind === 'recog' ? v === it.id : Number(v) === it.good;
    if (q.ok) q.score++;
    else _addMiss(q.kind, it.id, q.kind === 'recog' ? 'Geste à reconnaître : ' + it.label : 'Situation : ' + it.situ.split('.')[0] + '.');
    q.log.push({ ok: q.ok });
    render(false);
  }
  function next() {
    if (!q || !q.checked) return;
    if (q.i + 1 >= q.items.length) return _finish();
    q.i++; _prepOpts(); render();
  }
  // ordre des gestes
  function _orderHtml(t) {
    const placed = q.seq.map((id, k) => { const s = _step(id), st = q.checked ? (id === t.steps[k].id ? 'good' : 'wrong') : '';
      return `<li class="tp-seq ${st}"><span class="tp-seq-n">${k + 1}</span><span class="tp-code">${_esc(s.code)}</span><span class="tp-seq-l">${_esc(s.label)}</span>${q.checked ? `<span class="tp-seq-r">${st === 'good' ? '✓' : '✗'}</span>` : `<button type="button" class="tp-x" aria-label="Retirer" onclick="App.Tp.unplace(${k})">✕</button>`}</li>`; }).join('');
    const rest = q.pool.filter(id => !q.seq.includes(id));
    const poolH = rest.map(id => { const s = _step(id);
      return `<button type="button" class="tp-opt" onclick="App.Tp.place('${id}')"><span class="tp-code">${_esc(s.code)}</span><span>${_esc(s.label)}</span></button>`; }).join('');
    let fb = '';
    if (q.checked) {
      const good = q.seq.filter((id, k) => id === t.steps[k].id).length;
      fb = `<div class="tp-fb ${good === t.steps.length ? 'ok' : 'bad'}"><b>${good}/${t.steps.length} étapes bien placées</b><p>Voici le bon ordre :</p><ol class="tp-ol">${t.steps.map(s => `<li><b>${_esc(s.label)}</b><div class="tp-muted tp-small">${_esc(s.how)}</div></li>`).join('')}</ol></div>`;
    }
    return `<p class="tp-q">Tape les étapes dans l'ordre où tu les réalises.</p>
      <div class="tp-card2"><div class="tp-muted tp-small">${q.checked ? 'Ton classement' : `Ton classement (${q.seq.length}/${t.steps.length})`}</div><ol class="tp-seqs">${placed || '<li class="tp-muted tp-small">Rien encore : choisis la première étape ci-dessous.</li>'}</ol></div>
      ${q.checked ? fb : `<div class="tp-card2"><div class="tp-muted tp-small">Étapes à placer</div><div class="tp-opts">${poolH || '<span class="tp-muted tp-small">Toutes les étapes sont placées.</span>'}</div></div>`}
      <div class="tp-row">${q.checked ? '<button type="button" class="btn btn-primary" onclick="App.Tp.next()">Voir mon résultat →</button>' : `<button type="button" class="btn btn-primary" ${q.seq.length === t.steps.length ? '' : 'disabled'} onclick="App.Tp.orderCheck()">Valider mon ordre</button><button type="button" class="btn btn-ghost" onclick="App.Tp.orderReset()">Tout effacer</button>`}</div>`;
  }
  function place(id) { if (!q || q.kind !== 'order' || q.checked || q.seq.includes(id)) return; q.seq.push(id); render(false); }
  function unplace(k) { if (!q || q.kind !== 'order' || q.checked) return; q.seq.splice(k, 1); render(false); }
  function orderReset() { if (!q || q.kind !== 'order' || q.checked) return; q.seq = []; render(false); }
  function orderCheck() {
    if (!q || q.kind !== 'order' || q.checked) return;
    const t = _tp(); if (q.seq.length !== t.steps.length) return;
    q.checked = true;
    q.score = q.seq.filter((id, k) => id === t.steps[k].id).length;
    q.seq.forEach((id, k) => { if (id !== t.steps[k].id) _addMiss('order', id, 'Ordre : « ' + _step(id).label + ' » n\'est pas à la place ' + (k + 1) + '.'); });
    render(false);
  }
  function quitQuiz() {
    if (q && !q.checked && (q.i > 0 || q.seq.length) && !confirm('Quitter cet exercice ? Ta progression dans cet exercice sera perdue.')) return;
    toHome();
  }
  function _finish() {
    const pct = _pct(q.score, q.total), key = tpId + '|' + q.kind;
    if (P.best[key] == null || pct > P.best[key]) P.best[key] = pct;
    _save();
    _resLast = { kind: q.kind, score: q.score, total: q.total, pct, secs: Math.round((Date.now() - q.t0) / 1000) };
    q = null; screen = 'result'; render();
  }
  function _resultHtml() {
    const r = _resLast, t = _tp();
    const msg = r.pct >= 85 ? "Très bien : tu maîtrises ce point. Refais-le de temps en temps pour garder le geste." : r.pct >= 60 ? "Correct, mais quelques points sont à consolider : relis la fiche et les explications des erreurs." : "À retravailler : relis la fiche, puis refais l'exercice. C'est normal au début.";
    return `${_bar('App.Tp.toHome()', t.title)}<h2 class="tp-title">Résultat · ${_esc(KINDS[r.kind])}</h2>
      <div class="tp-card2 tp-res"><div class="tp-score ${_cls(r.pct)}">${r.score}<small>/${r.total}</small></div><div class="tp-res-pct ${_cls(r.pct)}">${r.pct} %</div><p>${_esc(msg)}</p><p class="tp-muted tp-small">Meilleur score : ${P.best[tpId + '|' + r.kind]} %</p></div>
      <div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.startQuiz('${r.kind}')">🔁 Recommencer</button><button type="button" class="btn btn-ghost" onclick="App.Tp.fiche()">📖 Relire la fiche</button><button type="button" class="btn btn-ghost" onclick="App.Tp.toHome()">Retour</button></div>${_disc()}`;
  }

  // ══ Pratique guidée avec minuteur ══════════════════════════════════════════════
  function _stopTimer() { if (_timer) { clearInterval(_timer); _timer = null; } }
  function startGuide() {
    const t = _tp(); if (!t) return;
    G = { phase: t.grid ? 'prep' : 'run', ticks: {}, i: 0, t: 0, fric: 0, paused: false, t0: 0 };
    screen = 'guide'; render();
    if (G.phase === 'run') _enterGuideStep();
  }
  function guideTick(id) { if (!G || G.phase !== 'prep') return; G.ticks[id] = !G.ticks[id]; render(false); }
  function guideGo() {
    const t = _tp(); if (!G || G.phase !== 'prep') return;
    if (!D().prereqs.every(p => G.ticks[p.id])) return;
    G.phase = 'run'; G.i = 0; render(); _enterGuideStep();
  }
  function _gs() { return _tp().steps[G.i]; }
  function _enterGuideStep() {
    _stopTimer(); if (!G) return;
    G.t = 0; G.paused = false; G.stepStart = Date.now(); G.last = Date.now();
    const s = _gs();
    if (s.secs > 0 || s.end) _timer = setInterval(_tick, 200);
  }
  function _tick() {
    const root = _el('tp-root');
    if (!G || G.phase !== 'run' || !root || root.style.display === 'none') return _stopTimer();
    const now = Date.now(), dt = Math.min(1, (now - G.last) / 1000); G.last = now;
    if (G.paused || document.hidden) return;
    const s = _gs();
    G.t += dt; G.fric += dt;
    const left = s.secs ? Math.max(0, s.secs - G.t) : 0;
    const a = _el('tp-g-sec'); if (a) a.textContent = s.secs ? String(Math.ceil(left)) : String(Math.floor(G.fric));
    const b = _el('tp-g-bar'); if (b) b.style.width = (s.secs ? Math.min(100, G.t / s.secs * 100) : Math.min(100, G.fric / 30 * 100)) + '%';
    const c = _el('tp-g-tot'); if (c) c.textContent = Math.floor(G.fric) + ' s';
    if (s.secs && G.t >= s.secs) guideNext();
  }
  function guideNext() {
    if (!G || G.phase !== 'run') return;
    const t = _tp(), s = _gs();
    if (s.end || G.i + 1 >= t.steps.length) return guideEnd();
    G.i++; render(false); _enterGuideStep();
  }
  function guidePrev() { if (!G || G.phase !== 'run' || G.i === 0) return; G.i--; render(false); _enterGuideStep(); }
  function guidePause() {
    if (!G || G.phase !== 'run') return;
    G.paused = !G.paused; G.last = Date.now();
    const b = _el('tp-g-pause'); if (b) b.textContent = G.paused ? '▶ Reprendre' : '⏸ Pause';
  }
  function guideEnd() {
    _stopTimer(); if (!G) return;
    G.phase = 'end'; render();
  }
  function guideAgain() { startGuide(); }
  function _guideHtml() {
    const t = _tp();
    if (G.phase === 'prep') {
      const pre = D().prereqs, all = pre.every(p => G.ticks[p.id]);
      return `${_bar('App.Tp.toHome()', 'Pratique guidée')}<h2 class="tp-title">⏱️ Pratique guidée</h2>
        <p class="tp-lead">Pose ton téléphone devant toi et fais les gestes en même temps (avec du vrai produit hydro-alcoolique si tu en as). D'abord, vérifie les prérequis : coche chacun quand c'est fait.</p>
        <div class="tp-card2">${pre.map(p => `<label class="tp-check"><input type="checkbox" ${G.ticks[p.id] ? 'checked' : ''} onchange="App.Tp.guideTick('${p.id}')"><span>${p.ico} <b>${_esc(p.label)}</b> <span class="tp-muted">(${_esc(p.detail)})</span></span></label>`).join('')}</div>
        <div class="tp-row"><button type="button" class="btn btn-primary" ${all ? '' : 'disabled'} onclick="App.Tp.guideGo()">Je suis prêt·e : commencer →</button></div>
        ${all ? '' : '<p class="tp-muted tp-small">Coche les 3 prérequis pour commencer.</p>'}${_disc()}`;
    }
    if (G.phase === 'end') {
      const f = Math.round(G.fric);
      let msg;
      if (!t.grid) msg = 'Frottement de ' + f + ' s. Pense à bien rincer, sécher par tamponnement et fermer le robinet avec l\'essuie-mains.';
      else if (f < 20) msg = "Ta friction a duré " + f + " s : c'est un peu court. Vise 20 à 30 secondes et continue jusqu'au séchage complet.";
      else if (f <= 30) msg = "Ta friction a duré " + f + " s : dans la fourchette attendue (20 à 30 s). L'important est qu'elle dure jusqu'au séchage complet.";
      else msg = "Ta friction a duré " + f + " s : c'est un peu long, ce n'est pas grave si c'est jusqu'au séchage complet. Avec l'habitude tu seras plus fluide.";
      return `${_bar('App.Tp.toHome()', 'Pratique guidée')}<h2 class="tp-title">Bravo, c'est terminé 👏</h2>
        <div class="tp-card2 tp-res"><div class="tp-score ok">${f}<small> s</small></div><p>${_esc(msg)}</p><p class="tp-muted tp-small">Le minuteur n'est qu'un repère : ton évaluateur regarde la technique, pas ton téléphone.</p></div>
        <div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.guideAgain()">🔁 Recommencer</button>${t.grid ? '<button type="button" class="btn btn-ghost" onclick="App.Tp.evalStart()">✅ M\'auto-évaluer</button>' : ''}<button type="button" class="btn btn-ghost" onclick="App.Tp.toHome()">Retour</button></div>${_disc()}`;
    }
    const s = _gs(), n = t.steps.length;
    const timed = s.secs > 0, end = !!s.end;
    const visual = s.art ? `<div class="tp-g-art">${_art(s.art)}</div>` : `<div class="tp-g-bigico">${s.ico || ''}</div>`;
    const count = timed ? `<div class="tp-g-count"><b id="tp-g-sec">${s.secs}</b><small>s</small></div><div class="tp-prog tp-prog-big"><i id="tp-g-bar" style="width:0%"></i></div>`
      : end ? `<div class="tp-g-count"><b id="tp-g-sec">${Math.floor(G.fric)}</b><small>s au total · vise 20 à 30</small></div><div class="tp-prog tp-prog-big"><i id="tp-g-bar" style="width:${Math.min(100, G.fric / 30 * 100)}%"></i></div>` : '';
    const main = `<div class="tp-step-h"><span class="tp-code">${_esc(s.code)}</span><b>${_esc(s.label)}</b></div><p class="tp-g-how">${_esc(s.how)}</p>${count}`;
    const nextBtn = end ? '<button type="button" class="btn btn-primary" onclick="App.Tp.guideEnd()">✔ Mes mains sont sèches : terminer</button>'
      : timed ? '<button type="button" class="btn btn-ghost" onclick="App.Tp.guideNext()">Passer →</button>'
      : `<button type="button" class="btn btn-primary" onclick="App.Tp.guideNext()">${G.i === 0 && t.grid ? 'Produit dans la main : commencer la friction →' : 'Étape suivante →'}</button>`;
    return `${_bar('App.Tp.toHome()', 'Pratique guidée')}
      <div class="tp-g-top"><span class="tp-muted tp-small">Étape ${G.i + 1} sur ${n}</span><span class="tp-muted tp-small">Friction : <b id="tp-g-tot">${Math.floor(G.fric)} s</b></span></div>
      <div class="tp-prog"><i style="width:${Math.round(G.i / n * 100)}%"></i></div>
      <div class="tp-card2 tp-g-card">${visual}${main}
        <div class="tp-row">${G.i > 0 && !end ? '<button type="button" class="btn btn-ghost btn-sm" onclick="App.Tp.guidePrev()">← Précédente</button>' : ''}${(timed || end) ? `<button type="button" class="btn btn-ghost btn-sm" id="tp-g-pause" onclick="App.Tp.guidePause()">⏸ Pause</button>` : ''}${nextBtn}</div></div>${_disc()}`;
  }

  // ══ Auto-évaluation avec la grille officielle ═══════════════════════════════════
  function evalStart() {
    const t = _tp(); if (!t || !t.grid) return;
    E = { tp: t.id, sel: { t1: true, t2: true }, who: 'me', name: '', ans: {}, situ: null };
    screen = 'evalstart'; render();
  }
  function evalSet(k, v) {
    if (!E) return;
    if (k === 'who') E.who = v; else if (k === 't1' || k === 't2') E.sel[k] = !E.sel[k];
    render(false);
  }
  function evalName(v) { if (E) E.name = String(v || '').slice(0, 40); }
  function _evalStartHtml() {
    const t = _tp();
    return `${_bar('App.Tp.toHome()', 'Auto-évaluation')}<h2 class="tp-title">✅ Auto-évaluation</h2>
      <p class="tp-lead">Reprends les critères de ta grille officielle : tu coches Oui ou Non pour chacun, et l'application calcule le score. Tu peux t'évaluer toi-même (en te filmant ou en te souvenant) ou évaluer un camarade en TP à deux.</p>
      <div class="tp-card2"><h4 class="tp-h4">Quoi évaluer ?</h4>
        ${t.grid.temps.map(tm => `<label class="tp-check"><input type="checkbox" ${E.sel[tm.id] ? 'checked' : ''} onchange="App.Tp.evalSet('${tm.id}')"><span><b>${_esc(tm.title)}</b> <span class="tp-muted">(/${tm.max})</span></span></label>`).join('')}
        <h4 class="tp-h4">Qui est évalué ?</h4>
        <div class="tp-togs"><button type="button" class="tp-tog ${E.who === 'me' ? 'on' : ''}" aria-pressed="${E.who === 'me'}" onclick="App.Tp.evalSet('who','me')"><span>🙋</span><span>Moi</span></button>
        <button type="button" class="tp-tog ${E.who === 'pair' ? 'on' : ''}" aria-pressed="${E.who === 'pair'}" onclick="App.Tp.evalSet('who','pair')"><span>👥</span><span>Un camarade</span></button></div>
        ${E.who === 'pair' ? `<label class="tp-lbl" for="tp-name">Prénom (facultatif)</label><input id="tp-name" class="tp-input" maxlength="40" autocomplete="off" value="${_esc(E.name)}" oninput="App.Tp.evalName(this.value)">` : ''}
      </div>
      <div class="tp-row"><button type="button" class="btn btn-primary" ${(E.sel.t1 || E.sel.t2) ? '' : 'disabled'} onclick="App.Tp.evalBegin()">Commencer →</button></div>
      <p class="tp-muted tp-small">⚠ Ce n'est pas une évaluation officielle : seul ton évaluateur attribue la note.</p>${_histHtml(t.id, 5)}${_disc()}`;
  }
  function evalBegin() {
    const t = _tp(); if (!E || !(E.sel.t1 || E.sel.t2)) return;
    const pick = _shuffle(t.contexts)[0]; E.situ = pick ? pick.situ : null;
    screen = 'eval'; render();
  }
  function evalAns(id, v) { if (!E) return; E.ans[id] = v; render(false); const e = _el('tp-i-' + id); if (e && e.scrollIntoView) { /* garde la position */ } }
  function _evalTemps() { return _tp().grid.temps.filter(tm => E.sel[tm.id]); }
  function _evalHtml() {
    const temps = _evalTemps();
    const tot = temps.reduce((a, tm) => a + tm.max, 0);
    const itemsOf = tm => tm.blocks.reduce((a, b) => a.concat(b.items), []);
    const done = temps.reduce((a, tm) => a + itemsOf(tm).filter(i => E.ans[i.id] != null).length, 0);
    const oui = temps.reduce((a, tm) => a + itemsOf(tm).filter(i => E.ans[i.id] === 1).length, 0);
    const body = temps.map(tm => `<h3 class="tp-h">${_esc(tm.title)} <span class="tp-muted">/${tm.max}</span></h3>
      ${tm.id === 't2' && E.situ ? `<div class="tp-note"><b>Situation à annoncer à voix haute (exemple) :</b> ${_esc(E.situ)}<br><span class="tp-small">En vrai, l'évaluateur te donne une situation de soins : tu dis pourquoi, quelle méthode et quand.</span></div>` : ''}
      ${tm.blocks.map(b => `<div class="tp-card2"><h4 class="tp-h4">${_esc(b.title)}</h4>${b.items.map(i => { const v = E.ans[i.id];
        return `<div class="tp-crit" id="tp-i-${i.id}"><div class="tp-crit-l">${_esc(i.label)}</div><div class="tp-yn" role="group" aria-label="${_esc(i.label)}">
          <button type="button" class="tp-yes ${v === 1 ? 'on' : ''}" aria-pressed="${v === 1}" onclick="App.Tp.evalAns('${i.id}',1)">Oui</button>
          <button type="button" class="tp-no ${v === 0 ? 'on' : ''}" aria-pressed="${v === 0}" onclick="App.Tp.evalAns('${i.id}',0)">Non</button></div></div>`; }).join('')}</div>`).join('')}`).join('');
    return `${_bar('App.Tp.evalQuit()', 'Auto-évaluation')}
      <div class="tp-sticky"><span><b>${oui}</b>/${tot} Oui</span><span class="tp-muted">${done}/${tot} critères répondus</span></div>
      <p class="tp-muted tp-small">Évalué : ${E.who === 'pair' ? '👥 ' + _esc(E.name || 'camarade') : '🙋 moi'} · 1 point par « Oui »</p>
      ${body}
      <div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.evalCalc()">Calculer le score →</button></div>
      ${done < tot ? `<p class="tp-muted tp-small">Les critères sans réponse seront comptés « Non ».</p>` : ''}`;
  }
  function evalQuit() {
    if (E && Object.keys(E.ans).length && !confirm('Quitter ? Tes réponses ne seront pas enregistrées.')) return;
    toHome();
  }
  function evalCalc() {
    const t = _tp(); if (!E) return;
    const temps = _evalTemps(), scores = {}, miss = []; let total = 0, max = 0, blank = 0;
    temps.forEach(tm => {
      let s = 0;
      tm.blocks.forEach(b => b.items.forEach(i => { const v = E.ans[i.id]; if (v === 1) s++; else { miss.push(i.id); if (v == null) blank++; } }));
      scores[tm.id] = s; total += s; max += tm.max;
    });
    P.evals.unshift({ ts: Date.now(), tp: t.id, who: E.who, name: E.who === 'pair' ? E.name : '', scores, total, max, miss: miss.slice(0, 40) });
    P.evals = P.evals.slice(0, MAX_EVALS); _save();
    E.res = { scores, total, max, miss, blank };
    screen = 'evalres'; render();
  }
  function _evalResHtml() {
    const t = _tp(), R = E.res, temps = _evalTemps();
    const pct = _pct(R.total, R.max);
    const itemMap = {}; t.grid.temps.forEach(tm => tm.blocks.forEach(b => b.items.forEach(i => { itemMap[i.id] = i; })));
    const missH = R.miss.length ? R.miss.map(id => { const i = itemMap[id]; const st = i.link && t.steps.find(s => s.id === i.link), pre = i.link && D().prereqs.find(p => p.id === i.link);
      return `<div class="tp-miss"><div class="tp-miss-h">✗ ${_esc(i.label)}</div><div class="tp-muted tp-small">${_esc(i.tip)}</div>${st && st.art ? `<details class="tp-det"><summary>Revoir le geste</summary><div class="tp-miss-art">${_art(st.art)}<p>${_esc(st.how)}</p></div></details>` : ''}${pre ? `<details class="tp-det"><summary>Pourquoi ?</summary><p>${_esc(pre.why)}</p></details>` : ''}</div>`; }).join('')
      : '<p>🎉 Tous les critères sont validés. Garde le même soin le jour de l\'évaluation.</p>';
    const msg = pct >= 85 ? 'Très solide. Continue de t\'entraîner pour garder le rythme.' : pct >= 60 ? 'Bien, mais il reste des critères à sécuriser (voir plus bas).' : 'Encore du travail : refais la fiche et la pratique guidée, puis réévalue-toi.';
    return `${_bar('App.Tp.toHome()', 'Résultat')}<h2 class="tp-title">Ton score</h2>
      <div class="tp-card2 tp-res"><div class="tp-score ${_cls(pct)}">${R.total}<small>/${R.max}</small></div>
        ${temps.map(tm => `<div class="tp-sub">${_esc(tm.title.split(' · ')[0])} : <b>${R.scores[tm.id]}/${tm.max}</b></div>`).join('')}
        <p>${_esc(msg)}</p>${R.blank ? `<p class="tp-muted tp-small">${R.blank} critère${R.blank > 1 ? 's' : ''} sans réponse compté${R.blank > 1 ? 's' : ''} « Non ».</p>` : ''}
        <p class="tp-muted tp-small">⚠ Auto-évaluation : ce n'est pas une note officielle.</p></div>
      <h3 class="tp-h">À retravailler (${R.miss.length})</h3><div class="tp-card2">${missH}</div>
      <div class="tp-row"><button type="button" class="btn btn-primary" onclick="App.Tp.evalStart()">🔁 Nouvelle auto-évaluation</button><button type="button" class="btn btn-ghost" onclick="App.Tp.startGuide()">⏱️ Pratique guidée</button><button type="button" class="btn btn-ghost" onclick="App.Tp.toHome()">Retour</button></div>${_disc()}`;
  }

  // Les cartes d'un TP peuvent être ajoutées sans toucher au moteur : App.TpData.tps.push({...})
  function _state() { return { screen, tpId, q, G, E, P }; }

  return {
    open, close, toMenu, pick, toHome, isTraining, fiche, startQuiz, togPre, check, answer, next, place, unplace, orderReset, orderCheck, quitQuiz,
    startGuide, guideTick, guideGo, guideNext, guidePrev, guidePause, guideEnd, guideAgain,
    evalStart, evalSet, evalName, evalBegin, evalAns, evalQuit, evalCalc, clearMiss,
    _t: { state: _state, tick: _tick, KEY }
  };
})();
