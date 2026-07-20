// Tests unitaires du cœur pur de gen-math-trigonometrie.js (genTrigonometrieCore).
//
// Lancer :  npm test
//
// genTrigonometrieCore() ne lit jamais document : tout est passé en p (voir la
// fonction genTrigonometrie(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genTrigonometrieCore } = require(path.join('..', '..', 'js', 'gen-math-trigonometrie.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, mkFbGen, mkInput };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        scenario: 'valeur-exacte',
        mode: 'aleatoire',
        fbOk: '', fbWrong: '',
        custText: '<p>Calculez.</p>',
        fn: 'sin', angle: '%pi/6',
        expr: 'sin(x)^2 + cos(x)^2',
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

test("mode 'fixe' + scenario 'valeur-exacte' utilise fn(angle) littéral", () => {
    const q = genTrigonometrieCore(1, baseParams({ mode: 'fixe', scenario: 'valeur-exacte', fn: 'cos', angle: '%pi/3' }), DEPS);
    assert.match(q.vars, /q1_fname:"cos";/);
    assert.match(q.vars, /q1_angle:%pi\/3;/);
    assert.match(q.vars, /q1_ta:cos\(%pi\/3\);/);
});

test("mode 'fixe' + scenario identité utilise trigreduce(trigsimp(expr))", () => {
    const q = genTrigonometrieCore(1, baseParams({ mode: 'fixe', scenario: 'identite', expr: 'cos(2*x)' }), DEPS);
    assert.match(q.vars, /q1_expr:cos\(2\*x\);/);
    assert.match(q.vars, /q1_ta:trigreduce\(trigsimp\(q1_expr\)\);/);
});

test("mode 'aleatoire' + scenario 'valeur-exacte' tire un angle et une fonction au hasard", () => {
    const q = genTrigonometrieCore(1, baseParams({ mode: 'aleatoire', scenario: 'valeur-exacte' }), DEPS);
    assert.match(q.vars, /q1_r_angle:rand\(10\);/);
    assert.match(q.vars, /q1_r_func:rand\(3\);/);
});

test("mode 'aleatoire' + scenario identité génère une expression Simpson", () => {
    const q = genTrigonometrieCore(1, baseParams({ mode: 'aleatoire', scenario: 'identite' }), DEPS);
    assert.match(q.vars, /q1_r_tpl:rand\(4\);/);
    assert.match(q.vars, /q1_expr:if q1_r_tpl=0/);
});

test('un seul nœud PRT, feedback par défaut si fbOk/fbWrong vides', () => {
    const q = genTrigonometrieCore(1, baseParams({ fbOk: '', fbWrong: '' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.match(q.prt.nodes[0].truefeedback, /trig\.correct/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genTrigonometrieCore(1, baseParams({ fbOk: 'Bien joué', fbWrong: 'Réessayez' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bien joué');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Réessayez');
});

test('generalFeedback intègre fbGenExtra via mkFbGen', () => {
    const q = genTrigonometrieCore(1, baseParams({ fbGenExtra: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML) est bien formé pour chaque combinaison mode/scenario', () => {
    [['fixe', 'valeur-exacte'], ['fixe', 'identite'], ['aleatoire', 'valeur-exacte'], ['aleatoire', 'identite']].forEach(([mode, scenario]) => {
        const q = genTrigonometrieCore(1, baseParams({ mode, scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${mode}/${scenario}]`);
    });
});
