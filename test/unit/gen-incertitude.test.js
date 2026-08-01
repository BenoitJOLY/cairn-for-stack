// Tests unitaires du cœur pur de gen-incertitude.js (genIncertitudeCore).
//
// Lancer :  npm test
//
// genIncertitudeCore() ne lit jamais document : tout est passé en p (voir
// genIncertitude(X), seul point de contact avec le DOM). Contrairement aux
// autres générateurs, les helpers Maxima purs (js/gen-incertitude-calc.js)
// et les définitions d'étapes (js/gen-incertitude-steps.js) sont appelés en
// GLOBAL BARE (pas de deps.xxx || xxx pour ceux-là — voir commentaire dans
// gen-incertitude.js) car en navigateur tous les <script> partagent le même
// scope window. En Node, chaque require() a son propre scope de module : on
// republie donc ces fonctions sur `global` avant d'appeler genIncertitudeCore,
// exactement comme test/unit/gen-math-complexe.test.js le fait pour
// _cpxGenFbgen.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { genIncertitudeCore, INC_STEP_ORDER } = require(path.join('..', '..', 'js', 'gen-incertitude.js'));
const { _incTypeAVars, _incTypeBVars, _incRoundingVars, _incFinalRegex } = require(path.join('..', '..', 'js', 'gen-incertitude-calc.js'));
const { _incStepDefs } = require(path.join('..', '..', 'js', 'gen-incertitude-steps.js'));
const { _incStudentFactor, _incStudentConfidence, _incStudentDf } = require(path.join('..', '..', 'js', 'gen-incertitude-student.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global._incTypeAVars = _incTypeAVars;
global._incTypeBVars = _incTypeBVars;
global._incRoundingVars = _incRoundingVars;
global._incFinalRegex = _incFinalRegex;
global._incStepDefs = _incStepDefs;
global._incStudentFactor = _incStudentFactor;
global._incStudentConfidence = _incStudentConfidence;
global._incStudentDf = _incStudentDf;

const I18N_STUB = {
    t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key
};
const _mkInput = (o) => `    <input><name>${o.name}</name><tans>${o.tans}</tans></input>`;
const _mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;

const DEPS = { I18N: I18N_STUB, buildPrtXml, _mkInput, _mkFbGen, applyFbBox, escapeMaximaString };

function baseParams(overrides) {
    return Object.assign({
        bareme: 7,
        context: { grandeur: 'Longueur', symbole: 'L', unite: 'cm', intro: '' },
        typeA: { mode: 'manuel', data: [12.3, 12.5, 12.2, 12.4, 12.6], moyenneVraie: '', ecartTypePop: '', n: 0, decimales: 2 },
        typeB: { source: 'resolution', q: '0.1', delta: '', ucert: '', kcert: '', valeur: '' },
        rounding: { sigfig: 1, roundup: false, k: 1 },
        steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: true, ecriture: true },
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

// ── Type A ──────────────────────────────────────────────────────────────
test("Type A manuel : liste littérale + moyenne/s/uA calculés sur q1_L", () => {
    const q = genIncertitudeCore(1, baseParams(), DEPS);
    assert.match(q.vars, /q1_L:\[12\.3,12\.5,12\.2,12\.4,12\.6\];/);
    assert.match(q.vars, /q1_n:length\(q1_L\);/);
    assert.match(q.vars, /q1_moy:float\(mean\(q1_L\)\);/);
    assert.match(q.vars, /q1_s:float\(sqrt\(sum\(\(q1_L\[i\]-q1_moy\)\^2,i,1,q1_n\)\/\(q1_n-1\)\)\);/);
    assert.match(q.vars, /q1_uA:float\(q1_s\/sqrt\(q1_n\)\);/);
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("Type A manuel : moins de 2 mesures lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeA: { mode: 'manuel', data: [12.3] } }), DEPS), /au moins 2 mesures/);
});

test("Type A aléatoire : bruit uniforme calibré sur amp=sigma*sqrt(3)", () => {
    const p = baseParams({ typeA: { mode: 'aleatoire', moyenneVraie: '10', ecartTypePop: '0.5', n: 8, decimales: 2 } });
    const q = genIncertitudeCore(1, p, DEPS);
    assert.match(q.vars, /q1_amp:float\(0\.5\*sqrt\(3\)\);/);
    assert.match(q.vars, /q1_L:makelist\(float\(round\(\(10-q1_amp\+ri1\(0,q1_scaleN1\)\/10\^2\)\*10\^2\)\/10\^2\),i,1,8\);/);
});

test("Type A aléatoire : la somme finale est arrondie à d décimales (amp=sigma*sqrt(3) irrationnel sinon)", () => {
    const p = baseParams({ typeA: { mode: 'aleatoire', moyenneVraie: '10', ecartTypePop: '0.5', n: 8, decimales: 3 } });
    const q = genIncertitudeCore(1, p, DEPS);
    // La somme (moy-amp+bruit) doit être explicitement arrondie à 10^3 avant d'être
    // redivisée par 10^3 — sinon amp (irrationnel) fait fuiter sa pleine précision
    // float dans chaque mesure générée (bug réel : 10 chiffres après la virgule).
    assert.match(q.vars, /q1_L:makelist\(float\(round\(\(10-q1_amp\+ri1\(0,q1_scaleN1\)\/10\^3\)\*10\^3\)\/10\^3\),i,1,8\);/);
});

test("Type A aléatoire : champs manquants (moyenne/écart-type/n) lèvent une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeA: { mode: 'aleatoire', moyenneVraie: '10' } }), DEPS), /obligatoires/);
});

// ── Type B (4 sources) ──────────────────────────────────────────────────
test("Type B 'resolution' : uB = q/sqrt(12)", () => {
    const q = genIncertitudeCore(1, baseParams({ typeB: { source: 'resolution', q: '0.1' } }), DEPS);
    assert.match(q.vars, /q1_uB:float\(0\.1\/sqrt\(12\)\);/);
});

test("Type B 'resolution' : q manquant lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'resolution', q: '' } }), DEPS), /résolution/);
});

test("Type B 'tolerance' : uB = delta/sqrt(3)", () => {
    const q = genIncertitudeCore(1, baseParams({ typeB: { source: 'tolerance', delta: '0.2' } }), DEPS);
    assert.match(q.vars, /q1_uB:float\(0\.2\/sqrt\(3\)\);/);
});

test("Type B 'tolerance' : delta manquant lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'tolerance', delta: '' } }), DEPS), /tolérance/);
});

test("Type B 'calibration' : uB = ucert/kcert", () => {
    const q = genIncertitudeCore(1, baseParams({ typeB: { source: 'calibration', ucert: '0.05', kcert: '2' } }), DEPS);
    assert.match(q.vars, /q1_uB:float\(0\.05\/2\);/);
});

test("Type B 'calibration' : ucert ou kcert manquant lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'calibration', ucert: '0.05', kcert: '' } }), DEPS), /Ucertificat et kcertificat/);
});

test("Type B 'impose' : uB = valeur littérale", () => {
    const q = genIncertitudeCore(1, baseParams({ typeB: { source: 'impose', valeur: '0.03' } }), DEPS);
    assert.match(q.vars, /q1_uB:float\(0\.03\);/);
});

test("Type B 'impose' : valeur manquante lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'impose', valeur: '' } }), DEPS), /uB est obligatoire/);
});

test("Type B 'propagation' : Y = produit des termes (dénominateur -> exposant -1), uB = Y*sqrt(Σ(u/x)²)", () => {
    const q = genIncertitudeCore(1, baseParams({
        typeB: { source: 'propagation', propTerms: [
            { value: '20', incert: '0.1', denom: false },
            { value: '10', incert: '0.05', denom: false },
            { value: '50', incert: '0.2', denom: true }
        ] }
    }), DEPS);
    assert.match(q.vars, /q1_propY:float\(\(20\)\^1\*\(10\)\^1\*\(50\)\^-1\);/);
    assert.match(q.vars, /q1_uB:float\(q1_propY\*sqrt\(\(\(0\.1\)\/\(20\)\)\^2\+\(\(0\.05\)\/\(10\)\)\^2\+\(\(0\.2\)\/\(50\)\)\^2\)\);/);
});

test("Type B 'propagation' : aucun terme valide lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'propagation', propTerms: [] } }), DEPS), /au moins un terme/);
    assert.throws(() => genIncertitudeCore(1, baseParams({ typeB: { source: 'propagation', propTerms: [{ value: '20', incert: '' }] } }), DEPS), /au moins un terme/);
});

// ── Arrondi GUM : sigfig / arrondi par excès / k ────────────────────────
test("sigfig=1 vs sigfig=2 change l'exposant d'arrondi", () => {
    const q1 = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: false, k: 1 } }), DEPS);
    assert.match(q1.vars, /q1_exp:floor\(log\(q1_U_brut\)\/log\(10\)\)-\(1-1\);/);
    const q2 = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 2, roundup: false, k: 1 } }), DEPS);
    assert.match(q2.vars, /q1_exp:floor\(log\(q1_U_brut\)\/log\(10\)\)-\(2-1\);/);
});

test("arrondi par excès (roundup) utilise ceiling() au lieu de round()", () => {
    const off = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: false, k: 1 } }), DEPS);
    assert.match(off.vars, /q1_U:float\(round\(q1_U_brut\/q1_scale\)\*q1_scale\);/);
    const on = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: true, k: 1 } }), DEPS);
    assert.match(on.vars, /q1_U:float\(ceiling\(q1_U_brut\/q1_scale\)\*q1_scale\);/);
});

test("facteur d'élargissement k=1 vs k=2", () => {
    const k1 = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: false, k: 1 } }), DEPS);
    assert.match(k1.vars, /q1_k:1;/);
    const k2 = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: false, k: 2 } }), DEPS);
    assert.match(k2.vars, /q1_k:2;/);
});

// ── Facteur de Student ───────────────────────────────────────────────────
test("_incStudentFactor : table t bilatérale, n=10 (ν=9) à 95% → 2.262", () => {
    assert.equal(_incStudentFactor(10, 95), 2.262);
});

test("_incStudentFactor : n>30 plafonne à ν=30 (convergence loi normale)", () => {
    assert.equal(_incStudentFactor(41, 95), _incStudentFactor(31, 95));
    assert.equal(_incStudentFactor(41, 95), 2.042);
});

test("_incStudentConfidence : valeur inconnue/absente retombe sur 95%", () => {
    assert.equal(_incStudentConfidence(undefined), 95);
    assert.equal(_incStudentConfidence(80), 95);
    assert.equal(_incStudentConfidence(90), 90);
    assert.equal(_incStudentConfidence(99), 99);
});

test("Student désactivé (par défaut) : q1_k reste le littéral k choisi, pas de régression", () => {
    const q = genIncertitudeCore(1, baseParams({ rounding: { sigfig: 1, roundup: false, k: 2 } }), DEPS);
    assert.match(q.vars, /q1_k:2;/);
});

test("Student activé : q1_k utilise la valeur de table (n=10 manuel → data.length, 95% → 2.262)", () => {
    const p = baseParams({
        typeA: { mode: 'manuel', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        rounding: { sigfig: 1, roundup: false, k: 1, studentEnabled: true, confidence: 95 }
    });
    const q = genIncertitudeCore(1, p, DEPS);
    assert.match(q.vars, /q1_k:2\.262;/);
});

test("Student activé : n dérivé du champ 'n' en mode aléatoire, 90% → table 90%", () => {
    const p = baseParams({
        typeA: { mode: 'aleatoire', moyenneVraie: '10', ecartTypePop: '0.5', n: 15, decimales: 2 },
        rounding: { sigfig: 1, roundup: false, k: 1, studentEnabled: true, confidence: 90 }
    });
    const q = genIncertitudeCore(1, p, DEPS);
    // n=15 → ν=14 → table[90][13] = 1.761
    assert.match(q.vars, /q1_k:1\.761;/);
});

// ── Étapes cochables : isolation + comptage ─────────────────────────────
test("chaque étape cochée isolément produit exactement 1 <prt> et hérite du barème complet", () => {
    INC_STEP_ORDER.forEach((key) => {
        const steps = {};
        INC_STEP_ORDER.forEach((k) => { steps[k] = (k === key); });
        const q = genIncertitudeCore(1, baseParams({ steps }), DEPS);
        const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
        assert.equal(prtCount, 1, `étape '${key}' : attendu 1 <prt>, obtenu ${prtCount}`);
        assert.equal(q.prts.length, 1);
        assert.equal(q.prts[0].meta.value, (7).toFixed(7), `étape '${key}' seule doit recevoir tout le barème`);
        assertBalancedTags(q.prtXML, `prtXML (${key})`);
        assertBalancedTags(q.inputXML, `inputXML (${key})`);
    });
});

test("N étapes cochées → N blocs <prt> distincts, barème réparti également", () => {
    const steps = { moyenne: true, s: true, uA: true, uB: false, uc: false, U: true, ecriture: false };
    const q = genIncertitudeCore(1, baseParams({ steps }), DEPS);
    const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
    assert.equal(prtCount, 4);
    assert.equal(q.prts.length, 4);
    const expectedShare = (7 / 4).toFixed(7);
    q.prts.forEach((prt) => assert.equal(prt.meta.value, expectedShare));
    assert.match(q.feedbackRef, /\[\[feedback:prt1_moy\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1_s\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1_uA\]\]/);
    assert.match(q.feedbackRef, /\[\[feedback:prt1_U\]\]/);
    assert.doesNotMatch(q.feedbackRef, /prt1_uB/);
    assert.doesNotMatch(q.feedbackRef, /prt1_ecr/);
});

test("aucune étape cochée lève une erreur explicite", () => {
    const steps = { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false };
    assert.throws(() => genIncertitudeCore(1, baseParams({ steps }), DEPS), /err_no_step/);
});

// ── Affichage des mesures : liste (défaut) vs tableau ────────────────────
test("display par défaut ('liste') : mesures en LaTeX inline via q1_L", () => {
    const q = genIncertitudeCore(1, baseParams(), DEPS);
    assert.match(q.textFrag, /\\\( \{@q1_L@\}[^)]*\\\)/);
    assert.doesNotMatch(q.textFrag, /<table/);
});

test("display='tableau' : une cellule par mesure via q1_L[i], une par donnée manuelle", () => {
    const q = genIncertitudeCore(1, baseParams({ display: 'tableau' }), DEPS);
    assert.match(q.textFrag, /<table[^>]*><tr>/);
    assert.match(q.textFrag, /\\\( \{@q1_L\[1\]@\}[^)]*\\\)/);
    assert.match(q.textFrag, /\\\( \{@q1_L\[5\]@\}[^)]*\\\)/);
    assert.equal((q.textFrag.match(/<td/g) || []).length, 5);
});

test("display='tableau' en mode aléatoire : nombre de cellules = n", () => {
    const q = genIncertitudeCore(1, baseParams({
        display: 'tableau',
        typeA: { mode: 'aleatoire', moyenneVraie: '10', ecartTypePop: '0.5', n: 8, decimales: 2 }
    }), DEPS);
    assert.equal((q.textFrag.match(/<td/g) || []).length, 8);
});

// ── Tolérance configurable (étape Moyenne) ──────────────────────────────
test("tolérance Moyenne : défaut 0.01 préservé quand p.moyenneTolerance absent", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false } }), DEPS);
    assert.match(q.prtXML, /<testoptions>0\.01<\/testoptions>/);
});

test("tolérance Moyenne : surcharge personnalisée (2%) reflétée dans le PRT", () => {
    const q = genIncertitudeCore(1, baseParams({
        moyenneTolerance: 0.02,
        steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false }
    }), DEPS);
    assert.match(q.prtXML, /<testoptions>0\.02<\/testoptions>/);
});

// ── Écriture finale (regex) ──────────────────────────────────────────────
test("étape 'ecriture' : regex tolérante ± / +/- / +- et unité optionnelle", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), DEPS);
    assert.match(q.vars, /q1_ecr_regex:sconcat\(/);
    assert.match(q.vars, /\\\\\+\/-\|\\\\\+-\|±/);
    assert.match(q.inputXML, /ans_ecr1/);
    assert.match(q.textFrag, /ans_ecr1/);
});

test("XML complet (toutes étapes cochées) reste bien formé", () => {
    const steps = {};
    INC_STEP_ORDER.forEach((k) => { steps[k] = true; });
    const q = genIncertitudeCore(1, baseParams({ steps }), DEPS);
    assert.equal((q.prtXML.match(/<prt>/g) || []).length, INC_STEP_ORDER.length);
    assertBalancedTags(q.prtXML, 'prtXML (toutes étapes)');
    assertBalancedTags(q.inputXML, 'inputXML (toutes étapes)');
    assertBalancedTags(q.textFrag, 'textFrag (toutes étapes)');
});
