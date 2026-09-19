// Tests unitaires du cœur pur de gen-multiplicateur.js (genMultiplicateurCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-bilanpuissance.test.js, même structure (une
// SEULE sous-question, PRT à cascade 3 nœuds — deux pièges diagnostiqués :
// oubli du « 1 - » au dénominateur, calcul du seul premier tour de relance).
// genMultiplicateurCore() ne lit jamais document : tout est passé en p (voir
// genMultiplicateur(X), seul point de contact avec le DOM). Le helper Maxima
// pur (js/gen-multiplicateur-calc.js) est appelé en GLOBAL BARE
// (deps._mulVars || _mulVars) — en navigateur tous les <script> partagent le
// même scope window. En Node, chaque require() a son propre scope de module :
// on republie donc _mulVars sur `global` avant d'appeler genMultiplicateurCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genMultiplicateurCore } = require(path.join('..', '..', 'js', 'gen-multiplicateur.js'));
const { _mulVars } = require(path.join('..', '..', 'js', 'gen-multiplicateur-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._mulVars = _mulVars;

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
        grandeurs: { cList: '3/4,4/5,7/10,2/3,3/5', diList: '10,20,50,100' },
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

// ── Helper Maxima pur (_mulVars) : validation ───────────────────────────
test("_mulVars : émet le tirage natif Maxima (c, ΔI0) et les variables dérivées", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_mul_clist: \[3\/4,4\/5,7\/10,2\/3,3\/5\]\$/);
    assert.match(q.vars, /q1_mul_c: rand\(q1_mul_clist\)\$/);
    assert.match(q.vars, /q1_mul_dilist: \[10,20,50,100\]\$/);
    assert.match(q.vars, /q1_mul_di0: rand\(q1_mul_dilist\)\$/);
    assert.match(q.vars, /q1_mul_tans: q1_mul_di0\/\(1-q1_mul_c\)\$/);
    assert.match(q.vars, /q1_mul_errc: q1_mul_di0\/q1_mul_c\$/);
    assert.match(q.vars, /q1_mul_erroneround: q1_mul_di0\*q1_mul_c\$/);
});

test("_mulVars : lève une erreur si aucune propension c ou aucune relance ΔI0 n'est proposée", () => {
    assert.throws(() => _mulVars(1, { grandeurs: { cList: '', diList: '10' } }), /propension marginale à consommer c/);
    assert.throws(() => _mulVars(1, { grandeurs: { cList: '3/4', diList: '' } }), /variation autonome de la demande/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genMultiplicateurCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genMultiplicateurCore(1, { context: {}, grandeurs: { cList: '3/4', diList: '10' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste le multiplicateur keynésien correct, bascule sur le nœud 1 si faux", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_mul1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_mul_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_mul_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_mul_errc');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_mul_erroneround');
});

test("nœud 1 (oubli du « 1 - » au dénominateur) : toujours noté faux même si la réponse égale errc", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /« 1 - »/);
});

test("nœud 2 (seul le premier tour de relance est compté) : toujours noté faux même si la réponse égale erroneround", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /premier tour de relance/);
    assert.match(node2.falsefeedback, /multiplicateur keynésien/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la variation de production attendue", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'dY={@q1_mul_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n mul.title", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_mul_di0@\}/);
    assert.match(q.textFrag, /\{@q1_mul_c@\}/);
    assert.match(q.textFrag, /mul\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genMultiplicateurCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_mul1\]\] \[\[validation:ans_mul1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genMultiplicateurCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_mul_ isole plusieurs questions du même export", () => {
    const q1 = genMultiplicateurCore(1, baseParams(), DEPS);
    const q2 = genMultiplicateurCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_mul_c\b/);
    assert.doesNotMatch(q1.vars, /q2_mul_c\b/);
    assert.match(q2.vars, /q2_mul_c\b/);
    assert.doesNotMatch(q2.vars, /q1_mul_c\b/);
});
