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

// config-panel-multiplicateur.js — capture/restore/reset pour le type "multiplicateur"
// Même découpage que config-panel-ieee754.js.

var MUL_DEFAULTS = {
  bareme: 1, intro: '',
  cList: '3/4,4/5,7/10,2/3,3/5', diList: '10,20,50,100', fbGen: ''
};

function captureState_multiplicateur() {
  var s = { type: 'multiplicateur' };
  s.bareme = v('mul-bareme');
  s.intro = richVal('mul-intro');
  s.cList = v('mul-clist');
  s.diList = v('mul-dilist');
  s.fbGen = richVal('mul-fbgen');
  return s;
}

function restoreState_multiplicateur(s) {
  document.getElementById('mul-bareme').value = s.bareme || MUL_DEFAULTS.bareme;
  setRichVal('mul-intro', s.intro || MUL_DEFAULTS.intro);
  document.getElementById('mul-clist').value = s.cList || MUL_DEFAULTS.cList;
  document.getElementById('mul-dilist').value = s.diList || MUL_DEFAULTS.diList;
  setRichVal('mul-fbgen', s.fbGen || MUL_DEFAULTS.fbGen);
}

function resetForm_multiplicateur() {
  document.getElementById('mul-bareme').value = MUL_DEFAULTS.bareme;
  setRichVal('mul-intro', MUL_DEFAULTS.intro);
  document.getElementById('mul-clist').value = MUL_DEFAULTS.cList;
  document.getElementById('mul-dilist').value = MUL_DEFAULTS.diList;
  setRichVal('mul-fbgen', MUL_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_multiplicateur: captureState_multiplicateur, restoreState_multiplicateur: restoreState_multiplicateur, resetForm_multiplicateur: resetForm_multiplicateur };
}
