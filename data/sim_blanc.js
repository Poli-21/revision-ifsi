// data/sim_blanc.js — Simulation clinique : scénario EHPAD n° 3, Mme Blanc (le réveil difficile d'une résidente diabétique)
// Même structure que data/sim_ehpad.js (Mme Martin). Les briques communes viennent de data/sim_base.js.
// ⚠ Patiente et valeurs FICTIVES, à but pédagogique. Les protocoles de l'établissement priment (resucrage compris).
// ⚠ Contenu à faire relire par ton formateur : chaque valeur cite sa source dans `ref`.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'Mme', nom: 'Blanc', prenom: 'Jeannine', dob: '22/07/1935', dobMots: 'vingt-deux juillet mille neuf cent trente-cinq', age: 91, chambre: 15, sexe: 'F', avatar: '👵' };
  const GLYC_WHY = "Chez une personne diabétique traitée par insuline, une glycémie capillaire se mesure dès qu'elle est sudative, tremblante ou confuse. Elle objective le malaise : on ne devine pas une glycémie.";
  const T = B.tools({ p: patient, de: 'de Mme Blanc', temp: 36.2, fc: { rate: 96, rhythm: 'régulier' }, pa: [138, 72], fr: 18, spo2: 96,
    glyc: { val: 0.46, why: GLYC_WHY, ref: 'Soin appris en institut, à faire avec l\'accord de l\'infirmière (à confirmer avec ton formateur) · seuil d\'hypoglycémie : Fédération Française des Diabétiques' },
    douleur: { val: 0, says: '« Aucune, je n\'ai pas mal. Ce sont mes mains qui tremblent. »', noted: 'Douleur : 0/10' } });

  App.SimScenarios.push({
    id: 'ehpad_hypoglycemie_3',
    title: 'Le réveil difficile de Mme Blanc',
    short: "Tu fais le bilan du matin d'une résidente de 91 ans, diabétique. Elle est en sueur, tremble et répond lentement. Que fais-tu, et dans quel ordre ?",
    icon: '🩸',
    level: 2, levelLabel: 'Intermédiaire',
    setting: 'EHPAD', semestre: 'S1', ue: ['B.3'], duration: '15 à 20 min',
    status: 'Version à valider avec ton formateur',
    competences: [
      { n: 1,  label: 'Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique)' },
      { n: 3,  label: 'Réaliser des soins (surveillance, mesures, glycémie capillaire avec l\'accord de l\'infirmière)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions)' }
    ],
    sources: [
      { label: 'Fédération Française des Diabétiques : hypoglycémie',
        url: 'https://www.federationdesdiabetiques.org/export-pdf/888',
        note: "Hypoglycémie : glycémie inférieure à 0,70 g/L. Signes : sueurs, pâleur, tremblements, faiblesse, vision floue. Personne consciente : 15 g de glucides (3 morceaux de sucre, 15 cl de jus de fruit ou de soda non light), recontrôle de la glycémie 15 minutes plus tard, apport renouvelé si elle reste basse. Personne inconsciente : ne rien donner par la bouche et appeler les secours (15 ou 112) si la situation n'est pas maîtrisée. Page destinée aux patients et à leurs proches : elle ne remplace pas le protocole de ton établissement." },
      { label: 'Les paramètres vitaux (IFSI de Nice, 2017)',
        url: 'https://extranet.chu-nice.fr/IFSI-de-Nice/uploads/Extranet/smartsection/1834_LES_PARAMETRES_VITAUX_2017.pdf',
        note: 'Températures normales 36,5–37,5 °C ; tachycardie > 100/min ; polypnée > 20/min. Seuil de saturation : à vérifier dans ton cours (CM 6).' },
      { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
        url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière référente (étape Décision)." },
      { label: 'Guide du stage infirmier en EHPAD (Réussis ton IFSI : ta page de cours)',
        url: 'https://app.reussistonifsi.fr/cours/ehpad-2',
        note: 'Risques à prévenir chez le résident (dont dénutrition et déshydratation), rôle de l\'infirmier(e), vocabulaire du stage. Page réservée aux abonnés.' },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
        note: 'Objectifs du S1 : recueil structuré de données, entretien clinique débutant, repérage des signes d\'aggravation, transmissions ciblées.' }
    ],

    patient,
    scene: { clock: { h: 7, m: 20 }, glucometre: true, label: 'Chambre 15 : Mme Blanc est dans son lit',
      patient: { eyes: 'open', pale: true, sweat: true } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_glyc_dossier', 'd_repas_hier', 'd_autonomie', 'd_habituel', 'd_const_hab'],

    intro: {
      heure: '7 h 20',
      texte: "Tu es en stage dans un EHPAD, avec Sophie, l'infirmière référente, joignable au poste de soins. Ce matin, avant le petit-déjeuner, tu fais le bilan de Mme Blanc, résidente de la chambre 15. Tu disposes d'environ vingt minutes.",
      equipe: "Transmissions de la nuit : « Nuit calme, RAS. » Karim, aide-soignant : « À 6 h 30, elle ne m'a pas répondu tout de suite, je ne l'ai pas dérangée. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations (tu peux aussi mesurer la glycémie capillaire : dans la réalité, tu le fais avec l'accord de Sophie), puis repère ce qui doit alerter."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "Mme Jeannine BLANC, née le 22/07/1935 (91 ans) · chambre 15 · bracelet d'identification au poignet." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'entrée",
        text: "Entrée en EHPAD il y a 8 mois, après une hospitalisation pour un diabète déséquilibré et une perte d'autonomie à domicile. Vit en chambre seule." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: 'Diabète de type 2 traité par insuline · hypertension artérielle · insuffisance rénale chronique modérée · arthrose des genoux · cataracte opérée.' },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Aucune allergie connue (selon le dossier).' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: "Insuline glargine (Lantus®) 10 UI par injection sous-cutanée le soir à 20 h, réalisée par l'infirmière · Ramipril 2,5 mg : 1 comprimé le matin · Paracétamol 1 g si douleur, maximum 3 g par 24 h (prescription « si besoin »)." },
      d_glyc_dossier: { section: 'traitements', kind: 'dossier', label: 'Surveillance du diabète',
        text: 'Glycémies capillaires habituelles : 1,00 à 1,60 g/L. Hier à 19 h 45 : 1,34 g/L. Contrôle avant les repas et au coucher.' },
      d_repas_hier: { section: 'histoire', kind: 'dossier', label: 'Dîner d\'hier (dossier)',
        text: "Feuille de repas d'hier soir : dîner « pris ». Transmissions de la nuit : « Nuit calme, RAS »." },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: 'GIR 4 : marche avec un déambulateur, se lève seule, toilette avec aide partielle, mange seule (plateau préparé).' },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: 'Souriante, vive, orientée, adore les mots fléchés. Bon appétit. Sa nièce Claire vient le mercredi.' },
      d_equipe: { section: 'psychosocial', kind: 'dossier', label: 'Équipe et contacts',
        text: "Infirmière référente : Sophie (poste de soins) · aide-soignant : Karim · médecin traitant (MT) : Dr Lambert, joignable par l'infirmière." },
      d_pap: { section: 'autonomie', kind: 'dossier', label: "Projet d'accompagnement personnalisé (PAP)",
        text: "Garder sa marche avec le déambulateur, ne pas sauter de repas, glycémies surveillées, mots fléchés l'après-midi." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: 'Température 36,5 °C · pouls 76/min · pression artérielle 142/76 mmHg · fréquence respiratoire 16/min · saturation 96 % · glycémie à jeun habituelle 1,10 g/L · poids 61 kg (il y a 15 jours).',
        meaning: "Ces valeurs servent de point de comparaison : une constante peut être « normale » en théorie et pourtant très différente de l'habituel de la personne." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
        text: "Se sent « bizarre » : les mains tremblent, elle a très chaud, la tête lui tourne un peu.",
        how: 'Demande-lui comment elle se sent ce matin.',
        meaning: "Une sensation de malaise avec tremblements chez une résidente d'habitude vive est un changement par rapport à son état habituel." },
      q_sueurs: { section: 'symptomes', kind: 'chercher', label: 'Sueurs', key: true, alert: true,
        text: "A beaucoup transpiré cette nuit : la chemise de nuit et le drap sont humides.",
        how: 'Demande-lui si elle a chaud, si elle transpire.',
        meaning: "Des sueurs importantes avec des tremblements font partie des signes d'une glycémie trop basse (Fédération Française des Diabétiques)." },
      q_trembler: { section: 'symptomes', kind: 'chercher', label: 'Tremblements', key: true, alert: true,
        text: "Ses mains tremblent depuis le réveil ; elle sent son cœur battre vite.",
        how: 'Demande-lui si elle tremble ou si son cœur bat vite.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', alert: true,
        text: "La tête lui tourne un peu quand elle bouge ; sa vue est légèrement floue.",
        how: 'Demande si la tête lui tourne.',
        meaning: "Avec des vertiges et une vue floue, le risque de chute est réel : elle ne se lève pas seule." },
      q_diabete: { section: 'traitements', kind: 'chercher', label: 'Diabète, insuline', key: true, alert: true,
        text: "A eu sa piqûre d'insuline hier soir à 20 h, faite par l'infirmière comme d'habitude. N'a pas mesuré son sucre ce matin.",
        how: "Demande-lui si elle a eu sa piqûre du soir et comment va son diabète.",
        meaning: "L'insuline du soir a bien été injectée : si le repas n'a pas été pris, le risque d'une glycémie trop basse augmente." },
      q_repas_hier: { section: 'histoire', kind: 'chercher', label: 'Dîner d\'hier soir', key: true, alert: true,
        text: "A à peine mangé hier soir : la moitié de sa soupe et un petit bout de pain, elle avait mal au cœur. Le dossier indiquait pourtant « dîner pris ».",
        how: "Demande-lui ce qu'elle a mangé hier soir, ou regarde le plateau d'hier soir.",
        meaning: "Insuline injectée, mais presque rien mangé chez une personne âgée qui a une insuffisance rénale : le risque d'hypoglycémie augmente. C'est une information essentielle pour le médecin, qui peut réévaluer la dose. Elle est absente du dossier : tu la transmets." },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: "Avait un peu mal au cœur hier soir ; plus ce matin.", how: 'Demande si elle a des nausées.' },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Début des troubles', key: true,
        text: "Réveillée vers 6 h, en nage et tremblante ; depuis, elle se sent de plus en plus bizarre.",
        how: 'Demande depuis quand elle se sent ainsi.',
        meaning: "Le moment du début est une information à transmettre : c'est la durée de l'évolution." },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', key: true, alert: true,
        text: "Se trompe d'un jour, demande si elle « doit aller faire ses courses » : un peu confuse, ce qui n'est pas habituel chez elle.",
        how: 'Demande-lui quel jour nous sommes et où elle se trouve.',
        meaning: "Une confusion nouvelle est un signe d'alerte. Elle est éveillée, mais ralentie." },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', text: 'Aucune douleur.', how: 'Demande si elle a mal quelque part.' },
      q_resp: { section: 'symptomes', kind: 'chercher', label: 'Respiration', text: 'Respire normalement, ne tousse pas.', how: 'Demande si elle respire bien.' },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: "A bu de l'eau hier soir ; rien depuis.", how: 'Demande si elle a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', text: 'Urines normales hier.', how: 'Demande si elle urine normalement.' },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande si elle est allée à la selle.' },
      q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements',
        text: "Marche avec son déambulateur ; ce matin, elle ne se sent pas assez solide pour se lever.", how: 'Demande comment elle se déplace.' },
      q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes', text: 'Pas de chute récente.', how: 'Demande si elle est tombée récemment.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: "S'est réveillée en nage vers 6 h.", how: 'Demande si elle a bien dormi.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Moral correct ; un peu inquiète de se sentir « toute drôle ».", how: 'Demande comment est son moral.' },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: 'Sa nièce Claire vient le mercredi.', how: 'Demande si sa famille vient la voir.' },
      q_equipe_nuit: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", alert: true,
        text: "Karim : à 6 h 30, elle a répondu avec retard. Hier soir, la collègue de soirée lui a dit qu'elle avait mangé la moitié de sa soupe.",
        how: "Interroge Karim, l'aide-soignant." },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris',
        text: "Une piqûre le soir, faite par l'infirmière, un comprimé pour la tension le matin ; pas encore pris aujourd'hui.", how: 'Demande quels médicaments elle prend.' },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: 'Cite le sucre, la tension et les reins : cohérent avec le dossier.', how: 'Demande quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "Raconte son séjour à l'hôpital avant d'arriver ; se plaît ici.", how: 'Demande pourquoi elle est arrivée ici.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'elle dit)', text: 'Aucune allergie : cohérent avec le dossier.', how: 'Demande si elle est allergique à un médicament.' },

      // En mesurant
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', text: '36,2 °C' },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true, text: '96 /min, régulier',
        meaning: "Plus rapide que son pouls habituel (76/min) : c'est fréquent quand la glycémie est basse (tremblements, cœur qui bat vite)." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', text: '138/72 mmHg' },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', text: '18 /min' },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', text: '96 % en air ambiant' },
      m_glyc: { section: 'constantes', kind: 'mesurer', label: 'Glycémie capillaire', key: true, alert: true, text: '0,46 g/L',
        meaning: "Bien en dessous de son habituel (1,10 g/L à jeun) et du seuil d'hypoglycémie (< 0,70 g/L). Elle explique les sueurs, les tremblements et la confusion. Tu ne décides pas seul : tu alertes l'infirmière tout de suite et tu restes avec elle." },
      m_douleur: { section: 'douleur', kind: 'mesurer', label: 'Douleur (échelle numérique)', text: '0/10' },

      // En observant
      o_teint: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
        text: "Visage pâle et moite, front perlé de sueur, chemise de nuit humide.", how: 'Observe la résidente.',
        meaning: "Pâleur et sueurs font partie des signes d'une glycémie basse. Ce sont des faits que tu vois, pas un diagnostic." },
      o_mains: { section: 'observations', kind: 'deduire', label: 'Mains', alert: true,
        text: 'Les mains tremblent quand elle essaie de tenir son verre.', how: 'Observe la résidente.' },
      o_vigilance: { section: 'observations', kind: 'deduire', label: 'Vigilance et déglutition', key: true, alert: true,
        text: "Éveillée mais ralentie : elle répond avec un peu de retard. Elle avale sa salive normalement.",
        how: 'Observe la résidente et parle-lui.',
        meaning: "Savoir si elle est bien éveillée et si elle peut avaler décide de ce qu'on peut faire : un apport de sucre par la bouche n'est possible qu'ainsi. Sinon, ce serait une urgence : rien par la bouche, appel à l'aide." },
      o_plateau: { section: 'observations', kind: 'deduire', label: 'Plateau d\'hier soir', alert: true,
        text: "Sur la desserte : la soupe est à moitié finie, le pain presque entier, le yaourt intact.", how: "Regarde le plateau d'hier soir.",
        meaning: "Un fait objectif qui confirme que le dîner n'a pas été pris." },
      o_table: { section: 'observations', kind: 'deduire', label: 'Table de chevet',
        text: 'Son carnet de glycémie et ses mots fléchés. Dernière ligne du carnet : « 19 h 45 : 1,34 g/L ».', how: 'Regarde la table de chevet.' },
      o_deamb: { section: 'risques', kind: 'deduire', label: 'Déambulateur', text: 'Rangé à côté du lit, à portée de main.', how: 'Regarde où se trouve le déambulateur.' },
      o_chaussons: { section: 'risques', kind: 'deduire', label: 'Chaussons', text: 'Au pied du lit : mules à semelle antidérapante.', how: 'Regarde ses chaussons.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', text: 'Accrochée au montant du lit, à portée de main.', how: 'Regarde où se trouve la sonnette.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: 'Bonjour… entrez, ma petite.' },
      c_presentation: { text: "Ah, l'étudiant… Enchantée. Moi, c'est Jeannine Blanc.", logs: ['g_presentation'] },
      c_explication:  { text: "Oui, oui… faites, ma petite. Je ne suis pas très en forme.", logs: ['g_explication'] },
      c_fin:          { text: 'Merci à vous. À tout à l\'heure.' }
    }), {
      q_comment_allez: { text: "Oh, je me sens toute bizarre ce matin… j'ai très chaud, mes mains tremblent et la tête me tourne un peu.", reveals: ['q_ressenti'] },
      q_motif:         { text: "Je suis arrivée après l'hôpital, avec mon sucre. Je m'y plais bien ici.", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "Je me suis réveillée vers six heures, tout en sueur et toute tremblante. Depuis, ça ne va pas mieux.", reveals: ['q_depuis'] },
      q_autre:         { text: "J'ai chaud, je tremble… et je ne sais plus très bien.", reveals: ['q_ressenti', 'q_trembler'] },

      q_douleur:      { text: 'Non, je n\'ai pas mal. Ce sont mes mains qui tremblent.', reveals: ['q_douleur'] },
      q_respiration:  { text: 'Je respire bien, je ne tousse pas.', reveals: ['q_resp'] },
      q_vertiges:     { text: "La tête me tourne un peu quand je bouge, et c'est un peu flou devant mes yeux.", reveals: ['q_vertiges'] },
      q_nausees:      { text: "Hier soir, j'avais mal au cœur. Plus ce matin.", reveals: ['q_nausees'] },
      q_froid:        { text: "Au contraire, j'ai très chaud ! J'ai transpiré toute la nuit, regardez, mon drap est mouillé.", reveals: ['q_sueurs'] },
      q_trembler:     { text: 'Oui, mes mains tremblent et mon cœur bat vite, vite…', reveals: ['q_trembler'] },

      q_alim:         { text: "Hier soir, je n'ai presque rien mangé : la moitié de ma soupe, un bout de pain. J'avais mal au cœur. Ce matin, je n'ai encore rien pris.", reveals: ['q_repas_hier'] },
      q_boisson:      { text: "J'ai bu de l'eau hier soir. Depuis, rien.", reveals: ['q_boisson'] },
      q_urines:       { text: 'Pareil que d\'habitude, je crois.', reveals: ['q_urines'] },
      q_selles:       { text: 'Ça va de ce côté-là.', reveals: ['q_selles'] },
      q_diabete:      { text: "J'ai eu ma piqûre hier soir, à huit heures, l'infirmière me la fait tous les soirs. Mon sucre ce matin ? Non, personne ne l'a encore regardé.", reveals: ['q_diabete'] },

      q_mobilite:     { text: "Je marche avec mon déambulateur, mais ce matin je ne me sens pas assez solide pour me lever.", reveals: ['q_mobilite'] },
      q_chute:        { text: 'Non, je ne suis pas tombée.', reveals: ['q_chute'] },
      q_sommeil:      { text: "J'ai dormi, et puis je me suis réveillée vers six heures, en nage.", reveals: ['q_sommeil'] },

      q_antecedents:  { text: 'Le sucre, la tension, les reins… et mes genoux.', reveals: ['q_atcd'] },
      q_traitements:  { text: "Ma piqûre le soir, c'est l'infirmière qui me la fait, et un petit comprimé pour la tension le matin. Je ne l'ai pas encore pris.", reveals: ['q_ttt'] },
      q_allergies:    { text: 'Allergique ? Non, à rien.', reveals: ['q_allerg'] },

      q_moral:        { text: "Ça va… mais je me sens toute drôle, ça m'inquiète un peu.", reveals: ['q_moral'] },
      q_entourage:    { text: 'Ma nièce Claire vient le mercredi.', reveals: ['q_entourage'] },
      q_orientation:  { text: "Nous sommes… samedi ? Non… Je dois aller faire mes courses, non ? Ah non, je suis à la résidence, dans ma chambre.", reveals: ['q_orientation'] },
      q_equipe:       { text: "(Karim, depuis la porte) « À 6 h 30, elle m'a répondu avec du retard, mais je ne l'ai pas dérangée. Et hier soir, la collègue m'a dit qu'elle avait mangé la moitié de sa soupe. »", reveals: ['q_equipe_nuit'] }
    }),
    fallbackAnswer: 'Non… je ne vois pas, ma petite.',
    notUnderstood: 'Pardon ? Je n\'ai pas bien compris… je suis un peu dans le brouillard.',
    whoAreYou: 'Excusez-moi… mais vous êtes qui, vous ?',

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, douleur: true, glyc: true, auto: [
      { id: 'g_repas', asked: ['q_alim', 'q_diabete'] },
      { id: 'g_environnement', objects: ['table', 'plateau'] }
    ] }),

    narration: B.narration(patient, {
      enter: "Tu entres dans la chambre 15. Mme Blanc est dans son lit, le front brillant de sueur ; elle ouvre les yeux avec un peu de retard."
    }),

    constTable: B.constTable({ temp: '36,5 °C', fc: '76 /min', pa: '142/76 mmHg', fr: '16 /min', spo2: '96 %', glyc: '1,10 g/L (à jeun)' }, { glyc: true, douleur: true }),

    objects: {
      patiente: { label: 'Observer Mme Blanc', icon: '👵', reveals: ['o_teint', 'o_mains', 'o_vigilance'],
        narration: "Tu observes Mme Blanc : visage pâle et moite, front perlé de sueur, mains qui tremblent. Elle est éveillée mais ralentie, et elle avale sa salive normalement." },
      table: { label: 'Table de chevet', icon: '📒', reveals: ['o_table'],
        narration: "Sur la table de chevet : son carnet de glycémie et ses mots fléchés. La dernière ligne du carnet indique « 19 h 45 : 1,34 g/L »." },
      plateau: { label: 'Plateau d\'hier soir', icon: '🍲', reveals: ['o_plateau'],
        narration: "Sur la desserte, le plateau d'hier soir n'a pas été débarrassé : la soupe est à moitié finie, le pain presque entier, le yaourt intact." },
      deambulateur: { label: 'Déambulateur', icon: '🦯', reveals: ['o_deamb'],
        narration: 'Le déambulateur est rangé à côté du lit, à portée de main.' },
      chaussons: { label: 'Chaussons', icon: '🥿', reveals: ['o_chaussons'],
        narration: 'Les chaussons sont au pied du lit : des mules à semelle antidérapante.' },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: 'La sonnette est accrochée au montant du lit, à portée de main.' }
    },

    grid: B.grid({ p: patient, douleur: true, glyc: { why: GLYC_WHY, ref: 'Soin appris en institut, à faire avec l\'accord de l\'infirmière (à confirmer avec ton formateur) · seuil d\'hypoglycémie : Fédération Française des Diabétiques' }, extra: [
      { id: 'g_repas', label: "Interroger sur le repas d'hier soir et sur le diabète (insuline, glycémie)",
        why: "Chez une personne diabétique sous insuline, le repas pris (ou non) et l'heure de l'injection expliquent souvent une glycémie basse.",
        ref: 'Fédération Française des Diabétiques · UE B3 S1 : entretien clinique débutant' },
      { id: 'g_environnement', label: "Observer l'environnement (table de chevet et carnet de glycémie, plateau d'hier soir)",
        why: "Le carnet et le plateau donnent des faits objectifs sur la glycémie de la veille et sur ce qui a été réellement mangé.",
        ref: 'UE B3 S1 : de l\'observation clinique au recueil de données (CM 4)' }
    ] }),

    discordance: {
      fact: 'q_repas_hier', el: 'a_repas',
      said: "✓ Tu as transmis que le dîner avait à peine été mangé alors que l'insuline avait été injectée et que le dossier disait « dîner pris » : c'est une information clé pour le médecin.",
      heard: "⚠ Tu avais appris que Mme Blanc avait à peine mangé hier soir, mais tu ne l'as pas transmis à Sophie. Un repas non pris après une injection d'insuline est une information qui change la prise en charge.",
      missed: "⚠ Tu n'as pas demandé ce que Mme Blanc avait mangé hier soir. Le dossier disait « dîner pris », alors qu'elle avait à peine mangé : toujours vérifier les apports d'une personne diabétique sous insuline."
    },

    alertSummary: "Pris seuls, ces signes peuvent sembler banals : une résidente qui transpire et qui est fatiguée. Mais ensemble (sueurs, tremblements, cœur plus rapide, confusion nouvelle, glycémie capillaire à 0,46 g/L, dîner à peine mangé après l'injection d'insuline), ils vont tous dans le même sens et ils sont nouveaux par rapport à l'état habituel. Chez une personne sous insuline, c'est une urgence à traiter vite. Tu ne poses pas de diagnostic et tu n'agis pas seul : tu restes avec elle, tu alertes l'infirmière tout de suite, tu vérifies qu'elle est éveillée et qu'elle peut avaler, et tu suis le protocole de resucrage du service avec son accord.",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de Mme Blanc ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: 'Elle est juste fatiguée et en sueur : je note les valeurs et je continue la toilette',
          unsafe: "Tu as jugé qu'il n'y avait rien à signaler alors que Mme Blanc avait des sueurs, des tremblements, une confusion nouvelle et une glycémie très basse.",
          feedback: "Les signes de Mme Blanc vont tous dans le même sens et sont nouveaux. Ne rien signaler et poursuivre la toilette (la lever, la doucher) l'exposerait à un malaise et à une chute. Un étudiant ne décide pas seul de la gravité : il alerte." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière référente, mais cela peut attendre la fin de la matinée",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors que la glycémie de Mme Blanc était très basse : c'est une situation à traiter dans les minutes qui suivent.",
          feedback: "Une glycémie très basse chez une personne qui reçoit de l'insuline se traite vite : sans correction, la confusion peut s'aggraver et mener à la perte de connaissance. On n'attend pas la fin de la matinée : on alerte tout de suite, en restant près d'elle." },
        { id: 'maintenant', pts: 10, verdict: 'good',
          label: "À signaler à l'infirmière référente maintenant, en restant auprès d'elle",
          feedback: "Bon réflexe. Tu as repéré que plusieurs signes se rejoignent, que la glycémie est très basse et que le dîner n'a pas été pris. Tu alertes l'infirmière tout de suite, sans quitter Mme Blanc : c'est l'étape suivante." },
        { id: 'quinze', pts: 4, verdict: 'avoid',
          label: "Urgence vitale : j'appelle le 15 moi-même, tout de suite",
          feedback: "Mme Blanc est éveillée et peut avaler : une hypoglycémie chez une personne consciente se prend d'abord en charge sur place, selon le protocole du service, avec l'infirmière. Si elle perdait connaissance ou n'arrivait plus à avaler, ce serait une urgence vitale : rien par la bouche et appel immédiat à l'aide (le 15 par l'infirmière)." }
      ],
      actionsQ: "En attendant l'arrivée de Sophie, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'aide', v: 'good', label: "Appeler à l'aide (sonnette ou en faisant venir Karim) pour que l'infirmière arrive, sans quitter Mme Blanc",
          why: "Elle ne doit pas rester seule : l'alerte se fait sans la quitter, avec la sonnette ou en demandant à un collègue." },
        { id: 'rester', v: 'good', label: 'Rester près d\'elle et lui parler pour surveiller sa vigilance',
          why: "Si elle devient plus somnolente ou ne répond plus, la situation change : il faut le voir tout de suite." },
        { id: 'assise', v: 'good', label: "L'installer assise ou demi-assise, bien éveillée, avant de lui donner quoi que ce soit à boire",
          why: "Boire allongée ou à moitié endormie expose à la fausse route : on s'assure qu'elle est éveillée et qu'elle avale." },
        { id: 'sucre', v: 'good', label: "La resucrer par la bouche (15 g de sucre : 3 morceaux, ou 15 cl de jus de fruit) selon le protocole du service, après avoir demandé l'accord de Sophie (au téléphone ou par Karim)",
          why: "Si elle est éveillée et peut avaler, 15 g de glucides font remonter la glycémie (Fédération Française des Diabétiques). Dans un EHPAD, le resucrage suit le protocole du service : tu demandes l'accord de Sophie tout de suite (téléphone ou Karim) et tu l'appliques dès qu'elle te le confirme, sans attendre qu'elle arrive." },
        { id: 'controle', v: 'good', label: 'Recontrôler la glycémie capillaire 15 minutes après le resucrage',
          why: "Le contrôle à 15 minutes vérifie que la glycémie remonte ; si elle reste basse, on recommence l'apport (Fédération Française des Diabétiques)." },
        { id: 'karim', v: 'good', label: "Prévenir Karim : pas de toilette, et petit-déjeuner à servir quand la glycémie de contrôle est remontée et qu'elle est bien éveillée",
          why: "Coordination de l'équipe : après le resucrage et le contrôle, un repas avec des féculents aide à garder la glycémie stable." },
        { id: 'plateau', v: 'good', label: "Laisser le plateau d'hier soir et le carnet de glycémie en place pour les montrer à l'infirmière",
          why: "Ce sont des faits objectifs sur ce qu'elle a réellement mangé et sur sa glycémie de la veille." },
        { id: 'sonnette', v: 'good', label: 'Lui demander de ne pas se lever seule et vérifier que la sonnette est à portée',
          why: "Vertiges, vue floue et sueurs : le risque de chute et de malaise est réel." },
        { id: 'dormir', v: 'danger', label: "La laisser se rendormir pour qu'elle récupère",
          why: "Une glycémie basse ne se corrige pas en dormant : elle peut encore baisser et mener à la perte de connaissance. On la surveille et on la resucre." },
        { id: 'insuline', v: 'danger', label: "Lui faire une injection d'insuline ou lui donner un traitement du diabète « pour équilibrer »",
          why: "L'insuline fait baisser la glycémie : en donner alors qu'elle est déjà trop basse est dangereux. Et un médicament ne se donne jamais sans l'accord de l'infirmière." },
        { id: 'lever', v: 'danger', label: 'La lever pour la toilette : ça la réveillera',
          why: "Avec des vertiges, des sueurs et une glycémie très basse, la lever risque un malaise et une chute." },
        { id: 'forcer', v: 'danger', label: "Lui donner à boire ou du sucre même si elle s'endort ou ne répond plus",
          why: "Donner à boire à une personne somnolente ou inconsciente expose à la fausse route (étouffement). Dans ce cas : rien par la bouche et appel immédiat à l'aide." },
        { id: 'beaucoup', v: 'avoid', label: 'Lui faire boire un grand verre de soda avec 6 morceaux de sucre pour être sûr',
          why: "Tu ne choisis pas la quantité : tu suis le protocole du service et l'accord de l'infirmière. Trop de sucre d'un coup fait remonter brutalement la glycémie ; on applique la quantité prévue, puis on recontrôle." },
        { id: 'mt', v: 'avoid', label: 'Appeler moi-même le médecin traitant',
          why: "Tu passes par l'infirmière : c'est elle qui contacte le médecin et qui décide ce qu'on lui transmet." }
      ]
    },

    call: {
      who: 'Sophie',
      intro: "Tu vas au poste de soins ou tu utilises le téléphone du service (ou tu fais venir Karim pour qu'il te remplace près de Mme Blanc). Sophie décroche : « Oui, Sophie ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Tu peux écrire en phrases courtes, comme tu les dirais à voix haute.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?', placeholder: 'Bonjour Sophie, c\'est … étudiant(e). Je suis chez …',
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies la résidente (nom, chambre)', ask: 'De quelle résidente parles-tu ?', re: [/blanc/, /jeannine/, /chambre (15|quinze)\b/, /\bch ?15\b/] },
            { id: 's_motif', w: 1, label: 'Tu dis pourquoi tu appelles (ce qui a changé)', ask: "Pourquoi m'appelles-tu ?",
              re: [/glycemie/, /sueur/, /trembl/, /confus/, /malaise/, /pas bien/, /change/, /inquiet/, /d habitude/, /somnol/, /difficile/, /bizarre/, /anormal/, /hypoglyc/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Elle a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile (diabète, hypertension, insuffisance rénale…)', ask: 'Elle a quels antécédents ?',
              re: [/diabet/, /hypertension/, /\bhta\b/, /renal/, /rein/, /arthrose/] },
            { id: 'a_ttt', w: 1, label: "Son insuline du soir (injectée hier à 20 h)", ask: 'Elle a eu son insuline hier soir ?',
              re: [/insuline/, /lantus/, /glargine/, /piqure/, /injection/, /stylo/] },
            { id: 'a_repas', w: 1, label: "Le dîner d'hier à peine mangé, alors que le dossier indique « pris »", ask: "Elle a mangé hier soir ?",
              re: [/peu mange/, /presque rien mange/, /pas mange/, /a peine mange/, /moitie/, /n a pas (fini|mange)/, /repas (non|pas)/, /diner (non|pas|a peine|incomplet)/, /mange (peu|la moitie|un peu)/, /mal au coeur/, /soupe/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : glycémie …, pouls …, elle est …',
          elements: [
            { id: 'e_glyc', w: 2, label: 'La glycémie capillaire avec sa valeur (0,46 g/L)', ask: 'Tu as mesuré sa glycémie ? Quelle valeur ?', re: [/\b0 46\b/, /\b46 ?(g|cg|centi)/, /\b4 6\b/] },
            { id: 'e_const', w: 1, label: "Au moins 3 autres constantes avec leur valeur (36,2 °C · 96/min · 138/72 · 18/min)", ask: 'Tu as pris ses constantes ?',
              need: { min: 3, re: [/\b36 2\b/, /\b96\b/, /\b138 (sur )?72\b/, /\b18\b/] } },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (glycémie 1,10 g/L, pouls 76…)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /avant/, /plus rapide/, /plus basse/, /par rapport/, /au lieu de/, /contre/, /\b76\b/, /\b1 10\b/] },
            { id: 'e_signes', w: 1, label: 'Au moins 2 signes : sueurs, tremblements, pâleur, confusion, vertiges, lenteur',
              ask: "Qu'est-ce que tu as remarqué d'autre chez elle ?",
              need: { min: 2, re: [/sueur/, /trembl/, /\bpale/, /moite/, /confus/, /desoriente/, /somnol/, /lente?\b/, /ralenti/, /bizarre/, /vertige/, /tete (lui )?tourne/, /vision/, /flou/, /en nage/] } },
          ],
          warn: { re: [/\bcoma\b/, /acidocetose/, /\bavc\b/, /infarctus/, /septique/, /sepsis/, /infection/], pen: 1,
            text: "Tu as nommé une maladie. Tu ne poses pas de diagnostic : tu décris ce que tu constates (valeurs, signes) et c'est l'infirmière puis le médecin qui interprètent." }
        },
        { id: 'D', label: 'D · Demande', hint: 'Qu\'attends-tu de Sophie, et pour quand ?', placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 2, label: 'Tu demandes à Sophie de venir voir / évaluer la résidente', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /voir (la |mme |madame |jeannine )/, /evalue/, /examin/, /jeter un oeil/, /regarde/, /vienne/, /viendr/] },
            { id: 'd_avis', w: 1, label: 'Tu demandes la conduite à tenir : resucrage selon le protocole, médecin à prévenir', ask: 'Tu veux que je prévienne le médecin ?',
              re: [/medecin/, /docteur/, /\bdr\b/, /lambert/, /protocole/, /resucr/, /sucre/, /avis medical/, /prescri/, /conduite a tenir/, /cat\b/, /que (dois|faut|fait|faire)/, /surveill/, /insuline/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (maintenant, tout de suite)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /rapidement/, /des que possible/, /urgent/, /\bvite\b/, /immediat/, /rapide/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est clair. J'arrive tout de suite. Reste avec elle, assise. Si elle est bien éveillée et qu'elle avale normalement, tu peux la resucrer maintenant : 15 g (3 morceaux de sucre ou 15 cl de jus de fruit), selon le protocole. Contrôle sa glycémie 15 minutes après. Je préviens le Dr Lambert.",
        mid: "D'accord, j'ai l'essentiel.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions.',
        final: "Merci, j'ai ce qu'il me faut. J'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: 'Je viens, mais dis-moi toujours ce que tu attends de moi.'
      },
      model: {
        S: "Bonjour Sophie, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 15 avec Mme Blanc, 91 ans. Je t'appelle parce qu'elle est en sueur, tremblante et un peu confuse, ce qui n'est pas habituel, et que sa glycémie est très basse.",
        A: "Elle est diabétique sous insuline, elle a de l'hypertension et une insuffisance rénale. Elle a eu son insuline hier soir à 20 h, mais elle a à peine mangé : la moitié de sa soupe, alors que le dossier disait « dîner pris ».",
        E: "Ce matin : glycémie capillaire 0,46 g/L (1,10 d'habitude à jeun), pouls 96 par minute (76 d'habitude), température 36,2 °C, tension 138/72, fréquence respiratoire 18. Elle est pâle, en sueur, les mains tremblent, la tête lui tourne. Elle est éveillée mais ralentie, et elle avale normalement.",
        D: "Je voudrais que tu viennes la voir tout de suite. Dis-moi si je peux la resucrer selon le protocole en t'attendant, et si on prévient le médecin. Je reste avec elle."
      },
      aiFacts: "Patiente fictive : Mme Jeannine Blanc, 91 ans, chambre 15, EHPAD. Diabète de type 2 sous insuline glargine (10 UI à 20 h, injectée hier), hypertension, insuffisance rénale chronique modérée. Habituellement : T 36,5 °C, pouls 76/min, PA 142/76, FR 16/min, SpO2 96 %, glycémie à jeun 1,10 g/L, vive et orientée. Ce matin : T 36,2 °C, pouls 96/min, PA 138/72, FR 18/min, SpO2 96 %, glycémie capillaire 0,46 g/L, douleur 0/10. Pâle, en sueur, mains qui tremblent, vertiges, légère confusion, éveillée mais ralentie, avale normalement. A à peine mangé hier soir (dossier : « dîner pris »), nausées hier soir. Réveillée en nage vers 6 h."
    },

    rx: {
      from: 'Dr Lambert, médecin traitant · prescription saisie dans le dossier de soins (après appel de Sophie)',
      title: 'Prescription du médecin',
      intro: "Sophie a prévenu le Dr Lambert. Quelques minutes plus tard, sa prescription apparaît dans le dossier de soins informatisé. Lis-la attentivement : c'est elle qui fait foi, pas ce que tu avais imaginé.",
      note: "Prescription fictive, écrite pour l'entraînement. Dans la réalité, elle dépend du médecin, de la situation et des protocoles du service (dont le protocole de resucrage).",
      lines: [
        { id: 'sucre', icon: '🍬', t: "Resucrage par voie orale : 15 g de glucides (3 morceaux de sucre ou 15 cl de jus de fruit), si la résidente est éveillée et capable d'avaler." },
        { id: 'controle', icon: '🩸', t: "Glycémie capillaire 15 minutes après le resucrage. Si elle reste inférieure à 0,70 g/L : renouveler le resucrage et rappeler le médecin." },
        { id: 'repas', icon: '🍞', t: "Petit-déjeuner complet (féculent + produit laitier) dès que la glycémie est remontée et qu'elle est bien éveillée." },
        { id: 'insuline', icon: '💉', t: "Insuline glargine de ce soir : le médecin réévaluera la dose avant l'injection. Ne pas injecter sans validation." },
        { id: 'surv', icon: '📈', t: "Glycémie capillaire avant chaque repas, au coucher et à 3 h cette nuit. Noter les valeurs et la quantité réellement mangée à chaque repas." },
        { id: 'lever', icon: '🦯', t: "Lever uniquement avec l'aide d'un soignant, une fois remise ; sonnette à portée." },
        { id: 'bio', icon: '🩺', t: "Bilan sanguin demain matin : créatinine, ionogramme, HbA1c." }
      ],
      discKnown: "Dîner d'hier : signalé à l'infirmière comme à peine mangé, alors que le dossier indiquait « pris ». Le médecin réévalue l'insuline du soir.",
      discUnknown: "Dîner d'hier : noté « pris » au dossier. À vérifier : la résidente affirme l'inverse."
    },

    written: {
      intro: "Il est 8 h 05. Sophie t'a rejoint, la prise en charge est lancée. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de la journée sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats).",
      rules: "Écris des faits observables, datés, sans jugement ni diagnostic. Évite les formules vagues (« RAS », « fatiguée »). Mentionne l'heure quand tu la connais.",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : glycémie basse avec sueurs et tremblements…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème ou un risque précis (glycémie basse, malaise, vigilance)',
              re: [/glycemie/, /hypoglyc/, /malaise/, /sueur/, /trembl/, /confus/, /vigilance/, /diabete/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : valeurs, signes, faits.', placeholder: 'Ex. : glycémie 0,46 g/L, en sueur, mains qui tremblent…', rows: 4, elements: [
            { id: 'w_glyc', w: 1, label: 'La glycémie capillaire avec sa valeur', re: [/\b0 46\b/, /\b46 ?(g|cg)/, /\b4 6\b/] },
            { id: 'w_const', w: 1, label: 'Au moins 3 autres constantes avec leur valeur', need: { min: 3, re: [/\b36 2\b/, /\b96\b/, /\b138 (sur )?72\b/, /\b18\b/] } },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /au lieu de/, /contre/, /\b76\b/, /\b1 10\b/] },
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : sueurs, tremblements, pâleur, confusion, vertiges', need: { min: 2, re: [/sueur/, /trembl/, /\bpale/, /moite/, /confus/, /desoriente/, /vertige/, /tete (lui )?tourne/, /ralenti/, /lente?\b/, /en nage/] } },
            { id: 'w_repas', w: 1, label: "Le repas d'hier soir (à peine mangé) et l'insuline injectée", re: [/peu mange/, /pas mange/, /a peine mange/, /soupe/, /insuline/, /lantus/, /piqure/, /diner/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiante/, /agacant/, /mauvaise volonte/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: 'Ce que toi et l\'équipe avez fait.', placeholder: 'Ex. : infirmière prévenue à …, resucrage selon protocole…', rows: 4, elements: [
            { id: 'w_ide', w: 2, label: "L'infirmière référente a été prévenue (qui, ce qu'elle a fait)", all: [/(sophie|\bide\b|infirmiere|infirmier|referente)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise)/] },
            { id: 'w_soins', w: 1, label: 'Tes actions de soin : restée près d\'elle, installée assise, resucrage, toilette reportée', re: [/reste/, /assise/, /installe/, /resucr/, /sucre/, /jus/, /protocole/, /toilette (reportee|differee|repoussee|annulee)/, /report/, /surveill/] },
            { id: 'w_presc', w: 1, label: 'Ce qui a été fait ou demandé ensuite : médecin, contrôle de la glycémie, petit-déjeuner', re: [/medecin/, /lambert/, /prescri/, /controle/, /glycemie (de controle|apres|a 15)/, /\b15 ?min/, /petit dej/, /petit-dej/, /insuline/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: 'Où en est la résidente après ces actions ? Qu\'est-ce qui reste à faire ?', placeholder: 'Ex. : glycémie à 15 min …, éveillée, petit-déjeuner pris', rows: 3, elements: [
            { id: 'r_etat', w: 2, label: "L'état de la résidente après tes actions (ou ce qu'on attend)", re: [/en attente/, /attente/, /prise en charge/, /remont/, /eveille/, /plus lucide/, /sans changement/, /inchange/, /stable/, /amelior/, /a bu/, /a mange/, /petit dej/, /resultat/, /est venue/, /arrive/, /controle/] },
            { id: 'r_suite', w: 1, label: 'La suite : glycémie à surveiller, insuline à réévaluer', re: [/glycemie/, /surveillance/, /a poursuivre/, /3 ?h/, /avant (chaque )?repas/, /insuline/, /medecin/, /a reevaluer/, /a verifier/, /a suivre/] }
          ] }
      ],
      model: {
        C: 'Glycémie basse avec sueurs, tremblements et confusion',
        D: "À [heure] : résidente pâle, en sueur, mains qui tremblent, vertiges, légèrement confuse, éveillée mais ralentie, avale normalement. Glycémie capillaire 0,46 g/L (habituel 1,10 à jeun). Pouls 96/min (habituel 76), T 36,2 °C, PA 138/72, FR 18/min, SpO2 96 %. A eu son insuline hier à 20 h mais a à peine mangé hier soir (soupe à moitié), alors que le dossier indiquait « dîner pris ».",
        A: "Infirmière (Sophie) prévenue à [heure], venue à [heure]. Restée près de la résidente, installée assise. Resucrage de 15 g selon le protocole avec l'accord de l'infirmière. Médecin prévenu par l'infirmière. Toilette reportée, aide-soignant prévenu.",
        R: "Glycémie de contrôle à 15 minutes : [valeur]. Résidente plus éveillée, petit-déjeuner pris. Glycémie à surveiller avant chaque repas, au coucher et à 3 h. Dose d'insuline du soir à réévaluer par le médecin."
      },
      aiFacts: null
    }
  });
})();
