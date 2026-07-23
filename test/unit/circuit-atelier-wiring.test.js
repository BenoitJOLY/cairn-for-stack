// Garde-fou contre la régression du 2026-07-23 : js/circuit-atelier.js absent des
// <script> de index.html => cirEngineRun n'existe pas en global au moment où
// genCircuit(X) tourne dans le navigateur => genCircuitCore() (appelé SANS deps par
// le vrai genCircuit(X), voir js/gen-circuit.js) retombe silencieusement sur
// CIR_ENGINE_JS_D = '' (garde typeof, pas d'exception) => le bloc [[script]] exporté
// est vide entre l'import stack_js et l'appel cirEngineRun(...) => palette/board
// ne se peuplent jamais dans Moodle, sans la moindre erreur console.
//
// Deux gardes-fous distincts et complémentaires :
//  1) index.html charge bien js/circuit-atelier.js AVANT js/gen-circuit.js (sinon
//     cirEngineRun n'est pas encore global quand gen-circuit.js serait, dans un
//     futur hypothétique, évalué eagerly — et par prudence/lisibilité de l'ordre).
//  2) genCircuitCore(X, p) appelé SANS deps (le vrai chemin navigateur), avec
//     cirEngineRun posé en global comme le ferait le <script> de index.html,
//     produit bien un bloc [[script]] contenant le moteur complet — pas une coquille vide.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test("index.html charge js/circuit-atelier.js avant js/gen-circuit.js", () => {
    const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
    const idxAtelier = html.indexOf('<script src="js/circuit-atelier.js">');
    const idxGen = html.indexOf('<script src="js/gen-circuit.js">');
    assert.notEqual(idxAtelier, -1, 'js/circuit-atelier.js absent des <script> de index.html — cirEngineRun ne sera jamais global, la palette du circuit exporté restera vide sans erreur console (régression 2026-07-23)');
    assert.notEqual(idxGen, -1, 'js/gen-circuit.js absent des <script> de index.html');
    assert.ok(idxAtelier < idxGen, 'js/circuit-atelier.js doit être chargé avant js/gen-circuit.js');
});

test('genCircuitCore(X, p) SANS deps (chemin réel navigateur) embarque le moteur complet, pas une coquille vide', () => {
    // Reproduit exactement le contexte navigateur : les <script> globaux de
    // index.html posent cirEngineRun/I18N/buildPrtXml/_mkFbGen/CIR_ATELIER_CSS
    // en global AVANT que genCircuit(X) n'appelle genCircuitCore(X, p) sans 3e argument.
    const { cirEngineRun } = require(path.join('..', '..', 'js', 'circuit-atelier.js'));
    const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

    const prevCir = global.cirEngineRun, prevI18N = global.I18N, prevBuild = global.buildPrtXml,
        prevMkFb = global._mkFbGen, prevCss = global.CIR_ATELIER_CSS;

    global.cirEngineRun = cirEngineRun;
    global.I18N = { t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key };
    global.buildPrtXml = buildPrtXml;
    global._mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
    global.CIR_ATELIER_CSS = '.foo{color:red}';

    try {
        // require APRÈS avoir posé les globals : genCircuitCore les lit via ses
        // valeurs par défaut (deps.X || X_global) au moment de l'appel, pas du require,
        // donc l'ordre exact require/global n'a pas d'importance ici — mais on le
        // fait dans cet ordre pour rester au plus près du chargement réel de index.html.
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
        const { genCircuitCore } = require(path.join('..', '..', 'js', 'gen-circuit.js'));

        const p = {
            model: { signature: 'SIG-ABC', components: 'R,L', values: 'R1=100', state: 'BASE64==' },
            checkValues: true, bareme: 2, text: '', fbGen: ''
        };
        const q = genCircuitCore(1, p); // pas de 3e argument : chemin réel de genCircuit(X)

        const scriptStart = q.textFrag.indexOf('[[script type="module"]]');
        const scriptEnd = q.textFrag.indexOf('[[/script]]');
        assert.notEqual(scriptStart, -1);
        assert.notEqual(scriptEnd, -1);
        const scriptBlock = q.textFrag.slice(scriptStart, scriptEnd);

        assert.ok(scriptBlock.includes('function cirEngineRun'), 'le moteur (function cirEngineRun) est absent du bloc [[script]] exporté — coquille vide, régression du 2026-07-23');
        assert.ok(scriptBlock.includes('CATALOG.forEach'), "le remplissage de la palette (CATALOG.forEach) est absent du bloc [[script]] exporté");
        assert.ok(scriptBlock.length > 10000, 'bloc [[script]] anormalement court (' + scriptBlock.length + ' car.) — le moteur semble tronqué ou absent');
    } finally {
        global.cirEngineRun = prevCir; global.I18N = prevI18N; global.buildPrtXml = prevBuild;
        global._mkFbGen = prevMkFb; global.CIR_ATELIER_CSS = prevCss;
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
    }
});

// Régression du 2026-07-23 (bug réel constaté en prod, distinct de la wiring ci-dessus) :
// js/app.js:moodleLatex() applique globalement /(?<!\{)@(?!\})([^@]+?)@(?!\})/g au texte
// de question COMPLET (questiontext + [[script]] embarqué inclus, voir js/app.js:304) pour
// convertir le raccourci enseignant "@var@" en syntaxe CAS STACK "{@var@}". Le moteur de
// circuit utilisait "@LT@"/"@GT@" comme jetons internes (pour survivre intacts au passage
// dans stripMathDivs, qui fait un aller-retour par div.innerHTML) — cette regex les
// transformait en "{@LT@}"/"{@GT@}", cassant detag() : chaque SVG du catalogue restait du
// texte littéral au lieu du vrai balisage, palette/schéma invisibles côté élève, sans la
// moindre erreur console. Fix : jetons renommés en "#LT#"/"#GT#" (aucun "@") pour ne plus
// jamais matcher cette regex. Ce test verrouille l'invariant plutôt que le détail
// d'implémentation : le bloc [[script]] exporté doit être un point fixe de moodleLatex.
test("le bloc [[script]] exporté est inerte face à moodleLatex (pas de jeton \"@mot@\" nu)", () => {
    const { cirEngineRun } = require(path.join('..', '..', 'js', 'circuit-atelier.js'));
    const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

    const prevCir = global.cirEngineRun, prevI18N = global.I18N, prevBuild = global.buildPrtXml,
        prevMkFb = global._mkFbGen, prevCss = global.CIR_ATELIER_CSS;

    global.cirEngineRun = cirEngineRun;
    global.I18N = { t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key };
    global.buildPrtXml = buildPrtXml;
    global._mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
    global.CIR_ATELIER_CSS = '.foo{color:red}';

    try {
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
        const { genCircuitCore } = require(path.join('..', '..', 'js', 'gen-circuit.js'));

        const p = {
            model: { signature: 'SIG-ABC', components: 'R,L', values: 'R1=100', state: 'BASE64==' },
            checkValues: true, bareme: 2, text: '', fbGen: ''
        };
        const q = genCircuitCore(1, p);

        // Mirroir exact de js/app.js:13 (moodleLatex) — ne pas require() app.js ici, il est
        // écrit pour tourner dans le navigateur et référence `document` au chargement.
        const moodleLatexAtSign = /(?<!\{)@(?!\})([^@]+?)@(?!\})/g;
        const rewrapped = q.textFrag.replace(moodleLatexAtSign, '{@$1@}');

        assert.equal(rewrapped, q.textFrag, 'moodleLatex() modifierait le textFrag exporté : un jeton "@mot@" nu (non entouré de {}) subsiste dans le bloc [[script]], il sera transformé en "{@mot@}" et cassera detag() côté élève (régression 2026-07-23)');
    } finally {
        global.cirEngineRun = prevCir; global.I18N = prevI18N; global.buildPrtXml = prevBuild;
        global._mkFbGen = prevMkFb; global.CIR_ATELIER_CSS = prevCss;
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
    }
});

// Régression du 2026-07-23 (bis, trouvée après coup grâce au XML réellement exporté par
// l'utilisateur) : même mécanisme que le test précédent (aller-retour innerHTML de
// stripMathDivs, js/app.js:19-36) mais sur un caractère différent. Ce round-trip fait
// passer TOUT le texte de question — y compris le bloc [[script]] embarqué, qui n'est
// PAS un vrai <script> DOM à ce stade, seulement du texte contenant le marqueur littéral
// "[[script type=\"module\"]]" — par un parseur+sérialiseur HTML. Tout "&" littéral dans
// ce texte (ex. l'opérateur JS "&&") ressort sérialisé en "&amp;", ce qui casse la syntaxe
// JS une fois inséré tel quel dans le vrai <script> de l'iframe Moodle : "if (x &amp;&amp; y)"
// n'est PAS un && JS valide (les entités ne sont jamais décodées à l'intérieur d'un élément
// <script> réel). Preuve : le XML collé par l'utilisateur contenait exactement
// "if (inputAns3 &amp;&amp; inputAns3.value)" alors que la source dit "inputAns3 && inputAns3.value".
// Le fichier évite déjà ce problème pour "<"/">" (detag()) et implicitement pour "|" (pas un
// métacaractère HTML) — il ne restait qu'un unique "&&" oublié (circuit-atelier.js:612,
// remplacé par un if imbriqué). Ce test verrouille l'invariant : plus aucun "&" nu dans le
// bloc [[script]] exporté, quel que soit l'endroit où il pourrait réapparaître à l'avenir.
test('le bloc [[script]] exporté ne contient aucun "&" nu (survit à l\'aller-retour innerHTML de stripMathDivs)', () => {
    const { cirEngineRun } = require(path.join('..', '..', 'js', 'circuit-atelier.js'));
    const { buildPrtXml } = require(path.join('..', '..', 'js', 'prt-manager.js'));

    const prevCir = global.cirEngineRun, prevI18N = global.I18N, prevBuild = global.buildPrtXml,
        prevMkFb = global._mkFbGen, prevCss = global.CIR_ATELIER_CSS;

    global.cirEngineRun = cirEngineRun;
    global.I18N = { t: (key, vars) => vars ? key + ':' + JSON.stringify(vars) : key };
    global.buildPrtXml = buildPrtXml;
    global._mkFbGen = (generalFeedback, fbGen) => fbGen ? generalFeedback + '<p>' + fbGen + '</p>' : generalFeedback;
    global.CIR_ATELIER_CSS = '.foo{color:red}';

    try {
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
        const { genCircuitCore } = require(path.join('..', '..', 'js', 'gen-circuit.js'));

        const p = {
            model: { signature: 'SIG-ABC', components: 'R,L', values: 'R1=100', state: 'BASE64==' },
            checkValues: true, bareme: 2, text: '', fbGen: ''
        };
        const q = genCircuitCore(1, p);

        const scriptStart = q.textFrag.indexOf('[[script type="module"]]');
        const scriptEnd = q.textFrag.indexOf('[[/script]]');
        const scriptBlock = q.textFrag.slice(scriptStart, scriptEnd);

        assert.equal(scriptBlock.indexOf('&'), -1, 'un "&" littéral subsiste dans le bloc [[script]] exporté : stripMathDivs() le sérialisera en "&amp;", ce qui n\'est jamais décodé à l\'intérieur d\'un vrai <script> côté Moodle et casse la syntaxe JS (régression 2026-07-23, ex. "&&" -> "&amp;&amp;")');
    } finally {
        global.cirEngineRun = prevCir; global.I18N = prevI18N; global.buildPrtXml = prevBuild;
        global._mkFbGen = prevMkFb; global.CIR_ATELIER_CSS = prevCss;
        delete require.cache[require.resolve(path.join('..', '..', 'js', 'gen-circuit.js'))];
    }
});
