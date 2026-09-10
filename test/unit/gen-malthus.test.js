// Tests unitaires du cœur pur de gen-malthus.js (genMalthusCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-ondesismique.test.js, même structure (une SEULE
// sous-question, un seul PRT). genMalthusCore() ne lit jamais document : tout
// est passé en p (voir genMalthus(X), seul point de contact avec le DOM). Le
// helper Maxima pur (js/gen-malthus-calc.js) est appelé en GLOBAL BARE
// (deps._malVars || _malVars) — en navigateur tous les <script> partagent le
// même scope window. En Node, chaque require() a son propre scope de module :
// on republie donc _malVars sur `global` avant d'appeler genMalthusCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genMalthusCore } = require(path.join('..', '..', 'js', 'gen-malthus.js'));
const { _malVars } = require(path.join('..', '..', 'js', 'gen-malthus-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._malVars = _malVars;

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
        grandeurs: { n0List: '200,500,1000,2000', qList: '2,3', tList: '10,12,15,18,20' },
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

// ── Helper Maxima pur (_malVars) : validation ───────────────────────────
test("_malVars : émet les tirages natifs Maxima (n0, q, t) et les variables dérivées", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_mal_n0list: \[200,500,1000,2000\]\$/);
    assert.match(q.vars, /q1_mal_n0: rand\(q1_mal_n0list\)\$/);
    assert.match(q.vars, /q1_mal_qlist: \[2,3\]\$/);
    assert.match(q.vars, /q1_mal_q: rand\(q1_mal_qlist\)\$/);
    assert.match(q.vars, /q1_mal_tlist: \[10,12,15,18,20\]\$/);
    assert.match(q.vars, /q1_mal_t: rand\(q1_mal_tlist\)\$/);
    assert.match(q.vars, /q1_mal_tminus1: q1_mal_t-1\$/);
    assert.match(q.vars, /q1_mal_nfinal: q1_mal_n0\*q1_mal_q\^q1_mal_t\$/);
    assert.match(q.vars, /q1_mal_erroffbyone: q1_mal_n0\*q1_mal_q\^q1_mal_tminus1\$/);
});

test("_malVars : lève une erreur si aucune population initiale n'est proposée", () => {
    assert.throws(() => _malVars(1, { grandeurs: { n0List: '', qList: '2', tList: '10' } }), /population initiale/);
});

test("_malVars : lève une erreur si aucun facteur multiplicatif n'est proposé", () => {
    assert.throws(() => _malVars(1, { grandeurs: { n0List: '200', qList: '', tList: '10' } }), /facteur multiplicatif/);
});

test("_malVars : lève une erreur si aucune durée n'est proposée", () => {
    assert.throws(() => _malVars(1, { grandeurs: { n0List: '200', qList: '2', tList: '' } }), /durée/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genMalthusCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genMalthusCore(1, { context: {}, grandeurs: { n0List: '200', qList: '2', tList: '10' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste la population finale correcte, bascule sur le nœud 1 si faux", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_mal1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_mal_nfinal<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_mal_nfinal');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_mal_erroffbyone');
});

test("nœud 1 (erreur d'une période) : toujours noté faux même si la réponse égale erroffbyone", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /périodes écoulées/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la population finale Nt", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'Nt={@q1_mal_nfinal@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n mal.title", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_mal_n0@\}/);
    assert.match(q.textFrag, /\{@q1_mal_q@\}/);
    assert.match(q.textFrag, /\{@q1_mal_t@\}/);
    assert.match(q.textFrag, /mal\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genMalthusCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genMalthusCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_mal1\]\] \[\[validation:ans_mal1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genMalthusCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_mal_ isole plusieurs questions du même export", () => {
    const q1 = genMalthusCore(1, baseParams(), DEPS);
    const q2 = genMalthusCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_mal_n0\b/);
    assert.doesNotMatch(q1.vars, /q2_mal_n0\b/);
    assert.match(q2.vars, /q2_mal_n0\b/);
    assert.doesNotMatch(q2.vars, /q1_mal_n0\b/);
});
