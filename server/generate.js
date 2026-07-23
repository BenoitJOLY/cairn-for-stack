const { genAlgebraicCore } = require('../js/gen-algebraic.js');
const { buildPrtXml } = require('../js/prt-manager.js');
const { wrapFb, algPrtNodeCanonical } = require('../js/generators.js');
const { buildKbdStackHTML } = require('../js/keyboard.js');
const I18N = require('./i18n-node.js');

const DEPS = { I18N, buildPrtXml, wrapFb, algPrtNodeCanonical, buildKbdStackHTML };

// Un type migré à la fois — voir PLAN.md, chantier "Backend auto-hébergé NAS",
// étape 3. Ajouter une entrée ici seulement après audit + test réel Moodle.
const GENERATORS = {
  algebraic: (X, p) => genAlgebraicCore(X, p, DEPS),
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
