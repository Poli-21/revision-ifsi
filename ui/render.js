// ui/render.js — Rendu de l'interface
'use strict';
window.App = window.App || {};

App.Render = (() => {
  let searchTimer = null;

  // ── Render principal ───────────────────────────────────────────
  // Retourne les catégories dans l'ordre personnalisé (nouvelles catégories ajoutées à la fin)
  function orderedCats() {
    // Déduplique après normalisation : si deux noms normalisés sont identiques, fusionne
    const norm = App.Store.normCat;
    const allRaw = [...new Set(App.Store.state.cards.map(c => c.cat))];

    // Construit une map normalisé → premier nom canonique trouvé
    const canonical = {};
    allRaw.forEach(cat => {
      const key = norm(cat);
      if (!canonical[key]) canonical[key] = cat;
    });

    // Si des doublons normalisés existent, renomme les cartes vers le nom canonique
    let dirty = false;
    App.Store.state.cards.forEach(c => {
      const key  = norm(c.cat);
      const good = canonical[key];
      if (good && c.cat !== good) { c.cat = good; dirty = true; }
    });
    if (dirty) { App.Store.save(); App.Store.saveOrder(); }

    const allCats = [...new Set(App.Store.state.cards.map(c => c.cat))];
    const saved   = [...new Set(App.Store.state.catOrder.filter(c => allCats.includes(c)))];
    const newCats = allCats.filter(c => !saved.includes(c)).sort();
    return [...saved, ...newCats];
  }

  function all() {
    const { state } = App.Store;
    const { SRS } = App;
    const due  = state.cards.filter(c => SRS.isDue(c));
    const cats = orderedCats();

    // Stats sidebar
    _setText('stat-due',   due.length);
    _setText('stat-new',   state.cards.filter(c => !c.progress && !c.suspended).length);
    _setText('stat-total', state.cards.length);

    // Streak
    const streak = App.Store.getStreak();
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak} jour${streak > 1 ? 's' : ''}` : '—';

    // Temps aujourd'hui
    const todayKey   = new Date().toISOString().slice(0, 10);
    const todaySecs  = state.studyLog[todayKey]?.seconds || 0;
    const timeEl     = document.getElementById('stat-time');
    if (timeEl) {
      if (todaySecs < 60)        timeEl.textContent = todaySecs > 0 ? `${todaySecs}s` : '—';
      else if (todaySecs < 3600) timeEl.textContent = `${Math.floor(todaySecs / 60)}min`;
      else {
        const h = Math.floor(todaySecs / 3600);
        const m = Math.floor((todaySecs % 3600) / 60);
        timeEl.textContent = m > 0 ? `${h}h${m}min` : `${h}h`;
      }
    }

    // Estimation inline dans le bandeau
    const dueEstEl = document.getElementById('due-est-inline');
    if (dueEstEl) {
      if (due.length === 0) {
        dueEstEl.style.display = 'none';
      } else {
        const BASE_SECS = [65, 50, 38, 30, 24, 18, 14, 11];
        let estSecs = 0;
        due.forEach(card => {
          const level  = SRS.getLevel(card);
          const ef     = card.progress?.easeFactor ?? 2.5;
          const lapses = card.progress?.lapses      ?? 0;
          let t = BASE_SECS[level];
          if      (ef < 1.5) t += 25;
          else if (ef < 1.8) t += 15;
          else if (ef < 2.1) t +=  7;
          else if (ef > 2.4) t -=  4;
          if      (lapses >= 5) t += 18;
          else if (lapses >= 3) t += 10;
          estSecs += Math.max(8, t);
        });
        let estTxt;
        if      (estSecs < 60)   estTxt = `~${estSecs}s`;
        else if (estSecs < 3600) estTxt = `~${Math.round(estSecs / 60)}min`;
        else {
          const h = Math.floor(estSecs / 3600);
          const m = Math.round((estSecs % 3600) / 60);
          estTxt = m > 0 ? `~${h}h${m}min` : `~${h}h`;
        }
        dueEstEl.textContent = estTxt;
        dueEstEl.style.display = 'inline';
      }
    }

    // ── Examens ────────────────────────────────────────────────
    _renderExamDate(state);

    // Bandeau du jour
    _setText('due-count', due.length);
    const chips = document.getElementById('cat-due-chips');
    if (chips) {
      const selCats  = App.UI.selectedCats;
      const dueCats  = cats.filter(cat => state.cards.some(c => c.cat === cat && SRS.isDue(c)));

      // Groupe les chips par parent (séparateur " > ")
      const groups  = {};   // parent → [fullCat, ...]
      const simples = [];
      dueCats.forEach(cat => {
        const sep = cat.indexOf(' > ');
        if (sep !== -1) {
          const p = cat.slice(0, sep);
          if (!groups[p]) groups[p] = [];
          groups[p].push(cat);
        } else simples.push(cat);
      });

      // Construit l'ordre des blocs top-level (simples + parents)
      const topSeen = new Set();
      const topOrder = [];
      dueCats.forEach(cat => {
        const sep = cat.indexOf(' > ');
        const top = sep !== -1 ? cat.slice(0, sep) : cat;
        if (!topSeen.has(top)) { topSeen.add(top); topOrder.push(top); }
      });

      let html = topOrder.map(top => {
        if (groups[top]) {
          // ── Groupe ──
          const children = groups[top];
          const totalDue = children.reduce((s, c) => s + state.cards.filter(x => x.cat === c && SRS.isDue(x)).length, 0);
          const allSel   = children.every(c => selCats.has(c));
          const someSel  = children.some(c => selCats.has(c));
          const groupSel = allSel ? ' selected' : someSel ? ' partial' : '';
          const childrenHTML = children.map(cat => {
            const nd  = state.cards.filter(c => c.cat === cat && SRS.isDue(c)).length;
            const lbl = cat.slice(top.length + 3);
            const sel = selCats.has(cat) ? ' selected' : '';
            return `<button class="cat-due-chip chip-child${sel}" data-cat="${_esc(cat)}" onclick="toggleCatSelection('${_esc(cat)}')">${_esc(lbl)}<span class="chip-n">${nd}</span></button>`;
          }).join('');
          return `<div class="chip-group">
            <div class="chip-group-header">
              <button class="cat-due-chip chip-parent${groupSel}" data-cat="${_esc(top)}" onclick="toggleGroupChips('${_esc(top)}')">${_esc(top)}<span class="chip-n">${totalDue}</span><span class="chip-arrow">▾</span></button>
            </div>
            <div class="chip-group-children" id="chipg-${_esc(top)}">${childrenHTML}</div>
          </div>`;
        } else {
          // ── Simple ──
          const nd  = state.cards.filter(c => c.cat === top && SRS.isDue(c)).length;
          const sel = selCats.has(top) ? ' selected' : '';
          return `<button class="cat-due-chip${sel}" data-cat="${_esc(top)}" onclick="toggleCatSelection('${_esc(top)}')">${_esc(top)}<span class="chip-n">${nd}</span></button>`;
        }
      }).join('');

      html += `<button id="start-selection-btn" class="cat-sel-start-btn" onclick="startSelectedCats()" style="display:none">Réviser la sélection →</button>`;
      chips.innerHTML = html;
    }

    // Sidebar catégories
    const catList = document.getElementById('cat-list');
    if (catList) {
      catList.innerHTML =
        `<button class="cat-pill ${App.UI.activeCategory === '' ? 'active' : ''}" onclick="setCategory('')">Toutes <span class="cat-count">${state.cards.length}</span></button>` +
        _catListHTML(cats, state, SRS);
    }

    // Filtres cat dans browse
    const fc = document.getElementById('filter-cat');
    if (fc) {
      const cv = fc.value;
      fc.innerHTML = '<option value="">Toutes les matières</option>' +
        cats.map(c => `<option value="${_esc(c)}" ${cv === c ? 'selected' : ''}>${_esc(c)}</option>`).join('');
    }

    // Barres de niveaux
    const lc = Array(8).fill(0);
    state.cards.forEach(c => lc[SRS.getLevel(c)]++);
    const mx = Math.max(...lc, 1);
    const levelEl = document.getElementById('level-bars');
    if (levelEl) {
      levelEl.innerHTML = lc.map((n, i) =>
        `<div class="level-row"><span class="level-label">${SRS.LABELS[i]}</span>
         <div class="level-track"><div class="level-fill" style="width:${n/mx*100}%;background:${SRS.COLORS[i]}"></div></div>
         <span class="level-num">${n}</span></div>`
      ).join('');
    }

    // Prochaines révisions
    const upcoming = state.cards
      .filter(c => c.progress && !SRS.isDue(c) && !c.suspended)
      .sort((a, b) => a.progress.nextReview.localeCompare(b.progress.nextReview))
      .slice(0, 9);
    const upGrid = document.getElementById('upcoming-grid');
    if (upGrid) upGrid.innerHTML = upcoming.length
      ? upcoming.map(cardItemHTML).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="icon">✅</div>Toutes tes cartes sont à jour !</div>`;

    browse();
    if (App.UI.currentTab === 'stats') { stats(); heatmap(); }
    _initCatDrag();
  }

  // ── Browse ─────────────────────────────────────────────────────
  function browse() {
    const q   = (document.getElementById('search-input')?.value || '').toLowerCase();
    const cat = document.getElementById('filter-cat')?.value || '';
    const lv  = document.getElementById('filter-level')?.value;
    const showSuspended = document.getElementById('filter-suspended')?.checked;
    let cards = App.Store.state.cards;
    if (App.UI.activeCategory) cards = cards.filter(c => c.cat === App.UI.activeCategory);
    if (cat)  cards = cards.filter(c => c.cat === cat);
    if (!showSuspended) cards = cards.filter(c => !c.suspended);
    if (lv !== '' && lv !== undefined) cards = cards.filter(c => App.SRS.getLevel(c) === parseInt(lv));
    if (q)    cards = cards.filter(c => c.term.toLowerCase().includes(q) || c.def.toLowerCase().includes(q));
    const grid = document.getElementById('browse-grid');
    if (grid) grid.innerHTML = cards.length
      ? cards.map(cardItemHTML).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="icon">🔍</div>Aucune carte trouvée</div>`;
  }

  function browseDebounced() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(browse, 160);
  }

  // ── Statistiques / Prévision ───────────────────────────────────
  function stats() {
    const { state } = App.Store;
    const { SRS } = App;
    const counts   = SRS.forecast(state.cards, 14);
    const maxCount = Math.max(...counts, 1);

    // Graphique prévision
    const forecastEl = document.getElementById('forecast-bars');
    if (forecastEl) {
      const BAR_MAX_PX = 78;
      const days = ['Auj.','Dem.','J+2','J+3','J+4','J+5','J+6','J+7','J+8','J+9','J+10','J+11','J+12','J+13'];
      forecastEl.innerHTML = counts.map((n, i) => {
        const px = n > 0 ? Math.max(4, Math.round(n / maxCount * BAR_MAX_PX)) : 2;
        const isToday = i === 0;
        return `<div class="forecast-col" title="${n} carte${n!==1?'s':''} le ${days[i]}">
          <div class="forecast-bar-wrap">
            <div class="forecast-bar${isToday?' is-today':''}" style="height:${px}px"></div>
          </div>
          <div class="forecast-label" style="${isToday?'color:#d97706;font-weight:700':''}">${days[i]}</div>
          <div class="forecast-n" style="${isToday?'color:#d97706':''}${n===0?';opacity:0':''}">${n}</div>
        </div>`;
      }).join('');
    }

    // Cartes les plus difficiles (EF le plus bas)
    const hardest = state.cards
      .filter(c => c.progress && c.progress.easeFactor < 2.0)
      .sort((a, b) => a.progress.easeFactor - b.progress.easeFactor)
      .slice(0, 5);
    const hardEl = document.getElementById('hardest-cards');
    if (hardEl) {
      hardEl.innerHTML = hardest.length
        ? hardest.map(c => `
          <div class="hard-card-row" onclick="openCardDetail('${c.id}')">
            <span class="hard-term">${_esc(c.term)}</span>
            <span class="hard-cat badge badge-blue">${_esc(c.cat)}</span>
            <span class="hard-ef" style="color:var(--danger)">EF ${c.progress.easeFactor}</span>
          </div>`).join('')
        : '<p style="color:var(--gray-400);font-size:.85rem">Aucune carte difficile — bien joué !</p>';
    }

    // Résumé global
    _setText('stats-total', state.cards.length);
    _setText('stats-due',   state.cards.filter(c => SRS.isDue(c)).length);
    _setText('stats-mastered', state.cards.filter(c => SRS.getLevel(c) >= 7).length);
    const withProg = state.cards.filter(c => c.progress);
    const avgEF = withProg.length
      ? (withProg.reduce((s, c) => s + c.progress.easeFactor, 0) / withProg.length).toFixed(2)
      : '—';
    _setText('stats-avg-ef', avgEF);
    heatmap();
  }

  // ── cardItemHTML ───────────────────────────────────────────────
  function cardItemHTML(c) {
    const level = App.SRS.getLevel(c);
    const due   = App.SRS.isDue(c);
    const nextStr = c.progress ? `Prochaine : ${c.progress.nextReview}` : 'Nouveau';
    let imgHtml = '';
    if (c.image && App.SVG[c.image]) imgHtml = `<div class="img-thumb">${App.SVG[c.image]}</div>`;
    else if (c.customImage)          imgHtml = `<div class="img-thumb"><img src="${c.customImage}" style="max-height:88px;max-width:100%;object-fit:contain;border-radius:4px"></div>`;
    const lapses     = c.progress?.lapses || 0;
    const isLeech    = c.progress?.isLeech || false;
    const efBadge    = c.progress ? `<span class="ef-badge" title="Ease factor · ${lapses} échec(s)">${c.progress.easeFactor}</span>` : '';
    const suspBadge  = c.suspended ? `<span class="badge" style="background:#f3f4f6;color:#9ca3af">⏸ Suspendu</span>` : '';
    const leechBadge = isLeech ? `<span class="badge badge-leech" title="${lapses} échecs · carte à retravailler">🩸 Difficile</span>` : '';
    return `<div class="card-item ${c.suspended ? 'suspended' : ''}${isLeech ? ' is-leech' : ''}" data-id="${c.id}" onclick="event.currentTarget.closest('.select-mode')?toggleCardSelect('${c.id}',event):openCardDetail('${c.id}')">
      <button class="card-delete-btn" onclick="deleteCard('${c.id}',event)" title="Supprimer">✕</button>
      ${imgHtml}
      <div class="term">${_esc(c.term)}</div>
      <div class="def-preview">${_esc(c.def.slice(0,90))}${c.def.length>90?'…':''}</div>
      <div class="meta">
        <span class="badge badge-blue">${_esc(c.cat)}</span>
        <span class="badge" style="background:${App.SRS.COLORS[level]}22;color:${App.SRS.COLORS[level]}">${App.SRS.LABELS[level]}</span>
        ${due && !c.suspended ? '<span class="badge badge-red">À réviser</span>' : ''}
        ${suspBadge}${leechBadge}
        ${efBadge}
        <span class="next-review">${nextStr}</span>
      </div>
    </div>`;
  }

  // ── Drag & drop catégories ─────────────────────────────────────
  function _initCatDrag() {
    const list = document.getElementById('cat-list');
    if (!list) return;
    let dragTop = null;

    const clearAll = () => {
      list.querySelectorAll('.cat-drop-line').forEach(l => l.classList.remove('active'));
      list.querySelectorAll('.cat-pill-row').forEach(r => r.classList.remove('drop-nest'));
    };

    // ── Départ du drag ──
    list.querySelectorAll('.cat-pill-row[draggable]').forEach(row => {
      row.addEventListener('dragstart', e => {
        dragTop = row.dataset.dragTop;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => row.classList.add('dragging'), 0);
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        clearAll();
        dragTop = null;
      });

      // ── Dépôt SUR une ligne = imbriquer ──
      row.addEventListener('dragover', e => {
        if (!dragTop || row.dataset.dragTop === dragTop) return;
        e.preventDefault();
        e.stopPropagation();   // empêche l'activation des drop-lines en dessous
        clearAll();
        row.classList.add('drop-nest');
        e.dataTransfer.dropEffect = 'move';
      });
      row.addEventListener('dragleave', e => {
        // Ne retire le highlight que si on quitte vraiment le row
        if (!row.contains(e.relatedTarget)) row.classList.remove('drop-nest');
      });
      row.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        row.classList.remove('drop-nest');
        if (!dragTop) return;
        const targetTop = row.dataset.dragTop;
        if (targetTop && targetTop !== dragTop) App.UI.nestCatInto(dragTop, targetTop);
      });
    });

    // ── Dépôt ENTRE les lignes = réordonner ──
    list.querySelectorAll('.cat-drop-line').forEach(line => {
      line.addEventListener('dragover', e => {
        e.preventDefault();
        clearAll();
        line.classList.add('active');
      });
      line.addEventListener('dragleave', () => line.classList.remove('active'));
      line.addEventListener('drop', e => {
        e.preventDefault();
        line.classList.remove('active');
        if (!dragTop) return;
        App.UI.moveCatTo(dragTop, line.dataset.dropTop);
      });
    });
  }

  // ── Rendu de la liste des catégories (avec groupes) ───────────
  function _catListHTML(cats, state, SRS) {
    const opened = App.UI.openedGroups;

    // Sépare les cats groupées ("Parent > Enfant") des cats simples
    const groups  = {};   // parent → [fullCatName, ...]
    const simples = [];   // cats sans " > "

    cats.forEach(cat => {
      const sep = cat.indexOf(' > ');
      if (sep !== -1) {
        const parent = cat.slice(0, sep);
        if (!groups[parent]) groups[parent] = [];
        groups[parent].push(cat);
      } else {
        simples.push(cat);
      }
    });

    let html = '';
    let flatIdx = 0; // pour ▲▼ sur les éléments de premier niveau
    const topLevel = []; // ordre des éléments top-level (simples + parents de groupes)

    // Reconstitue l'ordre top-level en suivant l'ordre de cats
    const seen = new Set();
    cats.forEach(cat => {
      const sep = cat.indexOf(' > ');
      const top = sep !== -1 ? cat.slice(0, sep) : cat;
      if (!seen.has(top)) { seen.add(top); topLevel.push(top); }
    });

    topLevel.forEach((top, ti) => {
      const isGroup = !!groups[top];
      const handle  = `<span class="cat-drag-handle" title="Glisser pour réordonner">⠿</span>`;

      // Ligne de dépôt avant chaque élément
      html += `<div class="cat-drop-line" data-drop-top="${_esc(top)}"></div>`;

      if (isGroup) {
        const children = groups[top];
        const totalN   = children.reduce((s, c) => s + state.cards.filter(x => x.cat === c).length, 0);
        const totalDue = children.reduce((s, c) => s + state.cards.filter(x => x.cat === c && SRS.isDue(x)).length, 0);
        const isOpen   = opened.has(top);
        const dueBadge = totalDue > 0 ? `<span class="due-badge">${totalDue}</span>` : '';

        html += `<div class="cat-pill-row" draggable="true" data-drag-top="${_esc(top)}">
          ${handle}
          <button id="cgh-${_esc(top)}" class="cat-group-header ${isOpen ? 'open' : ''}" onclick="toggleGroup('${_esc(top)}')">
            <span class="cgh-arrow">▶</span>
            <span class="cgh-name">${_esc(top)}</span>
            <span class="cgh-badges">
              ${dueBadge}
              <span class="cat-count">${totalN}</span>
              <button class="cat-group-btn" onclick="event.stopPropagation();startGroupSession('${_esc(top)}')" title="Réviser tout le groupe">▶</button>
            </span>
          </button>
        </div>
        <div id="cg-${_esc(top)}" class="cat-group-children ${isOpen ? '' : 'collapsed'}" style="${isOpen ? '' : 'max-height:0'}">
          ${children.map((cat, ci) => {
            const n  = state.cards.filter(c => c.cat === cat).length;
            const nd = state.cards.filter(c => c.cat === cat && SRS.isDue(c)).length;
            const badge = nd > 0 ? `<span class="due-badge">${nd}</span>` : '';
            const label = cat.slice(top.length + 3);
            return `<div class="cat-pill-row" draggable="true" data-drag-top="${_esc(top)}" data-drag-child="${_esc(cat)}">
              <span class="cat-drag-handle" title="Glisser">⠿</span>
              <button class="cat-pill ${App.UI.activeCategory === cat ? 'active' : ''}" onclick="handleCatClick('${_esc(cat)}',event,this)" title="Double-clic pour renommer">${_esc(label)}${badge}<span class="cat-count">${n}</span></button>
              <button class="cat-unnest-btn" onclick="unnestCat('${_esc(cat)}')" title="Retirer du groupe">↑</button>
              <button class="cat-delete-btn" data-cat="${_esc(cat)}" onclick="event.stopPropagation();deleteCat(this.dataset.cat,this)" title="Supprimer cette matière">🗑</button>
            </div>`;
          }).join('')}
        </div>`;
      } else {
        const cat = top;
        const n   = state.cards.filter(c => c.cat === cat).length;
        const nd  = state.cards.filter(c => c.cat === cat && SRS.isDue(c)).length;
        const badge = nd > 0 ? `<span class="due-badge">${nd}</span>` : '';
        html += `<div class="cat-pill-row" draggable="true" data-drag-top="${_esc(cat)}">
          ${handle}
          <button class="cat-pill ${App.UI.activeCategory === cat ? 'active' : ''}" onclick="handleCatClick('${_esc(cat)}',event,this)" title="Double-clic pour renommer">${_esc(cat)}${badge}<span class="cat-count">${n}</span></button>
          <button class="cat-delete-btn" data-cat="${_esc(cat)}" onclick="event.stopPropagation();deleteCat(this.dataset.cat,this)" title="Supprimer cette matière">🗑</button>
        </div>`;
      }
    });
    // Ligne de dépôt finale
    html += `<div class="cat-drop-line" data-drop-top="__end__"></div>`;

    return html;
  }

  function _setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }


  // ── Heatmap / Prévision ────────────────────────────────────────
  function heatmap() {
    const log   = App.Store.state.studyLog;
    const today = new Date();
    const todayKey = today.toISOString().slice(0,10);

    // ── Données de base ──
    const totalCards = Object.values(log).reduce((s,e) => s + (e.reviewed||0), 0);
    const activeDays = Object.values(log).filter(e => (e.reviewed||0) > 0).length;
    const streak     = App.Store.getStreak();
    const dueToday   = App.Store.state.cards.filter(c => App.SRS.isDue(c)).length;

    const fmtFull = s => {
      if (s === 0) return '—';
      const m = Math.floor(s/60), h = Math.floor(m/60), rm = m%60;
      return h > 0 ? `${h}h${rm>0?rm+'min':''}` : `${m}min`;
    };

    // ── Prévision 14 jours (cœur de la section) ──
    // forecast() compte nextReview==today, mais isDue() inclut aussi les cartes en retard
    // → on remplace counts[0] par le vrai nombre de cartes dues aujourd'hui
    const forecast14 = App.SRS.forecast(App.Store.state.cards, 14);
    forecast14[0] = dueToday; // synchronise avec la vraie valeur "à réviser maintenant"
    const maxFc = Math.max(...forecast14, 1);
    const FC_BAR_PX = 56;
    const fcDayNames = ['Auj.','Dem.','J+2','J+3','J+4','J+5','J+6','J+7','J+8','J+9','J+10','J+11','J+12','J+13'];

    const fcBarsHTML = forecast14.map((n, i) => {
      const px = n > 0 ? Math.max(4, Math.round(n / maxFc * FC_BAR_PX)) : 2;
      const isToday = i === 0;
      const color = isToday
        ? 'linear-gradient(180deg,#f59e0b,#d97706)'
        : n > 20 ? 'linear-gradient(180deg,#a78bfa,#7c3aed)'
        : n > 10 ? 'linear-gradient(180deg,#818cf8,#6366f1)'
        : '#4c1d95';
      const dt = new Date(today); dt.setDate(dt.getDate() + i);
      const dateLabel = dt.toLocaleDateString('fr', { weekday:'short', day:'numeric', month:'short' });
      return `<div class="ypt-fc-col" title="${dateLabel} : ${n} carte${n!==1?'s':''}">
        <div class="ypt-fc-bar-wrap">
          <div class="ypt-fc-n${n===0?' ypt-fc-n-zero':''}">${n > 0 ? n : ''}</div>
          <div class="ypt-fc-bar" style="height:${px}px;background:${color}${isToday?';box-shadow:0 0 8px #f59e0b55':''}"></div>
        </div>
        <div class="ypt-fc-lbl${isToday?' ypt-fc-lbl-today':''}">${fcDayNames[i]}</div>
      </div>`;
    }).join('');

    // ── Barres 30 derniers jours (cartes révisées) ──
    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      const entry = log[key] || {};
      days30.push({ key, date: d, secs: entry.seconds||0, cards: entry.reviewed||0 });
    }
    const maxCards30 = Math.max(...days30.map(d => d.cards), 1);

    const bar30HTML = days30.map(d => {
      const pct  = Math.round(d.cards / maxCards30 * 100);
      const label = d.date.toLocaleDateString('fr', { day:'numeric', month:'short' });
      const dow   = ['D','L','M','M','J','V','S'][d.date.getDay()];
      const isToday = d.key === todayKey;
      return `<div class="ypt-bar-col" title="${label} : ${d.cards} carte${d.cards>1?'s':''} · ${fmtFull(d.secs)}">
        <div class="ypt-bar-inner">
          <div class="ypt-bar" style="height:${pct}%${isToday?';outline:2px solid #a78bfa;outline-offset:1px':''}"
               data-secs="${d.secs}" data-cards="${d.cards}" data-date="${label}"></div>
        </div>
        <div class="ypt-bar-lbl ${isToday?'today':''}">${dow}</div>
      </div>`;
    }).join('');

    // ── Heatmap 26 semaines ──
    const weeks = 26;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks*7 + 1);
    const startDow = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - startDow);

    const cells = [];
    const monthLabels = [];
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const dt = new Date(startDate);
        dt.setDate(dt.getDate() + w*7 + d);
        const key = dt.toISOString().slice(0,10);
        const e   = log[key] || {};
        const n   = e.reviewed||0;
        const lvl = n===0?0:n<50?1:n<100?2:n<150?3:4;
        const lbl = dt.toLocaleDateString('fr',{weekday:'short',day:'numeric',month:'short'});
        cells.push({ key, lvl, n, lbl, w, d });
        if (d===0 && dt.getMonth()!==lastMonth) {
          lastMonth = dt.getMonth();
          const mName = dt.toLocaleDateString('fr',{month:'short'});
          monthLabels.push({ w, name: mName.charAt(0).toUpperCase()+mName.slice(1) });
        }
      }
    }

    const CW=14, CH=14, GAP=3, PL=22, PT=20;
    const W = PL + weeks*(CW+GAP);
    const H = PT + 7*(CH+GAP);
    let svgCells = '';
    cells.forEach(c => {
      const x = PL + c.w*(CW+GAP);
      const y = PT + c.d*(CH+GAP);
      const fill = ['#1e1e2e','#4c1d95','#6d28d9','#8b5cf6','#a78bfa'][c.lvl];
      svgCells += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="3" fill="${fill}" opacity="${c.lvl===0?0.25:1}">
        <title>${c.lbl}${c.n?' : '+c.n+' carte'+(c.n>1?'s':''):' : aucune carte'}</title></rect>`;
    });
    const svgMonths = monthLabels.map(m => {
      const x = PL + m.w*(CW+GAP);
      return `<text x="${x}" y="${PT-5}" font-size="9" fill="#6b7280" font-family="system-ui,sans-serif">${m.name}</text>`;
    }).join('');
    const dayNames = ['L','M','M','J','V','S','D'];
    const svgDays = dayNames.map((n,i) => `<text x="${PL-5}" y="${PT+i*(CH+GAP)+CH-2}" font-size="9" fill="#6b7280" text-anchor="end" font-family="system-ui,sans-serif">${n}</text>`).join('');
    const svgHeatmap = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto">${svgMonths}${svgDays}${svgCells}</svg>`;

    const legendHTML = `<div class="ypt-legend">
      <span style="color:var(--gray-400);font-size:.72rem">0</span>
      ${[0,1,2,3,4].map(l=>`<div class="ypt-legend-sq" style="background:${'#1e1e2e,#4c1d95,#6d28d9,#8b5cf6,#a78bfa'.split(',')[l]};opacity:${l===0?0.25:1}"></div>`).join('')}
      <span style="color:var(--gray-400);font-size:.72rem">200+</span>
    </div>`;

    // ── Injection DOM ──
    const el = document.getElementById('ypt-heatmap');
    if (!el) return;
    el.innerHTML = `
      <!-- KPIs -->
      <div class="ypt-summary">
        <div class="ypt-kpi ypt-kpi-hero">
          <span class="ypt-kpi-n" style="color:#f59e0b;font-size:2rem">${dueToday}</span>
          <span class="ypt-kpi-l">Cartes à réviser aujourd'hui</span>
        </div>
        <div class="ypt-kpi"><span class="ypt-kpi-n" style="color:#a78bfa">🔥 ${streak}</span><span class="ypt-kpi-l">Série en cours</span></div>
        <div class="ypt-kpi"><span class="ypt-kpi-n">${totalCards.toLocaleString('fr')}</span><span class="ypt-kpi-l">Total révisées</span></div>
        <div class="ypt-kpi"><span class="ypt-kpi-n">${activeDays}</span><span class="ypt-kpi-l">Jours actifs</span></div>
      </div>

      <!-- Prévision carte/jour -->
      <div class="ypt-section-label">📅 Prévision — cartes à réviser</div>
      <div class="ypt-fc-bars">
        ${fcBarsHTML}
      </div>

      <!-- Historique 30 jours -->
      <div class="ypt-section-label" style="margin-top:18px">📊 Historique — cartes révisées (30j)</div>
      <div class="ypt-bars" id="ypt-bars-wrap">
        ${bar30HTML}
      </div>
      <div class="ypt-tooltip" id="ypt-tooltip" style="display:none"></div>

      <!-- Heatmap 6 mois -->
      <div class="ypt-section-label" style="margin-top:20px">🗓 Activité — 6 mois</div>
      <div class="ypt-heatmap-wrap">${svgHeatmap}</div>
      ${legendHTML}`;

    // Tooltip sur les barres historique
    el.querySelectorAll('.ypt-bar').forEach(b => {
      b.addEventListener('mouseenter', () => {
        const tt = document.getElementById('ypt-tooltip');
        const secs  = parseInt(b.dataset.secs);
        const cards = parseInt(b.dataset.cards);
        tt.innerHTML = `<strong>${b.dataset.date}</strong><br>${cards} carte${cards!==1?'s':''}<br>${fmtFull(secs)}`;
        tt.style.display = 'block';
      });
      b.addEventListener('mouseleave', () => {
        document.getElementById('ypt-tooltip').style.display = 'none';
      });
    });
  }

  // ── Examens (multi) ────────────────────────────────────────────
  function _renderExamDate(state) {
    const exams = (() => {
      try { return JSON.parse(localStorage.getItem('ifsi_exams_v2') || '[]'); } catch(e) { return []; }
    })();

    const sidebarEl = document.getElementById('exam-sidebar-list');
    const homeEl    = document.getElementById('exam-alerts-home');
    const today     = new Date(); today.setHours(0,0,0,0);
    const todayStr  = today.toISOString().slice(0,10);

    // Filtre les examens futurs ou aujourd'hui, trie par date
    const upcoming = exams
      .map(e => ({ ...e, diffDays: Math.round((new Date(e.date+'T00:00:00') - today) / 86400000) }))
      .filter(e => e.diffDays >= 0)
      .sort((a,b) => a.diffDays - b.diffDays);

    const past = exams.filter(e => Math.round((new Date(e.date+'T00:00:00') - today) / 86400000) < 0);

    // ── Sidebar ──
    if (sidebarEl) {
      if (exams.length === 0) {
        sidebarEl.innerHTML = `<div style="font-size:.78rem;color:var(--gray-400);text-align:center;padding:8px 0">Aucun examen planifié</div>`;
      } else {
        sidebarEl.innerHTML = [...upcoming, ...past].map(exam => {
          const diffDays = Math.round((new Date(exam.date+'T00:00:00') - today) / 86400000);

          let pool = state.cards.filter(c => !c.suspended);
          if (exam.cats?.length) pool = pool.filter(c => exam.cats.includes(c.cat));
          const total  = pool.length;
          const atRisk = pool.filter(c => !c.progress || (c.progress.nextReview||todayStr) <= exam.date).length;
          const pct    = total > 0 ? Math.round((total-atRisk)/total*100) : 100;
          const col    = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

          let badge;
          if (diffDays < 0)       badge = `<span style="font-size:.7rem;color:var(--gray-400)">Passé</span>`;
          else if (diffDays === 0) badge = `<span style="font-size:.72rem;font-weight:700;color:var(--danger)">Aujourd'hui !</span>`;
          else {
            const bc = diffDays <= 7 ? 'var(--danger)' : diffDays <= 14 ? 'var(--warning)' : 'var(--gray-500)';
            badge = `<span style="font-size:.72rem;font-weight:700;color:${bc}">J-${diffDays}</span>`;
          }

          return `<div class="exam-sidebar-item" onclick="openExamModal('${exam.id}')">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
              <span style="font-size:.82rem;font-weight:600;color:var(--gray-700);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(exam.name)}</span>
              ${badge}
            </div>
            <div style="margin:5px 0 2px;height:5px;background:var(--gray-200);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${col};border-radius:99px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--gray-400)">
              <span style="color:${col};font-weight:600">${pct}% prêt</span>
              ${atRisk > 0 ? `<span style="color:var(--danger)">⚠ ${atRisk} à risque</span>` : `<span style="color:var(--success)">✓ OK</span>`}
            </div>
            ${diffDays >= 0 && atRisk > 0 ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:6px;font-size:.75rem" onclick="event.stopPropagation();startExamPrep('${exam.id}')">🎯 Préparer →</button>` : ''}
          </div>`;
        }).join('');
      }
    }

    // ── Alertes home (exam dans ≤ 14 jours) ──
    if (homeEl) {
      const alerts = upcoming.filter(e => e.diffDays <= 14);
      if (alerts.length === 0) { homeEl.innerHTML = ''; return; }
      homeEl.innerHTML = alerts.map(exam => {
        let pool = state.cards.filter(c => !c.suspended);
        if (exam.cats?.length) pool = pool.filter(c => exam.cats.includes(c.cat));
        const atRisk = pool.filter(c => !c.progress || (c.progress.nextReview||todayStr) <= exam.date).length;
        const txt = exam.diffDays === 0 ? "C'est aujourd'hui !" : `dans ${exam.diffDays}j`;
        return `<div style="font-size:.78rem;background:rgba(0,0,0,.18);border-radius:8px;padding:5px 10px;color:rgba(255,255,255,.9);display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span>🎓 <strong>${_esc(exam.name)}</strong> ${txt}${atRisk > 0 ? ` · <strong>${atRisk} cartes à risque</strong>` : ' · ✓ prêt(e)'}</span>
        </div>`;
      }).join('');
    }
  }

  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { all, browse, browseDebounced, stats, heatmap, cardItemHTML, orderedCats };
})();
