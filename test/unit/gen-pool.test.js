// Tests unitaires du cœur pur de gen-pool.js (genPoolCore).
//
// Lancer :  npm test
//
// genPoolCore() ne lit jamais document : les propositions (lues dans le DOM
// depuis #<vcid>/#<fcid> .prop-row) sont passées en p.propsVrais/propsFaux.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genPoolCore } = require(path.join('..', '..', 'js', 'gen-pool.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;
const rawEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DEPS = { I18N: I18N_STUB, buildPrtXml, wrapFb, rawEsc };

function baseParams(overrides) {
    return Object.assign({
        type: 'radio',
        label: 'Choix multiple',
        text: '<p>Choisissez la bonne réponse.</p>',
        Xe: 3,
        bareme: 1,
        poolFbGen: '',
        poolShowFb: true,
        propsVrais: [{ text: 'Bonne réponse', fb: 'Explication vraie' }],
        propsFaux: [{ text: 'Faux 1', fb: 'Explication faux 1' }, { text: 'Faux 2', fb: 'Explication faux 2' }]
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

test('ta_X_all contient les propositions vraies puis fausses, numérotées et échappées', () => {
    const q = genPoolCore(1, baseParams(), DEPS);
    assert.match(q.vars, /ta1_all:\[\[1,true,"Bonne réponse"\],\[2,false,"Faux 1"\],\[3,false,"Faux 2"\]\]/);
});

test("type 'radio' vs 'dropdown' pilote le type d'input", () => {
    const radio = genPoolCore(1, baseParams({ type: 'radio' }), DEPS);
    assert.match(radio.inputXML, /<type>radio<\/type>/);
    const dropdown = genPoolCore(1, baseParams({ type: 'dropdown' }), DEPS);
    assert.match(dropdown.inputXML, /<type>dropdown<\/type>/);
});

test('un seul nœud PRT, answertest AlgEquiv sur vid_X', () => {
    const q = genPoolCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].answertest, 'AlgEquiv');
    assert.equal(q.prt.nodes[0].tans, 'vid1');
});

test('generalFeedback masque le détail fb_vrai si poolShowFb=false', () => {
    const withFb = genPoolCore(1, baseParams({ poolShowFb: true }), DEPS);
    assert.match(withFb.generalFeedback, /fb_vrai1/);
    const withoutFb = genPoolCore(1, baseParams({ poolShowFb: false }), DEPS);
    assert.doesNotMatch(withoutFb.generalFeedback, /fb_vrai1/);
});

test('generalFeedback intègre poolFbGen', () => {
    const q = genPoolCore(1, baseParams({ poolFbGen: 'Remarque générale' }), DEPS);
    assert.match(q.generalFeedback, /Remarque générale/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genPoolCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
