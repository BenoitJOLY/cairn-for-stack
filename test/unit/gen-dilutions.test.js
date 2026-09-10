// Tests unitaires du cœur pur de gen-dilutions.js (genDilutionsCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-nernst.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds, tous les 2 nœuds notés
// avec un score de 0 sur le faux, contrairement à gen-debit.test.js). genDilutionsCore()
// ne lit jamais document : tout est passé en p (voir genDilutions(X), seul point
// de contact avec le DOM). Le helper Maxima pur (js/gen-dilutions-calc.js) est
// appelé en GLOBAL BARE (deps._dilVars || _dilVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son
// propre scope de module : on republie donc _dilVars sur `global` avant
// d'appeler genDilutionsCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genDilutionsCore } = require(path.join('..', '..', 'js', 'gen-dilutions.js'));
const { _dilVars } = require(path.join('..', '..', 'js', 'gen-dilutions-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._dilVars = _dilVars;

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
        grandeurs: { ntubeList: '2,3,4,5,6' },
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

// ── Helper Maxima pur (_dilVars) : validation ───────────────────────────
test("_dilVars : émet le tirage natif Maxima (n_tube) et les variables dérivées", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_dil_ntubelist: \[2,3,4,5,6\]\$/);
    assert.match(q.vars, /q1_dil_ntube: rand\(q1_dil_ntubelist\)\$/);
    assert.match(q.vars, /q1_dil_correct: 1\/10\^q1_dil_ntube\$/);
    assert.match(q.vars, /q1_dil_erraddition: 1\/\(10\*q1_dil_ntube\)\$/);
});

test("_dilVars : lève une erreur si aucun numéro de tube n'est proposé", () => {
    assert.throws(() => _dilVars(1, { grandeurs: { ntubeList: '' } }), /numéro de tube/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genDilutionsCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genDilutionsCore(1, { context: {}, grandeurs: { ntubeList: '2' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le facteur correct, bascule sur le nœud 1 si faux", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_dil1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_dil_correct<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_dil_correct');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_dil_erraddition');
});

test("nœud 1 (addition au lieu de multiplication) : toujours noté faux même si la réponse égale erraddition", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /additionné/);
    assert.match(node1.truefeedback, /multiplier/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le facteur de dilution attendu", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'dilution={@q1_dil_correct@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche le token Maxima non résolu côté JS et le titre i18n dil.title", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_dil_ntube@\}/);
    assert.match(q.textFrag, /dil\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genDilutionsCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genDilutionsCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_dil1\]\] \[\[validation:ans_dil1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genDilutionsCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_dil_ isole plusieurs questions du même export", () => {
    const q1 = genDilutionsCore(1, baseParams(), DEPS);
    const q2 = genDilutionsCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_dil_ntube\b/);
    assert.doesNotMatch(q1.vars, /q2_dil_ntube\b/);
    assert.match(q2.vars, /q2_dil_ntube\b/);
    assert.doesNotMatch(q2.vars, /q1_dil_ntube\b/);
});
