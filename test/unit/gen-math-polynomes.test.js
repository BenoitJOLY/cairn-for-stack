// Tests unitaires du cœur pur de gen-math-polynomes.js (genPolynomesCore).
//
// Lancer :  npm test
//
// genPolynomesCore() ne lit jamais document : tout est passé en p (voir la
// fonction genPolynomes(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genPolynomesCore } = require(path.join('..', '..', 'js', 'gen-math-polynomes.js'));
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
        scenario: 'discriminant',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '',
        fa: '1', fb: '-5', fc: '6',
        dMin: 1, dMax: 50,
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

test("mode 'fixe' utilise a/b/c littéraux dans q1_poly", () => {
    const q = genPolynomesCore(1, baseParams({ mode: 'fixe', fa: '2', fb: '-3', fc: '1' }), DEPS);
    assert.match(q.vars, /q1_a:2;q1_b:-3;q1_c:1;/);
});

test("mode 'aleatoire' tire a/b/c avec rejet hors bornes de delta", () => {
    const q = genPolynomesCore(1, baseParams({ mode: 'aleatoire', dMin: 5, dMax: 20 }), DEPS);
    assert.match(q.vars, /q1_dmin:5;q1_dmax:20;/);
    assert.match(q.vars, /while \(q1_delta<q1_dmin or q1_delta>q1_dmax\) and q1_tries<300 do/);
});

test("scenario 'discriminant' produit 3 nœuds PRT de diagnostic", () => {
    const q = genPolynomesCore(1, baseParams({ scenario: 'discriminant' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.vars, /q1_ta:q1_delta;/);
});

test("scenario 'racines' produit 2 inputs (x1, x2) et 4 nœuds chaînés", () => {
    const q = genPolynomesCore(1, baseParams({ scenario: 'racines' }), DEPS);
    assert.equal(q.prt.nodes.length, 4);
    assert.equal((q.inputXML.match(/<input>/g) || []).length, 2);
    assert.match(q.vars, /q1_ta1:q1_r1;q1_ta2:q1_r2;/);
});

test("scenario 'racine1' cible q1_r1, scenario 'racine2' cible q1_r2", () => {
    const q1 = genPolynomesCore(1, baseParams({ scenario: 'racine1' }), DEPS);
    assert.match(q1.vars, /q1_ta:q1_r1;/);
    const q2 = genPolynomesCore(1, baseParams({ scenario: 'racine2' }), DEPS);
    assert.match(q2.vars, /q1_ta:q1_r2;/);
});

test("scenario 'somme-racines' calcule -b/a, 'produit-racines' calcule c/a", () => {
    const qs = genPolynomesCore(1, baseParams({ scenario: 'somme-racines' }), DEPS);
    assert.match(qs.vars, /q1_ta:-q1_b\/q1_a;/);
    const qp = genPolynomesCore(1, baseParams({ scenario: 'produit-racines' }), DEPS);
    assert.match(qp.vars, /q1_ta:q1_c\/q1_a;/);
});

test("scenario 'nb-racines' en mode fixe utilise le signe de delta, en mode aléatoire tire un polynôme prédéfini", () => {
    const qFixe = genPolynomesCore(1, baseParams({ scenario: 'nb-racines', mode: 'fixe' }), DEPS);
    assert.match(qFixe.vars, /q1_ta:if q1_delta>0 then 2 elseif q1_delta=0 then 1 else 0;/);
    const qAlea = genPolynomesCore(1, baseParams({ scenario: 'nb-racines', mode: 'aleatoire' }), DEPS);
    assert.match(qAlea.vars, /q1_r_type:rand\(3\);/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback du nœud 0 uniquement', () => {
    const q = genPolynomesCore(1, baseParams({ scenario: 'discriminant', fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
    assert.notEqual(q.prt.nodes[1].truefeedback, 'Bravo');
});

test('diagNodes expose les nœuds de diagnostic (hors nœud 0)', () => {
    const q = genPolynomesCore(1, baseParams({ scenario: 'discriminant' }), DEPS);
    assert.equal(q.diagNodes.length, 2);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genPolynomesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque combinaison mode/scenario', () => {
    ['aleatoire', 'fixe'].forEach(mode => {
        ['discriminant', 'racines', 'racine1', 'racine2', 'somme-racines', 'produit-racines', 'nb-racines'].forEach(scenario => {
            const q = genPolynomesCore(1, baseParams({ mode, scenario }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML[${mode}/${scenario}]`);
            assertBalancedTags(q.inputXML, `inputXML[${mode}/${scenario}]`);
        });
    });
});
