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

// config-panel-hardyweinberg.js — capture/restore/reset pour le type "hardyweinberg"
// Même découpage que config-panel-zscore.js.

var HW_DEFAULTS = {
  bareme: 3, espece: 'souris', phenoDom: 'pelage gris', phenoRec: 'pelage blanc', intro: '',
  qList: '1/10,2/10,3/10,4/10,6/10,7/10,8/10,9/10', fbGen: ''
};

function captureState_hardyweinberg() {
  var s = { type: 'hardyweinberg' };
  s.bareme = v('hw-bareme'); s.espece = v('hw-espece'); s.phenoDom = v('hw-pheno-dom'); s.phenoRec = v('hw-pheno-rec');
  s.intro = richVal('hw-intro');
  s.qList = v('hw-qlist');
  s.fbGen = richVal('hw-fbgen');
  return s;
}

function restoreState_hardyweinberg(s) {
  document.getElementById('hw-bareme').value = s.bareme || HW_DEFAULTS.bareme;
  document.getElementById('hw-espece').value = s.espece || HW_DEFAULTS.espece;
  document.getElementById('hw-pheno-dom').value = s.phenoDom || HW_DEFAULTS.phenoDom;
  document.getElementById('hw-pheno-rec').value = s.phenoRec || HW_DEFAULTS.phenoRec;
  setRichVal('hw-intro', s.intro || HW_DEFAULTS.intro);
  document.getElementById('hw-qlist').value = s.qList || HW_DEFAULTS.qList;
  setRichVal('hw-fbgen', s.fbGen || HW_DEFAULTS.fbGen);
}

function resetForm_hardyweinberg() {
  document.getElementById('hw-bareme').value = HW_DEFAULTS.bareme;
  document.getElementById('hw-espece').value = HW_DEFAULTS.espece;
  document.getElementById('hw-pheno-dom').value = HW_DEFAULTS.phenoDom;
  document.getElementById('hw-pheno-rec').value = HW_DEFAULTS.phenoRec;
  setRichVal('hw-intro', HW_DEFAULTS.intro);
  document.getElementById('hw-qlist').value = HW_DEFAULTS.qList;
  setRichVal('hw-fbgen', HW_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_hardyweinberg: captureState_hardyweinberg, restoreState_hardyweinberg: restoreState_hardyweinberg, resetForm_hardyweinberg: resetForm_hardyweinberg };
}
