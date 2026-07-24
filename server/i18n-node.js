const path = require('path');

const strings = {};

global.I18N = { add(code, s) { if (code === 'fr') Object.assign(strings, s); } };
require(path.join(__dirname, '..', 'lang', 'fr.js'));

function t(key, vars) {
  let s = strings[key] != null ? strings[key] : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// global.I18N reste disponible (remplacé par la vraie fonction t) : certains
// fichiers requis côté serveur (ex. js/complexe-ui.js) référencent I18N.t(...)
// en global plutôt que via deps — voir server/generate.js.
global.I18N = { t };

module.exports = { t };
