// Tests unitaires du cœur pur de gen-elasticite.js (genElasticiteCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-bilanpuissance.test.js, même structure (une
// SEULE sous-question, PRT à cascade 3 nœuds — deux pièges diagnostiqués :
// rapport inversé, variations absolues au lieu de relatives).
// genElasticiteCore() ne lit jamais document : tout est passé en p (voir
// genElasticite(X), seul point de contact avec le DOM). Le helper Maxima pur
// (js/gen-elasticite-calc.js) est appelé en GLOBAL BARE (deps._elaVars ||
// _elaVars) — en navigateur tous les <script> partagent le même scope
// window. En Node, chaque require() a son propre scope de module : on
// republie donc _elaVars sur `global` avant d'appeler genElasticiteCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genElasticiteCore } = require(path.join('..', '..', 'js', 'gen-elasticite.js'));
const { _elaVars } = require(path.join('..', '..', 'js', 'gen-elasticite-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._elaVars = _elaVars;

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
        grandeurs: { p0List: '10,20,50,100', p1List: '12,25,55,110', q0List: '1000,2000,500,800', q1List: '900,1600,420,680' },
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

// ── Helper Maxima pur (_elaVars) : validation ───────────────────────────
test("_elaVars : émet le tirage natif Maxima (P0, P1, Q0, Q1) et les variables dérivées", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_ela_p0list: \[10,20,50,100\]\$/);
    assert.match(q.vars, /q1_ela_p0: rand\(q1_ela_p0list\)\$/);
    assert.match(q.vars, /q1_ela_p1list: \[12,25,55,110\]\$/);
    assert.match(q.vars, /q1_ela_p1: rand\(q1_ela_p1list\)\$/);
    assert.match(q.vars, /q1_ela_q0list: \[1000,2000,500,800\]\$/);
    assert.match(q.vars, /q1_ela_q0: rand\(q1_ela_q0list\)\$/);
    assert.match(q.vars, /q1_ela_q1list: \[900,1600,420,680\]\$/);
    assert.match(q.vars, /q1_ela_q1: rand\(q1_ela_q1list\)\$/);
    assert.match(q.vars, /q1_ela_tans: \(\(q1_ela_q1-q1_ela_q0\)\/q1_ela_q0\)\/\(\(q1_ela_p1-q1_ela_p0\)\/q1_ela_p0\)\$/);
    assert.match(q.vars, /q1_ela_errinv: \(\(q1_ela_p1-q1_ela_p0\)\/q1_ela_p0\)\/\(\(q1_ela_q1-q1_ela_q0\)\/q1_ela_q0\)\$/);
    assert.match(q.vars, /q1_ela_errabs: \(q1_ela_q1-q1_ela_q0\)\/\(q1_ela_p1-q1_ela_p0\)\$/);
});

test("_elaVars : lève une erreur si une des 4 listes est vide", () => {
    assert.throws(() => _elaVars(1, { grandeurs: { p0List: '', p1List: '1', q0List: '1', q1List: '1' } }), /prix initial P0/);
    assert.throws(() => _elaVars(1, { grandeurs: { p0List: '1', p1List: '', q0List: '1', q1List: '1' } }), /prix final P1/);
    assert.throws(() => _elaVars(1, { grandeurs: { p0List: '1', p1List: '1', q0List: '', q1List: '1' } }), /quantité initiale Q0/);
    assert.throws(() => _elaVars(1, { grandeurs: { p0List: '1', p1List: '1', q0List: '1', q1List: '' } }), /quantité finale Q1/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genElasticiteCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genElasticiteCore(1, { context: {}, grandeurs: { p0List: '10', p1List: '12', q0List: '1000', q1List: '900' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste l'élasticité-prix correcte, bascule sur le nœud 1 si faux", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_ela1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_ela_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_ela_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_ela_errinv');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_ela_errabs');
});

test("nœud 1 (rapport inversé) : toujours noté faux même si la réponse égale errinv", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /inversé/);
});

test("nœud 2 (variations absolues au lieu de relatives) : toujours noté faux même si la réponse égale errabs", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /relatives/);
    assert.match(node2.falsefeedback, /élasticité-prix de la demande/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose l'élasticité-prix attendue", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'e={@q1_ela_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n ela.title", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_ela_p0@\}/);
    assert.match(q.textFrag, /\{@q1_ela_p1@\}/);
    assert.match(q.textFrag, /\{@q1_ela_q0@\}/);
    assert.match(q.textFrag, /\{@q1_ela_q1@\}/);
    assert.match(q.textFrag, /ela\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genElasticiteCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genElasticiteCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_ela1\]\] \[\[validation:ans_ela1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genElasticiteCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_ela_ isole plusieurs questions du même export", () => {
    const q1 = genElasticiteCore(1, baseParams(), DEPS);
    const q2 = genElasticiteCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_ela_p0\b/);
    assert.doesNotMatch(q1.vars, /q2_ela_p0\b/);
    assert.match(q2.vars, /q2_ela_p0\b/);
    assert.doesNotMatch(q2.vars, /q1_ela_p0\b/);
});
