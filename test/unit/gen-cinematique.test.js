// Tests unitaires du cœur pur de gen-cinematique.js (genCinematiqueCore).
//
// Lancer :  npm test
//
// genCinematiqueCore() ne lit jamais document : tout est passé en p et deps
// (voir genCinematiqueParams(), seul point de contact avec le DOM). Voir
// test/unit/gen-avancement.test.js pour le même découpage.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genCinematiqueCore, _cinFinalize, _cinNode, _cinHeader } = require(path.join('..', '..', 'js', 'gen-cinematique.js'));
const { cinComputeAll } = require(path.join('..', '..', 'js', 'gen-cinematique-physics.js'));
const { buildCinJSX_Phase1, buildCinJSX_Phase2 } = require(path.join('..', '..', 'js', 'gen-cinematique-jsx.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { _mkInput, _mkFbGen } = require(path.join('..', '..', 'js', 'gen-math-shared.js'));

// Charge les vraies traductions FR (comportement identique à l'app : add()
// puis t(key, vars) substitue {var}) — nécessaire ici car plusieurs tests
// vérifient le texte français rendu (M<sub>i</sub>M<sub>i+1</sub>...), pas
// seulement la présence de la clé (contrairement au stub passthrough utilisé
// par test/unit/gen-redox.test.js pour un fichier qui ne teste pas le texte).
global.I18N = {
    _strings: {},
    add(code, strings) { Object.assign(this._strings, strings); },
    t(key, vars) {
        let s = this._strings[key] != null ? this._strings[key] : key;
        if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
        return s;
    }
};
require(path.join('..', '..', 'lang', 'fr.js'));
const I18N_STUB = global.I18N;

const DEPS = {
    cinComputeAll, buildCinJSX_Phase1, buildCinJSX_Phase2,
    _mkInput, _cinFinalize, buildPrtXml, _mkFbGen, applyFbBox, I18N: I18N_STUB
};

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        text: '',
        fbGen: '',
        dt: 0.15, iIdx: 2,
        points: [
            { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }, { x: 400, y: 0 }
        ],
        calib: { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 }
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

// ── Cas d'échec : remontés en erreur JS (pas de XML partiel généré) ──────
test('moins de 3 points digitalisés lève une erreur explicite', () => {
    const p = baseParams({ points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    assert.throws(() => genCinematiqueCore(1, p, DEPS), /au moins 3 points/);
});

test('calibration absente ou dégénérée lève une erreur explicite', () => {
    const p = baseParams({ calib: null });
    assert.throws(() => genCinematiqueCore(1, p, DEPS), /calibration/);
});

test('indice i hors limites lève une erreur explicite mentionnant les bornes', () => {
    const p = baseParams({ iIdx: 999 });
    assert.throws(() => genCinematiqueCore(1, p, DEPS), /hors limites/);
});

// ── Cas nominal : structure complète retournée ───────────────────────────
test('cas nominal : 8 inputs (vec1/vec2 x/y, ans_vi, ans_vip1, dv x/y), 5 PRT, XML bien formé', () => {
    const parts = genCinematiqueCore(3, baseParams(), DEPS);

    assert.match(parts.inputXML, /<name>ans_vec1_x3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_vec1_y3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_vec2_x3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_vec2_y3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_vi3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_vip13<\/name>/);
    assert.match(parts.inputXML, /<name>ans_dv_x3<\/name>/);
    assert.match(parts.inputXML, /<name>ans_dv_y3<\/name>/);

    assert.equal(parts.prts.length, 5, 'cinq PRT (vec1, vec2, norme vi, norme vip1, vecteur dv)');
    assert.equal(parts.prt, parts.prts[0], 'prt = premier PRT (limitation éditeur visuel MVP)');
    assert.equal(parts.prts[0].meta.name, 'prt3a');
    assert.equal(parts.prts[1].meta.name, 'prt3b');
    assert.equal(parts.prts[2].meta.name, 'prt3c');
    assert.equal(parts.prts[3].meta.name, 'prt3d');
    assert.equal(parts.prts[4].meta.name, 'prt3e');

    assert.match(parts.feedbackRef, /\[\[feedback:prt3a\]\]/);
    assert.match(parts.feedbackRef, /\[\[feedback:prt3e\]\]/);

    assertBalancedTags(parts.prtXML, 'prtXML');
    assertBalancedTags(parts.inputXML, 'inputXML');
});

test('cas nominal : barème réparti à parts égales entre les 5 PRT', () => {
    const parts = genCinematiqueCore(1, baseParams({ bareme: 5 }), DEPS);
    parts.prts.forEach((prt) => {
        assert.equal(prt.meta.value, (1).toFixed(7));
    });
});

test('cas nominal : les PRT vec1/vec2 calculent leur erreur via feedbackvariables (distance euclidienne)', () => {
    const parts = genCinematiqueCore(2, baseParams(), DEPS);
    assert.match(parts.prts[0].meta.feedbackvariables, /err_vec1_2:\s*sqrt\(\(ans_vec1_x2-vec1_2\[1\]\)\^2\+\(ans_vec1_y2-vec1_2\[2\]\)\^2\)\$/);
    assert.equal(parts.prts[0].nodes[0].answertest, 'NumAbsolute');
    assert.equal(parts.prts[0].nodes[0].sans, 'err_vec1_2');
    assert.equal(parts.prts[0].nodes[0].tans, '0');

    assert.match(parts.prts[1].meta.feedbackvariables, /err_vec2_2:\s*sqrt\(\(ans_vec2_x2-vec2_2\[1\]\)\^2\+\(ans_vec2_y2-vec2_2\[2\]\)\^2\)\$/);
    assert.equal(parts.prts[1].nodes[0].sans, 'err_vec2_2');
});

test('cas nominal : les PRT norme vi/vip1 comparent directement l\'input à la norme attendue', () => {
    const parts = genCinematiqueCore(2, baseParams(), DEPS);
    assert.equal(parts.prts[2].nodes[0].answertest, 'NumAbsolute');
    assert.equal(parts.prts[2].nodes[0].sans, 'ans_vi2');
    assert.equal(parts.prts[2].nodes[0].tans, 'vi_norm_2');
    assert.equal(parts.prts[3].nodes[0].sans, 'ans_vip12');
    assert.equal(parts.prts[3].nodes[0].tans, 'vip1_norm_2');
});

test('cas nominal : le dernier PRT calcule err_dv via feedbackvariables (distance euclidienne)', () => {
    const parts = genCinematiqueCore(2, baseParams(), DEPS);
    assert.match(parts.prts[4].meta.feedbackvariables, /err_dv_2:\s*sqrt\(\(ans_dv_x2-dv_2\[1\]\)\^2\+\(ans_dv_y2-dv_2\[2\]\)\^2\)\$/);
    assert.equal(parts.prts[4].nodes[0].answertest, 'NumAbsolute');
    assert.equal(parts.prts[4].nodes[0].sans, 'err_dv_2');
    assert.equal(parts.prts[4].nodes[0].tans, '0');
});

test('cas nominal : textFrag contient le marqueur kbdRaw, kbdRaw contient les 2 blocs JSXGraph + inputs cachés', () => {
    const parts = genCinematiqueCore(4, baseParams(), DEPS);
    assert.match(parts.textFrag, /<!--HS-KBD:4-->/);
    assert.match(parts.kbdRaw, /\[\[jsxgraph[^\]]*\]\]/);
    assert.match(parts.kbdRaw, /\[\[input:ans_vi4\]\]/);
    assert.match(parts.kbdRaw, /\[\[input:ans_vip14\]\]/);
    assert.match(parts.kbdRaw, /\[\[input:ans_dv_x4\]\]/);
    assert.match(parts.kbdRaw, /\[\[input:ans_dv_y4\]\]/);
    assert.match(parts.kbdRaw, /input-ref-ans_vec1_x4="refVec1X4"/);
    assert.match(parts.kbdRaw, /input-ref-ans_vec2_y4="refVec2Y4"/);
    assert.match(parts.kbdRaw, /input-ref-ans_dv_x4="refDvX4"/);
    assert.match(parts.kbdRaw, /input-ref-ans_dv_y4="refDvY4"/);
    assert.match(parts.kbdRaw, /input-ref-ans_vi4="refVi4"/);
    assert.match(parts.kbdRaw, /input-ref-ans_vip14="refVip14"/);
    // Inputs cachés vec1/vec2 (Phase 1) wrappés display:none + aria-hidden (DSTU 5.5)
    assert.match(parts.kbdRaw, /<div style="display: none;" aria-hidden="true" tabindex="-1">\[\[input:ans_vec1_x4\]\] \[\[input:ans_vec1_y4\]\] \[\[input:ans_vec2_x4\]\] \[\[input:ans_vec2_y4\]\]<\/div>/);
    // Inputs cachés (Phase 2, ans_dv_x/y) wrappés display:none + aria-hidden (DSTU 5.5)
    assert.match(parts.kbdRaw, /<div style="display: none;" aria-hidden="true" tabindex="-1">\[\[input:ans_dv_x4\]\] \[\[input:ans_dv_y4\]\]<\/div>/);
});

test('cas nominal : vars Maxima contiennent iIdx, Mlist, vec1/vec2, vi, vip1, dv, tolérances et kv, toutes terminées par $', () => {
    const parts = genCinematiqueCore(5, baseParams(), DEPS);
    [
        'iIdx_5:', 'Mlist_5:', 'vec1_5:', 'vec2_5:', 'vi_5:', 'vip1_5:', 'dv_5:',
        'vi_norm_5:', 'vip1_norm_5:', 'tol_vec_5:', 'tol_vi_5:', 'tol_vip1_5:', 'tol_dv_5:',
        'kv_5:'
    ].forEach((frag) => {
        assert.ok(parts.vars.includes(frag), `vars doit contenir "${frag}"`);
    });
    parts.vars.split('\n').filter((l) => l.trim() && !l.trim().startsWith('/*')).forEach((line) => {
        assert.ok(line.trim().endsWith('$'), `ligne Maxima doit finir par $ : "${line}"`);
    });
});

test('cas nominal : aucun commentaire HTML <!-- --> hors du marqueur HS-KBD interne', () => {
    const parts = genCinematiqueCore(6, baseParams(), DEPS);
    const withoutKbdMarker = parts.textFrag.replace(/<!--HS-KBD:6-->/g, '');
    assert.doesNotMatch(withoutKbdMarker, /<!--/);
    assert.doesNotMatch(parts.kbdRaw, /<!--/);
});

// ── Méthode de la dérivée symétrique ──────────────────────────────────────
test('method="symetrique" : indice i hors limites (iMin=1) lève une erreur explicite mentionnant les bornes', () => {
    const p = baseParams({ method: 'symetrique', iIdx: 0 });
    assert.throws(() => genCinematiqueCore(1, p, DEPS), /hors limites/);
    assert.throws(() => genCinematiqueCore(1, p, DEPS), /entre 1 et/);
});

test('method="symetrique" : structure identique (8 inputs, 5 PRT), dtEff_X vaut 2*dt (baseParams dt=0.15 -> 0.3)', () => {
    const parts = genCinematiqueCore(7, baseParams({ method: 'symetrique' }), DEPS);
    assert.equal(parts.prts.length, 5);
    assert.match(parts.inputXML, /<name>ans_vec1_x7<\/name>/);
    assert.match(parts.inputXML, /<name>ans_dv_y7<\/name>/);
    assert.ok(parts.vars.includes('dt_7: 0.15$'), 'dt_7 doit rester 0.15');
    assert.ok(parts.vars.includes('dtEff_7: 0.3$'), 'dtEff_7 doit valoir 2*dt = 0.3');
    assertBalancedTags(parts.prtXML, 'prtXML');
});

test('method="symetrique" avec iIdx=2 : les vecteurs tracés sautent le point médian (M1M3, M2M4)', () => {
    // baseParams : 5 points digitalisés (index 0..4), iIdx=2 par défaut -> valide pour
    // symétrique (iMin=1, iMax=5-3=2). vec1 = [iIdx-1,iIdx+1] = [1,3], vec2 = [iIdx,iIdx+2] = [2,4].
    const parts = genCinematiqueCore(8, baseParams({ method: 'symetrique' }), DEPS);
    assert.match(parts.textFrag, /M<sub>1<\/sub>M<sub>3<\/sub>/);
    assert.match(parts.textFrag, /M<sub>2<\/sub>M<sub>4<\/sub>/);
    assert.match(parts.textFrag, /\{#dtEff_8#\}/);
    assert.doesNotMatch(parts.textFrag, /\{#dt_8#\}/);

    assert.equal(parts.prts[0].nodes[0].description, 'Vecteur déplacement M_1M_3');
    assert.equal(parts.prts[1].nodes[0].description, 'Vecteur déplacement M_2M_4');
    assert.match(parts.prts[0].nodes[0].truefeedback, /M<sub>1<\/sub>M<sub>3<\/sub>/);
    assert.match(parts.prts[1].nodes[0].truefeedback, /M<sub>2<\/sub>M<sub>4<\/sub>/);

    assert.match(parts.generalFeedback, /M<sub>1<\/sub>M<sub>3<\/sub>/);
    assert.match(parts.generalFeedback, /M<sub>2<\/sub>M<sub>4<\/sub>/);
    assert.match(parts.generalFeedback, /\{@dtEff_8@\}/);
});

test('method="apres" explicite (ou omis) : les vecteurs tracés restent consécutifs (M2M3, M3M4) — non-régression', () => {
    const partsOmis = genCinematiqueCore(9, baseParams(), DEPS);
    const partsExplicite = genCinematiqueCore(9, baseParams({ method: 'apres' }), DEPS);
    [partsOmis, partsExplicite].forEach((parts) => {
        assert.match(parts.textFrag, /M<sub>2<\/sub>M<sub>3<\/sub>/);
        assert.match(parts.textFrag, /M<sub>3<\/sub>M<sub>4<\/sub>/);
        assert.equal(parts.prts[0].nodes[0].description, 'Vecteur déplacement M_2M_3');
        assert.equal(parts.prts[1].nodes[0].description, 'Vecteur déplacement M_3M_4');
        assert.ok(parts.vars.includes('dtEff_9: 0.15$'), 'dtEff_9 doit valoir dt = 0.15 en méthode apres');
    });
});
