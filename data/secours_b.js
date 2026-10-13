// data/secours_b.js — cas 4 à 6 (hémorragie, inconscient qui respire, détresse respiratoire / asthme)
// Cas fictifs. Voir data/secours.js pour les limites.
'use strict';
(() => {
  const { T, O, cases } = App.SecData;
  const G = O.g, A = O.a, D = O.d;
  const TEAM = { you: { pose: 'stand' }, ca: { label: 'Samir (CA)' }, eq: { label: 'Léa' } };
  const TROLE = 'PSE1 en équipe PCPS — chef d\'agrès : Samir · équipière : Léa';

  // ═══ 4. Hémorragie externe — vitrine brisée, rue de Rivoli ═══════════════════
  cases.push({
    id: 'hemo_rivoli', title: 'La vitrine brisée', icon: '🩸', place: 'Rue de Rivoli, Paris 1er', level: 2,
    victim: 'Camille, 27 ans', hook: 'Elle a trébuché dans une vitrine. Son avant-bras saigne beaucoup, le sang coule entre ses doigts.',
    tags: ['Hémorragie', 'Compression', 'Garrot'],
    scene: {
      bg: 'rue', plaque: 'Rue de Rivoli', clock: '10:15', witnesses: 3,
      victim: { pose: 'sit', skin: '#f6d3b8', top: '#e8744f', hair: '#c4501f', hs: 'long', emo: 'pain' }, props: { blood: true, shards: true, wound: true }
    },
    modes: {
      solo: {
        role: 'PSE1, seule/seul, en civil, de passage', crew: { you: { pose: 'stand' } },
        intro: 'Il est **10 h 15**. Tu marches **rue de Rivoli**. Une jeune femme, **Camille**, vient de trébucher contre une vitrine qui a éclaté. Elle est assise par terre, serre son avant-bras gauche, le sang coule. Des éclats de verre sont par terre.',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 2, title: 'Premier regard : la scène',
            say: 'Le sol est jonché d\'éclats de verre. Camille a du sang sur la main et sur le trottoir. Tu as un paquet de mouchoirs, pas de gants.',
            q: 'Que fais-tu avant de la toucher ?',
            opts: [G('a', 'Je contourne les éclats, je demande qu\'on écarte les curieux, je me présente et je protège mes mains (gants s\'il y en a, sinon sac plastique ou tissu épais).', 'Le sang est un risque de contamination : tu te protèges autant que possible, sans retarder l\'action. Tu regardes aussi où tu marches.'),
              A('b', 'Je me précipite sans regarder et sans protection : il y a urgence.', 'Le sang abondant impose une protection. Un éclat peut aussi te blesser.'),
              D('c', 'Je la fais se lever pour l\'emmener à l\'intérieur du magasin.', 'Se lever avec une hémorragie : risque de malaise. Compression d\'abord, à l\'endroit où elle est.')],
            ref: 'Fiche « 4 regards » — 1er regard.' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es accroupi près d\'elle, tes mains sont protégées.',
            hint: 'Qu\'est-ce que tu cherches en premier ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche tout de suite un saignement abondant', obs: 'Le sang rouge vif jaillit de l\'avant-bras gauche, ses vêtements sont imbibés : **hémorragie externe grave**.', key: true, why: 'L\'hémorragie est la première menace à chercher.' },
              { id: 'cons', regard: 2, t: 'Je lui parle : « Vous m\'entendez ? Comment vous appelez-vous ? »', obs: 'Elle répond, mais elle est très pâle et anxieuse. **Consciente.**', key: true, why: 'Conscience.' },
              { id: 'resp', regard: 2, t: 'Je regarde et j\'écoute sa respiration', obs: 'Elle respire vite : 24 par minute, régulière.', key: true, why: 'Respiration.' },
              { id: 'peau', regard: 3, t: 'Je regarde sa peau et son visage, je teste la recoloration', obs: 'Pâleur nette, sueurs froides, lèvres décolorées, temps de recoloration allongé (> 2 s) : **signes de détresse circulatoire**, perte de sang importante.' },
              { id: 'pouls', regard: 3, t: 'Je prends son pouls pendant 30 secondes avant d\'agir', obs: 'Non : tu perds du temps. Le saignement doit être arrêté en premier.' }
            ],
            after: '**Hémorragie grave de l\'avant-bras gauche, consciente.** Premier geste : arrêter le saignement.', ref: 'Fiche « Gestes clés » — hémorragie.' },
          { id: 's3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'Mon premier geste',
            say: 'Le sang continue de couler.', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'appuie immédiatement et fort avec ma main protégée (avec un tissu propre) directement sur la plaie.', 'La compression directe arrête la plupart des hémorragies : c\'est le premier geste.'),
              A('b', 'Je cherche d\'abord un garrot ou un pansement dans ses affaires.', 'Chaque seconde compte : on comprime avec la main tout de suite, on prépare le reste ensuite.'),
              D('c', 'Je lave la plaie à l\'eau avant tout.', 'Tu perds du temps pendant qu\'elle saigne : d\'abord arrêter l\'hémorragie.')],
            sceneAfter: { props: { wound: false } }, ref: 'Fiche « Gestes clés » — hémorragie.' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'multi', w: 3, title: 'Je comprime, et en même temps…',
            say: 'Tu maintiens la compression. Camille a la tête qui tourne.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je demande à un témoin d\'appeler le 15 ou le 18 en haut-parleur, et de revenir me dire.', 'Tes mains sont prises : tu délègues.'),
              G('b', 'Je la fais allonger (en gardant la compression) car elle est pâle et a des vertiges.', 'Allongée, elle risque moins le malaise.'),
              G('c', 'Je la couvre pour qu\'elle ne se refroidisse pas.', 'Le froid aggrave l\'état d\'une victime qui a perdu du sang.'),
              A('d', 'Je desserre régulièrement pour vérifier si ça saigne encore.', 'Tu relances l\'hémorragie : on garde la compression.'),
              D('e', 'Je lui donne un verre d\'eau sucrée pour la remettre.', 'Rien à boire : elle peut avoir besoin d\'une opération.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 's5', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Le saignement ne s\'arrête pas : l\'ordre des gestes',
            say: 'Malgré ta compression bien placée, le sang traverse le tissu et continue de couler en jet.', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je garde la compression directe, bien placée sur la plaie, et je vérifie si elle est efficace', why: 'Efficace : pansement compressif. Inefficace ou impossible : garrot (Mémo Urgence).' },
              { t: 'Elle est inefficace : je pose un garrot à 5–7 cm au-dessus de la plaie, sur le bras (zone garrotable)', why: 'Le garrot se pose en zone garrotable uniquement (les membres).' },
              { t: 'Je serre jusqu\'à l\'arrêt du saignement et je note l\'heure de pose', why: 'L\'heure sert aux médecins : le garrot ne doit pas rester trop longtemps.' },
              { t: 'Je ne desserre jamais le garrot et je préviens les secours que j\'en ai posé un', why: 'Seul un médecin le retire.' },
              { t: 'Je la laisse allongée, couverte, et je surveille : pâleur, conscience, respiration', why: 'Elle présente des signes de détresse circulatoire : allongée, protégée, avis médical.' }],
            sceneAfter: { props: { garrot: true, garrotTime: '10h22' } }, after: 'Le saignement s\'arrête. Tu as noté **10 h 22** sur le garrot.', ref: 'Mémo Urgence : compression directe ; inefficace → garrot. Fiche « Gestes clés ».' },
          T.solo({ id: 's6', w: 3, say: 'Le régulateur du 15 te demande de faire le point.',
            addr: [/rivoli/, /\brue\b/, /paris 1|1er|premier|louvre/], what: [/coupure|blessure|plaie|saign|hemorrag|verre|vitrine|coupe/],
            state: [
              { label: 'Saignement abondant à l\'avant-bras', re: [/saign|hemorrag|sang/], w: 1.5 },
              { label: 'Elle est consciente', re: [/conscient|repond|parle/], w: 1 },
              { label: 'Pâleur / vertiges / malaise', re: [/pale|pâle|vertige|malaise|tourne/], w: 0.5 }
            ],
            done: [
              { label: 'Compression directe / pansement compressif', re: [/compress|appui|appuie|pression|pansement|bandage/], w: 1.5 },
              { label: 'Garrot posé, avec l\'heure', re: [/garrot/], w: 1.5 },
              { label: 'L\'heure de pose est donnée', re: [/\b\d{1,2} ?h ?\d{0,2}\b|\bheure\b|\bminutes?\b/], w: 0.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes rue de Rivoli, Paris 1er, devant une vitrine brisée.',
              what: 'Une jeune femme d\'environ 27 ans s\'est coupée en tombant contre une vitrine. Une seule victime.',
              state: 'Elle est consciente, très pâle, elle a des vertiges. Hémorragie grave de l\'avant-bras gauche, du sang qui coule en jet.',
              done: 'J\'ai fait une compression directe, qui était inefficace, puis j\'ai posé un garrot à 10 h 22. Elle est allongée et couverte. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **10 h 15**. Vous êtes en dispositif de secours **rue de Rivoli**. Une vitrine éclate : une jeune femme, **Camille**, est assise par terre, le bras gauche en sang. Vous avez gants, pansements compressifs et un garrot.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 2, title: 'Je me protège et j\'annonce',
            say: 'Le sol est jonché d\'éclats. Samir dit : « Équipement ! »', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'enfile mes gants, je préviens « Hémorragie probable, éclats de verre au sol », et j\'approche en évitant le verre.', 'Protection contre le sang + information du chef.'),
              A('b', 'J\'y vais sans gants, on n\'a pas le temps.', 'Le sang est un risque : les gants sont dans ton sac.'),
              D('c', 'Je fais lever la victime pour l\'amener au poste.', 'Elle risque le malaise : on comprime d\'abord.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es près de Camille, gants enfilés.', hint: 'Qu\'est-ce que tu cherches, qu\'annonces-tu au chef ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche tout de suite un saignement abondant', obs: 'Sang rouge vif qui coule en jet de l\'avant-bras gauche : **hémorragie externe grave**.', key: true, why: 'Hémorragie en premier.' },
              { id: 'cons', regard: 2, t: 'Je lui parle', obs: 'Elle répond, très pâle. **Consciente.**', key: true, why: 'Conscience.' },
              { id: 'resp', regard: 2, t: 'Je regarde et j\'écoute sa respiration', obs: '24 par minute, régulière.', key: true, why: 'Respiration.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce au chef : « Hémorragie du bras gauche, consciente, pâle »', obs: 'Samir : « Compris. Compression directe tout de suite. Léa prépare un pansement compressif et le garrot. Je fais l\'alerte. »', key: true, why: 'Le chef décide.' },
              { id: 'pouls', regard: 3, t: 'Je prends son pouls avant d\'agir', obs: 'Non : on arrête d\'abord l\'hémorragie.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'Je comprime',
            say: 'Samir : « Compression directe. »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je dis « Compression directe, compris » et j\'appuie fort avec ma main gantée sur la plaie, sans lâcher.', 'Tu reformules et tu exécutes.'),
              A('b', 'Je commence par désinfecter la plaie.', 'Hors sujet pour l\'instant.'),
              D('c', 'J\'attends que Léa ait posé le garrot avant de comprimer.', 'Ce n\'est pas ce qui t\'est demandé : la compression ne doit jamais attendre.')],
            sceneAfter: { props: { wound: false } }, ref: 'Fiche « Gestes clés ».' },
          { id: 't4', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Le saignement continue : l\'ordre',
            say: 'Le sang traverse le tissu malgré ta compression.', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je garde la compression directe et je préviens le chef : « Ça saigne toujours, compression inefficace »', why: 'Tu informes avant de changer de technique.' },
              { t: 'Le chef ordonne un garrot : Léa le pose à 5–7 cm au-dessus de la plaie, sur le bras', why: 'Inefficace → garrot, en zone garrotable.' },
              { t: 'Léa serre jusqu\'à l\'arrêt du saignement et annonce l\'heure de pose', why: 'L\'heure est notée.' },
              { t: 'Personne ne desserre le garrot, on le signale aux médecins', why: 'Seul un médecin le retire.' },
              { t: 'On allonge Camille et on la couvre (détresse circulatoire possible)', why: 'Allongée et protégée.' }],
            sceneAfter: { props: { garrot: true, garrotTime: '10h22' } }, ref: 'Mémo Urgence : compression inefficace → garrot.' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 1, title: 'L\'heure du garrot',
            say: 'Léa annonce : « Garrot posé à 10 h 22. »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je répète « 10 h 22 », je l\'écris sur le garrot (ou sur la peau/le front) et je la transmettrai.', 'Une heure notée et répétée évite les erreurs.'),
              A('b', 'Je retiens l\'heure de tête.', 'Écris-la, on oublie vite dans le stress.'),
              D('c', 'Je desserre le garrot au bout de quelques minutes pour laisser le sang circuler.', 'Seul un médecin décide.')],
            ref: 'Fiche « Gestes clés ».' },
          T.team({ id: 't6', w: 3, say: 'Le SMUR arrive. Samir te dit : « Fais ton point. »',
            what: [/coupure|blessure|plaie|saign|hemorrag|verre|vitrine|coupe/],
            bilan: [
              { label: 'Hémorragie externe grave de l\'avant-bras gauche', re: [/hemorrag|saign|sang/], w: 1.5 },
              { label: 'Consciente, pâle', re: [/conscient|repond|pale|pâle/], w: 1 }],
            done: [
              { label: 'Compression puis pansement compressif', re: [/compress|appui|pansement/], w: 1.5 },
              { label: 'Garrot posé avec l\'heure', re: [/garrot/], w: 1.5 },
              { label: 'L\'heure de pose (10 h 22)', re: [/\b\d{1,2} ?h ?\d{0,2}\b|\bheure\b/], w: 1 }],
            ask: [{ label: 'Médicalisation / évacuation', re: [/medecin|smur|evacu|hopital/], w: 0.5 }],
            model: {
              vic: 'Chef, femme de 27 ans, coupure de l\'avant-bras gauche contre une vitrine à 10 h 15.',
              bilan: 'Hémorragie externe grave, consciente, pâle, respire 24/min.',
              done: 'Compression directe à 10 h 17 (inefficace), garrot posé à 10 h 22 et noté dessus. Jamais desserré. Allongée, couverte.',
              ask: 'Je propose une évacuation médicalisée.'
            } })
        ]
      }
    }
  });

  // ═══ 5. Inconsciente qui respire — station de métro ═══════════════════════════
  cases.push({
    id: 'pls_metro', title: 'Malaise dans le métro', icon: '🚇', place: 'Entrée de métro, rue de Belleville, Paris 20e', level: 1,
    victim: 'Mme Traoré, 66 ans', hook: 'Elle glisse le long du mur à la sortie du métro et ne répond plus. Un attroupement se forme.',
    tags: ['Perte de connaissance', 'PLS', 'Surveillance'],
    scene: {
      bg: 'metro', plaque: 'Rue de Belleville', clock: '08:50', witnesses: 2,
      victim: { pose: 'lie', skin: '#6f4629', top: '#d9a31f', skirt: true, hair: '#1c1c1c', hs: 'curly', emo: 'sleep' }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, usager du métro', crew: { you: { pose: 'stand' } },
        intro: 'Il est **8 h 50**, c\'est l\'heure de pointe. À la sortie du métro, **rue de Belleville**, une dame de 66 ans, **Mme Traoré**, s\'est affaissée contre le mur. Elle est maintenant allongée sur le trottoir, les yeux fermés. Les gens passent en la contournant.',
        steps: [
          { id: 's1', cat: 'secu', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : la scène',
            say: 'Beaucoup de monde sort du métro. Mme Traoré est près de l\'escalier.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je regarde les dangers (escalier, foule), je demande qu\'on dégage un cercle autour d\'elle, je m\'accroupis à côté d\'elle.', 'Tu protèges la zone et tu te rends visible.'),
              A('b', 'Je m\'accroupis directement sans regarder autour.', 'Tu risques de te faire bousculer par la foule.'),
              D('c', 'Je la fais relever par deux passants pour la déplacer.', 'Inutile et risqué : elle est inconsciente.')],
            ref: 'Fiche « 4 regards ».' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es à genoux à côté d\'elle.', hint: 'Que fais-tu, dans quel ordre ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement important', obs: 'Aucun saignement visible.', key: true, why: 'Toujours chercher l\'hémorragie.' },
              { id: 'cons', regard: 2, t: 'Je l\'appelle fort, je secoue doucement ses épaules, je lui demande de serrer ma main', obs: 'Aucune réponse. Elle est **inconsciente**.', key: true, why: 'Test de réponse.' },
              { id: 'ouv', regard: 2, t: 'Je libère les voies aériennes : tête en arrière, menton levé', obs: 'La bouche est vide, la langue ne gêne pas.', key: true, why: 'Voies aériennes.' },
              { id: 'resp', regard: 2, t: 'Je regarde, j\'écoute, je sens la respiration — 10 secondes maximum', obs: 'La poitrine se soulève, régulière, environ 16 par minute. **Elle respire.**', key: true, why: 'Elle respire : PLS.' },
              { id: 'temoin', regard: 3, t: 'Je demande aux témoins ce qu\'ils ont vu', obs: 'Une passante : « Elle a dit "j\'ai la tête qui tourne", s\'est appuyée au mur et a glissé. Elle ne s\'est pas cogné la tête. »' },
              { id: 'reveil', regard: 3, t: 'Je lui tapote les joues pour la réveiller', obs: 'À éviter : ça ne sert à rien et ne remplace pas la PLS.' }
            ],
            after: '**Inconsciente, elle respire.** Chute lente, sans choc à la tête selon les témoins.', ref: 'Fiche « Gestes clés » — inconscient qui respire.' },
          { id: 's3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'Inconsciente qui respire',
            say: 'Elle respire, mais elle ne répond à rien.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je la mets en position latérale de sécurité (PLS) et je fais alerter le 15.', 'En PLS, elle ne s\'étouffe pas avec sa langue ou un vomissement.'),
              A('b', 'Je la laisse sur le dos en surveillant sa respiration.', 'Sur le dos, risque d\'obstruction par la langue.'),
              D('c', 'Je l\'assieds contre le mur.', 'Inconsciente, elle risque de basculer et de s\'obstruer.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 's4', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'La PLS, dans l\'ordre',
            say: 'Tu es à genoux à côté d\'elle.', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je retire ses lunettes et je m\'assure qu\'elle est sur le dos, jambes allongées', why: 'On dégage les objets gênants.' },
              { t: 'Je place son bras le plus proche à angle droit, paume vers le haut', why: 'Il servira d\'appui.' },
              { t: 'Je place le dos de son autre main contre son oreille et je la maintiens ; je fléchis la jambe opposée', why: 'Je tiens sa main contre sa joue.' },
              { t: 'Je la tire vers moi par le genou fléchi pour la faire pivoter sur le côté', why: 'On tourne en un bloc.' },
              { t: 'Je stabilise la jambe fléchie, j\'ouvre sa bouche (tête en arrière) et je vérifie à nouveau la respiration', why: 'La bouche vers le sol permet l\'écoulement des liquides.' }],
            sceneAfter: { victim: { pose: 'side' }, props: { blanket: true } }, ref: 'Fiche « Gestes clés ».' },
          { id: 's5', cat: 'gestes', regard: 0, kind: 'multi', w: 2, title: 'En attendant les secours',
            say: 'Elle est en PLS. Un passant a appelé le 15 : ils arrivent dans quelques minutes.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je surveille sa respiration régulièrement (elle doit continuer à respirer).', 'Une respiration qui s\'arrête change tout.'),
              G('b', 'Je la couvre (vêtement, couverture).', 'Elle peut avoir froid.'),
              G('c', 'Si elle arrête de respirer : je la remets sur le dos, je commence la RCP et je préviens le 15.', 'Tu dois être prêt à changer de geste.'),
              A('d', 'Je lui donne à boire pour qu\'elle se réveille.', 'Inconsciente : risque de fausse route.'),
              D('e', 'Je la fais s\'asseoir et marcher dès qu\'elle ouvre les yeux.', 'Elle peut retomber ou se blesser : on attend l\'avis médical.')],
            ref: 'Fiche « Gestes clés ».' },
          T.solo({ id: 's6', w: 3, say: 'Le régulateur du 15 te rappelle.',
            addr: [/belleville/, /metro/, /\brue\b/, /paris 20|20 ?e|vingtieme/], what: [/malaise|perdu connaissance|perte de connaissance|inconscient|chute|glisse|affaiss|tombe/],
            state: [
              { label: 'Elle est inconsciente (ne répond pas)', re: [/inconscient|ne repond|perdu connaissance|perte de connaissance/], w: 1.5 },
              { label: 'Elle respire normalement', re: [/respir/], w: 1.5 }
            ],
            done: [
              { label: 'Je l\'ai mise en PLS', re: [/pls|position laterale|laterale de securite|sur le cote/], w: 1.5 },
              { label: 'Je la couvre / je la surveille', re: [/couver|couvre|surveill/], w: 0.5 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes à la sortie du métro, rue de Belleville, Paris 20e.',
              what: 'Une dame d\'environ 66 ans a eu un malaise, elle a glissé le long du mur sans se cogner la tête.',
              state: 'Elle est inconsciente, elle ne répond pas, mais elle respire normalement. Pas de saignement.',
              done: 'Je l\'ai mise en position latérale de sécurité, je la surveille et elle est couverte. Je reste en ligne.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **8 h 50**. Vous êtes en dispositif de secours devant une **sortie de métro, rue de Belleville**. Une dame de 66 ans, **Mme Traoré**, glisse le long du mur puis s\'allonge sur le trottoir. Elle ne répond plus.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Je préviens et je sécurise',
            say: 'Beaucoup de monde sort du métro.', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'annonce « Chef, personne au sol à la sortie du métro », je demande qu\'on dégage un cercle et j\'approche avec l\'équipe.', 'Tu informes et tu sécurises.'),
              A('b', 'J\'approche seul sans rien dire.', 'Ton chef doit savoir où tu es.'),
              D('c', 'Je demande à deux passants de la relever.', 'Elle est inconsciente.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es à genoux auprès d\'elle.', hint: 'Que fais-tu et qu\'annonces-tu au chef ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement', obs: 'Aucun.', key: true, why: 'Hémorragie.' },
              { id: 'cons', regard: 2, t: 'Je l\'appelle, je secoue doucement, je demande de serrer ma main', obs: 'Aucune réponse : **inconsciente**.', key: true, why: 'Conscience.' },
              { id: 'resp', regard: 2, t: 'Je libère les voies aériennes et je regarde/écoute/sens la respiration (10 s max)', obs: '**Elle respire** (16/min).', key: true, why: 'Elle respire.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce : « Inconsciente, elle respire »', obs: 'Samir : « Compris. PLS. Léa, couverture, j\'alerte le 15. »', key: true, why: 'Annonce au chef.' },
              { id: 'reveil', regard: 3, t: 'Je lui tapote les joues pour la réveiller', obs: 'Inutile.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'La PLS en équipe',
            say: 'Samir : « PLS, tu la tournes, Léa tient la tête si besoin. »', q: 'Remets les gestes dans l\'ordre.',
            items: [
              { t: 'Je retire ses lunettes, je place son bras proche à angle droit', why: 'Préparation.' },
              { t: 'Je place le dos de son autre main contre son oreille et je fléchis la jambe opposée', why: 'Pour tourner.' },
              { t: 'Je la tire vers moi par le genou pour la faire pivoter', why: 'Rotation.' },
              { t: 'Je stabilise la jambe, j\'ouvre la bouche et je vérifie la respiration', why: 'Fin de PLS.' },
              { t: 'J\'annonce « PLS faite, elle respire » au chef', why: 'Tu rends compte.' }],
            sceneAfter: { victim: { pose: 'side' }, props: { blanket: true } }, ref: 'Fiche « Gestes clés ».' },
          { id: 't4', cat: 'bilan', regard: 3, kind: 'multi', w: 2, title: 'La surveillance',
            say: 'Samir te laisse la surveillance. Il appelle la régulation.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je surveille la respiration (fréquence, régularité) toutes les quelques minutes.', 'Surveiller, c\'est refaire le bilan.'),
              G('b', 'Je regarde si elle reprend conscience (yeux, réponse, mouvements) et je préviens le chef.', 'Tu rends compte de tout changement.'),
              G('c', 'Je cherche si elle a un bracelet, une carte médicale, des médicaments (avec un témoin).', 'Ça aide les médecins.'),
              G('f', 'Je prends (ou je prépare) tension, température et glycémie pour le contact urgent du chef.', 'Mémo Urgence : pour un inconscient sans traumatisme, on fait ces mesures avant le contact urgent, puis on surveille (pouls, FR).'),
              A('d', 'Je la laisse seule pour aller chercher un café.', 'Jamais de surveillance interrompue.'),
              D('e', 'Je lui donne du sucre dans la bouche.', 'Inconsciente : fausse route.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 't5', cat: 'equipe', regard: 0, kind: 'choice', w: 2, title: 'Elle se réveille',
            say: 'Elle ouvre les yeux, confuse : « Où je suis ? »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je reste auprès d\'elle, je la rassure, je préviens Samir, et je la laisse allongée jusqu\'à l\'avis du chef / de la régulation.', 'Elle peut retomber ; c\'est le chef qui décide.'),
              A('b', 'Je l\'aide à s\'asseoir immédiatement.', 'Trop tôt.'),
              D('c', 'Je lui dis de se lever et de marcher pour voir.', 'Risque de chute.')],
            ref: 'Fiche « En équipe ».' },
          T.team({ id: 't6', w: 3, say: 'Les pompiers arrivent. Samir te demande de faire ton point.',
            what: [/malaise|perdu connaissance|perte de connaissance|inconscient|chute|glisse|affaiss/],
            bilan: [
              { label: 'Perte de connaissance', re: [/inconscient|perdu connaissance|perte de connaissance|ne repond/], w: 1.5 },
              { label: 'Elle respirait normalement', re: [/respir/], w: 1.5 }],
            done: [
              { label: 'PLS', re: [/pls|laterale|cote/], w: 1.5 },
              { label: 'Elle a repris connaissance (confuse)', re: [/reveill|repris connaissance|ouvre les yeux|conscient|confus/], w: 1 }],
            ask: [{ label: 'Avis médical / évacuation', re: [/medecin|smur|evacu|hopital|regulation/], w: 0.5 }],
            model: {
              vic: 'Chef, femme de 66 ans, malaise à la sortie du métro vers 8 h 50, chute sans traumatisme crânien selon les témoins.',
              bilan: 'Inconsciente, respirait normalement, pas de saignement.',
              done: 'PLS à 8 h 53, couverte, surveillance de la respiration. Elle a repris connaissance, confuse.',
              ask: 'Je propose un avis médical et une évacuation.'
            } })
        ]
      }
    }
  });

  // ═══ 6. Détresse respiratoire / asthme — Buttes-Chaumont ═════════════════════
  cases.push({
    id: 'asthme_buttes', title: 'La crise d\'asthme', icon: '🌬️', place: 'Parc des Buttes-Chaumont, Paris 19e', level: 2,
    victim: 'Lucas, 16 ans', hook: 'Il joue au foot avec ses amis. Soudain il s\'arrête, penché en avant, les mains sur les genoux, il siffle en respirant.',
    tags: ['Détresse respiratoire', 'Asthme', 'Traitement personnel'],
    scene: {
      bg: 'parc', plaque: 'Parc des Buttes-Chaumont', clock: '16:30', witnesses: 2,
      victim: { pose: 'tripod', skin: '#ebb996', top: '#2b5b9c', hair: '#111111', emo: 'pain', sweat: true }
    },
    modes: {
      solo: {
        role: 'PSE1, seul, en civil, promeneur', crew: { you: { pose: 'stand' } },
        intro: 'Il est **16 h 30**. Tu te promènes aux **Buttes-Chaumont**. Un adolescent, **Lucas**, s\'est arrêté en plein match, assis sur un banc, penché en avant. Ses amis crient : « Il n\'arrive plus à respirer ! »',
        steps: [
          { id: 's1', cat: 'bilan', regard: 1, kind: 'choice', w: 1, title: 'Premier regard : la scène',
            say: 'Le banc est à l\'écart du terrain. Un ami est avec lui. Aucun danger apparent.', q: 'Que fais-tu en arrivant ?',
            opts: [G('a', 'Je m\'approche calmement, je me présente (« Je suis secouriste ») et je le regarde respirer.', 'Rassurer est déjà un soin : l\'angoisse aggrave la crise.'),
              A('b', 'Je lui dis de s\'allonger tout de suite.', 'Allongé, il respirera plus mal. Il doit rester assis.'),
              D('c', 'Je lui fais boire de l\'eau pour qu\'il se calme.', 'Risque de fausse route quand on respire vite.')],
            ref: 'Fiche « 4 regards ».' },
          { id: 's2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu t\'accroupis devant lui.', hint: 'Qu\'est-ce que tu observes, qu\'est-ce que tu lui demandes ?',
            checks: [
              { id: 'hemo', regard: 2, t: 'Je cherche un saignement', obs: 'Aucun.', key: true, why: 'Toujours.' },
              { id: 'cons', regard: 2, t: 'Je lui parle : « Lucas, tu m\'entends ? »', obs: 'Il répond, mais **par phrases de 3-4 mots** entre deux respirations.', key: true, why: 'Parler par mots courts = détresse.' },
              { id: 'resp', regard: 2, t: 'Je regarde sa respiration (rythme, bruit, effort)', obs: 'Il respire vite, **sifflements** à l\'expiration, creux au-dessus du sternum, sueurs. Environ **35 par minute**. **Détresse respiratoire.**', key: true, why: 'Fréquence élevée, sifflements, tirage.' },
              { id: 'asthme', regard: 3, t: 'Je lui demande : « Tu es asthmatique ? Tu as ton traitement ? Tu l\'as pris ? »', obs: 'Il fait « oui » : asthmatique, dernière crise il y a 3 mois, jamais passé en réanimation. Son **spray bleu** est dans son sac, **1 bouffée il y a 10 minutes, sans effet**.', key: true, why: 'Antécédent + traitement + délai.' },
              { id: 'peau', regard: 3, t: 'Je regarde ses lèvres et sa peau', obs: 'Lèvres un peu bleutées, sueurs.' },
              { id: 'pouls', regard: 3, t: 'Je prends son pouls', obs: 'Environ 110 par minute, rapide.' }
            ],
            after: '**Détresse respiratoire chez un asthmatique, le spray n\'a pas suffi.**', ref: 'Fiche « Gestes clés » — détresse respiratoire.' },
          { id: 's3', cat: 'gestes', regard: 0, kind: 'choice', w: 3, title: 'La position',
            say: 'Il est assis, penché en avant, les mains sur les genoux.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je le laisse (ou l\'aide à rester) assis ou demi-assis, penché en avant, je desserre ses vêtements et je le rassure.', 'La position assise facilite la respiration.'),
              A('b', 'Je l\'allonge pour qu\'il se détende.', 'Allongé, il respire moins bien.'),
              D('c', 'Je lui fais respirer dans un sac en papier.', 'Danger : méthode dépassée, il manque d\'air.')],
            ref: 'Fiche « Gestes clés ».' },
          { id: 's4', cat: 'alerte', regard: 0, kind: 'choice', w: 3, title: 'L\'alerte et son traitement',
            say: 'Son ami tient son téléphone. Lucas montre son sac : le spray est dedans.', q: 'Que fais-tu ?',
            opts: [G('a', 'Je fais appeler le 15 en haut-parleur, je décris la détresse et je demande au médecin régulateur si je peux l\'aider à reprendre son spray.', 'Tu suis l\'avis médical pour son traitement personnel.'),
              A('b', 'Je lui fais prendre tout de suite plusieurs bouffées de spray sans rien demander.', 'Pas de dose décidée seul : la régulation dit quoi faire.'),
              D('c', 'Je lui donne le spray de son ami « pour essayer ».', 'Médicament d\'une autre personne : jamais.')],
            ref: 'Fiche « Alerter » — j\'appelle, je suis les consignes.' },
          { id: 's5', cat: 'bilan', regard: 3, kind: 'multi', w: 2, title: 'En attendant les secours',
            say: 'Le régulateur t\'a donné ses consignes.', q: 'Quelles actions sont justes ?',
            opts: [G('a', 'Je compte sa fréquence respiratoire sur 1 minute et je regarde s\'il parle toujours en mots courts.', 'Les chiffres aident la régulation.'),
              G('b', 'Je le rassure, je lui demande de respirer lentement.', 'Le calme aide.'),
              G('c', 'Je suis les consignes du régulateur pour le spray (ordre, dose, intervalle).', 'C\'est lui qui décide.'),
              A('d', 'Je le laisse seul pour chercher un adulte.', 'Reste auprès de lui.'),
              D('e', 'Je lui demande de courir pour qu\'il s\'aère.', 'L\'effort aggrave la crise.')],
            ref: 'Fiche « Valeurs repères » — FR 12 à 20 / min.' },
          T.solo({ id: 's6', w: 3, say: 'Le régulateur du 15 te demande de faire le point.',
            addr: [/buttes|chaumont/, /parc/, /paris 19|19 ?e|dix neuf/], what: [/asthme|crise|detresse respiratoire|difficulte a respirer|essouffl|manque d air|ne respire plus|respire mal/],
            state: [
              { label: 'Il respire vite, siffle, parle par mots courts', re: [/vite|siffl|essouffl|mots courts|phrases courtes|tirage|35/], w: 1.5 },
              { label: 'Il est conscient', re: [/conscient|repond|parle/], w: 0.5 },
              { label: 'Il est asthmatique, spray déjà pris (sans effet)', re: [/asthmat|spray|ventoline|bouffee|traitement/], w: 1.5 }
            ],
            done: [
              { label: 'Il est assis / demi-assis', re: [/assis|demi assis|penche/], w: 1 },
              { label: 'Je suis les consignes pour le spray', re: [/spray|ventoline|bouffee|consigne|traitement/], w: 1 }
            ],
            model: {
              who: 'Je suis secouriste, mon numéro est le 06 12 34 56 78. Nous sommes aux Buttes-Chaumont, Paris 19e, sur un banc près du terrain de foot.',
              what: 'Un adolescent d\'environ 16 ans fait une crise d\'asthme.',
              state: 'Il est conscient mais respire très vite, environ 35 par minute, il siffle et ne dit que des mots courts. Il est asthmatique, il a pris une bouffée de spray il y a 10 minutes, sans effet.',
              done: 'Je le garde assis, penché en avant, je le rassure. Je reste en ligne pour vos consignes sur son spray.'
            } })
        ]
      },
      team: {
        role: TROLE, crew: TEAM,
        intro: 'Il est **16 h 30**. Vous êtes en dispositif de secours aux **Buttes-Chaumont**. Des adolescents appellent : l\'un d\'eux, **Lucas**, 16 ans, n\'arrive plus à respirer. Vous avez un oxymètre, un tensiomètre, de l\'**oxygène**.',
        steps: [
          { id: 't1', cat: 'equipe', regard: 1, kind: 'choice', w: 1, title: 'Je préviens et j\'approche',
            say: 'Samir : « On y va. »', q: 'Que fais-tu ?',
            opts: [G('a', 'J\'annonce « Chef, personne qui respire mal, sur le banc », j\'approche calmement avec l\'équipe et je me présente.', 'Tu informes et tu rassures.'),
              A('b', 'Je cours devant, sans me présenter.', 'Il s\'angoisse, la crise s\'aggrave.'),
              D('c', 'Je lui demande de s\'allonger.', 'Il doit rester assis.')],
            ref: 'Fiche « En équipe ».' },
          { id: 't2', cat: 'bilan', regard: 2, kind: 'bilan', w: 3, title: 'Je cherche la menace vitale',
            scene: { crew: { you: { pose: 'kneel' } } }, say: 'Tu es devant Lucas.', hint: 'Qu\'est-ce que tu regardes, qu\'annonces-tu ?',
            checks: [
              { id: 'cons', regard: 2, t: 'Je lui parle', obs: 'Il répond par **mots courts**.', key: true, why: 'Parole.' },
              { id: 'resp', regard: 2, t: 'Je regarde sa respiration (rythme, bruit, effort)', obs: 'Rapide, sifflante, tirage, sueurs. **Détresse respiratoire.**', key: true, why: 'Détresse.' },
              { id: 'asthme', regard: 3, t: 'Je demande : « Asthmatique ? Ton traitement ? Tu l\'as pris ? »', obs: 'Asthmatique ; spray bleu pris une fois il y a 10 min, sans effet.', key: true, why: 'Antécédent + traitement.' },
              { id: 'annonce', regard: 2, t: 'J\'annonce : « Détresse respiratoire, asthmatique, spray sans effet »', obs: 'Samir : « Compris. Léa, SpO₂. Toi, la fréquence respiratoire. Je prépare l\'O₂. »', key: true, why: 'Chef informé.' },
              { id: 'allonger', regard: 3, t: 'Je le fais allonger', obs: 'Non : il doit rester assis.' }
            ], ref: 'Fiche « En équipe ».' },
          { id: 't3', cat: 'bilan', regard: 3, kind: 'choice', w: 2, title: 'Les mesures',
            say: 'Léa pose l\'oxymètre : **91 %**. Samir te demande la fréquence respiratoire.', q: 'Que réponds-tu ?',
            opts: [G('a', 'Je compte pendant 1 minute et j\'annonce « 36 par minute, 91 % de SpO₂ ».', 'Les chiffres aident le chef et la régulation.'),
              A('b', 'J\'annonce « Il respire vite » sans chiffres.', 'Trop vague : donne les chiffres.'),
              D('c', 'Je compte pendant 5 secondes et j\'annonce « 7 par minute ».', 'Une mesure trop courte est fausse.')],
            ref: 'Fiche « Valeurs repères ».' },
          { id: 't4', cat: 'gestes', regard: 0, kind: 'choice', w: 2, title: 'L\'oxygène',
            say: 'Samir dit : « Oxygène haute concentration, 15 litres/minute. Prépare. »', q: 'Que fais-tu ?',
            opts: [G('a', 'Je dis « O₂ 15 L/min, compris », je règle le débit demandé et je mets le masque seulement quand Samir le confirme.', 'Tu exécutes l\'ordre, tu reformules.'),
              A('b', 'Je règle à 2 L/min, c\'est plus prudent.', 'Pas de débit choisi seul : ordre du chef.'),
              D('c', 'Je pose le masque sans prévenir le chef.', 'Le chef doit être informé.')],
            ref: 'Fiche « Valeurs repères » — O₂ selon ordre.' },
          { id: 't5', cat: 'gestes', regard: 0, kind: 'order', w: 3, title: 'Son spray, selon l\'avis du régulateur',
            say: 'Le régulateur donne son accord. Lucas sort son spray.', q: 'Remets les étapes dans l\'ordre.',
            items: [
              { t: 'Je vérifie que c\'est bien SON spray (nom, date)', why: 'Médicament personnel uniquement.' },
              { t: 'Je lui fais agiter le spray', why: 'On mélange.' },
              { t: 'Je lui demande d\'expirer à fond', why: 'On vide les poumons.' },
              { t: 'Il appuie en inspirant lentement, puis retient sa respiration quelques secondes', why: 'Le produit va dans les bronches.' },
              { t: 'Je note l\'heure et le nombre de bouffées et je les transmets', why: 'Les médecins doivent savoir.' }],
            ref: 'Fiche « Gestes clés ».' },
          T.team({ id: 't6', w: 3, say: 'Le SMUR arrive. Samir : « Fais ton point. »',
            what: [/asthme|crise|detresse respiratoire|difficulte a respirer|essouffl|respire mal/],
            bilan: [
              { label: 'Détresse respiratoire : FR rapide, sifflements, mots courts', re: [/36|35|vite|siffl|mots courts|tirage|detresse/], w: 1.5 },
              { label: 'SpO₂ mesurée (91 %)', re: [/91|spo2|saturation|oxymetre/], w: 1.5 },
              { label: 'Asthmatique, spray pris sans effet', re: [/asthmat|spray|ventoline|bouffee/], w: 1 }],
            done: [
              { label: 'Position assise', re: [/assis|penche/], w: 0.5 },
              { label: 'Oxygène (débit)', re: [/oxygene|o2|15 l|15 litres/], w: 1.5 },
              { label: 'Spray repris selon avis du régulateur, avec l\'heure', re: [/spray|bouffee|ventoline/], w: 1 }],
            ask: [{ label: 'Médicalisation / évacuation', re: [/medecin|smur|evacu|hopital|regulation/], w: 0.5 }],
            model: {
              vic: 'Chef, Lucas, 16 ans, crise d\'asthme depuis 16 h 25.',
              bilan: 'Détresse respiratoire : 36/min, sifflements, mots courts, tirage. SpO₂ 91 %. Asthmatique, spray pris à 16 h 20 sans effet.',
              done: 'Position assise, O₂ à 15 L/min au masque, reprise du spray avec l\'avis du régulateur à 16 h 40.',
              ask: 'Je propose une évacuation médicalisée.'
            } })
        ]
      }
    }
  });
})();
