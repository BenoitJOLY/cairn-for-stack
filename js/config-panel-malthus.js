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

// config-panel-malthus.js — capture/restore/reset pour le type "malthus"
// Même découpage que config-panel-ondesismique.js.

var MAL_DEFAULTS = {
  bareme: 1, intro: '',
  n0List: '200,500,1000,2000', qList: '2,3', tList: '10,12,15,18,20', fbGen: ''
};

function captureState_malthus() {
  var s = { type: 'malthus' };
  s.bareme = v('mal-bareme');
  s.intro = richVal('mal-intro');
  s.n0List = v('mal-n0list');
  s.qList = v('mal-qlist');
  s.tList = v('mal-tlist');
  s.fbGen = richVal('mal-fbgen');
  return s;
}

function restoreState_malthus(s) {
  document.getElementById('mal-bareme').value = s.bareme || MAL_DEFAULTS.bareme;
  setRichVal('mal-intro', s.intro || MAL_DEFAULTS.intro);
  document.getElementById('mal-n0list').value = s.n0List || MAL_DEFAULTS.n0List;
  document.getElementById('mal-qlist').value = s.qList || MAL_DEFAULTS.qList;
  document.getElementById('mal-tlist').value = s.tList || MAL_DEFAULTS.tList;
  setRichVal('mal-fbgen', s.fbGen || MAL_DEFAULTS.fbGen);
}

function resetForm_malthus() {
  document.getElementById('mal-bareme').value = MAL_DEFAULTS.bareme;
  setRichVal('mal-intro', MAL_DEFAULTS.intro);
  document.getElementById('mal-n0list').value = MAL_DEFAULTS.n0List;
  document.getElementById('mal-qlist').value = MAL_DEFAULTS.qList;
  document.getElementById('mal-tlist').value = MAL_DEFAULTS.tList;
  setRichVal('mal-fbgen', MAL_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_malthus: captureState_malthus, restoreState_malthus: restoreState_malthus, resetForm_malthus: resetForm_malthus };
}
