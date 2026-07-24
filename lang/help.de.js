/* ════════════════════════════════════════════════════════════════
   STACKFORGE — HILFEINHALTE: DEUTSCH
   Nur Daten (keine Logik). Um eine Hilfssprache hinzuzufügen,
   kopieren Sie diese Datei (z.B. help.en.js), übersetzen Sie die Texte
   und beenden Sie mit: window.HELP_LANG.en = HELP_CONTENT;
   ════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
function _hSection(title, html){ return `<h4 class="help-h">${title}</h4>${html}`; }
function _hList(items){ return '<ul class="help-ul">'+items.map(i=>`<li>${i}</li>`).join('')+'</ul>'; }

// Gemeinsamer Hinweis, der unten bei jeder Hilfe angezeigt wird (Elemente, die von allen Modulen geteilt werden).
const _HELP_COMMON = `
  <div class="help-common">
    <strong>Gemeinsame Hinweise für alle Module</strong>
    ${_hList([
      'Schaltfläche <b><svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Editor</b>: öffnet den Rich-Text-Editor (Fett, Farben, Listen, Bilder, Töne, Tabellen, Links).',
      'Um eine Formel einzufügen, klicken Sie im Editor auf <b>∑ LaTeX</b>. In roher Syntax: <code>$ ... $</code> inline, <code>$$ ... $$</code> zentriert (z.&nbsp;B.: <code>$\\frac{1}{2}$</code>).',
      '<b><svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> KI-Prompt</b> (falls vorhanden): generiert einen Text, der in eine KI kopiert wird, um den Frageninhalt automatisch zu erstellen.',
      '<b><svg class="hs-ico"><use href="#ico-file-import"></use></svg> / <svg class="hs-ico"><use href="#ico-file-export"></use></svg> JSON</b> (falls vorhanden): Konfiguration der Frage importieren oder exportieren, um sie wiederzuverwenden.'
    ])}
  </div>`;

const HELP_CONTENT = {

  // ───────────────────────────────────────── CHECKBOXEN
  checkbox: {
    title: '<svg class="hs-ico"><use href="#ico-type-checkbox"></use></svg> Checkboxen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Multiple-Choice-Frage mit <b>Mehrfachantworten</b>: der Schüler kann mehrere Boxen ankreuzen. Die Punktevergabe ist <b>automatisch teilweise</b> (jede richtige/falsche Box zählt).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die Anweisung (z. B. „Kreuzen Sie alle zutreffenden Aussagen an“).',
        '<b>Gesamtanzahl der Optionen</b>: wie viele Boxen für den Schüler sichtbar sein werden.',
        '<b>Anzahl richtiger Antworten</b>: <i>Fest</i> (immer dieselbe Anzahl an wahren) oder <i>Zufällig</i>.',
        'Fügen Sie Ihre Optionen mit <b>✅ + WAHR</b> und <b>❌ + FALSCH</b> hinzu. Für jede: ein <b>Text</b> (der angezeigte Text) und ein <b>Feedback</b> (Erklärung).'
      ])) +
      _hSection('Tipps / Fallstricke', _hList([
        'Geben Sie <b>mehr Optionen</b> in die Listen als angezeigt werden: das System zieht bei jedem Versuch zufällig daraus → jeder Schüler sieht eine Variante.',
        'Überprüfen Sie die orangefarbene Warnung: sie signalisiert einen unzureichenden Pool für die angeforderte Ziehung.',
        'Der Text akzeptiert LaTeX (<code>$...$</code>) und Formatierungen.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── RADIO-BUTTONS
  radio: {
    title: '<svg class="hs-ico"><use href="#ico-type-radio"></use></svg> Radio-Buttons — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Multiple-Choice-Frage mit <b>Einfachantwort</b>: nur eine richtige Antwort, dargestellt als Radio-Buttons.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die Anweisung.',
        '<b>Gesamtanzahl angezeigter Buttons</b>: 1 richtige Antwort + Distraktoren.',
        'Füllen Sie den <b>Pool WAHR</b> (richtige Antworten) und den <b>Pool FALSCH</b> (Distraktoren).'
      ])) +
      _hSection('Funktionsweise der Zufallsauswahl', _hList([
        '1 richtige Antwort wird <b>zufällig</b> aus dem Pool WAHR gezogen.',
        'Die anderen Buttons sind Distraktoren, die aus dem Pool FALSCH gezogen werden.',
        'Es werden mindestens <b>1 WAHR</b> und <b>(Anzahl angezeigt − 1) FALSCH</b> benötigt.'
      ])) +
      _hSection('Tipp',
        '<p>Mehrere mögliche richtige Antworten im Pool WAHR? Das System wählt bei jedem Versuch eine aus: ideal, um die Fragen zu variieren.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── DROPDOWN-MENÜ
  dropdown: {
    title: '<svg class="hs-ico"><use href="#ico-type-dropdown"></use></svg> Dropdown-Menü — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Identisch mit dem Radio-Button (eine einzige richtige Antwort), aber als <b>Dropdown-Liste</b> dargestellt. Praktisch, um eine Antwort in einen Satz einzufügen.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b> + <b>Anzahl der angezeigten Optionen</b>.',
        '<b>Pool WAHR</b>: die richtige(n) Antwort(en). <b>Pool FALSCH</b>: die Distraktoren.',
        'Minimum erforderlich: 1 WAHR und (Gesamtanzahl − 1) FALSCH.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ALGEBRAISCH
  algebraic: {
    title: '<svg class="hs-ico"><use href="#ico-type-algebraic"></use></svg> Algebraisch — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler gibt einen <b>mathematischen Ausdruck</b> ein. STACK prüft die algebraische Äquivalenz (z. B. <code>2*x+y</code> = <code>y+2*x</code>), nicht die genaue Schreibweise.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Variablen</b>: listen Sie diese auf, getrennt durch Kommas (z. B. <code>x, y</code>).',
        '<b>Erwartete Antwort</b>: die korrekte Formel. Der Button <b><svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> Eingabehilfe</b> öffnet eine Tastatur zur fehlerfreien Eingabe.',
        'Tab <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Schülerhilfe</b>: aktivieren Sie die anzuzeigenden Hinweise (Dezimalpunkt, Zehnerpotenzen…) und die virtuelle Tastatur.',
        'Tab <b>💡 Lösung</b>: verfassen Sie die detaillierte Korrektur.'
      ])) +
      _hSection('Einzuhaltende Syntax', _hList([
        'Explizite Multiplikation: schreiben Sie <code>2*x</code>, niemals <code>2x</code> (sonst wird „2x“ als einzige Variable gelesen).',
        'Potenzen mit <code>^</code> (z. B. <code>x^2</code>), Dezimalzahlen mit Punkt (z. B. <code>1.5</code>).',
        'Zehnerpotenzen: <code>1e6</code> oder <code>10^6</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUMERISCH
  numerical: {
    title: '<svg class="hs-ico"><use href="#ico-type-numeric"></use></svg> Arithmetik (Numerisch) — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler gibt einen <b>numerischen Wert</b> ein. STACK vergleicht ihn mit einem Zielwert unter Berücksichtigung einer Toleranz.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Zielwert</b>: die richtige Antwort (Punkt für Dezimalzahlen).',
        '<b>Auto-Rundung</b>: wenn „Ja“, stellen Sie die Anzahl der beibehaltenen <b>signifikanten Stellen</b> ein.',
        '<b>Toleranztyp</b>: <i>Relativ</i> (% des Wertes) oder <i>Absolut</i> (fester Abstand).',
        '<b>Fehlertoleranz</b>: z. B. <code>0.05</code> = 5 % relativ.',
        '<b>Float erlaubt</b>: Zahlen mit Komma akzeptieren oder nicht.'
      ])) +
      _hSection('Tipp',
        '<p>Für eine physikalische Messung bevorzugen Sie die <b>relative</b> Toleranz (z. B. 2 %), um vernünftige Rundungen zu akzeptieren.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── EINHEIT
  units: {
    title: '<svg class="hs-ico"><use href="#ico-type-units"></use></svg> Einheit — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler muss einen <b>Wert UND seine Einheit</b> angeben (z. B. <code>9.81 m/s^2</code>). STACK prüft die Zahl (relative Toleranz) und die physikalische Einheit.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Numerischer Wert</b> + <b>Maxima-Einheit</b> (Syntax: <code>m/s^2</code>, <code>N</code>, <code>Pa</code>, <code>J/(kg*K)</code>…).',
        '<b>Relative Toleranz</b> (z. B. 0.05 = 5 %) und <b>minimale signifikante Stellen</b>.',
        'Tab <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Schülerhilfe</b>: zeigt die Liste der üblichen Einheiten und Schreibregeln an.'
      ])) +
      _hSection('Schreibweise der Einheiten', _hList([
        'Verbinden Sie Zahl und Einheit mit <code>*</code> auf der Schülerseite (z. B. <code>10*m</code>).',
        'Zusammengesetzte Einheiten: <code>J/(kg*K)</code> oder <code>J*kg^(-1)*K^(-1)</code>.',
        'Üblich: <code>m, kg, g, N, J, W, Pa, V, A, Ohm, s, h, K, degC</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STRING
  string: {
    title: '<svg class="hs-ico"><use href="#ico-type-string"></use></svg> Textantwort (String) — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler tippt ein <b>Wort oder einen kurzen Ausdruck</b> (z. B. „Newton“). Der Vergleich ist textbasiert.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Erwartete Antwort</b>: der exakt korrekte Text.',
        '<b>Größe des Feldes</b>: Breite des Eingabefelds.',
        '<b>Toleranz</b>: <i>StringSloppy</i> (ignoriert Groß-/Kleinschreibung/Leerzeichen — empfohlen) oder <i>String</i> (absolute Genauigkeit).',
        'Option <b><svg class="hs-ico"><use href="#ico-tool-palette"></use></svg> Eingabehilfe</b>: fügen Sie Button-Paletten hinzu (Brüche, Operatoren, griechische Buchstaben…), um dem Schüler zu helfen.'
      ])) +
      _hSection('Fallstrick',
        '<p>Der strenge Modus lehnt den kleinsten Unterschied in Groß-/Kleinschreibung oder Akzenten ab. Im Zweifelsfall verwenden Sie <b>StringSloppy</b>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ZUORDNEN (MATCHING)
  match: {
    title: '<svg class="hs-ico"><use href="#ico-type-match"></use></svg> Zuordnen (Matching) — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler verbindet die Elemente der <b>Spalte A</b> mit denen der <b>Spalte B</b>.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die Anweisung.',
        'Fügen Sie die Elemente beider Spalten mit <b>+ Hinzufügen</b> hinzu (jedes Element akzeptiert Text, LaTeX, Bild).',
        'In <b>„Erwartete Verbindungen erstellen“</b>: klicken Sie auf ein Element <b>links</b> und dann auf sein Gegenstück <b>rechts</b>, um das korrekte Paar zu erstellen.',
        'Die erstellten Verbindungen erscheinen unten; „<svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Alles löschen“ setzt zurück.'
      ])) +
      _hSection('Gut zu wissen',
        '<p>Die interaktive Anzeige (zu ziehende Linien) erscheint nur in Moodle, während des Versuchs des Schülers.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KREUZWORTRÄTSEL
  crossword: {
    title: '<svg class="hs-ico"><use href="#ico-type-crossword"></use></svg> Kreuzworträtsel — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Generiert ein Kreuzworträtsel aus einer Liste von <b>Wörtern + Definitionen</b>.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Zu verwendende Wörter</b>: leer lassen, um alle zu nehmen, oder eine Zahl angeben, um eine zufällige Teilmenge zu ziehen.',
        'Fügen Sie jeden Eintrag mit <b>+ Wort hinzufügen</b> hinzu: das <b>Wort</b> (die Antwort) und seine <b>Definition</b> (der Hinweis).',
        'Klicken Sie auf <b>Raster generieren</b>, um die Anordnung vor dem Absenden zu überprüfen.'
      ])) +
      _hSection('Tipps', _hList([
        'Bevorzugen Sie Wörter, die Buchstaben teilen: das Raster wird kompakter.',
        'Vermeiden Sie Leerzeichen und Sonderzeichen in den Wörtern.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DOI
  doi: {
    title: '<svg class="hs-ico"><use href="#ico-type-doi"></use></svg> Objekt-Wechselwirkungs-Diagramm — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler identifiziert die Objekte, die mit einem <b>zentralen Studienobjekt</b> wechselwirken (physikalisches System).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Studienobjekt</b>: das System in der Mitte (z. B. „Skifahrer“).',
        '<b>Objekte und Wechselwirkungen</b>: fügen Sie jedes externe Objekt und die erwartete Art der Wechselwirkung hinzu.',
        '<b>Leere blaue Zonen (zusätzliche)</b>: fügt Platzhalter-Positionen hinzu, um nicht die genaue Anzahl der Wechselwirkungen preiszugeben.',
        'Die Vorschau (Canvas) zeigt das Diagramm so an, wie es generiert wird.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CHEMISCHE GLEICHUNG
  chemical: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemistry"></use></svg> Chemische Gleichung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler schreibt/balanciert eine <b>chemische Gleichung</b>. Das System überprüft die Balance.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b> (optional): die Anweisung.',
        'Geben Sie die Modellgleichung im Editor ein. Symbolleiste: <b>Index</b> (x₂), <b>Exponent</b> (xⁿ), Pfeile <b>→</b>, <b>⇌</b>, <b>↔</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Vorschau aktualisieren</b>, um das Ergebnis zu visualisieren.',
        '<b>Reaktionstyp</b> und <b>erwartete funktionelle Gruppe</b> präzisieren die Korrektur.'
      ])) +
      _hSection('Tipp',
        '<p>Geben Sie die Koeffizienten an (z. B. <code>2 O₂</code>): die Balancierung hängt davon ab.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── TOPOLOGISCHE CHEMIE
  chemical_topo: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemical_topo"></use></svg> Topologische Chemie — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Reaktionen mit <b>topologischen Strukturen</b> (SMILES-Notation oder Formel). Ermöglicht das Zeichnen von Molekülen.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die Anweisung.',
        '<b>Gleichung</b>: tippen Sie in SMILES/Formel oder klicken Sie auf <b><svg class="hs-ico"><use href="#ico-tool-structure"></use></svg> Zeichnen (JSME)</b>, um sie visuell zu erstellen.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Aktualisieren</b> zeigt die Vorschau der Reaktion.'
      ])) +
      _hSection('Scoring PRT (Fortgeschritten)', _hList([
        'Die Punktverteilung teilt sich auf mehrere Kriterien auf: Pfeil (PRT1), Atome (N0), Ladungen (N1), Formeln (N2), Koeffizienten (N4).',
        'Die Summe <b>PRT1 + N0 + N1 + N2 + N4 muss 100 % ergeben</b> (die Knoten 3 und 5 sind Ersatzknoten).',
        'Der Banner zeigt „Summe = 100 %“, wenn die Verteilung korrekt ist.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── KERNPHYSIK
  nuclear: {
    title: '<svg class="hs-ico"><use href="#ico-type-nuclear"></use></svg> Kernreaktionen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler vervollständigt/schreibt eine <b>Kernreaktion</b> mit der Isotopennotation.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die Anweisung.',
        'Erstellen Sie die Reaktion mit der Symbolleiste: <b>Isotop</b> <code>{}^{A}_{Z}X</code>, Operatoren <b>+</b> und <b>→</b>, Teilchen <b>α</b>, <b>β⁻</b>, <b>β⁺</b>, <b>γ</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Vorschau</b> um das Ergebnis zu überprüfen, <b><svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Leeren</b> um neu zu beginnen.'
      ])) +
      _hSection('Tipp',
        '<p>Überprüfen Sie die Erhaltung: die Summe der Massenzahlen (A) und Ordnungszahlen (Z) muss auf jeder Seite des Pfeils identisch sein.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── FREIE ERSTELLUNG
  composition: {
    title: '<svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Freie Erstellung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Frage mit <b>freier Textantwort</b> (Text, Formeln, Formatierung). <b>Nicht automatisch korrigiert</b>: der Lehrer bewertet in Moodle.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: die gestellte Frage (Bilder, LaTeX, Tabellen möglich).',
        '<b>Punktzahl</b>: informiert den Schüler über das Gewicht der Frage.',
        '<b>Größe des Studenten-Editors</b>: je nach erwarteter Antwortlänge.',
        '<b>Nachricht unter dem Editor</b>: für den Schüler angezeigte Anweisung.'
      ])) +
      _hSection('Erinnerung',
        '<p>STACK bewertet diese Frage nicht: planen Sie die manuelle Korrektur ein.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── UNGLEICHUNGEN
  inequation: {
    title: '<svg class="hs-ico"><use href="#ico-type-inequation"></use></svg> Ungleichungen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler löst eine <b>Ungleichung</b> (linear, quadratisches Polynom oder Betragsfunktion) und gibt die <b>Lösungsmenge</b> in der STACK-Intervallnotation ein. AlgEquiv prüft die Äquivalenz.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein häufiges Beispiel.',
        '<b>Typ</b>: linear <code>ax+b ▷ 0</code>, Polynom <code>ax²+bx+c ▷ 0</code>, Betragsfunktion <code>|ax+b| ▷ c</code>.',
        '<b>Operator</b>: >, ≥, &lt;, ≤.',
        '<b>Koeffizienten a, b, c</b> je nach gewähltem Typ.',
        '<b>Lösungsmenge</b>: in den meisten Fällen automatisch berechnet; korrigieren Sie, wenn die Vorschau unzureichend ist.',
        '<b>Anweisung</b>: über „✏️ Editor“.',
        '<b>Feedback</b> korrekt / inkorrekt.'
      ])) +
      _hSection('STACK-Intervallnotation', _hList([
        '<code>oo(a,b)</code> = ]a ; b[ (beide Seiten offen).',
        '<code>oc(a,b)</code> = ]a ; b] (rechts geschlossen).',
        '<code>co(a,b)</code> = [a ; b[ (links geschlossen).',
        '<code>cc(a,b)</code> = [a ; b] (beide Seiten geschlossen).',
        '<code>union(A,B)</code> = A ∪ B (für zwei disjunkte Intervalle).',
        '<code>inf</code> = +∞, <code>-inf</code> = −∞.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BASIS N
  basen: {
    title: '<svg class="hs-ico"><use href="#ico-type-basen"></use></svg> Basis-N-Konvertierung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler <b>konvertiert eine Zahl</b> zwischen verschiedenen Basen (Binär, Oktal, Dezimal, Hexadezimal). STACK prüft die algebraische Gleichheit der Antwort.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein häufiges Beispiel, um die Felder automatisch auszufüllen.',
        '<b>Fragetyp</b>: direkte Konvertierung, Wert eines Bits, Darstellung in der Zielbasis.',
        '<b>Quellzahl</b> + <b>Quellbasis</b> (z. B.: 1010 in Basis 2).',
        '<b>Zielbasis</b>: die Basis, in die der Schüler konvertieren muss.',
        '<b>Die Vorschau</b> berechnet automatisch die korrekte Antwort.'
      ])) +
      _hSection('Tipp',
        '<p>Hexadezimal: die Buchstaben A–F stehen für 10–15. Überprüfen Sie, ob der Schüler weiß, dass er je nach Frage in Dezimal- oder Hexa-Notation antworten kann.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ELEKTRISCHE STROMKREISE
  circuit: {
    title: '<svg class="hs-ico"><use href="#ico-type-circuit"></use></svg> Elektrische Stromkreise — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Gesetze der elektrischen Stromkreise: <b>Ohmsches Gesetz</b>, <b>Reihe / Parallel</b>-Schaltungen, Stromstärke, Leistung. Die numerische Antwort wird von STACK geprüft (NumRelative, 1 %).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein typisches Schaltungsszenario.',
        '<b>Fragetyp</b>: Ohmsches Gesetz, Reihen-/Parallelwiderstand, Stromstärke, Leistung…',
        '<b>Parameter</b>: geben Sie U (V), I (A), R (Ω), P (W) gemäß Szenario ein.',
        '<b>Die Vorschau</b> zeigt die Formel und das erwartete Ergebnis.',
        '<b>Anweisung</b> (optional): passen Sie die Aufgabenstellung über den Editor an.'
      ])) +
      _hSection('Tipp',
        '<p>Die Toleranz beträgt 1 %: ein auf 2 Dezimalstellen gerundetes Ergebnis wird akzeptiert.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── BOOLESCHE LOGIK
  logique: {
    title: '<svg class="hs-ico"><use href="#ico-type-logique"></use></svg> Boolesche Logik — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zu <b>Wahrheitstabellen</b>, der <b>Vereinfachung</b> von Ausdrücken und <b>logischen Äquivalenzen</b>. STACK verwendet PropLogic zur Überprüfung.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie einen Operator oder ein typisches Gesetz (De Morgan, XOR…).',
        '<b>Fragetyp</b>: Wahrheitstabelle (eine Zelle), Vereinfachung, Äquivalenz.',
        '<b>Boolescher Ausdruck</b>: Notation <code>A and B</code>, <code>not A</code>, <code>A xor B</code>, <code>A implies B</code>.',
        '<b>Die Vorschau</b> zeigt die vollständige Wahrheitstabelle und den erwarteten Wert.'
      ])) +
      _hSection('Tipp',
        '<p>Für eine Tabellenfrage: wählen Sie eine bestimmte Zeile der Tabelle (Auswertung A=1, B=0 zum Beispiel). Die Antwort ist dann 0 oder 1.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KOMPLEXE ZAHLEN
  complexe: {
    title: '<svg class="hs-ico"><use href="#ico-type-complexe"></use></svg> Komplexe Zahlen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zur <b>algebraischen Form</b>, zum <b>Betrag</b>, zum <b>Argument</b> und zur <b>konjugiert Komplexen</b> einer komplexen Zahl. STACK prüft die algebraische Äquivalenz.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie einen typischen Vorgang.',
        '<b>Reeller Teil (a) und imaginärer Teil (b)</b> der Zahl z = a + bi.',
        '<b>Fragetyp</b>: algebraische Form, Betrag, Argument, konjugiert Komplexe, Summe/Produkt.',
        '<b>Die Vorschau</b> zeigt die Antwort in Maxima-Syntax.'
      ])) +
      _hSection('Maxima-Syntax', _hList([
        '<code>%i</code> steht für i (imaginäre Einheit).',
        '<code>abs(z)</code> ergibt den Betrag, <code>carg(z)</code> das Argument.',
        'Argument als Bruch von π: <code>%pi/4</code>, <code>3*%pi/4</code>…'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DIFFERENTIAL- UND INTEGRALRECHNUNG
  calcul: {
    title: '<svg class="hs-ico"><use href="#ico-type-calcul"></use></svg> Differential- und Integralrechnung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zu <b>Ableitungen</b>, <b>Stammfunktionen</b> und <b>bestimmten Integralen</b>. STACK verwendet <code>Diff</code> (Ableitung) oder <code>Antidiff</code> (Stammfunktion) oder <code>AlgEquiv</code> (numerischer Wert).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie eine typische Funktion (Polynom, sin, exp, ln…).',
        '<b>Fragetyp</b>: Ableitung, Stammfunktion, bestimmtes Integral, numerischer Wert.',
        '<b>Funktion f(x)</b>: Maxima-Syntax — z. B.: <code>x^3+2*x</code>, <code>sin(x)</code>, <code>exp(x)</code>.',
        '<b>Grenzen a, b</b>: für das bestimmte Integral ∫[a,b] f(x) dx.',
        '<b>Die Vorschau</b> zeigt die auf der Lehrerseite berechnete Antwort.'
      ])) +
      _hSection('Maxima-Syntax', _hList([
        'Ableitung: <code>diff(f,x)</code>, Stammfunktion: <code>integrate(f,x)</code>.',
        'Bestimmtes Integral: <code>integrate(f,x,a,b)</code>.',
        'Natürlicher Logarithmus: <code>log(x)</code> (nicht ln).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STATISTIK
  statistiques: {
    title: '<svg class="hs-ico"><use href="#ico-type-statistiques"></use></svg> Statistik — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Statistische Berechnungen einer Reihe: <b>Mittelwert</b>, <b>Median</b>, <b>Varianz</b>, <b>Standardabweichung</b>, <b>Quartile</b>, <b>Spannweite</b>. STACK prüft den numerischen Wert (AlgEquiv).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie einen typischen Datensatz.',
        '<b>Fragetyp</b>: Mittelwert, Median, Varianz, Standardabweichung, Q1, Q3, Spannweite, gewichteter Mittelwert.',
        '<b>Daten</b>: Liste der Werte, getrennt durch Kommas (z. B.: <code>3, 7, 2, 9, 5</code>).',
        '<b>Häufigkeiten</b>: für den gewichteten Mittelwert (gleiche Anzahl an Werten wie die Daten).',
        '<b>Die Vorschau</b> berechnet die erwartete Antwort.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATRIZEN
  matrices: {
    title: '<svg class="hs-ico"><use href="#ico-type-matrices"></use></svg> Matrizen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Berechnungen der <b>linearen Algebra</b>: Matrixmultiplikation, Determinante, Transposition, Spur. STACK akzeptiert die Notation <code>matrix([a,b],[c,d])</code>.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie eine Operation (Produkt, Determinante…).',
        '<b>Fragetyp</b>: Produkt A×B, Determinante, Transposition, Spur, Inverse.',
        '<b>Größe</b>: 2×2 oder 3×3.',
        '<b>Koeffizienten der Matrizen A und B</b>: geben Sie jeden Eintrag ein.',
        '<b>Die Vorschau</b> berechnet und zeigt die Ergebnismatrix in Maxima-Syntax an.'
      ])) +
      _hSection('Antwort-Syntax des Schülers',
        '<p>Der Schüler gibt ein: <code>matrix([1,2],[3,4])</code> für eine 2×2-Matrix.<br>Das Schlüsselwort <code>matrix</code> ist in STACK erlaubt (<code>allowwords</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GEOMETRIE
  geometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-geometrie"></use></svg> Analytische Geometrie — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zur <b>2D/3D-Geometrie</b>: Abstand, Mittelpunkt, Vektornorm, Skalarprodukt, Kollinearität. STACK prüft mit AlgEquiv (akzeptiert <code>sqrt(n)</code>).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein Beispiel (Abstand AB, Mittelpunkt, Vektor AB…).',
        '<b>Fragetyp</b>: Abstand, Mittelpunkt, Norm, Skalarprodukt, Kollinearität, 3D.',
        '<b>Koordinaten</b> der Punkte A, B, C (Felder x, y, z je nach Dimension).',
        '<b>Die Vorschau</b> zeigt den exakten Wert in Maxima-Syntax an.'
      ])) +
      _hSection('Tipp',
        '<p>Abstände werden mit <code>sqrt(n)</code> ausgedrückt, wenn sie nicht ganzzahlig sind. AlgEquiv erkennt <code>sqrt(25)=5</code>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ZAHLENFOLGEN
  suites: {
    title: '<svg class="hs-ico"><use href="#ico-type-suites"></use></svg> Zahlenfolgen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zu <b>arithmetischen</b> und <b>geometrischen Folgen</b>: allgemeines Glied, Summe der ersten n Glieder, Grenzwert. STACK prüft mit AlgEquiv.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie eine typische Folge.',
        '<b>Fragetyp</b>: Glied u(n), Summe S(n), Grenzwert, Art der Folge.',
        '<b>u₀ (erstes Glied)</b> und <b>r oder d (Ratio/Differenz)</b>.',
        '<b>Rang n</b> für Glieder und Summen (Ganzzahl ≥ 0).',
        '<b>Die Vorschau</b> berechnet und zeigt die erwartete Antwort an.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── WAHRSCHEINLICHKEITSRECHNUNG
  probabilites: {
    title: '<svg class="hs-ico"><use href="#ico-type-probabilites"></use></svg> Wahrscheinlichkeitsrechnung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zur <b>Wahrscheinlichkeitsrechnung</b>: Kombinationen, Binomialverteilung (P(X=k), E(X), Var(X)), bedingte Wahrscheinlichkeit, Vereinigung. STACK prüft mit AlgEquiv.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein wahrscheinlichkeitstheoretisches Szenario.',
        '<b>Fragetyp</b>: C(n,k), P(X=k), E(X), Var(X), P(A|B), P(A∪B).',
        '<b>Parameter</b>: n, k (Ganzzahlen) und p (Wahrscheinlichkeit, 0–1) gemäß Verteilung.',
        '<b>Wahrscheinlichkeiten P(A), P(B), P(A∩B)</b> für zusammengesetzte Ereignisse.',
        '<b>Die Vorschau</b> berechnet die exakte Antwort (als Bruch, wenn möglich).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── TRIGONOMETRIE
  trigonometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-trigonometrie"></use></svg> Trigonometrie — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zu <b>exakten Werten</b> (sin, cos, tan), <b>trigonometrischen Identitäten</b> und dem Lösen von <b>Gleichungen</b>. STACK erzwingt exakte Antworten (<code>forbidfloat</code>).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie einen typischen Winkel (π/6, π/4, π/3, π/2…).',
        '<b>Fragetyp</b>: exakter Wert von sin/cos/tan, Identität, trig. Gleichung.',
        '<b>Winkel θ</b>: in Maxima-Syntax — z. B.: <code>%pi/6</code>, <code>%pi/4</code>, <code>2*%pi/3</code>.',
        '<b>Die Vorschau</b> zeigt den exakten Wert und seine Maxima-Entsprechung an.'
      ])) +
      _hSection('Tipp',
        '<p>Gleitkommazahlen sind <b>verboten</b>: der Schüler muss in Brüchen oder Radikalen antworten (<code>sqrt(3)/2</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── POLYNOME
  polynomes: {
    title: '<svg class="hs-ico"><use href="#ico-type-polynomes"></use></svg> Polynome 2. Grades — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zum <b>Polynom ax²+bx+c</b>: Diskriminante, Nullstellen, Vietasche Formeln, Anzahl der reellen Nullstellen. STACK prüft mit AlgEquiv.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein typisches Polynom.',
        '<b>Fragetyp</b>: Diskriminante Δ, Nullstellen x₁/x₂, Summe x₁+x₂, Produkt x₁×x₂, Anzahl der Nullstellen.',
        '<b>Koeffizienten a, b, c</b> des Polynoms (Ganzzahlen oder Dezimalzahlen).',
        '<b>Die Vorschau</b> berechnet Δ und die Nullstellen in Echtzeit.'
      ])) +
      _hSection('Vietasche Formeln',
        '<p>x₁+x₂ = −b/a und x₁×x₂ = c/a (ohne die Nullstellen explizit zu berechnen).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GRENZWERTE
  limites: {
    title: '<svg class="hs-ico"><use href="#ico-type-limites"></use></svg> Grenzwerte von Funktionen — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Fragen zu <b>Grenzwerten</b>: im Unendlichen, an einem Punkt, unbestimmte Formen. STACK prüft mit AlgEquiv. <b>Die erwartete Antwort wird vom Lehrer manuell eingegeben</b>.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie eine Funktion und einen typischen Punkt.',
        '<b>Art des Grenzwerts</b>: x→+∞, x→−∞, x→a (endlich), x→a⁺.',
        '<b>Ausdruck f(x)</b>: Maxima-Syntax — z. B.: <code>(x^2-1)/(x-1)</code>, <code>sin(x)/x</code>.',
        '<b>Erwartete Antwort</b>: explizit eingeben (<code>inf</code>, <code>-inf</code>, <code>2</code>, <code>%pi</code>…).',
        '<b>Die Vorschau</b> zeigt die Formel ohne sie automatisch zu berechnen.'
      ])) +
      _hSection('Spezielle Maxima-Werte', _hList([
        '<code>inf</code> → +∞, <code>minf</code> → −∞.',
        '<code>%pi</code> → π, <code>1/2</code> → ½.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PHYSIK
  physique: {
    title: '<svg class="hs-ico"><use href="#ico-type-physique"></use></svg> Physik — Mechanik — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Berechnungen der <b>klassischen Mechanik</b>: MRUA, freier Fall, kinetische/potentielle Energie, Erhaltung der mechanischen Energie, 2. Newtonsches Gesetz. Numerische Antwort geprüft mit 1 % Toleranz (NumRelative).</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Voreinstellung</b>: wählen Sie ein typisches physikalisches Szenario.',
        '<b>Fragetyp</b>: v(t), x(t), Höhe h, Zeit t, Ek = ½mv², Ep = mgh, v Endgeschwindigkeit (Em erhalten), F = ma.',
        '<b>Kinematische Parameter</b>: v₀ (m/s), a (m/s²), t (s).',
        '<b>Mechanische Parameter</b>: m (kg), h oder v (m oder m/s).',
        '<b>Die Vorschau</b> zeigt die Formel und das numerische Ergebnis an.'
      ])) +
      _hSection('Tipp',
        '<p>g = 9.81 m/s² ist fest codiert. Für Aufgaben zum freien Fall sind nur t und h relevant; nicht verwendete Felder werden automatisch ausgeblendet.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── OSZILLOSKOP
  oscilloscope: {
    title: '<svg class="hs-ico"><use href="#ico-type-oscilloscope"></use></svg> Oszilloskop — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Simulation eines <b>interaktiven Oszilloskops</b>: der Schüler stellt die Zeitbasis (Δt, violett) und die Empfindlichkeit (ΔV, rot) mit Schiebereglern ein und misst dann eine physikalische Größe (Periode, Frequenz, RC-Zeitkonstante, Verzögerung…) auf dem Oszillogramm.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Art der Messung</b>: Periode/Frequenz, RC-Ladung, RC-Entladung oder Verzögerung zwischen 2 Kanälen (Ultraschall).',
        '<b>Pädagogischer Modus</b>: <b>Geführt</b> beschreibt jeden Schritt (Einheit, Wert, Verwechslungsfallen); <b>Autonom</b> prüft jede Größe mit generischem Feedback; <b>Experte</b> gibt keinen Hinweis, nur das Ergebnis zählt. Diese Einstellung ändert nicht die Schwierigkeit des Oszillogramms, nur den Detailgrad der Feedbacks.',
        'Je nach gewähltem Typ erscheinen spezifische Parameter: Signalform und Frequenz (fest oder zufällig) für Periode/Frequenz; E und τ für RC-Ladung/-Entladung; Träger-/Burstfrequenzen und Δt Min-Max für Verzögerung.',
        '<b>Erst-Einstellungen des Oszillos</b> (Zeitbasis SH, Empfindlichkeit SV): aktivieren Sie <b>Auto</b> für eine automatische Kalibrierung passend zum Signal, oder deaktivieren Sie es, um manuell einen Wert aus der Liste zu wählen.'
      ])) +
      _hSection('Tipp',
        '<p>Der geführte Modus wird für die erste Verwendung im Unterricht empfohlen: er weist explizit auf Verwechslungsfallen hin (z. B. Halbperiode mit Periode verwechseln). Wechseln Sie zu Experte für eine summative Bewertung.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INTERFERENZ-BEUGUNG
  diffraction: {
    title: '<svg class="hs-ico"><use href="#ico-type-diffraction"></use></svg> Interferenz-Beugung — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler beobachtet ein <b>Beugungs-/Interferenzmuster</b> (Einzelspalt, Doppelspalt, Youngsche Löcher, kreisförmige Öffnung, quadratische Öffnung) und leitet daraus eine physikalische Größe (Spaltbreite, Wellenlänge…) durch Messungen am Muster ab.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Typ</b>: Form der Öffnung (Einzelspalt, Doppelspalt, Youngsche Löcher, kreisförmige Öffnung, quadratische Öffnung).',
        '<b>Modus</b>: <b>Bildschirm</b> (der Schüler misst direkt am projizierten Muster) oder <b>Sensor</b> (Muster begleitet von einer Lichtintensitätskurve).',
        '<b>Zufällige Parameter (a, D, b)</b>: aktivieren für eine Zufallsauswahl bei jeder Frage, oder deaktivieren um die Spaltbreite a, den Bildschirmabstand D, den Lochabstand b und die Wellenlänge λ manuell festzulegen.',
        '<b>Relative Toleranz (%)</b>: akzeptierter Fehlerbereich bei der numerischen Antwort (z. B. 10 % akzeptiert 632 nm bei einem erwarteten Wert von 635 nm).',
        '<b>Anweisung</b>: formulieren Sie die Frage an den Schüler, z. B. „Messen Sie den Abstand mit dem Fadenkreuz und leiten Sie λ ab.“'
      ])) +
      _hSection('Tipp',
        '<p>Das Feld Abstand b erscheint nur für Muster mit zwei Öffnungen (Doppelspalt, Youngsche Löcher) — es wird automatisch ausgeblendet für Einzelspalt/kreisförmige Öffnung/quadratische Öffnung.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── SORTIEREN
  ord: {
    title: '<svg class="hs-ico"><use href="#ico-type-ord"></use></svg> Sortieren — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler <bringt Elemente per Drag & Drop in die richtige Reihenfolge</b> (Parsons-Blöcke von STACK). Ideal für Algorithmen, Chronologien, Argumentationsschritte oder Code-Sequenzen.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Aufgabenstellung</b>: formulieren Sie die Anweisung (HTML/LaTeX akzeptiert).',
        '<b>＋ Element hinzufügen</b>: jede Zeile ist ein Element der zu sortierenden Sequenz. Die Eingabereihenfolge ist die korrekte Reihenfolge.',
        '<b>Wiederverwendbare Elemente (Klon)</b>: aktivieren, wenn dasselbe Element mehrmals in der Antwort erscheinen kann.',
        'Die Elemente werden dem Schüler in einer <b>zufällig gemischten Reihenfolge</b> von STACK präsentiert.'
      ])) +
      _hSection('Tipp',
        '<p>Formulieren Sie jedes Element eigenständig und eindeutig. Vermeiden Sie Formulierungen wie „dann…“ oder „anschließend…“, die die Reihenfolge verraten.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KLICKBARES BILD
  imgclick: {
    title: '<svg class="hs-ico"><use href="#ico-type-imgclick"></use></svg> Auswahl auf Bild — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler <b>klickt auf die richtige Zone eines Bildes</b> (SVT-Diagramm, Landkarte, physikalisches Diagramm…). Die Antwortzone bleibt für den Schüler <b>unsichtbar</b>.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Bild-URL</b>: direkter Link zum Bild (muss von Moodle aus erreichbar sein).',
        '<b>Breite / Höhe</b>: Anzeigemaße in Pixeln (das Bild wird skaliert).',
        '<b>Anweisung</b>: für den Schüler angezeigter Hinweis, z. B. „Klicken Sie auf den linken Ventrikel“.',
        '<b>Korrekte Zone — Kreis</b>: X Mitte, Y Mitte, Radius (alle in % der Breite/Höhe).',
        '<b>Korrekte Zone — Rechteck</b>: X links, Y oben, X rechts, Y unten (in %).',
        '<b>Zonenbezeichnung</b>: im Feedback verwendeter Text, z. B. „linker Ventrikel“.'
      ])) +
      _hSection('Koordinaten in %',
        '<p>0 % = linker (oder oberer) Rand, 100 % = rechter (oder unterer) Rand. Ein zentrierter Kreis mit Radius 10 %: X=50, Y=50, R=10.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── JSXGRAPH DRAG & DROP
  jxgdrop: {
    title: '<svg class="hs-ico"><use href="#ico-type-jxgdrop"></use></svg> JSXGraph Drag & Drop — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler <b>zieht Beschriftungen (Optionen) auf ein Bild</b>, um sie in definierten Zonen abzulegen (beschriftetes Diagramm, Karte, experimenteller Aufbau…). Stackforge generiert automatisch den responsiven JSXGraph-Code und die Korrektur.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Hintergrundbild</b>: laden Sie ein Bild (PNG/JPG) hoch — es dient als visuelle Unterlage für Zonen und Optionen.',
        '<b>Optionen</b>: klicken Sie auf <b>＋ Option hinzufügen</b> für jedes Label, das der Schüler ablegen kann.',
        '<b>Drop-Zonen</b>: Werkzeuge <b>Kreis</b>/<b>Rechteck</b>, um eine Zone auf dem Bild zu platzieren (Klick auf das Bild), <b>Auswählen</b>, um eine bestehende Zone anzupassen (Mitte/Radius oder Position/Abmessungen im rechten Panel).',
        'Für jede ausgewählte Zone aktivieren Sie in <b>Akzeptierte Antworten</b> die Option(en), die für diese Zone als korrekt gelten.',
        '<b>Sichtbare Drop-Zonen</b>: deaktivieren Sie dies, um die Umrisse der Zonen für den Schüler auszublenden (unsichtbare Zone, schwieriger) — die Zonen bleiben für die Korrektur aktiv, nur die Anzeige ändert sich.'
      ])) +
      _hSection('Tipp',
        '<p>Dieselbe Option kann in mehreren Zonen akzeptiert werden, wenn die Frage dies erfordert. Testen Sie das Drag & Drop in der Vorschau vor dem Exportieren — die Validierung wird nach dem Ablegen fixiert, wie bei einem echten Moodle-Test.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RGB / CMYK
  rvbcmj: {
    title: '<svg class="hs-ico"><use href="#ico-type-rvbcmj"></use></svg> RGB / CMYK — Hilfe',
    body:
      _hSection('Wofür ist das?',
        '<p>Der Schüler <b>identifiziert die Farbe eines Objekts</b>, indem er sein Bild durch verschiedene <b>Farbfilter</b> betrachtet (Rot-Grün-Blau oder Cyan-Magenta-Gelb). Verwendung in Optik und Kunstunterricht.</p>') +
      _hSection('Wie wird es ausgefüllt?', _hList([
        '<b>Filtertyp</b>: RGB (additive Farbmischung) oder CMY (subtraktive Farbmischung).',
        '<b>S&W-Darstellung</b>: zeigt das Bild vor dem Filtern in Graustufen an (realistischer).',
        '<b>Bild des Objekts</b>: importieren Sie ein PNG/JPG-Bild — es wird im XML als Base64 codiert.',
        '<b>Korrekte Farbe</b>: wählen Sie die tatsächliche Farbe des Objekts (Rot, Grün, Blau, Gelb, Cyan, Magenta, Weiß, Schwarz).',
        '<b>Filtervorschau</b>: überprüfen Sie das Aussehen des Bildes durch jeden Filter vor dem Exportieren.'
      ])) +
      _hSection('Didaktisches Prinzip',
        '<p>Bei RGB: ein roter Filter lässt nur die rote Komponente durch — ein grünes Objekt erscheint durch einen roten Filter dunkel. Bei CMY: ein Cyan-Filter absorbiert Rot und lässt Grün und Blau durch.</p>') + _HELP_COMMON
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.de = HELP_CONTENT;
})();
}