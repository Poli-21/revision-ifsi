// data/secours.js — contenu commun de la section « Secourisme PSE1 » (App.SecData)
// cats : catégories de notation ; fiches : fiches « À réviser » ; refs : sources ; T : fabriques de messages (alerte 15/18, compte rendu au chef d'agrès).
// Les cas sont dans data/secours_*.js (ils s'ajoutent à App.SecData.cases).
// Sources : Mémo Urgence V2.0 (août 2023) et fiches Détresse / Malaise de la Protection Civile Paris Seine (dossier PSE de l'élève), + référentiel national.
// ⚠ Contenu de RÉVISION : résumé des documents ci-dessus tels que je les ai lus. Le découpage exact des « regards » et certaines valeurs
// (temps de recoloration, etc.) changent selon les éditions et les structures : c'est ton formateur / ton chef d'agrès qui fait foi.
'use strict';
window.App = window.App || {};

App.SecData = (() => {
  const cats = {
    secu: 'Sécurité de la scène', alerte: 'Alerte', bilan: 'Bilan (4 regards)', gestes: 'Gestes de secours',
    equipe: 'Travail en équipe', transmission: 'Transmission'
  };

  const fiches = [
    {
      id: 'regards', icon: '👀', title: 'Le bilan en 4 regards',
      html: `<ol class="sec-fl">
        <li><b>1er regard — la scène et la situation.</b> <i>Scène</i> : dangers ? renforts utiles ? freins ? problèmes d'accès ? informations de départ correctes ? <i>Situation</i> : événement ? mécanisme ? nombre de victimes ? plainte principale ? Je me protège <i>avant</i> d'approcher (circulation, verre, feu, foule…).</li>
        <li><b>2e regard — la menace vitale (« X-A-B-C-D »).</b> <b>X</b> hémorragie grave · <b>A</b> obstruction complète des voies aériennes · <b>B</b> arrêt ventilatoire (respiration ≤ 6/min) · <b>C</b> arrêt cardiaque · <b>D</b> inconscience. Je teste la réponse (« Vous m'entendez ? Serrez-moi la main »), je libère les voies aériennes, je regarde / j'écoute / je sens la respiration pendant 10 s maximum. Si la menace est là, je la traite tout de suite.</li>
        <li><b>3e regard — les fonctions vitales en détail.</b> <i>B (respiration)</i> : fréquence sur 1 minute, bruits (sifflements, râles), efforts (tirages), cyanose. <i>C (circulation)</i> : pouls, pâleur, marbrures, sueurs froides, TRC. <i>D (neurologique)</i> : conscience, orientation, pupilles (taille, réactivité, symétrie), motricité / sensibilité des 4 membres, FAST si on suspecte un AVC. + <b>j'interroge</b> : <b>SAMPLE</b> (Signes, Allergies, Médicaments, Passé médical, Last meal = dernier repas, Événements) et <b>OPQRST</b> pour la douleur (Onset = début, Provoqué par, Qualité, Région, Sévérité, Temps).</li>
        <li><b>4e regard — mesures et lésions.</b> Tension, SpO₂, température, glycémie, douleur, puis examen des lésions de la tête aux pieds. Les appareils dépendent de ta formation et du matériel de la structure.</li>
        </ol>
        <p>Puis je <b>surveille</b> (je refais le bilan régulièrement) et je <b>transmets</b> : seul, au 15/18 ; en équipe, au chef d'agrès (qui fait le « contact urgent » avec la régulation médicale).</p>
        <p class="sec-small sec-muted">Les fiches de ta structure (Mémo Urgence V2.0 et fiches « Détresse… ») ne numérotent pas les regards : ce découpage en 4 regards est celui des fiches nationales. À confirmer avec ton formateur si ton école les présente autrement.</p>`
    },
    {
      id: 'alerte', icon: '📞', title: 'Alerter : 15, 18, 112…',
      html: `<ul>
        <li><b>15</b> (SAMU) : problème médical (malaise, douleur, détresse). <b>18</b> (pompiers) : accident, incendie, danger, détresse vitale sur la voie publique. <b>112</b> : numéro européen, renvoie vers le bon service. <b>114</b> : urgence par SMS/fax pour les personnes sourdes ou malentendantes.</li>
        <li>Quand je ne sais pas lequel : l'un ou l'autre convient, l'opérateur redirige. L'important est d'<b>alerter vite</b> et de <b>suivre ce qu'on me dit</b>.</li>
        <li><b>Ce que je dis</b> (dans cet ordre) : <b>qui</b> je suis + numéro de rappel ; <b>où</b> exactement (adresse, ville, repère : angle, métro, côté) ; <b>quoi</b> (ce qui s'est passé) ; <b>combien</b> de victimes ; <b>l'état</b> de la victime (conscient ? respire ? saigne ?) ; <b>ce que j'ai fait / je fais</b> ; les <b>dangers</b>. Je réponds aux questions et <b>je ne raccroche pas</b> : c'est l'opérateur qui met fin à l'appel.</li>
        <li>Si un témoin est là : je lui <b>désigne</b> (« Vous, en gilet bleu ») pour appeler, me ramener le DAE, ouvrir la voie aux secours. Je lui demande de me <b>rappeler quand c'est fait</b>.</li>
        <li>Seul, au téléphone : je mets le <b>haut-parleur</b> pour garder les mains libres.</li>
        <li>En équipe : c'est le <b>chef d'agrès</b> qui alerte et qui fait le contact urgent. Je lui donne mon bilan court : victime, constantes, ce que j'ai fait, avec les heures.</li>
      </ul>`
    },
    {
      id: 'valeurs', icon: '📏', title: 'Valeurs repères (adulte)',
      html: `<ul>
        <li>Fréquence respiratoire : <b>12 à 20 / min</b>. Je compte pendant <b>1 minute</b>. Arrêt ventilatoire : ≤ 6 / min.</li>
        <li>Fréquence cardiaque : <b>60 à 100 / min</b> (détresse circulatoire si &gt; 120 ou &lt; 40). Temps de recoloration cutané : normal si <b>&lt; 2 s</b> ; &gt; 2 s = signe de détresse circulatoire. Tension : systolique &lt; 90 mmHg = détresse circulatoire (hypotension si &lt; 100, normale ≈ 120, hypertension &gt; 160).</li>
        <li>SpO₂ : cible <b>94 à 98 %</b> (normale 94–100 %) ; <b>89 à 94 %</b> chez l'insuffisant respiratoire chronique.</li>
        <li>Glycémie : hypoglycémie si <b>&lt; 0,6 g/L</b> (3,3 mmol/L). Conduite : <b>4 morceaux de sucre</b> (2 à 3 chez l'enfant), je réitère après 15 min si la glycémie reste basse.</li>
        <li>Arrêt cardiaque : <b>cardio-pompe 30 compressions : 2 insufflations</b>, compressions au <b>centre de la poitrine</b>, environ <b>5 cm</b> (jamais plus de 6), <b>100 à 120 / min</b>, thorax qui se relève, DAE/DSA, oxygène à 15 L/min. Relais toutes les <b>2 minutes</b> si on est plusieurs.</li>
        <li>Obstruction complète des voies aériennes : <b>5 claques dans le dos</b>, puis <b>5 compressions</b> (abdominales ; thoraciques si femme enceinte ou très forte corpulence), on recommence jusqu'à amélioration ou perte de connaissance ; si elle perd connaissance : RCP.</li>
        <li>Brûlure : refroidir à l'eau <b>15 à 25 °C</b>, le plus tôt possible (idéalement dans les 30 min), victime consciente, sans détresse circulatoire. Brûlure <b>grave</b> : la somme des surfaces de cloques ≥ <b>la moitié de la paume</b> de la victime (ou brûlure circulaire, électrique, 3e degré, localisation à risque) → arrosage <b>10 min minimum, idéalement 20 min</b>.</li>
        <li>Oxygène (sur ordre) : masque à haute concentration <b>9 à 15 L/min</b> (15 en détresse vitale), masque moyenne concentration 6–9, lunettes 1–6.</li>
      </ul>`
    },
    {
      id: 'gestes', icon: '🩹', title: 'Gestes clés en 1 phrase',
      html: `<ul>
        <li><b>Hémorragie (X)</b> : <b>compression directe</b> avec la main (gantée) tout de suite. Si elle est <b>inefficace ou impossible</b> (jet, membre arraché, corps étranger) : <b>garrot</b> à 5–7 cm au-dessus de la plaie, en zone garrotable (membres), j'<b>écris l'heure</b>, je ne le desserre jamais. Si la compression est <b>efficace</b> : pansement compressif.</li>
        <li><b>Inconscient qui respire (D)</b> : j'ouvre les voies aériennes, <b>PLS</b> (sans traumatisme) ; avec traumatisme suspecté : je maintiens la libération des voies aériennes sur la victime allongée ; PLS à 2 sur avis médical. Surveillance de la respiration, puis contact urgent (tension, température, glycémie).</li>
        <li><b>Inconscient qui ne respire pas (C)</b> : alerte (et DAE), <b>RCP 30:2</b> sans attendre, <b>DAE/DSA</b> dès qu'il arrive : je suis les instructions vocales, personne ne touche pendant l'analyse et le choc, je reprends les compressions tout de suite.</li>
        <li><b>Traumatisme du dos / de la tête</b> : je demande de ne pas bouger, je <b>maintiens la tête</b> à deux mains dans l'axe (casque conservé s'il respire normalement), je fais alerter. Mécanismes à haut risque : collision 2 roues, chute de grande hauteur, véhicule à grande vitesse. Immobilisation par l'équipe, sur ordre du chef (matelas à dépression).</li>
        <li><b>Détresse respiratoire</b> : victime <b>assise</b> ou demi-assise, je desserre les vêtements, oxygène si nécessaire (ordre), avis médical rapide, je protège.</li>
        <li><b>Détresse circulatoire</b> : victime <b>allongée</b>, oxygène si nécessaire, avis médical rapide, je protège.</li>
        <li><b>Détresse neurologique / AVC</b> : victime <b>allongée</b> (PLS si Glasgow &lt; 10), <b>FAST</b> sur 10 s (Face, Arm, Speech, Time = heure de début) et <b>heure de début</b>, rien à boire ni à manger, glycémie, avis médical rapide.</li>
        <li><b>Malaise</b> : position d'attente adaptée, je dégrafe en cas de gêne respiratoire, aide à la prise du traitement personnel si nécessaire, je protège. Bénin : disparaît en quelques minutes au repos ; grave : constantes anormales, pâleur, sueurs, nausées, détresse.</li>
        <li><b>Brûlure</b> : eau tempérée le plus tôt possible, je retire ce qui n'adhère pas, je ne perce pas les cloques ; grave : 10 min minimum (idéalement 20), pansement stérile ou film alimentaire, couverture isotherme.</li>
        <li><b>Hypoglycémie</b> (conscient, peut avaler) : <b>4 morceaux de sucre</b>, repos, je réitère après 15 min si besoin, j'alerte pour avis médical.</li>
      </ul>`
    },
    {
      id: 'equipe', icon: '👥', title: 'En équipe : « je fais quoi ? »',
      html: `<ul>
        <li>Le <b>chef d'agrès</b> commande : je reste dans mon rôle, je <b>reformule l'ordre</b> (« j'ai compris : je maintiens la tête ») et j'annonce quand c'est <b>fait</b> (« tête maintenue »). On ne fait rien « dans son coin ».</li>
        <li>Avant d'approcher : <b>mon propre danger</b> d'abord (circulation, foule, verre). Gants, gilet, lunettes si besoin.</li>
        <li><b>Je ne lâche pas</b> un maintien (de tête, de compression) tant que le chef d'agrès ou un collègue n'a pas pris le relais (« je tiens »).</li>
        <li>Si je constate un changement (la victime ne répond plus, saigne, respire plus mal) : je le <b>dis immédiatement</b> au chef d'agrès, avec l'heure.</li>
        <li>Si je ne suis pas sûr de ce qu'on me demande : je <b>demande</b>, je ne devine pas.</li>
        <li>Mon <b>compte rendu</b> est court et structuré : victime (âge, sexe) → ce qui s'est passé → mon bilan (conscience, respiration, circulation, plaintes) → ce que j'ai fait et à quelle heure → ce que je propose / demande.</li>
      </ul>`
    }
  ];

  const refs = [
    { label: 'Tes documents du dossier « PSE » : Mémo Urgence V2.0 (août 2023, recommandations PS 2022) et fiches Détresse circulatoire / neurologique / respiratoire et Malaise (Protection Civile Paris Seine, 01.25)', note: 'ce sont mes sources principales : valeurs, gestes et ordre des actions suivent ces documents' },
    { label: 'Référentiel national de formation PSE1 / PSE2 (Ministère de l\'Intérieur, sécurité civile)', note: 'base du découpage en 4 regards ; un nouvel arrêté 2026 est annoncé dans mes sources, vérifie la version de ton formateur' },
    { label: 'Recommandations européennes de réanimation (ERC 2021) et ILCOR', note: 'arrêt cardiaque : compressions, rapport 30:2, DAE' },
    { label: 'Consignes de ta structure (PCPS) et de ton chef d\'agrès', note: 'elles passent avant ce module, notamment pour le matériel (oxygène, mesures) et les gestes autorisés' },
    { label: 'Les vidéos YouTube que tu m\'as envoyées', note: 'je n\'ai pas pu les lire (blocage du site) : elles ne sont pas utilisées' }
  ];

  // ══ Fabriques de messages ═════════════════════════════════════════════════════
  // Un « élément » est une idée attendue : label (ce que le message doit contenir), re (liste d'expressions, une suffit),
  // need {min,re[]} (au moins min expressions), all (toutes), any:true (cherché dans tout le message), w (poids).
  const R = (...a) => a;
  const T = {
    // Message d'alerte au 15/18 (sauveteur isolé). o : { addr:[re], what:[re], whatLabel, state:[{label,re,w}], done:[{label,re,w}], danger?:[{label,re}] , model:{...}, reply:{good,mid,low} }
    solo(o) {
      const eAddr = { label: 'L\'adresse précise (rue/lieu + ville ou repère)', re: o.addr, w: 2 };
      const eWho = { label: 'Qui je suis + numéro de rappel', any: true, need: { min: 1, re: [/\b(numero|telephone|rappel|rappeler|portable|joignable|06 |07 |0\d ?\d\d)/, /je suis (secouriste|pse|protection civile|temoin|passant)|je m appelle|ici /] }, w: 1 };
      const eWhat = { label: o.whatLabel || 'Ce qui s\'est passé / le problème', re: o.what, w: 2 };
      const eVic = { label: 'La victime (âge approximatif, homme/femme) et le nombre de victimes', any: true, re: [/\b\d{1,3} ?ans\b|\b(homme|femme|madame|monsieur|jeune|adolescent|ado|garcon|fille|dame|personne agee|livreur|livreuse)\b/], w: 1 };
      const sections = [
        { id: 'who', label: '1) Qui et où', hint: '(mon numéro, le lieu exact)', rows: 3, ph: 'Ex. : Je suis secouriste, je vous appelle du 06…, nous sommes…', elements: [eWho, eAddr] },
        { id: 'what', label: '2) Quoi', hint: '(ce qui s\'est passé, la victime)', rows: 2, ph: 'Ex. : Un homme de … ans qui …', elements: [eWhat, eVic] },
        { id: 'state', label: '3) Son état', hint: '(conscience, respiration, saignement, plaintes)', rows: 3, ph: 'Ex. : Elle est consciente, elle respire, …', elements: o.state.map(x => Object.assign({ w: 1 }, x)) },
        { id: 'done', label: '4) Ce que j\'ai fait / je fais, dangers', hint: '(et je reste en ligne)', rows: 3, ph: 'Ex. : J\'ai …, je reste en ligne et j\'attends vos consignes.', elements: o.done.map(x => Object.assign({ w: 1 }, x)).concat([{ label: 'Je reste en ligne / j\'attends les consignes (je ne raccroche pas)', any: true, re: [/reste en ligne|ne raccroche|je reste avec|je reste la|vos consignes|vos instructions|je vous ecoute|dites moi|que dois je faire|je suis vos/], w: 0.5 }]) }
      ];
      return {
        id: o.id || 'alerte', cat: 'alerte', regard: 0, kind: 'transmit', w: o.w || 3, title: 'J\'alerte le 15 ou le 18',
        say: o.say || '', q: o.q || 'Tu appelles. Écris ton message comme tu le dirais au téléphone : qui, où, quoi, son état, ce que tu as fait.',
        intro: 'Écris ce que tu dis à l\'opérateur. Pas besoin de phrases parfaites : ce qui compte, c\'est que les informations essentielles y soient.',
        method: '📞 **QUI – OÙ – QUOI – ÉTAT – GESTES** · puis je reste en ligne.',
        who: 'Opérateur', sections, model: o.model, reply: o.reply || {
          good: 'Très bien, j\'ai tout. Les secours sont envoyés. Restez avec la victime, je reste en ligne avec vous.',
          mid: 'D\'accord. Précisez-moi encore l\'adresse exacte et son état, s\'il vous plaît.',
          low: 'Je n\'ai pas assez d\'éléments. Où êtes-vous exactement, et que se passe-t-il ?'
        }, after: o.after, ref: 'Fiche « Alerter » · message d\'alerte : qui, où, quoi, état, gestes', fb: o.fb
      };
    },
    // Compte rendu au chef d'agrès (équipe). o : { id, what:[re], whatLabel, bilan:[{label,re,w}], done:[{label,re,w}], ask:[{label,re,w}], model:{…} }
    team(o) {
      const sections = [
        { id: 'vic', label: '1) La victime', hint: '(âge, sexe, ce qui s\'est passé, depuis quand)', rows: 2, ph: 'Chef, victime de … ans, …', elements: [
          { label: 'Âge approximatif et sexe', re: [/\b\d{1,3} ?ans\b|\b(homme|femme|madame|monsieur|jeune|adolescent|ado|garcon|fille|dame|livreur|livreuse)\b/], w: 1 },
          { label: o.whatLabel || 'Ce qui s\'est passé', re: o.what, w: 2 },
          { label: 'L\'heure (ou depuis combien de temps)', re: [/\b\d{1,2} ?h ?\d{0,2}\b|\bdepuis\b|\bil y a\b|\bminutes?\b|\bvers\b|\bheure\b|\bmin\b/], w: 0.5 }] },
        { id: 'bilan', label: '2) Mon bilan', hint: '(menace vitale, conscience, respiration, circulation, plaintes)', rows: 3, ph: 'Elle est consciente, elle respire à …/min, …', elements: o.bilan.map(x => Object.assign({ w: 1 }, x)) },
        { id: 'done', label: '3) Ce que j\'ai fait (avec l\'heure)', hint: '', rows: 2, ph: 'J\'ai …', elements: o.done.map(x => Object.assign({ w: 1 }, x)) },
        { id: 'ask', label: '4) Ce que je propose / demande', hint: '(renfort, médecin, matériel, évacuation)', rows: 2, ph: 'Je propose / je demande …', elements: (o.ask || []).map(x => Object.assign({ w: 1 }, x)).concat([{ label: 'Une demande ou une proposition claire', re: [/\bje (propose|demande|souhaite)\b|\bil faut\b|\bbesoin\b|\bdemande\b|\brenfort|\bmedicalis|\bsamu\b|\bsmur\b|\b15\b|\b18\b|\bevacu|\btransport/], w: 0.5 }]) }
      ];
      return {
        id: o.id || 'compte', cat: 'transmission', regard: 0, kind: 'transmit', w: o.w || 3, title: 'Je rends compte au chef d\'agrès',
        say: o.say || '', q: o.q || 'Le chef d\'agrès te demande : « Je t\'écoute, qu\'est-ce que tu as ? » Écris ton compte rendu, court et structuré.',
        intro: 'Écris ce que tu dis à voix haute à ton chef d\'agrès. Court, clair, dans l\'ordre.',
        method: '🗣️ **VICTIME – BILAN – GESTES (avec l\'heure) – DEMANDE**.',
        who: 'Chef d\'agrès', sections, model: o.model, reply: o.reply || {
          good: 'Compris, c\'est clair et complet. Je préviens la régulation et on prépare l\'évacuation. Continue la surveillance.',
          mid: 'D\'accord. Il me manque quelques éléments : redis-moi la respiration et ce que tu as déjà fait.',
          low: 'Je n\'ai pas tout ce qu\'il me faut. Reprends dans l\'ordre : qui, ce qui s\'est passé, ton bilan, tes gestes.'
        }, after: o.after, ref: 'Fiche « En équipe » · compte rendu structuré', fb: o.fb
      };
    }
  };

  // petites fabriques d'options
  const O = {
    g: (id, t, why) => ({ id, t, v: 'good', why }),
    a: (id, t, why) => ({ id, t, v: 'avoid', why }),
    d: (id, t, why) => ({ id, t, v: 'danger', why })
  };

  return { cats, fiches, refs, T, O, R, cases: [] };
})();
