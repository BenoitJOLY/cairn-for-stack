// Tests unitaires du cœur pur de gen-math-geometrie.js (genGeometrieCore).
//
// Lancer :  npm test
//
// genGeometrieCore() ne lit jamais document : tout est passé en p (voir
// genGeometrie(X), seul point de contact avec le DOM). Les nombres p1x/
// p1y/p1z/p2x/... sont transmis à l'état brut (parseFloat, potentiellement
// NaN) : le cœur applique lui-même la logique de valeur par défaut de gn().

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genGeometrieCore } = require(path.join('..', '..', 'js', 'gen-math-geometrie.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkInput(o) {
    return '<input><name>' + o.name + '</name><tans>' + o.tans + '</tans></input>';
}
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function _geoSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv', sans: spec.sans, tans: spec.tans,
        testoptions: spec.testoptions || '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: ''
    };
}
function _geoSeqPrt(X, bareme, specs) {
    var nodes = specs.map(function (spec, idx) { return _geoSeqNode(X, idx, idx === specs.length - 1, spec); });
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, nodes) };
}
function _geoGenFbBox(bodyHtml) {
    return '<div>' + bodyHtml + '</div>';
}

const DEPS = { I18N: I18N_STUB, _mkInput, _mkFbGen, _geoSeqPrt, _geoGenFbBox, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, scenario: 'distance', mode: 'fixe', dimSel: '2d',
        fbOk: '', fbWrong: '', custText: '', fbGenRaw: '',
        p1x: NaN, p1y: NaN, p1z: NaN, p2x: NaN, p2y: NaN, p2z: NaN, p3x: NaN, p3y: NaN, p3z: NaN
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

test('genGeometrieCore : distance — mode fixe utilise p1x/p1y/p2x/p2y (défauts si NaN)', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'distance', mode: 'fixe' }), DEPS);
    assert.match(q.vars, /q1_xa:1;q1_ya:2;q1_za:0;/);
    assert.match(q.vars, /q1_xb:4;q1_yb:6;q1_zb:0;/);
});

test('genGeometrieCore : distance — 5 nœuds PRT diagnostiques', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'distance' }), DEPS);
    assert.equal(q.prt.nodes.length, 5);
    assert.equal(q.diagNodes.length, 3);
});

test('genGeometrieCore : distance — p1x fourni prime sur le défaut', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'distance', mode: 'fixe', p1x: 7 }), DEPS);
    assert.match(q.vars, /q1_xa:7;/);
});

test('genGeometrieCore : milieu — 2 inputs de type matrix, 5 nœuds PRT', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'milieu' }), DEPS);
    assert.equal(q.prt.nodes.length, 5);
    assert.match(q.inputXML, /<name>ans_mid1<\/name>/);
});

test('genGeometrieCore : norme — mode 3D ajoute la composante z', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'norme', dimSel: '3d', mode: 'fixe' }), DEPS);
    assert.match(q.vars, /q1_uz:0;/);
    assert.equal(q.prt.nodes.length, 5);
});

test('genGeometrieCore : pente — mode fixe force a=1 si p2x=0', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'pente', mode: 'fixe', p2x: 0 }), DEPS);
    assert.match(q.vars, /if q1_a=0 then q1_a:1;/);
    assert.equal(q.prt.nodes.length, 5);
});

test('genGeometrieCore : ordonnee — 6 nœuds PRT (5 erreurs diagnostiquées + fallback)', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'ordonnee' }), DEPS);
    assert.equal(q.prt.nodes.length, 6);
});

test('genGeometrieCore : aire — 2D a 4 nœuds PRT, 3D en ajoute un (erreur projection)', () => {
    const q2d = genGeometrieCore(1, baseParams({ scenario: 'aire', dimSel: '2d' }), DEPS);
    const q3d = genGeometrieCore(1, baseParams({ scenario: 'aire', dimSel: '3d' }), DEPS);
    assert.equal(q2d.prt.nodes.length, 4);
    assert.equal(q3d.prt.nodes.length, 5);
});

test('genGeometrieCore : fbOk/fbWrong personnalisés remplacent le feedback par défaut du nœud correct/fallback', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'distance', fbOk: 'Bravo perso', fbWrong: 'Raté perso' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo perso');
    assert.equal(q.prt.nodes[q.prt.nodes.length - 1].truefeedback, 'Raté perso');
});

test('genGeometrieCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genGeometrieCore(1, baseParams({ scenario: 'distance', fbGenRaw: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genGeometrieCore : le XML (prtXML, inputXML) est bien formé pour chaque combinaison scénario/dimension', () => {
    ['distance', 'milieu', 'norme', 'pente', 'ordonnee', 'aire'].forEach(scenario => {
        ['2d', '3d'].forEach(dimSel => {
            const q = genGeometrieCore(1, baseParams({ scenario, dimSel }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML (${scenario}/${dimSel})`);
            assertBalancedTags(q.inputXML, `inputXML (${scenario}/${dimSel})`);
        });
    });
});
