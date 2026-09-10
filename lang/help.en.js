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
   CAIRN FOR STACK — HELP CONTENT: ENGLISH
   Data only (no logic). To add a help language,
   copy this file (e.g. help.es.js), translate the texts, and end
   with : window.HELP_LANG.en = HELP_CONTENT;
   ════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
function _hSection(title, html){ return `<h3 class="help-h">${title}</h3>${html}`; }
function _hList(items){ return '<ul class="help-ul">'+items.map(i=>`<li>${i}</li>`).join('')+'</ul>'; }

// Common reminder displayed at the bottom of each help (elements shared by all modules).
const _HELP_COMMON = `
  <div class="help-common">
    <strong>Reminders common to all modules</strong>
    ${_hList([
      '<b><svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Editor Button</b>: opens the rich text editor (bold, colors, lists, images, sounds, tables, links).',
      'To insert a formula, click on <b>∑ LaTeX</b> in the editor. In raw syntax: <code>$ ... $</code> for inline, <code>$$ ... $$</code> for centered (e.g., <code>$\\frac{1}{2}$</code>).',
      '<b><svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> AI Prompt</b> (when present): generates text to copy into an AI to automatically produce the question content.',
      '<b><svg class="hs-ico"><use href="#ico-file-import"></use></svg> / <svg class="hs-ico"><use href="#ico-file-export"></use></svg> JSON</b> (when present): import or export the question configuration to reuse it.'
    ])}
  </div>`;

const HELP_CONTENT = {

  // ───────────────────────────────────────── CHECKBOX
  checkbox: {
    title: '<svg class="hs-ico"><use href="#ico-type-checkbox"></use></svg> Checkboxes — Help',
    body:
      _hSection('What it is for',
        '<p>MCQ with <b>multiple answers</b>: the student can check several boxes. The score is <b>automatic partial</b> (each correct/wrong box counts).</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the instruction (e.g., "Check all correct statements").',
        '<b>Total number of options</b>: how many boxes will be visible to the student.',
        '<b>Nb correct answers</b>: <i>Fixed</i> (always the same number of true ones) or <i>Random</i>.',
        'Add your options with <b>✅ + TRUE</b> and <b>❌ + FALSE</b>. For each: a <b>Label</b> (the displayed text) and a <b>Feedback</b> (explanation).'
      ])) +
      _hSection('Tips / Pitfalls', _hList([
        'Put <b>more options</b> in the lists than the number displayed: the system draws them randomly at each attempt → each student sees a variant.',
        'Check the orange warning: it signals an insufficient pool for the requested draw.',
        'The label accepts LaTeX (<code>$...$</code>) and formatting.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── RADIO BUTTON
  radio: {
    title: '<svg class="hs-ico"><use href="#ico-type-radio"></use></svg> Radio button — Help',
    body:
      _hSection('What it is for',
        '<p>MCQ with a <b>single answer</b>: only one correct answer, presented as radio buttons.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the instruction.',
        '<b>Total number of buttons displayed</b>: 1 correct answer + distractors.',
        'Fill in the <b>TRUE Pool</b> (correct answers) and the <b>FALSE Pool</b> (distractors).'
      ])) +
      _hSection('How the draw works', _hList([
        '1 correct answer is drawn <b>at random</b> from the TRUE pool.',
        'The other buttons are distractors drawn from the FALSE pool.',
        'Minimum required: <b>1 TRUE</b> and <b>(nb displayed − 1) FALSE</b>.'
      ])) +
      _hSection('Tip',
        '<p>Several possible correct answers in the TRUE pool? The system chooses one per attempt: ideal for varying questions.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── DROPDOWN MENU
  dropdown: {
    title: '<svg class="hs-ico"><use href="#ico-type-dropdown"></use></svg> Dropdown menu — Help',
    body:
      _hSection('What it is for',
        '<p>Identical to the radio button (single correct answer), but presented as a <b>dropdown list</b>. Useful for inserting an answer in the middle of a sentence.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b> + <b>Nb of options displayed</b>.',
        '<b>TRUE Pool</b>: the correct answer(s). <b>FALSE Pool</b>: the distractors.',
        'Minimum required: 1 TRUE and (total nb − 1) FALSE.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ALGEBRAIC
  algebraic: {
    title: '<svg class="hs-ico"><use href="#ico-type-algebraic"></use></svg> Algebraic — Help',
    body:
      _hSection('What it is for',
        '<p>The student enters a <b>mathematical expression</b>. STACK checks algebraic equivalence (e.g. <code>2*x+y</code> = <code>y+2*x</code>), not the exact writing.</p>') +
      _hSection('How to fill', _hList([
        '<b>Variables</b>: list those used, separated by commas (e.g. <code>x, y</code>).',
        '<b>Expected answer</b>: the correct formula. The <b><svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> Typing assistance</b> button opens a keyboard to write it without errors.',
        'Tab <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Student help</b>: check the instructions to display (decimal point, powers of 10, etc.) and the virtual keyboard.',
        'Tab <b>💡 Solution</b>: write the detailed correction.'
      ])) +
      _hSection('Syntax to respect', _hList([
        'Explicit multiplication: write <code>2*x</code>, never <code>2x</code> (otherwise "2x" is read as a single variable).',
        'Powers with <code>^</code> (e.g. <code>x^2</code>), decimals with a point (e.g. <code>1.5</code>).',
        'Powers of 10: <code>1e6</code> or <code>10^6</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUMERICAL
  numerical: {
    title: '<svg class="hs-ico"><use href="#ico-type-numeric"></use></svg> Arithmetic (Numeric) — Help',
    body:
      _hSection('What it is for',
        '<p>The student enters a <b>numerical value</b>. STACK compares it to a target value with a tolerance.</p>') +
      _hSection('How to fill', _hList([
        '<b>Target value</b>: the correct answer (point for decimals).',
        '<b>Auto rounding</b>: if "Yes", set the number of <b>significant figures</b> kept.',
        '<b>Tolerance type</b>: <i>Relative</i> (% of value) or <i>Absolute</i> (fixed gap).',
        '<b>Error margin</b>: e.g. <code>0.05</code> = 5 % in relative.',
        '<b>Float allowed</b>: accept or not decimal numbers.'
      ])) +
      _hSection('Tip',
        '<p>For a physical measurement, prefer <b>relative</b> tolerance (e.g. 2 %) to accept reasonable rounding.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── UNITS
  units: {
    title: '<svg class="hs-ico"><use href="#ico-type-units"></use></svg> Units — Help',
    body:
      _hSection('What it is for',
        '<p>The student must give a <b>value AND its unit</b> (e.g. <code>9.81 m/s^2</code>). STACK verifies the number (relative tolerance) and the physical unit.</p>') +
      _hSection('How to fill', _hList([
        '<b>Numerical value</b> + <b>Maxima Unit</b> (syntax: <code>m/s^2</code>, <code>N</code>, <code>Pa</code>, <code>J/(kg*K)</code>...).',
        '<b>Relative tolerance</b> (e.g. 0.05 = 5 %) and <b>minimum significant figures</b>.',
        'Tab <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Student help</b>: display the list of usual units and writing rules.'
      ])) +
      _hSection('Writing units', _hList([
        'Connect number and unit with <code>*</code> on the student side (e.g. <code>10*m</code>).',
        'Compound units: <code>J/(kg*K)</code> or <code>J*kg^(-1)*K^(-1)</code>.',
        'Common ones: <code>m, kg, g, N, J, W, Pa, V, A, Ohm, s, h, K, degC</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STRING
  string: {
    title: '<svg class="hs-ico"><use href="#ico-type-string"></use></svg> Text answer (String) — Help',
    body:
      _hSection('What it is for',
        '<p>The student types a <b>word or a short expression</b> (e.g. "Newton"). The comparison is textual.</p>') +
      _hSection('How to fill', _hList([
        '<b>Expected answer</b>: the exact correct text.',
        '<b>Box size</b>: width of the input field.',
        '<b>Tolerance</b>: <i>StringSloppy</i> (ignores case/spaces — recommended) or <i>String</i> (absolute accuracy).',
        'Option <b><svg class="hs-ico"><use href="#ico-tool-palette"></use></svg> Input assistance</b>: add button palettes (fractions, operators, Greek letters...) to help the student.'
      ])) +
      _hSection('Pitfall',
        '<p>Strict mode refuses the slightest difference in case or accent. In doubt, use <b>StringSloppy</b>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATCH (CONNECT)
  match: {
    title: '<svg class="hs-ico"><use href="#ico-type-match"></use></svg> Connect (Matching) — Help',
    body:
      _hSection('What it is for',
        '<p>The student connects elements from <b>column A</b> to those in <b>column B</b>.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the instruction.',
        'Add elements of both columns with <b>+ Add</b> (each element accepts text, LaTeX, image).',
        'In <b>"Create expected connections"</b>: click an element on the <b>left</b> then its corresponding one on the <b>right</b> to create the correct pair.',
        'Created connections appear at the bottom; "<svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Delete all" resets.'
      ])) +
      _hSection('Good to know',
        '<p>The interactive display (lines to draw) only appears in Moodle, during the student\'s attempt.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── CROSSWORD
  crossword: {
    title: '<svg class="hs-ico"><use href="#ico-type-crossword"></use></svg> Crossword — Help',
    body:
      _hSection('What it is for',
        '<p>Generates a crossword grid from a list of <b>words + definitions</b>.</p>') +
      _hSection('How to fill', _hList([
        '<b>Words to use</b>: leave empty to take all, or indicate a number to draw a random subset.',
        'Add each entry with <b>+ Add a word</b>: the <b>Word</b> (the answer) and its <b>Definition</b> (the clue).',
        'Click <b>Generate grid</b> to check the layout before validating.'
      ])) +
      _hSection('Tips', _hList([
        'Prioritize words that share letters: the grid will be more compact.',
        'Avoid spaces and special characters in words.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DOI
  doi: {
    title: '<svg class="hs-ico"><use href="#ico-type-doi"></use></svg> Object-Interaction Diagram — Help',
    body:
      _hSection('What it is for',
        '<p>The student identifies objects interacting with a central <b>study object</b> (physical system).</p>') +
      _hSection('How to fill', _hList([
        '<b>Study object</b>: the system at the center (e.g. "Skier").',
        '<b>Objects and Interactions</b>: add each external object and the type of expected interaction.',
        '<b>Empty blue zones (extra)</b>: adds decoy slots so as not to give away the exact number of interactions.',
        'The preview (canvas) shows the diagram as it will be generated.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CHEMICAL EQUATION
  chemical: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemistry"></use></svg> Chemical Equation — Help',
    body:
      _hSection('What it is for',
        '<p>The student writes/balances a <b>chemical equation</b>. The system checks the balancing.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b> (optional): the instruction.',
        'Enter the model equation in the editor. Toolbar: <b>subscript</b> (x₂), <b>superscript</b> (xⁿ), arrows <b>→</b>, <b>⇌</b>, <b>↔</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Refresh preview</b> to visualize the rendering.',
        '<b>Reaction type</b> and <b>expected functional group</b> specify the correction.'
      ])) +
      _hSection('Tip',
        '<p>Indicate coefficients (e.g. <code>2 O₂</code>): balancing depends on it.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── TOPOLOGICAL CHEMISTRY
  chemical_topo: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemical_topo"></use></svg> Topological Chemistry — Help',
    body:
      _hSection('What it is for',
        '<p>Reactions with <b>topological structures</b> (SMILES notation or formula). Allows molecule drawing.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the instruction.',
        '<b>Equation</b>: type in SMILES/formula, or click <b><svg class="hs-ico"><use href="#ico-tool-structure"></use></svg> Draw (JSME)</b> to build it visually.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Refresh</b> displays the reaction preview.'
      ])) +
      _hSection('Scoring PRT (advanced)', _hList([
        'The grading is split between several criteria: arrow (PRT1), atoms (N0), charges (N1), formulas (N2), coefficients (N4).',
        'The sum <b>PRT1 + N0 + N1 + N2 + N4 must equal 100 %</b> (nodes 3 and 5 are backups).',
        'The banner displays "Sum = 100 %" when the distribution is correct.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUCLEAR
  nuclear: {
    title: '<svg class="hs-ico"><use href="#ico-type-nuclear"></use></svg> Nuclear Reactions — Help',
    body:
      _hSection('What it is for',
        '<p>The student completes/writes a <b>nuclear reaction</b> using isotope notation.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the instruction.',
        'Build the reaction with the toolbar: <b>isotope</b> <code>{}^{A}_{Z}X</code>, operators <b>+</b> and <b>→</b>, particles <b>α</b>, <b>β⁻</b>, <b>β⁺</b>, <b>γ</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Preview</b> to check the rendering, <b><svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Clear</b> to start over.'
      ])) +
      _hSection('Tip',
        '<p>Check conservation: the sum of mass numbers (A) and atomic numbers (Z) must be identical on each side of the arrow.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── FREE COMPOSITION
  composition: {
    title: '<svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Free Composition — Help',
    body:
      _hSection('What it is for',
        '<p>Question with a <b>free written answer</b> (text, formulas, formatting). <b>Not automatically graded</b>: the teacher grades it in Moodle.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: the question asked (images, LaTeX, tables possible).',
        '<b>How many points</b>: informs the student of the weight of the question.',
        '<b>Student editor size</b>: according to the expected answer length.',
        '<b>Message under editor</b>: instruction displayed to the student.'
      ])) +
      _hSection('Reminder',
        '<p>STACK does not grade this question: plan for manual correction.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INEQUALITIES
  inequation: {
    title: '<svg class="hs-ico"><use href="#ico-type-inequation"></use></svg> Inequalities — Help',
    body:
      _hSection('What it is for',
        '<p>The student solves an <b>inequality</b> (linear, quadratic or absolute value) and enters the <b>solution set</b> in STACK interval notation. AlgEquiv verifies equivalence.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a common example.',
        '<b>Type</b>: linear <code>ax+b ▷ 0</code>, quadratic <code>ax²+bx+c ▷ 0</code>, absolute value <code>|ax+b| ▷ c</code>.',
        '<b>Operator</b>: >, ≥, &lt;, ≤.',
        '<b>Coefficients a, b, c</b> depending on the type chosen.',
        '<b>Solution set</b>: auto-computed in most cases; correct if needed.',
        '<b>Question text</b>: via ✏️ Editor.',
        '<b>Feedback</b> correct / incorrect.'
      ])) +
      _hSection('STACK interval notation', _hList([
        '<code>oo(a,b)</code> = (a, b) open on both sides.',
        '<code>oc(a,b)</code> = (a, b] open left, closed right.',
        '<code>co(a,b)</code> = [a, b) closed left, open right.',
        '<code>cc(a,b)</code> = [a, b] closed on both sides.',
        '<code>union(A,B)</code> = A ∪ B (two disjoint intervals).',
        '<code>inf</code> = +∞, <code>-inf</code> = −∞.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BASE N
  basen: {
    title: '<svg class="hs-ico"><use href="#ico-type-basen"></use></svg> Base-N Conversion — Help',
    body:
      _hSection('What it is for',
        '<p>The student <b>converts a number</b> between bases (binary, octal, decimal, hexadecimal). STACK verifies algebraic equality.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a common example to fill fields automatically.',
        '<b>Question type</b>: direct conversion, bit value, base-N representation.',
        '<b>Source number</b> + <b>source base</b> (e.g. 1010 in base 2).',
        '<b>Target base</b>: the base the student must convert to.',
        '<b>The preview</b> computes the correct answer automatically.'
      ])) +
      _hSection('Tip',
        '<p>Hexadecimal: letters A–F represent 10–15. Make sure students know whether to answer in decimal or hex.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ELECTRICAL CIRCUITS
  circuit: {
    title: '<svg class="hs-ico"><use href="#ico-type-circuit"></use></svg> Electrical Circuits — Help',
    body:
      _hSection('What it is for',
        '<p>Electrical circuit laws: <b>Ohm\'s law</b>, <b>series/parallel</b> associations, current, power. Numerical answer verified by STACK (NumRelative, 1%).</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a circuit scenario.',
        '<b>Question type</b>: Ohm\'s law, series/parallel resistance, current, power…',
        '<b>Parameters</b>: enter U (V), I (A), R (Ω), P (W) depending on scenario.',
        '<b>The preview</b> shows the formula and expected result.',
        '<b>Question text</b> (optional): customise via the editor.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BOOLEAN LOGIC
  logique: {
    title: '<svg class="hs-ico"><use href="#ico-type-logique"></use></svg> Boolean Logic — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>truth tables</b>, expression <b>simplification</b> and logical <b>equivalences</b>. STACK uses PropLogic for verification.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose an operator or law (De Morgan, XOR…).',
        '<b>Question type</b>: truth table (one cell), simplification, equivalence.',
        '<b>Boolean expression</b>: <code>A and B</code>, <code>not A</code>, <code>A xor B</code>, <code>A implies B</code>.',
        '<b>The preview</b> displays the full truth table and expected value.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── COMPLEX NUMBERS
  complexe: {
    title: '<svg class="hs-ico"><use href="#ico-type-complexe"></use></svg> Complex Numbers — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>algebraic form</b>, <b>modulus</b>, <b>argument</b> and <b>conjugate</b> of a complex number. STACK verifies algebraic equivalence.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose an operation type.',
        '<b>Real (a) and imaginary (b) parts</b> of z = a + bi.',
        '<b>Question type</b>: algebraic form, modulus, argument, conjugate, sum/product.',
        '<b>The preview</b> shows the answer in Maxima syntax.'
      ])) +
      _hSection('Maxima syntax', _hList([
        '<code>%i</code> represents i (imaginary unit).',
        'Argument as a fraction of π: <code>%pi/4</code>, <code>3*%pi/4</code>…'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CALCULUS
  calcul: {
    title: '<svg class="hs-ico"><use href="#ico-type-calcul"></use></svg> Differential & Integral Calculus — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>derivatives</b>, <b>antiderivatives</b> and <b>definite integrals</b>. STACK uses <code>Diff</code>, <code>Antidiff</code> or <code>AlgEquiv</code>.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a function type (polynomial, sin, exp, ln…).',
        '<b>Question type</b>: derivative, antiderivative, definite integral, numerical value.',
        '<b>Function f(x)</b>: Maxima syntax — e.g. <code>x^3+2*x</code>, <code>sin(x)</code>.',
        '<b>Bounds a, b</b>: for the definite integral ∫[a,b] f(x) dx.',
        '<b>The preview</b> shows the computed answer.'
      ])) +
      _hSection('Maxima syntax', _hList([
        'Derivative: <code>diff(f,x)</code> — Antiderivative: <code>integrate(f,x)</code>.',
        'Natural log: <code>log(x)</code> (not ln).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STATISTICS
  statistiques: {
    title: '<svg class="hs-ico"><use href="#ico-type-statistiques"></use></svg> Statistics — Help',
    body:
      _hSection('What it is for',
        '<p>Statistical calculations on a dataset: <b>mean</b>, <b>median</b>, <b>variance</b>, <b>std dev</b>, <b>quartiles</b>, <b>range</b>. STACK verifies with AlgEquiv.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a sample dataset.',
        '<b>Question type</b>: mean, median, variance, std dev, Q1, Q3, range, weighted mean.',
        '<b>Data</b>: comma-separated values (e.g. <code>3, 7, 2, 9, 5</code>).',
        '<b>Frequencies</b>: for weighted mean (same count as data values).',
        '<b>The preview</b> computes the expected answer.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATRICES
  matrices: {
    title: '<svg class="hs-ico"><use href="#ico-type-matrices"></use></svg> Matrices — Help',
    body:
      _hSection('What it is for',
        '<p><b>Linear algebra</b> calculations: matrix product, determinant, transpose, trace. STACK accepts <code>matrix([a,b],[c,d])</code> notation.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose an operation (product, determinant…).',
        '<b>Question type</b>: product A×B, determinant, transpose, trace, inverse.',
        '<b>Size</b>: 2×2 or 3×3.',
        '<b>Matrix entries</b>: fill in the coefficients for matrix A (and B if needed).',
        '<b>The preview</b> computes and shows the result in Maxima syntax.'
      ])) +
      _hSection('Student answer syntax',
        '<p>Student types: <code>matrix([1,2],[3,4])</code> for a 2×2 matrix.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GEOMETRY
  geometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-geometrie"></use></svg> Analytic Geometry — Help',
    body:
      _hSection('What it is for',
        '<p><b>2D/3D geometry</b> questions: distance, midpoint, vector norm, dot product, collinearity. STACK verifies with AlgEquiv (accepts <code>sqrt(n)</code>).</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a 2D or 3D example.',
        '<b>Question type</b>: distance, midpoint, norm, dot product, collinearity, 3D.',
        '<b>Coordinates</b> of points A, B, C (x, y, z fields as needed).',
        '<b>The preview</b> displays the exact value in Maxima syntax.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── SEQUENCES
  suites: {
    title: '<svg class="hs-ico"><use href="#ico-type-suites"></use></svg> Number Sequences — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>arithmetic</b> and <b>geometric sequences</b>: general term, partial sum, limit. STACK verifies with AlgEquiv.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a sequence type.',
        '<b>Question type</b>: term u(n), partial sum S(n), limit, nature of sequence.',
        '<b>u₀</b> (first term) and <b>r or d</b> (ratio/difference).',
        '<b>Rank n</b> for terms and sums (integer ≥ 0).',
        '<b>The preview</b> computes the expected answer.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PROBABILITY
  probabilites: {
    title: '<svg class="hs-ico"><use href="#ico-type-probabilites"></use></svg> Probability — Help',
    body:
      _hSection('What it is for',
        '<p><b>Probability</b> questions: combinations, binomial distribution (P(X=k), E(X), Var(X)), conditional probability, union. STACK verifies with AlgEquiv.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a probability scenario.',
        '<b>Question type</b>: C(n,k), P(X=k), E(X), Var(X), P(A|B), P(A∪B).',
        '<b>Parameters</b>: n, k (integers) and p (probability, 0–1).',
        '<b>P(A), P(B), P(A∩B)</b> for compound events.',
        '<b>The preview</b> computes the exact answer (fraction where possible).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── TRIGONOMETRY
  trigonometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-trigonometrie"></use></svg> Trigonometry — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>exact values</b> (sin, cos, tan), <b>trigonometric identities</b> and <b>equations</b>. STACK enforces exact answers (<code>forbidfloat</code>).</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a standard angle (π/6, π/4, π/3, π/2…).',
        '<b>Question type</b>: exact value of sin/cos/tan, identity, trig equation.',
        '<b>Angle θ</b>: Maxima syntax — e.g. <code>%pi/6</code>, <code>%pi/4</code>, <code>2*%pi/3</code>.',
        '<b>The preview</b> shows the exact value and its Maxima form.'
      ])) +
      _hSection('Tip',
        '<p>Decimals are <b>forbidden</b>: students must answer with fractions or radicals (<code>sqrt(3)/2</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── POLYNOMIALS
  polynomes: {
    title: '<svg class="hs-ico"><use href="#ico-type-polynomes"></use></svg> Quadratic Polynomials — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on the <b>trinomial ax²+bx+c</b>: discriminant, roots, Vieta\'s formulas, number of real roots. STACK verifies with AlgEquiv.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a trinomial.',
        '<b>Question type</b>: discriminant Δ, roots x₁/x₂, sum x₁+x₂, product x₁×x₂, root count.',
        '<b>Coefficients a, b, c</b> (integers or decimals).',
        '<b>The preview</b> computes Δ and roots in real time.'
      ])) +
      _hSection('Vieta\'s formulas',
        '<p>x₁+x₂ = −b/a and x₁×x₂ = c/a (without computing roots explicitly).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LIMITS
  limites: {
    title: '<svg class="hs-ico"><use href="#ico-type-limites"></use></svg> Function Limits — Help',
    body:
      _hSection('What it is for',
        '<p>Questions on <b>limits</b>: at infinity, at a point, indeterminate forms. STACK verifies with AlgEquiv. <b>The expected answer is entered manually</b> by the teacher.</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a function and reference point.',
        '<b>Limit type</b>: x→+∞, x→−∞, x→a (finite), x→a⁺.',
        '<b>Expression f(x)</b>: Maxima syntax — e.g. <code>(x^2-1)/(x-1)</code>, <code>sin(x)/x</code>.',
        '<b>Expected answer</b>: enter explicitly (<code>inf</code>, <code>-inf</code>, <code>2</code>, <code>%pi</code>…).',
        '<b>The preview</b> shows the formula without automatic computation.'
      ])) +
      _hSection('Special Maxima values', _hList([
        '<code>inf</code> → +∞, <code>minf</code> → −∞.',
        '<code>%pi</code> → π, <code>1/2</code> → ½.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PHYSICS
  physique: {
    title: '<svg class="hs-ico"><use href="#ico-type-physique"></use></svg> Physics — Mechanics — Help',
    body:
      _hSection('What it is for',
        '<p>Classical mechanics calculations: <b>MRUA</b>, <b>free fall</b>, kinetic/potential energy, mechanical energy conservation, Newton\'s 2nd law. Numerical answer verified with 1% tolerance (NumRelative).</p>') +
      _hSection('How to fill', _hList([
        '<b>Preset</b>: choose a physics scenario.',
        '<b>Question type</b>: v(t), x(t), height h, time t, KE = ½mv², PE = mgh, final v (EM conservation), F = ma.',
        '<b>Kinematic parameters</b>: v₀ (m/s), a (m/s²), t (s).',
        '<b>Mechanical parameters</b>: m (kg), h or v (m or m/s).',
        '<b>The preview</b> shows the formula and numerical result.'
      ])) +
      _hSection('Tip',
        '<p>g = 9.81 m/s² is hard-coded. For free fall, only t and h are relevant; unused fields are hidden automatically.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── OSCILLOSCOPE
  oscilloscope: {
    title: '<svg class="hs-ico"><use href="#ico-type-oscilloscope"></use></svg> Oscilloscope — Help',
    body:
      _hSection('What it is for',
        '<p>Interactive <b>oscilloscope simulation</b>: the student adjusts the time base (Δt, purple) and vertical sensitivity (ΔV, red) with sliders, then measures a physical quantity (period, frequency, RC time constant, delay…) on the trace.</p>') +
      _hSection('How to fill', _hList([
        '<b>Measurement type</b>: Period/Frequency, RC Charge, RC Discharge, or Delay between 2 channels (ultrasound).',
        '<b>Teaching mode</b>: <b>Guided</b> details every step (unit, value, common confusion traps); <b>Autonomous</b> checks each quantity with generic feedback; <b>Expert</b> gives no hint at all, only the result counts. This setting does not change the trace difficulty, only the feedback detail level.',
        'Depending on the type chosen, specific parameters appear: signal shape and frequency (fixed or random) for Period/Frequency; E and τ for RC Charge/Discharge; carrier/burst frequencies and Δt min-max for Delay.',
        '<b>Initial scope settings</b> (time base SH, sensitivity SV): check <b>Auto</b> for automatic calibration consistent with the signal, or uncheck to pick a value manually from the list.'
      ])) +
      _hSection('Tip',
        '<p>Guided mode is recommended for a first classroom use: it explicitly flags common confusion traps (e.g. mixing up half-period and period). Switch to Expert for summative assessment.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── DIFFRACTION-INTERFERENCE
  diffraction: {
    title: '<svg class="hs-ico"><use href="#ico-type-diffraction"></use></svg> Diffraction-Interference — Help',
    body:
      _hSection('What it is for',
        '<p>The student observes a <b>diffraction/interference pattern</b> (single slit, double slit, Young\'s double hole, circular hole, square hole) and derives a physical quantity (slit width, wavelength…) from measurements on the pattern.</p>') +
      _hSection('How to fill', _hList([
        '<b>Type</b>: aperture shape (single slit, double slit, Young\'s double hole, circular hole, square hole).',
        '<b>Mode</b>: <b>Screen</b> (the student measures directly on the projected pattern) or <b>Sensor</b> (pattern plus a light-intensity curve).',
        '<b>Random parameters (a, D, b)</b>: check for a random draw on every question, or uncheck to fix the slit width a, screen distance D, hole spacing b and wavelength λ manually.',
        '<b>Relative tolerance (%)</b>: accepted error margin on the numerical answer (e.g. 10% accepts 632 nm for an expected value of 635 nm).',
        '<b>Statement</b>: write the question asked, e.g. "Measure the distance with the graticule and deduce λ".'
      ])) +
      _hSection('Tip',
        '<p>The Spacing b field only appears for two-aperture patterns (double slit, Young\'s double hole) — it is hidden automatically for single slit/circular hole/square hole.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ORDERING
  ord: {
    title: '<svg class="hs-ico"><use href="#ico-type-ord"></use></svg> Ordering — Help',
    body:
      _hSection('What it is for',
        '<p>The student <b>rearranges elements into the correct order</b> by drag-and-drop (STACK Parsons block). Ideal for algorithms, timelines, reasoning steps or code sequences.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement</b>: write the instruction (HTML/LaTeX accepted).',
        '<b>＋ Add an element</b>: each line is one item to reorder. The order you enter is the correct order.',
        '<b>Reusable elements (clone)</b>: check if the same element can appear more than once in the answer.',
        'Elements are presented to the student in a <b>randomly shuffled order</b> by STACK.'
      ])) +
      _hSection('Tip',
        '<p>Write each element in a self-contained way. Avoid phrasing like "then…" or "next…" which reveals the order.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── IMAGE CLICK
  imgclick: {
    title: '<svg class="hs-ico"><use href="#ico-type-imgclick"></use></svg> Click on Image — Help',
    body:
      _hSection('What it is for',
        '<p>The student <b>clicks on the correct area of an image</b> (biology diagram, geographical map, physics schema…). The target zone remains <b>invisible</b> to the student.</p>') +
      _hSection('How to fill', _hList([
        '<b>Image URL</b>: direct link to the image (must be reachable from Moodle).',
        '<b>Width / Height</b>: display size in pixels (the image is resized).',
        '<b>Instruction</b>: question shown to the student, e.g. "Click on the left ventricle".',
        '<b>Correct zone — Circle</b>: X centre, Y centre, Radius (all as % of width/height).',
        '<b>Correct zone — Rectangle</b>: X left, Y top, X right, Y bottom (in %).',
        '<b>Zone label</b>: text used in feedback, e.g. "left ventricle".'
      ])) +
      _hSection('Coordinates in %',
        '<p>0 % = left (or top) edge, 100 % = right (or bottom) edge. A centred circle with radius 10 %: X=50, Y=50, R=10.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── JSXGRAPH DRAG-AND-DROP
  jxgdrop: {
    title: '<svg class="hs-ico"><use href="#ico-type-jxgdrop"></use></svg> JSXGraph Drag-and-Drop — Help',
    body:
      _hSection('What it is for',
        '<p>The student <b>drags labels (proposals) onto an image</b> and drops them into defined zones (labelled diagram, map, experimental setup…). Cairn for Stack automatically generates the responsive JSXGraph code and the grading.</p>') +
      _hSection('How to fill', _hList([
        '<b>Background image</b>: upload an image (PNG/JPG) — it serves as the visual support for zones and proposals.',
        '<b>Proposals</b>: click <b>＋ Add a proposal</b> for each label the student will be able to drop.',
        '<b>Drop zones</b>: <b>Circle</b>/<b>Rectangle</b> tools to place a zone on the image (click on the image), <b>Select</b> to adjust an existing zone (centre/radius or position/size in the right-hand panel).',
        'For each selected zone, check the proposal(s) considered correct for that zone under <b>Accepted answers</b>.',
        '<b>Drop zones visible</b>: uncheck to hide the zone outline from the student (invisible zone, harder) — zones remain active for grading, only the display changes.'
      ])) +
      _hSection('Tip',
        '<p>The same proposal can be accepted in several zones if the question requires it. Test the drag-and-drop in the preview before exporting — the answer freezes after dropping, just like in a real Moodle test.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RGB / CMYK
  rvbcmj: {
    title: '<svg class="hs-ico"><use href="#ico-type-rvbcmj"></use></svg> RGB / CMYK — Help',
    body:
      _hSection('What it is for',
        '<p>The student <b>identifies the colour of an object</b> by observing it through different <b>colour filters</b> (Red-Green-Blue or Cyan-Magenta-Yellow). Used in optics and arts education.</p>') +
      _hSection('How to fill', _hList([
        '<b>Filter type</b>: RGB (additive synthesis) or CMY (subtractive synthesis).',
        '<b>Greyscale</b>: display the image in black-and-white before filtering (more realistic).',
        '<b>Object image</b>: upload a PNG/JPG — it will be Base64-encoded inside the XML.',
        '<b>Correct colour</b>: select the object\'s actual colour (Red, Green, Blue, Yellow, Cyan, Magenta, White, Black).',
        '<b>Preview filters</b>: check how the image looks through each filter before exporting.'
      ])) +
      _hSection('Teaching principle',
        '<p>In RGB: a red filter only passes the red component — a green object appears dark through a red filter. In CMY: a cyan filter absorbs red, letting green and blue through.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MEASUREMENT UNCERTAINTY
  incertitude: {
    title: '<svg class="hs-ico"><use href="#ico-type-incertitude"></use></svg> Measurement uncertainty — Help',
    body:
      _hSection('What it is for',
        '<p>The student processes a series of <b>experimental measurements</b> and computes the <b>measurement uncertainty</b> (GUM method): type A uncertainty (statistical, from the measurements), type B uncertainty (instrumental), combined uncertainty, expanded uncertainty, and the final result notation <code>X = x̄ ± U</code>. Each checked step is graded independently.</p>') +
      _hSection('How to fill', _hList([
        '<b>Quantity / Symbol / Unit</b>: describe the measurement (e.g. Length, L, cm) — used to automatically generate the feedback.',
        '<b>Type A</b>: either a manually entered <i>list of measurements</i>, or a <i>randomly generated</i> set calibrated on a target mean and standard deviation.',
        '<b>Type B</b>: choose the source of instrumental error — <i>resolution</i> (u_B = q/√12), <i>manufacturer tolerance</i> (u_B = Δ/√3), <i>calibration certificate</i> (u_B = U_cert/k_cert), or a directly <i>imposed value</i>.',
        '<b>Result presentation</b>: number of significant figures of U (1 or 2), optional round-up, coverage factor k (1 or 2).',
        '<b>Evaluated steps</b>: check which steps the student must compute (mean, standard deviation, uA, uB, uc, U, final notation) — each generates its own separately graded answer field.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'The Type A random mode uses calibrated uniform noise (not a true normal distribution) to exactly match the requested standard deviation.',
        'The "Final notation" step expects the format <code>X = x̄ ± U</code> (including unit) — grading tolerates spaces, the <code>+/-</code> notation, and trailing zeros.',
        'The Student\'s t-factor (small n, confidence level) is not yet available in this module — planned for a future iteration.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── Z-SCORE (METROLOGICAL COMPATIBILITY)
  zscore: {
    title: '<svg class="hs-ico"><use href="#ico-type-zscore"></use></svg> Z-score — Help',
    body:
      _hSection('What it is for',
        '<p>The student compares a <b>measured value</b> to a <b>reference value</b> by computing the <b>metrological compatibility score</b>: <code>z = |x_measured - x_reference| / u_c</code>, then concludes whether the result is compatible with the reference (z below a configurable threshold) or not.</p>') +
      _hSection('How to fill', _hList([
        '<b>Quantity / Symbol / Unit</b>: describe the measurement — used to automatically generate the question text and feedback.',
        '<b>Given values</b>: x_measured, x_reference and u_c are entered directly by the teacher (fixed values, no random generation) and automatically shown in the question text.',
        '<b>Compatibility threshold</b>: comparison value for the conclusion (compatible if z &lt; threshold) — 2 by default, but fully configurable.',
        '<b>Evaluated steps</b>: check "Z-score calculation" and/or "Compatibility conclusion" — each generates its own separately graded answer field.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'This module is a standalone type, distinct from the "Measurement uncertainty" type: it does not reuse any data entered elsewhere.',
        'The compatibility conclusion is a dropdown (Compatible / Incompatible), not a numeric field.',
        'No random generation is available in this version (fixed-value MVP only).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CAMERA (EXPOSURE)
  apn: {
    title: '<svg class="hs-ico"><use href="#ico-type-apn"></use></svg> Camera (exposure) — Help',
    body:
      _hSection('What it is for',
        '<p>The student finds, via a <b>multiple-choice question</b>, the value of the unknown setting (aperture, shutter speed or ISO) that keeps the <b>same exposure</b> when one or two of the other two settings change, starting from an initial configuration given in the question text.</p>') +
      _hSection('How to fill', _hList([
        '<b>Setting to find</b>: which of the three settings (Speed / Aperture / ISO) the student must find — it becomes the multiple-choice question.',
        '<b>Changed setting(s)</b>: among the two remaining settings, check the one(s) that change between the initial configuration and the target configuration (at least one checked).',
        'The initial configuration (starting values of the 3 settings) and the target value of the changed setting(s) are described in the <b>question text</b> — the module does not generate these values, it only grades the multiple-choice answer.',
        '<b>Correct/incorrect answer messages</b>: optional, replace the default text.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'The exposure triangle follows the "EV stops" rule: a 1-stop change in one setting must be compensated by 1 stop (in the right direction) of another to keep the same exposure — this is the logic graded by the multiple-choice question, not a calculation shown to the student.',
        'No random generation in this version: the numeric values (apertures, speeds, ISO) are written by hand in the question text.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CHEMICAL NOMENCLATURE
  nomenclature: {
    title: '<svg class="hs-ico"><use href="#ico-type-nomenclature"></use></svg> Chemical nomenclature — Help',
    body:
      _hSection('What it is for',
        '<p>The student identifies the <b>IUPAC name</b> and/or <b>family</b> of a molecule described by its <b>SMILES</b> formula, or checks the <b>functional groups</b> it contains. Three independent modes depending on the teaching goal.</p>') +
      _hSection('How to fill', _hList([
        '<b>Fixed molecule</b>: enter the SMILES, the expected IUPAC name and the expected family. Name matching accepts hyphens/spaces/case interchangeably (tolerant comparison, no exact syntax required).',
        '<b>Random generator</b>: a molecule is randomly drawn from a built-in database, filtered by <b>family/families</b> (checkboxes, several allowed; none checked = all) and optionally a <b>max carbon count</b>. If no molecule matches the filters, the draw automatically falls back to the full set instead of failing.',
        '<b>Functional group analysis (checkboxes)</b>: enter a SMILES and two comma-separated lists — the functional groups actually present, and decoy groups that are absent. The student checks the ones they identify; they are shuffled randomly in the list shown to them.',
        'The <b>🧬 View in 3D</b> button in the student preview loads an interactive 3D representation of the molecule (requires a JSmol server configured in Admin) — loaded only on click, never automatically.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'In Checkbox mode, the score is proportional to the number of correct checks minus incorrect ones (not all-or-nothing grading).',
        'The 3D view in the exported question depends on an external (self-hosted) JSmol server configured by the administrator; without it, the 3D iframe does not show in Moodle but the rest of the question still works normally.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── POINT KINEMATICS
  cinematique: {
    title: '<svg class="hs-ico"><use href="#ico-type-cinematique"></use></svg> Point kinematics — Help',
    body:
      _hSection('What it is for',
        '<p>From a <b>chronophotograph</b> of a point M in motion, the student measures the norms of the velocity vectors v_i and v_{i+1} (from successive position differences), then constructs the velocity variation vector Δv_i = v_{i+1} − v_i using the <b>Chasles relation</b> (cloning, selection, flipping, magnetic snapping in the preview).</p>') +
      _hSection('How to fill', _hList([
        '<b>Digitization workshop</b>: click each position M0, M1, M2… in chronological order, on a blank background or an imported guide image (the image is never saved nor exported — only the clicked points and the calibration are).',
        '<b>Calibration</b>: place 2 markers in Calibration mode, then enter the real distance (in meters) between them, to convert workshop pixels into meters.',
        '<b>Interval between 2 photos (Δt)</b>: duration between two consecutive M points.',
        '<b>Velocity calculation method</b>: "Next point" (2019 curriculum, M_iM_{i+1}/Δt) or "Symmetric derivative" (M_{i-1}M_{i+1}/2Δt) — the latter is recommended for circular or parabolic motion, where it gives a correct tangent direction.',
        '<b>Starting index i</b>: determines which points are used to compute v_i (segment M_iM_{i+1}) then v_{i+1} (segment M_{i+1}M_{i+2}) — an error message appears in the preview if i is out of range for the number of digitized points.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'With the "Symmetric derivative" method, index i must leave room on both sides (needs M_{i-1} and M_{i+2}) — check the preview if an error message appears.',
        'The imported guide image is only a visual aid for you while digitizing: it is part neither of the saved question nor of the Moodle export.',
        'No random generation in this version: the digitized positions and Δt are fixed values.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── HARDY-WEINBERG (BIOLOGY)
  hardyweinberg: {
    title: '<svg class="hs-ico"><use href="#ico-type-hardyweinberg"></use></svg> Hardy-Weinberg — Help',
    body:
      _hSection('What it is for',
        '<p>For a population at <b>Hardy-Weinberg equilibrium</b>, the student derives, from the observed percentage of individuals with the recessive phenotype, the <b>recessive allele frequency q</b>, the dominant allele frequency <b>p</b>, and the <b>heterozygote frequency</b> (2pq).</p>') +
      _hSection('How to fill', _hList([
        '<b>Species / Dominant phenotype / Recessive phenotype</b>: dress up the statement (e.g. "mice", "grey coat", "white coat").',
        '<b>Possible frequencies for q</b>: list of fractions or numbers separated by commas (Maxima syntax, e.g. <code>1/10,2/10,3/10</code>) — a value is drawn at random <b>server-side, via Maxima, on every attempt by the student</b>: a single STACK question therefore covers every variant, with no draw happening on the teacher side.',
        '<b>Statement / instructions</b>: optional text added before the generated question.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'The random draw is native Maxima (not a JS draw before export): unlike "Z-score" or "Uncertainty", the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'All three sub-questions (q, p, heterozygotes) are always present, with no toggleable step: the scenario only makes pedagogical sense with all three answers.',
        'A classic mistake is automatically diagnosed on the heterozygote sub-question: if the student answers with the frequency of <b>dominant</b>-phenotype individuals (1−q²) instead of the <b>heterozygotes</b> alone (2pq), a targeted feedback points it out.'
      ])) + _HELP_COMMON
  },

  croisements: {
    title: '<svg class="hs-ico"><use href="#ico-type-croisements"></use></svg> Crosses — Help',
    body:
      _hSection('What it is for',
        '<p>Given a cross involving <b>two independent genes</b> — a classic <b>autosomal</b> gene and an <b>X-linked</b> gene — the student computes the probability of the recessive phenotype for each gene separately, then the combined probability (since the two genes are independent, the probabilities multiply).</p>') +
      _hSection('How to fill', _hList([
        '<b>Species</b>: dresses up the statement (e.g. "the fruit fly").',
        '<b>Autosomal gene</b>: trait, dominant allele letter, and dominant/recessive phenotype names (e.g. "wing shape", V, "normal wings", "vestigial wings").',
        '<b>X-linked gene</b>: same settings for the second gene (e.g. "eye colour", W, "normal eyes", "white eyes").',
        '<b>Statement / instructions</b>: optional text added before the generated question.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with "Hardy-Weinberg", the two cross types per gene are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'All three sub-questions (autosomal probability, X-linked probability, total probability) are always present, with no toggleable step.',
        'A classic mistake is automatically diagnosed on the X-linked sub-question: if the student naively multiplies P(male)=1/2 by the autosomal ratio 1/4 instead of reading the X-linked cross grid directly (sex and phenotype are not independent for an X-linked gene), a targeted feedback points it out.'
      ])) + _HELP_COMMON
  },

  distancegenetique: {
    title: '<svg class="hs-ico"><use href="#ico-type-distancegenetique"></use></svg> Genetic distance — Help',
    body:
      _hSection('What it is for',
        '<p>Given the phenotype counts observed in the offspring of a test-cross between two linked genes, the student first computes the <b>recombination rate</b> (recombinant count / total count), then the corresponding <b>genetic distance</b> in centiMorgans (cM).</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible total offspring counts</b>: comma-separated list of whole numbers; one is drawn at random on every attempt.',
        '<b>Possible recombination percentages</b>: comma-separated list of numbers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with "Hardy-Weinberg" and "Crosses", the total offspring count and the recombination rate are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Both sub-questions (recombination rate, distance in cM) are always present, with no toggleable step.',
        'A classic mistake is automatically diagnosed on the distance sub-question: if the student gives back the recombination rate without multiplying by 100 (forgetting the cM conversion), a targeted feedback points it out.'
      ])) + _HELP_COMMON
  },

  horlogemoleculaire: {
    title: '<svg class="hs-ico"><use href="#ico-type-horlogemoleculaire"></use></svg> Molecular clock — Help',
    body:
      _hSection('What it is for',
        '<p>Given the number of different nucleotides between a homologous sequence compared across two species and the estimated neutral mutation rate for that gene, the student first establishes the <b>literal expression</b> of the divergence date <i>T</i>, then computes its <b>numerical value</b>.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible sequence lengths</b>: comma-separated list of whole numbers; one is drawn at random on every attempt.',
        '<b>Possible mutation rates</b>: comma-separated list of numbers; one is drawn at random on every attempt.',
        '<b>Possible divergence percentages</b>: comma-separated list of numbers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (length, rate, number of differences) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Both sub-questions (literal formula, numerical value of T) are always present, with no toggleable step.',
        'A classic mistake is automatically diagnosed on both sub-questions: if the student forgets the factor 2 (mutations accumulate independently in both lineages since divergence), a targeted feedback points it out, both on the formula and on the numerical value.'
      ])) + _HELP_COMMON
  },
  radiochronologie: {
    title: '<svg class="hs-ico"><use href="#ico-type-radiochronologie"></use></svg> Radiochronology — Help',
    body:
      _hSection('What it is for',
        '<p>Given the remaining proportion <i>Nfrac</i> of the parent radioactive isotope in a rock sample and that isotope\'s decay constant, the student first establishes the <b>literal expression</b> of the rock\'s age <i>T</i>, then computes its <b>numerical value</b>.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible Nfrac proportions</b>: comma-separated list of fractions (Maxima syntax, e.g. 1/2); one is drawn at random on every attempt.',
        '<b>Possible lam_a coefficients</b>: comma-separated list of whole numbers; one is drawn at random on every attempt.',
        '<b>Possible lam_b exponents</b>: comma-separated list of whole numbers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (Nfrac, lam_a, lam_b) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Both sub-questions (literal formula, numerical value of T) are always present, with no toggleable step.',
        'A classic mistake is automatically diagnosed on both sub-questions: if the student forgets the minus sign in front of the natural logarithm (Nfrac < 1, so ln(Nfrac) is negative), a targeted feedback points it out, both on the formula and on the numerical value.'
      ])) + _HELP_COMMON
  },
  ondesismique: {
    title: '<svg class="hs-ico"><use href="#ico-type-ondesismique"></use></svg> Seismic waves — Help',
    body:
      _hSection('What it is for',
        '<p>Given an epicentral distance <i>d</i> and the propagation speeds of the P and S waves (<i>v_P</i>, <i>v_S</i>), the student computes the <b>delay</b> Δt between the arrival of the P wave and the arrival of the S wave at a seismic station.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible epicentral distances d</b>: comma-separated list of numbers; one is drawn at random on every attempt.',
        '<b>Possible P-wave speeds</b>: comma-separated list of numbers; one is drawn at random on every attempt.',
        '<b>Possible S-wave speeds</b>: comma-separated list of numbers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (d, v_P, v_S) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Unlike the other SVT types in this generator, there is only a single sub-question (no literal-formula / numerical-value split).',
        'A classic mistake is automatically diagnosed: if the student reverses the order of the subtraction (d/v_P - d/v_S instead of d/v_S - d/v_P), a targeted feedback reminds them that the P wave always arrives first because it is faster.'
      ])) + _HELP_COMMON
  },

  malthus: {
    title: '<svg class="hs-ico"><use href="#ico-type-malthus"></use></svg> Malthus — Help',
    body:
      _hSection('What it is for',
        '<p>Given an initial population <i>N₀</i>, a per-period multiplicative factor <i>q</i> and a duration <i>t</i> (number of elapsed periods), the student computes the <b>final population</b> using the exponential growth model \\( N_t = N_0 \\times q^t \\).</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible initial populations N₀</b>: comma-separated list of integers; one is drawn at random on every attempt.',
        '<b>Possible multiplicative factors q</b>: comma-separated list of numbers; one is drawn at random on every attempt.',
        '<b>Possible durations t</b>: comma-separated list of integers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (N₀, q, t) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Like seismic waves, there is only a single sub-question (no literal-formula / numerical-value split).',
        'Unlike the traditional wording ("the population doubles/triples every hour"), the generated statement stays generic ("multiplied by q") so the q factor remains genuinely configurable beyond 2 or 3.',
        'A classic mistake is automatically diagnosed: if the student uses t-1 periods instead of t (an off-by-one error), a targeted feedback points it out.'
      ])) + _HELP_COMMON
  },
  regle10: {
    title: '<svg class="hs-ico"><use href="#ico-type-regle10"></use></svg> Rule of 10% — Help',
    body:
      _hSection('What it is for',
        '<p>Given an initial biomass <i>B₀</i> (trophic level 1), the student applies the <b>rule of 10%</b> (\\( B_n = B_0 \\times 0.1^n \\), where <i>n</i> is the number of transfers between trophic levels) to a) compute the biomass reached at a given trophic level, then b) determine the maximum number of additional trophic levels a given food requirement can support.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible initial biomasses b0</b>: comma-separated list of numbers; one is drawn at random on every attempt.',
        '<b>Possible trophic levels (question a)</b>: comma-separated list of integers; one is drawn at random on every attempt.',
        '<b>Possible exponents k and factors m (question b)</b>: determine the tested food requirement \\( B_{need} = B_0 \\times m / 10^k \\); one value from each list is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (b0, n, k, m) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'Unlike the other SVT types (radiochronology, molecular clock, seismic waves, Malthus), this type does NOT diagnose a classic mistake via a PRT node cascade: each sub-question (a and b) stays a single node, giving the student direct correct/incorrect feedback without a targeted pedagogical diagnosis — this faithfully reproduces the structure of the reference hand-written XML template.',
        'Question b) is solved using a logarithm: \\( n_{max} = \\lfloor \\log(B_{need}/B_0)/\\log(0.1) \\rfloor \\) — the result is rounded down (floor) by default.'
      ])) + _HELP_COMMON
  },
  chi2: {
    title: '<svg class="hs-ico"><use href="#ico-type-chi2"></use></svg> Chi-squared test — Help',
    body:
      _hSection('What it is for',
        '<p>Chi-squared (χ²) goodness-of-fit test in ecology: the student compares the <b>observed</b> counts of 4 species to their <b>theoretical</b> counts (expected distribution 40% / 30% / 20% / 10%) to compute the statistic \\( \\chi^2 = \\sum \\dfrac{(O-T)^2}{T} \\).</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible total sample sizes</b>: comma-separated list of numbers (number of sampled individuals); one is drawn at random on every attempt.',
        '<b>Possible deviations (species A/B)</b> and <b>Possible deviations (species C/D)</b>: determine the gap between observed and theoretical counts for each species pair; one value from each list is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, all quantities (total sample size, deviations) are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'A single sub-question (χ² computation), with a 2-node PRT diagnostic cascade that catches the classic mistake of dividing by the <b>observed</b> count O instead of the <b>theoretical</b> count T in each term of the sum.',
        'The theoretical distribution (40%/30%/20%/10% across the 4 species) is fixed — a pedagogical scenario invariant — only the total sample size and the observed-theoretical deviations are configurable.'
      ])) + _HELP_COMMON
  },
  debit: {
    title: '<svg class="hs-ico"><use href="#ico-type-debit"></use></svg> Cardiac output — Help',
    body:
      _hSection('What it is for',
        '<p>Cardiac output calculation \\( Q = HR \\times SV \\) (heart rate × stroke volume), with a mandatory unit conversion of the stroke volume (given in mL) to liters per minute for the result.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible heart rates</b> and <b>Possible stroke volumes (mL)</b>: comma-separated lists of numbers; one value from each list is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, HR and SV are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'A single sub-question, with a 2-node PRT diagnostic cascade that catches the classic mistake of forgetting the mL → L conversion (result 1000 times too large): unlike the other SVT types, this diagnostic node grants <b>partial credit of 0.5</b> rather than a score of 0, since the calculation itself is correct — only the unit is wrong.'
      ])) + _HELP_COMMON
  },
  nernst: {
    title: '<svg class="hs-ico"><use href="#ico-type-nernst"></use></svg> Nernst potential — Help',
    body:
      _hSection('What it is for',
        '<p>Computes a neuron\'s resting potential using the simplified Nernst equation for the potassium ion K<sup>+</sup>: \\( E_K = 60 \\times \\log_{10}\\!\\left(\\dfrac{[K^+]_{ext}}{[K^+]_{int}}\\right) \\) (in mV), from the extra- and intracellular concentrations.</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible extracellular concentrations</b> and <b>Possible intracellular concentrations</b>: comma-separated lists of numbers; one value from each list is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, the concentrations are drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'A single sub-question, with a 2-node PRT diagnostic cascade that catches the classic mistake of swapping the extra- and intracellular concentrations in the ratio (the resulting potential becomes positive instead of negative).',
        'Since potassium is far more concentrated inside the cell, a correctly computed resting potential is always negative — this is the physiological invariant the diagnostic highlights.'
      ])) + _HELP_COMMON
  },
  dilutions: {
    title: '<svg class="hs-ico"><use href="#ico-type-dilutions"></use></svg> Serial dilutions — Help',
    body:
      _hSection('What it is for',
        '<p>Immunology titration: computes the dilution factor of a serum in tube n°<i>n</i> of a series of successive 1/10 dilutions (each tube receives a tenth of the previous tube\'s concentration), i.e. \\( 1/10^n \\).</p>') +
      _hSection('How to fill', _hList([
        '<b>Statement / instructions</b>: optional text added before the generated question.',
        '<b>Possible tube numbers</b>: comma-separated list of whole numbers; one is drawn at random on every attempt.'
      ])) +
      _hSection('Tips / pitfalls', _hList([
        'As with the other SVT types, the tube number is drawn by a native Maxima random draw (not a JS draw before export): the simulated preview cannot show a numeric value until the real preview (👁️ button) is requested — this is expected.',
        'A single sub-question, with a 2-node PRT diagnostic cascade that catches the classic mistake of <b>adding</b> the dilution factors (\\( 1/(10n) \\)) instead of <b>multiplying</b> them (\\( 1/10^n \\)).'
      ])) + _HELP_COMMON
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.en = HELP_CONTENT;
})();