// data/sim_real.js — « Mode réaliste » de la simulation clinique : imprévus, patient qui hésite ou entend mal, mesures qui ratent.
// Tout est FICTIF et pédagogique. Les bonnes réactions décrites ici sont des repères généraux : le protocole de ton stage prévaut.
// Utilisé par core/simulation.js (désactivable avec l'interrupteur du menu de la simulation).
'use strict';
window.App = window.App || {};

App.SimReal = (() => {
  // Minutes simulées par mesure (en plus de la minute de base de chaque action) : l'horloge de la chambre avance.
  const MIN = { thermometre: 2, tension: 4, saturometre: 3, respiration: 2, douleur: 1, glucometre: 5, scope: 5 };
  const MIN_DEFAULT = 3;
  // Heure à laquelle l'infirmière attend ton retour : début du cas + 30 minutes (information, hors score).
  const DEADLINE_MIN = 30;
  // Interruption n° 1 après ~6 actions, n° 2 après ~16 actions (jamais en situation d'urgence).
  const INT_AT = [6, 16];

  const FILLERS = ['Euh… ', 'Alors… ', 'Attendez… ', 'Hmm… ', 'Voyons… ', 'Comment dire… '];
  const PARDON = [
    "Pardon ? Je n'ai pas bien entendu… Vous pouvez répéter, plus fort ?",
    "Hein ? Comment ? Parlez plus fort et en face de moi, j'entends mal.",
    "Qu'est-ce que vous dites ? Je n'ai pas compris, répétez-moi ça doucement."
  ];
  const PARDON_TIP = "💡 Il ou elle n'a pas bien entendu : mets-toi en face, à hauteur du visage, parle plus fort mais sans crier, et repose ta question avec des mots simples.";

  const SAT_ART = {
    log: "Le saturomètre affiche « signal faible » : les doigts sont froids.",
    note: "Le saturomètre n'affiche pas de valeur fiable (signal faible). Ses doigts sont froids. Réchauffe la main (frotte-la doucement, couverture) puis refais la mesure.",
    btn: '↺ Réchauffer la main et refaire la mesure',
    why: "Un doigt froid, du vernis ou un mouvement peuvent donner un signal faible : on ne note jamais une valeur douteuse, on corrige la cause et on refait la mesure."
  };

  // Imprévus. {civ} {nom} = résident(e) du cas. ok:true = bonne réaction.
  const INTERRUPTS = [
    { id: 'sonnette', setting: 'EHPAD', ico: '🔔', title: 'Une sonnette retentit au bout du couloir',
      text: "La chambre 9 sonne. Tu es au milieu du recueil chez {civ} {nom}. Karim, l'aide-soignant, est occupé dans une autre chambre. Que fais-tu ?",
      choices: [
        { label: "Je préviens {civ} {nom} que je m'absente une minute, je sécurise (sonnette à portée, lit bas) puis je préviens Karim ou l'infirmière pour la chambre 9.", ok: true, fb: "La personne que tu quittes est sécurisée et la sonnette n'est pas ignorée. Tu passes le relais à l'équipe au lieu de tout laisser tomber." },
        { label: "Je sors tout de suite voir la chambre 9, sans rien dire.", ok: false, fb: "Tu quittes {civ} {nom} sans explication ni sécurisation : risque de chute, d'angoisse. Préviens toujours avant de quitter une chambre." },
        { label: "J'ignore : ce n'est pas mon résident.", ok: false, fb: "Une sonnette ne s'ignore jamais : tu préviens un collègue disponible (aide-soignant, infirmière) pour qu'il y réponde." }
      ] },
    { id: 'collegue', setting: 'EHPAD', ico: '🗣️', title: "Karim passe la tête dans la chambre",
      text: "« T'as deux minutes pour m'aider à retourner M. Dupuis ? » Tu es en train de faire le recueil de {civ} {nom}.",
      choices: [
        { label: "Je lui dis que je termine ce que je fais auprès de {civ} {nom} et que je le rejoins juste après (ou qu'il demande à l'infirmière).", ok: true, fb: "Tu restes disponible pour l'équipe tout en terminant ton soin. Annoncer quand tu seras libre évite de laisser le collègue dans l'attente." },
        { label: "Je plante {civ} {nom} et je le suis tout de suite.", ok: false, fb: "Tu abandonnes {civ} {nom} en plein recueil, sans l'avoir prévenu(e) ni sécurisé(e)." },
        { label: "Je lui réponds sèchement que je suis occupé(e).", ok: false, fb: "Tu as raison de rester auprès de {civ} {nom}, mais la manière compte : une réponse courte et polie, avec un horaire, garde de bonnes relations dans l'équipe." }
      ] },
    { id: 'famille', setting: 'EHPAD', ico: '👨‍👩‍👧', title: 'Un proche arrive dans le couloir',
      text: "Le fils ou la fille de {civ} {nom} te demande des nouvelles : « Alors, comment va-t-il ou elle ce matin ? »",
      choices: [
        { label: "Je l'accueille avec bienveillance, je dis que je termine le bilan et que l'infirmière pourra lui donner des nouvelles.", ok: true, fb: "Accueil chaleureux, sans donner d'information médicale : c'est à l'infirmière d'informer la famille (dans le respect de ce que la personne a autorisé)." },
        { label: "Je lui donne toutes les valeurs que j'ai relevées et mon avis.", ok: false, fb: "Les informations médicales et ton interprétation ne sont pas à transmettre seul(e) : secret professionnel, et rôle de l'infirmière pour informer la famille." },
        { label: "Je lui dis de revenir plus tard, sans rien d'autre.", ok: false, fb: "Tu peux lui dire que tu termines le bilan, mais un accueil poli et une orientation (infirmière) évitent de le laisser sans réponse." }
      ] },
    { id: 'scope_alarme', setting: 'Hôpital', ico: '🚨', title: "Une alarme de scope retentit dans la chambre voisine",
      text: "Tu entends l'alarme d'un scope à côté, alors que tu es auprès de {civ} {nom}. L'infirmière est dans le couloir, non loin.",
      choices: [
        { label: "Je préviens tout de suite l'infirmière (sans rester là à attendre) puis je préviens {civ} {nom} que je reviens.", ok: true, fb: "Une alarme est une alerte à traiter vite : tu transmets sans tarder à la personne compétente et tu n'abandonnes pas ton patient sans un mot." },
        { label: "Je ne bouge pas : c'est sûrement un capteur décroché.", ok: false, fb: "Faire une hypothèse sans vérifier est dangereux : une alarme peut être un vrai signe d'aggravation. On alerte, c'est l'équipe qui évalue." },
        { label: "J'entre dans la chambre voisine et je coupe l'alarme.", ok: false, fb: "Couper une alarme n'est pas un geste d'étudiant : cela ne règle pas la cause et peut masquer un danger." }
      ] },
    { id: 'medecin', ico: '👨‍⚕️', title: 'Le médecin passe dans le couloir',
      text: "« Vous avez les constantes de la chambre ? » demande-t-il en te voyant sortir une feuille. Tu as relevé certaines mesures, pas toutes.",
      choices: [
        { label: "Je donne ce que j'ai réellement relevé, avec l'heure, et je dis ce qui n'est pas encore mesuré.", ok: true, fb: "Une transmission honnête : les valeurs mesurées, l'heure, et ce qui reste à faire. On n'invente jamais une valeur." },
        { label: "Je donne des valeurs « normales » pour ne pas le faire attendre.", ok: false, fb: "Inventer ou arrondir une valeur est une faute grave : une décision médicale peut en dépendre. On dit ce qu'on a et ce qu'on n'a pas." },
        { label: "Je lui dis d'aller voir dans le dossier.", ok: false, fb: "Les mesures du jour ne sont pas toutes écrites : tu peux répondre oralement avec ce que tu as relevé, puis les tracer." }
      ] }
  ];

  return { MIN, MIN_DEFAULT, DEADLINE_MIN, INT_AT, FILLERS, PARDON, PARDON_TIP, SAT_ART, INTERRUPTS };
})();
