// Tests unitaires du cœur pur de gen-nernst.js (genNernstCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-chi2.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds, tous les 2 nœuds notés
// avec un score de 0 sur le faux, contrairement à gen-debit.test.js). genNernstCore()
// ne lit jamais document : tout est passé en p (voir genNernst(X), seul point
// de contact avec le DOM). Le helper Maxima pur (js/gen-nernst-calc.js) est
// appelé en GLOBAL BARE (deps._nstVars || _nstVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son
// propre scope de module : on republie donc _nstVars sur `global` avant
// d'appeler genNernstCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genNernstCore } = require(path.join('..', '..', 'js', 'gen-nernst.js'));
const { _nstVars } = require(path.join('..', '..', 'js', 'gen-nernst-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._nstVars = _nstVars;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        context: { intro: '' },
        grandeurs: { kextList: '3,4,5,6', kintList: '120,130,140,150,155' },
        fbGen: ''
    }, overrides || {});
}

function assertBalancedTags(xml, label) {
    const stripped = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
    const stack = [];
    const re = /<\/?([a-zA-Z][\w-]*)[^>]*?(\/?)>/g;
    let m;
    while ((m = re.exec(stripped))) {
        const [full, tag, selfClose] = m;
        if (selfClose === '/' || full.startsWith('<?')) continue;
        if (full[1] === '/') {
            const top = stack.pop();
            assert.equal(top, tag, `${label}: fermeture </${tag}> inattendue (attendu </${top}>)`);
        } else {
            stack.push(tag);
        }
    }
    assert.equal(stack.length, 0, `${label}: balises non fermées: ${stack.join(', ')}`);
}

// ── Helper Maxima pur (_nstVars) : validation ───────────────────────────
test("_nstVars : émet les tirages natifs Maxima (kext, kint) et les variables dérivées", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_nst_kextlist: \[3,4,5,6\]\$/);
    assert.match(q.vars, /q1_nst_kext: rand\(q1_nst_kextlist\)\$/);
    assert.match(q.vars, /q1_nst_kintlist: \[120,130,140,150,155\]\$/);
    assert.match(q.vars, /q1_nst_kint: rand\(q1_nst_kintlist\)\$/);
    assert.match(q.vars, /q1_nst_ecorrect: 60\*log\(q1_nst_kext\/q1_nst_kint\)\/log\(10\)\$/);
    assert.match(q.vars, /q1_nst_errinverted: 60\*log\(q1_nst_kint\/q1_nst_kext\)\/log\(10\)\$/);
});

test("_nstVars : lève une erreur si aucune concentration extracellulaire n'est proposée", () => {
    assert.throws(() => _nstVars(1, { grandeurs: { kextList: '', kintList: '120' } }), /extracellulaire/);
});

test("_nstVars : lève une erreur si aucune concentration intracellulaire n'est proposée", () => {
    assert.throws(() => _nstVars(1, { grandeurs: { kextList: '3', kintList: '' } }), /intracellulaire/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genNernstCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genNernstCore(1, { context: {}, grandeurs: { kextList: '3', kintList: '120' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le potentiel correct, bascule sur le nœud 1 si faux", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_nst1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_nst_ecorrect<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_nst_ecorrect');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_nst_errinverted');
});

test("nœud 1 (concentrations inversées) : toujours noté faux même si la réponse égale errinverted", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /intra/);
    assert.match(node1.truefeedback, /extra/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le potentiel attendu", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'E_K={@q1_nst_ecorrect@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n nst.title", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_nst_kext@\}/);
    assert.match(q.textFrag, /\{@q1_nst_kint@\}/);
    assert.match(q.textFrag, /nst\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genNernstCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genNernstCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_nst1\]\] \[\[validation:ans_nst1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genNernstCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_nst_ isole plusieurs questions du même export", () => {
    const q1 = genNernstCore(1, baseParams(), DEPS);
    const q2 = genNernstCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_nst_kext\b/);
    assert.doesNotMatch(q1.vars, /q2_nst_kext\b/);
    assert.match(q2.vars, /q2_nst_kext\b/);
    assert.doesNotMatch(q2.vars, /q1_nst_kext\b/);
});
