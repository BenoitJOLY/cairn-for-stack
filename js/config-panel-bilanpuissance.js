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

// config-panel-bilanpuissance.js — capture/restore/reset pour le type "bilanpuissance"
// Même découpage que config-panel-ieee754.js.

var BPU_DEFAULTS = {
  bareme: 1, intro: '',
  mList: '500,600,800,1000,1200', vList: '1,3/2,2,5/2,3',
  etaRedList: '9/10,17/20,4/5,7/8', etaMotList: '9/10,17/20,4/5,7/8', fbGen: ''
};

function captureState_bilanpuissance() {
  var s = { type: 'bilanpuissance' };
  s.bareme = v('bpu-bareme');
  s.intro = richVal('bpu-intro');
  s.mList = v('bpu-mlist');
  s.vList = v('bpu-vlist');
  s.etaRedList = v('bpu-etaredlist');
  s.etaMotList = v('bpu-etamotlist');
  s.fbGen = richVal('bpu-fbgen');
  return s;
}

function restoreState_bilanpuissance(s) {
  document.getElementById('bpu-bareme').value = s.bareme || BPU_DEFAULTS.bareme;
  setRichVal('bpu-intro', s.intro || BPU_DEFAULTS.intro);
  document.getElementById('bpu-mlist').value = s.mList || BPU_DEFAULTS.mList;
  document.getElementById('bpu-vlist').value = s.vList || BPU_DEFAULTS.vList;
  document.getElementById('bpu-etaredlist').value = s.etaRedList || BPU_DEFAULTS.etaRedList;
  document.getElementById('bpu-etamotlist').value = s.etaMotList || BPU_DEFAULTS.etaMotList;
  setRichVal('bpu-fbgen', s.fbGen || BPU_DEFAULTS.fbGen);
}

function resetForm_bilanpuissance() {
  document.getElementById('bpu-bareme').value = BPU_DEFAULTS.bareme;
  setRichVal('bpu-intro', BPU_DEFAULTS.intro);
  document.getElementById('bpu-mlist').value = BPU_DEFAULTS.mList;
  document.getElementById('bpu-vlist').value = BPU_DEFAULTS.vList;
  document.getElementById('bpu-etaredlist').value = BPU_DEFAULTS.etaRedList;
  document.getElementById('bpu-etamotlist').value = BPU_DEFAULTS.etaMotList;
  setRichVal('bpu-fbgen', BPU_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_bilanpuissance: captureState_bilanpuissance, restoreState_bilanpuissance: restoreState_bilanpuissance, resetForm_bilanpuissance: resetForm_bilanpuissance };
}
