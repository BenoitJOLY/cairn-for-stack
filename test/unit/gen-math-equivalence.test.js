// Tests unitaires du cœur pur de gen-math-equivalence.js (genEquivalenceCore).
//
// Lancer :  npm test
//
// genEquivalenceCore() ne lit jamais document : tout est passé en p (voir la
// fonction genEquivalence(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genEquivalenceCore } = require(path.join('..', '..', 'js', 'gen-math-equivalence.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const DEPS = { buildPrtXml, _mkFbGen: mkFbGen };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        scenario: 'developpement',
        custText: '<p>Développez.</p>',
        formule: '(x+1)^2',
        variable: 'x',
        variables: 'x,y',
        resultatOverride: '',
        etapeChecked: false,
        etapeVal: '',
        fbOk: '', fbWrong: '',
        fbGenExtra: ''
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

test('scénario développement calcule q_resultat via expand()', () => {
    const q = genEquivalenceCore(1, baseParams({ scenario: 'developpement' }), DEPS);
    assert.match(q.vars, /q1_resultat:expand\(q1_formule\);/);
});

test('scénario factorisation calcule q_resultat via factor()', () => {
    const q = genEquivalenceCore(1, baseParams({ scenario: 'factorisation' }), DEPS);
    assert.match(q.vars, /q1_resultat:factor\(q1_formule\);/);
});

test('scénario équation utilise solve() avec la bonne variable', () => {
    const q = genEquivalenceCore(1, baseParams({ scenario: 'equation', variable: 'y' }), DEPS);
    assert.match(q.vars, /q1_var:y;/);
    assert.match(q.vars, /q1_sol:solve\(q1_formule, q1_var\);/);
});

test('scénario système utilise linsolve() avec la liste de variables', () => {
    const q = genEquivalenceCore(1, baseParams({ scenario: 'systeme', variables: 'x,y,z' }), DEPS);
    assert.match(q.vars, /q1_vars:\[x,y,z\];/);
    assert.match(q.vars, /q1_sol:linsolve\(q1_formule, q1_vars\);/);
});

test('resultatOverride écrase le résultat calculé', () => {
    const q = genEquivalenceCore(1, baseParams({ scenario: 'developpement', resultatOverride: 'x^2+2*x+1' }), DEPS);
    assert.match(q.vars, /q1_resultat:x\^2\+2\*x\+1;\n/);
});

test('sans étape imposée : PRT à 2 nœuds (départ+chaîne -> résultat final)', () => {
    const q = genEquivalenceCore(1, baseParams({ etapeChecked: false }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].answertest, 'EquivFirst');
    assert.equal(q.prt.nodes[1].answertest, 'EqualComAss');
});

test('avec étape imposée : PRT à 3 nœuds (départ -> étape -> résultat final)', () => {
    const q = genEquivalenceCore(1, baseParams({ etapeChecked: true, etapeVal: '(x+1)*(x+1)' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.prt.nodes[1].sans, /stack_equiv_find_step/);
    assert.equal(q.diagNodes.length, 1);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque scénario', () => {
    ['developpement', 'factorisation', 'equation', 'systeme'].forEach(scenario => {
        const q = genEquivalenceCore(1, baseParams({ scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}]`);
        assertBalancedTags(q.inputXML, `inputXML[${scenario}]`);
    });
});

test('generalFeedback intègre fbGenExtra via mkFbGen', () => {
    const q = genEquivalenceCore(1, baseParams({ fbGenExtra: 'Remarque additionnelle' }), DEPS);
    assert.match(q.generalFeedback, /Remarque additionnelle/);
});
