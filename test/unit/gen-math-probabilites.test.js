// Tests unitaires du cœur pur de gen-math-probabilites.js (genProbabilitesCore).
//
// Lancer :  npm test
//
// genProbabilitesCore() ne lit jamais document : tout est passé en p (voir la
// fonction genProbabilites(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genProbabilitesCore } = require(path.join('..', '..', 'js', 'gen-math-probabilites.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        scenario: 'combinaison',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '',
        fbGen: '',
        raw: {}
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

test("scenario 'combinaison' produit binomial(n,k) et 1 nœud (fallback replié en falsefeedback)", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'combinaison' }), DEPS);
    assert.match(q.vars, /q1_ta:binomial\(q1_n,q1_k\);/);
    assert.equal(q.prt.nodes.length, 1);
    assert.notEqual(q.prt.nodes[0].falsefeedback, '');
});

test("scenario 'combinaison' en mode fixe utilise n/k saisis (bornés)", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'combinaison', mode: 'fixe', raw: { 'prob-n': '10', 'prob-k': '4' } }), DEPS);
    assert.match(q.vars, /q1_n:10;/);
    assert.match(q.vars, /q1_k:max\(2,min\(4,q1_n-2\)\);/);
});

test("scenario 'binom-pk' produit 3 nœuds de diagnostic + fallback replié", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'binom-pk' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.vars, /q1_err_swap:binomial\(q1_n,q1_k\)\*q1_q\^q1_k\*q1_p\^\(q1_n-q1_k\);/);
});

test("scenario 'binom-esp' calcule E(X)=n*p", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'binom-esp' }), DEPS);
    assert.match(q.vars, /q1_ta:q1_n\*q1_p;/);
});

test("scenario 'binom-var' calcule V(X)=n*p*q", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'binom-var' }), DEPS);
    assert.match(q.vars, /q1_ta:q1_n\*q1_p\*q1_q;/);
});

test("scenario 'proba-cond' calcule P(A|D) via Bayes", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'proba-cond' }), DEPS);
    assert.match(q.vars, /q1_ta:q1_pAD\/q1_pD;/);
});

test("scenario par défaut (proba-union) calcule P\\(A∪B\\)=pA\\+pB-pI", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'proba-union' }), DEPS);
    assert.match(q.vars, /q1_ta:q1_pA\+q1_pB-q1_pI;/);
});

test("declFrac en mode fixe convertit une saisie décimale en fraction \\/20", () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'binom-esp', mode: 'fixe', raw: { 'prob-p': '0.25' } }), DEPS);
    assert.match(q.vars, /q1_p:max\(1,min\(round\(0\.25\*20\),19\)\)\/20;/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'combinaison', fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
});

test('diagNodes expose les nœuds de diagnostic intermédiaires (binom-pk)', () => {
    const q = genProbabilitesCore(1, baseParams({ scenario: 'binom-pk' }), DEPS);
    assert.equal(q.diagNodes.length, 2);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genProbabilitesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque combinaison mode/scenario', () => {
    ['aleatoire', 'fixe'].forEach(mode => {
        ['combinaison', 'binom-pk', 'binom-esp', 'binom-var', 'proba-cond', 'proba-union'].forEach(scenario => {
            const q = genProbabilitesCore(1, baseParams({ mode, scenario }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML[${mode}/${scenario}]`);
            assertBalancedTags(q.inputXML, `inputXML[${mode}/${scenario}]`);
        });
    });
});
