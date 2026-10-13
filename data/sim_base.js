// data/sim_base.js — Simulation clinique : briques communes aux scénarios EHPAD supplémentaires
// Les scénarios (data/sim_roux.js, sim_blanc.js, sim_girard.js) restent de simples fiches de données ;
// ce fichier évite de recopier les gestes, les instruments et les réponses de contact.
// ⚠ Patients et valeurs FICTIFS, à but pédagogique. Les protocoles de l'établissement priment.
'use strict';
window.App = window.App || {};

App.SimBase = (() => {
  const fr = x => String(x).replace('.', ',');

  // Mots qui changent selon le sexe du résident
  function words(p) {
    const m = p.sexe === 'M';
    return {
      m,
      res: m ? 'le résident' : 'la résidente',
      Res: m ? 'Le résident' : 'La résidente',
      du: m ? 'du résident' : 'de la résidente',
      il: m ? 'il' : 'elle',
      lui: m ? 'lui' : 'elle',
      deLui: m ? 'de lui' : "d'elle",
      son: m ? 'son' : 'sa',
      e: m ? '' : 'e'
    };
  }

  // Réponses du patient aux gestes de contact (chaque scénario peut les remplacer, voix par voix)
  function contact(p, v) {
    const w = words(p);
    const base = {
      c_salut:        { text: 'Bonjour… entrez.' },
      c_presentation: { text: `Ah, vous êtes l'étudiant… Enchanté${w.e ? 'e' : ''}. Moi, c'est ${p.prenom} ${p.nom}.`, logs: ['g_presentation'] },
      c_identite_q:   { text: `${p.prenom} ${p.nom}, né${w.e} le ${p.dobMots}. J'ai ${p.age} ans.`, logs: ['g_identite'] },
      c_explication:  { text: "D'accord, faites ce qu'il faut.", logs: ['g_explication'] },
      c_accord:       { text: 'Oui, oui, vous pouvez.', logs: ['g_accord'] },
      c_intimite:     { text: "Merci d'avoir fermé la porte.", logs: ['g_intimite'] },
      c_fin:          { text: 'Merci à vous. À tout à l\'heure.' }
    };
    return Object.assign(base, v || {});
  }

  // Instruments : mêmes gestes que le scénario de Mme Martin, valeurs propres à chaque résident.
  // spec = { de, temp, fc:{rate, rhythm}, pa:[sys,dia], fr, spo2, douleur:{val, says, noted}, glyc:{val, ...} }
  function tools(spec) {
    const T = {}, order = [], scene = { 'tool-thermometre': 'thermometre', 'tool-tension': 'tension', 'tool-saturometre': 'saturometre', 'tool-montre': 'respiration' };
    const de = spec.de;
    T.thermometre = { label: 'Thermomètre', icon: '🌡️', zone: 'zone-tete', kind: 'instant', seconds: 2, fact: 'm_temp',
      where: "Le thermomètre se place au niveau de l'oreille ou du front.",
      start: `Tu approches le thermomètre de l'oreille ${de}.`,
      display: { big: fr(spec.temp.toFixed(1)), unit: '°C' },
      input: { type: 'num', label: 'Température lue', unit: '°C', value: spec.temp, tol: 0.05 },
      noted: `Température : ${fr(spec.temp.toFixed(1))} °C` };
    T.tension = { label: 'Tensiomètre', icon: '🩺', zone: 'zone-bras', kind: 'cuff', seconds: 6, fact: 'm_pa',
      where: 'Le brassard se place sur le bras.',
      start: `Tu prends le tensiomètre et tu t'occupes du bras ${de}.`,
      cuff: [
        { id: 'epaule', label: "En haut du bras, près de l'épaule", ok: false, hint: 'Trop haut : le brassard se place juste au-dessus du pli du coude.' },
        { id: 'bon',    label: 'À 2 ou 3 cm au-dessus du pli du coude', ok: true },
        { id: 'coude',  label: 'Sur le pli du coude', ok: false, hint: 'Trop bas : le brassard gêne le pli du coude et fausse la mesure.' }
      ],
      display: { big: spec.pa[0] + ' / ' + spec.pa[1], unit: 'mmHg' },
      input: { type: 'bp', label: 'Pression artérielle lue', unit: 'mmHg', sys: spec.pa[0], dia: spec.pa[1], tol: 1 },
      noted: `Pression artérielle : ${spec.pa[0]}/${spec.pa[1]} mmHg` };
    T.respiration = { label: 'Compter la respiration', icon: '⏱️', zone: 'zone-thorax', kind: 'count', seconds: 30, factor: 2, rate: spec.fr, tol: 4, fact: 'm_fr',
      tap: 'Inspiration', unit: '/min',
      where: `On observe le mouvement du thorax, sans prévenir ${words(spec.p).res} pour ne pas modifier sa respiration.`,
      start: `Tu regardes le thorax ${de} se soulever, une montre à la main.`,
      intro: 'Observe le thorax. Une montée = une respiration. Compte-les pendant 30 secondes en touchant « Inspiration » à chaque fois, puis multiplie par 2.',
      input: { label: 'Fréquence respiratoire', unit: '/min', value: spec.fr, tol: 0 },
      noted: `Fréquence respiratoire : ${spec.fr} /min` };
    T.saturometre = { label: 'Saturomètre', icon: '🔴', zone: 'zone-doigt', kind: 'wait', seconds: 5, fact: 'm_spo2',
      where: 'Le saturomètre se pose au bout d\'un doigt.',
      start: `Tu poses la pince du saturomètre sur le doigt ${de}.`,
      display: { big: String(spec.spo2), unit: '%', sub: 'SpO₂ et pouls, air ambiant', pulse: spec.fc.rate, note: `Le saturomètre donne deux valeurs : la saturation (SpO₂, en %) et le pouls (PR, en battements par minute). Note les deux : pas besoin de prendre le pouls à la main. Rythme sur la courbe : ${spec.fc.rhythm || 'régulier'}.` },
      input: { type: 'num', label: 'Saturation lue', unit: '%', value: spec.spo2, tol: 0 },
      also: { fact: 'm_fc', input: { label: 'Pouls lu', unit: '/min', value: spec.fc.rate, tol: 0 }, noted: `Pouls : ${spec.fc.rate} /min, ${spec.fc.rhythm || 'régulier'}` },
      noted: `Saturation : ${spec.spo2} % en air ambiant` };
    order.push('thermometre', 'tension', 'respiration', 'saturometre');
    if (spec.glyc) {
      T.glucometre = { label: 'Glycémie capillaire', icon: '🩸', zone: 'zone-doigt', kind: 'wait', seconds: 5, fact: 'm_glyc',
        where: 'La goutte de sang se prélève sur le côté de la pulpe d\'un doigt (jamais le bout), après avoir mis des gants.',
        start: `Tu mets des gants, tu piques le côté de la pulpe d'un doigt ${de} et tu déposes la goutte sur la bandelette.`,
        display: { big: fr(spec.glyc.val.toFixed(2)), unit: 'g/L', sub: 'glycémie capillaire' },
        input: { type: 'num', label: 'Glycémie lue', unit: 'g/L', value: spec.glyc.val, tol: 0.005 },
        noted: `Glycémie capillaire : ${fr(spec.glyc.val.toFixed(2))} g/L` };
      scene['tool-glucometre'] = 'glucometre';
      order.push('glucometre');
    }
    if (spec.douleur) {
      T.douleur = { label: 'Échelle de douleur', icon: '😣', zone: '*', kind: 'scale', fact: 'm_douleur',
        where: `L'échelle se présente ${spec.p.sexe === 'M' ? 'au résident' : 'à la résidente'}.`,
        start: `Tu présentes l'échelle de douleur à ${spec.p.civ} ${spec.p.nom} : « Entre 0 et 10, combien avez-vous mal ? »`,
        patientSays: spec.douleur.says,
        scale: spec.douleur.val,
        input: { type: 'num', label: 'Douleur indiquée', unit: '/10', value: spec.douleur.val, tol: 0, min: 0, max: 10 },
        noted: spec.douleur.noted };
      order.push('douleur');
    }
    return { tools: T, toolOrder: order, sceneTools: scene };
  }

  // Grille des gestes : mêmes gestes de base ; `extra` ajoute / remplace des gestes propres au scénario
  function grid(spec) {
    const p = spec.p, w = words(p);
    const g = [
      { id: 'g_dossier', stage: 'entree', label: 'Lire le dossier de soins avant d\'entrer',
        why: 'Tu entres en connaissant l\'identité, les antécédents, les traitements et les constantes habituelles : sans elles, tu ne peux pas repérer ce qui a changé.',
        ref: 'UE B3 S1 : recueil structuré de données (TD 10)' },
      { id: 'g_sha_in', stage: 'entree', label: 'Te frictionner les mains avant le contact',
        why: "Prévention des infections associées aux soins : l'hygiène des mains avant le contact fait partie des précautions standard.",
        ref: 'UE B3 S1 : TD 1 et TD 2 (hygiène des mains, précautions standard)' },
      { id: 'g_frapper', stage: 'entree', label: 'Frapper et attendre avant d\'entrer',
        why: `La chambre est le lieu de vie ${w.du} : on la respecte comme son domicile.`,
        ref: 'Posture professionnelle (à confirmer avec ton formateur)' },
      { id: 'g_presentation', stage: 'contact', label: 'Te présenter (nom, étudiant infirmier)',
        why: `${w.Res} doit savoir qui s'occupe ${w.deLui} et quel est ton rôle.`,
        ref: 'UE B3 S1 : conduire un entretien clinique débutant' },
      { id: 'g_identite', stage: 'contact', label: 'Vérifier son identité (nom et date de naissance) et la comparer au dossier',
        why: `Éviter une erreur de personne. Demander ${w.m ? 'au résident' : 'à la résidente'} de dire son nom et sa date de naissance, puis comparer avec le dossier ou le bracelet.`,
        ref: 'UE B3 S1 : TD 3 (identitovigilance, traçabilité)' },
      { id: 'g_explication', stage: 'contact', label: 'Expliquer ce que tu vas faire',
        why: 'Informer la personne favorise sa coopération et respecte son droit d\'être informée.',
        ref: 'UE B3 S1 : soins relationnels' },
      { id: 'g_accord', stage: 'contact', label: 'Demander son accord',
        why: 'Aucun soin ne se fait sans l\'accord de la personne.',
        ref: 'UE B3 S1 : soins relationnels' },
      { id: 'g_intimite', stage: 'contact', label: 'Préserver l\'intimité (porte, rideau)',
        why: 'Respect de la dignité et de la pudeur, surtout avant un examen.',
        ref: 'Posture professionnelle (à confirmer avec ton formateur)' },
      { id: 'g_constantes', stage: 'recueil', label: 'Mesurer les cinq constantes (température, pression artérielle, fréquence respiratoire, saturation et pouls lus sur le saturomètre)',
        why: 'Les constantes sont des données objectives : elles se comparent à la normale et à l\'habituel de la personne.',
        ref: 'UE B3 S1 : CM 6, analyse et surveillance des paramètres vitaux' }
    ];
    if (spec.douleur) g.push({ id: 'g_douleur', stage: 'recueil', label: 'Évaluer la douleur',
      why: 'La douleur fait partie des paramètres à surveiller et se mesure avec une échelle.', ref: 'UE B3 S1 : CM 6 (douleur, traçabilité)' });
    if (spec.glyc) g.push({ id: 'g_glyc', stage: 'recueil', label: 'Mesurer la glycémie capillaire (gants, côté de la pulpe du doigt, goutte sur la bandelette)',
      why: spec.glyc.why, ref: spec.glyc.ref || 'Soin appris en institut, à faire sous la supervision de l\'infirmière' });
    g.push({ id: 'g_brassard', stage: 'recueil', label: 'Poser le brassard au bon endroit (2 à 3 cm au-dessus du pli du coude)',
      why: 'Un brassard mal placé fausse la mesure de la pression artérielle.', ref: 'UE B3 S1 : CM 6, pression artérielle (à confirmer dans ton cours)' });
    g.push({ id: 'g_trace', stage: 'recueil', label: 'Lire l\'écran et noter chaque valeur sans erreur',
      why: 'La traçabilité repose sur des valeurs exactes : on relit l\'écran avant de noter dans le dossier.',
      ref: 'Compétence 13 (formaliser des documents professionnels) · UE B3 S1 : traçabilité (TD 3)' });
    (spec.extra || []).forEach(x => g.push(Object.assign({ stage: 'recueil' }, x)));
    g.push({ id: 'g_sha_out', stage: 'recueil', label: 'Te frictionner les mains après le contact',
      why: `L'hygiène des mains se fait aussi après le contact, pour ne pas transmettre de germes ${w.m ? 'au résident suivant' : 'à la résidente suivante'}.`,
      ref: 'UE B3 S1 : TD 1 et TD 2 (hygiène des mains, précautions standard)' });
    return g;
  }

  // Gestes validés automatiquement par ce que l'étudiant a recueilli
  function autoGestures(spec) {
    const meas = ['m_temp', 'm_fc', 'm_pa', 'm_fr', 'm_spo2'];
    const all = meas.slice();
    const a = [{ id: 'g_constantes', facts: meas.slice() }];
    if (spec.douleur) { a.push({ id: 'g_douleur', facts: ['m_douleur'] }); all.push('m_douleur'); }
    if (spec.glyc) { a.push({ id: 'g_glyc', facts: ['m_glyc'] }); all.push('m_glyc'); }
    a.push({ id: 'g_trace', facts: all, trace: true });
    (spec.auto || []).forEach(x => a.push(x));
    return a;
  }

  // Lignes du tableau des constantes (mesuré · habituel · repère du cours)
  function constTable(usual, opts) {
    opts = opts || {};
    const rows = [
      { fact: 'm_temp', label: 'Température',         usual: usual.temp, norm: '36,5 à 37,5 °C' },
      { fact: 'm_fc',   label: 'Pouls',               usual: usual.fc,   norm: '60 à 80 /min (tachycardie > 100)' },
      { fact: 'm_pa',   label: 'Pression artérielle', usual: usual.pa,   norm: '< 140/90 (hypotension < 100/50)' },
      { fact: 'm_fr',   label: 'Fréq. respiratoire',  usual: usual.fr,   norm: '16 à 20 /min (polypnée > 20)' },
      { fact: 'm_spo2', label: 'Saturation',          usual: usual.spo2, norm: 'à vérifier dans ton cours (CM 6)' }
    ];
    if (opts.glyc) rows.push({ fact: 'm_glyc', label: 'Glycémie capillaire', usual: usual.glyc, norm: 'hypoglycémie : < 0,70 g/L' });
    if (opts.douleur) rows.push({ fact: 'm_douleur', label: 'Douleur', usual: '—', norm: 'échelle de 0 à 10' });
    return rows;
  }

  // Phrases de mise en scène
  function narration(p, o) {
    return Object.assign({
      knock: 'Tu frappes à la porte et tu attends. « Entrez… » répond une voix.',
      enter: `Tu entres dans la chambre ${p.chambre}.`,
      shaIn: 'Tu te frictionnes les mains avec la solution hydro-alcoolique.',
      shaOut: 'Tu te frictionnes à nouveau les mains avec la solution hydro-alcoolique.',
      shaAlready: `Tu t'es déjà frictionné les mains avant d'entrer. Tu referas ce geste après le contact avec ${words(p).res}.`
    }, o || {});
  }

  return { words, contact, tools, grid, autoGestures, constTable, narration, fr };
})();
