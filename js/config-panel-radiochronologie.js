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

// config-panel-radiochronologie.js — capture/restore/reset pour le type "radiochronologie"
// Même découpage que config-panel-horlogemoleculaire.js.

var RC_DEFAULTS = {
  bareme: 2, intro: '',
  fracList: '1/2,1/4,1/8,1/16,3/5,7/10,4/5', lamaList: '1,2,5,8', lambList: '4,5,6', fbGen: ''
};

function captureState_radiochronologie() {
  var s = { type: 'radiochronologie' };
  s.bareme = v('rc-bareme');
  s.intro = richVal('rc-intro');
  s.fracList = v('rc-fraclist');
  s.lamaList = v('rc-lamalist');
  s.lambList = v('rc-lamblist');
  s.fbGen = richVal('rc-fbgen');
  return s;
}

function restoreState_radiochronologie(s) {
  document.getElementById('rc-bareme').value = s.bareme || RC_DEFAULTS.bareme;
  setRichVal('rc-intro', s.intro || RC_DEFAULTS.intro);
  document.getElementById('rc-fraclist').value = s.fracList || RC_DEFAULTS.fracList;
  document.getElementById('rc-lamalist').value = s.lamaList || RC_DEFAULTS.lamaList;
  document.getElementById('rc-lamblist').value = s.lambList || RC_DEFAULTS.lambList;
  setRichVal('rc-fbgen', s.fbGen || RC_DEFAULTS.fbGen);
}

function resetForm_radiochronologie() {
  document.getElementById('rc-bareme').value = RC_DEFAULTS.bareme;
  setRichVal('rc-intro', RC_DEFAULTS.intro);
  document.getElementById('rc-fraclist').value = RC_DEFAULTS.fracList;
  document.getElementById('rc-lamalist').value = RC_DEFAULTS.lamaList;
  document.getElementById('rc-lamblist').value = RC_DEFAULTS.lambList;
  setRichVal('rc-fbgen', RC_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_radiochronologie: captureState_radiochronologie, restoreState_radiochronologie: restoreState_radiochronologie, resetForm_radiochronologie: resetForm_radiochronologie };
}
