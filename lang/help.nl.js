/*
 * StackForge — générateur de questions STACK pour Moodle
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
   STACKFORGE — HULP-INHOUD: NEDERLANDS
   Alleen gegevens (geen logica). Om een hulptaal toe te voegen,
   kopieer dit bestand (bijv. help.en.js), vertaal de teksten
   en sluit af met: window.HELP_LANG.en = HELP_CONTENT;
   ════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
function _hSection(title, html){ return `<h3 class="help-h">${title}</h3>${html}`; }
function _hList(items){ return '<ul class="help-ul">'+items.map(i=>`<li>${i}</li>`).join('')+'</ul>'; }

// Algemene herinnering weergegeven onderaan elke hulp (elementen gedeeld door alle modules).
const _HELP_COMMON = `
  <div class="help-common">
    <strong>Algemene herinneringen voor alle modules</strong>
    ${_hList([
      'Knop <b><svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Editor</b>: opent de rich-text editor (vet, kleuren, lijsten, afbeeldingen, geluiden, tabellen, links).',
      'Om een formule in te voegen, klik op <b>∑ LaTeX</b> in de editor. In ruwe syntax: <code>$ ... $</code> inline, <code>$$ ... $$</code> gecentreerd (bijv.&nbsp;: <code>$\\frac{1}{2}$</code>).',
      '<b><svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> AI-Prompt</b> (indien aanwezig): genereert een tekst om te kopiëren naar een AI om automatisch de inhoud van de vraag te produceren.',
      '<b><svg class="hs-ico"><use href="#ico-file-import"></use></svg> / <svg class="hs-ico"><use href="#ico-file-export"></use></svg> JSON</b> (indien aanwezig): importeer of exporteer de configuratie van de vraag om deze te hergebruiken.'
    ])}
  </div>`;

const HELP_CONTENT = {

  // ───────────────────────────────────────── SELECTIEVAKJES
  checkbox: {
    title: '<svg class="hs-ico"><use href="#ico-type-checkbox"></use></svg> Selectievakjes — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Meerkeuzevraag met <b>meerdere antwoorden</b>: de student kan meerdere vakjes aanvinken. De punten worden <b>automatisch gedeeltelijk</b> toegekend (elk goed/fout vakje telt mee).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de instructie (bijv. « Vink alle juiste proposities aan »).',
        '<b>Totaal aantal opties</b>: hoeveel vakjes zichtbaar zijn voor de student.',
        '<b>Aantal juiste antwoorden</b>: <i>Vast</i> (altijd hetzelfde aantal juiste) of <i>Willekeurig</i>.',
        'Voeg uw opties toe met <b>✅ + WAAR</b> en <b>❌ + ONWAAR</b>. Voor elke: een <b>Text</b> (de weergegeven tekst) en een <b>Feedback</b> (uitleg).'
      ])) +
      _hSection('Tips / valkuilen', _hList([
        'Zet <b>meer opties</b> in de lijsten dan het weergegeven aantal: het systeem trekt er willekeurig uit bij elke poging → elke student ziet een variant.',
        'Controleer de oranje waarschuwing: deze geeft een onvoldoende pool aan voor de gevraagde trekking.',
        'De tekst accepteert LaTeX (<code>$...$</code>) en opmaak.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── KEUZERONDJES
  radio: {
    title: '<svg class="hs-ico"><use href="#ico-type-radio"></use></svg> Keuzerondjes — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Meerkeuzevraag met <b>enkel antwoord</b>: één juist antwoord, gepresenteerd in de vorm van keuzerondjes.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de instructie.',
        '<b>Totaal aantal weergegeven knoppen</b>: 1 juist antwoord + afleiders.',
        'Vul de <b>Pool WAAR</b> (juiste antwoorden) en de <b>Pool ONWAAR</b> (afleiders) in.'
      ])) +
      _hSection('Werking van de trekking', _hList([
        '1 juist antwoord wordt <b>willekeurig</b> getrokken uit de pool WAAR.',
        'De andere knoppen zijn afleiders getrokken uit de pool ONWAAR.',
        'Er is minimaal <b>1 WAAR</b> en <b>(aantal weergegeven − 1) ONWAAR</b> nodig.'
      ])) +
      _hSection('Tip',
        '<p>Meerdere mogelijke juiste antwoorden in de pool WAAR? Het systeem kiest er één per poging: ideaal om de vragen te variëren.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── DROPDOWN-MENU
  dropdown: {
    title: '<svg class="hs-ico"><use href="#ico-type-dropdown"></use></svg> Dropdown-menu — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Identiek aan het keuzerondje (enkel juist antwoord), maar gepresenteerd als een <b>dropdownlijst</b>. Handig om een antwoord in het midden van een zin in te voegen.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b> + <b>Aantal weergegeven opties</b>.',
        '<b>Pool WAAR</b>: de juiste antwoord(en). <b>Pool ONWAAR</b>: de afleiders.',
        'Minimaal vereist: 1 WAAR en (totaal aantal − 1) ONWAAR.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ALGEBRAÏSCH
  algebraic: {
    title: '<svg class="hs-ico"><use href="#ico-type-algebraic"></use></svg> Algebraïsch — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student voert een <b>wiskundige expressie</b> in. STACK controleert de algebraïsche equivalentie (bijv. <code>2*x+y</code> = <code>y+2*x</code>), niet de exacte schrijfwijze.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Variabelen</b>: lijst ze op, gescheiden door komma\'s (bijv. <code>x, y</code>).',
        '<b>Verwacht antwoord</b>: de juiste formule. De knop <b><svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> Invoerhulp</b> opent een toetsenbord om deze foutloos te schrijven.',
        'Tabblad <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Studentenhulp</b>: vink de weer te geven instructies aan (decimaalteken, machten van 10…) en het virtuele toetsenbord.',
        'Tabblad <b>💡 Oplossing</b>: schrijf de gedetailleerde correctie.'
      ])) +
      _hSection('Te respecteren syntax', _hList([
        'Expliciete vermenigvuldiging: schrijf <code>2*x</code>, nooit <code>2x</code> (anders wordt « 2x » gelezen als één variabele).',
        'Machten met <code>^</code> (bijv. <code>x^2</code>), decimalen met een punt (bijv. <code>1.5</code>).',
        'Machten van 10: <code>1e6</code> of <code>10^6</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUMERIEK
  numerical: {
    title: '<svg class="hs-ico"><use href="#ico-type-numeric"></use></svg> Rekenen (Numeriek) — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student voert een <b>numerieke waarde</b> in. STACK vergelijkt deze met een doelwaarde met een tolerantie.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Doelwaarde</b>: het juiste antwoord (punt voor decimalen).',
        '<b>Auto-afronding</b>: als « Ja », stel het aantal behouden <b>significante cijfers</b> in.',
        '<b>Type tolerantie</b>: <i>Relatief</i> (% van de waarde) of <i>Absoluut</b> (vast verschil).',
        '<b>Foutmarge</b>: bijv. <code>0.05</code> = 5 % relatief.',
        '<b>Float toegestaan</b>: getallen met een komma accepteren of niet.'
      ])) +
      _hSection('Tip',
        '<p>Bij een natuurkundige meting geef je de voorkeur aan <b>relatieve</b> tolerantie (bijv. 2 %) om redelijke afrondingen te accepteren.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── EENHEID
  units: {
    title: '<svg class="hs-ico"><use href="#ico-type-units"></use></svg> Eenheid — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student moet een <b>waarde EN zijn eenheid</b> opgeven (bijv. <code>9.81 m/s^2</code>). STACK controleert het getal (relatieve tolerantie) en de fysische eenheid.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Numerieke waarde</b> + <b>Maxima-eenheid</b> (syntax: <code>m/s^2</code>, <code>N</code>, <code>Pa</code>, <code>J/(kg*K)</code>…).',
        '<b>Relatieve tolerantie</b> (bijv. 0.05 = 5 %) en <b>minimale significante cijfers</b>.',
        'Tabblad <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Studentenhulp</b>: toon de lijst met veelvoorkomende eenheden en de schrijfregels.'
      ])) +
      _hSection('Schrijfwijze van eenheden', _hList([
        'Verbind getal en eenheid met <code>*</code> aan de studentenkant (bijv. <code>10*m</code>).',
        'Samengestelde eenheden: <code>J/(kg*K)</code> of <code>J*kg^(-1)*K^(-1)</code>.',
        'Gebruikelijk: <code>m, kg, g, N, J, W, Pa, V, A, Ohm, s, h, K, degC</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STRING
  string: {
    title: '<svg class="hs-ico"><use href="#ico-type-string"></use></svg> Tekstantwoord (String) — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student typt een <b>woord of een korte expressie</b> (bijv. « Newton »). De vergelijking is tekstueel.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Verwacht antwoord</b>: de exact juiste tekst.',
        '<b>Grootte van het veld</b>: breedte van het invoerveld.',
        '<b>Tolerantie</b>: <i>StringSloppy</i> (negeert hoofdletters/spaties — aanbevolen) of <i>String</i> (absolute juistheid).',
        'Optie <b><svg class="hs-ico"><use href="#ico-tool-palette"></use></svg> Invoerhulp</b>: voeg knoppenpaletten toe (breuken, operatoren, Griekse letters…) om de student te helpen.'
      ])) +
      _hSection('Valkuil',
        '<p>De strikte modus wijst het kleinste verschil in hoofdletters of accenten af. Bij twijfel gebruik je <b>StringSloppy</b>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KOPPELEN (MATCHING)
  match: {
    title: '<svg class="hs-ico"><use href="#ico-type-match"></use></svg> Koppelen (Matching) — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student koppelt de elementen uit <b>kolom A</b> aan die uit <b>kolom B</b>.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de instructie.',
        'Voeg de elementen van de twee kolommen toe met <b>+ Toevoegen</b> (elk element accepteert tekst, LaTeX, afbeelding).',
        'In <b>« Maak de verwachte koppelingen »</b>: klik op een element <b>links</b> en vervolgens op zijn tegenhanger <b>rechts</b> om het juiste paar te maken.',
        'De gemaakte koppelingen verschijnen onderaan; « <svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Alles wissen » reset.'
      ])) +
      _hSection('Goed om te weten',
        '<p>De interactieve weergave (te trekken lijnen) verschijnt alleen in Moodle, tijdens de poging van de student.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KRUISWOORDPUZZEL
  crossword: {
    title: '<svg class="hs-ico"><use href="#ico-type-crossword"></use></svg> Kruiswoordpuzzel — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Genereert een kruiswoordpuzzel-grid op basis van een lijst met <b>woorden + definities</b>.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Te gebruiken woorden</b>: laat leeg om alles te pakken, of geef een aantal op om een willekeurige subset te trekken.',
        'Voeg elke invoer toe met <b>+ Woord toevoegen</b>: het <b>Woord</b> (het antwoord) en zijn <b>Definitie</b> (de hint).',
        'Klik op <b>Grid genereren</b> om de indeling te controleren voordat u valideert.'
      ])) +
      _hSection('Tips', _hList([
        'Geef de voorkeur aan woorden die letters delen: het grid wordt compacter.',
        'Vermijd spaties en speciale tekens in de woorden.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DOI
  doi: {
    title: '<svg class="hs-ico"><use href="#ico-type-doi"></use></svg> Object-interactiediagram — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student identificeert de objecten die interacteren met een <b>centraal studieobject</b> (fysisch systeem).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Studieobject</b>: het systeem in het midden (bijv. « Skiër »).',
        '<b>Objecten en Interacties</b>: voeg elk extern object toe en het verwachte interactietype.',
        '<b>Lege blauwe zones (extra)</b>: voegt lokatie-pleisters toe om niet het exacte aantal interacties weg te geven.',
        'Het voorbeeld (canvas) toont het diagram zoals het zal worden gegenereerd.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CHEMISCHE VERGELIJKING
  chemical: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemistry"></use></svg> Chemische vergelijking — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student schrijft/balanseert een <b>chemische vergelijking</b>. Het systeem controleert de balans.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b> (optioneel): de instructie.',
        'Voer de modelvergelijking in de editor in. Werkbalk: <b>index</b> (x₂), <b>exponent</b> (xⁿ), pijlen <b>→</b>, <b>⇌</b>, <b>↔</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Voorbeeld bijwerken</b> om het resultaat te visualiseren.',
        '<b>Type reactie</b> en <b>verwachte functionele groep</b> specificeren de correctie.'
      ])) +
      _hSection('Tip',
        '<p>Geef de coëfficiënten aan (bijv. <code>2 O₂</code>): de balans is hiervan afhankelijk.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── TOPOLOGISCHE SCHEIKUNDE
  chemical_topo: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemical_topo"></use></svg> Topologische scheikunde — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Reacties met <b>topologische structuren</b> (SMILES-notatie of formule). Maakt het tekenen van moleculen mogelijk.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de instructie.',
        '<b>Vergelijking</b>: typ in SMILES/formule, of klik op <b><svg class="hs-ico"><use href="#ico-tool-structure"></use></svg> Tekenen (JSME)</b> om deze visueel te bouwen.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Bijwerken</b> toont het voorbeeld van de reactie.'
      ])) +
      _hSection('Scoring PRT (geavanceerd)', _hList([
        'De puntverdeling wordt verdeeld over verschillende criteria: pijl (PRT1), atomen (N0), ladingen (N1), formules (N2), coëfficiënten (N4).',
        'De som <b>PRT1 + N0 + N1 + N2 + N4 moet 100 %</b> zijn (de knooppunten 3 en 5 zijn reserven).',
        'De banner toont « Som = 100 % » wanneer de verdeling correct is.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── KERNFYSICA
  nuclear: {
    title: '<svg class="hs-ico"><use href="#ico-type-nuclear"></use></svg> Kernreacties — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student voltooit/schrijft een <b>kernreactie</b> met de isotoopnotatie.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de instructie.',
        'Bouw de reactie op met de werkbalk: <b>isotoop</b> <code>{}^{A}_{Z}X</code>, operatoren <b>+</b> en <b>→</b>, deeltjes <b>α</b>, <b>β⁻</b>, <b>β⁺</b>, <b>γ</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Voorbeeld</b> om het resultaat te controleren, <b><svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Legen</b> om opnieuw te beginnen.'
      ])) +
      _hSection('Tip',
        '<p>Controleer het behoud: de som van de massagetallen (A) en atoomnummers (Z) moet aan elke kant van de pijl identiek zijn.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── VRIJE OPSTEL
  composition: {
    title: '<svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Vrije opstel — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vraag met een <b>vrij opgesteld antwoord</b> (tekst, formules, opmaak). <b>Niet automatisch gecorrigeerd</b>: de docent beoordeelt in Moodle.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: de gestelde vraag (afbeeldingen, LaTeX, tabellen mogelijk).',
        '<b>Waarde in punten</b>: informeert de student over het gewicht van de vraag.',
        '<b>Grootte van de studenteneditor</b>: afhankelijk van de verwachte antwoordlengte.',
        '<b>Bericht onder de editor</b>: instructie weergegeven aan de student.'
      ])) +
      _hSection('Herinnering',
        '<p>STACK evalueert deze vraag niet: voorzie handmatige correctie.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ONGELIJKHEDEN
  inequation: {
    title: '<svg class="hs-ico"><use href="#ico-type-inequation"></use></svg> Ongelijkheden — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student lost een <b>ongelijkheid</b> op (lineair, tweedegraads polynoom of absolute waarde) en voert de <b>oplossingsverzameling</b> in met de STACK-intervalnotatie. AlgEquiv controleert de equivalentie.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een veelvoorkomend voorbeeld.',
        '<b>Type</b>: lineair <code>ax+b ▷ 0</code>, polynoom <code>ax²+bx+c ▷ 0</code>, absolute waarde <code>|ax+b| ▷ c</code>.',
        '<b>Operator</b>: >, ≥, &lt;, ≤.',
        '<b>Coëfficiënten a, b, c</b> afhankelijk van het gekozen type.',
        '<b>Oplossingsverzameling</b>: auto-berekend in de meeste gevallen; corrigeer indien het voorbeeld onvoldoende is.',
        '<b>Instructie</b>: via « ✏️ Editor ».',
        '<b>Feedback</b> correct / incorrect.'
      ])) +
      _hSection('STACK-intervalnotatie', _hList([
        '<code>oo(a,b)</code> = ]a ; b[ (aan beide kanten open).',
        '<code>oc(a,b)</code> = ]a ; b] (rechts gesloten).',
        '<code>co(a,b)</code> = [a ; b[ (links gesloten).',
        '<code>cc(a,b)</code> = [a ; b] (aan beide kanten gesloten).',
        '<code>union(A,B)</code> = A ∪ B (voor twee disjuncte intervallen).',
        '<code>inf</code> = +∞, <code>-inf</code> = −∞.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── GRONDTAL N
  basen: {
    title: '<svg class="hs-ico"><use href="#ico-type-basen"></use></svg> Grondtal-N-conversie — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student <b>converteert een getal</b> tussen verschillende grondtallen (binair, octaal, decimaal, hexadecimaal). STACK controleert de algebraïsche gelijkheid van het antwoord.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een veelvoorkomend voorbeeld om de velden automatisch te vullen.',
        '<b>Vragentype</b>: directe conversie, waarde van een bit, representatie in doeldoel.',
        '<b>Brongetal</b> + <b>brongrondtal</b> (bijv.: 1010 in grondtal 2).',
        '<b>Doelgrondtal</b>: het grondtal waarnaar de student moet converteren.',
        '<b>Het voorbeeld</b> berekent automatisch het juiste antwoord.'
      ])) +
      _hSection('Tip',
        '<p>Hexadecimaal: de letters A–F vertegenwoordigen 10–15. Controleer of de student weet dat hij afhankelijk van de vraag in decimale of hexa-notatie kan antwoorden.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ELEKTRISCHE SCHAKELINGEN
  circuit: {
    title: '<svg class="hs-ico"><use href="#ico-type-circuit"></use></svg> Elektrische schakelingen — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Wetten van elektrische schakelingen: <b>wet van Ohm</b>, <b>serie / parallel</b>-schakelingen, stroomsterkte, vermogen. Het numerieke antwoord wordt gecontroleerd door STACK (NumRelative, 1 %).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typisch schakelingsscenario.',
        '<b>Vragentype</b>: wet van Ohm, serie/parallelweerstand, stroomsterkte, vermogen…',
        '<b>Parameters</b>: voer U (V), I (A), R (Ω), P (W) in volgens het scenario.',
        '<b>Het voorbeeld</b> toont de formule en het verwachte resultaat.',
        '<b>Instructie</b> (optioneel): pas de opdracht aan via de editor.'
      ])) +
      _hSection('Tip',
        '<p>De tolerantie is 1 %: een berekening afgerond op 2 decimalen wordt geaccepteerd.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── BOOLEAANSE LOGICA
  logique: {
    title: '<svg class="hs-ico"><use href="#ico-type-logique"></use></svg> Booleaanse logica — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>waarheidstabellen</b>, het <b>vereenvoudigen</b> van expressies en <b>logische equivalenties</b>. STACK gebruikt PropLogic voor de controle.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een operator of een typische wet (De Morgan, XOR…).',
        '<b>Vragentype</b>: waarheidstabel (één cel), vereenvoudiging, equivalentie.',
        '<b>Booleaanse expressie</b>: notatie <code>A and B</code>, <code>not A</code>, <code>A xor B</code>, <code>A implies B</code>.',
        '<b>Het voorbeeld</b> toont de volledige waarheidstabel en de verwachte waarde.'
      ])) +
      _hSection('Tip',
        '<p>Voor een tabelvraag: kies een specifieke rij van de tabel (waardering A=1, B=0 bijvoorbeeld). Het antwoord is dan 0 of 1.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── COMPLEXE GETALLEN
  complexe: {
    title: '<svg class="hs-ico"><use href="#ico-type-complexe"></use></svg> Complexe getallen — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over de <b>algebraïsche vorm</b>, de <b>modulus</b>, het <b>argument</b> en het <b>complex geconjugeerde</b> van een complex getal. STACK controleert de algebraïsche equivalentie.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typische bewerking.',
        '<b>Reëel deel (a) en imaginair deel (b)</b> van het getal z = a + bi.',
        '<b>Vragentype</b>: algebraïsche vorm, modulus, argument, geconjugeerde, som/product.',
        '<b>Het voorbeeld</b> toont het antwoord in Maxima-syntax.'
      ])) +
      _hSection('Maxima-syntax', _hList([
        '<code>%i</code> vertegenwoordigt i (imaginaire eenheid).',
        '<code>abs(z)</code> geeft de modulus, <code>carg(z)</code> het argument.',
        'Argument als breuk van π: <code>%pi/4</code>, <code>3*%pi/4</code>…'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DIFFERENTIAAL- EN INTEGRAALREKENING
  calcul: {
    title: '<svg class="hs-ico"><use href="#ico-type-calcul"></use></svg> Differentiaal- en integraalrekening — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>afgeleiden</b>, <b>primitieven</b> en <b>bepaalde integralen</b>. STACK gebruikt <code>Diff</code> (afgeleide) of <code>Antidiff</code> (primitief) of <code>AlgEquiv</code> (numerieke waarde).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typische functie (polynoom, sin, exp, ln…).',
        '<b>Vragentype</b>: afgeleide, primitief, bepaalde integraal, numerieke waarde.',
        '<b>Functie f(x)</b>: Maxima-syntax — bijv.: <code>x^3+2*x</code>, <code>sin(x)</code>, <code>exp(x)</code>.',
        '<b>Grenzen a, b</b>: voor de bepaalde integraal ∫[a,b] f(x) dx.',
        '<b>Het voorbeeld</b> toont de aan de docentzijde berekende answer.'
      ])) +
      _hSection('Maxima-syntax', _hList([
        'Afgeleide: <code>diff(f,x)</code>, Primitief: <code>integrate(f,x)</code>.',
        'Bepaalde integraal: <code>integrate(f,x,a,b)</code>.',
        'Natuurlijk logaritme: <code>log(x)</code> (niet ln).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STATISTIEK
  statistiques: {
    title: '<svg class="hs-ico"><use href="#ico-type-statistiques"></use></svg> Statistiek — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Statistische berekeningen over een reeks: <b>gemiddelde</b>, <b>mediaan</b>, <b>variantie</b>, <b>standaarddeviatie</b>, <b>kwartielen</b>, <b>bereik</b>. STACK controleert de numerieke waarde (AlgEquiv).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typische dataset.',
        '<b>Vragentype</b>: gemiddelde, mediaan, variantie, standaarddeviatie, Q1, Q3, bereik, gewogen gemiddelde.',
        '<b>Gegevens</b>: lijst van waarden, gescheiden door komma\'s (bijv.: <code>3, 7, 2, 9, 5</code>).',
        '<b>Frequenties</b>: voor het gewogen gemiddelde (evenveel waarden als de gegevens).',
        '<b>Het voorbeeld</b> berekent het verwachte antwoord.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATRICES
  matrices: {
    title: '<svg class="hs-ico"><use href="#ico-type-matrices"></use></svg> Matrices — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Berekeningen van <b>lineaire algebra</b>: matrixvermenigvuldiging, determinant, getransponeerde, spoortraject. STACK accepteert de notatie <code>matrix([a,b],[c,d])</code>.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een bewerking (product, determinant…).',
        '<b>Vragentype</b>: product A×B, determinant, getransponeerde, spoortraject, inverse.',
        '<b>Grootte</b>: 2×2 of 3×3.',
        '<b>Coëfficiënten van de matrices A en B</b>: voer elke invoer in.',
        '<b>Het voorbeeld</b> berekent en toont de resultaatmatrix in Maxima-syntax.'
      ])) +
      _hSection('Antwoord-syntax student',
        '<p>De student voert in: <code>matrix([1,2],[3,4])</code> voor een 2×2-matrix.<br>Het trefwoord <code>matrix</code> is toegestaan in STACK (<code>allowwords</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MEETKUNDE
  geometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-geometrie"></use></svg> Analytische meetkunde — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>2D / 3D-meetkunde</b>: afstand, middelpunt, vectornorm, inwendig product, collineariteit. STACK controleert met AlgEquiv (accepteert <code>sqrt(n)</code>).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een voorbeeld (afstand AB, middelpunt, vector AB…).',
        '<b>Vragentype</b>: afstand, middelpunt, norm, inwendig product, collineariteit, 3D.',
        '<b>Coördinaten</b> van de punten A, B, C (velden x, y, z afhankelijk van de dimensie).',
        '<b>Het voorbeeld</b> toont de exacte waarde in Maxima-syntax.'
      ])) +
      _hSection('Tip',
        '<p>Afstanden worden uitgedrukt met <code>sqrt(n)</code> wanneer ze niet geheel zijn. AlgEquiv herkent <code>sqrt(25)=5</code>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GETALLENRIJEN
  suites: {
    title: '<svg class="hs-ico"><use href="#ico-type-suites"></use></svg> Getallenrijen — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>aritmetische</b> en <b>meetkundige rijen</b>: algemeen term, som van de eerste n termen, limiet. STACK controleert met AlgEquiv.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typische rij.',
        '<b>Vragentype</b>: term u(n), som S(n), limiet, aard van de rij.',
        '<b>u₀ (eerste term)</b> en <b>r of d (rede/verschil)</b>.',
        '<b>Rang n</b> voor de termen en sommen (geheel getal ≥ 0).',
        '<b>Het voorbeeld</b> berekent en toont het verwachte antwoord.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── KANSENSREKENING
  probabilites: {
    title: '<svg class="hs-ico"><use href="#ico-type-probabilites"></use></svg> Kansrekening — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>kansrekening</b>: combinaties, binomiale verdeling (P(X=k), E(X), Var(X)), voorwaardelijke kans, unie. STACK controleert met AlgEquiv.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een kansrekeningscenario.',
        '<b>Vragentype</b>: C(n,k), P(X=k), E(X), Var(X), P(A|B), P(A∪B).',
        '<b>Parameters</b>: n, k (hele getallen) en p (kans, 0–1) volgens de verdeling.',
        '<b>Kansen P(A), P(B), P(A∩B)</b> voor samengestelde gebeurtenissen.',
        '<b>Het voorbeeld</b> berekent het exacte antwoord (als breuk indien mogelijk).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── TRIGONOMETRIE
  trigonometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-trigonometrie"></use></svg> Trigonometrie — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>exacte waarden</b> (sin, cos, tan), <b>trigonometrische identiteiten</b> en het oplossen van <b>vergelijkingen</b>. STACK forceert exacte antwoorden (<code>forbidfloat</code>).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typische hoek (π/6, π/4, π/3, π/2…).',
        '<b>Vragentype</b>: exacte waarde van sin/cos/tan, identiteit, trig. vergelijking.',
        '<b>Hoek θ</b>: in Maxima-syntax — bijv.: <code>%pi/6</code>, <code>%pi/4</code>, <code>2*%pi/3</code>.',
        '<b>Het voorbeeld</b> toont de exacte waarde en de bijbehorende Maxima-waarde.'
      ])) +
      _hSection('Tip',
        '<p>Floats zijn <b>verboden</b>: de student moet antwoorden in breuken of radicalen (<code>sqrt(3)/2</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── POLYNOMEN
  polynomes: {
    title: '<svg class="hs-ico"><use href="#ico-type-polynomes"></use></svg> Polynomen van 2de graad — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over het <b>polynoom ax²+bx+c</b>: discriminant, nulpunten, formules van Vieta, aantal reële nulpunten. STACK controleert met AlgEquiv.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typisch polynoom.',
        '<b>Vragentype</b>: discriminant Δ, nulpunten x₁/x₂, som x₁+x₂, product x₁×x₂, aantal nulpunten.',
        '<b>Coëfficiënten a, b, c</b> van het polynoom (hele getallen of decimalen).',
        '<b>Het voorbeeld</b> berekent Δ en de nulpunten in real-time.'
      ])) +
      _hSection('Formules van Vieta',
        '<p>x₁+x₂ = −b/a en x₁×x₂ = c/a (zonder de nulpunten expliciet te berekenen).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GRENSWAARDEN
  limites: {
    title: '<svg class="hs-ico"><use href="#ico-type-limites"></use></svg> Grenswaarden van functies — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Vragen over <b>grenswaarden</b>: in het oneindige, in een punt, onbepaalde vormen. STACK controleert met AlgEquiv. <b>Het verwachte antwoord wordt handmatig ingevoerd</b> door de docent.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een functie en een typisch punt.',
        '<b>Type grenswaarde</b>: x→+∞, x→−∞, x→a (eindig), x→a⁺.',
        '<b>Expressie f(x)</b>: Maxima-syntax — bijv.: <code>(x^2-1)/(x-1)</code>, <code>sin(x)/x</code>.',
        '<b>Verwacht antwoord</b>: voer expliciet in (<code>inf</code>, <code>-inf</code>, <code>2</code>, <code>%pi</code>…).',
        '<b>Het voorbeeld</b> toont de formule zonder deze automatisch te berekenen.'
      ])) +
      _hSection('Speciale Maxima-waarden', _hList([
        '<code>inf</code> → +∞, <code>minf</code> → −∞.',
        '<code>%pi</code> → π, <code>1/2</code> → ½.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NATUURKUNDE
  physique: {
    title: '<svg class="hs-ico"><use href="#ico-type-physique"></use></svg> Natuurkunde — Mechanica — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Berekeningen van <b>klassieke mechanica</b>: EVB, valvrije val, kinetische/potentiele energie, behoud van mechanische energie, 2e wet van Newton. Numeriek antwoord gecontroleerd met tolerantie 1 % (NumRelative).</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Vooringesteld</b>: kies een typisch natuurkundig scenario.',
        '<b>Vragentype</b>: v(t), x(t), hoogte h, tijd t, Ek = ½mv², Ep = mgh, eindsnelheid (Em behouden), F = ma.',
        '<b>Kinematische parameters</b>: v₀ (m/s), a (m/s²), t (s).',
        '<b>Mechanische parameters</b>: m (kg), h of v (m of m/s).',
        '<b>Het voorbeeld</b> toont de formule en het numerieke resultaat.'
      ])) +
      _hSection('Tip',
        '<p>g = 9.81 m/s² is hard gecodeerd. Bij valvrije val-oefeningen zijn alleen t en h relevant; niet-gebruikte velden worden automatisch verborgen.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── OSCILLOSCOOP
  oscilloscope: {
    title: '<svg class="hs-ico"><use href="#ico-type-oscilloscope"></use></svg> Oscilloscoop — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>Simulatie van een <b>interactieve oscilloscoop</b>: de student stelt de tijdbasis (Δt, violet) en de verticale gevoeligheid (ΔV, rood) in met schuifregelaars, en meet vervolgens een fysische grootheid (periode, frequentie, RC-tijdsconstante, vertraging…) op het oscillogram.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Meettype</b>: Periode/Frequentie, RC-lading, RC-ontlading, of Vertraging tussen 2 kanalen (ultrageluid).',
        '<b>Didactische modus</b>: <b>Begeleid</b> detailleert elke stap (eenheid, waarde, verwarringsvallen); <b>Zelfstandig</b> controleert elke grootheid met generieke feedback; <b>Expert</b> geeft geen aanwijzingen, alleen het resultaat telt. Deze instelling verandert niet de moeilijkheid van het oscillogram, alleen het detailniveau van de feedbacks.',
        'Afhankelijk van het gekozen type verschijnen specifieke parameters: signaalvorm en frequentie (vast of willekeurig) voor Periode/Frequentie; E en τ voor Lading/Ontlading RC; draaggolf/salvo-frequenties en Δt min-max voor Vertraging.',
        '<b>Initiële instellingen van de oscilloscoop</b> (tijdbasis SH, gevoeligheid SV): vink <b>Auto</b> aan voor een automatische kalibratie die logisch is met het signaal, of vink uit om handmatig een waarde uit de lijst te kiezen.'
      ])) +
      _hSection('Tip',
        '<p>De begeleide modus wordt aanbevolen voor eerste gebruik in de klas: hij wijst expliciet op verwarringsvallen (bijv. halve periode met periode verwarren). Schakel over naar Expert voor een summatieve toets.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INTERFERENTIE-DIFRACTIE
  diffraction: {
    title: '<svg class="hs-ico"><use href="#ico-type-diffraction"></use></svg> Interferentie-Diffractie — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student observeert een <b>diffractie-/interferentiepatroon</b> (enkele spleet, dubbele spleet, Young\'s gaten, ronde opening, vierkante opening) en leidt daaruit een fysische grootheid af (spleetbreedte, golflengte…) op basis van metingen aan het patroon.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Type</b>: vorm van de opening (enkele spleet, dubbele spleet, Young\'s gaten, ronde opening, vierkante opening).',
        '<b>Modus</b>: <b>Scherm</b> (de student meet direct op het geprojecteerde patroon) of <b>Sensor</b> (patroon vergezeld van een lichtintensiteitscurve).',
        '<b>Willekeurige parameters (a, D, b)</b>: vink aan voor een willekeurige trekking bij elke vraag, of vink uit om handmatig de spleetbreedte a, de schermafstand D, de spleetafstand b en de golflengte λ vast te leggen.',
        '<b>Relatieve tolerantie (%)</b>: toegestane foutmarge bij het numerieke antwoord (bijv. 10 % accepteert 632 nm bij een verwachte waarde van 635 nm).',
        '<b>Instructie</b>: schrijf de vraag aan de student, bijv. « Meet de afstand met het kruisdraad en leid λ af ».'
      ])) +
      _hSection('Tip',
        '<p>Het veld Afstand b verschijnt alleen bij patronen met twee openingen (dubbele spleet, Young\'s gaten) — het wordt automatisch verborgen voor enkele spleet/ronde opening/vierkante opening.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RANGSCHIKKEN
  ord: {
    title: '<svg class="hs-ico"><use href="#ico-type-ord"></use></svg> Rangschikken — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student <b>brengt elementen in de juiste volgorde</b> door slepen en neerzetten (Parsons-blokken van STACK). Ideaal voor algoritmes, chronologieën, redeneerstappen of codesequenties.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Opdracht</b>: schrijf de instructie (HTML/LaTeX geaccepteerd).',
        '<b>＋ Element toevoegen</b>: elke regel is een element van de te rangschikken sequentie. De invoervolgorde is de juiste volgorde.',
        '<b>Herbruikbare elementen (kloon)</b>: vink aan als hetzelfde element meerdere keren in het antwoord kan voorkomen.',
        'De elementen worden aan de student gepresenteerd in een <b>willekeurig gemengde volgorde</b> door STACK.'
      ])) +
      _hSection('Tip',
        '<p>Schrijf elk element zelfstandig en ondubbelzinnig. Vermijd formuleringen als "daarna…" of "vervolgens…" die de volgorde verklappen.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── KLIKKBARE AFBEELDING
  imgclick: {
    title: '<svg class="hs-ico"><use href="#ico-type-imgclick"></use></svg> Selectie op afbeelding — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student <b>klikt op de juiste zone van een afbeelding</b> (biologiediagram, landkaart, fysiekdiagram…). De antwoordzone blijft <b>onzichtbaar</b> voor de student.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>URL van de afbeelding</b>: directe link naar de afbeelding (moet toegankelijk zijn vanuit Moodle).',
        '<b>Breedte / Hoogte</b>: weergave-afmetingen in pixels (de afbeelding wordt geschaald).',
        '<b>Instructie</b>: instructie weergegeven aan de student, bijv. « Klik op de linkerventrikel ».',
        '<b>Juiste zone — Cirkel</b>: X midden, Y midden, Straal (allemaal in % van de breedte/hoogte).',
        '<b>Juiste zone — Rechthoek</b>: X links, Y boven, X rechts, Y onder (in %).',
        '<b>Zone-label</b>: tekst gebruikt in de feedback, bijv. « linkerventrikel ».'
      ])) +
      _hSection('Coördinaten in %',
        '<p>0 % = linkerrand (of bovenrand), 100 % = rechterrand (of onderrand). Een gecentreerde cirkel met straal 10 %: X=50, Y=50, R=10.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── SLEPEN EN NEERZETTEN JSXGRAPH
  jxgdrop: {
    title: '<svg class="hs-ico"><use href="#ico-type-jxgdrop"></use></svg> Slepen en Neerzetten JSXGraph — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student <b>sleept labels (opties) naar een afbeelding</b> om deze te deponeren in gedefinieerde zones (gelegend diagram, kaart, experimentele opstelling…). Stackforge genereert automatisch de responsieve JSXGraph-code en de correctie.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Achtergrondafbeelding</b>: laad een afbeelding (PNG/JPG) — deze dient als visueel draagvlak voor zones en opties.',
        '<b>Opties</b>: klik op <b>＋ Optie toevoegen</b> voor elk label dat de student kan deponeren.',
        '<b>Drop-zones</b>: gereedschap <b>Cirkel</b>/<b>Rechthoek</b> om een zone op de afbeelding te plaatsen (klik op de afbeelding), <b>Selecteren</b> om een bestaande zone aan te passen (midden/straal of positie/afmetingen in het rechterpaneel).',
        'Voor elke geselecteerde zone, vink in <b>Geaccepteerde antwoorden</b> de optie(s) aan die als correct worden beschouwd voor deze zone.',
        '<b>Zichtbare drop-zones</b>: vink uit om de omtrek van de zones voor de student te verbergen (onzichtbare zone, moeilijker) — de zones blijven actief voor de correctie, alleen de weergave verandert.'
      ])) +
      _hSection('Tip',
        '<p>Dezelfde optie kan in meerdere zones worden geaccepteerd als de vraag dit vereist. Test het slepen/neerzetten in het voorbeeld voordat je exporteert — de validatie wordt vastgezet na deponering, zoals in een echte Moodle-toets.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RGB / CMYK
  rvbcmj: {
    title: '<svg class="hs-ico"><use href="#ico-type-rvbcmj"></use></svg> RGB / CMYK — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student <b>identificeert de kleur van een object</b> door zijn afbeelding te bekijken door verschillende <b>kleurfilters</b> (Rood-Groen-Blauw of Cyaan-Magenta-Geel). Gebruikt in natuurkundige optica en beeldende vakken.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Type filters</b>: RGB (additieve kleurmenging) of CMY (subtractieve kleurmenging).',
        '<b>ZW-weergave</b>: toont de afbeelding in grijstinten vóór het filteren (realistischer).',
        '<b>Afbeelding van het object</b>: importeer een PNG/JPG-afbeelding — deze wordt als Base64 gecodeerd in de XML.',
        '<b>Juiste kleur</b>: selecteer de echte kleur van het object (Rood, Groen, Blauw, Geel, Cyaan, Magenta, Wit, Zwart).',
        '<b>Filters vooraf bekijken</b>: controleer het uiterlijk van de afbeelding door elk filter vóór het exporteren.'
      ])) +
      _hSection('Didactisch principe',
        '<p>Bij RGB: een rood filter laat alleen de rode component door — een groen object zal donker verschijnen door een rood filter. Bij CMY: een cyaan filter absorbeert rood en laat groen en blauw door.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── METEONZEKERHEID
  incertitude: {
    title: '<svg class="hs-ico"><use href="#ico-type-incertitude"></use></svg> Meetonzekerheid — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student verwerkt een reeks <b>experimentele metingen</b> en berekent de <b>meetonzekerheid</b> (GUM-methode): onzekerheid type A (statistisch, uit de metingen), onzekerheid type B (instrumenteel), gecombineerde onzekerheid, uitgebreide onzekerheid en de uiteindelijke resultaatschrijfwijze <code>X = x̄ ± U</code>. Elke aangevinkte stap wordt onafhankelijk beoordeeld.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Grootheid / Symbool / Eenheid</b>: beschrijven de meting (bv. Lengte, L, cm) — worden gebruikt om automatisch de feedback te genereren.',
        '<b>Type A</b>: ofwel een handmatig ingevoerde <i>lijst met metingen</i>, ofwel een <i>willekeurig gegenereerde</i> reeks gekalibreerd op een doelgemiddelde en doelstandaardafwijking.',
        '<b>Type B</b>: kies de bron van de instrumentele fout — <i>resolutie</i> (u_B = q/√12), <i>fabriekstolerantie</i> (u_B = Δ/√3), <i>kalibratiecertificaat</i> (u_B = U_cert/k_cert), of een direct <i>opgelegde waarde</i>.',
        '<b>Weergave van het resultaat</b>: aantal significante cijfers van U (1 of 2), optioneel naar boven afronden, dekkingsfactor k (1 of 2).',
        '<b>Beoordeelde stappen</b>: vink aan welke stappen de student moet berekenen (gemiddelde, standaardafwijking, uA, uB, uc, U, eindschrijfwijze) — elke stap genereert een eigen, apart beoordeeld antwoordveld.'
      ])) +
      _hSection('Tips / valkuilen', _hList([
        'De willekeurige modus van type A gebruikt gekalibreerde uniforme ruis (geen echte normale verdeling) om precies de gevraagde standaardafwijking te bereiken.',
        'De stap "Eindschrijfwijze" verwacht het formaat <code>X = x̄ ± U</code> (inclusief eenheid) — de beoordeling tolereert spaties, de notatie <code>+/-</code> en afsluitende nullen.',
        'De Student-t-factor (kleine n, betrouwbaarheidsniveau) is nog niet beschikbaar in deze module — gepland voor een latere iteratie.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── Z-SCORE (METROLOGISCHE COMPATIBILITEIT)
  zscore: {
    title: '<svg class="hs-ico"><use href="#ico-type-zscore"></use></svg> Z-score — Hulp',
    body:
      _hSection('Waarvoor dient het?',
        '<p>De student vergelijkt een <b>gemeten waarde</b> met een <b>referentiewaarde</b> door de <b>metrologische compatibiliteitsscore</b> te berekenen: <code>z = |x_gemeten - x_referentie| / u_c</code>, en concludeert vervolgens of het resultaat compatibel is met de referentie (z onder een instelbare drempel) of niet.</p>') +
      _hSection('Hoe in te vullen', _hList([
        '<b>Grootheid / Symbool / Eenheid</b>: beschrijven de meting — worden gebruikt om automatisch de opgave en de feedback te genereren.',
        '<b>Gegeven waarden</b>: x_gemeten, x_referentie en u_c worden rechtstreeks door de docent ingevoerd (vaste waarden, geen willekeurige generatie) en automatisch in de opgave getoond.',
        '<b>Compatibiliteitsdrempel</b>: vergelijkingswaarde voor de conclusie (compatibel als z &lt; drempel) — standaard 2, maar volledig instelbaar.',
        '<b>Beoordeelde stappen</b>: vink "Berekening van de z-score" en/of "Conclusie over compatibiliteit" aan — elke stap genereert een eigen, apart beoordeeld antwoordveld.'
      ])) +
      _hSection('Tips / valkuilen', _hList([
        'Deze module is een zelfstandig vraagtype, los van het type "Meetonzekerheid": het hergebruikt geen elders ingevoerde gegevens.',
        'De compatibiliteitsconclusie is een keuzelijst (Compatibel / Incompatibel), geen numeriek veld.',
        'In deze versie is geen willekeurige generatie beschikbaar (alleen MVP met vaste waarden).'
      ])) + _HELP_COMMON
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.nl = HELP_CONTENT;
})();