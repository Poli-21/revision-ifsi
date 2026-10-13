// data/secours_c.js — cas 7 à 9 (hypoglycémie, AVC, brûlure)
// Cas fictifs. Voir data/secours.js pour les limites.
'use strict';
(() => {
  const { T, O, cases } = App.SecData;
  const G = O.g, A = O.a, D = O.d;
  const TEAM = { you: { pose: 'stand' }, ca: { label: 'Samir (CA)' }, eq: { label: 'Léa' } };
  const TROLE = 'PSE1 en équipe PCPS — chef d\'agrès : Samir · équipière : Léa';

  // ═══ 7. Hypoglycémie — livreuse à vélo, place de la République ═══════════════
  cases.push({
    id: 'hypo_republique', title: 'La livreuse qui tremble', icon: '🚲', place: 'Place de la République, Paris 3e / 10e / 11e', level: 2,
    victim: 'Samia, 31 ans, livreuse à vélo', hook: 'Elle a posé son vélo contre un banc, couverte de sueurs, les mains qui tremblent. Elle répond de travers.',
    tags: ['Malaise', 'Diabète', 'Hypoglycémie'],
    scene: {
      bg: 'place', plaque: 'Place de la République', time: 'dusk', clock: '19:10', witnesses: 2,
      victim: { pose: 'sit', skin: '#ebb996', top: '#1f6f4a', acc: ['cycleHelmet', 'bag'], sweat: true, emo: 'pain', hair: '#1c1c1c', hs: 'long' }, props: { bike: true }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, passant', crew: { you: { pose: 'stand' } },
        intro: 'Il est **19 h 10**, place de la **République**. Une livreuse à vélo, **Samia**, s\'est assise sur le bord du trottoir, son vélo à côté d\'elle. Elle est pâle, couverte de sueurs, ses mains tremblent. Elle te regarde sans bien comprendre.',
        steps: [
          { id: 's1', cat: 'bilan', regard: 1, kind: 'multi', w: 2, title: 'Premier regard : j\'arrive près d\'elle',
            say: 'Les vélos et les voitures passent derrière elle. Son casque n\'est pas cassé, son vélo est intact.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je regarde autour de moi : circulation, vélos, foule.', 'Danger d\'abord.'),
              G('b', 'Je me présente (« Je suis secouriste ») et je lui demande si je peux l\'aider.', 'Tu rassures et tu demandes son accord.'),
              G('c', 'Je cherche une cause visible (chute ? choc ? vélo cassé ?).', 'Ici : rien, donc pas de traumatisme apparent.'),
              A('d', 'Je fouille d\'abord son sac pour chercher ses papiers.', 'Tu perds du temps et tu entres dans ses affaires sans raison.'),
              D('e', 'Je l\'aide à remonter sur son vélo pour aller chez un médecin.', 'Elle est confuse : risque de chute et d\'accident.')],
            ref: 'Fiche « 4 regards ».' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es accroupi à côté d\'elle.', hint: 'Qu\'est-ce que tu vérifies et que lui demandes-tu ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement', obs: 'Aucun.', key: true, why: 'Toujours.' },
              { id: 'cons', regard: 2, t: 'Je lui parle : « Vous m\'entendez ? Vous savez où vous êtes ? »', obs: 'Elle répond lentement, avec des mots qui s\'emmêlent. **Consciente mais confuse.**', key: true, why: 'Confusion.' },
              { id: 'resp', regard: 2, t: 'Je regarde sa respiration', obs: 'Normale, environ 18 par minute.', key: true, why: 'Respiration.' },
              { id: 'peau', regard: 3, t: 'Je regarde sa peau', obs: 'Pâle, **moite**, sueurs froides, tremblements.' },
              { id: 'atcd', regard: 3, t: 'Je lui demande : « Vous avez une maladie ? Un traitement ? Vous avez mangé ? »', obs: 'Elle dit : « Je suis diabétique, j\'ai fait mon insuline… je n\'ai pas mangé depuis ce matin. »', key: true, why: 'Diabétique + insuline + pas mangé = hypoglycémie probable.' },
              { id: 'glyc', regard: 4, t: 'Je mesure sa glycémie', obs: 'Tu n\'as pas de lecteur : en civil, tu ne peux pas la mesurer. Tu agis sur les signes.' }
            ],
            after: '**Diabétique sous insuline, confuse, sueurs, tremblements : hypoglycémie probable.**', ref: 'Fiche « Gestes clés » — hypoglycémie.' },
          { id: 's3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'Mon geste',
            say: 'Elle est consciente, elle peut avaler.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je lui donne 4 morceaux de sucre (ou une boisson sucrée) et je la laisse assise au repos.', 'Mémo Urgence : glycémie < 0,6 g/L → 4 morceaux de sucre, on réitère après 15 min si besoin (certaines fiches grand public disent 3 : suis ton mémo).'),
              A('b', 'Je lui donne un café noir sans sucre et je lui dis de rouler doucement.', 'Pas de sucre = pas d\'effet, et elle ne doit pas rouler.'),
              D('c', 'Je lui fais sa piqûre d\'insuline pour la « stabiliser ».', 'L\'insuline fait baisser la glycémie : c\'est le contraire.')],
            sceneAfter: { props: { sugar: true } }, ref: 'Fiche « Valeurs repères » — hypoglycémie.' },
          { id: 's4', cat: 'alerte', regard: 0, kind: 'multi', w: 3, title: 'Après le sucre',
            say: 'Elle mange le sucre. Quelques minutes passent.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je la surveille 15 minutes : conscience, parole, sueurs.', 'On vérifie que ça remonte.'),
              G('b', 'J\'appelle le 15 pour avis médical (ou je fais appeler).', 'Une hypoglycémie doit toujours être signalée.'),
              G('c', 'Si elle perd connaissance : je la mets en PLS, j\'appelle, et je ne lui donne plus rien dans la bouche.', 'Un inconscient n\'avale pas : fausse route.'),
              A('d', 'Dès qu\'elle va mieux, je la laisse repartir à vélo.', 'Elle peut rechuter ; avis médical d\'abord.'),
              D('e', 'Si elle devient inconsciente, je lui mets du sucre dans la bouche.', 'Danger : étouffement.')],
            ref: 'Fiche « Gestes clés ».' },
          T.solo({ id: 's5', w: 3, say: 'Le régulateur du 15 te demande de faire le point.',
            addr: [/republique/, /place/, /paris 3|paris 10|paris 11|3 ?e|10 ?e|11 ?e/], what: [/diabet|hypoglyc|malaise|sucre|insuline/],
            state: [
              { label: 'Consciente mais confuse', re: [/confus|lente|ralentie|repond (lentement|de travers|mal)|desorient/], w: 1.5 },
              { label: 'Sueurs / pâleur / tremblements', re: [/sueur|tremble|pale|moite/], w: 1 },
              { label: 'Diabétique sous insuline, n\'a pas mangé', re: [/diabet|insuline|pas mange|jeun/], w: 1.5 }
            ],
            done: [
              { label: 'Sucre donné', re: [/sucre|boisson sucree|jus/], w: 2 },
              { label: 'Assise au repos / surveillance', re: [/assis|repos|surveill/], w: 0.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes place de la République, côté trottoir près du banc.',
              what: 'Une jeune femme de 31 ans, livreuse à vélo, a un malaise. Elle est diabétique.',
              state: 'Elle est consciente mais confuse, elle répond lentement, elle a des sueurs et des tremblements. Elle a pris son insuline et n\'a pas mangé depuis ce matin.',
              done: 'Je lui ai donné 4 morceaux de sucre, elle est assise au repos. Je la surveille. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **19 h 10**. Vous êtes en dispositif de secours **place de la République**. Une livreuse, **Samia**, est assise près de son vélo, pâle, en sueur. Vous avez un **lecteur de glycémie**.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Je préviens et j\'approche',
            say: 'Samir : « Qu\'est-ce que tu vois ? »', q: 'Que réponds-tu ?',
            opts: [G('a', '« Une personne assise, pâle, en sueur, vélo à côté, pas de danger autour. J\'y vais. »', 'Court, précis.'),
              A('b', '« Il y a quelqu\'un. » et je pars sans plus d\'informations.', 'Trop vague.'),
              D('c', 'Je l\'aide à remonter sur son vélo.', 'Elle est confuse.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es accroupi à côté d\'elle.', hint: 'Que fais-tu, qu\'annonces-tu au chef ?',
            checks: [
              { id: 'cons', regard: 2, t: 'Je lui parle', obs: 'Elle répond lentement, mots emmêlés. **Consciente, confuse.**', key: true, why: 'Confusion.' },
              { id: 'resp', regard: 2, t: 'Je regarde sa respiration', obs: 'Normale, 18/min.', key: true, why: 'Respiration.' },
              { id: 'atcd', regard: 3, t: 'Je lui demande : « Maladie ? Traitement ? Vous avez mangé ? »', obs: '« Diabétique, insuline, pas mangé depuis ce matin. »', key: true, why: 'Hypoglycémie probable.' },
              { id: 'glyc', regard: 4, t: 'Je mesure sa glycémie capillaire', obs: '**0,45 g/L** : hypoglycémie confirmée (seuil : < 0,6 g/L).', key: true, why: 'Le lecteur confirme.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce : « Diabétique, confuse, glycémie 0,45 g/L »', obs: 'Samir : « Compris. Sucre. Je préviens la régulation. »', key: true, why: 'Annonce.' },
              { id: 'pouls', regard: 3, t: 'Je prends son pouls', obs: '98 par minute.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'Mon geste',
            say: 'Samir : « Donne-lui du sucre. »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je dis « Sucre, compris », je lui donne 4 morceaux de sucre, je la laisse assise et je note l\'heure.', 'Mémo Urgence : 4 morceaux si glycémie < 0,6 g/L. Tu exécutes et tu notes.'),
              A('b', 'Je lui donne un sandwich, qui contient aussi des sucres lents.', 'Trop lent.'),
              D('c', 'Je lui fais l\'insuline.', 'Insuline = baisse la glycémie.')],
            sceneAfter: { props: { sugar: true } }, ref: 'Fiche « Valeurs repères ».' },
          { id: 't4', cat: 'bilan', regard: 4, kind: 'choice', w: 2, title: 'Nouvelle mesure après 15 minutes',
            say: 'Après 15 minutes, elle va mieux. Glycémie de contrôle : **0,85 g/L**.', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'annonce « 0,85 g/L, elle va mieux » à Samir : c\'est lui (et la régulation) qui décide, et on continue la surveillance.', 'Pas de décision seul.'),
              A('b', 'Je la laisse repartir à vélo, elle va mieux.', 'Avis médical d\'abord.'),
              D('c', 'Je lui donne encore 10 morceaux de sucre.', 'Trop de sucre, sans avis.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 2, title: 'Et si elle perd connaissance ?',
            say: 'Samir : « Si elle décroche, tu fais quoi ? »', q: 'Que réponds-tu ?',
            opts: [G('a', '« PLS, je préviens le chef, glycémie, et rien dans la bouche. »', 'Réponse correcte.'),
              A('b', '« Je continue à lui donner du sucre. »', 'Fausse route.'),
              D('c', '« Je lui injecte son insuline. »', 'Danger.')],
            ref: 'Fiche « Gestes clés ».' },
          T.team({ id: 't6', w: 3, say: 'Samir : « Fais ton point pour la régulation. »',
            what: [/diabet|hypoglyc|malaise|sucre|insuline|livreu/],
            bilan: [
              { label: 'Consciente, confuse, sueurs', re: [/confus|sueur|pale|tremble/], w: 1 },
              { label: 'Diabétique sous insuline, n\'a pas mangé', re: [/diabet|insuline|pas mange|jeun/], w: 1.5 },
              { label: 'Glycémie 0,45 g/L', re: [/0 45|045|0 ?4|glycemie/], w: 1.5 }],
            done: [
              { label: 'Sucre donné (4 morceaux) avec l\'heure', re: [/sucre|boisson sucree/], w: 1.5 },
              { label: 'Glycémie de contrôle à 0,85 g/L', re: [/0 85|085|controle|apres/], w: 1 }],
            ask: [{ label: 'Avis médical', re: [/medecin|regulation|avis|smur|15/], w: 0.5 }],
            model: {
              vic: 'Chef, femme de 31 ans, livreuse à vélo, malaise à 19 h 05.',
              bilan: 'Consciente mais confuse, sueurs, tremblements. Diabétique sous insuline, pas mangé depuis ce matin. Glycémie 0,45 g/L.',
              done: '4 morceaux de sucre donnés à 19 h 12. Glycémie de contrôle 0,85 g/L à 19 h 27.',
              ask: 'Je demande un avis médical avant de la laisser repartir.'
            } })
        ]
      }
    }
  });

  // ═══ 8. AVC — marché d'Aligre ════════════════════════════════════════════════
  cases.push({
    id: 'avc_aligre', title: 'Le marché d\'Aligre', icon: '🧠', place: 'Rue d\'Aligre, Paris 12e', level: 2,
    victim: 'Mme Vidal, 69 ans', hook: 'Elle faisait ses courses, son panier vient de lui tomber des mains. Sa bouche est de travers et elle bredouille.',
    tags: ['AVC', 'FAST', 'Heure de début'],
    scene: {
      bg: 'marche', plaque: 'Rue d\'Aligre', clock: '10:42', witnesses: 3,
      victim: { pose: 'chair', skin: '#f6d3b8', top: '#7a5ac4', hair: '#cfcfcf', hs: 'bun', emo: 'alarm', skirt: true }
    },
    modes: {
      solo: {
        role: 'PSE1, seule/seul, en civil, client du marché', crew: { you: { pose: 'stand' } },
        intro: 'Il est **10 h 42**. Tu fais ton marché **rue d\'Aligre**. Une dame de 69 ans, **Mme Vidal**, est assise sur une chaise de marchand. Son panier est tombé. Son mari : « Elle a un truc à la bouche, elle ne parle plus bien ! »',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : la scène',
            say: 'Le marché est bondé, les étals sont serrés. Mme Vidal est assise, un peu affaissée sur le côté.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je m\'approche, je me présente, je regarde si quelque chose menace (étal, foule), et je lui demande ce qu\'elle ressent.', 'Tu rassures et tu observes.'),
              A('b', 'Je lui dis de se lever pour qu\'on l\'amène à l\'ombre.', 'Elle peut tomber.'),
              D('c', 'Je la fais marcher jusqu\'à un banc pour la calmer.', 'Risque de chute.')],
            ref: 'Fiche « 4 regards ».' },
          { id: 's2', cat: 'bilan', regard: 3, kind: 'bilan', w: 3, title: 'Je cherche les signes de l\'AVC',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es devant elle.', hint: 'Teste le visage, le bras, la parole, et l\'heure de début.',
            checks: [
              { id: 'cons', regard: 2, t: 'Je vérifie qu\'elle est consciente et qu\'elle respire', obs: 'Consciente, respire normalement, environ 16 par minute.', key: true, why: 'Les bases.' },
              { id: 'visage', regard: 3, t: 'Je lui demande de sourire (visage)', obs: 'Un côté de la bouche (le droit) tombe : **paralysie faciale**.', key: true, why: 'Visage.' },
              { id: 'bras', regard: 3, t: 'Je lui demande de lever les deux bras 10 secondes (bras)', obs: 'Le bras droit retombe : **déficit moteur**.', key: true, why: 'Bras.' },
              { id: 'parole', regard: 3, t: 'Je lui demande de répéter une phrase (parole)', obs: 'Elle bredouille, mots incompréhensibles : **trouble de la parole**.', key: true, why: 'Parole.' },
              { id: 'heure', regard: 3, t: 'Je demande à son mari depuis quand', obs: '« Ça a commencé à **10 h 35**. » Heure de début : 10 h 35.', key: true, why: 'L\'heure de début décide du traitement.' },
              { id: 'asp', regard: 4, t: 'Je lui donne un cachet d\'aspirine de son sac', obs: 'À éviter : dangereux si c\'est un AVC par hémorragie.' }
            ],
            after: '**Visage, bras, parole : suspicion d\'AVC, début à 10 h 35.**', ref: 'Fiche « Gestes clés » — AVC.' },
          { id: 's3', cat: 'alerte', regard: 0, kind: 'choice', w: 3, title: 'L\'alerte',
            say: 'Son mari te regarde, paniqué.', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'appelle (ou je fais appeler) le 15 tout de suite : « Suspicion d\'AVC, début à 10 h 35 ».', 'AVC = urgence immédiate, l\'heure compte.'),
              A('b', 'Je conseille de l\'emmener à l\'hôpital en voiture.', 'Régulation et transport adapté.'),
              D('c', 'J\'attends 30 minutes pour voir si ça passe.', 'Chaque minute compte.')],
            ref: 'Fiche « Alerter ».' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'multi', w: 3, title: 'En attendant les secours',
            say: 'Elle est assise, ses jambes tremblent.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je l\'allonge confortablement (elle est consciente : pas de PLS) et j\'écarte ce qui la gêne.', 'Fiche Détresse neurologique : allonger la victime. La PLS est pour les troubles de la conscience (Glasgow < 10).'),
              G('b', 'Je note l\'heure de début et ce que j\'ai observé.', 'Ça sert aux médecins.'),
              G('c', 'Rien à boire ni à manger.', 'Risque de fausse route.'),
              G('d', 'Je la rassure et je surveille conscience et respiration.', 'Surveillance.'),
              A('e', 'Je la laisse assise sur sa chaise en attendant les secours.', 'Allongée est mieux : elle peut perdre l\'équilibre ou la conscience.'),
              A('g', 'Je lui fais lever les bras toutes les minutes pour vérifier.', 'Ça la fatigue et n\'apporte rien.'),
              D('f', 'Je lui donne de l\'aspirine.', 'Danger.')],
            ref: 'Fiche « Gestes clés ».' },
          T.solo({ id: 's5', w: 3, say: 'Le régulateur du 15 te demande de faire le point.',
            addr: [/aligre/, /marche/, /\brue\b/, /paris 12|12 ?e|douze/], what: [/avc|accident vasculaire|paralysie|bouche|bras|parole|visage|deficit|hemiplegie/],
            state: [
              { label: 'Visage (bouche de travers)', re: [/visage|bouche|sourire|paralysie faciale/], w: 1 },
              { label: 'Bras (ne le lève pas / faiblesse)', re: [/bras|faiblesse|membre|retombe/], w: 1 },
              { label: 'Parole (bredouille, ne parle plus bien)', re: [/parole|parle|bredouill|mots/], w: 1 },
              { label: 'Heure de début (10 h 35)', re: [/10 ?h ?35|10 35|il y a \d+ ?min|depuis \d+|debut/], w: 2 }
            ],
            done: [
              { label: 'Assise ou allongée, rien à boire ni manger', re: [/assis|allong|repos|rien a boire|ne boit|ne mange/], w: 1 },
              { label: 'Surveillance', re: [/surveill/], w: 0.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes rue d\'Aligre, Paris 12e, au marché.',
              what: 'Une dame de 69 ans, suspicion d\'AVC.',
              state: 'Elle est consciente, elle respire. La bouche tombe à droite, elle ne lève plus le bras droit, elle bredouille. Début à 10 h 35.',
              done: 'Elle est allongée, rien à boire ni à manger, je la surveille. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **10 h 42**. Vous êtes en dispositif de secours au **marché d\'Aligre**. Un homme vous interpelle : sa femme, **Mme Vidal**, 69 ans, a le visage de travers et ne parle plus bien.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Je préviens et j\'approche',
            say: 'Samir : « On y va. »', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'annonce « Chef, suspicion d\'AVC », j\'approche avec l\'équipe et je me présente.', 'Tu informes.'),
              A('b', 'Je la fais lever et marcher.', 'Risque de chute.'),
              D('c', 'Je lui donne de l\'eau pour la ranimer.', 'Fausse route.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 3, kind: 'bilan', w: 3, title: 'Je cherche les signes',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es devant elle.', hint: 'Visage, bras, parole, heure, et annonce au chef.',
            checks: [
              { id: 'visage', regard: 3, t: 'Je lui demande de sourire', obs: 'Paralysie faciale à droite.', key: true, why: 'Visage.' },
              { id: 'bras', regard: 3, t: 'Je lui demande de lever les deux bras', obs: 'Le bras droit retombe.', key: true, why: 'Bras.' },
              { id: 'parole', regard: 3, t: 'Je lui demande de répéter une phrase', obs: 'Trouble de la parole.', key: true, why: 'Parole.' },
              { id: 'heure', regard: 3, t: 'Je demande l\'heure de début', obs: '10 h 35.', key: true, why: 'Heure de début.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce : « Suspicion d\'AVC, début 10 h 35 »', obs: 'Samir : « Compris. J\'appelle la régulation. Léa, mesures. »', key: true, why: 'Annonce.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'bilan', regard: 4, kind: 'multi', w: 3, title: 'Les mesures',
            say: 'Samir te demande de prendre les mesures.', q: 'Quelles mesures sont justes ?',
            opts: [G('a', 'La glycémie capillaire (une hypoglycémie peut ressembler à un AVC).', 'On élimine l\'hypoglycémie.'),
              G('b', 'La tension, le pouls, la SpO₂.', 'Constantes.'),
              G('c', 'La fréquence respiratoire sur 1 minute.', 'Constantes.'),
              A('d', 'Seulement le temps de recoloration.', 'Insuffisant.'),
              D('e', 'Je lui donne à boire pour la remettre.', 'Fausse route.')],
            ref: 'Fiche « Valeurs repères ».' },
          { id: 't4', cat: 'equipe', regard: 0, kind: 'choice', w: 2, title: 'Le mari insiste',
            say: 'Son mari : « Je l\'emmène à l\'hôpital en voiture, c\'est plus rapide ! »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je lui explique qu\'il faut attendre la régulation et le transport médicalisé, et j\'informe Samir.', 'Transport adapté.'),
              A('b', 'Je le laisse faire.', 'Risque pour elle.'),
              D('c', 'J\'aide à la lever pour l\'installer dans la voiture.', 'Risque de chute.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't5', cat: 'transmission', regard: 0, kind: 'order', w: 2, title: 'L\'ordre de mon compte rendu',
            say: 'Samir te demande de préparer ta transmission.', q: 'Remets les éléments dans l\'ordre.',
            items: [
              { t: 'Âge et sexe de la victime', why: 'On commence par qui.' },
              { t: 'Ce qui s\'est passé et l\'heure de début', why: 'Circonstances.' },
              { t: 'Les signes (visage, bras, parole)', why: 'Bilan.' },
              { t: 'Les mesures (glycémie, tension, pouls, SpO₂)', why: 'Constantes.' },
              { t: 'Ce que j\'ai fait et ce que je propose', why: 'Gestes et demande.' }],
            ref: 'Fiche « En équipe » — compte rendu structuré.' },
          T.team({ id: 't6', w: 3, say: 'Les médecins arrivent. Samir : « Fais ton point. »',
            what: [/avc|accident vasculaire|paralysie|bouche|bras|parole|visage|deficit/],
            bilan: [
              { label: 'Signes : visage, bras, parole', re: [/visage|bouche|bras|parole|bredouill|paralysie/], w: 1.5 },
              { label: 'Heure de début (10 h 35)', re: [/10 ?h ?35|10 35|debut|depuis/], w: 2 },
              { label: 'Consciente, respire', re: [/conscient|respire/], w: 0.5 }],
            done: [
              { label: 'Rien à boire ni à manger', re: [/rien a boire|ne boit|ne mange|jeun|boire/], w: 0.5 },
              { label: 'Mesures prises (glycémie, tension, SpO₂)', re: [/glycemie|tension|spo2|saturation|pouls/], w: 1 }],
            ask: [{ label: 'Médicalisation immédiate / filière AVC', re: [/medecin|smur|avc|filiere|evacu|hopital|urgence/], w: 1 }],
            model: {
              vic: 'Chef, femme de 69 ans, déficit neurologique brutal depuis 10 h 35.',
              bilan: 'Consciente, respire. Visage : paralysie faciale droite. Bras droit qui retombe. Troubles de la parole.',
              done: 'Glycémie normale, tension 18/10, rien à boire ni à manger, allongée.',
              ask: 'Je propose une évacuation médicalisée en urgence vers une filière AVC.'
            } })
        ]
      }
    }
  });

  // ═══ 9. Brûlure — camion de crêpes, rue de Charonne ═══════════════════════════
  cases.push({
    id: 'brulure_charonne', title: 'La crêpière', icon: '🔥', place: 'Rue de Charonne, Paris 11e', level: 1,
    victim: 'Théo, 23 ans, vendeur dans un camion de crêpes', hook: 'De l\'huile bouillante vient de lui éclabousser l\'avant-bras. Il serre le bras contre lui en grimaçant.',
    tags: ['Brûlure', 'Refroidissement', 'Alerte selon gravité'],
    scene: {
      bg: 'foodtruck', plaque: 'Rue de Charonne', clock: '13:20', witnesses: 2,
      victim: { pose: 'stand', skin: '#a36b45', top: '#f6f1e6', acc: ['apron', 'cap'], emo: 'pain', hair: '#1c1c1c' }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, client', crew: { you: { pose: 'stand' } },
        intro: 'Il est **13 h 20**, **rue de Charonne**. Tu fais la queue devant un camion de crêpes. Le vendeur, **Théo**, 23 ans, pousse un cri : de l\'huile bouillante l\'a éclaboussé. Son avant-bras est rouge, des cloques apparaissent. La plaque est encore allumée.',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 2, title: 'Premier regard : la scène',
            say: 'La plaque chauffante fume, une bouteille de gaz est sous le camion. Théo est à côté.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je demande qu\'on éteigne la plaque / coupe le gaz, je fais reculer les curieux, puis j\'approche de Théo.', 'On supprime le danger avant de soigner.'),
              A('b', 'Je soigne Théo sans m\'occuper de la plaque.', 'Autre brûlure possible.'),
              D('c', 'Je jette de l\'eau sur la plaque qui fume.', 'Projections d\'huile chaude.')],
            ref: 'Fiche « 4 regards ».' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je regarde la brûlure',
            scene: { crew: { you: { pose: 'stand' } } }, say: 'Théo tient son bras droit contre lui.', hint: 'Que vérifies-tu ?',
            checks: [
              { id: 'cons', regard: 2, t: 'Je vérifie qu\'il est conscient et qu\'il respire', obs: 'Conscient, respire normalement.', key: true, why: 'Les bases.' },
              { id: 'cause', regard: 3, t: 'Je lui demande ce qui s\'est passé et quand', obs: 'Éclaboussure d\'huile bouillante il y a 2 minutes.', key: true, why: 'Cause et heure.' },
              { id: 'brul', regard: 4, t: 'Je regarde la brûlure : où, quelle surface, quel aspect', obs: 'Avant-bras droit, du poignet au coude, rouge avec **cloques** : brûlure du 2e degré. La somme des cloques dépasse la moitié de la paume de sa main : **brûlure grave**.', key: true, why: 'Étendue et profondeur.' },
              { id: 'vet', regard: 4, t: 'Je regarde ses vêtements et bijoux', obs: 'Manchette en tissu, montre au poignet : à retirer si non collés.', key: true, why: 'Ils retiennent la chaleur.' },
              { id: 'dou', regard: 4, t: 'J\'évalue sa douleur', obs: 'Douleur 8/10.' }
            ],
            after: '**Brûlure du 2e degré de l\'avant-bras droit**, étendue.', ref: 'Fiche « Gestes clés » — brûlure.' },
          { id: 's3', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Les gestes dans l\'ordre',
            say: 'Un robinet est à portée dans le camion.', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je fais arroser tout de suite la brûlure à l\'eau tempérée (15–25 °C), en filet, à distance', why: 'Le plus tôt possible.' },
              { t: 'Je retire la montre et la manchette non collées, sans arracher ce qui adhère', why: 'Ils retiennent la chaleur.' },
              { t: 'Un témoin appelle le 15 pendant que je poursuis l\'arrosage', why: 'Brûlure grave (cloques > ½ paume) : avis médical.' },
              { t: 'Je continue l\'arrosage au moins 10 minutes, idéalement 20 minutes', why: 'Mémo Urgence, brûlure grave : 10 min minimum, idéalement 20.' },
              { t: 'Je protège avec un pansement stérile ou du film alimentaire, puis une couverture isotherme', why: 'Brûlure grave : protéger et éviter le froid.' }],
            sceneAfter: { props: { water: true } }, ref: 'Fiche « Valeurs repères » — brûlure.' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'multi', w: 3, title: 'Les conseils de la foule',
            say: 'Le public crie : « Mets de la glace ! Du dentifrice ! Perce les cloques ! »', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Eau tempérée, jamais glacée.', 'La glace peut aggraver.'),
              G('b', 'Je laisse les cloques intactes.', 'Elles protègent de l\'infection.'),
              G('c', 'Je protège la brûlure avec un pansement stérile ou du film alimentaire.', 'Protéger.'),
              G('d', 'Je l\'enveloppe dans une couverture isotherme s\'il tremble de froid.', 'Brûlure grave : couverture isotherme, risque d\'hypothermie.'),
              D('e', 'Je mets de la glace directement sur la brûlure.', 'Danger.'),
              D('f', 'Je perce les cloques ou j\'applique crème, beurre ou dentifrice.', 'Danger.')],
            ref: 'Fiche « Gestes clés ».' },
          T.solo({ id: 's5', w: 3, say: 'Le régulateur du 15 te demande de faire le point.',
            addr: [/charonne/, /\brue\b/, /camion/, /paris 11|11 ?e|onze/], what: [/brul|huile|ebouillant|eclabouss|cloque/],
            state: [
              { label: 'Brûlure de l\'avant-bras (localisation, cloques)', re: [/avant bras|bras|cloque|2e degre|deuxieme degre|rouge/], w: 1.5 },
              { label: 'Étendue (cloques > moitié de la paume : brûlure grave) / il y a combien de temps', re: [/paume|surface|etendu|etendue|grave|il y a \d+|minutes?/], w: 1 },
              { label: 'Conscient, respire', re: [/conscient|repond|respire/], w: 0.5 }
            ],
            done: [
              { label: 'Refroidissement à l\'eau tempérée ≥ 10 minutes', re: [/eau|arros|refroid|rafraich/], w: 2 },
              { label: 'Vêtements/bijoux retirés, brûlure protégée (pansement / film)', re: [/retir|enleve|couvr|film|pansement|isotherme|bijou|montre/], w: 1 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes rue de Charonne, Paris 11e, devant le camion de crêpes.',
              what: 'Un jeune homme de 23 ans s\'est brûlé avec de l\'huile bouillante il y a 5 minutes.',
              state: 'Il est conscient. Brûlure de l\'avant-bras droit avec cloques, environ 3 à 4 fois la paume de sa main.',
              done: 'Je l\'arrose à l\'eau tempérée depuis 5 minutes, je retire la montre, je le protégerai avec du film alimentaire puis une couverture. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **13 h 20**. Vous êtes en dispositif de secours **rue de Charonne**. Le vendeur d\'un camion de crêpes, **Théo**, 23 ans, s\'est brûlé l\'avant-bras avec de l\'huile bouillante.',
        steps: [
          { id: 't1', cat: 'secu', regard: 1, kind: 'choice', w: 2, title: 'Premier regard : la scène',
            say: 'La plaque fume, le gaz est sous le camion. Samir : « Qu\'est-ce que tu vois ? »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je décris « plaque chaude, bouteille de gaz, un blessé » et je demande qu\'on éteigne la plaque avant d\'approcher.', 'Danger supprimé.'),
              A('b', 'Je soigne Théo sans regarder le reste.', 'Autre brûlure possible.'),
              D('c', 'Je jette de l\'eau sur la plaque.', 'Projections.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 4, kind: 'bilan', w: 3, title: 'Je regarde la brûlure',
            say: 'Théo tient son bras contre lui.', hint: 'Que vérifies-tu, qu\'annonces-tu au chef ?',
            checks: [
              { id: 'cons', regard: 2, t: 'Je vérifie conscience et respiration', obs: 'Conscient, respire normalement.', key: true, why: 'Les bases.' },
              { id: 'cause', regard: 3, t: 'Je lui demande ce qui s\'est passé et quand', obs: 'Huile bouillante il y a 2 minutes.', key: true, why: 'Cause et heure.' },
              { id: 'brul', regard: 4, t: 'Je regarde la brûlure', obs: 'Avant-bras droit, cloques dont la somme dépasse ½ paume : **2e degré, brûlure grave**.', key: true, why: 'Étendue et profondeur.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce : « Brûlure avant-bras droit, cloques, 2 minutes »', obs: 'Samir : « Compris. Refroidissement, je préviens la régulation. »', key: true, why: 'Annonce.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Les gestes dans l\'ordre',
            say: 'Samir : « Refroidis, Léa t\'aide. »', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'J\'arrose tout de suite à l\'eau tempérée (15–25 °C), en filet', why: 'Le plus tôt possible.' },
              { t: 'Je retire la montre et la manchette non collées', why: 'Chaleur.' },
              { t: 'Je continue au moins 10 minutes, idéalement 20, et je note l\'heure du début de l\'arrosage', why: 'Brûlure grave : 10 min minimum, idéalement 20.' },
              { t: 'Léa protège avec un pansement stérile ou du film alimentaire, puis une couverture isotherme', why: 'Protéger.' },
              { t: 'J\'annonce au chef : « Refroidissement terminé à ... »', why: 'Compte rendu.' }],
            sceneAfter: { props: { water: true } }, ref: 'Fiche « Valeurs repères ».' },
          { id: 't4', cat: 'gestes', regard: 0, kind: 'multi', w: 2, title: 'Les conseils de la foule',
            say: 'Le public crie des conseils.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Eau tempérée, jamais glacée.', 'Glace = aggrave.'),
              G('b', 'Cloques intactes.', 'Protection.'),
              G('c', 'Je surveille le froid : je couvre le reste du corps.', 'Hypothermie.'),
              D('d', 'De la glace directement.', 'Danger.'),
              D('e', 'Crème, beurre, dentifrice.', 'Danger.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 1, title: 'Après 15 minutes',
            say: 'Théo tremble : « J\'ai froid. »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je préviens Samir, je couvre le reste du corps et je continue le refroidissement selon son avis.', 'Hypothermie.'),
              A('b', 'J\'arrête l\'arrosage sans prévenir.', 'Avis du chef.'),
              D('c', 'Je mets de la glace pour qu\'il arrête de trembler.', 'Danger.')],
            ref: 'Fiche « En équipe ».' },
          T.team({ id: 't6', w: 3, say: 'Les pompiers arrivent. Samir : « Fais ton point. »',
            what: [/brul|huile|ebouillant|eclabouss|cloque/],
            bilan: [
              { label: 'Brûlure de l\'avant-bras droit avec cloques (2e degré)', re: [/avant bras|bras|cloque|2e degre|deuxieme degre/], w: 1.5 },
              { label: 'Étendue (plusieurs paumes)', re: [/paume|surface|etendu/], w: 1 },
              { label: 'Conscient, respire', re: [/conscient|respire/], w: 0.5 }],
            done: [
              { label: 'Refroidissement ≥ 10 minutes, avec l\'heure', re: [/eau|arros|refroid/], w: 2 },
              { label: 'Vêtements/bijoux retirés, brûlure protégée (pansement / film / couverture)', re: [/retir|couvr|film|pansement|isotherme|bijou|montre/], w: 1 }],
            ask: [{ label: 'Avis médical / évacuation', re: [/medecin|avis|evacu|hopital|regulation|smur/], w: 0.5 }],
            model: {
              vic: 'Chef, homme de 23 ans, brûlure par huile bouillante à 13 h 18.',
              bilan: 'Conscient, respire. Avant-bras droit, cloques dont la somme dépasse la moitié de la paume : 2e degré, brûlure grave.',
              done: 'Refroidissement à l\'eau tempérée de 13 h 22 à 13 h 42, montre et manchette retirées, protégé avec du film alimentaire et une couverture isotherme.',
              ask: 'Je propose un avis médical et une évacuation pour prise en charge de la brûlure.'
            } })
        ]
      }
    }
  });
})();
