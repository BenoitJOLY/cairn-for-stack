// Tests unitaires du cœur pur de gen-ieee754.js (genIeee754Core).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-chi2.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds). genIeee754Core() ne lit
// jamais document : tout est passé en p (voir genIeee754(X), seul point de
// contact avec le DOM). Le helper Maxima pur (js/gen-ieee754-calc.js) est
// appelé en GLOBAL BARE (deps._fltVars || _fltVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son
// propre scope de module : on republie donc _fltVars sur `global` avant
// d'appeler genIeee754Core.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genIeee754Core } = require(path.join('..', '..', 'js', 'gen-ieee754.js'));
const { _fltVars } = require(path.join('..', '..', 'js', 'gen-ieee754-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._fltVars = _fltVars;

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
        grandeurs: { xList: '1/10,3/10,1/5,7/10,9/10,3/5', nBits: '8' },
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

// ── Helper Maxima pur (_fltVars) : validation ───────────────────────────
test("_fltVars : émet le tirage natif Maxima (x) et les variables dérivées", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_flt_xlist: \[1\/10,3\/10,1\/5,7\/10,9\/10,3\/5\]\$/);
    assert.match(q.vars, /q1_flt_x: rand\(q1_flt_xlist\)\$/);
    assert.match(q.vars, /q1_flt_n: 8\$/);
    assert.match(q.vars, /q1_flt_tans: floor\(q1_flt_x\*2\^q1_flt_n\)\/2\^q1_flt_n\$/);
    assert.match(q.vars, /q1_flt_errshort: floor\(q1_flt_x\*2\^\(q1_flt_n-1\)\)\/2\^\(q1_flt_n-1\)/);
});

test("_fltVars : lève une erreur si aucune valeur x n'est proposée", () => {
    assert.throws(() => _fltVars(1, { grandeurs: { xList: '', nBits: '8' } }), /valeur x/);
});

test("_fltVars : lève une erreur si le nombre de bits est absent ou invalide", () => {
    assert.throws(() => _fltVars(1, { grandeurs: { xList: '1/10', nBits: '' } }), /bits/);
    assert.throws(() => _fltVars(1, { grandeurs: { xList: '1/10', nBits: '1' } }), /bits/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genIeee754Core(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genIeee754Core(1, { context: {}, grandeurs: { xList: '1/10', nBits: '8' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste la mantisse correcte, bascule sur le nœud 1 si faux", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_flt1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_flt_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_flt_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_flt_errshort');
});

test("nœud 1 (dernier terme oublié) : toujours noté faux même si la réponse égale errshort", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /dernier terme/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la mantisse attendue", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'mantisse={@q1_flt_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n flt.title", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_flt_x@\}/);
    assert.match(q.textFrag, /\{@q1_flt_n@\}/);
    assert.match(q.textFrag, /flt\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genIeee754Core(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genIeee754Core(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_flt1\]\] \[\[validation:ans_flt1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genIeee754Core(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_flt_ isole plusieurs questions du même export", () => {
    const q1 = genIeee754Core(1, baseParams(), DEPS);
    const q2 = genIeee754Core(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_flt_x\b/);
    assert.doesNotMatch(q1.vars, /q2_flt_x\b/);
    assert.match(q2.vars, /q2_flt_x\b/);
    assert.doesNotMatch(q2.vars, /q1_flt_x\b/);
});
