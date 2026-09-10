// Tests unitaires du cœur pur de gen-premierordre.js (genPremierordreCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-ieee754.test.js, même structure (une SEULE
// sous-question, un seul PRT à cascade 2 nœuds diagnostiquant la confusion
// classique erreur statique / valeur finale de la sortie).
// genPremierordreCore() ne lit jamais document : tout est passé en p (voir
// genPremierordre(X), seul point de contact avec le DOM). Le helper Maxima
// pur (js/gen-premierordre-calc.js) est appelé en GLOBAL BARE (deps._pmoVars
// || _pmoVars) — en navigateur tous les <script> partagent le même scope
// window. En Node, chaque require() a son propre scope de module : on
// republie donc _pmoVars sur `global` avant d'appeler genPremierordreCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genPremierordreCore } = require(path.join('..', '..', 'js', 'gen-premierordre.js'));
const { _pmoVars } = require(path.join('..', '..', 'js', 'gen-premierordre-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._pmoVars = _pmoVars;

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
        grandeurs: { kList: '2,3,4,5,3/2,5/2', e0List: '1,2,5,10' },
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

// ── Helper Maxima pur (_pmoVars) : validation ───────────────────────────
test("_pmoVars : émet le tirage natif Maxima (K, E0) et les variables dérivées", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_pmo_klist: \[2,3,4,5,3\/2,5\/2\]\$/);
    assert.match(q.vars, /q1_pmo_k: rand\(q1_pmo_klist\)\$/);
    assert.match(q.vars, /q1_pmo_e0list: \[1,2,5,10\]\$/);
    assert.match(q.vars, /q1_pmo_e0: rand\(q1_pmo_e0list\)\$/);
    assert.match(q.vars, /q1_pmo_tans: q1_pmo_e0\*\(1-q1_pmo_k\)\$/);
    assert.match(q.vars, /q1_pmo_errfinal: q1_pmo_e0\*q1_pmo_k\$/);
});

test("_pmoVars : lève une erreur si aucun gain K ou aucune amplitude E0 n'est proposée", () => {
    assert.throws(() => _pmoVars(1, { grandeurs: { kList: '', e0List: '1' } }), /gain statique K/);
    assert.throws(() => _pmoVars(1, { grandeurs: { kList: '2', e0List: '' } }), /échelon E0/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genPremierordreCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genPremierordreCore(1, { context: {}, grandeurs: { kList: '2', e0List: '1' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste l'erreur statique correcte, bascule sur le nœud 1 si faux", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_pmo1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_pmo_tans<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_pmo_tans');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_pmo_errfinal');
});

test("nœud 1 (valeur finale confondue avec l'erreur) : toujours noté faux même si la réponse égale errfinal", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /valeur finale/);
    assert.match(node1.falsefeedback, /[Rr]égime permanent/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose l'erreur statique attendue", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'erreurstatique={@q1_pmo_tans@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ──────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n pmo.title", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_pmo_k@\}/);
    assert.match(q.textFrag, /\{@q1_pmo_e0@\}/);
    assert.match(q.textFrag, /pmo\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genPremierordreCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genPremierordreCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_pmo1\]\] \[\[validation:ans_pmo1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genPremierordreCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_pmo_ isole plusieurs questions du même export", () => {
    const q1 = genPremierordreCore(1, baseParams(), DEPS);
    const q2 = genPremierordreCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_pmo_k\b/);
    assert.doesNotMatch(q1.vars, /q2_pmo_k\b/);
    assert.match(q2.vars, /q2_pmo_k\b/);
    assert.doesNotMatch(q2.vars, /q1_pmo_k\b/);
});
