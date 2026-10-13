// data/sim_roux.js — Simulation clinique : scénario EHPAD n° 2, M. Roux (la chute que personne n'a signalée)
// Même structure que data/sim_ehpad.js (Mme Martin). Les briques communes viennent de data/sim_base.js.
// ⚠ Patient et valeurs FICTIFS, à but pédagogique. Les protocoles de l'établissement priment.
// ⚠ Contenu à faire relire par ton formateur : chaque valeur cite sa source dans `ref`.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'M.', nom: 'Roux', prenom: 'Marcel', dob: '14/05/1938', dobMots: 'quatorze mai mille neuf cent trente-huit', age: 88, chambre: 7, sexe: 'M', avatar: '👴' };
  const T = B.tools({ p: patient, de: 'de M. Roux', temp: 36.8, fc: { rate: 98, rhythm: 'irrégulier' }, pa: [152, 88], fr: 18, spo2: 96,
    douleur: { val: 4, says: "« Je dirais 4… quand je ne bouge pas. Si je bouge, c'est bien pire. »", noted: 'Douleur : 4/10 au repos, hanche droite' } });
  const ALT = { found: ['o_deamb', 'o_jambe', 'o_ecchymose', 'q_equipe_nuit'], asked: ['q_rassure'] };

  App.SimScenarios.push({
    id: 'ehpad_chute_cachee_2',
    title: 'La chute de M. Roux',
    short: "Tu fais le bilan du matin d'un résident de 88 ans qui dit avoir « juste mal dormi ». Les transmissions de la nuit disent « RAS ». À toi de voir si c'est vrai.",
    icon: '🛏️',
    level: 2, levelLabel: 'Intermédiaire',
    setting: 'EHPAD', semestre: 'S1', ue: ['B.3'], duration: '15 à 20 min',
    status: 'Version à valider avec ton formateur',
    competences: [
      { n: 1,  label: 'Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique)' },
      { n: 3,  label: 'Réaliser des soins (surveillance, mesures, soins relationnels)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions)' }
    ],
    sources: [
      { label: 'HAS : « Chutes », fiche repère, volet EHPAD (juillet 2016)',
        url: 'https://www.has-sante.fr/upload/docs/application/pdf/2023-04/fiche_repere_chutes_volet_ehpad_juillet_2016.pdf',
        note: "Signes d'alerte (antécédent de chute, ecchymoses, troubles de l'équilibre) et facteurs de risque : levers nocturnes, aide technique ou chaussures inadaptées, polymédication. La fiche porte sur le repérage et la prévention ; elle ne détaille pas la conduite à tenir après une chute." },
      { label: 'Cours de traumatologie : la fracture du col du fémur (infirmiers.com)',
        url: 'https://www.infirmiers.com/etudiants/cours-et-tests/cours-traumatologie-la-fracture-du-col-du-femur',
        note: "Signes d'alerte décrits : douleur de l'aine, membre inférieur raccourci avec le pied tourné vers l'extérieur, impossibilité de décoller le pied. Le jeûne et les antalgiques avant transfert dépendent de la prescription et du protocole du service (non précisés dans ce cours)." },
      { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
        url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière référente (étape Décision)." },
      { label: 'Guide du stage infirmier en EHPAD (Réussis ton IFSI : ta page de cours)',
        url: 'https://app.reussistonifsi.fr/cours/ehpad-2',
        note: 'Résidents accueillis, risques à prévenir (dont les chutes), rôle de l\'infirmier(e), vocabulaire du stage (IDEC, MT, PAP…). Page réservée aux abonnés.' },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
        note: 'Objectifs du S1 : recueil structuré de données, entretien clinique débutant, repérage des signes d\'aggravation, transmissions ciblées.' }
    ],

    patient,
    scene: { clock: { h: 7, m: 30 }, label: 'Chambre 7 : M. Roux est dans son lit',
      patient: { eyes: 'open', pale: false, male: true, grimace: true, gown: '#a9cdf0', hair: ['#e9ecef', '#c3c8d0'] } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_chute_dossier', 'd_habituel', 'd_const_hab'],

    intro: {
      heure: '7 h 30',
      texte: "Tu es en stage dans un EHPAD, avec Sophie, l'infirmière référente, joignable au poste de soins. Ce matin, tu fais le bilan de M. Roux, résident de la chambre 7, avant sa toilette. Tu disposes d'environ vingt minutes.",
      equipe: "Transmissions de la nuit : « Nuit calme, RAS. » Karim, aide-soignant : « Il n'a pas voulu son petit-déjeuner, il dit qu'il a juste mal dormi. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, puis repère ce qui doit alerter. Un résident peut minimiser ce qui lui est arrivé : observe autant que tu écoutes."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "M. Marcel ROUX, né le 14/05/1938 (88 ans) · chambre 7 · bracelet d'identification au poignet." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'entrée",
        text: "Entrée en EHPAD il y a 5 mois, après le décès de son épouse et une perte d'autonomie à domicile. Vit en chambre seule." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: 'Hypertension artérielle · fibrillation atriale · arthrose des genoux · cataracte opérée · une chute à domicile en 2025 (sans fracture).' },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Aucune allergie connue (selon le dossier).' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: 'Apixaban (Eliquis®) 2,5 mg, un anticoagulant : 1 comprimé matin et soir (dernière prise hier à 20 h) · Périndopril 5 mg : 1 comprimé le matin · Paracétamol 1 g si douleur, maximum 3 g par 24 h (prescription « si besoin »).' },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: 'GIR 3 : marche avec déambulateur, toilette avec aide partielle, mange seul. Se lève seul la nuit pour aller aux toilettes (levers nocturnes fréquents).' },
      d_chute_dossier: { section: 'autonomie', kind: 'dossier', label: 'Chutes (dossier)',
        text: "Aucune chute signalée depuis l'entrée. Transmissions de la nuit : « RAS »." },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: 'Réservé et poli, il « ne veut pas déranger ». Bon appétit, participe à l\'atelier jardinage. Son fils Pascal vient le samedi.' },
      d_equipe: { section: 'psychosocial', kind: 'dossier', label: 'Équipe et contacts',
        text: "Infirmière référente : Sophie (poste de soins) · aide-soignant : Karim · médecin traitant (MT) : Dr Lambert, joignable par l'infirmière." },
      d_pap: { section: 'autonomie', kind: 'dossier', label: "Projet d'accompagnement personnalisé (PAP)",
        text: "Maintenir la marche avec le déambulateur, prévenir les chutes (veilleuse la nuit, sonnette à portée), participer à l'atelier jardinage." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: 'Température 36,6 °C · pouls 72/min, irrégulier (fibrillation atriale connue) · pression artérielle 134/76 mmHg · fréquence respiratoire 16/min · saturation 96 % · poids 58 kg (il y a 15 jours).',
        meaning: "Ces valeurs servent de point de comparaison : une constante peut être « normale » en théorie et pourtant très différente de l'habituel de la personne." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti',
        text: "Se dit « un peu fatigué », préfère rester au lit ce matin.", how: 'Demande-lui comment il se sent ce matin.' },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', key: true, alert: true,
        text: "Au repos, une douleur dans la hanche et l'aine droites ; elle devient très forte dès qu'il bouge (« ça tire »).",
        how: "Demande-lui s'il a mal quelque part.",
        meaning: "Une douleur de la hanche ou de l'aine qui empêche de bouger est un signe d'alerte : tu ne mobilises pas la zone douloureuse et tu alertes." },
      q_deni: { section: 'histoire', kind: 'chercher', label: 'Première réponse',
        text: "Dit d'abord qu'il n'est pas tombé et qu'il a « juste mal dormi ».", how: 'Demande-lui s\'il est tombé ou ce qui s\'est passé cette nuit.' },
      q_nuit_chute: { section: 'histoire', kind: 'chercher', label: 'La chute de la nuit', key: true, alert: true,
        text: "Il a fini par raconter : vers 3 h, en revenant des toilettes, il a glissé près de la porte de la salle d'eau et est tombé sur le côté droit. Il est resté un moment assis par terre, puis il a réussi à se remettre au lit (un lit bas), avec beaucoup de mal, en se tirant avec les bras. Il n'a pas sonné.",
        how: "Observe d'abord la chambre (déambulateur, chaussons), puis mets-le en confiance : « personne ne va vous gronder ».",
        meaning: "Une chute de nuit non signalée est une discordance avec les transmissions (« RAS ») et le dossier (« aucune chute ») : c'est l'information la plus importante à transmettre." },
      q_peur: { section: 'psychosocial', kind: 'chercher', label: "Pourquoi il n'a pas appelé", key: true, alert: true,
        text: "N'a pas sonné pour ne pas déranger les soignantes de nuit, et par peur d'être « envoyé à l'hôpital ».",
        how: "Demande-lui pourquoi il n'a pas sonné, avec bienveillance.",
        meaning: "Une personne âgée peut cacher une chute par peur de déranger ou d'être hospitalisée. Une attitude calme, sans reproche, aide à obtenir la vérité." },
      q_choc: { section: 'histoire', kind: 'chercher', label: 'Choc à la tête', key: true, alert: true,
        text: "Dit ne pas s'être cogné la tête (« juste mon côté »). Il prend un anticoagulant : information à transmettre, à faire vérifier.",
        how: 'Demande-lui s\'il s\'est cogné la tête.',
        meaning: "Sous anticoagulant, un choc à la tête après une chute est à rechercher et à transmettre, même si la personne dit que ça va." },
      q_mouvement: { section: 'autonomie', kind: 'chercher', label: 'Mobilité', alert: true,
        text: "Ne peut pas bouger la jambe droite sans douleur vive. Ne s'est pas levé depuis cette nuit.",
        how: 'Demande-lui s\'il peut bouger les jambes ou se lever.' },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Début des troubles',
        text: "Depuis cette nuit, vers 3 h du matin.", how: 'Demande depuis quand il a mal, quand cela a commencé.' },
      q_equipe_nuit: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", alert: true,
        text: "Karim : la veilleuse de la salle d'eau était restée allumée au passage de 5 h, et le système d'appel n'a enregistré aucun appel de la chambre cette nuit.",
        how: 'Interroge Karim, l\'aide-soignant.' },
      q_alim: { section: 'histoire', kind: 'chercher', label: 'Alimentation', text: "N'a presque rien pris au petit-déjeuner (« pas faim »).", how: 'Demande s\'il a mangé.' },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: 'A bu quelques gorgées d\'eau cette nuit.', how: 'Demande s\'il a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', text: "N'a pas uriné depuis 3 h : « je n'ai pas pu me lever ». Pas de brûlure.", how: 'Demande s\'il urine normalement.' },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande s\'il est allé à la selle.' },
      q_resp: { section: 'symptomes', kind: 'chercher', label: 'Respiration', text: 'Respire bien, ne tousse pas.', how: 'Demande s\'il respire bien.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', text: "Pas de vertiges, pas de malaise.", how: 'Demande si la tête lui tourne.' },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: 'Pas de nausée ni de vomissement.', how: 'Demande s\'il a des nausées.' },
      q_froid: { section: 'symptomes', kind: 'chercher', label: 'Froid, frissons', text: 'Pas de frissons, pas de fièvre.', how: 'Demande s\'il a eu froid.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: 'A mal dormi, réveillé par la douleur.', how: 'Demande s\'il a bien dormi.' },
      q_chute_dit: { section: 'autonomie', kind: 'chercher', label: 'Chutes (ce qu\'il dit)', text: "Dit d'abord ne pas être tombé récemment (« la dernière, c'était chez moi »).", how: 'Demande s\'il est tombé récemment.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Un peu honteux de s'être « laissé aller » ; ne veut pas qu'on s'inquiète.", how: 'Demande comment est son moral.' },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: 'Son fils Pascal vient le samedi ; il ne veut pas l\'inquiéter.', how: 'Demande si sa famille vient le voir.' },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', key: true,
        text: 'Donne la bonne date et le bon lieu : orienté dans le temps et l\'espace.',
        how: 'Demande-lui quel jour nous sommes et où il se trouve.',
        meaning: "Il n'est pas confus : c'est une donnée à transmettre, car une confusion nouvelle après une chute serait un autre signe d'alerte." },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris', key: true, alert: true,
        text: 'Un comprimé pour le cœur matin et soir, un pour la tension le matin. Pris hier à 20 h, pas encore ce matin.',
        how: 'Demande quels médicaments il prend et s\'il les a pris.',
        meaning: "L'heure de la dernière prise d'un anticoagulant est une information utile au médecin après une chute." },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: 'Cite le cœur, la tension et ses genoux : cohérent avec le dossier.', how: 'Demande quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "Raconte l'arrivée après le décès de sa femme ; se plaît « à peu près ».", how: 'Demande pourquoi il est arrivé ici.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'il dit)', text: 'Aucune allergie : cohérent avec le dossier.', how: 'Demande s\'il est allergique à un médicament.' },

      // En mesurant
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', text: '36,8 °C' },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true, text: '98 /min, irrégulier',
        meaning: "Plus rapide que son pouls habituel (72/min). La douleur peut accélérer le pouls. Le rythme irrégulier est connu (fibrillation atriale)." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', key: true, alert: true, text: '152/88 mmHg',
        meaning: "Plus haute que son habituel (134/76) : la douleur peut faire monter la tension. C'est la comparaison à l'habituel qui alerte." },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', text: '18 /min' },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', text: '96 % en air ambiant' },
      m_douleur: { section: 'douleur', kind: 'mesurer', label: 'Douleur (échelle numérique)', key: true, alert: true, text: '4/10 au repos, hanche droite',
        meaning: "Une douleur de 4/10 au repos, qui devient très forte au mouvement, est une douleur nouvelle par rapport à son état habituel (aucune douleur signalée au dossier ce matin)." },

      // En observant
      o_visage: { section: 'observations', kind: 'deduire', label: 'Aspect général', alert: true,
        text: "Visage crispé, il grimace dès qu'il change de position, teint gris.", how: 'Observe le résident.' },
      o_jambe: { section: 'observations', kind: 'deduire', label: 'Jambe droite', key: true, alert: true,
        text: "Sans la bouger : le pied droit est tourné vers l'extérieur et la jambe droite paraît plus courte que la gauche.",
        how: 'Observe le résident (en soulevant seulement le drap, avec son accord).',
        meaning: "Une jambe plus courte, avec le pied tourné vers l'extérieur, après une chute, est un signe d'alerte de traumatisme de la hanche. Tu ne la mobilises pas et tu alertes." },
      o_ecchymose: { section: 'observations', kind: 'deduire', label: 'Hanche droite', key: true, alert: true,
        text: 'Hématome violacé de la taille d\'une paume sur la hanche droite.', how: 'Observe le résident (avec son accord).',
        meaning: "Un hématome récent confirme un choc : c'est un fait objectif, même si le résident minimise." },
      o_deamb: { section: 'risques', kind: 'deduire', label: 'Déambulateur', key: true, alert: true,
        text: "Couché sur le côté près de la porte de la salle d'eau, alors que sa place est au pied du lit.", how: 'Regarde où se trouve le déambulateur.',
        meaning: "Un déambulateur à terre, loin de sa place, est un indice objectif de chute : le résident n'a pas à avouer pour que tu le repères." },
      o_chaussons: { section: 'risques', kind: 'deduire', label: 'Chaussons', alert: true,
        text: "Un chausson au pied du lit, l'autre retourné devant la salle d'eau.", how: 'Regarde ses chaussons.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', alert: true,
        text: "Accrochée au montant du lit, côté mur, hors de portée de sa main gauche. Elle n'a pas servi.", how: 'Regarde où se trouve la sonnette.' },
      o_table: { section: 'observations', kind: 'deduire', label: 'Table de chevet',
        text: 'Ses lunettes, dont une branche est tordue, et un verre d\'eau à moitié plein.', how: 'Regarde la table de chevet.' },
      o_plateau: { section: 'observations', kind: 'deduire', label: 'Plateau du petit déjeuner',
        text: 'À peine entamé : quelques gorgées de café, le pain est intact.', how: 'Regarde le plateau du petit déjeuner.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: 'Bonjour… entrez, entrez.' },
      c_presentation: { text: "Ah, l'étudiant… Enchanté. Moi, c'est Marcel Roux.", logs: ['g_presentation'] },
      c_explication:  { text: "D'accord… faites ce qu'il faut, mon petit.", logs: ['g_explication'] },
      c_fin:          { text: 'Merci à vous… À tout à l\'heure.' }
    }), {
      q_comment_allez: { text: "Oh, ça va… je suis un peu fatigué, c'est tout. Je préfère rester au lit ce matin.", reveals: ['q_ressenti'] },
      q_motif:         { text: "Depuis que ma femme est partie, je ne pouvais plus rester seul chez moi. Ici, ça va à peu près.", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "Je ne sais plus trop… depuis ce matin, je crois.",
        alt: { when: ALT, text: "Depuis cette nuit… vers trois heures, je dirais.", reveals: ['q_depuis'] } },
      q_autre:         { text: "Non non, rien de spécial. Ne vous occupez pas de moi.", reveals: ['q_ressenti'] },

      q_douleur:      { text: "Un peu mal à la hanche, à droite, vers l'aine… surtout quand je bouge. Au repos, c'est supportable, mais ça tire.", reveals: ['q_douleur'] },
      q_respiration:  { text: 'Je respire bien, je ne tousse pas.', reveals: ['q_resp'] },
      q_vertiges:     { text: 'Non, la tête va bien, pas de vertiges.', reveals: ['q_vertiges'] },
      q_nausees:      { text: 'Non, pas de nausée, rien de tout ça.', reveals: ['q_nausees'] },
      q_froid:        { text: "Pas de fièvre, je crois. Pas de frissons.", reveals: ['q_froid'] },

      q_alim:         { text: "Je n'avais pas très faim ce matin. J'ai pris une gorgée de café.", reveals: ['q_alim'] },
      q_boisson:      { text: "J'ai bu un peu d'eau cette nuit.", reveals: ['q_boisson'] },
      q_urines:       { text: "Depuis cette nuit, non… je n'ai pas pu me lever. Pas de brûlure.", reveals: ['q_urines'] },
      q_selles:       { text: 'Hier, c\'était normal.', reveals: ['q_selles'] },

      q_mobilite:     { text: "Je marche avec mon déambulateur d'habitude. Ce matin, je préfère ne pas bouger : ma jambe me tire.", reveals: ['q_mouvement'] },
      q_membres:      { text: "Si je bouge la jambe droite, ça me tire terriblement dans l'aine. Je préfère ne pas y toucher.", reveals: ['q_mouvement', 'q_douleur'] },
      q_chute:        { text: "Non non, pas de chute. La dernière, c'était chez moi, l'an dernier.", reveals: ['q_deni', 'q_chute_dit'],
        alt: { when: ALT, text: "Bon… oui. Cette nuit. Mais je n'ai rien de cassé, hein ?", reveals: ['q_nuit_chute'] } },
      q_nuit:         { text: "Il ne s'est rien passé. J'ai mal dormi, c'est tout.", reveals: ['q_deni', 'q_sommeil'],
        alt: { when: ALT, text: "Je me suis levé pour aller aux toilettes, vers trois heures. J'ai glissé devant la salle d'eau et je suis tombé sur le côté. Je me suis remis au lit comme j'ai pu, en me tirant avec les bras. Je ne voulais pas faire d'histoires.", reveals: ['q_nuit_chute', 'q_peur'] } },
      q_sommeil:      { text: "J'ai mal dormi. La douleur m'a réveillé.", reveals: ['q_sommeil'] },
      q_sonnette:     { text: "Je n'en ai pas eu besoin.",
        alt: { when: ALT, text: "Non… je n'ai pas voulu déranger les petites de nuit. Et s'ils m'envoyaient à l'hôpital ? Je n'y retourne pas.", reveals: ['q_peur'] } },
      q_choc:         { text: "Pas la tête, non, je ne crois pas. Juste mon côté, c'est tout. (Il porte la main à sa hanche.)", reveals: ['q_choc'] },
      q_rassure:      { text: "Merci… vous êtes gentil. Je ne voulais pas faire d'histoires, vous savez.", reveals: ['q_peur'] },
      q_equipe:       { text: "(Karim, depuis la porte) « Au passage de 5 h, la lumière de la salle d'eau était restée allumée. Et le système d'appel n'a enregistré aucun appel de cette chambre cette nuit. »", reveals: ['q_equipe_nuit'] },

      q_antecedents:  { text: 'Le cœur, la tension, mes genoux… Voilà.', reveals: ['q_atcd'] },
      q_traitements:  { text: "Un comprimé pour le cœur matin et soir, un pour la tension le matin. Hier soir, je l'ai pris. Ce matin, pas encore.", reveals: ['q_ttt'] },
      q_allergies:    { text: "Non, je ne suis allergique à rien.", reveals: ['q_allerg'] },

      q_moral:        { text: "Ça va… Je n'aime pas qu'on s'inquiète pour moi. C'est un peu honteux à mon âge.", reveals: ['q_moral'] },
      q_entourage:    { text: "Mon fils Pascal vient le samedi. Ne l'inquiétez pas, surtout.", reveals: ['q_entourage'] },
      q_orientation:  { text: "Nous sommes un lundi, et je suis à la résidence, dans ma chambre, la sept.", reveals: ['q_orientation'] }
    }),
    fallbackAnswer: 'Non… je ne vois pas, mon petit.',
    notUnderstood: 'Pardon ? Je suis un peu dur d\'oreille, je n\'ai pas bien compris…',
    whoAreYou: 'Excusez-moi… mais vous êtes qui, vous ?',

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, douleur: true, auto: [
      { id: 'g_chute', asked: ['q_chute', 'q_choc'] },
      { id: 'g_environnement', objects: ['deambulateur', 'chaussons', 'sonnette', 'table'] }
    ] }),

    narration: B.narration(patient, {
      enter: "Tu entres dans la chambre 7. M. Roux est allongé sur le dos, très immobile, les yeux ouverts."
    }),

    constTable: B.constTable({ temp: '36,6 °C', fc: '72 /min, irrégulier', pa: '134/76 mmHg', fr: '16 /min', spo2: '96 %' }, { douleur: true }),

    objects: {
      patiente: { label: 'Observer M. Roux', icon: '👴', reveals: ['o_visage', 'o_jambe', 'o_ecchymose'],
        narration: "Tu observes M. Roux : il serre les dents dès qu'il change un peu de position. Avec son accord, tu soulèves seulement le drap, sans le bouger : son pied droit est tourné vers l'extérieur, la jambe droite paraît plus courte que la gauche, et un hématome violacé apparaît sur sa hanche droite." },
      table: { label: 'Table de chevet', icon: '👓', reveals: ['o_table'],
        narration: "Sur la table de chevet : un verre d'eau à moitié plein et ses lunettes, dont une branche est tordue." },
      plateau: { label: 'Plateau du petit déjeuner', icon: '☕', reveals: ['o_plateau'],
        narration: 'Le plateau du petit déjeuner est à peine entamé : quelques gorgées de café, le pain est intact.' },
      deambulateur: { label: 'Déambulateur', icon: '🦯', reveals: ['o_deamb'],
        narration: "Le déambulateur n'est pas à sa place, au pied du lit : il est couché sur le côté, près de la porte de la salle d'eau." },
      chaussons: { label: 'Chaussons', icon: '🥿', reveals: ['o_chaussons'],
        narration: "Un chausson est au pied du lit, l'autre est retourné devant la porte de la salle d'eau." },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: "La sonnette est accrochée au montant du lit, côté mur : elle est hors de portée de sa main gauche, et elle n'a pas servi." }
    },

    grid: B.grid({ p: patient, douleur: true, extra: [
      { id: 'g_chute', label: "Interroger sur les chutes et sur un choc à la tête (surtout sous anticoagulant)",
        why: "Après un incident de nuit, on cherche la chute et le choc à la tête. Un résident peut minimiser : on s'appuie aussi sur les indices de la chambre.",
        ref: 'HAS : fiche repère « Chutes » (signes d\'alerte) · UE B3 S1 : entretien clinique débutant' },
      { id: 'g_environnement', label: 'Observer l\'environnement (déambulateur, chaussons, sonnette, table de chevet)',
        why: "L'environnement donne des signes objectifs : un déambulateur à terre ou une sonnette hors de portée en disent plus que les paroles.",
        ref: 'UE B3 S1 : de l\'observation clinique au recueil de données (CM 4)' }
    ] }),

    discordance: {
      fact: 'q_nuit_chute', el: 'e_chute',
      said: "✓ Tu as transmis la chute de la nuit, alors que le dossier et les transmissions disaient « aucune chute » : c'est exactement le réflexe attendu.",
      heard: "⚠ Tu avais découvert que M. Roux était tombé cette nuit, mais tu ne l'as pas transmis à Sophie. Une information qui ne colle pas avec le dossier se transmet toujours.",
      missed: "⚠ Tu n'as pas fait émerger la chute de la nuit. M. Roux la minimisait, mais le déambulateur à terre, les chaussons déplacés et la hanche douloureuse la montraient : il faut aussi savoir observer et mettre en confiance."
    },

    alertSummary: "Pris un par un, ces signes semblent discrets : un résident fatigué qui n'a pas faim, un pouls et une tension un peu plus hauts, un déambulateur mal rangé. Mais ensemble (douleur de la hanche qui empêche de bouger, jambe plus courte et tournée vers l'extérieur, hématome, déambulateur à terre, chaussons déplacés, aucun appel de la nuit), ils racontent une chute que personne n'a signalée. Une personne âgée cache parfois une chute par peur de déranger ou d'être hospitalisée : c'est à toi de repérer les indices, de la mettre en confiance, de ne pas la mobiliser et d'alerter. Sous anticoagulant, une chute se transmet toujours.",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de M. Roux ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: 'Rien de grave : il est fatigué, je note les valeurs et je continue la toilette',
          unsafe: "Tu as jugé qu'il n'y avait rien à signaler alors que M. Roux avait chuté, avait mal à la hanche et refusait de bouger.",
          feedback: "M. Roux a chuté cette nuit, il a mal à la hanche, sa jambe est tournée vers l'extérieur et il prend un anticoagulant. Ne rien signaler et poursuivre la toilette (le lever, la douche) exposerait à une aggravation. Un étudiant ne décide pas seul de la gravité : il alerte." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière référente, mais cela peut attendre la fin de la matinée",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors que M. Roux avait chuté, avait mal à la hanche et prenait un anticoagulant.",
          feedback: "Tu as raison de vouloir signaler, mais attendre est dangereux : il est sous anticoagulant, il a mal et il ne doit surtout pas être levé ni mobilisé par quelqu'un qui ne sait pas. On alerte dès qu'on repère l'ensemble, avant de poursuivre les soins." },
        { id: 'maintenant', pts: 10, verdict: 'good',
          label: "À signaler à l'infirmière référente maintenant, sans le lever ni le mobiliser",
          feedback: "Bon réflexe. Tu as repéré une chute non déclarée, une douleur de la hanche et des indices objectifs, et tu sais qu'on ne mobilise pas. Tu alertes l'infirmière référente tout de suite, avec des informations précises : c'est l'étape suivante." },
        { id: 'quinze', pts: 4, verdict: 'avoid',
          label: "Urgence vitale : j'appelle le 15 moi-même, tout de suite",
          feedback: "Il n'y a pas de signe de détresse vitale (pas de malaise, pas de saignement, pas de perte de connaissance). Ce n'est pas à l'étudiant de déclencher le 15 : tu alertes l'infirmière référente, qui évalue, contacte le médecin et décide du transfert. Si l'état s'aggravait brutalement, tu appellerais immédiatement à l'aide, sans attendre." }
      ],
      actionsQ: "En attendant l'arrivée de Sophie, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'immobile', v: 'good', label: 'Le laisser allongé, ne pas le mobiliser, ne pas bouger sa jambe droite',
          why: "Avec une douleur de hanche après une chute, toute mobilisation peut aggraver la lésion et la douleur : on laisse la jambe dans la position où elle est." },
        { id: 'rester', v: 'good', label: 'Rester près de lui et mettre la sonnette à portée de sa main gauche',
          why: "Il ne doit pas rester seul ni essayer de se lever : la sonnette à portée de main est la première protection." },
        { id: 'rassurer', v: 'good', label: "Le rassurer et lui expliquer que tu préviens l'infirmière pour le soulager, sans reproche",
          why: "Il a caché sa chute par peur de déranger et d'être hospitalisé : un ton calme, sans reproche, maintient la confiance." },
        { id: 'karim', v: 'good', label: 'Prévenir Karim que la toilette et le lever sont suspendus en attendant Sophie',
          why: 'Coordination de l\'équipe : personne ne doit le lever ni l\'installer au fauteuil avant l\'avis de l\'infirmière.' },
        { id: 'noter', v: 'good', label: 'Ne pas ranger le déambulateur ni les chaussons, et noter où ils se trouvent pour tes transmissions',
          why: "La position du déambulateur et des chaussons aide à comprendre la chute et sert de preuve objective dans les transmissions." },
        { id: 'couvrir', v: 'good', label: 'Le couvrir pour qu\'il n\'ait pas froid, sans le bouger',
          why: "Une personne âgée immobile et douloureuse se refroidit vite ; on la couvre sans la mobiliser." },
        { id: 'paracetamol', v: 'danger', label: 'Lui donner du paracétamol 1 g (prescrit « si besoin ») pour le soulager',
          why: "Le soulager est utile, mais un médicament ne se donne jamais sans l'accord de l'infirmière : elle vérifie la dernière prise, la dose et la prescription. Un étudiant n'administre pas seul." },
        { id: 'marcher', v: 'danger', label: "Lui faire faire quelques pas avec son déambulateur pour voir s'il tient debout",
          why: "Faire marcher une personne qui vient de chuter et qui a mal à la hanche peut aggraver la lésion et provoquer une nouvelle chute." },
        { id: 'jambe', v: 'danger', label: 'Plier ou bouger doucement sa jambe pour voir si ça fait mal',
          why: "Mobiliser une hanche douloureuse après une chute est dangereux : on observe sans manipuler, et on laisse l'infirmière évaluer." },
        { id: 'lever', v: 'danger', label: 'Le lever au fauteuil pour qu\'il soit mieux installé',
          why: "Lever une personne qui a chuté et qui a mal à la hanche est dangereux avant l'évaluation de l'infirmière." },
        { id: 'petitdej', v: 'avoid', label: 'Lui servir son petit-déjeuner comme d\'habitude',
          why: "Avant l'avis de l'infirmière et du médecin, on ne sait pas s'il devra rester à jeun (examens, transfert) : on ne lui donne rien à manger sans leur accord." },
        { id: 'masser', v: 'danger', label: 'Masser la hanche avec une crème pour le soulager',
          why: "Masser une hanche douloureuse après une chute, chez une personne sous anticoagulant, peut aggraver la lésion et un saignement. Tu laisses l'infirmière évaluer et décider du soulagement." },
        { id: 'mt', v: 'avoid', label: 'Appeler moi-même le médecin traitant',
          why: "Tu passes par l'infirmière : c'est elle qui contacte le médecin et qui décide ce qu'on lui transmet." }
      ]
    },

    call: {
      who: 'Sophie',
      intro: "Tu fais venir Karim pour qu'il reste près de M. Roux, puis tu vas au poste de soins ou tu utilises le téléphone du service. Sophie décroche : « Oui, Sophie ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Tu peux écrire en phrases courtes, comme tu les dirais à voix haute.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?',
          placeholder: 'Bonjour Sophie, c\'est … étudiant(e). Je suis chez …',
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies le résident (nom, chambre)', ask: 'De quel résident parles-tu ?', re: [/roux/, /marcel/, /chambre (7|sept)\b/, /\bch ?7\b/] },
            { id: 's_motif', w: 1, label: "Tu dis pourquoi tu appelles (ce qui s'est passé, ce qui a changé)", ask: "Pourquoi m'appelles-tu ?",
              re: [/chute/, /tombe/, /glisse/, /douleur/, /\bmal\b/, /hanche/, /inquiet/, /preoccup/, /change/, /pas bien/, /d habitude/, /anormal/, /ne veut pas/, /refuse/, /ne peut pas/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Il a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile (hypertension, fibrillation, arthrose, chute passée…)', ask: 'Il a quels antécédents ?',
              re: [/hypertension/, /\bhta\b/, /fibrillation/, /arthrose/, /chute/, /cataracte/] },
            { id: 'a_ttt', w: 1, label: 'Son anticoagulant (apixaban), important après une chute', ask: 'Il prend un traitement qui fluidifie le sang ?',
              re: [/anticoag/, /apixaban/, /eliquis/, /fluidifi/, /sang liquide/] },
            { id: 'a_hab', w: 1, label: 'Son état habituel (marche avec déambulateur, autonome, orienté)', ask: "Comment est-il d'habitude ?",
              re: [/deambulateur/, /autonome/, /habituellement/, /d habitude/, /\bgir\b/, /marche/, /oriente/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : douleur …, pouls …, pression artérielle …',
          elements: [
            { id: 'e_const', w: 1, label: 'Au moins 3 constantes mesurées avec leur valeur (36,8 °C · 98/min · 152/88 · 18/min · 96 %)',
              ask: 'Tu as pris ses constantes ? Dis-moi les valeurs.', need: { min: 3, re: [/\b36 8\b/, /\b98\b/, /\b152 (sur )?88\b/, /\b18\b/, /\b96\b/] } },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (72/min, 134/76…)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /avant/, /plus haute/, /plus rapide/, /par rapport/, /au lieu de/, /contre/, /\b72\b/, /\b134\b/] },
            { id: 'e_signes', w: 1, label: 'Au moins 2 signes : douleur de la hanche, jambe tournée ou plus courte, hématome, grimace, refus de bouger',
              ask: "Qu'est-ce que tu as remarqué d'autre chez lui ?",
              need: { min: 2, re: [/douleur/, /hanche/, /\baine\b/, /\bmal\b/, /grimace/, /jambe/, /pied (droit )?(tourne|vers l exterieur)/, /raccourci/, /plus courte/, /hematome/, /\bbleu\b/, /ecchymose/, /ne veut pas/, /refuse/, /ne peut pas/, /bouger/] } },
            { id: 'e_chute', w: 2, label: "Tu transmets la chute de la nuit (non signalée dans le dossier)", ask: "Il s'est passé quelque chose cette nuit ?",
              re: [/chute/, /tombe/, /tombee/, /glisse/, /par terre/, /au sol\b/, /deambulateur .{0,12}(a terre|couche|renverse)/] },
          ],
          warn: { re: [/\b(il a|c est|il s agit d) une fracture\b/, /\bfracture (certaine|confirmee)\b/, /luxation/, /\bcasse (la|sa|une)\b/, /\bavc\b/, /infarctus/, /hemorragie/, /embolie/], pen: 1,
            text: "Tu as affirmé une lésion ou une maladie que tu ne peux pas confirmer. Tu ne poses pas de diagnostic : tu décris ce que tu constates (douleur, position de la jambe, hématome) et c'est l'infirmière puis le médecin qui interprètent. Écrire « suspicion de fracture » est possible, mais décris d'abord les faits." }
        },
        { id: 'D', label: 'D · Demande', hint: 'Qu\'attends-tu de Sophie, et pour quand ?', placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 2, label: 'Tu demandes à Sophie de venir voir / évaluer le résident', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /voir (le |m |monsieur |marcel |roux )/, /evalue/, /examin/, /jeter un oeil/, /regarde/, /vienne/, /viendr/] },
            { id: 'd_avis', w: 1, label: "Tu demandes quelle conduite tenir : médecin à prévenir, ne pas le lever, transfert", ask: 'Tu veux que je prévienne le médecin ?',
              re: [/medecin/, /docteur/, /\bdr\b/, /lambert/, /avis medical/, /prescri/, /conduite a tenir/, /cat\b/, /que (dois|faut|fait|faire)/, /surveill/, /ne pas (le )?(lever|bouger|mobiliser)/, /transfert/, /urgences/, /hopital/, /radio/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (maintenant, avant la toilette)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /rapidement/, /des que possible/, /urgent/, /\bvite\b/, /immediat/, /avant (la |sa )?toilette/, /rapide/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est clair et complet. J'arrive tout de suite. Ne le lève surtout pas, ne bouge pas sa jambe et reste près de lui. Je préviens le Dr Lambert.",
        mid: "D'accord, j'ai l'essentiel.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions.',
        final: "Merci, j'ai ce qu'il me faut. J'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: 'Je viens, mais dis-moi toujours ce que tu attends de moi.'
      },
      model: {
        S: "Bonjour Sophie, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 7 avec M. Roux, 88 ans. Je t'appelle parce qu'il est tombé cette nuit, vers 3 h, sans appeler, et qu'il a mal à la hanche droite.",
        A: "Il a de l'hypertension, une fibrillation atriale et de l'arthrose. Il prend un anticoagulant, l'apixaban : dernière prise hier à 20 h, pas encore ce matin. D'habitude, il marche avec son déambulateur et il est autonome. Les transmissions de la nuit disaient « RAS ».",
        E: "Il est tombé cette nuit vers 3 h et cela n'était pas dans les transmissions. Ce matin : température 36,8 °C, pouls 98 par minute (72 d'habitude), tension 152/88 (134/76 d'habitude), fréquence respiratoire 18, saturation 96 %, douleur 4 sur 10 au repos, très forte au mouvement. Son pied droit est tourné vers l'extérieur et sa jambe droite me paraît plus courte. Il a un hématome sur la hanche droite. Son déambulateur était à terre près de la salle d'eau. Il est orienté et dit ne pas s'être cogné la tête.",
        D: "Je voudrais que tu viennes le voir tout de suite, avant la toilette. Je ne l'ai pas bougé. Dis-moi si on prévient le médecin et ce que je dois surveiller en attendant."
      },
      aiFacts: "Patient fictif : M. Marcel Roux, 88 ans, chambre 7, EHPAD. Habituellement : T 36,6 °C, pouls 72/min irrégulier (fibrillation atriale), PA 134/76, FR 16/min, SpO2 96 %, autonome avec déambulateur, orienté. Ce matin : T 36,8 °C, pouls 98/min, PA 152/88, FR 18/min, SpO2 96 %, douleur 4/10 au repos (hanche droite, très forte au mouvement). Il a chuté vers 3 h cette nuit en revenant des toilettes, n'a pas sonné par peur de déranger ; chute non signalée dans les transmissions (« RAS »). Pied droit tourné vers l'extérieur, jambe droite plus courte, hématome de la hanche droite, déambulateur à terre. Dit ne pas s'être cogné la tête. Traitement : apixaban 2,5 mg matin et soir (dernière prise hier à 20 h), périndopril le matin, paracétamol si besoin."
    },

    rx: {
      from: 'Dr Lambert, médecin traitant · prescription saisie dans le dossier de soins (après appel de Sophie)',
      title: 'Prescription du médecin',
      intro: "Sophie a prévenu le Dr Lambert. Quelques minutes plus tard, sa prescription apparaît dans le dossier de soins informatisé. Lis-la attentivement : c'est elle qui fait foi, pas ce que tu avais imaginé.",
      note: "Prescription fictive, écrite pour l'entraînement. Dans la réalité, elle dépend du médecin, de la situation et des protocoles du service.",
      lines: [
        { id: 'lever', icon: '⛔', t: 'Pas de lever ni de mobilisation. Il reste allongé, membre inférieur droit dans la position où il se trouve.' },
        { id: 'transfert', icon: '🚑', t: 'Transfert aux urgences pour avis et examens (radiographie du bassin et de la hanche droite) : l\'infirmière organise le transport allongé, selon la procédure du service.' },
        { id: 'para', icon: '💊', t: 'Paracétamol 1 g par voie orale, avec une gorgée d\'eau, donné par l\'infirmière avant le transport (noter l\'heure de la dernière prise). Maximum 3 g par 24 h.' },
        { id: 'surv', icon: '📈', t: 'Surveillance toutes les 30 minutes jusqu\'au départ : douleur (échelle 0 à 10), pouls, pression artérielle, fréquence respiratoire, saturation, vigilance, couleur et chaleur des pieds.' },
        { id: 'jeun', icon: '🥣', t: 'Rien à manger ni à boire en attendant l\'avis des urgences, sauf la gorgée d\'eau du paracétamol et accord de l\'infirmière.' },
        { id: 'apix', icon: '💊', t: 'Apixaban : dernière prise hier à 20 h, à communiquer aux urgences. Ne pas donner le comprimé de ce matin avant l\'avis des urgences.' },
        { id: 'dlu', icon: '📁', t: 'Préparer le dossier de liaison d\'urgence (DLU) : traitements, antécédents, personne à prévenir.' },
        { id: 'fils', icon: '📞', t: 'Prévenir son fils, Pascal.' },
        { id: 'declar', icon: '📝', t: 'Déclarer la chute selon la procédure de l\'établissement (événement indésirable).' }
      ],
      discKnown: "Chute nocturne : signalée par l'étudiant(e) à l'infirmière alors que les transmissions de la nuit disaient « RAS ». Chute à tracer et à déclarer.",
      discUnknown: 'Chute : non signalée dans les transmissions de la nuit. Elle est connue seulement parce que le résident l\'a avouée ou que l\'équipe l\'a découverte.'
    },

    written: {
      intro: "Il est 8 h 15. Sophie t'a rejoint, la prise en charge est lancée. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de la journée sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats).",
      rules: "Écris des faits observables, datés, sans jugement ni diagnostic. Évite les formules vagues (« RAS », « douleur »). Mentionne l'heure quand tu la connais.",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : douleur de la hanche après une chute…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème ou un risque précis (chute, douleur de la hanche, risque de chute)',
              re: [/chute/, /tombe/, /douleur/, /hanche/, /risque de chute/, /traumatisme/, /incident/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : valeurs, signes, faits.', placeholder: 'Ex. : chute vers 3 h non signalée, douleur 4/10…', rows: 4, elements: [
            { id: 'w_const', w: 2, label: 'Au moins 3 constantes avec leur valeur', need: { min: 3, re: [/\b36 8\b/, /\b98\b/, /\b152 (sur )?88\b/, /\b18\b/, /\b96\b/] } },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /au lieu de/, /contre/, /\b72\b/, /\b134\b/] },
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : douleur de la hanche, jambe tournée ou plus courte, hématome, déambulateur à terre', need: { min: 2, re: [/douleur/, /hanche/, /\baine\b/, /grimace/, /jambe/, /pied (droit )?(tourne|vers l exterieur)/, /plus courte/, /raccourci/, /hematome/, /ecchymose/, /deambulateur/, /chausson/] } },
            { id: 'w_chute', w: 1, label: 'La chute de la nuit (heure, circonstances) et le choc à la tête', re: [/chute/, /tombe/, /glisse/, /\b3 ?h\b/, /trois heures/, /cogn/, /tete/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /menteur/, /\bment\b/, /cache expres/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: 'Ce que toi et l\'équipe avez fait.', placeholder: 'Ex. : infirmière prévenue à …, non mobilisé…', rows: 4, elements: [
            { id: 'w_ide', w: 2, label: "L'infirmière référente a été prévenue (qui, ce qu'elle a fait)", all: [/(sophie|\bide\b|infirmiere|infirmier|referente)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise)/] },
            { id: 'w_soins', w: 1, label: 'Tes actions de soin : non mobilisé, sonnette à portée, rassuré, toilette reportée', re: [/mobilis/, /bouge/, /allonge/, /sonnette/, /rassure/, /toilette (reportee|differee|repoussee|annulee)/, /report/, /couvert/, /surveill/] },
            { id: 'w_presc', w: 1, label: 'Ce qui a été fait ou demandé ensuite : médecin, transfert, antalgique, DLU', re: [/medecin/, /lambert/, /prescri/, /transfert/, /urgences/, /ambulance/, /paracetamol/, /antalgique/, /dlu/, /dossier de liaison/, /\b15\b/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: 'Où en est le résident après ces actions ? Qu\'est-ce qui reste à faire ?', placeholder: 'Ex. : en attente du transfert, douleur …, famille prévenue', rows: 3, elements: [
            { id: 'r_etat', w: 2, label: "L'état du résident après tes actions (ou ce qu'on attend)", re: [/en attente/, /attente/, /prise en charge/, /transfert/, /installe/, /allonge/, /immobile/, /calme/, /soulage/, /sans changement/, /inchange/, /stable/, /aggrav/, /amelior/, /resultat/, /est venue/, /arrive/] },
            { id: 'r_suite', w: 1, label: 'La suite : surveillance, famille, déclaration', re: [/surveillance/, /a poursuivre/, /toutes les/, /a surveiller/, /a suivre/, /famille/, /fils/, /pascal/, /declar/, /dlu/, /a verifier/] }
          ] }
      ],
      model: {
        C: 'Douleur de la hanche droite après une chute nocturne non signalée',
        D: "À [heure] : résident allongé, visage crispé, grimace au moindre mouvement. Dit avoir glissé vers 3 h en revenant des toilettes, sans sonner ; dit ne pas s'être cogné la tête. Douleur 4/10 au repos, très forte au mouvement (hanche et aine droites). Pied droit tourné vers l'extérieur, jambe droite plus courte, hématome de la hanche droite. T 36,8 °C, pouls 98/min (habituel 72), PA 152/88 (habituel 134/76), FR 18/min, SpO2 96 %. Déambulateur à terre près de la salle d'eau. Sous apixaban : dernière prise hier à 20 h.",
        A: "Infirmière (Sophie) prévenue à [heure], venue à [heure]. Résident non mobilisé, laissé allongé, sonnette à portée, rassuré, couvert. Toilette reportée, aide-soignant prévenu. Médecin prévenu par l'infirmière. Paracétamol donné par l'infirmière. DLU préparé, transfert organisé.",
        R: "En attente du transport aux urgences. Résident plus calme. Surveillance des constantes et de la douleur toutes les 30 minutes à poursuivre. Fils à prévenir. Chute à déclarer."
      },
      aiFacts: null
    }
  });
})();
