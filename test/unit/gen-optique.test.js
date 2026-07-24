// Tests unitaires des cœurs purs de gen-optique.js.
//
// Lancer :  npm test
//
// Chaque *Core ne lit jamais document : tout est passé en p (voir les
// wrappers genRvbCmj(X), genOptique(X), _genOptiqueLentilleImage(X), etc.,
// seuls points de contact avec le DOM).
//
// Cas particulier : genOptiqueCore(X, p, deps) est un simple routeur qui
// délègue directement aux *Core purs (pas de wrapper DOM) selon p.scenario
// — voir la note dans js/gen-optique.js. Chaque branche de dispatch est
// donc testable unitairement, en plus de la branche d'erreur (scenario
// inconnu).
//
// Cas particulier bis : _genOptiqueMiroirCore(X, convexe) est le nom
// HISTORIQUE de la fonction partagée concave/convexe (sans rapport avec la
// convention *Core de ce chantier). Le cœur pur nouvellement extrait est
// donc nommé _genOptiqueMiroirCoreImpl pour éviter toute collision.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
    genRvbCmjCore,
    genOptiqueCore,
    _genOptiqueLentilleImageCore,
    _genOptiqueLentilleRayonsCore,
    _genOptiqueLentilleDivergenteCore,
    _genOptiqueMiroirCoreImpl,
    _genOptiqueLunetteConstructionCore,
    _genOptiqueMiroirPlanCore,
    _genOptiqueMiroirSpheriqueCore,
    _genOptiqueTelescopeConstructionCore,
    _genOptiqueMicroscopeConstructionCore
} = require(path.join('..', '..', 'js', 'gen-optique.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
}
const wrapFb = (html, ok) => `<div class="${ok ? 'ok' : 'ko'}">${html || '&nbsp;'}</div>`;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkFbGen, wrapFb };

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

// ── genRvbCmjCore ────────────────────────────────────────────────────────

const TINY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function rvbParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Identifiez la couleur.</p>',
        imgData: TINY_PNG_DATA_URL, mode: 'rvb', nb: false, answer: 1,
        fbOkTxt: '', fbWrTxt: '', fbGenRaw: ''
    }, overrides || {});
}

test('genRvbCmjCore : lève une erreur si imgData est absent', () => {
    assert.throws(() => genRvbCmjCore(1, rvbParams({ imgData: '' }), DEPS), /rvb\.err_img/);
});

test('genRvbCmjCore : lève une erreur si answer est absent/0', () => {
    assert.throws(() => genRvbCmjCore(1, rvbParams({ answer: 0 }), DEPS), /rvb\.err_answer/);
});

test('genRvbCmjCore : answer=1 (Rouge) donne ta_1="rouge" dans vars', () => {
    const q = genRvbCmjCore(1, rvbParams({ answer: 1 }), DEPS);
    assert.match(q.vars, /ta_1: "rouge"\$/);
});

test('genRvbCmjCore : mode cmj utilise les libellés Cyan/Magenta/Jaune (I18N injecté)', () => {
    const q = genRvbCmjCore(1, rvbParams({ mode: 'cmj' }), DEPS);
    assert.match(q.qnote, /rvb\.title_cmj/);
});

test('genRvbCmjCore : bareme personnalisé propagé à la sortie', () => {
    const q = genRvbCmjCore(1, rvbParams({ bareme: 3 }), DEPS);
    assert.equal(q.bareme, 3);
});

test('genRvbCmjCore : generalFeedback intègre fbGenRaw via _mkFbGen', () => {
    const q = genRvbCmjCore(1, rvbParams({ fbGenRaw: 'Remarque RVB' }), DEPS);
    assert.match(q.generalFeedback, /Remarque RVB/);
});

test('genRvbCmjCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = genRvbCmjCore(1, rvbParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (rvb)');
    assertBalancedTags(q.inputXML, 'inputXML (rvb)');
});

// ── genOptiqueCore (routeur) ─────────────────────────────────────────────

test('genOptiqueCore : scenario inconnu lève une erreur via I18N injecté', () => {
    assert.throws(
        () => genOptiqueCore(1, { scenario: 'scenario-inexistant' }, DEPS),
        /msg\.optique_err_scenario/
    );
    try {
        genOptiqueCore(1, { scenario: 'scenario-inexistant' }, DEPS);
        assert.fail('devrait avoir levé');
    } catch (e) {
        assert.match(e.message, /scenario-inexistant$/);
    }
});

test('genOptiqueCore : dispatch lentille-convergente vers _genOptiqueLentilleRayonsCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'lentille-convergente' }, lentilleRayonsParams()), DEPS);
    assert.match(q.qnote, /Optique-/);
});

test('genOptiqueCore : dispatch lentille-divergente vers _genOptiqueLentilleDivergenteCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'lentille-divergente' }, lentilleDivergenteParams()), DEPS);
    assert.match(q.qnote, /Optique-Divergente/);
});

test('genOptiqueCore : dispatch miroir-concave vers _genOptiqueMiroirCoreImpl (convexe=false)', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'miroir-concave' }, miroirParams({ convexe: false })), DEPS);
    assert.match(q.qnote, /Optique-MiroirConcave/);
});

test('genOptiqueCore : dispatch miroir-convexe vers _genOptiqueMiroirCoreImpl (convexe=true)', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'miroir-convexe' }, miroirParams({ convexe: true, SA: 3 })), DEPS);
    assert.match(q.qnote, /Optique-MiroirConvexe/);
});

test('genOptiqueCore : dispatch miroir-plan vers _genOptiqueMiroirPlanCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'miroir-plan' }, miroirPlanParams()), DEPS);
    assert.match(q.qnote, /Optique-MiroirPlan/);
});

test('genOptiqueCore : dispatch lunette-galilee vers _genOptiqueLunetteConstructionCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'lunette-galilee' }, lunetteParams()), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (dispatch lunette)');
});

test('genOptiqueCore : dispatch telescope-newton vers _genOptiqueTelescopeConstructionCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'telescope-newton' }, telescopeParams()), DEPS);
    assert.match(q.qnote, /Optique-Telescope/);
});

test('genOptiqueCore : dispatch microscope vers _genOptiqueMicroscopeConstructionCore', () => {
    const q = genOptiqueCore(1, Object.assign({ scenario: 'microscope' }, microscopeParams()), DEPS);
    assert.match(q.qnote, /Optique-Microscope/);
});

// ── _genOptiqueLentilleImageCore ─────────────────────────────────────────

function lentilleImageParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Placez B\'.</p>',
        f: 20, OA: -30, AB: 2, tolPos: 2, tolH: 1,
        dispW: 600, dispH: 350, fbOkTxt: '', fbWrTxt: '', fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueLentilleImageCore : f <= 0 lève opt.err_f_positive', () => {
    assert.throws(() => _genOptiqueLentilleImageCore(1, lentilleImageParams({ f: 0 }), DEPS), /opt\.err_f_positive/);
});

test('_genOptiqueLentilleImageCore : OA >= 0 lève opt.err_oa_negative', () => {
    assert.throws(() => _genOptiqueLentilleImageCore(1, lentilleImageParams({ OA: 5 }), DEPS), /opt\.err_oa_negative/);
});

test('_genOptiqueLentilleImageCore : OA = -f lève opt.err_oa_eq_f_s1', () => {
    assert.throws(() => _genOptiqueLentilleImageCore(1, lentilleImageParams({ f: 20, OA: -20 }), DEPS), /opt\.err_oa_eq_f_s1/);
});

test('_genOptiqueLentilleImageCore : tans reprend OA\' et AB\' calculés (relation de conjugaison)', () => {
    // f=20, OA=-30 => OA' = f*OA/(OA+f) = 20*-30/-10 = 60 ; gamma = OA'/OA = -2 ; AB'=gamma*AB
    const q = _genOptiqueLentilleImageCore(1, lentilleImageParams({ f: 20, OA: -30, AB: 2 }), DEPS);
    assert.match(q.inputXML, /<tans>\[60\.0000,-4\.0000\]<\/tans>/);
});

test('_genOptiqueLentilleImageCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueLentilleImageCore(1, lentilleImageParams({ bareme: 4, fbGenRaw: 'Note' }), DEPS);
    assert.equal(q.bareme, 4);
    assert.match(q.generalFeedback, /Note/);
});

test('_genOptiqueLentilleImageCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueLentilleImageCore(1, lentilleImageParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (lentille-image)');
    assertBalancedTags(q.inputXML, 'inputXML (lentille-image)');
});

// ── _genOptiqueLentilleRayonsCore ────────────────────────────────────────

function lentilleRayonsParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Tracez les rayons.</p>',
        f: 3, xAin: -6, AB: 1.5, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueLentilleRayonsCore : f <= 0 lève opt.err_f_positive', () => {
    assert.throws(() => _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams({ f: 0 }), DEPS), /opt\.err_f_positive/);
});

test('_genOptiqueLentilleRayonsCore : xAin >= 0 lève opt.err_oa_negative', () => {
    assert.throws(() => _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams({ xAin: 1 }), DEPS), /opt\.err_oa_negative/);
});

test('_genOptiqueLentilleRayonsCore : xAin = -f lève opt.err_oa_eq_f_s2', () => {
    assert.throws(() => _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams({ f: 3, xAin: -3 }), DEPS), /opt\.err_oa_eq_f_s2/);
});

test('_genOptiqueLentilleRayonsCore : objet au-delà de F (OA>f) donne une image réelle (pas de tronçon "vert")', () => {
    const q = _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams({ f: 3, xAin: -6 }), DEPS);
    assert.doesNotMatch(q.inputXML, /"vert"/);
});

test('_genOptiqueLentilleRayonsCore : objet entre F et O (OA<f) donne une image virtuelle (tronçon "vert" présent)', () => {
    const q = _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams({ f: 3, xAin: -2 }), DEPS);
    assert.match(q.inputXML, /"vert"/);
});

test('_genOptiqueLentilleRayonsCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueLentilleRayonsCore(1, lentilleRayonsParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (lentille-rayons)');
    assertBalancedTags(q.inputXML, 'inputXML (lentille-rayons)');
});

// ── _genOptiqueLentilleDivergenteCore ────────────────────────────────────

function lentilleDivergenteParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Tracez les rayons (divergente).</p>',
        f: 3, xAin: -6, AB: 1.5, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueLentilleDivergenteCore : f <= 0 lève opt.err_f_positive', () => {
    assert.throws(() => _genOptiqueLentilleDivergenteCore(1, lentilleDivergenteParams({ f: 0 }), DEPS), /opt\.err_f_positive/);
});

test('_genOptiqueLentilleDivergenteCore : xAin >= 0 lève opt.err_oa_negative', () => {
    assert.throws(() => _genOptiqueLentilleDivergenteCore(1, lentilleDivergenteParams({ xAin: 1 }), DEPS), /opt\.err_oa_negative/);
});

test('_genOptiqueLentilleDivergenteCore : qnote reprend f et OA', () => {
    const q = _genOptiqueLentilleDivergenteCore(1, lentilleDivergenteParams({ f: 5, xAin: -8 }), DEPS);
    assert.match(q.qnote, /Optique-Divergente Q1 f=5 OA=8/);
});

test('_genOptiqueLentilleDivergenteCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueLentilleDivergenteCore(1, lentilleDivergenteParams({ bareme: 2, fbGenRaw: 'Note div' }), DEPS);
    assert.equal(q.bareme, 2);
    assert.match(q.generalFeedback, /Note div/);
});

test('_genOptiqueLentilleDivergenteCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueLentilleDivergenteCore(1, lentilleDivergenteParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (lentille-divergente)');
    assertBalancedTags(q.inputXML, 'inputXML (lentille-divergente)');
});

// ── _genOptiqueMiroirCoreImpl (concave/convexe) ──────────────────────────

function miroirParams(overrides) {
    return Object.assign({
        convexe: false, bareme: 1, text: '<p>Miroir.</p>',
        f: 3, SA: 7, AB: 1.5, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueMiroirCoreImpl : f <= 0 lève opt.err_f_positive', () => {
    assert.throws(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ f: 0 }), DEPS), /opt\.err_f_positive/);
});

test('_genOptiqueMiroirCoreImpl : SA <= 0 lève opt.err_sa_positive', () => {
    assert.throws(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ SA: 0 }), DEPS), /opt\.err_sa_positive/);
});

test('_genOptiqueMiroirCoreImpl : concave avec SA=f lève opt.err_sa_eq_f', () => {
    assert.throws(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: false, f: 3, SA: 3 }), DEPS), /opt\.err_sa_eq_f/);
});

test('_genOptiqueMiroirCoreImpl : concave avec SA=2f lève opt.err_sa_eq_2f', () => {
    assert.throws(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: false, f: 3, SA: 6 }), DEPS), /opt\.err_sa_eq_2f/);
});

test('_genOptiqueMiroirCoreImpl : convexe n\'est pas soumis aux contraintes SA=f / SA=2f', () => {
    assert.doesNotThrow(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: true, f: 3, SA: 3 }), DEPS));
    assert.doesNotThrow(() => _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: true, f: 3, SA: 6 }), DEPS));
});

test('_genOptiqueMiroirCoreImpl : qnote distingue concave/convexe', () => {
    const qConcave = _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: false }), DEPS);
    assert.match(qConcave.qnote, /Optique-MiroirConcave/);
    const qConvexe = _genOptiqueMiroirCoreImpl(1, miroirParams({ convexe: true, SA: 3 }), DEPS);
    assert.match(qConvexe.qnote, /Optique-MiroirConvexe/);
});

test('_genOptiqueMiroirCoreImpl : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueMiroirCoreImpl(1, miroirParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (miroir)');
    assertBalancedTags(q.inputXML, 'inputXML (miroir)');
});

// ── _genOptiqueLunetteConstructionCore ───────────────────────────────────

function lunetteParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Lunette.</p>',
        f1: 40, f2: 10, theta: 3, beamH: 3, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueLunetteConstructionCore : f1 <= 0 lève opt.err_f1_positive', () => {
    assert.throws(() => _genOptiqueLunetteConstructionCore(1, lunetteParams({ f1: 0 }), DEPS), /opt\.err_f1_positive/);
});

test('_genOptiqueLunetteConstructionCore : f2 <= 0 lève opt.err_f2_positive', () => {
    assert.throws(() => _genOptiqueLunetteConstructionCore(1, lunetteParams({ f2: 0 }), DEPS), /opt\.err_f2_positive/);
});

test('_genOptiqueLunetteConstructionCore : theta <= 0 lève opt.err_theta_positive', () => {
    assert.throws(() => _genOptiqueLunetteConstructionCore(1, lunetteParams({ theta: 0 }), DEPS), /opt\.err_theta_positive/);
});

test('_genOptiqueLunetteConstructionCore : beamH <= 0 lève opt.err_theta_positive', () => {
    assert.throws(() => _genOptiqueLunetteConstructionCore(1, lunetteParams({ beamH: 0 }), DEPS), /opt\.err_theta_positive/);
});

test('_genOptiqueLunetteConstructionCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueLunetteConstructionCore(1, lunetteParams({ bareme: 2, fbGenRaw: 'Note lunette' }), DEPS);
    assert.equal(q.bareme, 2);
    assert.match(q.generalFeedback, /Note lunette/);
});

test('_genOptiqueLunetteConstructionCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueLunetteConstructionCore(1, lunetteParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (lunette)');
    assertBalancedTags(q.inputXML, 'inputXML (lunette)');
});

// ── _genOptiqueMiroirPlanCore ─────────────────────────────────────────────

function miroirPlanParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Miroir plan.</p>',
        SA: 7, AB: 1.5, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueMiroirPlanCore : SA <= 0 lève opt.err_sa_positive', () => {
    assert.throws(() => _genOptiqueMiroirPlanCore(1, miroirPlanParams({ SA: 0 }), DEPS), /opt\.err_sa_positive/);
});

test('_genOptiqueMiroirPlanCore : qnote reprend SA', () => {
    const q = _genOptiqueMiroirPlanCore(1, miroirPlanParams({ SA: 9 }), DEPS);
    assert.match(q.qnote, /Optique-MiroirPlan Q1 SA=9/);
});

test('_genOptiqueMiroirPlanCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueMiroirPlanCore(1, miroirPlanParams({ bareme: 5, fbGenRaw: 'Note plan' }), DEPS);
    assert.equal(q.bareme, 5);
    assert.match(q.generalFeedback, /Note plan/);
});

test('_genOptiqueMiroirPlanCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueMiroirPlanCore(1, miroirPlanParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (miroir-plan)');
    assertBalancedTags(q.inputXML, 'inputXML (miroir-plan)');
});

// ── _genOptiqueMiroirSpheriqueCore ───────────────────────────────────────

function miroirSpheriqueParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Miroir sphérique.</p>',
        f: 20, SA: 30, AB: 2, msType: 'concave', tolPos: 2, tolH: 1,
        fbOk: '', fbWrong: '', dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueMiroirSpheriqueCore : qnote reprend msType/f/SA', () => {
    const q = _genOptiqueMiroirSpheriqueCore(1, miroirSpheriqueParams({ msType: 'convexe', f: 20, SA: 30 }), DEPS);
    assert.match(q.qnote, /Optique-MiroirSph Q1 convexe f=20 SA=30/);
});

test('_genOptiqueMiroirSpheriqueCore : concave/convexe produisent des tans distincts (xF de signe opposé)', () => {
    const qConcave = _genOptiqueMiroirSpheriqueCore(1, miroirSpheriqueParams({ msType: 'concave' }), DEPS);
    const qConvexe = _genOptiqueMiroirSpheriqueCore(1, miroirSpheriqueParams({ msType: 'convexe' }), DEPS);
    assert.notEqual(qConcave.inputXML, qConvexe.inputXML);
});

test('_genOptiqueMiroirSpheriqueCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueMiroirSpheriqueCore(1, miroirSpheriqueParams({ bareme: 3, fbGenRaw: 'Note sph' }), DEPS);
    assert.equal(q.bareme, 3);
    assert.match(q.generalFeedback, /Note sph/);
});

test('_genOptiqueMiroirSpheriqueCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueMiroirSpheriqueCore(1, miroirSpheriqueParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (miroir-spherique)');
    assertBalancedTags(q.inputXML, 'inputXML (miroir-spherique)');
});

// ── _genOptiqueTelescopeConstructionCore ─────────────────────────────────

function telescopeParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Télescope.</p>',
        f1: 40, theta: 3, beamH: 3, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueTelescopeConstructionCore : f1 <= 0 lève opt.err_f1_positive', () => {
    assert.throws(() => _genOptiqueTelescopeConstructionCore(1, telescopeParams({ f1: 0 }), DEPS), /opt\.err_f1_positive/);
});

test('_genOptiqueTelescopeConstructionCore : theta <= 0 lève opt.err_theta_positive', () => {
    assert.throws(() => _genOptiqueTelescopeConstructionCore(1, telescopeParams({ theta: 0 }), DEPS), /opt\.err_theta_positive/);
});

test('_genOptiqueTelescopeConstructionCore : beamH <= 0 lève opt.err_theta_positive', () => {
    assert.throws(() => _genOptiqueTelescopeConstructionCore(1, telescopeParams({ beamH: 0 }), DEPS), /opt\.err_theta_positive/);
});

test('_genOptiqueTelescopeConstructionCore : qnote reprend f1/theta', () => {
    const q = _genOptiqueTelescopeConstructionCore(1, telescopeParams({ f1: 50, theta: 4 }), DEPS);
    assert.match(q.qnote, /Optique-Telescope Q1 f1=50 th=4/);
});

test('_genOptiqueTelescopeConstructionCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueTelescopeConstructionCore(1, telescopeParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (telescope)');
    assertBalancedTags(q.inputXML, 'inputXML (telescope)');
});

// ── _genOptiqueMicroscopeConstructionCore ────────────────────────────────

function microscopeParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Microscope.</p>',
        f1: 1, f2: 4, oaIn: -1.25, AB: 0.08, dispW: 700, dispH: 380, fbGenRaw: ''
    }, overrides || {});
}

test('_genOptiqueMicroscopeConstructionCore : f1 <= 0 lève opt.err_f1_positive', () => {
    assert.throws(() => _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ f1: 0 }), DEPS), /opt\.err_f1_positive/);
});

test('_genOptiqueMicroscopeConstructionCore : f2 <= 0 lève opt.err_f2_positive', () => {
    assert.throws(() => _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ f2: 0 }), DEPS), /opt\.err_f2_positive/);
});

test('_genOptiqueMicroscopeConstructionCore : oaIn >= 0 lève opt.err_oa_negative', () => {
    assert.throws(() => _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ oaIn: 1 }), DEPS), /opt\.err_oa_negative/);
});

test('_genOptiqueMicroscopeConstructionCore : |oaIn| <= f1 lève opt.err_oa_lt_f1_microscope', () => {
    assert.throws(() => _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ f1: 2, oaIn: -1 }), DEPS), /opt\.err_oa_lt_f1_microscope/);
});

test('_genOptiqueMicroscopeConstructionCore : qnote reprend f1/f2/oaIn', () => {
    const q = _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ f1: 1, f2: 4, oaIn: -1.25 }), DEPS);
    assert.match(q.qnote, /Optique-Microscope Q1 f1=1 f2=4 oa=-1\.25/);
});

test('_genOptiqueMicroscopeConstructionCore : bareme personnalisé propagé et generalFeedback via fbGenRaw', () => {
    const q = _genOptiqueMicroscopeConstructionCore(1, microscopeParams({ bareme: 6, fbGenRaw: 'Note micro' }), DEPS);
    assert.equal(q.bareme, 6);
    assert.match(q.generalFeedback, /Note micro/);
});

test('_genOptiqueMicroscopeConstructionCore : le XML (prtXML, inputXML) est bien formé', () => {
    const q = _genOptiqueMicroscopeConstructionCore(1, microscopeParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (microscope)');
    assertBalancedTags(q.inputXML, 'inputXML (microscope)');
});
