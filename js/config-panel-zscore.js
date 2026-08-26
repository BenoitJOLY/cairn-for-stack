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

// config-panel-zscore.js — capture/restore/reset pour le type "zscore"
// Même découpage que config-panel-incertitude.js.

var ZS_DEFAULTS = {
  bareme: 2, grandeur: '', symbole: 'x', unite: '', intro: '',
  xMes: '', xRef: '', uc: '', seuil: '2',
  steps: { z: true, conclusion: true }, fbGen: ''
};

function captureState_zscore() {
  var s = { type: 'zscore' };
  s.bareme = v('zs-bareme'); s.grandeur = v('zs-grandeur'); s.symbole = v('zs-symbole'); s.unite = v('zs-unite');
  s.intro = richVal('zs-intro');
  s.xMes = v('zs-xmes'); s.xRef = v('zs-xref'); s.uc = v('zs-uc'); s.seuil = v('zs-seuil');
  s.steps = { z: !!document.getElementById('zs-step-z').checked, conclusion: !!document.getElementById('zs-step-conclusion').checked };
  s.fbGen = richVal('zs-fbgen');
  return s;
}

function restoreState_zscore(s) {
  document.getElementById('zs-bareme').value = s.bareme || ZS_DEFAULTS.bareme;
  document.getElementById('zs-grandeur').value = s.grandeur || ZS_DEFAULTS.grandeur;
  document.getElementById('zs-symbole').value = s.symbole || ZS_DEFAULTS.symbole;
  document.getElementById('zs-unite').value = s.unite || ZS_DEFAULTS.unite;
  setRichVal('zs-intro', s.intro || ZS_DEFAULTS.intro);
  document.getElementById('zs-xmes').value = s.xMes || ZS_DEFAULTS.xMes;
  document.getElementById('zs-xref').value = s.xRef || ZS_DEFAULTS.xRef;
  document.getElementById('zs-uc').value = s.uc || ZS_DEFAULTS.uc;
  document.getElementById('zs-seuil').value = s.seuil || ZS_DEFAULTS.seuil;
  var steps = s.steps || ZS_DEFAULTS.steps;
  document.getElementById('zs-step-z').checked = steps.z !== false;
  document.getElementById('zs-step-conclusion').checked = steps.conclusion !== false;
  setRichVal('zs-fbgen', s.fbGen || ZS_DEFAULTS.fbGen);
  if (typeof zsFormChange === 'function') zsFormChange();
}

function resetForm_zscore() {
  document.getElementById('zs-bareme').value = ZS_DEFAULTS.bareme;
  document.getElementById('zs-grandeur').value = ZS_DEFAULTS.grandeur;
  document.getElementById('zs-symbole').value = ZS_DEFAULTS.symbole;
  document.getElementById('zs-unite').value = ZS_DEFAULTS.unite;
  setRichVal('zs-intro', ZS_DEFAULTS.intro);
  document.getElementById('zs-xmes').value = ZS_DEFAULTS.xMes;
  document.getElementById('zs-xref').value = ZS_DEFAULTS.xRef;
  document.getElementById('zs-uc').value = ZS_DEFAULTS.uc;
  document.getElementById('zs-seuil').value = ZS_DEFAULTS.seuil;
  document.getElementById('zs-step-z').checked = true;
  document.getElementById('zs-step-conclusion').checked = true;
  setRichVal('zs-fbgen', ZS_DEFAULTS.fbGen);
  if (typeof zsFormChange === 'function') zsFormChange();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_zscore: captureState_zscore, restoreState_zscore: restoreState_zscore, resetForm_zscore: resetForm_zscore };
}
