// Tests unitaires du cœur pur de gen-complexite.js (genComplexiteCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-chi2.test.js (une seule sous-question, ici
// avec un PRT à cascade de 3 nœuds diagnostiquant deux pièges classiques :
// confusion séquentielle/dichotomie et inversion log/exponentielle).
// genComplexiteCore() ne lit jamais document : tout est passé en p (voir
// genComplexite(X), seul point de contact avec le DOM). Le helper Maxima pur
// (js/gen-complexite-calc.js) est republié sur `global` pour que le deps
// bare (deps._cpaVars || _cpaVars) le trouve depuis un autre scope de module.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genComplexiteCore } = require(path.join('..', '..', 'js', 'gen-complexite.js'));
const { _cpaVars } = require(path.join('..', '..', 'js', 'gen-complexite-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._cpaVars = _cpaVars;

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
        grandeurs: { nList: '8,16,32,64,128,256,512,1024' },
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

// ── Helper Maxima pur (_cpaVars) : validation ───────────────────────────
test("_cpaVars : émet le tirage natif Maxima (n) et les variables dérivées", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_cpa_nlist: \[8,16,32,64,128,256,512,1024\]\$/);
    assert.match(q.vars, /q1_cpa_n: rand\(q1_cpa_nlist\)\$/);
    assert.match(q.vars, /q1_cpa_tans: log\(q1_cpa_n\)\/log\(2\)\$/);
    assert.match(q.vars, /q1_cpa_errseq: q1_cpa_n\/2\$/);
    assert.match(q.vars, /q1_cpa_errexp: 2\^q1_cpa_n/);
});

test("_cpaVars : lève une erreur si aucune taille n n'est proposée", () => {
    assert.throws(() => _cpaVars(1, { grandeurs: { nList: '' } }), /taille de tableau n/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genComplexiteCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genComplexiteCore(1, { context: {}, grandeurs: { nList: '8' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à cascade de 3 nœuds ──────────────────────
test("nœud 0 teste la complexité correcte, bascule sur le nœud 1 si faux", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_cpa1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_cpa_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 3);
    assert.equal(prt.nodes[0].tans, 'q1_cpa_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
});

test("nœud 1 (confusion séquentielle) bascule vers le nœud 2 si faux, toujours noté 0", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.tans, 'q1_cpa_errseq');
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.equal(node1.falsenextnode, '2');
    assert.match(node1.truefeedback, /séquentielle/);
});

test("nœud 2 (inversion log/exponentielle) est terminal, toujours noté 0", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    const node2 = q.prts[0].nodes[2];
    assert.equal(node2.tans, 'q1_cpa_errexp');
    assert.equal(node2.truescore, '0');
    assert.equal(node2.falsescore, '0');
    assert.equal(node2.truenextnode, '-1');
    assert.equal(node2.falsenextnode, '-1');
    assert.match(node2.truefeedback, /exponentielle/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose la complexité attendue", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'log2(n)={@q1_cpa_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche le token Maxima non résolu côté JS et le titre i18n cpa.title", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_cpa_n@\}/);
    assert.match(q.textFrag, /cpa\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genComplexiteCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genComplexiteCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_cpa1\]\] \[\[validation:ans_cpa1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genComplexiteCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_cpa_ isole plusieurs questions du même export", () => {
    const q1 = genComplexiteCore(1, baseParams(), DEPS);
    const q2 = genComplexiteCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_cpa_n\b/);
    assert.doesNotMatch(q1.vars, /q2_cpa_n\b/);
    assert.match(q2.vars, /q2_cpa_n\b/);
    assert.doesNotMatch(q2.vars, /q1_cpa_n\b/);
});
