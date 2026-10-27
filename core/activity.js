// core/activity.js — Chrono d'activité partagé pour les ENTRAÎNEMENTS
// (Jeux de l'onglet Entraînement, Orthographe, Pharmaco, Gaz du sang). Le temps réellement passé à s'entraîner
// s'ajoute à « Temps » du jour et de la semaine. Aucune carte comptée, aucun effet sur l'objectif
// de 100 cartes ni sur la série de jours : seul le temps est compté.
// Règles (identiques à l'onglet Anglais et à la Simulation) :
//   - page cachée, autre onglet de l'app, écran de fin/réglages ou 1 min sans rien toucher = pause ;
//   - jamais plus de 5 s ajoutées par tic (2 s) ;
//   - un seul chrono à la fois (jamais de double comptage).
'use strict';
window.App = window.App || {};

App.Activity = (() => {
  const IDLE_MS = 60 * 1000;
  const TICK_MS = 2000;
  const MAX_DT  = 5;

  const kinds = {};                 // kind -> { live: () => bool, acc: secondes en cours }
  let _timer = null, _lastAct = 0, _lastTick = 0, _bound = false;

  function _shown(id) {
    const e = document.getElementById(id);
    return !!e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none';
  }
  function _mark() { _lastAct = Date.now(); }

  function _bind() {
    if (_bound) return;
    ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove', 'input'].forEach(ev =>
      document.addEventListener(ev, _mark, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => { _lastTick = Date.now(); _tick(); });
    window.addEventListener('pagehide', () => { try { App.Store.saveLog(); } catch (e) {} });
    _bound = true;
  }

  // Enregistre un type d'entraînement. live() doit répondre « true » seulement quand l'élève est
  // vraiment en train de s'entraîner (zone de pratique affichée, pas l'écran de choix ni de fin).
  function register(kind, live) {
    kinds[kind] = { live, acc: 0 };
    _bind();
    _mark();
    _lastTick = Date.now();
    if (!_timer) _timer = setInterval(_tick, TICK_MS);
  }

  function _tick() {
    const now = Date.now();
    const dt = Math.min(MAX_DT, Math.max(0, (now - _lastTick) / 1000));
    _lastTick = now;
    if (document.hidden || now - _lastAct > IDLE_MS) return;
    for (const k of Object.keys(kinds)) {
      let live = false;
      try { live = !!kinds[k].live(); } catch (e) {}
      if (!live) continue;
      const K = kinds[k];
      K.acc += dt;
      const whole = Math.floor(K.acc);
      if (whole > 0) {
        K.acc -= whole;
        try { App.Store.logTraining({ kind: k, seconds: whole }); App.Render.todayStats(); } catch (e) {}
      }
      break;                                   // un seul chrono à la fois
    }
  }

  // ── Les types d'entraînement de l'app ──────────────────
  // Jeux (Vrai/Faux, trous, association, tryhard) : seulement pendant une partie.
  register('game',   () => _shown('games-view') && _shown('games-practice'));
  // Pharmaco : pendant une série (questions, correction). Ni le menu ni l'écran de bilan.
  register('pharma', () => _shown('games-view') && _shown('pharma-root')
                          && !!(App.Pharma && App.Pharma.isTraining && App.Pharma.isTraining()));

  // Gaz du sang : pendant une série (questions, cas guidés, correction). Ni le menu ni le bilan.
  // (L'atelier lancé depuis la simulation est compté par la simulation, pas ici.)
  register('gazo',   () => _shown('games-view') && _shown('gazo-root')
                          && !!(App.Gazo && App.Gazo.isTraining && App.Gazo.isTraining()));

  // Secourisme PSE1 : pendant un cas (étapes, correction). Ni le menu ni le bilan.
  register('secours', () => _shown('games-view') && _shown('secours-root')
                          && !!(App.Sec && App.Sec.isTraining && App.Sec.isTraining()));

  // Entraînement TP : pendant un exercice, la pratique guidée ou l'auto-évaluation (pas le menu).
  register('tp', () => _shown('games-view') && _shown('tp-root')
                     && !!(App.Tp && App.Tp.isTraining && App.Tp.isTraining()));

  // Calcul de doses : pendant une série (pas le menu ni le résultat).
  register('dose', () => _shown('games-view') && _shown('dose-root')
                      && !!(App.Dose && App.Dose.isTraining && App.Dose.isTraining()));

  // Pathologies aux urgences : pendant l'observation et le choix de réponse (pas le menu ni le résultat).
  register('patho', () => _shown('games-view') && _shown('patho-root')
                       && !!(App.Patho && App.Patho.isTraining && App.Patho.isTraining()));

  return { register, markActivity: _mark, _t: { tick: _tick, kinds: () => Object.keys(kinds) } };
})();
