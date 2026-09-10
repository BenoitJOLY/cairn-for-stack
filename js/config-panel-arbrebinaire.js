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

// config-panel-arbrebinaire.js — capture/restore/reset pour le type "arbrebinaire"
// Même découpage que config-panel-chi2.js.

var ARB_DEFAULTS = {
  bareme: 1, intro: '',
  hList: '2,3,4,5,6', fbGen: ''
};

function captureState_arbrebinaire() {
  var s = { type: 'arbrebinaire' };
  s.bareme = v('arb-bareme');
  s.intro = richVal('arb-intro');
  s.hList = v('arb-hlist');
  s.fbGen = richVal('arb-fbgen');
  return s;
}

function restoreState_arbrebinaire(s) {
  document.getElementById('arb-bareme').value = s.bareme || ARB_DEFAULTS.bareme;
  setRichVal('arb-intro', s.intro || ARB_DEFAULTS.intro);
  document.getElementById('arb-hlist').value = s.hList || ARB_DEFAULTS.hList;
  setRichVal('arb-fbgen', s.fbGen || ARB_DEFAULTS.fbGen);
}

function resetForm_arbrebinaire() {
  document.getElementById('arb-bareme').value = ARB_DEFAULTS.bareme;
  setRichVal('arb-intro', ARB_DEFAULTS.intro);
  document.getElementById('arb-hlist').value = ARB_DEFAULTS.hList;
  setRichVal('arb-fbgen', ARB_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_arbrebinaire: captureState_arbrebinaire, restoreState_arbrebinaire: restoreState_arbrebinaire, resetForm_arbrebinaire: resetForm_arbrebinaire };
}
