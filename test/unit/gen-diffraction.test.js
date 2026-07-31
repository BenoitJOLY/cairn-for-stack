// Tests unitaires du cœur pur de gen-diffraction.js (genDiffractionCore).
//
// Lancer :  npm test
//
// genDiffractionCore() ne lit jamais document : tout est passé en p (voir
// genDiffraction(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genDiffractionCore } = require(path.join('..', '..', 'js', 'gen-diffraction.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function _diffBuildSvgPreview() {
    return { svg: '<svg>preview</svg>', meas: 'mesure: 1.00 mm' };
}

const DEPS = { I18N: I18N_STUB, _mkFbGen, _diffBuildSvgPreview, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        type: 'fente_simple', mode: 'ecran', bareme: 1,
        text: '<p>Énoncé.</p>', isRnd: true,
        aFix: 50, DFix: 2, bFix: 200, lambdaFix: 532, fbGenRaw: ''
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

test('genDiffractionCore : fente_simple — 8 inputs (7 sous-questions)', () => {
    const q = genDiffractionCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans81<\/name>/);
    assert.match(q.feedbackRef, /\[\[feedback:prt71\]\]/);
});

test('genDiffractionCore : young — nécessite b (needsB) et 6 sous-questions', () => {
    const q = genDiffractionCore(2, baseParams({ type: 'young' }), DEPS);
    assert.match(q.vars, /diffB2:/);
    assert.match(q.feedbackRef, /\[\[feedback:prt62\]\]/);
    assert.doesNotMatch(q.feedbackRef, /\[\[feedback:prt72\]\]/);
});

test('genDiffractionCore : fente_double — nécessite b également', () => {
    const q = genDiffractionCore(1, baseParams({ type: 'fente_double' }), DEPS);
    assert.match(q.vars, /diffB1:/);
});

test('genDiffractionCore : trou_circulaire et trou_carre — pas de b', () => {
    ['trou_circulaire', 'trou_carre'].forEach(type => {
        const q = genDiffractionCore(1, baseParams({ type }), DEPS);
        assert.doesNotMatch(q.vars, /diffB1:/);
    });
});

test('genDiffractionCore : mode fixe (isRnd=false) utilise aFix/DFix/bFix/lambdaFix', () => {
    const q = genDiffractionCore(1, baseParams({ isRnd: false, type: 'young', aFix: 60, DFix: 3, bFix: 300, lambdaFix: 650 }), DEPS);
    assert.match(q.vars, /diffA1: 60;/);
    assert.match(q.vars, /diffD1: 3;/);
    assert.match(q.vars, /diffB1: 300;/);
    assert.match(q.vars, /diffL1: 650;/);
});

test('genDiffractionCore : bareme personnalisé propagé à la sortie', () => {
    const q = genDiffractionCore(1, baseParams({ bareme: 4 }), DEPS);
    assert.equal(q.bareme, 4);
});

test('genDiffractionCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genDiffractionCore(1, baseParams({ fbGenRaw: 'Remarque diffraction' }), DEPS);
    assert.match(q.generalFeedback, /Remarque diffraction/);
});

test('genDiffractionCore : textFrag et previewFrag intègrent le titre via I18N injecté', () => {
    const q = genDiffractionCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /diff\.header_title/);
    assert.match(q.previewFrag, /diff\.header_title/);
});

test('genDiffractionCore : kbdRaw (JSXGraph) contient le code jsxgraph du template', () => {
    const q = genDiffractionCore(1, baseParams(), DEPS);
    assert.match(q.kbdRaw, /jsxgraph/);
});

test('genDiffractionCore : le XML (prtXML, inputXML) est bien formé pour chaque type', () => {
    ['fente_simple', 'fente_double', 'trou_circulaire', 'trou_carre', 'young'].forEach(type => {
        const q = genDiffractionCore(1, baseParams({ type }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML (${type})`);
        assertBalancedTags(q.inputXML, `inputXML (${type})`);
    });
});
