/*
 * StackForge — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
