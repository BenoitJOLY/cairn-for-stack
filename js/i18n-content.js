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
   CAIRN FOR STACK — i18n LOT 2 : chaînes fixes des modules JS
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
  }, de: {

    // ── Placeholders des éditeurs riches (attribut data-ph) ──
    "Cliquez sur Éditeur...":"Auf Editor klicken...",
    "Exemple : Quelle est la valeur de g sur Terre ?":"Beispiel: Wie groß ist g auf der Erde?",
    "Exemple : Quelle est l'unité de Force ?":"Beispiel: Welche Einheit hat die Kraft?",
    "Consigne pour l'élève...":"Anweisung für den Schüler...",

    // ── Placeholders de champs ──
    "Tous":"Alle",
    "ex: Alcane, Alcool, Acide...":"z. B. Alkan, Alkohol, Säure...",
    "Description...":"Beschreibung...",
    "Ex: Voir le document...":"Z. B. Siehe Dokument...",
    "Ex : Les lois de Newton et leurs applications":"Z. B. Die Newtonschen Gesetze und ihre Anwendungen",
    "ou saisir librement…":"oder frei eingeben…",
    "Précisez la langue...":"Sprache angeben...",
    "Ex: Les figures de style, Les types de roches...":"Z. B. Stilfiguren, Gesteinsarten...",
    "Saisir la langue...":"Sprache eingeben...",
    "Ex: La Seconde Guerre mondiale, Les roches magmatiques...":"Z. B. Der Zweite Weltkrieg, Magmatische Gesteine...",
    "Tapez ou utilisez les boutons… ex: sqrt(x^2+1)":"Tippen oder die Schaltflächen verwenden… z. B. sqrt(x^2+1)",

    // ── Options de menus ──
    "Espagnol (Español)":"Spanisch (Español)",
    "Gravitationnel (Distance)":"Gravitativ (Abstand)",
    "Magnétique (Distance)":"Magnetisch (Abstand)",
    "Contact":"Kontakt",
    "Intrus (Hors système)":"Fremdkörper (außerhalb des Systems)",

    // ── Infobulles (title) ──
    "Générateur de prompt IA":"KI-Prompt-Generator",
    "Générateur de prompt IA pour Match":"KI-Prompt-Generator für Zuordnen",
    "Générer un prompt pour IA":"Einen Prompt für die KI generieren",
    "Isotope Générique":"Generisches Isotop",
    "Flèche":"Pfeil", "Électron":"Elektron", "État excité":"Angeregter Zustand",
    "Insérer un lien ou fichier embarqué":"Einen Link oder ein eingebettetes Datei einfügen",
    "Son (mp3/ogg/wav — embarqué Base64)":"Ton (mp3/ogg/wav — eingebettet als Base64)",

    // ── Fragments restants ──
    "tirées du pool VRAI + complétion tirée du pool FAUX. Note partielle automatique.":"aus dem WAHR-Pool gezogen + Ergänzung aus dem FALSCH-Pool gezogen. Automatische Teilbewertung.",
    "Utilisez l'éditeur ci-dessus. Le système générera automatiquement":"Verwenden Sie den Editor oben. Das System generiert automatisch",
    "(Réactifs) et":"(Reaktanten) und",
    "(Produits) via votre script":"(Produkte) über Ihr Skript",
    "❓ Aide":"❓ Hilfe",

    // ── Valeurs par défaut des champs texte (exemples & feedbacks pré-remplis).
    //    NB : en anglais, ces défauts partent ainsi dans le XML si non modifiés. ──
    "Proposition correcte A":"Richtige Aussage A",
    "Proposition incorrecte B":"Falsche Aussage B",
    "Bonne réponse":"Richtige Antwort", "Mauvaise réponse":"Falsche Antwort",
    "Exact !":"Richtig!", "Non.":"Nein.", "Excellent !":"Ausgezeichnet!",
    "Faux.":"Falsch.", "Incorrect.":"Falsch.",
    "Certaines réponses sont incorrectes.":"Einige Antworten sind falsch.",
    "Bravo, l'équation est équilibrée !":"Sehr gut, die Gleichung ist ausgeglichen!",
    "L'équation n'est pas correcte ou mal équilibrée.":"Die Gleichung ist falsch oder nicht ausgeglichen.",
    "Votre réponse sera lue et corrigée par votre professeur.":"Ihre Antwort wird von Ihrer Lehrkraft gelesen und bewertet."
  }, es: {

    // ── Placeholders des éditeurs riches (attribut data-ph) ──
    "Cliquez sur Éditeur...":"Clic en Editor...",
    "Exemple : Quelle est la valeur de g sur Terre ?":"Ejemplo: ¿Cuál es el valor de g en la Tierra?",
    "Exemple : Quelle est l'unité de Force ?":"Ejemplo: ¿Cuál es la unidad de la Fuerza?",
    "Consigne pour l'élève...":"Instrucción para el alumno...",

    // ── Placeholders de champs ──
    "Tous":"Todos",
    "ex: Alcane, Alcool, Acide...":"ej.: Alcano, Alcohol, Ácido...",
    "Description...":"Descripción...",
    "Ex: Voir le document...":"Ej.: Ver el documento...",
    "Ex : Les lois de Newton et leurs applications":"Ej.: Las leyes de Newton y sus aplicaciones",
    "ou saisir librement…":"o escribir libremente…",
    "Précisez la langue...":"Especifique el idioma...",
    "Ex: Les figures de style, Les types de roches...":"Ej.: Las figuras retóricas, Los tipos de rocas...",
    "Saisir la langue...":"Introduzca el idioma...",
    "Ex: La Seconde Guerre mondiale, Les roches magmatiques...":"Ej.: La Segunda Guerra Mundial, Las rocas magmáticas...",
    "Tapez ou utilisez les boutons… ex: sqrt(x^2+1)":"Escriba o use los botones… ej.: sqrt(x^2+1)",

    // ── Options de menus ──
    "Espagnol (Español)":"Español",
    "Gravitationnel (Distance)":"Gravitacional (Distancia)",
    "Magnétique (Distance)":"Magnético (Distancia)",
    "Contact":"Contacto",
    "Intrus (Hors système)":"Intruso (fuera del sistema)",

    // ── Infobulles (title) ──
    "Générateur de prompt IA":"Generador de prompt IA",
    "Générateur de prompt IA pour Match":"Generador de prompt IA para Relacionar",
    "Générer un prompt pour IA":"Generar un prompt para la IA",
    "Isotope Générique":"Isótopo genérico",
    "Flèche":"Flecha", "Électron":"Electrón", "État excité":"Estado excitado",
    "Insérer un lien ou fichier embarqué":"Insertar un enlace o archivo incrustado",
    "Son (mp3/ogg/wav — embarqué Base64)":"Sonido (mp3/ogg/wav — incrustado en Base64)",

    // ── Fragments restants ──
    "tirées du pool VRAI + complétion tirée du pool FAUX. Note partielle automatique.":"extraídas del pool VERDADERO + complemento extraído del pool FALSO. Calificación parcial automática.",
    "Utilisez l'éditeur ci-dessus. Le système générera automatiquement":"Utilice el editor de arriba. El sistema generará automáticamente",
    "(Réactifs) et":"(Reactivos) y",
    "(Produits) via votre script":"(Productos) mediante su script",
    "❓ Aide":"❓ Ayuda",

    // ── Valeurs par défaut des champs texte (exemples & feedbacks pré-remplis).
    //    NB : en anglais, ces défauts partent ainsi dans le XML si non modifiés. ──
    "Proposition correcte A":"Propuesta correcta A",
    "Proposition incorrecte B":"Propuesta incorrecta B",
    "Bonne réponse":"Respuesta correcta", "Mauvaise réponse":"Respuesta incorrecta",
    "Exact !":"¡Correcto!", "Non.":"No.", "Excellent !":"¡Excelente!",
    "Faux.":"Incorrecto.", "Incorrect.":"Incorrecto.",
    "Certaines réponses sont incorrectes.":"Algunas respuestas son incorrectas.",
    "Bravo, l'équation est équilibrée !":"¡Bien hecho, la ecuación está equilibrada!",
    "L'équation n'est pas correcte ou mal équilibrée.":"La ecuación es incorrecta o no está bien equilibrada.",
    "Votre réponse sera lue et corrigée par votre professeur.":"Su respuesta será leída y corregida por su profesor."
  }, nl: {

    // ── Placeholders des éditeurs riches (attribut data-ph) ──
    "Cliquez sur Éditeur...":"Klik op Editor...",
    "Exemple : Quelle est la valeur de g sur Terre ?":"Voorbeeld: Wat is de waarde van g op Aarde?",
    "Exemple : Quelle est l'unité de Force ?":"Voorbeeld: Wat is de eenheid van Kracht?",
    "Consigne pour l'élève...":"Instructie voor de leerling...",

    // ── Placeholders de champs ──
    "Tous":"Alle",
    "ex: Alcane, Alcool, Acide...":"bv. Alkaan, Alcohol, Zuur...",
    "Description...":"Beschrijving...",
    "Ex: Voir le document...":"Bv. Zie het document...",
    "Ex : Les lois de Newton et leurs applications":"Bv. De wetten van Newton en hun toepassingen",
    "ou saisir librement…":"of vrij typen…",
    "Précisez la langue...":"Geef de taal op...",
    "Ex: Les figures de style, Les types de roches...":"Bv. Stijlfiguren, Soorten gesteenten...",
    "Saisir la langue...":"Taal invoeren...",
    "Ex: La Seconde Guerre mondiale, Les roches magmatiques...":"Bv. De Tweede Wereldoorlog, Magmatische gesteenten...",
    "Tapez ou utilisez les boutons… ex: sqrt(x^2+1)":"Typ of gebruik de knoppen… bv. sqrt(x^2+1)",

    // ── Options de menus ──
    "Espagnol (Español)":"Spaans (Español)",
    "Gravitationnel (Distance)":"Zwaartekracht (Afstand)",
    "Magnétique (Distance)":"Magnetisch (Afstand)",
    "Contact":"Contact",
    "Intrus (Hors système)":"Indringer (buiten systeem)",

    // ── Infobulles (title) ──
    "Générateur de prompt IA":"AI-promptgenerator",
    "Générateur de prompt IA pour Match":"AI-promptgenerator voor Koppelen",
    "Générer un prompt pour IA":"Een prompt genereren voor AI",
    "Isotope Générique":"Generieke isotoop",
    "Flèche":"Pijl", "Électron":"Elektron", "État excité":"Aangeslagen toestand",
    "Insérer un lien ou fichier embarqué":"Een link of ingesloten bestand invoegen",
    "Son (mp3/ogg/wav — embarqué Base64)":"Geluid (mp3/ogg/wav — ingesloten Base64)",

    // ── Fragments restants ──
    "tirées du pool VRAI + complétion tirée du pool FAUX. Note partielle automatique.":"getrokken uit de WAAR-pool + aanvulling getrokken uit de ONWAAR-pool. Automatische gedeeltelijke score.",
    "Utilisez l'éditeur ci-dessus. Le système générera automatiquement":"Gebruik de editor hierboven. Het systeem genereert automatisch",
    "(Réactifs) et":"(Reactanten) en",
    "(Produits) via votre script":"(Producten) via uw script",
    "❓ Aide":"❓ Hulp",

    // ── Valeurs par défaut des champs texte (exemples & feedbacks pré-remplis).
    //    NB : en anglais, ces défauts partent ainsi dans le XML si non modifiés. ──
    "Proposition correcte A":"Juiste stelling A",
    "Proposition incorrecte B":"Onjuiste stelling B",
    "Bonne réponse":"Juist antwoord", "Mauvaise réponse":"Onjuist antwoord",
    "Exact !":"Correct!", "Non.":"Nee.", "Excellent !":"Uitstekend!",
    "Faux.":"Onjuist.", "Incorrect.":"Onjuist.",
    "Certaines réponses sont incorrectes.":"Sommige antwoorden zijn onjuist.",
    "Bravo, l'équation est équilibrée !":"Goed gedaan, de vergelijking is in evenwicht!",
    "L'équation n'est pas correcte ou mal équilibrée.":"De vergelijking is onjuist of niet in evenwicht.",
    "Votre réponse sera lue et corrigée par votre professeur.":"Uw antwoord wordt gelezen en nagekeken door uw docent."
  }});
})();
