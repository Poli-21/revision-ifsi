// data/tp_fha.js — TP « hygiène des mains » (App.TpData)
// Structure extensible : chaque TP a des gestes, des prérequis, des situations et (si on l'a) une grille d'évaluation officielle.
// SOURCE de la grille FHA : « Grille d'évaluation Hygiène des mains, UE B3, Diplôme d'État infirmier·ère 2026-2027, 1re année » (document fourni par l'étudiant).
// Les situations et les explications sont rédigées pour réviser : elles ne remplacent ni le cours, ni le protocole de l'IFSI ou du stage.
'use strict';
window.App = window.App || {};

App.TpData = {
  disclaimer: "Outil de révision. L'auto-évaluation n'est PAS une évaluation officielle. Le protocole de ton IFSI et de ton lieu de stage prime : en cas de doute, demande à ton formateur.",
  prereqs: [
    { id: 'avant_bras', ico: '👕', label: 'Avant-bras dégagés', detail: 'manches courtes, ou relevées au-dessus des coudes',
      why: "Une manche qui retombe frotte les mains propres et empêche d'atteindre les poignets : la friction doit pouvoir couvrir mains ET poignets." },
    { id: 'bijoux', ico: '💍', label: 'Aucun bijou aux mains et aux poignets', detail: 'y compris alliance et montre',
      why: "Sous un bijou, la peau reste humide et les microbes s'y accumulent ; le produit n'y arrive pas. Cela vaut aussi pour la montre, les bracelets et l'alliance." },
    { id: 'ongles', ico: '💅', label: 'Ongles courts, sans vernis ni faux ongles', detail: 'ongles naturels',
      why: "Les ongles longs, le vernis écaillé et les faux ongles abritent des germes et gênent la friction sous la pulpe des doigts." }
  ],
  // Situations « prérequis » : on repère ce qui n'est pas conforme (bad = identifiants de prérequis non respectés ; [] = tout est conforme)
  prereqCases: [
    { id: 'p1', text: "Inès porte une tunique à manches courtes. Elle a gardé son alliance et ses ongles sont courts et nus.", bad: ['bijoux'] },
    { id: 'p2', text: "Karim a les manches longues d'un pull sous sa tunique, retroussées jusqu'aux poignets. Pas de bijou, ongles courts.", bad: ['avant_bras'] },
    { id: 'p3', text: "Chloé : manches courtes, pas de bijou, ongles courts avec un vernis rose clair.", bad: ['ongles'] },
    { id: 'p4', text: "Tom : manches courtes, ni bague ni montre, ongles courts et naturels.", bad: [] },
    { id: 'p5', text: "Lina a relevé ses manches au-dessus des coudes. Elle porte un petit bracelet en fil au poignet. Ongles courts.", bad: ['bijoux'] },
    { id: 'p6', text: "Mathis : manches de sweat remontées à mi-avant-bras seulement, ongles longs avec faux ongles en gel.", bad: ['avant_bras', 'ongles'] },
    { id: 'p7', text: "Emma : manches relevées au-dessus des coudes, rien aux mains ni aux poignets, ongles courts mais vernis rouge.", bad: ['ongles'] },
    { id: 'p8', text: "Yanis : manches courtes, une montre au poignet « pour surveiller le temps », ongles courts.", bad: ['bijoux'] },
    { id: 'p9', text: "Sarah : manches courtes, pas de bijou, ongles courts. Elle dit : « Je mets mon alliance dans ma poche juste avant de commencer. »", bad: [] },
    { id: 'p10', text: "Noah : manches relevées au-dessus des coudes, chevalière à la main gauche, ongles longs.", bad: ['bijoux', 'ongles'] }
  ],

  tps: [
    // ════════════════════════════════════════════════════════════════════════════════
    {
      id: 'fha', icon: '🧴', title: 'Friction hydro-alcoolique (FHA)', ue: 'UE B3 · Semestre 1',
      short: "La technique du TP d'hygiène des mains : prérequis, 7 gestes de friction, quantité, séchage. Calqué sur la grille officielle (Temps 1 /12 et Temps 2 /15).",
      sheet: "Grille d'évaluation « Hygiène des mains » UE B3 · DE infirmier 2026-2027 (fournie)",
      steps: [
        { id: 'quantite', code: '💧', art: 'dose', label: 'Quantité suffisante de SHA', how: "Appuie sur le distributeur : assez de produit pour remplir le creux de la main et couvrir toutes les surfaces des deux mains et des poignets.", secs: 0, pre: true },
        { id: 'a', code: 'a', art: 'a', label: "Paumes l'une contre l'autre", how: "Frotte les deux paumes ensemble, en mouvement de va-et-vient.", secs: 3 },
        { id: 'b', code: 'b', art: 'b', label: "Paume sur le dos de l'autre main, et inversement", how: "Une paume frotte le dos de l'autre main, puis tu inverses les rôles.", secs: 5 },
        { id: 'c', code: 'c', art: 'c', label: "Espaces interdigitaux : paume contre paume, doigts entrelacés", how: "Entrelace les doigts, paume contre paume, et frotte entre les doigts.", secs: 4 },
        { id: 'd', code: 'd', art: 'd', label: "Dos des doigts contre la paume opposée, doigts emboîtés", how: "Fléchis les doigts : le dos des doigts d'une main frotte la paume de l'autre, doigts emboîtés.", secs: 4 },
        { id: 'e', code: 'e', art: 'e', label: "Chaque pouce par rotation dans la paume opposée", how: "Referme une main sur le pouce de l'autre et fais-le tourner ; puis change de pouce.", secs: 4 },
        { id: 'f', code: 'f', art: 'f', label: "Pulpe des doigts par rotation dans la paume opposée", how: "Regroupe les bouts de doigts d'une main et fais-les tourner dans la paume de l'autre ; puis change.", secs: 4 },
        { id: 'g', code: 'g', art: 'g', label: "Poignets", how: "Une main entoure le poignet de l'autre et tourne ; puis change de poignet.", secs: 4 },
        { id: 'sech', code: '⏱', art: 'sech', label: "Friction jusqu'au séchage complet (20 à 30 secondes)", how: "Continue de frotter, sans essuyer ni secouer les mains, jusqu'à ce que ce soit complètement sec : cela dure 20 à 30 secondes en tout.", secs: 0, end: true }
      ],
      // Grille officielle : chaque critère vaut 1 point (Oui) ou 0 (Non)
      grid: {
        temps: [
          { id: 't1', title: 'Temps 1 · Technique de la friction hydro-alcoolique', max: 12,
            blocks: [
              { title: 'Prérequis', items: [
                { id: 't1_p1', label: 'Avant-bras dégagés (manches courtes ou relevées au-dessus des coudes)', tip: 'Relève les manches AVANT de commencer, au-dessus des coudes.', link: 'avant_bras' },
                { id: 't1_p2', label: 'Absence de bijoux aux mains et aux poignets, y compris alliance et montre', tip: 'Retire tout : alliance, montre, bracelets.', link: 'bijoux' },
                { id: 't1_p3', label: 'Ongles courts, sans vernis ni faux ongles', tip: 'Ongles courts et nus : à préparer la veille du TP.', link: 'ongles' } ] },
              { title: 'Friction hydro-alcoolique', items: [
                { id: 't1_q', label: 'Quantité suffisante de SHA pour couvrir toutes les surfaces des mains', tip: 'Remplis le creux de la main ; une goutte ne suffit pas.', link: 'quantite' },
                { id: 't1_a', label: "a. Paumes l'une contre l'autre", tip: 'Geste a : paume contre paume.', link: 'a' },
                { id: 't1_b', label: "b. Paume sur le dos de l'autre main et inversement", tip: 'Geste b : n\'oublie pas d\'inverser les mains.', link: 'b' },
                { id: 't1_c', label: 'c. Espaces interdigitaux, paume contre paume, doigts entrelacés', tip: 'Geste c : doigts bien entrelacés.', link: 'c' },
                { id: 't1_d', label: "d. Dos des doigts contre la paume opposée, doigts emboîtés", tip: 'Geste d : doigts emboîtés.', link: 'd' },
                { id: 't1_e', label: 'e. Chaque pouce par rotation dans la paume opposée', tip: 'Geste e : les DEUX pouces.', link: 'e' },
                { id: 't1_f', label: 'f. Pulpe des doigts par rotation dans la paume opposée', tip: 'Geste f : les deux mains.', link: 'f' },
                { id: 't1_g', label: 'g. Poignets', tip: 'Geste g : les DEUX poignets, souvent oubliés.', link: 'g' },
                { id: 't1_s', label: "Friction jusqu'au séchage complet : 20 à 30 secondes", tip: "Ne t'arrête pas avant que ce soit sec ; ne t'essuie pas.", link: 'sech' } ] } ] },
          { id: 't2', title: 'Temps 2 · Hygiène des mains dans un contexte de soins', max: 15,
            blocks: [
              { title: 'Raisonnement', items: [
                { id: 't2_need', label: "Identifie la nécessité d'une hygiène des mains avant le soin", tip: 'Dis à voix haute POURQUOI : avant un contact ou un geste propre, on protège le patient.', link: 'ctx' },
                { id: 't2_met', label: 'Choisit la friction hydro-alcoolique comme méthode adaptée', tip: "Mains propres et sèches : la FHA est la méthode de référence. Mains souillées ou mouillées : d'abord laver/sécher.", link: 'ctx' },
                { id: 't2_mom', label: 'Réalise la friction au moment approprié avant le soin', tip: 'Avant le contact avec le patient / avant le geste, et non après.', link: 'ctx' } ] },
              { title: 'Prérequis', items: [
                { id: 't2_p1', label: 'Avant-bras dégagés (manches courtes ou relevées au-dessus des coudes)', tip: 'Relève les manches avant de commencer.', link: 'avant_bras' },
                { id: 't2_p2', label: 'Absence de bijoux aux mains et aux poignets, y compris alliance et montre', tip: 'Retire tout.', link: 'bijoux' },
                { id: 't2_p3', label: 'Ongles courts, sans vernis ni faux ongles', tip: 'Ongles courts et nus.', link: 'ongles' } ] },
              { title: 'Friction hydro-alcoolique', items: [
                { id: 't2_q', label: 'Quantité suffisante de SHA pour couvrir toutes les surfaces des mains', tip: 'Remplis le creux de la main.', link: 'quantite' },
                { id: 't2_a', label: "a. Paumes l'une contre l'autre", tip: 'Geste a.', link: 'a' },
                { id: 't2_b', label: "b. Paume sur le dos de l'autre main et inversement", tip: 'Geste b.', link: 'b' },
                { id: 't2_c', label: 'c. Espaces interdigitaux, paume contre paume, doigts entrelacés', tip: 'Geste c.', link: 'c' },
                { id: 't2_d', label: 'd. Dos des doigts contre la paume opposée, doigts emboîtés', tip: 'Geste d.', link: 'd' },
                { id: 't2_e', label: 'e. Chaque pouce par rotation dans la paume opposée', tip: 'Geste e.', link: 'e' },
                { id: 't2_f', label: 'f. Pulpe des doigts par rotation dans la paume opposée', tip: 'Geste f.', link: 'f' },
                { id: 't2_g', label: 'g. Poignets', tip: 'Geste g.', link: 'g' },
                { id: 't2_s', label: "Friction jusqu'au séchage complet : 20 à 30 secondes", tip: 'Jusqu\'au séchage complet.', link: 'sech' } ] } ] }
        ]
      },
      // Situations de soins : « faut-il une hygiène des mains, laquelle, quand ? » (Temps 2)
      contexts: [
        { id: 'c1', situ: "Tu vas prendre la tension de M. Roux. Tes mains sont propres et sèches.", q: "Que fais-tu ?",
          opts: ["Rien : mes mains sont propres.", "Une friction hydro-alcoolique AVANT de toucher M. Roux.", "Un lavage au savon doux, c'est plus complet.", "Une friction après la mesure seulement."], good: 1,
          why: "Avant un contact avec le patient, on fait une hygiène des mains. Mains propres et sèches : la friction hydro-alcoolique est la méthode de référence (rapide, efficace, douce pour la peau).", tag: 'moment' },
        { id: 'c2', situ: "Tu viens de changer une protection très souillée par des selles. Tes mains sont visiblement sales. Tu dois ensuite refaire le lit.", q: "Que fais-tu d'abord ?",
          opts: ["Une friction hydro-alcoolique directement.", "Je me lave les mains à l'eau et au savon doux, je les sèche bien, puis je fais une friction avant le soin suivant.", "Je mets des gants propres sans rien faire d'autre.", "Je m'essuie les mains sur ma blouse."], good: 1,
          why: "Le produit hydro-alcoolique n'est pas fait pour des mains visiblement souillées : on les lave d'abord, on les sèche, puis on fait la friction avant le soin suivant.", tag: 'methode' },
        { id: 'c3', situ: "Tu viens de te laver les mains, elles sont encore humides. Tu dois entrer dans la chambre de Mme Blanc pour un soin.", q: "Que fais-tu ?",
          opts: ["Une friction tout de suite : l'eau ne gêne pas.", "Je sèche complètement mes mains (essuie-mains à usage unique), puis je fais la friction.", "J'entre sans rien : je viens de me laver.", "Je secoue mes mains pour les sécher."], good: 1,
          why: "Sur des mains mouillées, le produit se dilue et agit moins bien. On sèche d'abord, puis on fait la friction avant le soin.", tag: 'methode' },
        { id: 'c4', situ: "Tu vas préparer une injection (geste propre/aseptique) et tu as prévu des gants.", q: "À quel moment fais-tu la friction ?",
          opts: ["Les gants me protègent, je n'en fais pas.", "Avant d'enfiler les gants.", "Après avoir enfilé les gants.", "Seulement après le geste."], good: 1,
          why: "On fait l'hygiène des mains AVANT de mettre les gants et avant le geste : les gants ne remplacent pas l'hygiène des mains.", tag: 'moment' },
        { id: 'c5', situ: "Tu termines la toilette de Mme Girard. Tu dois aller aider M. Moreau dans la chambre d'à côté.", q: "Que fais-tu ?",
          opts: ["Rien : je continue directement.", "Une hygiène des mains (friction si mains propres et sèches) entre les deux résidents.", "Je change seulement de blouse.", "Je me lave les mains uniquement en fin de journée."], good: 1,
          why: "On fait une hygiène des mains après le contact avec un patient et avant le contact avec le suivant, pour ne pas transporter de germes d'une personne à l'autre.", tag: 'moment' },
        { id: 'c6', situ: "Tu as appuyé une seule fois très légèrement sur le distributeur : tu n'as qu'une petite goutte dans la main.", q: "Que fais-tu ?",
          opts: ["Je commence quand même : un peu suffit.", "Je reprends du produit : il faut en avoir assez pour couvrir toutes les surfaces des mains.", "Je rince à l'eau pour étaler.", "Je saute les poignets pour économiser."], good: 1,
          why: "La quantité doit être suffisante pour couvrir toutes les surfaces des deux mains (et des poignets) pendant toute la friction.", tag: 'quantite' },
        { id: 'c7', situ: "Après 12 secondes, tes mains sont presque sèches. Tu as très envie de t'essuyer sur ta tunique.", q: "Que fais-tu ?",
          opts: ["Je m'arrête : c'est déjà sec.", "Je continue la friction jusqu'au séchage complet, sans m'essuyer (20 à 30 secondes en tout).", "Je m'essuie avec une compresse.", "Je rince pour finir."], good: 1,
          why: "La friction dure 20 à 30 secondes et se termine quand les mains sont complètement sèches, sans essuyage.", tag: 'secher' },
        { id: 'c8', situ: "Tu portes encore ta montre. Tu es devant le distributeur pour une friction avant un soin.", q: "Que fais-tu ?",
          opts: ["Je fais la friction sur les mains seulement, la montre est en métal.", "Je retire ma montre (et mes bijoux), je relève mes manches au-dessus des coudes, puis je commence.", "Je remonte la montre sur l'avant-bras.", "Je fais la friction montre incluse."], good: 1,
          why: "Prérequis de la grille : aucun bijou aux mains et aux poignets (alliance et montre comprises) et avant-bras dégagés. La friction se fait après.", tag: 'prereq' },
        { id: 'c9', situ: "Tu viens de faire une prise de sang et tu as eu un contact avec du sang sur tes gants. Tu retires les gants.", q: "Que fais-tu juste après ?",
          opts: ["Rien : j'avais des gants.", "Une hygiène des mains (après retrait des gants).", "J'attends la fin du service.", "Je remets des gants."], good: 1,
          why: "Après un risque de contact avec du sang ou un liquide biologique, et après retrait des gants, on fait une hygiène des mains (lavage si les mains sont visiblement souillées).", tag: 'moment' },
        { id: 'c10', situ: "Tu veux montrer à ton formateur que tu as compris POURQUOI tu fais une friction avant un pansement.", q: "Quelle explication est la meilleure ?",
          opts: ["« Parce que c'est écrit dans la grille. »", "« Mes mains peuvent porter des germes : je protège le patient avant de le toucher et avant mon geste propre. »", "« Parce que ça sent bon. »", "« Pour que mes mains soient sèches. »"], good: 1,
          why: "Pour le Temps 2, il faut identifier la nécessité de l'hygiène des mains : on l'explique avec le but (protéger le patient, éviter la transmission croisée) et le moment (avant le contact, avant le geste).", tag: 'need' }
      ],
      moments: [
        "Avant le contact avec le patient",
        "Avant un geste propre ou aseptique",
        "Après un risque d'exposition à un liquide biologique (sang, selles, urines…)",
        "Après le contact avec le patient",
        "Après le contact avec l'environnement proche du patient (lit, table de chevet…)"
      ],
      fiche: [
        { t: "Pourquoi la friction hydro-alcoolique ?", p: "Les mains sont le principal vecteur des germes entre les patients et les soignants (transmission croisée). La friction avec un produit hydro-alcoolique (SHA) est la méthode de référence pour l'hygiène des mains quand les mains sont visuellement propres et sèches : rapide, très efficace, peu agressive pour la peau." },
        { t: "Quand ? Les 5 moments (OMS)", list: true },
        { t: "À savoir (à confirmer avec ton formateur / ton protocole)", p: "• Mains visiblement souillées, mouillées ou poudrées : on lave d'abord à l'eau et au savon doux, on sèche bien, puis friction si besoin.\n• Certaines situations particulières (précautions complémentaires, certains germes) peuvent demander un lavage : suis le protocole de ton lieu de stage.\n• Les gants ne remplacent pas l'hygiène des mains : on la fait avant de les mettre et après les avoir retirés." }
      ]
    },

    // ════════════════════════════════════════════════════════════════════════════════
    {
      id: 'lavage', icon: '🚿', title: 'Lavage des mains (eau + savon doux)', ue: 'UE B3 · Semestre 1',
      short: "Les étapes du lavage simple et quand le préférer à la friction. Pas de grille officielle fournie : à valider avec le protocole de ton IFSI.",
      sheet: null,
      steps: [
        { id: 'prep', code: '1', ico: '👕', label: "Préparer : manches relevées, bijoux retirés", how: "Avant-bras dégagés, aucun bijou aux mains et aux poignets (alliance et montre comprises), ongles courts.", secs: 0 },
        { id: 'mouiller', code: '2', ico: '💧', label: "Mouiller les mains et les poignets", how: "Eau tiède, mains et poignets bien mouillés.", secs: 0 },
        { id: 'savon', code: '3', ico: '🧼', label: "Prendre une dose de savon liquide doux", how: "Une dose de savon liquide au distributeur (pas de savon en pain).", secs: 0 },
        { id: 'frotter', code: '4', ico: '🙌', label: "Frotter toutes les surfaces (mêmes gestes que la friction)", how: "Paumes, dos des mains, espaces entre les doigts, dos des doigts, pouces, bouts des doigts, poignets. Compte environ 30 secondes.", secs: 30, timer: true },
        { id: 'rincer', code: '5', ico: '🚰', label: "Rincer abondamment", how: "Rincer jusqu'à ce qu'il n'y ait plus de savon, y compris sur les poignets.", secs: 0 },
        { id: 'secher', code: '6', ico: '🧻', label: "Sécher par tamponnement avec un essuie-mains à usage unique", how: "On tamponne (on ne frotte pas), doigts et espaces entre les doigts compris.", secs: 0 },
        { id: 'robinet', code: '7', ico: '🚪', label: "Fermer le robinet avec l'essuie-mains, puis le jeter", how: "Si le robinet est manuel, on le ferme avec l'essuie-mains pour ne pas se re-contaminer, puis on jette l'essuie-mains.", secs: 0 }
      ],
      grid: null,
      contexts: [
        { id: 'l1', situ: "Tes mains sont visiblement sales (selles, sang, nourriture).", q: "Quelle méthode choisis-tu ?",
          opts: ["Friction hydro-alcoolique seule.", "Lavage à l'eau et au savon doux.", "Rien, ça partira tout seul.", "Je mets des gants sur les mains sales."], good: 1,
          why: "Quand les mains sont visiblement souillées, on les lave à l'eau et au savon doux avant toute friction.", tag: 'methode' },
        { id: 'l2', situ: "Tu viens de te laver les mains. Quelle est la bonne façon de les sécher ?", q: "Que fais-tu ?",
          opts: ["Je frotte fort avec un tissu de la blouse.", "Je tamponne avec un essuie-mains à usage unique.", "Je secoue les mains.", "Je les laisse sécher à l'air en gouttant."], good: 1,
          why: "On sèche par tamponnement avec un essuie-mains à usage unique : frotter irrite la peau, et un tissu ou l'air libre ne sont pas adaptés.", tag: 'secher' },
        { id: 'l3', situ: "Le robinet est à commande manuelle. Tes mains sont propres et séchées.", q: "Comment le fermes-tu ?",
          opts: ["Directement avec la main propre.", "Avec l'essuie-mains que je viens d'utiliser, puis je le jette.", "Avec le coude sale.", "Je le laisse ouvert."], good: 1,
          why: "Le robinet est touché par beaucoup de mains : on le ferme avec l'essuie-mains pour éviter de se re-contaminer.", tag: 'robinet' },
        { id: 'l4', situ: "Tu te lèves de table pour retourner en soins. Tes mains sont propres, sèches, sans souillure visible.", q: "Quelle méthode est de référence avant ton prochain soin ?",
          opts: ["Toujours un lavage de 5 minutes.", "La friction hydro-alcoolique.", "Rien.", "Un lavage au savon antiseptique pour tous les soins."], good: 1,
          why: "Mains visuellement propres et sèches : la friction hydro-alcoolique est la méthode de référence. Le lavage au savon doux est réservé aux mains souillées (ou selon protocole).", tag: 'methode' }
      ],
      fiche: [
        { t: "Quand préférer le lavage ?", p: "Mains visiblement souillées, mouillées ou en début/fin de poste selon le protocole du lieu : le lavage à l'eau et au savon doux. Ensuite on sèche soigneusement. Mains propres et sèches : friction hydro-alcoolique." },
        { t: "À confirmer", p: "La durée exacte, le type de savon et les cas particuliers (précautions complémentaires, certains germes) dépendent du protocole de ton IFSI et de ton lieu de stage. Demande à ton formateur." }
      ]
    }
  ]
};
