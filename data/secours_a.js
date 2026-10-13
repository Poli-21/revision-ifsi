// data/secours_a.js — cas 1 à 3 de la section Secourisme (arrêt cardiaque, étouffement, traumatisme à scooter)
// Cas fictifs, lieux réels de Paris mais situations inventées. Voir data/secours.js pour les limites.
'use strict';
(() => {
  const { T, O, cases } = App.SecData;
  const G = O.g, A = O.a, D = O.d;

  // ═══ 1. Arrêt cardiaque d'un joggeur — Quai de la Rapée ═══════════════════════
  cases.push({
    id: 'acr_rapee', title: 'Le joggeur qui s\'effondre', icon: '🫀', place: 'Quai de la Rapée, Paris 12e', level: 2,
    victim: 'Homme d\'environ 59 ans, en tenue de sport', hook: 'Il courait. Il s\'est écroulé d\'un coup, sans un cri. Il ne bouge plus.',
    tags: ['Arrêt cardiaque', 'DAE', 'Compressions'],
    scene: {
      bg: 'quai', plaque: 'Quai de la Rapée', time: 'dusk', clock: '18:42', witnesses: 2,
      victim: { pose: 'lie', skin: '#8a5a3a', top: '#2f6fc4', bottom: '#2a2f3a', hair: '#1c1c1c', hs: 'short', emo: 'sleep', acc: ['beard'] }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, de passage', crew: { you: { pose: 'stand' } },
        intro: 'Il est **18 h 42**. Tu rentres chez toi à pied le long du **quai de la Rapée**. Devant toi, un joggeur s\'écroule. Deux passants s\'arrêtent. Tu es seul secouriste, sans matériel. Tu as ton téléphone.',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : la scène',
            say: 'Le joggeur est tombé sur le trottoir, au bord de la piste cyclable. Des vélos passent à toute vitesse.',
            q: 'Que fais-tu avant d\'arriver près de lui ?',
            opts: [G('a', 'Je regarde la circulation et les vélos, je dis « Je suis secouriste, je m\'en occupe » aux passants, puis j\'approche.', 'Le 1er regard, c\'est toi d\'abord : si tu te fais renverser, il n\'a plus personne. Et dire que tu t\'en occupes rassure et organise les témoins.'),
              A('b', 'Je cours vers lui en traversant la piste cyclable, il n\'y a pas une seconde à perdre.', 'Réflexe louable mais risqué : un vélo peut te renverser. Les 3 secondes de coup d\'œil protègent tout le monde.'),
              D('c', 'Je demande aux passants de le déplacer hors de la piste avant de regarder s\'il respire.', 'Déplacer sans bilan est risqué (chute possible, traumatisme). Ici il suffit de regarder : le trottoir n\'est pas dangereux. On ne bouge une victime que si le danger est réel et immédiat.')],
            after: 'La scène est sûre : le joggeur est sur le trottoir, à l\'écart des vélos.', ref: 'Fiche « 4 regards » — 1er regard : danger, mécanisme, nombre de victimes.' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Deuxième regard : la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } },
            say: 'Tu es à genoux près de lui. Il est allongé sur le dos, les yeux fermés, le visage grisâtre.',
            hint: 'Touche, dans l\'ordre que tu veux, ce que tu fais pour chercher une menace vitale. Les points essentiels doivent être faits.',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement abondant', obs: 'Aucun saignement visible.', key: true, why: 'Un saignement grave se traite avant tout : tu dois toujours le chercher en premier.' },
              { id: 'cons', regard: 2, t: 'Je l\'appelle fort, je secoue doucement ses épaules, je lui demande de serrer ma main', obs: 'Aucune réponse, aucun mouvement. **Il est inconscient.**', key: true, why: 'Tester la réponse (parole + toucher) est le 1er geste du bilan vital.' },
              { id: 'ouv', regard: 2, t: 'Je libère les voies aériennes : tête basculée en arrière, menton levé', obs: 'La bouche est vide. La tête est en arrière, menton levé.', key: true, why: 'Sans voies aériennes libres, impossible de juger la respiration.' },
              { id: 'resp', regard: 2, t: 'Je regarde le ventre et la poitrine, j\'écoute et je sens le souffle, 10 secondes maximum', obs: 'La poitrine ne bouge pas. Quelques mouvements isolés, bruyants, très espacés : ce n\'est **pas une respiration normale**. Il est en **arrêt cardiaque**.', key: true, why: 'Respiration absente ou anormale (gasps) + inconscience = arrêt cardiaque.' },
              { id: 'pouls', regard: 3, t: 'Je cherche son pouls pendant une minute', obs: 'Tu perds une minute précieuse : en cas d\'inconscience sans respiration normale, on ne cherche pas le pouls. On passe directement à l\'action.' },
              { id: 'tens', regard: 4, t: 'Je prends sa tension', obs: 'Pas le moment : sans respiration, chaque minute sans massage réduit ses chances.' },
              { id: 'parle', regard: 3, t: 'Je lui demande ses antécédents', obs: 'Il est inconscient : il ne peut pas répondre. Les témoins pourront peut-être te dire s\'il s\'est plaint avant.' }
            ],
            after: '**Inconscient, ne respire pas : arrêt cardiaque (C).** Il faut alerter, chercher un DAE (DSA) et commencer les compressions.', ref: 'Fiche « 4 regards » — 2e regard. Inconscient + ne respire pas (ou gasps) = arrêt cardiaque.' },
          { id: 's3', cat: 'alerte', regard: 0, kind: 'choice', w: 2, title: 'Je déclenche l\'alerte',
            say: 'Deux passants sont à côté de toi, l\'air sidéré. L\'un d\'eux tient déjà son téléphone.',
            q: 'Comment organises-tu l\'alerte ?',
            opts: [G('a', 'Je désigne un passant : « Vous, appelez le 15 en haut-parleur ! » et un autre : « Vous, courez chercher un défibrillateur (DAE) ! ». Je commence les compressions.', 'Tu délègues pour ne pas retarder les compressions : l\'alerte et le DAE partent pendant que tu masses. Tu désignes des personnes précises : « vous » marche mieux que « quelqu\'un ».'),
              A('b', 'J\'appelle moi-même le 15, j\'explique toute la situation puis je commence les compressions.', 'Possible si tu es vraiment seul (haut-parleur !). Mais avec des témoins, tu retardes le massage de plusieurs minutes pour rien.'),
              D('c', 'Je le mets sur le côté (PLS), il respirera mieux, et on appelle ensuite.', 'La PLS est pour une victime inconsciente qui RESPIRE. Lui ne respire pas : il lui faut des compressions tout de suite.')],
            sceneAfter: { crew: { you: { pose: 'cpr' } } }, after: 'Le 15 est en ligne en haut-parleur. Un passant part chercher le DAE du bar-tabac en face.', ref: 'Fiche « Alerter » — je désigne des témoins, je mets le haut-parleur.' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'La réanimation : les gestes dans l\'ordre',
            say: 'Le régulateur du 15 te confirme : « Commencez la réanimation ». Tu es à genoux près de son thorax.',
            q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je dégage sa poitrine (je relève ou j\'écarte le tee-shirt) et je vérifie qu\'il est sur un sol dur', why: 'Il faut une surface dure pour comprimer efficacement.' },
              { t: 'Je place le talon d\'une main au centre de la poitrine, l\'autre main dessus, bras tendus à la verticale', why: 'Les compressions doivent être bien placées, bras tendus.' },
              { t: 'Je fais 30 compressions : 5 cm environ, 100 à 120 par minute, en laissant le thorax se relever', why: 'Profondeur 5 cm (jamais plus de 6), rythme 100–120/min.' },
              { t: 'Je bascule la tête et je fais 2 insufflations (si je suis formé et à l\'aise)', why: 'Rapport 30:2. Si tu ne peux pas ou ne veux pas souffler, les compressions seules valent mieux que rien.' },
              { t: 'Je reprends immédiatement 30 compressions, et on continue 30:2', why: 'Il faut interrompre le moins possible les compressions.' }],
            after: 'Tu comprimes sans t\'arrêter. Le passant revient avec le **DAE**.', ref: 'Fiche « Valeurs repères » — compressions 5 cm, 100–120/min, 30:2.' },
          { id: 's5', cat: 'gestes', regard: 0, kind: 'multi', w: 3, title: 'Le DAE (DSA) est là',
            scene: { props: { dae: true } },
            say: 'Le passant pose le défibrillateur à côté de toi. L\'appareil est déjà ouvert.',
            q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je fais allumer le DAE (ou je l\'allume) et je suis ses instructions vocales.', 'Le DAE guide pas à pas : on suit sa voix.'),
              G('b', 'Je continue les compressions pendant que le passant dégage la poitrine et colle les électrodes comme sur le schéma.', 'Tu ne t\'arrêtes que quand c\'est nécessaire.'),
              G('c', 'Pendant l\'analyse du DAE, plus personne ne touche la victime.', 'Toucher pendant l\'analyse peut fausser le résultat.'),
              G('d', 'Si un choc est conseillé : je m\'assure que personne ne touche la victime, puis le choc est délivré ; je reprends les compressions tout de suite.', 'Après le choc, on ne vérifie pas le pouls : on reprend les compressions immédiatement.'),
              A('e', 'J\'arrête les compressions pour lire la notice du DAE.', 'Inutile : le DAE parle. Chaque pause réduit le débit sanguin.'),
              D('f', 'Je continue les compressions pendant l\'analyse et pendant le choc.', 'Danger : fausse l\'analyse et risque de choc pour le sauveteur.')],
            sceneAfter: { props: { pads: true, daeOn: true } }, after: 'Le DAE annonce : « Choc conseillé. Écartez-vous. » Le choc est délivré. Tu reprends les compressions.', ref: 'Fiche « Gestes clés » — DAE : instructions vocales, personne ne touche.' },
          T.solo({ id: 's6', w: 3, say: 'Le régulateur du 15, toujours en haut-parleur, te demande : « Faites-moi le point, où êtes-vous et que s\'est-il passé ? » Pendant ce temps, un passant a pris ta place pour comprimer.',
            addr: [/rapee/, /quai/, /paris 12|12 ?e|12 eme|douze/], what: [/s est (effondre|ecroule)|effondre|ecroule|malaise|arret cardiaque|inconscient|tombe|jogging|joggeur|course/],
            state: [
              { label: 'Il est inconscient (ne répond pas)', re: [/inconscient|ne repond (pas|plus)|aucune reaction|ne reagit/], w: 1 },
              { label: 'Il ne respire pas (ou respiration anormale)', re: [/ne respire (pas|plus)|pas de respiration|respiration (anormale|absente)|gasp|arret respiratoire|apnee/], w: 1.5 }
            ],
            done: [
              { label: 'Réanimation en cours (compressions / massage cardiaque)', re: [/compression|massage|rcp|reanimation|je masse/], w: 2 },
              { label: 'DAE (défibrillateur) posé / choc délivré', re: [/dae|defibrill|choc/], w: 1.5 }
            ],
            model: {
              who: 'Je suis secouriste (PSE1), mon numéro est le 06 12 34 56 78. Nous sommes sur le quai de la Rapée, Paris 12e, à hauteur de la piste cyclable.',
              what: 'Un homme d\'une soixantaine d\'années, joggeur, s\'est effondré brusquement. Une seule victime.',
              state: 'Il est inconscient, il ne répond pas. Il ne respire pas normalement (quelques gasps). Pas de saignement.',
              done: 'J\'ai commencé les compressions il y a 4 minutes, un DAE a été posé, un choc a été délivré et on a repris les compressions. Je reste en ligne.'
            }, after: 'Les secours (équipe médicale du SMUR et pompiers) arrivent. Tu continues avec le passant jusqu\'à leur relais.' })
        ]
      },
      team: {
        role: 'PSE1 en équipe PCPS — chef d\'agrès : Samir · équipière : Léa', crew: { you: { pose: 'stand' }, ca: { label: 'Samir (CA)' }, eq: { label: 'Léa' } },
        intro: 'Il est **18 h 42**. Tu es en **dispositif de secours** sur le quai de la Rapée avec **Samir, chef d\'agrès**, et **Léa, équipière**. Un joggeur s\'écroule à une dizaine de mètres. Vous avez un sac de secours, un **DAE** et un **BAVU**.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : je préviens et je sécurise',
            say: 'Le joggeur est tombé près de la piste cyclable. Samir dit : « On y va. »',
            q: 'Que fais-tu en approchant ?',
            opts: [G('a', 'Je préviens : « Chef, victime au sol, 10 mètres devant », je regarde les vélos et on approche ensemble.', 'Tu informes le chef (il décide) et tu regardes d\'abord les dangers.'),
              A('b', 'Je cours devant, je préviens ensuite.', 'En équipe, on part ensemble et on s\'annonce : le chef doit savoir où tu es.'),
              D('c', 'Je traverse la piste cyclable en courant sans regarder.', 'Danger pour toi : un vélo peut te percuter.')],
            ref: 'Fiche « En équipe » — j\'annonce, je regarde le danger.' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Deuxième regard : la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } },
            say: 'Tu es près de lui. Samir est à ta droite, Léa arrive avec le sac.',
            hint: 'Touche ce que tu fais, puis annonce ton bilan au chef.',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement abondant', obs: 'Aucun saignement visible.', key: true, why: 'On cherche toujours l\'hémorragie en premier.' },
              { id: 'cons', regard: 2, t: 'Je l\'appelle fort, secoue doucement ses épaules, lui demande de serrer ma main', obs: 'Aucune réponse. **Il est inconscient.**', key: true, why: 'Test de réponse (parole + toucher).' },
              { id: 'ouv', regard: 2, t: 'Je libère les voies aériennes : tête en arrière, menton levé', obs: 'La bouche est vide. La tête est en arrière.', key: true, why: 'Libérer les voies aériennes avant de juger la respiration.' },
              { id: 'resp', regard: 2, t: 'Je regarde, j\'écoute, je sens la respiration — 10 secondes au maximum', obs: 'La poitrine ne bouge pas. Quelques gasps isolés : **pas de respiration normale = arrêt cardiaque**.', key: true, why: 'Respiration absente ou anormale = arrêt cardiaque.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce au chef : « Victime inconsciente, ne respire pas »', obs: 'Samir répond : « Compris. Léa, DSA, BAVU et O₂ à 15 L/min. Toi, tu démarres les compressions. Je fais l\'alerte. »', key: true, why: 'Tu dois transmettre immédiatement ce qui est vital au chef.' },
              { id: 'pouls', regard: 3, t: 'Je cherche son pouls pendant une minute', obs: 'Tu perds une minute. Quand une victime est inconsciente et ne respire pas, on ne prend pas le pouls : on agit.' }
            ],
            after: 'Samir appelle le **15 / 18** en demandant un **médecin**. L\'arrêt cardiaque est confirmé.', ref: 'Fiche « 4 regards » — 2e regard ; fiche « En équipe » — j\'annonce au chef.' },
          { id: 't3', cat: 'equipe', regard: 0, kind: 'choice', w: 2, title: 'Les ordres du chef : je réponds comme il faut',
            say: 'Samir dit : « Léa, DSA, BAVU et O₂ à 15 litres. Toi, compressions. Je fais l\'alerte. »',
            q: 'Que fais-tu ?',
            opts: [G('a', 'Je dis « Compressions, compris » et je démarre tout de suite 30 compressions au centre de la poitrine (cardio-pompe 30:2).', 'Tu reformules l\'ordre et tu l\'exécutes sans attendre.'),
              A('b', 'J\'attends que Léa ait installé le DAE avant de commencer à comprimer.', 'Les compressions ne doivent pas attendre : elles commencent dès que l\'arrêt est constaté.'),
              D('c', 'Je pars chercher le DAE moi-même, Léa est moins rapide.', 'Tu quittes la victime sans massage et tu désorganises la répartition des rôles.')],
            sceneAfter: { crew: { you: { pose: 'cpr' } } }, ref: 'Fiche « En équipe » — je reformule, j\'exécute.' },
          { id: 't4', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Le DAE arrive : l\'ordre des gestes',
            say: 'Léa déploie le DAE à côté de toi pendant que tu comprimes.',
            q: 'Remets les actions dans l\'ordre.',
            items: [
              { t: 'Je continue les compressions pendant que Léa allume le DAE et dégage la poitrine', why: 'On ne s\'arrête pas de comprimer pour préparer le DAE.' },
              { t: 'Léa colle les électrodes ; je continue jusqu\'à ce que le DAE demande de s\'écarter', why: 'Seule l\'analyse impose l\'arrêt.' },
              { t: 'Le DAE analyse : « Ne touchez plus la victime » — plus personne ne la touche', why: 'Toucher pendant l\'analyse fausse la lecture.' },
              { t: 'Choc conseillé : je m\'assure que personne ne touche, Léa délivre le choc', why: 'Sécurité de l\'équipe avant le choc.' },
              { t: 'Je reprends immédiatement les compressions (30:2) sans chercher le pouls', why: 'Après le choc, on reprend la RCP tout de suite.' }],
            sceneAfter: { props: { dae: true, pads: true, daeOn: true } }, ref: 'Fiche « Gestes clés » — DAE.' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 1, title: 'Je fatigue : je le dis',
            say: 'Cela fait 2 minutes que tu masses. Tes bras fatiguent, la profondeur diminue.',
            q: 'Que fais-tu ?',
            opts: [G('a', 'Je préviens : « Chef, je fatigue, relais dans 10 secondes » et je laisse Léa prendre ma place sans interruption.', 'Un relais toutes les 2 minutes garde des compressions efficaces. Tu préviens le chef.'),
              A('b', 'Je continue le plus longtemps possible sans rien dire.', 'Fatigue = compressions moins profondes : moins efficaces.'),
              D('c', 'J\'arrête de comprimer pour souffler quelques instants, puis je reprends.', 'Chaque interruption diminue les chances de survie.')],
            ref: 'Fiche « Valeurs repères » — relais toutes les 2 minutes.' },
          T.team({ id: 't6', w: 3, say: 'Les médecins du SMUR arrivent. Samir te dit : « Fais ton point, je transmets aux médecins. »',
            what: [/s est (effondre|ecroule)|effondre|ecroule|malaise|arret cardiaque|inconscient|tombe|jogg|course/],
            bilan: [
              { label: 'Inconscient (ne répond pas)', re: [/inconscient|ne repond (pas|plus)|aucune reaction/], w: 1 },
              { label: 'Ne respire pas (ou respiration anormale / gasps)', re: [/ne respire (pas|plus)|pas de respiration|respiration (anormale|absente)|gasp|apnee|arret respiratoire/], w: 1.5 },
              { label: 'Arrêt cardiaque', re: [/arret cardiaque|acr|arret cardio/], w: 1 }],
            done: [
              { label: 'RCP / compressions + relais', re: [/compression|massage|rcp|reanimation/], w: 1.5 },
              { label: 'DAE : pose, choc(s) délivré(s)', re: [/dae|defibrill|choc/], w: 1.5 }],
            ask: [{ label: 'La présence d\'un médecin (SMUR) / la poursuite de la RCP', re: [/smur|medecin|poursui|continu|relais/], w: 0.5 }],
            model: {
              vic: 'Chef, homme d\'environ 59 ans, joggeur. Effondré brutalement à 18 h 42.',
              bilan: 'Inconscient, ne répond pas. Ne respire pas (gasps au début). Pas de saignement. Arrêt cardiaque.',
              done: 'RCP démarrée à 18 h 43, DAE posé à 18 h 46, un choc délivré, reprise des compressions, relais à 18 h 45.',
              ask: 'Je propose de continuer la RCP jusqu\'à la prise en charge médicale du SMUR.'
            }, after: 'Les médecins du SMUR prennent le relais. Samir te fait un signe : « Bien joué. On fait le point à la fin. »' })
        ]
      }
    }
  });
  // ═══ 2. Obstruction complète — terrasse de café, rue Oberkampf ═══════════════
  cases.push({
    id: 'etouff_oberkampf', title: 'Étouffement à la terrasse', icon: '🍽️', place: 'Rue Oberkampf, Paris 11e', level: 1,
    victim: 'Femme d\'environ 74 ans, déjeune en terrasse', hook: 'Elle se lève d\'un coup, les mains à la gorge. Pas un son ne sort.',
    tags: ['Obstruction des voies aériennes', 'Claques dans le dos', 'Compressions abdominales'],
    scene: {
      bg: 'terrasse', plaque: 'Rue Oberkampf', clock: '12:40', witnesses: 2,
      victim: { pose: 'grab', skin: '#f6d3b8', top: '#9a6fc4', skirt: true, hair: '#d9d9d9', hs: 'bun', emo: 'alarm' }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, client de la terrasse voisine', crew: { you: { pose: 'stand' } },
        intro: 'Il est **12 h 40**. Tu déjeunes sur une terrasse de la **rue Oberkampf**. À la table d\'à côté, une dame d\'environ 74 ans se lève brusquement, les mains à la gorge. Les autres clients se retournent.',
        steps: [
          { id: 's1', cat: 'bilan', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : je m\'approche',
            say: 'Rien d\'autre ne menace la scène : pas de circulation, pas de verre brisé. La dame est debout, très pâle, la bouche ouverte.',
            q: 'Que fais-tu en premier ?',
            opts: [G('a', 'Je m\'approche, je me présente (« Je suis secouriste ») et je lui demande : « Vous vous étouffez ? Vous pouvez parler ? »', 'Il faut savoir si l\'obstruction est partielle (elle tousse, elle parle) ou complète (aucun son). La question la rassure et te donne la réponse.'),
              A('b', 'Je lui tape tout de suite dans le dos sans rien demander.', 'Si elle tousse ou parle, il ne faut PAS la frapper : on l\'encourage à tousser. Les claques sont réservées à l\'obstruction complète.'),
              D('c', 'Je lui donne un verre d\'eau pour « faire passer ».', 'Elle ne peut pas avaler : l\'eau risque de passer dans les voies respiratoires.')],
            ref: 'Fiche « 4 regards » — 1er regard.' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'stand' } } },
            say: 'Tu es devant elle. Elle te regarde, affolée.', hint: 'Que fais-tu pour comprendre si l\'obstruction est partielle ou complète ?',
            checks: [
              { id: 'q', regard: 2, t: 'Je lui demande : « Vous vous étouffez ? Vous pouvez parler, tousser ? »', obs: 'Elle fait « oui » de la tête, mais **aucun son ne sort** et elle ne peut pas tousser.', key: true, why: 'Pas de parole ni de toux : l\'air ne passe plus.' },
              { id: 'souffle', regard: 2, t: 'Je regarde et j\'écoute : respire-t-elle ? fait-elle du bruit ?', obs: 'Aucun bruit, aucun souffle. Son visage devient rouge puis bleuté. **Obstruction complète.**', key: true, why: 'Silence total = l\'air ne passe plus du tout.' },
              { id: 'enc', regard: 2, t: 'Je l\'encourage à tousser fort', obs: 'Elle ne peut pas tousser : il faut agir, l\'encouragement ne suffit pas.' },
              { id: 'doigt', regard: 2, t: 'Je mets mes doigts au fond de sa gorge pour sortir l\'aliment', obs: 'À éviter : tu risques de pousser l\'aliment plus loin.' },
              { id: 'pouls', regard: 3, t: 'Je prends son pouls', obs: 'Pas le moment : elle manque d\'air, chaque seconde compte.' }
            ],
            after: '**Elle ne peut ni parler, ni tousser, ni respirer : obstruction complète.** Il faut agir tout de suite.', ref: 'Fiche « Gestes clés » — obstruction complète.' },
          { id: 's3', cat: 'alerte', regard: 0, kind: 'choice', w: 2, title: 'Qui alerte ?',
            say: 'Le serveur et un client sont à côté de toi.',
            q: 'Comment organises-tu l\'alerte ?',
            opts: [G('a', 'Je désigne : « Vous, appelez le 15 ou le 18 et dites : personne qui s\'étouffe, rue Oberkampf. Revenez me dire quand c\'est fait. » Puis je commence les gestes.', 'Tu délègues pour garder les mains libres. Tu désignes quelqu\'un et tu lui demandes de revenir : tu sais que c\'est fait.'),
              A('b', 'Je m\'écarte pour appeler moi-même le 15.', 'Tu laisses la dame sans aide pendant que tu téléphones : risque d\'aggravation en quelques secondes.'),
              D('c', 'On attend de voir si ça passe tout seul.', 'Une obstruction complète peut tuer en quelques minutes.')],
            ref: 'Fiche « Alerter » — je désigne des témoins.' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Les gestes pour désobstruer',
            say: 'La dame est toujours debout, penchée en avant.', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je me place sur le côté, légèrement derrière elle ; je soutiens son thorax d\'une main et je la penche en avant', why: 'Penchée en avant, l\'aliment peut sortir par la bouche.' },
              { t: 'Je donne jusqu\'à 5 claques vigoureuses dans le dos, entre les omoplates, avec le talon de la main', why: '1 à 5 claques, chacune avec l\'idée de libérer le passage.' },
              { t: 'Si ça ne marche pas : je me place derrière elle, je fais 5 compressions abdominales (poing au-dessus du nombril, tirées vers l\'arrière et le haut)', why: 'Les compressions abdominales (Heimlich) font monter l\'air pour chasser l\'obstacle.' },
              { t: 'J\'alterne 5 claques puis 5 compressions abdominales', why: 'On alterne jusqu\'à ce que l\'obstacle sorte ou qu\'elle perde connaissance.' },
              { t: 'Dès qu\'elle respire ou tousse, je m\'arrête et je la surveille', why: 'Même si ça a marché, elle doit être vue par un médecin.' }],
            after: 'Après quelques essais, la dame s\'affaisse et perd connaissance dans tes bras.', ref: 'Fiche « Valeurs repères » — 5 claques puis 5 compressions.' },
          { id: 's5', cat: 'gestes', regard: 2, kind: 'choice', w: 3, title: 'Elle perd connaissance',
            scene: { victim: { pose: 'lie', emo: 'sleep' }, crew: { you: { pose: 'kneel' } } },
            say: 'Elle est inconsciente, ne bouge plus. Le client revient : « J\'ai appelé le 15, ils arrivent. »',
            q: 'Que fais-tu ?',
            opts: [G('a', 'Je l\'allonge doucement au sol, je confirme l\'alerte au 15 (haut-parleur) et je commence la RCP : 30 compressions, puis je regarde dans la bouche avant de souffler.', 'Une obstruction qui provoque une perte de connaissance se traite comme un arrêt cardiaque : on commence par les compressions, elles font aussi bouger l\'obstacle. En regardant dans la bouche, on retire ce qu\'on voit.'),
              A('b', 'Je continue les claques dans le dos pendant qu\'elle est au sol.', 'Au sol, inconsciente, il faut la RCP : les compressions thoraciques sont plus efficaces.'),
              D('c', 'Je la laisse assise contre le mur en attendant les secours.', 'Inconsciente et sans respiration efficace, elle risque l\'arrêt cardiaque : il faut la mettre au sol et commencer la RCP.')],
            sceneAfter: { crew: { you: { pose: 'cpr' } } }, ref: 'Fiche « Gestes clés » — inconscient qui ne respire pas.' },
          T.solo({ id: 's6', w: 3, say: 'Le régulateur du 15 te rappelle et demande à te parler.',
            addr: [/oberkampf/, /rue/, /terrasse/, /paris 11|11 ?e|11 eme|onze/], what: [/etouff|obstruction|fausse route|avale|morceau|repas|mange|dejeun|aliment/],
            state: [
              { label: 'Elle ne pouvait ni parler, ni tousser, ni respirer (obstruction complète)', re: [/ne (pouvait|peut) (ni|pas)|ne respir|obstruction|etouff|aucun son|ne tousse/], w: 1 },
              { label: 'Elle a perdu connaissance / est inconsciente', re: [/inconscient|perdu connaissance|perte de connaissance|s est (effondr|affaiss)|ne repond/], w: 1.5 }
            ],
            done: [
              { label: 'Claques dans le dos', re: [/claque|tape dans le dos|dos/], w: 1 },
              { label: 'Compressions abdominales', re: [/abdomin|heimlich|ventre/], w: 1 },
              { label: 'RCP / compressions thoraciques en cours', re: [/rcp|compression|massage|reanimation/], w: 1.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes au café, rue Oberkampf, Paris 11e, sur la terrasse.',
              what: 'Une dame d\'environ 74 ans s\'est étouffée en mangeant.',
              state: 'Elle ne pouvait ni parler ni tousser ni respirer. Elle a perdu connaissance et ne respire pas.',
              done: 'J\'ai fait 5 claques dans le dos puis 5 compressions abdominales, puis je l\'ai allongée et j\'ai commencé la RCP il y a 2 minutes. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: 'PSE1 en équipe PCPS — chef d\'agrès : Samir · équipière : Léa', crew: { you: { pose: 'stand' }, ca: { label: 'Samir (CA)' }, eq: { label: 'Léa' } },
        intro: 'Il est **12 h 40**. Vous êtes en **dispositif de secours** à pied dans la **rue Oberkampf**. Tu vois une dame qui se lève, les mains à la gorge. Samir et Léa sont quelques mètres derrière toi.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Je préviens et j\'approche',
            say: 'La dame est sur la terrasse. Rien d\'autre ne menace.', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'annonce : « Chef, personne qui s\'étouffe, terrasse à gauche ! », je m\'approche et me présente.', 'Tu préviens ton équipe en une phrase et tu agis.'),
              A('b', 'J\'y vais sans rien dire, je les préviendrai après.', 'Ils doivent savoir où tu es et ce que tu fais pour t\'aider.'),
              D('c', 'Je donne un verre d\'eau à la dame.', 'Elle ne peut pas avaler.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            say: 'Tu es devant elle. Samir et Léa arrivent.', hint: 'Obstruction partielle ou complète ?',
            checks: [
              { id: 'q', regard: 2, t: 'Je lui demande : « Vous vous étouffez ? Vous pouvez parler, tousser ? »', obs: 'Elle fait « oui » de la tête, **aucun son ne sort**, elle ne tousse pas.', key: true, why: 'Pas de parole ni de toux.' },
              { id: 'souffle', regard: 2, t: 'Je regarde et j\'écoute sa respiration', obs: 'Aucun souffle. Le visage devient bleuté. **Obstruction complète.**', key: true, why: 'Silence total = obstruction complète.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce au chef : « Obstruction complète »', obs: 'Samir : « Compris. Claques puis compressions abdominales, vas-y. Léa, prépare le matériel, j\'alerte le 15. »', key: true, why: 'Le chef doit être informé tout de suite.' },
              { id: 'enc', regard: 2, t: 'Je l\'encourage à tousser fort', obs: 'Elle ne peut pas tousser : il faut agir.' },
              { id: 'doigt', regard: 2, t: 'Je mets mes doigts au fond de sa gorge', obs: 'À éviter : tu risques de pousser l\'aliment plus loin.' }
            ],
            after: 'Samir appelle le **15**. À toi d\'agir.', ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Les gestes pour désobstruer',
            say: 'Samir dit : « Vas-y, je te couvre. »', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je me place sur le côté, légèrement derrière elle ; je soutiens son thorax et je la penche en avant', why: 'Penchée en avant, l\'aliment peut sortir.' },
              { t: 'Je donne jusqu\'à 5 claques vigoureuses dans le dos, entre les omoplates', why: 'Premier geste.' },
              { t: 'Si ça ne marche pas : 5 compressions abdominales, derrière elle', why: 'Deuxième geste.' },
              { t: 'J\'alterne 5 claques puis 5 compressions abdominales', why: 'On alterne jusqu\'à désobstruction ou perte de connaissance.' },
              { t: 'Dès qu\'elle respire ou tousse, je m\'arrête et je préviens le chef', why: 'Elle doit quand même être vue par un médecin.' }],
            after: 'La dame s\'affaisse, inconsciente.', ref: 'Fiche « Valeurs repères ».' },
          { id: 't4', cat: 'equipe', regard: 2, kind: 'choice', w: 3, title: 'Elle perd connaissance',
            scene: { victim: { pose: 'lie', emo: 'sleep' }, crew: { you: { pose: 'kneel' } } },
            say: 'Samir dit : « Allonge-la, RCP ! Léa, DAE ! »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je dis « RCP, compris », je l\'accompagne au sol et je commence immédiatement 30 compressions.', 'Tu reformules et tu exécutes sans attendre.'),
              A('b', 'Je continue les compressions abdominales au sol.', 'Au sol, inconsciente : on passe à la RCP.'),
              D('c', 'Je la mets en PLS.', 'Elle ne respire pas : la PLS est pour l\'inconscient qui respire.')],
            sceneAfter: { crew: { you: { pose: 'cpr' } } }, ref: 'Fiche « Gestes clés ».' },
          { id: 't5', cat: 'gestes', regard: 0, kind: 'multi', w: 2, title: 'Pendant la RCP',
            say: 'Tu comprimes. Léa déploie le DAE.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je continue 30 compressions : 2 insufflations, en regardant dans la bouche avant de souffler.', 'Tu retires un corps étranger seulement s\'il est visible et accessible.'),
              G('b', 'Léa pose le DAE dès que possible et on suit ses instructions.', 'DAE le plus tôt possible.'),
              G('c', 'J\'annonce au chef tout changement (« elle bouge », « elle respire »).', 'Le chef doit tout savoir.'),
              A('d', 'Je ne fais que des insufflations pour « débloquer ».', 'Les compressions sont indispensables.'),
              D('e', 'Je fais un balayage à l\'aveugle avec les doigts au fond de la gorge.', 'Tu risques de pousser l\'obstacle plus loin.')],
            ref: 'Fiche « Valeurs repères ».' },
          T.team({ id: 't6', w: 3, say: 'Les pompiers arrivent. Samir te dit : « Fais ton point. »',
            what: [/etouff|obstruction|fausse route|avale|morceau|repas|mange|dejeun/],
            bilan: [
              { label: 'Obstruction complète : ne parlait plus, ne toussait plus, ne respirait plus', re: [/obstruction|ne (pouvait|peut) (ni|pas)|aucun son|ne respir|etouff/], w: 1.5 },
              { label: 'Perte de connaissance', re: [/inconscient|perdu connaissance|perte de connaissance|affaiss|effondr/], w: 1.5 }],
            done: [
              { label: 'Claques dans le dos et compressions abdominales', re: [/claque|abdomin|heimlich/], w: 1 },
              { label: 'RCP / compressions + DAE', re: [/rcp|compression|massage|dae|defibrill/], w: 1.5 }],
            ask: [{ label: 'Prise en charge médicale / évacuation', re: [/medecin|smur|evacu|hopital|renfort/], w: 0.5 }],
            model: {
              vic: 'Chef, femme d\'environ 74 ans, étouffée en déjeunant, vers 12 h 40.',
              bilan: 'Obstruction complète au départ (ne parlait plus, ne toussait plus), puis perte de connaissance et arrêt de la respiration.',
              done: 'Claques et compressions abdominales à 12 h 41, RCP à 12 h 43, DAE posé à 12 h 45.',
              ask: 'Je propose une évacuation médicalisée.'
            } })
        ]
      }
    }
  });

  // ═══ 3. Traumatisme de scooter — boulevard Saint-Germain ═════════════════════
  cases.push({
    id: 'scooter_germain', title: 'Le scooter et le casque', icon: '🛵', place: 'Boulevard Saint-Germain, Paris 6e', level: 2,
    victim: 'Yanis, 19 ans, conducteur de scooter', hook: 'Il est assis sur la chaussée, casque intégral sur la tête, et il veut se lever. Sa nuque lui fait mal.',
    tags: ['Traumatisme', 'Maintien de tête', 'Casque'],
    scene: {
      bg: 'carrefour', plaque: 'Boulevard Saint-Germain', clock: '18:05', witnesses: 3,
      victim: { pose: 'sit', skin: '#cf966b', top: '#2e3944', hair: '#1c1c1c', emo: 'pain' }, props: { scooter: true, helmetOn: true }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, passant', crew: { you: { pose: 'stand' } },
        intro: 'Il est **18 h 05**. Tu traverses le **boulevard Saint-Germain** à pied. Un scooter heurte une voiture à l\'angle. Le conducteur, **Yanis**, est assis sur la chaussée, le **casque intégral** sur la tête. La circulation repart au feu vert.',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 2, title: 'Premier regard : la scène',
            say: 'Les voitures redémarrent. Yanis est à 4 mètres de toi, sur la chaussée. Il y a de l\'essence au sol sous le scooter.',
            q: 'Que fais-tu ?',
            opts: [G('a', 'Je regarde la circulation, je demande aux témoins de bloquer les voitures (bras levés, feux de détresse), puis j\'approche en sécurité.', 'Ta sécurité d\'abord, puis celle de la victime : tu fais baliser la zone avant d\'intervenir.'),
              A('b', 'J\'approche tout de suite par la chaussée, je gérerai la circulation après.', 'Sans protection, tu peux te faire percuter.'),
              D('c', 'Je cours vers Yanis en traversant sans regarder.', 'Tu deviens la 2e victime.')],
            sceneAfter: { props: { cones: true, tape: true } }, after: 'Un chauffeur coupe le moteur de sa voiture, d\'autres bloquent les voies : la zone est protégée.', ref: 'Fiche « 4 regards » — 1er regard.' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } },
            say: 'Tu es près de Yanis. Il essaie de se lever.', hint: 'Qu\'est-ce que tu fais, dans quel ordre ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement important', obs: 'Aucun saignement important. Une égratignure au coude.', key: true, why: 'Toujours chercher l\'hémorragie.' },
              { id: 'tete', regard: 2, t: 'Je lui demande de ne pas bouger la tête et je la maintiens à deux mains, dans l\'axe, avec le casque', obs: 'Il arrête de bouger. Tu tiens le casque et la tête dans l\'axe du corps.', key: true, why: 'Un traumatisme du cou est possible : il faut limiter les mouvements.' },
              { id: 'cons', regard: 2, t: 'Je lui parle : « Tu m\'entends ? Comment tu t\'appelles ? »', obs: 'Il répond : « Yanis… ma nuque… » Il est **conscient**.', key: true, why: 'Il répond : la conscience est conservée.' },
              { id: 'resp', regard: 2, t: 'Je regarde et j\'écoute sa respiration', obs: 'Il respire sans difficulté, environ 18 fois par minute.', key: true, why: 'Respiration normale.' },
              { id: 'douleur', regard: 3, t: 'Je lui demande où il a mal, s\'il a des fourmillements', obs: 'Douleur à la nuque, **picotements dans la main gauche**. Suspicion de lésion du rachis cervical.' },
              { id: 'casque', regard: 3, t: 'Je lui retire le casque pour mieux l\'examiner', obs: 'À éviter : retirer un casque intégral chez une victime consciente qui respire risque d\'aggraver une lésion du cou.' },
              { id: 'lever', regard: 3, t: 'Je l\'aide à se lever pour sortir de la chaussée', obs: 'À éviter : un traumatisme de la nuque peut s\'aggraver.' }
            ],
            after: '**Conscient, il respire, mal à la nuque, picotements** : suspicion de traumatisme du rachis. Une collision en 2 roues est un mécanisme à haut risque pour le rachis. Pas de menace vitale immédiate, mais il ne doit pas bouger.', ref: 'Fiche « Gestes clés » — maintien de tête.' },
          { id: 's3', cat: 'alerte', regard: 0, kind: 'choice', w: 2, title: 'L\'alerte',
            say: 'Un témoin tient son téléphone.', q: 'Que demandes-tu ?',
            opts: [G('a', 'Je lui dis : « Appelez le 18 (accident sur la voie publique), mettez le haut-parleur, restez en ligne avec moi : je vous dicterai quoi dire. »', 'Tu délègues l\'appel pour garder tes mains sur la tête de Yanis. Le haut-parleur te permet de répondre.'),
              A('b', 'Je lâche la tête de Yanis pour appeler moi-même.', 'Tu perds le maintien de la tête pendant l\'appel.'),
              D('c', 'On n\'appelle pas, il a l\'air d\'aller bien.', 'Suspicion de traumatisme du cou : toujours alerter.')],
            ref: 'Fiche « Alerter ».' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'multi', w: 3, title: 'En attendant les secours',
            say: 'Tu maintiens la tête. Yanis est inquiet, il a froid.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je continue à maintenir la tête et le casque à deux mains, dans l\'axe, sans tirer ni tourner.', 'Le maintien limite les mouvements du cou.'),
              G('b', 'Je lui parle, je le rassure et je lui redis de ne pas bouger.', 'La parole calme et te permet de surveiller sa conscience.'),
              G('c', 'Je surveille régulièrement sa respiration et sa conscience (je lui pose des questions).', 'Un changement doit être signalé à l\'opérateur immédiatement.'),
              G('d', 'Un témoin le couvre avec une veste ou une couverture.', 'Le froid aggrave l\'état d\'une victime.'),
              A('e', 'Je lui donne à boire car il dit avoir soif.', 'Rien à boire ni à manger : il peut avoir besoin d\'une opération.'),
              D('f', 'Je lui retire le casque pour qu\'il soit plus à l\'aise.', 'Casque conservé tant qu\'il respire normalement.')],
            ref: 'Fiche « Gestes clés ».' },
          T.solo({ id: 's5', w: 3, say: 'Le régulateur demande à te parler.',
            addr: [/saint germain/, /boulevard|bd /, /carrefour|angle/, /paris 6|6 ?e|6 eme|odeon|sixieme/], what: [/accident|scooter|moto|collision|choc|heurt|chute|voiture/],
            state: [
              { label: 'Il est conscient / il répond', re: [/conscient|repond|parle/], w: 1 },
              { label: 'Il respire normalement', re: [/respir/], w: 1 },
              { label: 'Douleur à la nuque (ou cou/dos) ± fourmillements', re: [/nuque|cou\b|cervical|dos|rachis|colonne|fourmill|picot/], w: 1.5 }
            ],
            done: [
              { label: 'Je maintiens la tête / il ne bouge pas', re: [/maintien|maintiens|tiens la tete|tete|ne bouge|immobil/], w: 1.5 },
              { label: 'Le casque est conservé', re: [/casque/], w: 1 },
              { label: 'La circulation est sécurisée / zone protégée', re: [/circulation|balis|signal|securis|protege|bloque/], w: 0.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes boulevard Saint-Germain, à l\'angle du carrefour, Paris 6e.',
              what: 'Un scooter a heurté une voiture. Le conducteur, un jeune homme d\'environ 19 ans, est au sol. Une seule victime.',
              state: 'Il est conscient, il répond, il respire bien, pas de saignement important. Il a mal à la nuque et des picotements à la main gauche.',
              done: 'Je maintiens sa tête et son casque à deux mains, il ne bouge plus. Le casque est conservé. La circulation est bloquée par des témoins. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: 'PSE1 en équipe PCPS — chef d\'agrès : Samir · équipière : Léa', crew: { you: { pose: 'stand' }, ca: { label: 'Samir (CA)' }, eq: { label: 'Léa' } },
        intro: 'Il est **18 h 05**. Vous êtes en dispositif de secours **boulevard Saint-Germain**. Un scooter heurte une voiture. Le conducteur, **Yanis**, est assis sur la chaussée, **casque intégral** sur la tête.',
        steps: [
          { id: 't1', cat: 'secu', regard: 1, kind: 'choice', w: 2, title: 'Premier regard : la scène',
            say: 'Les voitures redémarrent. Samir dit : « Qu\'est-ce que tu vois avant d\'y aller ? »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je décris : « Une victime, scooter couché, circulation active, essence au sol » et je propose de balayer la zone avec Léa avant d\'approcher.', 'Tu décris la scène au chef : il décide du balisage.'),
              A('b', 'J\'y vais, tu me rejoindras.', 'Tu te mets en danger sans que le chef sache ce que tu as vu.'),
              D('c', 'Je cours vers Yanis en traversant sans regarder.', 'Tu deviens la 2e victime.')],
            sceneAfter: { props: { cones: true, tape: true } }, ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Samir fait baliser. Tu es près de Yanis, qui essaie de se lever.',
            hint: 'Qu\'est-ce que tu fais, et qu\'annonces-tu au chef ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement important', obs: 'Aucun saignement important.', key: true, why: 'Toujours chercher l\'hémorragie.' },
              { id: 'tete', regard: 2, t: 'Je lui demande de ne pas bouger et je maintiens sa tête (avec le casque) à deux mains', obs: 'Il arrête de bouger.', key: true, why: 'Maintien de tête.' },
              { id: 'cons', regard: 2, t: 'Je lui parle : « Tu m\'entends ? »', obs: 'Il répond : « Yanis… ma nuque… » **Conscient.**', key: true, why: 'Conscience.' },
              { id: 'resp', regard: 2, t: 'Je regarde et j\'écoute sa respiration', obs: 'Il respire normalement, 18 par minute.', key: true, why: 'Respiration.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce au chef : « Victime consciente, respire, douleur nuque, maintien de tête en cours »', obs: 'Samir : « Compris. Je m\'occupe de l\'alerte. Léa prépare le matériel. Tu ne lâches pas la tête. »', key: true, why: 'Le chef décide de la suite.' },
              { id: 'casque', regard: 3, t: 'Je retire son casque', obs: 'À éviter : le casque est conservé s\'il respire.' }
            ],
            after: 'Samir appelle le 15.', ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'equipe', regard: 0, kind: 'choice', w: 2, title: 'Je ne lâche pas la tête',
            say: 'Léa installe le matériel. Samir te dit : « Tu maintiens la tête, je pose les questions. » Yanis demande : « Je peux boire un coup ? »',
            q: 'Que fais-tu ?',
            opts: [G('a', 'Je reformule « Je maintiens la tête, compris », je dis à Yanis de ne rien boire ni manger, et je continue à maintenir.', 'Rien à boire en cas de possible opération. Tu reformules et tu tiens ton rôle.'),
              A('b', 'Je lâche la tête une seconde pour l\'aider à boire.', 'Tu perds le maintien.'),
              D('c', 'Je retire le casque pour qu\'il boive.', 'Casque conservé, rien à boire.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 't4', cat: 'bilan', regard: 3, kind: 'multi', w: 2, title: 'Surveillance',
            say: 'Pendant le maintien, que surveilles-tu ?', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Sa conscience : je lui pose des questions régulièrement.', 'Un changement est à signaler immédiatement.'),
              G('b', 'Sa respiration : fréquence et facilité.', 'Une gêne respiratoire peut apparaître.'),
              G('c', 'Je préviens le chef de tout changement (il vomit, il ne répond plus).', 'Le chef décide.'),
              A('d', 'Je ne dis rien tant qu\'on ne me pose pas de question.', 'Tu dois signaler spontanément un changement.'),
              D('e', 'Je lui demande de bouger les jambes pour voir s\'il a mal.', 'Il ne doit pas bouger : il faut éviter tout mouvement.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 1, title: 'Relais du maintien',
            say: 'Léa se place pour prendre le relais.', q: 'Quand lâches-tu la tête ?',
            opts: [G('a', 'Seulement quand Léa a pris ma place et dit « je tiens ».', 'Le maintien ne s\'interrompt jamais.'),
              A('b', 'Dès que Léa est à côté de moi.', 'Il faut le « je tiens » : sinon la tête bouge.'),
              D('c', 'Quand mes bras fatiguent, sans prévenir.', 'Tu dois prévenir avant de lâcher.')],
            ref: 'Fiche « En équipe ».' },
          T.team({ id: 't6', w: 3, say: 'Les pompiers arrivent. Samir te dit : « Fais ton point. »',
            what: [/accident|scooter|moto|collision|choc|heurt|chute|voiture/],
            bilan: [
              { label: 'Conscient, respire normalement', re: [/conscient|repond/], w: 1 },
              { label: 'Respiration', re: [/respir/], w: 1 },
              { label: 'Douleur nuque + picotements : suspicion traumatisme du rachis', re: [/nuque|cervical|rachis|picot|fourmill|cou\b/], w: 1.5 }],
            done: [
              { label: 'Maintien de tête (casque conservé)', re: [/maintien|maintiens|tete/], w: 1.5 },
              { label: 'Casque conservé', re: [/casque/], w: 1 }],
            ask: [{ label: 'Immobilisation / évacuation médicalisée', re: [/immobilis|collier|matelas|medecin|smur|evacu/], w: 0.5 }],
            model: {
              vic: 'Chef, Yanis, 19 ans, accident de scooter à 18 h 05, boulevard Saint-Germain.',
              bilan: 'Conscient, respire normalement, pas de saignement important. Douleur à la nuque, picotements à la main gauche : suspicion de traumatisme du rachis.',
              done: 'Maintien de tête avec le casque depuis 18 h 06, relais par Léa, casque conservé.',
              ask: 'Je propose une immobilisation du rachis (collier et matelas à dépression) sur ton ordre et une évacuation médicalisée.'
            } })
        ]
      }
    }
  });
})();
