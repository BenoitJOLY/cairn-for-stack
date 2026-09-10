// Tests unitaires du cœur pur de gen-bilanpuissance.js (genBilanpuissanceCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-ieee754.test.js, même structure (une SEULE
// sous-question, mais PRT à cascade 3 nœuds ici — deux pièges diagnostiqués :
// oubli du facteur g, rendements multipliés au lieu d'être divisés).
// genBilanpuissanceCore() ne lit jamais document : tout est passé en p (voir
// genBilanpuissance(X), seul point de contact avec le DOM). Le helper Maxima
// pur (js/gen-bilanpuissance-calc.js) est appelé en GLOBAL BARE
// (deps._bpuVars || _bpuVars) — en navigateur tous les <script> partagent le
// même scope window. En Node, chaque require() a son propre scope de module :
// on republie donc _bpuVars sur `global` avant d'appeler genBilanpuissanceCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genBilanpuissanceCore } = require(path.join('..', '..', 'js', 'gen-bilanpuissance.js'));
const { _bpuVars } = require(path.join('..', '..', 'js', 'gen-bilanpuissance-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._bpuVars = _bpuVars;

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
        grandeurs: { mList: '500,600,800,1000,1200', vList: '1,3/2,2,5/2,3', etaRedList: '9/10,17/20,4/5,7/8', etaMotList: '9/10,17/20,4/5,7/8' },
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

// ── Helper Maxima pur (_bpuVars) : validation ───────────────────────────
test("_bpuVars : émet le tirage natif Maxima (m, v, etaRed, etaMot) et les variables dérivées", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_bpu_mlist: \[500,600,800,1000,1200\]\$/);
    assert.match(q.vars, /q1_bpu_m: rand\(q1_bpu_mlist\)\$/);
    assert.match(q.vars, /q1_bpu_vlist: \[1,3\/2,2,5\/2,3\]\$/);
    assert.match(q.vars, /q1_bpu_v: rand\(q1_bpu_vlist\)\$/);
    assert.match(q.vars, /q1_bpu_etared: rand\(q1_bpu_erlist\)\$/);
    assert.match(q.vars, /q1_bpu_etamot: rand\(q1_bpu_emlist\)\$/);
    assert.match(q.vars, /q1_bpu_g: 981\/100\$/);
    assert.match(q.vars, /q1_bpu_tans: q1_bpu_m\*q1_bpu_g\*q1_bpu_v\/\(q1_bpu_etared\*q1_bpu_etamot\)\$/);
    assert.match(q.vars, /q1_bpu_errnog: q1_bpu_m\*q1_bpu_v\/\(q1_bpu_etared\*q1_bpu_etamot\)\$/);
    assert.match(q.vars, /q1_bpu_errinv: q1_bpu_m\*q1_bpu_g\*q1_bpu_v\*q1_bpu_etared\*q1_bpu_etamot\$/);
});

test("_bpuVars : lève une erreur si une des 4 listes est vide", () => {
    assert.throws(() => _bpuVars(1, { grandeurs: { mList: '', vList: '1', etaRedList: '9/10', etaMotList: '9/10' } }), /masse m/);
    assert.throws(() => _bpuVars(1, { grandeurs: { mList: '500', vList: '', etaRedList: '9/10', etaMotList: '9/10' } }), /vitesse v/);
    assert.throws(() => _bpuVars(1, { grandeurs: { mList: '500', vList: '1', etaRedList: '', etaMotList: '9/10' } }), /réducteur/);
    assert.throws(() => _bpuVars(1, { grandeurs: { mList: '500', vList: '1', etaRedList: '9/10', etaMotList: '' } }), /moteur/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genBilanpuissanceCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genBilanpuissanceCore(1, { context: {}, grandeurs: { mList: '500', vList: '1', etaRedList: '9/10', etaMotList: '9/10' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 3 nœuds en cascade ──────────────────────
test("nœud 0 teste la puissance absorbée correcte, bascule sur le nœud 1 si faux", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_bpu1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_bpu_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_bpu_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_bpu_errnog');
    assert.equal(prt.nodes[1].falsenextnode, '2');
    assert.equal(prt.nodes[2].tans, 'q1_bpu_errinv');
});

test("nœud 1 (oubli du facteur g) : toujours noté faux même si la réponse égale errnog", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /pesanteur/);
});

test("nœud 2 (rendements multipliés au lieu d'être divisés) : toujours noté faux même si la réponse égale errinv", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.match(node2.truefeedback, /inférieur à 1/);
    assert.match(node2.falsefeedback, /chaîne d'énergie/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la puissance absorbée attendue", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'Pabs={@q1_bpu_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n bpu.title", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_bpu_m@\}/);
    assert.match(q.textFrag, /\{@q1_bpu_v@\}/);
    assert.match(q.textFrag, /\{@q1_bpu_etared@\}/);
    assert.match(q.textFrag, /\{@q1_bpu_etamot@\}/);
    assert.match(q.textFrag, /bpu\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genBilanpuissanceCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_bpu1\]\] \[\[validation:ans_bpu1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genBilanpuissanceCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_bpu_ isole plusieurs questions du même export", () => {
    const q1 = genBilanpuissanceCore(1, baseParams(), DEPS);
    const q2 = genBilanpuissanceCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_bpu_m\b/);
    assert.doesNotMatch(q1.vars, /q2_bpu_m\b/);
    assert.match(q2.vars, /q2_bpu_m\b/);
    assert.doesNotMatch(q2.vars, /q1_bpu_m\b/);
});
