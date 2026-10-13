// data/sim_hopital.js — Simulation clinique : scénario HÔPITAL n° 6, M. Vasseur (détresse respiratoire, insuffisance cardiaque)
// Même structure que data/sim_moreau.js ; les briques communes viennent de data/sim_base.js.
// Particularités : chambre d'hôpital (rampe murale d'oxygène, scope sur pied, chariot de soins), actions DIRECTES sur le dessin
// (pas de menu « Agir » : on touche le lit, la prise d'oxygène, la sonnette, le patient) et scope à brancher (3 capteurs).
// ⚠ Patient et valeurs FICTIFS, à but pédagogique. Les protocoles du service et la prescription médicale priment.
// ⚠ Contenu à faire relire par ton formateur : chaque élément cite sa source ou précise qu'il est à confirmer.
// ⚠ L'étudiant ne pose pas de diagnostic : le scénario ne lui demande jamais de nommer la maladie ni de traiter.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'M.', nom: 'Vasseur', prenom: 'Henri', dob: '04/02/1955', dobMots: 'quatre février mille neuf cent cinquante-cinq', age: 71, chambre: 312, sexe: 'M', avatar: '👴', statut: 'patient' };
  // Constantes citées avec leur valeur (37,2 · 118 · 172/100 · 32 · 84) : la PA « 172/100 » ne compte pas deux fois
  const _nConst = n => [/\b37 2\b/, /\b118\b/, /\b172\b/, /\b32\b/, /\b84\b/].filter(re => re.test(n)).length;
  const T = B.tools({ p: patient, de: 'de M. Vasseur', temp: 37.2, fc: { rate: 118, rhythm: 'irrégulier' }, pa: [172, 100], fr: 32, spo2: 84, scope: true,
    alarms: ['SpO₂ basse', 'FR haute', 'FC haute'],
    scopeNote: "Le scope affiche les valeurs au moment où tu le branches, avant tout traitement. Les alarmes préviennent mais ne remplacent pas ton regard sur le patient : c'est à toi de repérer ce qui ne va pas et de prévenir l'infirmière." });

  // Actions directes (touche le dessin) : lit, prise d'oxygène, sonnette, patient
  const POS = ['assise', 'demi', 'bord', 'allongee', 'jambes', 'pls'];
  const POS_LAB = { assise: ['🪑', 'Assis dans le lit, le dos calé par les oreillers'], demi: ['🛏️', 'Demi-assis : dossier relevé (30 à 45°)'],
    bord: ['🦵', 'Assis au bord du lit, les jambes pendantes (je le soutiens)'], allongee: ['😴', 'Allongé à plat sur le dos'],
    jambes: ['🦶', 'Allongé, un oreiller sous les jambes (jambes en hauteur)'], pls: ['↪️', 'Position latérale de sécurité (PLS)'] };

  App.SimScenarios.push({
    id: 'hop_oap_6',
    title: 'Le souffle court de M. Vasseur',
    short: "À l'hôpital, tôt le matin, un patient de 71 ans hospitalisé pour le cœur n'arrive plus à respirer allongé. Le scope et l'oxygène sont dans la chambre : que fais-tu, et dans quel ordre ?",
    icon: '🏥',
    level: 3, levelLabel: 'Avancé',
    setting: 'Hôpital', semestre: 'S1', ue: ['B.3'], duration: '20 à 25 min',
    status: 'Version à valider avec ton formateur',
    direct: true,
    competences: [
      { n: 1,  label: "Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique : repérer les signes de gravité sans poser de diagnostic)" },
      { n: 3,  label: 'Réaliser des soins (installation, surveillance au scope, fréquence respiratoire et saturation)' },
      { n: 6,  label: 'Communiquer et conduire une relation dans un contexte de soins (rassurer une personne qui a peur de mourir)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe (alerte, SAED)" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions ciblées)' }
    ],
    sources: [
      { label: 'Ton cours B3 – CM9 : mesure de la FR, SpO2 et signes cutanés',
        note: "Fréquence respiratoire normale de l'adulte 12 à 20/min · SpO2 normale ≥ 94 % · signes d'alerte : tirage, cyanose, sueurs, polypnée. À confirmer dans ton cours." },
      { label: "Ton cours B3 – CM10 : position d'attente, oxygénothérapie",
        note: "Position assise ou demi-assise devant une difficulté respiratoire · l'oxygène est un médicament (prescription ou protocole du service ; réglage par l'infirmière) · surveillance de la saturation. À confirmer dans ton cours." },
      { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
        url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière (étape Décision)." },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
        note: "Objectifs du S1 : recueil structuré de données, repérage des signes d'aggravation, transmissions ciblées." },
      { label: 'Ce que ce scénario ne dit pas',
        note: "Le patient, les valeurs et les consignes du médecin sont inventés pour l'entraînement. Tu ne poses aucun diagnostic et tu ne traites rien : les causes, les examens et les médicaments relèvent du médecin et de l'infirmière. Les protocoles de ton service priment. Les repères cités sont à valider avec ton formateur." }
    ],

    patient,
    scene: { style: 'hopital', clock: { h: 6, m: 30 }, label: 'Chambre 312 : M. Vasseur est assis dans son lit, penché en avant, essoufflé',
      patient: { pos: 'assise', eyes: 'open', pale: true, sweat: true, male: true, gasp: true, cyan: true, gown: '#cfe0f3', hair: ['#e9ecef', '#c3c8d0'] },
      scope: { fc: 118, spo2: 84, pa: '172/100', fr: 32, alarms: ['SpO₂ basse', 'FR haute', 'FC haute'], irregular: true } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_poids', 'd_const_hab'],

    urgent: {
      facts: ['o_aspect', 'o_levres', 'o_tirage', 'q_dyspnee', 'q_orthopnee', 'o_crachats'],
      message: "⏱ Un patient qui manque d'air au repos, ne peut plus s'allonger, transpire et crache un liquide mousseux est une urgence : l'alerte ne doit pas traîner. Va à l'essentiel : installe-le assis, appuie sur la sonnette, reste près de lui, branche le scope. L'oxygène se met sur décision de l'infirmière."
    },

    intro: {
      heure: '6 h 30',
      texte: "Tu es en stage dans un service de médecine cardiologique, avec Claire, l'infirmière du secteur, joignable au poste de soins. Il est 6 h 30 : tu passes voir M. Vasseur, 71 ans, chambre 312, avant la relève. Il est dans son lit.",
      equipe: "Transmissions de la nuit : « Insuffisance cardiaque, hospitalisé depuis 3 jours, sous diurétiques. Nuit agitée, a beaucoup toussé. » Karim, aide-soignant : « Il refuse de se recoucher depuis 4 h, il m'a paru essoufflé. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, puis repère ce qui doit alerter. Dans cette chambre, tu agis directement sur le dessin : touche le chariot pour prendre un instrument, le scope pour le brancher, le lit pour installer le patient, la prise d'oxygène au mur, la sonnette, et le patient lui-même pour l'observer. Quand le souffle est en jeu, le temps compte : appelle à l'aide sans quitter M. Vasseur."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "M. Henri VASSEUR, né le 04/02/1955 (71 ans) · chambre 312 · bracelet d'identification au poignet." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'hospitalisation",
        text: "Hospitalisé depuis 3 jours en médecine cardiologique pour une insuffisance cardiaque décompensée (essoufflement, jambes gonflées, prise de poids de 3 kg). Traité par un diurétique en perfusion les deux premiers jours, relais par comprimés prévu ce matin." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: "Insuffisance cardiaque (le cœur pompe moins bien) · fibrillation atriale (rythme du cœur irrégulier) · hypertension artérielle · diabète de type 2 · ancien fumeur (arrêt il y a 15 ans). Pas de maladie respiratoire connue." },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Allergie à la pénicilline (éruption cutanée).' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: "Furosémide (diurétique, fait uriner) · bisoprolol (ralentit le cœur) · apixaban (anticoagulant, risque de saignement) · ramipril (tension) · metformine (diabète). Comprimés du matin : pas encore donnés aujourd'hui. Pas d'oxygène prescrit pour le moment." },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: "Autonome : marche seul, se lave seul. Fatigué et essoufflé depuis 2 jours à l'effort." },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: "Ancien chauffeur-routier, retraité. Parle volontiers du football. Sa fille Nadia est la personne à prévenir." },
      d_poids: { section: 'histoire', kind: 'dossier', label: 'Poids',
        text: "Poids d'entrée 81 kg, poids d'hier 78 kg, objectif de sortie 76 kg. La pesée quotidienne de 6 h n'a pas encore été faite ce matin." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles (hier)', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: "Température 36,8 °C · pouls 76/min, irrégulier · pression artérielle 136/80 mmHg · fréquence respiratoire 18/min · saturation 95 % en air ambiant.",
        meaning: "Sa saturation habituelle (95 %) est normale : un patient sans maladie pulmonaire connue qui passe à 84 % a un vrai problème d'oxygénation. Ce qui alerte, c'est l'écart avec son habituel." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
        text: "Parle par petits bouts de phrases : « Je… manque d'air… j'étouffe… ça a commencé… cette nuit. » Il est assis, penché en avant, les mains agrippées aux draps.",
        how: 'Demande-lui comment il se sent ce matin.',
        meaning: "Un patient qui ne peut plus finir ses phrases présente un changement net : c'est un signe d'alerte, à ne jamais mettre sur le compte de la fatigue." },
      q_dyspnee: { section: 'symptomes', kind: 'chercher', label: 'Essoufflement', key: true, alert: true,
        text: "Essoufflé même au repos, depuis cette nuit : « même sans bouger, je manque d'air ». Hier, il n'était essoufflé qu'en marchant.",
        how: 'Demande-lui s\'il respire bien.',
        meaning: "Un essoufflement qui apparaît au repos est un signe d'alerte : hier, il ne s'essoufflait qu'à l'effort." },
      q_orthopnee: { section: 'symptomes', kind: 'chercher', label: 'Position pour respirer', key: true, alert: true,
        text: "Il ne peut plus s'allonger : cette nuit, il a dormi avec trois oreillers, puis assis. « Dès que je m'allonge… j'étouffe. » Il refuse de se recoucher depuis 4 h.",
        how: 'Demande-lui s\'il arrive à s\'allonger ou comment il a dormi.',
        meaning: "Une gêne respiratoire qui oblige à rester assis (on parle d'orthopnée) est un signe d'alerte : on ne l'allonge surtout pas." },
      q_toux: { section: 'symptomes', kind: 'chercher', label: 'Toux et crachats', key: true, alert: true,
        text: "Toux depuis 2 h du matin. Il crache un liquide mousseux, légèrement rosé : « comme de la mousse… ».",
        how: 'Demande-lui s\'il tousse et s\'il crache.',
        meaning: "Des crachats mousseux, rosés, avec un essoufflement important sont un signe de gravité à transmettre tels quels (couleur, aspect). Tu décris ce que tu vois, tu ne poses pas de diagnostic." },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Depuis quand', key: true, alert: true,
        text: "Hier soir à 21 h, il était un peu essoufflé mais parlait normalement. Réveillé à 2 h par la toux et le manque d'air ; depuis 4 h, il reste assis ; c'est pire depuis 5 h 30.",
        how: 'Demande-lui depuis quand il se sent ainsi.',
        meaning: "L'évolution (hier soir correct, aggravation depuis 2 h, pire depuis 5 h 30) renseigne l'infirmière et le médecin sur la rapidité de l'aggravation." },
      q_palpit: { section: 'symptomes', kind: 'chercher', label: 'Cœur', key: true, alert: true,
        text: "« Mon cœur… bat très vite… ça cogne dans la poitrine. »",
        how: 'Demande-lui s\'il sent son cœur battre vite.',
        meaning: "Il sent son cœur s'emballer : à rapprocher du pouls mesuré (118/min) et de son habituel (76/min)." },
      q_oedemes: { section: 'symptomes', kind: 'chercher', label: 'Jambes gonflées',
        text: "Jambes et chevilles gonflées depuis 4 jours : ses chaussettes marquent la peau et ses chaussons sont devenus trop serrés.",
        how: 'Demande-lui si ses jambes sont gonflées.',
        meaning: "Des jambes gonflées (œdèmes) font partie du tableau de l'insuffisance cardiaque. Tu notes ce que tu vois et ce qu'il dit." },
      q_poids: { section: 'histoire', kind: 'chercher', label: 'Poids',
        text: "« Mon pantalon… me serre… depuis qu'on m'a changé… le traitement. » Pas pesé ce matin (pesée prévue à 6 h).",
        how: 'Demande-lui s\'il a pris du poids.' },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', text: "Pas de douleur dans la poitrine ; « un poids sur le thorax » seulement quand il est allongé. Pas d'autre douleur.", how: 'Demande-lui s\'il a mal quelque part.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', text: "La tête ne tourne pas. Il se sent seulement « fatigué à force de souffler ».", how: 'Demande-lui si la tête lui tourne.' },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: 'Pas de nausées ni de vomissements.', how: 'Demande-lui s\'il a des nausées.' },
      q_froid: { section: 'symptomes', kind: 'chercher', label: 'Chaud / froid', alert: true,
        text: "Sueurs froides depuis cette nuit : il a changé son tee-shirt trempé à 3 h. Pas de frissons, pas de fièvre.", how: 'Demande-lui s\'il a eu froid, chaud ou des sueurs.',
        meaning: "Des sueurs profuses avec une gêne respiratoire sont un signe de gravité, à décrire précisément (où, depuis quand)." },
      q_alim: { section: 'histoire', kind: 'chercher', label: 'Repas', text: "A peu mangé hier soir (plateau resté à moitié plein). Rien ce matin : manger l'essouffle. À jeun.", how: "Demande-lui ce qu'il a mangé ou bu." },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: "A bu un demi-verre d'eau cette nuit. Il est sous restriction d'eau et de sel (consigne du service).", how: 'Demande-lui s\'il a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', alert: true,
        text: "A très peu uriné depuis hier soir (environ un demi-verre), alors qu'il a eu son diurétique. Karim a noté la diurèse sur la feuille de surveillance.",
        how: 'Demande-lui s\'il urine normalement.',
        meaning: "Peu d'urines malgré le diurétique est un élément à transmettre à l'infirmière." },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande-lui s\'il est allé à la selle.' },
      q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements', text: "Ne s'est pas levé depuis 4 h : se mettre debout lui a coupé le souffle.", how: 'Demande-lui comment il se déplace.' },
      q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes', text: 'Pas de chute ni de coup.', how: 'Demande-lui s\'il est tombé récemment.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: "Nuit agitée : il a dormi assis, la toux et le manque d'air le réveillaient.", how: 'Demande-lui s\'il a bien dormi.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Très inquiet : « j'ai peur… de mourir ». Il serre le drap, le regard fixe.", how: 'Demande-lui comment est son moral.',
        meaning: "L'anxiété augmente la sensation d'essoufflement : rassure-le, parle lentement, reste près de lui." },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: "Sa fille Nadia l'appelle chaque soir : c'est elle qu'il faut prévenir.", how: 'Demande-lui si sa famille vient le voir.' },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', text: "Donne son nom et le jour de la semaine sans hésiter (lundi), mais seulement par mots isolés, car il manque d'air. Il est bien éveillé, anxieux.", how: 'Demande-lui quel jour nous sommes.' },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris', text: "Parle de « mes cachets pour le cœur » et de la perfusion des deux premiers jours. N'a pas encore pris ses comprimés du matin.", how: 'Demande-lui quels médicaments il prend.' },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: "Dit « le cœur… fatigué… la tension… le sucre » : cohérent avec le dossier.", how: 'Demande-lui quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "« Le cœur… essoufflé… les jambes gonflées » : raconte son entrée il y a 3 jours, en reprenant son souffle.", how: 'Demande-lui pourquoi il est hospitalisé.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'il dit)', text: "« La pénicilline… j'avais des boutons. » Cohérent avec le dossier.", how: 'Demande-lui s\'il est allergique à un médicament.' },
      q_equipe_heure: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", key: true, alert: true,
        text: "Karim : « À 4 h, il s'est assis et il a refusé de se recoucher. À 5 h 30, il parlait par petits bouts de phrases, il m'a demandé d'ouvrir la fenêtre et il a craché une mousse rosée. Ça m'a inquiété. »",
        how: "Interroge Karim, l'aide-soignant.",
        meaning: "L'aggravation s'est faite en quelques heures : à 4 h assis, à 5 h 30 phrases coupées et crachats mousseux." },

      // En mesurant (au scope ou avec les instruments du chariot)
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', text: '37,2 °C',
        meaning: "Normale (habituel 36,8 °C) : pas de fièvre. Tu la notes." },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true, text: '118 /min, irrégulier',
        meaning: "Beaucoup plus rapide que son pouls habituel (76/min) et irrégulier : le manque d'air et le cœur fatigué l'accélèrent. Le rythme se voit sur la courbe du scope." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', alert: true, text: '172/100 mmHg',
        meaning: "Plus haute que son habituel (136/80). Tu la notes et tu la transmets, sans chercher à la baisser." },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', key: true, alert: true, text: '32 /min',
        meaning: "Bien au-dessus de la norme de l'adulte (12 à 20/min, ton CM9) et de son habituel (18/min) : il respire très vite et il se fatigue." },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', key: true, alert: true, text: '84 % en air ambiant',
        meaning: "Très basse (habituel 95 %, norme ≥ 94 %). Tu notes la valeur et tu alertes : l'oxygène est un médicament, sa mise en route se décide avec l'infirmière." },

      // En observant
      o_aspect: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
        text: "Assis dans son lit, penché en avant, les mains agrippées aux draps. Il respire très vite, la bouche ouverte, et ne finit pas ses phrases. Il transpire abondamment.",
        how: 'Observe le patient.',
        meaning: "La posture penchée en avant, les sueurs et la respiration rapide sont des signes de gêne respiratoire importante. Ce sont des faits que tu vois, pas un diagnostic." },
      o_levres: { section: 'observations', kind: 'deduire', label: 'Lèvres et doigts', key: true, alert: true,
        text: "Lèvres et bouts des doigts bleutés. Ongles violacés.",
        how: 'Observe ses lèvres et ses doigts.',
        meaning: "La cyanose (coloration bleutée des extrémités et des muqueuses) est un signe cutané de détresse respiratoire (ton CM9)." },
      o_tirage: { section: 'observations', kind: 'deduire', label: 'Muscles de la respiration', key: true, alert: true,
        text: "À chaque inspiration, la peau se creuse entre les côtes et au-dessus de la clavicule, et les muscles du cou se tendent.",
        how: 'Observe sa respiration (thorax et cou).',
        meaning: "Un tirage intercostal ou sus-sternal est un signe d'alerte : il utilise tous ses muscles pour respirer (ton CM9)." },
      o_peau: { section: 'observations', kind: 'deduire', label: 'État cutané', key: true, alert: true,
        text: "Peau pâle, grisâtre, froide et moite au toucher (front et mains). Sueurs abondantes. Quelques marbrures violacées sur les genoux.",
        how: 'Touche et regarde sa peau (front, mains, genoux).',
        meaning: "Une peau pâle, froide, moite avec des marbrures est un signe de gravité à décrire précisément (couleur, température, humidité, endroits). Tu ne l'interprètes pas : tu la transmets." },
      o_oedemes: { section: 'observations', kind: 'deduire', label: 'Jambes et chevilles', alert: true,
        text: "Chevilles et mollets gonflés des deux côtés : quand tu appuies avec le doigt, un creux reste (œdème). Peau tendue et luisante.",
        how: 'Regarde ses jambes et ses chevilles (soulève la couverture).',
        meaning: "Des œdèmes des deux jambes sont à noter (où, depuis quand). Cela renseigne l'infirmière sur l'évolution." },
      o_bruits: { section: 'observations', kind: 'deduire', label: 'Bruits respiratoires', alert: true,
        text: "Sa respiration est bruyante : on entend un bruit humide, comme un bouillonnement, à chaque inspiration, et une toux grasse. Il tousse en se penchant.",
        how: 'Écoute sa respiration (sans stéthoscope).',
        meaning: "Tu décris ce que tu entends (bruit humide, bouillonnement, toux) ; l'auscultation avec le stéthoscope revient à l'infirmière ou au médecin." },
      o_crachats: { section: 'observations', kind: 'deduire', label: 'Crachats', key: true, alert: true,
        text: "Dans le haricot posé sur la table de chevet : des crachats mousseux, légèrement rosés, en quantité.",
        how: 'Regarde la table de chevet.',
        meaning: "L'aspect des crachats (mousseux, rosés) se décrit tel quel dans la transmission." },
      o_verre: { section: 'observations', kind: 'deduire', label: 'Table de chevet', text: "Un verre d'eau à moitié plein, le plateau du dîner à moitié mangé, un tee-shirt trempé de sueur plié au pied du lit.", how: 'Regarde la table de chevet.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', text: "La poire d'appel est accrochée au bord du lit, à portée de sa main. Il ne l'a pas utilisée.", how: 'Regarde où se trouve la sonnette.' },
      o_oxy: { section: 'risques', kind: 'deduire', label: 'Oxygène', text: "Prise d'oxygène murale derrière la tête du lit, débitmètre branché et réglé sur 0 : rien n'est en route. Un masque et des lunettes à oxygène sont rangés dans le tiroir.", how: "Regarde la prise d'oxygène au mur." },
      o_scope: { section: 'risques', kind: 'deduire', label: 'Scope', text: "Le scope est sur son pied à côté du lit, éteint, avec ses câbles : électrodes, brassard et capteur de saturation. Il n'est pas branché sur le patient.", how: 'Regarde le scope.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: '(Il lève la main.) « Bon… jour… »' },
      c_presentation: { text: "(Il lève la main.) « Ah… l'étudiant… Moi… Henri… Vasseur. » (il reprend son souffle entre les mots)", logs: ['g_presentation'] },
      c_identite_q:   { text: "« Vasseur… Henri. Quatre… février… cinquante-cinq. Soixante-et-onze… ans. » (il souffle entre les mots)", logs: ['g_identite'] },
      c_explication:  { text: '(Il hoche la tête.) « D\'accord… »', logs: ['g_explication'] },
      c_accord:       { text: '(Il fait « oui » de la tête, la main sur la poitrine.)', logs: ['g_accord'] },
      c_intimite:     { text: '(Il hoche la tête.) « Merci… »', logs: ['g_intimite'] },
      c_fin:          { text: '(Il lève le pouce.) « Merci… à tout… à l\'heure. »' }
    }), {
      q_comment_allez: { text: "« Ça… va pas… j'étouffe… depuis cette nuit. » (il reprend son souffle entre chaque mot)", reveals: ['q_ressenti'] },
      q_motif:         { text: "« Le cœur… » (il s'arrête pour souffler) « J'ai… les jambes… gonflées. »", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "« Depuis… deux heures du matin… et c'est pire… depuis tout à l'heure. »", reveals: ['q_depuis'] },
      q_autre:         { text: "« Le souffle… la toux… le cœur qui cogne… »", reveals: ['q_ressenti', 'q_dyspnee', 'q_palpit'] },

      q_douleur:      { text: "« Pas mal… dans la poitrine. Un poids… quand je m'allonge. »", reveals: ['q_douleur'] },
      q_respiration:  { text: "« Je manque… d'air… même assis. » (il tousse) « Et je crache… de la mousse… rose. »", reveals: ['q_dyspnee', 'q_toux'] },
      q_vertiges:     { text: "« Non… la tête ne tourne pas. Je suis… épuisé. »", reveals: ['q_vertiges'] },
      q_nausees:      { text: '(Il fait « non » de la tête.)', reveals: ['q_nausees'] },
      q_froid:        { text: "« Je transpire… depuis cette nuit… j'ai changé… mon tee-shirt. »", reveals: ['q_froid'] },

      q_alim:         { text: "« Pas fini… le dîner. Manger… ça m'essouffle. »", reveals: ['q_alim'] },
      q_boisson:      { text: "« Un demi-verre… cette nuit. On m'a dit… de peu boire. »", reveals: ['q_boisson'] },
      q_urines:       { text: "« Presque rien… depuis hier soir. » (il montre un demi-verre avec les doigts)", reveals: ['q_urines'] },
      q_selles:       { text: '(Il hoche la tête.)', reveals: ['q_selles'] },

      q_mobilite:     { text: "« Pas levé… depuis quatre heures… ça m'a coupé le souffle. »", reveals: ['q_mobilite'] },
      q_chute:        { text: '(Il fait « non » de la tête.)', reveals: ['q_chute'] },
      q_sommeil:      { text: "« Mal dormi… assis… la toux… le manque d'air. »", reveals: ['q_sommeil'] },

      q_antecedents:  { text: "« Le cœur… la tension… le sucre. Et j'ai fumé… avant. »", reveals: ['q_atcd'] },
      q_traitements:  { text: "« Mes cachets… pour le cœur. Pas encore… ceux du matin. »", reveals: ['q_ttt'] },
      q_allergies:    { text: "« La pénicilline… j'avais des boutons. »", reveals: ['q_allerg'] },

      q_moral:        { text: "« J'ai peur… de mourir. » (il serre le drap)", reveals: ['q_moral'] },
      q_entourage:    { text: "« Ma fille… Nadia. Elle appelle… tous les soirs. »", reveals: ['q_entourage'] },
      q_orientation:  { text: "« Vasseur… Henri. On est… lundi. » (il souffle entre chaque mot)", reveals: ['q_orientation'] },

      q_orthopnee:    { text: "« Je ne peux pas… m'allonger… j'étouffe. J'ai pris… trois oreillers… puis je me suis assis. »", reveals: ['q_orthopnee'] },
      q_oedemes:      { text: "« Mes jambes… elles sont… gonflées. Les chaussons… me serrent. »", reveals: ['q_oedemes'] },
      q_poids:        { text: "« Mon pantalon… me serre… On ne m'a pas… encore pesé. »", reveals: ['q_poids'] },
      q_palpit:       { text: "« Mon cœur… il cogne… très vite. »", reveals: ['q_palpit'] },
      q_equipe:       { text: "(Karim, depuis la porte) « À 4 h, il s'est assis et il a refusé de se recoucher. À 5 h 30, il parlait par petits bouts de phrases, il m'a demandé d'ouvrir la fenêtre et il a craché une mousse rosée. Ça m'a inquiété. »", reveals: ['q_equipe_heure'] }
    }),
    fallbackAnswer: '(Il fait un geste de la main et reprend son souffle : il n\'arrive pas à répondre.)',
    notUnderstood: '(Il te regarde, essoufflé, et hoche la tête sans répondre.)',
    whoAreYou: '(Il te regarde, étonné, et hausse les épaules en reprenant son souffle.)',

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, auto: [
      { id: 'g_resp_obs', facts: ['o_aspect', 'o_levres', 'o_tirage'] },
      { id: 'g_peau', facts: ['o_peau'] },
      { id: 'g_heure', asked: ['q_equipe'] }
    ] }),

    narration: B.narration(patient, {
      knock: 'Tu frappes à la porte et tu attends. Une voix essoufflée répond : « Entrez… ».',
      enter: "Tu entres dans la chambre 312. M. Vasseur est assis dans son lit, penché en avant. Tu entends sa respiration rapide et humide depuis la porte. Le scope est sur son pied à côté du lit, éteint ; la prise d'oxygène murale est derrière la tête du lit ; le chariot de soins est au pied du lit."
    }),

    constTable: B.constTable({ temp: '36,8 °C', fc: '76 /min, irrégulier', pa: '136/80 mmHg', fr: '18 /min', spo2: '95 % en air ambiant' }).map(r =>
      r.fact === 'm_spo2' ? Object.assign({}, r, { norm: "≥ 94 % (ton CM9) · < 90 % : hypoxémie importante" })
      : r.fact === 'm_fr' ? Object.assign({}, r, { norm: '12 à 20 /min (ton CM9) · polypnée > 20' }) : r),

    // Objets touchables sur le dessin (cas « direct » : tout se fait en touchant le dessin)
    objects: {
      obs_resp: { label: 'Regarder sa respiration', icon: '👁️', reveals: ['o_aspect', 'o_tirage'],
        narration: "Tu observes M. Vasseur : assis, penché en avant, les mains agrippées aux draps, la bouche ouverte. Il respire très vite et transpire abondamment. À chaque inspiration, la peau se creuse entre ses côtes et au-dessus de sa clavicule." },
      obs_peau: { label: 'Toucher sa peau', icon: '🤲', reveals: ['o_peau'],
        narration: "Tu poses le dos de ta main sur son front, puis tu prends sa main : la peau est pâle, grisâtre, froide et moite. Il y a des sueurs abondantes et quelques marbrures violacées sur ses genoux." },
      obs_levres: { label: 'Regarder lèvres et doigts', icon: '👄', reveals: ['o_levres'],
        narration: "Tu regardes ses lèvres et le bout de ses doigts : ils sont bleutés. Ses ongles sont violacés." },
      obs_jambes: { label: 'Regarder jambes et chevilles', icon: '🦵', reveals: ['o_oedemes'],
        narration: "Tu soulèves doucement la couverture : ses chevilles et ses mollets sont gonflés des deux côtés. Quand tu appuies avec le doigt, un creux reste dans la peau." },
      obs_bruits: { label: 'Écouter sa respiration', icon: '👂', reveals: ['o_bruits'],
        narration: "Tu écoutes sa respiration : un bruit humide, comme un bouillonnement, accompagne chaque inspiration. Il tousse, penché en avant." },
      table: { label: 'Table de chevet', icon: '🗄️', reveals: ['o_crachats', 'o_verre'],
        narration: "Sur la table de chevet : un haricot avec des crachats mousseux, légèrement rosés, un verre d'eau à moitié plein, le plateau du dîner à moitié mangé. Au pied du lit, un tee-shirt trempé de sueur." },
      o2mat: { label: "Prise d'oxygène et matériel", icon: '🫁', reveals: ['o_oxy'],
        narration: "Derrière la tête du lit, la prise d'oxygène murale a son débitmètre réglé sur 0 : rien n'est en route. Un masque et des lunettes à oxygène sont rangés dans le tiroir de la table de chevet." },
      scopeobs: { label: 'Regarder le scope', icon: '📟', reveals: ['o_scope'],
        narration: "Le scope est sur son pied, à côté du lit, éteint. Ses câbles sont enroulés : électrodes, brassard et capteur de saturation. Rien n'est branché sur M. Vasseur." },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: "La poire d'appel est accrochée au bord du lit, à portée de sa main. Il ne s'en est pas servi." }
    },

    // Actions directes sur le dessin : chaque élément ouvre ses choix sous le dessin
    sceneActs: {
      patiente: { ico: '🧑‍⚕️', title: 'Observer M. Vasseur', hint: "Touche ce que tu veux regarder ou faire. Pour lui parler, utilise l'onglet « Dialogue ».",
        opts: [
          { ico: '👁️', label: 'Regarder sa respiration (thorax, cou)', do: ['obs', 'obs_resp'] },
          { ico: '🤲', label: 'Toucher sa peau (front, mains) : chaleur, humidité', do: ['obs', 'obs_peau'] },
          { ico: '👄', label: 'Regarder ses lèvres et ses doigts (couleur)', do: ['obs', 'obs_levres'] },
          { ico: '🦵', label: 'Regarder ses jambes et ses chevilles', do: ['obs', 'obs_jambes'] },
          { ico: '👂', label: 'Écouter sa respiration (sans stéthoscope)', do: ['obs', 'obs_bruits'] },
          { ico: '🤝', label: 'Rester près de lui et le rassurer', do: ['reste'] }
        ] },
      lit: { ico: '🛏️', title: 'Le lit : où installes-tu M. Vasseur ?', hint: "Le dossier se relève avec la télécommande du lit. Choisis la position.",
        opts: POS.map(id => ({ ico: POS_LAB[id][0], label: POS_LAB[id][1], do: ['pos', id] })) },
      o2wall: { ico: '🫁', title: "Prise d'oxygène murale", hint: "L'oxygène est un médicament : mise en route sur prescription ou protocole du service, réglage par l'infirmière. Ici, tu t'entraînes : alerte Claire d'abord.",
        opts: [
          { ico: '👀', label: 'Regarder la prise et le matériel (débitmètre, masque, lunettes)', do: ['obs', 'o2mat'] },
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
      { id: 'g_resp_obs', label: "Observer la respiration : posture, sueurs, couleur des lèvres et des doigts, tirage",
        why: "Devant une difficulté respiratoire, ces signes se voient avant toute mesure : posture penchée en avant, cyanose, tirage intercostal ou du cou (ton CM9).",
        ref: 'UE B3 S1 : CM9, signes cliniques cutanés de détresse respiratoire' },
      { id: 'g_peau', label: "Observer l'état cutané : couleur, température, humidité de la peau, marbrures",
        why: "L'état cutané renseigne sur la gravité : une peau pâle, froide et moite avec des marbrures est un signe d'alerte à décrire précisément.",
        ref: 'UE B3 S1 : CM9, signes cutanés (à confirmer dans ton cours)' },
      { id: 'g_heure', label: "Chercher auprès de l'équipe comment la situation a évolué depuis hier soir",
        why: "L'évolution (depuis quand, à quelle vitesse) aide l'infirmière et le médecin à juger de la gravité.",
        ref: 'Pratique usuelle de recueil de données, à confirmer dans ton cours' }
    ] }),

    alertSummary: "Pris un par un, ces signes pourraient passer pour un simple rhume chez un patient qui tousse. Ensemble (essoufflement au repos, impossibilité de s'allonger, phrases coupées, lèvres bleutées, tirage, sueurs, peau pâle et froide, crachats mousseux rosés, fréquence respiratoire à 32, saturation à 84 % alors que son habituel est 95 %, pouls rapide et irrégulier à 118, tension à 172/100), ils sont l'alerte d'une détresse respiratoire aiguë chez un patient hospitalisé pour le cœur. Tu ne poses pas de diagnostic et tu ne traites rien : tu repères, tu l'installes assis (ou assis au bord du lit, jambes pendantes), tu restes auprès de lui, tu branches le scope pour surveiller, tu ne lui donnes ni boisson ni médicament, tu ne règles pas seul l'oxygène (c'est un médicament : mise en route sur prescription ou protocole du service, réglage par l'infirmière) et tu alertes l'infirmière tout de suite, qui préviendra le médecin.",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de M. Vasseur ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: "Il est essoufflé comme depuis 3 jours : je note ce que j'ai vu et je le laisse se reposer",
          unsafe: "Tu as jugé qu'il n'y avait rien de nouveau à signaler alors que M. Vasseur avait une saturation à 84 %, une fréquence respiratoire à 32, les lèvres bleutées et des crachats mousseux rosés.",
          feedback: "Un essoufflement au repos avec impossibilité de s'allonger, des lèvres bleutées, une saturation à 84 % et des crachats mousseux ne sont pas « son essoufflement habituel ». Le laisser se reposer serait dangereux. Un étudiant ne décide pas seul de la gravité : il alerte." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière, mais cela peut attendre la relève de 7 h",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors qu'il présentait une détresse respiratoire.",
          feedback: "Devant ces signes, on n'attend pas : une détresse respiratoire peut s'aggraver en quelques minutes. On alerte tout de suite, en restant près du patient." },
        { id: 'urgence', pts: 10, verdict: 'good',
          label: "Urgence : j'alerte l'infirmière tout de suite, qui préviendra le médecin, et je reste auprès de lui, assis, avec le scope",
          feedback: "Bon réflexe. Tu as regroupé les signes (essoufflement au repos, orthopnée, cyanose, tirage, sueurs, crachats mousseux, fréquence respiratoire et saturation anormales) et tu alertes l'infirmière sans quitter M. Vasseur. C'est elle qui préviendra le médecin." },
        { id: 'medecin', pts: 5, verdict: 'avoid',
          label: "J'appelle moi-même le médecin de garde, sans prévenir l'infirmière",
          feedback: "Ton réflexe d'urgence est bon : il ne faut pas attendre. Mais à l'hôpital, l'étudiant alerte d'abord l'infirmière du secteur, qui a le dossier sous les yeux, connaît les traitements et appelle le médecin. Ton rôle est de l'alerter immédiatement, en restant auprès du patient (appuie sur la sonnette ou fais venir Karim)." }
      ],
      actionsQ: "En attendant que Claire arrive, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'aide', v: 'good', label: "Appeler à l'aide (sonnette ou en faisant venir Karim) pour que l'infirmière arrive tout de suite, sans quitter M. Vasseur",
          why: "Il ne doit pas rester seul : l'alerte se fait sans le quitter, avec la sonnette ou en demandant à un collègue." },
        { id: 'position', v: 'good', label: "L'aider à rester assis ou demi-assis (dossier relevé à plus de 30°), ou assis au bord du lit, jambes pendantes, bien soutenu",
          why: "Devant une difficulté respiratoire, la position assise ou demi-assise facilite la respiration (ton CM10). Il est déjà penché en avant : on le soutient dans la position où il respire le mieux. À aucun moment on ne l'allonge." },
        { id: 'rester', v: 'good', label: 'Rester près de lui, le rassurer, lui parler lentement et calmement',
          why: "Il a peur de mourir, et l'anxiété augmente la sensation d'essoufflement. Des phrases courtes, un ton calme, une main posée sur l'épaule le rassurent." },
        { id: 'scope', v: 'good', label: "Brancher le scope (électrodes, brassard, capteur de saturation) et surveiller en continu sa fréquence cardiaque, sa saturation, sa tension et sa fréquence respiratoire, en notant l'heure",
          why: "Le scope surveille en continu et donne l'alerte si une valeur sort des seuils. Il ne remplace pas ton regard : tu continues à regarder le patient et à noter chaque mesure avec l'heure (ton CM9)." },
        { id: 'heure', v: 'good', label: "Noter l'évolution et les heures : essoufflé depuis 2 h, assis depuis 4 h, crachats mousseux depuis 5 h 30, peu d'urines",
          why: "Ces informations aident l'infirmière et le médecin à juger de la rapidité de l'aggravation." },
        { id: 'dossier', v: 'good', label: "Repérer ses antécédents (cœur, rythme irrégulier, diabète), son traitement (diurétique, anticoagulant), son allergie à la pénicilline et la personne à prévenir pour les transmettre",
          why: "Le médecin a besoin de l'histoire de l'insuffisance cardiaque, des traitements (anticoagulant : risque de saignement) et des allergies (pénicilline)." },
        { id: 'jeun', v: 'good', label: "Ne rien lui donner à manger ni à boire en attendant l'avis du médecin",
          why: "Manger et boire l'essoufflent, et avec une respiration très rapide le risque de fausse route augmente. Il est de plus sous restriction hydrique. Règle de prudence, à confirmer avec le protocole du service." },
        { id: 'o2prepa', v: 'good', label: "Préparer l'oxygène (masque, prise murale) pour l'infirmière et ne le mettre en route qu'à sa demande, au débit qu'elle indique",
          why: "L'oxygène est un médicament : mise en route sur prescription ou protocole du service, réglage par l'infirmière (ton CM10). Préparer le matériel fait gagner du temps sans prendre de risque." },
        { id: 'allonger', v: 'danger', label: "L'allonger à plat pour qu'il se repose",
          why: "À plat, le liquide qui encombre ses poumons remonte et il s'étouffe : une personne en détresse respiratoire ne s'allonge jamais à plat." },
        { id: 'jambes', v: 'danger', label: "Surélever ses jambes pour qu'il se sente mieux",
          why: "Plus de sang revient vers un cœur déjà fatigué : le liquide dans les poumons augmente. À éviter." },
        { id: 'o2seul', v: 'avoid', label: "Mettre l'oxygène en route toi-même, au débit que tu choisis, avant d'avoir alerté l'infirmière",
          why: "Son besoin d'oxygène est réel, mais l'oxygène est un médicament : on alerte d'abord l'infirmière, qui met en route sur prescription ou protocole et règle le débit. Tu peux préparer le matériel." },
        { id: 'attendre', v: 'danger', label: "Attendre 15 à 20 minutes pour voir si son souffle se calme",
          why: "Une détresse respiratoire peut s'aggraver en quelques minutes. Attendre, c'est laisser un souffle épuisé s'aggraver : on alerte sans perdre de temps." },
        { id: 'lever', v: 'danger', label: "Le faire se lever et marcher jusqu'aux toilettes pour qu'il « se dégourdisse »",
          why: "Avec une saturation à 84 % et une fréquence respiratoire à 32, marcher peut le faire désaturer davantage, provoquer un malaise ou une chute. Il reste installé tant que le médecin n'est pas là." },
        { id: 'ttt_matin', v: 'avoid', label: "Lui donner ses comprimés du matin (diurétique, bisoprolol…) pour « vider l'eau » en attendant",
          why: "Les médicaments se donnent sur prescription, à l'heure décidée par l'infirmière : en pleine détresse, c'est elle puis le médecin qui décident (le traitement peut changer, par exemple passer à la voie intraveineuse)." },
        { id: 'boire', v: 'danger', label: "Lui faire boire un grand verre d'eau pour calmer la toux",
          why: "Il est très essoufflé (32/min) et sous restriction hydrique : avaler dans ces conditions expose à la fausse route. Rien par la bouche en attendant l'avis du médecin." }
      ]
    },

    call: {
      who: 'Claire',
      intro: "Tu fais venir Karim pour qu'il reste auprès de M. Vasseur et tu joins Claire (poste de soins ou téléphone du service). Claire décroche : « Oui, Claire ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Va vite : des phrases courtes, comme tu les dirais à voix haute.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?', placeholder: "Bonjour Claire, c'est … étudiant(e). Je suis chez …",
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies le patient (nom, chambre)', ask: 'De quel patient parles-tu ?', re: [/vasseur/, /henri/, /chambre (312|trois cent douze)\b/, /\bch ?312\b/, /\b312\b/] },
            { id: 's_motif', w: 1, label: 'Tu dis pourquoi tu appelles : il a du mal à respirer (détresse respiratoire)', ask: "Pourquoi m'appelles-tu ?",
              re: [/essouffl/, /respir/, /souffle/, /detresse/, /etouff/, /manque d air/, /dyspnee/, /urgence/, /urgent/, /difficulte/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Il a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile : insuffisance cardiaque (rythme irrégulier, hospitalisé pour le cœur)', ask: 'Il a quels antécédents ?',
              re: [/insuffisan(ce|t) cardiaque/, /cardiaque/, /cardiopath/, /coeur/, /fibrillation/, /rythme irregulier/, /arythmie/, /\bicc\b/, /decompens/] },
            { id: 'a_ttt', w: 1, label: "Son traitement : diurétique (furosémide), anticoagulant, pas d'oxygène prescrit", ask: 'Il prend quoi comme traitement ?',
              re: [/diuretique/, /furosemide/, /lasilix/, /anticoagul/, /apixaban/, /eliquis/, /bisoprolol/, /traitement/, /pas d oxygene/, /sans oxygene/] },
            { id: 'a_depuis', w: 2, label: "L'évolution : essoufflé depuis cette nuit, ne peut plus s'allonger, pire depuis 5 h 30", ask: 'Depuis quand ? Il peut s allonger ?',
              re: [/cette nuit/, /depuis (2|deux|4|quatre|5|cinq) ?h/, /ne peut (plus|pas) s ?allonger/, /s allonger/, /assis (depuis|toute)/, /orthopn/, /aggrav/, /empir/, /de plus en plus/, /ce matin/, /depuis hier/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : il …, saturation …',
          elements: [
            { id: 'e_signes', w: 2, label: 'Au moins 2 signes parmi : essoufflé au repos, ne peut pas s\'allonger, lèvres bleutées, tirage, sueurs, peau pâle ou froide, crachats mousseux rosés', ask: "Qu'est-ce que tu as remarqué chez lui ?",
              need: { min: 2, re: [/essouffl/, /respire (vite|mal|difficile)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /violac/, /sueur/, /transpir/, /pale/, /froid/, /moite/, /marbr/, /penche/, /phrases/, /crachat/, /mousse/, /rose/, /s allonger/, /orthopn/] } },
            { id: 'e_const', w: 1, label: "Au moins 3 constantes avec leur valeur (37,2 °C · 118/min · 172/100 · 32/min · 84 %)", ask: 'Tu as pris ses constantes ?',
              test: n => _nConst(n) >= 3 },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (saturation habituelle 95 %, fréquence respiratoire 18/min, pouls 76)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b95\b/, /plus bas que/, /plus (essouffle|rapide)/, /avant/, /hier/] }
          ],
          warn: { re: [/infarctus/, /embolie/, /pneumonie/, /oedeme (aigu )?(du )?poumon/, /\boap\b/, /covid/, /grippe/, /asthme/, /fatigu/, /angoisse/, /anxie/, /caprice/, /fait semblant/], pen: 1,
            text: "Tu as nommé une maladie ou minimisé les signes. Reste sur ce que tu constates (valeurs, signes, heures). Tu peux évoquer une suspicion, mais c'est l'infirmière puis le médecin qui interprètent." }
        },
        { id: 'D', label: 'D · Demande', hint: "Qu'attends-tu de Claire, et pour quand ?", placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 1, label: 'Tu demandes à Claire de venir tout de suite', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /vienne/, /viendr/, /sur place/] },
            { id: 'd_medecin', w: 2, label: "Tu demandes de prévenir le médecin (médecin de garde)", ask: 'Tu veux que je fasse quoi ?',
              re: [/medecin/, /docteur/, /\bdr\b/, /interne/, /garde/, /avis medical/, /urgentiste/, /equipe medicale/] },
            { id: 'd_o2', w: 1, label: "Tu demandes un avis sur l'oxygène (prescription, mise en route)", ask: "Et pour l'oxygène ?",
              re: [/oxygen/, /\bo2\b/, /\bo 2\b/, /masque/, /lunettes/, /prescri/, /debit/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (tout de suite, maintenant)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /immediat/, /urgent/, /urgence/, /\bvite\b/, /rapidement/, /sans attendre/, /des que possible/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est très clair. J'arrive tout de suite et je préviens le médecin de garde : garde-le assis, reste auprès de lui, ne lui donne rien à boire ni à manger, ne règle pas l'oxygène sans mon accord, et continue à surveiller le scope. Prépare son dossier et sa liste de traitements.",
        mid: "D'accord, j'ai l'essentiel. J'arrive.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions, vite.',
        final: "Merci, j'ai ce qu'il me faut, j'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: "J'arrive, mais dis-moi toujours ce que tu attends de moi."
      },
      model: {
        S: "Bonjour Claire, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 312 avec M. Vasseur, 71 ans. Je t'appelle parce qu'il a beaucoup de mal à respirer : il est essoufflé au repos, avec les lèvres bleutées.",
        A: "Il est hospitalisé pour une insuffisance cardiaque, avec un rythme du cœur irrégulier. Il prend un diurétique et un anticoagulant, il n'a pas d'oxygène prescrit. Il est essoufflé depuis cette nuit, il ne peut plus s'allonger, et c'est pire depuis 5 h 30.",
        E: "Ce matin : il parle par petits bouts de phrases, il transpire, la peau est pâle et froide, la peau se creuse entre ses côtes quand il inspire, et il crache une mousse rosée. Fréquence respiratoire 32 (18 d'habitude), saturation 84 % (95 % d'habitude), pouls 118 irrégulier (76 d'habitude), tension 172/100, température 37,2 °C.",
        D: "Je voudrais que tu viennes tout de suite et que tu préviennes le médecin de garde. Peux-tu aussi me dire pour l'oxygène ? Je reste avec lui, installé assis, avec le scope."
      },
      aiFacts: "Patient fictif : M. Henri Vasseur, 71 ans, chambre 312, service de médecine cardiologique d'un hôpital. Antécédents : insuffisance cardiaque décompensée (hospitalisé depuis 3 jours), fibrillation atriale, hypertension, diabète de type 2. Traitements : furosémide, bisoprolol, apixaban, ramipril, metformine ; comprimés du matin pas encore donnés. Allergie à la pénicilline. Pas d'oxygène prescrit. Habituellement : T 36,8 °C, pouls 76/min irrégulier, PA 136/80, FR 18/min, SpO2 95 % en air ambiant. Ce matin à 6 h 30 : T 37,2 °C, pouls 118/min irrégulier, PA 172/100, FR 32/min, SpO2 84 % en air ambiant. Essoufflé au repos, ne peut pas s'allonger, phrases coupées, penché en avant, sueurs, lèvres bleutées, tirage, peau pâle froide et moite avec marbrures aux genoux, crachats mousseux rosés, œdèmes des chevilles, peu d'urines. Essoufflement depuis 2 h du matin, assis depuis 4 h, pire depuis 5 h 30."
    },

    rx: {
      from: 'Dr Morel, médecin de garde · consignes recueillies par Claire',
      title: 'Consignes du médecin de garde',
      stepName: 'Consignes du médecin',
      nextLabel: 'les consignes du médecin',
      intro: "Claire a prévenu le Dr Morel, médecin de garde, qui arrive dans la chambre quelques minutes plus tard. Il donne ses consignes à Claire, qui te les transmet pendant que vous restez auprès de M. Vasseur. Lis-les attentivement : ce sont elles qui font foi.",
      note: "Consignes fictives, écrites pour l'entraînement. Dans la réalité, elles dépendent du médecin, de la situation et des protocoles du service.",
      patientLine: 'M. Henri VASSEUR · 71 ans · chambre 312',
      lines: [
        { id: 'medecin', icon: '🩺', t: "Le Dr Morel examine le patient dans la chambre. Un avis cardiologique est demandé." },
        { id: 'position', icon: '🛏️', t: "Position assise ou demi-assise (dossier relevé à plus de 30°), jambes pendantes si le patient le supporte. Ne pas l'allonger, ne pas le faire marcher." },
        { id: 'oxy', icon: '🫁', t: "Oxygène au masque, mis en route par l'infirmière au débit prescrit, à adapter à la saturation. Ne règle aucun débit toi-même." },
        { id: 'diur', icon: '💉', t: "Un diurétique par voie intraveineuse est prescrit et sera administré par l'infirmière. Ne pas donner les comprimés du matin." },
        { id: 'ecg', icon: '🫀', t: "ECG 12 dérivations tout de suite.", ecg: true },
        { id: 'bio', icon: '🩸', t: "Prise de sang en urgence (bilan cardiaque, ionogramme, fonction rénale) et gaz du sang artériel : prélèvements réalisés par l'infirmière ou le médecin, pas par l'étudiant." },
        { id: 'surv', icon: '📈', t: "Scope en continu ; noter la fréquence cardiaque, la saturation, la tension et la fréquence respiratoire toutes les 15 minutes, avec l'heure, et prévenir tout de suite si cela change. Mesurer et noter la diurèse." },
        { id: 'jeun', icon: '⛔', t: "À jeun, rien à boire en attendant l'avis. Les autres médicaments du matin ne sont pas donnés en attendant." },
        { id: 'allergie', icon: '⚠️', t: "Allergie à la pénicilline : à signaler dans toute prescription." },
        { id: 'famille', icon: '📞', t: "Sa fille, Nadia, est prévenue par l'infirmière." }
      ],
      ecgCtx: {
        patient: { nom: 'VASSEUR', prenom: 'Henri', dn: '04/02/1955', age: 71 },
        rate: 118,
        situation: "Le Dr Morel a prescrit un ECG 12 dérivations à M. Vasseur (pouls irrégulier à 118/min). Claire te demande de le réaliser pendant qu'elle prépare le diurétique. Elle reste à côté de toi : en 1re année, un geste technique se fait toujours sous la supervision d'un soignant."
      }
    },

    written: {
      intro: "Il est 7 h 20. Le médecin est passé, le traitement est en cours et M. Vasseur respire un peu mieux, toujours assis. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de jour sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats).",
      rules: "Écris des faits observables, datés, sans jugement ni diagnostic. Évite les formules vagues (« RAS », « fatigué »). Mentionne l'heure quand tu la connais. Décris la peau, les crachats et la respiration avec des mots simples (couleur, aspect, bruit).",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : détresse respiratoire, essoufflement au repos…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème précis (détresse respiratoire, essoufflement, difficulté à respirer)',
              re: [/essouffl/, /respir/, /detresse/, /dyspnee/, /hypox/, /saturation/, /souffle/, /orthopn/, /manque d air/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : signes, valeurs, heures.', placeholder: 'Ex. : à 6 h 30, essoufflé au repos, lèvres bleutées, FR 32, SpO2 84 %…', rows: 4, elements: [
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : essoufflement au repos, ne peut pas s\'allonger, lèvres bleutées, tirage, sueurs, peau pâle ou froide, crachats mousseux rosés', need: { min: 2, re: [/essouffl/, /respire (vite|mal)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /sueur/, /transpir/, /pale/, /froid/, /moite/, /marbr/, /crachat/, /mousse/, /rose/, /s allonger/, /orthopn/, /penche/] } },
            { id: 'w_const', w: 1, label: 'Au moins 3 constantes avec leur valeur (37,2 · 118 · 172/100 · 32 · 84 %)', test: n => _nConst(n) >= 3 },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel (saturation habituelle 95 %, FR 18/min, pouls 76)', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b95\b/, /au lieu de/, /avant/, /hier/] },
            { id: 'w_depuis', w: 1, label: "L'évolution : essoufflé depuis 2 h, assis depuis 4 h, pire depuis 5 h 30", re: [/deux heures/, /\b2 ?h/, /\b4 ?h/, /\b5 ?h/, /cette nuit/, /aggrav/, /empir/, /de plus en plus/, /depuis/, /ce matin/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiant/, /agacant/, /mauvaise volonte/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: "Ce que toi et l'équipe avez fait.", placeholder: 'Ex. : infirmière alertée à …, installé assis, scope branché…', rows: 4, elements: [
            { id: 'w_ide', w: 1, label: "L'infirmière (Claire) a été alertée (qui, à quelle heure)", all: [/(claire|\bide\b|infirmiere|infirmier)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise|sonnette)/] },
            { id: 'w_med', w: 2, label: 'Le médecin a été prévenu (par qui, à quelle heure)', re: [/medecin/, /docteur/, /\bdr\b/, /morel/, /garde/, /interne/] },
            { id: 'w_soins', w: 1, label: "Tes actions de soin : installé assis ou demi-assis, resté auprès de lui, scope branché, rien par la bouche, oxygène à la demande de l'infirmière", re: [/assis/, /demi assis/, /redress/, /installe/, /reste/, /surveill/, /scope/, /rassur/, /rien (par|a) (la )?bouche/, /jeun/, /oxygene/, /masque/, /\bo2\b/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: "Où en est le patient après ces actions ? Qu'est-ce qui reste à faire ?", placeholder: 'Ex. : médecin venu à …, traitement en cours, respire un peu mieux, surveillance à poursuivre', rows: 4, elements: [
            { id: 'r_etat', w: 2, label: "L'état du patient après les soins (respire un peu mieux, saturation, toujours assis)", re: [/mieux/, /amelior/, /moins essouffle/, /sans changement/, /inchange/, /stable/, /toujours/, /aggrav/, /satur/, /\b9[0-9] ?%?/, /oxygene/, /calme/, /apaise/] },
            { id: 'r_suite', w: 1, label: 'La suite : surveillance au scope, ECG et prise de sang, fille prévenue', re: [/scope/, /surveillance/, /a poursuivre/, /a surveiller/, /ecg/, /prise de sang/, /bilan/, /fille/, /nadia/, /famille/, /prevenu/, /a suivre/, /prochaine/, /toutes les/] }
          ] }
      ],
      model: {
        C: "Détresse respiratoire : essoufflement au repos, ne peut pas s'allonger",
        D: "À 6 h 30 : patient assis, penché en avant, phrases coupées, lèvres bleutées, tirage intercostal, sueurs, peau pâle, froide et moite, marbrures aux genoux, crachats mousseux rosés, chevilles gonflées. Essoufflé depuis 2 h, assis depuis 4 h, pire depuis 5 h 30. FR 32/min (18 d'habitude), SpO2 84 % en air ambiant (95 % d'habitude), pouls 118/min irrégulier (76 d'habitude), PA 172/100 (136/80 d'habitude), T 37,2 °C.",
        A: "Infirmière (Claire) alertée à [heure] par la sonnette. Resté auprès du patient, rassuré, installé assis, scope branché, rien donné par la bouche, aucun débit d'oxygène réglé sans l'accord de l'infirmière. Médecin de garde prévenu par l'infirmière à [heure]. ECG et prise de sang à la demande du médecin.",
        R: "Médecin venu à [heure], traitement en cours par l'infirmière. À 7 h 20 : respire un peu mieux, toujours assis, saturation à [valeur] sous oxygène. Surveillance au scope et constantes toutes les 15 min à poursuivre, diurèse à noter. Fille prévenue par l'infirmière."
      },
      aiFacts: null
    }
  });
})();
