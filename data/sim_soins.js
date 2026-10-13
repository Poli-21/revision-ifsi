// data/sim_soins.js — Simulation clinique : gestes de sécurité pendant le recueil
// (installer le résident, alerter l'infirmière, mettre de l'oxygène). Patients fictifs.
// Chaque scénario dit ce que valent ces gestes pour SON patient : v = 'good' (bon), 'ok' (acceptable),
// 'avoid' (à éviter), 'danger' (dangereux s'il est laissé en place). Les textes `pat` sont la réaction du
// patient, `why` l'explication pédagogique. Repères à valider avec ton formateur et les protocoles de ton stage.
// {e} : « e » ajouté au féminin (« assis{e} » : assis / assise).
'use strict';
window.App = window.App || {};

App.SimSoins = {
  // Positions proposées dans le menu « Agir » (même liste pour tous les cas)
  POS: [
    { id: 'assise',   ico: '🪑', label: 'Assis dans le lit, le dos calé par les oreillers', short: 'Assis{e} dans le lit',
      say: "Je vous installe assis{e} dans le lit, le dos bien calé par les oreillers." },
    { id: 'demi',     ico: '🛏️', label: 'Demi-assis : dossier relevé (30 à 45°)', short: 'Demi-assis{e}',
      say: "Je relève le dossier du lit pour vous mettre en position demi-assise." },
    { id: 'bord',     ico: '🦵', label: 'Assis au bord du lit ou au fauteuil (le lever)', short: 'Assis{e} au bord du lit',
      say: "Je vous aide à vous asseoir au bord du lit." },
    { id: 'allongee', ico: '😴', label: 'Allongé à plat sur le dos', short: 'Allongé{e} à plat',
      say: "Je vous allonge à plat sur le dos." },
    { id: 'jambes',   ico: '🦶', label: 'Allongé, jambes surélevées', short: 'Allongé{e}, jambes surélevées',
      say: "Je vous allonge et je surélève vos jambes." },
    { id: 'pls',      ico: '↪️', label: 'Position latérale de sécurité (PLS)', short: 'En PLS',
      say: "Je vous mets en position latérale de sécurité." }
  ],
  // Oxygène (médicament : repères de débit à valider avec ton cours et le protocole du service)
  O2: [
    { id: 'o2_l1',  dev: 'lunettes', deb: 1,  label: 'Lunettes à oxygène · 1 L/min',                   short: 'O₂ lunettes 1 L/min',
      say: "Je vous mets de l'oxygène avec des lunettes, à 1 litre par minute." },
    { id: 'o2_l2',  dev: 'lunettes', deb: 2,  label: 'Lunettes à oxygène · 2 L/min',                   short: 'O₂ lunettes 2 L/min',
      say: "Je vous mets de l'oxygène avec des lunettes, à 2 litres par minute." },
    { id: 'o2_m6',  dev: 'masque',   deb: 6,  label: 'Masque · 6 L/min',                               short: 'O₂ masque 6 L/min',
      say: "Je vous mets un masque à oxygène, à 6 litres par minute." },
    { id: 'o2_mhc', dev: 'mhc',      deb: 15, label: 'Masque à haute concentration · 15 L/min',        short: 'O₂ masque haute concentration 15 L/min',
      say: "Je vous mets un masque à haute concentration, à 15 litres par minute." }
  ],

  // Textes communs (le scénario peut les remplacer)
  DEFAULT: {
    vital: false,
    alert: {
      // Réponse de l'infirmière quand l'étudiant l'alerte (selon le cas)
      vitalOk:   "Je suis là. J'ai vu. Continue ce que tu fais (constantes, observation), reste près de la résidente, puis fais-moi ton point : Situation, Antécédents, Évaluation, Demande.",
      prompt:    "Je passe te voir. D'après ce que tu me dis, ce n'est pas une urgence vitale, mais c'est bien de me prévenir. Termine ton recueil, constantes comprises, puis fais-moi ton point : Situation, Antécédents, Évaluation, Demande.",
      left:      "Ne laisse jamais la résidente seule quand ça ne va pas : appuie sur la sonnette ou fais venir Karim, tu restes dans la chambre. Je viens tout de suite.",
      again:     "Je suis déjà là, je regarde avec toi. Continue ton recueil.",
      whyGood:   "Quand une personne va mal, on alerte tout de suite et on reste près d'elle : sonnette ou Karim, sans la laisser seule pour aller chercher de l'aide.",
      whyOk:     "Tu as prévenu Sophie : c'est un bon réflexe. Ici, rien d'urgent, mais une personne qui a plusieurs signes nouveaux se signale sans attendre la fin de la matinée.",
      whyLeft:   "Tu as bien alerté, mais tu as laissé la résidente seule dans la chambre. En détresse, on reste près d'elle : sonnette ou Karim."
    },
    o2: { mode: 'refuse', indicated: false,
      pat: "(Tu approches le matériel d'oxygène. La résidente te regarde sans comprendre.)",
      why: "Pas de signe de détresse respiratoire : l'oxygène est un médicament, il se met sur prescription (ou protocole d'urgence). Signale les constantes à Sophie, c'est elle qui décide.",
      stay: "Tu ne mets pas d'oxygène ici." },
    rester: { pat: "(Tu restes près de la résidente, la main posée sur son épaule.)",
              why: "Rester auprès de la personne qui va mal la rassure et permet de surveiller sa vigilance et sa respiration." }
  },

  cases: {
    // ───────────── Mme Martin : bilan du matin (à signaler maintenant, pas une urgence vitale) ─────────────
    ehpad_bilan_matin_1: {
      vital: false,
      pos: {
        assise:   { v: 'good',  pat: "(Mme Martin se laisse caler contre les oreillers.) « C'est mieux comme ça… »",
                    why: "Installée dans son lit, bien calée, elle est confortable et en sécurité : elle est fatiguée et a des vertiges dès qu'elle se lève." },
        demi:     { v: 'good',  pat: "(Le dossier se relève doucement.) « Oui, comme ça, ça va. »",
                    why: "Un dossier légèrement relevé la soulage et lui permet de boire à petites gorgées, sans la faire se lever." },
        bord:     { v: 'avoid', pat: "(Elle se rattrape à ton bras.) « Oh… la tête me tourne… »",
                    why: "Elle a des vertiges au lever et une pression artérielle plus basse que d'habitude : on ne la lève pas avant l'avis de Sophie (risque de malaise et de chute)." },
        allongee: { v: 'ok',    pat: "(Elle s'allonge sans rien dire, les yeux mi-clos.)",
                    why: "Allongée au repos, elle ne risque rien. La position assise, dos calé, l'aide pourtant à boire sans s'étouffer." },
        jambes:   { v: 'ok',    pat: "« Pourquoi mes jambes ? Je suis juste fatiguée. »",
                    why: "Surélever les jambes aide lors d'un malaise avec une tension basse. Ici elle est éveillée et orientée : ce n'est pas nécessaire, mais cela ne la met pas en danger." },
        pls:      { v: 'avoid', pat: "« Mais… pourquoi me tourner comme ça ? Je ne suis pas malade à ce point ! »",
                    why: "La PLS est réservée à une personne inconsciente qui respire. Mme Martin est éveillée et répond à tes questions." }
      },
      o2: { mode: 'refuse', indicated: false,
        pat: "(Tu approches le matériel d'oxygène. Mme Martin te regarde, étonnée : « Mais je respire bien, moi ! »)",
        why: "Sa saturation est à 94 % en air ambiant, sans signe de détresse respiratoire : l'oxygène est un médicament, il se met sur prescription. Note la valeur et signale-la à Sophie.",
        stay: "Tu reposes le matériel : pas d'oxygène sans indication ni prescription." }
    },

    // ───────────── M. Roux : chute cachée (ne pas le mobiliser) ─────────────
    ehpad_chute_cachee_2: {
      vital: false,
      pos: {
        allongee: { v: 'good',  pat: "(M. Roux reste immobile, la jambe droite à plat.) « Voilà… ne me bougez pas, ça tire dans la hanche. »",
                    why: "Dans le doute d'une fracture de la hanche, on ne le mobilise pas : on le laisse allongé, dans la position où il a le moins mal, et on alerte." },
        demi:     { v: 'ok',    pat: "(Il grimace en sentant le dossier monter un peu.) « Pas trop… »",
                    why: "Relever très légèrement la tête peut le soulager, mais chaque mouvement du bassin fait mal : le mieux est de ne pas le mobiliser avant l'avis de Sophie." },
        assise:   { v: 'avoid', pat: "(Il serre les dents.) « Aïe… ne me redressez pas… »",
                    why: "S'asseoir demande de bouger le bassin et la jambe : douloureux, et risqué s'il y a une fracture de la hanche." },
        bord:     { v: 'danger', pat: "(Il étouffe un cri : sa jambe droite ne le porte pas.) « Non ! Arrêtez ! Remettez-moi ! »",
                    why: "Le lever peut aggraver une fracture de la hanche, et il prend un anticoagulant (risque de saignement). On ne le lève pas : tu le rallonges tout de suite, sans lui faire bouger la jambe, et tu alertes." },
        jambes:   { v: 'danger', pat: "« Aïe ! Ma jambe ! Ne touchez pas à ma jambe ! »",
                    why: "Soulever les jambes mobilise la jambe blessée : on ne touche pas à la jambe d'un résident chez qui on soupçonne une fracture." },
        pls:      { v: 'avoid', pat: "« Mais pourquoi me tourner sur le côté ? Aïe ! »",
                    why: "La PLS est réservée à une personne inconsciente. M. Roux est éveillé : tourner le bassin lui fait mal et mobilise la hanche." }
      },
      o2: { mode: 'refuse', indicated: false,
        pat: "(Tu approches le matériel d'oxygène. M. Roux te regarde : « Je respire très bien, c'est ma hanche qui me fait mal. »)",
        why: "Sa saturation est à 96 % en air ambiant : il n'a pas de détresse respiratoire, son problème est la hanche. L'oxygène est un médicament sur prescription : rien ne l'indique ici.",
        stay: "Tu reposes le matériel : l'oxygène n'est pas indiqué ici." }
    },

    // ───────────── Mme Blanc : hypoglycémie (urgence vitale, éveillée mais ralentie) ─────────────
    ehpad_hypoglycemie_3: {
      vital: true,
      pos: {
        assise:   { v: 'good',  pat: "(Mme Blanc se laisse installer, un peu hébétée.) « Ah oui… je suis mieux comme ça… »",
                    why: "Éveillée et capable d'avaler, elle doit être assise ou demi-assise avant de boire ou d'être resucrée : allongée, elle risquerait la fausse route." },
        demi:     { v: 'good',  pat: "(Le dossier se relève.) « Oui… ça va mieux comme ça. »",
                    why: "Demi-assise, elle reste éveillée et pourra avaler sans risque quand Sophie donnera son accord pour le resucrage." },
        bord:     { v: 'avoid', pat: "(Ses jambes tremblent.) « Je… je ne tiens pas… »",
                    why: "Ne la lève pas : elle est confuse et tremblante, elle peut tomber. L'installer dans son lit suffit." },
        allongee: { v: 'avoid', pat: "(Elle ferme les yeux, ses paupières se font lourdes.)",
                    why: "À plat, elle risque de s'endormir et de faire une fausse route si on la resucre. Garde-la assise et éveillée : parle-lui." },
        jambes:   { v: 'avoid', pat: "« Pourquoi mes jambes ? Je suis juste fatiguée… »",
                    why: "Surélever les jambes aide en cas de malaise avec une tension basse. Ici le problème est le manque de sucre : ce geste ne l'aide pas et la rend plus somnolente." },
        pls:      { v: 'avoid', pat: "(Elle te regarde, perdue.) « Mais je suis réveillée… »",
                    why: "La PLS est pour une personne inconsciente. Mme Blanc est éveillée : on l'installe assise. Si elle ne répond plus et ne s'éveille plus, tu la mets en PLS et tu appelles tout de suite." }
      },
      o2: { mode: 'allow', indicated: false,
        pat: "(Elle te regarde, étonnée.) « C'est pour quoi, ce masque ? Je respire bien. »",
        why: "Mme Blanc a une glycémie à 0,46 g/L et une saturation à 96 % : ce n'est pas l'oxygène qui lui manque, c'est le sucre. L'oxygène ne la soulage pas et fait perdre du temps. Garde les yeux sur sa vigilance et alerte." }
    },

    // ───────────── Mme Girard : suspicion d'AVC (urgence vitale) ─────────────
    ehpad_avc_4: {
      vital: true,
      pos: {
        demi:     { v: 'good',  pat: "(Tu relèves un peu le dossier. Mme Girard te regarde, immobile ; sa main gauche serre la tienne.)",
                    why: "Tête légèrement surélevée, sans la lever : c'est la position confortable qui limite le risque de fausse route (sa bouche ne retient plus bien la salive) en attendant les secours." },
        assise:   { v: 'ok',    pat: "(Elle se laisse faire, le regard fixé sur toi.)",
                    why: "Assise dans son lit, dos calé, c'est acceptable tant que tu ne la lèves pas. La tête légèrement surélevée suffit : ne la redresse pas complètement, et surveille qu'elle n'avale pas de travers." },
        bord:     { v: 'danger', pat: "(Elle bascule sur le côté droit : sa jambe droite ne la tient pas. Tu la retiens et tu la recouches.)",
                    why: "Dans un AVC suspecté, on ne lève pas la personne : le côté atteint peut lâcher (risque de chute) et l'effort peut aggraver. Tu la recouches aussitôt et tu alertes." },
        allongee: { v: 'avoid', pat: "(Un filet de salive coule au coin de sa bouche. Elle toussote.)",
                    why: "À plat, elle risque de s'étouffer avec sa salive (le coin droit de sa bouche ne retient plus). Garde la tête légèrement surélevée." },
        jambes:   { v: 'avoid', pat: "(Elle te regarde sans comprendre.)",
                    why: "Surélever les jambes n'a pas d'intérêt ici : ce n'est pas un malaise avec tension basse (168/92)." },
        pls:      { v: 'avoid', pat: "(Elle cherche ton regard, inquiète.)",
                    why: "Elle est éveillée : on garde la tête légèrement surélevée. Si elle perd connaissance ou vomit, tu la mets en PLS et tu appelles tout de suite." }
      },
      o2: { mode: 'allow', indicated: false,
        pat: "(Elle te regarde, les yeux grands ouverts, sans pouvoir dire un mot.)",
        why: "Dans un AVC suspecté, l'oxygène n'est pas systématique : il se donne si la saturation est basse (ici 96 % en air ambiant). Note la valeur, signale-la à Sophie : c'est elle qui décide." },
      nurse: { vitalOk: "Je suis là. Note l'heure : dernière fois vue normale à 7 h 30. J'appelle le 15. Reste près d'elle, ne lui donne rien par la bouche, continue tes constantes, puis fais-moi ton point (SAED)." }
    },

    // ───────────── M. Moreau : détresse respiratoire d'un BPCO (urgence vitale) ─────────────
    ehpad_bpco_5: {
      vital: true,
      pos: {
        assise:   { v: 'good',  pat: "(M. Moreau, penché en avant, pose ses mains sur ses genoux et respire un peu mieux.)",
                    why: "Assis, le thorax libre, il respire plus facilement : c'est la position qu'il prend naturellement quand il manque d'air." },
        demi:     { v: 'good',  pat: "(Tu relèves le dossier à plus de 30° et tu cales les oreillers : il respire un peu moins vite.)",
                    why: "Assis ou demi-assis (dossier à plus de 30°), bien calé : c'est la position qui soulage un résident en difficulté respiratoire." },
        bord:     { v: 'avoid', pat: "(Il lève la main.) « Non… pas… bouger… ça m'essouffle… »",
                    why: "Un effort, même s'asseoir au bord du lit, augmente l'essoufflement. Il est déjà assis dans son lit : ne le mobilise pas plus." },
        allongee: { v: 'danger', pat: "(Dès que le dossier descend, il s'agrippe aux draps, la bouche ouverte.) « J'étouffe… » (Tu le rassois tout de suite.)",
                    why: "À plat, le diaphragme gêne la respiration : une personne en détresse respiratoire s'étouffe. On ne l'allonge jamais à plat : assis ou demi-assis." },
        jambes:   { v: 'danger', pat: "(Il se débat, le souffle coupé.) « J'étouffe… » (Tu le rassois tout de suite.)",
                    why: "Allongé, même avec les jambes surélevées, il ne peut plus respirer correctement. Il faut le garder assis ou demi-assis." },
        pls:      { v: 'avoid', pat: "(Il te regarde, essoufflé, en secouant la tête.)",
                    why: "La PLS est pour une personne inconsciente qui respire. M. Moreau est somnolent mais éveillable : reste assis, surveille sa vigilance, et si tu ne parviens plus à le réveiller, appelle aussitôt." }
      },
      // Oxygène : BPCO → faible débit seulement, jamais au maximum (retenue de CO₂)
      o2: { mode: 'allow', indicated: true, byDeb: true,
        good:   { pat: "(Il respire un peu moins vite, ses épaules se détendent ; ses lèvres restent bleutées.)",
                  why: "Chez un patient atteint de BPCO, on vise une saturation modérée (88 à 92 %) : si on en met, c'est à faible débit, avec surveillance de la saturation et de la vigilance. En stage, c'est l'infirmière qui décide et règle (ou le protocole d'urgence du service) : alerte-la d'abord. Ici, tu t'entraînes au réflexe (à valider avec ton formateur)." },
        avoid:  { pat: "(Il tousse et se débat avec le masque, puis se calme.)",
                  why: "C'est trop élevé pour lui : à débit fort, un BPCO retient du CO₂ et s'endort. Redescends à 1 ou 2 L/min avec des lunettes." },
        danger: { pat: "(M. Moreau cesse de lutter… ses paupières se ferment, sa tête tombe en avant : il s'endort. Tu baisses aussitôt le débit.)",
                  why: "Un fort débit d'oxygène chez un BPCO peut faire monter le CO₂ (hypercapnie) : somnolence, jusqu'au coma. C'est le piège classique : faible débit, surveillance, et c'est l'infirmière ou le médecin qui règle." }
      },
      nurse: { vitalOk: "Je suis là, j'appelle le 15. Reste auprès de lui, assis, continue tes constantes (fréquence respiratoire, saturation), ne lui donne rien à boire ni calmant, puis fais-moi ton point (SAED)." }
    },

    // ───────────── M. Vasseur : détresse respiratoire à l'hôpital (insuffisance cardiaque décompensée, œdème pulmonaire) ─────────────
    hop_oap_6: {
      vital: true,
      pos: {
        assise:   { v: 'good',  pat: "(M. Vasseur, penché en avant, pose ses mains sur ses genoux et respire un peu mieux.)",
                    why: "Assis, le thorax libre, il respire plus facilement : c'est la position qu'il prend naturellement quand il manque d'air (il ne peut pas s'allonger)." },
        demi:     { v: 'good',  pat: "(Tu relèves le dossier, tu cales les oreillers : il respire un peu moins vite.)",
                    why: "Assis ou demi-assis (dossier à plus de 30°), bien calé : c'est la position qui soulage une personne qui manque d'air." },
        bord:     { v: 'good',  pat: "(Tu l'aides à s'asseoir au bord du lit, les jambes pendantes, tu le soutiens par l'épaule : il respire un peu mieux.)",
                    why: "Assis, les jambes qui pendent, le sang stagne un peu dans les jambes et le cœur travaille moins. C'est une position classique en cas de gêne respiratoire d'origine cardiaque, à condition de le soutenir, de ne pas le laisser seul et de ne pas le faire marcher." },
        allongee: { v: 'danger', pat: "(Dès que le dossier descend, il s'agrippe aux draps, la bouche ouverte.) « J'étouffe… » (Tu le rassois tout de suite.)",
                    why: "À plat, le liquide qui encombre ses poumons remonte et il s'étouffe : on ne l'allonge jamais à plat. Assis ou demi-assis." },
        jambes:   { v: 'danger', pat: "(Il se débat, le souffle coupé.) « J'étouffe… » (Tu le rassois tout de suite.)",
                    why: "Jambes surélevées, plus de sang revient vers un cœur déjà fatigué : le liquide dans les poumons augmente. À éviter absolument." },
        pls:      { v: 'avoid', pat: "(Il te regarde, essoufflé, en secouant la tête.)",
                    why: "La PLS est pour une personne inconsciente qui respire. M. Vasseur est éveillé : il doit rester assis. Si tu ne parviens plus à le réveiller, tu appelles aussitôt." }
      },
      // Oxygène : pas de maladie pulmonaire connue → il faut un débit suffisant (masque), prescrit ou selon protocole, réglé par l'infirmière
      o2: { mode: 'allow', indicated: true, rule: 'high',
        good:   { pat: "(Le masque se pose, la buée apparaît à l'intérieur. Il respire un peu moins vite, ses épaules se détendent.)",
                  why: "Il a une saturation très basse (84 %) et aucune maladie respiratoire chronique connue : l'oxygène est utile, au masque et à un débit suffisant (repère à valider avec ton cours et le protocole du service). C'est l'infirmière qui décide, prescrit ou applique le protocole et règle : alerte-la d'abord." },
        avoid:  { pat: "(Il tire sur les lunettes, toujours essoufflé : « ça… ne suffit pas… ».)",
                  why: "Des lunettes à petit débit ne suffisent pas pour une saturation à 84 % avec une telle gêne : il faut un masque et un débit plus élevé. C'est l'infirmière qui décide : préviens-la." },
        nurseGood: "Oui, un masque, c'est bien. Je prends le relais pour la prescription et le réglage : j'adapte à sa saturation. Surveille-la sur le scope, sa respiration et sa vigilance." },
      nurse: {
        vitalOk: "Je suis là, j'ai vu. J'appelle le médecin de garde tout de suite. Reste auprès de lui, assis, branche le scope si ce n'est pas fait, continue ses constantes, ne lui donne rien à boire ni à manger, puis fais-moi ton point (SAED).",
        prompt:  "Je passe te voir. Termine ton recueil, constantes comprises, puis fais-moi ton point : Situation, Antécédents, Évaluation, Demande.",
        left:    "Ne laisse jamais le patient seul quand il manque d'air : appuie sur la sonnette ou fais venir Karim, tu restes dans la chambre. Je viens tout de suite.",
        again:   "Je suis déjà là, je m'en occupe avec toi. Continue ton recueil.",
        whyGood: "Quand une personne manque d'air, on alerte tout de suite et on reste près d'elle : sonnette ou Karim, sans la laisser seule pour aller chercher de l'aide.",
        whyOk:   "Tu as prévenu Claire : c'est un bon réflexe, mais ici il faut le faire sans attendre.",
        whyLeft: "Tu as bien alerté, mais tu as laissé le patient seul dans la chambre. Quand on manque d'air, on reste près de lui : sonnette ou Karim."
      },
      rester: { pat: "(Tu restes près de M. Vasseur, une main posée sur son épaule. Il hoche la tête, un peu rassuré.)",
                why: "Il a peur de mourir : rester près de lui, lui parler lentement et surveiller sa respiration le rassure (l'anxiété augmente l'essoufflement)." }
    }
  }
};
