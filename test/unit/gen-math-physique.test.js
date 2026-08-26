// Tests unitaires du cœur pur de gen-math-physique.js (genPhysiqueCore).
//
// Lancer :  npm test
//
// genPhysiqueCore() ne lit jamais document : tout est passé en p (voir la
// fonction genPhysique(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genPhysiqueCore } = require(path.join('..', '..', 'js', 'gen-math-physique.js'));
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
        scenario: 'mrua-vitesse',
        v0: 0, a: 9.81, t: 3, m: 2, d: 5,
        bareme: 1,
        custText: '',
        fbOk: '', fbWrong: '', fbGen: ''
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

test('mrua-vitesse : v = v0 + a*t', () => {
    const q = genPhysiqueCore(1, baseParams({ scenario: 'mrua-vitesse', v0: 0, a: 9.81, t: 3 }), DEPS);
    assert.match(q.vars, /q1_v0:0;q1_a:9\.81;q1_t:3;/);
    assert.match(q.vars, /q1_ta:q1_v0\+q1_a\*q1_t;/);
    assert.equal(q.inputXML.includes('<tans>q1_ta</tans>'), true);
    assertBalancedTags(q.prtXML, 'mrua-vitesse');
});

test('mrua-position : x = v0*t + a*t^2/2', () => {
    const q = genPhysiqueCore(2, baseParams({ scenario: 'mrua-position', v0: 5, a: 2, t: 4 }), DEPS);
    assert.match(q.vars, /q2_ta:q2_v0\*q2_t\+q2_a\*q2_t\^2\/2;/);
});

test('chute-h : h = g*t^2/2 avec g=9.81 fixe', () => {
    const q = genPhysiqueCore(3, baseParams({ scenario: 'chute-h', t: 2 }), DEPS);
    assert.match(q.vars, /q3_g:9\.81;q3_t:2;/);
    assert.match(q.vars, /q3_ta:q3_g\*q3_t\^2\/2;/);
});

test('chute-t : t = sqrt(2h/g), d réutilisé comme hauteur', () => {
    const q = genPhysiqueCore(4, baseParams({ scenario: 'chute-t', d: 20 }), DEPS);
    assert.match(q.vars, /q4_h:20;/);
    assert.match(q.vars, /q4_ta:sqrt\(2\*q4_h\/q4_g\);/);
});

test('ec : Ec = m*v^2/2, d réutilisé comme vitesse', () => {
    const q = genPhysiqueCore(5, baseParams({ scenario: 'ec', m: 3, d: 10 }), DEPS);
    assert.match(q.vars, /q5_m:3;q5_v:10;/);
    assert.match(q.vars, /q5_ta:q5_m\*q5_v\^2\/2;/);
});

test('ep : Ep = m*g*h', () => {
    const q = genPhysiqueCore(6, baseParams({ scenario: 'ep', m: 2, d: 5 }), DEPS);
    assert.match(q.vars, /q6_ta:q6_m\*q6_g\*q6_h;/);
});

test('em-conserv : v = sqrt(2*g*h)', () => {
    const q = genPhysiqueCore(7, baseParams({ scenario: 'em-conserv', d: 10 }), DEPS);
    assert.match(q.vars, /q7_ta:sqrt\(2\*q7_g\*q7_h\);/);
});

test('newton-f : F = m*a', () => {
    const q = genPhysiqueCore(8, baseParams({ scenario: 'newton-f', m: 5, a: 3 }), DEPS);
    assert.match(q.vars, /q8_ta:q8_m\*q8_a;/);
});

test('PRT : nœud unique NumAbsolute, tolérance 0.05, sans/tans corrects', () => {
    const q = genPhysiqueCore(9, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    const n = q.prt.nodes[0];
    assert.equal(n.answertest, 'NumAbsolute');
    assert.equal(n.testoptions, '0.05');
    assert.equal(n.sans, 'ans_phy9');
    assert.equal(n.tans, 'q9_ta');
    assert.equal(n.truescore, '1');
    assert.equal(n.falsescore, '0');
});

test('fbOk/fbWrong personnalisés remplacent les messages génériques', () => {
    const q = genPhysiqueCore(10, baseParams({ fbOk: 'Bravo custom', fbWrong: 'Raté custom' }), DEPS);
    assert.match(q.prtXML, /Bravo custom/);
    assert.match(q.prtXML, /Raté custom/);
});

test("sans override, le feedback générique n'est pas doublé (pas d'icône pré-cuite)", () => {
    const q = genPhysiqueCore(11, baseParams(), DEPS);
    const n = q.prt.nodes[0];
    // canonicalNodes (édition) reste sans encadré/icône : applyFbBox_D ne l'ajoute
    // que dans xmlNodes au moment de l'export — voir js/fb-box.js.
    assert.equal(/✅|❌/.test(n.truefeedback), false);
    assert.equal(/✅|❌/.test(n.falsefeedback), false);
});

test('generalFeedback inclut le feedback additionnel (fbGen)', () => {
    const q = genPhysiqueCore(12, baseParams({ fbGen: 'Remarque additionnelle' }), DEPS);
    assert.match(q.generalFeedback, /Remarque additionnelle/);
});

test('qnote référence bien la variable Maxima du scénario', () => {
    const q = genPhysiqueCore(13, baseParams({ scenario: 'newton-f' }), DEPS);
    assert.equal(q.qnote, 'Q13 physique (newton-f) = {@q13_ta@}');
});
