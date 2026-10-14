// data/sim_glyc.js — Glycémie capillaire dans TOUS les cas cliniques, avec l'étape « sécurité avant de piquer ».
// Ajouté après les scénarios : il complète chaque scénario qui n'a pas encore le lecteur de glycémie (instrument, information,
// ligne du tableau, dessin) et ajoute la préparation de sécurité (mains, gants, autopiqueur de sécurité, collecteur) à tous.
// Valeurs de glycémie FICTIVES, cohérentes avec chaque résident. Soin à faire avec l'accord de l'infirmière et selon le protocole du lieu.
'use strict';
window.App = window.App || {};

App.SimGlyc = (() => {
  const fr = v => String(v).replace('.', ',');
  const PREP = {
    title: 'Sécurité avant de piquer',
    intro: "Avant de piquer, tu prépares ta sécurité et celle de la personne. Coche TOUT ce que tu fais pour réaliser ce geste en sécurité (plusieurs bonnes réponses, et quelques pièges).",
    items: [
      { id: 'mains', ok: true,  label: 'Me frictionner les mains (hygiène des mains)', why: "L'hygiène des mains se fait avant d'enfiler les gants." },
      { id: 'gants', ok: true,  label: 'Enfiler des gants à usage unique', why: "Le geste expose au sang : les gants font partie des précautions standard." },
      { id: 'lecteur', ok: true, label: 'Vérifier le lecteur et la bandelette (date de péremption, flacon refermé)', why: "Une bandelette périmée ou mal conservée donne une valeur fausse." },
      { id: 'autopiq', ok: true, label: 'Prendre un autopiqueur de sécurité à usage unique (la lancette se rétracte)', why: "La lancette de sécurité protège du risque de piqûre accidentelle et ne sert que pour une seule personne." },
      { id: 'opct', ok: true,   label: 'Placer le collecteur à objets piquants à portée de main, avant de piquer', why: "On jette l'autopiqueur tout de suite après, sans le poser ni le déplacer." },
      { id: 'doigt', ok: true,  label: 'Préparer le doigt (eau et savon ou antiseptique selon le protocole) et le laisser sécher', why: "Un doigt sucré ou mouillé fausse la glycémie. Le produit exact dépend du protocole du lieu." },
      { id: 'capuchon', ok: false, label: "Reboucher l'aiguille avec son capuchon après usage", why: "On ne rebouche jamais une aiguille ou une lancette : risque de piqûre. Elle va directement dans le collecteur." },
      { id: 'reutil', ok: false, label: "Réutiliser l'autopiqueur d'un autre résident en changeant seulement la lancette", why: "Risque de transmission du sang d'une personne à l'autre : un autopiqueur de sécurité est à usage unique." },
      { id: 'sansmains', ok: false, label: "Enfiler les gants sans me frictionner les mains : les gants suffisent", why: "Les gants ne remplacent pas l'hygiène des mains, qui se fait avant." },
      { id: 'poubelle', ok: false, label: "Jeter l'autopiqueur dans la poubelle ordinaire", why: "Un objet piquant se jette dans un collecteur rigide prévu pour cela." },
      { id: 'bout', ok: false,  label: 'Piquer le bout du doigt, au centre de la pulpe, c\'est plus facile', why: "On pique sur le côté de la pulpe : c'est moins douloureux." }
    ]
  };
  // Tri des déchets après la glycémie : où jeter chaque élément ?
  const WASTE = {
    title: 'Trier tes déchets',
    intro: "Le geste est fait : trie maintenant tes déchets. Pour chaque élément, choisis où il doit aller : le collecteur OPCT, la poubelle jaune DASRI, ou la poubelle ordinaire.",
    bins: [{ id: 'opct', label: 'OPCT', ico: '🟨' }, { id: 'dasri', label: 'DASRI', ico: '☣️' }, { id: 'daom', label: 'Ordinaire', ico: '🗑️' }],
    items: [
      { id: 'lancette', label: "L'autopiqueur (lancette) que tu viens d'utiliser", bin: 'opct', why: "Un objet piquant ne va jamais ailleurs que dans le collecteur OPCT (objets piquants, coupants, tranchants), tout de suite après usage." },
      { id: 'bandelette', label: 'La bandelette tachée de sang', bin: 'dasri', why: "Souillée de sang, elle va dans les DASRI (déchets d'activités de soins à risques infectieux) : sac ou carton jaune." },
      { id: 'gants', label: 'Tes gants, tachés de sang', bin: 'dasri', why: "Des gants souillés de sang vont dans les DASRI." },
      { id: 'compresse', label: 'La compresse avec une goutte de sang', bin: 'dasri', why: "Tout ce qui est souillé de sang ou de liquide biologique va dans les DASRI." },
      { id: 'emballage', label: "L'emballage papier de la compresse (propre, non souillé)", bin: 'daom', why: "Un emballage propre, sans contact avec le sang, va dans les ordures ménagères (DAOM)." }
    ]
  };
  const OBJ = {
    opct: { label: 'Collecteur OPCT (objets piquants)', icon: '🟨', reveals: [],
      narration: "Collecteur jaune à couvercle, réservé aux objets piquants, coupants, tranchants (OPCT) : aiguilles, lancettes, autopiqueurs. On le place à portée de main AVANT de piquer et on jette l'objet tout de suite après, sans recapuchonner. On ne le remplit jamais au-delà du trait « limite », et on active la fermeture définitive quand il est plein (selon le protocole du service)." },
    dasri: { label: 'Poubelle DASRI (déchets à risques infectieux)', icon: '☣️', reveals: [],
      narration: "Poubelle ou carton jaune avec le symbole « risque biologique » : DASRI (déchets d'activités de soins à risques infectieux). On y met les gants, compresses, bandelettes, tubulures souillés de sang ou de liquides biologiques. Jamais d'objet piquant dedans (c'est le rôle de l'OPCT). On ne tasse pas les sacs et on les ferme avant qu'ils soient trop pleins (selon le protocole)." },
    daom: { label: 'Poubelle ordinaire (DAOM)', icon: '🗑️', reveals: [],
      narration: "Poubelle des déchets assimilables aux ordures ménagères (DAOM) : emballages papier ou plastique propres, essuie-mains non souillés. Dès qu'un déchet est souillé de sang ou de liquide biologique, il change de filière." }
  };
  const VALS = {
    ehpad_bilan_matin_1: { val: 1.02, usual: '1,00 g/L (à jeun)', meaning: "Dans la zone attendue à jeun (0,70 à 1,10 g/L). Rien d'inquiétant sur ce point." },
    ehpad_chute_cachee_2: { val: 0.96, usual: '—', meaning: "Dans la zone normale. Une hypoglycémie n'explique donc pas la chute : c'est une information utile pour la suite." },
    ehpad_avc_4: { val: 1.18, usual: '—', meaning: "Normale : une hypoglycémie, qui peut ressembler à un AVC, est écartée. Cela ne change pas l'urgence des autres signes." },
    ehpad_bpco_5: { val: 1.05, usual: '—', meaning: "Dans la zone normale. Elle n'explique pas l'essoufflement." },
    hop_oap_6: { val: 1.34, usual: '—', meaning: "Légèrement au-dessus de la cible habituelle d'une personne diabétique de type 2, mais sans urgence : à transmettre avec les autres mesures." }
  };

  function install() {
    (App.SimScenarios || []).forEach(scn => {
      const p = scn.patient || {}, m = p.sexe === 'M', hosp = p.statut === 'patient';
      const de = hosp ? (m ? 'du patient' : 'de la patiente') : (m ? 'du résident' : 'de la résidente');
      const start = `Tu piques le côté de la pulpe d'un doigt ${de} avec l'autopiqueur de sécurité, tu déposes la goutte sur la bandelette, puis tu jettes l'autopiqueur dans le collecteur à objets piquants.`;
      let T = scn.tools && scn.tools.glucometre;
      if (!T) {
        const V = VALS[scn.id]; if (!V) return;
        scn.tools.glucometre = T = { label: 'Glycémie capillaire', icon: '🩸', zone: 'zone-doigt', kind: 'wait', seconds: 5, fact: 'm_glyc',
          where: "La goutte de sang se prélève sur le côté de la pulpe d'un doigt (jamais le bout).",
          display: { big: fr(V.val.toFixed(2)), unit: 'g/L', sub: 'glycémie capillaire' },
          input: { type: 'num', label: 'Glycémie lue', unit: 'g/L', value: V.val, tol: 0.005 },
          noted: 'Glycémie capillaire : ' + fr(V.val.toFixed(2)) + ' g/L' };
        scn.facts.m_glyc = { section: 'constantes', kind: 'mesurer', label: 'Glycémie capillaire', text: fr(V.val.toFixed(2)) + ' g/L', meaning: V.meaning };
        (scn.toolOrder = scn.toolOrder || []).push('glucometre');
        scn.sceneTools = scn.sceneTools || {}; scn.sceneTools['tool-glucometre'] = 'glucometre';
        scn.scene = scn.scene || {}; scn.scene.glucometre = true;
        if (Array.isArray(scn.constTable)) scn.constTable.push({ fact: 'm_glyc', label: 'Glycémie capillaire', usual: V.usual, norm: 'hypoglycémie : < 0,70 g/L' });
      }
      T.start = start;
      T.waste = WASTE;
      T.where = (T.where || '') + ' Tu prépares d\'abord ta sécurité.';
      T.prep = PREP;
      scn.objects = scn.objects || {};
      Object.keys(OBJ).forEach(k => { if (!scn.objects[k]) scn.objects[k] = Object.assign({}, OBJ[k]); });
      // le scénario qui note déjà la glycémie dans sa grille (Mme Blanc) gagne aussi le geste « sécurité »
      if (Array.isArray(scn.grid) && scn.grid.some(g => g.id === 'g_glyc') && !scn.grid.some(g => g.id === 'g_glyc_secu')) {
        const i = scn.grid.findIndex(g => g.id === 'g_glyc');
        scn.grid.splice(i, 0, { id: 'g_glyc_secu', stage: 'recueil', label: 'Préparer ta sécurité avant de piquer (mains, gants, autopiqueur de sécurité, collecteur)',
          why: "Une glycémie capillaire expose au sang : hygiène des mains, gants, autopiqueur de sécurité à usage unique et collecteur à objets piquants évitent les accidents d'exposition au sang.",
          ref: 'Précautions standard · soin à faire avec l\'accord de l\'infirmière (à confirmer avec ton formateur)' });
        const j = scn.grid.findIndex(g => g.id === 'g_glyc');
        scn.grid.splice(j + 1, 0, { id: 'g_glyc_dechets', stage: 'recueil', label: 'Trier les déchets après la glycémie (autopiqueur dans l\'OPCT, déchets souillés dans les DASRI)',
          why: "L'autopiqueur va dans le collecteur OPCT ; les gants, la bandelette et la compresse souillés vont dans les DASRI ; l'emballage propre va dans les ordures ménagères. Un mauvais tri expose le personnel de soin et de ménage.",
          ref: 'Gestion des déchets d\'activités de soins (à confirmer avec ton formateur et le protocole du lieu)' });
      }
    });
  }
  install();
  return { PREP, WASTE, install };
})();
