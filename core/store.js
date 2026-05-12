// core/store.js — Gestion de l'état via IndexedDB (pas de limite 5 Mo)
'use strict';
window.App = window.App || {};

App.Store = (() => {
  const DB_NAME    = 'ifsi_srs_db';
  const DB_VERSION = 1;
  const STORE      = 'data';
  const KEY        = 'ifsi_srs_v5';
  const KEY_LOG    = 'ifsi_log_v1';
  const KEY_ORDER  = 'ifsi_cat_order_v1';

  const state = { cards: [], studyLog: {}, catOrder: [] };
  let db = null;

  // ── IndexedDB helpers ──────────────────────────────────────────
  function _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  function _get(key) {
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  function _set(key, value) {
    if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
  }

  // ── Normalisation catégorie ────────────────────────────────────
  function normCat(cat) {
    return String(cat || '')
      .normalize('NFC')                          // unifie les accents Unicode
      .replace(/[ ​‌‍﻿]/g, ' ') // espaces invisibles
      .replace(/[‐-―−]/g, '-')    // tirets Unicode → tiret simple
      .trim()
      .replace(/\s+/g, ' ');                     // espaces multiples → un seul
  }

  // ── Chargement (async) ─────────────────────────────────────────
  async function load() {
    db = await _openDB();

    // ── Migration localStorage → IndexedDB ──
    const lsCards = localStorage.getItem(KEY);
    if (lsCards) {
      try {
        const cards = JSON.parse(lsCards);
        await new Promise(res => {
          const tx = db.transaction(STORE, 'readwrite');
          const s  = tx.objectStore(STORE);
          s.put(cards, KEY);
          const log = localStorage.getItem(KEY_LOG);
          if (log) s.put(JSON.parse(log), KEY_LOG);
          const ord = localStorage.getItem(KEY_ORDER);
          if (ord) s.put(JSON.parse(ord), KEY_ORDER);
          tx.oncomplete = res;
        });
        [KEY, KEY_LOG, KEY_ORDER, 'ifsi_srs_v3', 'ifsi_srs_v4'].forEach(k => localStorage.removeItem(k));
      } catch(e) { /* migration échouée, on continue */ }
    }

    // ── Chargement des cartes ──
    try {
      const cards = await _get(KEY);
      if (cards && Array.isArray(cards)) {
        const existIds = new Set(cards.map(c => c.id));
        const newCards = (App.DEFAULT_CARDS || []).filter(c => !existIds.has(c.id));
        state.cards = [...cards, ...newCards];
        if (newCards.length) save();
      } else {
        state.cards = (App.DEFAULT_CARDS || []).map(c => ({ ...c }));
        save();
      }
    } catch(e) {
      state.cards = (App.DEFAULT_CARDS || []).map(c => ({ ...c }));
      save();
    }

    // ── Chargement du log ──
    try {
      const log = await _get(KEY_LOG);
      if (log) state.studyLog = log;
    } catch(e) { state.studyLog = {}; }

    // ── Chargement de l'ordre ──
    try {
      const ord = await _get(KEY_ORDER);
      if (ord) state.catOrder = ord;
    } catch(e) { state.catOrder = []; }

    // ── Normalisation des catégories ──
    let dirty = false;
    state.cards.forEach(c => {
      const cleaned = normCat(c.cat);
      if (cleaned !== c.cat) { c.cat = cleaned; dirty = true; }
    });
    if (dirty) save();
  }

  // ── Sauvegarde ────────────────────────────────────────────────
  function save()      { _set(KEY,       state.cards);    _notifyStorage(); if (window.App?.Sync) App.Sync.pushDebounced(); }
  function saveLog()   { _set(KEY_LOG,   state.studyLog); }
  function saveOrder() { _set(KEY_ORDER, state.catOrder); }

  // ── Indicateur de stockage ─────────────────────────────────────
  function _notifyStorage() {
    if (!navigator.storage || !navigator.storage.estimate) return;
    navigator.storage.estimate().then(({ usage, quota }) => {
      const el = document.getElementById('storage-indicator');
      if (!el) return;
      const usedMB  = (usage  / 1048576).toFixed(1);
      const quotaMB = (quota  / 1048576).toFixed(0);
      const pct     = Math.min(100, Math.round(usage / quota * 100));
      const warn    = pct > 80;
      el.title   = `Stockage : ${usedMB} Mo utilisés sur ${quotaMB} Mo`;
      el.style.display    = 'inline-flex';
      el.style.background = warn ? '#fee2e2' : '#f0fdf4';
      el.style.color      = warn ? '#dc2626' : '#16a34a';
      el.textContent      = warn ? `⚠ ${usedMB}Mo` : `💾 ${usedMB}Mo`;
    });
  }

  // ── Log des révisions ─────────────────────────────────────────
  function logReview(quality) {
    const today = App.SRS.todayStr();
    if (!state.studyLog[today]) state.studyLog[today] = { reviewed: 0, ok: 0, hard: 0, nope: 0 };
    state.studyLog[today].reviewed++;
    if      (quality >= 4)  state.studyLog[today].ok++;
    else if (quality === 3) state.studyLog[today].hard++;
    else                    state.studyLog[today].nope++;
    saveLog();
  }

  function logSessionDuration(seconds) {
    const today = App.SRS.todayStr();
    if (!state.studyLog[today]) state.studyLog[today] = { reviewed: 0, ok: 0, hard: 0, nope: 0, seconds: 0 };
    state.studyLog[today].seconds = (state.studyLog[today].seconds || 0) + seconds;
    saveLog();
  }

  function getStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (state.studyLog[key] && state.studyLog[key].reviewed > 0) streak++;
      else break;
    }
    return streak;
  }

  return { state, load, save, saveLog, saveOrder, normCat, logReview, logSessionDuration, getStreak };
})();
