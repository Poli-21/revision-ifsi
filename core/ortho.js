// core/ortho.js — Système d'entraînement à l'orthographe
'use strict';
window.App = window.App || {};

App.Ortho = (() => {
  let words      = [];
  let idx        = 0;
  let step       = 1;
  let spellTimer = null;

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

  // ── Étape 2 : Épeler ───────────────────────────────────────────
  function _showSpell(w) {
    if (spellTimer) { clearInterval(spellTimer); spellTimer = null; }
    _el('ortho-spell-continue').style.display = 'none';
    _el('ortho-spell-dir').textContent = '→ Avant';
    _animateSpell(w.term);
  }

  function _animateSpell(term) {
    const lettersEl = _el('ortho-spell-letters');
    const dirEl     = _el('ortho-spell-dir');
    const fwd = term.split('');
    const bwd = [...fwd].reverse();
    let fi = 0;

    // Phase avant
    spellTimer = setInterval(() => {
      lettersEl.innerHTML = fwd.slice(0, fi + 1).map((l, i) =>
        `<span class="spell-letter${i === fi ? ' spell-new' : ''}">${l}</span>`
      ).join('');
      fi++;
      if (fi >= fwd.length) {
        clearInterval(spellTimer);
        spellTimer = null;
        // Pause avant de passer à l'arrière
        setTimeout(() => {
          dirEl.textContent = '← Arrière';
          let bi = 0;
          spellTimer = setInterval(() => {
            lettersEl.innerHTML = bwd.slice(0, bi + 1).map((l, i) =>
              `<span class="spell-letter${i === bi ? ' spell-new' : ''}">${l}</span>`
            ).join('');
            bi++;
            if (bi >= bwd.length) {
              clearInterval(spellTimer);
              spellTimer = null;
              _el('ortho-spell-continue').style.display = 'inline-flex';
            }
          }, 340);
        }, 900);
      }
    }, 340);
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

  return { start, showStep, verify, nextWord, retry, reset, populateCatSelect };
})();
