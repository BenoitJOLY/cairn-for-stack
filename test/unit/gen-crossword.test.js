// Tests unitaires du cœur pur de gen-crossword.js (genCrosswordCore).
//
// Lancer :  npm test
//
// genCrosswordCore() ne lit jamais document/currentPlacedWords/currentGridData :
// tout est passé en p (voir la fonction genCrossword(X), seul point de contact
// avec l'état global du DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCrosswordCore } = require(path.join('..', '..', 'js', 'gen-crossword.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const generateCWMaximaString = (word) => {
    const parts = [];
    for (let i = 0; i < word.length; i++) parts.push(`ascii(${word.charCodeAt(i)})`);
    return `sconcat(${parts.join(',')})`;
};
const renderCWGridHTML = (grid, maxX, maxY) => `<div class="grid">${maxX}x${maxY}</div>`;
const renderCWGridHTMLEmpty = (grid, maxX, maxY) => `<table>${maxX}x${maxY}</table>`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, generateCWMaximaString, renderCWGridHTML, renderCWGridHTMLEmpty };

function baseGridData() {
    return {
        maxX: 2, maxY: 1,
        grid: {
            '0,0': { number: 1, letter: 'C' },
            '1,0': { letter: 'H' },
            '2,0': { letter: 'A' }
        }
    };
}

function basePlacedWords() {
    return [
        { word: 'CHA', number: 1, direction: 'H', x: 0, y: 0, def: 'Félin' }
    ];
}

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        placedWords: basePlacedWords(),
        gridData: baseGridData(),
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

test('un input par mot placé, nommé cwX_index', () => {
    const q = genCrosswordCore(1, baseParams({ placedWords: [
        { word: 'CHAT', number: 1, direction: 'H', x: 0, y: 0, def: 'Félin' },
        { word: 'OS', number: 2, direction: 'V', x: 0, y: 0, def: 'Squelette' }
    ] }), DEPS);
    assert.equal((q.inputXML.match(/<input>/g) || []).length, 2);
    assert.match(q.inputXML, /<name>cw1_1<\/name>/);
    assert.match(q.inputXML, /<name>cw1_2<\/name>/);
});

test('vars encode chaque mot via generateCWMaximaString et construit all_ta', () => {
    const q = genCrosswordCore(1, baseParams(), DEPS);
    assert.match(q.vars, /cw1_1_ta: sconcat\(ascii\(67\),ascii\(72\),ascii\(65\)\);/);
    assert.match(q.vars, /all_ta: \[cw1_1_ta\];/);
    assert.match(q.vars, /levenshtein\(s,t\) := block\(/);
});

test('un seul nœud PRT comparant score à 1', () => {
    const q = genCrosswordCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'score');
    assert.equal(q.prt.nodes[0].tans, '1');
});

test('cwEmptyGrid et cwFilledGrid délèguent aux helpers de rendu injectés', () => {
    const q = genCrosswordCore(1, baseParams(), DEPS);
    assert.equal(q.cwEmptyGrid, '<table>2x1</table>');
    assert.equal(q.cwFilledGrid, '<div class="grid">2x1</div>');
});

test('cwDefinitionsOnly contient les définitions horizontales et verticales', () => {
    const q = genCrosswordCore(1, baseParams({ placedWords: [
        { word: 'CHAT', number: 1, direction: 'H', x: 0, y: 0, def: 'Félin' },
        { word: 'OS', number: 2, direction: 'V', x: 0, y: 0, def: 'Squelette' }
    ] }), DEPS);
    assert.match(q.cwDefinitionsOnly, /Félin/);
    assert.match(q.cwDefinitionsOnly, /Squelette/);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genCrosswordCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genCrosswordCore(1, baseParams({ placedWords: [
        { word: 'CHAT', number: 1, direction: 'H', x: 0, y: 0, def: 'Félin' },
        { word: 'OS', number: 2, direction: 'V', x: 0, y: 0, def: 'Squelette' }
    ] }), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
