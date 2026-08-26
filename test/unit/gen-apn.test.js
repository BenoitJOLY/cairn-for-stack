// Tests unitaires du cœur pur de gen-apn.js (genApnCore).
//
// Lancer :  npm test
//
// genApnCore() ne lit jamais document : tout est passé en p (voir la
// fonction genApn(X), seul point de contact avec le DOM).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genApnCore } = require(path.join('..', '..', 'js', 'gen-apn.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '',
        fbOk: '', fbWrong: '',
        unknown: 'V',
        changed: { D: true, V: false, I: false },
        nChanged: 1,
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

test("unknown='V' cible q1_V2 et tire D2 (paramètre modifié)", () => {
    const q = genApnCore(1, baseParams({ unknown: 'V', changed: { D: true, V: false, I: false }, nChanged: 1 }), DEPS);
    assert.match(q.vars, /q1_cible: q1_V2;/);
    assert.match(q.vars, /q1_idxD2: rand\(delete\(q1_idxD1,/);
});

test("unknown='D' compare en tans via string() (bouton radio)", () => {
    const q = genApnCore(1, baseParams({ unknown: 'D', changed: { D: false, V: true, I: false }, nChanged: 1 }), DEPS);
    assert.match(q.vars, /q1_cible: q1_D2a;/);
    assert.equal(q.prt.nodes[0].tans, 'string(q1_cible)');
});

test("unknown='I' cible q1_I2", () => {
    const q = genApnCore(1, baseParams({ unknown: 'I', changed: { D: false, V: true, I: false }, nChanged: 1 }), DEPS);
    assert.match(q.vars, /q1_cible: q1_I2;/);
});

test('nChanged=1 : 3 nœuds (correct, valeur non recalculée, sens inversé = terminal), pas de wig1/wig2', () => {
    const q = genApnCore(1, baseParams({ nChanged: 1 }), DEPS);
    assert.equal(q.prt.nodes.length, 3);
    assert.doesNotMatch(q.vars, /q1_wig1/);
});

test('nChanged=2 : 5 nœuds (2 nœuds "paramètre ignoré" supplémentaires, le dernier terminal)', () => {
    const q = genApnCore(1, baseParams({ unknown: 'V', changed: { D: true, V: false, I: true }, nChanged: 2 }), DEPS);
    assert.equal(q.prt.nodes.length, 5);
    assert.match(q.vars, /q1_wig1:/);
    assert.match(q.vars, /q1_wig2:/);
});

test('fbOk/fbWrong personnalisés remplacent le feedback par défaut du nœud correct / le falsefeedback terminal', () => {
    const q = genApnCore(1, baseParams({ fbOk: 'Bravo', fbWrong: 'Non' }), DEPS);
    assert.equal(q.prt.nodes[0].truefeedback, 'Bravo');
    assert.equal(q.prt.nodes[q.prt.nodes.length - 1].falsefeedback, 'Non');
});

test('le dernier nœud est bien le nœud terminal (falsenextnode=-1) avec falsefeedback non vide', () => {
    const q = genApnCore(1, baseParams({ nChanged: 1 }), DEPS);
    const last = q.prt.nodes[q.prt.nodes.length - 1];
    assert.equal(last.falsenextnode, '-1');
    assert.notEqual(last.falsefeedback, '');
});

test('le nœud correct porte le barème complet, les autres 0', () => {
    const q = genApnCore(1, baseParams({ bareme: 2 }), DEPS);
    assert.equal(q.prt.nodes[0].truescore, '2');
    assert.equal(q.prt.nodes[1].truescore, '0');
});

test('diagNodes expose les nœuds de diagnostic intermédiaires (hors correct et fallback)', () => {
    const q = genApnCore(1, baseParams({ nChanged: 1 }), DEPS);
    assert.equal(q.diagNodes.length, 2);
});

test('generalFeedback intègre fbGen via _mkFbGen', () => {
    const q = genApnCore(1, baseParams({ fbGen: 'Remarque' }), DEPS);
    assert.match(q.generalFeedback, /Remarque/);
});

test('les encadrés colorés ne sont jamais dans le contenu brut édité (prt.nodes/diagNodes), seulement dans prtXML/generalFeedback', () => {
    const q = genApnCore(1, baseParams({ nChanged: 2 }), DEPS);
    q.prt.nodes.forEach(n => {
        assert.doesNotMatch(n.truefeedback, /border-left/);
        assert.doesNotMatch(n.falsefeedback, /border-left/);
    });
    q.diagNodes.forEach(d => assert.doesNotMatch(d.fb, /border-left/));
    assert.match(q.prtXML, /border-left/);
    assert.match(q.generalFeedback, /border:1px solid/);
});

test('qnote résume inconnue et paramètres modifiés', () => {
    const q = genApnCore(1, baseParams({ unknown: 'V', changed: { D: true, V: false, I: false } }), DEPS);
    assert.match(q.qnote, /inconnue=V/);
    assert.match(q.qnote, /modifie\(s\)=D/);
});

test('le XML (prtXML, inputXML) est bien formé pour chaque combinaison inconnue/nChanged', () => {
    ['V', 'D', 'I'].forEach(unknown => {
        [1, 2].forEach(nChanged => {
            const changed = { D: unknown !== 'D', V: unknown !== 'V' && nChanged === 2, I: unknown !== 'I' };
            if (unknown !== 'D' && unknown !== 'V') changed.V = nChanged === 2 || unknown !== 'V';
            const q = genApnCore(1, baseParams({ unknown, changed, nChanged }), DEPS);
            assertBalancedTags(q.prtXML, `prtXML[${unknown}/${nChanged}]`);
            assertBalancedTags(q.inputXML, `inputXML[${unknown}/${nChanged}]`);
        });
    });
});
