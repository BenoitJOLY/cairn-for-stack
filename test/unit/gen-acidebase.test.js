// Tests unitaires du cœur pur de gen-acidebase.js (genAcideBaseCore).
//
// Lancer :  npm test
//
// genAcideBaseCore() ne lit jamais document/localStorage : toutes les valeurs
// (y compris les indicateurs colorimétriques cochés) lui sont passées en
// paramètres explicites (voir js/gen-acidebase.js — genAcideBase() est le seul
// point qui touche le DOM, et se contente de construire p avant d'appeler
// genAcideBaseCore()).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genAcideBaseCore } = require(path.join('..', '..', 'js', 'gen-acidebase.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, mkFbGen };

// Jeu de paramètres de référence : acide faible / base forte, monoacide, pKa=4.8.
function baseParams(overrides) {
    return Object.assign({
        abMethod: 'tangentes',
        abType: 'af-bf',
        abFind: 'equivalence',
        nProtons: 1,
        c1: 0.1, v1: 20, c2: 0.1,
        pka: 4.8, pka2: 9.2, pka3: 12.35,
        tolVol: 0.5,
        dispW: 500, dispH: 400, bareme: 1,
        text: '', fbGenExtra: '',
        indKeys: []
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

// ── Grandeurs physiques ──────────────────────────────────────────────────
test('Veq1 = C1*V1/C2 est correct (méthode tangentes)', () => {
    const q = genAcideBaseCore(1, baseParams(), DEPS);
    // Veq1 = 0.1*20/0.1 = 20 mL
    assert.match(q.vars, /ta_veq_1: 20\.0000/);
});

test("Veq2 = 2*Veq1 pour un diacide, mode abFind='veq2'", () => {
    const q = genAcideBaseCore(1, baseParams({ nProtons: 2, abFind: 'veq2' }), DEPS);
    // Veq1 = 20, donc Veq2 = 40
    assert.match(q.vars, /ta_veq_1: 40\.0000/);
});

// ── Méthode colorimétrique : sélection d'indicateur ──────────────────────
test('colorimétrie : liste vide → indicateurs par défaut (hel, bbt, phph)', () => {
    const q = genAcideBaseCore(1, baseParams({ abMethod: 'colorimetrie', indKeys: [] }), DEPS);
    assert.match(q.inputXML, /<name>ans_ind_1<\/name>/);
});

test('colorimétrie : les clés inconnues sont filtrées, ne cassent pas la génération', () => {
    const q = genAcideBaseCore(1, baseParams({ abMethod: 'colorimetrie', indKeys: ['bogus', 'bbt'] }), DEPS);
    assertBalancedTags(q.inputXML, 'inputXML[colorimetrie-filtered]');
});

// ── Structure du PRT ──────────────────────────────────────────────────────
test('colorimétrie : PRT à 5 nœuds (indicateur -> volume -> pénalité essais x3)', () => {
    const q = genAcideBaseCore(1, baseParams({ abMethod: 'colorimetrie' }), DEPS);
    assert.equal(q.prt.nodes.length, 5);
    assert.equal(q.prt.nodes[0].truenextnode, '1');
    assert.equal(q.prt.nodes[1].truenextnode, '2');
});

test('tangentes : PRT à 3 nœuds (parallélisme -> volume, avec repli)', () => {
    const q = genAcideBaseCore(1, baseParams({ abMethod: 'tangentes' }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.equal(q.prt.nodes[0].truenextnode, '1');
    assert.equal(q.prt.nodes[0].falsenextnode, '2', 'repli vers le nœud 2 si les tangentes ne sont pas parallèles');
});

// ── Bien-formation du XML produit ─────────────────────────────────────────
test('le XML du PRT est bien formé pour chaque méthode', () => {
    ['colorimetrie', 'tangentes'].forEach(abMethod => {
        const q = genAcideBaseCore(1, baseParams({ abMethod }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${abMethod}]`);
        assertBalancedTags(q.inputXML, `inputXML[${abMethod}]`);
    });
});

// ── Tolérances : vérifie que le champ de tolérance est bien injecté dans Maxima ──
test('la tolérance de volume personnalisée se retrouve dans feedbackvariables', () => {
    const q = genAcideBaseCore(1, baseParams({ abMethod: 'tangentes', tolVol: 0.25 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /<= ?0\.2500/);
});
