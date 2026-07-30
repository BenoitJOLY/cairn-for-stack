// Tests unitaires du cœur pur de gen-basen.js (genBasenCore).
//
// Lancer :  npm test
//
// genBasenCore() ne lit jamais document : tout est passé en p (voir la
// fonction genBasen(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genBasenCore } = require(path.join('..', '..', 'js', 'gen-basen.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

function bnStrictParse(str, base) {
    var s = String(str == null ? '' : str).trim().toUpperCase();
    if (!s.length) return null;
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
    for (var i = 0; i < s.length; i++) {
        if (alphabet.indexOf(s[i]) === -1) return null;
    }
    return parseInt(s, base);
}

function bnSyntaxHint(format, toBase, fixedWidth) {
    return 'hint:' + format + ':' + toBase + ':' + fixedWidth;
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, bnStrictParse, bnSyntaxHint, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        format: 'S', fromBase: 10, toBase: 2,
        valueMode: 'fixe', valueBase: 'depart', bareme: 1,
        fbOk: '', fbWrong: '', text: '', fixedWidth: 0,
        valueMin: 0, valueMax: 10,
        valueRaw: '10',
        fbGen: ''
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

test('toBase=10 : input algébrique, tans = valeur décimale, 3 nœuds (correct, misread10, srcrevval, fallback)', () => {
    const q = genBasenCore(1, baseParams({ fromBase: 2, toBase: 10, valueRaw: '1010' }), DEPS);
    assert.match(q.inputXML, /<type>algebraic<\/type>/);
    assert.equal(q.prt.nodes.length, 4);
    assert.match(q.vars, /q1_misread10:/);
    assert.match(q.vars, /q1_srcrevval:/);
});

test('toBase=10, fromBase=10 : pas de nœuds misread10/srcrevval (2 nœuds seulement)', () => {
    const q = genBasenCore(1, baseParams({ fromBase: 10, toBase: 10, valueRaw: '42' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.doesNotMatch(q.vars, /q1_misread10/);
});

test('toBase!=10, notation S : input string, tans = q_dststr, plusieurs nœuds diagnostics', () => {
    const q = genBasenCore(1, baseParams({ format: 'S', toBase: 2, fromBase: 10, valueRaw: '10' }), DEPS);
    assert.match(q.inputXML, /<type>string<\/type>/);
    assert.equal(q.prt.nodes[0].tans, 'q1_dststr');
    assert.ok(q.prt.nodes.length > 2);
});

test('toBase!=10, notation C avec toBase=2 : préfixe 0b appliqué', () => {
    const q = genBasenCore(1, baseParams({ format: 'C', toBase: 2, fromBase: 10, valueRaw: '10' }), DEPS);
    assert.match(q.vars, /sconcat\("0b", q1_dstraw\)/);
});

test('notation C avec toBase=10 non concerné : reste en notation S (pas de préfixe attendu)', () => {
    const q = genBasenCore(1, baseParams({ format: 'C', toBase: 8, fromBase: 10, valueRaw: '10' }), DEPS);
    assert.match(q.vars, /sconcat\("0o", q1_dstraw\)/);
});

test('fixedWidth>0 (toBase!=10) : complète la réponse avec des zéros devant, désactive le diag "zéros inutiles"', () => {
    const q = genBasenCore(1, baseParams({ toBase: 2, fromBase: 10, fixedWidth: 8, valueRaw: '10' }), DEPS);
    assert.match(q.vars, /smake\(max\(0, 8 - slength/);
    assert.ok(!q.diagNodes.some(d => /Zeros inutiles/.test(d.desc)));
});

test('fixedWidth ignoré quand toBase=10', () => {
    const q = genBasenCore(1, baseParams({ toBase: 10, fromBase: 2, fixedWidth: 8, valueRaw: '1010' }), DEPS);
    assert.doesNotMatch(q.vars, /smake/);
});

test('valueMode=aleatoire : tirage aléatoire entre min et max', () => {
    const q = genBasenCore(1, baseParams({ valueMode: 'aleatoire', valueMin: 5, valueMax: 15 }), DEPS);
    assert.match(q.vars, /q1_val: 5\+rand\(11\)/);
});

test('valueMode=aleatoire avec bornes inversées : normalise min/max', () => {
    const q = genBasenCore(1, baseParams({ valueMode: 'aleatoire', valueMin: 15, valueMax: 5 }), DEPS);
    assert.match(q.vars, /q1_val: 5\+rand\(11\)/);
});

test('valueMode=fixe avec valeur invalide dans la base choisie : retombe sur 42', () => {
    const q = genBasenCore(1, baseParams({ valueMode: 'fixe', fromBase: 2, valueBase: 'depart', valueRaw: 'ZZZ' }), DEPS);
    assert.match(q.vars, /q1_val: 42;/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback du nœud correct/final', () => {
    const q = genBasenCore(1, baseParams({ toBase: 2, fbOk: 'Bravo', fbWrong: 'Perdu' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[q.prt.nodes.length - 1].truefeedback, 'Perdu');
});

test('scores en fraction de 1 (indépendants du barème) : correct=1, presque-correct=0.5, faux=0', () => {
    const q = genBasenCore(1, baseParams({ bareme: 3, toBase: 2 }), DEPS);
    assert.equal(q.prt.nodes[0].truescore, '1');
    assert.equal(q.prt.nodes[1].truescore, '0.5');
    assert.equal(q.prt.nodes[2].truescore, '0');
});

test('diagNodes expose les nœuds de diagnostic intermédiaires (hors "réponse exacte")', () => {
    const q = genBasenCore(1, baseParams({ toBase: 2, fromBase: 10 }), DEPS);
    assert.equal(q.diagNodes.length, q.prt.nodes.length - 1);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genBasenCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('les encadrés colorés ne sont jamais dans le contenu brut édité (prt.nodes/diagNodes), seulement dans prtXML/generalFeedback', () => {
    const q = genBasenCore(1, baseParams({ toBase: 2, fromBase: 10 }), DEPS);
    q.prt.nodes.forEach(n => {
        assert.doesNotMatch(n.truefeedback, /border-left/);
        assert.doesNotMatch(n.falsefeedback, /border-left/);
    });
    q.diagNodes.forEach(d => assert.doesNotMatch(d.fb, /border-left/));
    assert.match(q.prtXML, /border-left/);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('le XML (prtXML, inputXML) est bien formé pour plusieurs combinaisons format/base/largeur', () => {
    [
        { format: 'S', fromBase: 10, toBase: 2, fixedWidth: 0 },
        { format: 'C', fromBase: 10, toBase: 16, fixedWidth: 0 },
        { format: 'S', fromBase: 2, toBase: 10, fixedWidth: 0 },
        { format: 'S', fromBase: 10, toBase: 16, fixedWidth: 4 },
        { format: 'S', fromBase: 10, toBase: 36, fixedWidth: 0 }
    ].forEach(cfg => {
        const q = genBasenCore(1, baseParams(cfg), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${JSON.stringify(cfg)}]`);
        assertBalancedTags(q.inputXML, `inputXML[${JSON.stringify(cfg)}]`);
    });
});
