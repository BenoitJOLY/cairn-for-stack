/* ════════════════════════════════════════════════════════════════
   HÉSTACK — i18n LOT 2 : chaînes fixes des modules JS
   (toasts, écran de vérification/export, titres d'aide, messages
    de validation, import). S'ajoute au marcheur.
   Charger APRÈS i18n-walk.js :
     <script src="js/i18n-content.js"></script>
   N.B. Le texte du PROMPT envoyé à l'IA et les feedbacks injectés dans
   le XML ne sont PAS traduits ici : ils suivent la « langue des réponses ».
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (!window.I18N_WALK) return;

  I18N_WALK.register({ en: {

    // ── Placeholders des éditeurs riches (attribut data-ph) ──
    "Cliquez sur Éditeur...":"Click Editor...",
    "Exemple : Quelle est la valeur de g sur Terre ?":"Example: What is the value of g on Earth?",
    "Exemple : Quelle est l'unité de Force ?":"Example: What is the unit of Force?",
    "Consigne pour l'élève...":"Instructions for the student...",

    // ── Placeholders de champs ──
    "Tous":"All",
    "ex: Alcane, Alcool, Acide...":"e.g. Alkane, Alcohol, Acid...",
    "Description...":"Description...",
    "Ex: Voir le document...":"E.g. See the document...",
    "Ex : Les lois de Newton et leurs applications":"E.g. Newton's laws and their applications",
    "ou saisir librement…":"or type freely…",
    "Précisez la langue...":"Specify the language...",
    "Ex: Les figures de style, Les types de roches...":"E.g. Figures of speech, Types of rocks...",
    "Saisir la langue...":"Enter the language...",
    "Ex: La Seconde Guerre mondiale, Les roches magmatiques...":"E.g. World War II, Igneous rocks...",
    "Tapez ou utilisez les boutons… ex: sqrt(x^2+1)":"Type or use the buttons… e.g. sqrt(x^2+1)",

    // ── Options de menus ──
    "Espagnol (Español)":"Spanish (Español)",
    "Gravitationnel (Distance)":"Gravitational (distance)",
    "Magnétique (Distance)":"Magnetic (distance)",
    "Contact":"Contact",
    "Intrus (Hors système)":"Intruder (outside system)",

    // ── Infobulles (title) ──
    "Générateur de prompt IA":"AI prompt generator",
    "Générateur de prompt IA pour Match":"AI prompt generator for Matching",
    "Générer un prompt pour IA":"Generate a prompt for AI",
    "Isotope Générique":"Generic isotope",
    "Flèche":"Arrow", "Électron":"Electron", "État excité":"Excited state",
    "Insérer un lien ou fichier embarqué":"Insert a link or embedded file",
    "Son (mp3/ogg/wav — embarqué Base64)":"Sound (mp3/ogg/wav — embedded Base64)",

    // ── Fragments restants ──
    "tirées du pool VRAI + complétion tirée du pool FAUX. Note partielle automatique.":"drawn from the TRUE pool + completion drawn from the FALSE pool. Automatic partial grading.",
    "Utilisez l'éditeur ci-dessus. Le système générera automatiquement":"Use the editor above. The system will automatically generate",
    "(Réactifs) et":"(Reactants) and",
    "(Produits) via votre script":"(Products) via your script",
    "❓ Aide":"❓ Help",

    // ── Valeurs par défaut des champs texte (exemples & feedbacks pré-remplis).
    //    NB : en anglais, ces défauts partent ainsi dans le XML si non modifiés. ──
    "Proposition correcte A":"Correct proposition A",
    "Proposition incorrecte B":"Incorrect proposition B",
    "Bonne réponse":"Correct answer", "Mauvaise réponse":"Wrong answer",
    "Exact !":"Correct!", "Non.":"No.", "Excellent !":"Excellent!",
    "Faux.":"Wrong.", "Incorrect.":"Incorrect.",
    "Certaines réponses sont incorrectes.":"Some answers are incorrect.",
    "Bravo, l'équation est équilibrée !":"Well done, the equation is balanced!",
    "L'équation n'est pas correcte ou mal équilibrée.":"The equation is incorrect or not balanced.",
    "Votre réponse sera lue et corrigée par votre professeur.":"Your answer will be read and graded by your teacher."
  }});
})();
