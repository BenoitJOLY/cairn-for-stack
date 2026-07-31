// Tests unitaires du cœur pur de gen-oscilloscope.js (genOscilloscopeCore).
//
// Lancer :  npm test
//
// genOscilloscopeCore() ne lit jamais document : tout est passé en p (voir
// genOscilloscope(X), seul point de contact avec le DOM). _oscInputHintsHTML
// et _oscSimplePair utilisent I18N en interne (globale) : ils sont injectés
// comme un tout via deps._oscInputHintsHTML / deps._oscSimplePair plutôt que
// réécrits en interne.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genOscilloscopeCore } = require(path.join('..', '..', 'js', 'gen-oscilloscope.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function _oscInputHintsHTML(exList) {
    return '<div class="hints">' + I18N_STUB.t('osc.hint_title') + exList + '</div>';
}
function _oscSimplePair(idPrefix, q1, q2, neutral) {
    return [
        { name: '0', description: 'Vérification ' + q1.label, answertest: 'UnitsRelative', sans: q1.sans, tans: q1.tans, testoptions: q1.testopt, quiet: '0', truescoremode: '+', truescore: '0.5', truepenalty: '', truenextnode: '1', trueanswernote: idPrefix + '-0-T', truefeedback: '', falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '1', falseanswernote: idPrefix + '-0-F', falsefeedback: '' },
        { name: '1', description: 'Vérification ' + q2.label, answertest: 'UnitsRelative', sans: q2.sans, tans: q2.tans, testoptions: q2.testopt, quiet: '0', truescoremode: '+', truescore: '0.5', truepenalty: '', truenextnode: '-1', trueanswernote: idPrefix + '-1-T', truefeedback: '', falsescoremode: '-', falsescore: '0', falsepenalty: '', falsenextnode: '-1', falseanswernote: idPrefix + '-1-F', falsefeedback: '' }
    ];
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, _oscInputHintsHTML, _oscSimplePair, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        mode: 'periode_frequence', pedMode: 'guide', bareme: 1,
        text: '', fbGen: '', shIdx: 10, svIdx: 7
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

test('genOscilloscopeCore : période/fréquence — mode guidé, 6 nœuds PRT', () => {
    const q = genOscilloscopeCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 6);
    assert.match(q.inputXML, /<name>ans_T1<\/name>/);
    assert.match(q.inputXML, /<name>ans_F1<\/name>/);
});

test('genOscilloscopeCore : période/fréquence — mode autonome/expert, 2 nœuds PRT via _oscSimplePair injecté', () => {
    const qAuto = genOscilloscopeCore(1, baseParams({ pedMode: 'autonome' }), DEPS);
    assert.equal(qAuto.prt.nodes.length, 2);
    const qExpert = genOscilloscopeCore(1, baseParams({ pedMode: 'expert' }), DEPS);
    assert.equal(qExpert.prt.nodes.length, 2);
});

test('genOscilloscopeCore : RC charge — 6 nœuds PRT guidés, inputs E et tau', () => {
    const q = genOscilloscopeCore(2, baseParams({ mode: 'rc_charge' }), DEPS);
    assert.equal(q.prt.nodes.length, 6);
    assert.match(q.inputXML, /<name>ans_E2<\/name>/);
    assert.match(q.inputXML, /<name>ans_tau2<\/name>/);
});

test('genOscilloscopeCore : RC décharge — qnote distingue tau/E', () => {
    const q = genOscilloscopeCore(1, baseParams({ mode: 'rc_decharge' }), DEPS);
    assert.match(q.qnote, /tau=/);
});

test('genOscilloscopeCore : retard — 7 nœuds PRT guidés, inputs fc et dt', () => {
    const q = genOscilloscopeCore(3, baseParams({ mode: 'retard' }), DEPS);
    assert.equal(q.prt.nodes.length, 7);
    assert.match(q.inputXML, /<name>ans_fc3<\/name>/);
    assert.match(q.inputXML, /<name>ans_dt3<\/name>/);
});

test('genOscilloscopeCore : bareme personnalisé propagé au prtMeta value et à la sortie', () => {
    const q = genOscilloscopeCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.bareme, 3);
    assert.equal(q.prt.meta.value, '3');
});

test('genOscilloscopeCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genOscilloscopeCore(1, baseParams({ fbGen: 'Remarque additionnelle' }), DEPS);
    assert.match(q.generalFeedback, /Remarque additionnelle/);
});

test('genOscilloscopeCore : previewFrag et textFrag intègrent le titre via I18N injecté', () => {
    const q = genOscilloscopeCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /osc\.title_periode_frequence/);
    assert.match(q.previewFrag, /osc\.title_periode_frequence/);
});

test('genOscilloscopeCore : jsxRaw (kbdRaw) contient le code JSXGraph généré', () => {
    const q = genOscilloscopeCore(1, baseParams(), DEPS);
    assert.match(q.kbdRaw, /jsxgraph/);
});

test('genOscilloscopeCore : le XML (prtXML, inputXML) est bien formé pour chaque mode', () => {
    ['periode_frequence', 'rc_charge', 'rc_decharge', 'retard'].forEach(mode => {
        const q = genOscilloscopeCore(1, baseParams({ mode }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML (${mode})`);
        assertBalancedTags(q.inputXML, `inputXML (${mode})`);
    });
});
