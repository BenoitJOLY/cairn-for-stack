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

// config-panel-fisher.js — capture/restore/reset pour le type "fisher"
// Même découpage que config-panel-ieee754.js.

var FIS_DEFAULTS = {
  bareme: 1, intro: '',
  grList: '1,3/2,2,5/2,3,7/2', piList: '1,3/2,2,5/2,3,7/2', fbGen: ''
};

function captureState_fisher() {
  var s = { type: 'fisher' };
  s.bareme = v('fis-bareme');
  s.intro = richVal('fis-intro');
  s.grList = v('fis-grlist');
  s.piList = v('fis-pilist');
  s.fbGen = richVal('fis-fbgen');
  return s;
}

function restoreState_fisher(s) {
  document.getElementById('fis-bareme').value = s.bareme || FIS_DEFAULTS.bareme;
  setRichVal('fis-intro', s.intro || FIS_DEFAULTS.intro);
  document.getElementById('fis-grlist').value = s.grList || FIS_DEFAULTS.grList;
  document.getElementById('fis-pilist').value = s.piList || FIS_DEFAULTS.piList;
  setRichVal('fis-fbgen', s.fbGen || FIS_DEFAULTS.fbGen);
}

function resetForm_fisher() {
  document.getElementById('fis-bareme').value = FIS_DEFAULTS.bareme;
  setRichVal('fis-intro', FIS_DEFAULTS.intro);
  document.getElementById('fis-grlist').value = FIS_DEFAULTS.grList;
  document.getElementById('fis-pilist').value = FIS_DEFAULTS.piList;
  setRichVal('fis-fbgen', FIS_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_fisher: captureState_fisher, restoreState_fisher: restoreState_fisher, resetForm_fisher: resetForm_fisher };
}
