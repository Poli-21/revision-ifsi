// core/regroup.js — « Regrouper par CM/TD » (App.Regroup)
// Fusionne les nombreuses sous-matières ("B1 > B1 - TD18 BPCO - Traitements", "… - Facteurs de risque", …)
// en un seul paquet par CM ou par TD ("B1 > B1 - TD18 BPCO").
//   1. APERÇU : rien n'est modifié. Pour chaque nouveau paquet : nom (modifiable), nombre de cartes, anciennes catégories fusionnées, case pour l'exclure.
//   2. SAUVEGARDE : un export JSON de toutes les cartes est téléchargé AVANT d'appliquer ; chaque carte modifiée garde son ancienne
//      catégorie dans card.catBefore (écrite une seule fois, jamais écrasée).
//   3. APPLIQUER : card.cat = nouveau nom (fusion automatique si le nom existe déjà, comme le renommage d'une matière), puis
//      sauvegarde, ordre des matières, examens et séries en pause mis à jour.
//   4. ANNULER : remet card.cat = card.catBefore pour toutes les cartes qui en ont une, puis supprime catBefore.
// Seul `cat` change : l'historique de révision (progress) n'est jamais touché. L'outil est idempotent (relancé, il ne trouve plus rien à faire).
'use strict';
window.App = window.App || {};

App.Regroup = (() => {
  const FLAG_KEY  = 'ifsi_regroup_v1';          // { v:1, at, map:{ancienneCatNorm: nouveauNom}, orderBefore:[…] } — sert à annuler et à remapper l'ordre synchronisé
  const EXAMS_KEY = 'ifsi_exams_v2';
  const RESUME_KEY2 = 'ifsi_session_resume2';

  // Table de correspondance ancien -> nouveau (null = on ne touche pas à la catégorie)
  const MAP = {
    "A2 > A2 - Bientraitance et maltraitance": "A2 > A2 - CM Bientraitance et maltraitance",
    "A2 > A2 - Consentement et information": "A2 > A2 - TD2 Responsabilité professionnelle et droits du patient",
    "A2 > A2 - Déontologie : réserve et confraternité": "A2 > A2 - CM Exercice de la profession",
    "A2 > A2 - Exercice de la profession": "A2 > A2 - CM Exercice de la profession",
    "A2 > A2 - La vulnérabilité (fragilité du sujet âgé)": "A2 > A2 - CM La vulnérabilité et fragilité du sujet âgé",
    "A2 > A2 - Le refus de soin": "A2 > A2 - CM Le refus de soin",
    "A2 > A2 - Personne de confiance": "A2 > A2 - TD2 Responsabilité professionnelle et droits du patient",
    "A2 > A2 - Secret professionnel et confidentialité": "A2 > A2 - CM Secret professionnel",
    "B1 > B1 - AOMI et ischémie aiguë": "B1 > B1 - CM15 AOMI et insuffisance veineuse chronique",
    "B1 > B1 - Bases d'anatomie générale": null,
    "B1 > B1 - Bilan biologique et examens (TD SCA)": "B1 > B1 - TD8 Syndrome coronarien aigu",
    "B1 > B1 - Biologie cellulaire": "B1 > B1 - CM2 Biologie cellulaire",
    "B1 > B1 - Circulation": "B1 > B1 - CM5 Circulation",
    "B1 > B1 - CM Protéines": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - CM12 Hémostase et anticoagulants": "B1 > B1 - CM12 Hémostase et anticoagulants",
    "B1 > B1 - CM17 Thrombose veineuse profonde et Embolie pulmonaire": "B1 > B1 - CM17 Thrombose veineuse profonde et embolie pulmonaire",
    "B1 > B1 - CM18 Fibrillation atriale": "B1 > B1 - CM18 Troubles du rythme (fibrillation atriale)",
    "B1 > B1 - CM19 Valvulopathies": "B1 > B1 - CM19 Valvulopathies",
    "B1 > B1 - CM21 Alvéole, plèvre et circulation pulmonaire": "B1 > B1 - CM21 Anatomie, physiologie respiratoire et gaz du sang",
    "B1 > B1 - CM21 Gaz du sang et transport de l'O2": "B1 > B1 - CM21 Anatomie, physiologie respiratoire et gaz du sang",
    "B1 > B1 - CM21 Ventilation et volumes pulmonaires": "B1 > B1 - CM21 Anatomie, physiologie respiratoire et gaz du sang",
    "B1 > B1 - CM21 Voies aériennes": "B1 > B1 - CM21 Anatomie, physiologie respiratoire et gaz du sang",
    "B1 > B1 - CM23 Asthme": "B1 > B1 - CM23 Asthme, BPCO et SAHOS",
    "B1 > B1 - CM23 BPCO": "B1 > B1 - CM23 Asthme, BPCO et SAHOS",
    "B1 > B1 - CM23 SAHOS": "B1 > B1 - CM23 Asthme, BPCO et SAHOS",
    "B1 > B1 - Compartiments liquidiens": "B1 > B1 - CM4 Homéostasie",
    "B1 > B1 - Enzymologie": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - Facteurs de risque et prévention respiratoires (CM22)": "B1 > B1 - CM22 Épidémiologie, facteurs de risque et prévention",
    "B1 > B1 - Glucides": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - Homéostasie": "B1 > B1 - CM4 Homéostasie",
    "B1 > B1 - Immunologie (TD2)": "B1 > B1 - TD2 Immunologie",
    "B1 > B1 - Insuffisance cardiaque": "B1 > B1 - CM16 Insuffisance cardiaque et sémiologie clinique",
    "B1 > B1 - Insuffisances respiratoires chroniques (CM24)": "B1 > B1 - CM24 IRC et décompensation",
    "B1 > B1 - Lipides": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - Macronutriments": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - Métabolisme énergétique": "B1 > B1 - CM2 Biologie cellulaire",
    "B1 > B1 - Molécules du vivant": "B1 > B1 - CM1 Molécules du vivant",
    "B1 > B1 - Mutations et génétique médicale": "B1 > B1 - CM3 Biologie moléculaire et génétique",
    "B1 > B1 - Pathologies coronaires": "B1 > B1 - CM14 Pathologies coronaires",
    "B1 > B1 - Pharmacologie (TD3)": "B1 > B1 - TD3 Pharmacologie",
    "B1 > B1 - Physiopathologie de la douleur": "B1 > B1 - CM6 Physiopathologie de la douleur",
    "B1 > B1 - Régulation de l'expression des gènes": "B1 > B1 - CM3 Biologie moléculaire et génétique",
    "B1 > B1 - Régulation du pH": "B1 > B1 - CM4 Homéostasie",
    "B1 > B1 - Structure et fonction d'un gène": "B1 > B1 - CM3 Biologie moléculaire et génétique",
    "B1 > B1 - Syndrome coronarien aigu": "B1 > B1 - TD8 Syndrome coronarien aigu",
    "B1 > B1 - TD HTA (TD9)": "B1 > B1 - TD9 HTA",
    "B1 > B1 - TD n°17 - Physiopathologie de l'asthme de l'adulte": "B1 > B1 - TD17 Physiopathologie de l'asthme",
    "B1 > B1 - TD12 MVTE": "B1 > B1 - TD12 MVTE",
    "B1 > B1 - TD18 BPCO - Conséquences et complications": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Définition et mécanisme": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Examens complémentaires": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Facteurs de risque": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Rôle infirmier et ETP": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Signes, exacerbation et gravité": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD18 BPCO - Traitements": "B1 > B1 - TD18 BPCO",
    "B1 > B1 - TD19 Crise d'asthme de l'adulte": "B1 > B1 - TD19 Crise d'asthme",
    "B1 > B1 - TD2 - Acronymes et sigles": "B1 > B1 - TD2 Immunologie",
    "B1 > B1 - TD2 - Notions difficiles": "B1 > B1 - TD2 Immunologie",
    "B1 > B1 - TD2 Immunologie": "B1 > B1 - TD2 Immunologie",
    "B1 > B1 - TD3 - Acronymes et sigles": "B1 > B1 - TD3 Pharmacologie",
    "B1 > B1 - TD3 - Notions difficiles": "B1 > B1 - TD3 Pharmacologie",
    "B1 > B1 - TD6 Intégration cardiovasculaire": "B1 > B1 - TD6 Intégration cardiovasculaire",
    "B1 > B1 - Thermorégulation": "B1 > B1 - CM4 Homéostasie",
    "B1 > B1 - Vitamines": "B1 > B1 - CM1 Molécules du vivant",
    "B3 > B3 - Analyse et surveillance des paramètres vitaux": "B3 > B3 - CM Analyse et surveillance des paramètres vitaux",
    "B3 > B3 - AOMI": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - Athérosclérose": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - Facteurs de risque cardiovasculaire": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - FR, SpO2 et gaz du sang": "B3 > B3 - CM9 FR, SpO2 et gaz du sang",
    "B3 > B3 - Hypertension artérielle (HTA)": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - Ischémie aiguë des membres inférieurs": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - Oxygénothérapie et interprétation des gaz du sang": "B3 > B3 - CM10 Oxygénothérapie et gaz du sang",
    "B3 > B3 - Pharmacologie cardiovasculaire": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - Prescription et préparation de l'administration": "B3 > B3 - TD6 Prescription et préparation de l'administration",
    "B3 > B3 - Prévention des infections": "B3 > B3 - TD2 Prévention des infections",
    "B3 > B3 - Sécurité et qualité des soins": "B3 > B3 - TD3 Sécurité et qualité des soins",
    "B3 > B3 - Sémiologie cardiovasculaire": "B3 > B3 - CM7 Altération cardiovasculaire",
    "B3 > B3 - TD14 Douleur thoracique et SCA": "B3 > B3 - TD14 Douleur thoracique et SCA",
    "B3 > B3 - TD15 Insuffisance cardiaque": "B3 > B3 - TD15 Insuffisance cardiaque",
    "B3 > B3 - TD7 Calculs de doses": "B3 > B3 - TD7 Calculs de doses",
    "C1 > C1 - CM7 Économie de la santé": "C1 > C1 - CM7 Économie de la santé",
    "C1 > C1 - Financement et dépenses de santé": "C1 > C1 - TD5 Financement et dépenses de santé",
    "C1 > C1 - les représentations de la santé publique": "C1 > C1 - CM1-2 Fondements de la santé publique",
    "C2 > C2 - CM1 Santé environnementale": "C2 > C2 - CM1 Santé environnementale",
    "D1 > D1 - Approche systémique (Palo Alto)": "D1 > D1 - CM Bases de la communication",
    "D1 > D1 - Besoins relationnels et relation de soin": "D1 > D1 - CM Les différents types de relation",
    "D1 > D1 - Fondamentaux de la relation interpersonnelle": "D1 > D1 - CM Bases de la communication",
    "D1 > D1 - Formes et dimensions de la relation": "D1 > D1 - CM Les différents types de relation",
    "D4 > D4 - Arnaques par e-mail": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Cycle de vie des données de santé": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Données de santé et droit des patients": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Dossiers patients informatisés (DPI / DUI)": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Gérer ses mots de passe": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Lutter contre la cybermalveillance": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Protégez-vous des attaques par e-mail": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Se tenir informés et être vigilants": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Sécurisez vos matériels": "D4 > D4 - TD1 Numérique en santé",
    "D4 > D4 - Tout savoir sur les rançongiciels": "D4 > D4 - TD1 Numérique en santé"
  };

  let S = null;                       // état de l'aperçu : { groups, untouched, missing }

  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _el = id => document.getElementById(id);
  const _norm = s => App.Store.normCat(s);
  // Clé de comparaison : même normalisation que le reste de l'appli + apostrophes typographiques unifiées
  const _k = s => _norm(s).replace(/[’‘ʼ`´]/g, "'").replace(/\s*>\s*/g, ' > ');
  const _ue = s => { const i = String(s).indexOf(' > '); return i > 0 ? String(s).slice(0, i).trim() : ''; };

  function _readFlag() { try { const o = JSON.parse(localStorage.getItem(FLAG_KEY) || 'null'); return o && o.v === 1 ? o : null; } catch (e) { return null; } }
  function _writeFlag(o) { try { localStorage.setItem(FLAG_KEY, JSON.stringify(o)); } catch (e) {} }
  const _hasBefore = c => c && c.catBefore !== undefined && c.catBefore !== null;

  // ══ 1. Plan (aperçu, ne modifie rien) ═════════════════════════════════════
  function plan() {
    const cards = App.Store.state.cards;
    const counts = new Map();                                   // clé normalisée -> { cat (nom réel), n }
    cards.forEach(c => { const k = _k(c.cat); const e = counts.get(k) || { cat: c.cat, n: 0 }; e.n++; counts.set(k, e); });
    const byNew = new Map();                                    // clé du nouveau nom -> groupe
    const missing = [];                                         // lignes de la table sans aucune carte
    Object.keys(MAP).forEach(oldName => {
      const target = MAP[oldName];
      if (target == null) return;                               // null = ne pas toucher
      const ko = _k(oldName), have = counts.get(ko);
      if (!have) { missing.push(oldName); return; }
      const nn = _norm(target), kn = _k(nn);
      let g = byNew.get(kn);
      if (!g) { g = { name: nn, olds: [], total: 0, exclude: false }; byNew.set(kn, g); }
      if (!g.olds.some(o => _k(o.cat) === ko)) g.olds.push({ cat: have.cat, n: have.n, same: ko === kn });
    });
    const groups = [];
    byNew.forEach((g, kn) => {
      const existing = counts.get(kn);                           // le nouveau nom existe peut-être déjà (cartes déjà rangées dedans)
      const moving = g.olds.filter(o => !o.same);
      const alreadyThere = existing ? existing.n : 0;
      g.alreadyThere = alreadyThere;
      g.total = g.olds.reduce((a, o) => a + (o.same ? 0 : o.n), 0) + alreadyThere;
      g.moving = moving.reduce((a, o) => a + o.n, 0);
      g.changes = moving.length > 0;                             // rien à faire si tout est déjà au bon endroit
      if (g.changes) groups.push(g);
    });
    groups.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
    const touched = new Set(); groups.forEach(g => g.olds.forEach(o => touched.add(_k(o.cat))));
    const untouched = [];
    counts.forEach((v, k) => { if (!touched.has(k) && !groups.some(g => _k(g.name) === k)) untouched.push({ cat: v.cat, n: v.n }); });
    untouched.sort((a, b) => a.cat.localeCompare(b.cat, 'fr', { numeric: true }));
    return { groups, untouched, missing, nCats: counts.size, nCards: cards.length };
  }

  // Table effective de l'aperçu : clé de l'ancienne catégorie -> nom final (noms modifiés et cases décochées pris en compte).
  // Si le nom a été corrigé à la main, les cartes déjà rangées sous le nom par défaut suivent aussi.
  function _effective() {
    const m = new Map();
    S.groups.forEach(g => { const nm = _norm(g.name); if (g.exclude || !nm) return; g.olds.forEach(o => { if (_k(o.cat) !== _k(nm)) m.set(_k(o.cat), nm); }); });
    return m;
  }
  // Après-regroupement simulé avec l'état courant de l'aperçu
  function _simulate() {
    const cards = App.Store.state.cards, m = _effective();
    const cats = new Set(); let n = 0;
    cards.forEach(c => { const t = m.get(_k(c.cat)); cats.add(t ? _k(t) : _k(c.cat)); n++; });
    return { cats: cats.size, cards: n };
  }

  // ══ 2. Appliquer ═════════════════════════════════════════════════════════
  function apply() {
    if (!S) return;
    const st = App.Store.state, before = st.cards.length;
    const chosen = S.groups.filter(g => !g.exclude && _norm(g.name));
    if (!chosen.length) { _toast('Rien à regrouper (tout est exclu ou sans nom).'); return; }
    // table effective : ancienne (clé) -> nouveau nom
    const eff = _effective();
    if (!eff.size) { _toast('Rien à regrouper.'); return; }

    // SAUVEGARDE AUTOMATIQUE : export JSON de toutes les cartes (même fonction que le bouton 💾 JSON)
    try { App.Modal.exportJSON(); }
    catch (e) { _toast('⚠ Sauvegarde impossible : regroupement annulé, rien n\'a été modifié.'); return; }

    const prevFlag = _readFlag();
    const orderBefore = (prevFlag && Array.isArray(prevFlag.orderBefore)) ? prevFlag.orderBefore : st.catOrder.slice();
    const mapStore = Object.assign({}, prevFlag ? prevFlag.map : {});
    eff.forEach((v, k) => { mapStore[k] = v; });

    // Cartes : seule `cat` change ; l'ancienne valeur est gardée UNE fois dans catBefore
    let moved = 0; const oldNames = new Set();
    st.cards.forEach(c => {
      const t = eff.get(_k(c.cat));
      if (!t || c.cat === t) return;
      if (!_hasBefore(c)) c.catBefore = c.cat;
      oldNames.add(c.cat);
      c.cat = t; moved++;
    });
    if (st.cards.length !== before) { _toast('⚠ Le nombre de cartes a changé : vérifie ta sauvegarde JSON.'); }
    App.Store.save();

    // Ordre des matières : anciens noms retirés, nouveaux ajoutés (à la place du premier ancien), sans doublon
    const inUse = new Set(st.cards.map(c => c.cat));
    const ord = []; const seen = new Set();
    const push = n => { const k = _k(n); if (!seen.has(k)) { seen.add(k); ord.push(n); } };
    st.catOrder.forEach(n => { const t = eff.get(_k(n)); if (t) push(t); else if (inUse.has(n)) push(n); else if (!oldNames.has(n)) { /* nom orphelin : on le garde tel quel */ push(n); } });
    new Set(eff.values()).forEach(push);
    st.catOrder = ord;
    App.Store.saveOrder();

    _remapExams(eff);
    _remapResume(eff);
    _writeFlag({ v: 1, at: Date.now(), map: mapStore, orderBefore });

    // Matière active
    const ac = App.UI && App.UI.activeCategory;
    if (ac && eff.get(_k(ac))) { try { App.UI.setCategory(eff.get(_k(ac))); } catch (e) { App.Render.all(); } }
    else { try { App.Render.all(); } catch (e) {} }
    close();
    _toast(`✅ ${moved} carte${moved > 1 ? 's' : ''} regroupée${moved > 1 ? 's' : ''} en ${new Set(eff.values()).size} paquet${new Set(eff.values()).size > 1 ? 's' : ''} · export JSON téléchargé`);
    return { moved, groups: new Set(eff.values()).size, total: st.cards.length };
  }

  // Examens : exam.cats = noms de matières → suivent le renommage (l'ancienne liste est gardée dans catsBefore)
  function _remapExams(eff) {
    try {
      const exams = JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]');
      let ch = false;
      exams.forEach(e => {
        if (!Array.isArray(e.cats) || !e.cats.length) return;
        const nc = []; let diff = false;
        e.cats.forEach(c => { const t = eff.get(_k(c)); if (t) diff = true; const v = t || c; if (!nc.includes(v)) nc.push(v); });
        if (diff) { if (e.catsBefore === undefined) e.catsBefore = e.cats.slice(); e.cats = nc; ch = true; }
      });
      if (ch) localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
    } catch (e) {}
  }
  // Séries en pause : la file de cartes est faite d'identifiants (inchangés) ; seul le libellé de matière est mis à jour
  function _remapResume(eff) {
    try {
      const o = JSON.parse(localStorage.getItem(RESUME_KEY2) || 'null');
      if (!o || !Array.isArray(o.slots)) return;
      let ch = false;
      o.slots.forEach(s => {
        if (!s || typeof s.cat !== 'string' || !s.cat) return;
        let v = eff.get(_k(s.cat));
        if (!v) {                                               // plusieurs matières jointes par ", " : on remplace chaque ancien nom connu
          v = s.cat;
          if (S) S.groups.forEach(g => g.olds.forEach(x => { if (eff.has(_k(x.cat)) && v.indexOf(x.cat) >= 0) v = v.split(x.cat).join(eff.get(_k(x.cat))); }));
        }
        if (v !== s.cat) { if (s.catBefore === undefined) s.catBefore = s.cat; s.cat = v; ch = true; }
      });
      if (ch) localStorage.setItem(RESUME_KEY2, JSON.stringify(o));
    } catch (e) {}
  }

  // ══ 3. Annuler ═══════════════════════════════════════════════════════════
  function nBefore() { return App.Store.state.cards.filter(_hasBefore).length; }
  function undo(skipConfirm) {
    const st = App.Store.state, n = nBefore();
    if (!n) { _toast('Aucun regroupement à annuler.'); return 0; }
    if (!skipConfirm && !confirm(`Annuler le regroupement ?\n\n${n} carte${n > 1 ? 's' : ''} retrouvent leur ancienne matière.`)) return 0;
    const newNames = new Set();
    st.cards.forEach(c => { if (_hasBefore(c)) { newNames.add(c.cat); c.cat = c.catBefore; delete c.catBefore; } });
    App.Store.save();
    // ordre d'origine (si on l'a gardé), puis les matières qui n'y figurent pas sont ajoutées par l'appli
    const f = _readFlag();
    if (f && Array.isArray(f.orderBefore)) { st.catOrder = f.orderBefore.slice(); App.Store.saveOrder(); }
    else { st.catOrder = st.catOrder.filter(c => !newNames.has(c)); App.Store.saveOrder(); }
    try {
      const exams = JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]'); let ch = false;
      exams.forEach(e => { if (Array.isArray(e.catsBefore)) { e.cats = e.catsBefore; delete e.catsBefore; ch = true; } });
      if (ch) localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
    } catch (e) {}
    try {
      const o = JSON.parse(localStorage.getItem(RESUME_KEY2) || 'null');
      if (o && Array.isArray(o.slots)) { let ch = false; o.slots.forEach(s => { if (s && s.catBefore !== undefined) { s.cat = s.catBefore; delete s.catBefore; ch = true; } }); if (ch) localStorage.setItem(RESUME_KEY2, JSON.stringify(o)); }
    } catch (e) {}
    try { localStorage.removeItem(FLAG_KEY); } catch (e) {}
    try { if (App.UI && App.UI.activeCategory && newNames.has(App.UI.activeCategory)) App.UI.setCategory(''); else App.Render.all(); } catch (e) {}
    close();
    _toast(`↩ Regroupement annulé : ${n} carte${n > 1 ? 's' : ''} remise${n > 1 ? 's' : ''} dans leur ancienne matière`);
    return n;
  }

  // Ordre des matières venu du cloud : si ce regroupement a été fait ici, on traduit les anciens noms (sans doublon)
  function remapOrder(order) {
    const f = _readFlag();
    if (!f || !f.map || !Array.isArray(order)) return order;
    const out = [], seen = new Set();
    order.forEach(n => { const v = f.map[_k(n)] || n, k = _k(v); if (!seen.has(k)) { seen.add(k); out.push(v); } });
    return out;
  }

  // ══ Fenêtre ══════════════════════════════════════════════════════════════
  function open() {
    S = plan();
    let ov = _el('regroup-overlay');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'regroup-overlay'; ov.className = 'overlay rg-overlay';
      ov.addEventListener('click', e => { if (e.target === ov) close(); });
      document.body.appendChild(ov);
    }
    _render();
    ov.style.display = 'flex';
    try { document.addEventListener('keydown', _esc_key); } catch (e) {}
  }
  function _esc_key(e) { if (e.key === 'Escape') close(); }
  function close() {
    const ov = _el('regroup-overlay'); if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; }
    S = null;
    document.removeEventListener('keydown', _esc_key);
  }
  function setName(i, v) { if (S && S.groups[i]) { S.groups[i].name = v; _checkRow(i); _summary(); } }
  function toggle(i, on) { if (S && S.groups[i]) { S.groups[i].exclude = !on; const r = _el('rg-row-' + i); if (r) r.classList.toggle('off', !on); _summary(); } }
  function all(on) { if (!S) return; S.groups.forEach((g, i) => { g.exclude = !on; const cb = _el('rg-cb-' + i); if (cb) cb.checked = on; const r = _el('rg-row-' + i); if (r) r.classList.toggle('off', !on); }); _summary(); }
  function _checkRow(i) {
    const g = S.groups[i], w = _el('rg-warn-' + i); if (!w) return;
    const nm = _norm(g.name), ue = _ue(nm), ues = [...new Set(g.olds.map(o => _ue(o.cat)))];
    let msg = '';
    if (!nm) msg = 'Nom vide : ce paquet ne sera pas regroupé.';
    else if (!ue || (ues.length && !ues.includes(ue))) msg = 'Le nom doit commencer par « ' + (ues[0] || 'UE') + ' > » pour rester dans la bonne UE.';
    w.textContent = msg; w.style.display = msg ? 'block' : 'none';
  }
  function _summary() {
    const el = _el('rg-sum'); if (!el || !S) return;
    const sim = _simulate(), n = S.nCards, nChosen = S.groups.filter(g => !g.exclude && _norm(g.name)).length;
    const moved = S.groups.filter(g => !g.exclude && _norm(g.name)).reduce((a, g) => a + g.moving, 0);
    el.innerHTML = `<span class="rg-k"><b>${n}</b> cartes avant → <b>${sim.cards}</b> après ${sim.cards === n ? '<span class="rg-okc">✓ identique</span>' : '<span class="rg-bad">⚠ différent !</span>'}</span>
      <span class="rg-k"><b>${S.nCats}</b> catégories → <b>${sim.cats}</b></span>
      <span class="rg-k"><b>${moved}</b> carte${moved > 1 ? 's' : ''} déplacée${moved > 1 ? 's' : ''} · ${nChosen}/${S.groups.length} paquet${S.groups.length > 1 ? 's' : ''}</span>`;
    const b = _el('rg-apply'); if (b) b.disabled = !nChosen || sim.cards !== n;
  }
  function _render() {
    const ov = _el('regroup-overlay'); if (!ov || !S) return;
    const nb = nBefore();
    const rows = S.groups.map((g, i) => `<div class="rg-row" id="rg-row-${i}">
        <label class="rg-chk" title="Inclure ce paquet"><input type="checkbox" id="rg-cb-${i}" checked onchange="App.Regroup.toggle(${i}, this.checked)"></label>
        <div class="rg-main">
          <input class="rg-name" type="text" value="${_esc(g.name)}" aria-label="Nom du nouveau paquet" oninput="App.Regroup.setName(${i}, this.value)">
          <div class="rg-warn" id="rg-warn-${i}" style="display:none"></div>
          <div class="rg-meta"><b>${g.total}</b> carte${g.total > 1 ? 's' : ''}${g.alreadyThere ? ` <span class="rg-muted">(dont ${g.alreadyThere} déjà dans ce paquet)</span>` : ''} · ${g.olds.filter(o => !o.same).length} ancienne${g.olds.filter(o => !o.same).length > 1 ? 's' : ''} catégorie${g.olds.filter(o => !o.same).length > 1 ? 's' : ''} fusionnée${g.olds.filter(o => !o.same).length > 1 ? 's' : ''}</div>
          <details class="rg-det"><summary>Voir les anciennes catégories</summary><ul>${g.olds.filter(o => !o.same).map(o => `<li>${_esc(o.cat)} <span class="rg-muted">— ${o.n}</span></li>`).join('')}</ul></details>
        </div></div>`).join('');
    const un = S.untouched.length ? `<details class="rg-det rg-un"><summary>${S.untouched.length} catégorie${S.untouched.length > 1 ? 's' : ''} non touchée${S.untouched.length > 1 ? 's' : ''} (absentes de la table ou « inchangé »)</summary><ul>${S.untouched.map(o => `<li>${_esc(o.cat)} <span class="rg-muted">— ${o.n}</span></li>`).join('')}</ul></details>` : '';
    const mi = S.missing.length ? `<details class="rg-det rg-un"><summary>${S.missing.length} ligne${S.missing.length > 1 ? 's' : ''} de la table sans carte (déjà regroupées ou nom différent)</summary><ul>${S.missing.map(o => `<li>${_esc(o)}</li>`).join('')}</ul></details>` : '';
    ov.innerHTML = `<div class="rg-box" role="dialog" aria-modal="true" aria-label="Regrouper par CM/TD">
      <div class="rg-head"><h2>🗂 Regrouper par CM / TD</h2><button type="button" class="btn btn-ghost btn-sm" onclick="App.Regroup.close()" aria-label="Fermer">✕</button></div>
      <p class="rg-lead">Aperçu : <b>rien n'est modifié</b> tant que tu n'as pas cliqué sur « Appliquer ». Seule la matière des cartes change, jamais leur historique de révision. Une sauvegarde JSON est téléchargée juste avant.</p>
      <div class="rg-sum" id="rg-sum"></div>
      ${S.groups.length ? `<div class="rg-tools"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Regroup.all(true)">Tout cocher</button><button type="button" class="btn btn-ghost btn-sm" onclick="App.Regroup.all(false)">Tout décocher</button></div>
      <div class="rg-list">${rows}</div>` : `<div class="rg-empty">✅ Rien à regrouper : toutes les cartes sont déjà rangées dans leur paquet (ou aucune catégorie de la table n'existe ici).</div>`}
      ${un}${mi}
      <div class="rg-foot">
        ${nb ? `<button type="button" class="btn btn-ghost" id="rg-undo" onclick="App.Regroup.undo()">↩ Annuler le regroupement (${nb} carte${nb > 1 ? 's' : ''})</button>` : ''}
        <span class="rg-sp"></span>
        <button type="button" class="btn btn-ghost" onclick="App.Regroup.close()">Fermer</button>
        <button type="button" class="btn btn-primary" id="rg-apply" onclick="App.Regroup.apply()">Appliquer (sauvegarde auto)</button>
      </div></div>`;
    S.groups.forEach((g, i) => _checkRow(i));
    _summary();
    if (!S.groups.length) { const b = _el('rg-apply'); if (b) b.disabled = true; }
  }

  function _toast(msg) {
    let t = _el('_app_toast');
    if (!t) { t = document.createElement('div'); t.id = '_app_toast'; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:10px;font-size:.85rem;z-index:9999;pointer-events:none;opacity:0;transition:opacity .2s;max-width:90vw;text-align:center'; document.body.appendChild(t); }
    clearTimeout(t._hide); t.textContent = msg; t.style.opacity = '1'; t._hide = setTimeout(() => { t.style.opacity = '0'; }, 5000);
  }

  window.openRegroup = open;                                   // pour le menu ⋮ (moreDo)
  return { MAP, plan, open, close, apply, undo, setName, toggle, all, nBefore, remapOrder, _t: { state: () => S } };
})();
