// Tests unitaires du cœur pur de gen-circuit.js (genCircuitCore).
//
// Lancer :  npm test
//
// genCircuitCore() ne lit jamais document : tout est passé en p (voir la
// fonction genCircuit(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCircuitCore } = require(path.join('..', '..', 'js', 'gen-circuit.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen };

function baseParams(overrides) {
    return Object.assign({
        scenario: 'loi-ohm', ask: 'i',
        e: 9, r1: 100, r2: 220, r3: 0,
        iKnown: 0, tol: 5, bareme: 1,
        fbOk: '', fbWrong: '', text: '', fbGen: ''
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

test("loi-ohm : ask='i' calcule tans=e/r1", () => {
    const q = genCircuitCore(1, baseParams({ scenario: 'loi-ohm', ask: 'i', e: 9, r1: 100 }), DEPS);
    assert.match(q.vars, /tans:cir_i;/);
    assert.match(q.inputXML, /<tans>9\/100<\/tans>/);
});

test("loi-ohm : ask='r' calcule tans=e/iKnown", () => {
    const q = genCircuitCore(1, baseParams({ scenario: 'loi-ohm', ask: 'r', e: 9, iKnown: 0.05 }), DEPS);
    assert.match(q.vars, /tans:cir_r;/);
});

test("serie : ask='r-eq' additionne r1+r2+r3", () => {
    const q = genCircuitCore(1, baseParams({ scenario: 'serie', ask: 'r-eq', r1: 100, r2: 200, r3: 50 }), DEPS);
    assert.match(q.inputXML, /<tans>350<\/tans>/);
});

test("parallele : ask='r-eq' calcule la résistance équivalente", () => {
    const q = genCircuitCore(1, baseParams({ scenario: 'parallele', ask: 'r-eq', r1: 100, r2: 100 }), DEPS);
    assert.match(q.vars, /cir_req:1\/\(1\/cir_r1\+1\/cir_r2\);/);
    assert.match(q.vars, /tans:cir_req;/);
});

test('un seul nœud PRT AlgEquiv comparant cir_ok à true', () => {
    const q = genCircuitCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'cir_ok');
    assert.equal(q.prt.nodes[0].tans, 'true');
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genCircuitCore(1, baseParams({ fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genCircuitCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('feedbackvariables contient la tolérance convertie en fraction', () => {
    const q = genCircuitCore(1, baseParams({ tol: 10 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /cir_tol_frac:0\.1000;/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque scenario/ask', () => {
    const cases = [
        ['loi-ohm', 'i'], ['loi-ohm', 'r'], ['loi-ohm', 'u'],
        ['serie', 'r-eq'], ['serie', 'i'], ['serie', 'u1'],
        ['parallele', 'r-eq'], ['parallele', 'i-total'], ['parallele', 'i1']
    ];
    cases.forEach(([scenario, ask]) => {
        const q = genCircuitCore(1, baseParams({ scenario, ask }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}/${ask}]`);
        assertBalancedTags(q.inputXML, `inputXML[${scenario}/${ask}]`);
    });
});
