// Tests unitaires du balayage de migration des feedbacks PRT (migratePrtFeedbackStyle /
// migrateAllPrtFeedbackStyle) et des fonctions pures fb-box.js dont il dépend.
//
// Lancer :  npm test
//
// parsePrtXml() dépend de DOMParser (global navigateur, absent de Node) : on l'injecte
// via deps.parsePrtXml (cf. js/prt-manager.js, convention deps.x || x) plutôt que de
// router à travers du vrai XML — migratePrtFeedbackStyle est donc testé sur sa propre
// logique (désenveloppement + réenveloppement), pas sur parsePrtXml elle-même.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildPrtXml, migratePrtFeedbackStyle, migrateAllPrtFeedbackStyle } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox, unwrapFbBox, inferFbKind } = require(path.join('..', '..', 'js', 'fb-box.js'));

const DEPS = { applyFbBox, unwrapFbBox, inferFbKind, buildPrtXml };

function legacyWrap(kind, html) {
    var tpl = { vrai: { bg: '#f0fdf4', bd: '#86efac', pfx: '✅ ' },
        faux: { bg: '#F9B3A9', bd: '#e2e8f0', pfx: '❌ ' },
        partiel: { bg: '#F9F2BB', bd: '#EDB465', pfx: '🔶 ' } }[kind];
    return '<div style="padding:12px;background:' + tpl.bg + ';border-radius:8px;border:1px solid ' + tpl.bd + '">' + tpl.pfx + html + '</div>';
}

function baseMeta() {
    return { name: 'PRT-X', value: '1', autosimplify: '1', feedbackstyle: '2', feedbackvariables: '' };
}

function fixtureNodes() {
    return [
        {
            name: '0', description: '', answertest: 'AlgEquiv', sans: 'ans1', tans: 'q_ta',
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'OK', truefeedback: legacyWrap('vrai', 'Bravo !'),
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '1',
            falseanswernote: 'NOK', falsefeedback: 'Non, réessayez.'
        },
        {
            name: '1', description: '', answertest: 'AlgEquiv', sans: 'ans1', tans: 'q_ta_partial',
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '0.5', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PARTIAL', truefeedback: legacyWrap('partiel', 'Presque !'),
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'NOK2', falsefeedback: legacyWrap('faux', 'Faux.')
        }
    ];
}

function depsWithParser(nodes) {
    return Object.assign({}, DEPS, {
        parsePrtXml: function () { return { meta: baseMeta(), nodes: nodes }; }
    });
}

test('migratePrtFeedbackStyle : désenveloppe le style legacy en texte pur dans q.prt.nodes', () => {
    var q = { prtXML: 'SENTINEL' };
    var ok = migratePrtFeedbackStyle(q, depsWithParser(fixtureNodes()));
    assert.equal(ok, true);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo !');
    assert.equal(q.prt.nodes[0].falsefeedback, 'Non, réessayez.');
    assert.equal(q.prt.nodes[1].truefeedback, 'Presque !');
    assert.equal(q.prt.nodes[1].falsefeedback, 'Faux.');
    // Aucun encadré <div style=...> ne doit subsister dans le stockage brut.
    q.prt.nodes.forEach(function (n) {
        assert.ok(!/<div style=/.test(n.truefeedback));
        assert.ok(!/<div style=/.test(n.falsefeedback));
    });
});

test('migratePrtFeedbackStyle : reconstruit q.prtXML avec le style fb-box.js courant (pas l\'ancien)', () => {
    var q = { prtXML: 'SENTINEL' };
    migratePrtFeedbackStyle(q, depsWithParser(fixtureNodes()));
    // Encadré courant fb-box.js : icônes + couleurs définies dans FB_BOX_DEFAULTS.
    assert.ok(q.prtXML.includes('✅ Bravo !'), 'true (score=1) -> icône ✅');
    assert.ok(q.prtXML.includes('🔶 Presque !'), 'true (score=0.5) -> icône 🔶 partiel');
    assert.ok(q.prtXML.includes('❌ Non, réessayez.'), 'false -> icône ❌');
    assert.ok(q.prtXML.includes('❌ Faux.'), 'false -> icône ❌');
    // L'ancien encadré (padding:12px;background:...) ne doit plus apparaître dans l'export.
    assert.ok(!q.prtXML.includes('padding:12px;background:#f0fdf4'));
    assert.ok(!q.prtXML.includes('padding:12px;background:#F9B3A9'));
    assert.ok(!q.prtXML.includes('padding:12px;background:#F9F2BB'));
});

test('migratePrtFeedbackStyle : idempotent — un deuxième passage ne change plus rien', () => {
    var q = { prtXML: 'SENTINEL' };
    migratePrtFeedbackStyle(q, depsWithParser(fixtureNodes()));
    var afterFirst = JSON.stringify(q.prt.nodes);
    var xmlAfterFirst = q.prtXML;

    // Le deuxième passage relit q.prt.nodes (déjà pur) via le fake parsePrtXml.
    var ok2 = migratePrtFeedbackStyle(q, depsWithParser(q.prt.nodes));
    assert.equal(ok2, true);
    assert.equal(JSON.stringify(q.prt.nodes), afterFirst);
    assert.equal(q.prtXML, xmlAfterFirst);
});

test('migratePrtFeedbackStyle : un nœud déjà en texte pur reste inchangé', () => {
    var pure = [{
        name: '0', description: '', answertest: 'AlgEquiv', sans: 'ans1', tans: 'q_ta',
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
        trueanswernote: 'OK', truefeedback: 'Texte simple sans encadré.',
        falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
        falseanswernote: 'NOK', falsefeedback: '<em>Déjà en HTML simple</em>'
    }];
    var q = { prtXML: 'SENTINEL' };
    migratePrtFeedbackStyle(q, depsWithParser(pure));
    assert.equal(q.prt.nodes[0].truefeedback, 'Texte simple sans encadré.');
    assert.equal(q.prt.nodes[0].falsefeedback, '<em>Déjà en HTML simple</em>');
});

test('migratePrtFeedbackStyle : renvoie false et ne touche rien si q.prtXML est absent', () => {
    var q = { foo: 'bar' };
    var ok = migratePrtFeedbackStyle(q, DEPS);
    assert.equal(ok, false);
    assert.equal(q.prt, undefined);
});

test('migrateAllPrtFeedbackStyle : balaie toutes les questions d\'une map', () => {
    var questions = {
        q1: { prtXML: 'SENTINEL' },
        q2: { prtXML: 'SENTINEL' },
        q3: { text: 'pas de PRT' } // pas de prtXML -> ignorée sans erreur
    };
    migrateAllPrtFeedbackStyle(questions, depsWithParser(fixtureNodes()));
    assert.equal(questions.q1.prt.nodes[0].truefeedback, 'Bravo !');
    assert.equal(questions.q2.prt.nodes[0].truefeedback, 'Bravo !');
    assert.equal(questions.q3.prt, undefined);
});

test('unwrapFbBox : reconnaît l\'encadré fb-box.js courant (true/partial/false/general)', () => {
    assert.equal(unwrapFbBox(applyFbBox('true', 'ok')), 'ok');
    assert.equal(unwrapFbBox(applyFbBox('partial', 'moyen')), 'moyen');
    assert.equal(unwrapFbBox(applyFbBox('false', 'faux')), 'faux');
    assert.equal(unwrapFbBox(applyFbBox('general', 'general')), 'general');
});

test('unwrapFbBox : laisse inchangé un HTML sans encadré connu (fail-safe)', () => {
    assert.equal(unwrapFbBox('<p>simple</p>'), '<p>simple</p>');
    assert.equal(unwrapFbBox(''), '');
    assert.equal(unwrapFbBox(null), null);
});

test('inferFbKind : dérive le type à partir du score du nœud', () => {
    var mk = function (mode, score) { return { truescoremode: mode, truescore: score }; };
    assert.equal(inferFbKind(mk('=', '1'), 'true'), 'true');
    assert.equal(inferFbKind(mk('=', '0.5'), 'true'), 'partial');
    assert.equal(inferFbKind(mk('=', '0'), 'true'), 'false');
    assert.equal(inferFbKind(mk('+', '1'), 'true'), 'true'); // mode relatif -> fallback 'true'
    assert.equal(inferFbKind(mk('=', '1'), 'false'), 'false'); // branche fausse -> toujours 'false'
});
