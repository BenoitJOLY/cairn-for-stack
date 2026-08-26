// Tests unitaires du cœur pur de gen-avancement.js (genAvancementCore).
//
// Lancer :  npm test
//
// genAvancementCore() ne lit jamais document : tout est passé en p (voir
// genAvancement(X), seul point de contact avec le DOM/questions[]). Voir
// test/unit/gen-zscore.test.js pour le même découpage.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genAvancementCore, AV_COEFF_SOURCES } = require(path.join('..', '..', 'js', 'gen-avancement.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox, escapeMaximaString, htmlEsc };

// Décomposition H2O2 : 2 H2O2 -> 2 H2O + O2, avec H+ catalyseur en excès et
// H2O en solvant (masqué du tableau affiché).
function baseSpecies() {
    return [
        { nom: 'H_2O_2', coeff: 2, role: 'reactif', n0: 'n_0', exces: false, solvant: false },
        { nom: 'H^{+}', coeff: 2, role: 'reactif', n0: '0.5', exces: true, solvant: false },
        { nom: 'H_2O', coeff: 2, role: 'produit', n0: '0', exces: false, solvant: true },
        { nom: 'O_2', coeff: 1, role: 'produit', n0: '0', exces: false, solvant: false }
    ];
}

function baseParams(overrides) {
    return Object.assign({
        bareme: 3,
        text: '',
        mode: 'teacher',
        sourceType: 'chemical_topo',
        sourceX: 1,
        species: baseSpecies(),
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

// ── Validation des paramètres ────────────────────────────────────────────
test("liste d'espèces vide lève une erreur", () => {
    assert.throws(() => genAvancementCore(1, baseParams({ species: [] }), DEPS), /err_no_species/);
});

test("nom manquant lève une erreur", () => {
    const species = baseSpecies();
    species[0].nom = '';
    assert.throws(() => genAvancementCore(1, baseParams({ species }), DEPS), /err_nom_manquant/);
});

test("coefficient non strictement positif lève une erreur", () => {
    const species = baseSpecies();
    species[0].coeff = 0;
    assert.throws(() => genAvancementCore(1, baseParams({ species }), DEPS), /err_coeff_invalide/);
});

test("toutes les espèces en solvant lève une erreur (tableau vide)", () => {
    const species = baseSpecies().map((s) => Object.assign({}, s, { solvant: true }));
    assert.throws(() => genAvancementCore(1, baseParams({ species }), DEPS), /err_all_solvant/);
});

// ── Mode 'teacher' : structure de base ───────────────────────────────────
test("mode teacher : 3 espèces affichées (H2O exclue car solvant), inputs i/c/f + xmax", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.match(q.inputXML, /i1_1/);
    assert.match(q.inputXML, /i2_1/);
    assert.match(q.inputXML, /i3_1/);
    assert.doesNotMatch(q.inputXML, /i4_1/);
    assert.match(q.inputXML, /xmax_1/);
});

test("mode teacher : questionvariables calcule xmax1 comme le min des ratios n0/coeff (hors excès/solvant)", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.match(q.vars, /nom1:\[/);
    assert.match(q.vars, /coef1:\[2,2,2,1\]\$/);
    assert.match(q.vars, /sgn1:\[-1,-1,1,1\]\$/);
    assert.match(q.vars, /exc1:\[0,1,1,0\]\$/);
    assert.match(q.vars, /xmax1:apply\(min,rat1\)\$/);
});

test("mode teacher : les tans i/c/f/xmax pointent sur les listes canoniques n0/nc/nf/xmax (pas *_eff)", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<tans>\[n01\[1\],n01\[2\],n01\[4\]\]<\/tans>/);
    assert.match(q.prtXML, /<tans>\[nc1\[1\],nc1\[2\],nc1\[4\]\]<\/tans>/);
    assert.match(q.prtXML, /<tans>\[nf1\[1\],nf1\[2\],nf1\[4\]\]<\/tans>/);
    assert.match(q.prtXML, /<tans>xmax1<\/tans>/);
    assert.doesNotMatch(q.prtXML, /_eff1/);
});

test("mode teacher : feedbackvariables du PRT est vide", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.equal(q.prt.meta.feedbackvariables, '');
});

// ── PRT : 1 seul prt, 4 nœuds chaînés, score additif 1/3+1/3+1/3, x_max à 0 ──
test("un seul <prt>, 4 nœuds, scores additifs 1/3 x3 puis 0 pour x_max", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.equal((q.prtXML.match(/<prt>/g) || []).length, 1);
    assert.equal(q.prt.nodes.length, 4);
    const scores = q.prt.nodes.map((n) => n.truescore);
    assert.deepEqual(scores, ['1/3', '1/3', '1/3', '0']);
    q.prt.nodes.forEach((n) => assert.equal(n.truescoremode, '+'));
    q.prt.nodes.forEach((n) => assert.equal(n.falsescoremode, '+'));
});

test("falsenextnode == truenextnode sur chaque nœud (les 4 lignes sont toujours visitées)", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    q.prt.nodes.forEach((n) => assert.equal(n.falsenextnode, n.truenextnode, `nœud ${n.name}`));
    assert.equal(q.prt.nodes[3].truenextnode, '-1');
});

test("bareme se répercute sur meta.value du prt", () => {
    const q = genAvancementCore(1, baseParams({ bareme: 5 }), DEPS);
    assert.equal(q.prt.meta.value, (5).toFixed(7));
});

// ── Mode 'follow_from' : coefficients effectifs recalculés en feedbackvariables ──
test("mode follow_from (chemical_topo) : feedbackvariables lit ans_reacoefX/ans_procoefX et retombe sur coef si invalide", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from', sourceType: 'chemical_topo', sourceX: 2 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /coef_src1:append\(ans_reacoef2,ans_procoef2\)\$/);
    assert.match(q.prt.meta.feedbackvariables, /coef_eff1:if listp\(coef_src1\)/);
    assert.match(q.prt.meta.feedbackvariables, /every\(lambda\(\[cc\],numberp\(cc\) and cc>0\),coef_src1\)/);
    assert.match(q.prt.meta.feedbackvariables, /else coef1\$/);
    assert.match(q.prt.meta.feedbackvariables, /xmax_eff1:apply\(min,rat_eff1\)\$/);
});

test("mode follow_from (chemical) : la source utilise ans_rkX/ans_pkX", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from', sourceType: 'chemical', sourceX: 3 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /coef_src1:append\(ans_rk3,ans_pk3\)\$/);
});

test("mode follow_from : sans/tans des nœuds 'En cours'/'Final'/'x_max' utilisent les listes *_eff, pas les canoniques", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from' }), DEPS);
    assert.match(q.prtXML, /<tans>\[nc_eff1\[1\],nc_eff1\[2\],nc_eff1\[4\]\]<\/tans>/);
    assert.match(q.prtXML, /<tans>\[nf_eff1\[1\],nf_eff1\[2\],nf_eff1\[4\]\]<\/tans>/);
    assert.match(q.prtXML, /<tans>xmax_eff1<\/tans>/);
});

test("mode follow_from : le nœud 'État initial' reste inchangé (n0 n'est jamais recalculé)", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from' }), DEPS);
    assert.match(q.prtXML, /<tans>\[n01\[1\],n01\[2\],n01\[4\]\]<\/tans>/);
});

test("mode follow_from : la note discrète (follow_note) apparaît dans textFrag et dans les feedbacks 'En cours'/'Final'/'x_max' mais pas 'État initial'", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from' }), DEPS);
    assert.match(q.textFrag, /av\.follow_note/);
    const init = q.prt.nodes[0];
    const enc = q.prt.nodes[1];
    assert.doesNotMatch(init.truefeedback + init.falsefeedback, /av\.follow_note/);
    assert.match(enc.truefeedback, /av\.follow_note/);
    assert.match(enc.falsefeedback, /av\.follow_note/);
});

test("AV_COEFF_SOURCES expose bien chemical et chemical_topo", () => {
    assert.equal(AV_COEFF_SOURCES.chemical_topo(4), 'append(ans_reacoef4,ans_procoef4)');
    assert.equal(AV_COEFF_SOURCES.chemical(4), 'append(ans_rk4,ans_pk4)');
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet (mode teacher) reste bien formé", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (teacher)');
    assertBalancedTags(q.inputXML, 'inputXML (teacher)');
    assertBalancedTags(q.textFrag, 'textFrag (teacher)');
});

test("XML complet (mode follow_from) reste bien formé", () => {
    const q = genAvancementCore(1, baseParams({ mode: 'follow_from' }), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (follow_from)');
    assertBalancedTags(q.inputXML, 'inputXML (follow_from)');
    assertBalancedTags(q.textFrag, 'textFrag (follow_from)');
});

test("qnote expose xmax={@xmax1@}", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'xmax={@xmax1@}');
});

test("feedbackRef pointe sur [[feedback:prt1]]", () => {
    const q = genAvancementCore(1, baseParams(), DEPS);
    assert.equal(q.feedbackRef, '[[feedback:prt1]]');
});
