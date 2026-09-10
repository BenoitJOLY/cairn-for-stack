// Tests unitaires du cœur pur de gen-debit.js (genDebitCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-chi2.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds). genDebitCore() ne lit jamais
// document : tout est passé en p (voir genDebit(X), seul point de contact avec
// le DOM). Le helper Maxima pur (js/gen-debit-calc.js) est appelé en GLOBAL
// BARE (deps._debVars || _debVars) — en navigateur tous les <script>
// partagent le même scope window. En Node, chaque require() a son propre
// scope de module : on republie donc _debVars sur `global` avant d'appeler
// genDebitCore.
//
// Particularité de ce type (vs chi2/malthus) : le nœud 1 (piège "oubli de
// conversion mL -> L") accorde un CRÉDIT PARTIEL de 0.5, pas un score de 0.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genDebitCore } = require(path.join('..', '..', 'js', 'gen-debit.js'));
const { _debVars } = require(path.join('..', '..', 'js', 'gen-debit-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._debVars = _debVars;

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
        grandeurs: { fcList: '60,65,70,72,75,80', vesList: '60,65,70,75,80,90' },
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

// ── Helper Maxima pur (_debVars) : validation ───────────────────────────
test("_debVars : émet les tirages natifs Maxima (fc, ves) et les variables dérivées", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_deb_fclist: \[60,65,70,72,75,80\]\$/);
    assert.match(q.vars, /q1_deb_fc: rand\(q1_deb_fclist\)\$/);
    assert.match(q.vars, /q1_deb_veslist: \[60,65,70,75,80,90\]\$/);
    assert.match(q.vars, /q1_deb_vesml: rand\(q1_deb_veslist\)\$/);
    assert.match(q.vars, /q1_deb_qcorrect: q1_deb_fc\*q1_deb_vesml\/1000\$/);
    assert.match(q.vars, /q1_deb_errforgotconvert: q1_deb_fc\*q1_deb_vesml\$/);
});

test("_debVars : lève une erreur si aucune fréquence cardiaque n'est proposée", () => {
    assert.throws(() => _debVars(1, { grandeurs: { fcList: '', vesList: '60' } }), /fréquence cardiaque/);
});

test("_debVars : lève une erreur si aucun volume d'éjection systolique n'est proposé", () => {
    assert.throws(() => _debVars(1, { grandeurs: { fcList: '60', vesList: '' } }), /éjection systolique/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genDebitCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genDebitCore(1, { context: {}, grandeurs: { fcList: '60', vesList: '60' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le débit correct, bascule sur le nœud 1 si faux", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_deb1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_deb_qcorrect<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_deb_qcorrect');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_deb_errforgotconvert');
});

test("nœud 1 (oubli de conversion mL->L) : crédit PARTIEL de 0.5, pas 0", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0.5');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /1000 fois trop grande/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le débit attendu", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'Q={@q1_deb_qcorrect@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n deb.title", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_deb_fc@\}/);
    assert.match(q.textFrag, /\{@q1_deb_vesml@\}/);
    assert.match(q.textFrag, /deb\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genDebitCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genDebitCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_deb1\]\] \[\[validation:ans_deb1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genDebitCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_deb_ isole plusieurs questions du même export", () => {
    const q1 = genDebitCore(1, baseParams(), DEPS);
    const q2 = genDebitCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_deb_fc\b/);
    assert.doesNotMatch(q1.vars, /q2_deb_fc\b/);
    assert.match(q2.vars, /q2_deb_fc\b/);
    assert.doesNotMatch(q2.vars, /q1_deb_fc\b/);
});
