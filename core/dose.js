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
        const p = pick([0.1, 0.2, 0.25, 0.5, 1, 2, 3, 4, 5, 10, 15, 20]), c = p * 10; return { text: `Une solution à **${fr(p)} %** : quelle est sa concentration en **mg/mL** ?`, ans: c, unit: 'mg/mL', tol: 0.005,
          steps: [`${fr(p)} % = ${fr(p)} g pour 100 mL = ${fr(p * 1000)} mg pour 100 mL.`, `Pour 1 mL : ${fr(p * 1000)} ÷ 100 = ${fr(c)} mg/mL.`], tip: 'Astuce : % × 10 = mg/mL (1 % = 10 mg/mL).' };
      }
    },
    insuline(l) {
      for (let k = 0; k < 300; k++) {
        if (l === 1) { const ui = pick([4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 22, 24, 28, 30, 35, 40]), v = ui / 100;
          return { text: `Insuline **U100** (100 UI par mL). Prescription : **${ui} UI**. Quel volume en **mL** (seringue à insuline) ?`, ans: v, unit: 'mL', tol: 0.0005,
            steps: [`100 UI sont dans 1 mL.`, `${ui} UI = ${ui} ÷ 100 = ${fr(v)} mL.`], tip: 'En pratique on lit des unités sur la seringue ou le stylo, pas des mL. L\'insuline est à haut risque : double contrôle, jamais de dose « à l\'œil ».' }; }
        if (l === 2) { const ml = pick([0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.14, 0.15, 0.18, 0.2, 0.22, 0.25, 0.28, 0.3, 0.35, 0.4]), ui = ml * 100;
          return { text: `Seringue à insuline **U100** : tu as prélevé **${fr(ml)} mL**. Combien d'**unités (UI)** est-ce ?`, ans: ui, unit: 'UI', tol: 0.05,
            steps: [`1 mL = 100 UI.`, `${fr(ml)} × 100 = ${fr(ui)} UI.`], tip: 'U100 : × 100 pour passer des mL aux UI, ÷ 100 pour l\'inverse.' }; }
        const n = pick([2, 3, 4]), tot = pick([12, 18, 24, 30, 36, 40, 60]), per = tot / n; if (!nice(per, 1)) continue;
        return { text: `Prescription d'insuline : **${tot} UI par jour en ${n} injections égales**. Combien d'**UI par injection** ?`, ans: per, unit: 'UI', tol: 0.05,
          steps: [`${tot} UI ÷ ${n} injections = ${fr(per)} UI par injection.`], tip: 'Division simple, mais en vrai on vérifie TOUJOURS la prescription et le schéma écrit : insuline = médicament à haut risque.' };
      }
    }
  };
  // ══ Niveaux 4 et 5 : calculs « de réa / de service » (plusieurs étapes, unités mélangées, données inutiles à écarter) ══
  const _ctx = (l, kg) => l < 5 ? '' : pick([` (${ri(58, 84)} ans, ${(1.5 + Math.random() * 0.35).toFixed(2).replace('.', ',')} m${kg ? ', **' + kg + ' kg**' : ''})`, ` (allergique à la pénicilline, créatinine normale${kg ? ', **' + kg + ' kg**' : ''})`, ` (admis hier soir${kg ? ', **' + kg + ' kg**' : ''})`]);
  const _ctxKid = l => l < 5 ? '' : pick([` (${ri(2, 11)} ans, vaccins à jour)`, ' (admis aux urgences pédiatriques, pas d\'allergie connue)', ` (${ri(2, 11)} ans, hospitalisé pour une pneumopathie)`]);
  const _ceil = x => Math.ceil(x - 1e-9);
  const EXP = {
    conv(l) {
      for (let k = 0; k < 400; k++) {
        const t = ri(1, l === 4 ? 3 : 4);
        if (t === 1) { const v = pick([25, 50, 75, 100, 150, 250, 500, 20, 40]), ans = v * 60 / 1000; if (!nice(ans, 4)) continue;
          return { text: `Convertis **${v} µg/min** en **mg/h**.`, ans, unit: 'mg/h', tol: 1e-6, steps: [`Par heure : ${v} µg/min × 60 = ${v * 60} µg/h.`, `En mg : ${v * 60} ÷ 1000 = ${fr(ans)} mg/h.`], tip: 'Deux changements d\'unité à la fois : minutes → heures (× 60) et µg → mg (÷ 1000). Fais-les l\'un après l\'autre.', alt: [{ v: v / 1000, msg: 'Tu as oublié de passer des minutes aux heures (× 60).' }, { v: v * 60, msg: 'Tu as oublié de passer des µg aux mg (÷ 1000).' }] }; }
        if (t === 2) { const v = pick([0.6, 1.2, 3, 6, 9, 12, 1.8, 2.4]), ans = v * 1000 / 60; if (!nice(ans, 3)) continue;
          return { text: `Convertis **${fr(v)} mg/h** en **µg/min**.`, ans, unit: 'µg/min', tol: 0.01, steps: [`En µg : ${fr(v)} mg × 1000 = ${fr(v * 1000)} µg/h.`, `Par minute : ${fr(v * 1000)} ÷ 60 = ${fr(ans)} µg/min.`], tip: 'Dans l\'autre sens : mg → µg (× 1000) et heures → minutes (÷ 60).' }; }
        if (t === 3) { const d = pick([0.05, 0.1, 0.2, 0.5, 1, 2]), kg = pick([50, 60, 70, 80, 90, 100]), ans = d * kg; if (!nice(ans, 3)) continue;
          return { text: `Dose de **${fr(d)} µg/kg/min** pour un patient de **${kg} kg**. Quelle dose en **µg/min** ?${_ctx(l, 0)}`, ans, unit: 'µg/min', tol: 0.005, steps: [`Dose = dose par kg × poids : ${fr(d)} × ${kg} = ${fr(ans)} µg/min.`], tip: 'µg/kg/min : on multiplie par le poids pour avoir la dose totale par minute.' }; }
        const d = pick([0.05, 0.1, 0.2, 0.3, 0.5]), kg = pick([50, 60, 70, 80, 90]), ans = d * kg * 60 / 1000; if (!nice(ans, 3)) continue;
        return { text: `Patient de **${kg} kg** sous **${fr(d)} µg/kg/min**. Quelle dose en **mg/h** ?${_ctx(l, 0)}`, ans, unit: 'mg/h', tol: 0.002, steps: [`Par minute : ${fr(d)} × ${kg} = ${fr(d * kg)} µg/min.`, `Par heure : × 60 = ${fr(d * kg * 60)} µg/h.`, `En mg : ÷ 1000 = ${fr(ans)} mg/h.`], tip: 'Chaîne à suivre : poids → minutes en heures → µg en mg.' };
      }
    },
    cp(l) {
      for (let k = 0; k < 400; k++) {
        const who = pick(NAMES);
        if (l === 4) { const [dn, , ds] = pick(DRUGS_CP), D = pick(ds), per = pick([1, 2, 0.5, 1.5]), n = pick([1, 2, 3, 4]), days = pick([7, 10, 14, 15, 21, 28]), box = pick([14, 20, 28, 30, 50, 100]);
          const tot = per * n * days; if (!nice(tot, 2)) continue; const boxes = _ceil(tot / box);
          return { text: `${who} : **${dn} ${fr(D)} mg**, **${fr(per)} comprimé${per > 1 ? 's' : ''} ${n} fois par jour pendant ${days} jours**. Les boîtes contiennent **${box} comprimés**. Combien de **boîtes** faut-il délivrer (au minimum) ?`, ans: boxes, unit: 'boîte(s)', tol: 0.001,
            steps: [`Comprimés par jour : ${fr(per)} × ${n} = ${fr(per * n)}.`, `Sur ${days} jours : ${fr(per * n)} × ${days} = ${fr(tot)} comprimés.`, `Boîtes : ${fr(tot)} ÷ ${box} = ${fr(tot / box)} → on arrondit au NOMBRE ENTIER SUPÉRIEUR : ${boxes} boîte(s).`], tip: 'Quand on compte des boîtes, on arrondit toujours vers le haut (on ne peut pas délivrer une demi-boîte ni manquer de comprimés).', alt: [{ v: Math.round(tot / box), msg: 'Tu as arrondi au plus proche : ici il faut arrondir vers le haut.' }] }; }
        // niveau 5 : AVK quadrisécable ou dose au poids
        if (Math.random() < 0.5) { const D = pick([5, 20]), quarts = pick([1, 2, 3, 4, 5, 6, 7, 8, 10]), dose = D * quarts / 4; if (!nice(dose, 2)) continue;
          return { text: `${who} sous anticoagulant oral. **Comprimé quadrisécable dosé à ${D} mg**. Prescription du jour : **${fr(dose)} mg**. Combien de **quarts de comprimé** donnes-tu ?${_ctx(l, 0)}`, ans: quarts, unit: 'quart(s)', tol: 0.001,
            steps: [`Un quart de comprimé = ${D} ÷ 4 = ${fr(D / 4)} mg.`, `Nombre de quarts : ${fr(dose)} ÷ ${fr(D / 4)} = ${quarts}.`, `Soit ${fr(quarts / 4)} comprimé.`], tip: 'Avant de couper un comprimé : vérifier qu\'il est sécable et la prescription. Les anticoagulants oraux sont des médicaments à haut risque : double contrôle.', alt: [{ v: dose / D, msg: 'Tu as donné la réponse en comprimés entiers : on te demande des QUARTS.' }] }; }
        const mk = pick([0.5, 1, 0.25]), kg = pick([48, 56, 60, 64, 72, 80]), D = pick([5, 20, 40]), tot = mk * kg, cp = tot / D; if (!nice(cp * 2, 6) || cp * 2 !== Math.round(cp * 2) || cp < 0.5 || cp > 8) continue;
        return { text: `${who} (**${kg} kg**) : corticoïde à **${fr(mk)} mg/kg/jour en une prise**. Comprimés à **${D} mg**. Combien de comprimés par jour ?${_ctx(l, 0)}`, ans: cp, unit: 'comprimé(s)', tol: 0.001,
          steps: [`Dose du jour : ${fr(mk)} × ${kg} = ${fr(tot)} mg.`, `Comprimés : ${fr(tot)} ÷ ${D} = ${fr(cp)}.`], tip: 'Dose du jour (mg) = mg/kg × poids ; puis ÷ dosage du comprimé.' };
      }
    },
    liq(l) {
      for (let k = 0; k < 500; k++) {
        const [dn, A, B] = pick(DRUGS_INJ), who = pick(NAMES);
        if (l === 4) { const f = pick([0.5, 0.75, 1.25, 1.5, 2.5, 3.5]), dose = A * f, vol = B * f, fin = pick([5, 10, 20]); if (!nice(vol, 2) || !nice(dose, 2) || vol >= fin) continue; const eau = fin - vol;
          return { text: `${who} : **${dn} ${fr(dose)} mg** en injection lente, à diluer pour obtenir **${fin} mL** au total avec du NaCl 0,9 %. Ampoule : **${fr(A)} mg dans ${fr(B)} mL**. Quel volume de **NaCl 0,9 %** ajoutes-tu à la dose prélevée ?`, ans: eau, unit: 'mL', tol: 0.01,
            steps: [`Volume d'ampoule à prélever : (${fr(dose)} × ${fr(B)}) ÷ ${fr(A)} = ${fr(vol)} mL.`, `Pour arriver à ${fin} mL : ${fin} − ${fr(vol)} = ${fr(eau)} mL de NaCl 0,9 %.`], tip: 'Deux temps : (1) le volume de médicament, (2) le solvant = volume final − volume de médicament.', alt: [{ v: vol, msg: 'Tu as donné le volume de médicament à prélever ; on demande le volume de NaCl à AJOUTER.' }] }; }
        const mk = pick([60, 90, 100, 150]), kg = pick([12, 15, 18, 20, 24, 30, 36, 45, 60]), n = pick([2, 3, 4]), per = mk * kg / n, conc = 100;
        if (!nice(per, 1) || per / conc < 1 || per / conc > 20) continue; const vol = per / conc;
        return { text: `Enfant de **${kg} kg**. Antibiotique IV **${mk} mg/kg/jour en ${n} injections**. Flacon de poudre de **1 g reconstitué pour obtenir 10 mL** (soit ${conc} mg/mL). Quel volume prélèves-tu pour **une injection** ?${_ctxKid(l)}`, ans: vol, unit: 'mL', tol: 0.05,
          steps: [`Dose du jour : ${mk} × ${kg} = ${fr(mk * kg)} mg.`, `Par injection : ${fr(mk * kg)} ÷ ${n} = ${fr(per)} mg.`, `Concentration : 1 g = 1000 mg dans 10 mL → ${conc} mg/mL.`, `Volume : ${fr(per)} ÷ ${conc} = ${fr(vol)} mL.`], tip: 'Quatre étapes : dose du jour → dose par injection → concentration après reconstitution → volume.' };
      }
    },
    poids(l) {
      for (let k = 0; k < 500; k++) {
        const kid = pick(KIDS), kg = pick([8, 10, 12, 15, 16, 18, 20, 24, 25, 30, 35]);
        if (l === 4) { const mk = pick([10, 15]), pr = pick([3, 4]), c = pick([120, 240]), vf = 5, per = mk * kg, vol = per * vf / c; if (!nice(vol, 1) || vol < 1 || vol > 20) continue; const jour = per * pr, max = 60 * kg;
          return { text: `${kid} (**${kg} kg**) : paracétamol **${mk} mg/kg par prise, ${pr} prises par jour** (dose maximale : 60 mg/kg/jour). Sirop à **${c} mg pour ${vf} mL**. Quel volume de sirop par prise ?`, ans: vol, unit: 'mL', tol: 0.05,
            steps: [`Dose par prise : ${mk} × ${kg} = ${per} mg.`, `Vérification : ${per} × ${pr} = ${jour} mg/jour, ${jour <= max ? 'inférieur ou égal à' : 'SUPÉRIEUR à'} la dose maximale (${max} mg).`, `Volume : (${per} × ${vf}) ÷ ${c} = ${fr(vol)} mL.`], tip: 'Un calcul de dose pédiatrique inclut toujours la vérification de la dose maximale par jour.' }; }
        const mxk = pick([60, 80, 100]), done = pick([200, 300, 400, 500, 600, 750, 900, 1000, 1200]), lim = mxk * kg; if (done >= lim) continue;
        return { text: `${kid} (**${kg} kg**). Dose maximale **${mxk} mg/kg/jour**. Il a déjà reçu **${done} mg** aujourd'hui. Quelle **quantité maximale** peut-il encore recevoir aujourd'hui ?${_ctxKid(l)}`, ans: lim - done, unit: 'mg', tol: 0.5,
          steps: [`Dose maximale du jour : ${mxk} × ${kg} = ${lim} mg.`, `Reste : ${lim} − ${done} = ${lim - done} mg.`], tip: 'Dose maximale = mg/kg/jour × poids. On soustrait ensuite ce qui a déjà été donné (feuille de soins) avant d\'administrer.' };
      }
    },
    gravite(l) {
      for (let k = 0; k < 500; k++) {
        const who = pick(NAMES);
        if (l === 4) { const V = pick([500, 1000]), h = pick([6, 8, 10, 12]), t = pick([2, 3, 4]), restH = h - t, fct = 20; if (restH <= 0) continue;
          const R = V - Math.round(V / h * (t - pick([0.5, 1]))); const rest = R; if (rest <= 0 || rest > V) continue; const raw = rest * fct / (restH * 60), ans = Math.round(raw);
          return { text: `${who} : perfusion de **${V} mL prévue en ${h} h** par gravité (perfuseur **${fct} gouttes = 1 mL**). Au bout de **${t} h**, il reste **${rest} mL** dans la poche : la perfusion a pris du retard. Quel **débit en gouttes/min** pour finir à l'heure prévue ?`, ans, unit: 'gouttes/min', tol: 1,
            steps: [`Temps restant : ${h} − ${t} = ${restH} h = ${restH * 60} min.`, `Gouttes restantes : ${rest} × ${fct} = ${rest * fct}.`, `Débit : ${rest * fct} ÷ ${restH * 60} = ${fr(raw)} → environ ${ans} gouttes/min.`], tip: 'Un retard se rattrape en recalculant sur ce qu\'il RESTE (volume restant, temps restant). Jamais de rattrapage brutal : on vérifie la tolérance du patient et le protocole du service.' }; }
        const V = pick([250, 500]), mg = pick([1000, 2000, 2500, 4000]), perH = pick([250, 500, 400, 200, 125]), conc = mg / V, qml = perH / conc, fct = pick([20, 60]); if (!nice(qml, 1) || qml > 250) continue; const gtt = qml * fct / 60, ans = Math.round(gtt);
        return { text: `${who} : poche de **${V} mL contenant ${fr(mg)} mg** de médicament. Prescription : **${perH} mg/h**. Perfuseur **${fct} gouttes = 1 mL**. Quel débit en **gouttes/min** (arrondi) ?${_ctx(l, 0)}`, ans, unit: 'gouttes/min', tol: 1,
          steps: [`Concentration : ${fr(mg)} ÷ ${V} = ${fr(conc)} mg/mL.`, `Débit : ${perH} ÷ ${fr(conc)} = ${fr(qml)} mL/h.`, `Gouttes/min : ${fr(qml)} × ${fct} ÷ 60 = ${fr(gtt)} → environ ${ans}.`], tip: `mg/h → mL/h (÷ concentration) → gouttes/min (× gouttes par mL ÷ 60).${fct === 60 ? ' Avec 60 gouttes/mL, gouttes/min = mL/h.' : ''}` };
      }
    },
    pse(l) {
      for (let k = 0; k < 600; k++) {
        const who = pick(NAMES);
        if (l === 4) { const [dn, mg, V] = pick([['furosémide', 500, 50], ['morphine', 50, 50], ['midazolam', 100, 50], ['héparine (UI)', 25000, 50], ['noradrénaline', 8, 50]]), conc = mg / V, dose = pick([conc * 2, conc * 5, conc * 4, conc * 8, conc * 10]); if (!nice(conc, 3) || !nice(dose, 3)) continue; const ans = dose / conc; const u = dn.includes('UI') ? 'UI' : 'mg';
          return { text: `${who} : seringue électrique de **${V} mL contenant ${fr(mg)} ${u}** de ${dn.replace(' (UI)', '')}. Prescription : **${fr(dose)} ${u}/h**. Quel **débit en mL/h** ?`, ans, unit: 'mL/h', tol: 0.02,
            steps: [`Concentration : ${fr(mg)} ÷ ${V} = ${fr(conc)} ${u}/mL.`, `Débit : ${fr(dose)} ÷ ${fr(conc)} = ${fr(ans)} mL/h.`], tip: 'Toujours : concentration d\'abord (quantité ÷ volume), puis débit = dose par heure ÷ concentration.', alt: [{ v: dose * conc, msg: 'Tu as multiplié par la concentration : il faut DIVISER (dose par heure ÷ concentration).' }] }; }
        const d = pick([0.05, 0.1, 0.2, 0.3, 0.5]), kg = pick([50, 60, 70, 75, 80, 90, 100]), mg = pick([4, 5, 8, 10]), V = 50, conc = mg * 1000 / V, ans = d * kg * 60 / conc; if (!nice(ans, 1)) continue;
        return { text: `${who} (**${kg} kg**) en réanimation : noradrénaline à **${fr(d)} µg/kg/min**. Seringue électrique : **${mg} mg dans ${V} mL**. Quel **débit en mL/h** ?${_ctx(l, 0)}`, ans, unit: 'mL/h', tol: 0.05,
          steps: [`Dose par minute : ${fr(d)} × ${kg} = ${fr(d * kg)} µg/min.`, `Par heure : × 60 = ${fr(d * kg * 60)} µg/h.`, `Concentration : ${mg} mg = ${mg * 1000} µg dans ${V} mL → ${fr(conc)} µg/mL.`, `Débit : ${fr(d * kg * 60)} ÷ ${fr(conc)} = ${fr(ans)} mL/h.`], tip: 'Chaîne µg/kg/min → mL/h : × poids, × 60, puis ÷ concentration en µg/mL (attention : mg → µg, × 1000).' };
      }
    },
    pct(l) {
      for (let k = 0; k < 500; k++) {
        if (l === 4) { const [nm, p] = pick([['glucose', 30], ['glucose', 10], ['NaCl', 10], ['chlorure de calcium', 10]]), g = pick([2, 3, 4, 5, 6, 7.5, 10, 15, 20]), vol = g * 100 / p; if (!nice(vol, 1)) continue;
          return { text: `Tu dois administrer **${fr(g)} g de ${nm}**. Tu disposes d'une solution à **${p} %**. Quel **volume** prélèves-tu ?`, ans: vol, unit: 'mL', tol: 0.05, steps: [`${p} % = ${p} g pour 100 mL.`, `Volume = (${fr(g)} × 100) ÷ ${p} = ${fr(vol)} mL.`], tip: 'Volume (mL) = quantité (g) × 100 ÷ pourcentage.' }; }
        const p1 = pick([30, 20, 10]), p2 = pick([2.5, 5, 10]), V = pick([100, 200, 250, 500, 1000]); if (p2 >= p1) continue; const v1 = V * p2 / p1; if (!nice(v1, 1)) continue; const eau = V - v1;
        return { text: `On veut préparer **${V} mL de glucose à ${fr(p2)} %** à partir de **glucose à ${p1} %** et d'eau pour préparations injectables. Quel volume de **glucose à ${p1} %** prélèves-tu ?${_ctx(l, 0)}`, ans: v1, unit: 'mL', tol: 0.1,
          steps: [`Quantité de glucose voulue : ${fr(p2)} g pour 100 mL → ${fr(V * p2 / 100)} g pour ${V} mL.`, `Volume de solution à ${p1} % : (${fr(V * p2 / 100)} × 100) ÷ ${p1} = ${fr(v1)} mL.`, `(On complète avec ${fr(eau)} mL d'eau.)`], tip: 'Dilution : C₁ × V₁ = C₂ × V₂. Ici V₁ = (V₂ × C₂) ÷ C₁.' };
      }
    },
    insuline(l) {
      for (let k = 0; k < 500; k++) {
        if (l === 4) { const G = pick([2.2, 2.6, 3, 3.4, 4, 2.8]), T = pick([1.2, 1.4, 1.5, 1.8]), f = pick([0.3, 0.5, 0.6, 0.4]), ui = (G - T) / f; if (G <= T || !nice(ui, 1)) continue;
          return { text: `Protocole fictif : **1 UI d'insuline rapide baisse la glycémie de ${fr(f)} g/L**. Glycémie à **${fr(G)} g/L**, objectif **${fr(T)} g/L**. Combien d'**UI de correction** ?`, ans: ui, unit: 'UI', tol: 0.05,
            steps: [`Écart à corriger : ${fr(G)} − ${fr(T)} = ${fr(G - T)} g/L.`, `UI : ${fr(G - T)} ÷ ${fr(f)} = ${fr(ui)} UI.`], tip: 'En vrai, la dose vient de la prescription / du protocole du service, pas d\'un calcul personnel : double contrôle systématique.' }; }
        const g = pick([40, 50, 60, 70, 80, 90]), r = pick([8, 10, 12]), G = pick([2.2, 2.6, 3, 3.4]), T = 1.4, f = pick([0.4, 0.5]); const rep = g / r, cor = (G - T) / f, tot = rep + cor; if (!nice(rep, 2) || !nice(cor, 2) || !nice(tot, 2)) continue;
        if (Math.random() < 0.5) return { text: `Protocole fictif : **1 UI pour ${r} g de glucides** (repas) et **1 UI baisse la glycémie de ${fr(f)} g/L** (correction, objectif ${fr(T)} g/L). Repas de **${g} g de glucides**, glycémie à **${fr(G)} g/L**. **Total d'UI** à injecter ?`, ans: tot, unit: 'UI', tol: 0.05,
          steps: [`Insuline du repas : ${g} ÷ ${r} = ${fr(rep)} UI.`, `Correction : (${fr(G)} − ${fr(T)}) ÷ ${fr(f)} = ${fr(cor)} UI.`, `Total : ${fr(rep)} + ${fr(cor)} = ${fr(tot)} UI.`], tip: 'Deux calculs à additionner : repas + correction. Insuline = médicament à haut risque : relis la prescription en entier, double contrôle.' };
        const kg = pick([50, 60, 70, 80, 90]), q = pick([0.05, 0.1]), ans = q * kg; if (!nice(ans, 2)) continue;
        return { text: `Insuline rapide en **seringue électrique : 50 UI dans 50 mL** (1 UI/mL). Protocole : **${fr(q)} UI/kg/h**. Patient de **${kg} kg**. Quel **débit en mL/h** ?${_ctx(l, 0)}`, ans, unit: 'mL/h', tol: 0.02,
          steps: [`Dose par heure : ${fr(q)} × ${kg} = ${fr(ans)} UI/h.`, `Concentration : 50 UI ÷ 50 mL = 1 UI/mL.`, `Débit : ${fr(ans)} ÷ 1 = ${fr(ans)} mL/h.`], tip: 'Avec une concentration de 1 UI/mL, le débit en mL/h est égal à la dose en UI/h : c\'est voulu pour limiter les erreurs.' };
      }
    },
    debit(l) {
      for (let k = 0; k < 600; k++) {
        const who = pick(NAMES);
        if (l === 4) { const kg = pick([50, 60, 70, 80, 90, 100]), c = pick([80, 100, 160, 200]), q = pick([3, 4, 5, 6, 8, 10, 12, 15, 20]), d = q * c / (60 * kg); if (!nice(d, 2)) continue;
          return { text: `${who} (**${kg} kg**) : seringue de noradrénaline à **${c} µg/mL**, pompe réglée à **${q} mL/h**. Quelle **dose reçue** en µg/kg/min ?`, ans: d, unit: 'µg/kg/min', tol: 0.005,
            steps: [`Par heure : ${q} × ${c} = ${q * c} µg/h.`, `Par minute : ${q * c} ÷ 60 = ${fr(q * c / 60)} µg/min.`, `Par kg : ${fr(q * c / 60)} ÷ ${kg} = ${fr(d)} µg/kg/min.`], tip: 'Sens inverse du calcul habituel : mL/h × µg/mL = µg/h ; ÷ 60 ; ÷ poids.' }; }
        const q1 = pick([4, 6, 8, 10, 12, 15]), c1 = pick([80, 100]), c2 = pick([160, 200]), q2 = q1 * c1 / c2; if (!nice(q2, 2)) continue;
        return { text: `${who} sous noradrénaline : seringue à **${c1} µg/mL** à **${q1} mL/h**. L'équipe passe à une seringue plus concentrée : **${c2} µg/mL**. Quel **nouveau débit** pour garder la **même dose** ?${_ctx(l, 0)}`, ans: q2, unit: 'mL/h', tol: 0.05,
          steps: [`Dose actuelle : ${q1} × ${c1} = ${q1 * c1} µg/h.`, `Nouveau débit : ${q1 * c1} ÷ ${c2} = ${fr(q2)} mL/h.`], tip: 'Relais de seringue : la dose (µg/h) ne change pas. Si la concentration augmente, le débit diminue dans la même proportion. Relais fait avec double contrôle et sans interrompre le débit.', alt: [{ v: q1 * c2 / c1, msg: 'Tu as inversé le rapport : une seringue plus concentrée doit passer plus LENTEMENT.' }] };
      }
    },
    dilu(l) {
      for (let k = 0; k < 600; k++) {
        if (l === 4) { const c0 = pick([1000, 500, 100, 50]), n1 = pick([10, 5, 2, 4]), n2 = pick([10, 5, 2]), cf = c0 / (n1 * n2); if (!nice(cf, 3)) continue;
          return { text: `Solution mère à **${c0} µg/mL**. On réalise **deux dilutions successives** : d'abord **1 volume pour ${n1}**, puis le résultat est dilué **1 volume pour ${n2}**. Quelle **concentration finale** (µg/mL) ?`, ans: cf, unit: 'µg/mL', tol: Math.max(0.005, cf * 1e-4),
            steps: [`Après la 1re dilution : ${c0} ÷ ${n1} = ${fr(c0 / n1)} µg/mL.`, `Après la 2e : ${fr(c0 / n1)} ÷ ${n2} = ${fr(cf)} µg/mL.`], tip: 'Dilutions successives : on divise la concentration par chaque facteur, l\'un après l\'autre (facteur total = n₁ × n₂).' }; }
        const mg = pick([1, 0.1, 0.5]), n = pick([10, 5]), dose = pick([0.05, 0.1, 0.2, 0.25, 0.5]), cf = mg / n; const vol = dose / cf; if (!nice(vol, 2) || vol > 8 || dose >= mg) continue; // ampoule c mg/mL
        return { text: `Ampoule de **${fr(mg)} mg dans 1 mL**. Tu en prélèves **1 mL** que tu complètes à **${n} mL** avec du NaCl 0,9 % (solution **diluée**). La prescription est de **${fr(dose)} mg**${l === 5 ? ' (urgence : arrêt cardio-respiratoire, protocole fictif)' : ''}. Quel **volume de solution diluée** injectes-tu ?`, ans: vol, unit: 'mL', tol: 0.02,
          steps: [`Concentration après dilution : ${fr(mg)} mg ÷ ${n} mL = ${fr(cf)} mg/mL.`, `Volume : ${fr(dose)} ÷ ${fr(cf)} = ${fr(vol)} mL.`], tip: 'Toujours recalculer la concentration APRÈS dilution avant de calculer le volume à injecter. En urgence réelle : protocole affiché, lecture à voix haute et double contrôle.', alt: [{ v: dose / mg, msg: 'Tu as utilisé la concentration de l\'ampoule : la solution a été diluée, utilise la concentration APRÈS dilution.' }] };
      }
    }
  };
  // Nouveaux thèmes : niveaux 1 à 3
  GEN.debit = function (l) {
    for (let k = 0; k < 400; k++) {
      const who = pick(NAMES), kg = pick([50, 60, 70, 80, 90]), d = pick([2, 3, 5, 8, 10]);
      if (l === 1) return { text: `${who} (**${kg} kg**) : dopamine à **${d} µg/kg/min**. Quelle dose en **µg/min** ?`, ans: d * kg, unit: 'µg/min', tol: 0.05, steps: [`Dose = ${d} × ${kg} = ${d * kg} µg/min.`], tip: 'µg/kg/min × poids (kg) = µg/min.' };
      if (l === 2) { const ans = d * kg * 60 / 1000; if (!nice(ans, 3)) continue; return { text: `${who} (**${kg} kg**) : dopamine à **${d} µg/kg/min**. Quelle dose en **mg/h** ?`, ans, unit: 'mg/h', tol: 0.005, steps: [`Par minute : ${d} × ${kg} = ${d * kg} µg/min.`, `Par heure : × 60 = ${d * kg * 60} µg/h = ${fr(ans)} mg/h.`], tip: '× poids, × 60 (min → h), ÷ 1000 (µg → mg).' }; }
      const c = pick([1, 2, 4, 5]), mgh = d * kg * 60 / 1000, ans = mgh / c; if (!nice(ans, 2)) continue;
      return { text: `${who} (**${kg} kg**) : dopamine à **${d} µg/kg/min**. Seringue à **${c} mg/mL**. Quel **débit en mL/h** ?`, ans, unit: 'mL/h', tol: 0.02, steps: [`Dose : ${d} × ${kg} × 60 ÷ 1000 = ${fr(mgh)} mg/h.`, `Débit : ${fr(mgh)} ÷ ${c} = ${fr(ans)} mL/h.`], tip: 'µg/kg/min → mg/h (× poids × 60 ÷ 1000) puis ÷ concentration (mg/mL) = mL/h.' };
    }
  };
  GEN.dilu = function (l) {
    for (let k = 0; k < 400; k++) {
      if (l === 1) { const c = pick([10, 20, 50, 100]), v = pick([1, 2, 5]), Vf = pick([10, 20, 50]); const ans = c * v / Vf; if (!nice(ans, 3) || v >= Vf) continue;
        return { text: `Solution à **${c} mg/mL**. Tu prélèves **${v} mL** et tu complètes à **${Vf} mL**. Quelle est la **concentration finale** ?`, ans, unit: 'mg/mL', tol: 0.005, steps: [`Quantité : ${c} × ${v} = ${c * v} mg.`, `Concentration : ${c * v} ÷ ${Vf} = ${fr(ans)} mg/mL.`], tip: 'La quantité de médicament ne change pas quand on dilue : seul le volume augmente.' }; }
      if (l === 2) { const c1 = pick([10, 20, 40, 50]), c2 = pick([1, 2, 4, 5]), Vf = pick([10, 20, 50]), v = Vf * c2 / c1; if (c2 >= c1 || !nice(v, 2) || v >= Vf) continue; const eau = Vf - v;
        return { text: `Tu veux **${Vf} mL à ${c2} mg/mL** à partir d'une solution à **${c1} mg/mL**. Quel volume d'**eau** ajoutes-tu à la solution prélevée ?`, ans: eau, unit: 'mL', tol: 0.01, steps: [`Solution à prélever : (${Vf} × ${c2}) ÷ ${c1} = ${fr(v)} mL.`, `Eau à ajouter : ${Vf} − ${fr(v)} = ${fr(eau)} mL.`], tip: 'C₁ × V₁ = C₂ × V₂, puis eau = volume final − V₁.', alt: [{ v: v, msg: 'Tu as donné le volume de solution mère ; on demande l\'eau à ajouter.' }] }; }
      const mg = pick([100, 250, 500, 750, 1000, 2000]), sol = pick([2, 3, 4, 5, 8, 10, 15, 20]), add = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2]), Vf = sol + add, c = mg / Vf; if (!nice(c, 2)) continue;
      return { text: `Flacon de poudre de **${mg} mg**. Tu ajoutes **${fr(sol)} mL de solvant** ; la poudre occupe **${fr(add)} mL** : le volume final est donc de **${fr(Vf)} mL**. Quelle est la **concentration** obtenue (mg/mL) ?`, ans: c, unit: 'mg/mL', tol: 0.02, steps: [`Volume final : ${fr(sol)} + ${fr(add)} = ${fr(Vf)} mL.`, `Concentration : ${mg} ÷ ${fr(Vf)} = ${fr(c)} mg/mL.`], tip: 'Pour une poudre, le volume final = solvant + volume pris par la poudre : lis la notice du flacon (tableau de reconstitution).' };
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
    { id: 'insuline', ico: '🩸', name: 'Insuline (UI)', desc: 'UI, U100, corrections, IVSE' },
    { id: 'debit', ico: '📈', name: 'µg/kg/min', desc: 'Doses par minute et par kg, relais de seringue' },
    { id: 'dilu', ico: '🧪', name: 'Dilutions', desc: 'Dilutions, poudres à reconstituer' }
  ];
  const LVL = { 1: 'Débutant', 2: 'Intermédiaire', 3: 'Avancé', 4: 'Expert', 5: 'Réa / complexe' };

  const FICHES = [
    { t: 'La règle de trois (produit en croix)', p: "Quand tu connais la quantité d'un produit dans un certain volume, tu cherches le volume pour une autre quantité.\n**Exemple** : ampoule de 20 mg dans 2 mL ; prescription 30 mg → (30 × 2) ÷ 20 = **3 mL**.\nOn multiplie en diagonale, on divise par le nombre restant. **Toujours la même unité** des deux côtés." },
    { t: 'Les conversions', p: "1 g = 1000 mg · 1 mg = 1000 µg · 1 L = 1000 mL · 1 kg = 1000 g.\nOn descend d'une unité (g → mg → µg) : **× 1000**. On remonte : **÷ 1000**.\nAvant tout calcul : mets les données dans **la même unité**." },
    { t: 'Comprimés et volumes', p: "**Comprimés** = dose prescrite ÷ dosage d'un comprimé.\n**Volume** = (dose × volume de l'ampoule) ÷ quantité de l'ampoule, ou dose ÷ concentration (mg/mL).\nUn résultat étrange (7,3 comprimés, 40 mL pour une injection) doit te faire **relire la prescription**." },
    { t: 'Dose selon le poids', p: "Dose (mg) = dose par kg × poids (kg).\nSi la prescription est « par jour » : calcule d'abord la dose de la journée, puis divise par le nombre de prises." },
    { t: 'Perfusion par gravité', p: "**Gouttes/min = (volume en mL × gouttes par mL) ÷ durée en minutes.**\nMacro-perfuseur courant : 20 gouttes = 1 mL (selon le matériel : lis l'emballage). Microgoutteur : 60 gouttes = 1 mL, donc gouttes/min = mL/h.\nOn arrondit à l'unité." },
    { t: 'Pompe et seringue électrique', p: "**Débit (mL/h) = volume (mL) ÷ durée (h)** · **Durée (h) = volume ÷ débit**.\nSeringue électrique avec une dose horaire : concentration = quantité ÷ volume de la seringue ; **débit (mL/h) = dose par heure (mg/h) ÷ concentration (mg/mL)**." },
    { t: 'Pourcentages', p: "1 % = **1 g pour 100 mL** (solution aqueuse) = 10 mg/mL.\nGlucose 5 % : 5 g pour 100 mL ; une poche de 500 mL contient 25 g." },
    { t: 'µg/kg/min (dopamine, noradrénaline…)', p: "Dose (µg/min) = dose par kg × poids. Pour passer en **mg/h** : × 60 puis ÷ 1000. Pour le **débit en mL/h** : ÷ concentration (mg/mL ou µg/mL, même unité qu'en haut).\n**Chaîne type** : µg/kg/min → × poids → × 60 → ÷ concentration en µg/mL = mL/h.\nRelais de seringue : la dose (µg/h) ne change pas, donc nouveau débit = ancien débit × ancienne concentration ÷ nouvelle concentration." },
    { t: 'Dilutions et poudres', p: "**C₁ × V₁ = C₂ × V₂** : la quantité de médicament ne change pas quand on dilue.\nVolume de solvant à ajouter = volume final − volume de solution prélevée.\nPoudre : volume final = solvant + volume de la poudre (lis la notice). Dilutions successives : on divise par chaque facteur." },
    { t: 'Arrondir : vers le haut ou au plus proche ?', p: "Boîtes, flacons, comprimés à délivrer : toujours **vers le haut**. Gouttes/min : au plus proche (on ne compte pas de fraction de goutte). Doses : respecte la précision de la seringue et de la prescription.\nDose maximale/jour = mg/kg/jour × poids ; on retire ce qui a déjà été donné avant d'administrer." },
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
    for (let t = 0; t < 20; t++) { const p = (lvl >= 4 ? EXP[cat] : GEN[cat])(lvl); if (p && p.ans != null && isFinite(p.ans)) return Object.assign({ cat, lvl }, p); }
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
    const lv = [1, 2, 3, 4, 5].map(l => `<button type="button" class="dz-lvl ${cfg.lvl === l ? 'on' : ''}" aria-pressed="${cfg.lvl === l}" onclick="App.Dose.setLvl(${l})">${LVL[l]}</button>`).join('');
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
