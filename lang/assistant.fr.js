/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — Contenu du MODE ASSISTANT (Français)
   Enregistré dans window.ASSIST_LANG.fr ; lu par assistant.js selon la langue.
   Pour ajouter une langue : copier ce fichier, traduire les valeurs,
   et enregistrer dans window.ASSIST_LANG.<code>.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  window.ASSIST_LANG = window.ASSIST_LANG || {};

  window.ASSIST_LANG.fr = {
    /* ── Interface du panneau ── */
    toggle: "Mode assistant",
    toggleTitle: "Guide pas-à-pas : met en avant l'étape en cours et détaille les champs",
    panelTitle: "Mode assistant",
    disable: "Désactiver",

    /* ── Barème (ajouté en tête des champs pour tous les types) ── */
    notation: "<strong>Barème (notation)</strong> — dans le bandeau jaune en haut du formulaire : nombre de points attribués à la question.",

    /* ── Étapes ── */
    step1: {
      title: "Étape 1 — Nommer",
      explain: "Donnez un nom à votre exercice dans le champ en surbrillance, puis appuyez sur <strong>Entrée</strong> ou cliquez ailleurs.",
      tip: "Ce nom identifiera l'exercice généré pour Moodle."
    },
    step2: {
      title: "Étape 2 — Choisir un type",
      explain: "Cliquez sur le <strong>type de question</strong> à créer parmi les cartes en surbrillance.",
      tip: "Chaque type ouvre un formulaire adapté juste en dessous — le guide se précisera alors champ par champ."
    },
    step3: {
      editTitle: "Édition de Q{n} — {label}",
      editExplain: "Vous modifiez la question <strong>Q{n}</strong>. Ajustez les champs ci-dessous :",
      editDo: "Cliquez sur « Mettre à jour Q{n} » pour enregistrer, ou « Annuler » pour abandonner.",
      title: "Étape 3 — {label}",
      noGuideExplain: "Complétez le formulaire en surbrillance, puis ajoutez la question.",
      noGuideDo: "Cliquez sur « Ajouter cette question ».",
      do: "Une fois rempli, cliquez sur « Ajouter cette question ».",
      done: "{qn} question(s) déjà ajoutée(s). Recommencez pour en ajouter d'autres, ou passez à l'étape 4."
    },
    step4: {
      title: "Étape 4 — Générer",
      explain: "Vos <strong>{qn} question(s)</strong> sont prêtes. Cliquez sur « <strong>🏷️ Tags &amp; Prévisualisation</strong> » pour vérifier, puis générer et exporter.",
      tip: "Vous pouvez encore modifier (✏️) ou supprimer (✕) une question via ses pastilles."
    },

    /* ── Liste latérale des étapes ── */
    stepsList: ["Nommer l'exercice", "Choisir un type", "Remplir puis ajouter", "Générer / exporter"],

    /* ── Variantes V4 (éditeur glisser-déposer) ── */
    step2_v4: {
      title: "Étape 2 — Insérer une question",
      explain: "Dans la palette à <strong>gauche</strong>, cliquez sur une catégorie pour la déplier, puis glissez un bloc dans l'éditeur.",
      tip: "Le panneau de configuration s'ouvrira automatiquement pour paramétrer la question."
    },
    step3_v4: {
      editTitle: "Configuration de Q{n} — {label}",
      editExplain: "Complétez les champs pour la question <strong>Q{n}</strong> :",
      editDo: "Cliquez sur « Enregistrer » pour valider.",
      title: "Étape 3 — {label}",
      noGuideExplain: "Complétez le formulaire en surbrillance.",
      noGuideDo: "Cliquez sur « Enregistrer ».",
      do: "Une fois rempli, cliquez sur « Enregistrer ».",
      done: "{qn} question(s) déjà configurée(s). Insérez-en d'autres ou passez à l'export."
    },
    step4_v4: {
      title: "Étape 4 — Exporter",
      explain: "Vos <strong>{qn} question(s)</strong> sont prêtes. Cliquez sur <strong>Exporter le XML</strong> pour vérifier et télécharger.",
      tip: "Les puces grisées signalent des questions encore à configurer."
    },
    stepsList_v4: ["Nommer l'exercice", "Glisser un bloc", "Configurer", "Exporter"],

    /* ── Bannière d'aide dans les fenêtres « Prompt IA » ── */
    prompt: {
      title: "Comment utiliser le Prompt IA",
      steps: [
        "Renseignez le <strong>contexte</strong> ci-dessous (thème, matière, niveau, langue, nombre d'items).",
        "Le <strong>prompt se construit tout seul</strong> dans le cadre sombre en bas.",
        "Cliquez sur « <strong>📋 Copier le prompt</strong> ».",
        "Collez-le dans une <strong>IA</strong> (ChatGPT, Claude, Gemini…) et lancez la génération.",
        "Récupérez le <strong>résultat</strong> produit par l'IA (au format JSON).",
        "Revenez dans Stackforge et <strong>importez-le</strong> via le bouton « 📥 JSON » du formulaire."
      ],
      note: "⚠️ <strong>Ne confondez pas avec l'affichage élève.</strong> " +
        "Ces deux champs décrivent ce que <strong>l'IA doit produire</strong> (le vivier), pas ce que verra l'élève :" +
        "<ul class=\"hs-pb-note-list\">" +
          "<li>« <strong>Propositions totales (XE)</strong> » = nombre total de propositions à <strong>créer</strong> " +
            "(vivier VRAI + FAUX), et non le nombre affiché à l'élève.</li>" +
          "<li>« <strong>Propositions vraies (XB)</strong> » = nombre de propositions vraies à <strong>générer</strong> " +
            "dans ce vivier, et non le nombre de bonnes réponses montrées à l'élève.</li>" +
        "</ul>" +
        "Le nombre réellement affiché et tiré au sort se règle <strong>dans le formulaire</strong>, pas ici."
    },

    /* ── Libellés lisibles par type ── */
    TYPE_LABEL: {
      checkbox: "Cases à cocher", radio: "Bouton radio", dropdown: "Menu déroulant",
      algebraic: "Algébrique", numerical: "Arithmétique", units: "Unité", string: "Texte (String)",
      match: "Relier (Matching)", crossword: "Mots croisés", doi: "Diagramme objets-interactions",
      chemical: "Chimie — équation", chemical_topo: "Chimie topologique",
      nuclear: "Réaction nucléaire", composition: "Composition",
      jxgdrop: "Glisser-Déposer (JSXGraph)", vf: "Vrai / Faux", ord: "Classement",
      imgclick: "Sélection sur image", glr: "Lecture graphique", rvbcmj: "RVB / CMJN",
      optique: "Optique géométrique", "acide-base": "pH-métrie / Titrage", redox: "Dosage redox",
      basen: "Conversion de base N", circuit: "Circuits électriques",
      logique: "Logique booléenne", complexe: "Nombres complexes",
      calcul: "Calcul différentiel et intégral", statistiques: "Statistiques",
      matrices: "Matrices", geometrie: "Géométrie analytique",
      suites: "Suites numériques", probabilites: "Probabilités",
      trigonometrie: "Trigonométrie", polynomes: "Polynômes du 2nd degré",
      limites: "Limites de fonctions", physique: "Physique — Mécanique",
      inequation: "Inéquations (ensemble-solution)", thermo: "Thermodynamique (gaz parfaits, chaleur)"
    },

    /* ── Guidage détaillé de l'étape 3, champ par champ, par type ── */
    STEP3: {
      checkbox: {
        intro: "QCM à choix multiples : Stackforge tire au sort les bonnes/mauvaises propositions à chaque tentative.",
        fields: [
          "<strong>Énoncé</strong> — cliquez sur « ✏️ Éditeur » pour rédiger la question (texte, formule, image).",
          "<strong>Barème</strong> (bandeau jaune en haut) — points attribués.",
          "<strong>Nombre total de propositions</strong> — combien de cases l'élève verra.",
          "<strong>Nb bonnes réponses</strong> — combien sont vraies (nombre fixe ou aléatoire).",
          "<strong>Propositions</strong> — ajoutez vos réponses avec « ✅ + VRAI » et « ❌ + FAUX ».",
          "<strong>Feedback</strong> — messages affichés si correct / si erreur."
        ],
        tip: "Mettez plus de propositions VRAI/FAUX que le nombre affiché : le tirage au sort variera d'un élève à l'autre."
      },
      radio: {
        intro: "Une seule bonne réponse : tirée du pool VRAIS, entourée de distracteurs du pool FAUX.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Barème</strong> — points.",
          "<strong>Nb total de boutons affichés</strong> — 1 bonne réponse + le reste en distracteurs.",
          "<strong>Pool VRAIS</strong> — ajoutez les bonnes réponses possibles (« + Bonne réponse »).",
          "<strong>Pool FAUX</strong> — ajoutez les distracteurs."
        ],
        tip: "Plusieurs bonnes réponses dans le pool VRAIS = une variante différente à chaque passage."
      },
      dropdown: {
        intro: "Même principe que le bouton radio, mais sous forme de menu déroulant.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Barème</strong> — points.",
          "<strong>Nb de propositions affichées</strong> dans le menu.",
          "<strong>Pool VRAIS</strong> — bonnes réponses.",
          "<strong>Pool FAUX</strong> — distracteurs."
        ]
      },
      algebraic: {
        intro: "L'élève saisit une expression mathématique ; Stackforge vérifie l'équivalence algébrique.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Variables</strong> — listez celles utilisées (ex : x, y, z).",
          "<strong>Réponse attendue</strong> — l'expression correcte. Utilisez « 🎹 Aide à la saisie » pour la syntaxe Maxima.",
          "<strong>Feedback</strong> si juste / si faux.",
          "<span class='opt'>Solution détaillée (facultatif)</span> — explication montrée après coup."
        ],
        tip: "Écrivez la réponse en syntaxe Maxima (ex : 2*x^2, sqrt(3)), pas en notation manuscrite."
      },
      numerical: {
        intro: "Réponse numérique unique, avec gestion de l'arrondi et de la tolérance.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Valeur cible</strong> — le nombre attendu.",
          "<strong>Arrondi auto / décimales</strong> — réglez si la réponse doit être arrondie.",
          "<strong>Type de tolérance</strong> + <strong>marge d'erreur</strong> — écart accepté.",
          "<strong>Feedback</strong> si correct / si erreur."
        ]
      },
      units: {
        intro: "Réponse = une valeur numérique ET une unité (Stackforge vérifie les deux).",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Valeur numérique</strong> attendue.",
          "<strong>Unité Maxima</strong> — ex : m/s, kg, N (syntaxe Maxima).",
          "<strong>Tolérance relative</strong> + <strong>chiffres significatifs</strong>.",
          "<strong>Feedback</strong> si correct / si erreur."
        ],
        tip: "L'unité se note en syntaxe Maxima : utilisez « 🎹 Aide à la saisie » en cas de doute."
      },
      string: {
        intro: "Réponse textuelle libre, comparée à une réponse attendue.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Réponse attendue</strong> — le texte correct.",
          "<strong>Taille de la case</strong> + <strong>tolérance</strong> (souplesse de comparaison).",
          "<strong>Feedback</strong> si juste / si faux.",
          "<span class='opt'>Solution / explication (facultatif)</span>."
        ]
      },
      match: {
        intro: "L'élève relie les éléments de deux colonnes.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Colonnes gauche / droite</strong> — ajoutez les éléments à relier.",
          "<strong>Associations</strong> — tracez les bonnes correspondances entre colonnes."
        ],
        tip: "Le bouton « 🤖 Prompt IA » génère un prompt prêt à coller pour créer les paires."
      },
      crossword: {
        intro: "Grille de mots croisés générée à partir d'une liste mots + définitions.",
        fields: [
          "<strong>Barème</strong> et <strong>nombre de mots</strong> à utiliser.",
          "<strong>Mots + définitions</strong> — ajoutez chaque ligne (« + Ajouter un mot »).",
          "<strong>Générer la grille</strong> — Stackforge calcule la disposition."
        ],
        tip: "« 🤖 Prompt IA » fabrique une liste mots/définitions sur un thème en un clic."
      },
      doi: {
        intro: "Diagramme objets-interactions : l'élève relie un objet central à son environnement.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Objet d'étude</strong> — la zone centrale du système.",
          "<span class='opt'>Zones bleues vides en trop (facultatif)</span> — pièges supplémentaires.",
          "<strong>Objets et interactions</strong> — listez chaque objet et son type (gravitationnel, contact, intrus…)."
        ]
      },
      chemical: {
        intro: "Équation chimique : l'élève complète ou identifie une réaction.",
        fields: [
          "<span class='opt'>Énoncé (facultatif)</span> — via « ✏️ Éditeur ».",
          "<strong>Saisie de l'équation</strong> — tapez-la puis « 🔄 Actualiser l'aperçu ».",
          "<strong>Type de réaction</strong>.",
          "<strong>Nom du groupe fonctionnel attendu</strong>.",
          "<strong>Feedback</strong> si correct / si erreur."
        ]
      },
      chemical_topo: {
        intro: "Chimie topologique : équation à partir de structures SMILES, notation détaillée.",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Équation (SMILES ou formule)</strong> — saisissez puis « 🔄 Actualiser ».",
          "<strong>Pondérations</strong> — répartissez les % entre la flèche (PRT1) et les nœuds.",
          "<strong>Somme des % = 100</strong> — le message vert confirme l'équilibre."
        ],
        tip: "Vérifiez l'indicateur de somme : tant qu'il est rouge, le barème n'est pas valide."
      },
      nuclear: {
        intro: "Réaction nucléaire : l'élève complète l'équation (conservation A et Z).",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Réaction nucléaire modèle</strong> — saisissez l'équation, puis « 🔄 Aperçu »."
        ]
      },
      composition: {
        intro: "Réponse rédigée libre dans un éditeur (composition / question ouverte).",
        fields: [
          "<strong>Énoncé</strong> — via « ✏️ Éditeur ».",
          "<strong>Taille de l'éditeur élève</strong> — hauteur de la zone de rédaction.",
          "<span class='opt'>Message affiché sous l'éditeur (facultatif)</span> — consigne pour l'élève."
        ]
      },
      basen: {
        intro: "Conversion de base N : l'élève convertit un nombre entre bases (2, 8, 10, 16).",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple courant.",
          "<strong>Nombre source</strong> + <strong>base source</strong> (ex : 1010 en base 2).",
          "<strong>Base cible</strong> — base vers laquelle convertir.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "L'aperçu calcule automatiquement la réponse correcte pour vérification."
      },
      circuit: {
        intro: "Lois des circuits électriques : Ohm, associations série/parallèle, puissance.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un scénario de circuit.",
          "<strong>Type de question</strong> — loi d'Ohm, résistance série/parallèle, intensité, puissance…",
          "<strong>Paramètres</strong> U, I, R, P selon le scénario.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      logique: {
        intro: "Logique booléenne : tables de vérité, simplification, équivalences.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple (ET, OU, NON, XOR, De Morgan…).",
          "<strong>Type de question</strong> — table de vérité, simplification, équivalence.",
          "<strong>Expression booléenne</strong> — notation avec AND/OR/NOT/XOR.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "L'aperçu affiche la table de vérité complète et la valeur attendue."
      },
      complexe: {
        intro: "Nombres complexes : forme algébrique, module, argument, conjugué.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple (forme alg., module, argument…).",
          "<strong>Type de question</strong> — forme algébrique, module, argument, conjugué, opérations.",
          "<strong>Parties réelle et imaginaire</strong> a + bi.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "La réponse est en syntaxe Maxima : %i pour i, %pi pour π."
      },
      calcul: {
        intro: "Calcul différentiel et intégral : dérivée, primitive, intégrale définie.",
        fields: [
          "<strong>Préréglage</strong> — choisissez une fonction type.",
          "<strong>Type de question</strong> — dérivée, primitive, intégrale, valeur numérique.",
          "<strong>Fonction f(x)</strong> en syntaxe Maxima.",
          "<strong>Bornes a, b</strong> pour l'intégrale définie.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Syntaxe Maxima : diff(x^3,x) = 3x², integrate(x^2,x,0,1) = 1/3."
      },
      statistiques: {
        intro: "Statistiques : moyenne, médiane, variance, quartiles, étendue.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un jeu de données type.",
          "<strong>Type de question</strong> — moyenne, médiane, variance, écart-type, Q1, Q3, étendue.",
          "<strong>Données</strong> — liste de valeurs séparées par des virgules.",
          "<span class='opt'>Effectifs</span> — pour la moyenne pondérée.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      matrices: {
        intro: "Algèbre linéaire : produit de matrices, déterminant, transposée, trace.",
        fields: [
          "<strong>Préréglage</strong> — choisissez une opération.",
          "<strong>Type de question</strong> — produit, déterminant, transposée, trace, inverse.",
          "<strong>Taille</strong> — matrice 2×2 ou 3×3.",
          "<strong>Coefficients</strong> — saisissez les entrées de la (des) matrice(s).",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "La réponse est en syntaxe Maxima : matrix([a,b],[c,d])."
      },
      geometrie: {
        intro: "Géométrie analytique : distance, milieu, vecteurs, droites, cercles.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple 2D ou 3D.",
          "<strong>Type de question</strong> — distance, milieu, norme, produit scalaire, colinéarité.",
          "<strong>Points / vecteurs</strong> — coordonnées A, B, C.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      suites: {
        intro: "Suites numériques : terme général, somme, limite d'une suite géométrique.",
        fields: [
          "<strong>Préréglage</strong> — choisissez une suite type.",
          "<strong>Type de question</strong> — terme, somme, limite, nature.",
          "<strong>Paramètres</strong> u₀, r (ou d), n selon le scénario.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      probabilites: {
        intro: "Probabilités : combinaisons, loi binomiale, espérance, probabilité conditionnelle.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple.",
          "<strong>Type de question</strong> — combinaison, P(X=k), E(X), Var(X), proba conditionnelle.",
          "<strong>Paramètres</strong> n, k, p selon la loi.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      trigonometrie: {
        intro: "Trigonométrie : valeurs exactes (sin/cos/tan), identités, équations.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un angle type (π/6, π/4, π/3…).",
          "<strong>Type de question</strong> — valeur exacte, identité, équation trigonométrique.",
          "<strong>Angle θ</strong> — fraction de π en syntaxe Maxima (ex : %pi/6).",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Les réponses sont en forme exacte (fractions de π) — pas de décimaux."
      },
      polynomes: {
        intro: "Trinôme du 2nd degré ax²+bx+c : discriminant, racines, formules de Viète.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un trinôme type.",
          "<strong>Type de question</strong> — discriminant Δ, racines, somme/produit des racines, nb de racines.",
          "<strong>Coefficients a, b, c</strong> du trinôme.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "L'aperçu calcule Δ et les racines en temps réel pour vérification."
      },
      limites: {
        intro: "Limites de fonctions : limite à l'infini, en un point, formes indéterminées.",
        fields: [
          "<strong>Préréglage</strong> — choisissez une fonction et un point type.",
          "<strong>Type de limite</strong> — x→+∞, x→−∞, x→a, x→a⁺.",
          "<strong>Expression f(x)</strong> en syntaxe Maxima.",
          "<strong>Réponse attendue</strong> — saisir la limite (inf, -inf, fraction, %pi…).",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "La réponse est saisie manuellement car certaines limites nécessitent un jugement humain."
      },
      physique: {
        intro: "Mécanique classique : MRUA, chute libre, énergie cinétique/potentielle, Newton.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un scénario physique.",
          "<strong>Type de question</strong> — v(t), x(t), hauteur, temps, Ec, Ep, conservation Em, F=ma.",
          "<strong>Paramètres</strong> v₀, a, t, m, h selon le scénario.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "L'élève saisit un nombre décimal ; la tolérance est de 1 % (NumRelative)."
      },
      inequation: {
        intro: "Inéquations : ensemble-solution en notation d'intervalle STACK (oo, cc, union…). AlgEquiv gère les intervalles.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un exemple.",
          "<strong>Type</strong> — linéaire (ax+b ▷ 0), trinôme (ax²+bx+c ▷ 0), valeur absolue.",
          "<strong>Opérateur</strong> — >, ≥, <, ≤.",
          "<strong>Coefficients a, b, c</strong> selon le type.",
          "<strong>Ensemble-solution</strong> — auto-calculé ; corriger si besoin : <code>oo(2,inf)</code>, <code>cc(-2,2)</code>, <code>union(...)</code>.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "STACK accepte oo/oc/co/cc pour les intervalles et union() pour les unions. Ajouter inf et -inf pour les demi-droites."
      },
      thermo: {
        intro: "Thermodynamique : loi des gaz parfaits PV=nRT, chaleur sensible Q=mcΔT, lois de Mariotte et de Charles. NumRelative 1%.",
        fields: [
          "<strong>Préréglage</strong> — choisissez un scénario.",
          "<strong>Type de question</strong> — P, V, T, n (gaz parfaits) ou Q (chaleur) ou loi de Mariotte/Charles.",
          "<strong>Paramètres gaz</strong> — P (Pa), V (m³), n (mol), T (K).",
          "<strong>Paramètres chaleur</strong> — m (kg), cp (J/kg/K), ΔT (K).",
          "<strong>L'aperçu</strong> calcule le résultat attendu.",
          "<strong>Consigne</strong> — via « ✏️ Éditeur ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "R = 8.314 J/(mol·K). Vérifiez les unités : P en Pa, V en m³, T en Kelvin."
      }
    }
  };
})();
