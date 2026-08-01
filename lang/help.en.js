/* ════════════════════════════════════════════════════════════════
   STACKFORGE — HELP CONTENT: ENGLISH
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
        '<p>The student <b>drags labels (proposals) onto an image</b> and drops them into defined zones (labelled diagram, map, experimental setup…). Stackforge automatically generates the responsive JSXGraph code and the grading.</p>') +
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
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.en = HELP_CONTENT;
})();