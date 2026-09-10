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

// config-panel-complexite.js — capture/restore/reset pour le type "complexite"
// Même découpage que config-panel-chi2.js.

var CPA_DEFAULTS = {
  bareme: 1, intro: '',
  nList: '8,16,32,64,128,256,512,1024', fbGen: ''
};

function captureState_complexite() {
  var s = { type: 'complexite' };
  s.bareme = v('cpa-bareme');
  s.intro = richVal('cpa-intro');
  s.nList = v('cpa-nlist');
  s.fbGen = richVal('cpa-fbgen');
  return s;
}

function restoreState_complexite(s) {
  document.getElementById('cpa-bareme').value = s.bareme || CPA_DEFAULTS.bareme;
  setRichVal('cpa-intro', s.intro || CPA_DEFAULTS.intro);
  document.getElementById('cpa-nlist').value = s.nList || CPA_DEFAULTS.nList;
  setRichVal('cpa-fbgen', s.fbGen || CPA_DEFAULTS.fbGen);
}

function resetForm_complexite() {
  document.getElementById('cpa-bareme').value = CPA_DEFAULTS.bareme;
  setRichVal('cpa-intro', CPA_DEFAULTS.intro);
  document.getElementById('cpa-nlist').value = CPA_DEFAULTS.nList;
  setRichVal('cpa-fbgen', CPA_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_complexite: captureState_complexite, restoreState_complexite: restoreState_complexite, resetForm_complexite: resetForm_complexite };
}
