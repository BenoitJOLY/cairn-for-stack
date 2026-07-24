// Tests unitaires du cœur pur de gen-composition.js (genCompositionCore).
//
// Lancer :  npm test
//
// genCompositionCore() ne lit jamais document : tout est passé en p (voir
// genComposition(X), seul point de contact avec le DOM). buildCompositionJSX()
// est pur (pas de DOM, seulement I18N.t) mais génère un très gros template —
// il est injecté comme un tout via deps.buildCompositionJSX plutôt que d'être
// réécrit en interne avec I18N_D.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCompositionCore } = require(path.join('..', '..', 'js', 'gen-composition.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const buildCompositionJSX = (height, X) => `/* jsx stub height=${height} X=${X} */`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, buildCompositionJSX };

function baseParams(overrides) {
    return Object.assign({
        bareme: 4, text: '<p>Rédigez.</p>', height: '600px', msg: 'Votre réponse sera lue.',
        fbGenRaw: ''
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

test('genCompositionCore : textFrag contient le marqueur JSX et l\'input notes', () => {
    const q = genCompositionCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /<!--HS-KBD:1-->/);
    assert.match(q.textFrag, /\[\[input:ans1_html\]\]/);
    assert.match(q.textFrag, /<p>Rédigez\.<\/p>/);
});

test('genCompositionCore : msg vide ne produit pas d\'encart message enseignant', () => {
    const q = genCompositionCore(1, baseParams({ msg: '' }), DEPS);
    assert.doesNotMatch(q.textFrag, /border-left:4px solid #f59e0b/);
});

test('genCompositionCore : msg présent produit un bandeau avec le texte du message', () => {
    const q = genCompositionCore(1, baseParams({ msg: 'Attention !' }), DEPS);
    assert.match(q.textFrag, /Attention !/);
});

test('genCompositionCore : kbdRaw provient de buildCompositionJSX injecté (height, X)', () => {
    const q = genCompositionCore(2, baseParams({ height: '800px' }), DEPS);
    assert.equal(q.kbdRaw, '/* jsx stub height=800px X=2 */');
});

test('genCompositionCore : inputXML déclare un input type notes manualgraded:true', () => {
    const q = genCompositionCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<type>notes<\/type>/);
    assert.match(q.inputXML, /<options>manualgraded:true<\/options>/);
    assert.match(q.inputXML, /<name>ans1_html<\/name>/);
});

test('genCompositionCore : un seul nœud PRT inerte (toujours vrai)', () => {
    const q = genCompositionCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].tans, '1');
    assert.equal(q.prt.nodes[0].truescore, '1');
});

test('genCompositionCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genCompositionCore(1, baseParams({ fbGenRaw: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genCompositionCore : previewFrag affiche le barème et le texte', () => {
    const q = genCompositionCore(1, baseParams({ bareme: 7 }), DEPS);
    assert.match(q.previewFrag, /\/ 7 pt/);
    assert.match(q.previewFrag, /<p>Rédigez\.<\/p>/);
});

test('genCompositionCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genCompositionCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
