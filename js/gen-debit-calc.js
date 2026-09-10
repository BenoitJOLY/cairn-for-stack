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

// ── GÉNÉRATEUR "Débit cardiaque" (SVT, conversion mL vers L) — helper Maxima pur ──
// Dixième type SVT de l'app, gabarit suivi : js/gen-malthus-calc.js (tirage
// natif Maxima via rand() sur des listes configurables par l'enseignant,
// une seule sous-question). Gabarit hand-XML déjà validé :
// svt-10-debit-cardiaque.xml. Piège classique diagnostiqué : oubli de la
// conversion mL -> L du volume d'éjection systolique avant multiplication.
function _debVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var fcRaw = (g.fcList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var vesRaw = (g.vesList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (fcRaw.length < 1) throw new Error('Débit cardiaque : indiquez au moins une fréquence cardiaque possible.');
  if (vesRaw.length < 1) throw new Error('Débit cardiaque : indiquez au moins un volume d\'éjection systolique possible.');

  return `/* Q${X} Debit cardiaque - conversion mL vers L (tirage natif Maxima) */
q${X}_deb_fclist: [${fcRaw.join(',')}]$
q${X}_deb_fc: rand(q${X}_deb_fclist)$
q${X}_deb_veslist: [${vesRaw.join(',')}]$
q${X}_deb_vesml: rand(q${X}_deb_veslist)$
q${X}_deb_qcorrect: q${X}_deb_fc*q${X}_deb_vesml/1000$
q${X}_deb_errforgotconvert: q${X}_deb_fc*q${X}_deb_vesml$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _debVars: _debVars };
}
