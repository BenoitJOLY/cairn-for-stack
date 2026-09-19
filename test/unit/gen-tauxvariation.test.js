// Tests unitaires du cœur pur de gen-tauxvariation.js (genTauxvariationCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-bilanpuissance.test.js, même structure (une
// SEULE sous-question, PRT à cascade 3 nœuds — deux pièges diagnostiqués :
// confusion avec l'indice base 100, inversion du sens de la variation).
// genTauxvariationCore() ne lit jamais document : tout est passé en p (voir
// genTauxvariation(X), seul point de contact avec le DOM). Le helper Maxima
// pur (js/gen-tauxvariation-calc.js) est appelé en GLOBAL BARE
// (deps._tvaVars || _tvaVars) — en navigateur tous les <script> partagent le
// même scope window. En Node, chaque require() a son propre scope de module :
// on republie donc _tvaVars sur `global` avant d'appeler genTauxvariationCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genTauxvariationCore } = require(path.join('..', '..', 'js', 'gen-tauxvariation.js'));
const { _tvaVars } = require(path.join('..', '..', 'js', 'gen-tauxvariation-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._tvaVars = _tvaVars;

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
        grandeurs: { v0List: '80,100,120,150,200', v1List: '88,115,138,165,220' },
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

// ── Helper Maxima pur (_tvaVars) : validation ───────────────────────────
test("_tvaVars : émet le tirage natif Maxima (V0, V1) et les variables dérivées", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_tva_v0list: \[80,100,120,150,200\]\$/);
    assert.match(q.vars, /q1_tva_v0: rand\(q1_tva_v0list\)\$/);
    assert.match(q.vars, /q1_tva_v1list: \[88,115,138,165,220\]\$/);
    assert.match(q.vars, /q1_tva_v1: rand\(q1_tva_v1list\)\$/);
    assert.match(q.vars, /q1_tva_tans: \(q1_tva_v1-q1_tva_v0\)\/q1_tva_v0\*100\$/);
    assert.match(q.vars, /q1_tva_errindice: q1_tva_v1\/q1_tva_v0\*100\$/);
    assert.match(q.vars, /q1_tva_errsign: \(q1_tva_v0-q1_tva_v1\)\/q1_tva_v0\*100\$/);
});

test("_tvaVars : lève une erreur si aucune valeur V0 ou V1 n'est proposée", () => {
    assert.throws(() => _tvaVars(1, { grandeurs: { v0List: '', v1List: '1' } }), /valeur initiale V0/);
    assert.throws(() => _tvaVars(1, { grandeurs: { v0List: '1', v1List: '' } }), /valeur finale V1/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genTauxvariationCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genTauxvariationCore(1, { context: {}, grandeurs: { v0List: '100', v1List: '110' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste le taux de variation correct, bascule sur le nœud 1 si faux", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_tva1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_tva_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_tva_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_tva_errindice');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_tva_errsign');
});

test("nœud 1 (confusion avec l'indice base 100) : toujours noté faux même si la réponse égale errindice", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /indice base 100/);
});

test("nœud 2 (sens de la variation inversé) : toujours noté faux même si la réponse égale errsign", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /inversé/);
    assert.match(node2.falsefeedback, /taux de variation/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le taux de variation attendu", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 't={@q1_tva_tans@}%');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n tva.title", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_tva_v0@\}/);
    assert.match(q.textFrag, /\{@q1_tva_v1@\}/);
    assert.match(q.textFrag, /tva\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genTauxvariationCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genTauxvariationCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_tva1\]\] \[\[validation:ans_tva1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genTauxvariationCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_tva_ isole plusieurs questions du même export", () => {
    const q1 = genTauxvariationCore(1, baseParams(), DEPS);
    const q2 = genTauxvariationCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_tva_v0\b/);
    assert.doesNotMatch(q1.vars, /q2_tva_v0\b/);
    assert.match(q2.vars, /q2_tva_v0\b/);
    assert.doesNotMatch(q2.vars, /q1_tva_v0\b/);
});
