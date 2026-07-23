// Tests unitaires du cœur pur de gen-circuit.js (genCircuitCore).
//
// Lancer :  npm test
//
// genCircuitCore() ne lit jamais document : tout est passé en p (voir la
// fonction genCircuit(X), seul point de contact avec le DOM). Le modèle de
// circuit (p.model) est fabriqué directement — pas besoin de canvas JSXGraph
// pour tester la génération XML.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCircuit, genCircuitCore } = require(path.join('..', '..', 'js', 'gen-circuit.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = {
    I18N: I18N_STUB, buildPrtXml, _mkFbGen,
    CIR_ENGINE_JS: 'function cirEngineRun(cfg){ return cfg; }',
    CIR_ATELIER_CSS: '.foo{color:red}'
};

function baseModel(overrides) {
    return Object.assign({
        signature: 'SIG-ABC123',
        components: 'R,L',
        values: 'R1=100;L1=9',
        state: 'BASE64STATEBLOB=='
    }, overrides || {});
}

function baseParams(overrides) {
    return Object.assign({
        model: baseModel(),
        checkValues: true,
        bareme: 2,
        text: '',
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

test('modèle valide : 4 inputs ans1s/ans1c/ans1w/ans1v, PRT à 3 nœuds, XML bien formé', () => {
    const q = genCircuitCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans1s<\/name>/);
    assert.match(q.inputXML, /<name>ans1c<\/name>/);
    assert.match(q.inputXML, /<name>ans1w<\/name>/);
    assert.match(q.inputXML, /<name>ans1v<\/name>/);
    assert.equal(q.prt.nodes.length, 3);
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.prtXML, 'prtXML');
});

test("checkValues=false : verifier_valeurs1 vaut false dans vars", () => {
    const q = genCircuitCore(1, baseParams({ checkValues: false }), DEPS);
    assert.match(q.vars, /verifier_valeurs1: false\$/);
});

test('checkValues=true : verifier_valeurs1 vaut true dans vars', () => {
    const q = genCircuitCore(1, baseParams({ checkValues: true }), DEPS);
    assert.match(q.vars, /verifier_valeurs1: true\$/);
});

test('barème : nœud 2 (valeurs) porte le score, nœuds 0/1 (gates) restent à 0', () => {
    const q = genCircuitCore(1, baseParams({ bareme: 2 }), DEPS);
    const [n0, n1, n2] = q.prt.nodes;
    assert.equal(n0.truescore, '0');
    assert.equal(n0.falsescore, '0');
    assert.equal(n1.truescore, '0');
    assert.equal(n1.falsescore, '0');
    assert.equal(n2.truescore, '2');
    assert.equal(n2.falsescore, '1');
});

test("prtMeta.value vaut toujours '1' (score absolu additif, pas le barème)", () => {
    const q = genCircuitCore(1, baseParams({ bareme: 5 }), DEPS);
    assert.equal(q.prt.meta.value, '1');
});

test('genCircuit(X) lève une erreur si aucun modèle construit (cirReadModelFromCanvas renvoie null)', () => {
    const prevFn = global.cirReadModelFromCanvas;
    const prevI18N = global.I18N;
    global.cirReadModelFromCanvas = () => null;
    global.I18N = I18N_STUB;
    try {
        assert.throws(() => genCircuit(1), /cir\.err_no_model/);
    } finally {
        global.cirReadModelFromCanvas = prevFn;
        global.I18N = prevI18N;
    }
});

test('compatibilité renumérotage : ren()/renCode() de js/editor.js renomment correctement ans1*/ta1_* → ans2*/ta2_*', () => {
    // Regex copiées à l'identique de js/editor.js renumberChips() (lignes ~393-406) —
    // pas d'accès DOM ici, on teste juste la logique de substitution sur un échantillon
    // représentatif du inputXML/vars produits par genCircuitCore.
    const oldQid = 1, newQid = 2;
    const ren = (s) => {
        if (!s) return s;
        return s
            .replace(new RegExp('\\bans' + oldQid + '(?!\\d)', 'g'), 'ans' + newQid)
            .replace(new RegExp('\\bprt' + oldQid + '(?!\\d)', 'g'), 'prt' + newQid)
            .replace(new RegExp('\\bta' + oldQid + '(?!\\d)', 'g'), 'ta' + newQid)
            .replace(new RegExp('\\bq' + oldQid + '_(\\w+)', 'g'), 'q' + newQid + '_$1');
    };
    const renCode = (s) => {
        if (!s) return s;
        return s.replace(new RegExp('([a-zA-Z_])' + oldQid + '(?!\\d)', 'g'), '$1' + newQid);
    };

    const q = genCircuitCore(1, baseParams(), DEPS);

    const renamedInputXML = ren(q.inputXML);
    assert.match(renamedInputXML, /<name>ans2s<\/name>/);
    assert.match(renamedInputXML, /<name>ans2c<\/name>/);
    assert.match(renamedInputXML, /<name>ans2w<\/name>/);
    assert.match(renamedInputXML, /<name>ans2v<\/name>/);
    assert.match(renamedInputXML, /<tans>ta2_signature<\/tans>/);
    assert.match(renamedInputXML, /<tans>ta2_components<\/tans>/);
    assert.match(renamedInputXML, /<tans>ta2_values<\/tans>/);
    assert.doesNotMatch(renamedInputXML, /\bans1[a-z]\b/);
    assert.doesNotMatch(renamedInputXML, /\bta1_/);

    const renamedVars = renCode(q.vars);
    assert.match(renamedVars, /ta2_components: /);
    assert.match(renamedVars, /ta2_signature: /);
    assert.match(renamedVars, /ta2_values: /);
    assert.match(renamedVars, /verifier_valeurs2: /);
    assert.doesNotMatch(renamedVars, /ta1_/);
    assert.doesNotMatch(renamedVars, /verifier_valeurs1/);

    const renamedPrtXML = renCode(q.prtXML);
    assert.match(renamedPrtXML, /<name>prt2<\/name>/);
    assert.doesNotMatch(renamedPrtXML, /\bprt1\b/);
});
