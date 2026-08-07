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

/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — Inhoud van de ASSISTENT-MODUS (Nederlands)
   Opgeslagen in window.ASSIST_LANG.nl ; gelezen door assistant.js afhankelijk van de taal.
   Om een taal toe te voegen: kopieer dit bestand, vertaal de waarden,
   en sla op in window.ASSIST_LANG.<code>.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  window.ASSIST_LANG = window.ASSIST_LANG || {};

  window.ASSIST_LANG.nl = {
    /* ── Interface van het paneel ── */
    toggle: "Assistent-modus",
    toggleTitle: "Stap-voor-stap gids: benadrukt de huidige stap en legt de velden uit",
    panelTitle: "Assistent-modus",
    disable: "Uitschakelen",

    /* ── Beoordelingsschema (toegevoegd bovenaan de velden voor alle types) ── */
    notation: "<strong>Beoordelingsschema (punten)</strong> — in de gele banner bovenaan het formulier: aantal punten toegewezen aan de vraag.",

    /* ── Stappen ── */
    step1: {
      title: "Stap 1 — Benoemen",
      explain: "Geef je oefening een naam in het gemarkeerde veld, druk vervolgens op <strong>Enter</strong> of klik ergens anders.",
      tip: "Deze naam identificeert de gegenereerde oefening voor Moodle."
    },
    step2: {
      title: "Stap 2 — Een type kiezen",
      explain: "Klik op het te maken <strong>vragentype</strong> tussen de gemarkeerde kaarten.",
      tip: "Elk type opent een aangepast formulier direct eronder — de gids wordt dan veld voor veld specifieker."
    },
    step3: {
      editTitle: "Bewerking van V{n} — {label}",
      editExplain: "Je bewerkt vraag <strong>V{n}</strong>. Pas de onderstaande velden aan:",
      editDo: "Klik op « V{n} bijwerken » om op te slaan, of op « Annuleren » om te stoppen.",
      title: "Stap 3 — {label}",
      noGuideExplain: "Vul het gemarkeerde formulier in en voeg de vraag toe.",
      noGuideDo: "Klik op « Deze vraag toevoegen ».",
      do: "Zodra ingevuld, klik op « Deze vraag toevoegen ».",
      done: "{qn} vraag(en) al toegevoegd. Herhaal om er meer toe te voegen, of ga naar stap 4."
    },
    step4: {
      title: "Stap 4 — Genereren",
      explain: "Je <strong>{qn} vraag(en)</strong> zijn klaar. Klik op « <strong>🏷️ Tags &amp; Voorbeeld</strong> » om te controleren, en vervolgens te genereren en exporteren.",
      tip: "Je kunt een vraag nog steeds bewerken (✏️) of verwijderen (✕) via de badges."
    },

    /* ── Zijlijst met stappen ── */
    stepsList: ["Oefening benoemen", "Type kiezen", "Invullen en toevoegen", "Genereren / Exporteren"],

    /* ── Varianten V4 (sleep-en-neerzet editor) ── */
    step2_v4: {
      title: "Stap 2 — Een vraag invoegen",
      explain: "Klik in het palet aan de <strong>linkerkant</strong> op een categorie om deze uit te klappen, en sleep vervolgens een blok naar de editor.",
      tip: "Het configuratiepaneel wordt automatisch geopend om de vraag te parametriseren."
    },
    step3_v4: {
      editTitle: "Configuratie van V{n} — {label}",
      editExplain: "Vul de velden in voor vraag <strong>V{n}</strong>:",
      editDo: "Klik op « Opslaan » om te valideren.",
      title: "Stap 3 — {label}",
      noGuideExplain: "Vul het gemarkeerde formulier in.",
      noGuideDo: "Klik op « Opslaan ».",
      do: "Zodra ingevuld, klik op « Opslaan ».",
      done: "{qn} vraag(en) al geconfigureerd. Voeg andere in of ga naar het exporteren."
    },
    step4_v4: {
      title: "Stap 4 — Exporteren",
      explain: "Je <strong>{qn} vraag(en)</strong> zijn klaar. Klik op <strong>XML exporteren</strong> om te controleren en te downloaden.",
      tip: "Grijze opsommingstekens geven aan welke vragen nog geconfigureerd moeten worden."
    },
    stepsList_v4: ["Oefening benoemen", "Sleep een blok", "Configureren", "Exporteren"],

    /* ── Hulp-banner in de vensters « AI-Prompt » ── */
    prompt: {
      title: "Hoe gebruik je de AI-Prompt",
      steps: [
        "Vul de <strong>context</strong> hieronder in (thema, vak, niveau, taal, aantal elementen).",
        "De <strong>prompt bouwt zichzelf op</strong> in het donkere frame onderaan.",
        "Klik op « <strong>📋 Prompt kopiëren</strong> ».",
        "Plak het in een <strong>AI</strong> (ChatGPT, Claude, Gemini…) en start de generatie.",
        "Haal het <strong>resultaat</strong> op dat door de AI is geproduceerd (in JSON-formaat).",
        "Keer terug naar Stackforge en <strong>importeer het</strong> via de knop « 📥 JSON » van het formulier."
      ],
      note: "⚠️ <strong>Verwar dit niet met de studentweergave.</strong> " +
        "Deze twee velden beschrijven wat <strong>de AI moet produceren</strong> (de bank), niet wat de student zal zien:" +
        "<ul class=\"hs-pb-note-list\">" +
          "<li>« <strong>Totaal aantal opties (XE)</strong> » = totaal aantal te <strong>maken</strong> opties " +
            "(bank WAAR + ONWAAR), en niet het aantal dat aan de student wordt getoond.</li>" +
          "<li>« <strong>Waar opties (XB)</strong> » = aantal te <strong>genereren</strong> waar opties " +
            "in deze bank, en niet het aantal getoonde juiste antwoorden aan de student.</li>" +
        "</ul>" +
        "Het werkelijk weergegeven en getrokken aantal wordt <strong>in het formulier</strong> ingesteld, niet hier."
    },

    /* ── Leesbare labels per type ── */
    TYPE_LABEL: {
      checkbox: "Selectievakjes", radio: "Keuzerondjes", dropdown: "Dropdown-menu",
      algebraic: "Algebraïsch", numerical: "Rekenen (Numeriek)", units: "Eenheid", string: "Tekst (String)",
      match: "Koppelen (Matching)", crossword: "Kruiswoordpuzzel", doi: "Object-interactiediagram",
      chemical: "Scheikunde — vergelijking", chemical_topo: "Topologische scheikunde",
      nuclear: "Kernreactie", composition: "Vrije opstel",
      jxgdrop: "Slepen en Neerzetten (JSXGraph)", vf: "Waar / Onwaar", ord: "Rangschikken",
      imgclick: "Selectie op afbeelding", rvbcmj: "RGB / CMYK",
      optique: "Geometrische optica", "acide-base": "pH-metrie / Titratie", redox: "Redoxtitratie",
      basen: "Grondtal-N-conversie", circuit: "Elektrische schakelingen",
      logique: "Booleaanse logica", complexe: "Complexe getallen",
      calcul: "Differentiaal- en integraalrekening", statistiques: "Statistiek",
      matrices: "Matrices", geometrie: "Analytische meetkunde",
      suites: "Getallenrijen", probabilites: "Kansrekening",
      trigonometrie: "Trigonometrie", polynomes: "Polynomen van 2de graad",
      limites: "Grenswaarden van functies", physique: "Natuurkunde — Mechanica",
      inequation: "Ongelijkheden (oplossingsverzameling)"
    },

    /* ── Gedetailleerde begeleiding van stap 3, veld voor veld, per type ── */
    STEP3: {
      checkbox: {
        intro: "Meerkeuze met meerdere antwoorden: Stackforge trekt willekeurig goede/slechte opties bij elke poging.",
        fields: [
          "<strong>Opdracht</strong> — klik op « ✏️ Editor » om de vraag te schrijven (tekst, formule, afbeelding).",
          "<strong>Beoordelingsschema</strong> (gele banner bovenaan) — toegekende punten.",
          "<strong>Totaal aantal opties</strong> — hoeveel vakjes de student zal zien.",
          "<strong>Aantal juiste antwoorden</strong> — hoeveel er waar zijn (vast aantal of willekeurig).",
          "<strong>Opties</strong> — voeg je antwoorden toe met « ✅ + WAAR » en « ❌ + ONWAAR ».",
          "<strong>Feedback</strong> — berichten weergegeven als correct / als fout."
        ],
        tip: "Zet meer WAAR/ONWAAR-opties in de lijsten dan het weergegeven aantal: de loting zal variëren van student tot student."
      },
      radio: {
        intro: "Slechts één juist antwoord: getrokken uit de pool WAAR, omringd door afleiders uit de pool ONWAAR.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Beoordelingsschema</strong> — punten.",
          "<strong>Totaal aantal weergegeven knoppen</strong> — 1 juist antwoord + de rest als afleiders.",
          "<strong>Pool WAAR</strong> — voeg de mogelijke juiste antwoorden toe (« + Goed antwoord »).",
          "<strong>Pool ONWAAR</strong> — voeg de afleiders toe."
        ],
        tip: "Meerdere juiste antwoorden in de pool WAAR = een andere variant bij elke poging."
      },
      dropdown: {
        intro: "Zelfde principe als het keuzerondje, maar weergegeven als een dropdown-menu.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Beoordelingsschema</strong> — punten.",
          "<strong>Aantal weergegeven opties</strong> in het menu.",
          "<strong>Pool WAAR</strong> — juiste antwoorden.",
          "<strong>Pool ONWAAR</strong> — afleiders."
        ]
      },
      algebraic: {
        intro: "De student voert een wiskundige expressie in; Stackforge controleert de algebraïsche equivalentie.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Variabelen</strong> — lijst ze op (bijv.: x, y, z).",
          "<strong>Verwacht antwoord</strong> — de juiste expressie. Gebruik « 🎹 Invoerhulp » voor de Maxima-syntax.",
          "<strong>Feedback</strong> als juist / als onjuist.",
          "<span class='opt'>Gedetailleerde oplossing (optioneel)</span> — uitleg achteraf getoond."
        ],
        tip: "Schrijf het antwoord in Maxima-syntax (bijv.: 2*x^2, sqrt(3)), niet in handschrift notatie."
      },
      numerical: {
        intro: "Enkel numeriek antwoord, met beheer van afronding en tolerantie.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Doelwaarde</strong> — het verwachte getal.",
          "<strong>Auto-afronding / decimalen</strong> — stel in als het antwoord afgerond moet worden.",
          "<strong>Type tolerantie</strong> + <strong>foutmarge</strong> — toegestaan verschil.",
          "<strong>Feedback</strong> als correct / als fout."
        ]
      },
      units: {
        intro: "Antwoord = een numerieke waarde EN een eenheid (Stackforge controleert beide).",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Verwachte numerieke waarde</strong>.",
          "<strong>Maxima-eenheid</strong> — bijv.: m/s, kg, N (Maxima-syntax).",
          "<strong>Relatieve tolerantie</strong> + <strong>significante cijfers</strong>.",
          "<strong>Feedback</strong> als correct / als fout."
        ],
        tip: "De eenheid wordt genoteerd in Maxima-syntax: gebruik bij twijfel « 🎹 Invoerhulp »."
      },
      string: {
        intro: "Vrij tekstantwoord, vergeleken met een verwacht antwoord.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Verwacht antwoord</strong> — de juiste tekst.",
          "<strong>Veldgrootte</strong> + <strong>tolerantie</strong> (flexibiliteit van vergelijking).",
          "<strong>Feedback</strong> als juist / als onjuist.",
          "<span class='opt'>Oplossing / uitleg (optioneel)</span>."
        ]
      },
      match: {
        intro: "De student koppelt de elementen van twee kolommen.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Kolommen links / rechts</strong> — voeg de te koppelen elementen toe.",
          "<strong>Koppelingen</strong> — teken de juiste overeenkomsten tussen de kolommen."
        ],
        tip: "De knop « 🤖 AI-Prompt » genereert een klaar prompt om te plakken om de paren te maken."
      },
      crossword: {
        intro: "Kruiswoordpuzzel-grid gegenereerd op basis van een lijst woorden + definities.",
        fields: [
          "<strong>Beoordelingsschema</strong> en <strong>aantal te gebruiken woorden</strong>.",
          "<strong>Woorden + definities</strong> — voeg elke regel toe (« + Woord toevoegen »).",
          "<strong>Grid genereren</strong> — Stackforge berekent de indeling."
        ],
        tip: "« 🤖 AI-Prompt » maakt met één klik een lijst woorden/definities over een thema aan."
      },
      doi: {
        intro: "Object-interactiediagram: de student koppelt een centraal object aan zijn omgeving.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Studieobject</strong> — de centrale zone van het systeem.",
          "<span class='opt'>Extra lege blauwe zones (optioneel)</span> — extra valkuilen.",
          "<strong>Objecten en interacties</strong> — lijst elk object en zijn type (zwaartekracht, contact, indringer…)."
        ]
      },
      chemical: {
        intro: "Chemische vergelijking: de student voltooit of identificeert een reactie.",
        fields: [
          "<span class='opt'>Opdracht (optioneel)</span> — via « ✏️ Editor ».",
          "<strong>Invoer van de vergelijking</strong> — typ deze in en klik « 🔄 Voorbeeld bijwerken ».",
          "<strong>Type reactie</strong>.",
          "<strong>Naam van de verwachte functionele groep</strong>.",
          "<strong>Feedback</strong> als correct / als fout."
        ]
      },
      chemical_topo: {
        intro: "Topologische scheikunde: vergelijking op basis van SMILES-structuren, gedetailleerde notatie.",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Vergelijking (SMILES of formule)</strong> — voer in en klik « 🔄 Bijwerken ».",
          "<strong>Weging</strong> — verdeel de % tussen de pijl (PRT1) en de knooppunten.",
          "<strong>Som van de % = 100</strong> — het groene bericht bevestigt het evenwicht."
        ],
        tip: "Controleer de som-indicator: zolang deze rood is, is het beoordelingsschema ongeldig."
      },
      nuclear: {
        intro: "Kernreactie: de student voltooit de vergelijking (behoud van A en Z).",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Model kernreactie</strong> — voer de vergelijking in, en klik « 🔄 Voorbeeld »."
        ]
      },
      composition: {
        intro: "Vrij opgesteld antwoord in een editor (opstel / open vraag).",
        fields: [
          "<strong>Opdracht</strong> — via « ✏️ Editor ».",
          "<strong>Grootte van de studenteneditor</strong> — hoogte van het schrijfveld.",
          "<span class='opt'>Bericht weergegeven onder de editor (optioneel)</span> — instructie voor de student."
        ]
      },
      basen: {
        intro: "Grondtal-N-conversie: de student converteert een getal tussen grondtallen (2, 8, 10, 16).",
        fields: [
          "<strong>Vooringesteld</strong> — kies een veelvoorkomend voorbeeld.",
          "<strong>Brongetal</strong> + <strong>brongrondtal</strong> (bijv.: 1010 in grondtal 2).",
          "<strong>Doelgrondtal</strong> — het grondtal waarnaartoe geconverteerd moet worden.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het voorbeeld berekent automatisch het juiste antwoord ter verificatie."
      },
      circuit: {
        intro: "Wetten van elektrische schakelingen: Ohm, serie/parallel-schakeling, vermogen.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een schakelingsscenario.",
          "<strong>Vragentype</strong> — wet van Ohm, serie/parallelweerstand, stroomsterkte, vermogen…",
          "<strong>Parameters</strong> U, I, R, P volgens het scenario.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      logique: {
        intro: "Booleaanse logica: waarheidstabellen, vereenvoudiging, equivalenties.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een voorbeeld (AND, OR, NOT, XOR, De Morgan…).",
          "<strong>Vragentype</strong> — waarheidstabel, vereenvoudiging, equivalentie.",
          "<strong>Booleaanse expressie</strong> — notatie met AND/OR/NOT/XOR.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het voorbeeld toont de volledige waarheidstabel en de verwachte waarde."
      },
      complexe: {
        intro: "Complexe getallen: algebraïsche vorm, modulus, argument, geconjugeerde.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een voorbeeld (alg. vorm, modulus, argument…).",
          "<strong>Vragentype</strong> — algebraïsche vorm, modulus, argument, geconjugeerde, bewerkingen.",
          "<strong>Reëel en imaginair deel</strong> a + bi.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het antwoord is in Maxima-syntax: %i voor i, %pi voor π."
      },
      calcul: {
        intro: "Differentiaal- en integraalrekening: afgeleide, primitief, bepaalde integraal.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een typische functie.",
          "<strong>Vragentype</strong> — afgeleide, primitief, integraal, numerieke waarde.",
          "<strong>Functie f(x)</strong> in Maxima-syntax.",
          "<strong>Grenzen a, b</strong> voor de bepaalde integraal.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Maxima-syntax: diff(x^3,x) = 3x², integrate(x^2,x,0,1) = 1/3."
      },
      statistiques: {
        intro: "Statistiek: gemiddelde, mediaan, variantie, kwartielen, bereik.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een typische dataset.",
          "<strong>Vragentype</strong> — gemiddelde, mediaan, variantie, standaarddeviatie, Q1, Q3, bereik.",
          "<strong>Gegevens</strong> — lijst van waarden, gescheiden door komma's.",
          "<span class='opt'>Frequenties</span> — voor het gewogen gemiddelde.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      matrices: {
        intro: "Lineaire algebra: matrixvermenigvuldiging, determinant, getransponeerde, spoortraject.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een bewerking.",
          "<strong>Vragentype</strong> — product, determinant, getransponeerde, spoortraject, inverse.",
          "<strong>Grootte</strong> — matrix 2×2 of 3×3.",
          "<strong>Coëfficiënten</strong> — voer de ingangen van de matrix(sen) in.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het antwoord is in Maxima-syntax: matrix([a,b],[c,d])."
      },
      geometrie: {
        intro: "Analytische meetkunde: afstand, middelpunt, vectoren, rechten, cirkels.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een 2D- of 3D-voorbeeld.",
          "<strong>Vragentype</strong> — afstand, middelpunt, norm, inwendig product, collineariteit.",
          "<strong>Punten / vectoren</strong> — coördinaten A, B, C.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      suites: {
        intro: "Getallenrijen: algemeen term, som, limiet van een meetkundige rij.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een typische rij.",
          "<strong>Vragentype</strong> — term, som, limiet, aard.",
          "<strong>Parameters</strong> u₀, r (of d), n volgens het scenario.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      probabilites: {
        intro: "Kansrekening: combinaties, binomiale verdeling, verwachtingswaarde, voorwaardelijke kans.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een voorbeeld.",
          "<strong>Vragentype</strong> — combinatie, P(X=k), E(X), Var(X), voorwaardelijke kans.",
          "<strong>Parameters</strong> n, k, p volgens de verdeling.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      trigonometrie: {
        intro: "Trigonometrie: exacte waarden (sin/cos/tan), identiteiten, vergelijkingen.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een typische hoek (π/6, π/4, π/3…).",
          "<strong>Vragentype</strong> — exacte waarde, identiteit, trigonometrische vergelijking.",
          "<strong>Hoek θ</strong> — breuk van π in Maxima-syntax (bijv.: %pi/6).",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "De antwoorden zijn in exacte vorm (breuken van π) — geen decimalen."
      },
      polynomes: {
        intro: "Tweedegraads polynoom ax²+bx+c: discriminant, nulpunten, formules van Vieta.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een typisch polynoom.",
          "<strong>Vragentype</strong> — discriminant Δ, nulpunten, som/product van de nulpunten, aantal nulpunten.",
          "<strong>Coëfficiënten a, b, c</strong> van het polynoom.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het voorbeeld berekent Δ en de nulpunten in real-time ter verificatie."
      },
      limites: {
        intro: "Grenswaarden van functies: grenswaarde in het oneindige, in een punt, onbepaalde vormen.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een functie en een typisch punt.",
          "<strong>Type grenswaarde</strong> — x→+∞, x→−∞, x→a, x→a⁺.",
          "<strong>Expressie f(x)</strong> in Maxima-syntax.",
          "<strong>Verwacht antwoord</strong> — voer de grenswaarde in (inf, -inf, breuk, %pi…).",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Het antwoord wordt handmatig ingevoerd omdat sommige grenswaarden een menselijk oordeel vereisen."
      },
      physique: {
        intro: "Klassieke mechanica: EVB, valvrije val, kinetische/potentiele energie, Newton.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een natuurkundig scenario.",
          "<strong>Vragentype</strong> — v(t), x(t), hoogte, tijd, Ek, Ep, behoud Em, F=ma.",
          "<strong>Parameters</strong> v₀, a, t, m, h volgens het scenario.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "De student voert een decimaal getal in; de tolerantie is 1 % (NumRelative)."
      },
      inequation: {
        intro: "Ongelijkheden: oplossingsverzameling in STACK-intervalnotatie (oo, cc, union…). AlgEquiv beheert de intervallen.",
        fields: [
          "<strong>Vooringesteld</strong> — kies een voorbeeld.",
          "<strong>Type</strong> — lineair (ax+b ▷ 0), polynoom (ax²+bx+c ▷ 0), absolute waarde.",
          "<strong>Operator</strong> — >, ≥, <, ≤.",
          "<strong>Coëfficiënten a, b, c</strong> afhankelijk van het type.",
          "<strong>Oplossingsverzameling</strong> — auto-berekend; corrigeer indien nodig: <code>oo(2,inf)</code>, <code>cc(-2,2)</code>, <code>union(...)</code>.",
          "<strong>Instructie</strong> — via « ✏️ Editor ».",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "STACK accepteert oo/oc/co/cc voor de intervallen en union() voor de verenigingen. Voeg inf en -inf toe voor de halflijnen."
      }
    }
  };
})();