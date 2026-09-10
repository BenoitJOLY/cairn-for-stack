// Tests unitaires du cœur pur de gen-regle10.js (genRegle10Core).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-radiochronologie.test.js pour le découpage en 2
// sous-questions (2 PRTs indépendants), MAIS sans cascade diagnostique : chaque
// PRT ne contient qu'un seul nœud (gabarit hand-XML svt-08-regle-10pourcent.xml
// n'a pas de piège classique diagnostiqué par nœud PRT). genRegle10Core() ne lit
// jamais document : tout est passé en p (voir genRegle10(X), seul point de
// contact avec le DOM). Le helper Maxima pur (js/gen-regle10-calc.js) est appelé
// en GLOBAL BARE (deps._regVars || _regVars) — en navigateur tous les <script>
// partagent le même scope window. En Node, chaque require() a son propre scope
// de module : on republie donc _regVars sur `global` avant d'appeler
// genRegle10Core.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genRegle10Core } = require(path.join('..', '..', 'js', 'gen-regle10.js'));
const { _regVars } = require(path.join('..', '..', 'js', 'gen-regle10-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._regVars = _regVars;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 2,
        context: { intro: '' },
        grandeurs: {
            b0List: '5000,10000,20000,50000', nPartAList: '2,3,4',
            kList: '1,2,3', mList: '1/5,3/10,2/5,1/2,3/5,7/10,4/5,9/10,1'
        },
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

// ── Helper Maxima pur (_regVars) : validation ───────────────────────────
test("_regVars : émet les tirages natifs Maxima (b0, nPartA, k, m) et les variables dérivées", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_reg_b0list: \[5000,10000,20000,50000\]\$/);
    assert.match(q.vars, /q1_reg_b0: rand\(q1_reg_b0list\)\$/);
    assert.match(q.vars, /q1_reg_npartalist: \[2,3,4\]\$/);
    assert.match(q.vars, /q1_reg_npartA: rand\(q1_reg_npartalist\)\$/);
    assert.match(q.vars, /q1_reg_biomassea: q1_reg_b0\*\(1\/10\)\^\(q1_reg_npartA-1\)\$/);
    assert.match(q.vars, /q1_reg_klist: \[1,2,3\]\$/);
    assert.match(q.vars, /q1_reg_ktarget: rand\(q1_reg_klist\)\$/);
    assert.match(q.vars, /q1_reg_mlist: \[1\/5,3\/10,2\/5,1\/2,3\/5,7\/10,4\/5,9\/10,1\]\$/);
    assert.match(q.vars, /q1_reg_mval: rand\(q1_reg_mlist\)\$/);
    assert.match(q.vars, /q1_reg_bneed: q1_reg_b0\*q1_reg_mval\/10\^q1_reg_ktarget\$/);
    assert.match(q.vars, /q1_reg_xval: q1_reg_bneed\/q1_reg_b0\$/);
    assert.match(q.vars, /q1_reg_nmax: floor\(float\(log\(q1_reg_xval\)\/log\(0\.1\)\)\)\$/);
});

test("_regVars : lève une erreur si aucune biomasse initiale n'est proposée", () => {
    assert.throws(() => _regVars(1, { grandeurs: { b0List: '', nPartAList: '2', kList: '1', mList: '1/2' } }), /biomasse initiale/);
});

test("_regVars : lève une erreur si aucun niveau trophique n'est proposé", () => {
    assert.throws(() => _regVars(1, { grandeurs: { b0List: '5000', nPartAList: '', kList: '1', mList: '1/2' } }), /niveau trophique/);
});

test("_regVars : lève une erreur si aucun exposant k n'est proposé", () => {
    assert.throws(() => _regVars(1, { grandeurs: { b0List: '5000', nPartAList: '2', kList: '', mList: '1/2' } }), /exposant/);
});

test("_regVars : lève une erreur si aucun facteur m n'est proposé", () => {
    assert.throws(() => _regVars(1, { grandeurs: { b0List: '5000', nPartAList: '2', kList: '1', mList: '' } }), /facteur/);
});

// ── Toujours exactement 2 blocs PRT (deux sous-questions indépendantes) ──
test("toujours exactement 2 blocs <prt> (deux sous-questions indépendantes)", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
});

test("le barème est réparti pour moitié entre les deux PRTs", () => {
    const q = genRegle10Core(1, baseParams({ bareme: 4 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
    assert.equal(q.prts[1].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 2 si absent des params", () => {
    const q = genRegle10Core(1, { context: {}, grandeurs: { b0List: '5000', nPartAList: '2', kList: '1', mList: '1/2' } }, DEPS);
    assert.equal(q.bareme, 2);
});

// ── Chaque PRT ne contient qu'un seul nœud (pas de cascade diagnostique) ──
test("chaque PRT (a et b) ne contient qu'un seul nœud, sans cascade diagnostique", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1a<\/name>/);
    assert.match(q.prtXML, /<name>prt1b<\/name>/);
    assert.equal(q.prts[0].nodes.length, 1);
    assert.equal(q.prts[1].nodes.length, 1);
});

test("PRT a teste la biomasse au niveau n donné", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans_reg1_1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_reg_biomassea<\/tans>/);
    assert.equal(q.prts[0].nodes[0].tans, 'q1_reg_biomassea');
    assert.equal(q.prts[0].nodes[0].falsenextnode, '-1');
});

test("PRT b teste le nombre maximal de niveaux trophiques supplémentaires", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans_reg2_1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_reg_nmax<\/tans>/);
    assert.equal(q.prts[1].nodes[0].tans, 'q1_reg_nmax');
    assert.equal(q.prts[1].nodes[0].falsenextnode, '-1');
});

test("le nœud de la sous-question b) renvoie vers une résolution par logarithme dans son feedback faux", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    const node = q.prts[1].nodes[0];
    assert.equal(node.truescore, '1');
    assert.equal(node.falsescore, '0');
    assert.match(node.falsefeedback, /logarithme/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la biomasse au niveau a) et le nombre max de niveaux", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'Ba={@q1_reg_biomassea@} nmax={@q1_reg_nmax@}');
});

test("feedbackRef référence les deux PRTs a et b", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1a\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1b\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n reg.title", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_reg_b0@\}/);
    assert.match(q.textFrag, /\{@q1_reg_npartA@\}/);
    assert.match(q.textFrag, /\{@q1_reg_bneed@\}/);
    assert.match(q.textFrag, /reg\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genRegle10Core(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genRegle10Core(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] des deux sous-questions sont toujours présents", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_reg1_1\]\] \[\[validation:ans_reg1_1\]\]/);
    assert.match(q.textFrag, /\[\[input:ans_reg2_1\]\] \[\[validation:ans_reg2_1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genRegle10Core(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_reg_ isole plusieurs questions du même export", () => {
    const q1 = genRegle10Core(1, baseParams(), DEPS);
    const q2 = genRegle10Core(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_reg_b0\b/);
    assert.doesNotMatch(q1.vars, /q2_reg_b0\b/);
    assert.match(q2.vars, /q2_reg_b0\b/);
    assert.doesNotMatch(q2.vars, /q1_reg_b0\b/);
});
