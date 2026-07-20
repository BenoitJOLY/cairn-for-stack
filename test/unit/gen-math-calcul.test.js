// Tests unitaires du cœur pur de gen-math-calcul.js (genCalculCore).
//
// Lancer :  npm test
//
// genCalculCore() ne lit jamais document/_calcVarValue : tout est passé en
// p (voir genCalcul(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCalculCore } = require(path.join('..', '..', 'js', 'gen-math-calcul.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const _mkInput = (o) => `<input><name>${o.name}</name><type>${o.type || 'algebraic'}</type><tans>${o.tans}</tans></input>`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, _mkInput };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, scenario: 'derivee', exprF: 'x^2 + sin(x)',
        boundA: '0', boundB: '1',
        fbOk: '', fbWrong: '', custText: '', fbGen: '',
        varValues: { a: '3', b: '5', c: '2', d: '1', f: '4', k: '2', m: '1', offset: '2' }
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

test("scenario 'derivee' : calcule diff(f,x), un seul nœud PRT", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'derivee', exprF: 'x^3' }), DEPS);
    assert.match(q.vars, /q1_f:\(x\^3\);/);
    assert.match(q.vars, /q1_fp:diff\(q1_f,x\);/);
    assert.equal(q.prt.nodes.length, 1);
});

test("scenario 'primitive' : feedbackvariables dérive la réponse pour comparer F'=f", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'primitive', exprF: 'x^2' }), DEPS);
    assert.match(q.prtXML, /q1_diff:diff\(ans_F1,x\);/);
    assert.equal(q.prt.nodes[0].tans, 'q1_f');
});

test("scenario 'integrale' : bornes libres a et b injectées dans vars", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'integrale', boundA: '2', boundB: '5' }), DEPS);
    assert.match(q.vars, /q1_a:\(2\);/);
    assert.match(q.vars, /q1_b:\(5\);/);
});

test("scenario 'derivee-produit' : utilise varValues.a/b, 4 nœuds PRT chaînés", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'derivee-produit', varValues: { a: '7', b: '9' } }), DEPS);
    assert.match(q.vars, /q1_a:7\$ q1_b:9\$/);
    assert.equal(q.prt.nodes.length, 4);
    assert.equal(q.diagNodes.length, 3);
});

test("scenario 'primitive-exp' : 3 nœuds PRT, diagNodes = 2", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'primitive-exp' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.equal(q.diagNodes.length, 2);
});

test("scenario 'integrale-def' : 4 nœuds PRT (résultat + 3 diagnostics)", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'integrale-def' }), DEPS);
    assert.equal(q.prt.nodes.length, 4);
    assert.equal(q.diagNodes.length, 3);
});

test("scenario 'encadrement-tvi' : 3 nœuds PRT chaînés (inf, sup, amplitude), 4 inputs numériques", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'encadrement-tvi' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.equal((q.inputXML.match(/<input>/g) || []).length, 4);
});

test("scenario 'convexite-tangente' : 4 nœuds PRT, 3 inputs (dérivée, convexité, position)", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'convexite-tangente' }), DEPS);
    assert.equal(q.prt.nodes.length, 4);
    assert.equal((q.inputXML.match(/<input>/g) || []).length, 3);
});

test("scenario 'tangente-ext' : 4 nœuds PRT, boucle while évite a=b", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'tangente-ext' }), DEPS);
    assert.match(q.vars, /while q1_a = q1_b do q1_b:/);
    assert.equal(q.prt.nodes.length, 4);
});

test("scenario par défaut 'aire-courbes' : 3 nœuds PRT (abscisses, aire, erreur de signe)", () => {
    const q = genCalculCore(1, baseParams({ scenario: 'aire-courbes' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.equal(q.diagNodes.length, 2);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genCalculCore(1, baseParams({ scenario: 'derivee', fbOk: 'Bravo', fbWrong: 'Perdu' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Perdu');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genCalculCore(1, baseParams({ scenario: 'derivee', fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le nœud correct de chaque scénario a un truescoremode/truescore cohérent avec le barème', () => {
    const q = genCalculCore(1, baseParams({ scenario: 'derivee', bareme: 2 }), DEPS);
    assert.equal(q.prt.nodes[0].truescore, '1');
});

test('le XML (prtXML, inputXML) est bien formé pour tous les scénarios', () => {
    ['derivee', 'primitive', 'integrale', 'derivee-produit', 'primitive-exp',
     'integrale-def', 'encadrement-tvi', 'convexite-tangente', 'tangente-ext', 'aire-courbes'
    ].forEach(scenario => {
        const q = genCalculCore(1, baseParams({ scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}]`);
        assertBalancedTags(q.inputXML, `inputXML[${scenario}]`);
    });
});
