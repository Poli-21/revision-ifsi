// core/dose.js — Entraînement « Calcul de doses » (App.Dose)
// Problèmes générés au hasard (jamais deux fois les mêmes chiffres), par thème et par niveau :
// conversions · comprimés · volumes à prélever · dose selon le poids · débit par gravité · débit en mL/h (pousse-seringue / pompe) ·
// pourcentages et concentrations · insuline (UI). Chaque réponse est corrigée avec le détail du calcul et l'erreur typique repérée.
// Progression gardée sur cet appareil seulement (localStorage, clé ifsi_dose_v1). Temps compté par App.Activity (kind « dose »).
// ⚠ Outil d'ENTRAÎNEMENT : prescriptions et valeurs fictives. En soins : double contrôle, prescription lue en entier, protocole du service.
'use strict';
window.App = window.App || {};

App.Dose = (() => {
  const KEY = 'ifsi_dose_v1';
  const MAX_MISS = 30, SERIES = 8;
  let P = { v: 1, best: {}, miss: [], n: 0 };
  let screen = 'menu';                      // menu | run | result | fiche
  let run = null, _res = null, cfg = { cat: 'mix', lvl: 1 };

  const _el = id => document.getElementById(id);
  const _esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const _fmtB = s => _esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const _top = () => { try { window.scrollTo({ top: 0 }); document.querySelector('.main')?.scrollTo({ top: 0 }); } catch (e) {} };
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const r3 = x => Math.round(x * 1000) / 1000;
  const fr = x => String(r3(x)).replace('.', ',');
  const nice = (x, dec) => { const k = Math.pow(10, dec == null ? 2 : dec); return Math.abs(x * k - Math.round(x * k)) < 1e-6; };
  const _pct = (g, w) => w ? Math.round(g / w * 100) : 0;
  const _cls = s => s >= 85 ? 'ok' : s >= 60 ? 'mid' : 'low';

  // ══ Générateurs ═══════════════════════════════════════════════════════════
  // Un problème : { text, ans, unit, tol, steps:[…], tip, alt:[{v,msg}] }
  const DRUGS_CP = [['paracétamol', 'mg', [500, 1000]], ['amoxicilline (gélule)', 'mg', [250, 500]], ['furosémide', 'mg', [20, 40, 80]], ['bisoprolol', 'mg', [1.25, 2.5, 5, 10]], ['tramadol', 'mg', [50, 100]], ['allopurinol', 'mg', [100, 300]], ['lévothyroxine', 'µg', [25, 50, 75, 100]]];
  const DRUGS_INJ = [['furosémide', 20, 2], ['métoclopramide', 10, 2], ['ondansétron', 4, 2], ['kétoprofène', 100, 2], ['paracétamol (solution)', 10, 1], ['dexaméthasone', 4, 1], ['ranitidine', 50, 2]];
  const NAMES = ['Mme Lambert', 'M. Diallo', 'Mme Perrin', 'M. Garnier', 'Mme Rey', 'M. Bonnet', 'Mme Faure', 'M. Colin', 'Mme Chevalier', 'M. Lopez'];
  const KIDS = ['Léo', 'Inès', 'Noa', 'Jade', 'Hugo', 'Lina', 'Mila', 'Adam'];

  const GEN = {
    conv(l) {
      const T = l === 1 ? [['g', 'mg', 1000], ['mg', 'g', 0.001], ['L', 'mL', 1000], ['mL', 'L', 0.001]]
        : l === 2 ? [['g', 'mg', 1000], ['mg', 'g', 0.001], ['L', 'mL', 1000], ['mL', 'L', 0.001], ['mg', 'µg', 1000], ['µg', 'mg', 0.001], ['kg', 'g', 1000], ['g', 'kg', 0.001]]
        : [['mg', 'µg', 1000], ['µg', 'mg', 0.001], ['g', 'µg', 1e6], ['µg', 'g', 1e-6], ['cL', 'mL', 10], ['dL', 'mL', 100], ['mL', 'cL', 0.1], ['g', 'mg', 1000]];
      for (let k = 0; k < 300; k++) {
        const [a, b, f] = pick(T);
        const v = f >= 1 ? pick(l === 1 ? [2, 3, 5, 0.5, 1.5, 4, 10, 0.25] : [0.004, 0.025, 0.2, 0.75, 1.5, 2.5, 12, 0.06, 0.125, 3.2]) : pick(l === 1 ? [500, 2000, 250, 1500, 750, 3000, 100] : [250, 4000, 125, 75, 8000, 600, 15, 2500, 50000]);
        const ans = v * f; if (!nice(ans, 6) || ans < 0.001 || ans > 100000) continue;
        return { text: `Convertis : **${fr(v)} ${a}** = … ${b}`, ans, unit: b, tol: Math.abs(ans) * 1e-6 + 1e-9,
          steps: [`Relation : 1 ${f >= 1 ? a + ' = ' + fr(f) + ' ' + b : b + ' = ' + fr(1 / f) + ' ' + a}.`, `${fr(v)} ${a} ${f >= 1 ? '×' : '÷'} ${fr(f >= 1 ? f : 1 / f)} = ${fr(ans)} ${b}.`],
          tip: 'On compte les « marches » : g → mg → µg : à chaque marche on × 1000 (on décale la virgule de 3 rangs vers la droite) ; dans l\'autre sens on ÷ 1000.' };
      }
    },
    cp(l) {
      for (let k = 0; k < 300; k++) {
        const [dn, u, ds] = pick(DRUGS_CP), D = pick(ds), who = pick(NAMES);
        const n = pick(l === 1 ? [1, 2, 3, 4] : [0.5, 1, 1.5, 2, 2.5, 3]);
        const pres = D * n; if (!nice(pres, 3)) continue;
        if (l <= 2) {
          const mult = l === 2 ? pick([2, 3]) : 1;
          return { text: l === 1 ? `Prescription pour ${who} : **${dn} ${fr(pres)} ${u}**. Comprimé dosé à **${fr(D)} ${u}**. Combien de comprimés ?` : `Prescription pour ${who} : **${dn} ${fr(pres)} ${u} par prise, ${mult} fois par jour**. Comprimé dosé à **${fr(D)} ${u}**. Combien de comprimés **en tout sur la journée** ?`,
            ans: n * mult, unit: 'comprimé(s)', tol: 0.001,
            steps: l === 1 ? [`Nombre de comprimés = dose prescrite ÷ dosage d'un comprimé.`, `${fr(pres)} ÷ ${fr(D)} = ${fr(n)} comprimé(s).`] : [`Par prise : ${fr(pres)} ÷ ${fr(D)} = ${fr(n)} comprimé(s).`, `Sur la journée : ${fr(n)} × ${mult} prises = ${fr(n * mult)} comprimé(s).`],
            tip: 'Dose prescrite ÷ dosage disponible = nombre d\'unités. Un résultat qui n\'est ni un nombre entier ni une moitié doit te faire douter (vérifie la prescription).', alt: [{ v: D / pres, msg: 'Tu as inversé le calcul : c\'est la dose prescrite qu\'on divise par le dosage du comprimé.' }] };
        }
        // niveau 3 : prescription en g, comprimé en mg
        if (u !== 'mg') continue;
        const g = pres / 1000; if (!nice(g, 3)) continue;
        return { text: `Prescription pour ${who} : **${dn} ${fr(g)} g**. Comprimé dosé à **${fr(D)} mg**. Combien de comprimés ?`, ans: n, unit: 'comprimé(s)', tol: 0.001,
          steps: [`Mets les deux dans la même unité : ${fr(g)} g = ${fr(pres)} mg.`, `${fr(pres)} ÷ ${fr(D)} = ${fr(n)} comprimé(s).`], tip: 'Toujours la même unité avant de diviser : convertis d\'abord.', alt: [{ v: g / D, msg: 'Tu as divisé des g par des mg sans convertir.' }] };
      }
    },
    liq(l) {
      for (let k = 0; k < 300; k++) {
        const [dn, A, B] = pick(DRUGS_INJ), who = pick(NAMES);
        const f = pick(l === 1 ? [1, 2, 0.5, 1.5, 2.5, 3, 4] : [0.5, 0.75, 1.25, 1.5, 2.5, 3, 3.5, 4, 5, 7.5]);
        const dose = A * f * B / B * (B > 0 ? 1 : 1); // dose = A × f (f en ampoules)
        const vol = B * f; if (!nice(vol, 2) || !nice(dose, 3)) continue;
        if (l === 1) return { text: `Prescription pour ${who} : **${dn} ${fr(dose)} mg**. Ampoule : **${fr(A)} mg dans ${fr(B)} mL**. Quel volume prélèves-tu ?`, ans: vol, unit: 'mL', tol: 0.005,
          steps: [`Règle de trois : ${fr(A)} mg sont dans ${fr(B)} mL.`, `${fr(dose)} mg sont dans (${fr(dose)} × ${fr(B)}) ÷ ${fr(A)} = ${fr(vol)} mL.`], tip: 'Produit en croix : volume = (dose prescrite × volume de l\'ampoule) ÷ quantité dans l\'ampoule.', alt: [{ v: dose * A / B, msg: 'Tu as inversé la règle de trois : on multiplie la dose par le volume de l\'ampoule, puis on divise par la quantité de l\'ampoule.' }] };
        if (l === 2) { const c = A / B; if (!nice(c, 3)) continue;
          return { text: `Prescription pour ${who} : **${dn} ${fr(dose)} mg**. Solution à **${fr(c)} mg/mL**. Quel volume prélèves-tu ?`, ans: vol, unit: 'mL', tol: 0.005,
            steps: [`Concentration : ${fr(c)} mg dans 1 mL.`, `Volume = dose ÷ concentration = ${fr(dose)} ÷ ${fr(c)} = ${fr(vol)} mL.`], tip: 'Dose (mg) ÷ concentration (mg/mL) = volume (mL).', alt: [{ v: dose * c, msg: 'Tu as multiplié au lieu de diviser : la concentration donne les mg dans 1 mL.' }] }; }
        // niveau 3 : prescription en g
        const dg = dose / 1000; if (!nice(dg, 4) || dose < 100) continue;
        return { text: `Prescription pour ${who} : **${dn} ${fr(dg)} g**. Ampoule : **${fr(A)} mg dans ${fr(B)} mL**. Quel volume prélèves-tu ?`, ans: vol, unit: 'mL', tol: 0.005,
          steps: [`Même unité : ${fr(dg)} g = ${fr(dose)} mg.`, `Règle de trois : (${fr(dose)} × ${fr(B)}) ÷ ${fr(A)} = ${fr(vol)} mL.`], tip: 'Convertis la dose dans l\'unité de l\'ampoule avant la règle de trois.' };
      }
    },
    poids(l) {
      for (let k = 0; k < 400; k++) {
        const kid = pick(KIDS), kg = pick([8, 10, 12, 15, 16, 18, 20, 24, 25, 30]);
        if (l === 1) { const mk = pick([10, 15, 20, 25, 30, 40]); const tot = mk * kg;
          return { text: `${kid}, **${kg} kg**. Paracétamol **${mk} mg/kg par prise**. Quelle dose par prise ?`, ans: tot, unit: 'mg', tol: 0.5,
            steps: [`Dose = dose par kg × poids.`, `${mk} × ${kg} = ${tot} mg par prise.`], tip: 'Dose (mg) = dose par kg (mg/kg) × poids (kg).' }; }
        const mk = pick([30, 40, 50, 60, 80, 90, 100]), pr = pick([2, 3, 4]); const tot = mk * kg, per = tot / pr; if (!nice(per, 2)) continue;
        if (l === 2) return { text: `${kid}, **${kg} kg**. Amoxicilline **${mk} mg/kg/jour en ${pr} prises**. Quelle dose par prise ?`, ans: per, unit: 'mg', tol: 0.05,
          steps: [`Dose par jour = ${mk} × ${kg} = ${tot} mg/jour.`, `Par prise : ${tot} ÷ ${pr} = ${fr(per)} mg.`], tip: '« /jour » : on calcule d\'abord la dose de la journée, puis on la répartit sur les prises.', alt: [{ v: tot, msg: 'Tu as donné la dose de toute la journée : il faut la diviser par le nombre de prises.' }] };
        const c = pick([125, 250]), vf = 5, vol = per * vf / c; if (!nice(vol, 1) || vol < 1 || vol > 15) continue;
        return { text: `${kid}, **${kg} kg**. Amoxicilline **${mk} mg/kg/jour en ${pr} prises**, sirop à **${c} mg pour ${vf} mL**. Quel volume de sirop par prise ?`, ans: vol, unit: 'mL', tol: 0.05,
          steps: [`Dose par jour : ${mk} × ${kg} = ${tot} mg.`, `Par prise : ${tot} ÷ ${pr} = ${fr(per)} mg.`, `Volume : (${fr(per)} × ${vf}) ÷ ${c} = ${fr(vol)} mL.`], tip: 'Calcul en trois temps : dose du jour → dose par prise → volume. Écris chaque étape.' };
      }
    },
    gravite(l) {
      for (let k = 0; k < 400; k++) {
        const who = pick(NAMES);
        if (l === 1) { const V = pick([250, 500, 1000]), h = pick([2, 4, 5, 8, 10, 12]), fct = 20; const raw = V * fct / (h * 60), ans = Math.round(raw);
          return { text: `${who} : perfusion de **${V} mL en ${h} h** par gravité. Perfuseur : **${fct} gouttes = 1 mL**. Débit en gouttes par minute (arrondi à l'unité) ?`, ans, unit: 'gouttes/min', tol: 1,
            steps: [`Gouttes totales : ${V} × ${fct} = ${V * fct} gouttes.`, `Durée en minutes : ${h} × 60 = ${h * 60} min.`, `Débit : ${V * fct} ÷ ${h * 60} = ${fr(raw)} → environ ${ans} gouttes/min.`], tip: 'Gouttes/min = (volume en mL × gouttes par mL) ÷ durée en minutes. Pense à convertir les heures en minutes.', alt: [{ v: Math.round(V * fct / h), msg: 'Tu as oublié de convertir les heures en minutes (÷ 60).' }] }; }
        if (l === 2) { const V = pick([100, 250, 500]), min = pick([30, 45, 60, 90, 120, 150]), fct = pick([20, 15]); const raw = V * fct / min, ans = Math.round(raw);
          return { text: `${who} : **${V} mL à passer en ${min} min** par gravité. Perfuseur : **${fct} gouttes = 1 mL**. Débit en gouttes par minute (arrondi) ?`, ans, unit: 'gouttes/min', tol: 1,
            steps: [`Gouttes totales : ${V} × ${fct} = ${V * fct}.`, `Débit : ${V * fct} ÷ ${min} min = ${fr(raw)} → environ ${ans} gouttes/min.`], tip: 'Ici la durée est déjà en minutes : pas de conversion.' }; }
        const q = pick([60, 80, 100, 125, 150, 200]), fct = 20; const raw = q * fct / 60, ans = Math.round(raw);
        return { text: `${who} : prescription **${q} mL/h** par gravité, perfuseur à **${fct} gouttes = 1 mL**. Débit en gouttes par minute (arrondi) ?`, ans, unit: 'gouttes/min', tol: 1,
          steps: [`${q} mL/h × ${fct} gouttes/mL = ${q * fct} gouttes par heure.`, `Par minute : ${q * fct} ÷ 60 = ${fr(raw)} → environ ${ans} gouttes/min.`], tip: 'Un débit en mL/h se transforme en gouttes/min : × gouttes par mL puis ÷ 60.' };
      }
    },
    pse(l) {
      for (let k = 0; k < 400; k++) {
        const who = pick(NAMES);
        if (l === 1) { const V = pick([50, 100, 250, 500, 1000]), h = pick([1, 2, 4, 5, 8, 10, 12, 24]), ans = V / h; if (!nice(ans, 1)) continue;
          return { text: `${who} : **${V} mL** à passer en **${h} h** à la pompe. Quel débit programmes-tu ?`, ans, unit: 'mL/h', tol: 0.05,
            steps: [`Débit (mL/h) = volume ÷ durée en heures.`, `${V} ÷ ${h} = ${fr(ans)} mL/h.`], tip: 'Débit (mL/h) = volume (mL) ÷ durée (h).', alt: [{ v: h / V, msg: 'Tu as inversé : c\'est le volume qu\'on divise par la durée.' }] }; }
        if (l === 2) { const V = pick([100, 250, 500, 1000]), q = pick([25, 50, 62.5, 100, 125, 250]), t = V / q; if (!nice(t, 2) || t < 0.5 || t > 24) continue;
          return { text: `${who} : poche de **${V} mL** qui passe à **${fr(q)} mL/h**. Combien de **temps** (en heures) pour la terminer ?`, ans: t, unit: 'h', tol: 0.02,
            steps: [`Durée (h) = volume ÷ débit.`, `${V} ÷ ${fr(q)} = ${fr(t)} h${nice(t, 0) ? '' : ' (soit ' + Math.floor(t) + ' h ' + Math.round((t - Math.floor(t)) * 60) + ' min)'}.`], tip: 'Durée (h) = volume (mL) ÷ débit (mL/h).' }; }
        const c = pick([1, 2, 5, 10, 20, 25]), qd = pick([1, 2, 2.5, 4, 5, 8]), dose = c * qd; if (!nice(dose, 2)) continue;
        const Vs = pick([50]); const tot = c * Vs;
        return { text: `${who} : seringue électrique de **${Vs} mL contenant ${fr(tot)} mg** (soit ${fr(c)} mg/mL). Prescription : **${fr(dose)} mg/h**. Quel débit en mL/h ?`, ans: qd, unit: 'mL/h', tol: 0.02,
          steps: [`Concentration : ${fr(tot)} mg ÷ ${Vs} mL = ${fr(c)} mg/mL.`, `Débit = dose par heure ÷ concentration = ${fr(dose)} ÷ ${fr(c)} = ${fr(qd)} mL/h.`], tip: 'mL/h = (mg/h) ÷ (mg/mL). Commence par calculer la concentration de la seringue.', alt: [{ v: dose * c, msg: 'Tu as multiplié : le débit est la dose horaire divisée par la concentration.' }] };
      }
    },
    pct(l) {
      for (let k = 0; k < 300; k++) {
        if (l === 1) { const [nm, p] = pick([['glucose', 5], ['glucose', 10], ['NaCl', 0.9], ['glucose', 30]]), V = pick([100, 250, 500, 1000]), g = p * V / 100; if (!nice(g, 2)) continue;
          return { text: `Une poche de **${nm} à ${fr(p)} %** de **${V} mL** : combien de **grammes** de ${nm} contient-elle ?`, ans: g, unit: 'g', tol: 0.005,
            steps: [`${fr(p)} % = ${fr(p)} g pour 100 mL.`, `Pour ${V} mL : (${fr(p)} × ${V}) ÷ 100 = ${fr(g)} g.`], tip: '1 % = 1 g pour 100 mL (solution aqueuse). Règle de trois : g = % × mL ÷ 100.' }; }
        if (l === 2) { const a = pick([20, 40, 50, 100, 200, 500, 1000]), V = pick([2, 4, 5, 10, 20, 50, 100]), c = a / V; if (!nice(c, 2)) continue;
          return { text: `Un flacon contient **${a} mg dans ${V} mL**. Quelle est la **concentration** en mg/mL ?`, ans: c, unit: 'mg/mL', tol: 0.005,
            steps: [`Concentration = quantité ÷ volume.`, `${a} ÷ ${V} = ${fr(c)} mg/mL.`], tip: 'Concentration (mg/mL) = quantité (mg) ÷ volume (mL).' }; }
        const p = pick([0.5, 1, 2, 5, 10]), c = p * 10; return { text: `Une solution à **${fr(p)} %** : quelle est sa concentration en **mg/mL** ?`, ans: c, unit: 'mg/mL', tol: 0.005,
          steps: [`${fr(p)} % = ${fr(p)} g pour 100 mL = ${fr(p * 1000)} mg pour 100 mL.`, `Pour 1 mL : ${fr(p * 1000)} ÷ 100 = ${fr(c)} mg/mL.`], tip: 'Astuce : % × 10 = mg/mL (1 % = 10 mg/mL).' };
      }
    },
    insuline(l) {
      for (let k = 0; k < 300; k++) {
        if (l === 1) { const ui = pick([4, 6, 8, 10, 12, 14, 16, 20, 24, 30]), v = ui / 100;
          return { text: `Insuline **U100** (100 UI par mL). Prescription : **${ui} UI**. Quel volume en **mL** (seringue à insuline) ?`, ans: v, unit: 'mL', tol: 0.0005,
            steps: [`100 UI sont dans 1 mL.`, `${ui} UI = ${ui} ÷ 100 = ${fr(v)} mL.`], tip: 'En pratique on lit des unités sur la seringue ou le stylo, pas des mL. L\'insuline est à haut risque : double contrôle, jamais de dose « à l\'œil ».' }; }
        if (l === 2) { const ml = pick([0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3]), ui = ml * 100;
          return { text: `Seringue à insuline **U100** : tu as prélevé **${fr(ml)} mL**. Combien d'**unités (UI)** est-ce ?`, ans: ui, unit: 'UI', tol: 0.05,
            steps: [`1 mL = 100 UI.`, `${fr(ml)} × 100 = ${fr(ui)} UI.`], tip: 'U100 : × 100 pour passer des mL aux UI, ÷ 100 pour l\'inverse.' }; }
        const n = pick([2, 3, 4]), tot = pick([12, 18, 24, 30, 36, 40, 60]), per = tot / n; if (!nice(per, 1)) continue;
        return { text: `Prescription d'insuline : **${tot} UI par jour en ${n} injections égales**. Combien d'**UI par injection** ?`, ans: per, unit: 'UI', tol: 0.05,
          steps: [`${tot} UI ÷ ${n} injections = ${fr(per)} UI par injection.`], tip: 'Division simple, mais en vrai on vérifie TOUJOURS la prescription et le schéma écrit : insuline = médicament à haut risque.' };
      }
    }
  };
  const CATS = [
    { id: 'conv', ico: '🔄', name: 'Conversions', desc: 'g, mg, µg · L, mL · kg' },
    { id: 'cp', ico: '💊', name: 'Comprimés', desc: 'Nombre de comprimés selon la prescription' },
    { id: 'liq', ico: '💉', name: 'Volume à prélever', desc: 'Ampoules, flacons, mg/mL' },
    { id: 'poids', ico: '⚖️', name: 'Dose selon le poids', desc: 'mg/kg, mg/kg/jour, sirops' },
    { id: 'gravite', ico: '💧', name: 'Perfusion par gravité', desc: 'Gouttes par minute' },
    { id: 'pse', ico: '🖲️', name: 'Pompe et seringue électrique', desc: 'Débit en mL/h, durée' },
    { id: 'pct', ico: '％', name: 'Pourcentages et concentrations', desc: 'g par poche, mg/mL' },
    { id: 'insuline', ico: '🩸', name: 'Insuline (UI)', desc: 'UI et mL en U100' }
  ];
  const LVL = { 1: 'Débutant', 2: 'Intermédiaire', 3: 'Avancé' };

  const FICHES = [
    { t: 'La règle de trois (produit en croix)', p: "Quand tu connais la quantité d'un produit dans un certain volume, tu cherches le volume pour une autre quantité.\n**Exemple** : ampoule de 20 mg dans 2 mL ; prescription 30 mg → (30 × 2) ÷ 20 = **3 mL**.\nOn multiplie en diagonale, on divise par le nombre restant. **Toujours la même unité** des deux côtés." },
    { t: 'Les conversions', p: "1 g = 1000 mg · 1 mg = 1000 µg · 1 L = 1000 mL · 1 kg = 1000 g.\nOn descend d'une unité (g → mg → µg) : **× 1000**. On remonte : **÷ 1000**.\nAvant tout calcul : mets les données dans **la même unité**." },
    { t: 'Comprimés et volumes', p: "**Comprimés** = dose prescrite ÷ dosage d'un comprimé.\n**Volume** = (dose × volume de l'ampoule) ÷ quantité de l'ampoule, ou dose ÷ concentration (mg/mL).\nUn résultat étrange (7,3 comprimés, 40 mL pour une injection) doit te faire **relire la prescription**." },
    { t: 'Dose selon le poids', p: "Dose (mg) = dose par kg × poids (kg).\nSi la prescription est « par jour » : calcule d'abord la dose de la journée, puis divise par le nombre de prises." },
    { t: 'Perfusion par gravité', p: "**Gouttes/min = (volume en mL × gouttes par mL) ÷ durée en minutes.**\nMacro-perfuseur courant : 20 gouttes = 1 mL (selon le matériel : lis l'emballage). Microgoutteur : 60 gouttes = 1 mL, donc gouttes/min = mL/h.\nOn arrondit à l'unité." },
    { t: 'Pompe et seringue électrique', p: "**Débit (mL/h) = volume (mL) ÷ durée (h)** · **Durée (h) = volume ÷ débit**.\nSeringue électrique avec une dose horaire : concentration = quantité ÷ volume de la seringue ; **débit (mL/h) = dose par heure (mg/h) ÷ concentration (mg/mL)**." },
    { t: 'Pourcentages', p: "1 % = **1 g pour 100 mL** (solution aqueuse) = 10 mg/mL.\nGlucose 5 % : 5 g pour 100 mL ; une poche de 500 mL contient 25 g." },
    { t: 'Insuline', p: "U100 : **100 UI par mL**. 10 UI = 0,1 mL. En pratique on lit des unités sur la seringue ou le stylo.\n⚠ L'insuline est un médicament à haut risque : prescription lue en entier, double contrôle, jamais de dose « à peu près »." }
  ];
  const DISC = "Outil d'entraînement : prescriptions et valeurs fictives. En soins, tu relis toute la prescription, tu fais un double contrôle et tu suis le protocole du service ; en cas de doute, tu demandes à l'infirmier(ère) ou à ton formateur. Cet outil ne remplace pas ton cours.";

  // ══ Sauvegarde ═══════════════════════════════════════════════════════════
  function _load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.v === 1) P = { v: 1, best: r.best && typeof r.best === 'object' ? r.best : {}, miss: Array.isArray(r.miss) ? r.miss.slice(0, MAX_MISS) : [], n: +r.n > 0 ? Math.round(r.n) : 0 };
    } catch (e) {}
  }
  function _save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  // ══ Navigation ═══════════════════════════════════════════════════════════
  function open() {
    _load();
    const root = _el('dose-root'); if (!root) return;
    ['games-setup', 'games-practice', 'games-done', 'sim-root', 'pharma-root', 'gazo-root', 'secours-root', 'tp-root'].forEach(id => { const e = _el(id); if (e) e.style.display = 'none'; });
    root.style.display = 'block';
    screen = 'menu'; run = null;
    render(); _top();
  }
  function close() {
    const root = _el('dose-root'); if (root) { root.style.display = 'none'; root.innerHTML = ''; }
    run = null; screen = 'menu';
    try { App.Games.reset(); } catch (e) { const s = _el('games-setup'); if (s) s.style.display = 'block'; }
    try { App.Render.todayStats(); } catch (e) {}
  }
  function toMenu() { screen = 'menu'; run = null; render(); _top(); }
  function isTraining() { return screen === 'run' && !!run; }
  function fiche() { screen = 'fiche'; render(); }
  function setCat(c) { cfg.cat = c; render(false); }
  function setLvl(l) { cfg.lvl = Number(l) || 1; render(false); }

  // ══ Série ═══════════════════════════════════════════════════════════
  function _make(cat, lvl) {
    for (let t = 0; t < 20; t++) { const p = GEN[cat](lvl); if (p && p.ans != null && isFinite(p.ans)) return Object.assign({ cat, lvl }, p); }
    return null;
  }
  function start() {
    const cats = cfg.cat === 'mix' ? CATS.map(c => c.id) : [cfg.cat];
    const items = []; const seen = {};
    let guard = 0;
    while (items.length < SERIES && guard++ < 200) {
      const cat = cats[items.length % cats.length], p = _make(cat, cfg.lvl);
      if (p && !seen[p.text]) { seen[p.text] = 1; items.push(p); }
    }
    run = { cat: cfg.cat, lvl: cfg.lvl, items, i: 0, score: 0, checked: false, ok: false, val: '', note: '', log: [], t0: Date.now() };
    screen = 'run'; render();
    setTimeout(() => { const e = _el('dz-ans'); if (e) try { e.focus(); } catch (x) {} }, 60);
  }
  function _parse(v) { const x = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isNaN(x) ? null : x; }
  function typeVal(v) { if (run) { run.val = v; } }
  function typeNote(v) { if (run) run.note = v; }
  function submit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!run || run.checked) return false;
    const inp = _el('dz-ans'), x = _parse(inp ? inp.value : run.val);
    const it = run.items[run.i];
    if (x === null) { run.warn = 'Écris ta réponse en chiffres (la virgule ou le point conviennent).'; render(false); return false; }
    run.warn = ''; run.val = inp ? inp.value : run.val;
    run.ok = Math.abs(x - it.ans) <= Math.max(it.tol || 0, 1e-9);
    run.x = x; run.hint = '';
    if (run.ok) run.score++;
    else {
      const alt = (it.alt || []).find(a => Math.abs(x - a.v) <= Math.max(it.tol || 0, 1e-9) * 2 + 1e-9);
      if (alt) run.hint = alt.msg;
      else if (it.ans !== 0) { const r = x / it.ans; [10, 100, 1000, 0.1, 0.01, 0.001].some(k => { if (Math.abs(r - k) < 1e-6 * Math.max(1, k)) { run.hint = (k > 1 ? 'Tu es trop haut d\'un facteur ' + k : 'Tu es trop bas d\'un facteur ' + (1 / k)) + ' : vérifie la virgule ou la conversion d\'unités.'; return true; } return false; }); }
      P.miss.unshift({ ts: Date.now(), cat: it.cat, text: it.text.replace(/\*\*/g, ''), ans: fr(it.ans) + ' ' + it.unit });
      P.miss = P.miss.slice(0, MAX_MISS); _save();
    }
    run.checked = true; run.log.push({ ok: run.ok });
    render(false);
    return false;
  }
  function next() {
    if (!run || !run.checked) return;
    if (run.i + 1 >= run.items.length) return _finish();
    run.i++; run.checked = false; run.ok = false; run.val = ''; run.note = ''; run.hint = ''; run.warn = '';
    render(false);
    setTimeout(() => { const e = _el('dz-ans'); if (e) try { e.focus(); } catch (x) {} }, 40);
  }
  function quit() {
    if (run && run.i > 0 && !confirm('Quitter la série ? Ta progression dans cette série sera perdue.')) return;
    toMenu();
  }
  function _finish() {
    const pct = _pct(run.score, run.items.length), key = run.cat + '|' + run.lvl;
    if (P.best[key] == null || pct > P.best[key]) P.best[key] = pct;
    P.n++; _save();
    _res = { cat: run.cat, lvl: run.lvl, score: run.score, total: run.items.length, pct, log: run.log, items: run.items };
    run = null; screen = 'result'; render();
  }
  function clearMiss() { P.miss = []; _save(); render(false); }

  // ══ Affichage ═══════════════════════════════════════════════════════════
  function render(top) {
    const root = _el('dose-root'); if (!root) return;
    let h = '';
    if (screen === 'menu') h = _menuHtml(); else if (screen === 'fiche') h = _ficheHtml(); else if (screen === 'run') h = _runHtml(); else if (screen === 'result') h = _resultHtml();
    root.innerHTML = `<div class="dz-wrap">${h}</div>`;
    if (top !== false) _top();
    if (screen === 'run' && run && !run.checked) { const e = _el('dz-ans'); if (e && run.warn) try { e.focus(); } catch (x) {} }
  }
  const _disc = () => `<p class="dz-disc">${_esc(DISC)}</p>`;
  const _catName = id => (CATS.find(c => c.id === id) || { name: 'Mélange' }).name;
  function _menuHtml() {
    const cards = [{ id: 'mix', ico: '🎲', name: 'Mélange', desc: 'Tous les thèmes' }].concat(CATS).map(c => {
      const b = c.id === 'mix' ? null : P.best[c.id + '|' + cfg.lvl], bm = c.id === 'mix' ? P.best['mix|' + cfg.lvl] : null, v = b != null ? b : bm;
      return `<button type="button" class="dz-cat ${cfg.cat === c.id ? 'on' : ''}" aria-pressed="${cfg.cat === c.id}" onclick="App.Dose.setCat('${c.id}')"><span class="dz-cat-ico">${c.ico}</span><span class="dz-cat-t"><b>${_esc(c.name)}</b><small>${_esc(c.desc)}</small></span>${v != null ? `<span class="dz-best ${_cls(v)}">${v}%</span>` : ''}</button>`;
    }).join('');
    const lv = [1, 2, 3].map(l => `<button type="button" class="dz-lvl ${cfg.lvl === l ? 'on' : ''}" aria-pressed="${cfg.lvl === l}" onclick="App.Dose.setLvl(${l})">${LVL[l]}</button>`).join('');
    const miss = P.miss.slice(0, 6);
    const missH = miss.length ? `<h3 class="dz-h">🔁 Derniers calculs ratés</h3><div class="dz-card">${miss.map(m => `<div class="dz-miss"><div class="dz-miss-t">${_esc(m.text)}</div><div class="dz-muted dz-small">Réponse : ${_esc(m.ans)} · ${_esc(_catName(m.cat))}</div></div>`).join('')}<button type="button" class="btn btn-ghost btn-sm" onclick="App.Dose.clearMiss()">Effacer la liste</button></div>` : '';
    return `<div class="dz-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Dose.close()">← Entraînement</button></div>
      <h2 class="dz-title">🧮 Calcul de doses</h2>
      <p class="dz-lead">Des calculs de soins comme en TD : comprimés, volumes à prélever, doses selon le poids, débits de perfusion, insuline. Les chiffres changent à chaque série, avec la correction détaillée et l'erreur typique repérée.</p>
      <div class="dz-note">✅ Fonctionne hors ligne. Tu peux utiliser une calculatrice et un brouillon, comme en situation. Prescriptions fictives : ce n'est pas une aide pour de vrais soins.</div>
      <button type="button" class="dz-fiche-btn" onclick="App.Dose.fiche()">📖 Revoir les formules (règle de trois, gouttes/min, mL/h…)</button>
      <h3 class="dz-h">1 · Niveau</h3><div class="dz-lvls">${lv}</div>
      <h3 class="dz-h">2 · Thème</h3><div class="dz-cats">${cards}</div>
      <div class="dz-row"><button type="button" class="btn btn-primary dz-start" onclick="App.Dose.start()">Commencer une série de ${SERIES} calculs →</button></div>
      ${missH}${_disc()}`;
  }
  function _ficheHtml() {
    return `<div class="dz-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Dose.toMenu()">← Retour</button></div><h2 class="dz-title">📖 Formules à connaître</h2>
      ${FICHES.map(f => `<div class="dz-card"><h4 class="dz-h4">${_esc(f.t)}</h4><p>${_fmtB(f.p)}</p></div>`).join('')}
      <div class="dz-row"><button type="button" class="btn btn-primary" onclick="App.Dose.toMenu()">Retour aux séries</button></div>${_disc()}`;
  }
  function _runHtml() {
    const it = run.items[run.i], n = run.items.length;
    const fb = run.checked ? `<div class="dz-fb ${run.ok ? 'ok' : 'bad'}"><b>${run.ok ? '✓ Juste' : '✗ Pas tout à fait'}</b>
        <p>${run.ok ? 'Ta réponse : ' : 'Ta réponse : ' + _esc(fr(run.x)) + ' ' + _esc(it.unit) + ' · '}${run.ok ? '' : 'attendu : '}<b>${_esc(fr(it.ans))} ${_esc(it.unit)}</b></p>
        ${run.hint ? `<p class="dz-hint">💡 ${_esc(run.hint)}</p>` : ''}
        <div class="dz-steps"><b>Le détail :</b><ol>${it.steps.map(s => `<li>${_esc(s)}</li>`).join('')}</ol></div>
        <p class="dz-tip">🧠 ${_esc(it.tip)}</p></div>
        <div class="dz-row"><button type="button" class="btn btn-primary" onclick="App.Dose.next()">${run.i + 1 < n ? 'Calcul suivant →' : 'Voir mon résultat →'}</button></div>` : '';
    return `<div class="dz-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Dose.quit()">← Quitter</button><div class="dz-bar-t">${_esc(_catName(run.cat))} · ${LVL[run.lvl]}</div></div>
      <div class="dz-prog"><i style="width:${Math.round(run.i / n * 100)}%"></i></div><div class="dz-muted dz-small">Calcul ${run.i + 1} sur ${n} · ${run.score} juste${run.score > 1 ? 's' : ''}</div>
      <div class="dz-card dz-q"><div class="dz-q-cat">${_esc((CATS.find(c => c.id === it.cat) || {}).ico || '')} ${_esc(_catName(it.cat))}</div><p class="dz-q-t">${_fmtB(it.text)}</p>
        <form class="dz-form" onsubmit="return App.Dose.submit(event)"><label class="dz-lbl" for="dz-ans">Ta réponse en <b>${_esc(it.unit)}</b></label>
          <div class="dz-ansrow"><input id="dz-ans" class="dz-input" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${_esc(run.val)}" ${run.checked ? 'readonly' : ''} oninput="App.Dose.typeVal(this.value)"><span class="dz-unit">${_esc(it.unit)}</span>
          ${run.checked ? '' : '<button type="submit" class="btn btn-primary">Valider</button>'}</div>
          ${run.warn ? `<div class="dz-warn" role="alert">${_esc(run.warn)}</div>` : ''}</form>
        <details class="dz-brouillon"><summary>📝 Brouillon (pour poser ton calcul)</summary><textarea class="dz-ta" rows="4" maxlength="1500" placeholder="Pose ton calcul ici : il n'est pas corrigé." oninput="App.Dose.typeNote(this.value)">${_esc(run.note)}</textarea></details>
        ${fb}</div>${_disc()}`;
  }
  function _resultHtml() {
    const r = _res;
    const msg = r.pct >= 85 ? 'Très bien : tu maîtrises ce niveau. Passe au niveau suivant ou change de thème.' : r.pct >= 60 ? 'Correct, mais il reste des erreurs à comprendre : relis les formules et refais une série.' : 'À retravailler : reprends les formules, pose chaque étape sur ton brouillon, puis refais une série.';
    const wrong = r.items.map((it, i) => ({ it, ok: r.log[i] && r.log[i].ok })).filter(x => !x.ok);
    const rev = wrong.length ? `<h3 class="dz-h">À revoir</h3>${wrong.map(x => `<div class="dz-card"><p class="dz-q-t">${_fmtB(x.it.text)}</p><p>Réponse : <b>${_esc(fr(x.it.ans))} ${_esc(x.it.unit)}</b></p><ol class="dz-ol">${x.it.steps.map(s => `<li>${_esc(s)}</li>`).join('')}</ol></div>`).join('')}` : '<p>🎉 Aucune erreur dans cette série.</p>';
    return `<div class="dz-bar"><button type="button" class="btn btn-ghost btn-sm" onclick="App.Dose.toMenu()">← Menu</button></div><h2 class="dz-title">Résultat</h2>
      <div class="dz-card dz-res"><div class="dz-score ${_cls(r.pct)}">${r.score}<small>/${r.total}</small></div><div class="dz-pct ${_cls(r.pct)}">${r.pct} %</div><p>${_esc(msg)}</p><p class="dz-muted dz-small">${_esc(_catName(r.cat))} · ${LVL[r.lvl]} · meilleur score : ${P.best[r.cat + '|' + r.lvl]} %</p></div>
      ${rev}<div class="dz-row"><button type="button" class="btn btn-primary" onclick="App.Dose.start()">🔁 Nouvelle série</button><button type="button" class="btn btn-ghost" onclick="App.Dose.fiche()">📖 Formules</button><button type="button" class="btn btn-ghost" onclick="App.Dose.toMenu()">Menu</button></div>${_disc()}`;
  }

  return {
    open, close, toMenu, fiche, setCat, setLvl, start, submit, next, quit, typeVal, typeNote, clearMiss, isTraining,
    _t: { state: () => ({ screen, run, cfg, P }), gen: (cat, lvl) => _make(cat, lvl), cats: CATS.map(c => c.id), parse: _parse }
  };
})();
