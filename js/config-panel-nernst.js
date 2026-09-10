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

// config-panel-nernst.js — capture/restore/reset pour le type "nernst"
// Même découpage que config-panel-chi2.js.

var NST_DEFAULTS = {
  bareme: 1, intro: '',
  kextList: '3,4,5,6', kintList: '120,130,140,150,155', fbGen: ''
};

function captureState_nernst() {
  var s = { type: 'nernst' };
  s.bareme = v('nst-bareme');
  s.intro = richVal('nst-intro');
  s.kextList = v('nst-kextlist');
  s.kintList = v('nst-kintlist');
  s.fbGen = richVal('nst-fbgen');
  return s;
}

function restoreState_nernst(s) {
  document.getElementById('nst-bareme').value = s.bareme || NST_DEFAULTS.bareme;
  setRichVal('nst-intro', s.intro || NST_DEFAULTS.intro);
  document.getElementById('nst-kextlist').value = s.kextList || NST_DEFAULTS.kextList;
  document.getElementById('nst-kintlist').value = s.kintList || NST_DEFAULTS.kintList;
  setRichVal('nst-fbgen', s.fbGen || NST_DEFAULTS.fbGen);
}

function resetForm_nernst() {
  document.getElementById('nst-bareme').value = NST_DEFAULTS.bareme;
  setRichVal('nst-intro', NST_DEFAULTS.intro);
  document.getElementById('nst-kextlist').value = NST_DEFAULTS.kextList;
  document.getElementById('nst-kintlist').value = NST_DEFAULTS.kintList;
  setRichVal('nst-fbgen', NST_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_nernst: captureState_nernst, restoreState_nernst: restoreState_nernst, resetForm_nernst: resetForm_nernst };
}
