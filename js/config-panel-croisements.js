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

// config-panel-croisements.js — capture/restore/reset pour le type "croisements"
// Même découpage que config-panel-hardyweinberg.js.

var CR_DEFAULTS = {
  bareme: 3, espece: 'la drosophile (Drosophila melanogaster)',
  autoTrait: 'la forme des ailes', sexTrait: 'la couleur des yeux', intro: '',
  autoDomName: 'ailes normales', autoDomLetter: 'V', autoRecName: 'ailes vestigiales',
  sexDomName: 'yeux normaux', sexDomLetter: 'W', sexRecName: 'yeux blancs',
  fbGen: ''
};

function captureState_croisements() {
  var s = { type: 'croisements' };
  s.bareme = v('cr-bareme'); s.espece = v('cr-espece');
  s.autoTrait = v('cr-auto-trait'); s.sexTrait = v('cr-sex-trait');
  s.intro = richVal('cr-intro');
  s.autoDomName = v('cr-auto-dom-name'); s.autoDomLetter = v('cr-auto-dom-letter'); s.autoRecName = v('cr-auto-rec-name');
  s.sexDomName = v('cr-sex-dom-name'); s.sexDomLetter = v('cr-sex-dom-letter'); s.sexRecName = v('cr-sex-rec-name');
  s.fbGen = richVal('cr-fbgen');
  return s;
}

function restoreState_croisements(s) {
  document.getElementById('cr-bareme').value = s.bareme || CR_DEFAULTS.bareme;
  document.getElementById('cr-espece').value = s.espece || CR_DEFAULTS.espece;
  document.getElementById('cr-auto-trait').value = s.autoTrait || CR_DEFAULTS.autoTrait;
  document.getElementById('cr-sex-trait').value = s.sexTrait || CR_DEFAULTS.sexTrait;
  setRichVal('cr-intro', s.intro || CR_DEFAULTS.intro);
  document.getElementById('cr-auto-dom-name').value = s.autoDomName || CR_DEFAULTS.autoDomName;
  document.getElementById('cr-auto-dom-letter').value = s.autoDomLetter || CR_DEFAULTS.autoDomLetter;
  document.getElementById('cr-auto-rec-name').value = s.autoRecName || CR_DEFAULTS.autoRecName;
  document.getElementById('cr-sex-dom-name').value = s.sexDomName || CR_DEFAULTS.sexDomName;
  document.getElementById('cr-sex-dom-letter').value = s.sexDomLetter || CR_DEFAULTS.sexDomLetter;
  document.getElementById('cr-sex-rec-name').value = s.sexRecName || CR_DEFAULTS.sexRecName;
  setRichVal('cr-fbgen', s.fbGen || CR_DEFAULTS.fbGen);
}

function resetForm_croisements() {
  document.getElementById('cr-bareme').value = CR_DEFAULTS.bareme;
  document.getElementById('cr-espece').value = CR_DEFAULTS.espece;
  document.getElementById('cr-auto-trait').value = CR_DEFAULTS.autoTrait;
  document.getElementById('cr-sex-trait').value = CR_DEFAULTS.sexTrait;
  setRichVal('cr-intro', CR_DEFAULTS.intro);
  document.getElementById('cr-auto-dom-name').value = CR_DEFAULTS.autoDomName;
  document.getElementById('cr-auto-dom-letter').value = CR_DEFAULTS.autoDomLetter;
  document.getElementById('cr-auto-rec-name').value = CR_DEFAULTS.autoRecName;
  document.getElementById('cr-sex-dom-name').value = CR_DEFAULTS.sexDomName;
  document.getElementById('cr-sex-dom-letter').value = CR_DEFAULTS.sexDomLetter;
  document.getElementById('cr-sex-rec-name').value = CR_DEFAULTS.sexRecName;
  setRichVal('cr-fbgen', CR_DEFAULTS.fbGen);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_croisements: captureState_croisements, restoreState_croisements: restoreState_croisements, resetForm_croisements: resetForm_croisements };
}
