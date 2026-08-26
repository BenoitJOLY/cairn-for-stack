// Tests unitaires de js/prt-reachability.js (module pur, aucune dépendance DOM/Maxima).
//
// Lancer :  npm test
//
// findDanglingNodeRefs() est le test de non-régression direct du bug qui a cassé
// l'import Moodle du type "avancement" (voir PLAN.md, 2026-08-01/02) : un nœud PRT
// nommé de façon descriptive (ex. "ninit1") au lieu de son indice séquentiel de
// position, référencé par un autre nœud via cet indice ("1") qui ne correspondait
// alors au <name> d'aucun nœud réel. computePrtReachability()/isPrtFeedbackReachable()
// sont fail-open sur ce cas précis (une référence inconnue est traitée comme un nœud
// jamais visité, donc "atteignable par défaut") — d'où le besoin d'une détection dédiée.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { computePrtReachability, isPrtFeedbackReachable, findDanglingNodeRefs } = require(path.join('..', '..', 'js', 'prt-reachability.js'));

function node(overrides) {
    return Object.assign({
        name: '0', answertest: 'AlgEquiv', sans: 'ans', tans: 'ta',
        truenextnode: '-1', falsenextnode: '-1', truefeedback: '', falsefeedback: ''
    }, overrides);
}

test('findDanglingNodeRefs : aucune référence orpheline sur une chaîne de nœuds correctement nommés', () => {
    const nodes = [
        node({ name: '0', truenextnode: '1', falsenextnode: '1' }),
        node({ name: '1', truenextnode: '2', falsenextnode: '-1' }),
        node({ name: '2' })
    ];
    assert.deepEqual(findDanglingNodeRefs(nodes), []);
});

test('findDanglingNodeRefs : détecte le bug réel du type "avancement" (name descriptif vs indice référencé)', () => {
    // Reproduction exacte du bug corrigé dans js/gen-avancement.js : les <name> valaient
    // 'ninit1'/'nenc1'/'nfin1'/'nxmax1' mais truenextnode/falsenextnode pointaient vers
    // les indices séquentiels '1'/'2'/'3'/'-1' — aucun nœud ne s'appelait '1', '2' ou '3'.
    const nodes = [
        node({ name: 'ninit1', truenextnode: '1', falsenextnode: '1' }),
        node({ name: 'nenc1', truenextnode: '2', falsenextnode: '2' }),
        node({ name: 'nfin1', truenextnode: '3', falsenextnode: '3' }),
        node({ name: 'nxmax1', truenextnode: '-1', falsenextnode: '-1' })
    ];
    const problems = findDanglingNodeRefs(nodes);
    assert.equal(problems.length, 6); // 3 nœuds x 2 branches (true+false) référencent un nom inexistant
    assert.ok(problems.every((p) => ['1', '2', '3'].includes(p.target)));
});

test('findDanglingNodeRefs : "-1" (nœud terminal) n\'est jamais signalé comme orphelin', () => {
    const nodes = [node({ name: '0', truenextnode: '-1', falsenextnode: '-1' })];
    assert.deepEqual(findDanglingNodeRefs(nodes), []);
});

test('findDanglingNodeRefs : tableau vide/absent renvoie []', () => {
    assert.deepEqual(findDanglingNodeRefs([]), []);
    assert.deepEqual(findDanglingNodeRefs(null), []);
});

test('computePrtReachability : une branche déjà testée par un ancêtre identique devient inatteignable', () => {
    const nodes = [
        node({ name: '0', answertest: 'AlgEquiv', sans: 'a', tans: 'b', truenextnode: '1', falsenextnode: '-1' }),
        // même triplet (answertest, sans, tans) que le nœud 0, atteint uniquement via la
        // branche VRAIE du nœud 0 -> le même test y sera forcément vrai aussi (déterministe),
        // donc sa branche FAUSSE est morte (jamais déclenchable).
        node({ name: '1', answertest: 'AlgEquiv', sans: 'a', tans: 'b', truenextnode: '-1', falsenextnode: '-1' })
    ];
    const reach = computePrtReachability(nodes);
    assert.equal(isPrtFeedbackReachable(reach, '1', 'true'), true);
    assert.equal(isPrtFeedbackReachable(reach, '1', 'false'), false);
});

test('isPrtFeedbackReachable : fail-open sur un nœud absent de la reachMap', () => {
    assert.equal(isPrtFeedbackReachable({}, 'inconnu', 'true'), true);
});
