// core/distractor.js — Génération intelligente de distracteurs QCM (100% local)
'use strict';
window.App = window.App || {};

App.Distractor = (() => {

  // ══════════════════════════════════════════════════════════════
  // Dictionnaire de paires médicales interchangeables
  // Chaque paire génère un distracteur en swappant les termes
  // ══════════════════════════════════════════════════════════════
  const SWAPS = [
    // Latéralité
    ['droite','gauche'], ['droit','gauche'], ['droits','gauches'],
    // Position anatomique
    ['supérieur','inférieur'], ['supérieure','inférieure'],
    ['supérieurs','inférieurs'], ['supérieures','inférieures'],
    ['antérieur','postérieur'], ['antérieure','postérieure'],
    ['proximal','distal'], ['proximale','distale'],
    ['proximaux','distaux'], ['ascendant','descendant'],
    ['ascendante','descendante'], ['interne','externe'],
    ['internes','externes'], ['périphérique','central'],
    ['périphériques','centraux'],
    // Physiologie direction
    ['augmente','diminue'], ['augmentation','diminution'],
    ['augmentée','diminuée'], ['augmenté','diminué'],
    ['élève','abaisse'], ['élevée','basse'],
    ['élevé','bas'], ['haute','basse'], ['haut','bas'],
    ['forte','faible'], ['fort','faible'],
    ['rapide','lente'], ['rapide','lent'],
    ['grande','petite'], ['grand','petit'],
    // Action physiologique
    ['stimule','inhibe'], ['stimulation','inhibition'],
    ['stimulant','inhibant'], ['active','inhibe'],
    ['activation','inhibition'], ['favorise','inhibe'],
    ['accélère','ralentit'], ['accélération','ralentissement'],
    ['contracte','relaxe'], ['contraction','relaxation'],
    ['vasodilatation','vasoconstriction'],
    ['vasodilatatrice','vasoconstrictrice'],
    // Cardiovasculaire
    ['systolique','diastolique'], ['systole','diastole'],
    ['oreillette','ventricule'], ['oreillettes','ventricules'],
    ['artériel','veineux'], ['artérielle','veineuse'],
    ['artère','veine'], ['artères','veines'],
    ['oxygéné','désoxygéné'], ['oxygénée','désoxygénée'],
    ['tachycardie','bradycardie'], ['tachypnée','bradypnée'],
    // Respiratoire
    ['inspiration','expiration'], ['inspiratoire','expiratoire'],
    ['inspirer','expirer'],
    // Biochimie / hormones
    ['sodium','potassium'], ['calcium','magnésium'],
    ['hyperglycémie','hypoglycémie'], ['hypertension','hypotension'],
    ['hyperthermie','hypothermie'], ['hypernatrémie','hyponatrémie'],
    ['hyperkaliémie','hypokaliémie'], ['hyper','hypo'],
    ['anabolisme','catabolisme'], ['anabolique','catabolique'],
    // Nerveux
    ['sympathique','parasympathique'], ['adrénergique','cholinergique'],
    ['afférent','efférent'], ['afférente','efférente'],
    ['sensitif','moteur'], ['sensitive','motrice'],
    ['sensoriel','moteur'], ['sensorielle','motrice'],
    // Signes / état
    ['aigu','chronique'], ['aiguë','chronique'],
    ['positif','négatif'], ['positive','négative'],
    ['intracellulaire','extracellulaire'],
    ['endogène','exogène'],
    // Organes fréquemment confondus
    ['rein','foie'], ['reins','foie'],
    ['poumon','cœur'], ['poumons','cœur'],
  ];

  // ══════════════════════════════════════════════════════════════
  // Point d'entrée principal
  // Retourne n distracteurs (textes de définitions) pour `card`
  // ══════════════════════════════════════════════════════════════
  function pick(correctCard, allCards, n = 3) {
    const result  = [];
    const usedDef = new Set([_key(correctCard.def)]);

    // ── Niveau 1 : mutations médicales de la vraie réponse ──────
    const mutations = _mutate(correctCard.def);
    // Préfère les mutations avec peu de mots swappés (plus proches)
    for (const m of mutations) {
      if (result.length >= n) break;
      const k = _key(m);
      if (!usedDef.has(k)) { result.push({ text: m, src: 'mutation' }); usedDef.add(k); }
    }

    // ── Niveau 2 : cartes de la même catégorie, proches en sens ─
    if (result.length < n) {
      const sameCat = allCards.filter(c =>
        c.id !== correctCard.id &&
        c.cat === correctCard.cat &&
        !usedDef.has(_key(c.def))
      );
      const scored = sameCat
        .map(c => ({ text: c.def, score: _jaccard(correctCard.def, c.def), src: 'same-cat' }))
        .filter(x => x.score >= 0.04 && x.score < 0.65)
        .sort((a, b) => b.score - a.score);

      for (const s of scored) {
        if (result.length >= n) break;
        if (!usedDef.has(_key(s.text))) { result.push(s); usedDef.add(_key(s.text)); }
      }
    }

    // ── Niveau 3 : catégorie similaire (sous-cat sœur ou parente)
    if (result.length < n) {
      const parent = correctCard.cat.split(' > ')[0];
      const sibling = allCards.filter(c =>
        c.id !== correctCard.id &&
        c.cat !== correctCard.cat &&
        c.cat.startsWith(parent) &&
        !usedDef.has(_key(c.def))
      ).sort(() => Math.random() - .5);

      for (const c of sibling) {
        if (result.length >= n) break;
        result.push({ text: c.def, src: 'sibling' }); usedDef.add(_key(c.def));
      }
    }

    // ── Niveau 4 : toute autre carte (fallback) ─────────────────
    if (result.length < n) {
      const others = allCards
        .filter(c => c.id !== correctCard.id && !usedDef.has(_key(c.def)))
        .sort(() => Math.random() - .5);
      for (const c of others) {
        if (result.length >= n) break;
        result.push({ text: c.def, src: 'random' }); usedDef.add(_key(c.def));
      }
    }

    return result.slice(0, n).map(r => r.text);
  }

  // ══════════════════════════════════════════════════════════════
  // Moteur de mutation médicale
  // ══════════════════════════════════════════════════════════════
  function _mutate(def) {
    const results = new Map(); // text → nSwaps (garde les moins modifiées)

    for (const [a, b] of SWAPS) {
      _applySwap(def, a, b, results);
      _applySwap(def, b, a, results);
    }

    // Trie : moins de swaps = plus proche de la vraie réponse = meilleur distracteur
    return [...results.entries()]
      .sort((x, y) => x[1] - y[1])
      .map(e => e[0]);
  }

  function _applySwap(def, from, to, map) {
    // Regex insensible à la casse, frontières de mots (supporte accents via \b étendu)
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?<![a-zA-ZÀ-ÿ])' + escaped + '(?![a-zA-ZÀ-ÿ])', 'gi');
    if (!re.test(def)) return;

    const mutated = def.replace(
      new RegExp('(?<![a-zA-ZÀ-ÿ])' + escaped + '(?![a-zA-ZÀ-ÿ])', 'gi'),
      match => {
        // Préserve la casse (Majuscule si le mot original commence par une majuscule)
        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
          return to.charAt(0).toUpperCase() + to.slice(1);
        }
        return to;
      }
    );

    if (mutated !== def && !map.has(mutated)) {
      // Compte le nombre de remplacements
      const nSwaps = (def.match(new RegExp('(?<![a-zA-ZÀ-ÿ])' + escaped + '(?![a-zA-ZÀ-ÿ])', 'gi')) || []).length;
      map.set(mutated, nSwaps);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Similarité Jaccard sur les mots significatifs (> 3 lettres)
  // ══════════════════════════════════════════════════════════════
  function _jaccard(a, b) {
    const wa = _words(a);
    const wb = _words(b);
    if (wa.size === 0 && wb.size === 0) return 0;
    let inter = 0;
    wa.forEach(w => { if (wb.has(w)) inter++; });
    return inter / (wa.size + wb.size - inter);
  }

  function _words(text) {
    return new Set(
      text.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève accents pour comparaison
        .split(/\W+/)
        .filter(w => w.length > 3)
    );
  }

  function _key(s)  { return s.trim().toLowerCase(); }

  return { pick };
})();
