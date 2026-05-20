// core/bac.js — Entraînement Bac ST2S (CBPH & STSS)
'use strict';
window.App = window.App || {};

App.Bac = (() => {

  /* -- CBPH -------------------------------------------------------- */
  const CBPH_QUESTIONS = [
    {
      annee: 'Métropole 2024', theme: 'Maladie cœliaque',
      dossier: [
        { id: 'Texte introductif', titre: 'La maladie cœliaque',
          texte: 'La maladie cœliaque est une maladie auto-immune déclenchée par l\'ingestion de gluten chez des personnes génétiquement prédisposées. Elle se manifeste par une atrophie des villosités intestinales, responsable d\'une malabsorption des nutriments. Le diagnostic repose sur des tests sérologiques (anticorps anti-transglutaminase, anti-endomysium) et une biopsie de l\'intestin grêle. Le traitement est un régime sans gluten à vie.' },
        { id: 'Document 1', titre: 'Réponse immunitaire dans la maladie cœliaque',
          texte: 'Lors de l\'ingestion de gluten, les peptides de gliadine traversent l\'épithélium intestinal. Ils sont présentés par des cellules dendritiques aux lymphocytes T CD4+ dans le chorion. Ces LT4 activés sécrètent des cytokines inflammatoires qui activent les lymphocytes B (production d\'anticorps anti-tissus) et les lymphocytes T cytotoxiques CD8+ qui détruisent les entérocytes. Cette réaction auto-immune aboutit à une atrophie villositaire.' },
        { id: 'Document 2', titre: 'Conséquences biologiques — cas clinique M. X, 38 ans',
          texte: 'Bilan biologique : Hémoglobine 10,2 g/dL (N 13-17) | Ferritine 5 µg/L (N 30-300) | Vitamine B12 145 pg/mL (N 200-950) | Albumine 32 g/L (N 35-50) | Calcium 2,0 mmol/L (N 2,2-2,6). M. X se plaint de diarrhées chroniques, fatigue, douleurs abdominales ; perte de 8 kg en 6 mois. Anti-transglutaminase IgA fortement positifs. Biopsie : atrophie villositaire stade Marsh 3.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le mécanisme immunitaire à l\'origine des lésions intestinales dans la maladie cœliaque. Précisez le rôle de chaque type de lymphocyte impliqué.' },
        { pts: 4, texte: '2. À partir du document 2 et de vos connaissances, expliquez les manifestations cliniques et biologiques observées chez M. X en les reliant aux fonctions de l\'intestin grêle.' },
        { pts: 3, texte: '3. Justifiez l\'intérêt du dosage des anticorps anti-transglutaminase dans le diagnostic et le suivi. Expliquez pourquoi le régime sans gluten est le seul traitement efficace.' }
      ]
    },
    {
      annee: 'Métropole Remplacement 2024', theme: 'Cancer colorectal',
      dossier: [
        { id: 'Texte introductif', titre: 'Le cancer colorectal en France',
          texte: 'Le cancer colorectal touche chaque année plus de 47 000 personnes en France et est responsable de plus de 17 000 décès par an. Il se développe à partir de polypes adénomateux qui évoluent progressivement vers la malignité. Le dépistage organisé par coloscopie ou test immunologique fécal (TIF) est recommandé chez les 50-74 ans.' },
        { id: 'Document 1', titre: 'Mécanismes de la cancérogenèse colorectale',
          texte: 'Le cancer colorectal résulte de l\'accumulation de mutations : gène APC (suppresseur de tumeur), oncogène KRAS (prolifération incontrôlée), TP53 (perte de l\'apoptose). Ces mutations s\'accumulent sur plusieurs années : muqueuse normale → adénome → carcinome in situ → cancer invasif.' },
        { id: 'Document 2', titre: 'Facteurs de risque du cancer colorectal',
          texte: 'Facteurs non modifiables : âge > 50 ans, antécédents familiaux (syndrome de Lynch, PAF), MICI. Facteurs modifiables : alimentation riche en viandes rouges et charcuteries, faible consommation de fibres, sédentarité, obésité, tabagisme, alcool. Les fibres alimentaires protègent en réduisant le temps de transit et la concentration des carcinogènes dans le côlon.' }
      ],
      questions: [
        { pts: 3, texte: '1. Décrivez les étapes de la cancérogenèse colorectale en expliquant le rôle des différentes mutations impliquées.' },
        { pts: 4, texte: '2. Classez les facteurs de risque en modifiables et non modifiables. Expliquez comment l\'alimentation peut à la fois augmenter et diminuer le risque.' },
        { pts: 3, texte: '3. Justifiez l\'intérêt du dépistage organisé. Expliquez pourquoi le dépistage précoce améliore significativement le pronostic.' }
      ]
    },
    {
      annee: 'Polynésie 2024', theme: 'Démence à corps de Lewy (DCL)',
      dossier: [
        { id: 'Texte introductif', titre: 'La démence à corps de Lewy',
          texte: 'La DCL est la 2e cause de démence neurodégénérative après Alzheimer. Elle est caractérisée par des dépôts anormaux d\'alpha-synucléine dans les neurones dopaminergiques du locus niger (corps de Lewy). Elle associe des troubles cognitifs, des symptômes parkinsoniens et des hallucinations visuelles.' },
        { id: 'Document 1', titre: 'Neurotransmission dopaminergique et DCL',
          texte: 'Dans les conditions normales, les neurones dopaminergiques du locus niger libèrent de la dopamine dans la synapse. La dopamine se fixe sur ses récepteurs post-synaptiques et module les circuits moteurs et cognitifs. Dans la DCL, la dégénérescence progressive des neurones dopaminergiques entraîne un déficit en dopamine, à l\'origine des symptômes moteurs (rigidité, tremblement, bradykinésie) et cognitifs.' },
        { id: 'Document 2', titre: 'Mécanismes de formation des corps de Lewy',
          texte: 'L\'alpha-synucléine s\'agrège anormalement et forme des corps de Lewy. Cette agrégation serait liée à des mutations génétiques ou à des facteurs environnementaux. Les corps de Lewy perturbent les fonctions neuronales et induisent l\'apoptose. L\'immunohistochimie avec des anticorps anti-alpha-synucléine permet de visualiser ces dépôts sur coupe histologique.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le lien entre la dégénérescence des neurones dopaminergiques et les symptômes observés dans la DCL.' },
        { pts: 4, texte: '2. Expliquez le mécanisme de formation des corps de Lewy et leurs conséquences sur les cellules nerveuses.' },
        { pts: 3, texte: '3. La L-dopa est utilisée dans la DCL. Expliquez son mécanisme d\'action et justifiez pourquoi on administre la L-dopa plutôt que directement la dopamine.' }
      ]
    },
    {
      annee: 'Métropole 2025', theme: 'Endométriose et cancer du col',
      dossier: [
        { id: 'Texte introductif', titre: 'L\'endométriose',
          texte: 'L\'endométriose touche environ 1 femme sur 10 en âge de procréer en France (soit environ 4 millions de femmes). Elle est caractérisée par la présence de tissu endométrial en dehors de la cavité utérine. Elle provoque des douleurs pelviennes sévères et peut conduire à l\'infertilité. Le délai moyen de diagnostic est de 7 ans.' },
        { id: 'Document 1', titre: 'Physiopathologie de l\'endométriose',
          texte: 'La théorie du reflux menstruel de Sampson : lors des règles, du tissu endométrial remonte dans les trompes et se fixe sur d\'autres organes. Ce tissu conserve sa réponse aux hormones ovariennes (oestrogènes, progestérone) et saigne à chaque cycle. Cette inflammation chronique provoque des lésions, des adhérences et peut obstruer les trompes.' },
        { id: 'Document 2', titre: 'Cancer du col de l\'utérus et HPV',
          texte: 'Le cancer du col de l\'utérus est causé dans 99 % des cas par une infection persistante aux HPV. Les souches HPV 16 et 18 sont responsables de 70 % des cancers. La vaccination (Gardasil) est recommandée dès 11 ans. Le dépistage par frottis cervico-utérin (FCU) est recommandé tous les 3 ans entre 25 et 65 ans.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le mécanisme physiopathologique de l\'endométriose et les conséquences sur la fertilité.' },
        { pts: 4, texte: '2. Expliquez la relation entre l\'infection HPV et le développement du cancer du col. Présentez la stratégie de prévention primaire et secondaire mise en place en France.' },
        { pts: 3, texte: '3. Le délai de diagnostic de l\'endométriose est de 7 ans en moyenne. Identifiez les obstacles au diagnostic précoce et proposez des pistes d\'amélioration.' }
      ]
    },
    {
      annee: 'Métropole Remplacement 2025', theme: 'Biothérapies et maladies rares',
      dossier: [
        { id: 'Texte introductif', titre: 'La révolution des biothérapies',
          texte: 'Les biothérapies désignent des traitements à base de molécules biologiques (anticorps monoclonaux, thérapie génique, thérapie cellulaire). La thérapie génique consiste à introduire un gène fonctionnel dans les cellules déficientes à l\'aide d\'un vecteur viral. Elle a permis des guérisons dans des maladies autrefois fatales (amyotrophie spinale, SCID).' },
        { id: 'Document 1', titre: 'Principe de la thérapie génique ex vivo',
          texte: 'Étapes : 1. Prélèvement de cellules souches hématopoïétiques (CSH). 2. Transduction ex vivo via un vecteur lentiviral. 3. Conditionnement du patient par chimiothérapie. 4. Réinjection des CSH corrigées. 5. Reconstitution de la moelle osseuse saine. Efficacité démontrée dans la bêta-thalassémie, le SCID-X1 et l\'adrénoleucodystrophie.' },
        { id: 'Document 2', titre: 'Enjeux éthiques et économiques des biothérapies',
          texte: 'Le coût des biothérapies est considérable : Zolgensma (amyotrophie spinale) coûte 2 millions d\'euros par injection. Ces traitements soulèvent des questions d\'équité d\'accès aux soins. La thérapie génique pose également des questions éthiques : risque d\'intégration dans les cellules germinales, effets à long terme inconnus, manipulation du génome.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le principe de la thérapie génique ex vivo. Justifiez chaque étape.' },
        { pts: 4, texte: '2. Analysez les enjeux économiques et éthiques des biothérapies. Comment le système de protection sociale français doit-il s\'adapter à ces nouveaux traitements ?' },
        { pts: 3, texte: '3. Comparez les biothérapies aux traitements médicamenteux classiques en termes de mécanisme d\'action, d\'avantages et de limites.' }
      ]
    },
    {
      annee: 'Nouvelle-Calédonie 2025', theme: 'Polykystose rénale',
      dossier: [
        { id: 'Texte introductif', titre: 'La polykystose rénale autosomique dominante (PKRAD)',
          texte: 'La PKRAD est la maladie génétique héréditaire grave la plus fréquente (environ 800 000 personnes en France). Elle est causée par des mutations dans les gènes PKD1 (85 %) ou PKD2 (15 %), entraînant la formation de kystes rénaux. L\'augmentation progressive des kystes détruit le parenchyme rénal et aboutit à une insuffisance rénale chronique terminale chez environ 50 % des patients à 60 ans.' },
        { id: 'Document 1', titre: 'Physiopathologie de la PKRAD',
          texte: 'Les protéines codées par PKD1 (polycystine-1) et PKD2 (polycystine-2) forment un complexe dans les cils primaires des cellules rénales et régulent la signalisation cellulaire. Leurs mutations entraînent une prolifération cellulaire anormale, une sécrétion de liquide et la formation de kystes. La compression des néphrons sains par les kystes entraîne progressivement l\'insuffisance rénale.' },
        { id: 'Document 2', titre: 'Prise en charge de l\'insuffisance rénale chronique (IRC)',
          texte: 'L\'IRC évolue en 5 stades selon le DFG : Stade 1 DFG ≥ 90 mL/min (normal), Stade 3 DFG 30-60 (modéré), Stade 5 DFG < 15 mL/min (terminal). Au stade terminal : dialyse (hémodialyse ou dialyse péritonéale) ou transplantation rénale. La transplantation offre la meilleure qualité de vie. En 2022, 4 468 greffes rénales ont été réalisées en France.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le lien entre les mutations des gènes PKD1/PKD2 et la formation des kystes rénaux.' },
        { pts: 4, texte: '2. Présentez les options de traitement de l\'insuffisance rénale terminale. Comparez dialyse et transplantation en termes d\'efficacité, de contraintes et d\'impact sur la qualité de vie.' },
        { pts: 3, texte: '3. La polykystose rénale est transmissible avec un risque de 50 %. Quelles questions éthiques pose cette maladie en termes de diagnostic prénatal et de projet parental ?' }
      ]
    },
    {
      annee: 'Polynésie 2025', theme: 'Mélanome métastatique',
      dossier: [
        { id: 'Texte introductif', titre: 'Le mélanome malin',
          texte: 'Le mélanome est un cancer de la peau développé à partir des mélanocytes. Son incidence augmente régulièrement (+4 %/an). Il représente seulement 10 % des cancers cutanés mais est responsable de 80 % des décès par cancer de la peau. L\'exposition aux UV est le principal facteur de risque. Détecté tôt, le pronostic est excellent (survie à 5 ans > 95 %).' },
        { id: 'Document 1', titre: 'Mécanismes de la cancérogenèse du mélanome',
          texte: 'Les UV induisent des mutations dans l\'ADN des mélanocytes, notamment dans le gène BRAF (mutation V600E dans 50 % des mélanomes) qui active la voie de prolifération cellulaire. Les UV provoquent également une immunosuppression locale, favorisant l\'échappement tumoral. Les phototypes clairs sont plus sensibles car leur mélanine est moins photoprotectrice.' },
        { id: 'Document 2', titre: 'Nouvelles thérapies ciblées du mélanome métastatique',
          texte: 'Les thérapies ciblées (inhibiteurs BRAF : vemurafenib, dabrafenib) et l\'immunothérapie (anti-PD-1/PD-L1 : nivolumab, pembrolizumab) ont révolutionné le traitement. L\'immunothérapie relance la réponse immunitaire anti-tumorale en bloquant les protéines PD-1/PD-L1 qui permettent aux cellules tumorales d\'échapper aux lymphocytes T cytotoxiques. Survie à 5 ans : 40-50 % vs moins de 10 % avant ces traitements.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez les mécanismes par lesquels les UV peuvent provoquer un mélanome.' },
        { pts: 4, texte: '2. Expliquez le principe de l\'immunothérapie anti-PD-1/PD-L1. Comment cette thérapie exploite-t-elle les mécanismes de la réponse immunitaire adaptative ?' },
        { pts: 3, texte: '3. Présentez les mesures de prévention primaire et secondaire du mélanome. Justifiez pourquoi la détection précoce est capitale.' }
      ]
    },
    {
      annee: 'Polynésie Remplacement 2025', theme: 'Obésité et leptine',
      dossier: [
        { id: 'Texte introductif', titre: 'L\'obésité : une pandémie mondiale',
          texte: 'L\'obésité (IMC >= 30 kg/m2) touche 17 % des adultes français (2023). Elle résulte d\'un déséquilibre entre les apports et les dépenses énergétiques. Elle est associée à de nombreuses comorbidités : diabète de type 2, maladies cardiovasculaires, cancers, apnées du sommeil, troubles articulaires.' },
        { id: 'Document 1', titre: 'Régulation de la prise alimentaire : rôle de la leptine',
          texte: 'La leptine est une hormone sécrétée par le tissu adipeux proportionnellement à la masse grasse. Elle agit sur les neurones de l\'hypothalamus pour inhiber les neurones NPY/AgRP (orexigènes) et activer les neurones POMC/CART (anorexigènes). Dans l\'obésité, une résistance à la leptine se développe : malgré des taux élevés de leptine, la satiété n\'est pas atteinte.' },
        { id: 'Document 2', titre: 'Prise en charge de l\'obésité',
          texte: 'Prise en charge pluridisciplinaire et progressive : 1. Mesures hygiéno-diététiques (rééquilibrage alimentaire, activité physique). 2. Accompagnement psychologique (TCC). 3. Traitements médicamenteux (orlistat). 4. Chirurgie bariatrique (bypass, sleeve) si IMC > 40 ou > 35 avec comorbidités après 12 mois de prise en charge pluridisciplinaire. Objectif : perte de 10 % du poids initial améliore significativement les comorbidités.' }
      ],
      questions: [
        { pts: 3, texte: '1. Expliquez le mécanisme de régulation de la prise alimentaire par la leptine. Comment la résistance à la leptine contribue-t-elle à l\'entretien de l\'obésité ?' },
        { pts: 4, texte: '2. Présentez et justifiez la prise en charge progressive de l\'obésité. A quel niveau agissent les différentes mesures ?' },
        { pts: 3, texte: '3. L\'obésité est plus fréquente dans les milieux défavorisés. En vous appuyant sur les déterminants de la santé, expliquez ce gradient social.' }
      ]
    }
  ];

  /* -- Chapitres STSS -------------------------------------------- */
  const STSS_CHAPITRES = [
    { id: 'natalite',       label: 'Natalité et famille' },
    { id: 'offre_soins',    label: 'Offre de soins' },
    { id: 'protection',     label: 'Protection sociale' },
    { id: 'politique_sp',   label: 'Politiques de santé publique' },
    { id: 'inegalites',     label: 'Inégalités de santé' },
    { id: 'vieillissement', label: 'Vieillissement' },
    { id: 'sante_mentale',  label: 'Santé mentale' },
    { id: 'pauvrete',       label: 'Pauvreté et exclusion' }
  ];

  /* -- Questions STSS -------------------------------------------- */
  const STSS_QUESTIONS = {

    natalite: [
      {
        annee: 'Métropole 2025', theme: 'Baisse de la natalité en France', isReal: true,
        intro: 'En 2022, 726 000 bébés sont nés en France, soit 2,2 % de moins qu\'en 2021. C\'est le nombre de naissances le plus faible depuis la fin de la seconde guerre mondiale. La baisse de la natalité peut s\'expliquer à la fois par la baisse de la fertilité et celle de la fécondité. (INSEE FOCUS n°307, 28/09/2023)',
        dossier: [
          { id: 'Annexe 1', titre: 'Baisse de la fertilité et de la fécondité (Assurance Maladie, 2024)',
            texte: 'Fertilité et fécondité sont deux notions différentes : la fertilité est la capacité biologique à concevoir un enfant ; la fécondité est un paramètre démographique se traduisant par le nombre d\'enfants par femme. La fertilité spontanée diminue dès 30 ans chez la femme, nettement après 37 ans. Des facteurs environnementaux (tabac, obésité, polluants, perturbateurs endocriniens) impactent également la fertilité.' },
          { id: 'Annexe 2', titre: 'Prise en charge de l\'AMP (Assistance Médicale à la Procréation)',
            texte: 'Les actes d\'AMP sont pris en charge à 100 % par l\'Assurance Maladie pour 6 inséminations max et 4 tentatives de FIV. La prise en charge est identique pour couple hétérosexuel, couple de femmes ou femme seule. Des autorisations d\'absence sont prévues pour les actes médicaux nécessaires au protocole.' },
          { id: 'Annexe 3', titre: 'Facteurs d\'infertilité - causes médicales et sociales',
            texte: 'Causes médicales féminines : endométriose (obstruction des trompes), SOPK (troubles de l\'ovulation). Causes masculines : altération qualité du sperme (tabac, cannabis, âge). Facteurs sociaux : généralisation du travail féminin, recherche de stabilité professionnelle avant projet parental, possible déclin du désir d\'enfant, croyance excessive dans les techniques d\'AMP (45 % des couples infertiles quittent la PMA sans enfant).' },
          { id: 'Annexe 4', titre: 'Une politique de soutien à la natalité (Vie publique, 2016)',
            texte: 'Les politiques natalistes visent : le développement d\'infrastructures sanitaires, des prestations en nature (crèches) et en espèces (allocations familiales), des mesures fiscales (quotient familial). Objectifs collectifs : renouvellement de la population, dynamisme économique, viabilité du système de protection sociale. Objectifs individuels : permettre aux parents d\'avoir le nombre d\'enfants souhaité (accès à la contraception, IVG, conciliation vie familiale et professionnelle).' },
          { id: 'Annexe 5', titre: 'Recommandations vers une stratégie nationale de lutte contre l\'infertilité (2022)',
            texte: 'Six axes : 1. Informer le public (journée nationale de sensibilisation, numéro vert) ; 2. Instaurer des consultations ciblées de dépistage de l\'infertilité ; 3. Renforcer la formation des professionnels de santé ; 4. Développer la recherche ; 5. Promouvoir une consultation pré-conceptionnelle ; 6. Créer un Institut national de la fertilité avec approche interministérielle.' }
        ],
        questions: [
          { pts: 6,  texte: 'PARTIE 1 — Mobilisation des connaissances\nL\'offre de soins met en oeuvre différents modes d\'intervention en santé.\nIllustrer cette affirmation.' },
          { pts: 7,  texte: 'PARTIE 2 — Question 1\nA partir des annexes 1, 3 et de vos connaissances, présentez différents déterminants influençant la baisse de la natalité.' },
          { pts: 7,  texte: 'PARTIE 2 — Question 2\nEn vous appuyant sur les annexes 2, 4, 5 et vos connaissances, montrez la complémentarité des différentes mesures des politiques de santé et des politiques sociales pour limiter la baisse de la natalité.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Famille, parentalité et politiques familiales', isReal: false,
        intro: 'La politique familiale française est l\'une des plus généreuses d\'Europe. Elle repose sur un ensemble de prestations et de services visant à soutenir les familles dans leur projet parental et à concilier vie familiale et vie professionnelle. Malgré ces dispositifs, les inégalités persistent selon le niveau de revenu.',
        dossier: [
          { id: 'Document 1', titre: 'Les prestations familiales en France (CAF, 2023)',
            texte: 'Allocations familiales : versées dès le 2e enfant, modulées selon les revenus depuis 2015. PAJE : prime à la naissance (946 euros), allocation de base (184 euros/mois jusqu\'aux 3 ans), Complément Mode de Garde (CMG). Congé parental d\'éducation (CPE) : 3 ans maximum par parent, indemnisé via la PreParE (396 euros/mois pour le 1er enfant). Total dépenses branche famille : 51 milliards euros en 2022.' },
          { id: 'Document 2', titre: 'Accueil de la petite enfance : inégalités d\'accès',
            texte: 'Nombre de places en crèche (EAJE) : 460 000 pour 800 000 naissances/an. Taux de couverture : 18 % (contre 40 % en Suède). Les crèches sont sur-représentées dans les quartiers aisés. Les familles monoparentales (85 % de femmes) ont plus recours aux assistantes maternelles (coût plus élevé). L\'absence de solution de garde pousse 40 % des mères à renoncer à un emploi (contre 3 % des pères).' }
        ],
        questions: [
          { pts: 4, texte: '1. A partir du document 1 et de vos connaissances, présentez les principaux dispositifs de la politique familiale française. Quel risque social ces prestations couvrent-elles ?' },
          { pts: 4, texte: '2. En vous appuyant sur le document 2 et vos connaissances, analysez les inégalités d\'accès au mode de garde en France. Quels effets ont-elles sur l\'égalité professionnelle hommes/femmes ?' },
          { pts: 4, texte: '3. Peut-on affirmer que la politique familiale française est pleinement universelle ? En mobilisant vos connaissances sur les principes de la protection sociale, discutez les limites et les adaptations nécessaires.' }
        ]
      }
    ],

    offre_soins: [
      {
        annee: 'Sujet type', theme: 'Organisation du système de soins en France', isReal: false,
        intro: 'La France dispose d\'un système de santé reconnu pour sa qualité mais confronté à de profonds défis : déserts médicaux, inégalités d\'accès aux soins, vieillissement de la population soignante et pression financière.',
        dossier: [
          { id: 'Document 1', titre: 'Les niveaux de recours aux soins',
            texte: 'Soins primaires (1er recours) : médecin généraliste, infirmier, pharmacien, kinésithérapeute. Rôle de coordination et de prévention. Le médecin traitant est le pivot du parcours de soins coordonné. Soins secondaires (2e recours) : spécialistes sur orientation, hospitalisation programmée. Soins tertiaires (3e recours) : CHU, soins très spécialisés. Soins de proximité : HAD, SSIAD, EHPAD.' },
          { id: 'Document 2', titre: 'Les déserts médicaux en France (DREES, 2023)',
            texte: 'Définition : zone avec une accessibilité potentielle localisée (APL) inférieure à 2,5 consultations de médecin généraliste par habitant et par an. 11 % de la population française vit dans un désert médical (6,5 millions de personnes). 133 généralistes pour 100 000 hab. en zones rurales vs 198 en zones urbaines. Conséquences : recours plus tardif aux soins, aggravation des pathologies chroniques, surcharge des urgences (+5 %/an).' }
        ],
        questions: [
          { pts: 4, texte: '1. Présentez les différents niveaux de recours aux soins en France. Quel est le rôle du médecin traitant dans le parcours de soins coordonné ?' },
          { pts: 4, texte: '2. Analysez le phénomène des déserts médicaux en France. Quelles sont les causes et les conséquences sur la santé des populations concernées ?' },
          { pts: 4, texte: '3. Proposez et justifiez des mesures permettant de lutter contre les inégalités d\'accès aux soins. A quel niveau d\'intervention se situent ces mesures ?' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Prévention et promotion de la santé', isReal: false,
        intro: 'La santé publique moderne repose sur trois piliers : la prévention, la promotion de la santé et l\'éducation pour la santé. Ces approches complémentaires visent à agir en amont de la maladie pour améliorer l\'état de santé de la population.',
        dossier: [
          { id: 'Document 1', titre: 'Les niveaux de prévention (OMS)',
            texte: 'Prévention primaire : éviter l\'apparition de la maladie (vaccination, éducation à la santé). Prévention secondaire : dépistage précoce et traitement rapide (dépistage cancer, dépistage néonatal). Prévention tertiaire : limiter les complications et les rechutes (réhabilitation, éducation thérapeutique du patient - ETP). Prévention quaternaire : prévenir la surmédicalisation et les effets iatrogènes.' },
          { id: 'Document 2', titre: 'La stratégie nationale de santé 2018-2022',
            texte: 'La SNS repose sur 4 axes : 1. Mettre en place une politique de promotion de la santé ; 2. Lutter contre les inégalités sociales et territoriales de santé ; 3. Renforcer la pertinence et la qualité du système de santé ; 4. Innover pour transformer le système de santé. Elle mobilise les déterminants de santé : comportements, conditions de vie, accès aux soins, facteurs biologiques.' }
        ],
        questions: [
          { pts: 4, texte: '1. Distinguez les différents niveaux de prévention en illustrant chacun par un exemple concret.' },
          { pts: 4, texte: '2. Présentez les principaux axes de la politique de santé publique en France. Comment agit-elle sur les déterminants de la santé ?' },
          { pts: 4, texte: '3. L\'éducation thérapeutique du patient (ETP) est un outil de prévention tertiaire. Définissez l\'ETP et expliquez en quoi elle améliore la prise en charge des patients atteints de maladies chroniques.' }
        ]
      }
    ],

    protection: [
      {
        annee: 'Sujet type', theme: 'La protection sociale face aux risques sociaux', isReal: false,
        intro: 'La protection sociale française constitue un filet de sécurité collectif permettant de faire face aux principaux aléas de la vie. Son financement et son organisation sont régulièrement remis en question face aux évolutions économiques et démographiques.',
        dossier: [
          { id: 'Document 1', titre: 'Les risques couverts par la protection sociale',
            texte: 'La protection sociale couvre 9 risques : maladie, maternité-paternité, invalidité, accidents du travail et maladies professionnelles, vieillesse, famille, chômage, logement, pauvreté-exclusion sociale. En 2022, les dépenses totales de protection sociale représentent 34,4 % du PIB français. La branche maladie représente le poste le plus important (38 % des prestations).' },
          { id: 'Document 2', titre: 'Les modes de financement de la protection sociale',
            texte: 'Deux grands principes coexistent : le principe bismarckien (cotisations sociales proportionnelles aux salaires, droits liés au travail) et le principe beveridgien (financement fiscal universel, droits liés à la citoyenneté). La France a un système mixte. La CSG (Contribution Sociale Généralisée), créée en 1991, est prélevée sur tous les revenus et constitue désormais la principale ressource de la Sécurité Sociale.' }
        ],
        questions: [
          { pts: 4, texte: '1. Définissez la notion de risque social et présentez les principaux risques couverts par la protection sociale française.' },
          { pts: 4, texte: '2. Distinguez les principes bismarckien et beveridgien de financement de la protection sociale. Comment le système français articule-t-il ces deux logiques ?' },
          { pts: 4, texte: '3. La protection sociale française est confrontée à de nombreux défis (vieillissement, chômage, dépenses de santé). Proposez et justifiez des pistes de réforme pour assurer sa viabilité financière.' }
        ]
      },
      {
        annee: 'Sujet type', theme: "L'Assurance Maladie et le financement des soins", isReal: false,
        intro: "L'Assurance Maladie est la principale branche de la Sécurité Sociale. Elle couvre les dépenses de santé des assurés sociaux selon le principe de solidarité nationale. Son déficit chronique pose des questions sur son organisation et son financement.",
        dossier: [
          { id: 'Document 1', titre: 'Le ticket modérateur et les restes à charge',
            texte: "L'Assurance Maladie ne rembourse pas intégralement les soins. Le ticket modérateur est la part laissée à la charge de l'assuré (par ex. 30 % pour une consultation chez un généraliste). Dispositifs : Affection de Longue Durée (ALD) : prise en charge à 100 % pour 30 maladies chroniques. Complémentaire santé solidaire (CSS) : ex-CMU-C, pour les personnes aux revenus modestes. Franchise médicale : 50 centimes par boîte de médicament plafonnée à 50 euros/an." },
          { id: 'Document 2', titre: 'Le déficit de l\'Assurance Maladie et les réformes',
            texte: 'Le déficit de la branche maladie de la Sécurité Sociale atteint 7,7 milliards euros en 2023. Causes : vieillissement, maladies chroniques, coût des nouvelles technologies, fraudes (estimées à 3-6 milliards/an). Réformes engagées : développement des génériques (46 % des médicaments remboursés en 2023), virage ambulatoire, pertinence des soins, lutte contre la fraude.' }
        ],
        questions: [
          { pts: 4, texte: '1. Expliquez le mécanisme du ticket modérateur. Pourquoi des dispositifs de protection complémentaire ont-ils été mis en place ? Quels sont leurs enjeux en termes d\'équité ?' },
          { pts: 4, texte: '2. Analysez les causes du déficit chronique de l\'Assurance Maladie. Quelles réformes permettent d\'améliorer l\'équilibre financier de la branche maladie ?' },
          { pts: 4, texte: '3. Comment le principe de solidarité se traduit-il concrètement dans le fonctionnement du système ? Quelles tensions existent entre solidarité et responsabilité individuelle ?' }
        ]
      }
    ],

    politique_sp: [
      {
        annee: 'Sujet type', theme: 'Plan National Nutrition Santé (PNNS) et obésité', isReal: false,
        intro: "L'obésité est devenue un enjeu de santé publique mondial. En France, le Plan National Nutrition Santé (PNNS), lancé en 2001 et reconduit régulièrement, vise à améliorer l'état de santé de la population en agissant sur l'alimentation et l'activité physique.",
        dossier: [
          { id: 'Document 1', titre: 'Le PNNS 4 (2019-2023)',
            texte: 'Le PNNS 4 articule ses objectifs autour de 3 axes : 1. Améliorer l\'alimentation et l\'activité physique pour tous ; 2. Adapter les actions aux populations vulnérables (enfants, personnes précaires) ; 3. Créer des environnements favorables à la santé. Actions concrètes : Nutri-Score, réduction du sel/sucre/graisses saturées dans les aliments transformés, lutte contre la sédentarité.' },
          { id: 'Document 2', titre: 'Impact des politiques nutritionnelles : résultats et limites',
            texte: 'Depuis le premier PNNS, la consommation de fruits et légumes a légèrement augmenté et celle de sel diminué. Cependant, l\'obésité continue de progresser (17 % en 2023 vs 8 % en 1997). Inégalités sociales : les enfants de milieux défavorisés ont 2,5 fois plus de risque d\'obésité. Limites : efficacité limitée sur les comportements individuels, nécessité d\'agir sur les déterminants structurels (prix des aliments sains, déserts alimentaires, stress).' }
        ],
        questions: [
          { pts: 4, texte: '1. Présentez les principaux objectifs et actions du PNNS 4. A quel niveau de prévention ces actions se situent-elles ?' },
          { pts: 4, texte: '2. Evaluez l\'efficacité des politiques nutritionnelles en France. Comment expliquer les inégalités sociales face à l\'obésité ?' },
          { pts: 4, texte: '3. Quelle place pour la responsabilité individuelle dans la prévention de l\'obésité ? Faut-il mettre davantage l\'accent sur les politiques structurelles ? Développez une argumentation équilibrée.' }
        ]
      },
      {
        annee: 'Sujet type', theme: 'Les politiques de lutte contre les addictions', isReal: false,
        intro: 'Les conduites addictives (tabac, alcool, drogues illicites, addictions comportementales) constituent un enjeu majeur de santé publique en France. Le Plan National de Mobilisation contre les Addictions 2018-2022 vise à réduire la consommation et ses conséquences sanitaires et sociales.',
        dossier: [
          { id: 'Document 1', titre: 'Épidémiologie des addictions en France (OFDT, 2023)',
            texte: 'Tabac : 25 % des Français fumeurs quotidiens (premier facteur de mortalité évitable : 75 000 décès/an). Alcool : 2e cause de mortalité évitable (41 000 décès/an), 11,4 % des adultes ont une consommation à risque. Cannabis : 5 millions d\'usagers dans l\'année, 900 000 usagers quotidiens. Addictions comportementales (jeux, écrans) : en forte progression chez les jeunes. Coût social global des addictions : 180 milliards d\'euros/an.' },
          { id: 'Document 2', titre: 'Les outils de la politique de lutte contre les addictions',
            texte: 'Prévention primaire : programmes scolaires, campagnes d\'information (Moi(s) sans tabac, Dry January), réglementation de la publicité. Réduction des risques (RdR) : salles de consommation à moindre risque (SCMR), programmes d\'échange de seringues, naloxone. Traitement : consultations en addictologie, CSAPA, substitution (méthadone, buprénorphine). Mesures fiscales : taxes sur le tabac et l\'alcool.' }
        ],
        questions: [
          { pts: 4, texte: '1. Analysez l\'ampleur des conduites addictives en France et leurs conséquences sanitaires et sociales.' },
          { pts: 4, texte: '2. Présentez les différentes stratégies de lutte contre les addictions. Distinguez les approches d\'abstinence et de réduction des risques.' },
          { pts: 4, texte: '3. La politique de réduction des risques (notamment les salles de consommation à moindre risque) est parfois controversée. Présentez les arguments pour et contre cette approche en vous appuyant sur des données de santé publique.' }
        ]
      }
    ],

    inegalites: [
      {
        annee: 'Sujet type', theme: 'Les inégalités sociales de santé (ISS)', isReal: false,
        intro: 'En France, derrière les moyennes d\'espérance de vie se cachent de profondes inégalités sociales, territoriales et de genre qui interrogent les principes d\'équité et les politiques de santé publique.',
        dossier: [
          { id: 'Document 1', titre: 'Le gradient social de santé (HCSP, 2022)',
            texte: 'Le gradient social de santé désigne la relation progressive entre le statut socioéconomique et l\'état de santé. En France : l\'espérance de vie des cadres supérieurs à 35 ans est de 6 ans supérieure à celle des ouvriers (hommes). La mortalité prématurée est 3 fois plus élevée chez les sans-diplôme que chez les diplômés du supérieur. Les déterminants : conditions de vie et de travail, accès aux soins, comportements de santé, facteurs psychosociaux (stress, sentiment de contrôle).' },
          { id: 'Document 2', titre: 'Les inégalités territoriales de santé',
            texte: 'L\'espérance de vie varie de 3 ans entre les régions françaises (Bretagne vs Hauts-de-France). Les zones rurales sont touchées par les déserts médicaux et des comportements à risque plus fréquents. Les QPV (Quartiers Prioritaires de la politique de la Ville) cumulent les facteurs de risque : chômage, précarité, logements insalubres, pollution, accès limité aux soins. La Covid-19 a révélé et aggravé ces inégalités territoriales.' }
        ],
        questions: [
          { pts: 4, texte: '1. Expliquez le concept de gradient social de santé. Quels sont les principaux déterminants sociaux qui expliquent ces inégalités ?' },
          { pts: 4, texte: '2. Analysez les inégalités territoriales de santé en France. Comment les quartiers prioritaires et les zones rurales sont-ils spécifiquement touchés ?' },
          { pts: 4, texte: '3. Quelles politiques publiques permettent de réduire les inégalités sociales et territoriales de santé ? Illustrez votre réponse par des exemples concrets et évaluez leur efficacité.' }
        ]
      }
    ],

    vieillissement: [
      {
        annee: 'Sujet type', theme: 'Vieillissement de la population et autonomie des personnes âgées', isReal: false,
        intro: 'La France vieillit : en 2050, une personne sur quatre sera âgée de plus de 65 ans. Ce phénomène démographique pose des défis majeurs en termes de prise en charge, de financement et d\'organisation du système de santé et médico-social.',
        dossier: [
          { id: 'Document 1', titre: 'Le vieillissement en France : données démographiques (INSEE, 2023)',
            texte: 'En 2023, la France compte 13,7 millions de personnes de plus de 65 ans (20 % de la population). En 2050, cette proportion passera à 26,5 %. Le nombre de personnes dépendantes passerait de 1,4 million en 2020 à 2,5 millions en 2050. Les plus de 85 ans représentent la classe d\'âge à la croissance la plus rapide. La maladie d\'Alzheimer touche 900 000 personnes et constitue la première cause de dépendance.' },
          { id: 'Document 2', titre: "L'APA (Allocation Personnalisée d'Autonomie) et la grille AGGIR",
            texte: "L'APA est attribuée aux personnes âgées dépendantes de plus de 60 ans (GIR 1 à 4). La grille AGGIR (Autonomie Gérontologique Groupes Iso-Ressources) évalue le niveau de dépendance selon 17 variables (toilette, habillage, alimentation, déplacements, cohérence...). GIR 1 et 2 : dépendance totale ; GIR 3 et 4 : dépendance partielle ; GIR 5 et 6 : personnes autonomes. L'APA à domicile finance un plan d'aide (auxiliaire de vie, portage repas, téléassistance). L'APA en établissement finance une partie du tarif dépendance en EHPAD." }
        ],
        questions: [
          { pts: 4, texte: '1. Présentez les grandes tendances du vieillissement démographique en France et ses conséquences sur le système de santé et de protection sociale.' },
          { pts: 4, texte: '2. Expliquez le fonctionnement de l\'APA. Comment la grille AGGIR permet-elle d\'objectiver le niveau de dépendance et d\'adapter la prise en charge ?' },
          { pts: 4, texte: '3. Le maintien à domicile est une priorité des politiques gérontologiques. Quelles sont les conditions nécessaires à sa réussite ? Quelles sont ses limites et quand l\'entrée en EHPAD devient-elle nécessaire ?' }
        ]
      }
    ],

    sante_mentale: [
      {
        annee: 'Sujet type', theme: 'La santé mentale : un enjeu de société', isReal: false,
        intro: 'La santé mentale est définie par l\'OMS comme "un état de bien-être dans lequel une personne peut se réaliser, surmonter les tensions normales de la vie, accomplir un travail productif et contribuer à la vie de sa communauté." En France, les troubles psychiatriques touchent environ 13 millions de personnes.',
        dossier: [
          { id: 'Document 1', titre: 'Épidémiologie des troubles de santé mentale en France (SPF, 2023)',
            texte: 'Prévalence sur la vie entière : dépression 15 %, troubles anxieux 17 %, schizophrénie 1 %, troubles bipolaires 2 %. Les troubles psychiatriques représentent la 1ère cause d\'invalidité professionnelle et la 2e cause d\'arrêt maladie longue durée. La Covid-19 a entraîné une hausse de 20 % des épisodes dépressifs et une multiplication par 2 des idées suicidaires chez les 15-24 ans. En France : 9 000 décès par suicide par an (1er cause de mort chez les 25-34 ans).' },
          { id: 'Document 2', titre: 'La psychiatrie de secteur et la désinstitutionnalisation',
            texte: 'La psychiatrie de secteur (loi du 31 décembre 1985) : chaque territoire est divisé en secteurs géographiques dotés d\'équipes soignantes pluridisciplinaires (psychiatre, infirmier, psychologue, assistante sociale). Objectif : maintien dans la communauté et prévention de l\'hospitalisation (ambulatoire, hôpital de jour, CMP). La France a réduit de moitié le nombre de lits psychiatriques depuis 1980, sans toujours développer suffisamment les structures ambulatoires de substitution.' }
        ],
        questions: [
          { pts: 4, texte: '1. Dressez un état des lieux de la santé mentale en France. Quels groupes de population sont particulièrement vulnérables et pourquoi ?' },
          { pts: 4, texte: '2. Expliquez le principe de la psychiatrie de secteur et les objectifs de la désinstitutionnalisation. Quelles limites cette politique a-t-elle rencontrées ?' },
          { pts: 4, texte: '3. Comment améliorer la prise en charge de la santé mentale en France ? Discutez les rôles respectifs de la prévention, du soin et de l\'inclusion sociale.' }
        ]
      }
    ],

    pauvrete: [
      {
        annee: 'Sujet type', theme: 'Pauvreté, exclusion sociale et RSA', isReal: false,
        intro: 'En France en 2023, 9,1 millions de personnes vivent sous le seuil de pauvreté (60 % du niveau de vie médian, soit environ 1 158 euros/mois). La pauvreté est un phénomène multidimensionnel qui touche à la fois le revenu, le logement, la santé et l\'accès aux droits fondamentaux.',
        dossier: [
          { id: 'Document 1', titre: 'Mesure et formes de la pauvreté (INSEE, 2023)',
            texte: 'Taux de pauvreté monétaire : 14,4 % de la population française. Groupes les plus touchés : les enfants (20,7 %), les familles monoparentales (36 %), les jeunes de 18-24 ans (20 %), les personnes nées hors UE (42 %). La grande pauvreté (sans-abri, sans domicile fixe) touche 330 000 personnes, dont 42 000 dans la rue (Fondation Abbé Pierre, 2023).' },
          { id: 'Document 2', titre: 'Le RSA : bilan et perspectives (DREES, 2023)',
            texte: 'Le Revenu de Solidarité Active (RSA) a été créé par la loi du 1er décembre 2008. Montant : 607 euros pour une personne seule (2023). Bénéficiaires : 1,85 million de foyers. Objectifs : garantir un minimum de ressources ET favoriser l\'insertion professionnelle (droits et devoirs). Bilan : efficace pour sortir de la grande pauvreté, mais trappe à pauvreté possible. Taux de non-recours estimé à 34 % (600 000 foyers potentiellement éligibles ne percevant pas la prestation).' }
        ],
        questions: [
          { pts: 4, texte: '1. Analysez les différentes dimensions de la pauvreté en France. Quels groupes sociaux sont les plus vulnérables et pour quelles raisons ?' },
          { pts: 4, texte: '2. Présentez le fonctionnement du RSA. Quels sont ses atouts et ses limites ? Comment le non-recours affecte-t-il son efficacité ?' },
          { pts: 4, texte: '3. La lutte contre la pauvreté nécessite-t-elle uniquement des politiques sociales de revenu, ou faut-il agir plus globalement sur les déterminants de l\'exclusion ? Développez votre argumentation.' }
        ]
      }
    ]

  };

  /* -- État -------------------------------------------------------- */
  let subj = 'cbph';
  let qIdx = 0;
  let stssChap = 'natalite';
  let timerInterval = null;
  let timerSeconds = 0;
  let timerRunning = false;

  /* -- Helpers ----------------------------------------------------- */
  function _currentBank() {
    if (subj === 'cbph') return CBPH_QUESTIONS;
    return STSS_QUESTIONS[stssChap] || [];
  }
  function _currentQ() {
    var bank = _currentBank();
    return bank[qIdx] || null;
  }

  /* -- Init -------------------------------------------------------- */
  function init() {
    var chapRow = document.getElementById('bac-chap-row');
    if (chapRow && chapRow.children.length === 0) {
      STSS_CHAPITRES.forEach(function(ch) {
        var btn = document.createElement('button');
        btn.className = 'bac-chap-btn' + (ch.id === stssChap ? ' active' : '');
        btn.textContent = ch.label;
        btn.onclick = function() { switchChap(ch.id); };
        chapRow.appendChild(btn);
      });
    }
    _render();
  }

  /* -- Changer de matière ------------------------------------------ */
  function switchSubject(s) {
    subj = s; qIdx = 0;
    document.querySelectorAll('.bac-tab').forEach(function(b) {
      b.classList.toggle('active', b.dataset.subj === s);
    });
    var badge = document.getElementById('bac-subj-badge');
    if (badge) {
      badge.textContent = s === 'cbph' ? 'CBPH' : 'STSS';
      badge.className = 'bac-badge bac-badge-' + s;
    }
    var chapRow = document.getElementById('bac-chap-row');
    if (chapRow) chapRow.style.display = s === 'stss' ? 'flex' : 'none';
    _resetTimer();
    _render();
  }

  /* -- Changer de chapitre STSS ------------------------------------ */
  function switchChap(c) {
    stssChap = c; qIdx = 0;
    document.querySelectorAll('.bac-chap-btn').forEach(function(btn) {
      var chap = STSS_CHAPITRES.find(function(ch) { return ch.label === btn.textContent; });
      btn.classList.toggle('active', chap && chap.id === c);
    });
    _resetTimer();
    _render();
  }

  /* -- Navigation -------------------------------------------------- */
  function prevQ() {
    var bank = _currentBank();
    if (!bank.length) return;
    qIdx = (qIdx - 1 + bank.length) % bank.length;
    _resetTimer(); _render();
  }
  function nextQ() {
    var bank = _currentBank();
    if (!bank.length) return;
    qIdx = (qIdx + 1) % bank.length;
    _resetTimer(); _render();
  }

  /* -- Rendu ------------------------------------------------------- */
  function _esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _render() {
    var q = _currentQ();
    var bank = _currentBank();
    var counter = document.getElementById('bac-q-counter');
    if (counter) counter.textContent = bank.length ? (qIdx+1)+' / '+bank.length : '—';

    var badge = document.getElementById('bac-subj-badge');
    if (badge && subj === 'stss' && q) {
      var chap = STSS_CHAPITRES.find(function(ch) { return ch.id === stssChap; });
      var chapLabel = chap ? chap.label : '';
      var realTag = q.isReal ? ' · Annale réelle' : ' · Sujet type';
      badge.textContent = chapLabel + realTag;
      badge.className = 'bac-badge bac-badge-stss';
    }

    var dossierEl = document.getElementById('bac-dossier');
    var questEl   = document.getElementById('bac-questions');
    if (!q) {
      if (dossierEl) dossierEl.innerHTML = '<p style="color:var(--gray-400);padding:20px 0">Aucun sujet disponible.</p>';
      if (questEl)   questEl.innerHTML   = '';
      return;
    }

    /* Dossier */
    var dHtml = '<div class="bac-dossier-title">&#128196; '+_esc(q.annee)+' — '+_esc(q.theme)+'</div>';
    if (q.intro) dHtml += '<div class="bac-intro">'+_esc(q.intro).replace(/\n/g,'<br>')+'</div>';
    (q.dossier||[]).forEach(function(doc) {
      dHtml += '<div class="bac-doc"><strong>'+_esc(doc.id)+(doc.titre?' — '+_esc(doc.titre):'')+'</strong>'
             + '<p>'+_esc(doc.texte).replace(/\n/g,'<br>')+'</p></div>';
    });
    if (dossierEl) dossierEl.innerHTML = dHtml;

    /* Questions */
    var totalPts = (q.questions||[]).reduce(function(s,qst){ return s+(qst.pts||0); }, 0);
    var qHtml = '<div class="bac-q-header">Questions <span class="bac-pts-total">— '+totalPts+' pts au total</span></div>';
    (q.questions||[]).forEach(function(qst) {
      qHtml += '<div class="bac-q-item"><span class="bac-pts">'+qst.pts+' pt'+(qst.pts>1?'s':'')+'</span>'
             + '<span>'+_esc(qst.texte).replace(/\n/g,'<br>')+'</span></div>';
    });
    if (questEl) questEl.innerHTML = qHtml;

    /* Réinitialiser réponse */
    var ta = document.getElementById('bac-answer');
    if (ta) ta.value = '';
    var wc = document.getElementById('bac-wcount');
    if (wc) wc.textContent = '0 mot';
  }

  /* -- Compteur de mots -------------------------------------------- */
  function onInput() {
    var ta = document.getElementById('bac-answer');
    var wc = document.getElementById('bac-wcount');
    if (!ta||!wc) return;
    var words = ta.value.trim().split(/\s+/).filter(function(w){ return w.length>0; }).length;
    wc.textContent = words+' mot'+(words>1?'s':'');
  }

  /* -- Timer ------------------------------------------------------- */
  function toggleTimer() {
    var btn = document.getElementById('bac-timer-btn');
    if (!timerRunning) {
      timerRunning = true;
      if (btn) btn.textContent = 'Pause';
      timerInterval = setInterval(_tickTimer, 1000);
    } else {
      timerRunning = false;
      if (btn) btn.textContent = 'Reprendre';
      clearInterval(timerInterval);
    }
  }
  function _tickTimer() {
    timerSeconds++;
    var val  = document.getElementById('bac-timer-val');
    var wrap = document.getElementById('bac-timer-wrap');
    if (!val) return;
    var m = Math.floor(timerSeconds/60), s = timerSeconds%60;
    val.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    if (wrap) {
      wrap.classList.remove('bac-timer-warn','bac-timer-danger');
      if (timerSeconds>=3000) wrap.classList.add('bac-timer-danger');
      else if (timerSeconds>=2400) wrap.classList.add('bac-timer-warn');
    }
  }
  function _resetTimer() {
    clearInterval(timerInterval); timerRunning=false; timerSeconds=0;
    var val = document.getElementById('bac-timer-val');
    if (val) val.textContent='00:00';
    var btn = document.getElementById('bac-timer-btn');
    if (btn) btn.textContent='Démarrer';
    var wrap = document.getElementById('bac-timer-wrap');
    if (wrap) wrap.classList.remove('bac-timer-warn','bac-timer-danger');
  }

  // ===== PROVIDERS IA =====

  var _PROVIDERS = {
    groq: {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-70b-versatile',
      keyPrefix: 'gsk_',
      info: 'Gratuit sans limite. Cle sur console.groq.com (pas de CB). Modele : Llama 3.1 70B.',
      needsKey: true
    },
    ollama: {
      name: 'Ollama',
      url: 'http://localhost:11434/v1/chat/completions',
      model: 'llama3.1',
      keyPrefix: '',
      info: 'Local sur ton PC. Installe ollama.ai puis lance : ollama pull llama3.1. Aucune cle necesssaire.',
      needsKey: false
    },
    openai: {
      name: 'OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      keyPrefix: 'sk-',
      info: 'Payant. Cle sur platform.openai.com. Modele : GPT-4o mini.',
      needsKey: true
    }
  };

  var _PROV_KEY = 'ifsi_ai_provider';
  var _AI_KEY   = 'ifsi_ai_apikey';

  function _currentProvider() {
    return _PROVIDERS[localStorage.getItem(_PROV_KEY) || 'groq'] || _PROVIDERS.groq;
  }

  function setProvider(id) {
    localStorage.setItem(_PROV_KEY, id);
    // Mettre a jour les boutons
    document.querySelectorAll('.ai-prov-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.prov === id);
    });
    // Mettre a jour l'info et le champ cle
    var prov = _PROVIDERS[id] || _PROVIDERS.groq;
    var info = document.getElementById('ai-prov-info');
    if (info) info.textContent = prov.info;
    var keyWrap = document.getElementById('ai-key-wrap');
    var keyLbl  = document.getElementById('ai-key-label');
    var keyInp  = document.getElementById('claude-api-key-input');
    if (keyWrap) keyWrap.style.display = prov.needsKey ? 'block' : 'none';
    if (keyLbl)  keyLbl.textContent = 'Cle API ' + prov.name;
    if (keyInp)  keyInp.placeholder = prov.needsKey ? (prov.keyPrefix + '...') : '(non necessaire)';
    // Mise a jour du bouton de correction
    var btn = document.getElementById('bac-correct-btn');
    if (btn) btn.textContent = 'Corriger avec ' + prov.name;
    // Mise a jour du header correction
    var hdr = document.querySelector('.bac-correction-header span');
    if (hdr) hdr.textContent = 'Correction par ' + prov.name;
  }

  // Init provider UI au chargement
  function _initProviderUI() {
    var saved = localStorage.getItem(_PROV_KEY) || 'groq';
    setProvider(saved);
  }

  // ===== CLE API =====

  function saveApiKey() {
    var inp = document.getElementById('claude-api-key-input');
    var st  = document.getElementById('claude-key-status');
    if (!inp) return;
    var key = inp.value.trim();
    var prov = _currentProvider();
    if (prov.needsKey && !key) {
      if (st) { st.style.display='block'; st.style.color='#dc2626'; st.textContent='Entre une cle API.'; }
      return;
    }
    localStorage.setItem(_AI_KEY + '_' + (localStorage.getItem(_PROV_KEY)||'groq'), key);
    inp.value = '';
    if (st) { st.style.display='block'; st.style.color='#16a34a'; st.textContent='Cle enregistree !'; }
    setTimeout(function(){ if(st) st.style.display='none'; }, 2500);
  }

  function clearApiKey() {
    var provId = localStorage.getItem(_PROV_KEY) || 'groq';
    localStorage.removeItem(_AI_KEY + '_' + provId);
    var inp = document.getElementById('claude-api-key-input');
    if (inp) inp.value = '';
    var st = document.getElementById('claude-key-status');
    if (st) { st.style.display='block'; st.style.color='var(--gray-500)'; st.textContent='Cle supprimee.'; }
    setTimeout(function(){ if(st) st.style.display='none'; }, 2000);
  }

  // ===== CONSTRUCTION DU PROMPT =====

  function _buildPrompt(q, answer) {
    var label = subj === 'cbph' ? 'CBPH' : 'STSS';
    var totalPts = (q.questions||[]).reduce(function(s,qst){ return s + (qst.pts||0); }, 0);
    var p = 'Tu es un professeur de terminale ST2S exigeant et bienveillant, correcteur du baccalaureat. ';
    p += 'Voici un sujet de ' + label + ' et la reponse d un eleve. ';
    p += 'Corrige cette reponse en : commencant par une appreciation generale (2-3 lignes), ';
    p += 'puis en commentant chaque question separement (ce qui est bon, ce qui manque, les erreurs), ';
    p += 'et en terminant par une NOTE/' + totalPts + ' pts justifiee avec des conseils.';
    p += '\n\n=== SUJET : ' + q.annee + ' - ' + q.theme + ' ===\n\n';
    if (q.dossier && q.dossier.length) {
      q.dossier.forEach(function(doc) {
        p += '[' + doc.id + (doc.titre ? ' - ' + doc.titre : '') + ']\n' + doc.texte + '\n\n';
      });
    }
    p += '=== QUESTIONS ===\n';
    (q.questions||[]).forEach(function(qst) { p += '(' + qst.pts + ' pts) ' + qst.texte + '\n'; });
    p += '\n=== REPONSE DE L ELEVE ===\n' + (answer.trim() || '(pas de reponse redigee)');
    return p;
  }

  // ===== APPEL API =====

  function submitAnswer() {
    var q = _currentQ();
    if (!q) return;
    var answer = (document.getElementById('bac-answer')||{}).value || '';
    var provId  = localStorage.getItem(_PROV_KEY) || 'groq';
    var prov    = _PROVIDERS[provId] || _PROVIDERS.groq;
    var apiKey  = prov.needsKey ? (localStorage.getItem(_AI_KEY + '_' + provId) || '') : 'ollama';

    if (prov.needsKey && !apiKey) {
      var overlay = document.getElementById('sync-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        requestAnimationFrame(function(){ overlay.style.opacity = '1'; });
        setTimeout(function(){
          setProvider(provId);
          var el = document.getElementById('claude-api-key-input');
          if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); el.focus(); }
        }, 200);
      }
      return;
    }

    var corrWrap = document.getElementById('bac-correction');
    var corrBody = document.getElementById('bac-correction-body');
    if (!corrWrap || !corrBody) return;
    corrWrap.style.display = 'block';
    corrBody.innerHTML = '<div class="bac-correction-loading">Correction en cours avec ' + prov.name + '...</div>';
    corrWrap.scrollIntoView({behavior:'smooth', block:'nearest'});

    var btn = document.getElementById('bac-correct-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Correction...'; }

    var prompt = _buildPrompt(q, answer);
    var headers = { 'Content-Type': 'application/json' };
    if (prov.needsKey) headers['Authorization'] = 'Bearer ' + apiKey;

    fetch(prov.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: prov.model,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: 'Tu es un professeur de terminale ST2S. Tu utilises le markdown pour structurer tes corrections.' },
          { role: 'user', content: prompt }
        ]
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (btn) { btn.disabled = false; btn.textContent = 'Corriger avec ' + prov.name; }
      if (data.error) {
        corrBody.innerHTML = '<p style="color:var(--danger);font-size:.85rem;">Erreur ' + prov.name + ' : ' + _esc(data.error.message || JSON.stringify(data.error)) + '</p>';
        return;
      }
      var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      corrBody.innerHTML = _mdToHtml(text);
      _renderMath(corrBody);
    })
    .catch(function(err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Corriger avec ' + prov.name; }
      var msg = String(err);
      if (provId === 'ollama' && msg.indexOf('Failed to fetch') !== -1) {
        msg = 'Impossible de joindre Ollama. Lance "ollama serve" dans un terminal, puis reessaie.';
      }
      corrBody.innerHTML = '<p style="color:var(--danger);font-size:.85rem;">' + _esc(msg) + '</p>';
    });
  }

  // ===== COPIER (fallback) =====

  function copyAnswer() {
    var q = _currentQ();
    if (!q) return;
    var answer = (document.getElementById('bac-answer')||{}).value || '';
    var prompt = _buildPrompt(q, answer);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(prompt).then(_showToast).catch(function(){ _fallbackCopy(prompt); });
      } else { _fallbackCopy(prompt); }
    } catch(e) { _fallbackCopy(prompt); }
  }

  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); _showToast(); } catch(e) { alert('Copiez ce texte manuellement.'); }
    document.body.removeChild(ta);
  }

  function _showToast() {
    var toast = document.getElementById('bac-toast');
    if (!toast) return;
    toast.style.opacity = '1'; toast.style.transform = 'translate(-50%,0)';
    setTimeout(function(){ toast.style.opacity='0'; toast.style.transform='translate(-50%,8px)'; }, 2800);
  }

  // ===== RENDU KATEX =====

  function _renderMath(el) {
    if (!el || !window.renderMathInElement) return;
    try {
      renderMathInElement(el, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$',  right: '$',  display: false}
        ],
        throwOnError: false
      });
    } catch(e) {}
  }

  // ===== MARKDOWN -> HTML =====

  function _mdToHtml(text) {
    var lines = text.split('\n');
    var html = '';
    var inList = false;
    lines.forEach(function(rawLine) {
      if (/^## /.test(rawLine))        { if(inList){html+='</ul>';inList=false;} html += '<h2>' + _inlineMd(rawLine.slice(3)) + '</h2>'; }
      else if (/^# /.test(rawLine))    { if(inList){html+='</ul>';inList=false;} html += '<h2>' + _inlineMd(rawLine.slice(2)) + '</h2>'; }
      else if (/^### /.test(rawLine))  { if(inList){html+='</ul>';inList=false;} html += '<h3>' + _inlineMd(rawLine.slice(4)) + '</h3>'; }
      else if (/^[-*] /.test(rawLine)) { if(!inList){html+='<ul>';inList=true;} html += '<li>' + _inlineMd(rawLine.slice(2)) + '</li>'; }
      else if (rawLine.trim() === '')  { if(inList){html+='</ul>';inList=false;} html += '<br>'; }
      else { if(inList){html+='</ul>';inList=false;} html += '<p>' + _inlineMd(rawLine) + '</p>'; }
    });
    if (inList) html += '</ul>';
    html = html.replace(/(Note\s*(?:finale|globale|:)?\s*[:/]?\s*[\d.,]+\s*\/\s*\d+[^<]*)/gi,
      '<div class="corr-grade">$1</div>');
    return html;
  }

  function _inlineMd(s) {
    var result = '';
    var i = 0;
    while (i < s.length) {
      if (s[i] === '$' && s[i+1] === '$') {
        var end = s.indexOf('$$', i+2);
        if (end !== -1) { result += s.slice(i, end+2); i = end+2; continue; }
      }
      if (s[i] === '$') {
        var end2 = s.indexOf('$', i+1);
        if (end2 !== -1 && end2 > i+1) { result += s.slice(i, end2+1); i = end2+1; continue; }
      }
      result += s[i]; i++;
    }
    return _esc(result)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  }

  // ===== RENDU FORMULES DOSSIER =====

  function _renderDossierMath() {
    _renderMath(document.getElementById('bac-dossier'));
    _renderMath(document.getElementById('bac-questions'));
  }

  // ===== API PUBLIQUE =====

  return {
    init: function() { _initProviderUI(); init(); },
    switchSubject: switchSubject, switchChap: switchChap,
    prevQ: prevQ, nextQ: nextQ, onInput: onInput,
    toggleTimer: toggleTimer, submitAnswer: submitAnswer, copyAnswer: copyAnswer,
    saveApiKey: saveApiKey, clearApiKey: clearApiKey, setProvider: setProvider
  };

})();
