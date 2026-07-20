// Tests unitaires du cœur pur de gen-redox.js (genRedoxCore).
//
// Lancer :  node --test test/unit
//
// Ces tests n'ont besoin ni de navigateur ni de DOM : genRedoxCore() ne lit
// jamais document/localStorage, on lui passe tout en paramètres explicites
// (voir js/gen-redox.js — commentaire au-dessus de genRedoxCore).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genRedoxCore } = require(path.join('..', '..', 'js', 'gen-redox.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

// Stub I18N minimal : suffisant pour genRedoxCore, qui n'utilise que t().
const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, mkFbGen };

// Jeu de paramètres de référence : MnO4-/Mn2+ (n1=5) titrant Fe2+/Fe3+ (n2=1).
function baseParams(overrides) {
    return Object.assign({
        rxFind: 'equivalence',
        e1: 1.51, n1: 5, e2: 0.77, n2: 1,
        c1: 0.02, c2: 0.1, v2: 20,
        titrantName: 'KMnO4',
        tolVol: 0.5, tolE: 0.05, tolC: 0.005,
        W: 500, H: 400, bareme: 1,
        fbOk: '', fbWrong: '', fbGen: '', textFrag: ''
    }, overrides || {});
}

// ── Grandeurs physiques ──────────────────────────────────────────────────
test('Veq et Eeq sont calculés correctement (Nernst)', () => {
    const q = genRedoxCore(1, baseParams(), DEPS);
    // Veq = n2*c2*v2/(n1*c1) = 1*0.1*20/(5*0.02) = 20 mL
    assert.match(q.qnote, /Veq=20\.00/);
});

test("mode 'calc' calcule C2 = n1*c1*Veq/(n2*v2)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'calc' }), DEPS);
    // Veq=20, C2 = 5*0.02*20/(1*20) = 0.1
    assert.match(q.qnote, /C2=0\.1000/);
});

// ── Cibles par mode (non-régression sur la logique de genRedoxCore) ──────
test('demi-équivalence cible V=Veq/2 et E=E°2', () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'demi' }), DEPS);
    // tans du vecteur [V, E] doit contenir V=10.0000 (Veq/2) et E=0.7700 (e2)
    assert.match(q.inputXML, /<tans>\[10\.0000, 0\.7700\]<\/tans>/);
});

test('double équivalence cible V=2*Veq et E=E°1', () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'double' }), DEPS);
    assert.match(q.inputXML, /<tans>\[40\.0000, 1\.5100\]<\/tans>/);
});

test("point d'équivalence exact cible V=Veq et E=Eeq pondéré", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'eeq' }), DEPS);
    // Eeq = (n1*e1 + n2*e2)/(n1+n2) = (5*1.51 + 1*0.77)/6 = 8.32/6 = 1.38666...
    assert.match(q.inputXML, /<tans>\[20\.0000, 1\.3867\]<\/tans>/);
});

// ── Anti-fuite de réponse ─────────────────────────────────────────────────
test("le marqueur (Veq,Eeq) est masqué en mode 'equivalence' (fuite de réponse)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'equivalence' }), DEPS);
    assert.ok(!q.textFrag.includes('board.create("point",[Veq,Eeq]'),
        'le point (Veq,Eeq) ne doit pas apparaître : il donnerait directement la réponse');
});

test("le marqueur (Veq,Eeq) est masqué en mode 'eeq' (fuite de réponse)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'eeq' }), DEPS);
    assert.ok(!q.textFrag.includes('board.create("point",[Veq,Eeq]'));
});

test("le marqueur (Veq,Eeq) est masqué en mode 'calc' (l'élève doit lire Veq lui-même)", () => {
    // Régression : avant correction, gen-redox.js affichait un board.create("text",...)
    // visible sur le graphe donnant "Veq=X mL" en clair, ce qui donnait la réponse à la
    // première étape de la question. Note : la chaîne "var Veq=20.0000;" existe toujours
    // dans le code JS interne (variable de calcul, invisible à l'élève) — on ne cible donc
    // que le texte affiché sur le graphe (board.create("text", ...)), pas toute occurrence
    // du mot "Veq=".
    const q = genRedoxCore(1, baseParams({ rxFind: 'calc' }), DEPS);
    assert.ok(!q.textFrag.includes('board.create("point",[Veq,Eeq]'));
    assert.ok(!q.textFrag.includes('"Veq="'), 'aucun texte visible ne doit révéler la valeur de Veq sur le graphe');
});

test("le marqueur (Veq,Eeq) est affiché en mode 'eo1' (ne révèle pas la cible E°1)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'eo1' }), DEPS);
    assert.ok(q.textFrag.includes('board.create("point",[Veq,Eeq]'));
});

// ── Structure du PRT (chaînage multi-nœuds) ──────────────────────────────
test("mode 'calc' produit 2 nœuds PRT chaînés (lecture Veq -> calcul C2)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'calc' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].truenextnode, '1', 'nœud 0 doit enchaîner vers le nœud 1 en cas de succès');
    assert.equal(q.prt.nodes[0].truescore, '0', 'le nœud 0 (lecture Veq) ne doit pas donner de points à lui seul');
    assert.equal(q.prt.nodes[1].truenextnode, '-1', 'le dernier nœud doit terminer l\'arbre');
    assert.equal(q.prt.nodes[1].truescore, '1', 'le nœud final doit attribuer le barème complet');
});

test("mode 'demi' (xy) produit 2 nœuds PRT chaînés (volume -> potentiel)", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'demi' }), DEPS);
    assert.equal(q.prt.nodes.length, 2);
    assert.equal(q.prt.nodes[0].truenextnode, '1');
    assert.equal(q.prt.nodes[1].truenextnode, '-1');
});

test("mode 'equivalence' (x seul) produit 1 seul nœud PRT", () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'equivalence' }), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].truenextnode, '-1');
});

// ── Bien-formation du XML produit (prtXML, inputXML) ─────────────────────
function assertBalancedTags(xml, label) {
    // Le contenu CDATA (feedback HTML : <br>, <div>, <strong>...) n'est pas de la
    // structure XML — on l'exclut du contrôle d'équilibrage des balises.
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

test('le XML du PRT est bien formé pour chaque mode', () => {
    ['equivalence', 'eo1', 'eo2', 'demi', 'double', 'eeq', 'calc'].forEach(rxFind => {
        const q = genRedoxCore(1, baseParams({ rxFind }), DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${rxFind}]`);
        assertBalancedTags(q.inputXML, `inputXML[${rxFind}]`);
    });
});

// ── Tolérances : vérifie que les champs de tolérance sont bien injectés dans Maxima ──
test('les tolérances personnalisées se retrouvent dans feedbackvariables', () => {
    const q = genRedoxCore(1, baseParams({ rxFind: 'calc', tolVol: 0.25, tolC: 0.01 }), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /<=0\.250/);
    assert.match(q.prt.meta.feedbackvariables, /<=0\.0100/);
});
