// data/cards.js — Cartes par défaut
//
// Vide intentionnellement : les 51 fiches "Référentiel 2026" (compétences, UE,
// contexte de la réforme) ont été retirées à la demande de l'utilisateur·ice —
// elles décrivaient la réforme elle-même, pas le contenu réel des cours à réviser.
// Chaque étudiant·e ajoute désormais ses propres cartes (import Notion, saisie
// manuelle) et les tague avec une UE via le sélecteur ou le tag en masse, pour
// que l'onglet Partiels puisse les organiser par semestre.
//
// Les personnes qui avaient déjà ces fiches en local (IndexedDB) les voient
// supprimées automatiquement au prochain chargement — voir
// core/ue.js → removeReferenceCards().
'use strict';
window.App = window.App || {};

App.DEFAULT_CARDS = [];
