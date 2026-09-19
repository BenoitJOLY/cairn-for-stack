// Tests unitaires du cœur pur de gen-imgslideshow.js (genImgSlideshowCore).
//
// Lancer :  npm test
//
// Le cœur ne lit jamais document/window._imslState : tout est passé en p
// (voir genImgSlideshow(X) et genImgSlideshowParams(), seuls points de
// contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genImgSlideshowCore } = require(path.join('..', '..', 'js', 'gen-imgslideshow.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const rawEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const htmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jxgDropChunkedJsString = (str, size) => '"' + (str || '') + '"';

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, rawEsc, htmlEsc, jxgDropChunkedJsString, applyFbBox, inferFbKind };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, text: '', fbOkTxt: '', fbWrTxt: '', fbGen: '',
        interval: 2, timeLimit: 15,
        images: [
            { data: 'AAA', w: 400, h: 300 },
            { data: 'BBB', w: 400, h: 300 }
        ],
        props: [
            { id: 'p0', text: 'Réponse A' },
            { id: 'p1', text: 'Réponse B' }
        ],
        correctPropId: 'p0'
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

test('genImgSlideshowCore : input string avec tans = id de la proposition correcte', () => {
    const q = genImgSlideshowCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<type>string<\/type>/);
    assert.match(q.inputXML, /<tans><!\[CDATA\["p0"\]\]><\/tans>/);
});

test('genImgSlideshowCore : cascade de 2 nœuds PRT (bonne réponse, puis temps écoulé / mauvaise réponse)', () => {
    const q = genImgSlideshowCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].tans, '"p0"');
    assert.equal(q.prt.nodes[0].falsenextnode, '1');
    assert.equal(q.prt.nodes[1].tans, '"_timeout_"');
});

test('genImgSlideshowCore : feedback timeout et mauvaise réponse révèlent la bonne proposition', () => {
    const q = genImgSlideshowCore(1, baseParams(), DEPS);
    assert.match(q.prt.nodes[1].truefeedback, /Réponse A/);
    assert.match(q.prt.nodes[1].falsefeedback, /Réponse A/);
});

test('genImgSlideshowCore : interval et timeLimit alimentent le JS embarqué', () => {
    const q = genImgSlideshowCore(1, baseParams({ interval: 3, timeLimit: 20 }), DEPS);
    assert.match(q.kbdRaw, /var INTERVALLE=3\*1000;/);
    assert.match(q.kbdRaw, /var TEMPS=20;/);
});

test('genImgSlideshowCore : chaque image est encodée via jxgDropChunkedJsString injecté', () => {
    const q = genImgSlideshowCore(1, baseParams({ images: [{ data: 'XYZ1', w: 400, h: 300 }, { data: 'XYZ2', w: 400, h: 300 }] }), DEPS);
    assert.match(q.kbdRaw, /"XYZ1"/);
    assert.match(q.kbdRaw, /"XYZ2"/);
});

test('genImgSlideshowCore : le minuteur écrit "_timeout_" dans le champ caché via verrouiller()', () => {
    const q = genImgSlideshowCore(1, baseParams(), DEPS);
    assert.match(q.kbdRaw, /verrouiller\("_timeout_"\)/);
    assert.match(q.kbdRaw, /inputEl\.value=valeur;/);
});

test('genImgSlideshowCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genImgSlideshowCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genImgSlideshowCore : generalFeedback est encadré (applyFbBox "general") quand il y a du contenu', () => {
    const q = genImgSlideshowCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('genImgSlideshowCore : XML bien formé (prtXML et inputXML)', () => {
    const q = genImgSlideshowCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});

test('genImgSlideshowCore : les propositions génèrent des boutons avec leur texte échappé (rawEsc)', () => {
    const q = genImgSlideshowCore(1, baseParams({ props: [{ id: 'p0', text: 'A "citée"' }, { id: 'p1', text: 'B' }] }), DEPS);
    assert.match(q.kbdRaw, /id:"p0",text:"A &quot;cit/);
});
