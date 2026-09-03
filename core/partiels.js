// core/partiels.js — Mode Partiels : révision par UE (référentiel 2026)
//  1) Quiz chronométré noté /20 (QCM, distracteurs via App.Distractor)
//  2) Entraînement rédigé + correction IA (Gemini)
//  3) Questions d'entraînement générées à la volée (Gemini)
'use strict';
window.App = window.App || {};

App.Partiels = (() => {
  const HIST_KEY   = 'ifsi_partiel_history';
  const QUIZ_SIZE  = 10;     // nb de questions max par quiz
  const QUIZ_SECS  = 40;     // secondes par question (budget total = QUIZ_SECS * nbQuestions)

  let _view    = 'home';     // home | ue | quiz | result
  let _curUE   = null;
  let _quiz    = null;       // { queue, idx, correct, timer, secsLeft, totalSecs, log }
  let _writing = { suggestions: [], correction: null };

  // ── Utilitaires ────────────────────────────────────────────────
  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _el(id) { return document.getElementById(id); }
  function _root()  { return _el('partiels-root'); }

  function _cardsForUE(code) {
    return App.Store.state.cards.filter(c => c.ue === code && !c.suspended);
  }

  function _history() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch(e) { return []; }
  }
  function _saveHistory(entry) {
    const h = _history();
    h.unshift(entry);
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 100)));
  }
  function _historyForUE(code) { return _history().filter(h => h.ue === code).slice(0, 5); }

  // ── Priorisation par coefficient (ECTS) ─────────────────────────
  // Plus l'UE pèse lourd dans la moyenne (ECTS élevés) et plus le dernier score
  // y est faible (ou inexistant), plus elle remonte en tête des priorités.
  function _priorityFactor(lastScore) {
    if (lastScore == null) return 1.15;                                   // jamais testée : risque inconnu sur une UE qui compte
    if (lastScore < 12)     return 1 + (12 - lastScore) / 12 * 0.8;       // jusqu'à ×1.8 à 0/20
    return 1 - Math.min(1, (lastScore - 12) / 8) * 0.5;                   // jusqu'à ×0.5 à 20/20 (déjà solide)
  }

  function _priorityList(limit = 5) {
    return App.UE.LIST.map(u => {
      const hist = _historyForUE(u.code);
      const lastScore = hist.length ? hist[0].score : null;
      const factor = _priorityFactor(lastScore);
      return { ue: u, lastScore, attempts: hist.length, score: u.ects * factor };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  }

  // ── Init / routage ───────────────────────────────────────────────
  function init() { _view = 'home'; render(); }

  function render() {
    const root = _root();
    if (!root) return;
    if      (_view === 'home')   root.innerHTML = _homeHTML();
    else if (_view === 'ue')     { root.innerHTML = _ueDetailHTML(); _paintSuggestions(); _paintCorrection(); }
    else if (_view === 'quiz')   root.innerHTML = _quizShellHTML();
    else if (_view === 'result') root.innerHTML = _resultHTML();
  }

  function backToHome() { _view = 'home'; render(); }

  function selectUE(code) {
    _curUE   = code;
    _writing = { suggestions: [], correction: null };
    _view = 'ue';
    render();
  }

  // ── Accueil : domaines A→E et leurs UE ─────────────────────────
  function _homeHTML() {
    const domains = App.UE.grouped();
    const allHist = _history();
    const avg = allHist.length ? (allHist.reduce((s,h)=>s+h.score,0) / allHist.length).toFixed(1) : null;

    const priorityHTML = _priorityList(5).map(p => {
      const dom = App.UE.domainInfo(p.ue.domain);
      const why = p.lastScore == null
        ? 'jamais testée'
        : `dernier score ${p.lastScore}/20`;
      return `<button class="partiel-prio-card" style="--ue-color:${dom.color}" onclick="App.Partiels.selectUE('${p.ue.code}')">
        <span class="partiel-prio-ects">${p.ue.ects} ECTS</span>
        <span class="partiel-prio-name"><strong>${p.ue.code}</strong> — ${_esc(p.ue.name)}</span>
        <span class="partiel-prio-why">${why}</span>
      </button>`;
    }).join('');

    const domainBlocks = domains.map(d => {
      const ueSorted = [...d.ues].sort((a, b) => b.ects - a.ects);
      const ueCards = ueSorted.map(u => {
        const n = _cardsForUE(u.code).length;
        const hist = _historyForUE(u.code);
        const lastScore = hist.length ? hist[0].score : null;
        return `<button class="partiel-ue-card" style="--ue-color:${d.color}" onclick="App.Partiels.selectUE('${u.code}')">
          <div class="partiel-ue-code">${u.code} <span class="partiel-ue-ects">${u.ects} ECTS</span></div>
          <div class="partiel-ue-name">${_esc(u.name)}</div>
          <div class="partiel-ue-meta">
            <span>${n} fiche${n>1?'s':''}</span>
            ${lastScore != null ? `<span class="partiel-ue-score">${lastScore}/20</span>` : ''}
          </div>
        </button>`;
      }).join('');
      return `<div class="partiel-domain" style="--ue-color:${d.color}">
        <div class="partiel-domain-title"><span class="partiel-domain-badge">${d.code}</span> ${_esc(d.name)}</div>
        <div class="partiel-ue-grid">${ueCards}</div>
      </div>`;
    }).join('');

    return `
      <div class="partiel-intro">
        <h2 style="margin:0 0 4px;font-size:1.3rem">📝 Partiels par UE</h2>
        <p style="margin:0;color:var(--gray-500);font-size:.85rem">Choisis une UE : quiz chronométré noté /20, entraînement rédigé corrigé par IA, ou questions générées à la volée.</p>
        ${avg ? `<div class="partiel-global-avg">Moyenne sur tes ${allHist.length} dernier(s) quiz : <strong>${avg}/20</strong></div>` : ''}
      </div>
      <div class="partiel-block partiel-priority-block">
        <h3>🎯 Priorité de révision <span class="partiel-priority-hint">(ECTS élevés + score faible ou UE jamais testée)</span></h3>
        <div class="partiel-prio-list">${priorityHTML}</div>
      </div>
      ${domainBlocks}
      <p class="partiel-tag-hint">💡 Une UE sans fiche ? Tague tes cartes depuis <em>Toutes les cartes → Sélectionner → Assigner UE</em>, ou entraîne-toi directement à l'écrit avec l'IA ci-dessus. Le total des UE ci-dessus représente ${App.UE.TOTAL_ECTS} ECTS académiques (hors stages).</p>
    `;
  }

  // ── Détail UE : actions quiz + écrit ────────────────────────────
  function _ueDetailHTML() {
    const u   = App.UE.byCode(_curUE);
    const dom = App.UE.domainInfo(u.domain);
    const n   = _cardsForUE(_curUE).length;
    const comps = App.UE.COMPETENCES.filter(c => c.ue === _curUE);
    const hist  = _historyForUE(_curUE);

    return `
      <button class="btn btn-ghost btn-sm" onclick="App.Partiels.backToHome()">← Toutes les UE</button>
      <div class="partiel-ue-header" style="--ue-color:${dom.color}">
        <span class="partiel-domain-badge">${u.code}</span>
        <div>
          <h2 style="margin:0;font-size:1.15rem">${_esc(u.name)}</h2>
          <p style="margin:2px 0 0;font-size:.8rem;color:var(--gray-500)">Domaine ${dom.code} — ${_esc(dom.name)} · <strong>${u.ects} ECTS</strong> sur ${App.UE.TOTAL_ECTS} (coefficient dans la moyenne du semestre)</p>
        </div>
      </div>
      ${comps.length ? `<div class="partiel-comp-list">${comps.map(c => `<span class="partiel-comp-chip" title="${_esc(c.name)}">${c.code}${c.nouvelle ? ' 🆕' : ''}</span>`).join('')}</div>` : ''}

      <div class="partiel-block">
        <h3>🧪 Quiz chronométré</h3>
        <p>${n} fiche${n>1?'s':''} taguée${n>1?'s':''} à cette UE.</p>
        ${n >= 4
          ? `<button class="btn btn-primary" onclick="App.Partiels.startQuiz()">Démarrer (${Math.min(n, QUIZ_SIZE)} questions, noté /20) →</button>`
          : `<p class="partiel-empty">Il faut au moins 4 fiches taguées pour lancer un quiz (${n} pour l'instant).</p>`}
        ${hist.length ? `<div class="partiel-hist">${hist.map(h => `<span class="partiel-hist-chip">${h.date} · ${h.score}/20</span>`).join('')}</div>` : ''}
      </div>

      <div class="partiel-block">
        <h3>✍️ Entraînement rédigé — correction IA</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-ghost btn-sm" onclick="App.Partiels.suggestQuestions()">🎲 Proposer des questions (IA)</button>
        </div>
        <div id="partiels-suggestions"></div>
        <div class="form-group">
          <label>Question</label>
          <textarea id="partiels-q-input" placeholder="Colle une question de cours/partiel, ou clique « Proposer des questions » ci-dessus…" style="min-height:70px"></textarea>
        </div>
        <div class="form-group">
          <label>Ta réponse</label>
          <textarea id="partiels-a-input" placeholder="Rédige ta réponse comme à l'examen…" style="min-height:140px"></textarea>
        </div>
        <button class="btn btn-primary" onclick="App.Partiels.correctWritten()">✅ Corriger avec l'IA</button>
        <div id="partiels-correction-result"></div>
      </div>
    `;
  }

  function _paintSuggestions() {
    const box = _el('partiels-suggestions');
    if (!box) return;
    if (!_writing.suggestions.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="partiel-suggestions">` + _writing.suggestions.map((s, i) => `
      <div class="partiel-suggestion-card">
        <div class="partiel-suggestion-q">${_esc(s.question)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
          <button class="btn btn-ghost btn-sm" onclick="App.Partiels.useSuggestion(${i})">Utiliser cette question</button>
          <button class="btn btn-ghost btn-sm" onclick="App.Partiels.toggleExpected(${i})">👁 Réponse attendue</button>
        </div>
        <div class="partiel-expected" id="partiel-expected-${i}" style="display:none">${_esc(s.reponse_attendue || '')}</div>
      </div>`).join('') + `</div>`;
  }

  function toggleExpected(i) {
    const el = _el('partiel-expected-' + i);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }

  function useSuggestion(i) {
    const s = _writing.suggestions[i];
    if (!s) return;
    const inp = _el('partiels-q-input');
    if (inp) { inp.value = s.question; inp.focus(); }
  }

  async function suggestQuestions() {
    const box = _el('partiels-suggestions');
    if (box) box.innerHTML = `<p class="partiel-loading">🔄 Génération de questions…</p>`;
    try {
      const ue = App.UE.byCode(_curUE);
      const qs = await App.AI.generatePracticeQuestions(App.UE.label(_curUE), 3);
      _writing.suggestions = qs;
      _paintSuggestions();
    } catch(e) {
      if (box) box.innerHTML = `<p class="partiel-error">❌ ${_esc(e.message)}</p>`;
    }
  }

  function _paintCorrection() {
    const box = _el('partiels-correction-result');
    if (!box) return;
    const c = _writing.correction;
    if (!c) { box.innerHTML = ''; return; }
    if (c.error) { box.innerHTML = `<p class="partiel-error">❌ ${_esc(c.error)}</p>`; return; }
    const noteColor = c.note == null ? 'var(--gray-400)' : c.note >= 12 ? '#16a34a' : c.note >= 8 ? '#f59e0b' : '#dc2626';
    box.innerHTML = `
      <div class="partiel-correction">
        <div class="partiel-correction-note" style="color:${noteColor}">${c.note != null ? c.note + ' / 20' : '— / 20'}</div>
        ${c.pointsForts.length ? `<div class="partiel-correction-sec"><strong>✅ Points forts</strong><ul>${c.pointsForts.map(p=>`<li>${_esc(p)}</li>`).join('')}</ul></div>` : ''}
        ${c.aAmeliorer.length ? `<div class="partiel-correction-sec"><strong>⚠️ À améliorer</strong><ul>${c.aAmeliorer.map(p=>`<li>${_esc(p)}</li>`).join('')}</ul></div>` : ''}
        ${c.manquant.length ? `<div class="partiel-correction-sec"><strong>➕ Éléments manquants</strong><ul>${c.manquant.map(p=>`<li>${_esc(p)}</li>`).join('')}</ul></div>` : ''}
        ${c.commentaire ? `<p class="partiel-correction-comment">${_esc(c.commentaire)}</p>` : ''}
      </div>`;
  }

  async function correctWritten() {
    const q = _el('partiels-q-input')?.value.trim();
    const a = _el('partiels-a-input')?.value.trim();
    if (!q || !a) { alert('Renseigne la question et ta réponse.'); return; }
    const box = _el('partiels-correction-result');
    if (box) box.innerHTML = `<p class="partiel-loading">🔄 Correction en cours…</p>`;
    try {
      _writing.correction = await App.AI.correctAnswer(q, a, App.UE.label(_curUE));
    } catch(e) {
      _writing.correction = { error: e.message };
    }
    _paintCorrection();
  }

  // ── Quiz chronométré ─────────────────────────────────────────────
  function startQuiz() {
    const pool = _cardsForUE(_curUE).sort(() => Math.random() - .5).slice(0, QUIZ_SIZE);
    if (pool.length < 4) return;
    const total = pool.length * QUIZ_SECS;
    _quiz = { queue: pool, idx: 0, correctCount: 0, log: [], totalSecs: total, secsLeft: total, timer: null };
    _view = 'quiz';
    render();
    _quizTick();
    _quiz.timer = setInterval(_quizTick, 1000);
    _showQuizQuestion();
  }

  function _quizShellHTML() {
    return `
      <div class="partiel-quiz-head">
        <button class="btn btn-ghost btn-sm" onclick="App.Partiels.abortQuiz()">✕ Abandonner</button>
        <div class="partiel-quiz-timer" id="partiel-quiz-timer">⏱ --:--</div>
        <div class="partiel-quiz-counter" id="partiel-quiz-counter"></div>
      </div>
      <div class="partiel-quiz-progress"><div class="partiel-quiz-progress-bar" id="partiel-quiz-progress-bar"></div></div>
      <div class="partiel-quiz-term" id="partiel-quiz-term"></div>
      <div class="partiel-quiz-choices" id="partiel-quiz-choices"></div>
    `;
  }

  function _quizTick() {
    if (!_quiz) return;
    _quiz.secsLeft = Math.max(0, _quiz.secsLeft - 1);
    const m = Math.floor(_quiz.secsLeft / 60), s = _quiz.secsLeft % 60;
    const t = _el('partiel-quiz-timer');
    if (t) { t.textContent = `⏱ ${m}:${String(s).padStart(2,'0')}`; t.style.color = _quiz.secsLeft < 20 ? '#dc2626' : ''; }
    if (_quiz.secsLeft <= 0) endQuiz();
  }

  function _showQuizQuestion() {
    if (!_quiz) return;
    if (_quiz.idx >= _quiz.queue.length) { endQuiz(); return; }
    const card = _quiz.queue[_quiz.idx];
    const counter = _el('partiel-quiz-counter');
    if (counter) counter.textContent = `${_quiz.idx + 1} / ${_quiz.queue.length}`;
    const bar = _el('partiel-quiz-progress-bar');
    if (bar) bar.style.width = (_quiz.idx / _quiz.queue.length * 100) + '%';
    const termEl = _el('partiel-quiz-term');
    if (termEl) termEl.textContent = card.term;

    const distractors = App.Distractor.pick(card, App.Store.state.cards, 3);
    const choices = [{ text: card.def, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]
      .sort(() => Math.random() - .5);
    const box = _el('partiel-quiz-choices');
    if (box) {
      box.innerHTML = choices.map((c, i) =>
        `<button class="partiel-choice" data-correct="${c.correct}" onclick="App.Partiels.answerQuiz(${i})">${_esc(c.text)}</button>`
      ).join('');
    }
  }

  function answerQuiz(i) {
    if (!_quiz) return;
    const btns = document.querySelectorAll('.partiel-choice');
    const btn  = btns[i];
    if (!btn || btn.disabled) return;
    btns.forEach(b => b.disabled = true);
    const correct = btn.dataset.correct === 'true';
    const corrBtn = Array.from(btns).find(b => b.dataset.correct === 'true');
    if (correct) { _quiz.correctCount++; btn.classList.add('partiel-choice-correct'); }
    else { btn.classList.add('partiel-choice-wrong'); if (corrBtn) corrBtn.classList.add('partiel-choice-correct'); }
    _quiz.log.push({ term: _quiz.queue[_quiz.idx].term, correct });
    setTimeout(() => { _quiz.idx++; _showQuizQuestion(); }, 700);
  }

  function abortQuiz() {
    if (_quiz?.timer) clearInterval(_quiz.timer);
    _quiz = null;
    _view = 'ue';
    render();
  }

  function endQuiz() {
    if (!_quiz) return;
    if (_quiz.timer) clearInterval(_quiz.timer);
    const total = _quiz.log.length || _quiz.queue.length || 1;
    const score = Math.round((_quiz.correctCount / total) * 20 * 10) / 10;
    _saveHistory({ date: new Date().toISOString().slice(0,10), ue: _curUE, score, total, correct: _quiz.correctCount });
    _quiz.finalScore = score;
    _view = 'result';
    render();
  }

  function _resultHTML() {
    const q = _quiz;
    if (!q) return `<p>Session terminée.</p>`;
    const color = q.finalScore >= 12 ? '#16a34a' : q.finalScore >= 8 ? '#f59e0b' : '#dc2626';
    const missed = q.log.filter(l => !l.correct);
    return `
      <div class="partiel-result">
        <div class="partiel-result-score" style="color:${color}">${q.finalScore} / 20</div>
        <p>${q.correctCount} / ${q.log.length} bonnes réponses — UE ${_esc(_curUE)}</p>
        ${missed.length ? `<div class="partiel-result-missed"><strong>À revoir :</strong><ul>${missed.map(m=>`<li>${_esc(m.term)}</li>`).join('')}</ul></div>` : '<p>🎉 Aucune erreur !</p>'}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
          <button class="btn btn-primary" onclick="App.Partiels.startQuiz()">↺ Recommencer</button>
          <button class="btn btn-ghost" onclick="App.Partiels.selectUE('${_curUE}')">← Retour à l'UE</button>
        </div>
      </div>`;
  }

  return {
    init, render, backToHome, selectUE,
    suggestQuestions, useSuggestion, toggleExpected, correctWritten,
    startQuiz, answerQuiz, abortQuiz
  };
})();
