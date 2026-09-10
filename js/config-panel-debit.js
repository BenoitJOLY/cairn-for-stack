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

// config-panel-debit.js — capture/restore/reset pour le type "debit"
// Même découpage que config-panel-chi2.js.

var DEB_DEFAULTS = {
  bareme: 1, intro: '',
  fcList: '60,65,70,72,75,80', vesList: '60,65,70,75,80,90', fbGen: ''
};

function captureState_debit() {
  var s = { type: 'debit' };
  s.bareme = v('deb-bareme');
  s.intro = richVal('deb-intro');
  s.fcList = v('deb-fclist');
  s.vesList = v('deb-veslist');
  s.fbGen = richVal('deb-fbgen');
  return s;
}

function restoreState_debit(s) {
  document.getElementById('deb-bareme').value = s.bareme || DEB_DEFAULTS.bareme;
  setRichVal('deb-intro', s.intro || DEB_DEFAULTS.intro);
  document.getElementById('deb-fclist').value = s.fcList || DEB_DEFAULTS.fcList;
  document.getElementById('deb-veslist').value = s.vesList || DEB_DEFAULTS.vesList;
  setRichVal('deb-fbgen', s.fbGen || DEB_DEFAULTS.fbGen);
}

function resetForm_debit() {
  document.getElementById('deb-bareme').value = DEB_DEFAULTS.bareme;
  setRichVal('deb-intro', DEB_DEFAULTS.intro);
  document.getElementById('deb-fclist').value = DEB_DEFAULTS.fcList;
  document.getElementById('deb-veslist').value = DEB_DEFAULTS.vesList;
  setRichVal('deb-fbgen', DEB_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_debit: captureState_debit, restoreState_debit: restoreState_debit, resetForm_debit: resetForm_debit };
}
