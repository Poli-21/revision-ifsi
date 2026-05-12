// core/games.js — Modes d'entraînement : Mécanisme à trous, Vrai/Faux, Association
'use strict';
window.App = window.App || {};

App.Games = (() => {
  const STOPS = new Set(['le','la','les','un','une','des','de','du','et','ou','à','en','dans','par','sur','sous','pour','avec','sans','qui','que','qu','est','sont','il','elle','ils','elles','se','ce','cet','cette','ces','au','aux','y','on','nous','vous','pas','ne','plus','leur','leurs','très','aussi','car','mais','donc','or','ni','si','tout','bien','lors']);

  let mode     = 'tf';
  let allCards = [];
  let queue    = [];
  let idx      = 0;
  let score    = { ok: 0, total: 0 };

  // Match state
  let _matchCards   = [];
  let _matchSelTerm = null;
  let _matchDone    = 0;
  let _matchPaired  = new Set();

  // TF state
  let _tfIsTrue   = false;
  let _tfAnswered = false;

  // ── Tryhard state ─────────────────────────────────────────────
  const TH_BATCH = 10;           // taille d'un cycle
  let _thBatches    = [];        // tous les lots de TH_BATCH cartes
  let _thCycleNum   = 0;         // cycle courant (0-based)
  let _thQueue      = [];        // cartes restantes à réussir dans ce cycle
  let _thDone       = new Set(); // ids des cartes réussies dans ce cycle
  let _thAttempts   = 0;         // tentatives dans ce cycle
  let _thCycleStart = 0;         // timestamp début cycle
  let _thAnswering  = false;     // bloque double-submit

  // ── Sélection du mode ──────────────────────────────────────────
  function selectMode(m) {
    mode = m;
    document.querySelectorAll('.game-mode-card').forEach(el => el.classList.remove('selected'));
    const btn = _el('gm-' + m);
    if (btn) btn.classList.add('selected');
  }

  // ── Remplir le select catégorie ────────────────────────────────
  function populateCatSelect() {
    const sel = _el('games-cat-select');
    if (!sel) return;
    const cats = App.Render.orderedCats();
    sel.innerHTML = '<option value="">Toutes les matières</option>' +
      cats.map(c => `<option value="${_esc(c)}">${_esc(c)}</option>`).join('');
  }

  // ── Démarrer ───────────────────────────────────────────────────
  function start() {
    const catVal = _el('games-cat-select')?.value || '';
    let cards = App.Store.state.cards.filter(c => !c.suspended && c.term && c.def);
    if (catVal) cards = cards.filter(c => c.cat === catVal);
    if (cards.length < 2) { alert('Il faut au moins 2 cartes pour ce mode.'); return; }

    allCards = App.Store.state.cards.filter(c => !c.suspended && c.term && c.def);
    queue  = _shuffle(cards);
    idx    = 0;
    score  = { ok: 0, total: 0 };

    _el('games-setup').style.display    = 'none';
    _el('games-done').style.display     = 'none';
    _el('games-practice').style.display = 'block';
    ['game-blanks-zone','game-tf-zone','game-match-zone'].forEach(id => {
      const el = _el(id); if (el) el.style.display = 'none';
    });
    _updateProgress();
    _showCurrent();
  }

  function _showCurrent() {
    if (idx >= queue.length) { _showDone(); return; }
    if      (mode === 'blanks')  _showBlanks(queue[idx]);
    else if (mode === 'tf')      _showTF();
    else if (mode === 'match')   _showMatch();
    else if (mode === 'tryhard') _showTryhard();
  }

  // ════════════════════════════════════════════════════════════════
  // MODE 1 — MÉCANISME À TROUS
  // ════════════════════════════════════════════════════════════════
  let _blanksAnswers = [];

  function _showBlanks(card) {
    const zone = _el('game-blanks-zone');
    zone.style.display = 'block';

    // Tokenise en préservant la ponctuation et les espaces
    const tokens = card.def.split(/(\s+)/);
    const candidates = [];
    tokens.forEach((tok, i) => {
      const clean = tok.replace(/[.,;:!?()\-]/g, '').toLowerCase();
      if (clean.length > 3 && !STOPS.has(clean)) candidates.push(i);
    });

    const nBlanks = Math.max(1, Math.min(5, Math.round(candidates.length * 0.38)));
    const toBlank = new Set(_shuffle(candidates).slice(0, nBlanks));

    _blanksAnswers = [];
    let inputIdx = 0;
    let html = '<div class="blanks-text">';
    tokens.forEach((tok, i) => {
      if (toBlank.has(i)) {
        const clean  = tok.replace(/[.,;:!?()\-]/g, '');
        const punct  = tok.slice(clean.length);
        const bIdx   = inputIdx++;
        _blanksAnswers.push({ correct: clean.toLowerCase() });
        const w = Math.max(60, clean.length * 11);
        html += `<input class="blank-input" data-b="${bIdx}" type="text" style="width:${w}px"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${_esc(punct)}`;
      } else {
        html += _esc(tok);
      }
    });
    html += '</div>';

    zone.innerHTML = `
      <div class="game-cat-tag">${_esc(card.cat)}</div>
      <div class="game-term">${_esc(card.term)}</div>
      <div class="game-instruction">Complète les mots manquants dans la définition :</div>
      ${html}
      <div class="game-actions">
        <button class="btn btn-primary" onclick="App.Games.checkBlanks()">Vérifier →</button>
      </div>
      <div id="blanks-feedback" class="game-feedback" style="display:none"></div>`;

    // Navigation clavier entre les blancs
    const inputs = zone.querySelectorAll('.blank-input');
    inputs.forEach((inp, i) => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (i < inputs.length - 1) inputs[i + 1].focus();
          else checkBlanks();
        }
      });
    });
    setTimeout(() => inputs[0]?.focus(), 50);
  }

  function checkBlanks() {
    const zone   = _el('game-blanks-zone');
    const inputs = zone.querySelectorAll('.blank-input');
    let allOk = true;
    inputs.forEach((inp, i) => {
      const user = inp.value.trim().toLowerCase().replace(/[.,;:!?()\-]/g, '');
      const ok   = _norm(user) === _norm(_blanksAnswers[i].correct);
      inp.classList.add(ok ? 'blank-ok' : 'blank-err');
      inp.disabled = true;
      if (!ok) { allOk = false; inp.title = `✓ ${_blanksAnswers[i].correct}`; }
    });

    score.total++;
    if (allOk) score.ok++;

    const fb = _el('blanks-feedback');
    fb.style.display = 'block';
    fb.className = 'game-feedback ' + (allOk ? 'fb-ok' : 'fb-err');
    fb.innerHTML = allOk
      ? '✅ Parfait !'
      : '❌ Regarde les mots en rouge (survole pour voir la correction)';

    zone.querySelector('.game-actions').innerHTML =
      `<button class="btn btn-primary" onclick="App.Games.next()">Suivant →</button>`;
    _updateProgress();
  }

  // ════════════════════════════════════════════════════════════════
  // MODE 2 — VRAI / FAUX
  // ════════════════════════════════════════════════════════════════
  function _showTF() {
    const zone = _el('game-tf-zone');
    zone.style.display = 'block';
    _tfAnswered = false;

    const card = queue[idx];
    _tfIsTrue = Math.random() < 0.55; // légèrement plus de vrais pour équilibrer

    let shownDef = card.def;
    if (!_tfIsTrue) {
      // Essaie d'abord une mutation médicale proche, sinon une autre carte
      const distractors = App.Distractor.pick(card, allCards, 1);
      shownDef = distractors[0] || card.def;
      if (shownDef === card.def) _tfIsTrue = true;
    }

    zone.innerHTML = `
      <div class="game-cat-tag">${_esc(card.cat)}</div>
      <div class="game-term">${_esc(card.term)}</div>
      <div class="tf-question">Cette définition est-elle correcte ?</div>
      <div class="tf-def-box">${_esc(shownDef)}</div>
      <div class="tf-buttons">
        <button class="tf-btn tf-vrai" id="tf-vrai-btn" onclick="App.Games.answerTF(true)">✅ VRAI</button>
        <button class="tf-btn tf-faux" id="tf-faux-btn" onclick="App.Games.answerTF(false)">❌ FAUX</button>
      </div>
      <div id="tf-feedback" class="game-feedback" style="display:none"></div>`;
  }

  function answerTF(answer) {
    if (_tfAnswered) return;
    _tfAnswered = true;

    const correct = answer === _tfIsTrue;
    score.total++;
    if (correct) score.ok++;

    const card = queue[idx];
    document.querySelectorAll('.tf-btn').forEach(b => b.disabled = true);

    const okBtn   = _el(_tfIsTrue ? 'tf-vrai-btn' : 'tf-faux-btn');
    const wrongBtn = _el(_tfIsTrue ? 'tf-faux-btn' : 'tf-vrai-btn');
    if (okBtn)    okBtn.classList.add('tf-highlight-ok');
    if (wrongBtn && !correct) wrongBtn.classList.add('tf-highlight-err');

    const fb = _el('tf-feedback');
    fb.style.display = 'block';
    fb.className = 'game-feedback ' + (correct ? 'fb-ok' : 'fb-err');
    fb.innerHTML = correct
      ? '✅ Correct !'
      : `❌ C'était ${_tfIsTrue ? 'VRAI' : 'FAUX'}. Vraie définition : <em>${_esc(card.def)}</em>`;

    _updateProgress();
    setTimeout(() => next(), 2000);
  }

  // ════════════════════════════════════════════════════════════════
  // MODE 3 — ASSOCIATION
  // ════════════════════════════════════════════════════════════════
  function _showMatch() {
    const zone = _el('game-match-zone');
    zone.style.display = 'block';
    _matchSelTerm = null;
    _matchPaired  = new Set();
    _matchDone    = 0;

    const size = Math.min(5, queue.length - idx);
    _matchCards = queue.slice(idx, idx + size);
    const shuffledDefs = _shuffle([..._matchCards]);

    zone.innerHTML = `
      <div class="game-instruction">Clique sur un terme, puis sur sa définition pour les associer.</div>
      <div class="match-grid">
        <div class="match-col match-terms-col">
          ${_matchCards.map((c, i) => `
            <button class="match-item match-term" data-id="${c.id}" onclick="App.Games.selectTerm('${c.id}')">
              <span class="match-num">${i + 1}</span>
              <span>${_esc(c.term)}</span>
            </button>`).join('')}
        </div>
        <div class="match-col match-defs-col">
          ${shuffledDefs.map(c => `
            <button class="match-item match-def" data-id="${c.id}" onclick="App.Games.selectDef('${c.id}')">
              ${_esc(c.def.length > 110 ? c.def.slice(0, 110) + '…' : c.def)}
            </button>`).join('')}
        </div>
      </div>
      <div id="match-feedback" class="game-feedback" style="display:none"></div>`;
  }

  function selectTerm(id) {
    if (_matchPaired.has(id)) return;
    _matchSelTerm = id;
    document.querySelectorAll('.match-term').forEach(el => {
      if (_matchPaired.has(el.dataset.id)) return;
      el.classList.toggle('match-selected', el.dataset.id === id);
    });
  }

  function selectDef(defId) {
    if (!_matchSelTerm) return;
    const termId  = _matchSelTerm;
    const correct = termId === defId;

    const termEl = document.querySelector(`.match-term[data-id="${termId}"]`);
    const defEl  = document.querySelector(`.match-def[data-id="${defId}"]`);

    if (correct) {
      _matchPaired.add(termId);
      _matchSelTerm = null;
      _matchDone++;
      score.total++;
      score.ok++;
      if (termEl) { termEl.classList.remove('match-selected'); termEl.classList.add('match-ok'); termEl.disabled = true; }
      if (defEl)  { defEl.classList.add('match-ok'); defEl.disabled = true; }

      _updateProgress();
      if (_matchDone >= _matchCards.length) {
        const fb = _el('match-feedback');
        fb.style.display = 'block';
        fb.className = 'game-feedback fb-ok';
        fb.innerHTML = `✅ Tous les termes associés !
          <button class="btn btn-primary btn-sm" onclick="App.Games.nextMatch()" style="margin-left:14px">Continuer →</button>`;
      }
    } else {
      score.total++;
      if (termEl) termEl.classList.add('match-err');
      if (defEl)  defEl.classList.add('match-err');
      setTimeout(() => {
        if (termEl) termEl.classList.remove('match-err', 'match-selected');
        if (defEl)  defEl.classList.remove('match-err');
        _matchSelTerm = null;
        _updateProgress();
      }, 600);
    }
  }

  function nextMatch() {
    idx += _matchCards.length;
    _showCurrent();
  }

  // ════════════════════════════════════════════════════════════════
  // MODE 4 — TRYHARD (cycles de 10 · écriture obligatoire)
  // ════════════════════════════════════════════════════════════════
  function _showTryhard() {
    // Découpe la queue en lots de TH_BATCH
    _thBatches = [];
    for (let i = 0; i < queue.length; i += TH_BATCH)
      _thBatches.push(_shuffle(queue.slice(i, i + TH_BATCH)));
    _thCycleNum = 0;
    _startThCycle();
  }

  function _startThCycle() {
    const batch = _thBatches[_thCycleNum];
    _thQueue    = [...batch];
    _thDone     = new Set();
    _thAttempts = 0;
    _thAnswering = false;
    _thCycleStart = Date.now();
    _showThCard();
  }

  function _showThCard() {
    const zone = _el('game-tryhard-zone');
    zone.style.display = 'block';
    _thAnswering = false;
    const card  = _thQueue[0];
    const batch = _thBatches[_thCycleNum];
    const total = _thBatches.length;
    const nDone = _thDone.size;

    // Indicateurs de progression du cycle (pastilles)
    const dots = batch.map(c => {
      if (_thDone.has(c.id))      return `<span class="th-dot th-dot-ok">✓</span>`;
      if (c.id === card.id)       return `<span class="th-dot th-dot-cur">●</span>`;
      return `<span class="th-dot">○</span>`;
    }).join('');

    // Résolution de l'image
    let imgHtml = '';
    if (card.image && App.SVG && App.SVG[card.image]) {
      imgHtml = `<div class="th-img">${App.SVG[card.image]}</div>`;
    } else if (card.customImage) {
      imgHtml = `<div class="th-img"><img src="${card.customImage}" style="max-height:260px;max-width:100%;object-fit:contain;border-radius:8px"></div>`;
    }

    zone.innerHTML = `
      <div class="th-header">
        <span class="th-cycle-label">Cycle ${_thCycleNum + 1} / ${total}</span>
        <div class="th-dots">${dots}</div>
        <span class="th-attempts">${_thAttempts} tentative${_thAttempts !== 1 ? 's' : ''}</span>
      </div>
      <div class="game-cat-tag">${_esc(card.cat)}</div>
      <div class="game-term th-term">${_esc(card.term)}</div>
      ${imgHtml}
      <input class="ortho-input th-input" id="th-input" type="text"
        placeholder="Écris la définition…"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <div class="game-actions">
        <button class="btn btn-primary" onclick="App.Games.checkTryhard()">Valider →</button>
      </div>
      <div id="th-feedback" class="th-feedback" style="display:none"></div>`;

    const inp = _el('th-input');
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); checkTryhard(); }
    };
    setTimeout(() => inp?.focus(), 40);
    _updateProgress();
  }

  function checkTryhard() {
    if (_thAnswering) return;
    const inp  = _el('th-input');
    if (!inp) return;
    const user = inp.value.trim();
    if (!user) { inp.focus(); return; }

    _thAnswering = true;
    _thAttempts++;
    const card   = _thQueue[0];
    const result = _checkThAnswer(user, card.def);

    const fb = _el('th-feedback');
    fb.style.display = 'block';

    if (result === 'correct' || result === 'close') {
      _thDone.add(card.id);
      _thQueue.shift();
      score.ok++;
      score.total++;
      inp.classList.add('blank-ok');
      inp.disabled = true;

      fb.className = 'th-feedback th-fb-ok';
      fb.innerHTML = result === 'correct'
        ? `✅ Parfait !`
        : `✅ Accepté <span class="th-typo">(faute de frappe · correct : <em>${_esc(card.def)}</em>)</span>`;

      if (_thQueue.length === 0) {
        // Cycle terminé !
        setTimeout(() => _showThCycleDone(), 700);
      } else {
        setTimeout(() => _showThCard(), 900);
      }
    } else {
      // Raté → carte repart en fin de queue
      _thQueue.shift();
      _thQueue.push(card);
      score.total++;
      inp.classList.add('blank-err');
      inp.disabled = true;

      fb.className = 'th-feedback th-fb-err';
      fb.innerHTML = `❌ <strong>Ta réponse :</strong> ${_esc(user)}<br>
        <strong>✓ Correct :</strong> <em>${_esc(card.def)}</em><br>
        <span class="th-retry-hint">Cette carte reviendra dans ce cycle.</span>`;

      setTimeout(() => _showThCard(), 2200);
    }
    _updateProgress();
  }

  function _showThCycleDone() {
    const zone    = _el('game-tryhard-zone');
    const secs    = Math.round((Date.now() - _thCycleStart) / 1000);
    const batchN  = _thBatches[_thCycleNum].length;
    const pct     = Math.round(batchN / _thAttempts * 100);
    const isLast  = _thCycleNum >= _thBatches.length - 1;
    const m = Math.floor(secs / 60), s = secs % 60;
    const timeStr = m > 0 ? `${m}min ${s}s` : `${s}s`;

    zone.innerHTML = `
      <div class="th-cycle-done">
        <div class="th-cycle-done-icon">${pct === 100 ? '🔥' : pct >= 75 ? '💪' : '😤'}</div>
        <div class="th-cycle-done-title">Cycle ${_thCycleNum + 1} terminé !</div>
        <div class="th-cycle-stats">
          <div class="th-stat"><span>${batchN}</span><small>cartes maîtrisées</small></div>
          <div class="th-stat"><span>${_thAttempts}</span><small>tentatives</small></div>
          <div class="th-stat"><span style="color:${pct>=80?'var(--success)':pct>=60?'var(--warning)':'var(--danger)'}">${pct}%</span><small>efficacité</small></div>
          <div class="th-stat"><span>${timeStr}</span><small>durée</small></div>
        </div>
        ${isLast
          ? `<button class="btn btn-primary" onclick="App.Games._thFinish()">Voir le résultat final →</button>`
          : `<button class="btn btn-primary" onclick="App.Games._thNextCycle()">Cycle suivant →</button>
             <button class="btn btn-ghost" onclick="App.Games._thFinish()" style="margin-left:8px">Terminer</button>`}
      </div>`;
  }

  function _thNextCycle() {
    _thCycleNum++;
    _startThCycle();
  }

  function _thFinish() {
    _showDone();
  }

  // Vérification de réponse avec tolérance aux fautes de frappe
  function _checkThAnswer(user, correct) {
    const u = _norm(user);
    const c = _norm(correct);
    if (u === c) return 'correct';
    // Tolère 1 typo par tranche de 6 chars (min 1 pour mots > 3 chars)
    if (c.length > 3) {
      const maxDist = Math.max(1, Math.floor(c.length / 6));
      if (_levenshtein(u, c) <= maxDist) return 'close';
    }
    return 'wrong';
  }

  function _levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const dp = Array.from({length: m + 1}, (_, i) => [i]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
      }
    }
    return dp[m][n];
  }

  // ── Navigation ─────────────────────────────────────────────────
  function next() {
    idx++;
    _updateProgress();
    _showCurrent();
  }

  function _showDone() {
    _el('games-practice').style.display = 'none';
    _el('games-done').style.display     = 'block';
    const pct = score.total > 0 ? Math.round(score.ok / score.total * 100) : 0;
    _el('games-done-score').textContent = `${score.ok} / ${score.total}`;
    _el('games-done-pct').textContent   = pct + ' %';
    _el('games-done-pct').style.color   = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    _el('games-done-mode').textContent  = { blanks: 'Mécanisme à trous', tf: 'Vrai / Faux', match: 'Association', tryhard: '💪 Mode Tryhard' }[mode] || '';
  }

  function reset() {
    _el('games-setup').style.display    = 'block';
    _el('games-practice').style.display = 'none';
    _el('games-done').style.display     = 'none';
    populateCatSelect();
  }

  // ── Progression ────────────────────────────────────────────────
  function _updateProgress() {
    let total, curr, pct;
    if (mode === 'tryhard') {
      total = _thBatches.length;
      curr  = _thCycleNum + 1;
      pct   = Math.round(_thCycleNum / Math.max(1, total) * 100);
    } else if (mode === 'match') {
      total = Math.ceil(queue.length / 5);
      curr  = Math.floor(idx / 5) + 1;
      pct   = queue.length > 0 ? Math.round(idx / queue.length * 100) : 0;
    } else {
      total = queue.length;
      curr  = Math.min(idx + 1, total);
      pct   = queue.length > 0 ? Math.round(idx / queue.length * 100) : 0;
    }
    const fill  = _el('games-progress-fill');
    const cnt   = _el('games-count');
    const badge = _el('games-score-badge');
    if (fill)  fill.style.width = Math.min(100, pct) + '%';
    if (cnt)   cnt.textContent  = `${Math.min(curr, total)} / ${total}`;
    if (badge) badge.textContent = `${score.ok} ✓`;
  }

  // ── Helpers ────────────────────────────────────────────────────
  function _shuffle(arr)  { return [...arr].sort(() => Math.random() - .5); }
  function _norm(s)       { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function _el(id)        { return document.getElementById(id); }
  function _esc(s)        { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { start, selectMode, checkBlanks, answerTF, selectTerm, selectDef, nextMatch, checkTryhard, _thNextCycle, _thFinish, next, reset, populateCatSelect };
})();
