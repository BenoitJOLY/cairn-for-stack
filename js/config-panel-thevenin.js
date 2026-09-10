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

// config-panel-thevenin.js — capture/restore/reset pour le type "thevenin"
// Même découpage que config-panel-ieee754.js.

var THV_DEFAULTS = {
  bareme: 1, intro: '',
  eList: '6,9,12,15,24', r1List: '10,20,30,40,100', r2List: '10,20,30,40,100', r3List: '10,20,50,100', fbGen: ''
};

function captureState_thevenin() {
  var s = { type: 'thevenin' };
  s.bareme = v('thv-bareme');
  s.intro = richVal('thv-intro');
  s.eList = v('thv-elist');
  s.r1List = v('thv-r1list');
  s.r2List = v('thv-r2list');
  s.r3List = v('thv-r3list');
  s.fbGen = richVal('thv-fbgen');
  return s;
}

function restoreState_thevenin(s) {
  document.getElementById('thv-bareme').value = s.bareme || THV_DEFAULTS.bareme;
  setRichVal('thv-intro', s.intro || THV_DEFAULTS.intro);
  document.getElementById('thv-elist').value = s.eList || THV_DEFAULTS.eList;
  document.getElementById('thv-r1list').value = s.r1List || THV_DEFAULTS.r1List;
  document.getElementById('thv-r2list').value = s.r2List || THV_DEFAULTS.r2List;
  document.getElementById('thv-r3list').value = s.r3List || THV_DEFAULTS.r3List;
  setRichVal('thv-fbgen', s.fbGen || THV_DEFAULTS.fbGen);
}

function resetForm_thevenin() {
  document.getElementById('thv-bareme').value = THV_DEFAULTS.bareme;
  setRichVal('thv-intro', THV_DEFAULTS.intro);
  document.getElementById('thv-elist').value = THV_DEFAULTS.eList;
  document.getElementById('thv-r1list').value = THV_DEFAULTS.r1List;
  document.getElementById('thv-r2list').value = THV_DEFAULTS.r2List;
  document.getElementById('thv-r3list').value = THV_DEFAULTS.r3List;
  setRichVal('thv-fbgen', THV_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_thevenin: captureState_thevenin, restoreState_thevenin: restoreState_thevenin, resetForm_thevenin: resetForm_thevenin };
}
