// core/bac.js — Entraînement Bac ST2S (CBPH & STSS)
'use strict';
window.App = window.App || {};

App.Bac = (() => {

  // ── Banque de questions ─────────────────────────────────────────
  // CBPH : partie BPH (biologie & physiopathologie) — vraies thématiques des annales 2024/2025
  const CBPH_QUESTIONS = [
    {
      annee: 'Métropole 2024', theme: 'Maladie cœliaque',
      dossier: [
        { id: 'Texte introductif', titre: 'La maladie cœliaque',
          texte: 'La maladie cœliaque est une maladie auto-immune déclenchée par l\'ingestion de gluten (protéine présente dans le blé, l\'orge et le seigle) chez des personnes génétiquement prédisposées. Elle se manifeste par une atrophie des villosités intestinales, responsable d\'une malabsorption des nutriments. Le diagnostic repose sur des tests sérologiques (anticorps anti-transglutaminase, anti-endomysium) et une biopsie de l\'intestin grêle. Le traitement est un régime sans gluten à vie.' },
        { id: 'Document 1', titre: 'Réponse immunitaire dans la maladie cœliaque',
          texte: 'Lors de l\'ingestion de gluten, les peptides de gliadine traversent l\'épithélium intestinal. Ils sont présentés par des cellules dendritiques aux lymphocytes T CD4+ dans le chorion. Ces LT4 activés sécrètent des cytokines inflammatoires qui activent les lymphocytes B (production d\'anticorps anti-tissus) et les lymphocytes T cytotoxiques CD8+ qui détruisent les entérocytes. Cette réaction auto-immune aboutit à une atrophie villositaire.' },
        { id: 'Document 2', titre: 'Conséquences biologiques de l\'atrophie villositaire (cas clinique : M. X, 38 ans)',
          texte: 'Bilan biologique : Hémoglobine : 10,2 g/dL (N : 13–17) | Ferritine : 5 µg/L (N : 30–300) | Vitamine B12 : 145 pg/mL (N : 200–950) | Albumine : 32 g/L (N : 35–50) | Calcium : 2,0 mmol/L (N : 2,2–2,6)\nM. X se plaint de diarrhées chroniques, de fatigue, de douleurs abdominales et a perdu 8 kg en 6 mois. Les anti-transglutaminase IgA sont fortement positifs. La biopsie confirme l\'atrophie des villosités intestinales (stade Marsh 3).' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le mécanisme immunitaire à l\'origine des lésions intestinales dans la maladie cœliaque. Précisez le rôle de chaque type de lymphocyte impliqué.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, expliquez les manifestations cliniques et biologiques observées chez M. X en les reliant aux fonctions de l\'intestin grêle.' },
        { pts: 3, texte: '3. Justifiez l\'intérêt du dosage des anticorps anti-transglutaminase dans le diagnostic et le suivi de la maladie cœliaque. Expliquez pourquoi le régime sans gluten est le seul traitement efficace.' }
      ]
    },
    {
      annee: 'Métropole Remplacement 2024', theme: 'Cancer colorectal',
      dossier: [
        { id: 'Texte introductif', titre: 'Le cancer colorectal en France',
          texte: 'Le cancer colorectal touche chaque année plus de 47 000 personnes en France (2e cancer chez la femme, 3e chez l\'homme) et est responsable de plus de 17 000 décès par an. Il se développe à partir de polypes adénomateux qui évoluent progressivement vers la malignité. Le dépistage organisé par coloscopie ou test immunologique fécal (TIF) est recommandé chez les 50–74 ans. (D\'après Santé publique France)' },
        { id: 'Document 1', titre: 'Mécanismes de la cancérogenèse colorectale',
          texte: 'Le cancer colorectal résulte de l\'accumulation de mutations dans des gènes clés :\n– Mutation du gène APC (gène suppresseur de tumeur) : perte du contrôle de la prolifération cellulaire\n– Activation de l\'oncogène KRAS : signaux de croissance incontrôlés\n– Mutation de TP53 : perte de l\'apoptose\nCes mutations s\'accumulent sur plusieurs années : muqueuse normale → adénome → carcinome in situ → cancer invasif.' },
        { id: 'Document 2', titre: 'Facteurs de risque du cancer colorectal',
          texte: 'Facteurs de risque non modifiables : âge (> 50 ans), antécédents familiaux (syndrome de Lynch, PAF), maladies inflammatoires chroniques (MICI).\nFacteurs de risque modifiables : alimentation riche en viandes rouges et charcuteries, faible consommation de fibres, sédentarité, obésité, tabagisme, consommation d\'alcool, exposition aux nitrosamines et nitrites.\nLes fibres alimentaires protègent en réduisant le temps de transit et la concentration des carcinogènes dans le côlon.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, décrivez les étapes de la cancérogenèse colorectale en expliquant le rôle des différentes mutations impliquées.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, classez les facteurs de risque en modifiables et non modifiables. Expliquez comment l\'alimentation peut à la fois augmenter et diminuer le risque de cancer colorectal.' },
        { pts: 3, texte: '3. Justifiez l\'intérêt du dépistage organisé du cancer colorectal (programme national). Expliquez pourquoi le dépistage précoce améliore significativement le pronostic.' }
      ]
    },
    {
      annee: 'Polynésie 2024', theme: 'Démence à corps de Lewy (DCL)',
      dossier: [
        { id: 'Texte introductif', titre: 'La démence à corps de Lewy',
          texte: 'La démence à corps de Lewy (DCL) est la 2e cause de démence neurodégénérative après la maladie d\'Alzheimer. Elle est caractérisée par des dépôts anormaux d\'α-synucléine dans les neurones dopaminergiques du locus niger (corps de Lewy). Elle associe des troubles cognitifs, des symptômes parkinsoniens et des hallucinations visuelles. Le traitement repose notamment sur la L-dopa (précurseur de la dopamine).' },
        { id: 'Document 1', titre: 'Neurotransmission dopaminergique et DCL',
          texte: 'Dans les conditions normales, les neurones dopaminergiques du locus niger libèrent de la dopamine dans la synapse. La dopamine se fixe sur ses récepteurs post-synaptiques et module les circuits moteurs et cognitifs. Dans la DCL, la dégénérescence progressive des neurones dopaminergiques entraîne un déficit en dopamine, à l\'origine des symptômes moteurs (rigidité, tremblement, bradykinésie) et cognitifs.' },
        { id: 'Document 2', titre: 'Mécanismes de formation des corps de Lewy',
          texte: 'L\'α-synucléine, protéine abondante dans les neurones, s\'agrège anormalement et forme des corps de Lewy. Cette agrégation serait liée à des mutations génétiques (formes familiales) ou à des facteurs environnementaux. Les corps de Lewy perturbent les fonctions neuronales et induisent l\'apoptose. L\'immunohistochimie avec des anticorps anti-α-synucléine permet de visualiser ces dépôts sur coupe histologique.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le lien entre la dégénérescence des neurones dopaminergiques et les symptômes observés dans la DCL.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, expliquez le mécanisme de formation des corps de Lewy et leurs conséquences sur les cellules nerveuses.' },
        { pts: 3, texte: '3. La L-dopa est utilisée dans le traitement de la DCL. Expliquez son mécanisme d\'action et pourquoi on administre la L-dopa plutôt que directement la dopamine.' }
      ]
    },
    {
      annee: 'Métropole 2025', theme: 'Santé au féminin — Endométriose et cancer du col',
      dossier: [
        { id: 'Texte introductif', titre: 'L\'endométriose : une maladie sous-diagnostiquée',
          texte: 'L\'endométriose est une maladie gynécologique chronique touchant environ 1 femme sur 10 en âge de procréer en France (soit ~4 millions de femmes). Elle est caractérisée par la présence de tissu endométrial en dehors de la cavité utérine (trompes, ovaires, péritoine, intestin). Elle provoque des douleurs pelviennes sévères et peut conduire à l\'infertilité. Le délai moyen de diagnostic est de 7 ans.' },
        { id: 'Document 1', titre: 'Physiopathologie de l\'endométriose',
          texte: 'La théorie la plus acceptée est celle du reflux menstruel de Sampson : lors des règles, du tissu endométrial remonte dans les trompes et se fixe sur d\'autres organes. Ce tissu conserve sa réponse aux hormones ovariennes (œstrogènes, progestérone) et saigne à chaque cycle. Cette inflammation chronique provoque des lésions, des adhérences et peut obstruer les trompes. Des facteurs immunologiques et génétiques favoriseraient le développement de la maladie.' },
        { id: 'Document 2', titre: 'Cancer du col de l\'utérus et HPV',
          texte: 'Le cancer du col de l\'utérus est causé dans 99 % des cas par une infection persistante aux Papillomavirus humains (HPV). Les souches HPV 16 et 18 sont responsables de 70 % des cancers. L\'infection HPV est sexuellement transmissible. La vaccination (Gardasil®) est recommandée dès 11 ans. Le dépistage par frottis cervico-utérin (FCU) est recommandé tous les 3 ans entre 25 et 65 ans. La prévention combinée (vaccination + dépistage) pourrait permettre l\'élimination de ce cancer.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le mécanisme physiopathologique de l\'endométriose et les conséquences sur la fertilité.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, expliquez la relation entre l\'infection HPV et le développement du cancer du col. Présentez la stratégie de prévention primaire et secondaire mise en place en France.' },
        { pts: 3, texte: '3. Le délai de diagnostic de l\'endométriose est en moyenne de 7 ans. Identifiez les obstacles au diagnostic précoce et proposez des pistes d\'amélioration de la prise en charge.' }
      ]
    },
    {
      annee: 'Métropole Remplacement 2025', theme: 'Biothérapies et maladies rares',
      dossier: [
        { id: 'Texte introductif', titre: 'La révolution des biothérapies',
          texte: 'Les biothérapies désignent des traitements à base de molécules biologiques (anticorps monoclonaux, thérapie génique, thérapie cellulaire). Elles représentent une révolution dans le traitement des maladies génétiques rares. La thérapie génique consiste à introduire un gène fonctionnel dans les cellules déficientes à l\'aide d\'un vecteur viral. Elle a permis des guérisons chez des patients atteints de maladies autrefois fatales (amyotrophie spinale, déficit immunitaire combiné sévère - SCID).' },
        { id: 'Document 1', titre: 'Principe de la thérapie génique ex vivo',
          texte: 'La thérapie génique ex vivo procède en plusieurs étapes :\n1. Prélèvement de cellules souches hématopoïétiques (CSH) du patient\n2. Transduction ex vivo : introduction du gène thérapeutique dans les CSH via un vecteur rétroviral ou lentiviral\n3. Conditionnement du patient (chimiothérapie pour éliminer les cellules malades)\n4. Réinjection des CSH corrigées par voie intraveineuse\n5. Greffe et reconstitution de la moelle osseuse saine\nEfficacité démontrée dans la β-thalassémie, le SCID-X1 et l\'adrénoleucodystrophie.' },
        { id: 'Document 2', titre: 'Enjeux éthiques et économiques des biothérapies',
          texte: 'Le coût des biothérapies est considérable : Zolgensma® (traitement de l\'amyotrophie spinale) coûte 2 millions € par injection. Ces traitements soulèvent des questions d\'équité d\'accès aux soins. En France, la prise en charge par l\'Assurance Maladie fait l\'objet de négociations avec les laboratoires. Par ailleurs, la thérapie génique soulève des questions éthiques : risque d\'intégration dans les cellules germinales, effets à long terme inconnus, manipulation du génome.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le principe de la thérapie génique ex vivo. Justifiez chaque étape.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, analysez les enjeux économiques et éthiques des biothérapies. Comment le système de protection sociale français doit-il s\'adapter à ces nouveaux traitements ?' },
        { pts: 3, texte: '3. Comparez les biothérapies (thérapie génique, anticorps monoclonaux) aux traitements médicamenteux classiques en termes de mécanisme d\'action, d\'avantages et de limites.' }
      ]
    },
    {
      annee: 'Nouvelle-Calédonie 2025', theme: 'Polykystose rénale',
      dossier: [
        { id: 'Texte introductif', titre: 'La polykystose rénale autosomique dominante (PKRAD)',
          texte: 'La polykystose rénale autosomique dominante est la maladie génétique héréditaire grave la plus fréquente (environ 800 000 personnes en France). Elle est causée par des mutations dans les gènes PKD1 (85 %) ou PKD2 (15 %), entraînant la formation de nombreux kystes remplis de liquide dans les reins. L\'augmentation progressive du volume des kystes détruit le parenchyme rénal et aboutit à une insuffisance rénale chronique terminale chez environ 50 % des patients à 60 ans.' },
        { id: 'Document 1', titre: 'Physiopathologie de la PKRAD',
          texte: 'Les protéines codées par PKD1 (polycystine-1) et PKD2 (polycystine-2) forment un complexe dans les cils primaires des cellules rénales et régulent la signalisation cellulaire. Leurs mutations entraînent une prolifération cellulaire anormale, une sécrétion de liquide et la formation de kystes. La compression des néphrons sains par les kystes entraîne progressivement l\'insuffisance rénale. Le tolvaptan (antagoniste de la vasopressine) ralentit la croissance des kystes.' },
        { id: 'Document 2', titre: 'Prise en charge de l\'insuffisance rénale chronique (IRC)',
          texte: 'L\'IRC évolue en 5 stades selon le débit de filtration glomérulaire (DFG) :\nStade 1 : DFG ≥ 90 mL/min/1,73m² (normal) | Stade 3 : DFG 30–60 (modéré) | Stade 5 : DFG < 15 mL/min/1,73m² (terminal)\nÀ un stade terminal, le traitement de suppléance est nécessaire : dialyse (hémodialyse ou dialyse péritonéale) ou transplantation rénale. La transplantation offre la meilleure qualité de vie et survie. En 2022, 4 468 greffes rénales ont été réalisées en France mais les listes d\'attente dépassent 5 ans.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le lien entre les mutations des gènes PKD1/PKD2 et la formation des kystes rénaux.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, présentez les options de traitement de l\'insuffisance rénale terminale. Comparez la dialyse et la transplantation rénale en termes d\'efficacité, de contraintes et d\'impact sur la qualité de vie.' },
        { pts: 3, texte: '3. La polykystose rénale est transmissible à la descendance avec un risque de 50 %. Quelles questions éthiques pose cette maladie génétique en termes de diagnostic prénatal et de projet parental ?' }
      ]
    },
    {
      annee: 'Polynésie 2025', theme: 'Mélanome métastatique',
      dossier: [
        { id: 'Texte introductif', titre: 'Le mélanome malin',
          texte: 'Le mélanome est un cancer de la peau développé à partir des mélanocytes. Son incidence augmente régulièrement (+4 %/an en France). Il représente seulement 10 % des cancers cutanés mais est responsable de 80 % des décès par cancer de la peau. L\'exposition aux UV (soleil, cabines UV) est le principal facteur de risque. Le mélanome peut être diagnostiqué précocement par la règle ABCDE (Asymétrie, Bords, Couleur, Diamètre, Évolution). Détecté tôt, le pronostic est excellent (survie à 5 ans > 95 %).' },
        { id: 'Document 1', titre: 'Mécanismes de la mélanogenèse et cancérogenèse',
          texte: 'Les rayonnements UV induisent des mutations dans l\'ADN des mélanocytes, notamment dans le gène BRAF (mutation V600E dans 50 % des mélanomes) qui active de manière constitutive la voie de signalisation de la prolifération cellulaire. Les UV provoquent également l\'immunosuppression locale, favorisant l\'échappement tumoral. La mélatonine protège des UV en absorbant les rayonnements : les phototypes clairs (peau claire, cheveux roux/blonds) sont plus sensibles car leur mélanine est moins photoprotectrice.' },
        { id: 'Document 2', titre: 'Nouvelles thérapies ciblées du mélanome métastatique',
          texte: 'Les thérapies ciblées (inhibiteurs BRAF : vemurafenib, dabrafenib) et l\'immunothérapie (inhibiteurs de points de contrôle : nivolumab, pembrolizumab) ont révolutionné le traitement du mélanome métastatique. L\'immunothérapie relance la réponse immunitaire anti-tumorale en bloquant les protéines PD-1/PD-L1 qui permettent aux cellules tumorales d\'échapper aux lymphocytes T cytotoxiques. Survie à 5 ans avec immunothérapie : 40–50 % vs < 10 % avant ces traitements.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez les mécanismes par lesquels les UV peuvent provoquer un mélanome.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, expliquez le principe de l\'immunothérapie anti-PD-1/PD-L1. Comment cette thérapie exploite-t-elle les mécanismes de la réponse immunitaire adaptative ?' },
        { pts: 3, texte: '3. Présentez les mesures de prévention primaire et secondaire du mélanome. Justifiez pourquoi la détection précoce est capitale dans cette pathologie.' }
      ]
    },
    {
      annee: 'Polynésie Remplacement 2025', theme: 'Obésité et leptine',
      dossier: [
        { id: 'Texte introductif', titre: 'L\'obésité : une pandémie mondiale',
          texte: 'L\'obésité (IMC ≥ 30 kg/m²) touche 17 % des adultes français (2023) et constitue un problème de santé publique majeur. Elle résulte d\'un déséquilibre entre les apports et les dépenses énergétiques. Elle est associée à de nombreuses comorbidités : diabète de type 2, maladies cardiovasculaires, cancers, apnées du sommeil, troubles articulaires. Sa physiopathologie implique de nombreux facteurs : génétiques, hormonaux, environnementaux et comportementaux.' },
        { id: 'Document 1', titre: 'Régulation de la prise alimentaire : rôle de la leptine',
          texte: 'La leptine est une hormone sécrétée par le tissu adipeux proportionnellement à la masse grasse. Elle agit sur les neurones de l\'hypothalamus pour :\n– Inhiber les neurones NPY/AgRP (orexigènes : stimulateurs de la faim)\n– Activer les neurones POMC/CART (anorexigènes : suppresseurs de la faim)\nDans l\'obésité, une résistance à la leptine se développe (analogue à la résistance à l\'insuline dans le DT2) : malgré des taux élevés de leptine, la satiété n\'est pas atteinte.' },
        { id: 'Document 2', titre: 'Prise en charge de l\'obésité',
          texte: 'La prise en charge de l\'obésité est pluridisciplinaire et progressive :\n1. Mesures hygiéno-diététiques : rééquilibrage alimentaire, activité physique (30 min/jour minimum)\n2. Accompagnement psychologique : TCC (troubles du comportement alimentaire)\n3. Traitements médicamenteux : limitée (orlistat en France)\n4. Chirurgie bariatrique (bypass gastrique, sleeve gastrectomie) : indiquée si IMC > 40 ou > 35 avec comorbidités, après échec de 12 mois de prise en charge pluridisciplinaire\nObjectif : -10 % du poids initial améliore significativement les comorbidités.' }
      ],
      questions: [
        { pts: 3, texte: '1. En vous appuyant sur le document 1, expliquez le mécanisme de régulation de la prise alimentaire par la leptine. Comment la résistance à la leptine contribue-t-elle à l\'entretien de l\'obésité ?' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, présentez et justifiez la prise en charge progressive de l\'obésité. À quel niveau agissent les différentes mesures ?' },
        { pts: 3, texte: '3. L\'obésité est plus fréquente dans les milieux défavorisés. En vous appuyant sur vos connaissances sur les déterminants de la santé, expliquez ce gradient social.' }
      ]
    }
  ];

  // STSS : organisé par chapitre du programme
  const STSS_CHAPITRES = [
    { id: 'natalite',       label: 'Natalité et famille' },
    { id: 'offre_soins',    label: 'Offre de soins' },
    { id: 'protection',     label: 'Protection sociale' },
    { id: 'politique_sp',   label: 'Politiques de santé publique' },
    { id: 'inegalites',     label: 'Inégalités de santé' },
    { id: 'vieillissement', label: 'Vieillissement' },
    { id: 'sante_mentale',  label: 'Santé mentale' },
    { id: 'pauvrete',       label: 'Pauvreté & exclusion' },
  ];

  const STSS_QUESTIONS = {
    natalite: [
      {
        annee: 'Métropole 2025', theme: 'Baisse de la natalité en France', isReal: true,
        intro: 'En 2022, 726 000 bébés sont nés en France, soit 2,2 % de moins qu\'en 2021. C\'est le nombre de naissances le plus faible depuis la fin de la seconde guerre mondiale. La baisse de la natalité peut s\'expliquer à la fois par la baisse de la fertilité et celle de la fécondité.\n(INSEE FOCUS n°307, 28/09/2023)',
        dossier: [
          { id: 'Annexe 1', titre: 'Baisse de la fertilité et de la fécondité (Assurance Maladie, 2024)',
            texte: 'Fertilité et fécondité sont deux notions différentes : la fertilité est la capacité biologique à concevoir un enfant ; la fécondité est un paramètre démographique se traduisant par le nombre d\'enfants par femme. La fertilité spontanée diminue dès 30 ans chez la femme, nettement après 37 ans. Le retard de l\'âge à la maternité est observé depuis plusieurs décennies. Des facteurs environnementaux (tabac, obésité, polluants, perturbateurs endocriniens) impactent également la fertilité.' },
          { id: 'Annexe 2', titre: 'Prise en charge de l\'AMP (Assistance Médicale à la Procréation)',
            texte: 'Les actes d\'AMP sont pris en charge à 100 % par l\'Assurance Maladie pour 6 inséminations max et 4 tentatives de FIV pour obtenir une grossesse. La prise en charge est identique pour couple hétérosexuel, couple de femmes ou femme seule. Des autorisations d\'absence sont prévues pour les actes médicaux nécessaires au protocole.' },
          { id: 'Annexe 3', titre: 'Facteurs d\'infertilité — causes médicales et sociales',
            texte: 'Causes médicales féminines : endométriose (obstruction des trompes), SOPK (troubles de l\'ovulation). Causes masculines : altération qualité du sperme (tabac, cannabis, âge).\nFacteurs sociaux : généralisation du travail féminin, recherche de stabilité professionnelle avant projet parental, possible déclin du désir d\'enfant, croyance excessive dans les techniques d\'AMP (45 % des couples infertiles quittent la PMA sans enfant).' },
          { id: 'Annexe 4', titre: 'Une politique de soutien à la natalité (Vie publique, 2016)',
            texte: 'Les politiques natalistes visent : le développement d\'infrastructures sanitaires, des prestations en nature (crèches) et en espèces (allocations familiales), des mesures fiscales (quotient familial). Objectifs collectifs : renouvellement de la population, dynamisme économique, viabilité du système de protection sociale. Objectifs individuels : permettre aux parents d\'avoir le nombre d\'enfants souhaité (accès à la contraception, IVG, conciliation vie familiale/professionnelle).' },
          { id: 'Annexe 5', titre: 'Recommandations vers une stratégie nationale de lutte contre l\'infertilité (2022)',
            texte: 'Six axes : 1. Informer le public (journée nationale de sensibilisation, numéro vert) ; 2. Instaurer des consultations ciblées de dépistage de l\'infertilité ; 3. Renforcer la formation des professionnels de santé ; 4. Développer la recherche ; 5. Promouvoir une consultation pré-conceptionnelle ; 6. Créer un Institut national de la fertilité avec approche interministérielle.' }
        ],
        questions: [
          { pts: 6, texte: 'PARTIE 1 — Mobilisation des connaissances\nL\'offre de soins met en œuvre différents modes d\'intervention en santé.\nIllustrer cette affirmation.' },
          { pts: 7, texte: 'PARTIE 2 — Question 1\nÀ partir des annexes 1, 3 et de vos connaissances, présentez différents déterminants influençant la baisse de la natalité.' },
          { pts: 7, texte: 'PARTIE 2 — Question 2\nEn vous appuyant sur les annexes 2, 4, 5 et vos connaissances, montrez la complémentarité des différentes mesures des politiques de santé et des politiques sociales pour limiter la baisse de la natalité.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Famille, parentalité et politiques familiales', isReal: false,
        intro: 'La politique familiale française est l\'une des plus généreuses d\'Europe. Elle repose sur un ensemble de prestations et de services visant à soutenir les familles dans leur projet parental et à concilier vie familiale et vie professionnelle. Malgré ces dispositifs, les inégalités persistent selon le niveau de revenu.',
        dossier: [
          { id: 'Document 1', titre: 'Les prestations familiales en France (CAF, 2023)',
            texte: 'Allocations familiales : versées dès le 2e enfant, modulées selon les revenus depuis 2015.\nPrestation d\'Accueil du Jeune Enfant (PAJE) : prime à la naissance (946 €), allocation de base (184 €/mois jusqu\'aux 3 ans), CMG (Complément Mode de Garde).\nCongé parental d\'éducation (CPE) : 3 ans maximum par parent, indemnisé via la PreParE (396 €/mois pour le 1er enfant).\nTotal dépenses branche famille : 51 milliards € en 2022.' },
          { id: 'Document 2', titre: 'Accueil de la petite enfance : inégalités d\'accès',
            texte: 'Nombre de places en crèche (établissements d\'accueil du jeune enfant - EAJE) : 460 000 pour 800 000 naissances/an.\nTaux de couverture : 18 % (contre 40 % en Suède).\nInégalités : les crèches sont sur-représentées dans les quartiers aisés. Les familles monoparentales (85 % de femmes) ont plus recours aux assistantes maternelles (coût plus élevé).\nL\'absence de solution de garde pousse 40 % des mères à renoncer à un emploi (contre 3 % des pères).' }
        ],
        questions: [
          { pts: 4, texte: '1. À partir du document 1 et de vos connaissances, présentez les principaux dispositifs de la politique familiale française. Quel risque social ces prestations couvrent-elles ?' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2 et vos connaissances, analysez les inégalités d\'accès au mode de garde en France. Quels effets ont-elles sur l\'égalité professionnelle hommes/femmes ?' },
          { pts: 4, texte: '3. Peut-on affirmer que la politique familiale française est pleinement universelle ? En mobilisant vos connaissances sur les principes de la protection sociale, discutez les limites et les adaptations nécessaires.' }
        ]
      }
    ],
    offre_soins: [
      {
        annee: 'Sujet type', theme: 'Organisation du système de soins en France', isReal: false,
        intro: 'La France dispose d\'un système de santé reconnu pour sa qualité mais confronté à de profonds défis : déserts médicaux, inégalités d\'accès aux soins, vieillissement de la population soignante et pression financière. Des réformes structurelles sont engagées pour adapter l\'offre de soins aux besoins de la population.',
        dossier: [
          { id: 'Document 1', titre: 'Les niveaux de recours aux soins',
            texte: 'Soins primaires (1er recours) : médecin généraliste, infirmier, pharmacien, kinésithérapeute. Rôle de coordination et de prévention. Le médecin traitant est le pivot du parcours de soins coordonné.\nSoins secondaires (2e recours) : spécialistes (sur orientation), hospitalisation programmée.\nSoins tertiaires (3e recours) : CHU, soins très spécialisés (réanimation, greffes, cancérologie).\nSoins de proximité : HAD (hospitalisation à domicile), SSIAD (services de soins infirmiers à domicile), EHPAD.' },
          { id: 'Document 2', titre: 'Les déserts médicaux en France (DREES, 2023)',
            texte: 'Définition : zone caractérisée par une accessibilité potentielle localisée (APL) à un médecin généraliste < 2,5 consultations par habitant et par an.\n11 % de la population française vit dans un désert médical (6,5 millions de personnes).\nMoyennes : 133 généralistes/100 000 hab en zones rurales vs 198 en zones urbaines.\nConséquences : recours plus tardif aux soins, aggravation des pathologies chroniques, surcharge des urgences (+5 %/an).' }
        ],
        questions: [
          { pts: 4, texte: '1. À partir du document 1 et de vos connaissances, expliquez le fonctionnement du parcours de soins coordonné. Quel est le rôle du médecin traitant ?' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, caractérisez le problème des déserts médicaux en France et analysez ses conséquences sur la santé de la population.' },
          { pts: 4, texte: '3. Présentez et évaluez deux solutions mises en place (ou envisagées) pour réduire les inégalités territoriales d\'accès aux soins.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Modes d\'intervention en santé — prévention et éducation', isReal: false,
        intro: 'L\'offre de soins ne se limite pas aux soins curatifs. La prévention, l\'éducation à la santé et la promotion de la santé constituent des modes d\'intervention essentiels. La France a progressivement renforcé sa politique de prévention, notamment à travers des plans nationaux et l\'action des différents acteurs du système de santé.',
        dossier: [
          { id: 'Document 1', titre: 'Les niveaux de prévention',
            texte: 'Prévention primaire : agir avant l\'apparition de la maladie — vaccination, éducation à la santé, lutte contre les facteurs de risque.\nPrévention secondaire : dépistage précoce pour traiter avant les complications — mammographie, FCU, dépistage du diabète.\nPrévention tertiaire : limiter les complications et rechutes chez les malades — éducation thérapeutique, rééducation, soins de suite.\nPromotion de la santé (OMS, Charte d\'Ottawa 1986) : approche globale incluant les déterminants sociaux, environnementaux et comportementaux de la santé.' },
          { id: 'Document 2', titre: 'L\'éducation thérapeutique du patient (ETP)',
            texte: 'L\'ETP est une approche centrée sur le patient atteint d\'une maladie chronique. Elle vise à lui transmettre des compétences pour gérer sa maladie au quotidien (auto-surveillance, adaptation du traitement, reconnaissance des signes d\'alerte).\nExemples : ETP dans le diabète (gestion glycémie, alimentation, pieds), dans l\'asthme (utilisation des inhalateurs, plan d\'action).\nEn France, 10 % des 25 000 Actes de prévention et de dépistage réalisés en 2022 concernaient l\'ETP. Les études montrent une réduction des hospitalisations de 30 % chez les diabétiques bénéficiant d\'ETP.' }
        ],
        questions: [
          { pts: 4, texte: '1. À partir du document 1 et de vos connaissances, illustrez les différents niveaux de prévention à travers des exemples concrets pour une pathologie de votre choix.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, définissez l\'éducation thérapeutique du patient et expliquez son intérêt dans la prise en charge des maladies chroniques.' },
          { pts: 4, texte: '3. Montrez comment la promotion de la santé, selon la conception de l\'OMS, dépasse la seule approche médicale de la prévention.' }
        ]
      }
    ],
    protection: [
      {
        annee: 'Pondichéry 2024', theme: 'Protection sociale et risques sociaux', isReal: false,
        intro: 'La protection sociale française constitue l\'un des systèmes les plus développés au monde. Elle représente 34,3 % du PIB en 2022 (869 milliards €). Face aux transformations sociales et économiques (vieillissement, chômage, précarisation), elle doit constamment s\'adapter.',
        dossier: [
          { id: 'Document 1', titre: 'Dépenses de protection sociale par risque en France (DREES 2022)',
            texte: 'Total : 869 milliards € = 34,3 % du PIB\nVieillesse-survie : 46 % | Maladie-invalidité : 33 % | Famille : 8 % | Chômage : 6 % | Pauvreté-exclusion : 4 % | Autres : 3 %\nFinancement : cotisations sociales (55 %), impôts et taxes (35 %), autres recettes (10 %).' },
          { id: 'Document 2', titre: 'Les principes fondateurs de la Sécurité Sociale (1945)',
            texte: 'Créée par les ordonnances de 1945, la Sécurité Sociale repose sur :\n– Solidarité : cotisations proportionnelles aux revenus, prestations selon les besoins\n– Universalité : couverture de toute la population (étendue progressivement, PUMA 2016)\n– Unité : organisation unique (4 branches : maladie, vieillesse, famille, AT/MP)\nDistinction assurance vs assistance sociale : l\'assurance est contributive (droits liés à cotisations) ; l\'assistance est non contributive (droits liés à situation de besoin : RSA, AAH, APA).' }
        ],
        questions: [
          { pts: 3, texte: '1. À partir du document 1, identifiez et justifiez les deux risques les plus couverts par la protection sociale française.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, distinguez les mécanismes d\'assurance sociale et d\'assistance sociale. Donnez des exemples concrets de chacun.' },
          { pts: 5, texte: '3. La protection sociale française fait face à deux défis majeurs : le financement du risque vieillesse et la lutte contre le non-recours aux droits. En vous appuyant sur vos connaissances, analysez ces enjeux et présentez les réponses apportées.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Assurance maladie et remboursement des soins', isReal: false,
        intro: 'L\'Assurance Maladie obligatoire (branche maladie de la Sécurité Sociale) prend en charge une partie des dépenses de santé des assurés. Malgré ce dispositif, des inégalités persistent, notamment liées au reste à charge et au recours aux complémentaires santé.',
        dossier: [
          { id: 'Document 1', titre: 'Fonctionnement du remboursement des soins en France',
            texte: 'L\'Assurance Maladie rembourse les soins sur la base d\'un tarif de convention. Le ticket modérateur (TM) représente la part non prise en charge par la SS (15 à 40 % selon les actes). La participation forfaitaire (0,50 €/acte) et la franchise médicale (0,50 €/boîte de médicament, plafonnée à 50 €/an) sont à la charge de l\'assuré. Les mutuelles complémentaires couvrent tout ou partie du TM selon les contrats. 95 % des Français ont une complémentaire santé.' },
          { id: 'Document 2', titre: 'Accès aux droits : C2S et ALD',
            texte: 'Complémentaire Santé Solidaire (C2S) : ancienne CMU-C, gratuite pour les revenus < 9 180 €/an, avec participation (moins de 1 €/jour) entre 9 180 et 13 800 €/an. Bénéficiaires en 2022 : 8,2 millions. La C2S supprime les dépassements d\'honoraires et le reste à charge pour les bénéficiaires.\nAffection de Longue Durée (ALD) : 32 pathologies graves (cancer, diabète, insuffisance cardiaque...). Prise en charge à 100 % par l\'AM. 12 millions de patients en ALD en 2022 (+ 3 %/an).' }
        ],
        questions: [
          { pts: 3, texte: '1. À partir du document 1, expliquez comment le remboursement des soins est organisé en France. Distinguez les différents niveaux de prise en charge.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, présentez les dispositifs C2S et ALD. Comment permettent-ils de réduire les inégalités d\'accès aux soins ?' },
          { pts: 5, texte: '3. Le reste à charge des ménages français (8,4 % en 2022, OCDE) est l\'un des plus faibles d\'Europe. Pourtant, 25 % des Français renoncent à des soins. Comment expliquer ce paradoxe ?' }
        ]
      }
    ],
    politique_sp: [
      {
        annee: 'Métropole 2022', theme: 'Obésité et politique nutritionnelle', isReal: false,
        intro: 'L\'obésité est un problème de santé publique majeur en France : 17 % des adultes en 2023, avec une forte inégalité sociale. Le Programme National Nutrition Santé (PNNS) est la principale politique nationale visant à améliorer l\'état nutritionnel de la population depuis 2001.',
        dossier: [
          { id: 'Document 1', titre: 'Prévalence de l\'obésité en France (ObÉpi-Roche)',
            texte: '1997 : 8,5 % | 2006 : 12,4 % | 2012 : 15,0 % | 2020 : 17 %\nInégalités sociales : 26 % d\'obèses dans le 1er quartile de revenus vs 10 % dans le 4e quartile.\nFacteurs : alimentation hypercalorique, sédentarité, stress, manque de sommeil, facteurs génétiques.' },
          { id: 'Document 2', titre: 'PNNS 4 (2019-2023) : objectifs et mesures',
            texte: 'Objectifs : augmenter la pratique d\'activité physique, améliorer la qualité de l\'alimentation, réduire les inégalités sociales de santé nutritionnelle.\nMesures réglementaires : Nutri-Score obligatoire sur les emballages, interdiction de publicités alimentaires ciblant les enfants, sucre/sel dans les écoles.\nMesures incitatives : chèques alimentation durable, éducation nutritionnelle.\nActeurs : Ministère de la Santé, ANSES, collectivités, industrie alimentaire, professionnels de santé.' }
        ],
        questions: [
          { pts: 2, texte: '1. À partir du document 1, décrivez l\'évolution de l\'obésité en France et son caractère socialement différencié.' },
          { pts: 5, texte: '2. En vous appuyant sur le document 2 et vos connaissances, analysez le PNNS comme exemple de politique de santé publique : objectifs, acteurs, types de mesures (réglementaires, incitatives, éducatives). Dans quelle logique de prévention s\'inscrit-il ?' },
          { pts: 5, texte: '3. Une politique nutritionnelle peut-elle seule réduire les inégalités de santé liées à l\'obésité ? En mobilisant vos connaissances sur les déterminants de la santé et les acteurs de la protection sociale, justifiez votre réponse.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Lutte contre les addictions — tabac et alcool', isReal: false,
        intro: 'Les addictions (tabac, alcool, drogues) constituent un enjeu de santé publique majeur. En France, le tabac est responsable de 75 000 décès/an (1re cause de décès évitable) et l\'alcool de 41 000 décès/an. Des politiques volontaristes ont été mises en place pour réduire ces consommations.',
        dossier: [
          { id: 'Document 1', titre: 'Bilan de la politique anti-tabac en France',
            texte: 'Mesures chronologiques : Loi Evin (1991) : interdiction de publicité, espaces non-fumeurs. Paquet neutre (2017). Plan national de réduction du tabagisme (PNRT). Tabac à 10 € le paquet (2020).\nRésultats : prévalence du tabagisme quotidien : 31 % en 2005 → 24 % en 2022 (–7 points). Mais inégalités persistent : 37 % chez les ouvriers vs 17 % chez les cadres.\nRemboursement des substituts nicotiniques : 65 € par an par bénéficiaire, 150 € pour les femmes enceintes.' },
          { id: 'Document 2', titre: 'Approches de réduction des risques (RDR) liés à l\'alcool',
            texte: 'La réduction des risques est une approche pragmatique qui vise à diminuer les conséquences dommageables des addictions sans exiger l\'abstinence immédiate. Exemples : repères de consommation à faible risque (max 2 verres/jour, pas tous les jours), alcool et prise de risque (conduite, grossesse), cure de désintoxication et suivi en addictologie.\nActeurs : CSAPA (centres de soins, d\'accompagnement et de prévention en addictologie), médecins généralistes, associations (Alcool Assistance), travail social.' }
        ],
        questions: [
          { pts: 4, texte: '1. À partir du document 1, analysez la politique anti-tabac française : quels types de mesures ont été mis en œuvre ? Évaluez leur efficacité.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, expliquez l\'approche de réduction des risques. En quoi diffère-t-elle d\'une approche prohibitionniste ?' },
          { pts: 4, texte: '3. Les inégalités sociales dans les comportements addictifs persistent malgré les politiques publiques. Expliquez pourquoi et proposez des actions ciblées pour les populations les plus vulnérables.' }
        ]
      }
    ],
    inegalites: [
      {
        annee: 'Métropole 2024', theme: 'Inégalités sociales de santé', isReal: false,
        intro: 'Les inégalités sociales de santé désignent les écarts systématiques et injustes d\'état de santé entre les groupes sociaux. En France, elles sont documentées depuis les années 1980 et constituent un défi persistant pour les politiques publiques.',
        dossier: [
          { id: 'Document 1', titre: 'Espérance de vie selon la catégorie socioprofessionnelle — hommes à 35 ans (INSEE 2022)',
            texte: 'Cadres et professions intellectuelles supérieures : +47,2 ans supplémentaires\nOuvriers : +40,6 ans supplémentaires\nEnsemble de la population : +44,7 ans\n→ Écart cadres/ouvriers : 6,6 ans\nIdem pour les femmes mais écart réduit (3,5 ans entre ouvrières et cadres supérieures).' },
          { id: 'Document 2', titre: 'Déterminants sociaux de la santé (OMS, Commission Marmot)',
            texte: 'L\'OMS identifie les déterminants sociaux de la santé comme les conditions dans lesquelles les individus naissent, grandissent, vivent, travaillent et vieillissent : revenus et protection sociale, éducation, chômage et insécurité au travail, conditions de travail, logement, exclusion sociale. Ces déterminants expliquent 30 à 55 % des inégalités de santé et agissent en amont des comportements individuels.' },
          { id: 'Document 3', titre: 'Renoncement aux soins pour raisons financières (IRDES 2023)',
            texte: '25 % des ménages du 1er quintile de revenus déclarent avoir renoncé à au moins un soin dans l\'année (dentaires : 18 %, optiques : 12 %).\nMénages du 5e quintile : 7 % de renoncement.\nMesures compensatoires : C2S (Complémentaire Santé Solidaire), 100 % Santé (dentaire, optique, audiologie).' }
        ],
        questions: [
          { pts: 4, texte: '1. En vous appuyant sur les documents 1 et 2, démontrez l\'existence d\'inégalités sociales de santé en France et expliquez leurs mécanismes. Distinguez déterminants matériels et culturels.' },
          { pts: 4, texte: '2. À partir du document 3 et de vos connaissances, analysez le renoncement aux soins. Quels dispositifs de la protection sociale visent à le réduire ?' },
          { pts: 4, texte: '3. Peut-on agir sur les inégalités de santé par les seules politiques de santé ? Justifiez en mobilisant vos connaissances sur les acteurs et les politiques sociales transversales.' }
        ]
      }
    ],
    vieillissement: [
      {
        annee: 'Métropole 2023', theme: 'Vieillissement démographique et dépendance', isReal: false,
        intro: 'Le vieillissement démographique est l\'un des défis majeurs du 21e siècle. En France, la part des 65 ans et plus est passée de 14 % en 1990 à 21,3 % en 2022. Cette évolution soulève des questions fondamentales sur l\'organisation et le financement de la prise en charge de la dépendance.',
        dossier: [
          { id: 'Document 1', titre: 'Données sur la dépendance en France (INSEE 2022)',
            texte: 'Nombre de personnes en GIR 1 à 4 (dépendance modérée à lourde) : 1,5 million\nProjection 2050 : 2,3 à 2,8 millions\n72 % des personnes de 65 ans et plus souhaitent rester à domicile le plus longtemps possible (IFOP 2023)\nEHPAD : 7 500 établissements, 600 000 places. Reste à charge moyen : > 2 000 €/mois' },
          { id: 'Document 2', titre: 'L\'Allocation Personnalisée d\'Autonomie (APA)',
            texte: 'Créée en 2002, l\'APA est versée par le conseil départemental sans condition de ressources. Son montant varie selon le niveau de dépendance (GIR 1 à 4) et les revenus (entre 0 et 90 % du plan d\'aide). Elle finance les aides à domicile (auxiliaire de vie, portage de repas) ou les frais d\'hébergement en EHPAD.\nBénéficiaires 2022 : 1,38 million | Coût total : 6,5 milliards €\nFinancement : 53 % par les conseils départementaux, 35 % par la CNSA, 12 % autres.' }
        ],
        questions: [
          { pts: 3, texte: '1. À partir du document 1, caractérisez l\'enjeu de la dépendance en France. Pourquoi le virage domiciliaire est-il privilégié ?' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, présentez l\'APA : ses caractéristiques, ses principes de solidarité et ses limites financières.' },
          { pts: 5, texte: '3. Le financement de la dépendance est un enjeu majeur. Analysez les tensions entre solidarité nationale, solidarité familiale et autonomie individuelle. Présentez les pistes de réforme.' }
        ]
      }
    ],
    sante_mentale: [
      {
        annee: 'Métropole 2025', theme: 'Santé mentale et politiques publiques', isReal: false,
        intro: 'La santé mentale est définie par l\'OMS comme "un état de bien-être dans lequel une personne peut se réaliser, surmonter les tensions normales de la vie, accomplir un travail productif et contribuer à la vie de sa communauté." En France, 1 personne sur 5 sera touchée par un trouble psychique au cours de sa vie.',
        dossier: [
          { id: 'Document 1', titre: 'La santé mentale en France — données épidémiologiques (BEH 2023)',
            texte: '13 % de la population présente un trouble anxieux\n8 % un épisode dépressif caractérisé\n1re cause d\'arrêts de travail de longue durée\n1 200 suicides/an liés au travail (burn-out)\nSeulement 50 % des personnes concernées accèdent à un suivi spécialisé\n90 000 hospitalisations en psychiatrie en urgence/an' },
          { id: 'Document 2', titre: 'La feuille de route santé mentale 2018-2023 et dispositif MonPsy',
            texte: 'Axes : promouvoir le bien-être (sensibilisation en milieu scolaire et au travail), améliorer l\'accès aux soins, développer les soins de proximité, lutter contre la stigmatisation.\nMonPsy (2022) : remboursement de 8 séances de psychologue/an sur prescription médicale (30 € par séance pour l\'assuré). Bilan 2023 : 360 000 patients pris en charge.' },
          { id: 'Document 3', titre: 'Déserts psychiatriques en France',
            texte: 'Densité de psychiatres libéraux : 22/100 000 hab. en Île-de-France vs 5/100 000 en Creuse\nDélai moyen 1er rdv : 6 semaines en zone urbaine, 4 mois en zone rurale\n50 % des pédopsychiatres partiront à la retraite d\'ici 2030 sans remplacement suffisant\nLe numérique (téléconsultation) peut partiellement compenser mais pose des limites pour les cas sévères.' }
        ],
        questions: [
          { pts: 3, texte: '1. À partir du document 1, justifiez que la santé mentale constitue un enjeu majeur de santé publique, économique et sociale.' },
          { pts: 4, texte: '2. En vous appuyant sur les documents 2 et 3, analysez la politique de santé mentale en France : ses objectifs, ses apports et les inégalités territoriales persistantes.' },
          { pts: 5, texte: '3. La santé mentale ne peut pas être réduite au seul champ médical et psychiatrique. En mobilisant vos connaissances sur les déterminants de la santé et les acteurs du secteur médico-social et social, montrez que la réponse doit être globale et intersectorielle.' }
        ]
      }
    ],
    pauvrete: [
      {
        annee: 'Centres étrangers 2024', theme: 'Pauvreté, exclusion sociale et insertion', isReal: false,
        intro: 'La pauvreté touche 14,4 % de la population française (seuil à 60 % du revenu médian, INSEE 2022). Elle s\'accompagne souvent d\'exclusion sociale, de ruptures familiales et professionnelles. La lutte contre la pauvreté mobilise un ensemble d\'acteurs publics, associatifs et sociaux.',
        dossier: [
          { id: 'Document 1', titre: 'Données sur la pauvreté en France 2022 (INSEE)',
            texte: 'Taux de pauvreté monétaire (seuil 60 %) : 14,4 % = 9,1 millions de personnes\nTaux chez les moins de 18 ans : 20,3 % | Chez les 65 ans et plus : 10,6 %\nTaux de pauvreté en conditions de vie : 12,8 % (privations matérielles : logement précaire, difficulté à se chauffer, retards de paiement)\nSeuil de pauvreté : 1 216 €/mois pour une personne seule' },
          { id: 'Document 2', titre: 'Le RSA et le non-recours aux droits',
            texte: 'Le Revenu de Solidarité Active (RSA) garantit un revenu minimum. Il est versé par la CAF et géré par les conseils départementaux. Montant : 635 € pour une personne seule (2024).\n1,85 million de foyers bénéficiaires en 2022.\nNon-recours : 36 % des personnes éligibles ne le demandent pas.\nCauses : méconnaissance des droits (41 %), sentiment de stigmatisation (28 %), complexité administrative (22 %).\nRSA conditionné à un contrat d\'insertion (projet emploi ou formation) géré par France Travail.' }
        ],
        questions: [
          { pts: 3, texte: '1. À partir du document 1, distinguez pauvreté monétaire et pauvreté en conditions de vie. Identifiez les populations les plus exposées.' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2, analysez le phénomène de non-recours aux droits. Quelles actions les travailleurs sociaux peuvent-ils mener pour y remédier ?' },
          { pts: 5, texte: '3. Le RSA seul est-il suffisant pour assurer l\'insertion des personnes en situation de pauvreté ? Présentez d\'autres dispositifs et acteurs qui interviennent dans le parcours d\'insertion et montrez leur complémentarité.' }
        ]
      }
    ]
  };

  // ── État ────────────────────────────────────────────────────────
  let subj      = 'cbph';
  let qIdx      = 0;
  let stssChap  = 'natalite';
  let timerSecs = 0;
  let timerRunning  = false;
  let timerInterval = null;

  // ── Render ──────────────────────────────────────────────────────
  function getBank() {
    if (subj === 'cbph') return CBPH_QUESTIONS;
    return STSS_QUESTIONS[stssChap] || [];
  }

  function getQ() { return getBank()[qIdx]; }

  function render() {
    const bank = getBank();
    if (!bank.length) { document.getElementById('bac-dossier').innerHTML = '<p style="color:var(--gray-400);padding:20px">Pas de sujet disponible pour ce chapitre.</p>'; return; }
    if (qIdx >= bank.length) qIdx = 0;
    const q = bank[qIdx];
    const total = q.questions.reduce((s, x) => s + x.pts, 0);

    // Compteur
    const cnt = document.getElementById('bac-q-counter');
    if (cnt) cnt.textContent = (qIdx + 1) + ' / ' + bank.length;

    // Badge
    const badge = document.getElementById('bac-subj-badge');
    if (badge) {
      if (subj === 'cbph') {
        badge.className = 'bac-badge bac-badge-cbph';
        badge.textContent = 'CBPH — ' + q.annee + ' — ' + q.theme;
      } else {
        const chapLabel = STSS_CHAPITRES.find(c => c.id === stssChap)?.label || '';
        const realTag   = q.isReal ? ' ✅ Sujet officiel' : ' 📝 Sujet type';
        badge.className = 'bac-badge bac-badge-stss';
        badge.textContent = 'STSS — ' + q.annee + ' — ' + chapLabel + realTag;
      }
    }

    // Intro (si présente)
    let dossierHTML = '';
    if (q.intro) {
      dossierHTML += '<div class="bac-intro">' + _esc(q.intro) + '</div>';
    }
    // Dossier
    dossierHTML += '<div class="bac-dossier-title">Dossier documentaire — ' + _esc(q.theme) + '</div>';
    q.dossier.forEach(d => {
      dossierHTML += '<div class="bac-doc"><strong>' + _esc(d.id) + ' — ' + _esc(d.titre) + '</strong><p>' + _esc(d.texte).replace(/\n/g, '<br>') + '</p></div>';
    });
    document.getElementById('bac-dossier').innerHTML = dossierHTML;

    // Questions
    let qHTML = '<div class="bac-q-header">Questions <span class="bac-pts-total">— ' + total + ' point' + (total > 1 ? 's' : '') + '</span></div>';
    q.questions.forEach(qi => {
      qHTML += '<div class="bac-q-item"><span class="bac-pts">' + qi.pts + ' pt' + (qi.pts > 1 ? 's' : '') + '</span>' + _esc(qi.texte).replace(/\n/g, '<br>') + '</div>';
    });
    document.getElementById('bac-questions').innerHTML = qHTML;

    const ta = document.getElementById('bac-answer');
    if (ta) ta.value = '';
    _updateWordCount();
    resetTimer();
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Navigation ──────────────────────────────────────────────────
  function prevQ() { const b = getBank(); qIdx = (qIdx - 1 + b.length) % b.length; render(); }
  function nextQ() { const b = getBank(); qIdx = (qIdx + 1) % b.length; render(); }

  function switchSubject(s) {
    subj = s;
    qIdx = 0;
    document.querySelectorAll('.bac-tab').forEach(b => b.classList.toggle('active', b.dataset.subj === s));
    const chapRow = document.getElementById('bac-chap-row');
    if (chapRow) chapRow.style.display = s === 'stss' ? 'flex' : 'none';
    render();
  }

  function switchChap(c) {
    stssChap = c;
    qIdx = 0;
    document.querySelectorAll('.bac-chap-btn').forEach(b => b.classList.toggle('active', b.dataset.chap === c));
    render();
  }

  // ── Timer ────────────────────────────────────────────────────────
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
      timerInterval = setInterval(() => { timerSecs++; _updateTimerUI(); }, 1000);
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

  function _updateWordCount() {
    const ta = document.getElementById('bac-answer');
    const el = document.getElementById('bac-wcount');
    if (!ta || !el) return;
    const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
    el.textContent = words + ' mot' + (words > 1 ? 's' : '');
  }

  // ── Soumission ───────────────────────────────────────────────────
  function submitAnswer() {
    const ta = document.getElementById('bac-answer');
    const answer = ta ? ta.value.trim() : '';
    if (!answer || answer.length < 30) { alert('Rédige ta réponse avant de soumettre !'); return; }
    const q = getQ();
    const subjLabel = subj === 'cbph' ? 'CBPH' : 'STSS';
    const total = q.questions.reduce((s, x) => s + x.pts, 0);
    const m = Math.floor(timerSecs / 60), s2 = timerSecs % 60;
    const timeStr = timerSecs > 0 ? ' (rédigé en ' + m + 'min ' + s2 + 's)' : '';

    const docsText  = q.dossier.map(d => d.id + ' — ' + d.titre + ' :\n' + d.texte).join('\n\n');
    const questText = q.questions.map(x => x.texte + ' (' + x.pts + ' pt' + (x.pts > 1 ? 's' : '') + ')').join('\n');

    const prompt = `Correction bac ST2S — ${subjLabel} — ${q.annee} — ${q.theme}${timeStr}

═══ DOSSIER DOCUMENTAIRE ═══
${q.intro ? q.intro + '\n\n' : ''}${docsText}

═══ QUESTIONS ═══
${questText}

═══ MA RÉPONSE ═══
${answer}

Corrige cette réponse comme un professeur de terminale ST2S sévère et exigeant. Structure ta correction ainsi :
1. NOTE : X / ${total} points
2. CORRECTION QUESTION PAR QUESTION : points accordés, ce qui est juste, ce qui manque, vocabulaire attendu, erreurs de raisonnement
3. COMMENTAIRE GÉNÉRAL : niveau de la copie, maîtrise du cours, axes de progression précis
N'épargne pas les lacunes. Sois direct et précis.`;

    navigator.clipboard.writeText(prompt).then(() => {
      _showCopyToast();
    }).catch(() => {
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
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 3500);
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    // Génère les boutons de chapitres STSS si pas encore fait
    const chapRow = document.getElementById('bac-chap-row');
    if (chapRow && chapRow.children.length === 0) {
      STSS_CHAPITRES.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'bac-chap-btn' + (c.id === stssChap ? ' active' : '');
        btn.dataset.chap = c.id;
        btn.textContent = c.label;
        btn.onclick = () => switchChap(c.id);
        chapRow.appendChild(btn);
      });
    }
    render();
  }

  return { init, switchSubject, prevQ, nextQ, toggleTimer, submitAnswer, onInput: _updateWordCount };
})();
