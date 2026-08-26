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
   CAIRN FOR STACK — ASSISTANT MODE content (English)
   Registered in window.ASSIST_LANG.en ; read by assistant.js per language.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  window.ASSIST_LANG = window.ASSIST_LANG || {};

  window.ASSIST_LANG.en = {
    /* ── Panel interface ── */
    toggle: "Assistant mode",
    toggleTitle: "Step-by-step guide: highlights the current step and details each field",
    panelTitle: "Assistant mode",
    disable: "Turn off",

    /* ── Marking (added at the top of the fields for every type) ── */
    notation: "<strong>Marking (points)</strong> — in the yellow banner at the top of the form: number of points awarded for the question.",

    /* ── Steps ── */
    step1: {
      title: "Step 1 — Name it",
      explain: "Give your exercise a name in the highlighted field, then press <strong>Enter</strong> or click elsewhere.",
      tip: "This name will identify the exercise generated for Moodle."
    },
    step2: {
      title: "Step 2 — Choose a type",
      explain: "Click the <strong>question type</strong> you want to create among the highlighted cards.",
      tip: "Each type opens a tailored form just below — the guide will then become field-by-field specific."
    },
    step3: {
      editTitle: "Editing Q{n} — {label}",
      editExplain: "You are editing question <strong>Q{n}</strong>. Adjust the fields below:",
      editDo: "Click « Update Q{n} » to save, or « Cancel » to discard.",
      title: "Step 3 — {label}",
      noGuideExplain: "Fill in the highlighted form, then add the question.",
      noGuideDo: "Click « Add this question ».",
      do: "Once filled in, click « Add this question ».",
      done: "{qn} question(s) already added. Start over to add more, or move on to step 4."
    },
    step4: {
      title: "Step 4 — Generate",
      explain: "Your <strong>{qn} question(s)</strong> are ready. Click « <strong>🏷️ Tags &amp; Preview</strong> » to check, then generate and export.",
      tip: "You can still edit (✏️) or delete (✕) a question via its badges."
    },

    /* ── Side step list ── */
    stepsList: ["Name the exercise", "Choose a type", "Fill in then add", "Generate / export"],

    /* ── V4 variants (drag-and-drop editor) ── */
    step2_v4: {
      title: "Step 2 — Insert a question",
      explain: "In the <strong>left</strong> palette, click a category to expand it, then drag a block into the editor.",
      tip: "The configuration panel will open automatically to let you set the question parameters."
    },
    step3_v4: {
      editTitle: "Configure Q{n} — {label}",
      editExplain: "Fill in the fields for question <strong>Q{n}</strong>:",
      editDo: "Click « Save » to confirm.",
      title: "Step 3 — {label}",
      noGuideExplain: "Fill in the highlighted form.",
      noGuideDo: "Click « Save ».",
      do: "Once filled in, click « Save ».",
      done: "{qn} question(s) already configured. Add more or move on to export."
    },
    step4_v4: {
      title: "Step 4 — Export",
      explain: "Your <strong>{qn} question(s)</strong> are ready. Click <strong>Export XML</strong> to check and download.",
      tip: "Greyed-out chips indicate questions that still need to be configured."
    },
    stepsList_v4: ["Name the exercise", "Drag a block", "Configure", "Export"],

    /* ── Help banner inside the « AI Prompt » windows ── */
    prompt: {
      title: "How to use the AI Prompt",
      steps: [
        "Fill in the <strong>context</strong> below (topic, subject, level, language, number of items).",
        "The <strong>prompt builds itself</strong> in the dark box at the bottom.",
        "Click « <strong>📋 Copy the prompt</strong> ».",
        "Paste it into an <strong>AI</strong> (ChatGPT, Claude, Gemini…) and run the generation.",
        "Collect the <strong>result</strong> produced by the AI (in JSON format).",
        "Come back to Cairn for Stack and <strong>import it</strong> via the « 📥 JSON » button of the form."
      ],
      note: "⚠️ <strong>Do not confuse this with the student display.</strong> " +
        "These two fields describe what <strong>the AI must produce</strong> (the pool), not what the student will see:" +
        "<ul class=\"hs-pb-note-list\">" +
          "<li>« <strong>Total options (XE)</strong> » = total number of options to <strong>create</strong> " +
            "(TRUE + FALSE pool), not the number shown to the student.</li>" +
          "<li>« <strong>True options (XB)</strong> » = number of true options to <strong>generate</strong> " +
            "in that pool, not the number of correct answers shown to the student.</li>" +
        "</ul>" +
        "The number actually displayed and drawn at random is set <strong>in the form</strong>, not here."
    },

    /* ── Readable labels per type ── */
    TYPE_LABEL: {
      checkbox: "Checkboxes", radio: "Radio button", dropdown: "Dropdown",
      algebraic: "Algebraic", numerical: "Numerical", units: "Units", string: "Text (String)",
      match: "Matching", crossword: "Crossword", doi: "Object-interaction diagram",
      chemical: "Chemistry — equation", chemical_topo: "Topological chemistry",
      nuclear: "Nuclear reaction", composition: "Composition",
      jxgdrop: "Drag & Drop (JSXGraph)", vf: "True / False", ord: "Ranking",
      imgclick: "Image selection", rvbcmj: "RGB / CMYK",
      optique: "Geometric optics", "acide-base": "Acid-base titration", redox: "Redox titration",
      basen: "Base-N conversion", circuit: "Electrical circuits",
      logique: "Boolean logic", complexe: "Complex numbers",
      calcul: "Differential & integral calculus", statistiques: "Statistics",
      matrices: "Matrices", geometrie: "Analytic geometry",
      suites: "Number sequences", probabilites: "Probability",
      trigonometrie: "Trigonometry", polynomes: "Quadratic polynomials",
      limites: "Function limits", physique: "Physics — Mechanics",
      inequation: "Inequalities (solution set)"
    },

    /* ── Detailed step-3 guidance, field by field, per type ── */
    STEP3: {
      checkbox: {
        intro: "Multiple-choice question: Cairn for Stack randomly draws the correct/incorrect options on each attempt.",
        fields: [
          "<strong>Question text</strong> — click « ✏️ Editor » to write the question (text, formula, image).",
          "<strong>Marking</strong> (yellow banner at the top) — points awarded.",
          "<strong>Total number of options</strong> — how many boxes the student will see.",
          "<strong>Number of correct answers</strong> — how many are true (fixed or random number).",
          "<strong>Options</strong> — add your answers with « ✅ + TRUE » and « ❌ + FALSE ».",
          "<strong>Feedback</strong> — messages shown if correct / if wrong."
        ],
        tip: "Add more TRUE/FALSE options than the number displayed: the random draw will vary from one student to another."
      },
      radio: {
        intro: "A single correct answer: drawn from the TRUE pool, surrounded by distractors from the FALSE pool.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Marking</strong> — points.",
          "<strong>Total number of buttons shown</strong> — 1 correct answer + the rest as distractors.",
          "<strong>TRUE pool</strong> — add the possible correct answers (« + Correct answer »).",
          "<strong>FALSE pool</strong> — add the distractors."
        ],
        tip: "Several correct answers in the TRUE pool = a different variant on each run."
      },
      dropdown: {
        intro: "Same principle as the radio button, but as a dropdown menu.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Marking</strong> — points.",
          "<strong>Number of options shown</strong> in the menu.",
          "<strong>TRUE pool</strong> — correct answers.",
          "<strong>FALSE pool</strong> — distractors."
        ]
      },
      algebraic: {
        intro: "The student enters a mathematical expression; Cairn for Stack checks algebraic equivalence.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Variables</strong> — list the ones used (e.g. x, y, z).",
          "<strong>Expected answer</strong> — the correct expression. Use « 🎹 Input help » for Maxima syntax.",
          "<strong>Feedback</strong> if correct / if wrong.",
          "<span class='opt'>Detailed solution (optional)</span> — explanation shown afterwards."
        ],
        tip: "Write the answer in Maxima syntax (e.g. 2*x^2, sqrt(3)), not in handwritten notation."
      },
      numerical: {
        intro: "A single numerical answer, with rounding and tolerance handling.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Target value</strong> — the expected number.",
          "<strong>Auto rounding / decimals</strong> — set whether the answer should be rounded.",
          "<strong>Tolerance type</strong> + <strong>error margin</strong> — accepted deviation.",
          "<strong>Feedback</strong> if correct / if wrong."
        ]
      },
      units: {
        intro: "Answer = a numerical value AND a unit (Cairn for Stack checks both).",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Numerical value</strong> expected.",
          "<strong>Maxima unit</strong> — e.g. m/s, kg, N (Maxima syntax).",
          "<strong>Relative tolerance</strong> + <strong>significant figures</strong>.",
          "<strong>Feedback</strong> if correct / if wrong."
        ],
        tip: "The unit is written in Maxima syntax: use « 🎹 Input help » if in doubt."
      },
      string: {
        intro: "Free text answer, compared against an expected answer.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Expected answer</strong> — the correct text.",
          "<strong>Box size</strong> + <strong>tolerance</strong> (comparison flexibility).",
          "<strong>Feedback</strong> if correct / if wrong.",
          "<span class='opt'>Solution / explanation (optional)</span>."
        ]
      },
      match: {
        intro: "The student matches the items of two columns.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Left / right columns</strong> — add the items to be matched.",
          "<strong>Associations</strong> — draw the correct matches between columns."
        ],
        tip: "The « 🤖 AI Prompt » button generates a ready-to-paste prompt to create the pairs."
      },
      crossword: {
        intro: "Crossword grid generated from a list of words + clues.",
        fields: [
          "<strong>Marking</strong> and <strong>number of words</strong> to use.",
          "<strong>Words + clues</strong> — add each line (« + Add a word »).",
          "<strong>Generate the grid</strong> — Cairn for Stack computes the layout."
        ],
        tip: "« 🤖 AI Prompt » builds a word/clue list on a topic in one click."
      },
      doi: {
        intro: "Object-interaction diagram: the student links a central object to its environment.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Object under study</strong> — the central area of the system.",
          "<span class='opt'>Extra empty blue zones (optional)</span> — additional traps.",
          "<strong>Objects and interactions</strong> — list each object and its type (gravitational, contact, decoy…)."
        ]
      },
      chemical: {
        intro: "Chemical equation: the student completes or identifies a reaction.",
        fields: [
          "<span class='opt'>Question text (optional)</span> — via « ✏️ Editor ».",
          "<strong>Equation input</strong> — type it then « 🔄 Refresh preview ».",
          "<strong>Reaction type</strong>.",
          "<strong>Expected functional group name</strong>.",
          "<strong>Feedback</strong> if correct / if wrong."
        ]
      },
      chemical_topo: {
        intro: "Topological chemistry: equation from SMILES structures, detailed marking.",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Equation (SMILES or formula)</strong> — enter it then « 🔄 Refresh ».",
          "<strong>Weightings</strong> — distribute the % between the arrow (PRT1) and the nodes.",
          "<strong>Sum of % = 100</strong> — the green message confirms the balance."
        ],
        tip: "Check the sum indicator: while it is red, the marking is not valid."
      },
      nuclear: {
        intro: "Nuclear reaction: the student completes the equation (conservation of A and Z).",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Model nuclear reaction</strong> — enter the equation, then « 🔄 Preview »."
        ]
      },
      composition: {
        intro: "Free written answer in an editor (composition / open question).",
        fields: [
          "<strong>Question text</strong> — via « ✏️ Editor ».",
          "<strong>Student editor size</strong> — height of the writing area.",
          "<span class='opt'>Message shown below the editor (optional)</span> — instructions for the student."
        ]
      },
      basen: {
        intro: "Base-N conversion: the student converts a number between bases (2, 8, 10, 16).",
        fields: [
          "<strong>Preset</strong> — choose a common example.",
          "<strong>Source number</strong> + <strong>source base</strong> (e.g. 1010 in base 2).",
          "<strong>Target base</strong> — base to convert to.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "The preview automatically computes the correct answer for verification."
      },
      circuit: {
        intro: "Electrical circuit laws: Ohm's law, series/parallel associations, power.",
        fields: [
          "<strong>Preset</strong> — choose a circuit scenario.",
          "<strong>Question type</strong> — Ohm's law, series/parallel resistance, current, power…",
          "<strong>Parameters</strong> U, I, R, P depending on scenario.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      logique: {
        intro: "Boolean logic: truth tables, simplification, equivalences.",
        fields: [
          "<strong>Preset</strong> — choose an example (AND, OR, NOT, XOR, De Morgan…).",
          "<strong>Question type</strong> — truth table, simplification, equivalence.",
          "<strong>Boolean expression</strong> — using AND/OR/NOT/XOR notation.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "The preview shows the full truth table and the expected answer."
      },
      complexe: {
        intro: "Complex numbers: algebraic form, modulus, argument, conjugate.",
        fields: [
          "<strong>Preset</strong> — choose an example.",
          "<strong>Question type</strong> — algebraic form, modulus, argument, conjugate, operations.",
          "<strong>Real and imaginary parts</strong> a + bi.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Answer uses Maxima syntax: %i for i, %pi for π."
      },
      calcul: {
        intro: "Differential and integral calculus: derivative, antiderivative, definite integral.",
        fields: [
          "<strong>Preset</strong> — choose a function type.",
          "<strong>Question type</strong> — derivative, antiderivative, definite integral, numerical value.",
          "<strong>Function f(x)</strong> in Maxima syntax.",
          "<strong>Bounds a, b</strong> for the definite integral.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Maxima syntax: diff(x^3,x) = 3x², integrate(x^2,x,0,1) = 1/3."
      },
      statistiques: {
        intro: "Statistics: mean, median, variance, quartiles, range.",
        fields: [
          "<strong>Preset</strong> — choose a sample dataset.",
          "<strong>Question type</strong> — mean, median, variance, std dev, Q1, Q3, range.",
          "<strong>Data</strong> — comma-separated list of values.",
          "<span class='opt'>Frequencies</span> — for weighted mean.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      matrices: {
        intro: "Linear algebra: matrix product, determinant, transpose, trace.",
        fields: [
          "<strong>Preset</strong> — choose an operation.",
          "<strong>Question type</strong> — product, determinant, transpose, trace, inverse.",
          "<strong>Size</strong> — 2×2 or 3×3 matrix.",
          "<strong>Entries</strong> — fill in the matrix coefficients.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Answer uses Maxima syntax: matrix([a,b],[c,d])."
      },
      geometrie: {
        intro: "Analytic geometry: distance, midpoint, vectors, lines, circles.",
        fields: [
          "<strong>Preset</strong> — choose a 2D or 3D example.",
          "<strong>Question type</strong> — distance, midpoint, norm, dot product, collinearity.",
          "<strong>Points / vectors</strong> — coordinates of A, B, C.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      suites: {
        intro: "Number sequences: general term, sum, limit of a geometric sequence.",
        fields: [
          "<strong>Preset</strong> — choose a sequence type.",
          "<strong>Question type</strong> — term, sum, limit, nature.",
          "<strong>Parameters</strong> u₀, r (or d), n depending on scenario.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      probabilites: {
        intro: "Probability: combinations, binomial distribution, expectation, conditional probability.",
        fields: [
          "<strong>Preset</strong> — choose an example.",
          "<strong>Question type</strong> — combination, P(X=k), E(X), Var(X), conditional probability.",
          "<strong>Parameters</strong> n, k, p depending on the distribution.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ]
      },
      trigonometrie: {
        intro: "Trigonometry: exact values (sin/cos/tan), identities, equations.",
        fields: [
          "<strong>Preset</strong> — choose a standard angle (π/6, π/4, π/3…).",
          "<strong>Question type</strong> — exact value, identity, trigonometric equation.",
          "<strong>Angle θ</strong> — fraction of π in Maxima syntax (e.g. %pi/6).",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "Answers are exact (π fractions) — no decimals allowed."
      },
      polynomes: {
        intro: "Quadratic polynomial ax²+bx+c: discriminant, roots, Vieta's formulas.",
        fields: [
          "<strong>Preset</strong> — choose a trinomial.",
          "<strong>Question type</strong> — discriminant Δ, roots, sum/product of roots, number of roots.",
          "<strong>Coefficients a, b, c</strong> of the trinomial.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "The preview computes Δ and roots in real time for verification."
      },
      limites: {
        intro: "Function limits: limit at infinity, at a point, indeterminate forms.",
        fields: [
          "<strong>Preset</strong> — choose a function and reference point.",
          "<strong>Limit type</strong> — x→+∞, x→−∞, x→a, x→a⁺.",
          "<strong>Expression f(x)</strong> in Maxima syntax.",
          "<strong>Expected answer</strong> — enter the limit value (inf, -inf, fraction, %pi…).",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "The answer is entered manually because some limits require human judgment."
      },
      physique: {
        intro: "Classical mechanics: MRUA, free fall, kinetic/potential energy, Newton's 2nd law.",
        fields: [
          "<strong>Preset</strong> — choose a physics scenario.",
          "<strong>Question type</strong> — v(t), x(t), height, time, KE, PE, energy conservation, F=ma.",
          "<strong>Parameters</strong> v₀, a, t, m, h depending on the scenario.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "The student enters a decimal; tolerance is 1% (NumRelative test)."
      },
      inequation: {
        intro: "Inequalities: solution set in STACK interval notation (oo, cc, union…). AlgEquiv handles intervals.",
        fields: [
          "<strong>Preset</strong> — choose an example.",
          "<strong>Type</strong> — linear (ax+b ▷ 0), quadratic (ax²+bx+c ▷ 0), absolute value.",
          "<strong>Operator</strong> — >, ≥, <, ≤.",
          "<strong>Coefficients a, b, c</strong> depending on type.",
          "<strong>Solution set</strong> — auto-computed; correct if needed: <code>oo(2,inf)</code>, <code>cc(-2,2)</code>, <code>union(...)</code>.",
          "<strong>Question text</strong> — via ✏️ Editor.",
          "<strong>Feedback</strong> correct / incorrect."
        ],
        tip: "STACK accepts oo/oc/co/cc for intervals and union() for unions. Use inf and -inf for half-lines."
      }
    }
  };
})();
