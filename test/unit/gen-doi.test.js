// Tests unitaires du cœur pur de js/doi.js (genDOICore).
//
// Lancer :  npm test
//
// genDOICore() ne lit jamais document/canvas : tout est passé en p, y compris
// correctionImg déjà rendue côté navigateur (voir _doiBuildParams(), seul
// point de contact avec le DOM — même principe que genChemicalTopoParams()).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genDOICore } = require(path.join('..', '..', 'js', 'doi.js'));

const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
const I18N_STUB = { t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key };

const DEPS = { _mkFbGen, I18N: I18N_STUB };

function baseParams(overrides) {
    const objects = [
        { name: 'Terre', type: 'gravitationnel' },
        { name: 'Air', type: 'contact' },
        { name: 'Tremplin', type: 'intrus' }
    ];
    return Object.assign({
        bareme: 2,
        text: '<p>Énoncé</p>',
        mainObj: 'Skieur',
        extraZones: 0,
        objects: objects,
        rawConfig: { mainObj: 'Skieur', extraZones: 0, objects: objects },
        correctionImg: '<img src="data:image/png;base64,AAAA">',
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

test('qnote et vars Maxima reprennent le système, les interagissants et les intrus', () => {
    const q = genDOICore(1, baseParams(), DEPS);
    assert.equal(q.qnote, 'DOI : Skieur');
    assert.match(q.vars, /objet_systeme: "Skieur";/);
    assert.match(q.vars, /liste_interagissants: \["Terre","Air"\];/);
    assert.match(q.vars, /liste_intrus: \["Tremplin"\];/);
});

test('la réponse modèle place le système, les interagissants puis marque les intrus (nip, minuscules, sans espace)', () => {
    const q = genDOICore(1, baseParams(), DEPS);
    const tans = q.inputXML.match(/<tans><!\[CDATA\["(.*)"\]\]><\/tans>/)[1];
    assert.match(tans, /^center:Skieur\|blue0:Terre\|blue1:Air\|\|/);
    assert.match(tans, /niptremplin$/);
});

test('extraZones ajoute des emplacements bleus vides dans la réponse modèle', () => {
    const q = genDOICore(1, baseParams({ extraZones: 2 }), DEPS);
    const tans = q.inputXML.match(/<tans><!\[CDATA\["(.*)"\]\]><\/tans>/)[1];
    assert.match(tans, /blue2:\|blue3:\|\|/);
});

test("sans intrus, la partie 'poubelle' de la réponse modèle est vide et all_intrus_ok vaut true", () => {
    const q = genDOICore(1, baseParams({
        objects: [{ name: 'Terre', type: 'gravitationnel' }]
    }), DEPS);
    assert.match(q.prtXML, /all_intrus_ok: true;/);
    assert.doesNotMatch(q.inputXML, /nip/);
});

test('le PRT1 (système/objets/flèches) a 3 nœuds, le PRT2 (intrus) en a 1', () => {
    const q = genDOICore(1, baseParams(), DEPS);
    const [prt1, prt2] = q.prtXML.split('\n\n');
    assert.match(prt1, /<name>prt1_1<\/name>/);
    assert.match(prt2, /<name>prt1_2<\/name>/);
    assert.equal((prt1.match(/<node>/g) || []).length, 3);
    assert.equal((prt2.match(/<node>/g) || []).length, 1);
});

test('le barème total (0.5+0.5+1.0 puis 1.0) est réparti entre les deux PRT', () => {
    const q = genDOICore(1, baseParams({ bareme: 3 }), DEPS);
    assert.equal(q.bareme, 3);
    assert.match(q.prtXML, /<truescore>0\.5<\/truescore>[\s\S]*<truescore>0\.5<\/truescore>[\s\S]*<truescore>1\.0<\/truescore>/);
});

test('generalFeedback intègre correctionImg et fbGen via deps._mkFbGen', () => {
    const q = genDOICore(1, baseParams({ fbGen: 'Remarque du prof' }), DEPS);
    assert.match(q.generalFeedback, /data:image\/png;base64,AAAA/);
    assert.match(q.generalFeedback, /Remarque du prof/);
});

test('rawConfig et correctionImg sont transmis tels quels (identité), pas recalculés', () => {
    const p = baseParams();
    const q = genDOICore(1, p, DEPS);
    assert.equal(q.rawConfig, p.rawConfig);
    assert.equal(q.correctionImg, p.correctionImg);
});

test('diagNodes expose les 4 nœuds de diagnostic (système, interagissants, contact, intrus)', () => {
    const q = genDOICore(1, baseParams(), DEPS);
    assert.equal(q.diagNodes.length, 4);
});

test('le XML (prtXML, inputXML) est bien formé avec et sans intrus/extraZones', () => {
    [
        baseParams(),
        baseParams({ extraZones: 2 }),
        baseParams({ objects: [{ name: 'Terre', type: 'gravitationnel' }] }),
        baseParams({ objects: [] })
    ].forEach((p, i) => {
        const q = genDOICore(1, p, DEPS);
        assertBalancedTags(q.prtXML, `prtXML[${i}]`);
        assertBalancedTags(q.inputXML, `inputXML[${i}]`);
    });
});
