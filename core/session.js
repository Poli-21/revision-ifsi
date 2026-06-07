// core/session.js — Logique de session (flip / écriture / QCM + SM-2 + "Again"t)
'use strict';
window.App = window.App || {};

App.Session = (() => {
  let current    = null;
  let mode       = 'flip';

  // ── Ticker sidebar "Session en cours" ─────────────────────────
  let _tickTimer = null;

  function _startTicker() {
    // Affiche la ligne sidebar
    const sideRow = document.getElementById('stat-session-row');
    if (sideRow) sideRow.style.display = 'flex';
    clearInterval(_tickTimer);
    _tickTimer = setInterval(() => {
      if (!current) { _stopTicker(); return; }
      const secs = Math.floor((Date.now() - current.startTime - (current.afkPausedMs || 0)) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      const txt = m + ':' + (s < 10 ? '0' : '') + s;
      // Timer dans la sidebar
      const sideEl = document.getElementById('stat-session-timer');
      if (sideEl) sideEl.textContent = txt;
      // Timer dans le header de session
      const chrono = document.getElementById('session-chrono');
      if (chrono) chrono.textContent = '⏱ ' + txt;
      // Grand affichage chrono libre
      const libreDisplay = document.getElementById('chrono-libre-display');
      if (libreDisplay) libreDisplay.textContent = txt;
    }, 1000);
  }

  function _stopTicker() {
    clearInterval(_tickTimer);
    _tickTimer = null;
    const sideRow = document.getElementById('stat-session-row');
    const sideEl  = document.getElementById('stat-session-timer');
    if (sideRow) sideRow.style.display = 'none';
    if (sideEl)  sideEl.textContent = '0:00';
    const chrono = document.getElementById('session-chrono');
    if (chrono) chrono.textContent = '⏱ 0:00';
  }

  // ── AFK ────────────────────────────────────────────────────────
  const AFK_MS   = 10 * 60 * 1000;  // 10 minutes d'inactivité
  let _afkTimer  = null;
  let _afkActive = false;

  function _resetAfkTimer() {
    clearTimeout(_afkTimer);
    if (_afkActive) _onAfkReturn();   // retour si on était AFK
    _afkTimer = setTimeout(_onAfkStart, AFK_MS);
  }

  function _onAfkStart() {
    if (!current) return;
    _afkActive = true;
    current.afkStart = Date.now();
    const el = document.getElementById('afk-banner');
    if (el) el.style.display = 'flex';
  }

  function _onAfkReturn() {
    if (!current || !_afkActive) return;
    _afkActive = false;
    if (current.afkStart) {
      current.afkPausedMs += Date.now() - current.afkStart;
      current.afkStart = null;
    }
    const el = document.getElementById('afk-banner');
    if (el) el.style.display = 'none';
  }

  function _stopAfkTimer() {
    clearTimeout(_afkTimer);
    _afkTimer  = null;
    _afkActive = false;
    const el = document.getElementById('afk-banner');
    if (el) el.style.display = 'none';
  }

  // Temps effectif travaillé (hors AFK)
  function _effectiveSecs() {
    if (!current) return 0;
    const raw    = Date.now() - current.startTime;
    const paused = current.afkPausedMs + (_afkActive && current.afkStart ? Date.now() - current.afkStart : 0);
    return Math.max(0, Math.round((raw - paused) / 1000));
  }

  // Attache les listeners AFK sur la vue session (clics, touches, scroll)
  function _initAfkListeners() {
    const zone = document.getElementById('session-view');
    if (!zone) return;
    const reset = () => { if (current) _resetAfkTimer(); };
    ['pointerdown','keydown','scroll'].forEach(evt =>
      zone.addEventListener(evt, reset, { passive: true })
    );
  }

  // ── Chrono libre (sans cartes) ─────────────────────────────────
  function startChrono() {
    current = {
      queue: [], idx: 0,
      stats: { ok: 0, hard: 0, nope: 0, again: 0 },
      startTime: Date.now(), afkPausedMs: 0, afkStart: null,
      cat: 'Chrono libre',
      chronoOnly: true
    };
    App.UI.showView('session');
    _initAfkListeners();
    _resetAfkTimer();
    _startTicker();
    show();
  }

  // ── Démarrage ──────────────────────────────────────────────────
  function start(cat) {
    const { state } = App.Store;
    let cards = state.cards.filter(c => App.SRS.isDue(c));
    let sessionLabel = '';
    // cat peut être : undefined (tout), string (une matière), ou tableau (plusieurs)
    if (Array.isArray(cat) && cat.length > 0) {
      cards = cards.filter(c => cat.includes(c.cat));
      sessionLabel = cat.join(', ');
    } else {
      const targetCat = (cat !== undefined && cat !== null) ? cat : App.UI.activeCategory;
      if (targetCat) cards = cards.filter(c => c.cat === targetCat);
      sessionLabel = targetCat || '';
    }
    if (!cards.length) { alert('Aucune carte à réviser pour le moment ! 🎉'); return; }

    // Tri : cartes à risque exam → révisions → apprentissage → nouvelles
    const exams = (() => { try { return JSON.parse(localStorage.getItem('ifsi_exams_v2')||'[]'); } catch(e){return[];} })();
    const todayStr2 = new Date().toISOString().slice(0,10);
    const nextExam  = exams.filter(e => e.date >= todayStr2).sort((a,b) => a.date.localeCompare(b.date))[0];
    function _cardPriority(c) {
      if (nextExam && (!c.progress || (c.progress?.nextReview || todayStr2) <= nextExam.date)) return 0;
      if (!c.progress) return 3;
      if (c.progress.repetitions <= 1) return 2;
      return 1;
    }
    // ── Tri : fragiles (<30J) groupés par chapitre, maîtrisés (≥30J) mélangés ──
    const MASTERED_DAYS = 30;
    function _shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    // Cartes à risque exam → restent en tête, mélangées entre elles
    const examRisk = cards.filter(c => _cardPriority(c) === 0);
    const rest     = cards.filter(c => _cardPriority(c) !== 0);
    // Fragiles = jamais vues ou intervalle < 30J → groupées par matière
    const fragile  = rest.filter(c => !c.progress || (c.progress.interval || 0) < MASTERED_DAYS);
    const mastered = rest.filter(c => c.progress && (c.progress.interval || 0) >= MASTERED_DAYS);
    // Fragiles : groupées par cat, mélangées dans chaque groupe, ordre des groupes mélangé
    const catGroups = {};
    fragile.forEach(c => { (catGroups[c.cat] = catGroups[c.cat] || []).push(c); });
    const fragileOrdered = _shuffle(Object.values(catGroups).map(_shuffle)).flat();
    // Maîtrisées : mélangées librement
    _shuffle(mastered);
    cards = [..._shuffle(examRisk), ...fragileOrdered, ...mastered];
    current = { queue: [...cards], idx: 0, stats: { ok: 0, hard: 0, nope: 0, again: 0 }, startTime: Date.now(), afkPausedMs: 0, afkStart: null, cat: sessionLabel };
    App.UI.showView('session');
    _initAfkListeners();
    _resetAfkTimer();
    _startTicker();
    show();
  }

  function setMode(m) {
    mode = m;
    ['flip','write','qcm'].forEach(id => {
      const b = document.getElementById('mode-' + id);
      if (b) b.classList.toggle('active', id === m);
    });
    if (current) show();
  }

  // ── Affichage carte courante ────────────────────────────────────
  function show() {
    if (!current) return;
    document.getElementById('card-container').style.display  = 'none';
    document.getElementById('answer-btns').style.display     = 'none';
    document.getElementById('write-zone').style.display      = 'none';
    document.getElementById('qcm-zone').style.display        = 'none';
    document.getElementById('write-answer-btns').style.display = 'none';
    document.getElementById('session-done').style.display    = 'none';
    const chronoZone = document.getElementById('chrono-libre-zone');
    if (chronoZone) chronoZone.style.display = 'none';
    // Mode chrono libre : pas de cartes, juste le timer
    if (current.chronoOnly) {
      if (chronoZone) chronoZone.style.display = 'flex';
      // Cache barre de progression et boutons de mode
      const prog = document.querySelector('.session-progress-bar');
      if (prog) prog.style.visibility = 'hidden';
      const count = document.getElementById('session-count');
      if (count) count.textContent = 'Chrono libre';
      return;
    }
    // Restaure la barre de progression si on revient en mode normal
    const prog = document.querySelector('.session-progress-bar');
    if (prog) prog.style.visibility = 'visible';
    if (current.idx >= current.queue.length) { showDone(); return; }
    const c     = current.queue[current.idx];
    const total = current.queue.length;
    document.getElementById('session-progress-fill').style.width = `${current.idx / total * 100}%`;
    document.getElementById('session-count').textContent = `${current.idx + 1} / ${total}`;
    if      (mode === 'flip')  showFlip(c);
    else if (mode === 'write') showWrite(c);
    else                       showQCM(c);
  }

  // ── Mode Flip ──────────────────────────────────────────────────
  function showFlip(c) {
    const fc = document.getElementById('flashcard');
    // Désactive la transition le temps du reset pour éviter de voir la réponse
    fc.style.transition = 'none';
    fc.classList.remove('flipped');
    fc.offsetHeight; // force le reflow
    fc.style.transition = '';
    fc.style.height = '';
    document.getElementById('card-container').style.display = 'block';
    document.getElementById('answer-btns').style.display    = 'none';
    document.getElementById('card-cat').textContent      = c.cat;
    document.getElementById('card-cat-back').textContent = c.cat;
    document.getElementById('card-term').textContent     = c.term;
    document.getElementById('card-def').textContent      = c.def;
    const ex = document.getElementById('card-example');
    if (c.example) { ex.textContent = c.example; ex.style.display = 'block'; }
    else ex.style.display = 'none';
    const img = resolveImg(c);
    setCardImages(img);
    updateIntervalPreviews(c, ['int-nope','int-hard','int-ok','int-easy'], [0,3,4,5]);
    document.getElementById('card-hint').style.display = 'block';
    setTimeout(() => {
      const h = Math.max(document.getElementById('card-front-face').scrollHeight,
                         document.getElementById('card-back-face').scrollHeight, 300);
      fc.style.height = h + 'px';
    }, 40);
  }

  function flip() {
    const fc = document.getElementById('flashcard');
    if (!fc.classList.contains('flipped')) {
      fc.classList.add('flipped');
      document.getElementById('card-hint').style.display = 'none';
      document.getElementById('answer-btns').style.display = 'flex';
    }
  }

  // ── Mode Écriture ──────────────────────────────────────────────
  function showWrite(c) {
    document.getElementById('write-zone').style.display = 'block';
    document.getElementById('wcat').textContent  = c.cat;
    document.getElementById('wterm').textContent = c.term;
    const wimg = document.getElementById('wimage');
    const img  = resolveImg(c);
    if (img) {
      wimg.innerHTML   = img.type === 'svg' ? img.content : `<img src="${img.content}" style="max-height:290px;max-width:100%;object-fit:contain;border-radius:6px">`;
      wimg.style.display = 'flex';
    } else { wimg.style.display = 'none'; }
    const winput = document.getElementById('write-input');
    winput.value    = '';
    winput.disabled = false;
    document.getElementById('write-reveal').style.display        = 'none';
    document.getElementById('write-answer-btns').style.display   = 'none';
    document.querySelector('#write-zone .write-verify-btn').style.display = 'block';
    updateIntervalPreviews(c, ['wint-nope','wint-hard','wint-ok','wint-easy'], [0,3,4,5]);

    // Auto-validation si < 4 mots quand on appuie sur Entrée
    winput.onkeydown = function(e) {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        const words = winput.value.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0 && words.length < 4) {
          e.preventDefault();
          verifyWrite();
        }
      }
    };

    winput.focus();
  }

  function verifyWrite() {
    const c = current.queue[current.idx];
    const userAns = document.getElementById('write-input').value.trim();
    if (!userAns) { document.getElementById('write-input').focus(); return; }
    document.getElementById('write-input').disabled = true;
    document.getElementById('write-user-ans').textContent    = userAns;
    document.getElementById('write-correct-def').textContent = c.def;
    const wex = document.getElementById('write-correct-ex');
    if (c.example) { wex.textContent = c.example; wex.style.display = 'block'; }
    else wex.style.display = 'none';
    document.getElementById('write-reveal').style.display      = 'block';
    document.getElementById('write-answer-btns').style.display = 'flex';
    document.querySelector('#write-zone .write-verify-btn').style.display = 'none';
    document.getElementById('write-reveal').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Mode QCM ───────────────────────────────────────────────────
  function showQCM(c) {
    document.getElementById('qcm-zone').style.display = 'block';
    document.getElementById('qcm-cat').textContent      = c.cat;
    document.getElementById('qcm-question').textContent = c.term;
    const img = resolveImg(c);
    const qimg = document.getElementById('qcm-image');
    if (img) {
      qimg.innerHTML = img.type === 'svg' ? img.content : `<img src="${img.content}" style="max-height:150px;max-width:100%;object-fit:contain">`;
      qimg.style.display = 'flex';
    } else { qimg.style.display = 'none'; }
    const { cards } = App.Store.state;
    // Distracteurs intelligents via App.Distractor
    const distractorDefs = App.Distractor.pick(c, cards, 3);
    const choices = [
      { def: c.def, correct: true },
      ...distractorDefs.map(def => ({ def, correct: false }))
    ].sort(() => Math.random() - 0.5);
    const container = document.getElementById('qcm-choices');
    container.innerHTML = '';
    container.dataset.answered = 'false';
    choices.forEach(({ def, correct }) => {
      const btn = document.createElement('button');
      btn.className     = 'qcm-choice';
      btn.textContent   = def.length > 110 ? def.slice(0, 107) + '…' : def;
      btn.dataset.correct = correct ? '1' : '0';
      btn.onclick = () => {
        if (container.dataset.answered === 'true') return;
        container.dataset.answered = 'true';
        container.querySelectorAll('.qcm-choice').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === '1') b.classList.add('qcm-correct');
        });
        btn.classList.add(correct ? 'qcm-correct' : 'qcm-wrong');
        setTimeout(() => answer(correct ? 4 : 0), correct ? 500 : 1100);
      };
      container.appendChild(btn);
    });
  }

  // ── Réponse & SRS ──────────────────────────────────────────────
  function answer(quality) {
    if (!current) return;
    const c = current.queue[current.idx];

    if (current.isPractice) {
      // Mode pratique (prép exam) : pas de mise à jour SRS, juste le score
      if      (quality >= 4)  current.stats.ok++;
      else if (quality === 3) { current.stats.hard++;  current.queue.push({ ...c }); }
      else                    { current.stats.nope++; current.stats.again++; current.queue.push({ ...c }); }
    } else {
      // Mode normal : mise à jour SRS complète
      const newProgress = App.SRS.update(c, quality);
      const inState = App.Store.state.cards.find(x => x.id === c.id);
      if (inState) inState.progress = newProgress;
      App.Store.save();
      App.Store.logReview(quality);
      if      (quality >= 4)  current.stats.ok++;
      else if (quality === 3) { current.stats.hard++;  current.queue.push({ ...c }); }
      else                    { current.stats.nope++; current.stats.again++; current.queue.push({ ...c }); }
    }
    current.idx++;
    show();
  }

  // ── Fin de session ─────────────────────────────────────────────
  function showDone() {
    _stopAfkTimer();
    const elapsed  = _effectiveSecs();
    const total    = current.stats.ok + current.stats.hard + current.stats.nope;
    const accuracy = total > 0 ? Math.round(current.stats.ok / total * 100) : 0;
    document.getElementById('session-done').style.display = 'block';
    document.getElementById('done-ok').textContent       = current.stats.ok;
    document.getElementById('done-hard').textContent     = current.stats.hard;
    document.getElementById('done-nope').textContent     = current.stats.nope;
    document.getElementById('done-accuracy').textContent = accuracy + '%';
    App.Store.logSessionDuration(elapsed);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    document.getElementById('done-time').textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
    document.getElementById('session-progress-fill').style.width = '100%';
    App.Render.all();
  }

  function end() {
    if (current) {
      const elapsed = _effectiveSecs();
      // On log le temps même en mode chrono libre
      if (elapsed > 0) App.Store.logSessionDuration(elapsed);
    }
    // Restaure la barre de progression si elle était cachée
    const prog = document.querySelector('.session-progress-bar');
    if (prog) prog.style.visibility = 'visible';
    _stopAfkTimer();
    _stopTicker();
    current = null;
    App.UI.showView('home');
    App.Render.all();
  }

  // ── Utilitaires internes ───────────────────────────────────────
  function resolveImg(c) {
    if (c.image && App.SVG[c.image]) return { type: 'svg', content: App.SVG[c.image] };
    if (c.customImage)               return { type: 'photo', content: c.customImage };
    return null;
  }

  function setCardImages(img) {
    ['card-img-front','card-img-back'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (img) {
        el.innerHTML    = img.type === 'svg' ? img.content : `<img src="${img.content}" style="max-height:310px;max-width:100%;object-fit:contain;border-radius:6px">`;
        el.style.display = 'flex';
      } else { el.style.display = 'none'; }
    });
    document.getElementById('card-front-face').classList.toggle('has-image', !!img);
    document.getElementById('card-back-face').classList.toggle('has-image',  !!img);
  }

  function updateIntervalPreviews(card, ids, qualities) {
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `→ J+${App.SRS.previewInterval(card, qualities[i])}`;
    });
  }

  function resumeAfk() { _resetAfkTimer(); }


  function startWithCards(cards, label) {
    if (!cards || !cards.length) { alert('Aucune carte à réviser pour le moment ! 🎉'); return; }
    // Applique le même tri : fragiles par chapitre, maîtrisés mélangés
    const MASTERED_DAYS = 30;
    function _shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    const fragile  = cards.filter(c => !c.progress || (c.progress.interval || 0) < MASTERED_DAYS);
    const mastered = cards.filter(c => c.progress && (c.progress.interval || 0) >= MASTERED_DAYS);
    const catGroups = {};
    fragile.forEach(c => { (catGroups[c.cat] = catGroups[c.cat] || []).push(c); });
    const fragileOrdered = _shuffle(Object.values(catGroups).map(_shuffle)).flat();
    _shuffle(mastered);
    const queue = [...fragileOrdered, ...mastered];
    current = { queue, idx: 0, stats: { ok: 0, hard: 0, nope: 0, again: 0 }, startTime: Date.now(), afkPausedMs: 0, afkStart: null, cat: label || '' };
    App.UI.showView('session');
    _initAfkListeners();
    _resetAfkTimer();
    _startTicker();
    show();
  }

  return { start, startChrono, startWithCards, show, end, setMode, answer, resumeAfk };
})();
