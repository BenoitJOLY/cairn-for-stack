// Tests unitaires du cœur pur de gen-logique.js (genLogiqueCore).
//
// Lancer :  npm test
//
// genLogiqueCore() ne lit jamais document : tout est passé en p (voir
// genLogique(X), seul point de contact avec le DOM). _lgSeqPrt et
// _lgGenFbBox utilisent I18N/buildPrtXml en interne (globales) : ils sont
// injectés comme un tout via deps._lgSeqPrt / deps._lgGenFbBox plutôt que
// réécrits en interne.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genLogiqueCore } = require(path.join('..', '..', 'js', 'gen-logique.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkInput(o) {
    return '<input><name>' + o.name + '</name><type>' + o.type + '</type><tans>' + o.tans + '</tans></input>';
}
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
function _lgSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv',
        sans: spec.sans, tans: spec.tans,
        testoptions: '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '0',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: ''
    };
}
function _lgSeqPrt(X, bareme, specs) {
    var nodes = specs.map(function (spec, idx) { return _lgSeqNode(X, idx, idx === specs.length - 1, spec); });
    var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: '' };
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, nodes) };
}
function _lgGenFbBox(bodyHtml) {
    return '<div>' + I18N_STUB.t('log.reponse_attendue_lbl') + bodyHtml + '</div>';
}

const DEPS = { I18N: I18N_STUB, _mkInput, _mkFbGen, buildPrtXml, _lgSeqPrt, _lgGenFbBox };

function baseParams(overrides) {
    return Object.assign({
        scenario: 'table', nbVars: 2,
        expr: '(P and Q) or not(P)', expr2: '', expr3: '', expr4: '',
        subexpr1: '', subexpr2: '', tansForm: '',
        nbBlanks: 2, bareme: 1,
        fbOk: '', fbWrong: '', fbGen: '', text: ''
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

test('genLogiqueCore : table — toutes les lignes en input, 4 nœuds PRT (ok/négation/ordre inversé/fallback)', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'table', nbBlanks: 4 }), DEPS);
    assert.match(q.inputXML, /<name>ans1r0<\/name>/);
    assert.match(q.inputXML, /<name>ans1r3<\/name>/);
    assert.equal(q.prt.nodes.length, 4);
});

test('genLogiqueCore : cases — seules les dernières nbBlanks lignes sont des inputs', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'cases', nbBlanks: 1 }), DEPS);
    assert.match(q.textFrag, /\[\[input:ans1r3\]\]/);
    assert.doesNotMatch(q.textFrag, /\[\[input:ans1r0\]\]/);
});

test('genLogiqueCore : identifier — dropdown avec choix A par défaut correct', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'identifier' }), DEPS);
    assert.match(q.inputXML, /<type>dropdown<\/type>/);
    assert.match(q.inputXML, /<name>ans1<\/name>/);
    assert.ok(q.prt.nodes.length >= 2);
});

test('genLogiqueCore : identifier — détecte une négation parmi les choix et ajoute un nœud intermédiaire', () => {
    const q = genLogiqueCore(1, baseParams({
        scenario: 'identifier', expr: 'P and Q', expr2: 'not(P and Q)'
    }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
});

test('genLogiqueCore : equivalence — 3 nœuds PRT, tables équivalentes détectées', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'equivalence', expr: 'not(not(P))', expr2: 'P' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.equal(q.prt.nodes[1].tans, 'true');
});

test('genLogiqueCore : equivalence — tables différentes détectées comme non équivalentes', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'equivalence', expr: 'P and Q', expr2: 'P or Q' }), DEPS);
    assert.equal(q.prt.nodes[1].tans, 'false');
});

test('genLogiqueCore : intermediaire — inputs pour les 2 sous-expressions + finale, 4 nœuds PRT', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'intermediaire', subexpr1: '(P and Q)', subexpr2: 'not(P)' }), DEPS);
    assert.match(q.inputXML, /<name>ans1s1r0<\/name>/);
    assert.match(q.inputXML, /<name>ans1s2r0<\/name>/);
    assert.match(q.inputXML, /<name>ans1fr0<\/name>/);
    assert.equal(q.prt.nodes.length, 4);
});

test('genLogiqueCore : simplif (scénario par défaut) — input algébrique unique, 1 nœud PRT', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'autre-chose', expr: 'P and Q', bareme: 2 }), DEPS);
    assert.match(q.inputXML, /<type>algebraic<\/type>/);
    assert.match(q.inputXML, /<tans>P and Q<\/tans>/);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].truescore, '2');
});

test('genLogiqueCore : simplif — tansForm personnalisé remplace expr comme réponse attendue', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'simplif', expr: 'P and Q', tansForm: 'Q and P' }), DEPS);
    assert.match(q.inputXML, /<tans>Q and P<\/tans>/);
});

test('genLogiqueCore : fbOk/fbWrong personnalisés remplacent le feedback par défaut (table)', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'table', fbOk: 'Bravo perso', fbWrong: 'Raté perso' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo perso');
    assert.equal(q.prt.nodes[q.prt.nodes.length - 1].truefeedback, 'Raté perso');
});

test('genLogiqueCore : generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genLogiqueCore(1, baseParams({ scenario: 'table', fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('genLogiqueCore : le XML (prtXML, inputXML) est bien formé pour chaque scénario', () => {
    ['table', 'cases', 'identifier', 'equivalence', 'intermediaire', 'simplif'].forEach(scenario => {
        const q = genLogiqueCore(1, baseParams({ scenario, subexpr1: '(P and Q)', subexpr2: 'not(P)' }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML (${scenario})`);
        if (q.inputXML) assertBalancedTags(q.inputXML, `inputXML (${scenario})`);
    });
});
