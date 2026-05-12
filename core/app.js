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
    document.getElementById('session-view').style.display = 'none';
    ['home','browse','stats','ortho','games'].forEach(t => {
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
  await App.Store.load();   // IndexedDB est async
  try { App.Sync?.init?.(); } catch(e) { console.warn('Sync init failed:', e); } // Sync
  App.Render.all();
  App.UI.switchTab('home');
  _initKeyboard();
  App.Store.save();         // déclenche l'indicateur de stockage
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
  const url = `http://${location.hostname || window.location.hostname}:8080`;
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

function doSyncDisconnect() {
  if (!confirm('Déconnecter la synchronisation ? Les données locales sont conservées.')) return;
  App.Sync.disconnect();
  document.getElementById('sync-setup-zone').style.display    = 'block';
  document.getElementById('sync-connected-zone').style.display = 'none';
  document.getElementById('sync-settings-btn').textContent    = '☁️ Sync';
}

document.addEventListener('DOMContentLoaded', App.init);
