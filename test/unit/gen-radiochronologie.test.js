// Tests unitaires du cœur pur de gen-radiochronologie.js (genRadiochronologieCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-horlogemoleculaire.test.js. genRadiochronologieCore()
// ne lit jamais document : tout est passé en p (voir genRadiochronologie(X), seul
// point de contact avec le DOM). Le helper Maxima pur (js/gen-radiochronologie-calc.js)
// est appelé en GLOBAL BARE (deps._rcVars || _rcVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son propre
// scope de module : on republie donc _rcVars sur `global` avant d'appeler
// genRadiochronologieCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genRadiochronologieCore } = require(path.join('..', '..', 'js', 'gen-radiochronologie.js'));
const { _rcVars } = require(path.join('..', '..', 'js', 'gen-radiochronologie-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._rcVars = _rcVars;

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
        grandeurs: { fracList: '1/2,1/4,1/8,1/16,3/5,7/10,4/5', lamaList: '1,2,5,8', lambList: '4,5,6' },
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

// ── Helper Maxima pur (_rcVars) : validation ────────────────────────────
test("_rcVars : émet les tirages natifs Maxima (Nfrac + lam_a + lam_b) et les variables dérivées", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_rc_fraclist: \[1\/2,1\/4,1\/8,1\/16,3\/5,7\/10,4\/5\]\$/);
    assert.match(q.vars, /q1_rc_nfrac: rand\(q1_rc_fraclist\)\$/);
    assert.match(q.vars, /q1_rc_lamalist: \[1,2,5,8\]\$/);
    assert.match(q.vars, /q1_rc_lama: rand\(q1_rc_lamalist\)\$/);
    assert.match(q.vars, /q1_rc_lamblist: \[4,5,6\]\$/);
    assert.match(q.vars, /q1_rc_lamb: rand\(q1_rc_lamblist\)\$/);
    assert.match(q.vars, /q1_rc_lamval: q1_rc_lama\*10\^\(-q1_rc_lamb\)\$/);
    assert.match(q.vars, /q1_rc_taformula: -log\(Nfrac\)\/lam\$/);
    assert.match(q.vars, /q1_rc_errsignformula: log\(Nfrac\)\/lam\$/);
    assert.match(q.vars, /q1_rc_tval: -log\(q1_rc_nfrac\)\/q1_rc_lamval\$/);
    assert.match(q.vars, /q1_rc_errsignval: log\(q1_rc_nfrac\)\/q1_rc_lamval\$/);
});

test("_rcVars : lève une erreur si aucune proportion Nfrac n'est proposée", () => {
    assert.throws(() => _rcVars(1, { grandeurs: { fracList: '', lamaList: '1', lambList: '4' } }), /proportion Nfrac/);
});

test("_rcVars : lève une erreur si aucun coefficient lam_a n'est proposé", () => {
    assert.throws(() => _rcVars(1, { grandeurs: { fracList: '1/2', lamaList: '', lambList: '4' } }), /coefficient lam_a/);
});

test("_rcVars : lève une erreur si aucun exposant lam_b n'est proposé", () => {
    assert.throws(() => _rcVars(1, { grandeurs: { fracList: '1/2', lamaList: '1', lambList: '' } }), /exposant lam_b/);
});

// ── Toujours 2 blocs PRT (form, val) ─────────────────────────────────────
test("toujours exactement 2 blocs <prt> (form, val)", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
});

test("le barème est réparti également entre les 2 sous-questions", () => {
    const q = genRadiochronologieCore(1, baseParams({ bareme: 2 }), DEPS);
    const expectedShare = (2 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("barème non multiple de 2 : chaque sous-question reçoit une moitié arrondie", () => {
    const q = genRadiochronologieCore(1, baseParams({ bareme: 3 }), DEPS);
    const expectedShare = (3 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("bareme par défaut à 2 si absent des params", () => {
    const q = genRadiochronologieCore(1, { context: {}, grandeurs: { fracList: '1/2', lamaList: '1', lambList: '4' } }, DEPS);
    assert.equal(q.bareme, 2);
});

// ── Sous-question a) : formule littérale — PRT à 2 nœuds en cascade ──────
test("sous-question formule : nœud 0 teste la formule correcte, bascule sur le nœud 1 si faux", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1form<\/name>/);
    assert.match(q.inputXML, /<name>ans_rcf1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_rc_taformula<\/tans>/);
    const form = q.prts[0];
    assert.equal(form.nodes.length, 2);
    assert.equal(form.nodes[0].tans, 'q1_rc_taformula');
    assert.equal(form.nodes[0].falsenextnode, '1');
    assert.equal(form.nodes[1].tans, 'q1_rc_errsignformula');
});

test("nœud 1 formule (signe moins oublié) : toujours noté faux même si la sous-réponse égale errsignformula", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /signe moins/);
});

// ── Sous-question b) : valeur numérique — PRT à 2 nœuds en cascade ───────
test("sous-question val : nœud 0 teste la valeur correcte, bascule sur le nœud 1 si faux", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1val<\/name>/);
    assert.match(q.inputXML, /<name>ans_rcv1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_rc_tval<\/tans>/);
    const val = q.prts[1];
    assert.equal(val.nodes.length, 2);
    assert.equal(val.nodes[0].tans, 'q1_rc_tval');
    assert.equal(val.nodes[0].falsenextnode, '1');
    assert.equal(val.nodes[1].tans, 'q1_rc_errsignval');
});

test("nœud 1 val (signe moins oublié, résultat négatif) : toujours noté faux même si la sous-réponse égale errsignval", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    const node1 = q.prts[1].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /négatif/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la valeur numérique T", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'T={@q1_rc_tval@}');
});

test("feedbackRef référence les 2 PRTs", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1form\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1val\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n, allowwords symboliques ──
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n rc.title", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_rc_nfrac@\}/);
    assert.match(q.textFrag, /\{@q1_rc_lama@\}/);
    assert.match(q.textFrag, /\{@q1_rc_lamb@\}/);
    assert.match(q.textFrag, /rc\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genRadiochronologieCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("les deux sous-questions [[input]] et [[validation]] sont toujours présentes", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_rcf1\]\] \[\[validation:ans_rcf1\]\]/);
    assert.match(q.textFrag, /\[\[input:ans_rcv1\]\] \[\[validation:ans_rcv1\]\]/);
});

test("l'input algébrique de la formule autorise les symboles libres Nfrac/lam", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans_rcf1<\/name>/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genRadiochronologieCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_rc_ isole plusieurs questions du même export", () => {
    const q1 = genRadiochronologieCore(1, baseParams(), DEPS);
    const q2 = genRadiochronologieCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_rc_nfrac/);
    assert.doesNotMatch(q1.vars, /q2_rc_nfrac/);
    assert.match(q2.vars, /q2_rc_nfrac/);
    assert.doesNotMatch(q2.vars, /q1_rc_nfrac/);
});
