// Tests unitaires des cœurs purs de gen-imgclick.js
// (genImgClickCore, genImgClickSequenceCore).
//
// Lancer :  npm test
//
// Les cœurs ne lisent jamais document/window._icState : tout est passé
// en p (voir genImgClick(X) et genImgClickSequence(...), seuls points
// de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genImgClickCore, genImgClickSequenceCore } = require(path.join('..', '..', 'js', 'gen-imgclick.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const wrapFb = (html, ok) => (ok ? '<ok>' : '<ko>') + html + (ok ? '</ok>' : '</ko>');
const rawEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const htmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jxgDropChunkedJsString = (str, size) => '"' + (str || '') + '"';

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, wrapFb, rawEsc, htmlEsc, jxgDropChunkedJsString, applyFbBox };

function baseParamsClick(overrides) {
    return Object.assign({
        bareme: 1, text: '', fbOkTxt: '', fbWrTxt: '',
        bgData: 'data:image/png;base64,AAAA', bgW: 400, bgH: 300,
        zone: { shape: 'rect', x: 10, y: 10, w: 50, h: 20, label: 'Zone A' },
        fbGen: ''
    }, overrides || {});
}

function baseParamsSeq(overrides) {
    return Object.assign({
        bareme: 1, text: '', fbOkTxt: '', fbWrTxt: '',
        seqTime: 5, bgData: 'data:image/png;base64,AAAA', bgW: 400, bgH: 300,
        zones: [
            { shape: 'rect', x: 0, y: 0, w: 20, h: 20, label: 'Un' },
            { shape: 'circle', x: 100, y: 100, r: 15, label: 'Deux' }
        ],
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

test('genImgClickCore : zone rectangle produit un tans = centre du rectangle', () => {
    const q = genImgClickCore(1, baseParamsClick(), DEPS);
    assert.equal(q.prt.nodes[0].tans, 'true');
    assert.match(q.inputXML, /<tans>\[35,280\]<\/tans>/);
});

test('genImgClickCore : zone circle produit un tans = [cx, cyMath]', () => {
    const q = genImgClickCore(1, baseParamsClick({ zone: { shape: 'circle', x: 50, y: 40, r: 10, label: '' } }), DEPS);
    assert.match(q.inputXML, /<tans>\[50,260\]<\/tans>/);
});

test('genImgClickCore : un seul nœud PRT, answertest AlgEquiv sur ic_in_X', () => {
    const q = genImgClickCore(1, baseParamsClick(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'ic_in_1');
});

test('genImgClickCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genImgClickCore(1, baseParamsClick({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genImgClickCore : generalFeedback est encadré (applyFbBox "general") quand il y a du contenu', () => {
    const q = genImgClickCore(1, baseParamsClick({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('genImgClickCore : kbdRaw encode bgData via jxgDropChunkedJsString injecté', () => {
    const q = genImgClickCore(1, baseParamsClick({ bgData: 'XYZ' }), DEPS);
    assert.match(q.kbdRaw, /"XYZ"/);
});

test('genImgClickCore : XML bien formé (rect et circle)', () => {
    [
        { shape: 'rect', x: 5, y: 5, w: 10, h: 10, label: 'R' },
        { shape: 'circle', x: 5, y: 5, r: 5, label: '' }
    ].forEach(zone => {
        const q = genImgClickCore(1, baseParamsClick({ zone }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${zone.shape}]`);
        assertBalancedTags(q.inputXML, `inputXML[${zone.shape}]`);
    });
});

test('genImgClickSequenceCore : input string avec tans "reussi"', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq(), DEPS);
    assert.match(q.inputXML, /<type>string<\/type>/);
    assert.equal(q.prt.nodes[0].tans, '"reussi"');
});

test('genImgClickSequenceCore : un seul nœud PRT (quiet=1)', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].quiet, '1');
});

test('genImgClickSequenceCore : seqTime alimente TEMPS dans le JS embarqué', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq({ seqTime: 9 }), DEPS);
    assert.match(q.kbdRaw, /var TEMPS=9;/);
});

test('genImgClickSequenceCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq({ fbGen: 'Bravo' }), DEPS);
    assert.match(q.generalFeedback, /Bravo/);
});

test('genImgClickSequenceCore : generalFeedback est encadré (applyFbBox "general") quand il y a du contenu', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq({ fbGen: 'Bravo' }), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('genImgClickSequenceCore : XML bien formé', () => {
    const q = genImgClickSequenceCore(1, baseParamsSeq(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
