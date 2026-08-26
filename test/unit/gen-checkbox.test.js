// Tests unitaires du cœur pur de gen-checkbox.js (genCheckboxCore).
//
// Lancer :  npm test
//
// genCheckboxCore() ne lit jamais document : les lignes de propositions (cochées
// dans le DOM par #cb-props .prop-row) sont passées en paramètre p.props.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCheckboxCore } = require(path.join('..', '..', 'js', 'gen-checkbox.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const escapeMaximaString = (s) => String(s).replace(/"/g, '\\"');

const DEPS = { I18N: I18N_STUB, buildPrtXml, escapeMaximaString };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Cochez les affirmations vraies.</p>',
        Xe: '3', mXb: 'fixe', Xb: '2',
        props: [
            { bool: 'true', text: 'Proposition A (vraie)', fb: 'Justification A', fb2: 'Rappel A' },
            { bool: 'false', text: 'Proposition B (fausse)', fb: 'Justification B', fb2: '' },
            { bool: 'true', text: 'Proposition C (vraie)', fb: 'Justification C', fb2: 'Rappel C' }
        ],
        showOubli: false,
        cbFbGen: '',
        cbFbGenShowFb: false
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

test('les 3 propositions produisent 3 entrées dans ta_all avec le bon id/booléen', () => {
    const q = genCheckboxCore(1, baseParams(), DEPS);
    assert.match(q.vars, /ta1_all:\[\["1",true,"Proposition A \(vraie\)"\],\["2",false,"Proposition B \(fausse\)"\],\["3",true,"Proposition C \(vraie\)"\]\]/);
});

test('le PRT a 2 nœuds (tout correct -> node 0, sinon repli -> node 1)', () => {
    const q = genCheckboxCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].falsenextnode, '1');
    assert.equal(q.prt.nodes[1].falsenextnode, '-1');
});

test('showOubli=true ajoute la variable fb_oubli et le bloc de feedback des oublis', () => {
    const q = genCheckboxCore(1, baseParams({ showOubli: true }), DEPS);
    assert.match(q.vars, /fb_oubli1:/);
    assert.match(q.prt.nodes[1].truefeedback, /manques1/);
});

test('showOubli=false ne génère pas de variable fb_oubli', () => {
    const q = genCheckboxCore(1, baseParams({ showOubli: false }), DEPS);
    assert.ok(!q.vars.includes('fb_oubli1:'));
});

test('les guillemets dans les textes de proposition sont échappés (escapeMaximaString)', () => {
    const q = genCheckboxCore(1, baseParams({
        props: [{ bool: 'true', text: 'Il dit "vrai"', fb: '', fb2: '' }]
    }), DEPS);
    assert.match(q.vars, /Il dit \\"vrai\\"/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genCheckboxCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});

test('mode "fixe" : nbV est figé à Xb (borné), aucun rand() dans les vars', () => {
    const q = genCheckboxCore(1, baseParams({ mXb: 'fixe', Xb: '2' }), DEPS);
    assert.match(q.vars, /nbV1:max\(1,min\(2,min\(length\(listV1\),3-1\)\)\);/);
    assert.ok(!/\brand\(/.test(q.vars), 'le mode fixe ne doit plus contenir rand()');
});

test('mode "alea" : nbV reste tiré au sort avec rand()', () => {
    const q = genCheckboxCore(1, baseParams({ mXb: 'alea', Xb: '2' }), DEPS);
    assert.match(q.vars, /nbV1:rand\(min\(length\(listV1\), 3-1\)\) \+ 1;/);
    assert.match(q.vars, /\brand\(/);
});

test('les modes "fixe" et "alea" produisent des vars différentes (Xb pris en compte)', () => {
    const qFixe = genCheckboxCore(1, baseParams({ mXb: 'fixe', Xb: '2' }), DEPS);
    const qAlea = genCheckboxCore(1, baseParams({ mXb: 'alea', Xb: '2' }), DEPS);
    assert.notEqual(qFixe.vars, qAlea.vars);
});
