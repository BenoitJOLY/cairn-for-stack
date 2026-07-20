// Tests unitaires du cœur pur de gen-glr.js (genGLRCore).
//
// Lancer :  npm test
//
// genGLRCore() ne lit jamais document : tout est passé en p (voir la
// fonction genGLR(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genGLRCore } = require(path.join('..', '..', 'js', 'gen-glr.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
global.htmlEsc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const DEPS = { I18N: I18N_STUB, buildPrtXml, wrapFb, _mkFbGen };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Lire graphiquement.</p>',
        fnRaw: 'x^2',
        xMin: -5, xMax: 5, yMin: -5, yMax: 5,
        x0: 2,
        tol: 0.25,
        dispW: 600, dispH: 400,
        fbOkTxt: '', fbWrTxt: '',
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

test('évalue y0=f(x0) et construit le point cible [x0,y0]', () => {
    const q = genGLRCore(1, baseParams({ fnRaw: 'x^2', x0: 3 }), DEPS);
    assert.match(q.inputXML, /<tans>\[3,9\]<\/tans>/);
});

test('lève une erreur si la fonction ne peut pas être évaluée', () => {
    assert.throws(() => genGLRCore(1, baseParams({ fnRaw: 'sqrt(x)', x0: -5 }), DEPS), /glr\.err_fn_eval/);
});

test('un seul nœud PRT AlgEquiv comparant glr_in_X à true', () => {
    const q = genGLRCore(1, baseParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].sans, 'glr_in_1');
    assert.equal(q.prt.nodes[0].tans, 'true');
});

test('feedbackvariables inclut la tolérance en x', () => {
    const q = genGLRCore(1, baseParams({ tol: 0.5, x0: 1 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /abs\(glr_x_1-\(1\)\)<=0\.5/);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genGLRCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le code JSXGraph intègre les bornes xMin/xMax/yMin/yMax', () => {
    const q = genGLRCore(1, baseParams({ xMin: -3, xMax: 3, yMin: -2, yMax: 4 }), DEPS);
    assert.match(q.textFrag, /boundingbox:\[-3,4,3,-2\]/);
});

test('le XML (prtXML, inputXML) est bien formé', () => {
    const q = genGLRCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});
