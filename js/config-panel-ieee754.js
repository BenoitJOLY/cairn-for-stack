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

// config-panel-ieee754.js — capture/restore/reset pour le type "ieee754"
// Même découpage que config-panel-chi2.js.

var FLT_DEFAULTS = {
  bareme: 1, intro: '',
  xList: '1/10,3/10,1/5,7/10,9/10,3/5', nBits: '8', fbGen: ''
};

function captureState_ieee754() {
  var s = { type: 'ieee754' };
  s.bareme = v('flt-bareme');
  s.intro = richVal('flt-intro');
  s.xList = v('flt-xlist');
  s.nBits = v('flt-nbits');
  s.fbGen = richVal('flt-fbgen');
  return s;
}

function restoreState_ieee754(s) {
  document.getElementById('flt-bareme').value = s.bareme || FLT_DEFAULTS.bareme;
  setRichVal('flt-intro', s.intro || FLT_DEFAULTS.intro);
  document.getElementById('flt-xlist').value = s.xList || FLT_DEFAULTS.xList;
  document.getElementById('flt-nbits').value = s.nBits || FLT_DEFAULTS.nBits;
  setRichVal('flt-fbgen', s.fbGen || FLT_DEFAULTS.fbGen);
}

function resetForm_ieee754() {
  document.getElementById('flt-bareme').value = FLT_DEFAULTS.bareme;
  setRichVal('flt-intro', FLT_DEFAULTS.intro);
  document.getElementById('flt-xlist').value = FLT_DEFAULTS.xList;
  document.getElementById('flt-nbits').value = FLT_DEFAULTS.nBits;
  setRichVal('flt-fbgen', FLT_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_ieee754: captureState_ieee754, restoreState_ieee754: restoreState_ieee754, resetForm_ieee754: resetForm_ieee754 };
}
