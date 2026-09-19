// Tests unitaires du cœur pur de gen-fisher.js (genFisherCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-bilanpuissance.test.js, même structure (une
// SEULE sous-question, PRT à cascade 3 nœuds — deux pièges diagnostiqués :
// approximation additive, confusion avec l'indice).
// genFisherCore() ne lit jamais document : tout est passé en p (voir
// genFisher(X), seul point de contact avec le DOM). Le helper Maxima pur
// (js/gen-fisher-calc.js) est appelé en GLOBAL BARE (deps._fisVars ||
// _fisVars) — en navigateur tous les <script> partagent le même scope
// window. En Node, chaque require() a son propre scope de module : on
// republie donc _fisVars sur `global` avant d'appeler genFisherCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genFisherCore } = require(path.join('..', '..', 'js', 'gen-fisher.js'));
const { _fisVars } = require(path.join('..', '..', 'js', 'gen-fisher-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._fisVars = _fisVars;

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
        grandeurs: { grList: '1,3/2,2,5/2,3,7/2', piList: '1,3/2,2,5/2,3,7/2' },
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

// ── Helper Maxima pur (_fisVars) : validation ───────────────────────────
test("_fisVars : émet le tirage natif Maxima (gr, π) et les variables dérivées", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_fis_grlist: \[1,3\/2,2,5\/2,3,7\/2\]\$/);
    assert.match(q.vars, /q1_fis_gr: rand\(q1_fis_grlist\)\$/);
    assert.match(q.vars, /q1_fis_pilist: \[1,3\/2,2,5\/2,3,7\/2\]\$/);
    assert.match(q.vars, /q1_fis_pi: rand\(q1_fis_pilist\)\$/);
    assert.match(q.vars, /q1_fis_tans: \(100\+q1_fis_gr\)\*\(100\+q1_fis_pi\)\/100-100\$/);
    assert.match(q.vars, /q1_fis_errsum: q1_fis_gr\+q1_fis_pi\$/);
    assert.match(q.vars, /q1_fis_errindice: \(100\+q1_fis_gr\)\*\(100\+q1_fis_pi\)\/100\$/);
});

test("_fisVars : lève une erreur si aucun taux de croissance gr ou aucun taux d'inflation π n'est proposé", () => {
    assert.throws(() => _fisVars(1, { grandeurs: { grList: '', piList: '1' } }), /croissance réelle gr/);
    assert.throws(() => _fisVars(1, { grandeurs: { grList: '1', piList: '' } }), /taux d'inflation π/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genFisherCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genFisherCore(1, { context: {}, grandeurs: { grList: '1', piList: '1' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste le taux de croissance nominale correct, bascule sur le nœud 1 si faux", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_fis1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_fis_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_fis_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_fis_errsum');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_fis_errindice');
});

test("nœud 1 (approximation additive) : toujours noté faux même si la réponse égale errsum", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /approximation additive/);
});

test("nœud 2 (confusion avec l'indice) : toujours noté faux même si la réponse égale errindice", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /indice/);
    assert.match(node2.falsefeedback, /relation de Fisher/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le taux de croissance nominale attendu", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'gn={@q1_fis_tans@}%');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n fis.title", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_fis_gr@\}/);
    assert.match(q.textFrag, /\{@q1_fis_pi@\}/);
    assert.match(q.textFrag, /fis\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genFisherCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genFisherCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_fis1\]\] \[\[validation:ans_fis1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genFisherCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_fis_ isole plusieurs questions du même export", () => {
    const q1 = genFisherCore(1, baseParams(), DEPS);
    const q2 = genFisherCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_fis_gr\b/);
    assert.doesNotMatch(q1.vars, /q2_fis_gr\b/);
    assert.match(q2.vars, /q2_fis_gr\b/);
    assert.doesNotMatch(q2.vars, /q1_fis_gr\b/);
});
