// core/gazo.js — Entraînement « Gaz du sang » (App.Gazo)
// Valeurs normales et sens de chaque paramètre · méthode d'interprétation (pH → PaCO₂ → HCO₃⁻ → compensation)
// avec des CAS GUIDÉS pas à pas. 100 % hors ligne, correction par règles (pas d'IA).
// Progression gardée sur cet appareil seulement (localStorage, clé ifsi_gazo_v1) : rien n'est envoyé,
// rien n'est synchronisé, aucune carte de révision n'est modifiée.
// Le temps passé à s'entraîner est compté par App.Activity (kind « gazo ») → « Temps » du jour.
// Le même composant sert d'ATELIER dans la simulation EHPAD : App.Gazo.workshop({ q, onDone, onBack }).
'use strict';
window.App = window.App || {};

App.Gazo = (() => {
  const KEY = 'ifsi_gazo_v1';
  const MAX_RUNS = 30;
  const N_SERIES = 10, N_MIX = 15, N_MISS = 15, N_CAS = 3;
  const MAX_CAS = { met: 2, mix: 3, miss: 3, cas: 3 };   // nombre maximum de cas guidés dans une série
  const MASTERED = 2;

  let P = { v: 1, q: {}, runs: [] };
  let screen = 'menu';                      // menu | fiche | quiz | bilan
  let ficheTh = null;
  let run = null;
  let WS = null;                            // atelier lancé depuis la simulation
  let _keysBound = false;

  const D = () => App.GazoData;
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

  // ══ Interprétation par règles (bornes du CM10) ═══════════════════════════════
  // Sert à vérifier les cas et à écrire les explications. Les « bonnes réponses » d'un cas sont celles de
  // ses données (ans) ; interpret() permet de contrôler qu'elles sont cohérentes avec les valeurs.
  function interpret(g) {
    const N = D().norms;
    const ph = g.ph < N.ph[0] ? 'acid' : g.ph > N.ph[1] ? 'alc' : 'norm';
    const paco2 = g.paco2 < N.paco2[0] ? 'down' : g.paco2 > N.paco2[1] ? 'up' : 'norm';
    const hco3 = g.hco3 < N.hco3[0] ? 'down' : g.hco3 > N.hco3[1] ? 'up' : 'norm';
    const o2 = g.pao2 < N.pao2[0] ? 'hypo' : g.pao2 > N.pao2[1] ? 'hyper' : 'norm';
    const resp = (ph === 'acid' && paco2 === 'up') || (ph === 'alc' && paco2 === 'down');
    const met = (ph === 'acid' && hco3 === 'down') || (ph === 'alc' && hco3 === 'up');
    let tr = null;
    if (resp && met) tr = 'mixte';
    else if (resp) tr = ph === 'acid' ? 'acres' : 'alres';
    else if (met) tr = ph === 'acid' ? 'acmet' : 'almet';
    let comp = 'none';
    if ((tr === 'acres' && hco3 === 'up') || (tr === 'alres' && hco3 === 'down')) comp = 'metab';
    else if ((tr === 'acmet' && paco2 === 'down') || (tr === 'almet' && paco2 === 'up')) comp = 'resp';
    return { ph, paco2, hco3, o2, tr, comp };
  }
  // Compare les réponses d'un cas avec interpret() (utilisé par les tests).
  function check(q) {
    const it = interpret(q.gaz), bad = [];
    ['ph', 'paco2', 'hco3', 'tr', 'comp', 'o2'].forEach(k => { if (it[k] !== q.ans[k]) bad.push(k + ' : ' + q.ans[k] + ' ≠ ' + it[k]); });
    return bad;
  }

  // ══ Étapes d'un cas ═══════════════════════════════════════════════════════════
  const TR_LABEL = { acres: 'Acidose respiratoire', acmet: 'Acidose métabolique', alres: 'Alcalose respiratoire', almet: 'Alcalose métabolique', mixte: 'Trouble mixte (respiratoire + métabolique)' };
  const STEPS = [
    { k: 'ph', n: 1, title: 'Le pH', ask: 'Que dit le pH ?',
      opts: [['acid', 'Acidose (pH < 7,35)'], ['norm', 'pH normal (7,35 – 7,45)'], ['alc', 'Alcalose (pH > 7,45)']] },
    { k: 'paco2', n: 2, title: 'La PaCO₂', ask: 'Que dit la PaCO₂ (normale : 36 – 44 mmHg) ?',
      opts: [['up', 'Élevée (hypercapnie, > 44)'], ['norm', 'Normale (36 – 44)'], ['down', 'Basse (hypocapnie, < 36)']] },
    { k: 'hco3', n: 3, title: 'Les HCO₃⁻', ask: 'Que disent les bicarbonates (normaux : 22 – 26 mmol/L) ?',
      opts: [['up', 'Élevés (> 26)'], ['norm', 'Normaux (22 – 26)'], ['down', 'Bas (< 22)']] },
    { k: 'tr', n: 4, title: 'Le trouble', ask: 'Quel est le trouble acido-basique ?',
      opts: [['acres', 'Acidose respiratoire'], ['acmet', 'Acidose métabolique'], ['alres', 'Alcalose respiratoire'], ['almet', 'Alcalose métabolique'], ['mixte', 'Trouble mixte (les deux systèmes vont dans le même sens)']] },
    { k: 'comp', n: 5, title: 'La compensation', ask: "Y a-t-il une compensation (l'autre système qui bouge à l'inverse du trouble) ?",
      opts: [['none', 'Pas de compensation visible'], ['metab', 'Compensation métabolique (rénale) : les HCO₃⁻ bougent à l\'inverse'], ['resp', 'Compensation respiratoire : la PaCO₂ bouge à l\'inverse']] },
    { k: 'o2', n: 6, title: 'La PaO₂ (à part)', ask: 'Que dit la PaO₂ (normale : 80 – 100 mmHg) ?',
      opts: [['hypo', 'Hypoxémie (< 80)'], ['norm', 'Normoxémie (80 – 100)'], ['hyper', 'Hyperoxémie (> 100)']] }
  ];
  const _step = k => STEPS.find(s => s.k === k);
  const _optLabel = (k, code) => { const o = _step(k).opts.find(x => x[0] === code); return o ? o[1] : ''; };
  function _stepOk(q, k, code) {
    if (code === q.ans[k]) return true;
    return k === 'o2' && Array.isArray(q.o2Also) && q.o2Also.includes(code);
  }
  const _numOf = (key, v) => key === 'ph' ? Number(v).toFixed(2).replace('.', ',') : String(v);

  // Explication de chaque étape, écrite à partir des valeurs du cas.
  function _why(q, k) {
    const g = q.gaz, a = q.ans, N = D().norms;
    const P2 = _numOf('ph', g.ph);
    switch (k) {
      case 'ph':
        if (a.ph === 'acid') return `pH ${P2} < 7,35 → **acidose** : le sang est trop acide.`;
        if (a.ph === 'alc') return `pH ${P2} > 7,45 → **alcalose** : le sang n'est pas assez acide.`;
        return `pH ${P2} est dans la normale (7,35 – 7,45). Attention : un pH normal n'exclut pas un trouble (il peut avoir été ramené à la normale par une compensation).`;
      case 'paco2': {
        const v = `PaCO₂ ${g.paco2} mmHg`;
        if (a.paco2 === 'norm') return `${v} est dans la normale (36 – 44) : pas de composante respiratoire.`;
        const hi = a.paco2 === 'up';
        const head = hi ? `${v} > 44 → **hypercapnie** (trop de CO₂).` : `${v} < 36 → **hypocapnie** (pas assez de CO₂).`;
        const same = (hi && a.ph === 'acid') || (!hi && a.ph === 'alc');
        const opp = (hi && a.ph === 'alc') || (!hi && a.ph === 'acid');
        const tail = same
          ? (hi ? " Le CO₂ est un acide : il monte et le pH baisse → ça va **dans le sens de l'acidose** : composante **respiratoire** (cause)."
                : " Moins de CO₂ = moins d'acide : le pH monte → ça va **dans le sens de l'alcalose** : composante **respiratoire** (cause).")
          : opp ? " Elle va **à l'inverse** du trouble du pH : ce n'est pas la cause, c'est plutôt une **compensation** respiratoire." : '';
        return head + tail;
      }
      case 'hco3': {
        const v = `HCO₃⁻ ${g.hco3} mmol/L`;
        if (a.hco3 === 'norm') return `${v} est dans la normale (22 – 26) : pas de composante métabolique.`;
        const hi = a.hco3 === 'up';
        const head = hi ? `${v} > 26 → bicarbonates **élevés**.` : `${v} < 22 → bicarbonates **bas**.`;
        const same = (hi && a.ph === 'alc') || (!hi && a.ph === 'acid');
        const opp = (hi && a.ph === 'acid') || (!hi && a.ph === 'alc');
        const tail = same
          ? (hi ? " Les HCO₃⁻ sont une base : ils montent et le pH monte → ça va **dans le sens de l'alcalose** : composante **métabolique** (cause)."
                : " Moins de base : le pH baisse → ça va **dans le sens de l'acidose** : composante **métabolique** (cause).")
          : opp ? " Ils vont **à l'inverse** du trouble du pH : ce ne sont pas la cause, c'est plutôt une **compensation** rénale (métabolique)." : '';
        return head + tail;
      }
      case 'tr': {
        const t = a.tr;
        if (t === 'mixte') return `La PaCO₂ et les HCO₃⁻ vont **tous les deux** dans le sens du trouble du pH : ils s'additionnent au lieu de se compenser → **${a.ph === 'acid' ? 'acidose' : 'alcalose'} mixte** (respiratoire + métabolique).`;
        if (t === 'acres' || t === 'alres') {
          const hi = t === 'acres';
          const side = a.hco3 === 'norm' ? ' et les HCO₃⁻ sont normaux' : (hi ? a.hco3 === 'up' : a.hco3 === 'down') ? ", alors que les HCO₃⁻ vont à l'inverse (ils compensent)" : '';
          return `La PaCO₂ ${hi ? '↑' : '↓'} va dans le sens ${hi ? "de l'acidose" : "de l'alcalose"}${side} → **${TR_LABEL[t].toLowerCase()}**.`;
        }
        const hi = t === 'almet';
        const side = a.paco2 === 'norm' ? ' et la PaCO₂ est normale' : (hi ? a.paco2 === 'up' : a.paco2 === 'down') ? ", alors que la PaCO₂ va à l'inverse (elle compense)" : '';
        return `Les HCO₃⁻ ${hi ? '↑' : '↓'} vont dans le sens ${hi ? "de l'alcalose" : "de l'acidose"}${side} → **${TR_LABEL[t].toLowerCase()}**.`;
      }
      case 'comp': {
        const part = a.ph !== 'norm' ? " Le pH est encore anormal : la compensation est **partielle** (elle n'a pas encore ramené le pH à la normale)." : " Le pH est revenu dans la normale : compensation complète.";
        if (a.comp === 'metab') return `Les HCO₃⁻ (${g.hco3}) vont à l'inverse du trouble : les **reins** compensent (compensation métabolique, ou « rénale »).${part}`;
        if (a.comp === 'resp') return `La PaCO₂ (${g.paco2}) va à l'inverse du trouble : les **poumons** compensent (compensation respiratoire).${part}`;
        return q.compWhy || "L'autre paramètre est dans la normale : pas de compensation visible.";
      }
      case 'o2': {
        let s;
        if (a.o2 === 'hypo') s = `PaO₂ ${g.pao2} mmHg < 80 → **hypoxémie** : le sang est mal oxygéné.`;
        else if (a.o2 === 'hyper') s = `PaO₂ ${g.pao2} mmHg > 100 → **hyperoxémie** selon ton CM10.`;
        else s = `PaO₂ ${g.pao2} mmHg est dans la normale (80 – 100) : oxygénation correcte.`;
        s += " La PaO₂ se lit à part : elle ne change pas le trouble acido-basique.";
        return s + (q.o2Note ? ' ' + q.o2Note : '');
      }
    }
    return '';
  }
  function conclusion(q) {
    const a = q.ans;
    let s = a.tr === 'mixte' ? (a.ph === 'acid' ? 'Acidose mixte (respiratoire + métabolique)' : 'Alcalose mixte (respiratoire + métabolique)') : (TR_LABEL[a.tr] || 'Pas de trouble acido-basique net (pH normal)');
    const part = a.ph !== 'norm' ? ' partielle' : '';
    if (a.comp === 'metab') s += ', avec compensation métabolique (rénale)' + part;
    else if (a.comp === 'resp') s += ', avec compensation respiratoire' + part;
    else s += ', sans compensation visible';
    s += ' · ' + (a.o2 === 'hypo' ? 'hypoxémie' : a.o2 === 'hyper' ? 'PaO₂ élevée (hyperoxémie)' : 'PaO₂ normale') + '.';
    return s;
  }

  // ══ Carte « résultat de gaz du sang » (réutilisable) ═════════════════════════
  const FLAG = {
    ph: { acid: '↓ acidose', alc: '↑ alcalose', norm: 'normal' },
    paco2: { up: '↑ hypercapnie', down: '↓ hypocapnie', norm: 'normale' },
    hco3: { up: '↑ élevés', down: '↓ bas', norm: 'normaux' },
    pao2: { hypo: '↓ hypoxémie', hyper: '↑ hyperoxémie', norm: 'normoxémie' }
  };
  // reveal : { ph:true, paco2:true, hco3:true, pao2:true } → affiche l'écart (flèche + mot) pour ces lignes.
  function gasCard(g, ans, reveal, opts) {
    reveal = reveal || {}; opts = opts || {};
    const N = D().norms;
    const rows = [
      ['ph', 'pH', _numOf('ph', g.ph), '', '7,35 – 7,45', ans && ans.ph],
      ['paco2', 'PaCO₂', g.paco2, 'mmHg', '36 – 44', ans && ans.paco2],
      ['hco3', 'HCO₃⁻', g.hco3, 'mmol/L', '22 – 26', ans && ans.hco3],
      ['pao2', 'PaO₂', g.pao2, 'mmHg', '80 – 100', ans && ans.o2]
    ].map(r => {
      const shown = reveal[r[0]] && r[5];
      const code = shown ? r[5] : null;
      const cls = code ? (code === 'norm' ? 'gz-fl-ok' : 'gz-fl-bad') : '';
      return `<div class="gz-row"><div class="gz-n"><b>${r[1]}</b><span class="gz-nm">normale : ${r[4]}</span></div>
        <div class="gz-v">${_esc(r[2])}<span class="gz-u">${r[3]}</span></div>
        <div class="gz-fl ${cls}">${code ? _esc(FLAG[r[0]][code]) : '<span class="gz-q">?</span>'}</div></div>`;
    }).join('');
    return `<div class="gz-gas" role="group" aria-label="Résultat du gaz du sang">
      <div class="gz-gas-h">🧪 ${_esc(opts.title || 'Gaz du sang artériel')}<span>patient fictif</span></div>${rows}</div>`;
  }

  // ══ Corps d'un cas guidé (utilisé par la série ET par l'atelier de la simulation) ═══
  // pre = 'cas' (série) ou 'ws' (atelier) → noms des gestionnaires App.Gazo.casPick / wsPick…
  function _casBody(q, cur, pre, finished) {
    const reveal = {};
    cur.log.forEach(l => { if (l.k === 'ph') reveal.ph = true; if (l.k === 'paco2') reveal.paco2 = true; if (l.k === 'hco3') reveal.hco3 = true; if (l.k === 'o2') reveal.pao2 = true; });
    let h = `<div class="gz-who">${_fmt(q.who)}</div>${gasCard(q.gaz, q.ans, reveal)}`;
    const past = cur.pend != null ? cur.log.slice(0, -1) : cur.log;
    if (past.length) {
      h += `<div class="gz-recap" aria-label="Ma démarche">${past.map(l => {
        const st = _step(l.k);
        return `<div class="gz-rc ${l.ok ? 'gz-rc-ok' : 'gz-rc-bad'}"><span class="gz-rc-n">${st.n}</span><span><b>${_esc(st.title)}</b> → ${_esc(_optLabel(l.k, q.ans[l.k]))}</span><span class="gz-rc-m">${l.ok ? '✓' : '✗'}</span></div>`;
      }).join('')}</div>`;
    }
    if (finished) return h;
    const st = STEPS[cur.si];
    h += `<div class="gz-step"><div class="ph-tag">Étape ${st.n} sur ${STEPS.length} · ${_esc(st.title)}</div><div class="ph-qtext">${_esc(st.ask)}</div>
      <div class="ph-opts" role="group" aria-label="Réponses">${st.opts.map((o, k) => {
        let cls = 'ph-opt';
        if (cur.pend != null) {
          if (_stepOk(q, st.k, o[0])) cls += ' ph-right';
          else if (cur.pend === o[0]) cls += ' ph-wrong';
          else cls += ' ph-dim';
        }
        return `<button class="${cls}" ${cur.pend != null ? 'disabled' : ''} onclick="App.Gazo.${pre}Pick(${k})"><span class="ph-key">${k + 1}</span><span>${_esc(o[1])}</span></button>`;
      }).join('')}</div></div>`;
    if (cur.pend != null) {
      const last = cur.log[cur.log.length - 1];
      const lastStep = cur.si + 1 >= STEPS.length;
      h += `<div id="gz-fb" class="ph-fb ${last.ok ? 'ph-fb-ok' : 'ph-fb-bad'}" role="status" aria-live="polite">
        <div class="ph-fb-h">${last.ok ? '✓ Oui !' : '✗ Pas tout à fait.'}${last.ok ? '' : ` <span class="ph-small" style="font-weight:600">Bonne réponse : ${_esc(_optLabel(st.k, q.ans[st.k]))}</span>`}</div>
        <div class="ph-fb-why">${_fmt(_why(q, st.k))}</div>
        <div class="ph-row" style="margin-top:8px"><button class="btn btn-primary ph-big" id="gz-next" onclick="App.Gazo.${pre}Next()">${lastStep ? 'Voir ma conclusion →' : 'Étape suivante →'}</button></div></div>`;
    }
    return h;
  }
  function _conclHtml(q) {
    return `<div class="gz-concl"><div class="gz-concl-h">Ma conclusion (lecture sommaire)</div>
      <div class="gz-concl-t">${_esc(conclusion(q))}</div>
      <div class="ph-small" style="margin-top:6px">${_fmt(q.clin)}</div>
      <div class="ph-small ph-muted" style="margin-top:6px">C'est un exercice de lecture, pas un diagnostic : en stage, on transmet le résultat et le contexte (signes cliniques, constantes) à l'infirmier(e) ou au médecin.</div></div>`;
  }
  function _doPick(q, cur, k) {
    const st = STEPS[cur.si]; if (!st) return false;
    const o = st.opts[k]; if (!o) return false;
    const ok = _stepOk(q, st.k, o[0]);
    cur.pend = o[0]; if (!ok) cur.errs++;
    cur.log.push({ k: st.k, picked: o[0], ok });
    return true;
  }

  // ══ Stockage ═════════════════════════════════════════════════════════════════
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

  // ══ Choix des questions d'une série ══════════════════════════════════════════
  function _pick(kind, n) {
    const Q = D().questions;
    const pool = kind === 'mix' ? Q : kind === 'miss' ? Q.filter(q => _isMissed(q.id)) : kind === 'cas' ? Q.filter(q => q.t === 'cas') : Q.filter(q => q.th === kind);
    const score = q => {
      const r = P.q[q.id];
      const base = !r || !r.n ? 3 : r.last === 0 ? 4 : r.streak >= MASTERED ? 1 : 2;
      return base + Math.random() * 1.5;
    };
    const sorted = pool.map(q => ({ q, s: score(q) })).sort((a, b) => b.s - a.s);
    const cap = MAX_CAS[kind] != null ? MAX_CAS[kind] : 0;
    const out = []; let nc = 0;
    for (const x of sorted) {
      if (x.q.t === 'cas') { if (nc >= cap) continue; nc++; }
      out.push(x.q.id);
      if (out.length >= n) break;
    }
    return _shuffle(out);
  }

  // ══ Navigation ═══════════════════════════════════════════════════════════════
  function open() {
    _load(); _bindKeys();
    const root = _el('gazo-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root', 'pharma-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null; WS = null;
    render();
    _top();
  }
  function close() {
    const root = _el('gazo-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; render(); _top(); }
  function showFiche(thId) { ficheTh = thId; screen = 'fiche'; render(); _top(); }
  function _top() { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} }
  function isTraining() { return screen === 'quiz' && !!run; }

  // ══ Série ════════════════════════════════════════════════════════════════════
  function startRun(kind) {
    const n = kind === 'mix' ? N_MIX : kind === 'miss' ? N_MISS : kind === 'cas' ? N_CAS : N_SERIES;
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
  function again() { if (run) startRun(run.kind); }
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
    else if (q.t === 'asc') { cur.lOrder = _shuffle([0, 1, 2, 3]); cur.rOrder = _shuffle([0, 1, 2, 3]); cur.matched = []; cur.sel = null; cur.errs = 0; cur.flash = null; }
    else if (q.t === 'cas') { cur.si = 0; cur.errs = 0; cur.log = []; cur.pend = null; }
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
    run.results.push({ id: q.id, ok, picked: run.cur.picked != null && run.cur.order ? run.cur.order[run.cur.picked] : null, val: run.cur.val || '', errs: run.cur.errs || 0 });
    _record(q, ok);
  }

  // ── Réponses ──
  function pick(k) {
    if (!run || screen !== 'quiz') return;
    const cur = run.cur, q = _qOf(cur.id);
    if (cur.done || q.t !== 'qcm' || k < 0 || k > 3) return;
    cur.picked = k;
    _answered(q, cur.order[k] === q.a);
    render(true);
  }
  function submitTxt() {
    if (!run) return;
    const cur = run.cur, q = _qOf(cur.id);
    if (cur.done || q.t !== 'txt') return;
    const inp = _el('gz-in');
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
    const sets = q.kws || (q.kw ? [q.kw] : []);
    if (sets.some(set => set.length && set.every(grp => grp.some(w => padded.includes(_norm(w)))))) return { ok: true, near: false };
    // Faute d'orthographe tolérée (1 lettre) pour les mots, JAMAIS pour les chiffres (7,25 ≠ 7,35).
    if (oks.some(s => s.length >= 7 && !/\d/.test(s) && _lev(n, s) <= 1)) return { ok: true, near: true };
    return { ok: false, near: false };
  }
  function ascTap(side, k) {
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
  // ── Cas guidé (série) ──
  function casPick(k) {
    if (!run || screen !== 'quiz') return;
    const cur = run.cur, q = _qOf(cur.id);
    if (q.t !== 'cas' || cur.done || cur.pend != null) return;
    if (_doPick(q, cur, k)) render(true);
  }
  function casNext() {
    if (!run || screen !== 'quiz') return;
    const cur = run.cur, q = _qOf(cur.id);
    if (q.t !== 'cas' || cur.done || cur.pend == null) return;
    if (cur.si + 1 < STEPS.length) { cur.si++; cur.pend = null; render(); _top(); }
    else { cur.pend = null; cur.si = STEPS.length; _answered(q, cur.errs === 0); render(true); }
  }

  // ══ Rendu (série) ════════════════════════════════════════════════════════════
  function render(focusFeedback) {
    const root = _el('gazo-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml();
    else if (screen === 'fiche') h = _ficheHtml();
    else if (screen === 'quiz') h = _quizHtml();
    else if (screen === 'bilan') h = _bilanHtml();
    root.innerHTML = `<div class="ph-wrap">${h}</div>`;
    if (screen === 'quiz') {
      const q = _qOf(run.cur.id);
      if (q.t === 'txt' && !run.cur.done) { const i = _el('gz-in'); if (i) { try { i.focus({ preventScroll: true }); } catch (e) {} } }
      if (focusFeedback) { const f = _el('gz-fb') || _el('ph-fb'); if (f) { try { f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} } }
    }
  }
  function _bar(a, b, cls) { const p = b ? Math.round(a / b * 100) : 0; return `<div class="ph-bar ${cls || ''}"><i style="width:${p}%"></i></div>`; }

  function _menuHtml() {
    const all = _stats(null);
    const nCas = D().questions.filter(q => q.t === 'cas').length;
    const cards = D().themes.map(t => {
      const s = _stats(t.id);
      return `<div class="ph-card">
        <div class="ph-th-head"><span class="ph-ico">${t.ico}</span><div><div class="ph-th-name">${_esc(t.name)}</div><div class="ph-muted ph-small">${_esc(t.blurb)}</div></div></div>
        ${_bar(s.mastered, s.total, 'ph-bar-ok')}
        <div class="ph-muted ph-small">${s.mastered} maîtrisée${s.mastered > 1 ? 's' : ''} sur ${s.total} · ${s.seen} vue${s.seen > 1 ? 's' : ''}${s.missed ? ` · <b class="ph-bad-t">${s.missed} à revoir</b>` : ''}</div>
        <div class="ph-row ph-gap">
          <button class="btn btn-ghost" onclick="App.Gazo.showFiche('${t.id}')">📖 Fiche</button>
          <button class="btn btn-primary" onclick="App.Gazo.startRun('${t.id}')">▶ Série de ${N_SERIES}</button>
        </div></div>`;
    }).join('');
    const last = P.runs.slice(0, 3).map(r => {
      const th = r.k === 'mix' ? 'Série mixte' : r.k === 'miss' ? 'Mes erreurs' : r.k === 'cas' ? 'Cas guidés' : (_theme(r.k) || {}).short || r.k;
      return `<div class="ph-hist"><span>${_esc(new Date(r.d).toLocaleDateString('fr-FR'))}</span><span>${_esc(th)}</span><b>${r.ok} / ${r.n}</b></div>`;
    }).join('');
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Gazo.close()">← Entraînement</button></div>
      <h2 class="ph-title">🧪 Gaz du sang</h2>
      <p class="ph-lead">Retiens les <b>valeurs normales</b> et ce que reflète chaque paramètre (pH, PaCO₂, HCO₃⁻, PaO₂), puis apprends la <b>méthode</b> : pH, PaCO₂, HCO₃⁻, compensation. Fiche d'abord si tu veux, puis séries de questions et <b>cas guidés pas à pas</b>.</p>
      ${cards}
      <div class="ph-row ph-gap ph-wrapr">
        <button class="btn btn-primary" onclick="App.Gazo.startRun('cas')">🩸 Cas guidés (${N_CAS} sur ${nCas})</button>
        <button class="btn btn-ghost" onclick="App.Gazo.startRun('mix')">🔀 Série mixte (${N_MIX})</button>
        <button class="btn btn-ghost" ${all.missed ? '' : 'disabled'} onclick="App.Gazo.startRun('miss')">🔁 Mes erreurs (${all.missed})</button>
      </div>
      ${last ? `<h3 class="ph-h">Dernières séries</h3><div class="ph-card">${last}</div>` : ''}
      <div class="ph-note"><b>À savoir.</b> Le contenu vient de tes notes (CM10 « interprétation des gaz du sang », capsule B3, TD 1 exercice 9) ; les points marqués « à vérifier » sont de la culture générale. <b>Les bornes normales varient un peu selon les supports</b> (ex. PaCO₂ 36–44 ou 35–45) : apprends celles de ton formateur. Les patients et les valeurs des cas fictifs sont inventés : ce sont des exercices de lecture « sommaire », pas des diagnostics. En stage, on transmet le résultat et le contexte à l'infirmier(e) ou au médecin, et le protocole de l'établissement prévaut. La correction fonctionne par règles (pas d'IA), hors ligne. Ta progression reste sur cet appareil ; le temps passé compte dans ton temps de révision.</div>`;
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
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Gazo.toMenu()">← Gaz du sang</button></div>
      <h2 class="ph-title">${t.ico} ${_esc(t.name)}</h2>
      <div class="ph-card">${blocks}</div>
      <div class="ph-muted ph-small" style="margin:8px 0 14px">${_esc(t.src)}</div>
      <div class="ph-row ph-gap ph-wrapr">
        <button class="btn btn-primary ph-big" onclick="App.Gazo.startRun('${t.id}')">▶ S'entraîner sur ce thème</button>
        ${t.id === 'met' ? '<button class="btn btn-ghost" onclick="App.Gazo.startRun(\'cas\')">🩸 Cas guidés</button>' : ''}
      </div>`;
  }

  function _quizHtml() {
    const q = _qOf(run.cur.id), cur = run.cur;
    const th = _theme(q.th);
    const total = run.ids.length;
    const label = run.kind === 'mix' ? 'Série mixte' : run.kind === 'miss' ? 'Mes erreurs' : run.kind === 'cas' ? 'Cas guidés' : th.short;
    let body = '';
    if (q.t === 'qcm') body = _qcmHtml(q, cur);
    else if (q.t === 'txt') body = _txtHtml(q, cur);
    else if (q.t === 'asc') body = _ascHtml(q, cur);
    else body = _casBody(q, cur, 'cas', cur.done);
    const fb = cur.done ? _feedbackHtml(q, cur) : '';
    const quit = run.quitAsk
      ? `<div class="ph-quit"><b>Quitter la série ?</b> Tes réponses déjà données sont gardées.
          <button class="btn btn-ghost btn-sm" onclick="App.Gazo.quit()">Oui, quitter</button>
          <button class="btn btn-primary btn-sm" onclick="App.Gazo.keepGoing()">Continuer</button></div>` : '';
    const tag = q.t === 'cas' ? `${run.kind === 'cas' ? '' : ' · cas guidé'}${q.hard ? ' · difficile' : ''}` : q.t === 'asc' ? ' · association' : q.t === 'txt' ? ' · réponse à écrire' : '';
    const qtext = q.t === 'cas' ? '' : `<div class="ph-qtext">${_fmt(q.q)}</div>`;
    return `<div class="ph-top ph-row">
        <button class="btn btn-ghost btn-sm" onclick="App.Gazo.askQuit()">← Quitter</button>
        <div class="ph-prog">${_bar(run.i + (cur.done ? 1 : 0), total)}<span class="ph-small ph-muted">Question ${run.i + 1} / ${total}</span></div>
        <span class="ph-score">${run.results.filter(r => r.ok).length} ✓</span>
      </div>${quit}
      <div class="ph-card ph-q">
        <div class="ph-tag">${th.ico} ${_esc(label)}${tag}</div>
        ${qtext}${body}
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
      return `<button class="${cls}" ${cur.done ? 'disabled' : ''} onclick="App.Gazo.pick(${k})"><span class="ph-key">${k + 1}</span><span>${_esc(q.opts[orig])}</span></button>`;
    }).join('')}</div>`;
  }
  function _txtHtml(q, cur) {
    if (cur.done) return `<input class="ph-in ${cur.ok ? 'ph-in-ok' : 'ph-in-bad'}" value="${_esc(cur.val)}" disabled aria-label="Ta réponse">`;
    return `<div class="ph-row ph-gap"><input id="gz-in" class="ph-in" type="text" placeholder="Ta réponse…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
        onkeydown="if(event.key==='Enter'){event.preventDefault();App.Gazo.submitTxt()}" aria-label="Ta réponse">
        <button class="btn btn-primary" onclick="App.Gazo.submitTxt()">Valider</button></div>
        ${cur.empty ? '<div class="ph-small ph-bad-t" style="margin-top:6px">Écris une réponse avant de valider.</div>' : ''}`;
  }
  function _ascHtml(q, cur) {
    const side = (s, order, idx) => order.map(k => {
      const done = cur.matched.includes(k), sel = cur.sel && cur.sel.side === s && cur.sel.k === k, bad = cur.flash && cur.flash[s] === k;
      return `<button class="ph-pair ${done ? 'ph-right' : ''} ${sel ? 'ph-sel' : ''} ${bad ? 'ph-wrong' : ''}" ${done || cur.done ? 'disabled' : ''} onclick="App.Gazo.ascTap('${s}',${k})">${_esc(q.pairs[k][idx])}</button>`;
    }).join('');
    return `<div class="ph-small ph-muted" style="margin-bottom:6px">Touche un élément à gauche, puis son correspondant à droite.${cur.errs ? ` · <b class="ph-bad-t">${cur.errs} erreur${cur.errs > 1 ? 's' : ''}</b>` : ''}</div>
      <div class="ph-asc"><div class="ph-col">${side('l', cur.lOrder, 0)}</div><div class="ph-col">${side('r', cur.rOrder, 1)}</div></div>`;
  }
  const SRC = { CM10: 'ton CM10 (interprétation des gaz du sang)', TD1: 'ton TD 1 (exercice 9)', 'Général': 'culture générale', fictif: "cas fictif d'entraînement" };
  const _srcLabel = s => SRC[s] || s;
  function _feedbackHtml(q, cur) {
    const last = run.i + 1 >= run.ids.length;
    let head, extra = '', why = '';
    if (q.t === 'cas') {
      head = cur.ok ? '✓ Cas réussi sans faute !' : `✗ Cas terminé avec ${cur.errs} erreur${cur.errs > 1 ? 's' : ''}.`;
      why = _conclHtml(q);
    } else if (cur.ok) {
      head = q.t === 'asc' ? '✓ Sans faute !' : '✓ Bien joué !';
      if (cur.near) extra = `<div class="ph-small">Attention à l'orthographe : <b>${_esc(q.show)}</b>.</div>`;
      why = `<div class="ph-fb-why">${_fmt(q.why)}</div>`;
    } else {
      if (q.t === 'qcm') { head = '✗ Pas tout à fait.'; extra = `<div class="ph-small">Bonne réponse : <b>${_esc(q.opts[q.a])}</b></div>`; }
      else if (q.t === 'txt') { head = '✗ Pas tout à fait.'; extra = `<div class="ph-small">Réponse attendue : <b>${_esc(q.show)}</b></div>`; }
      else head = '✗ Association terminée avec ' + cur.errs + ' erreur' + (cur.errs > 1 ? 's' : '') + '.';
      why = `<div class="ph-fb-why">${_fmt(q.why)}</div>`;
    }
    return `<div id="ph-fb" class="ph-fb ${cur.ok ? 'ph-fb-ok' : 'ph-fb-bad'}" role="status" aria-live="polite">
        <div class="ph-fb-h">${head}</div>${extra}${why}
        <div class="ph-small ph-muted" style="margin-top:6px">Source : ${_esc(_srcLabel(q.src))}${q.chk ? ' · <b class="ph-warn-t">à vérifier dans ton cours (culture générale)</b>' : ''}</div>
        <div class="ph-row" style="margin-top:10px"><button class="btn btn-primary ph-big" id="ph-next" onclick="App.Gazo.next()">${last ? 'Voir mon bilan →' : 'Question suivante →'}</button></div>
      </div>`;
  }

  function _bilanHtml() {
    const ok = run.results.filter(r => r.ok).length, n = run.results.length;
    const pct = n ? Math.round(ok / n * 100) : 0;
    const msg = pct >= 90 ? 'Très solide.' : pct >= 70 ? 'Bien : encore quelques points à fixer.' : pct >= 50 ? 'À consolider : relis la fiche puis refais les erreurs.' : 'À retravailler : commence par la fiche du thème.';
    const wrong = run.results.filter(r => !r.ok);
    const byTh = {};
    run.results.forEach(r => { const q = _qOf(r.id); (byTh[q.th] = byTh[q.th] || { ok: 0, n: 0 }); byTh[q.th].n++; if (r.ok) byTh[q.th].ok++; });
    const thRows = Object.keys(byTh).length > 1 ? Object.keys(byTh).map(id => `<div class="ph-hist"><span>${_theme(id).ico} ${_esc(_theme(id).short)}</span><span></span><b>${byTh[id].ok} / ${byTh[id].n}</b></div>`).join('') : '';
    const errs = wrong.map(r => {
      const q = _qOf(r.id);
      if (q.t === 'cas') return `<div class="ph-err"><div class="ph-err-q">Cas : ${_fmt(q.who)}</div><div class="ph-small">pH ${_numOf('ph', q.gaz.ph)} · PaCO₂ ${q.gaz.paco2} · HCO₃⁻ ${q.gaz.hco3} · PaO₂ ${q.gaz.pao2}</div><div class="ph-small">Bonne conclusion : <b>${_esc(conclusion(q))}</b></div></div>`;
      const good = q.t === 'qcm' ? q.opts[q.a] : q.t === 'txt' ? q.show : '';
      return `<div class="ph-err"><div class="ph-err-q">${_fmt(q.q)}</div>${good ? `<div class="ph-small">Bonne réponse : <b>${_esc(good)}</b></div>` : ''}<div class="ph-small ph-muted">${_fmt(q.why)}</div></div>`;
    }).join('');
    const kind = run.kind;
    return `<div class="ph-top"><button class="btn btn-ghost btn-sm" onclick="App.Gazo.toMenu()">← Gaz du sang</button></div>
      <h2 class="ph-title">Bilan de la série</h2>
      <div class="ph-card ph-center">
        <div class="ph-big-score">${ok} / ${n}</div>
        <div class="ph-pct ${pct >= 70 ? 'ph-ok-t' : pct >= 50 ? 'ph-warn-t' : 'ph-bad-t'}">${pct} %</div>
        <div class="ph-muted">${msg}</div>
      </div>
      ${thRows ? `<div class="ph-card">${thRows}</div>` : ''}
      <div class="ph-row ph-gap ph-wrapr" style="margin:12px 0">
        ${wrong.length ? `<button class="btn btn-primary" onclick="App.Gazo.retryMistakes()">🔁 Refaire mes ${wrong.length} erreur${wrong.length > 1 ? 's' : ''}</button>` : ''}
        <button class="btn ${wrong.length ? 'btn-ghost' : 'btn-primary'}" onclick="App.Gazo.again()">▶ Nouvelle série</button>
        ${_theme(kind) ? `<button class="btn btn-ghost" onclick="App.Gazo.showFiche('${kind}')">📖 Fiche du thème</button>` : ''}
        <button class="btn btn-ghost" onclick="App.Gazo.toMenu()">Menu</button>
      </div>
      ${wrong.length ? `<h3 class="ph-h">À revoir</h3><div class="ph-card">${errs}</div>` : '<div class="ph-note">Aucune erreur sur cette série. Les questions réussies reviendront moins souvent ; celles que tu rates reviennent en priorité.</div>'}`;
  }

  // ══ Atelier dans la simulation EHPAD ═════════════════════════════════════════
  // ctx = { q:{ who, gaz, ans, clin, compWhy?, o2Note? }, intro, backLabel, onDone(r), onBack() }
  // Le temps passé est compté par la simulation (zone #sim-root visible, pas d'élément #sim-ecg).
  function workshop(ctx) {
    if (!ctx || !ctx.q) return;
    const root = _el('sim-root'); if (!root) return;
    WS = { ctx, q: ctx.q, cur: { done: false, si: 0, errs: 0, log: [], pend: null } };
    _bindKeys();
    _wsRender();
    _top();
  }
  function _wsRender(focus) {
    const root = _el('sim-root'); if (!root || !WS) return;
    const { ctx, q, cur } = WS;
    const finished = cur.si >= STEPS.length;
    const body = _casBody(q, cur, 'ws', finished);
    const end = finished
      ? `${_conclHtml(q)}<div class="ph-row ph-gap ph-wrapr" style="margin-top:12px"><button class="btn btn-primary ph-big" id="gz-done" onclick="App.Gazo.wsFinish()">${_esc(ctx.doneLabel || 'Continuer →')}</button></div>`
      : '';
    root.innerHTML = `<div class="sim-wrap gz-ws" id="gz-ws">
      <div class="sim-bar"><button class="btn btn-ghost btn-sm" onclick="App.Gazo.wsBack()">← ${_esc(ctx.backLabel || 'Retour')}</button><div class="sim-bar-title">🧪 Lire le gaz du sang</div></div>
      <div class="sim-card">
        <h2 class="sim-title">${_esc(ctx.title || 'Lire le résultat du gaz du sang')}</h2>
        ${ctx.intro ? `<p class="sim-lead">${_fmt(ctx.intro)}</p>` : ''}
        <div class="ph-small ph-muted" style="margin-bottom:8px">Méthode : pH → PaCO₂ → HCO₃⁻ → trouble → compensation, puis PaO₂ à part. Les valeurs sont fictives ; ta lecture reste sommaire et ne remplace pas l'avis du médecin.</div>
        ${body}${end}
      </div></div>`;
    if (focus) { const f = _el('gz-fb') || _el('gz-done'); if (f) { try { f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} } }
  }
  function wsPick(k) {
    if (!WS || WS.cur.pend != null || WS.cur.si >= STEPS.length) return;
    if (_doPick(WS.q, WS.cur, k)) _wsRender(true);
  }
  function wsNext() {
    if (!WS || WS.cur.pend == null) return;
    const cur = WS.cur;
    cur.pend = null; cur.si++;
    _wsRender(cur.si >= STEPS.length); if (cur.si < STEPS.length) _top();
  }
  function wsBack() {
    const c = WS && WS.ctx; WS = null;
    if (c && typeof c.onBack === 'function') { try { c.onBack(); } catch (e) {} }
  }
  function wsFinish() {
    if (!WS || WS.cur.si < STEPS.length) return;
    const c = WS.ctx, cur = WS.cur, r = { errs: cur.errs, steps: STEPS.length, ok: cur.errs === 0 };
    WS = null;
    if (c && typeof c.onDone === 'function') { try { c.onDone(r); } catch (e) {} }
  }
  function wsActive() { return !!WS && !!_el('gz-ws'); }

  // ── Clavier : 1-5 = réponse, Entrée = suite ──
  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (WS && _el('gz-ws')) {
        if (/^[1-5]$/.test(e.key) && WS.cur.pend == null && WS.cur.si < STEPS.length) { e.preventDefault(); wsPick(parseInt(e.key, 10) - 1); }
        else if (e.key === 'Enter' && WS.cur.pend != null) { e.preventDefault(); wsNext(); }
        return;
      }
      if (screen !== 'quiz' || !run) return;
      const root = _el('gazo-root'); if (!root || root.style.display === 'none') return;
      const q = _qOf(run.cur.id), cur = run.cur;
      if (q.t === 'qcm' && !cur.done && /^[1-4]$/.test(e.key)) { e.preventDefault(); pick(parseInt(e.key, 10) - 1); }
      else if (q.t === 'cas' && !cur.done && cur.pend == null && /^[1-5]$/.test(e.key)) { e.preventDefault(); casPick(parseInt(e.key, 10) - 1); }
      else if (q.t === 'cas' && !cur.done && cur.pend != null && e.key === 'Enter') { e.preventDefault(); casNext(); }
      else if (cur.done && e.key === 'Enter') { e.preventDefault(); next(); }
    });
    _keysBound = true;
  }

  _load();

  return {
    open, close, toMenu, showFiche, startRun, retryMistakes, again, askQuit, keepGoing, quit, next,
    pick, submitTxt, ascTap, casPick, casNext, isTraining,
    workshop, wsPick, wsNext, wsBack, wsFinish, wsActive,
    interpret, check, conclusion, gasCard, steps: () => STEPS,
    _t: { norm: _norm, lev: _lev, grade: _gradeTxt, pick: _pick, why: _why, state: () => ({ screen, run, P, WS }), stats: _stats, reset: () => { P = { v: 1, q: {}, runs: [] }; _save(); } }
  };
})();
