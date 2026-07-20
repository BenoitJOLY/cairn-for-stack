// Tests unitaires du cœur pur de gen-math-statistiques.js (genStatistiquesCore).
//
// Lancer :  npm test
//
// genStatistiquesCore() ne lit jamais document : tout est passé en p (voir
// la fonction genStatistiques(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genStatistiquesCore } = require(path.join('..', '..', 'js', 'gen-math-statistiques.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        scenario: 'moyenne',
        display: 'liste',
        fbOk: '', fbWrong: '',
        custText: '',
        varName: 'x',
        dataDecimals: 1,
        randFormat: 'decimal',
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

test("scenario 'mediane' utilise median() de Maxima, arrondi 0.005", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'mediane' }), DEPS);
    assert.match(q.vars, /q1_ta:float\(median\(q1_L\)\);/);
    assert.equal(q.prt.nodes[0].testoptions, '0.005');
});

test("scenario 'ecart-type' calcule via la formule de variance manuelle", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'ecart-type' }), DEPS);
    assert.match(q.vars, /q1_ta:1\.0\*round\(sqrt\(q1_var\)\*100\)\/100;/);
});

test("scenario 'etendue' calcule max-min", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'etendue' }), DEPS);
    assert.match(q.vars, /q1_ta:1\.0\*round\(\(q1_ta_max-q1_ta_min\)\*100\)\/100;/);
});

test("scenario 'variance' calcule la moyenne des écarts au carré", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'variance' }), DEPS);
    assert.match(q.vars, /q1_ta:1\.00\*round\(float\(sum\(\(q1_L\[i\]-q1_moy\)\^2,i,1,q1_n\)\/q1_n\)\*100\)\/100;/);
});

test("scenario 'quartile-q1' et 'quartile-q3' utilisent des positions n/4 et 3n/4", () => {
    const q1 = genStatistiquesCore(1, baseParams({ scenario: 'quartile-q1' }), DEPS);
    assert.match(q1.vars, /q1_pos:q1_n\/4;/);
    const q3 = genStatistiquesCore(1, baseParams({ scenario: 'quartile-q3' }), DEPS);
    assert.match(q3.vars, /q1_pos:3\*q1_n\/4;/);
});

test("scenario 'moyenne-ponderee' construit un tableau valeur/effectif à 3 lignes", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'moyenne-ponderee' }), DEPS);
    assert.match(q.vars, /q1_ta:1\.0\*round\(float\(q1_S\/q1_N\)\*10\)\/10;/);
    assert.match(q.textFrag, /<table/);
});

test("display='tableau' rend la série en cellules HTML au lieu du LaTeX", () => {
    const qListe = genStatistiquesCore(1, baseParams({ scenario: 'moyenne', display: 'liste' }), DEPS);
    assert.match(qListe.textFrag, /\\\( \{@q1_L@\} \\\)/);
    const qTableau = genStatistiquesCore(1, baseParams({ scenario: 'moyenne', display: 'tableau' }), DEPS);
    assert.match(qTableau.textFrag, /<table style="border-collapse:collapse;margin:8px 0;">/);
});

test('dataDecimals=0 ne génère pas de partie fractionnaire aléatoire', () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'moyenne', dataDecimals: 0 }), DEPS);
    assert.doesNotMatch(q.vars, /\+ri\(0,/);
});

test("randFormat != 'decimal' n'enveloppe pas la série dans float(...)", () => {
    const q = genStatistiquesCore(1, baseParams({ scenario: 'moyenne', randFormat: 'entier' }), DEPS);
    assert.doesNotMatch(q.vars, /q1_L:float\(/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut', () => {
    const q = genStatistiquesCore(1, baseParams({ fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non');
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genStatistiquesCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque scenario', () => {
    ['mediane', 'ecart-type', 'etendue', 'moyenne', 'variance', 'quartile-q1', 'quartile-q3', 'moyenne-ponderee'].forEach(scenario => {
        const q = genStatistiquesCore(1, baseParams({ scenario }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${scenario}]`);
        assertBalancedTags(q.inputXML, `inputXML[${scenario}]`);
    });
});
