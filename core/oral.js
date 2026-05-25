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
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '▶ Reprendre';
    } else {
      _presRunning = true;
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '⏸ Pause';
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
