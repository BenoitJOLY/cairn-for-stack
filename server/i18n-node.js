const path = require('path');

const strings = {};

global.I18N = { add(code, s) { if (code === 'fr') Object.assign(strings, s); } };
require(path.join(__dirname, '..', 'lang', 'fr.js'));
delete global.I18N;

function t(key, vars) {
  let s = strings[key] != null ? strings[key] : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

module.exports = { t };
