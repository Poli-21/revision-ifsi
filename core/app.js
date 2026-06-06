// core/app.js — Point d'entrée, UI, raccourcis clavier
'use strict';
window.App = window.App || {};

// ── Namespace UI ───────────────────────────────────────────────
App.UI = (() => {
  let activeCategory   = '';
  let currentTab       = 'home';
  let selectedCats  = new Set();
  let openedGroups  = new Set();   // groupes explicitement ouverts (fermé par défaut)

  function showView(view) {
    ['home-view','browse-view','session-view'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === view + '-view') ? 'block' : 'none';
    });
    if (view !== 'session') {
      ['tab-home','tab-browse','tab-stats'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', id === 'tab-' + (view === 'home' ? 'home' : view));
      });
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    document.getElementById('home-view').style.display   = tab === 'home'   ? 'block' : 'none';
    document.getElementById('browse-view').style.display = tab === 'browse'  ? 'block' : 'none';
    document.getElementById('stats-view').style.display  = tab === 'stats'   ? 'block' : 'none';
    document.getElementById('ortho-view').style.display  = tab === 'ortho'   ? 'block' : 'none';
    document.getElementById('games-view').style.display  = tab === 'games'   ? 'block' : 'none';
    document.getElementById('bac-view').style.display    = tab === 'bac'     ? 'block' : 'none';
    document.getElementById('oral-view').style.display    = tab === 'oral'    ? 'block' : 'none';
    document.getElementById('english-view').style.display = tab === 'english' ? 'block' : 'none';
    document.getElementById('session-view').style.display = 'none';
    if (tab === 'bac')     App.Bac.init();
    if (tab === 'oral')    App.Oral.init();
    if (tab === 'english') App.English.init();
    ['home','browse','stats','ortho','games','bac','oral','english'].forEach(t => {
      const btn = document.getElementById('tab-' + t);
      if (btn) btn.classList.toggle('active', t === tab);
    });
    if (tab === 'browse') App.Render.browse();
    if (tab === 'stats')  App.Render.stats();
    if (tab === 'ortho')  App.Ortho.populateCatSelect();
    if (tab === 'games')  App.Games.populateCatSelect();
  }

  function setCategory(cat) {
    activeCategory = cat;
    App.Render.all();
  }

  function toggleCatSelection(cat) {
    if (selectedCats.has(cat)) selectedCats.delete(cat);
    else                       selectedCats.add(cat);
    _updateChips();
  }

  function startSelectedCats() {
    if (selectedCats.size === 0) return;
    App.Session.start([...selectedCats]);
    selectedCats.clear();
    _updateChips();
  }

  function _updateChips() {
    // Met à jour l'état visuel des chips et le bouton de sélection
    document.querySelectorAll('.cat-due-chip').forEach(btn => {
      const cat = btn.dataset.cat;
      btn.classList.toggle('selected', selectedCats.has(cat));
    });
    const selBtn = document.getElementById('start-selection-btn');
    if (selBtn) {
      const n = [...selectedCats].reduce((s, cat) => {
        return s + App.Store.state.cards.filter(c => c.cat === cat && App.SRS.isDue(c)).length;
      }, 0);
      selBtn.style.display = selectedCats.size > 0 ? 'inline-flex' : 'none';
      selBtn.textContent   = `Réviser la sélection (${n}) →`;
    }
  }

  function toggleGroup(parent) {
    if (openedGroups.has(parent)) openedGroups.delete(parent);
    else                          openedGroups.add(parent);
    const isOpen   = openedGroups.has(parent);
    const children = document.getElementById('cg-' + CSS.escape(parent));
    const header   = document.getElementById('cgh-' + CSS.escape(parent));
    if (children) {
      if (!isOpen) {
        children.style.maxHeight = children.scrollHeight + 'px';
        requestAnimationFrame(() => children.classList.add('collapsed'));
      } else {
        children.classList.remove('collapsed');
        children.style.maxHeight = children.scrollHeight + 'px';
        setTimeout(() => { children.style.maxHeight = ''; }, 220);
      }
    }
    if (header) header.classList.toggle('open', isOpen);
  }

  function moveCatTo(dragTopKey, dropTopKey) {
    // dragTopKey = top-level qu'on déplace (group parent ou cat simple)
    // dropTopKey = top-level devant lequel on insère ("__end__" = fin)
    const cats = App.Render.orderedCats();

    // Récupère tous les fullCatNames appartenant à dragTopKey
    const isMember = c => {
      const sep = c.indexOf(' > ');
      return sep !== -1 ? c.slice(0, sep) === dragTopKey : c === dragTopKey;
    };
    const moving   = cats.filter(isMember);
    const rest     = cats.filter(c => !isMember(c));

    if (dropTopKey === '__end__') {
      App.Store.state.catOrder = [...rest, ...moving];
    } else {
      // Trouve l'index du premier cat appartenant à dropTopKey dans rest
      const isDropMember = c => {
        const sep = c.indexOf(' > ');
        return sep !== -1 ? c.slice(0, sep) === dropTopKey : c === dropTopKey;
      };
      const insertAt = rest.findIndex(isDropMember);
      if (insertAt === -1) {
        App.Store.state.catOrder = [...rest, ...moving];
      } else {
        rest.splice(insertAt, 0, ...moving);
        App.Store.state.catOrder = rest;
      }
    }
    App.Store.saveOrder();
    App.Render.all();
  }

  function unnestCat(fullCat) {
    // "Parent > Enfant" → "Enfant"
    const sep = fullCat.indexOf(' > ');
    if (sep === -1) return;
    const childName = fullCat.slice(sep + 3);
    const state = App.Store.state;
    state.cards.forEach(c => { if (c.cat === fullCat) c.cat = childName; });
    const i = state.catOrder.indexOf(fullCat);
    if (i !== -1) state.catOrder[i] = childName;
    App.Store.save();
    App.Store.saveOrder();
    App.Render.all();
  }

  function nestCatInto(dragTopKey, targetTopKey) {
    if (!dragTopKey || dragTopKey === targetTopKey) return;
    const cats  = App.Render.orderedCats();
    const state = App.Store.state;

    // Récupère tous les fullCatNames à déplacer
    const dragCats = cats.filter(c => {
      const sep = c.indexOf(' > ');
      return sep !== -1 ? c.slice(0, sep) === dragTopKey : c === dragTopKey;
    });

    dragCats.forEach(oldCat => {
      // Nom enfant = partie après " > " si déjà imbriqué, sinon nom complet
      const childName = oldCat.includes(' > ') ? oldCat.slice(oldCat.indexOf(' > ') + 3) : oldCat;
      const newCat    = targetTopKey + ' > ' + childName;
      // Renomme toutes les cartes
      state.cards.forEach(c => { if (c.cat === oldCat) c.cat = newCat; });
      // Met à jour catOrder
      const i = state.catOrder.indexOf(oldCat);
      if (i !== -1) state.catOrder[i] = newCat;
      else          state.catOrder.push(newCat);
    });

    App.Store.save();
    App.Store.saveOrder();
    App.Render.all();
  }

  // Conserve moveCat pour compatibilité (▲▼ éventuels)
  function moveCat(cat, dir) {
    const cats = App.Render.orderedCats();
    const idx  = cats.indexOf(cat);
    if (idx === -1) return;
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cats.length) return;
    [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
    App.Store.state.catOrder = cats;
    App.Store.saveOrder();
    App.Render.all();
  }

  return {
    get activeCategory()   { return activeCategory; },
    get currentTab()       { return currentTab; },
    get selectedCats()     { return selectedCats; },
    get openedGroups()     { return openedGroups; },
    showView, switchTab, setCategory, toggleCatSelection, startSelectedCats, moveCat, moveCatTo, nestCatInto, unnestCat, toggleGroup
  };
})();

// ── Initialisation ─────────────────────────────────────────────
App.init = async function () {
  _initDarkMode();                  // Dark mode (avant tout rendu)
  _initSidebarState();             // Sidebar collapse
  await App.Store.load();
  try { App.Sync?.init?.(); } catch(e) { console.warn('Sync init failed:', e); }
  App.Render.all();
  App.UI.switchTab('home');
  _initKeyboard();
  App.Store.save();
  try { initNotifications(); } catch(e) {}
  try { _initBackup(); } catch(e) {}  // Sauvegarde quotidienne
};

function _initKeyboard() {
  document.addEventListener('keydown', e => {
    const sessionVisible = document.getElementById('session-view')?.style.display !== 'none';
    const modalOpen      = document.getElementById('modal-overlay')?.classList.contains('open');
    const detailOpen     = document.getElementById('detail-overlay')?.classList.contains('open');
    if (modalOpen || detailOpen) { if (e.key === 'Escape') { App.Modal.close(); App.Modal.closeDetail(); } return; }

    if (sessionVisible) {
      const writeVisible  = document.getElementById('write-zone')?.style.display !== 'none';
      const revealVisible = document.getElementById('write-reveal')?.style.display !== 'none';
      const qcmVisible    = document.getElementById('qcm-zone')?.style.display !== 'none';
      if (e.key === 'Escape')         { App.Session.end(); return; }
      if (qcmVisible) return; // QCM géré par clic
      if (writeVisible) {
        if (e.ctrlKey && e.key === 'Enter') { App.Session.verifyWrite(); return; }
        if (revealVisible && e.key === '1') { e.preventDefault(); App.Session.answer(0); }
        if (revealVisible && e.key === '2') { e.preventDefault(); App.Session.answer(3); }
        if (revealVisible && e.key === '3') { e.preventDefault(); App.Session.answer(4); }
        if (revealVisible && e.key === '4') { e.preventDefault(); App.Session.answer(5); }
        return;
      }
      // Mode flip
      const flipped = document.getElementById('flashcard')?.classList.contains('flipped');
      if ((e.key === ' ' || e.key === 'Enter') && !flipped) { e.preventDefault(); App.Session.flip(); return; }
      if (flipped) {
        if (e.key === '1' || e.key === 'ArrowLeft')  { e.preventDefault(); App.Session.answer(0); }
        if (e.key === '2')                            { e.preventDefault(); App.Session.answer(3); }
        if (e.key === '3' || e.key === 'ArrowRight')  { e.preventDefault(); App.Session.answer(4); }
        if (e.key === '4')                            { e.preventDefault(); App.Session.answer(5); }
      }
    } else {
      // Hors session — désactiver les raccourcis en mode orthographe
      const orthoVisible = document.getElementById('ortho-view')?.style.display !== 'none';
      const gamesVisible = document.getElementById('games-view')?.style.display !== 'none';
      if (orthoVisible || gamesVisible) return;

      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !e.shiftKey) {
        e.preventDefault();
        App.UI.switchTab('browse');
        setTimeout(() => document.getElementById('search-input')?.focus(), 80);
      }
      if (e.key === 'n' && !e.ctrlKey && !e.altKey) { App.Modal.openAdd(); }
    }
  });
}

// ── Exposition globale pour les onclick HTML ───────────────────
Object.assign(window, {
  // Session
  startSession   : (cat)  => App.Session.start(cat),
  startChrono    : ()     => App.Session.startChrono(),
  endSession     : ()     => App.Session.end(),
  flipCard       : ()     => App.Session.flip(),
  answer         : (q)    => App.Session.answer(q),
  verifyWrite    : ()     => App.Session.verifyWrite(),
  setSessionMode : (m)    => App.Session.setMode(m),
  // UI
  switchTab          : (t)   => App.UI.switchTab(t),
  setCategory        : (cat) => App.UI.setCategory(cat),
  toggleCatSelection : (cat) => App.UI.toggleCatSelection(cat),
  toggleGroupChips   : (parent) => {
    // Sélectionne/désélectionne toutes les sous-cats du groupe
    const children = App.Store.state.cards
      .map(c => c.cat).filter((v,i,a) => a.indexOf(v)===i)
      .filter(cat => cat.startsWith(parent + ' > ') && App.SRS.isDue({ progress: null, cat, suspended: false }) || App.Store.state.cards.some(x => x.cat === cat && App.SRS.isDue(x)))
      .filter(cat => cat.startsWith(parent + ' > '));
    const selCats = App.UI.selectedCats;
    const allSel  = children.every(c => selCats.has(c));
    children.forEach(c => allSel ? selCats.delete(c) : selCats.add(c));
    // Toggle expand/collapse du groupe
    const el = document.getElementById('chipg-' + CSS.escape(parent));
    if (el) el.classList.toggle('collapsed');
    App.UI._updateChips();
  },
  startSelectedCats  : ()    => App.UI.startSelectedCats(),
  moveCat            : (cat, dir) => App.UI.moveCat(cat, dir),
  moveCatTo          : (from, to) => App.UI.moveCatTo(from, to),
  nestCatInto        : (from, to) => App.UI.nestCatInto(from, to),
  unnestCat          : (cat)      => App.UI.unnestCat(cat),
  toggleGroup        : (p)        => App.UI.toggleGroup(p),
  startGroupSession  : (p)        => App.Session.start(
      App.Store.state.cards.filter(c => c.cat.startsWith(p + ' > ')).map(c => c.cat).filter((v,i,a) => a.indexOf(v)===i)
    ),
  startRenameCat     : (cat, btn) => _startRenameCat(cat, btn),
  deleteCat          : (cat)      => _deleteCat(cat),
  bulkDelete         : ()         => bulkDelete(),
  handleCatClick     : (cat, e, btn) => _handleCatClick(cat, e, btn),
  renderBrowse   : ()     => App.Render.browseDebounced(),
  // Modales
  openAddModal   : (cat)  => App.Modal.openAdd(cat),
  closeModal     : ()     => App.Modal.close(),
  addCard        : (k)    => App.Modal.addCard(k),
  openCardDetail : (id)   => App.Modal.openDetail(id),
  closeDetail    : ()     => App.Modal.closeDetail(),
  openEdit       : (id)   => App.Modal.openEdit(id),
  saveEdit       : (id)   => App.Modal.saveEdit(id),
  deleteCard     : (id,e) => App.Modal.deleteCard(id, e),
  suspendCard    : (id)   => App.Modal.suspendCard(id),
  // Image
  handleImgSelect: (e)    => App.Modal.handleImgSelect(e),
  removeImg      : (e)    => App.Modal.removeImg(e),
  toggleNewCat   : ()     => App.Modal.toggleNewCat(),
  // Export / Import
  toggleSidebar  : ()     => toggleSidebar(),
  closeSidebar   : ()     => closeSidebar(),
  exportJSON     : ()     => App.Modal.exportJSON(),
  exportCSV      : ()     => App.Modal.exportCSV(),
  importJSON     : ()     => App.Modal.importJSON(),
  handleImport   : (e)    => App.Modal.handleImport(e),
});

// ── Clic simple vs double-clic sur catégorie ──────────────────
let _catClickTimer = null;
function _handleCatClick(cat, e, btn) {
  if (_catClickTimer) { clearTimeout(_catClickTimer); _catClickTimer = null; }
  if (e.detail >= 2) {
    // Double-clic → renommer
    _startRenameCat(cat, btn);
    return;
  }
  // Simple clic → sélectionner (avec délai pour laisser passer le double-clic)
  _catClickTimer = setTimeout(() => {
    _catClickTimer = null;
    App.UI.setCategory(cat);
  }, 220);
}

// ── Sélection multiple de cartes ───────────────────────────────
let _selectMode   = false;
let _selectedCards = new Set();

function toggleSelectMode() {
  _selectMode = !_selectMode;
  _selectedCards.clear();
  const btn = document.getElementById('select-mode-btn');
  const bar = document.getElementById('bulk-bar');
  const grid = document.getElementById('browse-grid');

  if (_selectMode) {
    if (btn) { btn.textContent = '✕ Quitter sélection'; btn.style.background = 'var(--primary-light)'; btn.style.color = 'var(--primary)'; }
    if (bar) {
      // Remplit le select de matières
      const cats = App.Render.orderedCats();
      const sel  = document.getElementById('bulk-cat-select');
      if (sel) {
        sel.innerHTML = '<option value="">— Changer de matière —</option>' +
          cats.map(c => `<option value="${c}">${c}</option>`).join('');
      }
      bar.style.display = 'flex';
    }
    if (grid) grid.classList.add('select-mode');
  } else {
    if (btn) { btn.textContent = '☑ Sélectionner'; btn.style.background = ''; btn.style.color = ''; }
    if (bar) bar.style.display = 'none';
    if (grid) grid.classList.remove('select-mode');
    // Retire le style selected des cartes
    document.querySelectorAll('.card-item.selected').forEach(el => el.classList.remove('selected'));
  }
  _updateBulkCount();
}

function toggleCardSelect(id, e) {
  if (!_selectMode) return;
  e.stopPropagation();
  if (_selectedCards.has(id)) _selectedCards.delete(id);
  else                         _selectedCards.add(id);
  // Met à jour le visuel de la carte
  const el = document.querySelector(`.card-item[data-id="${id}"]`);
  if (el) el.classList.toggle('selected', _selectedCards.has(id));
  _updateBulkCount();
}

function bulkSelectAll() {
  const items = document.querySelectorAll('#browse-grid .card-item');
  const allSelected = items.length > 0 && [...items].every(el => _selectedCards.has(el.dataset.id));
  items.forEach(el => {
    if (allSelected) { _selectedCards.delete(el.dataset.id); el.classList.remove('selected'); }
    else             { _selectedCards.add(el.dataset.id);    el.classList.add('selected'); }
  });
  _updateBulkCount();
}

function bulkChangeCat() {
  if (_selectedCards.size === 0) return;
  const newCat = document.getElementById('bulk-cat-select')?.value;
  if (!newCat) { alert('Choisis une matière dans la liste.'); return; }
  const norm = App.Store.normCat(newCat);
  App.Store.state.cards.forEach(c => {
    if (_selectedCards.has(c.id)) c.cat = norm;
  });
  App.Store.save();
  const count = _selectedCards.size;
  _selectedCards.clear();
  toggleSelectMode();
  App.Render.all();
  // Feedback
  const btn = document.getElementById('select-mode-btn');
  if (btn) { const o = btn.textContent; btn.textContent = `✓ ${count} carte(s) déplacée(s)`; setTimeout(() => btn.textContent = o, 2000); }
}

function bulkDelete() {
  const n = _selectedCards.size;
  if (n === 0) return;
  const ids = new Set(_selectedCards);
  App.Store.state.cards = App.Store.state.cards.filter(c => !ids.has(c.id));
  App.Store.save();
  _selectedCards.clear();
  toggleSelectMode();
  App.Render.all();
  _showToast('🗑 ' + n + ' carte' + (n > 1 ? 's' : '') + ' supprimée' + (n > 1 ? 's' : ''));
}

function _updateBulkCount() {
  const el = document.getElementById('bulk-count');
  const n  = _selectedCards.size;
  if (el) el.textContent = n > 0 ? `${n} carte${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}` : 'Aucune carte sélectionnée';
}

// ── Sidebar mobile ─────────────────────────────────────────────
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('open');
}
function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

// ── QR Code accès tablette ─────────────────────────────────────
function showQRCode() {
  // Utilise l'URL GitHub Pages (ou l'URL locale si en développement)
  const url = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, '') + '/';
  const overlay = document.getElementById('qr-overlay');
  const container = document.getElementById('qr-container');
  const urlEl = document.getElementById('qr-url');
  if (!overlay) return;

  // Génère le QR via API publique (ne nécessite pas de lib externe)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;
  container.innerHTML = `<img src="${qrUrl}" width="200" height="200" style="border-radius:8px;border:3px solid var(--gray-200)" alt="QR Code">`;
  urlEl.textContent = url;

  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.style.opacity = '1');
}

function closeQR() {
  const overlay = document.getElementById('qr-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 200);
}

// ── Renommage inline de catégorie ──────────────────────────────
function _startRenameCat(oldCat, btn) {
  const row = btn.closest('.cat-pill-row');
  if (!row || row.querySelector('.cat-rename-input')) return; // déjà en édition

  const input = document.createElement('input');
  input.className   = 'cat-rename-input';
  input.value       = oldCat;
  input.maxLength   = 60;
  input.spellcheck  = false;

  // Remplace le bouton par l'input
  btn.style.display = 'none';
  row.insertBefore(input, row.firstChild);
  input.focus();
  input.select();

  const commit = () => {
    const newCat = input.value.trim();
    if (newCat && newCat !== oldCat) _renameCat(oldCat, newCat);
    else App.Render.all(); // annule → redessine
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = oldCat; input.blur(); }
  });
  input.addEventListener('blur', commit, { once: true });
}

function _deleteCat(cat) {
  const state = App.Store.state;
  const n = state.cards.filter(c => c.cat === cat).length;

  // Supprime les cartes et l'entrée d'ordre correspondant à cette cat exacte
  state.cards    = state.cards.filter(c => c.cat !== cat);
  state.catOrder = state.catOrder.filter(c => c !== cat);
  App.Store.save();
  App.Store.saveOrder();

  // Toast de confirmation visuel
  _showToast('🗑 "' + cat.split(' > ').pop() + '" supprimée (' + n + ' carte' + (n > 1 ? 's' : '') + ')');

  // Retour à "Toutes" si la catégorie active était celle-là
  if (App.UI.activeCategory === cat) App.UI.setCategory('');
  else App.Render.all();
}

function _showToast(msg) {
  let t = document.getElementById('_app_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_app_toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);'
      + 'background:#1e293b;color:#fff;padding:10px 20px;border-radius:10px;font-size:.85rem;'
      + 'z-index:9999;pointer-events:none;opacity:0;transition:opacity .2s';
    document.body.appendChild(t);
  }
  clearTimeout(t._hide);
  t.textContent = msg;
  t.style.opacity = '1';
  t._hide = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

function _renameCat(oldCat, newCat) {
  const { state } = App.Store;
  newCat = App.Store.normCat(newCat);
  if (!newCat) return;
  // Renomme toutes les cartes (fusionne automatiquement si newCat existe déjà)
  state.cards.forEach(c => { if (c.cat === oldCat) c.cat = newCat; });
  App.Store.save();
  // Met à jour l'ordre
  const ord = state.catOrder;
  const i = ord.indexOf(oldCat);
  if (i !== -1) { ord[i] = newCat; App.Store.saveOrder(); }
  // Met à jour la catégorie active si besoin
  if (App.UI.activeCategory === oldCat) App.UI.setCategory(newCat);
  else App.Render.all();
}

// ── Modal Sync ─────────────────────────────────────────────────
function openSyncModal() {
  const overlay  = document.getElementById('sync-overlay');
  const setup    = document.getElementById('sync-setup-zone');
  const connected = document.getElementById('sync-connected-zone');
  if (!overlay) return;
  const on = App.Sync?.isConfigured?.() || false;
  setup.style.display     = on ? 'none'  : 'block';
  connected.style.display = on ? 'block' : 'none';
  document.getElementById('sync-connect-msg').textContent = '';
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.style.opacity = '1');
  try { _updateNotifUI(); } catch(e) {}
  try { _refreshBackupList(); } catch(e) {}
}

function closeSyncModal() {
  const overlay = document.getElementById('sync-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 200);
}

async function doSyncConnect() {
  const token = document.getElementById('sync-token-input')?.value.trim();
  if (!token) { document.getElementById('sync-connect-msg').textContent = '⚠️ Colle ton token GitHub.'; return; }
  const msgEl = document.getElementById('sync-connect-msg');
  msgEl.textContent = '⏳ Connexion…';
  const res = await App.Sync.connect(token);
  if (res.ok) {
    msgEl.textContent = '✅ ' + res.msg;
    document.getElementById('sync-setup-zone').style.display    = 'none';
    document.getElementById('sync-connected-zone').style.display = 'block';
    document.getElementById('sync-settings-btn').textContent    = '☁️ Sync ON';
  } else {
    msgEl.textContent = '❌ ' + res.msg;
    msgEl.style.color = '#dc2626';
  }
}

async function doSyncPull() {
  _syncProgress(10, 'Connexion au Gist…');
  const ok = await App.Sync.pullRemote(_syncProgress);
  if (ok) {
    _syncProgress(100, 'Synchronisé ! Rechargement…');
    setTimeout(() => location.reload(), 800);
  } else {
    _syncProgressHide();
  }
}

function _syncProgress(pct, label) {
  const wrap = document.getElementById('sync-progress-wrap');
  const bar  = document.getElementById('sync-progress-bar');
  const lbl  = document.getElementById('sync-progress-label');
  if (!wrap) return;
  wrap.style.display = 'block';
  if (bar) bar.style.width = pct + '%';
  if (lbl && label) lbl.textContent = label;
}

function _syncProgressHide() {
  const wrap = document.getElementById('sync-progress-wrap');
  if (wrap) wrap.style.display = 'none';
}

async function doSyncPush() {
  await App.Sync.push();
}

async function doSyncDiagnose() {
  const diagEl = document.getElementById('sync-diag');
  if (!diagEl) return;
  diagEl.style.display = 'block';
  diagEl.textContent   = '⏳ Diagnostic en cours…';
  diagEl.textContent   = await App.Sync.diagnose();
}

function doSyncDisconnect() {
  if (!confirm('Déconnecter la synchronisation ? Les données locales sont conservées.')) return;
  App.Sync.disconnect();
  document.getElementById('sync-setup-zone').style.display    = 'block';
  document.getElementById('sync-connected-zone').style.display = 'none';
  document.getElementById('sync-settings-btn').textContent    = '☁️ Sync';
}

// ── Text-to-Speech ─────────────────────────────────────────────
// ── Text-to-Speech ─────────────────────────────────────────────
function _getfrVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang === 'fr-FR' && !v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('fr'))
      || null;
}

function speakText(text, btn) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'fr-FR';
  utt.rate   = 1.0;
  utt.pitch  = 1.0;
  const voice = _getfrVoice();
  if (voice) utt.voice = voice;
  window.speechSynthesis.speak(utt);
  if (btn) { btn.style.opacity = '.45'; utt.onend = () => btn.style.opacity = '1'; }
}

function speakTerm() {
  const def = document.getElementById('card-def')?.textContent?.trim();
  speakText(def, document.getElementById('tts-btn'));
}

// ── Notifications navigateur ───────────────────────────────────
function initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    setTimeout(_checkAndNotifyToday, 2000);
  }
  _checkDiscordRecap();   // Récap dimanche (JS fallback)
  // Le rapport quotidien 17h00 est géré par GitHub Actions (.github/workflows/daily-report.yml)
  _updateNotifUI();
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    alert('Notifications non supportées sur ce navigateur.');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    localStorage.setItem('ifsi_notif_enabled', '1');
    _checkAndNotifyToday();
    _updateNotifUI();
  } else {
    alert('❌ Notifications bloquées. Active-les dans les paramètres de ton navigateur.');
  }
}

function _checkAndNotifyToday() {
  if (Notification.permission !== 'granted') return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('ifsi_last_notif') === today) return;

  const { state } = App.Store;
  const due = state.cards.filter(c => {
    if (c.suspended) return false;
    if (!c.progress)  return true;
    return (c.progress.nextReview || today) <= today;
  }).length;

  if (due === 0) return;
  localStorage.setItem('ifsi_last_notif', today);
  try {
    new Notification('🩺 Révision IFSI', {
      body: `${due} carte${due > 1 ? 's' : ''} à réviser aujourd'hui !`,
      icon: './icons/icon-192.png',
      tag: 'ifsi-daily'
    });
  } catch(e) {}
}

// ── Discord webhook ────────────────────────────────────────────
const DISCORD_KEY = 'ifsi_discord_webhook';

function saveDiscordWebhook() {
  const inp = document.getElementById('discord-webhook-input');
  const url = inp?.value.trim() || '';
  if (url && !url.startsWith('https://discord.com/api/webhooks/')) {
    alert('URL invalide. Elle doit commencer par https://discord.com/api/webhooks/');
    return;
  }
  localStorage.setItem(DISCORD_KEY, url);
  _updateNotifUI();
  if (url) {
    _dailyTimerRunning = false;   // reset pour permettre le redémarrage
    _initDailyReportTimer();
    _sendDiscordMsg('✅ Webhook connecté ! Tu recevras un rapport détaillé chaque jour à **17h30** et un bilan chaque **dimanche**.').catch(() => {});
    alert('✅ Discord connecté !');
  } else {
    alert('Discord déconnecté.');
  }
}

async function sendDiscordRecapNow() {
  const ok = await _buildAndSendRecap();
  alert(ok ? '✅ Récap envoyé sur Discord !' : '❌ Erreur. Vérifie l\'URL webhook et réessaie.');
}

// ── Timer rapport quotidien 17h30 ──────────────────────────────
let _dailyTimerRunning = false;
function _initDailyReportTimer() {
  if (!localStorage.getItem(DISCORD_KEY)) return;
  if (_dailyTimerRunning) return;   // évite les doublons si appelé plusieurs fois
  _dailyTimerRunning = true;
  setInterval(_maybeSendDailyReport, 60000);  // vérifie toutes les 60s
  setTimeout(_maybeSendDailyReport, 3000);    // check immédiat au démarrage
}

function _maybeSendDailyReport() {
  if (!localStorage.getItem(DISCORD_KEY)) return;
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  // Fenêtre 17:30 → 17:35
  if (h !== 17 || m < 30 || m > 35) return;
  const sentKey = `ifsi_daily_report_${now.toISOString().slice(0,10)}`;
  if (localStorage.getItem(sentKey)) return;
  localStorage.setItem(sentKey, '1');
  _sendDailyReport();
}

// ── Calcul stats par matière ───────────────────────────────────
function _getCatStats(days) {
  const { state } = App.Store;
  const today = new Date().toISOString().slice(0, 10);
  const since = days ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10) : null;
  const cats = {};

  state.cards.forEach(c => {
    if (c.suspended) return;
    const cat = c.cat || 'Général';
    if (!cats[cat]) cats[cat] = { total: 0, due: 0, notStarted: 0, efSum: 0, efCount: 0, lapses: 0, reviewedRecently: 0 };
    const s = cats[cat];
    s.total++;
    if (!c.progress) { s.notStarted++; s.due++; return; }
    const nr = c.progress.nextReview || today;
    if (nr <= today) s.due++;
    s.efSum    += c.progress.easeFactor || 2.5;
    s.efCount++;
    s.lapses   += c.progress.lapses || 0;
    if (since && c.progress.lastReview >= since) s.reviewedRecently++;
  });

  return cats;
}

// ── Rapport quotidien détaillé ─────────────────────────────────
async function _sendDailyReport() {
  const webhook = localStorage.getItem(DISCORD_KEY);
  if (!webhook) return false;

  const { state } = App.Store;
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = state.studyLog[today] || {};
  const reviewed = todayLog.reviewed || 0;
  const ok       = todayLog.ok       || 0;
  const hard     = todayLog.hard     || 0;
  const nope     = todayLog.nope     || 0;
  const accuracy = reviewed > 0 ? Math.round(ok / reviewed * 100) : null;
  const streak   = _streakCount(state.studyLog);

  const cats = _getCatStats(7);
  const sorted = Object.entries(cats).sort((a, b) => b[1].due - a[1].due);
  const totalDue = sorted.reduce((s, [, v]) => s + v.due, 0);

  const lines = [];
  lines.push(`# 📋 Rapport du ${_frDate(new Date())}`);
  lines.push(``);

  // ── Bilan du jour ──
  lines.push(`## 📊 Bilan du jour`);
  if (reviewed > 0) {
    lines.push(`Tu as révisé **${reviewed} cartes** aujourd'hui.`);
    lines.push(`✅ Réussies : **${ok}** · ⚠️ Difficiles : **${hard}** · ❌ Ratées : **${nope}** · 🎯 **${accuracy}%**`);
    if (accuracy >= 85)      lines.push(`> Excellente session ! Ta mémoire est au top. 🌟`);
    else if (accuracy >= 65) lines.push(`> Bonne session dans l'ensemble. Continue sur ta lancée. 👍`);
    else                     lines.push(`> Session difficile — c'est normal, ça fait partie de l'apprentissage. Reviens demain ! 💪`);
  } else {
    lines.push(`> Aucune révision aujourd'hui encore. Il reste du temps ! 🕔`);
  }
  lines.push(`🔥 Série actuelle : **${streak} jour${streak !== 1 ? 's' : ''}**`);
  lines.push(``);

  // ── Cartes en attente par matière ──
  if (totalDue > 0) {
    lines.push(`## 📚 À réviser ce soir (${totalDue} cartes)`);
    sorted.forEach(([cat, s]) => {
      if (s.due === 0) return;
      const ef  = s.efCount > 0 ? s.efSum / s.efCount : 2.5;
      const dot = ef >= 2.8 ? '🟢' : ef >= 2.0 ? '🟡' : '🔴';
      const note = s.notStarted > 0 ? ` _(dont ${s.notStarted} nouvelles)_` : '';
      lines.push(`${dot} **${cat}** — ${s.due} carte${s.due > 1 ? 's' : ''}${note}`);
    });
    lines.push(``);
  } else {
    lines.push(`## ✨ Aucune carte en retard — journée parfaite !`);
    lines.push(``);
  }

  // ── Tableau de maîtrise ──
  lines.push(`## 📈 Niveau de maîtrise par matière`);
  sorted.forEach(([cat, s]) => {
    if (s.efCount === 0) {
      lines.push(`⚪ **${cat}** — Non commencé (${s.total} cartes)`);
      return;
    }
    const ef  = s.efSum / s.efCount;
    const pct = Math.round(Math.min(100, Math.max(0, (ef - 1.3) / (3.5 - 1.3) * 100)));
    const bar = _progressBar(pct);
    const tag = pct >= 75 ? '🟢 Maîtrisé' : pct >= 45 ? '🟡 En cours' : '🔴 À renforcer';
    lines.push(`${tag} **${cat}** ${bar} ${pct}%`);
  });
  lines.push(``);

  // ── Conseil du prof ──
  lines.push(`## 💡 Conseil`);
  const weak     = sorted.filter(([, s]) => s.efCount > 0 && (s.efSum / s.efCount) < 2.0);
  const priority = sorted.filter(([, s]) => s.due >= 5);
  const lapsy    = sorted.filter(([, s]) => s.lapses > s.total * 0.3 && s.efCount > 0);

  if (weak.length > 0) {
    lines.push(`**${weak[0][0]}** est ta matière la plus fragile en ce moment. Consacre-lui une session dédiée ce soir — des révisions régulières sur les points difficiles sont la clé du progrès en IFSI.`);
  } else if (lapsy.length > 0) {
    lines.push(`Plusieurs cartes en **${lapsy[0][0]}** ont été ratées plusieurs fois. C'est souvent le signe qu'il faut revoir la notion dans le cours, pas juste les cartes.`);
  } else if (priority.length > 0) {
    lines.push(`**${priority[0][0]}** accumule du retard (${priority[0][1].due} cartes dues). Commence par cette matière ce soir pour ne pas te retrouver débordé(e).`);
  } else if (totalDue === 0) {
    lines.push(`Toutes tes matières sont à jour — bravo ! C'est le bon moment pour ajouter de nouvelles cartes sur des notions pas encore couvertes.`);
  } else {
    lines.push(`Bonne régularité ! Veille à ne pas laisser de matières sans révision plusieurs jours d'affilée — la répétition espacée ne fonctionne que si tu es assidu(e).`);
  }
  lines.push(``);
  lines.push(`▶️ https://poli-21.github.io/revision-ifsi/`);

  return _sendDiscordMsg(lines.join('\n'));
}

// ── Récap hebdomadaire (dimanche) ──────────────────────────────
async function _checkDiscordRecap() {
  const webhook = localStorage.getItem(DISCORD_KEY);
  if (!webhook) return;
  const today = new Date();
  if (today.getDay() !== 0) return;
  const weekKey = `ifsi_discord_${_weekKey()}`;
  if (localStorage.getItem(weekKey)) return;
  const ok = await _buildAndSendRecap();
  if (ok) localStorage.setItem(weekKey, '1');
}

function _weekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const w = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`;
}

async function _buildAndSendRecap() {
  const webhook = localStorage.getItem(DISCORD_KEY);
  if (!webhook) return false;

  const { state } = App.Store;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    weekDays.push(d.toISOString().slice(0, 10));
  }

  let wReviewed = 0, wOk = 0, wHard = 0, wNope = 0;
  weekDays.forEach(day => {
    const e = state.studyLog[day];
    if (e) { wReviewed += e.reviewed||0; wOk += e.ok||0; wHard += e.hard||0; wNope += e.nope||0; }
  });

  const accuracy = wReviewed > 0 ? Math.round(wOk / wReviewed * 100) : 0;
  const daysDone = weekDays.filter(d => (state.studyLog[d]?.reviewed||0) > 0).length;
  const streak   = _streakCount(state.studyLog);
  const dueNow   = state.cards.filter(c => !c.suspended && (!c.progress || (c.progress.nextReview||todayStr) <= todayStr)).length;
  const cats     = _getCatStats(7);
  const sorted   = Object.entries(cats).sort((a, b) => {
    const efA = a[1].efCount > 0 ? a[1].efSum / a[1].efCount : 2.5;
    const efB = b[1].efCount > 0 ? b[1].efSum / b[1].efCount : 2.5;
    return efA - efB; // matières les plus faibles en premier
  });

  const lines = [];
  lines.push(`# 📅 Bilan de la semaine — ${weekDays[0]} → ${weekDays[6]}`);
  lines.push(``);

  // Stats globales
  lines.push(`## 📊 Résultats globaux`);
  lines.push(`🗂️ Cartes révisées : **${wReviewed}** · 📆 Jours actifs : **${daysDone}/7** · 🔥 Série : **${streak} jours**`);
  lines.push(`✅ **${wOk}** réussies · ⚠️ **${wHard}** difficiles · ❌ **${wNope}** ratées · 🎯 **${accuracy}%**`);
  lines.push(``);

  // Note de la semaine
  const note = daysDone >= 6 ? '🏆 Semaine exemplaire !' : daysDone >= 4 ? '👍 Bonne semaine !' : daysDone >= 2 ? '📈 Semaine correcte — vise 5 jours+' : '⚠️ Semaine creuse — la régularité est la clé';
  lines.push(`> ${note}`);
  lines.push(``);

  // Bilan par matière
  lines.push(`## 📚 Bilan par matière`);
  sorted.forEach(([cat, s]) => {
    if (s.efCount === 0) { lines.push(`⚪ **${cat}** — Non commencé (${s.total} cartes au total)`); return; }
    const ef  = s.efSum / s.efCount;
    const pct = Math.round(Math.min(100, Math.max(0, (ef - 1.3) / (3.5 - 1.3) * 100)));
    const tag = pct >= 75 ? '🟢' : pct >= 45 ? '🟡' : '🔴';
    const lapsRate = s.lapses / s.efCount;
    const note2 = pct >= 75 ? 'Maîtrisé' : pct >= 45 ? 'En progression' : 'À renforcer';
    const lapsNote = lapsRate > 0.5 ? ` _(${s.lapses} erreurs répétées)_` : '';
    lines.push(`${tag} **${cat}** — ${note2}, ${pct}% maîtrise · ${s.due} carte${s.due !== 1 ? 's' : ''} en attente${lapsNote}`);
  });
  lines.push(``);

  // Analyse et conseils
  lines.push(`## 💡 Analyse & Conseils`);
  const weak  = sorted.filter(([, s]) => s.efCount > 0 && (s.efSum / s.efCount) < 2.0);
  const good  = sorted.filter(([, s]) => s.efCount > 0 && (s.efSum / s.efCount) >= 2.8);
  const notStarted = sorted.filter(([, s]) => s.notStarted > 0);

  if (weak.length > 0) {
    lines.push(`🔴 **Points faibles :** ${weak.map(([c]) => c).join(', ')}. Ces matières nécessitent plus d'attention la semaine prochaine. Envisage de relire tes cours en parallèle des cartes.`);
  }
  if (good.length > 0) {
    lines.push(`🟢 **Points forts :** ${good.map(([c]) => c).join(', ')}. Continue à les entretenir sans te reposer sur tes acquis.`);
  }
  if (dueNow > 0) {
    lines.push(`⚠️ **${dueNow} cartes en retard** à ce jour — attaque-les dès demain en priorité.`);
  } else {
    lines.push(`✨ **Aucun retard** — tu es à jour sur toutes les matières, excellent travail !`);
  }
  if (notStarted.length > 0 && wReviewed > 20) {
    lines.push(`💡 Tu as des cartes non commencées en ${notStarted.slice(0,2).map(([c]) => c).join(' et ')} — pense à les intégrer à ta prochaine session.`);
  }
  lines.push(``);
  lines.push(`▶️ https://poli-21.github.io/revision-ifsi/`);

  return _sendDiscordMsg(lines.join('\n'));
}

// ── Helpers ────────────────────────────────────────────────────
function _progressBar(pct) {
  const filled = Math.round(pct / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function _frDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function _sendDiscordMsg(content) {
  const webhook = localStorage.getItem(DISCORD_KEY);
  if (!webhook) return Promise.resolve(false);

  // Discord limite a 2000 caracteres par message — on decoupe par blocs
  const LIMIT = 1900;
  const chunks = [];
  if (content.length <= LIMIT) {
    chunks.push(content);
  } else {
    // Decoupe sur les sauts de ligne pour ne pas couper une ligne en deux
    const lines = content.split('\n');
    let current = '';
    for (const line of lines) {
      const candidate = current ? current + '\n' + line : line;
      if (candidate.length > LIMIT) {
        if (current) chunks.push(current);
        current = line.length > LIMIT ? line.slice(0, LIMIT) : line;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }

  // Envoie les morceaux sequentiellement
  const _post = (text) => fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text, username: 'Revision IFSI' })
  }).then(r => {
    if (!r.ok) return r.text().then(t => { console.warn('Discord error', r.status, t); return false; });
    return true;
  }).catch(e => { console.warn('Discord fetch error', e); return false; });

  return chunks.reduce((promise, chunk) =>
    promise.then(ok => ok ? _post(chunk) : Promise.resolve(false))
  , Promise.resolve(true));
}

function _streakCount(studyLog) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((studyLog[key]?.reviewed||0) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function _updateNotifUI() {
  const btn = document.getElementById('notif-enable-btn');
  if (btn) {
    const granted = 'Notification' in window && Notification.permission === 'granted';
    btn.textContent = granted ? '✅ Notifications activées' : '🔔 Activer les notifications';
    btn.disabled    = granted;
    btn.style.opacity = granted ? '.6' : '1';
  }
  const inp   = document.getElementById('discord-webhook-input');
  const saved = document.getElementById('discord-webhook-saved');
  const wh    = localStorage.getItem(DISCORD_KEY) || '';
  if (inp && !inp.value) inp.value = wh;
  if (saved) saved.style.display = wh ? 'block' : 'none';
}

// ── Sidebar desktop collapse ───────────────────────────────────
function toggleDesktopSidebar() {
  const sidebar  = document.getElementById('main-sidebar');
  const reopenBtn = document.getElementById('sidebar-reopen-btn');
  if (!sidebar) return;
  const collapsed = sidebar.classList.toggle('collapsed');
  localStorage.setItem('ifsi_sidebar_collapsed', collapsed ? '1' : '0');
  if (reopenBtn) reopenBtn.style.display = collapsed ? 'inline-flex' : 'none';
}

function _initSidebarState() {
  if (window.innerWidth <= 700) return; // mobile = géré séparément
  if (localStorage.getItem('ifsi_sidebar_collapsed') === '1') {
    const sidebar   = document.getElementById('main-sidebar');
    const reopenBtn = document.getElementById('sidebar-reopen-btn');
    if (sidebar)   sidebar.classList.add('collapsed');
    if (reopenBtn) reopenBtn.style.display = 'inline-flex';
  }
}

// ── Gestion des examens ────────────────────────────────────────
const EXAMS_KEY = 'ifsi_exams_v2';
let _editingExamId = null;

function _loadExams() {
  try {
    let exams = JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]');
    // Nettoyage auto : supprime les examens passés depuis plus de 7 jours
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const before  = exams.length;
    exams = exams.filter(e => {
      const examMs = new Date(e.date + 'T00:00:00').getTime();
      return (todayMs - examMs) < 7 * 86400000; // garde si < 7 jours de retard
    });
    if (exams.length !== before) _saveExams(exams); // persiste si nettoyage
    return exams;
  } catch(e) { return []; }
}
function _saveExams(exams) {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}
function _examId() {
  return Math.random().toString(36).slice(2,10);
}

// ── Ouvrir modal (nouveau ou édition) ─────────────────────────
function openExamModal(id) {
  _editingExamId = id || null;
  const overlay = document.getElementById('exam-overlay');
  if (!overlay) return;

  const cats = App.Render.orderedCats();
  const catsEl = document.getElementById('exam-form-cats');
  if (catsEl) {
    catsEl.innerHTML = cats.map(c =>
      `<label style="display:flex;align-items:center;gap:5px;font-size:.82rem;padding:4px 8px;border:1px solid var(--gray-200);border-radius:6px;cursor:pointer;white-space:nowrap">
        <input type="checkbox" name="exam-cat" value="${_esc(c)}"> ${_esc(c)}
      </label>`
    ).join('');
  }

  const nameEl  = document.getElementById('exam-form-name');
  const dateEl  = document.getElementById('exam-form-date');
  const titleEl = document.getElementById('exam-modal-title');
  const delBtn  = document.getElementById('exam-form-delete-btn');
  const prepBtn = document.getElementById('exam-form-prep-btn');
  const statsEl = document.getElementById('exam-form-stats');

  if (id) {
    // Mode édition
    const exam = _loadExams().find(e => e.id === id);
    if (!exam) return;
    if (nameEl)  nameEl.value  = exam.name;
    if (dateEl)  dateEl.value  = exam.date;
    if (titleEl) titleEl.textContent = '🎓 Modifier l\'examen';
    if (delBtn)  delBtn.style.display = 'block';
    if (prepBtn) prepBtn.style.display = 'inline-flex';
    // Coche les matières
    if (catsEl && exam.cats?.length) {
      catsEl.querySelectorAll('input[name="exam-cat"]').forEach(cb => {
        cb.checked = exam.cats.includes(cb.value);
      });
    }
    // Affiche les stats
    _renderExamFormStats(exam);
    if (statsEl) statsEl.style.display = 'block';
  } else {
    // Mode nouveau
    if (nameEl)  nameEl.value  = '';
    if (dateEl)  dateEl.value  = '';
    if (titleEl) titleEl.textContent = '🎓 Nouvel examen';
    if (delBtn)  delBtn.style.display = 'none';
    if (prepBtn) prepBtn.style.display = 'none';
    if (statsEl) statsEl.style.display = 'none';
  }

  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.style.opacity = '1');
  setTimeout(() => nameEl?.focus(), 100);
}

function closeExamModal() {
  const overlay = document.getElementById('exam-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 200);
  _editingExamId = null;
}

function saveExamForm() {
  const name = document.getElementById('exam-form-name')?.value.trim();
  const date = document.getElementById('exam-form-date')?.value;
  if (!name) { document.getElementById('exam-form-name')?.focus(); return; }
  if (!date) { document.getElementById('exam-form-date')?.focus(); return; }

  const cats = [...document.querySelectorAll('input[name="exam-cat"]:checked')].map(cb => cb.value);
  const exams = _loadExams();

  if (_editingExamId) {
    const idx = exams.findIndex(e => e.id === _editingExamId);
    if (idx !== -1) exams[idx] = { ...exams[idx], name, date, cats };
  } else {
    exams.push({ id: _examId(), name, date, cats });
  }

  _saveExams(exams);
  closeExamModal();
  App.Render.all();
}

function deleteExamForm() {
  if (!_editingExamId) return;
  if (!confirm('Supprimer cet examen ?')) return;
  const exams = _loadExams().filter(e => e.id !== _editingExamId);
  _saveExams(exams);
  closeExamModal();
  App.Render.all();
}

function startExamPrep(id) {
  const examId = id || _editingExamId;
  if (!examId) return;
  const exam = _loadExams().find(e => e.id === examId);
  if (!exam) return;
  closeExamModal();

  // Lance une session avec les cartes à risque pour cet exam
  const { state } = App.Store;
  const today = new Date().toISOString().slice(0, 10);
  let pool = state.cards.filter(c => !c.suspended);
  if (exam.cats?.length) pool = pool.filter(c => exam.cats.includes(c.cat));

  // Cartes à risque : nextReview <= date exam (mémoire expirée avant l'exam), ou jamais révisées
  const atRisk = pool.filter(c => {
    if (!c.progress) return true; // jamais révisée
    return (c.progress.nextReview || today) <= exam.date;
  });

  if (atRisk.length === 0) {
    alert(`✅ Aucune carte à risque pour "${exam.name}" — tu es prêt(e) !`);
    return;
  }

  // Démarre la session avec ces cartes (en forçant la queue)
  App.Session.startWithCards(atRisk, `🎓 Prép. ${exam.name}`);
}

// ── Stats pour le formulaire ───────────────────────────────────
function _renderExamFormStats(exam) {
  const el = document.getElementById('exam-form-stats-content');
  if (!el) return;
  const { state } = App.Store;
  const today = new Date().toISOString().slice(0, 10);

  let pool = state.cards.filter(c => !c.suspended);
  if (exam.cats?.length) pool = pool.filter(c => exam.cats.includes(c.cat));

  const total   = pool.length;
  const atRisk  = pool.filter(c => !c.progress || (c.progress.nextReview || today) <= exam.date).length;
  const ready   = total - atRisk;
  const pct     = total > 0 ? Math.round(ready / total * 100) : 0;
  const diffDays = Math.round((new Date(exam.date + 'T00:00:00') - new Date()) / 86400000);
  const col     = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

  // Par matière
  const byCat = {};
  pool.forEach(c => {
    const cat = c.cat || 'Général';
    if (!byCat[cat]) byCat[cat] = { total: 0, risk: 0 };
    byCat[cat].total++;
    if (!c.progress || (c.progress.nextReview || today) > exam.date) byCat[cat].risk++;
  });

  const catRows = Object.entries(byCat).map(([cat, s]) => {
    const cp  = Math.round((s.total - s.risk) / s.total * 100);
    const cc  = cp >= 80 ? 'var(--success)' : cp >= 50 ? 'var(--warning)' : 'var(--danger)';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:.78rem">
      <span style="color:var(--gray-700);max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(cat)}</span>
      <span>
        <span style="color:${cc};font-weight:700">${cp}%</span>
        ${s.risk > 0 ? `<span style="color:var(--danger);margin-left:6px">⚠ ${s.risk} à risque</span>` : `<span style="color:var(--success);margin-left:6px">✓</span>`}
      </span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div style="text-align:center">
        <div style="font-size:2rem;font-weight:800;color:${col}">${pct}%</div>
        <div style="font-size:.7rem;color:var(--gray-500)">prêt(e)</div>
      </div>
      <div style="flex:1">
        <div style="height:8px;background:var(--gray-200);border-radius:99px;overflow:hidden;margin-bottom:5px">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:99px;transition:width .4s"></div>
        </div>
        <div style="font-size:.78rem;color:var(--gray-600)">${ready} / ${total} cartes maîtrisées · <strong style="color:var(--danger)">${atRisk} à risque</strong></div>
        <div style="font-size:.75rem;color:var(--gray-400);margin-top:2px">${diffDays > 0 ? `${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''}` : diffDays === 0 ? "C'est aujourd'hui !" : 'Examen passé'}</div>
      </div>
    </div>
    ${catRows ? `<div style="border-top:1px solid var(--gray-200);padding-top:8px">${catRows}</div>` : ''}`;
}

// ── Compat ancienne clé unique ─────────────────────────────────
function saveExamDate(val) {
  if (val) localStorage.setItem('ifsi_exam_date', val);
  else     localStorage.removeItem('ifsi_exam_date');
  App.Render.all();
}

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Dark Mode ──────────────────────────────────────────────────
function toggleDarkMode() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('ifsi_dark', dark ? '1' : '0');
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
}

function _initDarkMode() {
  const stored = localStorage.getItem('ifsi_dark');
  // Si jamais défini, suit la préférence système
  const prefersDark = stored === null
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : stored === '1';
  if (prefersDark) {
    document.body.classList.add('dark');
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = '☀️';
  }
  // Écoute les changements système (si pas de préférence stockée)
  if (stored === null) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      document.body.classList.toggle('dark', e.matches);
      const btn = document.getElementById('dark-toggle');
      if (btn) btn.textContent = e.matches ? '☀️' : '🌙';
    });
  }
}

// ── Sauvegardes locales ────────────────────────────────────────
const BACKUP_PREFIX = 'ifsi_backup_';
const BACKUP_DAYS   = 7;

async function _initBackup() {
  const today = new Date().toISOString().slice(0, 10);
  const key   = BACKUP_PREFIX + today;
  // Déjà sauvegardé aujourd'hui ?
  const existing = await App.Store.getBackup(key);
  if (!existing) {
    await _saveBackup(today);
    _showBackupToast(today);
  }
  // Nettoyage des vieilles sauvegardes
  await _pruneBackups();
}

async function _saveBackup(dateStr) {
  const { state } = App.Store;
  const data = {
    v: 1,
    date: dateStr,
    cards:    state.cards,
    studyLog: state.studyLog,
    catOrder: state.catOrder
  };
  await App.Store.setBackup(BACKUP_PREFIX + dateStr, data);
}

async function createBackupNow() {
  const today = new Date().toISOString().slice(0, 10);
  await _saveBackup(today);
  _showBackupToast(today);
  _refreshBackupList();
}

async function _pruneBackups() {
  const keys = await App.Store.listBackupKeys();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BACKUP_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const k of keys) {
    const d = k.replace(BACKUP_PREFIX, '');
    if (d < cutoffStr) await App.Store.deleteBackup(k);
  }
}

async function _refreshBackupList() {
  const list = document.getElementById('backup-list');
  if (!list) return;
  const keys = (await App.Store.listBackupKeys()).sort().reverse();
  if (keys.length === 0) {
    list.innerHTML = '<div style="font-size:.8rem;color:var(--gray-400)">Aucune sauvegarde locale.</div>';
    return;
  }
  list.innerHTML = keys.map(k => {
    const d = k.replace(BACKUP_PREFIX, '');
    const label = new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--gray-100);border-radius:8px;font-size:.82rem">
      <span>📁 ${label}</span>
      <button class="btn btn-ghost btn-sm" onclick="downloadBackup('${k}')">⬇️ Télécharger</button>
    </div>`;
  }).join('');
}

async function downloadBackup(key) {
  const data = await App.Store.getBackup(key);
  if (!data) { alert('Sauvegarde introuvable.'); return; }
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `revision-ifsi-backup-${data.date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function _showBackupToast(dateStr) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:99px;font-size:.82rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:fadeInUp .3s ease';
  toast.textContent = `💾 Sauvegarde locale du ${dateStr}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

document.addEventListener('DOMContentLoaded', App.init);
