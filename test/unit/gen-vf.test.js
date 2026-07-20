// Tests unitaires du cœur pur de gen-vf.js (genVFCore).
//
// Lancer :  npm test
//
// genVFCore() ne lit jamais document : les lignes de propositions (cochées dans
// le DOM par #vf-props .vf-row) sont passées en paramètre p.props.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genVFCore } = require(path.join('..', '..', 'js', 'gen-vf.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const rawEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DEPS = { I18N: I18N_STUB, buildPrtXml, rawEsc };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Vrai ou faux ?</p>',
        fbGen: '',
        Xe: 2, modeXb: 'fixe', Xb: 2,
        props: [
            { isV: true, text: 'La Terre tourne autour du Soleil', fbIfVrai: 'Correct', fbIfFaux: 'Non, c\'est vrai' },
            { isV: false, text: 'Le Soleil tourne autour de la Terre', fbIfVrai: 'Non, c\'est faux', fbIfFaux: 'Correct' }
        ]
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

test('génère un ta_vf_all avec le bon booléen par proposition', () => {
    const q = genVFCore(1, baseParams(), DEPS);
    assert.match(q.vars, /ta_vf1_all:\[\["La Terre tourne autour du Soleil",true,"Correct","Non, c'est vrai"\],\["Le Soleil tourne autour de la Terre",false,"Non, c'est faux","Correct"\]\]/);
});

test('une proposition sans texte utilise le fallback traduit', () => {
    const q = genVFCore(1, baseParams({ props: [{ isV: true, text: '', fbIfVrai: '', fbIfFaux: '' }], Xe: 1 }), DEPS);
    assert.match(q.vars, /tpl\.vf_prop_fallback:\{&quot;n&quot;:1\}/);
});

test('génère un input radio par slot (Xe inputs)', () => {
    const q = genVFCore(1, baseParams({ Xe: 3 }), DEPS);
    const matches = q.inputXML.match(/<input>/g) || [];
    assert.equal(matches.length, 3);
    assert.match(q.inputXML, /<name>ans1p01<\/name>/);
    assert.match(q.inputXML, /<name>ans1p03<\/name>/);
});

test("mode 'alea' utilise rand(...) dans nbV, mode 'fixe' utilise Xb littéral", () => {
    const alea = genVFCore(1, baseParams({ modeXb: 'alea', Xe: 5 }), DEPS);
    assert.match(alea.vars, /nbV_vf1:rand\(min\(length\(listV_vf1\),5-1\)\)\+1;/);
    const fixe = genVFCore(1, baseParams({ modeXb: 'fixe', Xb: 2 }), DEPS);
    assert.match(fixe.vars, /nbV_vf1:2;/);
});

test('un seul nœud PRT (pas de chaînage) avec truescoremode=falsescoremode="="', () => {
    const q = genVFCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].truenextnode, '-1');
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genVFCore(1, baseParams({ Xe: 4 }), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
