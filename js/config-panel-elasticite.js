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

// config-panel-elasticite.js — capture/restore/reset pour le type "elasticite"
// Même découpage que config-panel-ieee754.js.

var ELA_DEFAULTS = {
  bareme: 1, intro: '',
  p0List: '10,20,50,100', p1List: '12,25,55,110',
  q0List: '1000,2000,500,800', q1List: '900,1600,420,680', fbGen: ''
};

function captureState_elasticite() {
  var s = { type: 'elasticite' };
  s.bareme = v('ela-bareme');
  s.intro = richVal('ela-intro');
  s.p0List = v('ela-p0list');
  s.p1List = v('ela-p1list');
  s.q0List = v('ela-q0list');
  s.q1List = v('ela-q1list');
  s.fbGen = richVal('ela-fbgen');
  return s;
}

function restoreState_elasticite(s) {
  document.getElementById('ela-bareme').value = s.bareme || ELA_DEFAULTS.bareme;
  setRichVal('ela-intro', s.intro || ELA_DEFAULTS.intro);
  document.getElementById('ela-p0list').value = s.p0List || ELA_DEFAULTS.p0List;
  document.getElementById('ela-p1list').value = s.p1List || ELA_DEFAULTS.p1List;
  document.getElementById('ela-q0list').value = s.q0List || ELA_DEFAULTS.q0List;
  document.getElementById('ela-q1list').value = s.q1List || ELA_DEFAULTS.q1List;
  setRichVal('ela-fbgen', s.fbGen || ELA_DEFAULTS.fbGen);
}

function resetForm_elasticite() {
  document.getElementById('ela-bareme').value = ELA_DEFAULTS.bareme;
  setRichVal('ela-intro', ELA_DEFAULTS.intro);
  document.getElementById('ela-p0list').value = ELA_DEFAULTS.p0List;
  document.getElementById('ela-p1list').value = ELA_DEFAULTS.p1List;
  document.getElementById('ela-q0list').value = ELA_DEFAULTS.q0List;
  document.getElementById('ela-q1list').value = ELA_DEFAULTS.q1List;
  setRichVal('ela-fbgen', ELA_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_elasticite: captureState_elasticite, restoreState_elasticite: restoreState_elasticite, resetForm_elasticite: resetForm_elasticite };
}
