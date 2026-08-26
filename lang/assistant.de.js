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

/* ════════════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — Inhalt des ASSISTENT-MODUS (Deutsch)
   Gespeichert in window.ASSIST_LANG.de ; gelesen von assistant.js je nach Sprache.
   Um eine Sprache hinzuzufügen: Diese Datei kopieren, die Werte übersetzen
   und in window.ASSIST_LANG.<code> speichern.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  window.ASSIST_LANG = window.ASSIST_LANG || {};

  window.ASSIST_LANG.de = {
    /* ── Schnittstelle des Panels ── */
    toggle: "Assistent-Modus",
    toggleTitle: "Schritt-für-Schritt-Anleitung: hebt den aktuellen Schritt hervor und erklärt die Felder",
    panelTitle: "Assistent-Modus",
    disable: "Deaktivieren",

    /* ── Bewertungsschema (oben in den Feldern für alle Typen hinzugefügt) ── */
    notation: "<strong>Bewertungsschema (Punkte)</strong> — im gelben Banner oben im Formular: Anzahl der für die Frage vergebenen Punkte.",

    /* ── Schritte ── */
    step1: {
      title: "Schritt 1 — Benennen",
      explain: "Geben Sie Ihrer Übung im hervorgehobenen Feld einen Namen und drücken Sie dann <strong>Eingabe</strong> oder klicken Sie woanders.",
      tip: "Dieser Name identifiziert die für Moodle generierte Aufgabe."
    },
    step2: {
      title: "Schritt 2 — Typ auswählen",
      explain: "Klicken Sie auf den zu erstellenden <strong>Fragentyp</strong> zwischen den hervorgehobenen Karten.",
      tip: "Jeder Typ öffnet ein angepasstes Formular direkt darunter — der Leitfaden wird dann feldweise präzisiert."
    },
    step3: {
      editTitle: "Bearbeitung von F{n} — {label}",
      editExplain: "Sie bearbeiten die Frage <strong>F{n}</strong>. Passen Sie die folgenden Felder an:",
      editDo: "Klicken Sie auf „F{n} aktualisieren“, um zu speichern, oder auf „Abbrechen“, um den Vorgang abzubrechen.",
      title: "Schritt 3 — {label}",
      noGuideExplain: "Füllen Sie das hervorgehobene Formular aus und fügen Sie dann die Frage hinzu.",
      noGuideDo: "Klicken Sie auf „Diese Frage hinzufügen“.",
      do: "Wenn ausgefüllt, klicken Sie auf „Diese Frage hinzufügen“.",
      done: "{qn} Frage(n) bereits hinzugefügt. Wiederholen Sie den Vorgang, um weitere hinzuzufügen, oder gehen Sie zu Schritt 4."
    },
    step4: {
      title: "Schritt 4 — Generieren",
      explain: "Ihre <strong>{qn} Frage(n)</strong> sind bereit. Klicken Sie auf „<strong>🏷️ Tags &amp; Vorschau</strong>“, um zu überprüfen und dann zu generieren und zu exportieren.",
      tip: "Sie können eine Frage über ihre Badges immer noch bearbeiten (✏️) oder löschen (✕)."
    },

    /* ── Seitliche Schritteliste ── */
    stepsList: ["Übung benennen", "Typ auswählen", "Ausfüllen und hinzufügen", "Generieren / Exportieren"],

    /* ── Varianten V4 (Drag & Drop Editor) ── */
    step2_v4: {
      title: "Schritt 2 — Frage einfügen",
      explain: "Klicken Sie in der Palette <strong>links</strong> auf eine Kategorie, um sie zu öffnen, und ziehen Sie dann einen Block in den Editor.",
      tip: "Das Konfigurationsfeld wird automatisch geöffnet, um die Frage zu parametrieren."
    },
    step3_v4: {
      editTitle: "Konfiguration von F{n} — {label}",
      editExplain: "Füllen Sie die Felder für die Frage <strong>F{n}</strong> aus:",
      editDo: "Klicken Sie auf „Speichern“, um zu bestätigen.",
      title: "Schritt 3 — {label}",
      noGuideExplain: "Füllen Sie das hervorgehobene Formular aus.",
      noGuideDo: "Klicken Sie auf „Speichern“.",
      do: "Wenn ausgefüllt, klicken Sie auf „Speichern“.",
      done: "{qn} Frage(n) bereits konfiguriert. Fügen Sie weitere ein oder gehen Sie zum Export."
    },
    step4_v4: {
      title: "Schritt 4 — Exportieren",
      explain: "Ihre <strong>{qn} Frage(n)</strong> sind bereit. Klicken Sie auf <strong>XML exportieren</strong>, um zu überprüfen und herunterzuladen.",
      tip: "Graue Aufzählungspunkte zeigen Fragen an, die noch konfiguriert werden müssen."
    },
    stepsList_v4: ["Übung benennen", "Block ziehen", "Konfigurieren", "Exportieren"],

    /* ── Hilfe-Banner in den Fenstern „KI-Prompt“ ── */
    prompt: {
      title: "So verwenden Sie den KI-Prompt",
      steps: [
        "Geben Sie den <strong>Kontext</strong> unten ein (Thema, Fach, Niveau, Sprache, Anzahl der Elemente).",
        "Der <strong>Prompt wird automatisch erstellt</strong> im dunklen Rahmen unten.",
        "Klicken Sie auf „<strong>📋 Prompt kopieren</strong>“.",
        "Fügen Sie ihn in eine <strong>KI</strong> (ChatGPT, Claude, Gemini…) ein und starten Sie die Generierung.",
        "Holen Sie das von der <strong>KI erzeugte Ergebnis</strong> ab (im JSON-Format).",
        "Kehren Sie zu Cairn for Stack zurück und <strong>importieren Sie es</strong> über die Schaltfläche „📥 JSON“ des Formulars."
      ],
      note: "⚠️ <strong>Verwechseln Sie dies nicht mit der Schüleransicht.</strong> " +
        "Diese beiden Felder beschreiben, was <strong>die KI produzieren</strong> soll (der Pool), nicht was der Schüler sehen wird:" +
        "<ul class=\"hs-pb-note-list\">" +
          "<li>„<strong>Gesamtanzahl der Optionen (XE)</strong>“ = Gesamtzahl der zu <strong>erstellenden</strong> Optionen " +
            "(Pool WAHR + FALSCH), nicht die für den Schüler angezeigte Anzahl.</li>" +
          "<li>„<strong>Wahre Optionen (XB)</strong>“ = Anzahl der in diesem Pool zu <strong>generierenden</strong> wahren Optionen, " +
            "nicht die Anzahl der dem Schüler gezeigten richtigen Antworten.</li>" +
        "</ul>" +
        "Die tatsächlich angezeigte und zufällig ausgewählte Zahl wird <strong>im Formular</strong> eingestellt, nicht hier."
    },

    /* ── Lesbare Bezeichnungen nach Typ ── */
    TYPE_LABEL: {
      checkbox: "Checkboxen", radio: "Radio-Buttons", dropdown: "Dropdown-Menü",
      algebraic: "Algebraisch", numerical: "Arithmetik (Numerisch)", units: "Einheit", string: "Text (String)",
      match: "Zuordnen (Matching)", crossword: "Kreuzworträtsel", doi: "Objekt-Wechselwirkungs-Diagramm",
      chemical: "Chemie — Gleichung", chemical_topo: "Topologische Chemie",
      nuclear: "Kernreaktionen", composition: "Freie Erstellung",
      jxgdrop: "JSXGraph Drag & Drop", vf: "Wahr / Falsch", ord: "Sortieren",
      imgclick: "Auswahl auf Bild", rvbcmj: "RGB / CMYK",
      optique: "Geometrische Optik", "acide-base": "pH-Metrie / Titration", redox: "Redox-Titration",
      basen: "Basis-N-Konvertierung", circuit: "Elektrische Stromkreise",
      logique: "Boolesche Logik", complexe: "Komplexe Zahlen",
      calcul: "Differential- und Integralrechnung", statistiques: "Statistik",
      matrices: "Matrizen", geometrie: "Analytische Geometrie",
      suites: "Zahlenfolgen", probabilites: "Wahrscheinlichkeitsrechnung",
      trigonometrie: "Trigonometrie", polynomes: "Polynome 2. Grades",
      limites: "Grenzwerte von Funktionen", physique: "Physik — Mechanik",
      inequation: "Ungleichungen (Lösungsmenge)"
    },

    /* ── Detaillierte Anleitung für Schritt 3, Feld für Feld, nach Typ ── */
    STEP3: {
      checkbox: {
        intro: "Multiple-Choice mit Mehrfachantworten: Cairn for Stack zieht bei jedem Versuch zufällig gute/schlechte Optionen.",
        fields: [
          "<strong>Aufgabenstellung</strong> — klicken Sie auf „✏️ Editor“, um die Frage zu verfassen (Text, Formel, Bild).",
          "<strong>Bewertungsschema</strong> (gelbes Banner oben) — vergebene Punkte.",
          "<strong>Gesamtanzahl der Optionen</strong> — wie viele Boxen der Schüler sehen wird.",
          "<strong>Anzahl richtiger Antworten</strong> — wie viele wahr sind (fest oder zufällig).",
          "<strong>Optionen</strong> — fügen Sie Ihre Antworten mit „✅ + WAHR“ und „❌ + FALSCH“ hinzu.",
          "<strong>Feedback</strong> — angezeigte Nachrichten bei richtig / falsch."
        ],
        tip: "Geben Sie mehr WAHR/FALSCH-Optionen ein als angezeigt werden: Die Zufallsauswahl wird von Schüler zu Schüler variieren."
      },
      radio: {
        intro: "Nur eine richtige Antwort: gezogen aus dem Pool WAHR, umgeben von Distraktoren aus dem Pool FALSCH.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Bewertungsschema</strong> — Punkte.",
          "<strong>Gesamtanzahl angezeigter Buttons</strong> — 1 richtige Antwort + der Rest als Distraktoren.",
          "<strong>Pool WAHR</strong> — fügen Sie die möglichen richtigen Antworten hinzu („+ Richtige Antwort“).",
          "<strong>Pool FALSCH</strong> — fügen Sie die Distraktoren hinzu."
        ],
        tip: "Mehrere richtige Antworten im Pool WAHR = eine andere Variante bei jedem Durchgang."
      },
      dropdown: {
        intro: "Gleiches Prinzip wie der Radio-Button, aber als Dropdown-Menü dargestellt.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Bewertungsschema</strong> — Punkte.",
          "<strong>Anzahl der im Menü angezeigten Optionen</strong>.",
          "<strong>Pool WAHR</strong> — richtige Antworten.",
          "<strong>Pool FALSCH</strong> — Distraktoren."
        ]
      },
      algebraic: {
        intro: "Der Schüler gibt einen mathematischen Ausdruck ein; Cairn for Stack prüft die algebraische Äquivalenz.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Variablen</strong> — listen Sie diese auf (z. B.: x, y, z).",
          "<strong>Erwartete Antwort</strong> — der korrekte Ausdruck. Verwenden Sie „🎹 Eingabehilfe“ für die Maxima-Syntax.",
          "<strong>Feedback</strong> bei richtig / falsch.",
          "<span class='opt'>Detaillierte Lösung (optional)</span> — nachträglich angezeigte Erklärung."
        ],
        tip: "Schreiben Sie die Antwort in Maxima-Syntax (z. B.: 2*x^2, sqrt(3)), nicht in handschriftlicher Notation."
      },
      numerical: {
        intro: "Einzige numerische Antwort, mit Verwaltung von Rundung und Toleranz.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Zielwert</strong> — die erwartete Zahl.",
          "<strong>Auto-Rundung / Dezimalstellen</strong> — einstellen, falls die Antwort gerundet werden muss.",
          "<strong>Toleranztyp</strong> + <strong>Fehlertoleranz</strong> — akzeptierter Abstand.",
          "<strong>Feedback</strong> bei richtig / falsch."
        ]
      },
      units: {
        intro: "Antwort = ein numerischer Wert UND eine Einheit (Cairn for Stack prüft beides).",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Erwarteter numerischer Wert</strong>.",
          "<strong>Maxima-Einheit</strong> — z. B.: m/s, kg, N (Maxima-Syntax).",
          "<strong>Relative Toleranz</strong> + <strong>signifikante Stellen</strong>.",
          "<strong>Feedback</strong> bei richtig / falsch."
        ],
        tip: "Die Einheit wird in Maxima-Syntax notiert: Verwenden Sie im Zweifelsfall „🎹 Eingabehilfe“."
      },
      string: {
        intro: "Freie Textantwort, verglichen mit einer erwarteten Antwort.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Erwartete Antwort</strong> — der korrekte Text.",
          "<strong>Feldgröße</strong> + <strong>Toleranz</strong> (Flexibilität des Vergleichs).",
          "<strong>Feedback</strong> bei richtig / falsch.",
          "<span class='opt'>Lösung / Erklärung (optional)</span>."
        ]
      },
      match: {
        intro: "Der Schüler verbindet die Elemente zweier Spalten.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Spalten links / rechts</strong> — fügen Sie die zu verbindenden Elemente hinzu.",
          "<strong>Zuordnungen</strong> — ziehen Sie die korrekten Entsprechungen zwischen den Spalten."
        ],
        tip: "Die Schaltfläche „🤖 KI-Prompt“ generiert einen fertigen Prompt zum Einfügen, um die Paare zu erstellen."
      },
      crossword: {
        intro: "Aus einer Liste von Wörtern + Definitionen generiertes Kreuzworträtsel.",
        fields: [
          "<strong>Bewertungsschema</strong> und <strong>Anzahl der zu verwendenden Wörter</strong>.",
          "<strong>Wörter + Definitionen</strong> — fügen Sie jede Zeile hinzu („+ Wort hinzufügen“).",
          "<strong>Raster generieren</strong> — Cairn for Stack berechnet die Anordnung."
        ],
        tip: "„🤖 KI-Prompt“ erstellt mit einem Klick eine Wort-/Definitionsliste zu einem Thema."
      },
      doi: {
        intro: "Objekt-Wechselwirkungs-Diagramm: der Schüler verbindet ein zentrales Objekt mit seiner Umgebung.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Studienobjekt</strong> — die zentrale Zone des Systems.",
          "<span class='opt'>Zusätzliche leere blaue Zonen (optional)</span> — zusätzliche Fallen.",
          "<strong>Objekte und Wechselwirkungen</strong> — listen Sie jedes Objekt und seinen Typ auf (Gravitation, Kontakt, Störendes…)."
        ]
      },
      chemical: {
        intro: "Chemische Gleichung: der Schüler vervollständigt oder identifiziert eine Reaktion.",
        fields: [
          "<span class='opt'>Aufgabenstellung (optional)</span> — über „✏️ Editor“.",
          "<strong>Eingabe der Gleichung</strong> — tippen Sie sie ein, dann „🔄 Vorschau aktualisieren“.",
          "<strong>Reaktionstyp</strong>.",
          "<strong>Name der erwarteten funktionellen Gruppe</strong>.",
          "<strong>Feedback</strong> bei richtig / falsch."
        ]
      },
      chemical_topo: {
        intro: "Topologische Chemie: Gleichung aus SMILES-Strukturen, detaillierte Notation.",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Gleichung (SMILES oder Formel)</strong> — eingeben, dann „🔄 Aktualisieren“.",
          "<strong>Gewichtung</strong> — verteilen Sie die % zwischen dem Pfeil (PRT1) und den Knoten.",
          "<strong>Summe der % = 100</strong> — die grüne Nachricht bestätigt das Gleichgewicht."
        ],
        tip: "Überprüfen Sie die Summen-Anzeige: Solange sie rot ist, ist das Bewertungsschema ungültig."
      },
      nuclear: {
        intro: "Kernreaktion: der Schüler vervollständigt die Gleichung (Erhaltung von A und Z).",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Modell der Kernreaktion</strong> — geben Sie die Gleichung ein, dann „🔄 Vorschau“."
        ]
      },
      composition: {
        intro: "Freie verfasste Antwort in einem Editor (Aufsatz / offene Frage).",
        fields: [
          "<strong>Aufgabenstellung</strong> — über „✏️ Editor“.",
          "<strong>Größe des Studenten-Editors</strong> — Höhe der Redaktionszone.",
          "<span class='opt'>Unter dem Editor angezeigte Nachricht (optional)</span> — Anweisung für den Schüler."
        ]
      },
      basen: {
        intro: "Basis-N-Konvertierung: der Schüler konvertiert eine Zahl zwischen Basen (2, 8, 10, 16).",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein häufiges Beispiel.",
          "<strong>Quellzahl</strong> + <strong>Quellbasis</strong> (z. B.: 1010 in Basis 2).",
          "<strong>Zielbasis</strong> — Basis, in die konvertiert werden soll.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Vorschau berechnet automatisch die korrekte Antwort zur Überprüfung."
      },
      circuit: {
        intro: "Gesetze der elektrischen Stromkreise: Ohm, Reihen-/Parallelschaltung, Leistung.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein Schaltungsszenario.",
          "<strong>Fragetyp</strong> — Ohmsches Gesetz, Reihen-/Parallelwiderstand, Stromstärke, Leistung…",
          "<strong>Parameter</strong> U, I, R, P je nach Szenario.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ]
      },
      logique: {
        intro: "Boolesche Logik: Wahrheitstabellen, Vereinfachung, Äquivalenzen.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein Beispiel (AND, OR, NOT, XOR, De Morgan…).",
          "<strong>Fragetyp</strong> — Wahrheitstabelle, Vereinfachung, Äquivalenz.",
          "<strong>Boolescher Ausdruck</strong> — Notation mit AND/OR/NOT/XOR.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Vorschau zeigt die vollständige Wahrheitstabelle und den erwarteten Wert an."
      },
      complexe: {
        intro: "Komplexe Zahlen: algebraische Form, Betrag, Argument, konjugiert Komplexe.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein Beispiel (alg. Form, Betrag, Argument…).",
          "<strong>Fragetyp</strong> — algebraische Form, Betrag, Argument, konjugiert Komplexe, Operationen.",
          "<strong>Reeller und imaginärer Teil</strong> a + bi.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Antwort erfolgt in Maxima-Syntax: %i für i, %pi für π."
      },
      calcul: {
        intro: "Differential- und Integralrechnung: Ableitung, Stammfunktion, bestimmtes Integral.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie eine typische Funktion.",
          "<strong>Fragetyp</strong> — Ableitung, Stammfunktion, Integral, numerischer Wert.",
          "<strong>Funktion f(x)</strong> in Maxima-Syntax.",
          "<strong>Grenzen a, b</strong> für das bestimmte Integral.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Maxima-Syntax: diff(x^3,x) = 3x², integrate(x^2,x,0,1) = 1/3."
      },
      statistiques: {
        intro: "Statistik: Mittelwert, Median, Varianz, Quartile, Spannweite.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie einen typischen Datensatz.",
          "<strong>Fragetyp</strong> — Mittelwert, Median, Varianz, Standardabweichung, Q1, Q3, Spannweite.",
          "<strong>Daten</strong> — Liste der Werte, getrennt durch Kommas.",
          "<span class='opt'>Häufigkeiten</span> — für den gewichteten Mittelwert.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ]
      },
      matrices: {
        intro: "Lineare Algebra: Matrixmultiplikation, Determinante, Transposition, Spur.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie eine Operation.",
          "<strong>Fragetyp</strong> — Produkt, Determinante, Transposition, Spur, Inverse.",
          "<strong>Größe</strong> — Matrix 2×2 oder 3×3.",
          "<strong>Koeffizienten</strong> — geben Sie die Einträge der Matrix(en) ein.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Antwort erfolgt in Maxima-Syntax: matrix([a,b],[c,d])."
      },
      geometrie: {
        intro: "Analytische Geometrie: Abstand, Mittelpunkt, Vektoren, Geraden, Kreise.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein 2D- oder 3D-Beispiel.",
          "<strong>Fragetyp</strong> — Abstand, Mittelpunkt, Norm, Skalarprodukt, Kollinearität.",
          "<strong>Punkte / Vektoren</strong> — Koordinaten A, B, C.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ]
      },
      suites: {
        intro: "Zahlenfolgen: allgemeines Glied, Summe, Grenzwert einer geometrischen Folge.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie eine typische Folge.",
          "<strong>Fragetyp</strong> — Glied, Summe, Grenzwert, Art.",
          "<strong>Parameter</strong> u₀, r (oder d), n je nach Szenario.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ]
      },
      probabilites: {
        intro: "Wahrscheinlichkeitsrechnung: Kombinationen, Binomialverteilung, Erwartungswert, bedingte Wahrscheinlichkeit.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein Beispiel.",
          "<strong>Fragetyp</strong> — Kombination, P(X=k), E(X), Var(X), bedingte Wahrscheinlichkeit.",
          "<strong>Parameter</strong> n, k, p je nach Verteilung.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ]
      },
      trigonometrie: {
        intro: "Trigonometrie: exakte Werte (sin/cos/tan), Identitäten, Gleichungen.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie einen typischen Winkel (π/6, π/4, π/3…).",
          "<strong>Fragetyp</strong> — exakter Wert, Identität, trigonometrische Gleichung.",
          "<strong>Winkel θ</strong> — Bruch von π in Maxima-Syntax (z. B.: %pi/6).",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Antworten liegen in exakter Form (Brüche von π) vor — keine Dezimalzahlen."
      },
      polynomes: {
        intro: "Polynom 2. Grades ax²+bx+c: Diskriminante, Nullstellen, Vietasche Formeln.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein typisches Polynom.",
          "<strong>Fragetyp</strong> — Diskriminante Δ, Nullstellen, Summe/Produkt der Nullstellen, Anzahl der Nullstellen.",
          "<strong>Koeffizienten a, b, c</strong> des Polynoms.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Vorschau berechnet Δ und die Nullstellen in Echtzeit zur Überprüfung."
      },
      limites: {
        intro: "Grenzwerte von Funktionen: Grenzwert im Unendlichen, an einem Punkt, unbestimmte Formen.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie eine Funktion und einen typischen Punkt.",
          "<strong>Art des Grenzwerts</strong> — x→+∞, x→−∞, x→a, x→a⁺.",
          "<strong>Ausdruck f(x)</strong> in Maxima-Syntax.",
          "<strong>Erwartete Antwort</strong> — Grenzwert eingeben (inf, -inf, Bruch, %pi…).",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Die Antwort wird manuell eingegeben, da einige Grenzwerte ein menschliches Urteil erfordern."
      },
      physique: {
        intro: "Klassische Mechanik: MRUA, freier Fall, kinetische/potentielle Energie, Newton.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein physikalisches Szenario.",
          "<strong>Fragetyp</strong> — v(t), x(t), Höhe, Zeit, Ek, Ep, Em-Erhaltung, F=ma.",
          "<strong>Parameter</strong> v₀, a, t, m, h je nach Szenario.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "Der Schüler gibt eine Dezimalzahl ein; die Toleranz beträgt 1 % (NumRelative)."
      },
      inequation: {
        intro: "Ungleichungen: Lösungsmenge in STACK-Intervallnotation (oo, cc, union…). AlgEquiv verarbeitet die Intervalle.",
        fields: [
          "<strong>Voreinstellung</strong> — wählen Sie ein Beispiel.",
          "<strong>Typ</strong> — linear (ax+b ▷ 0), Polynom (ax²+bx+c ▷ 0), Betragsfunktion.",
          "<strong>Operator</strong> — >, ≥, <, ≤.",
          "<strong>Koeffizienten a, b, c</strong> je nach Typ.",
          "<strong>Lösungsmenge</strong> — automatisch berechnet; bei Bedarf korrigieren: <code>oo(2,inf)</code>, <code>cc(-2,2)</code>, <code>union(...)</code>.",
          "<strong>Anweisung</strong> — über „✏️ Editor“.",
          "<strong>Feedback</strong> richtig / falsch."
        ],
        tip: "STACK akzeptiert oo/oc/co/cc für Intervalle und union() für Vereinigungen. Fügen Sie inf und -inf für Halbgeraden hinzu."
      }
    }
  };
})();