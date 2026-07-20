// Tests unitaires du cœur pur de gen-math-inequation.js (genInequationCore).
//
// Lancer :  npm test
//
// genInequationCore() ne lit jamais document : tout est passé en p (voir la
// fonction genInequation(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genInequationCore } = require(path.join('..', '..', 'js', 'gen-math-inequation.js'));
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
        scenario: 'lineaire',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '',
        fa: '2', fb: '-6', fc: '0',
        fop: '>',
        ftans: 'oo(3,inf)',
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

test("mode 'fixe' + scenario 'lineaire' utilise ftans littéral avec union protégé", () => {
    const q = genInequationCore(1, baseParams({ mode: 'fixe', scenario: 'lineaire', ftans: 'union(oo(1,2),oo(3,4))' }), DEPS);
    assert.match(q.vars, /q1_ta:%union\(oo\(1,2\),oo\(3,4\)\);/);
});

test("mode 'fixe' + scenario 'trinome' construit q1_poly = a*x^2+b*x+c", () => {
    const q = genInequationCore(1, baseParams({ mode: 'fixe', scenario: 'trinome', fa: '2', fb: '-3', fc: '1' }), DEPS);
    assert.match(q.vars, /q1_poly:q1_a\*x\^2\+q1_b\*x\+q1_c;/);
});

test("mode 'fixe' + scenario 'valeur-abs' construit |a x + b| op c", () => {
    const q = genInequationCore(1, baseParams({ mode: 'fixe', scenario: 'valeur-abs' }), DEPS);
    assert.match(q.qnote, /\|\{@q1_a@\}x\+\{@q1_b@\}\|\{@q1_op@\}\{@q1_c@\}/);
});

test("mode 'aleatoire' + scenario 'lineaire' construit le tirage aléatoire et la formule de solution", () => {
    const q = genInequationCore(1, baseParams({ mode: 'aleatoire', scenario: 'lineaire' }), DEPS);
    assert.match(q.vars, /q1_a_pool:\[2,-2,3,-3,4,-4\];/);
    assert.match(q.vars, /q1_sol:-q1_b\/q1_a;/);
});

test("mode 'aleatoire' + scenario 'trinome' construit x1/x2 et le polynome factorisé", () => {
    const q = genInequationCore(1, baseParams({ mode: 'aleatoire', scenario: 'trinome' }), DEPS);
    assert.match(q.vars, /q1_x1:rand\(\[-5,-4,-3,-2,-1\]\);/);
    assert.match(q.vars, /q1_x2:rand\(\[1,2,3,4,5\]\);/);
});

test("mode 'aleatoire' + scenario 'valeur-abs' construit s1/s2 et sl/su", () => {
    const q = genInequationCore(1, baseParams({ mode: 'aleatoire', scenario: 'valeur-abs' }), DEPS);
    assert.match(q.vars, /q1_sl:min\(q1_s1,q1_s2\);q1_su:max\(q1_s1,q1_s2\);/);
});

test('un seul nœud PRT AlgEquiv comparant _ic_X à q_X_ta', () => {
    const q = genInequationCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, '_ic1');
    assert.equal(q.prt.nodes[0].tans, 'q1_ta');
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genInequationCore(1, baseParams({ fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genInequationCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('feedbackvariables contient le parseur d\'intervalle _ic_X', () => {
    const q = genInequationCore(1, baseParams(), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /_ic1:block\(/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque combinaison mode/scenario', () => {
    ['aleatoire', 'fixe'].forEach(mode => {
        ['lineaire', 'trinome', 'valeur-abs'].forEach(scenario => {
            const q = genInequationCore(1, baseParams({ mode, scenario }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML[${mode}/${scenario}]`);
            assertBalancedTags(q.inputXML, `inputXML[${mode}/${scenario}]`);
        });
    });
});
