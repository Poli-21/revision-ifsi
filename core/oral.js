// core/oral.js — Module Grand Oral ST2S
'use strict';
window.App = window.App || {};

App.Oral = (function() {

  // ── Data problematiques ────────────────────────────────────────
  var _PROBLEMS = {
    p1: {
      label: 'P1',
      text: 'Comment expliquer la pression préhospitalière sur les populations les plus précaires en Seine-Saint-Denis ?',
      questions: [
        "Qu'entendez-vous exactement par « pression préhospitalière » ?",
        "Pouvez-vous définir la notion de précarité dans un contexte médical et social ?",
        "Quelles sont les caractéristiques socio-démographiques de la Seine-Saint-Denis ?",
        "En quoi l'offre de soins en Seine-Saint-Denis diffère-t-elle des autres départements ?",
        "Quel lien faites-vous entre déserts médicaux et pression sur les secours préhospitaliers ?",
        "Comment les déterminants sociaux de santé amplifient-ils la pression préhospitalière ?",
        "Quel est le rôle du SAMU 15 et des équipes SMUR dans ce contexte ?",
        "En quoi le renoncement aux soins est-il un facteur aggravant de la pression préhospitalière ?",
        "Comment la barrière linguistique peut-elle influencer le recours aux soins préhospitaliers ?",
        "Quel lien existe-t-il entre précarité et mortalité prématurée en Seine-Saint-Denis ?",
        "Comment les indicateurs épidémiologiques illustrent-ils cette pression ?",
        "Pourquoi les urgences sont-elles souvent le premier recours pour les populations précaires ?"
      ],
      aiContext: "Tu es un professeur de Sciences et Techniques Sanitaires et Sociales (ST2S) préparant un élève au Grand Oral du baccalauréat. La problématique est : \"Comment expliquer la pression préhospitalière sur les populations les plus précaires en Seine-Saint-Denis ?\" Contexte clé : Seine-Saint-Denis (93) = département avec un fort taux de précarité, une densité médicale faible, une population immigrée importante, et de fortes inégalités sociales de santé (ISS)."
    },
    p2: {
      label: 'P2',
      text: "Quelles sont les conséquences de la pression préhospitalière sur la population en Seine-Saint-Denis et comment tenter d'y remédier ?",
      questions: [
        "Quelles sont les conséquences concrètes pour les patients qui ne reçoivent pas de soins à temps ?",
        "Quels sont les effets de cette pression préhospitalière sur les professionnels de santé ?",
        "Comment le recours excessif aux urgences impacte-t-il l'ensemble du système de santé ?",
        "Quelles solutions de court terme permettraient de réduire cette pression ?",
        "Quel rôle les maisons de santé pluriprofessionnelles (MSP) peuvent-elles jouer ?",
        "Comment la télémédecine peut-elle améliorer l'accès aux soins en Seine-Saint-Denis ?",
        "Quel est le rôle des infirmiers de pratique avancée (IPA) dans la réduction de cette pression ?",
        "Comment les politiques de santé publique s'attaquent-elles aux inégalités de santé territoriales ?",
        "Que pensez-vous du dispositif ASALEE (Action de Santé Libérale En Équipe) ?",
        "Quel lien faites-vous entre prévention primaire et réduction de la pression préhospitalière ?",
        "Que proposeriez-vous concrètement pour améliorer la situation en Seine-Saint-Denis ?",
        "Comment le Contrat Local de Santé (CLS) peut-il contribuer à une solution durable ?"
      ],
      aiContext: "Tu es un professeur de Sciences et Techniques Sanitaires et Sociales (ST2S) préparant un élève au Grand Oral du baccalauréat. La problématique est : \"Quelles sont les conséquences de la pression préhospitalière sur la population en Seine-Saint-Denis et comment tenter d'y remédier ?\" Contexte clé : la pression préhospitalière génère des retards de soins, surcharge les urgences et épuise les soignants. Solutions envisagées : maisons de santé pluriprofessionnelles (MSP), infirmiers de pratique avancée (IPA), télémédecine, Contrat Local de Santé (CLS), prévention primaire, ASALEE."
    }
  };

  // ── State ──────────────────────────────────────────────────────
  var _probId      = 'p1';
  var _presTimer   = null;
  var _presRunning = false;
  var _presElapsed = 0;
  var _PRES_TOTAL  = 600;  // 10 min
  var _juryTimer   = null;
  var _juryRunning = false;
  var _juryElapsed = 0;
  var _JURY_TOTAL  = 600;  // 10 min
  var _juryQIdx    = -1;
  var _juryQOrder  = [];

  // ── Helpers ────────────────────────────────────────────────────
  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function _beep(freq, dur) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.35));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (dur || 0.35));
    } catch(e) {}
  }

  function _doubleBeep() {
    _beep(880, 0.2);
    setTimeout(function() { _beep(1046, 0.3); }, 250);
  }

  // ── Phase présentation ─────────────────────────────────────────
  // 0-60s: Intro, 60-240s: Développement, 240-300s: Conclusion
  function _getPresPhase(elapsed) {
    if (elapsed < 120) return { key: 'intro', name: 'Introduction',   color: '#3b82f6', pct: (elapsed / 120) * 100 };
    if (elapsed < 480) return { key: 'dev',   name: 'Développement',  color: '#10b981', pct: ((elapsed - 120) / 360) * 100 };
    return               { key: 'ccl',   name: 'Conclusion',     color: '#f59e0b', pct: ((elapsed - 480) / 120) * 100 };
  }



  // ── Reconnaissance vocale ──────────────────────────────────────
  var _recog       = null;
  var _transcript  = '';   // texte final cumulé
  var _interimText = '';   // résultat partiel en cours

  var _KW_P1 = [
    'préhospitalière','préhospitalier','précaire','précarité','seine-saint-denis',
    'samu','smur','urgences','urgence','désert médical','déterminants','inégalités',
    'offre de soins','renoncement','densité médicale','pression','sociale',
    'population','santé publique','soin','soins'
  ];
  var _KW_P2 = [
    'conséquences','remède','solution','maison de santé','msp','ipa',
    'infirmier de pratique avancée','télémédecine','prévention','cls',
    'contrat local','asalee','parcours de soins','saturation','épuisement',
    'retard','mortalité','dépassement','réforme','politique de santé'
  ];
  var _CONNECTORS = [
    'premièrement','deuxièmement','troisièmement','tout d\'abord','ensuite',
    'par ailleurs','de plus','en outre','cependant','néanmoins','en revanche',
    'dans un premier temps','dans un second temps','d\'une part','d\'autre part',
    'enfin','pour finir','notamment','ainsi','c\'est pourquoi','en effet'
  ];
  var _INTRO_WORDS  = ['bonjour','problématique','je vais','pour commencer','nous allons','introduction'];
  var _CCL_WORDS    = ['en conclusion','pour conclure','en résumé','en définitive','pour terminer','en somme'];
  var _FILLERS      = ['euh','heu','bah','ben','voilà','donc euh','euh donc'];

  function _startSpeechRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // navigateur non supporté — silencieux
    if (_recog) { try { _recog.stop(); } catch(e) {} }

    _recog = new SR();
    _recog.continuous    = true;
    _recog.interimResults= true;
    _recog.lang          = 'fr-FR';
    _recog.maxAlternatives = 1;

    _recog.onresult = function(event) {
      var interim = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          _transcript += ' ' + t;
        } else {
          interim += t;
        }
      }
      _interimText = interim;
      _updateTranscriptDisplay();
    };

    _recog.onerror = function(e) {
      if (e.error === 'not-allowed') {
        var wrap = document.getElementById('oral-transcript-wrap');
        if (wrap) wrap.innerHTML = '<div style="color:var(--danger);font-size:.8rem">❌ Micro refusé — autorise le micro dans le navigateur.</div>';
      }
    };

    // Redémarre automatiquement si coupé (timeout navigateur)
    _recog.onend = function() {
      if (_presRunning) {
        try { _recog.start(); } catch(e) {}
      }
    };

    try {
      _recog.start();
      var wrap = document.getElementById('oral-transcript-wrap');
      if (wrap) wrap.style.display = 'block';
    } catch(e) {}
  }

  function _stopSpeechRecognition() {
    if (_recog) {
      try { _recog.stop(); } catch(e) {}
      _recog = null;
    }
  }

  function _updateTranscriptDisplay() {
    var el = document.getElementById('oral-transcript');
    if (!el) return;
    var full = (_transcript + ' ' + _interimText).trim();
    var words = full.split(/\s+/).filter(Boolean).length;
    el.innerHTML =
      '<div class="oral-transcript-stats">' + words + ' mots · ' +
      (_presElapsed > 0 ? Math.round(words / (_presElapsed / 60)) : 0) + ' mots/min</div>' +
      '<div class="oral-transcript-text">' + _esc(full.slice(-600)) + '<span class="oral-interim"> ' + _esc(_interimText) + '</span></div>';
  }

  function analyzePresentation() {
    var text = (_transcript + ' ' + _interimText).trim().toLowerCase();
    if (!text) {
      alert('Aucun texte transcrit. Assure-toi que le micro est autorisé dans Chrome.');
      return;
    }

    var words    = text.split(/\s+/).filter(Boolean).length;
    var duration = _presElapsed || 1;
    var wpm      = Math.round(words / (duration / 60));

    // Mots-clés du domaine selon la problématique
    var domainKw = _probId === 'p1' ? _KW_P1 : _KW_P2;
    var kwFound  = domainKw.filter(function(kw) { return text.includes(kw); });
    var kwScore  = Math.min(kwFound.length, 10); // 0-10 termes détectés

    // Connecteurs logiques
    var connFound = _CONNECTORS.filter(function(c) { return text.includes(c); });
    var connScore = Math.min(connFound.length, 8);

    // Structure intro / conclusion
    var hasIntro = _INTRO_WORDS.some(function(w) { return text.includes(w); });
    var hasCcl   = _CCL_WORDS.some(function(w)   { return text.includes(w); });

    // Mots de remplissage (fillers)
    var fillerCount = _FILLERS.reduce(function(n, f) {
      var re = new RegExp(f, 'g');
      return n + (text.match(re) || []).length;
    }, 0);
    var fillerRate = words > 0 ? fillerCount / words : 0;

    // ── Calcul scores (1-4) ────────────────────────────────────────
    // c1 : Qualité orale — débit + fillers
    var c1 = 1;
    if (wpm >= 100 && wpm <= 180 && fillerRate < 0.08) c1 = 4;
    else if (wpm >= 80  && wpm <= 200 && fillerRate < 0.12) c1 = 3;
    else if (wpm >= 60  || fillerRate < 0.20) c1 = 2;

    // c2 : Prise de parole — longueur + connecteurs
    var c2 = 1;
    if (words >= 800 && connScore >= 4) c2 = 4;
    else if (words >= 500 && connScore >= 2) c2 = 3;
    else if (words >= 250 || connScore >= 1) c2 = 2;

    // c3 : Connaissances — mots-clés domaine
    var c3 = 1;
    if (kwScore >= 7) c3 = 4;
    else if (kwScore >= 4) c3 = 3;
    else if (kwScore >= 2) c3 = 2;

    // c4 : Interaction — non évaluable sur la présentation → neutre
    var c4 = 0; // laissé à remplir manuellement

    // c5 : Argumentation — structure + connecteurs
    var c5 = 1;
    if (hasIntro && hasCcl && connScore >= 3) c5 = 4;
    else if ((hasIntro || hasCcl) && connScore >= 2) c5 = 3;
    else if (connScore >= 1 || hasIntro || hasCcl) c5 = 2;

    // ── Affichage du rapport d'analyse ────────────────────────────
    var report = document.getElementById('oral-analysis-report');
    if (!report) {
      report = document.createElement('div');
      report.id = 'oral-analysis-report';
      report.className = 'oral-analysis-report';
      var section = document.getElementById('oral-eval-section');
      if (section) section.insertBefore(report, section.querySelector('.oral-eval-grid'));
    }

    var kwList = kwFound.slice(0, 8).join(', ') || 'aucun';
    var connList = connFound.slice(0, 6).join(', ') || 'aucun';

    report.innerHTML =
      '<div class="oral-analysis-title">🔍 Analyse automatique</div>' +
      '<div class="oral-analysis-stats">' +
        '<div class="oral-stat-pill">' + words + ' mots</div>' +
        '<div class="oral-stat-pill">' + wpm + ' mots/min</div>' +
        '<div class="oral-stat-pill ' + (fillerRate < 0.08 ? 'good' : 'warn') + '">' + fillerCount + ' hésitations</div>' +
        '<div class="oral-stat-pill ' + (kwFound.length >= 4 ? 'good' : 'warn') + '">' + kwFound.length + ' mots-clés ST2S</div>' +
        '<div class="oral-stat-pill ' + (connFound.length >= 3 ? 'good' : 'warn') + '">' + connFound.length + ' connecteurs</div>' +
        '<div class="oral-stat-pill ' + (hasIntro ? 'good' : 'warn') + '">' + (hasIntro ? '✓' : '✗') + ' Intro détectée</div>' +
        '<div class="oral-stat-pill ' + (hasCcl   ? 'good' : 'warn') + '">' + (hasCcl   ? '✓' : '✗') + ' Conclusion détectée</div>' +
      '</div>' +
      '<div class="oral-analysis-detail">' +
        'Mots-clés : <em>' + _esc(kwList) + '</em><br>' +
        'Connecteurs : <em>' + _esc(connList) + '</em>' +
      '</div>' +
      '<div class="oral-analysis-note">⚠️ C4 (Interaction) non évalué ici — remplis-le manuellement après l\'entretien jury.</div>';

    // Applique les scores automatiquement
    var scores = { c1: c1, c2: c2, c3: c3, c4: c4, c5: c5 };
    Object.keys(scores).forEach(function(crit) {
      var val = scores[crit];
      if (val > 0) setLevel(crit, val);
    });

    // Scroll vers la grille
    var grid = document.getElementById('oral-eval-section');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Tracking temps de révision ────────────────────────────────
  function _logOralMinute() {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var log   = App.Store.state.studyLog;
      if (!log[today]) log[today] = { reviewed: 0, ok: 0, hard: 0, nope: 0 };
      log[today].seconds = (log[today].seconds || 0) + 60;
      App.Store.save();
    } catch(e) {}
  }

  // ── Présentation timer ─────────────────────────────────────────
  function togglePres() {
    if (_presRunning) {
      clearInterval(_presTimer);
      _presRunning = false;
      _stopSpeechRecognition();
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '▶ Reprendre';
    } else {
      _presRunning = true;
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '⏸ Pause';
      _startSpeechRecognition();
      _presTimer = setInterval(function() {
        _presElapsed++;
        // Bip aux transitions de phase
        if (_presElapsed === 120 || _presElapsed === 480) _beep(660, 0.3);
        // Log 1 min de révision toutes les 60s
        if (_presElapsed % 60 === 0) _logOralMinute();
        // Bip unique a la fin du temps reglementaire
        if (_presElapsed === _PRES_TOTAL) {
          _doubleBeep();
          var al = document.getElementById('oral-pres-alert');
          if (al) { al.textContent = '⏰ Temps réglementaire écoulé — tu continues !'; al.style.display = 'block'; }
          var ab = document.getElementById('oral-analyze-btn');
          if (ab) ab.style.display = 'block';
        }
        _updatePresDisplay(_PRES_TOTAL - _presElapsed, _presElapsed);
      }, 1000);
    }
  }

  function _updatePresDisplay(remaining, elapsed) {
    var disp  = document.getElementById('oral-pres-display');
    var label = document.getElementById('oral-pres-phase-label');
    var bar   = document.getElementById('oral-pres-progress-bar');
    if (disp) {
      if (remaining < 0) {
        disp.textContent = '+' + _fmtTime(-remaining);
        disp.style.color = 'var(--danger)';
      } else {
        disp.textContent = _fmtTime(remaining);
        if (remaining <= 30)       disp.style.color = 'var(--danger)';
        else if (remaining <= 60)  disp.style.color = 'var(--warning)';
        else                       disp.style.color = '';
      }
    }
    var clampedElapsed = Math.min(elapsed, _PRES_TOTAL);
    var phase = _getPresPhase(clampedElapsed);
    if (label) label.textContent = remaining < 0 ? '⏱ Dépassement' : '📍 ' + phase.name;
    if (bar) { bar.style.width = (remaining < 0 ? 100 : phase.pct) + '%'; bar.style.background = remaining < 0 ? 'var(--danger)' : phase.color; }
    document.querySelectorAll('.oral-phase-seg').forEach(function(el) {
      el.classList.toggle('active', el.dataset.phase === phase.key && remaining >= 0);
    });
  }

  function resetPres() {
    clearInterval(_presTimer);
    _presRunning = false;
    _presElapsed = 0;
    var disp  = document.getElementById('oral-pres-display');
    var label = document.getElementById('oral-pres-phase-label');
    var btn   = document.getElementById('oral-pres-btn');
    var al    = document.getElementById('oral-pres-alert');
    var bar   = document.getElementById('oral-pres-progress-bar');
    _stopSpeechRecognition();
    _transcript = ''; _interimText = '';
    var tw = document.getElementById('oral-transcript-wrap');
    if (tw) { tw.style.display = 'none'; var td = document.getElementById('oral-transcript'); if (td) td.innerHTML = ''; }
    var ab = document.getElementById('oral-analyze-btn');
    if (ab) ab.style.display = 'none';
    var rep = document.getElementById('oral-analysis-report');
    if (rep) rep.remove();
    if (disp)  { disp.textContent = '10:00'; disp.style.color = ''; }
    if (label) label.textContent = 'Prêt à commencer';
    if (btn)   btn.textContent   = '▶ Commencer';
    if (al)    al.style.display  = 'none';
    if (bar)   { bar.style.width = '0%'; }
    document.querySelectorAll('.oral-phase-seg').forEach(function(el) { el.classList.remove('active'); });
  }

  // ── Jury timer ─────────────────────────────────────────────────
  function toggleJury() {
    if (_juryRunning) {
      clearInterval(_juryTimer);
      _juryRunning = false;
      var btn = document.getElementById('oral-jury-btn');
      if (btn) btn.textContent = '▶ Reprendre';
    } else {
      // Initialise questions au premier lancement
      if (_juryQIdx === -1) { _shuffleQuestions(); _showCurrentQuestion(); }
      _juryRunning = true;
      var btn = document.getElementById('oral-jury-btn');
      if (btn) btn.textContent = '⏸ Pause';
      _juryTimer = setInterval(function() {
        _juryElapsed++;
        var remaining = _JURY_TOTAL - _juryElapsed;
        // Bip unique a la fin du temps reglementaire
        if (_juryElapsed === _JURY_TOTAL) _doubleBeep();
        // Log 1 min de révision toutes les 60s
        if (_juryElapsed % 60 === 0) _logOralMinute();
        var disp = document.getElementById('oral-jury-display');
        if (disp) {
          if (remaining < 0) {
            disp.textContent = '+' + _fmtTime(-remaining);
            disp.style.color = 'var(--danger)';
          } else {
            disp.textContent = _fmtTime(remaining);
            if (remaining <= 60)       disp.style.color = 'var(--danger)';
            else if (remaining <= 120) disp.style.color = 'var(--warning)';
            else                       disp.style.color = '';
          }
        }
      }, 1000);
    }
  }

  function _shuffleQuestions() {
    var arr = _PROBLEMS[_probId].questions.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    _juryQOrder = arr;
    _juryQIdx   = 0;
  }

  function nextQuestion() {
    if (_juryQOrder.length === 0) _shuffleQuestions();
    _juryQIdx = (_juryQIdx + 1) % _juryQOrder.length;
    _showCurrentQuestion();
  }

  function _showCurrentQuestion() {
    var box = document.getElementById('oral-jury-question');
    if (!box) return;
    if (_juryQOrder.length === 0) return;
    var q   = _juryQOrder[_juryQIdx];
    var num = (_juryQIdx + 1) + ' / ' + _juryQOrder.length;
    box.innerHTML =
      '<div class="oral-jury-q-num">' + _esc(num) + '</div>' +
      '<div class="oral-jury-q-text">' + _esc(q) + '</div>';
  }

  function resetJury() {
    clearInterval(_juryTimer);
    _juryRunning = false;
    _juryElapsed = 0;
    _juryQIdx    = -1;
    _juryQOrder  = [];
    var disp = document.getElementById('oral-jury-display');
    var box  = document.getElementById('oral-jury-question');
    var btn  = document.getElementById('oral-jury-btn');
    if (disp) { disp.textContent = '10:00'; disp.style.color = ''; }
    if (box)  box.innerHTML = '<span class="oral-jury-placeholder">Lance l\'échange pour voir les questions du jury</span>';
    if (btn)  btn.textContent = '▶ Commencer';
  }


  // ── Auto-évaluation (barème officiel Grand Oral) ─────────────
  var _EVAL_KEY = 'ifsi_oral_evals';
  var _evalRatings = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };

  // Barème officiel — 5 critères × 4 niveaux (1=Très insuf, 2=Insuf, 3=Satisf, 4=Très satisf)
  // 5 critères × 4 pts max = 20 pts
  var _BAREME = {
    c1: {
      name: 'Qualité orale de l\'épreuve',
      desc: [
        'Difficilement audible. Ne parvient pas à capter l\'attention.',
        'Voix plus audible mais monocorde. Vocabulaire limité.',
        'Quelques variations de voix, prise de parole affirmée, lexique adapté.',
        'Voix soutient le discours. Qualités prosodiques marquées. Vocabulaire riche et précis.'
      ]
    },
    c2: {
      name: 'Qualité de la prise de parole en continu',
      desc: [
        'Énoncés courts, pauses et faux démarrages, syntaxe mal maîtrisée.',
        'Discours assez clair mais vocabulaire limité et énoncés schématiques.',
        'Discours articulé et pertinent, énoncés bien construits.',
        'Discours fluide, efficace, tirant pleinement profit du temps et développant ses propositions.'
      ]
    },
    c3: {
      name: 'Qualité des connaissances',
      desc: [
        'Connaissances imprécises, incapacité à répondre aux questions même avec aide.',
        'Connaissances réelles mais difficulté à les mobiliser en situation.',
        'Connaissances précises, capacité à les mobiliser aux questions du jury.',
        'Connaissances maîtrisées, réponses témoignant d\'une capacité à les mobiliser et exposer clairement.'
      ]
    },
    c4: {
      name: 'Qualité de l\'interaction',
      desc: [
        'Réponses courtes ou rares. Communication repose principalement sur l\'évaluateur.',
        'L\'entretien permet une amorce d\'échange. Interaction reste limitée.',
        'Répond, contribue, réagit. Se reprend, reformule en s\'aidant des propositions du jury.',
        'S\'engage dans sa parole, réagit de façon pertinente. Prend l\'initiative. Exploite judicieusement les éléments fournis.'
      ]
    },
    c5: {
      name: 'Qualité et construction de l\'argumentation',
      desc: [
        'Pas de compréhension du sujet, discours non argumenté et décousu.',
        'Début de démonstration mais raisonnement lacunaire. Discours insuffisamment structuré.',
        'Démonstration construite et appuyée sur des arguments précis et pertinents.',
        'Maîtrise des enjeux du sujet, argumentation personnelle bien construite et raisonnée.'
      ]
    }
  };

  var _LEVEL_COLORS = ['', '#dc2626', '#d97706', '#16a34a', '#2563eb'];
  var _LEVEL_LABELS = ['', 'Très insuf.', 'Insuffisant', 'Satisfaisant', 'Très satisf.'];

  function setLevel(crit, val) {
    _evalRatings[crit] = val;
    // Met à jour les boutons
    document.querySelectorAll('.oral-lvl-btn[data-crit="' + crit + '"]').forEach(function(btn) {
      var active = parseInt(btn.dataset.val) === val;
      btn.classList.toggle('active', active);
      btn.style.background = active ? _LEVEL_COLORS[val] : '';
      btn.style.color      = active ? 'white' : '';
      btn.style.borderColor= active ? _LEVEL_COLORS[val] : '';
    });
    // Affiche la description du niveau
    var desc = document.getElementById('oral-desc-' + crit);
    if (desc) {
      desc.textContent = _BAREME[crit].desc[val - 1];
      desc.style.color = _LEVEL_COLORS[val];
    }
    _refreshScore();
  }

  function _initEvalUI() {
    // Reset visuel
    Object.keys(_evalRatings).forEach(function(crit) {
      document.querySelectorAll('.oral-lvl-btn[data-crit="' + crit + '"]').forEach(function(btn) {
        btn.classList.remove('active');
        btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
      });
      var desc = document.getElementById('oral-desc-' + crit);
      if (desc) desc.textContent = '';
    });
    _syncEvalProb();
    _renderHistory();
  }

  function _syncEvalProb() {
    var el = document.getElementById('oral-eval-prob');
    if (el) el.textContent = _probId.toUpperCase();
  }

  function _refreshScore() {
    var total = Object.values(_evalRatings).reduce(function(s, v) { return s + (v || 0); }, 0);
    var pts   = total; // max 5×4 = 20
    var el    = document.getElementById('oral-eval-score');
    if (!el) return;
    var col = pts >= 16 ? 'var(--success)' : pts >= 12 ? 'var(--warning)' : pts > 0 ? 'var(--danger)' : 'var(--gray-400)';
    var mention = pts >= 18 ? '— Très bien' : pts >= 16 ? '— Bien' : pts >= 14 ? '— Assez bien' : pts >= 10 ? '— Passable' : pts > 0 ? '— Insuffisant' : '';
    el.innerHTML = '<span style="font-size:1.6rem;font-weight:900;color:' + col + '">' + (pts || '—') + '</span><span style="color:var(--gray-400);font-size:.85rem"> / 20 ' + mention + '</span>';
  }

  function _calcScore() {
    return Object.values(_evalRatings).reduce(function(s, v) { return s + (v || 0); }, 0);
  }

  function saveEval() {
    var filled = Object.values(_evalRatings).some(function(v) { return v > 0; });
    if (!filled) { alert('Évalue au moins un critère avant de sauvegarder.'); return; }

    var notes = (document.getElementById('oral-eval-notes') || {}).value || '';
    var score = _calcScore();
    var entry = {
      date:    new Date().toISOString(),
      prob:    _probId,
      ratings: Object.assign({}, _evalRatings),
      score:   score,
      notes:   notes.trim()
    };

    var evals = _loadEvals();
    evals.unshift(entry);
    if (evals.length > 50) evals = evals.slice(0, 50);
    localStorage.setItem(_EVAL_KEY, JSON.stringify(evals));

    // Reset
    _evalRatings = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
    _initEvalUI();
    var notesEl = document.getElementById('oral-eval-notes');
    if (notesEl) notesEl.value = '';
    var scoreEl = document.getElementById('oral-eval-score');
    if (scoreEl) scoreEl.innerHTML = '— / 20';

    var btn = document.querySelector('.oral-eval-save-btn');
    if (btn) {
      var orig = btn.textContent;
      btn.textContent = '✅ Session sauvegardée !';
      setTimeout(function() { btn.textContent = orig; }, 2000);
    }
    _renderHistory();
  }

  function _loadEvals() {
    try { return JSON.parse(localStorage.getItem(_EVAL_KEY) || '[]'); } catch(e) { return []; }
  }

  function deleteEval(idx) {
    if (!confirm('Supprimer cette évaluation ?')) return;
    var evals = _loadEvals();
    evals.splice(idx, 1);
    localStorage.setItem(_EVAL_KEY, JSON.stringify(evals));
    _renderHistory();
  }

  function _renderHistory() {
    var container = document.getElementById('oral-eval-history');
    if (!container) return;
    var evals = _loadEvals();
    if (evals.length === 0) { container.innerHTML = ''; return; }

    var html = '<div class="oral-hist-title">📈 Historique (' + evals.length + ' session' + (evals.length > 1 ? 's' : '') + ')</div>';

    if (evals.length >= 2) {
      var diff = Math.round((evals[0].score - evals[1].score) * 10) / 10;
      var arrow = diff > 0 ? '↑ +' + diff : diff < 0 ? '↓ ' + diff : '→ stable';
      var col   = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--gray-400)';
      html += '<div class="oral-hist-trend" style="color:' + col + '">Tendance : ' + arrow + ' pts</div>';
    }

    evals.slice(0, 10).forEach(function(e, i) {
      var d = new Date(e.date);
      var dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
                    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      var col = e.score >= 16 ? 'var(--success)' : e.score >= 12 ? 'var(--warning)' : 'var(--danger)';
      var detail = '';
      if (e.ratings) {
        detail = Object.keys(e.ratings).map(function(k) {
          var v = e.ratings[k];
          return v ? '<span style="color:' + _LEVEL_COLORS[v] + ';font-size:.72rem">' + (k.toUpperCase()) + ':' + _LEVEL_LABELS[v] + '</span>' : '';
        }).filter(Boolean).join(' · ');
      }
      html += '<div class="oral-hist-row">' +
        '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span class="oral-hist-date">' + _esc(dateStr) + ' — ' + e.prob.toUpperCase() + '</span>' +
        '<span class="oral-hist-score" style="color:' + col + '">' + e.score + '/20</span>' +
        '</div>' +
        (detail ? '<div style="margin-top:4px">' + detail + '</div>' : '') +
        (e.notes ? '<div class="oral-hist-notes">' + _esc(e.notes) + '</div>' : '') +
        '</div>' +
        '<button class="oral-hist-del" onclick="App.Oral.deleteEval(' + i + ')" title="Supprimer">✕</button>' +
        '</div>';
    });

    container.innerHTML = html;
  }


  // ── Sélection problématique ────────────────────────────────────
  function setProblematique(id) {
    if (!(id in _PROBLEMS)) return;
    _probId = id;
    // Arrete les timers en cours
    clearInterval(_presTimer); _presRunning = false; _presElapsed = 0;
    clearInterval(_juryTimer); _juryRunning = false; _juryElapsed = 0;
    _juryQIdx = -1; _juryQOrder = [];
    // Boutons P1/P2
    document.querySelectorAll('.oral-prob-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.prob === id);
    });
    // Question
    var qEl = document.getElementById('oral-question-text');
    if (qEl) qEl.textContent = _PROBLEMS[id].text;
    _syncEvalProb();
    // Reset affichages
    resetPres();
    resetJury();
    // Cache le retour IA precedent
    var fb = document.getElementById('oral-plan-feedback');
    if (fb) fb.style.display = 'none';
  }

  // ── Init (appelé à chaque switchTab vers oral) ─────────────────
  function init() {
    var qEl = document.getElementById('oral-question-text');
    if (qEl && !qEl.textContent) qEl.textContent = _PROBLEMS[_probId].text;
    _initEvalUI();
    _renderHistory();
    // Raffraichit les timers si actifs
    if (_presElapsed > 0) {
      _updatePresDisplay(_PRES_TOTAL - _presElapsed, _presElapsed);
      var pb = document.getElementById('oral-pres-btn');
      if (pb) pb.textContent = _presRunning ? '⏸ Pause' : '▶ Reprendre';
    }
    if (_juryElapsed > 0) {
      var jd = document.getElementById('oral-jury-display');
      if (jd) jd.textContent = _fmtTime(_JURY_TOTAL - _juryElapsed);
      var jb = document.getElementById('oral-jury-btn');
      if (jb) jb.textContent = _juryRunning ? '⏸ Pause' : '▶ Reprendre';
      if (_juryQIdx >= 0) _showCurrentQuestion();
    }
    // Sync boutons P1/P2
    document.querySelectorAll('.oral-prob-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.prob === _probId);
    });
  }

  // ── API publique ───────────────────────────────────────────────
  return {
    init:             init,
    setProblematique: setProblematique,
    togglePres:       togglePres,
    resetPres:        resetPres,
    toggleJury:       toggleJury,
    resetJury:        resetJury,
    nextQuestion:     nextQuestion
  };

})();
