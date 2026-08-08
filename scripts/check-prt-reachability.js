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

// Audit statique : détecte les branches PRT (vraie/fausse) qui ne peuvent jamais se
// déclencher, sur tous les générateurs à PRT chaîné. Ne modifie jamais l'app — lecture
// seule des générateurs, écrit uniquement bugPRT.txt à la racine du projet.
// Usage : npm run check-prt   (ou : node scripts/check-prt-reachability.js)
'use strict';

const fs = require('fs');
const path = require('path');

const { computePrtReachability, isPrtFeedbackReachable, findDanglingNodeRefs } = require(path.join('..', 'js', 'prt-reachability.js'));
const { buildPrtXml } = require(path.join('..', 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind } = require(path.join('..', 'js', 'fb-box.js'));
const { _mkFbGen, _mkInput } = require(path.join('..', 'js', 'gen-math-shared.js'));
const { wrapFb, algPrtNodeCanonical } = require(path.join('..', 'js', 'generators.js'));
const { buildKbdStackHTML } = require(path.join('..', 'js', 'keyboard.js'));
const { htmlEsc, rawEsc, escapeMaximaString } = require(path.join('..', 'js', 'data.js'));
const { jxgDropChunkedJsString } = require(path.join('..', 'js', 'gen-jxgdrop.js'));
const { _incTypeAVars, _incTypeBVars, _incRoundingVars, _incFinalRegex } = require(path.join('..', 'js', 'gen-incertitude-calc.js'));
const { _incStepDefs } = require(path.join('..', 'js', 'gen-incertitude-steps.js'));
const { _incStudentFactor, _incStudentConfidence, _incStudentDf } = require(path.join('..', 'js', 'gen-incertitude-student.js'));
const { _zsVars } = require(path.join('..', 'js', 'gen-zscore-calc.js'));

const I18N_STUB = { t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key };

// ── Stubs déterministes pour les dépendances spécifiques à un seul générateur (repris
// à l'identique des test/unit/gen-*.test.js correspondants, déjà validés) ──
function bnStrictParse(str, base) {
    var s = String(str == null ? '' : str).trim().toUpperCase();
    if (!s.length) return null;
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
    for (var i = 0; i < s.length; i++) { if (alphabet.indexOf(s[i]) === -1) return null; }
    return parseInt(s, base);
}
function bnSyntaxHint(format, toBase, fixedWidth) { return 'hint:' + format + ':' + toBase + ':' + fixedWidth; }
function _cpxGenFbgen(scenario, op, letter) { return '<p>fbgen:' + scenario + ':' + op + ':' + letter + '</p>'; }
// genComplexeCore lit le global bare `_cpxGenFbgen` (pas deps._cpxGenFbgen) — garde héritée
// de l'ordre de chargement navigateur, cf. test/unit/gen-math-complexe.test.js.
global._cpxGenFbgen = _cpxGenFbgen;
// gen-incertitude.js/gen-zscore.js appellent leurs helpers Maxima purs en GLOBAL BARE
// (partage de scope <script> en navigateur) — même republication que dans
// test/unit/gen-incertitude.test.js et test/unit/gen-zscore.test.js.
global.htmlEsc = htmlEsc;
global._incTypeAVars = _incTypeAVars;
global._incTypeBVars = _incTypeBVars;
global._incRoundingVars = _incRoundingVars;
global._incFinalRegex = _incFinalRegex;
global._incStepDefs = _incStepDefs;
global._incStudentFactor = _incStudentFactor;
global._incStudentConfidence = _incStudentConfidence;
global._incStudentDf = _incStudentDf;
global._zsVars = _zsVars;

const BASE_DEPS = { I18N: I18N_STUB, buildPrtXml: buildPrtXml, applyFbBox: applyFbBox, _mkFbGen: _mkFbGen, _mkInput: _mkInput };

// ── Regroupe toutes les dépendances "réelles" (pas de stubs) utilisées par les
// générateurs à feedback riche (wrapFb, inferFbKind, échappement, clavier...) —
// chaque cœur ne pioche que ce dont il a besoin via `deps.xxx || xxx`. ──
const RICH_DEPS = Object.assign({}, BASE_DEPS, {
    wrapFb: wrapFb, algPrtNodeCanonical: algPrtNodeCanonical, inferFbKind: inferFbKind,
    buildKbdStackHTML: buildKbdStackHTML, htmlEsc: htmlEsc, rawEsc: rawEsc,
    escapeMaximaString: escapeMaximaString, jxgDropChunkedJsString: jxgDropChunkedJsString
});

function baseGeoParams(scenario, dimSel) {
    return { bareme: 1, scenario: scenario, mode: 'fixe', dimSel: dimSel, fbOk: '', fbWrong: '', custText: '', fbGenRaw: '' };
}

const TARGETS = [
    {
        label: 'Base N', module: '../js/gen-basen.js', coreFn: 'genBasenCore',
        deps: Object.assign({}, BASE_DEPS, { bnStrictParse: bnStrictParse, bnSyntaxHint: bnSyntaxHint }),
        scenarios: [
            { label: 'fromBase=10,toBase=10', params: { format: 'S', fromBase: 10, toBase: 10, valueMode: 'fixe', valueBase: 'depart', bareme: 1, fbOk: '', fbWrong: '', text: '', fixedWidth: 0, valueMin: 0, valueMax: 10, valueRaw: '42', fbGen: '' } },
            { label: 'fromBase=2,toBase=10', params: { format: 'S', fromBase: 2, toBase: 10, valueMode: 'fixe', valueBase: 'depart', bareme: 1, fbOk: '', fbWrong: '', text: '', fixedWidth: 0, valueMin: 0, valueMax: 10, valueRaw: '1010', fbGen: '' } },
            { label: 'fromBase=10,toBase=2', params: { format: 'S', fromBase: 10, toBase: 2, valueMode: 'fixe', valueBase: 'depart', bareme: 1, fbOk: '', fbWrong: '', text: '', fixedWidth: 0, valueMin: 0, valueMax: 10, valueRaw: '10', fbGen: '' } }
        ]
    },
    {
        label: 'APN', module: '../js/gen-apn.js', coreFn: 'genApnCore', deps: BASE_DEPS,
        scenarios: [
            { label: 'nChanged=1', params: { bareme: 1, text: '', fbOk: '', fbWrong: '', unknown: 'V', changed: { D: true, V: false, I: false }, nChanged: 1, fbGen: '' } },
            { label: 'nChanged=2', params: { bareme: 1, text: '', fbOk: '', fbWrong: '', unknown: 'V', changed: { D: true, V: false, I: true }, nChanged: 2, fbGen: '' } }
        ]
    },
    {
        label: 'Acide-Base', module: '../js/gen-acidebase.js', coreFn: 'genAcideBaseCore', deps: BASE_DEPS,
        scenarios: [
            { label: 'tangentes', params: { abMethod: 'tangentes', abType: 'af-bf', abFind: 'equivalence', nProtons: 1, c1: 0.1, v1: 20, c2: 0.1, pka: 4.8, pka2: 9.2, pka3: 12.35, tolVol: 0.5, dispW: 500, dispH: 400, bareme: 1, text: '', fbGenExtra: '', indKeys: [] } },
            { label: 'colorimetrie', params: { abMethod: 'colorimetrie', abType: 'af-bf', abFind: 'equivalence', nProtons: 1, c1: 0.1, v1: 20, c2: 0.1, pka: 4.8, pka2: 9.2, pka3: 12.35, tolVol: 0.5, dispW: 500, dispH: 400, bareme: 1, text: '', fbGenExtra: '', indKeys: [] } }
        ]
    },
    {
        label: 'Polynômes', module: '../js/gen-math-polynomes.js', coreFn: 'genPolynomesCore', deps: BASE_DEPS,
        scenarios: ['discriminant', 'racines', 'racine1', 'racine2', 'somme-racines', 'produit-racines', 'nb-racines'].map(s => ({
            label: s, params: { bareme: 1, scenario: s, mode: 'aleatoire', fbOk: '', fbWrong: '', custText: '', fa: '1', fb: '-5', fc: '6', dMin: 1, dMax: 50, fbGen: '' }
        }))
    },
    {
        label: 'Inéquation', module: '../js/gen-math-inequation.js', coreFn: 'genInequationCore', deps: BASE_DEPS,
        scenarios: ['lineaire', 'trinome', 'valeur-abs'].map(s => ({
            label: s, params: { bareme: 1, scenario: s, mode: 'aleatoire', fbOk: '', fbWrong: '', custText: '', fa: '2', fb: '-6', fc: '0', fop: '>', ftans: 'oo(3,inf)', fbGen: '' }
        }))
    },
    {
        label: 'Matrices', module: '../js/gen-math-matrices.js', coreFn: 'genMatricesCore', deps: BASE_DEPS,
        scenarios: ['det-2x2', 'produit-2x2', 'det-3x3', 'trace-3x3', 'transpose-3x3', 'systeme-2x2'].map(s => ({
            label: s, params: { bareme: 1, scenario: s, fbOk: '', fbWrong: '', custText: '', mn: -3, mx: 3, fbGen: '' }
        }))
    },
    {
        label: 'Calcul', module: '../js/gen-math-calcul.js', coreFn: 'genCalculCore', deps: BASE_DEPS,
        scenarios: ['derivee', 'primitive', 'integrale', 'derivee-produit', 'primitive-exp', 'integrale-def', 'encadrement-tvi', 'convexite-tangente', 'tangente-ext', 'aire-courbes'].map(s => ({
            label: s, params: {
                bareme: 1, scenario: s, exprF: 'x^2 + sin(x)', boundA: '0', boundB: '1', fbOk: '', fbWrong: '', custText: '', fbGen: '',
                varValues: { a: '3', b: '5', c: '2', d: '1', f: '4', k: '2', m: '1', offset: '2' }
            }
        }))
    },
    {
        label: 'Nucléaire', module: '../js/gen-nuclear.js', coreFn: 'genNuclearCore', deps: BASE_DEPS,
        scenarios: [{ label: 'default', params: { bareme: 1, text: '<p>Complétez la réaction.</p>', rawEq: '{}^{14}_{6}C -> {}^{14}_{7}N + \\beta-', fbGenRaw: '' } }]
    },
    {
        label: 'Topo (chimie, équilibrage)', module: '../js/gen-topo.js', coreFn: 'genChemicalTopoCore', deps: BASE_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 2, text: '<p>Équilibrez la réaction.</p>', equation: 'H2 + O2 -> H2O',
                w_prt1: 0.1, w_n0: 0.2, w_n1: 0.1, w_n2: 0.2, w_n3: 0.1, w_n4: 0.2, w_n5: 0.1,
                fctDefault: 'aucune', typeReac: '', fbGenRaw: '', capturedHtml: '<svg>preview</svg>'
            }
        }]
    },
    {
        label: 'Chemical (chimie, formule)', module: '../js/gen-topo.js', coreFn: 'genChemicalCore', deps: BASE_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 2, text: '<p>Écrivez la réaction.</p>',
                editorHTML: 'H<sub>2</sub> + O<sub>2</sub> -&gt; H<sub>2</sub>O',
                editorPlain: 'H2 + O2 -> H2O', latex: 'H2 + O2 -> H2O', fbGenRaw: ''
            }
        }]
    },
    {
        label: 'Géométrie', module: '../js/gen-math-geometrie.js', coreFn: 'genGeometrieCore', deps: BASE_DEPS,
        scenarios: [
            ...['distance', 'milieu', 'norme', 'pente', 'ordonnee'].map(s => ({ label: s, params: baseGeoParams(s, '2d') })),
            { label: 'aire-2d', params: baseGeoParams('aire', '2d') },
            { label: 'aire-3d', params: baseGeoParams('aire', '3d') }
        ]
    },
    {
        label: 'Probabilités', module: '../js/gen-math-probabilites.js', coreFn: 'genProbabilitesCore', deps: BASE_DEPS,
        scenarios: ['combinaison', 'binom-pk', 'binom-esp', 'binom-var', 'proba-cond', 'proba-union'].map(s => ({
            label: s, params: { bareme: 1, scenario: s, mode: 'aleatoire', fbOk: '', fbWrong: '', custText: '', fbGen: '', raw: {} }
        }))
    },
    {
        label: 'Suites', module: '../js/gen-math-suites.js', coreFn: 'genSuitesCore', deps: BASE_DEPS,
        scenarios: ['terme-arith', 'terme-geo', 'somme-arith', 'somme-geo', 'limite-geo'].map(s => ({
            label: s, params: {
                bareme: 1, scenario: s, mode: 'aleatoire', fbOk: '', fbWrong: '', custText: '', fbGen: '',
                u0: null, u0Min: -5, u0Max: 5, r: null, rMin: -5, rMax: 5, q: null, qMin: -3, qMax: 3, k: null, kMin: 3, kMax: 6
            }
        }))
    },
    {
        label: 'Nombres complexes', module: '../js/gen-math-complexe.js', coreFn: 'genComplexeCore',
        deps: Object.assign({}, BASE_DEPS, { _cpxGenFbgen: _cpxGenFbgen, inferFbKind: inferFbKind }),
        scenarios: ['forme-alg', 'module-arg', 'equation-2deg', 'affixes', 'conjugue'].map(s => ({
            label: s, params: {
                bareme: 1, scenario: s, complexno: 'i', mode: 'fixe', op: '*', randMin: -5, randMax: 5,
                custText: '', custFbgen: '', fa: 3, fb: 2, fc: 1, fd: -1, feqb: -2, feqc: 5, fbOverrides: {}
            }
        }))
    },
    {
        label: 'Checkbox', module: '../js/gen-checkbox.js', coreFn: 'genCheckboxCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '<p>Cochez les affirmations vraies.</p>', Xe: '3', mXb: 'fixe', Xb: '2',
                props: [
                    { bool: 'true', text: 'Proposition A (vraie)', fb: 'Justification A', fb2: 'Rappel A' },
                    { bool: 'false', text: 'Proposition B (fausse)', fb: 'Justification B', fb2: '' },
                    { bool: 'true', text: 'Proposition C (vraie)', fb: 'Justification C', fb2: 'Rappel C' }
                ],
                showOubli: false, cbFbGen: '', cbFbGenShowFb: false
            }
        }]
    },
    {
        label: 'Numérique', module: '../js/gen-numerical.js', coreFn: 'genNumericalCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '<p>Calculez.</p>', val: '42', n: '3', isR: false,
                fbc: 'Bravo', fbe: 'Perdu', tolType: 'NumAbsolute', tolVal: '0.01', forbid: '1',
                numFbGen: '', aide: '', useKbd: false
            }
        }]
    },
    {
        label: 'Algébrique', module: '../js/gen-algebraic.js', coreFn: 'genAlgebraicCore', deps: RICH_DEPS,
        scenarios: ['libre', 'developpement', 'factorisation', 'fraction', 'expert'].flatMap(mode => [false, true].map(withError => ({
            label: mode + (withError ? ' (avec erreur classique)' : ''),
            params: {
                bareme: 1, text: '<p>Résolvez.</p>', formula: 'x^2+2*x+1', mode: mode,
                exprDisplay: '(x+1)^2', errorExpr: withError ? '-x^2+2*x+1' : '',
                fbc: 'Bravo', fbe: 'Perdu', sol: '', aide: '', useKbd: false,
                formVars: ['x'], poolVars: [],
                algFb: {
                    developpement: { partial: 'Développement incomplet', errsigne: 'Erreur de signe' },
                    factorisation: { partial: 'Factorisation incomplète' },
                    fraction: { partial: 'Fraction non simplifiée' },
                    expert: { partial: 'Développement incomplet', errsigne: 'Erreur de signe' }
                }
            }
        })))
    },
    {
        label: 'Chaîne de caractères', module: '../js/gen-string.js', coreFn: 'genStringCore', deps: RICH_DEPS,
        scenarios: [false, true].map(levenOn => ({
            label: levenOn ? 'levenshtein' : 'default',
            params: {
                bareme: 1, text: '<p>Nommer.</p>', ansPlain: 'photosynthese', size: 25, test: 'AlgEquiv',
                fbc: 'Bravo', fbe: 'Non', fbGen: '', solH: '', paletteHtml: '', levenOn: levenOn, altsArr: []
            }
        }))
    },
    {
        label: 'Vrai/Faux', module: '../js/gen-vf.js', coreFn: 'genVFCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '<p>Vrai ou faux ?</p>', fbGen: '', Xe: 2, modeXb: 'fixe', Xb: 2,
                props: [
                    { isV: true, text: 'La Terre tourne autour du Soleil', fbIfVrai: 'Correct', fbIfFaux: 'Non, c\'est vrai' },
                    { isV: false, text: 'Le Soleil tourne autour de la Terre', fbIfVrai: 'Non, c\'est faux', fbIfFaux: 'Correct' }
                ]
            }
        }]
    },
    {
        label: 'Pool (QCM)', module: '../js/gen-pool.js', coreFn: 'genPoolCore', deps: RICH_DEPS,
        scenarios: ['radio', 'dropdown'].map(type => ({
            label: type, params: {
                type: type, label: 'Choix multiple', text: '<p>Choisissez la bonne réponse.</p>', Xe: 3, bareme: 1,
                poolFbGen: '', poolShowFb: true,
                propsVrais: [{ text: 'Bonne réponse', fb: 'Explication vraie' }],
                propsFaux: [{ text: 'Faux 1', fb: 'Explication faux 1' }, { text: 'Faux 2', fb: 'Explication faux 2' }]
            }
        }))
    },
    {
        label: 'Clic sur image', module: '../js/gen-imgclick.js', coreFn: 'genImgClickCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '', fbOkTxt: '', fbWrTxt: '',
                bgData: 'data:image/png;base64,AAAA', bgW: 400, bgH: 300,
                zone: { shape: 'rect', x: 10, y: 10, w: 50, h: 20, label: 'Zone A' }, fbGen: ''
            }
        }]
    },
    {
        label: 'Clic sur image (séquence)', module: '../js/gen-imgclick.js', coreFn: 'genImgClickSequenceCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '', fbOkTxt: '', fbWrTxt: '', seqTime: 5,
                bgData: 'data:image/png;base64,AAAA', bgW: 400, bgH: 300,
                zones: [
                    { shape: 'rect', x: 0, y: 0, w: 20, h: 20, label: 'Un' },
                    { shape: 'circle', x: 100, y: 100, r: 15, label: 'Deux' }
                ]
            }
        }]
    },
    {
        label: 'Ordonner', module: '../js/gen-ord.js', coreFn: 'genOrdCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 1, text: '<p>Ordonnez les étapes suivantes.</p>', isClone: false, fbGenExtra: '',
                itemTexts: ['Étape 1', 'Étape 2', 'Étape 3']
            }
        }]
    },
    {
        label: 'Composition (rédaction)', module: '../js/gen-composition.js', coreFn: 'genCompositionCore',
        deps: Object.assign({}, RICH_DEPS, { buildCompositionJSX: (height, X) => `/* jsx height=${height} X=${X} */` }),
        scenarios: [{
            label: 'default', params: { bareme: 4, text: '<p>Rédigez.</p>', height: '600px', msg: 'Votre réponse sera lue.', fbGenRaw: '' }
        }]
    },
    {
        label: 'Statistiques', module: '../js/gen-math-statistiques.js', coreFn: 'genStatistiquesCore', deps: RICH_DEPS,
        scenarios: ['mediane', 'ecart-type', 'etendue', 'moyenne', 'variance', 'q1', 'q3', 'moyenne-ponderee'].map(s => ({
            label: s, params: {
                bareme: 1, scenario: s, display: 'liste', fbOk: '', fbWrong: '', custText: '',
                varName: 'x', dataDecimals: 1, randFormat: 'decimal', fbGen: ''
            }
        }))
    },
    {
        label: 'Trigonométrie', module: '../js/gen-math-trigonometrie.js', coreFn: 'genTrigonometrieCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'valeur-exacte', params: {
                bareme: 1, scenario: 'valeur-exacte', mode: 'aleatoire', fbOk: '', fbWrong: '',
                custText: '<p>Calculez.</p>', fn: 'sin', angle: '%pi/6', expr: 'sin(x)^2 + cos(x)^2', fbGenExtra: ''
            }
        }]
    },
    {
        label: 'Limites', module: '../js/gen-math-limites.js', coreFn: 'genLimitesCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'plus-inf', params: {
                bareme: 1, scenario: 'plus-inf', mode: 'aleatoire', fbOk: '', fbWrong: '', custText: '',
                expr: 'x', tans: '0', point: '1', fbGen: ''
            }
        }]
    },
    {
        label: 'GeoGebra', module: '../js/gen-geogebra.js', coreFn: 'genGeoGebraCore',
        deps: Object.assign({}, RICH_DEPS, {
            ggbBuildFilterTag: (X, st) => ({
                block: `[[geogebra set="s${X}" watch="w${X}"]]`,
                hiddenInputsHtml: (st.outputs || []).map(o => `[[input:${o.ggbName}]]`).join('\n')
            }),
            ggbBuildOutputFeedback: (o) => ({ trueFb: `<ok>${o.ggbName}</ok>`, falseFb: `<ko>${o.ggbName}</ko>` })
        }),
        scenarios: [{
            label: 'default', params: {
                bareme: 1, instruction: '<p>Tracez.</p>', materialId: 'abc123', width: 700, height: 500, showToolbar: false,
                inputs: [{ ggbName: 'a', expr: '3' }],
                outputs: [{ ggbName: 'resultat', type: 'numerical', tans: '9', tol: '0.1' }],
                rememberAttr: '', modelPreset: null, fbGen: ''
            }
        }]
    },
    {
        label: 'Mesure sur image', module: '../js/gen-image-mesure.js', coreFn: 'genImageMesureCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 2, text: '', imgData: 'data:image/jpeg;base64,XXXX', imgW: 400, imgH: 300,
                r1x: 0, r1y: 0, r1v: 0, r2x: 100, r2y: 0, r2v: 10, unit: 'cm', tol: 5, mode: 'guide',
                fbOk: 'Bravo', fbWrong: 'Raté', fbGenRaw: '',
                targets: [{ desc: 'Distance A-B', val: 5, type: 'position', hasPx: true, pxDist: 50 }]
            }
        }]
    },
    {
        label: 'Optique — RVB/CMJ', module: '../js/gen-optique.js', coreFn: 'genRvbCmjCore', deps: RICH_DEPS,
        scenarios: ['rvb', 'cmj'].map(mode => ({
            label: mode, params: {
                bareme: 1, text: '<p>Identifiez la couleur.</p>',
                imgData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                mode: mode, nb: false, answer: 1, fbOkTxt: '', fbWrTxt: '', fbGenRaw: ''
            }
        }))
    },
    {
        label: 'Tableau d\'avancement', module: '../js/gen-avancement.js', coreFn: 'genAvancementCore', deps: RICH_DEPS,
        scenarios: ['teacher', 'follow_from'].map(mode => ({
            label: mode, params: {
                bareme: 3, text: '', mode: mode, sourceType: 'chemical_topo', sourceX: 1, fbGen: '',
                species: [
                    { nom: 'H_2O_2', coeff: 2, role: 'reactif', n0: '0.20', exces: false, solvant: false },
                    { nom: 'H^{+}', coeff: 2, role: 'reactif', n0: '0.5', exces: true, solvant: false },
                    { nom: 'H_2O', coeff: 2, role: 'produit', n0: '0', exces: false, solvant: true },
                    { nom: 'O_2', coeff: 1, role: 'produit', n0: '0', exces: false, solvant: false }
                ]
            }
        }))
    },
    {
        label: 'Nomenclature chimique', module: '../js/gen-nomenclature.js', coreFn: 'genNomenclatureCore', deps: RICH_DEPS,
        scenarios: [
            { label: 'fixe', params: { bareme: 1, text: '<p>Nommez cette molécule.</p>', mode: 'fixe', fixeSmiles: 'CC(C)CC(C)(C)C', fixeNom: '2,2,4-triméthylpentane', fixeFamille: 'Alcanes', fbGen: '' } },
            { label: 'aleatoire', params: { bareme: 2, text: '<p>Identifiez cette molécule.</p>', mode: 'aleatoire', paramFamilles: ['Alcanes'], paramCarbonesMax: '4', fbGen: '' } },
            { label: 'checkbox', params: { bareme: 1, text: '<p>Cochez les groupes présents.</p>', mode: 'checkbox', cbSmiles: 'NC(CC(=O)O)C', cbVrais: 'Amine, Acide carboxylique', cbFaux: 'Alcool, Aldéhyde, Ester', fbGen: '' } }
        ]
    },
    {
        label: 'Incertitude (mesure GUM)', module: '../js/gen-incertitude.js', coreFn: 'genIncertitudeCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 7,
                context: { grandeur: 'Longueur', symbole: 'L', unite: 'cm', intro: '' },
                typeA: { mode: 'manuel', data: [12.3, 12.5, 12.2, 12.4, 12.6], moyenneVraie: '', ecartTypePop: '', n: 0, decimales: 2 },
                typeB: { source: 'resolution', q: '0.1', delta: '', ucert: '', kcert: '', valeur: '' },
                rounding: { sigfig: 1, roundup: false, k: 1 },
                steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: true, ecriture: true },
                fbGen: ''
            }
        }, {
            // result.prt == result.prts[0] : seule l'étape 'ecriture' cochée pour que
            // ce soit BIEN son PRT (combiné, units) qui soit audité ci-dessous (sinon
            // le script n'inspecte que le 1er PRT généré, ici 'moyenne').
            label: 'ecriture seule (pm + unité)', params: {
                bareme: 7,
                context: { grandeur: 'Longueur', symbole: 'L', unite: 'cm', intro: '' },
                typeA: { mode: 'manuel', data: [12.3, 12.5, 12.2, 12.4, 12.6], moyenneVraie: '', ecartTypePop: '', n: 0, decimales: 2 },
                typeB: { source: 'resolution', q: '0.1', delta: '', ucert: '', kcert: '', valeur: '' },
                rounding: { sigfig: 1, roundup: false, k: 1 },
                steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true },
                fbGen: ''
            }
        }, {
            label: 'ecriture seule (pm sans unité)', params: {
                bareme: 7,
                context: { grandeur: 'Longueur', symbole: 'L', unite: '', intro: '' },
                typeA: { mode: 'manuel', data: [12.3, 12.5, 12.2, 12.4, 12.6], moyenneVraie: '', ecartTypePop: '', n: 0, decimales: 2 },
                typeB: { source: 'resolution', q: '0.1', delta: '', ucert: '', kcert: '', valeur: '' },
                rounding: { sigfig: 1, roundup: false, k: 1 },
                steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true },
                fbGen: ''
            }
        }]
    },
    {
        label: 'Z-score (compatibilité métrologique)', module: '../js/gen-zscore.js', coreFn: 'genZscoreCore', deps: RICH_DEPS,
        scenarios: [{
            label: 'default', params: {
                bareme: 4,
                context: { grandeur: 'Masse volumique', symbole: '\\rho', unite: 'g/cm^3', intro: '' },
                grandeurs: { xMes: '10.5', xRef: '10', uc: '0.3' },
                seuil: '2',
                steps: { z: true, conclusion: true },
                fbGen: ''
            }
        }]
    }
];

// Une branche est "non terminale" quand elle continue vers un autre nœud
// (nextnode != '-1'). Le feedback qui y est attaché ne sera JAMAIS montré à
// l'élève : STACK évalue le nœud suivant et c'est LUI qui décide du feedback
// final. Un feedback rédigé sur une branche non terminale est donc du texte
// mort — souvent le signe qu'une branche censée être terminale (nextnode:-1)
// a été reconnectée par erreur à un autre nœud, ou qu'un feedback a été perdu.
function isFeedbackNonEmpty(fbText) {
    return String(fbText || '').replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim() !== '';
}

let bugCount = 0;
let ntfCount = 0;
let errorCount = 0;
let danglingCount = 0;
const lines = [];
const ntfLines = [];
const danglingLines = [];

TARGETS.forEach(function (t) {
    const mod = require(t.module);
    const coreFn = mod[t.coreFn];
    if (typeof coreFn !== 'function') {
        errorCount++;
        lines.push('[ERREUR] ' + t.label + ' : export ' + t.coreFn + ' introuvable dans ' + t.module);
        return;
    }
    t.scenarios.forEach(function (sc) {
        let result;
        try {
            result = coreFn('X', sc.params, t.deps || BASE_DEPS);
        } catch (e) {
            errorCount++;
            lines.push('[ERREUR] ' + t.label + ' / ' + sc.label + ' : génération impossible (' + e.message + ')');
            return;
        }
        const nodes = (result && result.prt && result.prt.nodes) || [];
        if (!nodes.length) return;

        findDanglingNodeRefs(nodes).forEach(function (d) {
            danglingCount++;
            danglingLines.push(
                '[' + t.label + ' / ' + sc.label + '] nœud "' + d.name + '", branche ' + d.branch +
                ' pointe vers "' + d.target + '" qui ne correspond au <name> d\'aucun nœud du PRT ' +
                '(import Moodle cassé : "Unsupported operand types: string + int")\n'
            );
        });

        const reach = computePrtReachability(nodes);
        nodes.forEach(function (n, i) {
            ['true', 'false'].forEach(function (branch) {
                const nodeName = n.name != null ? n.name : String(i);
                const nextNode = branch === 'true' ? n.truenextnode : n.falsenextnode;
                const fbText = branch === 'true' ? n.truefeedback : n.falsefeedback;
                if (!isPrtFeedbackReachable(reach, nodeName, branch)) {
                    bugCount++;
                    lines.push(
                        '[' + t.label + ' / ' + sc.label + '] nœud ' + nodeName + ', branche ' + branch + ' inatteignable\n' +
                        '  test dupliqué : ' + n.answertest + '(' + n.sans + ', ' + n.tans + ')\n' +
                        '  feedback concerné : ' + String(fbText || '').replace(/\s+/g, ' ').slice(0, 200) + '\n'
                    );
                }
                const isNonTerminal = nextNode != null && String(nextNode) !== '-1';
                if (isNonTerminal && isFeedbackNonEmpty(fbText)) {
                    ntfCount++;
                    ntfLines.push(
                        '[' + t.label + ' / ' + sc.label + '] nœud ' + nodeName + ', branche ' + branch +
                        ' non terminale (→ nœud ' + nextNode + ') mais porte un feedback (jamais affiché à l\'élève)\n' +
                        '  feedback mort : ' + String(fbText || '').replace(/\s+/g, ' ').slice(0, 200) + '\n'
                    );
                }
            });
        });
    });
});

const header = 'Audit PRT — ' + new Date().toISOString() + '\n' +
    danglingCount + ' référence(s) de nœud orpheline(s) détectée(s) (import Moodle cassé)\n' +
    bugCount + ' branche(s) morte(s)/inatteignable(s) détectée(s)\n' +
    ntfCount + ' branche(s) non terminale(s) avec feedback mort détectée(s)' +
    (errorCount ? ', ' + errorCount + ' scénario(s) en erreur' : '') + '\n\n';
const section0 = '=== Références de nœud orphelines (truenextnode/falsenextnode sans nœud <name> correspondant) ===\n\n' + (danglingLines.join('\n') || '(aucune)\n');
const section1 = '\n=== Branches inatteignables (test dupliqué par un ancêtre) ===\n\n' + (lines.join('\n') || '(aucune)\n');
const section2 = '\n=== Branches non terminales avec feedback (jamais affiché) ===\n\n' + (ntfLines.join('\n') || '(aucune)\n');
fs.writeFileSync(path.join(__dirname, '..', 'bugPRT.txt'), header + section0 + section1 + section2);
console.log(danglingCount + ' référence(s) orpheline(s), ' + bugCount + ' branche(s) morte(s), ' + ntfCount + ' branche(s) non terminale(s) avec feedback, ' + errorCount + ' erreur(s) — écrit dans bugPRT.txt');

// Fait échouer `npm run check-prt` (et donc la CI) dès qu'un import Moodle serait cassé
// ou qu'un scénario plante — les branches mortes/non-terminales restent seulement
// informatives (nombreux faux positifs pédagogiques légitimes, jamais bloquantes).
if (danglingCount || errorCount) process.exitCode = 1;
