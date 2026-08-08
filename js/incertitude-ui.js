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

// incertitude-ui.js — contrôleur du panneau "Incertitude" (bascules Type A/B)
// L'aperçu iframe (js/preview-incertitude.js) se rafraîchit tout seul sur tout
// événement input/change du panneau (cf. _hsWireSimplePreview) : ce fichier ne
// gère QUE l'affichage conditionnel des sous-blocs Type A / Type B.

function incTypeAModeChange() {
  var mode = (document.querySelector('input[name="inc-typea-mode"]:checked') || {}).value || 'manuel';
  var manuelWrap = document.getElementById('inc-typea-manuel-wrap');
  var aleaWrap = document.getElementById('inc-typea-alea-wrap');
  if (manuelWrap) manuelWrap.style.display = (mode === 'manuel') ? '' : 'none';
  if (aleaWrap) aleaWrap.style.display = (mode === 'aleatoire') ? '' : 'none';
}

function incTypeBSourceChange() {
  var source = (document.getElementById('inc-typeb-source') || {}).value || 'resolution';
  var wraps = {
    resolution: document.getElementById('inc-typeb-resolution-wrap'),
    tolerance: document.getElementById('inc-typeb-tolerance-wrap'),
    calibration: document.getElementById('inc-typeb-calibration-wrap'),
    impose: document.getElementById('inc-typeb-impose-wrap'),
    propagation: document.getElementById('inc-typeb-propagation-wrap')
  };
  Object.keys(wraps).forEach(function (key) {
    if (wraps[key]) wraps[key].style.display = (key === source) ? '' : 'none';
  });
  if (source === 'propagation' && document.getElementById('inc-prop-body') && !document.getElementById('inc-prop-body').children.length) {
    incAddPropTerm(); incAddPropTerm();
  }
  // Une grandeur composée n'est jamais mesurée directement : le bloc Type A et les
  // étapes s/uA/uB (qui n'ont pas de sens ici) sont masqués et décochés.
  var isProp = (source === 'propagation');
  var typeASection = document.getElementById('inc-typea-section');
  if (typeASection) typeASection.style.display = isProp ? 'none' : '';
  ['s', 'uA', 'uB'].forEach(function (key) {
    var wrap = document.getElementById('inc-step-' + key + '-wrap');
    var box = document.getElementById('inc-step-' + key);
    if (wrap) wrap.style.display = isProp ? 'none' : '';
    if (isProp && box) box.checked = false;
  });
}

// Grandeurs de la source Type B "propagation" : lignes dynamiques (symbole, valeur,
// incertitude, unité optionnelle), même pattern que addCWRow (crossword-ui.js).
function incAddPropTerm(symbole, value, incert, unite) {
  var body = document.getElementById('inc-prop-body');
  if (!body) return;
  var row = document.createElement('div');
  row.className = 'inc-prop-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;';
  row.innerHTML =
    '<input type="text" class="inc-prop-symbole" placeholder="' + (I18N.t('inc.prop_symbole_ph') || 'Symbole') + '" style="width:70px;font-family:monospace;">' +
    '<input type="number" class="inc-prop-value" step="any" placeholder="' + (I18N.t('inc.prop_value_ph') || 'Valeur') + '" style="width:100px;">' +
    '<input type="number" class="inc-prop-incert" step="any" min="0" placeholder="' + (I18N.t('inc.prop_incert_ph') || 'Incertitude') + '" style="width:110px;">' +
    '<input type="text" class="inc-prop-unite" placeholder="' + (I18N.t('inc.prop_unite_ph') || 'Unité') + '" style="width:80px;">' +
    '<button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2;border:none;border-radius:4px;width:24px;height:24px;cursor:pointer;color:#dc2626;font-size:.7rem;">✕</button>';
  body.appendChild(row);
  row.querySelector('.inc-prop-symbole').value = (symbole != null) ? symbole : '';
  row.querySelector('.inc-prop-value').value = (value != null) ? value : '';
  row.querySelector('.inc-prop-incert').value = (incert != null) ? incert : '';
  row.querySelector('.inc-prop-unite').value = (unite != null) ? unite : '';
}

function incGetPropTerms() {
  var rows = document.querySelectorAll('#inc-prop-body .inc-prop-row');
  var terms = [];
  rows.forEach(function (row) {
    var symbole = row.querySelector('.inc-prop-symbole').value.trim();
    var valeur = row.querySelector('.inc-prop-value').value;
    var incertitude = row.querySelector('.inc-prop-incert').value;
    var unite = row.querySelector('.inc-prop-unite').value.trim();
    if (symbole !== '' && valeur !== '' && incertitude !== '') terms.push({ symbole: symbole, valeur: valeur, incertitude: incertitude, unite: unite });
  });
  return terms;
}

function incDisplayChange(mode) {
  var el = document.getElementById('inc-display');
  if (el) el.value = mode;
}

function incStudentToggle() {
  var enabled = !!(document.getElementById('inc-student-enabled') || {}).checked;
  var wrap = document.getElementById('inc-student-wrap');
  var kSelect = document.getElementById('inc-k');
  if (wrap) wrap.style.display = enabled ? '' : 'none';
  if (kSelect) kSelect.disabled = enabled;
}

function incMoyenneToleranceToggle() {
  var checked = !!(document.getElementById('inc-step-moyenne') || {}).checked;
  var wrap = document.getElementById('inc-moyenne-tolerance-wrap');
  if (wrap) wrap.style.display = checked ? '' : 'none';
}

function incEcritureFormatToggle() {
  var checked = !!(document.getElementById('inc-step-ecriture') || {}).checked;
  var wrap = document.getElementById('inc-ecriture-format-wrap');
  if (wrap) wrap.style.display = checked ? '' : 'none';
}

function incFormChange() {
  incTypeAModeChange();
  incTypeBSourceChange();
  incStudentToggle();
  incMoyenneToleranceToggle();
  incEcritureFormatToggle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    incTypeAModeChange: incTypeAModeChange, incTypeBSourceChange: incTypeBSourceChange, incStudentToggle: incStudentToggle,
    incMoyenneToleranceToggle: incMoyenneToleranceToggle, incEcritureFormatToggle: incEcritureFormatToggle, incFormChange: incFormChange,
    incAddPropTerm: incAddPropTerm, incGetPropTerms: incGetPropTerms, incDisplayChange: incDisplayChange
  };
}
