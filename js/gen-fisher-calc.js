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

// ── GÉNÉRATEUR "Relation de Fisher (croissance nominale vs réelle)" (Économie) — helper Maxima pur ──
// Gabarit suivi : js/gen-bilanpuissance-calc.js. Étant donné un taux de
// croissance réelle gr (%) et un taux d'inflation π (%), on demande le taux
// de croissance nominale gn (%), calculé via la relation multiplicative
// exacte (et non l'approximation additive) : (100+gn)/100 = (100+gr)/100 *
// (100+π)/100, soit gn = (100+gr)*(100+π)/100 - 100.
// Pièges classiques diagnostiqués :
//  - utiliser l'approximation additive gn ≈ gr+π, qui néglige le terme
//    croisé gr*π/100 ;
//  - oublier de soustraire 100 à la fin (confondre le taux de croissance
//    avec l'indice) : (100+gr)*(100+π)/100.
// Les listes par défaut ne contiennent que des valeurs strictement
// positives (jamais 0), afin que les trois expressions ne coïncident
// jamais entre elles par accident.
function _fisVars(X, p, deps) {
  deps = deps || {};
  var g = p.grandeurs || {};
  var grRaw = (g.grList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var piRaw = (g.piList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (grRaw.length < 1) throw new Error('Relation de Fisher : indiquez au moins un taux de croissance réelle gr possible (%).');
  if (piRaw.length < 1) throw new Error('Relation de Fisher : indiquez au moins un taux d\'inflation π possible (%).');

  return `/* Q${X} Relation de Fisher - croissance nominale vs reelle (tirage natif Maxima) */
q${X}_fis_grlist: [${grRaw.join(',')}]$
q${X}_fis_gr: rand(q${X}_fis_grlist)$
q${X}_fis_pilist: [${piRaw.join(',')}]$
q${X}_fis_pi: rand(q${X}_fis_pilist)$
q${X}_fis_tans: (100+q${X}_fis_gr)*(100+q${X}_fis_pi)/100-100$
q${X}_fis_errsum: q${X}_fis_gr+q${X}_fis_pi$
q${X}_fis_errindice: (100+q${X}_fis_gr)*(100+q${X}_fis_pi)/100$`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _fisVars: _fisVars };
}
