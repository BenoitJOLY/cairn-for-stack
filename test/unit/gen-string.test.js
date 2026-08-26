// Tests unitaires du cœur pur de gen-string.js (genStringCore / genStringLevenshteinCore).
//
// Lancer :  npm test
//
// genStringCore()/genStringLevenshteinCore() ne lisent jamais document : tout
// est passé en p (voir la fonction genString(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genStringCore, genStringLevenshteinCore } = require(path.join('..', '..', 'js', 'gen-string.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind, stripLeadingFbIcon } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const rawEsc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const htmlEsc = (s) => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, wrapFb, rawEsc, htmlEsc, _mkFbGen, applyFbBox, inferFbKind, stripLeadingFbIcon };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '<p>Nommer.</p>',
        ansPlain: 'photosynthese',
        size: 25,
        test: 'AlgEquiv',
        fbc: 'Bravo', fbe: 'Non',
        fbGen: '',
        solH: '',
        paletteHtml: '',
        levenOn: false,
        altsArr: []
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

test('sans alternative : un seul nœud PRT comparant ans_X à ta_X avec le test choisi', () => {
    const q = genStringCore(1, baseParams({ test: 'AlgEquiv' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].answertest, 'AlgEquiv');
    assert.equal(q.prt.nodes[0].sans, 'ans1');
    assert.equal(q.prt.nodes[0].tans, 'ta1');
});

test('avec alternatives : feedbackvariables normalise (sdowncase) et compare via member()', () => {
    const q = genStringCore(1, baseParams({ test: 'AlgEquiv', altsArr: ['Chlorophylle'] }), DEPS);
    assert.equal(q.prt.nodes[0].sans, 'is_correct_1');
    assert.match(q.prt.meta.feedbackvariables, /stud_norm_1: sdowncase\(strim\(" ", ans1\)\)\$/);
    assert.match(q.prt.meta.feedbackvariables, /valid_norms_1: \["photosynthese","chlorophylle"\]\$/);
});

test("test='String' (strict) n'applique pas sdowncase à la normalisation", () => {
    const q = genStringCore(1, baseParams({ test: 'String', altsArr: ['Autre'] }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /stud_norm_1: strim\(" ", ans1\)\$/);
});

test('fbc/fbe alimentent le feedback vrai/faux via wrapFb', () => {
    const q = genStringCore(1, baseParams({ fbc: 'Super', fbe: 'Raté' }), DEPS);
    assert.match(q.prt.nodes[0].truefeedback, /Super/);
    assert.match(q.prt.nodes[0].falsefeedback, /Raté/);
});

test('solH est ajouté au feedback faux', () => {
    const q = genStringCore(1, baseParams({ solH: '<p>La solution</p>' }), DEPS);
    assert.match(q.prt.nodes[0].falsefeedback, /La solution/);
});

test("levenOn délègue à genStringLevenshteinCore (7 nœuds de diagnostic)", () => {
    const q = genStringCore(1, baseParams({ levenOn: true }), DEPS);
    assert.equal(q.prt.nodes.length, 7);
    assert.match(q.vars, /levenshtein\(s,t\) := block\(/);
});

test('genStringLevenshteinCore construit la liste des réponses valides (principale + alternatives)', () => {
    const q = genStringLevenshteinCore(1, 1, '<p>t</p>', 'chat', '', 25, '', '', ['chatte', 'le chat'], DEPS);
    assert.match(q.vars, /reponses_valides_1: \[supprimer_articles\(sdowncase\("chat"\)\),supprimer_articles\(sdowncase\("chatte"\)\),supprimer_articles\(sdowncase\("le chat"\)\)\]\$/);
});

test('generalFeedback intègre fbGen via _mkFbGen (sans alternatives)', () => {
    const q = genStringCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('generalFeedback est encadré (applyFbBox "general") quand il y a du contenu — genStringCore et genStringLevenshteinCore', () => {
    // genStringCore (hors levenshtein) : generalFeedback = mkFbGen_D('', fbGen) -- reste vide (donc
    // sans encadré, applyFbBox laisse '' inchangé) si fbGen est vide, encadré dès qu'il y a du contenu.
    const q = genStringCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /border:1px solid/);
    const qLev = genStringLevenshteinCore(1, 1, '<p>t</p>', 'chat', '', 25, '', '', [], DEPS);
    assert.match(qLev.generalFeedback, /border:1px solid/);
});

test('qnote est vide : pas de rand(), pas de variante à documenter (et {@ta@} révélerait la réponse) — genStringCore et genStringLevenshteinCore', () => {
    const q = genStringCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, '');
    const qLev = genStringLevenshteinCore(1, 1, '<p>t</p>', 'chat', '', 25, '', '', [], DEPS);
    assert.equal(qLev.qnote, '');
});

test('le XML (prtXML, inputXML) est bien formé (avec/sans alternatives, avec/sans levenshtein)', () => {
    [
        baseParams(),
        baseParams({ altsArr: ['autre'] }),
        baseParams({ levenOn: true }),
        baseParams({ levenOn: true, altsArr: ['autre'] })
    ].forEach((params, i) => {
        const q = genStringCore(1, params, DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${i}]`);
        assertBalancedTags(q.inputXML, `inputXML[${i}]`);
    });
});
