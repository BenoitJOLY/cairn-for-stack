// Tests unitaires du cœur pur de gen-ondesismique.js (genOndeSismiqueCore).
//
// Lancer :  npm test
//
// Gabarit suivi : test/unit/gen-radiochronologie.test.js, adapté à une SEULE
// sous-question (un seul PRT), contrairement à radiochronologie qui en a deux.
// genOndeSismiqueCore() ne lit jamais document : tout est passé en p (voir
// genOndeSismique(X), seul point de contact avec le DOM). Le helper Maxima pur
// (js/gen-ondesismique-calc.js) est appelé en GLOBAL BARE (deps._sisVars ||
// _sisVars) — en navigateur tous les <script> partagent le même scope window.
// En Node, chaque require() a son propre scope de module : on republie donc
// _sisVars sur `global` avant d'appeler genOndeSismiqueCore.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genOndeSismiqueCore } = require(path.join('..', '..', 'js', 'gen-ondesismique.js'));
const { _sisVars } = require(path.join('..', '..', 'js', 'gen-ondesismique-calc.js'));
const { _sisSeismogramJSX, _sisComputeGraphBounds } = require(path.join('..', '..', 'js', 'gen-ondesismique-jsx.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._sisVars = _sisVars;
global._sisSeismogramJSX = _sisSeismogramJSX;
global._sisComputeGraphBounds = _sisComputeGraphBounds;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox };

function baseParams(overrides) {
    return Object.assign({
        bareme: 1,
        context: { intro: '' },
        grandeurs: { dList: '80,120,150,200,240,300', vpList: '6,7,8', vsList: '3,7/2,4,9/2' },
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

// ── Helper Maxima pur (_sisVars) : validation ───────────────────────────
test("_sisVars : émet les tirages natifs Maxima (d, vp, vs) et les variables dérivées", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_sis_dlist: \[80,120,150,200,240,300\]\$/);
    assert.match(q.vars, /q1_sis_d: rand\(q1_sis_dlist\)\$/);
    assert.match(q.vars, /q1_sis_vplist: \[6,7,8\]\$/);
    assert.match(q.vars, /q1_sis_vp: rand\(q1_sis_vplist\)\$/);
    assert.match(q.vars, /q1_sis_vslist: \[3,7\/2,4,9\/2\]\$/);
    assert.match(q.vars, /q1_sis_vs: rand\(q1_sis_vslist\)\$/);
    assert.match(q.vars, /q1_sis_deltat: q1_sis_d\/q1_sis_vs - q1_sis_d\/q1_sis_vp\$/);
    assert.match(q.vars, /q1_sis_errreversed: q1_sis_d\/q1_sis_vp - q1_sis_d\/q1_sis_vs\$/);
});

test("_sisVars : lève une erreur si aucune distance épicentrale n'est proposée", () => {
    assert.throws(() => _sisVars(1, { grandeurs: { dList: '', vpList: '6', vsList: '3' } }), /distance épicentrale/);
});

test("_sisVars : lève une erreur si aucune vitesse d'onde P n'est proposée", () => {
    assert.throws(() => _sisVars(1, { grandeurs: { dList: '80', vpList: '', vsList: '3' } }), /onde P/);
});

test("_sisVars : lève une erreur si aucune vitesse d'onde S n'est proposée", () => {
    assert.throws(() => _sisVars(1, { grandeurs: { dList: '80', vpList: '6', vsList: '' } }), /onde S/);
});

// ── Toujours exactement 1 bloc PRT (une seule sous-question) ────────────
test("toujours exactement 1 bloc <prt> (une seule sous-question)", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 1);
    assert.equal(q.prts.length, 1);
});

test("le barème complet (non réparti) est affecté au PRT unique", () => {
    const q = genOndeSismiqueCore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.prts[0].meta.value, (3).toFixed(7));
});

test("bareme par défaut à 1 si absent des params", () => {
    const q = genOndeSismiqueCore(1, { context: {}, grandeurs: { dList: '80', vpList: '6', vsList: '3' } }, DEPS);
    assert.equal(q.bareme, 1);
});

// ── Sous-question unique : PRT à 2 nœuds en cascade ──────────────────────
test("nœud 0 teste le délai correct, bascule sur le nœud 1 si faux", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.match(q.prtXML, /<name>prt1<\/name>/);
    assert.match(q.inputXML, /<name>ans_sis1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_sis_deltat<\/tans>/);
    const prt = q.prts[0];
    assert.equal(prt.nodes.length, 2);
    assert.equal(prt.nodes[0].tans, 'q1_sis_deltat');
    assert.equal(prt.nodes[0].falsenextnode, '1');
    assert.equal(prt.nodes[1].tans, 'q1_sis_errreversed');
});

test("nœud 1 (ordre de soustraction inversé) : toujours noté faux même si la réponse égale errreversed", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    const node1 = q.prts[0].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /inversé/);
});

// ── qnote / feedbackRef ──────────────────────────────────────────────────
test("qnote expose le délai numérique dt", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'dt={@q1_sis_deltat@}');
});

test("feedbackRef référence le PRT unique", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.match(q.feedbackRef, /\[\[feedback:prt1\]\]/);
});

// ── Énoncé : tokens Maxima non résolus, titre i18n ───────────────────────
test("l'énoncé affiche les tokens Maxima non résolus côté JS et le titre i18n sis.title", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\{@q1_sis_d@\}/);
    assert.match(q.textFrag, /\{@q1_sis_vp@\}/);
    assert.match(q.textFrag, /\{@q1_sis_vs@\}/);
    assert.match(q.textFrag, /sis\.title/);
});

test("intro optionnelle absente par défaut, présente si fournie", () => {
    const q1 = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.doesNotMatch(q1.textFrag, /<p><\/p>/);
    const q2 = genOndeSismiqueCore(1, baseParams({ context: { intro: 'Contexte additionnel' } }), DEPS);
    assert.match(q2.textFrag, /Contexte additionnel/);
});

test("[[input]] et [[validation]] de la sous-question unique sont toujours présents", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\[\[input:ans_sis1\]\] \[\[validation:ans_sis1\]\]/);
});

// ── XML complet bien formé ────────────────────────────────────────────────
test("XML complet reste bien formé", () => {
    const q = genOndeSismiqueCore(1, baseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("le préfixe de variables q${X}_sis_ isole plusieurs questions du même export", () => {
    const q1 = genOndeSismiqueCore(1, baseParams(), DEPS);
    const q2 = genOndeSismiqueCore(2, baseParams(), DEPS);
    assert.match(q1.vars, /q1_sis_d\b/);
    assert.doesNotMatch(q1.vars, /q2_sis_d\b/);
    assert.match(q2.vars, /q2_sis_d\b/);
    assert.doesNotMatch(q2.vars, /q1_sis_d\b/);
});

// ═══════════════════════════════════════════════════════════════════════
// ── Scénario 'vitesse-onde' (lecture de sismogramme JSXGraph) ───────────
// ═══════════════════════════════════════════════════════════════════════

function vitesseParams(overrides) {
    return Object.assign({
        bareme: 2,
        scenario: 'vitesse-onde',
        context: { intro: '' },
        grandeurs: { dList2: '210,340,411,480,560,620,710', arrList: '40,60,80,100,120,140,160,180' },
        fbGen: ''
    }, overrides || {});
}

test("_sisVars (vitesse-onde) : émet les tirages natifs Maxima (d2, tarr, station, heure) et les variables dérivées", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assert.match(q.vars, /q1_sis_dlist2: \[210,340,411,480,560,620,710\]\$/);
    assert.match(q.vars, /q1_sis_d2: rand\(q1_sis_dlist2\)\$/);
    assert.match(q.vars, /q1_sis_arrlist: \[40,60,80,100,120,140,160,180\]\$/);
    assert.match(q.vars, /q1_sis_tarr: rand\(q1_sis_arrlist\)\$/);
    assert.match(q.vars, /q1_sis_stationlist: \["A","B","C","D","E","F","G","H"\]\$/);
    assert.match(q.vars, /q1_sis_station: rand\(q1_sis_stationlist\)\$/);
    assert.match(q.vars, /q1_sis_heureprofils: \[\["06h12min05s",22325\]/);
    assert.match(q.vars, /q1_sis_heureprofil: rand\(q1_sis_heureprofils\)\$/);
    assert.match(q.vars, /q1_sis_heure: q1_sis_heureprofil\[1\]\$/);
    assert.match(q.vars, /q1_sis_heuresec: q1_sis_heureprofil\[2\]\$/);
    assert.match(q.vars, /q1_sis_vkms: q1_sis_d2\/q1_sis_tarr\$/);
    assert.match(q.vars, /q1_sis_vkmh: q1_sis_vkms\*3600\$/);
    assert.match(q.vars, /q1_sis_errmin: q1_sis_vkms\*60\$/);
});

test("_sisVars (vitesse-onde) : lève une erreur si aucune distance épicentre-station n'est proposée", () => {
    assert.throws(() => _sisVars(1, { scenario: 'vitesse-onde', grandeurs: { dList2: '', arrList: '40' } }), /distance épicentrale/);
});

test("_sisVars (vitesse-onde) : lève une erreur si aucune date d'arrivée n'est proposée", () => {
    assert.throws(() => _sisVars(1, { scenario: 'vitesse-onde', grandeurs: { dList2: '210', arrList: '' } }), /date d'arrivée/);
});

test("scénario vitesse-onde : toujours exactement 2 blocs <prt> (célérité km/s et km/h)", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 2);
    assert.equal(q.prts.length, 2);
    assert.match(q.prtXML, /<name>prt1a<\/name>/);
    assert.match(q.prtXML, /<name>prt1b<\/name>/);
});

test("scénario vitesse-onde : le barème est réparti pour moitié entre les deux PRTs", () => {
    const q = genOndeSismiqueCore(1, vitesseParams({ bareme: 4 }), DEPS);
    assert.equal(q.prts[0].meta.value, (2).toFixed(7));
    assert.equal(q.prts[1].meta.value, (2).toFixed(7));
});

test("scénario vitesse-onde : PRT a (km/s) n'a qu'un seul nœud, PRT b (km/h) a une cascade de 2 nœuds", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assert.equal(q.prts[0].nodes.length, 1);
    assert.equal(q.prts[0].nodes[0].tans, 'q1_sis_vkms');
    assert.equal(q.prts[1].nodes.length, 2);
    assert.equal(q.prts[1].nodes[0].tans, 'q1_sis_vkmh');
    assert.equal(q.prts[1].nodes[0].falsenextnode, '1');
    assert.equal(q.prts[1].nodes[1].tans, 'q1_sis_errmin');
});

test("scénario vitesse-onde : le nœud de confusion 1h=60s est toujours noté faux, feedback explicite", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    const node1 = q.prts[1].nodes[1];
    assert.equal(node1.truescore, '0');
    assert.equal(node1.falsescore, '0');
    assert.match(node1.truefeedback, /3600/);
});

test("scénario vitesse-onde : inputs ans_sisa1/ans_sisb1 et jetons non résolus dans l'énoncé", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assert.match(q.inputXML, /<name>ans_sisa1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_sis_vkms<\/tans>/);
    assert.match(q.inputXML, /<name>ans_sisb1<\/name>/);
    assert.match(q.inputXML, /<tans>q1_sis_vkmh<\/tans>/);
    assert.match(q.textFrag, /\[\[input:ans_sisa1\]\] \[\[validation:ans_sisa1\]\]/);
    assert.match(q.textFrag, /\[\[input:ans_sisb1\]\] \[\[validation:ans_sisb1\]\]/);
    assert.match(q.textFrag, /\{@q1_sis_d2@\}/);
    assert.match(q.textFrag, /\{@q1_sis_station@\}/);
    assert.match(q.textFrag, /\{@q1_sis_heure@\}/);
});

test("scénario vitesse-onde : l'énoncé embarque le bloc [[jsxgraph]] du sismogramme", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assert.match(q.textFrag, /\[\[jsxgraph width="700px" height="300px"\]\]/);
    assert.match(q.textFrag, /\[\[\/jsxgraph\]\]/);
    assert.match(q.textFrag, /parseFloat\("\{#q1_sis_tarr#\}"\)/);
    assert.match(q.textFrag, /parseFloat\("\{#q1_sis_heuresec#\}"\)/);
});

test("scénario vitesse-onde : qnote expose la célérité en km/s, feedbackRef référence les deux PRTs", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assert.equal(q.qnote, 'v={@q1_sis_vkms@} km/s');
    assert.match(q.feedbackRef, /\[\[feedback:prt1a\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1b\]\]/);
});

test("scénario vitesse-onde : XML complet reste bien formé", () => {
    const q = genOndeSismiqueCore(1, vitesseParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML (vitesse-onde)');
    assertBalancedTags(q.inputXML, 'inputXML (vitesse-onde)');
});

// ── Builder JSXGraph pur (_sisSeismogramJSX / _sisComputeGraphBounds) ───
test("_sisComputeGraphBounds : calcule xMax/tickStep en fonction de la plus grande date d'arrivée configurée", () => {
    const b = _sisComputeGraphBounds('40,60,80,100,120,140,160,180');
    assert.equal(b.tickStep, 20);
    assert.ok(b.xMax > 180, 'xMax doit dépasser la plus grande date d\'arrivée pour laisser de la marge');
});

test("_sisComputeGraphBounds : valeur par défaut raisonnable si la liste est vide/invalide", () => {
    const b = _sisComputeGraphBounds('');
    assert.equal(b.tickStep, 20);
    assert.ok(b.xMax > 0);
});

test("_sisSeismogramJSX : retourne un bloc [[jsxgraph]] complet avec le cfg.tarrExpr et cfg.heureSecExpr injectés", () => {
    const block = _sisSeismogramJSX({ tarrExpr: '80', heureSecExpr: '22325', xMax: 160, tickStep: 20, width: 700, height: 300 });
    assert.match(block, /^\[\[jsxgraph width="700px" height="300px"\]\]/);
    assert.match(block, /\[\[\/jsxgraph\]\]$/);
    assert.match(block, /parseFloat\("80"\)/);
    assert.match(block, /parseFloat\("22325"\)/);
    assert.match(block, /JXG\.JSXGraph\.initBoard\(divid,/);
});

test("_sisSeismogramJSX : l'axe des temps affiche une VRAIE heure locale (fmtClock), pas un axe relatif en secondes", () => {
    const block = _sisSeismogramJSX({ tarrExpr: '80', heureSecExpr: '22325', xMax: 160, tickStep: 20, width: 700, height: 300 });
    assert.match(block, /var heureSec=parseFloat\("22325"\);/);
    assert.match(block, /function fmtClock\(totalSec\)/);
    assert.match(block, /fmtClock\(heureSec\+kk\)/);
    assert.match(block, /"Heure locale"/);
});
