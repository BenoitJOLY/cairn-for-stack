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

// config-panel-chi2.js — capture/restore/reset pour le type "chi2"
// Même découpage que config-panel-malthus.js.

var CHI_DEFAULTS = {
  bareme: 1, intro: '',
  nList: '100,200', dList: '2,4,6,8', eList: '1,2,3', fbGen: ''
};

function captureState_chi2() {
  var s = { type: 'chi2' };
  s.bareme = v('chi-bareme');
  s.intro = richVal('chi-intro');
  s.nList = v('chi-nlist');
  s.dList = v('chi-dlist');
  s.eList = v('chi-elist');
  s.fbGen = richVal('chi-fbgen');
  return s;
}

function restoreState_chi2(s) {
  document.getElementById('chi-bareme').value = s.bareme || CHI_DEFAULTS.bareme;
  setRichVal('chi-intro', s.intro || CHI_DEFAULTS.intro);
  document.getElementById('chi-nlist').value = s.nList || CHI_DEFAULTS.nList;
  document.getElementById('chi-dlist').value = s.dList || CHI_DEFAULTS.dList;
  document.getElementById('chi-elist').value = s.eList || CHI_DEFAULTS.eList;
  setRichVal('chi-fbgen', s.fbGen || CHI_DEFAULTS.fbGen);
}

function resetForm_chi2() {
  document.getElementById('chi-bareme').value = CHI_DEFAULTS.bareme;
  setRichVal('chi-intro', CHI_DEFAULTS.intro);
  document.getElementById('chi-nlist').value = CHI_DEFAULTS.nList;
  document.getElementById('chi-dlist').value = CHI_DEFAULTS.dList;
  document.getElementById('chi-elist').value = CHI_DEFAULTS.eList;
  setRichVal('chi-fbgen', CHI_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_chi2: captureState_chi2, restoreState_chi2: restoreState_chi2, resetForm_chi2: resetForm_chi2 };
}
