// Tests unitaires du cœur pur de gen-jxgdrop.js (genJxgDropCore).
//
// Lancer :  npm test
//
// genJxgDropCore() ne lit jamais document/window._jdState : tout est
// passé en p (voir genJxgDrop(X), seul point de contact avec le DOM).
// jxgDropBuildSolutionImage(st) utilise document.createElement('canvas') :
// c'est le seul appel impur, résolu dans le wrapper et transmis via
// p.solutionImgData.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genJxgDropCore, jxgDropChunkedJsString, jxgDropChunkedRaw } = require(path.join('..', '..', 'js', 'gen-jxgdrop.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const htmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, htmlEsc, jxgDropChunkedJsString, jxgDropChunkedRaw };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, instruction: '', zonesVisible: true,
        bgW: 400, bgH: 300, bgData: 'data:image/png;base64,AAAA',
        zones: [{ shape: 'rect', x: 10, y: 10, w: 50, h: 20, assignment: 1 }],
        proposals: [{ id: 1, text: 'Alpha' }, { id: 2, text: 'Beta' }],
        solutionImgData: '',
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

test('genJxgDropCore : un input par zone, tans = [0, 0]', () => {
    const q = genJxgDropCore(1, baseParams({
        zones: [{ shape: 'rect', x: 0, y: 0, w: 10, h: 10, assignment: 1 }, { shape: 'circle', x: 20, y: 20, r: 5, assignment: 2 }]
    }), DEPS);
    assert.equal((q.inputXML.match(/<input>/g) || []).length, 2);
    assert.match(q.inputXML, /<name>ans1z1<\/name>/);
    assert.match(q.inputXML, /<name>ans1z2<\/name>/);
});

test("genJxgDropCore : okItems compare ans[1] à l'indice séquentiel 1-based de la proposition assignée", () => {
    const q = genJxgDropCore(1, baseParams({
        proposals: [{ id: 1, text: 'A' }, { id: 2, text: 'B' }],
        zones: [{ shape: 'rect', x: 0, y: 0, w: 10, h: 10, assignment: 2 }]
    }), DEPS);
    assert.match(q.prtXML, /if ans1z1\[1\]=2 then 1 else 0/);
});

test('genJxgDropCore : plusieurs assignments possibles → member(...)', () => {
    const q = genJxgDropCore(1, baseParams({
        proposals: [{ id: 1, text: 'A' }, { id: 2, text: 'B' }],
        zones: [{ shape: 'rect', x: 0, y: 0, w: 10, h: 10, assignments: [1, 2] }]
    }), DEPS);
    assert.match(q.prtXML, /member\(ans1z1\[1\],\[1,2\]\)/);
});

test('genJxgDropCore : un seul nœud PRT, sans = sc_X (score fractionnaire)', () => {
    const q = genJxgDropCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'sc_1');
});

test('genJxgDropCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genJxgDropCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genJxgDropCore : solutionImgData (précalculé par le wrapper) produit une balise <img>', () => {
    const q = genJxgDropCore(1, baseParams({ solutionImgData: 'data:image/jpeg;base64,ZZZZ' }), DEPS);
    assert.match(q.solutionImg, /<img src="data:image\/jpeg;base64,ZZZZ"/);
});

test('genJxgDropCore : solutionImgData vide (pas de canvas dispo) ne produit pas de <img>', () => {
    const q = genJxgDropCore(1, baseParams({ solutionImgData: '' }), DEPS);
    assert.equal(q.solutionImg, '');
});

test('genJxgDropCore : kbdRaw encode bgData via jxgDropChunkedJsString injecté', () => {
    const q = genJxgDropCore(1, baseParams({ bgData: 'XYZ' }), DEPS);
    assert.match(q.kbdRaw, /'XYZ'/);
});

test('genJxgDropCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genJxgDropCore(1, baseParams({
        zones: [{ shape: 'rect', x: 0, y: 0, w: 10, h: 10, assignments: [1, 2] }, { shape: 'circle', x: 20, y: 20, r: 5, assignment: 1 }]
    }), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
