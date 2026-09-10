// Tests unitaires du cœur pur de gen-horlogemoleculaire.js (genHorlogeMoleculaireCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-distancegenetique.test.js. genHorlogeMoleculaireCore()
// ne lit jamais document : tout est passé en p (voir genHorlogeMoleculaire(X), seul
// point de contact avec le DOM). Le helper Maxima pur (js/gen-horlogemoleculaire-calc.js)
// est appelé en GLOBAL BARE (deps._hmVars || _hmVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son propre
// scope de module : on republie donc _hmVars sur `global` avant d'appeler
// genHorlogeMoleculaireCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genHorlogeMoleculaireCore } = require(path.join('..', '..', 'js', 'gen-horlogemoleculaire.js'));
const { _hmVars } = require(path.join('..', '..', 'js', 'gen-horlogemoleculaire-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._hmVars = _hmVars;

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
        grandeurs: { seqList: '1000,2000,5000', tauxList: '1,2,4,5,8', dpctList: '1,2,3,4,5,6,8,10' },
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

// ── Helper Maxima pur (_hmVars) : validation ────────────────────────────
test("_hmVars : émet les tirages natifs Maxima (séquence + taux + % divergence) et les variables dérivées", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_hm_seqlist: \[1000,2000,5000\]\$/);
    assert.match(q.vars, /q1_hm_seqval: rand\(q1_hm_seqlist\)\$/);
    assert.match(q.vars, /q1_hm_tauxlist: \[1,2,4,5,8\]\$/);
    assert.match(q.vars, /q1_hm_tauxa: rand\(q1_hm_tauxlist\)\$/);
    assert.match(q.vars, /q1_hm_tauxval: q1_hm_tauxa\*10\^\(-9\)\$/);
    assert.match(q.vars, /q1_hm_dpctlist: \[1,2,3,4,5,6,8,10\]\$/);
    assert.match(q.vars, /q1_hm_dpct: rand\(q1_hm_dpctlist\)\$/);
    assert.match(q.vars, /q1_hm_diffval: q1_hm_seqval\*q1_hm_dpct\/100\$/);
    assert.match(q.vars, /q1_hm_taformula: nbdiff\/\(2\*mu\*long_seq\)\$/);
    assert.match(q.vars, /q1_hm_errno2formula: nbdiff\/\(mu\*long_seq\)\$/);
    assert.match(q.vars, /q1_hm_tval: q1_hm_diffval\/\(2\*q1_hm_tauxval\*q1_hm_seqval\)\$/);
    assert.match(q.vars, /q1_hm_errno2val: q1_hm_diffval\/\(q1_hm_tauxval\*q1_hm_seqval\)\$/);
});

test("_hmVars : lève une erreur si aucune longueur de séquence n'est proposée", () => {
    assert.throws(() => _hmVars(1, { grandeurs: { seqList: '', tauxList: '1', dpctList: '4,6' } }), /longueur de séquence/);
});

test("_hmVars : lève une erreur si aucun taux de mutation n'est proposé", () => {
    assert.throws(() => _hmVars(1, { grandeurs: { seqList: '1000', tauxList: '', dpctList: '4,6' } }), /taux de mutation/);
});

test("_hmVars : lève une erreur si moins de deux pourcentages de divergence sont proposés", () => {
    assert.throws(() => _hmVars(1, { grandeurs: { seqList: '1000', tauxList: '1', dpctList: '4' } }), /pourcentages de divergence/);
});

// ── Toujours 2 blocs PRT (form, val) ─────────────────────────────────────
test("toujours exactement 2 blocs <prt> (form, val)", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
});

test("le barème est réparti également entre les 2 sous-questions", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams({ bareme: 2 }), DEPS);
    const expectedShare = (2 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("barème non multiple de 2 : chaque sous-question reçoit une moitié arrondie", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams({ bareme: 3 }), DEPS);
    const expectedShare = (3 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("bareme par défaut à 2 si absent des params", () => {
    const q = genHorlogeMoleculaireCore(1, { context: {}, grandeurs: { seqList: '1000', tauxList: '1', dpctList: '4,6' } }, DEPS);
    assert.equal(q.bareme, 2);
});

// ── Sous-question a) : formule littérale — PRT à 2 nœuds en cascade ──────
test("sous-question formule : nœud 0 teste la formule correcte, bascule sur le nœud 1 si faux", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1form<\/name>/);
    assert.match(q.inputXML, /<name>ans_hmf1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_hm_taformula<\/tans>/);
    const form = q.prts[0];
    assert.equal(form.nodes.length, 2);
    assert.equal(form.nodes[0].tans, 'q1_hm_taformula');
    assert.equal(form.nodes[0].falsenextnode, '1');
    assert.equal(form.nodes[1].tans, 'q1_hm_errno2formula');
});

test("nœud 1 formule (facteur 2 oublié) : toujours noté faux même si la sous-réponse égale errno2formula", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /facteur 2/);
});

// ── Sous-question b) : valeur numérique — PRT à 2 nœuds en cascade ───────
test("sous-question val : nœud 0 teste la valeur correcte, bascule sur le nœud 1 si faux", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1val<\/name>/);
    assert.match(q.inputXML, /<name>ans_hmv1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_hm_tval<\/tans>/);
    const val = q.prts[1];
    assert.equal(val.nodes.length, 2);
    assert.equal(val.nodes[0].tans, 'q1_hm_tval');
    assert.equal(val.nodes[0].falsenextnode, '1');
    assert.equal(val.nodes[1].tans, 'q1_hm_errno2val');
});

test("nœud 1 val (facteur 2 oublié) : toujours noté faux même si la sous-réponse égale errno2val", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    const node1 = q.prts[1].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /double de la bonne réponse/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la valeur numérique T", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'T={@q1_hm_tval@}');
});

test("feedbackRef référence les 2 PRTs", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1form\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1val\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n, allowwords symboliques ──
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n hm.title", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_hm_seqval@\}/);
    assert.match(q.textFrag, /\{@q1_hm_diffval@\}/);
    assert.match(q.textFrag, /\{@q1_hm_tauxa@\}/);
    assert.match(q.textFrag, /hm\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genHorlogeMoleculaireCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("les deux sous-questions [[input]] et [[validation]] sont toujours présentes", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_hmf1\]\] \[\[validation:ans_hmf1\]\]/);
    assert.match(q.textFrag, /\[\[input:ans_hmv1\]\] \[\[validation:ans_hmv1\]\]/);
});

test("l'input algébrique de la formule autorise les symboles libres nbdiff/mu/long_seq", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans_hmf1<\/name>/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_hm_ isole plusieurs questions du même export", () => {
    const q1 = genHorlogeMoleculaireCore(1, baseParams(), DEPS);
    const q2 = genHorlogeMoleculaireCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_hm_seqval/);
    assert.doesNotMatch(q1.vars, /q2_hm_seqval/);
    assert.match(q2.vars, /q2_hm_seqval/);
    assert.doesNotMatch(q2.vars, /q1_hm_seqval/);
});
