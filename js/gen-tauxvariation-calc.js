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

// ── GÉNÉRATEUR "Taux de variation, coefficient multiplicateur et indice" (Économie) — helper Maxima pur ──
// Premier type Économie de l'app (nouvelle catégorie "Économie"), gabarit
// suivi : js/gen-bilanpuissance-calc.js (tirage natif Maxima via rand() sur
// des listes configurables, une seule sous-question). Une grandeur
// économique passe de la valeur V0 (date de départ) à la valeur V1 (date
// d'arrivée) ; on demande le taux de variation (en %) : t = (V1-V0)/V0*100.
// Pièges classiques diagnostiqués :
//  - confondre le taux de variation avec l'indice base 100 (oubli de
//    soustraire 100, ou de soustraire 1 au coefficient multiplicateur) :
//    V1/V0*100 ;
//  - inverser le sens de la variation (utiliser V0 comme valeur d'arrivée) :
//    (V0-V1)/V0*100.
// Les listes par défaut sont volontairement disjointes (V0 et V1 ne peuvent
// jamais tomber sur la même valeur), pour ne jamais tirer une variation
// nulle ni faire coïncider deux formules par accident.
function _tvaVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var v0Raw = (g.v0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var v1Raw = (g.v1List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (v0Raw.length < 1) throw new Error('Taux de variation : indiquez au moins une valeur initiale V0 possible.');
  if (v1Raw.length < 1) throw new Error('Taux de variation : indiquez au moins une valeur finale V1 possible.');

  return `/* Q${X} Taux de variation - coefficient multiplicateur - indice (tirage natif Maxima) */
q${X}_tva_v0list: [${v0Raw.join(',')}]$
q${X}_tva_v0: rand(q${X}_tva_v0list)$
q${X}_tva_v1list: [${v1Raw.join(',')}]$
q${X}_tva_v1: rand(q${X}_tva_v1list)$
q${X}_tva_tans: (q${X}_tva_v1-q${X}_tva_v0)/q${X}_tva_v0*100$
q${X}_tva_errindice: q${X}_tva_v1/q${X}_tva_v0*100$
q${X}_tva_errsign: (q${X}_tva_v0-q${X}_tva_v1)/q${X}_tva_v0*100$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _tvaVars: _tvaVars };
}
