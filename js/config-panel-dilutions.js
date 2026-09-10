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

// ── PANNEAU DE CONFIGURATION : dilutions (SVT, titrage et dilutions en série) ──
// Auto-dispatché par config-panel.js sur la convention de nommage
// captureState_<type> / restoreState_<type> / resetForm_<type>.

var DIL_DEFAULTS = {
  bareme: 1,
  intro: '',
  ntubeList: '2,3,4,5,6',
  fbGen: ''
};

function captureState_dilutions() {
  var gv = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  return {
    bareme: parseFloat(gv('dil-bareme')) || 1,
    intro: richVal('dil-intro'),
    ntubeList: gv('dil-ntubelist'),
    fbGen: richVal('dil-fbgen')
  };
}

function restoreState_dilutions(s) {
  s = s || {};
  var sv = function (id, val) { var e = document.getElementById(id); if (e) e.value = val; };
  sv('dil-bareme', s.bareme != null ? s.bareme : DIL_DEFAULTS.bareme);
  setRichVal('dil-intro', s.intro != null ? s.intro : DIL_DEFAULTS.intro);
  sv('dil-ntubelist', s.ntubeList != null ? s.ntubeList : DIL_DEFAULTS.ntubeList);
  setRichVal('dil-fbgen', s.fbGen != null ? s.fbGen : DIL_DEFAULTS.fbGen);
}

function resetForm_dilutions() {
  restoreState_dilutions(DIL_DEFAULTS);
}
