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
const { _incTypeAVars, _incTypeBVars, _incPropagationVars, _incRoundingVars, _incFinalRegex } = require(path.join('..', '..', 'js', 'gen-incertitude-calc.js'));
const { _incStepDefs } = require(path.join('..', '..', 'js', 'gen-incertitude-steps.js'));
const { _incStudentFactor, _incStudentConfidence, _incStudentDf } = require(path.join('..', '..', 'js', 'gen-incertitude-student.js'));
const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));
const { applyFbBox } = require(path.join('..', '..', 'js', 'fb-box.js'));
const { htmlEsc, escapeMaximaString } = require(path.join('..', '..', 'js', 'data.js'));

global.htmlEsc = htmlEsc;
global.escapeMaximaString = escapeMaximaString;
global._incTypeAVars = _incTypeAVars;
global._incTypeBVars = _incTypeBVars;
global._incPropagationVars = _incPropagationVars;
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

// ── Grandeur composée (propagation par dérivation partielle) ────────────
function propParams(overrides) {
    return baseParams(Object.assign({
        typeB: {
            source: 'propagation', formula: '2*%pi*sqrt(L/g)',
            propTerms: [
                { symbole: 'L', valeur: '1', incertitude: '0.01' },
                { symbole: 'g', valeur: '9.8', incertitude: '0.05' }
            ]
        },
        steps: { moyenne: true, s: false, uA: false, uB: false, uc: true, U: true, ecriture: true }
    }, overrides || {}));
}

test("Grandeur composée : pendule T=2π√(L/g) — Y0/u(Y) générés par diff() + ev(), uA forcé à 0", () => {
    const q = genIncertitudeCore(1, propParams(), DEPS);
    assert.match(q.vars, /q1_Yexpr:\(2\*%pi\*sqrt\(L\/g\)\);/);
    assert.match(q.vars, /q1_moy:float\(ev\(q1_Yexpr,L=1,g=9\.8\)\);/);
    assert.match(q.vars, /q1_uA:0;/);
    assert.match(q.vars, /q1_uB:float\(sqrt\(ev\(diff\(q1_Yexpr,L\),L=1,g=9\.8\)\^2\*\(0\.01\)\^2\+ev\(diff\(q1_Yexpr,g\),L=1,g=9\.8\)\^2\*\(0\.05\)\^2\)\);/);
    assert.match(q.vars, /q1_uc:float\(sqrt\(q1_uA\^2\+q1_uB\^2\)\);/);
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("Grandeur composée : étapes s/uA/uB absentes de _incStepDefs, moyenne sans barre", () => {
    const defs = _incStepDefs(1, 'T', 's', propParams(), I18N_STUB);
    const keys = defs.map(d => d.key);
    assert.deepEqual(keys, ['moyenne', 'uc', 'U', 'ecriture']);
    const moy = defs.find(d => d.key === 'moyenne');
    assert.match(moy.textFrag, /\\\(T=\\\)/);
    assert.doesNotMatch(moy.textFrag, /\\bar/);
});

test("Grandeur composée : formule vide lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, propParams({ typeB: { source: 'propagation', formula: '', propTerms: propParams().typeB.propTerms } }), DEPS), /formule de Y est obligatoire/);
});

test("Grandeur composée : aucune grandeur valide (terme sans symbole) lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, propParams({ typeB: { source: 'propagation', formula: '2*%pi*sqrt(L/g)', propTerms: [] } }), DEPS), /au moins une grandeur/);
    assert.throws(() => genIncertitudeCore(1, propParams({ typeB: { source: 'propagation', formula: '2*%pi*sqrt(L/g)', propTerms: [{ symbole: '', valeur: '1', incertitude: '0.01' }] } }), DEPS), /au moins une grandeur/);
});

test("Grandeur composée : symboles dupliqués lèvent une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, propParams({ typeB: { source: 'propagation', formula: '2*%pi*sqrt(L/g)', propTerms: [
        { symbole: 'L', valeur: '1', incertitude: '0.01' },
        { symbole: 'L', valeur: '2', incertitude: '0.02' }
    ] } }), DEPS), /utilisé plusieurs fois/);
});

test("Grandeur composée : symbole invalide (ne commence pas par une lettre) lève une erreur", () => {
    assert.throws(() => genIncertitudeCore(1, propParams({ typeB: { source: 'propagation', formula: '2*%pi*sqrt(L/g)', propTerms: [
        { symbole: '2L', valeur: '1', incertitude: '0.01' }
    ] } }), DEPS), /pas un symbole valide/);
});

// ── Grandeur composée : formule "prête à l'emploi" (dérivées déjà calculées) ────
test("Grandeur composée : formulaMode absent (ou 'none') ne génère aucune variable q_pd_ (non-régression)", () => {
    const q = genIncertitudeCore(1, propParams(), DEPS);
    assert.doesNotMatch(q.vars, /q1_pd_/);
});

test("Grandeur composée : formulaMode='pret' génère les coefficients q_pd_<symbole> (élasticité, dérivée relative)", () => {
    const q = genIncertitudeCore(1, propParams({ typeB: {
        source: 'propagation', formula: '2*%pi*sqrt(L/g)', formulaMode: 'pret',
        propTerms: [
            { symbole: 'L', valeur: '1', incertitude: '0.01' },
            { symbole: 'g', valeur: '9.8', incertitude: '0.05' }
        ]
    } }), DEPS);
    assert.match(q.vars, /q1_pd_L:float\(ev\(diff\(q1_Yexpr,L\),L=1,g=9\.8\)\*\(1\)\/q1_moy\);/);
    assert.match(q.vars, /q1_pd_g:float\(ev\(diff\(q1_Yexpr,g\),L=1,g=9\.8\)\*\(9\.8\)\/q1_moy\);/);
});

test("Grandeur composée : formulaMode='structuree' affiche la formule absolue (dérivées symboliques non calculées)", () => {
    const q = genIncertitudeCore(1, propParams({
        context: { grandeur: 'Période', symbole: 'T', unite: 's', intro: '' },
        typeB: {
            source: 'propagation', formula: '2*%pi*sqrt(L/g)', formulaMode: 'structuree',
            propTerms: [
                { symbole: 'L', valeur: '1', incertitude: '0.01' },
                { symbole: 'g', valeur: '9.8', incertitude: '0.05' }
            ]
        }
    }), DEPS);
    assert.ok(q.textFrag.includes('<p>\\(u(T)=\\sqrt{\\left(\\frac{\\partial T}{\\partial L}\\cdot u(L)\\right)^2+\\left(\\frac{\\partial T}{\\partial g}\\cdot u(g)\\right)^2}\\)</p>'), 'formule structurée absente ou mal formée');
    assert.doesNotMatch(q.vars, /q1_pd_/);
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("Grandeur composée : formulaMode='pret' affiche la formule relative avec coefficients déjà calculés + rappel multiplicatif", () => {
    const q = genIncertitudeCore(1, propParams({
        context: { grandeur: 'Période', symbole: 'T', unite: 's', intro: '' },
        typeB: {
            source: 'propagation', formula: '2*%pi*sqrt(L/g)', formulaMode: 'pret',
            propTerms: [
                { symbole: 'L', valeur: '1', incertitude: '0.01' },
                { symbole: 'g', valeur: '9.8', incertitude: '0.05' }
            ]
        }
    }), DEPS);
    assert.ok(q.textFrag.includes('\\(\\dfrac{u(T)}{T}=\\sqrt{\\left({@q1_pd_L@}\\cdot\\dfrac{u(L)}{L}\\right)^2+\\left({@q1_pd_g@}\\cdot\\dfrac{u(g)}{g}\\right)^2}\\)'), 'formule relative absente ou mal formée');
    assert.ok(q.textFrag.includes('u(T)=T\\times\\dfrac{u(T)}{T}'), 'rappel multiplicatif absent');
    assert.match(q.vars, /q1_pd_L:float\(/);
    assertBalancedTags(q.textFrag, 'textFrag');
});

test("Grandeur composée : formulaMode absent => aucune formule affichée (non-régression, ancien défaut 'décoché')", () => {
    const q = genIncertitudeCore(1, propParams(), DEPS);
    assert.doesNotMatch(q.textFrag, /\\sqrt\{/);
    assert.doesNotMatch(q.textFrag, /q1_pd_/);
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
// Chaque étape cochée seule produit exactement 1 <prt> (y compris 'ecriture' :
// même en format pm avec unité, les 3 champs valeur/incertitude/unité sont
// regroupés dans un seul PRT combiné à 3 nœuds — cf. tests dédiés plus bas).
test("chaque étape cochée isolément hérite du barème complet (1 <prt> par étape)", () => {
    INC_STEP_ORDER.forEach((key) => {
        const steps = {};
        INC_STEP_ORDER.forEach((k) => { steps[k] = (k === key); });
        const q = genIncertitudeCore(1, baseParams({ steps }), DEPS);
        const prtCount = (q.prtXML.match(/<prt>/g) || []).length;
        assert.equal(prtCount, 1, `étape '${key}' : attendu 1 <prt>, obtenu ${prtCount}`);
        assert.equal(q.prts.length, 1);
        const totalValue = q.prts.reduce((sum, prt) => sum + parseFloat(prt.meta.value), 0);
        assert.ok(Math.abs(totalValue - 7) < 1e-6, `étape '${key}' seule doit recevoir tout le barème au total (obtenu ${totalValue})`);
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

// ── Unitisation des étapes intermédiaires (moyenne/s/uA/uB/uc/U) ────────
// Si context.unite est définie, TOUTES les étapes numériques (pas seulement
// l'écriture finale) doivent être saisies en champ natif STACK `units`
// (nombre*unité), avec un PRT à 2 nœuds (dimension puis magnitude), comme
// js/gen-units.js — jamais en nombre seul (demande explicite de l'utilisateur,
// répétée après un premier design incomplet qui ne l'appliquait qu'à
// l'écriture finale).
test("étape 'moyenne' avec unité : input ans_moy1 en type units, PRT à 2 nœuds (UnitsAbsolute dimension puis UnitsRelative magnitude)", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false } }), DEPS);
    assert.match(q.inputXML, /<name>ans_moy1<\/name><type>units<\/type><tans>q1_moy\*\(cm\)<\/tans>/);
    assert.equal(q.prts.length, 1);
    assert.equal(q.prts[0].nodes.length, 2);
    const testtypes = [...q.prtXML.matchAll(/<answertest>([^<]+)<\/answertest>/g)].map(m => m[1]);
    assert.deepEqual(testtypes, ['UnitsAbsolute', 'UnitsRelative']);
    assert.match(q.prtXML, /eleve_unit_ans_moy1/);
    assert.match(q.prtXML, /teacher_unit_ans_moy1/);
    assert.match(q.prtXML, /inc\.fb_wrong_moyenne/);
    assertBalancedTags(q.prtXML, 'prtXML (moyenne unité)');
    assertBalancedTags(q.inputXML, 'inputXML (moyenne unité)');
});

test("étape 'moyenne' sans unité (context.unite vide) : input reste numerical, PRT simple 1 nœud (non-régression)", () => {
    const q = genIncertitudeCore(1, baseParams({
        context: { grandeur: 'Longueur', symbole: 'L', unite: '', intro: '' },
        steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false }
    }), DEPS);
    assert.doesNotMatch(q.inputXML, /type>units/);
    assert.equal(q.prts[0].nodes.length, 1);
    assert.match(q.prtXML, /<answertest>NumRelative<\/answertest>/);
});

test("étape 'U' avec unité : magnitude testée en UnitsAbsolute (car test source NumAbsolute), pas UnitsRelative", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: true, ecriture: false } }), DEPS);
    assert.match(q.inputXML, /<name>ans_U1<\/name><type>units<\/type><tans>q1_U\*\(cm\)<\/tans>/);
    const testtypes = [...q.prtXML.matchAll(/<answertest>([^<]+)<\/answertest>/g)].map(m => m[1]);
    assert.deepEqual(testtypes, ['UnitsAbsolute', 'UnitsAbsolute']);
    assert.match(q.prtXML, /inc\.fb_wrong_U/);
});

test("étapes s/uA/uB/uc avec unité : chacune produit un input units + feedback pédagogique dédié", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: true, uA: true, uB: true, uc: true, U: false, ecriture: false } }), DEPS);
    assert.match(q.inputXML, /<name>ans_s1<\/name><type>units<\/type><tans>q1_s\*\(cm\)<\/tans>/);
    assert.match(q.inputXML, /<name>ans_ua1<\/name><type>units<\/type><tans>q1_uA\*\(cm\)<\/tans>/);
    assert.match(q.inputXML, /<name>ans_ub1<\/name><type>units<\/type><tans>q1_uB\*\(cm\)<\/tans>/);
    assert.match(q.inputXML, /<name>ans_uc1<\/name><type>units<\/type><tans>q1_uc\*\(cm\)<\/tans>/);
    assert.match(q.prtXML, /inc\.fb_wrong_s/);
    assert.match(q.prtXML, /inc\.fb_wrong_uA/);
    assert.match(q.prtXML, /inc\.fb_wrong_uB_resolution/);
    assert.match(q.prtXML, /inc\.fb_wrong_uc/);
    assertBalancedTags(q.prtXML, 'prtXML (s/uA/uB/uc unité)');
    assertBalancedTags(q.inputXML, 'inputXML (s/uA/uB/uc unité)');
});

test("étape 'uB' avec unité : la clé de feedback pédagogique dépend de la source Type B (calibration)", () => {
    const q = genIncertitudeCore(1, baseParams({
        typeB: { source: 'calibration', ucert: '0.05', kcert: '2' },
        steps: { moyenne: false, s: false, uA: false, uB: true, uc: false, U: false, ecriture: false }
    }), DEPS);
    assert.match(q.prtXML, /inc\.fb_wrong_uB_calibration/);
});

test("étapes moyenne/U (avec unité) : le feedback 'correct' est labellisé par étape, jamais un \"Correct !\" générique dupliqué (plusieurs boîtes vertes identiques = illisible dès qu'il y a plusieurs champs)", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: true, ecriture: false } }), DEPS);
    assert.match(q.prtXML, /inc\.fb_ok_moyenne/);
    assert.match(q.prtXML, /inc\.fb_ok_U/);
    assert.doesNotMatch(q.prtXML, /mat\.fb_ok_correct/);
});

test("chaque étape unitisée : somme des truescore des 2 nœuds = barème total de l'étape", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false } }), DEPS);
    const scores = q.prts[0].nodes.map(n => eval(n.truescore));
    assert.ok(Math.abs(scores.reduce((a, b) => a + b, 0) - 1) < 1e-6);
    assert.equal(parseFloat(q.prts[0].meta.value), 7);
});

// ── Écriture finale, format "pm" : 3 champs (valeur, incertitude, unité) ──
// Le format pm n'utilise plus de regex custom (bug confirmé 2x en prod) : le "±"
// est du texte fixe. La valeur et l'incertitude sont 2 champs numériques simples.
// Si une unité est définie sur la grandeur, un 3e champ natif STACK "units" est
// ajouté, PARTAGÉ entre les 2 (l'élève ne l'écrit qu'une fois) — design confirmé
// par l'utilisateur (AskUserQuestion), qui a rejeté le design intermédiaire où
// chaque champ (valeur, incertitude) portait sa propre unité. La dimension du
// champ unité est vérifiée par 1 seul nœud UnitsAbsolute (astuce ×2, comme
// js/gen-units.js), les 3 champs regroupés dans UN SEUL PRT combiné, notés
// indépendamment les uns des autres.
test("étape 'ecriture' pm avec unité : 2 inputs numerical + 1 input units partagé, 1 seul PRT à 3 nœuds, pas de q1_ecr_regex", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), DEPS);
    assert.doesNotMatch(q.vars, /q1_ecr_regex/);
    assert.doesNotMatch(q.vars, /q1_ecrval_ta/);
    assert.doesNotMatch(q.vars, /q1_ecrunc_ta/);
    assert.match(q.vars, /q1_ecrunit_ta:1\*\(cm\);/);
    assert.match(q.inputXML, /<name>ans_ecrval1<\/name>\s*<type>numerical<\/type>\s*<tans>q1_moy_r<\/tans>/);
    assert.match(q.inputXML, /<name>ans_ecrunc1<\/name>\s*<type>numerical<\/type>\s*<tans>q1_U<\/tans>/);
    assert.match(q.inputXML, /<name>ans_ecrunit1<\/name><type>units<\/type><tans>q1_ecrunit_ta<\/tans>/);
    assert.match(q.textFrag, /ans_ecrval1/);
    assert.match(q.textFrag, /ans_ecrunc1/);
    assert.match(q.textFrag, /ans_ecrunit1/);
    assert.doesNotMatch(q.textFrag, /\[\[validation:/);
    assert.equal(q.prts.length, 1);
    assert.equal(q.prts[0].nodes.length, 3);
    const testtypes = [...q.prtXML.matchAll(/<answertest>([^<]+)<\/answertest>/g)].map(m => m[1]);
    assert.deepEqual(testtypes, ['NumAbsolute', 'NumAbsolute', 'UnitsAbsolute']);
    assert.match(q.prtXML, /eleve_unit1/);
    assert.match(q.prtXML, /teacher_unit1/);
    // Feedback spécifique par champ (valeur, incertitude, unité), pas un
    // "Correct !" générique, et pédagogique (explique le pourquoi) sur les branches fausses.
    assert.match(q.prtXML, /inc\.fb_ecr_valeur_ok/);
    assert.match(q.prtXML, /inc\.fb_ecr_incertitude_ok/);
    assert.match(q.prtXML, /inc\.fb_ecr_unite_ok/);
    assert.match(q.prtXML, /inc\.fb_ecr_valeur_wrong/);
    assert.match(q.prtXML, /inc\.fb_ecr_incertitude_wrong/);
    assert.match(q.prtXML, /inc\.fb_ecr_unite_wrong/);
    assertBalancedTags(q.prtXML, 'prtXML (ecriture pm+unité)');
    assertBalancedTags(q.inputXML, 'inputXML (ecriture pm+unité)');
});

test("étape 'ecriture' pm : somme des truescore des 3 nœuds = barème total de l'étape", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), DEPS);
    const scores = q.prts[0].nodes.map(n => eval(n.truescore));
    assert.ok(Math.abs(scores.reduce((a, b) => a + b, 0) - 1) < 1e-6);
    assert.equal(parseFloat(q.prts[0].meta.value), 7);
});

test("étape 'ecriture' pm : sans unité (context.unite vide), 1 PRT à 2 nœuds NumAbsolute", () => {
    const q = genIncertitudeCore(1, baseParams({
        context: { grandeur: 'Longueur', symbole: 'L', unite: '', intro: '' },
        steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true }
    }), DEPS);
    assert.match(q.inputXML, /<name>ans_ecrval1<\/name>/);
    assert.match(q.inputXML, /<name>ans_ecrunc1<\/name>/);
    assert.doesNotMatch(q.inputXML, /type>units/);
    assert.doesNotMatch(q.textFrag, /\[\[validation:/);
    assert.equal(q.prts.length, 1);
    assert.equal(q.prts[0].nodes.length, 2);
    const testtypes = [...q.prtXML.matchAll(/<answertest>([^<]+)<\/answertest>/g)].map(m => m[1]);
    assert.deepEqual(testtypes, ['NumAbsolute', 'NumAbsolute']);
    assert.doesNotMatch(q.vars, /q1_ecrunit_ta/);
});

test("étape 'ecriture' : ecritureFormat absent = comportement pm par défaut (non-régression)", () => {
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), DEPS);
    assert.doesNotMatch(q.vars, /q1_ecr_regex/);
    assert.match(q.inputXML, /ans_ecrval1/);
    assert.doesNotMatch(q.vars, /q1_inf_r:/);
});

test("étape 'ecriture' pm : le feedback général (corrigé) affiche la réponse finale attendue", () => {
    const qUnit = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), DEPS);
    assert.match(qUnit.generalFeedback, /q1_moy_r/);
    assert.match(qUnit.generalFeedback, /q1_U/);

    const qNoUnit = genIncertitudeCore(1, baseParams({
        context: { grandeur: 'Longueur', symbole: 'L', unite: '', intro: '' },
        steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true }
    }), DEPS);
    assert.match(qNoUnit.generalFeedback, /q1_moy_r/);
    assert.match(qNoUnit.generalFeedback, /q1_U/);

    const qNoEcriture = genIncertitudeCore(1, baseParams({ steps: { moyenne: true, s: false, uA: false, uB: false, uc: false, U: false, ecriture: false } }), DEPS);
    assert.doesNotMatch(qNoEcriture.generalFeedback, /q1_moy_r \\\\pm/);
});

test("feedback général : pas d'icône 🔑 doublée quand trig.correction_title la porte déjà", () => {
    const I18N_REAL_TITLE = { t: (key, vars) => key === 'trig.correction_title' ? '🔑 Correction' : (vars ? key + ':' + JSON.stringify(vars) : key) };
    const q = genIncertitudeCore(1, baseParams({ steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true } }), Object.assign({}, DEPS, { I18N: I18N_REAL_TITLE }));
    assert.equal((q.generalFeedback.match(/🔑/g) || []).length, 1);
});

test("étape 'ecriture' : format encadrement génère bornes inf/sup et regex tolérante avec symbole optionnel", () => {
    const q = genIncertitudeCore(1, baseParams({
        ecritureFormat: 'encadrement',
        steps: { moyenne: false, s: false, uA: false, uB: false, uc: false, U: false, ecriture: true }
    }), DEPS);
    assert.match(q.vars, /q1_inf_r:q1_moy_r-q1_U;/);
    assert.match(q.vars, /q1_sup_r:q1_moy_r\+q1_U;/);
    assert.ok(q.vars.includes('q1_ecr_regex:sconcat('), 'regex sconcat manquant');
    assert.ok(q.vars.includes('inc_esc1(q1_inf_r_s)'), 'borne inf absente de la regex');
    assert.ok(q.vars.includes('inc_esc1(q1_sup_r_s)'), 'borne sup absente de la regex');
    assert.ok(q.vars.includes('inc_esc1("L")'), 'symbole absent de la regex (doit être toléré, optionnel)');
    assert.ok(q.vars.includes('q1_ecr_attendue:sconcat(q1_inf_r_s," < ","L"," < ",q1_sup_r_s'), 'q1_ecr_attendue mal formé');
});

test("_incStepDefs : format pm avec unité produit 1 seul def 'ecriture' porteur de 3 customNodes (valeur, incertitude, unité partagée)", () => {
    const defsPm = _incStepDefs(1, 'L', 'cm', baseParams({ ecritureFormat: 'pm' }), I18N_STUB);
    const ecrDefs = defsPm.filter(d => d.key === 'ecriture');
    assert.equal(ecrDefs.length, 1);
    assert.equal(ecrDefs[0].customNodes.length, 3);
    assert.match(ecrDefs[0].feedbackvariables, /stack_unit_si_to_si_base\(ans_ecrunit1\)/);
    assert.doesNotMatch(ecrDefs[0].feedbackvariables, /ans_ecrval1|ans_ecrunc1/);
    assert.match(ecrDefs[0].rawInputXML, /<name>ans_ecrval1<\/name>\s*<type>numerical<\/type>/);
    assert.match(ecrDefs[0].rawInputXML, /<name>ans_ecrunc1<\/name>\s*<type>numerical<\/type>/);
    assert.match(ecrDefs[0].rawInputXML, /<name>ans_ecrunit1<\/name><type>units<\/type>/);
    assert.match(ecrDefs[0].textFrag, /inc\.ecriture_pm_help_unit/);
    assert.doesNotMatch(ecrDefs[0].textFrag, /\[\[validation:/);

    const defsEnc = _incStepDefs(1, 'L', 'cm', baseParams({ ecritureFormat: 'encadrement' }), I18N_STUB);
    const ecrEnc = defsEnc.find(d => d.key === 'ecriture');
    assert.match(ecrEnc.textFrag, /inc\.ecriture_label_encadrement/);
});

test("_incStepDefs : format pm sans unité => 1 def 'ecriture' avec 2 customNodes NumAbsolute", () => {
    const p = baseParams({ ecritureFormat: 'pm', context: { grandeur: 'Longueur', symbole: 'L', unite: '', intro: '' } });
    const ecrDefs = _incStepDefs(1, 'L', '', p, I18N_STUB).filter(d => d.key === 'ecriture');
    assert.equal(ecrDefs.length, 1);
    assert.equal(ecrDefs[0].customNodes.length, 2);
    assert.equal(ecrDefs[0].feedbackvariables, '');
    assert.doesNotMatch(ecrDefs[0].rawInputXML, /type>units/);
    assert.doesNotMatch(ecrDefs[0].textFrag, /\[\[validation:/);
});

test("_incStepDefs : ecritureFormat absent => comportement pm par défaut (non-régression)", () => {
    const defs = _incStepDefs(1, 'L', 'cm', baseParams(), I18N_STUB);
    const ecrDefs = defs.filter(d => d.key === 'ecriture');
    assert.equal(ecrDefs.length, 1);
    assert.equal(ecrDefs[0].customNodes.length, 3);
    assert.doesNotMatch(ecrDefs[0].textFrag, /inc\.ecriture_label_encadrement/);
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
