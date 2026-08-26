// Tests unitaires du cœur pur de gen-math-suites.js (genSuitesCore).
//
// Lancer :  npm test
//
// genSuitesCore() ne lit jamais document : tout est passé en p (voir la
// fonction genSuites(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genSuitesCore } = require(path.join('..', '..', 'js', 'gen-math-suites.js'));
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
        scenario: 'terme-arith',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '',
        fbGen: '',
        u0: null, u0Min: -5, u0Max: 5,
        r: null, rMin: -5, rMax: 5,
        q: null, qMin: -3, qMax: 3,
        k: null, kMin: 3, kMax: 6
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

test("scenario 'terme-arith' en mode fixe utilise u0/k/r saisis", () => {
    const q = genSuitesCore(1, baseParams({ mode: 'fixe', u0: 3, k: 5, r: 2 }), DEPS);
    assert.match(q.vars, /q1_U0:3;/);
    assert.match(q.vars, /q1_k:5;/);
    assert.match(q.vars, /q1_r:2;/);
    assert.equal(q.prt.nodes.length, 5);
});

test("scenario 'terme-arith' en mode aléatoire tire dans les bornes saisies", () => {
    const q = genSuitesCore(1, baseParams({ mode: 'aleatoire', u0Min: -2, u0Max: 2 }), DEPS);
    assert.match(q.vars, /q1_U0:ri\(-2,2\);/);
});

test("scenario 'terme-geo' produit 2 nœuds (correct + fallback générique)", () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'terme-geo' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.match(q.vars, /q1_Uk:q1_U0\*q1_q\^q1_k;/);
});

test("scenario 'somme-arith' calcule Sn = n*(U0+Un-1)/2", () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'somme-arith' }), DEPS);
    assert.match(q.vars, /q1_ans:n\*\(q1_U0\+q1_Un_1\)\/2;/);
    assert.equal(q.prt.nodes.length, 2);
});

test("scenario 'somme-geo' calcule Sn = U0*(1-q^n)\/(1-q)", () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'somme-geo' }), DEPS);
    assert.match(q.vars, /q1_ans:q1_U0\*\(1-q1_q\^n\)\/\(1-q1_q\);/);
});

test("scenario par défaut (limite-geo) donne une limite nulle", () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'limite-geo' }), DEPS);
    assert.match(q.vars, /q1_ans:0;/);
    assert.match(q.qnote, /limite=0/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut du nœud correct/fallback', () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'terme-geo', fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[q.prt.nodes.length - 1].truefeedback, 'Non');
});

test('diagNodes expose les nœuds de diagnostic intermédiaires', () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'terme-arith' }), DEPS);
    assert.equal(q.diagNodes.length, 3);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genSuitesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test("mode fixe : valeur nulle ou interdite (ex: q=1) retombe sur la valeur par défaut", () => {
    const q = genSuitesCore(1, baseParams({ scenario: 'somme-geo', mode: 'fixe', q: 1 }), DEPS);
    assert.match(q.vars, /q1_q:2;/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque combinaison mode/scenario', () => {
    ['aleatoire', 'fixe'].forEach(mode => {
        ['terme-arith', 'terme-geo', 'somme-arith', 'somme-geo', 'limite-geo'].forEach(scenario => {
            const q = genSuitesCore(1, baseParams({ mode, scenario }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML[${mode}/${scenario}]`);
            assertBalancedTags(q.inputXML, `inputXML[${mode}/${scenario}]`);
        });
    });
});
