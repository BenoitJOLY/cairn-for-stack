// Audit statique : détecte les branches PRT (vraie/fausse) qui ne peuvent jamais se
// déclencher, sur tous les générateurs à PRT chaîné. Ne modifie jamais l'app — lecture
// seule des générateurs, écrit uniquement bugPRT.txt à la racine du projet.
// Usage : npm run check-prt   (ou : node scripts/check-prt-reachability.js)
'use strict';

const fs = require('fs');
const path = require('path');

const { computePrtReachability, isPrtFeedbackReachable } = require(path.join('..', 'js', 'prt-reachability.js'));
const { buildPrtXml } = require(path.join('..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', 'js', 'fb-box.js'));
const { _mkFbGen, _mkInput } = require(path.join('..', 'js', 'gen-math-shared.js'));

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

const BASE_DEPS = { I18N: I18N_STUB, buildPrtXml: buildPrtXml, applyFbBox: applyFbBox, _mkFbGen: _mkFbGen, _mkInput: _mkInput };

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
        deps: Object.assign({}, BASE_DEPS, { _cpxGenFbgen: _cpxGenFbgen }),
        scenarios: ['forme-alg', 'module-arg', 'equation-2deg', 'affixes', 'conjugue'].map(s => ({
            label: s, params: {
                bareme: 1, scenario: s, complexno: 'i', mode: 'fixe', op: '*', randMin: -5, randMax: 5,
                custText: '', custFbgen: '', fa: 3, fb: 2, fc: 1, fd: -1, feqb: -2, feqc: 5, fbOverrides: {}
            }
        }))
    }
];

let bugCount = 0;
let errorCount = 0;
const lines = [];

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
        const reach = computePrtReachability(nodes);
        nodes.forEach(function (n, i) {
            ['true', 'false'].forEach(function (branch) {
                const nodeName = n.name != null ? n.name : String(i);
                if (!isPrtFeedbackReachable(reach, nodeName, branch)) {
                    bugCount++;
                    const fbText = branch === 'true' ? n.truefeedback : n.falsefeedback;
                    lines.push(
                        '[' + t.label + ' / ' + sc.label + '] nœud ' + nodeName + ', branche ' + branch + ' inatteignable\n' +
                        '  test dupliqué : ' + n.answertest + '(' + n.sans + ', ' + n.tans + ')\n' +
                        '  feedback concerné : ' + String(fbText || '').replace(/\s+/g, ' ').slice(0, 200) + '\n'
                    );
                }
            });
        });
    });
});

const header = 'Audit atteignabilité PRT — ' + new Date().toISOString() + '\n' +
    bugCount + ' branche(s) morte(s) détectée(s)' + (errorCount ? ', ' + errorCount + ' scénario(s) en erreur' : '') + '\n\n';
fs.writeFileSync(path.join(__dirname, '..', 'bugPRT.txt'), header + lines.join('\n'));
console.log(bugCount + ' branche(s) morte(s), ' + errorCount + ' erreur(s) — écrit dans bugPRT.txt');
