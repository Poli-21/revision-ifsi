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

  // ── Présentation timer ─────────────────────────────────────────
  function togglePres() {
    if (_presRunning) {
      clearInterval(_presTimer);
      _presRunning = false;
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '▶ Reprendre';
    } else {
      if (_presElapsed >= _PRES_TOTAL) return; // deja fini
      _presRunning = true;
      var btn = document.getElementById('oral-pres-btn');
      if (btn) btn.textContent = '⏸ Pause';
      _presTimer = setInterval(function() {
        _presElapsed++;
        // Bip aux transitions de phase
        if (_presElapsed === 120 || _presElapsed === 480) _beep(660, 0.3);
        var remaining = _PRES_TOTAL - _presElapsed;
        if (remaining <= 0) {
          clearInterval(_presTimer);
          _presRunning = false;
          remaining = 0;
          _doubleBeep();
          var btn2 = document.getElementById('oral-pres-btn');
          if (btn2) btn2.textContent = '✓ Terminé';
          var al = document.getElementById('oral-pres-alert');
          if (al) { al.textContent = '⏰ Temps de présentation écoulé !'; al.style.display = 'block'; }
        }
        _updatePresDisplay(remaining, _presElapsed);
      }, 1000);
    }
  }

  function _updatePresDisplay(remaining, elapsed) {
    var disp  = document.getElementById('oral-pres-display');
    var label = document.getElementById('oral-pres-phase-label');
    var bar   = document.getElementById('oral-pres-progress-bar');
    if (disp) {
      disp.textContent = _fmtTime(remaining);
      if (remaining <= 30)       disp.style.color = 'var(--danger)';
      else if (remaining <= 60)  disp.style.color = 'var(--warning)';
      else                       disp.style.color = '';
    }
    var phase = _getPresPhase(elapsed);
    if (label) label.textContent = '📍 ' + phase.name;
    if (bar) { bar.style.width = phase.pct + '%'; bar.style.background = phase.color; }
    document.querySelectorAll('.oral-phase-seg').forEach(function(el) {
      el.classList.toggle('active', el.dataset.phase === phase.key);
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
      if (_juryElapsed >= _JURY_TOTAL) return;
      // Initialise questions au premier lancement
      if (_juryQIdx === -1) { _shuffleQuestions(); _showCurrentQuestion(); }
      _juryRunning = true;
      var btn = document.getElementById('oral-jury-btn');
      if (btn) btn.textContent = '⏸ Pause';
      _juryTimer = setInterval(function() {
        _juryElapsed++;
        var remaining = _JURY_TOTAL - _juryElapsed;
        if (remaining <= 0) {
          clearInterval(_juryTimer);
          _juryRunning = false;
          remaining = 0;
          _doubleBeep();
          var btn2 = document.getElementById('oral-jury-btn');
          if (btn2) btn2.textContent = '✓ Terminé';
        }
        var disp = document.getElementById('oral-jury-display');
        if (disp) {
          disp.textContent = _fmtTime(remaining);
          if (remaining <= 60)       disp.style.color = 'var(--danger)';
          else if (remaining <= 120) disp.style.color = 'var(--warning)';
          else                       disp.style.color = '';
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

  // ── AI Plan feedback ───────────────────────────────────────────
  function submitPlan() {
    var plan = (document.getElementById('oral-plan') || {}).value;
    if (!plan || !plan.trim()) { alert('Écris d\'abord ton plan !'); return; }

    var prob = _PROBLEMS[_probId];
    var wrap = document.getElementById('oral-plan-feedback');
    var body = document.getElementById('oral-plan-feedback-body');
    if (!wrap || !body) return;

    wrap.style.display = 'block';
    body.innerHTML = '<div class="bac-correction-loading"><div class="bac-spinner"></div><span>Analyse en cours…</span></div>';

    var provId = localStorage.getItem('ifsi_ai_provider') || 'groq';
    var PROVIDERS = {
      groq:   { url: 'https://api.groq.com/openai/v1/chat/completions',  model: 'llama-3.1-70b-versatile', needsKey: true },
      ollama: { url: 'http://localhost:11434/v1/chat/completions',         model: 'llama3.1',                needsKey: false },
      openai: { url: 'https://api.openai.com/v1/chat/completions',         model: 'gpt-4o-mini',             needsKey: true }
    };
    var prov   = PROVIDERS[provId] || PROVIDERS['groq'];
    var apiKey = prov.needsKey ? (localStorage.getItem('ifsi_ai_apikey_' + provId) || '') : 'no-key';

    var systemPrompt = prob.aiContext +
      '\n\nTu dois évaluer le plan de présentation de l\'élève pour son Grand Oral (bac ST2S).' +
      '\nCritères :\n- Pertinence des axes par rapport à la problématique\n- Structure logique (intro / développement en 2-3 axes / conclusion)\n- Présence d\'arguments et d\'exemples concrets\n- Utilisation des notions ST2S (déterminants de santé, offre de soins, ISS, parcours de soins…)\n\nStructure ta réponse :\n**Points forts** : ce qui est bien\n**Points à améliorer** : ce qui manque ou est flou\n**Suggestions concrètes** : exemples, arguments, données à ajouter\n**Note globale** : X/5\n\nSois bienveillant mais précis. Réponds en français.';

    var userPrompt = 'Problématique : "' + prob.text + '"\n\nMon plan :\n' + plan.trim();

    fetch(prov.url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: prov.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    })
    .then(function(r) {
      if (!r.ok) return r.text().then(function(t) { throw new Error(r.status + ' — ' + t.slice(0, 200)); });
      return r.json();
    })
    .then(function(data) {
      var text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '(Pas de réponse)';
      body.innerHTML = _mdToHtml(text);
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(body, {
            delimiters: [{ left: '$', right: '$', display: false }],
            throwOnError: false
          });
        } catch(e) {}
      }
    })
    .catch(function(err) {
      body.innerHTML = '<div style="color:var(--danger);padding:12px">❌ Erreur : ' + _esc(String(err)) + '<br><br>Vérifie ta clé API dans ☁️ Sync → Correction Bac ST2S par IA.</div>';
    });
  }

  // ── Markdown → HTML ────────────────────────────────────────────
  function _mdToHtml(text) {
    var lines  = text.split('\n');
    var html   = '';
    var inUl   = false;
    var inOl   = false;

    function closeList() {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^### /.test(line)) { closeList(); html += '<h4 style="margin:.7em 0 .3em">' + _inlineMd(line.slice(4)) + '</h4>'; continue; }
      if (/^## /.test(line))  { closeList(); html += '<h3 style="margin:.8em 0 .3em">' + _inlineMd(line.slice(3)) + '</h3>'; continue; }
      if (/^# /.test(line))   { closeList(); html += '<h3 style="margin:.8em 0 .3em">' + _inlineMd(line.slice(2)) + '</h3>'; continue; }
      if (/^[-*•] /.test(line)) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul style="margin:.4em 0 .4em 1.2em;padding:0">'; inUl = true; }
        html += '<li style="margin:.2em 0">' + _inlineMd(line.replace(/^[-*•] /, '')) + '</li>'; continue;
      }
      if (/^\d+\. /.test(line)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol style="margin:.4em 0 .4em 1.2em;padding:0">'; inOl = true; }
        html += '<li style="margin:.2em 0">' + _inlineMd(line.replace(/^\d+\. /, '')) + '</li>'; continue;
      }
      closeList();
      if (line.trim() === '') { html += '<br>'; continue; }
      html += '<p style="margin:.35em 0">' + _inlineMd(line) + '</p>';
    }
    closeList();
    return html;
  }

  function _inlineMd(s) {
    // Protege les formules $...$ avant l'echappement
    var parts  = [];
    var result = '';
    var i = 0;
    while (i < s.length) {
      if (s[i] === '$') {
        var end = s.indexOf('$', i + 1);
        if (end !== -1) { parts.push({ math: true, val: s.slice(i, end + 1) }); i = end + 1; continue; }
      }
      var last = parts[parts.length - 1];
      if (last && !last.math) { last.val += s[i]; }
      else                    { parts.push({ math: false, val: s[i] }); }
      i++;
    }
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      if (p.math) {
        result += p.val; // KaTeX le rendra ensuite
      } else {
        result += _esc(p.val)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g,     '<em>$1</em>')
          .replace(/`(.+?)`/g,       '<code style="background:var(--gray-100);padding:1px 4px;border-radius:3px;font-size:.85em">$1</code>');
      }
    }
    return result;
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
    nextQuestion:     nextQuestion,
    submitPlan:       submitPlan
  };

})();
