// Tests unitaires du cœur pur de gen-nomenclature.js (genNomenclatureCore).
//
// Lancer :  npm test
//
// genNomenclatureCore() ne lit jamais document : les 3 modes (fixe/aleatoire/checkbox)
// sont couverts séparément, cf. les 3 gabarits XML autonomes validés en Maxima réel
// (test/mise à jour/Physique-chimie/nomenclature/nomenclature-type{1,2,3}-*.xml).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genNomenclatureCore, NOM_DONNES, _nomFamilies } = require(path.join('..', '..', 'js', 'gen-nomenclature.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

const escapeMaximaString = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
// Stub I18N minimal : suffisant pour genNomenclatureCore, qui n'utilise que t().
const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const DEPS = { buildPrtXml, escapeMaximaString, I18N: I18N_STUB };

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

test('NOM_DONNES contient bien des triples [famille, nom, smiles] non vides', () => {
    assert.ok(NOM_DONNES.length > 50);
    NOM_DONNES.forEach((m) => {
        assert.equal(m.length, 3);
        assert.ok(m[0] && m[1] && m[2]);
    });
});

test('_nomFamilies() renvoie une liste triée sans doublons', () => {
    const fams = _nomFamilies();
    const uniq = Array.from(new Set(fams));
    assert.equal(fams.length, uniq.length);
    const sorted = [...fams].sort((a, b) => a.localeCompare(b, 'fr'));
    assert.deepEqual(fams, sorted);
});

// ── Mode Fixe (molécule imposée, RegExp tolérant) ──────────────────────────
function fixeParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Nommez cette molécule.</p>', mode: 'fixe',
        fixeSmiles: 'CC(C)CC(C)(C)C',
        fixeNom: '2,2,4-triméthylpentane',
        fixeFamille: 'Alcanes',
        fbGen: ''
    }, overrides || {});
}

test('mode fixe : vars contient smiles_dessin/nom_attendu/famille_attendue suffixés par X', () => {
    const q = genNomenclatureCore(3, fixeParams(), DEPS);
    assert.match(q.vars, /smiles_dessin3 : "CC\(C\)CC\(C\)\(C\)C"\$/);
    assert.match(q.vars, /nom_attendu3 : "2,2,4-triméthylpentane"\$/);
    assert.match(q.vars, /famille_attendue3 : "Alcanes"\$/);
});

// Famille hors périmètre du décomposeur (7 familles supportées, cf. _nomDecompose) :
// sert à couvrir le repli sur l'ancien nœud RegExp tolérant unique.
function fixeParamsFallback(overrides) {
    return fixeParams(Object.assign({ fixeFamille: 'Amines', fixeNom: 'Butan-1-amine', fixeSmiles: 'CCCCN' }, overrides || {}));
}

test('mode fixe : nom non décomposable -> repli, regexify_nom construit un pattern tolérant tirets/espaces/casse', () => {
    const q = genNomenclatureCore(3, fixeParamsFallback(), DEPS);
    assert.match(q.vars, /regexify_nom3\(s\) := block/);
    assert.match(q.vars, /nom_pattern3 : regexify_nom3\(nom_attendu3\)\$/);
    // Le bug historique (ssubst séquentiels qui se recapturent) produisait "[-[- ]?]?" :
    // on vérifie qu'on reste bien sur le pattern caractère-par-caractère correct.
    assert.ok(!q.vars.includes('[-[- ]?]?'));
});

test('mode fixe : nom non décomposable -> repli sur un seul PRT, answertest RegExp, truescore 1 falsescore 0', () => {
    const q = genNomenclatureCore(3, fixeParamsFallback(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].answertest, 'RegExp');
    assert.equal(q.prt.nodes[0].sans, 'ans3');
    assert.equal(q.prt.nodes[0].tans, 'nom_pattern3');
    assert.equal(q.prt.nodes[0].truescore, '1');
    assert.equal(q.prt.nodes[0].falsescore, '0');
});

test('mode fixe : nom décomposable (cas par défaut) -> 5 nœuds PRT critères (famille/longueur/subs/numero/ordre), poids bareme/5', () => {
    const q = genNomenclatureCore(3, fixeParams(), DEPS);
    assert.equal(q.prt.nodes.length, 5);
    assert.deepEqual(q.prt.nodes.map((n) => n.description), ['famille', 'longueur', 'subs', 'numero', 'ordre']);
    q.prt.nodes.forEach((n) => {
        assert.equal(n.answertest, 'AlgEquiv');
        assert.equal(n.truescore, '0.2');
        assert.equal(n.falsescore, '0');
    });
    assert.equal(q.prt.nodes[0].sans, 'crit_famille3');
    for (let i = 0; i < 4; i++) {
        assert.equal(q.prt.nodes[i].truenextnode, String(i + 1));
        assert.equal(q.prt.nodes[i].falsenextnode, String(i + 1));
    }
    assert.equal(q.prt.nodes[4].truenextnode, '-1');
    assert.equal(q.prt.nodes[4].falsenextnode, '-1');
    assert.match(q.vars, /longueur_ref3 : 5\$/);
    assert.match(q.vars, /crit_famille3 : is\(famille_s3 = famille_attendue3\)\$/);
});

test('mode fixe : famille Esters -> 6 nœuds PRT (ajoute le critère alkyle), poids bareme/6', () => {
    const q = genNomenclatureCore(3, fixeParams({ fixeFamille: 'Esters', fixeNom: "Éthanoate d'éthyle", fixeSmiles: 'CC(=O)OCC' }), DEPS);
    assert.equal(q.prt.nodes.length, 6);
    assert.deepEqual(q.prt.nodes.map((n) => n.description), ['famille', 'longueur', 'subs', 'numero', 'ordre', 'alkyle']);
    q.prt.nodes.forEach((n) => assert.equal(n.truescore, '0.16666666666666666'));
    assert.equal(q.prt.nodes[5].truenextnode, '-1');
    assert.match(q.vars, /alkyle_ref3 : 2\$/);
});

test('mode fixe : les guillemets dans les champs teachers sont échappés', () => {
    const q = genNomenclatureCore(1, fixeParamsFallback({ fixeNom: 'Nom avec "guillemets"' }), DEPS);
    assert.match(q.vars, /Nom avec \\"guillemets\\"/);
});

test('mode fixe : XML bien formé (prtXML, inputXML) - cas décomposable et cas repli', () => {
    const q = genNomenclatureCore(3, fixeParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
    const qFallback = genNomenclatureCore(3, fixeParamsFallback(), DEPS);
    assertBalancedTags(qFallback.prtXML, 'prtXML (repli)');
    assertBalancedTags(qFallback.inputXML, 'inputXML (repli)');
});

// ── Mode Aléatoire (générateur filtré famille + carbones) ──────────────────
function aleaParams(overrides) {
    return Object.assign({
        bareme: 2, text: '<p>Identifiez cette molécule.</p>', mode: 'aleatoire',
        paramFamilles: ['Alcanes'], paramCarbonesMax: '4', fbGen: ''
    }, overrides || {});
}

test('mode aléatoire : pool donnes + filtre famille/carbones + repli si vide', () => {
    const q = genNomenclatureCore(2, aleaParams(), DEPS);
    assert.match(q.vars, /donnes2 : \[/);
    assert.match(q.vars, /param_familles2 : \["Alcanes"\]\$/);
    assert.match(q.vars, /param_carbones_max2 : 4\$/);
    assert.match(q.vars, /donnes_filtres2 : sublist\(donnes2,/);
    assert.match(q.vars, /donnes_pool2 : if filtre_vide2 then donnes2 else donnes_filtres2\$/);
});

test('mode aléatoire : param_carbones_max vide -> false (pas de limite)', () => {
    const q = genNomenclatureCore(2, aleaParams({ paramCarbonesMax: '' }), DEPS);
    assert.match(q.vars, /param_carbones_max2 : false\$/);
});

test('mode aléatoire : plusieurs familles cochées -> liste Maxima à plusieurs entrées, filtre par elementp', () => {
    const q = genNomenclatureCore(2, aleaParams({ paramFamilles: ['Alcanes', 'Esters'] }), DEPS);
    assert.match(q.vars, /param_familles2 : \["Alcanes","Esters"\]\$/);
    assert.match(q.vars, /elementp\(m\[1\], setify\(param_familles2\)\)/);
});

test('mode aléatoire : aucune famille cochée -> param_familles vide = aucun filtre (repli sur donnes complet)', () => {
    const q = genNomenclatureCore(2, aleaParams({ paramFamilles: [] }), DEPS);
    assert.match(q.vars, /param_familles2 : \[\]\$/);
    assert.match(q.vars, /param_familles2 = \[\] or elementp/);
});

test('mode aléatoire : compat rétro paramFamille (singulier, ancien format) converti en tableau', () => {
    const q = genNomenclatureCore(2, { bareme: 2, text: '', mode: 'aleatoire', paramFamille: 'Esters', paramCarbonesMax: '', fbGen: '' }, DEPS);
    assert.match(q.vars, /param_familles2 : \["Esters"\]\$/);
});

test('mode aléatoire : compat rétro paramFamille="Toutes" converti en liste vide (aucun filtre)', () => {
    const q = genNomenclatureCore(2, { bareme: 2, text: '', mode: 'aleatoire', paramFamille: 'Toutes', paramCarbonesMax: '', fbGen: '' }, DEPS);
    assert.match(q.vars, /param_familles2 : \[\]\$/);
});

test('mode aléatoire : deux entrées (nom + famille) et deux inputs ans2n/ans2f', () => {
    const q = genNomenclatureCore(2, aleaParams(), DEPS);
    assert.match(q.inputXML, /<name>ans2n<\/name>/);
    assert.match(q.inputXML, /<name>ans2f<\/name>/);
    assert.match(q.inputXML, /<type>dropdown<\/type>/);
});

test('mode aléatoire : PRT à 6 nœuds critères (longueur/subs/numero/ordre/alkyle/famille) cumulant bareme/6 chacun, chaînage jusqu\'au dernier', () => {
    const q = genNomenclatureCore(2, aleaParams(), DEPS);
    assert.equal(q.prt.nodes.length, 6);
    assert.deepEqual(q.prt.nodes.map((n) => n.description), ['longueur', 'subs', 'numero', 'ordre', 'alkyle', 'famille']);
    q.prt.nodes.forEach((n) => {
        assert.equal(n.truescore, '0.3333333333333333');
        assert.equal(n.falsescore, '0');
    });
    for (let i = 0; i < 5; i++) {
        assert.equal(q.prt.nodes[i].truenextnode, String(i + 1));
        assert.equal(q.prt.nodes[i].falsenextnode, String(i + 1));
    }
    assert.equal(q.prt.nodes[5].truenextnode, '-1');
    assert.equal(q.prt.nodes[5].falsenextnode, '-1');
    assert.equal(q.prt.nodes[5].answertest, 'String');
    assert.equal(q.prt.nodes[5].sans, 'ans2f');
    assert.equal(q.prt.nodes[5].tans, 'famille2');
});

test('mode aléatoire : donnes_decomp précalculé + refs indexées par choix2', () => {
    const q = genNomenclatureCore(2, aleaParams(), DEPS);
    assert.match(q.vars, /donnes_decomp2 : \[/);
    assert.match(q.vars, /decomp_ref2 : donnes_decomp2\[choix2\]\$/);
    assert.match(q.vars, /longueur_ref2 : decomp_ref2\[1\]\$/);
    assert.match(q.vars, /alkyle_ref2 : decomp_ref2\[5\]\$/);
    assert.match(q.vars, /crit_alkyle2 : is\(alkyle_ref2 = false or alkyle_s2 = alkyle_ref2\)\$/);
});

test('mode aléatoire : XML bien formé (prtXML, inputXML)', () => {
    const q = genNomenclatureCore(2, aleaParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});

// ── Mode Checkbox (analyse fonctionnelle, groupes vrais/faux) ──────────────
function cbParams(overrides) {
    return Object.assign({
        bareme: 1, text: '<p>Cochez les groupes présents.</p>', mode: 'checkbox',
        cbSmiles: 'NC(CC(=O)O)C',
        cbVrais: 'Amine, Acide carboxylique',
        cbFaux: 'Alcool, Aldéhyde, Ester',
        fbGen: ''
    }, overrides || {});
}

test('mode checkbox : groupes_vrais/groupes_faux découpés et échappés en listes Maxima', () => {
    const q = genNomenclatureCore(5, cbParams(), DEPS);
    assert.match(q.vars, /groupes_vrais5 : \["Amine","Acide carboxylique"\]\$/);
    assert.match(q.vars, /groupes_faux5 : \["Alcool","Aldéhyde","Ester"\]\$/);
});

test('mode checkbox : tans_checkbox = triples [nom, elementp(...), nom] mélangés', () => {
    const q = genNomenclatureCore(5, cbParams(), DEPS);
    assert.match(q.vars, /tous_groupes5 : random_permutation\(append\(groupes_vrais5, groupes_faux5\)\)\$/);
    assert.match(q.vars, /tans_checkbox5 : map\(lambda\(\[g\], \[g, elementp\(g, setify\(groupes_vrais5\)\), g\]\), tous_groupes5\)\$/);
});

test('mode checkbox : feedbackvariables calculent score set-theory (nv/nf/sc/pct)', () => {
    const q = genNomenclatureCore(5, cbParams(), DEPS);
    assert.match(q.prt.meta.feedbackvariables, /nv5 : cardinality\(intersection\(setify\(idx5\), setify\(bons5\)\)\)\$/);
    assert.match(q.prt.meta.feedbackvariables, /sc5 : if den5 > 0 then max\(0, float\(\(nv5-nf5\)\/den5\)\) else 0\$/);
});

test('mode checkbox : un seul PRT, AlgEquiv, truescore 1 / falsescore sc{X}', () => {
    const q = genNomenclatureCore(5, cbParams(), DEPS);
    assert.equal(q.prt.nodes.length, 1);
    assert.equal(q.prt.nodes[0].answertest, 'AlgEquiv');
    assert.equal(q.prt.nodes[0].truescore, '1');
    assert.equal(q.prt.nodes[0].falsescore, 'sc5');
});

test('mode checkbox : XML bien formé (prtXML, inputXML)', () => {
    const q = genNomenclatureCore(5, cbParams(), DEPS);
    assertBalancedTags(q.prtXML, 'prtXML');
    assertBalancedTags(q.inputXML, 'inputXML');
});

test('les 3 modes produisent des vars différentes pour le même X', () => {
    const qFixe = genNomenclatureCore(9, fixeParams(), DEPS);
    const qAlea = genNomenclatureCore(9, aleaParams(), DEPS);
    const qCb = genNomenclatureCore(9, cbParams(), DEPS);
    assert.notEqual(qFixe.vars, qAlea.vars);
    assert.notEqual(qAlea.vars, qCb.vars);
    assert.notEqual(qFixe.vars, qCb.vars);
});
