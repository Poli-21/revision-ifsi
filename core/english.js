// core/english.js — Mode Duolingo Anglais IFSI v2
'use strict';
window.App = window.App || {};

App.English = (() => {

  // ══════════════════════════════════════════════════════════════
  //  VOCABULAIRE — 12 leçons × 8 mots = 96 mots IFSI
  // ══════════════════════════════════════════════════════════════
  const LESSONS = [
    { id:1, name:'Les essentiels', emoji:'🏥', words:[
      { en:'nurse',        fr:'infirmier / infirmière',   ph:'/nɜːrs/' },
      { en:'patient',      fr:'patient(e)',               ph:'/ˈpeɪʃənt/' },
      { en:'doctor',       fr:'médecin',                  ph:'/ˈdɒktər/' },
      { en:'hospital',     fr:'hôpital',                  ph:'/ˈhɒspɪtəl/' },
      { en:'ward',         fr:'service / unité de soins', ph:'/wɔːrd/' },
      { en:'care',         fr:'soin / prise en charge',   ph:'/keər/' },
      { en:'assessment',   fr:'évaluation / bilan',       ph:'/əˈsesmənt/' },
      { en:'prescription', fr:'ordonnance',               ph:'/prɪˈskrɪpʃən/' },
    ]},
    { id:2, name:'Corps humain', emoji:'🫀', words:[
      { en:'heart',   fr:'cœur',                 ph:'/hɑːrt/' },
      { en:'lung',    fr:'poumon',                ph:'/lʌŋ/' },
      { en:'kidney',  fr:'rein',                  ph:'/ˈkɪdni/' },
      { en:'liver',   fr:'foie',                  ph:'/ˈlɪvər/' },
      { en:'brain',   fr:'cerveau',               ph:'/breɪn/' },
      { en:'spine',   fr:'colonne vertébrale',    ph:'/spaɪn/' },
      { en:'vein',    fr:'veine',                 ph:'/veɪn/' },
      { en:'artery',  fr:'artère',                ph:'/ˈɑːrtəri/' },
    ]},
    { id:3, name:'Signes vitaux', emoji:'📊', words:[
      { en:'blood pressure',    fr:'tension artérielle',     ph:'/blʌd ˈpreʃər/' },
      { en:'heart rate',        fr:'fréquence cardiaque',    ph:'/hɑːrt reɪt/' },
      { en:'temperature',       fr:'température',            ph:'/ˈtemprətʃər/' },
      { en:'oxygen saturation', fr:'saturation en oxygène',  ph:'/ˈɒksɪdʒən sætʃəˈreɪʃən/' },
      { en:'respiratory rate',  fr:'fréquence respiratoire', ph:'/rɪˈspɪrətɔːri reɪt/' },
      { en:'pulse',             fr:'pouls',                  ph:'/pʌls/' },
      { en:'fever',             fr:'fièvre',                 ph:'/ˈfiːvər/' },
      { en:'hypotension',       fr:'hypotension',            ph:'/ˌhaɪpəˈtenʃən/' },
    ]},
    { id:4, name:'Symptômes', emoji:'🤒', words:[
      { en:'pain',                fr:'douleur',                   ph:'/peɪn/' },
      { en:'nausea',              fr:'nausée',                    ph:'/ˈnɔːziə/' },
      { en:'dizziness',           fr:'vertige / étourdissement',  ph:'/ˈdɪzinəs/' },
      { en:'shortness of breath', fr:'dyspnée / essoufflement',   ph:'/ˈʃɔːrtnəs əv breθ/' },
      { en:'swelling',            fr:'gonflement / œdème',        ph:'/ˈswelɪŋ/' },
      { en:'rash',                fr:'éruption cutanée',          ph:'/ræʃ/' },
      { en:'bleeding',            fr:'saignement / hémorragie',   ph:'/ˈbliːdɪŋ/' },
      { en:'unconscious',         fr:'inconscient(e)',             ph:'/ʌnˈkɒnʃəs/' },
    ]},
    { id:5, name:'Soins infirmiers', emoji:'💉', words:[
      { en:'administer', fr:'administrer',               ph:'/ədˈmɪnɪstər/' },
      { en:'injection',  fr:'injection / piqûre',        ph:'/ɪnˈdʒekʃən/' },
      { en:'catheter',   fr:'cathéter',                  ph:'/ˈkæθɪtər/' },
      { en:'dressing',   fr:'pansement',                 ph:'/ˈdresɪŋ/' },
      { en:'infusion',   fr:'perfusion',                 ph:'/ɪnˈfjuːʒən/' },
      { en:'monitoring', fr:'surveillance / monitorage', ph:'/ˈmɒnɪtərɪŋ/' },
      { en:'discharge',  fr:'sortie / congé (médical)',  ph:'/dɪsˈtʃɑːrdʒ/' },
      { en:'consent',    fr:'consentement',              ph:'/kənˈsent/' },
    ]},
    { id:6, name:'Médicaments', emoji:'💊', words:[
      { en:'antibiotic',    fr:'antibiotique',             ph:'/ˌæntɪbaɪˈɒtɪk/' },
      { en:'analgesic',     fr:'analgésique / antidouleur',ph:'/ˌænəlˈdʒiːzɪk/' },
      { en:'anticoagulant', fr:'anticoagulant',            ph:'/ˌæntɪkəʊˈæɡjʊlənt/' },
      { en:'dosage',        fr:'posologie / dose',         ph:'/ˈdəʊsɪdʒ/' },
      { en:'side effect',   fr:'effet secondaire',         ph:'/saɪd ɪˈfekt/' },
      { en:'allergy',       fr:'allergie',                 ph:'/ˈælərdʒi/' },
      { en:'overdose',      fr:'surdosage / overdose',     ph:'/ˈəʊvərˌdəʊs/' },
      { en:'intravenous',   fr:'intraveineux',             ph:'/ˌɪntrəˈviːnəs/' },
    ]},
    { id:7, name:'Urgences', emoji:'🚨', words:[
      { en:'cardiac arrest', fr:'arrêt cardiaque',                    ph:'/ˈkɑːrdiæk əˈrest/' },
      { en:'CPR',            fr:'réanimation cardio-pulmonaire',      ph:'/siː piː ɑːr/' },
      { en:'stroke',         fr:'AVC (accident vasculaire cérébral)', ph:'/strəʊk/' },
      { en:'trauma',         fr:'traumatisme',                        ph:'/ˈtrɔːmə/' },
      { en:'triage',         fr:'triage',                             ph:'/ˈtriːɑːʒ/' },
      { en:'resuscitation',  fr:'réanimation',                        ph:'/rɪˌsʌsɪˈteɪʃən/' },
      { en:'defibrillator',  fr:'défibrillateur',                     ph:'/dɪˈfɪbrɪleɪtər/' },
      { en:'shock',          fr:'état de choc',                       ph:'/ʃɒk/' },
    ]},
    { id:8, name:'Communication', emoji:'💬', words:[
      { en:'Are you in pain?',                    fr:'Avez-vous mal ?',                                   ph:'' },
      { en:'Take a deep breath.',                 fr:'Respirez profondément.',                            ph:'' },
      { en:'Do you have any allergies?',          fr:'Avez-vous des allergies ?',                         ph:'' },
      { en:'I need to take your blood pressure.', fr:'Je dois prendre votre tension.',                    ph:'' },
      { en:'How are you feeling?',                fr:'Comment vous sentez-vous ?',                        ph:'' },
      { en:'You need to rest.',                   fr:'Vous devez vous reposer.',                          ph:'' },
      { en:'The doctor will see you shortly.',    fr:'Le médecin vous verra bientôt.',                    ph:'' },
      { en:'Please call if you need anything.',   fr:'Appelez si vous avez besoin de quoi que ce soit.', ph:'' },
    ]},
    { id:9, name:'Pathologies', emoji:'🩺', words:[
      { en:'hypertension', fr:'hypertension artérielle (HTA)', ph:'/ˌhaɪpəˈtenʃən/' },
      { en:'diabetes',     fr:'diabète',                       ph:'/ˌdaɪəˈbiːtɪs/' },
      { en:'asthma',       fr:'asthme',                        ph:'/ˈæsmə/' },
      { en:'epilepsy',     fr:'épilepsie',                     ph:'/ˈepɪlepsi/' },
      { en:'arthritis',    fr:'arthrite / arthrose',           ph:'/ɑːˈθraɪtɪs/' },
      { en:'pneumonia',    fr:'pneumonie / pneumopathie',      ph:'/njuːˈməʊniə/' },
      { en:'fracture',     fr:'fracture',                      ph:'/ˈfræktʃər/' },
      { en:'infection',    fr:'infection',                     ph:'/ɪnˈfekʃən/' },
    ]},
    { id:10, name:'Chirurgie', emoji:'⚕️', words:[
      { en:'surgery',         fr:'chirurgie / intervention',    ph:'/ˈsɜːrdʒəri/' },
      { en:'incision',        fr:'incision',                    ph:'/ɪnˈsɪʒən/' },
      { en:'suture',          fr:'suture / point de suture',    ph:'/ˈsuːtʃər/' },
      { en:'anesthesia',      fr:'anesthésie',                  ph:'/ˌænɪsˈθiːziə/' },
      { en:'surgeon',         fr:'chirurgien(ne)',               ph:'/ˈsɜːrdʒən/' },
      { en:'operating room',  fr:'bloc opératoire / salle d\'op',ph:'/ˈɒpəreɪtɪŋ ruːm/' },
      { en:'scalpel',         fr:'scalpel',                     ph:'/ˈskælpəl/' },
      { en:'postoperative',   fr:'post-opératoire',             ph:'/pəʊstˈɒpərətɪv/' },
    ]},
    { id:11, name:'Psychiatrie', emoji:'🧠', words:[
      { en:'anxiety',     fr:'anxiété',                     ph:'/æŋˈzaɪəti/' },
      { en:'depression',  fr:'dépression',                  ph:'/dɪˈpreʃən/' },
      { en:'hallucination',fr:'hallucination',             ph:'/həˌluːsɪˈneɪʃən/' },
      { en:'delusion',    fr:'délire / idée délirante',     ph:'/dɪˈluːʒən/' },
      { en:'psychosis',   fr:'psychose',                    ph:'/saɪˈkəʊsɪs/' },
      { en:'sedative',    fr:'sédatif / calmant',           ph:'/ˈsedətɪv/' },
      { en:'self-harm',   fr:'automutilation',              ph:'/self hɑːrm/' },
      { en:'crisis',      fr:'crise (psychiatrique)',       ph:'/ˈkraɪsɪs/' },
    ]},
    { id:12, name:'Maternité', emoji:'👶', words:[
      { en:'pregnancy',    fr:'grossesse',              ph:'/ˈpreɡnənsi/' },
      { en:'newborn',      fr:'nouveau-né',             ph:'/ˈnjuːbɔːrn/' },
      { en:'breastfeeding',fr:'allaitement maternel',  ph:'/ˈbrestfiːdɪŋ/' },
      { en:'contraction',  fr:'contraction',            ph:'/kənˈtrækʃən/' },
      { en:'midwife',      fr:'sage-femme',             ph:'/ˈmɪdwaɪf/' },
      { en:'ultrasound',   fr:'échographie',            ph:'/ˈʌltrəsaʊnd/' },
      { en:'premature',    fr:'prématuré(e)',           ph:'/ˌpreməˈtʃʊər/' },
      { en:'placenta',     fr:'placenta',               ph:'/pləˈsentə/' },
    ]},
  ];

  // ══════════════════════════════════════════════════════════════
  //  CONSTANTES & ÉTAT
  // ══════════════════════════════════════════════════════════════
  const STORAGE_KEY = 'ifsi_english_progress';
  const STREAK_KEY  = 'ifsi_english_streak';
  const DAILY_KEY   = 'ifsi_english_daily';
  const DAILY_GOAL  = 50; // XP par jour

  const LEVELS = [
    { name:'Débutant',      min:0,    badge:'🌱', color:'#6b7280' },
    { name:'Apprenti',      min:100,  badge:'📘', color:'#3b82f6' },
    { name:'Intermédiaire', min:300,  badge:'📗', color:'#16a34a' },
    { name:'Avancé',        min:600,  badge:'📙', color:'#f59e0b' },
    { name:'Expert',        min:1000, badge:'🏆', color:'#dc2626' },
  ];

  let _progress = {}; // { lessonId: { stars, xp, mistakes: {wordEn: count} } }
  let _game = null;

  // ══════════════════════════════════════════════════════════════
  //  PERSISTANCE
  // ══════════════════════════════════════════════════════════════
  function _load()  { try { _progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { _progress = {}; } }
  function _save()  { localStorage.setItem(STORAGE_KEY, JSON.stringify(_progress)); if (window.App?.Sync) App.Sync.pushDebounced(); }

  function _today()          { return new Date().toISOString().slice(0, 10); }
  function _yesterday()      { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }

  function _getStreak() {
    try {
      const s = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
      if (s.lastDate === _today())     return s.count || 0;
      if (s.lastDate === _yesterday()) return s.count || 0; // encore valide
      return 0;
    } catch(e) { return 0; }
  }
  function _touchStreak() {
    const today = _today();
    try {
      const s = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
      if (s.lastDate === today) return;
      const count = s.lastDate === _yesterday() ? (s.count || 0) + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count }));
    } catch(e) {}
  }
  function _getDailyXP() {
    try { const d = JSON.parse(localStorage.getItem(DAILY_KEY)||'{}'); return d.date === _today() ? (d.xp||0) : 0; } catch(e) { return 0; }
  }
  function _addDailyXP(xp) {
    const today = _today();
    try {
      const d = JSON.parse(localStorage.getItem(DAILY_KEY)||'{}');
      const cur = d.date === today ? (d.xp||0) : 0;
      localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today, xp: cur + xp }));
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════
  //  NIVEAU & XP
  // ══════════════════════════════════════════════════════════════
  function _totalXP() { return Object.values(_progress).reduce((s,p) => s+(p.xp||0), 0); }
  function _getLevel(xp) { return [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0]; }

  // ══════════════════════════════════════════════════════════════
  //  TTS
  // ══════════════════════════════════════════════════════════════
  function speakWord() {
    if (!_game) return;
    const q = _game.queue[_game.idx];
    if (!q) return;
    _speak(q.type === 'mc_fr_en' || q.type === 'type_en' ? q.word.en : q.word.en);
  }
  function _speak(text, lang = 'en-GB') {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 0.82; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════
  //  VÉRIFICATION FRAPPE
  // ══════════════════════════════════════════════════════════════
  function _normalize(s) {
    return String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[''`]/g,"'");
  }
  function _lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1}, (_,i) => Array.from({length:n+1}, (_,j) => i===0?j:j===0?i:0));
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
  }
  function _checkType(input, wordEn) {
    const a = _normalize(input), b = _normalize(wordEn);
    if (a === b) return 'correct';
    if (b.length > 5 && _lev(a, b) === 1) return 'typo';
    return 'wrong';
  }

  // ══════════════════════════════════════════════════════════════
  //  UTILITAIRES
  // ══════════════════════════════════════════════════════════════
  function _el(id) { return document.getElementById(id); }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _allWords() { return LESSONS.flatMap(l => l.words); }

  // ══════════════════════════════════════════════════════════════
  //  INIT / ACCUEIL
  // ══════════════════════════════════════════════════════════════
  function init() { _load(); showHome(); }

  function showHome() {
    _game = null;
    try { window.speechSynthesis.cancel(); } catch(e) {}
    _el('english-home').style.display   = 'block';
    _el('english-game').style.display   = 'none';
    _el('english-result').style.display = 'none';
    _renderHome();
  }

  function _renderHome() {
    _load();
    const totalXP = _totalXP();
    const level   = _getLevel(totalXP);
    const streak  = _getStreak();
    const dailyXP = _getDailyXP();

    // Stats header
    const xpEl = _el('english-total-xp');   if (xpEl)  xpEl.textContent  = totalXP + ' XP';
    const lvlEl = _el('eng-level-badge');   if (lvlEl) { lvlEl.textContent = level.badge + ' ' + level.name; lvlEl.style.color = level.color; }
    const strEl = _el('eng-streak-badge');  if (strEl) { strEl.textContent = '🔥 ' + streak; strEl.style.opacity = streak > 0 ? '1' : '.4'; }

    // Objectif journalier
    const pct = Math.min(100, dailyXP / DAILY_GOAL * 100);
    const dailyEl = _el('eng-daily-xp');  if (dailyEl) dailyEl.textContent = dailyXP + '/' + DAILY_GOAL;
    const fillEl  = _el('eng-daily-fill'); if (fillEl) fillEl.style.width = pct + '%';
    const goalEl  = _el('eng-daily-goal-wrap'); if (goalEl) goalEl.style.display = 'block';

    // Mots maîtrisés
    const completed = LESSONS.filter(l => (_progress[l.id]?.stars||0) > 0).length;
    const mastEl = _el('eng-mastered-count');
    if (mastEl) mastEl.textContent = completed > 0 ? `${completed * 8} / ${LESSONS.length * 8} mots vus` : '';

    // Bouton révision (mots avec erreurs)
    const weakWords = _getWeakWords();
    const revWrap = _el('eng-review-btn-wrap');
    if (revWrap) revWrap.style.display = weakWords.length >= 4 ? 'block' : 'none';

    // Grille des leçons
    const grid = _el('english-lessons-grid');
    if (!grid) return;
    let html = '';
    LESSONS.forEach((lesson, i) => {
      const prog   = _progress[lesson.id] || { stars:0, xp:0 };
      const prevOk = i === 0 || (_progress[LESSONS[i-1].id]?.stars||0) > 0;
      const locked = !prevOk;
      const stars  = prog.stars || 0;
      const starsHTML = '⭐'.repeat(stars) + `<span style="opacity:.2">⭐</span>`.repeat(3-stars);
      html += `<div class="eng-lesson-card${locked?' eng-locked':''}${stars>0?' eng-completed':''}"
        ${locked ? '' : `onclick="App.English.startLesson(${lesson.id})"`}
        title="${locked ? 'Termine la leçon précédente' : lesson.name}">
        <div class="eng-lesson-emoji">${locked ? '🔒' : lesson.emoji}</div>
        <div class="eng-lesson-name">${_esc(lesson.name)}</div>
        <div class="eng-lesson-stars">${locked ? '' : starsHTML}</div>
        ${prog.xp ? `<div class="eng-lesson-xp">+${prog.xp} XP</div>` : ''}
      </div>`;
    });
    grid.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════════
  //  RÉVISION DES MOTS FAIBLES
  // ══════════════════════════════════════════════════════════════
  function _getWeakWords() {
    const result = [];
    Object.values(_progress).forEach(p => {
      if (!p.mistakes) return;
      Object.entries(p.mistakes).forEach(([en, count]) => {
        if (count >= 1) {
          const w = _allWords().find(x => x.en === en);
          if (w) result.push({ word: w, mistakes: count });
        }
      });
    });
    return result.sort((a,b) => b.mistakes - a.mistakes).slice(0, 16);
  }

  function startReview() {
    _load();
    const weak = _getWeakWords();
    if (weak.length < 2) { alert('Pas assez de mots à réviser !'); return; }
    const words = weak.map(w => w.word);
    _game = {
      lessonId : 'review',
      lesson   : { id: 'review', name: 'Révision', emoji: '🔄', words },
      queue    : _buildQueue(words, true),
      idx      : 0, hearts : 3, xp : 0,
      answered : false, failed : false, isReview : true
    };
    _startGame();
  }

  // ══════════════════════════════════════════════════════════════
  //  DÉMARRAGE LEÇON
  // ══════════════════════════════════════════════════════════════
  function startLesson(id) {
    _load();
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return;
    _game = {
      lessonId : id, lesson,
      queue    : _buildQueue(lesson.words, false),
      idx      : 0, hearts : 3, xp : 0,
      answered : false, failed : false, isReview : false
    };
    _startGame();
  }

  function _startGame() {
    _el('english-home').style.display   = 'none';
    _el('english-game').style.display   = 'block';
    _el('english-result').style.display = 'none';
    _showQuestion();
  }

  // ══════════════════════════════════════════════════════════════
  //  CONSTRUCTION FILE DE QUESTIONS
  // ══════════════════════════════════════════════════════════════
  function _buildQueue(words, isReview) {
    const q = [];
    const canType = w => !w.en.includes(' ') && w.en.length <= 14;
    words.forEach(w => q.push({ type:'mc_en_fr', word:w }));
    [...words].sort(() => Math.random()-.5).slice(0, Math.ceil(words.length/2))
      .forEach(w => q.push({ type:'mc_fr_en', word:w }));
    const typeable = words.filter(canType);
    [...typeable].sort(() => Math.random()-.5).slice(0, Math.ceil(typeable.length/3))
      .forEach(w => q.push({ type:'type_en', word:w }));
    for (let i = q.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
  }

  function _getDistractors(word, count) {
    const all = _allWords().filter(w => w.en !== word.en).sort(() => Math.random()-.5);
    return all.slice(0, count);
  }

  // ══════════════════════════════════════════════════════════════
  //  AFFICHAGE QUESTION
  // ══════════════════════════════════════════════════════════════
  function _showQuestion() {
    if (!_game) return;
    const { queue, idx, hearts, xp } = _game;
    _game.answered = false;
    const fill = _el('eng-progress-fill');
    if (fill) fill.style.width = (idx/queue.length*100) + '%';
    _updateHearts(hearts);
    const xpEl = _el('eng-xp'); if (xpEl) xpEl.textContent = xp + ' XP';
    const fb = _el('eng-feedback');
    if (fb) { fb.style.display='none'; fb.className='eng-feedback'; }
    if (_el('eng-choices'))  { _el('eng-choices').innerHTML = ''; _el('eng-choices').style.display = 'flex'; }
    if (_el('eng-type-zone')) _el('eng-type-zone').style.display = 'none';
    const hintEl = _el('eng-type-hint');
    if (hintEl) hintEl.style.display = 'none';
    if (idx >= queue.length) { _endLesson(false); return; }
    const q    = queue[idx];
    const word = q.word;
    const dist = _getDistractors(word, 3);
    const promptEl   = _el('eng-prompt-label');
    const wordEl     = _el('eng-word');
    const phoneticEl = _el('eng-phonetic');
    const ttsBtn     = _el('eng-tts-btn');
    if (q.type === 'mc_en_fr') {
      if (promptEl)   promptEl.textContent   = 'Que signifie ce mot en français ?';
      if (wordEl)   { wordEl.textContent     = word.en; wordEl.lang = 'en'; }
      if (phoneticEl) phoneticEl.textContent = word.ph || '';
      if (ttsBtn)     ttsBtn.style.display   = 'inline-flex';
      _renderChoices([{label:word.fr,correct:true}, ...dist.map(d=>({label:d.fr,correct:false}))]);
      if (word.ph) setTimeout(() => _speak(word.en), 300);
    } else if (q.type === 'mc_fr_en') {
      if (promptEl)   promptEl.textContent   = 'Comment dit-on en anglais ?';
      if (wordEl)   { wordEl.textContent     = word.fr; wordEl.lang = 'fr'; }
      if (phoneticEl) phoneticEl.textContent = '';
      if (ttsBtn)     ttsBtn.style.display   = 'none';
      _renderChoices([{label:word.en,correct:true}, ...dist.map(d=>({label:d.en,correct:false}))]);
    } else {
      if (promptEl)   promptEl.textContent   = 'Écris le mot anglais :';
      if (wordEl)   { wordEl.textContent     = word.fr; wordEl.lang = 'fr'; }
      if (phoneticEl) phoneticEl.textContent = word.ph ? '(' + word.ph + ')' : '';
      if (ttsBtn)     ttsBtn.style.display   = 'none';
      if (_el('eng-choices')) _el('eng-choices').style.display = 'none';
      const typeZone = _el('eng-type-zone'); if (typeZone) typeZone.style.display = 'block';
      const inp = _el('eng-type-input');
      if (inp) { inp.value = ''; inp.disabled = false; inp.classList.remove('eng-type-correct','eng-type-wrong'); inp.focus();
        inp.onkeydown = e => { if (e.key === 'Enter') checkType(); };
      }
    }
  }

  function _renderChoices(choices) {
    const shuffled = choices.sort(() => Math.random()-.5);
    const el = _el('eng-choices');
    if (!el) return;
    el.innerHTML = shuffled.map((c,i) =>
      `<button class="eng-choice" data-correct="${c.correct}" onclick="App.English.pickChoice(${i})">${_esc(c.label)}</button>`
    ).join('');
  }

  // ══════════════════════════════════════════════════════════════
  //  RÉPONSES
  // ══════════════════════════════════════════════════════════════
  function pickChoice(choiceIdx) {
    if (!_game || _game.answered) return;
    _game.answered = true;
    const btns    = document.querySelectorAll('.eng-choice');
    const btn     = btns[choiceIdx];
    if (!btn) return;
    const correct = btn.dataset.correct === 'true';
    const corrBtn = Array.from(btns).find(b => b.dataset.correct === 'true');
    btns.forEach(b => b.disabled = true);
    if (correct) {
      btn.classList.add('eng-choice-correct');
      _onCorrect();
    } else {
      btn.classList.add('eng-choice-wrong');
      if (corrBtn) corrBtn.classList.add('eng-choice-correct');
      _onWrong(corrBtn ? corrBtn.textContent : '');
    }
  }

  function checkType() {
    if (!_game || _game.answered) return;
    const inp = _el('eng-type-input');
    const val = inp ? inp.value : '';
    if (!val.trim()) { if (inp) inp.focus(); return; }
    _game.answered = true;
    if (inp) inp.disabled = true;
    const word = _game.queue[_game.idx].word;
    const res  = _checkType(val, word.en);
    const hintEl = _el('eng-type-hint');
    if (res === 'correct') {
      if (inp) inp.classList.add('eng-type-correct');
      _onCorrect(false);
    } else if (res === 'typo') {
      if (inp) inp.classList.add('eng-type-correct');
      if (hintEl) { hintEl.style.display='block'; hintEl.textContent = 'Presque ! Bonne ortho : ' + word.en; hintEl.style.color='#f59e0b'; }
      _onCorrect(true);
    } else {
      if (inp) inp.classList.add('eng-type-wrong');
      if (hintEl) { hintEl.style.display='block'; hintEl.textContent = 'Bonne réponse : ' + word.en; hintEl.style.color='#dc2626'; }
      _onWrong(word.en);
    }
  }

  function _onCorrect(isTypo) {
    const pts = isTypo ? 7 : 10;
    _game.xp += pts;
    _soundCorrect();
    _animXP('+' + pts + ' XP');
    const xpEl = _el('eng-xp'); if (xpEl) xpEl.textContent = _game.xp + ' XP';
    _showFeedback(true, '');
  }

  function _onWrong(correctAns) {
    _game.hearts = Math.max(0, _game.hearts - 1);
    _updateHearts(_game.hearts);
    const word = _game.queue[_game.idx].word;
    const lid  = _game.lessonId;
    if (lid !== 'review') {
      if (!_progress[lid]) _progress[lid] = { stars:0, xp:0 };
      if (!_progress[lid].mistakes) _progress[lid].mistakes = {};
      _progress[lid].mistakes[word.en] = (_progress[lid].mistakes[word.en]||0) + 1;
      _save();
    }
    _soundWrong();
    _showFeedback(false, correctAns);
    if (_game.hearts === 0) setTimeout(() => _endLesson(true), 1500);
  }

  function _updateHearts(n) {
    const el = _el('eng-hearts');
    if (!el) return;
    el.innerHTML = '❤️'.repeat(n) + '<span style="opacity:.2">❤️</span>'.repeat(3-n);
    el.classList.add('eng-hearts-shake');
    setTimeout(() => el.classList.remove('eng-hearts-shake'), 400);
  }

  function _showFeedback(correct, correctAnswer) {
    const fb = _el('eng-feedback'), txt = _el('eng-feedback-text');
    if (!fb || !txt) return;
    fb.style.display = 'flex';
    fb.className = 'eng-feedback ' + (correct ? 'eng-feedback-correct' : 'eng-feedback-wrong');
    const msgs = ['Parfait !','Excellent !','Bravo !','Super !','Nickel !'];
    if (correct) {
      txt.innerHTML = '<strong>' + msgs[Math.floor(Math.random()*msgs.length)] + '</strong>';
    } else {
      setTimeout(() => _speak(correctAnswer), 200);
      txt.innerHTML = '❌ <strong>Bonne réponse :</strong> ' + _esc(correctAnswer);
    }
  }

  function continueQ() {
    if (!_game) return;
    _game.idx++;
    _showQuestion();
  }

  // ══════════════════════════════════════════════════════════════
  //  FIN DE LEÇON
  // ══════════════════════════════════════════════════════════════
  function _endLesson(failed) {
    const { lessonId, hearts, xp, isReview } = _game;
    const stars = failed ? 0 : hearts >= 3 ? 3 : hearts >= 2 ? 2 : 1;
    if (!failed && !isReview) {
      const prev = _progress[lessonId] || { stars:0, xp:0 };
      const newMistakes = Object.fromEntries(
        Object.entries(prev.mistakes||{}).map(([k,v]) => [k, Math.max(0,v-1)]).filter(([,v])=>v>0)
      );
      _progress[lessonId] = { stars: Math.max(prev.stars,stars), xp: (prev.xp||0)+xp, mistakes: newMistakes };
      _save();
      _addDailyXP(xp);
      if (xp > 0) _touchStreak();
    }
    _el('english-game').style.display   = 'none';
    _el('english-result').style.display = 'flex';
    const emojiEl  = _el('eng-result-emoji');
    const titleEl  = _el('eng-result-title');
    const starsEl  = _el('eng-result-stars');
    const xpEl     = _el('eng-result-xp');
    const streakEl = _el('eng-result-streak');
    if (failed) {
      if (emojiEl) emojiEl.textContent = '💔';
      if (titleEl) titleEl.textContent = 'Dommage !';
      if (starsEl) starsEl.innerHTML   = '<span style="opacity:.3">⭐⭐⭐</span>';
      if (xpEl)    xpEl.textContent    = 'Plus de vies — réessaie !';
      if (streakEl)streakEl.textContent= '';
    } else {
      const titles = ['Leçon terminée !','Bien joué !','Excellent !','Tu gères !'];
      const streak = _getStreak();
      if (emojiEl) emojiEl.textContent = stars === 3 ? '🏆' : '✅';
      if (titleEl) titleEl.textContent = titles[Math.floor(Math.random()*titles.length)];
      if (starsEl) starsEl.innerHTML   = '⭐'.repeat(stars) + '<span style="opacity:.2">⭐</span>'.repeat(3-stars);
      if (xpEl)    xpEl.innerHTML      = '<span style="color:#f59e0b;font-weight:800;font-size:1.3rem">+' + xp + ' XP</span>';
      if (streakEl)streakEl.textContent= streak > 1 ? '🔥 ' + streak + ' jours de suite !' : '';
      if (stars === 3) setTimeout(_confetti, 200);
    }
    _game.failed = failed;
  }

  // ══════════════════════════════════════════════════════════════
  //  EFFETS VISUELS & SONS
  // ══════════════════════════════════════════════════════════════
  function _animXP(label) {
    const el = _el('eng-xp-anim');
    if (!el) return;
    el.textContent = label; el.style.display = 'inline-block'; el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    requestAnimationFrame(() => { el.style.transition='opacity .6s,transform .6s'; el.style.opacity='0'; el.style.transform='translateY(-20px)'; });
    setTimeout(() => { el.style.display='none'; el.style.transition=''; }, 700);
  }

  function _confetti() {
    const wrap = _el('eng-confetti');
    if (!wrap) return;
    wrap.style.display = 'block'; wrap.innerHTML = '';
    const colors = ['#f59e0b','#16a34a','#3b82f6','#dc2626','#8b5cf6','#ec4899'];
    for (let i = 0; i < 70; i++) {
      const el = document.createElement('div');
      const size = 7 + Math.random()*9;
      el.style.cssText = 'position:absolute;width:'+size+'px;height:'+size+'px;background:'+colors[i%colors.length]+';border-radius:'+(Math.random()>.5?'50%':'3px')+';left:'+Math.random()*100+'%;top:-10px;opacity:1;animation:confettiFall '+(1.4+Math.random())+'s '+(Math.random()*0.6)+'s linear forwards';
      wrap.appendChild(el);
    }
    setTimeout(() => { wrap.style.display='none'; wrap.innerHTML=''; }, 2800);
  }

  function _soundCorrect() {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      [[523,0],[659,80]].forEach(([freq,delay]) => {
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.frequency.value=freq;
        g.gain.setValueAtTime(0.12,ctx.currentTime+delay/1000);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay/1000+0.25);
        o.start(ctx.currentTime+delay/1000);o.stop(ctx.currentTime+delay/1000+0.25);
      });
    } catch(e) {}
  }
  function _soundWrong() {
    try {
      const ctx=new (window.AudioContext||window.webkitAudioContext)();
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='sawtooth';o.frequency.value=180;
      o.frequency.linearRampToValueAtTime(120,ctx.currentTime+0.2);
      g.gain.setValueAtTime(0.1,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25);
      o.start();o.stop(ctx.currentTime+0.25);
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════
  //  API PUBLIQUE
  // ══════════════════════════════════════════════════════════════
  function speakWord() {
    if (!_game) return;
    const q = _game.queue[_game.idx];
    if (q) _speak(q.word.en);
  }
  function replay()     { if (!_game) return; startLesson(_game.lessonId); }
  function quitLesson() { try { window.speechSynthesis.cancel(); } catch(e) {} showHome(); }

  return { init, showHome, startLesson, startReview, pickChoice, checkType, continueQ, speakWord, replay, quitLesson };
})();
