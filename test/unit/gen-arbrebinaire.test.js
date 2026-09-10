// Tests unitaires du cœur pur de gen-arbrebinaire.js (genArbrebinaireCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-chi2.test.js (une seule sous-question, un
// seul PRT à cascade 2 nœuds). genArbrebinaireCore() ne lit jamais document :
// tout est passé en p (voir genArbrebinaire(X), seul point de contact avec
// le DOM). Le helper Maxima pur (js/gen-arbrebinaire-calc.js) est republié
// sur `global` pour que le deps bare (deps._arbVars || _arbVars) le trouve
// depuis un autre scope de module.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genArbrebinaireCore } = require(path.join('..', '..', 'js', 'gen-arbrebinaire.js'));
const { _arbVars } = require(path.join('..', '..', 'js', 'gen-arbrebinaire-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._arbVars = _arbVars;

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
        grandeurs: { hList: '2,3,4,5,6' },
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

// ── Helper Maxima pur (_arbVars) : validation ───────────────────────────
test("_arbVars : émet le tirage natif Maxima (h) et les variables dérivées", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_arb_hlist: \[2,3,4,5,6\]\$/);
    assert.match(q.vars, /q1_arb_h: rand\(q1_arb_hlist\)\$/);
    assert.match(q.vars, /q1_arb_tans: 2\^\(q1_arb_h\+1\)-1\$/);
    assert.match(q.vars, /q1_arb_errdef: 2\^q1_arb_h-1/);
});

test("_arbVars : lève une erreur si aucune hauteur h n'est proposée", () => {
    assert.throws(() => _arbVars(1, { grandeurs: { hList: '' } }), /hauteur h/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genArbrebinaireCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genArbrebinaireCore(1, { context: {}, grandeurs: { hList: '2' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le nombre de nœuds correct, bascule sur le nœud 1 si faux", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_arb1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_arb_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_arb_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_arb_errdef');
});

test("nœud 1 (erreur de définition de la hauteur) : toujours noté faux même si la réponse égale errdef", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.equal(node1.truenextnode, '-1');
    assert.equal(node1.falsenextnode, '-1');
    assert.match(node1.truefeedback, /hauteur/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le nombre de nœuds attendu", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'nb_noeuds={@q1_arb_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche le token Maxima non résolu côté JS et le titre i18n arb.title", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_arb_h@\}/);
    assert.match(q.textFrag, /arb\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genArbrebinaireCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_arb1\]\] \[\[validation:ans_arb1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genArbrebinaireCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_arb_ isole plusieurs questions du même export", () => {
    const q1 = genArbrebinaireCore(1, baseParams(), DEPS);
    const q2 = genArbrebinaireCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_arb_h\b/);
    assert.doesNotMatch(q1.vars, /q2_arb_h\b/);
    assert.match(q2.vars, /q2_arb_h\b/);
    assert.doesNotMatch(q2.vars, /q1_arb_h\b/);
});
