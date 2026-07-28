// Tests unitaires des fonctions pures de js/maxima-client.js (aucun accès réseau
// ni DOM) : buildStandaloneQuestionXML (gabarit d'une question STACK autonome
// pour l'aperçu réel, voir js/preview-checkbox.js) et insertDeployedSeeds.
//
// Lancer :  npm test

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildStandaloneQuestionXML, insertDeployedSeeds } = require(path.join('..', '..', 'js', 'maxima-client.js'));

function baseParts(overrides) {
    return Object.assign({
        bareme: 1,
        text: 'Cochez les bonnes réponses.',
        vars: 'ta1_all:[["1",true,"A"]];',
        textFrag: '<p>Cochez.</p>\n<p>[[input:ans1]] [[validation:ans1]]</p>',
        generalFeedback: '<p>Bonnes réponses.</p>',
        inputXML: '    <input>\n      <name>ans1</name>\n      <type>checkbox</type>\n    </input>',
        prtXML: '    <prt>\n      <name>prt1</name>\n    </prt>'
    }, overrides || {});
}

function assertBalancedTags(xml, label) {
    const stripped = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
    const stack = [];
    const re = /<\/?([a-zA-Z][\w-]*)[^>]*?(\/?)>/g;
    let m;
    while ((m = re.exec(stripped))) {
        const [full, tag, selfClosing] = m;
        if (selfClosing || full.startsWith('<?')) continue;
        if (full[1] === '/') {
            const top = stack.pop();
            assert.equal(top, tag, `${label} : fermeture inattendue </${tag}> (attendu </${top}>)`);
        } else {
            stack.push(tag);
        }
    }
    assert.equal(stack.length, 0, `${label} : balises non fermées : ${stack.join(', ')}`);
}

test('buildStandaloneQuestionXML : XML bien formé et enveloppe <quiz><question type="stack">', () => {
    const xml = buildStandaloneQuestionXML(baseParts());
    assertBalancedTags(xml, 'buildStandaloneQuestionXML');
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<quiz>[\s\S]*<question type="stack">/);
    assert.match(xml, /<\/question>\s*<\/quiz>$/);
});

test('buildStandaloneQuestionXML : reprend telles quelles vars/textFrag/generalFeedback/inputXML/prtXML/bareme', () => {
    const parts = baseParts({ bareme: 2.5 });
    const xml = buildStandaloneQuestionXML(parts);
    assert.ok(xml.includes(parts.vars));
    assert.ok(xml.includes(parts.textFrag));
    assert.ok(xml.includes(parts.generalFeedback));
    assert.ok(xml.includes(parts.inputXML));
    assert.ok(xml.includes(parts.prtXML));
    assert.match(xml, /<defaultgrade>2\.5<\/defaultgrade>/);
});

test('buildStandaloneQuestionXML : valeurs STACK par défaut correctes (decimals, complexno, isbroken...)', () => {
    const xml = buildStandaloneQuestionXML(baseParts());
    assert.match(xml, /<decimals>\.<\/decimals>/);
    assert.match(xml, /<complexno>i<\/complexno>/);
    assert.match(xml, /<isbroken>0<\/isbroken>/);
    assert.match(xml, /<questionsimplify>1<\/questionsimplify>/);
});

test('buildStandaloneQuestionXML : aucun tag ni signature stackforge (aperçu jetable, jamais exporté)', () => {
    const xml = buildStandaloneQuestionXML(baseParts());
    assert.ok(!xml.includes('<tags>'));
    assert.ok(!/stackforge/i.test(xml));
});

test('insertDeployedSeeds : insère un <deployedseed> juste après le dernier </prt>', () => {
    const xml = buildStandaloneQuestionXML(baseParts());
    const withSeed = insertDeployedSeeds(xml, [42]);
    assertBalancedTags(withSeed, 'insertDeployedSeeds');
    assert.match(withSeed, /<\/prt>\s*<deployedseed>42<\/deployedseed>/);
});

test('insertDeployedSeeds : seeds vide/absent renvoie le XML inchangé', () => {
    const xml = buildStandaloneQuestionXML(baseParts());
    assert.equal(insertDeployedSeeds(xml, []), xml);
    assert.equal(insertDeployedSeeds(xml, undefined), xml);
});
