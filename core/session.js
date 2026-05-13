// core/session.js — Logique de session (flip / écriture / QCM + SM-2 + "Again")
'use strict';
window.App = window.App || {};

App.Session = (() => {
  let current    = null;
  let mode       = 'flip';

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

    // Tri : J+1 en premier → autres révisions → nouvelles cartes
    function _cardPriority(c) {
      if (!c.progress) return 3;                    // nouvelle carte
      if (c.progress.repetitions <= 1) return 2;   // en apprentissage
      return 1;                                     // révision (J+x)
    }
    // Mélange à l'intérieur de chaque groupe, puis trie par priorité
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    cards.sort((a, b) => _cardPriority(a) - _cardPriority(b));
    current = { queue: [...cards], idx: 0, stats: { ok: 0, hard: 0, nope: 0, again: 0 }, startTime: Date.now(), afkPausedMs: 0, afkStart: null, cat: sessionLabel };
    App.UI.showView('session');
    _initAfkListeners();
    _resetAfkTimer();
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
    const newProgress = App.SRS.update(c, quality);
    const inState = App.Store.state.cards.find(x => x.id === c.id);
    if (inState) inState.progress = newProgress;
    App.Store.save();
    App.Store.logReview(quality);
    if      (quality >= 4)  current.stats.ok++;
    else if (quality === 3) { current.stats.hard++;  current.queue.push({ ...c }); }  // Difficile → repasse en fin de session
    else                  { current.stats.nope++; current.stats.again++; current.queue.push({ ...c }); } // Raté → idem
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
      if (elapsed > 0) App.Store.logSessionDuration(elapsed);
    }
    _stopAfkTimer();
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

  return { start, setMode, show, flip, verifyWrite, answer, end, resumeAfk, getCurrentCat: () => current?.cat };
})();
