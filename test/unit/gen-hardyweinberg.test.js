// Tests unitaires du cœur pur de gen-hardyweinberg.js (genHardyWeinbergCore).
//
// Lancer :  npm test
//
// genHardyWeinbergCore() ne lit jamais document : tout est passé en p (voir
// genHardyWeinberg(X), seul point de contact avec le DOM). Comme gen-zscore.js,
// le helper Maxima pur (js/gen-hardyweinberg-calc.js) est appelé en GLOBAL BARE
// (deps._hwVars || _hwVars) — voir commentaire dans gen-hardyweinberg.js — car en
// navigateur tous les <script> partagent le même scope window. En Node, chaque
// require() a son propre scope de module : on republie donc _hwVars sur `global`
// avant d'appeler genHardyWeinbergCore, exactement comme test/unit/gen-zscore.test.js.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genHardyWeinbergCore } = require(path.join('..', '..', 'js', 'gen-hardyweinberg.js'));
const { _hwVars } = require(path.join('..', '..', 'js', 'gen-hardyweinberg-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global._hwVars = _hwVars;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 3,
        context: { espece: 'souris', phenoDom: 'pelage gris', phenoRec: 'pelage blanc', intro: '' },
        grandeurs: { qList: '1/10,2/10,3/10,4/10,6/10,7/10,8/10,9/10' },
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

// ── Helper Maxima pur (_hwVars) : validation ────────────────────────────
test("_hwVars : émet le tirage natif Maxima et les grandeurs dérivées à partir de la liste q", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_hwlistq: \[1\/10,2\/10,3\/10,4\/10,6\/10,7\/10,8\/10,9\/10\]\$/);
    assert.match(q.vars, /q1_hwq: rand\(q1_hwlistq\)\$/);
    assert.match(q.vars, /q1_hwq2: q1_hwq\^2\$/);
    assert.match(q.vars, /q1_hwq2pct: q1_hwq2\*100\$/);
    assert.match(q.vars, /q1_hwp: 1-q1_hwq\$/);
    assert.match(q.vars, /q1_hwhet: 2\*q1_hwp\*q1_hwq\$/);
    assert.match(q.vars, /q1_hwerrdom: 1-q1_hwq2\$/);
});

test("_hwVars : liste q avec moins de deux valeurs lève une erreur explicite", () => {
    assert.throws(() => genHardyWeinbergCore(1, baseParams({ grandeurs: { qList: '' } }), DEPS), /au moins deux valeurs possibles/);
    assert.throws(() => genHardyWeinbergCore(1, baseParams({ grandeurs: { qList: '1/10' } }), DEPS), /au moins deux valeurs possibles/);
});

// ── Toujours 3 sous-questions, aucune étape cochable (contrairement à zscore/incertitude) ──
test("toujours exactement 3 blocs <prt> (q, p, hétérozygotes), pas d'étapes cochables", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 3);
    assert.equal(q.prts.length, 3);
});

test("le barème est réparti également entre les 3 sous-questions", () => {
    const q = genHardyWeinbergCore(1, baseParams({ bareme: 3 }), DEPS);
    const expectedShare = (3 / 3).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

test("barème non multiple de 3 : chaque sous-question reçoit un tiers arrondi", () => {
    const q = genHardyWeinbergCore(1, baseParams({ bareme: 4 }), DEPS);
    const expectedShare = (4 / 3).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
});

// ── Sous-question a) : fréquence de l'allèle récessif q ─────────────────
test("sous-question q : PRT AlgEquiv, sans/tans corrects", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1q<\/name>/);
    assert.match(q.inputXML, /<name>ans_hwq1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_hwq<\/tans>/);
});

// ── Sous-question b) : fréquence de l'allèle dominant p ─────────────────
test("sous-question p : PRT AlgEquiv, sans/tans corrects", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1p<\/name>/);
    assert.match(q.inputXML, /<name>ans_hwp1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_hwp<\/tans>/);
});

// ── Sous-question c) : fréquence des hétérozygotes — PRT à 2 nœuds en cascade ──
test("sous-question hétérozygotes : nœud 0 teste 2pq, bascule sur le nœud 1 si faux", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1het<\/name>/);
    assert.match(q.inputXML, /<name>ans_hwhet1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_hwhet<\/tans>/);
    const het = q.prts[2];
    assert.equal(het.nodes.length, 2);
    assert.equal(het.nodes[0].tans, 'q1_hwhet');
    assert.equal(het.nodes[0].falsenextnode, '1');
    assert.equal(het.nodes[1].tans, 'q1_hwerrdom');
});

test("nœud 1 (confusion phénotype dominant / hétérozygotes) : toujours noté faux même si la sous-réponse égale errdom", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    const node1 = q.prts[2].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /dominants/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose q={@q1_hwq@}", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'q={@q1_hwq@}');
});

test("feedbackRef référence les 3 PRTs", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1q\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1p\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1het\]\]/);
});

// ── Énoncé : contexte, échappement HTML, titre i18n obligatoire ─────────
test("l'énoncé affiche le pourcentage tiré (token Maxima non résolu côté JS) et le titre i18n hw.title", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_hwq2pct@\}/);
    assert.match(q.textFrag, /hw\.title/);
});

test("contexte manquant retombe sur les valeurs par défaut (souris / pelage gris / pelage blanc)", () => {
    const q = genHardyWeinbergCore(1, baseParams({ context: {} }), DEPS);
    assert.match(q.textFrag, /souris/);
    assert.match(q.textFrag, /pelage gris/);
    assert.match(q.textFrag, /pelage blanc/);
});

test("le contexte espèce/phénotypes est échappé HTML", () => {
    const q = genHardyWeinbergCore(1, baseParams({ context: { espece: '<b>rats</b>', phenoDom: 'x', phenoRec: 'y' } }), DEPS);
    assert.doesNotMatch(q.textFrag, /<b>rats<\/b>/);
    assert.match(q.textFrag, /&lt;b&gt;rats&lt;\/b&gt;/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genHardyWeinbergCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_ isole plusieurs questions du même export", () => {
    const q1 = genHardyWeinbergCore(1, baseParams(), DEPS);
    const q2 = genHardyWeinbergCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_hwq/);
    assert.doesNotMatch(q1.vars, /q2_hwq/);
    assert.match(q2.vars, /q2_hwq/);
    assert.doesNotMatch(q2.vars, /q1_hwq/);
});
