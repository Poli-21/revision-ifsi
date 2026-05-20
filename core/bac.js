// core/bac.js — Entraînement Bac ST2S (CBPH & STSS)
'use strict';
window.App = window.App || {};

App.Bac = (() => {

  // ── Banque de questions ────────────────────────────────────────
  const QUESTIONS = {
    cbph: [
      {
        annee: 'Métropole 2024', theme: 'Diabète de type 2',
        dossier: [
          { id: 'Doc 1', titre: 'Glycémies à jeun d\'un patient de 54 ans (en g/L)',
            texte: 'Janvier : 0,97 g/L | Mars : 1,08 g/L | Juin : 1,32 g/L | Septembre : 1,45 g/L\n\nSeuil de diabète selon l\'OMS : ≥ 1,26 g/L à deux reprises.' },
          { id: 'Doc 2', titre: 'Physiopathologie du diabète de type 2',
            texte: 'Dans le diabète de type 2, les cellules β des îlots de Langerhans du pancréas sécrètent de l\'insuline mais les cellules cibles (foie, muscles, adipocytes) développent une résistance à l\'insuline. Le glucose ne peut plus pénétrer normalement dans les cellules. Progressivement, les cellules β s\'épuisent et la sécrétion d\'insuline diminue.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, justifiez le diagnostic de diabète de type 2 posé en septembre pour ce patient.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2 et vos connaissances, expliquez le mécanisme biologique à l\'origine de l\'hyperglycémie dans le diabète de type 2.' },
          { pts: 3, texte: '3. Proposez deux mesures hygiéno-diététiques permettant de réduire la glycémie. Justifiez leur effet sur la glycémie.' }
        ]
      },
      {
        annee: 'Métropole 2023', theme: 'Réponse immunitaire et vaccination',
        dossier: [
          { id: 'Doc 1', titre: 'Schéma simplifié de la réponse immunitaire adaptative',
            texte: 'Lors d\'une infection, les cellules dendritiques captent l\'antigène et le présentent aux lymphocytes T CD4+. Ces lymphocytes T auxiliaires activent les lymphocytes B qui se différencient en plasmocytes producteurs d\'anticorps. Des lymphocytes T CD8+ cytotoxiques détruisent directement les cellules infectées.' },
          { id: 'Doc 2', titre: 'Taux d\'anticorps anti-tétanos après vaccination (en UI/mL)',
            texte: 'Primo-vaccination (J0) : indétectable → J30 : 0,08 UI/mL\nRappel (M6) : → J30 après rappel : 2,4 UI/mL\nSeuil de protection : 0,01 UI/mL' }
        ],
        questions: [
          { pts: 3, texte: '1. En vous appuyant sur le document 1, décrivez les étapes de la réponse immunitaire adaptative humorale.' },
          { pts: 3, texte: '2. À partir du document 2, comparez la réponse primaire et la réponse secondaire. Expliquez biologiquement la différence observée.' },
          { pts: 2, texte: '3. Expliquez en quoi la vaccination exploite le mécanisme de mémoire immunitaire.' }
        ]
      },
      {
        annee: 'Métropole 2022', theme: 'Solutions et dosages',
        dossier: [
          { id: 'Doc 1', titre: 'Préparation d\'une solution de désinfectant',
            texte: 'Un flacon de Dakin® contient une solution mère de chlore actif à 0,5 % en masse. Pour désinfecter une plaie, le protocole recommande de diluer au 1/10e avant utilisation.' },
          { id: 'Doc 2', titre: 'Données',
            texte: 'Masse molaire du chlore actif : 35,5 g/mol\nVolume de solution fille à préparer : 200 mL\nConcentration massique de la solution mère : 5 g/L' }
        ],
        questions: [
          { pts: 2, texte: '1. Calculez le volume de solution mère nécessaire pour préparer 200 mL de solution fille au 1/10e.' },
          { pts: 2, texte: '2. Calculez la concentration molaire en chlore actif de la solution fille.' },
          { pts: 3, texte: '3. Décrivez le protocole de préparation en laboratoire de cette solution fille en précisant le matériel nécessaire et les étapes dans l\'ordre.' }
        ]
      },
      {
        annee: 'Centres étrangers 2023', theme: 'Athérosclérose et maladies cardiovasculaires',
        dossier: [
          { id: 'Doc 1', titre: 'Formation d\'une plaque d\'athérome',
            texte: 'L\'athérosclérose est caractérisée par l\'accumulation de LDL oxydés dans la paroi des artères. Les macrophages phagocytent ces LDL et forment des cellules spumeuses qui s\'accumulent et forment la plaque d\'athérome, réduisant progressivement la lumière artérielle.' },
          { id: 'Doc 2', titre: 'Facteurs de risque cardiovasculaire du patient M. D., 58 ans',
            texte: 'Cholestérol total : 2,6 g/L (norme < 2,0 g/L) | LDL : 1,8 g/L (norme < 1,6 g/L)\nTabagisme : 25 paquets-années | IMC : 29 kg/m² | HTA : 160/95 mmHg\nAntécédents familiaux : père décédé d\'un infarctus à 52 ans' }
        ],
        questions: [
          { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le mécanisme de formation d\'une plaque d\'athérome et ses conséquences sur la circulation sanguine.' },
          { pts: 3, texte: '2. À partir du document 2, identifiez et classez les facteurs de risque cardiovasculaire de M. D. en facteurs modifiables et non modifiables.' },
          { pts: 2, texte: '3. Expliquez comment le tabagisme aggrave le risque cardiovasculaire au niveau de la paroi artérielle.' }
        ]
      },
      {
        annee: 'Métropole 2025', theme: 'Cancer et contrôle du cycle cellulaire',
        dossier: [
          { id: 'Doc 1', titre: 'Données épidémiologiques — cancer du sein en France 2023',
            texte: 'Incidence : 61 214 nouveaux cas | Décès : 12 146\nSurvie à 5 ans (stade localisé) : 99 % | Survie à 5 ans (métastases) : 28 %\nDépistage organisé : mammographie tous les 2 ans pour les femmes de 50 à 74 ans.' },
          { id: 'Doc 2', titre: 'Mécanismes du cancer',
            texte: 'Une cellule cancéreuse résulte d\'une accumulation de mutations dans les gènes impliqués dans la régulation du cycle cellulaire : les proto-oncogènes peuvent muter en oncogènes (activation permanente de la division), et les gènes suppresseurs de tumeur (ex : p53) peuvent être inactivés. Ces mutations entraînent une prolifération cellulaire incontrôlée.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 2, distinguez le rôle d\'un proto-oncogène et d\'un gène suppresseur de tumeur dans le contrôle du cycle cellulaire.' },
          { pts: 3, texte: '2. Expliquez pourquoi une cellule cancéreuse, contrairement à une cellule normale, continue de se diviser sans limite. Appuyez-vous sur le document 2.' },
          { pts: 3, texte: '3. En vous appuyant sur le document 1, justifiez l\'intérêt et les limites du dépistage organisé du cancer du sein.' }
        ]
      },
      {
        annee: 'Métropole 2022 (bis)', theme: 'Système nerveux et douleur',
        dossier: [
          { id: 'Doc 1', titre: 'Mécanisme de la transmission du message nerveux',
            texte: 'Le message nerveux est un signal électrique (potentiel d\'action) qui se propage le long de l\'axone. La synapse permet la transmission du signal d\'un neurone à l\'autre via des neurotransmetteurs (ex : substance P pour la douleur). Les antalgiques comme l\'ibuprofène inhibent les prostaglandines, médiatrices de la douleur.' },
          { id: 'Doc 2', titre: 'Données d\'une patiente',
            texte: 'Mme R., 45 ans, consulte pour des douleurs chroniques au genou.\nEVA (échelle visuelle analogique) : 7/10 | Durée des douleurs : > 3 mois\nTraitement actuel : paracétamol 1g × 3/jour (insuffisant)' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, expliquez le mécanisme de transmission d\'un message nerveux douloureux.' },
          { pts: 3, texte: '2. À partir du document 2, caractérisez la douleur de Mme R. et justifiez le changement de palier antalgique envisagé selon la classification OMS.' },
          { pts: 3, texte: '3. Expliquez le mécanisme d\'action des AINS (anti-inflammatoires non stéroïdiens) et citez deux effets indésirables à surveiller.' }
        ]
      }
    ],
    stss: [
      {
        annee: 'Métropole 2024', theme: 'Inégalités sociales de santé',
        dossier: [
          { id: 'Doc 1', titre: 'Espérance de vie selon la CSP — hommes à 35 ans (INSEE 2022)',
            texte: 'Cadres et professions intellectuelles supérieures : +47,2 ans\nOuvriers : +40,6 ans\nEnsemble de la population : +44,7 ans\n→ Écart cadres/ouvriers : 6,6 ans' },
          { id: 'Doc 2', titre: 'Déterminants sociaux de la santé (OMS)',
            texte: 'Selon l\'OMS, 30 à 55 % de l\'état de santé d\'une population est déterminé par des facteurs sociaux : revenus, niveau d\'éducation, conditions de logement, accès aux soins, emploi et conditions de travail. Ces déterminants agissent en amont des comportements individuels.' },
          { id: 'Doc 3', titre: 'Renoncement aux soins pour raisons financières (IRDES 2023)',
            texte: '25 % des ménages du 1er quintile de revenus déclarent avoir renoncé à au moins un soin dans l\'année (soins dentaires : 18 %, optiques : 12 %).\nMénages du 5e quintile : 7 % de renoncement.' }
        ],
        questions: [
          { pts: 3, texte: '1. En vous appuyant sur les documents 1 et 2, montrez l\'existence d\'inégalités sociales de santé en France et expliquez leurs mécanismes.' },
          { pts: 3, texte: '2. À partir du document 3 et de vos connaissances, analysez le phénomène de renoncement aux soins et présentez les dispositifs de la protection sociale qui visent à le réduire.' },
          { pts: 2, texte: '3. En quoi la prise en compte des déterminants sociaux (doc. 2) remet-elle en cause une vision uniquement individuelle de la santé ?' }
        ]
      },
      {
        annee: 'Métropole 2023', theme: 'Vieillissement et dépendance',
        dossier: [
          { id: 'Doc 1', titre: 'Données démographiques — France 2022 (INSEE)',
            texte: 'Part des 65 ans et plus : 21,3 % (1990 : 14,0 %)\nNombre de personnes âgées dépendantes : 1,5 million (GIR 1 à 4)\nProjection 2050 : entre 2,3 et 2,8 millions de personnes dépendantes' },
          { id: 'Doc 2', titre: 'L\'Allocation Personnalisée d\'Autonomie (APA)',
            texte: 'Créée en 2002, l\'APA est versée par le conseil départemental. Elle finance les aides à domicile ou les frais d\'hébergement en EHPAD. En 2022 : 1,38 million de bénéficiaires, coût de 6,5 milliards €. Reste à charge moyen en EHPAD : > 2 000 €/mois.' },
          { id: 'Doc 3', titre: 'Préférences des personnes âgées (IFOP 2023)',
            texte: '72 % des personnes de 65 ans et plus souhaitent rester à domicile le plus longtemps possible.\nSeulement 12 % envisagent spontanément l\'entrée en EHPAD.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, caractérisez l\'évolution de la dépendance en France.' },
          { pts: 3, texte: '2. En vous appuyant sur le document 2, présentez l\'APA : ses caractéristiques, son financement et ses limites.' },
          { pts: 3, texte: '3. En vous appuyant sur les trois documents, montrez que le virage domiciliaire répond à la fois aux attentes des personnes âgées et aux contraintes économiques. Quels problèmes ce virage soulève-t-il ?' }
        ]
      },
      {
        annee: 'Métropole 2022', theme: 'Obésité et politique de santé publique',
        dossier: [
          { id: 'Doc 1', titre: 'Prévalence de l\'obésité en France (ObÉpi-Roche)',
            texte: '1997 : 8,5 % | 2006 : 12,4 % | 2012 : 15,0 % | 2020 : 17 %\nObésité sévère (IMC ≥ 40) : 1,2 % en 2020\nInégalités : 26 % d\'obèses dans le 1er quartile de revenus, 10 % dans le 4e quartile.' },
          { id: 'Doc 2', titre: 'Programme National Nutrition Santé (PNNS 4 : 2019-2023)',
            texte: 'Objectifs : augmenter l\'activité physique, améliorer l\'alimentation, réduire les inégalités sociales de santé nutritionnelle.\nMesures : Nutri-Score (étiquetage), interdiction de publicité alimentaire ciblant les enfants, amélioration de la restauration collective, chèques alimentation durables.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, décrivez l\'évolution de l\'obésité en France et son caractère socialement différencié.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2 et vos connaissances, analysez le PNNS : ses objectifs, ses moyens d\'action (incitatif, réglementaire, éducatif) et les acteurs impliqués.' },
          { pts: 2, texte: '3. Le PNNS peut-il seul réduire les inégalités sociales face à l\'obésité ? Justifiez votre réponse en mobilisant vos connaissances sur les déterminants sociaux de la santé.' }
        ]
      },
      {
        annee: 'Pondichéry 2024', theme: 'Protection sociale et risques sociaux',
        dossier: [
          { id: 'Doc 1', titre: 'Structure des dépenses de protection sociale en France 2022 (DREES)',
            texte: 'Total : 869 milliards € soit 34,3 % du PIB\nVieillesse-survie : 46 % | Maladie-invalidité : 33 % | Famille : 8 % | Chômage : 6 % | Pauvreté-exclusion : 4 % | Autres : 3 %' },
          { id: 'Doc 2', titre: 'Principes fondateurs de la Sécurité Sociale (1945)',
            texte: 'Créée en 1945, la Sécurité Sociale repose sur la solidarité (cotisations en fonction des revenus, prestations selon les besoins) et l\'universalité (couverture de toute la population). Elle comprend 4 branches : maladie, vieillesse, famille et accidents du travail. La branche maladie est gérée par la CNAM.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, identifiez les deux risques les plus couverts par la protection sociale en France. Justifiez leur importance par rapport aux autres risques.' },
          { pts: 3, texte: '2. En vous appuyant sur le document 2, expliquez les principes fondateurs de la Sécurité Sociale et montrez en quoi ils se distinguent d\'un système d\'assurance privé.' },
          { pts: 3, texte: '3. La protection sociale française fait face à des défis structurels. Identifiez deux de ces défis et présentez les réformes engagées pour y répondre.' }
        ]
      },
      {
        annee: 'Métropole 2025', theme: 'Santé mentale et politiques publiques',
        dossier: [
          { id: 'Doc 1', titre: 'La santé mentale en France (BEH 2023)',
            texte: '13 % de la population présente un trouble anxieux, 8 % un épisode dépressif caractérisé.\nLes troubles mentaux représentent la 1re cause d\'arrêts de travail de longue durée.\nSeulement 50 % des personnes concernées accèdent à un suivi spécialisé.' },
          { id: 'Doc 2', titre: 'Feuille de route santé mentale 2018-2023',
            texte: 'Axes prioritaires : promouvoir le bien-être, améliorer l\'accès aux soins (dispositif MonPsy : consultations de psychologues remboursées), développer les soins de proximité, lutter contre la stigmatisation.' },
          { id: 'Doc 3', titre: 'Inégalités territoriales d\'accès aux soins psychiatriques',
            texte: 'Densité de psychiatres libéraux : 22/100 000 hab. en Île-de-France vs 5/100 000 en Creuse.\nDélai moyen de 1er rendez-vous : 6 semaines en zone urbaine, 4 mois en zone rurale.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, montrez que la santé mentale constitue un enjeu majeur de santé publique en France.' },
          { pts: 3, texte: '2. En vous appuyant sur les documents 2 et 3, analysez la politique de santé mentale : ses objectifs, ses moyens et les inégalités territoriales persistantes.' },
          { pts: 3, texte: '3. En quoi une approche globale de la santé mentale, dépassant le seul cadre médical, est-elle nécessaire ? Mobilisez vos connaissances sur les déterminants sociaux et les acteurs du secteur médico-social.' }
        ]
      },
      {
        annee: 'Centres étrangers 2024', theme: 'Pauvreté, exclusion et action sociale',
        dossier: [
          { id: 'Doc 1', titre: 'Données sur la pauvreté en France 2022 (INSEE)',
            texte: 'Taux de pauvreté monétaire (seuil à 60 %) : 14,4 % soit 9,1 millions de personnes\nTaux chez les moins de 18 ans : 20,3 % | Chez les 65 ans et plus : 10,6 %\nTaux de pauvreté en conditions de vie : 12,8 %' },
          { id: 'Doc 2', titre: 'Le Revenu de Solidarité Active (RSA)',
            texte: 'Créé en 2009, le RSA garantit un revenu minimum aux personnes sans emploi ou aux revenus d\'activité insuffisants. Il est versé par les CAF et géré par les conseils départementaux. En 2022 : 1,85 million de foyers bénéficiaires. Le RSA intègre une dimension d\'insertion professionnelle obligatoire.' },
          { id: 'Doc 3', titre: 'Non-recours aux droits sociaux (ODENORE 2022)',
            texte: '36 % des personnes éligibles au RSA ne le demandent pas (non-recours).\nCauses principales : méconnaissance des droits (41 %), sentiment de stigmatisation (28 %), complexité administrative (22 %).' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir des documents 1 et 2, distinguez pauvreté monétaire et pauvreté en conditions de vie. Comment le RSA contribue-t-il à lutter contre la pauvreté ?' },
          { pts: 3, texte: '2. En vous appuyant sur le document 3 et vos connaissances, analysez le phénomène de non-recours aux droits. Quelles actions peuvent être menées par les travailleurs sociaux pour le réduire ?' },
          { pts: 3, texte: '3. Le RSA est-il suffisant pour garantir l\'insertion des personnes en situation de pauvreté ? Mobilisez vos connaissances sur les acteurs et dispositifs complémentaires de l\'action sociale.' }
        ]
      }
    ]
  };

  // ── État ────────────────────────────────────────────────────────
  let subj    = 'cbph';
  let qIdx    = 0;
  let timerSecs   = 0;
  let timerRunning = false;
  let timerInterval = null;

  // ── Render ─────────────────────────────────────────────────────
  function render() {
    const q    = QUESTIONS[subj][qIdx];
    const bank = QUESTIONS[subj];
    const total = q.questions.reduce((s, x) => s + x.pts, 0);

    // Compteur
    const cnt = document.getElementById('bac-q-counter');
    if (cnt) cnt.textContent = (qIdx + 1) + ' / ' + bank.length;

    // Badge matière
    const badge = document.getElementById('bac-subj-badge');
    if (badge) {
      if (subj === 'cbph') {
        badge.className = 'bac-badge bac-badge-cbph';
        badge.textContent = 'CBPH — Chimie, Biologie & Physiopathologie Humaines';
      } else {
        badge.className = 'bac-badge bac-badge-stss';
        badge.textContent = 'STSS — Sciences et Techniques Sanitaires et Sociales';
      }
    }

    // Dossier
    const dossierEl = document.getElementById('bac-dossier');
    if (dossierEl) {
      let h = '<div class="bac-dossier-title">Dossier documentaire — ' + _esc(q.annee) + ' &nbsp;·&nbsp; ' + _esc(q.theme) + '</div>';
      q.dossier.forEach(d => {
        h += '<div class="bac-doc"><strong>' + _esc(d.id) + ' — ' + _esc(d.titre) + '</strong><p>' + _esc(d.texte).replace(/\n/g, '<br>') + '</p></div>';
      });
      dossierEl.innerHTML = h;
    }

    // Questions
    const qEl = document.getElementById('bac-questions');
    if (qEl) {
      let h = '<div class="bac-q-header">Questions <span class="bac-pts-total">— ' + total + ' point' + (total > 1 ? 's' : '') + '</span></div>';
      q.questions.forEach(qi => {
        h += '<div class="bac-q-item"><span class="bac-pts">' + qi.pts + ' pt' + (qi.pts > 1 ? 's' : '') + '</span>' + _esc(qi.texte) + '</div>';
      });
      qEl.innerHTML = h;
    }

    // Reset réponse et timer
    const ta = document.getElementById('bac-answer');
    if (ta) ta.value = '';
    _updateWordCount();
    resetTimer();
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Navigation ─────────────────────────────────────────────────
  function prevQ() {
    qIdx = (qIdx - 1 + QUESTIONS[subj].length) % QUESTIONS[subj].length;
    render();
  }
  function nextQ() {
    qIdx = (qIdx + 1) % QUESTIONS[subj].length;
    render();
  }

  function switchSubject(s) {
    subj = s;
    qIdx = 0;
    document.querySelectorAll('.bac-tab').forEach(b => b.classList.toggle('active', b.dataset.subj === s));
    render();
  }

  // ── Timer ──────────────────────────────────────────────────────
  function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = false;
    timerSecs = 0;
    _updateTimerUI();
    const btn = document.getElementById('bac-timer-btn');
    if (btn) btn.textContent = 'Démarrer';
  }

  function toggleTimer() {
    if (!timerRunning) {
      timerRunning = true;
      const btn = document.getElementById('bac-timer-btn');
      if (btn) btn.textContent = 'Pause';
      timerInterval = setInterval(() => {
        timerSecs++;
        _updateTimerUI();
      }, 1000);
    } else {
      clearInterval(timerInterval);
      timerRunning = false;
      const btn = document.getElementById('bac-timer-btn');
      if (btn) btn.textContent = 'Reprendre';
    }
  }

  function _updateTimerUI() {
    const el = document.getElementById('bac-timer-val');
    if (!el) return;
    const m = Math.floor(timerSecs / 60).toString().padStart(2, '0');
    const s = (timerSecs % 60).toString().padStart(2, '0');
    el.textContent = m + ':' + s;
    const wrap = document.getElementById('bac-timer-wrap');
    if (wrap) {
      wrap.classList.toggle('bac-timer-warn',   timerSecs > 1200 && timerSecs <= 1800);
      wrap.classList.toggle('bac-timer-danger', timerSecs > 1800);
    }
  }

  // ── Compteur de mots ───────────────────────────────────────────
  function _updateWordCount() {
    const ta  = document.getElementById('bac-answer');
    const el  = document.getElementById('bac-wcount');
    if (!ta || !el) return;
    const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
    el.textContent = words + ' mot' + (words > 1 ? 's' : '');
  }

  // ── Soumission pour correction ─────────────────────────────────
  function submitAnswer() {
    const ta  = document.getElementById('bac-answer');
    const answer = ta ? ta.value.trim() : '';
    if (!answer || answer.length < 30) {
      alert('Rédige ta réponse avant de soumettre !');
      return;
    }
    const q = QUESTIONS[subj][qIdx];
    const subjLabel = subj === 'cbph' ? 'CBPH' : 'STSS';
    const total = q.questions.reduce((s, x) => s + x.pts, 0);
    const m = Math.floor(timerSecs / 60), s2 = timerSecs % 60;
    const timeStr = timerSecs > 0 ? ' (rédigé en ' + m + 'min ' + s2 + 's)' : '';

    const docsText   = q.dossier.map(d => d.id + ' — ' + d.titre + ' :\n' + d.texte).join('\n\n');
    const questText  = q.questions.map(x => x.texte + ' (' + x.pts + ' pt' + (x.pts>1?'s':'') + ')').join('\n');

    const prompt = `Correction bac ST2S — ${subjLabel} — ${q.annee} — ${q.theme}${timeStr}

═══ DOSSIER DOCUMENTAIRE ═══
${docsText}

═══ QUESTIONS ═══
${questText}

═══ MA RÉPONSE ═══
${answer}

Corrige cette réponse comme un professeur de terminale ST2S sévère et exigeant. Structure ta correction ainsi :
1. NOTE : X / ${total} points (justifie brièvement)
2. CORRECTION PAR QUESTION : pour chaque question, donne les points accordés, ce qui est juste, ce qui manque ou est faux, le vocabulaire attendu
3. COMMENTAIRE GÉNÉRAL : niveau de la copie, rigueur, maîtrise du cours, axes de progression précis
Sois direct, n'épargne pas les lacunes.`;

    // Copie dans le presse-papier + affiche confirmation
    navigator.clipboard.writeText(prompt).then(() => {
      _showCopyToast();
    }).catch(() => {
      // Fallback : textarea caché
      const tmp = document.createElement('textarea');
      tmp.value = prompt;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      _showCopyToast();
    });
  }

  function _showCopyToast() {
    const t = document.getElementById('bac-toast');
    if (!t) return;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
    }, 3500);
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    render();
  }

  return { init, switchSubject, prevQ, nextQ, toggleTimer, submitAnswer, onInput: _updateWordCount };
})();
