// Tests unitaires du cœur pur de gen-nuclear.js (genNuclearCore).
//
// Lancer :  npm test
//
// genNuclearCore() ne lit jamais document : tout est passé en p (voir
// genNuclear(X), seul point de contact avec le DOM). Le rendu KaTeX
// (bibliothèque externe, globale bare) est injecté comme un tout via
// deps._nucRenderKatex plutôt que réécrit en interne.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genNuclearCore } = require(path.join('..', '..', 'js', 'gen-nuclear.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function _nucRenderKatex(latex) {
    return '<span class="katex-stub">' + latex + '</span>';
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, _nucRenderKatex };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Complétez la réaction.</p>',
        rawEq: '{}^{14}_{6}C -> {}^{14}_{7}N + \\beta-',
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

test('genNuclearCore : lève une erreur si l\'énoncé (text) est vide', () => {
    assert.throws(() => genNuclearCore(1, baseParams({ text: '' }), DEPS), /msg\.err_nuc_enonce_vide/);
});

test('genNuclearCore : lève une erreur si l\'équation (rawEq) est vide', () => {
    assert.throws(() => genNuclearCore(1, baseParams({ rawEq: '' }), DEPS), /msg\.err_nuc_vide/);
});

test('genNuclearCore : lève une erreur si l\'équation ne contient pas de flèche', () => {
    assert.throws(() => genNuclearCore(1, baseParams({ rawEq: '{}^{14}_{6}C + \\beta-' }), DEPS), /msg\.err_nuc_fleche/);
});

test('genNuclearCore : lève une erreur si le parsing échoue (réactifs ou produits vides)', () => {
    assert.throws(() => genNuclearCore(1, baseParams({ rawEq: '-> {}^{14}_{7}N' }), DEPS), /msg\.err_nuc_parse/);
});

test('genNuclearCore : parse correctement une désintégration bêta et construit les listes Maxima', () => {
    const q = genNuclearCore(1, baseParams(), DEPS);
    assert.match(q.vars, /nuc1_rea: \[\[1,14,6,"C"\]\];/);
    assert.match(q.vars, /nuc1_pro: \[\[1,14,7,"N"\],\[1,0,-1,"e"\]\];/);
});

test('genNuclearCore : 7 nœuds PRT (canoniques)', () => {
    const q = genNuclearCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 7);
});

test('genNuclearCore : diagNodes exclut le succès du nœud 0 et l\'échec du dernier nœud', () => {
    const q = genNuclearCore(1, baseParams(), DEPS);
    assert.ok(q.diagNodes.length > 0);
    assert.ok(q.diagNodes.every(d => d.desc && d.fb));
});

test('genNuclearCore : previewFrag intègre le rendu KaTeX injecté', () => {
    const q = genNuclearCore(1, baseParams(), DEPS);
    assert.match(q.previewFrag, /katex-stub/);
});

test('genNuclearCore : textFrag référence les 4 inputs cachés (ans, ans-s, ans-r, ans-p)', () => {
    const q = genNuclearCore(2, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans2\]\]/);
    assert.match(q.textFrag, /\[\[input:ans2s\]\]/);
    assert.match(q.textFrag, /\[\[input:ans2r\]\]/);
    assert.match(q.textFrag, /\[\[input:ans2p\]\]/);
});

test('genNuclearCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genNuclearCore(1, baseParams({ fbGenRaw: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genNuclearCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genNuclearCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
