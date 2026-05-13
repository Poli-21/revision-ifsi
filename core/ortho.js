// core/ortho.js — Système d'entraînement à l'orthographe
'use strict';
window.App = window.App || {};

App.Ortho = (() => {
  let words      = [];
  let idx        = 0;
  let step       = 1;
  let spellTimer = null;

  // ── Reconnaissance vocale ──────────────────────────────────────
  let _recognition   = null;
  let _spellIdx      = 0;   // lettre attendue
  let _spellLetters  = [];
  let _spellDots     = [];  // 'pending' | 'ok' | 'err'
  let _micActive     = false;

  // Correspondance lettre → ce qu'on dit en français
  const LETTER_NAMES = {
    a:['a'],b:['bé','be','b'],c:['cé','ce','c','k'],d:['dé','de','d'],
    e:['e','euh','eu'],f:['effe','ef','f'],g:['gé','ge','g'],h:['ache','h'],
    i:['i'],j:['ji','j'],k:['ka','k'],l:['elle','el','l'],m:['emme','em','m'],
    n:['enne','en','n'],o:['o','oh'],p:['pé','pe','p'],q:['ku','cu','q'],
    r:['erre','er','r'],s:['esse','es','s'],t:['té','te','t'],u:['u'],
    v:['vé','ve','v'],w:['double vé','double-vé','doublevé','w'],
    x:['ixe','ix','x'],y:['i grec','igrec','y'],z:['zède','zed','z']
  };

  function _baseChar(ch) {
    return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function _matchLetter(spoken, expected) {
    const base    = _baseChar(expected);
    const names   = LETTER_NAMES[base] || [base];
    const spokenN = spoken.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    return names.some(n => spokenN === n || spokenN === _baseChar(expected));
  }

  // ── Démarrage ──────────────────────────────────────────────────
  function populateCatSelect() {
    const sel = document.getElementById('ortho-cat-select');
    if (!sel) return;
    const cats = App.Render.orderedCats();
    sel.innerHTML = '<option value="">Toutes les matières</option>' +
      cats.map(c => `<option value="${_esc(c)}">${_esc(c)}</option>`).join('');
  }

  function start() {
    const catSel = document.getElementById('ortho-cat-select')?.value || '';
    let cards = App.Store.state.cards.filter(c => !c.suspended && c.term && c.term.trim());
    if (catSel) cards = cards.filter(c => c.cat === catSel);
    if (cards.length === 0) { alert('Aucune carte dans cette matière.'); return; }

    // Mélange aléatoire
    words = [...cards].sort(() => Math.random() - .5);
    idx   = 0;

    _el('ortho-setup').style.display    = 'none';
    _el('ortho-done').style.display     = 'none';
    _el('ortho-practice').style.display = 'block';
    showStep(1);
  }

  // ── Navigation entre étapes ─────────────────────────────────────
  function showStep(n) {
    step = n;
    [1,2,3,4,5].forEach(i => {
      const el = _el(`ortho-step${i}`);
      if (el) el.style.display = i === n ? 'block' : 'none';
    });
    _updateProgress();

    const w = words[idx];
    if      (n === 1) _showExamine(w);
    else if (n === 2) _showSpell(w);
    else if (n === 3) _showCopy(w);
    else if (n === 4) _showMemory(w);
  }

  // ── Étape 1 : Examiner ─────────────────────────────────────────
  function _showExamine(w) {
    _el('ortho-word-display').textContent = w.term;
    _el('ortho-def-display').textContent  = w.def;
    _el('ortho-cat-display').textContent  = w.cat;
  }

  // ── Étape 2 : Épeler (vocal) ───────────────────────────────────
  function _showSpell(w) {
    if (spellTimer) { clearInterval(spellTimer); spellTimer = null; }
    _stopMic();
    _spellLetters = w.term.split('');
    _spellIdx     = 0;
    _spellDots    = _spellLetters.map(() => 'pending');

    _el('ortho-spell-word').textContent    = w.term;
    _el('ortho-spell-continue').style.display = 'none';
    _el('ortho-spell-feedback').textContent   = '';
    _renderSpellDots();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      _el('ortho-mic-btn').style.display = 'none';
      _el('ortho-spell-feedback').textContent = '⚠️ Micro non disponible sur ce navigateur';
      _el('ortho-spell-continue').style.display = 'inline-flex';
      return;
    }
    _el('ortho-mic-btn').style.display = 'inline-flex';
    _el('ortho-mic-btn').textContent   = '🎤 Commencer à épeler';
    _el('ortho-mic-btn').className     = 'ortho-mic-btn';
  }

  function _renderSpellDots() {
    const el = _el('ortho-spell-dots');
    if (!el) return;
    el.innerHTML = _spellLetters.map((ch, i) => {
      const st = _spellDots[i];
      const cls = st === 'ok' ? 'spell-dot ok' : st === 'err' ? 'spell-dot err' : 'spell-dot';
      return `<span class="${cls}">${st === 'pending' ? '·' : st === 'ok' ? '✓' : '✗'}</span>`;
    }).join('');
  }

  function toggleMic() {
    if (_micActive) { _stopMic(); return; }
    _startMic();
  }

  function _startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    _recognition = new SR();
    _recognition.lang            = 'fr-FR';
    _recognition.continuous      = false;
    _recognition.interimResults  = false;
    _recognition.maxAlternatives = 5;

    _recognition.onstart = () => {
      _micActive = true;
      const btn = _el('ortho-mic-btn');
      if (btn) { btn.textContent = '🔴 En écoute…'; btn.className = 'ortho-mic-btn listening'; }
    };

    _recognition.onresult = (e) => {
      const results = Array.from(e.results[0]).map(r => r.transcript);
      const expected = _spellLetters[_spellIdx];
      const matched  = results.some(r => _matchLetter(r, expected));

      if (matched) {
        _spellDots[_spellIdx] = 'ok';
        _spellIdx++;
        _el('ortho-spell-feedback').textContent = '✅ ' + expected.toUpperCase();
        _el('ortho-spell-feedback').style.color = '#16a34a';
      } else {
        _spellDots[_spellIdx] = 'err';
        _spellIdx++;
        _el('ortho-spell-feedback').textContent = '❌ Attendu : ' + expected.toUpperCase();
        _el('ortho-spell-feedback').style.color = '#dc2626';
      }
      _renderSpellDots();

      if (_spellIdx >= _spellLetters.length) {
        _stopMic();
        const allOk = _spellDots.every(d => d === 'ok');
        _el('ortho-spell-feedback').textContent = allOk ? '🎉 Parfait !' : '🔁 Quelques erreurs — regarde les croix';
        _el('ortho-spell-feedback').style.color = allOk ? '#16a34a' : '#d97706';
        _el('ortho-spell-continue').style.display = 'inline-flex';
        return;
      }
      // Relance l'écoute pour la lettre suivante
      setTimeout(_startMic, 400);
    };

    _recognition.onerror = () => { _stopMic(); };
    _recognition.onend   = () => { _micActive = false; };
    _recognition.start();
  }

  function _stopMic() {
    if (_recognition) { try { _recognition.stop(); } catch(e) {} _recognition = null; }
    _micActive = false;
    const btn = _el('ortho-mic-btn');
    if (btn) { btn.textContent = '🎤 Commencer à épeler'; btn.className = 'ortho-mic-btn'; }
  }

  // ── Étape 3 : Copier ───────────────────────────────────────────
  function _showCopy(w) {
    _el('ortho-copy-ref').textContent = w.term;
    _el('ortho-copy-feedback').innerHTML = w.term.split('').map(ch =>
      `<span class="copy-ch copy-pending">${_esc(ch)}</span>`
    ).join('');
    _el('ortho-copy-next').style.display = 'none';
    const inp = _el('ortho-copy-input');
    inp.value = '';
    inp.disabled = false;
    inp.oninput = () => _checkCopyLive(w.term, inp.value);
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); if (_el('ortho-copy-next').style.display !== 'none') showStep(4); } };
    setTimeout(() => inp.focus(), 50);
  }

  function _checkCopyLive(target, val) {
    const tc = target.split('');
    const uc = val.split('');
    _el('ortho-copy-feedback').innerHTML = tc.map((ch, i) => {
      if (i >= uc.length)              return `<span class="copy-ch copy-pending">${_esc(ch)}</span>`;
      if (uc[i].toLowerCase() === ch.toLowerCase()) return `<span class="copy-ch copy-ok">${_esc(ch)}</span>`;
      return `<span class="copy-ch copy-err">${_esc(uc[i])}</span>`;
    }).join('') + (uc.length > tc.length
      ? `<span class="copy-ch copy-err" style="font-size:.8em">+${uc.length - tc.length}</span>` : '');

    const correct = val.toLowerCase() === target.toLowerCase();
    _el('ortho-copy-next').style.display = correct ? 'inline-flex' : 'none';
  }

  // ── Étape 4 : Écrire de mémoire ────────────────────────────────
  function _showMemory(w) {
    const len = w.term.length;
    _el('ortho-memory-hint').textContent = `${len} lettre${len > 1 ? 's' : ''}`;
    _el('ortho-memory-blanks').textContent = '_ '.repeat(len).trim();
    const inp = _el('ortho-memory-input');
    inp.value = '';
    inp.disabled = false;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); verify(); } };
    setTimeout(() => inp.focus(), 50);
  }

  // ── Étape 5 : Vérifier ─────────────────────────────────────────
  function verify() {
    const w       = words[idx];
    const target  = w.term.trim();
    const userAns = (_el('ortho-memory-input')?.value || '').trim();
    if (!userAns) { _el('ortho-memory-input')?.focus(); return; }

    const correct = userAns.toLowerCase() === target.toLowerCase();
    const resEl   = _el('ortho-result');

    if (correct) {
      resEl.innerHTML = `
        <div class="ortho-badge ortho-ok">✅ Parfait !</div>
        <div class="ortho-result-word">${_esc(target)}</div>`;
      _el('ortho-next-btn').style.display  = 'inline-flex';
      _el('ortho-retry-btn').style.display = 'none';
    } else {
      const diff = _buildDiff(target, userAns);
      resEl.innerHTML = `
        <div class="ortho-badge ortho-fail">❌ Pas tout à fait</div>
        <div class="ortho-result-compare">
          <div><span class="ortho-lbl">Ta réponse :</span><span class="diff-row">${diff.user}</span></div>
          <div><span class="ortho-lbl">Correct :</span><span class="diff-row">${diff.correct}</span></div>
        </div>`;
      _el('ortho-next-btn').style.display  = 'none';
      _el('ortho-retry-btn').style.display = 'inline-flex';
    }

    [1,2,3,4].forEach(i => { const e = _el(`ortho-step${i}`); if (e) e.style.display = 'none'; });
    _el('ortho-step5').style.display = 'block';
    _updateProgress();
  }

  function _buildDiff(target, user) {
    const tc = target.split('');
    const uc = user.split('');
    const correctHtml = tc.map((ch, i) => {
      const match = uc[i] && uc[i].toLowerCase() === ch.toLowerCase();
      return `<span class="${match ? 'diff-ok' : 'diff-err'}">${_esc(ch)}</span>`;
    }).join('');
    const userHtml = tc.map((ch, i) => {
      if (!uc[i]) return `<span class="diff-missing">_</span>`;
      return `<span class="${uc[i].toLowerCase() === ch.toLowerCase() ? 'diff-ok' : 'diff-err'}">${_esc(uc[i])}</span>`;
    }).join('') + uc.slice(tc.length).map(ch => `<span class="diff-extra">${_esc(ch)}</span>`).join('');
    return { correct: correctHtml, user: userHtml };
  }

  // ── Mot suivant / Recommencer ───────────────────────────────────
  function nextWord() {
    if (spellTimer) { clearInterval(spellTimer); spellTimer = null; }
    idx++;
    if (idx >= words.length) { _showDone(); return; }
    showStep(1);
  }

  function retry() {
    if (spellTimer) { clearInterval(spellTimer); spellTimer = null; }
    showStep(1);
  }

  function _showDone() {
    _el('ortho-practice').style.display = 'none';
    _el('ortho-done').style.display     = 'block';
    _el('ortho-done-count').textContent = words.length;
  }

  function reset() {
    if (spellTimer) { clearInterval(spellTimer); spellTimer = null; }
    _el('ortho-setup').style.display    = 'block';
    _el('ortho-practice').style.display = 'none';
    _el('ortho-done').style.display     = 'none';
    populateCatSelect();
  }

  // ── Helpers ────────────────────────────────────────────────────
  function _updateProgress() {
    const total = words.length;
    const pct   = total > 0 ? Math.round(idx / total * 100) : 0;
    const fill  = _el('ortho-progress-fill');
    const cnt   = _el('ortho-word-count');
    if (fill) fill.style.width = pct + '%';
    if (cnt)  cnt.textContent  = `${idx + 1} / ${total}`;

    // Dots d'étapes
    const labels = ['','Examiner','Épeler','Copier','Mémoriser','Vérifier'];
    [1,2,3,4,5].forEach(i => {
      const dot = _el(`ortho-dot${i}`);
      if (!dot) return;
      dot.className = 'ortho-dot' + (i < step ? ' done' : i === step ? ' active' : '');
      dot.title = labels[i];
    });
  }

  function _el(id)  { return document.getElementById(id); }
  function _esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { start, showStep, verify, nextWord, retry, reset, populateCatSelect, toggleMic };
})();
