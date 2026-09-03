// core/ue.js — Référentiel 2026 : 15 UE / 5 domaines / 13 compétences
// Source unique de vérité réutilisée par le sélecteur de carte, le tag en masse
// et l'onglet Partiels.
'use strict';
window.App = window.App || {};

App.UE = (() => {

  const DOMAINS = [
    { code: 'A', name: 'Sciences infirmières et raisonnement clinique', color: '#2563eb' },
    { code: 'B', name: 'Pratiques cliniques et gestion des risques',     color: '#16a34a' },
    { code: 'C', name: 'Prévention et promotion de la santé',            color: '#f59e0b' },
    { code: 'D', name: 'Communication et leadership',                   color: '#8b5cf6' },
    { code: 'E', name: 'Démarche scientifique et méthodologie',          color: '#ec4899' },
  ];

  // ects = crédits ECTS officiels de l'UE (Annexe III, arrêté du 20/02/2026).
  // C'est aussi le coefficient de pondération utilisé pour la moyenne de semestre
  // (le référentiel ne définit pas de coefficient distinct des ECTS).
  const LIST = [
    { code: 'A.1', domain: 'A', name: 'Fondements des sciences infirmières et raisonnement clinique', ects: 9 },
    { code: 'A.2', domain: 'A', name: 'Législation, déontologie, éthique', ects: 6 },
    { code: 'B.1', domain: 'B', name: 'Sciences biomédicales', ects: 18 },
    { code: 'B.2', domain: 'B', name: 'Sciences humaines et sociales', ects: 6 },
    { code: 'B.3', domain: 'B', name: 'Pratiques et interventions infirmières', ects: 18 },
    { code: 'B.4', domain: 'B', name: 'Démarche qualité et gestion des risques', ects: 3 },
    { code: 'C.1', domain: 'C', name: 'Santé publique, promotion de la santé et prévention, éducation thérapeutique', ects: 15 },
    { code: 'C.2', domain: 'C', name: 'Santé environnementale et transition écologique', ects: 6 },
    { code: 'D.1', domain: 'D', name: 'Savoir-être, communication professionnelle et leadership', ects: 6 },
    { code: 'D.2', domain: 'D', name: "Coordination des activités et des soins et gestion d'une structure", ects: 2 },
    { code: 'D.3', domain: 'D', name: 'Formation, développement des compétences et analyse des pratiques', ects: 2 },
    { code: 'D.4', domain: 'D', name: 'Numérique en santé', ects: 2 },
    { code: 'E.1', domain: 'E', name: 'Recherche, méthodes, analyse critique et données probantes', ects: 12 },
    { code: 'E.2', domain: 'E', name: 'Langue vivante étrangère', ects: 6 },
    { code: 'E.3', domain: 'E', name: 'Méthodes de travail et aide à la réussite', ects: 3 },
  ];
  const TOTAL_ECTS = LIST.reduce((s, u) => s + u.ects, 0);

  const COMPETENCES = [
    { code: 'C1',  ue: 'A.1', name: 'Élaborer le diagnostic infirmier pour identifier les interventions adaptées' },
    { code: 'C2',  ue: 'A.2', name: "Définir les interventions en co-construction, dans le respect de la déontologie et de l'éthique" },
    { code: 'C3',  ue: 'B.3', name: 'Réaliser des soins de dépistage, prévention, diagnostic, thérapeutique et palliatif' },
    { code: 'C4',  ue: 'B.3', name: 'Prescrire des produits de santé et des examens complémentaires', nouvelle: true },
    { code: 'C5',  ue: 'C.1', name: 'Concevoir et conduire une démarche de promotion de la santé' },
    { code: 'C6',  ue: 'C.1', name: "Concevoir et conduire une démarche d'éducation thérapeutique, de prévention et de repérage" },
    { code: 'C7',  ue: 'C.2', name: 'Conduire des actions sur les enjeux environnementaux en santé', nouvelle: true },
    { code: 'C8',  ue: 'D.2', name: "Gérer ou organiser une structure d'exercice en optimisant les ressources" },
    { code: 'C9',  ue: 'D.4', name: 'Organiser les soins et transmettre via les outils numériques en équipe pluri-professionnelle', nouvelle: true },
    { code: 'C10', ue: 'D.3', name: 'Accompagner les pairs, les apprenants et les autres professionnels' },
    { code: 'C11', ue: 'E.1', name: "Mettre en œuvre l'amélioration continue des soins et de sa pratique" },
    { code: 'C12', ue: 'E.1', name: 'Analyser des données scientifiques pour optimiser sa pratique' },
    { code: 'C13', ue: 'E.1', name: 'Formaliser des documents professionnels dans une démarche scientifique' },
  ];

  function byCode(code)     { return LIST.find(u => u.code === code) || null; }
  function domainInfo(code) { return DOMAINS.find(d => d.code === code) || null; }
  function domainOfUE(code) { const u = byCode(code); return u ? domainInfo(u.domain) : null; }
  function grouped()        { return DOMAINS.map(d => ({ ...d, ues: LIST.filter(u => u.domain === d.code) })); }
  function label(code)      { const u = byCode(code); return u ? `${u.code} — ${u.name}` : code; }

  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Construit les <optgroup>/<option> des 15 UE, regroupées par domaine.
  function optionsHTML(selected) {
    return grouped().map(d =>
      `<optgroup label="${d.code} — ${_esc(d.name)}">` +
      d.ues.map(u => `<option value="${u.code}" ${u.code === selected ? 'selected' : ''}>${u.code} — ${_esc(u.name)}</option>`).join('') +
      '</optgroup>'
    ).join('');
  }

  // Migration ponctuelle : certaines cartes par défaut (ex. les fiches "Référentiel 2026")
  // ont été ajoutées au store d'un utilisateur avant l'introduction du tag UE. Cette
  // fonction reporte le tag `ue` d'App.DEFAULT_CARDS sur toute carte déjà présente dans
  // le store qui a le même id mais n'a pas encore de `ue` — sans jamais écraser un tag
  // que l'utilisateur aurait lui-même choisi.
  function migrateReferenceCards() {
    if (!App.Store?.state?.cards || !App.DEFAULT_CARDS) return false;
    const defaultsById = new Map(App.DEFAULT_CARDS.map(c => [c.id, c]));
    let changed = false;
    App.Store.state.cards.forEach(c => {
      if (!c.ue) {
        const def = defaultsById.get(c.id);
        if (def && def.ue) { c.ue = def.ue; changed = true; }
      }
    });
    if (changed) App.Store.save();
    return changed;
  }

  return { DOMAINS, LIST, COMPETENCES, TOTAL_ECTS, byCode, domainInfo, domainOfUE, grouped, label, optionsHTML, migrateReferenceCards };
})();
