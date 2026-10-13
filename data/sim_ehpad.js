// data/sim_ehpad.js — Simulation clinique : scénarios EHPAD
// Chaque scénario est une simple fiche de données lue par core/simulation.js.
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
      note: 'Utilisé à l\'étape Transmissions (étape suivante du développement).' }
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
      meaning: 'Une personne âgée ressent moins la soif : de faibles apports exposent à la déshydratation.' },
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
      meaning: 'Des vertiges au lever chez une résidente qui a déjà chuté augmentent le risque de chute.' },
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
      meaning: 'Une bouche sèche va dans le sens d\'une déshydratation.' },
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
    c_identite_q:   { text: 'Lucienne Martin, née le trois mars mille neuf cent quarante.', logs: ['g_identite'] },
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

  // ── Instruments (mesures) ───────────────────────────────────────
  measures: {
    temperature: { label: 'Thermomètre', icon: '🌡️', fact: 'm_temp',
      narration: 'Tu prends la température de Mme Martin : 37,6 °C.' },
    pouls: { label: 'Prendre le pouls', icon: '🫀', fact: 'm_fc',
      narration: 'Tu prends le pouls au poignet pendant une minute : 104 par minute, régulier.' },
    tension: { label: 'Tensiomètre', icon: '🩺', fact: 'm_pa',
      narration: 'Tu mesures la pression artérielle : 108/62 mmHg.' },
    respiration: { label: 'Compter la respiration', icon: '🫁', fact: 'm_fr',
      narration: 'Tu comptes les mouvements respiratoires pendant une minute : 22 par minute.' },
    saturation: { label: 'Saturomètre', icon: '🔴', fact: 'm_spo2',
      narration: 'Tu poses le saturomètre au doigt : 94 % en air ambiant.' },
    douleur: { label: 'Échelle de douleur', icon: '😣', fact: 'm_douleur',
      narration: 'Tu lui demandes de situer sa douleur de 0 à 10 : « 2, au dos, comme d\'habitude. »' }
  },

  // ── Gestes validés automatiquement quand certaines informations ont été recueillies ──
  autoGestures: [
    { id: 'g_constantes',    facts: ['m_temp', 'm_fc', 'm_pa', 'm_fr', 'm_spo2'] },
    { id: 'g_douleur',       facts: ['m_douleur'] },
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

  // Messages affichés au bilan pour les familles de faits
  alertSummary: "Pris seuls, les signes de cette situation ne sont pas « graves » : moins de boissons, moins de repas, fatigue, pouls et respiration plus rapides, pression artérielle plus basse que d'habitude, vertiges au lever. Mais ils vont tous dans le même sens et ils sont nouveaux par rapport à l'état habituel de Mme Martin. Ce n'est pas à toi de poser un diagnostic : ton rôle est de repérer que plusieurs signes se rejoignent, de vérifier ce qui est discordant (l'allergie) et d'alerter l'infirmière référente."
}
];
