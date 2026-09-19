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

// ── GÉNÉRATEUR "Élasticité-prix de la demande" (Économie) — helper Maxima pur ──
// Gabarit suivi : js/gen-bilanpuissance-calc.js. Un prix passe de P0 à P1 et
// la quantité demandée de Q0 à Q1 ; on demande l'élasticité-prix de la
// demande e = (ΔQ/Q0) / (ΔP/P0).
// Pièges classiques diagnostiqués :
//  - inverser le rapport (élasticité-prix de l'offre par rapport à la
//    demande, ou confusion numérateur/dénominateur) : (ΔP/P0) / (ΔQ/Q0) ;
//  - utiliser les variations absolues au lieu des variations relatives
//    (oubli de diviser par les valeurs initiales) : ΔQ/ΔP.
// Les listes par défaut de prix et de quantités sont disjointes entre
// valeur initiale et valeur finale, pour ne jamais tirer une variation
// nulle (division par zéro) ni faire coïncider deux formules par accident.
function _elaVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var p0Raw = (g.p0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var p1Raw = (g.p1List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var q0Raw = (g.q0List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var q1Raw = (g.q1List || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (p0Raw.length < 1) throw new Error('Élasticité-prix : indiquez au moins un prix initial P0 possible.');
  if (p1Raw.length < 1) throw new Error('Élasticité-prix : indiquez au moins un prix final P1 possible.');
  if (q0Raw.length < 1) throw new Error('Élasticité-prix : indiquez au moins une quantité initiale Q0 possible.');
  if (q1Raw.length < 1) throw new Error('Élasticité-prix : indiquez au moins une quantité finale Q1 possible.');

  return `/* Q${X} Elasticite-prix de la demande (tirage natif Maxima) */
q${X}_ela_p0list: [${p0Raw.join(',')}]$
q${X}_ela_p0: rand(q${X}_ela_p0list)$
q${X}_ela_p1list: [${p1Raw.join(',')}]$
q${X}_ela_p1: rand(q${X}_ela_p1list)$
q${X}_ela_q0list: [${q0Raw.join(',')}]$
q${X}_ela_q0: rand(q${X}_ela_q0list)$
q${X}_ela_q1list: [${q1Raw.join(',')}]$
q${X}_ela_q1: rand(q${X}_ela_q1list)$
q${X}_ela_tans: ((q${X}_ela_q1-q${X}_ela_q0)/q${X}_ela_q0)/((q${X}_ela_p1-q${X}_ela_p0)/q${X}_ela_p0)$
q${X}_ela_errinv: ((q${X}_ela_p1-q${X}_ela_p0)/q${X}_ela_p0)/((q${X}_ela_q1-q${X}_ela_q0)/q${X}_ela_q0)$
q${X}_ela_errabs: (q${X}_ela_q1-q${X}_ela_q0)/(q${X}_ela_p1-q${X}_ela_p0)$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _elaVars: _elaVars };
}
