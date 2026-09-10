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

// config-panel-premierordre.js — capture/restore/reset pour le type "premierordre"
// Même découpage que config-panel-ieee754.js.

var PMO_DEFAULTS = {
  bareme: 1, intro: '',
  kList: '2,3,4,5,3/2,5/2', e0List: '1,2,5,10', fbGen: ''
};

function captureState_premierordre() {
  var s = { type: 'premierordre' };
  s.bareme = v('pmo-bareme');
  s.intro = richVal('pmo-intro');
  s.kList = v('pmo-klist');
  s.e0List = v('pmo-e0list');
  s.fbGen = richVal('pmo-fbgen');
  return s;
}

function restoreState_premierordre(s) {
  document.getElementById('pmo-bareme').value = s.bareme || PMO_DEFAULTS.bareme;
  setRichVal('pmo-intro', s.intro || PMO_DEFAULTS.intro);
  document.getElementById('pmo-klist').value = s.kList || PMO_DEFAULTS.kList;
  document.getElementById('pmo-e0list').value = s.e0List || PMO_DEFAULTS.e0List;
  setRichVal('pmo-fbgen', s.fbGen || PMO_DEFAULTS.fbGen);
}

function resetForm_premierordre() {
  document.getElementById('pmo-bareme').value = PMO_DEFAULTS.bareme;
  setRichVal('pmo-intro', PMO_DEFAULTS.intro);
  document.getElementById('pmo-klist').value = PMO_DEFAULTS.kList;
  document.getElementById('pmo-e0list').value = PMO_DEFAULTS.e0List;
  setRichVal('pmo-fbgen', PMO_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_premierordre: captureState_premierordre, restoreState_premierordre: restoreState_premierordre, resetForm_premierordre: resetForm_premierordre };
}
