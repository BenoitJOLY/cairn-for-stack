// Tests unitaires du cœur pur de gen-match.js (genMatchCore).
//
// Lancer :  npm test
//
// genMatchCore() ne lit jamais document/matchState : tout est passé en
// p (voir genMatch(X), seul point de contact avec le DOM/l'état global).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genMatchCore } = require(path.join('..', '..', 'js', 'gen-match.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
function escapeMaximaString(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, escapeMaximaString };

function baseParams(overrides) {
    return Object.assign({
        bareme: 2, text: '',
        left: [{ html: 'A' }, { html: 'B' }],
        right: [{ html: '1' }, { html: '2' }],
        connections: [{ l: 0, r: 0 }, { l: 1, r: 1 }],
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

test('genMatchCore : listes Maxima construites depuis left/right/connections via escapeMaximaString', () => {
    const q = genMatchCore(1, baseParams(), DEPS);
    assert.match(q.vars, /list_left: \["A","B"\];/);
    assert.match(q.vars, /list_right: \["1","2"\];/);
    assert.match(q.vars, /tans: \[\["A", "1"\],\["B", "2"\]\];/);
});

test('genMatchCore : échappe les guillemets/backslashes via escapeMaximaString injecté', () => {
    const q = genMatchCore(1, baseParams({ left: [{ html: 'A"B' }], right: [{ html: '1' }], connections: [{ l: 0, r: 0 }] }), DEPS);
    assert.match(q.vars, /list_left: \["A\\"B"\];/);
});

test('genMatchCore : qnote reflète le nombre de left/right', () => {
    const q = genMatchCore(1, baseParams({
        left: [{ html: 'A' }, { html: 'B' }, { html: 'C' }], right: [{ html: '1' }],
        connections: [{ l: 0, r: 0 }]
    }), DEPS);
    assert.equal(q.qnote, 'Match (3/1)');
});

test('genMatchCore : un seul nœud PRT (note_calculee vs 1)', () => {
    const q = genMatchCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'note_calculee');
    assert.equal(q.prt.nodes[0].tans, '1');
});

test('genMatchCore : le nœud correct porte le barème complet', () => {
    const q = genMatchCore(1, baseParams({ bareme: 5 }), DEPS);
    assert.equal(q.prt.nodes[0].truescore, '1');
    assert.match(q.prt.nodes[0].falsefeedback, /\/ 5/);
});

test('genMatchCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genMatchCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genMatchCore : kbdRaw (jsxCode) et kbdRawFbGen (jsxSol) sont générés', () => {
    const q = genMatchCore(1, baseParams(), DEPS);
    assert.match(q.kbdRaw, /match_leftData/);
    assert.match(q.kbdRawFbGen, /./);
});

test('genMatchCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genMatchCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
