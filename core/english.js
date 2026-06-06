// core/english.js — Mode Duolingo Anglais IFSI
'use strict';
window.App = window.App || {};

App.English = (() => {

  // ── Vocabulaire IFSI ───────────────────────────────────────────
  const LESSONS = [
    {
      id: 1, name: 'Les essentiels', emoji: '🏥',
      words: [
        { en: 'nurse',        fr: 'infirmier / infirmière', ph: '/nɜːrs/' },
        { en: 'patient',      fr: 'patient(e)',              ph: '/ˈpeɪʃənt/' },
        { en: 'doctor',       fr: 'médecin',                 ph: '/ˈdɒktər/' },
        { en: 'hospital',     fr: 'hôpital',                 ph: '/ˈhɒspɪtəl/' },
        { en: 'ward',         fr: 'service / unité de soins',ph: '/wɔːrd/' },
        { en: 'care',         fr: 'soin',                    ph: '/keər/' },
        { en: 'assessment',   fr: 'évaluation / bilan',      ph: '/əˈsesmənt/' },
        { en: 'prescription', fr: 'ordonnance',              ph: '/prɪˈskrɪpʃən/' },
      ]
    },
    {
      id: 2, name: 'Corps humain', emoji: '🫀',
      words: [
        { en: 'heart',   fr: 'cœur',                  ph: '/hɑːrt/' },
        { en: 'lung',    fr: 'poumon',                 ph: '/lʌŋ/' },
        { en: 'kidney',  fr: 'rein',                   ph: '/ˈkɪdni/' },
        { en: 'liver',   fr: 'foie',                   ph: '/ˈlɪvər/' },
        { en: 'brain',   fr: 'cerveau',                ph: '/breɪn/' },
        { en: 'spine',   fr: 'colonne vertébrale',     ph: '/spaɪn/' },
        { en: 'vein',    fr: 'veine',                  ph: '/veɪn/' },
        { en: 'artery',  fr: 'artère',                 ph: '/ˈɑːrtəri/' },
      ]
    },
    {
      id: 3, name: 'Signes vitaux', emoji: '📊',
      words: [
        { en: 'blood pressure',      fr: 'tension artérielle',       ph: '/blʌd ˈpreʃər/' },
        { en: 'heart rate',          fr: 'fréquence cardiaque',      ph: '/hɑːrt reɪt/' },
        { en: 'temperature',         fr: 'température',              ph: '/ˈtemprətʃər/' },
        { en: 'oxygen saturation',   fr: 'saturation en oxygène',    ph: '/ˈɒksɪdʒən sætʃəˈreɪʃən/' },
        { en: 'respiratory rate',    fr: 'fréquence respiratoire',   ph: '/rɪˈspɪrətɔːri reɪt/' },
        { en: 'pulse',               fr: 'pouls',                    ph: '/pʌls/' },
        { en: 'fever',               fr: 'fièvre',                   ph: '/ˈfiːvər/' },
        { en: 'hypotension',         fr: 'hypotension',              ph: '/ˌhaɪpəˈtenʃən/' },
      ]
    },
    {
      id: 4, name: 'Symptômes', emoji: '🤒',
      words: [
        { en: 'pain',               fr: 'douleur',                      ph: '/peɪn/' },
        { en: 'nausea',             fr: 'nausée',                       ph: '/ˈnɔːziə/' },
        { en: 'dizziness',          fr: 'vertige / étourdissement',     ph: '/ˈdɪzinəs/' },
        { en: 'shortness of breath',fr: 'dyspnée / essoufflement',      ph: '/ˈʃɔːrtnəs əv breθ/' },
        { en: 'swelling',           fr: 'gonflement / œdème',           ph: '/ˈswelɪŋ/' },
        { en: 'rash',               fr: 'éruption cutanée',             ph: '/ræʃ/' },
        { en: 'bleeding',           fr: 'saignement / hémorragie',      ph: '/ˈbliːdɪŋ/' },
        { en: 'unconscious',        fr: 'inconscient(e)',                ph: '/ʌnˈkɒnʃəs/' },
      ]
    },
    {
      id: 5, name: 'Soins infirmiers', emoji: '💉',
      words: [
        { en: 'administer', fr: 'administrer',                ph: '/ədˈmɪnɪstər/' },
        { en: 'injection',  fr: 'injection / piqûre',         ph: '/ɪnˈdʒekʃən/' },
        { en: 'catheter',   fr: 'cathéter',                   ph: '/ˈkæθɪtər/' },
        { en: 'dressing',   fr: 'pansement',                  ph: '/ˈdresɪŋ/' },
        { en: 'infusion',   fr: 'perfusion',                  ph: '/ɪnˈfjuːʒən/' },
        { en: 'monitoring', fr: 'surveillance / monitorage',  ph: '/ˈmɒnɪtərɪŋ/' },
        { en: 'discharge',  fr: 'sortie / congé (médical)',   ph: '/dɪsˈtʃɑːrdʒ/' },
        { en: 'consent',    fr: 'consentement',               ph: '/kənˈsent/' },
      ]
    },
    {
      id: 6, name: 'Médicaments', emoji: '💊',
      words: [
        { en: 'antibiotic',    fr: 'antibiotique',              ph: '/ˌæntɪbaɪˈɒtɪk/' },
        { en: 'analgesic',     fr: 'analgésique / antidouleur', ph: '/ˌænəlˈdʒiːzɪk/' },
        { en: 'anticoagulant', fr: 'anticoagulant',             ph: '/ˌæntɪkəʊˈæɡjʊlənt/' },
        { en: 'dosage',        fr: 'posologie / dose',          ph: '/ˈdəʊsɪdʒ/' },
        { en: 'side effect',   fr: 'effet secondaire',          ph: '/saɪd ɪˈfekt/' },
        { en: 'allergy',       fr: 'allergie',                  ph: '/ˈælərdʒi/' },
        { en: 'overdose',      fr: 'surdosage / overdose',      ph: '/ˈəʊvərˌdəʊs/' },
        { en: 'intravenous',   fr: 'intraveineux',              ph: '/ˌɪntrəˈviːnəs/' },
      ]
    },
    {
      id: 7, name: 'Urgences', emoji: '🚨',
      words: [
        { en: 'cardiac arrest',  fr: 'arrêt cardiaque',                    ph: '/ˈkɑːrdiæk əˈrest/' },
        { en: 'CPR',             fr: 'réanimation cardio-pulmonaire (RCP)', ph: '/siː piː ɑːr/' },
        { en: 'stroke',          fr: 'AVC (accident vasculaire cérébral)',  ph: '/strəʊk/' },
        { en: 'trauma',          fr: 'traumatisme',                         ph: '/ˈtrɔːmə/' },
        { en: 'triage',          fr: 'triage',                              ph: '/ˈtriːɑːʒ/' },
        { en: 'resuscitation',   fr: 'réanimation',                         ph: '/rɪˌsʌsɪˈteɪʃən/' },
        { en: 'defibrillator',   fr: 'défibrillateur',                      ph: '/dɪˈfɪbrɪleɪtər/' },
        { en: 'shock',           fr: 'état de choc',                        ph: '/ʃɒk/' },
      ]
    },
    {
      id: 8, name: 'Communication', emoji: '💬',
      words: [
        { en: 'Are you in pain?',                     fr: 'Avez-vous mal ?',                                    ph: '' },
        { en: 'Take a deep breath.',                  fr: 'Respirez profondément.',                             ph: '' },
        { en: 'Do you have any allergies?',           fr: 'Avez-vous des allergies ?',                          ph: '' },
        { en: 'I need to take your blood pressure.',  fr: 'Je dois prendre votre tension.',                     ph: '' },
        { en: 'How are you feeling?',                 fr: 'Comment vous sentez-vous ?',                         ph: '' },
        { en: 'You need to rest.',                    fr: 'Vous devez vous reposer.',                           ph: '' },
        { en: 'The doctor will see you shortly.',     fr: 'Le médecin vous verra bientôt.',                     ph: '' },
        { en: 'Please call if you need anything.',    fr: 'Appelez si vous avez besoin de quoi que ce soit.',  ph: '' },
      ]
    },
  ];

  const STORAGE_KEY = 'ifsi_english_progress';
  let _progress = {};
  let _game = null;

  // ── Persistance ────────────────────────────────────────────────
  function _loadProgress() {
    try { _progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { _progress = {}; }
  }
  function _saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_progress));
    if (window.App?.Sync) App.Sync.pushDebounced();
  }

  function _el(id) { return document.getElementById(id); }
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init / Accueil ─────────────────────────────────────────────
  function init() {
    _loadProgress();
    showHome();
  }

  function showHome() {
    _game = null;
    _el('english-home').style.display   = 'block';
    _el('english-game').style.display   = 'none';
    _el('english-result').style.display = 'none';
    _renderHome();
  }

  function _renderHome() {
    const grid = _el('english-lessons-grid');
    if (!grid) return;

    const totalXP = Object.values(_progress).reduce((s, p) => s + (p.xp || 0), 0);
    const xpEl = _el('english-total-xp');
    if (xpEl) xpEl.textContent = totalXP + ' XP';

    let html = '';
    LESSONS.forEach((lesson, i) => {
      const prog    = _progress[lesson.id] || { stars: 0, xp: 0 };
      const prevOk  = i === 0 || (_progress[LESSONS[i - 1].id]?.stars || 0) > 0;
      const locked  = !prevOk;
      const stars   = prog.stars || 0;
      const starsHtml = '⭐'.repeat(stars) + '<span style="opacity:.25">⭐</span>'.repeat(3 - stars);

      html += `<div class="eng-lesson-card${locked ? ' eng-locked' : ''}${stars > 0 ? ' eng-completed' : ''}"
        ${locked ? '' : `onclick="App.English.startLesson(${lesson.id})"`}
        title="${locked ? 'Termine la leçon précédente pour débloquer' : lesson.name}">
        <div class="eng-lesson-emoji">${locked ? '🔒' : lesson.emoji}</div>
        <div class="eng-lesson-name">${_esc(lesson.name)}</div>
        <div class="eng-lesson-stars">${locked ? '' : starsHtml}</div>
        ${prog.xp ? `<div class="eng-lesson-xp">+${prog.xp} XP</div>` : ''}
      </div>`;
    });
    grid.innerHTML = html;
  }

  // ── Démarrage leçon ────────────────────────────────────────────
  function startLesson(id) {
    _loadProgress();
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return;

    _game = {
      lessonId : id,
      lesson,
      queue    : _buildQueue(lesson.words),
      idx      : 0,
      hearts   : 3,
      xp       : 0,
      answered : false,
      failed   : false
    };

    _el('english-home').style.display   = 'none';
    _el('english-game').style.display   = 'block';
    _el('english-result').style.display = 'none';
    _showQuestion();
  }

  // ── Construction de la file ────────────────────────────────────
  // ~12 questions pour 8 mots : 8 EN→FR + 4 FR→EN mélangés
  function _buildQueue(words) {
    const q = [];
    words.forEach(w => q.push({ type: 'mc_en_fr', word: w }));
    [...words].sort(() => Math.random() - 0.5).slice(0, 4)
              .forEach(w => q.push({ type: 'mc_fr_en', word: w }));
    // Shuffle
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  }

  // ── Distracteurs ───────────────────────────────────────────────
  function _getDistractors(word, count) {
    const all = LESSONS.flatMap(l => l.words).filter(w => w.en !== word.en);
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ── Affichage question ─────────────────────────────────────────
  function _showQuestion() {
    if (!_game) return;
    const { queue, idx, hearts, xp } = _game;
    _game.answered = false;

    // Barre de progression
    const fill = _el('eng-progress-fill');
    if (fill) fill.style.width = (idx / queue.length * 100) + '%';

    // Cœurs
    _updateHearts(hearts);

    // XP
    const xpEl = _el('eng-xp');
    if (xpEl) xpEl.textContent = xp + ' XP';

    // Cache feedback
    const fb = _el('eng-feedback');
    if (fb) { fb.style.display = 'none'; fb.className = 'eng-feedback'; }

    // Fin de leçon ?
    if (idx >= queue.length) { _endLesson(false); return; }

    const q    = queue[idx];
    const word = q.word;

    // Choix (3 mauvais + 1 correct)
    const distractors = _getDistractors(word, 3);

    const promptEl   = _el('eng-prompt-label');
    const wordEl     = _el('eng-word');
    const phoneticEl = _el('eng-phonetic');
    const choicesEl  = _el('eng-choices');

    if (q.type === 'mc_en_fr') {
      if (promptEl)   promptEl.textContent  = 'Que signifie ce mot en français ?';
      if (wordEl)   { wordEl.textContent    = word.en; wordEl.lang = 'en'; }
      if (phoneticEl) phoneticEl.textContent = word.ph || '';

      const choices = [
        { label: word.fr, correct: true },
        ...distractors.map(d => ({ label: d.fr, correct: false }))
      ].sort(() => Math.random() - 0.5);

      if (choicesEl) choicesEl.innerHTML = _renderChoices(choices);

    } else { // mc_fr_en
      if (promptEl)   promptEl.textContent  = 'Comment dit-on en anglais ?';
      if (wordEl)   { wordEl.textContent    = word.fr; wordEl.lang = 'fr'; }
      if (phoneticEl) phoneticEl.textContent = '';

      const choices = [
        { label: word.en, correct: true },
        ...distractors.map(d => ({ label: d.en, correct: false }))
      ].sort(() => Math.random() - 0.5);

      if (choicesEl) choicesEl.innerHTML = _renderChoices(choices);
    }
  }

  function _renderChoices(choices) {
    return choices.map((c, i) =>
      `<button class="eng-choice" data-correct="${c.correct}" data-idx="${i}"
        onclick="App.English.pickChoice(${i})">${_esc(c.label)}</button>`
    ).join('');
  }

  // ── Réponse ────────────────────────────────────────────────────
  function pickChoice(choiceIdx) {
    if (!_game || _game.answered) return;
    _game.answered = true;

    const btns = document.querySelectorAll('.eng-choice');
    const btn  = btns[choiceIdx];
    if (!btn) return;

    const correct    = btn.dataset.correct === 'true';
    const correctBtn = Array.from(btns).find(b => b.dataset.correct === 'true');

    btns.forEach(b => b.disabled = true);

    if (correct) {
      btn.classList.add('eng-choice-correct');
      _game.xp += 10;
      _soundCorrect();
      _showFeedback(true, '');
    } else {
      btn.classList.add('eng-choice-wrong');
      if (correctBtn) correctBtn.classList.add('eng-choice-correct');
      _game.hearts = Math.max(0, _game.hearts - 1);
      _soundWrong();
      _updateHearts(_game.hearts);
      const correctLabel = correctBtn?.textContent || '';
      _showFeedback(false, correctLabel);

      if (_game.hearts === 0) {
        setTimeout(() => _endLesson(true), 1400);
        return;
      }
    }
  }

  function _updateHearts(n) {
    const el = _el('eng-hearts');
    if (!el) return;
    el.innerHTML = '❤️'.repeat(n) + `<span style="opacity:.25">❤️</span>`.repeat(3 - n);
  }

  function _showFeedback(correct, correctAnswer) {
    const fb     = _el('eng-feedback');
    const fbText = _el('eng-feedback-text');
    if (!fb || !fbText) return;

    fb.style.display = 'flex';
    fb.className = 'eng-feedback ' + (correct ? 'eng-feedback-correct' : 'eng-feedback-wrong');

    if (correct) {
      const msgs = ['Parfait ! 🎉', 'Excellent ! 🌟', 'Bravo ! 👏', 'Super ! ✨'];
      fbText.innerHTML = `<strong>${msgs[Math.floor(Math.random() * msgs.length)]}</strong>`;
    } else {
      fbText.innerHTML = `<strong>Bonne réponse :</strong> ${_esc(correctAnswer)}`;
    }
  }

  // ── Continuer après feedback ───────────────────────────────────
  function continueQ() {
    if (!_game) return;
    _game.idx++;
    _showQuestion();
  }

  // ── Fin de leçon ───────────────────────────────────────────────
  function _endLesson(failed) {
    const { lessonId, hearts, xp } = _game;
    const stars = failed ? 0 : (hearts >= 3 ? 3 : hearts >= 2 ? 2 : 1);

    if (!failed) {
      const prev = _progress[lessonId] || { stars: 0, xp: 0 };
      _progress[lessonId] = {
        stars : Math.max(prev.stars, stars),
        xp    : (prev.xp || 0) + xp
      };
      _saveProgress();
    }

    _el('english-game').style.display   = 'none';
    _el('english-result').style.display = 'flex';

    const titleEl = _el('eng-result-title');
    const starsEl = _el('eng-result-stars');
    const xpEl    = _el('eng-result-xp');

    if (failed) {
      if (titleEl) titleEl.textContent = 'Dommage... 💔';
      if (starsEl) starsEl.innerHTML   = '<span style="font-size:2rem">💔💔💔</span>';
      if (xpEl)    xpEl.textContent    = 'Plus de vies ! Réessaie pour gagner des étoiles.';
    } else {
      const msgs = ['Leçon terminée !', 'Bien joué !', 'Excellent !', 'Tu gères !'];
      if (titleEl) titleEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      if (starsEl) starsEl.innerHTML   = '⭐'.repeat(stars) + '<span style="opacity:.25">⭐</span>'.repeat(3 - stars);
      if (xpEl)    xpEl.innerHTML      = `<span style="color:#f59e0b;font-weight:800;font-size:1.3rem">+${xp} XP</span> gagnés !`;
    }

    _game.failed = failed;
  }

  // ── Sons ───────────────────────────────────────────────────────
  function _soundCorrect() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }
  function _soundWrong() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
  }

  // ── Actions publiques ──────────────────────────────────────────
  function replay() {
    if (!_game) return;
    startLesson(_game.lessonId);
  }

  function quitLesson() { showHome(); }

  return { init, showHome, startLesson, pickChoice, continueQ, replay, quitLesson };
})();
