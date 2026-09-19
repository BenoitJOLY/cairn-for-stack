/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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

// config-panel-tauxvariation.js — capture/restore/reset pour le type "tauxvariation"
// Même découpage que config-panel-ieee754.js.

var TVA_DEFAULTS = {
  bareme: 1, intro: '',
  v0List: '80,100,120,150,200', v1List: '88,115,138,165,220', fbGen: ''
};

function captureState_tauxvariation() {
  var s = { type: 'tauxvariation' };
  s.bareme = v('tva-bareme');
  s.intro = richVal('tva-intro');
  s.v0List = v('tva-v0list');
  s.v1List = v('tva-v1list');
  s.fbGen = richVal('tva-fbgen');
  return s;
}

function restoreState_tauxvariation(s) {
  document.getElementById('tva-bareme').value = s.bareme || TVA_DEFAULTS.bareme;
  setRichVal('tva-intro', s.intro || TVA_DEFAULTS.intro);
  document.getElementById('tva-v0list').value = s.v0List || TVA_DEFAULTS.v0List;
  document.getElementById('tva-v1list').value = s.v1List || TVA_DEFAULTS.v1List;
  setRichVal('tva-fbgen', s.fbGen || TVA_DEFAULTS.fbGen);
}

function resetForm_tauxvariation() {
  document.getElementById('tva-bareme').value = TVA_DEFAULTS.bareme;
  setRichVal('tva-intro', TVA_DEFAULTS.intro);
  document.getElementById('tva-v0list').value = TVA_DEFAULTS.v0List;
  document.getElementById('tva-v1list').value = TVA_DEFAULTS.v1List;
  setRichVal('tva-fbgen', TVA_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_tauxvariation: captureState_tauxvariation, restoreState_tauxvariation: restoreState_tauxvariation, resetForm_tauxvariation: resetForm_tauxvariation };
}
