// Tests unitaires du cœur pur de gen-croisements.js (genCroisementsCore).
//
// Lancer :  npm test
//
// genCroisementsCore() ne lit jamais document : tout est passé en p (voir
// genCroisements(X), seul point de contact avec le DOM). Comme gen-hardyweinberg.js,
// le helper Maxima pur (js/gen-croisements-calc.js) est appelé en GLOBAL BARE
// (deps._crVars || _crVars) — en navigateur tous les <script> partagent le même
// scope window. En Node, chaque require() a son propre scope de module : on republie
// donc _crVars sur `global` avant d'appeler genCroisementsCore, exactement comme
// test/unit/gen-hardyweinberg.test.js.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCroisementsCore } = require(path.join('..', '..', 'js', 'gen-croisements.js'));
const { _crVars } = require(path.join('..', '..', 'js', 'gen-croisements-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._crVars = _crVars;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 3,
        context: { espece: 'la drosophile (Drosophila melanogaster)', autoTrait: 'la forme des ailes', sexTrait: 'la couleur des yeux', intro: '' },
        grandeurs: {
            autoDomName: 'ailes normales', autoDomLetter: 'V', autoRecName: 'ailes vestigiales',
            sexDomName: 'yeux normaux', sexDomLetter: 'W', sexRecName: 'yeux blancs'
        },
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

// ── Helper Maxima pur (_crVars) : validation ────────────────────────────
test("_crVars : émet les deux tirages natifs Maxima (autosomal + lié à l'X) et l'erreur de confusion", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_cr_autotypes: \[".*","*.*"\]\$/);
    assert.match(q.vars, /q1_cr_autoprobs: \[1\/4,1\/2\]\$/);
    assert.match(q.vars, /q1_cr_idxauto: 1\+rand\(2\)\$/);
    assert.match(q.vars, /q1_cr_autodesc: q1_cr_autotypes\[q1_cr_idxauto\]\$/);
    assert.match(q.vars, /q1_cr_pauto: q1_cr_autoprobs\[q1_cr_idxauto\]\$/);
    assert.match(q.vars, /q1_cr_sextypes: \[".*","*.*"\]\$/);
    assert.match(q.vars, /q1_cr_sexprobs: \[1\/4,1\/2\]\$/);
    assert.match(q.vars, /q1_cr_idxsex: 1\+rand\(2\)\$/);
    assert.match(q.vars, /q1_cr_sexdesc: q1_cr_sextypes\[q1_cr_idxsex\]\$/);
    assert.match(q.vars, /q1_cr_psex: q1_cr_sexprobs\[q1_cr_idxsex\]\$/);
    assert.match(q.vars, /q1_cr_errnaive: \(1\/2\)\*\(1\/4\)\$/);
    assert.match(q.vars, /q1_cr_ptotal: q1_cr_pauto\*q1_cr_psex\$/);
});

// ── Toujours 3 blocs PRT (auto, sex, total) ─────────────────────────────
test("toujours exactement 3 blocs <prt> (p_auto, p_sex, p_total)", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 3);
    assert.equal(q.prts.length, 3);
});

test("le barème est réparti également entre les 3 sous-questions", () => {
    const q = genCroisementsCore(1, baseParams({ bareme: 3 }), DEPS);
    const expectedShare = (3 / 3).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("barème non multiple de 3 : chaque sous-question reçoit un tiers arrondi", () => {
    const q = genCroisementsCore(1, baseParams({ bareme: 4 }), DEPS);
    const expectedShare = (4 / 3).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

// ── Sous-question a) : ratio autosomal ───────────────────────────────────
test("sous-question p_auto : PRT AlgEquiv, sans/tans corrects", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1auto<\/name>/);
    assert.match(q.inputXML, /<name>ans_cra1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_cr_pauto<\/tans>/);
});

// ── Sous-question b) : ratio lié à l'X — PRT à 2 nœuds en cascade ────────
test("sous-question p_sex : nœud 0 teste p_sex, bascule sur le nœud 1 si faux", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1sex<\/name>/);
    assert.match(q.inputXML, /<name>ans_crs1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_cr_psex<\/tans>/);
    const sex = q.prts[1];
    assert.equal(sex.nodes.length, 2);
    assert.equal(sex.nodes[0].tans, 'q1_cr_psex');
    assert.equal(sex.nodes[0].falsenextnode, '1');
    assert.equal(sex.nodes[1].tans, 'q1_cr_errnaive');
});

test("nœud 1 (confusion multiplication naïve) : toujours noté faux même si la sous-réponse égale errnaive", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    const node1 = q.prts[1].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /hémizygote/);
});

// ── Sous-question c) : produit des deux gènes ────────────────────────────
test("sous-question p_total : PRT AlgEquiv, sans/tans corrects", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1tot<\/name>/);
    assert.match(q.inputXML, /<name>ans_crt1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_cr_ptotal<\/tans>/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose p_auto et p_sex", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'p={@q1_cr_pauto@}×{@q1_cr_psex@}');
});

test("feedbackRef référence les 3 PRTs", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1auto\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1sex\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1tot\]\]/);
});

// ── Énoncé : contexte, échappement HTML, titre i18n obligatoire ─────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n cr.title", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_cr_autodesc@\}/);
    assert.match(q.textFrag, /\{@q1_cr_sexdesc@\}/);
    assert.match(q.textFrag, /cr\.title/);
});

test("contexte manquant retombe sur les valeurs par défaut (drosophile / ailes / yeux)", () => {
    const q = genCroisementsCore(1, baseParams({ context: {}, grandeurs: {} }), DEPS);
    assert.match(q.textFrag, /drosophile/);
    assert.match(q.textFrag, /ailes vestigiales/);
    assert.match(q.textFrag, /yeux blancs/);
});

test("le contexte espèce/traits est échappé HTML", () => {
    const q = genCroisementsCore(1, baseParams({ context: { espece: '<b>mouches</b>', autoTrait: 'x', sexTrait: 'y' } }), DEPS);
    assert.doesNotMatch(q.textFrag, /<b>mouches<\/b>/);
    assert.match(q.textFrag, /&lt;b&gt;mouches&lt;\/b&gt;/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genCroisementsCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_cr_ isole plusieurs questions du même export", () => {
    const q1 = genCroisementsCore(1, baseParams(), DEPS);
    const q2 = genCroisementsCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_cr_pauto/);
    assert.doesNotMatch(q1.vars, /q2_cr_pauto/);
    assert.match(q2.vars, /q2_cr_pauto/);
    assert.doesNotMatch(q2.vars, /q1_cr_pauto/);
});
