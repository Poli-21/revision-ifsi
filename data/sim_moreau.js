// data/sim_moreau.js — Simulation clinique : scénario EHPAD n° 5, M. Moreau (détresse respiratoire + gaz du sang)
// Même structure que data/sim_ehpad.js (Mme Martin). Les briques communes viennent de data/sim_base.js.
// L'étape « consignes » comprend un atelier FACULTATIF de lecture d'un gaz du sang (App.Gazo.workshop).
// ⚠ Patient et valeurs FICTIFS, à but pédagogique. Les protocoles de l'établissement et les consignes du SAMU priment.
// ⚠ Contenu à faire relire par ton formateur : chaque élément cite sa source ou précise qu'il est à confirmer.
// ⚠ Un gaz du sang n'est PAS réalisé en EHPAD : dans le scénario, le résultat vient de l'équipe de secours
//   (analyseur portable) ; le scénario ne demande jamais à l'étudiant de prélever.
'use strict';
window.App = window.App || {};
App.SimScenarios = App.SimScenarios || [];

(() => {
  const B = App.SimBase;
  const patient = { civ: 'M.', nom: 'Moreau', prenom: 'Gérard', dob: '12/06/1950', dobMots: 'douze juin mille neuf cent cinquante', age: 76, chambre: 14, sexe: 'M', avatar: '👴' };
  // Nombre de constantes citées avec leur valeur (la PA « 150/86 » ne compte pas aussi pour la saturation « 86 »)
  const _nConst = n => [/\b38 1\b/, /\b108\b/, /\b150\b/, /\b28\b/].filter(re => re.test(n)).length + (/\b86\b/.test(n.replace(/\b150 (sur )?86\b/g, ' ')) ? 1 : 0);
  const T = B.tools({ p: patient, de: 'de M. Moreau', temp: 38.1, fc: { rate: 108, rhythm: 'régulier' }, pa: [150, 86], fr: 28, spo2: 86 });

  // Gaz du sang du scénario (valeurs fictives, cohérentes entre elles : équation d'Henderson-Hasselbalch)
  const GAZ = {
    who: "M. Moreau, 76 ans, BPCO, essoufflé, somnolent, fièvre. Gaz du sang réalisé par l'équipe du SMUR à son arrivée, avec un analyseur portable.",
    gaz: { ph: 7.29, pao2: 54, paco2: 66, hco3: 31 },
    ans: { ph: 'acid', paco2: 'up', hco3: 'up', tr: 'acres', comp: 'metab', o2: 'hypo' },
    clin: "Chez un patient atteint de BPCO, une infection des bronches (toux, crachats jaune-vert, fièvre) peut faire « décompenser » la maladie : il ventile moins bien, le CO₂ s'accumule (PaCO₂ 66) et l'oxygène baisse (PaO₂ 54). Les HCO₃⁻ élevés (31) suggèrent une compensation rénale installée avant l'aggravation ; elle reste partielle car le pH est encore bas. L'excès de CO₂ peut expliquer la somnolence (ton CM9 : désorientation, obnubilation). Valeurs fictives."
  };

  App.SimScenarios.push({
    id: 'ehpad_bpco_5',
    title: 'Le souffle de M. Moreau',
    short: "Tu passes voir un résident de 76 ans atteint de BPCO. Il parle par petits bouts de phrases, les lèvres bleutées. Que fais-tu, et que comprends-tu de son gaz du sang ?",
    icon: '🫁',
    level: 3, levelLabel: 'Avancé',
    setting: 'EHPAD', semestre: 'S1', ue: ['B.3'], duration: '20 à 25 min',
    status: 'Version à valider avec ton formateur',
    competences: [
      { n: 1,  label: 'Élaborer le diagnostic infirmier (analyse de situation, raisonnement clinique, lecture sommaire d\'un gaz du sang)' },
      { n: 3,  label: 'Réaliser des soins (surveillance de la fréquence respiratoire et de la saturation, installation confortable)' },
      { n: 6,  label: 'Communiquer et conduire une relation dans un contexte de soins (rassurer une personne essoufflée)' },
      { n: 9,  label: "Coordonner les activités de soins et partager l'information avec l'équipe (alerte)" },
      { n: 13, label: 'Formaliser des documents professionnels (traçabilité, transmissions)' }
    ],
    sources: [
      { label: 'Ton cours B3 – CM9 : mesure de la FR, SpO2 et signes cutanés',
        note: "Fréquence respiratoire normale de l'adulte 12 à 20/min · SpO2 normale ≥ 94 %, objectif de 88 à 92 % chez l'insuffisant respiratoire chronique · signes d'alerte : tirage intercostal, tirage du sterno-cléido-mastoïdien, balancement thoraco-abdominal, cyanose, sueurs · une augmentation du CO2 peut donner une désorientation et une obnubilation." },
      { label: 'Ton cours B3 – CM10 : position d\'attente, oxygénothérapie, interprétation des gaz du sang',
        note: "Position assise ou demi-assise (dossier relevé à plus de 30°) devant une difficulté respiratoire · l'oxygène est un médicament (prescription ; initiation = rôle prescrit, non délégable ; surveillance = rôle propre, délégable) · démarche d'interprétation des gaz du sang (pH, PaCO₂, HCO₃⁻, compensation), toujours replacée dans le contexte clinique." },
      { label: 'Outil SAED de la HAS (Situation, Antécédents, Évaluation, Demande)',
        url: 'https://www.has-sante.fr/jcms/c_1776178', note: "Utilisé pour l'appel à l'infirmière référente (étape Décision)." },
      { label: 'Guide du stage infirmier en EHPAD (Réussis ton IFSI : ta page de cours)',
        url: 'https://app.reussistonifsi.fr/cours/ehpad-2',
        note: "Résidents accueillis, rôle de l'infirmier(e), vocabulaire du stage (IDEC, MT, DLU, PAP…). Page réservée aux abonnés." },
      { label: 'Fiche pédagogique UE B3 – semestre 1, 2026-2027 (ton Drive)',
        note: "Objectifs du S1 : recueil structuré de données, repérage des signes d'aggravation, transmissions ciblées." },
      { label: 'Ce que ce scénario ne dit pas',
        note: "Les consignes du SAMU et les valeurs du gaz du sang sont inventées pour l'entraînement. En réalité, un gaz du sang est un prélèvement artériel réalisé sur prescription, par les secours ou à l'hôpital, jamais par un étudiant seul. À confirmer avec ton formateur et le protocole de ton établissement." }
    ],

    patient,
    scene: { clock: { h: 7, m: 50 }, label: 'Chambre 14 : M. Moreau est dans son lit, le dos calé par des oreillers',
      patient: { eyes: 'open', pale: true, sweat: true, male: true, gasp: true, cyan: true, gown: '#a9cdf0', hair: ['#e9ecef', '#c3c8d0'] } },
    dossierOrder: ['d_identite', 'd_motif', 'd_atcd', 'd_allergies', 'd_ttt', 'd_autonomie', 'd_habituel', 'd_const_hab'],

    urgent: {
      facts: ['o_aspect', 'o_levres', 'o_tirage', 'q_dyspnee', 'q_somnolence', 'q_inhal'],
      message: "⏱ Une gêne respiratoire importante (phrases coupées, lèvres bleutées, tirage) est une urgence : l'alerte ne doit pas traîner. Va à l'essentiel (installation, fréquence respiratoire, saturation), reste avec M. Moreau et fais prévenir l'infirmière sans le quitter (sonnette, Karim)."
    },

    intro: {
      heure: '7 h 50',
      texte: "Tu es en stage dans un EHPAD, avec Sophie, l'infirmière référente, joignable au poste de soins. Il est 7 h 50 : tu passes voir M. Moreau, résident de la chambre 14, avant son petit-déjeuner. Il est dans son lit.",
      equipe: "Transmissions de la nuit : « Nuit agitée, a beaucoup toussé. » Karim, aide-soignant : « Il a refusé de se lever pour sa toilette, il m'a paru essoufflé. »",
      consigne: "Fais ce que ferait un étudiant de 1re année : prépare-toi, entre dans la chambre, recueille les informations, puis repère ce qui doit alerter. Quand le souffle est en jeu, le temps compte : ne perds pas de minutes dans les gestes secondaires, et dès que tu vois les signes de détresse, appelle à l'aide (sonnette ou Karim) sans quitter M. Moreau."
    },

    facts: {
      // Dossier de soins
      d_identite: { section: 'identite', kind: 'dossier', label: 'Identité',
        text: "M. Gérard MOREAU, né le 12/06/1950 (76 ans) · chambre 14 · bracelet d'identification au poignet." },
      d_motif: { section: 'motif', kind: 'dossier', label: "Motif d'entrée",
        text: "Entré en EHPAD il y a 2 ans, après deux hospitalisations pour des difficultés respiratoires et une perte d'autonomie. Veuf. Chambre seule." },
      d_atcd: { section: 'antecedents', kind: 'dossier', label: 'Antécédents',
        text: "BPCO (bronchopneumopathie chronique obstructive) : ancien fumeur (arrêt il y a 10 ans) · hypertension artérielle · arthrose des genoux · pneumonie il y a 2 ans. Pas d'oxygène à domicile." },
      d_allergies: { section: 'allergies', kind: 'dossier', label: 'Allergies', text: 'Aucune allergie connue (selon le dossier).' },
      d_ttt: { section: 'traitements', kind: 'dossier', label: 'Traitements prescrits',
        text: "Tiotropium 18 µg (gélule à inhaler avec un dispositif, bronchodilatateur de longue durée) : 1 gélule le matin, pas encore prise aujourd'hui · Salbutamol 100 µg (bronchodilatateur inhalé d'action rapide) : 1 à 2 bouffées si gêne respiratoire (prescription « si besoin ») · Amlodipine 5 mg : 1 comprimé le matin (pas encore pris) · Paracétamol 1 g si douleur, maximum 3 g par 24 h. Pas d'oxygène prescrit." },
      d_autonomie: { section: 'autonomie', kind: 'dossier', label: 'Autonomie',
        text: 'GIR 3 : marche avec un déambulateur, toilette avec aide, mange seul (plateau préparé).' },
      d_habituel: { section: 'psychosocial', kind: 'dossier', label: 'Habituellement',
        text: "Bavard, aime les mots fléchés et le sport à la télévision. Se déplace lentement et s'arrête pour souffler. Son fils Patrick est la personne à prévenir." },
      d_const_hab: { section: 'constantes', kind: 'dossier', label: 'Constantes habituelles', key: true,
        how: "Lis le dossier de soins avant d'entrer dans la chambre.",
        text: 'Température 36,6 °C · pouls 82/min · pression artérielle 142/80 mmHg · fréquence respiratoire 18/min · saturation 91 % en air ambiant.',
        meaning: "Sa saturation habituelle (91 %) est plus basse que la norme (≥ 94 %) à cause de sa BPCO : chez l'insuffisant respiratoire chronique, l'objectif est de 88 à 92 % (ton CM9). Ce qui alerte, c'est l'écart avec son habituel." },

      // En questionnant
      q_ressenti: { section: 'symptomes', kind: 'chercher', label: 'Ressenti', key: true, alert: true,
        text: "Parle par petits bouts de phrases, reprend son souffle entre deux mots : « Ça… va pas… j'ai du mal… à respirer. » Il est assis dans son lit, penché en avant, les mains sur les genoux.",
        how: 'Demande-lui comment il se sent ce matin.',
        meaning: "Un résident bavard qui ne peut plus finir ses phrases : c'est un changement net, à ne jamais mettre sur le compte de la fatigue." },
      q_dyspnee: { section: 'symptomes', kind: 'chercher', label: 'Essoufflement', key: true, alert: true,
        text: "L'essoufflement augmente depuis 2 jours. Ce matin, il est essoufflé même au repos, sans avoir bougé : « même assis, je manque d'air ».",
        how: 'Demande-lui s\'il respire bien.',
        meaning: "Un essoufflement qui apparaît au repos est un signe d'alerte : d'habitude il ne s'essouffle qu'à l'effort." },
      q_toux: { section: 'symptomes', kind: 'chercher', label: 'Toux et crachats', key: true, alert: true,
        text: "Il tousse beaucoup, surtout la nuit. Ses crachats sont devenus jaune-vert et épais depuis 2 jours (ils sont clairs d'habitude).",
        how: 'Demande-lui s\'il tousse et s\'il crache.',
        meaning: "Des crachats qui changent de couleur et une fièvre évoquent une infection des bronches. Tu ne poses pas de diagnostic : tu décris ce que tu vois et entends." },
      q_somnolence: { section: 'symptomes', kind: 'chercher', label: 'Somnolence', key: true, alert: true,
        text: "« Tête… lourde… j'ai envie de dormir. » Il lutte pour garder les yeux ouverts et s'endort entre deux phrases. Il avait mal à la tête au réveil.",
        how: 'Demande-lui s\'il a la tête lourde ou envie de dormir.',
        meaning: "Une somnolence chez une personne essoufflée est un signe d'alerte : quand le CO₂ s'accumule dans le sang, il peut donner sueurs, désorientation et obnubilation (ton CM9). Ce n'est jamais « juste la fatigue »." },
      q_depuis: { section: 'histoire', kind: 'chercher', label: 'Depuis quand', key: true, alert: true,
        text: "Plus essoufflé que d'habitude depuis avant-hier, avec une toux grasse. Hier soir à 20 h, il était déjà un peu essoufflé mais parlait encore normalement. Cette nuit, la toux l'a réveillé. Ce matin, c'est pire.",
        how: 'Demande-lui depuis quand il se sent ainsi.',
        meaning: "L'évolution (depuis 2 jours, pire cette nuit puis ce matin) renseigne les secours sur la rapidité de l'aggravation." },
      q_inhal: { section: 'traitements', kind: 'chercher', label: 'Ventoline (salbutamol)', key: true, alert: true,
        text: "Il a pris deux bouffées de son spray cette nuit vers 3 h, et encore une à 6 h 30 : « ça n'a… pas soulagé… comme d'habitude ».",
        how: 'Demande-lui s\'il a utilisé son spray (Ventoline) et si cela l\'a soulagé.',
        meaning: "Un bronchodilatateur d'action rapide qui ne soulage plus comme d'habitude est un signe d'aggravation. À transmettre à l'infirmière." },
      q_froid: { section: 'symptomes', kind: 'chercher', label: 'Chaud / froid', alert: true,
        text: "A eu chaud puis froid cette nuit, il a transpiré et changé de tee-shirt.",
        how: 'Demande-lui s\'il a eu froid, chaud ou des frissons.',
        meaning: "À rapprocher de la température mesurée." },
      q_douleur: { section: 'douleur', kind: 'chercher', label: 'Douleur', text: "Pas de douleur dans la poitrine ; seulement la gorge et les côtes fatiguées à force de tousser.", how: 'Demande-lui s\'il a mal quelque part.' },
      q_vertiges: { section: 'symptomes', kind: 'chercher', label: 'Vertiges', text: "Non, la tête ne tourne pas, elle est seulement « lourde ».", how: 'Demande-lui si la tête lui tourne.' },
      q_nausees: { section: 'symptomes', kind: 'chercher', label: 'Nausées', text: 'Pas de nausées ni de vomissements.', how: 'Demande-lui s\'il a des nausées.' },
      q_alim: { section: 'histoire', kind: 'chercher', label: 'Repas', text: "N'a pas fini son dîner hier : manger l'essouffle. Rien pris ce matin.", how: "Demande-lui ce qu'il a mangé ou bu." },
      q_boisson: { section: 'histoire', kind: 'chercher', label: 'Boissons', text: "A peu bu depuis hier : boire l'essouffle aussi.", how: 'Demande-lui s\'il a bu.' },
      q_urines: { section: 'symptomes', kind: 'chercher', label: 'Urines', text: 'Urines normales hier (selon Karim).', how: 'Demande-lui s\'il urine normalement.' },
      q_selles: { section: 'histoire', kind: 'chercher', label: 'Transit', text: 'Selles normales hier.', how: 'Demande-lui s\'il est allé à la selle.' },
      q_mobilite: { section: 'autonomie', kind: 'chercher', label: 'Déplacements', text: "Ne s'est pas levé ce matin : s'asseoir au bord du lit lui a coupé le souffle.", how: 'Demande-lui comment il se déplace.' },
      q_chute: { section: 'autonomie', kind: 'chercher', label: 'Chutes', text: 'Pas de chute ni de coup.', how: 'Demande-lui s\'il est tombé récemment.' },
      q_sommeil: { section: 'histoire', kind: 'chercher', label: 'Sommeil', text: "Nuit agitée : il a dormi assis dans son lit à cause de la toux et du manque d'air.", how: 'Demande-lui s\'il a bien dormi.' },
      q_moral: { section: 'psychosocial', kind: 'chercher', label: 'Moral', text: "Inquiet : « j'ai peur… de m'étouffer ». Il serre le drap.", how: 'Demande-lui comment est son moral.',
        meaning: "L'anxiété augmente la sensation d'essoufflement : rassure-le, parle lentement, reste près de lui." },
      q_entourage: { section: 'psychosocial', kind: 'chercher', label: 'Entourage', text: "Son fils Patrick, qui l'appelle le dimanche : c'est lui qu'il faut prévenir.", how: 'Demande-lui si sa famille vient le voir.' },
      q_orientation: { section: 'psychosocial', kind: 'chercher', label: 'Orientation', text: "Donne son nom et le jour de la semaine, mais met du temps à répondre : il s'assoupit au milieu de la phrase.", how: 'Demande-lui quel jour nous sommes.',
        meaning: "Il est orienté mais ralenti : le ralentissement et la somnolence comptent dans ce que tu transmets." },
      q_ttt: { section: 'traitements', kind: 'chercher', label: 'Traitement pris', text: "Parle de son « spray bleu » (le salbutamol) et de son inhalateur du matin, pas encore pris. Il n'a pas d'oxygène.", how: 'Demande-lui quels médicaments il prend.' },
      q_atcd: { section: 'antecedents', kind: 'chercher', label: 'Antécédents racontés', text: "Dit « mes poumons… la bronchite… j'ai fumé » : cohérent avec le dossier.", how: 'Demande-lui quels sont ses problèmes de santé.' },
      q_motif: { section: 'motif', kind: 'chercher', label: 'Arrivée', text: "« Les poumons… » : raconte ses hospitalisations avant l'EHPAD, en reprenant son souffle.", how: 'Demande-lui pourquoi il est arrivé ici.' },
      q_allerg: { section: 'allergies', kind: 'chercher', label: 'Allergies (ce qu\'il dit)', text: 'Aucune allergie : cohérent avec le dossier.', how: 'Demande-lui s\'il est allergique à un médicament.' },
      q_equipe_heure: { section: 'histoire', kind: 'chercher', label: "Ce qu'a vu l'équipe", key: true, alert: true,
        text: "Karim : « À 6 h, il toussait beaucoup, assis dans son lit. À 7 h 30, il a refusé de se lever et il parlait par petits bouts de phrases. Il s'est assoupi pendant que je lui parlais. Ça m'a inquiété. »",
        how: "Interroge Karim, l'aide-soignant.",
        meaning: "L'aggravation s'est faite en quelques heures : à 6 h il toussait, à 7 h 30 il était essoufflé au repos et somnolent." },

      // En mesurant
      m_temp: { section: 'constantes', kind: 'mesurer', label: 'Température', key: true, alert: true, text: '38,1 °C',
        meaning: "Plus élevée que d'habitude (36,6 °C) : cohérent avec le « chaud puis froid » de la nuit. Tu la notes et tu la transmets." },
      m_fc: { section: 'constantes', kind: 'mesurer', label: 'Pouls', key: true, alert: true, text: '108 /min, régulier',
        meaning: "Plus rapide que son pouls habituel (82/min) : le manque d'air et la fièvre peuvent l'accélérer." },
      m_pa: { section: 'constantes', kind: 'mesurer', label: 'Pression artérielle', text: '150/86 mmHg',
        meaning: "Un peu plus haute que d'habitude (142/80). Tu la notes sans chercher à la baisser." },
      m_fr: { section: 'constantes', kind: 'mesurer', label: 'Fréquence respiratoire', key: true, alert: true, text: '28 /min',
        meaning: "Bien au-dessus de la norme de l'adulte (12 à 20/min, ton CM9) et de son habituel (18/min) : il respire vite et il se fatigue." },
      m_spo2: { section: 'constantes', kind: 'mesurer', label: 'Saturation', key: true, alert: true, text: '86 % en air ambiant',
        meaning: "Sous son habituel (91 %) et sous l'objectif de 88 à 92 % de l'insuffisant respiratoire chronique (ton CM9). Tu notes la valeur et tu alertes : tu ne règles pas d'oxygène toi-même." },

      // En observant
      o_aspect: { section: 'observations', kind: 'deduire', label: 'Aspect général', key: true, alert: true,
        text: "Assis dans son lit, le dos calé, penché en avant, les mains sur les genoux. Il respire vite, la bouche entrouverte, et ne finit pas ses phrases. Il transpire.",
        how: 'Observe le résident.',
        meaning: "La posture penchée en avant et les sueurs sont des signes de gêne respiratoire importante. Ce sont des faits que tu vois, pas un diagnostic." },
      o_levres: { section: 'observations', kind: 'deduire', label: 'Lèvres et doigts', key: true, alert: true,
        text: "Lèvres et bouts des doigts bleutés. Visage pâle et moite.",
        how: 'Observe le résident.',
        meaning: "La cyanose (coloration bleutée des extrémités, des ailes du nez et des muqueuses) est un signe cutané de détresse respiratoire (ton CM9)." },
      o_tirage: { section: 'observations', kind: 'deduire', label: 'Muscles de la respiration', key: true, alert: true,
        text: "À chaque inspiration, la peau se creuse entre les côtes et au-dessus de la clavicule, et les muscles du cou se tendent : il utilise ses muscles accessoires.",
        how: 'Observe le résident (thorax et cou).',
        meaning: "Au repos, seul le diaphragme est normalement actif : un tirage intercostal ou du sterno-cléido-mastoïdien est un signe d'alerte (ton CM9)." },
      o_mouchoirs: { section: 'observations', kind: 'deduire', label: 'Mouchoirs', alert: true,
        text: "Plusieurs mouchoirs en papier remplis de crachats épais, jaune-vert, sur la table de chevet.", how: 'Regarde la table de chevet.' },
      o_spray: { section: 'observations', kind: 'deduire', label: 'Spray de salbutamol', alert: true,
        text: "Le spray bleu est posé sur la table de chevet, capuchon retiré, à portée de main.", how: 'Regarde la table de chevet.' },
      o_deamb: { section: 'risques', kind: 'deduire', label: 'Déambulateur', text: 'À sa place, au pied du lit.', how: 'Regarde où se trouve le déambulateur.' },
      o_sonnette: { section: 'risques', kind: 'deduire', label: 'Sonnette', text: "Accrochée au montant du lit, à portée de sa main. Il ne l'a pas utilisée.", how: 'Regarde où se trouve la sonnette.' },
      o_oxy: { section: 'risques', kind: 'deduire', label: 'Oxygène', text: "Aucun dispositif d'oxygène dans la chambre : il n'en a pas de prescrit.", how: 'Regarde s\'il y a un dispositif d\'oxygène.' }
    },

    answers: Object.assign(B.contact(patient, {
      c_salut:        { text: 'Bon… jour…' },
      c_presentation: { text: "(Il lève la main.) « Ah… l'étudiant… Moi… Gérard… Moreau. » (il reprend son souffle entre les mots)", logs: ['g_presentation'] },
      c_identite_q:   { text: "« Moreau… Gérard. Douze… juin… cinquante. » (il souffle entre les mots)", logs: ['g_identite'] },
      c_explication:  { text: '(Il hoche la tête.) « D\'accord… »', logs: ['g_explication'] },
      c_accord:       { text: '(Il fait « oui » de la tête, la main sur la poitrine.)', logs: ['g_accord'] },
      c_intimite:     { text: '(Il hoche la tête.) « Merci… »', logs: ['g_intimite'] },
      c_fin:          { text: '(Il lève le pouce.) « Merci… à tout… à l\'heure. »' }
    }), {
      q_comment_allez: { text: "« Ça… va pas… j'ai du mal… à respirer. » (il reprend son souffle entre chaque mot)", reveals: ['q_ressenti'] },
      q_motif:         { text: "« Les poumons… » (il s'arrête pour souffler) « Deux hospitalisations… avant. »", reveals: ['q_motif'] },
      q_depuis_quand:  { text: "« Depuis… avant-hier… et ce matin… c'est pire. » (il reprend son souffle)", reveals: ['q_depuis'] },
      q_autre:         { text: "« La toux… le souffle… la tête… lourde. »", reveals: ['q_ressenti', 'q_dyspnee'] },

      q_douleur:      { text: "« Pas mal… dans la poitrine. La gorge… les côtes… à force de tousser. »", reveals: ['q_douleur'] },
      q_respiration:  { text: "« Je manque… d'air… même assis. » (il tousse) « Et je crache… jaune… vert… épais. »", reveals: ['q_dyspnee', 'q_toux'] },
      q_vertiges:     { text: "« Non… la tête ne tourne pas… elle est lourde. »", reveals: ['q_vertiges'] },
      q_nausees:      { text: '(Il fait « non » de la tête.)', reveals: ['q_nausees'] },
      q_froid:        { text: "« J'ai eu chaud… puis froid… cette nuit. J'ai changé… mon tee-shirt. »", reveals: ['q_froid'] },

      q_alim:         { text: "« Pas fini… le dîner. Manger… ça m'essouffle. »", reveals: ['q_alim'] },
      q_boisson:      { text: "« Peu bu… boire aussi… ça essouffle. »", reveals: ['q_boisson'] },
      q_urines:       { text: '(Il fait signe que oui, comme d\'habitude.)', reveals: ['q_urines'] },
      q_selles:       { text: '(Il hoche la tête.)', reveals: ['q_selles'] },

      q_mobilite:     { text: "« Pas levé… ça m'a coupé… le souffle. »", reveals: ['q_mobilite'] },
      q_chute:        { text: '(Il fait « non » de la tête.)', reveals: ['q_chute'] },
      q_sommeil:      { text: "« Mal dormi… assis… la toux… le manque d'air. »", reveals: ['q_sommeil'] },

      q_antecedents:  { text: "« Mes poumons… la bronchite… j'ai fumé. Et la tension. »", reveals: ['q_atcd'] },
      q_traitements:  { text: "« Mon spray bleu… et celui du matin… pas encore pris. » (il tousse)", reveals: ['q_ttt'] },
      q_allergies:    { text: '(Il fait « non » de la tête.) « Rien. »', reveals: ['q_allerg'] },

      q_moral:        { text: "« J'ai peur… de m'étouffer. » (il serre le drap)", reveals: ['q_moral'] },
      q_entourage:    { text: "« Mon fils… Patrick. Il appelle… le dimanche. »", reveals: ['q_entourage'] },
      q_orientation:  { text: "« Moreau… Gérard. On est… lundi. » (il s'assoupit à moitié avant de finir sa phrase)", reveals: ['q_orientation'] },

      q_somnolence:   { text: "« Tête… lourde… j'ai envie… de dormir. » (il ferme les yeux, les rouvre avec effort)", reveals: ['q_somnolence'] },
      q_inhal:        { text: "« Deux bouffées… cette nuit… vers trois heures. Une autre… à six heures et demie. Ça n'a pas… soulagé… comme avant. »", reveals: ['q_inhal'] },
      q_equipe:       { text: "(Karim, depuis la porte) « À 6 h, il toussait beaucoup, assis dans son lit. À 7 h 30, il a refusé de se lever, il parlait par petits bouts de phrases et il s'est assoupi pendant que je lui parlais. Ça m'a inquiété. »", reveals: ['q_equipe_heure'] }
    }),
    fallbackAnswer: '(Il fait un geste de la main et reprend son souffle : il n\'arrive pas à répondre.)',
    notUnderstood: '(Il te regarde, essoufflé, et hoche la tête sans répondre.)',
    whoAreYou: '(Il te regarde, étonné, et hausse les épaules en reprenant son souffle.)',

    tools: T.tools, toolOrder: T.toolOrder, sceneTools: T.sceneTools,

    autoGestures: B.autoGestures({ p: patient, auto: [
      { id: 'g_resp_obs', facts: ['o_aspect', 'o_levres', 'o_tirage'] },
      { id: 'g_heure', asked: ['q_equipe'] }
    ] }),

    narration: B.narration(patient, {
      enter: "Tu entres dans la chambre 14. M. Moreau est assis dans son lit, penché en avant. Tu entends sa respiration rapide et sifflante depuis la porte. Ses lèvres ont une teinte bleutée."
    }),

    constTable: B.constTable({ temp: '36,6 °C', fc: '82 /min, régulier', pa: '142/80 mmHg', fr: '18 /min', spo2: '91 %' }).map(r =>
      r.fact === 'm_spo2' ? Object.assign({}, r, { norm: "≥ 94 % ; 88 à 92 % chez l'insuffisant respiratoire chronique (ton CM9)" })
      : r.fact === 'm_fr' ? Object.assign({}, r, { norm: '12 à 20 /min (ton CM9) · polypnée > 20' }) : r),

    objects: {
      patient: { label: 'Observer M. Moreau', icon: '👴', reveals: ['o_aspect', 'o_levres', 'o_tirage'],
        narration: "Tu observes M. Moreau : assis, penché en avant, les mains sur les genoux. Il respire vite, la bouche entrouverte et il transpire. Ses lèvres et ses doigts sont bleutés. À chaque inspiration, la peau se creuse entre ses côtes et au-dessus de sa clavicule." },
      table: { label: 'Table de chevet', icon: '🗄️', reveals: ['o_mouchoirs', 'o_spray'],
        narration: "Sur la table de chevet : plusieurs mouchoirs en papier remplis de crachats épais, jaune-vert, et le spray bleu de salbutamol, capuchon retiré." },
      deambulateur: { label: 'Déambulateur', icon: '🦽', reveals: ['o_deamb'],
        narration: 'Le déambulateur est à sa place, au pied du lit.' },
      sonnette: { label: 'Sonnette', icon: '🔔', reveals: ['o_sonnette'],
        narration: "La sonnette est accrochée au montant du lit, à portée de main. Il ne s'en est pas servi." },
      oxygene: { label: "Dispositif d'oxygène", icon: '🫁', reveals: ['o_oxy'],
        narration: "Tu cherches un dispositif d'oxygène : il n'y en a pas dans la chambre, il n'en a pas de prescrit." }
    },

    grid: B.grid({ p: patient, extra: [
      { id: 'g_resp_obs', label: "Observer la respiration : posture, couleur des lèvres et des doigts, tirage, sueurs",
        why: "Devant une difficulté respiratoire, ces signes se voient avant toute mesure : posture penchée en avant, cyanose, tirage intercostal ou du cou (ton CM9).",
        ref: 'UE B3 S1 : CM9, signes cliniques cutanés de détresse respiratoire' },
      { id: 'g_heure', label: "Chercher auprès de l'équipe comment la situation a évolué depuis hier soir",
        why: "L'évolution (depuis quand, à quelle vitesse) aide l'infirmière et les secours à juger de la gravité.",
        ref: 'Pratique usuelle de recueil de données, à confirmer dans ton cours' }
    ] }),

    alertSummary: "Pris un par un, ces signes pourraient passer pour un gros rhume chez un homme qui tousse tout le temps. Ensemble (essoufflement au repos, phrases coupées, lèvres bleutées, tirage, fréquence respiratoire à 28, saturation à 86 % alors que son habituel est 91 %, somnolence, spray qui ne soulage plus, fièvre), ils sont l'alerte d'une détresse respiratoire chez un insuffisant respiratoire chronique. Tu ne poses pas de diagnostic et tu ne traites rien : tu repères, tu l'installes assis ou demi-assis (dossier relevé à plus de 30°), tu restes auprès de lui, tu ne donnes ni calmant ni somnifère, tu ne règles aucun débit d'oxygène (c'est un médicament : il peut en avoir besoin, mais prescrit, à faible débit et surveillé) et tu alertes l'infirmière tout de suite, qui appelle le 15 (si personne ne répond rapidement, tu appelles toi-même le 15 plutôt que d'attendre).",

    decision: {
      intro: "Tu as terminé le recueil. Avant d'agir, prends un instant : ce que tu as trouvé veut-il dire quelque chose, et que fais-tu maintenant ? Un étudiant ne pose pas de diagnostic : il repère, il sécurise et il alerte.",
      levelQ: 'Comment juges-tu la situation de M. Moreau ?',
      levels: [
        { id: 'rien', pts: 0, verdict: 'danger',
          label: "C'est sa BPCO, il tousse toujours : je note ce que j'ai vu et je le laisse se reposer",
          unsafe: "Tu as jugé qu'il n'y avait rien à signaler alors que M. Moreau avait les lèvres bleutées, une saturation à 86 %, une fréquence respiratoire à 28 et une somnolence.",
          feedback: "Un essoufflement au repos, des lèvres bleutées, une saturation sous son objectif et une somnolence ne sont pas « sa toux habituelle ». Le laisser se reposer seul serait dangereux : son souffle peut s'épuiser. Un étudiant ne décide pas seul de la gravité : il alerte." },
        { id: 'plustard', pts: 0, verdict: 'danger',
          label: "À signaler à l'infirmière référente, mais cela peut attendre la fin de la matinée",
          unsafe: "Tu as jugé que l'alerte pouvait attendre alors qu'il présentait une détresse respiratoire avec une somnolence.",
          feedback: "Devant ces signes, on n'attend pas : une détresse respiratoire peut s'aggraver en quelques minutes. On alerte tout de suite, en restant près du résident." },
        { id: 'urgence', pts: 10, verdict: 'good',
          label: "Urgence : j'alerte l'infirmière tout de suite, qui appellera le 15, et je reste auprès de lui (si elle reste injoignable, j'appelle le 15 moi-même)",
          feedback: "Bon réflexe. Tu as regroupé les signes (essoufflement au repos, cyanose, tirage, fréquence respiratoire et saturation anormales, somnolence) et tu alertes l'infirmière sans quitter M. Moreau. C'est elle qui appellera le 15." },
        { id: 'quinze', pts: 5, verdict: 'avoid',
          label: "J'appelle le 15 moi-même, tout de suite, sans prévenir l'infirmière",
          feedback: "Ton réflexe d'urgence est le bon : il ne faut pas attendre. Mais en EHPAD, l'appel au 15 est fait par l'infirmière, qui a le dossier sous les yeux, connaît les traitements et décide de la suite. Ton rôle est de l'alerter immédiatement, en restant auprès du résident (appelle à l'aide par la sonnette ou fais venir un collègue). Si personne ne répond et qu'il reste seul, ne perds pas de temps : l'appel au 15 est alors justifié." }
      ],
      actionsQ: "En attendant l'arrivée de Sophie, que fais-tu ? Coche tout ce que tu ferais.",
      actionsMax: 15,
      actions: [
        { id: 'aide', v: 'good', label: "Appeler à l'aide (sonnette ou en faisant venir Karim) pour que l'infirmière arrive tout de suite, sans quitter M. Moreau",
          why: "Il ne doit pas rester seul : l'alerte se fait sans le quitter, avec la sonnette ou en demandant à un collègue." },
        { id: 'position', v: 'good', label: "L'aider à rester assis ou demi-assis, le dossier relevé à plus de 30°, bien calé par les oreillers",
          why: "Devant une difficulté respiratoire, la position assise ou demi-assise facilite l'ampliation thoracique (ton CM10). Il est déjà penché en avant : on le soutient dans la position où il respire le mieux." },
        { id: 'rester', v: 'good', label: 'Rester près de lui, le rassurer, lui parler lentement et calmement',
          why: "Il a peur de s'étouffer, et l'anxiété augmente la sensation d'essoufflement. Des phrases courtes, un ton calme, une main posée sur l'épaule le rassurent." },
        { id: 'surveiller', v: 'good', label: "Surveiller en continu sa respiration (fréquence), sa saturation, la couleur de ses lèvres et sa vigilance, et noter chaque mesure avec l'heure",
          why: "La surveillance des paramètres vitaux et des signes de difficulté respiratoire fait partie du rôle propre de l'infirmier, délégable (ton CM9). S'il devient plus somnolent ou plus bleu, il faut le dire immédiatement." },
        { id: 'heure', v: 'good', label: "Noter l'évolution et les heures : toux depuis 2 jours, nuit agitée, spray pris à 3 h et 6 h 30 sans effet, essoufflé au repos à 7 h 30",
          why: "Ces informations aident l'infirmière et les secours à juger de la rapidité de l'aggravation." },
        { id: 'dossier', v: 'good', label: "Repérer ses traitements (bronchodilatateurs inhalés), ses antécédents (BPCO) et la personne à prévenir pour les transmettre aux secours",
          why: "Les secours ont besoin de l'histoire de la BPCO, des traitements et de l'absence d'oxygène prescrit, avec la personne à prévenir (dossier de liaison d'urgence)." },
        { id: 'jeun', v: 'good', label: "Ne rien lui donner à manger ni à boire en attendant l'avis du médecin",
          why: "Manger et boire l'essoufflent, et avec une respiration très rapide le risque de fausse route augmente. Règle de prudence, à confirmer avec le protocole du service." },
        { id: 'allonger', v: 'danger', label: "L'allonger à plat pour qu'il se repose",
          why: "Allongé à plat, il respire encore moins bien : la position assise ou demi-assise facilite la respiration (ton CM10)." },
        { id: 'calmant', v: 'danger', label: "Lui donner un somnifère ou un calmant pour qu'il se détende et se rendorme",
          why: "Un médicament ne se donne jamais sans prescription, et un calmant ralentit la respiration : chez lui, le CO₂ s'accumulerait encore plus (c'est l'acidose respiratoire que tu verras plus tard sur son gaz du sang). Il est déjà somnolent." },
        { id: 'oxygene', v: 'danger', label: "Aller chercher de l'oxygène et le mettre en route toi-même, au débit maximum",
          why: "L'oxygène est un médicament : sa mise en route demande une prescription (rôle prescrit, non délégable, ton CM10) et le débit se règle sur un objectif précis. Chez l'insuffisant respiratoire chronique, l'objectif de saturation est plus bas (88 à 92 %, ton CM9). C'est l'infirmière ou le médecin qui décide. Attention : cela ne veut pas dire « pas d'oxygène pour un BPCO » : s'il en manque, il en faut, mais prescrit, à faible débit et réglé sur l'objectif, avec une surveillance de la vigilance et de la respiration." },
        { id: 'attendre', v: 'danger', label: "Attendre 15 à 20 minutes pour voir si son spray finit par agir",
          why: "Son spray n'a déjà pas soulagé deux fois. Attendre, c'est laisser un souffle épuisé s'aggraver : on alerte sans perdre de temps." },
        { id: 'lever', v: 'danger', label: "Le faire se lever et marcher jusqu'à la salle d'eau pour qu'il « se dégourdisse »",
          why: "Avec une saturation à 86 %, des lèvres bleutées et une somnolence, marcher peut le faire désaturer davantage, provoquer un malaise ou une chute. Il reste installé jusqu'à l'arrivée des secours." },
        { id: 'ttt_matin', v: 'avoid', label: 'Lui donner ses médicaments du matin (tiotropium, amlodipine) ou lui faire reprendre son spray en attendant',
          why: "Les médicaments se donnent sur prescription, à l'heure décidée par l'infirmière : en pleine détresse, c'est elle (puis le médecin) qui décide. S'il reprend son spray tout seul, note l'heure, préviens l'infirmière et ne le lui retire pas." },
        { id: 'fils', v: 'avoid', label: "Appeler toi-même son fils Patrick pour le prévenir avant d'alerter l'infirmière",
          why: "La famille est prévenue par l'infirmière ou l'équipe, après l'alerte. Le premier appel est celui qui déclenche les secours." },
        { id: 'boire', v: 'danger', label: 'Lui faire boire un grand verre d\'eau pour calmer la toux',
          why: "Il est somnolent et respire à 28/min : avaler dans ces conditions expose à la fausse route. Rien par la bouche en attendant l'avis du médecin." }
      ]
    },

    call: {
      who: 'Sophie',
      intro: "Tu fais venir Karim pour qu'il reste auprès de M. Moreau et tu joins Sophie (poste de soins ou téléphone du service). Sophie décroche : « Oui, Sophie ? ». Prépare ton message avec l'outil SAED de la HAS : Situation, Antécédents, Évaluation, Demande. Va vite : des phrases courtes, comme tu les dirais à voix haute.",
      method: "SAED = Situation (qui, pourquoi j'appelle) · Antécédents (ce qui est utile de son histoire) · Évaluation (ce que j'ai mesuré et observé, comparé à son habituel) · Demande (ce que j'attends de toi, et pour quand).",
      sections: [
        { id: 'S', label: 'S · Situation', hint: 'Qui es-tu ? De qui parles-tu ? Pourquoi appelles-tu ?', placeholder: "Bonjour Sophie, c'est … étudiant(e). Je suis chez …",
          elements: [
            { id: 's_qui', w: 1, label: 'Tu te présentes (étudiant(e), stagiaire)', ask: "Qui est à l'appareil ?", re: [/\b(etudiant|etudiante|stagiaire|esi)\b/] },
            { id: 's_pat', w: 1, label: 'Tu identifies le résident (nom, chambre)', ask: 'De quel résident parles-tu ?', re: [/moreau/, /gerard/, /chambre (14|quatorze)\b/, /\bch ?14\b/] },
            { id: 's_motif', w: 1, label: 'Tu dis pourquoi tu appelles : il a du mal à respirer (détresse respiratoire)', ask: "Pourquoi m'appelles-tu ?",
              re: [/essouffl/, /respir/, /souffle/, /detresse/, /etouff/, /manque d air/, /dyspnee/, /urgence/, /urgent/, /difficulte/] }
          ] },
        { id: 'A', label: 'A · Antécédents', hint: "Qu'est-ce qui est utile de son histoire ?", placeholder: 'Il a …',
          elements: [
            { id: 'a_atcd', w: 1, label: 'Un antécédent utile : BPCO (insuffisance respiratoire chronique, ancien fumeur)', ask: 'Il a quels antécédents ?',
              re: [/bpco/, /bronchopneumopathie/, /insuffisan(ce|t) respiratoire/, /fumeur/, /tabac/, /poumon/, /bronchite/, /emphyseme/] },
            { id: 'a_ttt', w: 1, label: "Son traitement : bronchodilatateurs inhalés (spray de salbutamol), pas d'oxygène prescrit", ask: 'Il prend quoi comme traitement ?',
              re: [/bronchodilat/, /ventoline/, /salbutamol/, /tiotropium/, /spiriva/, /inhal/, /aerosol/, /spray/, /pas d oxygene/, /sans oxygene/, /traitement/] },
            { id: 'a_depuis', w: 2, label: "L'évolution : essoufflé depuis 2 jours, pire ce matin, son spray n'a pas soulagé", ask: 'Depuis quand ? Le spray a servi ?',
              re: [/deux jours/, /2 jours/, /avant hier/, /depuis hier/, /48 ?h/, /aggrav/, /empir/, /de plus en plus/, /pas soulage/, /sans effet/, /ne soulage/, /soulage pas/, /plus efficace/] }
          ] },
        { id: 'E', label: 'E · Évaluation', hint: 'Ce que tu as mesuré et observé, comparé à son habituel.', placeholder: 'Ce matin : il …, saturation …',
          elements: [
            { id: 'e_signes', w: 2, label: 'Au moins 2 signes parmi : essoufflé au repos, lèvres bleutées, tirage, sueurs, somnolence, crachats jaune-vert', ask: "Qu'est-ce que tu as remarqué chez lui ?",
              need: { min: 2, re: [/essouffl/, /respire (vite|mal|difficile)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /violac/, /sueur/, /transpir/, /somnol/, /endormi/, /assoupi/, /penche/, /phrases/, /crachat/, /jaune/, /vert/] } },
            { id: 'e_const', w: 1, label: "Au moins 3 constantes avec leur valeur (38,1 °C · 108/min · 150/86 · 28/min · 86 %)", ask: 'Tu as pris ses constantes ?',
              test: n => _nConst(n) >= 3 },
            { id: 'e_compare', w: 1, label: "Tu compares à son habituel (saturation habituelle 91 %, fréquence respiratoire 18/min)", ask: "C'est différent de d'habitude ?",
              re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b91\b/, /plus bas que/, /plus (essouffle|rapide)/, /avant/] }
          ],
          warn: { re: [/pneumonie/, /embolie/, /infarctus/, /covid/, /grippe/, /asthme/, /fatigu/, /angoisse/, /anxie/, /caprice/, /fait semblant/], pen: 1,
            text: "Tu as nommé une autre maladie ou minimisé les signes. Reste sur ce que tu constates (valeurs, signes, heures). Tu peux évoquer une suspicion, mais c'est l'infirmière puis le médecin qui interprètent." }
        },
        { id: 'D', label: 'D · Demande', hint: "Qu'attends-tu de Sophie, et pour quand ?", placeholder: 'Je voudrais que tu …',
          elements: [
            { id: 'd_venir', w: 1, label: 'Tu demandes à Sophie de venir tout de suite', ask: "Et qu'est-ce que tu attends de moi ?",
              re: [/venir/, /viens/, /passer/, /passe/, /vous deplac/, /te deplac/, /vienne/, /viendr/, /sur place/] },
            { id: 'd_samu', w: 2, label: "Tu demandes d'appeler le 15 / le SAMU", ask: 'Tu veux que je fasse quoi ?',
              re: [/\b15\b/, /samu/, /smur/, /secours/, /pompiers/, /centre 15/, /medecin regulateur/, /(appel\w*|contact\w*|prevenir|joindre|previen\w*) (les |le |l )?urgences/] },
            { id: 'd_delai', w: 1, label: 'Tu précises le délai (tout de suite, maintenant)', ask: "C'est pour quand ?",
              re: [/maintenant/, /tout de suite/, /immediat/, /urgent/, /urgence/, /\bvite\b/, /rapidement/, /sans attendre/, /des que possible/] }
          ] }
      ],
      reply: {
        good: "Merci, c'est très clair. J'arrive tout de suite et j'appelle le 15 : garde-le assis, reste auprès de lui, ne lui donne ni calmant ni oxygène, et continue à surveiller sa respiration et sa saturation. Prépare son dossier et la liste de ses traitements.",
        mid: "D'accord, j'ai l'essentiel. J'arrive.",
        low: 'Je ne suis pas sûre de bien comprendre la situation.',
        retry: 'Rappelle-moi avec ces précisions, vite.',
        final: "Merci, j'ai ce qu'il me faut, j'arrive. On regardera ensemble ce qui manquait : c'est normal de s'entraîner.",
        noDemand: "J'arrive, mais dis-moi toujours ce que tu attends de moi."
      },
      model: {
        S: "Bonjour Sophie, c'est [ton prénom], étudiant(e) infirmier(ère). Je suis dans la chambre 14 avec M. Moreau, 76 ans. Je t'appelle parce qu'il a beaucoup de mal à respirer : il est essoufflé au repos, avec les lèvres bleutées.",
        A: "Il a une BPCO, il est ancien fumeur, il n'a pas d'oxygène prescrit. Il est essoufflé depuis 2 jours avec des crachats jaune-vert, et c'est pire ce matin. Son spray de salbutamol, pris à 3 h et à 6 h 30, ne l'a pas soulagé.",
        E: "Ce matin : il parle par petits bouts de phrases, il est penché en avant, il transpire, la peau se creuse entre ses côtes quand il inspire, et il est somnolent. Fréquence respiratoire 28 (18 d'habitude), saturation 86 % (91 % d'habitude), pouls 108, tension 150/86, température 38,1 °C.",
        D: "Je voudrais que tu viennes tout de suite et que tu appelles le 15. Je reste avec lui, installé assis, et je prépare son dossier."
      },
      aiFacts: "Patient fictif : M. Gérard Moreau, 76 ans, chambre 14, EHPAD. Antécédents : BPCO (ancien fumeur), hypertension, arthrose. Traitements : tiotropium inhalé le matin (pas encore pris), salbutamol si besoin (2 bouffées à 3 h et 1 à 6 h 30, sans effet), amlodipine, paracétamol si besoin. Pas d'oxygène prescrit. Habituellement : T 36,6 °C, pouls 82/min, PA 142/80, FR 18/min, SpO2 91 % (objectif de 88 à 92 %). Ce matin à 7 h 50 : T 38,1 °C, pouls 108/min, PA 150/86, FR 28/min, SpO2 86 % en air ambiant. Essoufflé au repos, phrases coupées, penché en avant, sueurs, lèvres bleutées, tirage, somnolent, crachats jaune-vert, toux depuis 2 jours, aggravation depuis avant-hier. Hier soir à 20 h : un peu essoufflé mais il parlait normalement."
    },

    rx: {
      from: 'SAMU (15), médecin régulateur · consignes recueillies par Sophie',
      title: 'Consignes du SAMU (appel au 15)',
      stepName: 'Consignes du SAMU',
      nextLabel: 'les consignes du SAMU',
      intro: "Sophie a appelé le 15. Le médecin régulateur lui donne des consignes, qu'elle te transmet pendant que vous restez auprès de M. Moreau. Lis-les attentivement : ce sont elles qui font foi. Un peu plus tard, l'équipe du SMUR est arrivée et a fait un gaz du sang.",
      note: "Consignes fictives, écrites pour l'entraînement. Dans la réalité, elles dépendent du médecin régulateur, de la situation et des protocoles de l'établissement.",
      lines: [
        { id: 'samu', icon: '🚑', t: "Une équipe du SMUR est envoyée. Le médecin régulateur prévoit un transfert vers les urgences, le plus vite possible." },
        { id: 'position', icon: '🛏️', t: "Position assise ou demi-assise (dossier relevé à plus de 30°) pour faciliter sa respiration. Ne pas l'allonger, ne pas le faire marcher." },
        { id: 'surv', icon: '📈', t: "Surveillance continue jusqu'à l'arrivée des secours : fréquence respiratoire, saturation, couleur des lèvres, vigilance (somnolence). Noter chaque mesure avec l'heure et prévenir tout de suite si cela change." },
        { id: 'oxy', icon: '🫁', t: "L'oxygène est un médicament : il est mis en route sur prescription, par l'infirmière ou l'équipe du SMUR, au débit prescrit. Ne règle aucun débit toi-même. Chez un insuffisant respiratoire chronique, l'objectif de saturation est plus bas que la norme (88 à 92 %, ton CM9) : sa saturation à 86 % est sous cet objectif, donc il peut en avoir besoin, à faible débit et sous surveillance. On ne le prive pas d'oxygène, mais ce n'est pas à toi de le décider." },
        { id: 'ttt', icon: '⛔', t: "Aucun somnifère ni calmant (ils ralentissent la respiration). Rien à manger ni à boire en attendant l'avis du médecin. Les médicaments du matin ne sont pas donnés en attendant. Le salbutamol « si besoin » est géré par l'infirmière : si M. Moreau reprend son spray seul, note l'heure et préviens-la, sans le lui retirer." },
        { id: 'dlu', icon: '📁', t: "Préparer le dossier de liaison d'urgence (DLU) : antécédents (BPCO), traitements, allergies, personne à prévenir." },
        { id: 'famille', icon: '📞', t: "Le fils, Patrick, est prévenu par l'infirmière." },
        { id: 'gazo', icon: '🩸', gazo: true, t: "À son arrivée, l'équipe du SMUR a fait un gaz du sang avec un analyseur portable (les secours n'attendent pas le résultat pour soigner le résident) et a donné le résultat à Sophie. En EHPAD, on ne réalise pas de gaz du sang : c'est un prélèvement artériel fait sur prescription, analysé par les secours ou à l'hôpital, et ce n'est pas un acte d'étudiant. Sophie te montre le résultat (valeurs fictives)." }
      ],
      gazo: {
        q: GAZ,
        title: 'Lire le gaz du sang de M. Moreau',
        intro: "Sophie te montre le résultat du SMUR et te demande ce que tu en comprends, pour nourrir ton raisonnement clinique (une lecture sommaire, pas un diagnostic). Suis la démarche de ton cours : pH, PaCO₂, HCO₃⁻, compensation, puis PaO₂.",
        backLabel: 'Consignes du SAMU',
        doneLabel: 'Revenir aux consignes →'
      }
    },

    written: {
      intro: "Il est 8 h 45. L'équipe du SMUR est arrivée et a emmené M. Moreau aux urgences. Il te reste à écrire ta transmission dans le dossier de soins pour que l'équipe de la journée sache ce qui s'est passé. Une transmission ciblée se compose d'une cible (le problème ou le risque, en quelques mots) puis de D (données), A (actions), R (résultats). Rappel du gaz du sang donné par le SMUR (valeurs fictives) : pH 7,29 · PaCO₂ 66 mmHg · HCO₃⁻ 31 mmol/L · PaO₂ 54 mmHg.",
      rules: "Écris des faits observables, datés, sans jugement. Évite les formules vagues (« RAS », « fatigué »). Mentionne l'heure quand tu la connais. Pour le gaz du sang, note les valeurs et ta lecture sommaire (sans poser de diagnostic).",
      fields: [
        { id: 'C', label: 'Cible', hint: 'Le problème ou le risque, en quelques mots.', placeholder: 'Ex. : détresse respiratoire, essoufflement au repos…', rows: 1, elements: [
            { id: 'c_cible', w: 2, label: 'La cible nomme un problème précis (détresse respiratoire, essoufflement, BPCO aggravée)',
              re: [/essouffl/, /respir/, /detresse/, /dyspnee/, /bpco/, /insuffisance respiratoire/, /hypox/, /saturation/, /souffle/] },
            { id: 'c_court', w: 1, label: 'La cible est courte (quelques mots, 14 mots au plus)', test: (n, words) => words >= 2 && words <= 14 }
          ] },
        { id: 'D', label: 'D · Données', hint: 'Ce que tu as constaté : signes, valeurs, heures.', placeholder: 'Ex. : à 7 h 50, essoufflé au repos, lèvres bleutées, FR 28, SpO2 86 %…', rows: 4, elements: [
            { id: 'w_signes', w: 1, label: 'Au moins 2 signes : essoufflement au repos, lèvres bleutées, tirage, sueurs, somnolence, toux et crachats', need: { min: 2, re: [/essouffl/, /respire (vite|mal)/, /polypn/, /tirage/, /cyanos/, /levres/, /bleu/, /sueur/, /transpir/, /somnol/, /assoupi/, /toux/, /crachat/, /penche/] } },
            { id: 'w_const', w: 1, label: 'Au moins 3 constantes avec leur valeur (38,1 · 108 · 150/86 · 28 · 86 %)', test: n => _nConst(n) >= 3 },
            { id: 'w_hab', w: 1, label: 'Comparaison avec son habituel (saturation habituelle 91 %, FR 18/min)', re: [/d habitude/, /habituel/, /habituellement/, /normalement/, /par rapport/, /\b91\b/, /au lieu de/, /avant/] },
            { id: 'w_depuis', w: 1, label: "L'évolution : toux et essoufflement depuis 2 jours, pire ce matin, spray sans effet", re: [/deux jours/, /2 jours/, /avant hier/, /depuis hier/, /aggrav/, /empir/, /de plus en plus/, /ce matin/, /\b7 ?h/, /\b3 ?h/, /\b6 ?h/, /spray/, /ventoline/, /salbutamol/] }
          ],
          warn: { re: [/caprice/, /fait semblant/, /exagere/, /simule/, /chiant/, /agacant/, /mauvaise volonte/, /theatre/, /cinema/], pen: 1,
            text: "Un jugement s'est glissé dans ton texte. Une transmission décrit des faits observables, pas une impression sur la personne." } },
        { id: 'A', label: 'A · Actions', hint: "Ce que toi et l'équipe avez fait.", placeholder: 'Ex. : infirmière alertée à …, 15 appelé, installé assis, surveillance…', rows: 4, elements: [
            { id: 'w_ide', w: 1, label: "L'infirmière référente a été alertée (qui, à quelle heure)", all: [/(sophie|\bide\b|infirmiere|infirmier|referente)/, /(prevenu|alerte|appel|informe|signale|transmis|contacte|avise)/] },
            { id: 'w_samu', w: 2, label: 'Le 15 / le SAMU a été appelé (par qui, à quelle heure)', re: [/\b15\b/, /samu/, /secours/, /smur/, /ambulance/, /pompiers/] },
            { id: 'w_soins', w: 1, label: "Tes actions de soin : installé assis ou demi-assis, resté auprès de lui, surveillance, rien par la bouche, pas de calmant", re: [/assis/, /demi assis/, /redress/, /installe/, /reste/, /surveill/, /rassur/, /rien (par|a) (la )?bouche/, /jeun/, /rien donne/, /pas de calmant/, /pas de somnifere/, /dlu/, /dossier de liaison/] }
          ] },
        { id: 'R', label: 'R · Résultats', hint: "Où en est le résident après ces actions ? Qu'est-ce qui reste à faire ?", placeholder: 'Ex. : gaz du sang : …, secours arrivés à …, transféré vers …, fils prévenu', rows: 4, elements: [
            { id: 'r_gaz', w: 2, label: 'Le gaz du sang du SMUR : les valeurs et ta lecture sommaire (pH bas, PaCO₂ élevée, PaO₂ basse)',
              need: { min: 2, re: [/gaz du sang/, /\bgds\b/, /gazometrie/, /\bph\b/, /\b7 29\b/, /paco2|pco2/, /\b66\b/, /hypercapn/, /acidose/, /respiratoire/, /pao2|po2/, /\b54\b/, /hypoxemie/, /hco3|bicarbonate/, /\b31\b/] } },
            { id: 'r_etat', w: 1, label: "L'état du résident et la prise en charge (secours arrivés, transfert aux urgences)", re: [/secours/, /samu/, /smur/, /ambulance/, /transf/, /emmene/, /parti/, /hopital/, /urgences?/, /prise en charge/, /en attente/, /arrive/, /sans changement/, /inchange/, /stable/, /vigilance/] },
            { id: 'r_suite', w: 1, label: 'La suite : famille prévenue, DLU remis, nouvelles à demander', re: [/fils/, /patrick/, /famille/, /prevenu/, /dlu/, /dossier de liaison/, /nouvelles/, /a suivre/, /a verifier/, /a rappeler/] }
          ] }
      ],
      model: {
        C: "Détresse respiratoire chez un résident BPCO : essoufflement au repos",
        D: "À 7 h 50 : résident assis, penché en avant, phrases coupées, lèvres bleutées, tirage intercostal, sueurs, somnolent. Toux et crachats jaune-vert depuis 2 jours, aggravation cette nuit (spray sans effet à 3 h et 6 h 30). FR 28/min (18 d'habitude), SpO2 86 % en air ambiant (91 % d'habitude), pouls 108/min, PA 150/86, température 38,1 °C.",
        A: "Infirmière (Sophie) alertée à [heure], 15 appelé par l'infirmière à [heure]. Resté auprès du résident, rassuré, installé assis, rien donné par la bouche, pas de calmant, pas d'oxygène mis en route par moi. Surveillance de la respiration et de la saturation en attendant les secours. Dossier de liaison d'urgence préparé.",
        R: "Gaz du sang réalisé par le SMUR et communiqué à Sophie : pH 7,29, PaCO₂ 66 mmHg, HCO₃⁻ 31 mmol/L, PaO₂ 54 mmHg. Ma lecture sommaire : pH bas, PaCO₂ élevée, PaO₂ basse (l'interprétation est faite par le médecin). Secours arrivés à [heure], résident transféré aux urgences. Fils Patrick prévenu par l'infirmière. À suivre : nouvelles de l'hôpital."
      },
      aiFacts: null
    }
  });
})();
