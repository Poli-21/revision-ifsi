// data/sim_girard.js — Simulation clinique : scénario EHPAD n° 4, Mme Girard (une urgence : suspicion d'AVC)
// Même structure que data/sim_ehpad.js (Mme Martin). Les briques communes viennent de data/sim_base.js.
// ⚠ Patiente et valeurs FICTIVES, à but pédagogique. Les protocoles de l'établissement et les consignes du SAMU priment.
// ⚠ Contenu à faire relire par ton formateur : chaque élément cite sa source ou précise qu'il est à confirmer.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'Mme', nom: 'Girard', prenom: 'Monique', dob: '03/03/1942', dobMots: 'trois mars mille neuf cent quarante-deux', age: 84, chambre: 11, sexe: 'F', avatar: '👵' };
  const T = B.tools({ p: patient, de: 'de Mme Girard', temp: 36.7, fc: { rate: 84, rhythm: 'irrégulier' }, pa: [168, 92], fr: 18, spo2: 96 });

  App.SimScenarios.push({
    id: 'ehpad_avc_4',
    title: 'La parole de Mme Girard',
    short: "Tu passes voir une résidente de 84 ans après son petit-déjeuner. Elle cherche ses mots et a lâché sa tasse. Chaque minute compte : que fais-tu, et dans quel ordre ?",
    icon: '🚨',
    level: 3, levelLabel: 'Avancé',
    setting: 'EHPAD', semestre: 'S1', ue: ['B.3'], duration: '15 à 20 min',
    status: 'Version à valider avec ton formateur',
    competences: [
      { n: 1,  label: 'Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique)' },
      { n: 3,  label: 'Réaliser des soins (surveillance, mesures, soins relationnels)' },
      { n: 6,  label: 'Communiquer et conduire une relation dans un contexte de soins (rassurer une personne en difficulté de parole)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe (alerte)" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions)' }
    ],
    sources: [
      { label: 'HAS : AVC, prise en charge précoce (synthèse des recommandations, 2009)',
        url: 'https://has-sante.fr/upload/docs/application/pdf/2009-07/avc_prise_en_charge_precoce_-_synthese_des_recommandations.pdf',
        note: "Signes d'alerte (FAST : visage, bras, parole), appel immédiat du 15 devant tout déficit neurologique brutal, noter l'heure exacte de survenue des symptômes, orientation en priorité vers une unité neuro-vasculaire (UNV). Ce document ne détaille pas les consignes sur la bouche (boire, manger) : la règle « rien par la bouche » ci-dessous est une règle de prudence (risque de fausse route), à confirmer avec le protocole de ton service." },
      { label: 'Mnémotechnique VITE (Visage, Inertie, Troubles de la parole, En urgence)',
        note: "Version française de FAST utilisée dans les campagnes de sensibilisation. Le libellé de chaque lettre varie selon les sources : vérifie celui de ton cours avant de l'apprendre par cœur." },
      { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
        url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière référente (étape Décision)." },
      { label: 'Guide du stage infirmier en EHPAD (Réussis ton IFSI : ta page de cours)',
        url: 'https://app.reussistonifsi.fr/cours/ehpad-2',
        note: "Résidents accueillis, rôle de l'infirmier(e), vocabulaire du stage (IDEC, MT, DLU, PAP…). Page réservée aux abonnés." },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
        note: "Objectifs du S1 : recueil structuré de données, entretien clinique débutant, repérage des signes d'aggravation, transmissions ciblées." }
    ],

    patient,
    scene: { clock: { h: 8, m: 10 }, label: 'Chambre 11 : Mme Girard est installée dans son lit',
      patient: { eyes: 'open', pale: false, droop: true } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_const_hab'],

    urgent: {
      facts: ['o_aspect', 'o_main', 'q_parole', 'q_membres', 'q_t_visage', 'q_t_bras', 'q_t_phrase'],
      message: "⏱ Ces signes brutaux (visage, bras, parole) sont ceux d'une urgence : chaque minute compte. Va à l'essentiel (l'heure de début, les constantes), puis alerte l'infirmière sans traîner."
    },

    intro: {
      heure: '8 h 10',
      texte: "Tu es en stage dans un EHPAD, avec Sophie, l'infirmière référente, joignable au poste de soins. Il est 8 h 10 : tu passes voir Mme Girard, résidente de la chambre 11, après son petit-déjeuner. Elle est installée dans son lit.",
      equipe: "Transmissions de la nuit : « Nuit calme, RAS. » Karim, aide-soignant : « Elle n'a presque pas touché à son petit-déjeuner. Elle a l'air un peu absente. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, puis repère ce qui doit alerter. Ici, le temps compte : ne perds pas de minutes dans les gestes secondaires."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "Mme Monique GIRARD, née le 03/03/1942 (84 ans) · chambre 11 · bracelet d'identification au poignet · droitière." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'entrée",
        text: "Entrée en EHPAD il y a 14 mois, après une perte d'autonomie à domicile (veuve, vivait seule). Chambre seule, côté jardin." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: "Hypertension artérielle · fibrillation atriale (rythme du cœur irrégulier) · insuffisance rénale modérée · excès de cholestérol · fracture du poignet gauche il y a 2 ans. Pas d'AVC connu." },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Aucune allergie connue (selon le dossier).' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: "Rivaroxaban 15 mg (anticoagulant) : 1 comprimé le soir au dîner, dernière prise hier à 19 h · Bisoprolol 2,5 mg : 1 comprimé le matin (pas encore pris aujourd'hui) · Atorvastatine 20 mg : 1 comprimé le soir · Paracétamol 1 g si douleur, maximum 3 g par 24 h (prescription « si besoin »)." },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: 'GIR 4 : marche avec une canne, se lève seule, toilette avec aide partielle, mange seule (plateau préparé).' },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: "Bavarde, rieuse, parfaitement orientée. Lit le journal régional chaque matin. Sa fille Isabelle est la personne à prévenir." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: 'Température 36,6 °C · pouls 74/min, irrégulier (fibrillation atriale connue) · pression artérielle 138/78 mmHg · fréquence respiratoire 16/min · saturation 97 %.',
        meaning: "Ces valeurs servent de point de comparaison. Son pouls irrégulier est connu : ce n'est donc pas un changement." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
        text: "Répond lentement, avec des mots qui s'arrêtent : « pas… bien… la main… ». Elle comprend ce qu'on lui dit, mais les mots ne sortent pas comme d'habitude.",
        how: 'Demande-lui comment elle se sent ce matin.',
        meaning: "Une résidente d'habitude bavarde qui ne trouve plus ses mots : c'est un changement brutal, à ne jamais mettre sur le compte de la fatigue." },
      q_parole: { section: 'symptomes', kind: 'chercher', label: 'Parole', key: true, alert: true,
        text: "Elle cherche ses mots : phrases hachées, certains mots déformés (« ca-fé » devient « ta-fé »). Elle comprend les questions, elle hoche la tête pour répondre.",
        how: 'Demande-lui de te parler, et si elle te comprend.',
        meaning: "Un trouble de la parole qui apparaît d'un coup est l'un des trois signes d'alerte de l'AVC (Visage, bras, Parole)." },
      q_membres: { section: 'symptomes', kind: 'chercher', label: 'Bras et jambes', key: true, alert: true,
        text: "La main droite est « lourde » et engourdie : elle a lâché sa tasse de café. Elle sent moins sa jambe droite.",
        how: 'Demande-lui si elle sent bien ses bras, ses mains et ses jambes.',
        meaning: "Une faiblesse brutale d'un seul côté du corps est un signe d'alerte. Elle est droitière : la main qui lâche est la main droite." },
      q_vue: { section: 'symptomes', kind: 'chercher', label: 'Vue', text: "Voit « un peu flou » mais pas double (elle montre ses yeux).", how: 'Demande-lui si elle voit bien.' },
      q_tete: { section: 'symptomes', kind: 'chercher', label: 'Maux de tête', text: "Elle secoue la tête : pas de mal à la tête.", how: 'Demande-lui si elle a mal à la tête.',
        meaning: "L'absence de mal de tête n'écarte rien : un AVC peut se passer sans douleur." },
      q_t_visage: { section: 'symptomes', kind: 'chercher', label: 'Test : sourire', key: true, alert: true,
        text: "Quand tu lui demandes de sourire, un côté du visage ne suit pas : le coin droit de la bouche reste tombant, le sourire est de travers.",
        how: 'Demande-lui de te sourire, de lever les deux bras et de répéter une phrase.',
        meaning: "Visage : une asymétrie quand on sourit est le premier signe à chercher." },
      q_t_bras: { section: 'symptomes', kind: 'chercher', label: 'Test : lever les bras', key: true, alert: true,
        text: "Les deux bras levés devant elle : le bras gauche tient, le bras droit retombe en quelques secondes.",
        how: 'Demande-lui de lever les deux bras.',
        meaning: "Un bras qui ne tient pas en l'air (« inertie ») est le deuxième signe." },
      q_t_phrase: { section: 'symptomes', kind: 'chercher', label: 'Test : répéter une phrase', key: true, alert: true,
        text: "Elle essaie de répéter « Il fait beau ce matin » : « Il… fé… bo… ma… ». Les mots sont déformés.",
        how: 'Demande-lui de répéter une phrase simple.',
        meaning: "Une phrase simple mal répétée confirme le trouble de la parole." },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Depuis quand', key: true, alert: true,
        text: "Elle ne sait pas dire depuis quand. Elle montre sa tasse renversée et dit « tout… à l'heure ».",
        how: 'Demande-lui depuis quand elle se sent ainsi.',
        meaning: "Quand la personne ne peut pas donner l'heure du début, il faut la reconstituer avec l'équipe : l'heure à laquelle elle a été vue normale pour la dernière fois." },
      q_equipe_heure: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", key: true, alert: true,
        text: "Karim : « À 7 h 30, elle allait bien : elle m'a dit bonjour et elle a bu son café. Je suis repassé à 8 h 05 : elle ne parlait plus comme d'habitude, je pensais que c'était la fatigue. »",
        how: "Interroge Karim, l'aide-soignant.",
        meaning: "Dernière fois vue normale : 7 h 30. Les signes sont apparus entre 7 h 30 et 8 h 05. C'est l'information clé pour les secours : elle décide des traitements possibles." },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', text: "Elle te regarde droit dans les yeux, montre du doigt le journal du jour sur la table : elle sait quel jour on est, mais elle ne trouve pas le mot.", how: 'Demande-lui quel jour nous sommes.' },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', text: 'Aucune douleur (elle secoue la tête).', how: 'Demande si elle a mal quelque part.' },
      q_resp: { section: 'symptomes', kind: 'chercher', label: 'Respiration', text: 'Respire normalement, ne tousse pas.', how: 'Demande si elle respire bien.' },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: "Pas de nausées ni de vomissements.", how: 'Demande si elle a des nausées.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', text: "Non, la tête ne tourne pas (elle fait « non » de la tête).", how: 'Demande si la tête lui tourne.' },
      q_froid: { section: 'symptomes', kind: 'chercher', label: 'Chaud / froid', text: "Elle ne frissonne pas, ne transpire pas (« non »).", how: 'Demande si elle a eu froid ou chaud.' },
      q_alim: { section: 'histoire', kind: 'chercher', label: 'Petit-déjeuner', text: "A bu quelques gorgées de café avant de lâcher sa tasse. N'a pas touché aux biscottes.", how: "Demande-lui ce qu'elle a mangé ou bu ce matin." },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: "Quelques gorgées de café ce matin.", how: 'Demande si elle a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', text: 'Urines normales hier (selon Karim).', how: 'Demande si elle urine normalement.' },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande si elle est allée à la selle.' },
      q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements', text: "N'a pas essayé de se lever ce matin ; elle sent la jambe droite lourde.", how: 'Demande comment elle se déplace.' },
      q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes', text: 'Pas de chute ni de coup à la tête.', how: 'Demande si elle est tombée récemment.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: 'A bien dormi (nuit calme).', how: 'Demande si elle a bien dormi.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Les larmes aux yeux ; elle dit « peur ». Elle est inquiète de ne pas arriver à parler.", how: 'Demande comment est son moral.',
        meaning: "Elle est consciente de ce qui lui arrive : rassure-la, parle lentement et simplement." },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: "Dit « Isa… » : sa fille Isabelle, qui est la personne à prévenir.", how: 'Demande si sa famille vient la voir.' },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris', text: "Ne peut pas nommer ses médicaments (elle cherche ses mots) : on se fie au dossier.", how: 'Demande quels médicaments elle prend.' },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: "Pose la main sur son cœur : « cœur… tension ». Cohérent avec le dossier.", how: 'Demande quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "Ne peut pas raconter son arrivée ce matin ; elle fait signe que « ça… viendra ».", how: 'Demande pourquoi elle est arrivée ici.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'elle dit)', text: 'Secoue la tête : aucune allergie (cohérent avec le dossier).', how: 'Demande si elle est allergique à un médicament.' },

      // En mesurant
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', text: '36,7 °C' },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', text: '84 /min, irrégulier',
        meaning: "Irrégulier comme d'habitude (fibrillation atriale connue) : ce n'est pas un changement. À transmettre quand même." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', key: true, alert: true, text: '168/92 mmHg',
        meaning: "Plus élevée que d'habitude (138/78). Tu ne cherches pas à la faire baisser : tu la notes et tu la transmets, c'est le médecin qui décide." },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', text: '18 /min' },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', text: '96 % en air ambiant' },

      // En observant
      o_aspect: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
        text: "Éveillée, les yeux bien ouverts, elle te regarde. Le coin droit de sa bouche tombe, son visage est asymétrique.",
        how: 'Observe la résidente.',
        meaning: "Une asymétrie du visage chez une personne éveillée est un signe d'alerte. C'est un fait que tu vois, pas un diagnostic." },
      o_main: { section: 'observations', kind: 'deduire', label: 'Main droite', key: true, alert: true,
        text: "Sa main droite repose, immobile, sur le drap. Elle ne la bouge pas quand tu lui parles.", how: 'Observe la résidente.' },
      o_salive: { section: 'observations', kind: 'deduire', label: 'Salive', key: true, alert: true,
        text: "Un filet de salive coule au coin droit de la bouche.", how: 'Observe la résidente.',
        meaning: "Quand la bouche ne ferme pas bien, avaler peut devenir difficile : on ne donne rien à boire ni à manger (risque de fausse route)." },
      o_plateau: { section: 'observations', kind: 'deduire', label: 'Plateau', alert: true,
        text: "Sur le plateau : biscottes intactes, tasse de café renversée côté droit. Elle a lâché la tasse de la main droite.", how: 'Regarde le plateau du petit-déjeuner.' },
      o_canne: { section: 'risques', kind: 'deduire', label: 'Canne', text: 'Accrochée au montant du lit, à portée de main.', how: 'Regarde où se trouve la canne.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', text: 'Accrochée au montant du lit, côté droit : elle n\'a pas pu l\'utiliser avec sa main droite.', how: 'Regarde où se trouve la sonnette.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: 'Bon… jour…' },
      c_presentation: { text: "(Elle hoche la tête et sourit de travers.) « Mon… sieur… Mada… Moi… Mo… nique. »", logs: ['g_presentation'] },
      c_identite_q:   { text: "« Gi… rard. Mo… nique. Trois… mars… quarante-deux. Quatre-vingt… quatre ans. » (elle cherche ses mots, mais y arrive)", logs: ['g_identite'] },
      c_explication:  { text: '(Elle hoche la tête : elle a compris.)', logs: ['g_explication'] },
      c_accord:       { text: '(Elle hoche la tête et fait « oui » de la main gauche.)', logs: ['g_accord'] },
      c_intimite:     { text: '(Elle hoche la tête.)', logs: ['g_intimite'] },
      c_fin:          { text: '(Elle serre ta main de sa main gauche.) « Mer… ci. »' }
    }), {
      q_comment_allez: { text: "« Pas… bien. La main… » (elle montre sa main droite, cherche ses mots)", reveals: ['q_ressenti'] },
      q_motif:         { text: "(Elle fait un geste de la main gauche : « plus tard, plus tard ».)", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "« Tout… à l'heure. » (Elle montre sa tasse renversée et ne peut pas préciser.)", reveals: ['q_depuis'] },
      q_autre:         { text: '« La main… les mots… » (elle fait signe qu\'elle n\'y arrive pas)', reveals: ['q_ressenti', 'q_parole'] },

      q_douleur:      { text: '(Elle secoue la tête : non.)', reveals: ['q_douleur'] },
      q_respiration:  { text: '(Elle fait signe que ça va.)', reveals: ['q_resp'] },
      q_vertiges:     { text: '(Elle fait « non » de la tête.)', reveals: ['q_vertiges'] },
      q_nausees:      { text: '(Elle fait « non » de la tête.)', reveals: ['q_nausees'] },
      q_froid:        { text: '(Elle fait « non » de la tête.)', reveals: ['q_froid'] },

      q_alim:         { text: "« Un peu… café. » (elle montre la tasse renversée) « Pas… faim. »", reveals: ['q_alim'] },
      q_boisson:      { text: '« Café… un peu. »', reveals: ['q_boisson'] },
      q_urines:       { text: '(Elle fait signe que oui, comme d\'habitude.)', reveals: ['q_urines'] },
      q_selles:       { text: '(Elle hoche la tête.)', reveals: ['q_selles'] },

      q_mobilite:     { text: "« Pas… levée. Jambe… lourde. »", reveals: ['q_mobilite'] },
      q_chute:        { text: '(Elle fait « non » de la tête.)', reveals: ['q_chute'] },
      q_sommeil:      { text: '« Bien… dormi. »', reveals: ['q_sommeil'] },

      q_antecedents:  { text: "(Elle pose la main sur son cœur.) « Cœur… tension. »", reveals: ['q_atcd'] },
      q_traitements:  { text: "« Les… comprimés… » (elle hausse les épaules : elle ne retrouve pas les noms)", reveals: ['q_ttt'] },
      q_allergies:    { text: '(Elle secoue la tête : aucune allergie.)', reveals: ['q_allerg'] },

      q_moral:        { text: "(Les larmes lui montent aux yeux.) « Peur… »", reveals: ['q_moral'] },
      q_entourage:    { text: '« Isa… » (elle te montre la photo de sa fille sur la table de chevet)', reveals: ['q_entourage'] },
      q_orientation:  { text: "(Elle te regarde droit dans les yeux, montre du doigt le journal du jour sur la table, puis fait un geste d'impuissance : elle sait, mais elle ne trouve pas le mot.)", reveals: ['q_orientation'] },

      q_parole:       { text: "« Je… mots… » (elle hoche la tête : elle te comprend, mais les mots ne sortent pas)", reveals: ['q_parole'] },
      q_membres:      { text: "(Elle te montre sa main droite.) « Lourde… la tasse… tombée. » Elle sent aussi sa jambe droite plus lourde.", reveals: ['q_membres'] },
      q_vue:          { text: "« Un peu… flou. » Pas de vision double.", reveals: ['q_vue'] },
      q_tete:         { text: '(Elle secoue la tête : pas mal à la tête.)', reveals: ['q_tete'] },
      q_test_vite:    { text: "(Elle essaie.) Sourire : un seul côté de la bouche remonte, le droit reste tombant. Bras levés : le gauche tient, le droit retombe. Phrase : « Il… fé… bo… ma… ».", reveals: ['q_t_visage', 'q_t_bras', 'q_t_phrase'] },
      q_equipe:       { text: "(Karim, depuis la porte) « À 7 h 30, elle allait bien : elle m'a dit bonjour et elle a bu son café. Je suis repassé à 8 h 05 : elle ne parlait plus comme d'habitude, sa tasse était renversée sur le plateau. Je pensais que c'était la fatigue. »", reveals: ['q_equipe_heure'] }
    }),
    fallbackAnswer: '(Elle cherche ses mots, la bouche de travers, et fait un geste de la main : elle n\'arrive pas à répondre.)',
    notUnderstood: '(Elle te regarde, inquiète, et hoche la tête sans répondre.)',
    whoAreYou: '(Elle te regarde, étonnée, et hausse les épaules.)',

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, auto: [
      { id: 'g_vite', asked: ['q_test_vite'] },
      { id: 'g_heure', asked: ['q_equipe'] }
    ] }),

    narration: B.narration(patient, {
      enter: "Tu entres dans la chambre 11. Mme Girard est dans son lit, éveillée. Elle te regarde, mais quelque chose cloche : sa bouche est de travers et sa main droite ne bouge pas."
    }),

    constTable: B.constTable({ temp: '36,6 °C', fc: '74 /min, irrégulier', pa: '138/78 mmHg', fr: '16 /min', spo2: '97 %' }),

    objects: {
      patiente: { label: 'Observer Mme Girard', icon: '👵', reveals: ['o_aspect', 'o_main', 'o_salive'],
        narration: "Tu observes Mme Girard : elle est éveillée et te regarde. Le coin droit de sa bouche tombe, un filet de salive coule de ce côté, et sa main droite repose, immobile, sur le drap." },
      plateau: { label: 'Plateau du petit-déjeuner', icon: '☕', reveals: ['o_plateau'],
        narration: "Sur le plateau : les biscottes sont intactes et la tasse de café est renversée, côté droit. Elle a dû la lâcher de la main droite." },
      canne: { label: 'Canne', icon: '🦯', reveals: ['o_canne'],
        narration: 'La canne est accrochée au montant du lit, à portée de main.' },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: "La sonnette est accrochée au montant du lit, côté droit : avec sa main droite inerte, elle n'a pas pu l'utiliser." }
    },

    grid: B.grid({ p: patient, extra: [
      { id: 'g_vite', label: 'Tester le visage, le bras et la parole (sourire, lever les deux bras, répéter une phrase)',
        why: "Trois gestes simples que tout soignant peut faire en une minute. Un seul signe anormal brutal suffit à déclencher l'alerte.",
        ref: 'HAS : AVC, prise en charge précoce (2009), signes d\'alerte FAST' },
      { id: 'g_heure', label: "Chercher l'heure de début des signes (dernière fois vue normale) auprès de l'équipe",
        why: "L'heure de début décide des traitements possibles à l'hôpital : on la note de façon précise, ou on note la dernière fois où la personne était normale.",
        ref: 'HAS : AVC, prise en charge précoce (2009) : noter l\'heure exacte de survenue des symptômes · reconstituer l\'heure de la dernière fois vue normale avec l\'équipe : pratique usuelle, à confirmer dans ton cours' }
    ] }),

    alertSummary: "Pris un par un, ces signes pourraient passer pour de la fatigue : une résidente peu bavarde, qui a lâché sa tasse. Ensemble (bouche de travers, bras droit qui retombe, mots déformés, apparus d'un coup entre 7 h 30 et 8 h 05), ils sont l'alerte d'un possible AVC : visage, bras, parole. Tu ne poses pas de diagnostic et tu ne traites rien : tu repères, tu notes l'heure, tu ne donnes rien par la bouche, tu restes auprès d'elle et tu alertes l'infirmière tout de suite, qui appelle le 15 (si personne ne répond rapidement, tu appelles toi-même le 15 plutôt que d'attendre). Plus les secours sont prévenus tôt, plus les traitements possibles à l'hôpital sont nombreux.",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de Mme Girard ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: 'Elle est sans doute fatiguée : je note ce que j\'ai vu et je lui laisse finir son petit-déjeuner',
          unsafe: "Tu as jugé qu'il n'y avait rien à signaler alors que Mme Girard avait la bouche de travers, un bras qui retombe et un trouble de la parole apparus brutalement.",
          feedback: "Un visage de travers, un bras qui retombe et des mots déformés qui apparaissent d'un coup ne sont jamais de la simple fatigue. Lui laisser finir son petit-déjeuner serait en plus dangereux : elle pourrait faire une fausse route. Un étudiant ne décide pas seul de la gravité : il alerte." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière référente, mais cela peut attendre la fin de la matinée",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors que les signes d'un possible AVC étaient là : chaque minute compte.",
          feedback: "Devant ces signes, on n'attend pas : plus le délai est long, moins il reste de traitements possibles. On alerte tout de suite, en restant près de la résidente." },
        { id: 'urgence', pts: 10, verdict: 'good',
          label: "Urgence : j'alerte l'infirmière tout de suite, qui appellera le 15, et je reste auprès d'elle (si elle reste injoignable, j'appelle le 15 moi-même)",
          feedback: "Bon réflexe. Tu as repéré que visage, bras et parole sont touchés d'un coup, tu as pensé à l'heure de début et tu alertes l'infirmière sans quitter Mme Girard. C'est elle qui appellera le 15." },
        { id: 'quinze', pts: 5, verdict: 'avoid',
          label: "J'appelle le 15 moi-même, tout de suite, sans prévenir l'infirmière",
          feedback: "Ton réflexe d'urgence est le bon : il ne faut pas attendre. Mais en EHPAD, l'appel au 15 est fait par l'infirmière, qui a le dossier sous les yeux, connaît les traitements et décide de la suite. Ton rôle est de l'alerter immédiatement, en restant auprès de la résidente (appelle à l'aide par la sonnette ou fais venir un collègue). Si personne ne répond et qu'elle reste seule, ne perds pas de temps : l'appel au 15 est alors justifié." }
      ],
      actionsQ: "En attendant l'arrivée de Sophie, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'aide', v: 'good', label: "Appeler à l'aide (sonnette ou en faisant venir Karim) pour que l'infirmière arrive tout de suite, sans quitter Mme Girard",
          why: "Elle ne doit pas rester seule : l'alerte se fait sans la quitter, avec la sonnette ou en demandant à un collègue." },
        { id: 'rester', v: 'good', label: 'Rester près d\'elle, la rassurer, lui parler lentement et simplement',
          why: "Elle comprend tout et elle a peur. Des phrases courtes, un ton calme, une main posée sur son bras valide la rassurent." },
        { id: 'heure', v: 'good', label: "Noter l'heure exacte : dernière fois vue normale (7 h 30) et heure où tu as constaté les signes",
          why: "L'heure de début décide des traitements possibles à l'hôpital (HAS : noter l'heure exacte de survenue des symptômes)." },
        { id: 'bouche', v: 'good', label: 'Ne rien lui donner par la bouche : ni boisson, ni aliment, ni comprimé',
          why: "Quand le visage et la bouche sont touchés, avaler peut devenir difficile : risque de fausse route (règle de prudence, à confirmer avec le protocole du service)." },
        { id: 'position', v: 'good', label: "La laisser dans la position confortable où elle est, tête légèrement surélevée, sans la lever",
          why: "On évite de la mobiliser. La position définitive sera précisée par l'infirmière ou le médecin régulateur du SAMU." },
        { id: 'traitement', v: 'good', label: "Repérer son anticoagulant (rivaroxaban, dernière prise hier à 19 h) pour le transmettre aux secours",
          why: "Un anticoagulant change la prise en charge à l'hôpital : les secours doivent le savoir, avec l'heure de la dernière prise." },
        { id: 'surveiller', v: 'good', label: 'Surveiller en continu sa vigilance et sa parole, et noter tout changement avec l\'heure',
          why: "Si elle devient somnolente ou si les signes s'aggravent, il faut le dire immédiatement à l'infirmière et aux secours." },
        { id: 'attendre', v: 'danger', label: "Attendre 15 à 20 minutes pour voir si ça passe tout seul",
          why: "Des signes qui s'améliorent seuls peuvent revenir plus graves. Même s'ils disparaissent, il faut alerter : on ne perd pas de temps." },
        { id: 'aspirine', v: 'danger', label: "Lui donner un comprimé d'aspirine « pour fluidifier le sang »",
          why: "Un médicament ne se donne jamais sans prescription : un AVC peut venir d'un caillot ou d'un saignement, et l'aspirine aggraverait un saignement. En plus, elle prend déjà un anticoagulant." },
        { id: 'boire', v: 'danger', label: "Lui donner à boire ou son comprimé du matin (bisoprolol) avec un peu d'eau",
          why: "Avec la bouche touchée, boire ou avaler un comprimé expose à la fausse route (étouffement). Rien par la bouche en attendant les secours." },
        { id: 'lever', v: 'danger', label: 'La faire lever ou marcher pour voir si ses jambes tiennent',
          why: "Avec une faiblesse d'un côté du corps, la lever expose à une chute. Elle reste installée jusqu'à l'arrivée des secours." },
        { id: 'fille', v: 'avoid', label: "Appeler toi-même sa fille Isabelle pour la prévenir avant d'alerter l'infirmière",
          why: "La famille est prévenue par l'infirmière ou l'équipe, après l'alerte. Le premier appel est celui qui déclenche les secours." },
        { id: 'tension', v: 'avoid', label: 'Reprendre la tension plusieurs fois pour essayer de la faire baisser',
          why: "Tu ne traites pas la tension : tu la notes une fois, tu la transmets, et c'est le médecin qui décide. Chaque minute passée à la reprendre retarde l'alerte." }
      ]
    },

    call: {
      who: 'Sophie',
      intro: "Tu fais venir Karim pour qu'il reste auprès de Mme Girard et tu joins Sophie (poste de soins ou téléphone du service). Sophie décroche : « Oui, Sophie ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Va vite : des phrases courtes, comme tu les dirais à voix haute.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?', placeholder: "Bonjour Sophie, c'est … étudiant(e). Je suis chez …",
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies la résidente (nom, chambre)', ask: 'De quelle résidente parles-tu ?', re: [/girard/, /monique/, /chambre (11|onze)\b/, /\bch ?11\b/] },
            { id: 's_motif', w: 1, label: 'Tu dis pourquoi tu appelles : un trouble de la parole, le visage, le bras (un possible AVC)', ask: "Pourquoi m'appelles-tu ?",
              re: [/\bavc\b/, /accident vasculaire/, /parole/, /parle/, /mots/, /bouche/, /visage/, /bras/, /main/, /paralys/, /deficit/, /urgence/, /urgent/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Elle a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile (fibrillation atriale, hypertension…)', ask: 'Elle a quels antécédents ?',
              re: [/fibrillation/, /\bacfa\b/, /hypertension/, /\bhta\b/, /cholesterol/, /coeur/, /rythme/] },
            { id: 'a_ttt', w: 1, label: "Son anticoagulant (rivaroxaban) et l'heure de la dernière prise (hier soir)", ask: 'Elle prend un traitement qui fluidifie le sang ?',
              re: [/anticoag/, /rivaroxaban/, /xarelto/, /fluidifi/, /\baod\b/, /\bavk\b/, /sintrom/, /coumadine/, /previscan/] },
            { id: 'a_heure', w: 2, label: "L'heure de début : dernière fois vue normale à 7 h 30 (signes constatés à 8 h 05)", ask: 'Depuis quand ? À quelle heure c\'était normal ?',
              re: [/\b7 ?h ?30\b/, /\b7 30\b/, /\b8 ?h ?05\b/, /\b8 05\b/, /vue normale/, /derniere fois/, /dernier moment normal/, /heure (de )?(debut|survenue)/, /depuis (7|8)/, /a partir de/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : elle …, pression artérielle …',
          elements: [
            { id: 'e_signes', w: 2, label: 'Au moins 2 signes parmi : bouche de travers (visage), bras ou main droite qui retombe, trouble de la parole', ask: "Qu'est-ce que tu as remarqué chez elle ?",
              need: { min: 2, re: [/bouche/, /visage/, /sourire/, /asymetri/, /commissure/, /\bbras\b/, /\bmain\b/, /retombe/, /faible/, /lourd/, /paralys/, /parole/, /parle/, /\bmots\b/, /articul/, /deform/, /aphasi/] } },
            { id: 'e_const', w: 1, label: "Au moins 3 constantes avec leur valeur (36,7 °C · 84/min irrégulier · 168/92 · 18/min · 96 %)", ask: 'Tu as pris ses constantes ?',
              need: { min: 3, re: [/\b36 7\b/, /\b84\b/, /\b168 (sur )?92\b/, /\b18\b/, /\b96\b/] } },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (parlait normalement, tension 138/78…)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /avant/, /par rapport/, /subit/, /brutal/, /soudain/, /d un coup/, /tout a coup/, /\b138\b/] },
          ],
          warn: { re: [/demence/, /alzheimer/, /infarctus/, /tumeur/, /epilep/, /fatigu/, /caprice/, /fait semblant/], pen: 1,
            text: "Tu as nommé une autre maladie ou minimisé les signes. Reste sur ce que tu constates (valeurs, signes, heures). Tu peux évoquer une suspicion, mais c'est l'infirmière puis le médecin qui interprètent." }
        },
        { id: 'D', label: 'D · Demande', hint: "Qu'attends-tu de Sophie, et pour quand ?", placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 1, label: 'Tu demandes à Sophie de venir tout de suite', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /vienne/, /viendr/, /sur place/] },
            { id: 'd_samu', w: 2, label: "Tu demandes d'appeler le 15 / le SAMU", ask: 'Tu veux que je fasse quoi ?',
              re: [/\b15\b/, /samu/, /secours/, /pompiers/, /urgences?\b/, /appel/, /appeler/, /medecin/, /docteur/, /\bdr\b/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (tout de suite, maintenant)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /immediat/, /urgent/, /urgence/, /\bvite\b/, /rapidement/, /sans attendre/, /des que possible/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est très clair. J'arrive tout de suite et j'appelle le 15 : reste auprès d'elle, ne lui donne rien par la bouche, garde en tête l'heure : dernière fois vue normale 7 h 30. Prépare son dossier et la liste de ses traitements, avec la dernière prise du rivaroxaban.",
        mid: "D'accord, j'ai l'essentiel. J'arrive.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions, vite.',
        final: "Merci, j'ai ce qu'il me faut, j'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: "J'arrive, mais dis-moi toujours ce que tu attends de moi."
      },
      model: {
        S: "Bonjour Sophie, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 11 avec Mme Girard, 84 ans. Je t'appelle parce qu'elle a la bouche de travers, le bras droit qui retombe et des mots déformés, apparus d'un coup : je pense à un possible AVC.",
        A: "Elle a de la fibrillation atriale et de l'hypertension, et elle prend un anticoagulant, le rivaroxaban, dernière prise hier soir à 19 h. Elle était bien à 7 h 30 d'après Karim, et pas à 8 h 05.",
        E: "Ce matin : bouche de travers à droite, bras droit qui retombe quand elle les lève, mots déformés quand elle parle, mais elle est éveillée et elle comprend. Tension 168/92 (138/78 d'habitude), pouls 84 irrégulier comme d'habitude, température 36,7 °C, fréquence respiratoire 18, saturation 96 %. Elle bave un peu : je ne lui donne rien par la bouche.",
        D: "Je voudrais que tu viennes tout de suite et que tu appelles le 15. Je reste avec elle et je prépare son dossier."
      },
      aiFacts: "Patiente fictive : Mme Monique Girard, 84 ans, chambre 11, EHPAD, droitière. Antécédents : hypertension, fibrillation atriale, hypercholestérolémie. Traitements : rivaroxaban 15 mg le soir (dernière prise hier 19 h), bisoprolol 2,5 mg le matin (pas encore pris), atorvastatine 20 mg le soir. Habituellement : T 36,6 °C, pouls 74/min irrégulier, PA 138/78, FR 16/min, SpO2 97 %, bavarde, orientée. Ce matin à 8 h 10 : T 36,7 °C, pouls 84/min irrégulier, PA 168/92, FR 18/min, SpO2 96 %. Éveillée, comprend, mais mots déformés, coin droit de la bouche qui tombe, salive au coin droit, bras droit qui retombe, main droite lourde ayant lâché la tasse de café. Dernière fois vue normale : 7 h 30 (Karim) ; signes constatés à 8 h 05."
    },

    rx: {
      from: 'SAMU (15), médecin régulateur · consignes recueillies par Sophie',
      title: 'Consignes du SAMU (appel au 15)',
      stepName: 'Consignes du SAMU',
      nextLabel: 'les consignes du SAMU',
      intro: "Sophie a appelé le 15. Le médecin régulateur du SAMU lui donne des consignes, qu'elle te transmet pendant que vous restez auprès de Mme Girard. Lis-les attentivement : ce sont elles qui font foi.",
      note: "Consignes fictives, écrites pour l'entraînement. Dans la réalité, elles dépendent du médecin régulateur, de la situation et des protocoles de l'établissement.",
      lines: [
        { id: 'samu', icon: '🚑', t: "Une équipe de secours est envoyée. Le médecin régulateur oriente la résidente vers un service spécialisé dans les AVC (unité neuro-vasculaire) par le moyen le plus rapide." },
        { id: 'heure', icon: '⏱️', t: "Heure de début : dernière fois vue normale à 7 h 30, signes constatés à 8 h 05. Noter ces heures et les communiquer à l'équipe de secours." },
        { id: 'bouche', icon: '⛔', t: "Rien par la bouche : ni boisson, ni aliment, ni médicament, en attendant les secours (risque de fausse route)." },
        { id: 'position', icon: '🛏️', t: "Pas de lever. La laisser dans la position confortable où elle est, tête légèrement surélevée, et ne pas la mobiliser." },
        { id: 'surv', icon: '📈', t: "Surveillance continue jusqu'à l'arrivée des secours : vigilance, parole, force du bras, pouls, pression artérielle, saturation. Noter chaque mesure avec l'heure." },
        { id: 'anticoag', icon: '💊', t: "Anticoagulant : rivaroxaban, dernière prise hier à 19 h. Ne rien donner ce matin (bisoprolol compris) avant l'avis des urgences. Cette information est essentielle pour l'hôpital." },
        { id: 'dlu', icon: '📁', t: "Préparer le dossier de liaison d'urgence (DLU) : antécédents, traitements, allergies, personne à prévenir." },
        { id: 'famille', icon: '📞', t: "La fille, Isabelle, est prévenue par l'infirmière." },
        { id: 'glyc', icon: '🩸', t: "Glycémie capillaire à faire par l'infirmière, pour écarter une hypoglycémie qui peut ressembler à un AVC." }
      ]
    },

    written: {
      intro: "Il est 8 h 45. L'équipe de secours est arrivée et a emmené Mme Girard. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de la journée sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats).",
      rules: "Écris des faits observables, datés, sans jugement. Évite les formules vagues (« RAS », « fatiguée »). Mentionne l'heure quand tu la connais. Ici, les heures sont essentielles.",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : suspicion d\'AVC, trouble de la parole…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème précis (suspicion d\'AVC, trouble de la parole, faiblesse du bras)',
              re: [/\bavc\b/, /accident vasculaire/, /parole/, /langage/, /bras/, /deficit/, /paralys/, /visage/, /bouche/, /urgence/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : signes, valeurs, heures.', placeholder: 'Ex. : à 8 h 10, bouche de travers, bras droit qui retombe, mots déformés…', rows: 4, elements: [
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : visage, bras ou main droite, parole', need: { min: 2, re: [/bouche/, /visage/, /asymetri/, /\bbras\b/, /\bmain\b/, /retombe/, /faible/, /parole/, /\bmots\b/, /articul/, /deform/, /aphasi/] } },
            { id: 'w_heures', w: 1, label: 'Les heures : dernière fois vue normale (7 h 30) et constat des signes (8 h 05 / 8 h 10)', need: { min: 2, re: [/\b7 ?h ?30\b/, /\b7 30\b/, /\b8 ?h ?05\b/, /\b8 05\b/, /\b8 ?h ?10\b/, /\b8 10\b/, /vue normale/, /derniere fois/, /heure/] } },
            { id: 'w_const', w: 1, label: 'Au moins 3 constantes avec leur valeur', need: { min: 3, re: [/\b36 7\b/, /\b84\b/, /\b168 (sur )?92\b/, /\b18\b/, /\b96\b/] } },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel (parlait normalement, tension 138/78)', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /au lieu de/, /\b138\b/, /avant/] },
            { id: 'w_atcd', w: 1, label: "L'anticoagulant et la dernière prise (rivaroxaban, hier 19 h)", re: [/anticoag/, /rivaroxaban/, /xarelto/, /fluidifi/, /\b19 ?h\b/, /derniere prise/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiante/, /agacant/, /mauvaise volonte/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: "Ce que toi et l'équipe avez fait.", placeholder: 'Ex. : infirmière alertée à 8 h 15, 15 appelé, rien par la bouche…', rows: 4, elements: [
            { id: 'w_ide', w: 1, label: "L'infirmière référente a été alertée (qui, à quelle heure)", all: [/(sophie|\bide\b|infirmiere|infirmier|referente)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise)/] },
            { id: 'w_samu', w: 2, label: 'Le 15 / le SAMU a été appelé (par qui, à quelle heure)', re: [/\b15\b/, /samu/, /secours/, /smur/, /ambulance/, /pompiers/] },
            { id: 'w_soins', w: 1, label: 'Tes actions de soin : restée auprès d\'elle, rien par la bouche, pas de lever, surveillance', re: [/reste/, /rien (par|a) (la )?bouche/, /jeun/, /rien donne/, /pas (de )?lever/, /position/, /surveill/, /rassur/, /dlu/, /dossier de liaison/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: "Où en est la résidente après ces actions ? Qu'est-ce qui reste à faire ?", placeholder: 'Ex. : secours arrivés à …, transférée vers …, fille prévenue', rows: 3, elements: [
            { id: 'r_etat', w: 2, label: "L'état de la résidente et la prise en charge (secours arrivés, transfert)", re: [/secours/, /samu/, /smur/, /ambulance/, /transf/, /emmenee/, /parti/, /hopital/, /urgences?/, /unv/, /neuro/, /prise en charge/, /en attente/, /arrive/, /sans changement/, /inchange/, /stable/, /vigilance/] },
            { id: 'r_suite', w: 1, label: 'La suite : famille prévenue, DLU remis, nouvelles à demander', re: [/fille/, /isabelle/, /famille/, /prevenue/, /dlu/, /dossier de liaison/, /nouvelles/, /a suivre/, /a verifier/, /a rappeler/] }
          ] }
      ],
      model: {
        C: "Suspicion d'AVC : trouble de la parole et faiblesse du bras droit",
        D: "Dernière fois vue normale : 7 h 30 (aide-soignant). À 8 h 10 : résidente éveillée, comprend, mais mots déformés, coin droit de la bouche tombant, bras droit qui retombe quand elle lève les deux bras, main droite qui a lâché sa tasse. D'habitude elle parle normalement. T 36,7 °C, pouls 84/min irrégulier (habituel), PA 168/92 (habituel 138/78), FR 18/min, SpO2 96 %. Traitement : rivaroxaban, dernière prise hier à 19 h.",
        A: "Infirmière (Sophie) alertée à [heure], 15 appelé par l'infirmière à [heure]. Restée auprès de la résidente, rassurée, rien donné par la bouche, pas de lever, installée confortablement. Surveillance continue en attendant les secours. Dossier de liaison d'urgence préparé.",
        R: "Équipe de secours arrivée à [heure], résidente transférée vers [service]. Fille Isabelle prévenue par l'infirmière. À suivre : nouvelles de l'hôpital."
      },
      aiFacts: null
    }
  });
})();
