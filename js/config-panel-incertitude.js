/*
 * StackForge — générateur de questions STACK pour Moodle
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

// config-panel-incertitude.js — capture/restore/reset pour le type "incertitude"
// Même découpage que config-panel-statistiques.js (cf. preview-incertitude.js).

var INC_DEFAULTS = {
  bareme: 7, grandeur: '', symbole: 'L', unite: 'cm', intro: '',
  typeAMode: 'manuel', typeAData: '12.3,12.5,12.2,12.4,12.6',
  typeAMoyenne: '12.4', typeAEcartType: '0.15', typeAN: '5', typeADecimales: '2',
  typeBSource: 'resolution', typeBQ: '0.1', typeBDelta: '', typeBUcert: '', typeBKcert: '2', typeBValeur: '', propTerms: [],
  sigfig: '1', roundup: false, k: '1', studentEnabled: false, studentConfidence: '95',
  moyenneTolerancePct: '1', display: 'liste', fbGen: ''
};
var INC_STEP_KEYS = ['moyenne', 's', 'uA', 'uB', 'uc', 'U', 'ecriture'];

function captureState_incertitude() {
  var s = { type: 'incertitude' };
  s.bareme = v('inc-bareme'); s.grandeur = v('inc-grandeur'); s.symbole = v('inc-symbole'); s.unite = v('inc-unite');
  s.intro = richVal('inc-intro');
  s.typeAMode = (function(){ var r = document.querySelector('input[name="inc-typea-mode"]:checked'); return r ? r.value : INC_DEFAULTS.typeAMode; })();
  s.typeAData = v('inc-typea-data'); s.typeAMoyenne = v('inc-typea-moyenne'); s.typeAEcartType = v('inc-typea-ecarttype');
  s.typeAN = v('inc-typea-n'); s.typeADecimales = v('inc-typea-decimales');
  s.typeBSource = v('inc-typeb-source'); s.typeBQ = v('inc-typeb-q'); s.typeBDelta = v('inc-typeb-delta');
  s.typeBUcert = v('inc-typeb-ucert'); s.typeBKcert = v('inc-typeb-kcert'); s.typeBValeur = v('inc-typeb-valeur');
  s.propTerms = (typeof incGetPropTerms === 'function') ? incGetPropTerms() : [];
  s.sigfig = v('inc-sigfig'); s.roundup = !!document.getElementById('inc-roundup').checked; s.k = v('inc-k');
  s.studentEnabled = !!document.getElementById('inc-student-enabled').checked; s.studentConfidence = v('inc-student-confidence');
  s.moyenneTolerancePct = v('inc-moyenne-tolerance');
  s.display = v('inc-display') || INC_DEFAULTS.display;
  s.steps = {};
  INC_STEP_KEYS.forEach(function(key){ s.steps[key] = !!document.getElementById('inc-step-' + key).checked; });
  s.fbGen = richVal('inc-fbgen');
  return s;
}

function restoreState_incertitude(s) {
  document.getElementById('inc-bareme').value = s.bareme || INC_DEFAULTS.bareme;
  document.getElementById('inc-grandeur').value = s.grandeur || INC_DEFAULTS.grandeur;
  document.getElementById('inc-symbole').value = s.symbole || INC_DEFAULTS.symbole;
  document.getElementById('inc-unite').value = s.unite || INC_DEFAULTS.unite;
  setRichVal('inc-intro', s.intro || INC_DEFAULTS.intro);
  document.querySelectorAll('input[name="inc-typea-mode"]').forEach(function(r){ r.checked = (r.value === (s.typeAMode || INC_DEFAULTS.typeAMode)); });
  document.getElementById('inc-typea-data').value = s.typeAData || INC_DEFAULTS.typeAData;
  document.getElementById('inc-typea-moyenne').value = s.typeAMoyenne || INC_DEFAULTS.typeAMoyenne;
  document.getElementById('inc-typea-ecarttype').value = s.typeAEcartType || INC_DEFAULTS.typeAEcartType;
  document.getElementById('inc-typea-n').value = s.typeAN || INC_DEFAULTS.typeAN;
  document.getElementById('inc-typea-decimales').value = s.typeADecimales || INC_DEFAULTS.typeADecimales;
  document.getElementById('inc-typeb-source').value = s.typeBSource || INC_DEFAULTS.typeBSource;
  document.getElementById('inc-typeb-q').value = s.typeBQ || INC_DEFAULTS.typeBQ;
  document.getElementById('inc-typeb-delta').value = s.typeBDelta || INC_DEFAULTS.typeBDelta;
  document.getElementById('inc-typeb-ucert').value = s.typeBUcert || INC_DEFAULTS.typeBUcert;
  document.getElementById('inc-typeb-kcert').value = s.typeBKcert || INC_DEFAULTS.typeBKcert;
  document.getElementById('inc-typeb-valeur').value = s.typeBValeur || INC_DEFAULTS.typeBValeur;
  var propBody = document.getElementById('inc-prop-body');
  if (propBody) propBody.innerHTML = '';
  (s.propTerms || []).forEach(function(t){ if (typeof incAddPropTerm === 'function') incAddPropTerm(t.value, t.incert, t.denom); });
  document.getElementById('inc-sigfig').value = s.sigfig || INC_DEFAULTS.sigfig;
  document.getElementById('inc-roundup').checked = !!s.roundup;
  document.getElementById('inc-k').value = s.k || INC_DEFAULTS.k;
  document.getElementById('inc-student-enabled').checked = !!s.studentEnabled;
  document.getElementById('inc-student-confidence').value = s.studentConfidence || INC_DEFAULTS.studentConfidence;
  document.getElementById('inc-moyenne-tolerance').value = s.moyenneTolerancePct || INC_DEFAULTS.moyenneTolerancePct;
  document.getElementById('inc-display').value = s.display || INC_DEFAULTS.display;
  document.querySelectorAll('input[name="inc-display-radio"]').forEach(function(r){ r.checked = (r.value === (s.display || INC_DEFAULTS.display)); });
  var steps = s.steps || {};
  INC_STEP_KEYS.forEach(function(key){ document.getElementById('inc-step-' + key).checked = !!steps[key]; });
  setRichVal('inc-fbgen', s.fbGen || INC_DEFAULTS.fbGen);
  if (typeof incFormChange === 'function') incFormChange();
}

function resetForm_incertitude() {
  document.getElementById('inc-bareme').value = INC_DEFAULTS.bareme;
  document.getElementById('inc-grandeur').value = INC_DEFAULTS.grandeur;
  document.getElementById('inc-symbole').value = INC_DEFAULTS.symbole;
  document.getElementById('inc-unite').value = INC_DEFAULTS.unite;
  setRichVal('inc-intro', INC_DEFAULTS.intro);
  document.querySelectorAll('input[name="inc-typea-mode"]').forEach(function(r){ r.checked = (r.value === INC_DEFAULTS.typeAMode); });
  document.getElementById('inc-typea-data').value = INC_DEFAULTS.typeAData;
  document.getElementById('inc-typea-moyenne').value = INC_DEFAULTS.typeAMoyenne;
  document.getElementById('inc-typea-ecarttype').value = INC_DEFAULTS.typeAEcartType;
  document.getElementById('inc-typea-n').value = INC_DEFAULTS.typeAN;
  document.getElementById('inc-typea-decimales').value = INC_DEFAULTS.typeADecimales;
  document.getElementById('inc-typeb-source').value = INC_DEFAULTS.typeBSource;
  document.getElementById('inc-typeb-q').value = INC_DEFAULTS.typeBQ;
  document.getElementById('inc-typeb-delta').value = INC_DEFAULTS.typeBDelta;
  document.getElementById('inc-typeb-ucert').value = INC_DEFAULTS.typeBUcert;
  document.getElementById('inc-typeb-kcert').value = INC_DEFAULTS.typeBKcert;
  document.getElementById('inc-typeb-valeur').value = INC_DEFAULTS.typeBValeur;
  var propBodyR = document.getElementById('inc-prop-body');
  if (propBodyR) propBodyR.innerHTML = '';
  document.getElementById('inc-sigfig').value = INC_DEFAULTS.sigfig;
  document.getElementById('inc-roundup').checked = INC_DEFAULTS.roundup;
  document.getElementById('inc-k').value = INC_DEFAULTS.k;
  document.getElementById('inc-student-enabled').checked = INC_DEFAULTS.studentEnabled;
  document.getElementById('inc-student-confidence').value = INC_DEFAULTS.studentConfidence;
  document.getElementById('inc-moyenne-tolerance').value = INC_DEFAULTS.moyenneTolerancePct;
  document.getElementById('inc-display').value = INC_DEFAULTS.display;
  document.querySelectorAll('input[name="inc-display-radio"]').forEach(function(r){ r.checked = (r.value === INC_DEFAULTS.display); });
  INC_STEP_KEYS.forEach(function(key){ document.getElementById('inc-step-' + key).checked = (key === 'moyenne' || key === 'U' || key === 'ecriture'); });
  setRichVal('inc-fbgen', INC_DEFAULTS.fbGen);
  if (typeof incFormChange === 'function') incFormChange();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_incertitude: captureState_incertitude, restoreState_incertitude: restoreState_incertitude, resetForm_incertitude: resetForm_incertitude };
}
