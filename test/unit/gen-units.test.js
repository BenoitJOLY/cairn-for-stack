// Tests unitaires du cœur pur de gen-units.js (genUnitsCore).
//
// Lancer :  npm test
//
// genUnitsCore() ne lit jamais document : val/unit/aide/useKbd sont passés en p.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genUnitsCore } = require(path.join('..', '..', 'js', 'gen-units.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const buildKbdStackHTML = (X) => `<!--KBD-STUB-${X}-->`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen: mkFbGen, buildKbdStackHTML };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Convertissez.</p>',
        val: '9.81', unit: 'm/s^2',
        fbGen: '',
        aide: '',
        useKbd: false
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

test('ta_X combine val et unit dans les variables Maxima', () => {
    const q = genUnitsCore(1, baseParams(), DEPS);
    assert.match(q.vars, /ta1:9\.81\*m\/s\^2;/);
});

test('sans clavier : input visible en ligne, avec clavier : bloc iframe injecté', () => {
    const sansKbd = genUnitsCore(1, baseParams({ useKbd: false }), DEPS);
    assert.match(sansKbd.textFrag, /\[\[input:ans1\]\] \[\[validation:ans1\]\]/);
    assert.equal(sansKbd.kbdRaw, null);

    const avecKbd = genUnitsCore(1, baseParams({ useKbd: true }), DEPS);
    assert.match(avecKbd.textFrag, /<!--HS-KBD:1-->/);
    assert.equal(avecKbd.kbdRaw, '<!--KBD-STUB-1-->');
});

test('2 nœuds PRT chaînés : UnitsAbsolute (unité) -> UnitsRelative (valeur)', () => {
    const q = genUnitsCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].answertest, 'UnitsAbsolute');
    assert.equal(q.prt.nodes[0].truenextnode, '1');
    assert.equal(q.prt.nodes[1].answertest, 'UnitsRelative');
});

test('generalFeedback intègre fbGen via mkFbGen', () => {
    const q = genUnitsCore(1, baseParams({ fbGen: 'Note supplémentaire' }), DEPS);
    assert.match(q.generalFeedback, /Note supplémentaire/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genUnitsCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
