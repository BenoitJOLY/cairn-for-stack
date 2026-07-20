// Tests unitaires du cœur pur de gen-math-limites.js (genLimitesCore).
//
// Lancer :  npm test
//
// genLimitesCore() ne lit jamais document : tout est passé en p (voir la
// fonction genLimites(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genLimitesCore } = require(path.join('..', '..', 'js', 'gen-math-limites.js'));
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
        scenario: 'plus-inf',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '',
        expr: 'x', tans: '0', point: '1',
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

test("mode 'fixe' utilise la tans littérale", () => {
    const q = genLimitesCore(1, baseParams({ mode: 'fixe', tans: '3' }), DEPS);
    assert.match(q.vars, /q1_ta:3;/);
    assert.equal(q.qnote, 'lim=3');
});

test("scenario 'plus-inf' génère les listes de cas aléatoires", () => {
    const q = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario: 'plus-inf' }), DEPS);
    assert.match(q.vars, /q1_r_type:rand\(4\);/);
    assert.match(q.vars, /q1_lim_cases:/);
});

test("scenario 'moins-inf' utilise des valeurs -inf", () => {
    const q = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario: 'moins-inf' }), DEPS);
    assert.match(q.vars, /q1_lim_cases:\[\[0,0,0\],\[1,2\/3,1\/2\],\[-inf,-inf,2\],\[1,3,1\/2\]\];/);
});

test("scenario 'point-fini' construit num/den/ta autour d'un point aléatoire", () => {
    const q = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario: 'point-fini' }), DEPS);
    assert.match(q.vars, /q1_a:q1_as\[q1_r_a\+1\];/);
    assert.match(q.vars, /q1_ta:ev\(q1_Q,x=q1_a\);/);
});

test("scenario 'droite-racine' donne ta=inf, 'gauche-racine' donne ta=-inf", () => {
    const qd = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario: 'droite-racine' }), DEPS);
    assert.match(qd.vars, /q1_ta:inf;/);
    const qg = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario: 'gauche-racine' }), DEPS);
    assert.match(qg.vars, /q1_ta:-inf;/);
});

test('un seul nœud PRT, feedback par défaut si fbOk/fbWrong vides', () => {
    const q = genLimitesCore(1, baseParams({ fbOk: '', fbWrong: '' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.match(q.prt.nodes[0].truefeedback, /trig\.correct/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genLimitesCore(1, baseParams({ fbOk: 'Bien joué', fbWrong: 'Réessayez' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bien joué');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Réessayez');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genLimitesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque scenario', () => {
    ['plus-inf', 'moins-inf', 'point-fini', 'droite-racine', 'gauche-racine'].forEach(scenario => {
        const q = genLimitesCore(1, baseParams({ mode: 'aleatoire', scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}]`);
        assertBalancedTags(q.inputXML, `inputXML[${scenario}]`);
    });
    const qf = genLimitesCore(1, baseParams({ mode: 'fixe' }), DEPS);
    assertBalancedTags(qf.prtXML, 'prtXML[fixe]');
    assertBalancedTags(qf.inputXML, 'inputXML[fixe]');
});
