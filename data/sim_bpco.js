// data/sim_bpco.js — Simulation clinique : scénario HÔPITAL n° 7, Mme Delmas (BPCO décompensée, oxygène à bas débit, gaz du sang)
// Même structure que data/sim_hopital.js ; briques communes : data/sim_base.js ; gestes de sécurité : data/sim_soins.js (cas ajouté à la fin de ce fichier).
// Particularité : la patiente ÉVOLUE (scn.evo). Ses constantes, sa vigilance, le scope et le gaz du sang lu plus tard dépendent de l'oxygène
// que tu choisis et du temps qui passe. Le piège : un fort débit d'oxygène « remonte » la saturation mais endort une personne BPCO (hypercapnie).
// ⚠ Patient et valeurs FICTIFS, à but pédagogique. Les protocoles du service et la prescription médicale priment.
// ⚠ Contenu à faire relire par ton formateur : chaque élément cite sa source ou précise qu'il est à confirmer.
// ⚠ L'étudiant ne pose pas de diagnostic et ne règle jamais l'oxygène en vrai : en stage, c'est l'infirmière qui prescrit/règle et qui prélève le gaz du sang.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'Mme', nom: 'Delmas', prenom: 'Danielle', dob: '17/09/1958', dobMots: 'dix-sept septembre mille neuf cent cinquante-huit', age: 68, chambre: 214, sexe: 'F', avatar: '👵', statut: 'patient' };
  const _nConst = n => [/\b38 2\b/, /\b108\b/, /\b148\b/, /\b28\b/, /\b84\b/].filter(re => re.test(n)).length;
  const ALARMS0 = ['SpO₂ basse', 'FR haute', 'FC haute'];
  const T = B.tools({ p: patient, de: 'de Mme Delmas', temp: 38.2, fc: { rate: 108, rhythm: 'régulier' }, pa: [148, 86], fr: 28, spo2: 84, scope: true, alarms: ALARMS0,
    scopeNote: "Le scope affiche les valeurs au moment où tu le branches. Il continue ensuite à surveiller : regarde l'évolution (le graphique « Tendances du scope » apparaît sous le dessin). Les alarmes préviennent, mais ne remplacent pas ton regard sur la patiente." });

  // ───────────── Gaz du sang (valeurs fictives, cohérentes : équation d'Henderson-Hasselbalch) ─────────────
  const GDS1 = { ph: 7.32, pao2: 52, paco2: 58, hco3: 29 };   // à l'arrivée du médecin, en air ambiant
  const GDS2 = { ph: 7.19, pao2: 142, paco2: 84, hco3: 30 };  // après un fort débit d'oxygène : le CO₂ s'est accumulé
  const GDS3 = { ph: 7.34, pao2: 61, paco2: 56, hco3: 29 };   // après de l'oxygène à bas débit : l'oxygénation s'améliore sans piéger le CO₂
  const Q1 = { who: "Mme Delmas, 68 ans, BPCO, essoufflée, fièvre. Gaz du sang artériel prélevé par le médecin à son arrivée, en air ambiant (avant tout traitement).", gaz: GDS1,
    ans: { ph: 'acid', paco2: 'up', hco3: 'up', tr: 'acres', comp: 'metab', o2: 'hypo' },
    clin: "Chez une personne atteinte de BPCO, une infection des bronches fait « décompenser » la maladie : elle ventile moins bien, le CO₂ s'accumule (PaCO₂ 58) et l'oxygène baisse (PaO₂ 52). Les bicarbonates élevés (29) montrent que les reins compensent depuis longtemps : c'est son état chronique." };
  const Q2 = { who: "Mme Delmas, 68 ans, BPCO. Gaz du sang de CONTRÔLE, demandé parce qu'elle s'est endormie sous un masque à fort débit d'oxygène.", gaz: GDS2,
    ans: { ph: 'acid', paco2: 'up', hco3: 'up', tr: 'acres', comp: 'metab', o2: 'hyper' },
    clin: "Le piège de la BPCO : trop d'oxygène supprime le stimulus qui la fait respirer. Elle ventile moins, le CO₂ monte (PaCO₂ 84), le pH s'effondre (7,19) : acidose respiratoire sévère, avec une PaO₂ trop haute (142) qui n'a servi à rien. Voilà pourquoi on vise 88 à 92 % de saturation, pas 100 %." };
  const Q3 = { who: "Mme Delmas, 68 ans, BPCO. Gaz du sang de contrôle, après de l'oxygène à bas débit (lunettes) et une surveillance rapprochée.", gaz: GDS3,
    ans: { ph: 'acid', paco2: 'up', hco3: 'up', tr: 'acres', comp: 'metab', o2: 'hypo' },
    clin: "À bas débit, l'oxygénation s'améliore (PaO₂ 61) sans que le CO₂ s'envole (PaCO₂ 56) : le pH remonte presque à la normale (7,34). C'est exactement l'objectif de l'oxygène chez une personne BPCO : corriger l'hypoxémie sans la piéger." };
  const Q = { 1: Q1, 2: Q2, 3: Q3 };
  const _gazoCase = c => (c.evo && c.evo.v && c.evo.v.vigil >= 1) ? 2 : ((c.care && c.care.o2 && c.care.o2.v === 'good') ? 3 : 1);

  // ───────────── Évolution de la patiente ─────────────
  // Classe d'oxygène : none · low (lunettes 1 à 2 L/min) · mid (masque 6 L/min ou lunettes > 2) · high (masque haute concentration / ≥ 10 L/min)
  const _cls = o2 => !o2 ? 'none' : (o2.dev === 'mhc' || o2.deb >= 10 ? 'high' : (o2.dev === 'lunettes' && o2.deb <= 2 ? 'low' : 'mid'));
  const EVO = {
    target: { lo: 88, hi: 92 },
    init: () => ({ h: 0, t: 0 }),                           // h : charge de CO₂ (0 à 4) · t : pas de temps
    step: (s, ctx) => {
      const k = _cls(ctx.o2); let h = s.h;
      h += k === 'high' ? 0.8 : (k === 'mid' ? 0.5 : -1);   // fort débit : le CO₂ s'accumule ; bas débit ou arrêt : il redescend
      return { h: Math.max(0, Math.min(4, h)), t: s.t + 1 };
    },
    vitals: (s, ctx) => {
      const k = _cls(ctx.o2), lay = ['allongee', 'jambes', 'pls'].indexOf(ctx.pos) >= 0, lean = ['assise', 'bord'].indexOf(ctx.pos) >= 0;
      let spo2 = 84, fr = 28, fc = 108, sys = 148, dia = 86;
      if (k === 'low') { const d = ctx.o2.deb; spo2 = d <= 1 ? 88 : 91; fr = d <= 1 ? 26 : 24; fc = d <= 1 ? 104 : 100; sys = 144; dia = 84; }
      else if (k === 'mid') { spo2 = 96; fr = 24; fc = 98; sys = 144; }
      else if (k === 'high') { spo2 = 99; fr = 22; fc = 96; sys = 142; }
      if (lean) fr -= 2; if (lay) { spo2 -= 4; fr += 4; fc += 8; }
      const h = s.h, vigil = h >= 2.6 ? 2 : (h >= 1.2 ? 1 : 0);
      if (k === 'mid' || k === 'high' || h > 0) fr = Math.max(8, fr - Math.round(h * 2.8));
      if (vigil >= 1) { sys += 8; fc = Math.max(86, fc - 4); }
      const alarms = []; if (spo2 < 88) alarms.push('SpO₂ basse'); if (fr >= 24) alarms.push('FR haute'); if (fr <= 10) alarms.push('FR basse'); if (fc >= 100) alarms.push('FC haute');
      return { spo2, fr, fc, pa: [sys, dia], temp: 38.2, rhythm: 'régulier', vigil, harm: vigil >= 1, cls: k, h, alarms };
    },
    // Ce que la patiente montre : yeux, teint, respiration (dessin)
    scene: v => ({ eyes: v.vigil >= 1 ? 'closed' : 'open', gasp: v.fr >= 24, cyan: v.spo2 < 88, sweat: v.vigil >= 1 || v.spo2 < 88, pale: v.spo2 < 90 && v.vigil === 0 }),
    // Valeurs et explications du recueil (elles changent avec l'état de la patiente)
    facts: (v, ctx) => {
      const air = !ctx.o2, where = air ? 'en air ambiant' : 'sous oxygène (' + _lab(ctx.o2) + ')';
      const inT = v.spo2 >= 88 && v.spo2 <= 92;
      const sMean = air ? "Basse : sa saturation habituelle est de 90 % (elle est BPCO). Pour elle, la bonne cible n'est pas 95 à 100 % mais 88 à 92 % (carte du service). À 84 %, elle manque d'oxygène : tu notes la valeur et tu alertes ; l'oxygène est un médicament, c'est l'infirmière qui décide du débit."
        : inT ? "Dans la zone cible de 88 à 92 % : c'est ce qu'on cherche chez une personne BPCO. Tu continues à surveiller sa saturation, sa respiration et sa vigilance."
          : v.spo2 > 92 ? "Au-dessus de la cible (88 à 92 %) : chez une personne BPCO, trop d'oxygène est dangereux. Une belle saturation ne veut pas dire que tout va bien : regarde sa vigilance et sa respiration, et préviens l'infirmière."
            : "Encore sous la cible (88 à 92 %) : tu notes, tu surveilles et tu transmets. Le débit se règle avec l'infirmière.";
      const fMean = v.fr <= 10 ? "Trop lente (< 12/min) et en train de baisser : chez une personne qui s'endort sous oxygène, une respiration qui ralentit est un signe d'alerte. Préviens tout de suite." : v.fr >= 24 ? "Au-dessus de la norme de l'adulte (12 à 20/min, ton CM9) et de son habituel (20/min) : elle respire vite et se fatigue." : "Elle respire moins vite qu'avant : si elle va mieux, c'est une bonne nouvelle ; si elle devient somnolente, c'est un signal d'alerte. Regarde-la.";
      return {
        m_spo2: { text: v.spo2 + ' % ' + where, meaning: sMean },
        m_fr: { text: v.fr + ' /min', meaning: fMean },
        m_fc: { text: v.fc + ' /min, régulier' },
        m_pa: { text: v.pa[0] + '/' + v.pa[1] + ' mmHg' }
      };
    },
    // Ce qui se passe quand l'état change (journal de la chambre)
    events: (prev, v, ctx, evo) => {
      const out = [], pv = prev ? (prev.vigil || 0) : 0, nv = v.vigil || 0;
      if (nv > pv && nv === 1) { evo.flags.over = true; out.push({ who: 'narr', text: "Mme Delmas est devenue plus calme… trop calme. Ses paupières papillonnent, sa voix traîne. Elle respire moins vite et sa saturation est belle sur l'écran." }, { who: 'sys', text: "⚠ « Plus calme » ne veut pas dire « va mieux ». Une personne BPCO qui s'endort sous oxygène retient du CO₂. Regarde sa vigilance, parle-lui fort, et alerte l'infirmière." }); }
      else if (nv > pv && nv === 2) { evo.flags.over = true; out.push({ who: 'narr', text: "Mme Delmas ne répond plus que par des mots isolés, les yeux fermés. Ses mains tremblent par à-coups, sa respiration devient lente et superficielle." }, { who: 'sys', text: "⛔ Somnolence marquée : signe de gravité. Prévenir tout de suite l'infirmière (sans quitter la patiente) et ne pas laisser un fort débit d'oxygène en route sans avis. Elle sait quoi faire." }); }
      else if (nv < pv && nv === 0) { evo.flags.recovered = true; out.push({ who: 'narr', text: "Mme Delmas ouvre les yeux, te regarde et te répond plus nettement. Son souffle reste court, mais elle est de nouveau avec toi." }); }
      else if (nv < pv && nv === 1) out.push({ who: 'narr', text: "Elle se réveille peu à peu quand tu lui parles." });
      if (!evo.flags.target && ctx.o2 && v.cls === 'low' && v.spo2 >= 88 && v.spo2 <= 92 && nv === 0) { evo.flags.target = true; out.push({ who: 'narr', text: "Son souffle se calme un peu, ses lèvres reprennent de la couleur. Le scope affiche " + v.spo2 + " % : tu es dans la zone cible de 88 à 92 %." }); }
      return out;
    },
    // Voix de la patiente selon sa vigilance
    speak: (vigil, text) => vigil >= 2
      ? { mute: true, text: "(Elle murmure quelques mots sans suite, les yeux fermés. Elle ne répond plus à ta question : il faut d'abord la réveiller et alerter.)" }
      : { text: "(Elle a du mal à garder les yeux ouverts ; sa voix est traînante.) " + text },
    // Bilan de l'évolution (graphique + commentaires)
    bilan: (evo, c) => {
      const rows = [], v = evo.v, F = evo.flags || {}, o2now = c.care && c.care.o2;
      if (F.over) rows.push({ k: v.vigil >= 1 ? 'miss' : 'late', t: v.vigil >= 1 ? "Elle s'est endormie sous l'oxygène et tu l'as laissée ainsi" : "Elle s'est endormie sous l'oxygène, puis tu as corrigé", d: "Le fort débit d'oxygène (masque) a fait monter sa saturation mais aussi son CO₂ : c'est le piège de la BPCO. Dans la réalité, tu n'aurais pas choisi le débit toi-même : tu aurais alerté l'infirmière, qui prescrit un bas débit (lunettes 1 à 2 L/min, ou masque à 24-28 %) et surveille la saturation, la respiration et la vigilance." });
      if (F.recovered) rows.push({ k: 'ok', t: "Tu as repéré la somnolence et corrigé", d: "Baisser le débit (ou alerter) et lui parler fort l'a réveillée. C'est le bon réflexe : une saturation élevée avec une patiente qui s'endort n'est pas rassurante." });
      if (!F.over && o2now && o2now.v === 'good') rows.push({ k: 'ok', t: 'Oxygène à bas débit : saturation dans la cible', d: "Tu as choisi un petit débit : sa saturation est montée vers 88 à 92 % sans qu'elle s'endorme. C'est l'objectif chez une personne BPCO." });
      if (!F.over && !o2now) rows.push({ k: 'late', t: 'Pas d\'oxygène en route à la fin du recueil', d: "Sa saturation est restée basse (84 %). Tu as bien fait de ne pas la mettre au maximum, mais il fallait alerter : c'est l'infirmière qui décide d'un bas débit prescrit." });
      if (v.spo2 >= 88 && v.spo2 <= 92 && v.vigil === 0) rows.push({ k: 'ok', t: 'Dernière mesure du scope : ' + v.spo2 + ' %, dans la zone cible', d: "Zone cible de la carte BPCO du service : 88 à 92 %." });
      return { rows };
    }
  };
  function _lab(o2) { return o2 ? (o2.dev === 'mhc' ? 'masque haute concentration ' : (o2.dev === 'masque' ? 'masque ' : 'lunettes ')) + String(o2.deb).replace('.', ',') + ' L/min' : ''; }

  const POS = ['assise', 'demi', 'bord', 'allongee', 'jambes', 'pls'];
  const POS_LAB = { assise: ['🪑', "Assise dans le lit, penchée en avant, les bras appuyés sur la table"], demi: ['🛏️', 'Demi-assise : dossier relevé (30 à 45°)'],
    bord: ['🦵', 'Assise au bord du lit, les jambes pendantes (je la soutiens)'], allongee: ['😴', 'Allongée à plat sur le dos'],
    jambes: ['🦶', 'Allongée, un oreiller sous les jambes (jambes en hauteur)'], pls: ['↪️', 'Position latérale de sécurité (PLS)'] };

  App.SimScenarios.push({
    id: 'hop_bpco_7',
    title: "Le souffle et le sommeil de Mme Delmas",
    short: "À l'hôpital, une patiente de 68 ans atteinte de BPCO manque d'air. Tu peux lui mettre de l'oxygène… mais attention : sa saturation, sa respiration et sa vigilance évoluent selon ton choix. Que fais-tu, et que montre son gaz du sang ?",
    icon: '🫁',
    level: 3, levelLabel: 'Avancé',
    setting: 'Hôpital', semestre: 'S1', ue: ['B.3'], duration: '25 à 30 min',
    status: 'Version à valider avec ton formateur',
    direct: true,
    competences: [
      { n: 1,  label: "Élaborer le diagnostic infirmier (raisonnement clinique : repérer les signes de gravité, lecture sommaire d'un gaz du sang, sans poser de diagnostic)" },
      { n: 3,  label: 'Réaliser des soins (installation, surveillance au scope : saturation, fréquence respiratoire, vigilance)' },
      { n: 6,  label: 'Communiquer et conduire une relation dans un contexte de soins (rassurer une personne essoufflée)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe (alerte SAED)" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions ciblées)' }
    ],
    sources: [
      { label: 'Ton cours B3 – CM10 : oxygénothérapie et interprétation des gaz du sang',
        note: "L'oxygène est un médicament (prescription, débit, surveillance) · chez une personne atteinte de BPCO, la cible de saturation est plus basse (88 à 92 %) · pH, PaCO₂, HCO₃⁻, PaO₂. À confirmer dans ton cours." },
      { label: 'Ton cours B3 – CM9 : mesure de la FR, SpO2 et signes cutanés',
        note: "Fréquence respiratoire normale de l'adulte 12 à 20/min · bradypnée < 12 · signes d'alerte : tirage, cyanose, sueurs, somnolence. À confirmer dans ton cours." },
      { label: "Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)", url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière (étape Décision)." },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)', note: "Objectifs du S1 : recueil structuré de données, repérage des signes d'aggravation, transmissions ciblées." },
      { label: 'Ce que ce scénario ne dit pas',
        note: "La patiente, les valeurs et les consignes du médecin sont inventés pour l'entraînement. Tu ne poses aucun diagnostic et tu ne règles pas l'oxygène en vrai : le débit prescrit, la surveillance et le gaz du sang relèvent de l'infirmière et du médecin. Les repères (cible 88-92 %) sont à confirmer avec ton formateur et les protocoles du service." }
    ],

    patient,
    scene: { style: 'hopital', clock: { h: 7, m: 10 }, label: "Chambre 214 : Mme Delmas est assise dans son lit, penchée en avant, les lèvres pincées",
      patient: { pos: 'assise', eyes: 'open', pale: true, sweat: false, male: false, gasp: true, cyan: true, gown: '#e6d9f2', hair: ['#d9dce1', '#b8bdc8'] },
      scope: { fc: 108, spo2: 84, pa: '148/86', fr: 28, alarms: ALARMS0, irregular: false } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_cible', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_const_hab'],

    urgent: {
      facts: ['o_aspect', 'o_levres', 'o_tirage', 'q_dyspnee', 'q_toux', 'q_inhal'],
      message: "⏱ Une personne BPCO qui parle par petits bouts de phrases, aux lèvres bleutées, avec une saturation à 84 %, est en difficulté respiratoire : l'alerte ne doit pas traîner. Installe-la assise, appuie sur la sonnette sans la quitter, et surveille-la : sa saturation, sa respiration ET sa vigilance."
    },

    intro: {
      heure: '7 h 10',
      texte: "Tu es en stage dans un service de pneumologie, avec Claire, l'infirmière du secteur, joignable au poste de soins. Il est 7 h 10 : tu passes voir Mme Delmas, 68 ans, chambre 214, hospitalisée depuis hier soir pour une « BPCO qui s'aggrave » (toux, crachats, essoufflement, fièvre). Elle a une carte de surveillance au pied du lit.",
      equipe: "Transmissions de la nuit : « BPCO sévère connue, entrée hier soir pour une aggravation avec toux grasse et fièvre. Pas d'oxygène prescrit pour l'instant, en attente de la visite du médecin. A mal dormi, plus essoufflée vers 6 h. » Karim, aide-soignant : « Elle n'arrive plus à finir ses phrases et ses lèvres sont bleues. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, branche le scope, puis repère ce qui doit alerter. Tu agis en touchant le dessin (lit, prise d'oxygène au mur, sonnette, patiente) et les instruments. Ici, la patiente réagit à ce que tu fais : garde un œil sur sa saturation, sa respiration et sa vigilance."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "Mme Danielle DELMAS, née le 17/09/1958 (68 ans) · chambre 214 · bracelet d'identification au poignet." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'hospitalisation",
        text: "Hospitalisée depuis hier soir en pneumologie pour une aggravation de sa maladie respiratoire chronique : toux plus grasse, crachats jaune-vert, fièvre à 38 °C et essoufflement en augmentation depuis 3 jours." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: "BPCO sévère (bronchopneumopathie chronique obstructive) · ancienne fumeuse (40 paquets-années, arrêt il y a 2 ans) · hypertension artérielle. Pas d'oxygène à domicile." },
      d_cible: { section: 'antecedents', kind: 'dossier', label: 'Carte de surveillance (pied du lit)', key: true,
        how: "Lis la carte de surveillance dans le dossier de soins avant d'entrer.",
        text: "« PATIENTE BPCO : objectif de saturation 88 à 92 %. Oxygène : prescription médicale, bas débit uniquement, surveiller la vigilance. »",
        meaning: "La bonne cible chez une personne BPCO n'est pas 95 à 100 %. Un fort débit d'oxygène peut l'endormir en faisant monter son CO₂ (hypercapnie). Cette carte te protège d'une erreur classique." },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Aucune allergie médicamenteuse connue.' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: "Bronchodilatateurs en spray (salbutamol « si besoin », tiotropium le matin) · corticoïde et antibiotique débutés hier soir · amlodipine (tension). Pas d'oxygène prescrit pour le moment. Les comprimés du matin ne sont pas encore donnés." },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: "Autonome à domicile, marche lentement avec des pauses. Vit seule, sa fille Corinne passe chaque week-end." },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: "Ancienne couturière, retraitée. Aime parler de ses petits-enfants. Sa fille Corinne est la personne à prévenir." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles (hier soir)', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: "Température 36,8 °C · pouls 88/min, régulier · pression artérielle 130/78 mmHg · fréquence respiratoire 20/min · saturation 90 % en air ambiant.",
        meaning: "Sa saturation habituelle est de 90 % : c'est normal pour sa BPCO. Ce qui alerte, c'est l'écart avec son habituel, pas la comparaison avec 98 %." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
        text: "Parle par petits bouts de phrases : « Je… n'arrive plus… à respirer… depuis cette nuit. » Elle est assise, penchée en avant, les lèvres pincées.",
        how: 'Demande-lui comment elle se sent ce matin.',
        meaning: "Une personne qui ne peut plus finir ses phrases présente un changement net : c'est un signe d'alerte, à ne jamais mettre sur le compte de la fatigue." },
      q_dyspnee: { section: 'symptomes', kind: 'chercher', label: 'Essoufflement', key: true, alert: true,
        text: "Essoufflée même au repos depuis cette nuit : « même sans bouger, je manque d'air ». Hier, elle ne s'essoufflait qu'en marchant dans le couloir.",
        how: 'Demande-lui si elle respire bien.',
        meaning: "Un essoufflement qui apparaît au repos est un signe d'alerte : hier, elle ne s'essoufflait qu'à l'effort." },
      q_toux: { section: 'symptomes', kind: 'chercher', label: 'Toux et crachats', key: true, alert: true,
        text: "Toux grasse depuis 3 jours, crachats jaune-vert plus abondants qu'à l'habitude : « ils sont épais, je n'arrive pas à les sortir ».",
        how: 'Demande-lui si elle tousse et si elle crache.',
        meaning: "La couleur et la quantité des crachats se décrivent telles quelles (jaune-vert, épais, abondants). Tu transmets, tu ne conclus pas." },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Depuis quand', key: true, alert: true,
        text: "Toux et fièvre depuis 3 jours ; hier soir, essoufflée en marchant ; cette nuit, réveillée par le manque d'air ; plus essoufflée depuis 6 h.",
        how: 'Demande-lui depuis quand elle se sent ainsi.',
        meaning: "L'évolution (3 jours, puis cette nuit, puis 6 h) renseigne l'infirmière et le médecin sur la rapidité de l'aggravation." },
      q_inhal: { section: 'symptomes', kind: 'chercher', label: 'Spray', key: true, alert: true,
        text: "« J'ai pris ma Ventoline… trois fois cette nuit. Ça ne m'a presque pas soulagée. »",
        how: 'Demande-lui si elle a utilisé son spray et s\'il l\'a soulagée.',
        meaning: "Un spray qui ne soulage plus est un signe d'aggravation de sa maladie : à transmettre." },
      q_froid: { section: 'symptomes', kind: 'chercher', label: 'Chaud / froid', alert: true,
        text: "Frissons cette nuit, elle a eu chaud puis froid. La fièvre est notée à 38 °C hier soir.", how: 'Demande-lui si elle a eu chaud, froid ou des frissons.',
        meaning: "La fièvre avec des crachats colorés fait penser à une infection : c'est au médecin d'interpréter, tu notes l'heure et la valeur." },
      q_somnolence: { section: 'symptomes', kind: 'chercher', label: 'Vigilance', alert: true,
        text: "« Ma tête est lourde depuis hier soir… mais je n'ai pas sommeil, je n'arrive pas à dormir à cause de la toux. » Elle est bien éveillée pour l'instant.",
        how: 'Demande-lui si elle a la tête lourde ou envie de dormir.',
        meaning: "Surveiller la vigilance dès le départ te donne un repère : si elle devient somnolente plus tard, c'est un changement important." },
      q_tabac: { section: 'histoire', kind: 'chercher', label: 'Tabac', text: "Fumé 40 ans, un paquet par jour. Arrêt il y a 2 ans, après une première hospitalisation.", how: 'Demande-lui si elle fume ou a fumé.' },
      q_o2dom: { section: 'traitements', kind: 'chercher', label: 'Oxygène à domicile', text: "Pas d'oxygène chez elle. « Le médecin m'a dit que j'en aurais peut-être besoin un jour. »", how: 'Demande-lui si elle a de l\'oxygène à la maison.' },
      q_cephalees: { section: 'symptomes', kind: 'chercher', label: 'Maux de tête', alert: true,
        text: "Un peu de mal de tête au réveil depuis hier, « comme un casque ». Pas d'autre douleur.", how: 'Demande-lui si elle a mal à la tête, surtout au réveil.',
        meaning: "Des maux de tête au réveil et la tête lourde peuvent accompagner un excès de CO₂ chez une personne BPCO : à transmettre." },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', text: "Pas de douleur dans la poitrine, sauf une gêne en haut du thorax quand elle tousse beaucoup.", how: 'Demande-lui si elle a mal quelque part.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', text: "La tête ne tourne pas, mais elle se sent « épuisée à force de souffler ».", how: 'Demande-lui si la tête lui tourne.' },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: 'Pas de nausées ni de vomissements.', how: 'Demande-lui si elle a des nausées.' },
      q_alim: { section: 'histoire', kind: 'chercher', label: 'Repas', text: "Presque rien mangé hier soir : manger l'essouffle. À jeun ce matin.", how: "Demande-lui ce qu'elle a mangé ou bu." },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: "A bu un verre d'eau cette nuit pour calmer la toux. Pas de restriction hydrique.", how: 'Demande-lui si elle a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', text: "Urines normales cette nuit selon elle.", how: 'Demande-lui si elle urine normalement.' },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande-lui si elle est allée à la selle.' },
      q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements', text: "N'est pas levée depuis 5 h : se lever lui a coupé le souffle.", how: 'Demande-lui comment elle se déplace.' },
      q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes', text: 'Pas de chute ni de coup.', how: 'Demande-lui si elle est tombée récemment.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: "Nuit agitée : elle a dormi assise, réveillée par la toux et le manque d'air.", how: 'Demande-lui si elle a bien dormi.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Anxieuse : « j'ai peur de ne plus pouvoir reprendre mon souffle ». Elle serre le drap.", how: 'Demande-lui comment est son moral.',
        meaning: "L'anxiété augmente la sensation d'essoufflement : rassure-la, parle lentement, reste près d'elle." },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: "Sa fille Corinne vient le week-end : c'est elle qu'il faut prévenir.", how: 'Demande-lui si sa famille vient la voir.' },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', text: "Donne son nom et le jour de la semaine (lundi) sans hésiter, par mots isolés car elle manque d'air. Bien éveillée.", how: 'Demande-lui quel jour nous sommes.',
        meaning: "Repère de départ : elle est parfaitement orientée et éveillée. Une confusion ou une somnolence plus tard serait un changement important." },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris', text: "Parle de « mes sprays » et de « la perfusion d'hier soir ». N'a pas encore pris ses comprimés du matin.", how: 'Demande-lui quels médicaments elle prend.' },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: "Dit « mes bronches… la tension… j'ai fumé ». Cohérent avec le dossier.", how: 'Demande-lui quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "« Je toussais trop… je n'arrivais plus à respirer » : raconte son entrée hier soir, en reprenant son souffle.", how: 'Demande-lui pourquoi elle est hospitalisée.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'elle dit)', text: "« Non, je ne suis allergique à rien. » Cohérent avec le dossier.", how: 'Demande-lui si elle est allergique à un médicament.' },
      q_equipe_heure: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", key: true, alert: true,
        text: "Karim : « À 6 h, elle a sonné, elle ne finissait plus ses phrases. Ses lèvres étaient bleues, elle respirait en pinçant les lèvres. Elle a pris son spray trois fois cette nuit sans effet. »",
        how: "Interroge Karim, l'aide-soignant.",
        meaning: "L'aggravation s'est faite en quelques heures, malgré le spray : élément à transmettre à l'infirmière." },

      // En mesurant (scope ou instruments) : les valeurs changent avec l'état de la patiente (voir evo.facts)
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', alert: true, text: '38,2 °C',
        meaning: "Fièvre (habituel 36,8 °C) : à rapprocher des crachats jaune-vert. Tu notes la valeur et l'heure ; l'interprétation revient au médecin." },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true, text: '108 /min, régulier',
        meaning: "Plus rapide que son habituel (88/min) : le manque d'air et la fièvre accélèrent le cœur." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', text: '148/86 mmHg',
        meaning: "Un peu plus haute que d'habitude (130/78) : tu la notes et la transmets, sans chercher à la baisser." },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', key: true, alert: true, text: '28 /min',
        meaning: "Bien au-dessus de la norme de l'adulte (12 à 20/min, ton CM9) et de son habituel (20/min) : elle respire très vite et se fatigue." },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', key: true, alert: true, text: '84 % en air ambiant',
        meaning: "Basse : sa saturation habituelle est de 90 % (BPCO). Pour elle, la cible est 88 à 92 %. Tu notes et tu alertes ; l'oxygène est un médicament." },

      // En observant
      o_aspect: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
        text: "Assise, penchée en avant, les avant-bras appuyés sur la table. Elle respire vite, les lèvres pincées, et ne finit pas ses phrases. Quelques sueurs au front.",
        how: 'Observe la patiente.',
        meaning: "Posture penchée en avant et lèvres pincées : elle cherche à mieux respirer. Ce sont des faits que tu vois, pas un diagnostic." },
      o_levres: { section: 'observations', kind: 'deduire', label: 'Lèvres et doigts', key: true, alert: true,
        text: "Lèvres et bouts des doigts bleutés. Ongles violacés.",
        how: 'Observe ses lèvres et ses doigts.',
        meaning: "La cyanose est un signe cutané de détresse respiratoire (ton CM9)." },
      o_tirage: { section: 'observations', kind: 'deduire', label: 'Muscles de la respiration', key: true, alert: true,
        text: "À chaque inspiration, la peau se creuse entre les côtes et au-dessus de la clavicule, et les muscles du cou se tendent. Le thorax est bombé, la respiration est sifflante.",
        how: 'Observe sa respiration (thorax et cou).',
        meaning: "Un tirage intercostal ou sus-sternal est un signe d'alerte : elle utilise tous ses muscles pour respirer (ton CM9)." },
      o_peau: { section: 'observations', kind: 'deduire', label: 'État cutané', alert: true,
        text: "Peau chaude et un peu moite, joues rouges (fièvre). Pas de marbrures. Extrémités bleutées.",
        how: 'Touche et regarde sa peau (front, mains).',
        meaning: "Tu décris la peau avec des mots simples (chaleur, humidité, couleur). L'interprétation revient à l'infirmière." },
      o_bruits: { section: 'observations', kind: 'deduire', label: 'Bruits respiratoires', alert: true,
        text: "On entend de loin sa respiration : un sifflement à l'expiration et des râles qui « bouillonnent ». Elle tousse en crachant avec effort.",
        how: 'Écoute sa respiration (sans stéthoscope).',
        meaning: "Tu décris ce que tu entends (sifflement, bruit humide, toux) ; l'auscultation revient à l'infirmière ou au médecin." },
      o_crachats: { section: 'observations', kind: 'deduire', label: 'Crachats', key: true, alert: true,
        text: "Dans le crachoir sur la table de chevet : des crachats épais, jaune-vert, en quantité.",
        how: 'Regarde la table de chevet.',
        meaning: "L'aspect des crachats (épais, jaune-vert) se décrit tel quel dans la transmission." },
      o_verre: { section: 'observations', kind: 'deduire', label: 'Table de chevet', text: "Un verre d'eau, un tube de spray ouvert, des mouchoirs usagés, un plateau de petit-déjeuner intact.", how: 'Regarde la table de chevet.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', text: "La poire d'appel est accrochée au bord du lit, à portée de sa main. Elle l'a utilisée à 6 h.", how: 'Regarde où se trouve la sonnette.' },
      o_oxy: { section: 'risques', kind: 'deduire', label: 'Oxygène', alert: true,
        text: "Prise d'oxygène murale derrière la tête du lit, débitmètre réglé sur 0 : rien n'est en route. Lunettes, masque et masque haute concentration sont rangés dans le tiroir. Une étiquette « BPCO : objectif 88-92 % » est collée près de la prise.",
        how: "Regarde la prise d'oxygène au mur.",
        meaning: "L'étiquette te rappelle l'objectif de saturation. Tu peux préparer le matériel, mais le débit se décide avec l'infirmière." },
      o_scope: { section: 'risques', kind: 'deduire', label: 'Scope', text: "Le scope est sur son pied à côté du lit, éteint, avec ses câbles : électrodes, brassard et capteur de saturation. Il n'est pas branché sur la patiente.", how: 'Regarde le scope.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: '(Elle lève la main.) « Bon… jour… »' },
      c_presentation: { text: "(Elle hoche la tête.) « Ah… l'étudiant… Danielle… Delmas. » (elle reprend son souffle entre les mots)", logs: ['g_presentation'] },
      c_identite_q:   { text: "« Delmas… Danielle. Dix-sept… septembre… cinquante-huit. Soixante-huit… ans. » (elle souffle entre les mots)", logs: ['g_identite'] },
      c_explication:  { text: '(Elle hoche la tête.) « D\'accord… »', logs: ['g_explication'] },
      c_accord:       { text: '(Elle fait « oui » de la tête, la main sur la poitrine.)', logs: ['g_accord'] },
      c_intimite:     { text: '(Elle hoche la tête.) « Merci… »', logs: ['g_intimite'] },
      c_fin:          { text: '(Elle lève le pouce.) « Merci… à tout… à l\'heure. »' }
    }), {
      q_comment_allez: { text: "« Mal… je n'arrive plus… à respirer… depuis cette nuit. » (elle reprend son souffle entre chaque mot)", reveals: ['q_ressenti'] },
      q_motif:         { text: "« Mes bronches… la toux… hier soir. » (elle s'arrête pour souffler)", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "« Trois jours… la toux. Cette nuit… le souffle… pire depuis six heures. »", reveals: ['q_depuis'] },
      q_autre:         { text: "« Le souffle… la toux… la tête lourde… »", reveals: ['q_ressenti', 'q_dyspnee', 'q_somnolence'] },
      q_douleur:       { text: "« Pas mal… un peu en haut… quand je tousse. »", reveals: ['q_douleur'] },
      q_respiration:   { text: "« Je manque… d'air… même assise. » (elle tousse) « Et je crache… vert… »", reveals: ['q_dyspnee', 'q_toux'] },
      q_vertiges:      { text: "« Non… juste épuisée… »", reveals: ['q_vertiges'] },
      q_nausees:       { text: '(Elle fait « non » de la tête.)', reveals: ['q_nausees'] },
      q_froid:         { text: "« J'ai eu… des frissons… cette nuit. Chaud puis froid. »", reveals: ['q_froid'] },
      q_alim:          { text: "« Presque rien… manger… ça m'essouffle. »", reveals: ['q_alim'] },
      q_boisson:       { text: "« Un verre… cette nuit… pour la toux. »", reveals: ['q_boisson'] },
      q_urines:        { text: '(Elle hoche la tête.) « Normal… »', reveals: ['q_urines'] },
      q_selles:        { text: '(Elle hoche la tête.)', reveals: ['q_selles'] },
      q_mobilite:      { text: "« Pas levée… depuis cinq heures… ça m'a coupé le souffle. »", reveals: ['q_mobilite'] },
      q_chute:         { text: '(Elle fait « non » de la tête.)', reveals: ['q_chute'] },
      q_sommeil:       { text: "« Mal dormi… assise… la toux. »", reveals: ['q_sommeil'] },
      q_antecedents:   { text: "« Mes bronches… la tension… et j'ai fumé… longtemps. »", reveals: ['q_atcd', 'q_tabac'] },
      q_traitements:   { text: "« Mes sprays… et la perfusion… d'hier soir. Pas encore… les cachets. »", reveals: ['q_ttt'] },
      q_allergies:     { text: "« Non… rien. »", reveals: ['q_allerg'] },
      q_moral:         { text: "« J'ai peur… de ne plus… reprendre mon souffle. » (elle serre le drap)", reveals: ['q_moral'] },
      q_entourage:     { text: "« Ma fille… Corinne. Elle vient… le week-end. »", reveals: ['q_entourage'] },
      q_orientation:   { text: "« Delmas… Danielle. On est… lundi. » (elle souffle entre chaque mot)", reveals: ['q_orientation'] },
      q_somnolence:    { text: "« La tête… lourde… depuis hier soir. Mais je… n'arrive pas à dormir. »", reveals: ['q_somnolence', 'q_cephalees'] },
      q_inhal:         { text: "« Ma Ventoline… trois fois cette nuit… presque rien. »", reveals: ['q_inhal'] },
      q_tabac:         { text: "« Quarante ans… un paquet par jour. J'ai arrêté… il y a deux ans. »", reveals: ['q_tabac'] },
      q_o2dom:         { text: "« Pas d'oxygène… chez moi. Peut-être… un jour. »", reveals: ['q_o2dom'] },
      q_tete:          { text: "« Un peu mal… à la tête… au réveil. Comme un casque. »", reveals: ['q_cephalees'] },
      q_equipe:        { text: "(Karim, depuis la porte) « À 6 h, elle a sonné : elle ne finissait plus ses phrases, ses lèvres étaient bleues. Elle a pris son spray trois fois cette nuit sans effet. Je n'ai pas osé mettre l'oxygène sans l'avis de l'infirmière. »", reveals: ['q_equipe_heure'] }
    }),
    fallbackAnswer: "(Elle fait un geste de la main et reprend son souffle : elle n'arrive pas à répondre.)",
    notUnderstood: "(Elle te regarde, essoufflée, et hoche la tête sans répondre.)",
    whoAreYou: "(Elle te regarde, étonnée, et hausse les épaules en reprenant son souffle.)",

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, auto: [
      { id: 'g_resp_obs', facts: ['o_aspect', 'o_levres', 'o_tirage'] },
      { id: 'g_vigil', asked: ['q_somnolence', 'q_orientation'] },
      { id: 'g_heure', asked: ['q_equipe'] }
    ] }),

    narration: B.narration(patient, {
      knock: 'Tu frappes à la porte et tu attends. Une voix essoufflée répond : « Entrez… ».',
      enter: "Tu entres dans la chambre 214. Mme Delmas est assise dans son lit, penchée en avant, les lèvres pincées. Tu entends sa respiration sifflante depuis la porte. Le scope est sur son pied à côté du lit, éteint ; la prise d'oxygène murale est derrière la tête du lit, avec une étiquette « BPCO : objectif 88-92 % » ; le chariot de soins est au pied du lit."
    }),

    constTable: B.constTable({ temp: '36,8 °C', fc: '88 /min, régulier', pa: '130/78 mmHg', fr: '20 /min', spo2: '90 % en air ambiant' }).map(r =>
      r.fact === 'm_spo2' ? Object.assign({}, r, { norm: "BPCO : cible 88 à 92 % (carte du service) · norme ≥ 94 %" })
      : r.fact === 'm_fr' ? Object.assign({}, r, { norm: '12 à 20 /min (ton CM9) · < 12 : respiration trop lente' }) : r),

    objects: {
      obs_resp: { label: 'Regarder sa respiration', icon: '👁️', reveals: ['o_aspect', 'o_tirage'],
        narration: "Tu observes Mme Delmas : assise, penchée en avant, les avant-bras sur la table, les lèvres pincées. Elle respire vite et transpire un peu. À chaque inspiration, la peau se creuse entre ses côtes et au-dessus de sa clavicule ; sa respiration siffle." },
      obs_peau: { label: 'Toucher sa peau', icon: '🤲', reveals: ['o_peau'],
        narration: "Tu poses le dos de ta main sur son front, puis tu prends sa main : peau chaude et un peu moite, joues rouges, bouts des doigts bleutés." },
      obs_levres: { label: 'Regarder lèvres et doigts', icon: '👄', reveals: ['o_levres'],
        narration: "Tu regardes ses lèvres et le bout de ses doigts : ils sont bleutés. Ses ongles sont violacés." },
      obs_bruits: { label: 'Écouter sa respiration', icon: '👂', reveals: ['o_bruits'],
        narration: "Tu écoutes sans stéthoscope : un sifflement à chaque expiration, des râles qui bouillonnent, une toux grasse qui l'épuise." },
      table: { label: 'Table de chevet', icon: '🗄️', reveals: ['o_crachats', 'o_verre'],
        narration: "Sur la table de chevet : un crachoir avec des crachats épais jaune-vert, un tube de spray ouvert, des mouchoirs usagés, un verre d'eau et un plateau de petit-déjeuner intact." },
      o2mat: { label: "Prise d'oxygène et matériel", icon: '🫁', reveals: ['o_oxy'],
        narration: "Derrière la tête du lit, la prise d'oxygène murale a son débitmètre réglé sur 0 : rien n'est en route. Lunettes, masque et masque à haute concentration sont rangés dans le tiroir. Une étiquette « BPCO : objectif 88-92 % » est collée près de la prise." },
      scopeobs: { label: 'Regarder le scope', icon: '📟', reveals: ['o_scope'],
        narration: "Le scope est sur son pied, à côté du lit, éteint. Ses câbles sont enroulés : électrodes, brassard et capteur de saturation. Rien n'est branché sur Mme Delmas." },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: "La poire d'appel est accrochée au bord du lit, à portée de sa main. Elle s'en est servie à 6 h." }
    },

    sceneActs: {
      patiente: { ico: '🧑‍⚕️', title: 'Observer Mme Delmas', hint: "Touche ce que tu veux regarder ou faire. Pour lui parler, utilise l'onglet « Dialogue ».",
        opts: [
          { ico: '👁️', label: 'Regarder sa respiration (thorax, cou, lèvres)', do: ['obs', 'obs_resp'] },
          { ico: '🤲', label: 'Toucher sa peau (front, mains) : chaleur, humidité', do: ['obs', 'obs_peau'] },
          { ico: '👄', label: 'Regarder ses lèvres et ses doigts (couleur)', do: ['obs', 'obs_levres'] },
          { ico: '👂', label: 'Écouter sa respiration (sans stéthoscope)', do: ['obs', 'obs_bruits'] },
          { ico: '🤝', label: 'Rester près d\'elle et la rassurer', do: ['reste'] }
        ] },
      lit: { ico: '🛏️', title: 'Le lit : où installes-tu Mme Delmas ?', hint: "Le dossier se relève avec la télécommande du lit. Choisis la position.",
        opts: POS.map(id => ({ ico: POS_LAB[id][0], label: POS_LAB[id][1], do: ['pos', id] })) },
      o2wall: { ico: '🫁', title: "Prise d'oxygène murale", hint: "L'oxygène est un médicament : mise en route sur prescription ou protocole du service, réglage par l'infirmière. Ici, tu t'entraînes : regarde l'effet de ton choix sur la patiente, et alerte Claire.",
        opts: [
          { ico: '👀', label: 'Regarder la prise et le matériel (étiquette, débitmètre, masques)', do: ['obs', 'o2mat'] },
          { ico: '🫁', label: 'Lunettes à oxygène · 1 L/min', do: ['o2', 'o2_l1'] },
          { ico: '🫁', label: 'Lunettes à oxygène · 2 L/min', do: ['o2', 'o2_l2'] },
          { ico: '🫁', label: 'Masque · 6 L/min', do: ['o2', 'o2_m6'] },
          { ico: '🫁', label: 'Masque à haute concentration · 15 L/min', do: ['o2', 'o2_mhc'] },
          { ico: '⏹', label: "Arrêter l'oxygène", do: ['o2stop'] }
        ] },
      sonnette: { ico: '🔔', title: "Appeler à l'aide", hint: "Quand quelqu'un manque d'air, on appelle sans le quitter.",
        opts: [
          { ico: '🔔', label: "Appuyer sur la sonnette d'appel : Claire arrive", do: ['alerte', 'sonnette'] },
          { ico: '🏃', label: 'Aller chercher Claire au poste de soins (je quitte la chambre)', do: ['alerte', 'chercher'] },
          { ico: '👀', label: 'Regarder où est la sonnette', do: ['obs', 'sonnette'] }
        ] },
      scopeinfo: { ico: '📟', title: 'Scope', hint: "Touche le scope sur son pied (ou le bouton Scope en dessous) pour le brancher.", opts: [ { ico: '👀', label: 'Regarder le scope', do: ['obs', 'scopeobs'] } ] }
    },

    grid: B.grid({ p: patient, extra: [
      { id: 'g_resp_obs', label: "Observer la respiration : posture, lèvres pincées, couleur des lèvres et des doigts, tirage",
        why: "Devant une difficulté respiratoire, ces signes se voient avant toute mesure : posture penchée en avant, cyanose, tirage intercostal ou du cou (ton CM9).",
        ref: 'UE B3 S1 : CM9, signes cliniques cutanés de détresse respiratoire' },
      { id: 'g_vigil', label: "Évaluer sa vigilance dès le départ (est-elle éveillée, orientée ?) pour repérer un changement ensuite",
        why: "Chez une personne BPCO qui reçoit de l'oxygène, la somnolence est le signe d'alerte à surveiller : il faut un point de départ pour la repérer.",
        ref: 'UE B3 S1 : CM10, oxygénothérapie et surveillance (à confirmer dans ton cours)' },
      { id: 'g_heure', label: "Chercher auprès de l'équipe comment la situation a évolué depuis hier soir",
        why: "L'évolution (depuis quand, à quelle vitesse, effet du spray) aide l'infirmière et le médecin à juger de la gravité.",
        ref: 'Pratique usuelle de recueil de données, à confirmer dans ton cours' }
    ] }),

    alertSummary: "Pris un par un, ces signes pourraient passer pour « sa bronchite habituelle ». Ensemble (essoufflement au repos, phrases coupées, lèvres bleutées, tirage, spray sans effet, saturation à 84 %, fréquence respiratoire à 28, fièvre, crachats jaune-vert), ils montrent qu'une personne BPCO est en difficulté respiratoire. Et attention : l'oxygène peut l'aider… ou l'endormir, selon le débit.",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de Mme Delmas ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: "C'est sa bronchite habituelle : je note ce que j'ai vu et je la laisse se reposer",
          unsafe: "Tu as jugé qu'il n'y avait rien de nouveau à signaler alors que Mme Delmas avait une saturation à 84 %, une fréquence respiratoire à 28, les lèvres bleutées et un spray sans effet.",
          feedback: "Un essoufflement au repos avec phrases coupées, lèvres bleutées et spray sans effet n'est pas « sa bronchite habituelle ». La laisser se reposer serait dangereux. Un étudiant ne décide jamais seul qu'un signe peut attendre." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière, mais cela peut attendre la relève de 8 h",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors qu'elle présentait une détresse respiratoire.",
          feedback: "Devant ces signes, on n'attend pas : une détresse respiratoire peut s'aggraver en quelques minutes. On alerte tout de suite, en restant près de la patiente." },
        { id: 'urgence', pts: 10, verdict: 'good',
          label: "Urgence : j'alerte l'infirmière tout de suite, qui préviendra le médecin, et je reste auprès d'elle, assise, avec le scope",
          feedback: "Bon réflexe. Tu as regroupé les signes (essoufflement au repos, lèvres bleutées, tirage, spray sans effet, fréquence respiratoire et saturation anormales) et tu alertes sans quitter Mme Delmas. C'est Claire qui prévient le médecin et qui décide de l'oxygène, du débit et de la surveillance." },
        { id: 'medecin', pts: 5, verdict: 'avoid',
          label: "J'appelle moi-même le médecin de garde, sans prévenir l'infirmière",
          feedback: "Ton réflexe d'urgence est bon : il ne faut pas attendre. Mais à l'hôpital, l'étudiant alerte d'abord l'infirmière du secteur, qui a le dossier sous les yeux, connaît les traitements et appelle le médecin. Ton rôle est de l'alerter vite, sans quitter la patiente." }
      ],
      actionsQ: "En attendant que Claire arrive, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'aide', v: 'good', label: "Appeler à l'aide (sonnette ou en faisant venir Karim) pour que l'infirmière arrive tout de suite, sans quitter Mme Delmas",
          why: "Elle ne doit pas rester seule : l'alerte se fait sans la quitter, avec la sonnette ou en demandant à un collègue." },
        { id: 'position', v: 'good', label: "L'aider à rester assise ou demi-assise, penchée en avant, les bras appuyés, bien soutenue",
          why: "Assise, le thorax libre, elle respire plus facilement (ton CM10). C'est la position qu'elle prend naturellement. À aucun moment on ne l'allonge." },
        { id: 'rester', v: 'good', label: 'Rester près d\'elle, la rassurer, lui parler lentement et calmement',
          why: "Elle a peur de ne plus reprendre son souffle, et l'anxiété augmente l'essoufflement. Parler lentement, rester près d'elle et la regarder te permet aussi de vérifier qu'elle reste éveillée." },
        { id: 'scope', v: 'good', label: "Brancher le scope et surveiller en continu sa saturation, sa fréquence respiratoire et sa vigilance, en notant l'heure",
          why: "Le scope surveille en continu. Il ne remplace pas ton regard : une bonne saturation avec une patiente qui s'endort n'est pas rassurante (ton CM9)." },
        { id: 'objectif', v: 'good', label: "Rappeler à l'infirmière sa cible de saturation (88 à 92 %, carte BPCO) et son spray sans effet",
          why: "Ces deux informations aident l'infirmière et le médecin à choisir le bon traitement et le bon débit d'oxygène." },
        { id: 'o2bas', v: 'good', label: "Préparer l'oxygène (lunettes, prise murale) pour l'infirmière et ne le mettre en route qu'à sa demande, à bas débit, avec la saturation et la vigilance à surveiller",
          why: "L'oxygène est un médicament : prescription ou protocole du service, réglage par l'infirmière (ton CM10). Chez une personne BPCO, on vise 88 à 92 %, à bas débit, en surveillant la vigilance." },
        { id: 'heure', v: 'good', label: "Noter l'évolution et les heures : toux et fièvre depuis 3 jours, essoufflée depuis cette nuit, pire depuis 6 h, spray pris 3 fois sans effet",
          why: "Ces informations aident l'infirmière et le médecin à juger de la rapidité de l'aggravation." },
        { id: 'dossier', v: 'good', label: "Repérer ses antécédents (BPCO sévère, tension), son traitement, ses allergies (aucune) et la personne à prévenir pour les transmettre",
          why: "Le médecin a besoin de l'histoire de la maladie, des traitements en cours et des allergies avant de prescrire." },
        { id: 'o2max', v: 'danger', label: "Mettre le masque à haute concentration à 15 L/min pour « remonter la saturation à 100 % » au plus vite",
          why: "C'est le piège de la BPCO : un fort débit fait monter la saturation mais endort la patiente, car le CO₂ s'accumule. On vise 88 à 92 %, à bas débit, sur prescription, avec surveillance." },
        { id: 'allonger', v: 'danger', label: "L'allonger à plat pour qu'elle se repose",
          why: "À plat, le diaphragme gêne la respiration : une personne en détresse respiratoire s'étouffe. Elle reste assise ou demi-assise." },
        { id: 'somnifere', v: 'danger', label: "Lui donner son somnifère ou un calmant pour qu'elle se détende",
          why: "Les somnifères et calmants ralentissent la respiration : ils sont dangereux chez une personne BPCO. Aucun médicament sans prescription et sans l'infirmière." },
        { id: 'attendre', v: 'danger', label: "Attendre 15 à 20 minutes pour voir si son souffle se calme",
          why: "Une détresse respiratoire peut s'aggraver en quelques minutes. On alerte sans perdre de temps." },
        { id: 'lever', v: 'danger', label: "La faire se lever et marcher jusqu'aux toilettes pour qu'elle « se dégourdisse »",
          why: "Avec une saturation à 84 %, marcher peut la faire désaturer davantage, provoquer un malaise ou une chute. Elle reste installée jusqu'à l'avis du médecin." },
        { id: 'o2seul', v: 'avoid', label: "Mettre l'oxygène en route toi-même, au débit que tu choisis, avant d'avoir alerté l'infirmière",
          why: "Son besoin d'oxygène est réel, mais c'est un médicament : on alerte d'abord l'infirmière, qui met en route sur prescription ou protocole et règle le débit. Tu peux préparer le matériel." },
        { id: 'ttt_matin', v: 'avoid', label: "Lui donner ses comprimés du matin en attendant",
          why: "Les médicaments se donnent sur prescription, à l'heure décidée par l'infirmière : en pleine détresse, c'est elle puis le médecin qui décident." },
        { id: 'boire', v: 'avoid', label: "Lui faire boire un grand verre d'eau pour calmer la toux",
          why: "Elle est très essoufflée (28/min) : avaler dans ces conditions expose à la fausse route. Rien par la bouche en attendant l'avis du médecin." }
      ]
    },

    call: {
      who: 'Claire',
      intro: "Tu fais venir Karim pour qu'il reste auprès de Mme Delmas et tu joins Claire (poste de soins ou téléphone du service). Claire décroche : « Oui, Claire ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?', placeholder: "Bonjour Claire, c'est … étudiant(e). Je suis chez …",
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies la patiente (nom, chambre)', ask: 'De quelle patiente parles-tu ?', re: [/delmas/, /danielle/, /chambre (214|deux cent quatorze)\b/, /\bch ?214\b/, /\b214\b/] },
            { id: 's_motif', w: 1, label: 'Tu dis pourquoi tu appelles : elle a du mal à respirer (détresse respiratoire)', ask: "Pourquoi m'appelles-tu ?",
              re: [/essouffl/, /respir/, /souffle/, /detresse/, /etouff/, /manque d air/, /dyspnee/, /urgence/, /urgent/, /difficulte/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Elle a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile : BPCO sévère (maladie respiratoire chronique)', ask: 'Elle a quels antécédents ?',
              re: [/bpco/, /bronchopneumopathie/, /bronchite chronique/, /insuffisance respiratoire/, /maladie respiratoire/, /emphyseme/, /tabac/, /fumeuse/, /fume/] },
            { id: 'a_ttt', w: 1, label: "Son traitement : sprays (Ventoline) sans effet, corticoïde et antibiotique débutés hier, pas d'oxygène prescrit", ask: 'Elle prend quoi comme traitement ?',
              re: [/spray/, /ventoline/, /salbutamol/, /bronchodilat/, /corticoide/, /antibiotique/, /traitement/, /pas d oxygene/, /sans oxygene/, /pas d o2/] },
            { id: 'a_depuis', w: 1, label: "L'évolution : toux et fièvre depuis 3 jours, essoufflée depuis cette nuit, pire depuis 6 h", ask: 'Depuis quand ?',
              re: [/cette nuit/, /depuis (3|trois) jours/, /depuis (6|six) ?h/, /depuis hier/, /aggrav/, /empir/, /de plus en plus/, /ce matin/, /depuis/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : elle …, saturation …',
          elements: [
            { id: 'e_signes', w: 2, label: 'Au moins 2 signes parmi : essoufflée au repos, phrases coupées, lèvres bleutées, tirage, spray sans effet, fièvre, crachats jaune-vert', ask: "Qu'est-ce que tu as remarqué chez elle ?",
              need: { min: 2, re: [/essouffl/, /respire (vite|mal|difficile)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /violac/, /sueur/, /transpir/, /phrases/, /crachat/, /jaune/, /vert/, /spray/, /ventoline/, /fievre/, /penche/, /sifflement/, /siffle/] } },
            { id: 'e_const', w: 1, label: "Au moins 3 constantes avec leur valeur (38,2 °C · 108/min · 148/86 · 28/min · 84 %)", ask: 'Tu as pris ses constantes ?',
              test: n => _nConst(n) >= 3 },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (saturation habituelle 90 %, cible 88 à 92 %, fréquence respiratoire 20/min)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b90\b/, /88/, /cible/, /plus bas que/, /plus (essouffle|rapide)/, /avant/, /hier/] }
          ],
          warn: { re: [/infarctus/, /embolie/, /pneumonie/, /oedeme (aigu )?(du )?poumon/, /\boap\b/, /covid/, /grippe/, /asthme/, /fatigu/, /angoisse/, /anxie/, /caprice/, /fait semblant/], pen: 1,
            text: "Tu as nommé une maladie nouvelle ou minimisé les signes. Reste sur ce que tu constates (valeurs, signes, heures). Tu peux évoquer une suspicion, mais c'est l'infirmière puis le médecin qui interprètent." }
        },
        { id: 'D', label: 'D · Demande', hint: "Qu'attends-tu de Claire, et pour quand ?", placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 1, label: 'Tu demandes à Claire de venir tout de suite', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /vienne/, /viendr/, /sur place/] },
            { id: 'd_medecin', w: 1, label: "Tu demandes de prévenir le médecin (médecin de garde)", ask: 'Tu veux que je fasse quoi ?',
              re: [/medecin/, /docteur/, /\bdr\b/, /interne/, /garde/, /avis medical/, /urgentiste/, /equipe medicale/] },
            { id: 'd_o2', w: 2, label: "Tu demandes un avis sur l'oxygène : prescription, bas débit, cible 88 à 92 %", ask: "Et pour l'oxygène ?",
              re: [/oxygen/, /\bo2\b/, /\bo 2\b/, /masque/, /lunettes/, /prescri/, /debit/, /bas debit/, /88/, /cible/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (tout de suite, maintenant)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /immediat/, /urgent/, /urgence/, /\bvite\b/, /rapidement/, /sans attendre/, /des que possible/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est très clair. J'arrive tout de suite et je préviens le médecin de garde : garde-la assise, reste auprès d'elle, ne lui donne rien à boire ni à manger ni calmant, et surveille le scope, y compris sa vigilance. Je règle l'oxygène moi-même, à bas débit, avec une cible de 88 à 92 %.",
        mid: "D'accord, j'ai l'essentiel. J'arrive.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions, vite.',
        final: "Merci, j'ai ce qu'il me faut, j'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: "J'arrive, mais dis-moi toujours ce que tu attends de moi."
      },
      model: {
        S: "Bonjour Claire, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 214 avec Mme Delmas, 68 ans. Je t'appelle parce qu'elle a beaucoup de mal à respirer : elle est essoufflée au repos, avec les lèvres bleutées.",
        A: "Elle a une BPCO sévère, avec de la toux et de la fièvre depuis 3 jours. Elle prend des sprays qui ne la soulagent plus, et elle n'a pas d'oxygène prescrit. Elle est essoufflée depuis cette nuit, c'est pire depuis 6 h. Sa carte indique une cible de saturation de 88 à 92 %.",
        E: "Ce matin : elle parle par petits bouts de phrases, les lèvres pincées et bleutées, la peau se creuse entre ses côtes quand elle inspire, elle crache jaune-vert. Température 38,2, pouls 108, tension 148/86, fréquence respiratoire 28 (20 d'habitude), saturation 84 % (90 % d'habitude). Elle est éveillée et orientée.",
        D: "Je voudrais que tu viennes tout de suite et que tu préviennes le médecin de garde. Peux-tu me dire pour l'oxygène : à quel débit, avec quelle cible ? Je reste avec elle, assise, avec le scope, et je surveille sa vigilance."
      },
      aiFacts: "Patiente fictive : Mme Danielle Delmas, 68 ans, chambre 214, service de pneumologie d'un hôpital. Antécédents : BPCO sévère, ancienne fumeuse (40 paquets-années), hypertension. Pas d'oxygène à domicile. Hospitalisée depuis hier soir pour aggravation (toux, crachats jaune-vert, fièvre, essoufflement). Ce matin 7 h 10 : température 38,2 °C, pouls 108/min, PA 148/86, fréquence respiratoire 28/min, saturation 84 % en air ambiant (habituelle 90 %, cible 88 à 92 %). Lèvres bleutées, tirage, phrases coupées. L'étudiant ne règle pas l'oxygène : il alerte l'infirmière (Claire)."
    },

    rx: {
      from: 'Dr Lambert, médecin de garde · consignes recueillies par Claire',
      title: 'Consignes du médecin de garde',
      stepName: 'Consignes du médecin',
      nextLabel: 'les consignes du médecin',
      intro: "Claire a prévenu le Dr Lambert, qui arrive dans la chambre quelques minutes plus tard. Il donne ses consignes à Claire, qui te les transmet pendant que vous restez auprès de Mme Delmas. Lis-les attentivement : ce sont elles qu'il faudra transmettre ensuite. Le résultat du gaz du sang est revenu.",
      note: "Consignes fictives, écrites pour l'entraînement. Dans la réalité, elles dépendent du médecin, de la situation et des protocoles du service.",
      patientLine: 'Mme Danielle DELMAS · 68 ans · chambre 214',
      lines: [
        { id: 'medecin', icon: '🩺', t: "Le Dr Lambert examine la patiente dans la chambre." },
        { id: 'position', icon: '🛏️', t: "Position assise ou demi-assise, penchée en avant si elle le souhaite. Ne pas l'allonger, ne pas la faire marcher." },
        { id: 'oxy', icon: '🫁', t: "Oxygène à bas débit prescrit : lunettes 1 à 2 L/min, mis en route et réglé par l'infirmière pour une saturation entre 88 et 92 %. Ne règle aucun débit toi-même. Surveiller la saturation, la fréquence respiratoire ET la vigilance : prévenir tout de suite si elle devient somnolente." },
        { id: 'neb', icon: '💨', t: "Aérosols de bronchodilatateurs, administrés par l'infirmière, de préférence à l'air comprimé chez une personne BPCO (pas à l'oxygène à fort débit)." },
        { id: 'ttt', icon: '💊', t: "Corticoïde et antibiotique poursuivis par voie veineuse ; pas de somnifère ni de calmant. Les comprimés du matin ne sont pas donnés en attendant." },
        { id: 'gazo', icon: '🩸', gazo: true, t: "Gaz du sang artériel : prélevé par le médecin, résultat disponible. (Un étudiant ne prélève pas un gaz du sang : il aide à le lire, avec l'infirmière.)" },
        { id: 'ecg', icon: '🫀', t: "ECG 12 dérivations (pouls à 108/min, fièvre) : à réaliser, avec Claire à tes côtés.", ecg: true },
        { id: 'rx', icon: '🩻', t: "Radiographie du thorax réalisée au lit, demandée par le médecin : le résultat est ci-dessous, à décrire." },
        { id: 'surv', icon: '📈', t: "Scope en continu ; noter saturation, fréquence respiratoire, vigilance et tension toutes les 15 minutes, avec l'heure, et prévenir tout de suite si cela change." },
        { id: 'jeun', icon: '⛔', t: "À jeun, rien à boire en attendant l'avis. Surveillance de la fièvre." },
        { id: 'famille', icon: '📞', t: "Sa fille, Corinne, est prévenue par l'infirmière." }
      ],
      ecgCtx: {
        patient: { nom: 'DELMAS', prenom: 'Danielle', dn: '17/09/1958', age: 68 },
        rate: 108,
        situation: "Le Dr Lambert a prescrit un ECG 12 dérivations à Mme Delmas (pouls à 108/min, fièvre, BPCO). Claire te demande de le réaliser pendant qu'elle prépare les aérosols. Elle reste à côté de toi : en 1re année, un geste technique se fait toujours sous la supervision d'un soignant."
      },
      // « Autres paramètres » : bilan sanguin et radio, lecture sommaire (hors score)
      labs: c => ({
        bio: { title: 'Bilan sanguin à lire', intro: "Les résultats de la prise de sang d'hier soir sont arrivés. Pour chaque valeur, dis si elle est trop basse, normale ou trop haute (valeurs fictives).",
          rows: [
            { id: 'na', name: 'Sodium (Na⁺)', unit: 'mmol/L', val: 138, lo: 135, hi: 145, ref: '135 – 145', why: "Normal : pas d'anomalie du sodium." },
            { id: 'k', name: 'Potassium (K⁺)', unit: 'mmol/L', val: 3.3, lo: 3.5, hi: 5, ref: '3,5 – 5,0', why: "Un peu bas : le salbutamol (spray) et les corticoïdes peuvent faire baisser le potassium. Tu le transmets ; le médecin décide d'une correction (jamais l'étudiant)." },
            { id: 'crp', name: 'CRP (inflammation)', unit: 'mg/L', val: 142, lo: 0, hi: 5, ref: 'moins de 5', why: "Très haute : marqueur d'inflammation, cohérent avec une infection. À rapprocher de la fièvre et des crachats jaune-vert." },
            { id: 'gb', name: 'Globules blancs', unit: 'G/L', val: 15.8, lo: 4, hi: 10, ref: '4 – 10', why: "Trop hauts : l'organisme se défend contre une infection." },
            { id: 'hb', name: 'Hémoglobine', unit: 'g/dL', val: 17.2, lo: 12, hi: 16, ref: '12 – 16 (femme)', why: "Un peu haute : chez une personne BPCO sévère, le corps fabrique plus de globules rouges quand il manque d'oxygène depuis longtemps. C'est un signe de manque d'oxygène chronique." }
          ],
          note: "Lecture sommaire, à confirmer avec ton cours et les normes du laboratoire. L'interprétation et la décision reviennent au médecin." },
        radio: { title: 'Radio du thorax à décrire', intro: "Voici l'image faite au lit de la patiente (fictive, simplifiée). Coche ce que tu vois. Sur une radio, le côté droit du patient est à gauche de l'image.",
          alt: 'Radio du thorax simulée : poumons gonflés, cœur allongé, zone blanche à la base du poumon droit',
          svg: '<svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;border-radius:10px"><defs><linearGradient id="xrl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a323c"/><stop offset="1" stop-color="#171c23"/></linearGradient><filter id="xrb"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="300" height="250" fill="#07090c"/><rect x="146" y="8" width="8" height="205" rx="3" fill="#6b7480" opacity=".5"/><path d="M52 34 C38 90 40 160 62 205 Q100 212 142 204 L142 44 C112 22 74 22 52 34Z" fill="url(#xrl)" stroke="#8d97a3" stroke-width="1.2"/><path d="M248 34 C262 90 260 160 238 205 Q200 212 158 204 L158 44 C188 22 226 22 248 34Z" fill="url(#xrl)" stroke="#8d97a3" stroke-width="1.2"/><ellipse cx="170" cy="150" rx="19" ry="40" fill="#b7c0cb" opacity=".5"/><g stroke="#c7ced6" stroke-width="1.3" fill="none" opacity=".4"><path d="M46 52Q96 44 142 54"/><path d="M45 74Q96 66 142 76"/><path d="M45 96Q96 88 142 98"/><path d="M46 118Q96 110 142 120"/><path d="M48 140Q96 132 142 142"/><path d="M52 162Q96 154 142 164"/><path d="M254 52Q204 44 158 54"/><path d="M255 74Q204 66 158 76"/><path d="M255 96Q204 88 158 98"/><path d="M254 118Q204 110 158 120"/><path d="M252 140Q204 132 158 142"/><path d="M248 162Q204 154 158 164"/></g><ellipse cx="88" cy="176" rx="30" ry="19" fill="#eef2f6" opacity=".72" filter="url(#xrb)"/><path d="M56 206Q100 200 142 204M244 206Q200 200 158 204" stroke="#d6dce3" stroke-width="2" fill="none" opacity=".6"/><text x="12" y="22" fill="#cbd3dc" font-size="14" font-family="sans-serif" font-weight="700">D</text><text x="278" y="22" fill="#cbd3dc" font-size="14" font-family="sans-serif" font-weight="700">G</text><text x="150" y="242" text-anchor="middle" fill="#8d97a3" font-size="9" font-family="sans-serif">image simulée · fictive · simplifiée</text></svg>',
          items: [
            { id: 'dist', yes: true, t: "Les poumons paraissent très gonflés : côtes à l'horizontale, coupoles du diaphragme aplaties, cœur étroit et allongé (thorax « distendu »)", why: "C'est le signe habituel d'une BPCO sévère : l'air reste piégé dans les poumons. C'est son état chronique." },
            { id: 'opa', yes: true, t: "Une zone plus blanche (opacité) à la base du poumon droit, à gauche sur l'image", why: "Cette tache blanche à droite fait penser à une infection localisée, en lien avec la fièvre et les crachats jaune-vert. Tu la décris : c'est le médecin qui conclut." },
            { id: 'pneumo', yes: false, t: "Un poumon « décollé » : une zone toute noire sans trace de poumon (pneumothorax)", why: "Les deux poumons arrivent jusqu'aux bords du thorax : rien ne montre un décollement." },
            { id: 'coeur', yes: false, t: "Un cœur très gros, qui occupe plus de la moitié du thorax", why: "Au contraire : il est plutôt étroit et allongé, ce qui est fréquent quand les poumons sont très gonflés." }
          ],
          note: "Tu décris ce que tu vois, tu ne poses aucun diagnostic. La lecture d'une radio relève du médecin ou du radiologue. Image fictive, simplifiée." }
      }),
      // Gaz du sang lu : celui qui correspond à l'état de la patiente à la fin du recueil
      gazoFor: c => {
        const q = Q[_gazoCase(c)];
        return { q, title: _gazoCase(c) === 2 ? 'Lire le gaz du sang de contrôle de Mme Delmas' : 'Lire le gaz du sang de Mme Delmas',
          intro: _gazoCase(c) === 2
            ? "Mme Delmas s'est endormie sous l'oxygène : le médecin a demandé un gaz du sang de CONTRÔLE. Claire te demande ce que tu en comprends. Suis la démarche de ton cours : pH, PaCO₂, HCO₃⁻, compensation, puis PaO₂."
            : (_gazoCase(c) === 3 ? "Après de l'oxygène à bas débit, le médecin a fait un gaz du sang de contrôle. Claire te demande ce que tu en comprends : pH, PaCO₂, HCO₃⁻, compensation, puis PaO₂."
              : "Le médecin a prélevé un gaz du sang à son arrivée, en air ambiant. Claire te demande ce que tu en comprends : pH, PaCO₂, HCO₃⁻, compensation, puis PaO₂."),
          backLabel: 'Consignes du médecin', doneLabel: 'Revenir aux consignes →' };
      },
      gazoPair: c => {
        const k = _gazoCase(c); if (k === 1) return null;
        return { title: k === 2 ? 'Avant / après le fort débit d\'oxygène' : 'Avant / après l\'oxygène à bas débit',
          before: { label: 'Arrivée (air ambiant)', gaz: GDS1 }, after: { label: k === 2 ? 'Après fort débit' : 'Après bas débit', gaz: k === 2 ? GDS2 : GDS3 },
          note: k === 2 ? "**Regarde le PaCO₂ et le pH** : le CO₂ est passé de 58 à 84 et le pH de 7,32 à 7,19 pendant que la PaO₂ grimpait à 142. Elle avait une belle saturation… et elle s'endormait. Voilà ce que le scope ne montre pas." : "**Regarde la PaO₂ et le pH** : l'oxygène a monté de 52 à 61 sans que le CO₂ s'envole (56) : le pH remonte à 7,34. C'est l'objectif de l'oxygène à bas débit chez une personne BPCO." };
      }
    },

    written: {
      intro: "Il est 7 h 50. Le médecin est passé, le traitement est en cours et Mme Delmas respire un peu mieux, toujours assise. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de jour sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème), des données, des actions et des résultats.",
      rules: "Écris des faits observables, datés, sans jugement ni diagnostic. Évite les formules vagues (« RAS », « fatiguée »). Mentionne l'heure quand tu la connais. Pour l'oxygène, note le matériel, le débit (réglé par l'infirmière), la saturation et la vigilance.",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : détresse respiratoire, BPCO aggravée…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème précis (détresse respiratoire, essoufflement, BPCO aggravée)',
              re: [/essouffl/, /respir/, /detresse/, /dyspnee/, /bpco/, /hypox/, /saturation/, /souffle/, /manque d air/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : signes, valeurs, heures.', placeholder: 'Ex. : à 7 h 10, essoufflée au repos, lèvres bleutées, FR 28, SpO2 84 %…', rows: 4, elements: [
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : essoufflement au repos, lèvres bleutées, tirage, phrases coupées, crachats jaune-vert, fièvre, spray sans effet', need: { min: 2, re: [/essouffl/, /respire (vite|mal)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /violac/, /sueur/, /phrases/, /crachat/, /jaune/, /vert/, /fievre/, /spray/, /ventoline/, /siffl/] } },
            { id: 'w_const', w: 1, label: 'Au moins 3 constantes avec leur valeur (38,2 · 108 · 148/86 · 28 · 84 %)', test: n => _nConst(n) >= 3 },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel (saturation habituelle 90 %, FR 20/min, pouls 88)', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b90\b/, /au lieu de/, /avant/, /hier/] },
            { id: 'w_depuis', w: 1, label: "L'évolution : toux et fièvre depuis 3 jours, essoufflée depuis cette nuit, pire depuis 6 h", re: [/trois jours/, /\b3 jours/, /\b6 ?h/, /cette nuit/, /aggrav/, /empir/, /de plus en plus/, /depuis/, /ce matin/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiant/, /agacant/, /mauvaise volonte/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: "Ce que toi et l'équipe avez fait.", placeholder: 'Ex. : infirmière alertée à …, installée assise, scope branché, oxygène à bas débit par l\'infirmière…', rows: 4, elements: [
            { id: 'w_ide', w: 1, label: "L'infirmière (Claire) a été alertée (qui, à quelle heure)", all: [/(claire|\bide\b|infirmiere|infirmier)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise|sonnette)/] },
            { id: 'w_med', w: 2, label: 'Le médecin a été prévenu (par qui, à quelle heure)', re: [/medecin/, /docteur/, /\bdr\b/, /lambert/, /garde/, /interne/] },
            { id: 'w_o2', w: 2, label: "L'oxygène : bas débit (lunettes) réglé par l'infirmière, cible 88 à 92 %, surveillance de la saturation et de la vigilance", re: [/oxygen/, /\bo2\b/, /lunettes/, /bas debit/, /litre/, /\bl min\b/, /88/, /cible/, /vigilance/, /somnol/] },
            { id: 'w_soins', w: 1, label: "Tes actions de soin : installée assise, restée auprès d'elle, scope branché, rien par la bouche", re: [/assis/, /demi assis/, /redress/, /installe/, /reste/, /surveill/, /scope/, /rassur/, /a jeun/, /rien (a|par)/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: "Où en est la patiente après ces actions ? Qu'est-ce qui reste à faire ?", placeholder: 'Ex. : saturation à …, respire un peu mieux, éveillée ; surveillance à poursuivre', rows: 4, elements: [
            { id: 'r_etat', w: 1, label: "L'état de la patiente après les soins (saturation, respiration, vigilance : éveillée ou somnolente)", re: [/mieux/, /amelior/, /moins essouffl/, /sans changement/, /inchange/, /stable/, /eveill/, /somnol/, /vigilan/, /satur/, /\b9[0-9] ?%?/, /\b8[0-9] ?%?/] },
            { id: 'r_suite', w: 1, label: 'La suite : surveillance au scope, gaz du sang de contrôle, radio, fille prévenue', re: [/scope/, /surveillance/, /a poursuivre/, /a surveiller/, /gaz du sang/, /radio/, /bilan/, /fille/, /corinne/, /famille/, /prevenu/, /a suivr/] }
          ] }
      ],
      model: {
        C: "Détresse respiratoire sur BPCO : essoufflement au repos, saturation basse",
        D: "À 7 h 10 : patiente assise, penchée en avant, phrases coupées, lèvres pincées et bleutées, tirage intercostal, crachats jaune-vert, fièvre 38,2. Pouls 108, tension 148/86, FR 28 (20 d'habitude), saturation 84 % en air ambiant (90 % d'habitude, cible 88 à 92 %). Toux et fièvre depuis 3 jours, essoufflée depuis cette nuit, pire depuis 6 h, spray sans effet. Éveillée et orientée.",
        A: "Infirmière (Claire) alertée à [heure] par la sonnette. Resté auprès de la patiente, rassurée, installée assise, scope branché, rien donné par la bouche, aucun débit d'oxygène réglé sans l'accord de l'infirmière. Médecin de garde prévenu par l'infirmière à [heure]. Oxygène par lunettes à bas débit, réglé par l'infirmière, cible 88 à 92 %.",
        R: "Médecin venu à [heure], traitement en cours. À 7 h 50 : respire un peu mieux, saturation à [valeur] sous lunettes, éveillée et répond normalement. Surveillance au scope (saturation, FR, vigilance) toutes les 15 min à poursuivre, gaz du sang de contrôle et radio demandés. Fille Corinne prévenue par l'infirmière."
      },
      aiFacts: null
    },

    evo: EVO
  });

  // ───────────── Gestes de sécurité : ce que valent la position et l'oxygène chez Mme Delmas ─────────────
  App.SimSoins = App.SimSoins || { POS: [], O2: [], DEFAULT: {}, cases: {} };
  App.SimSoins.cases = App.SimSoins.cases || {};
  App.SimSoins.cases.hop_bpco_7 = {
    vital: true,
    pos: {
      assise:   { v: 'good',  pat: "(Mme Delmas, penchée en avant, pose les avant-bras sur la table et respire un peu mieux.)",
                  why: "Assise, penchée en avant, le thorax libre, elle respire plus facilement : c'est la position qu'elle prend naturellement quand elle manque d'air." },
      demi:     { v: 'good',  pat: "(Tu relèves le dossier et tu cales les oreillers : elle respire un peu moins vite.)",
                  why: "Assise ou demi-assise (dossier à plus de 30°), bien calée : c'est la position qui soulage une personne qui manque d'air." },
      bord:     { v: 'good',  pat: "(Tu l'aides à s'asseoir au bord du lit, tu la soutiens par l'épaule, les bras appuyés sur la table : elle respire un peu mieux.)",
                  why: "Assise au bord du lit, penchée en avant, les bras appuyés : position classique en cas de gêne respiratoire chronique, à condition de la soutenir, de ne pas la laisser seule et de ne pas la faire marcher." },
      allongee: { v: 'danger', pat: "(Dès que le dossier descend, elle s'agrippe aux draps, la bouche ouverte.) « J'étouffe… » (Tu la rassois tout de suite.)",
                  why: "À plat, le diaphragme gêne la respiration : une personne en détresse respiratoire s'étouffe. On ne l'allonge jamais à plat : assise ou demi-assise." },
      jambes:   { v: 'danger', pat: "(Elle se débat, le souffle coupé.) « J'étouffe… » (Tu la rassois tout de suite.)",
                  why: "Allongée, même avec les jambes surélevées, elle ne peut plus respirer correctement. Il faut la garder assise ou demi-assise." },
      pls:      { v: 'avoid', pat: "(Elle te regarde, essoufflée, en secouant la tête.)",
                  why: "La PLS est pour une personne inconsciente qui respire. Mme Delmas est éveillée : elle doit rester assise. Si tu ne parviens plus à la réveiller, tu appelles aussitôt." }
    },
    // Oxygène : BPCO → bas débit seulement (88 à 92 %), jamais au maximum (le CO₂ s'accumule et elle s'endort)
    o2: { mode: 'allow', indicated: true, byDeb: true,
      good:   { pat: "(Les lunettes se posent. Elle respire un peu moins vite, ses épaules se détendent ; ses lèvres reprennent un peu de couleur.)",
                why: "Chez une personne BPCO, on vise une saturation modérée (88 à 92 %) : si on met de l'oxygène, c'est à faible débit, avec surveillance de la saturation et de la vigilance. En stage, c'est l'infirmière qui décide et règle (ou le protocole du service) : alerte-la d'abord. Ici, tu t'entraînes : regarde le graphique « Tendances du scope » après ton choix." },
      avoid:  { pat: "(Le masque se pose, la buée apparaît à l'intérieur. Elle respire plus lentement et paraît plus calme… presque trop.)",
                why: "C'est déjà trop pour elle : à débit moyen, une personne BPCO retient du CO₂ et peut s'endormir. Redescends à 1 ou 2 L/min avec des lunettes, surveille sa vigilance et alerte l'infirmière." },
      danger: { pat: "(Le masque à haute concentration se gonfle. Sa saturation grimpe, elle se détend… puis ses paupières se font lourdes.)",
                why: "Le piège classique : un fort débit d'oxygène chez une personne BPCO fait monter le CO₂ (hypercapnie) : somnolence, jusqu'au coma. Ici, sa saturation est belle mais elle s'endort. Baisse le débit, parle-lui fort et alerte tout de suite." },
      nurseGood: "Oui, des lunettes à bas débit, c'est bien. Je prends le relais pour la prescription et le réglage ; je vise 88 à 92 %. Surveille sa saturation, sa respiration et surtout sa vigilance." },
    nurse: {
      vitalOk: "Je suis là, j'ai vu. J'appelle le médecin de garde tout de suite. Reste auprès d'elle, assise, branche le scope si ce n'est pas fait, surveille sa saturation, sa respiration et sa vigilance, ne lui donne rien à boire ni calmant, puis fais-moi ton point (SAED).",
      prompt:  "Je passe te voir. Termine ton recueil, constantes comprises, puis fais-moi ton point : Situation, Antécédents, Évaluation, Demande.",
      left:    "Ne laisse jamais la patiente seule quand elle manque d'air : appuie sur la sonnette ou fais venir Karim, tu restes dans la chambre. Je viens tout de suite.",
      again:   "Je suis déjà là, je m'en occupe avec toi. Continue ton recueil.",
      whyGood: "Quand une personne manque d'air, on alerte tout de suite et on reste près d'elle : sonnette ou Karim, sans la laisser seule pour aller chercher de l'aide.",
      whyOk:   "Tu as prévenu Claire : c'est un bon réflexe, mais ici il faut le faire sans attendre.",
      whyLeft: "Tu as bien alerté, mais tu as laissé la patiente seule dans la chambre. Quand on manque d'air, on reste près d'elle : sonnette ou Karim."
    },
    rester: { pat: "(Tu restes près de Mme Delmas, une main posée sur son épaule. Elle hoche la tête, un peu rassurée.)",
              why: "Elle a peur de ne plus reprendre son souffle : rester près d'elle, lui parler lentement et surveiller sa respiration et sa vigilance la rassure (l'anxiété augmente l'essoufflement)." }
  };
})();
