// Tests unitaires du cœur pur de gen-image-mesure.js (genImageMesureCore).
//
// Lancer :  npm test
//
// genImageMesureCore() ne lit jamais document : tout est passé en p (voir
// genImageMesure(X), seul point de contact avec le DOM — y compris la
// lecture des lignes de cibles .imm-target-row et les alert() de
// validation, qui restent dans le wrapper).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genImageMesureCore } = require(path.join('..', '..', 'js', 'gen-image-mesure.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { jxgDropChunkedJsString } = require(path.join('..', '..', 'js', 'gen-jxgdrop.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function htmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

const DEPS = { I18N: I18N_STUB, _mkFbGen, buildPrtXml, htmlEsc, jxgDropChunkedJsString, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 2, text: '', imgData: 'data:image/jpeg;base64,XXXX', imgW: 400, imgH: 300,
        r1x: 0, r1y: 0, r1v: 0, r2x: 100, r2y: 0, r2v: 10,
        unit: 'cm', tol: 5, mode: 'guide', fbOk: 'Bravo', fbWrong: 'Raté',
        fbGenRaw: '',
        targets: [{ desc: 'Distance A-B', val: 5, type: 'position', hasPx: true, pxDist: 50 }]
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

test('genImageMesureCore : mode guide — 3 inputs (échelle, distance brute, valeur finale) pour une cible position', () => {
    const q = genImageMesureCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>imm1ec<\/name>/);
    assert.match(q.inputXML, /<name>imm1r1<\/name>/);
    assert.match(q.inputXML, /<name>imm1a1<\/name>/);
});

test('genImageMesureCore : mode guide — 3 blocs PRT (échelle, distance brute, valeur finale)', () => {
    const q = genImageMesureCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prtimm1ec<\/name>/);
    assert.match(q.prtXML, /<name>prtimm1r1<\/name>/);
    assert.match(q.prtXML, /<name>prtimm11<\/name>/);
});

test('genImageMesureCore : mode guide — échelle déduite des repères (0.1 unité/px ici)', () => {
    const q = genImageMesureCore(1, baseParams(), DEPS);
    assert.match(q.vars, /imm1ec: 0\.1;/);
});

test('genImageMesureCore : mode guide — fbOk/fbWrong personnalisés apparaissent dans le PRT', () => {
    const q = genImageMesureCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /Bravo/);
    assert.match(q.prtXML, /Raté/);
});

test('genImageMesureCore : cible de type écart n\'a pas d\'input de distance brute séparé (mode guide)', () => {
    const q = genImageMesureCore(1, baseParams({
        targets: [{ desc: 'Écart X', val: 3, type: 'ecart', hasPx: true, pxDist: 30 }]
    }), DEPS);
    assert.doesNotMatch(q.inputXML, /<name>imm1r1<\/name>/);
    assert.match(q.inputXML, /<name>imm1a1<\/name>/);
});

test('genImageMesureCore : mode autonome — input échelle + 1 input par cible, PRT à 2 nœuds (final + diagnostic échelle)', () => {
    const q = genImageMesureCore(1, baseParams({ mode: 'autonome' }), DEPS);
    assert.match(q.inputXML, /<name>imm1ec<\/name>/);
    assert.match(q.inputXML, /<name>imm1a1<\/name>/);
    assert.match(q.prtXML, /<name>prtimm11<\/name>/);
    assert.match(q.prtXML, /<name>1<\/name>[\s\S]*Diagnostic/);
});

test('genImageMesureCore : mode expert — aucun input d\'échelle, PRT neutre 1 nœud par cible', () => {
    const q = genImageMesureCore(1, baseParams({ mode: 'expert' }), DEPS);
    assert.doesNotMatch(q.inputXML, /<name>imm1ec<\/name>/);
    assert.match(q.inputXML, /<name>imm1a1<\/name>/);
});

test('genImageMesureCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genImageMesureCore(1, baseParams({ fbGenRaw: 'Remarque additionnelle' }), DEPS);
    assert.match(q.generalFeedback, /Remarque additionnelle/);
});

test('genImageMesureCore : textFrag affiche le libellé du mode et le barème', () => {
    const q = genImageMesureCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.match(q.textFrag, /\/ 3 pt/);
    assert.match(q.textFrag, /imm\.mode_guide_lbl/);
});

test('genImageMesureCore : le XML (prtXML, inputXML) est bien formé pour chaque mode', () => {
    ['guide', 'autonome', 'expert'].forEach(mode => {
        const q = genImageMesureCore(1, baseParams({ mode }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML (${mode})`);
        assertBalancedTags(q.inputXML, `inputXML (${mode})`);
    });
});
