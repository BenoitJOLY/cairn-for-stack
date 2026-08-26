// Garde-fou anti-troncature pour js/circuit-atelier.js.
//
// La logique d'isomorphisme de graphe (canonicalFromGraph, contractGraph,
// gradingNets…) est un port direct, non modifié, du XML de référence déjà
// validé manuellement (voir le plan de refonte circuit) — on ne la retexte
// pas ici algorithmiquement (il faudrait un vrai board JSXGraph). Ce test
// vérifie seulement que CIR_ENGINE_JS est complet et syntaxiquement cohérent :
// non vide, accolades/parenthèses équilibrées, fonctions clés présentes.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { cirEngineRun, CIR_ENGINE_JS } = require(path.join('..', '..', 'js', 'circuit-atelier.js'));

test('CIR_ENGINE_JS est non vide et cirEngineRun est bien une fonction', () => {
    assert.equal(typeof cirEngineRun, 'function');
    assert.equal(typeof CIR_ENGINE_JS, 'string');
    assert.ok(CIR_ENGINE_JS.length > 1000, 'CIR_ENGINE_JS semble tronqué (trop court)');
});

test('CIR_ENGINE_JS a des accolades et parenthèses équilibrées', () => {
    let braceDepth = 0, minBraceDepth = 0;
    let parenDepth = 0, minParenDepth = 0;
    for (const ch of CIR_ENGINE_JS) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        if (braceDepth < minBraceDepth) minBraceDepth = braceDepth;

        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        if (parenDepth < minParenDepth) minParenDepth = parenDepth;
    }
    assert.equal(braceDepth, 0, 'accolades non équilibrées (dépassement en fin de source)');
    assert.equal(minBraceDepth, 0, 'accolade fermante sans ouverture correspondante détectée');
    assert.equal(parenDepth, 0, 'parenthèses non équilibrées (dépassement en fin de source)');
    assert.equal(minParenDepth, 0, 'parenthèse fermante sans ouverture correspondante détectée');
});

test('CIR_ENGINE_JS contient les fonctions clés du moteur de correction par isomorphisme', () => {
    const expectedFns = [
        'canonicalFromGraph',
        'contractGraph',
        'gradingNets',
        'serializeState',
        'restoreState',
        'componentsSignature',
        'valuesSignature'
    ];
    expectedFns.forEach((fn) => {
        assert.ok(
            CIR_ENGINE_JS.includes('function ' + fn) || new RegExp('\\b' + fn + '\\s*[=(]').test(CIR_ENGINE_JS),
            `fonction attendue absente de CIR_ENGINE_JS : ${fn}`
        );
    });
});

test('cirEngineRun.toString() correspond exactement à CIR_ENGINE_JS (source de vérité unique)', () => {
    assert.equal(cirEngineRun.toString(), CIR_ENGINE_JS);
});
