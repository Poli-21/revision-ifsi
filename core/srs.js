// core/srs.js — Algorithme SRS avancé (SM-2 amélioré)
// Basé sur SM-2 avec corrections Anki + plafonds + détection des cartes difficiles
'use strict';
window.App = window.App || {};

App.SRS = (() => {
  const LABELS = ['Nouveau','J+1','J+4','J+14','J+30','J+60','J+90','Maîtrisé'];
  const COLORS = ['#6b7280','#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#b45309','#059669'];

  // ── Constantes ────────────────────────────────────────────────
  const EF_START   = 2.5;   // EaseFactor de départ
  const EF_MIN     = 1.3;   // EF minimum absolu
  const EF_MAX     = 2.5;   // EF maximum (pas besoin de monter au-delà)
  const INT_MIN    = 1;     // Intervalle minimum : 1 jour
  const INT_MAX    = 180;   // Intervalle maximum : 6 mois (assez pour IFSI)
  const LEECH_THRESHOLD = 5; // Nombre d'échecs avant de marquer la carte

  // Étapes d'apprentissage (pour les nouvelles cartes et les réinitialisations)
  const STEPS = [1, 4]; // J+1 puis J+4 avant d'entrer dans le cycle SM-2

  const todayStr = () => new Date().toISOString().slice(0, 10);

  function addDays(d, n) {
    const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10);
  }

  function isDue(card) {
    if (card.suspended) return false;
    if (!card.progress)  return true;
    return card.progress.nextReview <= todayStr();
  }

  // ══════════════════════════════════════════════════════════════
  // Algorithme principal
  // quality : 0=Raté  3=Difficile  4=Su  5=Facile
  // ══════════════════════════════════════════════════════════════
  function update(card, quality) {
    const p = card.progress || {
      interval: 0, easeFactor: EF_START,
      repetitions: 0, lapses: 0, history: []
    };
    let { interval, easeFactor, repetitions, lapses = 0, history = [] } = p;

    // ── Phase d'apprentissage (reps 0 ou 1 = nouvelles cartes) ─
    if (repetitions <= 1) {
      switch (quality) {
        case 0: // Raté
          lapses++;
          // Si jamais validée (reps=0) → reste à J+0 (due aujourd'hui)
          // Si déjà vue une fois (reps=1) → retour à J+1
          interval    = repetitions === 0 ? 0 : STEPS[0];
          repetitions = 0;
          easeFactor  = Math.max(EF_MIN, easeFactor - 0.20);
          break;

        case 3: // Difficile
          // Reste à la même étape, sans pénalité EF en apprentissage
          interval = repetitions === 0 ? 0 : STEPS[0];
          break;

        case 4: // Su
          if (repetitions === 0) {
            interval    = STEPS[0];          // 1 jour
          } else {
            interval    = STEPS[1];          // 4 jours → entre dans la phase révision
          }
          repetitions++;
          break;

        case 5: // Facile
          // Saute une étape d'apprentissage
          interval    = repetitions === 0 ? STEPS[1] : Math.round(STEPS[1] * 1.5);
          repetitions = 2;                   // entre directement en phase révision
          easeFactor  = Math.min(EF_MAX, easeFactor + 0.10);
          break;
      }

    // ── Phase de révision (reps >= 2 = carte connue) ──────────
    } else {
      switch (quality) {
        case 0: // Raté → retour en apprentissage mais conserve une partie du chemin
          lapses++;
          // Pénalité : reset à l'étape 0 mais on se souvient du niveau EF
          repetitions = 0;
          interval    = STEPS[0];            // 1 jour
          // Pénalité EF plus forte si la carte est souvent ratée
          const efPenalty = lapses >= 3 ? 0.30 : 0.20;
          easeFactor = Math.max(EF_MIN, easeFactor - efPenalty);
          break;

        case 3: // Difficile → intervalle réduit, pas de reset
          // Réduit l'intervalle à ~65 % du précédent (min STEPS[0])
          interval   = Math.max(STEPS[0], Math.floor(interval * 0.65));
          easeFactor = Math.max(EF_MIN, easeFactor - 0.15);
          // repetitions inchangé : on ne perd pas sa place dans la courbe
          break;

        case 4: // Su → progression SM-2 standard
          interval    = _computeNext(interval, easeFactor);
          interval    = _fuzz(interval);
          interval    = Math.min(INT_MAX, Math.max(INT_MIN, interval));
          repetitions++;
          // EF : formule SM-2 pour q=4 → delta = 0 (neutre)
          break;

        case 5: // Facile → bonus de progression
          interval    = _computeNext(interval, easeFactor);
          interval    = Math.round(interval * 1.30); // bonus ×1.30
          interval    = _fuzz(interval);
          interval    = Math.min(INT_MAX, Math.max(INT_MIN, interval));
          repetitions++;
          easeFactor  = Math.min(EF_MAX, easeFactor + 0.10);
          break;
      }
    }

    // Arrondi propre
    easeFactor = Math.round(easeFactor * 100) / 100;

    // Détection leech : carte ratée trop souvent
    const isLeech = lapses >= LEECH_THRESHOLD;

    const today = todayStr();
    return {
      interval, easeFactor, repetitions, lapses,
      nextReview  : addDays(today, interval),
      lastReview  : today,
      lastQuality : quality,
      isLeech,
      history: [...history, {
        date: today, quality, interval, ef: easeFactor, lapses
      }].slice(-60)
    };
  }

  // ── Calcul d'intervalle SM-2 ───────────────────────────────────
  function _computeNext(interval, ef) {
    if (interval <= 1) return Math.round(ef);           // first real review
    return Math.round(interval * ef);
  }

  // ── Fuzz : étale les révisions pour éviter les avalanches ─────
  // ±7 % pour intervalles courts, ±4 % pour longs
  function _fuzz(interval) {
    const pct = interval <= 14 ? 0.07 : 0.04;
    const delta = Math.round(interval * pct);
    if (delta < 1) return interval;
    return interval + Math.floor(Math.random() * (delta * 2 + 1)) - delta;
  }

  // ── Prévisualisation ───────────────────────────────────────────
  function previewInterval(card, quality) {
    return update(card, quality).interval;
  }

  // ── Prévision sur N jours ──────────────────────────────────────
  function forecast(cards, days = 14) {
    const today  = new Date();
    const counts = Array(days).fill(0);
    cards.forEach(c => {
      if (!c.progress || c.suspended) return;
      const diff = Math.round((new Date(c.progress.nextReview) - today) / 86400000);
      if (diff >= 0 && diff < days) counts[diff]++;
    });
    return counts;
  }

  // ── Niveau d'affichage ─────────────────────────────────────────
  // Aligné sur les nouveaux intervalles (STEPS[1]=4, puis 14, 30…)
  function getLevel(card) {
    if (!card.progress) return 0;
    const iv = card.progress.interval || 0;
    if (iv <=  0) return 0;
    if (iv <=  2) return 1;   // J+1
    if (iv <=  7) return 2;   // J+4
    if (iv <= 20) return 3;   // J+14
    if (iv <= 45) return 4;   // J+30
    if (iv <= 75) return 5;   // J+60
    if (iv <=120) return 6;   // J+90
    return 7;                  // Maîtrisé (>120 j)
  }

  return {
    LABELS, COLORS, todayStr, addDays,
    isDue, update, previewInterval, forecast, getLevel,
    EF_MIN, EF_MAX, INT_MAX, LEECH_THRESHOLD
  };
})();
