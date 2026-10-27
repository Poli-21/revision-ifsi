// data/patho.js — « Pathologies aux urgences » : 8 cas fictifs à identifier en 5 minutes (App.PathoData)
// Le jeu : tu accueilles un patient, tu as 5 minutes (temps simulé) pour poser des questions et faire des examens de base ;
// ce n'est qu'à la fin que tu dis quelle pathologie tu suspectes et quelle prise en charge tu proposes.
// ⚠ Outil d'ENTRAÎNEMENT au raisonnement : patients et valeurs FICTIFS, simplifiés. En stage, l'étudiant ne pose pas de diagnostic et ne prescrit rien :
//   il observe, mesure, alerte et transmet ; le diagnostic et les prescriptions reviennent au médecin, selon les protocoles du service.
// ⚠ Contenu à confirmer avec ton cours (UE B3, UE C, etc.) et ton formateur.
'use strict';
window.App = window.App || {};

App.PathoData = (() => {
  const BUDGET = 300;                                   // secondes de temps simulé

  // Valeurs « normales » par défaut (un patient peut les écraser)
  const NORMAL = { temp: 37.0, fc: 78, rhythm: 'régulier', pa: [125, 75], fr: 16, spo2: 98, glyc: 1.0 };

  // Questions : cost en secondes. Réponse par défaut = « normal / non » ; chaque cas écrase ce qui compte.
  const QUESTIONS = [
    { id: 'q_motif',    th: 'Pourquoi', label: "Qu'est-ce qui vous amène ?",                    cost: 10, def: "Je ne me sens pas bien." },
    { id: 'q_debut',    th: 'Pourquoi', label: 'Depuis quand ? Comment ça a commencé ?',        cost: 20, def: "Depuis aujourd'hui." },
    { id: 'q_douleur',  th: 'Symptômes', label: 'Avez-vous mal ? Où, comment ?',                cost: 20, def: "Non, je n'ai mal nulle part." },
    { id: 'q_respir',   th: 'Symptômes', label: 'Respirez-vous bien ?',                         cost: 20, def: "Oui, je respire normalement." },
    { id: 'q_toux',     th: 'Symptômes', label: 'Toussez-vous ? Crachez-vous ?',                cost: 15, def: "Non, pas de toux ni de crachats." },
    { id: 'q_fievre',   th: 'Symptômes', label: 'Avez-vous eu de la fièvre, des frissons ?',    cost: 15, def: "Non, pas de fièvre ni de frissons." },
    { id: 'q_digestif', th: 'Symptômes', label: 'Nausées, vomissements, selles ?',              cost: 20, def: "Non, tout est normal de ce côté." },
    { id: 'q_urines',   th: 'Symptômes', label: 'Vos urines : brûlures, couleur, fréquence ?',  cost: 15, def: "Mes urines sont normales." },
    { id: 'q_neuro',    th: 'Symptômes', label: 'Faiblesse, parole, vue, maux de tête ?',       cost: 20, def: "Non, ni faiblesse, ni trouble de la parole ou de la vue, ni mal de tête." },
    { id: 'q_malaise',  th: 'Symptômes', label: 'Malaise, perte de connaissance, palpitations ?', cost: 15, def: "Non, pas de malaise ni de palpitations." },
    { id: 'q_poids',    th: 'Symptômes', label: 'Votre poids, vos jambes ?',                    cost: 15, def: "Mon poids est stable, mes jambes sont normales." },
    { id: 'q_atcd',     th: 'Dossier', label: 'Quels sont vos antécédents ?',                   cost: 20, def: "Rien de particulier." },
    { id: 'q_ttt',      th: 'Dossier', label: 'Quels médicaments prenez-vous ?',                cost: 20, def: "Aucun traitement." },
    { id: 'q_allerg',   th: 'Dossier', label: 'Êtes-vous allergique ?',                         cost: 10, def: "Non, aucune allergie connue." },
    { id: 'q_habitudes', th: 'Dossier', label: 'Tabac, alcool ?',                               cost: 10, def: "Je ne fume pas, je bois très peu." },
    { id: 'q_recent',   th: 'Dossier', label: 'Quelque chose de récent : opération, voyage, chute, repas ?', cost: 20, def: "Rien de particulier récemment." }
  ];

  // Examens de base : text peut être une fonction (valeurs du patient) ; abn = anormal (surligné)
  const EXAMS = [
    { id: 'e_peau',   ico: '🖐️', label: 'Regarder la peau et le teint',           cost: 20, def: "Teint normal, pas de sueurs, pas de cyanose, extrémités chaudes." },
    { id: 'e_temp',   ico: '🌡️', label: 'Prendre la température',                  cost: 20, vital: 'temp' },
    { id: 'e_pa',     ico: '🩺', label: 'Pouls et tension artérielle',            cost: 30, vital: 'pa' },
    { id: 'e_resp',   ico: '🫁', label: 'Fréquence respiratoire et saturation',   cost: 30, vital: 'resp' },
    { id: 'e_glyc',   ico: '🩸', label: 'Glycémie capillaire',                    cost: 30, vital: 'glyc' },
    { id: 'e_poum',   ico: '👂', label: 'Écouter les poumons',                    cost: 40, def: "Murmure vésiculaire normal des deux côtés, aucun bruit anormal." },
    { id: 'e_coeur',  ico: '❤️', label: 'Écouter le cœur',                        cost: 40, def: "Bruits du cœur réguliers, pas de souffle." },
    { id: 'e_abdo',   ico: '🤲', label: 'Examiner le ventre',                     cost: 40, def: "Ventre souple, indolore, sans défense ni masse." },
    { id: 'e_neuro',  ico: '🧠', label: 'Visage, bras, parole, orientation',      cost: 40, def: "Visage symétrique, les deux bras se lèvent, parole normale, bien orienté." },
    { id: 'e_membres', ico: '🦵', label: 'Examiner les jambes et les mollets',    cost: 30, def: "Mollets souples, indolores, symétriques ; pas d'œdème." },
    { id: 'e_bu',     ico: '🧪', label: 'Bandelette urinaire',                    cost: 30, def: "Bandelette urinaire négative (leucocytes −, nitrites −, sang −)." },
    { id: 'e_ecg',    ico: '📈', label: 'ECG',                                    cost: 60, def: "ECG : rythme sinusal régulier, tracé normal." }
  ];

  // Diagnostics « leurres » ajoutés aux propositions
  const EXTRA_DX = ['Pneumothorax', 'Gastro-entérite aiguë', 'Crise d\'angoisse', 'Colique néphrétique', 'Pneumopathie infectieuse', 'Hyperglycémie avec acidocétose'];

  // Un cas : v = valeurs (écrasent NORMAL) ; q / x = réponses aux questions / examens ; key = indices qui comptent ; tt = prises en charge proposées
  // tt[i] = { t, ok, why } : ok = adapté ; sinon non adapté ou dangereux (why explique).
  const CASES = [
    {
      id: 'oap', dx: 'Œdème aigu du poumon (insuffisance cardiaque décompensée)',
      pt: { nom: 'M. Fabre', age: 76, sexe: 'M', ico: '👴' },
      arrival: "M. Fabre, 76 ans, est amené en fauteuil roulant. Il est assis tout droit, très essoufflé, il ne parvient pas à finir ses phrases et refuse de s'allonger.",
      v: { temp: 36.9, fc: 112, pa: [168, 95], fr: 30, spo2: 86, glyc: 1.3 },
      q: {
        q_motif: "Je n'arrive plus à respirer… surtout quand je suis allongé.",
        q_debut: "Depuis cette nuit : je me suis réveillé en sursaut en étouffant. Depuis une semaine, je suis de plus en plus essoufflé.",
        q_douleur: "Pas vraiment de douleur, plutôt une oppression sur la poitrine.",
        q_respir: "Non ! Je m'étouffe, je ne peux pas m'allonger, j'ai dormi sur trois oreillers.",
        q_toux: "Oui, une toux avec des crachats mousseux, un peu rosés.",
        q_poids: "J'ai pris 4 kilos en une semaine et mes chevilles ont gonflé.",
        q_atcd: "Hypertension, un infarctus il y a 6 ans, et une insuffisance cardiaque.",
        q_ttt: "Furosémide (un diurétique), bisoprolol, ramipril… mais j'ai arrêté le furosémide il y a 10 jours, je me levais trop la nuit pour uriner.",
        q_recent: "Un repas de famille ce week-end : charcuterie, plats très salés."
      },
      x: {
        e_peau: { t: "Sueurs, lèvres légèrement bleutées, extrémités froides.", abn: true },
        e_poum: { t: "Râles crépitants (comme du bouillonnement) dans les deux poumons, jusqu'à mi-hauteur.", abn: true },
        e_coeur: { t: "Bruits du cœur rapides, avec un bruit de galop.", abn: true },
        e_membres: { t: "Œdèmes mous (le doigt laisse un creux) des deux chevilles, jusqu'aux genoux.", abn: true },
        e_ecg: { t: "ECG : tachycardie sinusale à 112/min, séquelle d'ancien infarctus ; pas de sus-décalage du segment ST.", abn: true }
      },
      key: ['q_respir', 'q_poids', 'q_ttt', 'q_toux', 'e_poum', 'e_membres', 'e_resp'],
      why: "Essoufflement qui empêche de s'allonger (orthopnée), prise de poids rapide, chevilles gonflées, crépitants dans les deux poumons, crachats mousseux, arrêt du diurétique et repas très salé : le cœur n'arrive plus à évacuer le sang, le liquide envahit les poumons. C'est l'œdème aigu du poumon d'origine cardiaque.",
      confuse: "À ne pas confondre avec une exacerbation de BPCO : ici pas de fièvre, pas de sifflements, mais des œdèmes des jambes, un galop et des crépitants.",
      tt: [
        { t: "Le garder assis, jambes pendantes, bien soutenu", ok: true, why: "Assis, le sang stagne dans les jambes et soulage les poumons ; c'est la position qu'il a choisie." },
        { t: "Oxygène (prescrit), avec surveillance de la saturation", ok: true, why: "Sa saturation est à 86 % : l'oxygène est nécessaire, sur prescription, avec une cible adaptée." },
        { t: "Diurétique par voie veineuse (furosémide), prescrit par le médecin", ok: true, why: "Il faut éliminer l'eau en excès rapidement ; c'est le traitement de base de ce tableau." },
        { t: "Scope : surveillance continue (saturation, fréquence cardiaque, tension)", ok: true, why: "Ce patient peut s'aggraver vite : on le surveille en continu." },
        { t: "Dérivé nitré (prescrit), si la tension le permet", ok: true, why: "Il dilate les vaisseaux et soulage le cœur ; sa tension est élevée (168/95)." },
        { t: "ECG, prise de sang, radiographie du thorax", ok: true, why: "Bilan pour confirmer et chercher la cause de la décompensation." },
        { t: "Poser une perfusion de 1 litre de sérum physiologique en urgence", ok: false, why: "Ce serait ajouter de l'eau et du sel à un patient noyé : dangereux." },
        { t: "L'allonger à plat pour qu'il se repose", ok: false, why: "À plat, le liquide remonte dans les poumons : il s'étouffe." },
        { t: "Antibiotique d'emblée pour « la bronchite »", ok: false, why: "Pas de fièvre, pas d'infection évidente : ce n'est pas le problème." },
        { t: "Lui donner un grand verre d'eau pour calmer la toux", ok: false, why: "Il est en surcharge liquidienne : on limite l'eau et on ne donne rien par la bouche avant l'avis." }
      ]
    },
    {
      id: 'bpco', dx: 'Exacerbation de BPCO (bronchopneumopathie chronique obstructive)',
      pt: { nom: 'Mme Garnier', age: 70, sexe: 'F', ico: '👵' },
      arrival: "Mme Garnier, 70 ans, arrive avec sa fille. Elle est assise penchée en avant, les lèvres pincées, et parle par petits bouts de phrases.",
      v: { temp: 38.1, fc: 104, pa: [140, 80], fr: 26, spo2: 85, glyc: 1.1 },
      q: {
        q_motif: "Je… manque d'air… depuis hier soir.",
        q_debut: "Toux grasse depuis 3 jours, et de plus en plus essoufflée depuis hier.",
        q_respir: "Non… même assise, je manque d'air. Ma Ventoline ne me soulage presque plus.",
        q_toux: "Oui, je crache vert-jaune, plus que d'habitude.",
        q_fievre: "J'ai eu des frissons cette nuit.",
        q_atcd: "Une BPCO sévère. Pas d'oxygène à la maison.",
        q_ttt: "Des sprays : Ventoline et Spiriva.",
        q_habitudes: "J'ai fumé 40 ans, un paquet par jour. J'ai arrêté il y a deux ans.",
        q_poids: "Mon poids n'a pas changé ; pas de jambes gonflées."
      },
      x: {
        e_peau: { t: "Lèvres et bouts des doigts bleutés, quelques sueurs, joues rouges.", abn: true },
        e_poum: { t: "Sifflements à l'expiration, quelques râles qui « bouillonnent » ; thorax bombé, tirage entre les côtes.", abn: true },
        e_coeur: { t: "Rapide, régulier, sans souffle.", abn: true },
        e_ecg: { t: "ECG : tachycardie sinusale à 104/min, sans autre anomalie.", abn: true }
      },
      key: ['q_atcd', 'q_habitudes', 'q_toux', 'q_fievre', 'e_poum', 'e_resp', 'e_temp'],
      why: "BPCO connue chez une ancienne grande fumeuse, toux avec crachats purulents, fièvre, essoufflement qui augmente malgré le spray, sifflements et tirage : c'est une exacerbation de BPCO, probablement d'origine infectieuse. Sa saturation (85 %) est basse, mais sa cible à elle est de 88 à 92 %.",
      confuse: "Piège : donner beaucoup d'oxygène à une personne BPCO fait monter son CO₂ et peut l'endormir.",
      tt: [
        { t: "La garder assise, penchée en avant, les bras appuyés", ok: true, why: "Position de soulagement naturelle en détresse respiratoire." },
        { t: "Oxygène à bas débit (lunettes), cible de saturation 88 à 92 %", ok: true, why: "Chez une personne BPCO, on corrige l'hypoxémie sans la piéger : bas débit, surveillance de la vigilance." },
        { t: "Aérosols de bronchodilatateurs, de préférence à l'air comprimé", ok: true, why: "Ils ouvrent les bronches ; à l'air pour ne pas donner trop d'oxygène." },
        { t: "Corticoïde et antibiotique (infection probable), prescrits par le médecin", ok: true, why: "Traitement habituel d'une exacerbation avec crachats purulents et fièvre." },
        { t: "Scope et surveillance rapprochée de la vigilance", ok: true, why: "Un excès de CO₂ se manifeste par de la somnolence : il faut la repérer." },
        { t: "Gaz du sang artériel, radiographie du thorax, prise de sang", ok: true, why: "Bilan pour mesurer le CO₂ et chercher un foyer d'infection." },
        { t: "Masque à haute concentration à 15 L/min pour monter la saturation à 100 %", ok: false, why: "Piège classique : trop d'oxygène fait monter le CO₂ ; elle risque de s'endormir (hypercapnie)." },
        { t: "Un somnifère ou un calmant pour la détendre", ok: false, why: "Ces médicaments ralentissent la respiration : dangereux chez une personne BPCO." },
        { t: "Diurétique par voie veineuse d'emblée", ok: false, why: "Pas de signes de surcharge (pas d'œdèmes, pas de crépitants) : ce n'est pas la cause." },
        { t: "L'allonger à plat", ok: false, why: "À plat, elle respire encore plus mal." }
      ]
    },
    {
      id: 'hypo', dx: 'Hypoglycémie (chez un patient diabétique sous insuline)',
      pt: { nom: 'M. Perrin', age: 58, sexe: 'M', ico: '👨' },
      arrival: "M. Perrin, 58 ans, est amené par son épouse. Il est pâle, en sueur, tremble des mains, et répond lentement, un peu à côté.",
      v: { temp: 36.6, fc: 102, pa: [135, 80], fr: 18, spo2: 97, glyc: 0.38 },
      q: {
        q_motif: "(Son épouse) Il tremble, il transpire et il dit des choses bizarres depuis 20 minutes.",
        q_debut: "(Son épouse) C'est venu d'un coup, en fin de matinée, pendant qu'il bricolait dans le garage.",
        q_malaise: "(M. Perrin, lentement) J'ai les jambes en coton… la tête qui tourne… j'ai faim.",
        q_neuro: "Il n'a pas de faiblesse d'un côté, mais il a du mal à trouver ses mots et à se concentrer.",
        q_atcd: "Diabète depuis 15 ans, sous insuline.",
        q_ttt: "(Son épouse) Il a fait son insuline ce matin, comme d'habitude. Et des comprimés pour la tension.",
        q_recent: "(Son épouse) Il n'a presque rien mangé au petit-déjeuner et pas de déjeuner, et il a travaillé dur dans le garage.",
        q_digestif: "Il dit qu'il a faim, pas de vomissements."
      },
      x: {
        e_peau: { t: "Très pâle, sueurs profuses (visage et mains moites), tremblements des mains.", abn: true },
        e_neuro: { t: "Visage symétrique, les deux bras se lèvent ; parole lente et ralentie, un peu confus, il se laisse réveiller.", abn: true },
        e_ecg: { t: "ECG : tachycardie sinusale à 102/min, sans autre anomalie." }
      },
      key: ['e_glyc', 'q_recent', 'q_atcd', 'q_ttt', 'e_peau'],
      why: "Diabétique sous insuline, qui n'a pas mangé et a fait un gros effort, avec sueurs, tremblements, faim, confusion d'apparition brutale : tableau typique d'hypoglycémie. La glycémie capillaire (0,38 g/L) le confirme en 30 secondes.",
      confuse: "Un déficit neurologique ou un malaise cardiaque donnent des signes proches ; la glycémie capillaire se fait toujours devant une confusion chez un diabétique.",
      tt: [
        { t: "Glycémie capillaire immédiate, puis un contrôle 15 minutes après le resucrage", ok: true, why: "On confirme, puis on vérifie que le traitement a marché." },
        { t: "Resucrage par voie orale (15 g de sucre) s'il est conscient et peut avaler", ok: true, why: "Le sucre rapide corrige l'hypoglycémie en quelques minutes s'il peut avaler sans risque." },
        { t: "S'il ne peut plus avaler : glucose en intraveineuse ou glucagon, sur prescription", ok: true, why: "Rien par la bouche s'il est somnolent (fausse route) : on passe par la voie veineuse ou le glucagon." },
        { t: "Le garder en surveillance (glycémie, vigilance, constantes) et chercher la cause", ok: true, why: "L'insuline continue d'agir : le risque de rechute existe." },
        { t: "Lui donner ensuite une collation (sucres lents) une fois la glycémie remontée", ok: true, why: "Pour éviter une nouvelle chute." },
        { t: "Refaire une injection d'insuline pour « équilibrer »", ok: false, why: "L'insuline fait baisser la glycémie : ce serait aggraver l'hypoglycémie." },
        { t: "Le laisser se reposer, sans rien mesurer ni donner", ok: false, why: "Une hypoglycémie non traitée peut conduire au coma et aux convulsions." },
        { t: "Lui faire boire un grand verre d'eau pour qu'il se réveille", ok: false, why: "L'eau ne corrige pas la glycémie." },
        { t: "Lui verser du sucre dans la bouche s'il devient inconscient", ok: false, why: "Risque de fausse route : on n'administre rien par la bouche à une personne inconsciente." }
      ]
    },
    {
      id: 'avc', dx: 'AVC ischémique (accident vasculaire cérébral)',
      pt: { nom: 'Mme Rey', age: 72, sexe: 'F', ico: '👵' },
      arrival: "Mme Rey, 72 ans, arrive avec son mari. Sa bouche est tombante d'un côté et elle tient son bras droit contre elle.",
      v: { temp: 36.8, fc: 88, rhythm: 'irrégulier', pa: [182, 98], fr: 16, spo2: 96, glyc: 1.2 },
      q: {
        q_motif: "(Son mari) Elle a lâché sa tasse et elle parle bizarrement.",
        q_debut: "(Son mari) C'est arrivé d'un coup à 8 h 40 au petit-déjeuner ; il y a 50 minutes.",
        q_neuro: "Elle n'arrive plus à bouger le bras droit ni à serrer ma main ; elle cherche ses mots. Pas de mal de tête.",
        q_douleur: "Elle n'a mal nulle part.",
        q_atcd: "Hypertension et un cœur qui bat irrégulièrement (fibrillation auriculaire).",
        q_ttt: "Un médicament pour la tension. Pas d'anticoagulant : elle a refusé il y a un an.",
        q_malaise: "Pas de perte de connaissance ; elle est restée consciente.",
        q_recent: "Aucune chute ni choc. Elle a déjeuné légèrement."
      },
      x: {
        e_neuro: { t: "Bouche tombante à droite, le bras droit retombe quand on lui demande de lever les deux bras, la parole est difficile : elle cherche ses mots. Elle est éveillée et comprend.", abn: true },
        e_pa: { t: "Pouls irrégulier à 88/min. Tension 182/98 mmHg.", abn: true },
        e_ecg: { t: "ECG : arythmie complète par fibrillation auriculaire.", abn: true }
      },
      key: ['q_debut', 'q_neuro', 'e_neuro', 'q_atcd', 'e_pa'],
      why: "Début brutal, déficit du visage et du bras droit, trouble de la parole, chez une patiente hypertendue avec fibrillation auriculaire non anticoagulée : tableau d'AVC ischémique. L'heure de début (8 h 40) est capitale car certains traitements ne sont possibles que dans un délai limité.",
      confuse: "Une hypoglycémie peut imiter un AVC : la glycémie capillaire doit toujours être faite (ici 1,2 g/L).",
      tt: [
        { t: "Noter l'heure exacte de début et alerter immédiatement la filière AVC (médecin, imagerie cérébrale urgente)", ok: true, why: "Le temps est du cerveau : le scanner ou l'IRM doit être fait vite pour savoir si un traitement est possible." },
        { t: "Glycémie capillaire, scope, constantes régulières et surveillance de la vigilance", ok: true, why: "On écarte une hypoglycémie et on surveille l'évolution." },
        { t: "Rien par la bouche (à jeun) en attendant un test de déglutition", ok: true, why: "Un AVC perturbe la déglutition : risque de fausse route." },
        { t: "Poser une voie veineuse et faire une prise de sang (selon prescription)", ok: true, why: "Bilan préparatoire à un éventuel traitement." },
        { t: "Installation confortable, sécurité (barrières), la rassurer", ok: true, why: "Elle peut avoir peur et risque de chuter." },
        { t: "Faire baisser sa tension rapidement avec un antihypertenseur", ok: false, why: "Dans l'AVC ischémique, on laisse la tension élevée au début : la baisser brutalement aggrave l'atteinte." },
        { t: "Lui donner de l'aspirine ou un anticoagulant tout de suite", ok: false, why: "Tant que l'imagerie n'a pas écarté une hémorragie cérébrale, ce serait dangereux." },
        { t: "Lui faire boire de l'eau pour avaler son comprimé", ok: false, why: "Risque de fausse route." },
        { t: "La renvoyer à domicile en attendant que ça passe", ok: false, why: "C'est une urgence vitale et fonctionnelle : chaque minute compte." }
      ]
    },
    {
      id: 'sca', dx: 'Infarctus du myocarde (syndrome coronarien aigu)',
      pt: { nom: 'M. Bonnet', age: 62, sexe: 'M', ico: '👨' },
      arrival: "M. Bonnet, 62 ans, se tient la poitrine avec la main. Il est pâle, le front couvert de sueurs.",
      v: { temp: 36.8, fc: 96, pa: [150, 90], fr: 20, spo2: 95, glyc: 1.4 },
      q: {
        q_motif: "J'ai une douleur horrible dans la poitrine.",
        q_debut: "Depuis 40 minutes, elle est venue au repos, en regardant la télé.",
        q_douleur: "Comme un étau au milieu de la poitrine, qui descend dans le bras gauche et monte dans la mâchoire. Ça ne passe pas.",
        q_respir: "Je suis un peu essoufflé, mais ce n'est pas ça qui me gêne.",
        q_malaise: "J'ai eu un petit vertige. Je n'ai pas perdu connaissance.",
        q_digestif: "J'ai eu une nausée.",
        q_atcd: "Cholestérol, diabète de type 2. Mon père est mort d'un infarctus à 55 ans.",
        q_ttt: "Metformine et une statine.",
        q_habitudes: "Je fume un paquet par jour depuis 30 ans, un verre de vin le soir."
      },
      x: {
        e_peau: { t: "Très pâle, sueurs froides, visage crispé par la douleur.", abn: true },
        e_coeur: { t: "Bruits du cœur réguliers, un peu rapides, sans souffle.", abn: false },
        e_poum: { t: "Murmure vésiculaire normal, pas de crépitants.", abn: false },
        e_ecg: { t: "ECG : sus-décalage du segment ST en V1 à V4 (face antérieure du cœur).", abn: true }
      },
      key: ['q_douleur', 'q_debut', 'q_atcd', 'q_habitudes', 'e_ecg', 'e_peau'],
      why: "Douleur thoracique en étau irradiant vers le bras gauche et la mâchoire, depuis plus de 20 minutes au repos, avec sueurs et pâleur, chez un homme à risque (tabac, diabète, cholestérol, père décédé jeune) : syndrome coronarien aigu. L'ECG avec sus-décalage de ST confirme l'infarctus en cours : il faut désobstruer l'artère vite.",
      confuse: "L'embolie pulmonaire et la dissection aortique donnent aussi une douleur thoracique ; l'ECG et le contexte orientent.",
      tt: [
        { t: "ECG immédiat (moins de 10 minutes) et alerter le médecin sans attendre", ok: true, why: "L'ECG fait le diagnostic ; chaque minute de retard fait mourir du muscle cardiaque." },
        { t: "Repos strict au lit, demi-assis, scope, voie veineuse", ok: true, why: "On limite le travail du cœur et on surveille le rythme (risque de troubles du rythme)." },
        { t: "Aspirine (si aucune contre-indication) et autres traitements antithrombotiques, prescrits", ok: true, why: "Ils limitent l'extension du caillot." },
        { t: "Antalgique puissant (morphine) sur prescription", ok: true, why: "La douleur est intense et augmente le travail du cœur." },
        { t: "Coronarographie en urgence : transfert vers la salle de cathétérisme", ok: true, why: "Le traitement de référence est de déboucher l'artère." },
        { t: "Prise de sang avec troponine (sans retarder l'ECG ni le traitement)", ok: true, why: "Elle confirme les lésions du cœur mais on n'attend pas son résultat." },
        { t: "Oxygène systématique à haut débit", ok: false, why: "Sa saturation est normale (95 %) : on n'en donne que si elle est basse (< 90 %)." },
        { t: "Un anti-inflammatoire (ibuprofène) contre la douleur", ok: false, why: "Dangereux en cas d'infarctus : il augmente le risque cardiovasculaire." },
        { t: "Attendre le résultat de la prise de sang avant de faire l'ECG", ok: false, why: "L'ECG se fait tout de suite : attendre fait perdre un temps vital." },
        { t: "Le faire marcher pour voir si la douleur passe", ok: false, why: "L'effort peut provoquer une arythmie grave." }
      ]
    },
    {
      id: 'ep', dx: 'Embolie pulmonaire',
      pt: { nom: 'Mme Faure', age: 45, sexe: 'F', ico: '👩' },
      arrival: "Mme Faure, 45 ans, arrive aux urgences en boitant, très essoufflée, la main sur le côté droit de la poitrine.",
      v: { temp: 37.4, fc: 118, pa: [118, 72], fr: 28, spo2: 89, glyc: 1.0 },
      q: {
        q_motif: "Je suis essoufflée d'un coup et j'ai mal en respirant.",
        q_debut: "Brutalement il y a 2 heures, en montant l'escalier.",
        q_douleur: "Au côté droit de la poitrine ; ça augmente quand je respire profondément. Mon mollet gauche me fait aussi mal depuis deux jours.",
        q_respir: "Non, je suis à bout de souffle au moindre mouvement.",
        q_toux: "Une petite toux sèche, avec un crachat strié de sang ce matin.",
        q_malaise: "Mon cœur bat très vite.",
        q_recent: "J'ai été opérée du genou il y a 10 jours, j'ai beaucoup été allongée, et on a arrêté mes piqûres anticoagulantes il y a 3 jours.",
        q_ttt: "La pilule contraceptive et des antidouleurs.",
        q_atcd: "Rien d'autre que l'opération du genou."
      },
      x: {
        e_peau: { t: "Pâle, quelques sueurs, un peu bleutée aux lèvres.", abn: true },
        e_poum: { t: "Auscultation normale : pas de bruits anormaux (le poumon n'entend rien).", abn: false },
        e_membres: { t: "Mollet gauche gonflé, chaud et douloureux à la pression (par rapport au droit).", abn: true },
        e_ecg: { t: "ECG : tachycardie sinusale à 118/min, sans signe d'infarctus.", abn: true }
      },
      key: ['q_recent', 'q_debut', 'q_douleur', 'e_membres', 'e_resp', 'q_ttt'],
      why: "Essoufflement et douleur thoracique brutaux, tachycardie, saturation basse, chez une patiente opérée du genou récemment, immobilisée, sous pilule, avec un mollet gonflé : tout oriente vers un caillot parti d'une veine de la jambe (phlébite) et bloqué dans un poumon.",
      confuse: "Les poumons « n'ont rien à l'écoute », ce qui oriente vers une cause vasculaire plutôt qu'infectieuse ou bronchique.",
      tt: [
        { t: "La garder assise ou demi-assise, repos strict, scope", ok: true, why: "On soulage la respiration et on surveille ; on évite tout effort." },
        { t: "Oxygène (prescrit) pour obtenir une saturation normale", ok: true, why: "Sa saturation est à 89 %, il faut la corriger." },
        { t: "Alerter le médecin immédiatement", ok: true, why: "C'est une urgence potentiellement mortelle." },
        { t: "Examens pour confirmer : prise de sang (D-dimères), angioscanner thoracique, échographie des veines, selon prescription", ok: true, why: "Ils confirment le caillot dans le poumon et la jambe." },
        { t: "Anticoagulant (héparine) prescrit, après confirmation ou forte suspicion", ok: true, why: "Il empêche le caillot de grossir et d'en former d'autres." },
        { t: "Masser le mollet douloureux pour « dégonfler »", ok: false, why: "Un massage peut détacher d'autres caillots : à proscrire." },
        { t: "La faire marcher pour « dégager » les poumons", ok: false, why: "L'effort aggrave l'essoufflement et peut provoquer une récidive." },
        { t: "Antibiotique d'emblée pour une infection pulmonaire", ok: false, why: "Pas de fièvre notable ni de signe d'infection ; le tableau est celui d'un caillot." },
        { t: "Un anxiolytique pour la calmer et la renvoyer chez elle", ok: false, why: "L'angoisse est la conséquence du manque d'air : c'est une urgence." }
      ]
    },
    {
      id: 'pna', dx: 'Pyélonéphrite aiguë (infection urinaire haute)',
      pt: { nom: 'Mme Chevalier', age: 29, sexe: 'F', ico: '👩' },
      arrival: "Mme Chevalier, 29 ans, est recroquevillée sur la chaise, grelotte et se tient le côté droit du bas du dos.",
      v: { temp: 39.2, fc: 110, pa: [110, 65], fr: 20, spo2: 98, glyc: 1.0 },
      q: {
        q_motif: "J'ai de la fièvre, des frissons et très mal au dos.",
        q_debut: "Des brûlures en urinant depuis 3 jours ; les frissons et la fièvre depuis hier soir.",
        q_douleur: "Une douleur au bas du dos, côté droit, qui descend vers le ventre. Elle est constante.",
        q_fievre: "Oui, jusqu'à 39 °C et des frissons intenses.",
        q_urines: "Ça brûle, j'ai envie sans arrêt, mes urines sont troubles et sentent fort.",
        q_digestif: "Des nausées, j'ai vomi une fois.",
        q_atcd: "Plusieurs cystites dans l'année. Pas de grossesse.",
        q_ttt: "Aucun traitement, juste du paracétamol pris hier soir.",
        q_recent: "Rien de particulier."
      },
      x: {
        e_peau: { t: "Joues rouges, peau chaude et moite, frissons.", abn: true },
        e_abdo: { t: "Ventre souple ; douleur vive quand on tapote le bas du dos à droite (ébranlement de la fosse lombaire droite).", abn: true },
        e_bu: { t: "Bandelette urinaire : leucocytes +++, nitrites positifs, sang +.", abn: true }
      },
      key: ['q_urines', 'q_fievre', 'q_douleur', 'e_abdo', 'e_bu', 'e_temp'],
      why: "Fièvre élevée avec frissons, douleur lombaire d'un côté, signes de cystite (brûlures, envies fréquentes) et bandelette avec leucocytes et nitrites : l'infection est remontée jusqu'au rein, c'est une pyélonéphrite aiguë.",
      confuse: "La colique néphrétique donne aussi une douleur lombaire, mais sans fièvre ni signes urinaires infectieux.",
      tt: [
        { t: "Prélever les urines pour un ECBU (examen cytobactériologique) avant l'antibiotique", ok: true, why: "Il identifie la bactérie et guide l'antibiothérapie." },
        { t: "Antibiotique adapté, prescrit (souvent par voie veineuse au début)", ok: true, why: "C'est le traitement de la cause." },
        { t: "Paracétamol contre la fièvre et la douleur, sur prescription", ok: true, why: "Soulage sans agresser le rein." },
        { t: "Bien l'hydrater (boissons ou perfusion)", ok: true, why: "Elle a de la fièvre, elle a vomi et elle perd de l'eau." },
        { t: "Surveiller constantes (fièvre, tension, pouls) et prélever des hémocultures si prescrites", ok: true, why: "Une infection urinaire haute peut se compliquer d'un sepsis." },
        { t: "Imagerie (échographie ou scanner) selon prescription", ok: true, why: "Pour chercher un obstacle ou un abcès si l'évolution n'est pas favorable." },
        { t: "Un anti-inflammatoire (ibuprofène)", ok: false, why: "Les AINS sont toxiques pour le rein en cas d'infection : à éviter." },
        { t: "Lui demander de moins boire pour limiter les envies d'uriner", ok: false, why: "Il faut au contraire bien s'hydrater pour « laver » les urines." },
        { t: "Un antibiotique sans aucun prélèvement ni avis médical", ok: false, why: "On prélève avant, et la prescription revient au médecin." },
        { t: "Poser une sonde urinaire systématiquement", ok: false, why: "Elle augmente le risque d'infection : non systématique." }
      ]
    },
    {
      id: 'app', dx: 'Appendicite aiguë',
      pt: { nom: 'M. Lopez', age: 19, sexe: 'M', ico: '🧑' },
      arrival: "M. Lopez, 19 ans, entre en marchant courbé, la main sur le bas du ventre à droite.",
      v: { temp: 38.0, fc: 98, pa: [120, 70], fr: 18, spo2: 99, glyc: 0.95 },
      q: {
        q_motif: "J'ai très mal au ventre.",
        q_debut: "Depuis hier soir, autour du nombril. Ce matin la douleur est descendue en bas à droite.",
        q_douleur: "Ça tire, c'est pire quand je marche, quand je tousse ou quand je saute.",
        q_digestif: "Nausées, un vomissement, pas faim du tout, pas de selles depuis hier.",
        q_fievre: "Un peu chaud ce matin.",
        q_urines: "Normales.",
        q_atcd: "Aucun. Jamais opéré.",
        q_recent: "J'ai peu mangé hier soir."
      },
      x: {
        e_peau: { t: "Teint un peu gris, visage crispé par la douleur, légère transpiration.", abn: true },
        e_abdo: { t: "Douleur nette en bas à droite (fosse iliaque droite) ; le ventre est dur à cet endroit (défense) ; douleur plus forte quand on relâche la main (rebond).", abn: true },
        e_bu: { t: "Bandelette urinaire : normale.", abn: false }
      },
      key: ['q_debut', 'q_douleur', 'q_digestif', 'e_abdo', 'e_temp'],
      why: "Douleur qui commence près du nombril et migre en bas à droite, aggravée par la marche et la toux, avec nausées, perte d'appétit, petite fièvre, et un ventre qui présente une défense et un rebond en fosse iliaque droite : appendicite aiguë, à opérer.",
      confuse: "Une gastro-entérite donnerait des diarrhées et un ventre souple ; une colique néphrétique des signes urinaires.",
      tt: [
        { t: "À jeun strict (rien à boire ni à manger)", ok: true, why: "Il risque d'aller au bloc opératoire ; l'anesthésie impose le jeûne." },
        { t: "Alerter le médecin / le chirurgien", ok: true, why: "C'est une urgence chirurgicale." },
        { t: "Voie veineuse, hydratation et prise de sang (NFS, CRP)", ok: true, why: "On prépare l'intervention et on évalue l'inflammation." },
        { t: "Antalgique (paracétamol) prescrit", ok: true, why: "Soulager sans masquer l'examen du ventre." },
        { t: "Imagerie (échographie ou scanner) selon prescription", ok: true, why: "Elle confirme le diagnostic en cas de doute." },
        { t: "Surveiller température, douleur et signes de péritonite (ventre dur, fièvre en hausse)", ok: true, why: "L'appendice peut se perforer." },
        { t: "Lui donner à manger et à boire pour reprendre des forces", ok: false, why: "Il sera probablement opéré : il doit rester à jeun." },
        { t: "Poser une bouillotte chaude sur le ventre", ok: false, why: "La chaleur peut favoriser la perforation et ne soigne rien." },
        { t: "Un laxatif ou un lavement pour « débloquer »", ok: false, why: "Ça peut précipiter la perforation de l'appendice." },
        { t: "Un anti-inflammatoire puis retour à domicile", ok: false, why: "Il s'agit d'une urgence chirurgicale : il ne doit pas rentrer." }
      ]
    }
  ];

  return { BUDGET, NORMAL, QUESTIONS, EXAMS, EXTRA_DX, CASES };
})();
