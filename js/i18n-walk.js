/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* ════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — i18n « marcheur » (traduction sûre par nœuds de texte)
   Ne touche QUE les nœuds de texte et les attributs title/placeholder
   dont le contenu figure dans le dictionnaire ci-dessous. Tout le reste
   (syntaxe Maxima/STACK, SMILES, LaTeX, unités, code…) est laissé tel quel.
   Repli FR automatique. Charger APRÈS i18n.js :
     <script src="js/i18n-walk.js"></script>
   ⚠️ Remplace i18n-ui.js (qui devient inutile : le marcheur couvre la coque).
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (!window.I18N) return;

  /* ── Dictionnaire FR → langue cible. Lot 1 : interface de construction.
        N'ajouter ICI que du texte d'INTERFACE (jamais de tokens techniques). */
  var MAP = { en: {
    // — Placeholders génériques des éditeurs riches (attribut data-ph) —
    "Cliquez sur Éditeur...":"Click Editor...",
    "Cliquez sur Éditeur…":"Click Editor…",
    "Cliquez sur ✏️ pour rédiger l'énoncé…":"Click ✏️ to write the question text…",
    "(défaut auto si vide)":"(auto default if empty)",
    "Laissez vide pour l'énoncé automatique...":"Leave empty for the automatic wording...",
    "Réponse incorrecte.":"Incorrect answer.",
    "Correct !":"Correct!",
    "(optionnel)":"(optional)",

    // — Coque (app subtitle/tagline/list.empty/btn.cancel → data-i18n dans HTML) —
    "📝 Nom de l'exercice":"📝 Exercise name",
    "🔒 Verrouillé":"🔒 Locked",
    "Questions ajoutées —":"Questions added —",
    "Barème total :":"Total mark:",
    "pt(s)":"pt(s)", "pt":"pt",
    "✏️ Mode édition — Q":"✏️ Editing mode — Q",
    "— Modifiez puis cliquez \"Mettre à jour\"":"— Edit, then click \"Update\"",
    // — Noms de types (grille + chips) —
    "Cases à cocher":"Checkboxes", "Bouton radio":"Radio button", "Menu déroulant":"Dropdown menu",
    "Algébrique":"Algebraic", "Arithmétique":"Numerical", "Unité":"Units", "String":"Text (String)",
    "Relier (Matching)":"Matching", "Mots Croisés":"Crossword", "DOI":"DOI",
    "Chimie (Éq.)":"Chemistry (eq.)", "Chimie (Topo.)":"Chemistry (topo.)",
    "Réaction nucléaire":"Nuclear reaction", "Composition":"Composition",
    // — En-têtes de panneaux —
    "☑️ Cases à cocher":"☑️ Checkboxes", "🔘 Bouton Radio":"🔘 Radio button",
    "📋 Menu Déroulant":"📋 Dropdown menu", "➗ Algébrique":"➗ Algebraic",
    "🔢 Arithmétique (Numérique)":"🔢 Numerical", "📐 Unité (STACK Units)":"📐 Units (STACK Units)",
    "🔤 Réponse Textuelle (String)":"🔤 Text answer (String)", "🔗 Question type \"Relier\"":"🔗 \"Matching\" question type",
    "Diagramme Objet-Interaction":"Object-Interaction diagram", "🧪 Équation Chimique":"🧪 Chemical equation",
    "Chimie Topologique (Smiles/Structure)":"Topological chemistry (SMILES/structure)",
    "☢️ Réactions Nucléaires (Générateur)":"☢️ Nuclear reactions (generator)", "✏️ Composition Libre":"✏️ Free composition",
    // — Barème / boutons communs —
    "📊 Barème :":"📊 Mark:", "🤖 Prompt IA":"🤖 AI Prompt", "📥 JSON":"📥 JSON", "📤 JSON":"📤 JSON",
    "✏️ Éditeur":"✏️ Editor", "✏️ Éditeur riche":"✏️ Rich editor",
    "+ Ajouter":"+ Add", "+ Ajouter un mot":"+ Add a word", "+ Ajouter un objet":"+ Add an object",
    "+ Bonne réponse":"+ Correct answer", "+ Distracteur":"+ Distractor",
    "+ Ajouter vrai":"+ Add true", "+ Ajouter faux":"+ Add false",
    "➕ Ajouter cette question":"➕ Add this question", "question(s))":"question(s))",
    "🏷️ Tags & Prévisualisation (":"🏷️ Tags & Preview (",
    // — Cases à cocher —
    "Énoncé":"Statement", "Nombre total de propositions":"Total number of propositions",
    "Nombre total de cases visibles":"Total number of visible boxes",
    "Nb bonnes réponses":"Number of correct answers",
    "Parmi le nombre de propositions combien sont vraies ?":"Of all the propositions, how many are true?",
    "Nombre fixe":"Fixed number", "Aléatoire":"Random",
    "✅ + VRAI":"✅ + TRUE", "❌ + FAUX":"❌ + FALSE",
    "Feedback par défaut (Correct / Incorrect)":"Default feedback (Correct / Incorrect)",
    "Si tout est coché correctement :":"If everything is ticked correctly:",
    "Si erreur détectée :":"If an error is detected:",
    // — Radio / dropdown —
    "1 bonne réponse aléatoire":"1 random correct answer", "du pool VRAI +":"from the TRUE pool +",
    "reste en distracteurs":"rest as distractors", ". Une seule réponse correcte.":". A single correct answer.",
    "Nb total de boutons affichés":"Total number of buttons shown",
    "min 2 · max = 1 vrai + nb faux en banque":"min 2 · max = 1 true + number of false in bank",
    "✅ Pool VRAIS":"✅ TRUE pool", "❌ Pool FAUX":"❌ FALSE pool",
    "⚠️ Pool insuffisant : il faut au moins":"⚠️ Pool too small: you need at least",
    "1 VRAI et (Xe−1) FAUX":"1 TRUE and (Xe−1) FALSE", "1 VRAI et (nb total−1) FAUX":"1 TRUE and (total−1) FALSE",
    "Nb de propositions affichées":"Number of options shown", "distracteurs":"distractors",
    "du pool FAUX. Une seule réponse correcte.":"from the FALSE pool. A single correct answer.",
    // — Algébrique —
    "⚙️ Config":"⚙️ Config", "📢 Aide élève":"📢 Student help", "💡 Solution":"💡 Solution",
    "Variables (ex:z, x, y)":"Variables (e.g. z, x, y)", "Réponse attendue":"Expected answer",
    "🎹 Aide à la saisie":"🎹 Input helper", "⚠️ Champ obligatoire":"⚠️ Required field",
    "Feedback si JUSTE":"Feedback if CORRECT", "Feedback si FAUX":"Feedback if WRONG",
    "Point pour décimales":"Dot for decimals", "Copier-coller variables":"Copy-paste variables",
    "Espaces variables":"Variable spaces", "Puissances de 10":"Powers of 10",
    "Parenthèses et priorités":"Parentheses and precedence", "Syndrome du xy":"The xy syndrome",
    "Rappeler les variables définies":"Recall defined variables",
    "🎹 Inclure le clavier virtuel de saisie dans la question (aide élève)":"🎹 Include the on-screen input keyboard in the question (student help)",
    "👁️ Aperçu :":"👁️ Preview:", "Cochez des options...":"Tick some options...",
    "Solution détaillée":"Detailed solution",
    // — Numérique —
    "Valeur cible":"Target value", "Arrondi auto ?":"Auto-rounding?", "Non":"No", "Oui":"Yes",
    "Type de tolérance":"Tolerance type", "Relative (NumRelative)":"Relative (NumRelative)",
    "Absolue (NumAbsolute)":"Absolute (NumAbsolute)", "Marge d'erreur":"Error margin",
    "Float autorisé ?":"Float allowed?", "Feedback si correct":"Feedback if correct",
    "Feedback si erreur":"Feedback if wrong",
    // — Unité —
    "Valeur numérique":"Numerical value", "Unité Maxima":"Maxima unit",
    "Tolérance relative (0.05=5%)":"Relative tolerance (0.05=5%)",
    "Chiffres significatifs min.":"Min. significant figures",
    "Liaison nombre × unité":"Number × unit binding", "Unités complexes":"Complex units",
    "Unités usuelles":"Common units", "Lier nombre et unité":"Link number and unit",
    // — String —
    "💬 Feedbacks & Solution":"💬 Feedback & Solution", "Taille de la case":"Box size", "Tolérance":"Tolerance",
    "Tolérant — StringSloppy (ignore majuscules/espaces)":"Lenient — StringSloppy (ignores case/spaces)",
    "Strict — String (exactitude absolue)":"Strict — String (exact match)",
    "Solution / Explication":"Solution / Explanation",
    // — Aide saisie élève (palettes) —
    "🎨 Activer l'aide à la saisie élève (palette de boutons dans la question)":"🎨 Enable student input help (button palette in the question)",
    "Sélectionnez les palettes à afficher à l'élève :":"Select the palettes to show to the student:",
    "🔢 Fractions & Racines":"🔢 Fractions & Roots", "➕ Opérateurs":"➕ Operators",
    "🔤 Lettres grecques":"🔤 Greek letters", "📐 Vecteurs & Géométrie":"📐 Vectors & Geometry",
    "𝑓 Fonctions":"𝑓 Functions", "⚗️ Physique-Chimie":"⚗️ Physics-Chemistry",
    "👁️ Aperçu barre d'outils élève :":"👁️ Student toolbar preview:",
    // — Matching —
    "Énoncé de la question":"Question statement", "Colonne Gauche (A)":"Left column (A)",
    "Colonne Droite (B)":"Right column (B)", "Créer les liaisons attendues":"Create the expected links",
    "Cliquez sur un élément à gauche, puis un élément à droite pour les lier.":"Click an item on the left, then an item on the right to link them.",
    "🚫 Annuler la sélection":"🚫 Clear selection", "🗑 Effacer tout":"🗑 Clear all",
    // — Crossword —
    "Mots à utiliser (laisser vide pour tous)":"Words to use (leave empty for all)",
    "Liste des mots et définitions":"List of words and definitions", "Mot":"Word", "Définition":"Definition",
    "Générer la grille":"Generate the grid", "Aperçu de la grille (généré)":"Grid preview (generated)",
    // — DOI —
    "Objet d'étude (Zone centrale)":"Object of study (central area)",
    "Zones bleues vides (en trop)":"Extra empty blue zones", "Objets et Interactions":"Objects and interactions",
    "👁️ Aperçu (Schéma fixe pour génération)":"👁️ Preview (fixed diagram for generation)",
    // — Chimie —
    "Énoncé (Optionnel)":"Statement (optional)", "Saisie de l'équation":"Equation input",
    "🔄 Actualiser l'aperçu":"🔄 Refresh preview", "🔄 Actualiser":"🔄 Refresh",
    "Type de réaction":"Reaction type", "Combustion":"Combustion", "Synthèse":"Synthesis",
    "Analyse":"Analysis", "Substitution":"Substitution", "Autre":"Other",
    "Nom du groupe fonctionnel attendu":"Expected functional group name",
    "Si la réponse est correcte :":"If the answer is correct:", "Si la réponse est incorrecte :":"If the answer is incorrect:",
    "Équation (Smiles ou Formule)":"Equation (SMILES or formula)", "🔬 Dessiner (JSME)":"🔬 Draw (JSME)",
    "Scoring PRT Avancé :":"Advanced PRT scoring:",
    "PRT1 — Flèche (%)":"PRT1 — Arrow (%)", "Noeud 0 — Atomes (%)":"Node 0 — Atoms (%)",
    "Noeud 1 — Charges (%)":"Node 1 — Charges (%)", "Noeud 2 — Formules (%)":"Node 2 — Formulas (%)",
    "Noeud 3 — Fallback (%)":"Node 3 — Fallback (%)", "Noeud 4 — Coefs exacts (%)":"Node 4 — Exact coeffs (%)",
    "Noeud 5 — Fallback (%)":"Node 5 — Fallback (%)", "Somme = 100%":"Sum = 100%",
    // — Nucléaire —
    "Réaction nucléaire modèle":"Model nuclear reaction", "🔄 Aperçu":"🔄 Preview", "🗑 Vider":"🗑 Clear",
    "Info :":"Info:",
    // — Composition —
    "📊 Sur combien de points :":"📊 Out of how many points:",
    "— note attribuée par le professeur":"— mark given by the teacher",
    "Question non corrigée automatiquement":"Question not graded automatically",
    "L'élève rédige librement sa réponse (texte, formules LaTeX, mise en forme).":"The student writes their answer freely (text, LaTeX formulas, formatting).",
    "📋 Énoncé de la question":"📋 Question statement",
    "Taille de l'éditeur élève":"Student editor size",
    "Petite — réponse courte (400px)":"Small — short answer (400px)",
    "Normale — paragraphe (600px)":"Normal — paragraph (600px)",
    "Grande — développement (800px)":"Large — long answer (800px)",
    "Très grande — rédaction longue (1000px)":"Very large — long essay (1000px)",
    "Message affiché à l'élève sous l'éditeur":"Message shown to the student below the editor",
    // — Modale Tags (sections 1-4 → data-i18n ; boutons Bloom/Difficulté sans data-i18n : on garde) —
    "Mémoriser":"Remember", "Comprendre":"Understand", "Analyser":"Analyse", "Évaluer":"Evaluate",
    "(unique)":"(single)", "Simple":"Easy", "Modéré":"Moderate", "Dur":"Hard",
    // — Modales Prompt IA —
    "🤖 Générateur de Prompt IA":"🤖 AI Prompt generator",
    "🤖 Générateur de Prompt IA — Relier (Match)":"🤖 AI Prompt generator — Matching",
    "🤖 Générateur de Prompt IA — Mots Croisés":"🤖 AI Prompt generator — Crossword",
    "📌 Informations obligatoires":"📌 Required information", "📌 Paramètres du Prompt":"📌 Prompt settings",
    "Question / Thème":"Question / Topic", "Propositions totales (XE)":"Total propositions (XE)",
    "Propositions vraies (XB)":"True propositions (XB)", "📚 Contexte pédagogique":"📚 Educational context",
    "Matière":"Subject", "Niveau":"Level", "Sous-matière":"Sub-subject", "Chapitre":"Chapter",
    "Langue des réponses":"Answer language", "Français":"French", "Anglais":"English",
    "Espagnol":"Spanish", "Allemand":"German", "Autre...":"Other...",
    "⚙️ Options avancées":"⚙️ Advanced options", "🎯 Niveau(x) de Bloom":"🎯 Bloom level(s)",
    "Plusieurs niveaux possibles (cliquez pour (dé)sélectionner)":"Several levels possible (click to (de)select)",
    "Connaissance":"Knowledge", "Compréhension":"Comprehension", "Application":"Application", "Évaluation":"Evaluation",
    "🔍 Catégories d'erreurs":"🔍 Error categories", "Calcul · Confusion · Inversion logique":"Calculation · Confusion · Logical inversion",
    "🪤 Proposition piège":"🪤 Trap proposition", "Fausse par nuance ou exception":"False by nuance or exception",
    "∑ Notation LaTeX":"∑ LaTeX notation", "Pour les formules mathématiques":"For mathematical formulas",
    "📐 Structure syntaxique":"📐 Syntactic structure", "Longueur et forme homogènes":"Consistent length and form",
    "👁️ Aperçu du prompt généré":"👁️ Generated prompt preview", "👁️ Prompt généré (À copier)":"👁️ Generated prompt (to copy)",
    "Remplissez les champs pour voir le prompt…":"Fill in the fields to see the prompt…",
    "📋 Copier le prompt":"📋 Copy the prompt",
    "Sujet / Thème de l'exercice":"Exercise topic / theme", "(optionnel)":"(optional)",
    "Langue":"Language", "Classe":"Class", "Nombre de mots à générer":"Number of words to generate",
    // — Modale Import JSON —
    "📁 Fichier":"📁 File", "📋 Coller":"📋 Paste",
    "Cliquez ou glissez un fichier":"Click or drag a file", "ici":"here",
    // — Modale Prévisualisation —
    "🔍 Prévisualisation & Édition — avant export XML":"🔍 Preview & Edit — before XML export",
    "← Fermer":"← Close",
    // — Pied de page / liens —
    "📖 Documentation":"📖 Documentation",
    "🔒 Aucune donnée collectée · Fonctionne 100% en local · Conforme RGPD":"🔒 No data collected · Runs 100% locally · GDPR compliant",
    // — Modale légale —
    "⚖️ Mentions légales & Droits d'utilisation":"⚖️ Legal notice & Usage rights",
    "Auteur :":"Author:",
    "📄 Licence d'utilisation":"📄 Usage licence",
    "Utilisation autorisée dans le cadre pédagogique et académique, à titre gratuit et non commercial.":"Authorised for educational and academic use, free of charge and non-commercial.",
    "Toute redistribution ou modification doit mentionner l'auteur original.":"Any redistribution or modification must credit the original author.",
    "🔒 RGPD & Données personnelles":"🔒 GDPR & Personal data",
    "Aucun cookie de tracking. Aucune police de caractère externe.":"No tracking cookies. No external fonts.",
    "Fermer":"Close",
    // — Modale contact —
    "✉️ Contact & Support":"✉️ Contact & Support", "🐛 Signaler un bug":"🐛 Report a bug",
    "💡 Suggestions & améliorations":"💡 Suggestions & improvements", "📧 Envoyer un e-mail":"📧 Send an e-mail",
    // — Éditeur riche / formule (titres) —
    "✏️ Éditeur de contenu":"✏️ Content editor", "🎹 Aide à la saisie Maxima":"🎹 Maxima input helper",
    "🧮 Formule Maxima":"🧮 Maxima formula", "∑ Éditeur de formule LaTeX":"∑ LaTeX formula editor",
    "📋 Insérer dans le champ":"📋 Insert into the field", "✅ Confirmer":"✅ Confirm",
    "Annuler":"Cancel", "✅ Insérer":"✅ Insert", "🔗 Insérer":"🔗 Insert",
    "Lignes :":"Rows:", "Colonnes :":"Columns:", "En-tête":"Header", "Insérer":"Insert",
    "Texte à afficher":"Text to display",
    "URL (lien externe)":"URL (external link)", "Supprimer":"Delete",
    "Inclure le clavier dans la question (aide à l'élève)":"Include the keyboard in the question (student help)",
    // — Lot 2 : catégories palette —
    "Choix multiples":"Multiple choice",
    "Numérique / Algèbre":"Numeric / Algebra",
    "Physique-Chimie":"Physics-Chemistry",
    "Informatique":"Computer Science",
    "Organisation":"Organisation",
    "Interactif / Visuel":"Interactive / Visual",
    // — Lot 2 : types palette (labels longs de PALETTE_TYPES) —
    "Vrai / Faux":"True / False",
    "Glisser-Déposer":"Drag & Drop",
    "Classement":"Ranking",
    "Sélection image":"Image selection",
    "Lecture graphique":"Graph reading",
    "RVB / CMJN":"RGB / CMYK",
    "Optique géométrique":"Geometric optics",
    "pH-métrie / Titrage":"pH-metry / Titration",
    "Dosage redox (potentiométrie)":"Redox titration (potentiometry)",
    "Conversion de base (Base N)":"Base conversion (Base N)",
    "Circuits électriques (Ohm, série, parallèle)":"Electrical circuits (Ohm, series, parallel)",
    "Logique booléenne (tables de vérité, simplification)":"Boolean logic (truth tables, simplification)",
    "Nombres complexes (formes, module, argument)":"Complex numbers (forms, modulus, argument)",
    "Calcul différentiel (dérivée, primitive, intégrale)":"Differential calculus (derivative, antiderivative, integral)",
    "Statistiques (moyenne, variance, médiane, quartiles)":"Statistics (mean, variance, median, quartiles)",
    "Matrices (produit, déterminant, système linéaire)":"Matrices (product, determinant, linear system)",
    "Géométrie (distance, vecteurs, droites, cercles)":"Geometry (distance, vectors, lines, circles)",
    "Suites (arithmétique, géométrique, somme, limite)":"Sequences (arithmetic, geometric, sum, limit)",
    "Probabilités (combinaisons, loi binomiale, espérance)":"Probabilities (combinations, binomial law, expectation)",
    "Trigonométrie (valeurs exactes, identités, équations)":"Trigonometry (exact values, identities, equations)",
    "Polynômes (discriminant, racines, forme canonique/factorisée)":"Polynomials (discriminant, roots, canonical/factored form)",
    "Limites de fonctions (infini, point, formes indéterminées)":"Function limits (infinity, point, indeterminate forms)",
    "Physique (cinématique, énergie mécanique, lois de Newton)":"Physics (kinematics, mechanical energy, Newton's laws)",
    "Oscilloscope (signal sinusoïdal, retard, RC)":"Oscilloscope (sinusoidal signal, delay, RC)",
    "Inéquations (ensemble-solution, intervalles, AlgEquiv)":"Inequalities (solution set, intervals, AlgEquiv)",
    // — Lot 2 : en-têtes de panels (spans hardcodés sans data-i18n) —
    "Générer XML":"Generate XML",
    "Types de questions":"Question types",
    "📥 Importer STACK existant":"📥 Import existing STACK",
    "Calcul différentiel (dérivée / primitive / intégrale)":"Differential calculus (derivative / antiderivative / integral)",
    "Circuits électriques (Ohm, série, parallèle)":"Electrical circuits (Ohm, series, parallel)",
    "Dosage Redox — Potentiométrie":"Redox — Potentiometry",
    "Géométrie analytique":"Analytical geometry",
    "Inéquations — Ensemble-solution":"Inequalities — Solution set",
    "Limites de fonctions":"Function limits",
    "Logique booléenne":"Boolean logic",
    "Nombres complexes":"Complex numbers",
    "pH-métrie — Titrage":"pH-metry — Titration",
    "Physique — Mécanique":"Physics — Mechanics",
    "Oscilloscope (JSXGraph)":"Oscilloscope (JSXGraph)",
    "Polynômes du 2nd degré":"2nd degree polynomials",
    "Probabilités":"Probabilities",
    "Statistiques":"Statistics",
    "Suites numériques":"Numerical sequences",
    "Trigonométrie":"Trigonometry",
    // — Lot 2 : jxgdrop zone editor —
    "Zones de dépôt :":"Drop zones:",
    "⭕ Cercle":"⭕ Circle",
    "☛ Sélectionner":"☛ Select",
    "Rayon":"Radius",
    "Largeur":"Width",
    "Hauteur":"Height",
    // — Lot 2 : optique panel —
    "Scénario":"Scenario",
    "Paramètres":"Parameters",
    "Paramètres de la lentille":"Lens parameters",
    "Paramètres de la lunette":"Telescope parameters",
    "Paramètres du miroir plan":"Flat mirror parameters",
    "Paramètres du miroir sphérique":"Spherical mirror parameters",
    "Paramètres du télescope (miroir concave)":"Telescope parameters (concave mirror)",
    "Paramètres du dosage":"Titration parameters",
    "Lentilles convergentes":"Converging lenses",
    "Miroirs":"Mirrors",
    "Lentille — Trouver l'image (glisser B')":"Lens — Find the image (drag B')",
    "Lentille — Tracer les 3 rayons remarquables":"Lens — Draw the 3 key rays",
    "Lunette astronomique afocale (2 lentilles)":"Afocal refracting telescope (2 lenses)",
    "Miroir plan — Image symétrique":"Flat mirror — Symmetric image",
    "Miroir sphérique — Trouver l'image":"Spherical mirror — Find the image",
    "Télescope — Miroir concave + oculaire":"Telescope — Concave mirror + eyepiece",
    "Distance focale f ' (cm)":"Focal length f ' (cm)",
    "Hauteur objet AB (cm, > 0)":"Object height AB (cm, > 0)",
    "Tolérance de tracé par rayon (cm)":"Ray drawing tolerance (cm)",
    "Focale objectif f'₁ (cm)":"Objective focal length f'₁ (cm)",
    "Focale oculaire f'₂ (cm)":"Eyepiece focal length f'₂ (cm)",
    "Angle d'incidence θ (degrés)":"Angle of incidence θ (degrees)",
    "Hauteur faisceau h (cm)":"Beam height h (cm)",
    "Hauteur AB (cm)":"Height AB (cm)",
    "Type de miroir":"Mirror type",
    "Focale miroir primaire f'₁ (cm)":"Primary mirror focal length f'₁ (cm)",
    "Dimensions du schéma":"Diagram dimensions",
    "Dimensions du graphe":"Graph dimensions",
    "Concave (convergent)":"Concave (converging)",
    "Convexe (divergent)":"Convex (diverging)",
    // — Lot 2 : acide-base / redox panel —
    "Type de titration":"Titration type",
    "Nombre de protons":"Number of protons",
    "Acide faible + base forte (HA + NaOH)":"Weak acid + strong base (HA + NaOH)",
    "Base faible + acide fort (B + HCl)":"Weak base + strong acid (B + HCl)",
    "Acide fort + base forte (HCl + NaOH)":"Strong acid + strong base (HCl + NaOH)",
    "1 — Monoacide (HA)":"1 — Monoprotic acid (HA)",
    "2 — Diacide (H₂A)":"2 — Diprotic acid (H₂A)",
    "3 — Triacide (H₃A)":"3 — Triprotic acid (H₃A)",
    "Conc. espèce titrée C₂ (mol/L)":"Concentration of titrated species C₂ (mol/L)",
    "Tolérance E° (V)":"Tolerance E° (V)",
    "Tolérance Veq (mL)":"Tolerance Veq (mL)",
    "Tolérance pKa":"Tolerance pKa",
    "Tolérance sur la réponse (%)":"Tolerance on answer (%)",
    "Tolérance (cm)":"Tolerance (cm)",
    // — Lot 2 : couleurs rvbcmj —
    "— Sélectionner —":"— Select —",
    "— Choisir un exemple —":"— Choose an example —",
    "— Choisir un système —":"— Choose a system —",
    "● Rouge":"● Red",
    "● Vert":"● Green",
    "● Bleu":"● Blue",
    "● Jaune":"● Yellow",
    "● Cyan":"● Cyan",
    "● Magenta":"● Magenta",
    "○ Blanc":"○ White",
    "● Noir":"● Black",
    // — Lot 2 : labels de champs communs aux panels spécialisés —
    "Préréglage":"Preset",
    "Préréglage rapide":"Quick preset",
    "Type de calcul":"Calculation type",
    "Type de circuit":"Circuit type",
    "Type de conversion":"Conversion type",
    "Type de limite":"Limit type",
    "Type de question":"Question type",
    "Type de statistique":"Statistic type",
    "Type d'inéquation":"Inequality type",
    "Grandeur à calculer":"Quantity to calculate",
    "Nombre de variables":"Number of variables",
    "Nombre de racines réelles (0, 1 ou 2)":"Number of real roots (0, 1 or 2)",
    "Nombre de termes (somme)":"Number of terms (sum)",
    "Nom (pour référence)":"Name (for reference)",
    "Opérateur":"Operator",
    "Opération":"Operation",
    "Données (séparées par des virgules)":"Data (comma-separated)",
    "Réponse attendue (Maxima) — obligatoire":"Expected answer (Maxima) — required",
    "Résistance R (Ω)":"Resistance R (Ω)",
    "Résistance R₁ (Ω)":"Resistance R₁ (Ω)",
    "Résistance R₂ (Ω)":"Resistance R₂ (Ω)",
    "Résistance R₃ (Ω, 0 = absente)":"Resistance R₃ (Ω, 0 = absent)",
    "Résistances en parallèle":"Parallel resistances",
    "Résistances en série":"Series resistances",
    "Tension du générateur E (V)":"Generator voltage E (V)",
    "Probabilité p (succès)":"Probability p (success)",
    "Raison q (géom.)":"Ratio q (geom.)",
    "Taille de A":"Size of A",
    "Valeur à convertir (décimal)":"Value to convert (decimal)",
    "Arrondi (décimales)":"Rounding (decimals)",
    "Borne inférieure a":"Lower bound a",
    "Borne supérieure b":"Upper bound b",
    "Numéro de la ligne à compléter (0 = première ligne)":"Row number to complete (0 = first row)",
    "Deuxième expression (pour équivalence)":"Second expression (for equivalence)",
    "Forme simplifiée attendue (réponse modèle STACK)":"Expected simplified form (STACK model answer)",
    "Partie réelle a (de z₁)":"Real part a (of z₁)",
    "Partie imaginaire b (de z₁)":"Imaginary part b (of z₁)",
    "Partie réelle c (de z₂)":"Real part c (of z₂)",
    "Partie imaginaire d (de z₂)":"Imaginary part d (of z₂)",
    "Ensemble-solution (notation STACK — auto-rempli ou à corriger)":"Solution set (STACK notation — auto-filled or to correct)",
    // — Lot 2 : mathématiques spécialisées —
    "Pente d'une droite":"Slope of a line",
    "Ordonnée à l'origine":"Y-intercept",
    "Distance AB dans le plan (2D)":"Distance AB in the plane (2D)",
    "Distance AB dans l'espace (3D)":"Distance AB in space (3D)",
    "Milieu du segment AB (2D)":"Midpoint of segment AB (2D)",
    "Norme du vecteur AB":"Norm of vector AB",
    "Aire du triangle ABC":"Area of triangle ABC",
    "Déterminant 2×2":"Determinant 2×2",
    "Déterminant 3×3":"Determinant 3×3",
    "Déterminant det(A)":"Determinant det(A)",
    "Transposée Aᵀ":"Transpose Aᵀ",
    "Système linéaire Ax = b (2 inconnues)":"Linear system Ax = b (2 unknowns)",
    "Système préconfiguré":"Preconfigured system",
    "Résoudre pour x":"Solve for x",
    "Résoudre pour y":"Solve for y",
    "Somme des racines x₁+x₂":"Sum of roots x₁+x₂",
    "Produit des racines x₁×x₂":"Product of roots x₁×x₂",
    "Nombre de racines réelles":"Number of real roots",
    "Trouver les racines réelles (si Δ≥0)":"Find real roots (if Δ≥0)",
    "Calculer le discriminant Δ":"Calculate discriminant Δ",
    "Calculer la moyenne x̄":"Calculate mean x̄",
    "Calculer la médiane Me":"Calculate median Me",
    "Calculer la variance V":"Calculate variance V",
    "Calculer l'écart-type σ":"Calculate standard deviation σ",
    "Calculer le quartile Q₁":"Calculate quartile Q₁",
    "Calculer le quartile Q₃":"Calculate quartile Q₃",
    "Calculer l'étendue":"Calculate the range",
    "Calculer la moyenne pondérée":"Calculate weighted mean",
    "Moyenne pondérée (valeurs/effectifs)":"Weighted mean (values/frequencies)",
    "Compléter une table de vérité (0 ou 1)":"Complete a truth table (0 or 1)",
    "Simplifier une expression logique":"Simplify a logical expression",
    "Simplifier une expression trigonométrique":"Simplify a trigonometric expression",
    "Prouver une équivalence logique":"Prove a logical equivalence",
    "Nom (pour référence)":"Name (for reference)",
    // — Lot 2 : interface circuits —
    "Série — résistance équivalente R_eq":"Series — equivalent resistance R_eq",
    "Série — courant I":"Series — current I",
    "Série — tension U₁ aux bornes de R₁":"Series — voltage U₁ across R₁",
    "Parallèle — résistance équivalente R_eq":"Parallel — equivalent resistance R_eq",
    "Parallèle — courant total I":"Parallel — total current I",
    "Parallèle — courant de branche I₁":"Parallel — branch current I₁",
    // — Lot 2 : interface suites / probabilités —
    "Terme u_n d'une suite arithmétique":"Term u_n of an arithmetic sequence",
    "Terme u_n d'une suite géométrique":"Term u_n of a geometric sequence",
    "Somme S_n des n premiers termes (arith.)":"Sum S_n of the first n terms (arith.)",
    "Somme S_n des n premiers termes (géom.)":"Sum S_n of the first n terms (geom.)",
    "Limite d'une suite géométrique (|q|<1)":"Limit of a geometric sequence (|q|<1)",
    // — Lot 2 : base-N conversion —
    "Binaire → Décimal (1010 → 10)":"Binary → Decimal (1010 → 10)",
    "Décimal → Binaire (42 → 101010)":"Decimal → Binary (42 → 101010)",
    "Hexadécimal → Décimal (FF → 255)":"Hexadecimal → Decimal (FF → 255)",
    "Décimal → Hexadécimal (255 → FF)":"Decimal → Hexadecimal (255 → FF)",
    "Décimal → Octal (64 → 100)":"Decimal → Octal (64 → 100)",
    "Décimal → Base 3 (42 → 1120)":"Decimal → Base 3 (42 → 1120)",
    "Base n → Décimal (l'élève donne la valeur décimale)":"Base n → Decimal (student gives decimal value)",
    "Décimal → Base n (l'élève donne la représentation)":"Decimal → Base n (student gives the representation)",
    "Décimal → Base 16 personnalisée":"Decimal → Custom base 16",
    "10 — Décimal":"10 — Decimal",
    "12 — Duodécimal":"12 — Duodecimal",
    "16 — Hexadécimal":"16 — Hexadecimal",
    // — Lot 2 : physique —
    "Énergie cinétique Ec = ½mv²":"Kinetic energy Ec = ½mv²",
    "Énergie potentielle Ep = mgh (g = 9.81)":"Potential energy Ep = mgh (g = 9.81)",
    "Conservation énergie mécanique : v à partir de h":"Conservation of mechanical energy: v from h",
    "Deuxième loi de Newton : F = ma":"Newton's second law: F = ma",
    "Chute libre : temps de chute t = √(2h/g)":"Free fall: fall time t = √(2h/g)",
    "Chute libre : hauteur de chute h = ½gt²":"Free fall: height h = ½gt²",
    // — Lot 2 : complexes —
    "Forme algébrique z₁ ○ z₂ = a + bi":"Algebraic form z₁ ○ z₂ = a + bi",
    "Module de 3+4i → |z|":"Modulus of 3+4i → |z|",
    "Argument de 1+i → arg(z)":"Argument of 1+i → arg(z)",
    "Conjugué de 2-5i → z̄":"Conjugate of 2-5i → z̄",
    "Partie réelle a (de z₁)":"Real part a (of z₁)",
    "Partie imaginaire b (de z₁)":"Imaginary part b (of z₁)",
    // — Lot 2 : calcul différentiel —
    "Calculer une intégrale définie ∫ₐᵇ f(x) dx":"Calculate a definite integral ∫ₐᵇ f(x) dx",
    "Trouver une primitive F(x) — STACK answertest : Antidiff":"Find antiderivative F(x) — STACK answertest: Antidiff",
    "Calculer la dérivée f'(x) — STACK answertest : Diff":"Calculate derivative f'(x) — STACK answertest: Diff",
    // — Lot 2 : boutons et messages communs —
    "En attente de saisie…":"Waiting for input…",
    "Texte de la question (aperçu)":"Question text (preview)",
    "Nouveau":"New",
    "Nouveau (effacer tout)":"New (clear all)",
    "Effacer tout le contenu ?":"Clear all content?",
    "Supprimer Q":"Delete Q",
    "📥 Télécharger XML modifié":"📥 Download modified XML",
    "📥 Importer JSON — Cases à cocher":"📥 Import JSON — Checkboxes",
    "L'élève doit identifier":"The student must identify",
    "Compréhension":"Comprehension",
    "Centrée $$...$$":"Centred $$...$$",
    "En ligne $...$":"Inline $...$",
    "Barème :":"Mark:",
    "＋ Algébrique":"＋ Algebraic",
    "＋ Numérique":"＋ Numerical",
    "＋ Booléen":"＋ Boolean",
    "＋ Unités":"＋ Units",
    "＋ Nœud":"＋ Node",
    // — Lot 3 : labels de champs mathématiques spécialisés —
    "Milieu d'un segment":"Midpoint of a segment",
    "Norme d'un vecteur":"Norm of a vector",
    "Aire du triangle (3 points)":"Area of triangle (3 points)",
    "Argument arg(z₁) en radians":"Argument arg(z₁) in radians",
    "Expression du terme général u_n (arith.)":"Expression for the general term u_n (arith.)",
    "Expression terme général arith. un=f(n)":"General term arith. expression un=f(n)",
    "Expression à simplifier (syntaxe Maxima)":"Expression to simplify (Maxima syntax)",
    "Linéaire : ax + b ▷ 0":"Linear: ax + b ▷ 0",
    "Trinôme : ax² + bx + c ▷ 0":"Trinomial: ax² + bx + c ▷ 0",
    "Conjugué z̄₁":"Conjugate z̄₁",
    "Espérance E(X) = np":"Expected value E(X) = np",
    "L'interprétation mathématique s'affichera ici.":"The mathematical interpretation will appear here.",
    // — Lot 3 : chimie / redox —
    "Couple titré Ox₂/Red₂ (réducteur initial)":"Titrated couple Ox₂/Red₂ (initial reductant)",
    "E°₁ du titrant (plateau après Veq) — curseur horizontal":"E°₁ of titrant (plateau after Veq) — horizontal cursor",
    "E°₂ de l'espèce titrée (plateau avant Veq) — curseur horizontal":"E°₂ of titrated species (plateau before Veq) — horizontal cursor",
    "1ʳᵉ équivalence Veq1 — curseur vertical":"1st equivalence Veq1 — vertical cursor",
    "2ᵉ équivalence Veq2 — curseur vertical":"2nd equivalence Veq2 — vertical cursor",
    "3ᵉ équivalence Veq3 — curseur vertical":"3rd equivalence Veq3 — vertical cursor",
    "Volume équivalent Veq — curseur vertical":"Equivalence volume Veq — vertical cursor",
    "pKa1 à la demi-équivalence — curseur horizontal":"pKa1 at half-equivalence — horizontal cursor",
    // — Lot 3 : interface générales —
    "Glisser fond = sélection zone · Glisser nœud(s) = déplacer · Clic = éditer":"Drag background = zone selection · Drag node(s) = move · Click = edit",
    "Pente d'une droite":"Slope of a line",
    "Ordonnée à l'origine":"Y-intercept",
    "Équation de droite (pente)":"Line equation (slope)",
    "Équation de droite (ordonnée)":"Line equation (y-intercept)",
    // — Lot 4 : exemples calcul différentiel —
    "Dérivée de x² + sin(x)":"Derivative of x² + sin(x)",
    "Dérivée de 3x³ - 2x + 1":"Derivative of 3x³ - 2x + 1",
    "Dérivée de exp(x)·cos(x)":"Derivative of exp(x)·cos(x)",
    "Dérivée de ln(x)/x":"Derivative of ln(x)/x",
    "Primitive de 2x + cos(x)":"Antiderivative of 2x + cos(x)",
    "Primitive de exp(2x)":"Antiderivative of exp(2x)",
    "Primitive de 1/x":"Antiderivative of 1/x",
    "Espérance E(X) loi binomiale n=8, p=0.25":"Expected value E(X) binomial n=8, p=0.25",
    "Probabilité P(A∪B) = P(A)+P(B)-P(A∩B)":"Probability P(A∪B) = P(A)+P(B)-P(A∩B)",
    "Probabilité conditionnelle P(A|B)":"Conditional probability P(A|B)",
    // — Lot 4 : labels de champs spécialisés —
    "Trace d'une matrice 2×2":"Trace of a 2×2 matrix",
    "Transposée d'une matrice 2×2":"Transpose of a 2×2 matrix",
    "c (trinôme ou valeur abs)":"c (trinomial or absolute value)",
    "d — h ou F (m ou N)":"d — h or F (m or N)",
    "Énergie potentielle de pesanteur Ep = mgh":"Gravitational potential energy Ep = mgh",
    "🎯 Définissez une image de fond, placez des zones de dépôt et listez les propositions. Cairn for Stack génère automatiquement le code JSXGraph responsive et le PRT STACK.":"🎯 Define a background image, place drop zones and list the proposals. Cairn for Stack automatically generates the responsive JSXGraph code and STACK PRT.",
    // — Lot 5 : labels optiques et physique —
    "Tolérance Δ(OA') (cm)":"Tolerance Δ(OA') (cm)",
    "Tolérance Δ(A'B') (cm)":"Tolerance Δ(A'B') (cm)",
    "Tolérance Δ(position) (cm)":"Tolerance Δ(position) (cm)",
    "Tolérance Δ(hauteur) (cm)":"Tolerance Δ(height) (cm)",
    "Tolérance Δ(x B₁) (cm)":"Tolerance Δ(x B₁) (cm)",
    "Tolérance Δ(y B₁) (cm)":"Tolerance Δ(y B₁) (cm)",
    "n₁ (électrons échangés)":"n₁ (electrons exchanged)",
    "n₂ (électrons échangés)":"n₂ (electrons exchanged)",
    "2ème loi Newton : F = ma":"Newton's 2nd law: F = ma",
    "Conservation Em : v final à partir de h":"Conservation of mechanical energy: final v from h",
    "Trouver x₁ (la plus petite racine)":"Find x₁ (the smallest root)",
    "Trouver x₂ (la plus grande racine)":"Find x₂ (the largest root)",
    "Énergie interne ΔU = Q − W (gaz monoatomique)":"Internal energy ΔU = Q − W (monatomic gas)"
  }};

  /* ── Index inverse (cible → FR) pour restaurer le français ── */
  var INV = {};
  function buildInverse(){
    INV = {};
    for (var l in MAP){ INV[l] = {}; for (var k in MAP[l]) INV[l][MAP[l][k]] = k; }
  }
  buildInverse();

  function register(obj){
    for (var l in obj){ MAP[l]=MAP[l]||{}; for (var k in obj[l]) MAP[l][k]=obj[l][k]; }
    buildInverse();
  }

  var current = "fr";        // langue actuellement appliquée au DOM
  var busy = false;          // pour ignorer nos propres mutations

  function replaceWith(node, dic){
    if (node.nodeType === 3){
      var raw = node.nodeValue;
      var key = raw.replace(/\s+/g, " ").trim();
      if (key && dic[key] !== undefined){
        var lead = (raw.match(/^\s*/) || [""])[0];
        var trail = (raw.match(/\s*$/) || [""])[0];
        node.nodeValue = lead + dic[key] + trail;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return;
    if (node.hasAttribute("placeholder")){
      var p = (node.getAttribute("placeholder")||"").trim();
      if (dic[p] !== undefined) node.setAttribute("placeholder", dic[p]);
    }
    if (node.hasAttribute("title")){
      var ti = (node.getAttribute("title")||"").trim();
      if (dic[ti] !== undefined) node.setAttribute("title", dic[ti]);
    }
    if (node.hasAttribute("data-ph")){            // placeholders des éditeurs riches
      var dp = (node.getAttribute("data-ph")||"").trim();
      if (dic[dp] !== undefined) node.setAttribute("data-ph", dic[dp]);
    }
    if (tag === "INPUT"){                          // valeurs par défaut des champs texte
      var itype = (node.getAttribute("type") || "text").toLowerCase();
      if ((itype === "text" || itype === "search" || itype === "") && node !== document.activeElement){
        var cur = ((node.value != null ? node.value : node.getAttribute("value")) || "").trim();
        if (cur && dic[cur] !== undefined){
          node.value = dic[cur];
          if (node.hasAttribute("value")) node.setAttribute("value", dic[cur]);
        }
      }
    }
    for (var c = node.firstChild; c; c = c.nextSibling) replaceWith(c, dic);
  }

  function applyLang(target){
    if (target === current) { reapply(); return; }
    busy = true;
    if (current !== "fr" && INV[current]) replaceWith(document.body, INV[current]); // → FR
    current = "fr";
    if (target !== "fr" && MAP[target]) { replaceWith(document.body, MAP[target]); current = target; }
    busy = false;
  }
  function reapply(){
    if (current === "fr" || !MAP[current]) return;  // FR : DOM déjà en FR
    busy = true;
    replaceWith(document.body, MAP[current]);        // FR → cible (capte le contenu re-rendu)
    busy = false;
  }

  /* ── Traduction des messages toast() (correspondance exacte uniquement) ── */
  function wrapToast(){
    if (typeof window.toast !== "function" || window.toast.__hsT) return;
    var orig = window.toast;
    window.toast = function (msg){
      try{
        if (current !== "fr" && MAP[current] && typeof msg === "string"){
          var k = msg.replace(/\s+/g," ").trim();
          if (MAP[current][k] !== undefined) msg = MAP[current][k];
        }
      }catch(e){}
      return orig.apply(this, arguments);
    };
    window.toast.__hsT = true;
  }

  function init(){
    // langue initiale
    var L = I18N.getLang();
    if (L !== "fr") applyLang(L);
    wrapToast();

    // re-traduire le contenu inséré dynamiquement (modales, chips, aperçus…)
    var pending = null;
    var obs = new MutationObserver(function(){
      if (busy) return;
      clearTimeout(pending);
      pending = setTimeout(reapply, 120);
    });
    obs.observe(document.body, { childList:true, subtree:true });

    // changement de langue depuis le sélecteur
    document.addEventListener("i18n:changed", function (e){
      applyLang((e.detail && e.detail.lang) || I18N.getLang());
    });
  }

  // exposé pour ajouter des lots plus tard : I18N_WALK.register({en:{…}})
  window.I18N_WALK = { register: register, reapply: reapply };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
