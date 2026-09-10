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

// ── GÉNÉRATEUR "Titrage et dilutions en série" (SVT, immunologie) — helper Maxima pur ──
// Douzième et dernier type SVT de l'app, gabarit suivi : js/gen-nernst-calc.js /
// js/gen-chi2-calc.js (tirage natif Maxima via rand() sur une liste
// configurable par l'enseignant, une seule sous-question). Gabarit hand-XML
// déjà validé : svt-12-dilutions-serie.xml. Piège classique diagnostiqué :
// addition des facteurs de dilution (10*n) au lieu de leur multiplication
// (10^n).
function _dilVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var nRaw = (g.ntubeList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (nRaw.length < 1) throw new Error('Dilutions en série : indiquez au moins un numéro de tube possible.');

  return `/* Q${X} Titrage et dilutions en serie (tirage natif Maxima) */
q${X}_dil_ntubelist: [${nRaw.join(',')}]$
q${X}_dil_ntube: rand(q${X}_dil_ntubelist)$
q${X}_dil_correct: 1/10^q${X}_dil_ntube$
q${X}_dil_erraddition: 1/(10*q${X}_dil_ntube)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _dilVars: _dilVars };
}
