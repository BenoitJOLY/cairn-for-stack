// Tests unitaires du cœur pur de gen-math-complexe.js (genComplexeCore).
//
// Lancer :  npm test
//
// genComplexeCore() ne lit jamais document/CPX_FB_DEFS-related DOM : tout
// est passé en p (voir genComplexe(X), seul point de contact avec le DOM).
// _cpxFb() (impur, lit document.getElementById) n'est pas appelé par le
// cœur : p.fbOverrides précalcule tous les couples scenario|key, lus par
// une fermeture locale _cpxFb_D().

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genComplexeCore } = require(path.join('..', '..', 'js', 'gen-math-complexe.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkInput(o) {
    return '<input><name>' + o.name + '</name><tans>' + o.tans + '</tans></input>';
}
function _cpxGenFbgen(scenario, op, complexno) {
    return '<p>fbgen:' + scenario + ':' + op + ':' + complexno + '</p>';
}
// genComplexeCore ne délègue à _cpxGenFbgen_D que si le global bare
// `typeof _cpxGenFbgen === 'function'` (garde héritée de l'ordre de
// chargement des scripts navigateur, où complexe-ui.js peut ne pas être
// encore chargé) : on le fournit ici pour activer ce chemin en test.
global._cpxGenFbgen = _cpxGenFbgen;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _cpxGenFbgen };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1, scenario: 'forme-alg', complexno: 'i', mode: 'fixe', op: '*',
        randMin: -5, randMax: 5, custText: '', custFbgen: '',
        fa: 3, fb: 2, fc: 1, fd: -1, feqb: -2, feqc: 5,
        fbOverrides: {}
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

test('genComplexeCore : forme-alg — 3 nœuds PRT, vars/input attendus', () => {
    const q = genComplexeCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.vars, /q1_z1:\(3\)\+\(2\)\*%i;/);
    assert.match(q.inputXML, /<name>ans11<\/name>/);
});

test('genComplexeCore : module-arg — 4 nœuds PRT, deux inputs (mod/arg)', () => {
    const q = genComplexeCore(1, baseParams({ scenario: 'module-arg' }), DEPS);
    assert.equal(q.prt.nodes.length, 4);
    assert.match(q.inputXML, /<name>ans_mod1<\/name>/);
    assert.match(q.inputXML, /<name>ans_arg1<\/name>/);
});

test('genComplexeCore : equation-2deg — 4 nœuds PRT, deux inputs (z1/z2)', () => {
    const q = genComplexeCore(1, baseParams({ scenario: 'equation-2deg' }), DEPS);
    assert.equal(q.prt.nodes.length, 4);
    assert.match(q.vars, /q1_eqb:\(-2\);/);
    assert.match(q.vars, /q1_eqc:\(5\);/);
});

test('genComplexeCore : affixes — 3 nœuds PRT, deux inputs (zi/ab)', () => {
    const q = genComplexeCore(1, baseParams({ scenario: 'affixes' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.inputXML, /<name>ans_zi1<\/name>/);
    assert.match(q.inputXML, /<name>ans_ab1<\/name>/);
});

test('genComplexeCore : conjugue (défaut) — 2 nœuds PRT, un input', () => {
    const q = genComplexeCore(1, baseParams({ scenario: 'conjugue' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.match(q.inputXML, /<name>ans_zbar1<\/name>/);
});

test('genComplexeCore : mode aléatoire — vars utilise rinz(min,max) au lieu des valeurs fixes', () => {
    const q = genComplexeCore(1, baseParams({ mode: 'aleatoire', randMin: -3, randMax: 3 }), DEPS);
    assert.match(q.vars, /rinz\(-3,3\)/);
});

test('genComplexeCore : fbOverrides — feedback édité par l\'enseignant remplace le défaut', () => {
    const q = genComplexeCore(1, baseParams({
        fbOverrides: { 'forme-alg|ok': 'Bravo [Z1] !' }
    }), DEPS);
    assert.match(q.prt.nodes[0].truefeedback, /Bravo \{@q1_z1@\} !/);
});

test('genComplexeCore : sans override, le feedback par défaut vient de I18N via defKey', () => {
    const q = genComplexeCore(1, baseParams(), DEPS);
    assert.match(q.prt.nodes[0].truefeedback, /tpl\.cpx_fbdef_formealg_ok_def/);
});

test('genComplexeCore : custText remplace le texte par défaut (avec placeholders résolus)', () => {
    const q = genComplexeCore(1, baseParams({ custText: 'Calculez [Z1] fois [Z2].' }), DEPS);
    assert.match(q.textFrag, /Calculez \{@q1_z1@\} fois \{@q1_z2@\}\./);
});

test('genComplexeCore : custFbgen remplace le fallback _cpxGenFbgen', () => {
    const q = genComplexeCore(1, baseParams({ custFbgen: 'Correction perso' }), DEPS);
    assert.match(q.generalFeedback, /Correction perso/);
    assert.doesNotMatch(q.generalFeedback, /fbgen:forme-alg/);
});

test('genComplexeCore : sans custFbgen, generalFeedback utilise _cpxGenFbgen injecté', () => {
    const q = genComplexeCore(1, baseParams(), DEPS);
    assert.match(q.generalFeedback, /fbgen:forme-alg:\*:i/);
});

test('genComplexeCore : le XML (prtXML, inputXML) est bien formé pour chaque scénario', () => {
    ['forme-alg', 'module-arg', 'equation-2deg', 'affixes', 'conjugue'].forEach(scenario => {
        const q = genComplexeCore(1, baseParams({ scenario }), DEPS);
        assertBalancedTags(q.prtXML, 'prtXML (' + scenario + ')');
        assertBalancedTags(q.inputXML, 'inputXML (' + scenario + ')');
    });
});
