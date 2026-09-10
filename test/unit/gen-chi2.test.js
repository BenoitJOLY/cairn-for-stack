// Tests unitaires du cœur pur de gen-chi2.js (genChi2Core).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-malthus.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds). genChi2Core() ne lit jamais
// document : tout est passé en p (voir genChi2(X), seul point de contact avec
// le DOM). Le helper Maxima pur (js/gen-chi2-calc.js) est appelé en GLOBAL
// BARE (deps._chiVars || _chiVars) — en navigateur tous les <script>
// partagent le même scope window. En Node, chaque require() a son propre
// scope de module : on republie donc _chiVars sur `global` avant d'appeler
// genChi2Core.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genChi2Core } = require(path.join('..', '..', 'js', 'gen-chi2.js'));
const { _chiVars } = require(path.join('..', '..', 'js', 'gen-chi2-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._chiVars = _chiVars;

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
        grandeurs: { nList: '100,200', dList: '2,4,6,8', eList: '1,2,3' },
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

// ── Helper Maxima pur (_chiVars) : validation ───────────────────────────
test("_chiVars : émet les tirages natifs Maxima (n, d, e) et les variables dérivées", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_chi_nlist: \[100,200\]\$/);
    assert.match(q.vars, /q1_chi_ntotal: rand\(q1_chi_nlist\)\$/);
    assert.match(q.vars, /q1_chi_t1: q1_chi_ntotal\*2\/5\$/);
    assert.match(q.vars, /q1_chi_t2: q1_chi_ntotal\*3\/10\$/);
    assert.match(q.vars, /q1_chi_t3: q1_chi_ntotal\*1\/5\$/);
    assert.match(q.vars, /q1_chi_t4: q1_chi_ntotal\*1\/10\$/);
    assert.match(q.vars, /q1_chi_dlist: \[2,4,6,8\]\$/);
    assert.match(q.vars, /q1_chi_ddev: rand\(q1_chi_dlist\)\$/);
    assert.match(q.vars, /q1_chi_elist: \[1,2,3\]\$/);
    assert.match(q.vars, /q1_chi_edev: rand\(q1_chi_elist\)\$/);
    assert.match(q.vars, /q1_chi_o1: q1_chi_t1\+q1_chi_ddev\$/);
    assert.match(q.vars, /q1_chi_o2: q1_chi_t2-q1_chi_ddev\$/);
    assert.match(q.vars, /q1_chi_o3: q1_chi_t3\+q1_chi_edev\$/);
    assert.match(q.vars, /q1_chi_o4: q1_chi_t4-q1_chi_edev\$/);
    assert.match(q.vars, /q1_chi_chi2: \(q1_chi_o1-q1_chi_t1\)\^2\/q1_chi_t1/);
    assert.match(q.vars, /q1_chi_errwrongdenom: \(q1_chi_o1-q1_chi_t1\)\^2\/q1_chi_o1/);
});

test("_chiVars : lève une erreur si aucun effectif total n'est proposé", () => {
    assert.throws(() => _chiVars(1, { grandeurs: { nList: '', dList: '2', eList: '1' } }), /effectif total/);
});

test("_chiVars : lève une erreur si aucun écart A\/B n'est proposé", () => {
    assert.throws(() => _chiVars(1, { grandeurs: { nList: '100', dList: '', eList: '1' } }), /espèces A\/B/);
});

test("_chiVars : lève une erreur si aucun écart C\/D n'est proposé", () => {
    assert.throws(() => _chiVars(1, { grandeurs: { nList: '100', dList: '2', eList: '' } }), /espèces C\/D/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genChi2Core(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genChi2Core(1, { context: {}, grandeurs: { nList: '100', dList: '2', eList: '1' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le χ² correct, bascule sur le nœud 1 si faux", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_chi1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_chi_chi2<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_chi_chi2');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_chi_errwrongdenom');
});

test("nœud 1 (division par O au lieu de T) : toujours noté faux même si la réponse égale errwrongdenom", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /observé/);
    assert.match(node1.truefeedback, /théorique/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le χ² attendu", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'chi2={@q1_chi_chi2@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n, tableau O/T ──────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n chi.title", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_chi_ntotal@\}/);
    assert.match(q.textFrag, /\{@q1_chi_o1@\}/);
    assert.match(q.textFrag, /\{@q1_chi_t1@\}/);
    assert.match(q.textFrag, /chi\.title/);
});

test("l'énoncé contient un tableau des 4 espèces avec effectifs observés et théoriques", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /<table/);
    assert.match(q.textFrag, /Effectif observé O/);
    assert.match(q.textFrag, /Effectif théorique T/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genChi2Core(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genChi2Core(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_chi1\]\] \[\[validation:ans_chi1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genChi2Core(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_chi_ isole plusieurs questions du même export", () => {
    const q1 = genChi2Core(1, baseParams(), DEPS);
    const q2 = genChi2Core(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_chi_ntotal\b/);
    assert.doesNotMatch(q1.vars, /q2_chi_ntotal\b/);
    assert.match(q2.vars, /q2_chi_ntotal\b/);
    assert.doesNotMatch(q2.vars, /q1_chi_ntotal\b/);
});
