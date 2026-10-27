// core/patho.js — « Pathologies aux urgences » (App.Patho)
// Tu accueilles un patient aux urgences. Tu as 5 minutes (temps SIMULÉ) pour poser des questions et faire des examens de base.
// Rien n'est corrigé pendant l'observation : c'est seulement à la fin que tu choisis la pathologie et la prise en charge,
// puis tu reçois une note, ce que tu as trouvé / raté, et le raisonnement.
// Progression gardée sur cet appareil seulement (localStorage, clé ifsi_patho_v1). Temps compté par App.Activity (kind « patho »).
// ⚠ Outil d'ENTRAÎNEMENT au raisonnement : patients fictifs. En stage, l'étudiant n'établit pas le diagnostic et ne prescrit pas :
//   il observe, mesure, alerte et transmet. Les prescriptions viennent du médecin ; les protocoles du service prévalent.
'use strict';
window.App = window.App || {};

App.Patho = (() => {
  const KEY = 'ifsi_patho_v1';
  const D = () => App.PathoData;
  const DISC = "Cas fictifs et simplifiés, à but pédagogique. En stage, tu n'établis pas le diagnostic et tu ne prescris pas : tu observes, tu mesures, tu alertes et tu transmets. Les traitements sont décidés par le médecin, selon les protocoles du service. À confirmer avec ton cours et ton formateur.";

  let P = { v: 1, best: {}, n: 0, last: '' };
  let screen = 'menu';                     // menu | run | answer | result
  let run = null, _res = null;

  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _top = () => { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} };
  const _shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const _cls = s => s >= 80 ? 'ok' : s >= 55 ? 'mid' : 'low';
  const fr1 = x => String(x).replace('.', ',');
  const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) P = { v: 1, best: r.best && typeof r.best === 'object' ? r.best : {}, n: +r.n > 0 ? Math.round(r.n) : 0, last: typeof r.last === 'string' ? r.last : '' };
    } catch (e) {}
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  // ══ Navigation ═══════════════════════════════════════════════════════════
  function open() {
    _load();
    const root = _el('patho-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root', 'pharma-root', 'gazo-root', 'dose-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null; _res = null;
    render(); _top();
  }
  function close() {
    const root = _el('patho-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; _res = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; _res = null; render(); _top(); }
  function isTraining() { return (screen === 'run' || screen === 'answer') && !!run; }

  // ══ Données d'un cas ═════════════════════════════════════════════════════
  const vals = c => Object.assign({}, D().NORMAL, c.v || {});
  const qById = id => D().QUESTIONS.find(q => q.id === id);
  const xById = id => D().EXAMS.find(x => x.id === id);

  // Résultat d'un examen pour ce patient : { t, abn }
  function examResult(c, id) {
    const x = xById(id), v = vals(c);
    if (c.x && c.x[id]) return c.x[id];
    if (!x) return { t: '', abn: false };
    if (x.vital === 'temp') return { t: `Température : ${fr1(v.temp.toFixed(1))} °C`, abn: v.temp >= 38 || v.temp < 35.5 };
    if (x.vital === 'pa') return { t: `Pouls : ${v.fc}/min, ${v.rhythm}. Tension artérielle : ${v.pa[0]}/${v.pa[1]} mmHg`, abn: v.fc > 100 || v.fc < 50 || v.rhythm !== 'régulier' || v.pa[0] >= 160 || v.pa[0] < 100 };
    if (x.vital === 'resp') return { t: `Fréquence respiratoire : ${v.fr}/min. Saturation : ${v.spo2} % (air ambiant)`, abn: v.fr >= 24 || v.fr < 10 || v.spo2 < 94 };
    if (x.vital === 'glyc') return { t: `Glycémie capillaire : ${fr1(v.glyc.toFixed(2))} g/L`, abn: v.glyc < 0.7 || v.glyc > 1.8 };
    return { t: x.def || '', abn: false };
  }
  const answerOf = (c, id) => (c.q && c.q[id]) || (qById(id) || {}).def || '';

  // ══ Démarrer un cas ══════════════════════════════════════════════════════
  function start(caseId) {
    _load();
    const all = D().CASES;
    let c = caseId && all.find(x => x.id === caseId);
    if (!c) {
      const pool = all.filter(x => x.id !== P.last);
      const fresh = pool.filter(x => P.best[x.id] == null);
      const src = fresh.length ? fresh : pool;
      c = src[Math.floor(Math.random() * src.length)];
    }
    P.last = c.id; _save();
    run = {
      c, t: D().BUDGET, over: false, done: {}, log: [], tab: 'q', quit: false,
      dx: null, sel: {}, options: null, tt: null
    };
    screen = 'run';
    render(); _top();
  }

  // ══ Actions pendant l'observation ════════════════════════════════════════
  function _spend(cost) {
    run.t = Math.max(0, run.t - cost);
    if (run.t <= 0) run.over = true;
  }
  function ask(id) {
    if (!run || screen !== 'run' || run.over || run.done[id]) return;
    const q = qById(id); if (!q) return;
    run.done[id] = true;
    const at = D().BUDGET - run.t;
    run.log.push({ at, kind: 'q', id, label: q.label, text: answerOf(run.c, id), abn: false });
    _spend(q.cost);
    render(false);
  }
  function exam(id) {
    if (!run || screen !== 'run' || run.over || run.done[id]) return;
    const x = xById(id); if (!x) return;
    run.done[id] = true;
    const at = D().BUDGET - run.t, r = examResult(run.c, id);
    run.log.push({ at, kind: 'x', id, label: x.label, ico: x.ico, text: r.t, abn: !!r.abn, ecg: id === 'e_ecg' });
    _spend(x.cost);
    render(false);
  }
  function tab(t) { if (!run) return; run.tab = t; render(false); }
  function askQuit(v) { if (!run) return; run.quit = !!v; render(false); }

  function finishObs() {
    if (!run || screen !== 'run') return;
    const c = run.c, pool = D().CASES.filter(x => x.id !== c.id).map(x => x.dx).concat(D().EXTRA_DX).filter(d => d !== c.dx);
    run.options = _shuffle([c.dx].concat(_shuffle(pool).slice(0, 5)));
    run.tt = _shuffle(c.tt.map((t, i) => i));
    screen = 'answer';
    render(); _top();
  }
  function pickDx(i) {
    if (!run || screen !== 'answer') return;
    run.dx = i;
    document.querySelectorAll('.pt-dx').forEach(b => {
      const on = +b.dataset.i === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    _syncValidate();
  }
  function togTt(i) {
    if (!run || screen !== 'answer') return;
    run.sel[i] = !run.sel[i];
    const b = document.querySelector(`.pt-tt[data-i="${i}"]`);
    if (b) { b.classList.toggle('on', !!run.sel[i]); b.setAttribute('aria-pressed', run.sel[i] ? 'true' : 'false'); const bx = b.querySelector('.pt-box'); if (bx) bx.textContent = run.sel[i] ? '☑' : '☐'; }
    const n = Object.keys(run.sel).filter(k => run.sel[k]).length, e = _el('pt-nsel'); if (e) e.textContent = n + ' choisi' + (n > 1 ? 's' : '');
  }
  function _syncValidate() {
    const b = _el('pt-validate'); if (b) b.disabled = run.dx == null;
    const h = _el('pt-vhint'); if (h) h.style.display = run.dx == null ? 'block' : 'none';
  }

  // ══ Correction ═══════════════════════════════════════════════════════════
  function validate() {
    if (!run || screen !== 'answer' || run.dx == null) return;
    const c = run.c;
    const dxOk = run.options[run.dx] === c.dx;
    const okTot = c.tt.filter(t => t.ok).length;
    let okSel = 0, badSel = 0;
    c.tt.forEach((t, i) => { if (run.sel[i]) { if (t.ok) okSel++; else badSel++; } });
    const ttRaw = okTot ? Math.max(0, (okSel - badSel) / okTot) : 0;
    const keys = c.key || [];
    const found = keys.filter(k => run.done[k]), missed = keys.filter(k => !run.done[k]);
    const sDx = dxOk ? 40 : 0, sTt = Math.round(ttRaw * 40), sKey = keys.length ? Math.round(found.length / keys.length * 20) : 20;
    const total = sDx + sTt + sKey;
    const used = D().BUDGET - run.t;
    _res = { c, dxOk, chosen: run.options[run.dx], okSel, badSel, okTot, sDx, sTt, sKey, total, found, missed, used, sel: Object.assign({}, run.sel), done: Object.assign({}, run.done), log: run.log.slice(), dangerous: c.tt.filter((t, i) => run.sel[i] && !t.ok) };
    const prev = P.best[c.id];
    _res.newBest = prev == null || total > prev;
    if (_res.newBest) P.best[c.id] = total;
    P.n++; _save();
    screen = 'result';
    render(); _top();
  }
  function showLog() { if (_res) { _res.showLog = !_res.showLog; render(false); } }

  // ══ ECG dessiné (bande de rythme simplifiée) ═════════════════════════════
  function ecgSvg(c) {
    const v = vals(c), W = 600, H = 90, base = 55, pxs = 100;       // 100 px = 1 s
    const irr = v.rhythm !== 'régulier', st = (c.x && c.x.e_ecg && c.x.e_ecg.t.indexOf('sus-décalage') >= 0) ? 14 : 0;
    const rr0 = 60 / Math.max(35, Math.min(180, v.fc));
    let x = 20, d = `M0 ${base}`, seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    while (x < W + 10) {
      const rr = irr ? rr0 * (0.6 + rnd() * 0.8) : rr0, w = rr * pxs;
      const line = (px, y) => { d += ` L${(x + px).toFixed(1)} ${y.toFixed(1)}`; };
      const sc = Math.min(1, w / 80);                             // compresse quand ça va vite
      if (!irr) { line(0, base); line(6 * sc, base - 5); line(12 * sc, base); }
      else { for (let k = 0; k < 5; k++) line(k * 3 * sc, base + (rnd() - 0.5) * 3); }
      const q = 16 * sc;
      line(q, base); line(q + 2 * sc, base + 5); line(q + 5 * sc, base - 34); line(q + 8 * sc, base + 9); line(q + 10 * sc, base - st);
      line(q + 22 * sc, base - st); line(q + 30 * sc, base - st - (st ? 6 : 8)); line(q + 38 * sc, base - st);
      line(Math.max(q + 42 * sc, w * 0.98), base);
      x += w;
    }
    return `<svg class="pt-ecg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tracé ECG simplifié (illustration)"><defs><pattern id="pt-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" class="pt-grid-l"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#pt-grid)"/><path d="${d}" fill="none" class="pt-ecg-l" stroke-width="2" stroke-linejoin="round"/></svg><div class="pt-ecg-cap">Tracé schématique (illustration pédagogique, pas un vrai enregistrement)</div>`;
  }

  // ══ Affichage ════════════════════════════════════════════════════════════
  function render(top) {
    const root = _el('patho-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml(); else if (screen === 'run') h = _runHtml(); else if (screen === 'answer') h = _answerHtml(); else if (screen === 'result') h = _resultHtml();
    // garder le défilement lors d'un simple rafraîchissement de la phase d'observation
    const keepY = (top === false) ? (window.pageYOffset || 0) : null;
    root.innerHTML = `<div class="pt-wrap">${h}</div>`;
    if (keepY != null) { try { window.scrollTo({ top: keepY }); } catch (e) {} }
  }
  const _disc = () => `<p class="pt-disc">${_esc(DISC)}</p>`;
  const _back = (lbl, fn) => `<button type="button" class="btn btn-ghost pt-back" onclick="${fn}">← ${lbl}</button>`;

  function _menuHtml() {
    const cs = D().CASES, done = cs.filter(c => P.best[c.id] != null);
    const good = done.filter(c => P.best[c.id] >= 70).length;
    const hist = done.length ? `<h3 class="pt-h">Cas déjà vus</h3><div class="pt-hist">${done.map(c => {
      const b = P.best[c.id];
      return `<div class="pt-hrow"><span class="pt-hico">${_esc(c.pt.ico)}</span><span class="pt-ht"><b>${_esc(c.dx)}</b><small>${_esc(c.pt.nom)}, ${c.pt.age} ans</small></span><span class="pt-best ${_cls(b)}">${b}/100</span><button type="button" class="btn btn-ghost pt-redo" onclick="App.Patho.start('${c.id}')">Refaire</button></div>`;
    }).join('')}</div>` : '';
    return `<div class="pt-bar">${_back('Retour', 'App.Patho.close()')}<span class="pt-bar-t">🩺 Pathologies aux urgences</span></div>
      <h2 class="pt-title">Accueil des urgences</h2>
      <p class="pt-lead">Un patient arrive. Tu as <b>5 minutes</b> (temps simulé) pour poser des questions et faire des examens de base. Chaque action coûte du temps : il faut choisir ce qui compte. <b>Rien n'est corrigé avant la fin.</b></p>
      <div class="pt-card"><b>Ensuite, tu réponds :</b>
        <ol class="pt-ol"><li>Quelle pathologie suspectes-tu ?</li><li>Quelle prise en charge proposes-tu ? (tu coches ce qui est adapté, sans cocher les pièges)</li></ol>
        <p class="pt-small pt-muted">Note sur 100 : pathologie 40 + prise en charge 40 + indices importants trouvés 20. Chaque piège coché retire des points.</p></div>
      <button type="button" class="btn btn-primary pt-start" onclick="App.Patho.start()">🚑 Accueillir un patient</button>
      <p class="pt-small pt-muted pt-center">${cs.length} cas disponibles · ${done.length} vu${done.length > 1 ? 's' : ''} · ${good} réussi${good > 1 ? 's' : ''} (70/100 ou plus)</p>
      ${hist}${_disc()}`;
  }

  function _monitorHtml(measured) {
    const c = run.c, v = vals(c), tile = (lab, val, abn, on) =>
      `<div class="pt-vt ${on ? (abn ? 'abn' : 'ok') : 'off'}"><span class="pt-vl">${lab}</span><span class="pt-vv">${on ? val : '—'}</span></div>`;
    const m = measured, R = id => examResult(c, id);
    const rT = m.e_temp ? R('e_temp') : null, rP = m.e_pa ? R('e_pa') : null, rR = m.e_resp ? R('e_resp') : null, rG = m.e_glyc ? R('e_glyc') : null;
    const paAbn = (a, b) => a, ab = {
      temp: v.temp >= 38 || v.temp < 35.5, fc: v.fc > 100 || v.fc < 50 || v.rhythm !== 'régulier', pa: v.pa[0] >= 160 || v.pa[0] < 100,
      fr: v.fr >= 24 || v.fr < 10, spo2: v.spo2 < 94, glyc: v.glyc < 0.7 || v.glyc > 1.8
    };
    return `<div class="pt-mon" role="group" aria-label="Constantes mesurées">
      ${tile('Temp.', fr1(v.temp.toFixed(1)) + ' °C', ab.temp, !!rT)}
      ${tile('Pouls', v.fc + '/min' + (v.rhythm !== 'régulier' ? ' irrég.' : ''), ab.fc, !!rP)}
      ${tile('Tension', v.pa[0] + '/' + v.pa[1], ab.pa, !!rP)}
      ${tile('FR', v.fr + '/min', ab.fr, !!rR)}
      ${tile('SpO₂', v.spo2 + ' %', ab.spo2, !!rR)}
      ${tile('Glycémie', fr1(v.glyc.toFixed(2)) + ' g/L', ab.glyc, !!rG)}
    </div>`;
  }

  function _logHtml(log, newestFirst) {
    if (!log.length) return `<p class="pt-muted pt-small">Rien pour l'instant. Pose une question ou fais un examen.</p>`;
    const items = newestFirst ? log.slice().reverse() : log;
    return `<div class="pt-log">${items.map(e => `<div class="pt-ev ${e.kind === 'q' ? 'q' : 'x'} ${e.abn ? 'abn' : ''}">
      <div class="pt-ev-h"><span class="pt-ev-at">${mmss(e.at)}</span><span class="pt-ev-l">${e.kind === 'x' ? _esc(e.ico || '🩺') + ' ' : '💬 '}${_esc(e.label)}</span></div>
      <div class="pt-ev-t">${e.kind === 'q' ? '« ' + _esc(e.text) + ' »' : _esc(e.text)}</div>${e.ecg ? ecgSvg(run ? run.c : _res.c) : ''}</div>`).join('')}</div>`;
  }

  function _runHtml() {
    const c = run.c, B = D().BUDGET, left = run.t, pct = Math.max(0, Math.round(left / B * 100));
    const warn = left <= 60 && left > 0, tcls = run.over ? 'over' : warn ? 'warn' : '';
    const costBtn = (id, label, cost, ico, fn) => {
      const d = run.done[id], dis = d || run.over;
      return `<button type="button" class="pt-act ${d ? 'done' : ''}" ${dis ? 'disabled' : ''} onclick="App.Patho.${fn}('${id}')"><span class="pt-act-ico">${d ? '✓' : ico}</span><span class="pt-act-l">${_esc(label)}</span><span class="pt-act-c">${cost >= 60 ? Math.floor(cost / 60) + ' min' + (cost % 60 ? ' ' + (cost % 60) + ' s' : '') : cost + ' s'}</span></button>`;
    };
    const qs = D().QUESTIONS, groups = [];
    qs.forEach(q => { let g = groups.find(x => x.th === q.th); if (!g) { g = { th: q.th, it: [] }; groups.push(g); } g.it.push(q); });
    const qHtml = groups.map(g => `<h4 class="pt-gh">${_esc(g.th)}</h4><div class="pt-acts">${g.it.map(q => costBtn(q.id, q.label, q.cost, '💬', 'ask')).join('')}</div>`).join('');
    const xHtml = `<div class="pt-acts">${D().EXAMS.map(x => costBtn(x.id, x.label, x.cost, x.ico, 'exam')).join('')}</div>`;
    const nDone = Object.keys(run.done).length;
    const quit = run.quit
      ? `<div class="pt-quit">Quitter ce patient ? Ton observation sera perdue. <button type="button" class="btn btn-ghost" onclick="App.Patho.toMenu()">Oui, quitter</button> <button type="button" class="btn btn-ghost" onclick="App.Patho.askQuit(false)">Non, continuer</button></div>` : '';
    return `<div class="pt-bar"><button type="button" class="btn btn-ghost pt-back" onclick="App.Patho.askQuit(true)">← Quitter</button><span class="pt-bar-t">🩺 Urgences · accueil</span></div>${quit}
      <div class="pt-clock ${tcls}"><div class="pt-clock-h"><span class="pt-clock-t">⏱ ${run.over ? 'Temps écoulé' : mmss(left) + ' restantes'}</span><span class="pt-small pt-muted">${nDone} action${nDone > 1 ? 's' : ''} · ${mmss(B - left)} écoulées</span></div>
        <div class="pt-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${B}" aria-valuenow="${left}"><i style="width:${pct}%"></i></div></div>
      <div class="pt-pt"><span class="pt-pt-ico">${_esc(c.pt.ico)}</span><div class="pt-pt-t"><b>${_esc(c.pt.nom)}, ${c.pt.age} ans</b><p>${_esc(c.arrival)}</p></div></div>
      ${_monitorHtml(run.done)}
      ${run.over ? `<div class="pt-over">⏱ Les 5 minutes sont écoulées. Il est temps de dire ce que tu penses et ce que tu proposes.</div>` : ''}
      <button type="button" class="btn ${run.over ? 'btn-primary' : 'btn-secondary'} pt-finish" onclick="App.Patho.finishObs()">${run.over ? 'Donner ma réponse →' : 'J\'ai assez d\'éléments : donner ma réponse →'}</button>
      <div class="pt-tabs" role="tablist"><button type="button" role="tab" aria-selected="${run.tab === 'q'}" class="pt-tab ${run.tab === 'q' ? 'on' : ''}" onclick="App.Patho.tab('q')">💬 Questions</button><button type="button" role="tab" aria-selected="${run.tab === 'x'}" class="pt-tab ${run.tab === 'x' ? 'on' : ''}" onclick="App.Patho.tab('x')">🩺 Examens</button><button type="button" role="tab" aria-selected="${run.tab === 'l'}" class="pt-tab ${run.tab === 'l' ? 'on' : ''}" onclick="App.Patho.tab('l')">📋 Dossier${run.log.length ? ' (' + run.log.length + ')' : ''}</button></div>
      <div class="pt-panel">${run.tab === 'q' ? qHtml : run.tab === 'x' ? xHtml : _logHtml(run.log, true)}</div>
      <p class="pt-small pt-muted">Pas de correction pendant l'observation. Le coût de chaque action (temps simulé) est indiqué à droite.</p>`;
  }

  function _answerHtml() {
    const c = run.c;
    const dxs = run.options.map((o, i) => `<button type="button" class="pt-dx ${run.dx === i ? 'on' : ''}" data-i="${i}" aria-pressed="${run.dx === i}" onclick="App.Patho.pickDx(${i})"><span class="pt-radio"></span><span>${_esc(o)}</span></button>`).join('');
    const tts = run.tt.map(i => `<button type="button" class="pt-tt ${run.sel[i] ? 'on' : ''}" data-i="${i}" aria-pressed="${!!run.sel[i]}" onclick="App.Patho.togTt(${i})"><span class="pt-box">${run.sel[i] ? '☑' : '☐'}</span><span>${_esc(c.tt[i].t)}</span></button>`).join('');
    const n = Object.keys(run.sel).filter(k => run.sel[k]).length;
    return `<div class="pt-bar"><span class="pt-bar-t">🩺 Ta réponse · ${_esc(c.pt.nom)}, ${c.pt.age} ans</span></div>
      <p class="pt-lead">Tu as utilisé <b>${mmss(D().BUDGET - run.t)}</b> sur 5:00. Maintenant, dis ce que tu penses. <b>Tu seras corrigé après.</b></p>
      <details class="pt-det"><summary>📋 Revoir ce que j'ai trouvé (${run.log.length})</summary>${_monitorHtml(run.done)}${_logHtml(run.log, false)}</details>
      <h3 class="pt-h">1. Quelle pathologie suspectes-tu ?</h3>
      <div class="pt-dxs">${dxs}</div>
      <h3 class="pt-h">2. Quelle prise en charge proposes-tu ? <span class="pt-small pt-muted">(coche tout ce qui est adapté)</span></h3>
      <div class="pt-tts">${tts}</div>
      <p class="pt-small pt-muted"><span id="pt-nsel">${n} choisi${n > 1 ? 's' : ''}</span> · Un piège coché retire des points : ne coche que ce dont tu es sûr(e).</p>
      <p class="pt-small pt-warnline" id="pt-vhint" style="display:${run.dx == null ? 'block' : 'none'}">Choisis d'abord une pathologie.</p>
      <button type="button" class="btn btn-primary pt-start" id="pt-validate" ${run.dx == null ? 'disabled' : ''} onclick="App.Patho.validate()">Valider ma réponse</button>`;
  }

  function _labelOf(id) { const q = qById(id); if (q) return q.label; const x = xById(id); return x ? x.label : id; }
  function _txtOf(c, id) { return qById(id) ? '« ' + answerOf(c, id) + ' »' : examResult(c, id).t; }

  function _resultHtml() {
    const r = _res, c = r.c, cl = _cls(r.total);
    const verdict = r.total >= 80 ? 'Très bien, tu as bien raisonné.' : r.total >= 55 ? 'Bon début : repère ce qui t\'a manqué ci-dessous.' : 'À retravailler : relis le raisonnement, puis refais ce cas.';
    const bar = (lab, got, max) => `<div class="pt-sc"><span class="pt-sc-l">${lab}</span><span class="pt-sc-b"><i style="width:${Math.round(got / max * 100)}%"></i></span><span class="pt-sc-v">${got}/${max}</span></div>`;
    const keyRows = (c.key || []).map(k => {
      const f = r.done[k];
      return `<div class="pt-kr ${f ? 'ok' : 'no'}"><span class="pt-kr-i">${f ? '✓' : '✗'}</span><span class="pt-kr-t"><b>${_esc(_labelOf(k))}</b><small>${f ? 'Trouvé' : 'Raté'} — ${_esc(_txtOf(c, k))}</small></span></div>`;
    }).join('');
    const ttRows = c.tt.map((t, i) => {
      const s = !!r.sel[i];
      const st = t.ok ? (s ? ['good', '✓', 'Bien vu'] : ['miss', '○', 'Oublié']) : (s ? ['bad', '✗', 'Piège coché'] : ['neutral', '–', 'Bien évité']);
      return `<div class="pt-tr ${st[0]}"><span class="pt-tr-i">${st[1]}</span><span class="pt-tr-t"><b>${_esc(t.t)}</b><small><i>${st[2]}.</i> ${_esc(t.why)}</small></span></div>`;
    }).join('');
    return `<div class="pt-bar"><span class="pt-bar-t">🩺 Résultat · ${_esc(c.pt.nom)}, ${c.pt.age} ans</span></div>
      <div class="pt-score ${cl}"><div class="pt-ring" style="--p:${r.total}"><span>${r.total}</span><small>/100</small></div>
        <div class="pt-score-t"><b>${verdict}</b>${r.newBest && P.n > 1 ? '<span class="pt-pill">Nouveau meilleur score</span>' : ''}<small class="pt-muted">Observation : ${mmss(r.used)} sur 5:00</small></div></div>
      <div class="pt-scs">${bar('Pathologie', r.sDx, 40)}${bar('Prise en charge', r.sTt, 40)}${bar('Indices trouvés', r.sKey, 20)}</div>
      <div class="pt-card ${r.dxOk ? 'ok' : 'bad'}"><h3 class="pt-h4">${r.dxOk ? '✅ Bonne pathologie' : '❌ Pathologie : ce n\'était pas ' + _esc(r.chosen)}</h3>
        <p><b>C'était : ${_esc(c.dx)}.</b></p><p>${_esc(c.why)}</p><p class="pt-muted">${_esc(c.confuse || '')}</p></div>
      <h3 class="pt-h">Les indices importants</h3><div class="pt-krs">${keyRows}</div>
      <h3 class="pt-h">Ta prise en charge <span class="pt-small pt-muted">(${r.okSel}/${r.okTot} bons choix${r.badSel ? ', ' + r.badSel + ' piège' + (r.badSel > 1 ? 's' : '') : ''})</span></h3>
      ${r.dangerous.length ? `<div class="pt-alert">⚠ Tu as coché ${r.dangerous.length} geste${r.dangerous.length > 1 ? 's' : ''} qui aurai${r.dangerous.length > 1 ? 'ent' : 't'} pu nuire à ce patient. Regarde pourquoi ci-dessous.</div>` : ''}
      <div class="pt-trs">${ttRows}</div>
      <button type="button" class="btn btn-ghost pt-togl" onclick="App.Patho.showLog()">${r.showLog ? 'Masquer' : 'Voir'} tout ce que j'avais trouvé (${r.log.length})</button>
      ${r.showLog ? _logHtml(r.log, false) : ''}
      <div class="pt-row"><button type="button" class="btn btn-primary" onclick="App.Patho.start()">🚑 Autre patient</button><button type="button" class="btn btn-ghost" onclick="App.Patho.start('${c.id}')">Refaire ce cas</button><button type="button" class="btn btn-ghost" onclick="App.Patho.toMenu()">Menu</button></div>
      ${_disc()}`;
  }

  return { open, close, toMenu, start, ask, exam, tab, askQuit, finishObs, pickDx, togTt, validate, showLog, isTraining,
           _t: { state: () => ({ screen, run, res: _res, P }), score: () => _res } };
})();
