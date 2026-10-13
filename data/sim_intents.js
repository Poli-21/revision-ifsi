// data/sim_intents.js — Simulation clinique : reconnaissance des phrases tapées par l'étudiant
// Chaque intention décrit UNE question (ou un geste de contact) que l'étudiant peut poser/faire.
// Les RÉPONSES du patient ne sont pas ici : chaque scénario fournit les siennes (data/sim_*.js),
// ce qui garde le patient cohérent avec son dossier.
//
// Le texte tapé est d'abord « normalisé » : minuscules, sans accents, sans ponctuation
// (« d'accord ? » devient « d accord »). Les motifs ci-dessous s'écrivent donc sans accents.
//   strong : motif fort (2 points)     weak : motif faible (1 point)
//   min    : score minimal pour répondre (2 par défaut ; 1 pour les formules de contact courtes)
//   solo   : ne répond que si c'est la seule intention reconnue (ex. « Bonjour »)
//   menu   : libellé affiché dans le menu de secours ; ask : phrase envoyée quand on clique dessus
'use strict';
window.App = window.App || {};

App.SimIntents = {
  THEMES: [
    { id: 'contact',   label: 'Contact avec la résidente' },
    { id: 'motif',     label: 'Pourquoi et depuis quand' },
    { id: 'symptomes', label: 'Symptômes' },
    { id: 'nutrition', label: 'Alimentation, boissons, éliminations' },
    { id: 'autonomie', label: 'Autonomie et sommeil' },
    { id: 'dossier',   label: 'Antécédents, traitements, allergies' },
    { id: 'psycho',    label: 'Moral, entourage, repères' }
  ],

  LIST: [
    // ── Contact (gestes de communication) ─────────────────────────
    { id: 'c_salut', theme: 'contact', contact: true, solo: true, min: 2,
      menu: 'Dire bonjour', ask: 'Bonjour Madame.',
      strong: [/\b(bonjour|bonsoir|salut|coucou)\b/] },
    { id: 'c_presentation', theme: 'contact', contact: true, min: 1,
      menu: 'Me présenter (nom, étudiant infirmier)',
      ask: 'Bonjour Madame, je suis étudiant infirmier, je suis en stage avec l\'infirmière du service.',
      strong: [/\bje m appelle\b/, /\b(etudiant|etudiante|stagiaire|esi)\b/, /\bmon nom est\b/, /\bmoi c est\b/],
      weak: [/\bje suis\b/, /\binfirmi/] },
    { id: 'c_identite_q', theme: 'contact', contact: true,
      menu: 'Vérifier son identité (nom, date de naissance)',
      ask: 'Pouvez-vous me dire votre nom et votre date de naissance, s\'il vous plaît ?',
      strong: [/\b(votre|ton) nom\b/, /\bcomment (vous )?(vous )?(appelez|nommez)\b/, /\bdate de naissance\b/,
               /\bnee? le\b/, /\bnom et prenom\b/, /\bvotre identite\b/, /\bbracelet\b/, /\bvous etes bien (madame|mme)\b/],
      weak: [/\bprenom\b/, /\bnom\b/] },
    { id: 'c_explication', theme: 'contact', contact: true,
      menu: 'Expliquer ce que je vais faire',
      ask: 'Je vais prendre vos constantes et vous poser quelques questions pour faire le point ce matin.',
      strong: [/\bje vais\b.*\b(prendre|mesurer|verifier|regarder|examiner|controler|poser|faire|evaluer|voir)\b/,
               /\bje viens\b.*\b(pour|vous)\b/, /\b(on va|nous allons)\b/,
               /\bje voudrais\b.*\b(prendre|mesurer|verifier|regarder|poser|savoir)\b/,
               /\bje dois\b.*\b(prendre|mesurer|verifier|regarder|poser)\b/],
      weak: [/\b(bilan|constantes|surveiller)\b/] },
    { id: 'c_accord', theme: 'contact', contact: true,
      menu: 'Demander son accord',
      ask: 'Est-ce que vous êtes d\'accord pour que je prenne vos constantes ?',
      strong: [/\best ce que je peux\b/, /\bpuis je\b/, /\bvous permettez\b/, /\bvoulez vous bien\b/, /\bvous etes d accord\b/,
               /\bd accord\b/, /\bca vous (va|convient|derange)\b/, /\b(avec votre|si vous) (accord|permission)\b/,
               /\bsi vous (voulez bien|le voulez)\b/, /\bvous ne voyez pas d inconvenient\b/],
      weak: [/\baccord\b/, /\bconsentez\b/] },
    { id: 'c_intimite', theme: 'contact', contact: true,
      menu: 'Fermer la porte et le rideau (intimité)',
      ask: 'Je ferme la porte et le rideau pour préserver votre intimité.',
      strong: [/\b(ferm\w*|tire\w*) (la |le |les )?(porte|rideau|rideaux|paravent)\b/, /\bintimite\b/, /\bpudeur\b/, /\bparavent\b/] },
    { id: 'c_fin', theme: 'contact', contact: true, solo: true, min: 2,
      menu: 'Prendre congé', ask: 'Merci Madame, je reviens vous voir tout à l\'heure.',
      strong: [/\b(merci|au revoir|a tout a l heure|bonne journee|a bientot|je reviens)\b/] },

    // ── Pourquoi / depuis quand ───────────────────────────────────
    { id: 'q_comment_allez', theme: 'motif',
      menu: 'Comment vous sentez-vous ce matin ?', ask: 'Comment vous sentez-vous ce matin ?',
      strong: [/\bcomment (allez|vous allez|vous sentez|vous portez|etes vous)\b/, /\bca va\b/, /\bfatigu/, /\ben forme\b/],
      weak: [/\bsentez\b/, /\bce matin\b/] },
    { id: 'q_motif', theme: 'motif',
      menu: 'Pourquoi êtes-vous ici ?', ask: 'Pourquoi êtes-vous arrivée ici, dans la résidence ?',
      strong: [/\bpourquoi (etes vous|vous etes) (ici|la|arrivee?|hospitalisee?|a l ehpad)\b/, /\bmotif\b/, /\bpourquoi ici\b/,
               /\bdepuis combien de temps (etes vous|vivez vous|habitez vous)\b/, /\b(vous vivez|vous habitez) ici\b/, /\bpourquoi vous etes\b/],
      weak: [/\bhospitalis/] },
    { id: 'q_depuis_quand', theme: 'motif',
      menu: 'Depuis quand cela dure ?', ask: 'Depuis quand est-ce que vous ressentez cela ?',
      strong: [/\bdepuis (quand|combien de temps)\b(?!.*\b(ici|ehpad|vivez|habitez)\b)/, /\bca a commence\b/, /\bquand est ce que ca a\b/],
      weak: [/\bdepuis\b/] },
    { id: 'q_autre', theme: 'motif',
      menu: 'Y a-t-il autre chose de différent aujourd\'hui ?', ask: 'Y a-t-il autre chose de différent, aujourd\'hui, que vous voulez me dire ?',
      strong: [/\bautre chose\b/, /\bquelque chose de different\b/, /\bquelque chose (a me dire|qui ne va pas|d anormal)\b/, /\bdifferent d hier\b/, /\bdes soucis\b/],
      weak: [/\bdifferent\b/] },

    // ── Symptômes ─────────────────────────────────────────────────
    { id: 'q_douleur', theme: 'symptomes',
      menu: 'Avez-vous mal quelque part ?', ask: 'Avez-vous mal quelque part ?',
      strong: [/\bdouleurs?\b/, /\bdouloureu/, /\bavez vous mal\b/, /\bvous avez mal\b/, /\bca (vous )?fait mal\b/,
               /\bmal (au|aux|a la|a l|partout|quelque part|ou)\b/, /\bsouffrez\b/, /\bsouffrance\b/],
      weak: [/\bmal\b/, /\bgene\b/] },
    { id: 'q_respiration', theme: 'symptomes',
      menu: 'Avez-vous du mal à respirer ? Toussez-vous ?', ask: 'Est-ce que vous respirez bien ? Vous toussez ?',
      strong: [/\brespir/, /\bessouffl/, /\bsouffle\b/, /\btouss/, /\btoux\b/, /\bmanque d air\b/, /\bcrachat/],
      weak: [/\bpoitrine\b/] },
    { id: 'q_vertiges', theme: 'symptomes',
      menu: 'Avez-vous la tête qui tourne, des vertiges ?', ask: 'Est-ce que la tête vous tourne quand vous vous levez ?',
      strong: [/\bvertiges?\b/, /\btete\b.*\btourn/, /\betourdi/, /\bmalaise/, /\bse sentir mal\b/, /\bsensation de tourner\b/] },
    { id: 'q_nausees', theme: 'symptomes',
      menu: 'Avez-vous des nausées, des vomissements ?', ask: 'Avez-vous des nausées ou des vomissements ?',
      strong: [/\bnausee/, /\bvomi/, /\bmal au coeur\b/, /\benvie de vomir\b/],
      weak: [/\bventre\b/, /\bestomac\b/] },
    { id: 'q_froid', theme: 'symptomes',
      menu: 'Avez-vous froid, des frissons, de la fièvre ?', ask: 'Avez-vous eu froid, des frissons ? Avez-vous de la fièvre ?',
      strong: [/\bfrisson/, /\bfroid\b/, /\bchaud\b/, /\bfievre\b/, /\btranspir/, /\bsueurs?\b/],
      weak: [/\btemperature\b/] },

    // ── Alimentation, boissons, éliminations ─────────────────────
    { id: 'q_alim', theme: 'nutrition',
      menu: 'Avez-vous bien mangé ? (appétit)', ask: 'Avez-vous bien mangé hier soir et ce matin ? Comment est votre appétit ?',
      strong: [/\bmang\w*/, /\bappetit\b/, /\brepas\b/, /\bpetit dej/, /\bdejeuner\b/, /\bdiner\b/, /\bfaim\b/, /\bnourriture\b/],
      weak: [/\bplateau\b/] },
    { id: 'q_boisson', theme: 'nutrition',
      menu: 'Avez-vous bu normalement ? (soif)', ask: 'Avez-vous bu normalement depuis hier ? Avez-vous soif ?',
      strong: [/\bbu\b/, /\bbois\w*/, /\bboire\b/, /\bsoif\b/, /\bhydrat/, /\bverre d eau\b/, /\bboissons?\b/, /\bboit\b/],
      weak: [/\beau\b/, /\bcarafe\b/] },
    { id: 'q_urines', theme: 'nutrition',
      menu: 'Urinez-vous normalement ? (urines)', ask: 'Est-ce que vous urinez comme d\'habitude ? Avez-vous remarqué quelque chose ?',
      strong: [/\burin/, /\buriner\b/, /\bpipi\b/, /\bbrulures?\b/, /\bvessie\b/, /\bmictions?\b/],
      weak: [/\btoilettes?\b/] },
    { id: 'q_selles', theme: 'nutrition',
      menu: 'Êtes-vous allée à la selle ? (transit)', ask: 'Est-ce que votre transit est normal ? Êtes-vous allée à la selle ?',
      strong: [/\bselles?\b/, /\btransit\b/, /\bconstip/, /\bdiarrh/, /\bventre\b.*\b(dur|mou|liquide)\b/] },

    // ── Autonomie et sommeil ──────────────────────────────────────
    { id: 'q_mobilite', theme: 'autonomie',
      menu: 'Comment vous déplacez-vous ? (autonomie)', ask: 'Comment vous déplacez-vous ? Avez-vous besoin d\'aide pour vous lever ?',
      strong: [/\bmarch/, /\bdeplac/, /\bse lever\b/, /\bvous lever\b/, /\bdeambulateur\b/, /\bautonom/, /\bsortir du lit\b/],
      weak: [/\baide\b/, /\bdouche\b/, /\btoilette\b/] },
    { id: 'q_chute', theme: 'autonomie',
      menu: 'Êtes-vous tombée récemment ? (chute)', ask: 'Êtes-vous tombée récemment ? Avez-vous eu peur de tomber ?',
      strong: [/\bchute/, /\btomb/, /\bpeur de tomber\b/, /\bglisse/] },
    { id: 'q_sommeil', theme: 'autonomie',
      menu: 'Avez-vous bien dormi ?', ask: 'Avez-vous bien dormi cette nuit ?',
      strong: [/\bdorm/, /\bsommeil\b/, /\breveill/, /\bsieste\b/, /\bsomnol/],
      weak: [/\bnuit\b/, /\bendormi/] },

    // ── Antécédents, traitements, allergies ──────────────────────
    { id: 'q_antecedents', theme: 'dossier',
      menu: 'Quels sont vos problèmes de santé ? (antécédents)', ask: 'Quels sont vos problèmes de santé ? Avez-vous déjà été opérée ou hospitalisée ?',
      strong: [/\bantecedents?\b/, /\bmaladies?\b/, /\bproblemes? de sante\b/, /\bsuivie? pour\b/, /\bopere/, /\bdeja ete hospitalis/, /\bhistoire medicale\b/],
      weak: [/\bsante\b/] },
    { id: 'q_traitements', theme: 'dossier',
      menu: 'Quels médicaments prenez-vous ?', ask: 'Quels médicaments prenez-vous ? Les avez-vous pris ce matin ?',
      strong: [/\btraitements?\b/, /\bmedicaments?\b/, /\bpilules?\b/, /\bcachets?\b/, /\bordonnance\b/, /\bcomprimes?\b/, /\bgelules?\b/],
      weak: [/\bprenez\b/] },
    { id: 'q_allergies', theme: 'dossier',
      menu: 'Avez-vous des allergies ?', ask: 'Êtes-vous allergique à quelque chose, un médicament par exemple ?',
      strong: [/\ballerg/, /\bintoleran/, /\bne supportez pas\b/, /\bsupportez vous\b/, /\breaction a un medicament\b/] },

    // ── Moral, entourage, repères ────────────────────────────────
    { id: 'q_moral', theme: 'psycho',
      menu: 'Comment est votre moral ?', ask: 'Comment est votre moral en ce moment ?',
      strong: [/\bmoral\b/, /\btriste\b/, /\binquiet/, /\bangoiss/, /\bstress/, /\bsoucis?\b/, /\bpreoccup/],
      weak: [/\bseule?\b/] },
    { id: 'q_entourage', theme: 'psycho',
      menu: 'Avez-vous de la famille, des visites ?', ask: 'Est-ce que votre famille vient vous voir ?',
      strong: [/\bfamille\b/, /\benfants?\b/, /\bfille\b/, /\bfils\b/, /\bvisites?\b/, /\bproches?\b/, /\bpetits enfants\b/] },
    { id: 'q_orientation', theme: 'psycho',
      menu: 'Quel jour sommes-nous ? Où êtes-vous ?', ask: 'Savez-vous quel jour nous sommes, et où nous sommes ?',
      strong: [/\bquel jour\b/, /\bquelle date\b/, /\bou etes vous\b/, /\bsavez vous (ou|quel)\b/, /\bdate d aujourd/, /\bou vous (trouvez|etes)\b/, /\bquelle annee\b/, /\bquel mois\b/] }
  ]
};
