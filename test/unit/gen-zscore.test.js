// Tests unitaires du cœur pur de gen-zscore.js (genZscoreCore).
//
// Lancer :  npm test
//
// genZscoreCore() ne lit jamais document : tout est passé en p (voir
// genZscore(X), seul point de contact avec le DOM). Comme gen-incertitude.js,
// le helper Maxima pur (js/gen-zscore-calc.js) est appelé en GLOBAL BARE
// (pas de deps._zsVars || _zsVars only — voir commentaire dans gen-zscore.js)
// car en navigateur tous les <script> partagent le même scope window. En
// Node, chaque require() a son propre scope de module : on republie donc
// ces fonctions sur `global` avant d'appeler genZscoreCore, exactement
// comme test/unit/gen-incertitude.test.js le fait.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genZscoreCore, ZS_STEP_ORDER } = require(path.join('..', '..', 'js', 'gen-zscore.js'));
const { _zsVars } = require(path.join('..', '..', 'js', 'gen-zscore-calc.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global._zsVars = _zsVars;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 4,
        context: { grandeur: 'Masse volumique', symbole: '\\rho', unite: 'g/cm^3', intro: '' },
        grandeurs: { xMes: '10.5', xRef: '10', uc: '0.3' },
        seuil: '2',
        steps: { z: true, conclusion: true },
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

// ── Helper Maxima pur (_zsVars) : validation ────────────────────────────
test("_zsVars : émet q1_xmes/q1_xref/q1_uc/q1_z à partir de littéraux fixes", () => {
    const q = genZscoreCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_xmes:float\(10\.5\);/);
    assert.match(q.vars, /q1_xref:float\(10\);/);
    assert.match(q.vars, /q1_uc:float\(0\.3\);/);
    assert.match(q.vars, /q1_z:float\(abs\(q1_xmes-q1_xref\)\/q1_uc\);/);
});

test("_zsVars : x_mesuré manquant lève une erreur", () => {
    assert.throws(() => genZscoreCore(1, baseParams({ grandeurs: { xMes: '', xRef: '10', uc: '0.3' } }), DEPS), /x_mesuré est obligatoire/);
});

test("_zsVars : x_référence manquant lève une erreur", () => {
    assert.throws(() => genZscoreCore(1, baseParams({ grandeurs: { xMes: '10.5', xRef: '', uc: '0.3' } }), DEPS), /x_référence est obligatoire/);
});

test("_zsVars : u_c manquant ou non positif lève une erreur", () => {
    assert.throws(() => genZscoreCore(1, baseParams({ grandeurs: { xMes: '10.5', xRef: '10', uc: '' } }), DEPS), /incertitude combinée u_c est obligatoire/);
    assert.throws(() => genZscoreCore(1, baseParams({ grandeurs: { xMes: '10.5', xRef: '10', uc: '0' } }), DEPS), /incertitude combinée u_c est obligatoire/);
    assert.throws(() => genZscoreCore(1, baseParams({ grandeurs: { xMes: '10.5', xRef: '10', uc: '-1' } }), DEPS), /incertitude combinée u_c est obligatoire/);
});

// ── Étapes cochables : isolation + comptage ─────────────────────────────
test("chaque étape cochée isolément produit exactement 1 <prt> et hérite du barème complet", () => {
    ZS_STEP_ORDER.forEach((key) => {
        const steps = {};
        ZS_STEP_ORDER.forEach((k) => { steps[k] = (k === key); });
        const q = genZscoreCore(1, baseParams({ steps }), DEPS);
        const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
        assert.equal(prtCount, 1, `étape '${key}' : attendu 1 <prt>, obtenu ${prtCount}`);
        assert.equal(q.prts.length, 1);
        assert.equal(q.prts[0].meta.value, (4).toFixed(7), `étape '${key}' seule doit recevoir tout le barème`);
        assertBalancedTags(q.prtXML, `prtXML (${key})`);
        assertBalancedTags(q.inputXML, `inputXML (${key})`);
    });
});

test("les 2 étapes cochées → 2 blocs <prt> distincts, barème réparti également", () => {
    const q = genZscoreCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
    const expectedShare = (4 / 2).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
    assert.match(q.feedbackRef, /\[\[feedback:prt1_z\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1_ccl\]\]/);
});

test("aucune étape cochée lève une erreur explicite", () => {
    const steps = { z: false, conclusion: false };
    assert.throws(() => genZscoreCore(1, baseParams({ steps }), DEPS), /err_no_step/);
});

// ── Étape 'z' : PRT NumRelative sur q1_z ─────────────────────────────────
test("étape 'z' : PRT NumRelative, sans/tans corrects, tolérance 0.01", () => {
    const q = genZscoreCore(1, baseParams({ steps: { z: true, conclusion: false } }), DEPS);
    assert.match(q.prtXML, /<answertest>NumRelative<\/answertest>/);
    assert.match(q.prtXML, /<sans>ans_z1<\/sans>/);
    assert.match(q.prtXML, /<tans>q1_z<\/tans>/);
    assert.match(q.prtXML, /<testoptions>0\.01<\/testoptions>/);
    assert.match(q.inputXML, /ans_z1/);
});

// ── Étape 'conclusion' : dropdown String + seuil configurable ──────────
test("z < seuil → conclusion 'compatible' avec tans/CDATA cohérents", () => {
    // z = |10.5-10|/0.3 = 1.667, seuil=2 -> compatible
    const q = genZscoreCore(1, baseParams({ steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q.prtXML, /<answertest>String<\/answertest>/);
    assert.match(q.prtXML, /<tans>"compatible"<\/tans>/);
    assert.match(q.inputXML, /\["compatible", true,/);
    assert.match(q.inputXML, /\["incompatible", false,/);
});

test("z >= seuil (seuil abaissé) → conclusion 'incompatible'", () => {
    // z = 1.667, seuil=1 -> incompatible
    const q = genZscoreCore(1, baseParams({ seuil: '1', steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q.prtXML, /<tans>"incompatible"<\/tans>/);
    assert.match(q.inputXML, /\["compatible", false,/);
    assert.match(q.inputXML, /\["incompatible", true,/);
});

test("seuil personnalisé se répercute dans le libellé de conclusion et le feedback d'erreur", () => {
    const q = genZscoreCore(1, baseParams({ seuil: '3', steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q.textFrag, /zs\.conclusion_label/);
    assert.match(q.textFrag, /"seuil":3/);
});

test("seuil absent ou invalide retombe sur la valeur par défaut 2", () => {
    const q1 = genZscoreCore(1, baseParams({ seuil: '', steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q1.prtXML, /<tans>"compatible"<\/tans>/); // z=1.667 < 2 (défaut)
    const q2 = genZscoreCore(1, baseParams({ seuil: 'abc', steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q2.prtXML, /<tans>"compatible"<\/tans>/);
    const q3 = genZscoreCore(1, baseParams({ seuil: '-5', steps: { z: false, conclusion: true } }), DEPS);
    assert.match(q3.prtXML, /<tans>"compatible"<\/tans>/);
});

// ── Affichage des valeurs données (auto) ─────────────────────────────────
test("givensHtml affiche automatiquement x_mesuré, x_référence et u_c", () => {
    const q = genZscoreCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /q1_xmes@/);
    assert.match(q.textFrag, /q1_xref@/);
    assert.match(q.textFrag, /q1_uc@/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet (les 2 étapes cochées) reste bien formé", () => {
    const q = genZscoreCore(1, baseParams(), DEPS);
    assert.equal((q.prtXML.match(/<prt>/g) || []).length, ZS_STEP_ORDER.length);
    assertBalancedTags(q.prtXML, 'prtXML (toutes étapes)');
    assertBalancedTags(q.inputXML, 'inputXML (toutes étapes)');
    assertBalancedTags(q.textFrag, 'textFrag (toutes étapes)');
});

test("qnote expose z={@q1_z@}", () => {
    const q = genZscoreCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'z={@q1_z@}');
});

test("feedback général : pas d'icône 🔑 doublée quand trig.correction_title la porte déjà", () => {
    const I18N_REAL_TITLE = { t: (key, vars) => key === 'trig.correction_title' ? '🔑 Correction' : (vars ? key + ':' + JSON.stringify(vars) : key) };
    const q = genZscoreCore(1, baseParams(), Object.assign({}, DEPS, { I18N: I18N_REAL_TITLE }));
    assert.equal((q.generalFeedback.match(/🔑/g) || []).length, 1);
});
