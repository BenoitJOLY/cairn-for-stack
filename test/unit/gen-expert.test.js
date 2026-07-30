// Tests unitaires du cœur pur de gen-expert.js (genExpertCore).
//
// Lancer :  npm test
//
// genExpertCore() ne lit jamais document ni le store `questions` global :
// il opère uniquement sur l'objet d'état s (= q._expertState), déjà
// synchronisé par expertCaptureToState() dans le wrapper genExpert(qid).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genExpertCore } = require(path.join('..', '..', 'js', 'gen-expert.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const DEPS = { I18N: I18N_STUB, buildPrtXml, applyFbBox, inferFbKind };

function simpleNode(id, trueNext, falseNext) {
    return {
        id: id, name: id, description: '', answertest: 'AlgEquiv', sans: 'ans1', tans: 'ta1',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: String(trueNext),
        trueanswernote: 'T', truefeedback: '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: String(falseNext),
        falseanswernote: 'F', falsefeedback: ''
    };
}

function baseState(overrides) {
    return Object.assign({
        bareme: 1, penalty: 0.1,
        vars: 'ta1:x^2;',
        questiontext: '<p>Résolvez.</p>',
        inputs: [{ name: 'ans1', type: 'algebraic', tans: 'ta1' }],
        prts: [{ name: 'prt1', value: 1, nodes: [simpleNode('0', -1, -1)] }],
        generalfeedback: '', questionnote: '', name: 'Q1'
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

test('construction nominale : inputXML/prtXML/feedbackRef corrects', () => {
    const q = genExpertCore(baseState(), DEPS);
    assert.match(q.inputXML, /<name>ans1<\/name>/);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
    assert.equal(q.bareme, 1);
});

test('rejette un input sans inputs ou sans prts', () => {
    assert.throws(() => genExpertCore(baseState({ inputs: [] }), DEPS), /err_expert_input_requis/);
    assert.throws(() => genExpertCore(baseState({ prts: [] }), DEPS), /err_expert_prt_requis/);
});

test('rejette un nom d\'input invalide (ne commence pas par une lettre)', () => {
    const s = baseState({ inputs: [{ name: '1ans', tans: 'ta1' }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_input_nom/);
});

test('rejette un input sans tans', () => {
    const s = baseState({ inputs: [{ name: 'ans1', tans: '' }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_tans/);
});

test('rejette un PRT sans nœuds', () => {
    const s = baseState({ prts: [{ name: 'prt1', nodes: [] }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_prt_noeud/);
});

test('rejette un PRT avec une boucle infinie', () => {
    const s = baseState({ prts: [{ name: 'prt1', nodes: [simpleNode('0', '1', '-1'), simpleNode('1', '0', '-1')] }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_boucle/);
});

test('rejette un PRT référençant un nœud successeur inexistant', () => {
    const s = baseState({ prts: [{ name: 'prt1', nodes: [simpleNode('0', '99', '-1')] }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_succ_vrai/);
});

test('rejette un PRT avec des nœuds orphelins (non atteignables depuis la racine)', () => {
    const s = baseState({ prts: [{ name: 'prt1', nodes: [simpleNode('0', '-1', '-1'), simpleNode('1', '-1', '-1')] }] });
    assert.throws(() => genExpertCore(s, DEPS), /err_expert_orphelins/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genExpertCore(baseState(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
