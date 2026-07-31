// Tests unitaires du cœur pur de gen-algebraic.js (genAlgebraicCore).
//
// Lancer :  npm test
//
// genAlgebraicCore() ne lit jamais document : formVars/poolVars/algFb/aide/
// useKbd sont passés en p (voir la fonction genAlgebraic(X)).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genAlgebraicCore } = require(path.join('..', '..', 'js', 'gen-algebraic.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;
const buildKbdStackHTML = (X) => `<!--KBD-STUB-${X}-->`;
function algPrtNodeCanonical(X,n,test,sans,tans,opts,trueNext,trueScore,falseNext,falseScore,trueFb,falseFb,trueNote,falseNote,desc){
    return {
        name: String(n), description: desc||'', answertest: test, sans: sans, tans: tans,
        testoptions: opts||'', quiet: '0',
        truescoremode: '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
        trueanswernote: trueNote||('PRT-'+X+'-'+n+'-T'), truefeedback: trueFb||'',
        falsescoremode: '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
        falseanswernote: falseNote||('PRT-'+X+'-'+n+'-F'), falsefeedback: falseFb||''
    };
}

const DEPS = { I18N: I18N_STUB, buildPrtXml, wrapFb, algPrtNodeCanonical, buildKbdStackHTML, applyFbBox, inferFbKind };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Résolvez.</p>',
        formula: 'x^2+2*x+1', mode: 'libre',
        exprDisplay: '(x+1)^2', errorExpr: '',
        fbc: 'Bravo', fbe: 'Perdu',
        sol: '',
        aide: '', useKbd: false,
        formVars: ['x'], poolVars: [],
        algFb: {
            developpement: { partial: 'Développement incomplet', errsigne: 'Erreur de signe' },
            factorisation: { partial: 'Factorisation incomplète' },
            fraction: { partial: 'Fraction non simplifiée' },
            expert: { partial: 'Développement incomplet', errsigne: 'Erreur de signe' }
        }
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

test("mode 'libre' produit un seul nœud PRT AlgEquiv", () => {
    const q = genAlgebraicCore(1, baseParams({ mode: 'libre' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].answertest, 'AlgEquiv');
});

test("mode 'developpement' sans erreur classique produit 2 nœuds", () => {
    const q = genAlgebraicCore(1, baseParams({ mode: 'developpement', errorExpr: '' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[1].answertest, 'Expanded');
});

test("mode 'developpement' avec erreur classique ajoute un 3e nœud de détection", () => {
    const q = genAlgebraicCore(1, baseParams({ mode: 'developpement', errorExpr: '-x^2+2*x+1' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.match(q.vars, /erreur1:-x\^2\+2\*x\+1;/);
});

test("mode 'factorisation' utilise FacForm avec mainVar comme testoptions", () => {
    const q = genAlgebraicCore(1, baseParams({ mode: 'factorisation', formVars: ['y'] }), DEPS);
    assert.equal(q.prt.nodes[1].answertest, 'FacForm');
    assert.equal(q.prt.nodes[1].testoptions, 'y');
});

test('allowwords combine formVars et poolVars sans doublons', () => {
    const q = genAlgebraicCore(1, baseParams({ formVars: ['x', 'a'], poolVars: ['a', 'b'] }), DEPS);
    assert.match(q.inputXML, /<allowwords>x,a,b<\/allowwords>/);
});

test('generalFeedback inclut la solution si fournie', () => {
    const q = genAlgebraicCore(1, baseParams({ sol: '<p>Étape par étape...</p>' }), DEPS);
    assert.match(q.generalFeedback, /Étape par étape/);
});

test('generalFeedback est encadré (applyFbBox "general")', () => {
    const q = genAlgebraicCore(1, baseParams(), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('qnote est vide : pas de rand(), pas de variante à documenter (et {@ta@} révélerait la réponse)', () => {
    const q = genAlgebraicCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, '');
});

test('le XML (prtXML, inputXML) est bien formé pour chaque mode', () => {
    ['libre', 'developpement', 'factorisation', 'fraction', 'expert'].forEach(mode => {
        const q = genAlgebraicCore(1, baseParams({ mode }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${mode}]`);
        assertBalancedTags(q.inputXML, `inputXML[${mode}]`);
    });
});
