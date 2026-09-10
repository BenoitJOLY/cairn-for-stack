// Tests unitaires du cœur pur de gen-thevenin.js (genTheveninCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-ieee754.test.js, même structure (une SEULE
// sous-question, mais PRT à cascade 3 nœuds ici — deux pièges diagnostiqués :
// diviseur de tension oublié, R1/R2 traitées en série au lieu de parallèle).
// genTheveninCore() ne lit jamais document : tout est passé en p (voir
// genThevenin(X), seul point de contact avec le DOM). Le helper Maxima pur
// (js/gen-thevenin-calc.js) est appelé en GLOBAL BARE (deps._thvVars ||
// _thvVars) — en navigateur tous les <script> partagent le même scope
// window. En Node, chaque require() a son propre scope de module : on
// republie donc _thvVars sur `global` avant d'appeler genTheveninCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genTheveninCore } = require(path.join('..', '..', 'js', 'gen-thevenin.js'));
const { _thvVars } = require(path.join('..', '..', 'js', 'gen-thevenin-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._thvVars = _thvVars;

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
        grandeurs: { eList: '6,9,12,15,24', r1List: '10,20,30,40,100', r2List: '10,20,30,40,100', r3List: '10,20,50,100' },
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

// ── Helper Maxima pur (_thvVars) : validation ───────────────────────────
test("_thvVars : émet le tirage natif Maxima (E, R1, R2, R3) et les variables dérivées (Thévenin)", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_thv_elist: \[6,9,12,15,24\]\$/);
    assert.match(q.vars, /q1_thv_e: rand\(q1_thv_elist\)\$/);
    assert.match(q.vars, /q1_thv_r1: rand\(q1_thv_r1list\)\$/);
    assert.match(q.vars, /q1_thv_r2: rand\(q1_thv_r2list\)\$/);
    assert.match(q.vars, /q1_thv_r3: rand\(q1_thv_r3list\)\$/);
    assert.match(q.vars, /q1_thv_eth: q1_thv_e\*q1_thv_r2\/\(q1_thv_r1\+q1_thv_r2\)\$/);
    assert.match(q.vars, /q1_thv_rth: q1_thv_r1\*q1_thv_r2\/\(q1_thv_r1\+q1_thv_r2\)\$/);
    assert.match(q.vars, /q1_thv_tans: q1_thv_eth\/\(q1_thv_rth\+q1_thv_r3\)\$/);
    assert.match(q.vars, /q1_thv_errnodiv: q1_thv_e\/\(q1_thv_rth\+q1_thv_r3\)\$/);
    assert.match(q.vars, /q1_thv_errseries: q1_thv_eth\/\(q1_thv_r1\+q1_thv_r2\+q1_thv_r3\)\$/);
});

test("_thvVars : lève une erreur si une des 4 listes est vide", () => {
    assert.throws(() => _thvVars(1, { grandeurs: { eList: '', r1List: '10', r2List: '10', r3List: '10' } }), /tension de source E/);
    assert.throws(() => _thvVars(1, { grandeurs: { eList: '6', r1List: '', r2List: '10', r3List: '10' } }), /R1/);
    assert.throws(() => _thvVars(1, { grandeurs: { eList: '6', r1List: '10', r2List: '', r3List: '10' } }), /R2/);
    assert.throws(() => _thvVars(1, { grandeurs: { eList: '6', r1List: '10', r2List: '10', r3List: '' } }), /R3/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genTheveninCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genTheveninCore(1, { context: {}, grandeurs: { eList: '6', r1List: '10', r2List: '10', r3List: '10' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste le courant I3 correct, bascule sur le nœud 1 si faux", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_thv1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_thv_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_thv_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_thv_errnodiv');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_thv_errseries');
});

test("nœud 1 (diviseur de tension oublié) : toujours noté faux même si la réponse égale errnodiv", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /diviseur de tension/);
});

test("nœud 2 (R1/R2 traitées en série) : toujours noté faux même si la réponse égale errseries", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /parallèle/);
    assert.match(node2.falsefeedback, /[Tt]héven/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le courant I3 attendu", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'I3={@q1_thv_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n thv.title", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_thv_e@\}/);
    assert.match(q.textFrag, /\{@q1_thv_r1@\}/);
    assert.match(q.textFrag, /\{@q1_thv_r2@\}/);
    assert.match(q.textFrag, /\{@q1_thv_r3@\}/);
    assert.match(q.textFrag, /thv\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genTheveninCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genTheveninCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_thv1\]\] \[\[validation:ans_thv1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genTheveninCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_thv_ isole plusieurs questions du même export", () => {
    const q1 = genTheveninCore(1, baseParams(), DEPS);
    const q2 = genTheveninCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_thv_e\b/);
    assert.doesNotMatch(q1.vars, /q2_thv_e\b/);
    assert.match(q2.vars, /q2_thv_e\b/);
    assert.doesNotMatch(q2.vars, /q1_thv_e\b/);
});
