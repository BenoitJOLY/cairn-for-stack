// Tests unitaires du cœur pur de gen-numerical.js (genNumericalCore).
//
// Lancer :  npm test
//
// genNumericalCore() ne lit jamais document : val/tolType/aide/useKbd sont
// passés en p (val est déjà passé par sanitizeMaxima dans le wrapper).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genNumericalCore } = require(path.join('..', '..', 'js', 'gen-numerical.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;
const buildKbdStackHTML = (X) => `<!--KBD-STUB-${X}-->`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, wrapFb, buildKbdStackHTML, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Calculez.</p>',
        val: '42', n: '3', isR: false,
        fbc: 'Bravo', fbe: 'Perdu',
        tolType: 'NumAbsolute', tolVal: '0.01',
        forbid: '1',
        numFbGen: '',
        aide: '', useKbd: false
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

test('sans arrondi : ta_X = val brut', () => {
    const q = genNumericalCore(1, baseParams({ isR: false, val: '42' }), DEPS);
    assert.match(q.vars, /ta1:42;/);
});

test('avec arrondi : ta_X utilise float(round(...)) avec n chiffres significatifs', () => {
    const q = genNumericalCore(1, baseParams({ isR: true, val: '42', n: '3' }), DEPS);
    assert.match(q.vars, /ta1:float\(round\(42\*10\^\(3-1-floor/);
});

test('tolType relative/absolue pilote answertest du nœud PRT', () => {
    const rel = genNumericalCore(1, baseParams({ tolType: 'NumRelative' }), DEPS);
    assert.equal(rel.prt.nodes[0].answertest, 'NumRelative');
    const abs = genNumericalCore(1, baseParams({ tolType: 'NumAbsolute' }), DEPS);
    assert.equal(abs.prt.nodes[0].answertest, 'NumAbsolute');
});

test('tolVal alimente testoptions du nœud PRT', () => {
    const q = genNumericalCore(1, baseParams({ tolVal: '0.5' }), DEPS);
    assert.equal(q.prt.nodes[0].testoptions, '0.5');
});

test('sans clavier : input visible en ligne, avec clavier : bloc iframe injecté', () => {
    const sansKbd = genNumericalCore(1, baseParams({ useKbd: false }), DEPS);
    assert.match(sansKbd.textFrag, /\[\[input:ans1\]\] \[\[validation:ans1\]\]/);
    assert.equal(sansKbd.kbdRaw, null);

    const avecKbd = genNumericalCore(1, baseParams({ useKbd: true }), DEPS);
    assert.match(avecKbd.textFrag, /<!--HS-KBD:1-->/);
    assert.equal(avecKbd.kbdRaw, '<!--KBD-STUB-1-->');
});

test('generalFeedback intègre numFbGen', () => {
    const q = genNumericalCore(1, baseParams({ numFbGen: 'Astuce' }), DEPS);
    assert.match(q.generalFeedback, /Astuce/);
});

test('generalFeedback est encadré (applyFbBox "general")', () => {
    const q = genNumericalCore(1, baseParams(), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('qnote est vide : pas de rand(), pas de variante à documenter (et {@ta@} révélerait la réponse)', () => {
    const q = genNumericalCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, '');
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genNumericalCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
