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

// config-panel-regle10.js — capture/restore/reset pour le type "regle10"
// Même découpage que config-panel-radiochronologie.js.

var REG_DEFAULTS = {
  bareme: 2, intro: '',
  b0List: '5000,10000,20000,50000', nPartAList: '2,3,4', kList: '1,2,3',
  mList: '1/5,3/10,2/5,1/2,3/5,7/10,4/5,9/10,1', fbGen: ''
};

function captureState_regle10() {
  var s = { type: 'regle10' };
  s.bareme = v('reg-bareme');
  s.intro = richVal('reg-intro');
  s.b0List = v('reg-b0list');
  s.nPartAList = v('reg-npartalist');
  s.kList = v('reg-klist');
  s.mList = v('reg-mlist');
  s.fbGen = richVal('reg-fbgen');
  return s;
}

function restoreState_regle10(s) {
  document.getElementById('reg-bareme').value = s.bareme || REG_DEFAULTS.bareme;
  setRichVal('reg-intro', s.intro || REG_DEFAULTS.intro);
  document.getElementById('reg-b0list').value = s.b0List || REG_DEFAULTS.b0List;
  document.getElementById('reg-npartalist').value = s.nPartAList || REG_DEFAULTS.nPartAList;
  document.getElementById('reg-klist').value = s.kList || REG_DEFAULTS.kList;
  document.getElementById('reg-mlist').value = s.mList || REG_DEFAULTS.mList;
  setRichVal('reg-fbgen', s.fbGen || REG_DEFAULTS.fbGen);
}

function resetForm_regle10() {
  document.getElementById('reg-bareme').value = REG_DEFAULTS.bareme;
  setRichVal('reg-intro', REG_DEFAULTS.intro);
  document.getElementById('reg-b0list').value = REG_DEFAULTS.b0List;
  document.getElementById('reg-npartalist').value = REG_DEFAULTS.nPartAList;
  document.getElementById('reg-klist').value = REG_DEFAULTS.kList;
  document.getElementById('reg-mlist').value = REG_DEFAULTS.mList;
  setRichVal('reg-fbgen', REG_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_regle10: captureState_regle10, restoreState_regle10: restoreState_regle10, resetForm_regle10: resetForm_regle10 };
}
