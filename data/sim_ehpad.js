// data/sim_ehpad.js — Simulation clinique : scénarios EHPAD
// Chaque scénario est une simple fiche de données lue par core/simulation.js (recueil, décision, appel SAED, prescription, transmissions).
// ⚠ Patients et valeurs FICTIFS, à but pédagogique. Les protocoles de l'établissement priment.
// ⚠ Contenu à faire relire par ton formateur : chaque valeur cite sa source dans `ref`.
'use strict';
window.App = window.App || {};

App.SimScenarios = [
{
  id: 'ehpad_bilan_matin_1',
  title: 'Bilan du matin de Mme Martin',
  short: "Tu fais le bilan du matin d'une résidente de 86 ans. Quelque chose a changé depuis hier : à toi de le trouver.",
  level: 1, levelLabel: 'Débutant',
  setting: 'EHPAD', semestre: 'S1', ue: ['B.3'], duration: '15 à 20 min',
  status: 'Version à valider avec ton formateur',

  // Compétences du référentiel 2026 (arrêté du 20 février 2026) travaillées ici
  competences: [
    { n: 1,  label: 'Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique)' },
    { n: 3,  label: 'Réaliser des soins (surveillance, mesures, soins relationnels)' },
    { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe" },
    { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions)' }
  ],

  sources: [
    { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
      note: 'Objectifs du S1 : recueil structuré de données, entretien clinique débutant, repérage des signes de désadaptation ou d\'aggravation, transmissions ciblées.' },
    { label: 'Arrêté du 20 février 2026 (réingénierie de la formation infirmière)',
      url: 'https://www.fhf.fr/sites/default/files/2026-02/Arr%C3%AAt%C3%A9%20r%C3%A9ing%C3%A9nierie%20formation%20IDE.pdf',
      note: 'Compétences 1, 3, 9 et 13 ; la simulation en santé fait partie des outils de formation.' },
    { label: 'Particularités sémiologiques des infections du sujet âgé (infectiologie.com)',
      url: 'https://www.infectiologie.com/UserFiles/File/formation/desc/2018/avril-2018/conf1-particularites-semiologiques-des-infections-du-sujet-agehvallet.pdf',
      note: 'Présentation souvent atypique chez la personne âgée ; « drapeaux rouges » : confusion, perte rapide d\'autonomie, chute, décompensation ; fièvre absente ou discrète.' },
    { label: 'Les paramètres vitaux (IFSI de Nice, 2017)',
      url: 'https://extranet.chu-nice.fr/IFSI-de-Nice/uploads/Extranet/smartsection/1834_LES_PARAMETRES_VITAUX_2017.pdf',
      note: 'Températures normales 36,5–37,5 °C ; tachycardie > 100/min ; polypnée > 20/min ; hypotension < 100/50 mmHg. Seuil de saturation : à vérifier dans ton cours (CM 6).' },
    { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
      url: 'https://www.has-sante.fr/jcms/c_1776178',
      note: 'Utilisé pour l\'appel à l\'infirmière référente (étape Décision).' },
    { label: 'Guide du stage infirmier en EHPAD (Réussis ton IFSI : ta page de cours)',
      url: 'https://app.reussistonifsi.fr/cours/ehpad-2',
      note: 'Résidents accueillis (âge, GIR), risques à prévenir (chutes, dénutrition, déshydratation, escarres), rôle de l\'infirmier(e), vocabulaire du stage (IDEC, MT, PAP…). Page réservée aux abonnés : une connexion est demandée.' },
    { label: 'HAS : « Mauvaise nutrition, dénutrition et déshydratation » et « Chutes », fiches repère (12/2016)',
      note: 'Deux sources citées dans ta page EHPAD ; elles servent de base aux signes d\'alerte utilisés dans ce scénario.' }
  ],

  patient: { civ: 'Mme', nom: 'Martin', prenom: 'Lucienne', dob: '03/03/1940', age: 86, chambre: 12 },

  intro: {
    heure: '7 h 40',
    texte: "Tu es en stage dans un EHPAD, avec Sophie, l'infirmière référente, joignable au poste de soins. Ce matin, tu fais le bilan de Mme Martin, résidente de la chambre 12, avant sa toilette. Tu disposes d'environ vingt minutes.",
    equipe: "Transmissions de la nuit : « Nuit calme, RAS. » Karim, aide-soignant : « Je lui ai monté son plateau tout à l'heure. »",
    consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, puis repère ce qui doit alerter."
  },

  // ── Faits : tout ce qu'on peut apprendre sur la patiente ────────
  // kind : dossier | chercher (en questionnant) | mesurer | deduire (en observant)
  // key  : information importante pour la suite   alert : signe d'aggravation ou de risque
  facts: {
    // Dossier de soins
    d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
      text: 'Mme Lucienne MARTIN, née le 03/03/1940 (86 ans) · chambre 12 · bracelet d\'identification au poignet.' },
    d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'entrée",
      text: 'Entrée en EHPAD il y a 3 mois, après une chute à domicile avec perte d\'autonomie. Vit en chambre seule.' },
    d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
      text: 'Hypertension artérielle · arthrose lombaire · fracture du poignet droit après une chute (2024) · cataracte opérée.' },
    d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies',
      text: 'Aucune allergie connue (selon le dossier).' },
    d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
      text: 'Amlodipine 5 mg : 1 comprimé le matin · Paracétamol 1 g si douleur, maximum 3 g par 24 h (prescription « si besoin »).' },
    d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
      text: 'GIR 3 : marche avec déambulateur, toilette avec aide partielle, mange seule.' },
    d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
      text: 'Vive, orientée, participe aux animations, bon appétit. Sa fille Anne vient le dimanche.' },
    d_equipe: { section: 'psychosocial', kind: 'dossier', label: 'Équipe et contacts',
      text: 'Infirmière référente : Sophie (poste de soins) · aide-soignant : Karim · médecin traitant (MT) : Dr Lambert, joignable par l\'infirmière.' },
    d_pap: { section: 'autonomie', kind: 'dossier', label: 'Projet d\'accompagnement personnalisé (PAP)',
      text: 'Maintenir la marche avec le déambulateur, participation aux animations, toilette avec aide partielle.' },
    d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles', key: true,
      how: 'Lis le dossier de soins avant d\'entrer dans la chambre.',
      text: 'Température 36,6 °C · pouls 72/min · pression artérielle 138/78 mmHg · fréquence respiratoire 16/min · saturation 97 % · poids 58,5 kg (il y a 15 jours).',
      meaning: 'Ces valeurs servent de point de comparaison : une constante peut être « normale » en théorie et pourtant très différente de l\'habituel de la personne.' },

    // En questionnant
    q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
      text: 'Se dit très fatiguée, n\'a « pas envie de se lever ».',
      how: 'Demande-lui comment elle se sent ce matin.',
      meaning: 'Une fatigue inhabituelle chez une résidente d\'habitude vive est un changement par rapport à son état habituel.' },
    q_appetit: { section: 'histoire', kind: 'chercher', label: 'Alimentation', key: true, alert: true,
      text: 'A très peu mangé hier soir et n\'a rien pris ce matin.',
      how: 'Demande ce qu\'elle a mangé hier soir et ce matin, ou regarde le plateau.',
      meaning: 'La baisse de l\'appétit est un signe fréquent et discret chez la personne âgée quand son état se dégrade.' },
    q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', key: true, alert: true,
      text: 'A peu bu depuis hier, « pas soif ».',
      how: 'Demande si elle a bu normalement, ou regarde la carafe.',
      meaning: 'Une personne âgée ressent moins la soif : de faibles apports exposent à la déshydratation. Refuser de boire ou de manger fait partie des signes d\'alerte (ta page EHPAD).' },
    q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', key: true, alert: true,
      text: 'Urines moins fréquentes et plus foncées depuis hier ; pas de brûlure.',
      how: 'Demande si elle urine comme d\'habitude.',
      meaning: 'Des urines rares et foncées vont dans le sens de faibles apports en eau.' },
    q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur',
      text: 'Douleur au dos « comme d\'habitude » (arthrose) ; aucune autre douleur.',
      how: 'Demande si elle a mal quelque part.' },
    q_resp: { section: 'symptomes', kind: 'chercher', label: 'Respiration', key: true, alert: true,
      text: 'Un peu essoufflée quand elle se redresse ; ne tousse pas.',
      how: 'Demande si elle respire bien ou si elle tousse.',
      meaning: 'Un essoufflement nouveau est un signe à rapprocher de la fréquence respiratoire et de la saturation.' },
    q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', key: true, alert: true,
      text: 'La tête lui tourne quand elle se lève.',
      how: 'Demande si la tête lui tourne quand elle se lève.',
      meaning: 'Des vertiges au lever chez une résidente qui a déjà chuté augmentent le risque de chute (troubles de l\'équilibre, chute antérieure : signes d\'alerte de ta page EHPAD).' },
    q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande si elle est allée à la selle.' },
    q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: 'Pas de nausée ni de vomissement.', how: 'Demande si elle a des nausées.' },
    q_froid: { section: 'symptomes', kind: 'chercher', label: 'Froid, frissons',
      text: 'A eu « un peu froid » cette nuit ; pas de frissons francs.', how: 'Demande si elle a eu froid ou de la fièvre.' },
    q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil',
      text: 'A dormi, mais se sent « épuisée » ce matin.', how: 'Demande si elle a bien dormi.' },
    q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements',
      text: 'Marche avec son déambulateur ; a besoin d\'aide pour la douche.', how: 'Demande comment elle se déplace.' },
    q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes',
      text: 'Pas de chute récente (la dernière date de 2024).', how: 'Demande si elle est tombée récemment.' },
    q_depuis: { section: 'histoire', kind: 'chercher', label: 'Début des troubles', key: true,
      text: 'D\'après elle, depuis hier en début d\'après-midi.', how: 'Demande depuis quand elle se sent ainsi.',
      meaning: 'Le moment du début est une information à transmettre : c\'est la durée de l\'évolution.' },
    q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral',
      text: 'Moral correct ; un peu inquiète de ne pas avoir faim.', how: 'Demande comment est son moral.' },
    q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage',
      text: 'Sa fille Anne vient le dimanche ; deux petits-enfants.', how: 'Demande si sa famille vient la voir.' },
    q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', key: true,
      text: 'Donne la bonne date et le bon lieu : orientée dans le temps et l\'espace.',
      how: 'Demande-lui quel jour nous sommes et où elle se trouve.',
      meaning: 'Elle n\'est pas confuse pour le moment : c\'est une donnée à transmettre, car une confusion nouvelle serait un signe d\'alerte.' },
    q_allerg_pen: { section: 'allergies', kind: 'chercher', label: 'Allergie possible', key: true, alert: true,
      text: 'Pense qu\'on lui a déjà dit qu\'elle ne supportait pas la pénicilline (réaction non précisée). Le dossier ne le mentionne pas : information à vérifier.',
      how: 'Demande-lui si elle est allergique à un médicament.',
      meaning: 'Le dossier et la patiente ne disent pas la même chose : tu ne tranches pas, tu transmets l\'information pour qu\'elle soit vérifiée.' },
    q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris',
      text: 'Prend « une pilule pour la tension » le matin ; pas encore prise aujourd\'hui.', how: 'Demande quels médicaments elle prend.' },
    q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés',
      text: 'Cite la tension, le dos et son poignet cassé : cohérent avec le dossier.', how: 'Demande quels sont ses problèmes de santé.' },
    q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée',
      text: 'Raconte son arrivée après sa chute ; se plaît dans la résidence.', how: 'Demande pourquoi elle est arrivée ici.' },

    // En mesurant
    m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', key: true, alert: true,
      text: '37,6 °C',
      meaning: '37,6 °C dépasse la plage habituelle de 36,5–37,5 °C et le 36,6 °C de la résidente. Chez la personne âgée, la fièvre peut être absente ou discrète : un petit écart compte.' },
    m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true,
      text: '104 /min, régulier',
      meaning: 'Au-dessus de 100/min (tachycardie), alors que son pouls habituel est de 72/min.' },
    m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', key: true, alert: true,
      text: '108/62 mmHg',
      meaning: 'Pas en dessous de 100/50, mais bien plus basse que son habituel (138/78) : c\'est la comparaison à l\'habituel qui alerte.' },
    m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', key: true, alert: true,
      text: '22 /min',
      meaning: 'Au-dessus de 20/min (polypnée), alors que sa fréquence habituelle est de 16/min.' },
    m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', key: true, alert: true,
      text: '94 % en air ambiant',
      meaning: 'En baisse de 3 points par rapport à son habituel (97 %). Le seuil d\'alerte est à vérifier dans ton cours (CM 6).' },
    m_douleur: { section: 'douleur', kind: 'mesurer', label: 'Douleur (échelle numérique)',
      text: '2/10, au dos (douleur habituelle)' },

    // En observant
    o_teint: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
      text: 'Teint pâle, lèvres et bouche sèches.',
      how: 'Observe la résidente.',
      meaning: 'Une bouche sèche va dans le sens d\'une déshydratation. Peau et muqueuses sèches, urines rares et altération de l\'état mental font partie des signes à surveiller (ta page EHPAD).' },
    o_somnolence: { section: 'observations', kind: 'deduire', label: 'Vigilance', key: true, alert: true,
      text: 'Somnolente : ferme les yeux entre deux phrases, répond de façon cohérente mais lentement.',
      how: 'Observe la résidente.',
      meaning: 'D\'habitude vive, elle est somnolente : c\'est un changement par rapport à son état habituel.' },
    o_verre: { section: 'observations', kind: 'deduire', label: 'Carafe et verre', key: true, alert: true,
      text: 'Carafe d\'eau et verre sur la table de chevet : presque pleins.',
      how: 'Regarde la table de chevet.',
      meaning: 'Un fait objectif qui confirme les faibles apports en boisson.' },
    o_plateau: { section: 'observations', kind: 'deduire', label: 'Plateau du petit déjeuner', key: true, alert: true,
      text: 'Café froid, tartine et yaourt intacts.',
      how: 'Regarde le plateau du petit déjeuner.',
      meaning: 'Un fait objectif : « rien mangé ce matin » est confirmé.' },
    o_deamb: { section: 'risques', kind: 'deduire', label: 'Déambulateur', key: true, alert: true,
      text: 'Rangé contre le mur, à plus de 2 m du lit : hors de portée.',
      how: 'Regarde où se trouve le déambulateur.',
      meaning: 'Avec des vertiges au lever, un déambulateur hors de portée est un risque de chute.' },
    o_chaussons: { section: 'risques', kind: 'deduire', label: 'Chaussons',
      text: 'Au pied du lit : semelles lisses, talon non maintenu.',
      how: 'Regarde ses chaussons.',
      meaning: 'Des chaussons glissants ajoutent au risque de chute.' },
    o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette',
      text: 'Accrochée au montant du lit, à portée de main.', how: 'Regarde où se trouve la sonnette.' }
  },

  // ── Réponses de la patiente (voix de Mme Martin) ────────────────
  // `logs` valide un geste de la grille ; `reveals` ajoute des faits au recueil.
  answers: {
    c_salut:        { text: 'Bonjour… Entrez, entrez.' },
    c_presentation: { text: 'Ah, vous êtes l\'étudiant… Enchantée. Moi, c\'est Lucienne Martin.', logs: ['g_presentation'] },
    c_identite_q:   { text: "Lucienne Martin, née le trois mars mille neuf cent quarante. J'ai quatre-vingt-six ans.", logs: ['g_identite'] },
    c_explication:  { text: 'Très bien, très bien, faites ce qu\'il faut, ma petite.', logs: ['g_explication'] },
    c_accord:       { text: 'Oui, oui, bien sûr, vous pouvez.', logs: ['g_accord'] },
    c_intimite:     { text: 'Merci, c\'est gentil de fermer la porte.', logs: ['g_intimite'] },
    c_fin:          { text: 'Merci à vous. À tout à l\'heure.' },

    q_comment_allez: { text: 'Oh, bof… je suis très fatiguée ce matin. Je n\'ai pas envie de me lever.', reveals: ['q_ressenti'] },
    q_motif:         { text: 'Je suis arrivée ici après ma chute, à la maison. Je m\'y plais bien, vous savez.', reveals: ['q_motif'] },
    q_depuis_quand:  { text: 'Depuis hier, en début d\'après-midi, je crois bien.', reveals: ['q_depuis'] },
    q_autre:         { text: 'Non, à part que je suis fatiguée… et que je n\'ai pas faim du tout.', reveals: ['q_ressenti', 'q_appetit'] },

    q_douleur:      { text: 'Pas vraiment mal. Juste mon dos, comme d\'habitude. Rien d\'autre.', reveals: ['q_douleur'] },
    q_respiration:  { text: 'Je ne tousse pas. Mais je suis un peu essoufflée quand je me redresse.', reveals: ['q_resp'] },
    q_vertiges:     { text: 'Oui, tout à l\'heure la tête m\'a tourné quand je me suis levée.', reveals: ['q_vertiges'] },
    q_nausees:      { text: 'Non, pas de nausée, rien de tout ça.', reveals: ['q_nausees'] },
    q_froid:        { text: 'J\'ai eu un peu froid cette nuit. Je ne sais pas si j\'avais de la fièvre.', reveals: ['q_froid'] },

    q_alim:         { text: 'Hier soir, je n\'ai presque rien mangé, je n\'avais pas faim. Et ce matin, rien.', reveals: ['q_appetit'] },
    q_boisson:      { text: 'Je n\'ai pas soif. J\'ai à peine touché à mon verre.', reveals: ['q_boisson'] },
    q_urines:       { text: 'Je crois que j\'y suis allée moins souvent… et c\'était plus foncé. Pas de brûlure, non.', reveals: ['q_urines'] },
    q_selles:       { text: 'Ça va de ce côté-là, hier c\'était normal.', reveals: ['q_selles'] },

    q_mobilite:     { text: 'Je marche avec mon déambulateur. Pour la douche, il faut qu\'on m\'aide.', reveals: ['q_mobilite'] },
    q_chute:        { text: 'Non, pas de chute depuis longtemps. La dernière, c\'était avant de venir ici.', reveals: ['q_chute'] },
    q_sommeil:      { text: 'J\'ai dormi, mais je suis épuisée ce matin, comme si je n\'avais pas dormi.', reveals: ['q_sommeil'] },

    q_antecedents:  { text: 'La tension, le dos… et puis mon poignet, que je me suis cassé en tombant chez moi.', reveals: ['q_atcd'] },
    q_traitements:  { text: 'Une petite pilule pour la tension, le matin. Je ne l\'ai pas encore prise aujourd\'hui.', reveals: ['q_ttt'] },
    q_allergies:    { text: 'Allergique ? Je ne crois pas… Ah si, un ancien docteur m\'avait dit que je ne supportais pas la pénicilline. Je ne sais plus trop.', reveals: ['q_allerg_pen'] },

    q_moral:        { text: 'Ça va, mais je m\'inquiète un peu de ne pas avoir faim.', reveals: ['q_moral'] },
    q_entourage:    { text: 'Ma fille Anne vient le dimanche, avec les petits.', reveals: ['q_entourage'] },
    q_orientation:  { text: 'Nous sommes… lundi, non ? Et je suis à la résidence, dans ma chambre.', reveals: ['q_orientation'] }
  },

  // Réponses types quand la question ne concerne pas le scénario
  fallbackAnswer: 'Non… je ne vois pas, ma petite.',
  notUnderstood: 'Pardon ? Je n\'ai pas bien compris…',
  whoAreYou: 'Excusez-moi… mais vous êtes qui, vous ?',

  // ── Instruments : c'est l'étudiant qui fait le geste (choisir, poser au bon endroit, attendre / compter,
  //    lire l'écran, puis NOTER lui-même la valeur dans le recueil). ──
  //  kind : instant (courte attente) · wait (attente plus longue) · cuff (pose du brassard) · count (comptage chronométré) · scale (échelle)
  tools: {
    thermometre: { label: 'Thermomètre', icon: '🌡️', zone: 'zone-tete', kind: 'instant', seconds: 2, fact: 'm_temp',
      where: 'Le thermomètre se place au niveau de l\'oreille ou du front.',
      start: 'Tu approches le thermomètre de l\'oreille de Mme Martin.',
      display: { big: '37,6', unit: '°C' },
      input: { type: 'num', label: 'Température lue', unit: '°C', value: 37.6, tol: 0.05 },
      noted: 'Température : 37,6 °C' },
    pouls: { label: 'Prendre le pouls', icon: '✋', zone: 'zone-poignet', kind: 'count', seconds: 15, factor: 4, rate: 104, tol: 12, fact: 'm_fc',
      tap: 'Battement', unit: '/min',
      where: 'Le pouls se prend au poignet, avec deux doigts sur l\'artère radiale (jamais avec le pouce).',
      start: 'Tu poses deux doigts sur l\'artère radiale de Mme Martin.',
      intro: 'Sens les battements au poignet. Compte-les pendant 15 secondes en touchant « Battement » à chaque pulsation, puis multiplie par 4.',
      input: { label: 'Fréquence du pouls', unit: '/min', value: 104, tol: 0 },
      noted: 'Pouls : 104 /min, régulier' },
    tension: { label: 'Tensiomètre', icon: '🩺', zone: 'zone-bras', kind: 'cuff', seconds: 6, fact: 'm_pa',
      where: 'Le brassard se place sur le bras.',
      start: 'Tu prends le tensiomètre et tu t\'occupes du bras de Mme Martin.',
      cuff: [
        { id: 'epaule', label: 'En haut du bras, près de l\'épaule', ok: false, hint: 'Trop haut : le brassard se place juste au-dessus du pli du coude.' },
        { id: 'bon',    label: 'À 2 ou 3 cm au-dessus du pli du coude', ok: true },
        { id: 'coude',  label: 'Sur le pli du coude', ok: false, hint: 'Trop bas : le brassard gêne le pli du coude et fausse la mesure.' }
      ],
      display: { big: '108 / 62', unit: 'mmHg' },
      input: { type: 'bp', label: 'Pression artérielle lue', unit: 'mmHg', sys: 108, dia: 62, tol: 1 },
      noted: 'Pression artérielle : 108/62 mmHg' },
    respiration: { label: 'Compter la respiration', icon: '⏱️', zone: 'zone-thorax', kind: 'count', seconds: 30, factor: 2, rate: 22, tol: 4, fact: 'm_fr',
      tap: 'Inspiration', unit: '/min',
      where: 'On observe le mouvement du thorax, sans prévenir la résidente pour ne pas modifier sa respiration.',
      start: 'Tu regardes le thorax de Mme Martin se soulever, une montre à la main.',
      intro: 'Observe le thorax. Une montée = une respiration. Compte-les pendant 30 secondes en touchant « Inspiration » à chaque fois, puis multiplie par 2.',
      input: { label: 'Fréquence respiratoire', unit: '/min', value: 22, tol: 0 },
      noted: 'Fréquence respiratoire : 22 /min' },
    saturometre: { label: 'Saturomètre', icon: '🔴', zone: 'zone-doigt', kind: 'wait', seconds: 5, fact: 'm_spo2',
      where: 'Le saturomètre se pose au bout d\'un doigt.',
      start: 'Tu poses la pince du saturomètre sur le doigt de Mme Martin.',
      display: { big: '94', unit: '%', sub: 'SpO₂ et pouls, air ambiant', pulse: 104, note: "Note la saturation (SpO₂, en %), pas le pouls (PR). Le pouls affiché n'est qu'une indication : on prend quand même le pouls au poignet pour sentir son rythme." },
      input: { type: 'num', label: 'Saturation lue', unit: '%', value: 94, tol: 0 },
      noted: 'Saturation : 94 % en air ambiant' },
    douleur: { label: 'Échelle de douleur', icon: '😣', zone: '*', kind: 'scale', fact: 'm_douleur',
      where: 'L\'échelle se présente à la résidente.',
      start: 'Tu présentes l\'échelle de douleur à Mme Martin : « Entre 0 et 10, combien avez-vous mal ? »',
      patientSays: '« Je dirais 2… c\'est mon dos, comme d\'habitude. »',
      scale: 2,
      input: { type: 'num', label: 'Douleur indiquée', unit: '/10', value: 2, tol: 0, min: 0, max: 10 },
      noted: 'Douleur : 2/10, au dos (douleur habituelle)' }
  },
  toolOrder: ['thermometre', 'pouls', 'tension', 'respiration', 'saturometre', 'douleur'],
  // L'étiquette de chaque objet du chariot dans le dessin → instrument correspondant
  sceneTools: { 'tool-thermometre': 'thermometre', 'tool-tension': 'tension', 'tool-saturometre': 'saturometre', 'tool-montre': 'respiration' },

  // ── Gestes validés automatiquement quand certaines informations ont été recueillies ──
  autoGestures: [
    { id: 'g_constantes',    facts: ['m_temp', 'm_fc', 'm_pa', 'm_fr', 'm_spo2'] },
    { id: 'g_douleur',       facts: ['m_douleur'] },
    { id: 'g_trace',         facts: ['m_temp', 'm_fc', 'm_pa', 'm_fr', 'm_spo2', 'm_douleur'], trace: true },
    { id: 'g_nutrition',     asked: ['q_alim', 'q_boisson', 'q_urines'] },
    { id: 'g_environnement', objects: ['table', 'plateau', 'deambulateur', 'chaussons'] }
  ],

  // ── Phrases de mise en scène ────────────────────────────────────
  narration: {
    knock: 'Tu frappes à la porte et tu attends. « Entrez… » répond une voix.',
    enter: 'Tu entres dans la chambre 12. Mme Martin est dans son lit, légèrement redressée.',
    shaIn: 'Tu te frictionnes les mains avec la solution hydro-alcoolique.',
    shaOut: 'Tu te frictionnes à nouveau les mains avec la solution hydro-alcoolique.',
    shaAlready: 'Tu t\'es déjà frictionné les mains avant d\'entrer. Tu referas ce geste après le contact avec la résidente.'
  },

  // ── Tableau des constantes (colonnes : mesuré · habituel (dossier) · repère du cours) ──
  constTable: [
    { fact: 'm_temp',  label: 'Température',            usual: '36,6 °C',    norm: '36,5 à 37,5 °C' },
    { fact: 'm_fc',    label: 'Pouls',                  usual: '72 /min',    norm: '60 à 80 /min (tachycardie > 100)' },
    { fact: 'm_pa',    label: 'Pression artérielle',    usual: '138/78 mmHg', norm: '< 140/90 (hypotension < 100/50)' },
    { fact: 'm_fr',    label: 'Fréq. respiratoire',     usual: '16 /min',    norm: '16 à 20 /min (polypnée > 20)' },
    { fact: 'm_spo2',  label: 'Saturation',             usual: '97 %',       norm: 'à vérifier dans ton cours (CM 6)' },
    { fact: 'm_douleur', label: 'Douleur',              usual: '—',          norm: 'échelle de 0 à 10' }
  ],

  // ── Objets de la chambre (la scène dessinée de l'étape 2 réutilise ces identifiants) ──
  objects: {
    patiente:     { label: 'Observer Mme Martin', icon: '👵', reveals: ['o_teint', 'o_somnolence'],
      narration: 'Tu observes Mme Martin : teint pâle, lèvres sèches, elle ferme les yeux entre deux phrases.' },
    table:        { label: 'Table de chevet', icon: '🥛', reveals: ['o_verre'],
      narration: 'Sur la table de chevet, la carafe et le verre d\'eau sont presque pleins.' },
    plateau:      { label: 'Plateau du petit déjeuner', icon: '🍞', reveals: ['o_plateau'],
      narration: 'Le plateau du petit déjeuner n\'a pas été touché : café froid, tartine et yaourt intacts.' },
    deambulateur: { label: 'Déambulateur', icon: '🦯', reveals: ['o_deamb'],
      narration: 'Le déambulateur est rangé contre le mur, à plus de deux mètres du lit.' },
    chaussons:    { label: 'Chaussons', icon: '🥿', reveals: ['o_chaussons'],
      narration: 'Les chaussons sont au pied du lit : semelles lisses, talon non maintenu.' },
    sonnette:     { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
      narration: 'La sonnette est accrochée au montant du lit, à portée de main.' }
  },

  // ── Grille des gestes, révélée au bilan ─────────────────────────
  grid: [
    { id: 'g_dossier', stage: 'entree', label: 'Lire le dossier de soins avant d\'entrer',
      why: 'Tu entres en connaissant l\'identité, les antécédents, les traitements et les constantes habituelles : sans elles, tu ne peux pas repérer ce qui a changé.',
      ref: 'UE B3 S1 : recueil structuré de données (TD 10)' },
    { id: 'g_sha_in', stage: 'entree', label: 'Te frictionner les mains avant le contact',
      why: 'Prévention des infections associées aux soins : l\'hygiène des mains avant le contact fait partie des précautions standard.',
      ref: 'UE B3 S1 : TD 1 et TD 2 (hygiène des mains, précautions standard)' },
    { id: 'g_frapper', stage: 'entree', label: 'Frapper et attendre avant d\'entrer',
      why: 'La chambre est le lieu de vie de la résidente : on la respecte comme son domicile.',
      ref: 'Posture professionnelle (à confirmer avec ton formateur)' },
    { id: 'g_presentation', stage: 'contact', label: 'Te présenter (nom, étudiant infirmier)',
      why: 'La résidente doit savoir qui s\'occupe d\'elle et quel est ton rôle.',
      ref: 'UE B3 S1 : conduire un entretien clinique débutant' },
    { id: 'g_identite', stage: 'contact', label: 'Vérifier son identité (nom et date de naissance) et la comparer au dossier',
      why: 'Éviter une erreur de personne. Demander à la résidente de dire son nom et sa date de naissance, puis comparer avec le dossier ou le bracelet.',
      ref: 'UE B3 S1 : TD 3 (identitovigilance, traçabilité)' },
    { id: 'g_explication', stage: 'contact', label: 'Expliquer ce que tu vas faire',
      why: 'Informer la personne favorise sa coopération et respecte son droit d\'être informée.',
      ref: 'UE B3 S1 : soins relationnels' },
    { id: 'g_accord', stage: 'contact', label: 'Demander son accord',
      why: 'Aucun soin ne se fait sans l\'accord de la personne.',
      ref: 'UE B3 S1 : soins relationnels' },
    { id: 'g_intimite', stage: 'contact', label: 'Préserver l\'intimité (porte, rideau)',
      why: 'Respect de la dignité et de la pudeur, surtout avant un examen.',
      ref: 'Posture professionnelle (à confirmer avec ton formateur)' },
    { id: 'g_constantes', stage: 'recueil', label: 'Mesurer les cinq constantes (température, pouls, pression artérielle, fréquence respiratoire, saturation)',
      why: 'Les constantes sont des données objectives : elles se comparent à la normale et à l\'habituel de la personne.',
      ref: 'UE B3 S1 : CM 6, analyse et surveillance des paramètres vitaux' },
    { id: 'g_douleur', stage: 'recueil', label: 'Évaluer la douleur',
      why: 'La douleur fait partie des paramètres à surveiller et se mesure avec une échelle.',
      ref: 'UE B3 S1 : CM 6 (douleur, traçabilité)' },
    { id: 'g_brassard', stage: 'recueil', label: 'Poser le brassard au bon endroit (2 à 3 cm au-dessus du pli du coude)',
      why: 'Un brassard mal placé fausse la mesure de la pression artérielle.',
      ref: 'UE B3 S1 : CM 6, pression artérielle (à confirmer dans ton cours)' },
    { id: 'g_trace', stage: 'recueil', label: 'Lire l\'écran et noter chaque valeur sans erreur',
      why: 'La traçabilité repose sur des valeurs exactes : on relit l\'écran avant de noter dans le dossier.',
      ref: 'Compétence 13 (formaliser des documents professionnels) · UE B3 S1 : traçabilité (TD 3)' },
    { id: 'g_nutrition', stage: 'recueil', label: 'Interroger sur l\'alimentation, les boissons et les urines',
      why: 'Chez la personne âgée, la baisse des apports et des urines peut annoncer une déshydratation ou une infection, souvent sans fièvre franche.',
      ref: 'Infectiologie.com : particularités sémiologiques chez le sujet âgé' },
    { id: 'g_environnement', stage: 'recueil', label: 'Observer l\'environnement (carafe, plateau, déambulateur, chaussons)',
      why: 'L\'environnement donne des signes objectifs sur les apports réels et révèle les risques de chute.',
      ref: 'UE B3 S1 : de l\'observation clinique au recueil de données (CM 4)' },
    { id: 'g_sha_out', stage: 'recueil', label: 'Te frictionner les mains après le contact',
      why: 'L\'hygiène des mains se fait aussi après le contact, pour ne pas transmettre de germes à la résidente suivante.',
      ref: 'UE B3 S1 : TD 1 et TD 2 (hygiène des mains, précautions standard)' }
  ],

  // Discordance à repérer : l'allergie évoquée par la résidente ne figure pas au dossier.
  // fact : information à trouver pendant le recueil · el : élément de l'appel SAED qui la transmet.
  discordance: {
    fact: 'q_allerg_pen', el: 'a_allerg',
    said: "✓ Tu as transmis l'allergie possible à la pénicilline, absente du dossier : c'est exactement le réflexe attendu.",
    heard: "⚠ Tu avais appris que Mme Martin ne supportait peut-être pas la pénicilline, mais tu ne l'as pas transmis à Sophie. Une information discordante se transmet toujours : elle sera vérifiée par l'équipe.",
    missed: "⚠ Tu n'as pas demandé à Mme Martin si elle était allergique à un médicament. Elle t'aurait parlé de la pénicilline, absente du dossier : toujours vérifier les allergies."
  },

  // Messages affichés au bilan pour les familles de faits
  alertSummary: "Pris seuls, les signes de cette situation ne sont pas « graves » : moins de boissons, moins de repas, fatigue, pouls et respiration plus rapides, pression artérielle plus basse que d'habitude, vertiges au lever. Mais ils vont tous dans le même sens et ils sont nouveaux par rapport à l'état habituel de Mme Martin. Ce n'est pas à toi de poser un diagnostic : ton rôle est de repérer que plusieurs signes se rejoignent, de vérifier ce qui est discordant (l'allergie) et d'alerter l'infirmière référente.",

  // ══════════════════════════════════════════════════════════════════
  //  FIN DU SCÉNARIO : décision → appel à l'infirmière (SAED) → prescription → transmissions écrites
  //  ⚠ Tout ce contenu est FICTIF et à faire relire par ton formateur. La correction « hors ligne » fonctionne
  //  par mots-clés : elle repère la présence d'éléments attendus, elle ne comprend pas le sens d'une phrase.
  // ══════════════════════════════════════════════════════════════════

  decision: {
    intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
    levelQ: "Comment juges-tu la situation de Mme Martin ?",
    levels: [
      { id: "rien", pts: 0, verdict: "danger",
        label: "Rien d'anormal : je note les valeurs et je continue la toilette",
        feedback: "Les signes de Mme Martin sont nouveaux et vont tous dans le même sens : moins de boissons et de repas, fatigue, pouls et respiration plus rapides, pression artérielle plus basse que d'habitude, vertiges. Chez une personne âgée, la situation peut se dégrader vite, souvent sans fièvre franche : ne rien signaler est le principal risque. Un étudiant ne décide pas seul de la gravité : il alerte." },
      { id: "plustard", pts: 4, verdict: "avoid",
        label: "À signaler à l'infirmière référente, mais cela peut attendre la fin de la matinée",
        feedback: "Tu as raison de vouloir signaler, mais attendre expose Mme Martin : plusieurs signes sont nouveaux et elle a des vertiges au lever (risque de chute). On alerte dès qu'on repère l'ensemble, avant de poursuivre les soins." },
      { id: "maintenant", pts: 10, verdict: "good",
        label: "À signaler à l'infirmière référente maintenant, avant de continuer les soins",
        feedback: "Bon réflexe. Tu as repéré que plusieurs signes se rejoignent et qu'ils sont nouveaux par rapport à l'habituel de Mme Martin. Tu alertes l'infirmière référente tout de suite, en lui donnant des informations précises : c'est l'étape suivante." },
      { id: "quinze", pts: 4, verdict: "avoid",
        label: "Urgence vitale : j'appelle le 15 moi-même, tout de suite",
        feedback: "Ici, il n'y a pas de signe de détresse vitale (pas de malaise, pas de confusion, pas de douleur thoracique). Ce n'est pas à l'étudiant de déclencher le 15 : tu alertes l'infirmière référente, qui évalue et décide. Si l'état s'aggravait brutalement, tu appellerais immédiatement à l'aide (sonnette d'appel, collègues), sans attendre." }
    ],
    actionsQ: "En attendant l'arrivée de Sophie, que fais-tu ? Coche tout ce que tu ferais.",
    actionsMax: 15,
    actions: [
      { id: "repos", v: "good", label: "La laisser au repos, installée confortablement dans son lit",
        why: "Elle est somnolente et a des vertiges au lever : on évite tout effort et tout déplacement." },
      { id: "sonnette", v: "good", label: "Lui demander de sonner avant de se lever et vérifier que la sonnette est à portée",
        why: "Avec des vertiges, elle ne doit pas se lever seule : la sonnette à portée de main est la première protection contre la chute." },
      { id: "deamb", v: "good", label: "Rapprocher le déambulateur du lit, à portée de main",
        why: "Rangé à plus de 2 m, il ne sert à rien si elle se lève : on le met à portée tout en lui demandant d'appeler avant de se lever." },
      { id: "boire", v: "good", label: "Lui proposer à boire par petites gorgées, assise, si elle est bien éveillée",
        why: "Réflexe d'hydratation de base. À faire seulement si elle est bien éveillée et assise (risque de fausse route si elle somnole) ; demande aussi l'avis de l'infirmière sur les quantités." },
      { id: "karim", v: "good", label: "Prévenir Karim, l'aide-soignant, que la toilette est reportée en attendant l'avis de Sophie",
        why: "Coordination de l'équipe : tout le monde doit savoir qu'on ne la lève pas pour la toilette tant que l'infirmière n'a pas évalué la situation." },
      { id: "plateau", v: "good", label: "Laisser le plateau et la carafe en place pour les montrer à l'infirmière",
        why: "Un plateau intact et une carafe pleine sont des faits objectifs sur ce qu'elle a réellement pris : on les montre, on ne les débarrasse pas avant." },
      { id: "paracetamol", v: "danger", label: "Lui donner du paracétamol 1 g (prescrit « si besoin ») pour faire baisser la température",
        why: "37,6 °C n'est pas une fièvre franche et elle n'a pas mal (2/10, douleur habituelle). Surtout, un médicament ne se donne jamais sans l'accord de l'infirmière : un étudiant n'administre pas seul, et un antipyrétique pourrait masquer l'évolution de la température." },
      { id: "amlodipine", v: "danger", label: "Lui donner son comprimé pour la tension (amlodipine 5 mg) comme chaque matin",
        why: "Sa pression artérielle est déjà plus basse que d'habitude (108/62 au lieu de 138/78) : un médicament qui baisse encore la tension peut aggraver la situation. Donner ou non ce comprimé se décide avec l'infirmière et le médecin." },
      { id: "douche", v: "danger", label: "Faire sa toilette comme prévu : la lever et l'accompagner à la douche",
        why: "Somnolence, vertiges au lever, déambulateur hors de portée : le risque de chute est réel. On ne la lève pas avant l'avis de l'infirmière." },
      { id: "ecg", v: "avoid", label: "Brancher un électrocardiogramme (ECG) tout de suite pour vérifier son cœur",
        why: "L'ECG se fait habituellement sur prescription médicale (ou protocole du service), pas sur initiative d'un étudiant. Si le médecin le prescrit, tu pourras le réaliser dans la suite du scénario." },
      { id: "mt", v: "avoid", label: "Appeler moi-même le médecin traitant",
        why: "Tu passes par l'infirmière : c'est elle qui contacte le médecin et qui décide ce qu'on lui transmet." }
    ]
  },

  // ── Appel à l'infirmière référente : méthode SAED (HAS) ──
  call: {
    who: "Sophie",
    intro: "Tu vas au poste de soins ou tu utilises le téléphone du service. Sophie décroche : « Oui, Sophie ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Tu peux écrire en phrases courtes, comme tu les dirais à voix haute.",
    method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
    sections: [
      { id: "S", label: "S · Situation", hint: "Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?",
        placeholder: "Bonjour Sophie, c'est … étudiant(e). Je suis chez …",
        elements: [
          { id: "s_qui", w: 1, label: "Tu te présentes (étudiant(e), stagiaire)", ask: "Qui est à l'appareil ?",
            re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
          { id: "s_pat", w: 1, label: "Tu identifies la résidente (nom, chambre)", ask: "De quelle résidente parles-tu ?",
            re: [/martin/, /lucienne/, /chambre (12|douze)\b/, /\bch ?12\b/] },
          { id: "s_motif", w: 1, label: "Tu dis pourquoi tu appelles (ce qui a changé)", ask: "Pourquoi m'appelles-tu ?",
            re: [/inquiet/, /preoccup/, /change/, /differente/, /d habitude/, /se degrade/, /aggrav/, /etat general/, /depuis hier/, /\bfatigu/, /somnol/, /ne va pas/, /pas bien/, /anormal/, /inhabituel/] }
        ] },
      { id: "A", label: "A · Antécédents", hint: "Qu'est-ce qui est utile de son histoire ?",
        placeholder: "Elle a …",
        elements: [
          { id: "a_atcd", w: 1, label: "Un antécédent utile (hypertension, chute passée…)", ask: "Elle a quels antécédents ?",
            re: [/hypertension/, /\bhta\b/, /tension/, /arthrose/, /chute/, /fracture/, /poignet/] },
          { id: "a_ttt", w: 1, label: "Son traitement du matin (amlodipine pas encore prise)", ask: "Elle a pris son traitement ce matin ?",
            re: [/amlodipine/, /traitement/, /comprime/, /pilule/, /medicament/, /paracetamol/] },
          { id: "a_allerg", w: 1, label: "L'allergie possible à la pénicilline, absente du dossier", ask: "Et côté allergies, tu as vérifié ?",
            re: [/allerg/, /penicilline/, /penicil/] }
        ] },
      { id: "E", label: "E · Évaluation", hint: "Ce que tu as mesuré et observé, comparé à son habituel.",
        placeholder: "Ce matin : température …, pouls …, pression artérielle …",
        elements: [
          { id: "e_const", w: 2, label: "Au moins 3 constantes mesurées avec leur valeur (37,6 °C · 104/min · 108/62 · 22/min · 94 %)",
            ask: "Tu as pris ses constantes ? Dis-moi les valeurs.",
            need: { min: 3, re: [/\b37 6\b/, /\b104\b/, /\b108 (sur )?62\b/, /\b22\b/, /\b94\b/] } },
          { id: "e_compare", w: 1, label: "Tu compares à son habituel (72/min, 138/78, 97 %…)", ask: "C'est différent de d'habitude ?",
            re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /avant/, /plus basse/, /plus rapide/, /par rapport/, /au lieu de/, /contre/, /\b72\b/, /\b138\b/] },
          { id: "e_signes", w: 1, label: "Au moins 2 signes : somnolence, repas ou boissons, urines, vertiges, essoufflement, pâleur",
            ask: "Qu'est-ce que tu as remarqué d'autre chez elle ?",
            need: { min: 2, re: [/somnol/, /fatigu/, /mange/, /manger/, /\bbu\b/, /boit/, /boire/, /boisson/, /apport/, /urine/, /vertige/, /tete (lui )?tourne/, /essouffl/, /\bpale/, /bouche seche/, /seche/] } },
          { id: "e_prec", w: 1, label: "Un risque ou un état : orientation, douleur, risque de chute, déambulateur", ask: "Elle est orientée ? Elle a mal ? Un risque de chute ?",
            re: [/oriente/, /confus/, /douleur/, /chute/, /deambulateur/, /lucide/, /vertige/] }
        ],
        warn: { re: [/infection urinaire/, /pneumonie/, /pneumopathie/, /sepsis/, /septique/, /covid/, /grippe/, /infarctus/, /\bavc\b/, /embolie/], pen: 1,
          text: "Tu as nommé une maladie. Tu ne poses pas de diagnostic : tu décris ce que tu constates (valeurs, signes) et c'est l'infirmière puis le médecin qui interprètent." }
      },
      { id: "D", label: "D · Demande", hint: "Qu'attends-tu de Sophie, et pour quand ?",
        placeholder: "Je voudrais que tu …",
        elements: [
          { id: "d_venir", w: 2, label: "Tu demandes à Sophie de venir voir / évaluer la résidente", ask: "Et qu'est-ce que tu attends de moi ?",
            re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /voir (la |mme |madame |lucienne )/, /evalue/, /examin/, /ausculte/, /jeter un oeil/, /regarde/, /vienne/, /viendr/] },
          { id: "d_avis", w: 1, label: "Tu demandes s'il faut prévenir le médecin / quelle conduite à tenir", ask: "Tu veux que je prévienne le médecin ?",
            re: [/medecin/, /docteur/, /\bdr\b/, /lambert/, /avis medical/, /prescri/, /conduite a tenir/, /cat\b/, /que (dois|faut|fait|faire)/, /surveill/] },
          { id: "d_delai", w: 1, label: "Tu précises le délai (maintenant, avant la toilette)", ask: "C'est pour quand ?",
            re: [/maintenant/, /tout de suite/, /rapidement/, /des que possible/, /urgent/, /\bvite\b/, /dans (les )?(5|10|quelques) min/, /avant (la |sa )?toilette/, /rapide/, /immediat/] }
        ] }
    ],
    reply: {
      good: "Merci, c'est clair et complet. J'arrive dans cinq minutes. D'ici là, laisse-la au repos et ne la lève pas. Je préviens le Dr Lambert.",
      mid: "D'accord, j'ai l'essentiel.",
      low: "Je ne suis pas sûre de bien comprendre la situation.",
      retry: "Rappelle-moi avec ces précisions.",
      final: "Merci, j'ai ce qu'il me faut. J'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
      noDemand: "Je viens, mais dis-moi toujours ce que tu attends de moi."
    },
    model: {
      S: "Bonjour Sophie, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 12 avec Mme Martin, 86 ans. Je t'appelle parce que son état a changé depuis hier : elle est très fatiguée, somnolente, et elle a presque rien mangé ni bu.",
      A: "Elle a de l'hypertension, de l'arthrose, et elle est tombée en 2024 (fracture du poignet). Elle n'a pas encore pris son amlodipine ce matin. Elle me dit qu'elle ne supporte peut-être pas la pénicilline, mais ce n'est pas dans son dossier.",
      E: "Ce matin : température 37,6 °C, pouls 104 par minute (72 d'habitude), tension 108/62 (138/78 d'habitude), fréquence respiratoire 22 par minute (16 d'habitude), saturation 94 % en air ambiant (97 % d'habitude), douleur 2 sur 10 comme d'habitude. Elle est pâle, la bouche sèche, elle urine moins et plus foncé, la tête lui tourne quand elle se lève. Elle est orientée. Son déambulateur est hors de portée.",
      D: "Je voudrais que tu viennes la voir maintenant, avant sa toilette, et que tu me dises si on prévient le médecin et ce que je dois surveiller en attendant."
    },
    aiFacts: "Patiente fictive : Mme Lucienne Martin, 86 ans, chambre 12, EHPAD. Habituellement : T 36,6 °C, pouls 72/min, PA 138/78, FR 16/min, SpO2 97 %, vive et orientée. Ce matin : T 37,6 °C, pouls 104/min, PA 108/62, FR 22/min, SpO2 94 % en air ambiant, douleur 2/10 habituelle (dos). Somnolente, pâle, bouche sèche, a très peu mangé et bu depuis hier, urines rares et foncées, vertiges au lever, orientée. Antécédents : hypertension, arthrose, chute avec fracture du poignet en 2024. Traitement : amlodipine 5 mg le matin (pas encore prise), paracétamol si besoin. Dossier : aucune allergie connue ; la patiente dit ne pas supporter la pénicilline (à vérifier). Déambulateur hors de portée, chaussons glissants."
  },

  // ── Prescription du médecin traitant (fictive) ──
  rx: {
    from: "Dr Lambert, médecin traitant · prescription saisie dans le dossier de soins",
    intro: "Sophie a prévenu le Dr Lambert. Quelques minutes plus tard, sa prescription apparaît dans le dossier de soins informatisé. Lis-la attentivement : c'est elle qui fait foi, pas ce que tu avais imaginé.",
    note: "Prescription fictive, écrite pour l'entraînement. Dans la réalité, elle dépend du médecin, de la situation et des protocoles du service.",
    lines: [
      { id: "ecg", icon: "🫀", t: "ECG 12 dérivations ce matin.", ecg: true },
      { id: "bio", icon: "🩸", t: "Bilan sanguin ce matin : numération (NFS), CRP, ionogramme, urée, créatinine." },
      { id: "bu", icon: "🧪", t: "Bandelette urinaire ; ECBU si la bandelette est positive." },
      { id: "hydra", icon: "🥛", t: "Hydratation orale fractionnée tout au long de la journée ; noter les quantités bues." },
      { id: "surv", icon: "📈", t: "Surveillance toutes les 4 heures : température, pouls, pression artérielle, fréquence respiratoire, saturation, vigilance. Rappeler en cas d'aggravation." },
      { id: "amlo", icon: "💊", t: "Amlodipine : ne pas donner ce matin ; le médecin réévaluera." },
      { id: "para", icon: "💊", t: "Paracétamol : uniquement en cas de douleur ou de fièvre, après avis de l'infirmière." },
      { id: "atb", icon: "⛔", t: "Pas d'antibiotique avant les résultats du bilan." },
      { id: "lever", icon: "🦯", t: "Lever uniquement avec l'aide d'un soignant, déambulateur à portée." }
    ],
    allergyKnown: "Allergie : pénicilline suspectée, signalée par l'étudiant(e) à l'infirmière : à vérifier auprès de la famille et du dossier d'admission avant toute antibiothérapie.",
    allergyUnknown: "Allergies : aucune connue (d'après le dossier).",
    ecgCtx: {
      patient: { nom: "MARTIN", prenom: "Lucienne", dn: "03/03/1940", age: 86 },
      rate: 104,
      situation: "Le Dr Lambert a prescrit un ECG 12 dérivations à Mme Martin (pouls à 104/min ce matin). Sophie te demande de le réaliser pendant qu'elle prépare le bilan sanguin. Elle reste à côté de toi : en 1re année, un geste technique se fait toujours sous la supervision d'un soignant."
    }
  },

  // ── Transmissions écrites (ciblées : cible + données, actions, résultats) ──
  written: {
    intro: "Il est 8 h 30. Sophie t'a rejoint, la prise en charge est lancée. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de l'après-midi sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats).",
    rules: "Écris des faits observables, datés, sans jugement ni diagnostic. Évite les formules vagues (« RAS », « fatiguée »). Mentionne l'heure quand tu la connais.",
    fields: [
      { id: "C", label: "Cible", hint: "Le problème ou le risque, en quelques mots.", placeholder: "Ex. : baisse des apports…", rows: 1, elements: [
          { id: "c_cible", w: 2, label: "La cible nomme un problème ou un risque précis (apports, état général, vigilance, risque de chute)",
            re: [/deshydrat/, /apport/, /alimentation/, /boisson/, /hydrat/, /etat general/, /alteration/, /fatigue/, /asthenie/, /somnol/, /vigilance/, /risque de chute/, /chute/, /inappetence/, /appetit/, /constantes/] },
          { id: "c_court", w: 1, label: "La cible est courte (quelques mots, 14 mots au plus)", test: (n, words) => words >= 2 && words <= 14 }
        ] },
      { id: "D", label: "D · Données", hint: "Ce que tu as constaté : valeurs, signes, faits.", placeholder: "Ex. : résidente somnolente, pâle… T …, FC …", rows: 4, elements: [
          { id: "w_const", w: 2, label: "Au moins 3 constantes avec leur valeur", need: { min: 3, re: [/\b37 6\b/, /\b104\b/, /\b108 (sur )?62\b/, /\b22\b/, /\b94\b/] } },
          { id: "w_hab", w: 1, label: "Comparaison avec son habituel", re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /au lieu de/, /contre/, /\b72\b/, /\b138\b/, /\b97\b/] },
          { id: "w_signes", w: 1, label: "Au moins 2 signes : somnolence, apports, urines, vertiges, pâleur", need: { min: 2, re: [/somnol/, /fatigu/, /mange/, /manger/, /\bbu\b/, /boit/, /boire/, /boisson/, /apport/, /urine/, /vertige/, /tete (lui )?tourne/, /essouffl/, /\bpale/, /bouche seche/, /seche/] } },
          { id: "w_risque", w: 1, label: "Le risque de chute (vertiges, déambulateur hors de portée)", re: [/chute/, /deambulateur/, /vertige/] }
        ],
        warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiante/, /agacant/, /mauvaise volonte/, /refuse expres/, /theatre/, /cinema/], pen: 1,
          text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
      { id: "A", label: "A · Actions", hint: "Ce que toi et l'équipe avez fait.", placeholder: "Ex. : infirmière prévenue à …, résidente laissée au repos…", rows: 4, elements: [
          { id: "w_ide", w: 2, label: "L'infirmière référente a été prévenue (qui, ce qu'elle a fait)", all: [/(sophie|\bide\b|infirmiere|infirmier|referente)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise)/] },
          { id: "w_soins", w: 1, label: "Tes actions de soin : repos, déambulateur ou sonnette, toilette reportée, boissons", re: [/repos/, /surveill/, /installe/, /allonge/, /boire/, /boisson/, /hydrat/, /deambulateur/, /sonnette/, /toilette (reportee|differee|repoussee|annulee)/, /report/] },
          { id: "w_presc", w: 1, label: "Ce qui a été fait ou demandé ensuite : ECG, prélèvement, prescription", re: [/ecg/, /electrocardiogramme/, /prise de sang/, /bilan/, /prelevement/, /bandelette/, /prescri/, /medecin/, /lambert/] }
        ] },
      { id: "R", label: "R · Résultats", hint: "Où en est la résidente après ces actions ? Qu'est-ce qui reste à faire ?", placeholder: "Ex. : en attente du bilan, a bu…, surveillance à poursuivre", rows: 3, elements: [
          { id: "r_etat", w: 2, label: "L'état de la résidente après tes actions (ou ce qu'on attend)", re: [/en attente/, /attente/, /prise en charge/, /a bu/, /a pris/, /repose/, /endormi/, /installe/, /plus calme/, /sans changement/, /inchange/, /stable/, /aggrav/, /amelior/, /resultat/, /vient/, /est venue/, /arrive/] },
          { id: "r_suite", w: 1, label: "La suite : ce qui reste à surveiller ou à refaire", re: [/surveillance/, /a poursuivre/, /a reevaluer/, /reevalu/, /prochaine/, /toutes les/, /a surveiller/, /a suivre/, /a continuer/, /a verifier/, /a revoir/] }
        ] }
    ],
    model: {
      C: "Baisse des apports et altération de l'état général",
      D: "À [heure] : résidente somnolente, pâle, bouche sèche, très fatiguée. A peu mangé et bu depuis hier, urines moins fréquentes et foncées, vertiges au lever. T 37,6 °C, pouls 104/min (habituel 72), PA 108/62 (habituel 138/78), FR 22/min (habituel 16), SpO2 94 % (habituel 97 %), douleur 2/10 habituelle. Orientée. Déambulateur hors de portée. Dit ne pas supporter la pénicilline, non noté au dossier.",
      A: "Infirmière (Sophie) prévenue à [heure], venue à [heure]. Résidente laissée au repos, sonnette et déambulateur à portée, toilette reportée, aide-soignant prévenu. Plateau et carafe montrés à l'infirmière. ECG réalisé avec l'infirmière. Amlodipine non donnée, selon prescription.",
      R: "En attente du bilan sanguin. Résidente calme, a bu un demi-verre à petites gorgées. Surveillance des constantes toutes les 4 h à poursuivre. Allergie à vérifier auprès de la famille."
    },
    aiFacts: null
  }
}
];
