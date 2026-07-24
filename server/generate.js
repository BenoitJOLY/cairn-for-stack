const { genAlgebraicCore } = require('../js/gen-algebraic.js');
const { genComplexeCore } = require('../js/gen-math-complexe.js');
const { genCalculCore } = require('../js/gen-math-calcul.js');
const { genStatistiquesCore } = require('../js/gen-math-statistiques.js');
const { genMatricesCore } = require('../js/gen-math-matrices.js');
const { genGeometrieCore } = require('../js/gen-math-geometrie.js');
const { genSuitesCore } = require('../js/gen-math-suites.js');
const { genProbabilitesCore } = require('../js/gen-math-probabilites.js');
const { genTrigonometrieCore } = require('../js/gen-math-trigonometrie.js');
const { genPolynomesCore } = require('../js/gen-math-polynomes.js');
const { genLimitesCore } = require('../js/gen-math-limites.js');
const { buildPrtXml } = require('../js/prt-manager.js');
const { wrapFb, algPrtNodeCanonical } = require('../js/generators.js');
const { buildKbdStackHTML } = require('../js/keyboard.js');
const { _mkInput, _mkFbGen } = require('../js/gen-math-shared.js');
const { _cpxGenFbgen } = require('../js/complexe-ui.js');
const I18N = require('./i18n-node.js');

const DEPS = { I18N, buildPrtXml, wrapFb, algPrtNodeCanonical, buildKbdStackHTML, _mkInput, _mkFbGen, _cpxGenFbgen };

// Un type migré à la fois — voir PLAN.md, chantier "Backend auto-hébergé NAS",
// étape 3. Ajouter une entrée ici seulement après audit + test réel Moodle.
const GENERATORS = {
  algebraic: (X, p) => genAlgebraicCore(X, p, DEPS),
  complexe: (X, p) => genComplexeCore(X, p, DEPS),
  calcul: (X, p) => genCalculCore(X, p, DEPS),
  statistiques: (X, p) => genStatistiquesCore(X, p, DEPS),
  matrices: (X, p) => genMatricesCore(X, p, DEPS),
  geometrie: (X, p) => genGeometrieCore(X, p, DEPS),
  suites: (X, p) => genSuitesCore(X, p, DEPS),
  probabilites: (X, p) => genProbabilitesCore(X, p, DEPS),
  trigonometrie: (X, p) => genTrigonometrieCore(X, p, DEPS),
  polynomes: (X, p) => genPolynomesCore(X, p, DEPS),
  limites: (X, p) => genLimitesCore(X, p, DEPS),
};

function generate(type, X, params) {
  const fn = GENERATORS[type];
  if (!fn) {
    const err = new Error('Type non migré côté serveur : ' + type);
    err.status = 400;
    throw err;
  }
  return fn(X, params);
}

module.exports = { generate };
