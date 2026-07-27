// Tests unitaires du cœur pur de gen-ord.js (genOrdCore).
//
// Lancer :  npm test
//
// genOrdCore() ne lit jamais document : les textes des étapes (lus dans le DOM
// depuis #ord-items .ord-row) sont passés en paramètre p.itemTexts.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genOrdCore } = require(path.join('..', '..', 'js', 'gen-ord.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const rawEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen: mkFbGen, rawEsc, wrapFb, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Ordonnez les étapes suivantes.</p>',
        isClone: false,
        fbGenExtra: '',
        itemTexts: ['Étape 1', 'Étape 2', 'Étape 3']
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

test('génère une clé i1..iN et le texte échappé pour chaque étape', () => {
    const q = genOrdCore(1, baseParams(), DEPS);
    assert.match(q.vars, /ord_steps_1: \[\["i1","Étape 1"\],\["i2","Étape 2"\],\["i3","Étape 3"\]\]/);
});

test('une étape sans texte utilise le fallback traduit', () => {
    const q = genOrdCore(1, baseParams({ itemTexts: ['', 'Étape 2'] }), DEPS);
    assert.match(q.vars, /ord\.item_fallback:\{&quot;n&quot;:1\}/);
});

test('clone="true" est ajouté au bloc [[parsons]] quand isClone est vrai', () => {
    const withClone = genOrdCore(1, baseParams({ isClone: true }), DEPS);
    assert.match(withClone.textFrag, /\[\[parsons input="ans1" clone="true"\]\]/);
    const withoutClone = genOrdCore(1, baseParams({ isClone: false }), DEPS);
    assert.match(withoutClone.textFrag, /\[\[parsons input="ans1"\]\]/);
});

test('un seul nœud PRT, tans="true" sur ord_check', () => {
    const q = genOrdCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'ord_check_1');
    assert.equal(q.prt.nodes[0].tans, 'true');
});

test('generalFeedback intègre fbGenExtra via mkFbGen', () => {
    const q = genOrdCore(1, baseParams({ fbGenExtra: 'Info complémentaire' }), DEPS);
    assert.match(q.generalFeedback, /Info complémentaire/);
});

test('generalFeedback est encadré (applyFbBox "general") quand il y a du contenu', () => {
    const q = genOrdCore(1, baseParams({ fbGenExtra: 'Info complémentaire' }), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genOrdCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
