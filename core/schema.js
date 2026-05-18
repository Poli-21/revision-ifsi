// core/schema.js — Mode d'entraînement par schéma
'use strict';
window.App = window.App || {};

App.Schema = (() => {
  let _schemas  = [];   // [{ img, cards[], cats[], label }]
  let _current  = null; // schéma en cours
  let _cards    = [];   // cartes du schéma courant (mélangées)
  let _idx      = 0;
  let _flipped  = false;
  let _results  = { ok: 0, review: 0 };

  // ── Construction de la liste des schémas ───────────────────────
  function _buildSchemas() {
    const { state } = App.Store;
    const map = new Map(); // key(img prefix) → { img, cards, cats }

    state.cards.forEach(c => {
      if (!c.customImage || c.suspended) return;
      const key = c.customImage.slice(0, 80); // prefix comme clé rapide
      if (!map.has(key)) {
        map.set(key, { img: c.customImage, cards: [], cats: new Set() });
      }
      const entry = map.get(key);
      entry.cards.push(c);
      if (c.cat) entry.cats.add(c.cat);
    });

    _schemas = Array.from(map.values()).map(e => ({
      img:   e.img,
      cards: e.cards,
      cats:  [...e.cats],
      label: e.cards[0]?.cat || 'Schéma'
    })).sort((a, b) => b.cards.length - a.cards.length);
  }

  // ── Vue galerie ────────────────────────────────────────────────
  function showGallery() {
    _buildSchemas();
    const view = _el('schema-gallery');
    const session = _el('schema-session');
    const done    = _el('schema-done');
    if (view)    view.style.display    = 'block';
    if (session) session.style.display = 'none';
    if (done)    done.style.display    = 'none';

    const grid = _el('schema-grid');
    if (!grid) return;

    if (_schemas.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-400)">
          <div style="font-size:3rem;margin-bottom:12px">🖼️</div>
          <p>Aucun schéma trouvé.</p>
          <p style="font-size:.85rem">Ajoute des images à tes cartes pour utiliser ce mode.</p>
        </div>`;
      return;
    }

    grid.innerHTML = _schemas.map((s, i) => {
      const due = s.cards.filter(c => {
        if (!c.progress) return true;
        const today = new Date().toISOString().slice(0,10);
        return (c.progress.nextReview || today) <= today;
      }).length;
      const dueBadge = due > 0
        ? `<span class="schema-due-badge">${due} à réviser</span>` : '';
      const cats = s.cats.slice(0,2).join(', ') + (s.cats.length > 2 ? '…' : '');
      return `
        <div class="schema-card" onclick="App.Schema.startSchema(${i})">
          <div class="schema-thumb-wrap">
            <img src="${s.img}" class="schema-thumb" alt="Schéma ${i+1}">
            ${dueBadge}
          </div>
          <div class="schema-card-info">
            <div class="schema-card-cat">${_esc(cats || s.label)}</div>
            <div class="schema-card-count">${s.cards.length} carte${s.cards.length > 1 ? 's' : ''}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Démarrage d'une session schéma ─────────────────────────────
  function startSchema(idx) {
    _current = _schemas[idx];
    if (!_current) return;

    // Mélange les cartes
    _cards   = [..._current.cards].sort(() => Math.random() - .5);
    _idx     = 0;
    _flipped = false;
    _results = { ok: 0, review: 0 };

    _el('schema-gallery').style.display = 'none';
    _el('schema-session').style.display = 'block';
    _el('schema-done').style.display    = 'none';

    // Affiche le schéma
    const imgEl = _el('schema-big-img');
    if (imgEl) imgEl.src = _current.img;

    _showCard();
  }

  // ── Affichage d'une carte ──────────────────────────────────────
  function _showCard() {
    if (_idx >= _cards.length) { _showDone(); return; }

    _flipped = false;
    const c = _cards[_idx];

    // Progress
    const pct = Math.round(_idx / _cards.length * 100);
    const fill = _el('schema-prog-fill');
    const cnt  = _el('schema-card-count-display');
    if (fill) fill.style.width = pct + '%';
    if (cnt)  cnt.textContent  = `${_idx + 1} / ${_cards.length}`;

    // Carte face avant
    const frontTerm = _el('sc-front-term');
    const frontCat  = _el('sc-front-cat');
    const frontHint = _el('sc-front-hint');
    if (frontTerm) frontTerm.textContent = c.term || '';
    if (frontCat)  frontCat.textContent  = c.cat  || '';
    if (frontHint) frontHint.style.display = 'block';

    // Carte face arrière
    const backDef  = _el('sc-back-def');
    const backTerm = _el('sc-back-term');
    const backCat  = _el('sc-back-cat');
    if (backDef)  backDef.textContent  = c.def  || '';
    if (backTerm) backTerm.textContent = c.term || '';
    if (backCat)  backCat.textContent  = c.cat  || '';

    // Reset flip
    const card = _el('schema-flashcard');
    if (card) card.classList.remove('flipped');

    // Boutons réponse masqués
    const btns = _el('schema-answer-btns');
    if (btns) btns.style.display = 'none';
  }

  // ── Retourner la carte ─────────────────────────────────────────
  function flip() {
    if (_flipped) return;
    _flipped = true;
    const card = _el('schema-flashcard');
    if (card) card.classList.add('flipped');
    const hint = _el('sc-front-hint');
    if (hint) hint.style.display = 'none';
    const btns = _el('schema-answer-btns');
    if (btns) btns.style.display = 'flex';
  }

  // ── Répondre (ok / à revoir) ───────────────────────────────────
  function answer(good) {
    if (!_flipped) return;
    if (good) _results.ok++;
    else      _results.review++;
    _idx++;
    _showCard();
  }

  // ── Fin de session ─────────────────────────────────────────────
  function _showDone() {
    _el('schema-session').style.display = 'none';
    _el('schema-done').style.display    = 'block';
    const total = _results.ok + _results.review;
    const pct   = total > 0 ? Math.round(_results.ok / total * 100) : 0;
    const okEl  = _el('schema-done-ok');
    const rvEl  = _el('schema-done-review');
    const pctEl = _el('schema-done-pct');
    if (okEl)  okEl.textContent  = _results.ok;
    if (rvEl)  rvEl.textContent  = _results.review;
    if (pctEl) pctEl.textContent = pct + '%';
  }

  function replay() { startSchema(_schemas.indexOf(_current)); }

  // ── Zoom image ─────────────────────────────────────────────────
  function toggleZoom() {
    const wrap = _el('schema-img-wrap');
    if (!wrap) return;
    wrap.classList.toggle('zoomed');
  }

  // ── Helpers ────────────────────────────────────────────────────
  function _el(id)  { return document.getElementById(id); }
  function _esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { showGallery, startSchema, flip, answer, replay, toggleZoom };
})();
