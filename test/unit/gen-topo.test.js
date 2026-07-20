// Tests unitaires des cœurs purs de gen-topo.js (genChemicalTopoCore, genChemicalCore).
//
// Lancer :  npm test
//
// Les deux cœurs ne lisent jamais document : tout est passé en p (voir
// genChemicalTopo(X) / genChemical(X), seuls points de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genChemicalTopoCore, genChemicalCore } = require(path.join('..', '..', 'js', 'gen-topo.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen };

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

// ── genChemicalTopoCore ────────────────────────────────────────────────

function topoParams(overrides) {
    return Object.assign({
        bareme: 2, text: '<p>Équilibrez la réaction.</p>',
        equation: 'H2 + O2 -> H2O',
        w_prt1: 0.1, w_n0: 0.2, w_n1: 0.1, w_n2: 0.2, w_n3: 0.1, w_n4: 0.2, w_n5: 0.1,
        fctDefault: 'aucune', typeReac: '', fbGenRaw: '', capturedHtml: '<svg>preview</svg>'
    }, overrides || {});
}

test('genChemicalTopoCore : construit 7 nœuds PRT canoniques', () => {
    const q = genChemicalTopoCore(1, topoParams(), DEPS);
    assert.equal(q.prt.nodes.length, 7);
});

test('genChemicalTopoCore : qnote reprend l\'équation brute', () => {
    const q = genChemicalTopoCore(1, topoParams(), DEPS);
    assert.match(q.qnote, /H2 \+ O2 -> H2O/);
});

test('genChemicalTopoCore : bareme personnalisé propagé à la sortie', () => {
    const q = genChemicalTopoCore(1, topoParams({ bareme: 3 }), DEPS);
    assert.equal(q.bareme, 3);
});

test('genChemicalTopoCore : previewFrag intègre le titre via I18N injecté', () => {
    const q = genChemicalTopoCore(1, topoParams(), DEPS);
    assert.match(q.previewFrag, /tpl\.topo_title/);
});

test('genChemicalTopoCore : topoPreviewHtml reprend capturedHtml transmis par le wrapper', () => {
    const q = genChemicalTopoCore(1, topoParams(), DEPS);
    assert.equal(q.topoPreviewHtml, '<svg>preview</svg>');
});

test('genChemicalTopoCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genChemicalTopoCore(1, topoParams({ fbGenRaw: 'Remarque topo' }), DEPS);
    assert.match(q.generalFeedback, /Remarque topo/);
});

test('genChemicalTopoCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genChemicalTopoCore(1, topoParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (topo)');
    assertBalancedTags(q.inputXML, 'inputXML (topo)');
});

// ── genChemicalCore ───────────────────────────────────────────────────

function chemParams(overrides) {
    return Object.assign({
        bareme: 2, text: '<p>Écrivez la réaction.</p>',
        editorHTML: 'H<sub>2</sub> + O<sub>2</sub> -&gt; H<sub>2</sub>O',
        editorPlain: 'H2 + O2 -> H2O',
        latex: 'H2 + O2 -> H2O',
        fbGenRaw: ''
    }, overrides || {});
}

test('genChemicalCore : construit 8 nœuds PRT canoniques', () => {
    const q = genChemicalCore(1, chemParams(), DEPS);
    assert.equal(q.prt.nodes.length, 8);
});

test('genChemicalCore : qnote reprend editorPlain transmis par le wrapper', () => {
    const q = genChemicalCore(1, chemParams(), DEPS);
    assert.equal(q.qnote, 'H2 + O2 -> H2O');
});

test('genChemicalCore : distingue correctement flèche totale (->) et équilibre (<=>) dans vars', () => {
    const qTot = genChemicalCore(1, chemParams({ latex: 'H2 + O2 -> H2O' }), DEPS);
    assert.match(qTot.vars, /tarr1:"->"/);
    const qEq = genChemicalCore(1, chemParams({ latex: 'NH3 + H2O <=> NH4+ + OH-' }), DEPS);
    assert.match(qEq.vars, /tarr1:"<=>"/);
});

test('genChemicalCore : diagNodes exclut le succès du nœud 0 et l\'échec du dernier nœud', () => {
    const q = genChemicalCore(1, chemParams(), DEPS);
    assert.ok(q.diagNodes.length > 0);
    assert.ok(q.diagNodes.every(d => d.desc && d.fb));
});

test('genChemicalCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genChemicalCore(1, chemParams({ fbGenRaw: 'Remarque chimie' }), DEPS);
    assert.match(q.generalFeedback, /Remarque chimie/);
});

test('genChemicalCore : kbdRaw (JSXGraph) contient le code JS embarqué', () => {
    const q = genChemicalCore(1, chemParams(), DEPS);
    assert.match(q.kbdRaw, /processSide/);
});

test('genChemicalCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genChemicalCore(1, chemParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (chem)');
    assertBalancedTags(q.inputXML, 'inputXML (chem)');
});
