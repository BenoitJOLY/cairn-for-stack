// Tests unitaires du cœur pur de gen-geogebra.js (genGeoGebraCore).
//
// Lancer :  npm test
//
// genGeoGebraCore() ne lit jamais document/window._ggbState/GGB_MODELS :
// tout est passé en p (voir genGeoGebra(qid), seul point de contact avec
// le DOM/l'état global).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genGeoGebraCore } = require(path.join('..', '..', 'js', 'gen-geogebra.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const ggbBuildFilterTag = (X, st) => ({
    block: `[[geogebra set="s${X}" watch="w${X}"]]`,
    hiddenInputsHtml: (st.outputs || []).map(o => `[[input:${o.ggbName}]]`).join('\n')
});
const ggbBuildOutputFeedback = (o) => ({
    trueFb: `<ok>${o.ggbName}</ok>`,
    falseFb: `<ko>${o.ggbName}</ko>`
});

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, ggbBuildFilterTag, ggbBuildOutputFeedback };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, instruction: '<p>Tracez.</p>',
        materialId: 'abc123', width: 700, height: 500, showToolbar: false,
        inputs: [{ ggbName: 'a', expr: '3' }],
        outputs: [{ ggbName: 'resultat', type: 'numerical', tans: '9', tol: '0.1' }],
        rememberAttr: '', modelPreset: null,
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

test('genGeoGebraCore : vars Maxima construites depuis inputs (ggbName: expr)', () => {
    const q = genGeoGebraCore(1, baseParams({ inputs: [{ ggbName: 'a', expr: '3' }, { ggbName: 'b', expr: '5' }] }), DEPS);
    assert.match(q.vars, /a: 3;/);
    assert.match(q.vars, /b: 5;/);
});

test('genGeoGebraCore : modelPreset ajoute afficherCorrige: true aux vars', () => {
    const q = genGeoGebraCore(1, baseParams({ modelPreset: { texFx: 'x^2' } }), DEPS);
    assert.match(q.vars, /afficherCorrige: true;/);
});

test('genGeoGebraCore : un nœud PRT par sortie, score réparti sur N', () => {
    const q = genGeoGebraCore(1, baseParams({
        outputs: [{ ggbName: 'o1', type: 'numerical', tans: '1' }, { ggbName: 'o2', type: 'boolean', tans: 'true' }]
    }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].truescore, '0.5');
    assert.equal(q.prt.nodes[0].truenextnode, '1');
    assert.equal(q.prt.nodes[1].truenextnode, '-1');
});

test('genGeoGebraCore : critère numerical tol produit un test abs(...) <= tol', () => {
    const q = genGeoGebraCore(1, baseParams({ outputs: [{ ggbName: 'r', type: 'numerical', tans: '9', tol: '0.5' }] }), DEPS);
    assert.match(q.prtXML, /abs\(r - \(9\)\) <= 0\.5/);
});

test('genGeoGebraCore : critère numerical compareMode="sign" produit un test de signe', () => {
    const q = genGeoGebraCore(1, baseParams({ outputs: [{ ggbName: 'r', type: 'numerical', tans: '-2', compareMode: 'sign' }] }), DEPS);
    assert.match(q.prtXML, /\(r\)\*\(-2\) > 0/);
});

test('genGeoGebraCore : critère boolean compare à true/false littéral', () => {
    const q = genGeoGebraCore(1, baseParams({ outputs: [{ ggbName: 'ok', type: 'boolean', tans: 'false' }] }), DEPS);
    assert.match(q.prtXML, /if ok = false then 1 else 0/);
});

test('genGeoGebraCore : critère string compare via sdowncase/strim', () => {
    const q = genGeoGebraCore(1, baseParams({ outputs: [{ ggbName: 's', type: 'string', tans: 'Bonjour' }] }), DEPS);
    assert.match(q.prtXML, /sdowncase\("Bonjour"\)/);
});

test('genGeoGebraCore : rememberAttr ajoute un input string "remember"', () => {
    const q = genGeoGebraCore(1, baseParams({ rememberAttr: 'a,b' }), DEPS);
    assert.match(q.inputXML, /<name>remember<\/name>/);
});

test('genGeoGebraCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genGeoGebraCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genGeoGebraCore : modelPreset construit une instance de correction dans generalFeedback', () => {
    const q = genGeoGebraCore(1, baseParams({ modelPreset: { texFx: 'x^2' } }), DEPS);
    assert.match(q.generalFeedback, /\[\[geogebra/);
});

test('genGeoGebraCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genGeoGebraCore(1, baseParams({
        outputs: [
            { ggbName: 'o1', type: 'numerical', tans: '1' },
            { ggbName: 'o2', type: 'boolean', tans: 'true' },
            { ggbName: 'o3', type: 'string', tans: 'ok' }
        ],
        rememberAttr: 'a'
    }), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
