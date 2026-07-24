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
const { genInequationCore } = require('../js/gen-math-inequation.js');
const { genEquivalenceCore } = require('../js/gen-math-equivalence.js');
const { genGeoGebraCore } = require('../js/gen-geogebra.js');
const { genUnitsCore } = require('../js/gen-units.js');
const { genNuclearCore } = require('../js/gen-nuclear.js');
const { genCompositionCore } = require('../js/gen-composition.js');
const { genNumericalCore } = require('../js/gen-numerical.js');
const { genCheckboxCore } = require('../js/gen-checkbox.js');
const { genPoolCore } = require('../js/gen-pool.js');
const { genStringCore } = require('../js/gen-string.js');
const { buildPrtXml } = require('../js/prt-manager.js');
const { wrapFb, algPrtNodeCanonical } = require('../js/generators.js');
const { buildKbdStackHTML } = require('../js/keyboard.js');
const { _mkInput, _mkFbGen } = require('../js/gen-math-shared.js');
const { _cpxGenFbgen } = require('../js/complexe-ui.js');
const { htmlEsc, escapeMaximaString, rawEsc } = require('../js/data.js');
const I18N = require('./i18n-node.js');

const DEPS = { I18N, buildPrtXml, wrapFb, algPrtNodeCanonical, buildKbdStackHTML, _mkInput, _mkFbGen, _cpxGenFbgen, htmlEsc, escapeMaximaString, rawEsc };

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
  inequation: (X, p) => genInequationCore(X, p, DEPS),
  equivalence: (X, p) => genEquivalenceCore(X, p, DEPS),
  geogebra: (X, p) => genGeoGebraCore(X, p, DEPS),
  units: (X, p) => genUnitsCore(X, p, DEPS),
  nuclear: (X, p) => genNuclearCore(X, p, DEPS),
  composition: (X, p) => genCompositionCore(X, p, DEPS),
  numerical: (X, p) => genNumericalCore(X, p, DEPS),
  checkbox: (X, p) => genCheckboxCore(X, p, DEPS),
  radio: (X, p) => genPoolCore(X, p, DEPS),
  dropdown: (X, p) => genPoolCore(X, p, DEPS),
  string: (X, p) => genStringCore(X, p, DEPS),
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
