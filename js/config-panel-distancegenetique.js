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

// config-panel-distancegenetique.js — capture/restore/reset pour le type "distancegenetique"
// Même découpage que config-panel-hardyweinberg.js.

var DG_DEFAULTS = {
  bareme: 2, intro: '',
  nList: '1000,2000', rpctList: '4,6,8,10,12,14,16,18,20,22,24', fbGen: ''
};

function captureState_distancegenetique() {
  var s = { type: 'distancegenetique' };
  s.bareme = v('dg-bareme');
  s.intro = richVal('dg-intro');
  s.nList = v('dg-nlist');
  s.rpctList = v('dg-rpctlist');
  s.fbGen = richVal('dg-fbgen');
  return s;
}

function restoreState_distancegenetique(s) {
  document.getElementById('dg-bareme').value = s.bareme || DG_DEFAULTS.bareme;
  setRichVal('dg-intro', s.intro || DG_DEFAULTS.intro);
  document.getElementById('dg-nlist').value = s.nList || DG_DEFAULTS.nList;
  document.getElementById('dg-rpctlist').value = s.rpctList || DG_DEFAULTS.rpctList;
  setRichVal('dg-fbgen', s.fbGen || DG_DEFAULTS.fbGen);
}

function resetForm_distancegenetique() {
  document.getElementById('dg-bareme').value = DG_DEFAULTS.bareme;
  setRichVal('dg-intro', DG_DEFAULTS.intro);
  document.getElementById('dg-nlist').value = DG_DEFAULTS.nList;
  document.getElementById('dg-rpctlist').value = DG_DEFAULTS.rpctList;
  setRichVal('dg-fbgen', DG_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_distancegenetique: captureState_distancegenetique, restoreState_distancegenetique: restoreState_distancegenetique, resetForm_distancegenetique: resetForm_distancegenetique };
}
