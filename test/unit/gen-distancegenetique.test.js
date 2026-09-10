// Tests unitaires du cœur pur de gen-distancegenetique.js (genDistanceGenetiqueCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-croisements.test.js. genDistanceGenetiqueCore()
// ne lit jamais document : tout est passé en p (voir genDistanceGenetique(X),
// seul point de contact avec le DOM). Le helper Maxima pur (js/gen-distancegenetique-calc.js)
// est appelé en GLOBAL BARE (deps._dgVars || _dgVars) — en navigateur tous les
// <script> partagent le même scope window. En Node, chaque require() a son propre
// scope de module : on republie donc _dgVars sur `global` avant d'appeler
// genDistanceGenetiqueCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genDistanceGenetiqueCore } = require(path.join('..', '..', 'js', 'gen-distancegenetique.js'));
const { _dgVars } = require(path.join('..', '..', 'js', 'gen-distancegenetique-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._dgVars = _dgVars;

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
        grandeurs: { nList: '1000,2000', rpctList: '4,6,8,10,12,14,16,18,20,22,24' },
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

// ── Helper Maxima pur (_dgVars) : validation ────────────────────────────
test("_dgVars : émet les tirages natifs Maxima (effectif total + % de recombinaison) et les variables dérivées", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_dg_nlist: \[1000,2000\]\$/);
    assert.match(q.vars, /q1_dg_ntotal: rand\(q1_dg_nlist\)\$/);
    assert.match(q.vars, /q1_dg_rpctlist: \[4,6,8,10,12,14,16,18,20,22,24\]\$/);
    assert.match(q.vars, /q1_dg_rpct: rand\(q1_dg_rpctlist\)\$/);
    assert.match(q.vars, /q1_dg_recomb: q1_dg_ntotal\*q1_dg_rpct\/100\$/);
    assert.match(q.vars, /q1_dg_recombhalf: q1_dg_recomb\/2\$/);
    assert.match(q.vars, /q1_dg_parental: q1_dg_ntotal-q1_dg_recomb\$/);
    assert.match(q.vars, /q1_dg_parentalhalf: q1_dg_parental\/2\$/);
    assert.match(q.vars, /q1_dg_tauxrecomb: q1_dg_recomb\/q1_dg_ntotal\$/);
    assert.match(q.vars, /q1_dg_distancecm: q1_dg_tauxrecomb\*100\$/);
    assert.match(q.vars, /q1_dg_errforgot: q1_dg_tauxrecomb\$/);
});

test("_dgVars : lève une erreur si moins d'un effectif total est proposé", () => {
    assert.throws(() => _dgVars(1, { grandeurs: { nList: '', rpctList: '4,6' } }), /effectif total/);
});

test("_dgVars : lève une erreur si moins de deux pourcentages de recombinaison sont proposés", () => {
    assert.throws(() => _dgVars(1, { grandeurs: { nList: '1000', rpctList: '4' } }), /pourcentages de recombinaison/);
});

// ── Toujours 2 blocs PRT (taux, dist) ───────────────────────────────────
test("toujours exactement 2 blocs <prt> (taux, dist)", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
});

test("le barème est réparti également entre les 2 sous-questions", () => {
    const q = genDistanceGenetiqueCore(1, baseParams({ bareme: 2 }), DEPS);
    const expectedShare = (2 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("barème non multiple de 2 : chaque sous-question reçoit une moitié arrondie", () => {
    const q = genDistanceGenetiqueCore(1, baseParams({ bareme: 3 }), DEPS);
    const expectedShare = (3 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("bareme par défaut à 2 si absent des params", () => {
    const q = genDistanceGenetiqueCore(1, { context: {}, grandeurs: { nList: '1000', rpctList: '4,6' } }, DEPS);
    assert.equal(q.bareme, 2);
});

// ── Sous-question a) : taux de recombinaison ─────────────────────────────
test("sous-question taux : PRT AlgEquiv à 1 nœud, sans/tans corrects", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1taux<\/name>/);
    assert.match(q.inputXML, /<name>ans_dga1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_dg_tauxrecomb<\/tans>/);
    assert.equal(q.prts[0].nodes.length, 1);
});

// ── Sous-question b) : distance en cM — PRT à 2 nœuds en cascade ────────
test("sous-question dist : nœud 0 teste la distance correcte, bascule sur le nœud 1 si faux", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1dist<\/name>/);
    assert.match(q.inputXML, /<name>ans_dgd1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_dg_distancecm<\/tans>/);
    const dist = q.prts[1];
    assert.equal(dist.nodes.length, 2);
    assert.equal(dist.nodes[0].tans, 'q1_dg_distancecm');
    assert.equal(dist.nodes[0].falsenextnode, '1');
    assert.equal(dist.nodes[1].tans, 'q1_dg_errforgot');
});

test("nœud 1 (oubli de conversion en cM) : toujours noté faux même si la sous-réponse égale errforgot", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    const node1 = q.prts[1].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /multipl/i);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le taux de recombinaison", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'taux={@q1_dg_tauxrecomb@}');
});

test("feedbackRef référence les 2 PRTs", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1taux\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1dist\]\]/);
});

// ── Énoncé : tableau d'effectifs, tokens Maxima non résolus, titre i18n ──
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n dg.title", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_dg_ntotal@\}/);
    assert.match(q.textFrag, /\{@q1_dg_parentalhalf@\}/);
    assert.match(q.textFrag, /\{@q1_dg_recombhalf@\}/);
    assert.match(q.textFrag, /dg\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genDistanceGenetiqueCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("les deux sous-questions [[input]] et [[validation]] sont toujours présentes", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_dga1\]\] \[\[validation:ans_dga1\]\]/);
    assert.match(q.textFrag, /\[\[input:ans_dgd1\]\] \[\[validation:ans_dgd1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_dg_ isole plusieurs questions du même export", () => {
    const q1 = genDistanceGenetiqueCore(1, baseParams(), DEPS);
    const q2 = genDistanceGenetiqueCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_dg_ntotal/);
    assert.doesNotMatch(q1.vars, /q2_dg_ntotal/);
    assert.match(q2.vars, /q2_dg_ntotal/);
    assert.doesNotMatch(q2.vars, /q1_dg_ntotal/);
});
