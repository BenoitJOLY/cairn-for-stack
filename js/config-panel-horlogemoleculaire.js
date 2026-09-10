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

// config-panel-horlogemoleculaire.js — capture/restore/reset pour le type "horlogemoleculaire"
// Même découpage que config-panel-distancegenetique.js.

var HM_DEFAULTS = {
  bareme: 2, intro: '',
  seqList: '1000,2000,5000', tauxList: '1,2,4,5,8', dpctList: '1,2,3,4,5,6,8,10', fbGen: ''
};

function captureState_horlogemoleculaire() {
  var s = { type: 'horlogemoleculaire' };
  s.bareme = v('hm-bareme');
  s.intro = richVal('hm-intro');
  s.seqList = v('hm-seqlist');
  s.tauxList = v('hm-tauxlist');
  s.dpctList = v('hm-dpctlist');
  s.fbGen = richVal('hm-fbgen');
  return s;
}

function restoreState_horlogemoleculaire(s) {
  document.getElementById('hm-bareme').value = s.bareme || HM_DEFAULTS.bareme;
  setRichVal('hm-intro', s.intro || HM_DEFAULTS.intro);
  document.getElementById('hm-seqlist').value = s.seqList || HM_DEFAULTS.seqList;
  document.getElementById('hm-tauxlist').value = s.tauxList || HM_DEFAULTS.tauxList;
  document.getElementById('hm-dpctlist').value = s.dpctList || HM_DEFAULTS.dpctList;
  setRichVal('hm-fbgen', s.fbGen || HM_DEFAULTS.fbGen);
}

function resetForm_horlogemoleculaire() {
  document.getElementById('hm-bareme').value = HM_DEFAULTS.bareme;
  setRichVal('hm-intro', HM_DEFAULTS.intro);
  document.getElementById('hm-seqlist').value = HM_DEFAULTS.seqList;
  document.getElementById('hm-tauxlist').value = HM_DEFAULTS.tauxList;
  document.getElementById('hm-dpctlist').value = HM_DEFAULTS.dpctList;
  setRichVal('hm-fbgen', HM_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_horlogemoleculaire: captureState_horlogemoleculaire, restoreState_horlogemoleculaire: restoreState_horlogemoleculaire, resetForm_horlogemoleculaire: resetForm_horlogemoleculaire };
}
