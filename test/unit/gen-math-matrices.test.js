// Tests unitaires du cœur pur de gen-math-matrices.js (genMatricesCore).
//
// Lancer :  npm test
//
// genMatricesCore() ne lit jamais document : tout est passé en p (voir la
// fonction genMatrices(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genMatricesCore } = require(path.join('..', '..', 'js', 'gen-math-matrices.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        scenario: 'det-2x2',
        fbOk: '', fbWrong: '',
        custText: '',
        mn: -3, mx: 3,
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

test("scenario 'det-2x2' produit 3 nœuds PRT (correct/trace/signe) et 2 diagNodes", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'det-2x2' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.vars, /q1_ta:q1_a11\*q1_a22-q1_a12\*q1_a21;/);
});

test("scenario 'produit-2x2' produit 2 nœuds PRT (correct/B*A confondu)", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'produit-2x2' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.match(q.vars, /q1_ta:q1_A\.q1_B;/);
});

test("scenario 'det-3x3' utilise determinant() de Maxima, 1 seul nœud", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'det-3x3' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.match(q.vars, /q1_ta:determinant\(q1_M\);/);
});

test("scenario 'trace-3x3' calcule la somme diagonale et détecte la confusion avec det", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'trace-3x3' }), DEPS);
    assert.match(q.vars, /q1_ta:q1_a11\+q1_a22\+q1_a33;/);
    assert.equal(q.prt.nodes.length, 2);
});

test("scenario 'transpose-3x3' utilise transpose() de Maxima", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'transpose-3x3' }), DEPS);
    assert.match(q.vars, /q1_ta:transpose\(q1_M\);/);
});

test("scenario 'systeme-2x2' génère un système non dégénéré (déterminant non nul)", () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'systeme-2x2' }), DEPS);
    assert.match(q.vars, /while q1_a\*q1_d-q1_b\*q1_c=0 do/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut du 1er nœud', () => {
    const q = genMatricesCore(1, baseParams({ scenario: 'det-3x3', fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genMatricesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque scenario', () => {
    ['det-2x2', 'produit-2x2', 'det-3x3', 'trace-3x3', 'transpose-3x3', 'systeme-2x2'].forEach(scenario => {
        const q = genMatricesCore(1, baseParams({ scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}]`);
    });
});
